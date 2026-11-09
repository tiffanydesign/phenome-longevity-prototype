import { GOALS, goalShares } from "./goals";
import "./walk.css";

/*
 * The three activity goals as bubbles in the ring's colours that rise and
 * fade behind a walker. Each goal keeps its colour, and its bubbles are as big
 * as its share of the goal, so a full day fills the air around the figure.
 */
/** x, y, base radius, which goal, delay in s: two bubbles per goal, staggered through one 3.6 s cycle */
const BUBBLES: [number, number, number, number, number][] = [
  [24, 30, 13, 0, 0],
  [70, 24, 11, 1, 0.6],
  [66, 62, 12, 2, 1.2],
  [28, 66, 10, 1, 1.8],
  [76, 44, 8, 0, 2.4],
  [20, 48, 8, 2, 3],
];

/** a walker in profile, limbs on their joints; the far side is drawn lighter, half a stride behind */
function Walker() {
  const leg = (far?: boolean) => (
    <g className="v2-walk-thigh" data-far={far || undefined}>
      <line x1="46" y1="52" x2="46" y2="66" />
      <g className="v2-walk-shin">
        <path d="M46,66 L46,79 L51,79" />
      </g>
    </g>
  );
  const arm = (far?: boolean) => (
    <g className="v2-walk-arm" data-far={far || undefined}>
      <path d="M49,33 L48,44 L53,51" />
    </g>
  );
  return (
    <g className="v2-walk">
      {arm(true)}
      {leg(true)}
      <line x1="46" y1="52" x2="49" y2="32" />
      <circle cx="51" cy="22" r="6" stroke="none" />
      {leg()}
      {arm()}
    </g>
  );
}

export function WalkArt({ size = 96, className }: { size?: number; className?: string }) {
  const share = goalShares();
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 96 96" aria-hidden>
      {BUBBLES.map(([x, y, r, g, delay]) => (
        <circle
          key={`${x}-${y}`}
          className="v2-bubble"
          cx={x}
          cy={y}
          r={r * (0.55 + 0.45 * share[g])}
          fill={GOALS[g].color}
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
      <Walker />
    </svg>
  );
}
