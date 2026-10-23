/**
 * Turn pasted JSON into lessons. One object or an array.
 * Whole paste fails if any item is bad — easier for a bot to fix than a half-import.
 */
import type {
  FieldCheck,
  HowWeKnow,
  Illustration,
  InteractiveElement,
  Lesson,
  LessonVideo,
  Level,
  QuizQuestion,
  Resource,
  TryThis,
} from "@/lib/domain";

const LEVELS = new Set<Level>(["beginner", "intermediate", "advanced"]);
const QUIZ_KINDS = new Set(["choice", "truefalse", "order", "spot"]);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ImportResult =
  | { ok: true; lessons: Lesson[] }
  | { ok: false; errors: string[] };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function stringField(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function numberField(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function todayStamp(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function normalizeQuiz(value: unknown, label: string, errors: string[]): QuizQuestion[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    errors.push(`${label}: quiz must be a list.`);
    return undefined;
  }
  if (value.length === 0) return undefined;
  const questions: QuizQuestion[] = [];
  value.forEach((item, index) => {
    const row = asRecord(item);
    const where = `${label}, quiz ${index + 1}`;
    if (!row) {
      errors.push(`${where}: each question must be an object.`);
      return;
    }
    const question = stringField(row.question);
    if (!question) errors.push(`${where}: question is missing.`);
    if (!Array.isArray(row.options) || row.options.length < 2) {
      errors.push(`${where}: options needs at least two strings.`);
    }
    const options = Array.isArray(row.options)
      ? row.options.map((option) => (typeof option === "string" ? option.trim() : "")).filter(Boolean)
      : [];
    if (Array.isArray(row.options) && options.length !== row.options.length) {
      errors.push(`${where}: every option must be a non-empty string.`);
    }
    let kind: QuizQuestion["kind"];
    if (row.kind !== undefined) {
      const kindRaw = stringField(row.kind);
      if (!kindRaw || !QUIZ_KINDS.has(kindRaw)) {
        errors.push(`${where}: kind must be choice, truefalse, order, or spot.`);
      } else if (kindRaw !== "choice") {
        kind = kindRaw as QuizQuestion["kind"];
      }
    }
    if (kind === "truefalse" && options.length !== 2) {
      errors.push(`${where}: a true/false question needs exactly two options.`);
    }
    if (kind === "order" && options.length < 2) {
      errors.push(`${where}: an order question needs at least two steps.`);
    }
    let answer: number | string | null = null;
    if (kind === "order") {
      answer = 0;
    } else if (typeof row.answer === "number" && Number.isInteger(row.answer)) answer = row.answer;
    else if (typeof row.answer === "string" && row.answer.trim()) {
      const text = row.answer.trim();
      answer = /^\d+$/.test(text) ? Number(text) : text;
    }
    if (kind !== "order" && answer === null) {
      errors.push(`${where}: answer must be an index (0-based) or the exact option text.`);
    }
    if (typeof answer === "number" && kind !== "order" && (answer < 0 || answer >= options.length)) {
      errors.push(`${where}: answer index is outside the options.`);
    }
    if (typeof answer === "string" && options.length > 0 && !options.includes(answer)) {
      errors.push(`${where}: answer text does not match any option.`);
    }
    const explanation = stringField(row.explanation) ?? undefined;
    if (explanation && explanation.length > 800) errors.push(`${where}: explanation is too long.`);
    const figure = stringField(row.figure) ?? undefined;
    if (question && options.length >= 2 && answer !== null) {
      const item: QuizQuestion = { question, options, answer };
      if (kind) item.kind = kind;
      if (explanation) item.explanation = explanation;
      if (figure) item.figure = figure;
      questions.push(item);
    }
  });
  return questions;
}

function normalizeResources(value: unknown, label: string, errors: string[]): Resource[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    errors.push(`${label}: resources must be a list.`);
    return [];
  }
  const resources: Resource[] = [];
  value.forEach((item, index) => {
    const row = asRecord(item);
    const where = `${label}, resource ${index + 1}`;
    if (!row) {
      errors.push(`${where}: must be an object with a title.`);
      return;
    }
    const title = stringField(row.title);
    const url = stringField(row.url) ?? undefined;
    const note = stringField(row.note) ?? undefined;
    if (!title) errors.push(`${where}: title is missing.`);
    if (!url && !note) errors.push(`${where}: add a url or a note.`);
    if (url && !/^https?:\/\//i.test(url)) errors.push(`${where}: url must start with http:// or https://.`);
    if (title && (url || note)) resources.push({ title, url, note });
  });
  return resources;
}

function normalizeIllustrations(value: unknown, label: string, errors: string[]): Illustration[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    errors.push(`${label}: illustrations must be a list.`);
    return undefined;
  }
  const plates: Illustration[] = [];
  value.forEach((item, index) => {
    const row = asRecord(item);
    const where = `${label}, illustration ${index + 1}`;
    if (!row) {
      errors.push(`${where}: must be an object.`);
      return;
    }
    const type = stringField(row.type);
    const description = stringField(row.description);
    const alt = stringField(row.alt);
    const caption = stringField(row.caption);
    const src = stringField(row.src) ?? undefined;
    if (!type) errors.push(`${where}: type is missing.`);
    if (!description) errors.push(`${where}: description is missing.`);
    if (!alt) errors.push(`${where}: alt is missing.`);
    if (!caption) errors.push(`${where}: caption is missing.`);
    if (src && !/^https?:\/\//i.test(src) && !src.startsWith("/")) {
      errors.push(`${where}: src must be an http(s) url or a path starting with /.`);
    }
    if (type && description && alt && caption) plates.push({ type, description, alt, caption, src });
  });
  return plates.length > 0 ? plates : undefined;
}

function normalizeVideos(value: unknown, label: string, errors: string[]): LessonVideo[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    errors.push(`${label}: videos must be a list.`);
    return undefined;
  }
  const videos: LessonVideo[] = [];
  value.forEach((item, index) => {
    const row = asRecord(item);
    const where = `${label}, video ${index + 1}`;
    if (!row) {
      errors.push(`${where}: must be an object.`);
      return;
    }
    const title = stringField(row.title);
    const watchFor = stringField(row.watchFor);
    const url = stringField(row.url) ?? undefined;
    const duration = stringField(row.duration) ?? undefined;
    if (!title) errors.push(`${where}: title is missing.`);
    if (!watchFor) errors.push(`${where}: watchFor is missing. Say what to look for.`);
    if (url && !/^https?:\/\//i.test(url)) errors.push(`${where}: url must start with http:// or https://.`);
    if (title && watchFor) videos.push({ title, watchFor, url, duration });
  });
  return videos.length > 0 ? videos : undefined;
}

function normalizeInteractive(value: unknown, label: string, errors: string[]): InteractiveElement[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    errors.push(`${label}: interactiveElements must be a list.`);
    return undefined;
  }
  const items: InteractiveElement[] = [];
  const seen = new Set<string>();
  value.forEach((item, index) => {
    const row = asRecord(item);
    const where = `${label}, interactive ${index + 1}`;
    if (!row) {
      errors.push(`${where}: must be an object.`);
      return;
    }
    const id = stringField(row.id);
    const kind = stringField(row.kind);
    if (!id || !ID_PATTERN.test(id)) errors.push(`${where}: id must be lowercase words with hyphens.`);
    if (!kind) errors.push(`${where}: kind is missing.`);
    if (id && seen.has(id)) errors.push(`${where}: id "${id}" is repeated.`);
    if (id) seen.add(id);
    const title = stringField(row.title) ?? undefined;
    const note = stringField(row.note) ?? undefined;
    let steps: InteractiveElement["steps"];
    if (row.steps !== undefined) {
      if (!Array.isArray(row.steps)) errors.push(`${where}: steps must be a list.`);
      else {
        steps = [];
        row.steps.forEach((step, stepIndex) => {
          const stepRow = asRecord(step);
          const stepTitle = stepRow ? stringField(stepRow.title) : null;
          const body = stepRow ? stringField(stepRow.body) : null;
          if (!stepTitle || !body) errors.push(`${where}, step ${stepIndex + 1}: needs a title and a body.`);
          else steps?.push({ title: stepTitle, body });
        });
      }
    }
    if (id && kind && ID_PATTERN.test(id)) items.push({ id, kind, title, note, steps });
  });
  return items.length > 0 ? items : undefined;
}

function normalizeHow(value: unknown, label: string, errors: string[]): HowWeKnow | undefined {
  if (value === undefined || value === null) return undefined;
  const row = asRecord(value);
  if (!row) {
    errors.push(`${label}: howWeKnow must be an object.`);
    return undefined;
  }
  const discovered = stringField(row.discovered);
  const verified = stringField(row.verified);
  const wrong = stringField(row.wrong);
  const decision = stringField(row.decision);
  if (!discovered || !verified || !wrong || !decision) {
    errors.push(`${label}: howWeKnow needs discovered, verified, wrong, and decision.`);
    return undefined;
  }
  return { discovered, verified, wrong, decision };
}

function normalizeChecks(value: unknown, label: string, errors: string[]): FieldCheck[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    errors.push(`${label}: fieldChecks must be a list.`);
    return undefined;
  }
  const checks: FieldCheck[] = [];
  const seen = new Set<string>();
  value.forEach((item, index) => {
    const row = asRecord(item);
    const where = `${label}, field check ${index + 1}`;
    if (!row) {
      errors.push(`${where}: must be an object.`);
      return;
    }
    const id = stringField(row.id);
    const checkLabel = stringField(row.label);
    if (!id || !ID_PATTERN.test(id)) errors.push(`${where}: id must be lowercase words with hyphens.`);
    if (!checkLabel) errors.push(`${where}: label is missing.`);
    if (id && seen.has(id)) errors.push(`${where}: id "${id}" is repeated.`);
    if (id) seen.add(id);
    if (id && checkLabel && ID_PATTERN.test(id)) checks.push({ id, label: checkLabel });
  });
  return checks.length > 0 ? checks : undefined;
}

function normalizeTry(value: unknown, label: string, errors: string[]): TryThis | undefined {
  if (value === undefined || value === null) return undefined;
  const row = asRecord(value);
  if (!row) {
    errors.push(`${label}: tryThis must be an object.`);
    return undefined;
  }
  const title = stringField(row.title);
  const minutes = numberField(row.minutes);
  if (!title) errors.push(`${label}: tryThis.title is missing.`);
  if (minutes === null || minutes < 1 || minutes > 60) {
    errors.push(`${label}: tryThis.minutes must be from 1 to 60.`);
  }
  if (!Array.isArray(row.steps) || row.steps.length === 0) {
    errors.push(`${label}: tryThis.steps needs at least one string.`);
    return undefined;
  }
  const steps = row.steps.map((step) => (typeof step === "string" ? step.trim() : "")).filter(Boolean);
  if (steps.length !== row.steps.length) errors.push(`${label}: every tryThis step must be a non-empty string.`);
  if (!title || minutes === null || steps.length === 0) return undefined;
  return { title, minutes: Math.round(minutes), steps };
}

export function normalizeLesson(value: unknown, label: string): { lesson?: Lesson; errors: string[] } {
  const errors: string[] = [];
  const row = asRecord(value);
  if (!row) return { errors: [`${label}: a lesson must be a JSON object.`] };

  const id = stringField(row.id);
  if (!id) errors.push(`${label}: id is missing.`);
  else if (!ID_PATTERN.test(id) || id.length > 80) {
    errors.push(`${label}: id must be lowercase words separated by hyphens, like trail-edge-drainage.`);
  }

  const category = stringField(row.category);
  if (!category) errors.push(`${label}: category is missing.`);
  else if (category.length > 80) errors.push(`${label}: category is too long.`);

  const title = stringField(row.title);
  if (!title) errors.push(`${label}: title is missing.`);
  else if (title.length > 160) errors.push(`${label}: title is too long.`);

  const level = stringField(row.level);
  if (!level || !LEVELS.has(level as Level)) {
    errors.push(`${label}: level must be beginner, intermediate, or advanced.`);
  }

  const estimatedMinutes = numberField(row.estimatedMinutes);
  if (estimatedMinutes === null || estimatedMinutes < 1 || estimatedMinutes > 240) {
    errors.push(`${label}: estimatedMinutes must be a number from 1 to 240.`);
  }

  const content = typeof row.content === "string" ? row.content.trim() : "";
  if (!content) errors.push(`${label}: content is missing.`);
  else if (content.length > 100_000) errors.push(`${label}: content is too long.`);

  let keyPoints: string[] = [];
  if (!Array.isArray(row.keyPoints) || row.keyPoints.length === 0) {
    errors.push(`${label}: keyPoints must be a list with at least one line.`);
  } else {
    keyPoints = row.keyPoints
      .map((point) => (typeof point === "string" ? point.trim() : ""))
      .filter(Boolean);
    if (keyPoints.length !== row.keyPoints.length) {
      errors.push(`${label}: every key point must be a non-empty string.`);
    }
  }

  const quiz = normalizeQuiz(row.quiz, label, errors);
  const resources = normalizeResources(row.resources, label, errors);
  const illustrations = normalizeIllustrations(row.illustrations, label, errors);
  const videos = normalizeVideos(row.videos, label, errors);
  const interactiveElements = normalizeInteractive(row.interactiveElements, label, errors);
  const howWeKnow = normalizeHow(row.howWeKnow, label, errors);
  const fieldChecks = normalizeChecks(row.fieldChecks, label, errors);
  const tryThis = normalizeTry(row.tryThis, label, errors);
  const addedBy = stringField(row.addedBy) ?? "bot";
  const dateAdded = stringField(row.dateAdded) ?? todayStamp();
  if (row.dateAdded !== undefined && !/^\d{4}-\d{2}-\d{2}/.test(dateAdded)) {
    errors.push(`${label}: dateAdded should look like 2026-10-23.`);
  }

  if (errors.length > 0 || !id || !category || !title || !level || estimatedMinutes === null) {
    return { errors };
  }

  const lesson: Lesson = {
    id,
    category,
    title,
    level: level as Level,
    estimatedMinutes: Math.round(estimatedMinutes),
    content,
    keyPoints,
    resources,
    addedBy,
    dateAdded: dateAdded.slice(0, 10),
  };
  if (quiz && quiz.length > 0) lesson.quiz = quiz;
  if (illustrations) lesson.illustrations = illustrations;
  if (videos) lesson.videos = videos;
  if (interactiveElements) lesson.interactiveElements = interactiveElements;
  if (howWeKnow) lesson.howWeKnow = howWeKnow;
  if (fieldChecks) lesson.fieldChecks = fieldChecks;
  if (tryThis) lesson.tryThis = tryThis;
  return { lesson, errors };
}

export function parseLessonImport(raw: string): ImportResult {
  const text = raw.trim();
  if (!text) return { ok: false, errors: ["Paste a lesson first."] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      errors: [
        "That is not valid JSON. Paste one lesson object, or a list of them in [ ]. No comments or trailing commas.",
      ],
    };
  }

  const record = asRecord(parsed);
  if (record && (record.progress || record.app === "Steward's Path") && !record.id) {
    return {
      ok: false,
      errors: ["This looks like a backup file. Restore it from Settings, not here."],
    };
  }

  const items = Array.isArray(parsed) ? parsed : [parsed];
  if (items.length === 0) return { ok: false, errors: ["The list is empty."] };
  if (items.length > 40) return { ok: false, errors: ["Paste up to 40 lessons at a time."] };

  const errors: string[] = [];
  const lessons: Lesson[] = [];
  const seen = new Set<string>();
  items.forEach((item, index) => {
    const label = Array.isArray(parsed) ? `Lesson ${index + 1}` : "Lesson";
    const result = normalizeLesson(item, label);
    errors.push(...result.errors);
    if (result.lesson) {
      if (seen.has(result.lesson.id)) errors.push(`${label}: id "${result.lesson.id}" is repeated in this paste.`);
      seen.add(result.lesson.id);
      lessons.push(result.lesson);
    }
  });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, lessons };
}

/** Seed file must already be valid. A bad starter lesson should fail loudly. */
export function assertSeed(value: unknown): Lesson[] {
  if (!Array.isArray(value)) throw new Error("src/data/lessons.json must be an array.");
  const result = parseLessonImport(JSON.stringify(value));
  if (!result.ok) {
    throw new Error(`Starter lessons are invalid:\n${result.errors.join("\n")}`);
  }
  return result.lessons;
}
