import type {
  CardTableActionState,
  CardTableHandCardState,
  CardTableStackState
} from "@open-party-lab/protocol";
import type { BaseRoundState } from "@open-party-lab/game-core";

export type DungeonGuildStage = "door" | "combat" | "help" | "loot" | "main" | "finished";
export interface GuildCard {
  id: string;
  title: string;
  kind: "monster" | "curse" | "class" | "race" | "item" | "boost" | "level";
  level?: number;
  bonus?: number;
  levelReward?: number;
  escapeTarget?: number;
  badStuff?: "lose-level" | "lose-two" | "lose-gear" | "death";
  goldValue?: number;
  slot?: "head" | "body" | "hands" | "feet" | "other";
  oneHand?: boolean;
  twoHand?: boolean;
  equipped?: boolean;
  effect?: string;
  color: "red" | "black" | "green" | "blue" | "yellow" | "neutral";
}
export interface GuildPlayerState {
  id: string;
  name: string;
  color: string;
  level: number;
  classCard: GuildCard | null;
  raceCard: GuildCard | null;
  equipment: GuildCard[];
  hand: GuildCard[];
  connected: boolean;
  dead?: boolean;
}
export interface GuildState extends BaseRoundState {
  currentIndex: number;
  stage: DungeonGuildStage;
  players: GuildPlayerState[];
  doorDeck: GuildCard[];
  doorDiscard: GuildCard[];
  treasureDeck: GuildCard[];
  treasureDiscard: GuildCard[];
  currentMonster: GuildCard | null;
  monsterBonuses: number;
  helperId: string | null;
  helperOffer: number;
  helpEndsAt: number | null;
  faceDownLoot: string[];
  doorCombat: boolean;
  roomLooted: boolean;
  turnNumber: number;
  message: string;
  winnerId?: string;
}
export interface GuildPublicPlayer extends Omit<GuildPlayerState, "hand"> { handCount: number; strength: number; }
export interface DungeonGuildPublicState {
  rulesetId: string;
  title: string;
  deckLabel: string;
  backStyle: "diamond";
  cardStyle: "modern";
  rules: Array<{ title: string; lines: string[] }>;
  seats: Array<{ playerId: string; name: string; color: string; connected: boolean; handCount: number; score: number; isActive: boolean }>;
  stacks: CardTableStackState[];
  activePlayerId: string | null;
  activePlayerName: string | null;
  direction: 1 | -1;
  turnNumber: number;
  hostActions: CardTableActionState[];
  conditionLabel?: string;
  statusMessage?: string;
  log: Array<{ id: string; playerName: string | null; text: string }>;
  gameOver: boolean;
  winnerPlayerId?: string;
  winnerName?: string;
  stage: DungeonGuildStage;
  players: GuildPublicPlayer[];
  currentMonster: GuildCard | null;
  monsterBonuses: number;
  helperName: string | null;
  helperOffer: number;
  helpEndsAt: number | null;
  faceDownLoot: number;
  message: string;
}
export interface DungeonGuildControllerState extends DungeonGuildPublicState {
  stage: DungeonGuildStage;
  currentMonster: GuildCard | null;
  ownLevel: number;
  ownStrength: number;
  ownHand: GuildCard[];
  canAct: boolean;
  actions: CardTableActionState[];
  hand: DungeonGuildHandCard[];
  pendingChoiceCardIds: string[];
  privateNote?: string;
  lastError?: string;
}
export interface DungeonGuildHandCard extends CardTableHandCardState {
  guildCard: GuildCard;
}
export type DungeonGuildClientState = DungeonGuildControllerState;
export type DungeonGuildInput =
  | { type: "dungeon-guild:action"; playerId: string; actionId: string; sentAt: number }
  | { type: "dungeon-guild:play"; playerId: string; cardId: string; targetId?: string; sentAt: number };
