export type JCode = "J1" | "J2" | "J3" | "J4" | "J5" | "J6" | "J7" | "J8";

export interface ExerciseFeedback {
  pista?: string;
  explicacion?: string;
  porQue?: string;
}

export interface EmparejarContent extends ExerciseFeedback {
  kind: "emparejar";
  enunciado: string;
  izquierda: { numero: string; texto: string }[];
  derecha: { letra: string; texto: string }[];
  solucion: Record<string, string>;
}

export interface OpcionMultipleItem {
  numero: string;
  enunciado: string;
  opciones: { letra: string; texto: string }[];
}

export interface OpcionMultipleContent extends ExerciseFeedback {
  kind: "opcion_multiple";
  layout: "items" | "tabla";
  enunciado: string;
  items: OpcionMultipleItem[];
  solucion: Record<string, string>;
}

export interface ClasificarContent extends ExerciseFeedback {
  kind: "clasificar";
  layout: "banco" | "items";
  enunciado: string;
  banco: string[];
  columnas: string[];
  solucion: Record<string, string[]>;
  items?: { numero: string; texto: string }[];
}

export interface HuecosItem {
  numero: string;
  texto?: string;
  huecos: number;
  respuesta: string;
  respuestasPorHueco?: string[];
  alternativas: string[];
}

export interface HuecosContent extends ExerciseFeedback {
  kind: "huecos";
  layout: "lista" | "texto";
  enunciado: string;
  texto?: string;
  items: HuecosItem[];
}

export interface VerdaderoFalsoItem {
  numero: string;
  afirmacion: string;
  respuesta: "V" | "F";
  justificacion?: string;
}

export interface VerdaderoFalsoContent extends ExerciseFeedback {
  kind: "verdadero_falso";
  enunciado: string;
  items: VerdaderoFalsoItem[];
}

export interface RespuestaCortaItem {
  numero: string;
  pregunta: string;
  respuesta: string;
  alternativas: string[];
}

export interface RespuestaCortaContent extends ExerciseFeedback {
  kind: "respuesta_corta";
  enunciado: string;
  items: RespuestaCortaItem[];
}

export interface TransformarItem {
  numero: string;
  origen: string;
  arranque?: string;
  nota?: string;
  respuesta: string;
  alternativas: string[];
}

export interface TransformarContent extends ExerciseFeedback {
  kind: "transformar";
  enunciado: string;
  items: TransformarItem[];
}

export interface CorregirErrorItem {
  numero: string;
  frase: string;
  correccion: string;
  alternativas: string[];
}

export interface CorregirErrorContent extends ExerciseFeedback {
  kind: "corregir_error";
  enunciado: string;
  items: CorregirErrorItem[];
}

export interface ReordenarItem {
  numero: string;
  fragmentos: string[];
  respuesta: string;
  alternativas: string[];
  nota?: string;
}

export interface ReordenarContent extends ExerciseFeedback {
  kind: "reordenar";
  enunciado: string;
  items: ReordenarItem[];
}

export interface DiscriminacionFoneticaItem {
  numero: string;
  estimulo?: string;
  opciones: { letra: string; texto: string }[];
  respuesta: string | null;
  nota?: string;
}

export interface DiscriminacionFoneticaContent extends ExerciseFeedback {
  kind: "discriminacion_fonetica";
  enunciado: string;
  columnas: { letra: string; etiqueta: string }[];
  items: DiscriminacionFoneticaItem[];
}

export interface DictadoContent extends ExerciseFeedback {
  kind: "dictado";
  enunciado: string;
  items: { numero: string; frase: string }[];
}

export type ExerciseContent =
  | EmparejarContent
  | OpcionMultipleContent
  | ClasificarContent
  | HuecosContent
  | VerdaderoFalsoContent
  | RespuestaCortaContent
  | TransformarContent
  | CorregirErrorContent
  | ReordenarContent
  | DiscriminacionFoneticaContent
  | DictadoContent;

export interface ExerciseBlock {
  id: string;
  tipo: string;
  raw: string;
  content: ExerciseContent | null;
  title?: string;
  foco?: string;
  jCodes: JCode[];
  autocorregible: boolean | null;
  sinSoporte?: string;
}
