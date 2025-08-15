//src\app\lib\pve\types.ts - Updated with New Battle Rules
// ================================
// ENUMS
// ================================

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

export enum Element {
  FIRE = 'Fire',
  WATER = 'Water',
  GRASS = 'Grass',
  LIGHTNING = 'Lightning',
  PSYCHIC = 'Psychic',
  FIGHTING = 'Fighting',
  DARKNESS = 'Darkness',
  METAL = 'Metal',
  DRAGON = 'Dragon',
  FAIRY = 'Fairy',
}

export enum BattleState {
  PREPARATION = 'preparation',
  PLAYER_TURN = 'player_turn',
  AI_TURN = 'ai_turn',
  PLAYER_WIN = 'player_win',
  AI_WIN = 'ai_win',
  DRAW = 'draw',
}

export enum ActionType {
  PLAY_CARD = 'play_card',
  ATTACH_ENERGY = 'attach_energy',
  ATTACK = 'attack',
  END_TURN = 'end_turn',
  SWITCH_ACTIVE = 'switch_active',
  PROMOTE_FROM_BENCH = 'promote_from_bench', // NEW: Bench promotion action
}

// ================================
// CARD DATA TYPES
// ================================

export interface CardAttack {
  name: string;
  damage: number;
  cost: string[];
  description?: string;
}

export interface CardWeakness {
  type: string;
  value: string;
}

export interface CardResistance {
  type: string;
  value: string;
}

export interface CardData {
  tokenId: number;
  tcgId: string;
  name: string;
  smallImage: string;
  largeImage: string;
  type: string;
  hp: number;
  attacks: CardAttack[];
  weaknesses: CardWeakness[];
  resistances: CardResistance[];
  rarity: string;
}

// ================================
// BATTLE SYSTEM TYPES
// ================================

export interface BattleCard {
  id: string;
  tokenId: string;
  name: string;
  type: string;
  hp: number;
  maxHp: number;
  attacks: CardAttack[];
  weaknesses: CardWeakness[];
  resistances: CardResistance[];
  energies: string[]; // Array of energy types attached
  status?: 'active' | 'bench' | 'hand' | 'deck' | 'discard';
  position?: number; // Position on bench (0-2)
}

export interface BattleAction {
  type: ActionType;
  cardId?: string;
  targetId?: string;
  attackIndex?: number;
  energyType?: string;
  fromPosition?: number;
  toPosition?: number;
  benchPosition?: number; // NEW: For bench promotion
  metadata?: Record<string, any>;
}

export interface BattlePlayer {
  id: string;
  name: string;
  isAI: boolean;
  activeCard: BattleCard | null;
  benchCards: (BattleCard | null)[]; // Max 3 bench slots
  handCards: BattleCard[];
  deckCards: BattleCard[];
  discardCards: BattleCard[];
  energiesThisTurn: number; // Track energy attachments per turn
  prizesRemaining: number; // Pokemon defeated (win when reach 2)
}

export interface BattleGame {
  id: string;
  state: BattleState;
  turn: number;
  currentPlayer: 'player' | 'ai';
  player: BattlePlayer;
  ai: BattlePlayer;
  winner?: 'player' | 'ai' | 'draw';
  createdAt: Date;
  updatedAt: Date;
  lastAction?: BattleAction;
}

// ================================
// NEW BATTLE RULES TYPES
// ================================

export interface BattlePhaseRules {
  canPlaceActiveFromHand: boolean;
  canPlaceBenchFromHand: boolean;
  canPromoteFromBench: boolean;
  requiresActiveReplacement: boolean;
}

export interface BenchPromotionInfo {
  side: 'PLAYER' | 'AI';
  required: boolean;
  availableOptions: Array<{
    cardId: string;
    position: number;
    cardData: BattleCard;
  }>;
}

export interface GameEndCondition {
  type: 'PRIZE_LIMIT' | 'NO_POKEMON' | 'CONCEDE' | 'TIMEOUT';
  winner: 'PLAYER' | 'AI' | 'DRAW';
  details: string;
}

// ================================
// AI OPPONENT TYPES
// ================================

export interface AIOpponent {
  id: string;
  name: string;
  difficulty: Difficulty;
  element: Element;
  description: string;
  image: string;
  deckCards: string[]; // Array of tokenIds
  unlocked: boolean;
  rewards: {
    gems: number;
    xp: number;
  };
  winCondition?: string;
}

// ================================
// PROGRESS & UNLOCKS
// ================================

export interface UserProgress {
  userId: string;
  difficulty: Difficulty;
  element: Element;
  wins: number;
  losses: number;
  bestTime?: number; // Fastest win in seconds
  unlocked: boolean;
  firstWinAt?: Date;
  lastPlayedAt?: Date;
}

// ================================
// API REQUEST/RESPONSE TYPES
// ================================

export interface CreateBattleRequest {
  opponentId: string;
  userDeckId: string;
}

export interface CreateBattleResponse {
  battleId: string;
  battle: BattleGame;
}

export interface BattleActionRequest {
  battleId: string;
  action: BattleAction;
}

export interface BattleActionResponse {
  battle: BattleGame;
  success: boolean;
  error?: string;
  needsBenchPromotion?: BenchPromotionInfo; // NEW: Indicate if promotion is needed
}

export interface GetOpponentsRequest {
  difficulty: Difficulty;
}

export interface GetOpponentsResponse {
  opponents: AIOpponent[];
  userProgress: UserProgress[];
}

// ================================
// BATTLE VALIDATION TYPES
// ================================

export interface ActionValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export interface GameStateValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canContinue: boolean;
}

// ================================
// UTILITY TYPES
// ================================

export type ElementType = keyof typeof Element;
export type DifficultyType = keyof typeof Difficulty;

// Helper function to check if value is valid enum
export function isValidDifficulty(value: string): value is Difficulty {
  return Object.values(Difficulty).includes(value as Difficulty);
}

export function isValidElement(value: string): value is Element {
  return Object.values(Element).includes(value as Element);
}

// NEW: Helper functions for battle rules
export function getPhaseRules(phase: string): BattlePhaseRules {
  switch (phase) {
    case 'PREPARATION':
      return {
        canPlaceActiveFromHand: true,
        canPlaceBenchFromHand: true,
        canPromoteFromBench: false,
        requiresActiveReplacement: false,
      };
    case 'PLAYER_TURN':
    case 'AI_TURN':
      return {
        canPlaceActiveFromHand: false,
        canPlaceBenchFromHand: true,
        canPromoteFromBench: true,
        requiresActiveReplacement: true,
      };
    case 'ENDED':
      return {
        canPlaceActiveFromHand: false,
        canPlaceBenchFromHand: false,
        canPromoteFromBench: false,
        requiresActiveReplacement: false,
      };
    default:
      return {
        canPlaceActiveFromHand: false,
        canPlaceBenchFromHand: false,
        canPromoteFromBench: false,
        requiresActiveReplacement: false,
      };
  }
}

export function isActionAllowedInPhase(
  actionType: string,
  phase: string
): boolean {
  const rules = getPhaseRules(phase);

  switch (actionType) {
    case 'PLACE_ACTIVE':
      return rules.canPlaceActiveFromHand;
    case 'PLACE_BENCH':
      return rules.canPlaceBenchFromHand;
    case 'PROMOTE_FROM_BENCH':
      return rules.canPromoteFromBench;
    case 'ATTACH_ENERGY':
    case 'ATTACK':
    case 'END_TURN':
      return phase === 'PLAYER_TURN' || phase === 'AI_TURN';
    case 'CONCEDE':
      return phase !== 'ENDED';
    default:
      return false;
  }
}

// Constants for game rules
export const GAME_CONSTANTS = {
  MAX_DECK_SIZE: 10,
  MAX_HAND_SIZE: 7,
  MAX_BENCH_SIZE: 3,
  INITIAL_HAND_SIZE: 5,
  WIN_CONDITION_PRIZES: 2,
  MAX_ENERGY_PER_TURN: 1,
  TURN_TIME_LIMIT: 60, // seconds
} as const;

// NEW: Battle rule constants
export const BATTLE_RULES = {
  // Phase-specific rules
  PREPARATION_PHASE: {
    CAN_PLACE_ACTIVE_FROM_HAND: true,
    CAN_PLACE_BENCH_FROM_HAND: true,
    CAN_PROMOTE_FROM_BENCH: false,
  },
  BATTLE_PHASE: {
    CAN_PLACE_ACTIVE_FROM_HAND: false,
    CAN_PLACE_BENCH_FROM_HAND: true,
    CAN_PROMOTE_FROM_BENCH: true,
  },

  // Win/Loss conditions
  WIN_CONDITIONS: {
    DEFEAT_POKEMON_COUNT: 2,
    NO_ACTIVE_NO_BENCH: true, // Lose if no active and no bench Pokemon
  },

  // Action restrictions
  ENERGY_ATTACHMENT: {
    MAX_PER_TURN: 1,
    REQUIRES_POKEMON_IN_PLAY: true,
  },

  // Knockout rules
  KNOCKOUT_RULES: {
    ACTIVE_KO_REQUIRES_REPLACEMENT: true,
    MUST_PROMOTE_FROM_BENCH: true,
    NO_BENCH_EQUALS_LOSS: true,
  },
} as const;
