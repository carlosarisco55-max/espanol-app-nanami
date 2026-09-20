import { test } from "node:test";
import assert from "node:assert/strict";

import { closingQuoteFor, notebookStatus } from "../src/lib/course-notebook";
import type { ExerciseProgress } from "../src/lib/storage";

const FULL =
  "Hace cuatro meses no sabías qué era el subjuntivo. Acabas de escribir una carta formal a un ayuntamiento y de valorar cuatro propuestas urbanísticas en voz alta. Lo que queda ya no es un curso: es vivir en el idioma. Y eso lo llevas haciendo desde la Unidad 1.";
const SHORT =
  "Hace cuatro meses no sabías qué era el subjuntivo. Hoy lo usas en siete contextos distintos. Vamos a comprobarlo.";

function record(exerciseId: string, answers: Record<string, string>): ExerciseProgress {
  return {
    exerciseId,
    unitId: "B1-B2-U01",
    sessionSlug: "s1",
    status: "idle",
    intentos: 0,
    answers,
    updatedAt: 1
  };
}

test("sin trabajo no hay cita de cierre", () => {
  assert.equal(notebookStatus([]).hasAnyWork, false);
  assert.equal(closingQuoteFor(notebookStatus([]), { full: FULL, short: SHORT }), null);
});

test("no felicita por la carta si no está guardada", () => {
  const status = notebookStatus([record("B1-B2-U01-E02", { "1": "a" })]);
  const quote = closingQuoteFor(status, { full: FULL, short: SHORT });
  assert.equal(quote, SHORT);
  assert.doesNotMatch(quote ?? "", /carta formal/);
});

test("solo menciona la carta cuando existe esa entrega", () => {
  const status = notebookStatus([record("B1-B2-U16-s4-exam", { "written-1": "Estimado ayuntamiento" })]);
  const quote = closingQuoteFor(status, { full: FULL, short: SHORT });
  assert.match(quote ?? "", /carta formal/);
  assert.doesNotMatch(quote ?? "", /propuestas urbanísticas/);
});
