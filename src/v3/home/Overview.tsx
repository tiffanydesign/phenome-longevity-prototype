import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { asset } from "@/lib/asset";
import { metric, metricOn, seriesFor, STATUS_LABEL, type Metric, type Status } from "../data/metrics";
import { usePrefs } from "@/lib/prefs";
import { allLabs } from "../study/blocks";
import { M, pick, visitDate, type Rec } from "../study/data";
import { LATEST } from "../twin/regions";
import { HeroField, heroAt, useHero } from "../twin/HeroField";
import type { HeroMap, Tint } from "../twin/field";
import { CompareBars } from "../ui/charts";
import { Chevron, IconAll, IconClose, IconGrip, IconResize } from "../ui/icons";
import { Num } from "../ui/Num";
import { useGo } from "../ui/shell";
import { SIZES, useBento } from "./bento";
import { glyphOf, Kind, type GlyphName } from "../ui/glyphs";

const BP = metric("bp");

/* the device report, then what the clinic visit found, in the portal's words */
const SLIDES = [
  { text: "Your weekly report is ready. HRV is up 9% and sleep held steady.", cta: "See report", to: "/v3/home?tab=vitals" },
  {
    text: BP.status === "normal" ? `Your visit on ${visitDate(LATEST)} is on your twin, every result in its place.` : `Blood pressure read ${BP.value} at your visit on ${visitDate(LATEST)}, ${BP.delta.toLowerCase()}.`,
    cta: "Open twin",
    to: "/v3/twin?lens=vitals&organ=natural",
  },
  { text: `Your last clinic visit was ${visitDate(LATEST)}. Book the next one when it suits you.`, cta: "Book", to: "/v3/booking" },
];

const GOLD = "#ffb600";
const NAVY = "#263980";

/** The last visit's laboratory markers, by the laboratory's own flag: critical, outside its range, within it. */
const RESULTS: { status: Status; count: number }[] = (() => {
  const labs = allLabs(LATEST);
  const flags = (Object.values(M.labs) as Rec[][]).flat().flatMap((p) => (pick(p.visits, LATEST)?.analytes ?? []) as Rec[]).map((a) => String(a.flag));
  const critical = flags.filter((f) => f.startsWith("critical")).length;
  return [
    { status: "alert" as const, count: critical },
    { status: "monitor" as const, count: labs.total - labs.inRange - critical },
    { status: "normal" as const, count: labs.inRange },
  ].filter((r) => r.count > 0);
})();

/** Each card's name, for the remove and add controls. */
const CARD_NAME: Record<string, string> = {
  twin: "Your twin",
  activity: "Activity",
  sleep: "Sleep",
  capacity: "Capacity",
  workouts: "Workouts",
  vitals: "Heart",
  food: "Food",
  visits: "Clinic visits",
  habits: "Habits",
  consult: "Book a visit",
  store: "Store",
};

/**
 * Home in the order a member asks their questions: how am I (the twin), how is
 * today (every reading, the body card among them), then the visit and the store.
 * A card stays in its group; within it the member arranges.
 */
const GROUPS: { id: string; title?: string; meta?: string; cards: string[] }[] = [
  { id: "hero", cards: ["twin"] },
  { id: "today", title: "Today", cards: ["activity", "sleep", "capacity", "workouts", "vitals", "food", "habits"] },
  { id: "visits", title: "Clinic visits", cards: ["visits"] },
  { id: "more", title: "More", cards: ["consult", "store"] },
];

/** How many days back the Today cards read: 0 is today, up to the six days the week's series holds. */
const DayAgo = createContext(0);
const DAYS_BACK = 6;

function dayName(ago: number): { title: string; date: string } {
  const d = new Date();
  d.setDate(d.getDate() - ago);
  const date = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  if (ago === 0) return { title: "Today", date };
  if (ago === 1) return { title: "Yesterday", date };
  return { title: d.toLocaleDateString("en-GB", { weekday: "long" }), date };
}

/**
 * The day heading over the Today cards: the day by name at the left, and at the
 * right a small date capsule. Tapped, it opens the week as seven days under it,
 * oldest at the left and today at the right; the heading stays one line tall.
 */
function DayStep({ ago, onChange }: { ago: number; onChange: (ago: number) => void }) {
  const { title, date } = dayName(ago);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const days = Array.from({ length: DAYS_BACK + 1 }, (_, i) => {
    const back = DAYS_BACK - i;
    const d = new Date();
    d.setDate(d.getDate() - back);
    return { back, letter: d.toLocaleDateString("en-GB", { weekday: "narrow" }), n: d.getDate(), full: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) };
  });
  return (
    <header className="v2-sec v2-day">
      <h3>{title}</h3>
      <span className="v2-date" ref={root}>
        <button className="v2-date-btn" data-past={ago > 0 ? "" : undefined} aria-haspopup="dialog" aria-expanded={open} aria-label={`${date}. Choose a day`} onClick={() => setOpen(!open)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
            <path d="M3.5 10h17M8 3v4M16 3v4" />
          </svg>
          <span aria-live="polite">{date}</span>
          <Chevron dir="down" size={13} />
        </button>
        {open && (
          <div className="v2-week" role="dialog" aria-label="Choose a day">
            {days.map((d) => (
              <button
                key={d.back}
                aria-pressed={d.back === ago}
                aria-label={d.full}
                data-today={d.back === 0 ? "" : undefined}
                onClick={() => {
                  onChange(d.back);
                  setOpen(false);
                }}
              >
                <small>{d.letter}</small>
                <b>{d.n}</b>
              </button>
            ))}
          </div>
        )}
      </span>
    </header>
  );
}

/** The small card left alone in a group's grid, if its half-width cells add up odd: the one a size change would pair up. */
function lonelyIn(slots: { id: string; size: string }[]): string | null {
  const halves = slots.reduce((n, s) => n + (s.size === "s" ? 1 : s.size === "t" ? 2 : 0), 0);
  if (halves % 2 === 0) return null;
  return [...slots].reverse().find((s) => s.size === "s" && SIZES[s.id].includes("w"))?.id ?? null;
}

/** Set once the bento has played its entrance, so popping back from a detail does not replay it. */
let arrived = false;

/** Weekly report strip, then the bento. The cards are the member's to arrange. */
export function Overview({ editing, onEdit }: { editing: boolean; onEdit: (on: boolean) => void }) {
  const go = useGo();
  const bento = useBento(editing, onEdit);
  const [intro] = useState(() => !arrived);
  const [ago, setAgo] = useState(0);
  useEffect(() => {
    arrived = true;
  }, []);

  return (
    <div className="v2-all">
      {GROUPS.map((g) => {
        const slots = bento.slots.filter((s) => g.cards.includes(s.id));
        if (!slots.length) return null;
        const lonelyId = lonelyIn(slots);
        return (
          <section key={g.id} className="v2-home-group" aria-label={g.title ?? "Your twin"}>
            {g.id === "today" ? (
              <DayStep ago={ago} onChange={setAgo} />
            ) : (
              g.title && (
                <header className="v2-sec">
                  <h3>{g.title}</h3>
                  {g.meta && <span>{g.meta}</span>}
                </header>
              )
            )}
            {g.id === "today" && ago === 0 && <Report />}
            <DayAgo.Provider value={g.id === "today" ? ago : 0}>
            <div className="v2-bento" data-intro={intro ? "" : undefined} data-editing={editing ? "" : undefined}>
              {/* rendered in a fixed order and placed with CSS order: moving the node would drop pointer capture mid-drag */}
              {[...slots].sort((a, b) => a.id.localeCompare(b.id)).map((s) => (
          <div
            key={s.id}
            className="v2-slot"
            style={{ order: bento.slots.indexOf(s), "--n": bento.slots.indexOf(s) } as CSSProperties}
            data-card={s.id}
            data-size={s.size}
            data-drag={bento.dragging === s.id ? "" : undefined}
            onPointerDown={(e) => bento.down(e, s.id)}
            onPointerMove={(e) => bento.move(e, s.id)}
            onPointerUp={bento.up}
            onPointerCancel={bento.up}
            onContextMenu={(e) => e.preventDefault()}
            onClickCapture={(e) => {
              if ((e.target as HTMLElement).closest(".v2-slot-tools, .v2-slot-remove")) return;
              if (editing || bento.consumedHold()) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <Tile id={s.id} size={s.size} go={go} />
            {editing && bento.slots.length > 1 && (
              <button
                className="v2-slot-remove"
                aria-label={`Remove ${CARD_NAME[s.id]}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  bento.remove(s.id);
                }}
              >
                <i aria-hidden />
              </button>
            )}
            {editing && (
              <span className="v2-slot-tools" data-hint={lonelyId === s.id ? "" : undefined}>
                <i aria-hidden>
                  <IconGrip />
                </i>
                <button
                  aria-label={`Resize ${s.id}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    bento.resize(s.id);
                  }}
                >
                  <IconResize />
                </button>
              </span>
            )}
          </div>
              ))}
            </div>
            </DayAgo.Provider>
          </section>
        );
      })}
      {editing && GROUPS.some((g) => lonelyIn(bento.slots.filter((s) => g.cards.includes(s.id)))) && <p className="v2-edit-hint">One card is on its own. Tap its highlighted size button to make it full width.</p>}
      {editing && bento.hidden.length > 0 && (
        <div className="v2-edit-add">
          <h3>Add cards</h3>
          <div>
            {bento.hidden.map((id) => (
              <button key={id} onClick={() => bento.restore(id)}>
                <i aria-hidden>+</i>
                {CARD_NAME[id]}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="v2-all-foot">
        {editing ? (
          <>
            <button className="v2-pillbtn" onClick={bento.reset}>
              Reset layout
            </button>
            <button className="v2-pillbtn" data-solid onClick={() => onEdit(false)}>
              Done
            </button>
          </>
        ) : (
          <button className="v2-pillbtn v2-editbtn" onClick={() => onEdit(true)}>
            <IconAll />
            Edit cards
          </button>
        )}
      </div>
    </div>
  );
}

const HIDDEN_KEY = "phenome.v2.report.hidden";

function readHidden(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** The member's messages, one at a time. Each can be closed, and once all are closed the strip goes. */
function Report() {
  const go = useGo();
  const [at, setAt] = useState(0);
  const [hidden, setHidden] = useState(readHidden);
  const ref = useRef<HTMLDivElement>(null);
  const shown = SLIDES.filter((s) => !hidden.includes(s.text));
  if (!shown.length) return null;
  const dismiss = () => {
    const next = [...hidden, shown[Math.min(at, shown.length - 1)].text];
    setHidden(next);
    setAt((i) => Math.max(0, Math.min(i, shown.length - 2)));
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
    } catch {
      /* private mode: closed for this visit only */
    }
  };
  return (
    <div className="v2-report">
      <button className="v2-report-close" aria-label="Close this message" onClick={dismiss}>
        <IconClose />
      </button>
      <div
        className="v2-report-track"
        ref={ref}
        onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {shown.map((s) => (
          <button key={s.text} onClick={() => go(s.to)}>
            {s.text}
            <span>{s.cta}</span>
          </button>
        ))}
      </div>
      <div className="v2-report-dots">
        {shown.length > 1 && shown.map((s, i) => (
          <button
            key={s.text}
            aria-label={`Message ${i + 1} of ${shown.length}`}
            aria-current={i === at ? "true" : undefined}
            onClick={() => ref.current?.scrollTo({ left: i * ref.current.clientWidth, behavior: "smooth" })}
          >
            <i />
          </button>
        ))}
      </div>
    </div>
  );
}

function Tile({ id, size, go }: { id: string; size: string; go: ReturnType<typeof useGo> }) {
  const open = (to: string) => (e: { currentTarget: HTMLElement }) => go(to, { from: e.currentTarget });
  const tiles: Record<string, () => ReactNode> = {
    twin: () => <TwinTile size={size} onOpen={open("/v3/twin")} />,
    capacity: () => <Stat m="capacity" onOpen={open("/v3/metric/capacity")} />,
    workouts: () => <Stat m="workouts" title="Workouts" field="rose" glyph="figure" onOpen={open("/v3/metric/workouts")} />,
    activity: () => <ActivityTile onOpen={open("/v3/metric/steps")} />,
    sleep: () => <Stat m="sleep" onOpen={open("/v3/metric/sleep")} />,
    vitals: () => <Stat m="rhr" title="Heart" onOpen={open("/v3/metric/rhr")} />,
    food: () => <Stat m="diet" onOpen={open("/v3/metric/diet")} />,
    habits: () => <Stat m="habits" onOpen={open("/journal/habits")} />,
    visits: () => <VisitsTile onOpen={open("/v3/visits")} />,
    consult: () => (
      <button className="v2-tile" data-field="lavender" onClick={open("/v3/booking")}>
        <span className="v2-tile-t">Book your next visit</span>
        <span className="v2-tile-s">Last visit {visitDate(LATEST)}</span>
        <span className="v2-tile-go">
          <Chevron />
        </span>
      </button>
    ),
    store: () => (
      <button className="v2-tile v2-tile-store" data-field="sand" onClick={open("/v3/store")}>
        <span className="v2-tile-t">Store</span>
        <img src={asset("img/Phenome_Ring_Silver-metal_transparent.png")} alt="" />
      </button>
    ),
  };
  return <>{tiles[id]()}</>;
}

/** A reading's day-on-day change, when its note gives one ("+6 on yesterday"): today, the day before, and the scale's top. */
function dayOnDay(row: Metric): { today: number; before: number; max: number } | null {
  const hit = /^([+−-])(\d+(?:\.\d+)?) on (?:yesterday|the day before)$/.exec(row.delta);
  const today = Number(row.value.replace(",", ""));
  if (!hit || Number.isNaN(today)) return null;
  const change = Number(hit[2]) * (hit[1] === "+" ? 1 : -1);
  const top = Number(/\/\s*([\d,]+)/.exec(row.unit)?.[1]?.replace(",", "")) || Math.max(today, today - change) * 1.15;
  return { today, before: today - change, max: top };
}

/**
 * The week behind a card's number, drawn small in the category colour: bars
 * for what adds up through a day, a line for what is a level. The day shown
 * is solid, the others faint.
 */
function MiniWeek({ m, ago }: { m: Metric; ago: number }) {
  if (m.chart === "scan" || !m.swing || m.when === "this week") return null;
  const week = seriesFor(m, "W");
  const lo = Math.min(...week) * (m.chart === "bars" ? 0 : 0.96);
  const hi = Math.max(...week);
  const h = (v: number) => 6 + ((v - lo) / Math.max(1e-6, hi - lo)) * 30;
  const now = week.length - 1 - ago;
  if (m.chart === "bars")
    return (
      <svg className="v2-mini" viewBox="0 0 140 40" preserveAspectRatio="none" aria-hidden>
        {week.map((v, i) => (
          <rect key={i} x={i * 20 + 3} y={40 - h(v)} width="14" height={h(v)} rx="4" fill="var(--mid)" opacity={i === now ? 1 : 0.22} />
        ))}
      </svg>
    );
  const pts = week.map((v, i) => `${i * 22 + 4},${40 - h(v)}`);
  return (
    <svg className="v2-mini" viewBox="0 0 140 40" preserveAspectRatio="none" aria-hidden>
      <polyline points={pts.join(" ")} fill="none" stroke="var(--mid)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" opacity="0.35" vectorEffect="non-scaling-stroke" />
      <circle cx={now * 22 + 4} cy={40 - h(week[now])} r="3.6" fill="var(--mid)" />
    </svg>
  );
}

/** A reading's card. `field` and `art` override the metric's own where Home needs every card to differ from its neighbours. */
function Stat({ m, title, field, glyph, onOpen }: { m: string; title?: string; field?: string; glyph?: GlyphName; onOpen: (e: { currentTarget: HTMLElement }) => void }) {
  const ago = useContext(DayAgo);
  const row = metricOn(m, ago);
  const against = dayOnDay(row);
  return (
    <button className="v2-tile" data-field={field ?? row.field} onClick={onOpen}>
      <Kind name={glyph ?? glyphOf(m)}>{title ?? row.label}</Kind>
      <MiniWeek m={row} ago={ago} />
      {against && (
        <span className="v2-tile-compare">
          <CompareBars today={against.today} before={against.before} max={against.max} />
        </span>
      )}
      <span className="v2-tile-foot">
        <span className="v2-tile-v">
          <b>
            <Num v={row.value} />
          </b>{" "}
          {row.unit.replace(" kcal", "")}
        </span>
        <span className="v2-tile-s">{row.delta}</span>
      </span>
    </button>
  );
}

/** The clinic's side of Home: the last visit, three of its readings with their change, and the way into every visit side by side. */
function VisitsTile({ onOpen }: { onOpen: (e: { currentTarget: HTMLElement }) => void }) {
  const rows = ["bp", "weight", "bodyfat"].map((id) => metric(id));
  return (
    <button className="v2-tile v2-visits" data-field="plain" onClick={onOpen}>
      <Kind name="heart">Visit {LATEST}, {visitDate(LATEST)}</Kind>
      <span className="v2-visits-rows">
        {rows.map((m) => (
          <span key={m.id} className="v2-visits-row">
            <small>{m.label}</small>
            <b>
              {m.value}
              <em>{m.unit}</em>
            </b>
            <span>{m.delta}</span>
          </span>
        ))}
      </span>
      <span className="v2-visits-go">Compare visits</span>
    </button>
  );
}

function ActivityTile({ onOpen }: { onOpen: (e: { currentTarget: HTMLElement }) => void }) {
  const ago = useContext(DayAgo);
  const steps = metricOn("steps", ago);
  return (
    <button className="v2-tile" data-field="activity" onClick={onOpen}>
      <Kind name="flame">Activity</Kind>
      <MiniWeek m={steps} ago={ago} />
      <span className="v2-tile-foot">
        <span className="v2-tile-v">
          <b>
            <Num v={steps.value} />
          </b>{" "}
          {steps.unit}
        </span>
        <span className="v2-tile-s">{steps.delta}</span>
      </span>
    </button>
  );
}

/**
 * Where the figure sits in the stage: the body's axis at `axis` of the width, the
 * crown at `crown` of the height, one cell `cell` of the width. Seated by the body
 * rather than by its crop, so both sexes stand in the same place at the same pitch.
 * `cell` follows the bake's pitch (9 stage px a cell): change one, scale the other.
 */
const HERO_SEAT = { axis: 0.5, crown: 0.07, cell: 0.00846 };
/** The stage is 80 x 92, the leads are drawn in a 1000 x 1150 box over it. */
const STAGE_ASPECT = 92 / 80;

function heroBox(hero: HeroMap) {
  const [a, b, , d] = hero.svg;
  const cell = HERO_SEAT.cell;
  const cellH = cell / STAGE_ASPECT;
  return { left: HERO_SEAT.axis - (100 * a + b) * cell, top: HERO_SEAT.crown - d * cellH, width: hero.cols * cell, height: hero.rows * cellH };
}

/**
 * Where the tile's two readings land, in the viewer's SVG units: blood pressure
 * on the upper arm, where the cuff goes, and BMI on the belly.
 */
const TILE_MARKS = {
  bp: { at: [160, 150] as [number, number], radius: [8, 10] as [number, number] },
  bmi: { at: [100, 186] as [number, number], radius: [20, 13] as [number, number] },
};
/** gold when the portal puts the reading outside its range, navy when within */
const markColour = (m: Metric) => (m.status === "normal" ? NAVY : GOLD);

/** Leaders start under each callout, run level, then drop onto their mark wherever the bake seated it. */
function leads(hero: HeroMap) {
  const box = heroBox(hero);
  const end = (at: [number, number]) => {
    const [fx, fy] = heroAt(hero, at);
    return `${Math.round(1000 * (box.left + fx * box.width))},${Math.round(1150 * (box.top + fy * box.height))}`;
  };
  return [
    { d: `M888,305 H730 L${end(TILE_MARKS.bp.at)}`, colour: markColour(metric("bp")) },
    { d: `M112,543 H320 L${end(TILE_MARKS.bmi.at)}`, colour: markColour(metric("bmi")) },
  ];
}

const heroStyle = (hero: HeroMap): CSSProperties => {
  const box = heroBox(hero);
  return { left: `${box.left * 100}%`, top: `${box.top * 100}%`, width: `${box.width * 100}%`, height: `${box.height * 100}%` };
};

/**
 * The twin's front door, and the one part of Home in the twin's own language:
 * the figure from the digital twin's home page with two readings from the last
 * visit on hairline leaders, and every laboratory marker from it as one dot in the results bar.
 */
function TwinTile({ size, onOpen }: { size: string; onOpen: (e: { currentTarget: HTMLElement }) => void }) {
  const bp = metric("bp");
  const bmi = metric("bmi");
  const tints = useMemo<Tint[]>(
    () => [
      { organ: TILE_MARKS.bp, color: markColour(bp), strength: bp.status === "normal" ? 0.5 : 1 },
      { organ: TILE_MARKS.bmi, color: markColour(bmi), strength: bmi.status === "normal" ? 0.5 : 1 },
    ],
    [bp, bmi],
  );
  const hero = useHero(usePrefs().sex);
  return (
    <button className="v2-twin-tile" data-size={size} onClick={onOpen}>
      <span className="v2-twin-tile-stage">
        {hero && (
          <>
            <HeroField
              className="v2-twin-tile-field"
              hero={hero}
              tints={tints}
              label={`Your twin, with blood pressure ${bp.delta.toLowerCase()} and BMI ${bmi.delta.toLowerCase()}`}
              style={heroStyle(hero)}
            />
            <svg className="v2-twin-tile-lead" viewBox="0 0 1000 1150" aria-hidden>
              {leads(hero).map((l) => (
                <path key={l.d} d={l.d} fill="none" stroke={l.colour} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              ))}
            </svg>
          </>
        )}
        <Callout side="r" label={bp.label} value={bp.value} unit={bp.unit} />
        <Callout side="l" label={bmi.label} value={bmi.value} unit={bmi.unit} />
      </span>
      <span className="v2-twin-tile-head">
        <span className="v2-twin-tile-t">Your twin</span>
        <span className="v2-twin-tile-s">
          Visit {LATEST}, {visitDate(LATEST)}
        </span>
      </span>
      <span className="v2-twin-tile-go">
        <Chevron />
      </span>
      <span className="v2-results">
        <span className="v2-results-bar" aria-hidden>
          {RESULTS.map((r) => (
            <span key={r.status} data-status={r.status} style={{ flexGrow: r.count }}>
              {Array.from({ length: r.count }, (_, i) => (
                <i key={i} />
              ))}
            </span>
          ))}
        </span>
        <span className="v2-results-key">
          {RESULTS.map((r) => (
            <span key={r.status} data-status={r.status}>
              <i aria-hidden />
              {STATUS_LABEL[r.status]} <b>{r.count}</b>
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

function Callout({ side, label, value, unit }: { side: "l" | "r"; label: string; value: string; unit: string }) {
  return (
    <span className="v2-callout" data-side={side}>
      <small>{label}</small>
      <span>
        <b>
          <Num v={value} />
        </b>
        <u>{unit}</u>
      </span>
    </span>
  );
}
