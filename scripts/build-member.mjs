// Builds src/v2/study/member.json from the clinic portal's results for the demo
// member, reading each result the way the portal's presentation player does
// (clinicportalfrontend public/room-display/digital-twin/clinic-room-display.js),
// so the app and the presentation cannot disagree.
//
// Input: capture/portal/30005-raw.json, every record of every data type as the
// results API returns it (git-ignored: 50 MB, carries contact details).
// A design scenario from scripts/build-scenarios.mjs builds the same way into its own file.
// Usage: node scripts/build-member.mjs [varied|first|risk]
import { readFileSync, writeFileSync } from "node:fs";

const SCENARIO = process.argv[2];
const RAW = `capture/portal/30005-raw${SCENARIO ? `-${SCENARIO}` : ""}.json`;
const OUT = `src/v2/study/member${SCENARIO ? `-${SCENARIO}` : ""}.json`;

const results = JSON.parse(readFileSync(RAW, "utf8")).results;

/* ── how the player reads a record ── */

// observed, otherwise recorded, otherwise uploaded
const takenAt = (e) => {
  const s = e.selection ?? {};
  const t = Number(s.observedAt || s.recordedAt || s.uploadedAt);
  return Number.isFinite(t) && t > 0 ? t : null;
};
const inTakenOrder = (a, b) => (takenAt(a) ?? 0) - (takenAt(b) ?? 0);
// the clinic is in London, so a record's day is London's day
const day = (t) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" }).format(new Date(t));
const of = (code) => results.filter((e) => e.dataType.code === code).sort(inTakenOrder);
const has = (v) => v !== null && v !== undefined && v !== "";
const numeric = (v) => (v === null || v === undefined || v === "" || typeof v === "boolean" || !Number.isFinite(Number(v)) ? null : Number(v));
const human = (v) => String(v ?? "").replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
const titled = (v) => String(v ?? "").replace(/\b\w/g, (c) => c.toUpperCase());
const stamp = (e) => ({ visit: e.selection.visitNumber, date: day(takenAt(e)) });
const ranges = (code) => {
  const found = of(code)[0]?.dataType.configuration?.visualization?.referenceRanges ?? {};
  return Object.fromEntries(Object.entries(found).map(([k, r]) => [k, { low: r.low, high: r.high }]));
};

function table(entry, names, optional = false) {
  const hits = entry.data.filter((o) => names.includes(String(o?.targetTable ?? "")));
  if (!hits.length && optional) return [];
  if (hits.length !== 1) throw new Error(`${entry.dataType.code}: expected one of ${names.join(", ")}, found ${hits.length}`);
  return hits[0].rows;
}
const single = (entry, names) => {
  const rows = table(entry, names);
  if (rows.length !== 1) throw new Error(`${entry.dataType.code}.${names[0]}: expected one row, found ${rows.length}`);
  return rows[0];
};

/* ── medical records ── */

const medical = (code, pick) => of(code).map((e) => ({ ...stamp(e), ...pick(e.data, e) }));

const visits = [...new Set(results.map((e) => e.selection.visitNumber).filter((v) => v !== null && v !== undefined))].sort((a, b) => a - b);
const visitDates = Object.fromEntries(
  visits.map((v) => {
    // a visit's day is the day its clinical records were taken
    const t = Math.min(...results.filter((e) => e.selection.visitNumber === v).map(takenAt).filter((x) => x !== null));
    return [String(v), day(t)];
  }),
);

const vitals = medical("medical.vital_signs", (d) => ({
  pulseBpm: d.pulseBpm,
  spo2Percent: d.spo2Percent,
  temperatureC: d.temperatureC,
  respiratoryRatePerMin: d.respiratoryRatePerMin,
  systolicBloodPressureMmhg: d.systolicBloodPressureMmhg,
  diastolicBloodPressureMmhg: d.diastolicBloodPressureMmhg,
}));
const tonometry = medical("medical.tonometry", (d) => ({
  leftEyePressureMmhg: d.leftEyePressureMmhg,
  rightEyePressureMmhg: d.rightEyePressureMmhg,
  leftCornealThicknessUm: d.leftCornealThicknessUm ?? null,
  rightCornealThicknessUm: d.rightCornealThicknessUm ?? null,
  method: d.method,
}));
const ecg = medical("medical.electrocardiogram", (d) => ({
  heartRateBpm: d.heartRateBpm,
  rhythm: d.rhythm,
  prIntervalMs: d.prIntervalMs,
  qrsDurationMs: d.qrsDurationMs,
  qtIntervalMs: d.qtIntervalMs,
  qtcIntervalMs: d.qtcIntervalMs,
  interpretation: d.interpretation,
}));
const abi = medical("medical.ankle_brachial_index", (d) => ({ leftAbi: d.leftAbi, rightAbi: d.rightAbi, interpretation: d.interpretation }));
const rmr = medical("medical.resting_metabolic_rate", (d) => ({
  restingEnergyExpenditureKcalDay: d.restingEnergyExpenditureKcalDay,
  vo2MlMin: d.vo2MlMin,
  vco2MlMin: d.vco2MlMin,
  respiratoryQuotient: d.respiratoryQuotient,
  interpretation: d.interpretation,
}));
const bone = medical("medical.bone_health_imaging", (d) => ({
  fractureRisk5yPercent: d.fractureRisk5yPercent,
  fragilityScore: d.fragilityScore,
  sites: (d.sites ?? []).slice(0, 4),
  findings: d.findings,
}));
const cognitive = medical("medical.cognitive_assessment", (d) => ({
  score: d.score,
  maximumScore: d.maximumScore,
  instrument: d.instrument,
  interpretation: d.interpretation,
  domains: d.domains,
}));
const skin = medical("medical.total_body_skin_mapping", (d) => ({ lesions: d.lesions ?? [], summary: d.summary, recommendations: (d.recommendations ?? []).slice(0, 3) }));
const composition = medical("medical.body_composition_3d", (d) => ({
  bodyFatPercent: d.bodyFatPercent,
  fatMassKg: d.fatMassKg,
  leanMassKg: d.leanMassKg,
  skeletalMuscleMassKg: d.skeletalMuscleMassKg,
  visceralFatRating: d.visceralFatRating,
}));
const anthro = medical("medical.anthropometrics", (d) => ({
  heightCm: d.heightCm,
  weightKg: d.weightKg,
  waistCircumferenceCm: d.waistCircumferenceCm,
  hipCircumferenceCm: d.hipCircumferenceCm,
  bmiKgM2: d.bmiKgM2,
}));
const nutrition = medical("medical.nutrition_assessment", (d) => ({
  dietaryPattern: d.dietaryPattern,
  goals: (d.goals ?? []).filter(has).slice(0, 3),
  recommendations: (d.recommendations ?? []).filter(has).slice(0, 3),
}));

// the six cells the player draws; the dietitian's notes stay off a display
const dietary = medical("medical.dietary_history", (d, e) => {
  const schema = e.dataType.payloadSchema?.properties ?? {};
  const part = (group, key) => schema[group]?.properties?.[key] ?? {};
  const answer = (def, v) => (def.enumLabels ?? def.items?.enumLabels ?? {})[v] ?? human(v);
  const allergy = d.foodAllergy ?? {};
  const intolerance = d.foodIntolerance ?? {};
  const avoided = [allergy.status === "YES" ? allergy.details : null]
    .concat((intolerance.types ?? []).map((t) => (t === "OTHER" ? intolerance.other : answer(part("foodIntolerance", "types"), t))))
    .filter(has);
  const symptoms = d.digestiveSymptoms ?? {};
  const frequent = Object.keys(symptoms)
    .filter((k) => symptoms[k] === "OFTEN" || symptoms[k] === "VERY_OFTEN")
    .map((k) => part("digestiveSymptoms", k).title || human(k));
  const p = d.eatingPattern ?? {};
  return {
    intolerances: avoided,
    symptoms: frequent,
    meals: [p.mainMealsPerDay, p.snacksPerDay].filter(has).map((n) => String(Math.round(n))).join(" + "),
    salt: has(d.saltIntake) ? answer(schema.saltIntake ?? {}, d.saltIntake) : "",
    diet: (d.foodPreferences?.dietTypes ?? []).map((t) => answer(part("foodPreferences", "dietTypes"), t)).join(", "),
    activeDays: d.physicalActivity?.activityDaysPerWeek ?? null,
  };
});

const ultrasound = medical("medical.diagnostic_ultrasound", (d) => ({
  studies: (d.studies ?? []).slice(0, 4).map((s) => ({ region: has(s.region) ? human(s.region) : "Record", finding: s.finding })),
  impression: d.impression || d.findings,
}));
const gp = medical("medical.gp_examination", (d) => {
  const found = { ...(d.generalPhysicalFindings ?? {}), ...(d.neurologicalFindings ?? {}) };
  return {
    clinicalImpression: d.clinicalImpression,
    findings: Object.keys(found)
      .filter((k) => has(found[k]))
      .slice(0, 6)
      .map((k) => ({ label: human(k.replace(/([a-z])([A-Z])/g, "$1_$2")), value: String(found[k]) })),
    recommendations: (d.recommendations ?? []).slice(0, 3),
  };
});

// every history record in the order taken: the player opens on the newest
const history = medical("medical.patient_history", (d) => ({
  chiefConcerns: (d.chiefConcerns ?? []).filter(has),
  conditions: (d.chronicConditions ?? []).map((c) => c?.name).filter(has),
  medications: (d.medications ?? []).map((m) => m?.name).filter(has),
  allergies: (d.allergies ?? []).map((a) => a?.substance).filter(has),
}));

/* ── laboratory: grouped by the body region each panel is presented on ── */

const analyteName = (entry, code) => {
  for (const p of entry.dataType.configuration?.panels ?? []) {
    const hit = (p?.analytes ?? []).find((a) => a?.analyteCode === code);
    if (hit?.displayName) return hit.displayName;
  }
  return human(code);
};
const labs = {};
for (const e of of("medical.laboratory_panel")) {
  const region = e.dataType.poseCode;
  const code = e.data.panelCode;
  labs[region] ??= [];
  let panel = labs[region].find((p) => p.code === code);
  if (!panel) {
    panel = { code, name: e.data.panelName || e.dataType.displayName, core: e.data.coreVsExtended !== "extended", blood: /blood|serum|plasma/i.test(String(e.data.specimenType ?? "")), visits: [] };
    labs[region].push(panel);
  }
  panel.visits.push({
    ...stamp(e),
    analytes: (e.data.analytes ?? []).map((a) => ({ name: analyteName(e, a.analyteCode), value: a.value, unit: a.unit, low: a.refLow, high: a.refHigh, flag: String(a.flag ?? "").toLowerCase() })),
  });
}
// core panels first, then extended, each in the catalogue's order
for (const region of Object.keys(labs)) labs[region] = labs[region].filter((p) => p.core).concat(labs[region].filter((p) => !p.core));

/* ── omics ── */

const [genomeEntry] = of("omics.genome");
const inheritance = table(genomeEntry, ["genomics_inheritance"]);
const rank = (code) => inheritance.filter((r) => String(r.importance_code ?? "").toLowerCase() === code);
const urgent = rank("very_important");
const important = rank("important");
const first = (urgent.length ? urgent : important)[0];
const genome = {
  date: day(takenAt(genomeEntry)),
  veryImportant: urgent.length,
  important: important.length,
  noteworthy: rank("noteworthy").length,
  lead: first ? [first.disease, first.genes].filter(has).join(" · ") : "",
};

// a screening row is a finding when it names a disease, change, gene or position, once per disease and variant
function screeningFindings(rows) {
  const seen = new Set();
  return rows.filter((r) => {
    if (![r.disease, r.hgvsc, r.genes, r.pos].some(has)) return false;
    const key = [r.disease, r.genes, r.x_chrom, r.pos, r.ref, r.alt, r.hgvsc].map((x) => String(x ?? "")).join("\u0000");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
const screened = (rows) => rows.map((r) => ({ disease: r.disease || r.genes, gene: r.disease ? r.genes : null }));
const [carrierEntry] = of("omics.carrier_screening");
const carrier = screened(screeningFindings(table(carrierEntry, ["familyrisk_carrier_carrier_screening", "familyrisk_carrier_screening", "carrier_screening"])));
const [newbornEntry] = of("omics.newborn_screening");
const newborn = screened(screeningFindings(table(newbornEntry, ["familyrisk_newborn_newborn_monogenic", "familyrisk_newborn_monogenic", "newborn_monogenic"])));
const newbornCarrier = screeningFindings(table(newbornEntry, ["familyrisk_newborn_newborn_carrier_status"], true)).length;

const RISK = { ELEVATED: "Elevated", MILDLY_ELEVATED: "Mildly elevated" };
const domainWords = (v) => String(v ?? "").split("_").filter(Boolean).map(human).join(" / ");
const [gpgsEntry] = of("omics.gpgs");
const rankings = table(gpgsEntry, ["gpgs_disease_rankings"], true);
const gpgs = {
  domains: table(gpgsEntry, ["gpgs_clinical_domains"])
    .filter((d) => RISK[d.risk_level])
    .sort((a, b) => (numeric(b.tier1_count) ?? 0) - (numeric(a.tier1_count) ?? 0) || (numeric(b.tier2_count) ?? 0) - (numeric(a.tier2_count) ?? 0))
    .slice(0, 3)
    .map((d) => ({ name: domainWords(d.domain), level: RISK[d.risk_level], z: numeric(d.mean_z) })),
  closest: rankings[0] && numeric(rankings[0].probability) !== null ? { name: rankings[0].disease_name || domainWords(rankings[0].disease), probability: Number(rankings[0].probability) } : null,
};

const BANDS = { low: "Low", normallow: "Normal-low", normalhigh: "Normal-high", normal: "Normal", high: "High" };
const band = (mode, s) => (mode === "oral" ? (s >= 0.8 ? "high" : s >= 0.4 ? "normal" : "low") : s > 0.8 ? "high" : s > 0.55 ? "normalhigh" : s > 0.3 ? "normallow" : "low");
const taxon = (ref) => (has(ref.species) ? String(ref.species) : String(ref.taxonName ?? "").replace(/^[a-z]__/, "").replace(/_/g, " "));
function microbiome(code, mode) {
  const t = mode === "gut" ? { div: "metagenomics_gut_diversity", top: "metagenomics_gut_top5phylum", sum: "metagenomics_gut_report_summary" } : { div: "metagenomics_oral_diversity", top: "metagenomics_oral_top5phylum", sum: "metagenomics_oral_report_summary" };
  return of(code).map((e) => {
    const refs = e.references ?? {};
    const div = single(e, [t.div]);
    const phyla = table(e, [t.top])
      .slice(0, 5)
      .sort((a, b) => (numeric(b.patient_value) ?? 0) - (numeric(a.patient_value) ?? 0))
      .map((r) => ({ name: taxon(refs.bacteria[String(r.bacteria_id)]), value: Number(r.patient_value) }));
    const scores = table(e, [t.sum])
      .map((r) => {
        const ref = refs.diseases?.[String(r.disease_id)];
        if (!ref || !(ref.title || ref.name)) throw new Error(`${code}: condition ${r.disease_id} has no reference`);
        return { name: titled(ref.title || ref.name), score: Number(r.your_score), band: BANDS[band(mode, Number(r.your_score))] };
      })
      .sort((a, b) => a.score - b.score);
    const low = scores.filter((s) => s.band === "Low");
    return {
      ...stamp(e),
      phyla,
      richness: numeric(div.richness),
      shannon: numeric(div.shannon_diversity),
      evenness: numeric(div.pielou_evenness),
      fb: numeric(div.fb_ratio) === null ? null : Number(div.fb_ratio) / 100,
      // the low scores lowest first, or the lowest one when none is low
      lowest: (low.length ? low : scores).slice(0, low.length ? 3 : 1),
      low,
    };
  });
}
const gut = microbiome("omics.gut_microbiome", "gut");
const oral = microbiome("omics.oral_microbiome", "oral");
const vaginal = of("omics.vaginal_microbiome").map((e) => ({
  ...stamp(e),
  species: table(e, ["vaginal_health_observed_species"])
    .slice()
    .sort((a, b) => (numeric(b.relative_abundance_pct) ?? 0) - (numeric(a.relative_abundance_pct) ?? 0))
    .slice(0, 5)
    .map((r) => ({ name: r.taxon || r.species, value: Number(r.relative_abundance_pct) })),
}));

const transcriptome = of("omics.transcriptome").map((e) => {
  const report = single(e, ["transcriptome_reports"]);
  const conf = (r) => String(r.confidence ?? "").toLowerCase();
  const signals = table(e, ["transcriptome_disease_risks"])
    .filter((r) => conf(r) === "high" || conf(r) === "moderate")
    .sort((a, b) => (conf(a) === "high" ? 0 : 1) - (conf(b) === "high" ? 0 : 1) || Number(a.rank_order) - Number(b.rank_order))
    .slice(0, 3)
    .map((r) => ({ name: r.disease, confidence: human(r.confidence), z: numeric(r.zscore) }));
  const cellRow = single(e, ["transcriptome_cell_proportions"]);
  const localized = cellRow.localized && typeof cellRow.localized === "object" ? cellRow.localized : {};
  let cells = Object.keys(cellRow)
    .filter((k) => k !== "sourceRow" && k !== "localized" && numeric(cellRow[k]) !== null)
    .map((k) => ({ name: localized[k]?.name || human(k), value: Number(cellRow[k]) * 100 }))
    .sort((a, b) => b.value - a.value);
  if (cells.length > 5) cells = cells.slice(0, 4).concat([{ name: "Others", value: cells.slice(4).reduce((n, c) => n + c.value, 0) }]);
  return { ...stamp(e), predicted: numeric(report.biological_age_predicted), chronological: numeric(report.biological_age_chronological), gap: numeric(report.biological_age_gap), signals, cells };
});

const SYSTEMS = [
  ["circulatory", "Circulatory system", "Heart and blood vessels"],
  ["respiratory", "Respiratory system", "Lungs and breathing"],
  ["metabolic", "Endocrine, nutritional & metabolic", "Metabolism and hormones"],
  ["digestive", "Digestive system", "Digestion"],
  ["genitourinary", "Genitourinary system", "Urinary and reproductive system"],
  ["musculoskeletal", "Musculoskeletal system", "Bones, joints and muscles"],
  ["blood", "Blood & immune mechanism", "Blood and immunity"],
  ["infections", "Infectious & parasitic diseases", "Infections"],
  ["neoplasms", "Neoplasms", "Tumours and growths"],
  ["eye", "Eye & adnexa", "Eyes"],
  ["skin", "Skin & subcutaneous tissue", "Skin"],
  ["multisystem", "Multisystem / composite", "Several body systems"],
];
const proteomics = of("omics.olink_proteomics").map((e) => {
  const [summary] = table(e, ["olink_report_summary"]);
  const found = table(e, ["olink_report_findings"]).map((r) => ({
    system: SYSTEMS.findIndex((s) => s[1] === r.category),
    order: Number(r.sourceRow),
    disease: String(r.disease).trim(),
    score: Number(r.score),
    tier: r.tier,
    section: r.section,
  }));
  const systems = SYSTEMS.map((s, i) => {
    const within = found.filter((f) => f.system === i);
    if (!within.length) return null;
    const status = within.some((f) => f.tier === "high") ? "high" : within.some((f) => f.tier === "moderate") ? "moderate" : "typical";
    return { code: s[0], name: s[2], status };
  }).filter(Boolean);
  const names = new Set();
  const highlights = [];
  found
    .filter((f) => f.tier !== "low")
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .forEach((f) => {
      if (highlights.length >= 4 || names.has(f.disease)) return;
      names.add(f.disease);
      // 0 to 100, rounded down as the report does
      highlights.push({ name: f.disease, score: Math.floor(f.score * 100 + 1e-9), tier: f.tier, when: f.section === "current" ? "Now" : "Within 10 years" });
    });
  return { ...stamp(e), proteins: Number(summary.observed_protein_count), systems, highlights };
});

const FEATURES = { "omics.plasma_lipidomics": "plasma_lipidomics_features", "omics.plasma_metabolomics": "plasma_metabolomics_features", "omics.urine_metabolomics": "urine_metabolomics_features" };
// a layer the lab has not reported yet is left out, as the player leaves it out
const metabolomics = Object.entries(FEATURES).filter(([code]) => of(code).length).map(([code, name]) => {
  const runs = of(code);
  return {
    name: runs[0].dataType.displayName,
    visits: runs.map((e) => {
      const measured = table(e, [name]).filter((f) => numeric(f.abundance) !== null);
      const top = measured.slice().sort((a, b) => Number(b.abundance) - Number(a.abundance)).slice(0, 3);
      const most = Math.max(1, ...top.map((f) => Number(f.abundance)));
      return { ...stamp(e), measured: measured.length, top: top.map((f) => ({ name: f.feature_name, share: Number(f.abundance) / most })) };
    }),
  };
});

/* ── the overview, from the newest record of each result ── */

// as at a visit: the newest record of each result taken up to it
const upTo = (code, visit) => of(code).filter((e) => (e.selection.visitNumber ?? 0) <= visit).at(-1);
const omicsCodes = [...new Set(results.map((e) => e.dataType.code).filter((c) => /^omics\./.test(c)))];
function metabolitesAt(visit) {
  const names = new Set();
  for (const code of ["omics.plasma_metabolomics", "omics.urine_metabolomics"]) {
    const e = upTo(code, visit);
    if (!e) continue;
    for (const f of table(e, [FEATURES[code]])) if (numeric(f.abundance) !== null && has(f.feature_name)) names.add(String(f.feature_name).trim().toLowerCase());
  }
  return names.size;
}
const last = visits.at(-1);
const overview = {
  layers: new Set(omicsCodes.map((c) => upTo(c, last)?.dataType.category).filter(has)).size,
  metabolites: metabolitesAt(last),
  metabolitesAt: Object.fromEntries(visits.map((v) => [String(v), metabolitesAt(v)])),
};

/* ── the member, as the presentation names them ── */

const born = history.length ? of("medical.patient_history").at(-1).data : {};
// the presentation's studies this member has data for, in its order: a study with none is not shown
const ORDER = ["apose", "natural", "eye", "brain", "heart", "lungs", "liver", "kidneys", "thyroid", "stomach", "intestines", "composition", "skeletal", "dermatology", "genomics", "guthealth", "oralhealth", "transcriptomics", "proteomics", "metabolomics"];
const studies = ORDER.filter((c) => results.some((e) => e.dataType.poseCode === c));

const member = {
  scenario: SCENARIO ?? "clinic",
  studies,
  visits,
  visitDates,
  sex: born.sex ?? null,
  vitals,
  vitalRanges: ranges("medical.vital_signs"),
  tonometry,
  tonometryRanges: ranges("medical.tonometry"),
  ecg,
  abi,
  abiRanges: ranges("medical.ankle_brachial_index"),
  rmr,
  bone,
  cognitive,
  skin,
  composition,
  anthro,
  anthroRanges: ranges("medical.anthropometrics"),
  nutrition,
  dietary,
  history,
  gp,
  ultrasound,
  labs,
  genome,
  carrier,
  newborn,
  newbornCarrier,
  gpgs,
  gut,
  oral,
  vaginal,
  transcriptome,
  proteomics,
  metabolomics,
  overview,
};

writeFileSync(OUT, `${JSON.stringify(member, null, 2)}\n`);
console.log(`wrote ${OUT}: ${visits.length} visits, ${results.length} records`);
