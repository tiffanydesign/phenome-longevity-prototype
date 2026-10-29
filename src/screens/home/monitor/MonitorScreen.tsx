import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { NavHeader, ChevronLeft, ChevronRight } from "@/components/NavHeader";
import { Segmented } from "@/components/Controls";
import { Icon } from "@/components/Icon";
import { useDataset } from "@/lib/data";
import { METRICS, PERIODS, PICKER_GROUPS, metricById, monitorData, valuesFor, type MetricDef, type Period } from "@/data/home-monitor";
import { BpBody, SleepBody, StandardBody } from "./MonitorSections";
import { nowFromSearch } from "../shared/marks";
import "./Monitor.css";

/**
 * "Your Health Monitor" metric detail — capture: steps/top, scroll_1, period_W/M/6M/Y,
 * metric_dropdown; calories/top, scroll_1; sleep/top, scroll_1, scroll_2;
 * monitor_blood_pressure/top … scroll_3.
 */
export function MonitorScreen() {
  const { metric } = useParams();
  const search = useLocation().search;
  // keyed so period / dropdown state resets when the metric or query changes
  return <MonitorView key={`${metric}${search}`} id={metric} search={search} />;
}

function MonitorView({ id, search }: { id: string | undefined; search: string }) {
  const nav = useNavigate();
  const m = metricById(id);
  const all = useDataset(monitorData);
  // `?period=W` opens a period directly (compare harness; prototype-only switch).
  const [period, setPeriod] = useState<Period>(() => PERIODS.find((p) => p === new URLSearchParams(search).get("period")) ?? "D");
  const [open, setOpen] = useState(false);
  const today = nowFromSearch(search);
  const v = valuesFor(all, m.id, period);

  const pick = (next: MetricDef) => {
    setOpen(false);
    setPeriod("D");
    nav(`/home/monitor/${next.id}${window.location.hash.includes("?") ? "?" + window.location.hash.split("?")[1] : ""}`, { replace: true });
  };

  return (
    <div className="mon-theme">
    <Screen statusTone="light" header={<NavHeader variant="chevron" title="Your Health Monitor" />} bodyClassName="mon-body">
      <div className="mon" key={m.id}>
        <div className="mon-picker" data-open={open || undefined}>
          <button className="mon-select" onClick={() => setOpen(!open)}>
            <Icon name={m.icon} size={20} className="mon-select-icon" />
            <span className="mon-select-label">{m.label}</span>
            <Chevron up={open} />
          </button>
          {open && <MetricList current={m.id} onPick={pick} />}
        </div>

        <div className="mon-seg">
          <Segmented options={PERIODS} value={period} onChange={setPeriod} />
        </div>

        <div className="mon-date">
          <button aria-label="Previous period">
            <ChevronLeft size={22} />
          </button>
          <span>{periodTitle(period, today)}</span>
          <button aria-label="Next period">
            <ChevronRight size={22} />
          </button>
        </div>

        {m.kind === "sleep" ? (
          <SleepBody m={m} v={v} />
        ) : m.kind === "bp" ? (
          <BpBody m={m} v={v} period={period} today={today} />
        ) : (
          <StandardBody m={m} v={v} period={period} today={today} />
        )}
      </div>
    </Screen>
    </div>
  );
}

/** Inline dropdown panel (capture: steps/metric_dropdown) — overlays the content below. */
function MetricList({ current, onPick }: { current: string; onPick: (m: MetricDef) => void }) {
  return (
    <div className="mon-list">
      {PICKER_GROUPS.map((g) => (
        <div key={g.title}>
          <div className="mon-list-head">
            <span>{g.title}</span>
            <i />
          </div>
          {g.ids
            .filter((x) => x !== current)
            .map((x) => {
              const mm = METRICS.find((q) => q.id === x)!;
              return (
                <button key={x} className="mon-list-item" onClick={() => onPick(mm)}>
                  <Icon name={mm.icon} size={20} />
                  <span>{mm.label}</span>
                </button>
              );
            })}
        </div>
      ))}
    </div>
  );
}

function Chevron({ up }: { up: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ transform: up ? "rotate(180deg)" : undefined }} aria-hidden>
      <path d="M3.5 6.5L9 12l5.5-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const DAY = 86400000;
function periodTitle(p: Period, t: Date): string {
  const dMon = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const mon = (d: Date) => d.toLocaleDateString("en-GB", { month: "short" });
  switch (p) {
    case "D":
      return `TODAY, ${dMon(t)} ${t.getFullYear()}`;
    case "W":
      return `${dMon(new Date(t.getTime() - 6 * DAY))} - ${dMon(t)}`;
    case "M":
      return `${mon(t)} ${t.getFullYear()}`;
    case "6M":
      return `${mon(new Date(t.getFullYear(), t.getMonth() - 5, 1))} - ${mon(t)} ${t.getFullYear()}`;
    case "Y":
      return String(t.getFullYear());
  }
}
