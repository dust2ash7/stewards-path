import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES, slugifyCategory } from "@/lib/domain";
import { useLibrary } from "@/lib/library-store";
import { EmptyNote, LessonRow, Meter, PageIntro } from "@/components/ui";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { lessons, progressOf } = useLibrary();
  const known = CATEGORIES.find((category) => slugifyCategory(category.name) === slug);
  const fromLesson = lessons.find((lesson) => slugifyCategory(lesson.category) === slug);
  const name = known?.name ?? fromLesson?.category ?? null;

  if (!name) {
    return (
      <div>
        <PageIntro title="Shelf not found" lede="That category is not on this phone." />
        <Link to="/library" className="font-semibold text-brass">
          Back to the library
        </Link>
      </div>
    );
  }

  const items = lessons.filter((lesson) => lesson.category === name);
  const blurb = known?.blurb ?? "Added from a lesson import.";
  const finished = items.filter((lesson) => progressOf(lesson.id).completed).length;
  const pct = items.length === 0 ? 0 : (finished / items.length) * 100;

  return (
    <div>
      <PageIntro kicker="Category" title={name} lede={blurb} />
      <div className="mb-6">
        <p className="mb-2 text-sm tabular-nums text-muted">
          {finished} of {items.length} done
        </p>
        <Meter value={pct} label={`${name} progress`} />
      </div>
      {items.length === 0 ? (
        <EmptyNote>
          Nothing on this shelf yet.{" "}
          <Link to="/import" className="font-semibold text-ink underline decoration-brass">
            Paste a lesson
          </Link>{" "}
          from a Grok bot. Use this category name exactly: {name}.
        </EmptyNote>
      ) : (
        <ul className="space-y-3">
          {items.map((lesson) => (
            <li key={lesson.id}>
              <LessonRow lesson={lesson} progress={progressOf(lesson.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
