"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ExerciseState } from "@/lib/exercise-engine";
import { sessionKey, shouldPromptBackup } from "@/lib/progress-logic";
import {
  acknowledgeBackup as persistAcknowledge,
  markSessionCompletedIfNeeded,
  storage,
  type ExerciseProgress,
  type ProgressMeta
} from "@/lib/storage";

interface ProgressContextValue {
  ready: boolean;
  getRecord: (exerciseId: string) => ExerciseProgress | undefined;
  saveRecord: (exerciseId: string, state: ExerciseState, answers: Record<string, string>) => Promise<void>;
  backupDue: boolean;
  dismissBackup: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function useSessionProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error("useSessionProgress debe usarse dentro de SessionProgressProvider");
  }
  return ctx;
}

export function useOptionalSessionProgress(): ProgressContextValue | null {
  return useContext(ProgressContext);
}

export default function SessionProgressProvider({
  unitId,
  sessionSlug,
  interactiveIds,
  children
}: {
  unitId: string;
  sessionSlug: string;
  interactiveIds: string[];
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [byId, setById] = useState<Record<string, ExerciseProgress>>({});
  const [meta, setMeta] = useState<ProgressMeta | null>(null);
  const byIdRef = useRef(byId);
  byIdRef.current = byId;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [all, loadedMeta] = await Promise.all([storage.getAllProgress(), storage.getMeta()]);
        if (cancelled) return;
        const next: Record<string, ExerciseProgress> = {};
        for (const record of all) {
          if (record.unitId === unitId && record.sessionSlug === sessionSlug) {
            next[record.exerciseId] = record;
          }
        }
        setById(next);
        setMeta(loadedMeta);
      } catch {
        /* IndexedDB no disponible: la sesión sigue, sin persistir. */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [unitId, sessionSlug]);

  const saveRecord = useCallback(
    async (exerciseId: string, state: ExerciseState, answers: Record<string, string>) => {
      const record: ExerciseProgress = {
        exerciseId,
        unitId,
        sessionSlug,
        status: state.status,
        intentos: state.intentos,
        answers,
        updatedAt: Date.now()
      };
      const merged = { ...byIdRef.current, [exerciseId]: record };
      byIdRef.current = merged;
      setById(merged);
      await storage.saveProgress(record);
      const statuses: Record<string, string> = {};
      for (const id of interactiveIds) {
        statuses[id] = merged[id]?.status ?? "";
      }
      const nextMeta = await markSessionCompletedIfNeeded(sessionKey(unitId, sessionSlug), interactiveIds, statuses);
      setMeta(nextMeta);
    },
    [interactiveIds, sessionSlug, unitId]
  );

  const dismissBackup = useCallback(async () => {
    const next = await persistAcknowledge();
    setMeta(next);
  }, []);

  const backupDue = meta ? shouldPromptBackup(meta.completedSessions.length, meta.lastAcknowledgedRound) : false;

  const value = useMemo(
    () => ({
      ready,
      getRecord: (exerciseId: string) => byId[exerciseId],
      saveRecord,
      backupDue,
      dismissBackup
    }),
    [backupDue, byId, dismissBackup, ready, saveRecord]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
