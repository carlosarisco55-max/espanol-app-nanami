import type { ExerciseStatus } from "./exercise-engine";

export const FEEDBACK_EN_PREF_KEY = "nanami:feedback-en";

export interface FeedbackEnFields {
  pistaEn?: string;
  explicacionEn?: string;
}

export function englishFeedbackText(
  status: ExerciseStatus,
  fields: FeedbackEnFields,
  options: { examMode?: boolean; engineFeedback?: boolean } = {}
): string | null {
  if (options.examMode) return null;
  if (options.engineFeedback === false) return null;
  if (status === "fallo_1") return trimOrNull(fields.pistaEn);
  if (status === "fallo_2") return trimOrNull(fields.explicacionEn);
  return null;
}

export function shouldShowEnglishControl(
  status: ExerciseStatus,
  fields: FeedbackEnFields,
  options: { examMode?: boolean; engineFeedback?: boolean } = {}
): boolean {
  return englishFeedbackText(status, fields, options) !== null;
}

export function readFeedbackEnPref(storage?: Pick<Storage, "getItem"> | null): boolean {
  const store = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  if (!store) return false;
  try {
    return store.getItem(FEEDBACK_EN_PREF_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeFeedbackEnPref(open: boolean, storage?: Pick<Storage, "setItem" | "removeItem"> | null): void {
  const store = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  if (!store) return;
  try {
    if (open) store.setItem(FEEDBACK_EN_PREF_KEY, "1");
    else store.removeItem(FEEDBACK_EN_PREF_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

function trimOrNull(value?: string): string | null {
  const text = value?.replace(/^\s+/, "").replace(/\s+$/, "");
  return text || null;
}
