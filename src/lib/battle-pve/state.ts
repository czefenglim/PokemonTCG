// src/app/lib/pve/state.ts
// Enhanced: typed energy tracking + strict same-element requirement for attacks & retreat

import { CardData } from '@/lib/battle-pve/types';
import { v4 as uuidv4 } from 'uuid';

// ================================
// CORE BATTLE STATE TYPES
// ================================

export type CardRef = {
  id: string; // tokenId from pokemon-list.json
  iid: string; // unique instance ID for this battle
};

export type Side = 'PLAYER' | 'AI';

export type BattlePhase = 'PREPARATION' | 'PLAYER_TURN' | 'AI_TURN' | 'ENDED';

export type BattleAction =
  | { type: 'PLACE_ACTIVE'; cardIid: string; side: Side }
  | { type: 'PLACE_BENCH'; cardIid: string; side: Side; position: number }
  | { type: 'ATTACH_ENERGY'; cardIid: string; energyType: string; side: Side }
  | {
      type: 'ATTACK';
      attackerIid: string;
      targetIid: string;
      attackIndex: number;
      side: Side;
    }
  | { type: 'END_TURN'; side: Side }
  | {
      type: 'PROMOTE_FROM_BENCH';
      cardIid: string;
      side: Side;
      benchPosition: number;
    }
  | { type: 'RETREAT'; side: Side; benchPosition: number } // ✅ retreat action
  | { type: 'CONCEDE'; side: Side };

export type BattleState = {
  // Game meta
  rngSeed: string;
  phase: BattlePhase;
  turn: number;
  firstPlayer: Side;

  // Card positions
  active: { player?: CardRef; ai?: CardRef };
  bench: { player: (CardRef | null)[]; ai: (CardRef | null)[] }; // Max 3 each
  hands: { player: CardRef[]; ai: CardRef[] };
  decks: { player: CardRef[]; ai: CardRef[] };
  discards: { player: CardRef[]; ai: CardRef[] };

  // Game state
  prizes: { playerDefeated: number; aiDefeated: number }; // Win at 2

  /** PERSISTED RUNTIME: HP by Card Instance IID */
  hpByIid: Record<string, number>;

  /** Numeric energy count per instance (for badges/caps) */
  energies: Record<string, number>;

  /** ✅ NEW: typed energy list per instance (UPPERCASED strings like "FIRE") */
  energyTypes: Record<string, string[]>;

  canAttackThisTurn: boolean;

  // Valid moves for current player
  legalMoves: string[];

  // Winner when game ends
  winner?: Side;

  /** Turn-based flags */
  flags?: {
    hasAttackedThisTurn?: boolean;
    hasAttachedEnergyThisTurn?: boolean;
    hasRetreatedThisTurn?: boolean; // ✅ enforce once-per-turn retreat
    needsBenchPromotion?: { side: Side; forced: boolean }; // when promotion is needed
  };
};

// ================================
// CARD INSTANCES & BATTLE DATA
// ================================

export type BattleCardInstance = {
  iid: string; // Instance ID
  cardData: CardData; // Full card data
  hp: number; // Current HP (runtime mirror of hpByIid)
  maxHp: number; // Original HP (printed HP)
  energiesAttached: number; // Runtime mirror of energies[iid]
  /** ✅ NEW: runtime mirror of energyTypes[iid] */
  energyTypesAttached: string[];
  statusEffects: string[]; // Future: poison, sleep, etc.
};

export type BattleContext = {
  cardInstances: Map<string, BattleCardInstance>; // iid -> card instance
  cardDataCache: Map<string, CardData>; // tokenId -> card data
};

// ================================
// STATE INITIALIZATION
// ================================

export function createInitialBattleState(
  playerDeckIds: string[],
  aiDeckIds: string[],
  context: BattleContext
): BattleState {
  const firstPlayer: Side = Math.random() < 0.5 ? 'PLAYER' : 'AI';

  const playerCards = playerDeckIds.map((id) => ({ id, iid: uuidv4() }));
  const aiCards = aiDeckIds.map((id) => ({ id, iid: uuidv4() }));

  [...playerCards, ...aiCards].forEach((cardRef) => {
    const cardData = context.cardDataCache.get(cardRef.id);
    if (cardData) {
      context.cardInstances.set(cardRef.iid, {
        iid: cardRef.iid,
        cardData,
        hp: cardData.hp,
        maxHp: cardData.hp,
        energiesAttached: 0,
        energyTypesAttached: [], // ✅
        statusEffects: [],
      });
    }
  });

  const playerHand = playerCards.slice(0, 5);
  const aiHand = aiCards.slice(0, 5);
  const playerDeck = playerCards.slice(5);
  const aiDeck = aiCards.slice(5);

  // Persist HP for all instances
  const hpByIid: Record<string, number> = {};
  [...playerCards, ...aiCards].forEach((ref) => {
    const cd = context.cardDataCache.get(ref.id);
    if (cd) hpByIid[ref.iid] = cd.hp;
  });

  return {
    rngSeed: uuidv4(),
    phase: 'PREPARATION',
    turn: 1,
    firstPlayer,

    active: {},
    bench: { player: [null, null, null], ai: [null, null, null] },
    hands: { player: playerHand, ai: aiHand },
    decks: { player: playerDeck, ai: aiDeck },
    discards: { player: [], ai: [] },

    prizes: { playerDefeated: 0, aiDefeated: 0 },
    hpByIid,
    energies: {},
    energyTypes: {}, // ✅
    canAttackThisTurn: false,
    legalMoves: [],
    flags: {
      hasAttackedThisTurn: false,
      hasAttachedEnergyThisTurn: false,
      hasRetreatedThisTurn: false,
    },
  };
}

// ================================
// STATE HELPER FUNCTIONS
// ================================

function normType(s: string): string {
  return String(s || '')
    .trim()
    .toUpperCase();
}

export function getCardInstance(
  iid: string,
  context: BattleContext
): BattleCardInstance | null {
  return context.cardInstances.get(iid) || null;
}

export function isBattleEnded(state: BattleState): boolean {
  return (
    state.phase === 'ENDED' ||
    state.prizes.playerDefeated >= 2 ||
    state.prizes.aiDefeated >= 2
  );
}

export function getBattleWinner(state: BattleState): Side | null {
  if (state.prizes.playerDefeated >= 2) return 'AI';
  if (state.prizes.aiDefeated >= 2) return 'PLAYER';
  if (state.winner) return state.winner;
  return null;
}

export function getHandCards(
  state: BattleState,
  side: Side,
  context: BattleContext
): BattleCardInstance[] {
  const hand = side === 'PLAYER' ? state.hands.player : state.hands.ai;
  return hand
    .map((ref) => getCardInstance(ref.iid, context))
    .filter(Boolean) as BattleCardInstance[];
}

export function getActiveCard(
  state: BattleState,
  side: Side,
  context: BattleContext
): BattleCardInstance | null {
  const ref = side === 'PLAYER' ? state.active.player : state.active.ai;
  return ref ? getCardInstance(ref.iid, context) : null;
}

export function getBenchCards(
  state: BattleState,
  side: Side,
  context: BattleContext
): (BattleCardInstance | null)[] {
  const bench = side === 'PLAYER' ? state.bench.player : state.bench.ai;
  return bench.map((ref) => (ref ? getCardInstance(ref.iid, context) : null));
}

export function getCardEnergyCount(
  state: BattleState,
  cardIid: string
): number {
  return state.energies[cardIid] || 0;
}

/** ✅ Count energies on card that match the card's own type (robust to missing maps) */
export function countSameElementEnergy(
  stateOrList: BattleState | string[],
  card: BattleCardInstance
): number {
  const myType = normType(card.cardData.type);
  if (Array.isArray(stateOrList)) {
    const list = stateOrList;
    return (list || []).filter((t) => normType(t) === myType).length;
  }
  const st = stateOrList as BattleState;
  const map = st.energyTypes || {}; // <-- guard when old saves had no energyTypes
  const list = map[card.iid] || card.energyTypesAttached || [];
  return (list || []).filter((t) => normType(t) === myType).length;
}

/** ✅ STRICT: attacks require enough energy quantity AND all of those must be same-element */
export function canCardAttack(
  card: BattleCardInstance,
  attackIndex: number,
  state?: BattleState
): boolean {
  const attack = card.cardData.attacks[attackIndex];
  if (!attack) return false;
  const required = attack.cost.length;

  if (card.energiesAttached < required) return false;

  if (state) {
    return countSameElementEnergy(state, card) >= required;
  } else {
    const myType = normType(card.cardData.type);
    const haveTyped = (card.energyTypesAttached || []).filter(
      (t) => normType(t) === myType
    ).length;
    return haveTyped >= required;
  }
}

export function calculateDamage(
  attacker: BattleCardInstance,
  target: BattleCardInstance,
  attackIndex: number
): number {
  const attack = attacker.cardData.attacks[attackIndex];
  if (!attack) return 0;

  let damage = attack.damage;

  const weakness = target.cardData.weaknesses.find(
    (w) => w.type.toLowerCase() === attacker.cardData.type.toLowerCase()
  );
  if (weakness) damage *= 2;

  const resistance = target.cardData.resistances.find(
    (r) => r.type.toLowerCase() === attacker.cardData.type.toLowerCase()
  );
  if (resistance) {
    const reduction = parseInt(resistance.value) || 20;
    damage = Math.max(0, damage - reduction);
  }

  return damage;
}

export function findEmptyBenchPosition(
  state: BattleState,
  side: Side
): number | null {
  const bench = side === 'PLAYER' ? state.bench.player : state.bench.ai;
  for (let i = 0; i < bench.length; i++) if (bench[i] === null) return i;
  return null;
}

export function isPreparationComplete(state: BattleState): boolean {
  return state.active.player !== undefined && state.active.ai !== undefined;
}

export function getNextPhase(state: BattleState): BattlePhase {
  if (state.phase === 'PREPARATION' && isPreparationComplete(state)) {
    return state.firstPlayer === 'PLAYER' ? 'PLAYER_TURN' : 'AI_TURN';
  }
  if (state.phase === 'PLAYER_TURN') return 'AI_TURN';
  if (state.phase === 'AI_TURN') return 'PLAYER_TURN';
  return state.phase;
}

// ================================
// BENCH PROMOTION & VALIDATION
// ================================

export function needsBenchPromotion(state: BattleState, side: Side): boolean {
  if (state.phase === 'PREPARATION' || state.phase === 'ENDED') return false;
  const active = side === 'PLAYER' ? state.active.player : state.active.ai;
  const bench = side === 'PLAYER' ? state.bench.player : state.bench.ai;
  return !active && bench.some((card) => card !== null);
}

export function getPromotablePokemon(
  state: BattleState,
  side: Side
): Array<{
  card: CardRef;
  cardInstance: BattleCardInstance;
  position: number;
}> {
  const bench = side === 'PLAYER' ? state.bench.player : state.bench.ai;
  const promotable: Array<{
    card: CardRef;
    cardInstance: BattleCardInstance;
    position: number;
  }> = [];

  bench.forEach((card, position) => {
    if (card !== null) {
      promotable.push({
        card,
        cardInstance: null as any, // fill with context by caller if needed
        position,
      });
    }
  });

  return promotable;
}

export function hasLostDueToNoPokemon(state: BattleState, side: Side): boolean {
  if (state.phase === 'PREPARATION' || state.phase === 'ENDED') return false;
  const active = side === 'PLAYER' ? state.active.player : state.active.ai;
  const bench = side === 'PLAYER' ? state.bench.player : state.bench.ai;
  return !active && bench.every((card) => card === null);
}

export function canPlaceActiveFromHand(state: BattleState): boolean {
  return state.phase === 'PREPARATION';
}

export function canPlaceBenchFromHand(state: BattleState): boolean {
  return state.phase !== 'ENDED';
}

// ================================
// ENERGY TURN HELPERS
// ================================

export function canAttachEnergyThisTurn(
  state: BattleState,
  side: Side
): boolean {
  if (state.phase === 'PREPARATION') return false;
  const currentSide = state.phase === 'PLAYER_TURN' ? 'PLAYER' : 'AI';
  if (side !== currentSide) return false;
  if (side === 'PLAYER' && state.flags?.hasAttachedEnergyThisTurn) {
    return false;
  }
  return true;
}

// ================================
// GAME STATE VALIDATION
// ================================

export function isValidGameState(state: BattleState): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (state.phase === 'PLAYER_TURN' || state.phase === 'AI_TURN') {
    if (!state.active.player && !needsBenchPromotion(state, 'PLAYER')) {
      errors.push('Player has no active Pokemon and no bench to promote from');
    }
    if (!state.active.ai && !needsBenchPromotion(state, 'AI')) {
      errors.push('AI has no active Pokemon and no bench to promote from');
    }
  }

  if (state.prizes.playerDefeated >= 2 && state.winner !== 'AI') {
    errors.push('Player should have lost but winner is not set to AI');
  }
  if (state.prizes.aiDefeated >= 2 && state.winner !== 'PLAYER') {
    errors.push('AI should have lost but winner is not set to PLAYER');
  }

  if (hasLostDueToNoPokemon(state, 'PLAYER') && state.winner !== 'AI') {
    errors.push("Player has no Pokemon left but game hasn't ended");
  }
  if (hasLostDueToNoPokemon(state, 'AI') && state.winner !== 'PLAYER') {
    errors.push("AI has no Pokemon left but game hasn't ended");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ================================
// RETREAT COST HELPER (printed HP)
// ================================

/** Retreat cost based on printed HP (max HP).
 *  maxHp >= 150 -> 3
 *  100 < maxHp < 150 -> 2
 *  60 <= maxHp <= 100 -> 1
 *  maxHp < 60 -> 0
 */
export function getRetreatCost(maxHp: number): number {
  if (maxHp >= 150) return 3;
  if (maxHp > 100) return 2;
  if (maxHp >= 60) return 1;
  return 0;
}

// // src/app/lib/pve/state.ts - Enhanced with Bench Promotion, Energy Turn Tracking, and Retreat
// import { CardData } from "./types";
// import { v4 as uuidv4 } from "uuid";

// // ================================
// // CORE BATTLE STATE TYPES
// // ================================

// export type CardRef = {
//   id: string; // tokenId from pokemon-list.json
//   iid: string; // unique instance ID for this battle
// };

// export type Side = "PLAYER" | "AI";

// export type BattlePhase = "PREPARATION" | "PLAYER_TURN" | "AI_TURN" | "ENDED";

// export type BattleAction =
//   | { type: "PLACE_ACTIVE"; cardIid: string; side: Side }
//   | { type: "PLACE_BENCH"; cardIid: string; side: Side; position: number }
//   | { type: "ATTACH_ENERGY"; cardIid: string; energyType: string; side: Side }
//   | {
//       type: "ATTACK";
//       attackerIid: string;
//       targetIid: string;
//       attackIndex: number;
//       side: Side;
//     }
//   | { type: "END_TURN"; side: Side }
//   | {
//       type: "PROMOTE_FROM_BENCH";
//       cardIid: string;
//       side: Side;
//       benchPosition: number;
//     }
//   | { type: "RETREAT"; side: Side; benchPosition: number } // ✅ NEW: retreat action
//   | { type: "CONCEDE"; side: Side };

// export type BattleState = {
//   // Game meta
//   rngSeed: string;
//   phase: BattlePhase;
//   turn: number;
//   firstPlayer: Side;

//   // Card positions
//   active: { player?: CardRef; ai?: CardRef };
//   bench: { player: (CardRef | null)[]; ai: (CardRef | null)[] }; // Max 3 each
//   hands: { player: CardRef[]; ai: CardRef[] };
//   decks: { player: CardRef[]; ai: CardRef[] };
//   discards: { player: CardRef[]; ai: CardRef[] };

//   // Game state
//   prizes: { playerDefeated: number; aiDefeated: number }; // Win at 2

//   /**
//    * PERSISTED RUNTIME: HP by Card Instance IID
//    */
//   hpByIid: Record<string, number>;

//   /**
//    * Energy system: how many energies are attached to each card (by iid)
//    */
//   energies: Record<string, number>;

//   canAttackThisTurn: boolean;

//   // Valid moves for current player
//   legalMoves: string[];

//   // Winner when game ends
//   winner?: Side;

//   /**
//    * Turn-based flags for tracking actions
//    */
//   flags?: {
//     hasAttackedThisTurn?: boolean;
//     hasAttachedEnergyThisTurn?: boolean;
//     hasRetreatedThisTurn?: boolean; // ✅ NEW: enforce once-per-turn retreat
//     needsBenchPromotion?: { side: Side; forced: boolean }; // Track when promotion is needed
//   };
// };

// // ================================
// // CARD INSTANCES & BATTLE DATA
// // ================================

// export type BattleCardInstance = {
//   iid: string; // Instance ID
//   cardData: CardData; // Full card data
//   hp: number; // Current HP (runtime mirror of hpByIid)
//   maxHp: number; // Original HP (printed HP)
//   energiesAttached: number; // Runtime mirror of energies[iid]
//   statusEffects: string[]; // Future: poison, sleep, etc.
// };

// export type BattleContext = {
//   cardInstances: Map<string, BattleCardInstance>; // iid -> card instance
//   cardDataCache: Map<string, CardData>; // tokenId -> card data
// };

// // ================================
// // STATE INITIALIZATION
// // ================================

// export function createInitialBattleState(
//   playerDeckIds: string[],
//   aiDeckIds: string[],
//   context: BattleContext
// ): BattleState {
//   const firstPlayer: Side = Math.random() < 0.5 ? "PLAYER" : "AI";

//   const playerCards = playerDeckIds.map((id) => ({ id, iid: uuidv4() }));
//   const aiCards = aiDeckIds.map((id) => ({ id, iid: uuidv4() }));

//   [...playerCards, ...aiCards].forEach((cardRef) => {
//     const cardData = context.cardDataCache.get(cardRef.id);
//     if (cardData) {
//       context.cardInstances.set(cardRef.iid, {
//         iid: cardRef.iid,
//         cardData,
//         hp: cardData.hp,
//         maxHp: cardData.hp,
//         energiesAttached: 0,
//         statusEffects: [],
//       });
//     }
//   });

//   const playerHand = playerCards.slice(0, 5);
//   const aiHand = aiCards.slice(0, 5);
//   const playerDeck = playerCards.slice(5);
//   const aiDeck = aiCards.slice(5);

//   // Persist HP for all instances
//   const hpByIid: Record<string, number> = {};
//   [...playerCards, ...aiCards].forEach((ref) => {
//     const cd = context.cardDataCache.get(ref.id);
//     if (cd) hpByIid[ref.iid] = cd.hp;
//   });

//   return {
//     rngSeed: uuidv4(),
//     phase: "PREPARATION",
//     turn: 1,
//     firstPlayer,

//     active: {},
//     bench: { player: [null, null, null], ai: [null, null, null] },
//     hands: { player: playerHand, ai: aiHand },
//     decks: { player: playerDeck, ai: aiDeck },
//     discards: { player: [], ai: [] },

//     prizes: { playerDefeated: 0, aiDefeated: 0 },
//     hpByIid,
//     energies: {},
//     canAttackThisTurn: false,
//     legalMoves: [],
//     flags: {
//       hasAttackedThisTurn: false,
//       hasAttachedEnergyThisTurn: false,
//       hasRetreatedThisTurn: false,
//     },
//   };
// }

// // ================================
// // STATE HELPER FUNCTIONS
// // ================================

// export function getCardInstance(
//   iid: string,
//   context: BattleContext
// ): BattleCardInstance | null {
//   return context.cardInstances.get(iid) || null;
// }

// export function isBattleEnded(state: BattleState): boolean {
//   return (
//     state.phase === "ENDED" ||
//     state.prizes.playerDefeated >= 2 ||
//     state.prizes.aiDefeated >= 2
//   );
// }

// export function getBattleWinner(state: BattleState): Side | null {
//   if (state.prizes.playerDefeated >= 2) return "AI";
//   if (state.prizes.aiDefeated >= 2) return "PLAYER";
//   if (state.winner) return state.winner;
//   return null;
// }

// export function getHandCards(
//   state: BattleState,
//   side: Side,
//   context: BattleContext
// ): BattleCardInstance[] {
//   const hand = side === "PLAYER" ? state.hands.player : state.hands.ai;
//   return hand
//     .map((ref) => getCardInstance(ref.iid, context))
//     .filter(Boolean) as BattleCardInstance[];
// }

// export function getActiveCard(
//   state: BattleState,
//   side: Side,
//   context: BattleContext
// ): BattleCardInstance | null {
//   const ref = side === "PLAYER" ? state.active.player : state.active.ai;
//   return ref ? getCardInstance(ref.iid, context) : null;
// }

// export function getBenchCards(
//   state: BattleState,
//   side: Side,
//   context: BattleContext
// ): (BattleCardInstance | null)[] {
//   const bench = side === "PLAYER" ? state.bench.player : state.bench.ai;
//   return bench.map((ref) => (ref ? getCardInstance(ref.iid, context) : null));
// }

// export function canCardAttack(
//   card: BattleCardInstance,
//   attackIndex: number
// ): boolean {
//   const attack = card.cardData.attacks[attackIndex];
//   if (!attack) return false;
//   const energyRequired = attack.cost.length;
//   return card.energiesAttached >= energyRequired;
// }

// export function calculateDamage(
//   attacker: BattleCardInstance,
//   target: BattleCardInstance,
//   attackIndex: number
// ): number {
//   const attack = attacker.cardData.attacks[attackIndex];
//   if (!attack) return 0;

//   let damage = attack.damage;

//   const weakness = target.cardData.weaknesses.find(
//     (w) => w.type.toLowerCase() === attacker.cardData.type.toLowerCase()
//   );
//   if (weakness) damage *= 2;

//   const resistance = target.cardData.resistances.find(
//     (r) => r.type.toLowerCase() === attacker.cardData.type.toLowerCase()
//   );
//   if (resistance) {
//     const reduction = parseInt(resistance.value) || 20;
//     damage = Math.max(0, damage - reduction);
//   }

//   return damage;
// }

// export function findEmptyBenchPosition(
//   state: BattleState,
//   side: Side
// ): number | null {
//   const bench = side === "PLAYER" ? state.bench.player : state.bench.ai;
//   for (let i = 0; i < bench.length; i++) if (bench[i] === null) return i;
//   return null;
// }

// export function isPreparationComplete(state: BattleState): boolean {
//   return state.active.player !== undefined && state.active.ai !== undefined;
// }

// export function getNextPhase(state: BattleState): BattlePhase {
//   if (state.phase === "PREPARATION" && isPreparationComplete(state)) {
//     return state.firstPlayer === "PLAYER" ? "PLAYER_TURN" : "AI_TURN";
//   }
//   if (state.phase === "PLAYER_TURN") return "AI_TURN";
//   if (state.phase === "AI_TURN") return "PLAYER_TURN";
//   return state.phase;
// }

// // ================================
// // NEW BENCH PROMOTION FUNCTIONS
// // ================================

// export function needsBenchPromotion(state: BattleState, side: Side): boolean {
//   if (state.phase === "PREPARATION" || state.phase === "ENDED") return false;
//   const active = side === "PLAYER" ? state.active.player : state.active.ai;
//   const bench = side === "PLAYER" ? state.bench.player : state.bench.ai;
//   return !active && bench.some((card) => card !== null);
// }

// export function getPromotablePokemon(
//   state: BattleState,
//   side: Side
// ): Array<{
//   card: CardRef;
//   cardInstance: BattleCardInstance;
//   position: number;
// }> {
//   const bench = side === "PLAYER" ? state.bench.player : state.bench.ai;
//   const promotable: Array<{
//     card: CardRef;
//     cardInstance: BattleCardInstance;
//     position: number;
//   }> = [];

//   bench.forEach((card, position) => {
//     if (card !== null) {
//       promotable.push({
//         card,
//         cardInstance: null as any, // fill with context by caller if needed
//         position,
//       });
//     }
//   });

//   return promotable;
// }

// export function hasLostDueToNoPokemon(state: BattleState, side: Side): boolean {
//   if (state.phase === "PREPARATION" || state.phase === "ENDED") return false;
//   const active = side === "PLAYER" ? state.active.player : state.active.ai;
//   const bench = side === "PLAYER" ? state.bench.player : state.bench.ai;
//   return !active && bench.every((card) => card === null);
// }

// export function canPlaceActiveFromHand(state: BattleState): boolean {
//   return state.phase === "PREPARATION";
// }

// export function canPlaceBenchFromHand(state: BattleState): boolean {
//   return state.phase !== "ENDED";
// }

// // ================================
// // ENERGY HELPER FUNCTIONS
// // ================================

// export function getCardEnergyCount(
//   state: BattleState,
//   cardIid: string
// ): number {
//   return state.energies[cardIid] || 0;
// }

// export function canAttachEnergyThisTurn(
//   state: BattleState,
//   side: Side
// ): boolean {
//   if (state.phase === "PREPARATION") return false;
//   const currentSide = state.phase === "PLAYER_TURN" ? "PLAYER" : "AI";
//   if (side !== currentSide) return false;
//   if (side === "PLAYER" && state.flags?.hasAttachedEnergyThisTurn) {
//     return false;
//   }
//   return true;
// }

// export function getEnergyTargets(
//   state: BattleState,
//   side: Side,
//   context: BattleContext
// ): BattleCardInstance[] {
//   const targets: BattleCardInstance[] = [];
//   const active = getActiveCard(state, side, context);
//   if (active) targets.push(active);
//   const benchCards = getBenchCards(state, side, context);
//   benchCards.forEach((card) => {
//     if (card) targets.push(card);
//   });
//   return targets;
// }

// export function cardNeedsEnergyForAttacks(card: BattleCardInstance): boolean {
//   if (!card.cardData.attacks || card.cardData.attacks.length === 0)
//     return false;
//   for (const attack of card.cardData.attacks) {
//     const energyRequired = attack.cost.length;
//     if (card.energiesAttached < energyRequired) {
//       return true;
//     }
//   }
//   return false;
// }

// // ================================
// // GAME STATE VALIDATION
// // ================================

// export function isValidGameState(state: BattleState): {
//   isValid: boolean;
//   errors: string[];
// } {
//   const errors: string[] = [];

//   if (state.phase === "PLAYER_TURN" || state.phase === "AI_TURN") {
//     if (!state.active.player && !needsBenchPromotion(state, "PLAYER")) {
//       errors.push("Player has no active Pokemon and no bench to promote from");
//     }
//     if (!state.active.ai && !needsBenchPromotion(state, "AI")) {
//       errors.push("AI has no active Pokemon and no bench to promote from");
//     }
//   }

//   if (state.prizes.playerDefeated >= 2 && state.winner !== "AI") {
//     errors.push("Player should have lost but winner is not set to AI");
//   }
//   if (state.prizes.aiDefeated >= 2 && state.winner !== "PLAYER") {
//     errors.push("AI should have lost but winner is not set to PLAYER");
//   }

//   if (hasLostDueToNoPokemon(state, "PLAYER") && state.winner !== "AI") {
//     errors.push("Player has no Pokemon left but game hasn't ended");
//   }
//   if (hasLostDueToNoPokemon(state, "AI") && state.winner !== "PLAYER") {
//     errors.push("AI has no Pokemon left but game hasn't ended");
//   }

//   return {
//     isValid: errors.length === 0,
//     errors,
//   };
// }

// // ================================
// // RETREAT COST HELPER (printed HP)
// // ================================

// /** Retreat cost based on printed HP (max HP).
//  *  maxHp >= 150 -> 3
//  *  100 < maxHp < 150 -> 2
//  *  60 <= maxHp <= 100 -> 1
//  *  maxHp < 60 -> 0
//  */
// export function getRetreatCost(maxHp: number): number {
//   if (maxHp >= 150) return 3;
//   if (maxHp > 100) return 2;
//   if (maxHp >= 60) return 1;
//   return 0;
// }
