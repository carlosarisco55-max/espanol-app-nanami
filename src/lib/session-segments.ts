import type { ExerciseBlock } from "../../tools/parse-curriculo/exercise-types";
import type { AudioScript } from "../../tools/parse-curriculo/types";

export type SessionSegment =
  | { kind: "markdown"; text: string }
  | { kind: "exercise"; block: ExerciseBlock }
  | { kind: "audio"; audio: AudioScript };

const EXERCISE_HEADER_RE = /^####\s+`(B1-B2-U\d{2}-E\d{2})`.*$/gm;
const AUDIO_HEADER_RE = /^###\s+🎧\s+AUDIO\s+`([^`]+)`.*$/gm;

// Reconstruye el orden real de la sesión: texto de lectura, luego cada ejercicio
// interactivo exactamente donde aparecía en el markdown original, sin reordenar nada.
// Solo separa los ejercicios que ya tienen motor interactivo (content !== null) — el
// resto de ejercicios de la sesión (si los hay) se queda dentro del texto, como en Fase 1.
export function splitSessionIntoSegments(
  rawMarkdown: string,
  exercises: ExerciseBlock[],
  audios: AudioScript[] = []
): SessionSegment[] {
  const byId = new Map(exercises.filter((e) => e.content !== null).map((e) => [e.id, e]));
  const audioById = new Map(audios.map((audio) => [audio.id, audio]));
  if (byId.size === 0 && audioById.size === 0) return [{ kind: "markdown", text: rawMarkdown }];

  const exerciseMatches = [...rawMarkdown.matchAll(EXERCISE_HEADER_RE)].map((match, index, all) => ({
    kind: "exercise" as const,
    id: match[1],
    start: match.index!,
    end: all[index + 1]?.index ?? rawMarkdown.length
  }));
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
      segments.push({ kind: "exercise", block: byId.get(item.id)! });
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
