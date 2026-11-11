import type { ScreenRoute } from "./types";
import { routes as home } from "./home";
import { routes as insights } from "./insights";
import { routes as store } from "./store";
import { routes as profile } from "./profile";
import { routes as journal } from "./journal";
import { routes as discover } from "./discover";
import { routes as auth } from "./auth";
import { routes as reports } from "./reports";
import { routes as redesign } from "@/v2";
import { routes as clinical } from "@/v3";

import { EDITION, type Edition } from "@/lib/edition";

const ORIGINAL: ScreenRoute[] = [...home, ...journal, ...discover, ...insights, ...reports, ...store, ...profile, ...auth];
const OWN: Record<Edition, ScreenRoute[]> = { original: ORIGINAL, v2: redesign, v3: clinical };

/** The screens this edition lists in its #/__screens index, in that order. */
export const SCREENS: ScreenRoute[] = OWN[EDITION];

/**
 * Every route this edition can open: its own screens, and for a redesign the
 * captured screens it reuses as they are (habits, reports, clinical insights).
 */
export const ROUTES: ScreenRoute[] = EDITION === "original" ? ORIGINAL : [...OWN[EDITION], ...ORIGINAL];
