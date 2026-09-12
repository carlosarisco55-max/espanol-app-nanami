export type SessionNumber = 1 | 2 | 3 | 4 | 5;
export type OpeningSource = "category_a" | "category_b";

export interface UnitFrontmatter {
  unidad_id: string;
  titulo: string;
  subtitulo?: string;
  cita?: string;
  bloque?: number;
  nivel_mcer_entrada?: string;
  nivel_mcer_salida?: string;
  duracion?: string;
  lexico_nucleo?: number;
  palabras_texto?: number;
  focos_contraste?: string[];
  huecos_personalizables?: string[];
  huecos_sabor?: string[];
  depende_de?: string[];
  tipo_especial?: string;
}

export interface CanDoItem {
  index: number;
  label: string;
  text: string;
}

export interface ContentRow {
  component: string;
  content: string;
}

export interface SessionOpening {
  sessionNumber: SessionNumber;
  source: OpeningSource;
  headline: string;
  cards?: string[];
}

export interface SessionOutlineStep {
  label: string;
  icon: string;
}

export interface AudioLine {
  speaker?: string;
  text: string;
  stageDirections: string[];
  segment?: string;
}

export interface AudioScript {
  id: string;
  title: string;
  tipoAudio?: string;
  level?: string;
  duration?: string;
  speakers?: string;
  speed?: string;
  productionNote?: string;
  lines: AudioLine[];
}

export interface SessionData {
  number: SessionNumber;
  slug: `s${SessionNumber}`;
  title: string;
  titleShort: string;
  rawMarkdown: string;
  exerciseIds: string[];
  /** Ejercicios con contenido estructurado (Fase 2) — solo para los tipos que ya tienen
   * motor interactivo. Los demás siguen viviendo solo dentro de `rawMarkdown` (Fase 1). */
  exercises: import("./exercise-types").ExerciseBlock[];
  /** Audios canónicos de U1-U15, extraídos del markdown y reproducibles por Web Speech API. */
  audios: AudioScript[];
  opening: SessionOpening;
  outline: SessionOutlineStep[];
  /** Una sola frase de orientación, oculta tras un interruptor — no traduce el contenido,
   * solo reduce el miedo de "no sé por dónde va esto" al empezar. Estructurado por idioma
   * desde ahora (no como campo plano) para que añadir japonés más adelante sea llenar
   * `ja`, no rediseñar el esquema. */
  orientation?: {
    en?: string;
    ja?: string;
  };
  exam?: DeleExamSession;
}

export interface DeleExamSession {
  testNumber: 1 | 2 | 3 | 4;
  timeLabel: string;
  durationSeconds: number;
  preparationSeconds?: number;
  tasksLabel?: string;
  uninterrupted: true;
  audioMaxPlays?: number;
}

export interface ContinuityNotes {
  datoCuriosoEspana: string | null;
  elencoRecurrente: string | null;
}

export interface CurriculumUnit {
  unitId: string;
  title: string;
  subtitle?: string;
  quote?: string;
  block?: number;
  levelIn?: string;
  levelOut?: string;
  duration?: string;
  lexiconCore?: number;
  specialType?: string;
  focusCodes: string[];
  canDos: CanDoItem[];
  contents: ContentRow[];
  continuity: ContinuityNotes;
  sessions: SessionData[];
  stats: {
    exerciseCount: number;
  };
}

export interface ParseOptions {
  unitFilter?: string;
}

export interface CurriculumIndexEntry {
  unitId: string;
  title: string;
  sessionCount: number;
  exerciseCount: number;
}
