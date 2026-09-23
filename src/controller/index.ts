import type { ControllerLayoutKey } from "@open-party-lab/game-core";
import { dungeonGuildManifest } from "../manifest.js";
import type { DungeonGuildClientState, DungeonGuildInput } from "../protocol.js";

interface ControllerContext { state: { room?: { language?: "de" | "en" } | null; player?: { id: string } | null; game?: { phase?: string; roundNumber?: number; message?: string; state?: unknown } | null }; onInput(input: unknown): void; }

export const controllerGame = {
  id: dungeonGuildManifest.id,
  layoutKey: "card_hand" as ControllerLayoutKey,
  buildLayout({ state, onInput }: ControllerContext) {
    const playerId = state.player?.id ?? "";
    const game = (state.game?.state ?? {}) as Partial<DungeonGuildClientState>;
    const en = state.room?.language === "en";
    const active = game.activePlayerId === playerId;
    const isPlaying = state.game?.phase === "playing";
    const input = (value: DungeonGuildInput) => onInput({ ...value, playerId, sentAt: Date.now() });
    return {
      kind: "card_hand",
      title: en ? "Dungeon Guild" : "Dungeon-Gilde",
      subtitle: active ? (en ? "Your move" : "Du bist am Zug") : `${en ? "Turn" : "Am Zug"}: ${game.activePlayerName ?? "…"}`,
      helperText: game.message ?? (en ? "Your cards are private. The shared table shows the party." : "Deine Karten bleiben geheim. Den gemeinsamen Tisch sehen alle."),
      language: state.room?.language,
      disabled: !isPlaying || !game.canAct,
      canAct: Boolean(isPlaying && game.canAct),
      resetKey: `${state.game?.roundNumber ?? 0}:${game.turnNumber ?? 0}:${game.stage ?? ""}`,
      deckLabel: en ? "Doors & treasure" : "Türen & Schätze",
      backStyle: "diamond",
      cardStyle: "modern",
      hand: (game.hand ?? []).map((card) => ({ ...card, hint: card.playable ? undefined : (en ? "Cannot play this now." : "Jetzt nicht spielbar.") })),
      stacks: game.stacks ?? [],
      seats: game.seats ?? [],
      actions: game.actions ?? [],
      currentPlayerId: playerId,
      activePlayerId: game.activePlayerId ?? null,
      activePlayerName: game.activePlayerName ?? null,
      direction: 1,
      turnNumber: game.turnNumber ?? 0,
      pendingChoiceCardIds: [],
      privateNote: game.privateNote ?? (game.ownLevel ? `${en ? "Level" : "Stufe"} ${game.ownLevel} · ${en ? "Strength" : "Kampfstärke"} ${game.ownStrength}` : undefined),
      log: game.log ?? [],
      lastError: game.lastError,
      gameOver: Boolean(game.gameOver),
      winnerName: game.winnerName,
      onPlayCard(cardId: string) { input({ type: "dungeon-guild:play", playerId, cardId, sentAt: Date.now() }); },
      onDraw() {},
      onAction(actionId: string) { input({ type: "dungeon-guild:action", playerId, actionId, sentAt: Date.now() }); }
    };
  }
} as const;
