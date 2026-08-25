# Parser independiente (Claude Code) — para comparar con el de TRAE

Implementación paralela del content model/adapter (Fase 0), escrita por Claude Code
como segunda opinión independiente mientras TRAE construía la suya en
`tools/parse-curriculo/`. No sustituye a la de TRAE ni se integra en la app —
es una referencia de comparación y un banco de pruebas del propio currículo.

## Uso

```
node tools/parse-curriculo-claude/parse.mjs   # genera JSON en output/
node tools/parse-curriculo-claude/test.mjs    # 10 tests de consistencia
```

Sin dependencias externas (Node puro, `.mjs`), a propósito — no toca
`package.json` ni el entorno que está configurando TRAE.

## Hallazgo real de este parser (ya corregido en el currículo)

Los ejercicios E01-E05 y E15-E17 de la Unidad 16 usaban un encabezado `###`
en vez de `####` como el resto del currículo — cualquier parser con el
patrón estándar los pasaba por alto en silencio. Corregido en el commit
`679e20a`. El parser de TRAE tenía el mismo patrón estricto, así que
probablemente se habría encontrado con el mismo hueco al llegar a la U16.

## Diferencias de enfoque con el parser de TRAE (para comparar)

- TRAE: TypeScript tipado, pensado para integrarse directamente en el build de Next.js.
- Claude: JavaScript plano sin dependencias, pensado para ejecutarse solo con `node`,
  útil como banco de pruebas rápido del propio currículo sin necesitar instalar nada.
- Ambos implementan la misma lógica de apertura de sesión (Categoría B si existe,
  si no, plantilla de Categoría A específica para S3/S5, genérica para el resto).
