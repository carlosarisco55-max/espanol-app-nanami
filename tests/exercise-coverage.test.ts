import { test } from "node:test";
import assert from "node:assert/strict";

import { parseCurriculum, readCurriculumFile } from "../tools/parse-curriculo/parser";
import { splitSessionIntoSegments } from "../src/lib/session-segments";
import { hideStaticSolution } from "../src/lib/hide-static-solution";

const units = parseCurriculum(readCurriculumFile());
const exercises = units.flatMap((unit) => unit.sessions.flatMap((session) => session.exercises));

const DELE_REVIEW_LEFT = new Set([
  "B1-B2-U16-E08",
  "B1-B2-U16-E13",
  "B1-B2-U16-E15",
  "B1-B2-U16-E17"
]);

test("hideStaticSolution quita Solución, explicación y el 💡 de un bloque estático", () => {
  const hidden = hideStaticSolution(`#### \`B1-B2-U01-E10\` — Nivel A

**Lee las frases.**

1. Mi hermana es abogada.

**Solución:**
- **Identidad:** 1

**Explicación de la 5:** una conferencia va con ser.

> 💡 **Por qué.** El ítem 4 es el que más se falla.

---
`);
  assert.doesNotMatch(hidden, /\*\*Soluci[oó]n/i);
  assert.doesNotMatch(hidden, /Identidad/);
  assert.doesNotMatch(hidden, /Por qué/);
  assert.match(hidden, /Lee las frases/);
});

test("ningún autocorregible sin motor deja Solución en el markdown que se renderiza", () => {
  const leaks: string[] = [];

  for (const unit of units) {
    for (const session of unit.sessions) {
      const segments = splitSessionIntoSegments(
        session.rawMarkdown,
        session.exercises,
        session.audios ?? []
      );
      const renderedMarkdown = segments
        .filter((segment) => segment.kind === "markdown")
        .map((segment) => segment.text)
        .join("\n\n");

      for (const exercise of session.exercises) {
        if (exercise.autocorregible !== true || exercise.content !== null) continue;
        const header = new RegExp(`^####\\s+\`${exercise.id}\``, "m");
        if (!header.test(renderedMarkdown)) continue;
        const start = renderedMarkdown.search(header);
        const rest = renderedMarkdown.slice(start);
        const next = rest.slice(1).search(/^####\s+`/m);
        const block = next === -1 ? rest : rest.slice(0, 1 + next);
        if (/\*\*Soluci[oó]n/i.test(block)) leaks.push(exercise.id);
      }
    }
  }

  assert.deepEqual(leaks, []);
});

test("los autocorregibles que quedan sin motor son cero, o solo U16 de revisión DELE", () => {
  const leftover = exercises.filter((exercise) =>
    exercise.autocorregible === true && exercise.content === null
  );
  const unexpected = leftover.filter((exercise) => !DELE_REVIEW_LEFT.has(exercise.id));
  assert.deepEqual(
    unexpected.map((exercise) => `${exercise.id} (${exercise.tipo})`),
    []
  );
});

test("las autoevaluaciones y el proyecto U16-E16 no imprimen un modelo de solución", () => {
  const reading = exercises.filter((exercise) =>
    exercise.content === null && exercise.autocorregible !== true
  );
  const withKey = reading.filter((exercise) => /\*\*Soluci[oó]n/i.test(exercise.raw));
  assert.deepEqual(withKey.map((exercise) => exercise.id), []);
});
