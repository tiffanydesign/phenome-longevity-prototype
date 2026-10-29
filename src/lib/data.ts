import { useSyncExternalStore } from "react";
import { usePrefs } from "./prefs";

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

export function useDataset<T>(pair: DataPair<T>): T {
  return usePrefs().data === "demo" ? pair.demo : pair.real;
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
