import type { ReactNode } from "react";

/*
 * Omics tab marks: solid, rounded shapes in each study's own hue, drawn on a 24
 * grid, one per molecule the test reads. The overview mark gathers every hue.
 */

function Mark({ children, size = 26 }: { children: ReactNode; size?: number }) {
  return (
    <svg className="om-tabmark" width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {children}
    </svg>
  );
}

/** Overview: six petals, one per study, in the studies' own hues. */
export function MarkAll({ fields }: { fields: string[] }) {
  const n = Math.max(fields.length, 1);
  return (
    <Mark>
      {fields.map((f, i) => (
        <ellipse key={f + i} cx="12" cy="6.4" rx="3.3" ry="4.6" transform={`rotate(${(360 / n) * i} 12 12)`} data-field={f} className="om-petal" />
      ))}
      <circle cx="12" cy="12" r="2.2" fill="var(--v-card)" />
    </Mark>
  );
}

const MARKS: Record<string, ReactNode> = {
  // the double helix: two strands crossing, with base pairs between them
  genomics: (
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      <path strokeWidth="2.6" d="M7.5 3c0 4.5 9 4.5 9 9s-9 4.5-9 9" />
      <path strokeWidth="2.6" d="M16.5 3c0 4.5-9 4.5-9 9s9 4.5 9 9" opacity="0.55" />
      <path strokeWidth="1.8" d="M9.2 6h5.6M9.2 18h5.6" />
    </g>
  ),
  // one strand read off the genome: a single wave with its bases hanging from it
  transcriptomics: (
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      <path strokeWidth="2.6" d="M3 9.5c3-4 6-4 9 0s6 4 9 0" />
      <path strokeWidth="2" d="M6 9v6M12 10v8M18 9v5" opacity="0.6" />
    </g>
  ),
  // a protein: a chain of amino acids folded back on itself
  proteomics: (
    <g>
      <path d="M5.5 7.5 11 5l5.5 3.5-1 6L10 17l-3.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      <circle cx="5.5" cy="7.5" r="2.3" fill="currentColor" />
      <circle cx="11" cy="5" r="2.3" fill="currentColor" />
      <circle cx="16.5" cy="8.5" r="2.3" fill="currentColor" />
      <circle cx="15.5" cy="14.5" r="2.3" fill="currentColor" />
      <circle cx="10" cy="17" r="2.3" fill="currentColor" />
      <circle cx="6.5" cy="19.5" r="1.8" fill="currentColor" opacity="0.7" />
    </g>
  ),
  // a small molecule: a ring of carbon with one bond leading off it
  metabolomics: (
    <g>
      <path d="M11 4.2 17.4 7.9v7.4L11 19 4.6 15.3V7.9z" fill="currentColor" opacity="0.22" />
      <path d="M11 4.2 17.4 7.9v7.4L11 19 4.6 15.3V7.9z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M17.4 7.9 21 5.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="21" cy="5.8" r="1.8" fill="currentColor" />
    </g>
  ),
  // the stomach and the gut leaving it
  guthealth: <path fill="currentColor" d="M4 18c.67 1.85 2.07 4 8 4c2.36 0 5.07-.07 7-2c1-1 3-3 3-9s-2-7-4-7c-1.38 0-3 0-4 2v.03a1.82 1.82 0 0 1-1.87.92C11 6.81 11 6.37 11 6V2H9v4a2.92 2.92 0 0 0 3 3c1 0 1 1.78 1 3c0 1.89-.5 3.26-2 4c-2.31 1.15-4.61 1-5.39-.53a1.5 1.5 0 0 0-2.47-.6A3.67 3.67 0 0 0 2 18v4h2Z" />,
  // a tooth, crown and two roots
  oralhealth: <path fill="currentColor" d="M7 2C4 2 2 5 2 8c0 2.11 1 5 2 6s2 8 4 8c4.54 0 2-7 4-7s-.54 7 4 7c2 0 3-7 4-8s2-3.89 2-6c0-3-2-6-5-6s-3 1-5 1s-2-1-5-1" />,
};

/** A study's tab mark, in its hue. */
export function OmicsMark({ id, size }: { id: string; size?: number }) {
  return <Mark size={size}>{MARKS[id] ?? <circle cx="12" cy="12" r="6" fill="currentColor" />}</Mark>;
}
