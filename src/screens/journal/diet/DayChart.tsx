import { foodById, type LoggedMeal } from "@/data/journal-store";

/**
 * Intake-by-hour chart (journal_diet/scroll_3). Geometry in box px: axis y 140, 00:00 at x 15.8,
 * 14 px per hour up to 23:00, vertical "now" line at the current hour.
 * TODO(fidelity): bar style for logged meals never captured on this chart (meal logged after the scroll shots).
 */
export function DayChart({ meals }: { meals: LoggedMeal[] }) {
  const W = 354;
  const x0 = 15.8;
  const step = 14;
  const axisY = 140;
  const hour = new Date().getHours();
  const nowX = x0 + hour * step;
  const bars = new Map<number, number>();
  for (const m of meals) {
    const h = new Date(m.at).getHours();
    bars.set(h, (bars.get(h) ?? 0) + (foodById(m.foodId).kcal * m.grams) / 100);
  }
  const max = Math.max(500, ...bars.values());

  return (
    <div className="diet-chart">
      <svg width={W} height={167} viewBox={`0 0 ${W} 167`}>
        {[...bars].map(([h, k]) => {
          const hgt = (k / max) * 110;
          return <rect key={h} x={x0 + h * step - 4} y={axisY - hgt} width={8} height={hgt} rx={2} fill="var(--c-calories)" />;
        })}
        <line x1={x0} y1={axisY} x2={nowX} y2={axisY} stroke="#4a4a4a" strokeWidth={1} />
        {Array.from({ length: 24 }, (_, h) =>
          h % 6 === 0 ? (
            <rect key={h} x={x0 + h * step - 1.2} y={axisY - 1} width={2.4} height={4} fill="#777" />
          ) : (
            <rect key={h} x={x0 + h * step - 0.6} y={axisY - 0.6} width={1.2} height={1.2} fill="#666" />
          ),
        )}
        {hour < 23 && <line x1={nowX} y1={axisY} x2={x0 + 23 * step} y2={axisY} stroke="#c8c8c8" strokeWidth={0.8} />}
        <line x1={nowX} y1={20} x2={nowX} y2={axisY} stroke="#555" strokeWidth={0.9} />
        {["00:00", "06:00", "12:00", "18:00"].map((l, i) => (
          <text key={l} x={x0 + i * 6 * step} y={157} fontSize={10} fill="#808080" textAnchor="middle">
            {l}
          </text>
        ))}
      </svg>
    </div>
  );
}
