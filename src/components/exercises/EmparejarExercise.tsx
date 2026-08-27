"use client";

import { useState } from "react";
import styles from "./exercises.module.css";
import ExerciseShell from "./ExerciseShell";
import type { EmparejarContent } from "../../../tools/parse-curriculo/exercise-types";

export default function EmparejarExercise({ id, content }: { id: string; content: EmparejarContent }) {
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});

  return (
    <ExerciseShell id={id} enunciado={content.enunciado} pista={content.pista} explicacion={content.explicacion}>
      {({ bloqueado, submit }) => {
        const completo = content.izquierda.every((item) => respuestas[item.numero]);

        function comprobar() {
          const correcto = content.izquierda.every((item) => respuestas[item.numero] === content.solucion[item.numero]);
          submit(correcto);
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
                      {content.derecha.map((op) => (
                        <option key={op.letra} value={op.letra}>
                          {op.letra}) {op.texto}
                        </option>
                      ))}
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
