import { useMemo, useState } from "react";
import { Chevron } from "../ui/icons";
import { fmt, TARGET } from "./data";
import { GROUPS, panelOf, type Group, type PanelRow } from "./nutrients";
import type { Meal } from "./store";
import "./nutrient-panel.css";

/*
 * Every nutrient the day's food reports, under the six headline ones. On the
 * page it is one row under the nutrient cards; the full list opens in a
 * sheet, where filter pills narrow it to one group and "All" shows each group
 * under its own label.
 * A nutrient appears only when at least one logged food has a value for it,
 * and says so when the value covers only part of the day's food.
 * Status is carried by a word as well as the bar's colour:
 *   goals   Low (under half) · On the way · Met
 *   limits  Well under · Near limit (80%+) · Over
 */

type Filter = "all" | Group;

/** The member's own target where the plan sets one, the reference amount otherwise. */
const targetOf = (r: PanelRow) => (r.n.id === "fiber" || r.n.id === "calcium" || r.n.id === "iron" ? TARGET[r.n.id] : r.n.target);

function statusOf(r: PanelRow): { word: string; tone: "low" | "go" | "met" | "ok" | "near" | "over" } {
  const share = r.amount / targetOf(r);
  if (r.n.kind === "limit") return share > 1 ? { word: "Over", tone: "over" } : share >= 0.8 ? { word: "Near limit", tone: "near" } : { word: "Well under", tone: "ok" };
  return share >= 1 ? { word: "Met", tone: "met" } : share >= 0.5 ? { word: "On the way", tone: "go" } : { word: "Low", tone: "low" };
}

const amountText = (v: number, unit: string) => (v >= 100 ? fmt(Math.round(v)) : v >= 10 ? v.toFixed(0) : v.toFixed(1)) + (unit === "g" ? " g" : ` ${unit}`);

function useRows(meals: Meal[]) {
  return useMemo(() => panelOf(meals).filter((r) => r.coverage > 0), [meals]);
}

function summaryOf(rows: PanelRow[]) {
  const low = rows.filter((r) => r.n.kind === "goal" && r.amount / targetOf(r) < 0.5).length;
  const near = rows.filter((r) => r.n.kind === "limit" && r.amount / targetOf(r) >= 0.8).length;
  return `${low > 0 ? `${low} to top up` : "Every goal half way"}${near > 0 ? ` · ${near} near ${near > 1 ? "limits" : "a limit"}` : " · nothing near a limit"}`;
}

/**
 * The panel folded into one row under the nutrient cards: what needs
 * just its title and a chevron into the full list; what needs attention is
 * still read out to screen readers.
 */
export function NutrientStrip({ meals, onOpen }: { meals: Meal[]; onOpen: () => void }) {
  const rows = useRows(meals);
  return (
    <button className="np-strip" onClick={onOpen} aria-label={`More nutrients: ${rows.length ? summaryOf(rows) : "nothing logged"}`}>
      <span className="np-strip-t">
        <b>More nutrients</b>
      </span>
      <Chevron size={15} />
    </button>
  );
}

/** The full list in a sheet over the page: summary, group pills, then the rows. */
export function NutrientSheet({ meals, onClose }: { meals: Meal[]; onClose: () => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = useRows(meals);
  const shown = GROUPS.filter((g) => filter === "all" || g.id === filter)
    .map((g) => ({ g, list: rows.filter((r) => r.n.group === g.id) }))
    .filter((x) => x.list.length > 0);
  return (
    <div className="mx-sheet-scrim" onClick={onClose}>
      <div className="mx-sheet np-sheet" role="dialog" aria-label="Nutrients" onClick={(e) => e.stopPropagation()}>
        <i className="mx-sheet-grab" aria-hidden />
        <h2>Nutrients</h2>
        {rows.length === 0 ? (
          <p className="np-empty">Log a meal and its vitamins, minerals and fats show up here.</p>
        ) : (
          <>
            <p className="np-sum">
              {rows.length} tracked · {summaryOf(rows)}
            </p>
            <div className="np-pills" role="tablist" aria-label="Nutrient groups">
              {[{ id: "all" as Filter, name: "All" }, ...GROUPS].map((g) => (
                <button key={g.id} role="tab" aria-selected={filter === g.id} onClick={() => setFilter(g.id)}>
                  {g.name}
                </button>
              ))}
            </div>
            <div className="np-card">
              {shown.map(({ g, list }) => (
                <div key={g.id} className="np-group">
                  {filter === "all" && <h3>{g.name}</h3>}
                  {list.map((r) => (
                    <Row key={r.n.id} r={r} />
                  ))}
                </div>
              ))}
            </div>
            <p className="np-foot">From the foods you logged. Partial means some of them have no value for that nutrient yet, so the real amount may be higher.</p>
          </>
        )}
        <button className="mx-sheet-cancel" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

function Row({ r }: { r: PanelRow }) {
  const target = targetOf(r);
  const share = r.amount / target;
  const s = statusOf(r);
  const partial = r.coverage < 0.98;
  return (
    <div className="np-row" data-tone={s.tone} aria-label={`${r.n.name}: ${amountText(r.amount, r.n.unit)} of ${amountText(target, r.n.unit)}, ${s.word}${partial ? ", partial" : ""}`}>
      <span className="np-t">
        <b>{r.n.name}</b>
        <small>
          {r.n.why}
          {partial && <em> · Partial</em>}
        </small>
      </span>
      <span className="np-v">
        <b>{amountText(r.amount, r.n.unit)}</b>
        <small>
          {r.n.kind === "limit" ? "under " : "of "}
          {amountText(target, r.n.unit)}
        </small>
      </span>
      <span className="np-bar" aria-hidden>
        <i style={{ transform: `scaleX(${Math.min(1, share)})` }} />
        {r.n.kind === "limit" && <u />}
      </span>
      <span className="np-word" aria-hidden>
        {s.word}
      </span>
    </div>
  );
}
