import { dungeonGuildText } from "./catalogText.js";
import type { GameManifest } from "@open-party-lab/game-core";

export const dungeonGuildManifest = {
  id: "dungeon-guild",
  translations: dungeonGuildText,
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
  controllerChrome: { bare: true },
  lobbySetup: {
    title: "Spielvarianten",
    fields: [
      { kind: "toggle", id: "winningHelp", settingKey: "dungeonGuildWinningHelp", label: "Hilfe auch bei gewinnendem Kampf", description: "Erlaubt eine echte Hilfsperson, obwohl die Gruppe schon stärker ist. Aus: Hilfe nur, solange du nicht gewinnst.", onValue: "on", offValue: "off", defaultValue: "off" },
      { kind: "toggle", id: "fastPlay", settingKey: "dungeonGuildFastPlay", label: "Schnellspiel", description: "Zu Zugbeginn eine zusätzliche verdeckte Türkarte. Raumplündern zieht einen Schatz statt einer Türkarte.", onValue: "on", offValue: "off", defaultValue: "off" }
    ]
  }
} as const satisfies GameManifest;

export const manifest = dungeonGuildManifest;
