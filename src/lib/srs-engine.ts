export type JCode = "J1" | "J2" | "J3" | "J4" | "J5" | "J6" | "J7" | "J8";

export interface SrsJCard {
  key: JCode;
  jCode: JCode;
  repetition: number;
  dueAt: number | null;
  lastEventAt: number;
  lastExerciseId: string;
}

export interface SrsUnitCard {
  key: string;
  unitId: string;
  repetition: number;
  dueAt: number | null;
  completedAt: number;
  lastEventAt: number;
}

export interface SrsState {
  jCards: Partial<Record<JCode, SrsJCard>>;
  unitCards: Record<string, SrsUnitCard>;
}

export const J_INTERVALS_DAYS = [2, 5, 10, 21] as const;
export const UNIT_REVIEW_DAYS = [7, 21, 56] as const;
const DAY_MS = 86_400_000;

export function emptySrsState(): SrsState {
  return { jCards: {}, unitCards: {} };
}

export function normalizeSrsState(value: Partial<SrsState> | null | undefined): SrsState {
  return {
    jCards: value?.jCards ?? {},
    unitCards: value?.unitCards ?? {}
  };
}

export function parseJCodes(value: string | undefined): JCode[] {
  if (!value) return [];
  return [...new Set(value.match(/\bJ[1-8]\b/g) ?? [])] as JCode[];
}

export function startOfLocalDay(value: Date | number): number {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function addDays(value: Date | number, days: number): number {
  return startOfLocalDay(value) + days * DAY_MS;
}

export function intervalDays(repetition: number): number {
  return J_INTERVALS_DAYS[Math.min(Math.max(repetition, 0), J_INTERVALS_DAYS.length - 1)];
}

export function recordJFailure(
  state: SrsState,
  jCodes: JCode[],
  exerciseId: string,
  now = Date.now()
): SrsState {
  const jCards = { ...state.jCards };
  for (const jCode of jCodes) {
    jCards[jCode] = {
      key: jCode,
      jCode,
      repetition: 0,
      dueAt: addDays(now, J_INTERVALS_DAYS[0]),
      lastEventAt: now,
      lastExerciseId: exerciseId
    };
  }
  return { ...state, jCards };
}

export function reviewJCard(
  state: SrsState,
  jCode: JCode,
  correct: boolean,
  now = Date.now()
): SrsState {
  const current = state.jCards[jCode];
  if (!current) return state;

  if (!correct) {
    return recordJFailure(state, [jCode], current.lastExerciseId, now);
  }

  const nextRepetition = current.repetition + 1;
  const mastered = nextRepetition >= J_INTERVALS_DAYS.length;
  return {
    ...state,
    jCards: {
      ...state.jCards,
      [jCode]: {
        ...current,
        repetition: Math.min(nextRepetition, J_INTERVALS_DAYS.length),
        dueAt: mastered ? null : addDays(now, intervalDays(nextRepetition)),
        lastEventAt: now
      }
    }
  };
}

export function dueJCards(state: SrsState, now = Date.now()): SrsJCard[] {
  const today = startOfLocalDay(now);
  return Object.values(state.jCards)
    .filter((card): card is SrsJCard => Boolean(card?.dueAt !== null && card?.dueAt !== undefined && card.dueAt <= today))
    .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));
}

export function recordUnitCompletion(state: SrsState, unitId: string, now = Date.now()): SrsState {
  if (state.unitCards?.[unitId]) return state;
  return {
    ...state,
    unitCards: {
      ...(state.unitCards ?? {}),
      [unitId]: {
        key: `unit:${unitId}`,
        unitId,
        repetition: 0,
        dueAt: addDays(now, UNIT_REVIEW_DAYS[0]),
        completedAt: now,
        lastEventAt: now
      }
    }
  };
}

export function reviewUnitCard(
  state: SrsState,
  unitId: string,
  correct: boolean,
  now = Date.now()
): SrsState {
  const current = state.unitCards?.[unitId];
  if (!current) return state;
  const nextRepetition = correct ? current.repetition + 1 : current.repetition;
  const mastered = nextRepetition >= UNIT_REVIEW_DAYS.length;
  return {
    ...state,
    unitCards: {
      ...(state.unitCards ?? {}),
      [unitId]: {
        ...current,
        repetition: nextRepetition,
        dueAt: mastered
          ? null
          : correct
            ? addDays(current.completedAt, UNIT_REVIEW_DAYS[nextRepetition] ?? UNIT_REVIEW_DAYS.at(-1)!)
            : addDays(now, UNIT_REVIEW_DAYS[0]),
        lastEventAt: now
      }
    }
  };
}

export function dueUnitCards(state: SrsState, now = Date.now()): SrsUnitCard[] {
  const today = startOfLocalDay(now);
  return Object.values(state.unitCards ?? {})
    .filter((card) => card.dueAt !== null && card.dueAt <= today)
    .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));
}
