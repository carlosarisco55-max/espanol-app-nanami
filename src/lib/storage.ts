import type { ExerciseStatus } from "./exercise-engine";
import type { Profile } from "./profile";
import { backupRound, sessionJustCompleted } from "./progress-logic";

const DB_NAME = "nanami";
const DB_VERSION = 1;
const PROGRESS_STORE = "progress";
const META_STORE = "meta";
const META_KEY = "backup";

export interface ExerciseProgress {
  exerciseId: string;
  unitId: string;
  sessionSlug: string;
  status: ExerciseStatus;
  intentos: number;
  answers: Record<string, string>;
  updatedAt: number;
}

export interface ProgressMeta {
  key: typeof META_KEY;
  completedSessions: string[];
  lastAcknowledgedRound: number;
}

export interface ProgressExport {
  version: 1;
  exportedAt: string;
  profile: Profile | null;
  progress: ExerciseProgress[];
  meta: Omit<ProgressMeta, "key">;
}

const emptyMeta = (): ProgressMeta => ({
  key: META_KEY,
  completedSessions: [],
  lastAcknowledgedRound: 0
});

export interface StorageAdapter {
  getProgress(exerciseId: string): Promise<ExerciseProgress | undefined>;
  getAllProgress(): Promise<ExerciseProgress[]>;
  saveProgress(record: ExerciseProgress): Promise<void>;
  getMeta(): Promise<ProgressMeta>;
  saveMeta(meta: ProgressMeta): Promise<void>;
  replaceAll(progress: ExerciseProgress[], meta: ProgressMeta): Promise<void>;
}

function idbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PROGRESS_STORE)) {
        db.createObjectStore(PROGRESS_STORE, { keyPath: "exerciseId" });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function reqAs<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const IndexedDBAdapter: StorageAdapter = {
  async getProgress(exerciseId) {
    if (!idbAvailable()) return undefined;
    const db = await openDb();
    try {
      const tx = db.transaction(PROGRESS_STORE, "readonly");
      return (await reqAs(tx.objectStore(PROGRESS_STORE).get(exerciseId))) as ExerciseProgress | undefined;
    } finally {
      db.close();
    }
  },

  async getAllProgress() {
    if (!idbAvailable()) return [];
    const db = await openDb();
    try {
      const tx = db.transaction(PROGRESS_STORE, "readonly");
      return ((await reqAs(tx.objectStore(PROGRESS_STORE).getAll())) as ExerciseProgress[]) ?? [];
    } finally {
      db.close();
    }
  },

  async saveProgress(record) {
    if (!idbAvailable()) return;
    const db = await openDb();
    try {
      const tx = db.transaction(PROGRESS_STORE, "readwrite");
      tx.objectStore(PROGRESS_STORE).put(record);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  },

  async getMeta() {
    if (!idbAvailable()) return emptyMeta();
    const db = await openDb();
    try {
      const tx = db.transaction(META_STORE, "readonly");
      const stored = (await reqAs(tx.objectStore(META_STORE).get(META_KEY))) as ProgressMeta | undefined;
      return stored ?? emptyMeta();
    } finally {
      db.close();
    }
  },

  async saveMeta(meta) {
    if (!idbAvailable()) return;
    const db = await openDb();
    try {
      const tx = db.transaction(META_STORE, "readwrite");
      tx.objectStore(META_STORE).put(meta);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  },

  async replaceAll(progress, meta) {
    if (!idbAvailable()) return;
    const db = await openDb();
    try {
      const tx = db.transaction([PROGRESS_STORE, META_STORE], "readwrite");
      tx.objectStore(PROGRESS_STORE).clear();
      tx.objectStore(META_STORE).clear();
      for (const record of progress) {
        tx.objectStore(PROGRESS_STORE).put(record);
      }
      tx.objectStore(META_STORE).put(meta);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  }
};

/** Único adapter de V1. V2 podría sustituir esto por un adapter remoto sin tocar la UI. */
export const storage: StorageAdapter = IndexedDBAdapter;

export async function markSessionCompletedIfNeeded(
  sessionKeyValue: string,
  interactiveIds: string[],
  statuses: Record<string, string>
): Promise<ProgressMeta> {
  const meta = await storage.getMeta();
  const alreadyCounted = meta.completedSessions.includes(sessionKeyValue);
  if (!sessionJustCompleted(interactiveIds, statuses, alreadyCounted)) {
    return meta;
  }
  const next: ProgressMeta = {
    ...meta,
    completedSessions: [...meta.completedSessions, sessionKeyValue]
  };
  await storage.saveMeta(next);
  return next;
}

export async function acknowledgeBackup(): Promise<ProgressMeta> {
  const meta = await storage.getMeta();
  const next: ProgressMeta = {
    ...meta,
    lastAcknowledgedRound: backupRound(meta.completedSessions.length)
  };
  await storage.saveMeta(next);
  return next;
}

export async function buildProgressExport(profile: Profile | null): Promise<ProgressExport> {
  const [progress, loadedMeta] = await Promise.all([storage.getAllProgress(), storage.getMeta()]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    progress,
    meta: {
      completedSessions: loadedMeta.completedSessions,
      lastAcknowledgedRound: loadedMeta.lastAcknowledgedRound
    }
  };
}

export function parseProgressExport(raw: unknown): {
  progress: ExerciseProgress[];
  meta: ProgressMeta;
  profile: Profile | null;
} {
  if (!raw || typeof raw !== "object") {
    throw new Error("El archivo no es una copia reconocible.");
  }
  const data = raw as Partial<ProgressExport>;
  if (data.version !== 1 || !Array.isArray(data.progress)) {
    throw new Error("Esta copia no es compatible con esta versión de la app.");
  }
  const metaFromFile = data.meta;
  const meta: ProgressMeta = {
    key: META_KEY,
    completedSessions: Array.isArray(metaFromFile?.completedSessions) ? metaFromFile.completedSessions : [],
    lastAcknowledgedRound: typeof metaFromFile?.lastAcknowledgedRound === "number" ? metaFromFile.lastAcknowledgedRound : 0
  };
  const profile = data.profile && typeof data.profile === "object" ? (data.profile as Profile) : null;
  return { progress: data.progress as ExerciseProgress[], meta, profile };
}
