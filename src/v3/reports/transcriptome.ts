import { transcriptomeData, type CellIcon, type CellType, type TranscriptomeReport } from "@/data/reportsTranscriptome";
import { M, trim, type Rec } from "../study/data";

/*
 * The transcriptome report, read from the clinic portal's latest result: the
 * three model estimates, the 45 disease axes, and each immune cell's share
 * against the reference bounds the portal ships with it. The score is the share
 * of cells inside their bounds, as in the captured report (8 of 8 made 100).
 */

const ICON: Record<string, CellIcon> = {
  t_cells: "cell_t",
  b_cells: "cell_b",
  monocytes: "cell_mono",
  dendritic_cells: "cell_dc",
  natural_killer_cells: "cell_nk",
  neutrophils: "cell_neut",
  basophils: "cell_baso",
  plasmablasts: "cell_plasma",
};

const years = (n: number | null) => (n === null ? "–" : `${trim(n, 1)} years`);
const signed = (n: number) => (n > 0 ? `+${trim(n, 1)}` : trim(n, 1));
const pctOf = (n: number | null) => (n === null ? "–" : `${trim(n, 1)}%`);

function cell(c: Rec): CellType {
  const low = c.low ?? 0;
  const high = c.high ?? 100;
  const level: "low" | "normal" | "high" = c.pct < low ? "low" : c.pct > high ? "high" : "normal";
  return {
    name: c.name,
    icon: ICON[c.key] ?? "cell_t",
    value: `${c.pct.toFixed(2)}%`,
    num: Number(c.pct.toFixed(2)),
    min: Number(low.toFixed(1)),
    max: Number(high.toFixed(high < 1 ? 2 : 1)),
    status: level === "normal" ? "Normal" : level === "low" ? "Low" : "High",
    description: c.definition ?? "",
    analysis: c.analysis?.[level] ?? "",
    recommendations: c.lifestyle?.[level] ?? "",
  };
}

export function transcriptome(): TranscriptomeReport {
  const t: Rec | null = M.transcriptomeReport ?? null;
  if (!t) return transcriptomeData.real;
  const base = transcriptomeData.real;
  const cells = (t.cells as Rec[]).map(cell);
  const normal = cells.filter((c) => c.status === "Normal").length;
  const gap: number | null = t.age.gap;
  const ageMeans =
    gap === null
      ? "The model could not estimate a biological age from this sample."
      : `Your gene-expression age estimate is ${trim(Math.abs(gap), 1)} years ${gap < 0 ? "younger" : "older"} than your chronological age. ${gap < 0 ? "This may be a favorable signal, but it" : "It"} does not measure overall health.`;
  const d = t.disease;
  const signals: string[] = d.signals.length ? d.signals.map((s: Rec) => s.name) : d.shortlist;
  return {
    ...base,
    score: cells.length ? Math.round((normal / cells.length) * 100) : 0,
    normal,
    attention: cells.length - normal,
    estimates: [
      {
        icon: "hourglass",
        title: "Biological Age",
        grid: [
          ["Predicted age", years(t.age.predicted)],
          ["Chronological age", years(t.age.chronological)],
          ["Age difference", gap === null ? "–" : `${signed(gap)} years`],
          ["Reference percentile", pctOf(t.age.percentile)],
        ],
        means: ageMeans,
        missing: t.age.missing ?? 0,
      },
      {
        icon: "weight",
        title: "Transcriptomic BMI",
        grid: [
          ["Predicted BMI", t.bmi.predicted === null ? "–" : trim(t.bmi.predicted, 1)],
          ["Reference percentile", pctOf(t.bmi.percentile)],
        ],
        means: `Your transcriptomic BMI estimate is ${trim(t.bmi.predicted ?? 0, 1)}, at the ${pctOf(t.bmi.percentile)} reference percentile. Compare this model estimate with your measured BMI and metabolic assessment.`,
        missing: t.bmi.missing ?? 0,
      },
      {
        icon: "lungs",
        title: "Smoking Exposure",
        pill: { label: "Model classification", value: t.smoking.call ?? "–" },
        grid: [
          ["Smoking probability", t.smoking.probability === null ? "–" : pctOf(t.smoking.probability * 100)],
          ["Reference percentile", pctOf(t.smoking.percentile)],
        ],
        means: `Your sample was classified as ${t.smoking.call ?? "unclassified"}, with a model probability of ${t.smoking.probability === null ? "–" : pctOf(t.smoking.probability * 100)}. Compare this result with current exposure information and clinical history.`,
        missing: t.smoking.missing ?? 0,
      },
    ],
    disease: {
      ...base.disease,
      intro: `The transcriptomic profile is evaluated across ${d.axes} disease-related model axes. Each axis is compared with a healthy reference distribution and ranked by model probability; the result describes molecular similarity and does not confirm disease.`,
      healthy: d.healthy === null ? "–" : pctOf(d.healthy * 100),
      signals,
      means: d.signals.length
        ? `${d.signals.length} disease ${d.signals.length === 1 ? "axis meets" : "axes meet"} High or Moderate confidence criteria. Review ${d.signals.length === 1 ? "it" : "them"} with your clinician.`
        : "No disease axis meets High or Moderate confidence criteria. The complete ranking remains available in the appendix.",
      coverage: [
        ["Disease axes reported", String(d.axes)],
        ["Model genes used", String(d.genes ?? "–")],
        ["Missing model genes", String(d.missing ?? 0)],
        ["Highest confidence", d.highest ?? "–"],
      ],
      axes: d.axes,
    },
    cells,
  };
}
