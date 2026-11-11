import { useEffect, useState, useSyncExternalStore } from "react";

/*
 * The hour the prototype reads the day by. Live follows the device clock; the
 * review panel can pin it to a part of the day so morning, afternoon and
 * evening states can all be seen whenever the prototype is opened.
 */
export type DayPart = "live" | "morning" | "afternoon" | "evening";
export const DAY_PARTS: DayPart[] = ["live", "morning", "afternoon", "evening"];
const PINNED: Record<Exclude<DayPart, "live">, number> = { morning: 8, afternoon: 14, evening: 19 };

const KEY = "phenome.v3.demo.daypart";

function read(): DayPart {
  try {
    const v = localStorage.getItem(KEY) as DayPart | null;
    return v && DAY_PARTS.includes(v) ? v : "live";
  } catch {
    return "live";
  }
}

let part: DayPart = read();
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function setDayPart(next: DayPart) {
  part = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // kept for this visit only
  }
  listeners.forEach((l) => l());
}

export const useDayPart = () => useSyncExternalStore(subscribe, () => part);

/** The hour now, pinned or live, outside React. */
export const hourNow = () => (part === "live" ? new Date().getHours() : PINNED[part]);

/** The hour now, kept fresh: a pinned part changes it at once, the live clock once a minute. */
export function useHour(): number {
  const p = useDayPart();
  const [live, setLive] = useState(() => new Date().getHours());
  useEffect(() => {
    const id = window.setInterval(() => setLive(new Date().getHours()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return p === "live" ? live : PINNED[p];
}
