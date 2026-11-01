import type { ReactNode } from "react";

/** Line icons drawn for the top tabs, one weight, in the same 24 grid as the app's own set. */
function Line({ size = 24, children }: { size?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

export const IconAll = () => (
  <Line>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2.2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="3.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="3.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2.2" />
  </Line>
);

export const IconActivity = () => (
  <Line>
    <circle cx="14.5" cy="4.6" r="1.8" />
    <path d="M9 9.2l3.6-1.6 3 2.7 2.9.7" />
    <path d="M12.6 7.6l-1.4 5 3.2 2.6.6 5.2" />
    <path d="M11.2 12.6l-1.5 3.5-4.2.6" />
  </Line>
);

export const IconSleep = () => (
  <Line>
    <path d="M19.6 14.4A8 8 0 1 1 9.6 4.4a6.4 6.4 0 0 0 10 10z" />
    <path d="M16.6 3.6l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
  </Line>
);

export const IconVitals = () => (
  <Line>
    <path d="M20.3 9.2c0 5-8.3 10.8-8.3 10.8S3.7 14.2 3.7 9.2A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.3 2.9z" />
    <path d="M6.6 12h3l1.4-2.6 2 4.6 1.3-2h3" />
  </Line>
);

export const IconBody = () => (
  <Line>
    <circle cx="12" cy="4.8" r="2.1" />
    <path d="M5 9.2c4.6 1.4 9.4 1.4 14 0" />
    <path d="M9.3 10.2v4.3l-1 6.3M14.7 10.2v4.3l1 6.3M9.3 14.5h5.4" />
  </Line>
);

export const IconFood = () => (
  <Line>
    <path d="M7 3.5v6.2M4.4 3.5v3.9a2.6 2.6 0 0 0 5.2 0V3.5M7 10v10.5" />
    <path d="M17 20.5V14h-2.6V8.6c0-3 1.4-5.1 3.3-5.1V14" />
  </Line>
);

export const IconMore = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <circle cx="12" cy="5" r="1.9" />
    <circle cx="12" cy="12" r="1.9" />
    <circle cx="12" cy="19" r="1.9" />
  </svg>
);

/** The figure as a handful of cells: the nav's mark for the twin. */
export function IconTwin({ size = 22 }: { size?: number }) {
  const dots: [number, number, number][] = [
    [12, 3.6, 2.3],
    [12, 9, 1.7], [8.4, 9, 1.35], [15.6, 9, 1.35], [4.9, 10.8, 1.05], [19.1, 10.8, 1.05],
    [12, 13, 1.7], [9.3, 13, 1.25], [14.7, 13, 1.25],
    [10, 17, 1.35], [14, 17, 1.35], [10, 21, 1.05], [14, 21, 1.05],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {dots.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
      ))}
    </svg>
  );
}

export function Chevron({ dir = "right", size = 18 }: { dir?: "right" | "left" | "up"; size?: number }) {
  const rot = { right: 0, left: 180, up: -90 }[dir];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${rot}deg)` }} aria-hidden>
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
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    {[3, 8, 13].flatMap((y) => [5.5, 10.5].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" />))}
  </svg>
);

export const IconResize = () => (
  <Line size={16}>
    <path d="M4 10v10h10M20 14V4H10M4 20L20 4" />
  </Line>
);
