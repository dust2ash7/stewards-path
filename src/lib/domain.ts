/**
 * Steward's Path lesson contract.
 *
 * Bots adding lessons — in the app (Import) or in src/data/lessons.json —
 * keep the original fields and add the optional ones below. Do not rename fields.
 * Older lessons with only the original fields still import.
 *
 * Required:
 *   id, category, title, level, estimatedMinutes, content, keyPoints
 *   resources (may be []), addedBy, dateAdded (filled in if omitted)
 *
 * Optional, and preferred for every new lesson:
 *   illustrations: [{ type, description, alt, caption, src? }]
 *   videos: [{ title, watchFor, url?, duration? }]
 *   interactiveElements: [{ id, kind, title?, note?, steps?: [{ title, body }] }]
 *   howWeKnow: { discovered, verified, wrong, decision }
 *   fieldChecks: [{ id, label }]
 *   tryThis: { title, minutes, steps: [string] }
 *   quiz items may add kind ("choice" | "truefalse" | "order" | "spot"),
 *     explanation, and figure. For kind "order", list options in the correct order.
 *
 * Known interactive kinds the app can draw:
 *   trail-section, waterbar-plan, fence-system, stream-channel, solar-flow,
 *   span-load, root-zone, outslope-visual, fence-helper, waterbar-spacing,
 *   solar-decision, offer-check, trail-log, sequence, before-after
 *
 * answer may be a 0-based index or the exact option text.
 * Order questions do not need answer — options are already in the right order.
 */

export type Level = "beginner" | "intermediate" | "advanced";

export type QuizKind = "choice" | "truefalse" | "order" | "spot";

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: number | string;
  kind?: QuizKind;
  explanation?: string;
  /** Compact plate to show with a spot-the-problem question. */
  figure?: string;
};

export type Resource = {
  title: string;
  url?: string;
  note?: string;
};

export type Illustration = {
  type: string;
  description: string;
  alt: string;
  caption: string;
  src?: string;
};

export type LessonVideo = {
  title: string;
  watchFor: string;
  url?: string;
  duration?: string;
};

export type InteractiveStep = {
  title: string;
  body: string;
};

export type InteractiveElement = {
  id: string;
  kind: string;
  title?: string;
  note?: string;
  steps?: InteractiveStep[];
};

export type HowWeKnow = {
  discovered: string;
  verified: string;
  wrong: string;
  decision: string;
};

export type FieldCheck = {
  id: string;
  label: string;
};

export type TryThis = {
  title: string;
  minutes: number;
  steps: string[];
};

export type Lesson = {
  id: string;
  category: string;
  title: string;
  level: Level;
  estimatedMinutes: number;
  content: string;
  keyPoints: string[];
  quiz?: QuizQuestion[];
  resources: Resource[];
  addedBy: string;
  dateAdded: string;
  illustrations?: Illustration[];
  videos?: LessonVideo[];
  interactiveElements?: InteractiveElement[];
  howWeKnow?: HowWeKnow;
  fieldChecks?: FieldCheck[];
  tryThis?: TryThis;
};

export type LessonSource = "seed" | "imported";

export type LessonView = Lesson & { source: LessonSource };

export type LessonProgress = {
  completed: boolean;
  completedAt: string | null;
  lastViewed: string | null;
  quizScore: { correct: number; total: number; at: string } | null;
  notes: string;
  bookmarked: boolean;
  /** Check id → ISO time it was marked done. */
  fieldChecks: Record<string, string>;
  tryNotes: string;
};

export const EMPTY_PROGRESS: LessonProgress = {
  completed: false,
  completedAt: null,
  lastViewed: null,
  quizScore: null,
  notes: "",
  bookmarked: false,
  fieldChecks: {},
  tryNotes: "",
};

/** Known shelves, in display order. New category strings still show up. */
export const CATEGORIES: { name: string; blurb: string }[] = [
  {
    name: "Trails, Fences & Bridges",
    blurb: "Edges, drainage, posts, and crossings that stay put.",
  },
  {
    name: "Trees, Plants & Rivers",
    blurb: "Read living systems before you cut, plant, or cross.",
  },
  {
    name: "Civil & Structural Basics",
    blurb: "Loads, spans, footings, and when to stop and ask.",
  },
  {
    name: "Electrical, Solar & Batteries",
    blurb: "Safe power for a remote work site.",
  },
  {
    name: "Business for Raven Flock",
    blurb: "One clear offer, plain words, a fair price.",
  },
  {
    name: "Coding for Apps & Tools",
    blurb: "Small tools that earn their place in the field.",
  },
];

export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function categoryBySlug(slug: string): string | null {
  const known = CATEGORIES.find((category) => slugifyCategory(category.name) === slug);
  return known ? known.name : null;
}

export function progressFor(
  map: Record<string, LessonProgress>,
  id: string,
): LessonProgress {
  const row = map[id];
  if (!row) return EMPTY_PROGRESS;
  return {
    ...EMPTY_PROGRESS,
    ...row,
    fieldChecks: row.fieldChecks ?? {},
    tryNotes: row.tryNotes ?? "",
  };
}

/** Imported lessons with the same id override the seed copy, in place. */
export function mergeLessons(seed: Lesson[], imported: Lesson[]): LessonView[] {
  const overrides = new Map(imported.map((lesson) => [lesson.id, lesson]));
  const used = new Set<string>();
  const merged: LessonView[] = seed.map((lesson) => {
    const replacement = overrides.get(lesson.id);
    if (replacement) {
      used.add(lesson.id);
      return { ...replacement, source: "imported" };
    }
    return { ...lesson, source: "seed" };
  });
  for (const lesson of imported) {
    if (!used.has(lesson.id)) merged.push({ ...lesson, source: "imported" });
  }
  return merged;
}

export type CategoryGroup = {
  name: string;
  slug: string;
  blurb: string;
  lessons: LessonView[];
};

export function groupLessons(lessons: LessonView[], includeEmptyKnown: boolean): CategoryGroup[] {
  const byName = new Map<string, LessonView[]>();
  for (const lesson of lessons) {
    const list = byName.get(lesson.category) ?? [];
    list.push(lesson);
    byName.set(lesson.category, list);
  }

  const groups: CategoryGroup[] = [];
  for (const category of CATEGORIES) {
    const items = byName.get(category.name) ?? [];
    byName.delete(category.name);
    if (!includeEmptyKnown && items.length === 0) continue;
    groups.push({
      name: category.name,
      slug: slugifyCategory(category.name),
      blurb: category.blurb,
      lessons: items,
    });
  }

  const extras = [...byName.keys()].sort((a, b) => a.localeCompare(b));
  for (const name of extras) {
    groups.push({
      name,
      slug: slugifyCategory(name),
      blurb: "Added from a lesson import.",
      lessons: byName.get(name) ?? [],
    });
  }
  return groups;
}

export function optionIsCorrect(question: QuizQuestion, optionIndex: number): boolean {
  const option = question.options[optionIndex];
  if (typeof question.answer === "number") return question.answer === optionIndex;
  const text = question.answer.trim();
  if (text === option) return true;
  if (/^\d+$/.test(text) && Number(text) === optionIndex) return true;
  return false;
}

export type QuizResponse = {
  choice?: number;
  order?: number[];
};

export function questionIsCorrect(question: QuizQuestion, response: QuizResponse | undefined): boolean {
  if (!response) return false;
  if (question.kind === "order") {
    const order = response.order ?? [];
    return order.length === question.options.length && order.every((value, index) => value === index);
  }
  return response.choice !== undefined && optionIsCorrect(question, response.choice);
}

export function gradeQuiz(
  questions: QuizQuestion[],
  responses: Record<number, QuizResponse>,
): { correct: number; total: number } {
  let correct = 0;
  questions.forEach((question, index) => {
    if (questionIsCorrect(question, responses[index])) correct += 1;
  });
  return { correct, total: questions.length };
}

/** A short line after a check. Practical, not a cheer. */
export function scoreNote(correct: number, total: number): string {
  if (total <= 0) return "Marked done. It is saved on this phone.";
  const ratio = correct / total;
  if (ratio >= 1) return "You had the field right.";
  if (ratio >= 0.8) return "Solid. Take the misses back outside.";
  if (ratio >= 0.5) return "Enough to start. Reread the ones you missed.";
  return "Not yet. Walk the lesson once more, then try the check again.";
}

export function nextLesson(lessons: LessonView[], currentId: string): LessonView | null {
  const index = lessons.findIndex((lesson) => lesson.id === currentId);
  if (index === -1) return null;
  const category = lessons[index]?.category;
  for (let cursor = index + 1; cursor < lessons.length; cursor += 1) {
    if (lessons[cursor]?.category === category) return lessons[cursor] ?? null;
  }
  return lessons[index + 1] ?? null;
}

export function pickContinue(
  lessons: LessonView[],
  progress: Record<string, LessonProgress>,
  lastLessonId: string | null,
): { lesson: LessonView; label: "Start here" | "Continue" | "Review" } | null {
  if (lessons.length === 0) return null;
  const anyViewed = Object.values(progress).some((item) => item.lastViewed);
  const last = lastLessonId ? lessons.find((lesson) => lesson.id === lastLessonId) : undefined;
  if (last && !progressFor(progress, last.id).completed) {
    return { lesson: last, label: anyViewed ? "Continue" : "Start here" };
  }
  const fresh = lessons.find((lesson) => !progressFor(progress, lesson.id).completed);
  if (fresh) return { lesson: fresh, label: anyViewed ? "Continue" : "Start here" };
  return { lesson: last ?? lessons[0]!, label: "Review" };
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function countFieldChecks(
  progress: Record<string, LessonProgress>,
  withinMs: number | null,
  now = Date.now(),
): number {
  let count = 0;
  for (const record of Object.values(progress)) {
    const checks = record.fieldChecks ?? {};
    for (const at of Object.values(checks)) {
      const time = Date.parse(at);
      if (!Number.isFinite(time)) continue;
      if (withinMs !== null && (time < now - withinMs || time > now)) continue;
      count += 1;
    }
  }
  return count;
}

export function fieldChecksThisWeek(progress: Record<string, LessonProgress>, now = Date.now()): number {
  return countFieldChecks(progress, WEEK_MS, now);
}

export function lessonSearchText(lesson: Lesson): string {
  const how = lesson.howWeKnow
    ? [lesson.howWeKnow.discovered, lesson.howWeKnow.verified, lesson.howWeKnow.wrong, lesson.howWeKnow.decision]
    : [];
  return [
    lesson.title,
    lesson.category,
    lesson.level,
    lesson.content,
    ...lesson.keyPoints,
    ...how,
    ...(lesson.fieldChecks ?? []).map((check) => check.label),
    ...(lesson.illustrations ?? []).flatMap((plate) => [plate.caption, plate.alt, plate.description]),
    ...(lesson.tryThis ? [lesson.tryThis.title, ...lesson.tryThis.steps] : []),
  ]
    .join("\n")
    .toLowerCase();
}