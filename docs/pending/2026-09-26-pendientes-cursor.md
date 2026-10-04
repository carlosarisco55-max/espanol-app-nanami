# Pendientes para Cursor (y contenido asociado) — 2026-09-26

Cursor se quedó sin créditos antes de enviar estos prompts. Están listos para pegar tal cual, **en este orden**. Mientras tanto, cualquier cambio de contenido lo hace Claude Code.

Orden: **1 → (contenido inglés, Claude Code) → 2 → resto**.

---

## 1. Bug del parser: 73 explicaciones perdidas (PRODUCTO, primero) — ✅ HECHO (2026-10-04, `d3af973`)

Verificado: 71/71 tests, build limpio, recuento independiente en 0 perdidos reales (los 8
que mi script marcó en U16 son notas de estrategia general, no explicaciones de un ítem,
y no les corresponde el campo). `ExerciseShell` ahora renderiza con `ReactMarkdown` para
no aplastar negritas/viñetas.

```
Bug del parser, a arreglar ANTES del feedback bilingüe. 73 ejercicios interactivos tienen una
explicación en el markdown (bloque "> 💡 **Por qué.** ..." justo tras la **Solución**) que el
parser no captura: emparejar 28 de 30, clasificar 24, corregir_error 10, opcion_multiple 8,
respuesta_corta 2, huecos 1. Ejemplos: B1-B2-U02-E01 (emparejar), B1-B2-U04-E03 (clasificar,
la explicación es una cita de varias líneas con viñetas), B1-B2-U03-E01, U03-E14, U04-E01, U04-E07.
Efecto: en fallo_2 se ve el genérico "No es correcto. Revisa el material" en vez de la
explicación real. Averigua por qué se pierde en cada tipo (posición, cita multilínea, viñetas),
arréglalo sin tocar el currículo, y conserva el formato (negritas, cursivas, viñetas).
Test: que recorra los 356 y falle si un ejercicio interactivo cuyo markdown contiene "Por qué"
no tiene explicación parseada. Cierre: recuento antes/después (debe ser 0 perdidos, o lista con
motivo), tests, build limpio con .next borrado, y en navegador un emparejar y un clasificar
en fallo_2 mostrando la explicación real. Sin commit hasta que yo lo revise.
```

Cómo se contó: sobre `public/data`, ejercicios interactivos cuyo `raw` contiene «Por qué» y cuyo `content.explicacion ?? content.porQue` está vacío.

## 2. Feedback bilingüe de los ejercicios (PRODUCTO, después del 1 y de tener `content/feedback-en.md`)

Añadido respecto al prompt original: el parser debe aceptar valores **multilínea** (el campo puede empezar en la línea siguiente, con viñetas debajo) y **recortar espacios**.

```
Feedback bilingüe de los ejercicios — parte de PRODUCTO. El interruptor "🌐 In English" hoy solo
cubre la orientación de la sesión (arriba del todo) y no el feedback de los ejercicios, que es
justo el momento más vulnerable: acaba de fallar. La auditoría de UX lo confirmó: el interruptor
queda a ~4.000 px del ejercicio, así que en el fallo ni siquiera está a la vista.

Tú NO escribes traducciones ni tocas content/. Yo (Claude Code) escribiré el contenido inglés en
un archivo nuevo, content/feedback-en.md, con este formato exacto (ya fijado, no lo cambies):

    ## B1-B2-U01-E01
    pista: <texto en inglés>
    explicacion: <texto en inglés>

Un bloque por ejercicio; ambos campos opcionales; el texto puede ocupar varias líneas hasta el
siguiente "##" (y puede empezar en la línea siguiente al campo, con viñetas; recorta espacios).
Puede faltar cualquier ejercicio (habrá cobertura parcial al principio).

Qué construir, en lotes pequeños con test tras cada uno:
1. PARSER: lee content/feedback-en.md si existe (si no existe, todo sigue igual, sin error) y
   añade a cada ejercicio, en el JSON generado, `pistaEn?` y `explicacionEn?`. Deja el esquema
   preparado para `ja` (pistaJa/explicacionJa, siempre ausentes por ahora), igual que ya se hizo
   con la orientación. Un ID del archivo que no exista en el currículo debe avisar por consola
   (o en un test), no romper el build.
2. UI, en ExerciseShell: cuando se muestra una pista (fallo_1) o una explicación (fallo_2), y ese
   ejercicio tiene versión en inglés, aparece justo debajo un control "🌐 English" que despliega
   el inglés. Si no hay inglés para ese ejercicio, NO se muestra ningún control (nunca un botón
   que no hace nada).
3. PREFERENCIA: si la alumna lo activa, se recuerda (localStorage, clave propia) y el inglés se
   muestra abierto automáticamente en los siguientes feedbacks; puede volver a ocultarlo. Por
   defecto oculto. Nunca se traduce ni se sustituye el español: el inglés es apoyo, va debajo.
4. ACCESIBILIDAD: el control con aria-pressed/aria-expanded, foco visible, el bloque inglés con
   lang="en", y contraste AA medido (mismos tokens de globals.css). Comprueba que no rompe el
   modo examen del simulacro DELE (ahí no debe haber apoyo bilingüe).
5. También en los feedbacks que no pasan por ExerciseShell (role-play, producción con rúbrica,
   simulacro) SOLO si ya tienen pista/explicación por ejercicio; si no, déjalos y dímelo.

Tests: parser con un fixture en tests/fixtures/ (NO en content/) con 2 ejercicios y uno
inexistente; componente lógico: sin inglés no hay control, con inglés sí; preferencia persistida.

Criterio de cierre: tests en verde, pnpm build limpio con .next borrado (exit 0 real), y en
navegador: fallar un ejercicio, ver la pista, abrir el inglés, fallar otra vez, ver la explicación
con el inglés ya abierto, recargar y comprobar que la preferencia se mantiene; y un ejercicio sin
inglés donde no aparece ningún control. Para la prueba usa el fixture o dos entradas temporales
en content/feedback-en.md que borrarás después (no commitees contenido inventado).

Actualiza solo ARCHITECTURE.md (§ del parser y §7) y no hagas commit hasta que yo lo revise.
```

## 3. Contenido en inglés (CLAUDE CODE) — ✅ HECHO (2026-10-04, `c583bbc`)

`content/feedback-en.md` escrito: 261 de 356 ejercicios, traducidos desde el JSON ya
parseado (no desde el markdown), verificados por lotes sin huecos ni duplicados. No existe
campo `pista` en ningún ejercicio del modelo de datos actual (solo `explicacion`/`porQue`) —
el prompt 2 de abajo debe tratar `pista` como opcional y probablemente siempre ausente por
ahora. El archivo todavía no lo lee ningún parser.

## 4. Decisiones que esperan respuesta

- **Pistas del primer fallo:** solo 4 de 356 ejercicios traen `pista`; el resto muestra el genérico «Casi». Opciones: **A** dejar el genérico · **B** Claude Code escribe pistas cortas para los ~150 ejercicios más usados (contenido nuevo, revisado uno a uno) · **C** mostrar la explicación ya en el primer fallo. Recomendación: B para los más usados y A para el resto.

## 5. Otros pendientes (no bloquean)

- Pasada real en pantalla de los 47 ejercicios que entraron al motor (solo se probaron 3).
- Accesibilidad: `aria-*` solo en 10 archivos de `src/`.
- Verificar: `next build` sin red (Google Fonts) y TTS en Safari/iOS.
- Audio: licencia de Azure Speech para redistribuir MP3 sin confirmar; alternativa Piper (MIT). Después del MVP.
- Limpieza: rama `backup/phase3-wip-2026-09-06` (decidir si se rescata `tests/parser-exercises.test.ts`) y rama local `phase3-parser-exercises`.
- Cierre: despliegue y post de LinkedIn del MVP.
