"use client";

import { useRef, useState } from "react";
import type { JCode, ProduccionOralContent } from "../../../tools/parse-curriculo/exercise-types";
import { speakText } from "@/lib/tts";
import { usePersistedAnswers } from "@/lib/use-persisted-answers";
import ExerciseShell from "./ExerciseShell";
import RubricSelfEval from "./RubricSelfEval";
import styles from "./exercises.module.css";
import prod from "./production.module.css";

export default function ProduccionOralExercise({
  id,
  content,
  jCodes = []
}: {
  id: string;
  content: ProduccionOralContent;
  jCodes?: JCode[];
}) {
  const { respuestas, setRespuestas, initialState, persist } = usePersistedAnswers(id, jCodes);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const attempted = respuestas.recorded === "1";
  const done = respuestas.done === "1";

  function rubricValues() {
    return Object.fromEntries(
      content.autoevaluacion.map((_, index) => [String(index), respuestas[`r${index}`] ?? ""])
    );
  }

  function save(next: Record<string, string>) {
    const rubricFilled =
      content.autoevaluacion.length === 0 || content.autoevaluacion.every((_, index) => next[`r${index}`]);
    const terminal = next.recorded === "1" && (content.autoevaluacion.length === 0 ? next.done === "1" : rubricFilled);
    persist({ status: terminal ? "correcto" : "idle", intentos: terminal ? 1 : 0 }, next);
  }

  function commitAnswers(recipe: (prev: Record<string, string>) => Record<string, string>) {
    let next = respuestas;
    setRespuestas((prev) => {
      next = recipe(prev);
      return next;
    });
    save(next);
  }

  function markAttempted(extra: Record<string, string> = {}) {
    commitAnswers((prev) => ({ ...prev, ...extra, recorded: "1" }));
  }

  async function toggleRecord() {
    if (recording) {
      mediaRef.current?.stop();
      setRecording(false);
      markAttempted();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setMicError(true);
    }
  }

  return (
    <ExerciseShell id={id} enunciado={content.enunciado} initialState={initialState} feedback="none">
      {() => (
        <>
          {content.duracion && <p className={prod.meta}>{content.duracion}</p>}
          {content.guion && <p className={prod.guion}>{content.guion}</p>}
          {content.frases.length > 0 && (
            <ol className={prod.phrases}>
              {content.frases.map((frase) => (
                <li key={frase}>
                  {frase}{" "}
                  <button type="button" className={styles.optionBtn} onClick={() => speakText(frase)}>
                    Escuchar
                  </button>
                </li>
              ))}
            </ol>
          )}
          <p className={prod.meta}>Palabras clave, no el texto entero</p>
          <textarea
            className={prod.notes}
            value={respuestas.notas ?? ""}
            onChange={(event) => {
              const notas = event.target.value;
              commitAnswers((prev) => ({ ...prev, notas }));
            }}
          />
          <div className={prod.actions}>
            <button type="button" className={styles.checkBtn} onClick={() => void toggleRecord()}>
              {recording ? "Parar" : "Grabar"}
            </button>
            {!attempted && (
              <button type="button" className={styles.checkBtn} onClick={() => markAttempted()}>
                Ya lo he hecho
              </button>
            )}
          </div>
          {micError && (
            <p className={prod.hiddenNote}>
              Este navegador no ha dejado grabar. Puedes hablar en voz alta y marcar «Ya lo he hecho».
            </p>
          )}
          {audioUrl && <audio controls src={audioUrl} />}
          {attempted && content.autoevaluacion.length > 0 && (
            <>
              <p className={styles.enunciado}>Autoevaluación</p>
              <RubricSelfEval
                criteria={content.autoevaluacion}
                values={rubricValues()}
                onChange={(index, value) => {
                  commitAnswers((prev) => {
                    const next = { ...prev, [`r${index}`]: value };
                    if (content.autoevaluacion.every((_, item) => next[`r${item}`])) next.done = "1";
                    return next;
                  });
                }}
              />
            </>
          )}
          {attempted && content.autoevaluacion.length === 0 && !done && (
            <button
              type="button"
              className={styles.checkBtn}
              onClick={() => {
                commitAnswers((prev) => ({ ...prev, recorded: "1", done: "1" }));
              }}
            >
              He terminado
            </button>
          )}
          {done && (
            <p className={prod.saved}>Guardado. La grabación se queda en este dispositivo, no en el servidor.</p>
          )}
        </>
      )}
    </ExerciseShell>
  );
}
