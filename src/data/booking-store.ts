import { useSyncExternalStore } from "react";
import { CLINICS, CONSULT_TYPES, PRICE, TIMEZONE, type ConsultTypeId } from "./discover";

/**
 * The member's next booked consultation, kept across reloads. Only the clinical
 * edition reads it: Home shows it as "Upcoming", and its own page previews it.
 */
export interface Booking {
  type: ConsultTypeId;
  clinicId: string;
  /** calendar day, UTC midnight ms (the booking flow's own day unit) */
  day: number;
  /** minutes since midnight, clinic wall time */
  start: number;
  minutes: number;
  price: string;
  timezone: string;
}

const KEY = "phenome.v3.booking";
const DAY_MS = 86_400_000;

/** The prototype opens with one session already booked, eight days out, so the booked state can be seen. */
function seed(): Booking {
  const n = new Date();
  const day = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) + 8 * DAY_MS;
  return { type: "inperson", clinicId: "sto", day, start: 10 * 60, minutes: 30, price: PRICE, timezone: TIMEZONE };
}

function read(): Booking | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "none") return null;
    if (raw) return JSON.parse(raw) as Booking;
  } catch {
    // storage blocked: fall back to the seeded booking
  }
  return seed();
}

let current: Booking | null = read();
const listeners = new Set<() => void>();

function write(b: Booking | null) {
  current = b;
  try {
    localStorage.setItem(KEY, b ? JSON.stringify(b) : "none");
  } catch {
    // kept for this visit only
  }
  listeners.forEach((l) => l());
}

export const bookingActions = {
  book: (b: Booking) => write(b),
  cancel: () => write(null),
  /** the review panel's "Upcoming": the seeded session, eight days out */
  seed: () => write(seed()),
};

export function useBooking(): Booking | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}

/* ---------------------------------------------------------------- reading a booking */

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts });
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export const bookingLabel = (b: Booking) => CONSULT_TYPES.find((t) => t.id === b.type)?.label ?? "Consultation";
export const bookingClinic = (b: Booking) => CLINICS.find((c) => c.id === b.clinicId) ?? CLINICS[0];
export const bookingTime = (b: Booking) => `${hhmm(b.start)}–${hhmm(b.start + b.minutes)}`;
export const bookingDay = (b: Booking) => ({
  weekday: fmt({ weekday: "short" }).format(b.day),
  weekdayLong: fmt({ weekday: "long" }).format(b.day),
  num: fmt({ day: "numeric" }).format(b.day),
  month: fmt({ month: "short" }).format(b.day),
  monthLong: fmt({ month: "long" }).format(b.day),
  year: fmt({ year: "numeric" }).format(b.day),
});

/** "Today", "Tomorrow", "In 8 days": how far off the session is, counted in calendar days. */
export function bookingWhen(b: Booking): string {
  const n = new Date();
  const today = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
  const days = Math.round((b.day - today) / DAY_MS);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}
