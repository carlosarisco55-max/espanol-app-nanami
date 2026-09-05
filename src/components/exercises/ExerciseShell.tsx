"use client";

import type { ReactNode } from "react";
import styles from "./exercises.module.css";
import { useExerciseEngine, type ExerciseState, idleExerciseState } from "@/lib/exercise-engine";

export interface ExerciseShellRenderProps {
  state: ExerciseState;
  bloqueado: boolean;
  submit: (correcto: boolean) => ExerciseState;
}

export default function ExerciseShell({
  id,
  enunciado,
  pista,
  explicacion,
  initialState,
  children
}: {
  id: string;
  enunciado: string;
  pista?: string;
  explicacion?: string;
  initialState?: ExerciseState;
  children: (props: ExerciseShellRenderProps) => ReactNode;
}) {
  const { state, submit, bloqueado } = useExerciseEngine(initialState ?? idleExerciseState);

  return (
    <div className={styles.card}>
      <span className={styles.idPill}>{id}</span>
      <p className={styles.enunciado}>{enunciado}</p>

      {children({ state, bloqueado, submit })}

      {state.status === "correcto" && (
        <p className={`${styles.feedback} ${styles.feedbackCorrecto}`}>
          <span className={styles.feedbackLabel}>✓ Correcto.</span>
          Bien hecho.
        </p>
      )}
      {state.status === "fallo_1" && (
        <p className={`${styles.feedback} ${styles.feedbackPista}`}>
          <span className={styles.feedbackLabel}>💡 {pista ? "Pista." : "Casi."}</span>
          {pista ?? "No es correcto todavía — vuelve a intentarlo."}
        </p>
      )}
      {state.status === "fallo_2" && (
        <p className={`${styles.feedback} ${styles.feedbackExplicacion}`}>
          <span className={styles.feedbackLabel}>📖 Por qué.</span>
          {explicacion ?? "No es correcto. Revisa el material de la sesión y vuelve más tarde."}
        </p>
      )}
    </div>
  );
}
