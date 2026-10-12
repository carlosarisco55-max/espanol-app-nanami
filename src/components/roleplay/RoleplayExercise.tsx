"use client";

import { useEffect, useMemo, useState } from "react";
import type { JCode, RoleplayContent, RoleplayScene } from "../../../tools/parse-curriculo/exercise-types";
import ExerciseShell from "@/components/exercises/ExerciseShell";
import RubricSelfEval from "@/components/exercises/RubricSelfEval";
import { usePersistedAnswers } from "@/lib/use-persisted-answers";
import { speakAsSpeaker } from "@/lib/tts";
import styles from "@/components/exercises/exercises.module.css";
import prod from "@/components/exercises/production.module.css";

function sceneTurns(scene: RoleplayScene) {
  const cards = scene.tarjetasApp?.length ? scene.tarjetasApp : [{ hablante: scene.hablanteB, turnos: scene.turnosB }];
  return cards.flatMap((card) => card.turnos.map((text) => ({ speaker: card.hablante, text })));
}

export default function RoleplayExercise({
  id,
  content,
  jCodes = []
}: {
  id: string;
  content: RoleplayContent;
  jCodes?: JCode[];
}) {
  const { respuestas, setRespuestas, initialState, persist } = usePersistedAnswers(id, jCodes);
  const [sceneIndex, setSceneIndex] = useState(Number(respuestas.scene ?? 0));
  const [turnIndex, setTurnIndex] = useState(Number(respuestas.turn ?? 0));
  const started = respuestas.started === "1";
  const done = respuestas.done === "1";
  const scenesDone = respuestas.scenesDone === "1";
  const [guionVisible, setGuionVisible] = useState(!started && content.guion.length > 0);
  const [keepGuideVisible, setKeepGuideVisible] = useState(false);
  const scene = content.escenas[sceneIndex] ?? content.escenas[0];
  const turns = useMemo(() => (scene ? sceneTurns(scene) : []), [scene]);
  const current = turns[turnIndex] ?? turns[0];

  useEffect(() => {
    if (!guionVisible || keepGuideVisible || started || !content.guionSegundos) return;
    const timer = window.setTimeout(() => setGuionVisible(false), content.guionSegundos * 1000);
    return () => window.clearTimeout(timer);
  }, [content.guionSegundos, guionVisible, keepGuideVisible, started]);

  function rubricValues() {
    return Object.fromEntries(
      content.rubrica.map((_, index) => [String(index), respuestas[`r${index}`] ?? ""])
    );
  }

  function save(next: Record<string, string>, terminal = false) {
    persist({ status: terminal ? "correcto" : "idle", intentos: terminal ? 1 : 0 }, next);
  }

  function markDone(patch: Record<string, string>) {
    let next: Record<string, string> = respuestas;
    setRespuestas((prev) => {
      next = { ...prev, ...patch };
      const filled = content.rubrica.length === 0 || content.rubrica.every((_, index) => next[`r${index}`]);
      if (filled) next.done = "1";
      return next;
    });
    const filled = content.rubrica.length === 0 || content.rubrica.every((_, index) => next[`r${index}`]);
    save(next, filled);
  }

  function speakCurrent(turn = current) {
    if (!turn) return;
    speakAsSpeaker(turn.speaker, turn.text);
  }

  function persistPlay(nextScene: number, nextTurn: number, extra: Record<string, string> = {}) {
    let next: Record<string, string> = respuestas;
    setRespuestas((prev) => {
      next = {
        ...prev,
        ...extra,
        scene: String(nextScene),
        turn: String(nextTurn)
      };
      return next;
    });
    save(next);
  }

  return (
    <ExerciseShell id={id} enunciado={content.enunciado} initialState={initialState} feedback="none">
      {() => (
        <>
          {content.duracion && <p className={prod.meta}>Duración: {content.duracion}</p>}
          {scene.titulo && <h3 className={prod.meta}>{scene.titulo}</h3>}

          <div className={prod.studentCard}>
            <p className={prod.meta}>Tu tarjeta</p>
            <p className={prod.cardText}>{scene.tarjetaA}</p>
          </div>
          <p className={prod.hiddenNote}>
            La otra tarjeta se queda con la app. Tú no la ves: por eso hay que negociar.
          </p>

          {guionVisible && content.guion.length > 0 && (
            <div>
              <p className={prod.meta}>
                Guion de apoyo
                {content.guionSegundos ? ` (desaparece a los ${content.guionSegundos} s)` : ""}
              </p>
              <ol className={prod.requirements}>
                {content.guion.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <div className={prod.actions}>
                <button type="button" className={styles.checkBtn} onClick={() => setGuionVisible(false)}>
                  Ya lo tengo
                </button>
                {content.guionSegundos && (
                  <button
                    type="button"
                    className={styles.checkBtn}
                    aria-pressed={keepGuideVisible}
                    onClick={() => setKeepGuideVisible((value) => !value)}
                  >
                    {keepGuideVisible ? "Ocultado automático desactivado" : "Mantener guion visible"}
                  </button>
                )}
              </div>
            </div>
          )}

          {!started ? (
            <div className={prod.actions}>
              <button
                type="button"
                className={styles.checkBtn}
                onClick={() => {
                  setGuionVisible(false);
                  persistPlay(0, 0, { started: "1" });
                  const first = sceneTurns(content.escenas[0] ?? scene)[0];
                  if (first) speakAsSpeaker(first.speaker, first.text);
                }}
              >
                Empezar
              </button>
            </div>
          ) : !scenesDone ? (
            <div>
              <div className={prod.beat} role="status" aria-atomic="true">
                <p className={prod.meta}>
                  {current?.speaker ?? "Interlocutor"} · turno {Math.min(turnIndex + 1, turns.length)} de {turns.length}
                </p>
                <p className={prod.cardText}>{current?.text}</p>
              </div>
              <div className={prod.actions}>
                <button type="button" className={styles.checkBtn} onClick={() => speakCurrent()}>
                  Escuchar este turno
                </button>
                {turnIndex < turns.length - 1 && (
                  <button
                    type="button"
                    className={styles.checkBtn}
                    onClick={() => {
                      const nextTurn = turnIndex + 1;
                      setTurnIndex(nextTurn);
                      persistPlay(sceneIndex, nextTurn);
                      speakAsSpeaker(turns[nextTurn].speaker, turns[nextTurn].text);
                    }}
                  >
                    Siguiente turno
                  </button>
                )}
                {turnIndex === turns.length - 1 && sceneIndex < content.escenas.length - 1 && (
                  <button
                    type="button"
                    className={styles.checkBtn}
                    onClick={() => {
                      const nextScene = sceneIndex + 1;
                      setSceneIndex(nextScene);
                      setTurnIndex(0);
                      persistPlay(nextScene, 0);
                      const first = sceneTurns(content.escenas[nextScene])[0];
                      if (first) speakAsSpeaker(first.speaker, first.text);
                    }}
                  >
                    Siguiente escena
                  </button>
                )}
                {turnIndex === turns.length - 1 && sceneIndex === content.escenas.length - 1 && (
                  <button
                    type="button"
                    className={styles.checkBtn}
                    onClick={() => {
                      let next: Record<string, string> = respuestas;
                      setRespuestas((prev) => {
                        next = { ...prev, scenesDone: "1" };
                        return next;
                      });
                      save(next);
                    }}
                  >
                    Terminar e ir a la rúbrica
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {content.rubrica.length > 0 ? (
                <>
                  <p className={styles.enunciado}>Autoevaluación</p>
                  <RubricSelfEval
                    criteria={content.rubrica}
                    values={rubricValues()}
                    disabled={done}
                    onChange={(index, value) => {
                      markDone({ [`r${index}`]: value });
                    }}
                  />
                </>
              ) : (
                !done && (
                  <button type="button" className={styles.checkBtn} onClick={() => markDone({})}>
                    He terminado
                  </button>
                )
              )}
            </>
          )}

          {done && (
            <p className={prod.saved} role="status">
              Guardado. Tú marcas la rúbrica; no hay corrección automática.
            </p>
          )}
          {(scenesDone || done) && (
            <div className={prod.modelo}>
              <p className={prod.meta}>Transcripción del interlocutor</p>
              {content.escenas.map((item, scenePos) => (
                <div key={`${item.titulo ?? "escena"}-${scenePos}`}>
                  {item.titulo && <p className={prod.meta}>{item.titulo}</p>}
                  {sceneTurns(item).map((turn, turnPos) => (
                    <p key={`${scenePos}-${turnPos}`} className={prod.cardText}>
                      <strong>{turn.speaker}:</strong> {turn.text}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
          {done && (
            <div className={prod.modelo}>
              <p className={prod.meta}>Tarjeta que no veías</p>
              {content.escenas.map((item, index) => (
                <div key={`${item.tarjetaB}-${index}`}>
                  {item.titulo && <p className={prod.meta}>{item.titulo}</p>}
                  {item.tarjetasApp.map((card) => (
                    <p key={`${card.etiqueta}-${card.hablante}`} className={prod.cardText}>
                      {card.texto}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </ExerciseShell>
  );
}
