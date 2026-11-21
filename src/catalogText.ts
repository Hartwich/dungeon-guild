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
  },
  es: {
    displayName: "Gremio de mazmorras",
    description: "Abre puertas, reúne equipo y forma alianzas frágiles. Gana quien llegue primero al nivel 10.",
    lobbySetup: {
      title: "Variantes de juego",
      fields: {
        winningHelp: { label: "Permitir ayuda aunque ya estés ganando", description: "Permite que alguien ayude incluso si el grupo ya tiene más fuerza. Desactivado: solo se pide ayuda si no vas ganando." },
        fastPlay: { label: "Partida rápida", description: "Roba una puerta adicional boca abajo al inicio del turno. Saquear la sala roba un tesoro en vez de una puerta." }
      }
    },
    visual: { eyebrow: "Mazmorra y botín" }
  },
  fr: {
    displayName: "Guilde du donjon",
    description: "Ouvrez des portes, récupérez de l’équipement et concluez des alliances fragiles. Le premier au niveau 10 gagne.",
    lobbySetup: {
      title: "Variantes de jeu",
      fields: {
        winningHelp: { label: "Autoriser l’aide même en tête", description: "Permet à un véritable allié d’aider même si le groupe est déjà plus fort. Désactivé : l’aide n’est demandée que si vous ne gagnez pas." },
        fastPlay: { label: "Partie rapide", description: "Piochez une porte supplémentaire face cachée au début du tour. Fouiller la salle fait piocher un trésor au lieu d’une porte." }
      }
    },
    visual: { eyebrow: "Donjon et butin" }
  },
  "pt-BR": {
    displayName: "Guilda da masmorra",
    description: "Abra portas, reúna equipamentos e forme alianças instáveis. Vence quem chegar primeiro ao nível 10.",
    lobbySetup: {
      title: "Variantes de jogo",
      fields: {
        winningHelp: { label: "Permitir ajuda mesmo estando à frente", description: "Permite que alguém ajude mesmo quando o grupo já tem mais força. Desativado: só peça ajuda quando não estiver vencendo." },
        fastPlay: { label: "Jogo rápido", description: "Compre uma porta extra virada para baixo no início do turno. Vasculhar a sala compra um tesouro em vez de uma porta." }
      }
    },
    visual: { eyebrow: "Masmorra e tesouro" }
  }
} as const satisfies LocalizedGameTextMap;
