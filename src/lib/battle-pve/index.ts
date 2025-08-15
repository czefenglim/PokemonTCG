// src/app/lib/pve/index.ts
/**
 * Main export file for PvE battle system
 * Provides clean imports for all PvE functionality
 */

import {
  BattleAction,
  BattleContext,
  BattleState,
  CardRef,
  Side,
} from './state';

// ================================
// TYPES AND ENUMS
// ================================
export * from './types';

// ================================
// CARD DATA MANAGEMENT
// ================================
export * from './cards';

// ================================
// BATTLE SYSTEM CORE
// ================================
export * from './state';
export * from './engine';
export * from './ai';
export * from './progress';

// ================================
// CONVENIENCE RE-EXPORTS
// ================================

// Types and enums
export {
  Difficulty,
  Element,
  BattleState as BattlePhaseEnum, // Renamed to avoid conflict
  ActionType,
  GAME_CONSTANTS,
} from './types';

// Card management
export {
  loadCardIndex,
  getCard,
  getCards,
  getCardsByType,
  getRandomCards,
  clearCardCache,
} from './cards';

// Battle state
export {
  createInitialBattleState,
  getCardInstance,
  getActiveCard,
  getBenchCards,
  getHandCards,
  canCardAttack,
  calculateDamage,
  isBattleEnded,
  getBattleWinner,
} from './state';
export type {
  BattleState,
  BattleAction,
  BattleContext,
  BattleCardInstance,
  CardRef,
  Side,
  BattlePhase,
} from './state';

// Battle engine
export { applyAction, initializeBattle } from './engine';

// AI
export { aiTurn, getAIStrategy, logAIDecision } from './ai';

// Progress tracking
export {
  updateProgressOnBattleEnd,
  getUserProgress,
  getUserBattleStats,
  hasAccessToDifficulty,
  getRecommendedOpponents,
  getLeaderboard,
} from './progress';

// ================================
// BATTLE SYSTEM UTILITIES
// ================================

/**
 * Create a complete battle context with card data
 */
export async function createBattleContext(): Promise<BattleContext> {
  const { loadCardIndex } = await import('./cards');
  const cardDataCache = await loadCardIndex();

  return {
    cardInstances: new Map(),
    cardDataCache,
  };
}

/**
 * Quick battle setup for testing
 */
export async function setupTestBattle(
  playerDeckIds: string[],
  aiDeckIds: string[]
): Promise<{ state: BattleState; context: BattleContext }> {
  const context = await createBattleContext();
  const { initializeBattle } = await import('./engine');

  const state = initializeBattle(playerDeckIds, aiDeckIds, context);

  return { state, context };
}

/**
 * Execute a complete AI turn (helper for testing)
 */
export async function executeAITurn(
  state: BattleState,
  context: BattleContext
): Promise<BattleState> {
  const { aiTurn } = await import('./ai');
  return aiTurn(state, context);
}

/**
 * Simulate a complete battle for testing
 */
export async function simulateBattle(
  playerDeckIds: string[],
  aiDeckIds: string[],
  maxTurns: number = 50
): Promise<{
  finalState: BattleState;
  winner: Side | null;
  turns: number;
  history: BattleAction[];
}> {
  const { state: initialState, context } = await setupTestBattle(
    playerDeckIds,
    aiDeckIds
  );
  const { aiTurn } = await import('./ai');
  const { getBattleWinner, isBattleEnded } = await import('./state');

  let currentState = initialState;
  const history: BattleAction[] = [];
  let turns = 0;

  // Handle preparation phase
  while (currentState.phase === 'PREPARATION' && turns < maxTurns) {
    if (!currentState.active.ai) {
      currentState = await aiTurn(currentState, context);
    }
    if (!currentState.active.player) {
      // For simulation, auto-place player's strongest Pokemon
      const handCards = currentState.hands.player;
      if (handCards.length > 0) {
        const bestCard = handCards[0]; // Simple: just take first card
        const placeAction: BattleAction = {
          type: 'PLACE_ACTIVE',
          cardIid: bestCard.iid,
          side: 'PLAYER',
        };

        const { applyAction } = await import('./engine');
        const newState = applyAction(currentState, placeAction, context);
        if (newState) currentState = newState;
      }
    }
    turns++;
  }

  // Battle phase - AI vs AI simulation
  while (!isBattleEnded(currentState) && turns < maxTurns) {
    if (currentState.phase === 'AI_TURN') {
      currentState = await aiTurn(currentState, context);
    } else if (currentState.phase === 'PLAYER_TURN') {
      // Simulate player turn with basic AI logic
      currentState = await aiTurn(
        { ...currentState, phase: 'AI_TURN' },
        context
      );
    }
    turns++;
  }

  return {
    finalState: currentState,
    winner: getBattleWinner(currentState),
    turns,
    history,
  };
}

// ================================
// DEVELOPMENT & DEBUG UTILITIES
// ================================

/**
 * Log current battle state (for debugging)
 */
export function logBattleState(
  state: BattleState,
  context: BattleContext
): void {
  console.log('=== BATTLE STATE ===');
  console.log('Phase:', state.phase);
  console.log('Turn:', state.turn);
  console.log('Prizes:', state.prizes);

  const playerActive = state.active.player;
  const aiActive = state.active.ai;

  if (playerActive) {
    const card = context.cardInstances.get(playerActive.iid);
    console.log(
      'Player Active:',
      card?.cardData.name,
      `(${card?.hp}/${card?.maxHp} HP)`
    );
  }

  if (aiActive) {
    const card = context.cardInstances.get(aiActive.iid);
    console.log(
      'AI Active:',
      card?.cardData.name,
      `(${card?.hp}/${card?.maxHp} HP)`
    );
  }

  console.log('Player Hand:', state.hands.player.length, 'cards');
  console.log('AI Hand:', state.hands.ai.length, 'cards');
  console.log('================');
}

/**
 * Validate battle state consistency (for testing)
 */
export function validateBattleState(
  state: BattleState,
  context: BattleContext
): string[] {
  const errors: string[] = [];

  // Check that all card references have corresponding instances
  const allCardRefs = [
    ...(state.active.player ? [state.active.player] : []),
    ...(state.active.ai ? [state.active.ai] : []),
    ...state.hands.player,
    ...state.hands.ai,
    ...state.decks.player,
    ...state.decks.ai,
    ...state.discards.player,
    ...state.discards.ai,
    ...(state.bench.player.filter((c) => c !== null) as CardRef[]),
    ...(state.bench.ai.filter((c) => c !== null) as CardRef[]),
  ];

  for (const cardRef of allCardRefs) {
    if (!context.cardInstances.has(cardRef.iid)) {
      errors.push(`Missing card instance for ${cardRef.iid}`);
    }
  }

  // Check win conditions
  if (state.prizes.playerDefeated >= 2 && state.winner !== 'AI') {
    errors.push('Player should have lost but winner is not AI');
  }

  if (state.prizes.aiDefeated >= 2 && state.winner !== 'PLAYER') {
    errors.push('AI should have lost but winner is not PLAYER');
  }

  return errors;
}
