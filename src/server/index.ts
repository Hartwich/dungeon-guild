import {
  createBaseRoundState,
  transitionRoundState,
  type ScoreEntry,
  type ServerGame,
  type ServerGameContext,
  type SupportedLanguage
} from "@open-party-lab/game-core";
import type { CardTableActionState, CardTableCardState, CardTableStackState } from "@open-party-lab/protocol";
import { dungeonGuildManifest } from "../manifest.js";
import type { DungeonGuildInput, DungeonGuildPublicState, GuildCard, GuildCombatSide, GuildPlayerState, GuildState } from "../protocol.js";

function guildCopy(state: GuildState, de: string, en: string): string { return state.language !== "de" ? en : de; }

const doors: GuildCard[] = [
  ...[
    ["Mimic mit Fernweh", 2, 1], ["Kobold-Buchhalter", 3, 1], ["Sumpfpoet", 4, 1],
    ["Gewitterziege", 4, 1], ["Schlafender Golem", 5, 1], ["Drei freche Skelette", 6, 1],
    ["Archivarin der Tiefe", 6, 2], ["Krötenritter", 7, 2], ["Käsekönig", 8, 2],
    ["Nebelhexe", 8, 2], ["Der sehr alte Drache", 10, 2], ["Steinbeißer", 11, 2],
    ["Schrank des Schreckens", 12, 2], ["Mondfresser", 14, 2]
  ].flatMap(([name, level, reward], group) => Array.from({ length: group < 4 ? 2 : 1 }, (_, i) => ({
    id: `door-monster-${group}-${i}`, title: String(name), kind: "monster" as const,
    level: Number(level), levelReward: group === 10 ? 2 : 1, treasureCount: Number(reward), escapeTarget: group >= 12 ? 6 : 5,
    badStuff: group >= 12 ? "death" as const : group >= 9 ? "lose-gear" as const : group >= 7 ? "lose-two" as const : "lose-level" as const,
    effect: `Sieg: ${reward} Schatzkarten.`, color: "red" as const
  }))),
  ...["Stolperfluch", "Verhexter Helm", "Rostige Rüstung", "Falsche Wegbeschreibung", "Kalte Füße", "Verlorener Rucksack"].map((title, i) => ({ id: `door-curse-${i}`, title, kind: "curse" as const, curseEffect: (["lose-level", "lose-head", "lose-body", "lose-two", "lose-feet", "lose-backpack"] as const)[i], effect: ["Verliere eine Stufe.", "Verliere deine angelegte Kopfbedeckung. Ohne Kopfbedeckung keine Wirkung.", "Verliere deine angelegte Körperrüstung. Ohne Körperrüstung keine Wirkung.", "Verliere zwei Stufen.", "Verliere deine angelegten Schuhe. Ohne Schuhe keine Wirkung.", "Verliere alle nicht angelegten Gegenstände im Rucksack. Hand und angelegte Ausrüstung bleiben erhalten."][i], color: "black" as const })),
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
  if (card.kind === "item") return true;
  if (card.kind === "level") return state.players.some((candidate) => !candidate.dead && candidate.level < 9);
  if (card.kind === "boost") return Boolean(state.currentMonster);
  if (card.kind === "curse") return true;
  if ((card.kind === "class" || card.kind === "race") && current(state).id === player.id) return true;
  if (current(state).id !== player.id || (state.stage !== "door" && state.stage !== "main")) return false;
  if (card.kind === "monster") return state.stage === "main" && !state.roomLooted && !state.doorCombat;
  return false;
}
function reopenCombat(state: GuildState): GuildState {
  return state.currentMonster && state.combatPending ? { ...state, combatPassed: [], combatRevision: state.combatRevision + 1 } : state;
}
function waitingPlayers(state: GuildState): string[] {
  return state.players.filter((p) => p.connected && !p.dead && !state.combatPassed.includes(p.id)).map((p) => p.id);
}
function recordPlay(state: GuildState, player: GuildPlayerState, card: GuildCard, playedAt: number, combatSide?: GuildCombatSide): GuildState {
  const playNumber = (state.playNumber ?? 0) + 1;
  return reopenCombat({ ...state, playNumber, tablePlays: [...(state.tablePlays ?? []), { id: `play-${playNumber}`, card, playerId: player.id, playerName: player.name, combatSide, playedAt }].slice(-4) });
}
function recordEscape(state: GuildState, player: GuildPlayerState, monster: GuildCard, roll: number, success: boolean, occurredAt: number): GuildState {
  const escapeNumber = (state.escapeNumber ?? 0) + 1;
  const badStuff = monster.badStuff === "lose-gear" && !player.equipment.length ? "lose-level" : monster.badStuff;
  const event = { id: `escape-${escapeNumber}`, playerName: player.name, roll, target: monster.escapeTarget ?? 5, success, badStuff, occurredAt };
  return { ...state, escapeNumber, lastEscape: event, escapeEvents: [...state.escapeEvents, event].slice(-4) };
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
  let next: GuildState = { ...state, stage: "door", currentMonster: null, revealedDoorCard: null, partyBonuses: 0, monsterBonuses: 0, combatPending: false, combatPassed: [], combatRevision: state.combatRevision + 1, helpOffers: [], helperId: null, helperOffer: 0, faceDownLoot: [], doorCombat: false, roomLooted: false, turnNumber: state.turnNumber + 1 };
  if (state.fastPlay) next = dealHand(next, current(next).id, 1, "door");
  if (current(next).dead) {
    const reborn = { ...current(next), dead: false, level: 1 };
    next = replacePlayer(next, reborn);
    next = dealHand(next, reborn.id, 4, "door"); next = dealHand(next, reborn.id, 4, "treasure");
    return { ...next, message: guildCopy(state, `${reborn.name} steigt auf Stufe 1 wieder ins Abenteuer ein und zieht neue Karten.`, `${reborn.name} returns to the adventure at level 1 and draws new cards.`) };
  }
  return { ...next, message: guildCopy(state, `${current(next).name} kann Karten vorbereiten und dann die Tür öffnen.`, `${current(next).name} may prepare cards, then open the door.`) };
}
function openDoor(state: GuildState): GuildState {
  const doorDeck = [...state.doorDeck]; const doorDiscard = [...state.doorDiscard];
  let next: GuildState = { ...state, doorDeck, doorDiscard, stage: "door", revealedDoorCard: null };
  const card = draw(doorDeck, doorDiscard);
  if (!card) return { ...next, stage: "main", message: guildCopy(state, "Die Türstapel sind leer. Spiele Ausrüstung, verkaufe Schätze oder beende den Zug.", "The door decks are empty. Equip gear, sell treasure or end your turn.") };
  next = { ...next, revealedDoorCard: card, doorRevealNumber: (state.doorRevealNumber ?? 0) + 1 };
  if (card.kind === "monster") return { ...next, stage: "combat", doorCombat: true, currentMonster: card, message: guildCopy(state, `${current(next).name} öffnet die Tür: ${card.title} (Stärke ${card.level}).`, `${current(next).name} opens the door: ${titleFor(card, true)} (strength ${card.level}).`) };
  if (card.kind === "curse") {
    return applyCurse({ ...next, doorDiscard: [...next.doorDiscard, card], stage: "main" }, current(next).id, card);
  }
  next = replacePlayer(next, { ...current(next), hand: [...current(next).hand, card] });
  return { ...next, stage: "main", message: guildCopy(state, `${current(next).name} öffnet die Tür: ${card.title}. Die Karte kommt auf die Hand.`, `${current(next).name} opens the door: ${titleFor(card, true)}. The card goes into their hand.`) };
}
function finishCombat(state: GuildState, now: number): GuildState {
  const monster = state.currentMonster; if (!monster) return { ...state, stage: "main" };
  const winner = current(state);
  const helper = state.players.find((p) => p.id === state.helperId);
  const stronger = partyStrength(state) > monsterStrength(state);
  if (!stronger) return fleeCombat(state, now);
  if (stronger) {
    const newLevel = Math.min(10, winner.level + (monster.levelReward ?? 1));
    const win = newLevel >= 10;
    let next = replacePlayer(state, { ...winner, level: newLevel });
    next = { ...next, doorDiscard: [...next.doorDiscard, monster], currentMonster: null, combatPending: false, combatPassed: [], helpOffers: [], stage: win ? "finished" : "main", doorCombat: true, helperId: null, helperOffer: 0, winnerId: win ? winner.id : undefined, message: guildCopy(state, `${winner.name} besiegt ${monster.title}: +${monster.levelReward ?? 1} Stufe(n), ${monster.treasureCount ?? 1} Schätze. ${win ? "Stufe 10 erreicht!" : "Die Beute liegt auf der Hand."}`, `${winner.name} defeats ${titleFor(monster, true)}: +${monster.levelReward ?? 1} level(s), ${monster.treasureCount ?? 1} treasures. ${win ? "Level 10 reached!" : "The loot is in hand."}`) };
    const rewardCards = Math.max(1, monster.treasureCount ?? 1);
    const helperCards = helper ? Math.min(rewardCards, state.helperOffer) : 0;
    if (helper && helperCards) next = dealHand(next, helper.id, helperCards, "treasure");
    next = dealHand(next, winner.id, rewardCards - helperCards, "treasure");
    if (next.stage === "finished") next = transitionRoundState(next, "locked", now, { durationMs: 4_000, message: next.message });
    return next;
  }
  return state;
}
function fleeCombat(state: GuildState, now: number): GuildState {
  const monster = state.currentMonster; if (!monster) return state;
  let next = state;
  const fighters = [current(state), ...state.players.filter((p) => p.id === state.helperId)];
  for (const fighter of fighters) {
    const roll = Math.floor(Math.random() * 6) + 1;
    const success = roll >= (monster.escapeTarget ?? 5);
    if (!success) next = applyBadStuff(next, next.players.find((p) => p.id === fighter.id)!);
    next = recordEscape(next, fighter, monster, roll, success, now);
  }
  const summary = next.escapeEvents.filter((event) => event.occurredAt === now).map((event) => `${event.playerName}: ${event.roll} — ${event.success ? guildCopy(state, "entkommen", "escaped") : guildCopy(state, "Flucht gescheitert", "escape failed")}`).join(" · ");
  return { ...next, doorDiscard: [...next.doorDiscard, monster], currentMonster: null, stage: "main", combatPending: false, combatPassed: [], helperId: null, helperOffer: 0, helpOffers: [], doorCombat: true, message: summary };
}
function sellItems(state: GuildState, player: GuildPlayerState, cardIds: string[]): GuildState {
  if (player.dead || player.level >= 9 || !Array.isArray(cardIds) || !cardIds.length) return state;
  const ids = new Set(cardIds);
  if (ids.size !== cardIds.length) return state;
  const sold = [...player.hand, ...player.equipment].filter((card) => ids.has(card.id) && card.kind === "item" && (card.goldValue ?? 0) > 0);
  const value = sold.reduce((sum, card) => sum + (card.goldValue ?? 0), 0);
  if (sold.length !== ids.size || value < 1000) return state;
  const levels = Math.min(9 - player.level, Math.floor(value / 1000));
  const next = replacePlayer({ ...state, treasureDiscard: [...state.treasureDiscard, ...sold], message: guildCopy(state, `${player.name} verkauft für ${value} Gold Verkaufswert: +${levels} Stufe(n). Restwert verfällt.`, `${player.name} sells ${value} gold worth of items: +${levels} level(s). No change is kept.`) }, { ...player, level: player.level + levels, hand: player.hand.filter((c) => !ids.has(c.id)), equipment: player.equipment.filter((c) => !ids.has(c.id)) });
  return state.currentMonster && (current(state).id === player.id || state.helperId === player.id) ? reopenCombat(next) : next;
}
function applyBadStuff(state: GuildState, victim: GuildPlayerState): GuildState {
  const monster = state.currentMonster; const effect = monster?.badStuff ?? "lose-level";
  if (effect === "death") {
    const next = replacePlayer({ ...state, treasureDiscard: [...state.treasureDiscard, ...victim.equipment], doorDiscard: [...state.doorDiscard, ...(victim.classCard ? [victim.classCard] : []), ...(victim.raceCard ? [victim.raceCard] : [])] }, { ...victim, level: 1, dead: true, equipment: [], classCard: null, raceCard: null });
    return { ...next, message: guildCopy(state, `${victim.name} wird aus dem Dungeon geschleudert und verliert die ausliegenden Besitztümer. Beim nächsten Zug startet die Figur auf Stufe 1.`, `${victim.name} is thrown out of the dungeon and loses their equipped possessions. They return at level 1 on their next turn.`) };
  }
  if (effect === "lose-gear" && victim.equipment.length) {
    const lost = [...victim.equipment].sort((a, b) => (b.bonus ?? 0) - (a.bonus ?? 0))[0]!;
    return { ...replacePlayer({ ...state, treasureDiscard: [...state.treasureDiscard, lost] }, { ...victim, equipment: victim.equipment.filter((card) => card.id !== lost.id) }), message: guildCopy(state, `${victim.name} verliert ${lost.title}.`, `${victim.name} loses ${titleFor(lost, true)}.`) };
  }
  const levels = effect === "lose-two" ? 2 : 1;
  return { ...replacePlayer(state, transferLevel(victim, -levels)), message: guildCopy(state, `${victim.name} verliert ${levels} Stufe${levels === 1 ? "" : "n"}.`, `${victim.name} loses ${levels} level${levels === 1 ? "" : "s"}.`) };
}
function curseDescription(card: GuildCard, en: boolean): string {
  const text = {
    "lose-level": ["Verliere eine Stufe.", "Lose one level."],
    "lose-two": ["Verliere zwei Stufen.", "Lose two levels."],
    "lose-head": ["Verliere deine angelegte Kopfbedeckung. Ohne Kopfbedeckung keine Wirkung.", "Lose your equipped headgear. No effect without headgear."],
    "lose-body": ["Verliere deine angelegte Körperrüstung. Ohne Körperrüstung keine Wirkung.", "Lose your equipped body armor. No effect without armor."],
    "lose-feet": ["Verliere deine angelegten Schuhe. Ohne Schuhe keine Wirkung.", "Lose your equipped footwear. No effect without footwear."],
    "lose-backpack": ["Verliere alle Gegenstände im Rucksack. Hand und angelegte Ausrüstung bleiben erhalten.", "Lose all backpack items. Keep your hand and equipped gear."]
  };
  return text[card.curseEffect ?? "lose-level"][en ? 1 : 0];
}
function applyCurse(state: GuildState, targetId: string, card: GuildCard): GuildState {
  const player = state.players.find((p) => p.id === targetId); if (!player || player.dead) return state;
  const effect = card.curseEffect ?? "lose-level";
  if (effect === "lose-level" || effect === "lose-two") {
    const next = transferLevel(player, effect === "lose-two" ? -2 : -1);
    return { ...replacePlayer(state, next), message: guildCopy(state, `${player.name} trifft ${card.title}: ${player.level - next.level} Stufe(n) verloren.`, `${player.name} is hit by ${titleFor(card, true)}: lost ${player.level - next.level} level(s).`) };
  }
  const slot = effect === "lose-head" ? "head" : effect === "lose-body" ? "body" : "feet";
  const lost = player.equipment.filter((item) => effect === "lose-backpack" ? item.equipped === false : item.equipped !== false && item.slot === slot);
  const ids = new Set(lost.map((item) => item.id));
  return { ...replacePlayer({ ...state, treasureDiscard: [...state.treasureDiscard, ...lost] }, { ...player, equipment: player.equipment.filter((item) => !ids.has(item.id)) }), message: guildCopy(state, `${player.name} trifft ${card.title}: ${lost.length ? lost.map((item) => item.title).join(", ") + " verloren." : "kein passender Gegenstand, keine Wirkung."}`, `${player.name} is hit by ${titleFor(card, true)}: ${lost.length ? "lost " + lost.map((item) => titleFor(item, true)).join(", ") + "." : "no matching item, no effect."}`) };
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
    else for (const card of discarded) (card.id.startsWith("treasure-") ? treasureDiscard : doorDiscard).push(card);
    players = players.map((candidate) => ({ ...candidate, hand: hands.get(candidate.id)! }));
  }
  return beginTurn({ ...state, players, doorDiscard, treasureDiscard, currentIndex: (state.currentIndex + 1) % state.players.length });
}
function availableActions(state: GuildState, playerId: string, en = false): CardTableActionState[] {
  const active = current(state).id === playerId;
  const player = state.players.find((p) => p.id === playerId);
  if (state.phase !== "playing" || !player || player.dead) return [];
  const actions: CardTableActionState[] = [];
  if (state.stage === "door" && active) actions.push({ id: "open-door", label: en ? "Open door" : "Tür öffnen", kind: "primary", enabled: true });
  if (state.currentMonster && active && state.stage === "combat") actions.push({ id: "fight", label: en ? "Fight" : "Kämpfen", kind: "primary", enabled: !state.combatPending }, { id: "ask-help", label: en ? "Ask for help" : "Um Hilfe bitten", kind: "secondary", enabled: !state.helperId && (state.allowWinningHelp || partyStrength(state) <= monsterStrength(state)) });
  if (state.stage === "help" && active) {
    actions.push({ id: "help-reward", label: (en ? "Offer: " : "Angebot: ") + state.helperOffer + (en ? " treasure(s)" : " Schatz/Schätze"), kind: "secondary", enabled: true });
    for (const id of state.helpOffers) {
      const candidate = state.players.find((p) => p.id === id && p.connected && !p.dead);
      if (candidate) actions.push({ id: "accept-help:" + id, label: (en ? "Accept " : "Annehmen: ") + candidate.name, kind: "primary", enabled: state.allowWinningHelp || partyStrength(state) <= monsterStrength(state) });
    }
    actions.push({ id: "decline-help", label: en ? "Continue alone" : "Allein weiter", kind: "secondary", enabled: true });
  }
  if (state.stage === "help" && !active && !state.helperId) actions.push({ id: "help", label: state.helpOffers.includes(playerId) ? (en ? "Offer withdrawn" : "Angebot zurückziehen") : (en ? "Offer help · " : "Hilfe anbieten · ") + state.helperOffer + (en ? " treasure(s)" : " Schatz/Schätze"), kind: "primary", enabled: true });
  if (state.currentMonster && state.combatPending) actions.push({ id: "combat-pass", label: state.combatPassed.includes(playerId) ? (en ? "Intervene again" : "Wieder eingreifen") : (en ? "Do nothing" : "Nichts unternehmen"), kind: "primary", enabled: true });
  if (state.stage === "main" && active) {
    actions.push({ id: "loot", label: state.fastPlay ? (en ? "Loot room · 1 hidden Treasure" : "Raum plündern · 1 verdeckter Schatz") : (en ? "Loot room · 1 hidden Door" : "Raum plündern · 1 verdeckte Türkarte"), kind: "secondary", enabled: !state.doorCombat && !state.roomLooted }, { id: "end-turn", label: en ? "End turn" : "Zug beenden", kind: "primary", enabled: true });
  }
  {
    const saleCards = [...player.equipment, ...player.hand].filter((card) => card.kind === "item" && (card.goldValue ?? 0) > 0);
    for (const card of saleCards) actions.push({ id: `sell:${card.id}`, label: en ? `Sell ${titleFor(card, true)}` : `${card.title} verkaufen`, kind: "secondary", enabled: player.level < 9 });
  }
  for (const card of player.equipment) actions.push({ id: `gear:${card.id}`, label: `${en ? (card.equipped === false ? "Equip" : "Stow") : (card.equipped === false ? "Anlegen" : "Ablegen")}: ${titleFor(card, en)}`, kind: "secondary", enabled: true });
  if (state.currentMonster && active && !state.combatPending) actions.push({ id: "escape", label: en ? "Escape" : "Fliehen", kind: "danger", enabled: partyStrength(state) <= monsterStrength(state) });
  return actions;
}

export const serverGame: ServerGame<GuildState, DungeonGuildInput, DungeonGuildPublicState> = {
  manifest: dungeonGuildManifest,
  handleHostAction(state, action) {
    if (!action || typeof action !== "object" || (state && state.phase !== "round_intro" && state.phase !== "finished")) return {};
    const configure = action as Record<string, unknown>;
    if (configure.type !== "configure-lobby") return {};
    const roomSettings: Record<string, unknown> = {};
    for (const field of dungeonGuildManifest.lobbySetup.fields) {
      const value = configure[field.id];
      if (value === field.onValue || value === field.offValue) roomSettings[field.settingKey] = value;
    }
    return {
      roomSettings,
      ...(state ? { state: { ...state,
        allowWinningHelp: roomSettings.dungeonGuildWinningHelp === undefined ? state.allowWinningHelp : roomSettings.dungeonGuildWinningHelp === "on",
        fastPlay: roomSettings.dungeonGuildFastPlay === undefined ? state.fastPlay : roomSettings.dungeonGuildFastPlay === "on"
      } } : {})
    };
  },
  createInitialState(context) {
    const playerIds = context.players.map((p) => p.id);
    const players: GuildPlayerState[] = context.players.map((p) => ({ id: p.id, name: p.name, color: p.color, connected: p.connected, level: 1, classCard: null, raceCard: null, equipment: [], hand: [] }));
    const seed = context.now + context.roundNumber * 7919;
    let state: GuildState = { allowWinningHelp: context.roomSettings?.dungeonGuildWinningHelp === "on", fastPlay: context.roomSettings?.dungeonGuildFastPlay === "on", ...createBaseRoundState("round_intro", context.now, { durationMs: 1500, message: context.language !== "de" ? "Build your strength and make for level ten." : "Rüstet euch aus und erreicht Stufe zehn." }), startedAt: null, language: context.language,
      phase: "round_intro", currentIndex: 0, stage: "door", players,
      doorDeck: shuffle(doors.map((c) => ({ ...c })), seed), doorDiscard: [], treasureDeck: shuffle(treasures.map((c) => ({ ...c })), seed + 1), treasureDiscard: [], currentMonster: null, revealedDoorCard: null, doorRevealNumber: 0, tablePlays: [], playNumber: 0, lastEscape: null, escapeNumber: 0, partyBonuses: 0, monsterBonuses: 0, combatPending: false, combatRevision: 0, combatPassed: [], helpOffers: [], helperId: null, helperOffer: 0, escapeEvents: [], faceDownLoot: [], doorCombat: false, roomLooted: false, turnNumber: 0, message: "" };
    for (const id of playerIds) { state = dealHand(state, id, 4, "door"); state = dealHand(state, id, 4, "treasure"); }
    return state;
  },
  startRound(state, context) { return beginTurn(transitionRoundState(state, "playing", context.now, { startedAt: context.now, message: guildCopy(state, "Die erste Person öffnet die Tür.", "The first player opens the door.") })); },
  handleInput(state, input, context) {
    if (!input || typeof input !== "object" || state.phase !== "playing" || !isHuman(context, input.playerId)) return state;
    const player = state.players.find((p) => p.id === input.playerId); if (!player || player.dead) return state;
    if (input.type === "dungeon-guild:sell") return sellItems(state, player, input.cardIds);
    if (input.type === "dungeon-guild:play") {
      const card = player.hand.find((c) => c.id === input.cardId); if (!card || !canPlay(state, player, card)) return state;
      const played = (next: GuildState, side?: GuildCombatSide) => recordPlay(next, player, card, context.now, side);
      if (card.kind === "boost") {
        if (input.combatSide !== undefined && input.combatSide !== "party" && input.combatSide !== "monster") return state;
        const side = input.combatSide ?? "party";
        const next = replacePlayer(state, { ...player, hand: player.hand.filter((c) => c.id !== card.id) });
        const boosted = { ...next, treasureDiscard: [...next.treasureDiscard, card], partyBonuses: (next.partyBonuses ?? 0) + (side === "party" ? card.bonus ?? 2 : 0), monsterBonuses: next.monsterBonuses + (side === "monster" ? card.bonus ?? 2 : 0), message: guildCopy(state, `${player.name} spielt ${card.title}: ${side === "monster" ? "Monster" : "Gruppe"} +${card.bonus ?? 2} Stärke.`, `${player.name} plays ${titleFor(card, true)}: ${side === "monster" ? "monster" : "party"} +${card.bonus ?? 2} strength.`) };
        return played(boosted, side);
      }
      const hand = player.hand.filter((c) => c.id !== card.id);
      if (card.kind === "item") {
        if (input.itemMode !== undefined && input.itemMode !== "equip" && input.itemMode !== "store") return state;
        const equipped = input.itemMode !== "store";
        const nextPlayer = equipped ? equipItem({ ...player, hand }, card) : { ...player, hand, equipment: [...player.equipment, { ...card, equipped: false }] };
        return played({ ...replacePlayer(state, nextPlayer), message: guildCopy(state, `${player.name} ${equipped ? "legt" : "verstaut"} ${card.title}${equipped ? " an" : " im Rucksack"}.`, `${player.name} ${equipped ? "equips" : "stows"} ${titleFor(card, true)}${equipped ? "" : " in their backpack"}.`) });
      }
      if (card.kind === "class") return played({ ...replacePlayer({ ...state, doorDiscard: [...state.doorDiscard, ...(player.classCard ? [player.classCard] : [])] }, { ...player, hand, classCard: card }), message: guildCopy(state, `${player.name} wird ${card.title}.`, `${player.name} becomes a ${titleFor(card, true)}.`) });
      if (card.kind === "race") return played({ ...replacePlayer({ ...state, doorDiscard: [...state.doorDiscard, ...(player.raceCard ? [player.raceCard] : [])] }, { ...player, hand, raceCard: card }), message: guildCopy(state, `${player.name} gehört jetzt zum ${card.title}.`, `${player.name} is now ${titleFor(card, true)}.`) });
      if (card.kind === "level") {
        const target = input.targetId === undefined ? player : state.players.find((candidate) => candidate.id === input.targetId);
        if (!target || target.dead || target.level >= 9) return state;
        const next = replacePlayer(state, { ...player, hand });
        const updated = next.players.find((candidate) => candidate.id === target.id)!;
        return played({ ...replacePlayer(next, transferLevel(updated, 1)), ...(card.id.startsWith("door-") ? { doorDiscard: [...state.doorDiscard, card] } : { treasureDiscard: [...state.treasureDiscard, card] }), message: guildCopy(state, `${target.name} steigt eine Stufe auf.`, `${target.name} gains one level.`) });
      }
      if (card.kind === "monster") return played({ ...replacePlayer(state, { ...player, hand }), stage: "combat", doorCombat: true, currentMonster: card, partyBonuses: 0, monsterBonuses: 0, combatPending: false, combatPassed: [], helpOffers: [], helperId: null, message: guildCopy(state, `${player.name} provoziert ${card.title} zu einem Kampf!`, `${player.name} challenges ${titleFor(card, true)} to a fight!`) });
      if (card.kind === "curse") {
        const target = input.targetId === undefined ? player : state.players.find((p) => p.id === input.targetId);
        if (!target || target.dead) return state;
        const next = replacePlayer({ ...state, doorDiscard: [...state.doorDiscard, card] }, { ...player, hand });
        return played(applyCurse(next, target.id, card));
      }
      return state;
    }
    if (input.type !== "dungeon-guild:action" || typeof input.actionId !== "string") return state;
    const active = current(state);
    switch (input.actionId.split(":")[0]) {
      case "open-door": if (state.stage !== "door" || active.id !== player.id || input.actionId !== "open-door") return state; return openDoor(state);

      case "ask-help":
        if (!state.currentMonster || active.id !== player.id || state.helperId || state.stage !== "combat" || (!state.allowWinningHelp && partyStrength(state) > monsterStrength(state))) return state;
        return { ...state, stage: "help", combatPending: false, combatPassed: [], combatRevision: state.combatRevision + 1, helpOffers: [], helperOffer: Math.min(1, state.currentMonster.treasureCount ?? 1), message: guildCopy(state, active.name + " bittet um Hilfe. Bietet am Handy eure Teilnahme an; die kämpfende Person wählt eine Hilfe aus.", active.name + " asks for help. Offer to join on your phone; the main fighter chooses one helper.") };
      case "help-reward":
        if (state.stage !== "help" || active.id !== player.id || !state.currentMonster) return state;
        return { ...state, helperOffer: (state.helperOffer + 1) % ((state.currentMonster.treasureCount ?? 1) + 1), helpOffers: [], message: guildCopy(state, "Beuteangebot geändert. Bitte Hilfe unter den neuen Bedingungen erneut anbieten.", "Treasure offer changed. Offer help again under the new terms.") };
      case "help":
        if (state.stage !== "help" || player.id === active.id || state.helperId || !player.connected) return state;
        return { ...state, helpOffers: state.helpOffers.includes(player.id) ? state.helpOffers.filter((id) => id !== player.id) : [...state.helpOffers, player.id] };
      case "accept-help": {
        if (state.stage !== "help" || active.id !== player.id || state.helperId || (!state.allowWinningHelp && partyStrength(state) > monsterStrength(state))) return state;
        const id = input.actionId.slice("accept-help:".length);
        const helper = state.players.find((p) => p.id === id && p.connected && !p.dead);
        if (!helper || !state.helpOffers.includes(id)) return state;
        return { ...state, stage: "combat", helperId: id, helpOffers: [], combatPassed: [], combatRevision: state.combatRevision + 1, message: guildCopy(state, active.name + " nimmt " + helper.name + " an: " + state.helperOffer + " Schatz/Schätze bei Sieg. Nur diese beiden Figuren kämpfen mit.", active.name + " accepts " + helper.name + ": " + state.helperOffer + " treasure(s) on victory. Only these two characters join the fight.") };
      }
      case "decline-help":
        if (state.stage !== "help" || active.id !== player.id) return state;
        return { ...state, stage: "combat", helpOffers: [], helperOffer: 0 };
      case "fight":
        if (state.stage !== "combat" || !state.currentMonster || active.id !== player.id || state.combatPending) return state;
        return { ...state, combatPending: true, combatPassed: [], combatRevision: state.combatRevision + 1, message: guildCopy(state, "Kämpfen: Alle können weiter eingreifen. Erst wenn alle verbundenen Personen nichts unternehmen, wird der Kampf ausgewertet. Jede Änderung öffnet die Entscheidung erneut.", "Fight: everyone may still intervene. Combat resolves only when every connected player passes. Each change reopens everyone's decision.") };
      case "combat-pass": {
        if (!state.currentMonster || !state.combatPending || input.combatRevision !== state.combatRevision || !player.connected) return state;
        const next = { ...state, combatPassed: state.combatPassed.includes(player.id) ? state.combatPassed.filter((id) => id !== player.id) : [...state.combatPassed, player.id] };
        return waitingPlayers(next).length ? next : finishCombat(next, context.now);
      }
      case "escape":
        if (!state.currentMonster || active.id !== player.id || state.combatPending || partyStrength(state) > monsterStrength(state)) return state;
        return fleeCombat(state, context.now);
      case "loot":
        if (state.stage !== "main" || active.id !== player.id || state.doorCombat || state.roomLooted) return state;
        return dealHand({ ...state, roomLooted: true, message: state.fastPlay ? guildCopy(state, active.name + " plündert im Schnellspiel einen verdeckten Schatz.", active.name + " loots one hidden Treasure in faster play.") : guildCopy(state, active.name + " durchsucht den friedlichen Raum: eine weitere Türkarte kommt verdeckt auf die Hand.", active.name + " searches the peaceful room: one more Door card goes privately into their hand.") }, player.id, 1, state.fastPlay ? "treasure" : "door");
      case "sell":
        return input.actionId.startsWith("sell:") ? sellItems(state, player, [input.actionId.slice(5)]) : state;
      case "gear": {
        if (!input.actionId.startsWith("gear:")) return state;
        const card = player.equipment.find((c) => c.id === input.actionId.slice(5)); if (!card) return state;
        const equipped = card.equipped === false;
        const nextPlayer = equipped ? equipItem(player, card) : { ...player, equipment: player.equipment.map((item) => item.id === card.id ? { ...item, equipped: false } : item) };
        const next = { ...replacePlayer(state, nextPlayer), message: guildCopy(state, player.name + (equipped ? " legt " : " verstaut ") + card.title + (equipped ? " an." : " im Rucksack."), player.name + (equipped ? " equips " : " stows ") + titleFor(card, true) + (equipped ? "." : " in their backpack.")) };
        return state.currentMonster && (active.id === player.id || state.helperId === player.id) ? reopenCombat(next) : next;
      }
      case "end-turn": if (state.stage !== "main" || active.id !== player.id) return state;
        return passTurn(state);
      default: return state;
    }
  },
  tick(state, _deltaMs, context) {

    if (state.phase === "round_intro" && context.now >= state.phaseEndsAt!) return beginTurn(transitionRoundState(state, "playing", context.now, { startedAt: context.now, message: guildCopy(state, "Die erste Person öffnet die Tür.", "The first player opens the door.") }));
    const changed = state.players.some((p) => p.connected !== Boolean(context.players.find((candidate) => candidate.id === p.id)?.connected));
    if (changed) {
      const next = { ...state, players: state.players.map((p) => ({ ...p, connected: Boolean(context.players.find((candidate) => candidate.id === p.id)?.connected) })) };
      if (next.combatPending && next.players.some((p) => p.connected && !p.dead) && !waitingPlayers(next).length) return finishCombat(next, context.now);
      return next;
    }
    return state;
  },
  isRoundFinished(state) { return state.phase === "locked"; },
  buildScore(state): ScoreEntry[] { return state.players.map((p) => ({ playerId: p.id, delta: p.level, reason: guildCopy(state, `Stufe ${p.level}`, `Level ${p.level}`) })); },
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
function titleFor(card: GuildCard, en: boolean): string { return en ? englishTitles[card.title] ?? card.title.replace(/^Erfahrungsfunke /, "Spark of Experience ").replace(/^Abenteurer-Urkunde /, "Adventurer Certificate ") : card.title; }
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
  const effect = card.kind === "curse" ? curseDescription(card, en) : card.kind === "boost"
    ? (en ? `Play once in any fight: +${card.bonus ?? 0} strength for the party or the monster.` : `Einmal im Kampf: +${card.bonus ?? 0} Stärke für Gruppe oder Monster.`)
    : en ? englishEffects[card.title] ?? (card.kind === "monster" ? "Defeat it for " + (card.levelReward ?? 1) + " level and " + (card.treasureCount ?? 1) + " treasure." : card.kind === "level" ? "Gain one level (up to level 9)." : card.effect) : card.effect;
  return { ...card, title: en ? titleFor(card, true) : card.title, effect, artPath: "/dungeon-guild/cards/" + encodeURIComponent(card.id) + ".svg" };
}
function cardFace(card: GuildCard, en = false): CardTableCardState {
  const title = titleFor(card, en);
  return { cardId: card.id, suitId: card.kind, suitSymbol: card.kind === "monster" ? "♟" : card.kind === "item" ? "✦" : card.kind === "curse" ? "☠" : card.kind === "class" ? "♜" : card.kind === "race" ? "◇" : "✧", suitLabel: ({ monster: ["Monster", "Monster"], curse: ["Fluch", "Curse"], class: ["Klasse", "Class"], race: ["Herkunft", "Ancestry"], item: ["Ausrüstung", "Equipment"], boost: ["Kampftrick", "Combat trick"], level: ["Stufe", "Level"] })[card.kind][en ? 1 : 0], rankLabel: title, color: card.color, centerLabel: title, points: card.bonus ?? card.level };
}
function rulesFor(language: SupportedLanguage, state: GuildState) {
  if (language === "es") return [
    { title: "Turno y saqueo", lines: ["Revela una puerta. Lucha contra un monstruo, resuelve una maldición o conserva otra carta.", state.fastPlay ? "Partida rápida: roba una puerta extra boca abajo al inicio. Saquear la sala roba un tesoro en vez de una puerta." : "Si no luchaste, juega un monstruo de tu mano o saquea la sala para robar una puerta adicional boca abajo. No es un tesoro de monstruo.", "Termina el turno con un máximo de cinco cartas. El equipo visible de la mochila no cuenta para ese límite."] },
    { title: "Combate y decisiones", lines: ["El nivel mide el progreso hasta 10. La fuerza suma nivel, clase, origen, equipo y bonificaciones jugadas. En empate gana el monstruo.", "Elige Luchar; luego todos pueden jugar cartas o pasar. El combate y la petición de ayuda no tienen temporizador. Cada carta jugada o cambio de equipo reinicia las confirmaciones. Solo deben confirmar las personas conectadas y con vida.", "Si todos pasan, gana el grupo más fuerte. Si no, ambos combatientes reales tiran por separado para escapar y reciben la penalización impresa del monstruo si fallan.", "Solo quien inició el combate recibe los niveles indicados. El nivel 10 debe alcanzarse al vencer a un monstruo. El tesoro se reparte según el acuerdo de ayuda aceptado."] },
    { title: "Ayuda y cartas", lines: ["Quien combate pide ayuda primero y ofrece parte del tesoro. Otros pueden sumarse; solo una persona aceptada aporta su fuerza y comparte el riesgo de huida.", "Cualquiera puede jugar un truco de combate a favor de cualquier bando, aunque nadie haya pedido ayuda. Apoyar con cartas no te convierte en combatiente ni da una recompensa automática.", state.allowWinningHelp ? "Configuración: se puede pedir ayuda aunque el grupo ya vaya ganando." : "Configuración: solo se puede pedir ayuda si el grupo no va ganando." ] },
    { title: "Equipo y venta", lines: ["Regla de la casa: todos pueden equipar, guardar, jugar equipo nuevo, vender y usar cartas de nivel en cualquier momento, incluso durante el combate. Las cartas de clase y origen requieren tu turno; maldiciones y niveles pueden apuntar a cualquier persona viva.", "Puedes llevar una pieza de cabeza, cuerpo, pies y accesorio, además de dos espacios para las manos. El equipo sustituido queda visible en la mochila y allí no da fuerza.", "No hay saldo de oro guardado. Selecciona y vende juntos objetos de la mano, el cuerpo o la mochila. Cada 1.000 de valor da un nivel, hasta el nivel 9; el resto se pierde. No hace falta guardar el equipo antes de venderlo."] }
  ];
  if (language === "fr") return [
    { title: "Tour et fouille", lines: ["Révélez une porte. Combattez un monstre, résolvez une malédiction ou gardez une autre carte.", state.fastPlay ? "Partie rapide : piochez une porte cachée supplémentaire au début du tour. Fouiller la salle fait piocher un trésor à la place." : "Sans combat, jouez un monstre de votre main ou fouillez la salle pour piocher une porte cachée. Ce n’est pas un trésor de monstre.", "Terminez votre tour avec cinq cartes au maximum. L’équipement visible du sac ne compte pas dans cette limite."] },
    { title: "Combat et décisions", lines: ["Le niveau mesure la progression vers 10. La force combine niveau, classe, origine, équipement porté et bonus joués. En cas d’égalité, le monstre gagne.", "Choisissez Combattre ; chacun peut ensuite jouer des cartes ou passer. Le combat et la demande d’aide n’ont pas de minuteur. Chaque carte jouée ou changement d’équipement relance les confirmations. Seuls les joueurs connectés et vivants doivent confirmer.", "Si tout le monde passe, le groupe le plus fort gagne. Sinon, les deux véritables combattants lancent séparément les dés pour fuir et subissent la pénalité du monstre en cas d’échec.", "Seul le combattant principal reçoit les niveaux indiqués. Le niveau 10 doit venir d’une victoire contre un monstre. Le trésor est partagé selon l’accord d’aide accepté."] },
    { title: "Aide et cartes", lines: ["Le combattant principal demande d’abord de l’aide et propose une part du trésor. D’autres peuvent se joindre ; seule une personne explicitement acceptée apporte sa force et partage le risque de fuite.", "Tout le monde peut jouer un bonus de combat pour l’un ou l’autre camp, même sans demande d’aide. Soutenir avec des cartes ne fait pas de vous un combattant et ne donne aucune récompense automatique.", state.allowWinningHelp ? "Configuration : l’aide peut être demandée même si le groupe est déjà gagnant." : "Configuration : l’aide n’est possible que si le groupe ne gagne pas." ] },
    { title: "Équipement et vente", lines: ["Règle maison : chacun peut équiper, ranger, jouer du nouvel équipement, vendre et utiliser des cartes de niveau à tout moment, même en combat. Les cartes de classe et d’origine se jouent pendant son tour ; les malédictions et niveaux peuvent viser tout joueur vivant.", "Une pièce pour la tête, le corps, les pieds et un accessoire, plus deux emplacements pour les mains. L’équipement remplacé reste visible dans le sac sans bonus de force.", "Il n’y a pas de réserve d’or. Sélectionnez et vendez ensemble des objets de la main, du corps ou du sac. Chaque tranche de 1 000 donne un niveau, jusqu’au niveau 9 ; le reste est perdu. Inutile de ranger avant la vente."] }
  ];
  if (language === "pt-BR") return [
    { title: "Turno e saque", lines: ["Revele uma porta. Lute contra um monstro, resolva uma maldição ou fique com outra carta.", state.fastPlay ? "Jogo rápido: compre uma porta extra virada para baixo no início do turno. Vasculhar a sala compra um tesouro em vez de uma porta." : "Se não lutou, jogue um monstro da mão ou vasculhe a sala para comprar uma porta extra virada para baixo. Isso não é tesouro de monstro.", "Termine o turno com no máximo cinco cartas. Equipamentos visíveis na mochila não contam nesse limite."] },
    { title: "Combate e decisões", lines: ["O nível mede o progresso até 10. A força soma nível, classe, origem, equipamento e bônus jogados. Em caso de empate, o monstro vence.", "Escolha Lutar; depois, todos podem jogar cartas ou passar. Combate e pedido de ajuda não têm cronômetro. Cada carta jogada ou troca de equipamento reinicia as confirmações. Só pessoas conectadas e vivas precisam confirmar.", "Se todos passarem, o grupo mais forte vence. Caso contrário, os dois combatentes reais rolam separadamente para fugir e sofrem a penalidade impressa do monstro se falharem.", "Só quem iniciou o combate recebe os níveis indicados. O nível 10 deve vir de uma vitória contra um monstro. O tesouro é dividido conforme o acordo de ajuda aceito."] },
    { title: "Ajuda e cartas", lines: ["Quem iniciou o combate pede ajuda e oferece parte do tesouro. Outras pessoas podem se oferecer; apenas uma pessoa aceita soma sua força e compartilha o risco de fuga.", "Qualquer pessoa pode jogar um truque de combate em qualquer lado, mesmo sem pedido de ajuda. Apoiar com cartas não torna você combatente nem dá recompensa automática.", state.allowWinningHelp ? "Configuração: pode pedir ajuda mesmo quando o grupo já está vencendo." : "Configuração: só pode pedir ajuda quando o grupo não está vencendo." ] },
    { title: "Equipamento e venda", lines: ["Regra da casa: todos podem equipar, guardar, jogar equipamento novo, vender e usar cartas de nível a qualquer momento, inclusive durante o combate. Classe e origem ainda exigem seu turno; maldições e níveis podem atingir qualquer pessoa viva.", "Um item de cabeça, corpo, pés e acessório, além de dois espaços para as mãos. Equipamento substituído fica visível na mochila e não concede força.", "Não existe saldo de ouro guardado. Selecione e venda juntos itens da mão, do corpo ou da mochila. Cada 1.000 em valor concede um nível, até o nível 9; o restante se perde. Não é preciso guardar antes de vender."] }
  ];
  return language !== "de" ? [
    { title: "Turn & loot", lines: ["Reveal one Door. Fight a monster; resolve a curse; keep another card.", state.fastPlay ? "Faster play: draw one extra hidden Door at turn start. Loot the Room draws one Treasure instead of a Door." : "If you did not fight, choose a monster from your hand or Loot the Room: draw one additional Door privately. Room Loot is not monster treasure.", "Your turn ends with no more than five hand cards. Backpack equipment is public and does not count towards that limit."] },
    { title: "Combat & decisions", lines: ["Level measures progress towards 10. Combat strength is level plus class, ancestry, equipped gear and played bonuses. Ties favor the monster.", "Choose Fight, then everyone may play cards or choose Do nothing. No combat or help timer exists. Each played card or change to a fighter's equipment resets the passes. Only connected, living players must pass.", "If everyone passes, a stronger party wins. Otherwise both actual fighters roll separately to escape and suffer the monster's printed penalty if they fail.", "Only the main fighter gains the printed level reward. A monster victory must provide level 10. The printed treasure is distributed according to the accepted help agreement."] },
    { title: "Help & card support", lines: ["The main fighter first asks for help and sets the offered treasure. Others may offer to join; only one explicitly accepted helper adds their character strength and shares the escape risk.", "Anyone may play a combat trick on either side, even without a help request. Card support does not make you a participating fighter and earns no automatic reward.", state.allowWinningHelp ? "Setup: help may also be requested while winning." : "Setup: help may only be requested while not winning. This matches classic Munchkin."] },
    { title: "Equipment & selling", lines: ["House rule: all players may equip, stow, play new equipment, sell and use level cards at any time, including during combat. Class and ancestry cards still require your own turn; curses and level cards may target any living player.", "One head, body, feet and accessory item, plus two hand slots. Replaced equipment becomes public backpack reserve with no strength bonus.", "There is no stored gold balance. Select items from hand, body or backpack and sell them together. Each 1,000 value grants one level, up to level 9; any remaining value is lost. Stowing before selling is unnecessary."] }
  ] : [
    { title: "Zug & Raumplündern", lines: ["Eine Türkarte aufdecken: Monster bekämpfen, Fluch ausführen oder andere Karte behalten.", state.fastPlay ? "Schnellspiel: Zu Zugbeginn eine zusätzliche verdeckte Türkarte; beim Raumplündern ein Schatz statt einer Türkarte." : "Ohne Monsterkampf wählst du: ein Monster aus der Hand spielen oder den Raum plündern. Plündern bringt eine zusätzliche verdeckte Türkarte. Das ist keine Schatzbelohnung.", "Am Zugende höchstens fünf Handkarten. Offen ausliegende Rucksack-Ausrüstung zählt nicht zu diesem Limit."] },
    { title: "Kampf & Entscheidungen", lines: ["Stufe bedeutet Fortschritt bis 10. Kampfkraft = Stufe + Klasse + Herkunft + angelegte Ausrüstung + gespielte Boni. Gleichstand gewinnt das Monster.", "Kämpfen wählen, danach dürfen alle weiter Karten spielen oder Nichts unternehmen wählen. Kampf und Hilfesuche haben kein Zeitlimit. Neue Karten und Ausrüstungsänderungen der Kämpfer öffnen alle Bestätigungen erneut. Nur verbundene, lebende Personen müssen bestätigen.", "Wenn alle nichts unternehmen, gewinnt die stärkere Gruppe. Reicht ihre Stärke nicht, würfeln beide tatsächlichen Kämpfer getrennt zur Flucht; bei Fehlschlag trifft sie die Strafe des Monsters.", "Die aufgedruckten Erfahrungsstufen erhält die hauptkämpfende Person. Stufe 10 muss aus einem Monstersieg kommen. Die Schatzkarten werden entsprechend der angenommenen Hilfevereinbarung verteilt."] },
    { title: "Mitkämpfen & Kartenhilfe", lines: ["Zuerst um Hilfe bitten und den Beuteanteil anbieten. Andere bieten ihre Teilnahme an. Erst eine ausdrücklich angenommene Person zählt mit ihrer eigenen Kampfkraft und trägt auch das Fluchtrisiko.", "Kampftricks dürfen alle für Gruppe oder Monster spielen, auch ohne Hilfsanfrage. Kartenhilfe macht niemanden zum Mitkämpfer und gibt keinen automatischen Beuteanspruch.", state.allowWinningHelp ? "Setup: Hilfe auch bei bereits gewinnendem Kampf erlaubt." : "Setup: Hilfe nur bei nicht gewinnendem Kampf erlaubt, entsprechend dem klassischen Munchkin."] },
    { title: "Ausrüstung & Verkaufswert", lines: ["Hausregel: Alle dürfen jederzeit anlegen, ablegen, neue Ausrüstung spielen, verkaufen und Stufenkarten nutzen, auch im Kampf. Klasse und Herkunft ausspielen bleibt auf den eigenen Zug beschränkt. Flüche und Stufenkarten können lebende Zielpersonen treffen.", "Je ein Kopf-, Körper-, Fuß- und Extrateil sowie zwei Handplätze. Ersetzte Gegenstände werden offen im Rucksack aufbewahrt und geben dort keine Stärke.", "Es gibt kein angespartes Goldkonto. Gegenstände direkt aus Hand, Körper oder Rucksack gemeinsam auswählen und verkaufen. Je 1.000 Verkaufswert gibt es eine Stufe bis höchstens 9. Restwert verfällt. Vorheriges Ablegen ist nicht nötig."] }
  ];
}
function stack(id: string, label: string, cards: GuildCard[], kind: CardTableStackState["kind"], faceDown: boolean, en: boolean): CardTableStackState {
  return { id, label, count: cards.length, cards: faceDown ? [] : cards.slice(-4).reverse().map((card) => cardFace(card, en)), kind, faceDown, layout: "pile" };
}
function buildPublic(state: GuildState, context: ServerGameContext): DungeonGuildPublicState {
  const active = current(state);
  const en = context.language !== "de";
  const players = state.players.map((p) => ({ id: p.id, name: p.name, color: p.color, connected: p.connected, dead: p.dead, level: p.level, classCard: p.classCard ? publicCard(p.classCard, en) : null, raceCard: p.raceCard ? publicCard(p.raceCard, en) : null, equipment: p.equipment.map((card) => publicCard(card, en)), handCount: p.hand.length, strength: gearStrength(p) }));
  const stacks = [stack("door-draw", en ? "Doors" : "Türen", state.doorDeck, "draw", true, en), stack("door-discard", en ? "Door discard" : "Tür-Ablage", state.doorDiscard, "discard", false, en), stack("treasure-draw", en ? "Treasure" : "Schätze", state.treasureDeck, "draw", true, en), stack("treasure-discard", en ? "Loot discard" : "Beute-Ablage", state.treasureDiscard, "discard", false, en), ...state.players.map((p) => ({ id: `equipment-${p.id}`, label: `${p.name}: ${en ? "Gear" : "Ausrüstung"}`, count: p.equipment.length + Number(Boolean(p.classCard)) + Number(Boolean(p.raceCard)), cards: [...p.equipment, ...(p.classCard ? [p.classCard] : []), ...(p.raceCard ? [p.raceCard] : [])].map((card) => cardFace(card, en)), kind: "zone" as const, faceDown: false, layout: "spread" as const }))];
  const actions = (playerId: string) => availableActions(state, playerId, en);
  return {
    rulesetId: "dungeon-guild", title: en ? "Dungeon Guild" : "Dungeon-Gilde", deckLabel: en ? "Doors & treasure" : "Tür- & Schatzkarten", backStyle: "diamond", cardStyle: "modern", rules: rulesFor(context.language, state), allowWinningHelp: state.allowWinningHelp, fastPlay: state.fastPlay,
    seats: players.map((p) => ({ playerId: p.id, name: p.name, color: p.color, connected: p.connected, handCount: p.handCount, score: p.level, isActive: p.id === active.id })), stacks,
    activePlayerId: active.id, activePlayerName: active.name, direction: 1, turnNumber: state.turnNumber, hostActions: actions(active.id), conditionLabel: ({ door: ["Tür öffnen", "Open door"], combat: ["Kampf", "Combat"], help: ["Hilfe gesucht", "Asking for help"], main: ["Vorbereiten", "Prepare"], loot: ["Beute", "Loot"], finished: ["Spielende", "Game over"] })[state.stage][en ? 1 : 0], statusMessage: state.message, log: [],
    gameOver: state.phase === "locked", winnerPlayerId: state.winnerId, winnerName: players.find((p) => p.id === state.winnerId)?.name, stage: state.stage, players,
    currentMonster: state.currentMonster ? publicCard(state.currentMonster, en) : null, revealedDoorCard: state.revealedDoorCard ? publicCard(state.revealedDoorCard, en) : null,
    doorRevealNumber: state.doorRevealNumber ?? 0, tablePlays: (state.tablePlays ?? []).map((play) => ({ ...play, card: publicCard(play.card, en) })), lastEscape: state.lastEscape ?? null,
    partyBonuses: state.partyBonuses ?? 0, monsterBonuses: state.monsterBonuses, partyStrength: partyStrength(state), monsterStrength: monsterStrength(state), combatPending: state.combatPending, combatRevision: state.combatRevision, combatPassed: state.combatPassed, combatWaiting: state.combatPending ? waitingPlayers(state) : [], helpOffers: state.helpOffers, helperId: state.helperId,
    helperName: players.find((p) => p.id === state.helperId)?.name ?? null, helperOffer: state.helperOffer, escapeEvents: state.escapeEvents, faceDownLoot: state.faceDownLoot.length, message: state.message
  };
}
function buildController(state: GuildState, context: ServerGameContext, playerId: string) {
  const publicState = buildPublic(state, context); const player = state.players.find((p) => p.id === playerId);
  const ownHand = player?.hand ?? []; const actions = availableActions(state, playerId, context.language !== "de");
  const mayAct = state.phase === "playing" && Boolean(player && !player.dead);
  const en = context.language !== "de";
  return { ...publicState, rules: [], canAct: mayAct, actions, pendingChoiceCardIds: [], hand: ownHand.map((card) => ({ ...cardFace(card, en), playable: Boolean(player && canPlay(state, player, card)), guildCard: publicCard(card, en) })), privateNote: player ? `${en ? "Level" : "Stufe"} ${player.level} · ${en ? "Strength" : "Kampfstärke"} ${gearStrength(player)}` : undefined, ownLevel: player?.level ?? 1, ownStrength: player ? gearStrength(player) : 0, ownHand: ownHand.map((card) => publicCard(card, en)), currentPlayerId: playerId };
}
export default serverGame;
