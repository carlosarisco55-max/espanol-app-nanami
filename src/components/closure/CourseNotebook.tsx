"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readProfile, greetingName, type Profile } from "@/lib/profile";
import { closingQuoteFor, notebookStatus } from "@/lib/course-notebook";
import { storage, type ExerciseProgress } from "@/lib/storage";
import type { JCode, SrsState } from "@/lib/srs-engine";
import styles from "./CourseNotebook.module.css";

const J_LABELS: Record<JCode, string> = {
  J1: "Género",
  J2: "Concordancia de número",
  J3: "Artículo",
  J4: "Ser / estar / haber y verbos de cambio",
  J5: "Sistema de pasados",
  J6: "Subjuntivo",
  J7: "/r/ – /rr/ – /l/",
  J8: "Grupos consonánticos y sinalefa"
};

interface NotebookEntry {
  id: string;
  label: string;
  text: string;
}

function collectEntries(progress: ExerciseProgress[]): NotebookEntry[] {
  const entries: NotebookEntry[] = [];
  for (const record of progress.sort((a, b) => a.updatedAt - b.updatedAt)) {
    const candidates = [
      ["texto", "Producción escrita"],
      ["written-1", "Prueba escrita · Tarea 1"],
      ["written-2", "Prueba escrita · Tarea 2"],
      ["notas", "Notas para producción oral"],
      ["oralNotes", "Notas de la prueba oral"]
    ] as const;
    for (const [key, label] of candidates) {
      const text = record.answers[key]?.trim();
      if (text) entries.push({ id: `${record.exerciseId}-${key}`, label, text });
    }
  }
  return entries;
}

function jStatus(state: SrsState, code: JCode) {
  const card = state.jCards[code];
  if (!card) return "Sin fallos registrados";
  if (card.dueAt === null) return "Repaso completado";
  return card.dueAt <= Date.now() ? "Repaso pendiente" : "Repaso programado";
}

export default function CourseNotebook({
  fullQuote,
  shortQuote
}: {
  fullQuote: string;
  shortQuote: string;
}) {
  const [progress, setProgress] = useState<ExerciseProgress[]>([]);
  const [srs, setSrs] = useState<SrsState>({ jCards: {}, unitCards: {} });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProfile(readProfile());
    Promise.all([storage.getAllProgress(), storage.getSrs()])
      .then(([records, state]) => {
        setProgress(records);
        setSrs(state);
      })
      .finally(() => setReady(true));
  }, []);

  const entries = useMemo(() => collectEntries([...progress]), [progress]);
  const status = useMemo(() => notebookStatus(progress), [progress]);
  const quote = useMemo(
    () => closingQuoteFor(status, { full: fullQuote, short: shortQuote }),
    [fullQuote, shortQuote, status]
  );
  const firstText = progress.find((record) => record.exerciseId === "B1-B2-U01-E15")?.answers.texto;
  const lastText = progress.find((record) => record.exerciseId === "B1-B2-U16-s4-exam")?.answers["written-2"]
    ?? progress.find((record) => record.exerciseId === "B1-B2-U16-s4-exam")?.answers["written-1"];

  return (
    <main className={styles.page}>
      <nav className={styles.topNav}>
        <Link href="/camino">← Volver al camino</Link>
        <button type="button" onClick={() => window.print()}>Guardar como PDF</button>
      </nav>

      <header className={styles.hero}>
        <p className={styles.eyebrow}>Tu cuaderno final · B1 → B2</p>
        <h1>
          {!ready
            ? "Tu cuaderno"
            : !status.hasAnyWork
              ? "Todavía no hay un cuaderno que cerrar"
              : profile
                ? `El español de ${greetingName(profile)}`
                : "Mi español, al terminar el tramo"}
        </h1>
        {quote ? <blockquote>«{quote}»</blockquote> : null}
        {ready && !status.hasAnyWork ? (
          <p className={styles.emptyLead}>
            Esta página reúne el trabajo que ya hayas guardado en este navegador.
            Si aún no has hecho ninguna sesión, empieza por el camino.
          </p>
        ) : null}
      </header>

      {!ready ? (
        <p className={styles.loading}>Reuniendo tu trabajo…</p>
      ) : !status.hasAnyWork ? (
        <p className={styles.emptyLead}>
          <Link href="/camino">Ir al camino →</Link>
        </p>
      ) : (
        <>
          <section className={styles.section}>
            <h2>Del primer texto al simulacro</h2>
            <div className={styles.comparison}>
              <article>
                <span>Unidad 1 · primera tarea final</span>
                <p>{firstText || "Todavía no hay un texto guardado de la Unidad 1."}</p>
              </article>
              <article>
                <span>Unidad 16 · prueba escrita</span>
                <p>{lastText || "Todavía no hay una prueba escrita guardada."}</p>
              </article>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Evolución de los códigos J</h2>
            <div className={styles.jGrid}>
              {(Object.keys(J_LABELS) as JCode[]).map((code) => {
                const repetition = srs.jCards[code]?.repetition ?? 0;
                return (
                  <article key={code}>
                    <div><strong>{code}</strong><span>{J_LABELS[code]}</span></div>
                    <div
                      className={styles.track}
                      role="progressbar"
                      aria-label={`Progreso de ${code}: ${repetition} de 4 repasos`}
                      aria-valuemin={0}
                      aria-valuemax={4}
                      aria-valuenow={repetition}
                    >
                      <span style={{ width: `${Math.max(8, repetition * 25)}%` }} />
                    </div>
                    <small>{jStatus(srs, code)}</small>
                  </article>
                );
              })}
            </div>
          </section>

          <section className={styles.section}>
            <h2>Mis producciones guardadas</h2>
            {entries.length === 0 ? (
              <p>Aún no hay producciones guardadas en este navegador.</p>
            ) : (
              <div className={styles.entries}>
                {entries.map((entry) => (
                  <article key={entry.id}>
                    <span>{entry.label} · {entry.id.split("-").slice(0, 4).join("-")}</span>
                    <p>{entry.text}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
