import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { NavHeader } from "@/components/NavHeader";
import { useDataset } from "@/lib/data";
import { conditionsData, type ConditionFinding } from "@/data/reportsConditions";
import { RIcon } from "./parts/RIcon";
import { Dots } from "./parts/Pager";
import "./GeneticConditions.css";

const PAGE_W = 394;

/**
 * Health Conditions findings — /insights/genetic/conditions.
 * Captures: genetic_conditions/top, scroll_1…4 (inner card scroll), card_2 (pager).
 * The pager loops: the previous/next peeks both show the other card (XML at x 0–20 / 374–394).
 */
export function GeneticConditionsScreen() {
  const cards = useDataset(conditionsData);
  const [q] = useSearchParams();
  const n = cards.length;
  // [last, ...cards, first] so both peeks are filled; real pages are 1…n
  const loop = n > 1 ? [cards[n - 1], ...cards, cards[0]] : cards;
  const off = n > 1 ? 1 : 0;
  const [index, setIndex] = useState(() => Math.min(n - 1, Math.max(0, Number(q.get("card") ?? 1) - 1)));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = (index + off) * PAGE_W;
  }, []);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const p = Math.round(el.scrollLeft / PAGE_W);
    if (Math.abs(el.scrollLeft - p * PAGE_W) > 1) return; // still moving
    if (off && p === 0) el.scrollLeft = n * PAGE_W;
    else if (off && p === n + 1) el.scrollLeft = PAGE_W;
    setIndex((((p - off) % n) + n) % n);
  };

  return (
    <Screen header={<NavHeader variant="arrow" align="left" title={<span className="gc-navtitle">Health Conditions Insights</span>} />}>
      <div className="gc">
        <h2 className="gc-title">Critical Findings</h2>
        <p className="gc-sub">{n} conditions requiring attention</p>
        <div className="gc-pager rp-track" ref={ref} onScroll={onScroll}>
          {loop.map((c, i) => (
            <ConditionCard key={i} c={c} active={i - off === index} />
          ))}
        </div>
        <Dots count={n} index={index} onPick={(i) => ref.current?.scrollTo({ left: (i + off) * PAGE_W, behavior: "smooth" })} />
      </div>
    </Screen>
  );
}

function ConditionCard({ c, active }: { c: ConditionFinding; active: boolean }) {
  return (
    <section className="gc-page">
      <div className="gc-card">
        <header className="gc-head">
          <div className="gc-head-top">
            <span className="gc-tag">{c.tag}</span>
            <span className="gc-heart">
              <RIcon name="cond_heart" />
            </span>
          </div>
          <h3 className="gc-name">{c.name}</h3>
          <dl className="gc-facts">
            <dt>GENE:</dt>
            <dd>{c.gene}</dd>
            <dt>VARIANT:</dt>
            <dd>{c.variant}</dd>
            <dt>INHERITANCE:</dt>
            <dd>{c.inheritance}</dd>
          </dl>
        </header>
        {/* inner scroller; only the visible card is the compare scroll root */}
        <div className="gc-body scroll" data-scroll-root={active ? "" : undefined}>
          <h4 className="gc-h">Genetic Information</h4>
          <dl className="gc-info">
            <dt>RSID</dt>
            <dd>{c.rsid}</dd>
            <dt>ZYGOSITY</dt>
            <dd>{c.zygosity}</dd>
            <dt>PATHOGENICITY</dt>
            <dd>{c.pathogenicity}</dd>
          </dl>
          {c.sections.map((s) => (
            <section key={s.title} className="gc-sec">
              <h4 className="gc-h">{s.title}</h4>
              <p>{s.body}</p>
            </section>
          ))}
          <hr className="gc-end" />
        </div>
      </div>
    </section>
  );
}
