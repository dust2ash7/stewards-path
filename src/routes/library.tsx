import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { groupLessons, lessonSearchText, progressFor, slugifyCategory } from "@/lib/domain";
import { useLibrary } from "@/lib/library-store";
import { EmptyNote, LessonRow, PageIntro, cx } from "@/components/ui";

export const Route = createFileRoute("/library")({
  component: LibraryPage,
  head: () => ({ meta: [{ title: "Library — Steward's Path" }] }),
});

type FilterId = "all" | "todo" | "done" | "saved";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "todo", label: "Not done" },
  { id: "done", label: "Done" },
  { id: "saved", label: "Saved" },
];

function LibraryPage() {
  const { lessons, progress, progressOf } = useLibrary();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const record = progressFor(progress, lesson.id);
      if (filter === "todo" && record.completed) return false;
      if (filter === "done" && !record.completed) return false;
      if (filter === "saved" && !record.bookmarked) return false;
      if (!needle) return true;
      const haystack = lessonSearchText(lesson);
      return haystack.includes(needle);
    });
  }, [lessons, progress, query, filter]);

  const browsing = filter === "all" && query.trim() === "";
  const groups = groupLessons(visible, browsing);

  return (
    <div>
      <PageIntro
        kicker="Lesson library"
        title="What you can practice"
        lede="Six shelves to start. Search, or show only what you have not finished."
      />

      <label className="block">
        <span className="sr-only">Search lessons</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder="Search trails, posts, solar…"
          className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-lg text-ink placeholder:text-muted"
        />
      </label>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter lessons">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={cx(
              "min-h-11 shrink-0 rounded-full px-4 text-base font-semibold",
              filter === item.id ? "bg-brass text-brass-ink" : "border border-line text-ink",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm tabular-nums text-muted">
        {visible.length} {visible.length === 1 ? "lesson" : "lessons"}
      </p>

      {visible.length === 0 ? (
        <div className="mt-4">
          <EmptyNote>
            Nothing matches. Try a task, a tool, or{" "}
            <Link to="/import" className="font-semibold text-ink underline decoration-brass">
              import a lesson
            </Link>
            .
          </EmptyNote>
        </div>
      ) : (
        <div className="mt-4 space-y-8">
          {groups.map((group) => (
            <section key={group.slug}>
              <div className="mb-3 flex items-end justify-between gap-3">
                <h2 className="font-display text-2xl text-ink">
                  <Link to="/category/$slug" params={{ slug: slugifyCategory(group.name) }}>
                    {group.name}
                  </Link>
                </h2>
                <span className="text-sm tabular-nums text-muted">{group.lessons.length}</span>
              </div>
              {group.lessons.length === 0 ? (
                <EmptyNote>No lessons on this shelf yet.</EmptyNote>
              ) : (
                <ul className="space-y-3">
                  {group.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <LessonRow lesson={lesson} progress={progressOf(lesson.id)} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
