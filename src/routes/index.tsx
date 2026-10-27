import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { groupLessons, fieldChecksThisWeek, pickContinue, progressFor, slugifyCategory } from "@/lib/domain";
import { useLibrary } from "@/lib/library-store";
import { runInstallPrompt, useInstallPrompt } from "@/components/pwa-runtime";
import { Meter, PageIntro, cx } from "@/components/ui";
import { Bookmark, Check, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { lessons, progress, lastLessonId } = useLibrary();
  const groups = groupLessons(lessons, true);
  const done = lessons.filter((lesson) => progressFor(progress, lesson.id).completed).length;
  const total = lessons.length;
  const pct = total === 0 ? 0 : (done / total) * 100;
  const minutesLeft = lessons
    .filter((lesson) => !progressFor(progress, lesson.id).completed)
    .reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0);
  const next = pickContinue(lessons, progress, lastLessonId);
  const saved = lessons.filter((lesson) => progressFor(progress, lesson.id).bookmarked);
  const checksWeek = fieldChecksThisWeek(progress);

  return (
    <div className="space-y-8">
      <PageIntro
        kicker="Consider the ravens"
        title="Steward's Path"
        lede="Field skills for reserves and Raven Flock. Notice the ground, then do the next useful thing."
      />

      <section className="rounded-2xl border border-line bg-surface p-4" aria-label="Overall progress">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl text-ink">On this phone</h2>
          <p className="text-sm tabular-nums text-muted">
            {done} of {total}
          </p>
        </div>
        <div className="mt-3">
          <Meter value={pct} label={`${done} of ${total} lessons complete`} />
        </div>
        <p className="mt-3 text-base text-muted">
          {total === 0
            ? "Import a lesson to begin."
            : done === total
              ? "Starter set is done. Import the next thing you want to remember."
              : `About ${minutesLeft} minutes left in what you have not finished.`}
        </p>
        <p className="mt-3 border-t border-line pt-3 text-base text-ink">
          <span className="font-display text-3xl tabular-nums">{checksWeek}</span>
          <span className="ml-2 text-muted">field checks this week</span>
        </p>
      </section>

      {next ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-brass uppercase">Up next</h2>
          <Link
            to="/lesson/$lessonId"
            params={{ lessonId: next.lesson.id }}
            className="block rounded-2xl border border-line border-l-4 border-l-brass bg-surface p-4 active:bg-elevated"
          >
            <span className="text-sm font-semibold text-brass">{next.label}</span>
            <span className="mt-1 block font-display text-2xl leading-snug text-ink">{next.lesson.title}</span>
            <span className="mt-2 block text-base text-muted">
              {next.lesson.category} · {next.lesson.estimatedMinutes} min
            </span>
          </Link>
        </section>
      ) : null}

      <InstallNote />

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-ink">Shelves</h2>
          <Link to="/library" className="text-base font-semibold text-brass">
            Library
          </Link>
        </div>
        <ul className="space-y-3">
          {groups.map((group) => {
            const finished = group.lessons.filter((lesson) => progressFor(progress, lesson.id).completed).length;
            const count = group.lessons.length;
            const groupPct = count === 0 ? 0 : (finished / count) * 100;
            return (
              <li key={group.slug}>
                <div className="rounded-2xl border border-line bg-surface px-4 py-3">
                  <Link
                    to="/category/$slug"
                    params={{ slug: slugifyCategory(group.name) }}
                    className="block active:bg-elevated"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className="block font-display text-xl leading-snug text-ink">{group.name}</span>
                        <span className="mt-1 block text-sm text-muted">
                          {count === 0 ? "No lessons yet" : `${finished} of ${count} done`}
                        </span>
                      </span>
                      <ChevronRight className="mt-1 size-5 shrink-0 text-muted" aria-hidden />
                    </span>
                    <span className="mt-3 block">
                      <Meter value={groupPct} label={`${group.name} progress`} />
                    </span>
                  </Link>
                  <ul className="mt-3 space-y-1 border-t border-line pt-2">
                    {group.lessons.map((lesson) => {
                      const record = progressFor(progress, lesson.id);
                      return (
                        <li key={lesson.id}>
                          <Link
                            to="/lesson/$lessonId"
                            params={{ lessonId: lesson.id }}
                            className="flex min-h-11 items-center gap-3 rounded-xl px-1 active:bg-elevated"
                          >
                            <span
                              className={cx(
                                "flex size-6 shrink-0 items-center justify-center rounded-full border",
                                record.completed ? "border-brass bg-brass text-brass-ink" : "border-line",
                              )}
                              aria-hidden
                            >
                              {record.completed ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
                            </span>
                            <span className={cx("text-base leading-snug", record.completed ? "text-muted" : "text-ink")}>
                              {lesson.title}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {saved.length > 0 ? (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-2xl text-ink">
            <Bookmark className="size-5 text-brass" aria-hidden />
            Saved
          </h2>
          <ul className="space-y-2">
            {saved.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  to="/lesson/$lessonId"
                  params={{ lessonId: lesson.id }}
                  className="block rounded-xl border border-line px-4 py-3 font-display text-lg text-ink"
                >
                  {lesson.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function InstallNote() {
  const { deferred, installed } = useInstallPrompt();
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const iosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const alone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (typeof navigator !== "undefined" &&
        "standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setIos(iosDevice);
    setStandalone(alone);
    setHidden(localStorage.getItem("stewards-path-install-hide") === "1");
  }, []);

  if (hidden || standalone || installed) return null;
  if (!deferred && !ios) return null;

  return (
    <section className="rounded-2xl border border-line bg-elevated p-4">
      <h2 className="font-display text-2xl text-ink">Keep it on the phone</h2>
      <p className="mt-2 text-base leading-relaxed text-muted">
        {ios
          ? "In Safari, tap Share, then Add to Home Screen. Open it once while you have a signal. After that, lessons stay with you."
          : "Install Steward's Path so the lessons stay available when the reserve has no signal."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {deferred ? (
          <button
            type="button"
            onClick={() => void runInstallPrompt()}
            className={cx(
              "inline-flex min-h-12 items-center justify-center rounded-xl bg-brass px-4 text-base font-semibold text-brass-ink",
            )}
          >
            Install
          </button>
        ) : null}
        <button
          type="button"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line px-4 text-base font-semibold text-ink"
          onClick={() => {
            localStorage.setItem("stewards-path-install-hide", "1");
            setHidden(true);
          }}
        >
          Not now
        </button>
      </div>
    </section>
  );
}
