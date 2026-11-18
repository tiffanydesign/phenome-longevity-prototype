import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BlurLayers, useGo, V2Screen } from "../ui/shell";
import { Chevron } from "../ui/icons";
import { GoalSheet, useGoals } from "../metric/goals";
import { ABOUT, fmt, MACROS, SLOTS, TARGET } from "./data";
import { dayKey, dayOffset, dayTotals, useMeals } from "./store";
import { leftOf, MealCard, NutrientMark, Ring } from "./parts";
import { DaySlides } from "./slides";
import { Ph } from "./icons";
import { DayPace } from "./charts";
import { History } from "./history";
import { LongevityAnalysis } from "./analysis";
import { useSaved } from "./SavedScreen";
import { AddSheet } from "./AddSheet";
import { veilOnScroll } from "../devices/veil";
import "../metric/metric.css";
import "./food.css";
import "./food-glass.css";

/*
 * Nutrition, in the order a member asks: how much is left today, which
 * nutrients still need filling, what have I eaten, what it adds up to over
 * time, and how the days compare. White grouped cards on the page ground,
 * each opened by a label in its own hue; adding food is one round button away.
 */
export function FoodScreen() {
  const go = useGo();
  const nav = useNavigate();
  const meals = useMeals();
  const saved = useSaved();
  const goals = useGoals();
  const goal = goals.get("diet") ?? TARGET.kcal;
  const [day, setDay] = useState(() => dayKey(new Date()));
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [about, setAbout] = useState<number | null>(null);

  const isToday = day === dayKey(new Date());
  const t = useMemo(() => dayTotals(meals, day), [meals, day]);
  const list = useMemo(() => meals.filter((m) => m.day === day).sort((a, b) => a.at - b.at), [meals, day]);
  const l = leftOf(t.kcal, goal);
  const missing = SLOTS.filter((s) => !list.some((m) => m.slot === s.id));
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => dayOffset(i - 6)), []);
  const dayName = isToday ? "Today" : new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
  // the one nutrient furthest behind, named in the hero's sentence
  const behind = MACROS.map((id) => ({ id, share: t[id] / TARGET[id] })).sort((a, b) => a.share - b.share)[0];
  const say = !list.length
    ? "Nothing logged yet. Snap your plate and the numbers fill in on their own."
    : l.over
      ? `Over your goal for ${isToday ? "today" : "this day"}. Lighter choices for the rest of the day keep the week on track.`
      : behind.share < 0.6
        ? `On track for energy. ${behind.id === "protein" ? "Protein is" : behind.id === "carbs" ? "Carbs are" : "Fat is"} furthest behind, ${fmt(TARGET[behind.id] - t[behind.id])} g to go.`
        : "On track for energy, and every macro is well on its way.";

  return (
    <V2Screen nav={false}>
      <div className="v2-veil mx-veil dv-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="mx fd scroll" data-field="food" onScroll={veilOnScroll}>
        {/* back, the page name beside it, the day's energy goal at the right */}
        <header className="fd-top">
          <button className="mx-round" aria-label="Back" onClick={() => nav(-1)}>
            <Chevron dir="left" size={22} />
          </button>
          <h1>Nutrition</h1>
          <button className="fd-goal-pill" aria-label={`Daily energy goal ${fmt(goal)} kcal, edit`} onClick={() => setEditing(true)}>
            <NutrientMark id="kcal" size={16} />
            {fmt(goal)}
            <small>kcal</small>
          </button>
        </header>

        {/* the last seven days on one glass track: the weekday inside a fine
            dashed ring that fills as the day fills, the date under it */}
        <nav className="fd-week" aria-label="Choose a day">
          {week.map((d) => {
            const k = dayKey(d);
            const dt = dayTotals(meals, k);
            const sel = k === day;
            const over = dt.kcal > goal;
            return (
              <button
                key={k}
                aria-pressed={sel}
                aria-label={`${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}, ${fmt(dt.kcal)} kcal`}
                data-today={k === dayKey(new Date()) ? "" : undefined}
                onClick={() => setDay(k)}
              >
                <Ring value={dt.kcal / goal} size={36} stroke={2.2} hue={over ? "var(--fd-over)" : "var(--v-accent)"} dashed>
                  <span className="fd-week-d">{d.toLocaleDateString("en-GB", { weekday: "narrow" })}</span>
                </Ring>
                <b className="fd-week-n">{d.getDate()}</b>
              </button>
            );
          })}
        </nav>

        {/* 1 · the day at a glance, swiped: energy and macros, the diet score
            with fibre and minerals, then movement */}
        <DaySlides
          t={t}
          goal={goal}
          onOpen={(path) => go(path)}
          hero={
            <section className="fd-hero" aria-label={`${dayName}: ${fmt(l.n)} kcal ${l.word}`}>
              <p className="fd-label">
                <NutrientMark id="kcal" size={16} />
                Energy
                <span>{dayName}</span>
              </p>
              <div className="fd-hero-row">
                <div>
                  <b className="fd-hero-n">{fmt(l.n)}</b>
                  <span className="fd-hero-w">Calories {l.word}</span>
                  <span className="fd-hero-s">
                    {fmt(t.kcal)} of {fmt(goal)} eaten
                  </span>
                </div>
                <Ring value={t.kcal / goal} size={112} stroke={11} hue={l.over ? "var(--fd-over)" : "var(--mid)"}>
                  <span className="fd-core fd-core-lg">
                    <NutrientMark id="kcal" size={22} />
                  </span>
                </Ring>
              </div>
              <p className="fd-hero-say">{say}</p>
            </section>
          }
        />

        {/* 3 · what was eaten, in the order it was eaten */}
        <section className="fd-sec fd-sec-meals">
          <div className="fd-h-row">
            <h2>{isToday ? "Today's meals" : "Meals"}</h2>
            <button className="fd-saved" aria-label={`Saved meals, ${saved.length}`} onClick={() => go("/v3/food/saved")}>
              <Ph name="bookmark" size={18} />
            </button>
          </div>
          {list.length === 0 ? (
            <button className="fd-empty" onClick={() => setAdding(true)}>
              <b>Nothing logged{isToday ? " yet" : " this day"}</b>
              <span>Snap your plate and the nutrients fill in on their own.</span>
            </button>
          ) : (
            <div className="fd-list">
              {list.map((m) => (
                <MealCard key={m.id} m={m} onOpen={(el) => go(`/v3/food/meal/${m.id}`, { from: el })} />
              ))}
            </div>
          )}
          {missing.length > 0 && (
            <div className="fd-slots">
              {missing.map((s) => (
                <button key={s.id} onClick={() => go(`/v3/food/add?slot=${s.id}&day=${day}`)}>
                  <Ph name="plus" size={14} />
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 4 · what the week means for the long run */}
        <section className="fd-sec">
          <div className="fd-h-row">
            <h2>Longevity analysis</h2>
            <span className="fd-h-note">Last 7 days</span>
          </div>
          <LongevityAnalysis meals={meals} goal={goal} />
        </section>

        {/* 5 · today against yesterday, as it adds up */}
        {isToday && (
          <section className="fd-sec">
            <div className="fd-h-row">
              <h2>Today vs yesterday</h2>
            </div>
            <div className="mx-card fd-card">
              <DayPace meals={meals} goal={goal} />
            </div>
          </section>
        )}

        {/* 6 · day, week, month, six months, year */}
        <section className="fd-sec">
          <div className="fd-h-row">
            <h2>History</h2>
          </div>
          <History meals={meals} goal={goal} />
        </section>

        <section className="fd-sec">
          <div className="fd-h-row">
            <h2>About nutrition</h2>
          </div>
          <div className="mx-card fd-acc">
            {ABOUT.map((a, i) => (
              <div key={a.title} data-open={about === i ? "" : undefined}>
                <button aria-expanded={about === i} onClick={() => setAbout(about === i ? null : i)}>
                  {a.title}
                  <Ph name="plus" size={14} />
                </button>
                <p>{a.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* one round way to add food, always in reach */}
      <button className="fd-fab" aria-label="Add food" onClick={() => setAdding(true)}>
        <Ph name="plus" size={22} />
      </button>
      {adding && <AddSheet day={day} onClose={() => setAdding(false)} />}
      {editing && <GoalSheet id="diet" current={goals.get("diet")} onSave={(v) => goals.set("diet", v)} onClose={() => setEditing(false)} />}
    </V2Screen>
  );
}
