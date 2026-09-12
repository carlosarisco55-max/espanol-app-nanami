"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { SessionData } from "../../../tools/parse-curriculo/types";
import PersonalizedMarkdown from "@/components/PersonalizedMarkdown";
import ExerciseRenderer from "@/components/exercises/ExerciseRenderer";
import { useSessionProgress } from "@/components/SessionProgressProvider";
import { speakAsSpeaker, speakLines } from "@/lib/tts";
import { splitSessionIntoSegments } from "@/lib/session-segments";
import {
  extractDeleAudioTasks,
  extractOralInterventions,
  hideDeleReview,
  parseReadingSupplementalTasks
} from "@/lib/dele-exam";
import { ExamModeProvider } from "./ExamModeContext";
import styles from "./DeleExamSession.module.css";

function formatClock(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function wordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export default function DeleExamSession({
  session,
  unitId,
  nextSession
}: {
  session: SessionData;
  unitId: string;
  nextSession?: { slug: string; number: number };
}) {
  const exam = session.exam;
  const progress = useSessionProgress();
  const examId = `B1-B2-U16-${session.slug}-exam`;
  const record = progress.getRecord(examId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!progress.ready || hydrated) return;
    setAnswers(record?.answers ?? {});
    setHydrated(true);
  }, [hydrated, progress.ready, record?.answers]);

  const startedAt = Number(answers.startedAt || 0);
  const finished = Boolean(answers.finishedAt);
  const totalSeconds = (exam?.preparationSeconds ?? 0) + (exam?.durationSeconds ?? 0);
  const elapsed = startedAt > 0 ? Math.floor((now - startedAt) / 1000) : 0;
  const remaining = Math.max(0, totalSeconds - elapsed);
  const inPreparation =
    Boolean(exam?.preparationSeconds) && elapsed < (exam?.preparationSeconds ?? 0);
  const phaseRemaining = inPreparation
    ? (exam?.preparationSeconds ?? 0) - elapsed
    : remaining;

  function save(next: Record<string, string>, terminal = false) {
    void progress.saveRecord(
      examId,
      { status: terminal ? "correcto" : "idle", intentos: terminal ? 1 : 0 },
      next
    );
  }

  function update(patch: Record<string, string>, terminal = false) {
    setAnswers((previous) => {
      const next = { ...previous, ...patch };
      save(next, terminal);
      return next;
    });
  }

  function finish() {
    if (finished) return;
    update({ finishedAt: String(Date.now()) }, true);
  }

  useEffect(() => {
    if (!startedAt || finished) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [finished, startedAt]);

  useEffect(() => {
    if (startedAt && !finished && remaining === 0) finish();
    // finish is deliberately driven only by the persisted clock reaching zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, remaining, startedAt]);

  const supplemental = useMemo(
    () => (session.number === 2 ? parseReadingSupplementalTasks(session.rawMarkdown) : []),
    [session.number, session.rawMarkdown]
  );
  const audios = useMemo(
    () => extractDeleAudioTasks(session.rawMarkdown, session.number),
    [session.number, session.rawMarkdown]
  );
  const oralPrompts = useMemo(
    () => (session.number === 5 ? extractOralInterventions(session.rawMarkdown) : []),
    [session.number, session.rawMarkdown]
  );

  if (!exam || !progress.ready || !hydrated) {
    return <div className={styles.loading} aria-busy="true">Preparando la prueba…</div>;
  }

  if (!startedAt) {
    return (
      <section className={styles.gate}>
        <p className={styles.eyebrow}>Simulacro DELE B2 · Prueba {exam.testNumber}</p>
        <h2>{session.titleShort}</h2>
        <dl className={styles.conditions}>
          <div><dt>Tiempo</dt><dd>{exam.timeLabel}</dd></div>
          {exam.tasksLabel && <div><dt>Tareas</dt><dd>{exam.tasksLabel}</dd></div>}
          {exam.audioMaxPlays && <div><dt>Audiciones</dt><dd>Máximo {exam.audioMaxPlays} veces</dd></div>}
        </dl>
        <p className={styles.warning}>
          La prueba se hace de una sentada. El temporizador no se puede pausar y continúa
          aunque cierres o recargues esta página.
        </p>
        <button
          type="button"
          className={styles.primary}
          onClick={() => update({ startedAt: String(Date.now()) })}
        >
          Empezar prueba
        </button>
      </section>
    );
  }

  const review = finished;
  const segments = splitSessionIntoSegments(
    session.rawMarkdown,
    session.exercises.filter((exercise) => exercise.id !== "B1-B2-U16-E14"),
    session.audios ?? []
  );

  return (
    <ExamModeProvider phase={review ? "review" : "running"}>
      <div className={`${styles.timerBar} ${review ? styles.timerDone : ""}`}>
        <div>
          <span className={styles.eyebrow}>
            {review ? "Prueba finalizada" : inPreparation ? "Preparación" : "Tiempo de prueba"}
          </span>
          <strong>{review ? "Corrección y autoevaluación" : formatClock(phaseRemaining)}</strong>
        </div>
        {!review && (
          <button type="button" className={styles.finish} onClick={finish}>
            Finalizar prueba
          </button>
        )}
      </div>

      {!review && audios.length > 0 && (
        <ExamAudioPanel
          tasks={audios}
          maxPlays={exam.audioMaxPlays ?? 2}
          answers={answers}
          update={update}
        />
      )}

      <article className={styles.content}>
        {segments.map((segment, index) => {
          if (segment.kind === "exercise") {
            return <ExerciseRenderer key={segment.block.id} block={segment.block} />;
          }
          if (segment.kind === "audio") return null;
          const markdown = review
            ? segment.text
            : hideDeleReview(segment.text, session.number);
          return markdown ? (
            <PersonalizedMarkdown key={index} content={markdown} unitId={unitId} />
          ) : null;
        })}
      </article>

      {session.number === 2 && supplemental.length > 0 && (
        <SupplementalAnswers
          tasks={supplemental}
          answers={answers}
          update={update}
          review={review}
        />
      )}
      {session.number === 4 && (
        <WrittenAnswerSheet answers={answers} update={update} review={review} />
      )}
      {session.number === 5 && (
        <OralAnswerSheet
          prompts={oralPrompts}
          answers={answers}
          update={update}
          review={review}
        />
      )}

      {review && (
        <>
          <p className={styles.reviewNotice}>
            La prueba está cerrada. Ya puedes comprobar las respuestas y consultar los
            modelos, estrategias y rúbricas del currículo.
          </p>
          <nav className={styles.reviewNav}>
            <Link href={`/unidades/${unitId}`}>Índice de la unidad</Link>
            {nextSession && (
              <Link href={`/unidades/${unitId}/${nextSession.slug}`}>
                Continuar a la prueba {nextSession.number - 1} →
              </Link>
            )}
            {!nextSession && <Link href="/cierre">Abrir mi cuaderno final →</Link>}
          </nav>
        </>
      )}
    </ExamModeProvider>
  );
}

function ExamAudioPanel({
  tasks,
  maxPlays,
  answers,
  update
}: {
  tasks: ReturnType<typeof extractDeleAudioTasks>;
  maxPlays: number;
  answers: Record<string, string>;
  update: (patch: Record<string, string>) => void;
}) {
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => () => stopRef.current?.(), []);

  return (
    <section className={styles.audioPanel}>
      <h2>Audiciones</h2>
      <p>Cada audición puede escucharse un máximo de {maxPlays} veces.</p>
      <div className={styles.audioActions}>
        {tasks.map((task) => {
          const key = `audio-${task.taskNumber}-plays`;
          const plays = Number(answers[key] ?? 0);
          return (
            <button
              key={task.taskNumber}
              type="button"
              className={styles.audioButton}
              disabled={plays >= maxPlays}
              onClick={() => {
                stopRef.current?.();
                update({ [key]: String(plays + 1) });
                stopRef.current = speakLines(task.lines, undefined, () => undefined, () => undefined);
              }}
            >
              Tarea {task.taskNumber} · escuchar ({plays}/{maxPlays})
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SupplementalAnswers({
  tasks,
  answers,
  update,
  review
}: {
  tasks: ReturnType<typeof parseReadingSupplementalTasks>;
  answers: Record<string, string>;
  update: (patch: Record<string, string>) => void;
  review: boolean;
}) {
  return (
    <section className={styles.answerSheet}>
      <h2>Hoja de respuestas · tareas sin ID propio</h2>
      {tasks.map((task) => {
        const score = task.items.filter(
          (item) => answers[`supp-${task.taskNumber}-${item.number}`] === item.answer
        ).length;
        return (
          <div key={task.taskNumber} className={styles.supplement}>
            <h3>{task.title}</h3>
            <div className={styles.choiceGrid}>
              {task.items.map((item) => {
                const key = `supp-${task.taskNumber}-${item.number}`;
                return (
                  <label key={item.number}>
                    <span>{item.number}</span>
                    <select
                      value={answers[key] ?? ""}
                      disabled={review}
                      onChange={(event) => update({ [key]: event.target.value })}
                    >
                      <option value="">—</option>
                      {item.options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    {review && (
                      <small>
                        {answers[key] === item.answer ? "✓" : `Respuesta: ${item.answer}`}
                      </small>
                    )}
                  </label>
                );
              })}
            </div>
            {review && <p className={styles.score}>{score}/{task.items.length} aciertos</p>}
          </div>
        );
      })}
    </section>
  );
}

function WrittenAnswerSheet({
  answers,
  update,
  review
}: {
  answers: Record<string, string>;
  update: (patch: Record<string, string>) => void;
  review: boolean;
}) {
  return (
    <section className={styles.answerSheet}>
      <h2>Hoja de respuestas</h2>
      {[1, 2].map((task) => {
        const key = `written-${task}`;
        return (
          <label key={task} className={styles.written}>
            <strong>Tarea {task}</strong>
            <textarea
              value={answers[key] ?? ""}
              readOnly={review}
              onChange={(event) => update({ [key]: event.target.value })}
              placeholder="Escribe aquí. El modelo y la rúbrica aparecen al finalizar."
            />
            <small>{wordCount(answers[key] ?? "")} palabras</small>
          </label>
        );
      })}
    </section>
  );
}

function OralAnswerSheet({
  prompts,
  answers,
  update,
  review
}: {
  prompts: ReturnType<typeof extractOralInterventions>;
  answers: Record<string, string>;
  update: (patch: Record<string, string>) => void;
  review: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function toggleRecording() {
    if (recording) {
      mediaRef.current?.stop();
      setRecording(false);
      update({ oralRecorded: "1" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      update({ oralRecorded: "unavailable" });
    }
  }

  return (
    <section className={styles.answerSheet}>
      <h2>Grabación e interlocutor</h2>
      {!review && (
        <button type="button" className={styles.primary} onClick={() => void toggleRecording()}>
          {recording ? "Parar grabación" : "Grabar prueba oral"}
        </button>
      )}
      {audioUrl && <audio controls src={audioUrl} />}
      {!review && prompts.map((group) => {
        const index = Number(answers[`oral-prompt-${group.taskNumber}`] ?? 0);
        const prompt = group.prompts[index];
        if (!prompt) return null;
        return (
          <div key={group.taskNumber} className={styles.interlocutor}>
            <span>Tarea {group.taskNumber} · interlocutor</span>
            <p>{prompt}</p>
            <div>
              <button type="button" onClick={() => speakAsSpeaker("Entrevistador", prompt)}>
                Escuchar
              </button>
              <button
                type="button"
                onClick={() => update({ [`oral-prompt-${group.taskNumber}`]: String(index + 1) })}
              >
                Siguiente intervención
              </button>
            </div>
          </div>
        );
      })}
      <label className={styles.written}>
        <strong>Notas breves</strong>
        <textarea
          value={answers.oralNotes ?? ""}
          readOnly={review}
          onChange={(event) => update({ oralNotes: event.target.value })}
        />
      </label>
    </section>
  );
}
