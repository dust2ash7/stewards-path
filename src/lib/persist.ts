/**
 * Local-first progress.
 * IndexedDB key "data" in database "stewards-path" is the record of truth.
 * localStorage "stewards-path-v1" mirrors it so a blocked database still keeps notes.
 * Nothing here is sent to a server.
 */
import type { Lesson, LessonProgress } from "@/lib/domain";
import { normalizeLesson } from "@/lib/validate-lesson";

export const THEME_KEY = "stewards-path-theme";
const LS_KEY = "stewards-path-v1";
const DB_NAME = "stewards-path";
const DB_VERSION = 1;
const STORE = "kv";
const DATA_KEY = "data";

export type Persisted = {
  importedLessons: Lesson[];
  progress: Record<string, LessonProgress>;
  lastLessonId: string | null;
};

export const EMPTY_PERSISTED: Persisted = {
  importedLessons: [],
  progress: {},
  lastLessonId: null,
};

function sanitizeProgress(value: unknown): LessonProgress | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const quiz = row.quizScore;
  let quizScore: LessonProgress["quizScore"] = null;
  if (quiz && typeof quiz === "object") {
    const score = quiz as Record<string, unknown>;
    if (typeof score.correct === "number" && typeof score.total === "number") {
      quizScore = {
        correct: score.correct,
        total: score.total,
        at: typeof score.at === "string" ? score.at : "",
      };
    }
  }
  return {
    completed: row.completed === true,
    completedAt: typeof row.completedAt === "string" ? row.completedAt : null,
    lastViewed: typeof row.lastViewed === "string" ? row.lastViewed : null,
    quizScore,
    notes: typeof row.notes === "string" ? row.notes.slice(0, 20_000) : "",
    bookmarked: row.bookmarked === true,
    fieldChecks: sanitizeChecks(row.fieldChecks),
    tryNotes: typeof row.tryNotes === "string" ? row.tryNotes.slice(0, 20_000) : "",
  };
}

function sanitizeChecks(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const checks: Record<string, string> = {};
  for (const [id, at] of Object.entries(value as Record<string, unknown>)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) continue;
    if (typeof at === "string" && at.length < 40) checks[id] = at;
  }
  return checks;
}

export function sanitizePersisted(value: unknown): Persisted | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const importedLessons: Lesson[] = [];
  if (Array.isArray(row.importedLessons)) {
    for (const item of row.importedLessons) {
      const normalized = normalizeLesson(item, "Saved lesson");
      if (normalized.lesson && normalized.errors.length === 0) importedLessons.push(normalized.lesson);
    }
  }
  const progress: Record<string, LessonProgress> = {};
  if (row.progress && typeof row.progress === "object") {
    for (const [id, item] of Object.entries(row.progress as Record<string, unknown>)) {
      const clean = sanitizeProgress(item);
      if (clean) progress[id] = clean;
    }
  }
  return {
    importedLessons,
    progress,
    lastLessonId: typeof row.lastLessonId === "string" ? row.lastLessonId : null,
  };
}

function readLocal(): Persisted | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return sanitizePersisted(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocal(data: Persisted) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    /* Private mode or a full disk. IndexedDB may still have the copy. */
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(): Promise<Persisted | null | undefined> {
  const db = await openDb();
  try {
    const value = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(DATA_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (value === undefined) return undefined;
    return sanitizePersisted(value);
  } finally {
    db.close();
  }
}

async function idbSet(data: Persisted): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(data, DATA_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function loadPersisted(): Promise<Persisted> {
  try {
    const fromDb = await idbGet();
    if (fromDb) {
      writeLocal(fromDb);
      return fromDb;
    }
    const fromLocal = readLocal();
    if (fromLocal) {
      await idbSet(fromLocal).catch(() => undefined);
      return fromLocal;
    }
    return EMPTY_PERSISTED;
  } catch {
    return readLocal() ?? EMPTY_PERSISTED;
  }
}

export async function savePersisted(data: Persisted): Promise<void> {
  writeLocal(data);
  try {
    await idbSet(data);
  } catch {
    /* localStorage mirror already written */
  }
}
