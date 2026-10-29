import type { NavigateFunction } from "react-router-dom";

/** Pop one screen, or go to `fallback` when the screen was opened by deep link (tests, index). */
export function popOr(nav: NavigateFunction, fallback: string): void {
  const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
  if (idx > 0) nav(-1);
  else nav(fallback, { replace: true });
}
