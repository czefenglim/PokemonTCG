// src/app/lib/pve/engine.ts
// Strict element-matching energy for ATTACK & RETREAT + typed energy storage

import {
  BattleState,
  BattleAction,
  BattleContext,
  Side,
  CardRef,
  BattleCardInstance,
  getCardInstance,
  getActiveCard,
  getBenchCards,
  canCardAttack,
  calculateDamage,
  findEmptyBenchPosition,
  isPreparationComplete,
  getNextPhase,
  isBattleEnded,
  getBattleWinner,
  getRetreatCost,
  countSameElementEnergy,
} from './state';

// ================================
// BATTLE ENGINE CORE
// ================================

export function applyAction(
  state: BattleState,
  action: BattleAction,
  context: BattleContext
): BattleState | null {
  if (!isActionValid(state, action, context)) {
    console.warn('Invalid action attempted:', action);
    return null;
  }

  const newState: BattleState = {
    ...state,
    hands: { player: [...state.hands.player], ai: [...state.hands.ai] },
    bench: { player: [...state.bench.player], ai: [...state.bench.ai] },
    decks: { player: [...state.decks.player], ai: [...state.decks.ai] },
    discards: {
      player: [...state.discards.player],
      ai: [...state.discards.ai],
    },
    energies: { ...state.energies },
    energyTypes: { ...(state.energyTypes || {}) }, // ✅ typed energies (guard)
    hpByIid: { ...state.hpByIid },
    flags: { ...state.flags },
  };

  switch (action.type) {
    case 'PLACE_ACTIVE':
      return applyPlaceActive(newState, action, context);
    case 'PLACE_BENCH':
      return applyPlaceBench(newState, action, context);
    case 'ATTACH_ENERGY':
      return applyAttachEnergy(newState, action, context);
    case 'ATTACK':
      return applyAttack(newState, action, context);
    case 'END_TURN':
      return applyEndTurn(newState, action, context);
    case 'PROMOTE_FROM_BENCH':
      return applyPromoteFromBench(newState, action, context);
    case 'RETREAT':
      return applyRetreat(newState, action, context);
    case 'CONCEDE':
      return applyConcede(newState, action);
    default:
      console.warn('Unknown action type:', action);
      return null;
  }
}

// ================================
// VALIDATION SWITCH
// ================================

function isActionValid(
  state: BattleState,
  action: BattleAction,
  context: BattleContext
): boolean {
  if (isBattleEnded(state)) return false;

  if (state.phase !== 'PREPARATION') {
    const currentSide = state.phase === 'PLAYER_TURN' ? 'PLAYER' : 'AI';
    if ((action as any).side && (action as any).side !== currentSide)
      return false;
  }

  switch (action.type) {
    case 'PLACE_ACTIVE':
      return validatePlaceActive(state, action, context);
    case 'PLACE_BENCH':
      return validatePlaceBench(state, action, context);
    case 'ATTACH_ENERGY':
      return validateAttachEnergy(state, action, context);
    case 'ATTACK':
      return validateAttack(state, action, context);
    case 'END_TURN':
      return validateEndTurn(state, action);
    case 'PROMOTE_FROM_BENCH':
      return validatePromoteFromBench(state, action, context);
    case 'RETREAT':
      return validateRetreat(state, action, context);
    case 'CONCEDE':
      return true;
    default:
      return false;
  }
}

// ================================
// ACTION PROCESSORS
// ================================

function applyPlaceActive(
  state: BattleState,
  action: { type: 'PLACE_ACTIVE'; cardIid: string; side: Side },
  context: BattleContext
): BattleState {
  const newState = { ...state };

  const hand =
    action.side === 'PLAYER' ? newState.hands.player : newState.hands.ai;
  const cardIndex = hand.findIndex((c) => c.iid === action.cardIid);
  const cardRef = hand[cardIndex];

  hand.splice(cardIndex, 1);
  resetHpToFull(newState, cardRef.iid, context);

  if (action.side === 'PLAYER') newState.active.player = cardRef;
  else newState.active.ai = cardRef;

  if (newState.phase === 'PREPARATION' && isPreparationComplete(newState)) {
    newState.phase = getNextPhase(newState);
  }

  return newState;
}

function applyPlaceBench(
  state: BattleState,
  action: {
    type: 'PLACE_BENCH';
    cardIid: string;
    side: Side;
    position: number;
  },
  context: BattleContext
): BattleState {
  const newState = { ...state };

  const hand =
    action.side === 'PLAYER' ? newState.hands.player : newState.hands.ai;
  const bench =
    action.side === 'PLAYER' ? newState.bench.player : newState.bench.ai;

  const cardIndex = hand.findIndex((c) => c.iid === action.cardIid);
  const cardRef = hand[cardIndex];

  hand.splice(cardIndex, 1);
  resetHpToFull(newState, cardRef.iid, context);
  bench[action.position] = cardRef;

  return newState;
}

function applyPromoteFromBench(
  state: BattleState,
  action: {
    type: 'PROMOTE_FROM_BENCH';
    cardIid: string;
    side: Side;
    benchPosition: number;
  },
  context: BattleContext
): BattleState {
  const newState = { ...state };

  const bench =
    action.side === 'PLAYER' ? newState.bench.player : newState.bench.ai;
  const cardRef = bench[action.benchPosition];
  if (!cardRef || cardRef.iid !== action.cardIid) return state;

  bench[action.benchPosition] = null;
  if (action.side === 'PLAYER') newState.active.player = cardRef;
  else newState.active.ai = cardRef;

  if (newState.flags?.needsBenchPromotion?.side === action.side) {
    delete newState.flags.needsBenchPromotion;
  }

  return newState;
}

function applyAttachEnergy(
  state: BattleState,
  action: {
    type: 'ATTACH_ENERGY';
    cardIid: string;
    energyType: string; // expected uppercase (FIRE, WATER...)
    side: Side;
  },
  context: BattleContext
): BattleState {
  const newState = { ...state };

  const t = String(action.energyType || '').toUpperCase();

  // numeric count
  newState.energies[action.cardIid] =
    (newState.energies[action.cardIid] || 0) + 1;

  // ✅ typed list (guard map)
  if (!newState.energyTypes) newState.energyTypes = {};
  if (!newState.energyTypes[action.cardIid])
    newState.energyTypes[action.cardIid] = [];
  newState.energyTypes[action.cardIid] = [
    ...newState.energyTypes[action.cardIid],
    t,
  ];

  // ✅ update instance mirrors (GUARD undefined -> [])
  const inst = context.cardInstances.get(action.cardIid);
  if (inst) {
    inst.energiesAttached = (inst.energiesAttached || 0) + 1;
    const prev = Array.isArray(inst.energyTypesAttached)
      ? inst.energyTypesAttached
      : [];
    inst.energyTypesAttached = [...prev, t];
  }

  // one-per-turn rule flag (for player)
  newState.flags = newState.flags || {};
  newState.flags.hasAttachedEnergyThisTurn = true;

  return newState;
}

function applyAttack(
  state: BattleState,
  action: {
    type: 'ATTACK';
    attackerIid: string;
    targetIid: string;
    attackIndex: number;
    side: Side;
  },
  context: BattleContext
): BattleState {
  const newState = { ...state };

  const attacker = context.cardInstances.get(action.attackerIid);
  const target = context.cardInstances.get(action.targetIid);
  if (!attacker || !target) return newState;

  const dmg = calculateDamage(attacker, target, action.attackIndex);

  const currentHp = newState.hpByIid[action.targetIid] ?? target.hp;
  const nextHp = Math.max(0, currentHp - dmg);
  newState.hpByIid[action.targetIid] = nextHp;
  target.hp = nextHp;

  if (nextHp <= 0) {
    const targetSide = action.side === 'PLAYER' ? 'AI' : 'PLAYER';
    const koResult = handleKnockout(
      newState,
      action.targetIid,
      targetSide,
      context
    );

    if (action.side === 'PLAYER') newState.prizes.aiDefeated++;
    else newState.prizes.playerDefeated++;

    if (koResult.gameEnded) {
      newState.phase = 'ENDED';
      newState.winner = koResult.winner;
      return newState;
    }

    if (koResult.needsPromotion) {
      newState.flags = newState.flags || {};
      newState.flags.needsBenchPromotion = { side: targetSide, forced: true };
    }

    if (newState.prizes.playerDefeated >= 2) {
      newState.phase = 'ENDED';
      newState.winner = 'AI';
    } else if (newState.prizes.aiDefeated >= 2) {
      newState.phase = 'ENDED';
      newState.winner = 'PLAYER';
    }
  }

  newState.canAttackThisTurn = false;
  return newState;
}

function applyEndTurn(
  state: BattleState,
  action: { type: 'END_TURN'; side: Side },
  context: BattleContext
): BattleState {
  const newState = { ...state };
  newState.phase = getNextPhase(newState);
  newState.turn++;
  newState.canAttackThisTurn = true;

  newState.flags = {
    hasAttackedThisTurn: false,
    hasAttachedEnergyThisTurn: false,
    hasRetreatedThisTurn: false,
  };

  const side = newState.phase === 'PLAYER_TURN' ? 'PLAYER' : 'AI';
  drawCard(newState, side);

  return newState;
}

function applyConcede(
  state: BattleState,
  action: { type: 'CONCEDE'; side: Side }
): BattleState {
  const newState = { ...state };
  newState.phase = 'ENDED';
  newState.winner = action.side === 'PLAYER' ? 'AI' : 'PLAYER';
  return newState;
}

// ✅ STRICT: RETREAT requires cost energies that all match Pokémon type
function applyRetreat(
  state: BattleState,
  action: { type: 'RETREAT'; side: Side; benchPosition: number },
  context: BattleContext
): BattleState {
  const newState = { ...state };

  const activeRef =
    action.side === 'PLAYER' ? newState.active.player : newState.active.ai;
  const bench =
    action.side === 'PLAYER' ? newState.bench.player : newState.bench.ai;
  const benchRef = bench[action.benchPosition];

  if (!activeRef || !benchRef) return state;

  const activeInst = context.cardInstances.get(activeRef.iid);
  if (!activeInst) return state;

  const baseHp = activeInst.maxHp;
  const cost = getRetreatCost(baseHp);
  const have = newState.energies[activeRef.iid] || 0;

  // must have enough total energy AND enough matching-type energy
  const sameTyped = countSameElementEnergy(newState, activeInst);
  if (have < cost || sameTyped < cost) {
    return state;
  }

  // pay: remove exactly 'cost' energies that match the Pokémon's type
  const myType = (activeInst.cardData.type || '').toUpperCase();
  const list = [...((newState.energyTypes?.[activeRef.iid] || []) as string[])];

  let removed = 0;
  for (let i = 0; i < list.length && removed < cost; ) {
    if ((list[i] || '').toUpperCase() === myType) {
      list.splice(i, 1);
      removed++;
    } else {
      i++;
    }
  }
  if (removed < cost) return state; // safety

  newState.energyTypes[activeRef.iid] = list;
  newState.energies[activeRef.iid] = Math.max(0, have - cost);

  // mirror instance (guard arrays)
  activeInst.energyTypesAttached = Array.isArray(activeInst.energyTypesAttached)
    ? [...list]
    : [...list];
  activeInst.energiesAttached = Math.max(
    0,
    (activeInst.energiesAttached || 0) - cost
  );

  // swap
  bench[action.benchPosition] = activeRef;
  if (action.side === 'PLAYER') newState.active.player = benchRef;
  else newState.active.ai = benchRef;

  newState.flags = newState.flags || {};
  newState.flags.hasRetreatedThisTurn = true;

  return newState;
}

// ================================
// VALIDATORS
// ================================

function validatePlaceActive(
  state: BattleState,
  action: { type: 'PLACE_ACTIVE'; cardIid: string; side: Side },
  context: BattleContext
): boolean {
  if (state.phase !== 'PREPARATION') return false;

  const currentActive =
    action.side === 'PLAYER' ? state.active.player : state.active.ai;
  if (currentActive) return false;

  const hand = action.side === 'PLAYER' ? state.hands.player : state.hands.ai;
  return hand.some((c) => c.iid === action.cardIid);
}

function validatePlaceBench(
  state: BattleState,
  action: {
    type: 'PLACE_BENCH';
    cardIid: string;
    side: Side;
    position: number;
  },
  context: BattleContext
): boolean {
  if (action.position < 0 || action.position > 2) return false;
  const bench = action.side === 'PLAYER' ? state.bench.player : state.bench.ai;
  if (bench[action.position] !== null) return false;

  const hand = action.side === 'PLAYER' ? state.hands.player : state.hands.ai;
  return hand.some((c) => c.iid === action.cardIid);
}

function validatePromoteFromBench(
  state: BattleState,
  action: {
    type: 'PROMOTE_FROM_BENCH';
    cardIid: string;
    side: Side;
    benchPosition: number;
  },
  context: BattleContext
): boolean {
  if (state.phase === 'PREPARATION') return false;
  const currentActive =
    action.side === 'PLAYER' ? state.active.player : state.active.ai;
  if (currentActive) return false;

  const bench = action.side === 'PLAYER' ? state.bench.player : state.bench.ai;
  const benchCard = bench[action.benchPosition];

  return benchCard !== null && benchCard.iid === action.cardIid;
}

function validateAttachEnergy(
  state: BattleState,
  action: {
    type: 'ATTACH_ENERGY';
    cardIid: string;
    energyType: string;
    side: Side;
  },
  context: BattleContext
): boolean {
  if (state.phase === 'PREPARATION') return false;

  if (action.side === 'PLAYER' && state.flags?.hasAttachedEnergyThisTurn) {
    return false;
  }

  const cardInstance = context.cardInstances.get(action.cardIid);
  if (!cardInstance) return false;

  const active =
    action.side === 'PLAYER' ? state.active.player : state.active.ai;
  const bench = action.side === 'PLAYER' ? state.bench.player : state.bench.ai;

  const isActive = active?.iid === action.cardIid;
  const isOnBench = bench.some((card) => card?.iid === action.cardIid);

  if (!isActive && !isOnBench) return false;

  const currentEnergy = state.energies[action.cardIid] || 0;
  if (currentEnergy >= 10) return false;

  return true;
}

function validateAttack(
  state: BattleState,
  action: {
    type: 'ATTACK';
    attackerIid: string;
    targetIid: string;
    attackIndex: number;
    side: Side;
  },
  context: BattleContext
): boolean {
  if (state.phase === 'PREPARATION') return false;
  if (!state.canAttackThisTurn) return false;

  const active =
    action.side === 'PLAYER' ? state.active.player : state.active.ai;
  if (!active || active.iid !== action.attackerIid) return false;

  const opponentActive =
    action.side === 'PLAYER' ? state.active.ai : state.active.player;
  if (!opponentActive || opponentActive.iid !== action.targetIid) return false;

  const attacker = context.cardInstances.get(action.attackerIid);
  if (!attacker) return false;

  // ✅ STRICT: quantity + all-matching-type requirement
  return canCardAttack(attacker, action.attackIndex, state);
}

function validateEndTurn(
  state: BattleState,
  action: { type: 'END_TURN'; side: Side }
): boolean {
  if (state.phase === 'PREPARATION') return false;
  const currentSide = state.phase === 'PLAYER_TURN' ? 'PLAYER' : 'AI';
  return action.side === currentSide;
}

function validateRetreat(
  state: BattleState,
  action: { type: 'RETREAT'; side: Side; benchPosition: number },
  context: BattleContext
): boolean {
  if (state.phase === 'PREPARATION') return false;
  if (action.side === 'PLAYER' && state.flags?.hasRetreatedThisTurn)
    return false;

  const activeRef =
    action.side === 'PLAYER' ? state.active.player : state.active.ai;
  const bench = action.side === 'PLAYER' ? state.bench.player : state.bench.ai;
  if (!activeRef) return false;
  if (action.benchPosition < 0 || action.benchPosition > 2) return false;
  if (!bench[action.benchPosition]) return false;

  const inst = context.cardInstances.get(activeRef.iid);
  if (!inst) return false;

  const baseHp = inst.maxHp;
  const cost = getRetreatCost(baseHp);
  const have = state.energies[activeRef.iid] || 0;
  if (have < cost) return false;

  // ✅ must have at least 'cost' energies of the Pokémon's own element
  if (countSameElementEnergy(state, inst) < cost) return false;

  return true;
}

// ================================
// KNOCKOUT & HELPERS
// ================================

interface KnockoutResult {
  gameEnded: boolean;
  winner?: Side;
  needsPromotion: boolean;
}

function handleKnockout(
  state: BattleState,
  cardIid: string,
  side: Side,
  context: BattleContext
): KnockoutResult {
  const result: KnockoutResult = {
    gameEnded: false,
    needsPromotion: false,
  };

  const activeSlot = side === 'PLAYER' ? state.active.player : state.active.ai;
  const isActiveKO = activeSlot?.iid === cardIid;

  moveCardToDiscard(state, cardIid, side, context);

  if (isActiveKO) {
    const bench = side === 'PLAYER' ? state.bench.player : state.bench.ai;
    const availableBenchPokemon = bench.filter((card) => card !== null);

    if (availableBenchPokemon.length === 0) {
      result.gameEnded = true;
      result.winner = side === 'PLAYER' ? 'AI' : 'PLAYER';
    } else {
      result.needsPromotion = true;
    }
  }

  return result;
}

function resetHpToFull(
  state: BattleState,
  iid: string,
  context: BattleContext
) {
  const inst = context.cardInstances.get(iid);
  if (!inst) return;
  const full = inst.maxHp;

  state.hpByIid[iid] = full;
  inst.hp = full;
}

function moveCardToDiscard(
  state: BattleState,
  cardIid: string,
  side: Side,
  context: BattleContext
): void {
  if (side === 'PLAYER' && state.active.player?.iid === cardIid) {
    const ref = state.active.player;
    state.active.player = undefined;
    state.discards.player.push(ref);
  } else if (side === 'AI' && state.active.ai?.iid === cardIid) {
    const ref = state.active.ai;
    state.active.ai = undefined;
    state.discards.ai.push(ref);
  } else {
    const bench = side === 'PLAYER' ? state.bench.player : state.bench.ai;
    const discards =
      side === 'PLAYER' ? state.discards.player : state.discards.ai;
    for (let i = 0; i < bench.length; i++) {
      if (bench[i]?.iid === cardIid) {
        const ref = bench[i]!;
        bench[i] = null;
        discards.push(ref);
        break;
      }
    }
  }

  // Clear HP & energies for that card
  state.hpByIid[cardIid] = 0;
  delete state.energies[cardIid];
  delete state.energyTypes?.[cardIid];

  const inst = context.cardInstances.get(cardIid);
  if (inst) {
    inst.hp = 0;
    inst.energiesAttached = 0;
    inst.energyTypesAttached = [];
  }
}

function drawCard(state: BattleState, side: Side): void {
  const deck = side === 'PLAYER' ? state.decks.player : state.decks.ai;
  const hand = side === 'PLAYER' ? state.hands.player : state.hands.ai;
  if (deck.length > 0) {
    const drawn = deck.shift()!;
    hand.push(drawn);
  }
}

// ================================
// BENCH PROMOTION UTILITIES
// ================================

export function getAvailableBenchPokemon(
  state: BattleState,
  side: Side
): Array<{ card: CardRef; position: number }> {
  const bench = side === 'PLAYER' ? state.bench.player : state.bench.ai;
  const available: Array<{ card: CardRef; position: number }> = [];

  bench.forEach((card, position) => {
    if (card !== null) {
      available.push({ card, position });
    }
  });

  return available;
}

// ================================
// BATTLE SETUP
// ================================

export function initializeBattle(
  playerDeckIds: string[],
  aiDeckIds: string[],
  context: BattleContext
): BattleState {
  const shuffledPlayerDeck = [...playerDeckIds].sort(() => Math.random() - 0.5);
  const shuffledAiDeck = [...aiDeckIds].sort(() => Math.random() - 0.5);

  const state: BattleState = {
    rngSeed: Math.random().toString(36),
    phase: 'PREPARATION',
    turn: 1,
    firstPlayer: Math.random() < 0.5 ? 'PLAYER' : 'AI',

    active: {},
    bench: { player: [null, null, null], ai: [null, null, null] },
    hands: { player: [], ai: [] },
    decks: { player: [], ai: [] },
    discards: { player: [], ai: [] },

    prizes: { playerDefeated: 0, aiDefeated: 0 },
    hpByIid: {},
    energies: {},
    canAttackThisTurn: true,
    legalMoves: [],
    flags: {
      hasAttackedThisTurn: false,
      hasAttachedEnergyThisTurn: false,
      hasRetreatedThisTurn: false,
    },
  };

  for (const [index, cardId] of shuffledPlayerDeck.entries()) {
    const ref: CardRef = { id: cardId, iid: `player_${index}` };
    if (index < 5) state.hands.player.push(ref);
    else state.decks.player.push(ref);

    const cd = context.cardDataCache.get(cardId);
    if (cd) {
      context.cardInstances.set(ref.iid, {
        iid: ref.iid,
        cardData: cd,
        hp: cd.hp,
        maxHp: cd.hp,
        energiesAttached: 0,
        statusEffects: [],
        energyTypesAttached: [],
      });
      state.hpByIid[ref.iid] = cd.hp;
    }
  }

  for (const [index, cardId] of shuffledAiDeck.entries()) {
    const ref: CardRef = { id: cardId, iid: `ai_${index}` };
    if (index < 5) state.hands.ai.push(ref);
    else state.decks.ai.push(ref);

    const cd = context.cardDataCache.get(cardId);
    if (cd) {
      context.cardInstances.set(ref.iid, {
        iid: ref.iid,
        cardData: cd,
        hp: cd.hp,
        maxHp: cd.hp,
        energiesAttached: 0,
        statusEffects: [],
        energyTypesAttached: [],
      });
      state.hpByIid[ref.iid] = cd.hp;
    }
  }

  return state;
}

// // src/app/lib/pve/engine.ts - Updated with Bench Promotion, New Battle Rules, and Retreat-by-BaseHP
// import {
//   BattleState,
//   BattleAction,
//   BattleContext,
//   Side,
//   CardRef,
//   BattleCardInstance,
//   getCardInstance,
//   getActiveCard,
//   getBenchCards,
//   canCardAttack,
//   calculateDamage,
//   findEmptyBenchPosition,
//   isPreparationComplete,
//   getNextPhase,
//   isBattleEnded,
//   getBattleWinner,
//   getRetreatCost, // ✅ use base/max HP cost
// } from "./state";

// // ================================
// // BATTLE ENGINE CORE
// // ================================

// export function applyAction(
//   state: BattleState,
//   action: BattleAction,
//   context: BattleContext
// ): BattleState | null {
//   if (!isActionValid(state, action, context)) {
//     console.warn("Invalid action attempted:", action);
//     return null;
//   }

//   const newState: BattleState = {
//     ...state,
//     hands: { player: [...state.hands.player], ai: [...state.hands.ai] },
//     bench: { player: [...state.bench.player], ai: [...state.bench.ai] },
//     decks: { player: [...state.decks.player], ai: [...state.decks.ai] },
//     discards: {
//       player: [...state.discards.player],
//       ai: [...state.discards.ai],
//     },
//     energies: { ...state.energies },
//     hpByIid: { ...state.hpByIid },
//     flags: { ...state.flags },
//   };

//   switch (action.type) {
//     case "PLACE_ACTIVE":
//       return applyPlaceActive(newState, action, context);
//     case "PLACE_BENCH":
//       return applyPlaceBench(newState, action, context);
//     case "ATTACH_ENERGY":
//       return applyAttachEnergy(newState, action, context);
//     case "ATTACK":
//       return applyAttack(newState, action, context);
//     case "END_TURN":
//       return applyEndTurn(newState, action, context);
//     case "PROMOTE_FROM_BENCH":
//       return applyPromoteFromBench(newState, action, context);
//     case "RETREAT": // ✅ NEW
//       return applyRetreat(newState, action, context);
//     case "CONCEDE":
//       return applyConcede(newState, action);
//     default:
//       console.warn("Unknown action type:", action);
//       return null;
//   }
// }

// // ================================
// // ACTION VALIDATION
// // ================================

// function isActionValid(
//   state: BattleState,
//   action: BattleAction,
//   context: BattleContext
// ): boolean {
//   if (isBattleEnded(state)) return false;

//   if (state.phase !== "PREPARATION") {
//     const currentSide = state.phase === "PLAYER_TURN" ? "PLAYER" : "AI";
//     if (action.side !== currentSide) return false;
//   }

//   switch (action.type) {
//     case "PLACE_ACTIVE":
//       return validatePlaceActive(state, action, context);
//     case "PLACE_BENCH":
//       return validatePlaceBench(state, action, context);
//     case "ATTACH_ENERGY":
//       return validateAttachEnergy(state, action, context);
//     case "ATTACK":
//       return validateAttack(state, action, context);
//     case "END_TURN":
//       return validateEndTurn(state, action);
//     case "PROMOTE_FROM_BENCH":
//       return validatePromoteFromBench(state, action, context);
//     case "RETREAT": // ✅ NEW
//       return validateRetreat(state, action, context);
//     case "CONCEDE":
//       return true;
//     default:
//       return false;
//   }
// }

// // ================================
// // ACTION PROCESSORS
// // ================================

// function applyPlaceActive(
//   state: BattleState,
//   action: { type: "PLACE_ACTIVE"; cardIid: string; side: Side },
//   context: BattleContext
// ): BattleState {
//   const newState = { ...state };

//   const hand =
//     action.side === "PLAYER" ? newState.hands.player : newState.hands.ai;
//   const cardIndex = hand.findIndex((c) => c.iid === action.cardIid);
//   const cardRef = hand[cardIndex];

//   // Remove from hand
//   hand.splice(cardIndex, 1);

//   // Always reset HP to FULL when a card enters play from HAND
//   resetHpToFull(newState, cardRef.iid, context);

//   // Set as active
//   if (action.side === "PLAYER") newState.active.player = cardRef;
//   else newState.active.ai = cardRef;

//   // Only advance the phase if we're in PREPARATION
//   if (newState.phase === "PREPARATION" && isPreparationComplete(newState)) {
//     newState.phase = getNextPhase(newState);
//   }

//   return newState;
// }

// function applyPlaceBench(
//   state: BattleState,
//   action: {
//     type: "PLACE_BENCH";
//     cardIid: string;
//     side: Side;
//     position: number;
//   },
//   context: BattleContext
// ): BattleState {
//   const newState = { ...state };

//   const hand =
//     action.side === "PLAYER" ? newState.hands.player : newState.hands.ai;
//   const bench =
//     action.side === "PLAYER" ? newState.bench.player : newState.bench.ai;

//   const cardIndex = hand.findIndex((c) => c.iid === action.cardIid);
//   const cardRef = hand[cardIndex];

//   // Remove from hand
//   hand.splice(cardIndex, 1);

//   // Always reset HP to FULL when a card enters play from HAND
//   resetHpToFull(newState, cardRef.iid, context);

//   // Place on bench
//   bench[action.position] = cardRef;

//   return newState;
// }

// function applyPromoteFromBench(
//   state: BattleState,
//   action: {
//     type: "PROMOTE_FROM_BENCH";
//     cardIid: string;
//     side: Side;
//     benchPosition: number;
//   },
//   context: BattleContext
// ): BattleState {
//   const newState = { ...state };

//   const bench =
//     action.side === "PLAYER" ? newState.bench.player : newState.bench.ai;
//   const cardRef = bench[action.benchPosition];

//   if (!cardRef || cardRef.iid !== action.cardIid) {
//     console.warn("Invalid bench promotion:", action);
//     return state;
//   }

//   // Move from bench to active
//   bench[action.benchPosition] = null;
//   if (action.side === "PLAYER") {
//     newState.active.player = cardRef;
//   } else {
//     newState.active.ai = cardRef;
//   }

//   // Clear the promotion flag since we've handled it
//   if (newState.flags?.needsBenchPromotion?.side === action.side) {
//     console.log(`✅ Cleared promotion flag for ${action.side}`);
//     delete newState.flags.needsBenchPromotion;
//   }

//   console.log(`🔄 ${action.side} promoted ${cardRef.iid} from bench to active`);

//   return newState;
// }

// function applyAttachEnergy(
//   state: BattleState,
//   action: {
//     type: "ATTACH_ENERGY";
//     cardIid: string;
//     energyType: string;
//     side: Side;
//   },
//   context: BattleContext
// ): BattleState {
//   const newState = { ...state };

//   // Increment energy count for the card
//   if (!newState.energies[action.cardIid]) newState.energies[action.cardIid] = 0;
//   newState.energies[action.cardIid]++;

//   // Update card instance
//   const inst = context.cardInstances.get(action.cardIid);
//   if (inst) {
//     inst.energiesAttached++;
//   }

//   // Mark that energy was attached this turn (for one-per-turn rule)
//   if (!newState.flags) newState.flags = {};
//   newState.flags.hasAttachedEnergyThisTurn = true;

//   console.log(
//     `⚡ ${action.side} attached ${action.energyType} energy to ${action.cardIid}`
//   );

//   return newState;
// }

// function applyAttack(
//   state: BattleState,
//   action: {
//     type: "ATTACK";
//     attackerIid: string;
//     targetIid: string;
//     attackIndex: number;
//     side: Side;
//   },
//   context: BattleContext
// ): BattleState {
//   const newState = { ...state };

//   const attacker = context.cardInstances.get(action.attackerIid);
//   const target = context.cardInstances.get(action.targetIid);
//   if (!attacker || !target) return newState;

//   const dmg = calculateDamage(attacker, target, action.attackIndex);

//   // Decrement target HP (persist + runtime)
//   const currentHp = newState.hpByIid[action.targetIid] ?? target.hp;
//   const nextHp = Math.max(0, currentHp - dmg);
//   newState.hpByIid[action.targetIid] = nextHp;
//   target.hp = nextHp;

//   console.log(
//     `💥 ${attacker.cardData.name} attacks ${target.cardData.name} for ${dmg} damage`
//   );

//   // Handle KO
//   if (nextHp <= 0) {
//     const targetSide = action.side === "PLAYER" ? "AI" : "PLAYER";
//     const koResult = handleKnockout(
//       newState,
//       action.targetIid,
//       targetSide,
//       context
//     );

//     console.log(`💀 ${target.cardData.name} was knocked out!`);

//     // Update prizes
//     if (action.side === "PLAYER") newState.prizes.aiDefeated++;
//     else newState.prizes.playerDefeated++;

//     // Check if knockout resulted in immediate game end
//     if (koResult.gameEnded) {
//       console.log(`🏁 Game ended due to knockout: ${koResult.winner} wins`);
//       newState.phase = "ENDED";
//       newState.winner = koResult.winner;
//       return newState;
//     }

//     // Check if bench promotion is needed
//     if (koResult.needsPromotion) {
//       console.log(
//         `🔄 ${targetSide} needs to promote a Pokemon from bench to active`
//       );
//       newState.flags = newState.flags || {};
//       newState.flags.needsBenchPromotion = {
//         side: targetSide,
//         forced: true,
//       };
//     }

//     // Check prize win conditions
//     if (newState.prizes.playerDefeated >= 2) {
//       newState.phase = "ENDED";
//       newState.winner = "AI";
//     } else if (newState.prizes.aiDefeated >= 2) {
//       newState.phase = "ENDED";
//       newState.winner = "PLAYER";
//     }
//   }

//   newState.canAttackThisTurn = false;
//   return newState;
// }

// function applyEndTurn(
//   state: BattleState,
//   action: { type: "END_TURN"; side: Side },
//   context: BattleContext
// ): BattleState {
//   const newState = { ...state };
//   newState.phase = getNextPhase(newState);
//   newState.turn++;
//   newState.canAttackThisTurn = true;

//   // Reset turn-based flags (✅ also clear retreat flag)
//   newState.flags = {
//     hasAttackedThisTurn: false,
//     hasAttachedEnergyThisTurn: false,
//     hasRetreatedThisTurn: false, // ✅ NEW
//   };

//   const side = newState.phase === "PLAYER_TURN" ? "PLAYER" : "AI";
//   drawCard(newState, side);

//   console.log(`🔄 Turn ${newState.turn} - ${newState.phase}`);

//   return newState;
// }

// function applyConcede(
//   state: BattleState,
//   action: { type: "CONCEDE"; side: Side }
// ): BattleState {
//   const newState = { ...state };
//   newState.phase = "ENDED";
//   newState.winner = action.side === "PLAYER" ? "AI" : "PLAYER";
//   return newState;
// }

// // ✅ NEW: RETREAT
// function applyRetreat(
//   state: BattleState,
//   action: { type: "RETREAT"; side: Side; benchPosition: number },
//   context: BattleContext
// ): BattleState {
//   const newState = { ...state };

//   // Get references
//   const activeRef =
//     action.side === "PLAYER" ? newState.active.player : newState.active.ai;
//   const bench =
//     action.side === "PLAYER" ? newState.bench.player : newState.bench.ai;

//   const benchRef = bench[action.benchPosition];
//   if (!activeRef || !benchRef) return state;

//   const activeInst = context.cardInstances.get(activeRef.iid);
//   if (!activeInst) return state;

//   // Cost is based on BASE/MAX HP (not current HP)
//   const baseHp = activeInst.maxHp; // original HP
//   const cost = getRetreatCost(baseHp);
//   const have = newState.energies[activeRef.iid] || 0;

//   if (have < cost) {
//     console.warn("RETREAT blocked: not enough energy", { have, cost, baseHp });
//     return state;
//   }

//   // Pay cost (detach energy — decrement count)
//   newState.energies[activeRef.iid] = Math.max(0, have - cost);
//   activeInst.energiesAttached = Math.max(0, activeInst.energiesAttached - cost);

//   // Swap active with chosen bench slot
//   bench[action.benchPosition] = activeRef;
//   if (action.side === "PLAYER") {
//     newState.active.player = benchRef;
//   } else {
//     newState.active.ai = benchRef;
//   }

//   // Mark retreated this turn
//   newState.flags = newState.flags || {};
//   newState.flags.hasRetreatedThisTurn = true;

//   console.log(
//     `🔁 ${action.side} retreated (paid ${cost} based on base HP ${baseHp}) -> switched with bench ${action.benchPosition}`
//   );
//   return newState;
// }

// // ================================
// // ACTION VALIDATORS
// // ================================

// function validatePlaceActive(
//   state: BattleState,
//   action: { type: "PLACE_ACTIVE"; cardIid: string; side: Side },
//   context: BattleContext
// ): boolean {
//   // NEW RULE: Can only place active during PREPARATION phase
//   if (state.phase !== "PREPARATION") {
//     console.log("❌ Cannot place active Pokemon during battle phase");
//     return false;
//   }

//   const currentActive =
//     action.side === "PLAYER" ? state.active.player : state.active.ai;
//   if (currentActive) return false;

//   const hand = action.side === "PLAYER" ? state.hands.player : state.hands.ai;
//   return hand.some((c) => c.iid === action.cardIid);
// }

// function validatePlaceBench(
//   state: BattleState,
//   action: {
//     type: "PLACE_BENCH";
//     cardIid: string;
//     side: Side;
//     position: number;
//   },
//   context: BattleContext
// ): boolean {
//   if (action.position < 0 || action.position > 2) return false;
//   const bench = action.side === "PLAYER" ? state.bench.player : state.bench.ai;
//   if (bench[action.position] !== null) return false;

//   const hand = action.side === "PLAYER" ? state.hands.player : state.hands.ai;
//   return hand.some((c) => c.iid === action.cardIid);
// }

// function validatePromoteFromBench(
//   state: BattleState,
//   action: {
//     type: "PROMOTE_FROM_BENCH";
//     cardIid: string;
//     side: Side;
//     benchPosition: number;
//   },
//   context: BattleContext
// ): boolean {
//   // Must be during battle phase (not preparation)
//   if (state.phase === "PREPARATION") return false;

//   // Must not have an active Pokemon currently
//   const currentActive =
//     action.side === "PLAYER" ? state.active.player : state.active.ai;
//   if (currentActive) return false;

//   // Must have a Pokemon at the specified bench position
//   const bench = action.side === "PLAYER" ? state.bench.player : state.bench.ai;
//   const benchCard = bench[action.benchPosition];

//   return benchCard !== null && benchCard.iid === action.cardIid;
// }

// function validateAttachEnergy(
//   state: BattleState,
//   action: {
//     type: "ATTACH_ENERGY";
//     cardIid: string;
//     energyType: string;
//     side: Side;
//   },
//   context: BattleContext
// ): boolean {
//   // Can only attach energy during your turn (not preparation)
//   if (state.phase === "PREPARATION") return false;

//   // Check one-energy-per-turn rule for players (but allow AI to be more flexible for now)
//   if (action.side === "PLAYER" && state.flags?.hasAttachedEnergyThisTurn) {
//     console.log("❌ Energy attachment blocked: One energy per turn limit");
//     return false;
//   }

//   // Card must exist and be on your side (active or bench)
//   const cardInstance = context.cardInstances.get(action.cardIid);
//   if (!cardInstance) return false;

//   // Check if card is in active or bench position for this side
//   const active =
//     action.side === "PLAYER" ? state.active.player : state.active.ai;
//   const bench = action.side === "PLAYER" ? state.bench.player : state.bench.ai;

//   const isActive = active?.iid === action.cardIid;
//   const isOnBench = bench.some((card) => card?.iid === action.cardIid);

//   if (!isActive && !isOnBench) {
//     console.log("❌ Energy attachment blocked: Card not in play");
//     return false;
//   }

//   // Optional: Limit maximum energy per Pokemon (prevent infinite stacking)
//   const currentEnergy = state.energies[action.cardIid] || 0;
//   if (currentEnergy >= 10) {
//     console.log("❌ Energy attachment blocked: Maximum energy limit reached");
//     return false;
//   }

//   return true;
// }

// function validateAttack(
//   state: BattleState,
//   action: {
//     type: "ATTACK";
//     attackerIid: string;
//     targetIid: string;
//     attackIndex: number;
//     side: Side;
//   },
//   context: BattleContext
// ): boolean {
//   if (state.phase === "PREPARATION") return false;
//   if (!state.canAttackThisTurn) return false;

//   const active =
//     action.side === "PLAYER" ? state.active.player : state.active.ai;
//   if (!active || active.iid !== action.attackerIid) return false;

//   const opponentActive =
//     action.side === "PLAYER" ? state.active.ai : state.active.player;
//   if (!opponentActive || opponentActive.iid !== action.targetIid) return false;

//   const attacker = context.cardInstances.get(action.attackerIid);
//   if (!attacker) return false;

//   return canCardAttack(attacker, action.attackIndex);
// }

// function validateEndTurn(
//   state: BattleState,
//   action: { type: "END_TURN"; side: Side }
// ): boolean {
//   if (state.phase === "PREPARATION") return false;
//   const currentSide = state.phase === "PLAYER_TURN" ? "PLAYER" : "AI";
//   return action.side === currentSide;
// }

// function validateRetreat(
//   state: BattleState,
//   action: { type: "RETREAT"; side: Side; benchPosition: number },
//   context: BattleContext
// ): boolean {
//   if (state.phase === "PREPARATION") return false;

//   // One retreat per turn for the player
//   if (action.side === "PLAYER" && state.flags?.hasRetreatedThisTurn) {
//     console.log("❌ Already retreated this turn");
//     return false;
//   }

//   const activeRef =
//     action.side === "PLAYER" ? state.active.player : state.active.ai;
//   const bench = action.side === "PLAYER" ? state.bench.player : state.bench.ai;
//   if (!activeRef) return false;
//   if (action.benchPosition < 0 || action.benchPosition > 2) return false;
//   if (!bench[action.benchPosition]) return false;

//   const inst = context.cardInstances.get(activeRef.iid);
//   if (!inst) return false;

//   // Cost based on base/max HP
//   const baseHp = inst.maxHp;
//   const cost = getRetreatCost(baseHp);
//   const have = state.energies[activeRef.iid] || 0;

//   if (have < cost) return false;
//   return true;
// }

// // ================================
// // NEW KNOCKOUT HANDLING
// // ================================

// interface KnockoutResult {
//   gameEnded: boolean;
//   winner?: Side;
//   needsPromotion: boolean;
// }

// function handleKnockout(
//   state: BattleState,
//   cardIid: string,
//   side: Side,
//   context: BattleContext
// ): KnockoutResult {
//   const result: KnockoutResult = {
//     gameEnded: false,
//     needsPromotion: false,
//   };

//   // Check if the KO'd Pokemon was active
//   const activeSlot = side === "PLAYER" ? state.active.player : state.active.ai;
//   const isActiveKO = activeSlot?.iid === cardIid;

//   // Move card to discard
//   moveCardToDiscard(state, cardIid, side, context);

//   // If active Pokemon was KO'd, check for replacement
//   if (isActiveKO) {
//     console.log(`🔍 Active Pokemon ${cardIid} was knocked out for ${side}`);

//     const bench = side === "PLAYER" ? state.bench.player : state.bench.ai;
//     const availableBenchPokemon = bench.filter((card) => card !== null);

//     if (availableBenchPokemon.length === 0) {
//       // No bench Pokemon available - player loses immediately
//       console.log(`💀 ${side} has no Pokemon to replace active - GAME OVER!`);
//       result.gameEnded = true;
//       result.winner = side === "PLAYER" ? "AI" : "PLAYER";
//     } else {
//       // Need to promote from bench
//       console.log(
//         `🔄 ${side} has ${availableBenchPokemon.length} bench Pokemon available for promotion`
//       );
//       result.needsPromotion = true;
//     }
//   }

//   return result;
// }

// // ================================
// // HELPERS
// // ================================

// function resetHpToFull(
//   state: BattleState,
//   iid: string,
//   context: BattleContext
// ) {
//   const inst = context.cardInstances.get(iid);
//   if (!inst) return;
//   const full = inst.maxHp;

//   state.hpByIid[iid] = full;
//   inst.hp = full;
// }

// function moveCardToDiscard(
//   state: BattleState,
//   cardIid: string,
//   side: Side,
//   context: BattleContext
// ): void {
//   // Remove from active
//   if (side === "PLAYER" && state.active.player?.iid === cardIid) {
//     const ref = state.active.player;
//     state.active.player = undefined;
//     state.discards.player.push(ref);
//   } else if (side === "AI" && state.active.ai?.iid === cardIid) {
//     const ref = state.active.ai;
//     state.active.ai = undefined;
//     state.discards.ai.push(ref);
//   } else {
//     // Remove from bench
//     const bench = side === "PLAYER" ? state.bench.player : state.bench.ai;
//     const discards =
//       side === "PLAYER" ? state.discards.player : state.discards.ai;

//     for (let i = 0; i < bench.length; i++) {
//       if (bench[i]?.iid === cardIid) {
//         const ref = bench[i]!;
//         bench[i] = null;
//         discards.push(ref);
//         break;
//       }
//     }
//   }

//   // Clear ephemeral state
//   state.hpByIid[cardIid] = 0;
//   delete state.energies[cardIid];

//   const inst = context.cardInstances.get(cardIid);
//   if (inst) {
//     inst.hp = 0;
//     inst.energiesAttached = 0;
//   }
// }

// function drawCard(state: BattleState, side: Side): void {
//   const deck = side === "PLAYER" ? state.decks.player : state.decks.ai;
//   const hand = side === "PLAYER" ? state.hands.player : state.hands.ai;
//   if (deck.length > 0) {
//     const drawn = deck.shift()!;
//     hand.push(drawn);
//   }
// }

// // ================================
// // BENCH PROMOTION UTILITIES
// // ================================

// export function getAvailableBenchPokemon(
//   state: BattleState,
//   side: Side
// ): Array<{ card: CardRef; position: number }> {
//   const bench = side === "PLAYER" ? state.bench.player : state.bench.ai;
//   const available: Array<{ card: CardRef; position: number }> = [];

//   bench.forEach((card, position) => {
//     if (card !== null) {
//       available.push({ card, position });
//     }
//   });

//   return available;
// }

// // ================================
// // BATTLE SETUP
// // ================================

// export function initializeBattle(
//   playerDeckIds: string[],
//   aiDeckIds: string[],
//   context: BattleContext
// ): BattleState {
//   const shuffledPlayerDeck = [...playerDeckIds].sort(() => Math.random() - 0.5);
//   const shuffledAiDeck = [...aiDeckIds].sort(() => Math.random() - 0.5);

//   const state: BattleState = {
//     rngSeed: Math.random().toString(36),
//     phase: "PREPARATION",
//     turn: 1,
//     firstPlayer: Math.random() < 0.5 ? "PLAYER" : "AI",

//     active: {},
//     bench: { player: [null, null, null], ai: [null, null, null] },
//     hands: { player: [], ai: [] },
//     decks: { player: [], ai: [] },
//     discards: { player: [], ai: [] },

//     prizes: { playerDefeated: 0, aiDefeated: 0 },
//     hpByIid: {},
//     energies: {},
//     canAttackThisTurn: true,
//     legalMoves: [],
//     flags: {
//       hasAttackedThisTurn: false,
//       hasAttachedEnergyThisTurn: false,
//       hasRetreatedThisTurn: false,
//     },
//   };

//   for (const [index, cardId] of shuffledPlayerDeck.entries()) {
//     const ref: CardRef = { id: cardId, iid: `player_${index}` };
//     if (index < 5) state.hands.player.push(ref);
//     else state.decks.player.push(ref);

//     const cd = context.cardDataCache.get(cardId);
//     if (cd) {
//       context.cardInstances.set(ref.iid, {
//         iid: ref.iid,
//         cardData: cd,
//         hp: cd.hp,
//         maxHp: cd.hp,
//         energiesAttached: 0,
//         statusEffects: [],
//       });
//       state.hpByIid[ref.iid] = cd.hp;
//     }
//   }

//   for (const [index, cardId] of shuffledAiDeck.entries()) {
//     const ref: CardRef = { id: cardId, iid: `ai_${index}` };
//     if (index < 5) state.hands.ai.push(ref);
//     else state.decks.ai.push(ref);

//     const cd = context.cardDataCache.get(cardId);
//     if (cd) {
//       context.cardInstances.set(ref.iid, {
//         iid: ref.iid,
//         cardData: cd,
//         hp: cd.hp,
//         maxHp: cd.hp,
//         energiesAttached: 0,
//         statusEffects: [],
//       });
//       state.hpByIid[ref.iid] = cd.hp;
//     }
//   }

//   return state;
// }
