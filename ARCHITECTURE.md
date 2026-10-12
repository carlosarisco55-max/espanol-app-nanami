# ARCHITECTURE — Nanami (espanol-app)

Describe lo **construido** (Fases 0–5, MVP B1→B2), leído del código a 2026-09-26. Reglas de contenido, reparto Claude/TRAE y estado: ver `CLAUDE.md`. Plan original: `docs/decisions/2026-08-25-auditoria-arquitectura.html`. Decisiones de Fases 3–5: `docs/decisions/2026-09-26-decisiones-fases-3-a-5.md`.

Stack real: Next.js 15 (App Router) + React 19 + TypeScript, CSS Modules, pnpm. Sin backend, sin base de datos, sin LLM. Dependencias de runtime: `next`, `react`, `react-dom`, `react-markdown`, `remark-gfm`.

## 1. Visión general y flujo de datos

```
content/curriculo-b1-b2.md      (fuente de verdad, no se edita a mano)
content/feedback-en.md          (inglés de pista/explicación; opcional; Claude Code)
   │  pnpm parse  = tsx tools/parse-curriculo/index.ts
   │  (se ejecuta solo: "predev" y "prebuild" en package.json)
   ▼
public/data/index.json + public/data/units/B1-B2-UXX.json   (GENERADO, en .gitignore)
   │  src/lib/curriculum.ts: readFileSync en servidor (getUnitIndex/getUnit/getSession)
   ▼
Server Components (src/app/**)  ──props──►  Client Components (ejercicios, audio, SRS)
                                                   │
                                   IndexedDB "nanami" + localStorage (ver §4)
```

- El parser lee el markdown con regex por encabezados (16 unidades, 5 sesiones cada una) y produce un JSON por unidad: ficha, sesiones (`rawMarkdown`, `outline`, `exercises`, `audios`), stats.
- Si existe `content/feedback-en.md`, el parser adjunta `pistaEn`/`explicacionEn` a cada ejercicio (y deja el esquema listo para `pistaJa`/`explicacionJa`, hoy ausentes). Si el archivo no está, el parseo sigue igual. Un `## ID` que no exista en el currículo avisa por consola y no rompe el build.
- `pnpm parse --unit B1-B2-U01` parsea una sola unidad y fusiona el índice sin pisar las demás.
- Las páginas leen los JSON con `fs` en servidor; no hay `fetch` de datos del currículo desde el cliente.
- Los ejercicios interactivos se "recortan" del markdown de la sesión: `src/lib/session-segments.ts` reconstruye el orden real (texto → ejercicio → audio) y deja como markdown lo que no tiene motor.

## 2. Mapa de carpetas

| Ruta | Qué hace |
|---|---|
| `content/curriculo-b1-b2.md` | Currículo B1→B2 (16 unidades). Solo Claude Code lo cambia. |
| `content/feedback-en.md` | Traducciones inglesas de pista/explicación (Claude Code). El producto no las escribe. |
| `tools/parse-curriculo/parser.ts` | Divide en unidades/sesiones, ficha YAML, `parseSessionOutline`, `buildIndex`. Adjunta i18n de feedback. |
| `tools/parse-curriculo/feedback-i18n.ts` | Lee `feedback-en.md` (si existe), parsea bloques `## ID`, avisa IDs desconocidos. |
| `tools/parse-curriculo/exercises.ts` | `splitExerciseBlocks` (cabecera `#### \`B1-B2-UXX-EYY\``) y `parseExerciseBlock`: convierte cada ejercicio en un `content` tipado. |
| `tools/parse-curriculo/exercise-types.ts` | Tipos `ExerciseContent` (unión discriminada por `kind`). 15 kinds: emparejar, opcion_multiple, clasificar, huecos, verdadero_falso, respuesta_corta, transformar, corregir_error, reordenar, discriminacion_fonetica, dictado, roleplay, produccion_escrita, produccion_oral, autoevaluacion. Campos opcionales `pistaEn`/`explicacionEn`/`pistaJa`/`explicacionJa`. |
| `tools/parse-curriculo/audio.ts` | Extrae scripts de audio (U1–U15) en líneas por hablante. |
| `src/app/` | Rutas: `/` (onboarding), `/camino`, `/unidades/[unitId]` y `/[session]`, `/repaso`, `/perfil`, `/cierre`. |
| `src/lib/exercise-engine.ts` | Máquina `useReducer`: `idle → fallo_1 (pista) → fallo_2 (explicación)` o `correcto`. Sin XState. |
| `src/lib/validators/` | Validadores puros por tipo (`emparejar`, `opcion-multiple`, `clasificar`, `text`, `structured`) exportados desde `index.ts`. |
| `src/lib/use-persisted-answers.ts` | Hook que guarda respuestas/estado de cada ejercicio vía el adaptador de storage. |
| `src/components/exercises/` | Un componente por tipo + `ExerciseRenderer.tsx` (switch por `kind`) + `ExerciseShell.tsx` (flujo común pista/explicación + apoyo `🌐 English` debajo del español, nunca en modo examen DELE). |
| `src/lib/feedback-en.ts` | Preferencia `nanami:feedback-en` (localStorage) y regla de cuándo mostrar el apoyo inglés. |
| `src/lib/storage.ts` | IndexedDB (`nanami`, v2): stores `progress`, `meta`, `srs`; export/import JSON `version: 2`. |
| `src/lib/progress-logic.ts` | Reglas puras: sesión completada, recordatorio de backup cada 5 sesiones, nombre del fichero de copia. |
| `src/components/BackupReminder.tsx`, `src/app/perfil/page.tsx` | Aviso de copia y pantalla de exportar/importar. |
| `src/lib/srs-engine.ts` | SRS por código J (2/5/10/21 días) y por unidad (7/21/56 días). Puro. |
| `src/components/srs/SpacedQueue.tsx`, `src/app/repaso/page.tsx` | Cola del día. |
| `src/lib/tts.ts` | Web Speech API: voces es-ES filtradas, voz por hablante (hash del nombre), velocidad según la descripción del audio. Si no hay voz, devuelve `false`. |
| `src/components/content/AudioScript.tsx` | Reproductor con transcripción visible. |
| `src/components/roleplay/RoleplayExercise.tsx` | Role-play asimétrico: la alumna ve su tarjeta; la otra sale al terminar. |
| `ProduccionEscritaExercise.tsx`, `ProduccionOralExercise.tsx`, `RubricSelfEval.tsx` | Producción libre sin corrección automática, con rúbrica de autoevaluación. |
| `src/lib/dele-exam.ts`, `src/components/dele/` | Modo examen del simulacro U16: extrae tareas de las sesiones reales, oculta soluciones (`hideDeleReview`), cronómetro y puntuación (`score-exercise.ts`). |
| `src/lib/course-notebook.ts`, `src/components/closure/CourseNotebook.tsx`, `src/app/cierre/page.tsx` | Cuaderno de cierre: lee el progreso guardado (U01-E15, exámenes U16 S4/S5) y elige la cita final. |
| `src/lib/profile.ts` | Perfil de onboarding en localStorage. |
| `src/lib/strip-author-notes.ts` | Limpia notas de autoría del texto que ve la alumna. |
| `tools/nft-enoent-guard.cjs` + `next.config.ts` | Parche de build (ver §6). |
| `public/images/warmups/` | 15 JPEG de calentamiento (U1–U15, sesión 1). |

## 3. Añadir un tipo de ejercicio nuevo

1. **Parser**: añadir la interfaz `XContent` (con `kind: "x"`) a la unión `ExerciseContent` en `tools/parse-curriculo/exercise-types.ts`.
2. En `tools/parse-curriculo/exercises.ts`, hacer que `parseExerciseBlock` reconozca el `tipo` del YAML del ejercicio y construya el `content`. El mismo `tipo` puede tener varios formatos de markdown (tabla, lista numerada, banco entre backticks): se encadenan parsers y se reutiliza el `kind`/componente que ya existe. Ejemplo: un `clasificar` de ranking con `→` se parsea como `reordenar`. Si ninguno encaja, `content` queda `null` y el ejercicio se queda como markdown; si además es `autocorregible: true`, `splitSessionIntoSegments` le aplica `hideStaticSolution` para no imprimir **Solución** antes de intentar.
3. **Validador puro** en `src/lib/validators/` (nuevo archivo o en `structured.ts`) y reexportarlo en `validators/index.ts`.
4. **Componente** en `src/components/exercises/XExercise.tsx`, apoyado en `useExerciseEngine` y `ExerciseShell`, con `usePersistedAnswers` si guarda respuestas.
5. **Registrar** el `case "x"` en `src/components/exercises/ExerciseRenderer.tsx`.
6. **Puntuación** (si cuenta para el simulacro): revisar `src/lib/score-exercise.ts`. (verificar si hace falta para tipos no DELE)
7. **Tests**: validador en `tests/validators.test.ts`; parseo en `tests/parser.test.ts`.
8. Regenerar (`pnpm parse`) y comprobar en navegador.

## 4. Persistencia

- **IndexedDB `nanami` (v2)**: `progress` (un registro por ejercicio: estado, intentos, respuestas), `meta` (sesiones completadas y última ronda de backup reconocida), `srs` (tarjetas J y de unidad). Si `indexedDB` no existe, los métodos devuelven vacío y no guardan.
- **localStorage** (`src/lib/profile.ts`): perfil de onboarding y fecha de la última copia exportada. Preferencia de apoyo inglés de los ejercicios: `nanami:feedback-en` (`src/lib/feedback-en.ts`); por defecto oculto.
- **Export/import**: JSON `version: 2` con perfil, progreso, meta y SRS. El progreso no sincroniza entre dispositivos (decisión V1 aceptada en `CLAUDE.md`).
- Aviso de backup: se dispara al llegar a 5, 10, 15… sesiones completadas (`shouldPromptBackup`).

## 5. Testing

`pnpm test` = `node --import tsx --test "tests/**/*.test.ts"` (runner nativo de Node).

- `parser.test.ts`: lee el markdown real; comprueba 16 unidades, fichas, ejercicios, outline por título, tablas DELE, tareas de audio/oral del simulacro.
- `feedback-i18n.test.ts`: fixture de `feedback-en.md` (2 IDs reales + uno inexistente), attach sin romper el build, control inglés solo si hay texto, preferencia `nanami:feedback-en`.
- `exercise-engine`, `validators`, `score-exercise`: reducer, validadores y puntuación por ítem.
- `srs-engine`, `progress-logic`, `storage-export`, `course-notebook`, `strip-author-notes`: lógica pura.
- No hay tests de componentes React ni e2e en el repo; la QA en navegador (Playwright) se hizo aparte y no queda ningún script ni dependencia en el repo (comprobado: ni `package.json` ni `git ls-files`).

## 6. Build y el guard de NFT

`pnpm build` no llama a `next build` directamente: `node --require ./tools/nft-enoent-guard.cjs .../next build`. Motivo (comentarios del código y commit `9682fbd`): Next 15.5 traza los internos del Pages Router (`_app`, `_document`, `_error`) aunque la app sea solo App Router; en Windows esos `.nft.json` pueden desaparecer durante la generación estática y el trazado falla con ENOENT. Dos capas:
- `next.config.ts`: tras emitir el servidor, crea `.nft.json` vacíos si faltan; fija `outputFileTracingRoot`.
- `nft-enoent-guard.cjs`: envuelve `fs.promises.readFile` y devuelve un JSON vacío para esos tres archivos.
Las trazas no se usan (no hay `output: 'standalone'`). Si se cambia a despliegue standalone, revisar esto. Además `pnpm-workspace.yaml` autoriza los scripts de instalación de `esbuild` y `sharp`.

## 7. Deuda conocida

- **JSON pesado**: cada sesión lleva `rawMarkdown` completo además de los ejercicios parseados (`public/data` ≈ 3,3 MB en local); los segmentos se recortan luego en cliente/servidor.
- **Google Fonts en build**: `layout.tsx` usa `next/font/google` (Instrument Serif/Sans, Literata); `next build` descarga las fuentes, así que necesita red. (verificar comportamiento offline)
- **`sessionOutline` derivado del título** (`parseSessionOutline`, commit `5fdeeac`): heurística por texto del encabezado; un título nuevo no reconocido produciría un outline pobre.
- **Regex frágiles en el simulacro**: `hideDeleReview` y las extracciones de `dele-exam.ts` dependen del texto exacto de los encabezados de U16; un cambio en el markdown las rompe (los tests de `parser.test.ts` lo vigilan).
- **Rama `backup/phase3-wip-2026-09-06`** (local y en origin): copia del trabajo sin commitear del worktree de Fase 3. Pendiente decidir si se rescata o se borra. También existe la rama `phase3-parser-exercises` local.
- **Ejercicios sin motor** (`content === null`): 5 de 356 (2026-10-04, parseado del markdown). Autocorregibles con `content === null`: **0**. Los 5 que quedan son U16 y no tienen clave que adelantar: E08/E13 (hojas de corrección DELE, ya cubiertas por `hideDeleReview` en modo examen), E15 (informe de nivel), E16 (proyecto escrito+oral combinado, `autocorregible: false`) y E17 (plan hacia C1). Red de seguridad: `src/lib/hide-static-solution.ts` — si un autocorregible volviera a quedarse sin motor, `splitSessionIntoSegments` oculta **Solución**/explicación/💡 (test en `tests/exercise-coverage.test.ts`).
- **Feedback bilingüe** (2026-10-04): el apoyo inglés va debajo del español en `ExerciseShell` (`fallo_1`/`fallo_2`) cuando el ejercicio trae `pistaEn`/`explicacionEn`. No sustituye el español. No aparece en el modo examen DELE. Role-play, producción escrita/oral y autoevaluación usan `feedback="none"` (rúbrica, no pista/explicación del motor): se dejaron sin control bilingüe. Queda **explicación filtrada por ítem** (post-MVP en `CLAUDE.md`).
- **TTS**: sin promesa de acento regional; calidad depende del navegador. Safari/iOS no comprobado. (verificar)
- `ARCHITECTURE.md` (este archivo) parte de una lectura de código, no de una ejecución de la app.
