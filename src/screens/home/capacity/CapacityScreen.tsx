import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { NavHeader } from "@/components/NavHeader";
import { Icon } from "@/components/Icon";
import { Gauge, Skeleton } from "@/components/Charts";
import { useDataset, useOffline } from "@/lib/data";
import { capacityData, type CapacityComponent } from "@/data/home-capacity";
import { InfoIcon, TrendMark } from "../shared/marks";
import "./CapacityScreen.css";

/** Skeleton duration on enter (recordings/transition_home_to_capacity.mp4: ~100 ms crossfade, then skeleton). */
const SKELETON_MS = 600;

/**
 * Capacity detail — capture: capacity/top, scroll_1, scroll_2, capacity/loading (video frame),
 * offline/capacity, dark_capacity/top.
 */
export function CapacityScreen() {
  // keyed by navigation so every entry restarts the flow / skeleton
  return <CapacityScreenView key={useLocation().key} />;
}

function CapacityScreenView() {
  const d = useDataset(capacityData);
  const offline = useOffline();
  // `?hold=skeleton` pins the transient skeleton for the compare harness.
  // `?hold=none` skips it (scroll cases). Prototype-only switches.
  const holdQ = new URLSearchParams(useLocation().search).get("hold");
  const hold = holdQ === "skeleton";
  const [loading, setLoading] = useState(holdQ !== "none");
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), SKELETON_MS);
    return () => window.clearTimeout(t);
  }, []);

  let body: ReactNode;
  if (loading || hold) body = <CapacitySkeleton />;
  else if (offline) body = <p className="capd-empty">No capacity data available</p>;
  else
    body = (
      <div className="capd capd-in">
        <div className="capd-gauge">
          <Gauge width={320} stroke={20} value={d.score / 100} color="var(--c-capacity)">
            <span className="capd-score">{d.score}</span>
          </Gauge>
        </div>
        <p className="capd-desc">
          This score reflects your body's ability to handle sustained activity based on recovery trends, cardiovascular signals, and movement patterns
          — helping you understand how much you can sustainably support over time.
        </p>

        <div className="capd-tiles">
          {d.components.map((c) => (
            <div className="capd-tile" key={c.id}>
              <Icon name={c.icon} size={21} className="capd-tile-icon" />
              <span className="capd-tile-label">{c.label}</span>
              <Value v={c.today} unit={c.unit} color={c.color} small />
            </div>
          ))}
        </div>

        <section className="capd-card capd-tvy">
          <h2 className="capd-card-title">Today vs Yesterday</h2>
          <div className="capd-pair">
            <div>
              <span className="capd-lbl">Today</span>
              <span className="capd-big">
                {d.today}
                <TrendMark kind="up" color="var(--c-danger)" />
              </span>
            </div>
            <div>
              <span className="capd-lbl">Yesterday</span>
              <span className="capd-big">
                {d.yesterday}
                <TrendMark kind="dot" color="var(--c-danger)" />
              </span>
            </div>
          </div>
          <span className="capd-lbl capd-bar-lbl">Today</span>
          <Bar value={d.todayBar} color="var(--c-capacity)" />
          <span className="capd-lbl capd-bar-lbl capd-bar-lbl-2">Yesterday</span>
          <Bar value={d.yesterdayBar} color="var(--c-text-3)" />
        </section>

        <section className="capd-analysis">
          <h2>Longevity Analysis</h2>
          <p>
            {d.analysis.lead}
            <b>{d.analysis.emphasis}</b>
          </p>
        </section>

        <h2 className="capd-h2">Components</h2>
        {d.components.map((c) => (
          <ComponentRow key={c.id} c={c} />
        ))}

        <section className="capd-card capd-legend">
          <div className="capd-legend-row">
            <span className="capd-swatch" style={{ background: "#5aaeca" }} /> Today
            <span className="capd-legend-gap" />
            <span className="capd-swatch capd-swatch-y" /> Yesterday
          </div>
          {/* TODO(fidelity): component comparison bars — capture shows an empty grey track only. */}
          <div className="capd-legend-track" />
        </section>
      </div>
    );

  return (
    <div className="capd-theme">
      <Screen statusTone="light" header={<NavHeader variant="chevron" title="Capacity" />}>
        {body}
      </Screen>
    </div>
  );
}

function ComponentRow({ c }: { c: CapacityComponent }) {
  return (
    <section className="capd-comp">
      <h3>
        {c.label} <InfoIcon />
      </h3>
      <div className="capd-pair">
        <div>
          <span className="capd-lbl">Today</span>
          <Value v={c.today} unit={c.unit} color={c.color} />
        </div>
        <div>
          <span className="capd-lbl">Yesterday</span>
          <Value v={c.yesterday} unit={c.unit} color="var(--c-text-2)" />
        </div>
      </div>
    </section>
  );
}

function Value({ v, unit, color, small }: { v: number | null; unit: string; color: string; small?: boolean }) {
  return (
    <span className={small ? "capd-val capd-val-sm" : "capd-val"} style={{ color }}>
      <b>{v ?? "--"}</b> {unit}
    </span>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="capd-bar">
      {value > 0 && <div style={{ width: `${value * 100}%`, background: color }} />}
    </div>
  );
}

/** capture: capacity/loading (frame 33 of transition_home_to_capacity.mp4). */
function CapacitySkeleton() {
  return (
    <div className="capd-skel">
      <Skeleton w={200} h={200} r={100} style={{ margin: "0 auto", background: "var(--capd-skel)" }} />
      <Skeleton h={60} r={13} style={{ marginTop: 25, background: "var(--capd-skel)" }} />
      <Skeleton h={120} r={13} style={{ marginTop: 16, background: "var(--capd-skel)" }} />
      <Skeleton h={80} r={13} style={{ marginTop: 16, background: "var(--capd-skel)" }} />
    </div>
  );
}
