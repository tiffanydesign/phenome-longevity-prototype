import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { flushSync } from "react-dom";

export type Size = "s" | "w" | "t" | "l";

export interface Slot {
  id: string;
  size: Size;
}

/** Sizes a card may take, in the order the resize control steps through them. */
export const SIZES: Record<string, Size[]> = {
  twin: ["w"],
  capacity: ["s", "w"],
  workouts: ["s", "w"],
  activity: ["s", "w"],
  sleep: ["s", "w"],
  vitals: ["s", "w"],
  visits: ["w"],
  food: ["s", "w"],
  habits: ["s", "w"],
  consult: ["w", "s"],
  games: ["w", "s"],
  supplements: ["w"],
  cgm: ["w"],
};

const DEFAULT: Slot[] = [
  { id: "twin", size: "w" },
  { id: "activity", size: "s" },
  { id: "sleep", size: "s" },
  { id: "capacity", size: "s" },
  { id: "workouts", size: "s" },
  { id: "vitals", size: "s" },
  { id: "food", size: "s" },
  { id: "habits", size: "s" },
  { id: "visits", size: "w" },
  { id: "consult", size: "w" },
  { id: "games", size: "w" },
  { id: "supplements", size: "w" },
  { id: "cgm", size: "w" },
];

const KEY = "phenome.v2.bento.10";

function load(): Slot[] {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Slot[] | null;
    // any subset of the known cards, each once: a card the member removed simply is not in the list
    const ids = saved?.map((s) => s.id) ?? [];
    if (saved?.length && new Set(ids).size === ids.length && saved.every((s) => SIZES[s.id]?.includes(s.size))) return saved;
  } catch {
    // private window or corrupt value: fall through to the default layout
  }
  return DEFAULT;
}

function save(slots: Slot[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(slots));
  } catch {
    // storage blocked: the layout simply lasts for this session
  }
}

const HOLD_MS = 380;

/** Card layout: long-press to enter edit, drag to reorder, step a card through its sizes. */
export function useBento(editing: boolean, onEdit: (on: boolean) => void) {
  const [slots, setSlots] = useState<Slot[]>(load);
  const [dragging, setDragging] = useState<string | null>(null);
  const hold = useRef(0);
  const start = useRef({ x: 0, y: 0, gx: 0, gy: 0, el: null as HTMLElement | null });
  const held = useRef(false);
  const lastSwap = useRef<string | null>(null);

  useEffect(() => save(slots), [slots]);

  const resize = useCallback((id: string) => {
    setSlots((all) =>
      all.map((s) => {
        if (s.id !== id) return s;
        const list = SIZES[id];
        return { ...s, size: list[(list.indexOf(s.size) + 1) % list.length] };
      }),
    );
  }, []);

  const reset = useCallback(() => setSlots(DEFAULT), []);

  /** Take a card off Home; the last one stays, so the page is never empty. */
  const remove = useCallback((id: string) => setSlots((all) => (all.length > 1 ? all.filter((s) => s.id !== id) : all)), []);

  /** Put a removed card back at the end, at its first size. */
  const restore = useCallback((id: string) => setSlots((all) => (all.some((s) => s.id === id) ? all : [...all, { id, size: SIZES[id][0] }])), []);

  const hidden = Object.keys(SIZES).filter((id) => !slots.some((s) => s.id === id));

  const down = (e: ReactPointerEvent<HTMLElement>, id: string) => {
    const box = e.currentTarget.getBoundingClientRect();
    start.current = { x: e.clientX, y: e.clientY, gx: e.clientX - box.left, gy: e.clientY - box.top, el: e.currentTarget };
    held.current = false;
    window.clearTimeout(hold.current);
    if (editing) {
      setDragging(id);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    hold.current = window.setTimeout(() => {
      held.current = true;
      onEdit(true);
    }, HOLD_MS);
  };

  const move = (e: ReactPointerEvent<HTMLElement>, id: string) => {
    const { x, y, el } = start.current;
    if (!editing) {
      if (Math.hypot(e.clientX - x, e.clientY - y) > 8) window.clearTimeout(hold.current);
      return;
    }
    if (dragging !== id || !el) return;
    el.style.transform = `translate(${e.clientX - x}px,${e.clientY - y}px) scale(1.03)`;
    el.style.pointerEvents = "none";
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-card]");
    el.style.pointerEvents = "";
    const target = over?.dataset.card;
    if (!target || target === id) {
      lastSwap.current = null;
      return;
    }
    if (target === lastSwap.current) return;
    lastSwap.current = target;
    flushSync(() =>
      setSlots((all) => {
        const from = all.findIndex((s) => s.id === id);
        const to = all.findIndex((s) => s.id === target);
        const next = [...all];
        next.splice(to, 0, next.splice(from, 1)[0]);
        return next;
      }),
    );
    // the card has reflowed under the finger: re-anchor it to the point it was grabbed by
    el.style.transform = "";
    const after = el.getBoundingClientRect();
    start.current = { ...start.current, x: after.left + start.current.gx, y: after.top + start.current.gy };
    el.style.transform = `translate(${e.clientX - start.current.x}px,${e.clientY - start.current.y}px) scale(1.03)`;
  };

  const up = () => {
    window.clearTimeout(hold.current);
    lastSwap.current = null;
    if (start.current.el) start.current.el.style.transform = "";
    setDragging(null);
  };

  /** A long-press must not also fire the card's tap. */
  const consumedHold = () => {
    const was = held.current;
    held.current = false;
    return was;
  };

  return { slots, hidden, dragging, resize, reset, remove, restore, down, move, up, consumedHold };
}
