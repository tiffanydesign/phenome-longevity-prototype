import type { DataPair } from "@/lib/data";

/** Medication Response list (captures: drug_list/top, scroll_1…3, modal_drug). */
export type DrugCategory = "Dosage" | "Efficacy" | "Metabolism/PK" | "Toxicity";

export interface DrugRow {
  drug: string;
  gene: string;
  genotype: string;
  category: DrugCategory;
  rsid?: string;
}

export interface DrugGroup {
  title: string;
  sub: string;
  tone: "red" | "orange" | "grey";
  count: number;
  /** PharmGKB explanation shown in the drug dialog */
  about: string;
  evidence: string;
  modifiers: string;
  /** sub-sections in display order */
  order: DrugCategory[];
  rows: DrugRow[];
}

const row = (drug: string, gene: string, genotype: string, category: DrugCategory, rsid?: string): DrugRow => ({ drug, gene, genotype, category, rsid });
const PEG = "Peginterferon alfa-2a;peginterferon alfa-2b;ribavirin";

const groups: DrugGroup[] = [
  {
    title: "Immediate Attention Needed",
    sub: "(Major Gene-Drug Interaction)",
    tone: "red",
    count: 13,
    about:
      "These medications are classified under PharmGKB Level 1A, meaning they have the highest level of clinical evidence. Level 1A includes drug-gene interactions with specific dosing recommendations in FDA-approved labels or clinical guidelines. These interactions can significantly alter drug response, requiring immediate adjustments based on CPIC or FDA guidelines.",
    evidence: "1A",
    modifiers: "Tier 1 VIP",
    order: ["Dosage", "Efficacy", "Metabolism/PK", "Toxicity"],
    rows: [
      row("Warfarin", "VKORC1", "CT", "Dosage", "rs9923231"),
      row("Acenocoumarol", "VKORC1", "CT", "Dosage"),
      row("Phenprocoumon", "VKORC1", "CT", "Dosage"),
      row("Warfarin", "CYP4F2", "CT", "Dosage"),
      row(PEG, "IFNL3;IFNL4", "CT", "Efficacy"),
      row("Boceprevir;peginterferon alfa-2a;peginterferon alfa-2b;ribavirin", "IFNL3;IFNL4", "CT", "Efficacy"),
      row("Peginterferon alfa-2a;peginterferon alfa-2b;ribavirin;telaprevir", "IFNL3;IFNL4", "CT", "Efficacy"),
      row("Efavirenz", "CYP2B6", "GT", "Metabolism/PK"),
      row("Efavirenz", "CYP2B6", "GT", "Toxicity"),
      row("Fluorouracil", "DPYD", "CT", "Toxicity"),
      row("Capecitabine", "DPYD", "CT", "Toxicity"),
      row("Fluorouracil", "DPYD", "AG", "Toxicity"),
      row("Capecitabine", "DPYD", "AG", "Toxicity"),
    ],
  },
  {
    title: "Monitor Closely",
    sub: "(Significant Gene-Drug Interaction)",
    tone: "orange",
    count: 5,
    // TODO(fidelity): dialog copy / evidence level for this group were not captured.
    about: "",
    evidence: "",
    modifiers: "",
    order: ["Dosage", "Toxicity"],
    rows: [
      row("Warfarin", "VKORC1", "CT", "Dosage"),
      row("Warfarin", "VKORC1", "AG", "Dosage"),
      row("Warfarin", "VKORC1", "CG", "Dosage"),
      row("Warfarin", "VKORC1", "AG", "Dosage"),
      row("Warfarin", "VKORC1", "CT", "Toxicity"),
    ],
  },
  {
    title: "For Your Information",
    sub: "(Minor Gene-Drug Interaction)",
    tone: "grey",
    count: 16,
    about: "",
    evidence: "",
    modifiers: "",
    order: ["Dosage", "Efficacy", "Toxicity", "Metabolism/PK"],
    // TODO(fidelity): the last 5 rows (4 Toxicity, 1 Metabolism/PK) were below the last capture.
    rows: [
      row("Acenocoumarol", "VKORC1", "AG", "Dosage"),
      row("Phenprocoumon", "VKORC1", "AG", "Dosage"),
      row("Warfarin", "VKORC1", "AC", "Dosage"),
      row("Acenocoumarol", "CYP4F2", "CT", "Dosage"),
      row("Carbamazepine", "SCN1A", "CT", "Dosage"),
      row("Warfarin", "VKORC1", "CT", "Efficacy"),
      row("Warfarin", "VKORC1", "CT", "Efficacy"),
      row(PEG, "IFNL3", "AG", "Efficacy"),
      row("Platinum compounds", "XRCC1", "CC", "Efficacy"),
      row("Rituximab", "FCGR3A", "CC", "Efficacy"),
      row("Methotrexate", "SLC19A1", "CC", "Efficacy"),
    ],
  },
];

export interface DrugReport {
  total: number;
  /** per-category totals from the hub (Dosage 13, Toxicity 10, Efficacy 9, Metabolism/PK 2) */
  byCategory: Record<DrugCategory, number>;
  groups: DrugGroup[];
}

const report: DrugReport = { total: 34, byCategory: { Dosage: 13, Efficacy: 9, "Metabolism/PK": 2, Toxicity: 10 }, groups };

export const drugsData: DataPair<DrugReport> = { real: report, demo: report };
