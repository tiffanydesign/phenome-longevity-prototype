import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { metric, seriesFor, visitLabels, type Tab } from "../data/metrics";
import { HistoryChart } from "../ui/charts";
import { IconClose } from "../ui/icons";

interface Tip {
  /** one sentence the cards cannot say on their own: a link between readings, or a small thing to do */
  text: string;
  /** an optional history under it, with the metric it draws */
  chart?: { metric: string; title: string; marks?: { value: number; label: string }[] };
}

const weight = metric("weight");

const TIPS: Record<Exclude<Tab, "all">, Tip> = {
  activity: {
    text: "1,518 steps from your goal. A 15-minute walk this evening closes it.",
    chart: { metric: "steps", title: "Steps this week", marks: [{ value: 8000, label: "Goal" }] },
  },
  sleep: {
    text: "Third night above seven hours. Your HRV has risen with it.",
    chart: { metric: "hrv", title: "HRV this week" },
  },
  vitals: {
    text: "Recovery is ahead of your load today. A good day to train or stay active.",
    chart: { metric: "capacity", title: "Capacity this week" },
  },
  body: {
    text: `${weight.delta.replace(/^−/, "Down ")}, and body fat has come down with it.`,
    chart: { metric: "weight", title: "Weight at each visit" },
  },
  food: {
    text: "Protein is on pace for your 110 g goal. A light dinner keeps you inside the day's energy.",
  },
};

/** Each tab's own colour, the one its tab bar's selected icon wears, so the tip's chart belongs to its tab. */
const TAB_FIELD: Record<Exclude<Tab, "all">, string> = {
  activity: "activity",
  sleep: "sleep",
  vitals: "vitals",
  food: "food",
  body: "body",
};

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The last seven days by name, ending today. */
const weekLabels = () => Array.from({ length: 7 }, (_, i) => DAY[(new Date().getDay() + i + 1) % 7]);

const today = () => new Date().toISOString().slice(0, 10);
const keyOf = (tab: string) => `phenome.v2.tip.${tab}`;

function closedToday(tab: string): boolean {
  try {
    return localStorage.getItem(keyOf(tab)) === today();
  } catch {
    return false;
  }
}

/**
 * The tab's tip, at the top of its cards. Closed with the cross or a swipe to
 * either side, and gone for the rest of the day; tomorrow brings the next one.
 */
export function TipCard({ tab }: { tab: Exclude<Tab, "all"> }) {
  const tip = TIPS[tab];
  const [closed, setClosed] = useState(() => closedToday(tab));
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState(0);
  const start = useRef<number | null>(null);
  if (closed || !tip) return null;

  const close = (dir = 1) => {
    setLeaving(dir);
    try {
      localStorage.setItem(keyOf(tab), today());
    } catch {
      /* storage blocked: closed for this visit only */
    }
    window.setTimeout(() => setClosed(true), 220);
  };

  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    start.current = e.clientX;
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (start.current !== null) setDx(e.clientX - start.current);
  };
  const up = () => {
    if (Math.abs(dx) > 90) close(Math.sign(dx));
    else setDx(0);
    start.current = null;
  };

  const m = tip.chart ? metric(tip.chart.metric) : null;
  const clinic = m?.chart === "scan";
  const values = m ? (clinic ? m.scans ?? [] : seriesFor(m, "W")) : [];
  const labels = clinic ? visitLabels().map((_, i) => `Visit ${i + 1}`) : weekLabels();

  return (
    <div
      className="v2-tip"
      data-field={TAB_FIELD[tab]}
      data-leaving={leaving ? "" : undefined}
      style={{
        transform: leaving ? `translateX(${leaving * 110}%)` : dx ? `translateX(${dx}px)` : undefined,
        opacity: leaving ? 0 : 1 - Math.min(0.6, Math.abs(dx) / 300),
      }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <button className="v2-tip-close" aria-label="Close this tip" onClick={() => close()}>
        <IconClose />
      </button>
      <p className="v2-tip-text">{tip.text}</p>
      {m && tip.chart && values.length > 1 && (
        <>
          <h3 className="v2-tip-title">{tip.chart.title}</h3>
          <HistoryChart values={values} labels={labels.slice(-values.length)} marks={tip.chart.marks} />
        </>
      )}
    </div>
  );
}
