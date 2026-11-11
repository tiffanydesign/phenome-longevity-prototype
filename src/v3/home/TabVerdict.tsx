import { metric, seriesFor, type Tab } from "../data/metrics";
import { HistoryChart } from "../ui/charts";

type HomeTab = Exclude<Tab, "body">;

interface Verdict {
  /** the tab's name, so the page says where the member is */
  title: string;
  /** the tab's answer in a few words */
  headline: string;
  /** the overall read behind it: how the area is doing, and the one thing to do */
  text: string;
  /** the week the verdict rests on */
  chart: { metric: string; title: string; marks?: { value: number; label: string }[] };
  /** the tab's own colour, the one its selected tab mark wears */
  field: string;
}

const VERDICTS: Record<HomeTab, Verdict> = {
  all: {
    title: "Overview",
    headline: "A steady day",
    text: "Sleep and recovery are in a good place. Movement is the one area to lift today; a walk this evening would close it.",
    chart: { metric: "capacity", title: "Capacity" },
    field: "capacity",
  },
  vitals: {
    title: "Vitals",
    headline: "Your heart is recovering well",
    text: "Resting heart rate has eased and variability has risen three nights running. Your body is ready for a harder session.",
    chart: { metric: "hrv", title: "Heart rate variability" },
    field: "heart",
  },
  food: {
    title: "Nutrition",
    headline: "On pace for today",
    text: "Protein is tracking toward your goal and energy is well inside the day's budget. A light dinner keeps it that way.",
    chart: { metric: "diet", title: "Energy", marks: [{ value: 2000, label: "Goal" }] },
    field: "food",
  },
  activity: {
    title: "Activity",
    headline: "Close to your goal",
    text: "This week has been more active than last, and today is just short of target. Fifteen minutes on foot this evening closes it.",
    chart: { metric: "steps", title: "Steps", marks: [{ value: 8000, label: "Goal" }] },
    field: "activity",
  },
  sleep: {
    title: "Sleep",
    headline: "Well rested",
    text: "A third night above seven hours, with deep sleep holding steady. Keep tonight's bedtime close to last night's.",
    chart: { metric: "sleep", title: "Sleep" },
    field: "sleep",
  },
};

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The last seven days by name, ending today. */
const weekLabels = () => Array.from({ length: 7 }, (_, i) => DAY[(new Date().getDay() + i + 1) % 7]);

/**
 * The top of every Home tab: the verdict first, a headline and the overall read
 * in plain words, then the week it rests on, before any card.
 */
export function TabVerdict({ tab }: { tab: HomeTab }) {
  const v = VERDICTS[tab];
  const values = seriesFor(metric(v.chart.metric), "W");
  return (
    <div className="v2-verdict" data-field={v.field}>
      <h1 className="v2-verdict-title">{v.title}</h1>
      <h2>{v.headline}</h2>
      <p>{v.text}</p>
      {values.length > 1 && (
        <section className="v2-trend" aria-label={`${v.chart.title} this week`}>
          <header>
            <h3>{v.chart.title}</h3>
            <span>This week</span>
          </header>
          <HistoryChart values={values} labels={weekLabels().slice(-values.length)} marks={v.chart.marks} />
        </section>
      )}
    </div>
  );
}
