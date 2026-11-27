import { SHIPPING } from "@/data/store";

/*
 * What the checkout offers: address suggestions for the search, delivery
 * options and payment methods, and the order kept for the confirmation.
 *
 * DEMO: fixed suggestions stand in for an address service, and paying
 * places the order locally; no payment is taken.
 */

export interface Address {
  line1: string;
  postal: string;
  city: string;
  country: string;
}

export const ADDRESSES: Address[] = [
  { line1: "Sveavägen 44", postal: "111 34", city: "Stockholm", country: "Sweden" },
  { line1: "Sveavägen 98", postal: "113 50", city: "Stockholm", country: "Sweden" },
  { line1: "Sankt Eriksgatan 12", postal: "112 39", city: "Stockholm", country: "Sweden" },
  { line1: "Solnavägen 3", postal: "171 65", city: "Solna", country: "Sweden" },
  { line1: "Storgatan 7", postal: "753 31", city: "Uppsala", country: "Sweden" },
  { line1: "Södra Förstadsgatan 21", postal: "211 43", city: "Malmö", country: "Sweden" },
];

export function suggest(q: string): Address[] {
  const s = q.trim().toLowerCase();
  if (s.length < 2) return [];
  return ADDRESSES.filter((a) => `${a.line1} ${a.postal} ${a.city}`.toLowerCase().includes(s)).slice(0, 4);
}

export type ShipId = "standard" | "express";
export const SHIP: { id: ShipId; name: string; days: [number, number]; price: number }[] = [
  { id: "standard", name: "Standard", days: [2, 4], price: SHIPPING },
  { id: "express", name: "Express", days: [1, 1], price: 79 },
];

export type PayId = "card" | "swish" | "invoice";
export const PAY: { id: PayId; name: string; note: string }[] = [
  { id: "card", name: "Card ending 4242", note: "Saved · expires 08/28" },
  { id: "swish", name: "Swish", note: "Approve in the app on your phone" },
  { id: "invoice", name: "Invoice", note: "Pay within 30 days" },
];

/** Working days from today, skipping weekends. */
export function workingDay(n: number, from = new Date()): Date {
  const d = new Date(from);
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left--;
  }
  return d;
}

const day = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** "Tue 1 Dec", or "Tue 1 – Thu 3 Dec" when the range stays in one month. */
export function arrival(days: [number, number]): string {
  const a = workingDay(days[0]);
  const b = workingDay(days[1]);
  if (days[0] === days[1]) return day(a);
  const first = a.getMonth() === b.getMonth() ? a.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }) : day(a);
  return `${first} – ${day(b)}`;
}

/* ---------------------------------------------------------------- the placed order */

export interface PlacedOrder {
  no: string;
  lines: { name: string; detail?: string; qty: number; price: number; photo: string }[];
  total: number;
  address: Address & { line2?: string; name: string };
  ship: string;
  arrival: string;
  pay: string;
}

const ORDER_KEY = "phenome.v3.lastorder";

export function saveOrder(o: PlacedOrder) {
  try {
    sessionStorage.setItem(ORDER_KEY, JSON.stringify(o));
  } catch {
    // storage blocked: the confirmation falls back to the store
  }
}

export function readOrder(): PlacedOrder | null {
  try {
    return JSON.parse(sessionStorage.getItem(ORDER_KEY) ?? "null") as PlacedOrder | null;
  } catch {
    return null;
  }
}
