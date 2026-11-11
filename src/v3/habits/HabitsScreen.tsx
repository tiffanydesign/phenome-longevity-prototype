import { useState } from "react";
import { useHour } from "../demo/clock";
import { Chevron } from "../ui/icons";
import { BackBar, BlurLayers, V2Screen } from "../ui/shell";
import { HabitMark } from "./HabitMark";
import { daysLabel, EVERY_DAY, newHabitId, PART_ORDER, PARTS, planActions, SUGGESTIONS, unitFor, usePlan, useToday, type DayPart, type Habit } from "./plan";
import "./habits.css";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
/* Monday first, as the week is read */
const WEEK = [1, 2, 3, 4, 5, 6, 0];

/** "Every day", "Weekdays", shortened for a row's one line. */
const daysShort = (days: number[]) => {
  const l = daysLabel(days);
  return l === "Every day" ? "Daily" : l;
};

/** What a habit asks for, in a few words: "8 glasses", "Once", "One answer". */
const amountOf = (h: Habit) => (h.kind === "count" ? `${h.goal} ${unitFor(h, h.goal ?? 2)}` : h.kind === "choice" ? "One answer" : "Once");

/** The day's progress as a ring, with the count inside it. */
function DayRing({ done, total }: { done: number; total: number }) {
  const R = 27;
  const C = 2 * Math.PI * R;
  const share = total ? done / total : 0;
  return (
    <span className="hb-ring" aria-hidden>
      <svg viewBox="0 0 64 64" width="64" height="64">
        <circle cx="32" cy="32" r={R} data-track="" />
        {share > 0 && <circle cx="32" cy="32" r={R} strokeDasharray={`${C * share} ${C}`} transform="rotate(-90 32 32)" />}
      </svg>
      <b>
        {done}
        <small>/{total}</small>
      </b>
    </span>
  );
}

/**
 * The daily plan, in the order the day runs. At the top, today in one glance:
 * a ring and the habit due next. Below, one group per part of the day, which is
 * also when the check-in on Home starts asking. Every row reads in one line: its
 * mark (solid once done), its name, how often and how much, and on the right only
 * what is worth a glance: a count's progress or the answer given.
 */
export function HabitsScreen() {
  const plan = usePlan();
  const { all, asked } = useToday();
  const [editing, setEditing] = useState<Habit | null>(null);
  const [adding, setAdding] = useState(false);
  const done = asked.filter((t) => t.done).length;
  const hour = useHour();
  const next = asked.find((t) => !t.done && hour >= PARTS[t.h.part].from) ?? asked.find((t) => !t.done);

  return (
    <V2Screen nav={false}>
      <div className="v2-veil vs-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="hb scroll">
        <header className="hb-bar">
          <BackBar />
          <button className="hb-round" aria-label="Add a habit" onClick={() => setAdding(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </header>

        <section className="hb-hero">
          <h1>Habits</h1>
          <p>Home checks in as each part of the day begins.</p>
        </section>

        <section className="hb-today" aria-label="Today">
          <DayRing done={done} total={asked.length} />
          <span className="hb-today-t">
            <b>{done === asked.length && asked.length > 0 ? "All done today" : `${asked.length - done} left today`}</b>
            <small>
              {next
                ? `Next: ${next.h.name}${next.h.kind === "count" ? ` · ${next.count} of ${next.goal}` : ""}`
                : asked.length
                  ? "Every habit ticked"
                  : "Nothing planned for today"}
            </small>
          </span>
        </section>

        {PART_ORDER.map((part) => {
          // today's habits first; the ones not on today rest at the foot of their group
          const onToday = (h: Habit) => all.some((t) => t.h.id === h.id);
          const list = plan.filter((h) => h.part === part).sort((x, y) => Number(!onToday(x)) - Number(!onToday(y)));
          if (!list.length) return null;
          return (
            <section key={part} className="hb-group" aria-label={PARTS[part].label}>
              <header className="hb-sec">
                <h2>{PARTS[part].label}</h2>
                <span>{part === "anytime" ? "All day" : `From ${String(PARTS[part].from).padStart(2, "0")}:00`}</span>
              </header>
              <div className="hb-list">
                {list.map((h) => {
                  const t = all.find((x) => x.h.id === h.id);
                  const right = !t ? "" : h.kind === "count" ? `${t.count}/${t.goal}` : t.answer && t.answer !== "Done" ? t.answer : "";
                  return (
                    <button key={h.id} className="hb-row" data-field={h.field} data-off={t ? undefined : ""} onClick={() => setEditing(h)}>
                      <HabitMark mark={h.mark} field={h.field} done={t?.done} size={40} />
                      <span className="hb-row-t">
                        <b>{h.name}</b>
                        <small>
                          {t ? daysShort(h.days) : "Not today"} · {amountOf(h)}
                          {!h.checkIn && " · Off Home"}
                        </small>
                      </span>
                      {right && (
                        <em className="hb-state" data-done={t?.done ? "" : undefined}>
                          {right}
                        </em>
                      )}
                      <Chevron size={14} />
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        <button className="hb-add" onClick={() => setAdding(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add a habit
        </button>
      </div>

      {adding && (
        <AddSheet
          onClose={() => setAdding(false)}
          onPick={(h) => {
            setAdding(false);
            setEditing({ ...h, id: newHabitId() });
          }}
        />
      )}
      {editing && <EditSheet habit={editing} isNew={!plan.some((p) => p.id === editing.id)} onClose={() => setEditing(null)} />}
    </V2Screen>
  );
}

function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="hb-scrim" onClick={onClose}>
      <div className="hb-sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <i className="hb-grab" aria-hidden />
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

/** A start: a few ideas, or a blank habit of the member's own. */
function AddSheet({ onPick, onClose }: { onPick: (h: Omit<Habit, "id">) => void; onClose: () => void }) {
  return (
    <Sheet title="Add a habit" onClose={onClose}>
      <div className="hb-list hb-ideas">
        {SUGGESTIONS.map((s) => (
          <button key={s.name} className="hb-row" data-field={s.field} onClick={() => onPick(s)}>
            <HabitMark mark={s.mark} field={s.field} size={36} />
            <span className="hb-row-t">
              <b>{s.name}</b>
              <small>
                {PARTS[s.part].label} · {amountOf(s as Habit)}
              </small>
            </span>
            <Chevron size={14} />
          </button>
        ))}
      </div>
      <button
        className="hb-secondary"
        onClick={() => onPick({ name: "", kind: "once", part: "morning", days: EVERY_DAY, checkIn: true, field: "teal", mark: "leaf" })}
      >
        Make your own
      </button>
    </Sheet>
  );
}

/** One habit's settings: name, what it asks for, when, which days, and whether Home asks. */
function EditSheet({ habit, isNew, onClose }: { habit: Habit; isNew: boolean; onClose: () => void }) {
  const [h, setH] = useState<Habit>(habit);
  const set = (patch: Partial<Habit>) => setH((x) => ({ ...x, ...patch }));
  const toggleDay = (d: number) => {
    const days = h.days.includes(d) ? h.days.filter((x) => x !== d) : [...h.days, d];
    if (days.length) set({ days });
  };
  const goal = h.goal ?? 3;
  return (
    <Sheet title={isNew ? "New habit" : "Edit habit"} onClose={onClose}>
      <input className="hb-name" value={h.name} placeholder="Name your habit" maxLength={60} onChange={(e) => set({ name: e.target.value })} aria-label="Habit name" />

      <div className="hb-field">
        <span>Track it</span>
        <div className="hb-seg" role="radiogroup" aria-label="How to track it">
          {(["once", "count"] as const).map((k) => (
            <button
              key={k}
              role="radio"
              aria-checked={h.kind === k || (k === "once" && h.kind === "choice")}
              disabled={h.kind === "choice"}
              onClick={() => set(k === "count" ? { kind: "count", goal, unit: h.unit ?? ["time", "times"] } : { kind: "once" })}
            >
              {k === "once" ? "Once a day" : "A few times"}
            </button>
          ))}
        </div>
      </div>

      {h.kind === "count" && (
        <div className="hb-field">
          <span>Daily goal</span>
          <div className="hb-step">
            <button aria-label="Fewer" disabled={goal <= 2} onClick={() => set({ goal: goal - 1 })}>
              −
            </button>
            <b>
              {goal} <small>{unitFor(h, goal)}</small>
            </b>
            <button aria-label="More" disabled={goal >= 12} onClick={() => set({ goal: goal + 1 })}>
              +
            </button>
          </div>
        </div>
      )}

      <div className="hb-field">
        <span>Part of the day</span>
        <div className="hb-seg" role="radiogroup" aria-label="Part of the day">
          {PART_ORDER.map((p: DayPart) => (
            <button key={p} role="radio" aria-checked={h.part === p} onClick={() => set({ part: p })}>
              {PARTS[p].label}
            </button>
          ))}
        </div>
      </div>

      <div className="hb-field">
        <span>Days · {daysLabel(h.days)}</span>
        <div className="hb-days">
          {WEEK.map((d) => (
            <button key={d} aria-pressed={h.days.includes(d)} aria-label={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d]} onClick={() => toggleDay(d)}>
              {DAY_LETTERS[d]}
            </button>
          ))}
        </div>
      </div>

      <label className="hb-switch">
        <span>
          <b>Ask in daily check-in</b>
          <small>Shows on Home when its part of the day begins</small>
        </span>
        <input type="checkbox" checked={h.checkIn} onChange={(e) => set({ checkIn: e.target.checked })} />
        <i aria-hidden />
      </label>

      {h.source && <p className="hb-note">{h.source === "band" ? "Your band ticks this when it records an active stretch." : "Meals in your food log count toward this."}</p>}

      <button
        className="hb-primary"
        disabled={!h.name.trim()}
        onClick={() => {
          planActions.save({ ...h, name: h.name.trim() });
          onClose();
        }}
      >
        {isNew ? "Add to plan" : "Save"}
      </button>
      {!isNew && (
        <button
          className="hb-remove"
          onClick={() => {
            planActions.remove(h.id);
            onClose();
          }}
        >
          Remove from plan
        </button>
      )}
    </Sheet>
  );
}
