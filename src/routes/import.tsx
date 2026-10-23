import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CATEGORIES, type Lesson } from "@/lib/domain";
import { importLessons, useLibrary } from "@/lib/library-store";
import { parseLessonImport } from "@/lib/validate-lesson";
import { Button, PageIntro } from "@/components/ui";

export const Route = createFileRoute("/import")({
  component: ImportPage,
  head: () => ({ meta: [{ title: "Import a lesson — Steward's Path" }] }),
});

const EXAMPLE: Lesson = {
  id: "footing-you-can-explain",
  category: "Civil & Structural Basics",
  title: "A Footing You Can Explain",
  level: "beginner",
  estimatedMinutes: 8,
  content: `Before you set a post, a short pier, or the start of a boardwalk, you should be able to say what the ground is doing.

Dig past duff and loose topsoil until the material feels firm and stays firm when you tamp it. A hole full of leaves and soft fill is not a footing. The hole needs to be wider than the post so you can compact around it, not just drop it in.

Depth is not a vibe. If you can rock the post by hand, people will rock it with their weight. In coastal southern California the frost line is not your main enemy. Loose fill, a sloping hole, and water that scours the toe are.

Stop and ask for help when the span crosses water, carries a roof, or will be used by the public. This lesson is a habit of mind, not a stamped design.

## Field check

- Can you name the material at the bottom of the hole?
- Does the post stand without you holding it, before you backfill?
- Will water sit against the post, or run off?
- Can you explain the footing in two sentences to another person?`,
  keyPoints: [
    "Bottom the hole on firm material, not duff.",
    "If it rocks by hand, it is not done.",
    "Water, spans, and the public are reasons to stop and get a real design.",
  ],
  quiz: [
    {
      question: "What should be at the bottom of a footing hole?",
      options: ["Loose duff and leaves", "Firm material you can name", "Whatever the auger stopped on", "Mulch, so the post stays moist"],
      answer: 1,
    },
    {
      question: "When should you stop and get a qualified design?",
      options: [
        "When the hole is slightly wider than the post",
        "When the work spans water, carries a roof, or the public will rely on it",
        "Only if the post is wood",
        "Never, if you have built a fence before",
      ],
      answer: 1,
    },
  ],
  resources: [
    {
      title: "Say the footing out loud",
      note: "If you cannot explain depth, material, and how water leaves, do not build it.",
    },
  ],
  addedBy: "bot",
  dateAdded: "2026-10-23",
};

const SHAPE = `{
  "id": "reading-slope-before-you-cut",
  "category": "Trails, Fences & Bridges",
  "title": "Reading Slope Before You Cut",
  "level": "beginner",
  "estimatedMinutes": 12,
  "content": "Start with what to do on the ground. Markdown. ## headings, lists, **bold**. No raw HTML.",
  "keyPoints": ["One short line you can remember in the field."],
  "illustrations": [
    {
      "type": "trail-cross-section",
      "description": "What the plate shows, in one or two sentences.",
      "alt": "Describe the image for someone who cannot see it.",
      "caption": "What to look for in the picture."
    }
  ],
  "videos": [
    {
      "title": "Short clip title",
      "duration": "2 min",
      "watchFor": "The one thing to notice.",
      "url": "https://www.youtube.com/watch?v=xxxxxxxxxxx"
    }
  ],
  "interactiveElements": [
    { "id": "outslope", "kind": "outslope-visual" }
  ],
  "howWeKnow": {
    "discovered": "How people first figured this out. A concrete story or method.",
    "verified": "How it has been checked since: measurements, standards, repeated field practice.",
    "wrong": "The usual mistake, and how to check.",
    "decision": "A real choice this knowledge changes on a reserve."
  },
  "fieldChecks": [
    { "id": "slope-named", "label": "I can point to where water leaves this tread." }
  ],
  "tryThis": {
    "title": "Read one grade before you cut",
    "minutes": 8,
    "steps": ["Pick a 20-step stretch.", "Say where the water goes.", "Write one sentence."]
  },
  "quiz": [
    {
      "kind": "choice",
      "question": "Question text?",
      "options": ["First", "Second", "Third"],
      "answer": 0,
      "explanation": "Why that answer is the one you can use outside."
    }
  ],
  "resources": [{ "title": "A field note", "note": "Or use a url instead of a note." }],
  "addedBy": "bot",
  "dateAdded": "2026-10-23"
}`;

function ImportPage() {
  const { ready, lessons } = useLibrary();
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  function add() {
    setNotice(null);
    const result = parseLessonImport(text);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (!ready) {
      setErrors(["Still opening notes on this phone. Try again in a moment."]);
      return;
    }
    const replaced = result.lessons.filter((lesson) => lessons.some((item) => item.id === lesson.id)).length;
    const fresh = result.lessons.length - replaced;
    importLessons(result.lessons);
    setErrors([]);
    setText("");
    const parts = [];
    if (fresh > 0) parts.push(fresh === 1 ? "Added 1 lesson" : `Added ${fresh} lessons`);
    if (replaced > 0) parts.push(replaced === 1 ? "updated 1 that was already here" : `updated ${replaced} that were already here`);
    setNotice(`${parts.join(", ")}. They are on the shelves now.`);
  }

  return (
    <div>
      <PageIntro
        kicker="Import"
        title="Add a lesson"
        lede="Paste JSON from a Grok bot. It is checked, then saved on this phone. You do not need a new build of the app."
      />

      <label className="block" htmlFor="lesson-json">
        <span className="text-base font-semibold text-ink">Lesson JSON</span>
        <textarea
          id="lesson-json"
          value={text}
          onChange={(event) => setText(event.target.value)}
          spellCheck={false}
          rows={12}
          placeholder="Paste one lesson { } or a list [ ]."
          className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-ink placeholder:text-muted"
        />
      </label>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button onClick={add} disabled={!ready}>
          Add to library
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setText(JSON.stringify(EXAMPLE, null, 2));
            setErrors([]);
            setNotice("Example loaded. Add it to put a footing lesson on the Civil shelf.");
          }}
        >
          Load example
        </Button>
        <Button
          variant="quiet"
          onClick={() => {
            setText("");
            setErrors([]);
            setNotice(null);
          }}
        >
          Clear
        </Button>
      </div>

      {notice ? (
        <p className="mt-4 rounded-xl border border-brass bg-surface px-4 py-3 text-base text-ink" role="status">
          {notice}
        </p>
      ) : null}
      {errors.length > 0 ? (
        <div className="mt-4 rounded-xl border border-line bg-elevated px-4 py-3" role="alert">
          <p className="font-semibold text-ink">Fix this before it can be added</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-base text-ink">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">How to add lessons with Grok bots</h2>
        <div className="mt-3 space-y-3 text-base leading-relaxed text-pretty text-ink">
          <p>
            Ask for one lesson as JSON in the shape below. Practical how-to first, then how we know it is true, then
            something the steward can check on the ground. Paste the result here. One object, or a list in square
            brackets. No comments, no trailing commas.
          </p>
          <p>
            The same shape lives in the project file <span className="font-semibold">src/data/lessons.json</span> for a
            bot that is editing the app itself. Do not rename fields. Lessons that only have the old fields still
            import.
          </p>
          <p>Category must be one of these, unless you mean to start a new shelf:</p>
          <ul className="list-disc space-y-1 pl-5 marker:text-brass">
            {CATEGORIES.map((category) => (
              <li key={category.name}>{category.name}</li>
            ))}
          </ul>
          <h3 className="font-display text-xl text-ink">Preferred lesson shape</h3>
          <ul className="list-disc space-y-2 pl-5 marker:text-brass">
            <li>id: lowercase words with hyphens, unique. Example: reading-slope-before-you-cut</li>
            <li>level: beginner, intermediate, or advanced. estimatedMinutes: 1 to 240</li>
            <li>content: markdown for the on-the-ground how. Headings, lists, bold. No raw HTML.</li>
            <li>keyPoints: at least one short line that fits in a pocket.</li>
            <li>
              illustrations: type, description, alt, caption, and an optional src. Known types the app can draw:
              trail-cross-section, waterbar-plan, fence-brace, stream-channel, solar-flow, span-load, root-zone. Use
              type photo plus a src for a picture.
            </li>
            <li>
              videos: title, watchFor, optional duration and url. Prefer a 1–3 minute clip. Say what to look for. A
              missing url shows a placeholder instead of breaking the lesson.
            </li>
            <li>
              interactiveElements: id and kind. Kinds the app runs: trail-section, waterbar-plan, fence-system,
              stream-channel, solar-flow, span-load, root-zone, outslope-visual, fence-helper, waterbar-spacing,
              solar-decision, offer-check, trail-log, sequence, before-after. sequence and before-after take steps with
              a title and a body. An unknown kind still imports and shows your note.
            </li>
            <li>howWeKnow: discovered, verified, wrong, and decision. All four, or omit the whole object.</li>
            <li>fieldChecks: id and label. The steward can tick these. They save on the phone.</li>
            <li>tryThis: title, minutes (1–60), and steps. A short observation they can do on the next work day.</li>
            <li>
              quiz: choice is the default. Also truefalse, order (list the options in the correct order), and spot.
              Add explanation. spot may set figure to trail-berm, waterbar-square, fence-lean, stream-cut, solar-short,
              or root-packed.
            </li>
            <li>resources: title, plus a url or a note. addedBy and dateAdded can be omitted.</li>
          </ul>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-elevated p-4 font-mono text-sm leading-relaxed text-ink">
          {SHAPE}
        </pre>
      </section>
    </div>
  );
}
