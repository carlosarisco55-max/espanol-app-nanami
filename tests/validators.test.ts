import { test } from "node:test";
import assert from "node:assert/strict";

import { validarClasificar, validarEmparejar, validarOpcionMultiple } from "../src/lib/validators";

test("emparejar acierta el mapa 1-1 y rechaza letra repetida", () => {
  const solucion = { "1": "b", "2": "a" };
  assert.equal(validarEmparejar({ "1": "b", "2": "a" }, solucion), true);
  assert.equal(validarEmparejar({ "1": "a", "2": "a" }, solucion), false);
  assert.equal(validarEmparejar({ "1": "b" }, solucion), false);
});

test("opción múltiple compara cada ítem con la clave", () => {
  const solucion = { "1": "a", "2": "c" };
  assert.equal(validarOpcionMultiple({ "1": "a", "2": "c" }, solucion), true);
  assert.equal(validarOpcionMultiple({ "1": "a", "2": "b" }, solucion), false);
});

test("clasificar exige cada palabra en su columna", () => {
  const solucion = { SER: ["alto"], ESTAR: ["cansado"] };
  assert.equal(validarClasificar({ alto: "SER", cansado: "ESTAR" }, solucion), true);
  assert.equal(validarClasificar({ alto: "ESTAR", cansado: "ESTAR" }, solucion), false);
});
