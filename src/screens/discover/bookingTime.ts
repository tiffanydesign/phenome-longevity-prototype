import { SLOT_CLOSE, SLOT_OPEN, TIMEZONE } from "@/data/discover";

/** Wall-clock "now" in Europe/Stockholm: calendar day (UTC-midnight ms) + minutes since midnight. */
export interface WallNow {
  day: number;
  minutes: number;
}

const DAY_MS = 86_400_000;

/**
 * Prototype hook: `#/discover/booking?now=2026-10-28T15:05` pins the clock (Stockholm wall time)
 * so compare shots are stable; otherwise the real current time in Europe/Stockholm is used.
 */
export function wallNow(): WallNow {
  const q = new URLSearchParams(window.location.hash.split("?")[1] ?? "").get("now");
  const m = q?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (m) {
    return { day: Date.UTC(+m[1], +m[2] - 1, +m[3]), minutes: +m[4] * 60 + +m[5] };
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return { day: Date.UTC(+parts.year, +parts.month - 1, +parts.day), minutes: +parts.hour * 60 + +parts.minute };
}

export const addDays = (day: number, n: number) => day + n * DAY_MS;

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts });
export const weekday = (day: number) => fmt({ weekday: "short" }).format(day);
export const dayNum = (day: number) => fmt({ day: "numeric" }).format(day);
export const month = (day: number) => fmt({ month: "short" }).format(day);
/** "Thu, 29 Oct 2026" */
export const longDate = (day: number) => `${weekday(day)}, ${dayNum(day)} ${month(day)} ${fmt({ year: "numeric" }).format(day)}`;

const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
export const slotLabel = (start: number, duration: number) => `${hhmm(start)}–${hhmm(start + duration)}`;

/**
 * 15-minute-step slots between SLOT_OPEN and SLOT_CLOSE; on today only slots strictly after now
 * (capture booking/datetime at ~15:05 starts with 15:15–15:45).
 * TODO(fidelity): real availability comes from the clinic calendar API; this is a uniform grid.
 */
export function slotsFor(day: number, now: WallNow, duration: number): number[] {
  const out: number[] = [];
  const from = day === now.day ? Math.max(SLOT_OPEN, Math.floor(now.minutes / 15) * 15 + 15) : SLOT_OPEN;
  for (let t = from; t + duration <= SLOT_CLOSE; t += 15) out.push(t);
  return out;
}
