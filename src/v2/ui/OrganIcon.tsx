import type { CSSProperties, ReactNode } from "react";
import type { OrganId } from "../data/metrics";

/**
 * Organ marks for small places (the twin link at the foot of a metric): a pale
 * disc in the organ's hue with the organ drawn over it as one rounded line, on
 * a 24 grid at stroke 2. One hue per organ so the mark reads before the label;
 * no violet, and no gold, which is Monitor's.
 */
const ORGAN_ICON: Record<OrganId, { color: string; d: ReactNode }> = {
  brain: {
    color: "#2f7fe0",
    d: (
      <>
        <path d="M12 6.5a3 3 0 0 0-5.6-1A3 3 0 0 0 4.6 10a3 3 0 0 0 .6 5 3 3 0 0 0 4 3.4A2.8 2.8 0 0 0 12 18" />
        <path d="M12 6.5a3 3 0 0 1 5.6-1 3 3 0 0 1 1.8 4.5 3 3 0 0 1-.6 5 3 3 0 0 1-4 3.4A2.8 2.8 0 0 1 12 18" />
        <path d="M12 6v12M8 9.5c1 0 2 .7 2 2M16 9.5c-1 0-2 .7-2 2" />
      </>
    ),
  },
  thyroid: {
    color: "#e2577b",
    d: (
      <>
        <path d="M11 12c-1-4-3-6-5-6-1.7 0-2.5 2-2 4.5.6 3 2.5 6.5 4.5 6.5 1.6 0 2.5-2 2.5-5z" />
        <path d="M13 12c1-4 3-6 5-6 1.7 0 2.5 2 2 4.5-.6 3-2.5 6.5-4.5 6.5-1.6 0-2.5-2-2.5-5z" />
        <path d="M11 12h2" />
      </>
    ),
  },
  lungs: {
    color: "#1f9cc4",
    d: (
      <>
        <path d="M12 4v8l-2.5 2M12 12l2.5 2" />
        <path d="M9.5 7.5C6.8 8 4 12 4 17c0 1.6 1.2 2.5 2.6 2.2l2.9-.7V10" />
        <path d="M14.5 7.5C17.2 8 20 12 20 17c0 1.6-1.2 2.5-2.6 2.2l-2.9-.7V10" />
      </>
    ),
  },
  heart: {
    color: "#e5484d",
    d: (
      <>
        <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z" />
        <path d="M7 12.5h2.5l1.5-2.5 2 5 1.5-2.5H17" />
      </>
    ),
  },
  liver: {
    color: "#c0612b",
    d: (
      <>
        <path d="M3.8 9.4C6.4 7 12.2 6 19.8 6.5c.6 0 .9.7.5 1.2-3.4 3.6-8.2 8.9-11.6 9.8C5.2 18.4 3.3 12.9 3.8 9.4z" />
        <path d="M12 10c0 2 1 3.2 2.2 3.8" />
      </>
    ),
  },
  gut: {
    color: "#f0643a",
    d: <path d="M5 5.5h12.5a2.5 2.5 0 0 1 0 5H7.5a2.5 2.5 0 0 0 0 5h9.5a2.2 2.2 0 0 1 0 4.4h-3" />,
  },
  kidneys: {
    color: "#d08a1f",
    d: (
      <>
        <path d="M9 4.5C6.2 4.5 4.5 8 4.5 12s1.7 7.5 4.5 7.5c1.6 0 2-1.5 1.3-2.9-.6-1.3-.6-3.3 0-4.6-.6-1.3-.6-3.3 0-4.6.7-1.4.3-2.9-1.3-2.9z" />
        <path d="M15 4.5c2.8 0 4.5 3.5 4.5 7.5s-1.7 7.5-4.5 7.5c-1.6 0-2-1.5-1.3-2.9.6-1.3.6-3.3 0-4.6.6-1.3.6-3.3 0-4.6-.7-1.4-.3-2.9 1.3-2.9z" />
      </>
    ),
  },
  bone: {
    color: "#4fa62c",
    d: <path d="M8.2 4.6a2.4 2.4 0 0 0-3.6 2.7 2.4 2.4 0 0 0 1.6 3.9l6.6 6.6a2.4 2.4 0 0 0 3.9 1.6 2.4 2.4 0 0 0 2.7-3.6 2.4 2.4 0 0 0-2.9-2.9l-5.4-5.4a2.4 2.4 0 0 0-2.9-2.9z" />,
  },
  skin: {
    color: "#d9608a",
    d: (
      <>
        <path d="M3.5 9c2.8-2 5.7 2 8.5 0s5.7 2 8.5 0" />
        <path d="M3.5 13.5h17M8 13.5V19M12 13.5V18M16 13.5V19" />
      </>
    ),
  },
  immune: {
    color: "#17977f",
    d: (
      <>
        <path d="M12 3.5l7 2.6v5.4c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6.1z" />
        <path d="M12 9v6M9 12h6" />
      </>
    ),
  },
  composition: {
    color: "#4374af",
    d: (
      <>
        <circle cx="12" cy="5" r="2" />
        <path d="M8 9.5h8l-1.2 5.5h-1.6l-.6 5h-1.2l-.6-5H9.2z" />
      </>
    ),
  },
};

export function OrganIcon({ organ, size = 40, className }: { organ: OrganId; size?: number; className?: string }) {
  const { color, d } = ORGAN_ICON[organ];
  return (
    <span className={`v2-organ-icon ${className ?? ""}`} style={{ "--c": color, width: size, height: size } as CSSProperties} aria-hidden>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {d}
      </svg>
    </span>
  );
}
