"use client";

import type { VerdaderoFalsoContent } from "../../../tools/parse-curriculo/exercise-types";
import { usePersistedAnswers } from "@/lib/use-persisted-answers";
import { validarVerdaderoFalso } from "@/lib/validators";
import ExerciseShell from "./ExerciseShell";
import styles from "./exercises.module.css";

export default function VerdaderoFalsoExercise({ id, content }: { id: string; content: VerdaderoFalsoContent }) {
  const { respuestas, setRespuestas, initialState, persist } = usePersistedAnswers(id);
  const completo = content.items.every((item) => respuestas[item.numero]);

  return (
    <ExerciseShell
      id={id}
      enunciado={content.enunciado}
      pista={content.pista}
      explicacion={content.explicacion ?? content.porQue}
      initialState={initialState}
    >
      {({ bloqueado, submit }) => (
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
