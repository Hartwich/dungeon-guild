import type { LocalizedGameTextMap } from "@open-party-lab/game-core";

export const dungeonGuildText = {
  de: {
    displayName: "Dungeon-Gilde",
    description: "Öffnet Türen, sammelt Ausrüstung und schließt wacklige Bündnisse. Wer zuerst Stufe 10 erreicht, gewinnt."
  },
  en: {
    displayName: "Dungeon Guild",
    description: "Open doors, collect equipment and form uneasy alliances. The first player to reach level 10 wins.",
    visual: { eyebrow: "Dungeon & loot" }
  }
} as const satisfies LocalizedGameTextMap;
