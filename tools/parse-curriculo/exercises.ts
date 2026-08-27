import type {
  ClasificarContent,
  EmparejarContent,
  ExerciseBlock,
  ExerciseContent,
  OpcionMultipleContent,
  OpcionMultipleItem
} from "./exercise-types";

const EXERCISE_BLOCK_RE = /^####\s+`(B1-B2-U\d{2}-E\d{2})`.*$/gm;
const YAML_FENCE_RE = /```yaml\n([\s\S]*?)\n```/;

function simplifyInline(value: string): string {
  return value
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/~~/g, "")
    .trim();
}

function extractYamlField(raw: string, field: string): string | undefined {
  const yaml = raw.match(YAML_FENCE_RE)?.[1] ?? "";
  const line = yaml.split("\n").find((l) => l.trim().startsWith(`${field}:`));
  return line?.split(":").slice(1).join(":").trim().replace(/^"|"$/g, "");
}

// Extrae el bloque markdown completo de cada ejercicio dentro del markdown de una sesión.
export function splitExerciseBlocks(sessionMarkdown: string): { id: string; raw: string }[] {
  const matches = [...sessionMarkdown.matchAll(EXERCISE_BLOCK_RE)];
  return matches.map((match, i) => {
    const start = match.index!;
    const end = i + 1 < matches.length ? matches[i + 1].index! : sessionMarkdown.length;
    return { id: match[1], raw: sessionMarkdown.slice(start, end).trim() };
  });
}

export function parseExerciseBlock(id: string, raw: string): ExerciseBlock {
  const tipo = extractYamlField(raw, "tipo") ?? "desconocido";
  let content: ExerciseContent | null = null;

  if (tipo === "emparejar") content = parseEmparejar(raw);
  else if (tipo === "opcion_multiple") content = parseOpcionMultiple(raw);
  else if (tipo === "clasificar") content = parseClasificar(raw);

  return { id, tipo, raw, content };
}

function extractPistaExplicacion(raw: string): { pista?: string; explicacion?: string } {
  // La pista suele ser una sola línea; la explicación a veces es un párrafo y a veces
  // una lista de varios puntos ("Explicación de errores clave:\n- **4 y 5:** ...\n- **6:** ...")
  // — hay que capturar hasta el final del bloque, no solo la primera línea.
  const pista = raw.match(/\*\*Pista[^:]*:\*\*\s*(.+)/)?.[1];
  const explicacionMatch = raw.match(/\*\*Explicaci[oó]n[^:]*:\*\*\s*([\s\S]+?)(?:\n\n---|\n---|$)/);
  const explicacionRaw = explicacionMatch?.[1];

  const explicacion = explicacionRaw
    ? explicacionRaw
        .split("\n")
        .map((line) => simplifyInline(line.replace(/^-\s*/, "")))
        .filter(Boolean)
        .join(" · ")
    : undefined;

  return {
    pista: pista ? simplifyInline(pista) : undefined,
    explicacion
  };
}

function enunciadoBefore(raw: string, marker: RegExp): string {
  const idx = raw.search(marker);
  const yamlEnd = raw.indexOf("```", raw.indexOf("```yaml") + 7) + 3;
  const chunk = idx === -1 ? raw.slice(yamlEnd) : raw.slice(yamlEnd, idx);
  const bold = chunk.match(/\*\*([^*]+)\*\*/);
  return bold ? simplifyInline(bold[1]) : "";
}

function parseEmparejar(raw: string): EmparejarContent | null {
  const rows = [...raw.matchAll(/^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*([a-z])\s*\|\s*(.+?)\s*\|$/gm)];
  if (rows.length === 0) return null;

  const izquierda = rows.map((r) => ({ numero: r[1], texto: simplifyInline(r[2]) }));
  const derechaShuffled = rows.map((r) => ({ letra: r[3], texto: simplifyInline(r[4]) }));

  const solucionLine = raw.match(/\*\*Soluci[oó]n:?\*\*\s*(.+)/)?.[1] ?? "";
  const solucion: Record<string, string> = {};
  for (const m of solucionLine.matchAll(/(\d+)-([a-z])/g)) {
    solucion[m[1]] = m[2];
  }

  const { pista, explicacion } = extractPistaExplicacion(raw);

  return {
    kind: "emparejar",
    enunciado: enunciadoBefore(raw, /\|\s*\d+\s*\|/),
    izquierda,
    derecha: derechaShuffled,
    solucion,
    pista,
    explicacion
  };
}

function parseOpcionMultiple(raw: string): OpcionMultipleContent | null {
  const body = raw.split(/\*\*Soluci[oó]n/)[0];
  const lines = body.split("\n");
  const items: OpcionMultipleContent["items"] = [];
  let current: { numero: string; enunciado: string; opcionesRaw: string } | null = null;

  for (const line of lines) {
    const questionMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (questionMatch) {
      if (current) items.push(finalizeOpcionMultipleItem(current));
      current = { numero: questionMatch[1], enunciado: questionMatch[2], opcionesRaw: "" };
      continue;
    }
    const optionLineMatch = line.match(/^\s*[a-z]\)/);
    if (optionLineMatch && current) {
      current.opcionesRaw += " " + line.trim();
    }
  }
  if (current) items.push(finalizeOpcionMultipleItem(current));

  const validItems = items.filter((it) => it.opciones.length >= 2);
  if (validItems.length === 0) return null;

  const solucionLine = raw.match(/\*\*Soluci[oó]n:?\*\*\s*(.+)/)?.[1] ?? "";
  const solucion: Record<string, string> = {};
  for (const m of solucionLine.matchAll(/(\d+)-([a-z])/g)) {
    solucion[m[1]] = m[2];
  }

  const { pista, explicacion } = extractPistaExplicacion(raw);
  const enunciado = raw.match(/\*\*([^*]+correcta[^*]*)\*\*/i)?.[1] ?? "Elige la opción correcta.";

  return {
    kind: "opcion_multiple",
    enunciado: simplifyInline(enunciado),
    items: validItems,
    solucion,
    pista,
    explicacion
  };
}

function finalizeOpcionMultipleItem(current: {
  numero: string;
  enunciado: string;
  opcionesRaw: string;
}): OpcionMultipleItem {
  const opciones = current.opcionesRaw
    .split("·")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const m = chunk.match(/^([a-z])\)\s*(.+)$/);
      return m ? { letra: m[1], texto: simplifyInline(m[2]) } : null;
    })
    .filter((o): o is { letra: string; texto: string } => o !== null);

  return { numero: current.numero, enunciado: simplifyInline(current.enunciado), opciones };
}

function parseClasificar(raw: string): ClasificarContent | null {
  const bankMatches = [...raw.matchAll(/`([^`]+·[^`]+)`/g)];
  if (bankMatches.length === 0) return null;
  const banco = bankMatches
    .flatMap((m) => m[1].split("·"))
    .map((w) => w.trim())
    .filter(Boolean);

  const headerMatch = raw.match(/^\|\s*\*\*([^*|]+)\*\*[^|]*\|\s*\*\*([^*|]+)\*\*[^|]*\|$/m);
  if (!headerMatch) return null;
  const columnas = [simplifyInline(headerMatch[1]), simplifyInline(headerMatch[2])];

  const solucionBlock = raw.split(/\*\*Soluci[oó]n:?\*\*/)[1] ?? "";
  const solucion: Record<string, string[]> = { [columnas[0]]: [], [columnas[1]]: [] };
  const solLines = [...solucionBlock.matchAll(/\*\*([^*:]+):\*\*\s*([^\n]+)/g)];
  for (const [, colName, wordsRaw] of solLines) {
    const col = columnas.find((c) => c.toUpperCase().startsWith(simplifyInline(colName).toUpperCase().slice(0, 3)));
    if (!col) continue;
    solucion[col] = wordsRaw
      .split(",")
      .map((w) => simplifyInline(w).replace(/\.$/, ""))
      .filter(Boolean);
  }

  const { pista, explicacion } = extractPistaExplicacion(raw);
  const enunciado = raw.match(/\*\*(Clasifica[^*]+)\*\*/i)?.[1] ?? "Clasifica cada elemento en la columna correcta.";

  return {
    kind: "clasificar",
    enunciado: simplifyInline(enunciado),
    banco,
    columnas,
    solucion,
    pista,
    explicacion
  };
}
