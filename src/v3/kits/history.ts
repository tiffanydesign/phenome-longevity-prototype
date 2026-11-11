/*
 * Every time a member has run a kit test, with what each run read. DEMO data:
 * the portal export holds one genome run and no per-finding results.
 *
 * DNA does not change between runs. What changes is the lab's reading of it:
 * new studies move a variant's interpretation, and a newer panel reads more
 * variants. The comparison shows exactly that.
 */

export type Level = "Lower" | "Typical" | "Raised" | "High";

export interface Finding {
  id: string;
  name: string;
  group: string;
}

export interface Run {
  date: string;
  /** the lab panel version that read the sample */
  panel: string;
  levels: Record<string, Level | undefined>;
}

export interface KitHistory {
  findings: Finding[];
  runs: Run[];
}

const GENETIC: KitHistory = {
  findings: [
    { id: "cad", name: "Coronary artery disease", group: "Heart and vessels" },
    { id: "bp", name: "High blood pressure", group: "Heart and vessels" },
    { id: "lpa", name: "Lipoprotein(a)", group: "Heart and vessels" },
    { id: "t2d", name: "Type 2 diabetes", group: "Metabolism" },
    { id: "fto", name: "Weight regulation (FTO)", group: "Metabolism" },
    { id: "vitd", name: "Vitamin D need", group: "Nutrients" },
    { id: "b12", name: "Vitamin B12 absorption", group: "Nutrients" },
    { id: "folate", name: "Folate cycle (MTHFR)", group: "Nutrients" },
    { id: "caf", name: "Caffeine metabolism", group: "Drug and food response" },
    { id: "statin", name: "Statin response", group: "Drug and food response" },
    { id: "apoe", name: "APOE type", group: "Brain" },
  ],
  runs: [
    { date: "4 Nov 2025", panel: "Panel 2.1", levels: { cad: "Raised", bp: "Typical", lpa: "Raised", t2d: "Typical", fto: "Raised", vitd: "Raised", b12: "Typical", folate: "Typical", caf: "Lower", apoe: "Typical" } },
    { date: "1 Aug 2026", panel: "Panel 3.0", levels: { cad: "Raised", bp: "Typical", lpa: "High", t2d: "Typical", fto: "Typical", vitd: "Raised", b12: "Typical", folate: "Raised", caf: "Lower", statin: "Typical", apoe: "Typical" } },
  ],
};

const SPORTS: KitHistory = {
  findings: [
    { id: "endure", name: "Endurance", group: "Training" },
    { id: "power", name: "Power and sprint", group: "Training" },
    { id: "vo2", name: "VO₂ max trainability", group: "Training" },
    { id: "recover", name: "Recovery speed", group: "Recovery" },
    { id: "inflam", name: "Post-exercise inflammation", group: "Recovery" },
    { id: "tendon", name: "Tendon injury", group: "Injury" },
    { id: "acl", name: "Ligament injury", group: "Injury" },
  ],
  runs: [
    { date: "4 Nov 2025", panel: "Panel 1.4", levels: { endure: "Raised", power: "Typical", recover: "Typical", inflam: "Raised", tendon: "Typical", acl: "Typical" } },
    { date: "1 Aug 2026", panel: "Panel 2.0", levels: { endure: "Raised", power: "Typical", vo2: "Raised", recover: "Lower", inflam: "Raised", tendon: "Raised", acl: "Typical" } },
  ],
};

/** History per kit page, keyed by the slide's title. One run: nothing to compare. */
export const HISTORY: Record<string, Record<string, KitHistory>> = {
  genome: {
    "Genetic Insights": GENETIC,
    "Sports Performance": SPORTS,
  },
};

export function historyOf(kind: string, title: string): KitHistory | undefined {
  return HISTORY[kind]?.[title];
}

/** Two or more runs: something to compare. */
export const canCompare = (kind: string, title: string) => (historyOf(kind, title)?.runs.length ?? 0) > 1;
