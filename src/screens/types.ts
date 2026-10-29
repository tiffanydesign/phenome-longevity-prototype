import type { ReactElement } from "react";

/** One routable screen. Modules export ScreenRoute[] from src/screens/<module>/index.tsx. */
export interface ScreenRoute {
  /** hash path, e.g. "/home/capacity" (params allowed: "/store/product/:id") */
  path: string;
  element: ReactElement;
  /** label in the #/__screens index */
  title: string;
  /** module group label in the index */
  group: string;
}
