/**
 * The prototype ships three editions of the app, each at its own address:
 * <base>/original/ (the captured app), <base>/v2/ and <base>/v3/ (the redesigns).
 * The edition is read from the address once at load and never changes, so a
 * page opened in one edition can't reach the others.
 */
export type Edition = "original" | "v2" | "v3";

const EDITIONS: Edition[] = ["original", "v2", "v3"];
const BASE = import.meta.env.BASE_URL;

/** Each edition's front door, as a hash route. */
export const EDITION_HOME: Record<Edition, string> = {
  original: "/home",
  v2: "/v2/home",
  v3: "/v3/home",
};

export const EDITION_LABEL: Record<Edition, string> = {
  original: "Original",
  v2: "Redesign v2",
  v3: "Redesign v3",
};

function read(): Edition | null {
  const first = window.location.pathname.slice(BASE.length).split("/")[0];
  return (EDITIONS as string[]).includes(first) ? (first as Edition) : null;
}

/**
 * The bare address has no edition: send it to the one its hash route belongs
 * to, so links shared before the split keep working. Returns false while the
 * page is being replaced.
 */
export function settleEdition(): boolean {
  if (read()) return true;
  const hash = window.location.hash;
  const to: Edition = hash.startsWith("#/v3") ? "v3" : hash.startsWith("#/v2") ? "v2" : "original";
  window.location.replace(`${BASE}${to}/${window.location.search}${hash}`);
  return false;
}

export const EDITION: Edition = read() ?? "original";
