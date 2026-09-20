import type { ExerciseProgress } from "./storage";

export interface NotebookStatus {
  hasAnyWork: boolean;
  hasFirstWriting: boolean;
  hasFormalLetter: boolean;
  hasOralExam: boolean;
}

export function notebookStatus(progress: ExerciseProgress[]): NotebookStatus {
  const examWritten = progress.find((record) => record.exerciseId === "B1-B2-U16-s4-exam")?.answers;
  const examOral = progress.find((record) => record.exerciseId === "B1-B2-U16-s5-exam")?.answers;
  return {
    hasAnyWork: progress.some((record) => Object.values(record.answers).some((value) => value?.trim())),
    hasFirstWriting: Boolean(
      progress.find((record) => record.exerciseId === "B1-B2-U01-E15")?.answers.texto?.trim()
    ),
    hasFormalLetter: Boolean(examWritten?.["written-1"]?.trim() || examWritten?.["written-2"]?.trim()),
    hasOralExam: Boolean(examOral?.oralRecorded === "1" || examOral?.oralNotes?.trim())
  };
}

export function closingQuoteFor(
  status: NotebookStatus,
  quotes: { full: string; short: string }
): string | null {
  if (!status.hasAnyWork) return null;
  if (status.hasFormalLetter && status.hasOralExam) return quotes.full;

  let quote = quotes.full;
  if (!status.hasFormalLetter) {
    quote = quote.replace(
      /Acabas de escribir una carta formal a un ayuntamiento y de valorar cuatro propuestas urbanísticas en voz alta\.\s*/i,
      ""
    );
  } else if (!status.hasOralExam) {
    quote = quote.replace(/\s*y de valorar cuatro propuestas urbanísticas en voz alta/i, "");
  }
  if (!status.hasFormalLetter && !status.hasOralExam) return quotes.short;
  return quote.replace(/\s+/g, " ").trim();
}
