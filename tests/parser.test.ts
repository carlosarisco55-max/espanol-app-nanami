import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";

import { parseCurriculum, parseSessionOutline, readCurriculumFile } from "../tools/parse-curriculo/parser";

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

test("Fase 2 — la Sesión 1 de la Unidad 1 tiene 3 ejercicios con contenido estructurado", () => {
  const [unit] = parseCurriculum(content, { unitFilter: "B1-B2-U01" });
  const s1 = unit.sessions[0];
  assert.equal(s1.exercises.length, 3);
  assert.ok(s1.exercises.every((e) => e.content !== null), "los 3 ejercicios de S1 deben tener content parseado");
});

test("Fase 2 — E01 (emparejar) tiene 8 pares y la solución completa", () => {
  const [unit] = parseCurriculum(content, { unitFilter: "B1-B2-U01" });
  const e01 = unit.sessions[0].exercises.find((e) => e.id === "B1-B2-U01-E01")!;
  assert.equal(e01.content?.kind, "emparejar");
  if (e01.content?.kind === "emparejar") {
    assert.equal(e01.content.izquierda.length, 8);
    assert.equal(e01.content.derecha.length, 8);
    assert.equal(Object.keys(e01.content.solucion).length, 8);
    assert.equal(e01.content.solucion["1"], "b");
    assert.ok(e01.content.pista);
    assert.ok(e01.content.explicacion);
  }
});

test("Fase 2 — E02 (opción múltiple) tiene 8 ítems y la explicación completa (4 puntos, no solo el primero)", () => {
  const [unit] = parseCurriculum(content, { unitFilter: "B1-B2-U01" });
  const e02 = unit.sessions[0].exercises.find((e) => e.id === "B1-B2-U01-E02")!;
  assert.equal(e02.content?.kind, "opcion_multiple");
  if (e02.content?.kind === "opcion_multiple") {
    assert.equal(e02.content.items.length, 8);
    assert.equal(e02.content.items[0].opciones.length, 3);
    assert.equal(e02.content.solucion["1"], "a");
    // regresión: antes solo capturaba el primer punto de la explicación ("4 y 5"),
    // perdiendo 6, 7 y 8
    assert.match(e02.content.explicacion ?? "", /4 y 5/);
    assert.match(e02.content.explicacion ?? "", /\b6:/);
    assert.match(e02.content.explicacion ?? "", /\b7:/);
    assert.match(e02.content.explicacion ?? "", /\b8:/);
  }
});

test("Fase 2 — E03 (clasificar) tiene el banco completo y las dos columnas resueltas", () => {
  const [unit] = parseCurriculum(content, { unitFilter: "B1-B2-U01" });
  const e03 = unit.sessions[0].exercises.find((e) => e.id === "B1-B2-U01-E03")!;
  assert.equal(e03.content?.kind, "clasificar");
  if (e03.content?.kind === "clasificar") {
    assert.equal(e03.content.banco.length, 12);
    assert.deepEqual(e03.content.columnas, ["SER", "ESTAR"]);
    assert.equal(e03.content.solucion["SER"].length, 6);
    assert.equal(e03.content.solucion["ESTAR"].length, 6);
    assert.ok(e03.content.solucion["SER"].includes("trabajador"));
    assert.ok(e03.content.solucion["ESTAR"].includes("cansado"));
  }
});

test("el outline de sesión sale del título, no de un mapa fijo por número", () => {
  const u1 = parseCurriculum(content, { unitFilter: "B1-B2-U01" })[0];
  assert.deepEqual(
    u1.sessions[0].outline.map((s) => s.label),
    ["Calentamiento", "vocabulario"]
  );

  const u16 = parseCurriculum(content, { unitFilter: "B1-B2-U16" })[0];
  const s2 = u16.sessions.find((s) => s.number === 2)!;
  assert.equal(s2.outline.length, 1);
  assert.match(s2.outline[0].label, /PRUEBA 1/);
  assert.equal(
    u16.sessions.some((s) => s.outline.some((step) => /Calentamiento/i.test(step.label))),
    false
  );
});

test("parseSessionOutline no parte 'y' si lo que sigue no es un emoji", () => {
  const steps = parseSessionOutline("🗣️ Función comunicativa y role-play");
  assert.equal(steps.length, 1);
  assert.match(steps[0].label, /role-play/);
});

test("extrae el audio canónico de U1 con metadatos y turnos", () => {
  const unit = parseCurriculum(content, { unitFilter: "B1-B2-U01" })[0];
  const audio = unit.sessions[1].audios[0];
  assert.equal(audio.id, "B1-B2-U01-A1");
  assert.match(audio.title, /La nueva del cuarto/);
  assert.equal(audio.lines[0].speaker, "LUCÍA");
  assert.match(audio.lines[0].text, /chica nueva/);
  assert.ok(audio.lines.length >= 15);
});

test("las 15 unidades lectivas tienen un audio canónico y U16 se reserva para el modo examen", () => {
  const units = parseCurriculum(content);
  assert.equal(units.slice(0, 15).filter((unit) => unit.sessions.some((session) => session.audios.length > 0)).length, 15);
  assert.equal(units[15].sessions.flatMap((session) => session.audios).length, 0);
});

test("Fase 3 — parsea huecos, V/F, respuesta corta y discriminación de U1", () => {
  const unit = parseCurriculum(content, { unitFilter: "B1-B2-U01" })[0];
  const exercises = new Map(unit.sessions.flatMap((session) => session.exercises).map((exercise) => [exercise.id, exercise]));

  const huecos = exercises.get("B1-B2-U01-E06")?.content;
  assert.equal(huecos?.kind, "huecos");
  if (huecos?.kind === "huecos") assert.equal(huecos.items.length, 8);
  const textoContinuo = exercises.get("B1-B2-U01-E12")?.content;
  if (textoContinuo?.kind === "huecos") {
    assert.equal(textoContinuo.items.at(-1)?.respuesta, "hago");
  }

  const vf = exercises.get("B1-B2-U01-E05")?.content;
  assert.equal(vf?.kind, "verdadero_falso");
  if (vf?.kind === "verdadero_falso") assert.equal(vf.items.length, 6);

  const corta = exercises.get("B1-B2-U01-E08")?.content;
  assert.equal(corta?.kind, "respuesta_corta");
  if (corta?.kind === "respuesta_corta") assert.equal(corta.items.length, 5);

  const fonetica = exercises.get("B1-B2-U01-E17")?.content;
  assert.equal(fonetica?.kind, "discriminacion_fonetica");
  if (fonetica?.kind === "discriminacion_fonetica") {
    assert.equal(fonetica.items.length, 10);
    assert.equal(fonetica.items[0].respuesta, "A");
    assert.equal(fonetica.items[9].respuesta, null);
  }
});

test("Fase 3 — opción múltiple cubre formato inline, casillas y tablas", () => {
  const units = parseCurriculum(content);
  const exercises = units.flatMap((unit) => unit.sessions.flatMap((session) => session.exercises));
  const multiple = exercises.filter((exercise) => exercise.tipo === "opcion_multiple");
  assert.equal(multiple.length, 53);
  assert.ok(multiple.every((exercise) => exercise.content?.kind === "opcion_multiple"));
  assert.equal(exercises.find((exercise) => exercise.id === "B1-B2-U01-E04")?.content?.kind, "opcion_multiple");

  const u06 = exercises.find((exercise) => exercise.id === "B1-B2-U06-E05")?.content;
  assert.equal(u06?.kind, "opcion_multiple");
  if (u06?.kind === "opcion_multiple") {
    assert.equal(u06.layout, "tabla");
    assert.equal(u06.items.length, 6);
    assert.deepEqual(u06.items[0].opciones.map((option) => option.letra), ["V", "F", "ND"]);
    assert.deepEqual(u06.solucion, { "1": "F", "2": "V", "3": "V", "4": "F", "5": "ND", "6": "V" });
  }

  const u09 = exercises.find((exercise) => exercise.id === "B1-B2-U09-E05")?.content;
  assert.equal(u09?.kind, "opcion_multiple");
  if (u09?.kind === "opcion_multiple") {
    assert.equal(u09.layout, "tabla");
    assert.equal(u09.items.length, 8);
    assert.deepEqual(u09.items[0].opciones.map((option) => option.letra), [
      "Muy probable",
      "Posible",
      "Improbable",
      "Falso"
    ]);
    assert.equal(u09.solucion["5"], "Improbable");
    assert.equal(u09.solucion["7"], "Posible");
  }
});

test("Fase 3 — conserva foco, códigos J y autocorrección por ejercicio", () => {
  const unit = parseCurriculum(content, { unitFilter: "B1-B2-U01" })[0];
  const exercise = unit.sessions[0].exercises.find((item) => item.id === "B1-B2-U01-E03")!;
  assert.equal(exercise.autocorregible, true);
  assert.match(exercise.foco ?? "", /J4/);
  assert.deepEqual(exercise.jCodes, ["J4"]);
});
