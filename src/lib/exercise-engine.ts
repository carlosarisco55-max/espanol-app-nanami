import { useReducer } from "react";

// La máquina de estados real de cualquier ejercicio autocorregible (decisión ya cerrada
// en docs/decisions/: useReducer + validadores puros, sin XState — el flujo es demasiado
// simple para justificar una librería de máquinas de estado):
//
// idle --SUBMIT(correcto)--> correcto (fin)
//     --SUBMIT(incorrecto)--> fallo_1 (muestra pista, espera otro intento)
// fallo_1 --SUBMIT(correcto)--> correcto (fin)
//         --SUBMIT(incorrecto)--> fallo_2 (muestra explicación, fin)

export type ExerciseStatus = "idle" | "fallo_1" | "correcto" | "fallo_2";

export interface ExerciseState {
  status: ExerciseStatus;
  intentos: number;
}

type ExerciseAction = { type: "SUBMIT"; correcto: boolean } | { type: "REINTENTAR" };

const initialState: ExerciseState = { status: "idle", intentos: 0 };

function exerciseReducer(state: ExerciseState, action: ExerciseAction): ExerciseState {
  switch (action.type) {
    case "SUBMIT": {
      if (action.correcto) {
        return { status: "correcto", intentos: state.intentos + 1 };
      }
      if (state.status === "idle") {
        return { status: "fallo_1", intentos: state.intentos + 1 };
      }
      return { status: "fallo_2", intentos: state.intentos + 1 };
    }
    case "REINTENTAR":
      return initialState;
    default:
      return state;
  }
}

export function useExerciseEngine() {
  const [state, dispatch] = useReducer(exerciseReducer, initialState);
  const submit = (correcto: boolean) => dispatch({ type: "SUBMIT", correcto });
  const reintentar = () => dispatch({ type: "REINTENTAR" });
  const bloqueado = state.status === "correcto" || state.status === "fallo_2";
  return { state, submit, reintentar, bloqueado };
}
