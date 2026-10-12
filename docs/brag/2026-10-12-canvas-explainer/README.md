# Canvas y vídeo explicativo de Nanami (2026-10-12)

Pieza cuadrada para acompañar una publicación de LinkedIn sobre el feedback bilingüe de Nanami.

## Canvas interactivo

La versión viva que Cursor abre de forma nativa está guardada en:

`C:\Users\carlo\.cursor\projects\c-Users-carlo-dev-espanol-app\canvases\nanami-product.canvas.tsx`

La copia versionada está en `nanami-product.canvas.tsx`. Conserva todo el código interactivo
y permite restaurar el Canvas; para que Cursor lo detecte como Canvas nativo hay que copiarla
de nuevo al directorio administrado `canvases/` del workspace.

## Vídeo

- `brag-plan.md` — concepto y storyboard.
- `composition-brief.md` — brief técnico.
- `composition/index.html` — composición Hyperframes editable.
- `composition/assets/` — música, SFX y datos de audio usados por la composición.
- `share-copy.txt` — caption breve con la atribución musical.
- `brag.mp4` — vídeo final, 1080 × 1080, H.264 + AAC, 22,9 segundos.
- `brag.jpg` — fotograma de portada del vídeo.
- `canvas-cover.jpg` — captura 1080 × 1080 del Canvas, lista como miniatura
  personalizada para el vídeo en LinkedIn.

Todo el contenido visible procede del producto real. El ejercicio es
`B1-B2-U01-E02`, ítem 7; no se reutiliza el ejercicio de relleno del vídeo anterior.

## Publicación en LinkedIn

LinkedIn no permite combinar un vídeo y un documento/carrusel en la misma publicación.
El paquete final usa `brag.mp4` como vídeo nativo y `canvas-cover.jpg` como miniatura
personalizada. El texto listo para pegar está en `share-copy.txt`.

## Licencias

- Música: “Happy Beats & Business Moves Vol. 12”, Sascha Ende, vía
  [ende.app](https://ende.app/en), CC BY 4.0. La atribución debe acompañar cualquier publicación.
- SFX: Kenney, CC0.

## Regeneración

Desde `composition/`:

```text
npx hyperframes check
npx hyperframes preview --background
npx hyperframes render --quality delivery --fps 30 --workers 1 --output ../brag.mp4
```
