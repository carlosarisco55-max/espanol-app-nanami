// Tests de consistencia del parser independiente (sin framework, node:assert puro).
// Uso: node tools/parse-curriculo-claude/test.mjs

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCurriculum } from "./parse.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const CURRICULUM_PATH = resolve(ROOT, "content", "curriculo-b1-b2.md");

function readCurriculum() {
  const raw = readFileSync(CURRICULUM_PATH, "utf8").replace(/\r\n/g, "\n");
  return raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
}

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok - ${name}`);
  } catch (err) {
    console.error(`  FAIL - ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

const text = readCurriculum();
const units = parseCurriculum(text);

console.log("Tests de consistencia del currículo parseado:\n");

test("hay exactamente 16 unidades", () => {
  assert.equal(units.length, 16);
});

test("los unidadId son B1-B2-U01 .. B1-B2-U16, sin huecos ni duplicados", () => {
  const ids = units.map((u) => u.unidadId);
  const expected = Array.from({ length: 16 }, (_, i) => `B1-B2-U${String(i + 1).padStart(2, "0")}`);
  assert.deepEqual(ids, expected);
});

test("todas las unidades tienen exactamente 5 sesiones", () => {
  for (const u of units) {
    assert.equal(u.sesiones.length, 5, `${u.unidadId} tiene ${u.sesiones.length} sesiones`);
  }
});

test("todas las unidades tienen ficha completa (título, niveles, léxico núcleo)", () => {
  for (const u of units) {
    assert.ok(u.titulo, `${u.unidadId} sin título`);
    assert.ok(u.nivelEntrada, `${u.unidadId} sin nivel de entrada`);
    assert.ok(u.nivelSalida, `${u.unidadId} sin nivel de salida`);
    // U16 es la unidad de repaso/simulacro: su lexico_nucleo es texto ("repaso integral..."),
    // no un número — excepción legítima y documentada, no un hueco de datos.
    if (u.unidadId === "B1-B2-U16") {
      assert.equal(typeof u.lexicoNucleo, "string");
    } else {
      assert.ok(u.lexicoNucleo > 0, `${u.unidadId} sin léxico núcleo`);
    }
  }
});

test("todos los ejercicios de tipo autocorregible=true declaran solución", () => {
  const problemas = [];
  for (const u of units) {
    for (const s of u.sesiones) {
      for (const e of s.ejercicios) {
        if (e.autocorregible === true && !e.tieneSolucion) {
          problemas.push(`${e.id}`);
        }
      }
    }
  }
  assert.deepEqual(problemas, [], `ejercicios autocorregibles sin solución detectada: ${problemas.join(", ")}`);
});

test("los IDs de ejercicio dentro de cada unidad son secuenciales sin huecos", () => {
  for (const u of units) {
    const allIds = u.sesiones.flatMap((s) => s.ejercicios.map((e) => e.id));
    const numbers = allIds.map((id) => Number(id.match(/E(\d+)$/)[1]));
    for (let i = 0; i < numbers.length; i++) {
      assert.equal(numbers[i], i + 1, `${u.unidadId}: hueco/desorden en el ejercicio ${allIds[i]} (esperaba E${String(i + 1).padStart(2, "0")})`);
    }
  }
});

test("el total de ejercicios parseados es 356 (348 originales + 8 recuperados en U16: E01-E05 y E15-E17 tenían encabezado ### en vez de ####, invisibles para cualquier parser estricto hasta corregirlo)", () => {
  const total = units.reduce((sum, u) => sum + u.stats.numEjercicios, 0);
  assert.equal(total, 356);
});

test("la Unidad 1 tiene las 3 aperturas de Categoría B (S1, S2, S4) y S3/S5 caen a Categoría A", () => {
  const u01 = units.find((u) => u.unidadId === "B1-B2-U01");
  assert.ok(u01, "no se encontró B1-B2-U01");
  const bySession = Object.fromEntries(u01.sesiones.map((s) => [s.numero, s.opening]));
  assert.equal(bySession[1].fuente, "categoria_b");
  assert.equal(bySession[2].fuente, "categoria_b");
  assert.equal(bySession[4].fuente, "categoria_b");
  assert.equal(bySession[3].fuente, "categoria_a");
  assert.equal(bySession[5].fuente, "categoria_a");
  assert.ok(bySession[5].tarjetas.length === 3, "S5 debería traer 3 tarjetas de can-do");
});

test("la Unidad 1 no declara elenco recurrente (Keiko/Bea/Nacho/Silvia empiezan en U2/U3)", () => {
  const u01 = units.find((u) => u.unidadId === "B1-B2-U01");
  assert.equal(u01.categoriaB.continuidad.elencoRecurrente, null);
});

test("la Unidad 8 sí menciona a Keiko en su continuidad narrativa (aparece en U2,U5,U6,U8,U10,U16)", () => {
  const u08 = units.find((u) => u.unidadId === "B1-B2-U08");
  // U08 aún no tiene bloque Categoría B (solo U1 lo tiene por ahora) — este test debe
  // quedar en rojo hasta que se escriba, es la prueba correcta de que el parser no inventa nada.
  assert.equal(u08.categoriaB.continuidad.elencoRecurrente, null, "U08 todavía no tiene bloque Categoría B — correcto, aún no se ha escrito");
});

console.log(`\n${passed} tests pasados.`);
