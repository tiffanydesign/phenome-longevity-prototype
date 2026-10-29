import type { ScreenRoute } from "../types";
import { InsightsTab } from "./InsightsTab";
import { ReportsScreen } from "./ReportsScreen";
import { ReportPdfScreen } from "./ReportPdfScreen";
import { ClinicalScreen } from "./ClinicalScreen";
import { KitScreen } from "./KitScreen";

const G = "Insights";

export const routes: ScreenRoute[] = [
  { path: "/insights", element: <InsightsTab />, title: "Insights", group: G },
  { path: "/insights/reports", element: <ReportsScreen />, title: "Reports", group: G },
  { path: "/insights/reports/:id", element: <ReportPdfScreen />, title: "Report PDF viewer", group: G },
  { path: "/insights/clinical", element: <ClinicalScreen />, title: "Clinical Insights", group: G },
  { path: "/insights/kit/genome", element: <KitScreen kind="genome" />, title: "Genome kit", group: G },
  { path: "/insights/kit/oral", element: <KitScreen kind="oral" />, title: "Oral kit", group: G },
  { path: "/insights/kit/gut", element: <KitScreen kind="gut" />, title: "Gut kit", group: G },
  { path: "/insights/kit/transcriptome", element: <KitScreen kind="transcriptome" />, title: "Transcriptome kit", group: G },
];
