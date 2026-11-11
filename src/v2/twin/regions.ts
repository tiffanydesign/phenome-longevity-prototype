import { allLabs } from "../study/blocks";
import { STUDIES, type Section } from "../study/catalog";
import { M, pick, trim, visitDate, VISITS, type Rec, type StudyView } from "../study/data";
import { viewOf } from "../study/panels";
import type { Tone } from "../study/parts";
import type { OrganId } from "../data/metrics";

/**
 * The twin's regions are the clinic presentation's studies, placed on the body.
 * Every reading, status and word comes from the study's own view (src/v2/study),
 * which is checked against the portal's presentation player, so the twin cannot
 * show anything the presentation does not.
 */
export type Lens = "vitals" | "body" | "omics";

export interface Region {
  /** the presentation's study code */
  id: string;
  name: string;
  /** cell map the field morphs into; body = the figure stays and the region lights */
  map: string;
  /** region on the figure, in the viewer's own 200×560 SVG units */
  at: [number, number];
  radius: [number, number];
  /** whole-body studies light the figure faintly rather than a part of it */
  whole?: boolean;
  /** the study's colour field, the same one everywhere it appears: its mark, its label, its organ on a list */
  field: string;
}

/*
 * One hue per study, from the app's colour fields. Neighbours on a lens differ, gold
 * stays Monitor's, and the violet and night fields are left to the pages that own them.
 */
const FIELD: Record<string, string> = {
  natural: "heart",
  eye: "vitals",
  brain: "teal",
  heart: "heart",
  lungs: "vitals",
  liver: "sand",
  kidneys: "lavender",
  thyroid: "rose",
  stomach: "food",
  composition: "activity",
  skeletal: "capacity",
  dermatology: "rose",
  genomics: "capacity",
  guthealth: "habit",
  oralhealth: "rose",
  transcriptomics: "heart",
  proteomics: "lavender",
  metabolomics: "food",
};

const WHOLE = { map: "body", at: [100, 150] as [number, number], radius: [120, 200] as [number, number], whole: true };

/* coordinates carried over from phenome-twin-mobile.html, so the organs sit where they always did */
const PLACES: Record<string, Omit<Region, "id" | "name" | "field">> = {
  natural: WHOLE,
  eye: { map: "body", at: [100, 40], radius: [14, 8] },
  brain: { map: "brain", at: [100, 44], radius: [18, 22] },
  heart: { map: "heart", at: [108, 122], radius: [15, 15] },
  lungs: { map: "lungs", at: [100, 110], radius: [31, 28] },
  liver: { map: "liver", at: [86, 156], radius: [20, 15] },
  kidneys: { map: "kidneys", at: [114, 176], radius: [13, 11] },
  thyroid: { map: "thyroid", at: [100, 80], radius: [11, 8] },
  stomach: { map: "gut", at: [96, 168], radius: [18, 14] },
  composition: WHOLE,
  skeletal: { map: "bone", at: [100, 240], radius: [34, 18] },
  dermatology: WHOLE,
  genomics: WHOLE,
  guthealth: { map: "gut", at: [100, 200], radius: [26, 28] },
  oralhealth: { map: "body", at: [100, 58], radius: [8, 6] },
  transcriptomics: WHOLE,
  proteomics: WHOLE,
  metabolomics: { map: "body", at: [100, 170], radius: [40, 50] },
};

const SECTION: Record<Lens, Section> = { vitals: "Vitals", body: "Body", omics: "Omics" };
export const LENS_ORDER: Lens[] = ["vitals", "body", "omics"];
export const LENS_LABEL: Record<Lens, string> = { vitals: "Vitals", body: "Body", omics: "Omics" };

export const REGIONS: Record<string, Region> = Object.fromEntries(STUDIES.filter((s) => PLACES[s.code]).map((s) => [s.code, { id: s.code, name: s.name, field: FIELD[s.code], ...PLACES[s.code] }]));

/** A lens's regions, in the presentation's order. */
export const regionsOf = (lens: Lens): Region[] => STUDIES.filter((s) => s.section === SECTION[lens] && REGIONS[s.code]).map((s) => REGIONS[s.code]);

/** The newest visit: the twin always reads the member as they are now. */
export const LATEST = VISITS[VISITS.length - 1];
export const readingOf = (id: string): StudyView => viewOf(id, LATEST);
export const AS_OF = `Visit ${LATEST}, ${visitDate(LATEST)}`;

/** A view's tone, or none when it is in range or carries no status. */
export const toneOf = (v: StudyView): Tone => v.tone ?? "";

export interface Pin {
  region: string;
  /** which edge the readout hangs from, and its height in the 452px field */
  side: "l" | "r";
  y: number;
  /** the presentation's own label for the reading, where the lead's caption is too long for a pin */
  caption?: string;
}

/** Where each lens hangs its readings; the reading itself is the study's lead. */
/*
 * Four places around the figure, read as a zigzag: left, right, left, right,
 * each one an even step lower than the last, so no two cards share a height and
 * the eye walks down the figure. Each lens fills them from the top in the order
 * its organs sit on the body, so every card stays beside what it reads.
 */
const STEP = [
  { side: "l", y: 36 },
  { side: "r", y: 108 },
  { side: "l", y: 180 },
  { side: "r", y: 252 },
] as const;

const PIN_PLACES: Record<Lens, Pin[]> = {
  vitals: [
    { region: "brain", ...STEP[0] },
    { region: "natural", ...STEP[1] },
    { region: "lungs", ...STEP[2] },
    { region: "heart", ...STEP[3], caption: "Heart rate" },
  ],
  body: [
    { region: "composition", ...STEP[0] },
    { region: "dermatology", ...STEP[1], caption: "Skin lesions" },
    { region: "skeletal", ...STEP[2], caption: "Fracture risk, 5 years" },
  ],
  omics: [
    { region: "transcriptomics", ...STEP[0] },
    { region: "proteomics", ...STEP[1], caption: "Body systems typical" },
    { region: "guthealth", ...STEP[2], caption: "Gut species" },
  ],
};

/** Only the pins whose study this member has results for. */
export const PINS = Object.fromEntries(LENS_ORDER.map((l) => [l, PIN_PLACES[l].filter((p) => REGIONS[p.region])])) as Record<Lens, Pin[]>;

/** The lens's headline, from the presentation's overview: the same blocks, the same numbers. */
export function summaryOf(lens: Lens): { title: string; sub: string } {
  const at = LATEST;
  if (lens === "vitals") {
    const labs = allLabs(at);
    const v = pick(M.vitals, at);
    return {
      title: labs.inRange === labs.total ? `${labs.inRange} markers in range` : `${labs.inRange} of ${labs.total} markers in range`,
      sub: `Resting heart ${v.pulseBpm} bpm · Blood pressure ${v.systolicBloodPressureMmhg}/${v.diastolicBloodPressureMmhg}`,
    };
  }
  if (lens === "body") {
    const c = pick(M.composition, at);
    const b = pick(M.bone, at);
    const s = pick(M.skin, at);
    return {
      title: `${trim(c.bodyFatPercent)}% body fat`,
      sub: `Visceral fat ${c.visceralFatRating} · Bone T-score ${trim(Math.min(...b.sites.map((x: Rec) => x.tScore)))} · Skin lesions ${s.lesions.length}`,
    };
  }
  const gut = pick(M.gut, at);
  const pr = pick(M.proteomics, at);
  // as the overview does, a layer not reported yet takes its cell with it
  const cells = [pr && `Proteins ${pr.proteins}`, M.overview.metabolites > 0 && `Metabolites ${M.overview.metabolites}`, gut && `Gut species ${gut.richness}`].filter(Boolean);
  return { title: `${M.overview.layers} molecular layers`, sub: cells.join(" · ") };
}

/** The lens a region sits under. */
export const lensOf = (id: string): Lens => LENS_ORDER.find((l) => regionsOf(l).some((r) => r.id === id)) ?? "vitals";

/** The organ drawing a region shows where there is room only for a mark; whole-body and molecular studies share the immune one. */
export const ICON: Record<string, OrganId> = {
  natural: "immune",
  eye: "brain",
  brain: "brain",
  heart: "heart",
  lungs: "lungs",
  liver: "liver",
  kidneys: "kidneys",
  thyroid: "thyroid",
  stomach: "gut",
  composition: "composition",
  skeletal: "bone",
  dermatology: "skin",
  genomics: "immune",
  guthealth: "gut",
  oralhealth: "immune",
  transcriptomics: "immune",
  proteomics: "immune",
  metabolomics: "immune",
};

/** How a lens reads, for its tab's accessible name: how many of its studies sit outside their range. */
export function lensStatus(lens: Lens): { text: string; flagged: boolean } {
  const n = regionsOf(lens).filter((r) => {
    const t = toneOf(readingOf(r.id));
    return t === "mon" || t === "alert";
  }).length;
  return n ? { text: `${n} to look at`, flagged: true } : { text: "", flagged: false };
}
