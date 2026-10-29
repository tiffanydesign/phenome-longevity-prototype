import { useNavigate } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { PlusCircle } from "@/components/Controls";
import { ChevronRight } from "@/components/NavHeader";
import { CALORIE_GOAL, DIET_COPY, MEALS } from "@/data/journal";
import { foodById, mealTotals, useMeals, type LoggedMeal } from "@/data/journal-store";
import { CopySection, GoalBlock, JHeader, MacroTiles, NutrientBars, PeriodBar, WeekStrip, fmtNum, usePeriod } from "../shared/parts";
import { macroTiles, nutrientRows } from "./nutrients";
import { DayChart } from "./DayChart";
import "./diet.css";

/** Diet Tracker — capture: journal_diet/top, scroll_1…scroll_4, journal_diet/after_add. */
export function DietScreen() {
  const nav = useNavigate();
  const p = usePeriod();
  const all = useMeals();
  const today = new Date().toDateString();
  const meals = p.isToday ? all.filter((m) => new Date(m.at).toDateString() === today) : [];
  const t = mealTotals(meals);
  const kcal = Math.round(t.kcal);
  const pct = Math.round((kcal / CALORIE_GOAL) * 100);
  const todayIdx = (new Date().getDay() + 6) % 7;
  const tracked = Array.from({ length: 7 }, (_, i) => i === todayIdx && meals.length > 0);

  return (
    <Screen
      statusTone="light"
      header={
        <>
          <JHeader title="Diet Tracker" onBack={() => nav("/home")} />
          <PeriodBar kind="tracker" period={p.period} onPeriod={p.setPeriod} offset={p.offset} onOffset={p.setOffset} />
        </>
      }
      bodyClassName="jr-tracker-body"
    >
      <GoalBlock
        eyebrow="CALORIES INTAKE"
        value={fmtNum(kcal)}
        goal={`/${fmtNum(CALORIE_GOAL)} kcal`}
        color="var(--c-calories)"
        pct={pct}
        message={`You have reached ${pct}% of your daily goal`}
        editable
      />
      <p className="jr-intro">{DIET_COPY.intro}</p>
      <div className="diet-macros">
        <MacroTiles items={macroTiles(t)} />
      </div>

      <h3 className="jr-h3 diet-logh">Log Meals</h3>
      <div className="diet-meals">
        {MEALS.map((m) => (
          <MealCard
            key={m.id}
            name={m.name}
            items={meals.filter((x) => x.meal === m.id)}
            onAdd={() => nav(`/journal/diet/add/${m.id}`)}
            onOpen={() => nav(`/journal/diet/meal/${m.id}`)}
          />
        ))}
      </div>

      <div className="diet-week">
        <WeekStrip title="Diet Tracker" filled={tracked} accent="var(--c-calories)" />
      </div>
      <div className="diet-nutr">
        <NutrientBars title="Today's Total Nutrients" rows={nutrientRows(t)} />
      </div>

      <h3 className="jr-h3 diet-tvy">Today vs Yesterday</h3>
      <div className="diet-tvy-row">
        {/* TODO(fidelity): the glyph after "kcal" renders as mojibake (U+FFFD in XML); drawn as a small dot like the capture */}
        <TvyCol label="Today" value={fmtNum(kcal)} />
        <TvyCol label="Yesterday" value="0" />
      </div>
      <section className="diet-analysis">
        <h4>Longevity Analysis</h4>
        <p>{DIET_COPY.noCompare}</p>
      </section>
      <DayChart meals={meals} />

      <div className="diet-copy">
        {DIET_COPY.sections.map((s) => (
          <CopySection key={s.title} title={s.title} body={s.body} />
        ))}
      </div>
    </Screen>
  );
}

function TvyCol({ label, value }: { label: string; value: string }) {
  return (
    <div className="diet-tvy-col">
      <span className="diet-tvy-label">{label}</span>
      <span className="diet-tvy-val">
        <b>{value}</b>
        <span>&nbsp;kcal&nbsp;</span>
        <i aria-hidden>•</i>
      </span>
    </div>
  );
}

/** Breakfast / Lunch / Dinner / Snacks gradient card; expands into item rows once something is logged. */
function MealCard({ name, items, onAdd, onOpen }: { name: string; items: LoggedMeal[]; onAdd: () => void; onOpen: () => void }) {
  const kcal = Math.round(mealTotals(items).kcal);
  if (items.length === 0) {
    return (
      <button className="diet-meal" onClick={onAdd}>
        <span className="diet-meal-text">
          <span className="diet-meal-name">{name}</span>
          <span className="diet-meal-kcal">
            <b>0</b> kcal
          </span>
        </span>
        <PlusCircle size={22} />
      </button>
    );
  }
  return (
    <button className="diet-meal diet-meal-full" onClick={onOpen}>
      <span className="diet-meal-head">
        <span className="diet-meal-name">{name}</span>
        <span className="diet-meal-kcal">
          <b>{kcal}</b> kcal
        </span>
        <ChevronRight size={20} />
      </span>
      {items.map((m) => {
        const f = foodById(m.foodId);
        return (
          <span key={m.id} className="diet-meal-item">
            <span className="diet-meal-item-text">
              <span className="diet-meal-item-name">{f.name}</span>
              <span className="diet-meal-item-desc">{f.desc}</span>
            </span>
            <span className="diet-meal-item-kcal">{Math.round((f.kcal * m.grams) / 100)} kcal</span>
          </span>
        );
      })}
    </button>
  );
}
