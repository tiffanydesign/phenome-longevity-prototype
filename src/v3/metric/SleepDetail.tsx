import { metric } from "../data/metrics";
import { Chevron } from "../ui/icons";
import { Num } from "../ui/Num";
import { useGo } from "../ui/shell";
import { ScoreSegments, StageShares } from "./detailCharts";
import { NIGHTS, OVERNIGHT, PARTS, SCORE_BEFORE, scoreWord, STAGES } from "./sleepData";
import { PartRow } from "./SleepChild";
import "./sleep.css";

export { STAGES };

/*
 * Sleep's own sections, under last night's stages chart. Read in the order a
 * member asks: how good was it (the score and the four things it is made of,
 * each against the night before), what the night was made of (stages), when it
 * happened (the week's bed and wake times), and what the body did meanwhile.
 * Demo numbers, kept consistent with each other and with metrics.ts:
 * 7:54 asleep of 7:55 in bed (100% efficient), deep + REM = 2:50 (36%).
 */

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

export function SleepDetail() {
  const go = useGo();
  const score = Number(metric("sleepscore").value);
  const scoreBefore = SCORE_BEFORE;
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
          {PARTS.map((p) => (
            <PartRow key={p.id} p={p} onOpen={(e) => go(`/v3/metric/${p.id}`, { from: e.currentTarget })} />
          ))}
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
