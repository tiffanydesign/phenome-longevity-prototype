import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { metric, metricOn, seriesFor, type Metric } from "../data/metrics";
import { visitDate, VISITS } from "../study/data";
import { LATEST } from "../twin/regions";
import { TwinHero } from "../twin/TwinHero";
import { CompareBars } from "../ui/charts";
import { Chevron, IconAll, IconClose, IconGrip, IconResize } from "../ui/icons";
import { Num } from "../ui/Num";
import { useGo } from "../ui/shell";
import { SIZES, useBento } from "./bento";
import { glyphOf, Kind, type GlyphName } from "../ui/glyphs";


/*
 * The Today strip speaks only of what the ring, the band and the diary measured.
 * Clinic and twin results never appear here: they live on the twin card and under Clinic visits.
 */
const SLIDES = [
  { text: "Your weekly report is ready. HRV is up 9% and sleep held steady.", cta: "See report", to: "/v3/home?tab=vitals" },
  { text: "Recovery is ahead of your load today. A good day to train or stay active.", cta: "See capacity", to: "/v3/metric/capacity" },
];


/** Each card's name, for the remove and add controls. */
const CARD_NAME: Record<string, string> = {
  twin: "Digital twin",
  activity: "Activity",
  sleep: "Sleep",
  capacity: "Capacity",
  workouts: "Workouts",
  vitals: "Heart",
  food: "Food",
  visits: "Clinic visits",
  habits: "Habits",
  consult: "Your consultations",
  games: "Cognitive games",
  supplements: "Personalised supplements",
  cgm: "Glucose monitoring",
};

/**
 * Home in the order a member asks their questions: how am I (the twin), how is
 * today (every reading, the body card among them), then the visit, consultations and games.
 * A card stays in its group; within it the member arranges.
 */
const GROUPS: { id: string; title?: string; meta?: string; cards: string[] }[] = [
  { id: "hero", cards: ["twin"] },
  { id: "today", title: "Today", cards: ["activity", "sleep", "capacity", "workouts", "vitals", "food", "habits"] },
  { id: "visits", title: "Clinic visits", cards: ["visits"] },
  { id: "more", title: "More", cards: ["consult", "games", "supplements", "cgm"] },
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
 * right the date between two steps through the week, the day before on its left and the day after on its right.
 */
function DayStep({ ago, onChange }: { ago: number; onChange: (ago: number) => void }) {
  const { title, date } = dayName(ago);
  return (
    <header className="v2-sec v2-day">
      <h3>{title}</h3>
      <span className="v2-date" data-past={ago > 0 ? "" : undefined}>
        <button aria-label="The day before" disabled={ago >= DAYS_BACK} onClick={() => onChange(ago + 1)}>
          <Chevron dir="left" size={15} />
        </button>
        <svg className="v2-date-mark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
        <span aria-live="polite">{date}</span>
        <button aria-label="The day after" disabled={ago <= 0} onClick={() => onChange(ago - 1)}>
          <Chevron size={15} />
        </button>
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
            <Tile id={s.id} go={go} />
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

function Tile({ id, go }: { id: string; go: ReturnType<typeof useGo> }) {
  const open = (to: string) => (e: { currentTarget: HTMLElement }) => go(to, { from: e.currentTarget });
  const tiles: Record<string, () => ReactNode> = {
    twin: () => <TwinTile onOpen={open("/v3/twin")} />,
    capacity: () => <Stat m="capacity" onOpen={open("/v3/metric/capacity")} />,
    workouts: () => <Stat m="workouts" title="Workouts" field="rose" glyph="figure" onOpen={open("/v3/metric/workouts")} />,
    activity: () => <ActivityTile onOpen={open("/v3/metric/steps")} />,
    sleep: () => <Stat m="sleep" onOpen={open("/v3/metric/sleep")} />,
    vitals: () => <Stat m="rhr" title="Heart" onOpen={open("/v3/metric/rhr")} />,
    food: () => <Stat m="diet" onOpen={open("/v3/metric/diet")} />,
    habits: () => <Stat m="habits" onOpen={open("/journal/habits")} />,
    visits: () => <VisitsTile onOpen={open("/v3/visits")} />,
    consult: () => (
      <ServiceTile field="lavender" mark="consult" title="Your consultations" line="Manage and book your sessions" onOpen={open("/discover/consultations")} />
    ),
    games: () => <ServiceTile field="teal" mark="games" title="Cognitive games" line="Short games that train memory and focus" onOpen={open("/discover/games")} />,
    // two services on their way: shown with their marks, quieter, and not yet a way in
    supplements: () => <ServiceTile field="food" mark="supplements" title="Supplements" line="Personalised to you after a short quiz" soon />,
    cgm: () => <ServiceTile field="rose" mark="cgm" title="Glucose monitoring" line="A sensor that reads your glucose all day" soon />,
  };
  return <>{tiles[id]()}</>;
}

/** The marks of Home's services: rounded lines of the tab marks' weight, drawn on a 24 grid. */
const SERVICE_MARK: Record<string, ReactNode> = {
  // a calendar page with a tick: a session booked
  consult: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="m9 15 2 2 4-4" />
    </>
  ),
  // a puzzle piece: a small game for the mind
  games: <path d="M10 4.5a2 2 0 1 1 4 0V6h3.5a1.5 1.5 0 0 1 1.5 1.5V11h-1.5a2 2 0 1 0 0 4H19v3.5a1.5 1.5 0 0 1-1.5 1.5H14v-1.5a2 2 0 1 0-4 0V20H6.5A1.5 1.5 0 0 1 5 18.5V15h1.5a2 2 0 1 0 0-4H5V7.5A1.5 1.5 0 0 1 6.5 6H10z" />,
  // a capsule on the diagonal, its seam across the middle
  supplements: (
    <>
      <path d="M8.6 19.9a4.3 4.3 0 0 1-6.1-6.1l6.8-6.8a4.3 4.3 0 0 1 6.1 6.1z" transform="translate(2.2 -1.4)" />
      <path d="m8.1 9 6.1 6.1" transform="translate(2.2 -1.4)" />
    </>
  ),
  // a round sensor with a reading trace through it
  cgm: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6.5 12.5h2.2l1.6-3 2.6 6 1.6-3h3" />
    </>
  ),
};

/**
 * One of Home's services: its mark on a tinted disc in its own hue, a title,
 * one line, and a way in. A service on its way keeps its mark at half strength
 * and says so with a small pill instead of the arrow.
 */
function ServiceTile({ field, mark, title, line, onOpen, soon }: { field: string; mark: string; title: string; line: string; onOpen?: (e: { currentTarget: HTMLElement }) => void; soon?: boolean }) {
  const body = (
    <>
      <span className="v2-svc-mark" aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          {SERVICE_MARK[mark]}
        </svg>
      </span>
      <span className="v2-svc-text">
        <span className="v2-svc-t">{title}</span>
        <span className="v2-svc-s">{line}</span>
      </span>
      {soon ? (
        <span className="v2-svc-soon">Coming soon</span>
      ) : (
        <span className="v2-svc-go">
          <Chevron size={16} />
        </span>
      )}
    </>
  );
  return soon ? (
    <div className="v2-svc" data-field={field} data-soon="" aria-disabled="true">
      {body}
    </div>
  ) : (
    <button className="v2-svc" data-field={field} onClick={onOpen}>
      {body}
    </button>
  );
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

/** The clinic's side of Home: the last visit, three of its readings with their path across visits, and the way into comparing them. */
function VisitsTile({ onOpen }: { onOpen: (e: { currentTarget: HTMLElement }) => void }) {
  const rows = ["bp", "weight", "bodyfat"].map((id) => metric(id));
  return (
    <button className="v2-tile v2-visits" data-field="plain" onClick={onOpen}>
      <Kind name="heart">
        Visit {LATEST} · {visitDate(LATEST)}
      </Kind>
      <span className="v2-vcols">
        {rows.map((m) => (
          <VisitCol key={m.id} m={m} />
        ))}
      </span>
      <span className="v2-vfoot">
        <span className="v2-vline" aria-label={`${VISITS.length} visits`}>
          {VISITS.map((n) => (
            <i key={n} data-on={n === LATEST ? "" : undefined} />
          ))}
          <small>{VISITS.length} visits</small>
        </span>
        <span className="v2-visits-go">
          Compare visits
          <Chevron size={14} />
        </span>
      </span>
    </button>
  );
}

/** One reading of the visit: name, number, unit on its own line, its path across visits, and what changed. */
function VisitCol({ m }: { m: Metric }) {
  const s = m.scans ?? [];
  const last = s[s.length - 1];
  const prev = s[s.length - 2];
  const diff = prev === undefined ? 0 : last - prev;
  const flagged = m.status !== "normal";
  return (
    <span className="v2-vcol" data-field={m.field}>
      <small>{m.label}</small>
      <b>
        <Num v={m.value} />
      </b>
      <em>{m.unit}</em>
      <VisitTrace values={s} />
      {flagged ? (
        <span className="v2-vflag">{m.delta}</span>
      ) : (
        <span className="v2-vchange" data-dir={diff > 0 ? "up" : diff < 0 ? "down" : "flat"}>
          <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
            <path d="M5 1.5 9 8H1z" fill="currentColor" />
          </svg>
          {Math.abs(diff).toFixed(m.decimals ?? 0)} {m.unit}
        </span>
      )}
    </span>
  );
}

/** The reading at each visit as joined dots, the latest solid. */
function VisitTrace({ values }: { values: number[] }) {
  if (values.length < 2) return <span className="v2-vtrace" />;
  const W = 90;
  const H = 26;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pts = values.map((v, i) => [4 + (i * (W - 8)) / (values.length - 1), hi === lo ? H / 2 : 4 + ((hi - v) * (H - 8)) / (hi - lo)]);
  return (
    <svg className="v2-vtrace" viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 3.6 : 2.4} fill={i === pts.length - 1 ? "currentColor" : "var(--v-card)"} stroke="currentColor" strokeWidth="1.5" />
      ))}
    </svg>
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
 * The twin's door on Home: a small card that invites rather than reports. A bust
 * on a pale sky disc, the twin's name and one line on what it is, and a way in.
 * Results stay on the twin's own pages.
 */
function TwinTile({ onOpen }: { onOpen: (e: { currentTarget: HTMLElement }) => void }) {
  return (
    <button className="v2-twin-entry" onClick={onOpen}>
      <span className="v2-twin-entry-fig" aria-hidden>
        <TwinHero readouts={false} />
      </span>
      <span className="v2-twin-entry-text">
        <span className="v2-twin-entry-t">Digital twin</span>
        <span className="v2-twin-entry-s">Your body as your clinic reads it, visit by visit</span>
      </span>
      <span className="v2-twin-entry-go">
        <Chevron />
      </span>
    </button>
  );
}
