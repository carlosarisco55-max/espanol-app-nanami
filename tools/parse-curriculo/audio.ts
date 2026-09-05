import type { AudioLine, AudioScript } from "./types";

const AUDIO_HEADER_RE = /^###\s+🎧\s+AUDIO\s+`([^`]+)`\s+—\s+(.+)$/gm;

function plain(value: string): string {
  return value
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/[«»]/g, "")
    .trim();
}

function yamlField(raw: string, field: string): string | undefined {
  const yaml = raw.match(/```yaml\n([\s\S]*?)\n```/)?.[1] ?? "";
  const line = yaml.split("\n").find((item) => item.trim().startsWith(`${field}:`));
  return line?.split(":").slice(1).join(":").trim().replace(/^"|"$/g, "");
}

function parseLine(rawLine: string, currentSegment?: string): AudioLine | null {
  const quoted = rawLine.match(/^>\s*(.*)$/)?.[1]?.trim();
  if (!quoted) return null;

  const speakerMatch = quoted.match(/^\*\*([^*]+):\*\*\s*(.+)$/);
  const stageDirections = [...quoted.matchAll(/\*\(([^)]+)\)\*/g)].map((match) => match[1]);
  const spoken = plain(
    (speakerMatch?.[2] ?? quoted)
      .replace(/\*\([^)]+\)\*/g, "")
      .replace(/\[—\]/g, "")
  );
  if (!spoken || /^\*\*🎙️/.test(quoted)) return null;

  return {
    speaker: speakerMatch?.[1]?.trim(),
    text: spoken,
    stageDirections,
    segment: currentSegment
  };
}

export function parseAudioScripts(sessionMarkdown: string): AudioScript[] {
  const matches = [...sessionMarkdown.matchAll(AUDIO_HEADER_RE)];

  return matches.map((match, index) => {
    const start = match.index!;
    const nextAudio = matches[index + 1]?.index;
    const exerciseAfter = sessionMarkdown.slice(start).search(/^####\s+`B1-B2-U\d{2}-E\d{2}`/m);
    const endFromExercise = exerciseAfter === -1 ? undefined : start + exerciseAfter;
    const end = Math.min(nextAudio ?? sessionMarkdown.length, endFromExercise ?? sessionMarkdown.length);
    const raw = sessionMarkdown.slice(start, end).replace(/\n---\s*$/, "").trim();

    let segment: string | undefined;
    const lines: AudioLine[] = [];
    for (const rawLine of raw.split("\n")) {
      const segmentMatch = rawLine.match(/^>\s+\*\*🎙️\s+([^*]+)\*\*\s*$/);
      if (segmentMatch) {
        segment = plain(segmentMatch[1]);
        continue;
      }
      const line = parseLine(rawLine, segment);
      if (line) lines.push(line);
    }

    return {
      id: match[1],
      title: plain(match[2]),
      tipoAudio: yamlField(raw, "tipo_audio"),
      level: yamlField(raw, "nivel_mcer"),
      duration: yamlField(raw, "duracion"),
      speakers: yamlField(raw, "hablantes"),
      speed: yamlField(raw, "velocidad"),
      productionNote: yamlField(raw, "nota_produccion"),
      lines
    };
  });
}
