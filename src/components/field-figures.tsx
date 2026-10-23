import { useState, type ReactNode } from "react";
import type { Illustration } from "@/lib/domain";
import { cx } from "@/components/ui";

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cx(
        "min-h-11 rounded-full px-3 text-sm font-semibold",
        pressed ? "bg-brass text-brass-ink" : "border border-line bg-transparent text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Plate({
  kicker = "Field plate",
  alt,
  caption,
  controls,
  note,
  children,
}: {
  kicker?: string;
  alt: string;
  caption: string;
  controls?: ReactNode;
  note?: string | null;
  children: ReactNode;
}) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-3 py-2">
        <p className="text-sm font-semibold tracking-wide text-brass uppercase">{kicker}</p>
      </div>
      <svg viewBox="0 0 420 250" role="img" aria-label={alt} className="plate-svg">
        <defs>
          <marker id="flow-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill="var(--sp-water)" />
          </marker>
          <marker id="load-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill="var(--sp-brass)" />
          </marker>
        </defs>
        {children}
      </svg>
      {controls ? <div className="flex flex-wrap gap-2 px-3 pt-3">{controls}</div> : null}
      {note ? (
        <p className="px-3 pt-3 text-base leading-relaxed text-ink" aria-live="polite">
          {note}
        </p>
      ) : null}
      <figcaption className="px-3 py-3 text-sm leading-relaxed text-muted">{caption}</figcaption>
    </figure>
  );
}

function spotButton(active: boolean, label: string, onClick: () => void) {
  return (
    <Chip pressed={active} onClick={onClick}>
      {label}
    </Chip>
  );
}

export function TrailSection({
  alt,
  caption,
  locked,
  compact = false,
}: {
  alt: string;
  caption: string;
  locked?: "shed" | "berm";
  compact?: boolean;
}) {
  const [mode, setMode] = useState<"shed" | "berm">(locked ?? "shed");
  const [flow, setFlow] = useState(locked === "berm");
  const [backslope, setBackslope] = useState(true);
  const [spot, setSpot] = useState<string | null>(locked === "berm" ? "berm" : "tread");
  const shown = locked ?? mode;
  const berm = shown === "berm";

  const notes: Record<string, string> = {
    tread: "The tread is the walking surface. It should fall a little toward the downhill side — barely enough to feel.",
    edge: "The downhill lip has to be the low side. If it stands up, water cannot leave.",
    backslope: "A raw vertical cut keeps feeding soil onto the path. Knock the top back when you can.",
    berm: "That ridge is a dam. Water turns and runs down the trail, cuts a rut, and the edge slumps into it.",
  };

  return (
    <Plate
      alt={alt}
      caption={caption}
      note={spot ? notes[spot] : "Tap a part of the slice."}
      controls={
        compact
          ? null
          : (
            <>
              <Chip pressed={shown === "shed" && !locked} onClick={() => setMode("shed")}>
                Outslope
              </Chip>
              <Chip pressed={berm} onClick={() => setMode("berm")}>
                Berm failure
              </Chip>
              <Chip pressed={flow} onClick={() => setFlow((value) => !value)}>
                Show drainage path
              </Chip>
              <Chip pressed={backslope} onClick={() => setBackslope((value) => !value)}>
                Show backslope
              </Chip>
              {spotButton(spot === "tread", "Tread", () => setSpot("tread"))}
              {spotButton(spot === "edge", "Downhill edge", () => setSpot("edge"))}
              {spotButton(spot === "berm", "Berm", () => setSpot("berm"))}
            </>
          )
      }
    >
      <rect width="420" height="250" fill="var(--sp-canvas)" />
      <path d="M0 118 C90 78 180 130 420 96 L420 250 L0 250 Z" fill="var(--sp-soil)" />
      {backslope ? (
        <path
          d="M0 176 L86 112 L118 176 Z"
          fill="var(--sp-elevated)"
          stroke={spot === "backslope" ? "var(--sp-brass)" : "var(--sp-ink)"}
          strokeWidth={spot === "backslope" ? 3 : 1.5}
        />
      ) : null}
      {berm ? (
        <path
          d="M96 162 C150 188 190 196 230 178 C270 156 310 142 348 168 L348 198 C300 176 250 198 190 214 C140 196 110 186 96 190 Z"
          fill="var(--sp-elevated)"
          stroke={spot === "tread" || spot === "berm" ? "var(--sp-brass)" : "var(--sp-ink)"}
          strokeWidth="2.5"
        />
      ) : (
        <path
          d="M96 156 L346 184 L346 214 L96 186 Z"
          fill="var(--sp-elevated)"
          stroke={spot === "tread" ? "var(--sp-brass)" : "var(--sp-ink)"}
          strokeWidth="2.5"
        />
      )}
      <line
        x1="330"
        y1="150"
        x2="330"
        y2="230"
        stroke={spot === "edge" ? "var(--sp-brass)" : "var(--sp-muted)"}
        strokeDasharray="4 4"
      />
      {flow && !berm ? (
        <g>
          <path d="M120 148 C180 158 250 168 360 196" fill="none" stroke="var(--sp-water)" strokeWidth="3" markerEnd="url(#flow-arrow)" />
          <path d="M150 142 C210 152 270 162 380 198" fill="none" stroke="var(--sp-water)" strokeWidth="2" markerEnd="url(#flow-arrow)" />
        </g>
      ) : null}
      {flow && berm ? (
        <g>
          <path d="M140 168 C190 188 220 186 250 170" fill="none" stroke="var(--sp-water)" strokeWidth="3" />
          <path d="M250 170 L250 214" fill="none" stroke="var(--sp-water)" strokeWidth="3" markerEnd="url(#flow-arrow)" />
          <text x="258" y="208" fill="var(--sp-water)" fontSize="13">
            down the trail
          </text>
        </g>
      ) : null}
      <text x="150" y="32" fill="var(--sp-ink)" fontSize="14">
        Uphill
      </text>
      <text x="300" y="32" fill="var(--sp-ink)" fontSize="14">
        Downhill
      </text>
      <text x="140" y="242" fill="var(--sp-muted)" fontSize="13">
        {berm ? "Water is trapped, then it runs the length of the path." : "Water sheets across and leaves."}
      </text>
    </Plate>
  );
}

export function WaterbarSection({
  alt,
  caption,
  locked,
  compact = false,
}: {
  alt: string;
  caption: string;
  locked?: "angle" | "square";
  compact?: boolean;
}) {
  const [mode, setMode] = useState<"angle" | "square">(locked ?? "angle");
  const [spot, setSpot] = useState<string>("outlet");
  const shown = locked ?? mode;
  const notes: Record<string, string> = {
    outlet: "The outlet has to be lower than the trail and not blocked by the soil you just dug.",
    bar: shown === "square"
      ? "A bar square across the trail makes water turn too hard. It clogs, or people walk around it."
      : "Aim the bar at about 45 degrees or steeper so water is already leaving as it meets the bar.",
    anchor: "Seat the uphill end into the cut bank. A short bar gets installed too square, and then it clogs.",
  };
  return (
    <Plate
      kicker="Plan view"
      alt={alt}
      caption={caption}
      note={notes[spot]}
      controls={
        compact
          ? null
          : (
            <>
              <Chip pressed={shown === "angle"} onClick={() => setMode("angle")}>
                45° or steeper
              </Chip>
              <Chip pressed={shown === "square"} onClick={() => setMode("square")}>
                Square bar
              </Chip>
              {spotButton(spot === "bar", "The bar", () => setSpot("bar"))}
              {spotButton(spot === "outlet", "Outlet", () => setSpot("outlet"))}
              {spotButton(spot === "anchor", "Cut-bank end", () => setSpot("anchor"))}
            </>
          )
      }
    >
      <rect width="420" height="250" fill="var(--sp-canvas)" />
      <rect x="150" y="24" width="120" height="200" rx="6" fill="var(--sp-elevated)" stroke="var(--sp-line)" />
      <text x="168" y="44" fill="var(--sp-muted)" fontSize="13">
        Uphill
      </text>
      <text x="24" y="130" fill="var(--sp-ink)" fontSize="13">
        Downhill side
      </text>
      {shown === "square" ? (
        <line x1="150" y1="140" x2="270" y2="140" stroke="var(--sp-brass)" strokeWidth={spot === "bar" ? 8 : 6} />
      ) : (
        <line x1="150" y1="176" x2="270" y2="96" stroke="var(--sp-brass)" strokeWidth={spot === "bar" ? 8 : 6} />
      )}
      <circle cx="168" cy="170" r={spot === "anchor" ? 8 : 5} fill="var(--sp-ink)" />
      <path
        d="M200 60 L200 110"
        fill="none"
        stroke="var(--sp-water)"
        strokeWidth="3"
        markerEnd="url(#flow-arrow)"
      />
      {shown === "angle" ? (
        <path d="M188 130 L70 168" fill="none" stroke="var(--sp-water)" strokeWidth="3" markerEnd="url(#flow-arrow)" />
      ) : (
        <path d="M200 128 C200 150 180 160 170 168" fill="none" stroke="var(--sp-water)" strokeWidth="3" />
      )}
      <circle
        cx="64"
        cy="176"
        r={spot === "outlet" ? 10 : 6}
        fill="none"
        stroke="var(--sp-water)"
        strokeWidth="2"
      />
      <text x="150" y="240" fill="var(--sp-muted)" fontSize="13">
        {shown === "square" ? "Water stalls and drops its sediment on the bar." : "Water is already sliding off when it meets the bar."}
      </text>
    </Plate>
  );
}

export function FenceSection({
  alt,
  caption,
  locked,
  compact = false,
}: {
  alt: string;
  caption: string;
  locked?: "brace" | "lean";
  compact?: boolean;
}) {
  const [mode, setMode] = useState<"brace" | "lean">(locked ?? "brace");
  const [rot, setRot] = useState(true);
  const [load, setLoad] = useState(true);
  const [spot, setSpot] = useState("ground");
  const shown = locked ?? mode;
  const notes: Record<string, string> = {
    ground: "Wood usually fails in this band, where moisture and air meet. Look here first, not at the top.",
    brace: "The rail is in compression. The diagonal is in tension and drives the end post down into the hole.",
    wire: "Line wire pulls along the fence. A single unbraced post cannot hold that pull.",
  };
  return (
    <Plate
      alt={alt}
      caption={caption}
      note={notes[spot]}
      controls={
        compact
          ? null
          : (
            <>
              <Chip pressed={shown === "brace"} onClick={() => setMode("brace")}>
                H-brace
              </Chip>
              <Chip pressed={shown === "lean"} onClick={() => setMode("lean")}>
                No brace
              </Chip>
              <Chip pressed={rot} onClick={() => setRot((value) => !value)}>
                Show ground line
              </Chip>
              <Chip pressed={load} onClick={() => setLoad((value) => !value)}>
                Show load path
              </Chip>
              {spotButton(spot === "ground", "Ground line", () => setSpot("ground"))}
              {spotButton(spot === "brace", "Brace", () => setSpot("brace"))}
              {spotButton(spot === "wire", "Wire pull", () => setSpot("wire"))}
            </>
          )
      }
    >
      <rect width="420" height="250" fill="var(--sp-canvas)" />
      <rect x="0" y="176" width="420" height="74" fill="var(--sp-soil)" />
      {rot ? (
        <g>
          <line x1="0" y1="176" x2="420" y2="176" stroke="var(--sp-brass)" strokeWidth={spot === "ground" ? 3 : 1.5} />
          <text x="12" y="168" fill="var(--sp-brass)" fontSize="13">
            Ground line — rot starts here
          </text>
        </g>
      ) : null}
      {shown === "brace" ? (
        <g>
          <rect x="86" y="70" width="26" height="150" rx="3" fill="var(--sp-elevated)" stroke="var(--sp-ink)" />
          <rect x="250" y="48" width="28" height="172" rx="3" fill="var(--sp-elevated)" stroke={spot === "brace" ? "var(--sp-brass)" : "var(--sp-ink)"} strokeWidth="2" />
          <rect x="112" y="108" width="140" height="16" rx="3" fill="var(--sp-elevated)" stroke="var(--sp-ink)" />
          <line x1="99" y1="78" x2="268" y2="168" stroke="var(--sp-ink)" strokeWidth="3" />
          {load ? (
            <g>
              <path d="M292 70 L360 70" fill="none" stroke="var(--sp-brass)" strokeWidth="3" markerEnd="url(#load-arrow)" />
              <text x="300" y="62" fill="var(--sp-brass)" fontSize="13">
                Wire pull
              </text>
              <path d="M264 160 L264 200" fill="none" stroke="var(--sp-brass)" strokeWidth="3" markerEnd="url(#load-arrow)" />
            </g>
          ) : null}
          <text x="118" y="102" fill="var(--sp-muted)" fontSize="12">
            Rail, compression
          </text>
          <text x="70" y="40" fill="var(--sp-muted)" fontSize="12">
            Brace post
          </text>
          <text x="236" y="40" fill="var(--sp-muted)" fontSize="12">
            End post
          </text>
        </g>
      ) : (
        <g>
          <g transform="rotate(8 200 176)">
            <rect x="188" y="48" width="26" height="160" rx="3" fill="var(--sp-elevated)" stroke="var(--sp-brass)" strokeWidth="2" />
          </g>
          {load ? (
            <path d="M230 70 L340 90" fill="none" stroke="var(--sp-brass)" strokeWidth="3" markerEnd="url(#load-arrow)" />
          ) : null}
          <text x="250" y="60" fill="var(--sp-brass)" fontSize="14">
            Leans within a season
          </text>
        </g>
      )}
    </Plate>
  );
}

export function StreamSection({
  alt,
  caption,
  locked,
  compact = false,
}: {
  alt: string;
  caption: string;
  locked?: "low" | "bankfull";
  compact?: boolean;
}) {
  const [mode, setMode] = useState<"low" | "bankfull">(locked ?? "low");
  const [spot, setSpot] = useState("cut");
  const high = (locked ?? mode) === "bankfull";
  const notes: Record<string, string> = {
    cut: "The outside bank takes the energy. A fresh vertical face with roots showing is a bank that is still moving.",
    bar: "The inside of a bend collects gravel. A firm bar is not the same thing as a safe ford.",
    bed: "Read the bed on a calm day: firm, or mud, or rolling cobble you cannot trust.",
    debris: "Leaves and sticks caught in the shrubs are the stream telling you how high it already went.",
    full: "Bankfull fills the groove before it spills onto the flatter ground. Design for that shape, not for today's trickle.",
  };
  return (
    <Plate
      alt={alt}
      caption={caption}
      note={notes[spot]}
      controls={
        compact
          ? null
          : (
            <>
              <Chip pressed={!high} onClick={() => setMode("low")}>
                Calm day
              </Chip>
              <Chip pressed={high} onClick={() => setMode("bankfull")}>
                Bankfull
              </Chip>
              {spotButton(spot === "cut", "Cut bank", () => setSpot("cut"))}
              {spotButton(spot === "bar", "Gravel bar", () => setSpot("bar"))}
              {spotButton(spot === "debris", "Debris line", () => setSpot("debris"))}
              {spotButton(spot === "full", "Bankfull", () => setSpot("full"))}
            </>
          )
      }
    >
      <rect width="420" height="250" fill="var(--sp-canvas)" />
      <path d="M0 70 L120 90 L150 200 L0 220 Z" fill="var(--sp-soil)" stroke={spot === "cut" ? "var(--sp-brass)" : "var(--sp-ink)"} strokeWidth="2" />
      <path d="M150 200 L230 210 L300 160 L420 150 L420 250 L150 250 Z" fill="var(--sp-elevated)" stroke={spot === "bar" ? "var(--sp-brass)" : "none"} />
      <path
        d={high ? "M150 150 C220 146 300 140 420 148 L420 210 L230 210 L150 200 Z" : "M168 196 C230 200 300 188 400 192 L400 214 L230 214 L168 206 Z"}
        fill="var(--sp-water)"
        opacity="0.85"
      />
      <path d="M40 78 C70 70 100 86 130 80" fill="none" stroke="var(--sp-ink)" strokeWidth="1.5" />
      <text x="16" y="64" fill="var(--sp-ink)" fontSize="13">
        Cut bank
      </text>
      <text x="300" y="140" fill="var(--sp-ink)" fontSize="13">
        Gravel bar
      </text>
      {!high ? (
        <g>
          <path d="M20 118 H130" stroke="var(--sp-brass)" strokeDasharray="3 3" />
          <text x="16" y="112" fill="var(--sp-brass)" fontSize="12">
            Debris caught up here
          </text>
        </g>
      ) : (
        <text x="160" y="40" fill="var(--sp-water)" fontSize="14">
          Groove is full. Today's trickle was a lie.
        </text>
      )}
    </Plate>
  );
}

export function SolarSection({
  alt,
  caption,
  locked,
  compact = false,
}: {
  alt: string;
  caption: string;
  locked?: "fused" | "short";
  compact?: boolean;
}) {
  const [mode, setMode] = useState<"fused" | "short">(locked ?? "fused");
  const [spot, setSpot] = useState("fuse");
  const short = (locked ?? mode) === "short";
  const notes: Record<string, string> = {
    panel: "Treat a panel in daylight as live, cloud or not. Do not short the leads to test it.",
    controller: "The controller is where the battery chemistry gets its voltage. LiFePO4 is not a lead-acid setting.",
    fuse: "The fuse sits on the positive lead, close to the battery. It should open before the wire does.",
    battery: "Nameplate capacity is not usable capacity. Lead-acid that you want to keep gives you about half.",
    load: "Lights, a phone, a radio. A saw wants the truck, not this kit.",
  };
  const boxes = [
    { id: "panel", x: 16, label: "Panel" },
    { id: "controller", x: 100, label: "Control" },
    { id: "fuse", x: 184, label: "Fuse" },
    { id: "battery", x: 268, label: "Battery" },
    { id: "load", x: 348, label: "12V load" },
  ];
  return (
    <Plate
      alt={alt}
      caption={caption}
      note={short ? "An unfused short dumps the battery through whatever wire touched. That wire is now the fuse." : notes[spot]}
      controls={
        compact
          ? null
          : (
            <>
              <Chip pressed={!short} onClick={() => setMode("fused")}>
                Fused path
              </Chip>
              <Chip pressed={short} onClick={() => setMode("short")}>
                Show a short
              </Chip>
              {boxes.map((box) => (
                <Chip key={box.id} pressed={spot === box.id} onClick={() => setSpot(box.id)}>
                  {box.label}
                </Chip>
              ))}
            </>
          )
      }
    >
      <rect width="420" height="250" fill="var(--sp-canvas)" />
      {boxes.map((box) => (
        <g key={box.id}>
          <rect
            x={box.x}
            y="78"
            width="68"
            height="48"
            rx="8"
            fill="var(--sp-elevated)"
            stroke={spot === box.id ? "var(--sp-brass)" : "var(--sp-ink)"}
            strokeWidth={spot === box.id ? 3 : 1.5}
          />
          <text x={box.x + 8} y="106" fill="var(--sp-ink)" fontSize="12">
            {box.label}
          </text>
        </g>
      ))}
      <path d="M84 102 H100 M168 102 H184 M252 102 H268 M336 102 H348" stroke="var(--sp-ink)" strokeWidth="2" />
      {short ? (
        <path d="M50 126 C80 190 300 200 300 126" fill="none" stroke="var(--sp-brass)" strokeWidth="3" strokeDasharray="6 4" markerEnd="url(#load-arrow)" />
      ) : (
        <text x="16" y="180" fill="var(--sp-muted)" fontSize="14">
          Positive lead is fused at the battery. Polarity checked twice.
        </text>
      )}
      {short ? (
        <text x="16" y="220" fill="var(--sp-brass)" fontSize="14">
          Dashed path: the short. Nothing opens in time.
        </text>
      ) : null}
    </Plate>
  );
}

export function SpanSection({
  alt,
  caption,
  compact = false,
}: {
  alt: string;
  caption: string;
  compact?: boolean;
}) {
  const [load, setLoad] = useState(true);
  const [water, setWater] = useState(false);
  const [spot, setSpot] = useState("stringer");
  const notes: Record<string, string> = {
    deck: "People stand here. The deck is not the beam. It only passes the weight down.",
    stringer: "The stringers carry the span to the banks. If you cannot say what size and what species, you are not ready to build it.",
    abutment: "Each end has to sit on something that does not wash. A sill in the channel becomes debris.",
    water: "If the deck is in the path of high water, it is a dam waiting for a tree.",
  };
  return (
    <Plate
      alt={alt}
      caption={caption}
      note={notes[spot]}
      controls={
        compact
          ? null
          : (
            <>
              <Chip pressed={load} onClick={() => setLoad((value) => !value)}>
                Show load path
              </Chip>
              <Chip pressed={water} onClick={() => setWater((value) => !value)}>
                Show high water
              </Chip>
              {spotButton(spot === "deck", "Deck", () => setSpot("deck"))}
              {spotButton(spot === "stringer", "Stringer", () => setSpot("stringer"))}
              {spotButton(spot === "abutment", "Abutment", () => setSpot("abutment"))}
              {spotButton(spot === "water", "High water", () => setSpot("water"))}
            </>
          )
      }
    >
      <rect width="420" height="250" fill="var(--sp-canvas)" />
      <rect x="0" y="150" width="90" height="100" fill="var(--sp-soil)" />
      <rect x="330" y="150" width="90" height="100" fill="var(--sp-soil)" />
      <rect
        x="70"
        y="132"
        width="280"
        height="16"
        fill="var(--sp-elevated)"
        stroke={spot === "stringer" ? "var(--sp-brass)" : "var(--sp-ink)"}
        strokeWidth="2"
      />
      <rect
        x="78"
        y="116"
        width="264"
        height="14"
        fill="var(--sp-surface)"
        stroke={spot === "deck" ? "var(--sp-brass)" : "var(--sp-line)"}
      />
      <rect x="78" y="148" width="28" height="28" fill="var(--sp-elevated)" stroke={spot === "abutment" ? "var(--sp-brass)" : "var(--sp-ink)"} />
      <rect x="314" y="148" width="28" height="28" fill="var(--sp-elevated)" stroke={spot === "abutment" ? "var(--sp-brass)" : "var(--sp-ink)"} />
      {water ? <rect x="90" y="168" width="240" height="40" fill="var(--sp-water)" opacity="0.8" /> : <rect x="90" y="196" width="240" height="20" fill="var(--sp-water)" opacity="0.7" />}
      {load ? (
        <g>
          <path d="M210 70 L210 116" fill="none" stroke="var(--sp-brass)" strokeWidth="3" markerEnd="url(#load-arrow)" />
          <path d="M120 124 L92 160" fill="none" stroke="var(--sp-brass)" strokeWidth="2" markerEnd="url(#load-arrow)" />
          <path d="M300 124 L328 160" fill="none" stroke="var(--sp-brass)" strokeWidth="2" markerEnd="url(#load-arrow)" />
        </g>
      ) : null}
      <text x="150" y="40" fill="var(--sp-ink)" fontSize="14">
        {water ? "Deck is in the flood path." : "Weight goes to the banks, not into the water."}
      </text>
    </Plate>
  );
}

export function RootSection({
  alt,
  caption,
  locked,
  compact = false,
}: {
  alt: string;
  caption: string;
  locked?: "healthy" | "compacted";
  compact?: boolean;
}) {
  const [roots, setRoots] = useState(true);
  const [packed, setPacked] = useState(locked === "compacted");
  const [spot, setSpot] = useState(locked === "compacted" ? "pack" : "drip");
  const notes: Record<string, string> = {
    drip: "The drip line is about as wide as the canopy. Most of the fine roots that feed the tree are out here, not in a tight circle at the trunk.",
    trunk: "The trunk is the wrong place to judge the root zone. Damage shows up later, in the crown.",
    duff: "Leaf litter is the tree's mulch. It feeds the soil and keeps the surface from sealing shut.",
    pack: "Boot traffic and a parked wheelbarrow squeeze the air out. Roots need that air more than they need a deeper hole.",
  };
  return (
    <Plate
      alt={alt}
      caption={caption}
      note={notes[spot]}
      controls={
        compact
          ? null
          : (
            <>
              <Chip pressed={roots} onClick={() => setRoots((value) => !value)}>
                Show roots
              </Chip>
              <Chip pressed={packed} onClick={() => setPacked((value) => !value)}>
                Show compaction
              </Chip>
              {spotButton(spot === "drip", "Drip line", () => setSpot("drip"))}
              {spotButton(spot === "duff", "Duff", () => setSpot("duff"))}
              {spotButton(spot === "pack", "Packed soil", () => setSpot("pack"))}
            </>
          )
      }
    >
      <rect width="420" height="250" fill="var(--sp-canvas)" />
      <rect x="0" y="168" width="420" height="82" fill="var(--sp-soil)" />
      <path d="M210 168 C160 80 120 70 70 90 C130 60 180 74 210 100 C240 74 300 60 360 96 C300 70 250 86 210 168 Z" fill="var(--sp-leaf)" />
      <rect x="200" y="120" width="20" height="56" fill="var(--sp-elevated)" stroke="var(--sp-ink)" />
      <line x1="70" y1="40" x2="70" y2="168" stroke={spot === "drip" ? "var(--sp-brass)" : "var(--sp-muted)"} strokeDasharray="4 4" />
      <line x1="360" y1="40" x2="360" y2="168" stroke={spot === "drip" ? "var(--sp-brass)" : "var(--sp-muted)"} strokeDasharray="4 4" />
      {roots ? (
        <g fill="none" stroke="var(--sp-ink)" strokeWidth="2">
          <path d="M210 176 C180 190 120 196 70 188" />
          <path d="M210 176 C240 194 300 200 360 190" />
          <path d="M210 180 C190 210 150 214 110 206" />
        </g>
      ) : null}
      {!packed ? <rect x="40" y="160" width="150" height="12" fill="var(--sp-leaf)" opacity="0.8" /> : null}
      {packed ? <rect x="240" y="162" width="140" height="18" fill="var(--sp-elevated)" stroke="var(--sp-brass)" /> : null}
      <text x="78" y="28" fill="var(--sp-brass)" fontSize="13">
        Drip line
      </text>
      <text x="250" y="156" fill="var(--sp-ink)" fontSize="12">
        {packed ? "Air squeezed out" : "Duff still in place"}
      </text>
    </Plate>
  );
}

const KIND_FROM_TYPE: Record<string, string> = {
  "trail-cross-section": "trail-section",
  "trail-section": "trail-section",
  "waterbar-plan": "waterbar-plan",
  "fence-brace": "fence-system",
  "fence-system": "fence-system",
  "stream-channel": "stream-channel",
  "solar-flow": "solar-flow",
  "solar-kit": "solar-flow",
  "span-load": "span-load",
  "root-zone": "root-zone",
};

export const DIAGRAM_KINDS = new Set([
  "trail-section",
  "waterbar-plan",
  "fence-system",
  "stream-channel",
  "solar-flow",
  "span-load",
  "root-zone",
]);

export function diagramKindForType(type: string): string | null {
  return KIND_FROM_TYPE[type] ?? null;
}

export function Diagram({
  kind,
  alt,
  caption,
  compact = false,
  locked,
}: {
  kind: string;
  alt: string;
  caption: string;
  compact?: boolean;
  locked?: string;
}) {
  if (kind === "trail-section") {
    return <TrailSection alt={alt} caption={caption} compact={compact} locked={locked === "berm" ? "berm" : undefined} />;
  }
  if (kind === "waterbar-plan") {
    return (
      <WaterbarSection
        alt={alt}
        caption={caption}
        compact={compact}
        locked={locked === "square" ? "square" : undefined}
      />
    );
  }
  if (kind === "fence-system") {
    return (
      <FenceSection
        alt={alt}
        caption={caption}
        compact={compact}
        locked={locked === "lean" ? "lean" : undefined}
      />
    );
  }
  if (kind === "stream-channel") {
    return (
      <StreamSection
        alt={alt}
        caption={caption}
        compact={compact}
        locked={locked === "bankfull" ? "bankfull" : undefined}
      />
    );
  }
  if (kind === "solar-flow") {
    return (
      <SolarSection
        alt={alt}
        caption={caption}
        compact={compact}
        locked={locked === "short" ? "short" : undefined}
      />
    );
  }
  if (kind === "span-load") return <SpanSection alt={alt} caption={caption} compact={compact} />;
  if (kind === "root-zone") {
    return (
      <RootSection
        alt={alt}
        caption={caption}
        compact={compact}
        locked={locked === "compacted" ? "compacted" : undefined}
      />
    );
  }
  return null;
}

const QUIZ_FIGURES: Record<string, { kind: string; locked?: string; alt: string; caption: string }> = {
  "trail-berm": {
    kind: "trail-section",
    locked: "berm",
    alt: "Trail cross-section with a berm holding water on the tread.",
    caption: "Spot what is stopping the water from leaving.",
  },
  "waterbar-square": {
    kind: "waterbar-plan",
    locked: "square",
    alt: "A water bar set square across a trail.",
    caption: "Spot why this bar will clog.",
  },
  "fence-lean": {
    kind: "fence-system",
    locked: "lean",
    alt: "A single fence post leaning under wire pull, with no brace.",
    caption: "Spot what is missing.",
  },
  "stream-cut": {
    kind: "stream-channel",
    locked: "bankfull",
    alt: "A stream cross-section at bankfull, with a raw cut bank.",
    caption: "Spot the bank that is taking the energy.",
  },
  "solar-short": {
    kind: "solar-flow",
    locked: "short",
    alt: "A solar kit diagram with a dashed unfused short around the battery.",
    caption: "Spot the path that starts a fire.",
  },
  "root-packed": {
    kind: "root-zone",
    locked: "compacted",
    alt: "A tree with roots out to the drip line and a compacted patch of soil.",
    caption: "Spot where the air has been squeezed out.",
  },
};

export function QuizFigure({ figure }: { figure: string }) {
  const plate = QUIZ_FIGURES[figure];
  if (!plate) return null;
  return <Diagram kind={plate.kind} alt={plate.alt} caption={plate.caption} compact locked={plate.locked} />;
}

export function PhotoPlate({ plate }: { plate: Illustration }) {
  const remote = Boolean(plate.src && /^https?:\/\//i.test(plate.src));
  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-3 py-2">
        <p className="text-sm font-semibold tracking-wide text-brass uppercase">
          {remote ? "Field photo · needs a connection" : "Field photo · stored on the phone"}
        </p>
      </div>
      {plate.src ? (
        <img src={plate.src} alt={plate.alt} className="block w-full" />
      ) : null}
      <p className="px-3 pt-3 text-base leading-relaxed text-ink">{plate.description}</p>
      <figcaption className="px-3 py-3 text-sm leading-relaxed text-muted">{plate.caption}</figcaption>
    </figure>
  );
}

export function DescribedPlate({ plate }: { plate: Illustration }) {
  return (
    <figure className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm font-semibold tracking-wide text-brass uppercase">Plate to look for</p>
      <p className="mt-2 text-lg leading-relaxed text-ink">{plate.description}</p>
      <figcaption className="mt-3 text-sm leading-relaxed text-muted">{plate.caption}</figcaption>
    </figure>
  );
}
