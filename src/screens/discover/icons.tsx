/**
 * Module-local line icons (Material-style glyphs redrawn as SVG; the app draws them
 * natively, so they are not in public/assets/icons). All use currentColor.
 */
import type { ReactNode } from "react";

type P = { size?: number };

const svg = (size: number, children: ReactNode, vb = 24) => (
  <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill="none" aria-hidden>
    {children}
  </svg>
);

export const CalendarX = ({ size = 28 }: P) =>
  svg(
    size,
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="1.6" stroke="currentColor" strokeWidth="2" />
      <path d="M4 10h16M8 3.5v4M16 3.5v4M9.6 13.2l4.8 4.8M14.4 13.2l-4.8 4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>,
  );

export const Route = ({ size = 20 }: P) =>
  svg(
    size,
    <>
      <circle cx="6" cy="5" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="19" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 7v9.5a3.5 3.5 0 0 0 7 0v-9a3 3 0 0 1 6 0V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>,
  );

export const Video = ({ size = 20 }: P) =>
  svg(
    size,
    <>
      <rect x="3" y="6.5" width="12.5" height="11" rx="1.2" stroke="currentColor" strokeWidth="2" />
      <path d="M15.5 11l5-3.5v9l-5-3.5z" fill="currentColor" />
    </>,
  );

export const PersonPin = ({ size = 20 }: P) =>
  svg(
    size,
    <>
      <path d="M12 21.5s-7-6.4-7-11.6a7 7 0 0 1 14 0c0 5.2-7 11.6-7 11.6z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="8.6" r="2" fill="currentColor" />
      <path d="M8.6 13.6c.7-1.4 2-2.1 3.4-2.1s2.7.7 3.4 2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>,
  );

export const Pin = ({ size = 20 }: P) =>
  svg(
    size,
    <>
      <path d="M12 21.5s-6.5-6.2-6.5-11.3a6.5 6.5 0 0 1 13 0c0 5.1-6.5 11.3-6.5 11.3z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" />
    </>,
  );

export const Timer = ({ size = 20 }: P) =>
  svg(
    size,
    <>
      <circle cx="12" cy="13.5" r="7.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.5 2.8h5M12 13.5V9.5M18.2 6.6l1.3-1.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>,
  );

export const Clock = ({ size = 16 }: P) =>
  svg(
    size,
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>,
  );

export const Globe = ({ size = 16 }: P) =>
  svg(
    size,
    <>
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <path
        d="M6.2 7.6c1.6.2 2.4 1.2 2.2 2.6-.2 1.1.8 1.7 1.7 1.5 1-.2 1.8.7 1.4 1.8-.4 1.2-.1 2.6.9 3.4M14 4c-.6 1.3.1 2.4 1.4 2.5 1.2.1 1.6 1.2 1 2.1-.5.8.2 1.8 1.2 1.6.9-.2 1.9.1 2.3.9M14.4 20c.2-1.4 1.3-2.2 2.6-2"
        stroke="var(--c-bg)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>,
  );

export const Radio = ({ on, size = 20 }: P & { on?: boolean }) =>
  on
    ? svg(
        size,
        <>
          <circle cx="12" cy="12" r="11" fill="currentColor" />
          <path d="M7 12.3l3.2 3.2L17 8.8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </>,
      )
    : svg(size, <circle cx="12" cy="12" r="10.6" stroke="#6f6f6f" strokeWidth="1.8" />);

export const Gamepad = ({ size = 48 }: P) =>
  svg(
    size,
    <>
      <path
        d="M7.2 6.5h9.6a4.2 4.2 0 0 1 4.1 3.4l1 5.6a2.6 2.6 0 0 1-4.5 2.2L15 15.2H9l-2.4 2.5a2.6 2.6 0 0 1-4.5-2.2l1-5.6a4.2 4.2 0 0 1 4.1-3.4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 9.3v3.4M6.3 11h3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15.6" cy="10" r="0.9" fill="currentColor" />
      <circle cx="17.4" cy="12" r="0.9" fill="currentColor" />
    </>,
  );

export const Play = ({ size = 16 }: P) => svg(size, <path d="M7 4.5v15l12-7.5z" fill="currentColor" />);

export const Stopwatch = ({ size = 16 }: P) =>
  svg(
    size,
    <>
      <circle cx="12" cy="13.5" r="8" fill="currentColor" />
      <path d="M9.5 2.5h5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 13.5V9.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </>,
  );

export const History = ({ size = 20 }: P) =>
  svg(
    size,
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.3 4.8V9h4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v4.3l2.8 1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>,
  );

export const Plus = ({ size = 20 }: P) => svg(size, <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />);

export const Wave = ({ size = 20 }: P) =>
  svg(size, <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />);

export const Send = ({ size = 18 }: P) => svg(size, <path d="M3.5 20.5L21 12 3.5 3.5l.1 6.6L15 12 3.6 13.9z" fill="currentColor" />);

export const ChatBubble = ({ size = 16 }: P) =>
  svg(size, <path d="M4.5 4.5h15v11.5h-11L4.5 20z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />);
