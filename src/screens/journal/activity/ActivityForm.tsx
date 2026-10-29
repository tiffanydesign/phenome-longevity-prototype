import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/Controls";
import { sportById } from "@/data/journal";
import { activityKcal, journalActions, useRunning } from "@/data/journal-store";
import { JHeader, fmtHM } from "../shared/parts";
import { ChevronDown } from "../shared/icons";
import { popOr } from "../shared/nav";
import { fmtDurationSpaced } from "./format";
import "./activity.css";

/** Live workout — capture: activity_form/top (idle), activity_form/running (timer counting). */
export function ActivityForm() {
  const { type = "running" } = useParams();
  const nav = useNavigate();
  const sport = sportById(type);
  const running = useRunning();
  const live = running && running.sportId === sport.id ? running : null;
  const now = useTick(!!live);
  const secs = live ? Math.max(0, Math.floor((now - live.start) / 1000)) : 0;

  const stop = () => {
    journalActions.stopActivity();
    popOr(nav, "/journal/activity");
  };

  return (
    <Screen
      header={
        <JHeader
          kind="activity"
          icon="close"
          title="Activity"
          onBack={() => {
            // TODO(fidelity): closing during a live workout was not captured (confirm dialog?) — discards it.
            journalActions.cancelActivity();
            popOr(nav, "/journal/activity");
          }}
        />
      }
      footer={
        <Button tone="black" className="act-cta" onClick={live ? stop : () => journalActions.startActivity(sport.id)}>
          {live ? "STOP ACTIVITY" : "START ACTIVITY"}
        </Button>
      }
    >
      <div className="act-form">
        <button className="act-picker" onClick={() => nav("/journal/activity/select", { replace: true })} disabled={!!live}>
          <Icon name={sport.icon} size={24} className="act-picker-icon" />
          <span className="act-picker-name">{sport.name}</span>
          <ChevronDown size={20} />
        </button>

        <section className="act-box act-box-time">
          <h3 className="act-box-title">Workout Time</h3>
          <div className="act-cols act-cols-3">
            <Stat label="Start Time" value={live ? fmtHM(new Date(live.start), " : ") : "-- : --"} />
            <Stat label="End Time" value="-- : --" />
            <Stat label="Duration" value={fmtDurationSpaced(secs)} />
          </div>
        </section>

        <section className="act-box act-box-kcal">
          <h3 className="act-box-title">Calories Burned</h3>
          <div className="act-cols act-cols-2">
            {/* TODO(fidelity): active vs total kcal identical in every capture — same value used for both. */}
            <Stat label="Active Kilocalories" value={live ? `${activityKcal(secs)} kcal` : "-- kcal"} />
            <Stat label="Total Kilocalories" value={live ? `${activityKcal(secs)} kcal` : "-- kcal"} />
          </div>
        </section>
      </div>
    </Screen>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="act-stat">
      <span className="act-stat-label">{label}</span>
      <span className="act-stat-val">{value}</span>
    </div>
  );
}

function useTick(on: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [on]);
  return now;
}
