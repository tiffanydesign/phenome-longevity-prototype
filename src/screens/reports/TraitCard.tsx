import type { Trait } from "@/data/reportsTraits";
import { RIcon } from "./parts/RIcon";

/**
 * Trait card with the "Less Likely ↔ More Likely" arc (capture: traits_list/top, scroll_1).
 * The arc spans 159° (caps sit 10.5° above the horizontal), r 125.8, stroke 44.8 — measured
 * from the capture; the shared semicircle <Gauge> is a 180° arc, so this is module-local.
 */
export function TraitCard({ t, onOpen }: { t: Trait; onOpen: () => void }) {
  return (
    <button className="tc" onClick={onOpen}>
      <span className="tc-info">
        <RIcon name="info" />
      </span>
      <TraitArc value={t.value} />
      <span className="tc-icon">
        <RIcon name={t.icon} />
      </span>
      <span className="tc-less">Less Likely</span>
      <span className="tc-more">More Likely</span>
      <span className="tc-name">{t.name}</span>
      <span className="tc-gene">
        Gene: {t.gene} • {t.genotype}
      </span>
      <span className="tc-sum">{t.summary}</span>
    </button>
  );
}

const CX = 181;
const CY = 169;
const R = 125.8;
const SW = 44.8;
const A0 = (169.5 * Math.PI) / 180;
const A1 = (10.5 * Math.PI) / 180;

function TraitArc({ value }: { value: number }) {
  const p = (a: number) => `${(CX + R * Math.cos(a)).toFixed(2)} ${(CY - R * Math.sin(a)).toFixed(2)}`;
  const d = `M ${p(A0)} A ${R} ${R} 0 0 1 ${p(A1)}`;
  return (
    <svg className="tc-arc" width="362" height="220" aria-hidden>
      <path d={d} fill="none" stroke="var(--tc-track)" strokeWidth={SW} strokeLinecap="round" />
      {value > 0 && <path d={d} fill="none" stroke="#78b4ee" strokeWidth={SW} strokeLinecap="round" pathLength={1} strokeDasharray={`${value} 1`} />}
    </svg>
  );
}
