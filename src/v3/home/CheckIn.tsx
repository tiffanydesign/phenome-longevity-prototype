import { useEffect, useRef, useState } from "react";
import { useGo } from "../ui/shell";
import { HabitMark } from "../habits/HabitMark";
import { PARTS, planActions, shortOf, unitFor, useToday, type HabitToday } from "../habits/plan";
import "../habits/habits.css";
import "./checkin.css";

/*
 * The daily check-in reads the member's habits; it holds no list of its own.
 * What it asks, and when:
 *  - only habits on today's plan with "Ask in daily check-in" switched on;
 *  - a habit is due once its part of the day has begun (morning 05:00,
 *    afternoon 12:00, evening 17:00; any-time habits all day) and stays due
 *    until done, so a missed morning item is still there at lunch;
 *  - Home shows one due habit at a time, one-off items before counts; "Later"
 *    moves on to the next one without logging anything;
 *  - count habits (water, meals) log one at a time and stay until the goal;
 *  - anything a device or the food log already knows is ticked for the member;
 *  - the ring opens the whole day, with undo and the way to the plan.
 */

/** The day's progress as a small ring. */
function Progress({ done, total }: { done: number; total: number }) {
  const R = 9;
  const C = 2 * Math.PI * R;
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden className="ck-prog">
      <circle cx="12" cy="12" r={R} />
      {done > 0 && <circle cx="12" cy="12" r={R} data-fill="" strokeDasharray={`${(C * done) / Math.max(total, 1)} ${C}`} transform="rotate(-90 12 12)" />}
    </svg>
  );
}

/** The habit due now, in one row, with the one action it needs. */
function DueRow({ t, onLink }: { t: HabitToday; onLink: (to: string, el: HTMLElement) => void }) {
  const { h } = t;
  const [leaving, setLeaving] = useState(false);
  const finish = (value: string) => {
    setLeaving(true);
    window.setTimeout(() => planActions.answer(h.id, value), 220);
  };
  const line = h.kind === "count" ? `${t.count} of ${t.goal} ${unitFor(h, t.goal)}` : h.detail ?? PARTS[h.part].label;
  return (
    <div className="ck-row" data-field={h.field} data-leaving={leaving ? "" : undefined}>
      <div className="ck-row-top">
        <HabitMark mark={h.mark} field={h.field} size={34} />
        <span className="ck-text">
          <b>{h.name}</b>
          {h.kind === "count" ? (
            <span className="ck-progress">
              <small>{line}</small>
              <span className="ck-segs" aria-hidden style={{ "--n": t.goal } as React.CSSProperties}>
                {Array.from({ length: t.goal }, (_, n) => (
                  <i key={n} data-on={n < t.count ? "" : undefined} />
                ))}
              </span>
            </span>
          ) : (
            h.kind !== "choice" && <small>{line}</small>
          )}
        </span>
        {h.kind === "once" && (
          <button className="ck-go" onClick={() => finish("Done")}>
            Done
          </button>
        )}
        {h.kind === "count" && (
          <span className="ck-step">
            {t.count > 0 && !t.by && (
              <button className="ck-minus" aria-label={`Take back one ${unitFor(h, 1)}`} onClick={() => planActions.undo(h.id)}>
                <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
                  <path d="M6 12h12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                </svg>
              </button>
            )}
            <button className="ck-go" onClick={(e) => (h.source === "food" ? onLink("/v3/metric/diet", e.currentTarget) : planActions.tap(h.id))}>
              {h.source === "food" ? "Log" : "+1"}
            </button>
          </span>
        )}
      </div>
      {h.kind === "choice" && (
        <div className="ck-chips">
          {h.options!.map((o) => (
            <button key={o} className="ck-chip" onClick={() => finish(o)}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** "this evening", "this afternoon": when a part of the day comes round. */
const partWhen = (p: HabitToday["h"]["part"]) => (p === "morning" ? "tomorrow morning" : p === "afternoon" ? "this afternoon" : p === "evening" ? "this evening" : "later");

/** The confetti: one piece per habit hue, thrown out round a circle. */
const PIECES = 14;

/**
 * The moment the last habit is ticked: a tick drawn in a ring, pieces in the
 * day's habit colours bursting out from it, one line of praise. Then the card
 * folds away for the rest of the day.
 */
function Celebration({ fields, total }: { fields: string[]; total: number }) {
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
        <b>All done for today</b>
        <small>
          {total} of {total} habits · see you tomorrow
        </small>
      </span>
    </div>
  );
}

type Phase = "live" | "party" | "closing" | "gone";

export function CheckIn() {
  const go = useGo();
  const { asked } = useToday();
  const [list, setList] = useState(false);
  const [skip, setSkip] = useState(0);
  const hour = new Date().getHours();
  const plan = (el: HTMLElement) => go("/v3/habits", { from: el });

  // all done already when Home opens: nothing to show. All done just now: celebrate, then fold away.
  const waitingCount = asked.filter((t) => !t.done).length;
  const allDone = asked.length > 0 && waitingCount === 0;
  const [phase, setPhase] = useState<Phase>(() => (allDone ? "gone" : "live"));
  const before = useRef(waitingCount);
  useEffect(() => {
    const was = before.current;
    before.current = waitingCount;
    if (waitingCount > 0) {
      setPhase("live");
      return;
    }
    if (was === 0 || asked.length === 0) return;
    setPhase("party");
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const fold = window.setTimeout(() => setPhase("closing"), reduce ? 1600 : 2400);
    const gone = window.setTimeout(() => setPhase("gone"), reduce ? 1700 : 2900);
    return () => {
      window.clearTimeout(fold);
      window.clearTimeout(gone);
    };
  }, [waitingCount, asked.length]);

  if (phase === "gone" && allDone) return null;
  if (phase === "party" || phase === "closing") {
    return (
      <div className="ck-fold" data-closing={phase === "closing" ? "" : undefined}>
        <section className="ck" aria-label="Daily check-in">
          <Celebration fields={asked.map((t) => t.h.field)} total={asked.length} />
        </section>
      </div>
    );
  }

  if (asked.length === 0) {
    return (
      <section className="ck ck-empty" aria-label="Daily check-in">
        <span className="ck-text">
          <b>Plan your day</b>
          <small>Pick a few habits and Home will check in on them.</small>
        </span>
        <button className="ck-go" onClick={(e) => plan(e.currentTarget)}>
          Set up
        </button>
      </section>
    );
  }

  const done = asked.filter((t) => t.done);
  const waiting = asked.filter((t) => !t.done);
  // due now: its part of the day has begun; one-off items before counts, which run all day
  const due = waiting.filter((t) => hour >= PARTS[t.h.part].from).sort((a, b) => Number(a.h.kind === "count") - Number(b.h.kind === "count"));
  const later = waiting.filter((t) => hour < PARTS[t.h.part].from);
  const now = due.length ? due[skip % due.length] : null;

  return (
    <section className="ck" aria-label="Daily check-in">
      <header className="ck-head">
        <h3>Daily check-in</h3>
        {!list && due.length > 1 && (
          <button className="ck-later" onClick={() => setSkip(skip + 1)}>
            Later
          </button>
        )}
        <button className="ck-count" aria-expanded={list} aria-label={`${done.length} of ${asked.length} done. ${list ? "Hide" : "Show"} all`} onClick={() => setList(!list)}>
          <Progress done={done.length} total={asked.length} />
          {done.length}/{asked.length}
        </button>
      </header>

      {list ? (
        <>
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
          <button className="ck-plan" onClick={(e) => plan(e.currentTarget)}>
            Edit plan in Habits
          </button>
        </>
      ) : now ? (
        <DueRow key={now.h.id} t={now} onLink={(to, el) => go(to, { from: el })} />
      ) : (
        <div className="ck-row ck-clear">
          <div className="ck-row-top">
            {waiting.length === 0 ? <HabitMark mark="sun" field="activity" done size={34} /> : <HabitMark mark={later[0].h.mark} field={later[0].h.field} size={34} />}
            <span className="ck-text">
              <b>{waiting.length === 0 ? "All done for today" : "Nothing due right now"}</b>
              <small>
                {waiting.length === 0
                  ? `${done
                      .filter((t) => t.by)
                      .map((t) => shortOf(t.h))
                      .join(" and ") || "Everything"} ${done.some((t) => t.by) ? "synced for you · " : "logged · "}see you tomorrow`
                  : `Next: ${later[0].h.name}, ${partWhen(later[0].h.part)}`}
              </small>
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
