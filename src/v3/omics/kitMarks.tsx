import type { ReactNode } from "react";
import { photo } from "@/lib/asset";

/*
 * One mark per omics study, drawn on a 24 grid: a solid body in the study's hue
 * and a lighter second tone, each an abstraction of what the test reads. No two
 * share a shape.
 */
const MARKS: Record<string, ReactNode> = {
  // a helix seen side on: two ribbons trading places, three rungs between them
  Genome: (
    <>
      <path d="M6 3.5c0 4.2 12 4.3 12 8.5s-12 4.3-12 8.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M18 3.5c0 4.2-12 4.3-12 8.5s12 4.3 12 8.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.4" />
      <path d="M8.5 6.6h7M8.5 17.4h7M10.6 12h2.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    </>
  ),
  // a tooth, crown and two roots
  Oral: <path d="M7 2C4 2 2 5 2 8c0 2.11 1 5 2 6s2 8 4 8c4.54 0 2-7 4-7s-.54 7 4 7c2 0 3-7 4-8s2-3.89 2-6c0-3-2-6-5-6s-3 1-5 1s-2-1-5-1" fill="currentColor" />,
  // the stomach and the gut leaving it
  Gut: <path d="M4 18c.67 1.85 2.07 4 8 4c2.36 0 5.07-.07 7-2c1-1 3-3 3-9s-2-7-4-7c-1.38 0-3 0-4 2v.03a1.82 1.82 0 0 1-1.87.92C11 6.81 11 6.37 11 6V2H9v4a2.92 2.92 0 0 0 3 3c1 0 1 1.78 1 3c0 1.89-.5 3.26-2 4c-2.31 1.15-4.61 1-5.39-.53a1.5 1.5 0 0 0-2.47-.6A3.67 3.67 0 0 0 2 18v4h2Z" fill="currentColor" />,
  // the female sign
  Vaginal: <path d="M11 19h-1q-.425 0-.712-.288T9 18t.288-.712T10 17h1v-2.1q-1.975-.35-3.238-1.888T6.5 9.45q0-2.275 1.613-3.862T12 4t3.888 1.588T17.5 9.45q0 2.025-1.263 3.563T13 14.9V17h1q.425 0 .713.288T15 18t-.288.713T14 19h-1v1q0 .425-.288.713T12 21t-.712-.288T11 20zm3.475-7.025Q15.5 10.95 15.5 9.5t-1.025-2.475T12 6T9.525 7.025T8.5 9.5t1.025 2.475T12 13t2.475-1.025" fill="currentColor" />,
  // a protein folding: beads on a chain that doubles back
  Proteome: (
    <>
      <path d="M4.5 18c0-4 4-4 4-8s4-6 7-3-1 6 2 8.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
      <circle cx="4.5" cy="18" r="2.2" fill="currentColor" />
      <circle cx="8.5" cy="10" r="2.2" fill="currentColor" />
      <circle cx="15.5" cy="7" r="2.2" fill="currentColor" />
      <circle cx="17.5" cy="15.5" r="2.2" fill="currentColor" />
    </>
  ),
  // genes switching on: a strand with readouts of different heights standing on it
  Transcriptome: (
    <>
      <path d="M3 18.5h18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="5" y="11" width="2.6" height="5.2" rx="1.3" fill="currentColor" opacity="0.5" />
      <rect x="9.3" y="5" width="2.6" height="11.2" rx="1.3" fill="currentColor" />
      <rect x="13.6" y="8.5" width="2.6" height="7.7" rx="1.3" fill="currentColor" opacity="0.75" />
      <rect x="17.9" y="13" width="2.6" height="3.2" rx="1.3" fill="currentColor" opacity="0.4" />
    </>
  ),
  // a small molecule: a carbon ring with one bond leading away
  Metabolome: (
    <>
      <path d="M10 5.2 15.6 8.4v6.4L10 18l-5.6-3.2V8.4z" fill="currentColor" opacity="0.25" />
      <path d="M10 5.2 15.6 8.4v6.4L10 18l-5.6-3.2V8.4z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M15.6 14.8 19.6 17.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="19.8" cy="17.3" r="1.9" fill="currentColor" />
    </>
  ),
  // a lipid bilayer: two rows of heads facing out, tails meeting in the middle
  Lipidome: (
    <>
      {[5, 9.5, 14, 18.5].map((x) => (
        <g key={x}>
          <circle cx={x} cy="5.2" r="2" fill="currentColor" />
          <circle cx={x} cy="18.8" r="2" fill="currentColor" />
          <path d={`M${x} 7.6v3.2M${x} 13.2v3.2`} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </g>
      ))}
    </>
  ),
};

/** A study's hue: each of the eight its own. */
export const KIT_FIELD: Record<string, string> = {
  Genome: "body",
  Oral: "activity",
  Gut: "habit",
  Vaginal: "rose",
  Proteome: "capacity",
  Transcriptome: "heart",
  Metabolome: "vitals",
  Lipidome: "food",
};

/** A study's mark on a tile of its hue; untested, both turn grey. */
export function KitMark({ name }: { name: string }) {
  return (
    <span className="om-kit" aria-hidden>
      <svg width="24" height="24" viewBox="0 0 24 24">
        {MARKS[name] ?? <circle cx="12" cy="12" r="6" fill="currentColor" />}
      </svg>
    </span>
  );
}

/** Kits with a real box to show, by test id: the product photo stands in for the mark. */
const KIT_PHOTO: Record<string, string> = {
  genetic: "kit_genome",
  sports: "kit_sports",
  carrier: "kit_carrier",
  newborn: "kit_newborn",
  gut: "kit_gut",
  oral: "kit_oral",
};

/** A test's picture: its product photo when there is one, otherwise its family's mark. */
export function KitThumb({ id, family }: { id: string; family: string }) {
  const src = KIT_PHOTO[id];
  if (!src) return <KitMark name={family} />;
  return (
    <span className="om-kit om-kit-photo" aria-hidden>
      <img src={photo(`insights/pick/${src}.jpg`)} alt="" draggable={false} />
    </span>
  );
}
