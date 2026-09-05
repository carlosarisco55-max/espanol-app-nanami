"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { readProfile, greetingName, type Profile } from "@/lib/profile";
import type { CurriculumIndexEntry } from "../../../tools/parse-curriculo/types";
import BackupReminder from "@/components/BackupReminder";

const BLOCK_LABELS = [
  "Bloque 1 · Rampa y arranque de la narración",
  "Bloque 2 · Instalación del subjuntivo",
  "Bloque 3 · Todo el sistema modal y los compuestos",
  "Bloque 4 · Banda alta de B2"
];

export default function CaminoPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [index, setIndex] = useState<CurriculumIndexEntry[] | null>(null);

  useEffect(() => {
    setProfile(readProfile());
    fetch("/data/index.json")
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => setIndex([]));
  }, []);

  if (!index) return null;

  const blocks: CurriculumIndexEntry[][] = [[], [], [], []];
  index.forEach((entry, i) => blocks[Math.floor(i / 4)]?.push(entry));

  return (
    <main className={styles.page}>
      <BackupReminder />
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <p className={styles.eyebrow}>Tu camino</p>
          <Link href="/perfil" className={styles.perfilLink}>
            Copia de seguridad
          </Link>
        </div>
        <h1 className={styles.title}>
          {profile ? `Hola, ${greetingName(profile)}` : "Tu camino de español"}
        </h1>
        <p className={styles.subtitle}>
          16 unidades, de B1 a B2. Solo la primera está lista para jugarse — el resto se va
          abriendo a medida que el curso se construye.
        </p>
      </header>

      <div className={styles.blocks}>
        {blocks.map((block, blockIndex) => (
          <section key={blockIndex}>
            <h2 className={styles.blockLabel}>{BLOCK_LABELS[blockIndex]}</h2>
            <div className={styles.grid}>
              {block.map((unit, i) => {
                const globalIndex = blockIndex * 4 + i;
                const unlocked = globalIndex === 0;
                const cardBody = (
                  <>
                    <span className={styles.cardNumber}>{globalIndex + 1}</span>
                    <span className={styles.cardTitle}>{unit.title}</span>
                    <span className={styles.cardMeta}>
                      {unlocked ? (
                        <span className={styles.badge}>Lista</span>
                      ) : (
                        <span>🔒 Próximamente</span>
                      )}
                    </span>
                  </>
                );

                return unlocked ? (
                  <Link
                    key={unit.unitId}
                    href={`/unidades/${unit.unitId}`}
                    className={`${styles.card} ${styles.cardUnlocked}`}
                  >
                    {cardBody}
                  </Link>
                ) : (
                  <div key={unit.unitId} className={`${styles.card} ${styles.cardLocked}`}>
                    {cardBody}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
