import type { UIEvent } from "react";

/**
 * The status-bar veil shows only once the page has moved: at rest the top of
 * the page sits on clean ground. The veil is the scroller's previous sibling.
 */
export function veilOnScroll(e: UIEvent<HTMLElement>) {
  const veil = e.currentTarget.previousElementSibling;
  veil?.toggleAttribute("data-on", e.currentTarget.scrollTop > 4);
}
