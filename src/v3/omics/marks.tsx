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
  // the gut's microbes: one rod-shaped bacterium and two smaller cells beside it
  guthealth: (
    <g>
      <rect x="3.5" y="8.5" width="13" height="7" rx="3.5" transform="rotate(-35 10 12)" fill="currentColor" />
      <circle cx="18" cy="16.5" r="2.6" fill="currentColor" opacity="0.6" />
      <circle cx="17.5" cy="6" r="1.8" fill="currentColor" opacity="0.4" />
    </g>
  ),
  // a tooth, crown and two roots
  oralhealth: (
    <path
      fill="currentColor"
      d="M7.6 3.6c1.6 0 2.6.9 4.4.9s2.8-.9 4.4-.9c2.5 0 4 2 4 4.7 0 2.4-1 4-1.8 5.6-.8 1.7-1 3.6-1.5 5.4-.4 1.4-1 2-1.8 2-.9 0-1.2-.8-1.5-2.2l-.6-2.8c-.2-.9-.6-1.3-1.2-1.3s-1 .4-1.2 1.3l-.6 2.8c-.3 1.4-.6 2.2-1.5 2.2-.8 0-1.4-.6-1.8-2-.5-1.8-.7-3.7-1.5-5.4-.8-1.6-1.8-3.2-1.8-5.6 0-2.7 1.5-4.7 4-4.7z"
    />
  ),
};

/** A study's tab mark, in its hue. */
export function OmicsMark({ id, size }: { id: string; size?: number }) {
  return <Mark size={size}>{MARKS[id] ?? <circle cx="12" cy="12" r="6" fill="currentColor" />}</Mark>;
}
