import type { ReactNode } from "react";
import { readMemberMode, type MemberMode } from "@/lib/prefs";
import clinic from "./member.json";
import first from "./member-first.json";
import risk from "./member-risk.json";
import varied from "./member-varied.json";
import type { Tone } from "./parts";

/* eslint-disable @typescript-eslint/no-explicit-any -- the fixture mirrors the portal's loose payloads */
export type Rec = Record<string, any>;
/** the clinic portal's member, or a design scenario built from their results (DevPanel "Member") */
const MEMBERS: Record<MemberMode, unknown> = { clinic, varied, first, risk };
export const M = MEMBERS[readMemberMode()] as Rec;
/** the presentation studies this member has results for */
export const HAS = (code: string): boolean => (M.studies as string[]).includes(code);

export const VISITS: number[] = M.visits;
export const visitDate = (v: number): string => M.visitDates[String(v)];

/** The record for a visit, or the latest one before it when that visit has none. */
export const pick = (rows: Rec[], visit: number): Rec => rows.find((r) => r.visit === visit) ?? rows[rows.length - 1];
export const series = (rows: Rec[], key: string): number[] => rows.map((r) => Number(r[key]));
export const placeOf = (rows: Rec[], visit: number) => Math.max(0, rows.findIndex((r) => r.visit === visit));
export const trim = (n: number, d = 1) => String(Number(n.toFixed(d))).replace("-", "−");
export const words = (s?: string | null) => (s ? s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) : "");

export function said(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(said).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const groups: { reading: string; names: string[] }[] = [];
    Object.entries(value as Rec).forEach(([key, v]) => {
      const reading = said(v);
      if (!reading) return;
      const name = words(key.replace(/([a-z])([A-Z])/g, "$1 $2"));
      const same = groups.find((g) => g.reading === reading);
      if (same) same.names.push(name.toLowerCase());
      else groups.push({ reading, names: [name] });
    });
    return groups.map((g) => `${g.names.join(", ")} ${g.reading}`).join(" · ");
  }
  return String(value);
}

export interface StudyView {
  value: string;
  unit?: string;
  label?: string;
  tone?: Tone;
  status?: string;
  /** which halves of the value are outside their range */
  flagged?: number[];
  trend?: number[];
  at?: number;
  /** one record only: the visit control has nothing to step through */
  single?: string;
  cards: ReactNode;
}

export const IN = (tone: Tone = "ok", text = "In range") => ({ tone, status: text });
