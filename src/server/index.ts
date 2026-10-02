import {
  createBaseRoundState,
  transitionRoundState,
  type ScoreEntry,
  type ServerGame,
  type ServerGameContext
} from "@open-party-lab/game-core";
import type { CardTableActionState, CardTableCardState, CardTableStackState } from "@open-party-lab/protocol";
import { dungeonGuildManifest } from "../manifest.js";
import type { DungeonGuildInput, DungeonGuildPublicState, GuildCard, GuildCombatSide, GuildPlayerState, GuildState } from "../protocol.js";

const COMBAT_REACTION_MS = 6_000;

const doors: GuildCard[] = [
  ...[
    ["Mimic mit Fernweh", 2, 1], ["Kobold-Buchhalter", 3, 1], ["Sumpfpoet", 4, 1],
    ["Gewitterziege", 4, 1], ["Schlafender Golem", 5, 1], ["Drei freche Skelette", 6, 1],
    ["Archivarin der Tiefe", 6, 2], ["Krötenritter", 7, 2], ["Käsekönig", 8, 2],
    ["Nebelhexe", 8, 2], ["Der sehr alte Drache", 10, 2], ["Steinbeißer", 11, 2],
    ["Schrank des Schreckens", 12, 2], ["Mondfresser", 14, 2]
  ].flatMap(([name, level, reward], group) => Array.from({ length: group < 4 ? 2 : 1 }, (_, i) => ({
    id: `door-monster-${group}-${i}`, title: String(name), kind: "monster" as const,
    level: Number(level), levelReward: group === 10 ? 2 : 1, goldValue: Number(reward), escapeTarget: group >= 12 ? 6 : 5,
    badStuff: group >= 12 ? "death" as const : group >= 9 ? "lose-gear" as const : group >= 7 ? "lose-two" as const : "lose-level" as const,
    effect: `Sieg: ${reward} Schatzkarten.`, color: "red" as const
  }))),
  ...["Stolperfluch", "Verhexter Helm", "Rostige Rüstung", "Falsche Wegbeschreibung", "Kalte Füße", "Verlorener Rucksack"].map((title, i) => ({ id: `door-curse-${i}`, title, kind: "curse" as const, effect: "Verliere eine Stufe.", color: "black" as const })),
  ...["Zauberin", "Waldläufer", "Erfinderin", "Bardin"].map((title, i) => ({ id: `door-class-${i}`, title, kind: "class" as const, effect: `Klasse: +${i === 0 ? 2 : 1} Kampfstärke.`, bonus: i === 0 ? 2 : 1, color: "blue" as const })),
  ...["Menschling", "Waldvolk", "Bergvolk", "Wolkenkind"].map((title, i) => ({ id: `door-race-${i}`, title, kind: "race" as const, effect: `Herkunft: +${i === 1 ? 2 : 1} Kampfstärke.`, bonus: i === 1 ? 2 : 1, color: "green" as const })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: `door-level-${i}`, title: `Erfahrungsfunke ${i + 1}`, kind: "level" as const, effect: "Steige eine Stufe auf.", color: "yellow" as const }))
];

const treasures: GuildCard[] = [
  ...[
    ["Deckelhelm", 2, "head", 1], ["Kesselpanzer", 3, "body", 1], ["Siebenmeilen-Socken", 2, "feet", 1],
    ["Mondspalter", 4, "hands", 2], ["Krabbenklaue", 3, "hands", 1], ["Zauberstab der Umwege", 2, "hands", 1],
    ["Taschendrache", 3, "other", 1], ["Glücksamulet", 1, "other", 1], ["Riesenschlüssel", 5, "hands", 2],
    ["Tarnumhang", 2, "body", 1], ["Trampelstiefel", 3, "feet", 1], ["Kronleuchter-Schild", 2, "hands", 1]
  ].flatMap(([title, bonus, slot, hands], i) => [0, 1].map((copy) => ({
    id: `treasure-item-${i}-${copy}`, title: String(title), kind: "item" as const, bonus: Number(bonus),
    slot: String(slot) as GuildCard["slot"], oneHand: Number(hands) === 1, twoHand: Number(hands) === 2,
    goldValue: Number(bonus) >= 4 ? 1500 : 1000, effect: `Ausrüstung: +${bonus} Stärke.`, color: "yellow" as const
  }))),
  ...["Konfettiorkan", "Riesenrübe", "Wackelpuddingkanone", "Tausendjährige Socke", "Mutmachmarmelade", "Klebeschleim"].map((title, i) => ({ id: `treasure-boost-${i}`, title, kind: "boost" as const, bonus: i % 2 ? 4 : 3, effect: `Einmalig im Kampf: +${i % 2 ? 4 : 3} Stärke.`, color: "red" as const })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: `treasure-level-${i}`, title: `Abenteurer-Urkunde ${i + 1}`, kind: "level" as const, effect: "Steige eine Stufe auf.", color: "blue" as const }))
];

function shuffle<T>(items: T[], seed: number): T[] {
  const result = [...items]; let x = (seed >>> 0) || 0x9e3779b9;
  for (let i = result.length - 1; i > 0; i -= 1) { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; const j = (x >>> 0) % (i + 1); [result[i], result[j]] = [result[j]!, result[i]!]; }
  return result;
}
function draw(deck: GuildCard[], discard: GuildCard[]): GuildCard | undefined {
  if (!deck.length && discard.length) deck.push(...shuffle(discard.splice(0), Date.now()));
  return deck.shift();
}
function isHuman(context: ServerGameContext, id: string): boolean { return context.players.some((p) => p.id === id); }
function current(state: GuildState): GuildPlayerState { return state.players[state.currentIndex]!; }
function gearStrength(player: GuildPlayerState): number {
  return player.level + (player.classCard?.bonus ?? 0) + (player.raceCard?.bonus ?? 0) + player.equipment.reduce((sum, card) => sum + (card.equipped === false ? 0 : card.bonus ?? 0), 0);
}
function equipItem(player: GuildPlayerState, card: GuildCard): GuildPlayerState {
  const rest = player.equipment.filter((item) => item.id !== card.id);
  const occupied = rest.filter((item) => item.equipped !== false && item.slot === card.slot);
  const replaced = new Set<string>();
  if (card.slot === "hands") {
    let used = occupied.reduce((sum, item) => sum + (item.twoHand ? 2 : 1), 0);
    for (const item of [...occupied].reverse()) {
      if (used + (card.twoHand ? 2 : 1) <= 2) break;
      replaced.add(item.id);
      used -= item.twoHand ? 2 : 1;
    }
  } else occupied.forEach((item) => replaced.add(item.id));
  return { ...player, equipment: [...rest.map((item) => replaced.has(item.id) ? { ...item, equipped: false } : item), { ...card, equipped: true }] };
}
function partyStrength(state: GuildState): number {
  const helper = state.players.find((player) => player.id === state.helperId);
  return gearStrength(current(state)) + (state.partyBonuses ?? 0) + (helper ? gearStrength(helper) : 0);
}
function monsterStrength(state: GuildState): number {
  return (state.currentMonster?.level ?? 0) + state.monsterBonuses;
}
function canPlay(state: GuildState, player: GuildPlayerState, card: GuildCard): boolean {
  if (state.phase !== "playing" || player.dead) return false;
  if (state.currentMonster && (state.stage === "combat" || state.stage === "help")) return card.kind === "boost";
  if (current(state).id !== player.id || (state.stage !== "door" && state.stage !== "main")) return false;
  if (card.kind === "boost") return false;
  if (card.kind === "monster") return state.stage === "main" && !state.roomLooted && !state.doorCombat;
  return card.kind !== "level" || player.level < 9;
}
function recordPlay(state: GuildState, player: GuildPlayerState, card: GuildCard, playedAt: number, combatSide?: GuildCombatSide): GuildState {
  const playNumber = (state.playNumber ?? 0) + 1;
  return { ...state, playNumber, tablePlays: [...(state.tablePlays ?? []), { id: `play-${playNumber}`, card, playerId: player.id, playerName: player.name, combatSide, playedAt }].slice(-4) };
}
function recordEscape(state: GuildState, player: GuildPlayerState, monster: GuildCard, roll: number, success: boolean, occurredAt: number): GuildState {
  const escapeNumber = (state.escapeNumber ?? 0) + 1;
  const badStuff = monster.badStuff === "lose-gear" && !player.equipment.length ? "lose-level" : monster.badStuff;
  return { ...state, escapeNumber, lastEscape: { id: `escape-${escapeNumber}`, playerName: player.name, roll, target: monster.escapeTarget ?? 5, success, badStuff, occurredAt } };
}
function transferLevel(player: GuildPlayerState, delta: number): GuildPlayerState {
  return { ...player, level: Math.max(1, Math.min(9, player.level + delta)) };
}
function replacePlayer(state: GuildState, player: GuildPlayerState): GuildState {
  return { ...state, players: state.players.map((candidate) => candidate.id === player.id ? player : candidate) };
}
function dealHand(state: GuildState, playerId: string, count: number, deck: "door" | "treasure"): GuildState {
  const player = state.players.find((p) => p.id === playerId); if (!player) return state;
  const cards = [...(deck === "door" ? state.doorDeck : state.treasureDeck)];
  const discard = [...(deck === "door" ? state.doorDiscard : state.treasureDiscard)];
  const hand = [...player.hand]; for (let i = 0; i < count; i += 1) { const card = draw(cards, discard); if (card) hand.push(card); }
  return replacePlayer({ ...state, ...(deck === "door" ? { doorDeck: cards, doorDiscard: discard } : { treasureDeck: cards, treasureDiscard: discard }) }, { ...player, hand });
}
function beginTurn(state: GuildState): GuildState {
  let next: GuildState = { ...state, stage: "door", currentMonster: null, revealedDoorCard: null, partyBonuses: 0, monsterBonuses: 0, combatEndsAt: null, helperId: null, helperOffer: 0, helpEndsAt: null, faceDownLoot: [], doorCombat: false, roomLooted: false, turnNumber: state.turnNumber + 1 };
  if (current(next).dead) {
    const reborn = { ...current(next), dead: false, level: 1 };
    next = replacePlayer(next, reborn);
    next = dealHand(next, reborn.id, 4, "door"); next = dealHand(next, reborn.id, 4, "treasure");
    return { ...next, message: `${reborn.name} steigt auf Stufe 1 wieder ins Abenteuer ein und zieht neue Karten.` };
  }
  return { ...next, message: `${current(next).name} kann Karten vorbereiten und dann die Tür öffnen.` };
}
function openDoor(state: GuildState): GuildState {
  const doorDeck = [...state.doorDeck]; const doorDiscard = [...state.doorDiscard];
  let next: GuildState = { ...state, doorDeck, doorDiscard, stage: "door", revealedDoorCard: null };
  const card = draw(doorDeck, doorDiscard);
  if (!card) return { ...next, stage: "main", message: "Die Türstapel sind leer. Spiele Ausrüstung, verkaufe Schätze oder beende den Zug." };
  next = { ...next, revealedDoorCard: card, doorRevealNumber: (state.doorRevealNumber ?? 0) + 1 };
  if (card.kind === "monster") return { ...next, stage: "combat", doorCombat: true, currentMonster: card, message: `${current(next).name} öffnet die Tür: ${card.title} (Stärke ${card.level}).` };
  if (card.kind === "curse") {
    next = replacePlayer(next, transferLevel(current(next), -1));
    return { ...next, doorDiscard: [...next.doorDiscard, card], stage: "main", message: `${current(next).name} trifft auf ${card.title}: eine Stufe verloren.` };
  }
  next = replacePlayer(next, { ...current(next), hand: [...current(next).hand, card] });
  return { ...next, stage: "main", message: `${current(next).name} öffnet die Tür: ${card.title}. Die Karte kommt auf die Hand.` };
}
function finishCombat(state: GuildState, now: number): GuildState {
  const monster = state.currentMonster; if (!monster) return { ...state, stage: "main" };
  const winner = current(state);
  const helper = state.players.find((p) => p.id === state.helperId);
  const stronger = partyStrength(state) > monsterStrength(state);
  if (!stronger) return { ...state, combatEndsAt: null, message: `${winner.name} ist noch schwächer als ${monster.title}. Bitte Hilfe oder versuche zu fliehen.` };
  if (stronger) {
    const newLevel = Math.min(10, winner.level + (monster.levelReward ?? 1));
    const win = newLevel >= 10;
    let next = replacePlayer(state, { ...winner, level: newLevel });
    next = { ...next, doorDiscard: [...next.doorDiscard, monster], currentMonster: null, combatEndsAt: null, stage: win ? "finished" : "main", doorCombat: true, helperId: null, helperOffer: 0, winnerId: win ? winner.id : undefined, message: `${winner.name} besiegt ${monster.title} und steigt eine Stufe auf! ${win ? "Die Gilde hat einen Sieger." : "Die Beute wird auf die Hand gegeben."}` };
    const rewardCards = Math.max(1, Math.min(3, monster.goldValue ?? 1));
    const helperCards = helper ? Math.min(rewardCards, state.helperOffer) : 0;
    if (helper && helperCards) next = dealHand(next, helper.id, helperCards, "treasure");
    next = dealHand(next, winner.id, rewardCards - helperCards, "treasure");
    if (next.stage === "finished") next = transitionRoundState(next, "locked", now, { durationMs: 4_000, message: next.message });
    return next;
  }
  const loser = transferLevel(winner, -1);
  let next = replacePlayer(state, loser);
  next = { ...next, doorDiscard: [...next.doorDiscard, monster], currentMonster: null, stage: "main", helperId: null, message: `${winner.name} kann ${monster.title} nicht überwinden. Eine Stufe geht verloren; der Zug geht weiter.` };
  return next;
}
function applyBadStuff(state: GuildState, victim: GuildPlayerState): GuildState {
  const monster = state.currentMonster; const effect = monster?.badStuff ?? "lose-level";
  if (effect === "death") {
    const next = replacePlayer({ ...state, treasureDiscard: [...state.treasureDiscard, ...victim.equipment], doorDiscard: [...state.doorDiscard, ...(victim.classCard ? [victim.classCard] : []), ...(victim.raceCard ? [victim.raceCard] : [])] }, { ...victim, level: 1, dead: true, equipment: [], classCard: null, raceCard: null });
    return { ...next, message: `${victim.name} wird aus dem Dungeon geschleudert und verliert die ausliegenden Besitztümer. Beim nächsten Zug startet die Figur auf Stufe 1.` };
  }
  if (effect === "lose-gear" && victim.equipment.length) {
    const lost = [...victim.equipment].sort((a, b) => (b.bonus ?? 0) - (a.bonus ?? 0))[0]!;
    return { ...replacePlayer({ ...state, treasureDiscard: [...state.treasureDiscard, lost] }, { ...victim, equipment: victim.equipment.filter((card) => card.id !== lost.id) }), message: `${victim.name} verliert ${lost.title}.` };
  }
  const levels = effect === "lose-two" ? 2 : 1;
  return { ...replacePlayer(state, transferLevel(victim, -levels)), message: `${victim.name} verliert ${levels} Stufe${levels === 1 ? "" : "n"}.` };
}
function passTurn(state: GuildState): GuildState {
  const player = current(state);
  const excess = Math.max(0, player.hand.length - 5);
  let players = state.players.map((candidate) => ({ ...candidate }));
  let doorDiscard = [...state.doorDiscard]; let treasureDiscard = [...state.treasureDiscard];
  if (excess) {
    const discarded = player.hand.slice(0, excess);
    const others = state.players.filter((candidate) => candidate.id !== player.id);
    const lowestOtherLevel = Math.min(...others.map((candidate) => candidate.level));
    const recipients = player.level > lowestOtherLevel ? others.filter((candidate) => candidate.level === lowestOtherLevel) : [];
    const hands = new Map(state.players.map((candidate) => [candidate.id, [...candidate.hand]]));
    hands.set(player.id, player.hand.slice(excess));
    if (recipients.length) discarded.forEach((card, index) => hands.get(recipients[index % recipients.length]!.id)!.push(card));
    else for (const card of discarded) (card.kind === "item" || card.kind === "boost" ? treasureDiscard : doorDiscard).push(card);
    players = players.map((candidate) => ({ ...candidate, hand: hands.get(candidate.id)! }));
  }
  return beginTurn({ ...state, players, doorDiscard, treasureDiscard, currentIndex: (state.currentIndex + 1) % state.players.length });
}
function availableActions(state: GuildState, playerId: string, en = false): CardTableActionState[] {
  const active = current(state).id === playerId;
  const actions: CardTableActionState[] = [];
  if (state.stage === "door" && active) actions.push({ id: "open-door", label: en ? "Open door" : "Tür öffnen", kind: "primary", enabled: true });
  const canWin = Boolean(state.currentMonster) && partyStrength(state) > monsterStrength(state);
  const fightAction: CardTableActionState = { id: "fight", label: state.combatEndsAt ? (en ? "Victory pending…" : "Sieg wird geprüft…") : (en ? "Claim victory" : "Sieg beanspruchen"), kind: "primary", enabled: canWin && !state.combatEndsAt };
  if (state.stage === "combat" && active) actions.push(fightAction, { id: "ask-help", label: en ? "Ask for help" : "Hilfe anbieten lassen", kind: "secondary", enabled: !state.helperId && !state.combatEndsAt && Boolean(state.currentMonster) && !canWin });
  if (state.stage === "help" && active) actions.push(fightAction, { id: "decline-help", label: en ? "Fight alone" : "Ohne Hilfe kämpfen", kind: "secondary", enabled: true });
  if (state.stage === "help" && !active && !state.helperId) actions.push({ id: "help", label: en ? "Join the fight" : "Mithelfen", kind: "primary", enabled: true });
  if (state.stage === "main" && active) {
    actions.push({ id: "loot", label: en ? "Loot the room" : "Raum plündern", kind: "secondary", enabled: !state.doorCombat && !state.roomLooted }, { id: "end-turn", label: en ? "End turn" : "Zug beenden", kind: "primary", enabled: true });
  }
  if ((state.stage === "door" || state.stage === "main") && active) {
    const saleCards = [...current(state).equipment, ...current(state).hand].filter((card) => card.kind === "item" && (card.goldValue ?? 0) > 0);
    for (const card of saleCards) actions.push({ id: `sell:${card.id}`, label: en ? `Sell ${titleFor(card, true)}` : `${card.title} verkaufen`, kind: "secondary", enabled: current(state).level < 9 });
  }
  if ((state.stage === "door" || state.stage === "main") && active) for (const card of current(state).equipment) actions.push({ id: `gear:${card.id}`, label: `${en ? (card.equipped === false ? "Equip" : "Stow") : (card.equipped === false ? "Anlegen" : "Ablegen")}: ${titleFor(card, en)}`, kind: "secondary", enabled: true });
  if (state.stage === "combat" && state.currentMonster && (active || state.helperId === playerId)) actions.push({ id: "escape", label: en ? "Escape" : "Fliehen", kind: "danger", enabled: true });
  return actions;
}

export const serverGame: ServerGame<GuildState, DungeonGuildInput, DungeonGuildPublicState> = {
  manifest: dungeonGuildManifest,
  createInitialState(context) {
    const playerIds = context.players.map((p) => p.id);
    const players: GuildPlayerState[] = context.players.map((p) => ({ id: p.id, name: p.name, color: p.color, connected: p.connected, level: 1, classCard: null, raceCard: null, equipment: [], hand: [] }));
    const seed = context.now + context.roundNumber * 7919;
    let state: GuildState = { ...createBaseRoundState("round_intro", context.now, { durationMs: 1500, message: context.language === "en" ? "Build your strength and make for level ten." : "Rüstet euch aus und erreicht Stufe zehn." }), startedAt: null,
      phase: "round_intro", currentIndex: 0, stage: "door", players,
      doorDeck: shuffle(doors.map((c) => ({ ...c })), seed), doorDiscard: [], treasureDeck: shuffle(treasures.map((c) => ({ ...c })), seed + 1), treasureDiscard: [], currentMonster: null, revealedDoorCard: null, doorRevealNumber: 0, tablePlays: [], playNumber: 0, lastEscape: null, escapeNumber: 0, partyBonuses: 0, monsterBonuses: 0, combatEndsAt: null, helperId: null, helperOffer: 0, helpEndsAt: null, faceDownLoot: [], doorCombat: false, roomLooted: false, turnNumber: 0, message: "" };
    for (const id of playerIds) { state = dealHand(state, id, 4, "door"); state = dealHand(state, id, 4, "treasure"); }
    return state;
  },
  startRound(state, context) { return beginTurn(transitionRoundState(state, "playing", context.now, { startedAt: context.now, message: "Die erste Person öffnet die Tür." })); },
  handleInput(state, input, context) {
    if (!input || typeof input !== "object" || state.phase !== "playing" || !isHuman(context, input.playerId)) return state;
    if (state.stage === "combat" && state.combatEndsAt && context.now >= state.combatEndsAt) return finishCombat(state, context.now);
    const player = state.players.find((p) => p.id === input.playerId); if (!player) return state;
    if (input.type === "dungeon-guild:play") {
      const card = player.hand.find((c) => c.id === input.cardId); if (!card || !canPlay(state, player, card)) return state;
      const played = (next: GuildState, side?: GuildCombatSide) => recordPlay(next, player, card, context.now, side);
      if (card.kind === "boost") {
        if (input.combatSide !== undefined && input.combatSide !== "party" && input.combatSide !== "monster") return state;
        const side = input.combatSide ?? "party";
        const next = replacePlayer(state, { ...player, hand: player.hand.filter((c) => c.id !== card.id) });
        const boosted = { ...next, treasureDiscard: [...next.treasureDiscard, card], partyBonuses: (next.partyBonuses ?? 0) + (side === "party" ? card.bonus ?? 2 : 0), monsterBonuses: next.monsterBonuses + (side === "monster" ? card.bonus ?? 2 : 0), message: `${player.name} spielt ${card.title}: ${side === "monster" ? "Monster" : "Gruppe"} +${card.bonus ?? 2} Stärke.` };
        return played({ ...boosted, combatEndsAt: state.combatEndsAt && partyStrength(boosted) > monsterStrength(boosted) ? context.now + COMBAT_REACTION_MS : null }, side);
      }
      const hand = player.hand.filter((c) => c.id !== card.id);
      if (card.kind === "item") {
        if (input.itemMode !== undefined && input.itemMode !== "equip" && input.itemMode !== "store") return state;
        const equipped = input.itemMode !== "store";
        const nextPlayer = equipped ? equipItem({ ...player, hand }, card) : { ...player, hand, equipment: [...player.equipment, { ...card, equipped: false }] };
        return played({ ...replacePlayer(state, nextPlayer), message: `${player.name} ${equipped ? "legt" : "verstaut"} ${card.title}${equipped ? " an" : " im Rucksack"}.` });
      }
      if (card.kind === "class") return played({ ...replacePlayer({ ...state, doorDiscard: [...state.doorDiscard, ...(player.classCard ? [player.classCard] : [])] }, { ...player, hand, classCard: card }), message: `${player.name} wird ${card.title}.` });
      if (card.kind === "race") return played({ ...replacePlayer({ ...state, doorDiscard: [...state.doorDiscard, ...(player.raceCard ? [player.raceCard] : [])] }, { ...player, hand, raceCard: card }), message: `${player.name} gehört jetzt zum ${card.title}.` });
      if (card.kind === "level") return played({ ...replacePlayer({ ...state, ...(card.id.startsWith("door-") ? { doorDiscard: [...state.doorDiscard, card] } : { treasureDiscard: [...state.treasureDiscard, card] }) }, transferLevel({ ...player, hand }, 1)), message: `${player.name} steigt eine Stufe auf.` });
      if (card.kind === "monster") return played({ ...replacePlayer(state, { ...player, hand }), stage: "combat", doorCombat: true, currentMonster: card, partyBonuses: 0, monsterBonuses: 0, combatEndsAt: null, helperId: null, message: `${player.name} provoziert ${card.title} zu einem Kampf!` });
      if (card.kind === "curse") {
        const target = state.players.find((p) => p.id === input.targetId) ?? player;
        const targetNext = transferLevel(target, -1);
        return played({ ...state, doorDiscard: [...state.doorDiscard, card], players: state.players.map((candidate) => candidate.id === target.id ? { ...targetNext, hand: target.id === player.id ? hand : targetNext.hand } : candidate.id === player.id ? { ...candidate, hand } : candidate), message: `${player.name} spielt ${card.title} gegen ${target.name}.` });
      }
      return state;
    }
    if (input.type !== "dungeon-guild:action") return state;
    const active = current(state);
    switch (input.actionId.split(":")[0]) {
      case "open-door": if (state.stage !== "door" || active.id !== player.id || input.actionId !== "open-door") return state; return openDoor(state);
      case "ask-help": if (state.stage !== "combat" || active.id !== player.id || state.helperId) return state; return { ...state, stage: "help", helpEndsAt: context.now + 15_000, message: `${active.name} sucht eine helfende Hand.` };
      case "help": if (state.stage !== "help" || player.id === active.id || state.helperId) return state; return { ...state, helperId: player.id, helperOffer: Math.min(state.currentMonster?.goldValue ?? 0, Math.floor((state.currentMonster?.goldValue ?? 0) / 2)), message: `${player.name} hilft ${active.name} im Kampf; die Schatzbeute wird geteilt.` };
      case "decline-help": if (state.stage !== "help" || active.id !== player.id) return state; return { ...state, stage: "combat", helperId: null, helpEndsAt: null };
      case "fight": if ((state.stage !== "combat" && state.stage !== "help") || active.id !== player.id || state.combatEndsAt || partyStrength(state) <= monsterStrength(state)) return state;
        return { ...state, stage: "combat", helpEndsAt: null, combatEndsAt: context.now + COMBAT_REACTION_MS, message: `${active.name} beansprucht den Sieg. Ihr habt sechs Sekunden für Kampftricks!` };
      case "escape": if (state.stage !== "combat" || !state.currentMonster || (active.id !== player.id && state.helperId !== player.id)) return state;
        { const roll = (context.now + state.turnNumber * 17 + player.id.length * 31) % 6 + 1; const success = roll >= (state.currentMonster.escapeTarget ?? 5);
          if (player.id !== active.id) {
            let next = state;
            if (!success) next = applyBadStuff(next, player);
            return recordEscape({ ...next, helperId: null, helperOffer: 0, combatEndsAt: null, message: success ? `${player.name} würfelt ${roll} und entkommt aus dem Kampf.` : `${player.name} würfelt ${roll}: ${state.currentMonster.badStuff ?? "Fluch"} trifft.` }, player, state.currentMonster, roll, success, context.now);
          }
          let next: GuildState = success ? state : applyBadStuff(state, player);
          next = { ...next, doorDiscard: [...next.doorDiscard, state.currentMonster], currentMonster: null, stage: "main" };
          return recordEscape(passTurn(next), player, state.currentMonster, roll, success, context.now); }
      case "loot": if (state.stage !== "main" || active.id !== player.id || state.doorCombat || state.roomLooted) return state; return dealHand({ ...state, stage: "main", roomLooted: true, message: `${active.name} plündert den Raum und zieht einen Schatz.` }, player.id, 1, "treasure");
      case "sell": if ((state.stage !== "door" && state.stage !== "main") || active.id !== player.id) return state;
        if (!input.actionId.startsWith("sell:")) return state;
        { const cardId = input.actionId.slice(5); const inGear = player.equipment.find((c) => c.id === cardId && c.kind === "item"); const inHand = player.hand.find((c) => c.id === cardId && c.kind === "item"); const sold = inGear ?? inHand; if (!sold || player.level >= 9 || (sold.goldValue ?? 0) < 1000) return state;
          const nextPlayer = { ...player, equipment: inGear ? player.equipment.filter((c) => c.id !== cardId) : player.equipment, hand: inHand ? player.hand.filter((c) => c.id !== cardId) : player.hand };
          return replacePlayer({ ...state, treasureDiscard: [...state.treasureDiscard, sold], message: `${active.name} verkauft ${sold.title} und steigt eine Stufe auf.` }, transferLevel(nextPlayer, 1)); }
      case "gear": if ((state.stage !== "door" && state.stage !== "main") || active.id !== player.id || !input.actionId.startsWith("gear:")) return state;
        { const cardId = input.actionId.slice(5); const card = player.equipment.find((c) => c.id === cardId); if (!card) return state;
          const equipped = card.equipped === false;
          const nextPlayer = equipped ? equipItem(player, card) : { ...player, equipment: player.equipment.map((item) => item.id === card.id ? { ...item, equipped: false } : item) };
          return { ...replacePlayer(state, nextPlayer), message: `${player.name} ${equipped ? "legt" : "verstaut"} ${card.title}${equipped ? " an" : " im Rucksack"}.` }; }
      case "end-turn": if (state.stage !== "main" || active.id !== player.id) return state;
        return passTurn(state);
      default: return state;
    }
  },
  tick(state, _deltaMs, context) {
    if (state.phase === "playing" && state.stage === "combat" && state.combatEndsAt && context.now >= state.combatEndsAt) return finishCombat(state, context.now);
    if (state.phase === "round_intro" && context.now >= state.phaseEndsAt!) return transitionRoundState(state, "playing", context.now, { startedAt: context.now, message: "Die erste Person öffnet die Tür." });
    if (state.stage === "help" && state.helpEndsAt !== null && context.now >= state.helpEndsAt) return { ...state, stage: "combat", helpEndsAt: null, message: state.helperId ? `${state.players.find((p) => p.id === state.helperId)?.name} hilft im Kampf.` : "Niemand ist zur Hilfe geeilt. Entscheide über den Kampf." };
    return state;
  },
  isRoundFinished(state) { return state.phase === "locked"; },
  buildScore(state): ScoreEntry[] { return state.players.map((p) => ({ playerId: p.id, delta: p.level, reason: `Stufe ${p.level}` })); },
  toPublicState(state, context) { return buildPublic(state, context); },
  toControllerStateForPlayer(state, context, playerId) { return buildController(state, context, playerId); }
};

const englishTitles: Record<string, string> = {
  "Mimic mit Fernweh": "Homesick Mimic", "Kobold-Buchhalter": "Goblin Accountant", Sumpfpoet: "Bog Poet", Gewitterziege: "Thunder Goat", "Schlafender Golem": "Sleeping Golem", "Drei freche Skelette": "Three Cheeky Skeletons", "Archivarin der Tiefe": "Deep Archive Keeper", Krötenritter: "Toad Knight", Käsekönig: "Cheese King", Nebelhexe: "Mist Witch", "Der sehr alte Drache": "Very Old Dragon", Steinbeißer: "Stonegnawer", "Schrank des Schreckens": "Wardrobe of Dread", Mondfresser: "Moon Eater",
  Stolperfluch: "Trip Hex", "Verhexter Helm": "Hexed Helmet", "Rostige Rüstung": "Rusty Armour", "Falsche Wegbeschreibung": "Wrong Directions", "Kalte Füße": "Cold Feet", "Verlorener Rucksack": "Lost Backpack",
  Zauberin: "Spellweaver", Waldläufer: "Ranger", Erfinderin: "Inventor", Bardin: "Bard", Menschling: "Human", Waldvolk: "Woodfolk", Bergvolk: "Mountain Folk", Wolkenkind: "Cloudkin",
  "Deckelhelm": "Pot Lid Helmet", Kesselpanzer: "Cauldron Armour", "Siebenmeilen-Socken": "Seven-Mile Socks", Mondspalter: "Moon Splitter", Krabbenklaue: "Crab Claw", "Zauberstab der Umwege": "Wand of Detours", Taschendrache: "Pocket Dragon", Glücksamulet: "Lucky Charm", Riesenschlüssel: "Giant Key", Tarnumhang: "Cloak of Almost Hiding", Trampelstiefel: "Stomping Boots", "Kronleuchter-Schild": "Chandelier Shield",
  Konfettiorkan: "Confetti Storm", Riesenrübe: "Giant Turnip", Wackelpuddingkanone: "Jelly Cannon", "Tausendjährige Socke": "Thousand-Year Sock", Mutmachmarmelade: "Bravery Jam", Klebeschleim: "Sticky Slime"
};
function titleFor(card: GuildCard, en: boolean): string { return en ? englishTitles[card.title] ?? card.title : card.title; }
const englishEffects: Record<string, string> = {
  "Stolperfluch": "Lose one level.", "Verhexter Helm": "Lose one level.", "Rostige Rüstung": "Lose one level.",
  "Falsche Wegbeschreibung": "Lose one level.", "Kalte Füße": "Lose one level.", "Verlorener Rucksack": "Lose one level.",
  "Zauberin": "Class: +2 combat strength.", "Waldläufer": "Class: +1 combat strength.", "Erfinderin": "Class: +1 combat strength.", "Bardin": "Class: +1 combat strength.",
  "Menschling": "Ancestry: +1 combat strength.", "Waldvolk": "Ancestry: +2 combat strength.", "Bergvolk": "Ancestry: +1 combat strength.", "Wolkenkind": "Ancestry: +1 combat strength.",
  "Deckelhelm": "Equipment: +2 strength while equipped.", "Kesselpanzer": "Equipment: +3 strength while equipped.", "Siebenmeilen-Socken": "Equipment: +2 strength while equipped.",
  "Mondspalter": "Equipment: +4 strength while equipped.", "Krabbenklaue": "Equipment: +3 strength while equipped.", "Zauberstab der Umwege": "Equipment: +2 strength while equipped.",
  "Taschendrache": "Equipment: +3 strength while equipped.", "Glücksamulet": "Equipment: +1 strength while equipped.", "Riesenschlüssel": "Equipment: +5 strength while equipped.",
  "Tarnumhang": "Equipment: +2 strength while equipped.", "Trampelstiefel": "Equipment: +3 strength while equipped.", "Kronleuchter-Schild": "Equipment: +2 strength while equipped.",
  "Konfettiorkan": "One-shot in combat: +3 strength.", "Riesenrübe": "One-shot in combat: +4 strength.", "Wackelpuddingkanone": "One-shot in combat: +3 strength.",
  "Tausendjährige Socke": "One-shot in combat: +4 strength.", "Mutmachmarmelade": "One-shot in combat: +3 strength.", "Klebeschleim": "One-shot in combat: +4 strength."
};
function publicCard(card: GuildCard, en: boolean): GuildCard {
  const effect = card.kind === "boost"
    ? (en ? `Play once in any fight: +${card.bonus ?? 0} strength for the party or the monster. Anyone may play this card.` : `Einmal im Kampf: +${card.bonus ?? 0} Stärke für Gruppe oder Monster. Alle dürfen diese Karte spielen.`)
    : en ? englishEffects[card.title] ?? (card.kind === "monster" ? "Defeat it for " + (card.levelReward ?? 1) + " level and " + (card.goldValue ?? 1) + " treasure." : card.kind === "level" ? "Gain one level (up to level 9)." : card.effect) : card.effect;
  return { ...card, title: en ? titleFor(card, true) : card.title, effect, artPath: "/dungeon-guild/cards/" + encodeURIComponent(card.id) + ".svg" };
}
function cardFace(card: GuildCard, en = false): CardTableCardState {
  const title = titleFor(card, en);
  return { cardId: card.id, suitId: card.kind, suitSymbol: card.kind === "monster" ? "♟" : card.kind === "item" ? "✦" : card.kind === "curse" ? "☠" : card.kind === "class" ? "♜" : card.kind === "race" ? "◇" : "✧", suitLabel: card.kind, rankLabel: title, color: card.color, centerLabel: title, points: card.bonus ?? card.level };
}
function rulesFor(language: "de" | "en") {
  return language === "en" ? [
    { title: "Goal & turn", lines: ["Everyone starts at level 1. Reach level 10 by defeating a monster to win.", "Before opening the Door, you may rearrange your gear and play cards. Then reveal a Door card: fight a monster, resolve a curse, or keep another card.", "If you did not fight, either take one face-down Treasure for Room Loot or play a monster from your hand to pick a fight.", "At turn end, keep at most five cards. Give excess to a lowest-level player; if you are tied for lowest, discard them."] },
    { title: "Combat & help", lines: ["Your strength is your level plus class, ancestry and equipped gear. It must exceed the monster's strength.", "When you are not already winning, ask for help. One player may join; both strengths count.", "A win grants one level and the monster's treasure. Level 10 must come from a monster victory.", "If you cannot win, escape on a 5 or 6. A failed escape costs one level."] },
    { title: "Cards & gear", lines: ["A new class or ancestry replaces your previous one. Its bonus counts while it is face-up.", "Equip one head, body, foot and accessory item plus two hand slots. Equipping an occupied slot moves the replaced gear to your backpack. Backpack items give no strength.", "Everyone may play combat tricks to strengthen either the party or the monster. After claiming victory, everyone has six seconds to intervene. Each trick restarts that window; if the party stops winning, the claim is cancelled.", "Level cards and selling can raise you to level 9, but cannot win the game. Sell items worth at least 1,000 gold during your turn for one level."] }
  ] : [
    { title: "Ziel & Zug", lines: ["Alle beginnen auf Stufe 1. Wer Stufe 10 durch einen gewonnenen Monsterkampf erreicht, gewinnt.", "Vor dem Öffnen darfst du Ausrüstung anordnen und Karten spielen. Dann deckst du eine Türkarte auf: Kämpfe gegen ein Monster, löse einen Fluch aus oder behalte die Karte.", "Wurde kein Monster bekämpft, kannst du einen Schatz verdeckt aus dem Raum plündern oder selbst ein Monster ausspielen.", "Am Zugende bleiben höchstens fünf Handkarten. Überzählige gibst du einer Person auf niedrigster Stufe; bist du selbst gleich niedrig, wirf sie ab."] },
    { title: "Kampf & Hilfe", lines: ["Deine Stärke ist Stufe plus Klassen-, Herkunfts- und angelegte Ausrüstungsboni. Sie muss höher als die Monsterstärke sein.", "Wenn du noch nicht gewinnst, kannst du um Hilfe bitten. Eine Person darf mitkämpfen; beide Stärken zählen.", "Ein Sieg bringt eine Stufe und die Schatzbeute des Monsters. Stufe 10 muss aus einem Monstersieg kommen.", "Bei einer 5 oder 6 gelingt die Flucht. Scheitert sie, verlierst du eine Stufe."] },
    { title: "Karten & Ausrüstung", lines: ["Eine neue Klasse oder Herkunft ersetzt deine bisherige Karte. Der Bonus zählt, solange sie ausliegt.", "Erlaubt sind je ein Kopf-, Körper-, Fuß- und Extrateil sowie zwei Handplätze. Anlegen auf einem belegten Platz verschiebt die ersetzte Ausrüstung in den Rucksack. Dort geben Gegenstände keine Stärke.", "Alle dürfen Kampftricks für Gruppe oder Monster spielen. Nach dem Beanspruchen eines Siegs bleiben sechs Sekunden zum Eingreifen. Jede Karte startet die Frist neu; ist die Gruppe nicht mehr stärker, wird der Sieganspruch aufgehoben.", "Stufenkarten und Verkaufen bringen dich bis Stufe 9, gewinnen aber nicht. Verkaufe in deinem Zug Ausrüstung im Wert von mindestens 1.000 Gold für eine Stufe."] }
  ];
}
function stack(id: string, label: string, cards: GuildCard[], kind: CardTableStackState["kind"], faceDown: boolean, en: boolean): CardTableStackState {
  return { id, label, count: cards.length, cards: faceDown ? [] : cards.slice(-4).reverse().map((card) => cardFace(card, en)), kind, faceDown, layout: "pile" };
}
function buildPublic(state: GuildState, context: ServerGameContext): DungeonGuildPublicState {
  const active = current(state);
  const en = context.language === "en";
  const players = state.players.map((p) => ({ id: p.id, name: p.name, color: p.color, connected: p.connected, level: p.level, classCard: p.classCard ? publicCard(p.classCard, en) : null, raceCard: p.raceCard ? publicCard(p.raceCard, en) : null, equipment: p.equipment.map((card) => publicCard(card, en)), handCount: p.hand.length, strength: gearStrength(p) }));
  const stacks = [stack("door-draw", en ? "Doors" : "Türen", state.doorDeck, "draw", true, en), stack("door-discard", en ? "Door discard" : "Tür-Ablage", state.doorDiscard, "discard", false, en), stack("treasure-draw", en ? "Treasure" : "Schätze", state.treasureDeck, "draw", true, en), stack("treasure-discard", en ? "Loot discard" : "Beute-Ablage", state.treasureDiscard, "discard", false, en), ...state.players.map((p) => ({ id: `equipment-${p.id}`, label: `${p.name}: ${en ? "Gear" : "Ausrüstung"}`, count: p.equipment.length + Number(Boolean(p.classCard)) + Number(Boolean(p.raceCard)), cards: [...p.equipment, ...(p.classCard ? [p.classCard] : []), ...(p.raceCard ? [p.raceCard] : [])].map((card) => cardFace(card, en)), kind: "zone" as const, faceDown: false, layout: "spread" as const }))];
  const actions = (playerId: string) => availableActions(state, playerId, en);
  return {
    rulesetId: "dungeon-guild", title: en ? "Dungeon Guild" : "Dungeon-Gilde", deckLabel: en ? "Doors & treasure" : "Tür- & Schatzkarten", backStyle: "diamond", cardStyle: "modern", rules: rulesFor(context.language),
    seats: players.map((p) => ({ playerId: p.id, name: p.name, color: p.color, connected: p.connected, handCount: p.handCount, score: p.level, isActive: p.id === active.id })), stacks,
    activePlayerId: active.id, activePlayerName: active.name, direction: 1, turnNumber: state.turnNumber, hostActions: actions(active.id), conditionLabel: state.stage, statusMessage: state.message, log: [],
    gameOver: state.phase === "locked", winnerPlayerId: state.winnerId, winnerName: players.find((p) => p.id === state.winnerId)?.name, stage: state.stage, players,
    currentMonster: state.currentMonster ? publicCard(state.currentMonster, en) : null, revealedDoorCard: state.revealedDoorCard ? publicCard(state.revealedDoorCard, en) : null,
    doorRevealNumber: state.doorRevealNumber ?? 0, tablePlays: (state.tablePlays ?? []).map((play) => ({ ...play, card: publicCard(play.card, en) })), lastEscape: state.lastEscape ?? null,
    partyBonuses: state.partyBonuses ?? 0, monsterBonuses: state.monsterBonuses, partyStrength: partyStrength(state), monsterStrength: monsterStrength(state), combatEndsAt: state.combatEndsAt ?? null,
    helperName: players.find((p) => p.id === state.helperId)?.name ?? null, helperOffer: state.helperOffer, helpEndsAt: state.helpEndsAt, faceDownLoot: state.faceDownLoot.length, message: state.message
  };
}
function buildController(state: GuildState, context: ServerGameContext, playerId: string) {
  const publicState = buildPublic(state, context); const player = state.players.find((p) => p.id === playerId);
  const ownHand = player?.hand ?? []; const actions = availableActions(state, playerId, context.language === "en");
  const mayAct = state.phase === "playing" && Boolean(player && !player.dead) && (current(state).id === playerId || Boolean(state.currentMonster && (state.stage === "combat" || state.stage === "help")));
  const en = context.language === "en";
  return { ...publicState, rules: [], canAct: mayAct, actions, pendingChoiceCardIds: [], hand: ownHand.map((card) => ({ ...cardFace(card, en), playable: Boolean(player && canPlay(state, player, card)), guildCard: publicCard(card, en) })), privateNote: player ? `${en ? "Level" : "Stufe"} ${player.level} · ${en ? "Strength" : "Kampfstärke"} ${gearStrength(player)}` : undefined, ownLevel: player?.level ?? 1, ownStrength: player ? gearStrength(player) : 0, ownHand: ownHand.map((card) => publicCard(card, en)), currentPlayerId: playerId };
}
export default serverGame;
