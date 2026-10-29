import type { ScreenRoute } from "./types";
import { routes as home } from "./home";
import { routes as insights } from "./insights";
import { routes as store } from "./store";
import { routes as profile } from "./profile";
import { routes as journal } from "./journal";
import { routes as discover } from "./discover";
import { routes as auth } from "./auth";
import { routes as reports } from "./reports";

/** Registry of every screen; order = order in the #/__screens index. */
export const SCREENS: ScreenRoute[] = [...home, ...journal, ...discover, ...insights, ...reports, ...store, ...profile, ...auth];
