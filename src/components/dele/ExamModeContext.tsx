"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ExamPhase = "running" | "review";

const ExamModeContext = createContext<{ phase: ExamPhase; canCheck: boolean } | null>(null);

export function ExamModeProvider({
  phase,
  children
}: {
  phase: ExamPhase;
  children: ReactNode;
}) {
  return (
    <ExamModeContext.Provider value={{ phase, canCheck: phase === "review" }}>
      {children}
    </ExamModeContext.Provider>
  );
}

export function useExamMode() {
  return useContext(ExamModeContext) ?? { phase: "review" as const, canCheck: true };
}

export function useIsDeleExam(): boolean {
  return useContext(ExamModeContext) !== null;
}
