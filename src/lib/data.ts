import { useSyncExternalStore } from "react";
import { usePrefs } from "./prefs";
import { EDITION, type Edition } from "./edition";

/**
 * Every module's mock data is a pair:
 *   real — exactly what the captured test account shows (mostly empty: 0 / "--")
 *   demo — a populated dataset for design work (marked // DEMO in data files)
 * Screens call useDataset(pair) and never branch on the mode themselves.
 */
export interface DataPair<T> {
  real: T;
  demo: T;
}

/*
 * A redesign can read a screen it shares with the captured app from its own
 * member instead: the shared screen keeps calling useDataset, and the edition
 * that registered a reading gets that one. The captured app never registers any.
 */
const READINGS = new Map<Edition, WeakMap<object, () => unknown>>();

/** Gives `pair`'s screens `read()` in `edition`, whatever the data switch says. */
export function readAs<T>(edition: Edition, pair: DataPair<T>, read: () => T) {
  if (!READINGS.has(edition)) READINGS.set(edition, new WeakMap());
  READINGS.get(edition)!.set(pair, read);
}

export function useDataset<T>(pair: DataPair<T>): T {
  const mode = usePrefs().data;
  const read = READINGS.get(EDITION)?.get(pair);
  if (read) return read() as T;
  return mode === "demo" ? pair.demo : pair.real;
}

export function useOffline(): boolean {
  return usePrefs().network === "offline";
}

/**
 * Tiny in-memory store for prototype interactions that must survive navigation
 * (cart lines, logged meals, completed habits…). Resets on reload by design.
 */
export function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next: T | ((s: T) => T)) {
      state = typeof next === "function" ? (next as (s: T) => T)(state) : next;
      listeners.forEach((l) => l());
    },
    use(): T {
      return useSyncExternalStore(
        (l) => {
          listeners.add(l);
          return () => listeners.delete(l);
        },
        () => state,
      );
    },
  };
}
