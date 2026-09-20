"use client";

import styles from "./exercises.module.css";
import ExerciseShell from "./ExerciseShell";
import type { ClasificarContent, JCode } from "../../../tools/parse-curriculo/exercise-types";
import { usePersistedAnswers } from "@/lib/use-persisted-answers";
import { idleExerciseState } from "@/lib/exercise-engine";
import { validarClasificar } from "@/lib/validators";

export default function ClasificarExercise({ id, content, jCodes = [] }: { id: string; content: ClasificarContent; jCodes?: JCode[] }) {
  const { respuestas: asignadas, setRespuestas: setAsignadas, initialState, persist } = usePersistedAnswers(id, jCodes);

  return (
    <ExerciseShell
      id={id}
      enunciado={content.enunciado}
      pista={content.pista}
      explicacion={content.explicacion ?? content.porQue}
      initialState={initialState}
      onRetry={() => persist(idleExerciseState, asignadas)}
    >
      {({ bloqueado, revelarSolucion, submit }) => {
        const completo = content.banco.every((w) => asignadas[w]);
        const pendientes = content.banco.filter((w) => !asignadas[w]);

        function comprobar() {
          const correcto = validarClasificar(asignadas, content.solucion);
          persist(submit(correcto), asignadas);
        }

        function asignar(word: string, columna: string) {
          setAsignadas((a) => ({ ...a, [word]: columna }));
        }

        function quitar(word: string) {
          setAsignadas((a) => {
            const next = { ...a };
            delete next[word];
            return next;
          });
        }

        return (
          <>
            {pendientes.length > 0 && (
              <div className={styles.bank}>
                {pendientes.map((word) => (
                  <span key={word} style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                    <span className={styles.bankWord}>{word}</span>
                    {content.columnas.map((col) => (
                      <button
                        key={col}
                        type="button"
                        className={styles.checkBtn}
                        style={{ padding: "0.25rem 0.55rem", fontSize: "0.72rem" }}
                        onClick={() => asignar(word, col)}
                      >
                        → {col}
                      </button>
                    ))}
                  </span>
                ))}
              </div>
            )}

            <div className={styles.columns}>
              {content.columnas.map((col) => {
                const words = Object.entries(asignadas)
                  .filter(([, c]) => c === col)
                  .map(([w]) => w);
                return (
                  <div key={col} className={styles.column}>
                    <p className={styles.columnTitle}>{col}</p>
                    <div className={styles.columnWords}>
                      {words.map((w) => {
                        const isCorrect = content.solucion[col].includes(w);
                        return (
                          <button
                            key={w}
                            type="button"
                            className={styles.placedWord}
                            disabled={bloqueado}
                            onClick={() => quitar(w)}
                            style={
                              bloqueado
                                ? {
                                    background: isCorrect ? "var(--sage-soft)" : "var(--clay-soft)",
                                    color: isCorrect ? "var(--sage)" : "var(--clay)"
                                  }
                                : undefined
                            }
                          >
                            {w}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {revelarSolucion && (
              <div className={styles.solutionReveal}>
                {content.columnas.map((col) => (
                  <p key={col}>
                    Solución · {col}: {(content.solucion[col] ?? []).join(" · ")}
                  </p>
                ))}
              </div>
            )}

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
