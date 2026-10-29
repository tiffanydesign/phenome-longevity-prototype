import type { DataPair } from "@/lib/data";

/** Insights tab — capture: tab_insights/top, scroll_1, scroll_2. */
export interface PortfolioCard {
  title: string;
  /** subtitle when results exist; disabled cards show "No results available" */
  sub: string;
  /** route when clickable; null = greyed out, not tappable */
  to: string | null;
  tone: "omics" | "results";
}

export interface InsightsTabData {
  reportCount: number;
  omics: PortfolioCard[];
  results: PortfolioCard[];
}

const NO_RESULTS = "No results available";

export const insightsTab: DataPair<InsightsTabData> = {
  real: {
    reportCount: 4,
    omics: [
      { title: "Genome Insights", sub: "Understand your genomic variants", to: "/insights/kit/genome", tone: "omics" },
      { title: "Oral Insights", sub: "View your oral microbiome results", to: "/insights/kit/oral", tone: "omics" },
      { title: "Gut Insights", sub: "View your gut microbiome results", to: "/insights/kit/gut", tone: "omics" },
      { title: "Vaginal Insights", sub: NO_RESULTS, to: null, tone: "omics" },
      { title: "Proteome Insights", sub: NO_RESULTS, to: null, tone: "omics" },
      { title: "Transcriptome Insights", sub: "View your transcriptome", to: "/insights/kit/transcriptome", tone: "omics" },
      { title: "Metabolome Insights", sub: NO_RESULTS, to: null, tone: "omics" },
      { title: "Lipidome Insights", sub: NO_RESULTS, to: null, tone: "omics" },
    ],
    results: [
      { title: "Precision Oncology", sub: NO_RESULTS, to: null, tone: "results" },
      { title: "Infectious Diseases", sub: NO_RESULTS, to: null, tone: "results" },
    ],
  },
  // DEMO — same cards; the captured account already has most omics unlocked.
  demo: {
    reportCount: 5,
    omics: [
      { title: "Genome Insights", sub: "Understand your genomic variants", to: "/insights/kit/genome", tone: "omics" },
      { title: "Oral Insights", sub: "View your oral microbiome results", to: "/insights/kit/oral", tone: "omics" },
      { title: "Gut Insights", sub: "View your gut microbiome results", to: "/insights/kit/gut", tone: "omics" },
      { title: "Vaginal Insights", sub: NO_RESULTS, to: null, tone: "omics" },
      { title: "Proteome Insights", sub: NO_RESULTS, to: null, tone: "omics" },
      { title: "Transcriptome Insights", sub: "View your transcriptome", to: "/insights/kit/transcriptome", tone: "omics" },
      { title: "Metabolome Insights", sub: NO_RESULTS, to: null, tone: "omics" },
      { title: "Lipidome Insights", sub: NO_RESULTS, to: null, tone: "omics" },
    ],
    results: [
      { title: "Precision Oncology", sub: NO_RESULTS, to: null, tone: "results" },
      { title: "Infectious Diseases", sub: NO_RESULTS, to: null, tone: "results" },
    ],
  },
};

/** Reports list — capture: insights_reports/top. */
export interface ReportItem {
  id: string;
  title: string;
  lang: string;
  date: string;
  pages: number;
}

export const reports: DataPair<ReportItem[]> = {
  real: [
    { id: "1", title: "Whole Genome", lang: "TR", date: "1 October 2026, 03:23 PM", pages: 102 },
    { id: "2", title: "Transcriptome", lang: "EN", date: "27 September 2026, 11:23 PM", pages: 38 },
    { id: "3", title: "Whole Genome", lang: "EN", date: "26 September 2026, 12:22 AM", pages: 102 },
    { id: "4", title: "Transcriptome", lang: "EN", date: "24 September 2026, 06:04 PM", pages: 38 },
  ],
  // DEMO
  demo: [
    { id: "5", title: "Gut Microbiome", lang: "EN", date: "20 October 2026, 10:12 AM", pages: 24 },
    { id: "1", title: "Whole Genome", lang: "TR", date: "1 October 2026, 03:23 PM", pages: 102 },
    { id: "2", title: "Transcriptome", lang: "EN", date: "27 September 2026, 11:23 PM", pages: 38 },
    { id: "3", title: "Whole Genome", lang: "EN", date: "26 September 2026, 12:22 AM", pages: 102 },
    { id: "4", title: "Transcriptome", lang: "EN", date: "24 September 2026, 06:04 PM", pages: 38 },
  ],
};

/**
 * Raw exception the app prints when the reports request fails (capture offline/reports).
 * Host replaced with api.example.com (see BUILD_GUIDE → Sensitive data).
 */
export const REPORTS_OFFLINE_ERROR =
  "ClientException with SocketException: Failed host lookup: 'api.example.com' (OS Error: No address associated with hostname, errno = 7), uri=https://api.example.com/Patient/reports/list";

/** Test-kit pages — capture: insights_genome/*, insights_oral/top, insights_gut/top, insights_transcriptome/top. */
export interface KitSlide {
  title: string;
  /** photos/insights/<image>; null = grey placeholder circle (transcriptome) */
  image: string | null;
  report: string;
}

export const KITS: Record<string, KitSlide[]> = {
  genome: [
    { title: "Genetic Insights", image: "kit_genome.png", report: "/insights/genetic/genetic" },
    { title: "Sports Performance", image: "kit_sports.png", report: "/insights/genetic/sports" },
    { title: "Carrier Screening", image: "kit_carrier.png", report: "/insights/genetic/carrier" },
    { title: "Newborn Screening", image: "kit_newborn.png", report: "/insights/genetic/newborn" },
  ],
  oral: [{ title: "Oral Microbiome Test", image: "kit_oral.png", report: "/insights/gut/report" }],
  gut: [{ title: "Gut Microbiome Test", image: "kit_gut.png", report: "/insights/gut/report" }],
  transcriptome: [{ title: "Transcriptome Analysis", image: null, report: "/insights/transcriptome/report" }],
};

export interface KitStatus {
  visit: number;
  status: string;
  message: string;
}

export const kitStatus: DataPair<KitStatus> = {
  real: { visit: 1, status: "Ready", message: "Your results are ready to view." },
  // DEMO
  demo: { visit: 2, status: "Ready", message: "Your results are ready to view." },
};
