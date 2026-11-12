/**
 * Scroll indicators that float over the content instead of taking a column of
 * their own. Native bars are switched off everywhere (styles/base.css); while
 * an element scrolls vertically, a thin pill is drawn above its right edge and
 * fades out a moment after it stops.
 *
 * Per page, the stylesheet can set:
 *   --scroll-thumb         pill colour (falls back to --v-scroll, then a grey)
 *   --scroll-inset-top     space kept clear above the track (status bar)
 *   --scroll-inset-bottom  space kept clear below the track (tab bar)
 */
const LINGER_MS = 800;
const FADE_MS = 240;
const THUMB_W = 3;
const EDGE_GAP = 2;
const MIN_THUMB = 36;
const FALLBACK_COLOR = "rgba(60, 70, 100, 0.34)";

interface Indicator {
  thumb: HTMLDivElement;
  hideTimer: number;
  removeTimer: number;
  insetTop: number;
  insetBottom: number;
}

const live = new Map<Element, Indicator>();

/** Resolves a length custom property (may hold calc/env) to pixels. */
function measureInset(el: Element, prop: string): number {
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:0;height:var(${prop},0px)`;
  el.appendChild(probe);
  const px = probe.offsetHeight;
  probe.remove();
  return px;
}

function thumbColor(el: Element): string {
  const cs = getComputedStyle(el);
  return (
    cs.getPropertyValue("--scroll-thumb").trim() ||
    cs.getPropertyValue("--v-scroll").trim() ||
    FALLBACK_COLOR
  );
}

function createIndicator(el: Element): Indicator {
  const thumb = document.createElement("div");
  thumb.setAttribute("aria-hidden", "true");
  thumb.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    `width:${THUMB_W}px`,
    `border-radius:${THUMB_W}px`,
    "pointer-events:none",
    "z-index:2147483000",
    "opacity:0",
    `transition:opacity ${FADE_MS}ms ease`,
    "will-change:transform,opacity",
  ].join(";");
  thumb.style.background = thumbColor(el);
  document.body.appendChild(thumb);
  const isRoot = el === document.scrollingElement;
  return {
    thumb,
    hideTimer: 0,
    removeTimer: 0,
    insetTop: isRoot ? 0 : measureInset(el, "--scroll-inset-top"),
    insetBottom: isRoot ? 0 : measureInset(el, "--scroll-inset-bottom"),
  };
}

function place(el: Element, ind: Indicator): boolean {
  const { scrollHeight, clientHeight, scrollTop } = el;
  const range = scrollHeight - clientHeight;
  if (range <= 1) return false;

  const isRoot = el === document.scrollingElement;
  const rect = isRoot
    ? new DOMRect(0, 0, window.innerWidth, window.innerHeight)
    : el.getBoundingClientRect();
  const trackTop = rect.top + ind.insetTop + EDGE_GAP;
  const trackH = clientHeight - ind.insetTop - ind.insetBottom - EDGE_GAP * 2;
  if (trackH < MIN_THUMB) return false;

  const thumbH = Math.max(MIN_THUMB, (trackH * clientHeight) / scrollHeight);
  const progress = Math.min(1, Math.max(0, scrollTop / range));
  const y = trackTop + (trackH - thumbH) * progress;
  const x = rect.right - EDGE_GAP - THUMB_W;

  ind.thumb.style.height = `${thumbH}px`;
  ind.thumb.style.transform = `translate(${x}px, ${y}px)`;
  return true;
}

function onScroll(e: Event): void {
  const target = e.target;
  const el = target instanceof Element ? target : document.scrollingElement;
  if (!el) return;

  let ind = live.get(el);
  if (!ind) {
    if (el.scrollHeight - el.clientHeight <= 1) return; // sideways-only row
    ind = createIndicator(el);
    live.set(el, ind);
  }
  const current = ind;
  window.clearTimeout(current.hideTimer);
  window.clearTimeout(current.removeTimer);
  if (!place(el, current)) return;

  el.setAttribute("data-scrolling", "");
  current.thumb.style.opacity = "1";
  current.hideTimer = window.setTimeout(() => {
    el.removeAttribute("data-scrolling");
    current.thumb.style.opacity = "0";
    current.removeTimer = window.setTimeout(() => {
      current.thumb.remove();
      live.delete(el);
    }, FADE_MS);
  }, LINGER_MS);
}

export function autoHideScrollbars(): void {
  document.addEventListener("scroll", onScroll, { capture: true, passive: true });
}
