import assert from "node:assert/strict";
import { test } from "node:test";
import { serverGame as game } from "../dist/server/index.js";

const context = {
  roomCode: "TEST", roundNumber: 1, now: 1_000, deltaMs: 0,
  language: "en", theme: "light", roomSettings: {}, previousRound: null,
  selectedGame: game.manifest,
  players: ["Ada", "Bo", "Cy"].map((name, index) => ({ id: `p${index}`, name, color: "#2288ff", score: 0, isReady: false, connected: true }))
};

test("all card titles, level cards and turn messages are English on English controllers", () => {
  const initial = game.createInitialState(context);
  const cards = [...initial.doorDeck, ...initial.treasureDeck, ...initial.players.flatMap(player => player.hand)];
  const state = { ...initial, players: initial.players.map((player, index) => index ? player : { ...player, hand: cards }) };
  const snapshot = game.toControllerStateForPlayer(state, context, "p0");
  assert.equal(snapshot.ownHand.length, cards.length);
  snapshot.ownHand.forEach((card, index) => {
    assert.notEqual(card.title, cards[index].title, cards[index].id);
    assert.equal(card.id, cards[index].id);
  });
  const playing = game.startRound(initial, context);
  assert.match(playing.message, /may prepare cards, then open the door/);
  assert.equal(game.buildScore(playing, context)[0].reason, "Level 1");
});
