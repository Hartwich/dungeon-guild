import type { LocalizedGameTextMap } from "@open-party-lab/game-core";

export const dungeonGuildText = {
  de: {
    displayName: "Dungeon-Gilde",
    description: "Öffnet Türen, sammelt Ausrüstung und schließt wacklige Bündnisse. Wer zuerst Stufe 10 erreicht, gewinnt."
  },
  en: {
    displayName: "Dungeon Guild",
    description: "Open doors, collect equipment and form uneasy alliances. The first player to reach level 10 wins.",
    lobbySetup: {
      title: "Game variants",
      fields: {
        winningHelp: { label: "Allow help while already winning", description: "Allow an actual helper even if the party is already stronger. Off: ask for help only while not winning." },
        fastPlay: { label: "Faster play", description: "Draw an extra hidden Door at turn start. Loot the Room draws a Treasure instead of a Door." }
      }
    },
    visual: { eyebrow: "Dungeon & loot" }
  }
} as const satisfies LocalizedGameTextMap;
