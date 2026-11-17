import { fmt } from "./data";
import { dayKey, dayOffset, mealTotals, type Meal } from "./store";

/* The two pictures of the food page: the day as it adds up, and weeks as stacked bars. */

const W = 320;
const H = 120;

/** Energy adding up through a day, as steps at each meal. */
function steps(meals: Meal[], day: string) {
  const pts: { h: number; v: number }[] = [{ h: 0, v: 0 }];
  let v = 0;
  meals
    .filter((m) => m.day === day && m.status === "ready")
    .sort((a, b) => a.at - b.at)
    .forEach((m) => {
      const d = new Date(m.at);
      const h = d.getHours() + d.getMinutes() / 60;
      pts.push({ h, v });
      v += mealTotals(m).kcal;
      pts.push({ h, v });
    });
  return { pts, total: v };
}

/** Today solid up to now, yesterday dashed for the whole day, the goal as a rule. */
export function DayPace({ meals, goal }: { meals: Meal[]; goal: number }) {
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const today = steps(meals, dayKey(now));
  const yday = steps(meals, dayKey(dayOffset(-1)));
  const top = Math.max(goal, yday.total, today.total) * 1.1;
  const x = (h: number) => (h / 24) * W;
  const y = (v: number) => H - (v / top) * H;
  const line = (pts: { h: number; v: number }[], end: number) => {
    const last = pts[pts.length - 1].v;
    return [...pts, { h: end, v: last }].map((p, i) => `${i ? "L" : "M"}${x(p.h).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  };
  const ydayByNow = yday.pts.filter((p) => p.h <= nowH).pop()?.v ?? 0;
  const diff = today.total - ydayByNow;
  return (
    <>
      <p className="fd-say">
        {Math.abs(diff) < 50 ? (
          <>
            <b>About the same</b> as yesterday by this time.
          </>
        ) : (
          <>
            <b>
              {fmt(Math.abs(diff))} kcal {diff > 0 ? "more" : "less"}
            </b>{" "}
            than yesterday by this time.
          </>
        )}
      </p>
      <svg className="fd-pace" viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label={`Today ${fmt(today.total)} kcal, yesterday ${fmt(ydayByNow)} by this time`}>
        <line className="fd-goal" x1="0" x2={W} y1={y(goal)} y2={y(goal)} />
        <text className="fd-goal-t" x="0" y={y(goal) - 5}>
          Goal {fmt(goal)}
        </text>
        <path className="fd-was" d={line(yday.pts, 24)} />
        <path className="fd-now-area" d={`${line(today.pts, nowH)} L${x(nowH)},${H} L0,${H} Z`} />
        <path className="fd-now" d={line(today.pts, nowH)} />
        <circle className="fd-dot" cx={x(nowH)} cy={y(today.total)} r="4.5" />
        {["00", "06", "12", "18", "24"].map((t, i) => (
          <text key={t} className="fd-axis" x={(i / 4) * W} y={H + 14} textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}>
            {t}
          </text>
        ))}
      </svg>
      <dl className="fd-key">
        <div data-k="now">
          <dt>Today</dt>
          <dd>{fmt(today.total)} kcal</dd>
        </div>
        <div data-k="was">
          <dt>Yesterday by now</dt>
          <dd>{fmt(ydayByNow)} kcal</dd>
        </div>
        <div data-k="was">
          <dt>Yesterday in all</dt>
          <dd>{fmt(yday.total)} kcal</dd>
        </div>
      </dl>
    </>
  );
}
