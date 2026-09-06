"use client";

import type { JCode, ProduccionEscritaContent } from "../../../tools/parse-curriculo/exercise-types";
import { readProfile } from "@/lib/profile";
import { usePersistedAnswers } from "@/lib/use-persisted-answers";
import ExerciseShell from "./ExerciseShell";
import RubricSelfEval from "./RubricSelfEval";
import styles from "./exercises.module.css";
import prod from "./production.module.css";

function applyProfile(text: string): string {
  const profile = readProfile();
  return text
    .replace(/\{\{nombre\}\}/g, profile?.nombre?.trim() || "tú")
    .replace(/\{\{profesion\}\}/g, profile?.profesion?.trim() || "tu trabajo")
    .replace(/\{\{intereses\}\}/g, profile?.gustos?.trim() || "lo que te gusta");
}

function wordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export default function ProduccionEscritaExercise({
  id,
  content,
  jCodes = []
}: {
  id: string;
  content: ProduccionEscritaContent;
  jCodes?: JCode[];
}) {
  const { respuestas, setRespuestas, initialState, persist } = usePersistedAnswers(id, jCodes);
  const submitted = respuestas.submitted === "1";
  const done = respuestas.done === "1";
  const texto = respuestas.texto ?? "";
  const words = wordCount(texto);

  function rubricValues() {
    return Object.fromEntries(
      content.rubrica.map((_, index) => [String(index), respuestas[`r${index}`] ?? ""])
    );
  }

  function save(next: Record<string, string>) {
    const rubricFilled =
      content.rubrica.length === 0 || content.rubrica.every((_, index) => next[`r${index}`]);
    const terminal = next.submitted === "1" && (content.rubrica.length === 0 ? next.done === "1" : rubricFilled);
    persist({ status: terminal ? "correcto" : "idle", intentos: terminal ? 1 : 0 }, next);
  }

  return (
    <ExerciseShell id={id} enunciado={applyProfile(content.enunciado)} initialState={initialState} feedback="none">
      {() => (
        <>
          {content.palabras && <p className={prod.meta}>{content.palabras} palabras</p>}
          {content.contexto && <p className={prod.context}>{applyProfile(content.contexto)}</p>}
          {content.requisitos.length > 0 && (
            <ol className={prod.requirements}>
              {content.requisitos.map((item) => (
                <li key={item}>{applyProfile(item)}</li>
              ))}
            </ol>
          )}
          <textarea
            className={prod.textarea}
            value={texto}
            disabled={submitted}
            onChange={(event) => {
              const textoValue = event.target.value;
              setRespuestas((prev) => {
                const next = { ...prev, texto: textoValue };
                save(next);
                return next;
              });
            }}
            placeholder="Escribe aquí. El modelo aparece después de entregar."
          />
          <p className={prod.wordCount}>{words} palabras</p>
          {!submitted && (
            <button
              type="button"
              className={styles.checkBtn}
              disabled={words < 1}
              onClick={() => {
                setRespuestas((prev) => {
                  const next = { ...prev, submitted: "1" };
                  save(next);
                  return next;
                });
              }}
            >
              Entregar
            </button>
          )}
          {submitted && content.modelo && (
            <div>
              <p className={prod.meta}>Modelo (después de entregar)</p>
              <p className={prod.modelo}>{content.modelo}</p>
            </div>
          )}
          {submitted && content.rubrica.length > 0 && (
            <>
              <p className={styles.enunciado}>Autoevaluación</p>
              <RubricSelfEval
                criteria={content.rubrica.map((item) =>
                  item.peso ? `${item.criterio} (${item.peso})` : item.criterio
                )}
                values={rubricValues()}
                onChange={(index, value) => {
                  setRespuestas((prev) => {
                    const next = { ...prev, [`r${index}`]: value };
                    if (content.rubrica.every((_, item) => next[`r${item}`])) next.done = "1";
                    save(next);
                    return next;
                  });
                }}
              />
            </>
          )}
          {submitted && content.rubrica.length === 0 && !done && (
            <button
              type="button"
              className={styles.checkBtn}
              onClick={() => {
                setRespuestas((prev) => {
                  const next = { ...prev, done: "1" };
                  save(next);
                  return next;
                });
              }}
            >
              He terminado
            </button>
          )}
          {submitted &&
            (done || (content.rubrica.length > 0 && content.rubrica.every((_, index) => respuestas[`r${index}`]))) && (
            <p className={prod.saved}>Guardado. No hay corrección automática: tú marcas la rúbrica.</p>
          )}
        </>
      )}
    </ExerciseShell>
  );
}
