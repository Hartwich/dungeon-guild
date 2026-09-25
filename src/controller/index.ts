import type { ControllerLayoutKey } from "@open-party-lab/game-core";
import { dungeonGuildManifest } from "../manifest.js";
import type { DungeonGuildClientState, DungeonGuildInput, GuildCard } from "../protocol.js";

interface ControllerContext {
  state: {
    room?: { language?: "de" | "en" } | null;
    player?: { id: string; name?: string } | null;
    game?: { phase?: string; roundNumber?: number; message?: string; state?: unknown } | null;
  };
  onInput(input: unknown): void;
}

function layoutCard(card: GuildCard, playable = false, hint?: string) {
  return {
    id: card.id,
    title: card.title,
    kind: card.kind,
    artPath: card.artPath ?? "/dungeon-guild/cards/" + encodeURIComponent(card.id) + ".svg",
    effect: card.effect,
    level: card.level,
    bonus: card.bonus,
    levelReward: card.levelReward,
    escapeTarget: card.escapeTarget,
    badStuff: card.badStuff,
    goldValue: card.goldValue,
    slot: card.slot,
    equipped: card.equipped,
    playable,
    hint
  };
}

export const controllerGame = {
  id: dungeonGuildManifest.id,
  layoutKey: "dungeon_guild" as ControllerLayoutKey,
  buildLayout({ state, onInput }: ControllerContext) {
    const playerId = state.player?.id ?? "";
    const game = (state.game?.state ?? {}) as Partial<DungeonGuildClientState>;
    const en = state.room?.language === "en";
    const own = game.players?.find((player) => player.id === playerId);
    const active = game.activePlayerId === playerId;
    const isPlaying = state.game?.phase === "playing";
    const input = (value: DungeonGuildInput) => onInput({ ...value, playerId, sentAt: Date.now() });
    return {
      kind: "dungeon_guild",
      language: state.room?.language,
      disabled: !isPlaying,
      resetKey: String(state.game?.roundNumber ?? 0),
      title: en ? "Dungeon Guild" : "Dungeon-Gilde",
      playerName: own?.name ?? state.player?.name ?? (en ? "Adventurer" : "Abenteurer"),
      activePlayerName: game.activePlayerName ?? undefined,
      stage: game.stage ?? "door",
      canAct: Boolean(isPlaying && game.canAct),
      ownLevel: game.ownLevel ?? own?.level ?? 1,
      ownStrength: game.ownStrength ?? own?.strength ?? 1,
      dead: Boolean(own?.dead),
      classCard: own?.classCard ? layoutCard(own.classCard) : null,
      raceCard: own?.raceCard ? layoutCard(own.raceCard) : null,
      equipment: (own?.equipment ?? []).map((card) => layoutCard(card)),
      hand: (game.hand ?? []).map((card) => layoutCard(card.guildCard, card.playable, card.hint)),
      actions: game.actions ?? [],
      message: game.message ?? state.game?.message,
      lastError: game.lastError,
      gameOver: Boolean(game.gameOver),
      winnerName: game.winnerName,
      onPlayCard(cardId: string) {
        input({ type: "dungeon-guild:play", playerId, cardId, sentAt: Date.now() });
      },
      onAction(actionId: string) {
        input({ type: "dungeon-guild:action", playerId, actionId, sentAt: Date.now() });
      }
    };
  }
} as const;
