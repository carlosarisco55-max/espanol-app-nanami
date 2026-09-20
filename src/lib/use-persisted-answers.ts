"use client";

import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { idleExerciseState, type ExerciseState } from "@/lib/exercise-engine";
import { useOptionalSessionProgress } from "@/components/SessionProgressProvider";
import type { JCode } from "../../tools/parse-curriculo/exercise-types";

export function usePersistedAnswers(exerciseId: string, jCodes: JCode[] = []): {
  respuestas: Record<string, string>;
  setRespuestas: Dispatch<SetStateAction<Record<string, string>>>;
  initialState: ExerciseState;
  persist: (state: ExerciseState, answers: Record<string, string>) => void;
  ready: boolean;
} {
  const progress = useOptionalSessionProgress();
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const record = progress?.getRecord(exerciseId);
  const [respuestas, setRespuestas] = useState<Record<string, string>>(() => record?.answers ?? {});

  const initialState: ExerciseState = record
    ? { status: record.status, intentos: record.intentos }
    : idleExerciseState;

  function persistLater(state: ExerciseState, answers: Record<string, string>) {
    queueMicrotask(() => {
      void progressRef.current?.saveRecord(exerciseId, state, answers, jCodes);
    });
  }

  function setAndSave(update: SetStateAction<Record<string, string>>) {
    setRespuestas((previous) => {
      const next = typeof update === "function" ? update(previous) : update;
      const current = progressRef.current?.getRecord(exerciseId);
      if (current?.status !== "correcto" && current?.status !== "fallo_2") {
        persistLater(
          { status: current?.status ?? "idle", intentos: current?.intentos ?? 0 },
          next
        );
      }
      return next;
    });
  }

  return {
    respuestas,
    setRespuestas: setAndSave,
    initialState,
    persist: persistLater,
    ready: progress ? progress.ready : true
  };
}
