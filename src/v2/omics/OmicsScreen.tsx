import type { CSSProperties } from "react";
import type { OrganId } from "../data/metrics";
import { CHRONOLOGICAL_AGE, ORGANS } from "../data/organs";
import { Chevron } from "../ui/icons";
import { Avatar, useGo, V2Screen } from "../ui/shell";
import "./omics.css";

interface Panel {
  title: string;
  line: string;
  to: string | null;
  flag?: boolean;
}

/* the app's own panels and routes; a panel with a twin reading opens there first */
const PANELS: Panel[] = [
  { title: "Proteome", line: "Organ ages, +5 at most", to: "/v2/twin?lens=omics", flag: true },
  { title: "Gut", line: "Diversity high, +8%", to: "/v2/metric/diversity" },
  { title: "Lipidome", line: "Cholesterol 3.25 mmol/L", to: "/v2/metric/tc" },
  { title: "Metabolome", line: "Glucose 6.2 mmol/L", to: "/v2/metric/glucose" },
  { title: "Genome", line: "Risk panel stable", to: "/insights/kit/genome" },
  { title: "Transcriptome", line: "Expression stable", to: "/insights/kit/transcriptome" },
  { title: "Oral", line: "Balance stable", to: "/insights/kit/oral" },
];

const WAITING = ["Vaginal", "Precision Oncology", "Infectious Diseases"];

const AGES: OrganId[] = ["immune", "liver", "kidneys", "lungs", "brain", "heart"];
const SPAN = 6;

/**
 * Omics changes between scans, not between days, so it gets a destination of
 * its own. It opens on the one reading that needs every layer at once.
 */
export function OmicsScreen() {
  const go = useGo();
  return (
    <V2Screen>
      <header className="v2-top">
        <h1>Omics</h1>
        <Avatar />
      </header>
      <div className="om scroll">
        <p className="om-coach">Your immune system reads five years older than you. Your heart reads four years younger.</p>

        <button className="om-ages" onClick={(e) => go("/v2/twin?lens=omics", { from: e.currentTarget })}>
          <span className="om-ages-h">
            <b>Organ ages</b>
            <span>
              You are {CHRONOLOGICAL_AGE} <Chevron size={15} />
            </span>
          </span>
          <span className="om-axis" aria-hidden>
            <span>Younger</span>
            <span>Older</span>
          </span>
          {AGES.map((id) => {
            const o = ORGANS[id];
            const d = o.age! - CHRONOLOGICAL_AGE;
            return (
              <span className="om-age" key={id} data-older={d > 0 ? "" : undefined} style={{ "--p": `${50 + (d / SPAN) * 50}%` } as CSSProperties}>
                <span className="om-age-n">{o.name === "Immune system" ? "Immune" : o.name}</span>
                <span className="om-age-t">
                  <i />
                </span>
                <b>{o.age}</b>
              </span>
            );
          })}
        </button>

        <button className="om-reports" onClick={() => go("/v2/study/genomics")}>
          <span>
            <b>Walk through your omics</b>
            <small>Genome to metabolome, on your twin</small>
          </span>
          <Chevron />
        </button>

        <h2 className="om-h">Your panels</h2>
        <div className="om-grid">
          {PANELS.map((p) => (
            <button key={p.title} className="om-panel" data-flag={p.flag ? "" : undefined} onClick={() => go(p.to!)}>
              <b>{p.title}</b>
              <span>{p.line}</span>
            </button>
          ))}
        </div>

        <h2 className="om-h">Not tested yet</h2>
        <ul className="om-wait">
          {WAITING.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>

        <button className="om-reports" onClick={() => go("/insights/reports")}>
          <span>
            <b>Reports</b>
            <small>PDFs from your clinician</small>
          </span>
          <Chevron />
        </button>
      </div>
    </V2Screen>
  );
}
