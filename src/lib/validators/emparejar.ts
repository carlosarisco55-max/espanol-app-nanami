import { hasUniqueValues, sameMap } from "./maps";

export function validarEmparejar(respuestas: Record<string, string>, solucion: Record<string, string>): boolean {
  if (!hasUniqueValues(respuestas)) return false;
  return sameMap(respuestas, solucion);
}

/** True if another row already holds this letter. The current row never blocks itself. */
export function isEmparejarLetterTaken(
  respuestas: Record<string, string>,
  currentNumero: string | number,
  letra: string,
  allowRepeat?: boolean
): boolean {
  if (allowRepeat || !letra) return false;
  const current = String(currentNumero);
  return Object.entries(respuestas).some(([numero, chosen]) => String(numero) !== current && chosen === letra);
}

/**
 * Assign a letter to a row. If the letter is already used elsewhere and repeats
 * are not allowed, steal it from that other row so the current row can always
 * change its mind (even when every slot is already filled).
 */
export function assignEmparejarAnswer(
  respuestas: Record<string, string>,
  numero: string | number,
  letra: string,
  allowRepeat?: boolean
): Record<string, string> {
  const key = String(numero);
  const next: Record<string, string> = {};
  for (const [existingKey, existingLetra] of Object.entries(respuestas)) {
    if (String(existingKey) === key) continue;
    if (!allowRepeat && letra && existingLetra === letra) continue;
    next[existingKey] = existingLetra;
  }
  if (letra) next[key] = letra;
  return next;
}
