import { allLabs, labTotals, Labs } from "./blocks";
import { STUDIES } from "./catalog";
import { IN, M, pick, placeOf, series, trim, VISITS, words, type Rec, type StudyView } from "./data";
import { Bullets, Card, Cells, Facts, Finding, Heartbeat, Note, Parts, Pill, Range, Ring, type Tone } from "./parts";

function labStudy(study: string, visit: number): StudyView {
  const t = labTotals(study, visit);
  return {
    value: String(t.inRange),
    label: t.outside ? `of ${t.total} markers in range` : "markers in range",
    trend: VISITS.map((v) => labTotals(study, v).inRange),
    at: VISITS.indexOf(visit),
    ...(t.outside ? IN("mon", `${t.outside} outside range`) : IN("ok", "All in range")),
    cards: <Labs study={study} visit={visit} />,
  };
}

export const CLINICAL: Record<string, (visit: number) => StudyView> = {
  apose(visit) {
    const v = pick(M.vitals, visit);
    const labs = allLabs(visit);
    const c = pick(M.composition, visit);
    const b = pick(M.bone, visit);
    const s = pick(M.skin, visit);
    const gut = pick(M.gut, visit);
    const pr = pick(M.proteomics, visit);
    // the newest history record taken by this visit; the portal's metadata record, which has no visit, counts at every one
    const taken = (M.history as Rec[]).filter((r) => r.visit === null || r.visit === undefined || r.visit <= visit);
    const h = taken[taken.length - 1] ?? M.history[M.history.length - 1];
    const us = pick(M.ultrasound, visit);
    const gp = pick(M.gp, visit);
    return {
      value: String(labs.inRange),
      label: labs.inRange === labs.total ? "markers in range" : `of ${labs.total} markers in range`,
      trend: VISITS.map((n) => allLabs(n).inRange),
      at: placeOf(M.vitals, visit),
      cards: (
        <>
          <Card title="Vitals">
            <Cells items={[{ label: "Resting heart", value: v.pulseBpm, unit: "bpm" }, { label: "Blood pressure", value: `${v.systolicBloodPressureMmhg}/${v.diastolicBloodPressureMmhg}` }, { label: "Studies", value: STUDIES.length }]} />
          </Card>
          <Card title="Body">
            <Cells
              items={[
                { label: "Body fat", value: trim(c.bodyFatPercent), unit: "%" },
                { label: "Visceral fat", value: c.visceralFatRating },
                { label: "Bone T-score", value: trim(Math.min(...b.sites.map((x: Rec) => x.tScore))) },
                { label: "Skin lesions", value: s.lesions.length },
              ]}
            />
          </Card>
          <Card title="Omics">
            <Cells items={[{ label: "Molecular layers", value: M.overview.layers }, { label: "Proteins", value: pr?.proteins }, { label: "Metabolites", value: M.overview.metabolitesAt[String(visit)] || null }, { label: "Gut species", value: gut?.richness }]} />
          </Card>
          <Card title="Patient history" aside={<span className="rv-count">{h.date}</span>}>
            <Facts
              items={[
                ...(h.chiefConcerns.length ? [{ label: "Chief concerns", value: h.chiefConcerns.join(", ") }] : []),
                { label: "Conditions", value: h.conditions.join(", ") || "None recorded" },
                { label: "Medication", value: h.medications.join(", ") || "None recorded" },
                { label: "Allergies", value: h.allergies.join(", ") || "None recorded" },
              ]}
            />
          </Card>
          <Card title="Diagnostic ultrasound">
            {us.studies.map((s: Rec) => (
              <Finding key={s.region} tone="" title={s.region} detail={s.finding} />
            ))}
            <Note>{us.impression}</Note>
          </Card>
          <Card title="GP examination">
            <Facts lead={gp.clinicalImpression} items={gp.findings} />
            <Bullets items={gp.recommendations} />
          </Card>
        </>
      ),
    };
  },

  natural(visit) {
    const v = pick(M.vitals, visit);
    const r = M.vitalRanges;
    const sys = v.systolicBloodPressureMmhg;
    const dia = v.diastolicBloodPressureMmhg;
    const place = (v: number, lim: Rec) => (v < lim.low ? "below" : v > lim.high ? "above" : "in");
    const upper = place(sys, r.systolicBloodPressureMmhg);
    const lower = place(dia, r.diastolicBloodPressureMmhg);
    const out = upper !== "in" ? upper : lower;
    const oxygenOut = v.spo2Percent < r.spo2Percent.low || v.spo2Percent > r.spo2Percent.high;
    return {
      value: `${sys}/${dia}`,
      unit: "mmHg",
      label: "Blood pressure",
      trend: series(M.vitals, "systolicBloodPressureMmhg"),
      at: placeOf(M.vitals, visit),
      flagged: [upper !== "in" ? 0 : -1, lower !== "in" ? 1 : -1],
      ...(out === "in" ? IN() : IN("mon", out === "above" ? "Above range" : "Below range")),
      cards: (
        <>
          <Card title="Blood pressure">
            <Cells
              items={[
                { label: "Systolic", value: sys, unit: "mmHg", under: <Range value={sys} ticks {...r.systolicBloodPressureMmhg} /> },
                { label: "Diastolic", value: dia, unit: "mmHg", under: <Range value={dia} ticks {...r.diastolicBloodPressureMmhg} /> },
              ]}
            />
          </Card>
          <Card title="Vital signs">
            <Cells
              items={[
                { label: "Pulse", value: v.pulseBpm, unit: "bpm" },
                { label: "Oxygen saturation", value: trim(v.spo2Percent), unit: "%", tone: (oxygenOut ? "mon" : "") as Tone, under: <Range value={v.spo2Percent} {...r.spo2Percent} /> },
                { label: "Temperature", value: trim(v.temperatureC), unit: "°C" },
                { label: "Respiration", value: v.respiratoryRatePerMin, unit: "/min" },
              ]}
            />
          </Card>
          <Labs study="natural" visit={visit} />
        </>
      ),
    };
  },

  eye(visit) {
    const t = pick(M.tonometry, visit);
    const r = M.tonometryRanges;
    const isOut = (v: number, lim: { low: number; high: number }) => v < lim.low || v > lim.high;
    // each eye carries its own words, as the portal gives them; the lead is the right eye's
    const place = (v: number, lim: { low: number; high: number }) => (v < lim.low ? "Below range" : v > lim.high ? "Above range" : "In range");
    const eye = (label: string, v: number, lim: { low: number; high: number }) => {
      const out = isOut(v, lim);
      return {
        label,
        value: trim(v),
        unit: "mmHg",
        tone: (out ? "mon" : "") as Tone,
        under: (
          <>
            <Pill tone={out ? "mon" : "ok"}>{place(v, lim)}</Pill>
            <Range value={v} ticks {...lim} />
          </>
        ),
      };
    };
    const right = place(t.rightEyePressureMmhg, r.rightEyePressureMmhg);
    return {
      value: trim(t.rightEyePressureMmhg),
      unit: "mmHg",
      label: "Right eye pressure",
      trend: series(M.tonometry, "rightEyePressureMmhg"),
      at: placeOf(M.tonometry, visit),
      ...(right === "In range" ? IN() : IN("mon", right)),
      cards: (
        <Card title="Eye pressure">
          <Cells items={[eye("Left eye", t.leftEyePressureMmhg, r.leftEyePressureMmhg), eye("Right eye", t.rightEyePressureMmhg, r.rightEyePressureMmhg)]} />
          <Note>{words(t.method)}</Note>
        </Card>
      ),
    };
  },

  brain(visit) {
    const c = pick(M.cognitive, visit);
    return {
      value: trim(c.score),
      unit: `of ${c.maximumScore}`,
      label: c.instrument,
      trend: series(M.cognitive, "score"),
      at: placeOf(M.cognitive, visit),
      cards: (
        <>
          <Card title="Cognitive assessment">
            <div className="rv-meter" role="img" aria-label={`${c.score} of ${c.maximumScore}`}>
              {Array.from({ length: c.maximumScore }, (_, i) => (
                <i key={i} data-on={i < Math.round(c.score) ? "" : undefined} />
              ))}
            </div>
            <Note>{c.interpretation}</Note>
          </Card>
          <Card title="By domain">
            <Cells cols={4} items={Object.entries(c.domains as Rec).map(([k, n]) => ({ label: words(k), value: n as number }))} />
          </Card>
        </>
      ),
    };
  },

  heart(visit) {
    const e = pick(M.ecg, visit);
    const a = pick(M.abi, visit);
    const r = M.abiRanges;
    return {
      value: String(e.heartRateBpm),
      unit: "bpm",
      label: words(e.rhythm),
      trend: series(M.ecg, "heartRateBpm"),
      at: placeOf(M.ecg, visit),
      cards: (
        <>
          <Card title="Electrocardiogram">
            <Cells items={[{ label: "Heart rate", value: e.heartRateBpm, unit: "bpm" }, { label: "Rhythm", value: words(e.rhythm) }]} />
            <Heartbeat
              intervals={[
                { name: "PR", ms: e.prIntervalMs, from: 14, to: 46 },
                { name: "QRS", ms: e.qrsDurationMs, from: 44, to: 62 },
                { name: "QT", ms: e.qtIntervalMs, from: 44, to: 98 },
                { name: "QTc", ms: e.qtcIntervalMs, from: 44, to: 98 },
              ]}
            />
            <Note>{e.interpretation}</Note>
          </Card>
          <Card title="Ankle-brachial index">
            <Cells
              items={[
                { label: "Left ABI", value: trim(a.leftAbi, 2), tone: (a.leftAbi < r.leftAbi.low || a.leftAbi > r.leftAbi.high ? "mon" : "") as Tone, under: <Range value={a.leftAbi} ticks {...r.leftAbi} /> },
                { label: "Right ABI", value: trim(a.rightAbi, 2), tone: (a.rightAbi < r.rightAbi.low || a.rightAbi > r.rightAbi.high ? "mon" : "") as Tone, under: <Range value={a.rightAbi} ticks {...r.rightAbi} /> },
              ]}
            />
            <Note>{a.interpretation}</Note>
          </Card>
          <Labs study="heart" visit={visit} />
        </>
      ),
    };
  },

  lungs(visit) {
    const r = pick(M.rmr, visit);
    return {
      value: String(Math.round(r.restingEnergyExpenditureKcalDay)),
      unit: "kcal a day",
      label: "Resting energy",
      trend: series(M.rmr, "restingEnergyExpenditureKcalDay"),
      at: placeOf(M.rmr, visit),
      cards: (
        <Card title="Resting metabolic rate">
          <Cells
            cols={3}
            items={[
              { label: "VO₂", value: Math.round(r.vo2MlMin), unit: "mL/min" },
              { label: "VCO₂", value: Math.round(r.vco2MlMin), unit: "mL/min" },
              { label: "Respiratory quotient", value: trim(r.respiratoryQuotient, 2) },
            ]}
          />
          <Note>{r.interpretation}</Note>
        </Card>
      ),
    };
  },

  liver: (visit) => labStudy("liver", visit),
  kidneys: (visit) => labStudy("kidneys", visit),
  thyroid: (visit) => labStudy("thyroid", visit),

  stomach(visit) {
    const n = pick(M.nutrition, visit);
    const d = pick(M.dietary, visit);
    const t = labTotals("stomach", visit);
    return {
      value: `${t.inRange}`,
      label: `of ${t.total} metabolic markers in range`,
      ...(t.outside ? IN("mon", `${t.outside} outside range`) : IN("ok", "All in range")),
      cards: (
        <>
          <Labs study="stomach" visit={visit} />
          <Card title="Nutrition assessment">
            <Cells cols={1} items={[{ label: "Dietary pattern", value: n.dietaryPattern }]} />
            <h4 className="rv-sub">Goals</h4>
            <Bullets items={n.goals} />
            <h4 className="rv-sub">Recommendations</h4>
            <Bullets items={n.recommendations} />
          </Card>
          <Card title="Dietary history">
            <Cells
              items={[
                { label: "Allergies and intolerances", value: d.intolerances.join(", ") || "None recorded" },
                { label: "Frequent digestive symptoms", value: d.symptoms.join(", ") || "None recorded" },
                { label: "Meals and snacks a day", value: d.meals },
                { label: "Salt intake", value: d.salt },
                { label: "Diet", value: d.diet },
                { label: "Active days a week", value: d.activeDays, unit: "/ 7" },
              ]}
            />
          </Card>
        </>
      ),
    };
  },

  composition(visit) {
    const c = pick(M.composition, visit);
    const a = pick(M.anthro, visit);
    const r = M.anthroRanges.bmiKgM2;
    const bmiOut = a.bmiKgM2 < r.low || a.bmiKgM2 > r.high;
    return {
      value: trim(c.bodyFatPercent),
      unit: "%",
      label: "Body fat",
      trend: series(M.composition, "bodyFatPercent"),
      at: placeOf(M.composition, visit),
      // body fat has no range in the portal; BMI does, so the study takes its words
      ...(bmiOut ? IN("mon", a.bmiKgM2 < r.low ? "Below range" : "Above range") : IN()),
      cards: (
        <>
          <Card title="VISBODY scan">
            <div className="rv-figure">
              <Ring share={c.bodyFatPercent / 100} label={`${trim(c.bodyFatPercent)}%`} />
              <Parts unit=" kg" items={[{ name: "Lean mass", value: c.leanMassKg }, { name: "Fat mass", value: c.fatMassKg }]} />
            </div>
            <Cells items={[{ label: "Skeletal muscle", value: trim(c.skeletalMuscleMassKg), unit: "kg" }, { label: "Visceral fat rating", value: c.visceralFatRating }]} />
          </Card>
          <Card title="Anthropometrics">
            <Cells
              items={[
                { label: "Height", value: trim(a.heightCm), unit: "cm" },
                { label: "Weight", value: trim(a.weightKg), unit: "kg" },
                { label: "Waist", value: trim(a.waistCircumferenceCm), unit: "cm" },
                { label: "Hip", value: trim(a.hipCircumferenceCm), unit: "cm" },
              ]}
            />
            <Cells
              cols={1}
              items={[
                {
                  label: "BMI",
                  value: trim(a.bmiKgM2),
                  unit: "kg/m²",
                  tone: (bmiOut ? "mon" : "") as Tone,
                  under: (
                    <>
                      <Pill tone={bmiOut ? "mon" : "ok"}>{a.bmiKgM2 < r.low ? "Below range" : a.bmiKgM2 > r.high ? "Above range" : "In range"}</Pill>
                      <Range value={a.bmiKgM2} ticks {...r} />
                    </>
                  ),
                },
              ]}
            />
          </Card>
        </>
      ),
    };
  },

  skeletal(visit) {
    const b = pick(M.bone, visit);
    return {
      value: trim(b.fractureRisk5yPercent),
      unit: "%",
      label: "Five-year fracture risk",
      trend: series(M.bone, "fractureRisk5yPercent"),
      at: placeOf(M.bone, visit),
      cards: (
        <Card title="Bone health">
          <Cells cols={1} items={[{ label: "Fragility score", value: b.fragilityScore }]} />
          <Cells
            items={b.sites.map((s: Rec) => ({
              label: `${words(s.anatomicalSite)}${s.hipSide ? `, ${s.hipSide.toLowerCase()}` : ""}`,
              value: trim(s.tScore),
              unit: "T-score",
              under: <small className="rv-detail">Z-score {trim(s.zScore)} · BMD {trim(s.boneMineralDensityGcm2, 2)} g/cm²</small>,
            }))}
          />
          <Note>{b.findings}</Note>
        </Card>
      ),
    };
  },

  dermatology(visit) {
    const s = pick(M.skin, visit);
    const tone = (r: string): Tone => (r === "high" ? "alert" : r === "moderate" || r === "medium" ? "mon" : r === "low" ? "ok" : "");
    return {
      value: String(s.lesions.length),
      label: s.lesions.length === 1 ? "mapped lesion" : "mapped lesions",
      trend: M.skin.map((r: Rec) => r.lesions.length),
      at: placeOf(M.skin, visit),
      cards: (
        <>
          <Card title="Skin map">
            <Note>{s.summary}</Note>
            {/* the portal names the first three; the count above holds them all */}
            {s.lesions.slice(0, 3).map((l: Rec) => (
              <Finding key={l.identifier} tone={tone(l.risk)} title={`${l.identifier} · ${words(l.region)}`} detail={`${words(l.risk)} risk · ${l.change}`} />
            ))}
          </Card>
          <Card title="Recommendations">
            <Bullets items={s.recommendations} />
          </Card>
        </>
      ),
    };
  },
};
