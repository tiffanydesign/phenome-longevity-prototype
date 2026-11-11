import type { ReactNode } from "react";
import type { MarkId } from "./plan";

/* each habit's mark, rounded lines on a 24 grid at the tab marks' weight */
const PATHS: Record<MarkId, ReactNode> = {
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  pill: (
    <>
      <path d="M10.6 19.9a4.3 4.3 0 0 1-6.1-6.1l6.8-6.8a4.3 4.3 0 0 1 6.1 6.1z" />
      <path d="m10.1 9.6 6.1 6.1" />
    </>
  ),
  drop: <path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z" />,
  stretch: (
    <>
      <circle cx="12" cy="5" r="2" />
      <path d="M5 9.5h14M12 9.5v5l-3.5 5.5M12 14.5l3.5 5.5" />
    </>
  ),
  meal: (
    <>
      <path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5" />
      <path d="M17 21V3c-2 1.5-3 4-3 7v4h3" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5v13c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z" />
      <path d="M12 6v13" />
    </>
  ),
  screen: (
    <>
      <rect x="6.5" y="3" width="11" height="18" rx="2.6" />
      <path d="M4 4l16 16" />
    </>
  ),
  walk: (
    <>
      <circle cx="13" cy="4.5" r="1.8" />
      <path d="m9.5 21 2.5-6 2.5 2.5V21M8 12l2-3.5 3.5-1 2 4 2.5 1M12 15l-1-5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 5-13.5 14-14 0 9-5.5 14-14 14z" />
      <path d="M5 19 13 11" />
    </>
  ),
};

/** A habit's mark on a disc of its hue; done, a solid disc with a tick. */
export function HabitMark({ mark, field, done, size = 40 }: { mark: MarkId; field: string; done?: boolean; size?: number }) {
  return (
    <span className="hb-mark" data-field={field} data-done={done ? "" : undefined} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 24 24" width={size / 2} height={size / 2} fill="none" stroke="currentColor" strokeWidth={done ? 2.6 : 1.9} strokeLinecap="round" strokeLinejoin="round">
        {done ? <path d="m6 12.5 4 4 8-9" /> : PATHS[mark]}
      </svg>
    </span>
  );
}

export const MARK_IDS = Object.keys(PATHS) as MarkId[];
