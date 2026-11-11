/**
 * The clinic presentation's study list, in its order. The portal's room display
 * shows these as a stage beside a panel; the app walks the same list on a phone.
 * `film` is a recording of the room display's own camera flight to that study.
 */
export type Section = "Baseline" | "Vitals" | "Body" | "Omics";

export interface Study {
  code: string;
  name: string;
  section: Section;
}

import { HAS } from "./data";

/** Every study the presentation can show, in its order. */
export const ALL_STUDIES: Study[] = [
  { code: "apose", name: "Overview", section: "Baseline" },
  { code: "natural", name: "Biomarker View", section: "Vitals" },
  { code: "eye", name: "Eye Focus", section: "Vitals" },
  { code: "brain", name: "Brain", section: "Vitals" },
  { code: "heart", name: "Heart", section: "Vitals" },
  { code: "lungs", name: "Lungs", section: "Vitals" },
  { code: "liver", name: "Liver", section: "Vitals" },
  { code: "kidneys", name: "Kidneys", section: "Vitals" },
  { code: "thyroid", name: "Thyroid", section: "Vitals" },
  { code: "stomach", name: "Stomach", section: "Vitals" },
  { code: "composition", name: "Composition", section: "Body" },
  { code: "skeletal", name: "Skeletal Analysis", section: "Body" },
  { code: "dermatology", name: "Dermatology", section: "Body" },
  { code: "genomics", name: "Genomics", section: "Omics" },
  { code: "guthealth", name: "Gut Health", section: "Omics" },
  { code: "oralhealth", name: "Oral Health", section: "Omics" },
  { code: "transcriptomics", name: "Transcriptomics", section: "Omics" },
  { code: "proteomics", name: "Proteomics", section: "Omics" },
  { code: "metabolomics", name: "Metabolomics", section: "Omics" },
];

/** The studies this member has results for: as in the presentation, a study with none is left out. */
export const STUDIES: Study[] = ALL_STUDIES.filter((s) => HAS(s.code));

export const SECTIONS: Section[] = ["Baseline", "Vitals", "Body", "Omics"];

export const studyIndex = (code: string | undefined) => Math.max(0, STUDIES.findIndex((s) => s.code === code));
