/**
 * In-memory library + progress. Hydrates from IndexedDB after first paint
 * so server HTML and the first client render match.
 * Saves are ignored until hydration finishes, so a fast tap cannot wipe notes.
 */
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import seedFile from "@/data/lessons.json";
import {
  EMPTY_PROGRESS,
  type Lesson,
  type LessonProgress,
  type LessonView,
  mergeLessons,
  progressFor,
} from "@/lib/domain";
import {
  EMPTY_PERSISTED,
  THEME_KEY,
  loadPersisted,
  mirrorLocal,
  readLocalMirror,
  savePersisted,
  type Persisted,
} from "@/lib/persist";
import { assertSeed } from "@/lib/validate-lesson";

export const SEED_LESSONS: Lesson[] = assertSeed(seedFile);

export type ThemeName = "dark" | "light";

type State = {
  ready: boolean;
  importedLessons: Lesson[];
  progress: Record<string, LessonProgress>;
  lastLessonId: string | null;
  theme: ThemeName;
};

const serverState: State = {
  ready: false,
  importedLessons: [],
  progress: {},
  lastLessonId: null,
  theme: "dark",
};

let state: State = serverState;
const listeners = new Set<() => void>();
let saveQueue: Promise<void> = Promise.resolve();
const pendingUpdates: Array<(current: State) => State> = [];

function emit() {
  for (const listener of listeners) listener();
}

function persistedSlice(next: State): Persisted {
  return {
    importedLessons: next.importedLessons,
    progress: next.progress,
    lastLessonId: next.lastLessonId,
  };
}

function queueSave() {
  if (!state.ready) return;
  const snapshot = persistedSlice(state);
  // Write the phone copy now. IndexedDB follows, but a closed tab must not drop a finished lesson.
  mirrorLocal(snapshot);
  saveQueue = saveQueue.then(() => savePersisted(snapshot)).catch(() => undefined);
}

function commit(update: (current: State) => State) {
  const next = update(state);
  if (next === state) return;
  if (!state.ready) {
    pendingUpdates.push(update);
    state = next;
    emit();
    return;
  }
  state = next;
  emit();
  queueSave();
}

function replayPending(base: State): State {
  let next = base;
  for (const update of pendingUpdates) next = update(next);
  pendingUpdates.length = 0;
  return next;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return state;
}

export function getServerSnapshot() {
  return serverState;
}

export function hydrate(data: Persisted) {
  let theme: ThemeName = "dark";
  try {
    theme = localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    theme = "dark";
  }
  const hadPending = pendingUpdates.length > 0;
  state = replayPending({
    ready: true,
    importedLessons: data.importedLessons,
    progress: data.progress,
    lastLessonId: data.lastLessonId,
    theme,
  });
  emit();
  if (hadPending) queueSave();
}

export function lessonsFrom(next: State = state): LessonView[] {
  return mergeLessons(SEED_LESSONS, next.importedLessons);
}

export function setTheme(theme: ThemeName) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") document.documentElement.dataset.theme = theme;
  state = { ...state, theme };
  emit();
}

export function touchLesson(id: string) {
  const now = new Date().toISOString();
  commit((current) => {
    const prior = progressFor(current.progress, id);
    return {
      ...current,
      lastLessonId: id,
      progress: {
        ...current.progress,
        [id]: { ...prior, lastViewed: now },
      },
    };
  });
}

export function setCompleted(id: string, completed: boolean) {
  const completedAt = completed ? new Date().toISOString() : null;
  commit((current) => {
    const prior = progressFor(current.progress, id);
    return {
      ...current,
      progress: {
        ...current.progress,
        [id]: { ...prior, completed, completedAt },
      },
    };
  });
}

export function setBookmark(id: string, bookmarked: boolean) {
  commit((current) => {
    const prior = progressFor(current.progress, id);
    return {
      ...current,
      progress: { ...current.progress, [id]: { ...prior, bookmarked } },
    };
  });
}

export function setNotes(id: string, notes: string) {
  const clipped = notes.slice(0, 20_000);
  commit((current) => {
    const prior = progressFor(current.progress, id);
    if (prior.notes === clipped && current.progress[id]) return current;
    return {
      ...current,
      progress: { ...current.progress, [id]: { ...prior, notes: clipped } },
    };
  });
}

export function setTryNotes(id: string, tryNotes: string) {
  const clipped = tryNotes.slice(0, 20_000);
  commit((current) => {
    const prior = progressFor(current.progress, id);
    if (prior.tryNotes === clipped && current.progress[id]) return current;
    return {
      ...current,
      progress: { ...current.progress, [id]: { ...prior, tryNotes: clipped } },
    };
  });
}

export function setFieldCheck(id: string, checkId: string, done: boolean) {
  const at = new Date().toISOString();
  commit((current) => {
    const prior = progressFor(current.progress, id);
    const fieldChecks = { ...prior.fieldChecks };
    if (done) fieldChecks[checkId] = at;
    else delete fieldChecks[checkId];
    return {
      ...current,
      progress: { ...current.progress, [id]: { ...prior, fieldChecks } },
    };
  });
}

export function setQuizScore(id: string, correct: number, total: number) {
  const at = new Date().toISOString();
  commit((current) => {
    const prior = progressFor(current.progress, id);
    return {
      ...current,
      progress: {
        ...current.progress,
        [id]: {
          ...prior,
          completed: true,
          completedAt: prior.completedAt ?? at,
          quizScore: { correct, total, at },
        },
      },
    };
  });
}

export function importLessons(incoming: Lesson[]) {
  commit((current) => {
    const byId = new Map(current.importedLessons.map((lesson) => [lesson.id, lesson]));
    for (const lesson of incoming) byId.set(lesson.id, lesson);
    const seen = new Set<string>();
    const next: Lesson[] = [];
    for (const lesson of current.importedLessons) {
      const updated = byId.get(lesson.id);
      if (updated) next.push(updated);
      seen.add(lesson.id);
    }
    for (const lesson of incoming) {
      if (!seen.has(lesson.id)) next.push(lesson);
    }
    return { ...current, importedLessons: next };
  });
}

export function removeImported(id: string) {
  commit((current) => ({
    ...current,
    importedLessons: current.importedLessons.filter((lesson) => lesson.id !== id),
  }));
}

export function clearImported() {
  commit((current) => ({ ...current, importedLessons: [] }));
}

export function resetProgress() {
  commit((current) => ({ ...current, progress: {}, lastLessonId: null }));
}

export function restoreBackup(data: Persisted) {
  commit((current) => ({
    ...current,
    importedLessons: data.importedLessons,
    progress: data.progress,
    lastLessonId: data.lastLessonId,
  }));
}

export function useLibrary() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    ...snapshot,
    lessons: lessonsFrom(snapshot),
    progressOf: (id: string) => progressFor(snapshot.progress, id),
  };
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancel = false;
    loadPersisted()
      .then((data) => {
        if (!cancel) hydrate(data);
      })
      .catch(() => {
        if (!cancel) hydrate(EMPTY_PERSISTED);
      });
    const flush = () => {
      if (state.ready) {
        const snapshot = persistedSlice(state);
        mirrorLocal(snapshot);
        void savePersisted(snapshot);
        return;
      }
      if (pendingUpdates.length === 0) return;
      const stored = readLocalMirror() ?? EMPTY_PERSISTED;
      let merged: State = {
        ready: true,
        importedLessons: stored.importedLessons,
        progress: stored.progress,
        lastLessonId: stored.lastLessonId,
        theme: state.theme,
      };
      for (const update of pendingUpdates) merged = update(merged);
      const snapshot = persistedSlice(merged);
      mirrorLocal(snapshot);
      void savePersisted(snapshot);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      cancel = true;
      window.removeEventListener("pagehide", flush);
    };
  }, []);
  return children;
}

export { EMPTY_PROGRESS };
