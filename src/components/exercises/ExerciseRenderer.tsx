import type { ExerciseBlock } from "../../../tools/parse-curriculo/exercise-types";
import OpcionMultipleExercise from "./OpcionMultipleExercise";
import EmparejarExercise from "./EmparejarExercise";
import ClasificarExercise from "./ClasificarExercise";

export default function ExerciseRenderer({ block }: { block: ExerciseBlock }) {
  if (!block.content) return null;

  switch (block.content.kind) {
    case "opcion_multiple":
      return <OpcionMultipleExercise id={block.id} content={block.content} />;
    case "emparejar":
      return <EmparejarExercise id={block.id} content={block.content} />;
    case "clasificar":
      return <ClasificarExercise id={block.id} content={block.content} />;
    default:
      return null;
  }
}
