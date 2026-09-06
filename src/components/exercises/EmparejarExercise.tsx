"use client";

import styles from "./exercises.module.css";
import ExerciseShell from "./ExerciseShell";
import type { EmparejarContent, JCode } from "../../../tools/parse-curriculo/exercise-types";
import { usePersistedAnswers } from "@/lib/use-persisted-answers";
import { validarEmparejar } from "@/lib/validators";

export default function EmparejarExercise({ id, content, jCodes = [] }: { id: string; content: EmparejarContent; jCodes?: JCode[] }) {
  const { respuestas, setRespuestas, initialState, persist } = usePersistedAnswers(id, jCodes);

  return (
    <ExerciseShell
      id={id}
      enunciado={content.enunciado}
      pista={content.pista}
      explicacion={content.explicacion ?? content.porQue}
      initialState={initialState}
    >
      {({ bloqueado, submit }) => {
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

                return (
                  <div key={item.numero} style={{ display: "contents" }}>
                    <p className={styles.matchLeft}>
                      {item.numero}. {item.texto}
                    </p>
                    <span className={styles.matchArrow}>→</span>
                    <select
                      className={selectCls}
                      value={chosen ?? ""}
                      disabled={bloqueado}
                      onChange={(e) => setRespuestas((r) => ({ ...r, [item.numero]: e.target.value }))}
                    >
                      <option value="" disabled>
                        elige…
                      </option>
                      {content.derecha.map((op) => {
                        const taken = Object.entries(respuestas).some(
                          ([numero, letra]) => numero !== item.numero && letra === op.letra
                        );
                        return (
                          <option key={op.letra} value={op.letra} disabled={taken}>
                            {op.letra}) {op.texto}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              })}
            </div>
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
