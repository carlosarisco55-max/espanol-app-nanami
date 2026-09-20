"use client";

import styles from "./exercises.module.css";
import ExerciseShell from "./ExerciseShell";
import type { EmparejarContent, JCode } from "../../../tools/parse-curriculo/exercise-types";
import { usePersistedAnswers } from "@/lib/use-persisted-answers";
import { idleExerciseState } from "@/lib/exercise-engine";
import { assignEmparejarAnswer, isEmparejarLetterTaken, validarEmparejar } from "@/lib/validators";
import { useExamMode } from "@/components/dele/ExamModeContext";

export default function EmparejarExercise({ id, content, jCodes = [] }: { id: string; content: EmparejarContent; jCodes?: JCode[] }) {
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
        const completo = content.izquierda.every((item) => respuestas[item.numero]);

        function comprobar() {
          const correcto = validarEmparejar(respuestas, content.solucion);
          persist(submit(correcto), respuestas);
        }

        return (
          <>
            <div className={styles.matchGrid}>
              {content.izquierda.map((item) => {
                const chosen = respuestas[item.numero];
                const isCorrect = chosen === content.solucion[item.numero];
                let selectCls = styles.matchSelect;
                if (bloqueado && chosen) selectCls += ` ${isCorrect ? styles.matchSelectCorrect : styles.matchSelectIncorrect}`;

                const correcta = content.solucion[item.numero];
                const textoCorrecto = content.derecha.find((op) => op.letra === correcta)?.texto ?? correcta;

                return (
                  <div key={item.numero} className={styles.matchRow}>
                    <p className={styles.matchLeft}>
                      {item.numero}. {item.texto}
                    </p>
                    <span className={styles.matchArrow} aria-hidden="true">
                      →
                    </span>
                    <div className={styles.matchChoice}>
                      <select
                        className={selectCls}
                        value={chosen ?? ""}
                        disabled={bloqueado}
                        onChange={(e) =>
                          setRespuestas((r) => assignEmparejarAnswer(r, item.numero, e.target.value, content.allowRepeat))
                        }
                      >
                        <option value="">elige…</option>
                        {content.derecha.map((op) => {
                          const taken = isEmparejarLetterTaken(respuestas, item.numero, op.letra, content.allowRepeat);
                          return (
                            <option key={op.letra} value={op.letra}>
                              {op.letra}) {op.texto}
                              {taken && chosen !== op.letra ? " · en otra fila" : ""}
                            </option>
                          );
                        })}
                      </select>
                      {revelarSolucion && (
                        <p className={styles.solutionReveal}>
                          Solución: {correcta}) {textoCorrecto}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
