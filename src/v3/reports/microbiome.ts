import type { GutFinding, GutIcon, GutMetricRow, GutReport, GutSection } from "@/data/reportsGut";
import { M, trim, type Rec } from "../study/data";

/*
 * The gut and oral reports, read from the clinic portal's member the way the
 * portal's presentation reads them: each diversity index against the report's
 * own reference range, a phylum by the pipeline's increased/decreased flag,
 * and a condition score (0 to 1, low end disease-associated) flagged only in
 * its low band. A section's score is the share of its readings in range, and
 * the overall score is the mean of the three sections, which is how the app's
 * captured report adds up (25, 20 and 71 make 39).
 */

type Mode = "gut" | "oral";

const RANGES = {
  fb: { low: 0.2, high: 1.7 },
  richness: { low: 115, high: 300 },
  evenness: { low: 0.65, high: 1 },
  shannon: { low: 4.25, high: 7 },
};

type Level = "Low" | "Normal" | "High";
const levelOf = (v: number, r: { low: number; high: number }): Level => (v < r.low ? "Low" : v > r.high ? "High" : "Normal");

const LOW_DIVERSITY =
  "The microbial diversity in your sample could be better. A richer community helps your microbiome resist disease; the recommendations below suggest ways to increase it.";
const GOOD_DIVERSITY = "This reading sits inside the healthy reference range for your sample.";
const HIGH_READING = "This reading sits above the reference range; your clinician will look at it together with your other results.";

const RECOMMEND: Record<string, string> = {
  fb: "You can increase the number of Bacteroidetes by changing your diet to one rich in fiber from sources such as flaxseed, legumes, and whole grains.",
  richness: "Enriching your diet with insoluble fibers supports microbial diversity. Whole grains, rice, fruits, and vegetables are rich sources of fiber.",
  evenness:
    "Overall microbial diversity increases with the consumption of probiotics, fermented foods, vegetables, and other healthy foods, while reducing the intake of sugar, red meat, and processed foods.",
  shannon: "Enriching your diet with insoluble fibers supports microbial diversity. Whole grains, rice, fruits, and vegetables are rich sources of fiber.",
};

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
const mark = (score: number): GutSection["mark"] => (score < 50 ? "alert" : "check");
/** a condition's title as the pipeline spells it, cleaned of stray case and spaces */
const named = (s: string) => {
  const t = s.trim();
  return t === t.toUpperCase() ? t.charAt(0) + t.slice(1).toLowerCase() : t;
};
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

interface Index {
  key: keyof typeof RANGES;
  icon: GutIcon;
  title: string;
  sub: string;
  value: number;
  shown: string;
}

function indices(r: Rec): Index[] {
  return [
    { key: "fb", icon: "compare", title: "Firmicutes / Bacteroidetes (F/B) Ratio", sub: "F/B ratio measurement", value: r.fb, shown: trim(r.fb, 2) },
    { key: "richness", icon: "pie", title: "Richness", sub: "Number of different species", value: r.richness, shown: `${r.richness} species` },
    { key: "evenness", icon: "balance", title: "Evenness", sub: "Distribution balance", value: r.evenness, shown: trim(r.evenness, 2) },
    { key: "shannon", icon: "dots", title: "Diversity", sub: "Shannon diversity index", value: r.shannon, shown: trim(r.shannon, 2) },
  ].filter((x) => typeof x.value === "number") as Index[];
}

function chipOf(x: Index, level: Level): string {
  switch (x.key) {
    case "fb":
      return `${level === "Normal" ? "Balanced" : level} F/B ratio (${trim(x.value, 1)})`;
    case "richness":
      return `${level} richness (${x.value} species)`;
    case "evenness":
      return `${level} evenness`;
    default:
      return `${level} Shannon diversity`;
  }
}

function diversity(r: Rec): { section: GutSection; items: GutFinding[] } {
  const xs = indices(r).map((x) => ({ x, level: levelOf(x.value, RANGES[x.key]) }));
  const inRange = xs.filter((e) => e.level === "Normal").length;
  const score = pct(inRange, xs.length);
  const rows: GutMetricRow[] = xs.map(({ x, level }) => ({ icon: x.icon, title: x.title, sub: x.sub, tag: level === "Normal" ? undefined : level, value: x.shown }));
  return {
    section: {
      id: "diversity",
      icon: "leaf",
      title: "Diversity Analysis",
      sub: "Species richness & microbial balance evaluation",
      score,
      mark: mark(score),
      chips: xs.map(({ x, level }) => chipOf(x, level)),
      findings: xs.length,
      stats: [
        [xs.length, "Total Metrics"],
        [inRange, "In Range"],
        [xs.length - inRange, "Out of Range"],
      ],
      listTitle: "Your Microbiome Diversity",
      rows,
      aboutTitle: "About Diversity Analysis",
      about:
        "Your microbiome diversity is measured through multiple indices including species richness, Shannon diversity index, evenness and the Firmicutes/Bacteroidetes ratio. Higher diversity typically indicates better health and resilience.",
    },
    items: xs.map(({ x, level }) => ({
      icon: x.icon,
      title: x.title,
      sub: x.sub,
      status: level,
      value: x.shown,
      num: Number(x.shown.replace(/[^\d.]/g, "")),
      min: RANGES[x.key].low,
      max: RANGES[x.key].high,
      analysis: level === "Low" ? LOW_DIVERSITY : level === "High" ? HIGH_READING : GOOD_DIVERSITY,
      recommendation: RECOMMEND[x.key],
    })),
  };
}

function balance(r: Rec): GutSection {
  const phyla: Rec[] = r.phyla ?? [];
  const off = phyla.filter((p) => p.flag && p.flag !== "normal");
  const score = pct(phyla.length - off.length, phyla.length);
  return {
    id: "balance",
    icon: "balance",
    title: "Bacterial Balance",
    sub: "Population distribution across major phyla",
    score,
    mark: mark(score),
    chips: [off.length ? `${plural(off.length, "phylum", "phyla")} out of range` : "All phyla in range", ...off.map((p) => `p__${p.name} ${p.flag === "increased" ? "elevated" : "low"}`)],
    findings: phyla.length,
    stats: [
      [phyla.length, "Phyla"],
      [phyla.length - off.length, "Normal"],
      [off.length, "Imbalanced"],
    ],
    listTitle: "Your Bacterial Populations",
    rows: phyla.map((p) => ({ icon: "dots", title: `p__${p.name}`, sub: "Bacterial phylum", tag: p.flag ?? undefined, value: `${trim(p.value, 1)}%` })),
    aboutTitle: "About Bacterial Balance",
    about:
      "Your bacterial balance compares the relative abundance of the five largest phyla in your sample with a reference population: above its upper quartile is increased, below its lower quartile decreased.",
  };
}

function risk(r: Rec, mode: Mode): { section: GutSection; items: GutFinding[] } {
  const scores: Rec[] = r.scores ?? [];
  const high = scores.filter((s) => s.band === "Low");
  const score = scores.length ? Math.round((scores.reduce((t, s) => t + Number(s.score), 0) / scores.length) * 100) : 0;
  const lowest = scores[0];
  const row = (s: Rec): GutMetricRow => ({ icon: "gut_shield", title: named(s.name), sub: "Condition score, 0 to 100", tag: s.band, value: `${Math.round(s.score * 100)}` });
  return {
    section: {
      id: "risk",
      icon: "gut_shield",
      title: "Health Risk Assessment",
      sub: "Disease-associated bacterial markers",
      score,
      mark: mark(score),
      chips: [
        `${plural(scores.length - high.length, "condition")} low risk`,
        `${plural(high.length, "condition")} high risk`,
        ...(lowest ? [`${named(lowest.name)} lowest (${Math.round(lowest.score * 100)})`] : []),
      ],
      findings: scores.length,
      stats: [
        [scores.length, "Conditions"],
        [scores.length - high.length, "Low Risk"],
        [high.length, "High Risk"],
      ],
      listTitle: "Your Lowest Scores",
      rows: scores.slice(0, 5).map(row),
      aboutTitle: "About Health Risk Assessment",
      about: `Each condition is scored from 0 to 100 from the bacteria associated with it in your ${mode} sample; a low score means the disease-associated bacteria outweigh the protective ones.`,
    },
    items: scores.map((s) => {
      const m = row(s);
      return { icon: m.icon, title: m.title, sub: m.sub, status: s.band, value: m.value, num: NaN, min: NaN, max: NaN, analysis: "", recommendation: "" };
    }),
  };
}

/** The member's latest gut or oral record as the app's microbiome report. */
export function microbiomeReport(mode: Mode): GutReport | null {
  const rows: Rec[] = mode === "gut" ? M.gut : M.oral;
  const r = rows?.[rows.length - 1];
  if (!r) return null;
  const div = diversity(r);
  const bal = balance(r);
  const rk = risk(r, mode);
  const sections = [div.section, bal, rk.section];
  const score = Math.round(sections.reduce((t, s) => t + s.score, 0) / sections.length);
  const where = mode === "gut" ? "digestive system" : "mouth";
  return {
    title: mode === "gut" ? "Gut Health Analysis" : "Oral Health Analysis",
    intro: `Your ${mode} microbiome analysis reveals insights about bacterial diversity, population balance, and health implications based on your unique microbial composition. Sample taken ${r.date}.`,
    score,
    scoreLabel: score >= 75 ? "Good" : score >= 50 ? "Fair" : "Needs Attention",
    overview: `Your ${mode} microbiome analysis reveals the composition and diversity of bacteria in your ${where}, providing insights into your health, immune function, and disease risk.`,
    sections,
    findings: {
      diversity: {
        title: "Diversity Analysis",
        heading: "Microbiome Diversity",
        headingSub: "Detailed analysis of species richness and distribution",
        body: "Each index is shown against the report's reference range: richness 115 to 300 species, Shannon 4.25 to 7, evenness 0.65 to 1, F/B ratio 0.2 to 1.7.",
        items: div.items,
      },
      risk: {
        title: "Health Risk Assessment",
        heading: "Condition Scores",
        headingSub: "Every condition, lowest score first",
        body: rk.section.about,
        items: rk.items,
      },
    },
  };
}
