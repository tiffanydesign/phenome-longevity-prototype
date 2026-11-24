import type { ReactNode } from "react";
import { metric, STATUS_LABEL, type Metric, type Tab } from "../data/metrics";
import { LifestyleBody } from "./Lifestyle";
import { glyphOf, Kind } from "../ui/glyphs";
import { Num } from "../ui/Num";
import { useGo } from "../ui/shell";
import { TabVerdict } from "./TabVerdict";
import { useDiaryMetric } from "./diary";
import { CardGlyph, stampOf } from "./CardGlyph";
import { ScoreSegments } from "../metric/detailCharts";
import { scoreWord } from "../metric/sleepData";
import { ActivityColumns, ActivityRings, useActivityParts } from "./ActivityRings";

interface Page {
  title: string;
  cards: string[];
}

const PAGES: Record<Exclude<Tab, "all">, Page> = {
  activity: {
    title: "Activity",
    cards: ["steps", "workouts", "kcal", "distance"],
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
    title: "Lifestyle",
    cards: [],
  },
};

/** A tab's readings, all from the ring, the band and the diary; a reading outside its range comes first, so it is never buried. */
function readingsOf(cards: string[]) {
  const ms = cards.map((id) => metric(id)).filter((m) => m.source !== "clinic" && m.source !== "omics");
  return [...ms].sort((a, b) => Number(b.status !== "normal") - Number(a.status !== "normal"));
}

export function CategoryPage({ tab }: { tab: Exclude<Tab, "all"> }) {
  const page = PAGES[tab];
  return (
    <div className="v2-cat">
      <TabVerdict tab={tab as Exclude<Tab, "all" | "body">} />
      {/* the tab's name heads its readings; "Today" is only a note beside it */}
      <section className="v2-group" aria-label={`${page.title} today`}>
        <header className="v2-sec v2-sec-tab">
          <h3>{page.title}</h3>
          <small className="v2-sec-note">Today</small>
        </header>
        {readingsOf(page.cards).map((m) =>
          m.id === "sleepscore" ? (
            <MetricCard key={m.id} id={m.id} glyph={<SleepScoreArc score={Number(m.value)} />} />
          ) : m.id === "workouts" ? (
            <ActivityRingsCard key={m.id} />
          ) : (
            <MetricCard key={m.id} id={m.id} />
          ),
        )}
        {tab === "food" && <LifestyleBody />}
      </section>
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

interface CardProps {
  id: string;
  /** a live reading to show in place of the table's row */
  m?: Metric;
  /** a picture of the card's own, for readings the shared set does not draw */
  glyph?: ReactNode;
  /** when the reading was last written; omitted, the shared rule decides */
  stamp?: string;
  /** where the card opens; the metric's own page by default */
  to?: string;
  /** a body of the card's own in place of the number and picture */
  body?: ReactNode;
}

/** The Activity tab's first card: move, training and steps as columns, three pink rings beside them. */
function ActivityRingsCard() {
  const parts = useActivityParts();
  return (
    <MetricCard
      id="workouts"
      m={{ ...metric("workouts"), field: "rose" }}
      body={
        <span className="ar-body">
          <ActivityColumns parts={parts} />
          <ActivityRings parts={parts} />
        </span>
      }
    />
  );
}

/** The sleep score card's picture: the Sleep page's arc, pale to full purple, with the score in it. */
function SleepScoreArc({ score }: { score: number }) {
  return (
    <span className="v2-card-arc">
      <ScoreSegments score={score} word={scoreWord(score)} />
    </span>
  );
}

export function MetricCard({ id, m: live, glyph, stamp: when, to, body }: CardProps) {
  const go = useGo();
  const row = useDiaryMetric(metric(id));
  const m = live ?? row;
  const flagged = m.status !== "normal";
  const stamp = when ?? stampOf(m);
  return (
    <button className="v2-card v2-card-x" data-field={m.field} data-flag={flagged ? "" : undefined} onClick={(e) => go(to ?? `/v3/metric/${m.id}`, { from: e.currentTarget })}>
      <span className="v2-card-h">
        <Kind name={glyphOf(m.id)} bare>
          {m.label}
        </Kind>
        <span className="v2-card-when">
          {stamp && <time>{stamp}</time>}
          <svg width="8" height="13" viewBox="0 0 8 13" fill="none" aria-hidden>
            <path d="M1.5 1.5 6.5 6.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
      {body ?? (
      <span className="v2-card-b">
        <span>
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
        </span>
        {glyph ?? <CardGlyph m={m} />}
      </span>
      )}
    </button>
  );
}
