"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  dueJCards,
  dueUnitCards,
  reviewJCard,
  reviewUnitCard,
  type SrsJCard,
  type SrsState,
  type SrsUnitCard
} from "@/lib/srs-engine";
import { storage, type ExerciseProgress } from "@/lib/storage";
import styles from "./SpacedQueue.module.css";

export default function SpacedQueue() {
  const [state, setState] = useState<SrsState | null>(null);
  const [progress, setProgress] = useState<Record<string, ExerciseProgress>>({});

  useEffect(() => {
    void Promise.all([storage.getSrs(), storage.getAllProgress()]).then(([loadedSrs, records]) => {
      setState(loadedSrs);
      setProgress(Object.fromEntries(records.map((record) => [record.exerciseId, record])));
    });
  }, []);

  async function review(card: SrsJCard, correct: boolean) {
    if (!state) return;
    const next = reviewJCard(state, card.jCode, correct);
    await storage.saveSrs(next);
    setState(next);
  }

  async function reviewUnit(card: SrsUnitCard, correct: boolean) {
    if (!state) return;
    const next = reviewUnitCard(state, card.unitId, correct);
    await storage.saveSrs(next);
    setState(next);
  }

  if (!state) {
    return <p className={styles.empty}>Preparando tu repaso…</p>;
  }

  const due = dueJCards(state);
  const dueUnits = dueUnitCards(state);
  if (due.length === 0 && dueUnits.length === 0) {
    return (
      <div className={styles.emptyCard}>
        <h2>Nada pendiente hoy</h2>
        <p>Los puntos que necesiten práctica aparecerán aquí en su fecha de repaso.</p>
      </div>
    );
  }

  return (
    <div className={styles.queue}>
      {dueUnits.map((card) => (
        <article key={card.key} className={styles.card}>
          <p className={styles.code}>Repaso de unidad</p>
          <h2>{card.unitId}</h2>
          <p className={styles.source}>Recupera sus ideas y contrastes principales antes de continuar.</p>
          <div className={styles.actions}>
            <Link href={`/unidades/${card.unitId}`} className={styles.reviewLink}>
              Abrir la unidad
            </Link>
            <button type="button" className={styles.good} onClick={() => void reviewUnit(card, true)}>
              Repaso completado
            </button>
            <button type="button" className={styles.again} onClick={() => void reviewUnit(card, false)}>
              Recuérdamelo en 7 días
            </button>
          </div>
        </article>
      ))}
      {due.map((card) => {
        const source = progress[card.lastExerciseId];
        const href = source ? `/unidades/${source.unitId}/${source.sessionSlug}#${card.lastExerciseId}` : null;
        return (
          <article key={card.jCode} className={styles.card}>
            <p className={styles.code}>Contraste {card.jCode}</p>
            <h2>Vuelve al punto que te costó</h2>
            <p className={styles.source}>Origen: {card.lastExerciseId}</p>
            <div className={styles.actions}>
              {href && (
                <Link href={href} className={styles.reviewLink}>
                  Abrir el ejercicio
                </Link>
              )}
              <button type="button" className={styles.good} onClick={() => void review(card, true)}>
                Ya lo tengo
              </button>
              <button type="button" className={styles.again} onClick={() => void review(card, false)}>
                Recuérdamelo en 2 días
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
