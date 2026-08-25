# Nanami — app de español (B1→B2)

Aplicación de aprendizaje de español para hablantes de japonés. Primera usuaria: adulta japonesa en España, nivel B1 → objetivo B2.

**Para el contexto operativo completo (reglas, fuentes de verdad, estado, decisiones ya cerradas), lee [`CLAUDE.md`](./CLAUDE.md) antes de tocar nada.**

## Reparto de trabajo
- **Claude Code** → contenido pedagógico (currículo, unidades, ejercicios).
- **TRAE** → producto (UX/UI, lesson engine, gamificación, progreso, arquitectura).

## Dónde está cada cosa
- `content/curriculo-b1-b2.md` — currículo completo, 16 unidades B1→B2, desarrollo íntegro (fuente de verdad del contenido). No lo edites a mano; si hace falta cambiar algo, pídeselo a Claude Code.
- `docs/decisions/` — registro fechado de decisiones de arquitectura (auditorías, prompts usados). No se editan, se añaden nuevas con fecha.
- Documentación narrativa y prompts también en Notion: [🌸 Nanami — app de español](https://app.notion.com/p/3c7322dacd2c812a93e2eeec0c7b6a36).
- El código de producto vive en `src/` cuando exista — lo construye TRAE a partir del currículo.

## Estado
- ✅ Currículo B1→B2 completo (16/16 unidades, ~350 ejercicios, 21 scripts de audio, 26 role-plays).
- ✅ Arquitectura y modelo de interacción acordados con TRAE.
- ⏳ TRAE construyendo la Fase 0 (parser de contenido) para la Unidad 1.
- 🔭 Futuro: escalar a A1-C2, más unidades, personalización, voz, IA conversacional.
