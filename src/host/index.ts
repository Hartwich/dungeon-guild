import type { HostGame, HostGameStateSource } from "@open-party-lab/game-core";
import { dungeonGuildManifest } from "../manifest.js";
import type { DungeonGuildPublicState, GuildCard } from "../protocol.js";

interface HostState { game?: { phase?: string; state?: unknown } | null; room?: { language?: "de" | "en" } | null; }

const style = `
.dg{--paper:#1d1a17;--ink:#f3ead8;--muted:#b7a98f;--line:#6a5537;--accent:#dfa956;position:absolute;inset:0;overflow:auto;box-sizing:border-box;padding:clamp(14px,2vw,30px);background:radial-gradient(ellipse at 50% -10%,#77542d 0,#34291d 34%,#1b1916 76%);color:var(--ink);font:500 clamp(13px,1.1vw,17px)/1.35 Georgia,serif}.dg *{box-sizing:border-box}.dg h1,.dg h2,.dg p{margin:0}.dg-shell{max-width:1680px;margin:auto;min-height:100%;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:clamp(10px,1.5vh,18px)}.dg-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:11px;border-bottom:1px solid #c79a5738}.dg-brand{display:flex;align-items:center;gap:12px}.dg-mark{width:40px;height:44px;display:grid;place-items:center;border:1px solid #d5a354;border-radius:10px 10px 16px 16px;background:linear-gradient(145deg,#eac27a,#825729);box-shadow:inset 0 0 0 3px #f7e3b547;color:#322214;font:800 22px Georgia,serif}.dg-brand h1{font:600 clamp(18px,2vw,29px)/1 Georgia,serif;letter-spacing:.02em}.dg-brand small{display:block;margin-top:5px;color:#d8b875;font:850 9px system-ui;letter-spacing:.17em;text-transform:uppercase}.dg-phase{border:1px solid #907044;border-radius:999px;padding:7px 12px;color:#f0d095;font:800 11px system-ui;letter-spacing:.06em}.dg-board{display:grid;grid-template-columns:minmax(0,1fr) minmax(250px,.34fr);gap:clamp(12px,1.6vw,22px);min-height:0}.dg-main{display:grid;grid-template-rows:auto minmax(250px,1fr);gap:clamp(10px,1.4vh,18px);min-height:0}.dg-roster{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px}.dg-player{position:relative;display:grid;grid-template-columns:46px minmax(0,1fr);align-items:center;gap:4px 10px;min-height:92px;padding:9px 11px;border-top:1px solid #b48b503d;border-bottom:1px solid #8d70463b;background:linear-gradient(105deg,#ffffff0d,#ffffff03 75%);box-shadow:inset 3px 0 var(--player-color,#b98a46);transition:background .2s,transform .2s}.dg-player.is-active{background:linear-gradient(105deg,#9a6a322b,#ffffff07 75%);transform:translateY(-2px)}.dg-level{grid-row:span 2;display:grid;place-items:center;width:42px;height:48px;border:1px solid #b8935c;border-radius:50% 50% 44% 44%;background:linear-gradient(145deg,#493722,#2b241b);color:#f5d696;font:700 21px Georgia,serif}.dg-level small{margin-top:-7px;color:#b59b6b;font:800 7px system-ui;letter-spacing:.08em}.dg-player-main{display:flex;justify-content:space-between;align-items:center;gap:8px;min-width:0}.dg-player-main strong{overflow:hidden;font:700 clamp(13px,1.05vw,17px) system-ui;text-overflow:ellipsis;white-space:nowrap}.dg-strength{display:flex;align-items:center;gap:5px;flex:0 0 auto;color:#f4d593;font:900 14px system-ui}.dg-strength svg{width:17px;height:17px}.dg-player-meta{display:flex;gap:5px;min-width:0;overflow:hidden}.dg-player-badge{display:flex;align-items:center;gap:4px;min-width:0;padding:3px 5px;border:1px solid #7c684a80;border-radius:6px;background:#241f19;color:#d8c29a;font:700 8px system-ui;white-space:nowrap}.dg-player-badge img{width:19px;height:19px;object-fit:contain}.dg-loadout{grid-column:1/-1;display:flex;align-items:center;gap:5px;min-height:28px;margin-top:1px;overflow:hidden}.dg-gear-icon{position:relative;display:grid;place-items:center;flex:0 0 30px;width:30px;height:30px;border:1px solid #927344;border-radius:7px;background:radial-gradient(circle at 40% 28%,#805d32,#30271e 77%)}.dg-gear-icon img{width:26px;height:26px;object-fit:contain}.dg-gear-icon small{position:absolute;right:-3px;bottom:-3px;min-width:14px;height:14px;padding:1px 2px;border:1px solid #312619;border-radius:999px;background:#dfb35e;color:#322214;font:900 8px system-ui;text-align:center}.dg-gear-empty{color:#947d5c;font:italic 10px Georgia,serif}.dg-encounter{position:relative;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(180px,.9fr);align-items:center;gap:clamp(15px,3vw,48px);min-height:0;padding:clamp(14px,2.2vw,32px);overflow:hidden;border:1px solid #a27c473d;border-radius:20px;background:radial-gradient(ellipse at 25% 48%,#76512955,transparent 45%),linear-gradient(115deg,#30261c,#201c17 68%);box-shadow:0 15px 48px #0005,inset 0 0 32px #d4a45a0c}.dg-encounter::before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,#e4b7650d,transparent 35%,#0002)}.dg-door-scene{position:relative;display:grid;place-items:center;width:min(100%,440px);height:100%;min-height:210px;justify-self:center;perspective:950px}.dg-door-card{position:relative;display:grid;place-items:center;width:min(86%,300px);height:96%;max-height:320px;min-height:205px;overflow:hidden;border:1px solid #d1a25f;border-radius:14px;background:radial-gradient(circle at 50% 34%,#89603a,#2a2118 70%);box-shadow:0 18px 44px #0009}.dg-door-card img{width:100%;height:100%;object-fit:contain;padding:16px;filter:drop-shadow(0 6px 12px #0008);animation:dg-monster-arrive .45s cubic-bezier(.16,.75,.3,1) both}.dg-door-placeholder{display:grid;place-items:center;width:min(86%,250px);height:92%;min-height:210px;border:1px solid #9a794c;border-radius:16px;background:radial-gradient(circle at 50% 38%,#f0ca8148,transparent 32%),linear-gradient(100deg,#4d3821,#76512a 50%,#3c2c1d);color:#f0d59d;box-shadow:0 20px 50px #0008;text-align:center}.dg-door-placeholder svg{width:78px;height:92px;filter:drop-shadow(0 8px 9px #0007)}.dg-door-placeholder span{display:block;margin-top:5px;color:#d7bd8d;font:800 9px system-ui;letter-spacing:.13em;text-transform:uppercase}.dg-door-leaf{position:absolute;z-index:3;top:4%;bottom:4%;width:43%;border:1px solid #c49450;background:repeating-linear-gradient(0deg,transparent 0 43px,#d2a35e22 44px 46px),linear-gradient(115deg,#825a2f,#51361f 65%,#714a26);box-shadow:inset 0 0 0 5px #241a12aa,0 0 18px #0008;backface-visibility:hidden;transition:transform .75s cubic-bezier(.2,.7,.2,1)}.dg-door-leaf::after{content:"";position:absolute;top:48%;width:7px;height:7px;border-radius:50%;background:#e4c27a;box-shadow:0 0 10px #ffd788}.dg-door-left{left:7%;transform-origin:left center;border-radius:10px 2px 2px 10px}.dg-door-left::after{right:8px}.dg-door-right{right:7%;transform-origin:right center;border-radius:2px 10px 10px 2px}.dg-door-right::after{left:8px}.dg-door-scene.is-open .dg-door-left{transform:rotateY(-112deg)}.dg-door-scene.is-open .dg-door-right{transform:rotateY(112deg)}.dg-encounter-copy{position:relative;z-index:4;display:grid;gap:9px;align-content:center;min-width:0}.dg-overline{color:#dbac5e;font:900 9px system-ui;letter-spacing:.18em;text-transform:uppercase}.dg-encounter h2{font:600 clamp(27px,4vw,58px)/.98 Georgia,serif;text-wrap:balance}.dg-encounter p{max-width:510px;color:#d0c0a4;font:500 clamp(13px,1.3vw,19px)/1.35 system-ui}.dg-monster-stats{display:flex;flex-wrap:wrap;gap:7px;margin-top:3px}.dg-stat{display:grid;gap:2px;min-width:80px;padding:7px 9px;border-top:1px solid #c49b5d85;border-bottom:1px solid #755733;background:#ffffff08}.dg-stat small{color:#b9a484;font:800 8px system-ui;letter-spacing:.1em;text-transform:uppercase}.dg-stat b{color:#f3d697;font:700 14px Georgia,serif}.dg-side{display:grid;grid-template-rows:auto auto 1fr;align-content:start;gap:12px;min-height:0}.dg-message{padding:14px;border-left:3px solid var(--accent);background:linear-gradient(100deg,#ffffff0b,#ffffff03);color:#f1e5cf;font:500 clamp(15px,1.4vw,20px)/1.3 Georgia,serif}.dg-decks{display:grid;grid-template-columns:1fr 1fr;gap:8px}.dg-pile{display:grid;grid-template-columns:36px 1fr;align-items:center;gap:8px;min-height:58px;padding:8px;border-bottom:1px solid #9b794c80;background:#ffffff08}.dg-pile-icon{display:grid;place-items:center;width:34px;height:40px;border:1px solid #c29a59;border-radius:6px;background:linear-gradient(145deg,#84613b,#35271a);color:#f2d28f;font:22px Georgia,serif;box-shadow:2px 3px #0004}.dg-pile strong{display:block;color:#e9d2a7;font:850 9px system-ui;letter-spacing:.1em;text-transform:uppercase}.dg-pile b{display:block;margin-top:3px;color:#f7ead2;font:600 18px Georgia,serif}.dg-support{display:grid;align-content:start;gap:10px;padding-top:10px;border-top:1px solid #8168435c}.dg-support h3{color:#dcb66f;font:900 9px system-ui;letter-spacing:.15em;text-transform:uppercase}.dg-support-text{color:#bead90;font:500 12px/1.4 system-ui}.dg-rules{max-height:34vh;overflow:auto;padding:9px 11px;border-top:1px solid #8168435c;color:#e9d6b7;font:11px/1.35 system-ui}.dg-rules summary{cursor:pointer;color:#dcb66f;font-weight:800}.dg-rules section{padding-top:8px}.dg-rules section strong{color:#f1dfbf}.dg-rules section p{margin:4px 0;color:#bead90}.dg-foot{display:flex;justify-content:space-between;gap:10px;padding-top:8px;border-top:1px solid #c79a5730;color:#b8a789;font:800 9px system-ui;letter-spacing:.07em;text-transform:uppercase}.dg-foot strong{color:#e9c782}.dg-empty{color:#d9c7a7;font:italic 18px Georgia,serif}.dg-roster-tools{color:#af9c7b;font:800 9px system-ui;letter-spacing:.1em;text-transform:uppercase}.dg-scene-door-hidden{opacity:0}.dg-scene-door-ready{opacity:1}.dg-event-badge{display:inline-flex;align-items:center;gap:5px;width:max-content;padding:5px 8px;border:1px solid #a9824d;border-radius:999px;background:#6c4c286b;color:#f3d69b;font:850 9px system-ui;letter-spacing:.08em;text-transform:uppercase}
@keyframes dg-monster-arrive{from{opacity:0;transform:translateY(24px) scale(.78) rotate(-4deg)}to{opacity:1;transform:translateY(0) scale(1) rotate(0)}}@keyframes dg-flash{0%{box-shadow:0 0 0 #e3ba66}35%{box-shadow:0 0 42px #e3ba6670}100%{box-shadow:0 15px 48px #0005}}.dg-encounter.is-revealing{animation:dg-flash .8s ease-out both}.dg-player.is-active .dg-level{box-shadow:0 0 22px #dfa95655}.dg-player.is-active .dg-player-main strong{color:#f4d79b}
@media(max-width:960px){.dg{padding:12px}.dg-board{grid-template-columns:minmax(0,1fr) 220px;gap:10px}.dg-roster{grid-template-columns:repeat(2,minmax(0,1fr))}.dg-player{min-height:82px;padding:7px}.dg-encounter{grid-template-columns:1fr;grid-template-rows:minmax(180px,.9fr) auto;gap:8px;padding:12px}.dg-door-scene{min-height:180px}.dg-door-placeholder,.dg-door-card{min-height:170px}.dg-door-card{height:100%}.dg-encounter-copy{text-align:center}.dg-monster-stats{justify-content:center}}
@media(max-width:660px){.dg-board{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) auto}.dg-main{grid-template-rows:auto minmax(190px,1fr)}.dg-roster{grid-template-columns:repeat(2,minmax(0,1fr))}.dg-player{grid-template-columns:36px minmax(0,1fr);min-height:66px;gap:3px 7px;padding:5px}.dg-level{width:34px;height:38px;font-size:17px}.dg-player-main strong{font-size:12px}.dg-player-meta{display:none}.dg-loadout{min-height:24px;margin-top:0}.dg-gear-icon{width:25px;height:25px;flex-basis:25px}.dg-gear-icon img{width:22px;height:22px}.dg-encounter{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);grid-template-rows:1fr;min-height:190px}.dg-door-scene{min-height:170px}.dg-door-card{min-height:155px}.dg-door-placeholder{min-height:155px}.dg-encounter h2{font-size:clamp(22px,5vw,35px)}.dg-encounter p{font-size:12px}.dg-side{grid-template-columns:1fr 1fr;grid-template-rows:auto auto;gap:7px}.dg-message{grid-column:1/-1;padding:8px 10px;font-size:14px}.dg-rules{grid-column:1/-1;max-height:18vh}.dg-support{padding-top:7px}.dg-pile{min-height:48px}.dg-foot{font-size:8px}}
@media(prefers-reduced-motion:reduce){.dg *{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function image(src: string | undefined, alt: string, className: string): HTMLImageElement | null {
  if (!src) return null;
  const node = el("img", className);
  node.src = src;
  node.alt = alt;
  node.draggable = false;
  return node;
}

type Cue = "door" | "combat" | "escape";
let audioContext: AudioContext | null = null;

function playCue(cue: Cue): void {
  if (typeof window === "undefined" || document.visibilityState === "hidden") return;
  try {
    const Context = window.AudioContext;
    if (!Context) return;
    audioContext ??= new Context();
    const ctx = audioContext;
    void ctx.resume().catch(() => undefined);
    const now = ctx.currentTime;
    const note = (frequency: number, duration: number, type: OscillatorType, start = 0, end = frequency, gainValue = 0.08) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now + start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(18, end), now + start + duration);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(gainValue, now + start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(now + start);
      oscillator.stop(now + start + duration + 0.02);
    };
    if (cue === "door") {
      note(118, 0.42, "sawtooth", 0, 48, 0.055);
      note(56, 0.18, "triangle", 0.3, 38, 0.07);
    } else if (cue === "combat") {
      note(180, 0.16, "triangle", 0, 90, 0.08);
      note(310, 0.12, "square", 0.06, 140, 0.035);
      note(74, 0.23, "sine", 0.12, 42, 0.055);
    } else {
      note(320, 0.16, "sine", 0, 520, 0.045);
      note(520, 0.28, "triangle", 0.11, 760, 0.05);
    }
  } catch {
    // Host audio is an enhancement; a browser without Web Audio keeps the same game feedback.
  }
}

function badge(card: GuildCard, en: boolean): HTMLElement {
  const node = el("span", "dg-player-badge");
  const img = image(card.artPath, "", "");
  if (img) node.append(img);
  node.append(el("span", undefined, card.title));
  return node;
}

function draw(root: HTMLElement, app: HostState, en: boolean, reveal: boolean): void {
  const state = app.game?.state as DungeonGuildPublicState | undefined;
  if (!state) { root.replaceChildren(); return; }
  const currentCard = state.currentMonster ?? state.revealedDoorCard;
  const shell = el("main", "dg");
  shell.style.setProperty("--paper", "var(--surface-muted, #1d1a17)");
  shell.style.setProperty("--ink", "var(--text, #f3ead8)");
  const layout = el("div", "dg-shell");
  const header = el("header", "dg-head");
  const brand = el("div", "dg-brand");
  brand.append(el("span", "dg-mark", "✦"));
  const brandText = el("div");
  brandText.append(el("h1", undefined, en ? "Dungeon Guild" : "Dungeon-Gilde"), el("small", undefined, en ? "The table is set" : "Der Tisch ist gedeckt"));
  brand.append(brandText);
  const phase = el("div", "dg-phase", (state.stage === "combat" ? (en ? "Combat" : "Kampf") : state.stage === "help" ? (en ? "Help requested" : "Hilfe gesucht") : state.stage === "finished" ? (en ? "The guild wins" : "Die Gilde gewinnt") : (en ? "Turn " : "Zug ") + state.turnNumber));
  header.append(brand, phase);

  const board = el("section", "dg-board");
  const main = el("div", "dg-main");
  const roster = el("div", "dg-roster");
  for (const player of state.players) {
    const tile = el("article", "dg-player" + (player.id === state.activePlayerId ? " is-active" : ""));
    tile.style.setProperty("--player-color", player.color);
    const level = el("div", "dg-level");
    level.append(document.createTextNode(String(player.level)), el("small", undefined, en ? "LEVEL" : "STUFE"));
    const playerMain = el("div", "dg-player-main");
    playerMain.append(el("strong", undefined, player.name));
    const strength = el("span", "dg-strength");
    strength.append(el("span", undefined, "⚔"), el("b", undefined, String(player.strength)));
    playerMain.append(strength);
    const meta = el("div", "dg-player-meta");
    if (player.classCard) meta.append(badge(player.classCard, en));
    if (player.raceCard) meta.append(badge(player.raceCard, en));
    const loadout = el("div", "dg-loadout");
    if (player.equipment.length) {
      for (const item of player.equipment) {
        const icon = el("span", "dg-gear-icon");
        const img = image(item.artPath, "", "");
        if (img) icon.append(img);
        if (item.equipped !== false) icon.append(el("small", undefined, "+" + (item.bonus ?? 0)));
        loadout.append(icon);
      }
    } else {
      loadout.append(el("span", "dg-gear-empty", en ? "No gear yet" : "Noch keine Ausrüstung"));
    }
    tile.append(level, playerMain, meta, loadout);
    roster.append(tile);
  }

  const encounter = el("section", "dg-encounter" + (reveal ? " is-revealing" : ""));
  const scene = el("div", "dg-door-scene" + (currentCard ? " is-open" : ""));
  if (currentCard) {
    const face = el("div", "dg-door-card");
    const img = image(currentCard.artPath, currentCard.title, "");
    if (img) face.append(img);
    else face.append(el("span", "dg-empty", currentCard.title));
    scene.append(face);
  } else {
    const closed = el("div", "dg-door-placeholder");
    const door = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    door.setAttribute("viewBox", "0 0 64 80");
    door.innerHTML = '<path d="M8 75V8l48-5v72M14 72h44M42 42h.01" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 14v50l32 2V11z" fill="#80572e" stroke="#e1bd78" stroke-width="2"/><path d="M39 38h.01" stroke="#f5db9e" stroke-width="5" stroke-linecap="round"/>';
    const prompt = el("div");
    prompt.append(door, el("span", undefined, en ? "Waiting for the next door" : "Wartet auf die nächste Tür"));
    closed.append(prompt);
    scene.append(closed);
  }
  scene.append(el("span", "dg-door-leaf dg-door-left"), el("span", "dg-door-leaf dg-door-right"));
  const copy = el("div", "dg-encounter-copy");
  copy.append(el("span", "dg-overline", state.currentMonster ? (en ? "Monster revealed" : "Monster aufgedeckt") : state.revealedDoorCard ? (en ? "Door revealed" : "Tür aufgedeckt") : (en ? "Dungeon" : "Dungeon")));
  if (currentCard) {
    copy.append(el("h2", undefined, currentCard.title));
    const details = currentCard.kind === "monster" ? "Level " + (currentCard.level ?? 0) + " · " + (currentCard.levelReward ?? 1) + " " + (en ? "level" : "Stufe") + " · " + (currentCard.goldValue ?? 1) + " " + (en ? "treasures" : "Schätze") : currentCard.effect ?? "";
    copy.append(el("p", undefined, details));
    const stats = el("div", "dg-monster-stats");
    if (currentCard.level !== undefined) {
      const strengthStat = el("div", "dg-stat"); strengthStat.append(el("small", undefined, en ? "Monster strength" : "Monsterstärke"), el("b", undefined, String(currentCard.level))); stats.append(strengthStat);
    }
    if (currentCard.kind === "monster") {
      const party = state.players.find((player) => player.id === state.activePlayerId);
      const partyStat = el("div", "dg-stat"); partyStat.append(el("small", undefined, en ? "Party strength" : "Gruppenstärke"), el("b", undefined, "+" + (party?.strength ?? 0) + (state.monsterBonuses ? " +" + state.monsterBonuses : ""))); stats.append(partyStat);
      const escapeStat = el("div", "dg-stat"); escapeStat.append(el("small", undefined, en ? "Escape roll" : "Fluchtwurf"), el("b", undefined, (currentCard.escapeTarget ?? 5) + "+")); stats.append(escapeStat);
    }
    copy.append(stats);
    if (state.currentMonster && state.helperName) copy.append(el("span", "dg-event-badge", (en ? "Helper" : "Hilfe") + ": " + state.helperName));
  } else {
    copy.append(el("h2", undefined, state.stage === "finished" ? (en ? "Guild complete" : "Gilde am Ziel") : (en ? "Ready for an adventure?" : "Bereit fürs Abenteuer?")));
    copy.append(el("p", undefined, state.stage === "finished" ? (en ? "The victory belongs to " + (state.winnerName ?? "the guild") + "." : "Der Sieg gehört " + (state.winnerName ?? "der Gilde") + ".") : (en ? "Open the door from your phone to reveal what waits inside." : "Öffne die Tür auf deinem Handy und sieh, was dahinter wartet.")));
  }
  encounter.append(scene, copy);
  main.append(roster, encounter);

  const side = el("aside", "dg-side");
  side.append(el("p", "dg-message", state.message));
  const piles = el("div", "dg-decks");
  const doorPile = el("div", "dg-pile"); doorPile.append(el("span", "dg-pile-icon", "⌑")); const doorCopy = el("div"); doorCopy.append(el("strong", undefined, en ? "Door deck" : "Türstapel"), el("b", undefined, String(state.stacks.find((stack) => stack.id === "door-draw")?.count ?? 0))); doorPile.append(doorCopy);
  const treasurePile = el("div", "dg-pile"); treasurePile.append(el("span", "dg-pile-icon", "✧")); const treasureCopy = el("div"); treasureCopy.append(el("strong", undefined, en ? "Treasure" : "Schätze"), el("b", undefined, String(state.stacks.find((stack) => stack.id === "treasure-draw")?.count ?? 0))); treasurePile.append(treasureCopy);
  piles.append(doorPile, treasurePile);
  const support = el("section", "dg-support");
  support.append(el("h3", undefined, en ? "At the table" : "Am Tisch"));
  support.append(el("p", "dg-support-text", state.helperName ? (en ? state.helperName + " is helping; rewards are shared." : state.helperName + " hilft mit; die Beute wird geteilt.") : state.currentMonster ? (en ? "The party needs more strength than the monster." : "Die Gruppe braucht mehr Stärke als das Monster.") : (en ? "Choose your next move on your phone." : "Wähle deinen nächsten Zug am Handy.")));
  if (state.faceDownLoot) support.append(el("span", "dg-event-badge", state.faceDownLoot + (en ? " hidden rewards" : " verdeckte Belohnungen")));
  const rules = el("details", "dg-rules");
  rules.append(el("summary", undefined, en ? "How to play" : "So wird gespielt"));
  for (const section of state.rules) {
    const part = el("section");
    part.append(el("strong", undefined, section.title));
    for (const line of section.lines) part.append(el("p", undefined, line));
    rules.append(part);
  }
  side.append(piles, support, rules);

  const footer = el("footer", "dg-foot");
  footer.append(el("span", undefined, en ? "Private hands · shared adventure" : "Private Hände · gemeinsames Abenteuer"));
  const footerInfo = state.helperName ? (en ? "Helper: " : "Hilfe: ") + state.helperName : state.currentMonster ? (en ? "Fight in progress" : "Kampf läuft") : (en ? "Next: " : "Als Nächstes: ") + (state.activePlayerName ?? "—");
  footer.append(el("strong", undefined, footerInfo));
  layout.append(header, board, footer);
  board.append(main, side);
  shell.append(layout);
  root.replaceChildren(shell);
}

export function mountDungeonGuildHost(rootInput: unknown, source: HostGameStateSource): () => void {
  const root = rootInput as HTMLElement;
  const styleNode = document.createElement("style");
  styleNode.textContent = style;
  root.className = "dg-root";
  let previous: DungeonGuildPublicState | undefined;
  let lastCueKey = "";
  const render = (next: unknown) => {
    const app = next as HostState;
    const state = app.game?.state as DungeonGuildPublicState | undefined;
    const previousReveal = previous?.revealedDoorCard?.id;
    const currentReveal = state?.revealedDoorCard?.id;
    const reveal = Boolean(state?.revealedDoorCard && (previousReveal !== currentReveal || previous?.turnNumber !== state.turnNumber));
    let cue: Cue | undefined;
    if (reveal) cue = "door";
    else if (state?.message !== previous?.message && state?.message.toLowerCase().includes("entkomm")) cue = "escape";
    else if (previous?.currentMonster && !state?.currentMonster && state?.message !== previous.message) cue = "combat";
    const cueKey = cue ? [state?.turnNumber, state?.stage, state?.message].join(":") : "";
    if (cue && cueKey !== lastCueKey) {
      playCue(cue);
      lastCueKey = cueKey;
    }
    const wrapper = document.createElement("div");
    draw(wrapper, app, app.room?.language === "en", reveal);
    root.replaceChildren(styleNode, ...Array.from(wrapper.childNodes));
    previous = state;
  };
  render(source.getState());
  const unsubscribe = source.subscribe(render);
  return () => { unsubscribe(); root.replaceChildren(); };
}

export const hostGame: HostGame = { id: dungeonGuildManifest.id, mountDom: mountDungeonGuildHost };
