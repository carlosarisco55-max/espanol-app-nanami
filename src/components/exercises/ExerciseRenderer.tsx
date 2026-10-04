"use client";

import type { ExerciseBlock } from "../../../tools/parse-curriculo/exercise-types";
import OpcionMultipleExercise from "./OpcionMultipleExercise";
import EmparejarExercise from "./EmparejarExercise";
import ClasificarExercise from "./ClasificarExercise";
import DiscriminacionFoneticaExercise from "./DiscriminacionFoneticaExercise";
import HuecosExercise from "./HuecosExercise";
import ReordenarExercise from "./ReordenarExercise";
import TextAnswerExercise from "./TextAnswerExercise";
import VerdaderoFalsoExercise from "./VerdaderoFalsoExercise";
import ProduccionEscritaExercise from "./ProduccionEscritaExercise";
import ProduccionOralExercise from "./ProduccionOralExercise";
import AutoevaluacionExercise from "./AutoevaluacionExercise";
import RoleplayExercise from "@/components/roleplay/RoleplayExercise";
import { useOptionalSessionProgress } from "@/components/SessionProgressProvider";
import { ExerciseI18nProvider } from "./ExerciseI18nContext";
import styles from "./exercises.module.css";

export default function ExerciseRenderer({ block }: { block: ExerciseBlock }) {
  const progress = useOptionalSessionProgress();
  if (!block.content) return null;
  if (progress && !progress.ready) {
    return <div className={styles.card} aria-busy="true" />;
  }

  const inner = renderExercise(block);
  return (
    <ExerciseI18nProvider
      pistaEn={block.pistaEn ?? block.content.pistaEn}
      explicacionEn={block.explicacionEn ?? block.content.explicacionEn}
    >
      {inner}
    </ExerciseI18nProvider>
  );
}

function renderExercise(block: ExerciseBlock) {
  if (!block.content) return null;
  switch (block.content.kind) {
    case "opcion_multiple":
      return <OpcionMultipleExercise id={block.id} content={block.content} jCodes={block.jCodes} />;
    case "emparejar":
      return <EmparejarExercise id={block.id} content={block.content} jCodes={block.jCodes} />;
    case "clasificar":
      return <ClasificarExercise id={block.id} content={block.content} jCodes={block.jCodes} />;
    case "huecos":
      return <HuecosExercise id={block.id} content={block.content} jCodes={block.jCodes} />;
    case "verdadero_falso":
      return <VerdaderoFalsoExercise id={block.id} content={block.content} jCodes={block.jCodes} />;
    case "respuesta_corta":
    case "transformar":
    case "corregir_error":
    case "dictado":
      return <TextAnswerExercise id={block.id} content={block.content} jCodes={block.jCodes} />;
    case "reordenar":
      return <ReordenarExercise id={block.id} content={block.content} jCodes={block.jCodes} />;
    case "discriminacion_fonetica":
      return <DiscriminacionFoneticaExercise id={block.id} content={block.content} jCodes={block.jCodes} />;
    case "roleplay":
      return <RoleplayExercise id={block.id} content={block.content} jCodes={block.jCodes} />;
    case "produccion_escrita":
      return <ProduccionEscritaExercise id={block.id} content={block.content} jCodes={block.jCodes} />;
    case "produccion_oral":
      return <ProduccionOralExercise id={block.id} content={block.content} jCodes={block.jCodes} />;
    case "autoevaluacion":
      return <AutoevaluacionExercise id={block.id} content={block.content} jCodes={block.jCodes} />;
    default:
      return null;
  }
}
