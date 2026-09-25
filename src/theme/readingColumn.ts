/**
 * The shared reading column: how wide a text surface may get.
 *
 * ⛔ WHY THIS EXISTS — OWNER BUG REPORT, 2026-09-24 (iPad):
 *   "all screens seem to adjust fine to the larger screen - but not audio tools"
 *
 * The Tools HUB was made tablet-aware earlier: it caps its column and centres,
 * so tiles land at 247 pt instead of stretching. **The screens the hub pushes to
 * were never given the same treatment.** Measured live in the web preview at an
 * iPad width of 1024 pt: the hub's column was 560 pt centred at x=225, and the
 * very next screen — the tool's info page — ran its body text **992 pt wide
 * starting at x=16**. Roughly 180 characters per line against a comfortable
 * 60–90. Nothing was clipped or broken, which is why it reads as "doesn't
 * adjust" rather than as a crash: the text simply spans the whole iPad.
 *
 * 560 is not a new number. It is the Tools hub's own `HUB_MAX_CONTENT_W`, which
 * now imports it from here, so the hub and everything it opens share ONE value
 * and line up instead of drifting apart the next time one of them is touched.
 *
 * It lives in `theme/` rather than under `screens/tools/` because the defect is
 * NOT confined to the tools: the PAYWALL was caught running edge-to-edge at
 * 1024 pt in the same pass, and that one is a conversion surface.
 *
 * ⚠️ APPLIES TO READING SURFACES ONLY — prose, bullet lists, settings-style
 * rows. It must NOT be applied to a live instrument canvas (RTA, spectrogram,
 * waveform, meters): a wider analyser is genuinely better on a tablet, and
 * capping those would throw away the extra screen the user paid for. The point
 * is readable line length, not a narrow app.
 *
 * ✅ NO PIXEL MOVES ON ANY PHONE. The widest phone this app is device-passed on
 * is 430 pt, so `maxWidth: 560` never binds there and `alignSelf: 'center'` on a
 * full-width child is a no-op. Only tablets change.
 */
export const READING_MAX_W = 560;

/** Alias kept so the Tools hub's tile arithmetic reads a tools-flavoured name. */
export const TOOL_READING_MAX_W = READING_MAX_W;

/**
 * Spread into a style to cap and centre a reading surface.
 * `width: '100%'` is required: without it the cap makes the box shrink to its
 * content on a tablet instead of filling up to the cap.
 */
export const readingColumn = {
  width: '100%',
  maxWidth: TOOL_READING_MAX_W,
  alignSelf: 'center',
} as const;

/**
 * The LEFT-ALIGNED variant, for capping individual paragraphs inside a surface
 * that is itself still full width — an instrument screen, or a page whose cards
 * and artwork should keep the whole tablet.
 *
 * ⛔ USE THIS, NOT `readingColumn`, WHENEVER THE SURROUNDING CHROME IS LEFT
 * ALIGNED. Seen on the amplitude-orientation gate 2026-09-24: capping its
 * paragraphs with the CENTRED version pushed them ~210 pt inward while the
 * section headings ("SIX VIEWS · ONE SIGNAL") stayed at x=16, so the page read
 * as ragged — a worse problem than the long lines it fixed. Centring is right
 * when the WHOLE surface is capped; left is right when only the text is.
 */
export const readingText = {
  width: '100%',
  maxWidth: TOOL_READING_MAX_W,
  alignSelf: 'flex-start',
} as const;
