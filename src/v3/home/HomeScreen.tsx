import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BrandBar, followHead, V2Screen } from "../ui/shell";
import type { Tab } from "../data/metrics";
import type { GlyphName } from "../ui/glyphs";
import { IconAll, IconTabActivity, IconTabFood, IconTabHeart, IconTabSleep } from "../ui/icons";
import { schedulePush } from "../notify/store";
import { Overview } from "./Overview";
import { CategoryPage } from "./CategoryPage";
import "./home.css";

type DailyTab = Exclude<Tab, "body">;

/*
 * The tabs hold only what the ring, the band and the diary measure every day;
 * clinic readings live under Clinic visits.
 */
const TABS: { id: DailyTab; label: string; glyph: GlyphName; field: string }[] = [
  { id: "all", label: "Summary", glyph: "spark", field: "plain" },
  { id: "activity", label: "Activity", glyph: "flame", field: "activity" },
  { id: "sleep", label: "Sleep", glyph: "moon", field: "sleep" },
  { id: "vitals", label: "Heart", glyph: "heart", field: "heart" },
  { id: "food", label: "Food", glyph: "fork", field: "food" },
];

/** How far the brand bar and the tab track travel before both are gone: bar 52, tabs 48 and their gaps. */
const HEAD_LIFT = 114;
const BAR_H = 52;

/** Each page keeps its place when a detail is popped. */
const scrollMemory = new Map<string, number>();

/**
 * Home is a row of icon tabs on top and pages that
 * swipe sideways under it. Vitals, Body and Food are here because they change
 * daily; Omics changes between scans, so it has its own destination in the bar.
 */
export function HomeScreen() {
  const [params, setParams] = useSearchParams();
  const asked = params.get("tab");
  const tab: DailyTab = TABS.some((t) => t.id === asked) ? (asked as DailyTab) : "all";
  const index = Math.max(
    0,
    TABS.findIndex((t) => t.id === tab),
  );
  const pager = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  /*
   * Only the two round buttons at the top right stay put, on a glass capsule
   * once the page moves under them. The brand mark and the tabs ride up with
   * the page and fade, so they scroll away like the cards below them.
   */
  const follow = (top: number) => followHead(head.current, top, HEAD_LIFT, BAR_H);

  useEffect(() => schedulePush(), []);
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
      <div className="v2-head" ref={head}>
        {/*
          the brand mark at the left scrolls away with the page; the two round
          buttons at the right stay, gathered on a glass capsule once cards pass under them
        */}
        <BrandBar>
          {editing ? (
            <button className="v2-pillbtn" data-solid onClick={() => setEditing(false)}>
              Done
            </button>
          ) : undefined}
        </BrandBar>

        <div
          className="v2-tabs"
          role="tablist"
          aria-label="Health areas"
          style={{ "--i": index, "--n": TABS.length } as React.CSSProperties}
        >
          <i className="v2-tabs-blob" aria-hidden />
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              data-field={t.field}
              aria-selected={t.id === tab}
              aria-label={t.label}
              onClick={() => setParams({ tab: t.id }, { replace: true })}
            >
              <TabMark id={t.id} />
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
            {t.id === "all" ? <Overview editing={editing} onEdit={setEditing} /> : <CategoryPage tab={t.id} />}
          </section>
        ))}
      </div>
    </V2Screen>
  );
}

/** Each tab's mark; Summary keeps its own four tiles, one filled and the rest to come. */
const TAB_MARK: Record<DailyTab, () => JSX.Element> = {
  all: IconAll,
  activity: IconTabActivity,
  sleep: IconTabSleep,
  vitals: IconTabHeart,
  food: IconTabFood,
};

function TabMark({ id }: { id: DailyTab }) {
  const Mark = TAB_MARK[id];
  return <Mark />;
}
