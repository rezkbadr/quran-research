/**
 * Smooth-scroll the window to `top`, but only animate the final
 * `animatedDistance` pixels — pre-jump instantly to that close-in
 * position first so the animation duration stays roughly constant
 * regardless of how far we're scrolling.
 *
 * Without this, scrolling from the top of a long sura down to a deep
 * verse (or back from a deep verse to the top) takes several seconds
 * with `behavior: "smooth"`.
 */
export function shortScrollTo(top: number, animatedDistance = 300): void {
  const distance = top - window.scrollY;
  if (Math.abs(distance) > animatedDistance) {
    const sign = distance > 0 ? 1 : -1;
    window.scrollTo({ top: top - sign * animatedDistance, behavior: "auto" });
    requestAnimationFrame(() => window.scrollTo({ top, behavior: "smooth" }));
  } else {
    window.scrollTo({ top, behavior: "smooth" });
  }
}

/**
 * Centre `el` in the viewport using the short-scroll animation above.
 */
export function shortScrollIntoView(el: Element): void {
  const rect = el.getBoundingClientRect();
  const target = rect.top + window.scrollY - window.innerHeight / 2 + rect.height / 2;
  shortScrollTo(target);
}
