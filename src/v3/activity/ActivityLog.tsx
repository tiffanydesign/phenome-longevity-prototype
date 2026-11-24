import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { sportById } from "@/data/journal";
import { activityKcal, useActivities } from "@/data/journal-store";
import { useGo } from "../ui/shell";
import { Chevron } from "../ui/icons";
import { Empty, Group, PrimaryButton, SubPage } from "../profile/kit";
import { TRAINING_GOAL_MIN, WORKOUTS } from "../metric/activityData";
import "./activity-log.css";

/*
 * Every session in one list, newest first: what the band recorded and what
 * the member logged by hand side by side. Today opens with its totals
 * against the daily goal, the same numbers as the Home Activity card.
 */

const GOAL_MIN = TRAINING_GOAL_MIN;

interface Session {
  key: string;
  name: string;
  icon: string;
  when: string;
  min: number;
  kcal: number;
  source: string;
  to: string;
  at: number;
}

const clock = (ms: number) => new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const dayLabel = (ms: number) => {
  const d = new Date(ms);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
};
const atToday = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

export function ActivityLog() {
  const nav = useNavigate();
  const go = useGo();
  const logged = useActivities();

  const sessions = useMemo<Session[]>(() => {
    const band: Session[] = WORKOUTS.map((w) => ({
      key: w.id,
      name: w.name,
      icon: w.kind === "strength" ? "barbells_02" : "walk",
      when: `${w.start}–${w.end}`,
      min: w.min,
      kcal: w.kcal,
      source: w.source,
      to: `/v3/workout/${w.id}`,
      at: atToday(w.start),
    }));
    const hand: Session[] = logged.map((a) => {
      const s = sportById(a.sportId);
      return {
        key: a.id,
        name: s.name,
        icon: s.icon,
        when: clock(a.start),
        min: Math.max(1, Math.round(a.seconds / 60)),
        kcal: activityKcal(a.seconds),
        source: "Logged by you",
        to: `/journal/activity/entry/${a.id}`,
        at: a.start,
      };
    });
    return [...band, ...hand].filter((s) => s.at <= Date.now()).sort((a, b) => b.at - a.at);
  }, [logged]);

  const days = useMemo(() => {
    const by = new Map<string, Session[]>();
    sessions.forEach((s) => {
      const k = dayLabel(s.at);
      by.set(k, [...(by.get(k) ?? []), s]);
    });
    return [...by.entries()];
  }, [sessions]);

  const today = days.find(([k]) => k === "Today")?.[1] ?? [];
  const min = today.reduce((n, s) => n + s.min, 0);
  const kcal = today.reduce((n, s) => n + s.kcal, 0);
  const share = Math.min(1, min / GOAL_MIN);

  const add = (
    <button className="pf-round" aria-label="Log an activity" onClick={() => nav("/journal/activity/select")}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );

  return (
    <SubPage title="Activity" lead="Workouts from your band and the ones you log yourself, newest first." right={add}>
      <section className="al-today" data-field="rose" aria-label={`Today: ${min} of ${GOAL_MIN} minutes, ${kcal} kcal`}>
        <div className="al-today-top">
          <span className="al-today-k">Today</span>
          <span className="al-today-g">Goal {GOAL_MIN} min</span>
        </div>
        <div className="al-today-row">
          <span>
            <b>{min}</b>
            <u>min</u>
          </span>
          <span>
            <b>{kcal}</b>
            <u>kcal</u>
          </span>
          <span>
            <b>{today.length}</b>
            <u>{today.length === 1 ? "session" : "sessions"}</u>
          </span>
        </div>
        <span className="al-bar" aria-hidden>
          <i style={{ width: `${share * 100}%` }} />
        </span>
        <p className="al-today-say">{min >= GOAL_MIN ? "Daily goal reached. Anything more is a bonus." : `${GOAL_MIN - min} min to your daily goal. A brisk walk counts.`}</p>
      </section>

      {sessions.length === 0 ? (
        <Empty title="Nothing logged yet" line="Workouts from your band show up here on their own. Add anything else by hand.">
          <PrimaryButton onClick={() => nav("/journal/activity/select")}>Log an activity</PrimaryButton>
        </Empty>
      ) : (
        days.map(([k, list]) => (
          <Group key={k} title={k}>
            <div className="dv-group al-group">
              {list.map((s) => (
                <button key={s.key} className="al-row al-session" data-field="rose" onClick={(e) => go(s.to, { from: e.currentTarget })}>
                  <span className="al-disc" aria-hidden>
                    <Icon name={s.icon} size={22} />
                  </span>
                  <span className="al-session-t">
                    <b>{s.name}</b>
                    <small>
                      {s.when} · {s.source}
                    </small>
                  </span>
                  <span className="al-session-v">
                    <b>
                      {s.min} <u>min</u>
                    </b>
                    <small>{s.kcal} kcal</small>
                  </span>
                  <Chevron size={14} />
                </button>
              ))}
            </div>
          </Group>
        ))
      )}
    </SubPage>
  );
}
