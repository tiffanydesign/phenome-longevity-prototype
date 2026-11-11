import { useEffect, useRef, useState } from "react";
import { useGo } from "../ui/shell";
import { HabitMark } from "../habits/HabitMark";
import { PARTS, planActions, unitFor, useToday, type HabitToday } from "../habits/plan";
import { WinDeck } from "./WinDeck";
import { useHour } from "../demo/clock";
import "../habits/habits.css";
import "./checkin.css";

/*
 * Small wins: the habits Home asks about today, as a stack of cards to swipe
 * through. It reads the member's plan and holds no list of its own.
 *  - only habits on today's plan with "Ask in daily check-in" switched on;
 *  - a habit is due once its part of the day has begun (morning 05:00,
 *    afternoon 12:00, evening 17:00; any-time habits all day) and stays due
 *    until done;
 *  - anything a device or the food log already knows is ticked for the member;
 *  - the heading sits above the stack with the day's progress, which opens
 *    the whole list with undo;
 *  - when nothing is left to do now, a short word of praise plays and the
 *    whole module folds away. It comes back the next day, or when the next
 *    part of the day brings something new.
 */

/**
 * The day's progress as a ring cut into one arc per habit. Arcs fill clockwise
 * from the top, one after another, each in the hue of the habit it stands for.
 */
function Progress({ items: all }: { items: HabitToday[] }) {
  const items = [...all.filter((t) => t.done), ...all.filter((t) => !t.done)];
  const R = 9;
  const C = 2 * Math.PI * R;
  const n = Math.max(items.length, 1);
  const gap = n > 1 ? 2.2 : 0;
  const seg = C / n - gap;
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden className="wn-prog">
      {items.map((t, i) => (
        <circle
          key={t.h.id}
          cx="12"
          cy="12"
          r={R}
          data-field={t.h.field}
          data-on={t.done ? "" : undefined}
          strokeDasharray={`${seg} ${C - seg}`}
          strokeDashoffset={-(C / n) * i}
          transform="rotate(-90 12 12)"
        />
      ))}
    </svg>
  );
}

/** The confetti: pieces in the day's habit hues, thrown out round a circle. */
const PIECES = 16;

function Celebration({ fields, title, line }: { fields: string[]; title: string; line: string }) {
  return (
    <div className="ck-party" role="status">
      <span className="ck-burst" aria-hidden>
        {Array.from({ length: PIECES }, (_, i) => (
          <i
            key={i}
            data-field={fields[i % fields.length]}
            data-shape={i % 3}
            style={{ "--a": `${(360 / PIECES) * i + (i % 2 ? 9 : -6)}deg`, "--d": `${(i % 4) * 30}ms`, "--r": `${46 + (i % 3) * 14}px` } as React.CSSProperties}
          />
        ))}
        <svg className="ck-party-tick" viewBox="0 0 52 52" width="52" height="52">
          <circle cx="26" cy="26" r="23" />
          <path d="m16 27 7 7 13-15" />
        </svg>
      </span>
      <span className="ck-party-t">
        <b>{title}</b>
        <small>{line}</small>
      </span>
    </div>
  );
}

/** "this evening", "this afternoon": when a part of the day comes round. */
const partWhen = (p: HabitToday["h"]["part"]) => (p === "morning" ? "tomorrow morning" : p === "afternoon" ? "this afternoon" : p === "evening" ? "this evening" : "later");

type Phase = "live" | "party" | "closing" | "gone";

export function CheckIn() {
  const go = useGo();
  const { asked } = useToday();
  const hour = useHour();
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<string[]>([]);

  const done = asked.filter((t) => t.done);
  const waiting = asked.filter((t) => !t.done);
  const later = waiting.filter((t) => hour < PARTS[t.h.part].from);
  // due now, one-off items before counts, then the member's own "later" order
  const rank = (id: string) => {
    const i = order.indexOf(id);
    return i < 0 ? -1 : i;
  };
  const due = waiting
    .filter((t) => hour >= PARTS[t.h.part].from)
    .sort((a, b) => rank(a.h.id) - rank(b.h.id) || Number(a.h.kind === "count") - Number(b.h.kind === "count"));

  // nothing to do now when Home opens: the module stays away. Emptied just now: praise, then fold away.
  const [phase, setPhase] = useState<Phase>(() => (due.length === 0 ? "gone" : "live"));
  const before = useRef(due.length);
  useEffect(() => {
    const was = before.current;
    before.current = due.length;
    if (due.length > 0) {
      setPhase("live");
      return;
    }
    if (was === 0) return;
    setPhase("party");
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const fold = window.setTimeout(() => setPhase("closing"), reduce ? 1600 : 2600);
    const gone = window.setTimeout(() => setPhase("gone"), reduce ? 1700 : 3150);
    return () => {
      window.clearTimeout(fold);
      window.clearTimeout(gone);
    };
  }, [due.length]);

  // the stack as it stands, with this one moved to the back
  const toBack = (id: string) => setOrder([...due.map((t) => t.h.id).filter((x) => x !== id), id]);

  // nothing to do now: the module stays away, and what follows moves up
  if (asked.length === 0 || (phase === "gone" && due.length === 0)) return null;

  const allDone = waiting.length === 0;
  // what counts today so far: done, or its part of the day has begun; later parts join as they start
  const started = asked.filter((t) => t.done || hour >= PARTS[t.h.part].from);
  const clear = started.length > 0 && started.every((t) => t.done);
  const head = (
    <header className="v2-sec wn-head">
      <h3>Small wins for you</h3>
      <button
        className="wn-count"
        data-clear={clear ? "" : undefined}
        aria-expanded={open}
        aria-label={`${clear ? "All done" : `${done.length} of ${started.length} done`} today. ${open ? "Hide" : "Show"} the list`}
        onClick={() => setOpen(!open)}
      >
        {clear ? (
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden className="wn-tick">
            <circle cx="12" cy="12" r="11" />
            <path d="m7.4 12.4 3.1 3.1 6.1-6.7" />
          </svg>
        ) : (
          <Progress items={started} />
        )}
        <span key={clear ? "clear" : done.length}>{clear ? "All done" : `${done.length} of ${started.length}`}</span>
        <svg className="wn-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </header>
  );

  // emptied just now: the praise plays under the heading, then the whole module folds away
  if (phase === "party" || phase === "closing") {
    return (
      <section className="wn-mod ck-fold" data-closing={phase === "closing" ? "" : undefined} aria-label="Small wins">
        <div className="wn-fold-in">
          {head}
          <div className="wn-party">
            <Celebration
              fields={asked.map((t) => t.h.field)}
              title={allDone ? "Good job" : "Good job, all done for now"}
              line={allDone ? `All ${asked.length} small wins done · see you tomorrow` : `Next: ${later[0]?.h.name ?? "more"}, ${later[0] ? partWhen(later[0].h.part) : "later"}`}
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="wn-mod" aria-label="Small wins">
      {head}
      <div className="wn-drawer" data-open={open ? "" : undefined}>
        <div>
          <div className="wn-list-card">
            <ul className="ck-list">
              {asked.map((t) => (
                <li key={t.h.id}>
                  <HabitMark mark={t.h.mark} field={t.h.field} done={t.done} size={30} />
                  <span className="ck-text">
                    <b>{t.h.name}</b>
                    <small>
                      {t.by ??
                        (t.h.kind === "count"
                          ? `${t.count} of ${t.goal} ${unitFor(t.h, t.goal)}`
                          : t.answer && t.answer !== "Done"
                            ? t.answer
                            : t.done
                              ? "Done"
                              : hour < PARTS[t.h.part].from
                                ? `From ${String(PARTS[t.h.part].from).padStart(2, "0")}:00`
                                : "Not yet")}
                    </small>
                  </span>
                  {!t.by && t.count > 0 && (
                    <button className="ck-undo" onClick={() => planActions.undo(t.h.id)}>
                      Undo
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <button className="ck-plan" onClick={(e) => go("/v3/habits", { from: e.currentTarget })}>
              Edit plan in Habits
            </button>
          </div>
        </div>
      </div>
      {!open && due.length > 0 && <WinDeck due={due} onLater={toBack} onFood={(el) => go("/v3/metric/diet", { from: el })} />}
    </section>
  );
}
