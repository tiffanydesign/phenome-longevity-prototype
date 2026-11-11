import { HAS, M, type Rec } from "../study/data";

/** Where a study's sample is taken: a kit the member sends back from home, or a visit to the clinic. */
export type Source = "kit" | "clinic";

export const SOURCE_LABEL: Record<Source, string> = { kit: "Home kit", clinic: "Clinic visit" };
/** what a study with no result offers instead */
export const GET: Record<Source, { label: string; to: string }> = {
  kit: { label: "Order kit", to: "/v3/store" },
  clinic: { label: "Book a visit", to: "/v3/booking" },
};

export interface PortfolioRow {
  title: string;
  /** the result line, or what the study reads when there is none yet */
  sub: string;
  source: Source;
  /** where the row opens; absent when there is no result yet */
  to?: string;
}

const last = (rows?: Rec[]) => rows?.[rows.length - 1];
const from = (rec?: Rec) => (rec?.date ? `Results from ${rec.date}` : "");

/*
 * Every omics study the clinic runs, in the captured app's order. Genome, gut and
 * oral are sold as home kits on the shop; the blood and urine studies and the
 * vaginal swab are taken at a clinic visit. A study opens the captured app's
 * report where it has one, otherwise its own Omics view.
 */
export function portfolio(): PortfolioRow[] {
  const metab = (M.metabolomics as Rec[] | undefined) ?? [];
  const panel = (name: string) => last(metab.find((p) => p.name === name)?.visits);
  const plasma = panel("Plasma metabolomics");
  const urine = panel("Urine metabolomics");
  const lipids = panel("Plasma lipidomics");
  const vaginal = last(M.vaginal);
  return [
    HAS("genomics") && M.genome
      ? { title: "Genome Insights", sub: `Sequenced ${M.genome.date}`, source: "kit", to: "/insights/kit/genome" }
      : { title: "Genome Insights", sub: "Understand your genomic variants", source: "kit" },
    HAS("oralhealth") && last(M.oral)
      ? { title: "Oral Insights", sub: from(last(M.oral)), source: "kit", to: "/insights/kit/oral" }
      : { title: "Oral Insights", sub: "Your oral microbiome", source: "kit" },
    HAS("guthealth") && last(M.gut)
      ? { title: "Gut Insights", sub: from(last(M.gut)), source: "kit", to: "/insights/kit/gut" }
      : { title: "Gut Insights", sub: "Your gut microbiome", source: "kit" },
    vaginal
      ? { title: "Vaginal Insights", sub: from(vaginal), source: "clinic", to: "/v3/twin?lens=omics&organ=guthealth" }
      : { title: "Vaginal Insights", sub: "Your vaginal microbiome", source: "clinic" },
    HAS("proteomics") && last(M.proteomics)
      ? { title: "Proteome Insights", sub: from(last(M.proteomics)), source: "clinic", to: "/v3/twin?lens=omics&organ=proteomics" }
      : { title: "Proteome Insights", sub: "Proteins in your blood", source: "clinic" },
    HAS("transcriptomics") && last(M.transcriptome)
      ? { title: "Transcriptome Insights", sub: from(last(M.transcriptome)), source: "clinic", to: "/insights/kit/transcriptome" }
      : { title: "Transcriptome Insights", sub: "Gene activity in your blood", source: "clinic" },
    plasma || urine
      ? { title: "Metabolome Insights", sub: from(plasma ?? urine), source: "clinic", to: "/v3/twin?lens=omics&organ=metabolomics" }
      : { title: "Metabolome Insights", sub: "Metabolites in your blood and urine", source: "clinic" },
    lipids
      ? { title: "Lipidome Insights", sub: from(lipids), source: "clinic", to: "/v3/twin?lens=omics&organ=metabolomics" }
      : { title: "Lipidome Insights", sub: "Lipids in your blood", source: "clinic" },
  ];
}
