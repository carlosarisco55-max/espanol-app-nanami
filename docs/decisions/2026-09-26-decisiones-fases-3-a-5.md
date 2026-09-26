# Decisiones de las Fases 3–5 y cimientos (registro fechado 2026-09-26)

Foto de decisiones ya implementadas, reconstruida a posteriori desde código, tests, commits y `CLAUDE.md`. Solo se incluyen las que tienen evidencia. Donde el motivo no está escrito en un commit, se dice. No editar tras commitear: si algo cambia, archivo nuevo.

## 1. Estado en IndexedDB con esquema versionado y recordatorio de backup cada 5 sesiones
- **Decisión:** progreso, meta y SRS en IndexedDB `nanami` (v2, stores `progress`, `meta`, `srs`), con export/import JSON `version: 2` y aviso de copia al completar 5, 10, 15… sesiones.
- **Motivo:** V1 sin backend ni login; el riesgo de perder progreso al no sincronizar se acepta y se mitiga con el recordatorio (`CLAUDE.md`; `src/lib/progress-logic.ts`, `storage.ts`; commit `f5a6e10`).
- **Alternativa descartada:** backend/login obligatorio (fuera de V1 según `CLAUDE.md`; sync opcional queda para V2).

## 2. SRS con escalera fija 2/5/10/21 días por código J, y 7/21/56 por unidad
- **Decisión:** cada fallo crea/reinicia una tarjeta por código J (J1–J8) que reaparece a 2, 5, 10 y 21 días; al completar una unidad se programan repasos a 7, 21 y 56 días (`src/lib/srs-engine.ts`, tests en `tests/srs-engine.test.ts`; commit `3d0e46b`).
- **Motivo:** los intervalos vienen del plan original (auditoría 2026-08-25). El ejercicio concreto que falló solo se guarda como `lastExerciseId`.
- **Alternativa no adoptada:** un factor de facilidad al estilo SM-2. La auditoría de agosto llamaba al algoritmo "SM-2 simplificado" pero ya fijaba intervalos fijos (7/21/56 por unidad, 2/5/10/21 por código J); el código implementa exactamente esos intervalos, sin factor de facilidad. No hay cambio de rumbo, solo una etiqueta imprecisa en el plan original.

## 3. CSS Modules en lugar de Tailwind/shadcn
- **Decisión:** estilos con CSS Modules; Tailwind y shadcn no se instalaron (no están en `package.json`).
- **Motivo:** la Fase 1 se construyó con CSS Modules porque TRAE no llegó a instalar nada. El 2026-09-05, en la auditoría cruzada con Cursor, se revisó y se decidió mantenerlo: el look editorial (washi/añil/caqui, tipografía serif, contraste medido) es deliberado, Tailwind/shadcn empuja a estética de dashboard genérico, y migrar reescribiría UI ya verificada sin ganancia funcional. Si algún día se adopta Tailwind, sería una migración consciente, no un añadido.
- **Alternativa descartada:** Tailwind + shadcn/ui (propuesta de la auditoría 2026-08-25).

## 4. Fuentes con `next/font/google` en vez de `@import` CSS
- **Decisión:** `layout.tsx` carga Instrument Serif, Literata e Instrument Sans con `next/font/google` y variables CSS; no hay `@import` en `src/`.
- **Motivo:** la auditoría cruzada del 2026-09-05 señaló el `@import` como fuente de layout shift y de dependencia de red en la primera pintura, algo que duele en una app de estética "revista"; se corrigió en el commit `d7fc098`. Efecto real: fuentes autoalojadas por Next tras descargarlas en build.
- **Alternativa descartada:** `@import` de Google Fonts en CSS (inferido; no hay rastro en el código actual).

## 5. Parse de las 16 unidades en `predev`/`prebuild`, sin commitear `public/data`
- **Decisión:** `predev` y `prebuild` ejecutan `pnpm parse`; `public/data/` está en `.gitignore`.
- **Motivo:** el JSON es derivado del markdown; así un clone no depende de un parse manual (commit `3351c8e`). El camino lee el índice en servidor porque un `fetch` fallaba en silencio.
- **Alternativa descartada:** commitear los JSON (el commit `339b888` quitó JSON residual que "no debía entrar en git") o parsear a mano.

## 6. Guard de NFT en el build
- **Decisión:** `build` corre con `--require ./tools/nft-enoent-guard.cjs` y `next.config.ts` crea `.nft.json` vacíos para `_app/_document/_error`.
- **Motivo:** Next 15.5 traza los internos del Pages Router también en App Router y en Windows los ficheros pueden desaparecer durante la generación estática (comentarios del código; commit `9682fbd`).
- **Alternativa descartada:** no consta ninguna en commits; se optó por parche en vez de cambiar de versión de Next. (verificar)

## 7. Modo examen DELE con los encabezados reales de U16, sin ejercicios ficticios
- **Decisión:** el simulacro reutiliza el markdown de U16: `dele-exam.ts` extrae tareas de lectura (Tarea 3 y 4), audio y preguntas orales por encabezado real y oculta soluciones/modelos hasta el final (`hideDeleReview`); cronómetro de una sentada en S2–S5 y puntuación por ítem (commits `9682fbd` "tablas DELE con etiquetas reales", `7ea5d4b`, `609d627`).
- **Motivo:** el markdown es la fuente de verdad y no se sustituye ni se simplifica (`CLAUDE.md`).
- **Alternativa descartada:** crear ejercicios de examen nuevos en código (prohibido por las reglas de contenido).

## 8. Producción libre sin corrección automática; rúbrica visible solo tras el intento
- **Decisión:** `produccion_escrita` y `produccion_oral` no se corrigen; la rúbrica de autoevaluación aparece solo cuando ya se ha enviado el intento (`submitted`) y la alumna marca cada criterio ella misma (`ProduccionEscritaExercise.tsx`, `RubricSelfEval.tsx`).
- **Motivo:** V1 sin LLM para corrección (`CLAUDE.md`, auditoría original).
- **Alternativa descartada:** corrección con LLM (fuera de V1).

## 9. Tarjeta B del role-play oculta durante la escena
- **Decisión:** durante el role-play la alumna solo ve su tarjeta (A); la de la app se muestra al terminar como "Tarjeta que no veías", junto a la transcripción del interlocutor (`RoleplayExercise.tsx`). Corrección a la formulación "nunca se muestra": sí se revela, pero solo tras terminar.
- **Motivo:** la información es asimétrica a propósito, por eso hay que negociar (texto de la propia UI).
- **Alternativa descartada:** mostrar ambas tarjetas desde el inicio (contradice el diseño de la escena).
