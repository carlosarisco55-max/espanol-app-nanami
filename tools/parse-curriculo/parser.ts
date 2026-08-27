import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type {
  CanDoItem,
  ContentRow,
  ContinuityNotes,
  CurriculumIndexEntry,
  CurriculumUnit,
  ParseOptions,
  SessionData,
  SessionNumber,
  UnitFrontmatter
} from "./types";
import { splitExerciseBlocks, parseExerciseBlock } from "./exercises";

const UNIT_HEADER_REGEX = /^#\s+\d+(?:\.\d+)?\.?\s+UNIDAD\s+\d+\s+—\s+.+$/gm;
const SESSION_HEADER_REGEX = /^##\s+.*SESIÓN\s+([1-5])\s+—\s+(.+)$/gm;
const EXERCISE_REGEX = /^####\s+`(B1-B2-U\d+-E\d+)`/gm;

export function readCurriculumFile(filePath = resolve(process.cwd(), "content", "curriculo-b1-b2.md")): string {
  return stripBom(readFileSync(filePath, { encoding: "utf8" })).replace(/\r\n/g, "\n");
}

export function collectUnitHeaders(content: string): string[] {
  return [...content.matchAll(new RegExp(UNIT_HEADER_REGEX))].map((match) => match[0]);
}

export function parseCurriculum(content: string, options: ParseOptions = {}): CurriculumUnit[] {
  const unitBlocks = splitBlocks(content, new RegExp(UNIT_HEADER_REGEX));

  // Filtra por bloque ANTES de parsear (no después): así, cuando se pide una sola
  // unidad, no falla por unidades que aún no tienen bloque de Categoría B (solo la U1
  // lo tiene por ahora). El parser sigue siendo genérico para las 16 — este filtro solo
  // evita procesar de más cuando no hace falta.
  const targetBlocks = options.unitFilter
    ? unitBlocks.filter((block) => block.includes(`unidad_id: ${options.unitFilter}`))
    : unitBlocks;

  return targetBlocks.map((block) => parseUnitBlock(block));
}

export function buildIndex(units: CurriculumUnit[]): CurriculumIndexEntry[] {
  return units.map((unit) => ({
    unitId: unit.unitId,
    title: unit.title,
    sessionCount: unit.sessions.length,
    exerciseCount: unit.stats.exerciseCount
  }));
}

function parseUnitBlock(block: string): CurriculumUnit {
  const frontmatter = parseFrontmatter(extractYaml(block));
  const canDos = parseCanDos(extractSection(block, "### Objetivos «puede hacer» (MCER)", "### Contenidos (referencia PCIC)"));
  const contents = parseContentsTable(extractSection(block, "### Contenidos (referencia PCIC)", "\n---", true));
  const openingsManual = parseOpeningsTable(
    extractSection(block, "### Aperturas de sesión (Categoría B)", "### Orientación multiidioma (Categoría B)", true)
  );
  const orientations = parseOrientationTable(
    extractSection(block, "### Orientación multiidioma (Categoría B)", "### Continuidad narrativa (Categoría B)", true)
  );
  const continuity = parseContinuity(extractSection(block, "### Continuidad narrativa (Categoría B)", "\n---", true));
  const sessions = parseSessions(block, openingsManual, orientations, canDos);
  const exerciseCount = sessions.reduce((sum, session) => sum + session.exerciseIds.length, 0);

  return {
    unitId: frontmatter.unidad_id,
    title: frontmatter.titulo,
    subtitle: frontmatter.subtitulo,
    quote: frontmatter.cita,
    block: frontmatter.bloque,
    levelIn: frontmatter.nivel_mcer_entrada,
    levelOut: frontmatter.nivel_mcer_salida,
    duration: frontmatter.duracion,
    lexiconCore: frontmatter.lexico_nucleo,
    focusCodes: frontmatter.focos_contraste ?? [],
    canDos,
    contents,
    continuity,
    sessions,
    stats: {
      exerciseCount
    }
  };
}

function parseSessions(
  block: string,
  openingsManual: Partial<Record<SessionNumber, string>>,
  orientations: Partial<Record<SessionNumber, { en?: string; ja?: string }>>,
  canDos: CanDoItem[]
): SessionData[] {
  const matches = [...block.matchAll(new RegExp(SESSION_HEADER_REGEX))];

  return matches.map((match, index) => {
    const number = Number(match[1]) as SessionNumber;
    const title = match[2].trim();
    const contentStart = match.index! + match[0].length;
    const contentEnd = index + 1 < matches.length ? matches[index + 1].index! : block.length;
    const rawMarkdown = block.slice(contentStart, contentEnd).trim();
    const exerciseIds = [...rawMarkdown.matchAll(new RegExp(EXERCISE_REGEX))].map((exerciseMatch) => exerciseMatch[1]);
    const exercises = splitExerciseBlocks(rawMarkdown).map(({ id, raw }) => parseExerciseBlock(id, raw));

    return {
      number,
      slug: `s${number}`,
      title,
      titleShort: title.replace(/^[^\p{L}\p{N}]+/gu, "").trim(),
      rawMarkdown,
      exerciseIds,
      exercises,
      opening: resolveOpening(number, rawMarkdown, canDos, openingsManual[number]),
      outline: sessionOutline(number),
      orientation: orientations[number]
    };
  });
}

// Tabla | Sesión | English | 日本語 | — la columna de japonés puede venir vacía ("—")
// mientras no haya revisión nativa; se normaliza a undefined, nunca a la cadena "—" literal.
function parseOrientationTable(section: string): Partial<Record<SessionNumber, { en?: string; ja?: string }>> {
  const result: Partial<Record<SessionNumber, { en?: string; ja?: string }>> = {};
  if (!section) return result;

  const rowRe = /^\|\s*S([1-5])\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/gm;
  let match;
  while ((match = rowRe.exec(section))) {
    const number = Number(match[1]) as SessionNumber;
    const en = match[2].trim();
    const ja = match[3].trim();
    result[number] = {
      en: en && en !== "—" ? en : undefined,
      ja: ja && ja !== "—" ? ja : undefined
    };
  }
  return result;
}

function resolveOpening(
  sessionNumber: SessionNumber,
  sessionMarkdown: string,
  canDos: CanDoItem[],
  manualOpening?: string
) {
  if (manualOpening) {
    return {
      sessionNumber,
      source: "category_b" as const,
      headline: manualOpening.trim()
    };
  }

  if (sessionNumber === 3) {
    const examples = deriveGrammarContrast(sessionMarkdown);

    return {
      sessionNumber,
      source: "category_a" as const,
      headline: `¿Por qué decimos “${examples.serExample}” pero “${examples.estarExample}”? Hoy la regla sale del propio texto y del audio, no de una lista para memorizar.`
    };
  }

  if (sessionNumber === 5) {
    return {
      sessionNumber,
      source: "category_a" as const,
      headline: "Lo que te llevas hoy",
      cards: canDos.slice(0, 3).map((item) => item.text)
    };
  }

  return {
    sessionNumber,
    source: "category_a" as const,
    headline: "Hoy seguimos avanzando desde el propio material de la unidad."
  };
}

function deriveGrammarContrast(sessionMarkdown: string): { serExample: string; estarExample: string } {
  const serLine = sessionMarkdown.match(/\|\s*Característica de carácter\s*\|\s*([^|]+)\|/);
  const estarLine = sessionMarkdown.match(/\|\s*Estado de ánimo o físico\s*\|\s*([^|]+)\|/);

  return {
    serExample: simplifyInlineMarkdown(firstSentence(serLine?.[1]) ?? "Es muy habladora."),
    estarExample: simplifyInlineMarkdown(firstSentence(estarLine?.[1]) ?? "Está muy animada.")
  };
}

function firstSentence(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/<br\s*\/?>/g, " ").trim();
  const sentence = normalized.split("/")[0]?.trim();

  return sentence?.replace(/\.$/, "");
}

function sessionOutline(number: SessionNumber) {
  const base = {
    1: [
      { icon: "🔥", label: "Calentamiento" },
      { icon: "💬", label: "Vocabulario en contexto" }
    ],
    2: [
      { icon: "📖", label: "Lectura" },
      { icon: "🎧", label: "Audio" }
    ],
    3: [
      { icon: "🧩", label: "Gramática inducida" },
      { icon: "✍️", label: "Práctica A/B/C" }
    ],
    4: [
      { icon: "🗣️", label: "Función comunicativa" },
      { icon: "🎭", label: "Role-play asimétrico" }
    ],
    5: [
      { icon: "✍️", label: "Tarea final" },
      { icon: "🔊", label: "Fonética" },
      { icon: "🔁", label: "Repaso" }
    ]
  } satisfies Record<SessionNumber, { icon: string; label: string }[]>;

  return base[number];
}

function parseOpeningsTable(section: string): Partial<Record<SessionNumber, string>> {
  const openings: Partial<Record<SessionNumber, string>> = {};

  for (const line of section.split("\n")) {
    const match = line.match(/^\|\s*S([1-5])\s*\|\s*(.+?)\s*\|$/);
    if (!match) {
      continue;
    }

    openings[Number(match[1]) as SessionNumber] = match[2];
  }

  return openings;
}

function parseContinuity(section: string): ContinuityNotes {
  const dato = normalizeContinuityValue(section.match(/- Dato curioso España:\s*(.+)/)?.[1]);
  const elenco = normalizeContinuityValue(section.match(/- Elenco recurrente:\s*(.+)/)?.[1]);

  return {
    datoCuriosoEspana: dato,
    elencoRecurrente: elenco
  };
}

// Las notas "no aplica..." / "ninguno todavía..." son explicaciones internas del autor
// (Claude Code) sobre POR QUÉ ese campo está vacío en esta unidad, no contenido real
// pensado para mostrarse a la usuaria. Se normalizan a null para que la UI no renderice
// texto de mantenimiento como si fuera un dato curioso o una referencia de personaje real.
function normalizeContinuityValue(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const isPlaceholder = /^(no aplica|ninguno)/i.test(trimmed);
  return isPlaceholder ? null : simplifyInlineMarkdown(trimmed);
}

function parseCanDos(section: string): CanDoItem[] {
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\.\s+\*\*\((.+?)\)\*\*\s+(.+)$/);
      if (!match) {
        return null;
      }

      return {
        index: Number(match[1]),
        label: match[2],
        text: simplifyInlineMarkdown(match[3])
      } satisfies CanDoItem;
    })
    .filter((item): item is CanDoItem => item !== null);
}

function parseContentsTable(section: string): ContentRow[] {
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("| **"))
    .map((line) => {
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);

      return {
        component: simplifyInlineMarkdown(cells[0]),
        content: simplifyInlineMarkdown(cells[1] ?? "")
      };
    });
}

function extractYaml(block: string): string {
  const match = block.match(/```yaml\n([\s\S]*?)\n```/);

  if (!match) {
    throw new Error("No se encontró la ficha YAML de la unidad.");
  }

  return match[1];
}

function parseFrontmatter(yaml: string): UnitFrontmatter {
  const result: Record<string, unknown> = {};

  for (const rawLine of yaml.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    result[key] = parseYamlValue(value);
  }

  return result as unknown as UnitFrontmatter;
}

function parseYamlValue(value: string): unknown {
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) {
      return [];
    }

    return inner.split(",").map((item) => stripQuotes(item.trim()));
  }

  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  return stripQuotes(value);
}

function stripQuotes(value: string): string {
  return value.replace(/^["']|["']$/g, "");
}

function splitBlocks(content: string, regex: RegExp): string[] {
  const matches = [...content.matchAll(regex)];

  return matches.map((match, index) => {
    const start = match.index!;
    const end = index + 1 < matches.length ? matches[index + 1].index! : content.length;
    return content.slice(start, end).trim();
  });
}

function extractSection(block: string, startHeading: string, endMarker: string, allowMissing = false): string {
  const startIndex = block.indexOf(startHeading);
  if (startIndex === -1) {
    if (allowMissing) {
      return "";
    }
    throw new Error(`No se encontró la sección ${startHeading}.`);
  }

  const contentStart = startIndex + startHeading.length;
  const endIndex = block.indexOf(endMarker, contentStart);

  if (endIndex === -1) {
    return block.slice(contentStart).trim();
  }

  return block.slice(contentStart, endIndex).trim();
}

function simplifyInlineMarkdown(value: string): string {
  return value
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/~~/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripBom(content: string): string {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}
