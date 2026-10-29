import { useNavigate, useParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { MEALS } from "@/data/journal";
import { foodById, mealTotals, useMeals } from "@/data/journal-store";
import { JHeader, MacroTiles, NutrientBars } from "../shared/parts";
import { ArrowRight } from "../shared/icons";
import { MealTitle } from "./MealParts";
import { macroTiles, nutrientRows } from "./nutrients";
import "./meal.css";

/** Logged meal overview — capture: meal_summary/top, meal_summary/scroll_1. */
export function MealSummary() {
  const { meal = "breakfast" } = useParams();
  const nav = useNavigate();
  const m = MEALS.find((x) => x.id === meal) ?? MEALS[0];
  const today = new Date().toDateString();
  const items = useMeals().filter((x) => x.meal === m.id && new Date(x.at).toDateString() === today);
  const t = mealTotals(items);
  // TODO(fidelity): stamp shows when the meal slot was opened (14:48) in the capture; first item time used here.
  const at = items.length ? new Date(items[0].at) : new Date();

  return (
    <Screen statusTone="light" header={<JHeader kind="meal" title={m.name} />} bodyClassName="ml-body">
      <div className="ml">
        <MealTitle name={m.name} at={at} />
        {items.map((x) => {
          const f = foodById(x.foodId);
          return (
            // TODO(fidelity): tapping a logged item (→) was not captured; opens Add with it preselected.
            <button key={x.id} className="ms-item" onClick={() => nav(`/journal/diet/add/${m.id}?pick=${f.id}&g=${x.grams}`)}>
              <span className="ms-item-name">{f.name}</span>
              <span className="ms-item-desc">
                <span>{f.desc}</span>
                <ArrowRight size={18} />
              </span>
              <b className="ms-item-kcal">{Math.round((f.kcal * x.grams) / 100)} kcal</b>
            </button>
          );
        })}
        <button className="ms-add" onClick={() => nav(`/journal/diet/add/${m.id}`)}>
          Add Meal
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8.6" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10 6v8M6 10h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <div className="ml-nutr-head ms-nutr-head">
          <span>Your Meal's Nutrient</span>
          <b>{Math.round(t.kcal)} kcal</b>
        </div>
        <div className="ms-macros">
          <MacroTiles items={macroTiles(t)} gap={8.4} />
        </div>
        <div className="ms-bars">
          <NutrientBars rows={nutrientRows(t)} />
        </div>
        {/* TODO(fidelity): full nutrient list screen not captured */}
        <button className="ms-full">CLICK TO VIEW FULL LIST</button>
      </div>
    </Screen>
  );
}
