// Pulls every result of the demo member from the clinic portal into
// capture/portal/30005-raw.json, the input of scripts/build-member.mjs.
//
// It signs in as a portal user and lets the results page make its own requests,
// widening the page's one data-fetch to each record in turn, so the token never
// leaves the browser. The account comes from the environment and is not stored:
//   PORTAL_EMAIL=... PORTAL_PASSWORD=... node scripts/fetch-portal.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const PORTAL = "https://www.phenomeclinics.com/portal";
const PATIENT = 30005;
const OUT = `capture/portal/${PATIENT}-raw.json`;
const { PORTAL_EMAIL: email, PORTAL_PASSWORD: password } = process.env;
if (!email || !password) {
  console.error("Set PORTAL_EMAIL and PORTAL_PASSWORD (a clinic portal account that can read this patient).");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${PORTAL}/login`);
await page.locator("input[type=email]").fill(email);
await page.locator("input[type=password]").fill(password);
await page.getByRole("button", { name: "Sign In" }).click();
await page.waitForURL(/\/portal\/(?!login)/, { timeout: 30000 });

// which records exist: the page asks for this itself on the way in
const availability = page.waitForResponse((r) => r.url().endsWith(`/Patients/${PATIENT}/results/data-availability`) && r.status() === 200);
const all = [];
let done = false;
let finished = false;
await page.route(`**/Patients/${PATIENT}/results/data-fetch`, async (route) => {
  if (done) return route.continue();
  done = true;
  const listed = (await (await availability).json()).dataTypes;
  for (const { dataType, results } of listed) {
    for (const r of results) {
      const selection = r.kind === "medical_record" ? { dataTypeCode: dataType.code, medicalRecordId: r.medicalRecordId } : { dataTypeCode: dataType.code, jobId: r.jobId };
      // one record per request: the API refuses a selection of every record at once
      const res = await route.fetch({ postData: JSON.stringify({ selections: [selection] }) });
      if (res.status() !== 200) throw new Error(`${dataType.code} ${selection.medicalRecordId ?? selection.jobId}: ${res.status()}`);
      all.push(...(await res.json()).results);
    }
  }
  finished = true;
  await route.continue();
});
await page.goto(`${PORTAL}/patients/${PATIENT}/results?type=medical.vital_signs`);
while (!finished) await page.waitForTimeout(500);
await browser.close();

mkdirSync("capture/portal", { recursive: true });
writeFileSync(OUT, JSON.stringify({ results: all }));
console.log(`wrote ${OUT}: ${all.length} records`);
