import { useNavigate } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { sportById } from "@/data/journal";
import { activityKcal, useActivities } from "@/data/journal-store";
import { JHeader, PeriodBar, usePeriod } from "../shared/parts";
import { fmtDuration } from "./format";
import "./activity.css";

/** Activity log — capture: journal_activity/top (empty), journal_activity/after_log. */
export function ActivityList() {
  const nav = useNavigate();
  const p = usePeriod();
  const all = useActivities();
  const today = new Date().toDateString();
  const items = p.isToday ? all.filter((a) => new Date(a.start).toDateString() === today) : [];

  return (
    <Screen
      header={
        <>
          <JHeader
            kind="activity"
            title="Activity"
            onBack={() => nav("/home")}
            right={
              <button className="jr-icon-btn" aria-label="Add activity" onClick={() => nav("/journal/activity/select")}>
                <AddCircle />
              </button>
            }
          />
          <PeriodBar kind="activity" period={p.period} onPeriod={p.setPeriod} offset={p.offset} onOffset={p.setOffset} />
        </>
      }
    >
      <div className="act-list">
        {items.length === 0 ? (
          <p className="act-empty">No activities logged for this period</p>
        ) : (
          items.map((a) => {
            const s = sportById(a.sportId);
            return (
              <button key={a.id} className="act-card" onClick={() => nav(`/journal/activity/entry/${a.id}`)}>
                <Icon name={s.icon} size={26} className="act-card-icon" />
                <span className="act-card-name">{s.name}</span>
                <span className="act-card-stats">
                  <span>Duration</span>
                  <b>{fmtDuration(a.seconds)}</b>
                  <span>Calories</span>
                  <b>{activityKcal(a.seconds)} kcal</b>
                </span>
              </button>
            );
          })
        )}
      </div>
    </Screen>
  );
}

/** Heavy ⊕ in the Activity nav bar (thicker than the shared PlusCircle). */
function AddCircle() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9.6" stroke="currentColor" strokeWidth="2.3" />
      <path d="M11 6.2v9.6M6.2 11h9.6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}
