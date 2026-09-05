"use client";

import { useEffect, useState } from "react";
import styles from "./BackupReminder.module.css";
import { backupFilename, shouldPromptBackup } from "@/lib/progress-logic";
import { readProfile } from "@/lib/profile";
import { acknowledgeBackup, buildProgressExport, storage, type ProgressMeta } from "@/lib/storage";
import { useOptionalSessionProgress } from "@/components/SessionProgressProvider";

export default function BackupReminder({
  due: dueFromParent,
  onDismiss
}: {
  due?: boolean;
  onDismiss?: () => Promise<void>;
}) {
  const sessionProgress = useOptionalSessionProgress();
  const due = dueFromParent ?? sessionProgress?.backupDue;
  const dismissFromParent = onDismiss ?? sessionProgress?.dismissBackup;

  const [meta, setMeta] = useState<ProgressMeta | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void storage.getMeta().then(setMeta);
  }, []);

  useEffect(() => {
    if (due !== undefined) {
      setOpen(due);
      return;
    }
    let cancelled = false;
    storage.getMeta().then((loaded) => {
      if (cancelled) return;
      setMeta(loaded);
      setOpen(shouldPromptBackup(loaded.completedSessions.length, loaded.lastAcknowledgedRound));
    });
    return () => {
      cancelled = true;
    };
  }, [due]);

  async function dismiss() {
    if (dismissFromParent) {
      await dismissFromParent();
    } else {
      await acknowledgeBackup();
    }
    const loaded = await storage.getMeta();
    setMeta(loaded);
    setOpen(false);
  }

  async function downloadCopy() {
    const payload = await buildProgressExport(readProfile());
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = backupFilename();
    a.click();
    URL.revokeObjectURL(url);
    await dismiss();
  }

  if (!open) return null;

  const count = meta?.completedSessions.length;

  return (
    <div className={styles.scrim} role="dialog" aria-modal="true" aria-labelledby="backup-title">
      <div className={styles.card}>
        <p className={styles.eyebrow}>Copia de seguridad</p>
        <h2 id="backup-title" className={styles.title}>
          Guarda tu progreso en un archivo
        </h2>
        <p className={styles.body}>
          Todo vive en este navegador. Si lo limpias o cambias de aparato, el camino se pierde.
          {typeof count === "number" ? ` Llevas ${count} sesiones hechas.` : null} Baja una copia ahora — tarda un
          segundo.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => void downloadCopy()}>
            Descargar copia
          </button>
          <button type="button" className={styles.secondary} onClick={() => void dismiss()}>
            Ya tengo copia
          </button>
        </div>
      </div>
    </div>
  );
}
