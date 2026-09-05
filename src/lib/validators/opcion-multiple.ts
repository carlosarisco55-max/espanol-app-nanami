import { sameMap } from "./maps";

export function validarOpcionMultiple(respuestas: Record<string, string>, solucion: Record<string, string>): boolean {
  return sameMap(respuestas, solucion);
}
