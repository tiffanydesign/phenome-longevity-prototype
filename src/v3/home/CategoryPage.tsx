import { metric, STATUS_LABEL, type Tab } from "../data/metrics";
import { glyphOf, Kind } from "../ui/glyphs";
import { Num } from "../ui/Num";
import { useGo } from "../ui/shell";
import { TabVerdict } from "./TabVerdict";

interface Page {
  title: string;
  cards: string[];
}

const PAGES: Record<Exclude<Tab, "all">, Page> = {
  activity: {
    title: "Activity",
    cards: ["steps", "kcal", "workouts", "distance"],
  },
  sleep: {
    title: "Sleep",
    cards: ["sleepscore", "sleep", "deep", "consistency", "efficiency", "hoursneeds", "restorative", "temp"],
  },
  vitals: {
    title: "Vitals",
    cards: ["capacity", "rhr", "hr", "hrv", "bpd", "spo2d", "respd"],
  },
  body: {
    title: "Body",
    cards: ["weight", "bmi", "bodyfat", "visceral", "bone", "skin"],
  },
  food: {
    title: "Nutrition",
    cards: ["diet", "habits"],
  },
};

/** A tab's readings, all from the ring, the band and the diary; a reading outside its range comes first, so it is never buried. */
function groupsOf(cards: string[]) {
  const ms = cards.map((id) => metric(id)).filter((m) => m.source !== "clinic" && m.source !== "omics");
  const list = [...ms].sort((a, b) => Number(b.status !== "normal") - Number(a.status !== "normal"));
  return [{ id: "today", title: "Today", meta: "", list }].filter((g) => g.list.length > 0);
}

export function CategoryPage({ tab }: { tab: Exclude<Tab, "all"> }) {
  const page = PAGES[tab];
  return (
    <div className="v2-cat">
      <TabVerdict tab={tab as Exclude<Tab, "all" | "body">} />
      {groupsOf(page.cards).map((g) => (
        <section key={g.id} className="v2-group" aria-label={g.title}>
          <header className="v2-sec">
            <h3>{g.title}</h3>
            {g.meta && <span>{g.meta}</span>}
          </header>
          {g.list.map((m) => (
            <MetricCard key={m.id} id={m.id} />
          ))}
        </section>
      ))}
    </div>
  );
}

/** The way a change went, as a small arrow, when its words start with a sign; nothing for a change without one. */
function Direction({ delta }: { delta: string }) {
  const sign = delta.trim()[0];
  if (sign !== "+" && sign !== "−" && sign !== "-") return null;
  return (
    <svg className="v2-card-dir" width="12" height="12" viewBox="0 0 12 12" aria-label={sign === "+" ? "up" : "down"}>
      <path d={sign === "+" ? "M6 10V2.6M2.6 5.6 6 2.2l3.4 3.4" : "M6 2v7.4M2.6 6.4 6 9.8l3.4-3.4"} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Overview to detail: the card keeps its number and trend, and grows into the metric's page. */
function MetricCard({ id }: { id: string }) {
  const go = useGo();
  const m = metric(id);
  const flagged = m.status !== "normal";
  return (
    <button className="v2-card" data-field={m.field} data-flag={flagged ? "" : undefined} onClick={(e) => go(m.id === "habits" ? "/v3/habits" : `/v3/metric/${m.id}`, { from: e.currentTarget })}>
      <Kind name={glyphOf(m.id)}>{m.label}</Kind>
      <span className="v2-card-v">
        <b>
          <Num v={m.value} />
        </b>{" "}
        {m.unit}
      </span>
      <span className="v2-card-foot">
        {flagged && <em className="v2-card-flag">{STATUS_LABEL[m.status]}</em>}
        <span className="v2-card-d">
          <Direction delta={m.delta} />
          {m.delta.replace(/^[+−-]\s?/, "")}
        </span>
      </span>
    </button>
  );
}
