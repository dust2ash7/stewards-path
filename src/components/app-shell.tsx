import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bird, ChevronLeft, House, Library, ListChecks, Moon, Plus, Settings, Sun } from "lucide-react";
import { setTheme, useLibrary } from "@/lib/library-store";
import { slugifyCategory } from "@/lib/domain";
import { cx } from "@/components/ui";

const TABS = [
  { to: "/", label: "Home", icon: House, match: (path: string) => path === "/" },
  {
    to: "/library",
    label: "Library",
    icon: Library,
    match: (path: string) =>
      path.startsWith("/library") || path.startsWith("/category") || path.startsWith("/lesson"),
  },
  {
    to: "/progress",
    label: "Progress",
    icon: ListChecks,
    match: (path: string) => path.startsWith("/progress"),
  },
  { to: "/import", label: "Import", icon: Plus, match: (path: string) => path.startsWith("/import") },
] as const;

function ThemeButton() {
  const { theme } = useLibrary();
  const next = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button
      type="button"
      className="flex size-12 items-center justify-center rounded-xl text-ink"
      aria-label={next === "light" ? "Switch to light" : "Switch to dark"}
      onClick={() => setTheme(next)}
    >
      <Icon className="size-5" />
    </button>
  );
}

function NavLinks({ stacked }: { stacked: boolean }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav className={cx("gap-1", stacked ? "flex" : "flex flex-col")} aria-label="Primary">
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex min-h-12 rounded-xl text-sm font-semibold",
              stacked ? "flex-1 flex-col items-center justify-center gap-0.5 px-1" : "items-center justify-start gap-3 px-3",
              active ? "bg-elevated text-brass" : "text-muted",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { lessons } = useLibrary();
  const lessonId = pathname.startsWith("/lesson/") ? decodeURIComponent(pathname.slice("/lesson/".length)) : null;
  const lesson = lessonId ? lessons.find((item) => item.id === lessonId) : undefined;
  const onCategory = pathname.startsWith("/category/");
  const onSettings = pathname.startsWith("/settings");

  const barTitle = lesson
    ? lesson.category
    : pathname.startsWith("/library")
      ? "Library"
      : onCategory
        ? "Category"
        : pathname.startsWith("/progress")
          ? "Progress"
          : pathname.startsWith("/import")
            ? "Import"
            : onSettings
              ? "Settings"
              : "Steward's Path";

  return (
    <div className="min-h-dvh border-t-4 border-brass bg-canvas text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-xl focus:bg-brass focus:px-4 focus:py-2 focus:text-brass-ink"
      >
        Skip to content
      </a>
      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-line bg-surface px-4 py-6 lg:flex">
          <Link to="/" className="flex items-center gap-3 rounded-xl">
            <Bird className="size-8 text-brass" aria-hidden />
            <span>
              <span className="block font-display text-2xl leading-none text-ink">Steward's Path</span>
              <span className="mt-1 block text-sm text-muted">Field skills</span>
            </span>
          </Link>
          <NavLinks stacked={false} />
          <div className="mt-auto flex items-center">
            <ThemeButton />
            <Link to="/settings" aria-label="Settings" className="flex size-12 items-center justify-center rounded-xl text-ink">
              <Settings className="size-5" />
            </Link>
          </div>
        </aside>

        <div className="min-w-0">
          <header
            className={cx(
              "header-safe sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur lg:static",
              pathname === "/" ||
                pathname.startsWith("/library") ||
                pathname.startsWith("/progress") ||
                pathname.startsWith("/import")
                ? "lg:hidden"
                : undefined,
            )}
          >
            <div className="mx-auto flex w-full max-w-2xl items-center gap-1 px-2 py-1 lg:px-6">
              {lesson ? (
                <Link
                  to="/category/$slug"
                  params={{ slug: slugifyCategory(lesson.category) }}
                  aria-label="Back to category"
                  className="flex size-12 items-center justify-center rounded-xl text-ink"
                >
                  <ChevronLeft className="size-6" />
                </Link>
              ) : onCategory ? (
                <Link
                  to="/library"
                  aria-label="Back to library"
                  className="flex size-12 items-center justify-center rounded-xl text-ink"
                >
                  <ChevronLeft className="size-6" />
                </Link>
              ) : onSettings ? (
                <Link to="/" aria-label="Back home" className="flex size-12 items-center justify-center rounded-xl text-ink">
                  <ChevronLeft className="size-6" />
                </Link>
              ) : (
                <Link to="/" className="flex size-12 items-center justify-center text-brass lg:hidden" aria-label="Home">
                  <Bird className="size-7" />
                </Link>
              )}
              {pathname === "/" ? (
                <span className="min-w-0 flex-1" />
              ) : (
                <p className="min-w-0 flex-1 truncate font-display text-lg text-ink">{barTitle}</p>
              )}
              <span className="lg:hidden">
                <ThemeButton />
              </span>
              <Link
                to="/settings"
                aria-label="Settings"
                className="flex size-12 items-center justify-center rounded-xl text-ink lg:hidden"
              >
                <Settings className="size-5" />
              </Link>
            </div>
            <div className="mx-auto w-full max-w-2xl px-2 pb-2 lg:hidden">
              <NavLinks stacked />
            </div>
          </header>
          <main id="main" className="mx-auto w-full max-w-2xl px-4 py-5 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
