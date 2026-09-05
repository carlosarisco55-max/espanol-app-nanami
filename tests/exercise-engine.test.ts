import { test } from "node:test";
import assert from "node:assert/strict";

import { exerciseReducer, idleExerciseState } from "../src/lib/exercise-engine";

test("idle + acierto termina en correcto", () => {
  const next = exerciseReducer(idleExerciseState, { type: "SUBMIT", correcto: true });
  assert.equal(next.status, "correcto");
  assert.equal(next.intentos, 1);
});

test("idle + fallo pasa a fallo_1 con pista; segundo fallo cierra en fallo_2", () => {
  const first = exerciseReducer(idleExerciseState, { type: "SUBMIT", correcto: false });
  assert.equal(first.status, "fallo_1");
  const recovered = exerciseReducer(first, { type: "SUBMIT", correcto: true });
  assert.equal(recovered.status, "correcto");

  const second = exerciseReducer(first, { type: "SUBMIT", correcto: false });
  assert.equal(second.status, "fallo_2");
  assert.equal(second.intentos, 2);
});

test("REINTENTAR vuelve a idle", () => {
  const failed = exerciseReducer(idleExerciseState, { type: "SUBMIT", correcto: false });
  const reset = exerciseReducer(failed, { type: "REINTENTAR" });
  assert.deepEqual(reset, idleExerciseState);
});
