"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface ExerciseI18n {
  pistaEn?: string;
  explicacionEn?: string;
}

const ExerciseI18nContext = createContext<ExerciseI18n>({});

export function ExerciseI18nProvider({
  pistaEn,
  explicacionEn,
  children
}: ExerciseI18n & { children: ReactNode }) {
  return (
    <ExerciseI18nContext.Provider value={{ pistaEn, explicacionEn }}>{children}</ExerciseI18nContext.Provider>
  );
}

export function useExerciseI18n(): ExerciseI18n {
  return useContext(ExerciseI18nContext);
}
