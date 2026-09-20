# Vídeo de lanzamiento del MVP (2026-09-20)

Vídeo corto (16 s, 1280x720, 24 fps) hecho con la skill `brag` de Claude Code (Hyperframes) a partir del código de la app.

- `brag.mp4` — vídeo final (con el póster `brag.jpg` como primer fotograma).
- `brag.jpg` — póster / miniatura.
- `share-copy.txt` — texto para compartir, con la atribución de la música.
- `brag-plan.md`, `composition-brief.md` — plan creativo y brief de composición.
- `composition/index.html` — fuente de la composición (HTML + GSAP).

## Ojo antes de reutilizarlo

- **Contenido de relleno:** el ejercicio "Ayer ___ al mercado" y el nombre "Ana" son ilustrativos, no salen del currículo.
- **Música (CC BY 4.0):** "Happy Beats & Business Moves Vol. 10", Sascha Ende, https://ende.app. Uso comercial permitido; la atribución es obligatoria al publicar (línea en `share-copy.txt`).
- **Assets no incluidos a propósito:** `composition/assets/` (música y efectos de sonido de Kenney, CC0) no se copian aquí; son material de terceros. Vienen de la skill `brag` (`skills/brag/assets/music` y `assets/sfx`). Sin ellos, `index.html` no renderiza; hay que copiarlos de nuevo a `composition/assets/`.
- **Fuentes:** Georgia y Segoe UI del sistema, no las Instrument de la app.

## Cómo regenerarlo

`cd composition && npx hyperframes render --quality draft --fps 24 --workers 1 --output ../brag.mp4` (Node 22+ y FFmpeg; con ~1 GB de RAM libre tardó 38 s).
