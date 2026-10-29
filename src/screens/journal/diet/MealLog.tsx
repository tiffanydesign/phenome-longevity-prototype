import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Controls";
import { MEALS, WEIGHT_STEP, type Food, type MealId } from "@/data/journal";
import { foodById, journalActions, mealTotals } from "@/data/journal-store";
import { JHeader, MacroTiles, NutrientBars } from "../shared/parts";
import { CameraIcon, InfoIcon, MinusCircle, PlusCircleThick, SearchIcon, TrashIcon } from "../shared/icons";
import { popOr } from "../shared/nav";
import { CameraPermission, MealTitle, SearchSheet } from "./MealParts";
import { macroTiles, nutrientRows } from "./nutrients";
import "./meal.css";

let cameraGranted = false;

/**
 * Add Breakfast/Lunch/… — capture: meal_log/top, search_results, item_detail, permission_camera.
 * Test/deep-link params: ?q=eggs opens the search sheet typed, ?pick=<foodId>&g=<grams> preselects
 * a food, ?perm=1 shows the camera-permission dialog.
 */
export function MealLog() {
  const [params] = useSearchParams();
  return <MealLogBody key={params.toString()} params={params} />;
}

function MealLogBody({ params }: { params: URLSearchParams }) {
  const { meal = "breakfast" } = useParams();
  const nav = useNavigate();
  const m = MEALS.find((x) => x.id === meal) ?? MEALS[0];
  const pick = params.get("pick");
  const [food, setFood] = useState<Food | null>(pick ? foodById(pick) : null);
  const [grams, setGrams] = useState(Number(params.get("g")) || 100);
  const [search, setSearch] = useState<string | null>(params.get("q"));
  const [perm, setPerm] = useState(params.get("perm") === "1");
  const [openedAt] = useState(() => new Date());

  const openCamera = () => (cameraGranted ? nav("/journal/diet/camera") : setPerm(true));
  const add = () => {
    if (!food) return;
    journalActions.addMeal(m.id as MealId, food.id, grams);
    popOr(nav, "/journal/diet");
  };
  const totals = food ? mealTotals([{ id: "x", meal: m.id, foodId: food.id, grams, at: 0 }]) : null;

  return (
    <Screen
      statusTone="light"
      header={<JHeader kind="meal" title={`Add ${m.name}`} />}
      overlay={
        search !== null ? (
          <SearchSheet
            initial={search}
            onClose={() => setSearch(null)}
            onPick={(f) => {
              setFood(f);
              setGrams(100);
              setSearch(null);
            }}
          />
        ) : perm ? (
          <CameraPermission
            onAllow={() => {
              cameraGranted = true;
              setPerm(false);
              nav("/journal/diet/camera");
            }}
            onDeny={() => setPerm(false)}
          />
        ) : undefined
      }
    >
      <div className="ml">
        <MealTitle name={m.name} at={openedAt} />
        {!food || !totals ? (
          <>
            <h3 className="ml-label">Search or Scan Your Meal</h3>
            <button className="ml-input ml-input-btn" onClick={() => setSearch("")}>
              <span className="ml-placeholder">e.g. Eggs</span>
              <SearchIcon size={24} />
            </button>
            <button className="ml-camera" aria-label="Scan meal" onClick={openCamera}>
              <CameraIcon size={26} />
            </button>
            <p className="ml-info">
              <InfoIcon size={14} />
              <span>Upload a meal photo and we will detect the nutrients and track it for you.</span>
            </p>
            <Button tone="disabled" className="ml-add ml-add-off" disabled>
              ADD TO {m.name.toUpperCase()}
            </Button>
          </>
        ) : (
          <>
            <div className="ml-food">
              <span className="ml-food-text">
                <b>{food.name}</b>
                <span>{food.desc}</span>
              </span>
              <button className="ml-food-del" aria-label="Remove" onClick={() => setFood(null)}>
                <TrashIcon size={24} />
              </button>
            </div>
            <h3 className="ml-label ml-label-weight">Meal Weight</h3>
            <div className="ml-weight">
              <button aria-label="Decrease" disabled={grams <= WEIGHT_STEP} onClick={() => setGrams(grams - WEIGHT_STEP)}>
                <MinusCircle size={28} />
              </button>
              <span className="ml-weight-val">
                <b>{grams}</b> g
              </span>
              <button aria-label="Increase" onClick={() => setGrams(grams + WEIGHT_STEP)}>
                <PlusCircleThick size={28} />
              </button>
            </div>
            <div className="ml-nutr-head">
              <span>Your Meal's Nutrient</span>
              <b>{Math.round(totals.kcal)} kcal</b>
            </div>
            <div className="ml-macros">
              <MacroTiles items={macroTiles(totals, true)} gap={8} />
            </div>
            <div className="ml-bars">
              <NutrientBars rows={nutrientRows(totals)} />
            </div>
            {/* TODO(fidelity): enabled ADD button sits below the captured fold — colour assumed black like other CTAs */}
            <Button tone="black" className="ml-add" onClick={add}>
              ADD TO {m.name.toUpperCase()}
            </Button>
          </>
        )}
      </div>
    </Screen>
  );
}
