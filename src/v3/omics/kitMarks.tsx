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
  // the mouth as an open arc, with the microbes it holds rising above it
  Oral: (
    <>
      <path d="M4 11.5a8 8 0 0 0 16 0z" fill="currentColor" />
      <path d="M7.5 14.6h9" stroke="var(--om-tile, #fff)" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
      <circle cx="8" cy="6.5" r="1.7" fill="currentColor" opacity="0.45" />
      <circle cx="12.5" cy="4.5" r="1.3" fill="currentColor" opacity="0.35" />
      <circle cx="16.5" cy="7" r="2" fill="currentColor" opacity="0.55" />
    </>
  ),
  // the gut as one thick line folding back on itself
  Gut: (
    <>
      <path d="M5 5h11a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="19" cy="17" r="1.9" fill="currentColor" opacity="0.5" />
      <circle cx="5" cy="5" r="1.9" fill="currentColor" opacity="0.5" />
    </>
  ),
  // an almond of two arcs, a small colony held inside it
  Vaginal: (
    <>
      <path d="M12 3c5 3.4 5 14.6 0 18-5-3.4-5-14.6 0-18z" fill="currentColor" opacity="0.25" />
      <path d="M12 3c5 3.4 5 14.6 0 18-5-3.4-5-14.6 0-18z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="11" cy="10" r="1.6" fill="currentColor" />
      <circle cx="13" cy="14.2" r="1.25" fill="currentColor" />
    </>
  ),
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
