import type {
  ClasificarContent,
  CorregirErrorContent,
  DictadoContent,
  DiscriminacionFoneticaContent,
  EmparejarContent,
  ExerciseBlock,
  ExerciseContent,
  HuecosContent,
  OpcionMultipleContent,
  OpcionMultipleItem,
  ReordenarContent,
  RespuestaCortaContent,
  TransformarContent,
  VerdaderoFalsoContent
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
  else if (tipo === "huecos") content = parseHuecos(raw);
  else if (tipo === "verdadero_falso") content = parseVerdaderoFalso(raw);
  else if (tipo === "respuesta_corta") content = parseRespuestaCorta(raw);
  else if (tipo === "transformar") content = parseTransformar(raw);
  else if (tipo === "corregir_error") content = parseCorregirError(raw);
  else if (tipo === "reordenar") content = parseReordenar(raw);
  else if (tipo === "discriminacion_fonetica") content = parseDiscriminacionFonetica(raw);
  else if (tipo === "dictado") content = parseDictado(raw);

  const foco = extractYamlField(raw, "foco");
  const title = raw.match(/^####\s+`[^`]+`(?:\s+—\s+(.+))?$/m)?.[1]?.trim();
  const autocorregibleRaw = extractYamlField(raw, "autocorregible");
  const autocorregible =
    autocorregibleRaw === "true" ? true : autocorregibleRaw === "false" ? false : null;
  const jCodes = [...new Set(foco?.match(/\bJ[1-8]\b/g) ?? [])] as ExerciseBlock["jCodes"];

  return {
    id,
    tipo,
    raw,
    content,
    title,
    foco,
    jCodes,
    autocorregible,
    sinSoporte: content ? undefined : `Formato ${tipo} todavía no estructurado`
  };
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
  const body = exerciseBody(raw);
  const authoredSolution = solutionBody(raw);
  const enunciado = simplifyInline(body.match(/\*\*([^*]+)\*\*/)?.[1] ?? "Elige la opción correcta.");

  const table = parseOpcionMultipleTabla(body, authoredSolution);
  if (table) {
    return {
      kind: "opcion_multiple",
      layout: "tabla",
      enunciado,
      items: table.items,
      solucion: table.solucion,
      ...feedback(raw)
    };
  }

  const lines = body.split("\n");
  const parsedItems: Array<OpcionMultipleItem & { inferred?: string }> = [];
  let current: { numero: string; enunciado: string; opcionesRaw: string } | null = null;

  for (const line of lines) {
    const questionMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (questionMatch) {
      if (current) parsedItems.push(finalizeOpcionMultipleItem(current));
      current = { numero: questionMatch[1], enunciado: questionMatch[2], opcionesRaw: questionMatch[2] };
      continue;
    }
    const optionLineMatch = line.match(/^\s*[a-z]\)/);
    if (optionLineMatch && current) {
      current.opcionesRaw += " " + line.trim();
    }
  }
  if (current) parsedItems.push(finalizeOpcionMultipleItem(current));

  let validItems = parsedItems.filter((item) => item.opciones.length >= 2);
  const solucion: Record<string, string> = {};
  for (const item of parsedItems) {
    if (item.inferred) solucion[item.numero] = item.inferred;
  }

  for (const m of authoredSolution.matchAll(/(\d+)\s*[-–]\s*([a-z])/gi)) {
    solucion[m[1]] = m[2];
  }

  if (validItems.length === 0) {
    const standalone = [...body.matchAll(/^\s*([a-z])\)\s+(.+)$/gm)];
    if (standalone.length >= 2) {
      validItems = [{
        numero: "1",
        enunciado: enunciado,
        opciones: standalone.map((match) => ({
          letra: match[1].toLowerCase(),
          texto: simplifyInline(match[2])
        }))
      }];
    }
  }

  if (validItems.length === 1 && !solucion[validItems[0].numero]) {
    const single = authoredSolution.match(/^\**\s*([a-z])\s*\**(?:\s|$)/i)?.[1];
    if (single) solucion[validItems[0].numero] = single.toLowerCase();
  }

  // Variante de lectura global: lista de puntos con casillas y una solución
  // "se mencionan 1, 3 y 6". Se convierte en una elección sí/no por punto.
  if (validItems.length === 0) {
    const checklist = numberedPrompts(body).filter((item) => /☐/.test(item.text));
    const mentionedPart = authoredSolution.split(/\n/)[0] ?? "";
    const mentioned = new Set(mentionedPart.match(/\d+/g) ?? []);
    if (checklist.length > 0 && mentioned.size > 0) {
      validItems = checklist.map((item) => ({
        numero: item.numero,
        enunciado: item.text.replace(/☐\s*/, ""),
        opciones: [
          { letra: "si", texto: "Se menciona" },
          { letra: "no", texto: "No se menciona" }
        ]
      }));
      for (const item of checklist) {
        solucion[item.numero] = mentioned.has(item.numero) ? "si" : "no";
      }
    }
  }

  if (validItems.length === 0 || validItems.some((item) => !solucion[item.numero])) return null;

  return {
    kind: "opcion_multiple",
    layout: validItems[0]?.opciones[0]?.letra === "si" ? "tabla" : "items",
    enunciado,
    items: validItems,
    solucion,
    ...feedback(raw)
  };
}

function parseTableCells(line: string): string[] {
  return line.split("|").slice(1, -1).map((cell) => simplifyInline(cell));
}

function isTableSeparator(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => cell === "" || /^:?-+:?$/.test(cell));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Opciones compartidas por cabecera de tabla (DELE V/F/ND, grado de certeza, etc.).
function parseOpcionMultipleTabla(
  body: string,
  authoredSolution: string
): { items: OpcionMultipleItem[]; solucion: Record<string, string> } | null {
  const tableLines = body.split("\n").filter((line) => line.trim().startsWith("|"));
  if (tableLines.length < 2) return null;

  const headerLine = tableLines.find((line) => {
    const cells = parseTableCells(line);
    return cells.length > 0 && !isTableSeparator(cells) && !/^\d+$/.test(cells[0] ?? "");
  });
  if (!headerLine) return null;

  const headers = parseTableCells(headerLine);
  let optionLabels = headers.slice(2).filter(Boolean);
  if (optionLabels.length === 1 && optionLabels[0].includes("/")) {
    optionLabels = optionLabels[0].split(/\s*\/\s*/).filter(Boolean);
  }
  if (optionLabels.length < 2) return null;

  const rows = tableLines
    .map(parseTableCells)
    .filter((cells) => /^\d+$/.test(cells[0] ?? "") && Boolean(cells[1]));
  if (rows.length === 0) return null;

  const items: OpcionMultipleItem[] = rows.map((cells) => ({
    numero: cells[0],
    enunciado: cells[1],
    opciones: optionLabels.map((label) => ({ letra: label, texto: label }))
  }));

  const authored = new Map(numberedEntries(authoredSolution).map((item) => [item.numero, item.value]));
  const labelsByLength = [...optionLabels].sort((a, b) => b.length - a.length);
  const solucion: Record<string, string> = {};

  for (const item of items) {
    const value = simplifyInline(authored.get(item.numero) ?? "");
    const match = labelsByLength.find((label) =>
      new RegExp(`^${escapeRegExp(label)}(?:\\s|\\(|$)`, "i").test(value)
    );
    if (match) solucion[item.numero] = match;
  }

  if (items.some((item) => !solucion[item.numero])) return null;
  return { items, solucion };
}

function finalizeOpcionMultipleItem(current: {
  numero: string;
  enunciado: string;
  opcionesRaw: string;
}): OpcionMultipleItem & { inferred?: string } {
  const firstOption = current.opcionesRaw.search(/\b[a-z]\)\s*/i);
  if (firstOption === -1) {
    return { numero: current.numero, enunciado: simplifyInline(current.enunciado), opciones: [] };
  }
  const prompt = current.opcionesRaw.slice(0, firstOption).replace(/\s*→\s*$/, "");
  const optionsRaw = current.opcionesRaw.slice(firstOption);
  const opciones: { letra: string; texto: string }[] = [];
  let inferred: string | undefined;
  for (const match of optionsRaw.matchAll(/([a-z])\)\s*([\s\S]*?)(?=(?:\s*·\s*|\s+)[a-z]\)\s*|$)/gi)) {
    const rawText = match[2].trim();
    if (/\*\*[^*]+\*\*/.test(rawText)) inferred = match[1].toLowerCase();
    opciones.push({ letra: match[1].toLowerCase(), texto: simplifyInline(rawText) });
  }
  return {
    numero: current.numero,
    enunciado: simplifyInline(prompt),
    opciones,
    inferred
  };
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
    layout: "banco",
    enunciado: simplifyInline(enunciado),
    banco,
    columnas,
    solucion,
    pista,
    explicacion
  };
}

function exerciseBody(raw: string): string {
  const yaml = raw.match(YAML_FENCE_RE);
  const start = yaml?.index === undefined ? 0 : yaml.index + yaml[0].length;
  return raw.slice(start).split(/\*\*Soluci[oó]n[^:]*:\*\*/i)[0].trim();
}

function solutionBody(raw: string): string {
  const match = raw.match(/\*\*Soluci[oó]n[^:]*:\*\*\s*([\s\S]+?)(?=\n(?:>\s*)?💡|\n\*\*[^*\n]+:\*\*|\n---|$)/i);
  return match?.[1]?.trim() ?? "";
}

function numberedEntries(value: string): { numero: string; value: string }[] {
  const normalized = value.replace(/\r/g, "").trim();
  const matches = [
    ...normalized.matchAll(
      /(?:^|(?:\s*·\s*|\n+))(\d+)[.)]\s*([\s\S]*?)(?=(?:\s*·\s*|\n+)\d+[.)]\s*|$)/g
    )
  ];
  return matches.map((match) => ({
    numero: match[1],
    value: simplifyInline(match[2].replace(/\n+/g, " ").trim())
  }));
}

function numberedPrompts(value: string): { numero: string; text: string }[] {
  return [...value.matchAll(/^\s*(\d+)\.\s+(.+)$/gm)].map((match) => ({
    numero: match[1],
    text: simplifyInline(match[2])
  }));
}

function feedback(raw: string) {
  const base = extractPistaExplicacion(raw);
  const porQue = raw.match(/>\s*💡\s*\*\*Por qu[eé]\.\*\*\s*([\s\S]+?)(?=\n---|$)/i)?.[1];
  return {
    ...base,
    porQue: porQue ? simplifyInline(porQue.replace(/^>\s?/gm, " ")) : undefined
  };
}

function parseHuecos(raw: string): HuecosContent | null {
  const solutions = numberedEntries(solutionBody(raw));
  if (solutions.length === 0) return null;
  const body = exerciseBody(raw);
  const prompts = numberedPrompts(body).filter((item) => /_{3,}|…/.test(item.text));
  const byNumber = new Map(prompts.map((item) => [item.numero, item.text]));
  const layout = prompts.length > 0 ? "lista" : "texto";
  const items = solutions.map(({ numero, value }) => {
    const texto = byNumber.get(numero);
    const huecos = texto ? Math.max(texto.match(/_{3,}/g)?.length ?? 0, 1) : 1;
    const respuestasPorHueco = huecos > 1 && value.includes(" / ")
      ? value.split(/\s+\/\s+/).map(simplifyInline)
      : undefined;
    return {
      numero,
      texto,
      huecos,
      respuesta: value,
      respuestasPorHueco,
      alternativas: []
    };
  });
  return {
    kind: "huecos",
    layout,
    enunciado: enunciadoBefore(raw, /(?:^\d+\.\s|^>)/m) || "Completa los huecos.",
    texto: layout === "texto" ? simplifyInline(body.replace(/^>\s?/gm, " ")) : undefined,
    items,
    ...feedback(raw)
  };
}

function parseVerdaderoFalso(raw: string): VerdaderoFalsoContent | null {
  const rows = [...exerciseBody(raw).matchAll(/^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*\|$/gm)];
  const solutions = numberedEntries(solutionBody(raw));
  if (rows.length === 0 || solutions.length === 0) return null;
  const solutionMap = new Map(solutions.map((item) => [item.numero, item.value]));
  const items: VerdaderoFalsoContent["items"] = rows.flatMap((row) => {
    const authored = solutionMap.get(row[1]);
    const answer = authored?.match(/^(V|F)\b/i)?.[1]?.toUpperCase();
    if (answer !== "V" && answer !== "F") return [];
    return [{
      numero: row[1],
      afirmacion: simplifyInline(row[2]),
      respuesta: answer as "V" | "F",
      justificacion: simplifyInline(authored!.replace(/^(V|F)\s*[—-]?\s*/i, "")) || undefined
    }];
  });
  return {
    kind: "verdadero_falso",
    enunciado: enunciadoBefore(raw, /^\|/m) || "Marca verdadero o falso.",
    items,
    ...feedback(raw)
  };
}

function parseRespuestaCorta(raw: string): RespuestaCortaContent | null {
  const prompts = numberedPrompts(exerciseBody(raw));
  const solutions = new Map(numberedEntries(solutionBody(raw)).map((item) => [item.numero, item.value]));
  const items = prompts.flatMap((prompt) => {
    const respuesta = solutions.get(prompt.numero);
    return respuesta
      ? [{ numero: prompt.numero, pregunta: prompt.text, respuesta, alternativas: [] }]
      : [];
  });
  if (items.length === 0) return null;
  return {
    kind: "respuesta_corta",
    enunciado: enunciadoBefore(raw, /^\d+\.\s/m) || "Responde con pocas palabras.",
    items,
    ...feedback(raw)
  };
}

function parseTransformar(raw: string): TransformarContent | null {
  const prompts = numberedPrompts(exerciseBody(raw));
  const solutions = new Map(numberedEntries(solutionBody(raw)).map((item) => [item.numero, item.value]));
  const items = prompts.flatMap((prompt) => {
    const respuesta = solutions.get(prompt.numero);
    if (!respuesta) return [];
    const [origen, arranque] = prompt.text.split(/\s*→\s*/, 2);
    return [{
      numero: prompt.numero,
      origen,
      arranque: arranque?.replace(/_{3,}/g, "").trim() || undefined,
      respuesta,
      alternativas: []
    }];
  });
  if (items.length === 0) return null;
  return {
    kind: "transformar",
    enunciado: enunciadoBefore(raw, /^\d+\.\s/m) || "Transforma las frases.",
    items,
    ...feedback(raw)
  };
}

function parseCorregirError(raw: string): CorregirErrorContent | null {
  const prompts = numberedPrompts(exerciseBody(raw));
  const solutions = new Map(numberedEntries(solutionBody(raw)).map((item) => [item.numero, item.value]));
  const items = prompts.flatMap((prompt) => {
    const correccion = solutions.get(prompt.numero);
    return correccion
      ? [{ numero: prompt.numero, frase: prompt.text, correccion, alternativas: [] }]
      : [];
  });
  if (items.length === 0) return null;
  return {
    kind: "corregir_error",
    enunciado: enunciadoBefore(raw, /^\d+\.\s/m) || "Corrige el error.",
    items,
    ...feedback(raw)
  };
}

function parseReordenar(raw: string): ReordenarContent | null {
  const body = exerciseBody(raw);
  const prompts = numberedPrompts(body);
  const solutions = new Map(numberedEntries(solutionBody(raw)).map((item) => [item.numero, item.value]));
  const sentenceItems = prompts.flatMap((prompt) => {
    const respuesta = solutions.get(prompt.numero);
    return respuesta
      ? [{
          numero: prompt.numero,
          fragmentos: prompt.text.split(/\s+\/\s+/).map(simplifyInline),
          respuesta,
          alternativas: []
        }]
      : [];
  });
  if (sentenceItems.length > 0) {
    return {
      kind: "reordenar",
      enunciado: enunciadoBefore(raw, /^\d+\.\s/m) || "Ordena los elementos.",
      items: sentenceItems,
      ...feedback(raw)
    };
  }

  const tableRows = [...body.matchAll(/^\|\s*([a-z])\s*\|\s*(.+?)\s*\|$/gm)];
  const sequence = simplifyInline(solutionBody(raw)).match(/\b[a-z](?:\s*→\s*[a-z])+/)?.[0];
  if (tableRows.length === 0 || !sequence) return null;
  return {
    kind: "reordenar",
    enunciado: enunciadoBefore(raw, /^\|/m) || "Ordena los hechos.",
    items: [{
      numero: "orden",
      fragmentos: tableRows.map((row) => `${row[1]}) ${simplifyInline(row[2])}`),
      respuesta: sequence,
      alternativas: []
    }],
    ...feedback(raw)
  };
}

function parseDiscriminacionFonetica(raw: string): DiscriminacionFoneticaContent | null {
  const body = exerciseBody(raw);
  const tableLines = body.split("\n").filter((line) => line.trim().startsWith("|"));
  const header = tableLines.find((line) => /Opci[oó]n A/i.test(line));
  if (!header) return null;
  const headerCells = header.split("|").map((cell) => simplifyInline(cell)).filter(Boolean);
  const rows = [...body.matchAll(/^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/gm)];
  const authoredSolution = solutionBody(raw);
  const solutionMap = new Map(numberedEntries(authoredSolution).map((item) => [item.numero, item.value]));
  for (const match of authoredSolution.matchAll(/(\d+)\s*[-–]\s*([AB])\b/gi)) {
    solutionMap.set(match[1], match[2].toUpperCase());
  }
  const items = rows.map((row) => {
    const authored = solutionMap.get(row[1]) ?? "";
    const response = authored.match(/^(?:-|–)?\s*([AB])\b/i)?.[1]?.toUpperCase() ?? null;
    return {
      numero: row[1],
      opciones: [
        { letra: "A", texto: simplifyInline(row[2]) },
        { letra: "B", texto: simplifyInline(row[3]) }
      ],
      respuesta: response,
      nota: response ? undefined : authored || undefined
    };
  });
  if (items.length === 0) return null;
  return {
    kind: "discriminacion_fonetica",
    enunciado: enunciadoBefore(raw, /^\|/m) || "Escucha y elige.",
    columnas: [
      { letra: "A", etiqueta: headerCells[0] ?? "Opción A" },
      { letra: "B", etiqueta: headerCells[1] ?? "Opción B" }
    ],
    items,
    ...feedback(raw)
  };
}

function parseDictado(raw: string): DictadoContent | null {
  const solutions = numberedEntries(solutionBody(raw));
  if (solutions.length === 0) return null;
  return {
    kind: "dictado",
    enunciado: enunciadoBefore(raw, /\*\*Soluci[oó]n/i) || "Escucha y escribe.",
    items: solutions.map((item) => ({ numero: item.numero, frase: item.value })),
    ...feedback(raw)
  };
}
