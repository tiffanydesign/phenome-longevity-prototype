import { useEffect, useRef, useState, type ComponentType } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar, V2Screen } from "../ui/shell";
import { IconActivity, IconAll, IconBody, IconFood, IconMore, IconSleep, IconVitals } from "../ui/icons";
import type { Tab } from "../data/metrics";
import { Overview } from "./Overview";
import { CategoryPage } from "./CategoryPage";
import "./home.css";

const TABS: { id: Tab; label: string; Icon: ComponentType }[] = [
  { id: "all", label: "All", Icon: IconAll },
  { id: "activity", label: "Activity", Icon: IconActivity },
  { id: "sleep", label: "Sleep", Icon: IconSleep },
  { id: "vitals", label: "Vitals", Icon: IconVitals },
  { id: "body", label: "Body", Icon: IconBody },
  { id: "food", label: "Food", Icon: IconFood },
];

/** Each page keeps its place when a detail is popped, as a tab in Samsung Health does. */
const scrollMemory = new Map<string, number>();

/**
 * Home follows Samsung Health's frame: a row of icon tabs on top and pages that
 * swipe sideways under it. Vitals, Body and Food are here because they change
 * daily; Omics changes between scans, so it has its own destination in the bar.
 */
export function HomeScreen() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) ?? "all";
  const index = Math.max(0, TABS.findIndex((t) => t.id === tab));
  const pager = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const settling = useRef(false);

  useEffect(() => {
    const el = pager.current;
    if (!el) return;
    settling.current = true;
    el.scrollTo({ left: index * el.clientWidth, behavior: el.scrollLeft === 0 && index > 0 ? "auto" : "smooth" });
    const t = window.setTimeout(() => (settling.current = false), 420);
    return () => window.clearTimeout(t);
  }, [index]);

  useEffect(() => {
    pager.current?.querySelectorAll<HTMLElement>("[data-page]").forEach((p) => {
      p.scrollTop = scrollMemory.get(p.dataset.page!) ?? 0;
    });
  }, []);

  const onSwipe = () => {
    const el = pager.current;
    if (!el || settling.current) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== index && Math.abs(el.scrollLeft / el.clientWidth - next) < 0.08) setParams({ tab: TABS[next].id }, { replace: true });
  };

  return (
    <V2Screen>
      <header className="v2-top">
        <h1>Phenome</h1>
        {editing ? (
          <button className="v2-pillbtn" data-solid onClick={() => setEditing(false)}>
            Done
          </button>
        ) : (
          <button className="v2-iconbtn" aria-label="Edit cards" onClick={() => setEditing(true)}>
            <IconMore />
          </button>
        )}
        <Avatar />
      </header>

      <div className="v2-tabs" role="tablist" aria-label="Health areas" style={{ "--i": index } as React.CSSProperties}>
        <i className="v2-tabs-blob" aria-hidden />
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={t.id === tab} aria-label={t.label} onClick={() => setParams({ tab: t.id }, { replace: true })}>
            <t.Icon />
          </button>
        ))}
      </div>

      <div className="v2-pager" ref={pager} onScroll={onSwipe}>
        {TABS.map((t) => (
          <section key={t.id} className="v2-page" data-page={t.id} aria-label={t.label} onScroll={(e) => scrollMemory.set(t.id, e.currentTarget.scrollTop)}>
            {t.id === "all" ? <Overview editing={editing} onEdit={setEditing} /> : <CategoryPage tab={t.id} />}
          </section>
        ))}
      </div>
    </V2Screen>
  );
}
