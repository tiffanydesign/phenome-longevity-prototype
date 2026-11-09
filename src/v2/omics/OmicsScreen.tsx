import { Num } from "../ui/Num";
import { Say } from "../ui/Say";
import { Art, type ArtName } from "../ui/Art";
import { Chevron } from "../ui/icons";
import { Avatar, useGo, V2Screen } from "../ui/shell";
import { ALL_STUDIES } from "../study/catalog";
import { HAS, M, pick, trim, visitDate } from "../study/data";
import { LATEST, readingOf, REGIONS, toneOf } from "../twin/regions";
import "../home/home.css";
import "./omics.css";

/* the presentation's omics studies, each in a Home field with its own object; each opens on its twin region */
const PANELS: { id: string; field: string; art: ArtName }[] = [
  { id: "proteomics", field: "capacity", art: "cells" },
  { id: "genomics", field: "body", art: "helix" },
  { id: "guthealth", field: "habit", art: "molecule" },
  { id: "oralhealth", field: "activity", art: "check" },
  { id: "transcriptomics", field: "heart", art: "ripple" },
  { id: "metabolomics", field: "vitals", art: "sugar" },
];

/* the readings the overview card leads with: the studies that carry a status of their own */
const LEADS = ["transcriptomics", "proteomics", "genomics"].filter(HAS);
/* omics studies the lab has not reported yet: shown as waiting, never as a result */
const PENDING = ALL_STUDIES.filter((s) => s.section === "Omics" && !HAS(s.code));

/** A study's lead in a line: its number, then the words the presentation puts beside it. */
const line = (id: string) => {
  const v = readingOf(id);
  return [v.value, v.unit, v.label].filter(Boolean).join(" ");
};

/**
 * Omics changes between visits, not between days, so it gets a destination of
 * its own. Every number is the clinic presentation's: the overview's molecular
 * layers, and each omics study's lead, read at the member's latest visit.
 */
export function OmicsScreen() {
  const go = useGo();
  const tr = pick(M.transcriptome, LATEST);
  const gut = pick(M.gut, LATEST);
  const proteins = pick(M.proteomics, LATEST)?.proteins;
  const counts = [
    { label: "Proteins", value: proteins },
    { label: "Metabolites", value: M.overview.metabolites || undefined },
    { label: "Gut species", value: gut?.richness },
  ].filter((c) => c.value !== undefined);
  // the coaching line says what is back: the transcriptome's age and ProteoRisk when they are, the waiting list when not
  const said: string[] = [];
  if (tr) {
    const age = readingOf("transcriptomics").status;
    said.push(`Your transcriptome reads ${trim(tr.predicted)} years against your ${trim(tr.chronological, 0)}${age ? `, ${age.toLowerCase()}` : ""}.`);
  }
  if (HAS("proteomics")) {
    const pr = readingOf("proteomics");
    said.push(`ProteoRisk: ${pr.value} ${pr.unit} ${pr.label}.`);
  }
  if (PENDING.length) said.push(`${PENDING.length} of your omics results are still with the lab.`);
  const coach = said.join(" ");
  return (
    <V2Screen>
      <div className="v2-veil" data-at="status" aria-hidden />
      <div className="om scroll">
        <header className="v2-top om-top">
          <h1>Omics</h1>
          <Avatar />
        </header>
        <Say className="om-coach" text={coach} />

        <button className="om-ages" data-field="capacity" onClick={(e) => go("/v2/twin?lens=omics", { from: e.currentTarget })}>
          <span className="om-ages-h">
            <b>{M.overview.layers} molecular layers</b>
            <span>
              {visitDate(LATEST)}
              <i className="om-go">
                <Chevron size={15} />
              </i>
            </span>
          </span>
          <span className="om-counts">
            {counts.map((c) => (
              <span key={c.label}>
                <b>
                  <Num v={String(c.value)} />
                </b>
                {c.label}
              </span>
            ))}
          </span>
          {LEADS.map((id) => {
            const v = readingOf(id);
            const tone = toneOf(v);
            return (
              <span className="om-lead" key={id} data-tone={tone || undefined}>
                <span className="om-lead-n">{REGIONS[id].name}</span>
                <span className="om-lead-v">
                  <b>
                    <Num v={v.value} />
                  </b>{" "}
                  {v.unit}
                </span>
                {v.status && <em>{v.status}</em>}
              </span>
            );
          })}
        </button>

        <button className="v2-tile om-row" data-field="teal" onClick={() => go("/v2/study/genomics")}>
          <span className="v2-tile-t">Walk through your omics</span>
          <span className="v2-tile-s">Genome to metabolome, on your twin</span>
          <span className="v2-tile-go">
            <Chevron />
          </span>
        </button>

        <h2 className="om-h">Your panels</h2>
        <div className="om-grid">
          {PANELS.filter((p) => HAS(p.id)).map((p) => {
            const v = readingOf(p.id);
            const tone = toneOf(v);
            return (
              <button key={p.id} className="v2-tile om-panel" data-field={p.field} onClick={(e) => go(`/v2/twin?lens=omics&organ=${p.id}`, { from: e.currentTarget })}>
                <Art name={p.art} />
                <span className="v2-tile-t">{REGIONS[p.id].name}</span>
                <span className="v2-tile-foot">
                  {(tone === "mon" || tone === "alert") && v.status && <em className="om-flag">{v.status}</em>}
                  <span className="v2-tile-s">{line(p.id)}</span>
                </span>
              </button>
            );
          })}
        </div>

        {PENDING.length > 0 && (
          <>
            <h2 className="om-h">Waiting for the lab</h2>
            <ul className="om-wait">
              {PENDING.map((s) => (
                <li key={s.code}>{s.name}</li>
              ))}
            </ul>
          </>
        )}

        <button className="v2-tile om-row" data-field="sand" onClick={() => go("/insights/reports")}>
          <span className="v2-tile-t">Reports</span>
          <span className="v2-tile-s">PDFs from your clinician</span>
          <span className="v2-tile-go">
            <Chevron />
          </span>
        </button>
      </div>
    </V2Screen>
  );
}
