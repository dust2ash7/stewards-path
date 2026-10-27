/**
 * Quiet finish for a lesson. The raven image is a static file so it can be swapped
 * without touching this layout: public/celebrate-raven.jpg
 */
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { scoreNote, type LessonView } from "@/lib/domain";
import { Button } from "@/components/ui";

const ART = `${import.meta.env.BASE_URL}celebrate-raven.jpg`;

export function LessonComplete({
  lesson,
  score,
  next,
  onClose,
}: {
  lesson: LessonView;
  score: { correct: number; total: number } | null;
  next: LessonView | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pct = score && score.total > 0 ? Math.round((score.correct / score.total) * 100) : null;
  const note = score ? scoreNote(score.correct, score.total) : "Saved on this phone.";

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="celebrate-card w-full max-w-md overflow-hidden rounded-2xl border border-line bg-canvas text-ink shadow-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-complete-title"
        onClick={(event) => event.stopPropagation()}
      >
        <img src={ART} alt="A raven on a trail post in morning chaparral." className="aspect-video w-full object-cover" />
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold tracking-wide text-brass uppercase">Consider the ravens</p>
          <h2 id="lesson-complete-title" className="font-display text-3xl leading-tight text-ink">
            Lesson complete
          </h2>
          <p className="text-base text-muted">{lesson.title}</p>
          {score ? (
            <p className="font-display text-4xl tabular-nums text-ink">
              {score.correct}/{score.total}
              {pct !== null ? <span className="ml-3 text-2xl text-muted">{pct}%</span> : null}
            </p>
          ) : null}
          <p className="text-lg leading-relaxed text-ink">{note}</p>
          <div className="flex flex-col gap-2 pt-1">
            {next ? (
              <Link
                to="/lesson/$lessonId"
                params={{ lessonId: next.id }}
                onClick={onClose}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brass px-4 text-center text-base font-semibold text-brass-ink"
              >
                Next lesson
              </Link>
            ) : null}
            <Link
              to="/"
              onClick={onClose}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line px-4 text-center text-base font-semibold text-ink"
            >
              Back to the path
            </Link>
            <Button variant="quiet" className="w-full" onClick={onClose}>
              Stay here
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
