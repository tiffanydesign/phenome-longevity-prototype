import { useMemo, type ReactNode } from "react";
import { fmt, NUTRIENT, TARGET } from "./data";
import { dayKey, dayOffset, dayTotals, type Meal } from "./store";
import { NutrientMark } from "./parts";

/*
 * Longevity analysis, the original tracker's comparison card, written as a
 * few findings: a hue label naming what is measured, the number that matters
 * large, then one or two plain sentences on what it means over the years.
 * Worked out from the last seven days of the diary.
 */

type Finding = { id: string; label: string; hue: string; ink?: string; mark: ReactNode; value: string; body: string };

export function LongevityAnalysis({ meals, goal }: { meals: Meal[]; goal: number }) {
  const findings = useMemo<Finding[]>(() => {
    // whole days only: today is still being eaten
    const days = Array.from({ length: 7 }, (_, i) => dayTotals(meals, dayKey(dayOffset(i - 7))));
    const logged = days.filter((d) => d.kcal > 0);
    if (logged.length < 2) return [];
    const mean = (k: keyof (typeof days)[number]) => logged.reduce((a, d) => a + d[k], 0) / logged.length;
    const protein = mean("protein");
    const fiber = mean("fiber");
    const kcal = mean("kcal");
    const proteinDays = logged.filter((d) => d.protein >= TARGET.protein * 0.9).length;
    const fiberGap = TARGET.fiber - fiber;
    const bal = kcal - goal;
    return [
      {
        id: "protein",
        label: "Protein",
        hue: NUTRIENT.protein.hue,
        ink: NUTRIENT.protein.ink,
        mark: <NutrientMark id="protein" size={16} solid />,
        value: `${fmt(protein)} g a day`,
        body:
          proteinDays >= logged.length - 1
            ? `On target most days. Enough protein keeps muscle as you age, which protects strength and blood sugar.`
            : `Near your ${TARGET.protein} g target on ${proteinDays} of ${logged.length} logged days. A palm of fish, eggs or tofu at breakfast closes most of the gap.`,
      },
      {
        id: "fiber",
        label: "Fibre",
        hue: NUTRIENT.fiber.hue,
        ink: NUTRIENT.fiber.ink,
        mark: <NutrientMark id="fiber" size={16} />,
        value: `${fmt(fiber)} g a day`,
        body:
          fiberGap > 3
            ? `${fmt(fiberGap)} g short of ${TARGET.fiber} g. Fibre feeds your gut bacteria and helps keep cholesterol down; beans and greens add it fastest.`
            : `At or near ${TARGET.fiber} g. Steady fibre is linked with lower cholesterol and a more varied gut.`,
      },
      {
        id: "energy",
        label: "Energy balance",
        hue: "var(--mid)",
        mark: <NutrientMark id="kcal" size={16} />,
        value: `${bal >= 0 ? "+" : "−"}${fmt(Math.abs(bal))} kcal a day`,
        body:
          Math.abs(bal) < 150
            ? `Close to your ${fmt(goal)} kcal goal across ${logged.length} logged days. Steady intake matters more than any single day.`
            : bal < 0
              ? `Under your ${fmt(goal)} kcal goal on average. A small, steady gap is fine; a large one can slow recovery.`
              : `Over your ${fmt(goal)} kcal goal on average. A lighter dinner is the easiest place to trim.`,
      },
    ];
  }, [meals, goal]);

  if (!findings.length) {
    return <p className="fd-la-none">Log meals on two or more days and the comparison will appear here.</p>;
  }
  return (
    <div className="fd-la">
      {findings.map((f) => (
        <article key={f.id} className="fd-la-card" style={{ "--hue": f.hue, "--hue-ink": f.ink } as React.CSSProperties}>
          <p className="fd-la-label">
            {f.mark}
            {f.label}
          </p>
          <b className="fd-la-value">{f.value}</b>
          <p className="fd-la-body">{f.body}</p>
        </article>
      ))}
      <p className="fd-la-foot">From the last 7 days of your diary</p>
    </div>
  );
}
