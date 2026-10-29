// Screenshot prototype screens at the capture device geometry (394×853 CSS @ 3.25 DPR = 1280×2772 px)
// and hand them to tests/diff.py for scoring against capture/screens/<ref>.png.
//
// usage: node tests/compare.mjs [filter]      (filter = substring of case name / module file)
// config: tests/compare/<module>.json  →  [{ name, route, ref, scroll?, click?: [text…], wait?, query? }]
//   route  hash path, e.g. "/home"
//   ref    capture id, e.g. "home/top" (→ capture/screens/home/top.png)
//   scroll px to scroll the [data-scroll-root] element (CSS px)
//   click  list of visible texts to click in order before the shot
//   query  extra hash query, e.g. "data=demo&theme=dark"
import { chromium } from "playwright";
import { readdirSync, readFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const BASE = process.env.PROTO_URL ?? "http://localhost:5173/phenome-longevity-prototype/";
const filter = process.argv[2] ?? "";
const cfgDir = "tests/compare";
const outDir = "tests/out/proto";
mkdirSync(outDir, { recursive: true });

const cases = readdirSync(cfgDir)
  .filter((f) => f.endsWith(".json"))
  .flatMap((f) => JSON.parse(readFileSync(join(cfgDir, f), "utf8")).map((c) => ({ ...c, file: f })))
  .filter((c) => !filter || c.name.includes(filter) || c.file.includes(filter));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 394, height: 853 }, deviceScaleFactor: 3.25 });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.error(`  [pageerror] ${e.message}`));

for (const c of cases) {
  const q = ["theme=light", "data=real", "net=online", c.query].filter(Boolean).join("&");
  // full reload per case: a hash-only goto would keep React state, stores and prefs from the previous case
  await page.goto("about:blank");
  await page.goto(`${BASE}#${c.route}?${q}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  for (const t of c.click ?? []) {
    await page.getByText(t, { exact: false }).first().click();
    await page.waitForTimeout(450);
  }
  if (c.scroll) {
    await page.evaluate((y) => {
      const roots = document.querySelectorAll("[data-scroll-root]");
      roots[roots.length - 1]?.scrollTo(0, y);
    }, c.scroll);
  }
  await page.waitForTimeout(c.wait ?? 500);
  await page.screenshot({ path: join(outDir, `${c.name}.png`), animations: "disabled", caret: "hide" });
  console.log(`shot ${c.name}`);
}
await browser.close();

const r = spawnSync("python", ["-I", "tests/diff.py", JSON.stringify(cases.map(({ name, ref }) => ({ name, ref })))], { stdio: "inherit" });
process.exit(r.status ?? 0);
