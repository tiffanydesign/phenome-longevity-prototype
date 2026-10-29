import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { NavHeader } from "@/components/NavHeader";
import { useDataset } from "@/lib/data";
import { drugsData, type DrugCategory, type DrugGroup, type DrugRow } from "@/data/reportsDrugs";
import { Chevron, RIcon } from "./parts/RIcon";
import type { RIconName } from "./parts/iconSizes";
import { RModal } from "./parts/RModal";
import "./DrugList.css";

const CHIPS: { name: "All" | DrugCategory; icon: RIconName }[] = [
  { name: "All", icon: "chip_all" },
  { name: "Dosage", icon: "chip_dosage" },
  { name: "Efficacy", icon: "chip_efficacy" },
  { name: "Metabolism/PK", icon: "chip_swap" },
  { name: "Toxicity", icon: "chip_warning" },
];
const ROW_ICON: Record<DrugCategory, RIconName> = { Dosage: "row_dosage", Efficacy: "row_verified", "Metabolism/PK": "row_swap", Toxicity: "row_warning" };

/**
 * Medication Response list — /insights/genetic/drugs.
 * Captures: drug_list/top, scroll_1…3, modal_drug. Deep links: ?cat=Dosage &q=warf &drug=Warfarin
 */
export function DrugListScreen() {
  const d = useDataset(drugsData);
  const [p] = useSearchParams();
  const [cat, setCat] = useState<"All" | DrugCategory>((p.get("cat") as DrugCategory) ?? "All");
  const [query, setQuery] = useState(p.get("q") ?? "");
  const [open, setOpen] = useState<{ g: DrugGroup; r: DrugRow } | null>(() => {
    const g = d.groups[0];
    const r = g.rows.find((x) => x.drug === p.get("drug"));
    return r ? { g, r } : null;
  });

  const q = query.trim().toLowerCase();
  const match = (r: DrugRow) => (cat === "All" || r.category === cat) && (!q || `${r.drug} ${r.gene} ${r.genotype}`.toLowerCase().includes(q));
  const found = q ? d.groups.reduce((n, g) => n + g.rows.filter(match).length, 0) : cat === "All" ? d.total : d.byCategory[cat];

  return (
    <Screen
      header={<NavHeader variant="arrow" align="left" title={<span className="dl-navtitle">Medication Response</span>} />}
      overlay={
        <RModal open={!!open} onClose={() => setOpen(null)} overflowVisible>
          {open && <DrugModal g={open.g} r={open.r} onClose={() => setOpen(null)} />}
        </RModal>
      }
    >
      <div className="dl">
        <label className="dl-search">
          <RIcon name="search" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search drugs, genes, or phenotypes..." />
        </label>
        <div className="dl-chips">
          {CHIPS.map((c) => (
            <button key={c.name} className="dl-chip" data-on={c.name === cat || undefined} onClick={() => setCat(c.name)}>
              <span className="dl-chip-circle">
                <RIcon name={c.icon} />
              </span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
        <p className="dl-found">Found {found} drug interactions</p>
        {d.groups.map((g) => {
          const rows = g.rows.filter(match);
          if (!rows.length) return null;
          return (
            <section key={g.title} className="dl-group">
              <header className="dl-group-head">
                <span>
                  <h2>{g.title}</h2>
                  <p>{g.sub}</p>
                </span>
                <i data-tone={g.tone}>{g.count}</i>
              </header>
              {g.order.map((c) => {
                const sub = rows.filter((r) => r.category === c);
                if (!sub.length) return null;
                return (
                  <div key={c} className="dl-sub">
                    <h3>{c}</h3>
                    {sub.map((r, i) => (
                      <button key={i} className="dl-row" onClick={() => setOpen({ g, r })}>
                        <span className="dl-row-icon">
                          <RIcon name={ROW_ICON[c]} />
                        </span>
                        <span className="dl-row-text">
                          {/* the app wraps only at spaces, never at the hyphens in "alfa-2a" */}
                          <b>
                            {r.drug.split(" ").map((w, k) => (
                              <span key={k}>
                                {k > 0 && " "}
                                <i>{w}</i>
                              </span>
                            ))}
                          </b>
                          <span>
                            {r.gene} • {r.genotype}
                          </span>
                        </span>
                        <span className="dl-row-chev">
                          <Chevron size={16} stroke={1.7} />
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </Screen>
  );
}

/** Drug detail — capture: drug_list/modal_drug. The red pill's subtitle overflows the card (app bug, kept). */
function DrugModal({ g, r, onClose }: { g: DrugGroup; r: DrugRow; onClose: () => void }) {
  const facts: [RIconName, string, string][] = [
    ["m_gene", "Gene:", r.gene],
    ["m_flask", "Genotype:", r.genotype],
    ["m_med", "Used For:", ""],
    ["m_link", "rsID:", r.rsid ?? ""],
    ["m_info", "Evidence:", g.evidence],
    ["m_wrench", "Modifiers:", g.modifiers],
    // TODO(fidelity): Category row is cut off at the bottom of the captured scroll view; icon unknown.
    ["m_info", "Category:", r.category],
  ];
  return (
    <div className="dm">
      <h2 className="dm-title">{r.drug}</h2>
      <div className="dm-pill" data-tone={g.tone}>
        <i />
        <b>{g.title}</b>
        <span>{g.sub}</span>
      </div>
      <div className="dm-bar" />
      <div className="dm-body scroll">
        {g.about && <p className="dm-about">{g.about}</p>}
        {facts.map(([icon, label, value]) => (
          <div key={label} className="dm-fact">
            <RIcon name={icon} />
            <span>
              <b>{label}</b> {value}
            </span>
          </div>
        ))}
      </div>
      <div className="dm-foot">
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
