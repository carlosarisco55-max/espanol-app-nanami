"use client";

import type { JCode, VerdaderoFalsoContent } from "../../../tools/parse-curriculo/exercise-types";
import { usePersistedAnswers } from "@/lib/use-persisted-answers";
import { idleExerciseState } from "@/lib/exercise-engine";
import { validarVerdaderoFalso } from "@/lib/validators";
import ExerciseShell from "./ExerciseShell";
import styles from "./exercises.module.css";

export default function VerdaderoFalsoExercise({ id, content, jCodes = [] }: { id: string; content: VerdaderoFalsoContent; jCodes?: JCode[] }) {
  const { respuestas, setRespuestas, initialState, persist } = usePersistedAnswers(id, jCodes);
  const completo = content.items.every((item) => respuestas[item.numero]);

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
              <p className={styles.itemText}>{item.numero}. {item.afirmacion}</p>
              <div className={styles.optionsRow}>
                {(["V", "F"] as const).map((answer) => (
                  <button
                    key={answer}
                    type="button"
                    className={`${styles.optionBtn} ${respuestas[item.numero] === answer ? styles.optionBtnSelected : ""}`}
                    disabled={bloqueado}
                    onClick={() => setRespuestas((current) => ({ ...current, [item.numero]: answer }))}
                  >
                    {answer === "V" ? "Verdadero" : "Falso"}
                  </button>
                ))}
              </div>
              {revelarSolucion && (
                <p className={styles.solutionReveal}>
                  Solución: {item.respuesta === "V" ? "Verdadero" : "Falso"}
                  {item.justificacion ? ` — ${item.justificacion}` : ""}
                </p>
              )}
            </div>
          ))}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.checkBtn}
              disabled={!completo || bloqueado}
              onClick={() => persist(submit(validarVerdaderoFalso(respuestas, content.items)), respuestas)}
            >
              Comprobar
            </button>
          </div>
        </>
      )}
    </ExerciseShell>
  );
}
