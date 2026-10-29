import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePrefs } from "@/lib/prefs";
import { createStore } from "@/lib/data";
import { FAQS, LANGUAGES } from "@/data/profile";
import { OptionCard, PfScreen } from "./ProfileKit";
import { IcChevron, IcClose, IcGlobe, IcMoon, IcSearch, IcSun } from "./ProfileIcons";
import "./SettingsScreens.css";

/**
 * FAQs — capture: profile_faqs/top, expanded ("How long…" open), search ("kit" → one item).
 * Deep-link for tests: ?q=kit pre-fills the search.
 */
export function FaqsScreen() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState<string | null>(null);
  const needle = q.trim().toLowerCase();
  // TODO(fidelity): match scope (question only vs answer too) unknown; "kit" in the capture matches only Q1.
  const list = FAQS.filter((f) => !needle || f.q.toLowerCase().includes(needle));
  return (
    <PfScreen title="FAQs">
      <div className="prf-faq">
        <label className="prf-faq-search">
          <IcSearch size={22} />
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search FAQs" />
          {q && (
            <button type="button" className="prf-faq-clear" aria-label="Clear" onClick={() => setQ("")}>
              <IcClose size={18} />
            </button>
          )}
        </label>
        <div className="prf-faq-list">
          {list.map((f) => {
            const isOpen = open === f.q;
            return (
              <button key={f.q} className="prf-faq-item" data-open={isOpen || undefined} onClick={() => setOpen(isOpen ? null : f.q)}>
                <span className="prf-faq-q">
                  <span>{f.q}</span>
                  <IcChevron size={22} up={isOpen} />
                </span>
                {isOpen && <span className="prf-faq-a">{f.a}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </PfScreen>
  );
}

/** Appearance — capture: profile_appearance/top, dark_selected. Switches the whole prototype theme. */
export function AppearanceScreen() {
  const { theme, set } = usePrefs();
  return (
    <PfScreen title="Appearance">
      <div className="prf-set">
        <p className="prf-set-sub">Choose how the app looks to you</p>
        <div className="prf-set-list">
          <OptionCard icon={<IcSun size={24} />} title="Light Mode" sub="Best for daytime use" selected={theme === "light"} onClick={() => set({ theme: "light" })} />
          <OptionCard icon={<IcMoon size={24} />} title="Dark Mode" sub="Easier on the eyes at night" selected={theme === "dark"} onClick={() => set({ theme: "dark" })} />
        </div>
      </div>
    </PfScreen>
  );
}

const languageStore = createStore("English");

/** Language — capture: profile_language/top, scroll_1…scroll_4 (list scrolls under a fixed title + search). */
export function LanguageScreen() {
  const selected = languageStore.use();
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const list = LANGUAGES.filter((l) => !needle || l.name.toLowerCase().includes(needle) || (l.native ?? "").toLowerCase().includes(needle));
  return (
    <PfScreen title="Language" bodyClassName="prf-lang-body">
      <div className="prf-lang">
        <div className="prf-set-subrow">
          <p className="prf-set-sub">Choose your preferred language</p>
          <span className="prf-lang-count">{LANGUAGES.length}</span>
        </div>
        <label className="prf-lang-search">
          <IcSearch size={22} />
          <input value={q} placeholder="Search languages..." onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="prf-lang-list scroll" data-scroll-root>
          {list.map((l) => (
            <OptionCard
              key={l.name}
              icon={<IcGlobe size={22} />}
              title={l.native ? `${l.native} · ${l.name}` : l.name}
              selected={selected === l.name}
              // TODO(fidelity): app relocalisation not captured — selection is visual only.
              onClick={() => languageStore.set(l.name)}
            />
          ))}
        </div>
      </div>
    </PfScreen>
  );
}
