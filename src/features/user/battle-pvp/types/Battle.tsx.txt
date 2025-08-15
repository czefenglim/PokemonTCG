// types/Battle.ts

export interface Attack {
  name: string;
  damage: number;
  cost: string[];
}

export interface Card {
  tokenId: number;
  tcgId: string;
  name: string;
  imageUrl: string;
  maxHp: number;
  hp: number;
  attacks: Attack[];
  type: string;
  rarity: string;
  owner?: string;
}

export interface Energy {
  id: string;
  type: string;
}

export interface PlayerBattleState {
  id: string;
  name: string;
  avatar: string;
  deckId: string;
  active: Card | null;
  hand: Card[];
  deck: Card[];
  bench: (Card | null)[];
  energy: number;
  attachedEnergies: { [cardId: string]: Energy[] };
}

export interface BattleAction {
  type:
    | "PLAY_CARD"
    | "ATTACK"
    | "ATTACH_ENERGY"
    | "SWITCH_ACTIVE"
    | "END_TURN"
    | "SURRENDER";
  data: any;
}

export interface BattleData {
  roomId: string;
  currentTurnPlayerId: string;
  turnNumber: number;
  gamePhase: "setup" | "playing" | "finished";
  lastAction?: {
    type: string;
    playerId: string;
    timestamp: number;
    [key: string]: any;
  };
  winner?: string;
  players: {
    [playerId: string]: PlayerBattleState;
  };
}

export interface RoomState {
  id?: string;
  name?: string;
  status?: string;
  timer?: number;
  timerActive?: boolean;
  player1?: {
    id: string;
    name: string;
    avatar: string;
    confirmed: boolean;
    deckId?: string;
    present: boolean;
    walletAddress?: string;
  } | null;
  player2?: {
    id: string;
    name: string;
    avatar: string;
    confirmed: boolean;
    deckId?: string;
    present: boolean;
    walletAddress?: string;
  } | null;
}

export interface BattleResult {
  winnerId: string;
  loserId: string;
  winnerCard?: Card;
  loserCard?: Card;
  message: string;
  battleData?: BattleData;
}

// Socket event types
export interface SocketEvents {
  // Room events
  joinRoom: (data: { roomId: string; player: any }) => void;
  ROOM_STATE_UPDATE: (roomState: RoomState) => void;
  ROOM_STATE_SYNC: (roomState: RoomState) => void;
  PLAYER_JOINED: (roomState: RoomState) => void;
  PLAYER_DISCONNECTED: (data: { playerId: string }) => void;

  // Deck selection events
  SELECT_DECK: (data: {
    roomId: string;
    playerId: string;
    deckId: string;
    deckName: string;
  }) => void;
  CONFIRM_DECK: (data: {
    roomId: string;
    playerId: string;
    deckId: string;
    cards: any[];
  }) => void;
  DECK_SELECTED: (data: {
    playerId: string;
    deckId: string;
    deckName: string;
  }) => void;
  PLAYER_CONFIRMED: (data: { playerId: string; deckId: string }) => void;
  AUTO_PICK_DECK: (deck: any) => void;

  // Battle events
  BATTLE_START: (battleData: BattleData) => void;
  BATTLE_ACTION: (data: {
    roomId: string;
    playerId: string;
    action: BattleAction;
  }) => void;
  BATTLE_STATE_UPDATE: (battleData: BattleData) => void;
  BATTLE_COMPLETED: (result: {
    winner: string;
    battleState: BattleData;
  }) => void;
  BATTLE_RESULT: (result: BattleResult) => void;
  BATTLE_ACTION_ERROR: (data: { action: BattleAction; error: string }) => void;

  // Timer events
  TIMER_TICK: (timeLeft: number) => void;
  TIMER_END: () => void;
  TIMER_SYNC: (data: { timer: number; timerActive: boolean }) => void;
  REQUEST_TIMER: (data: { roomId: string }) => void;

  // Request events
  REQUEST_ROOM_STATE: (data: { roomId: string }) => void;
  REQUEST_BATTLE_DATA: (data: { roomId: string }) => void;

  // Error events
  error: (message: string) => void;
}

// Battle action data types
export interface PlayCardActionData {
  cardIndex: number;
  targetSlot: "active" | number; // number for bench index
}

export interface AttackActionData {
  attackIndex: number;
}

export interface AttachEnergyActionData {
  energyType: string;
  targetCardId: string;
}

export interface SwitchActiveActionData {
  benchIndex: number;
}

export interface EndTurnActionData {
  // No additional data needed
}

export interface SurrenderActionData {
  // No additional data needed
}

// Energy types
export const ENERGY_TYPES = [
  { type: "Fire", color: "from-red-500 to-orange-600", symbol: "🔥" },
  { type: "Water", color: "from-blue-500 to-cyan-600", symbol: "💧" },
  { type: "Grass", color: "from-green-500 to-emerald-600", symbol: "🌿" },
  { type: "Electric", color: "from-yellow-400 to-amber-500", symbol: "⚡" },
  { type: "Psychic", color: "from-purple-500 to-pink-600", symbol: "🔮" },
  { type: "Fighting", color: "from-orange-600 to-red-700", symbol: "👊" },
  { type: "Colorless", color: "from-gray-400 to-slate-500", symbol: "⭐" },
] as const;

export type EnergyType = (typeof ENERGY_TYPES)[number]["type"];

// Game phases
export type GamePhase = "setup" | "playing" | "finished";

// Battle status
export type BattleStatus =
  | "waiting"
  | "deck-selection"
  | "in-progress"
  | "finished";

// Player actions that can be performed during battle
export type PlayerAction =
  | { type: "PLAY_CARD"; data: PlayCardActionData }
  | { type: "ATTACK"; data: AttackActionData }
  | { type: "ATTACH_ENERGY"; data: AttachEnergyActionData }
  | { type: "SWITCH_ACTIVE"; data: SwitchActiveActionData }
  | { type: "END_TURN"; data: EndTurnActionData }
  | { type: "SURRENDER"; data: SurrenderActionData };

// Utility types for type safety
export type PlayerId = string;
export type RoomId = string;
export type DeckId = string;
export type CardId = string;
