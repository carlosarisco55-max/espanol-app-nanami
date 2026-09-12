import type { AudioLine } from "../../tools/parse-curriculo/types";

export interface SupplementalChoiceTask {
  taskNumber: number;
  title: string;
  items: {
    number: string;
    options: { value: string; label: string }[];
    answer: string;
  }[];
}

function plain(value: string): string {
  return value
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .trim();
}

function section(markdown: string, start: RegExp, end: RegExp): string {
  const startMatch = markdown.match(start);
  if (startMatch?.index === undefined) return "";
  const rest = markdown.slice(startMatch.index);
  const endMatch = rest.slice(startMatch[0].length).match(end);
  const endIndex = endMatch?.index === undefined
    ? rest.length
    : startMatch[0].length + endMatch.index;
  return rest.slice(0, endIndex);
}

function solutionMap(value: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of value.matchAll(/(\d+)\s*-\s*\**([a-z])\**/gi)) {
    result[match[1]] = match[2].toLowerCase();
  }
  return result;
}

export function parseReadingSupplementalTasks(markdown: string): SupplementalChoiceTask[] {
  const task3 = section(markdown, /^###\s+📖\s+TAREA 3\b/m, /^###\s+📖\s+TAREA 4\b/m);
  const task3Solution = solutionMap(task3.match(/\*\*Soluci[oó]n:\*\*\s*(.+)/i)?.[1] ?? "");
  const fragments = [...task3.matchAll(/^\*\*([a-h])\)\*\*\s+(.+)$/gim)].map((match) => ({
    value: match[1].toLowerCase(),
    label: `${match[1].toLowerCase()}) ${plain(match[2])}`
  }));

  const task4 = section(markdown, /^###\s+📖\s+TAREA 4\b/m, /^####\s+`[^`]+`\s+—\s+Correcci[oó]n/m);
  const task4Solution = solutionMap(task4.match(/\*\*Soluci[oó]n:\*\*\s*(.+)/i)?.[1] ?? "");
  const task4Items = task4
    .split("\n")
    .map((line) => line.split("|").slice(1, -1).map(plain))
    .filter((cells) => /^\d+$/.test(cells[0] ?? "") && Boolean(task4Solution[cells[0]]))
    .map((cells) => ({
      number: cells[0],
      options: cells.slice(1).map((label, index) => ({
        value: String.fromCharCode(97 + index),
        label
      })),
      answer: task4Solution[cells[0]]
    }));

  const result: SupplementalChoiceTask[] = [];
  if (Object.keys(task3Solution).length > 0 && fragments.length > 0) {
    result.push({
      taskNumber: 3,
      title: "Tarea 3 — Fragmentos que reubicar",
      items: Object.entries(task3Solution).map(([number, answer]) => ({
        number,
        options: fragments,
        answer
      }))
    });
  }
  if (task4Items.length > 0) {
    result.push({
      taskNumber: 4,
      title: "Tarea 4 — Texto con huecos gramaticales",
      items: task4Items
    });
  }
  return result;
}

export function hideDeleReview(markdown: string, sessionNumber: number): string {
  let visible = markdown;

  visible = visible.replace(
    /^####\s+`[^`]+`\s+—\s+Correcci[oó]n y puntuaci[oó]n[\s\S]*$/gim,
    ""
  );
  visible = visible.replace(
    /^\*\*Soluci[oó]n[^:]*:\*\*.*(?:\n\*\(.*\))?/gim,
    ""
  );
  visible = visible.replace(
    /^>\s*💡\s*\*\*(?:Estrategia|Por qu[eé]|C[oó]mo)[\s\S]*?(?=^---\s*$|^###\s|^####\s+`)/gim,
    ""
  );

  if (sessionNumber === 2) {
    visible = visible.replace(
      /^\|\s*Hueco\s*\|[^\n]*\n^\|[-|\s:]+\n(?:^\|.*\n?)+/gim,
      "_Marca las respuestas en la hoja de respuestas de la prueba._\n\n"
    );
  }

  if (sessionNumber === 3) {
    visible = visible.replace(
      /^####\s+SCRIPTS?\s*$[\s\S]*?(?=^####\s+`|(?![\s\S]))/gim,
      "#### Audición\n\n_Usa el reproductor de la prueba. La transcripción se muestra al terminar._\n\n"
    );
  }

  if (sessionNumber === 4) {
    visible = visible.replace(
      /^####\s+AUDIO[^\n]*\n[\s\S]*?(?=^\*\*En su carta debe:\*\*)/gim,
      "#### Audición\n\n_Usa el reproductor de la prueba. La transcripción se muestra al terminar._\n\n"
    );
    visible = visible.replace(
      /^\*\*MODELO\*\*[\s\S]*?(?=^###\s+✍️\s+TAREA 2)/gim,
      ""
    );
    visible = visible.replace(/^\*\*MODELO \(Opci[oó]n A\)\*\*[\s\S]*$/gim, "");
  }

  if (sessionNumber === 5) {
    visible = visible.replace(
      /^\*\*Preguntas que har[aá] la app[^\n]*\n[\s\S]*?(?=^---\s*$)/gim,
      "_Las preguntas del interlocutor se presentan durante la prueba._\n\n"
    );
    visible = visible.replace(
      /^\*\*Conversaci[oó]n posterior\*\*[\s\S]*?(?=^---\s*$)/gim,
      "_La conversación posterior se presenta durante la prueba._\n\n"
    );
    visible = visible.replace(
      /^\*\*Lo que har[aá] la app[^\n]*\n[\s\S]*?(?=^---\s*$)/gim,
      "_Las intervenciones del interlocutor se presentan durante la prueba._\n\n"
    );
    visible = visible.replace(/^####\s+`B1-B2-U16-E14`[\s\S]*$/gim, "");
  }

  return visible.trim();
}

function linesFromScript(script: string): AudioLine[] {
  const lines: AudioLine[] = [];
  for (const rawLine of script.split("\n")) {
    const line = rawLine.replace(/^>\s?/, "").trim();
    if (!line) continue;
    const dialogue = line.match(/^\*\*([^*]+):\*\*\s*(.+)$/);
    if (dialogue) {
      lines.push({
        speaker: plain(dialogue[1]),
        text: plain(dialogue[2]).replace(/^«|»$/g, ""),
        stageDirections: []
      });
      continue;
    }
    const numbered = line.match(/^\*\*([①-⑳])(?:\s+([^*]+)|\s*\([^)]+\))?\*\*\s*[«"](.+)[»"]$/);
    if (numbered) {
      lines.push({
        speaker: plain(numbered[2] || `Mensaje ${numbered[1]}`),
        text: plain(numbered[3]),
        stageDirections: []
      });
    }
  }
  return lines;
}

export function extractDeleAudioTasks(markdown: string, sessionNumber: number) {
  if (sessionNumber === 3) {
    return [1, 2, 3, 4].flatMap((taskNumber) => {
      const nextTaskPattern = taskNumber < 4
        ? new RegExp(`^###\\s+🎧\\s+TAREA ${taskNumber + 1}\\b`, "m")
        : /^####\s+`B1-B2-U16-E13`/m;
      const task = section(
        markdown,
        new RegExp(`^###\\s+🎧\\s+TAREA ${taskNumber}\\b`, "m"),
        nextTaskPattern
      );
      const scriptMatch = task.match(/^####\s+SCRIPTS?\s*$([\s\S]*?)(?=^####\s+`)/im);
      const lines = linesFromScript(scriptMatch?.[1] ?? "");
      return lines.length > 0 ? [{ taskNumber, lines }] : [];
    });
  }

  if (sessionNumber === 4) {
    const script = markdown.match(/^####\s+AUDIO[^\n]*\n([\s\S]*?)(?=^\*\*En su carta debe:\*\*)/im)?.[1] ?? "";
    const text = plain(script.replace(/^>\s?/gm, " ")).replace(/\s+/g, " ");
    return text ? [{ taskNumber: 1, lines: [{ speaker: "Ayuntamiento", text, stageDirections: [] }] }] : [];
  }

  return [];
}

export function extractOralInterventions(markdown: string) {
  const groups: { taskNumber: number; prompts: string[] }[] = [];
  const task2 = section(markdown, /^###\s+🗣️\s+TAREA 2\b/m, /^###\s+🗣️\s+TAREA 3\b/m);
  const task2PromptBlock = task2.match(
    /\*\*Preguntas que har[aá] la app\*\*[\s\S]*?:\s*([\s\S]*?)(?=^>\s*💡)/im
  )?.[1] ?? "";
  const task2Prompts = [...task2PromptBlock.matchAll(/^\d+\.\s+\*(.+?)\*/gm)].map((match) =>
    plain(match[1])
  );
  if (task2Prompts.length > 0) groups.push({ taskNumber: 2, prompts: task2Prompts });

  const task3 = section(markdown, /^###\s+🗣️\s+TAREA 3\b/m, /^###\s+🗣️\s+TAREA 4\b/m);
  const task3PromptBlock = task3.match(
    /\*\*Conversaci[oó]n posterior\*\*[\s\S]*?:\s*([\s\S]*?)(?=^---\s*$)/im
  )?.[1] ?? "";
  const task3Prompts = [...task3PromptBlock.matchAll(/^\d+\.\s+\*(.+?)\*/gm)].map((match) =>
    plain(match[1])
  );
  if (task3Prompts.length > 0) groups.push({ taskNumber: 3, prompts: task3Prompts });

  const task4 = section(markdown, /^###\s+🗣️\s+TAREA 4\b/m, /^####\s+`B1-B2-U16-E14`/m);
  const task4PromptBlock = task4.match(
    /\*\*Lo que har[aá] la app:\*\*\s*([\s\S]*?)(?=^>\s*💡)/im
  )?.[1] ?? "";
  const task4Prompts = task4PromptBlock
    .split("\n")
    .map((line) => plain(line.replace(/^-\s*/, "")))
    .filter(Boolean);
  if (task4Prompts.length > 0) groups.push({ taskNumber: 4, prompts: task4Prompts });

  return groups;
}
