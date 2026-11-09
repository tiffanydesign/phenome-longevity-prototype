// Writes design scenarios beside the clinic member's real portal results, so the
// app can be seen in states the real member does not reach. Each scenario edits a
// copy of capture/portal/30005-raw.json in the portal's own shape, and keeps the
// portal's rules (a lab's flag follows its range, a ProteoRisk tier its score), so
// the same build and the same presentation player read it as they read the real one.
//
//   varied  every status at least once: in range, above or below, critical; some readings improve, some worsen
//   first   the first visit only, with the slower omics still pending
//   risk    many readings out of range and several critical, to see the app at its loudest
//
// Usage: node scripts/build-scenarios.mjs   (writes capture/portal/30005-raw-<scenario>.json)
import { readFileSync, writeFileSync } from "node:fs";

const SOURCE = "capture/portal/30005-raw.json";
const raw = readFileSync(SOURCE, "utf8");
const fresh = () => JSON.parse(raw).results;

/* ── editing helpers, all in the portal's own record shape ── */

const visitOf = (e) => e.selection.visitNumber;
/** a reading that moves from `first` at visit 1 to `last` at visit 4 */
const along = ([first, last], visit, d = 1) => Number((first + ((last - first) * (visit - 1)) / 3).toFixed(d));
const each = (results, code, fn) => results.filter((e) => e.dataType.code === code).forEach((e) => fn(e, visitOf(e)));
const rows = (e, table) => e.data.find((o) => o.targetTable === table).rows;

/** A laboratory marker: its value moves, its flag follows the lab's own range, unless the scenario calls it critical. */
function lab(results, code, span, { d = 2, critical = false } = {}) {
  each(results, "medical.laboratory_panel", (e, v) => {
    const a = e.data.analytes.find((x) => x.analyteCode === code);
    if (!a) return;
    a.value = along(span, v, d);
    const side = a.refLow !== null && a.value < a.refLow ? "low" : a.refHigh !== null && a.value > a.refHigh ? "high" : "normal";
    a.flag = critical && v === 4 && side !== "normal" ? `critical_${side}` : side;
  });
}

/** Medical record fields, each a [visit 1, visit 4] span or a fixed value. */
function record(results, code, fields) {
  each(results, code, (e, v) => {
    for (const [k, val] of Object.entries(fields)) e.data[k] = Array.isArray(val) && typeof val[0] === "number" ? along(val, v, Number.isInteger(val[0]) && Number.isInteger(val[1]) ? 0 : 1) : typeof val === "function" ? val(v, e.data[k]) : val;
  });
}

/** ProteoRisk: raise named findings to a score; the tier is the model's own boundary for that score. */
function proteo(results, raise) {
  each(results, "omics.olink_proteomics", (e, v) => {
    for (const f of rows(e, "olink_report_findings")) {
      const hit = raise.find((r) => r.disease === f.disease && r.section === f.section);
      if (!hit) continue;
      f.score = along([f.score, hit.score], v, 6);
      f.tier = f.score >= 0.65 ? "high" : f.score >= 0.35 ? "moderate" : "low";
    }
  });
}

/** Microbiome condition scores: the listed conditions sink to the given score by visit 4. */
function conditions(results, code, table, sinks) {
  each(results, code, (e, v) => {
    const scores = rows(e, table);
    sinks.forEach((to, i) => {
      if (scores[i]) scores[i].your_score = along([scores[i].your_score, to], v, 6);
    });
  });
}

function transcriptome(results, predicted, signals) {
  each(results, "omics.transcriptome", (e, v) => {
    const r = rows(e, "transcriptome_reports")[0];
    r.biological_age_predicted = along(predicted, v);
    r.biological_age_gap = Number((r.biological_age_predicted - r.biological_age_chronological).toFixed(1));
    rows(e, "transcriptome_disease_risks")
      .slice(0, signals.length)
      .forEach((d, i) => {
        if (v >= signals[i].from) {
          d.confidence = signals[i].confidence;
          d.zscore = signals[i].z;
        }
      });
  });
}

/** The newest history record is the portal's metadata backfill: a scenario reads the visit records instead. */
const dropBackfill = (results) => results.filter((e) => !(e.dataType.code === "medical.patient_history" && visitOf(e) === null));

/* ── the scenarios ── */

function varied() {
  let r = dropBackfill(fresh());
  record(r, "medical.vital_signs", { systolicBloodPressureMmhg: [124, 136], diastolicBloodPressureMmhg: [80, 86], pulseBpm: [70, 74] });
  record(r, "medical.tonometry", { rightEyePressureMmhg: [17.5, 22.5], leftEyePressureMmhg: [16.2, 18.1] });
  record(r, "medical.ankle_brachial_index", { leftAbi: [0.95, 0.86], interpretation: (v) => (v === 4 ? "Mildly reduced perfusion on the left" : "Normal bilateral perfusion") });
  record(r, "medical.electrocardiogram", { prIntervalMs: [178, 218], interpretation: (v) => (v >= 3 ? "Sinus rhythm with first-degree AV block" : "Normal sinus rhythm without acute abnormalities") });
  record(r, "medical.cognitive_assessment", { score: [28, 26], interpretation: (v) => (v === 4 ? "Mild difficulty with delayed recall" : "Performance within the expected range") });
  lab(r, "ldl_cholesterol", [2.6, 3.4]);
  lab(r, "total_cholesterol", [4.8, 5.6]);
  lab(r, "hba1c", [36, 44], { d: 1 });
  lab(r, "glucose", [5.2, 6.1]);
  lab(r, "vitamin_d_25_oh", [42, 68], { d: 0 });
  lab(r, "ferritin", [22, 12], { d: 0 });
  lab(r, "alt", [30, 62], { d: 0 });
  lab(r, "potassium", [4.4, 6.3], { d: 1, critical: true });
  record(r, "medical.anthropometrics", { weightKg: [74.2, 78.4], bmiKgM2: [26.3, 27.8], waistCircumferenceCm: [86, 92] });
  record(r, "medical.body_composition_3d", { bodyFatPercent: [29.5, 33.1], fatMassKg: [21.9, 25.9], visceralFatRating: [9, 11] });
  record(r, "medical.bone_health_imaging", {
    fractureRisk5yPercent: [3.1, 6.5],
    sites: (v, sites) => sites.map((s) => ({ ...s, tScore: along(s.anatomicalSite === "hip" ? [-1.0, -1.9] : [-0.8, -1.6], v), boneMineralDensityGcm2: along(s.anatomicalSite === "hip" ? [0.9, 0.82] : [1.02, 0.94], v, 2) })),
    findings: (v) => (v >= 3 ? "Low bone density at the hip" : "Bone density is within the expected range for age"),
  });
  record(r, "medical.total_body_skin_mapping", {
    lesions: (v, l) => [...l, ...(v >= 2 ? [{ risk: v === 4 ? "moderate" : "low", change: v === 4 ? "enlarged" : "stable", region: "right_forearm", identifier: "L-002" }] : []), ...(v === 4 ? [{ risk: "high", change: "new", region: "left_shoulder", identifier: "L-003" }] : [])],
    summary: (v) => (v === 4 ? "One new lesion referred for dermatology review" : "No suspicious interval change"),
  });
  record(r, "medical.dietary_history", {
    digestiveSymptoms: (v, s) => ({ ...s, bloating: v >= 3 ? "OFTEN" : s.bloating, reflux: v === 4 ? "VERY_OFTEN" : s.reflux }),
    foodAllergy: (v, a) => (v >= 2 ? { status: "YES", details: "Peanuts" } : a),
  });
  record(r, "medical.patient_history", { medications: (v) => (v === 4 ? [{ name: "Atorvastatin 10 mg" }] : []) });
  each(r, "omics.gut_microbiome", (e, v) => {
    const d = rows(e, "metagenomics_gut_diversity")[0];
    d.richness = along([150, 98], v, 0);
    d.shannon_diversity = along([4.5, 3.9], v, 4);
  });
  conditions(r, "omics.gut_microbiome", "metagenomics_gut_report_summary", [0.22, 0.18, 0.27]);
  conditions(r, "omics.oral_microbiome", "metagenomics_oral_report_summary", [0.3]);
  transcriptome(r, [17.6, 21.4], [{ from: 3, confidence: "High", z: 2.4 }]);
  proteo(r, [
    { disease: "Major Cardiovascular Event Risk (Heart Attack / Stroke / CV Death)", section: "current", score: 0.71 },
    { disease: "Gastro-oesophageal Reflux Disease (Acid Reflux)", section: "ten_year", score: 0.41 },
  ]);
  return r;
}

function first() {
  // the first visit only; the slower omics have not come back from the lab yet
  const pending = new Set(["omics.transcriptome", "omics.olink_proteomics", "omics.plasma_lipidomics", "omics.plasma_metabolomics", "omics.urine_metabolomics", "omics.oral_microbiome"]);
  return fresh().filter((e) => visitOf(e) === 1 && !pending.has(e.dataType.code));
}

function risk() {
  let r = dropBackfill(fresh());
  record(r, "medical.vital_signs", { systolicBloodPressureMmhg: [142, 158], diastolicBloodPressureMmhg: [90, 98], pulseBpm: [88, 96], spo2Percent: [95, 93] });
  record(r, "medical.tonometry", { rightEyePressureMmhg: [22, 26.4], leftEyePressureMmhg: [21.5, 25.8] });
  record(r, "medical.ankle_brachial_index", { leftAbi: [0.84, 0.72], rightAbi: [0.88, 0.78], interpretation: () => "Reduced perfusion in both legs" });
  record(r, "medical.electrocardiogram", { rhythm: (v) => (v >= 3 ? "atrial_fibrillation" : "sinus_rhythm"), heartRateBpm: [92, 112], qtcIntervalMs: [452, 489], interpretation: (v) => (v >= 3 ? "Atrial fibrillation with rapid ventricular response" : "Sinus tachycardia") });
  record(r, "medical.cognitive_assessment", { score: [24, 21], interpretation: () => "Below the expected range, follow-up advised" });
  record(r, "medical.resting_metabolic_rate", { restingEnergyExpenditureKcalDay: [1710, 1660], respiratoryQuotient: [0.92, 0.95] });
  lab(r, "ldl_cholesterol", [4.1, 4.9]);
  lab(r, "total_cholesterol", [6.4, 7.2]);
  lab(r, "triglycerides", [2.6, 3.4]);
  lab(r, "hba1c", [49, 58], { d: 1 });
  lab(r, "glucose", [7.4, 9.8], { critical: true });
  lab(r, "potassium", [5.4, 6.4], { d: 1, critical: true });
  lab(r, "sodium", [133, 128], { d: 0, critical: true });
  lab(r, "egfr", [68, 52], { d: 0 });
  lab(r, "creatinine", [88, 112], { d: 1 });
  lab(r, "alt", [58, 120], { d: 0 });
  lab(r, "ggt", [70, 140], { d: 0 });
  lab(r, "hs_crp", [4.2, 12]);
  lab(r, "hemoglobin", [118, 98], { d: 0 });
  lab(r, "vitamin_d_25_oh", [34, 22], { d: 0 });
  lab(r, "tsh", [4.4, 6.8]);
  record(r, "medical.anthropometrics", { weightKg: [92.5, 98.1], bmiKgM2: [32.8, 34.7], waistCircumferenceCm: [104, 111] });
  record(r, "medical.body_composition_3d", { bodyFatPercent: [38.2, 41.4], fatMassKg: [35.3, 40.6], visceralFatRating: [14, 16] });
  record(r, "medical.bone_health_imaging", {
    fractureRisk5yPercent: [9.5, 14.2],
    sites: (v, sites) => sites.map((s) => ({ ...s, tScore: along(s.anatomicalSite === "hip" ? [-2.6, -3.1] : [-2.2, -2.8], v), boneMineralDensityGcm2: along(s.anatomicalSite === "hip" ? [0.71, 0.66] : [0.84, 0.79], v, 2) })),
    findings: () => "Osteoporosis at the hip and lumbar spine",
  });
  record(r, "medical.total_body_skin_mapping", {
    lesions: (v, l) => [
      ...l,
      { risk: "moderate", change: "enlarged", region: "right_forearm", identifier: "L-002" },
      { risk: v >= 3 ? "high" : "moderate", change: v >= 3 ? "changed colour" : "stable", region: "left_shoulder", identifier: "L-003" },
      ...(v === 4 ? [{ risk: "high", change: "new", region: "upper_back", identifier: "L-004" }] : []),
    ],
    summary: () => "Two lesions referred for urgent dermatology review",
  });
  record(r, "medical.dietary_history", {
    digestiveSymptoms: (v, s) => ({ ...s, bloating: "VERY_OFTEN", reflux: "OFTEN", constipation: "OFTEN", abdominalPain: "OFTEN" }),
    foodAllergy: () => ({ status: "YES", details: "Shellfish, peanuts" }),
  });
  record(r, "medical.patient_history", {
    chronicConditions: (v, c) => [...(c ?? []), { name: "Hypertension" }, { name: "Type 2 diabetes" }],
    medications: () => [{ name: "Metformin 1 g" }, { name: "Amlodipine 5 mg" }, { name: "Atorvastatin 40 mg" }],
  });
  each(r, "omics.gut_microbiome", (e, v) => {
    const d = rows(e, "metagenomics_gut_diversity")[0];
    d.richness = along([96, 70], v, 0);
    d.shannon_diversity = along([3.8, 3.1], v, 4);
    d.pielou_evenness = along([0.6, 0.52], v, 4);
  });
  conditions(r, "omics.gut_microbiome", "metagenomics_gut_report_summary", [0.12, 0.2, 0.15, 0.25, 0.28]);
  conditions(r, "omics.oral_microbiome", "metagenomics_oral_report_summary", [0.2, 0.31, 0.35]);
  transcriptome(r, [23.5, 27.1], [
    { from: 1, confidence: "High", z: 3.6 },
    { from: 2, confidence: "High", z: 2.9 },
    { from: 3, confidence: "Moderate", z: 1.8 },
  ]);
  proteo(r, [
    { disease: "Major Cardiovascular Event Risk (Heart Attack / Stroke / CV Death)", section: "current", score: 0.82 },
    { disease: "Type 2 Diabetes", section: "current", score: 0.77 },
    { disease: "Chronic Lower Respiratory Disease (e.g. COPD)", section: "current", score: 0.68 },
    { disease: "Kidney Failure", section: "ten_year", score: 0.52 },
    { disease: "Osteoarthritis (Arthrosis)", section: "ten_year", score: 0.46 },
    { disease: "Anaemia", section: "current", score: 0.4 },
  ]);
  return r;
}

for (const [name, make] of Object.entries({ varied, first, risk })) {
  const results = make();
  writeFileSync(`capture/portal/30005-raw-${name}.json`, JSON.stringify({ results }));
  console.log(`${name}: ${results.length} records`);
}
