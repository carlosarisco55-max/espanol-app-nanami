// Contenido estructurado de un ejercicio, extraído del bloque markdown del propio
// ejercicio. Solo se soportan los tipos que ya tienen motor interactivo (Fase 2);
// el resto se queda en `null` y se sigue mostrando como lectura (Fase 1) hasta que
// les toque su turno — el motor de ejercicios nunca deja de renderizar por un tipo
// todavía no soportado.

export interface EmparejarContent {
  kind: "emparejar";
  enunciado: string;
  izquierda: { numero: string; texto: string }[];
  derecha: { letra: string; texto: string }[];
  solucion: Record<string, string>; // numero -> letra
  pista?: string;
  explicacion?: string;
}

export interface OpcionMultipleItem {
  numero: string;
  enunciado: string;
  opciones: { letra: string; texto: string }[];
}

export interface OpcionMultipleContent {
  kind: "opcion_multiple";
  enunciado: string;
  items: OpcionMultipleItem[];
  solucion: Record<string, string>; // numero -> letra
  pista?: string;
  explicacion?: string;
}

export interface ClasificarContent {
  kind: "clasificar";
  enunciado: string;
  banco: string[];
  columnas: string[];
  solucion: Record<string, string[]>; // nombre de columna -> palabras
  pista?: string;
  explicacion?: string;
}

export type ExerciseContent = EmparejarContent | OpcionMultipleContent | ClasificarContent;

export interface ExerciseBlock {
  id: string;
  tipo: string;
  raw: string;
  content: ExerciseContent | null;
}
