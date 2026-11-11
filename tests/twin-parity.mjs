// Compares what the app's full review shows against what the clinic portal's own
// presentation player shows for the same member, view by view and visit by visit.
// Inputs (git-ignored, written by tests/capture-parity.mjs): capture/portal/30005-truth[-scenario].json
// (portal player panel text) and capture/portal/30005-app[-scenario].json (app screen text).
// Usage: node tests/twin-parity.mjs [clinic|varied|first|risk]
import { readFileSync } from "node:fs";

const MODE = process.argv[2] ?? "clinic";
const SUFFIX = MODE === "clinic" ? "" : `-${MODE}`;
const truth = JSON.parse(readFileSync(`capture/portal/30005-truth${SUFFIX}.json`, "utf8"));
const app = JSON.parse(readFileSync(`capture/portal/30005-app${SUFFIX}.json`, "utf8"));
const member = JSON.parse(readFileSync(`src/v2/study/member${SUFFIX}.json`, "utf8"));
const VISITS = truth.__visits ?? [1, 2, 3, 4];
const LAST = VISITS[VISITS.length - 1];

// words the panels use for status; both sides must agree on which appear
const STATUS = /\b(In range|Above range|Below range|All in range|\d+ outside range|\d+ need attention|\d+ to monitor|No priority findings|Mildly elevated|Elevated|Immediate attention needed|Monitor closely|For your information|No findings|years younger|years older|In line with your age|look typical|typical|moderate|high|low)\b/g;

const MONTHS = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec";
const DATE_US = new RegExp(`\\b(${MONTHS}) (\\d{1,2}), (\\d{4})\\b`, "g");
const DATE_GB = new RegExp(`\\b(\\d{1,2}) (${MONTHS}) (\\d{4})\\b`, "g");
const dates = (s) => new Set([...s.matchAll(DATE_US)].map((m) => `${m[2]} ${m[1]} ${m[3]}`).concat([...s.matchAll(DATE_GB)].map((m) => `${m[1]} ${m[2]} ${m[3]}`)));
// dates are compared on their own; record steppers ("2 of 4") and view counters ("06 / 19") are navigation
const strip = (s) => s.replace(DATE_US, " ").replace(DATE_GB, " ").replace(/· \d+ of \d+\b/g, " ").replace(/\b\d\d \/ \d\d\b/g, " ");
// the player sets a large number's decimals as their own text node: "21 | . | 2"
const join = (s) => s.replace(/(\d) \| ([.,]) \| (\d)/g, "$1$2$3");
// the player's own frame around the panel: study rows, stance and focus labels, section names, translation stubs
// ("Genome variants" is a label the player always hides: a genome result carries no variant count)
const PLAYER_CHROME = new Set([...truth.__codes, "Vitals", "Body", "Omics", "Baseline", "Study", "Stance", "Study  Stance", "Focus", "Genome variants", "intestines", "brain", "heart", "lungs", "liver", "kidneys", "thyroid", "stomach", "Studies"]);
const numbers = (s) => new Set((strip(join(s)).replace(/−/g, "-").match(/-?\d+(?:[.,]\d+)?/g) ?? []).map((n) => String(Number(n.replace(",", "")))));
const statuses = (s) => new Set(s.match(STATUS) ?? []);
// app chrome: status bar clock and battery, visit tab numbers
// and the review bar at the foot: "Vitals | 7 | Liver | Vitals | · | 7 | of | 19"
const chrome = (s) =>
  s
    .replace(/^\d\d:\d\d \| ··· \| \d+ \| \d+ \|/, "")
    .replace(/Visit \| \d/g, "")
    // the twin's "Visit 4, 1 Aug 2026": which visit it reads, the date is checked
    .replace(/Visit \d+, /g, "")
    .replace(/\| [A-Za-z]+ \| \d+ \| [^|]+ \| [A-Za-z]+ \| · \| \d+ \| of \| \d+\s*$/, "");

/*
 * Numbers the app may show that the portal's panel for the same view does not, each still the portal's own data:
 * - a lab region's marker values: the room screen folds a panel to "4 in range" when it runs out of space, a phone scrolls
 * - the lead count of a lab region (markers in range), drawn from those same markers
 * - metabolomics' lead, the portal overview's own "Metabolites" count
 */
function allowedExtras(code, v) {
  const ok = new Set();
  const panels = member.labs[code] ?? [];
  const at = (rows) => rows.find((r) => r.visit === v) ?? rows.at(-1);
  for (const p of panels) for (const a of at(p.visits).analytes) if (typeof a.value === "number") ok.add(String(Number(a.value)));
  // the lead's count of markers in range, and of all the region's markers
  const markers = panels.flatMap((p) => at(p.visits).analytes);
  if (panels.length) ok.add(String(markers.filter((a) => a.flag === "normal").length)).add(String(markers.length));
  if (code === "metabolomics") ok.add(String(member.overview.metabolitesAt[String(v)]));
  return ok;
}

let failures = 0;
for (const code of truth.__codes) {
  for (const v of VISITS) {
    const t = truth[code]?.[v];
    if (!t) continue;
    compare(`review ${code} v${v}`, code, v, t, app[code]?.[v] ?? app[code]?.[1]);
  }
  // the twin's region for the study, read at the newest visit
  if (code !== "apose") compare(`twin ${code}`, code, LAST, truth[code][LAST], app.__twin?.[code]);
}

function compare(name, code, v, t, a) {
  {
    if (!a) {
      console.log(`${name}: app has no screen`);
      failures++;
      return;
    }
    const tText = `${t.panel} | ${t.overview}`.replace(/\| \d\d \/ \d\d \|/, "");
    const aText = chrome(a);
    const tn = numbers(tText);
    const an = numbers(aText);
    const allowed = allowedExtras(code, v);
    const missing = [...tn].filter((n) => !an.has(n));
    const extra = [...an].filter((n) => !tn.has(n) && !allowed.has(n));
    const ts = statuses(tText);
    const as = statuses(aText);
    const sMissing = [...ts].filter((x) => !as.has(x));
    const sExtra = [...as].filter((x) => !ts.has(x));
    // every piece of wording the portal shows must be on the app screen too
    const flat = aText.toLowerCase().replace(/ \| /g, " ");
    const words = [...new Set(join(tText).split(" | "))]
      .map((w) => w.trim())
      // a record stepper ("Aug 1, 2026 · 4 of 4") is navigation; the app steps by visit tabs
      .filter((w) => /[a-z]{3}/i.test(w) && !PLAYER_CHROME.has(w) && !/· \d+ of \d+$/.test(w) && !new RegExp(DATE_US.source).test(w) && !/^‹|›$/.test(w))
      .filter((w) => !flat.includes(w.toLowerCase().replace(/%$/, "").trim()));
    if (words.length) {
      failures++;
      console.log(`${name}\n  portal wording not in app: ${words.map((w) => JSON.stringify(w)).join(" ")}`);
    }
    const td = dates(tText);
    const ad = dates(aText);
    const dMissing = [...td].filter((x) => !ad.has(x));
    if (missing.length || extra.length || sMissing.length || sExtra.length || dMissing.length) {
      failures++;
      console.log(name);
      if (dMissing.length) console.log(`  portal dates not in app: ${dMissing.join(", ")} (app: ${[...ad].join(", ")})`);
      if (missing.length) console.log(`  portal numbers not in app: ${missing.join(" ")}`);
      if (extra.length) console.log(`  app numbers not in portal: ${extra.join(" ")}`);
      if (sMissing.length) console.log(`  portal statuses not in app: ${sMissing.join(", ")}`);
      if (sExtra.length) console.log(`  app statuses not in portal: ${sExtra.join(", ")}`);
    }
  }
}
// Home's clinic readings and the Omics tab show no view of their own: every number on them must be
// one the portal shows somewhere at the newest visit (any view, its overview, or a lab marker's value)
const latest = new Set(truth.__codes.flatMap((c) => [...numbers(`${truth[c][LAST].panel} ${truth[c][LAST].overview}`), ...allowedExtras(c, LAST)]));
const unknown = (text) => [...numbers(text)].filter((n) => !latest.has(n));
for (const [id, text] of Object.entries(app.__metrics ?? {})) {
  const off = unknown(text);
  if (off.length) {
    failures++;
    console.log(`home metric ${id}: not in the portal: ${off.join(" ")} (${text})`);
  }
}
const omicsOff = unknown(app.__omics ?? "");
if (omicsOff.length) {
  failures++;
  console.log(`omics tab: not in the portal: ${omicsOff.join(" ")}`);
}
console.log(failures ? `\n${MODE}: ${failures} view-visits differ` : `\n${MODE}: all views match the portal`);
process.exit(failures ? 1 : 0);
