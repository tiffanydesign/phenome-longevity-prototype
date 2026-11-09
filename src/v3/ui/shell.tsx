import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { NavLink, useLocation, useNavigate, type NavigateOptions } from "react-router-dom";
import { HomeIndicator, StatusBar } from "@/components/PhoneFrame";
import { PushBanner } from "../notify/PushBanner";
import { useNotes } from "../notify/store";
import { Icon } from "@/components/Icon";
import { Chevron, IconAgent, IconHome, IconOmics, IconStore } from "./icons";
import "../v2.css";

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
    const from = opts?.from;
    const root = document.documentElement;
    // a card opening a metric becomes that page's header: both are captured square and
    // without shadow, and the transition's own frame carries the corners from one to the other
    const sheet = !!from && to.startsWith("/v3/metric");
    if (from) {
      from.style.viewTransitionName = "v2-hero";
      if (sheet) {
        root.style.setProperty("--vt-from-r", getComputedStyle(from).borderTopLeftRadius);
        from.dataset.vtSnap = "";
        root.dataset.vt = "sheet";
      }
    }
    const vt = document.startViewTransition(() => {
      if (from) {
        from.style.viewTransitionName = "";
        delete from.dataset.vtSnap;
      }
      flushSync(() => nav(to, opts));
    });
    vt.finished.catch(() => undefined).finally(() => delete root.dataset.vt);
  };
}

export function V2Screen({ children, nav = true, tone = "dark" }: { children: ReactNode; nav?: boolean; tone?: "dark" | "light" }) {
  return (
    <div className="v2">
      <StatusBar tone={tone} />
      {children}
      <PushBanner />
      {nav && <V2Nav />}
      <HomeIndicator />
    </div>
  );
}

const TABS = [
  { to: "/v3/home", label: "Home", icon: <IconHome /> },
  { to: "/v3/omics", label: "Omics", icon: <IconOmics /> },
  { to: "/v3/store", label: "Store", icon: <IconStore /> },
];

/** The bar: a floating pill of destinations, with the round button beside it. */
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
      <button className="v2-nav-ai" aria-label="Longevity AI" onClick={() => go("/v3/assistant")}>
        <IconAgent />
      </button>
    </div>
  );
}

/**
 * The bar Home and Omics open with: the brand mark at the left, devices and
 * profile at the right. The page moves it (followHead): the mark scrolls away,
 * the two round buttons stay on a clear glass capsule. `children` stands in
 * for the mark, e.g. Home's Done while its cards are being arranged.
 */
export function BrandBar({ children }: { children?: ReactNode }) {
  const { list } = useNotes();
  const unread = list.some((n) => !n.read);
  return (
    <header className="v2-hbar">
      {children ?? (
        <span className="v2-hlogo" role="img" aria-label="Phenome Longevity">
          <Icon name="PL_Logo" size={36} style={{ height: 24 }} />
        </span>
      )}
      <div className="v2-hpill">
        <DevicesButton />
        <Avatar dot={unread} />
      </div>
    </header>
  );
}

/**
 * Moves a head by the scroll of the page under it: `--lift` slides the mark and
 * whatever else rides up, `--logo-o` fades the mark, `--tabs-o` fades what sits
 * below the bar, and `data-under` puts the capsule on glass.
 */
export function followHead(el: HTMLElement | null, top: number, travel: number, bar = 52) {
  if (!el) return;
  const lift = Math.min(Math.max(top, 0), travel);
  el.style.setProperty("--lift", `${lift}px`);
  el.style.setProperty("--logo-o", String(Math.max(0, 1 - lift / 40)));
  el.style.setProperty("--tabs-o", String(travel > bar ? Math.min(1, Math.max(0, 1 - (lift - bar) / (travel - bar))) : 1));
  el.toggleAttribute("data-under", top > 4);
}

export function DevicesButton() {
  const go = useGo();
  return (
    <button className="v2-round" aria-label="Devices" onClick={() => go("/v3/devices")}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
        <rect x="7" y="2.5" width="10" height="19" rx="5" />
        <path d="M12 7.5v3" />
      </svg>
    </button>
  );
}

export function Avatar({ dot = false }: { dot?: boolean }) {
  const go = useGo();
  return (
    <button className="v2-avatar" aria-label={dot ? "Profile, new notifications" : "Profile"} onClick={() => go("/v3/profile")}>
      TS
      {/* notifications live behind the profile now; a small dot says one is waiting */}
      {dot && <i className="v2-avatar-dot" aria-hidden />}
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
