import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  gradeQuiz,
  optionIsCorrect,
  questionIsCorrect,
  scoreNote,
  type InteractiveElement,
  type LessonProgress,
  type LessonView,
  type QuizQuestion,
  type QuizResponse,
} from "@/lib/domain";
import { setFieldCheck, setNotes, setQuizScore, setTryNotes } from "@/lib/library-store";
import { Markdown } from "@/lib/markdown";
import { Button, cx } from "@/components/ui";
import {
  DIAGRAM_KINDS,
  DescribedPlate,
  Diagram,
  PhotoPlate,
  QuizFigure,
  diagramKindForType,
} from "@/components/field-figures";

function Block({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      {kicker ? <p className="text-sm font-semibold tracking-wide text-brass uppercase">{kicker}</p> : null}
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

function youtubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/")[2] ?? null;
      if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/")[2] ?? null;
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}

function VideoCard({
  title,
  url,
  duration,
  watchFor,
}: {
  title: string;
  url?: string;
  duration?: string;
  watchFor: string;
}) {
  const id = url ? youtubeId(url) : null;
  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-3 py-2">
        <p className="text-sm font-semibold tracking-wide text-brass uppercase">
          {url ? "Clip · needs a connection" : "Clip not attached yet"}
        </p>
      </div>
      {id ? (
        <div className="aspect-video bg-canvas">
          <iframe
            title={title}
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            className="h-full w-full"
            allow="accelerometer; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : null}
      <figcaption className="space-y-2 px-3 py-3">
        <p className="font-semibold text-ink">
          {title}
          {duration ? <span className="font-normal text-muted"> · {duration}</span> : null}
        </p>
        <p className="text-base leading-relaxed text-ink">Watch for: {watchFor}</p>
        {!url ? (
          <p className="text-sm leading-relaxed text-muted">
            A teaching bot can add a 1–3 minute url later. Until then this card is the brief, and it works offline.
          </p>
        ) : null}
        {url && !id ? (
          <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-ink underline decoration-brass">
            Open the clip
          </a>
        ) : null}
      </figcaption>
    </figure>
  );
}

function HowWeKnowCard({ lesson }: { lesson: LessonView }) {
  const how = lesson.howWeKnow;
  if (!how) return null;
  const parts = [
    { title: "How it was discovered", body: how.discovered },
    { title: "How it has been checked", body: how.verified },
    { title: "How people get it wrong", body: how.wrong },
    { title: "Where it changes a decision", body: how.decision },
  ];
  return (
    <Block kicker="Evidence" title="How & why we know this">
      <div className="space-y-2">
        {parts.map((part, index) => (
          <details key={part.title} open={index === 0} className="know-block rounded-2xl border border-line bg-surface">
            <summary className="min-h-12 cursor-pointer px-4 py-3 font-semibold text-ink">{part.title}</summary>
            <div className="space-y-3 px-4 pb-4 text-base leading-relaxed text-ink">
              {part.body.split(/\n\n+/).map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </Block>
  );
}

function OutslopeTool() {
  const [pct, setPct] = useState(3);
  const rise = Math.max(8, Math.min(70, pct * 8));
  let verdict = "Working range. You should barely see it, and your ankles should not roll.";
  if (pct < 2) verdict = "Too flat. Water can loiter and then turn down the trail.";
  if (pct > 5) verdict = "Too much. If your ankles roll, the downhill edge will break off underfoot.";
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="font-display text-xl text-ink">Outslope reminder</h3>
      <p className="mt-1 text-sm text-muted">A feel-check, not a survey. Drag it, then look at a real tread.</p>
      <svg viewBox="0 0 320 120" className="plate-svg mt-3 rounded-xl" role="img" aria-label={`Tread drawn at ${pct} percent cross-slope`}>
        <rect width="320" height="120" fill="var(--sp-canvas)" />
        <path d={`M30 ${80 - rise} L290 80 L290 96 L30 ${96 - rise} Z`} fill="var(--sp-elevated)" stroke="var(--sp-ink)" />
        <text x="30" y="24" fill="var(--sp-ink)" fontSize="14">
          {pct.toFixed(1)}% toward the downhill side
        </text>
      </svg>
      <label className="mt-3 block text-sm font-semibold text-ink" htmlFor="outslope-range">
        Cross-slope, percent
      </label>
      <input
        id="outslope-range"
        type="range"
        min={0}
        max={10}
        step={0.5}
        value={pct}
        onChange={(event) => setPct(Number(event.target.value))}
        className="mt-2 w-full accent-brass"
      />
      <p className="mt-2 text-base leading-relaxed text-ink">{verdict}</p>
    </div>
  );
}

function FenceHelper() {
  const [above, setAbove] = useState(4);
  const [length, setLength] = useState(80);
  const [spacing, setSpacing] = useState(10);
  const bury = Math.max(2, Math.round((above / 2) * 10) / 10);
  const total = Math.round((above + bury) * 10) / 10;
  const safeSpacing = Math.max(4, spacing);
  const posts = Math.max(2, Math.ceil(length / safeSpacing) + 1);
  const linePosts = Math.max(0, posts - 2);
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="font-display text-xl text-ink">Depth and count helper</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Rule of thumb: about one third of the post in the ground, and never under 2 feet. Rock that stops you short means move the hole or change the plan.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <NumberField id="fence-above" label="Above ground, ft" value={above} min={2} max={8} step={0.5} onChange={setAbove} />
        <NumberField id="fence-length" label="Run, ft" value={length} min={8} max={400} step={1} onChange={setLength} />
        <NumberField id="fence-space" label="Spacing, ft" value={spacing} min={6} max={16} step={1} onChange={setSpacing} />
      </div>
      <ul className="mt-4 space-y-2 text-base leading-relaxed text-ink">
        <li>Bury about {bury} ft. Buy posts at least {total} ft long.</li>
        <li>
          This straight run wants {posts} posts touching the wire. The two ends are the ones that must be braced. That leaves {linePosts} line posts between them.
        </li>
        <li>Each end or corner still needs an H-brace: two posts, a rail in compression, a diagonal in tension.</li>
      </ul>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-ink" htmlFor={id}>
      {label}
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)));
        }}
        className="mt-1 min-h-12 w-full rounded-xl border border-line bg-canvas px-2 text-lg text-ink"
      />
    </label>
  );
}

const SPACING_TABLE = [
  { grade: 2, feet: 250 },
  { grade: 5, feet: 130 },
  { grade: 10, feet: 80 },
  { grade: 15, feet: 50 },
  { grade: 20, feet: 40 },
];

function spacingFor(grade: number): { feet: number; note: string } {
  if (grade < 2) {
    return {
      feet: 250,
      note: "Under about 2 percent, outslope often does the job. Add a dip only where water is already collecting.",
    };
  }
  if (grade >= 20) {
    return {
      feet: 40,
      note: "At grades this steep, water bars mostly clog or blow out. The Forest Service trail notebook treats bars above about 20 percent as the wrong tool. Think about a reroute, steps, or a dip you can keep open.",
    };
  }
  let lower = SPACING_TABLE[0]!;
  let upper = SPACING_TABLE[SPACING_TABLE.length - 1]!;
  for (let index = 0; index < SPACING_TABLE.length - 1; index += 1) {
    const a = SPACING_TABLE[index]!;
    const b = SPACING_TABLE[index + 1]!;
    if (grade >= a.grade && grade <= b.grade) {
      lower = a;
      upper = b;
      break;
    }
  }
  const span = upper.grade - lower.grade || 1;
  const mix = (grade - lower.grade) / span;
  const feet = Math.round(lower.feet + (upper.feet - lower.feet) * mix);
  return {
    feet,
    note: "Closer on erodible soil, or if a rut is already starting. This is a reminder, not a soil-specific design.",
  };
}

function WaterbarSpacing() {
  const [grade, setGrade] = useState(8);
  const result = spacingFor(grade);
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="font-display text-xl text-ink">Water-bar spacing guide</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Crew notebooks shorten the gap as the grade steepens. Measure the grade you actually have, not the one you hoped for.
      </p>
      <label className="mt-3 block text-sm font-semibold text-ink" htmlFor="grade-range">
        Trail grade, {grade}%
      </label>
      <input
        id="grade-range"
        type="range"
        min={0}
        max={25}
        step={1}
        value={grade}
        onChange={(event) => setGrade(Number(event.target.value))}
        className="mt-2 w-full accent-brass"
      />
      <p className="mt-3 font-display text-3xl tabular-nums text-ink">About {result.feet} ft</p>
      <p className="mt-2 text-base leading-relaxed text-ink">{result.note}</p>
    </div>
  );
}

const SOLAR_STOPS = {
  tools: "This kit is the wrong tool. A saw or a compressor wants the truck or a generator, and a different safety talk.",
  building: "Stop. A building, a subpanel, or anything tied to the grid is electrician work. This lesson does not cover it.",
  shade: "Move the panel before you buy a second one. Shade cuts more power than a slightly wrong tilt.",
  freeze: "Do not charge a lithium battery below freezing. That plates the cells. Warm it, or wait.",
  yes: "Yes for lights, a phone, and a radio — if the panel is in real sun, the chemistry matches the controller, and the positive lead is fused at the battery. Write watts times hours before you buy.",
} as const;

function SolarDecision() {
  const [path, setPath] = useState<string | null>(null);
  const [step, setStep] = useState<"load" | "sun" | "chem" | "freeze" | "done">("load");
  function finish(key: keyof typeof SOLAR_STOPS) {
    setPath(SOLAR_STOPS[key]);
    setStep("done");
  }
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="font-display text-xl text-ink">Does this setup fit the job?</h3>
      {step === "load" ? (
        <Choice
          prompt="What must this kit actually run?"
          options={[
            ["Lights, a phone, a radio", () => setStep("sun")],
            ["A saw, compressor, or hours of plug-in tools", () => finish("tools")],
            ["A building, subpanel, or the grid", () => finish("building")],
          ]}
        />
      ) : null}
      {step === "sun" ? (
        <Choice
          prompt="Will the panel see open sun during the hours you care about?"
          options={[
            ["Yes, open sky", () => setStep("chem")],
            ["No, it sits under a tree or a cut bank", () => finish("shade")],
          ]}
        />
      ) : null}
      {step === "chem" ? (
        <Choice
          prompt="Which battery is in the box?"
          options={[
            ["LiFePO4", () => setStep("freeze")],
            ["Lead-acid", () => finish("yes")],
          ]}
        />
      ) : null}
      {step === "freeze" ? (
        <Choice
          prompt="Can the lithium battery be asked to charge below freezing?"
          options={[
            ["No. Nights stay above freezing, or I will not charge it then", () => finish("yes")],
            ["Yes, cold nights and it stays on the panel", () => finish("freeze")],
          ]}
        />
      ) : null}
      {step === "done" && path ? <p className="mt-3 text-base leading-relaxed text-ink">{path}</p> : null}
      {step !== "load" ? (
        <button
          type="button"
          className="mt-3 text-sm font-semibold text-brass"
          onClick={() => {
            setStep("load");
            setPath(null);
          }}
        >
          Start the question over
        </button>
      ) : null}
    </div>
  );
}

function Choice({ prompt, options }: { prompt: string; options: Array<[string, () => void]> }) {
  return (
    <div className="mt-3">
      <p className="text-base font-semibold text-ink">{prompt}</p>
      <div className="mt-2 space-y-2">
        {options.map(([label, action]) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className="min-h-12 w-full rounded-xl border border-line px-3 text-left text-base text-ink"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function OfferCheck() {
  const [flags, setFlags] = useState([false, false, false, false, false]);
  const [sentence, setSentence] = useState("");
  const prompts = [
    "A stranger can say what they are buying",
    "I can say when the job is finished",
    "I can say the price out loud without inventing a discount",
    "The build, if they want it, is a second yes",
    "I am not listing every skill I have",
  ];
  const words = sentence.trim();
  const ands = (words.match(/\band\b/gi) ?? []).length;
  const reasons: string[] = [];
  if (words.length < 20) reasons.push("The sentence is still too thin to picture a Tuesday.");
  if (words.length > 240) reasons.push("It is too long for a phone. Cut it to one breath.");
  if (ands > 2) reasons.push("Too many “ands.” Each one is probably a second offer.");
  flags.forEach((on, index) => {
    if (!on) reasons.push(prompts[index] ?? "");
  });
  const clear = reasons.length === 0;
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="font-display text-xl text-ink">Is this offer clear?</h3>
      <label className="mt-3 block text-sm font-semibold text-ink" htmlFor="offer-sentence">
        Say the offer in one sentence
        <textarea
          id="offer-sentence"
          value={sentence}
          onChange={(event) => setSentence(event.target.value)}
          rows={3}
          placeholder="Half a day on the named stretch, then a short note and a price."
          className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-base font-normal text-ink placeholder:text-muted"
        />
      </label>
      <ul className="mt-3 space-y-2">
        {prompts.map((prompt, index) => (
          <li key={prompt}>
            <label className="flex min-h-12 items-center gap-3 text-base text-ink">
              <input
                type="checkbox"
                className="size-5 accent-brass"
                checked={flags[index]}
                onChange={() =>
                  setFlags((current) => current.map((value, cursor) => (cursor === index ? !value : value)))
                }
              />
              {prompt}
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-base leading-relaxed text-ink">
        {clear ? "Clear enough to send. Stop talking after you send it." : `Still foggy. ${reasons[0]}`}
      </p>
    </div>
  );
}

function TrailLog({ onKeep }: { onKeep: (line: string) => void }) {
  const [date, setDate] = useState("");
  const [segment, setSegment] = useState("");
  const [did, setDid] = useState("Drainage");
  const [watch, setWatch] = useState("");
  const [kept, setKept] = useState(false);
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="font-display text-xl text-ink">A trail log that fits on a phone</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Four fields. No account. Keeping an entry writes one line into the notes under Try this.
      </p>
      <div className="mt-3 space-y-2">
        <label className="block text-sm font-semibold text-ink" htmlFor="log-date">
          Date
          <input id="log-date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-line bg-canvas px-3 text-base font-normal text-ink" />
        </label>
        <label className="block text-sm font-semibold text-ink" htmlFor="log-segment">
          Segment
          <input id="log-segment" value={segment} onChange={(event) => setSegment(event.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-line bg-canvas px-3 text-base font-normal text-ink" />
        </label>
        <label className="block text-sm font-semibold text-ink" htmlFor="log-did">
          What you did
          <select id="log-did" value={did} onChange={(event) => setDid(event.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-line bg-canvas px-3 text-base font-normal text-ink">
            <option>Drainage</option>
            <option>Edge</option>
            <option>Brush</option>
            <option>Looked only</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-ink" htmlFor="log-watch">
          Watch next time
          <input id="log-watch" value={watch} onChange={(event) => setWatch(event.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-line bg-canvas px-3 text-base font-normal text-ink" />
        </label>
      </div>
      <Button
        className="mt-3"
        onClick={() => {
          const line = `${date || "undated"} · ${segment || "unnamed"} · ${did} · next: ${watch || "nothing noted"}`;
          onKeep(line);
          setKept(true);
          setWatch("");
        }}
      >
        Keep this entry
      </Button>
      {kept ? <p className="mt-2 text-sm text-muted">Added to the try-this notes on this phone.</p> : null}
    </div>
  );
}

function SequenceCard({ item }: { item: InteractiveElement }) {
  const steps = item.steps ?? [];
  const [index, setIndex] = useState(0);
  const step = steps[index];
  if (!step) return <UnknownCard item={item} />;
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="font-display text-xl text-ink">{item.title ?? "Step through"}</h3>
      <p className="mt-2 text-sm tabular-nums text-muted">
        Step {index + 1} of {steps.length}
      </p>
      <p className="mt-2 font-semibold text-ink">{step.title}</p>
      <p className="mt-1 text-base leading-relaxed text-ink">{step.body}</p>
      <div className="mt-3 flex gap-2">
        <Button variant="ghost" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>
          Back
        </Button>
        <Button variant="ghost" disabled={index === steps.length - 1} onClick={() => setIndex((value) => value + 1)}>
          Next step
        </Button>
      </div>
    </div>
  );
}

function BeforeAfter({ item }: { item: InteractiveElement }) {
  const steps = item.steps ?? [];
  const [after, setAfter] = useState(false);
  const step = steps[after ? 1 : 0] ?? steps[0];
  if (!step) return <UnknownCard item={item} />;
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="font-display text-xl text-ink">{item.title ?? "Before and after"}</h3>
      <div className="mt-3 flex gap-2">
        <button type="button" aria-pressed={!after} onClick={() => setAfter(false)} className={cx("min-h-11 rounded-full px-3 text-sm font-semibold", !after ? "bg-brass text-brass-ink" : "border border-line text-ink")}>
          {steps[0]?.title ?? "Before"}
        </button>
        <button type="button" aria-pressed={after} onClick={() => setAfter(true)} className={cx("min-h-11 rounded-full px-3 text-sm font-semibold", after ? "bg-brass text-brass-ink" : "border border-line text-ink")}>
          {steps[1]?.title ?? "After"}
        </button>
      </div>
      <p className="mt-3 text-base leading-relaxed text-ink">{step.body}</p>
    </div>
  );
}

function UnknownCard({ item }: { item: InteractiveElement }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="font-display text-xl text-ink">{item.title ?? item.kind}</h3>
      {item.note ? <p className="mt-2 text-base leading-relaxed text-ink">{item.note}</p> : null}
      {item.steps?.map((step) => (
        <div key={step.title} className="mt-3">
          <p className="font-semibold text-ink">{step.title}</p>
          <p className="text-base leading-relaxed text-ink">{step.body}</p>
        </div>
      ))}
      <p className="mt-3 text-sm text-muted">
        This phone does not have a custom plate for “{item.kind}” yet. The note above is still part of the lesson.
      </p>
    </div>
  );
}

function ToolCard({ item, onKeep }: { item: InteractiveElement; onKeep: (line: string) => void }) {
  if (item.kind === "outslope-visual") return <OutslopeTool />;
  if (item.kind === "fence-helper") return <FenceHelper />;
  if (item.kind === "waterbar-spacing") return <WaterbarSpacing />;
  if (item.kind === "solar-decision") return <SolarDecision />;
  if (item.kind === "offer-check") return <OfferCheck />;
  if (item.kind === "trail-log") return <TrailLog onKeep={onKeep} />;
  if (item.kind === "sequence") return <SequenceCard item={item} />;
  if (item.kind === "before-after") return <BeforeAfter item={item} />;
  if (DIAGRAM_KINDS.has(item.kind)) return null;
  return <UnknownCard item={item} />;
}

function Checks({
  lesson,
  done,
  ready,
}: {
  lesson: LessonView;
  done: Record<string, string>;
  ready: boolean;
}) {
  const checks = lesson.fieldChecks ?? [];
  if (checks.length === 0) return null;
  const finished = checks.filter((check) => done[check.id]).length;
  return (
    <div>
      <h3 className="font-display text-xl text-ink">Checklist</h3>
      <p className="mt-1 text-sm tabular-nums text-muted">
        {finished} of {checks.length} marked on this phone
      </p>
      <ul className="mt-3 space-y-2">
        {checks.map((check) => (
          <li key={check.id}>
            <label className="flex min-h-12 items-start gap-3 rounded-xl border border-line px-3 py-2 text-base text-ink">
              <input
                type="checkbox"
                className="mt-1 size-5 accent-brass"
                disabled={!ready}
                checked={Boolean(done[check.id])}
                onChange={(event) => setFieldCheck(lesson.id, check.id, event.target.checked)}
              />
              <span>{check.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TryThisCard({
  lesson,
  saved,
  ready,
  onRegister,
}: {
  lesson: LessonView;
  saved: string;
  ready: boolean;
  onRegister: (append: (line: string) => void) => void;
}) {
  const task = lesson.tryThis;
  const [draft, setDraft] = useState(saved);
  const dirty = useRef(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  useEffect(() => {
    dirty.current = false;
  }, [lesson.id]);
  useEffect(() => {
    if (!ready || dirty.current) {
      if (ready && dirty.current) setTryNotes(lesson.id, draftRef.current);
      return;
    }
    setDraft(saved);
  }, [ready, lesson.id, saved]);
  useEffect(() => {
    if (!dirty.current) return;
    const timer = window.setTimeout(() => setTryNotes(lesson.id, draft), 400);
    return () => window.clearTimeout(timer);
  }, [draft, lesson.id]);
  useEffect(() => {
    onRegister((line) => {
      dirty.current = true;
      setDraft((current) => (current.trim() ? `${current.trim()}\n${line}` : line));
    });
  }, [onRegister, lesson.id]);
  if (!task) return null;
  return (
    <div>
      <h3 className="font-display text-xl text-ink">Try this · {task.minutes} minutes</h3>
      <p className="mt-1 font-semibold text-ink">{task.title}</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-base leading-relaxed text-ink">
        {task.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <label className="mt-3 block text-sm font-semibold text-ink" htmlFor={`try-${lesson.id}`}>
        What you saw
        <textarea
          id={`try-${lesson.id}`}
          value={draft}
          rows={4}
          placeholder="Jot the measurement or the thing you noticed. Kept on this phone."
          onChange={(event) => {
            dirty.current = true;
            setDraft(event.target.value);
          }}
          className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-base font-normal leading-relaxed text-ink placeholder:text-muted"
        />
      </label>
    </div>
  );
}

function shuffleOrder(count: number): number[] {
  const order = Array.from({ length: count }, (_, index) => index);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = order[index] ?? index;
    order[index] = order[swap] ?? swap;
    order[swap] = current;
  }
  if (order.length > 1 && order.every((value, index) => value === index)) {
    const first = order[0] ?? 0;
    order[0] = order[1] ?? 1;
    order[1] = first;
  }
  return order;
}

function QuizBlock({
  lesson,
  lastScore,
  onScored,
}: {
  lesson: LessonView;
  lastScore: LessonProgress["quizScore"];
  onScored?: (result: { correct: number; total: number }) => void;
}) {
  const questions = lesson.quiz ?? [];
  const [responses, setResponses] = useState<Record<number, QuizResponse>>(() => {
    const seeded: Record<number, QuizResponse> = {};
    questions.forEach((question, index) => {
      if (question.kind === "order") seeded[index] = { order: shuffleOrder(question.options.length) };
    });
    return seeded;
  });
  const [submitted, setSubmitted] = useState(false);

  if (questions.length === 0) return null;
  const ready = questions.every((question, index) => {
    const response = responses[index];
    if (question.kind === "order") return (response?.order?.length ?? 0) === question.options.length;
    return response?.choice !== undefined;
  });
  const grade = submitted ? gradeQuiz(questions, responses) : null;

  function move(questionIndex: number, from: number, direction: number) {
    if (submitted) return;
    setResponses((current) => {
      const order = (current[questionIndex]?.order ?? []).slice();
      const target = from + direction;
      if (target < 0 || target >= order.length) return current;
      const swap = order[target];
      order[target] = order[from] ?? from;
      order[from] = swap ?? target;
      return { ...current, [questionIndex]: { order } };
    });
  }

  return (
    <Block kicker="Check" title="Check yourself">
      {lastScore ? (
        <p className="text-sm tabular-nums text-muted">
          Last score {lastScore.correct}/{lastScore.total}
        </p>
      ) : (
        <p className="text-base text-muted">Answer, then read why. The score stays on this phone.</p>
      )}
      <ol className="space-y-6">
        {questions.map((question, questionIndex) => (
          <li key={question.question}>
            <Question
              lessonId={lesson.id}
              question={question}
              index={questionIndex}
              response={responses[questionIndex]}
              submitted={submitted}
              onChoice={(choice) =>
                setResponses((current) => ({ ...current, [questionIndex]: { ...current[questionIndex], choice } }))
              }
              onMove={(from, direction) => move(questionIndex, from, direction)}
            />
          </li>
        ))}
      </ol>
      <div className={submitted ? "space-y-2" : "flex flex-wrap gap-2"}>
        {!submitted || !grade ? (
          <Button
            disabled={!ready}
            onClick={() => {
              const result = gradeQuiz(questions, responses);
              setSubmitted(true);
              setQuizScore(lesson.id, result.correct, result.total);
              onScored?.(result);
            }}
          >
            Score it
          </Button>
        ) : (
          <>
            <p className="font-display text-5xl tabular-nums text-ink">
              {grade.correct}/{grade.total}
            </p>
            <p className="text-base tabular-nums text-muted">
              {Math.round((grade.correct / Math.max(grade.total, 1)) * 100)}%
            </p>
            <p className="max-w-sm text-lg leading-snug text-ink">{scoreNote(grade.correct, grade.total)}</p>
            <Button
              variant="ghost"
              onClick={() => {
                const seeded: Record<number, QuizResponse> = {};
                questions.forEach((question, index) => {
                  if (question.kind === "order") seeded[index] = { order: shuffleOrder(question.options.length) };
                });
                setResponses(seeded);
                setSubmitted(false);
              }}
            >
              Try again
            </Button>
          </>
        )}
      </div>
    </Block>
  );
}

function Question({
  lessonId,
  question,
  index,
  response,
  submitted,
  onChoice,
  onMove,
}: {
  lessonId: string;
  question: QuizQuestion;
  index: number;
  response: QuizResponse | undefined;
  submitted: boolean;
  onChoice: (choice: number) => void;
  onMove: (from: number, direction: number) => void;
}) {
  const correct = submitted && questionIsCorrect(question, response);
  const kindLabel =
    question.kind === "order" ? "Put in order" : question.kind === "truefalse" ? "True or false" : question.kind === "spot" ? "Spot the problem" : null;
  return (
    <fieldset>
      {kindLabel ? <p className="text-sm font-semibold tracking-wide text-brass uppercase">{kindLabel}</p> : null}
      {question.kind === "spot" && question.figure ? (
        <div className="mt-2">
          <QuizFigure figure={question.figure} />
        </div>
      ) : null}
      <legend className="mt-2 text-lg font-semibold text-ink">{question.question}</legend>
      {question.kind === "order" ? (
        <ol className="mt-3 space-y-2">
          {(response?.order ?? []).map((optionIndex, position) => {
            const label = question.options[optionIndex] ?? "";
            const placed = submitted && optionIndex === position;
            return (
              <li key={label} className={cx("flex items-center gap-2 rounded-xl border px-2 py-1", placed ? "border-brass" : "border-line")}>
                <span className="w-6 text-center text-sm tabular-nums text-muted">{position + 1}</span>
                <span className="flex-1 text-base text-ink">{label}</span>
                <button type="button" className="min-h-11 min-w-11 text-sm font-semibold text-ink" disabled={submitted || position === 0} onClick={() => onMove(position, -1)} aria-label={`Move up: ${label}`}>
                  Up
                </button>
                <button type="button" className="min-h-11 min-w-11 text-sm font-semibold text-ink" disabled={submitted || position === question.options.length - 1} onClick={() => onMove(position, 1)} aria-label={`Move down: ${label}`}>
                  Down
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="mt-3 space-y-2">
          {question.options.map((option, optionIndex) => {
            const selected = response?.choice === optionIndex;
            const isAnswer = optionIsCorrect(question, optionIndex);
            let mark = "";
            if (submitted && isAnswer) mark = "Answer";
            else if (submitted && selected && !isAnswer) mark = "Not quite";
            return (
              <label key={option} className={cx("flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-base", selected ? "border-brass bg-elevated" : "border-line", submitted && isAnswer && "border-brass")}>
                <input
                  type="radio"
                  name={`${lessonId}-${index}`}
                  className="size-5 accent-brass"
                  checked={selected}
                  onChange={() => {
                    if (!submitted) onChoice(optionIndex);
                  }}
                />
                <span className="flex-1 text-ink">{option}</span>
                {mark ? <span className="text-sm font-semibold text-brass">{mark}</span> : null}
              </label>
            );
          })}
        </div>
      )}
      {submitted && question.explanation ? (
        <p className="mt-2 text-base leading-relaxed text-ink">{correct ? "Yes. " : "Not quite. "}{question.explanation}</p>
      ) : null}
    </fieldset>
  );
}

function NotesBlock({ lessonId, saved, ready }: { lessonId: string; saved: string; ready: boolean }) {
  const [draft, setDraft] = useState(saved);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const dirty = useRef(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  useEffect(() => {
    dirty.current = false;
  }, [lessonId]);
  useEffect(() => {
    if (!ready || dirty.current) {
      if (ready && dirty.current) setNotes(lessonId, draftRef.current);
      return;
    }
    setDraft(saved);
  }, [ready, lessonId, saved]);
  useEffect(() => {
    if (!dirty.current) return;
    const timer = window.setTimeout(() => {
      setNotes(lessonId, draft);
      setStatus("saved");
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draft, lessonId]);
  return (
    <section className="mt-8">
      <label htmlFor="field-notes" className="font-display text-2xl text-ink">
        Field notes
      </label>
      <textarea
        id="field-notes"
        value={draft}
        onChange={(event) => {
          dirty.current = true;
          setStatus("idle");
          setDraft(event.target.value);
        }}
        rows={5}
        placeholder="What you saw on the ground. Kept on this phone."
        className="mt-3 min-h-32 w-full rounded-xl border border-line bg-surface px-4 py-3 text-lg leading-relaxed text-ink placeholder:text-muted"
      />
      <p className="mt-2 text-sm text-muted">{status === "saved" ? "Saved on this phone." : "Only you can read this."}</p>
    </section>
  );
}

export function LessonBody({
  lesson,
  record,
  ready,
  onScored,
}: {
  lesson: LessonView;
  record: LessonProgress;
  ready: boolean;
  onScored?: (result: { correct: number; total: number }) => void;
}) {
  const usedDiagrams = new Set<string>();
  const plates: ReactNode[] = [];
  for (const plate of lesson.illustrations ?? []) {
    const kind = diagramKindForType(plate.type);
    if (kind) {
      usedDiagrams.add(kind);
      plates.push(<Diagram key={`${plate.type}-${plate.caption}`} kind={kind} alt={plate.alt} caption={plate.caption} />);
    } else if (plate.src) {
      plates.push(<PhotoPlate key={plate.src} plate={plate} />);
    } else {
      plates.push(<DescribedPlate key={plate.caption} plate={plate} />);
    }
  }
  for (const item of lesson.interactiveElements ?? []) {
    if (DIAGRAM_KINDS.has(item.kind) && !usedDiagrams.has(item.kind)) {
      usedDiagrams.add(item.kind);
      plates.push(
        <Diagram key={item.id} kind={item.kind} alt={item.title ?? item.kind} caption={item.note ?? item.title ?? "Interactive plate"} />,
      );
    }
  }
  const tools = (lesson.interactiveElements ?? []).filter((item) => !DIAGRAM_KINDS.has(item.kind));
  const hasField = tools.length > 0 || (lesson.fieldChecks?.length ?? 0) > 0 || Boolean(lesson.tryThis);
  const appendTry = useRef<(line: string) => void>(() => {});
  const registerAppend = useRef((append: (line: string) => void) => {
    appendTry.current = append;
  });

  return (
    <>
      <section className="mt-8">
        <p className="text-sm font-semibold tracking-wide text-brass uppercase">On the ground</p>
        <div className="mt-3">
          <Markdown source={lesson.content} />
        </div>
      </section>

      {plates.length > 0 || (lesson.videos?.length ?? 0) > 0 ? (
        <Block kicker="Look" title="See it">
          {plates}
          {(lesson.videos ?? []).map((video) => (
            <VideoCard key={video.title} {...video} />
          ))}
        </Block>
      ) : null}

      <HowWeKnowCard lesson={lesson} />

      {hasField ? (
        <Block kicker="Use it" title="Field application">
          {tools.map((item) => (
            <ToolCard key={item.id} item={item} onKeep={(line) => appendTry.current(line)} />
          ))}
          <Checks lesson={lesson} done={record.fieldChecks} ready={ready} />
          <TryThisCard lesson={lesson} saved={record.tryNotes} ready={ready} onRegister={registerAppend.current} />
        </Block>
      ) : null}

      <section className="mt-8 rounded-2xl border border-line bg-surface p-4">
        <h2 className="font-display text-2xl text-ink">In your pocket</h2>
        <ul className="mt-3 space-y-3">
          {lesson.keyPoints.map((point) => (
            <li key={point} className="flex gap-3 text-lg leading-relaxed text-ink">
              <span className="mt-2 size-2 shrink-0 rounded-full bg-brass" aria-hidden />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </section>

      <QuizBlock key={lesson.id} lesson={lesson} lastScore={record.quizScore} onScored={onScored} />

      {lesson.resources.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-2xl text-ink">Keep nearby</h2>
          <ul className="mt-3 space-y-3">
            {lesson.resources.map((resource) => (
              <li key={resource.title} className="rounded-2xl border border-line px-4 py-3">
                {resource.url ? (
                  <a href={resource.url} target="_blank" rel="noreferrer" className="font-semibold text-ink underline decoration-brass underline-offset-2">
                    {resource.title}
                  </a>
                ) : (
                  <p className="font-semibold text-ink">{resource.title}</p>
                )}
                {resource.note ? <p className="mt-1 text-base leading-relaxed text-muted">{resource.note}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <NotesBlock lessonId={lesson.id} saved={record.notes} ready={ready} />
    </>
  );
}
