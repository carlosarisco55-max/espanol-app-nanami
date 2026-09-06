"use client";

import type {
  CorregirErrorContent,
  DictadoContent,
  RespuestaCortaContent,
  TransformarContent
} from "../../../tools/parse-curriculo/exercise-types";
import { usePersistedAnswers } from "@/lib/use-persisted-answers";
import {
  validarCorregirError,
  validarDictado,
  validarRespuestaCorta,
  validarTransformar
} from "@/lib/validators";
import ExerciseShell from "./ExerciseShell";
import styles from "./exercises.module.css";

type TextContent = RespuestaCortaContent | TransformarContent | CorregirErrorContent | DictadoContent;

function rowsFor(content: TextContent) {
  switch (content.kind) {
    case "respuesta_corta":
      return content.items.map((item) => ({ numero: item.numero, prompt: item.pregunta }));
    case "transformar":
      return content.items.map((item) => ({
        numero: item.numero,
        prompt: [item.origen, item.arranque].filter(Boolean).join(" → ")
      }));
    case "corregir_error":
      return content.items.map((item) => ({ numero: item.numero, prompt: item.frase }));
    case "dictado":
      return content.items.map((item) => ({ numero: item.numero, prompt: `Frase ${item.numero}` }));
  }
}

function validate(content: TextContent, answers: Record<string, string>): boolean {
  switch (content.kind) {
    case "respuesta_corta": return validarRespuestaCorta(answers, content.items);
    case "transformar": return validarTransformar(answers, content.items);
    case "corregir_error": return validarCorregirError(answers, content.items);
    case "dictado": return validarDictado(answers, content.items);
  }
}

export default function TextAnswerExercise({ id, content }: { id: string; content: TextContent }) {
  const { respuestas, setRespuestas, initialState, persist } = usePersistedAnswers(id);
  const rows = rowsFor(content);
  const completo = rows.every((item) => respuestas[item.numero]?.trim());

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
          {rows.map((item) => (
            <label key={item.numero} className={styles.textAnswerRow}>
              <span className={styles.itemText}>{item.numero}. {item.prompt}</span>
              <input
                className={styles.textInput}
                value={respuestas[item.numero] ?? ""}
                disabled={bloqueado}
                autoComplete="off"
                onChange={(event) =>
                  setRespuestas((current) => ({ ...current, [item.numero]: event.target.value }))
                }
              />
            </label>
          ))}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.checkBtn}
              disabled={!completo || bloqueado}
              onClick={() => persist(submit(validate(content, respuestas)), respuestas)}
            >
              Comprobar
            </button>
          </div>
        </>
      )}
    </ExerciseShell>
  );
}
