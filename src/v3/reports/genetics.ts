import type { BadgeTone, GeneticHub, HubPanel, ScreeningSummary } from "@/data/reports";
import type { ConditionFinding } from "@/data/reportsConditions";
import type { DrugCategory, DrugGroup, DrugReport, DrugRow } from "@/data/reportsDrugs";
import type { ChipIcon, Trait, TraitCategory, TraitIcon, TraitsReport } from "@/data/reportsTraits";
import { M, type Rec } from "../study/data";

/*
 * The genome's report screens, read from the clinic portal's member. The portal
 * ranks each finding the way the app does: a condition is very important,
 * important or noteworthy; a drug interaction is VIP, high or low; a trait
 * carries a level from 1 to 4 when its genotype has a known effect.
 */

const G = (): Rec => M.genetics ?? { conditions: [], drugs: [], traits: [], carrier: [], newborn: [], newbornCarrier: [] };
const count = <T,>(xs: T[], f: (x: T) => boolean) => xs.filter(f).length;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const badges = (...xs: [BadgeTone, number][]): [BadgeTone, number][] => xs.filter(([, n]) => n > 0);

/* ── conditions ── */

const TAG: Record<string, string> = { very_important: "IMMEDIATE ATTENTION", important: "MONITOR CLOSELY", noteworthy: "FOR YOUR INFORMATION" };

export function conditions(): ConditionFinding[] {
  return (G().conditions as Rec[]).map((c) => ({
    tag: TAG[c.importance] ?? "FOR YOUR INFORMATION",
    name: c.disease,
    gene: c.gene ?? "",
    variant: c.variant ?? "",
    inheritance: c.inheritance ?? "",
    rsid: c.rsid ?? "",
    zygosity: c.zygosity ?? "",
    pathogenicity: c.classification ?? "",
    sections: [
      { title: "Risk Factors", body: c.riskFactors },
      { title: "Lifestyle & Prevention", body: c.lifestyle },
      { title: "Epidemiology", body: c.epidemiology },
    ].filter((s) => s.body),
  }));
}

/* ── drugs ── */

const CATEGORIES: DrugCategory[] = ["Dosage", "Efficacy", "Metabolism/PK", "Toxicity"];
const isCategory = (c: unknown): c is DrugCategory => CATEGORIES.includes(c as DrugCategory);
const drugName = (s: string) => s.split(";").map((d) => d.trim().replace(/^./, (x) => x.toUpperCase())).join(";");

const GROUPS: { code: string; title: string; sub: string; tone: DrugGroup["tone"]; about: string }[] = [
  {
    code: "vip",
    title: "Immediate Attention Needed",
    sub: "(Major Gene-Drug Interaction)",
    tone: "red",
    about:
      "These medications are classified under PharmGKB Level 1A, meaning they have the highest level of clinical evidence. Level 1A includes drug-gene interactions with specific dosing recommendations in FDA-approved labels or clinical guidelines.",
  },
  { code: "high", title: "Monitor Closely", sub: "(Significant Gene-Drug Interaction)", tone: "orange", about: "These interactions carry good clinical evidence that the gene changes how the drug works for you." },
  { code: "low", title: "For Your Information", sub: "(Minor Gene-Drug Interaction)", tone: "grey", about: "These interactions carry limited evidence; they are worth knowing but rarely change a prescription." },
];

/** the portal's interactions in the app's four categories; an uncategorised one has no section to sit in */
const drugRows = (): Rec[] => (G().drugs as Rec[]).filter((d) => isCategory(d.category));

export function drugs(): DrugReport {
  const rows = drugRows();
  const groups: DrugGroup[] = GROUPS.map((g) => {
    const mine = rows.filter((d) => d.importance === g.code);
    const first = mine[0];
    return {
      title: g.title,
      sub: g.sub,
      tone: g.tone,
      count: mine.length,
      about: first?.annotation ? `${g.about} ${first.annotation}` : g.about,
      evidence: first?.evidence ?? "",
      modifiers: first?.modifiers ?? "",
      order: CATEGORIES.filter((c) => mine.some((d) => d.category === c)),
      rows: mine.map((d): DrugRow => ({ drug: drugName(d.drug), gene: d.gene, genotype: d.genotype, category: d.category, rsid: d.rsid ?? undefined })),
    };
  }).filter((g) => g.count > 0);
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, count(rows, (d) => d.category === c)])) as Record<DrugCategory, number>;
  return { total: rows.length, byCategory, groups };
}

/* ── traits ── */

/* the app's three hub columns; the portal's categories fall into them as the captured hub's totals do */
const SENSORY = ["Sensory Perception"];
const BEHAVIOURAL = ["Personality", "Behavior", "Neurogenic and Cognitive functions", "Substance Reaction"];
const CHIP: Record<string, ChipIcon> = { Athleticism: "chip_run", Behavior: "chip_smile", Personality: "chip_smile", Cardiovascular: "chip_heart", Hormones: "chip_sun" };
const GAUGE = (category: string): TraitIcon => (category === "Athleticism" ? "gauge_run" : SENSORY.includes(category) ? "gauge_eye" : "gauge_smile");

export function traits(): TraitsReport {
  const all = G().traits as Rec[];
  const tally = new Map<string, number>();
  all.forEach((t) => tally.set(t.category, (tally.get(t.category) ?? 0) + 1));
  const categories: TraitCategory[] = [
    { name: "All", count: all.length, icon: "chip_all" },
    ...[...tally.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, count: n, icon: CHIP[name] ?? null })),
  ];
  const list: Trait[] = all.map((t) => ({
    name: t.name,
    category: t.category,
    gene: t.gene ?? "",
    genotype: t.genotype ?? "",
    summary: t.summary ?? "",
    // a level of 1 to 4 fills the Less-to-More arc by quarters; no known effect leaves it empty
    value: typeof t.level === "number" ? t.level / 4 : 0,
    icon: GAUGE(t.category),
    description: t.description || undefined,
  }));
  return { total: all.length, categories, traits: list };
}

/* ── hub ── */

export function hub(): GeneticHub {
  const g = G();
  const c = g.conditions as Rec[];
  const urgent = count(c, (x) => x.importance === "very_important");
  const watch = count(c, (x) => x.importance === "important");
  const info = count(c, (x) => x.importance === "noteworthy");
  const carriers = (g.carrier as Rec[]).length;
  const newborn = (g.newborn as Rec[]).length;
  const cancer = count(c, (x) => /cancer|tumou?r|neoplas/i.test(`${x.category} ${x.disease}`));

  const d = drugs();
  const rows = drugRows();
  const tone = (cat: DrugCategory): [BadgeTone, number][] =>
    badges(["red", count(rows, (x) => x.category === cat && x.importance === "vip")], ["orange", count(rows, (x) => x.category === cat && x.importance === "high")]);
  const drugPanel = (icon: HubPanel["icon"], cat: DrugCategory): HubPanel => ({ icon, title: cat, sub: plural(d.byCategory[cat], "drug interaction"), badges: tone(cat), to: "/insights/genetic/drugs" });

  const t = g.traits as Rec[];
  const inCat = (names: string[]) => count(t, (x) => names.includes(x.category));
  const sensory = inCat(SENSORY);
  const behavioural = inCat(BEHAVIOURAL);
  const navy = (name: string): [BadgeTone, number][] => [["navy", inCat([name])]];

  return {
    intro: "Your DNA reveals unique insights that can help you understand your health predispositions, medication responses, and personal traits.",
    pages: [
      {
        icon: "hub_shield",
        title: "Health Conditions",
        sub: "Genetic variants related to health conditions",
        stats: [
          [urgent, "Immediate Attention Needed"],
          [watch, "Monitor Closely"],
          [carriers, "Carrier"],
          [info, "For Your Information"],
        ],
        panelsTitle: "Panels",
        panels: [
          { icon: "panel_bag", title: "Health Conditions", sub: "Predisposition to common conditions", badges: badges(["red", urgent], ["orange", watch]), chevron: true, to: "/insights/genetic/conditions" },
          { icon: "panel_pregnant", title: "Carrier Risk Screening", sub: "Genetic variants you may pass on", badges: badges(["orange", carriers]), chevron: true, to: "/insights/genetic/carrier" },
          { icon: "panel_stroller", title: "Newborn Screening", sub: "Conditions typically tested at birth", badges: badges(["red", newborn]), chevron: true, to: "/insights/genetic/newborn" },
          { icon: "panel_microscope", title: "Hereditary Cancer", sub: cancer ? "Cancer-associated genetic variants" : "No cancer-associated variants found", badges: badges(["red", cancer]), chevron: true, to: "/insights/genetic/conditions" },
        ],
        viewAll: `View All ${c.length} Findings`,
        to: "/insights/genetic/conditions",
      },
      {
        icon: "hub_medication",
        title: "Medication Response",
        sub: "How your genes affect medication response",
        stats: d.groups.map((x) => [x.count, x.title] as [number, string]),
        panelsTitle: "Drug Panels",
        panels: [drugPanel("dosage", "Dosage"), drugPanel("warning", "Toxicity"), drugPanel("verified", "Efficacy"), drugPanel("swap", "Metabolism/PK")],
        viewAll: `View All ${d.total} Findings`,
        to: "/insights/genetic/drugs",
      },
      {
        icon: "hub_psychology",
        title: "Personal Traits",
        sub: "Genetic influences on your traits",
        stats: [
          [t.length - sensory - behavioural, "Physical Traits"],
          [sensory, "Sensory Traits"],
          [behavioural, "Behavioral Traits"],
        ],
        panelsTitle: "Panels",
        panels: [
          { icon: "psychology", title: "Neurogenic & Cognitive", sub: "Brain & cognition", badges: navy("Neurogenic and Cognitive functions"), to: "/insights/genetic/traits" },
          { icon: "heart", title: "Cardiovascular", sub: "Heart traits", badges: navy("Cardiovascular"), to: "/insights/genetic/traits" },
          { icon: "shield", title: "Immune System", sub: "Defence Mechanisms", badges: navy("Immune System"), to: "/insights/genetic/traits" },
          { icon: "run", title: "Athleticism", sub: "Athletic ability", badges: navy("Athleticism"), to: "/insights/genetic/traits" },
        ],
        viewAll: `View All ${t.length} Findings`,
        to: "/insights/genetic/traits",
      },
    ],
  };
}

/* ── screening ── */

export function screening(kind: "carrier" | "newborn"): ScreeningSummary {
  const g = G();
  const findings = (kind === "carrier" ? g.carrier : g.newborn) as Rec[];
  // the newborn panel lists a disease once per transcript; one card per disease and variant reads cleaner
  const seen = new Set<string>();
  const unique = findings.filter((f) => {
    const key = `${String(f.disease).toLowerCase().replace(/[^a-z0-9]/g, "")}|${f.variant}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    intro:
      kind === "carrier"
        ? "Carrier screening looks for recessive variants you could pass on to a child, even when they cause you no symptoms."
        : "Early detection screening identifies genetic conditions that can be treated or managed when caught early in life.",
    total: unique.length,
    totalLabel: unique.length === 1 ? "Finding" : "Findings",
    findings: unique.map((f) => ({ disease: f.disease, gene: f.gene, variant: f.variant, zygosity: f.zygosity, inheritance: f.inheritance, classification: f.classification })),
  };
}
