// Captures both sides of tests/twin-parity.mjs.
//  portal: the clinic portal's presentation player (clinicportalfrontend, origin/main) served
//          locally and fed this member's records, one visit at a time -> capture/portal/30005-truth[-scenario].json
//  app:    the full review on the dev server, every view at every visit -> capture/portal/30005-app[-scenario].json
// A design scenario (scripts/build-scenarios.mjs) is checked the same way, the app opened on it with ?member=.
// Needs: capture/portal/30005-raw[-scenario].json, the portal repo at ../clinicportalfrontend, `npm run dev` on 5191.
// Usage: node tests/capture-parity.mjs [portal|app|both] [clinic|varied|first|risk]
import { createServer } from "node:http";
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { extname, join } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright";

const only = process.argv[2];
const MODE = process.argv[3] ?? "clinic";
const SUFFIX = MODE === "clinic" ? "" : `-${MODE}`;
const RAW = `capture/portal/30005-raw${SUFFIX}.json`;
const TRUTH = `capture/portal/30005-truth${SUFFIX}.json`;
const APP_OUT = `capture/portal/30005-app${SUFFIX}.json`;
const ASK = `member=${MODE}`;
const PORTAL_REPO = "../clinicportalfrontend";
const APP = "http://localhost:5191/phenome-longevity-prototype/#/v2/study/";
const TWIN = "http://localhost:5191/phenome-longevity-prototype/#/v2/twin?organ=";
const METRIC = "http://localhost:5191/phenome-longevity-prototype/#/v2/metric/";
const OMICS = "http://localhost:5191/phenome-longevity-prototype/#/v2/omics";
/* the metric rows read from the portal (src/v2/data/metrics.ts clinicRows); the rest are device demo */
const CLINIC_METRICS = ["bp", "pulse", "spo2", "resp", "crp", "tc", "tg", "glucose", "hba1c", "tsh", "egfr", "weight", "bmi", "bodyfat", "visceral", "bone", "skin", "diversity"];
const ORDER = ["apose", "natural", "eye", "brain", "heart", "lungs", "liver", "kidneys", "thyroid", "stomach", "intestines", "composition", "skeletal", "dermatology", "genomics", "guthealth", "oralhealth", "transcriptomics", "proteomics", "metabolomics"];
const visitsOf = (raw) => [...new Set(raw.map((r) => r.selection.visitNumber).filter((v) => v !== null && v !== undefined))].sort((a, b) => a - b);

// text nodes in document order. A panel's later pages are hidden only until they turn, so they are read;
// an overview cell the player takes out is hidden for good, so with `taken` set it is skipped
const TEXT_OF = (sel, taken = false) => {
  const root = document.querySelector(sel);
  if (!root) return "";
  const out = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    if (taken && n.parentElement?.closest("[hidden]")) continue;
    const t = n.textContent.replace(/\s+/g, " ").trim();
    if (t) out.push(t);
  }
  return out.join(" | ");
};

// the server sends the player its chrome copy; these stand in for it
function translations() {
  const t = {};
  const add = (prefix, pairs) => Object.entries(pairs).forEach(([k, v]) => (t[`digital_twin.${prefix}${k}`] = v));
  add("", { age_years: "years", body_model: "Body model", choose_study: "Choose study", female: "Female", male: "Male", motion_copy: "Motion copy", motion_study: "Motion study", motion_title: "Digital twin", next_study: "Next", previous_study: "Previous", open_library: "Library", studies: "Studies", study_label: "Study", view_label: "View", title: "Digital twin" });
  add("overview.", { blood_pressure: "Blood pressure", body_fat: "Body fat", bone_t_score: "Bone T-score", genome_variants: "Genome variants", gut_species: "Gut species", metabolites: "Metabolites", molecular_layers: "Molecular layers", proteins: "Proteins", resting_heart: "Resting heart", skin_lesions: "Skin lesions", visceral_fat: "Visceral fat" });
  for (const c of ["baseline", "vitals", "body", "omics"]) add(`category.${c}.`, { name: c[0].toUpperCase() + c.slice(1), note: c });
  return t;
}

async function portal(browser) {
  const dir = mkdtempSync(join(tmpdir(), "twin-player-"));
  // tar reads backslashes as escapes, so it is handed the folder with forward ones
  execSync(`git -C ${PORTAL_REPO} archive origin/main public/room-display/digital-twin | tar -x -C "${dir.replace(/\\/g, "/")}"`, { stdio: "inherit", shell: "bash" });
  const root = join(dir, "public");
  copyFileSync(RAW, join(root, "room-display/digital-twin/payload-data.json"));
  const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".wasm": "application/wasm" };
  const server = createServer((req, res) => {
    const file = join(root, decodeURIComponent(req.url.split("?")[0]));
    if (!existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
  }).listen(5208);
  const raw = JSON.parse(readFileSync(RAW, "utf8")).results;
  const codes = ORDER.filter((c) => raw.some((r) => r.dataType.poseCode === c));
  const visits = visitsOf(raw);
  const truth = { __codes: codes, __visits: visits, __errors: [] };
  const page = await browser.newPage();
  for (const v of visits) {
    // a fresh page per visit: the player remembers which record each panel was stepped to
    await page.goto("http://127.0.0.1:5208/room-display/digital-twin/index.html?view=pose&sex=female");
    await page.waitForTimeout(5000);
    const part = await page.evaluate(
      async ({ v, codes, T, TEXT_OF }) => {
        const textOf = new Function(`return (${TEXT_OF})`)();
        const raw = (await (await fetch("payload-data.json")).json()).results;
        const studies = codes.map((c) => ({ code: c, name: c, note: "", sectionName: "" }));
        const data = raw.filter((r) => r.selection.visitNumber == null || r.selection.visitNumber <= v);
        const out = {};
        const errors = [];
        let rendered = 0;
        addEventListener("message", (e) => {
          if (e.data?.type === "phenome-digital-twin:rendered") rendered++;
          if (e.data?.type === "phenome-digital-twin:error") errors.push(e.data.message);
        });
        for (const code of codes) {
          const before = rendered;
          const eb = errors.length;
          postMessage({ type: "phenome-digital-twin:load", sessionId: 9000, languageCode: "en", modelSex: "FEMALE", currentStudyCode: code, studies, translations: T, data, patient: {} }, "*");
          for (let i = 0; i < 50 && rendered === before && errors.length === eb; i++) await new Promise((r) => setTimeout(r, 100));
          await new Promise((r) => setTimeout(r, 500));
          out[code] = { panel: textOf("#posePanel"), overview: code === "apose" ? ["#poseGrpOmics", "#poseGrpVitals", "#poseGrpBody"].map((g) => textOf(g, true)).join(" || ") : "" };
        }
        return { out, errors };
      },
      { v, codes, T: translations(), TEXT_OF: TEXT_OF.toString() },
    );
    for (const [c, x] of Object.entries(part.out)) (truth[c] ??= {})[v] = x;
    truth.__errors.push(...part.errors);
  }
  server.close();
  writeFileSync(TRUTH, JSON.stringify(truth));
  console.log(`portal (${MODE}): ${codes.length} views x ${visits.length} visits, ${truth.__errors.length} player errors${truth.__errors.length ? `: ${truth.__errors.slice(0, 3).join(" / ")}` : ""}`);
}

async function app(browser) {
  const page = await browser.newPage({ viewport: { width: 393, height: 853 } });
  const raw = JSON.parse(readFileSync(RAW, "utf8")).results;
  const codes = ORDER.filter((c) => raw.some((r) => r.dataType.poseCode === c));
  const out = {};
  for (const c of codes) {
    await page.goto(`${APP}${c}?${ASK}`);
    await page.waitForTimeout(1200);
    const tabs = page.locator(".rv-visits button");
    const n = await tabs.count();
    out[c] = {};
    if (!n) out[c][1] = await page.evaluate(TEXT_OF, ".rv");
    for (let i = 0; i < n; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(400);
      out[c][i + 1] = await page.evaluate(TEXT_OF, ".rv");
    }
  }
  // the twin opens each study on its region and reads the newest visit, so it is checked against that visit
  out.__twin = {};
  for (const c of codes.filter((c) => c !== "apose")) {
    await page.goto(`${TWIN}${c}&${ASK}`);
    await page.waitForTimeout(1500);
    out.__twin[c] = await page.evaluate(TEXT_OF, ".tw-detail");
  }
  // Home's clinic readings, each on its own page, and the Omics tab whole
  out.__metrics = {};
  for (const id of CLINIC_METRICS) {
    await page.goto(`${METRIC}${id}?${ASK}`);
    await page.waitForTimeout(900);
    out.__metrics[id] = await page.evaluate(TEXT_OF, ".mx-value b");
  }
  await page.goto(`${OMICS}?${ASK}`);
  await page.waitForTimeout(1500);
  out.__omics = await page.evaluate(TEXT_OF, ".om");
  writeFileSync(APP_OUT, JSON.stringify(out));
  console.log(`app (${MODE}): ${codes.length} views, ${Object.keys(out.__twin).length} twin regions, ${CLINIC_METRICS.length} metrics, omics tab`);
}

const browser = await chromium.launch();
if (only !== "app") await portal(browser);
if (only !== "portal") await app(browser);
await browser.close();
