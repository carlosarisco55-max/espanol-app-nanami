"use client";

import { useState } from "react";
import type { DiscriminacionFoneticaContent, JCode } from "../../../tools/parse-curriculo/exercise-types";
import { usePersistedAnswers } from "@/lib/use-persisted-answers";
import { idleExerciseState } from "@/lib/exercise-engine";
import { validarDiscriminacion } from "@/lib/validators";
import { speakText } from "@/lib/tts";
import ExerciseShell from "./ExerciseShell";
import styles from "./exercises.module.css";

export default function DiscriminacionFoneticaExercise({
  id,
  content,
  jCodes = []
}: {
  id: string;
  content: DiscriminacionFoneticaContent;
  jCodes?: JCode[];
}) {
  const { respuestas, setRespuestas, initialState, persist } = usePersistedAnswers(id, jCodes);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
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
          {audioUnavailable && (
            <p className={styles.inlineNotice}>Tu navegador no permite reproducir esta voz.</p>
          )}
          {content.items.map((item) => {
            const spoken = item.respuesta
              ? item.opciones.find((option) => option.letra === item.respuesta)?.texto
              : item.opciones[0]?.texto;
            return (
              <div key={item.numero} className={styles.phoneticRow}>
                <button
                  type="button"
                  className={styles.listenBtn}
                  onClick={() => setAudioUnavailable(!spoken || !speakText(spoken))}
                >
                  ▶ Escuchar {item.numero}
                </button>
                <div className={styles.optionsRow}>
                  {item.opciones.map((option, optionIndex) => (
                    <button
                      key={`${item.numero}-${option.letra}-${optionIndex}`}
                      type="button"
                      className={`${styles.optionBtn} ${
                        respuestas[item.numero] === option.letra ? styles.optionBtnSelected : ""
                      }`}
                      disabled={bloqueado}
                      onClick={() => setRespuestas((current) => ({
                        ...current,
                        [item.numero]: option.letra
                      }))}
                    >
                      {option.letra}: {option.texto}
                    </button>
                  ))}
                  {!item.respuesta && (
                    <button
                      type="button"
                      className={`${styles.optionBtn} ${
                        respuestas[item.numero] === "__sin_contraste__" ? styles.optionBtnSelected : ""
                      }`}
                      disabled={bloqueado}
                      onClick={() => setRespuestas((current) => ({
                        ...current,
                        [item.numero]: "__sin_contraste__"
                      }))}
                    >
                      No hay contraste
                    </button>
                  )}
                </div>
                {revelarSolucion && (
                  <p className={styles.solutionReveal}>
                    Solución:{" "}
                    {item.respuesta
                      ? `${item.respuesta}: ${item.opciones.find((option) => option.letra === item.respuesta)?.texto ?? ""}`
                      : "No hay contraste"}
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
              onClick={() => persist(submit(validarDiscriminacion(respuestas, content.items)), respuestas)}
            >
              Comprobar
            </button>
          </div>
        </>
      )}
    </ExerciseShell>
  );
}
