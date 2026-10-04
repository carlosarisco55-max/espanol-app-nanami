"use client";

import type { AutoevaluacionContent, JCode } from "../../../tools/parse-curriculo/exercise-types";
import { usePersistedAnswers } from "@/lib/use-persisted-answers";
import ExerciseShell from "./ExerciseShell";
import styles from "./exercises.module.css";
import prod from "./production.module.css";

export default function AutoevaluacionExercise({
  id,
  content,
  jCodes = []
}: {
  id: string;
  content: AutoevaluacionContent;
  jCodes?: JCode[];
}) {
  const { respuestas, setRespuestas, initialState, persist } = usePersistedAnswers(id, jCodes);
  const done = content.criterios.every((_, index) => Boolean(respuestas[`r${index}`]));

  function choose(index: number, value: string) {
    let next: Record<string, string> = respuestas;
    setRespuestas((previous) => {
      next = { ...previous, [`r${index}`]: value };
      return next;
    });
    const complete = content.criterios.every((_, itemIndex) => Boolean(next[`r${itemIndex}`]));
    persist(
      { status: complete ? "correcto" : "idle", intentos: complete ? 1 : 0 },
      next
    );
  }

  return (
    <ExerciseShell
      id={id}
      enunciado={content.enunciado}
      initialState={initialState}
      feedback="none"
    >
      {() => (
        <>
          <ul className={prod.rubric}>
            {content.criterios.map((criterio, index) => (
              <li key={criterio} className={prod.selfEvalRow}>
                <span>{criterio}</span>
                <div className={prod.selfEvalScale}>
                  {content.escala.map((option) => {
                    const selected = respuestas[`r${index}`] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={selected ? prod.selfEvalSelected : prod.selfEvalButton}
                        aria-pressed={selected}
                        onClick={() => choose(index, option.value)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
          {done && (
            <p className={prod.saved}>
              Guardado. Esta parrilla es tu autoevaluación; no hay corrección automática.
            </p>
          )}
          {content.nota && <p className={styles.feedback}>{content.nota}</p>}
        </>
      )}
    </ExerciseShell>
  );
}
