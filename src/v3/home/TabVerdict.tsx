import type { Tab } from "../data/metrics";
import { foodVerdict, useFoodWeek } from "./FoodWeek";
import { TodayCard } from "./TodayCard";

type HomeTab = Exclude<Tab, "body">;

interface Verdict {
  /** the tab's name, so the page says where the member is */
  title: string;
  /** the tab's answer in a few words */
  headline: string;
  /** the overall read behind it: how the area is doing, and the one thing to do */
  text: string;
  /** the tab's own colour, the one its selected tab mark wears */
  field: string;
}

const VERDICTS: Record<HomeTab, Verdict> = {
  all: {
    title: "Overview",
    headline: "A steady day",
    text: "An excellent night and your step goal is already behind you. Capacity is stable, so keep the evening steady.",
    field: "capacity",
  },
  vitals: {
    title: "Vitals",
    headline: "Your heart is recovering well",
    text: "Resting heart rate has held at 49 for three nights and variability sits above your usual range. Your body is ready for a harder session.",
    field: "heart",
  },
  food: {
    title: "Lifestyle",
    headline: "On pace for today",
    text: "Protein is tracking toward your goal and energy is well inside the day's budget. A light dinner keeps it that way.",
    field: "food",
  },
  activity: {
    title: "Activity",
    headline: "Step goal passed",
    text: "10,796 steps and 7.3 km, 18% more than yesterday. Active calories are well past target, so an easy evening is fine.",
    field: "activity",
  },
  sleep: {
    title: "Sleep",
    headline: "An excellent night",
    text: "7:54 asleep with 2:50 of deep and REM and barely a minute awake. Keep tonight's bedtime close to last night's.",
    field: "sleep",
  },
};

/**
 * The top of every Home tab: the verdict first, a headline and the overall read
 * in plain words, then today's numbers on one compact card. Weeks and months
 * live on each reading's own page.
 */
export function TabVerdict({ tab }: { tab: HomeTab }) {
  if (tab === "food") return <FoodVerdict />;
  const v = VERDICTS[tab];
  return (
    <div className="v2-verdict" data-field={v.field} aria-label={v.title}>
      <h2>{v.headline}</h2>
      <p>{v.text}</p>
      <TodayCard tab={tab as Exclude<HomeTab, "all">} />
    </div>
  );
}

/** Lifestyle reads its verdict from the food diary itself. */
function FoodVerdict() {
  const v = VERDICTS.food;
  const w = useFoodWeek();
  const say = foodVerdict(w);
  return (
    <div className="v2-verdict" data-field={v.field} aria-label={v.title}>
      <h2>{say.headline}</h2>
      <p>{say.text}</p>
      <TodayCard tab="food" />
    </div>
  );
}
