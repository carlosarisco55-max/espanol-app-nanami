# Hyperframes Composition Brief: Nanami

## Objective
Crear un vídeo corto de producto que explique el valor central de Nanami: acompañar a la alumna justo después del error sin sustituir el español.

## Output
- Composition directory: `docs/brag/2026-10-12-canvas-explainer/composition/`
- Rendered video: `docs/brag/2026-10-12-canvas-explainer/brag.mp4`
- Format: square — 1080x1080
- Duration: 22.9 seconds

## Source Material
- Project root: `C:\Users\carlo\dev\espanol-app`
- Primary files read: `src/app/layout.tsx`, `src/app/globals.css`, `ARCHITECTURE.md`, `content/curriculo-b1-b2.md`, `content/feedback-en.md`, canvas interactivo de Nanami
- Product name: Nanami
- Tagline / strongest claim: «Una app de español que acompaña justo después del error»
- Key UI or visual moment to recreate: ejercicio real `B1-B2-U01-E02`, ítem 7, con fallo y despliegue del apoyo inglés debajo de la explicación española
- Copy that must appear verbatim:
  - El error no debería dejarte sola.
  - ¡Qué persona tan ______! No para de contar chistes.
  - persona es femenino siempre, aunque se refiera a un hombre.
  - persona is always feminine, even when it refers to a man.
  - 16 unidades · 80 sesiones · 356 ejercicios
  - B1 → B2. A tu ritmo.

## Creative Direction
- Tone preset: polished
- Creative direction: producto editorial cálido, preciso y emocionalmente seguro
- Interpretation: el vídeo se siente como la app — adulto, sereno y claro. El movimiento demuestra acciones reales y evita tanto el ruido de una demo técnica como el aspecto de una presentación de diapositivas.
- Angle: enseñar primero el momento donde Nanami aporta más valor y usar la escala del producto como evidencia posterior.
- Hook: «El error no debería dejarte sola.»
- Outro / punchline: «B1 → B2. A tu ritmo.»
- Avoid:
  - Ejercicios o cifras inventadas
  - Sustituir el español por el inglés
  - Interfaz genérica de SaaS
  - Gradientes, neón o recursos visuales ajenos a Nanami
  - Exceso de tarjetas o texto pequeño

## Visual Identity
- Background: `#eeece2`
- Text: `#1c1a1f`
- Accent: `#223059`
- Warm accent: `#c1531f`
- Raised surface: `#f8f6ee`
- Line: `#d8d2bf`
- Display font: `Georgia, "Times New Roman", serif` como fallback local de Instrument Serif
- Body font: `"Segoe UI", system-ui, sans-serif` como fallback local de Instrument Sans
- Visual references from the project: papel washi, marca `始`, añil japonés, persimón, tarjetas editoriales, recorrido B1→B2 y feedback bilingüe bajo demanda

## Storyboard
Usar `docs/brag/2026-10-12-canvas-explainer/brag-plan.md` como contrato creativo.

Scene summary:
1. El momento vulnerable — 3.27s — marca Nanami y hook.
2. Fallar bien — 7.66s — ejercicio real, selección incorrecta, explicación española y apoyo inglés desplegado.
3. Un recorrido completo — 6.54s — 16 unidades, 80 sesiones, 356 ejercicios; SRS, DELE y local-first.
4. Cierre — 5.43s — B1→B2, a tu ritmo, sin login obligatorio.

## Audio
- Audio role: cama cálida con acentos profesionales mínimos
- Audio arc: serena al inicio, ligeramente más presente en la prueba de producto y resuelta bajo la marca final
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- Music treatment: volumen 0.24–0.30; fade-in breve y fade-out desde 21.8s
- Music cue guidance: preset incluido `happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`; usar como guías 8.74s para el apoyo inglés, 13.11s/17.47s para los datos y 22.93s para el cierre
- Audio-reactive treatment: sutil; halo cálido y textura de fondo responden a RMS/bajos sin alterar la legibilidad
- Audio-coupled moments:
  - Selección de «divertido» — clic seco y discreto
  - Apertura de `🌐 English` — switch suave
  - Marca final — impacto cálido y breve
- SFX selection guidance: escoger archivos de riesgo HF bajo o medio, sin sonido de error punitivo
- SFX analysis guidance: usar el `sfx-analysis.md` incluido en `brag`
- Exact SFX choice: Hyperframes decide los nombres y niveles finales después de montar la animación
- Audio files: copiar música y SFX elegidos a `composition/assets/`

## Hyperframes Instructions
Cargar las skills `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes` y `hyperframes-cli`. Este proyecto sigue el flujo `/brag`, sin entrevista ni workflow genérico adicional.

Requirements:
- Mostrar al menos un momento real de la interfaz y contenido real del currículo.
- Mantener todo el texto legible en 1080x1080.
- Duración exacta aproximada de 22.9s, siempre dentro de 15–25s.
- Incluir música y SFX con atribución documentada.
- Usar una única timeline GSAP pausada y seek-safe.
- Declarar escenas con `class="clip"` y tiempos `data-*`.
- Marcar los reveals ligados a beats en comentarios.
- Mantener el fondo washi y la identidad visual de Nanami en todas las escenas.
- Ejecutar `npx hyperframes check` como gate único antes del preview.
