import { useState } from "react";
import { Chevron } from "../ui/icons";
import { IN, M, pick, placeOf, said, series, trim, type Rec, type StudyView } from "./data";
import { Card, Cells, Finding, Parts, Pill, Range, type Tone } from "./parts";

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

export function Labs({ study, visit, title = "Blood tests" }: { study: string; visit: number; title?: string }) {
  const t = labTotals(study, visit);
  return (
    <Card title={title} aside={t.outside ? <Pill tone="mon">{t.outside} outside range</Pill> : <Pill tone="ok">All in range</Pill>}>
      {[...(M.labs[study] as Rec[])].sort((a, b) => Number(b.core) - Number(a.core)).map((p) => (
        <LabPanel key={p.code} panel={p} visit={visit} />
      ))}
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
      <Card title="Condition scores" aside={flagged ? <Pill tone="mon">{rec.low.length} low</Pill> : <Pill tone="ok">No low scores</Pill>}>
        {shown.map((s) => (
          <Finding key={s.name} tone={s.band === "Low" ? "mon" : "ok"} title={s.name} detail={s.band} value={Math.round(s.score * 100)} />
        ))}
      </Card>
    </>
  );
}

export function microbeLead(rows: Rec[], visit: number): Pick<StudyView, "value" | "label" | "trend" | "at" | "tone" | "status"> {
  const r = pick(rows, visit);
  const out = INDICES.filter((i) => r[i.key] < i.low || r[i.key] > i.high).length;
  return { value: String(r.richness), label: "species richness", trend: series(rows, "richness"), at: placeOf(rows, visit), ...(out ? IN("mon", `${out} outside range`) : IN()) };
}
