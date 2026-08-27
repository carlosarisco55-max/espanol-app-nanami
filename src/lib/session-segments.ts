import type { ExerciseBlock } from "../../tools/parse-curriculo/exercise-types";

export type SessionSegment =
  | { kind: "markdown"; text: string }
  | { kind: "exercise"; block: ExerciseBlock };

const EXERCISE_HEADER_RE = /^####\s+`(B1-B2-U\d{2}-E\d{2})`.*$/gm;

// Reconstruye el orden real de la sesión: texto de lectura, luego cada ejercicio
// interactivo exactamente donde aparecía en el markdown original, sin reordenar nada.
// Solo separa los ejercicios que ya tienen motor interactivo (content !== null) — el
// resto de ejercicios de la sesión (si los hay) se queda dentro del texto, como en Fase 1.
export function splitSessionIntoSegments(rawMarkdown: string, exercises: ExerciseBlock[]): SessionSegment[] {
  const byId = new Map(exercises.filter((e) => e.content !== null).map((e) => [e.id, e]));
  if (byId.size === 0) return [{ kind: "markdown", text: rawMarkdown }];

  const matches = [...rawMarkdown.matchAll(EXERCISE_HEADER_RE)];
  const segments: SessionSegment[] = [];
  let cursor = 0;

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const id = match[1];
    const block = byId.get(id);
    if (!block) continue; // ejercicio sin motor todavía: se queda como parte del texto

    const blockStart = match.index!;
    const nextMatch = matches[i + 1];
    const blockEnd = nextMatch ? nextMatch.index! : rawMarkdown.length;

    if (blockStart > cursor) {
      segments.push({ kind: "markdown", text: rawMarkdown.slice(cursor, blockStart) });
    }
    segments.push({ kind: "exercise", block });
    cursor = blockEnd;
  }

  if (cursor < rawMarkdown.length) {
    segments.push({ kind: "markdown", text: rawMarkdown.slice(cursor) });
  }

  return segments;
}
