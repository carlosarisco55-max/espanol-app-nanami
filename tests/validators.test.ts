import { test } from "node:test";
import assert from "node:assert/strict";

import {
  matchesAcceptedAnswer,
  validarClasificar,
  validarDiscriminacion,
  validarEmparejar,
  validarHuecos,
  validarOpcionMultiple,
  validarVerdaderoFalso
} from "../src/lib/validators";

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

test("texto libre ignora mayúsculas, espacios y puntuación final, pero conserva las tildes", () => {
  assert.equal(matchesAcceptedAnswer("  Por el acento! ", "Por el acento."), true);
  assert.equal(matchesAcceptedAnswer("Nueve", "Nueve (eran ocho)."), true);
  assert.equal(matchesAcceptedAnswer("se produjo", "hubo / se produjo"), true);
  assert.equal(matchesAcceptedAnswer("esta", "está"), false);
});

test("huecos valida también los ítems con varias respuestas", () => {
  const items = [{
    numero: "1",
    huecos: 2,
    respuesta: "es / está",
    respuestasPorHueco: ["es", "está"],
    alternativas: []
  }];
  assert.equal(validarHuecos({ "1:0": "Es", "1:1": "está" }, items), true);
  assert.equal(validarHuecos({ "1:0": "es", "1:1": "esta" }, items), false);
});

test("verdadero/falso exige todos los ítems", () => {
  const items = [
    { numero: "1", afirmacion: "Uno", respuesta: "V" as const },
    { numero: "2", afirmacion: "Dos", respuesta: "F" as const }
  ];
  assert.equal(validarVerdaderoFalso({ "1": "V", "2": "F" }, items), true);
  assert.equal(validarVerdaderoFalso({ "1": "V" }, items), false);
});

test("discriminación fonética representa explícitamente el ítem sin contraste", () => {
  const items = [{
    numero: "1",
    opciones: [{ letra: "A", texto: "vale" }, { letra: "B", texto: "bale" }],
    respuesta: null
  }];
  assert.equal(validarDiscriminacion({ "1": "__sin_contraste__" }, items), true);
});
