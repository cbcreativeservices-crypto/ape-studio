/**
 * previewWidth — the width allowlist shared by every `#…preview/<width>` dev
 * harness. DEV + WEB only; nothing here is reachable on device or in a release.
 *
 * WHY THIS FILE EXISTS (2026-09-13). The three harnesses that take a width each
 * carried their own private `const WIDTHS = [360, 393, 412]`, so **no harness in
 * the repo could render anything wider than a large phone.** That is not a
 * cosmetic gap: it is why an iPad-only defect in the Patchbay lab — the lab that
 * gates the `af_patchbay` credit, uncompletable at tablet width because its jack
 * tap band did not scale with the art — survived a full design pass and a full
 * QA night. Every pass looked; none of them could have seen it. The tablet
 * widths below are now first-class members of the allowlist.
 *
 * ⚠️ AND THE PREVIEW CANNOT EXERCISE A LIVE RESIZE AT ALL. Measured
 * 2026-09-13 with this very header as the probe: with the browser viewport
 * driven from 393 to 1024, `window.innerWidth` read 1024 while React Native
 * Web's `Dimensions` still reported 393, and a synthetic `resize` event did not
 * move it either. RNW 0.21 does not track the pane's viewport emulation. So
 * `useWindowDimensions` here is fixed at whatever width the page LOADED at:
 * every width check must be a fresh RELOAD at that width, and ROTATION and iPad
 * SPLIT VIEW - re-laying out without a reload, which is the entire reason those
 * screens use the hook - are DEVICE-ONLY checks. This cost a wrong "verified"
 * once already: a resize appeared to re-page the Awards pager correctly, and
 * what had actually happened was a reload at the new width.
 *
 * ⚠️ THE BOX IS NOT THE WINDOW. A harness renders the screen inside a fixed-
 * width View, which constrains flex and percentage layout — but React Native
 * Web's `Dimensions.get('window')` and `useWindowDimensions()` both report the
 * BROWSER VIEWPORT, not that box. So a screen whose layout is driven by window
 * width (carousels, paged lists, anything sizing tiles or cards) will keep
 * reporting the browser's width no matter which width you put in the hash. To
 * exercise those code paths you must ALSO resize the browser viewport. The
 * harness header renders both numbers side by side, and says MATCH or DIFFERS,
 * precisely so a check cannot be believed when only one of them moved.
 */

/** Phone widths (the three the app is device-passed on) then tablet widths:
 *  iPad mini/portrait 10.2", iPad Air portrait, iPad landscape. */
export const PREVIEW_WIDTHS = [360, 393, 412, 768, 834, 1024] as const;

export const PREVIEW_DEFAULT_WIDTH = 393;

/** The allowlist as it appears in a harness header, e.g. "360|393|412|768|…". */
export const PREVIEW_WIDTH_HINT = PREVIEW_WIDTHS.join('|');

/** Any width at or above this is a tablet — the harness calls it out, because a
 *  layout that has never been looked at above 480 pt is the norm here. */
export const TABLET_MIN_WIDTH = 768;

/**
 * Read `#somepreview/<width>` from the location hash.
 * Falls back to the default for a missing, malformed or non-allowlisted value.
 */
export function previewWidthFromHash(hash?: string): number {
  const source = hash ?? (typeof window !== 'undefined' ? window.location.hash : '');
  const w = Number(source.split('/')[1]);
  return (PREVIEW_WIDTHS as readonly number[]).includes(w) ? w : PREVIEW_DEFAULT_WIDTH;
}

/**
 * The header line for a width harness: the requested box width, the width the
 * screen's own `useWindowDimensions()` will actually report, and whether they
 * agree. `viewportW` is the caller's live hook value.
 */
export function previewWidthLabel(name: string, boxW: number, viewportW: number): string {
  const agree = Math.abs(boxW - viewportW) <= 1;
  const verdict = agree ? 'MATCH' : `DIFFERS - window API reports ${viewportW}`;
  const tablet = boxW >= TABLET_MIN_WIDTH ? '  ·  TABLET' : '';
  return `${name} @ ${boxW}px  ·  viewport ${verdict}${tablet}  ·  /<${PREVIEW_WIDTH_HINT}>`;
}
