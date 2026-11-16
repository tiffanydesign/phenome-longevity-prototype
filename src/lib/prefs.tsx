import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Prototype-level switches (not part of the original app):
 *  - theme:   light | dark            (mirrors Profile → Appearance)
 *  - data:    real | demo             (real = captured empty test account, demo = populated mock)
 *  - network: online | offline        (renders the captured offline/error states)
 *  - sex:     female | male           (the member's sex; every body figure in v2 follows it)
 *  - member:  clinic | varied | first | risk  (whose results v2 shows: the clinic portal's member, or a design scenario
 *             built from it by scripts/build-scenarios.mjs; read once at load, so a change reloads the page)
 * Each can be forced from the URL query, e.g. #/home?theme=dark&data=demo — used by tests/compare.mjs.
 */
export type Theme = "light" | "dark";
export type DataMode = "real" | "demo";
export type Network = "online" | "offline";
export type Sex = "female" | "male";
export type MemberMode = "clinic" | "varied" | "first" | "risk";
export const MEMBER_MODES: MemberMode[] = ["clinic", "varied", "first", "risk"];

interface Prefs {
  theme: Theme;
  data: DataMode;
  network: Network;
  sex: Sex;
  member: MemberMode;
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
  const sex = last("sex");
  const member = last("member");
  if (MEMBER_MODES.includes(member as MemberMode)) out.member = member as MemberMode;
  if (sex === "female" || sex === "male") out.sex = sex;
  if (theme === "light" || theme === "dark") out.theme = theme;
  if (data === "real" || data === "demo") out.data = data;
  if (network === "online" || network === "offline") out.network = network;
  return out;
}

/** The member mode, outside React: the data modules pick their file with it when they load. */
export function readMemberMode(): MemberMode {
  return { member: "clinic" as MemberMode, ...readStored(), ...readQuery() }.member ?? "clinic";
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => ({
    theme: "light" as Theme,
    network: "online" as Network,
    // the demo member's profile and the full review's member are both female
    sex: "female" as Sex,
    member: "clinic" as MemberMode,
    ...readStored(),
    // demo data has no switch in the panel any more, so a stored choice must not stick
    data: "real" as DataMode,
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
