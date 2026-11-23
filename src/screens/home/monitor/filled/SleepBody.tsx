import { Gauge } from "@/components/Charts";
import { Icon } from "@/components/Icon";
import type { MetricDef, Period } from "@/data/home-monitor";
import { sleepSeries, type SleepChart } from "@/data/real/sleep";
import { FilledChart } from "./FilledChart";
import { Analysis, Arrow, DeltaPill, Dot, InfoGlyph, parseShown } from "./parts";

/**
 * Sleep Score and the four sleep sub-scores with data — capture data2/mon/{sleep_score,
 * hours_vs_needs,sleep_consistency,sleep_efficiency,restorative_sleep}. The page is a run of
 * sections; they are read in order from the captured labels:
 *   <heading> <left label> <right label> "<v> <unit> ▲|▼" "<v> <unit> ●"   → comparison
 *   "Longevity Analysis" <text>                                         → grey analysis card
 *   "Sleep Consistency Breakdown…" "1x" "Consistent" …                  → breakdown card
 *   (score D) tiles, "Last Night", stages, "Hours of Sleep" card
 */

const PAIR = /^(Today|Yesterday|This Week|Last Week|This Month|Last Month|Current|Previous)$/;
const VAL = /^(.+?)\s*([▲▼●])$/;
const HEADINGS = new Set([
  "Average Sleep",
  "Average Restorative Sleep",
  "Restorative Sleep",
  "Hours vs Needs",
  "Sleep Consistency",
  "Sleep Efficiency",
  "Average Sleep Efficiency",
  "Sleep Needed",
  "Hours of Sleep",
  "Sleep Stress",
]);
const TONE = { up: "var(--c-success)", down: "var(--c-danger)" };

type Section =
  | { t: "compare"; title: string; l: [string, string]; v: [string, string] }
  | { t: "analysis"; text: string }
  | { t: "breakdown"; title: string; rows: [string, string][] }
  | { t: "tiles"; rows: [string, string][] }
  | { t: "lastNight"; v: [string, string] }
  | { t: "stages"; rows: [string, string][] }
  | { t: "hours"; hours: string; needed: string }
  | { t: "chart"; title: string }
  | { t: "asleep"; asleep: string; awake: string; events: string }
  | { t: "stress"; rows: [string, string, string?][] }
  | { t: "about"; title: string; text: string };

function sections(ls: string[], start: number): Section[] {
  const out: Section[] = [];
  let i = start;
  while (i < ls.length) {
    const x = ls[i];
    if (x === "Longevity Analysis") {
      out.push({ t: "analysis", text: ls[i + 1] });
      i += 2;
    } else if (x.startsWith("Sleep Consistency Breakdown")) {
      const rows: [string, string][] = [];
      let j = i + 1;
      while (j + 1 < ls.length && /^\d+x$/.test(ls[j])) {
        rows.push([ls[j], ls[j + 1]]);
        j += 2;
      }
      // the third count is sometimes merged away when it equals the first
      if (rows.length === 2 && ls[j] === "Irregular") {
        rows.push([rows[0][0], "Irregular"]);
        j += 1;
      }
      out.push({ t: "breakdown", title: x, rows });
      i = j;
    } else if (x === "Hours vs Needed" && ls[i + 1] === "Sleep Consistency") {
      const names = ls.slice(i, i + 3);
      const vals = ls.slice(i + 3, i + 6);
      out.push({ t: "tiles", rows: names.map((n, k) => [n, vals[k]] as [string, string]) });
      i += 6;
      while (/^\d+%$/.test(ls[i] ?? "")) i++; // duplicated read-outs under the bars
    } else if (x === "Last Night") {
      out.push({ t: "lastNight", v: [ls[i + 3], ls[i + 4]] });
      i += 5;
    } else if (x === "Your Usual Range") {
      const rows: [string, string][] = [];
      let j = i + 1;
      while (j + 1 < ls.length && /^(Awake|Light Sleep|Deep Sleep|REM)$/.test(ls[j])) {
        rows.push([ls[j], ls[j + 1]]);
        j += 2;
      }
      out.push({ t: "stages", rows });
      i = j;
    } else if (x === "Hours of Sleep" && /^\d+:\d+$/.test(ls[i + 1] ?? "")) {
      const j = ls.indexOf("Sleep Needed", i);
      out.push({ t: "hours", hours: ls[i + 1], needed: ls[j + 1] });
      i = j + 2;
    } else if (HEADINGS.has(x) && PAIR.test(ls[i + 1] ?? "") && VAL.test(ls[i + 3] ?? "")) {
      out.push({ t: "compare", title: x, l: [ls[i + 1], ls[i + 2]], v: [ls[i + 3], ls[i + 4]] });
      i += 5;
    } else if (HEADINGS.has(x) && VAL.test(ls[i + 1] ?? "")) {
      // a later comparison under the same pair labels (labels read once above)
      const prev = [...out].reverse().find((s): s is Extract<Section, { t: "compare" }> => s.t === "compare");
      out.push({ t: "compare", title: x, l: prev?.l ?? ["Current", "Previous"], v: [ls[i + 1], ls[i + 2]] });
      i += 3;
    } else if (x === "Asleep" && ls[i + 2] === "Awake") {
      out.push({ t: "asleep", asleep: ls[i + 1], awake: ls[i + 3], events: ls[i + 4]?.startsWith("Wake Events") ? ls[i + 4] : "" });
      i += ls[i + 4]?.startsWith("Wake Events") ? 5 : 4;
    } else if (x === "High" && ls.includes("Low", i)) {
      // High / Medium / Low, each followed by one or two read-outs (D: time + %, W…: % + %)
      const rows: [string, string, string?][] = [];
      let j = i;
      while (/^(High|Medium|Low)$/.test(ls[j] ?? "")) {
        const vals: string[] = [];
        let k = j + 1;
        while (k < ls.length && !/^(High|Medium|Low)$/.test(ls[k]) && !ls[k].startsWith("About ") && vals.length < 2) vals.push(ls[k++]);
        rows.push([ls[j], vals[0] ?? "", vals[1]]);
        j = k;
      }
      out.push({ t: "stress", rows });
      i = j;
    } else if (x.startsWith("About ") && ls[i + 1]) {
      out.push({ t: "about", title: x, text: ls[i + 1] });
      i += 2;
    } else if (x === "Optimal Bed/Wake Time" || x === "Deep Sleep" || x === "Sleep Score") {
      out.push({ t: "chart", title: x });
      i += x === "Deep Sleep" ? 2 : 1;
    } else {
      i += 1;
    }
  }
  return out;
}

/** "7:25 hours ▲" → value, unit, arrow */
function splitVal(s: string): { v: string; unit: string; mark: string } {
  const m = VAL.exec(s);
  const body = m ? m[1] : s;
  const mark = m ? m[2] : "";
  const [v, ...rest] = body.split(" ");
  return { v, unit: rest.join(" "), mark };
}

export function SleepScoreBody({ m, labels, period }: { m: MetricDef; labels: string[]; period: Period }) {
  // labels: date, score, rating, desc, …
  const [, score, rating, desc] = labels;
  const secs = sections(labels, 4);
  return (
    <>
      <div className="mon-gauge fs-gauge">
        <Gauge width={362} stroke={20} value={parseShown(score) / 100} color={m.color}>
          <span className="fs-gauge-val">
            <b>{score}</b>
            <span className="fs-rating">
              {rating} <InfoGlyph size={10} />
            </span>
          </span>
        </Gauge>
      </div>
      <p className="mon-desc fs-desc">{desc}</p>
      {period !== "D" && <ChartBlock title="Sleep Score" chart={sleepSeries("sleep", period)} color={m.color} />}
      <Sections secs={secs} m={m} period={period} skipFirstChart={period !== "D"} />
    </>
  );
}

export function SleepSubBody({ m, labels, period }: { m: MetricDef; labels: string[]; period: Period }) {
  // labels: date, AVERAGE, value, unit, [delta], desc, …
  const [, eyebrow, value, unit] = labels;
  let i = 4;
  const delta = /^\d+% vs /.test(labels[i]) ? labels[i++] : undefined;
  const desc = labels[i++];
  const secs = sections(labels, i);
  const first = secs.find((s): s is Extract<Section, { t: "compare" }> => s.t === "compare");
  const up = first ? parseShown(splitVal(first.v[0]).v) >= parseShown(splitVal(first.v[1]).v) : true;
  return (
    <>
      <span className="mon-eyebrow">{eyebrow}</span>
      <div className="fv-big fv-big-one">
        {value}
        <small style={{ color: m.color }}>{unit}</small>
      </div>
      {delta && <DeltaPill text={delta} up={up} />}
      <p className="mon-desc">{desc}</p>
      <FilledChart s={sleepSeries(m.id, period).s} kind="bar" color={m.color} ticks={sleepSeries(m.id, period).ticks} fmt={sleepSeries(m.id, period).fmt} />
      <Sections secs={secs} m={m} period={period} />
    </>
  );
}

function ChartBlock({ title, chart, color }: { title: string; chart: SleepChart; color: string }) {
  return (
    <>
      <h2 className="mon-h2 fs-head">{title}</h2>
      <div className="fs-chartcard">
        <FilledChart s={chart.s} kind="bar" color={color} ticks={chart.ticks} fmt={chart.fmt} valueLabels />
      </div>
    </>
  );
}

function Sections({ secs, m, period, skipFirstChart }: { secs: Section[]; m: MetricDef; period: Period; skipFirstChart?: boolean }) {
  let skipped = !skipFirstChart;
  return (
    <>
      {secs.map((s, k) => {
        switch (s.t) {
          case "analysis":
            return <Analysis key={k} text={s.text} tone="plain" />;
          case "compare":
            return <Compare key={k} s={s} />;
          case "breakdown":
            return <Breakdown key={k} s={s} />;
          case "tiles":
            return <Tiles key={k} rows={s.rows} />;
          case "lastNight":
            return <LastNight key={k} v={s.v} color={m.color} />;
          case "stages":
            return <Stages key={k} rows={s.rows} />;
          case "hours":
            return <HoursCard key={k} hours={s.hours} needed={s.needed} />;
          case "asleep":
            return <AsleepCard key={k} s={s} />;
          case "stress":
            return <StressRows key={k} rows={s.rows} daily={period === "D"} />;
          case "about":
            return (
              <div key={k}>
                <h2 className="mon-h2 fv-about-title">{s.title}</h2>
                <p className="mon-about">{s.text}</p>
              </div>
            );
          case "chart":
            if (!skipped && s.title === "Sleep Score") {
              skipped = true;
              return null;
            }
            if (s.title === "Deep Sleep") return <DeepRemLegend key={k} period={period} />;
            return null;
        }
      })}
    </>
  );
}

function Compare({ s }: { s: Extract<Section, { t: "compare" }> }) {
  const a = splitVal(s.v[0]);
  const b = splitVal(s.v[1]);
  // lower sleep stress is the good direction
  const good = s.title === "Sleep Stress" ? a.mark !== "▲" : a.mark !== "▼";
  const color = good ? TONE.up : TONE.down;
  return (
    <section className="fs-cmp">
      <h2 className="mon-h2">
        {s.title} <InfoGlyph size={14} />
      </h2>
      <div className="mon-pair fs-pair">
        <span className="mon-lbl">{s.l[0]}</span>
        <span className="mon-lbl fs-prev-lbl">{s.l[1]}</span>
        <span className="fs-v" style={{ color }}>
          <b>{a.v}</b> {a.unit}
          {a.mark !== "●" && <Arrow up={a.mark !== "▼"} />}
        </span>
        <span className="fs-v fs-prev">
          <b>{b.v}</b> {b.unit}
          <Dot />
        </span>
      </div>
    </section>
  );
}

const BREAK = ["#af5edc", "#65c466", "#f09343"];
function Breakdown({ s }: { s: Extract<Section, { t: "breakdown" }> }) {
  const counts = s.rows.map(([n]) => parseInt(n, 10) || 0);
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="fv-card fs-break">
      <h3>
        {s.title} <InfoGlyph size={12} />
      </h3>
      <div className="fs-break-bar">
        {counts.map((c, k) => c > 0 && <i key={k} style={{ flex: c / total, background: BREAK[k] }} />)}
      </div>
      {s.rows.map(([n, label], k) => (
        <div className="fs-break-row" key={label}>
          <i style={{ background: BREAK[k] }} />
          <b>{n}</b> {label}
        </div>
      ))}
    </div>
  );
}

const TILE_ICON: Record<string, string> = {
  "Hours vs Needed": "sleep_hours_vs_needs",
  "Sleep Consistency": "sleep_consistency",
  "Sleep Efficiency": "sleep_efficiency",
};
function Tiles({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mon-tiles">
      {rows.map(([label, v]) => {
        const pct = parseShown(v);
        const color = pct >= 85 ? "#65c466" : pct >= 50 ? "#f09343" : "#eb4e3d";
        return (
          <div className="mon-tile" key={label}>
            <Icon name={TILE_ICON[label] ?? "sleep_efficiency"} size={19} className="mon-tile-icon" />
            <span className="mon-tile-label">{label}</span>
            <span className="mon-tile-val">{v}</span>
            <span className="mon-tile-bar fs-tile-bar">
              <i style={{ width: `${Math.min(100, pct)}%`, background: color }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LastNight({ v, color }: { v: [string, string]; color: string }) {
  return (
    <>
      <h2 className="mon-h2 fs-head">
        Last Night <InfoGlyph size={14} />
      </h2>
      <div className="mon-pair fs-pair">
        <span className="mon-lbl">Duration</span>
        <span className="mon-lbl">Restorative</span>
        {v.map((x) => {
          const [n, ...u] = x.split(" ");
          return (
            <span className="fs-v fs-v-l" key={x}>
              <b>{n}</b> <span style={{ color }}>{u.join(" ")}</span>
            </span>
          );
        })}
      </div>
    </>
  );
}

/**
 * Stage rows (capture sleep_score/D_2): value bar on a grey track and a pale usual-range
 * segment with dashed ends. Track = 6 h for light sleep, 2 h otherwise; usual ranges read
 * off the screenshot.
 */
const STAGE: Record<string, { color: string; max: number; usual: [number, number] }> = {
  Awake: { color: "#65c466", max: 2, usual: [0.15, 1.6] },
  "Light Sleep": { color: "#4f9cf0", max: 6.6, usual: [3.8, 4.7] },
  "Deep Sleep": { color: "#cf4df3", max: 1.7, usual: [1.15, 1.3] },
  REM: { color: "#f09343", max: 2.2, usual: [1.2, 1.6] },
};
function Stages({ rows }: { rows: [string, string][] }) {
  return (
    <div className="fv-card fs-stages">
      <div className="fc-legend fs-legend">
        <i style={{ background: "#af5edc" }} /> Your Usual Range
      </div>
      {rows.map(([name, v]) => {
        const st = STAGE[name];
        const h = parseShown(v) / 60;
        const pct = (x: number) => `${Math.min(100, (x / st.max) * 100)}%`;
        return (
          <div className="fs-stage" key={name}>
            <span>{name}</span>
            <span>{v}</span>
            <span className="fs-track">
              <i className="fs-usual" style={{ left: pct(st.usual[0]), width: `calc(${pct(st.usual[1])} - ${pct(st.usual[0])})` }} />
              <i className="fs-fill" style={{ width: pct(h), background: st.color }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HoursCard({ hours, needed }: { hours: string; needed: string }) {
  const frac = parseShown(hours) / (parseShown(needed) || 1);
  return (
    <div className="fv-card fs-hours">
      <div>
        <span>Hours of Sleep</span>
        <span>{hours}</span>
      </div>
      <span className="fs-track fs-track-hours">
        <i className="fs-fill" style={{ width: `${Math.min(100, frac * 100)}%`, background: "#cf4df3" }} />
      </span>
      <div className="fs-needed">
        <span>Sleep Needed</span>
        <span>{needed}</span>
      </div>
    </div>
  );
}

function DeepRemLegend({ period }: { period: Period }) {
  const c = sleepSeries("sleep-stack", period);
  return (
    <>
      <div className="fs-legend2">
        <span>
          <i style={{ background: "#af5edc" }} /> Deep Sleep
        </span>
        <span>
          <i style={{ background: "#f09343" }} /> REM
        </span>
      </div>
      <div className="fs-chartcard">
        <FilledChart s={c.s} kind="bar" color="#af5edc" ticks={c.ticks} fmt={c.fmt} stack2="#f09343" />
      </div>
    </>
  );
}

function AsleepCard({ s }: { s: Extract<Section, { t: "asleep" }> }) {
  const total = parseShown(s.asleep) + parseShown(s.awake) || 1;
  return (
    <div className="fv-card fs-hours">
      <div>
        <span>Asleep</span>
        <span>{s.asleep}</span>
      </div>
      <span className="fs-track fs-track-hours">
        <i className="fs-fill" style={{ width: `${(parseShown(s.asleep) / total) * 100}%`, background: "#cf4df3" }} />
      </span>
      <div>
        <span>Awake</span>
        <span>{s.awake}</span>
      </div>
      <span className="fs-track fs-track-hours">
        <i className="fs-fill" style={{ left: "18%", width: 2, background: "#cf4df3" }} />
      </span>
      {s.events && <span className="fs-chip">{s.events}</span>}
    </div>
  );
}

const STRESS: Record<string, string> = { High: "#eb4e3d", Medium: "#f09343", Low: "#65c466" };
function StressRows({ rows, daily }: { rows: [string, string, string?][]; daily: boolean }) {
  return (
    <div className="fs-stress">
      {rows.map(([name, a, b]) => {
        const pct = parseShown((b ?? a).replace("%", ""));
        return (
          <div className="fs-stage" key={name}>
            <span>{name}</span>
            <span>{daily ? a : b ?? a}</span>
            <span className="fs-track">
              <i className="fs-fill" style={{ width: `${pct}%`, background: name === "Low" && !daily ? "#4fb3d9" : STRESS[name] }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
