import { test } from "node:test";
import assert from "node:assert/strict";

import {
  addDays,
  dueJCards,
  dueUnitCards,
  emptySrsState,
  intervalDays,
  parseJCodes,
  recordJFailure,
  recordUnitCompletion,
  reviewJCard,
  reviewUnitCard
} from "../src/lib/srs-engine";

const NOW = new Date(2026, 8, 5, 18).getTime();

test("extrae códigos J1-J8 sin duplicados", () => {
  assert.deepEqual(parseJCodes("Concordancia J1, J2 y otra vez J1"), ["J1", "J2"]);
  assert.deepEqual(parseJCodes("Detalle sin contraste"), []);
});

test("la escalera fija usa 2, 5, 10 y 21 días y queda limitada", () => {
  assert.deepEqual([0, 1, 2, 3, 99].map(intervalDays), [2, 5, 10, 21, 21]);
});

test("un fallo terminal crea tarjetas J para dentro de dos días", () => {
  const state = recordJFailure(emptySrsState(), ["J1", "J4"], "B1-B2-U01-E03", NOW);
  assert.equal(state.jCards.J1?.dueAt, addDays(NOW, 2));
  assert.equal(state.jCards.J4?.lastExerciseId, "B1-B2-U01-E03");
});

test("los aciertos avanzan 5, 10 y 21 días; el cuarto domina la tarjeta", () => {
  let state = recordJFailure(emptySrsState(), ["J4"], "E03", NOW);
  state = reviewJCard(state, "J4", true, addDays(NOW, 2));
  assert.equal(state.jCards.J4?.dueAt, addDays(addDays(NOW, 2), 5));
  state = reviewJCard(state, "J4", true, state.jCards.J4!.dueAt!);
  state = reviewJCard(state, "J4", true, state.jCards.J4!.dueAt!);
  state = reviewJCard(state, "J4", true, state.jCards.J4!.dueAt!);
  assert.equal(state.jCards.J4?.dueAt, null);
});

test("un fallo de repaso reinicia la escalera y dueJCards solo devuelve vencidas", () => {
  let state = recordJFailure(emptySrsState(), ["J4"], "E03", NOW);
  assert.equal(dueJCards(state, NOW).length, 0);
  state = reviewJCard(state, "J4", false, addDays(NOW, 2));
  assert.equal(state.jCards.J4?.repetition, 0);
  assert.equal(dueJCards(state, addDays(NOW, 4)).length, 1);
});

test("una unidad completa reaparece a 7, 21 y 56 días sin duplicarse", () => {
  let state = recordUnitCompletion(emptySrsState(), "B1-B2-U01", NOW);
  state = recordUnitCompletion(state, "B1-B2-U01", addDays(NOW, 1));
  assert.equal(state.unitCards["B1-B2-U01"].dueAt, addDays(NOW, 7));
  assert.equal(dueUnitCards(state, addDays(NOW, 6)).length, 0);
  assert.equal(dueUnitCards(state, addDays(NOW, 7)).length, 1);

  state = reviewUnitCard(state, "B1-B2-U01", true, addDays(NOW, 7));
  assert.equal(state.unitCards["B1-B2-U01"].dueAt, addDays(NOW, 21));
  state = reviewUnitCard(state, "B1-B2-U01", true, addDays(NOW, 21));
  assert.equal(state.unitCards["B1-B2-U01"].dueAt, addDays(NOW, 56));
  state = reviewUnitCard(state, "B1-B2-U01", true, addDays(NOW, 56));
  assert.equal(state.unitCards["B1-B2-U01"].dueAt, null);
});
