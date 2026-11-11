import type { ReactNode } from "react";

/**
 * Line icons drawn for the tabs and the bar, one weight, in the same 24 grid as
 * the app's own set. `ic-fill` shapes go solid when selected, `ic-knock` lines
 * cut back out of them (v2.css).
 */
function Line({ size = 24, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/*
 * The Home tabs, in one weight and rounded geometry, with one rule: a line
 * at rest, solid when selected. `ic-dot` parts are solid
 * at rest too, so each glyph keeps a readable silhouette; `ic-knock` lines cut
 * back out of the fill.
 */

/** Overview: four tiles, the first one already filled in. */
export const IconAll = () => (
  <Line>
    <rect className="ic-dot" x="3.75" y="3.75" width="7" height="7" rx="2.2" />
    <rect
      className="ic-fill"
      x="13.25"
      y="3.75"
      width="7"
      height="7"
      rx="2.2"
    />
    <rect
      className="ic-fill"
      x="3.75"
      y="13.25"
      width="7"
      height="7"
      rx="2.2"
    />
    <rect
      className="ic-fill"
      x="13.25"
      y="13.25"
      width="7"
      height="7"
      rx="2.2"
    />
  </Line>
);

/** Vitals: the heart with a beat running through it. */
export const IconVitals = () => (
  <Line>
    <path
      className="ic-fill"
      d="M12 20.4s-8.4-5-8.4-11.1A4.8 4.8 0 0 1 12 6.3a4.8 4.8 0 0 1 8.4 3c0 6.1-8.4 11.1-8.4 11.1z"
    />
    <path className="ic-knock" d="M6.8 12.6h2.6l1.5-2.7 2.1 4.9 1.4-2.2h2.8" />
  </Line>
);

/** Sleep: a bed, the pillow solid. */
export const IconSleep = () => (
  <Line>
    <path d="M3.2 5.6v14M20.8 14v5.6" />
    <rect
      className="ic-fill"
      x="3.2"
      y="13.4"
      width="17.6"
      height="3.4"
      rx="1"
    />
    <rect className="ic-dot" x="5.2" y="9.6" width="4.8" height="3" rx="1.4" />
    <path
      className="ic-fill"
      d="M11.6 13.4v-2.2c0-.9.7-1.6 1.6-1.6h5.2c1.3 0 2.4 1.1 2.4 2.4v1.4z"
    />
  </Line>
);

/** Activity: a runner mid-stride, drawn in SF's heavier limbs. */
export const IconActivity = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="15.4" cy="4.2" r="2.2" fill="currentColor" stroke="none" />
    <path d="M13.6 8.1 11.4 13" strokeWidth="3.8" />
    <path d="M13.4 8.4 10.1 9.2 8.4 11.6" />
    <path d="M13 9.7l2.3 2 2.9-.6" />
    <path d="M11.4 13l3.2 2.2-1 4.8" />
    <path d="M11.4 13l-1.8 3.4-3.8.9" />
  </svg>
);

/** Body: a figure cheering, arms up on the diagonal, drawn as a solid pictogram with round ends, the weight of the runner beside it. */
export const IconBody = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="4.2" r="2.3" fill="currentColor" stroke="none" />
    <path d="M10.1 8.3 6.4 4.4M13.9 8.3l3.7-3.9" />
    <rect x="9.6" y="7.3" width="4.8" height="5.4" rx="1.2" fill="currentColor" stroke="none" />
    <path d="M10.9 12.4l-1.2 7.8M13.1 12.4l1.3 7.8" />
  </svg>
);

/**
 * Food: a round-headed fork and a round-backed knife, crossed at the middle on
 * slim handles, so only the handles meet and both heads keep their space.
 */
export const IconFood = () => (
  <Line>
    <g transform="rotate(-42 12 12)">
      <path d="M9.4 1.6v3.3a2.6 2.6 0 0 0 5.2 0V1.6M12 1.6v3.2" />
      <rect className="ic-fill" x="11" y="9" width="2" height="13.4" rx="1" />
    </g>
    <g transform="rotate(42 12 12)">
      <path className="ic-dot" d="M13.2 1.4c-2.4.5-3.6 3-3.6 5.8v1.4h3.6z" />
      <rect className="ic-fill" x="11" y="9.6" width="2" height="12.8" rx="1" />
    </g>
  </Line>
);

export const IconHome = () => (
  <Line size={22}>
    {/* selected, the house stays a line and only its door fills */}
    <path d="M4 10.8 12 4l8 6.8V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
    <path className="ic-fill" d="M9.8 20.5v-4.6a.6.6 0 0 1 .6-.6h3.2a.6.6 0 0 1 .6.6v4.6" />
  </Line>
);

/** Insights: findings joined up, three nodes and the links between them; selected, the main node fills. */
export const IconInsights = () => (
  <Line size={22}>
    <path d="M8.2 8.6 10.6 14M15.8 8.4 13.4 14M8.8 6.6h6.4" />
    <circle cx="6.6" cy="6.6" r="2.4" />
    <circle cx="17.4" cy="6.6" r="2.4" />
    <circle className="ic-fill" cx="12" cy="17" r="3.2" />
  </Line>
);

/**
 * Longevity AI: a soft four-pointed spark held in an open ring. The ring is the
 * care that keeps going; it opens at the upper right, where a small spark escapes.
 */
export const IconAgent = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21.18 10.04A9.5 9.5 0 1 1 14.46 3.32" />
    <path fill="currentColor" stroke="none" d="M12 6.4c.55 3.3 2.65 5.4 5.95 5.95-3.3.55-5.4 2.65-5.95 5.95-.55-3.3-2.65-5.4-5.95-5.95 3.3-.55 5.4-2.65 5.95-5.95z" />
    <path fill="currentColor" stroke="none" d="M18.7 3.5l.6 1.65 1.65.6-1.65.6-.6 1.65-.6-1.65-1.65-.6 1.65-.6z" />
  </svg>
);


/*
 * Home's tab marks: rounded lines of one weight, a flame, a moon with
 * its spark, a heart with its trace, a fork and knife. At rest they are lines;
 * selected, the `ic-fill` shapes go solid and `ic-knock` lines cut back out of them.
 */
/*
 * A chubby flame of three tongues, none alike: a low one leaning left, the tall
 * one in the middle curling right, a middling one on the right shoulder.
 */
export const IconTabActivity = () => (
  <Line size={24}>
    <path className="ic-fill" d="M12 21.8c-4.2 0-7.4-2.8-7.4-6.7 0-2.9 1-5.5 2.3-7.6.8 1.6 1.7 2.6 2.9 3.1-.4-3.3.9-6.2 3.5-8 -.3 2 .3 3.9 1.6 5.6.5-.8.8-1.8.9-2.8 2.3 2.2 3.6 5.5 3.6 9.2 0 4.2-3.2 7.2-7.4 7.2z" />
  </Line>
);

/* a crescent opening to the right, its spark in the opening */
export const IconTabSleep = () => (
  <Line size={24}>
    <path className="ic-fill" d="M14.2 4.13A8.5 8.5 0 1 0 18.3 16.37A6.5 6.5 0 0 1 14.2 4.13z" />
    <path fill="currentColor" stroke="none" d="M19.4 4.6l.9 2.45 2.45.9-2.45.9-.9 2.45-.9-2.45-2.45-.9 2.45-.9z" />
  </Line>
);

export const IconTabHeart = () => (
  <Line size={24}>
    <path className="ic-fill" d="M12 20.2s-8-4.6-8-10.4a4.4 4.4 0 0 1 8-2.5 4.4 4.4 0 0 1 8 2.5c0 5.8-8 10.4-8 10.4z" />
    <path className="ic-knock" d="M6.8 12.2h2.6l1.4-2.4 2.2 4.6 1.5-2.2h2.7" />
  </Line>
);

export const IconTabFood = () => (
  <Line size={24}>
    <path d="M6.5 3v6.2a2.3 2.3 0 0 0 4.6 0V3" />
    <path d="M8.8 3v5.6M8.8 11.5V21" />
    <path className="ic-fill" d="M17.4 13.4h-3.2V9.6c0-3.3 1.3-5.6 3.2-6.6z" />
    <path d="M17.4 3v18" />
  </Line>
);

/** The double helix: what Omics reads, drawn as two strands and three rungs. */
export const IconOmics = () => (
  <Line size={22}>
    <path d="M8 3c0 5 8 6 8 9s-8 4-8 9" />
    <path d="M16 3c0 5-8 6-8 9s8 4 8 9" />
    <path d="M8.6 5.2h6.8M8 12h8M8.6 18.8h6.8" />
  </Line>
);

/** Store: a shopping bag; selected, its body fills and the handle stays a line. */
export const IconStore = () => (
  <Line size={22}>
    <path className="ic-fill" d="M5.2 8.5h13.6l-1 11a1.5 1.5 0 0 1-1.5 1.4H7.7a1.5 1.5 0 0 1-1.5-1.4z" />
    <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
  </Line>
);

/**
 * The twin: one bust split down the middle. The left half is drawn (you), the
 * right half is the halftone the Twin tab renders you in. Selected, the drawn
 * half fills; the dots stay dots.
 */
export function IconTwin({ size = 22 }: { size?: number }) {
  /* the drawn half mirrored: its outline as dots, and a halftone inside */
  const dots: [number, number, number][] = [
    [13.5, 3.2, 0.9],
    [15, 4.9, 0.9],
    [15, 7.1, 0.9],
    [13.5, 8.8, 0.9],
    [13.4, 11.7, 0.9],
    [15.9, 12.7, 0.9],
    [17.8, 14.8, 0.9],
    [19, 17.7, 0.9],
    [19.4, 20.2, 0.9],
    [13.9, 14.4, 0.75],
    [16.1, 16.4, 0.75],
    [13.9, 18.4, 0.75],
    [16.6, 20.2, 0.75],
    [13.9, 20.2, 0.75],
  ];
  return (
    <Line size={size}>
      <path className="ic-fill" d="M12 2.8a3.2 3.2 0 0 0 0 6.4z" />
      <path className="ic-fill" d="M12 11.6c-4 0-7 3-7.4 8.6H12z" />
      <g fill="currentColor" stroke="none">
        {dots.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
        ))}
      </g>
    </Line>
  );
}

export function Chevron({
  dir = "right",
  size = 18,
}: {
  dir?: "right" | "left" | "up" | "down";
  size?: number;
}) {
  const rot = { right: 0, left: 180, up: -90, down: 90 }[dir];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${rot}deg)` }}
      aria-hidden
    >
      <path d="M9 5.5l6.5 6.5L9 18.5" />
    </svg>
  );
}

export const IconClose = () => (
  <Line size={20}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Line>
);

export const IconGrip = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden
  >
    {[3, 8, 13].flatMap((y) =>
      [5.5, 10.5].map((x) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" />
      )),
    )}
  </svg>
);

export const IconResize = () => (
  <Line size={16}>
    <path d="M4 10v10h10M20 14V4H10M4 20L20 4" />
  </Line>
);

/*
 * The Twin lens marks: three shapes that share nothing, so each lens is told
 * apart by outline alone. Vitals a beat, Body the standing figure, Omics a molecule.
 */

/** Vitals lens: one heartbeat on a flat line. */
export const IconLensVitals = ({ size = 20 }: { size?: number }) => (
  <Line size={size}>
    <path strokeWidth="2" d="M2.5 12.5h4l2-5 3.5 10 2.6-7.5 1.4 2.5h5.5" />
  </Line>
);

/** Body lens: the figure in outline, standing arms a little out as the twin stands, the head solid. */
export const IconLensBody = ({ size = 20 }: { size?: number }) => (
  <Line size={size}>
    <circle cx="12" cy="4.3" r="2.25" fill="currentColor" stroke="none" />
    <path
      strokeWidth="1.7"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.14"
      d="M11 7.8h2c1.2 0 2 .3 2.5 1l3 6.4a.8.8 0 0 1-1.4.8l-2.4-4.3.1 3-.5 5.7a.8.8 0 0 1-.8.8h-.6a.8.8 0 0 1-.8-.8L12 15.8l-.1 4.6a.8.8 0 0 1-.8.8h-.6a.8.8 0 0 1-.8-.8l-.5-5.7.1-3-2.4 4.3a.8.8 0 0 1-1.4-.8l3-6.4c.5-.7 1.3-1 2.5-1z"
    />
  </Line>
);

/** Omics lens: three bonded atoms, one larger, read as a molecule. */
export const IconLensOmics = ({ size = 20 }: { size?: number }) => (
  <Line size={size}>
    <path strokeWidth="2" d="M9.6 10.4 6.6 7.4M13.4 10.6l3.4-2.8M12 14.2v3.4" />
    <circle cx="11.5" cy="12" r="2.8" fill="currentColor" stroke="none" />
    <circle cx="5.4" cy="6.2" r="2" />
    <circle cx="18" cy="6.8" r="2" />
    <circle cx="12" cy="19.6" r="1.8" />
  </Line>
);
