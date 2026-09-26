import type { ExerciseBlock } from "../../tools/parse-curriculo/exercise-types";
import type { AudioScript } from "../../tools/parse-curriculo/types";
import { hideStaticSolution } from "./hide-static-solution";

export type SessionSegment =
  | { kind: "markdown"; text: string }
  | { kind: "exercise"; block: ExerciseBlock }
  | { kind: "audio"; audio: AudioScript };

const EXERCISE_HEADER_RE = /^####\s+`(B1-B2-U\d{2}-E\d{2})`.*$/gm;
const AUDIO_HEADER_RE = /^###\s+🎧\s+AUDIO\s+`([^`]+)`.*$/gm;

// Reconstruye el orden real de la sesión: texto de lectura, luego cada ejercicio
// exactamente donde aparecía en el markdown original, sin reordenar nada.
// Con motor (content !== null) → segmento interactivo. Sin motor y autocorregible
// → markdown con **Solución**/explicación ocultas. El resto se queda como lectura.
export function splitSessionIntoSegments(
  rawMarkdown: string,
  exercises: ExerciseBlock[],
  audios: AudioScript[] = []
): SessionSegment[] {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const audioById = new Map(audios.map((audio) => [audio.id, audio]));
  if (byId.size === 0 && audioById.size === 0) return [{ kind: "markdown", text: rawMarkdown }];

  const exerciseMatches = [...rawMarkdown.matchAll(EXERCISE_HEADER_RE)].map((match, index, all) => {
    const nextExercise = all[index + 1]?.index ?? rawMarkdown.length;
    const afterHeader = match.index! + match[0].length;
    const nextSectionOffset = rawMarkdown.slice(afterHeader, nextExercise).search(/^###\s+/m);
    return {
      kind: "exercise" as const,
      id: match[1],
      start: match.index!,
      end: nextSectionOffset === -1 ? nextExercise : afterHeader + nextSectionOffset
    };
  });
  const audioMatches = [...rawMarkdown.matchAll(AUDIO_HEADER_RE)].map((match) => {
    const afterStart = rawMarkdown.slice(match.index!);
    const nextExercise = afterStart.search(/^####\s+`B1-B2-U\d{2}-E\d{2}`/m);
    return {
      kind: "audio" as const,
      id: match[1],
      start: match.index!,
      end: nextExercise === -1 ? rawMarkdown.length : match.index! + nextExercise
    };
  });
  const replacements = [...exerciseMatches, ...audioMatches]
    .filter((item) => (item.kind === "exercise" ? byId.has(item.id) : audioById.has(item.id)))
    .sort((a, b) => a.start - b.start);
  const segments: SessionSegment[] = [];
  let cursor = 0;

  for (const item of replacements) {
    if (item.start < cursor) continue;
    if (item.start > cursor) {
      segments.push({ kind: "markdown", text: rawMarkdown.slice(cursor, item.start) });
    }
    if (item.kind === "exercise") {
      const block = byId.get(item.id)!;
      if (block.content !== null) {
        segments.push({ kind: "exercise", block });
      } else {
        const slice = rawMarkdown.slice(item.start, item.end);
        segments.push({
          kind: "markdown",
          text: block.autocorregible === true ? hideStaticSolution(slice) : slice
        });
      }
    } else {
      segments.push({ kind: "audio", audio: audioById.get(item.id)! });
    }
    cursor = item.end;
  }

  if (cursor < rawMarkdown.length) {
    segments.push({ kind: "markdown", text: rawMarkdown.slice(cursor) });
  }

  return segments;
}
