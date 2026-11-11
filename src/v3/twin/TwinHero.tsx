import { useMemo, type CSSProperties } from "react";
import { usePrefs } from "@/lib/prefs";
import { STATUS_LABEL, type Status } from "../data/metrics";
import { allLabs } from "../study/blocks";
import { M, pick, type Rec } from "../study/data";
import { Num } from "../ui/Num";
import { HeroField, heroAt, useHero } from "./HeroField";
import type { HeroMap, Tint } from "./field";
import { LATEST, readingOf, toneOf } from "./regions";
import "./twin.css";

const GOLD = "#ffb600";
const ALERT = "#c4572e";
const NAVY = "#263980";
const SLATE = "#5d6a93";

/** A visit's laboratory markers, by the laboratory's own flag: critical, outside its range, within it. */
export function resultsAt(visit: number = LATEST): { status: Status; count: number }[] {
  const labs = allLabs(visit);
  const flags = (Object.values(M.labs) as Rec[][]).flat().flatMap((p) => (pick(p.visits, visit)?.analytes ?? []) as Rec[]).map((a) => String(a.flag));
  const critical = flags.filter((f) => f.startsWith("critical")).length;
  return [
    { status: "alert" as const, count: critical },
    { status: "monitor" as const, count: labs.total - labs.inRange - critical },
    { status: "normal" as const, count: labs.inRange },
  ].filter((r) => r.count > 0);
}

/**
 * Where the figure sits in the stage: the body's axis at `axis` of the width, the
 * crown at `crown` of the height, one cell `cell` of the width. Seated by the body
 * rather than by its crop, so both sexes stand in the same place at the same pitch.
 * `cell` follows the bake's pitch (9 stage px a cell): change one, scale the other.
 */
const HERO_SEAT = { axis: 0.5, crown: 0.07, cell: 0.00846 };
/** The stage is 80 x 92, the leads are drawn in a 1000 x 1150 box over it. */
const STAGE_ASPECT = 92 / 80;

function heroBox(hero: HeroMap) {
  const [a, b, , d] = hero.svg;
  const cell = HERO_SEAT.cell;
  const cellH = cell / STAGE_ASPECT;
  return { left: HERO_SEAT.axis - (100 * a + b) * cell, top: HERO_SEAT.crown - d * cellH, width: hero.cols * cell, height: hero.rows * cellH };
}

export const heroStyle = (hero: HeroMap): CSSProperties => {
  const box = heroBox(hero);
  return { left: `${box.left * 100}%`, top: `${box.top * 100}%`, width: `${box.width * 100}%`, height: `${box.height * 100}%` };
};

/** Where the two readouts land, in the viewer's SVG units: blood pressure on the upper arm, body fat on the belly. */
const MARKS = {
  bp: { at: [160, 150] as [number, number], radius: [8, 10] as [number, number] },
  fat: { at: [100, 186] as [number, number], radius: [20, 13] as [number, number] },
};

/** Gold when the study asks for a look, the portal's red to discuss, else the figure's own ink. */
function colourAt(id: string, visit: number, past: boolean) {
  const t = toneOf(readingOf(id, visit));
  return t === "alert" ? ALERT : t === "mon" ? GOLD : past ? SLATE : NAVY;
}

/** Leaders start under each readout, run level, then drop onto their mark wherever the bake seated it. */
function leads(hero: HeroMap, visit: number, past: boolean) {
  const box = heroBox(hero);
  const end = (at: [number, number]) => {
    const [fx, fy] = heroAt(hero, at);
    return `${Math.round(1000 * (box.left + fx * box.width))},${Math.round(1150 * (box.top + fy * box.height))}`;
  };
  return [
    { d: `M888,305 H730 L${end(MARKS.bp.at)}`, colour: colourAt("natural", visit, past) },
    { d: `M112,543 H320 L${end(MARKS.fat.at)}`, colour: colourAt("composition", visit, past) },
  ];
}

/**
 * The twin's half-length figure from the digital twin's home page. With `readouts`
 * it carries two readings of the visit on hairline leaders, blood pressure at the
 * arm and body fat at the belly; a checkpoint draws it in slate.
 */
export function TwinHero({ visit = LATEST, past = false, readouts = true, className }: { visit?: number; past?: boolean; readouts?: boolean; className?: string }) {
  const hero = useHero(usePrefs().sex);
  const bp = readingOf("natural", visit);
  const fat = readingOf("composition", visit);
  const tints = useMemo<Tint[]>(
    () => [
      { organ: MARKS.bp, color: colourAt("natural", visit, past), strength: toneOf(bp) ? 1 : 0.5 },
      { organ: MARKS.fat, color: colourAt("composition", visit, past), strength: toneOf(fat) ? 1 : 0.5 },
    ],
    [visit, past, bp, fat],
  );
  return (
    <span className={`tw-hero-stage ${className ?? ""}`} data-past={past ? "" : undefined}>
      {hero && (
        <>
          <HeroField className="tw-hero-field" hero={hero} tints={tints} ramp={past ? ["#d3d9ea", SLATE] : undefined} label={`Your twin at visit ${visit}`} style={heroStyle(hero)} />
          {readouts && (
            <svg className="tw-hero-lead" viewBox="0 0 1000 1150" aria-hidden>
              {leads(hero, visit, past).map((l) => (
                <path key={l.d} d={l.d} fill="none" stroke={l.colour} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              ))}
            </svg>
          )}
        </>
      )}
      {readouts && (
        <>
          <Readout side="r" label="Blood pressure" value={bp.value} unit={bp.unit} />
          <Readout side="l" label="Body fat" value={fat.value} unit={fat.unit} />
        </>
      )}
    </span>
  );
}

function Readout({ side, label, value, unit }: { side: "l" | "r"; label: string; value: string; unit?: string }) {
  return (
    <span className="tw-readout" data-side={side}>
      <small>{label}</small>
      <span>
        <b>
          <Num v={value} />
        </b>
        {unit && <u>{unit}</u>}
      </span>
    </span>
  );
}

/** Every laboratory marker of a visit as one dot, each band as wide as its count, with its key under it. */
export function ResultsBar({ visit = LATEST, keyed = true }: { visit?: number; keyed?: boolean }) {
  const results = resultsAt(visit);
  return (
    <span className="tw-results">
      {/* every result is one dot, laid out in three rows from left to right: what to discuss first, then monitor, then in range */}
      <span className="tw-results-dots" aria-hidden style={{ "--cols": Math.ceil(results.reduce((n, r) => n + r.count, 0) / 3) } as CSSProperties}>
        {results.flatMap((r) =>
          Array.from({ length: r.count }, (_, i) => <i key={`${r.status}-${i}`} data-status={r.status} />),
        )}
      </span>
      {keyed && (
        <span className="tw-results-key">
          {results.map((r) => (
            <span key={r.status} data-status={r.status}>
              <i aria-hidden />
              {STATUS_LABEL[r.status]} <b>{r.count}</b>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
