import { hasUniqueValues, sameMap } from "./maps";

export function validarEmparejar(respuestas: Record<string, string>, solucion: Record<string, string>): boolean {
  if (!hasUniqueValues(respuestas)) return false;
  return sameMap(respuestas, solucion);
}
