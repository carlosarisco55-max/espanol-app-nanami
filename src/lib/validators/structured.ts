import type {
  CorregirErrorItem,
  DictadoContent,
  DiscriminacionFoneticaItem,
  HuecosItem,
  ReordenarItem,
  RespuestaCortaItem,
  TransformarItem,
  VerdaderoFalsoItem
} from "../../../tools/parse-curriculo/exercise-types";
import { matchesAcceptedAnswer } from "./text";

export type TextAnswers = Record<string, string>;

export function validarHuecos(answers: TextAnswers, items: HuecosItem[]): boolean {
  return items.every((item) => {
    const expected = item.respuestasPorHueco ?? [item.respuesta];
    return expected.every((answer, index) =>
      matchesAcceptedAnswer(answers[`${item.numero}:${index}`] ?? "", answer, item.alternativas)
    );
  });
}

export function validarVerdaderoFalso(answers: TextAnswers, items: VerdaderoFalsoItem[]): boolean {
  return items.every((item) => answers[item.numero] === item.respuesta);
}

function validarRespuestasDeTexto(
  answers: TextAnswers,
  items: Array<{ numero: string; respuesta: string; alternativas: string[] }>
): boolean {
  return items.every((item) =>
    matchesAcceptedAnswer(answers[item.numero] ?? "", item.respuesta, item.alternativas)
  );
}

export function validarRespuestaCorta(answers: TextAnswers, items: RespuestaCortaItem[]): boolean {
  return validarRespuestasDeTexto(answers, items);
}

export function validarTransformar(answers: TextAnswers, items: TransformarItem[]): boolean {
  return validarRespuestasDeTexto(answers, items);
}

export function validarCorregirError(answers: TextAnswers, items: CorregirErrorItem[]): boolean {
  return items.every((item) =>
    matchesAcceptedAnswer(answers[item.numero] ?? "", item.correccion, item.alternativas)
  );
}

export function validarReordenar(answers: TextAnswers, items: ReordenarItem[]): boolean {
  return validarRespuestasDeTexto(answers, items);
}

export function validarDiscriminacion(
  answers: TextAnswers,
  items: DiscriminacionFoneticaItem[]
): boolean {
  return items.every((item) =>
    answers[item.numero] === (item.respuesta ?? "__sin_contraste__")
  );
}

export function validarDictado(answers: TextAnswers, items: DictadoContent["items"]): boolean {
  return items.every((item) => matchesAcceptedAnswer(answers[item.numero] ?? "", item.frase));
}
