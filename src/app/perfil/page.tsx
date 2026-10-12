"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { backupFilename } from "@/lib/progress-logic";
import {
  formatBackupDate,
  markBackupExported,
  readLastBackupAt,
  readProfile,
  saveProfile,
  type NivelMcer,
  type Profile
} from "@/lib/profile";
import { buildProgressExport, parseProgressExport, storage } from "@/lib/storage";
import BackupReminder from "@/components/BackupReminder";

const NIVELES: NivelMcer[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function PerfilPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState<NivelMcer>("B1");
  const [profesion, setProfesion] = useState("");
  const [gustos, setGustos] = useState("");

  useEffect(() => {
    const existing = readProfile();
    setProfile(existing);
    setLastBackup(readLastBackupAt());
    if (!existing) return;
    setNombre(existing.nombre);
    setNivel(existing.nivel);
    setProfesion(existing.profesion);
    setGustos(existing.gustos);
  }, []);

  function saveEdits(event: React.FormEvent) {
    event.preventDefault();
    const next: Profile = {
      nombre: nombre.trim(),
      nivel,
      profesion: profesion.trim(),
      gustos: gustos.trim()
    };
    saveProfile(next);
    setProfile(next);
    setMessage("Perfil actualizado.");
    setError(null);
  }

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
    markBackupExported();
    setLastBackup(readLastBackupAt());
    setMessage("Copia descargada.");
  }

  async function onPickFile(file: File) {
    setError(null);
    setMessage(null);
    if (!window.confirm("Importar esta copia sustituye el progreso guardado en este navegador. ¿Quieres continuar?")) {
      return;
    }
    try {
      const parsed = parseProgressExport(JSON.parse(await file.text()));
      await storage.replaceAll(parsed.progress, parsed.meta, parsed.srs);
      if (parsed.profile) {
        saveProfile(parsed.profile);
        setProfile(parsed.profile);
        setNombre(parsed.profile.nombre);
        setNivel(parsed.profile.nivel);
        setProfesion(parsed.profile.profesion);
        setGustos(parsed.profile.gustos);
      }
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
      {lastBackup ? (
        <p className={styles.meta}>Última copia descargada: {formatBackupDate(lastBackup)}</p>
      ) : (
        <p className={styles.meta}>Todavía no hay una copia descargada en este navegador.</p>
      )}

      {profile && (
        <form className={styles.form} onSubmit={saveEdits}>
          <h2 className={styles.subhead}>Tus datos</h2>
          <label className={styles.field}>
            <span>Nombre</span>
            <input value={nombre} onChange={(event) => setNombre(event.target.value)} required />
          </label>
          <label className={styles.field}>
            <span>Nivel</span>
            <select value={nivel} onChange={(event) => setNivel(event.target.value as NivelMcer)}>
              {NIVELES.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Profesión</span>
            <input value={profesion} onChange={(event) => setProfesion(event.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Gustos</span>
            <input value={gustos} onChange={(event) => setGustos(event.target.value)} />
          </label>
          <button type="submit" className={styles.secondary}>
            Guardar datos
          </button>
        </form>
      )}

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
      {message && <p className={styles.ok} role="status">{message}</p>}
      {error && <p className={styles.err} role="alert">{error}</p>}
    </main>
  );
}
