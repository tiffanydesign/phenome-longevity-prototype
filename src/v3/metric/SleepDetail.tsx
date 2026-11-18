import type { CSSProperties } from "react";
import { metric } from "../data/metrics";
import { Chevron } from "../ui/icons";
import { Num } from "../ui/Num";
import { useGo } from "../ui/shell";
import { ScoreSegments, StageShares } from "./detailCharts";
import "./sleep.css";

/*
 * Sleep's own sections, under last night's stages chart. Read in the order a
 * member asks: how good was it (the score and the four things it is made of,
 * each against the night before), what the night was made of (stages), when it
 * happened (the week's bed and wake times), and what the body did meanwhile.
 * Demo numbers, kept consistent with each other and with metrics.ts:
 * 7:24 asleep of 8:08 in bed (91% efficient), deep + REM = 2:49 (38%).
 */

/**
 * The score's four parts: today and the comparison point, in the part's own unit
 * (restorative sleep is hours of deep + REM, the rest are percentages).
 */
const PARTS = [
  { id: "hoursneeds", name: "Hours vs needs", now: 96, before: 88, vs: "Yesterday", line: "7:24 of 7:40 needed", unit: "%" },
  { id: "efficiency", name: "Efficiency", now: 91, before: 89, vs: "Yesterday", line: "Awake 44 min in bed", unit: "%" },
  { id: "restorative", name: "Restorative", now: 169, before: 151, vs: "Yesterday", line: "Deep and REM, 38% of sleep", unit: "h", max: 240 },
  { id: "consistency", name: "Consistency", now: 78, before: 71, vs: "Last week", line: "Bedtime within 25 min", unit: "%" },
];

/** Minutes asleep by stage, plus awake time in bed; the usual share of the night for each. */
export const STAGES = [
  { stage: "Deep", min: 64, typical: [13, 23] as [number, number], label: "13–23%" },
  { stage: "REM", min: 105, typical: [20, 25] as [number, number], label: "20–25%" },
  { stage: "Core", min: 275, typical: [45, 60] as [number, number], label: "45–60%" },
  { stage: "Awake", min: 44, typical: [0, 10] as [number, number], label: "under 10%" },
] as const;

/** The week's nights: into bed and up, as minutes after 18:00 so the night reads left to right. */
const NIGHTS = [
  { day: "Tue", bed: "23:40", up: "07:05" },
  { day: "Wed", bed: "23:05", up: "06:50" },
  { day: "Thu", bed: "00:20", up: "07:30" },
  { day: "Fri", bed: "23:30", up: "07:45" },
  { day: "Sat", bed: "00:05", up: "08:10" },
  { day: "Sun", bed: "23:20", up: "07:00" },
  { day: "Last night", bed: "23:12", up: "07:20" },
];

/** What the ring read while the member slept; each opens its own page. */
const OVERNIGHT = [
  { id: "rhr", label: "Lowest heart rate", value: "52", unit: "bpm", word: "At 03:40" },
  { id: "hrv", label: "Heart rate variability", value: "48", unit: "ms", word: "Third night up" },
  { id: "spo2d", label: "Blood oxygen", value: "97", unit: "%", word: "Steady" },
  { id: "respd", label: "Respiratory rate", value: "14", unit: "/min", word: "Steady" },
  { id: "temp", label: "Skin temperature", value: "−0.2", unit: "°C", word: "Near baseline" },
];

const hm = (min: number) => `${Math.floor(min / 60)}:${String(Math.round(min % 60)).padStart(2, "0")}`;
/** clock time to minutes after 18:00 */
const at = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return ((h + 24 - 18) % 24) * 60 + m;
};
/** the schedule's window: 21:00 to 09:00 */
const FROM = at("21:00");
const SPAN = at("09:00") - FROM;
const x = (t: string) => `${((at(t) - FROM) / SPAN) * 100}%`;

/** the week's average of clock times that may cross midnight */
function avgClock(ts: string[]) {
  const m = Math.round(ts.reduce((n, t) => n + at(t), 0) / ts.length) + 18 * 60;
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
/** the week's average time in bed, in minutes */
const avgBed = () => NIGHTS.reduce((n, d) => n + at(d.up) - at(d.bed), 0) / NIGHTS.length;

function scoreWord(v: number) {
  return v >= 85 ? "Excellent" : v >= 70 ? "Good" : v >= 50 ? "Fair" : "Poor";
}

export function SleepDetail() {
  const go = useGo();
  const score = Number(metric("sleepscore").value);
  const scoreBefore = 78;
  const asleep = STAGES.filter((s) => s.stage !== "Awake").reduce((n, s) => n + s.min, 0);
  const inBed = asleep + STAGES[3].min;

  return (
    <>
      {/* 1 · how good the night was: the score, then the four things it is made of */}
      <section className="mx-block sl-block">
        <h2 className="mx-h">Sleep score</h2>
        <button className="mx-card sl-score" onClick={(e) => go("/v3/metric/sleepscore", { from: e.currentTarget })}>
          <ScoreSegments score={score} word={scoreWord(score)} />
          <span className="sl-score-t">
            <b>
              {score >= scoreBefore ? "+" : "−"}
              {Math.abs(score - scoreBefore)} on the night before
            </b>
            <small>Longer, with more deep sleep.</small>
          </span>
          <Chevron size={14} />
        </button>

        <div className="mx-card sl-parts">
          {PARTS.map((p) => {
            const max = p.max ?? 100;
            const up = p.now >= p.before;
            const hours = p.unit === "h";
            // hours read as h:mm, percentages as plain numbers
            const val = (v: number) => (hours ? hm(v) : String(v));
            return (
              <button key={p.id} className="sl-part" data-field={metric(p.id).field} onClick={(e) => go(`/v3/metric/${p.id}`, { from: e.currentTarget })}>
                <span className="sl-part-head">
                  <span className="sl-part-name">{p.name}</span>
                  <b>
                    {val(p.now)}
                    <u>{p.unit}</u>
                  </b>
                </span>
                {/* today's bar in the part's hue; a thin tick marks where the comparison point stood */}
                <span className="sl-bar" style={{ "--now": `${(p.now / max) * 100}%`, "--was": `${(p.before / max) * 100}%` } as CSSProperties}>
                  <i />
                  <em aria-hidden />
                </span>
                <span className="sl-part-foot">
                  <span>{p.line}</span>
                  <span data-up={up ? "" : undefined}>
                    {up ? "▲" : "▼"} {val(Math.abs(p.now - p.before))}
                    {hours ? " h" : ""}
                  </span>
                </span>
                {/* the comparison point written out, as the original monitor set today beside yesterday */}
                <span className="sl-part-was">
                  {p.vs}{" "}
                  <b>
                    {val(p.before)}
                    {p.unit === "%" ? "%" : " h"}
                  </b>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2 · what the night was made of */}
      <section className="mx-block sl-block">
        <h2 className="mx-h">Stages</h2>
        <div className="mx-card sl-stages">
          <p className="sl-sum">
            <b>{hm(asleep)}</b> asleep of <b>{hm(inBed)}</b> in bed
          </p>
          <StageShares
            rows={STAGES.map((s) => ({
              stage: s.stage,
              share: Math.round((s.min / (s.stage === "Awake" ? inBed : asleep)) * 100),
              typical: s.typical,
              label: s.label,
            }))}
          />
        </div>
      </section>

      {/* 3 · when it happened: seven nights on one clock, last night in the sleep hue */}
      <section className="mx-block sl-block">
        <h2 className="mx-h">Schedule</h2>
        <div className="mx-card sl-sched">
          <div className="mx-grid sl-facts">
            {[
              { k: "Bedtime", v: "23:12", avg: avgClock(NIGHTS.map((n) => n.bed)), field: "apricot" },
              { k: "Woke", v: "07:20", avg: avgClock(NIGHTS.map((n) => n.up)), field: "sage" },
              { k: "Asleep in", v: "14 min", avg: "18 min", field: "violet" },
              { k: "Time in bed", v: hm(inBed), avg: hm(avgBed()), field: "periwinkle" },
            ].map((f) => (
              <div key={f.k} className="mx-read" data-field={f.field}>
                <small>{f.k}</small>
                <b>{f.v}</b>
                <span>Avg: {f.avg}</span>
              </div>
            ))}
          </div>
          <div className="sl-nights">
            {NIGHTS.map((n, i) => (
              <div key={n.day} className="sl-night" data-last={i === NIGHTS.length - 1 ? "" : undefined}>
                <span>{n.day === "Last night" ? "Last" : n.day}</span>
                <span className="sl-night-lane">
                  <i style={{ left: x(n.bed), right: `calc(100% - ${x(n.up)})` }} />
                </span>
              </div>
            ))}
            <div className="sl-axis" aria-hidden>
              <span />
              <span className="sl-axis-t">
                <i>21:00</i>
                <i>00:00</i>
                <i>03:00</i>
                <i>06:00</i>
                <i>09:00</i>
              </span>
            </div>
          </div>
          <p className="sl-note">Your bedtime moved by up to 75 minutes this week. Within 30 minutes most nights lifts consistency fastest.</p>
        </div>
      </section>

      {/* 4 · what the body did meanwhile */}
      <section className="mx-block sl-block">
        <h2 className="mx-h">While you slept</h2>
        <div className="mx-grid">
          {OVERNIGHT.map((r) => (
            <button key={r.id} className="mx-read" data-field="sleep" onClick={() => go(`/v3/metric/${r.id}`)}>
              <small>
                {r.label}
                <Chevron size={13} />
              </small>
              <b>
                <Num v={r.value} /> <u>{r.unit}</u>
              </b>
              <span>{r.word}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
