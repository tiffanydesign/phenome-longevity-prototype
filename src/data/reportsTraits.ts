import type { DataPair } from "@/lib/data";

/**
 * Personal Traits list (captures: traits_list/top, scroll_1, scroll_2, filter_behavior,
 * search_focus, search_results, modal_trait). Only the traits that appeared on screen are
 * reproduced; the counts are the app's own totals.
 */
export type TraitIcon = "gauge_run" | "gauge_eye" | "gauge_smile";
export type ChipIcon = "chip_all" | "chip_run" | "chip_smile" | "chip_heart" | "chip_sun";

export interface TraitCategory {
  name: string;
  count: number;
  icon: ChipIcon | null;
}

export interface Trait {
  name: string;
  category: string;
  gene: string;
  genotype: string;
  summary: string;
  /** 0–1 position on the Less ↔ More Likely arc (0 = no fill) */
  value: number;
  icon: TraitIcon;
  description?: string;
}

export interface TraitsReport {
  total: number;
  categories: TraitCategory[];
  traits: Trait[];
}

const categories: TraitCategory[] = [
  { name: "All", count: 225, icon: "chip_all" },
  { name: "Athleticism", count: 122, icon: "chip_run" },
  { name: "Behavior", count: 4, icon: "chip_smile" },
  { name: "Cardiovascular", count: 1, icon: "chip_heart" },
  { name: "Hormones", count: 2, icon: "chip_sun" },
  // TODO(fidelity): only the edge of the Longevity chip is visible; its icon and the chips
  // further right (horizontal scroll) were not captured.
  { name: "Longevity", count: 1, icon: null },
];

const traits: Trait[] = [
  {
    name: "Endurance",
    category: "Athleticism",
    gene: "SIRT1",
    genotype: "C/C>C/G",
    summary: "There is no significant endurance effect tied to the C/G genotype in SIRT1.",
    value: 0,
    icon: "gauge_run",
    // App copy verbatim, including its mojibake apostrophe ("individualÕs") — capture: traits_list/modal_trait.
    description:
      "An individualÕs endurance capacity is determined by many factors, including their muscle fibre typology, haemoglobin mass, mitochondrial biogenesis, maximal cardiac output, and maximal rate of oxygen consumption (VO2max), among others [118,119,120,121,122,123,124]. Indeed, there is evidence that these intermediate phenotypes have a substantial genetic influence, with literature indicating that genetic factors account for up to 70% of the variability in endurance-related traits [125]. Usually, genetic markers associated with endurance athlete status are determined by comparing allelic frequencies between endurance athletes (e.g., biathletes, road cyclists etc.) and controls.",
  },
  { name: "Strength", category: "Athleticism", gene: "CRTAC1", genotype: "G/G>A/A", summary: "The A/A genotype in CRTAC1 (rs563296) does not appear to influence your strength noticeably.", value: 0, icon: "gauge_run" },
  { name: "Power", category: "Athleticism", gene: "CRTAC1", genotype: "A/A>G/G", summary: "If you have G/G, there’s no strong evidence impacting your Power trait significantly.", value: 0, icon: "gauge_run" },
  // TODO(fidelity): category of the cilantro / extraversion traits is not shown on screen.
  { name: "Cilantro (Coriander) Preference", category: "Sensory", gene: "Intergenic", genotype: "G/G>G/A", summary: "Possessing the A/G genotype suggests you might perceive cilantro as tasting less like soap, making it easier to enjoy!", value: 0.67, icon: "gauge_eye" },
  { name: "Cilantro (Coriander) Preference", category: "Sensory", gene: "Intergenic", genotype: "T/T>T/C", summary: "We don't see a strong genetic influence on cilantro taste perception for the C/T genotype.", value: 0, icon: "gauge_eye" },
  // TODO(fidelity): Extraversion shows a person glyph (only its top edge is captured); smile used.
  { name: "Extraversion", category: "Personality", gene: "Intergenic", genotype: "C/C>C/T", summary: "Your C/T genotype isn't strongly correlated with changes in extraversion.", value: 0, icon: "gauge_smile" },
  { name: "Sweet Tooth", category: "Behavior", gene: "FUT1", genotype: "A/A>A/G", summary: "Having an A/G genotype doesn’t show significant effects on your sweet tooth.", value: 0, icon: "gauge_smile" },
  { name: "Snacking Behavior", category: "Behavior", gene: "LEPR", genotype: "G/G>G/A", summary: "With an A/G genotype, your snacking patterns are likely to be average, alongside a typical BMI.", value: 0.67, icon: "gauge_smile" },
  // TODO(fidelity): the other two Behavior traits (count 4) and the remaining ~217 traits were not captured.
];

const report: TraitsReport = { total: 225, categories, traits };

export const traitsData: DataPair<TraitsReport> = { real: report, demo: report };
