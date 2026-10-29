import type { DataPair } from "@/lib/data";

/** Clinical Insights form — capture: insights_clinical/top … scroll_29 (labels from _fields_all.txt). */
export type ClinicalIcon =
  | "personal" | "vitals" | "cbc" | "lipid" | "metabolic" | "liver" | "kidney"
  | "thyroid" | "inflammation" | "hormones" | "vitamins" | "cardio" | "longevity" | "other";

export interface ClinicalSection {
  id: string;
  title: string;
  icon: ClinicalIcon;
  /** editable two-column tiles ("Height | -") */
  tiles: string[];
  /** read-only rows (label + grey skeleton pill in the capture) */
  rows: string[];
}

export const CLINICAL_SECTIONS: ClinicalSection[] = [
  { id: "personal", title: "Personal / Anthropometric", icon: "personal", tiles: ["Height", "Weight", "Hip Circumference", "Lean Body Mass"], rows: ["BMI", "Waist Circumference", "Waist-to-Hip Ratio", "Body Fat Percentage", "Visceral Fat Rating"] },
  { id: "vitals", title: "Vitals", icon: "vitals", tiles: [], rows: ["Blood Pressure (Systolic)", "Blood Pressure (Diastolic)", "Resting Heart Rate", "Heart Rate Variability", "Respiratory Rate", "Oxygen Saturation (SpO2)", "Body Temperature", "VO2 Max", "Grip Strength"] },
  { id: "cbc", title: "Complete Blood Count", icon: "cbc", tiles: [], rows: ["Hemoglobin", "Hematocrit", "RBC Count", "WBC Count", "Platelets", "MCV", "MCH", "MCHC", "RDW", "MPV", "Neutrophils", "Lymphocytes", "Monocytes", "Eosinophils", "Basophils", "Neutrophil/Lymphocyte Ratio", "Neutrophils (Absolute)", "Lymphocytes (Absolute)", "Monocytes (Absolute)", "Eosinophils (Absolute)", "Basophils (Absolute)", "Immature Granulocytes %", "Immature Granulocytes (Absolute)", "RDW-SD", "PDW", "PCT (Plateletcrit)", "P-LCR"] },
  { id: "lipid", title: "Lipid Panel", icon: "lipid", tiles: [], rows: ["Total Cholesterol", "HDL Cholesterol", "LDL Cholesterol", "VLDL Cholesterol", "Triglycerides", "Non-HDL Cholesterol", "ApoB", "ApoA-I", "Lp(a)", "LDL Particle Number", "LDL Particle Size", "Oxidized LDL"] },
  { id: "metabolic", title: "Metabolic / Glucose", icon: "metabolic", tiles: [], rows: ["Fasting Glucose", "HbA1c", "Fasting Insulin", "HOMA-IR", "C-Peptide", "OGTT 2-Hour Glucose", "Fructosamine", "HOMA-S", "HOMA-Beta", "QUICKI"] },
  { id: "liver", title: "Liver Function", icon: "liver", tiles: [], rows: ["ALT (SGPT)", "AST (SGOT)", "GGT", "Alkaline Phosphatase", "Bilirubin (Total)", "Bilirubin (Direct)", "Albumin", "Total Protein", "Globulin"] },
  { id: "kidney", title: "Kidney Function", icon: "kidney", tiles: [], rows: ["Creatinine", "BUN", "BUN/Creatinine Ratio", "eGFR", "Cystatin C", "Uric Acid", "Microalbumin (Urine)", "Albumin/Creatinine Ratio", "Urea", "Urine Creatinine", "Urine Specific Gravity", "Urine pH", "Urine Glucose", "Urine RBC (Microscopy)", "Urine WBC (Microscopy)", "Urine Bacteria"] },
  { id: "thyroid", title: "Thyroid", icon: "thyroid", tiles: [], rows: ["TSH", "Free T4", "Free T3", "Reverse T3", "T3/rT3 Ratio", "TPO Antibodies", "Thyroglobulin Antibodies"] },
  { id: "inflammation", title: "Inflammation", icon: "inflammation", tiles: [], rows: ["hs-CRP", "ESR", "Homocysteine", "Fibrinogen", "Interleukin-6", "TNF-alpha", "Omega-3 Index", "Omega-6/Omega-3 Ratio", "AA/EPA Ratio", "C-Reactive Protein"] },
  { id: "hormones", title: "Hormones", icon: "hormones", tiles: [], rows: ["Testosterone (Total)", "Testosterone (Free)", "SHBG", "Estradiol", "DHEA-S", "Cortisol (Morning)", "Cortisol (Evening)", "IGF-1", "Growth Hormone", "Free Testosterone Index", "Prolactin", "Bioavailable Testosterone", "FSH", "IGF-BP3", "LH", "Pregnenolone", "Progesterone", "Melatonin (PM)"] },
  { id: "vitamins", title: "Vitamins & Minerals", icon: "vitamins", tiles: [], rows: ["Vitamin D (25-OH)", "Vitamin B12", "Folate", "Vitamin B6", "Vitamin A", "Vitamin E", "Vitamin C", "Vitamin K", "Iron", "Ferritin", "TIBC", "Transferrin Saturation", "Magnesium", "RBC Magnesium", "Zinc", "Copper", "Zinc/Copper Ratio", "Selenium", "Iodine (Urine)", "Calcium", "Phosphorus", "Potassium", "Sodium", "Chloride", "CO2 (Bicarbonate)", "Biotin"] },
  { id: "cardio", title: "Cardiovascular Advanced", icon: "cardio", tiles: ["Coronary Calcium Score"], rows: ["NT-proBNP", "Troponin (hs)", "Lp-PLA2", "Myeloperoxidase", "Carotid IMT", "Pulse Wave Velocity", "Ankle-Brachial Index"] },
  { id: "longevity", title: "Longevity / Aging Markers", icon: "longevity", tiles: [], rows: ["Telomere Length", "Biological Age", "Pace of Aging", "GrimAge", "PhenoAge", "Intrinsic Epigenetic Age", "Klotho", "NAD+", "Glutathione", "CoQ10", "p16INK4a"] },
  { id: "other", title: "Other / Specialty", icon: "other", tiles: [], rows: ["PSA", "Free PSA Ratio", "Ammonia", "Lactate", "CPK (Creatine Kinase)", "LDH", "Cortisol/DHEA Ratio", "NSE", "S100B", "Lipase", "Amylase (Total)", "Amylase (Pancreatic)", "CK-MB", "Anion Gap", "Alpha Fetoprotein", "PSA Free"] }
];

/** Unit shown in the edit sheet ("Weight · kg", capture insights_clinical/field_edit). */
// TODO(fidelity): only "kg" for Weight is captured; the other units are assumptions.
export const TILE_UNITS: Record<string, string> = {
  Height: "cm",
  Weight: "kg",
  "Hip Circumference": "cm",
  "Lean Body Mass": "kg",
  "Coronary Calcium Score": "AU",
};

export interface ClinicalValue {
  value: string;
  /** ISO date yyyy-mm-dd */
  date: string;
}

export const clinicalValues: DataPair<Record<string, ClinicalValue>> = {
  real: {},
  // DEMO
  demo: {
    Weight: { value: "68.5", date: "2026-10-28" },
    Height: { value: "172", date: "2026-10-28" },
  },
};
