# Registro del proceso — Nanami (materia prima para LinkedIn)

Log de sesión en sesión, en bruto, no para publicar tal cual. Cuando toque escribir un post,
se elige el momento que mejor enganche, se pasa por `linkedin-skills:linkedin-humanizer`
en modo `--mode audit`, y se guarda como borrador en la base de Notion "Contenido LinkedIn"
(regla en `c:\Users\carlo\CLAUDE.md`).

Cada entrada: fecha, qué pasó, por qué es publicable (el dato o la tensión concreta).

---

## 2026-08-25 a 27 — Arranque con dos IAs en el mismo repo

TRAE (versión gratuita) se quedó sin créditos a media Fase 0, sin haber escrito ni una
línea de UI. Claude Code retomó el `parser.ts` que TRAE había dejado a medias, encontró un
bug real (parseaba las 16 unidades siempre y fallaba si faltaba un bloque opcional) y siguió
con las Fases 1 y 2 completas, verificadas interactuando de verdad en navegador con
Playwright, no solo con `next build`.

**Gancho posible:** "Empecé el proyecto con dos IAs a la vez. Una se quedó sin crédito a
mitad de la primera tarea. La otra terminó construyendo tres fases enteras sin que se lo
pidiera — porque alguien tenía que hacerlo."

## 2026-08-31 — Categoría B en las 16 unidades, y encontrar el propio error

Al escribir la continuidad narrativa del elenco recurrente (Keiko; Bea, Nacho y Silvia) para
las 16 unidades, un subagente de auditoría encontró que dos afirmaciones mías eran
sobreafirmaciones: dije que dos personajes "no se ponían de acuerdo en nada" cuando el propio
ejercicio destacaba justo el punto en el que sí coincidían; y usé "demuestra" para un estudio
que solo "revela una asociación" — el mismo tipo de error que ese estudio enseña a detectar.

**Gancho posible:** "Le pedí a un segundo agente que auditara mi propio trabajo. Encontró que
yo había cometido el mismo error de sobreafirmación que el contenido enseñaba a detectar."

## 2026-09-05 — Decisión sobre Cursor vs Claude Code para lo que sigue

TRAE pasó a ser de pago. Se evaluaron Cursor, Windsurf, Antigravity (Google) y Codex CLI
(OpenAI) para retomar producto sin depender de una única herramienta de pago fija. Decisión:
Cursor para las fases de construcción activa, con la disciplina de pausar la suscripción
cuando no hay trabajo en marcha — tratarla como una herramienta que se enciende y apaga, no
un gasto fijo.

## 2026-09-06 al 09-26 — Auditoría cruzada real: "la piel de un producto terminado y las
tripas de una demo"

Con el MVP aparentemente cerrado (Fases 3–5, 16 unidades jugables), se lanzó una auditoría
de UX independiente (subagente con Playwright, sin haber escrito el código) navegando la app
como la usuaria real. Veredicto textual: *"tiene la piel de un producto terminado y las
tripas de una demo"*. Encontró un ejercicio con un deadlock real — tras el primer fallo, era
imposible cambiar ninguna respuesta, así que el segundo fallo estaba garantizado siempre — y
lo irónico: ese bug lo había introducido una corrección previa, ya aprobada por mí, que
arreglaba un problema real y creaba uno peor. También encontró notas dirigidas al
desarrollador impresas literalmente para la alumna ("la app debe presentarla así, en dos
listas separadas"), y ejercicios que imprimían su propia solución sin ser interactivos.

**Gancho posible:** "Le pedí a una IA que auditara la app como si fuera la usuaria real. Encontró
un bug que garantizaba que la alumna fallara siempre dos veces — y que ese bug lo había
causado yo mismo, en la corrección anterior que ya había dado por buena."

Después de esa auditoría (arreglos en `609d627`), una segunda pasada de arquitectura
(`ARCHITECTURE.md`, leído del código real) destapó otro hueco: 52 de 356 ejercicios (15%)
seguían sin motor interactivo — se pintaban como texto estático, y 36 de ellos mostraban su
propia solución antes de que la alumna intentara nada. La causa no era falta de contenido:
el parser solo sabía leer un formato por tipo de ejercicio, y el currículo traía varios
formatos reales para el mismo tipo (clasificar, transformar, fonética...). Arreglado a 47/52,
con un test que recorre los 356 ejercicios para que ese hueco no pueda volver a abrirse en
silencio.

**Gancho posible:** "Un 15% de los ejercicios de la app enseñaban la respuesta antes de que
nadie la intentara. No faltaba contenido: el parser solo sabía leer una forma de cada tipo,
y el currículo tenía varias."

## 2026-09-26 — Voces por personaje, sin coste

Prueba de audición con `edge-tts` (voces neuronales de Microsoft, sin cuenta) para dar una
voz distinta a cada personaje del currículo, en vez de la voz única de Web Speech API. Con
solo 3 voces es-ES disponibles gratis, ya se distinguen los cuatro personajes de un diálogo.
Pendiente de confirmar la licencia de redistribución antes de llevarlo a producción.

## 2026-10-04 a 10-12 — El apoyo estaba 4.000 px lejos del error

La app ya tenía un interruptor «In English», pero la auditoría de UX confirmó que quedaba a
unos 4.000 px del ejercicio. En el momento de fallar ni siquiera estaba a la vista. Se cambió
el modelo: el español sigue siendo siempre el feedback principal y el inglés aparece justo
debajo, bajo demanda, únicamente cuando existe una traducción revisada. Hay apoyo en 261 de
los 356 ejercicios y se desactiva por completo durante el simulacro DELE.

También se convirtió este hallazgo en dos piezas reutilizables para LinkedIn: un canvas
interactivo del producto y un vídeo cuadrado que demuestra el flujo con un ejercicio real del
currículo, sin el contenido de relleno que había quedado en el vídeo anterior.

**Gancho posible:** «El botón de ayuda existía. Estaba 4.000 px lejos del momento en que hacía
falta.»

---

## Cómo seguir este archivo

Al final de una sesión con algo publicable (una decisión con criterio real, un bug
encontrado por una auditoría independiente, un antes/después claro), añade una entrada aquí
ANTES de ofrecerla como borrador de LinkedIn — así queda el detalle exacto para cuando se
elija cuál pulir. No hace falta esperar a un hito grande.
