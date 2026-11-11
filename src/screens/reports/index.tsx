import type { ReactElement } from "react";
import type { ScreenRoute } from "../types";
import { GeneticReportScreen } from "./GeneticReport";
import { GeneticConditionsScreen } from "./GeneticConditions";
import { TraitsListScreen } from "./TraitsList";
import { DrugListScreen } from "./DrugList";
import { GutReportScreen } from "./GutReport";
import { GutFindingsScreen } from "./GutFindings";
import { TranscriptomeScreen } from "./Transcriptome";

const G = "Reports";

const r = (path: string, title: string, el: ReactElement): ScreenRoute => ({ path, title, group: G, element: el });

export const routes: ScreenRoute[] = [
  r("/insights/genetic/conditions", "Health Conditions findings", <GeneticConditionsScreen />),
  r("/insights/genetic/traits", "Personal Traits", <TraitsListScreen />),
  r("/insights/genetic/drugs", "Medication Response", <DrugListScreen />),
  r("/insights/genetic/:report", "Genetic report hub", <GeneticReportScreen />),
  r("/insights/gut/report", "Gut report", <GutReportScreen />),
  r("/insights/gut/findings/:section", "Gut findings", <GutFindingsScreen />),
  r("/insights/oral/report", "Oral report", <GutReportScreen kind="oral" />),
  r("/insights/oral/findings/:section", "Oral findings", <GutFindingsScreen kind="oral" />),
  r("/insights/transcriptome/report", "Transcriptome report", <TranscriptomeScreen />),
];
