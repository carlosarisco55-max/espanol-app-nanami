"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { idleExerciseState, type ExerciseState } from "@/lib/exercise-engine";
import { useOptionalSessionProgress } from "@/components/SessionProgressProvider";

export function usePersistedAnswers(exerciseId: string): {
  respuestas: Record<string, string>;
  setRespuestas: Dispatch<SetStateAction<Record<string, string>>>;
  initialState: ExerciseState;
  persist: (state: ExerciseState, answers: Record<string, string>) => void;
  ready: boolean;
} {
  const progress = useOptionalSessionProgress();
  const record = progress?.getRecord(exerciseId);
  const [respuestas, setRespuestas] = useState<Record<string, string>>(() => record?.answers ?? {});

  const initialState: ExerciseState = record
    ? { status: record.status, intentos: record.intentos }
    : idleExerciseState;

  return {
    respuestas,
    setRespuestas,
    initialState,
    persist: (state, answers) => {
      void progress?.saveRecord(exerciseId, state, answers);
    },
    ready: progress ? progress.ready : true
  };
}
