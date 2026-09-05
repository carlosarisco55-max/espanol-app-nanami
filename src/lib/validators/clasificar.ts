export function validarClasificar(
  asignadas: Record<string, string>,
  solucion: Record<string, string[]>
): boolean {
  for (const [columna, palabras] of Object.entries(solucion)) {
    if (!palabras.every((palabra) => asignadas[palabra] === columna)) {
      return false;
    }
  }
  return Object.keys(solucion).length > 0;
}
