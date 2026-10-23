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
  saveQueue = saveQueue.then(() => savePersisted(snapshot)).catch(() => undefined);
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
  state = {
    ready: true,
    importedLessons: data.importedLessons,
    progress: data.progress,
    lastLessonId: data.lastLessonId,
    theme,
  };
  emit();
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
  if (!state.ready) return;
  const current = progressFor(state.progress, id);
  const now = new Date().toISOString();
  state = {
    ...state,
    lastLessonId: id,
    progress: {
      ...state.progress,
      [id]: { ...current, lastViewed: now },
    },
  };
  emit();
  queueSave();
}

export function setCompleted(id: string, completed: boolean) {
  if (!state.ready) return;
  const current = progressFor(state.progress, id);
  state = {
    ...state,
    progress: {
      ...state.progress,
      [id]: {
        ...current,
        completed,
        completedAt: completed ? new Date().toISOString() : null,
      },
    },
  };
  emit();
  queueSave();
}

export function setBookmark(id: string, bookmarked: boolean) {
  if (!state.ready) return;
  const current = progressFor(state.progress, id);
  state = {
    ...state,
    progress: {
      ...state.progress,
      [id]: { ...current, bookmarked },
    },
  };
  emit();
  queueSave();
}

export function setNotes(id: string, notes: string) {
  if (!state.ready) return;
  const current = progressFor(state.progress, id);
  const clipped = notes.slice(0, 20_000);
  if (current.notes === clipped && state.progress[id]) return;
  state = {
    ...state,
    progress: {
      ...state.progress,
      [id]: { ...current, notes: clipped },
    },
  };
  emit();
  queueSave();
}

export function setTryNotes(id: string, tryNotes: string) {
  if (!state.ready) return;
  const current = progressFor(state.progress, id);
  const clipped = tryNotes.slice(0, 20_000);
  if (current.tryNotes === clipped && state.progress[id]) return;
  state = {
    ...state,
    progress: {
      ...state.progress,
      [id]: { ...current, tryNotes: clipped },
    },
  };
  emit();
  queueSave();
}

export function setFieldCheck(id: string, checkId: string, done: boolean) {
  if (!state.ready) return;
  const current = progressFor(state.progress, id);
  const fieldChecks = { ...current.fieldChecks };
  if (done) fieldChecks[checkId] = new Date().toISOString();
  else delete fieldChecks[checkId];
  state = {
    ...state,
    progress: {
      ...state.progress,
      [id]: { ...current, fieldChecks },
    },
  };
  emit();
  queueSave();
}

export function setQuizScore(id: string, correct: number, total: number) {
  if (!state.ready) return;
  const current = progressFor(state.progress, id);
  state = {
    ...state,
    progress: {
      ...state.progress,
      [id]: {
        ...current,
        quizScore: { correct, total, at: new Date().toISOString() },
      },
    },
  };
  emit();
  queueSave();
}

export function importLessons(incoming: Lesson[]) {
  if (!state.ready) return;
  const byId = new Map(state.importedLessons.map((lesson) => [lesson.id, lesson]));
  for (const lesson of incoming) byId.set(lesson.id, lesson);
  const seen = new Set<string>();
  const next: Lesson[] = [];
  for (const lesson of state.importedLessons) {
    const updated = byId.get(lesson.id);
    if (updated) next.push(updated);
    seen.add(lesson.id);
  }
  for (const lesson of incoming) {
    if (!seen.has(lesson.id)) next.push(lesson);
  }
  state = { ...state, importedLessons: next };
  emit();
  queueSave();
}

export function removeImported(id: string) {
  if (!state.ready) return;
  state = {
    ...state,
    importedLessons: state.importedLessons.filter((lesson) => lesson.id !== id),
  };
  emit();
  queueSave();
}

export function clearImported() {
  if (!state.ready) return;
  state = { ...state, importedLessons: [] };
  emit();
  queueSave();
}

export function resetProgress() {
  if (!state.ready) return;
  state = { ...state, progress: {}, lastLessonId: null };
  emit();
  queueSave();
}

export function restoreBackup(data: Persisted) {
  if (!state.ready) return;
  state = {
    ...state,
    importedLessons: data.importedLessons,
    progress: data.progress,
    lastLessonId: data.lastLessonId,
  };
  emit();
  queueSave();
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
    return () => {
      cancel = true;
    };
  }, []);
  return children;
}

export { EMPTY_PROGRESS };
