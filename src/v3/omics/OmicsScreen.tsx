import { asset } from "@/lib/asset";
import { useDataset } from "@/lib/data";
import { insightsTab } from "@/data/insights";
import { Glyph } from "../ui/glyphs";
import { Chevron } from "../ui/icons";
import { useEffect, useRef, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { BrandBar, followHead, HeadBlur, useGo, V2Screen } from "../ui/shell";
import { TopicCard, type Go } from "./TopicCard";
import { readingOf } from "../twin/regions";
import { TOPICS, type Topic } from "./topics";
import { MarkAll, OmicsMark } from "./marks";
import { GET, SOURCE_LABEL, portfolio, type Source } from "./portfolio";
import "../home/home.css";
import "../study/study.css";
import "./omics.css";

/* the original Insights page's own opening words */
const LEAD =
  "Your genetic makeup and other biological factors provide insights into your well-being, as well as the microbial composition on and inside your body.";

/* the kits we have product photos for, cut out of their white ground; the
   studies with no kit of their own carry a photo from the site's science pages */
const KIT_THUMB: Record<string, string> = { Genome: "genome", Gut: "gut", Oral: "oral" };
const PHOTO_THUMB: Record<string, string> = {
  Vaginal: "vaginal",
  Proteome: "proteome",
  Transcriptome: "transcriptome",
  Metabolome: "metabolome",
  Lipidome: "lipidome",
};
const thumbOf = (title: string): { src: string; photo?: boolean } | undefined => {
  const word = title.split(" ")[0];
  if (KIT_THUMB[word]) return { src: asset(`photos/insights/thumb/kit_${KIT_THUMB[word]}.png`) };
  if (PHOTO_THUMB[word]) return { src: asset(`photos/insights/thumb/hub_${PHOTO_THUMB[word]}.jpg`), photo: true };
  return undefined;
};

/** Each portfolio card's colour, taken from the study it opens when there is one. */
function fieldOf(title: string): string {
  const word = title.split(" ")[0].toLowerCase().slice(0, 4);
  return TOPICS.find((t) => t.name.toLowerCase().startsWith(word))?.field ?? "teal";
}

/** A grouped row: mark, name and line, an optional count, chevron. */
function Row({ field, glyph, thumb, title, sub, count, off, source, get, onClick }: { field?: string; glyph?: Parameters<typeof Glyph>[0]["name"]; thumb?: { src: string; photo?: boolean }; title: string; sub: string; count?: number; off?: boolean; source?: Source; get?: Source; onClick?: Go }) {
  const lead = thumb ? (
    <span className="om-thumb" data-photo={thumb.photo ? "" : undefined}>
      <img src={thumb.src} alt="" loading="lazy" />
    </span>
  ) : (
    glyph && (
      <span className="om-mark">
        <Glyph name={glyph} size={17} />
      </span>
    )
  );
  const name = (
    <span className="om-item-t">
      <b>
        {title}
        {source && <i className="om-src">{SOURCE_LABEL[source]}</i>}
      </b>
      <small>{sub}</small>
    </span>
  );
  // no result yet: the row says how to get one, and taking it goes there
  if (get)
    return (
      <button className="om-item om-item-off" data-field={field} onClick={(e) => onClick?.(e.currentTarget)}>
        {lead}
        {name}
        <em className="om-get">{GET[get].label}</em>
      </button>
    );
  if (!onClick)
    return (
      <div className="om-item om-item-off" data-field={field} aria-disabled="true">
        {lead}
        <span className="om-item-t">
          <b>{title}</b>
          <small>{sub}</small>
        </span>
      </div>
    );
  return (
    <button className={`om-item${off ? " om-item-off" : ""}`} data-field={field} onClick={(e) => onClick(e.currentTarget)}>
      {lead}
      {name}
      {count !== undefined && <em className="om-count">{count}</em>}
      <Chevron size={13} />
    </button>
  );
}

/** The portfolio rows each study's tab gathers: the tests that read the same molecules. */
const KITS_OF: Record<string, string[]> = {
  genomics: ["Genome"],
  transcriptomics: ["Transcriptome"],
  proteomics: ["Proteome"],
  metabolomics: ["Metabolome", "Lipidome"],
  guthealth: ["Gut", "Vaginal"],
  oralhealth: ["Oral"],
};

/** What each test reads, in one plain line: the sample and the molecules. */
const READS: Record<string, string> = {
  genomics: "Your DNA, sequenced once. It does not change between visits.",
  transcriptomics: "Which genes are switched on in your blood, measured at the clinic.",
  proteomics: "Thousands of proteins in your blood, measured at the clinic.",
  metabolomics: "Small molecules and fats in your blood and urine, measured at the clinic.",
  guthealth: "The microbes living in your gut, read from a home sample.",
  oralhealth: "The microbes living in your mouth, read from a home sample.",
};

/**
 * Omics: what each test found, whether a home kit or a clinic sample. The tabs
 * pick a test; a test's tab shows its finding and its reports. Where a finding
 * sits on the body (systems, organs, risk wheels) is the twin's to show, so
 * each tab hands over to the twin for that.
 */
export function OmicsScreen() {
  const go = useGo();
  const ins = useDataset(insightsTab);
  const head = useRef<HTMLDivElement>(null);
  const chips = useRef<HTMLDivElement>(null);
  const [params, setParams] = useSearchParams();
  const topic = TOPICS.find((t) => t.id === params.get("topic"));
  const kits = portfolio();

  const pickTopic = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("topic", id);
    else next.delete("topic");
    setParams(next, { replace: true });
  };

  // the selected tab slides into view within its own row, never moving the page
  useEffect(() => {
    const row = chips.current;
    const on = row?.querySelector<HTMLElement>("[aria-pressed='true']");
    if (!row || !on) return;
    const left = on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [topic?.id]);

  const kitRow = (k: (typeof kits)[number]) => (
    <Row
      key={k.title}
      field={k.to ? fieldOf(k.title) : undefined}
      glyph="dna"
      thumb={thumbOf(k.title)}
      title={k.title}
      sub={k.sub}
      source={k.source}
      get={k.to ? undefined : k.source}
      onClick={(el) => go(k.to ?? GET[k.source].to, { from: el })}
    />
  );

  return (
    <V2Screen>
      {/* the same bar as Home: the mark scrolls away, devices and profile stay on glass */}
      <div className="v2-head om-head" ref={head}>
        <HeadBlur />
        <BrandBar />
      </div>
      <div className="om scroll" onScroll={(e) => followHead(head.current, e.currentTarget.scrollTop, 52)}>
        <div className="om-chips" ref={chips} role="toolbar" aria-label="Omics tests">
          <button className="om-chip" aria-pressed={!topic} onClick={() => pickTopic(null)}>
            <MarkAll fields={TOPICS.map((t) => t.field)} />
            <span className="om-chip-t">
              <small>Overview</small>
              <b>{TOPICS.length} tests</b>
            </span>
          </button>
          {TOPICS.map((t) => (
            <button key={t.id} className="om-chip" data-field={t.field} aria-pressed={topic?.id === t.id} onClick={() => pickTopic(t.id)}>
              <OmicsMark id={t.id} />
              <span className="om-chip-t">
                <small>{t.name}</small>
                <b>{t.chip}</b>
              </span>
            </button>
          ))}
        </div>

        {topic ? (
          <TestView t={topic} rows={kits.filter((k) => KITS_OF[topic.id]?.includes(k.title.split(" ")[0])).map(kitRow)} go={go} />
        ) : (
          <>
            <h1 className="om-title">Your health data</h1>
            <p className="om-sub">{LEAD}</p>

            {/* the original Insights page, in order: reports and clinical insights, the omics portfolio, then results */}
            {/* the portal export holds no PDFs and no clinical form data yet: the rows stay, and their pages say so */}
            <div className="om-list">
              <Row field="capacity" glyph="scale" title="Generated PDF reports" sub="No reports yet" onClick={() => go("/insights/reports")} />
              <Row field="lavender" glyph="heart" title="Clinical insights" sub="No clinical data yet" onClick={() => go("/insights/clinical")} />
            </div>

            <h2 className="om-h">Omics portfolio</h2>
            <div className="om-list">{kits.map(kitRow)}</div>

            <h2 className="om-h">Results</h2>
            <div className="om-list">
              {/* the clinic runs these at a visit; none is in the portal yet */}
              {ins.results.map((k) => (
                <Row key={k.title} title={k.title} sub={k.to ? k.sub : "Run at the clinic"} get={k.to ? undefined : "clinic"} onClick={() => go(k.to ?? GET.clinic.to)} />
              ))}
            </div>
          </>
        )}
      </div>
    </V2Screen>
  );
}

/**
 * One test: its summary card and every finding it reports, then its reports.
 * Proteomics alone leaves out its body-systems wheel, which reads the body and
 * so lives on the twin; the body-level view of any test is one row away.
 */
function TestView({ t, rows, go }: { t: Topic; rows: ReactNode[]; go: ReturnType<typeof useGo> }) {
  const v = readingOf(t.id);
  const bodyLevel = t.id === "proteomics";
  return (
    <>
      <h1 className="om-title">{bodyLevel ? t.name : t.title}</h1>
      <p className="om-sub">{bodyLevel ? READS[t.id] : t.support}</p>

      {bodyLevel ? (
        <section className="om-find" data-field={t.field}>
          <p className="om-find-k">
            <OmicsMark id={t.id} size={18} />
            What it found
          </p>
          <b className="om-find-v">{t.status}</b>
          <p className="om-find-t">{t.insight}</p>
        </section>
      ) : (
        <TopicCard t={t} go={go} />
      )}

      <h2 className="om-h">In detail</h2>
      <div className="om-detail" data-field={t.field}>
        {v.omicsCards ?? v.cards}
      </div>

      {rows.length > 0 && (
        <>
          <h2 className="om-h">Reports</h2>
          <div className="om-list">{rows}</div>
        </>
      )}

      <h2 className="om-h">On your body</h2>
      <div className="om-list">
        <Row field={t.field} glyph={t.glyph} title="See it on your twin" sub={`Where ${t.name.toLowerCase()} shows up, visit by visit`} onClick={(el) => go(`/v3/twin?lens=omics&organ=${t.id}`, { from: el })} />
      </div>
    </>
  );
}
