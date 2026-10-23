import { createFileRoute, Link } from "@tanstack/react-router";
import { countFieldChecks, progressFor } from "@/lib/domain";
import { useLibrary } from "@/lib/library-store";
import { EmptyNote, PageIntro } from "@/components/ui";

export const Route = createFileRoute("/progress")({
  component: ProgressPage,
  head: () => ({ meta: [{ title: "Progress — Steward's Path" }] }),
});

function formatWhen(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function ProgressPage() {
  const { lessons, progress } = useLibrary();
  const finished = lessons
    .filter((lesson) => progressFor(progress, lesson.id).completed)
    .sort((a, b) => {
      const aAt = progressFor(progress, a.id).completedAt ?? "";
      const bAt = progressFor(progress, b.id).completedAt ?? "";
      return bAt.localeCompare(aAt);
    });
  const withNotes = lessons.filter((lesson) => progressFor(progress, lesson.id).notes.trim().length > 0);
  const scored = finished.filter((lesson) => progressFor(progress, lesson.id).quizScore);

  return (
    <div>
      <PageIntro
        kicker="Progress"
        title="What you have done"
        lede="Finished lessons, quiz scores, field checks, and the notes you wrote. All of it stays on this phone."
      />

      <dl className="grid grid-cols-2 gap-2">
        <Stat label="Done" value={String(finished.length)} />
        <Stat label="Field checks" value={String(countFieldChecks(progress, null))} />
        <Stat label="Notes" value={String(withNotes.length)} />
        <Stat label="Quizzes" value={String(scored.length)} />
      </dl>

      <section className="mt-8">
        <h2 className="font-display text-2xl text-ink">Finished</h2>
        {finished.length === 0 ? (
          <div className="mt-3">
            <EmptyNote>Nothing finished yet. The trail-edge lesson is a good first walk.</EmptyNote>
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {finished.map((lesson) => {
              const record = progressFor(progress, lesson.id);
              return (
                <li key={lesson.id}>
                  <Link
                    to="/lesson/$lessonId"
                    params={{ lessonId: lesson.id }}
                    className="block rounded-2xl border border-line bg-surface px-4 py-3"
                  >
                    <span className="block font-display text-xl leading-snug text-ink">{lesson.title}</span>
                    <span className="mt-1 block text-sm text-muted">
                      {lesson.category}
                      {record.completedAt ? ` · ${formatWhen(record.completedAt)}` : ""}
                      {record.quizScore ? ` · Quiz ${record.quizScore.correct}/${record.quizScore.total}` : ""}
                    </span>
                    {record.notes.trim() ? (
                      <span className="mt-2 block text-base leading-relaxed text-ink">{excerpt(record.notes)}</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl text-ink">Notes</h2>
        {withNotes.length === 0 ? (
          <div className="mt-3">
            <EmptyNote>Notes you type on a lesson show up here.</EmptyNote>
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {withNotes.map((lesson) => {
              const record = progressFor(progress, lesson.id);
              return (
                <li key={lesson.id} className="rounded-2xl border border-line px-4 py-3">
                  <Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }} className="font-display text-xl text-ink">
                    {lesson.title}
                  </Link>
                  <p className="mt-2 text-base leading-relaxed text-ink">{excerpt(record.notes)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-display text-3xl tabular-nums text-ink">{value}</dd>
    </div>
  );
}

function excerpt(notes: string): string {
  const clean = notes.trim().replace(/\s+/g, " ");
  return clean.length > 180 ? `${clean.slice(0, 177)}…` : clean;
}
