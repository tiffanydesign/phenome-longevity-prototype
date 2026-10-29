import type { DataPair } from "@/lib/data";

/**
 * Genetic report hub (capture: genetic_report/top, page_2, page_3; genome_report/top).
 * The captured test account has a full genome report, so `real` = the captured numbers.
 */
export type BadgeTone = "red" | "orange" | "navy" | "grey";

export interface HubPanel {
  icon: "panel_bag" | "panel_pregnant" | "panel_stroller" | "panel_microscope" | "dosage" | "warning" | "verified" | "swap" | "psychology" | "heart" | "shield" | "run";
  title: string;
  sub: string;
  badges: [BadgeTone, number][];
  /** chevron at the row end (Health Conditions page only) */
  chevron?: boolean;
  to?: string;
}

export interface HubPage {
  icon: "hub_shield" | "hub_medication" | "hub_psychology";
  title: string;
  sub: string;
  stats: [number | string, string][];
  panelsTitle: string;
  panels: HubPanel[];
  viewAll: string;
  to: string;
}

export interface GeneticHub {
  intro: string;
  pages: HubPage[];
}

const genetic: GeneticHub = {
  intro: "Your DNA reveals unique insights that can help you understand your health predispositions, medication responses, and personal traits.",
  pages: [
    {
      icon: "hub_shield",
      title: "Health Conditions",
      sub: "Genetic variants related to health conditions",
      // The app renders four stat columns; the 4th ("9") has no label in the capture.
      stats: [
        [0, "Immediate Attention Needed"],
        [2, "Monitor Closely"],
        [0, "Carrier"],
        [9, ""],
      ],
      panelsTitle: "Panels",
      panels: [
        { icon: "panel_bag", title: "Health Conditions", sub: "Predisposition to common conditions", badges: [["orange", 2]], chevron: true, to: "/insights/genetic/conditions" },
        { icon: "panel_pregnant", title: "Carrier Risk Screening", sub: "Genetic variants you may pass on", badges: [], chevron: true, to: "/insights/genetic/carrier" },
        { icon: "panel_stroller", title: "Newborn Screening", sub: "Conditions typically tested at birth", badges: [["red", 1], ["orange", 8]], chevron: true, to: "/insights/genetic/newborn" },
        // TODO(fidelity): Hereditary Cancer destination was not captured.
        { icon: "panel_microscope", title: "Hereditary Cancer", sub: "Cancer-associated genetic variants", badges: [], chevron: true },
      ],
      viewAll: "View All 14 Findings",
      to: "/insights/genetic/conditions",
    },
    {
      icon: "hub_medication",
      title: "Medication Response",
      sub: "How your genes affect medication response",
      stats: [
        [13, "Immediate Attention Needed"],
        [5, "Monitor Closely"],
        [16, "For Your Information"],
      ],
      panelsTitle: "Drug Panels",
      panels: [
        { icon: "dosage", title: "Dosage", sub: "13 drug interactions", badges: [["red", 4], ["orange", 4]], to: "/insights/genetic/drugs" },
        { icon: "warning", title: "Toxicity", sub: "10 drug interactions", badges: [["red", 5], ["orange", 1]], to: "/insights/genetic/drugs" },
        { icon: "verified", title: "Efficacy", sub: "9 drug interactions", badges: [["red", 3]], to: "/insights/genetic/drugs" },
        { icon: "swap", title: "Metabolism/PK", sub: "2 drug interactions", badges: [["red", 1]], to: "/insights/genetic/drugs" },
      ],
      viewAll: "View All 34 Findings",
      to: "/insights/genetic/drugs",
    },
    {
      icon: "hub_psychology",
      title: "Personal Traits",
      sub: "Genetic influences on your traits",
      stats: [
        [149, "Physical Traits"],
        [12, "Sensory Traits"],
        [45, "Behavioral Traits"],
      ],
      panelsTitle: "Panels",
      panels: [
        { icon: "psychology", title: "Neurogenic & Cognitive", sub: "Brain & cognition", badges: [["navy", 6]], to: "/insights/genetic/traits" },
        { icon: "heart", title: "Cardiovascular", sub: "Heart traits", badges: [["navy", 1]], to: "/insights/genetic/traits" },
        { icon: "shield", title: "Immune System", sub: "Defence Mechanisms", badges: [["navy", 0]], to: "/insights/genetic/traits" },
        { icon: "run", title: "Athleticism", sub: "Athletic ability", badges: [["navy", 122]], to: "/insights/genetic/traits" },
      ],
      viewAll: "View All 225 Findings",
      to: "/insights/genetic/traits",
    },
  ],
};

export const geneticHubData: DataPair<GeneticHub> = { real: genetic, demo: genetic };

/** Report variants reachable via /insights/genetic/:report. */
export const REPORT_TITLES: Record<string, string> = {
  genetic: "Genetic Insights",
  // TODO(fidelity): the Sports report hub was not captured; it reuses the Genetic hub layout.
  sports: "Sports Genetics",
  // TODO(fidelity): Carrier report not captured; rendered with the Newborn summary layout.
  carrier: "Carrier Screening",
  newborn: "Newborn Screening",
};

export interface ScreeningSummary {
  intro: string;
  total: number;
}

/** capture: genome_report/top — the test account has no newborn findings. */
export const newbornData: DataPair<ScreeningSummary> = {
  real: { intro: "Early detection screening identifies genetic conditions that can be treated or managed when caught early in life.", total: 0 },
  demo: { intro: "Early detection screening identifies genetic conditions that can be treated or managed when caught early in life.", total: 0 },
};
