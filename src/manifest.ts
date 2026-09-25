import type { GameManifest } from "@open-party-lab/game-core";

export const dungeonGuildManifest = {
  id: "dungeon-guild",
  displayName: "Dungeon-Gilde",
  description: "Öffnet Türen, sammelt Ausrüstung und schließt wacklige Bündnisse. Wer zuerst Stufe 10 erreicht, gewinnt.",
  minPlayers: 3,
  maxPlayers: 6,
  hostView: "DungeonGuildHostScene",
  controllerView: "dungeon-guild",
  controllerLayout: "dungeon_guild",
  supportsTeams: false,
  estimatedRoundDurationMs: 1_200_000,
  roundCompletionMode: "wait_for_ready",
  scoreScope: "game",
  ownsScreens: ["round_intro", "result"],
  phaseDurations: { roundIntroMs: 1_500, countdownMs: 1_000, resultMs: 5_000, scoreboardMs: 5_000 },
  visual: { accent: "#a86537", icon: "cards", eyebrow: "Dungeon & Beute" },
  audio: { track: { profile: "gentle", bpm: 98, rootMidi: 52, masterGain: 0.1 } },
  controllerChrome: { bare: true }
} as const satisfies GameManifest;

export const manifest = dungeonGuildManifest;
