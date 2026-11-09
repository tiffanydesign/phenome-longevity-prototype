import { useDataset } from "@/lib/data";
import { insightsTab } from "@/data/insights";
import { Glyph } from "../ui/glyphs";
import { Chevron } from "../ui/icons";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { BrandBar, followHead, useGo, V2Screen } from "../ui/shell";
import { ALL_STUDIES } from "../study/catalog";
import { HAS, M, pick, trim, visitDate } from "../study/data";
import { LATEST, readingOf } from "../twin/regions";
import { Ring } from "./Ring";
import { TopicCard, type Go } from "./TopicCard";
import { TOPICS } from "./topics";
import "../home/home.css";
import "../study/study.css";
import "./omics.css";

/* what the member has never been tested for: offered, not shown as a gap */
const UNTESTED = ["Lipidome", "Precision Oncology", "Infectious Diseases"];
/* omics studies the lab has not reported yet: shown as waiting, never as a result */
const PENDING = ALL_STUDIES.filter((s) => s.section === "Omics" && !HAS(s.code));

/** The overview's own words: what is back, the transcriptome's age and ProteoRisk when they are. */
function overviewLine(): string {
  const said: string[] = [`${M.overview.layers} molecular layers read at your visit of ${visitDate(LATEST)}.`];
  if (HAS("transcriptomics")) {
    const tr = pick(M.transcriptome, LATEST);
    const age = readingOf("transcriptomics").status;
    said.push(`Your transcriptome reads ${trim(tr.predicted)} years against your ${trim(tr.chronological, 0)}${age ? `, ${age.toLowerCase()}` : ""}.`);
  }
  if (HAS("proteomics")) {
    const pr = readingOf("proteomics");
    said.push(`ProteoRisk: ${pr.value} ${pr.unit} ${pr.label}.`);
  }
  if (PENDING.length) said.push(`${PENDING.length} of your omics results are still with the lab.`);
  return said.join(" ");
}

/** The overview chip's mark: four tiles, one for each kind of reading. */
function AllMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <rect x="3" y="3" width="8" height="8" rx="2.4" />
      <rect x="13" y="3" width="8" height="8" rx="2.4" opacity="0.55" />
      <rect x="3" y="13" width="8" height="8" rx="2.4" opacity="0.55" />
      <rect x="13" y="13" width="8" height="8" rx="2.4" opacity="0.3" />
    </svg>
  );
}

/** A grouped row: mark, name and line, an optional count, chevron. */
function Row({ field, glyph, title, sub, count, off, onClick }: { field?: string; glyph?: Parameters<typeof Glyph>[0]["name"]; title: string; sub: string; count?: number; off?: boolean; onClick: Go }) {
  return (
    <button className={`om-item${off ? " om-item-off" : ""}`} data-field={field} onClick={(e) => onClick(e.currentTarget)}>
      {glyph && (
        <span className="om-mark">
          <Glyph name={glyph} size={17} />
        </span>
      )}
      <span className="om-item-t">
        <b>{title}</b>
        <small>{sub}</small>
      </span>
      {count !== undefined && <em className="om-count">{count}</em>}
      <Chevron size={13} />
    </button>
  );
}

/**
 * Omics changes between visits, not between days, so it gets a destination of
 * its own. A row of chips picks the view: everything at once, or one study with
 * its full detail. Every number is the clinic presentation's, read at the
 * member's latest visit.
 */
export function OmicsScreen() {
  const go = useGo();
  const ins = useDataset(insightsTab);
  const head = useRef<HTMLDivElement>(null);
  const chips = useRef<HTMLDivElement>(null);
  const [params, setParams] = useSearchParams();
  const topic = TOPICS.find((t) => t.id === params.get("topic"));
  const kits = ins.omics.filter((c) => c.to);

  const pickTopic = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("topic", id);
    else next.delete("topic");
    setParams(next, { replace: true });
  };

  // the selected chip slides into view within its own row, never moving the page
  useEffect(() => {
    const row = chips.current;
    const on = row?.querySelector<HTMLElement>("[aria-pressed='true']");
    if (!row || !on) return;
    const left = on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [topic?.id]);

  const title = topic ? topic.title : "Your molecular layers";
  const support = topic ? topic.support : overviewLine();
  const reports = (
    <>
      <Row field="capacity" glyph="scale" title="Generated PDF reports" sub="From your clinician and the labs" count={ins.reportCount} onClick={() => go("/insights/reports")} />
      <Row field="lavender" glyph="heart" title="Clinical insights" sub="Analyse your clinical data" onClick={() => go("/insights/clinical")} />
    </>
  );

  return (
    <V2Screen>
      {/* the same bar as Home: the mark scrolls away, devices and profile stay on glass */}
      <div className="v2-head om-head" ref={head}>
        <BrandBar />
      </div>
      <div className="om scroll" onScroll={(e) => followHead(head.current, e.currentTarget.scrollTop, 52)}>
        <div className="om-chips" ref={chips} role="toolbar" aria-label="Omics studies">
          <button className="om-chip om-chip-all" aria-pressed={!topic} aria-label="All studies" onClick={() => pickTopic(null)}>
            <AllMark />
          </button>
          {TOPICS.map((t) => (
            <button key={t.id} className="om-chip" data-field={t.field} aria-pressed={topic?.id === t.id} onClick={() => pickTopic(t.id)}>
              <Ring spec={t.ring} size={28} stroke={4} />
              <span className="om-chip-t">
                <small>{t.name}</small>
                <b>{t.chip}</b>
              </span>
            </button>
          ))}
        </div>

        <h1 className="om-title">{title}</h1>
        <p className="om-sub">{support}</p>

        {!topic && (
          <>
            {/* the layers together: what was measured, then each study's own card */}
            <section className="om-card" data-field="plain">
              <div className="om-card-top">
                <div className="om-card-l">
                  <button className="om-name" onClick={(e) => go("/v3/twin?lens=omics", { from: e.currentTarget })}>
                    Molecular layers <Chevron size={12} />
                  </button>
                  <b className="om-status">{`${TOPICS.length} ${TOPICS.length === 1 ? "study" : "studies"} with results`}</b>
                  <span className="om-key">
                    <small>Latest visit</small>
                    <strong>{visitDate(LATEST)}</strong>
                  </span>
                </div>
                <Ring spec={{ segs: TOPICS.map(() => 1), fields: TOPICS.map((t) => t.field) }} size={78} stroke={9}>
                  <b>{TOPICS.length}</b>
                </Ring>
              </div>
              <dl className="om-stats om-stats-3">
                {[
                  { label: "Proteins", value: HAS("proteomics") ? pick(M.proteomics, LATEST)?.proteins : undefined },
                  { label: "Metabolites", value: M.overview.metabolites || undefined },
                  { label: "Gut species", value: HAS("guthealth") ? pick(M.gut, LATEST)?.richness : undefined },
                ]
                  .filter((c) => c.value !== undefined)
                  .map((c) => (
                    <div key={c.label}>
                      <dt>{c.label}</dt>
                      <dd>{Number(c.value).toLocaleString("en-US")}</dd>
                    </div>
                  ))}
              </dl>
              <p className="om-insight">See every layer on your twin, from genome to metabolome.</p>
            </section>
            {TOPICS.map((t) => (
              <TopicCard key={t.id} t={t} go={go} onOpen={() => pickTopic(t.id)} />
            ))}

            <div className="om-list">
              <Row field="plain" title="Walk through your omics" sub="Genome to metabolome, on your twin" onClick={() => go("/v3/study/genomics")} />
            </div>

            <h2 className="om-h">Reports and insights</h2>
            <div className="om-list">
              {reports}
              {kits.map((k) => (
                <Row key={k.title} field="teal" glyph="dna" title={k.title} sub={k.sub} onClick={() => go(k.to!)} />
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
                <Row key={t} off title={t} sub="No results yet. Available as an add-on test." onClick={() => go("/v3/store")} />
              ))}
            </div>
          </>
        )}

        {topic && (
          <>
            <TopicCard t={topic} go={go} />
            <h2 className="om-h">In detail</h2>
            <div className="om-detail" data-field={topic.field}>
              {readingOf(topic.id).cards}
            </div>
            <div className="om-list">
              <Row field={topic.field} glyph={topic.glyph} title="See it on your twin" sub={`${topic.name} on the body it reads`} onClick={(el) => go(`/v3/twin?lens=omics&organ=${topic.id}`, { from: el })} />
              <Row field="plain" title="Open the full study" sub={`Every ${topic.name.toLowerCase()} result, visit by visit`} onClick={() => go(`/v3/study/${topic.id}`)} />
            </div>
            <h2 className="om-h">Reports and insights</h2>
            <div className="om-list">{reports}</div>
          </>
        )}
      </div>
    </V2Screen>
  );
}
