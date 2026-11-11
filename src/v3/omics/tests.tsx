import { useSyncExternalStore, type ReactNode } from "react";
import { M, pick, visitDate, type Rec } from "../study/data";
import { Microbiome } from "../study/blocks";
import { Card, Note, Parts } from "../study/parts";
import { CarrierCard, GenomeCard, GpgsCard, MetabPanelCard, NewbornCard } from "../study/viewsOmics";
import { readingOf } from "../twin/regions";
import { historyOf, type Level } from "../kits/history";

/*
 * Every test behind an omics tab: the kits it is read from, and each time a kit
 * was run. A tab shows one run at a time, the newest by default; the member can
 * pick any other. A home kit is sent back by post; a clinic sample is taken at
 * a visit, so its runs are the visits.
 *
 * DEMO where the portal is silent: genomic kits other than the genome itself,
 * the dates of their runs and the panel versions are prototype data.
 */

export interface TestRun {
  /** stable key for the URL and the "seen" store */
  key: string;
  date: string;
  /** the clinic visit it was taken at, for clinic samples and visit-linked kits */
  visit?: number;
  /** lab panel version, when the lab reports one */
  panel?: string;
}

export interface TestKit {
  id: string;
  name: string;
  /** the product family whose mark it wears */
  family: string;
  how: "Home kit" | "Clinic sample";
  /** newest first; empty when the member has not taken it */
  runs: TestRun[];
}

const byVisit = (rows: Rec[] | undefined, prefix: string): TestRun[] =>
  [...(rows ?? [])].reverse().map((r) => ({ key: `${prefix}-v${r.visit}`, date: r.date ?? visitDate(r.visit), visit: r.visit }));

const metabRuns = (name: string, prefix: string) => byVisit((M.metabolomics as Rec[]).find((m) => m.name === name)?.visits, prefix);

const genomicRuns = (id: string, title: string): TestRun[] => {
  const h = historyOf("genome", title);
  if (h) return [...h.runs].reverse().map((r, i) => ({ key: `${id}-${h.runs.length - i}`, date: r.date, panel: r.panel }));
  return M.genome ? [{ key: `${id}-1`, date: M.genome.date }] : [];
};

export function testsOf(topic: string): TestKit[] {
  switch (topic) {
    case "genomics":
      return [
        { id: "genetic", name: "Genetic Insights", family: "Genome", how: "Home kit", runs: genomicRuns("genetic", "Genetic Insights") },
        { id: "sports", name: "Sports Performance", family: "Genome", how: "Home kit", runs: genomicRuns("sports", "Sports Performance") },
        { id: "carrier", name: "Carrier Screening", family: "Genome", how: "Home kit", runs: M.carrier ? genomicRuns("carrier", "Carrier Screening") : [] },
        { id: "newborn", name: "Newborn Screening", family: "Genome", how: "Home kit", runs: M.newborn ? genomicRuns("newborn", "Newborn Screening") : [] },
      ];
    case "transcriptomics":
      return [{ id: "transcriptome", name: "Transcriptome Analysis", family: "Transcriptome", how: "Clinic sample", runs: byVisit(M.transcriptome, "tx") }];
    case "proteomics":
      return [{ id: "proteome", name: "Proteome Insights", family: "Proteome", how: "Clinic sample", runs: byVisit(M.proteomics, "px") }];
    case "metabolomics":
      return [
        { id: "plasma", name: "Plasma metabolomics", family: "Metabolome", how: "Clinic sample", runs: metabRuns("Plasma metabolomics", "pm") },
        { id: "urine", name: "Urine metabolomics", family: "Metabolome", how: "Clinic sample", runs: metabRuns("Urine metabolomics", "um") },
        { id: "lipids", name: "Plasma lipidomics", family: "Lipidome", how: "Clinic sample", runs: metabRuns("Plasma lipidomics", "pl") },
      ];
    case "guthealth":
      return [
        { id: "gut", name: "Gut Microbiome Test", family: "Gut", how: "Home kit", runs: byVisit(M.gut, "gut") },
        { id: "vaginal", name: "Vaginal Microbiome", family: "Vaginal", how: "Clinic sample", runs: byVisit(M.vaginal, "vag") },
      ];
    case "oralhealth":
      return [{ id: "oral", name: "Oral Microbiome Test", family: "Oral", how: "Home kit", runs: byVisit(M.oral, "oral") }];
    default:
      return [];
  }
}

export interface Pick {
  kit: TestKit;
  run: TestRun;
  /** the tab's newest run of any kit: the default, and the one the summary card reads */
  newest: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "1 Aug 2026" as a number that sorts by date, read by hand so every browser agrees. */
const time = (d: string) => {
  const [day, mon, year] = d.split(" ");
  return Number(year) * 10000 + (MONTHS.indexOf(mon) + 1) * 100 + Number(day) || 0;
};

/** The newest run across a tab's kits; ties go to the kit listed first. */
export function newestOf(kits: TestKit[]): Pick | null {
  let best: Pick | null = null;
  for (const kit of kits) {
    const run = kit.runs[0];
    if (run && (!best || time(run.date) > time(best.run.date))) best = { kit, run, newest: true };
  }
  return best;
}

/** The run a key names, or the newest when the key is absent or unknown. */
export function pickOf(kits: TestKit[], key: string | null): Pick | null {
  const top = newestOf(kits);
  if (!key) return top;
  for (const kit of kits) {
    const run = kit.runs.find((r) => r.key === key);
    if (run) return { kit, run, newest: run.key === top?.run.key };
  }
  return top;
}

/* ---------------------------------------------------------------- what a run shows */

const LEVEL_TONE: Record<Level, "ok" | "mon" | "alert"> = { Lower: "ok", Typical: "ok", Raised: "mon", High: "alert" };

/** Sports performance has no portal record: its reading comes from the demo history. */
function SportsCard({ runKey }: { runKey: string }) {
  const h = historyOf("genome", "Sports Performance");
  if (!h) return null;
  const n = Number(runKey.split("-").pop()) - 1;
  const run = h.runs[Math.max(0, Math.min(h.runs.length - 1, n))];
  const groups = [...new Set(h.findings.map((f) => f.group))];
  return (
    <>
      {groups.map((g) => (
        <Card key={g} title={g}>
          {h.findings
            .filter((f) => f.group === g)
            .map((f) => {
              const v = run.levels[f.id];
              return (
                <div key={f.id} className="om-lv" data-tone={v ? LEVEL_TONE[v] : undefined}>
                  <span>{f.name}</span>
                  <b>
                    <i aria-hidden />
                    {v ?? "Not read"}
                  </b>
                </div>
              );
            })}
        </Card>
      ))}
    </>
  );
}

/** The cards for one run of one kit, in the tab's existing card style. */
export function contentOf(topic: string, p: Pick): ReactNode {
  const v = p.run.visit;
  switch (p.kit.id) {
    case "genetic":
      return (
        <>
          <GenomeCard />
          <GpgsCard />
          {!p.newest && p.run.panel && <Note>{`Read with ${p.run.panel}. Your DNA is the same; a newer panel may read some findings differently.`}</Note>}
        </>
      );
    case "sports":
      return <SportsCard runKey={p.run.key} />;
    case "carrier":
      return <CarrierCard />;
    case "newborn":
      return <NewbornCard />;
    case "plasma":
      return <MetabPanelCard name="Plasma metabolomics" visit={v ?? 0} />;
    case "urine":
      return <MetabPanelCard name="Urine metabolomics" visit={v ?? 0} />;
    case "lipids":
      return <MetabPanelCard name="Plasma lipidomics" visit={v ?? 0} />;
    case "gut":
      return <Microbiome rec={pick(M.gut, v ?? 0)} />;
    case "vaginal":
      return (
        <Card title="Vaginal microbiome">
          <Parts items={pick(M.vaginal, v ?? 0).species} />
        </Card>
      );
    case "oral":
      return <Microbiome rec={pick(M.oral, v ?? 0)} />;
    default: {
      const view = readingOf(topic, v);
      return view.omicsCards ?? view.cards;
    }
  }
}

/* ---------------------------------------------------------------- new results */

/*
 * A tab carries a dot while its newest run has not been opened. Opening the tab
 * marks it seen. DEMO: on a first visit, genomics (re-read with a newer panel)
 * and gut health (a new sample) count as new; everything else as already seen.
 */
const SEEN_KEY = "phenome.v3.omics.seen";
const FRESH = new Set(["genomics", "guthealth"]);

function readSeen(): Record<string, string> | null {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "null");
  } catch {
    return null;
  }
}

let seen: Record<string, string> | null = readSeen();
const listeners = new Set<() => void>();

function seenMap(topics: string[]): Record<string, string> {
  if (seen) return seen;
  // first visit: everything seen except the demo's fresh tabs
  seen = Object.fromEntries(topics.filter((t) => !FRESH.has(t)).map((t) => [t, newestOf(testsOf(t))?.run.key ?? ""]));
  return seen;
}

export function markSeen(topic: string) {
  const key = newestOf(testsOf(topic))?.run.key;
  if (!key || seen?.[topic] === key) return;
  seen = { ...(seen ?? {}), [topic]: key };
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {
    // storage blocked: seen for this visit only
  }
  listeners.forEach((l) => l());
}

/** The review panel's switch: the demo's fresh tabs new again, or every tab opened. */
export function setOmicsNew(fresh: boolean, topics: string[]) {
  seen = null;
  try {
    localStorage.removeItem(SEEN_KEY);
  } catch {
    // storage blocked
  }
  if (!fresh) {
    seen = Object.fromEntries(topics.map((t) => [t, newestOf(testsOf(t))?.run.key ?? ""]));
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    } catch {
      // storage blocked
    }
  }
  listeners.forEach((l) => l());
}

/** Whether any tab still shows a new-results dot. */
export function useAnyUnseen(topics: string[]): boolean {
  return useUnseen(topics).size > 0;
}

/** Which tabs have a newest run the member has not opened yet. */
export function useUnseen(topics: string[]): Set<string> {
  const map = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => seenMap(topics),
  );
  return new Set(topics.filter((t) => map[t] !== newestOf(testsOf(t))?.run.key));
}
