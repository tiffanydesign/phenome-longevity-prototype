import type { CSSProperties, ReactNode } from "react";
import { metric } from "../data/metrics";
import { Chevron } from "../ui/icons";
import { Num } from "../ui/Num";
import { useGo } from "../ui/shell";
import { NightChart, ScoreSegments, StageShares } from "./detailCharts";
import { ASLEEP, BED, hm, IN_BED, NIGHTS, OVERNIGHT, PARTS, SCORE_BEFORE, scoreWord, STAGES, TEMP_BAND, TEMP_NIGHT, UP, type SleepPart } from "./sleepData";
import "./sleep.css";

/*
 * The pages that open from the Sleep tab's cards. Each reads as one part of
 * last night's Sleep page grown into its own page: the same chart or bar at
 * the top, then how the number was worked out, then its neighbours and the
 * way back to the whole night.
 */

/** The Sleep tab's readings that open a page of their own. */
export const SLEEP_CHILDREN = ["sleepscore", "consistency", "efficiency", "hoursneeds", "restorative", "deep", "temp"] as const;
export const isSleepChild = (id: string) => (SLEEP_CHILDREN as readonly string[]).includes(id);

const partOf = (id: string) => PARTS.find((p) => p.id === id);
const nightStages = () => STAGES.map((s) => ({ stage: s.stage, min: s.min }));
const deepShare = () => Math.round((STAGES[0].min / ASLEEP) * 100);
const sign = (v: number) => (v > 0 ? `+${v.toFixed(1)}` : v < 0 ? `−${Math.abs(v).toFixed(1)}` : "0.0");

/** One score part: name and value, today's bar with a tick where the comparison stood, the line under it. */
export function PartRow({ p, onOpen }: { p: SleepPart; onOpen?: (e: { currentTarget: HTMLElement }) => void }) {
  const max = p.max ?? 100;
  const up = p.now >= p.before;
  const hours = p.unit === "h";
  const val = (v: number) => (hours ? hm(v) : String(v));
  const body = (
    <>
      <span className="sl-part-head">
        <span className="sl-part-name">{p.name}</span>
        <b>
          {val(p.now)}
          <u>{p.unit}</u>
        </b>
      </span>
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
      <span className="sl-part-was">
        {p.vs}{" "}
        <b>
          {val(p.before)}
          {p.unit === "%" ? "%" : " h"}
        </b>
      </span>
    </>
  );
  const field = metric(p.id).field;
  return onOpen ? (
    <button className="sl-part" data-field={field} onClick={onOpen}>
      {body}
    </button>
  ) : (
    <div className="sl-part sl-part-still" data-field={field}>
      {body}
    </div>
  );
}

/** The score arc with what changed beside it. */
function ScoreCard() {
  const score = Number(metric("sleepscore").value);
  const diff = score - SCORE_BEFORE;
  return (
    <div className="sl-score sl-score-still">
      <ScoreSegments score={score} word={scoreWord(score)} />
      <span className="sl-score-t">
        <b>
          {diff >= 0 ? "+" : "−"}
          {Math.abs(diff)} on the night before
        </b>
        <small>Longer, with more deep sleep.</small>
      </span>
    </div>
  );
}

/** Skin temperature through the night against the usual band, zero being the member's baseline. */
function TempNight() {
  const W = 300;
  const H = 132;
  const PAD = 10;
  const lo = -0.6;
  const hi = 0.6;
  const y = (v: number) => PAD + ((hi - v) / (hi - lo)) * (H - PAD * 2);
  const x = (i: number) => (i / (TEMP_NIGHT.length - 1)) * W;
  const line = TEMP_NIGHT.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const lowest = TEMP_NIGHT.reduce((m, v, i) => (v < TEMP_NIGHT[m] ? i : m), 0);
  return (
    <div className="sc-temp">
      <div className="sc-temp-plot">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Skin temperature against your baseline through the night">
          <rect className="sc-temp-band" x="0" width={W} y={y(TEMP_BAND[1])} height={y(TEMP_BAND[0]) - y(TEMP_BAND[1])} />
          <line className="dc-rule" x1="0" x2={W} y1={y(0)} y2={y(0)} />
          <path className="sc-temp-line" d={line} />
          <circle className="sc-temp-dot" cx={x(lowest)} cy={y(TEMP_NIGHT[lowest])} r="4.5" />
        </svg>
        <span className="sc-temp-y" aria-hidden>
          <i style={{ top: `${(y(TEMP_BAND[1]) / H) * 100}%` }}>+0.4</i>
          <i style={{ top: `${(y(0) / H) * 100}%` }}>0</i>
          <i style={{ top: `${(y(TEMP_BAND[0]) / H) * 100}%` }}>−0.4</i>
        </span>
      </div>
      <span className="dc-night-ends" aria-hidden>
        <i>{BED}</i>
        <i>{UP}</i>
      </span>
    </div>
  );
}

/** The chart each child page opens with, in the white card under the number. */
export const SLEEP_GLANCE: Record<string, () => ReactNode> = {
  sleepscore: () => <ScoreCard />,
  consistency: () => <PartRow p={partOf("consistency")!} />,
  efficiency: () => <PartRow p={partOf("efficiency")!} />,
  hoursneeds: () => <PartRow p={partOf("hoursneeds")!} />,
  restorative: () => <PartRow p={partOf("restorative")!} />,
  deep: () => <NightChart stages={nightStages()} bed={BED} up={UP} focus="Deep" />,
  temp: () => <TempNight />,
};

/** How each number was worked out, as the dashed list the metric pages use. */
function facts(id: string): { k: string; v: string; unit?: string }[] {
  const awake = STAGES[3].min;
  const rest = STAGES[0].min + STAGES[1].min;
  switch (id) {
    case "sleepscore":
      return PARTS.map((p) => ({ k: p.name, v: p.unit === "h" ? hm(p.now) : String(p.now), unit: p.unit === "h" ? "h" : "%" }));
    case "hoursneeds":
      return [
        { k: "Asleep", v: hm(ASLEEP), unit: "h" },
        { k: "Needed", v: "7:40", unit: "h" },
        { k: "Short by", v: hm(460 - ASLEEP), unit: "h" },
      ];
    case "efficiency":
      return [
        { k: "In bed", v: hm(IN_BED), unit: "h" },
        { k: "Asleep", v: hm(ASLEEP), unit: "h" },
        { k: "Awake in bed", v: String(awake), unit: "min" },
      ];
    case "restorative":
      return [
        { k: "Deep", v: hm(STAGES[0].min), unit: "h" },
        { k: "REM", v: hm(STAGES[1].min), unit: "h" },
        { k: "Share of sleep", v: String(Math.round((rest / ASLEEP) * 100)), unit: "%" },
      ];
    case "consistency": {
      const beds = NIGHTS.map((n) => n.bed);
      return [
        { k: "Usual bedtime", v: "23:35" },
        { k: "Last night", v: beds[beds.length - 1] },
        { k: "Widest shift", v: "75", unit: "min" },
      ];
    }
    case "deep":
      return [
        { k: "Deep sleep", v: hm(STAGES[0].min), unit: "h" },
        { k: "Share of sleep", v: String(deepShare()), unit: "%" },
        { k: "Longest stretch", v: "28", unit: "min" },
      ];
    case "temp": {
      const avg = TEMP_NIGHT.reduce((a, b) => a + b, 0) / TEMP_NIGHT.length;
      return [
        { k: "Average", v: sign(avg), unit: "°C" },
        { k: "Lowest", v: sign(Math.min(...TEMP_NIGHT)), unit: "°C" },
        { k: "Highest", v: sign(Math.max(...TEMP_NIGHT)), unit: "°C" },
      ];
    }
    default:
      return [];
  }
}

const FACTS_HEAD: Record<string, string> = {
  sleepscore: "What makes it up",
  hoursneeds: "How it was worked out",
  efficiency: "How it was worked out",
  restorative: "How it was worked out",
  consistency: "How it was worked out",
  deep: "Last night's deep sleep",
  temp: "Overnight",
};

/** Neighbours shown as the readout grid: score parts for a part, stages for deep, overnight readings for temperature. */
function neighbours(id: string): { id: string; label: string; value: string; unit: string; word: string; to: string; field: string }[] {
  if (id === "deep") {
    return STAGES.slice(1).map((s) => ({ id: s.stage as string, label: s.stage === "Awake" ? "Awake" : `${s.stage} sleep`, value: s.stage === "Awake" ? String(s.min) : hm(s.min), unit: s.stage === "Awake" ? "min" : "h", word: `Usual ${s.label}`, to: "/v3/metric/sleep", field: "sleep" })).concat([
      { id: "restorative", label: "Restorative", value: hm(STAGES[0].min + STAGES[1].min), unit: "h", word: "Deep and REM", to: "/v3/metric/restorative", field: "violet" },
    ]);
  }
  if (id === "temp") {
    return OVERNIGHT.filter((r) => r.id !== "temp").map((r) => ({ ...r, to: `/v3/metric/${r.id}`, field: "sleep" }));
  }
  const score = Number(metric("sleepscore").value);
  const parts = PARTS.filter((p) => p.id !== id).map((p) => ({ id: p.id, label: p.name, value: p.unit === "h" ? hm(p.now) : String(p.now), unit: p.unit === "h" ? "h" : "%", word: p.line, to: `/v3/metric/${p.id}`, field: metric(p.id).field }));
  return id === "sleepscore" ? [] : [{ id: "sleepscore", label: "Sleep score", value: String(score), unit: "/ 100", word: scoreWord(score), to: "/v3/metric/sleepscore", field: "capacity" }, ...parts];
}

const NEIGHBOUR_HEAD: Record<string, string> = { deep: "The rest of the night", temp: "While you slept" };

/** Sections under the glance card on a Sleep tab child page. */
export function SleepChild({ id }: { id: string }) {
  const go = useGo();
  const list = facts(id);
  const near = neighbours(id);
  const score = Number(metric("sleepscore").value);
  return (
    <>
      {id === "sleepscore" && (
        <section className="mx-block sl-block">
          <h2 className="mx-h">The four parts</h2>
          <div className="mx-card sl-parts">
            {PARTS.map((p) => (
              <PartRow key={p.id} p={p} onOpen={(e) => go(`/v3/metric/${p.id}`, { from: e.currentTarget, replace: true })} />
            ))}
          </div>
        </section>
      )}

      {id === "deep" && (
        <section className="mx-block sl-block">
          <h2 className="mx-h">Share of your sleep</h2>
          <div className="mx-card">
            <StageShares rows={[{ stage: "Deep", share: deepShare(), typical: [...STAGES[0].typical] as [number, number], label: STAGES[0].label }]} />
            <p className="sl-note">Most deep sleep came in the first two cycles, before 02:00, which is when it does the most good.</p>
          </div>
        </section>
      )}

      {id !== "sleepscore" && list.length > 0 && (
        <section className="mx-block sl-block">
          <h2 className="mx-h">{FACTS_HEAD[id]}</h2>
          <div className="mx-card sc-facts">
            <dl className="mx-stats">
              {list.map((f) => (
                <div key={f.k}>
                  <dt>{f.k}</dt>
                  <dd>
                    <Num v={f.v} /> {f.unit && <small>{f.unit}</small>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {near.length > 0 && (
        <section className="mx-block sl-block">
          <h2 className="mx-h">{NEIGHBOUR_HEAD[id] ?? "The rest of your score"}</h2>
          <div className="mx-grid">
            {near.map((r) => (
              <button key={r.id} className="mx-read" data-field={r.field} onClick={(e) => go(r.to, { from: e.currentTarget, replace: true })}>
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
      )}

      {/* every child page closes with the way to the whole night */}
      <section className="mx-block sl-block">
        <button className="mx-card sc-night" data-field="sleep" onClick={(e) => go("/v3/metric/sleep", { from: e.currentTarget })}>
          <span className="sc-night-t">
            <small>Last night</small>
            <b>
              {hm(ASLEEP)} asleep · score {score}
            </b>
            <span>Stages, schedule and what your body did overnight</span>
          </span>
          <Chevron size={16} />
        </button>
      </section>
    </>
  );
}
