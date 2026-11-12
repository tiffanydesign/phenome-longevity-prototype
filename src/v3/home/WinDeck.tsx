import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { HabitMark } from "../habits/HabitMark";
import { PARTS, planActions, unitFor, type HabitToday } from "../habits/plan";

/*
 * Up next: the habits due now as a stack of cards, the one due now on top and the next two
 * showing their edges beneath it. Swipe the top card right when it is done,
 * left to leave it for later (it goes to the back of the stack). Every swipe
 * has a button twin, so nothing depends on the gesture.
 *  - once: right = done
 *  - choice: answered by its chips; a right swipe without an answer springs back
 *  - count: right = one more (it goes to the back until the goal is met)
 *  - food-log counts: right opens the food log
 */

/** How far a card travels before letting go commits it, in px. */
const COMMIT = 88;
/** How many cards show in the stack. */
const DEPTH = 3;

type Way = "done" | "later";

const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
const buzz = () => {
  try {
    navigator.vibrate?.(8);
  } catch {
    // no vibration on this device
  }
};

interface CardProps {
  t: HabitToday;
  depth: number;
  alone: boolean;
  nudge: boolean;
  onWay: (way: Way, value?: string) => void;
  onFood: (el: HTMLElement) => void;
}

function WinCard({ t, depth, alone, nudge, onWay, onFood }: CardProps) {
  const { h } = t;
  const [dx, setDx] = useState(0);
  const [drag, setDrag] = useState(false);
  const [fly, setFly] = useState<null | "left" | "right">(null);
  const [stamp, setStamp] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const start = useRef<{ x: number; y: number; id: number; locked: boolean | null } | null>(null);
  const moved = useRef(false);
  const front = depth === 0;

  // a card that comes round again starts clean
  useEffect(() => {
    if (depth > 0) {
      setFly(null);
      setDx(0);
      setStamp(null);
    }
  }, [depth]);

  const rightLabel = h.kind === "count" ? (h.source === "food" ? "Log" : `+1 ${unitFor(h, 1)}`) : "Done";
  const canRight = h.kind !== "choice";

  const commit = (way: Way, value?: string) => {
    if (way === "done" && h.source === "food") {
      setDx(0);
      return;
    }
    buzz();
    setStamp(way === "done" ? value ?? rightLabel : "Later");
    setFly(way === "done" ? "right" : "left");
    window.setTimeout(
      () => {
        onWay(way, value);
        // a card that stays (a count still short of its goal) swings back in
        setFly(null);
        setDx(0);
        setStamp(null);
      },
      reduceMotion() ? 0 : 300,
    );
  };

  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!front || fly) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId, locked: null };
    moved.current = false;
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (s.locked === null && Math.hypot(mx, my) > 6) {
      s.locked = Math.abs(mx) > Math.abs(my);
      if (s.locked) {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag(true);
      } else {
        start.current = null;
        return;
      }
    }
    if (!s.locked) return;
    moved.current = true;
    // past the commit point the card still follows, but more slowly, so the edge is felt
    const pull = (v: number) => (Math.abs(v) < COMMIT * 1.6 ? v : Math.sign(v) * (COMMIT * 1.6 + (Math.abs(v) - COMMIT * 1.6) * 0.3));
    setDx(pull(mx < 0 && alone ? mx * 0.35 : mx));
  };
  const up = () => {
    const s = start.current;
    start.current = null;
    setDrag(false);
    if (!s?.locked) return;
    if (dx > COMMIT) {
      if (canRight && h.source !== "food") return commit("done");
      if (h.source === "food") {
        setDx(0);
        return;
      }
      // a question wants an answer: back it goes, and the answers ask for a tap
      setDx(0);
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      return;
    }
    if (dx < -COMMIT && !alone) return commit("later");
    setDx(0);
  };

  const p = Math.max(-1, Math.min(1, dx / COMMIT));
  const style = {
    "--d": depth,
    "--dx": `${dx}px`,
    "--rot": `${dx / 18}deg`,
    "--pr": Math.max(0, p),
    "--pl": Math.max(0, -p),
  } as CSSProperties;

  const line = h.kind === "count" ? `${t.count} of ${t.goal} ${unitFor(h, t.goal)}` : h.detail ?? PARTS[h.part].label;

  return (
    <div
      className="wn-card"
      data-field={h.field}
      data-front={front ? "" : undefined}
      data-depth={depth}
      data-drag={drag ? "" : undefined}
      data-fly={fly ?? undefined}
      data-shake={shake ? "" : undefined}
      data-nudge={nudge && front ? "" : undefined}
      style={style}
      aria-hidden={!front}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onClickCapture={(e) => {
        if (moved.current) {
          e.preventDefault();
          e.stopPropagation();
          moved.current = false;
        }
      }}
    >
      {/* the hue floods in as the card is pulled toward done */}
      <span className="wn-wash" aria-hidden />
      <span className="wn-stamp" data-side="done" aria-hidden>
        <svg viewBox="0 0 16 16" width="14" height="14">
          <path d="m3.5 8.4 3 3 6-6.6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {stamp && fly === "right" ? stamp : rightLabel}
      </span>
      <span className="wn-stamp" data-side="later" aria-hidden>
        Later
      </span>

      <div className="wn-body">
        <div className="wn-top">
          <HabitMark mark={h.mark} field={h.field} size={36} />
          <span className="wn-text">
            <b>{h.name}</b>
            {h.kind === "count" ? (
              <span className="wn-sub">
                <span className="wn-pips" aria-hidden style={{ "--n": t.goal } as CSSProperties}>
                  {Array.from({ length: t.goal }, (_, n) => (
                    <i key={n} data-on={n < t.count ? "" : undefined} data-new={n === t.count - 1 ? "" : undefined} />
                  ))}
                </span>
                <small>
                  {t.count}/{t.goal}
                </small>
              </span>
            ) : (
              <small>{h.kind === "choice" ? PARTS[h.part].label : line}</small>
            )}
          </span>

          {h.kind === "count" &&
            (h.source === "food" ? (
              <button className="wn-go" tabIndex={front ? 0 : -1} onClick={(e) => onFood(e.currentTarget)}>
                Log
              </button>
            ) : (
              <span className="wn-acts">
                {t.count > 0 && (
                  <button className="wn-minus" tabIndex={front ? 0 : -1} aria-label={`Take back one ${unitFor(h, 1)}`} onClick={() => planActions.undo(h.id)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
                      <path d="M6 12h12" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
                <button className="wn-go" tabIndex={front ? 0 : -1} aria-label={`Add one ${unitFor(h, 1)}`} onClick={() => commit("done")}>
                  +1
                </button>
              </span>
            ))}

          {h.kind === "once" && (
            <span className="wn-acts">
              {!alone && (
                <button className="wn-later" tabIndex={front ? 0 : -1} onClick={() => commit("later")}>
                  Later
                </button>
              )}
              <button className="wn-go" tabIndex={front ? 0 : -1} onClick={() => commit("done")}>
                Done
              </button>
            </span>
          )}
        </div>

        {h.kind === "choice" && (
          <div className="wn-chips">
            {h.options!.map((o) => (
              <button key={o} className="wn-chip" tabIndex={front ? 0 : -1} onClick={() => commit("done", o)}>
                {o}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const HINT_KEY = "phenome.v3.wins.hinted";
const readHinted = () => {
  try {
    return localStorage.getItem(HINT_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * The stack. `due` is in the order the member will meet them; "later" moves
 * one to the back, which the parent keeps so the order survives a re-render.
 */
export function WinDeck({ due, onLater, onFood }: { due: HabitToday[]; onLater: (id: string) => void; onFood: (el: HTMLElement) => void }) {
  const [hinted, setHinted] = useState(readHinted);
  const shown = due.slice(0, DEPTH);
  const alone = due.length === 1;

  const learnt = () => {
    if (hinted) return;
    setHinted(true);
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {
      // storage blocked: the hint shows again next visit
    }
  };

  const way = (t: HabitToday) => (w: Way, value?: string) => {
    learnt();
    if (w === "later") return onLater(t.h.id);
    if (t.h.kind === "count") {
      planActions.tap(t.h.id);
      // still short of the goal: round to the back for the next one
      if (t.count + 1 < t.goal && due.length > 1) onLater(t.h.id);
      return;
    }
    planActions.answer(t.h.id, value ?? "Done");
  };

  return (
    <div className="wn" data-n={Math.min(due.length, DEPTH)} data-kind={shown[0]?.h.kind} aria-roledescription="stack of cards" aria-label={`${due.length} to do now`}>
      <div className="wn-stack">
        {/* drawn back to front so the top card paints last */}
        {[...shown].reverse().map((t) => {
          const depth = shown.indexOf(t);
          return <WinCard key={t.h.id} t={t} depth={depth} alone={alone} nudge={!hinted} onWay={way(t)} onFood={onFood} />;
        })}
      </div>
    </div>
  );
}
