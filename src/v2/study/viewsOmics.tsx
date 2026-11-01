import { microbeLead, Microbiome } from "./blocks";
import { IN, M, pick, placeOf, series, trim, type Rec, type StudyView } from "./data";
import { AgeDial, Card, Finding, Gauge, Note, Parts, Pill, Wheel } from "./parts";

export const OMICS: Record<string, (visit: number) => StudyView> = {
  genomics() {
    const g = M.genome;
    const alert = g.veryImportant > 0;
    return {
      value: String(g.veryImportant + g.important + g.noteworthy),
      label: "genome findings",
      ...(alert ? IN("alert", `${g.veryImportant} needs attention`) : IN("mon", `${g.important} to monitor`)),
      single: g.date,
      cards: (
        <>
          <Card title="Genome">
            <Finding tone="alert" title="Immediate attention needed" value={g.veryImportant} />
            <Finding tone="mon" title="Monitor closely" value={g.important} />
            <Finding tone="" title="For your information" value={g.noteworthy} />
            <Note>{g.lead}</Note>
            <Note>Your clinician goes through this result with you before you act on it.</Note>
          </Card>
          <Card title="Carrier screening" aside={<Pill tone="alert">{M.carrier.length} findings</Pill>}>
            {M.carrier.map((f: Rec) => (
              <Finding key={f.disease} tone="alert" title={f.disease} detail={f.gene} />
            ))}
          </Card>
          <Card title="Newborn screening" aside={<Pill tone="alert">{M.newborn.length} findings</Pill>}>
            {M.newborn.map((f: Rec, i: number) => (
              <Finding key={i} tone="alert" title={f.disease} detail={f.gene} />
            ))}
            <Note>Carrier for {M.newbornCarrier} screened conditions</Note>
          </Card>
          <Card title="Polygenic scores" aside={<Pill tone="alert">{M.gpgs.domains.length} elevated</Pill>}>
            {M.gpgs.domains.map((d: Rec) => (
              <Finding key={d.name} tone={d.level === "Elevated" ? "alert" : "mon"} title={d.name} detail={d.level} value={`z ${trim(d.z, 2)}`} />
            ))}
            {M.gpgs.closest && (
              <Note>
                Closest resemblance: {M.gpgs.closest.name}, {Math.round(M.gpgs.closest.probability * 100)}%
              </Note>
            )}
          </Card>
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
          <Card title="Condition signals" aside={t.signals.length ? <Pill tone="mon">{t.signals.length} to look at</Pill> : <Pill tone="ok">No signals</Pill>}>
            {t.signals.map((s: Rec) => (
              <Finding key={s.name} tone="mon" title={s.name} detail={`${s.confidence} confidence`} value={`z ${trim(s.z, 2)}`} />
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
    return {
      value: `${typical}`,
      unit: `of ${p.systems.length}`,
      label: "body systems look typical",
      trend: M.proteomics.map((r: Rec) => r.systems.filter((s: Rec) => s.status === "typical").length),
      at: placeOf(M.proteomics, visit),
      ...(flagged.length ? IN(flagged.some((s) => s.status === "high") ? "alert" : "mon", `${flagged.length} to discuss`) : IN("ok", "All look typical")),
      cards: (
        <>
          <Card title="ProteoRisk">
            <Wheel systems={p.systems} />
            {flagged.map((s) => (
              <Finding key={s.code} tone={s.status === "high" ? "alert" : "mon"} title={s.name} />
            ))}
          </Card>
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
      ),
    };
  },

  metabolomics(visit) {
    const runs = M.metabolomics.map((m: Rec) => ({ name: m.name, rec: pick(m.visits, visit) }));
    return {
      value: String(runs.reduce((n: number, r: Rec) => n + r.rec.measured, 0)),
      label: "features measured",
      cards: (
        <>
          {runs.map((r: Rec) => (
            <Card key={r.name} title={r.name} aside={<span className="rv-count">{r.rec.measured} measured</span>}>
              <h4 className="rv-sub">Most abundant</h4>
              {r.rec.top.map((t: Rec) => (
                <div className="rv-rank" key={t.name}>
                  <span>{t.name}</span>
                  <i>
                    <b style={{ width: `${Math.max(4, t.share * 100)}%` }} />
                  </i>
                </div>
              ))}
            </Card>
          ))}
          <Note>Ranked within this sample only.</Note>
        </>
      ),
    };
  },
};
