// Perfil de onboarding (nombre, nivel, profesión, gustos). Vive en localStorage —
// es un dato ligero, distinto del progreso de aprendizaje (IndexedDB en lib/storage.ts).
// Sin backend obligatorio en V1.

export type NivelMcer = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface Profile {
  nombre: string;
  nivel: NivelMcer;
  profesion: string;
  gustos: string;
}

const STORAGE_KEY = "nanami:profile";

export function readProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

const LAST_BACKUP_KEY = "nanami:lastBackupAt";

export function markBackupExported(date = new Date()): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_BACKUP_KEY, date.toISOString());
}

export function readLastBackupAt(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_BACKUP_KEY);
}

export function formatBackupDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// Reglas de personalización (CLAUDE.md § Modelo de contenido): estos valores solo
// alimentan saludos y huecos explícitos (🎯 / 🌿), nunca la lógica de corrección.
export function greetingName(profile: Profile | null): string {
  return profile?.nombre?.trim() || "tú";
}
