/**
 * The clinic presentation's study list, in its order. The portal's room display
 * shows these as a stage beside a panel; the app walks the same list on a phone.
 * `film` is a recording of the room display's own camera flight to that study.
 */
export type Section = "Baseline" | "Vitals" | "Body" | "Omics";

export interface Study {
  code: string;
  name: string;
  /** what the camera is doing, in the portal's own words */
  note: string;
  section: Section;
}

export const STUDIES: Study[] = [
  { code: "apose", name: "Overview", note: "The whole record at a glance", section: "Baseline" },
  { code: "natural", name: "Biomarker View", note: "Vascular hand focus", section: "Vitals" },
  { code: "eye", name: "Eye Focus", note: "Over-shoulder gaze", section: "Vitals" },
  { code: "brain", name: "Brain", note: "Fly to neural detail", section: "Vitals" },
  { code: "heart", name: "Heart", note: "Fly to cardiac detail", section: "Vitals" },
  { code: "lungs", name: "Lungs", note: "Fly to pulmonary detail", section: "Vitals" },
  { code: "liver", name: "Liver", note: "Fly to hepatic detail", section: "Vitals" },
  { code: "kidneys", name: "Kidneys", note: "Fly to renal detail", section: "Vitals" },
  { code: "thyroid", name: "Thyroid", note: "Fly to cervical detail", section: "Vitals" },
  { code: "stomach", name: "Stomach", note: "Fly to gastric detail", section: "Vitals" },
  { code: "composition", name: "Composition", note: "VISBODY composition scan", section: "Body" },
  { code: "skeletal", name: "Skeletal Analysis", note: "Lumbar spine and hip alignment", section: "Body" },
  { code: "dermatology", name: "Dermatology", note: "Rotating skin survey", section: "Body" },
  { code: "genomics", name: "Genomics", note: "Genome held in hand", section: "Omics" },
  { code: "guthealth", name: "Gut Health", note: "Intestinal system and abdominal focus", section: "Omics" },
  { code: "oralhealth", name: "Oral Health", note: "Directed mouth examination", section: "Omics" },
  { code: "transcriptomics", name: "Transcriptomics", note: "Posterior expression flow", section: "Omics" },
  { code: "proteomics", name: "Proteomics", note: "Live protein-fold study", section: "Omics" },
  { code: "metabolomics", name: "Metabolomics", note: "Whole-body metabolic flux", section: "Omics" },
];

export const SECTIONS: Section[] = ["Baseline", "Vitals", "Body", "Omics"];

export const studyIndex = (code: string | undefined) => Math.max(0, STUDIES.findIndex((s) => s.code === code));
