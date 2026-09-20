import { test } from "node:test";
import assert from "node:assert/strict";

import { stripAuthorDirections, stripItemSourceTag } from "../src/lib/strip-author-notes";

test("quita notas de autoría y HTML crudo, pero deja el foco pedagógico", () => {
  const cleaned = stripAuthorDirections(`
**Banco de palabras de apoyo** (se muestra bajo las preguntas, para que pueda opinar desde el minuto uno):

> ⚠️ **Nota J1 para la app:** el banco se muestra en masculino singular.

> 🔎 **Foco J4.** Los adjetivos de carácter van con ser. Esta es la primera piedra del contraste ser/estar y la app debe presentarla así, en dos listas separadas, no mezcladas.

> *Me dijo —y cito— <span style="font-size:0.9em">«que ya estaba todo decidido»</span>.*
`);

  assert.doesNotMatch(cleaned, /para que pueda opinar/);
  assert.doesNotMatch(cleaned, /Nota J1 para la app/);
  assert.doesNotMatch(cleaned, /la app debe presentarla así/);
  assert.doesNotMatch(cleaned, /<span/);
  assert.match(cleaned, /Foco J4/);
  assert.match(cleaned, /ya estaba todo decidido/);
});

test("quita la etiqueta interna de origen del ítem", () => {
  assert.equal(stripItemSourceTag("habían cenado (U3, J5)"), "habían cenado");
  assert.equal(stripItemSourceTag("hay (U1, J4)"), "hay");
  assert.equal(stripItemSourceTag("sin etiqueta"), "sin etiqueta");
});
