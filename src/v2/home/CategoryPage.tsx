import { useMemo } from "react";
import { metric, seriesFor, STATUS_LABEL, type Tab } from "../data/metrics";
import { ORGANS } from "../data/organs";
import { CardTrend } from "../ui/charts";
import { DotArt, type Shape } from "../ui/DotArt";
import { Num } from "../ui/Num";
import { useGo } from "../ui/shell";

interface Page {
  title: string;
  /** Samsung Health's coaching line under the heading, written from the member's own numbers */
  coach: string;
  cards: { id: string; art?: Shape }[];
}

const PAGES: Record<Exclude<Tab, "all">, Page> = {
  activity: {
    title: "Activity",
    coach: "1,518 steps from your goal. A 15-minute walk this evening closes it.",
    cards: [{ id: "steps", art: "rings" }, { id: "kcal" }, { id: "workouts", art: "tick" }, { id: "distance" }],
  },
  sleep: {
    title: "Sleep",
    coach: "Third night above seven hours. Your HRV has risen with it.",
    cards: [{ id: "sleep", art: "moon" }, { id: "deep" }, { id: "temp" }],
  },
  vitals: {
    title: "Vitals",
    coach: "Recovery is ahead of your load today. hs-CRP is the one reading to watch.",
    cards: [{ id: "capacity", art: "gauge" }, { id: "rhr" }, { id: "hrv", art: "radar" }, { id: "crp" }, { id: "bp" }, { id: "spo2" }, { id: "resp" }],
  },
  body: {
    title: "Body",
    coach: "Weight is holding at 86 kg. BMI is the marker your clinician is watching.",
    cards: [{ id: "weight" }, { id: "bmi" }, { id: "visceral" }, { id: "bone" }, { id: "skin" }],
  },
  food: {
    title: "Food",
    coach: "760 kcal left today. Fibre has been high all week, and your gut shows it.",
    cards: [{ id: "diet", art: "plate" }, { id: "habits", art: "tick" }, { id: "diversity" }, { id: "glucose" }],
  },
};

export function CategoryPage({ tab }: { tab: Exclude<Tab, "all"> }) {
  const page = PAGES[tab];
  return (
    <div className="v2-cat">
      <h2>{page.title}</h2>
      <p>{page.coach}</p>
      {page.cards.map((c) => (
        <MetricCard key={c.id} id={c.id} art={c.art} />
      ))}
    </div>
  );
}

/** Overview to detail: the card keeps its number and trend, and grows into the metric's page. */
function MetricCard({ id, art }: { id: string; art?: Shape }) {
  const go = useGo();
  const m = metric(id);
  const organ = ORGANS[m.organ];
  const week = useMemo(() => (m.chart === "scan" ? [] : seriesFor(m, "W")), [m]);
  return (
    <button className="v2-card" data-field={m.field} data-flag={m.status === "monitor" ? "" : undefined} onClick={(e) => go(`/v2/metric/${m.id}`, { from: e.currentTarget })}>
      <span className="v2-card-art">{art ? <DotArt shape={art} size={132} /> : <DotArt organ={organ.map === "body" ? "body" : organ.map} size={150} />}</span>
      <span className="v2-card-t">{m.label}</span>
      <span className="v2-card-v">
        <b>
          <Num v={m.value} />
        </b>{" "}
        {m.unit}
      </span>
      <span className="v2-card-foot">
        <span className="v2-card-d">
          {m.status === "monitor" && <em>{STATUS_LABEL.monitor}</em>}
          {m.delta}
        </span>
        {m.chart !== "scan" && <CardTrend values={week} kind={m.chart} w={112} h={34} />}
      </span>
    </button>
  );
}
