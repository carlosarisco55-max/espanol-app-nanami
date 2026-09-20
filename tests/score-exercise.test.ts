import { test } from "node:test";
import assert from "node:assert/strict";

import { scoreDeleSession, scoreExerciseContent } from "../src/lib/score-exercise";

test("puntúa aciertos por ítem, no solo el ejercicio entero", () => {
  const scored = scoreExerciseContent(
    {
      kind: "opcion_multiple",
      layout: "items",
      enunciado: "Elige",
      items: [
        { numero: "1", enunciado: "Uno", opciones: [{ letra: "a", texto: "A" }, { letra: "b", texto: "B" }] },
        { numero: "2", enunciado: "Dos", opciones: [{ letra: "a", texto: "A" }, { letra: "b", texto: "B" }] }
      ],
      solucion: { "1": "a", "2": "b" }
    },
    { "1": "a", "2": "a" }
  );
  assert.deepEqual(scored, { correct: 1, total: 2 });
});

test("el simulacro suma ejercicios y la hoja de respuestas extra", () => {
  const result = scoreDeleSession({
    exercises: [
      {
        id: "B1-B2-U16-E01",
        tipo: "opcion_multiple",
        raw: "",
        jCodes: [],
        autocorregible: true,
        content: {
          kind: "opcion_multiple",
          layout: "items",
          enunciado: "Elige",
          items: [{ numero: "1", enunciado: "Uno", opciones: [{ letra: "a", texto: "A" }] }],
          solucion: { "1": "a" }
        }
      }
    ],
    records: { "B1-B2-U16-E01": { "1": "a" } },
    supplemental: [
      {
        taskNumber: 3,
        title: "T3",
        items: [{ number: "1", options: [], answer: "b" }]
      }
    ],
    examAnswers: { "supp-3-1": "c" }
  });
  assert.deepEqual(result, { correct: 1, total: 2 });
});
