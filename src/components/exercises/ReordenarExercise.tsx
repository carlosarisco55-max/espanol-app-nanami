"use client";

import type { JCode, ReordenarContent } from "../../../tools/parse-curriculo/exercise-types";
import { usePersistedAnswers } from "@/lib/use-persisted-answers";
import { idleExerciseState } from "@/lib/exercise-engine";
import { validarReordenar } from "@/lib/validators";
import ExerciseShell from "./ExerciseShell";
import styles from "./exercises.module.css";

export default function ReordenarExercise({ id, content, jCodes = [] }: { id: string; content: ReordenarContent; jCodes?: JCode[] }) {
  const { respuestas, setRespuestas, initialState, persist } = usePersistedAnswers(id, jCodes);
  const completo = content.items.every((item) => respuestas[item.numero]?.trim());

  return (
    <ExerciseShell
      id={id}
      enunciado={content.enunciado}
      pista={content.pista}
      explicacion={content.explicacion ?? content.porQue}
      initialState={initialState}
      onRetry={() => persist(idleExerciseState, respuestas)}
    >
      {({ bloqueado, revelarSolucion, submit }) => (
        <>
          {content.items.map((item) => (
            <div key={item.numero} className={styles.itemRow}>
              <p className={styles.itemText}>
                {item.numero}. {respuestas[item.numero] || "Pulsa los fragmentos en orden."}
              </p>
              <div className={styles.optionsRow}>
                {item.fragmentos.map((fragment, index) => {
                  const used = (respuestas[item.numero] ?? "").includes(fragment);
                  return (
                    <button
                      key={`${fragment}-${index}`}
                      type="button"
                      className={styles.optionBtn}
                      disabled={bloqueado || used}
                      aria-pressed={used}
                      onClick={() => setRespuestas((current) => ({
                        ...current,
                        [item.numero]: [current[item.numero], fragment].filter(Boolean).join(" ")
                      }))}
                    >
                      {fragment}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className={styles.clearBtn}
                  disabled={bloqueado || !respuestas[item.numero]}
                  onClick={() => setRespuestas((current) => ({ ...current, [item.numero]: "" }))}
                >
                  Borrar
                </button>
              </div>
              {revelarSolucion && (
                <p className={styles.solutionReveal}>Solución: {item.respuesta}</p>
              )}
            </div>
          ))}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.checkBtn}
              disabled={!completo || bloqueado}
              onClick={() => persist(submit(validarReordenar(respuestas, content.items)), respuestas)}
            >
              Comprobar
            </button>
          </div>
        </>
      )}
    </ExerciseShell>
  );
}
