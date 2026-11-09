import type { ReactNode } from "react";

/**
 * Small filled marks that name a reading's kind beside its name: one weight,
 * one size, drawn on a 24 grid and filled with the category's colour.
 */
export type GlyphName =
  | "flame"
  | "steps"
  | "route"
  | "moon"
  | "waves"
  | "thermo"
  | "gauge"
  | "heart"
  | "pulse"
  | "fork"
  | "check"
  | "figure"
  | "drop"
  | "lungs"
  | "scale"
  | "bone"
  | "dna"
  | "bell"
  | "spark";

const PATHS: Record<GlyphName, ReactNode> = {
  flame: <path d="M12.6 2.5c.4 3.1 2.2 4.6 3.7 6.2 1.6 1.7 2.7 3.6 2.7 6.1A7 7 0 0 1 12 21.8a7 7 0 0 1-7-7c0-2.4 1-4.3 2.6-5.8.3 1.7 1 2.8 2.2 3.4-.3-3.6.8-6.9 2.8-9.9z" />,
  steps: (
    <>
      <path d="M8.2 2.8c2 0 3.1 2.3 3 5-.1 2.2-.7 4-1.4 5.3-.4.8-1.2 1.2-2.1 1.1l-1.4-.2c-.9-.1-1.6-.8-1.7-1.7-.2-1.4-.4-3.2-.1-5 .5-2.6 1.8-4.5 3.7-4.5zM5.8 16l3.9.6c.4 2.3-.5 4.6-2.4 4.6-1.6 0-2.1-2.2-1.5-5.2z" />
      <path d="M15.8 7.3c1.9 0 3.2 1.9 3.6 4.5.3 1.8.1 3.6-.1 5-.1.9-.8 1.6-1.7 1.7l-1.4.2c-.9.1-1.7-.3-2.1-1.1-.7-1.3-1.3-3.1-1.4-5.3-.1-2.7 1.1-5 3.1-5z" opacity="0.55" />
    </>
  ),
  route: <path d="M6 3.5a3 3 0 0 1 3 3c0 2.2-3 5.5-3 5.5S3 8.7 3 6.5a3 3 0 0 1 3-3zm12 8a3 3 0 0 1 3 3c0 2.2-3 5.5-3 5.5s-3-3.3-3-5.5a3 3 0 0 1 3-3zM6 14.2c.6 0 1 .4 1 1v.8a2 2 0 0 0 2 2h4.2a1 1 0 1 1 0 2H9a4 4 0 0 1-4-4v-.8c0-.6.4-1 1-1z" />,
  moon: <path d="M14.7 2.6A8.8 8.8 0 1 0 21.4 14a7.2 7.2 0 0 1-6.7-11.4z" />,
  waves: <path d="M3 8.4c1.5 0 2.2-1.4 4.5-1.4S10.6 8.4 12 8.4 14.2 7 16.5 7 19.6 8.4 21 8.4v2.4c-1.5 0-2.2-1.4-4.5-1.4s-3.1 1.4-4.5 1.4-2.2-1.4-4.5-1.4S4.4 10.8 3 10.8zm0 5.6c1.5 0 2.2-1.4 4.5-1.4s3.1 1.4 4.5 1.4 2.2-1.4 4.5-1.4 3.1 1.4 4.5 1.4v2.4c-1.5 0-2.2-1.4-4.5-1.4s-3.1 1.4-4.5 1.4-2.2-1.4-4.5-1.4S4.4 16.4 3 16.4z" />,
  thermo: <path d="M12 2.5a3 3 0 0 1 3 3v8.1a5 5 0 1 1-6 0V5.5a3 3 0 0 1 3-3zm0 2a1 1 0 0 0-1 1v9.2l-.4.3a3 3 0 1 0 2.8 0l-.4-.3V5.5a1 1 0 0 0-1-1z" />,
  gauge: <path d="M12 3.5A9.5 9.5 0 0 1 21.5 13c0 2.1-.7 4.1-1.9 5.7-.3.4-.8.6-1.2.6H5.6c-.5 0-.9-.2-1.2-.6A9.5 9.5 0 0 1 12 3.5zm4.6 5.2c-.3-.3-.8-.3-1.1 0l-3.2 3.2a2 2 0 1 0 1.1 1.1l3.2-3.2c.3-.3.3-.8 0-1.1z" />,
  heart: <path d="M12 20.6c-.3 0-.6-.1-.8-.3C5.6 15.8 2.5 12.9 2.5 9.2 2.5 6.3 4.7 4 7.5 4c1.9 0 3.5 1 4.5 2.5C13 5 14.6 4 16.5 4c2.8 0 5 2.3 5 5.2 0 3.7-3.1 6.6-8.7 11.1-.2.2-.5.3-.8.3z" />,
  pulse: <path d="M12 20.6c-.3 0-.6-.1-.8-.3-4-3.2-6.6-5.6-7.9-7.9h4.1l1.3-2.3 2.4 4.9c.3.6 1.2.6 1.5 0l2.1-3.9h6.1c-1.3 2.3-3.9 4.7-8 7.9-.2.2-.5.3-.8.3zM2.6 10.4c-.1-.4-.1-.8-.1-1.2C2.5 6.3 4.7 4 7.5 4c1.9 0 3.5 1 4.5 2.5C13 5 14.6 4 16.5 4c2.8 0 5 2.3 5 5.2 0 .4 0 .8-.1 1.2h-6.7c-.3 0-.6.2-.8.5l-1.4 2.6-2.4-4.9c-.3-.6-1.2-.6-1.5 0l-1.7 2.8z" />,
  fork: <path d="M6.5 2.5c.5 0 .9.4.9.9v4.8h.9V3.4a.9.9 0 0 1 1.8 0v4.8h.9V3.4a.9.9 0 0 1 1.8 0v5.4a3.4 3.4 0 0 1-2.7 3.3v8.5a1.3 1.3 0 0 1-2.6 0v-8.5a3.4 3.4 0 0 1-2.7-3.3V3.4c0-.5.4-.9.9-.9zm11.2 0c.6 0 1 .5 1 1.1v17a1.3 1.3 0 0 1-2.6 0v-5.4h-1.4c-.5 0-.9-.4-.9-.9V8.1c0-3.3 1.7-5.6 3.9-5.6z" />,
  check: <path d="M12 2.5a9.5 9.5 0 1 1 0 19 9.5 9.5 0 0 1 0-19zm4.2 6.3a1 1 0 0 0-1.4.1l-4 4.7-1.6-1.6a1 1 0 1 0-1.4 1.4l2.4 2.4a1 1 0 0 0 1.5-.1l4.6-5.5a1 1 0 0 0-.1-1.4z" />,
  figure: <path d="M12 2.5a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8zM6 8.4h12a1.1 1.1 0 0 1 .2 2.2l-3.7.8v3.4l1.8 5.6a1.2 1.2 0 0 1-2.3.8L12 15.9l-2 5.3a1.2 1.2 0 0 1-2.3-.8l1.8-5.6v-3.4l-3.7-.8A1.1 1.1 0 0 1 6 8.4z" />,
  drop: <path d="M12 2.8c.3 0 .6.1.8.4 3.5 4.4 6.2 8.2 6.2 11.6a7 7 0 0 1-14 0c0-3.4 2.7-7.2 6.2-11.6.2-.3.5-.4.8-.4z" />,
  lungs: <path d="M11 3.5h2v6.2l2.4 1.7V6.8c0-1.3 1-2.3 2.3-2.3 1.6 0 2.7 1.6 3.2 4.1.6 3.2.6 6.8.1 9.4-.3 1.6-1.6 2.5-3.2 2.5-2 0-3.5-1.6-3.5-3.6v-3.6L12 11.9l-2.3 1.4v3.6c0 2-1.5 3.6-3.5 3.6-1.6 0-2.9-.9-3.2-2.5-.5-2.6-.5-6.2.1-9.4.5-2.5 1.6-4.1 3.2-4.1 1.3 0 2.3 1 2.3 2.3v4.6L11 9.7z" />,
  scale: <path d="M7 3.5h10a3.5 3.5 0 0 1 3.5 3.5v10a3.5 3.5 0 0 1-3.5 3.5H7A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5zm5 3a5.5 5.5 0 0 0-5 3.2l2.5 1.2a2.8 2.8 0 0 1 1.9-1.5l.4 2.4a1 1 0 0 0 2 0l.4-2.4c.8.2 1.5.8 1.9 1.5l2.5-1.2a5.5 5.5 0 0 0-5-3.2z" />,
  bone: <path d="M7.2 3a2.9 2.9 0 0 1 2.7 3.9l7.2 7.2a2.9 2.9 0 1 1 1.9 5.4 2.9 2.9 0 1 1-5.4-1.9l-7.2-7.2A2.9 2.9 0 1 1 4.5 5a2.9 2.9 0 0 1 2.7-2z" />,
  dna: <path d="M7 2.5a1 1 0 0 1 1 1c0 2.3 1.5 3.8 3.4 5.1l.6.4.6-.4C14.5 7.3 16 5.8 16 3.5a1 1 0 1 1 2 0c0 3.3-2.1 5.3-4.3 6.8C15.9 11.8 18 13.8 18 17v3.5a1 1 0 1 1-2 0V17c0-.3 0-.7-.1-1H8.1c-.1.3-.1.7-.1 1v3.5a1 1 0 1 1-2 0V17c0-3.2 2.1-5.2 4.3-6.7C8.1 8.8 6 6.8 6 3.5a1 1 0 0 1 1-1zm5 9.1c-1 .7-2.1 1.5-2.9 2.4h5.8c-.8-.9-1.9-1.7-2.9-2.4z" />,
  bell: <path d="M12 2.5a1.5 1.5 0 0 1 1.5 1.5v.5a6 6 0 0 1 4.5 5.8v3.4l1.6 2.6c.4.7-.1 1.7-.9 1.7H5.3c-.8 0-1.3-1-.9-1.7L6 13.7v-3.4a6 6 0 0 1 4.5-5.8V4A1.5 1.5 0 0 1 12 2.5zM9.5 19h5a2.5 2.5 0 0 1-5 0z" />,
  spark: <path d="M10 3.5c.5 3.9 2.6 6 6.5 6.5-3.9.5-6 2.6-6.5 6.5-.5-3.9-2.6-6-6.5-6.5 3.9-.5 6-2.6 6.5-6.5zm8 10c.3 2 1.3 3 3.3 3.3-2 .3-3 1.3-3.3 3.3-.3-2-1.3-3-3.3-3.3 2-.3 3-1.3 3.3-3.3z" />,
};

export function Glyph({ name, size = 17, className }: { name: GlyphName; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {PATHS[name]}
    </svg>
  );
}

/** Each reading's mark. */
export const METRIC_GLYPH: Record<string, GlyphName> = {
  steps: "steps",
  activity: "flame",
  kcal: "flame",
  workouts: "figure",
  distance: "route",
  sleep: "moon",
  deep: "waves",
  temp: "thermo",
  capacity: "gauge",
  rhr: "heart",
  hrv: "pulse",
  bp: "heart",
  pulse: "pulse",
  spo2: "lungs",
  bpd: "heart",
  spo2d: "lungs",
  respd: "lungs",
  sleepscore: "moon",
  consistency: "check",
  efficiency: "gauge",
  hoursneeds: "moon",
  restorative: "waves",
  resp: "lungs",
  crp: "drop",
  diet: "fork",
  habits: "check",
  glucose: "drop",
  diversity: "dna",
  weight: "scale",
  bmi: "figure",
  bodyfat: "figure",
  visceral: "figure",
  bone: "bone",
  skin: "drop",
};

export const glyphOf = (id: string): GlyphName => METRIC_GLYPH[id] ?? "pulse";

/** A card's kind line: the mark and the name in the category's colour, and a small chevron saying it opens. */
export function Kind({ name, children }: { name: GlyphName; children: ReactNode }) {
  return (
    <span className="v2-kind">
      <Glyph name={name} size={16} />
      <span>{children}</span>
      <svg className="v2-kind-go" width="8" height="13" viewBox="0 0 8 13" fill="none" aria-hidden>
        <path d="M1.5 1.5 6.5 6.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
