// Font-size calibration: for single-line labels, compares the ink width measured in a
// capture with Helvetica Neue's advance width (canvas measureText, real font files)
// and prints the CSS font-size + best-fitting weight.
//
// usage: node tests/calibrate.mjs <ref> "<label>" ["<label>" …]
//   ref = capture id (home/top). Labels must be single-line nodes in the XML dump.
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";

const [ref, ...labels] = process.argv.slice(2);
const BASE = process.env.PROTO_URL ?? "http://localhost:5173/phenome-longevity-prototype/";

const ink = spawnSync("python", ["-I", "tests/inkwidth.py", ref, ...labels], { encoding: "utf8" });
if (ink.status !== 0) {
  console.error(ink.stderr);
  process.exit(1);
}
const rows = JSON.parse(ink.stdout); // [{label, inkW, inkH}] in CSS px

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${BASE}#/__screens`);
await page.evaluate(() => document.fonts.ready);
for (const r of rows) {
  const fits = await page.evaluate(async ({ label }) => {
    const out = [];
    for (const w of [300, 400, 500, 700]) {
      await document.fonts.load(`${w} 100px "Helvetica Neue"`);
      const c = document.createElement("canvas").getContext("2d");
      c.font = `${w} 100px "Helvetica Neue"`;
      const m = c.measureText(label);
      out.push({ w, ink100: m.actualBoundingBoxRight + m.actualBoundingBoxLeft, asc100: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent });
    }
    return out;
  }, r);
  const cands = fits.map((f) => ({ weight: f.w, size: (r.inkW / f.ink100) * 100, sizeByH: (r.inkH / f.asc100) * 100 }));
  // best weight = width-derived and height-derived sizes agree most
  cands.sort((a, b) => Math.abs(a.size - a.sizeByH) - Math.abs(b.size - b.sizeByH));
  const b = cands[0];
  console.log(`${JSON.stringify(r.label).padEnd(34)} → ${b.size.toFixed(1)}px w${b.weight}   (by height ${b.sizeByH.toFixed(1)}; left ${r.left.toFixed(1)} top ${r.top.toFixed(1)})`);
}
await browser.close();
