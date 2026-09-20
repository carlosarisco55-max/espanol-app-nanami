"use client";

import { useEffect } from "react";
import type {
  CorregirErrorContent,
  DictadoContent,
  JCode,
  RespuestaCortaContent,
  TransformarContent
} from "../../../tools/parse-curriculo/exercise-types";
import { idleExerciseState } from "@/lib/exercise-engine";
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

function solutionFor(content: TextContent, numero: string): string {
  switch (content.kind) {
    case "respuesta_corta":
      return content.items.find((item) => item.numero === numero)?.respuesta ?? "";
    case "transformar":
      return content.items.find((item) => item.numero === numero)?.respuesta ?? "";
    case "corregir_error":
      return content.items.find((item) => item.numero === numero)?.correccion ?? "";
    case "dictado":
      return content.items.find((item) => item.numero === numero)?.frase ?? "";
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

export default function TextAnswerExercise({ id, content, jCodes = [] }: { id: string; content: TextContent; jCodes?: JCode[] }) {
  const { respuestas, setRespuestas, initialState, persist } = usePersistedAnswers(id, jCodes);
  const rows = rowsFor(content);
  const completo = rows.every((item) => respuestas[item.numero]?.trim());

  useEffect(() => {
    if (content.kind !== "respuesta_corta") return;
    setRespuestas((current) => {
      if (Object.values(current).some((value) => value?.trim())) return current;
      const next = { ...current };
      let changed = false;
      for (const item of content.items) {
        if (item.respuesta.includes("|") && !next[item.numero]) {
          next[item.numero] = item.pregunta;
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [content, setRespuestas]);

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
              {revelarSolucion && (
                <span className={styles.solutionReveal}>Solución: {solutionFor(content, item.numero)}</span>
              )}
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
