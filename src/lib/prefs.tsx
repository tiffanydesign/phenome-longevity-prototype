import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Prototype-level switches (not part of the original app):
 *  - theme:   light | dark            (mirrors Profile → Appearance)
 *  - data:    real | demo             (real = captured empty test account, demo = populated mock)
 *  - network: online | offline        (renders the captured offline/error states)
 * Each can be forced from the URL query, e.g. #/home?theme=dark&data=demo — used by tests/compare.mjs.
 */
export type Theme = "light" | "dark";
export type DataMode = "real" | "demo";
export type Network = "online" | "offline";

interface Prefs {
  theme: Theme;
  data: DataMode;
  network: Network;
  set: (patch: Partial<Omit<Prefs, "set">>) => void;
}

const KEY = "phenome-proto-prefs";
const Ctx = createContext<Prefs | null>(null);

function readStored(): Partial<Prefs> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

function readQuery(): Partial<Prefs> {
  const q = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
  const out: Partial<Prefs> = {};
  // last occurrence wins, so a later "theme=dark" overrides an earlier default
  const last = (k: string) => q.getAll(k).pop() ?? null;
  const theme = last("theme");
  const data = last("data");
  const network = last("net");
  if (theme === "light" || theme === "dark") out.theme = theme;
  if (data === "real" || data === "demo") out.data = data;
  if (network === "online" || network === "offline") out.network = network;
  return out;
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => ({
    theme: "light" as Theme,
    data: "real" as DataMode,
    network: "online" as Network,
    ...readStored(),
    ...readQuery(),
  }));

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable (private mode) — prefs stay in memory */
    }
  }, [state]);

  const value = useMemo<Prefs>(
    () => ({ ...state, set: (patch) => setState((s) => ({ ...s, ...patch })) }),
    [state],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs(): Prefs {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePrefs outside PrefsProvider");
  return v;
}
