import { readAs } from "@/lib/data";
import { KITS, kitSlides, kitStatus, reports, type KitStatus } from "@/data/insights";
import { clinicalAvailable } from "@/data/insightsClinical";
import { carrierData, geneticHubData, newbornData } from "@/data/reports";
import { conditionsData } from "@/data/reportsConditions";
import { drugsData } from "@/data/reportsDrugs";
import { gutData, oralData } from "@/data/reportsGut";
import { traitsData } from "@/data/reportsTraits";
import { transcriptomeData } from "@/data/reportsTranscriptome";
import { M, type Rec } from "../study/data";
import { conditions, drugs, hub, screening, traits } from "./genetics";
import { microbiomeReport } from "./microbiome";
import { transcriptome } from "./transcriptome";

/*
 * The captured app's report screens, opened from v3, read the clinic portal's
 * member instead of the captured account, so a number on the Omics page and the
 * report behind it always agree. The original edition never sees these.
 */

const latest = (rows: Rec[] | undefined): Rec | undefined => rows?.[rows.length - 1];

function ready(rec: Rec | undefined, fallback: KitStatus): Omit<KitStatus, "byKind"> {
  if (!rec) return { visit: 0, status: "Not taken", message: "There are no results for this test yet." };
  return { visit: rec.visit ?? 1, status: "Ready", message: `Your results from ${rec.date ?? fallback.message} are ready to view.` };
}

readAs("v3", gutData, () => microbiomeReport("gut") ?? gutData.real);
readAs("v3", oralData, () => microbiomeReport("oral") ?? oralData.real);

// the portal export carries no PDF reports and no data for the clinical form: both pages say so
readAs("v3", reports, () => []);
readAs("v3", clinicalAvailable, () => false);

readAs("v3", transcriptomeData, transcriptome);
readAs("v3", geneticHubData, hub);
readAs("v3", conditionsData, conditions);
readAs("v3", drugsData, drugs);
readAs("v3", traitsData, traits);
readAs("v3", carrierData, () => screening("carrier"));
readAs("v3", newbornData, () => screening("newborn"));

readAs("v3", kitSlides, () => ({
  ...KITS,
  // the portal has no sports panel for this member: that slide sells the kit instead
  genome: KITS.genome.map((s) => (s.report === "/insights/genetic/sports" ? { ...s, report: "/v3/store", cta: "Order kit", status: { visit: "–", status: "Not ordered", message: "Sports Performance is its own kit. Order it to read your genes for strength, endurance and recovery." } } : s)),
  // the captured app sends its oral kit to the gut report; here it gets its own
  oral: KITS.oral.map((s) => ({ ...s, report: "/insights/oral/report" })),
}));

readAs("v3", kitStatus, () => {
  const base = kitStatus.real;
  return {
    ...base,
    byKind: {
      genome: ready(M.genome ? { visit: 1, date: M.genome.date } : undefined, base),
      gut: ready(latest(M.gut), base),
      oral: ready(latest(M.oral), base),
      transcriptome: ready(latest(M.transcriptome), base),
    },
  };
});
