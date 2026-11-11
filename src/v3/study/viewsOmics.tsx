import { microbeLead, Microbiome } from "./blocks";
import { IN, M, pick, placeOf, series, trim, type Rec, type StudyView } from "./data";
import { AgeDial, Card, Finding, Gauge, Note, Parts, Pill, Wheel, ZRange } from "./parts";

/** A count in the portal's words: "1 finding", "2 findings", or the words for none. */
const count = (n: number, one: string, none = `No ${one}s`) => (n === 0 ? none : n === 1 ? `1 ${one}` : `${n} ${one}s`);

/* each genomic test's own card, so a page can show one test's results on their own */
export function GenomeCard() {
  const g = M.genome;
  return (
    <Card title="Genome">
      {g.veryImportant > 0 && <Finding tone="alert" title="Immediate attention needed" value={g.veryImportant} />}
      {g.important > 0 && <Finding tone="mon" title="Monitor closely" value={g.important} />}
      {g.noteworthy > 0 && <Finding tone="" title="For your information" value={g.noteworthy} />}
      {g.lead && <Note>{g.lead}</Note>}
    </Card>
  );
}

export function CarrierCard() {
  return (
    <Card title="Carrier screening" aside={<Pill tone={M.carrier.length ? "alert" : "ok"}>{count(M.carrier.length, "finding", "No findings")}</Pill>}>
      {M.carrier.map((f: Rec) => (
        <Finding key={f.disease} tone="alert" title={f.disease} detail={f.gene} />
      ))}
    </Card>
  );
}

export function NewbornCard() {
  return (
    <Card title="Newborn screening" aside={<Pill tone={M.newborn.length ? "alert" : "ok"}>{count(M.newborn.length, "finding", "No findings")}</Pill>}>
      {M.newborn.map((f: Rec, i: number) => (
        <Finding key={i} tone="alert" title={f.disease} detail={f.gene} />
      ))}
      <Note>{M.newbornCarrier ? `Carrier for ${count(M.newbornCarrier, "screened condition")}` : "Not a carrier for any screened condition"}</Note>
    </Card>
  );
}

export function GpgsCard() {
  return (
    <Card title="GPGS" aside={M.gpgs.domains.length ? <Pill tone={M.gpgs.domains.some((d: Rec) => d.level === "Elevated") ? "alert" : "mon"}>{`${M.gpgs.domains.length} elevated`}</Pill> : <Pill tone="ok">None elevated</Pill>}>
      {M.gpgs.domains.map((d: Rec) => (
        <Finding key={d.name} tone={d.level === "Elevated" ? "alert" : "mon"} title={d.name} detail={d.level}>
          <ZRange z={d.z} tone={d.level === "Elevated" ? "alert" : "mon"} />
        </Finding>
      ))}
      {M.gpgs.closest && <Note>{`Closest resemblance: ${M.gpgs.closest.name}, ${Math.round(M.gpgs.closest.probability * 100)}%`}</Note>}
    </Card>
  );
}

/** One metabolomics sample at one visit: what was measured, the most abundant first. */
export function MetabPanelCard({ name, visit }: { name: string; visit: number }) {
  const panel = (M.metabolomics as Rec[]).find((m) => m.name === name);
  if (!panel) return null;
  const rec = pick(panel.visits, visit);
  return (
    <Card title={name} aside={<span className="rv-count">{rec.measured} measured</span>}>
      <h4 className="rv-sub">Most abundant</h4>
      {rec.top.map((t: Rec) => (
        <div className="rv-rank" key={t.name}>
          <span>{t.name}</span>
          <i>
            <b style={{ width: `${Math.max(4, t.share * 100)}%` }} />
          </i>
        </div>
      ))}
    </Card>
  );
}

export const OMICS: Record<string, (visit: number) => StudyView> = {
  genomics() {
    const g = M.genome;
    const alert = g.veryImportant > 0;
    const watch = g.important > 0;
    return {
      value: String(alert ? g.veryImportant : g.important),
      label: alert ? "Immediate attention needed" : "Monitor closely",
      ...(alert ? IN("alert", `${g.veryImportant} ${g.veryImportant === 1 ? "needs" : "need"} attention`) : watch ? IN("mon", `${g.important} to monitor`) : IN("ok", "No priority findings")),
      single: g.date,
      cards: (
        <>
          <GenomeCard />
          <CarrierCard />
          <NewbornCard />
          <GpgsCard />
        </>
      ),
    };
  },

  guthealth(visit) {
    return {
      ...microbeLead(M.gut, visit),
      cards: (
        <>
          <Microbiome rec={pick(M.gut, visit)} />
          <Card title="Vaginal microbiome">
            <Parts items={pick(M.vaginal, visit).species} />
          </Card>
        </>
      ),
    };
  },

  oralhealth: (visit) => ({ ...microbeLead(M.oral, visit), cards: <Microbiome rec={pick(M.oral, visit)} /> }),

  transcriptomics(visit) {
    const t = pick(M.transcriptome, visit);
    const younger = t.gap <= -2;
    const older = t.gap >= 2;
    return {
      value: trim(t.predicted),
      unit: "years",
      label: "Biological age",
      trend: series(M.transcriptome, "predicted"),
      at: placeOf(M.transcriptome, visit),
      ...(younger ? IN("ok", `${trim(Math.abs(t.gap))} years younger`) : older ? IN("mon", `${trim(Math.abs(t.gap))} years older`) : IN("", "In line with your age")),
      cards: (
        <>
          <Card title="Biological age">
            <AgeDial chronological={t.chronological} predicted={t.predicted} />
            <Note>Chronological age {t.chronological}</Note>
          </Card>
          <Card title="Condition signals" aside={t.signals.length ? <Pill tone="mon">{`${t.signals.length} to look at`}</Pill> : <Pill tone="ok">No signals</Pill>}>
            {t.signals.map((s: Rec) => (
              <Finding key={s.name} tone="mon" title={s.name} detail={`${s.confidence} confidence`} value={s.z === null ? undefined : `z ${s.z > 0 ? "+" : ""}${trim(s.z, 2)}`} />
            ))}
          </Card>
          <Card title="Immune cells">
            <Parts items={t.cells} />
          </Card>
        </>
      ),
    };
  },

  proteomics(visit) {
    const p = pick(M.proteomics, visit);
    const flagged = (p.systems as Rec[]).filter((s) => s.status !== "typical").sort((a, b) => (a.status === "high" ? -1 : 0) - (b.status === "high" ? -1 : 0));
    const typical = p.systems.length - flagged.length;
    const highlights = (
      <>
        {p.highlights.length > 0 && (
          <Card title="Report highlights">
            {p.highlights.map((h: Rec) => (
              <div className="rv-score" key={h.name}>
                <Gauge score={h.score} tier={h.tier} />
                <span>
                  {h.name}
                  <small>{h.when}</small>
                </span>
              </div>
            ))}
            <Note>Scores show how closely your proteins resemble those of people with each condition. They are not a diagnosis.</Note>
          </Card>
        )}
      </>
    );
    return {
      value: `${typical}`,
      unit: `of ${p.systems.length}`,
      label: "body systems look typical",
      trend: M.proteomics.map((r: Rec) => r.systems.filter((s: Rec) => s.status === "typical").length),
      at: placeOf(M.proteomics, visit),
      ...(flagged.length ? IN(flagged.some((s) => s.status === "high") ? "alert" : "mon", `${flagged.length} to review`) : IN("ok", "All look typical")),
      cards: (
        <>
          <Card title="ProteoRisk">
            <Wheel systems={p.systems} />
            {flagged.map((s) => (
              <Finding key={s.code} tone={s.status === "high" ? "alert" : "mon"} title={s.name} />
            ))}
          </Card>
          {highlights}
        </>
      ),
      // the body-systems wheel reads the body, so it stays on the twin; Omics keeps the protein findings
      omicsCards: highlights,
    };
  },

  metabolomics(visit) {
    const runs = M.metabolomics.map((m: Rec) => ({ name: m.name, rec: pick(m.visits, visit) }));
    return {
      // the overview's count: distinct metabolites across plasma and urine
      value: String(M.overview.metabolitesAt[String(visit)]),
      label: "metabolites",
      cards: (
        <>
          {runs.map((r: Rec) => (
            <MetabPanelCard key={r.name} name={r.name} visit={visit} />
          ))}
          <Note>Ranked within this sample only.</Note>
        </>
      ),
    };
  },
};
