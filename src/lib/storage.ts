import type { ExerciseStatus } from "./exercise-engine";
import type { Profile } from "./profile";
import { backupRound, sessionJustCompleted } from "./progress-logic";
import { emptySrsState, normalizeSrsState, type SrsState } from "./srs-engine";

const DB_NAME = "nanami";
const DB_VERSION = 2;
const PROGRESS_STORE = "progress";
const META_STORE = "meta";
const SRS_STORE = "srs";
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
  version: 2;
  exportedAt: string;
  profile: Profile | null;
  progress: ExerciseProgress[];
  meta: Omit<ProgressMeta, "key">;
  srs: SrsState;
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
  getSrs(): Promise<SrsState>;
  saveSrs(state: SrsState): Promise<void>;
  replaceAll(progress: ExerciseProgress[], meta: ProgressMeta, srs?: SrsState): Promise<void>;
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
      if (!db.objectStoreNames.contains(SRS_STORE)) {
        db.createObjectStore(SRS_STORE);
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

  async getSrs() {
    if (!idbAvailable()) return emptySrsState();
    const db = await openDb();
    try {
      const tx = db.transaction(SRS_STORE, "readonly");
      const stored = (await reqAs(tx.objectStore(SRS_STORE).get("state"))) as Partial<SrsState> | undefined;
      return normalizeSrsState(stored);
    } finally {
      db.close();
    }
  },

  async saveSrs(state) {
    if (!idbAvailable()) return;
    const db = await openDb();
    try {
      const tx = db.transaction(SRS_STORE, "readwrite");
      tx.objectStore(SRS_STORE).put(state, "state");
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  },

  async replaceAll(progress, meta, srs = emptySrsState()) {
    if (!idbAvailable()) return;
    const db = await openDb();
    try {
      const tx = db.transaction([PROGRESS_STORE, META_STORE, SRS_STORE], "readwrite");
      tx.objectStore(PROGRESS_STORE).clear();
      tx.objectStore(META_STORE).clear();
      tx.objectStore(SRS_STORE).clear();
      for (const record of progress) {
        tx.objectStore(PROGRESS_STORE).put(record);
      }
      tx.objectStore(META_STORE).put(meta);
      tx.objectStore(SRS_STORE).put(srs, "state");
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
  const [progress, loadedMeta, srs] = await Promise.all([
    storage.getAllProgress(),
    storage.getMeta(),
    storage.getSrs()
  ]);
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    profile,
    progress,
    meta: {
      completedSessions: loadedMeta.completedSessions,
      lastAcknowledgedRound: loadedMeta.lastAcknowledgedRound
    },
    srs
  };
}

export function parseProgressExport(raw: unknown): {
  progress: ExerciseProgress[];
  meta: ProgressMeta;
  profile: Profile | null;
  srs: SrsState;
} {
  if (!raw || typeof raw !== "object") {
    throw new Error("El archivo no es una copia reconocible.");
  }
  const data = raw as Omit<Partial<ProgressExport>, "version"> & { version?: number };
  if ((data.version !== 1 && data.version !== 2) || !Array.isArray(data.progress)) {
    throw new Error("Esta copia no es compatible con esta versión de la app.");
  }
  const metaFromFile = data.meta;
  const meta: ProgressMeta = {
    key: META_KEY,
    completedSessions: Array.isArray(metaFromFile?.completedSessions) ? metaFromFile.completedSessions : [],
    lastAcknowledgedRound: typeof metaFromFile?.lastAcknowledgedRound === "number" ? metaFromFile.lastAcknowledgedRound : 0
  };
  const profile = data.profile && typeof data.profile === "object" ? (data.profile as Profile) : null;
  const srs = data.version === 2 && data.srs ? normalizeSrsState(data.srs) : emptySrsState();
  return { progress: data.progress as ExerciseProgress[], meta, profile, srs };
}
