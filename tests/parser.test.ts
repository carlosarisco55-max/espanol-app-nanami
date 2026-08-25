import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";

import { parseCurriculum, readCurriculumFile } from "../tools/parse-curriculo/parser";

const CURRICULUM_PATH = resolve(process.cwd(), "content", "curriculo-b1-b2.md");
const content = readCurriculumFile(CURRICULUM_PATH);

test("parsea exactamente la Unidad 1 cuando se filtra por unitFilter", () => {
  const units = parseCurriculum(content, { unitFilter: "B1-B2-U01" });
  assert.equal(units.length, 1);
  assert.equal(units[0].unitId, "B1-B2-U01");
});

test("no lanza excepción al parsear las 16 unidades sin filtro, aunque solo la U1 tenga bloque de Categoría B", () => {
  const units = parseCurriculum(content);
  assert.equal(units.length, 16);
});

test("la Unidad 1 tiene ficha completa", () => {
  const [unit] = parseCurriculum(content, { unitFilter: "B1-B2-U01" });
  assert.equal(unit.title, "Gente: identidad, carácter y relaciones");
  assert.equal(unit.levelIn, "B1");
  assert.equal(unit.levelOut, "B1+");
  assert.equal(unit.lexiconCore, 68);
  assert.deepEqual(unit.focusCodes, ["J1", "J2", "J4", "J7", "J8"]);
});

test("la Unidad 1 tiene exactamente 5 sesiones con 19 ejercicios en total", () => {
  const [unit] = parseCurriculum(content, { unitFilter: "B1-B2-U01" });
  assert.equal(unit.sessions.length, 5);
  assert.equal(unit.stats.exerciseCount, 19);
  assert.deepEqual(
    unit.sessions.map((s) => s.exerciseIds.length),
    [3, 6, 3, 2, 5]
  );
});

test("los ejercicios de la Unidad 1 están en orden secuencial sin huecos ni duplicados", () => {
  const [unit] = parseCurriculum(content, { unitFilter: "B1-B2-U01" });
  const allIds = unit.sessions.flatMap((s) => s.exerciseIds);
  const numbers = allIds.map((id) => Number(id.match(/E(\d+)$/)![1]));
  numbers.forEach((n, i) => assert.equal(n, i + 1, `hueco/desorden en ${allIds[i]}`));
});

test("las sesiones S1, S2 y S4 de la Unidad 1 usan la apertura de Categoría B ya escrita", () => {
  const [unit] = parseCurriculum(content, { unitFilter: "B1-B2-U01" });
  const bySession = Object.fromEntries(unit.sessions.map((s) => [s.number, s.opening]));

  assert.equal(bySession[1].source, "category_b");
  assert.match(bySession[1].headline, /comida de domingo/);

  assert.equal(bySession[2].source, "category_b");
  assert.match(bySession[2].headline, /hablador, generoso/);

  assert.equal(bySession[4].source, "category_b");
  assert.match(bySession[4].headline, /me cae fenomenal/);
});

test("las sesiones S3 y S5 de la Unidad 1 caen a la plantilla de Categoría A (sin bloque manual)", () => {
  const [unit] = parseCurriculum(content, { unitFilter: "B1-B2-U01" });
  const bySession = Object.fromEntries(unit.sessions.map((s) => [s.number, s.opening]));

  assert.equal(bySession[3].source, "category_a");
  assert.equal(bySession[5].source, "category_a");
  assert.ok(bySession[5].cards && bySession[5].cards.length === 3, "S5 debe traer 3 tarjetas de can-do");
});

test("la Unidad 1 no declara elenco recurrente ni dato curioso (Keiko/Bea/Nacho/Silvia empiezan en U2/U3)", () => {
  const [unit] = parseCurriculum(content, { unitFilter: "B1-B2-U01" });
  assert.equal(unit.continuity.elencoRecurrente, null);
  assert.equal(unit.continuity.datoCuriosoEspana, null);
});

test("todos los can-do de la Unidad 1 se parsean con índice, destreza y texto", () => {
  const [unit] = parseCurriculum(content, { unitFilter: "B1-B2-U01" });
  assert.equal(unit.canDos.length, 6);
  for (const item of unit.canDos) {
    assert.ok(item.index > 0);
    assert.ok(item.label.length > 0);
    assert.ok(item.text.length > 0);
  }
});
