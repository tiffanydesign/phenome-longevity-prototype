import { useEffect, useRef, useState, type ComponentType } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar, V2Screen } from "../ui/shell";
import {
  IconActivity,
  IconAll,
  IconBody,
  IconFood,
  IconSleep,
  IconVitals,
} from "../ui/icons";
import type { Tab } from "../data/metrics";
import { Overview } from "./Overview";
import { CategoryPage } from "./CategoryPage";
import "./home.css";

/** `field` tints the selected tab in the same hue as that page's cards. */
/*
 * Tabs in order of how often their readings change, as Home's Today group
 * reads: what moves through the day first, what moves only between visits last.
 */
const TABS: { id: Tab; label: string; Icon: ComponentType; field: string }[] = [
  { id: "all", label: "All", Icon: IconAll, field: "capacity" },
  { id: "activity", label: "Activity", Icon: IconActivity, field: "activity" },
  { id: "sleep", label: "Sleep", Icon: IconSleep, field: "sleep" },
  { id: "vitals", label: "Vitals", Icon: IconVitals, field: "vitals" },
  { id: "food", label: "Food", Icon: IconFood, field: "food" },
  { id: "body", label: "Body", Icon: IconBody, field: "body" },
];

/** Each page keeps its place when a detail is popped. */
const scrollMemory = new Map<string, number>();

/**
 * Home is a row of icon tabs on top and pages that
 * swipe sideways under it. Vitals, Body and Food are here because they change
 * daily; Omics changes between scans, so it has its own destination in the bar.
 */
export function HomeScreen() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) ?? "all";
  const index = Math.max(
    0,
    TABS.findIndex((t) => t.id === tab),
  );
  const pager = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  // the title and tabs ride up with whichever page is in view
  const follow = (top: number) => {
    if (head.current)
      head.current.style.transform = `translateY(${-Math.max(0, top)}px)`;
  };
  const settling = useRef(false);

  useEffect(() => {
    const el = pager.current;
    if (!el) return;
    settling.current = true;
    el.scrollTo({
      left: index * el.clientWidth,
      behavior: el.scrollLeft === 0 && index > 0 ? "auto" : "smooth",
    });
    follow(scrollMemory.get(TABS[index].id) ?? 0);
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
    if (
      next !== index &&
      Math.abs(el.scrollLeft / el.clientWidth - next) < 0.08
    )
      setParams({ tab: TABS[next].id }, { replace: true });
  };

  return (
    <V2Screen>
      <div className="v2-veil" data-at="status" aria-hidden />
      <div className="v2-head" ref={head}>
        <header className="v2-top">
          <h1>Phenome</h1>
          {editing && (
            <button
              className="v2-pillbtn"
              data-solid
              onClick={() => setEditing(false)}
            >
              Done
            </button>
          )}
          <Avatar />
        </header>

        <div
          className="v2-tabs"
          role="tablist"
          aria-label="Health areas"
          data-field={TABS[index].field}
          style={{ "--i": index } as React.CSSProperties}
        >
          <i className="v2-tabs-blob" aria-hidden />
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === tab}
              aria-label={t.label}
              onClick={() => setParams({ tab: t.id }, { replace: true })}
            >
              <t.Icon />
            </button>
          ))}
        </div>
      </div>

      <div className="v2-pager" ref={pager} onScroll={onSwipe}>
        {TABS.map((t) => (
          <section
            key={t.id}
            className="v2-page"
            data-page={t.id}
            aria-label={t.label}
            onScroll={(e) => {
              scrollMemory.set(t.id, e.currentTarget.scrollTop);
              if (t.id === TABS[index].id) follow(e.currentTarget.scrollTop);
            }}
          >
            {t.id === "all" ? (
              <Overview editing={editing} onEdit={setEditing} />
            ) : (
              <CategoryPage tab={t.id} />
            )}
          </section>
        ))}
      </div>
    </V2Screen>
  );
}
