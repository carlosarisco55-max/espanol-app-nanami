import type {
  AutoevaluacionContent,
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
  ProduccionEscritaContent,
  ProduccionOralContent,
  ReordenarContent,
  RespuestaCortaContent,
  RoleplayAppCard,
  RoleplayContent,
  RoleplayScene,
  RubricCriterion,
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

function stripItemSourceTag(text: string): string {
  return text.replace(/\s*\((?:U\d+(?:\s*,\s*J\d+)*)\)\s*$/i, "").trim();
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
  const headerEnd = raw.indexOf("\n");
  const nextPeerOffset = raw.slice(headerEnd + 1).search(/^###\s+/m);
  const authoredBlock =
    nextPeerOffset === -1 ? raw : raw.slice(0, headerEnd + 1 + nextPeerOffset);
  const tipo = extractYamlField(authoredBlock, "tipo") ?? "desconocido";
  const autocorregibleRaw = extractYamlField(authoredBlock, "autocorregible");
  const autocorregible =
    autocorregibleRaw === "true" ? true : autocorregibleRaw === "false" ? false : null;
  let content: ExerciseContent | null = null;

  if (tipo === "emparejar") content = parseEmparejar(authoredBlock);
  else if (tipo === "opcion_multiple") content = parseOpcionMultiple(authoredBlock);
  else if (tipo === "clasificar") content = parseClasificar(authoredBlock) ?? parseSegmentar(authoredBlock);
  else if (tipo === "huecos") content = parseHuecos(authoredBlock);
  else if (tipo === "verdadero_falso") content = parseVerdaderoFalso(authoredBlock);
  else if (tipo === "respuesta_corta") {
    content = autocorregible === false
      ? parseProduccionEscrita(authoredBlock)
      : parseRespuestaCorta(authoredBlock);
  }
  else if (tipo === "transformar") content = parseTransformar(authoredBlock);
  else if (tipo === "corregir_error") content = parseCorregirError(authoredBlock);
  else if (tipo === "reordenar") content = parseReordenar(authoredBlock);
  else if (tipo === "discriminacion_fonetica") content = parseDiscriminacionFonetica(authoredBlock);
  else if (tipo === "dictado") content = parseDictado(authoredBlock);
  else if (tipo === "roleplay") content = parseRoleplay(authoredBlock);
  else if (tipo === "produccion_escrita") content = parseProduccionEscrita(authoredBlock);
  else if (tipo === "produccion_oral") content = parseProduccionOral(authoredBlock);
  else if (/Autoevaluaci[oó]n MCER/i.test(authoredBlock)) content = parseAutoevaluacion(authoredBlock);

  const foco = extractYamlField(authoredBlock, "foco");
  const title = authoredBlock.match(/^####\s+`[^`]+`(?:\s+—\s+(.+))?$/m)?.[1]?.trim();
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
  const solucionLine = raw.match(/\*\*Soluci[oó]n:?\*\*\s*(.+)/)?.[1] ?? "";
  const solucion: Record<string, string> = {};
  for (const m of solucionLine.matchAll(/([\p{L}\d]+)\s*-\s*\**([A-Z①-⑳])\**/giu)) {
    solucion[simplifyInline(m[1])] = simplifyInline(m[2]);
  }
  const unused = solucionLine.match(/sobran:\s*([^)\n]+)/i)?.[1] ?? "";
  for (const match of unused.matchAll(/\**([\p{L}\d]+)\**/gu)) {
    const key = simplifyInline(match[1]);
    if (key) solucion[key] = "__unused__";
  }

  const { pista, explicacion } = extractPistaExplicacion(raw);
  const pairedRows = [
    ...raw.matchAll(/^\|\s*([\p{L}\d]+)\s*\|\s*(.+?)\s*\|\s*([a-z])\s*\|\s*(.+?)\s*\|$/gimu)
  ];
  if (pairedRows.length > 0) {
    const izquierda = pairedRows.map((row) => ({
      numero: simplifyInline(row[1]),
      texto: simplifyInline(row[2])
    }));
    const derecha = pairedRows.map((row) => ({
      letra: simplifyInline(row[3]),
      texto: simplifyInline(row[4])
    }));
    const normalizedSolution = Object.fromEntries(
      Object.entries(solucion).map(([key, value]) => [key, value.toLowerCase()])
    );
    return {
      kind: "emparejar",
      enunciado: enunciadoBefore(raw, /\|\s*[\p{L}\d]+\s*\|/u),
      izquierda,
      derecha,
      solucion: normalizedSolution,
      allowRepeat: new Set(Object.values(normalizedSolution)).size < izquierda.length,
      pista,
      explicacion
    };
  }

  const tableRows = raw
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .map(parseTableCells)
    .filter((cells) => {
      const key = cells[0] ?? "";
      return Boolean(solucion[key]) && Boolean(cells[1]);
    });
  if (tableRows.length === 0) return null;

  const izquierda = tableRows.map((cells) => ({ numero: cells[0], texto: cells[1] }));
  const optionValues = [...new Set(izquierda.map((item) => solucion[item.numero]))];
  const derecha = optionValues.map((value) => ({
    letra: value,
    texto: value === "__unused__" ? "No se usa" : value
  }));

  return {
    kind: "emparejar",
    enunciado: enunciadoBefore(raw, /^\|/m),
    izquierda,
    derecha,
    solucion,
    allowRepeat: new Set(Object.values(solucion)).size < izquierda.length,
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
    opciones.push({
      letra: match[1].toLowerCase(),
      texto: stripItemSourceTag(simplifyInline(rawText))
    });
  }
  return {
    numero: current.numero,
    enunciado: stripItemSourceTag(simplifyInline(prompt)),
    opciones,
    inferred
  };
}

function matchClasificarColumn(name: string, columnas: string[]): string | undefined {
  const needle = simplifyInline(name).toLowerCase();
  const scored = columnas.map((column) => {
    const haystack = column.toLowerCase();
    if (haystack === needle) return { column, score: 100 };
    if (haystack.startsWith(needle) || needle.startsWith(haystack)) return { column, score: 80 };
    const words = needle.split(/\s+/).filter((word) => word.length > 3);
    if (words.length > 0 && words.every((word) => new RegExp(`(?:^|\\s)${escapeRegExp(word)}`).test(haystack))) {
      return { column, score: words.join(" ").length };
    }
    return { column, score: 0 };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score ? scored[0].column : undefined;
}

function parseClasificar(raw: string): ClasificarContent | null {
  const bankMatches = [...raw.matchAll(/`([^`]+·[^`]+)`/g)];
  if (bankMatches.length === 0) return null;
  const banco = bankMatches
    .flatMap((m) => m[1].split("·"))
    .map((w) => w.trim())
    .filter(Boolean);

  const headerLine = raw.split("\n").find((line) => {
    if (!line.trim().startsWith("|")) return false;
    const cells = parseTableCells(line);
    return cells.length >= 2 && !isTableSeparator(cells) && cells.every((cell) => !/^\d+$/.test(cell));
  });
  if (!headerLine) return null;
  const columnas = headerLine
    .split("|")
    .slice(1, -1)
    .map((cell) => {
      const bold = cell.match(/\*\*([^*]+)\*\*/);
      return simplifyInline(bold?.[1] ?? cell);
    })
    .filter(Boolean);
  if (columnas.length < 2) return null;

  const solucionBlock = raw.split(/\*\*Soluci[oó]n:?\*\*/)[1] ?? "";
  const solucion: Record<string, string[]> = Object.fromEntries(columnas.map((column) => [column, []]));
  const solLines = [...solucionBlock.matchAll(/\*\*([^*:]+):\*\*\s*([^\n]+)/g)];
  for (const [, colName, wordsRaw] of solLines) {
    const col = matchClasificarColumn(colName, columnas);
    if (!col) continue;
    const parts = wordsRaw.includes("·") ? wordsRaw.split("·") : wordsRaw.split(",");
    solucion[col] = parts.map((w) => simplifyInline(w).replace(/\.$/, "")).filter(Boolean);
  }

  if (columnas.some((column) => solucion[column].length === 0)) return null;

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

function parseSegmentar(raw: string): RespuestaCortaContent | null {
  const body = exerciseBody(raw);
  const solution = solutionBody(raw);
  if (!/\|/.test(solution)) return null;
  const prompts = numberedPrompts(body);
  const answers = numberedPrompts(solution);
  if (prompts.length < 2 || answers.length !== prompts.length) return null;
  if (!answers.every((item) => item.text.includes("|"))) return null;

  const enunciado =
    body.match(/\*\*([^*]*pausas[^*]*)\*\*/i)?.[1] ?? "Marca con | dónde harías las pausas.";

  return {
    kind: "respuesta_corta",
    enunciado: simplifyInline(enunciado),
    items: prompts.map((prompt) => ({
      numero: prompt.numero,
      pregunta: prompt.text,
      respuesta: answers.find((item) => item.numero === prompt.numero)?.text ?? "",
      alternativas: []
    })),
    ...feedback(raw)
  };
}

function exerciseBody(raw: string): string {
  const yaml = raw.match(YAML_FENCE_RE);
  const start = yaml?.index === undefined ? 0 : yaml.index + yaml[0].length;
  return raw.slice(start).split(/^\*\*Soluci[oó]n[^:]*:\*\*/im)[0].trim();
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

function stripQuotePrefix(value: string): string {
  return value.replace(/^>\s?/gm, "").trim();
}

function extractBetween(raw: string, start: RegExp, end: RegExp): string {
  const startMatch = raw.search(start);
  if (startMatch === -1) return "";
  const from = raw.slice(startMatch);
  const endOffset = from.search(end);
  return (endOffset === -1 ? from : from.slice(0, endOffset)).trim();
}

function cleanCardText(text: string): string {
  return text
    .replace(/\*\([^)]+\)\*/g, "")
    .replace(/^---\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cardLines(text: string): string[] {
  const lines = text
    .split("\n")
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : [text];
}

function speakerFromHeader(header: string): string {
  const paren = header.match(/\(([^)]+)\)/);
  if (paren) return simplifyInline(paren[1]);
  if (/moderadora/i.test(header)) return "Moderadora";
  if (/interlocutor/i.test(header)) return "Interlocutor";
  return "Interlocutor";
}

function etiquetaFromHeader(header: string): RoleplayAppCard["etiqueta"] {
  if (/TARJETA\s+C/i.test(header)) return "C";
  if (/MODERADORA/i.test(header)) return "moderadora";
  return "B";
}

function parseAppCards(raw: string): RoleplayAppCard[] {
  const headerRe = /\*\*[^*]*(TARJETA\s+[BC]|MODERADORA)[^*]*\*\*/gi;
  const matches = [...raw.matchAll(headerRe)];
  const cards: RoleplayAppCard[] = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const start = (match.index ?? 0) + match[0].length;
    const nextHeader = matches[i + 1]?.index;
    const rest = raw.slice(start, nextHeader ?? raw.length);
    const cut = rest.search(/\*\*Guion|\*\*R[uú]brica|^####\s+ESCENA/im);
    const chunk = cleanCardText(
      stripQuotePrefix((cut === -1 ? rest : rest.slice(0, cut)).replace(/^---\s*$/gm, ""))
    );
    if (!chunk) continue;
    cards.push({
      etiqueta: etiquetaFromHeader(match[0]),
      hablante: speakerFromHeader(match[0]),
      texto: chunk,
      turnos: cardLines(chunk)
    });
  }
  return cards;
}

function parseRoleplayScene(raw: string, titulo?: string): RoleplayScene | null {
  const cardA = cleanCardText(
    stripQuotePrefix(
      extractBetween(raw, /\*\*[^*]*TARJETA A[^*]*\*\*/i, /\*\*[^*]*TARJETA B[^*]*\*\*/i)
        .replace(/\*\*[^*]*TARJETA A[^*]*\*\*/i, "")
    )
  );
  const tarjetasApp = parseAppCards(raw);
  const cardB = tarjetasApp.find((card) => card.etiqueta === "B") ?? tarjetasApp[0];
  if (!cardA || !cardB) return null;
  return {
    titulo,
    tarjetaA: cardA,
    tarjetaB: cardB.texto,
    hablanteB: cardB.hablante,
    turnosB: cardB.turnos,
    tarjetasApp
  };
}

function parseRoleplay(raw: string): RoleplayContent | null {
  const body = exerciseBody(raw);
  const sceneChunks = [...body.split(/^####\s+(ESCENA[^\n]+)$/im)];
  const escenas: RoleplayScene[] = [];
  if (sceneChunks.length > 1) {
    for (let i = 1; i < sceneChunks.length; i += 2) {
      const scene = parseRoleplayScene(sceneChunks[i + 1] ?? "", simplifyInline(sceneChunks[i] ?? ""));
      if (scene) escenas.push(scene);
    }
  }
  if (escenas.length === 0) {
    const scene = parseRoleplayScene(body);
    if (scene) escenas.push(scene);
  }
  if (escenas.length === 0) return null;

  const situacion = body.match(/\*\*Situaci[oó]n:\*\*\s*([\s\S]+?)(?=\n---|\n>\s*\*\*|\n####\s+ESCENA)/i)?.[1];
  const guionHeading = body.match(/\*\*Guion de apoyo[^*]*\*\*/i)?.[0] ?? "";
  const guionSegundosMatch = guionHeading.match(/(\d+)\s*s/i);
  const guion = numberedPrompts(
    extractBetween(body, /\*\*Guion de apoyo[^:]*:\*\*/i, /\*\*R[uú]brica/i)
  ).map((item) => item.text);
  const rubrica = parseRubricCriteria(body).map((item) => item.criterio);
  return {
    kind: "roleplay",
    enunciado: situacion ? simplifyInline(situacion.replace(/\n+/g, " ")) : "Role-play con información asimétrica.",
    duracion: extractYamlField(raw, "duracion"),
    formato: extractYamlField(raw, "formato"),
    escenas,
    guion,
    guionSegundos: guionSegundosMatch ? Number(guionSegundosMatch[1]) : undefined,
    rubrica,
    ...feedback(raw)
  };
}

function parseRubricCriteria(raw: string): RubricCriterion[] {
  const section = extractBetween(raw, /\*\*R[uú]brica[^:]*:\*\*/i, /\n##\s|\n---\s*$|$/);
  const rows = section
    .split("\n")
    .map((line) => line.split("|").slice(1, -1).map((cell) => simplifyInline(cell)))
    .filter((cells) => cells.length >= 1 && Boolean(cells[0]) && !/^:?-+:?$/.test(cells[0]) && !/^criterio$/i.test(cells[0]));
  return rows.map((cells) => ({
    criterio: cells[0],
    peso: cells[1] && /%/.test(cells[1]) ? cells[1] : undefined
  }));
}

function parseProduccionEscrita(raw: string): ProduccionEscritaContent | null {
  const body = exerciseBody(raw);
  const contexto = body.match(/\*\*Contexto[^:]*:\*\*\s*([\s\S]+?)(?=\n\*\*[^*]+\*\*|\n---)/i)?.[1];
  const requisitos = numberedPrompts(body).map((item) => item.text);
  const modelo = stripQuotePrefix(
    extractBetween(body, /\*\*MODELO\*\*/i, /\*\*R[uú]brica/i).replace(/\*\*MODELO\*\*[^\n]*/i, "")
  );
  const rubrica = parseRubricCriteria(body);
  const enunciado =
    body.match(/\*\*(Responde por escrito[^*]*)\*\*/i)?.[1] ??
    body.match(/\*\*Escribe[^*]*\*\*\s*([\s\S]+?)(?=\n\d+\.\s)/i)?.[1] ??
    body.match(/\*\*([^*]{12,120})\*\*/)?.[1] ??
    "Escribe el texto.";
  const palabrasEnunciado = body.match(/Responde por escrito\s*\(([\d–-]+\s+palabras)\)/i)?.[1];
  return {
    kind: "produccion_escrita",
    enunciado: simplifyInline(enunciado.replace(/\n+/g, " ")),
    contexto: contexto ? simplifyInline(contexto.replace(/\n+/g, " ")) : undefined,
    requisitos,
    modelo: modelo || undefined,
    rubrica,
    palabras: extractYamlField(raw, "palabras") ?? palabrasEnunciado?.replace(/\s+palabras$/i, ""),
    ...feedback(raw)
  };
}

function parseProduccionOral(raw: string): ProduccionOralContent | null {
  const body = exerciseBody(raw);
  const frases = numberedPrompts(body)
    .map((item) => item.text)
    .filter((text) => text.length > 8);
  const autoevaluacion = [
    ...body.matchAll(/[⬜☐]\s+(.+)/g)
  ].map((match) => simplifyInline(match[1]));
  const rubrica = parseRubricCriteria(body).map((item) => item.criterio);
  const criteria = autoevaluacion.length > 0 ? autoevaluacion : rubrica;
  const enunciado =
    body.match(/\*\*(Graba[\s\S]+?)\*\*/)?.[1] ??
    body.match(/\*\*([^*]{12,160})\*\*/)?.[1] ??
    "Graba tu respuesta.";
  return {
    kind: "produccion_oral",
    enunciado: simplifyInline(enunciado.replace(/\n+/g, " ")),
    guion: body.match(/Guion obligatorio:\s*(.+)/i)?.[1],
    frases,
    autoevaluacion: criteria,
    duracion: extractYamlField(raw, "duracion"),
    ...feedback(raw)
  };
}

function parseAutoevaluacion(raw: string): AutoevaluacionContent | null {
  const body = exerciseBody(raw);
  const tableLines = body.split("\n").filter((line) => line.trim().startsWith("|"));
  const rows = tableLines.map((line) =>
    line
      .split("|")
      .slice(1, -1)
      .map((cell) => simplifyInline(cell))
  );
  const header = rows.find((cells) => /^Puedo/i.test(cells[0] ?? ""));
  if (!header) return null;

  const criterios = rows
    .filter((cells) => {
      const first = cells[0] ?? "";
      return Boolean(first) && !/^Puedo/i.test(first) && !/^:?-+:?$/.test(first);
    })
    .map((cells) => cells[0]);
  if (criterios.length === 0) return null;

  const escala = header
    .slice(1)
    .filter(Boolean)
    .map((label, index) => ({
      value: ["si", "esfuerzo", "todavia"][index] ?? `nivel-${index + 1}`,
      label
    }));
  const nota = body.match(/>\s*⚠️\s*\*\*Nota para la app\.\*\*\s*([\s\S]+?)(?=\n---|$)/i)?.[1];

  return {
    kind: "autoevaluacion",
    enunciado: raw.match(/^####\s+`[^`]+`\s+—\s+(.+)$/m)?.[1]?.trim() ?? "Autoevaluación MCER",
    criterios,
    escala,
    nota: nota ? simplifyInline(nota.replace(/\n>\s*/g, " ")) : undefined
  };
}
