import { useState } from "react";
import { usePrefs } from "@/lib/prefs";
import { FAQS, LANGUAGES } from "@/data/profile";
import { PRIVACY_TEXT } from "@/data/profilePrivacy";
import { languageStore } from "@/screens/profile/SettingsScreens";
import { Chevron } from "../ui/icons";
import { useGo } from "../ui/shell";
import { Group, SearchField, SubPage, Tick } from "./kit";

/* ---------------------------------------------------------------- appearance */

/** A small drawing of the app in that theme: a status strip, a title, two cards. */
function Preview({ dark }: { dark: boolean }) {
  return (
    <span className="pf-prev" data-dark={dark ? "" : undefined} aria-hidden>
      <i data-k="title" />
      <i data-k="card" />
      <i data-k="card" />
      <i data-k="bar" />
    </span>
  );
}

export function AppearancePage() {
  const { theme, set } = usePrefs();
  return (
    <SubPage title="Appearance" lead="Choose how the app looks. Dark is easier on the eyes at night.">
      <div className="pf-themes" role="radiogroup" aria-label="Theme">
        {(["light", "dark"] as const).map((t) => (
          <button key={t} role="radio" aria-checked={theme === t} onClick={() => set({ theme: t })}>
            <Preview dark={t === "dark"} />
            <span className="pf-themes-t">
              <i aria-hidden>{theme === t && <Tick />}</i>
              {t === "light" ? "Light" : "Dark"}
            </span>
          </button>
        ))}
      </div>
    </SubPage>
  );
}

/* ---------------------------------------------------------------- language */

export function LanguagePage() {
  const selected = languageStore.use();
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const list = LANGUAGES.filter((l) => !needle || l.name.toLowerCase().includes(needle) || (l.native ?? "").toLowerCase().includes(needle));
  const current = LANGUAGES.find((l) => l.name === selected);
  return (
    <SubPage title="Language" lead={`${LANGUAGES.length} languages. The app, reports and Longevity AI follow your choice.`}>
      <div className="pf-gap" />
      <SearchField value={q} onChange={setQ} placeholder="Search languages" />
      {!needle && current && (
        <Group title="Current">
          <div className="dv-group">
            <div className="pf-opt" aria-current="true">
              <span className="pf-opt-t">
                <b>{current.name}</b>
                {current.native && <small>{current.native}</small>}
              </span>
              <Tick />
            </div>
          </div>
        </Group>
      )}
      <Group title={needle ? `${list.length} found` : "All languages"}>
        <div className="dv-group">
          {list.map((l) => (
            <button key={l.name} className="pf-opt" aria-pressed={selected === l.name} onClick={() => languageStore.set(l.name)}>
              <span className="pf-opt-t">
                <b>{l.name}</b>
                {l.native && <small>{l.native}</small>}
              </span>
              {selected === l.name && <Tick />}
            </button>
          ))}
          {list.length === 0 && <p className="pf-note pf-pad">No language matches “{q}”.</p>}
        </div>
      </Group>
    </SubPage>
  );
}

/* ---------------------------------------------------------------- faqs */

export function FaqsPage() {
  const go = useGo();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const needle = q.trim().toLowerCase();
  const list = FAQS.filter((f) => !needle || f.q.toLowerCase().includes(needle) || f.a.toLowerCase().includes(needle));
  return (
    <SubPage title="FAQs" lead="Quick answers about kits, results and your account.">
      <div className="pf-gap" />
      <SearchField value={q} onChange={setQ} placeholder="Search questions" />
      <Group>
        <div className="dv-group">
          {list.map((f) => {
            const on = open === f.q;
            return (
              <button key={f.q} className="pf-faq" aria-expanded={on} onClick={() => setOpen(on ? null : f.q)}>
                <span className="pf-faq-q">
                  <b>{f.q}</b>
                  <Chevron dir={on ? "up" : "down"} size={14} />
                </span>
                {on && <span className="pf-faq-a">{f.a}</span>}
              </button>
            );
          })}
          {list.length === 0 && <p className="pf-note pf-pad">Nothing matches “{q}”. Try another word, or ask below.</p>}
        </div>
      </Group>
      <Group title="Still need help?">
        <div className="dv-group">
          <button className="pf-row" onClick={(e) => go("/v3/assistant", { from: e.currentTarget })}>
            <span className="pf-row-mark" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" />
              </svg>
            </span>
            <span className="pf-row-t">Ask Longevity AI</span>
            <Chevron size={14} />
          </button>
          <a className="pf-row" href="mailto:info@phenomelongevity.com">
            <span className="pf-row-mark" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            </span>
            <span className="pf-row-t">Email support</span>
            <Chevron size={14} />
          </a>
        </div>
      </Group>
    </SubPage>
  );
}

/* ---------------------------------------------------------------- privacy */

/**
 * The policy as a readable page: a short summary card of what matters most,
 * then the full text, its numbered headings set as headings.
 */
export function PrivacyPage() {
  const text = PRIVACY_TEXT.replace(/ /g, " ").trim();
  const [updated, ...rest] = text.split("\n");
  const blocks = rest.join("\n").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <SubPage title="Privacy" lead={updated.trim()}>
      <Group title="In short">
        <ul className="dv-group pf-rules pf-short">
          {[
            "We never sell, rent or trade your personal, health or genetic data.",
            "Genetic and microbiome data is processed only with your explicit consent.",
            "You can disconnect devices and delete synced data at any time.",
          ].map((t) => (
            <li key={t} data-ok="">
              <i aria-hidden>
                <Tick />
              </i>
              {t}
            </li>
          ))}
        </ul>
      </Group>
      <Group title="Full policy">
        <article className="dv-group pf-doc">
          {blocks.map((b, i) => {
            const [first, ...more] = b.split("\n");
            const isHead = /^\d+\.\s/.test(first);
            return isHead ? (
              <section key={i}>
                <h3>{first}</h3>
                {more.length > 0 && <p>{more.join(" ")}</p>}
              </section>
            ) : (
              <p key={i}>{b.replace(/\n/g, " ")}</p>
            );
          })}
        </article>
      </Group>
    </SubPage>
  );
}
