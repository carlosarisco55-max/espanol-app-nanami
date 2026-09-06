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
import { useOptionalSessionProgress } from "@/components/SessionProgressProvider";
import styles from "./exercises.module.css";

export default function ExerciseRenderer({ block }: { block: ExerciseBlock }) {
  const progress = useOptionalSessionProgress();
  if (!block.content) return null;
  if (progress && !progress.ready) {
    return <div className={styles.card} aria-busy="true" />;
  }

  switch (block.content.kind) {
    case "opcion_multiple":
      return <OpcionMultipleExercise id={block.id} content={block.content} />;
    case "emparejar":
      return <EmparejarExercise id={block.id} content={block.content} />;
    case "clasificar":
      return <ClasificarExercise id={block.id} content={block.content} />;
    case "huecos":
      return <HuecosExercise id={block.id} content={block.content} />;
    case "verdadero_falso":
      return <VerdaderoFalsoExercise id={block.id} content={block.content} />;
    case "respuesta_corta":
    case "transformar":
    case "corregir_error":
    case "dictado":
      return <TextAnswerExercise id={block.id} content={block.content} />;
    case "reordenar":
      return <ReordenarExercise id={block.id} content={block.content} />;
    case "discriminacion_fonetica":
      return <DiscriminacionFoneticaExercise id={block.id} content={block.content} />;
    default:
      return null;
  }
}
