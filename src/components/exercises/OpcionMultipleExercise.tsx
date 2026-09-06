"use client";

import styles from "./exercises.module.css";
import ExerciseShell from "./ExerciseShell";
import type { OpcionMultipleContent } from "../../../tools/parse-curriculo/exercise-types";
import { usePersistedAnswers } from "@/lib/use-persisted-answers";
import { validarOpcionMultiple } from "@/lib/validators";

export default function OpcionMultipleExercise({ id, content }: { id: string; content: OpcionMultipleContent }) {
  const { respuestas, setRespuestas, initialState, persist } = usePersistedAnswers(id);

  return (
    <ExerciseShell
      id={id}
      enunciado={content.enunciado}
      pista={content.pista}
      explicacion={content.explicacion ?? content.porQue}
      initialState={initialState}
    >
      {({ bloqueado, submit }) => {
        const completo = content.items.every((item) => respuestas[item.numero]);

        function comprobar() {
          const correcto = validarOpcionMultiple(respuestas, content.solucion);
          persist(submit(correcto), respuestas);
        }

        return (
          <>
            {content.items.map((item) => (
              <div key={item.numero} className={styles.itemRow}>
                <p className={styles.itemText}>
                  {item.numero}. {item.enunciado}
                </p>
                <div className={styles.optionsRow}>
                  {item.opciones.map((op) => {
                    const selected = respuestas[item.numero] === op.letra;
                    const isCorrectAnswer = op.letra === content.solucion[item.numero];
                    let cls = styles.optionBtn;
                    if (bloqueado && selected && isCorrectAnswer) cls += ` ${styles.optionCorrect}`;
                    else if (bloqueado && selected && !isCorrectAnswer) cls += ` ${styles.optionIncorrect}`;
                    else if (bloqueado && isCorrectAnswer) cls += ` ${styles.optionCorrect}`;
                    else if (selected) cls += ` ${styles.optionBtnSelected}`;

                    return (
                      <button
                        key={op.letra}
                        type="button"
                        className={cls}
                        disabled={bloqueado}
                        onClick={() => setRespuestas((r) => ({ ...r, [item.numero]: op.letra }))}
                      >
                        {op.letra}) {op.texto}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className={styles.actions}>
              <button type="button" className={styles.checkBtn} disabled={!completo || bloqueado} onClick={comprobar}>
                Comprobar
              </button>
            </div>
          </>
        );
      }}
    </ExerciseShell>
  );
}
