import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { ExerciseBlock } from "./exercise-types";

export interface FeedbackEnFields {
  pistaEn?: string;
  explicacionEn?: string;
}

const ID_RE = /^##\s+(B1-B2-U\d{2}-E\d{2})\s*$/;
const FIELD_RE = /^(pista|explicacion|porQue)\s*:\s*(.*)$/i;

export function readFeedbackEnFile(cwd = process.cwd()): string | null {
  const filePath = resolve(cwd, "content", "feedback-en.md");
  try {
    return readFileSync(filePath, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw error;
  }
}

export function loadFeedbackEnTranslations(cwd = process.cwd()): Map<string, FeedbackEnFields> {
  const raw = readFeedbackEnFile(cwd);
  return raw ? parseFeedbackI18n(raw) : new Map();
}

export function parseFeedbackI18n(markdown: string): Map<string, FeedbackEnFields> {
  const byId = new Map<string, FeedbackEnFields>();
  const lines = markdown.replace(/\r/g, "").split("\n");
  let currentId: string | null = null;
  let field: "pista" | "explicacion" | "porQue" | null = null;
  const buffers: Record<string, string[]> = {};

  function flush() {
    if (!currentId) return;
    const pista = joinField(buffers.pista);
    const explicacion = joinField(buffers.explicacion) ?? joinField(buffers.porQue);
    const entry: FeedbackEnFields = {};
    if (pista) entry.pistaEn = pista;
    if (explicacion) entry.explicacionEn = explicacion;
    if (entry.pistaEn || entry.explicacionEn) byId.set(currentId, entry);
  }

  for (const line of lines) {
    const header = line.match(ID_RE);
    if (header) {
      flush();
      currentId = header[1];
      field = null;
      buffers.pista = [];
      buffers.explicacion = [];
      buffers.porQue = [];
      continue;
    }
    if (!currentId) continue;
    const fieldMatch = line.match(FIELD_RE);
    if (fieldMatch) {
      const name = fieldMatch[1].toLowerCase();
      field = name === "porque" ? "porQue" : (name as "pista" | "explicacion");
      buffers[field] = fieldMatch[2] ? [fieldMatch[2]] : [];
      continue;
    }
    if (field) buffers[field].push(line);
  }
  flush();
  return byId;
}

export function unknownFeedbackIds(
  translations: Map<string, FeedbackEnFields>,
  knownIds: Iterable<string>
): string[] {
  const known = new Set(knownIds);
  return [...translations.keys()].filter((id) => !known.has(id)).sort();
}

export function attachFeedbackI18n(
  exercises: ExerciseBlock[],
  translations: Map<string, FeedbackEnFields>
): ExerciseBlock[] {
  return exercises.map((exercise) => {
    const extra = translations.get(exercise.id);
    if (!extra) return exercise;
    const content = exercise.content
      ? { ...exercise.content, pistaEn: extra.pistaEn, explicacionEn: extra.explicacionEn }
      : exercise.content;
    return {
      ...exercise,
      pistaEn: extra.pistaEn,
      explicacionEn: extra.explicacionEn,
      content
    };
  });
}

function joinField(lines: string[] | undefined): string | undefined {
  if (!lines?.length) return undefined;
  const text = lines.join("\n").replace(/^\s+/, "").replace(/\s+$/, "");
  return text || undefined;
}
