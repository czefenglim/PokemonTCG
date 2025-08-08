// types/Battle.ts

export type Card = {
  id: string;
  name: string;
  hp: number;
  attack: number;
  imageUrl?: string;
};

export type PlayerBattleState = {
  id: string;
  name: string;
  avatar: string;
  deck: Card[];
  hand: Card[];
  activeCard?: Card;
  bench: Card[];
};

export type BattleData = {
  roomId: string;
  currentTurnPlayerId: string;
  turnNumber: number;
  player1: PlayerBattleState;
  player2: PlayerBattleState;
  lastAction?: string;
};
