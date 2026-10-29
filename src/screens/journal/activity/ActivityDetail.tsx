import { useParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { sportById } from "@/data/journal";
import { activityKcal, useActivities } from "@/data/journal-store";
import { JHeader, fmtHM, fmtLongDay } from "../shared/parts";
import { Stat } from "./ActivityForm";
import { fmtDuration } from "./format";
import "./activity.css";

/** Logged workout — capture: activity_detail/top. */
export function ActivityDetail() {
  const { id } = useParams();
  const list = useActivities();
  // Deep link without a matching entry (index / tests): show the captured Running workout.
  const a = list.find((x) => x.id === id) ?? list[list.length - 1] ?? { id: "x", sportId: "running", start: Date.now() - 24_000, seconds: 24 };
  const sport = sportById(a.sportId);
  const start = new Date(a.start);
  const end = new Date(a.start + a.seconds * 1000);
  const kcal = `${activityKcal(a.seconds)} kcal`;

  return (
    <Screen header={<JHeader kind="activity" title="Activity" />}>
      <div className="act-detail">
        <div className="act-detail-head">
          <span className="act-detail-badge">
            <Icon name={sport.icon} size={24} />
          </span>
          <h2 className="act-detail-name">{sport.name}</h2>
        </div>

        {/* TODO(fidelity): heart-rate chart for a workout with HR data was never captured */}
        <section className="act-box act-hr">No heart rate data available</section>

        <section className="act-box act-box-dtime">
          <h3 className="act-box-title">Workout Time</h3>
          <Stat label="Date" value={fmtLongDay(start)} />
          <div className="act-cols act-cols-3">
            <Stat label="Start Time" value={fmtHM(start)} />
            <Stat label="End Time" value={fmtHM(end)} />
            <Stat label="Duration" value={fmtDuration(a.seconds)} />
          </div>
        </section>

        <section className="act-box act-box-dkcal">
          <h3 className="act-box-title">Calories Burned</h3>
          <div className="act-cols act-cols-2">
            <Stat label="Active Kilocalories" value={kcal} />
            <Stat label="Total Kilocalories" value={kcal} />
          </div>
        </section>
      </div>
    </Screen>
  );
}
