import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { NavHeader } from "@/components/NavHeader";
import { useDataset } from "@/lib/data";
import { photo } from "@/lib/asset";
import { traitsData, type Trait } from "@/data/reportsTraits";
import { RIcon } from "./parts/RIcon";
import { RModal } from "./parts/RModal";
import { TraitCard } from "./TraitCard";
import "./TraitsList.css";

/**
 * Personal Traits list — /insights/genetic/traits.
 * Captures: traits_list/top, scroll_1, scroll_2, filter_behavior, search_focus, search_results, modal_trait.
 * Deep links (prototype/tests): ?cat=Behavior &focus=1 &q=sleep &trait=Endurance
 */
export function TraitsListScreen() {
  const d = useDataset(traitsData);
  const [p] = useSearchParams();
  const [cat, setCat] = useState(p.get("cat") ?? "All");
  const [query, setQuery] = useState(p.get("q") ?? "");
  const [focused, setFocused] = useState(p.get("focus") === "1" || !!p.get("q"));
  const [open, setOpen] = useState<Trait | null>(() => d.traits.find((t) => t.name === p.get("trait")) ?? null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (focused) input.current?.focus();
    // focus once on mount for deep links only
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const q = query.trim().toLowerCase();
  const inCat = d.traits.filter((t) => cat === "All" || t.category === cat);
  const shown = q ? inCat.filter((t) => `${t.name} ${t.gene} ${t.genotype}`.toLowerCase().includes(q)) : inCat;
  const found = q ? shown.length : cat === "All" ? d.total : d.categories.find((c) => c.name === cat)?.count ?? shown.length;

  return (
    <Screen
      header={<NavHeader variant="arrow" align="left" title={<span className="tl-navtitle">Personal Traits</span>} />}
      bodyClassName="tl-body"
      overlay={
        <>
          {focused && <img className="tl-kb" src={photo(q ? "reports/keyboard_sleep.png" : "reports/keyboard.png")} alt="" aria-hidden onMouseDown={(e) => e.preventDefault()} />}
          <RModal open={!!open} onClose={() => setOpen(null)} width={354}>
            {open && <TraitModal t={open} onClose={() => setOpen(null)} />}
          </RModal>
        </>
      }
    >
      <label className="tl-search">
        <RIcon name="search" />
        <input
          ref={input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search traits, genes, or genotypes..."
        />
      </label>
      <p className="tl-found">Found {found} traits</p>
      {/* The list scrolls under the fixed search + count (capture scroll view y 216–843). */}
      <div className="tl-list scroll" data-scroll-root>
        {shown.length === 0 ? (
          <div className="tl-empty">
            <RIcon name="empty_psych" />
            <b>No trait data available</b>
            <span>We couldn't find any trait data for your profile</span>
          </div>
        ) : (
          <>
            <div className="tl-chips">
              {d.categories.map((c) => (
                <button key={c.name} className="tl-chip" data-on={c.name === cat || undefined} onClick={() => setCat(c.name)}>
                  <span className="tl-chip-circle">
                    {c.icon && <RIcon name={c.icon} />}
                    <i>{c.count}</i>
                  </span>
                  <span className="tl-chip-label">{c.name}</span>
                </button>
              ))}
            </div>
            {shown.map((t, i) => (
              <TraitCard key={i} t={t} onOpen={() => setOpen(t)} />
            ))}
          </>
        )}
      </div>
    </Screen>
  );
}

/** Trait detail dialog — capture: traits_list/modal_trait. */
function TraitModal({ t, onClose }: { t: Trait; onClose: () => void }) {
  return (
    <div className="tm">
      <div className="tm-head">
        <span className="tm-head-icon">
          <RIcon name="modal_run" />
        </span>
        <h2>{t.name}</h2>
      </div>
      <div className="tm-body scroll">
        <div className="tm-summary">
          <h3>Summary</h3>
          <p>{t.summary}</p>
        </div>
        <h3 className="tm-h">Key Information</h3>
        <div className="tm-keys">
          {(
            [
              ["category", "Category", t.category],
              ["biotech", "Gene", t.gene],
              ["fingerprint", "Genotype", t.genotype],
            ] as const
          ).map(([icon, label, value]) => (
            <div key={label} className="tm-key">
              <span className="tm-key-icon">
                <RIcon name={icon} />
              </span>
              <span className="tm-key-text">
                <span>{label}</span>
                <b>{value}</b>
              </span>
            </div>
          ))}
        </div>
        <h3 className="tm-h">Description</h3>
        {/* TODO(fidelity): only Endurance's description was captured; others fall back to the summary. */}
        <p className="tm-desc">{t.description ?? t.summary}</p>
      </div>
      <div className="tm-foot">
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
