import { useState } from "react";
import { Chevron } from "../ui/icons";
import { M, pick, placeOf, said, series, trim, type Rec, type StudyView } from "./data";
import { Card, Cells, Finding, Note, Parts, Pill, Range, type Tone } from "./parts";

/* ── laboratory panels ── */
const LAB_TONE: Record<string, Tone> = { low: "mon", high: "mon", abnormal: "mon", critical_low: "alert", critical_high: "alert" };
const LAB_ARROW: Record<string, string> = { low: "↓", critical_low: "↓", high: "↑", critical_high: "↑" };
const unitOf = (u?: string | null) => (!u || u === "ratio" || u === "index" ? "" : u.replace(/^10\^(\d)/, "×10$1").replace("×109", "×10⁹").replace("×1012", "×10¹²").replace(/(\d)m2\b/, "$1 m²"));

function Analyte({ a }: { a: Rec }) {
  const numeric = typeof a.value === "number";
  const tone = LAB_TONE[a.flag] ?? "";
  return (
    <div className="rv-analyte" data-tone={tone} data-word={numeric ? undefined : ""}>
      <span>{a.name}</span>
      <b>
        {LAB_ARROW[a.flag]}
        {numeric ? trim(a.value, 2) : said(a.value)}
        {numeric && <em>{unitOf(a.unit)}</em>}
      </b>
      {numeric && (a.low !== null || a.high !== null) && <Range value={a.value} low={a.low} high={a.high} tone={tone} />}
    </div>
  );
}

/** A row per panel. The room display can only sum a long panel up; on a phone a row opens. */
function LabPanel({ panel, visit }: { panel: Rec; visit: number }) {
  const [open, setOpen] = useState(false);
  const rec = pick(panel.visits, visit);
  const analytes: Rec[] = rec.analytes;
  const outside = analytes.filter((a) => LAB_TONE[a.flag]);
  return (
    <div className="rv-lab">
      <button aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="rv-lab-n">{panel.name}</span>
        <span className="rv-lab-s" aria-hidden>
          {analytes.map((a, i) => (
            <i key={i} data-tone={LAB_TONE[a.flag] ?? ""} />
          ))}
        </span>
        <span className="rv-lab-c" data-tone={outside.length ? "mon" : ""}>
          {outside.length ? `${outside.length} outside` : `${analytes.length} in range`}
        </span>
        <span className="rv-lab-go" data-open={open ? "" : undefined}>
          <Chevron size={15} />
        </span>
      </button>
      {open && (
        <div className="rv-analytes">
          {analytes.map((a) => (
            <Analyte key={a.name} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}

export function labTotals(study: string, visit: number) {
  const all = (M.labs[study] as Rec[]).flatMap((p) => pick(p.visits, visit).analytes as Rec[]);
  const inRange = all.filter((a) => a.flag === "normal").length;
  return { inRange, total: all.length, outside: all.length - inRange };
}

/** A panel's own line, as the portal sums it up when the room screen is short of space. */
function LabCount({ panel, visit, named }: { panel: Rec; visit: number; named: boolean }) {
  const analytes = pick(panel.visits, visit).analytes as Rec[];
  const outside = analytes.filter((a) => LAB_TONE[a.flag]).length;
  return (
    <h4 className="rv-sub">
      {named ? `${panel.name} · ` : ""}
      {outside ? `${outside} outside` : `${analytes.length} in range`}
    </h4>
  );
}

/** Up to this many markers the portal shows every one; past it, a row per panel and the flagged markers. */
const LAB_SHOWN = 8;

/** The portal's title for a region's panels: the panel's own name when there is one, else what they are. */
export function labTitle(study: string): string {
  const panels = M.labs[study] as Rec[];
  if (panels.length === 1) return panels[0].name;
  return panels.every((p) => p.blood) ? "Blood tests" : "Laboratory results";
}

export function Labs({ study, visit }: { study: string; visit: number }) {
  const panels = M.labs[study] as Rec[];
  const all = panels.flatMap((p) => pick(p.visits, visit).analytes as Rec[]);
  const flagged = all.filter((a) => LAB_TONE[a.flag]);
  const critical = flagged.some((a) => LAB_TONE[a.flag] === "alert");
  const allIn = all.every((a) => a.flag === "normal");
  const aside = flagged.length ? <Pill tone={critical ? "alert" : "mon"}>{`${flagged.length} outside range`}</Pill> : allIn ? <Pill tone="ok">All in range</Pill> : undefined;
  if (all.length <= LAB_SHOWN) {
    return (
      <Card title={labTitle(study)} aside={aside}>
        {panels.map((p) => (
          <div key={p.code}>
            <LabCount panel={p} visit={visit} named={panels.length > 1} />
            <div className="rv-analytes">
              {(pick(p.visits, visit).analytes as Rec[]).map((a) => (
                <Analyte key={a.name} a={a} />
              ))}
            </div>
          </div>
        ))}
      </Card>
    );
  }
  return (
    <Card title={labTitle(study)} aside={aside}>
      {panels.map((p) => (
        <LabPanel key={p.code} panel={p} visit={visit} />
      ))}
      {flagged.length > 0 && (
        <div className="rv-analytes">
          {panels.flatMap((p) =>
            (pick(p.visits, visit).analytes as Rec[])
              .filter((a) => LAB_TONE[a.flag])
              .slice(0, LAB_SHOWN)
              .map((a) => <Analyte key={`${p.code}/${a.name}`} a={a} />),
          )}
        </div>
      )}
    </Card>
  );
}

export function allLabs(visit: number) {
  const a = Object.keys(M.labs).map((s) => labTotals(s, visit));
  return { inRange: a.reduce((n, x) => n + x.inRange, 0), total: a.reduce((n, x) => n + x.total, 0) };
}

/* ── microbiome ── */
const INDICES = [
  { key: "richness", name: "Richness", low: 115, high: 300, d: 0 },
  { key: "shannon", name: "Shannon diversity", low: 4.25, high: 7, d: 2 },
  { key: "evenness", name: "Pielou evenness", low: 0.65, high: 1, d: 2 },
  { key: "fb", name: "F/B ratio", low: 0.2, high: 1.7, d: 2 },
];

export function Microbiome({ rec }: { rec: Rec }) {
  const flagged = rec.low.length > 0;
  const shown = (flagged ? rec.low : rec.lowest) as Rec[];
  return (
    <>
      <Card title="Community composition">
        <Parts items={rec.phyla} />
      </Card>
      <Card title="Diversity and balance">
        <Cells
          items={INDICES.map((i) => {
            const v = rec[i.key] as number;
            const out = v < i.low || v > i.high;
            return { label: i.name, value: `${v < i.low ? "↓" : v > i.high ? "↑" : ""}${trim(v, i.d)}`, tone: (out ? "mon" : "") as Tone, under: <Range value={v} low={i.low} high={i.high} /> };
          })}
        />
      </Card>
      <Card title="Condition scores" aside={flagged ? <Pill tone="mon">{rec.low.length === 1 ? "1 low score" : `${rec.low.length} low scores`}</Pill> : <Pill tone="ok">No low scores</Pill>}>
        {shown.slice(0, 3).map((s) => (
          <Finding key={s.name} tone={s.band === "Low" ? "mon" : "ok"} title={s.name} detail={s.band} value={Math.round(s.score * 100)} />
        ))}
        {/* the three lowest by name, the rest as a count, as the portal lists them */}
        {shown.length > 3 && <Note>{`+${shown.length - 3}`}</Note>}
      </Card>
    </>
  );
}

/** Richness leads; the portal gives the report no overall status, so neither does the lead. */
export function microbeLead(rows: Rec[], visit: number): Pick<StudyView, "value" | "label" | "trend" | "at"> {
  const r = pick(rows, visit);
  return { value: String(r.richness), label: "species richness", trend: series(rows, "richness"), at: placeOf(rows, visit) };
}
