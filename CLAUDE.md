# Nanami (espanol-app) — contexto del proyecto

App de aprendizaje de español para hablantes de japonés. Primera usuaria: adulta japonesa en España, nivel B1 → objetivo B2. Este archivo es el punto de partida para cualquier sesión de IA en este repo — léelo antes de tocar nada.

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

- **Keiko**: hilo emocional principal, aparece en U2, U5, U6, U8, U10, U16 (llega a España → busca piso → médico → trámite NIE → entrevista de trabajo → compra → reaparece en el simulacro final).
- **Bea, Nacho y Silvia**: se reencuentran — aparecen juntos en U3 y de nuevo en el cierre, U16.
- U1 no tiene elenco recurrente todavía (personajes propios: Lucía y Paco).

## Restricciones técnicas ya decididas (no reabrir sin motivo nuevo)

- Audio: Web Speech API del navegador, sin promesa de acento regional (no es técnicamente posible) — asignación de voz por timbre/género/edad percibida. V2 futura: audio grabado/generado si hace falta más realismo.
- Estado del usuario: IndexedDB local + export/import JSON en V1, sin backend obligatorio. Riesgo conocido y aceptado: progreso no sincroniza entre dispositivos en V1 — mitigado con recordatorio de backup cada 5 sesiones. V2: login opcional (magic link) para sync, sin montar backend propio.
- Motor de ejercicios: `useReducer` + validadores puros, explícitamente **sin XState** (la máquina de estados real es demasiado simple para justificarlo).
- Sin CMS, sin base de datos, sin LLM para corrección en V1. Sin login/registro obligatorio.

## Estado actual

- ✅ Currículo B1→B2 completo (16/16 unidades).
- ✅ Repo Git + GitHub privado.
- ✅ Auditoría de arquitectura y modelo de interacción acordados con TRAE (ver `docs/decisions/`).
- ✅ Capa de Categoría B de la Unidad 1 añadida al currículo.
- ⏳ TRAE construyendo Fase 0 (parser de contenido + tests de consistencia) para la Unidad 1.
- ⏸️ `ARCHITECTURE.md`: pendiente de crear cuando exista código real que describir (no antes).

## Qué falta por hacer

- Fases 1-5 del plan de TRAE (onboarding, motor de ejercicios, audio/SRS, role-play, sesiones puente + simulacro DELE) — ver el detalle en `docs/decisions/2026-08-25-auditoria-arquitectura.html`.
- Bloques de Categoría B para las unidades 2-16 (se añaden a medida que TRAE las vaya necesitando, no todas de golpe).
- Escalar el currículo a otros niveles MCER (A1, A2, C1, C2) — arquitectura ya preparada para ello, contenido pendiente.
