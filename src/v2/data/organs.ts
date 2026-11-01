import type { OrganId, Status } from "./metrics";

export type Lens = "vitals" | "body" | "omics";

export interface Organ {
  id: OrganId;
  name: string;
  /** cell map the field morphs into; body = the figure stays and the region lights */
  map: string;
  /** region on the figure, in the viewer's own 200×560 SVG units */
  at: [number, number];
  radius: [number, number];
  status: Status;
  /** proteomic age; absent where the panel does not read this organ */
  age?: number;
  /** one line on what the twin read from this organ's data */
  read: string;
  action?: string;
}

export const CHRONOLOGICAL_AGE = 42;

/* coordinates carried over from phenome-twin-mobile.html, so the regions sit where they always did */
export const ORGANS: Record<OrganId, Organ> = {
  brain: { id: "brain", name: "Brain", map: "brain", at: [100, 44], radius: [18, 22], status: "normal", age: 39, read: "Sleep is doing its job: 7 h 24 min last night and consistent bedtimes all week.", action: "Keep bedtime within 30 minutes" },
  thyroid: { id: "thyroid", name: "Thyroid", map: "thyroid", at: [100, 80], radius: [11, 8], status: "optimal", read: "TSH sits mid range. Nothing has moved since your first scan." },
  lungs: { id: "lungs", name: "Lungs", map: "lungs", at: [100, 110], radius: [31, 28], status: "optimal", age: 40, read: "Oxygen held at 97% overnight and your breathing rate is steady.", action: "Add one zone 2 session a week" },
  heart: { id: "heart", name: "Heart", map: "heart", at: [108, 122], radius: [15, 15], status: "monitor", age: 38, read: "Your heart reads four years younger than you. hs-CRP is the one marker to watch: it points at the vessels, not the muscle.", action: "Repeat hs-CRP with your clinician" },
  liver: { id: "liver", name: "Liver", map: "liver", at: [86, 156], radius: [20, 15], status: "monitor", age: 45, read: "Reads three years older than you, and BMI is the likely reason. Glucose sits at the top of its range.", action: "Lower evening carbohydrates for 8 weeks" },
  gut: { id: "gut", name: "Gut", map: "gut", at: [100, 200], radius: [26, 28], status: "optimal", read: "Microbiome diversity rose 8% since your first scan, and your food log explains why: fibre is up.", action: "Keep fibre above 30 g a day" },
  kidneys: { id: "kidneys", name: "Kidneys", map: "kidneys", at: [114, 176], radius: [13, 11], status: "normal", age: 41, read: "Filtration is stable at 98 mL/min and blood pressure is in range." },
  bone: { id: "bone", name: "Bone", map: "bone", at: [100, 240], radius: [34, 18], status: "normal", read: "Density is normal at every site. Daily steps help keep it there." },
  skin: { id: "skin", name: "Skin", map: "body", at: [100, 150], radius: [120, 200], status: "normal", read: "727 markings logged, 12 more than your first scan. None flagged for review." },
  immune: { id: "immune", name: "Immune system", map: "body", at: [100, 140], radius: [48, 72], status: "monitor", age: 47, read: "The oldest reading in your panel, five years above your age. It moves with hs-CRP and BMI, so both actions in your plan work on it.", action: "Book a clinician review" },
};

export interface Pin {
  organ: OrganId;
  /** which edge the readout hangs from, and its height in the 452px field */
  side: "l" | "r";
  y: number;
  value: string;
  unit: string;
  caption: string;
  /** gold leader and caption: this reading itself is on Monitor, or older than the member */
  flag?: boolean;
}

export interface LensDef {
  id: Lens;
  label: string;
  /** one line naming the sources painting the figure */
  line: string;
  organs: OrganId[];
  pins: Pin[];
}

/**
 * The three health categories, as lenses on one body rather than three menus.
 * Vitals is the living figure, Body its structure, Omics what it is made of.
 */
export const LENSES: Record<Lens, LensDef> = {
  vitals: {
    id: "vitals",
    label: "Vitals",
    line: "Live from your ring and band, plus your latest scan",
    organs: ["heart", "lungs", "brain", "kidneys", "thyroid"],
    pins: [
      { organ: "brain", side: "l", y: 34, value: "7:24", unit: "h", caption: "Sleep" },
      { organ: "lungs", side: "r", y: 34, value: "97", unit: "%", caption: "Blood oxygen" },
      { organ: "heart", side: "l", y: 128, value: "58", unit: "bpm", caption: "Resting heart" },
      { organ: "heart", side: "r", y: 92, value: "3.8", unit: "mg/L", caption: "hs-CRP", flag: true },
    ],
  },
  body: {
    id: "body",
    label: "Body",
    line: "From your clinic scan, 14 July",
    organs: ["liver", "bone", "skin", "gut"],
    pins: [
      { organ: "skin", side: "l", y: 34, value: "727", unit: "", caption: "Skin markings" },
      { organ: "liver", side: "l", y: 128, value: "27", unit: "kg/m²", caption: "BMI", flag: true },
      { organ: "bone", side: "r", y: 92, value: "+0.6", unit: "T", caption: "Bone density" },
    ],
  },
  omics: {
    id: "omics",
    label: "Omics",
    line: "Organ ages from your proteome",
    organs: ["immune", "liver", "kidneys", "lungs", "brain", "heart", "gut"],
    pins: [
      { organ: "immune", side: "l", y: 34, value: "47", unit: "yrs", caption: "Immune", flag: true },
      { organ: "heart", side: "r", y: 92, value: "38", unit: "yrs", caption: "Heart" },
      { organ: "liver", side: "l", y: 128, value: "45", unit: "yrs", caption: "Liver", flag: true },
    ],
  },
};

export const LENS_ORDER: Lens[] = ["vitals", "body", "omics"];

/** Organs that are on Monitor, for the twin's own summary line. */
export const MONITORING = (Object.values(ORGANS) as Organ[]).filter((o) => o.status === "monitor" && o.id !== "immune");
