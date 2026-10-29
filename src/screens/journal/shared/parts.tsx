import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Segmented } from "@/components/Controls";
import { ChevronLeft, ChevronRight } from "@/components/NavHeader";
import { asset } from "@/lib/asset";
import { CloseIcon, EditIcon } from "./icons";
import "./journal.css";

export const PERIODS = ["D", "W", "M", "6M", "Y"] as const;
export type Period = (typeof PERIODS)[number];

export const fmtDay = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
export const fmtLongDay = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
export const fmtHM = (d: Date, sep = ":") =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }).replace(":", sep);
/** "Wednesday, 28 Oct 2026, 14:48" (meal_log/top) */
export const fmtStamp = (d: Date) => `${d.toLocaleDateString("en-GB", { weekday: "long" })}, ${fmtDay(d)}, ${fmtHM(d)}`;
export const fmtNum = (n: number) => Math.round(n).toLocaleString("en-GB");

/**
 * Journal nav bar. Module-local instead of NavHeader because the journal screens use two
 * geometries (Activity: 48 px hit box, title centre y 75; trackers: 28 px box, centre y 73)
 * and the workout form uses an ✕ instead of ‹.
 */
export function JHeader({
  title,
  kind = "tracker",
  icon = "chevron",
  right,
  onBack,
}: {
  title: ReactNode;
  kind?: "activity" | "tracker" | "meal";
  icon?: "chevron" | "close";
  right?: ReactNode;
  onBack?: () => void;
}) {
  const nav = useNavigate();
  return (
    <header className={`jr-nh jr-nh-${kind}`}>
      <button className="jr-nh-back" onClick={onBack ?? (() => nav(-1))} aria-label={icon === "close" ? "Close" : "Back"}>
        {icon === "close" ? <CloseIcon size={22} /> : <ChevronLeft size={24} />}
      </button>
      <h1 className="jr-nh-title">{title}</h1>
      <div className="jr-nh-right">{right}</div>
    </header>
  );
}

/** D/W/M/6M/Y switcher + "‹ 28 Oct 2026 ›" row (next disabled on today). */
export function PeriodBar({
  kind,
  period,
  onPeriod,
  offset,
  onOffset,
}: {
  kind: "activity" | "tracker";
  period: Period;
  onPeriod: (p: Period) => void;
  offset: number;
  onOffset: (o: number) => void;
}) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  // TODO(fidelity): only the D/today label was captured; W/M/6M/Y ranges not captured.
  const label = kind === "activity" && offset === 0 ? `Today, ${fmtDay(d)}` : fmtDay(d);
  return (
    <div className={`jr-period jr-period-${kind}`}>
      <div className="jr-seg">
        <Segmented options={PERIODS} value={period} onChange={onPeriod} />
      </div>
      <div className="jr-dates">
        <button className="jr-dates-arrow" onClick={() => onOffset(offset - 1)} aria-label="Previous">
          <ChevronLeft size={kind === "activity" ? 24 : 26} />
        </button>
        <span className="jr-dates-label">{label}</span>
        <button className="jr-dates-arrow" disabled={offset >= 0} onClick={() => onOffset(offset + 1)} aria-label="Next">
          <ChevronRight size={kind === "activity" ? 24 : 26} />
        </button>
      </div>
    </div>
  );
}

export function usePeriod() {
  const [period, setPeriod] = useState<Period>("D");
  const [offset, setOffset] = useState(0);
  return { period, setPeriod, offset, setOffset, isToday: period === "D" && offset === 0 };
}

/** CALORIES INTAKE / HABITS summary: big count, coloured goal, bar, "You have reached x%" pill. */
export function GoalBlock({
  eyebrow,
  value,
  goal,
  color,
  pct,
  message,
  editable,
}: {
  eyebrow: string;
  value: ReactNode;
  goal: string;
  color: string;
  pct: number;
  message: string;
  editable?: boolean;
}) {
  return (
    <section className="jr-goal">
      <span className="jr-goal-eyebrow">{eyebrow}</span>
      <div className="jr-goal-row">
        <span className="jr-goal-val">{value}</span>
        <span className="jr-goal-of" style={{ color }}>
          &nbsp;{goal}
        </span>
        {editable && (
          <span className="jr-goal-edit" aria-label="Edit goal">
            <EditIcon size={15} />
          </span>
        )}
      </div>
      <div className="jr-bar jr-goal-bar">
        <span style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
      <span className="jr-pill">{message}</span>
    </section>
  );
}

export type Macro = { label: string; value: string; tone: "protein" | "fat" | "carbs" | "fiber" };

/** Protein / Fat / Carbohydrates / Fiber pastel tiles. */
export function MacroTiles({ items, gap = 10.5 }: { items: Macro[]; gap?: number }) {
  return (
    <div className="jr-macros" style={{ gap: `${gap - 1}px ${gap}px` }}>
      {items.map((m) => (
        <div key={m.label} className={`jr-macro jr-macro-${m.tone}`}>
          <span className="jr-macro-label">{m.label}</span>
          <span className="jr-macro-val">{m.value}</span>
        </div>
      ))}
    </div>
  );
}

export type NutrientRow = { label: string; pct: number; bar: number; amount: string };

/** "Today's Total Nutrients" card: label · % · amount, orange bar (8 px). */
export function NutrientBars({ title, rows }: { title?: string; rows: NutrientRow[] }) {
  return (
    <section className="jr-nutr">
      {title && <h3 className="jr-nutr-title">{title}</h3>}
      {rows.map((r) => (
        <div key={r.label} className="jr-nutr-row">
          <div className="jr-nutr-head">
            <span className="jr-nutr-label">{r.label}</span>
            <span className="jr-nutr-pct">{r.pct}%</span>
            <span className="jr-nutr-amt">{r.amount}</span>
          </div>
          <div className="jr-bar jr-nutr-bar">
            <span style={{ width: r.bar > 0 ? `max(${Math.min(100, r.bar)}%, 8px)` : 0 }} />
          </div>
        </div>
      ))}
    </section>
  );
}

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];

/** M–S week strip with grey dots (filled = tracked day) + "You've tracked x / 7 days" pill. */
export function WeekStrip({ title, filled, accent }: { title: string; filled: boolean[]; accent: string }) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const count = filled.filter(Boolean).length;
  return (
    <section className="jr-week">
      <h3 className="jr-h3">{title}</h3>
      <div className="jr-week-row">
        {WEEK.map((w, i) => {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          return (
            <div key={i} className="jr-week-day">
              <span className="jr-week-dot" style={filled[i] ? { background: accent } : undefined} />
              <span className="jr-week-w">{w}</span>
              <span className="jr-week-n">{String(d.getDate()).padStart(2, "0")}</span>
            </div>
          );
        })}
      </div>
      <span className="jr-pill jr-week-pill">
        You've tracked <b style={{ color: accent }}>{count}</b> / 7 days this week
      </span>
    </section>
  );
}

/** Body copy section (Understanding Calorie Intake…). */
export function CopySection({ title, body }: { title: string; body: string }) {
  return (
    <section className="jr-copy">
      <h3 className="jr-h3">{title}</h3>
      <p className="jr-copy-body">{body}</p>
    </section>
  );
}

/**
 * Android soft keyboard (Gboard, cream theme) shown while a field has focus — cropped from
 * activity_add/search with the suggestion words painted out; suggestions are drawn as text.
 * TODO(fidelity): bottom-right key is ✓ in every state (add_habit/filled shows ↵ for Notes).
 */
export function SoftKeyboard({ suggestions }: { suggestions: string[] }) {
  return (
    <div className="jr-kb" aria-hidden onMouseDown={(e) => e.preventDefault()}>
      <img src={asset("photos/journal/keyboard.png")} alt="" draggable={false} />
      <div className="jr-kb-sugg">
        {suggestions.slice(0, 3).map((s, i) => (
          <span key={i}>{s}</span>
        ))}
      </div>
    </div>
  );
}

/** Very small suggestion model for the drawn keyboard: word itself + two common completions. */
export function suggest(text: string): string[] {
  const w = text.trim().split(/\s+/).pop()?.toLowerCase() ?? "";
  const known: Record<string, string[]> = {
    run: ["run", "running", "fun"],
    eggs: ["eggs", "egg's", "eggshell"],
    lunch: ["lunch", "lunchtime", "lunches"],
  };
  return known[w] ?? (w ? [w, `${w}s`, `${w}ing`] : ["", "", ""]);
}
