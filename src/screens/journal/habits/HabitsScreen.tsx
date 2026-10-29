import { useNavigate } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { ChevronRight } from "@/components/NavHeader";
import { HABITS_COPY } from "@/data/journal";
import { useHabits } from "@/data/journal-store";
import { GoalBlock, JHeader, PeriodBar, WeekStrip, usePeriod } from "../shared/parts";
import { CheckCircle } from "../shared/icons";
import "./habits.css";

const BLUE = "#56bde4"; /* capture: journal_habits/top "/3 completed" */

/** Habits — capture: journal_habits/top, scroll_1, after_complete, after_add. */
export function HabitsScreen() {
  const nav = useNavigate();
  const p = usePeriod();
  const { habits, completed } = useHabits();
  const done = p.isToday ? habits.filter((h) => completed.has(h.id)).length : 0;
  const total = habits.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  // App quirk (recordings/flow_habit_complete.mp4): completing today's habit fills the *Monday* dot.
  // TODO(fidelity): reproduced as captured — likely a week-index bug in the app.
  const week = Array.from({ length: 7 }, (_, i) => i === 0 && done > 0);

  return (
    <Screen
      statusTone="light"
      header={
        <>
          <JHeader title="Habits" onBack={() => nav("/home")} />
          <PeriodBar kind="tracker" period={p.period} onPeriod={p.setPeriod} offset={p.offset} onOffset={p.setOffset} />
        </>
      }
      bodyClassName="jr-tracker-body hb-body"
    >
      <GoalBlock
        eyebrow="HABITS"
        value={done}
        goal={`/${total} completed`}
        color={BLUE}
        pct={pct}
        message={`You have reached ${pct}% of your goal.`}
      />
      <p className="jr-intro">{HABITS_COPY}</p>

      <div className="hb-addrow">
        <h3 className="jr-h3">Add Habits</h3>
        <button className="hb-new" onClick={() => nav("/journal/habits/new")}>
          Add New Habit
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.8" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 4.8v6.4M4.8 8h6.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="hb-list">
        {habits.map((h) => (
          <button key={h.id} className="hb-row" onClick={() => nav(`/journal/habits/${h.id}`)}>
            <CheckCircle size={25} checked={p.isToday && completed.has(h.id)} />
            <span className="hb-row-name">{h.name}</span>
            <ChevronRight size={22} />
          </button>
        ))}
      </div>

      <div className="hb-week">
        <WeekStrip title="Habits" filled={week} accent={BLUE} />
      </div>

      <h3 className="jr-h3 hb-tvy">Today vs Yesterday</h3>
      <div className="hb-tvy-row">
        <TvyCol label="Today" value={`${done} /${total}`} />
        <TvyCol label="Yesterday" value={`0 /${total}`} />
      </div>
      <section className="hb-legend">
        <div className="hb-legend-keys">
          <span className="hb-key hb-key-today" />
          <span>Today</span>
          <span className="hb-key hb-key-yday" />
          <span>Yesterday</span>
        </div>
        <div className="jr-bar hb-legend-bar">
          <span style={{ width: `${pct}%`, background: BLUE }} />
        </div>
      </section>
    </Screen>
  );
}

function TvyCol({ label, value }: { label: string; value: string }) {
  return (
    <div className="hb-tvy-col">
      <span className="hb-tvy-label">{label}</span>
      {/* TODO(fidelity): trailing glyph is mojibake (U+FFFD in XML) — drawn as a dot like the capture */}
      <span className="hb-tvy-val">
        {value}
        <i aria-hidden>.</i>
      </span>
    </div>
  );
}
