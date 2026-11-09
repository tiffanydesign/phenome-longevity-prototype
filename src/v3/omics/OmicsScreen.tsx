import { Num } from "../ui/Num";
import { Say } from "../ui/Say";
import { useDataset } from "@/lib/data";
import { insightsTab } from "@/data/insights";
import { Glyph, type GlyphName } from "../ui/glyphs";
import { Chevron } from "../ui/icons";
import { useRef } from "react";
import { BrandBar, followHead, useGo, V2Screen } from "../ui/shell";
import { ALL_STUDIES } from "../study/catalog";
import { HAS, M, pick, trim, visitDate } from "../study/data";
import { LATEST, readingOf, REGIONS, toneOf } from "../twin/regions";
import "../home/home.css";
import "./omics.css";

/* the presentation's omics studies, each in a Home field with its own object; each opens on its twin region */
const PANELS: { id: string; field: string; glyph: GlyphName }[] = [
  { id: "genomics", field: "body", glyph: "dna" },
  { id: "transcriptomics", field: "heart", glyph: "pulse" },
  { id: "proteomics", field: "capacity", glyph: "gauge" },
  { id: "metabolomics", field: "vitals", glyph: "drop" },
  { id: "guthealth", field: "habit", glyph: "waves" },
  { id: "oralhealth", field: "activity", glyph: "check" },
];

/* what the member has never been tested for: offered, not shown as a gap */
const UNTESTED = ["Lipidome", "Precision Oncology", "Infectious Diseases"];

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
  const ins = useDataset(insightsTab);
  const head = useRef<HTMLDivElement>(null);
  const kits = ins.omics.filter((c) => c.to);
  return (
    <V2Screen>
      {/* the same bar as Home: the mark scrolls away, devices and profile stay on glass */}
      <div className="v2-head om-head" ref={head}>
        <BrandBar />
      </div>
      <div className="om scroll" onScroll={(e) => followHead(head.current, e.currentTarget.scrollTop, 52)}>
        <h1 className="om-title">Omics</h1>
        <Say className="om-coach" text={coach} />

        <button className="om-ages" data-field="plain" onClick={(e) => go("/v3/twin?lens=omics", { from: e.currentTarget })}>
          <span className="om-ages-h">
            <b>{M.overview.layers} molecular layers</b>
            <span>
              {visitDate(LATEST)}
              <Chevron size={13} />
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

        <h2 className="om-h">Your panels</h2>
        <div className="om-list">
          {PANELS.filter((p) => HAS(p.id)).map((p) => {
            const v = readingOf(p.id);
            const tone = toneOf(v);
            return (
              <button key={p.id} className="om-item" data-field={p.field} onClick={(e) => go(`/v3/twin?lens=omics&organ=${p.id}`, { from: e.currentTarget })}>
                <span className="om-mark">
                  <Glyph name={p.glyph} size={17} />
                </span>
                <span className="om-item-t">
                  <b>{REGIONS[p.id].name}</b>
                  <small>{line(p.id)}</small>
                </span>
                {(tone === "mon" || tone === "alert") && v.status && <em className="om-flag">{v.status}</em>}
                <Chevron size={13} />
              </button>
            );
          })}
          <button className="om-item om-walk" onClick={() => go("/v3/study/genomics")}>
            <span className="om-item-t">
              <b>Walk through your omics</b>
              <small>Genome to metabolome, on your twin</small>
            </span>
            <Chevron size={13} />
          </button>
        </div>

        <h2 className="om-h">Reports and insights</h2>
        <div className="om-list">
          <button className="om-item" data-field="capacity" onClick={() => go("/insights/reports")}>
            <span className="om-mark">
              <Glyph name="scale" size={17} />
            </span>
            <span className="om-item-t">
              <b>Generated PDF reports</b>
              <small>From your clinician and the labs</small>
            </span>
            <em className="om-count">{ins.reportCount}</em>
            <Chevron size={13} />
          </button>
          <button className="om-item" data-field="lavender" onClick={() => go("/insights/clinical")}>
            <span className="om-mark">
              <Glyph name="heart" size={17} />
            </span>
            <span className="om-item-t">
              <b>Clinical insights</b>
              <small>Analyse your clinical data</small>
            </span>
            <Chevron size={13} />
          </button>
          {kits.map((k) => (
            <button key={k.title} className="om-item" data-field="teal" onClick={() => go(k.to!)}>
              <span className="om-mark">
                <Glyph name="dna" size={17} />
              </span>
              <span className="om-item-t">
                <b>{k.title}</b>
                <small>{k.sub}</small>
              </span>
              <Chevron size={13} />
            </button>
          ))}
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

        <h2 className="om-h">Not tested yet</h2>
        <div className="om-list">
          {UNTESTED.map((t) => (
            <button key={t} className="om-item om-item-off" onClick={() => go("/v3/store")}>
              <span className="om-item-t">
                <b>{t}</b>
                <small>No results yet. Available as an add-on test.</small>
              </span>
              <Chevron size={13} />
            </button>
          ))}
        </div>
      </div>
    </V2Screen>
  );
}
