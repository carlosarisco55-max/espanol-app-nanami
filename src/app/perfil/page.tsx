"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { backupFilename } from "@/lib/progress-logic";
import { readProfile, saveProfile } from "@/lib/profile";
import { buildProgressExport, parseProgressExport, storage } from "@/lib/storage";
import BackupReminder from "@/components/BackupReminder";

export default function PerfilPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function exportCopy() {
    setError(null);
    const payload = await buildProgressExport(readProfile());
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = backupFilename();
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Copia descargada.");
  }

  async function onPickFile(file: File) {
    setError(null);
    setMessage(null);
    try {
      const parsed = parseProgressExport(JSON.parse(await file.text()));
      await storage.replaceAll(parsed.progress, parsed.meta, parsed.srs);
      if (parsed.profile) saveProfile(parsed.profile);
      setMessage("Copia restaurada en este navegador.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer el archivo.");
    }
  }

  return (
    <main className={styles.page}>
      <BackupReminder />
      <Link href="/camino" className={styles.back}>
        ← Volver al camino
      </Link>
      <p className={styles.eyebrow}>Tu copia</p>
      <h1 className={styles.title}>Progreso en este navegador</h1>
      <p className={styles.body}>
        El aprendizaje se guarda aquí, en este aparato. Exporta una copia de vez en cuando; si cambias de
        navegador, impórtala para seguir donde lo dejaste.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => void exportCopy()}>
          Descargar copia
        </button>
        <button type="button" className={styles.secondary} onClick={() => fileRef.current?.click()}>
          Importar copia
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onPickFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {message && <p className={styles.ok}>{message}</p>}
      {error && <p className={styles.err}>{error}</p>}
    </main>
  );
}
