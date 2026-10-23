import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, Check } from "lucide-react";
import type { LessonProgress, LessonView, Level } from "@/lib/domain";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Meter({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-elevated"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="meter-fill h-full rounded-full bg-brass" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PageIntro({
  kicker,
  title,
  lede,
}: {
  kicker?: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="mb-6">
      {kicker ? (
        <p className="text-sm font-semibold tracking-wide text-brass uppercase">{kicker}</p>
      ) : null}
      <h1 className="mt-1 font-display text-4xl leading-tight text-ink">{title}</h1>
      {lede ? <p className="mt-3 text-lg leading-relaxed text-pretty text-muted">{lede}</p> : null}
    </header>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "quiet";
};

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  const look = {
    primary: "bg-brass text-brass-ink",
    ghost: "border border-line bg-transparent text-ink",
    quiet: "bg-elevated text-ink",
  }[variant];
  return (
    <button
      type={type}
      className={cx(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold disabled:opacity-50",
        look,
        className,
      )}
      {...props}
    />
  );
}

export function LevelMark({ level }: { level: Level }) {
  return (
    <span className="rounded-full border border-line px-2 py-0.5 text-sm text-muted capitalize">
      {level}
    </span>
  );
}

export function LessonRow({
  lesson,
  progress,
}: {
  lesson: LessonView;
  progress: LessonProgress;
}) {
  return (
    <Link
      to="/lesson/$lessonId"
      params={{ lessonId: lesson.id }}
      className="flex min-h-16 items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 active:bg-elevated"
    >
      <span
        className={cx(
          "mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border",
          progress.completed ? "border-brass bg-brass text-brass-ink" : "border-line",
        )}
        aria-hidden
      >
        {progress.completed ? <Check className="size-4" strokeWidth={2.5} /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-xl leading-snug text-ink">{lesson.title}</span>
        <span className="mt-1 flex items-center gap-2 text-sm text-muted">
          <span className="capitalize">{lesson.level}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{lesson.estimatedMinutes} min</span>
          {progress.bookmarked ? (
            <Bookmark className="size-4 fill-brass text-brass" aria-label="Saved" />
          ) : null}
          {lesson.source === "imported" ? <span>Imported</span> : null}
        </span>
      </span>
    </Link>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-lg text-muted">{children}</p>
  );
}
