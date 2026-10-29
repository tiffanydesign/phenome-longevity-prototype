import type { DataPair } from "@/lib/data";

/** Gut microbiome report (captures: gut_report/top, scroll_1, scroll_2; gut_findings/top…scroll_3). */
export type GutIcon = "leaf" | "balance" | "gut_shield" | "compare" | "pie" | "dots";

export interface GutMetricRow {
  icon: GutIcon;
  title: string;
  sub: string;
  tag?: string;
  value: string;
}

export interface GutSection {
  id: string;
  icon: GutIcon;
  title: string;
  sub: string;
  score: number;
  /** small glyph inside the score ring: alert (red) or check (navy) */
  mark: "alert" | "check";
  chips: string[];
  findings: number;
  stats: [number, string][];
  listTitle: string;
  rows: GutMetricRow[];
  aboutTitle: string;
  about: string;
}

export interface GutFinding {
  icon: GutIcon;
  title: string;
  sub: string;
  status: string;
  value: string;
  /** numeric value + reference range drawn on the bar */
  num: number;
  min: number;
  max: number;
  analysis: string;
  recommendation: string;
}

export interface GutReport {
  intro: string;
  score: number;
  scoreLabel: string;
  overview: string;
  sections: GutSection[];
  findings: Record<string, { title: string; heading: string; headingSub: string; body: string; items: GutFinding[] }>;
}

const LOW_DIVERSITY =
  "The microbial diversity in your gut could be better. If species richness is high, your microbiome can help you fight diseases more effectively. You will find tips on how to increase the diversity of your microbiome with personalized recommendations.";

const report: GutReport = {
  intro: "Your gut microbiome analysis reveals insights about bacterial diversity, population balance, and health implications based on your unique microbial composition.",
  score: 39,
  scoreLabel: "Needs Attention",
  overview:
    "Your gut microbiome analysis reveals the composition and diversity of bacteria in your digestive system, providing insights into your digestive health, immune function, and disease risk.",
  sections: [
    {
      id: "diversity",
      icon: "leaf",
      title: "Diversity Analysis",
      sub: "Species richness & microbial balance evaluation",
      score: 25,
      mark: "alert",
      chips: ["Balanced F/B ratio (1.1)", "Low richness (113 species)", "Low evenness", "Low Shannon diversity"],
      findings: 4,
      stats: [
        [4, "Total Metrics"],
        [1, "In Range"],
        [3, "Out of Range"],
      ],
      listTitle: "Your Microbiome Diversity",
      rows: [
        { icon: "compare", title: "Firmicutes / Bacteroidetes (F/B) Ratio", sub: "F/B ratio measurement", value: "1.1" },
        { icon: "pie", title: "Richness", sub: "Number of different species", tag: "Low", value: "113 species" },
        { icon: "balance", title: "Evenness", sub: "Distribution balance", tag: "Low", value: "0.62" },
        { icon: "dots", title: "Diversity", sub: "Shannon diversity index", tag: "Low", value: "4.22" },
      ],
      aboutTitle: "About Diversity Analysis",
      about:
        "Your gut microbiome diversity is measured through multiple indices including species richness, Shannon diversity index, and Firmicutes/Bacteroidetes ratio. Higher diversity typically indicates better gut health and resilience.",
    },
    {
      id: "balance",
      icon: "balance",
      title: "Bacterial Balance",
      sub: "Population distribution across major phyla",
      score: 20,
      mark: "alert",
      chips: ["4 phyla out of range", "p__Firmicutes elevated", "p__Bacteroidetes low", "p__Euryarchaeota elevated"],
      findings: 5,
      stats: [
        [5, "Phyla"],
        [1, "Normal"],
        [4, "Imbalanced"],
      ],
      listTitle: "Your Bacterial Populations",
      // TODO(fidelity): phylum row icons/tag styling were only seen at the page edge (XML only).
      rows: [
        { icon: "dots", title: "p__Firmicutes", sub: "Bacterial phylum", tag: "increased", value: "50.4%" },
        { icon: "dots", title: "p__Bacteroidetes", sub: "Bacterial phylum", tag: "decreased", value: "47.0%" },
        { icon: "dots", title: "p__Actinobacteria", sub: "Bacterial phylum", tag: "normal", value: "1.4%" },
        { icon: "dots", title: "p__Euryarchaeota", sub: "Bacterial phylum", tag: "increased", value: "1.0%" },
      ],
      aboutTitle: "About Bacterial Balance",
      // TODO(fidelity): copy not captured.
      about: "Your bacterial balance compares the relative abundance of the major phyla in your sample with healthy reference ranges.",
    },
    {
      id: "risk",
      icon: "gut_shield",
      title: "Health Risk Assessment",
      sub: "Disease-associated bacterial markers",
      score: 71,
      mark: "check",
      chips: ["35 conditions low risk", "5 conditions high risk", "Unknown needs attention (5 poor)"],
      findings: 40,
      // TODO(fidelity): the Health Risk pager page was never swiped into view; stats/rows are inferred.
      stats: [
        [40, "Conditions"],
        [35, "Low Risk"],
        [5, "High Risk"],
      ],
      listTitle: "Your Risk Markers",
      rows: [],
      aboutTitle: "About Health Risk Assessment",
      about: "Disease-associated bacterial markers are compared with reference cohorts to estimate relative risk for each condition.",
    },
  ],
  findings: {
    diversity: {
      title: "Diversity Analysis",
      heading: "Microbiome Diversity",
      headingSub: "Detailed analysis of species richness and distribution",
      body: "This page contains detailed diversity metrics including species richness, Shannon diversity index, evenness measures, and Firmicutes/Bacteroidetes ratio analysis.",
      items: [
        {
          icon: "compare",
          title: "Firmicutes / Bacteroidetes (F/B) Ratio",
          sub: "F/B ratio measurement",
          status: "Normal",
          value: "1.07",
          num: 1.07,
          min: 0.2,
          max: 1.7,
          analysis: "Your microbiome is well balanced. This means that the bacteria are evenly distributed.",
          recommendation: "You can increase the number of Bacteroidetes by changing your diet to one rich in fiber from sources such as flaxseed, legumes, and whole grains.",
        },
        {
          icon: "pie",
          title: "Richness",
          sub: "Number of different species",
          status: "Low",
          value: "113 species",
          num: 113,
          min: 115,
          max: 300,
          analysis: LOW_DIVERSITY,
          recommendation: "Enriching your diet with insoluble fibers supports microbial diversity. Whole grains, rice, fruits, and vegetables are rich sources of fiber.",
        },
        {
          icon: "balance",
          title: "Evenness",
          sub: "Distribution balance",
          status: "Low",
          value: "0.62",
          num: 0.62,
          min: 0.7,
          max: 1.0,
          analysis: LOW_DIVERSITY,
          recommendation:
            "Overall microbial diversity increases with the consumption of probiotics, fermented foods, vegetables, and other healthy foods, while reducing the intake of sugar, red meat, and processed foods.",
        },
        {
          icon: "dots",
          title: "Diversity",
          sub: "Shannon diversity index",
          status: "Low",
          value: "4.22",
          num: 4.22,
          min: 4.3,
          max: 7.0,
          analysis: LOW_DIVERSITY,
          recommendation: "Enriching your diet with insoluble fibers supports microbial diversity. Whole grains, rice, fruits, and vegetables are rich sources of fiber.",
        },
      ],
    },
  },
};

export const gutData: DataPair<GutReport> = { real: report, demo: report };
