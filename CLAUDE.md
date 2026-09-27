# Nanami (espanol-app) — contexto del proyecto

App de aprendizaje de español para hablantes de japonés. Primera usuaria: adulta japonesa en España, nivel B1 → objetivo B2. Este archivo es el punto de partida para cualquier sesión de IA en este repo — léelo antes de tocar nada.

**Cómo está organizado:** *build* (código/producto) en `src/` y lo que construya TRAE; *brief* (contenido pedagógico, la fuente de verdad que no es código) en `content/curriculo-b1-b2.md`; *track* (decisiones y estado) en `docs/decisions/` + la sección "Estado actual" más abajo en este archivo. Si generas algo nuevo, primero decide en cuál de las tres cae antes de crear un archivo.

## Reparto de trabajo (regla fija, no renegociar sin que el usuario lo pida)

- **Claude Code** → contenido pedagógico: el currículo, sus unidades, ejercicios, y cualquier texto que necesite rigor lingüístico o cultural (incluida la "Categoría B" de aperturas narrativas, ver abajo).
- **TRAE** → producto: UX/UI, navegación, lesson engine, gamificación, progreso, persistencia, arquitectura de código.
- Claude crea contenido; TRAE lo convierte en producto. Ninguno de los dos invade el terreno del otro sin que el usuario lo pida explícitamente.

## Fuentes de verdad (no re-derivar, no inventar)

- **Currículo**: `content/curriculo-b1-b2.md` — 16 unidades B1→B2 desarrolladas íntegramente (~350 ejercicios, 21 scripts de audio, 26 role-plays, ~1.700 ítems de léxico). **No editar a mano** — cualquier cambio de contenido se le pide a Claude Code, nunca se toca directamente ni se genera desde el código de producto.
- **Decisiones de arquitectura**: `docs/decisions/` — registro fechado, cada archivo es una foto de una ronda de decisión. No se editan después de commitear; si algo cambia, se añade un archivo nuevo con fecha nueva.
- **Documentación narrativa/prompts**: página de Notion [🌸 Nanami — app de español](https://app.notion.com/p/3c7322dacd2c812a93e2eeec0c7b6a36), con subpágina [🗂️ Prompts usados](https://app.notion.com/p/3c7322dacd2c81909d33d903f1912340).
- **Repo**: [github.com/carlosarisco55-max/espanol-app-nanami](https://github.com/carlosarisco55-max/espanol-app-nanami) (privado). Este repo es el único sitio de verdad técnico del proyecto — todo lo que se construya vive aquí.

## Reglas pedagógicas absolutas (aplican a todo contenido nuevo, no solo al currículo original)

- El markdown de `content/` es la fuente de verdad: no se sustituye ni se simplifica por ser difícil de programar.
- No inventar vocabulario, gramática, ejercicios ni datos culturales fuera de lo verificado. Ningún dato "curioso sobre España" se escribe sin poder respaldarlo.
- Nada de relleno ni de repetir el mismo ejercicio cambiando una palabra.
- Dificultad real B1→B2, nada infantil. El feedback siempre explica el error, nunca se limita a marcarlo mal.
- Registro: usuaria en España → *tú* y *vosotros*, nunca voseo.

## Modelo de contenido nuevo: Categoría A vs Categoría B

Acordado con TRAE para el modelo de interacción/ritmo de la app (evitar que se sienta como un libro de texto digitalizado):

- **Categoría A** (la construye TRAE, capa de presentación): texto generado por interpolación de campos que YA existen en el currículo parseado (título, cita, nivel MCER, léxico núcleo, can-do, ejemplos de la caja gramatical...). Cero autoría nueva.
- **Categoría B** (la escribe Claude Code, dentro del markdown fuente): contenido genuinamente nuevo que necesita rigor lingüístico/cultural — aperturas de sesión no derivables mecánicamente, datos curiosos verificados, líneas de continuidad de elenco recurrente. Vive como una sección `### Aperturas de sesión (Categoría B)` / `### Continuidad narrativa (Categoría B)` dentro de la ficha de cada unidad en `curriculo-b1-b2.md`. El parser de TRAE la lee como campos opcionales; si no existe para una unidad todavía, usa el fallback de Categoría A.

## Elenco recurrente de los audios (ya existe, no inventar personajes nuevos)

- **Keiko**: hilo emocional principal, aparece en U2, U5, U6, U8, U10, U11, U15 (busca piso → médico → homologar su título universitario → entrevista de trabajo → compra de coche → discusión con Nacho → se reencuentra con todo el grupo en una cena, ya reconciliada). Notas de precisión: en U2 el audio no dice que acabe de llegar a España — el correo modelo de la tarea final de esa unidad la sitúa ya con dos años viviendo en la ciudad. En U6 el trámite real es la homologación de un título universitario (llamada al 060), no el NIE. En U11, escondido en un ejercicio de gramática y un role-play (no en el texto ni el audio principal de la unidad), Keiko y Nacho tienen una discusión — él reveló algo suyo delante de todos en una cena y estuvieron ocho meses distanciados — que ya está resuelta para cuando llegan a la cena conjunta de la U15.
- **Bea, Nacho y Silvia**: se reencuentran — aparecen juntos en U3, y de nuevo en U15 (esta vez con Keiko integrada al grupo, en la cena de amigos del audio `B1-B2-U15-A1`). No reaparecen en la U16: esa unidad es el simulacro DELE B2 y no incluye elenco recurrente, son todo personajes propios del examen — verificado leyendo su contenido completo.
- U1 no tiene elenco recurrente todavía (personajes propios: Lucía y Paco).
- Cuidado con nombres repetidos sin relación entre personajes distintos: "Beatriz" (contertulia de U7, y también un personaje de U12) no es "Bea" de U3/U15. La "Silvia" entrevistadora de U8 (probablemente Silvia Arana, la reclutadora citada en el texto de esa unidad) no es la "Silvia" de U3/U15. El "Álvaro" del audio de U11 no es el "Álvaro" contertulio de U7. Son coincidencias de nombre, no continuidad — no asumir relación entre personajes que comparten nombre sin verificarlo en el propio texto.

## Restricciones técnicas ya decididas (no reabrir sin motivo nuevo)

- Audio: Web Speech API del navegador, sin promesa de acento regional (no es técnicamente posible) — asignación de voz por timbre/género/edad percibida. V2 futura: audio grabado/generado si hace falta más realismo.
- Estado del usuario: IndexedDB local + export/import JSON en V1, sin backend obligatorio. Riesgo conocido y aceptado: progreso no sincroniza entre dispositivos en V1 — mitigado con recordatorio de backup cada 5 sesiones. V2: login opcional (magic link) para sync, sin montar backend propio.
- Motor de ejercicios: `useReducer` + validadores puros, explícitamente **sin XState** (la máquina de estados real es demasiado simple para justificarlo).
- Sin CMS, sin base de datos, sin LLM para corrección en V1. Sin login/registro obligatorio.

## Estado actual

- ✅ Currículo B1→B2 completo (16/16 unidades).
- ✅ Repo Git + GitHub privado.
- ✅ Auditoría de arquitectura y modelo de interacción acordados con TRAE (ver `docs/decisions/`).
- ✅ **Categoría B completa para las 16/16 unidades** (2026-08-31): aperturas de sesión,
  orientación multiidioma y continuidad narrativa del elenco recurrente ya están en
  `curriculo-b1-b2.md` para todas las unidades, no solo la U1. Verificado unidad por unidad
  con el parser real (`tools/parse-curriculo`) y dos rondas de auditoría con subagentes —
  se corrigieron varias sobreafirmaciones y errores de continuidad narrativa por el camino
  (detalle en la sección "Elenco recurrente de los audios" de arriba). Contenido de la fase
  MVP (B1→B2, las 16 unidades) ya no tiene huecos pendientes por parte de Claude Code.
- ✅ **Fase 0** (parser + tests de consistencia) y **Fase 1** (onboarding + camino + Unidad 1
  Sesión 1 renderizada como lectura editorial) completadas por Claude Code, porque TRAE se
  quedó sin créditos (versión gratuita) a media Fase 0. Verificado con capturas reales en
  navegador, no solo `next build`. Stack real: Next.js 15 + React 19 + TypeScript, CSS Modules
  (Tailwind/shadcn previsto por TRAE no se instaló — anotado para que lo valore al retomar).
- ✅ Feedback de uso real del usuario (probó la app en su navegador): 3 bugs reales de
  claridad/accesibilidad corregidos con números (contraste WCAG calculado, no a ojo), más
  el interruptor "🌐 In English" (orientación por sesión, oculta por defecto, sin traducir
  el contenido — esquema ya preparado para `ja` cuando haya revisión nativa).
- ✅ **Fase 2 — motor de ejercicios interactivo (2026-08-27):** los 3 tipos de ejercicio
  de la Sesión 1 (emparejar, opción múltiple, clasificar) ya son interactivos de verdad
  — máquina de estados `useReducer` (idle → fallo_1 con pista → fallo_2 con explicación,
  o correcto), con validación real contra la solución del currículo. Verificado
  interactuando de verdad en navegador (Playwright), no solo con capturas: los 3 tipos,
  los 3 caminos (correcto/primer fallo/segundo fallo). 13/13 tests en verde. TRAE seguía
  sin créditos (límite mensual, no por horas — confirmar fecha real en su panel de
  facturación) así que esta fase también la hizo Claude Code.
- ✅ **Fase 3** (resto de tipos autocorregibles + audio TTS + SRS) y **Fase 4**
  (role-play asimétrico + producción escrita/oral con rúbrica) en `master`.
- ✅ **Fase 5 — MVP de producto cerrado (2026-09-12):** sesiones puente U4/U8/U12,
  simulacro DELE cronometrado en U16 (S1 diagnóstico, S2–S5 de una sentada),
  cuaderno de cierre en `/cierre`, y las 15 fotos de calentamiento como JPEG en
  `public/images/warmups/` (U1–U15, sesión 1). Verificado en localhost: las fotos
  se ven; el fallo anterior era Next Image pidiendo PNG vacíos.
- ✅ **Pulido del MVP (2026-09-20, `609d627`):** puntuación por ítem del simulacro DELE,
  fecha de la última copia y confirmación antes de importar en `/perfil`, el cuaderno de
  cierre no felicita por una carta no guardada, y limpieza de notas de autoría y HTML crudo
  en el texto que ve la alumna. 62/62 tests en verde. También se añadió el vídeo de
  lanzamiento del MVP en `docs/brag/2026-09-20-mvp/` (hecho con la skill `brag`).
- ✅ **Cobertura del motor (2026-09-26, `d228f72`):** 47 de los 52 ejercicios que se pintaban
  como markdown (algunos con la Solución a la vista) ya pasan por el motor; el parser leía
  un solo molde por tipo y no los formatos reales del currículo. Red de seguridad
  `hideStaticSolution` + test que recorre los 356 ejercicios. Quedan 5 en markdown, todos
  en U16 y sin clave que ocultar (E08/E13 hojas de corrección DELE, E15 informe de nivel,
  E16 proyecto final, E17 plan hacia C1). 69/69 tests y `next build` limpio.
- ✅ `ARCHITECTURE.md` y `docs/decisions/2026-09-26-decisiones-fases-3-a-5.md` escritos
  (22b0215): describen lo construido, con la deuda conocida.
- 🔊 **Audio (idea, no decidida):** se probó el diálogo de U15 con voces neuronales es-ES
  (Elvira, Ximena, Álvaro vía `edge-tts`): se entienden y se diferencian, no del todo
  naturales. Bloqueo: la licencia de Azure Speech para redistribuir MP3 generados **no
  está confirmada** (Product Terms sin leer); exige además avisar de que la voz es
  sintética. Alternativa de licencia abierta: Piper (MIT, suena peor). Va después del MVP.

## Plan concreto — semana del 21 al 27 de septiembre de 2026 (objetivo: MVP terminado)

Decidido el 2026-09-20. Este es el orden; no renegociarlo sin motivo:

1. ✅ **Auditoría del MVP — hecha (2026-09-26).** Pasada real con Playwright (subagente
   Opus, 34 capturas): bloqueantes de Emparejar (deadlock), `fallo_2` sin solución ni
   Reintentar, móvil 390px, markdown/notas de autoría en crudo, DELE sin nota, `/cierre`,
   role-play y `/perfil`. Todo arreglado y en `609d627`; verificado: 62/62 tests y
   `next build` limpio. Queda abierta solo la accesibilidad (`aria-*` en 8 archivos).
2. **`ARCHITECTURE.md`** sobre lo ya auditado y corregido (Fases 0–5, no un plan
   futuro). Registrar también en `docs/decisions/` las decisiones de las Fases 3–5:
   hoy solo hay un registro (2026-08-25).
3. **Feedback bilingüe de los ejercicios** (prioridad alta post-MVP, ver abajo).
4. **Despliegue** cuando la auditoría esté cerrada. V1 sin backend obligatorio;
   encaja el plan gratuito de Replit.
5. **Comunicación:** publicar el post de LinkedIn del MVP (borrador en Notion,
   base "Contenido LinkedIn") una vez hecha la auditoría, porque el propio post dice
   "siguiente paso: auditar el MVP".

**Pendientes de limpieza (no bloquean):**

- Worktree `espanol-app-wt-phase3`: **borrado el 2026-09-26** (era un worktree, no una
  copia). Su trabajo sin commitear sigue en la rama `backup/phase3-wip-2026-09-06`
  (local y GitHub). Pendiente: decidir si `tests/parser-exercises.test.ts` (513 líneas,
  no está en `master`) se rescata; después se puede borrar esa rama.
- Vídeo del MVP: si se reutiliza, sustituir el ejercicio de relleno ("Ayer ___ al
  mercado") por uno real del currículo. La música exige atribución (CC BY 4.0).

## Registro para LinkedIn (regla del usuario, `c:\Users\carlo\CLAUDE.md`)

Cuando algo de una sesión sea publicable (decisión con criterio real, bug encontrado por
auditoría independiente, antes/después claro), añade una entrada en
`docs/brag/session-log.md` ANTES de ofrecerlo como borrador — no hace falta esperar a un
hito grande ni a que el usuario lo pida. El borrador final para Notion sale de ahí, pasado
por `linkedin-skills:linkedin-humanizer --mode audit`.

## Pendiente inmediato (2026-09-26) — LÉELO AL EMPEZAR

Cursor se quedó sin créditos con dos prompts sin enviar. Están completos, listos para pegar y con el orden en **`docs/pending/2026-09-26-pendientes-cursor.md`**: (1) bug del parser que pierde 73 explicaciones, (2) feedback bilingüe de los ejercicios. Entre ambos, Claude Code escribe `content/feedback-en.md` (~250 ejercicios; piloto de U1 hecho). Decisión abierta del usuario: qué hacer con las pistas del primer fallo (solo 4 de 356 existen).

## Qué falta por hacer

- Auditoría / `ARCHITECTURE.md` / despliegue — pulido y documentación, no más fases del MVP.
- Escalar el currículo a otros niveles MCER (A1, A2, C1, C2) — arquitectura ya preparada para ello, contenido pendiente. Explícitamente fuera del alcance del MVP actual (B1→B2).

**MVP B1→B2 (contenido + producto de las 16 unidades): cerrado en `master`.** Lo que sigue son mejoras post-MVP y operación.

## Mejoras post-MVP (2026-08-27, feedback de uso real de la Fase 2) — ahora sí tocan

El usuario probó el motor de ejercicios y confirmó que funciona, pero señaló dos huecos reales. Estaban aparcados hasta cerrar Fases 3–5. El MVP ya está cerrado; este es el orden:

1. **(Prioridad alta) Pista/explicación de cada ejercicio solo en español, sin apoyo bilingüe.** El interruptor "🌐 In English" hoy solo cubre la frase de orientación de la sesión, no el feedback de los ejercicios — que es justo el momento más vulnerable (acaba de fallar). Va primero porque es una cuestión de seguridad emocional (el mismo miedo de "no entender nada" ya identificado), no solo de pulido.
2. **(Prioridad baja) La explicación se muestra completa, no filtrada al ítem que falló.** El feedback visual por ítem (verde/rojo en cada pregunta) ya funciona bien; lo que falta es que el TEXTO de la explicación se recorte a la parte relevante cuando el currículo ya la trae troceada por número de ítem (algunos ejercicios sí la traen así, otros son un párrafo único y ahí no se puede trocear sin reescribir contenido). Es mejora de calidad, no de seguridad — puede esperar más que el punto 1.
