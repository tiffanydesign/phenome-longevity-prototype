/**
 * Marks whatever is scrolling with data-scrolling while it moves and for a
 * short while after, so the stylesheet can show its bar only then.
 */
const LINGER_MS = 900;

export function autoHideScrollbars(): void {
  const timers = new WeakMap<Element, number>();
  document.addEventListener(
    "scroll",
    (e) => {
      const el = e.target instanceof Element ? e.target : document.documentElement;
      const prev = timers.get(el);
      if (prev) window.clearTimeout(prev);
      else el.setAttribute("data-scrolling", "");
      timers.set(
        el,
        window.setTimeout(() => {
          el.removeAttribute("data-scrolling");
          timers.delete(el);
        }, LINGER_MS),
      );
    },
    { capture: true, passive: true },
  );
}
