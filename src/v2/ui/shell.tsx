import { useEffect, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { NavLink, useLocation, useNavigate, type NavigateOptions } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { HomeIndicator, StatusBar } from "@/components/PhoneFrame";
import { Chevron, IconTwin } from "./icons";
import "../v2.css";

/** The Adobe kit the Digital Twin site uses: Contralto for display, New Science Mono for numerals. */
const KIT = "https://use.typekit.net/omf6kcr.css";

function useKit() {
  useEffect(() => {
    if (document.querySelector(`link[href="${KIT}"]`)) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = KIT;
    document.head.appendChild(l);
  }, []);
}

/**
 * Route change wrapped in a view transition, so the tile or card the member
 * tapped grows into the next screen. `from` is named only for that one
 * transition: the same card can be mounted on two Home pages at once.
 */
export function useGo() {
  const nav = useNavigate();
  return (to: string, opts?: NavigateOptions & { from?: HTMLElement | null }) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduce) {
      nav(to, opts);
      return;
    }
    if (opts?.from) opts.from.style.viewTransitionName = "v2-hero";
    const vt = document.startViewTransition(() => {
      if (opts?.from) opts.from.style.viewTransitionName = "";
      flushSync(() => nav(to, opts));
    });
    vt.finished.catch(() => undefined);
  };
}

export function V2Screen({ children, nav = true, tone = "dark" }: { children: ReactNode; nav?: boolean; tone?: "dark" | "light" }) {
  useKit();
  return (
    <div className="v2">
      <StatusBar tone={tone} />
      {children}
      {nav && <V2Nav />}
      <HomeIndicator />
    </div>
  );
}

const TABS = [
  { to: "/v2/home", label: "Home", icon: <Icon name="Nav_Home" size={22} /> },
  { to: "/v2/twin", label: "Twin", icon: <IconTwin size={22} /> },
  { to: "/v2/omics", label: "Omics", icon: <Icon name="Nav_Insights" size={22} /> },
];

/** Samsung Health's bar: a floating pill of destinations, with the round button beside it. */
export function V2Nav() {
  const go = useGo();
  const { pathname } = useLocation();
  return (
    <div className="v2-nav">
      <nav className="v2-nav-pill" aria-label="Main">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            replace
            className="v2-nav-item"
            onClick={(e) => {
              e.preventDefault();
              if (!pathname.startsWith(t.to)) go(t.to, { replace: true });
            }}
          >
            {t.icon}
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
      <button className="v2-nav-ai" aria-label="Longevity AI" onClick={() => go("/v2/assistant")}>
        <Icon name="Nav_LongevityAI" size={26} />
      </button>
    </div>
  );
}

export function Avatar() {
  const go = useGo();
  return (
    <button className="v2-avatar" aria-label="Profile" onClick={() => go("/v2/profile")}>
      <Icon name="Nav_Profile" size={20} />
      <i aria-hidden />
    </button>
  );
}

export function BackBar({ title, onBack, tone, right }: { title?: string; onBack?: () => void; tone?: "light"; right?: ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="v2-back" data-tone={tone}>
      <button aria-label="Back" onClick={onBack ?? (() => nav(-1))}>
        <Chevron dir="left" size={24} />
      </button>
      {title && <h1>{title}</h1>}
      {right}
    </header>
  );
}
