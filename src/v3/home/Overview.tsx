import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { metricOn, type Metric } from "../data/metrics";
import { visitDate, VISITS } from "../study/data";
import { TwinHero } from "../twin/TwinHero";
import { Chevron, IconAll, IconGrip, IconResize } from "../ui/icons";
import { Num } from "../ui/Num";
import { useGo } from "../ui/shell";
import { SIZES, useBento } from "./bento";
import { CheckIn } from "./CheckIn";
import { bookingDay, bookingLabel, bookingTime, useBooking } from "@/data/booking-store";
import { shortOf, useToday } from "../habits/plan";
import "../habits/habits.css";
import { Gauge, HabitStops, HeartRange, HourBars, Hypnogram, MacroBar, WorkoutRings } from "./glance";
import { glyphOf, Kind, type GlyphName } from "../ui/glyphs";


/** Each card's name, for the remove and add controls. */
const CARD_NAME: Record<string, string> = {
  twin: "Digital twin",
  activity: "Activity",
  sleep: "Sleep",
  capacity: "Capacity",
  workouts: "Workouts",
  vitals: "Heart",
  food: "Food",
  habits: "Habits",
  consult: "Your consultations",
  games: "Cognitive data",
};

/**
 * Home in the order a member asks their questions: how am I (the twin), how is
 * today (every reading, the body card among them), then the visit, consultations and games.
 * A card stays in its group; within it the member arranges.
 */
const GROUPS: { id: string; title?: string; meta?: string; cards: string[] }[] = [
  { id: "today", title: "Today", cards: ["activity", "sleep", "capacity", "workouts", "vitals", "food", "habits"] },
  { id: "clinic", title: "Clinic", cards: ["twin"] },
  { id: "more", title: "More", cards: ["consult", "games"] },
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
      <CheckIn />
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
            {g.id === "clinic" && <VisitEntries onOpen={(v, el) => go(`/v3/twin?at=${v}`, { from: el })} />}
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

function Tile({ id, go }: { id: string; go: ReturnType<typeof useGo> }) {
  const open = (to: string) => (e: { currentTarget: HTMLElement }) => go(to, { from: e.currentTarget });
  const tiles: Record<string, () => ReactNode> = {
    twin: () => <TwinTile onOpen={open("/v3/twin")} />,
    capacity: () => <Stat m="capacity" onOpen={open("/v3/metric/capacity")} />,
    workouts: () => <Stat m="workouts" title="Workouts" field="rose" glyph="dumbbell" onOpen={open("/v3/metric/workouts")} />,
    activity: () => <ActivityTile onOpen={open("/v3/metric/steps")} />,
    sleep: () => <Stat m="sleep" onOpen={open("/v3/metric/sleep")} />,
    vitals: () => <Stat m="rhr" title="Heart" onOpen={open("/v3/metric/rhr")} />,
    food: () => <Stat m="diet" onOpen={open("/v3/metric/diet")} />,
    habits: () => <HabitsTile onOpen={open("/v3/habits")} />,
    consult: () => <ConsultTile open={open} />,
    games: () => <ServiceTile field="teal" mark="games" title="Cognitive data" line="Memory and focus, test by test" onOpen={open("/discover/games")} />,
  };
  return <>{tiles[id]()}</>;
}

/**
 * Consultations on Home. Nothing booked: the service, to book one. A session
 * booked: the session itself, its date as a calendar leaf, an Upcoming badge and
 * how far off it is; it opens the booking's preview.
 */
function ConsultTile({ open }: { open: (to: string) => (e: { currentTarget: HTMLElement }) => void }) {
  const b = useBooking();
  if (!b) return <ServiceTile field="lavender" mark="consult" title="Your consultations" line="Book a session with your clinician" onOpen={open("/v3/consultations")} />;
  const d = bookingDay(b);
  return (
    <ServiceTile
      field="lavender"
      mark="consult"
      title={bookingLabel(b)}
      badge="Upcoming"
      line={`${d.weekdayLong} ${d.num} ${d.monthLong}  ${bookingTime(b)}`}
      onOpen={open("/v3/consultation")}
    />
  );
}

/** How many habits the card shows by name; past that, the last place says how many more. */
const HABIT_SLOTS = 6;

/**
 * Today's habits from the plan as a short two-column list: a green stop
 * (dashed while waiting, solid with a tick once done), the habit's name, and
 * for a count habit how far it has got. Up to six show; a longer plan shows
 * five and a "+n" for the rest, the ones still to do first.
 * No plan yet: one invitation to make one.
 */
function HabitsTile({ onOpen }: { onOpen: (e: { currentTarget: HTMLElement }) => void }) {
  const { all } = useToday();
  const done = all.filter((t) => t.done).length;
  // still to do before done, so a long plan shows what is left
  const order = all.length > HABIT_SLOTS ? [...all].sort((x, y) => Number(x.done) - Number(y.done)) : all;
  const shown = all.length > HABIT_SLOTS ? order.slice(0, HABIT_SLOTS - 1) : order;
  const more = all.length - shown.length;
  return (
    <button className="v2-tile v2-tile-habits" data-field="habit" onClick={onOpen}>
      <span className="v2-tile-head">
        <Kind name={glyphOf("habits")}>Habits</Kind>
        {all.length > 0 && (
          <span className="v2-tile-count v2-hcount" data-all={done === all.length ? "" : undefined} aria-label={`${done} of ${all.length} done today`}>
            <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden>
              <circle cx="8" cy="8" r="6" data-track="" />
              {done > 0 && <circle cx="8" cy="8" r="6" strokeDasharray={`${(done / all.length) * 37.7} 37.7`} transform="rotate(-90 8 8)" />}
            </svg>
            <span aria-hidden>
              <b>{done}</b>/{all.length}
            </span>
          </span>
        )}
      </span>
      {all.length === 0 ? (
        <span className="v2-habits-empty">
          <span className="v2-habits-plus" aria-hidden>
            +
          </span>
          <span>
            <b>Plan your day</b>
            <small>Pick a few habits to keep</small>
          </span>
        </span>
      ) : (
        <span className="v2-hlist" role="list" aria-label={`${done} of ${all.length} habits done today`}>
          {shown.map((t) => (
            <span role="listitem" key={t.h.id} data-done={t.done ? "" : undefined}>
              <i className="v2-habit-dot" data-on={t.done ? "" : undefined}>
                {t.done && (
                  <svg viewBox="0 0 12 12" aria-hidden>
                    <path d="M2.5 6.3 5 8.7 9.6 3.6" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </i>
              <span className="v2-hlist-t">{shortOf(t.h)}</span>
              {t.h.kind === "count" && !t.done && (
                <span className="v2-hlist-n">
                  {t.count}/{t.goal}
                </span>
              )}
            </span>
          ))}
          {more > 0 && (
            <span role="listitem" className="v2-hlist-more">
              <i>+{more}</i>
              <span className="v2-hlist-t">More today</span>
            </span>
          )}
        </span>
      )}
    </button>
  );
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
};

/**
 * One of Home's services: its mark on a tinted disc in its own hue, a title,
 * one line, and a way in. A service on its way keeps its mark at half strength
 * and says so with a small pill instead of the arrow.
 */
function ServiceTile({ field, mark, title, line, badge, onOpen, soon }: { field: string; mark: string; title: string; line: string; badge?: string; onOpen?: (e: { currentTarget: HTMLElement }) => void; soon?: boolean }) {
  const body = (
    <>
      <span className="v2-svc-mark" aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          {SERVICE_MARK[mark]}
        </svg>
      </span>
      <span className="v2-svc-text">
        {badge && <span className="v2-svc-badge">{badge}</span>}
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

/** The one chart each Today card draws, chosen by what the reading is made of. */
function Glance({ id, row, ago }: { id: string; row: Metric; ago: number }) {
  if (id === "sleep") return <Hypnogram ago={ago} />;
  if (id === "capacity") return <Gauge m={row} />;
  if (id === "workouts") return <WorkoutRings m={row} />;
  if (id === "rhr") return <HeartRange m={row} ago={ago} />;
  if (id === "diet") return <MacroBar m={row} />;
  if (id === "habits") return <HabitStops m={row} />;
  return null;
}

/** A reading's card. `field` and `art` override the metric's own where Home needs every card to differ from its neighbours. */
function Stat({ m, title, field, glyph, onOpen }: { m: string; title?: string; field?: string; glyph?: GlyphName; onOpen: (e: { currentTarget: HTMLElement }) => void }) {
  const ago = useContext(DayAgo);
  const row = metricOn(m, ago);
  return (
    <button className="v2-tile" data-field={field ?? row.field} onClick={onOpen}>
      <Kind name={glyph ?? glyphOf(m)}>{title ?? row.label}</Kind>
      <Glance id={m} row={row} ago={ago} />
      <span className="v2-tile-foot">
        <span className="v2-tile-v">
          <b>
            <Num v={row.value} />
          </b>{" "}
          {row.unit.replace(" kcal", "")}
        </span>
      </span>
    </button>
  );
}

/**
 * The clinic's side of Home: one small entry per visit, newest first. Each opens
 * the twin as it stood at that visit; the readings themselves stay on the twin.
 */
function VisitEntries({ onOpen }: { onOpen: (visit: number, el: HTMLElement) => void }) {
  const latest = VISITS[VISITS.length - 1];
  return (
    // up to four share the row; past four the row scrolls sideways, the next one peeking at the edge
    <div className="v2-visit-row" data-many={VISITS.length > 4 ? "" : undefined} aria-label="Clinic visits">
        {[...VISITS].reverse().map((v) => (
          <button
            key={v}
            className="v2-visit"
            data-latest={v === latest ? "" : undefined}
            aria-label={`Visit ${v}, ${visitDate(v)}${v === latest ? ", latest" : ""}`}
            onClick={(e) => onOpen(v, e.currentTarget)}
          >
            {v === latest && (
              <em className="v2-visit-tag" aria-hidden>
                <i />
                Latest
              </em>
            )}
            <b>Visit {v}</b>
            <small>{visitDate(v)}</small>
          </button>
        ))}
    </div>
  );
}

function ActivityTile({ onOpen }: { onOpen: (e: { currentTarget: HTMLElement }) => void }) {
  const ago = useContext(DayAgo);
  const steps = metricOn("steps", ago);
  return (
    <button className="v2-tile" data-field="activity" onClick={onOpen}>
      <Kind name="flame">Activity</Kind>
      <HourBars m={steps} ago={ago} />
      <span className="v2-tile-foot">
        <span className="v2-tile-v">
          <b>
            <Num v={steps.value} />
          </b>{" "}
          {steps.unit}
        </span>
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
