/*
 * The scroll indicator shows only while a page moves, as the system's does:
 * whichever element is scrolling gets `data-scrolling` until it has been still
 * for a moment, and the stylesheet draws the thumb only under that attribute.
 */
const REST_MS = 700;
const timers = new WeakMap<Element, number>();

function onScroll(e: Event) {
  const el = e.target instanceof Element ? e.target : document.scrollingElement;
  if (!el) return;
  el.setAttribute("data-scrolling", "");
  window.clearTimeout(timers.get(el));
  timers.set(
    el,
    window.setTimeout(() => el.removeAttribute("data-scrolling"), REST_MS),
  );
}

if (typeof document !== "undefined") document.addEventListener("scroll", onScroll, { capture: true, passive: true });
