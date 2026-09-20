# Hyperframes Composition Brief: Nanami

## Objective
Create a short launch-style brag video for Nanami (app de español B1→B2 para hablantes de japonés).

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1280x720 (test: lowest reasonable resolution; ~1 GB RAM free)
- Duration: 16 seconds

## Source Material
- Project root: nanami-copy (copia de dev/espanol-app)
- Primary files read: README.md, package.json, src/app/globals.css, src/app/layout.tsx, src/app/page.tsx, src/app/camino/CaminoView.tsx, src/app/repaso, src/components/exercises
- Product name: Nanami
- Tagline: "Empieza tu español hoy." / "16 unidades, de B1 a B2. Sin clases, sin prisa — a tu ritmo."
- Key UI moments to recreate: masthead con sello 始; formulario "Cuéntame quién eres"; "Tu camino" con 4 bloques; botón "Comprobar"; tarjeta "Repaso espaciado — Vuelve al punto que te costó"
- Copy that must appear verbatim:
  - Nanami
  - Empieza tu español hoy.
  - Cuéntame quién eres
  - ¿Cómo te llamas?
  - Tu camino
  - 16 unidades, de B1 a B2.
  - Unidades 1 a 4 / 5 a 8 / 9 a 12 / 13 a 16
  - Comprobar
  - Repaso espaciado
  - Vuelve al punto que te costó

## Creative Direction
- Tone preset: polished
- Creative direction: película de producto tranquila, como una libreta de estudio bien hecha
- Interpretation: pocas escenas, retenciones largas, movimiento suave, confianza por contención
- Angle / Hook / Outro: ver brag-plan.md
- Avoid: lenguaje genérico de SaaS, relleno abstracto, rediseño no relacionado

## Visual Identity
- Background: #eeece2 (raised #f8f6ee)
- Text: #1c1a1f (soft #514d52)
- Accent: #223059 (tinta azul); cálido #c1531f; salvia #47654a; salvia suave #dde8dc
- Display font: Instrument Serif (fallback serif); Body/UI: Instrument Sans (fallback sans-serif); lectura: Literata
- Visual references: sello 始, papel con grano, tarjeta del formulario con sombra suave

## Storyboard
Ver `brag-plan.md`.
1. Hook — 3.5s — sello 始, "Nanami", "Empieza tu español hoy."
2. Entrada y camino — 4.5s — formulario, B1, 4 bloques uno a uno
3. Ejercicio y repaso — 4.5s — "Comprobar" → verde salvia → tarjeta de repaso
4. Outro — 3.5s — "16 unidades. De B1 a B2. A tu ritmo." + Nanami 始

## Audio
- Audio role: warm bed
- Audio arc: cama suave, SFX mínimos ligados a escribir, entrada de bloques y pulsar "Comprobar"
- Music: assets/music/happy-beats-business-moves-vol-10-by-ende-dot-app.mp3 (110 BPM)
- Music treatment: volumen bajo, fade-in corto, fade-out en los últimos 2s
- Music cue guidance: preset cues/happy-beats-business-moves-vol-10 (rejilla de beats ~0.55s: 0.27, 0.82, 1.37, 1.90, 2.46, 3.01, 3.55, 4.10, 4.64, 5.19, 5.74...). Strong cue cercano al final: 15.82s. Bloques del camino en beats consecutivos, mantener el conjunto en pantalla ≥1s.
- Audio-reactive treatment: none (RAM baja, prueba)
- Audio-coupled moments: tecleo del nombre; 4 bloques del camino; pulsación de "Comprobar"
- SFX selection guidance: keypress-003/007/012 (tecleo), rollover2 (bloques), click_003 (Comprobar), impactSoft_medium_001 (gancho y outro), bong_001 (acento de la tarjeta de repaso)
- Audio files: copiados a composition/assets/

## Hyperframes Instructions
Cargar hyperframes-core, hyperframes-animation, hyperframes-creative, hyperframes-keyframes e hyperframes-cli. Requisitos: mostrar UI/copy real, texto legible, 15-25 s, música + SFX, `hyperframes check` antes de renderizar.
