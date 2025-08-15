// src/app/lib/pve/ai.ts - Enhanced AI with Bench Promotion and Battle Rules
import {
  BattleState,
  BattleAction,
  BattleContext,
  CardRef,
  BattleCardInstance,
  getCardInstance,
  getActiveCard,
  getBenchCards,
  getHandCards,
  canCardAttack,
  findEmptyBenchPosition,
  needsBenchPromotion,
  getPromotablePokemon,
  hasLostDueToNoPokemon,
  canPlaceActiveFromHand,
  canPlaceBenchFromHand,
} from './state';
import { applyAction } from './engine';

// ================================
// AI DECISION MAKING
// ================================

export async function aiTurn(
  state: BattleState,
  context: BattleContext
): Promise<BattleState> {
  if (state.phase !== 'AI_TURN' && state.phase !== 'PREPARATION') {
    console.warn('AI called on wrong phase:', state.phase);
    return state;
  }

  let s = { ...state };

  // Check if AI has lost due to no Pokemon
  if (hasLostDueToNoPokemon(s, 'AI')) {
    console.log('🤖 AI has no Pokemon left - conceding');
    return applyConcede(s);
  }

  // PRIORITY 1: Handle bench promotion if needed
  if (needsBenchPromotion(s, 'AI')) {
    console.log('🤖 AI needs to promote from bench to active');
    s = await handleBenchPromotion(s, context);
    if (!s.active.ai) {
      // Still no active after promotion attempt - shouldn't happen if logic is correct
      console.error('🤖 AI failed to promote from bench');
      return applyConcede(s);
    }
  }

  // Prep phase: place active Pokemon only
  if (s.phase === 'PREPARATION') {
    return handlePreparationPhase(s, context);
  }

  console.log('🤖 AI Turn', s.turn);

  // Reset turn flags
  s.flags = {
    ...(s.flags || {}),
    hasAttackedThisTurn: false,
    hasAttachedEnergyThisTurn: false,
  };

  // PRIORITY 2: Ensure we have an active Pokemon (should be handled by promotion above)
  if (!s.active.ai) {
    console.error(
      "🤖 AI has no active Pokemon during battle turn - this shouldn't happen"
    );
    return applyConcede(s);
  }

  // PRIORITY 3: Strategic decision - Check if we can attack immediately
  const canAttackNow = canAttackWithCurrentEnergy(s, context);

  if (canAttackNow && !s.flags?.hasAttackedThisTurn) {
    console.log('🤖 AI can attack immediately!');
    const attacked = await tryAttack(s, context);
    if (attacked) {
      s = attacked;

      // Still try to attach energy after attacking if we haven't
      if (!s.flags?.hasAttachedEnergyThisTurn) {
        s = attachEnergyStrategically(s, context);
      }

      const endTurn: BattleAction = { type: 'END_TURN', side: 'AI' };
      return (await applyAction(s, endTurn, context)) || s;
    }
  }

  // PRIORITY 4: Attach energy strategically
  if (!s.flags?.hasAttachedEnergyThisTurn) {
    s = attachEnergyStrategically(s, context);
  }

  // PRIORITY 5: Check if energy attachment unlocked an attack
  if (!s.flags?.hasAttackedThisTurn) {
    const attacked = await tryAttack(s, context);
    if (attacked) {
      s = attacked;
    }
  }

  // PRIORITY 6: Fill bench opportunistically (only during battle phase)
  if (s.phase !== 'PREPARATION') {
    s = placeBenchPokemon(s, context);
  }

  // PRIORITY 7: End turn
  const endTurnAction: BattleAction = { type: 'END_TURN', side: 'AI' };
  const finalState = await applyAction(s, endTurnAction, context);
  return finalState || s;
}

// ================================
// NEW BENCH PROMOTION LOGIC
// ================================

async function handleBenchPromotion(
  state: BattleState,
  context: BattleContext
): Promise<BattleState> {
  const promotable = getPromotablePokemon(state, 'AI');

  if (promotable.length === 0) {
    console.log('🤖 AI has no Pokemon on bench to promote');
    return state;
  }

  // Fill in card instances for decision making
  const promotableWithInstances = promotable
    .map((item) => ({
      ...item,
      cardInstance: getCardInstance(item.card.iid, context)!,
    }))
    .filter((item) => item.cardInstance);

  if (promotableWithInstances.length === 0) {
    console.error('🤖 AI has promotable cards but no instances found');
    return state;
  }

  // AI Strategy: Promote the strongest Pokemon (highest HP + energy combination)
  const bestPromotion = promotableWithInstances.reduce((best, current) => {
    const bestScore = calculatePromotionScore(best.cardInstance, state);
    const currentScore = calculatePromotionScore(current.cardInstance, state);
    return currentScore > bestScore ? current : best;
  });

  console.log(
    `🤖 AI promoting ${bestPromotion.cardInstance.cardData.name} from bench position ${bestPromotion.position}`
  );

  const promoteAction: BattleAction = {
    type: 'PROMOTE_FROM_BENCH',
    cardIid: bestPromotion.card.iid,
    side: 'AI',
    benchPosition: bestPromotion.position,
  };

  const newState = applyAction(state, promoteAction, context);
  return newState || state;
}

function calculatePromotionScore(
  pokemon: BattleCardInstance,
  state: BattleState
): number {
  let score = 0;

  // Base score from current HP
  score += pokemon.hp;

  // Bonus for energy attached
  const energyCount = state.energies[pokemon.iid] || 0;
  score += energyCount * 10;

  // Bonus for having usable attacks
  for (let i = 0; i < pokemon.cardData.attacks.length; i++) {
    if (canCardAttack(pokemon, i)) {
      score += 25; // Big bonus for ready attacks
    }
  }

  // Bonus for high-damage attacks that are close to being ready
  for (const attack of pokemon.cardData.attacks) {
    const energyRequired = attack.cost.length;
    const energyNeeded = energyRequired - energyCount;
    if (energyNeeded === 1) {
      score += attack.damage * 0.5; // Bonus for attacks that need just 1 more energy
    }
  }

  return score;
}

// ================================
// ENHANCED AI STRATEGY FUNCTIONS
// ================================

/**
 * Check if AI can attack with current energy levels
 */
function canAttackWithCurrentEnergy(
  state: BattleState,
  context: BattleContext
): boolean {
  const activeCard = getActiveCard(state, 'AI', context);
  if (!activeCard || !state.canAttackThisTurn) return false;

  // Check if any attack is usable with current energy
  for (let i = 0; i < activeCard.cardData.attacks.length; i++) {
    if (canCardAttack(activeCard, i)) {
      return true;
    }
  }
  return false;
}

/**
 * Try to attack with the best available attack
 */
async function tryAttack(
  state: BattleState,
  context: BattleContext
): Promise<BattleState | null> {
  const attackAction = findBestAttack(state, context);
  if (attackAction) {
    console.log('🤖 AI attacking:', attackAction);
    const newState = applyAction(state, attackAction, context);
    if (newState) {
      newState.flags = newState.flags || {};
      newState.flags.hasAttackedThisTurn = true;
      return newState;
    }
  }
  return null;
}

/**
 * Enhanced energy attachment strategy
 */
function attachEnergyStrategically(
  state: BattleState,
  context: BattleContext
): BattleState {
  // Skip if already attached energy this turn
  if (state.flags?.hasAttachedEnergyThisTurn) {
    console.log('🤖 AI already attached energy this turn');
    return state;
  }

  const target = findBestEnergyTarget(state, context);
  if (!target) {
    console.log('🤖 AI: No good energy target found');
    return state;
  }

  // Choose energy type that matches the Pokemon's type
  const energyType = target.cardData.type.toUpperCase();

  const attachAction: BattleAction = {
    type: 'ATTACH_ENERGY',
    cardIid: target.iid,
    energyType: energyType,
    side: 'AI',
  };

  console.log(`🤖 AI attaching ${energyType} energy to:`, target.cardData.name);
  const newState = applyAction(state, attachAction, context);

  if (newState) {
    newState.flags = newState.flags || {};
    newState.flags.hasAttachedEnergyThisTurn = true;
    return newState;
  }

  return state;
}

/**
 * Enhanced energy target selection
 */
function findBestEnergyTarget(
  state: BattleState,
  context: BattleContext
): BattleCardInstance | null {
  const activeCard = getActiveCard(state, 'AI', context);
  const benchCards = getBenchCards(state, 'AI', context).filter(
    (c) => c !== null
  ) as BattleCardInstance[];

  const allCards = [activeCard, ...benchCards].filter(
    (c) => c !== null
  ) as BattleCardInstance[];

  if (allCards.length === 0) return null;

  // Priority 1: Active Pokemon that is 1 energy away from an attack
  if (activeCard && isOneEnergyAwayFromAttack(activeCard)) {
    console.log('🤖 Priority: Active Pokemon needs 1 more energy for attack');
    return activeCard;
  }

  // Priority 2: Active Pokemon with no energy yet
  if (activeCard && activeCard.energiesAttached === 0) {
    console.log('🤖 Priority: Powering up active Pokemon');
    return activeCard;
  }

  // Priority 3: Bench Pokemon that could be promoted soon
  const benchTarget = benchCards.find((card) =>
    isOneEnergyAwayFromAttack(card)
  );
  if (benchTarget) {
    console.log('🤖 Priority: Bench Pokemon close to attack readiness');
    return benchTarget;
  }

  // Priority 4: Active Pokemon (general power up)
  if (activeCard && activeCard.energiesAttached < 3) {
    console.log('🤖 Fallback: Continue powering active Pokemon');
    return activeCard;
  }

  // Priority 5: Any bench Pokemon
  if (benchCards.length > 0 && benchCards[0].energiesAttached < 2) {
    console.log('🤖 Fallback: Power up bench Pokemon');
    return benchCards[0];
  }

  console.log('🤖 No suitable energy target found');
  return null;
}

/**
 * Check if a Pokemon is one energy away from being able to attack
 */
function isOneEnergyAwayFromAttack(pokemon: BattleCardInstance): boolean {
  const currentEnergy = pokemon.energiesAttached;

  for (let i = 0; i < pokemon.cardData.attacks.length; i++) {
    const attack = pokemon.cardData.attacks[i];
    const energyRequired = attack.cost.length;

    // If one more energy would enable this attack
    if (currentEnergy + 1 >= energyRequired && currentEnergy < energyRequired) {
      return true;
    }
  }

  return false;
}

/**
 * Enhanced attack selection
 */
function findBestAttack(
  state: BattleState,
  context: BattleContext
): BattleAction | null {
  const activeCard = getActiveCard(state, 'AI', context);
  const playerActive = getActiveCard(state, 'PLAYER', context);

  if (!activeCard || !playerActive || !state.canAttackThisTurn) {
    return null;
  }

  // Find the best available attack
  let bestAttackIndex = -1;
  let bestValue = 0;

  for (let i = 0; i < activeCard.cardData.attacks.length; i++) {
    if (canCardAttack(activeCard, i)) {
      const attack = activeCard.cardData.attacks[i];
      const damage = calculateAttackDamage(activeCard, playerActive, i);

      // Calculate attack value (damage + bonus for knockout potential)
      let attackValue = damage;

      // Bonus for potential knockout
      if (damage >= playerActive.hp) {
        attackValue += 50; // Big bonus for KO
      }

      // Bonus for high damage
      if (damage >= 30) {
        attackValue += 10;
      }

      if (attackValue > bestValue) {
        bestValue = attackValue;
        bestAttackIndex = i;
      }
    }
  }

  if (bestAttackIndex === -1) {
    console.log('🤖 AI: No usable attacks available');
    return null;
  }

  const attack = activeCard.cardData.attacks[bestAttackIndex];
  console.log(`🤖 AI chosen attack: ${attack.name} (${attack.damage} damage)`);

  return {
    type: 'ATTACK',
    attackerIid: activeCard.iid,
    targetIid: playerActive.iid,
    attackIndex: bestAttackIndex,
    side: 'AI',
  };
}

// ================================
// PREPARATION & BENCH MANAGEMENT
// ================================

function handlePreparationPhase(
  state: BattleState,
  context: BattleContext
): BattleState {
  // Only place active if we don't have one and we can place from hand
  if (!state.active.ai && canPlaceActiveFromHand(state)) {
    const newState = placeActiveFromHand(state, context);
    return newState;
  }
  return state;
}

function placeActiveFromHand(
  state: BattleState,
  context: BattleContext
): BattleState {
  const handCards = getHandCards(state, 'AI', context);

  if (handCards.length === 0) {
    console.warn('🤖 AI has no cards in hand to place as active');
    return state;
  }

  // Choose Pokemon with highest HP as active (simple strategy)
  const bestPokemon = handCards.reduce((best, current) =>
    current.hp > best.hp ? current : best
  );

  const placeAction: BattleAction = {
    type: 'PLACE_ACTIVE',
    cardIid: bestPokemon.iid,
    side: 'AI',
  };

  console.log('🤖 AI placing active:', bestPokemon.cardData.name);
  const newState = applyAction(state, placeAction, context);
  return newState || state;
}

function placeBenchPokemon(
  state: BattleState,
  context: BattleContext
): BattleState {
  const handCards = getHandCards(state, 'AI', context);
  const emptyPosition = findEmptyBenchPosition(state, 'AI');

  if (handCards.length === 0 || emptyPosition === null) {
    return state;
  }

  // Only place on bench during battle phase if we have room and it's strategic
  if (!canPlaceBenchFromHand(state)) {
    return state;
  }

  // Place the strongest available Pokemon on bench
  const bestPokemon = handCards.reduce((best, current) =>
    current.hp > best.hp ? current : best
  );

  const placeAction: BattleAction = {
    type: 'PLACE_BENCH',
    cardIid: bestPokemon.iid,
    side: 'AI',
    position: emptyPosition,
  };

  console.log('🤖 AI placing on bench:', bestPokemon.cardData.name);
  const newState = applyAction(state, placeAction, context);
  return newState || state;
}

function calculateAttackDamage(
  attacker: BattleCardInstance,
  target: BattleCardInstance,
  attackIndex: number
): number {
  const attack = attacker.cardData.attacks[attackIndex];
  if (!attack) return 0;

  let damage = attack.damage;

  // Check weakness (double damage)
  const weakness = target.cardData.weaknesses.find(
    (w) => w.type.toLowerCase() === attacker.cardData.type.toLowerCase()
  );
  if (weakness) {
    damage *= 2;
  }

  // Check resistance (reduce damage)
  const resistance = target.cardData.resistances.find(
    (r) => r.type.toLowerCase() === attacker.cardData.type.toLowerCase()
  );
  if (resistance) {
    const reduction = parseInt(resistance.value) || 20;
    damage = Math.max(0, damage - reduction);
  }

  return damage;
}

function applyConcede(state: BattleState): BattleState {
  const newState = { ...state };
  newState.phase = 'ENDED';
  newState.winner = 'PLAYER';
  console.log('🤖 AI concedes - no valid moves available');
  return newState;
}

// ================================
// AI DIFFICULTY SCALING
// ================================

export function getAIStrategy(difficulty: 'EASY' | 'MEDIUM' | 'HARD') {
  return {
    energyPriority: difficulty === 'EASY' ? 'random' : 'optimal',
    attackPriority: difficulty === 'HARD' ? 'damage' : 'first_available',
    benchPriority: difficulty === 'HARD' ? 'strategic' : 'simple',
    energyEfficiency: difficulty === 'HARD' ? 'high' : 'medium',
    promotionStrategy: difficulty === 'HARD' ? 'optimal' : 'simple',
  };
}

export function logAIDecision(action: BattleAction, reasoning: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🤖 AI Decision: ${action.type} - ${reasoning}`);
  }
}
