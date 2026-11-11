import { useDataset } from "@/lib/data";
import { insightsTab } from "@/data/insights";
import { Glyph } from "../ui/glyphs";
import { Chevron } from "../ui/icons";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BrandBar, followHead, HeadBlur, useGo, V2Screen } from "../ui/shell";
import { TopicCard, type Go } from "./TopicCard";
import { readingOf } from "../twin/regions";
import { TOPICS, type Topic } from "./topics";
import { MarkAll, OmicsMark } from "./marks";
import { portfolio, type PortfolioRow } from "./portfolio";
import { KIT_FIELD, KitMark } from "./kitMarks";
import { KitPicker } from "./KitPicker";
import { contentOf, markSeen, pickOf, testsOf, useUnseen } from "./tests";
import "../home/home.css";
import "../study/study.css";
import "./omics.css";

/* the original Insights page's own opening words */
const LEAD =
  "Your genetic makeup and other biological factors provide insights into your well-being, as well as the microbial composition on and inside your body.";

/** A grouped row: mark, name and line, an optional count, chevron. */
function Row({ field, glyph, title, sub, count, onClick }: { field?: string; glyph?: Parameters<typeof Glyph>[0]["name"]; title: string; sub: string; count?: number; onClick: Go }) {
  return (
    <button className="om-item" data-field={field} onClick={(e) => onClick(e.currentTarget)}>
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
 * One omics study. Tested: its mark in its hue and its name, opening its report.
 * Not tested yet: mark and name in grey, and the way to get the kit in the chevron's place.
 */
function KitRow({ k, go }: { k: PortfolioRow; go: ReturnType<typeof useGo> }) {
  const word = k.title.split(" ")[0];
  if (!k.to)
    return (
      <div className="om-item om-kit-row" data-untested="" data-field={KIT_FIELD[word]}>
        <KitMark name={word} />
        <span className="om-item-t">
          <b>{k.title}</b>
        </span>
        <button className="om-buy" onClick={(e) => go("/v3/store", { from: e.currentTarget })}>
          Buy kit
        </button>
      </div>
    );
  return (
    <button className="om-item om-kit-row" data-field={KIT_FIELD[word]} onClick={(e) => go(k.to!, { from: e.currentTarget })}>
      <KitMark name={word} />
      <span className="om-item-t">
        <b>{k.title}</b>
      </span>
      <Chevron size={13} />
    </button>
  );
}

/** The two rows every reports list opens with: the PDFs and the clinical data. */
function ReportRows({ count, go }: { count: number; go: ReturnType<typeof useGo> }) {
  return (
    <>
      <Row field="capacity" glyph="scale" title="Generated PDF reports" sub="From your clinician and the labs" count={count} onClick={() => go("/insights/reports")} />
      <Row field="lavender" glyph="heart" title="Clinical insights" sub="Analyse your clinical data" onClick={() => go("/insights/clinical")} />
    </>
  );
}

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
    next.delete("test");
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

  const unseen = useUnseen(TOPICS.map((t) => t.id));
  // a tab's dot clears once the member moves on from it, so the "New" mark is still there while they read
  const lastTopic = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (lastTopic.current && lastTopic.current !== topic?.id) markSeen(lastTopic.current);
    lastTopic.current = topic?.id;
  }, [topic?.id]);

  const tested = kits.filter((k) => k.to);
  const untested = kits.filter((k) => !k.to);

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
            <button key={t.id} className="om-chip" data-field={t.field} data-new={unseen.has(t.id) ? "" : undefined} aria-pressed={topic?.id === t.id} aria-label={unseen.has(t.id) ? `${t.name}, new results` : undefined} onClick={() => pickTopic(t.id)}>
              {unseen.has(t.id) && <i className="om-chip-dot" aria-hidden />}
              <OmicsMark id={t.id} />
              <span className="om-chip-t">
                <small>{t.name}</small>
                <b>{t.chip}</b>
              </span>
            </button>
          ))}
        </div>

        {topic ? (
          <TestView key={topic.id} t={topic} fresh={unseen.has(topic.id)} reportCount={ins.reportCount} go={go} />
        ) : (
          <>
            <h1 className="om-title">Your health data</h1>
            <p className="om-sub">{LEAD}</p>

            {/* what the member has: reports, clinical data and every study they have results for; then the studies still to try */}
            <h2 className="om-h">Reports and insights</h2>
            <div className="om-list">
              <ReportRows count={ins.reportCount} go={go} />
              {tested.map((k) => (
                <KitRow key={k.title} k={k} go={go} />
              ))}
            </div>

            {untested.length > 0 && (
              <>
                <h2 className="om-h">Not tested yet</h2>
                <div className="om-list">
                  {untested.map((k) => (
                    <KitRow key={k.title} k={k} go={go} />
                  ))}
                </div>
              </>
            )}
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
function TestView({ t, fresh, reportCount, go }: { t: Topic; fresh: boolean; reportCount: number; go: ReturnType<typeof useGo> }) {
  const [params, setParams] = useSearchParams();
  const kits = testsOf(t.id);
  const at = pickOf(kits, params.get("test"));
  const bodyLevel = t.id === "proteomics";
  // the dot was showing when the tab opened: the newest run keeps its "New" mark while the member is here
  const [wasFresh] = useState(fresh);
  const choose = (key: string) => {
    const next = new URLSearchParams(params);
    next.set("test", key);
    setParams(next, { replace: true });
  };
  return (
    <>
      <h1 className="om-title">{bodyLevel ? t.name : t.title}</h1>
      {/* which test the page reads, straight under the headline; what it says follows */}
      {at && <KitPicker topic={t.id} kits={kits} at={at} fresh={wasFresh} onPick={choose} />}
      <p className="om-sub om-sub-after">{bodyLevel ? READS[t.id] : t.support}</p>

      {/* the summary reads the newest test; an earlier one goes straight to its own results */}
      {(!at || at.newest) &&
        (bodyLevel ? (
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
        ))}

      <h2 className="om-h">{at?.newest === false ? `Results · ${at.run.date}` : "In detail"}</h2>
      <div className="om-detail" data-field={t.field}>
        {at ? contentOf(t.id, at) : (readingOf(t.id).omicsCards ?? readingOf(t.id).cards)}
      </div>

      <h2 className="om-h">Reports and insights</h2>
      <div className="om-list">
        <ReportRows count={reportCount} go={go} />
      </div>

      <h2 className="om-h">On your body</h2>
      <div className="om-list">
        <Row field={t.field} glyph={t.glyph} title="See it on your twin" sub={`Where ${t.name.toLowerCase()} shows up, visit by visit`} onClick={(el) => go(`/v3/twin?lens=omics&organ=${t.id}`, { from: el })} />
      </div>
    </>
  );
}
