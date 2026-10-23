# Steward's Path

Field skills for reserves and Raven Flock. A mobile-first notebook you can install on a phone and use offline after the first load.

Lessons cover trails, plants and water, civil basics, solar and batteries, Raven Flock business, and small coding tools. Progress, notes, bookmarks, and quiz scores stay on the device (IndexedDB, with a local backup). New lessons can be pasted as JSON — no rebuild.

## Run it

```bash
npm install
npm run dev
```

Open the local address the dev server prints. `npm run build` makes the production bundle.

## Add a lesson

On **Import**, paste one lesson object (or use the example). A teaching bot should return JSON with:

`id`, `category`, `title`, `level` (`beginner` | `intermediate` | `advanced`), `estimatedMinutes`, `content` (markdown), `keyPoints`, optional `quiz` (`question`, `options`, `answer`), optional `resources`, `addedBy`, `dateAdded`.

Seed lessons live in `src/data/lessons.json`. Imported lessons are stored on the device and override a seed lesson when the `id` matches.

## Tone

Practical and grounded. Consider the ravens — care and competence, not a lecture.
