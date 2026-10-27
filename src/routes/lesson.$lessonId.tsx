import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bookmark, Check } from "lucide-react";
import { nextLesson, slugifyCategory, type LessonView } from "@/lib/domain";
import { removeImported, setBookmark, setCompleted, touchLesson, useLibrary } from "@/lib/library-store";
import { LessonBody } from "@/components/field-tools";
import { LessonComplete } from "@/components/lesson-complete";
import { Button, LevelMark, PageIntro, cx } from "@/components/ui";

export const Route = createFileRoute("/lesson/$lessonId")({
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const library = useLibrary();
  const lesson = library.lessons.find((item) => item.id === lessonId);
  const [celebration, setCelebration] = useState<{ score: { correct: number; total: number } | null } | null>(null);

  useEffect(() => {
    if (!library.ready) return;
    if (!library.lessons.some((item) => item.id === lessonId)) return;
    touchLesson(lessonId);
    // lessons is read when ready/id change; listing the array would retrigger on every save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [library.ready, lessonId]);

  if (!lesson) {
    return (
      <div>
        <PageIntro title="Lesson not on this phone" lede="It may have been removed, or the link is old." />
        <Link to="/library" className="font-semibold text-brass">
          Back to the library
        </Link>
      </div>
    );
  }

  const record = library.progressOf(lesson.id);
  const following = nextLesson(library.lessons, lesson.id);

  return (
    <article>
      <p className="text-sm font-semibold tracking-wide text-brass uppercase">{lesson.category}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <LevelMark level={lesson.level} />
        <span className="text-sm tabular-nums text-muted">{lesson.estimatedMinutes} min</span>
        {lesson.source === "imported" ? <span className="text-sm text-muted">Imported</span> : null}
      </div>
      <h1 className="mt-3 font-display text-4xl leading-tight text-ink">{lesson.title}</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-line px-4 text-base font-semibold text-ink"
          aria-pressed={record.bookmarked}
          onClick={() => setBookmark(lesson.id, !record.bookmarked)}
        >
          <Bookmark className={cx("size-5", record.bookmarked && "fill-brass text-brass")} />
          {record.bookmarked ? "Saved" : "Save"}
        </button>
      </div>

      <LessonBody
        lesson={lesson}
        record={record}
        ready={library.ready}
        onScored={(score) => setCelebration({ score })}
      />

      <div className="mt-8 space-y-3">
        <Button
          className="w-full"
          variant={record.completed ? "ghost" : "primary"}
          onClick={() => {
            const nextDone = !record.completed;
            setCompleted(lesson.id, nextDone);
            if (nextDone && !(lesson.quiz && lesson.quiz.length > 0)) setCelebration({ score: null });
          }}
        >
          {record.completed ? (
            "Mark as not done"
          ) : (
            <>
              <Check className="size-5" /> Mark complete
            </>
          )}
        </Button>
        {record.completed ? (
          <p className="text-center text-sm text-muted">Saved on this phone.</p>
        ) : null}
        {following ? (
          <Link
            to="/lesson/$lessonId"
            params={{ lessonId: following.id }}
            className="flex min-h-12 items-center justify-center rounded-xl border border-line px-4 text-center text-base font-semibold text-ink"
          >
            Next: {following.title}
          </Link>
        ) : (
          <Link
            to="/category/$slug"
            params={{ slug: slugifyCategory(lesson.category) }}
            className="flex min-h-12 items-center justify-center rounded-xl border border-line px-4 text-base font-semibold text-ink"
          >
            Back to {lesson.category}
          </Link>
        )}
      </div>

      <p className="mt-6 text-sm text-muted">
        Added by {lesson.addedBy} · {lesson.dateAdded}
      </p>

      {lesson.source === "imported" ? <RemoveImported lesson={lesson} /> : null}
      {celebration ? (
        <LessonComplete
          lesson={lesson}
          score={celebration.score}
          next={following}
          onClose={() => setCelebration(null)}
        />
      ) : null}
    </article>
  );
}

function RemoveImported({ lesson }: { lesson: LessonView }) {
  const navigate = useNavigate();
  const [armed, setArmed] = useState(false);
  return (
    <div className="mt-8 border-t border-line pt-6">
      <p className="text-base text-muted">
        This copy was imported. Removing it restores a starter lesson with the same id, if there was one.
      </p>
      <Button
        variant="ghost"
        className="mt-3"
        onClick={() => {
          if (!armed) {
            setArmed(true);
            return;
          }
          removeImported(lesson.id);
          void navigate({ to: "/category/$slug", params: { slug: slugifyCategory(lesson.category) } });
        }}
      >
        {armed ? "Tap again to remove" : "Remove imported copy"}
      </Button>
    </div>
  );
}
