"use client";

import styles from "./exercises.module.css";
import ExerciseShell from "./ExerciseShell";
import type { JCode, OpcionMultipleContent } from "../../../tools/parse-curriculo/exercise-types";
import { usePersistedAnswers } from "@/lib/use-persisted-answers";
import { idleExerciseState } from "@/lib/exercise-engine";
import { validarOpcionMultiple } from "@/lib/validators";
import { useExamMode } from "@/components/dele/ExamModeContext";

export default function OpcionMultipleExercise({ id, content, jCodes = [] }: { id: string; content: OpcionMultipleContent; jCodes?: JCode[] }) {
  const { respuestas, setRespuestas, initialState, persist } = usePersistedAnswers(id, jCodes);
  const exam = useExamMode();

  return (
    <ExerciseShell
      id={id}
      enunciado={content.enunciado}
      pista={content.pista}
      explicacion={content.explicacion ?? content.porQue}
      initialState={initialState}
      onRetry={() => persist(idleExerciseState, respuestas)}
    >
      {({ bloqueado, revelarSolucion, submit }) => {
        const completo = content.items.every((item) => respuestas[item.numero]);

        function comprobar() {
          const correcto = validarOpcionMultiple(respuestas, content.solucion);
          persist(submit(correcto), respuestas);
        }

        return (
          <>
            {content.items.map((item) => {
              const promptId = `${id}-item-${item.numero}`;
              return (
                <div key={item.numero} className={styles.itemRow}>
                  <p id={promptId} className={styles.itemText}>
                    {item.numero}. {item.enunciado}
                  </p>
                  <div className={styles.optionsRow} role="group" aria-labelledby={promptId}>
                    {item.opciones.map((op, optionIndex) => {
                      const selected = respuestas[item.numero] === op.letra;
                      const isCorrectAnswer = op.letra === content.solucion[item.numero];
                      let cls = styles.optionBtn;
                      if (bloqueado && selected && isCorrectAnswer) cls += ` ${styles.optionCorrect}`;
                      else if (bloqueado && selected && !isCorrectAnswer) cls += ` ${styles.optionIncorrect}`;
                      else if (bloqueado && isCorrectAnswer) cls += ` ${styles.optionCorrect}`;
                      else if (selected) cls += ` ${styles.optionBtnSelected}`;

                      return (
                        <button
                          key={`${item.numero}-${op.letra}-${optionIndex}`}
                          type="button"
                          className={cls}
                          disabled={bloqueado}
                          aria-pressed={selected}
                          onClick={() => setRespuestas((r) => ({ ...r, [item.numero]: op.letra }))}
                        >
                          {content.layout === "tabla" ? op.texto : `${op.letra}) ${op.texto}`}
                        </button>
                      );
                    })}
                  </div>
                  {revelarSolucion && (
                    <p className={styles.solutionReveal}>
                      Solución: {content.solucion[item.numero]}){" "}
                      {item.opciones.find((op) => op.letra === content.solucion[item.numero])?.texto ??
                        content.solucion[item.numero]}
                    </p>
                  )}
                </div>
              );
            })}
            <div className={styles.actions}>
              <button type="button" className={styles.checkBtn} disabled={!completo || bloqueado || !exam.canCheck} onClick={comprobar}>
                {exam.canCheck ? "Comprobar" : "Disponible al terminar la prueba"}
              </button>
            </div>
          </>
        );
      }}
    </ExerciseShell>
  );
}
