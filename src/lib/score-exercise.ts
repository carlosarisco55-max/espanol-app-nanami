import type { ExerciseBlock, ExerciseContent } from "../../tools/parse-curriculo/exercise-types";
import type { SupplementalChoiceTask } from "./dele-exam";
import { matchesAcceptedAnswer } from "./validators";

export function scoreExerciseContent(
  content: ExerciseContent,
  answers: Record<string, string>
): { correct: number; total: number } | null {
  switch (content.kind) {
    case "opcion_multiple":
      return countItems(content.items, (item) => answers[item.numero] === content.solucion[item.numero]);
    case "emparejar":
      return countItems(content.izquierda, (item) => answers[item.numero] === content.solucion[item.numero]);
    case "verdadero_falso":
      return countItems(content.items, (item) => answers[item.numero] === item.respuesta);
    case "huecos": {
      const keys = content.items.flatMap((item) =>
        Array.from({ length: item.respuestasPorHueco?.length ?? 1 }, (_, index) => ({
          expected: item.respuestasPorHueco?.[index] ?? item.respuesta,
          alternativas: item.alternativas,
          key: `${item.numero}:${index}`
        }))
      );
      return countItems(keys, (item) =>
        matchesAcceptedAnswer(answers[item.key] ?? "", item.expected, item.alternativas)
      );
    }
    case "respuesta_corta":
      return countItems(content.items, (item) =>
        matchesAcceptedAnswer(answers[item.numero] ?? "", item.respuesta, item.alternativas)
      );
    case "transformar":
      return countItems(content.items, (item) =>
        matchesAcceptedAnswer(answers[item.numero] ?? "", item.respuesta, item.alternativas)
      );
    case "corregir_error":
      return countItems(content.items, (item) =>
        matchesAcceptedAnswer(answers[item.numero] ?? "", item.correccion, item.alternativas)
      );
    case "reordenar":
      return countItems(content.items, (item) =>
        matchesAcceptedAnswer(answers[item.numero] ?? "", item.respuesta, item.alternativas)
      );
    case "dictado":
      return countItems(content.items, (item) =>
        matchesAcceptedAnswer(answers[item.numero] ?? "", item.frase)
      );
    case "discriminacion_fonetica":
      return countItems(
        content.items,
        (item) => answers[item.numero] === (item.respuesta ?? "__sin_contraste__")
      );
    case "clasificar": {
      const words = Object.values(content.solucion).flat();
      return countItems(
        words,
        (word) => Object.entries(content.solucion).some(([column, list]) => list.includes(word) && answers[word] === column)
      );
    }
    default:
      return null;
  }
}

export function scoreDeleSession(input: {
  exercises: ExerciseBlock[];
  records: Record<string, Record<string, string>>;
  supplemental?: SupplementalChoiceTask[];
  examAnswers?: Record<string, string>;
}): { correct: number; total: number } {
  let correct = 0;
  let total = 0;

  for (const exercise of input.exercises) {
    if (!exercise.content || exercise.id === "B1-B2-U16-E14") continue;
    const scored = scoreExerciseContent(exercise.content, input.records[exercise.id] ?? {});
    if (!scored) continue;
    correct += scored.correct;
    total += scored.total;
  }

  for (const task of input.supplemental ?? []) {
    for (const item of task.items) {
      total += 1;
      if ((input.examAnswers ?? {})[`supp-${task.taskNumber}-${item.number}`] === item.answer) {
        correct += 1;
      }
    }
  }

  return { correct, total };
}

function countItems<T>(items: T[], isCorrect: (item: T) => boolean): { correct: number; total: number } {
  return {
    total: items.length,
    correct: items.filter(isCorrect).length
  };
}
