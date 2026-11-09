import type { GlyphName } from "../ui/glyphs";
import type { Tone } from "../study/parts";
import { HAS, M, pick, trim, visitDate, type Rec } from "../study/data";
import { LATEST, readingOf, REGIONS, toneOf } from "../twin/regions";

/** One sub-reading in a card's two-column row: its name, its value, a muted line under it. */
export interface Stat {
  label: string;
  value: string;
  sub?: string;
}

/** What the ring draws: one arc filled to a share, or a set of shares laid end to end. */
export interface RingSpec {
  fill?: number;
  segs?: number[];
  center?: string;
  /** one colour field per part, when the parts are different studies */
  fields?: string[];
}

/** Everything one omics study puts on the page: its chip, its headline and its card. */
export interface Topic {
  id: string;
  name: string;
  field: string;
  glyph: GlyphName;
  /** the chip's second line: the study's own lead reading, nothing more */
  chip: string;
  tone: Tone;
  /** the card's bold line */
  status: string;
  key: { label: string; value: string };
  ring: RingSpec;
  stats: Stat[];
  insight: string;
  /** the page headline and its muted line when this study's chip is selected */
  title: string;
  support: string;
}

/* the presentation's omics studies, each in a Home field with its own object */
export const PANELS: { id: string; field: string; glyph: GlyphName }[] = [
  { id: "genomics", field: "body", glyph: "dna" },
  { id: "transcriptomics", field: "heart", glyph: "pulse" },
  { id: "proteomics", field: "capacity", glyph: "gauge" },
  { id: "metabolomics", field: "vitals", glyph: "drop" },
  { id: "guthealth", field: "habit", glyph: "waves" },
  { id: "oralhealth", field: "activity", glyph: "check" },
];

const fmt = (n: number) => n.toLocaleString("en-US");
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
/** a condition's name without the clinical gloss in brackets */
const short = (s: string) => s.replace(/\s*\(.*\)\s*$/, "").trim();
/** the first record of a series when it is an earlier visit than the latest one */
const earliest = (rows: Rec[]): Rec | undefined => (rows.length > 1 && rows[0].visit !== pick(rows, LATEST).visit ? rows[0] : undefined);

function genomics(): Omit<Topic, "id" | "name" | "field" | "glyph"> {
  const g = M.genome;
  const v = readingOf("genomics");
  const tone = toneOf(v);
  const total = g.veryImportant + g.important + g.noteworthy;
  return {
    chip: tone === "ok" || !tone ? "Clear" : `${v.value} to discuss`,
    tone,
    status: v.status ?? v.label ?? "",
    key: { label: "Sequenced", value: g.date },
    ring: { segs: total ? [g.veryImportant, g.important, g.noteworthy] : [], fill: total ? undefined : 1 },
    stats: [
      { label: "Monitor closely", value: plural(g.important, "finding") },
      { label: "For information", value: plural(g.noteworthy, "finding") },
    ],
    insight: g.lead ? `Leading finding: ${g.lead}.` : "Your genome is read once; it does not change between visits.",
    title: "Your genome, read once",
    support: `Your genome was sequenced on ${g.date}. It does not change between visits, so these findings stay with you.`,
  };
}

function transcriptomics(): Omit<Topic, "id" | "name" | "field" | "glyph"> {
  const t = pick(M.transcriptome, LATEST);
  const first = earliest(M.transcriptome);
  const v = readingOf("transcriptomics");
  const gap = t.predicted - t.chronological;
  const signals = t.signals as Rec[];
  return {
    chip: `${trim(t.predicted)} yrs`,
    tone: toneOf(v),
    status: v.status ?? "",
    key: { label: "Biological age", value: `${trim(t.predicted)} years` },
    ring: { fill: Math.min(1, t.predicted / Math.max(t.chronological, t.predicted)), center: trim(t.predicted) },
    stats: [
      { label: "Calendar age", value: `${trim(t.chronological, 0)} years`, sub: `At ${visitDate(LATEST)}` },
      first
        ? { label: "Since first visit", value: `${t.predicted - first.predicted > 0 ? "+" : ""}${trim(t.predicted - first.predicted)} years`, sub: `From ${trim(first.predicted)} on ${first.date}` }
        : { label: "Condition signals", value: signals.length ? String(signals.length) : "None", sub: signals[0]?.name },
    ],
    insight: signals.length
      ? `${plural(signals.length, "condition signal")} to look at, led by ${signals[0].name}.`
      : "No condition signals in your latest transcriptome.",
    title: gap <= -2 ? "Younger than your years" : gap >= 2 ? "Older than your years" : "In step with your age",
    support: `Your transcriptome reads ${trim(t.predicted)} years against your ${trim(t.chronological, 0)}.`,
  };
}

function proteomics(): Omit<Topic, "id" | "name" | "field" | "glyph"> {
  const p = pick(M.proteomics, LATEST);
  const systems = p.systems as Rec[];
  const flagged = systems.filter((s) => s.status !== "typical");
  const typical = systems.length - flagged.length;
  const top = (p.highlights as Rec[])[0];
  return {
    chip: `${typical} of ${systems.length}`,
    tone: toneOf(readingOf("proteomics")),
    status: readingOf("proteomics").status ?? "",
    key: { label: "Body systems typical", value: `${typical} of ${systems.length}` },
    ring: { fill: systems.length ? typical / systems.length : 0, center: String(typical) },
    stats: [
      { label: "Proteins", value: fmt(p.proteins), sub: "Measured" },
      flagged.length
        ? { label: "To discuss", value: plural(flagged.length, "system"), sub: flagged[0].name }
        : { label: "To discuss", value: "None", sub: "Every system typical" },
    ],
    insight: top ? `Closest resemblance: ${short(top.name)}, ${top.score} of 100. A resemblance, not a diagnosis.` : "Every body system reads typical.",
    title: flagged.length === 0 ? "Every system looks typical" : typical > flagged.length ? "Most systems look typical" : "Systems to talk through",
    support: `${typical} of ${systems.length} body systems look typical across ${fmt(p.proteins)} proteins.`,
  };
}

function metabolomics(): Omit<Topic, "id" | "name" | "field" | "glyph"> {
  const runs = (M.metabolomics as Rec[]).map((m) => ({ name: m.name as string, rec: pick(m.visits, LATEST) }));
  const n = M.overview.metabolitesAt[String(LATEST)] ?? M.overview.metabolites;
  return {
    chip: `${n} measured`,
    tone: "",
    status: `${n} metabolites`,
    key: { label: "Samples", value: plural(runs.length, "sample") },
    ring: { segs: runs.map((r) => r.rec.measured), center: String(n) },
    stats: runs.map((r) => ({ label: r.name, value: `${r.rec.measured}`, sub: r.rec.top[0] ? `Top: ${r.rec.top[0].name}` : undefined })),
    insight: "Each sample is ranked within itself only, so the most abundant leads each list.",
    title: "Your chemistry, measured",
    support: `${n} distinct metabolites across ${runs.map((r) => r.name.toLowerCase()).join(", ")}.`,
  };
}

function microbes(rows: Rec[], where: string): Omit<Topic, "id" | "name" | "field" | "glyph"> {
  const r = pick(rows, LATEST);
  const first = earliest(rows);
  const phyla = (r.phyla as Rec[]) ?? [];
  const lead = phyla[0];
  const delta = first ? r.richness - first.richness : 0;
  return {
    chip: `${r.richness} species`,
    tone: "",
    status: first ? (delta > 0 ? "Richer than before" : delta < 0 ? "Fewer species than before" : "Holding steady") : "Species richness",
    key: { label: "Species", value: String(r.richness) },
    ring: { segs: phyla.map((p) => p.value), center: String(r.richness) },
    stats: [
      { label: "Diversity", value: trim(r.shannon, 2), sub: `Evenness ${trim(r.evenness, 2)}` },
      lead ? { label: "Leading phylum", value: `${trim(lead.value)}%`, sub: lead.name } : { label: "Leading phylum", value: "None" },
    ],
    insight: first
      ? `${r.richness} species, ${delta >= 0 ? "up" : "down"} from ${first.richness} on ${first.date}.`
      : `${r.richness} species in your sample of ${visitDate(LATEST)}.`,
    title: first ? (delta > 0 ? `Your ${where} microbiome is getting richer` : delta < 0 ? `Fewer ${where} species than before` : `Your ${where} microbiome is holding steady`) : `Your ${where} microbiome`,
    support: first ? `${r.richness} species at your latest sample, against ${first.richness} on ${first.date}.` : `${r.richness} species in your first sample.`,
  };
}

const BUILD: Record<string, () => Omit<Topic, "id" | "name" | "field" | "glyph">> = {
  genomics,
  transcriptomics,
  proteomics,
  metabolomics,
  guthealth: () => microbes(M.gut, "gut"),
  oralhealth: () => microbes(M.oral, "oral"),
};

/** the omics studies this member has results for, in the presentation's order */
export const TOPICS: Topic[] = PANELS.filter((p) => HAS(p.id)).map((p) => ({ ...p, name: REGIONS[p.id]?.name ?? p.id, ...BUILD[p.id]() }));
