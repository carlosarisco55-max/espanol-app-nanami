"use client";

import type { HuecosContent, JCode } from "../../../tools/parse-curriculo/exercise-types";
import { usePersistedAnswers } from "@/lib/use-persisted-answers";
import { idleExerciseState } from "@/lib/exercise-engine";
import { validarHuecos } from "@/lib/validators";
import ExerciseShell from "./ExerciseShell";
import styles from "./exercises.module.css";

export default function HuecosExercise({ id, content, jCodes = [] }: { id: string; content: HuecosContent; jCodes?: JCode[] }) {
  const { respuestas, setRespuestas, initialState, persist } = usePersistedAnswers(id, jCodes);
  const keys = content.items.flatMap((item) =>
    Array.from({ length: item.respuestasPorHueco?.length ?? 1 }, (_, index) => `${item.numero}:${index}`)
  );
  const completo = keys.every((key) => respuestas[key]?.trim());

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
          {content.texto && <p className={styles.sourceText}>{content.texto}</p>}
          {content.items.map((item) => {
            const count = item.respuestasPorHueco?.length ?? 1;
            return (
              <div key={item.numero} className={styles.itemRow}>
                {item.texto && <p className={styles.itemText}>{item.numero}. {item.texto}</p>}
                <div className={styles.inputRow}>
                  <span className={styles.inputNumber}>{item.numero}.</span>
                  {Array.from({ length: count }, (_, index) => {
                    const key = `${item.numero}:${index}`;
                    return (
                      <input
                        key={key}
                        className={styles.textInput}
                        aria-label={`Respuesta ${item.numero}${count > 1 ? `, hueco ${index + 1}` : ""}`}
                        value={respuestas[key] ?? ""}
                        disabled={bloqueado}
                        autoComplete="off"
                        onChange={(event) => setRespuestas((current) => ({ ...current, [key]: event.target.value }))}
                      />
                    );
                  })}
                </div>
                {revelarSolucion && (
                  <p className={styles.solutionReveal}>
                    Solución: {item.respuestasPorHueco?.join(" / ") ?? item.respuesta}
                  </p>
                )}
              </div>
            );
          })}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.checkBtn}
              disabled={!completo || bloqueado}
              onClick={() => persist(submit(validarHuecos(respuestas, content.items)), respuestas)}
            >
              Comprobar
            </button>
          </div>
        </>
      )}
    </ExerciseShell>
  );
}
