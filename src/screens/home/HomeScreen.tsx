import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { Ring } from "@/components/Charts";
import { ChevronLeft, ChevronRight } from "@/components/NavHeader";
import { PlusCircle } from "@/components/Controls";
import { useDataset } from "@/lib/data";
import { usePrefs } from "@/lib/prefs";
import { homeData, type HomeData, type MonitorMetric } from "@/data/home";
import { CAPTURE_TODAY, DEFAULT_DAY, addDays, monitorRows, num, realDay, ringLabel } from "@/data/real";
import { useJournalSummary } from "@/data/journal-store";
import "./HomeScreen.css";

/** Home tab — capture: home/top, home/scroll_1…4, home/date_prev, home/journal_with_data. */
export function HomeScreen() {
  const base = useDataset(homeData);
  const real = usePrefs().data === "real";
  // real: the synced account, opened on the last full day the ring synced (see data/real)
  const [day, setDay] = useState(() => (real ? DEFAULT_DAY : new Date()));
  const today = real ? CAPTURE_TODAY : new Date();
  const d = real ? dayData(base, day) : base;
  const nav = useNavigate();
  // after any logged meal / habit the Diet & Habits cards become progress cards (capture home/journal_with_data)
  const journal = useJournalSummary() ?? d.journal;

  return (
    <Screen tabs statusTone="light" header={<HomeLogo />}>
      <div className="home">
        <button className="home-device" onClick={() => nav("/home/add-device")}>
          <span>
            Add a <b>Phenome</b>Tech Device
          </span>
          <PlusCircle size={28} />
        </button>

        <DateStrip day={day} today={today} onChange={setDay} />

        <div className="home-rings">
          <RingTile label="Sleep" color="var(--c-sleep)" value={d.sleepHours} goal={d.sleepGoal} text={d.ringText?.sleep} onClick={() => nav("/home/monitor/sleep")} />
          <RingTile label="Calories" unit="kcal" color="var(--c-calories)" value={d.calories} goal={d.caloriesGoal} text={d.ringText?.calories} onClick={() => nav("/home/monitor/calories")} />
          <RingTile label="Steps" color="var(--c-steps)" value={d.steps} goal={d.stepsGoal} text={d.ringText?.steps} onClick={() => nav("/home/monitor/steps")} />
        </div>

        <button className="home-capacity" onClick={() => nav("/home/capacity")}>
          <Ring size={99} stroke={10} value={d.capacity / 100} color="#ffffff" track="rgba(255,255,255,0.75)">
            <span className="home-capacity-num">{d.capacity}</span>
          </Ring>
          <span className="home-capacity-text">
            <span className="home-capacity-title">Capacity</span>
            <span className="home-capacity-sub">{d.capacityText ?? "Check your daily recovery score."}</span>
          </span>
          <ChevronRight size={26} />
        </button>

        <h2 className="home-h2">Health Journal</h2>
        <button className="home-journal home-journal-activity" onClick={() => nav("/journal/activity")}>
          <span className="home-journal-title">Activity</span>
          <span className="home-journal-sub">Stay active to support your daily capacity</span>
          <span className="home-journal-plus">
            <PlusCircle size={32} />
          </span>
        </button>
        {journal ? (
          <>
            <button className="home-journal home-journal-wide home-journal-diet" onClick={() => nav("/journal/diet")}>
              <span className="home-journal-title">Diet</span>
              <span className="home-journal-sub">
                {journal.dietKcal.toLocaleString("en-GB")} / {journal.dietGoal.toLocaleString("en-GB")} kcal
              </span>
              <ChevronRight size={22} />
            </button>
            <button className="home-journal home-journal-wide home-journal-habits" onClick={() => nav("/journal/habits")}>
              <span className="home-journal-title">Habits</span>
              <span className="home-journal-sub">{journal.habitsPct}% Complete</span>
              <ChevronRight size={22} />
            </button>
          </>
        ) : (
          <div className="home-journal-grid">
            <button className="home-journal home-journal-diet" onClick={() => nav("/journal/diet")}>
              <span className="home-journal-head">
                <span className="home-journal-title">Diet</span>
                <ChevronRight size={20} />
              </span>
              <span className="home-journal-sub">Log your meals to track your nutrition</span>
            </button>
            <button className="home-journal home-journal-habits" onClick={() => nav("/journal/habits")}>
              <span className="home-journal-head">
                <span className="home-journal-title">Habits</span>
                <ChevronRight size={20} />
              </span>
              <span className="home-journal-sub">Build simple habits that supports.</span>
            </button>
          </div>
        )}

        <h2 className="home-h2">Your Health Monitor</h2>
        <div className="home-monitor">
          {d.monitor.map((m) => (
            <MonitorRow key={m.id} m={m} onClick={() => nav(`/home/monitor/${m.id}`)} />
          ))}
        </div>

        <h2 className="home-h2">Discover</h2>
        <div className="home-discover">
          <div className="home-disc home-disc-consult" role="button" onClick={() => nav("/discover/consultations")}>
            <span className="home-disc-title">Your Consultations</span>
            <span className="home-disc-sub">Manage and book your sessions here!</span>
            <button
              className="home-book"
              onClick={(e) => {
                e.stopPropagation();
                nav("/discover/booking");
              }}
            >
              <PlusCircle size={22} /> Book
            </button>
          </div>
          <button className="home-disc home-disc-games" onClick={() => nav("/discover/games")}>
            <span className="home-disc-title">Your Games</span>
            <span className="home-disc-sub">Boost your cognitive skills.</span>
            <ChevronRight size={26} />
          </button>
          {/* Disabled in the app (non-clickable, greyed) — capture home/scroll_4 */}
          <div className="home-disc home-disc-off">
            <span className="home-disc-title">Personalised Supplements</span>
            <span className="home-disc-sub">Take a short quiz to find what supports your needs</span>
          </div>
          <div className="home-disc home-disc-off">
            <span className="home-disc-title">
              Your Continuous
              <br />
              Glucose Monitoring
            </span>
            <span className="home-disc-sub">Coming Soon!</span>
          </div>
        </div>
      </div>
    </Screen>
  );
}

function HomeLogo() {
  return (
    <div className="home-logo">
      <Icon name="PL_Logo" size={36} style={{ height: 24, color: "var(--c-navy)" }} />
    </div>
  );
}

/** "‹  Tue, 27   TODAY   Thu, 29  ›" — future dates are disabled (capture home/date_prev). */
function DateStrip({ day, today, onChange }: { day: Date; today: Date; onChange: (d: Date) => void }) {
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const label = (d: Date) => (same(d, today) ? "TODAY" : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }).replace(" ", ", "));
  const atToday = day >= today || same(day, today);
  const prev = () => onChange(addDays(day, -1));
  const next = () => !atToday && onChange(addDays(day, 1));
  return (
    <div className="home-dates">
      <button className="home-dates-arrow" onClick={prev} aria-label="Previous day">
        <ChevronLeft size={22} />
      </button>
      <button className="home-date" onClick={prev}>
        {label(addDays(day, -1))}
      </button>
      <span className="home-date home-date-on">{label(day)}</span>
      <button className="home-date" disabled={atToday} onClick={next}>
        {label(addDays(day, 1))}
      </button>
      <button className="home-dates-arrow" disabled={atToday} onClick={next} aria-label="Next day">
        <ChevronRight size={22} />
      </button>
    </div>
  );
}

/** One day of the synced account on top of the empty capture (rings, Capacity, monitor rows). */
function dayData(base: HomeData, day: Date): HomeData {
  const r = realDay(day);
  if (!r) return base;
  const steps = num(r.monitor.steps) ?? r.steps ?? 0;
  const kcal = num(r.monitor.calories) ?? r.calories ?? 0;
  return {
    ...base,
    // the synced app's Sleep ring shows the sleep score out of 100
    sleepHours: r.sleep ?? 0,
    sleepGoal: 100,
    calories: kcal,
    steps,
    capacity: r.capacity ?? 0,
    capacityText: r.capacityText || undefined,
    ringText: { sleep: ringLabel(r.sleep ?? 0), calories: ringLabel(kcal), steps: ringLabel(steps) },
    monitor: monitorRows(base.monitor, r),
  };
}

function RingTile({ label, unit, color, value, goal, text, onClick }: { label: string; unit?: string; color: string; value: number; goal: number; text?: string; onClick: () => void }) {
  return (
    <button className="home-ring" onClick={onClick}>
      <Ring size={89} stroke={8} value={value / goal} color={color}>
        <span className="home-ring-val" style={{ color }} data-unit={unit ? "" : undefined}>
          {text ?? (Number.isInteger(value) ? value.toLocaleString("en-GB") : value.toFixed(1))}
          {unit && <small>{unit}</small>}
        </span>
      </Ring>
      <span className="home-ring-label">
        {label} <ChevronRight size={14} />
      </span>
    </button>
  );
}

function MonitorRow({ m, onClick }: { m: MonitorMetric; onClick: () => void }) {
  const num = (s: string) => parseFloat(s.replace(/[,:]/g, (c) => (c === ":" ? "." : "")));
  const v = num(m.value);
  // no trend arrow while the value is empty ("--"), as in capture home/scroll_4
  const hasTrend = m.goal !== undefined && !Number.isNaN(v);
  const below = hasTrend && v < num(m.goal!);
  return (
    <button className="home-mon" onClick={onClick}>
      <Icon name={m.icon} size={24} className="home-mon-icon" />
      <span className="home-mon-label">{m.label}</span>
      <span className="home-mon-val" data-goal={m.goal ? "" : undefined}>
        <span>
          <b>{m.value}</b>
          {m.unit && <span className="home-mon-unit">{m.unit}</span>}
        </span>
        {m.goal && <span className="home-mon-goal">{m.goal}</span>}
      </span>
      {hasTrend && <span className={below ? "home-mon-tri" : "home-mon-tri home-mon-tri-up"} aria-hidden />}
    </button>
  );
}
