"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./exercises.module.css";
import { useIsDeleExam } from "@/components/dele/ExamModeContext";
import { englishFeedbackText } from "@/lib/feedback-en";
import { idleExerciseState, useExerciseEngine, type ExerciseState } from "@/lib/exercise-engine";
import { useExerciseI18n } from "./ExerciseI18nContext";
import FeedbackEnSupport from "./FeedbackEnSupport";

export interface ExerciseShellRenderProps {
  state: ExerciseState;
  bloqueado: boolean;
  revelarSolucion: boolean;
  submit: (correcto: boolean) => ExerciseState;
  reintentar: () => void;
}

export default function ExerciseShell({
  id,
  enunciado,
  pista,
  explicacion,
  initialState,
  feedback = "engine",
  onRetry,
  children
}: {
  id: string;
  enunciado: string;
  pista?: string;
  explicacion?: string;
  initialState?: ExerciseState;
  feedback?: "engine" | "none";
  onRetry?: () => void;
  children: (props: ExerciseShellRenderProps) => ReactNode;
}) {
  const { state, submit, reintentar, bloqueado } = useExerciseEngine(initialState ?? idleExerciseState);
  const showEngineFeedback = feedback === "engine";
  const revelarSolucion = showEngineFeedback && state.status === "fallo_2";
  const i18n = useExerciseI18n();
  const examMode = useIsDeleExam();
  const englishText = englishFeedbackText(state.status, i18n, {
    examMode,
    engineFeedback: showEngineFeedback
  });

  function handleRetry() {
    reintentar();
    onRetry?.();
  }

  return (
    <div className={styles.card} data-exercise-id={id}>
      <p className={styles.enunciado}>{enunciado}</p>

      {children({ state, bloqueado, revelarSolucion, submit, reintentar: handleRetry })}

      {showEngineFeedback && state.status === "correcto" && (
        <p className={`${styles.feedback} ${styles.feedbackCorrecto}`}>
          <span className={styles.feedbackLabel}>✓ Correcto.</span>
          Bien hecho.
        </p>
      )}
      {showEngineFeedback && state.status === "fallo_1" && (
        <div className={`${styles.feedback} ${styles.feedbackPista}`}>
          <p>
            <span className={styles.feedbackLabel}>💡 {pista ? "Pista." : "Casi."}</span>
            {pista ?? "No es correcto todavía — vuelve a intentarlo."}
          </p>
          {englishText && <FeedbackEnSupport text={englishText} />}
        </div>
      )}
      {showEngineFeedback && state.status === "fallo_2" && (
        <>
          <div className={`${styles.feedback} ${styles.feedbackExplicacion}`}>
            <p className={styles.feedbackLabel}>📖 Por qué.</p>
            {explicacion ? (
              <div className={styles.feedbackBody}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{explicacion}</ReactMarkdown>
              </div>
            ) : (
              <p className={styles.feedbackFallback}>
                No es correcto. Revisa el material de la sesión y vuelve más tarde.
              </p>
            )}
            {englishText && <FeedbackEnSupport text={englishText} />}
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.retryBtn} onClick={handleRetry}>
              Reintentar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
