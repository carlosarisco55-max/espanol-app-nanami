// Reglas puras del progreso (testeables sin IndexedDB ni React).
// Una "sesión completada" cuenta la primera vez que todos sus ejercicios
// interactivos llegan a estado terminal (correcto o fallo_2).

export function sessionKey(unitId: string, sessionSlug: string): string {
  return `${unitId}:${sessionSlug}`;
}

export function backupRound(sessionsCompleted: number): number {
  return Math.floor(sessionsCompleted / 5) * 5;
}

export function shouldPromptBackup(sessionsCompleted: number, lastAcknowledgedRound: number): boolean {
  const round = backupRound(sessionsCompleted);
  return round >= 5 && round > lastAcknowledgedRound;
}

export function isTerminalStatus(status: string): boolean {
  return status === "correcto" || status === "fallo_2";
}

export function sessionJustCompleted(
  interactiveIds: string[],
  statuses: Record<string, string>,
  alreadyCounted: boolean
): boolean {
  if (alreadyCounted || interactiveIds.length === 0) return false;
  return interactiveIds.every((id) => isTerminalStatus(statuses[id] ?? ""));
}

export function backupFilename(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `espanol-app-backup-B1B2-${yyyy}-${mm}-${dd}.json`;
}
