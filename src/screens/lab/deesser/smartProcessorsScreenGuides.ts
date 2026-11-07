/**
 * Smart Processors Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * Two screens make up the lab:
 *   SMART_PROCESSORS_HOME_GUIDE — the family hub (SmartProcessorsLabScreen):
 *     the lead, the De-Esser & Sibilance Control row, and the lab's
 *     CHECK YOUR UNDERSTANDING block (labId 'smart-processors' — passing it is
 *     what completes this lab);
 *   DEESSER_SCREEN_GUIDES — one guide per page of the De-Esser & Sibilance
 *     Control PagedLab (DeEsserLabScreen PAGES, in order; DEESSER_PAGES pairs
 *     each id with its PageDef title so a reorder or rename fails the test).
 *     The de-esser has no appended check page (its check lives on the hub);
 *   DEESSER_END_GUIDE — the PagedLab's what's-left screen (kit/LabEndScreen,
 *     PagedLab `endGuide`, header WHERE YOU ARE): "progress" mode (no
 *     creditLabKey / pageCreditKeys), noun "page", default DONE label.
 *
 * Every name is the on-screen name (DeEsserLabScreen, deEsserViz,
 * pathLayout, deEsserModel). Every TRY THIS number is what deEsserModel makes
 * the page print at that setting — the test recomputes each one from the
 * model with the lab's starting rack (DEFAULTS with Range capped at 8 dB:
 * 6.5 kHz, Q 1.4, threshold −10 dB, split-band). The settings persist across
 * pages while the lab is open, so every step names the setting it assumes.
 * Nothing in this lab plays: every display is computed from a modelled phrase.
 *
 * Reading pages (no Rack Unit): regions are off, every step is a bottom card.
 * Copy rules: plain language, short sentences; knowledge, never skills; no
 * gear brand names; no "N of total"; "suggest", never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

// ── THE HUB ─────────────────────────────────────────────────────────────────
export const SMART_PROCESSORS_HOME_GUIDE: ScreenGuide = {
  seeing: [
    'The Smart Processors menu: processors that listen first, decide, then act — built from a detector, a threshold, a gain computer and a choice of what to change.',
    'One lab is here: De-Esser & Sibilance Control, marked OPEN.',
    'Below it, CHECK YOUR UNDERSTANDING: five questions on the de-esser.',
  ],
  control: [
    'Tap the De-Esser & Sibilance Control row to open the lab. ‹ goes back to the Dynamics list.',
    'In the check, tap an option: CORRECT explains why; NOT QUITE — TRY ANOTHER explains, and you pick again at once. Nothing is scored.',
    'Inside the de-esser lab, ⓘ beside each page title explains that page.',
  ],
  changes: [
    'Nothing on this page moves. The de-esser lab draws a modeled phrase — nothing plays — so every number there is relative, not a calibrated level.',
    'Each right answer shows a ✓ and its explanation. All five right and the lab is complete: this check is what counts it toward certificates.',
  ],
  teaches: [
    'That a de-esser is a compressor whose detector listens through a filter — built from the same parts as every smart processor: a detector, a threshold and a gain computer.',
    'It builds on Compression, Gate / Expander and Limiter, the Dynamics labs before it.',
  ],
  tryThis: [
    'Open the de-esser lab and work its pages in order — each one builds on the last.',
    'Then come back for the check: every answer is on one of those pages.',
  ],
};

// ── THE DE-ESSER PAGES ──────────────────────────────────────────────────────
/** Page order = DeEsserLabScreen PAGES. `title` is the PageDef title, verbatim. */
export const DEESSER_PAGES = [
  { id: 'what', title: 'What Sibilance Is' },
  { id: 'eqVs', title: 'Why EQ Is Not Enough' },
  { id: 'path', title: 'The Detection Path' },
  { id: 'threshold', title: 'Threshold' },
  { id: 'frequency', title: 'Choosing the Frequency' },
  { id: 'gr', title: 'Reading Gain Reduction' },
  { id: 'mode', title: 'Broadband vs Split-Band' },
  { id: 'over', title: 'Over-De-Essing' },
  { id: 'connections', title: 'Connections & Check' },
] as const;

export type DeEsserPageId = (typeof DEESSER_PAGES)[number]['id'];

export const DEESSER_SCREEN_GUIDES: Record<DeEsserPageId, ScreenGuide> = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  what: {
    seeing: [
      'PHRASE: a spoken phrase cut into frames, one column each — cyan = voice body, orange = hiss band (2–10 kHz). Orange labels mark the sibilants.',
      'Under it, the chosen frame’s SPECTRUM: low frequencies left, high right; the orange strip marks the hiss region.',
      'The card says what kind of frame it is: sibilant, voiced, or a gap between words.',
    ],
    control: [
      'Tap a frame in the strip, or step with ‹ and ›. JUMP TO AN S skips to the next sibilant.',
      '⤢ FULL SCREEN under either drawing enlarges it, with the same buttons docked below.',
      'NEXT at the end of the page, or the strip under the title, moves between pages; ‹ leaves the lab.',
    ],
    changes: [
      'A vowel’s energy sits low — the body of the voice. An S is almost all hiss, high up. SH and CH sit lower than S.',
      'The hiss is air forced through the narrow gap at the teeth. The small space in front of them tunes it high, into the 2–10 kHz region, where the ear is very sensitive.',
    ],
    teaches: [
      'What sibilance is and where it sits: an S mostly 4–10 kHz, SH and CH nearer 2–5 kHz.',
      'Why close placement, bright mics, presence EQ and heavy compression push the S’s out of proportion.',
      'The first page of the lab: a de-esser’s job is to tell these frames apart.',
    ],
    tryThis: [
      'Tap the “i” after “th”, then the “s” after it: the cyan body shrinks and the orange hiss takes over.',
      'JUMP TO AN S until you reach “sh”: its hiss sits near 4.0 kHz, lower than the S’s near 6.5–7.0 kHz.',
      'Pick a “·” gap: almost nothing in either band — nothing for a de-esser to decide.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  eqVs: {
    seeing: [
      'Two buttons: STATIC EQ CUT · −8 dB and DE-ESSER. The drawing shows the output, with the input as a ghost.',
      'Top: body and hiss per frame. Bottom: HISS BAND ALONE in dB, where an 8 dB loss is the same height on a vowel as on an S.',
      'The readout: brightness taken from everything that is not an S, and how far the S’s are reduced.',
    ],
    control: [
      'Tap STATIC EQ CUT · −8 dB or DE-ESSER to switch. ⤢ FULL SCREEN enlarges the drawing with both buttons docked.',
      'The UNDERSTANDING CHECK below: tap an answer; its explanation follows.',
    ],
    changes: [
      'The EQ cut never switches off, so every frame loses 8 dB of hiss — vowels, breaths and gaps too.',
      'The de-esser’s gain moves only while its detector hears hiss, so only the S frames drop.',
    ],
    teaches: [
      'The one difference that makes a de-esser: it is on only while there is an S.',
      'Why fixing sibilance with EQ dulls the whole voice.',
      'Next page: how the de-esser knows an S is there.',
    ],
    tryThis: [
      'Pick STATIC EQ CUT · −8 dB: the readout takes 8.0 dB from everything that is not an S. Pick DE-ESSER: 0.0 dB.',
      'With DE-ESSER, read the second number: the S’s drop by about 7.0 dB while the vowels keep their brightness.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  path: {
    seeing: [
      'SIGNAL PATH: the MAIN PATH carries the voice to a gain element; the SIDE CHAIN listens to a copy — BAND-PASS, DETECTOR, THRESHOLD, GAIN COMP.',
      'In split-band mode (where the lab starts) the main path adds a BAND SPLIT and a SUM.',
      'The card under the diagram names the lit block and says what it does.',
    ],
    control: [
      'Tap a block, or NEXT BLOCK › to step through them. WALK THE SIGNAL steps on its own; STOP halts it.',
      '⤢ FULL SCREEN enlarges the diagram with the card docked. The mode follows the BROADBAND / SPLIT-BAND choice on Broadband vs Split-Band.',
      'The UNDERSTANDING CHECK at the end: tap an answer; its explanation follows.',
    ],
    changes: [
      'The band-pass filter sits in the side chain, not the signal path: it only shapes what the detector hears.',
      'So the decision is made on the hiss alone, and the voice passes untouched until the gain moves.',
      'Split-band: only the hiss band meets the gain element; with no reduction the two bands add back to the voice as it came in.',
    ],
    teaches: [
      'A de-esser is a compressor with a filtered ear — detector, threshold and gain computer, the parts from Compression.',
      'Many de-essers listen through a high-pass instead of a band-pass, or offer both.',
    ],
    tryThis: [
      'Tap BAND-PASS, then GAIN: the filter sits in the side chain; the voice itself never passes through it.',
      'In split-band, tap WALK THE SIGNAL: the lit block runs INPUT, BAND SPLIT, around the side chain, then GAIN, SUM, OUTPUT.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  threshold: {
    seeing: [
      'DETECTOR: the hiss each frame’s detector hears, in dB (0 = loudest S), with the gold THRESHOLD line across it.',
      'Below, GAIN REDUCTION drawn downward, capped at the range. Orange labels mark the sibilants.',
      'The readout counts the sibilants above the line and the other sounds crossing it.',
    ],
    control: [
      'The Threshold slider runs from −40 to 0 dB. ⤢ FULL SCREEN docks the readout and slider under the enlarged trace.',
      'The lab keeps one set of de-esser settings while it is open, so this threshold carries to the other pages.',
      'The UNDERSTANDING CHECK at the end: tap an answer; its explanation follows.',
    ],
    changes: [
      'Above the line the de-esser turns down; below it, nothing at all. There is no gentle in-between zone in this model (a “hard knee”).',
      'Too high and no S crosses. Too low and TH and P cross first, then vowels, then the gaps between words.',
    ],
    teaches: [
      'Threshold is the level the hiss must reach before anything happens — the same idea as the compressor’s.',
      'Reduction under a sound that is not an S means the threshold is too low.',
    ],
    tryThis: [
      'Set Threshold to −10 dB: every sibilant crosses and nothing else does — the card reads About right.',
      'Drag down to −19 dB: one other sound crosses, the TH. At −21 dB the P joins it.',
      'Drag up to 0 dB: nothing crosses, and the card reads Too high.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  frequency: {
    seeing: [
      'The chosen sibilant’s SPECTRUM, with the detector’s band-pass drawn over it as a gold dashed line — the part of the sound it can hear.',
      'The readout: what share of this sibilant’s hiss the detector hears. STARTING POINTS: five suggested frequencies.',
    ],
    control: [
      'Detector frequency slider, 2.0–10.0 kHz, and Band width, Q 0.7 (wide) to Q 4.0 (narrow).',
      'Sibilant buttons pick the sound to look at: “s” · 6.5k, “z” · 6.0k, “sh” · 4.0k, “s” · 7.0k, “s” · 6.8k.',
      'STARTING POINTS buttons move the detector to a suggested place and show a short note. ⤢ FULL SCREEN docks the controls under the spectrum.',
      'The UNDERSTANDING CHECK at the end: tap an answer; its explanation follows.',
    ],
    changes: [
      'The band hears most at its center and less on either side: aimed too low it hears the voice, too high it misses the S.',
      'A narrower band (higher Q) is pickier, so it can miss an S that sits off its center.',
      'Every voice hisses in its own place — SH lower than S.',
    ],
    teaches: [
      'Why the detector frequency must match the voice, and how band width trades focus for coverage.',
      'Starting points are where you begin, not where you finish.',
    ],
    tryThis: [
      'With the detector at 6.5 kHz and Q 1.4, “s” · 7.0k is heard 98%. Slide Band width to Q 4.0 · narrow: 86% — a narrow band misses an off-center S.',
      'Still at 6.5 kHz and Q 4.0, pick “sh” · 4.0k: 24%, Missing it. Under STARTING POINTS, tap the button that reads "SH" rather than "S" · 4.0k: the detector moves to 4.0 kHz and hears 100%.',
      'Before the next page, set the detector back to 6.5 kHz and Q 1.4, where the lab starts: the next pages’ numbers assume it.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  gr: {
    seeing: [
      'GAIN REDUCTION: the detector trace on top, and below it the reduction on each frame drawn downward, capped at the range line.',
      'The readout: peak reduction, the average on the S’s, and the stage that average falls in.',
    ],
    control: [
      'Range (maximum reduction) slider, 0–8 dB, and the Threshold slider, −40 to 0 dB. ⤢ FULL SCREEN docks both under the trace.',
    ],
    changes: [
      'Range is the safety rail: however far an S goes over, the gain never drops more than this.',
      'A lower threshold deepens the reduction, until it reaches the range.',
      'Bars should appear only under orange labels; anywhere else, the threshold is too low.',
    ],
    teaches: [
      'How to read a gain-reduction meter as a question: S’s only, and by a sensible amount?',
      'The screen’s suggested range for a natural voice: 4–6 dB.',
    ],
    tryThis: [
      'With the detector at 6.5 kHz and Q 1.4 (where the lab starts), Threshold −10 dB and Range 8.0 dB: peak 7.4 dB, average 5.8 dB — Controlled.',
      'Pull Range down to 4.0 dB: peak 4.0 dB, average 3.7 dB — Transparent. The rail now caps every S.',
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  mode: {
    seeing: [
      'Two buttons: BROADBAND and SPLIT-BAND. The strip shows the output frame by frame, input as ghost.',
      'THIS FRAME · BEFORE (GHOST) AND AFTER: the stepped frame’s spectrum; in split-band a gold dashed line marks the band being turned down.',
      'The card compares both modes on this frame.',
    ],
    control: [
      'BROADBAND or SPLIT-BAND sets what gets turned down. ‹ and › step frames; AUTO-STEP runs through them; JUMP TO AN S skips to the next sibilant.',
      '⤢ FULL SCREEN under either drawing docks the same buttons.',
      'The UNDERSTANDING CHECK at the end: tap an answer; its explanation follows.',
    ],
    changes: [
      'Same decision, different action: broadband turns the whole frame down, split-band only the hiss band.',
      'So on an S the cyan body bar drops in broadband and stays put in split-band.',
    ],
    teaches: [
      'Broadband sounds natural in small doses but makes the voice duck; split-band is surgical but can turn S into TH when pushed.',
      'The mode chosen here carries to The Detection Path and Over-De-Essing.',
    ],
    tryThis: [
      'Detector 6.5 kHz, Q 1.4, Threshold −10 dB, Range 8.0 dB: JUMP TO AN S lands on frame 3, “s”, at −7.2 dB. In BROADBAND its body bar drops too; in SPLIT-BAND it stays.',
      'Step to frame 8, “a”: no reduction — both modes pass it untouched.',
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  over: {
    seeing: [
      'OUTPUT · and the current stage’s name: the phrase after de-essing, input as ghost.',
      'The card names the stage and what you would hear. THE PROGRESSION lists every stage; ▶ marks the current one.',
    ],
    control: [
      'How hard: one slider, 0–100%, lowering the threshold from 0 to −24 dB with the range wide open.',
      'RESET RACK TO DEFAULTS puts every de-esser setting back to where the lab started. ⤢ FULL SCREEN docks the slider.',
      'The UNDERSTANDING CHECK at the end: tap an answer; its explanation follows.',
    ],
    changes: [
      'Pushing harder takes more off each S: tamed, then softened, then blurred, then gone.',
      'With the range wide open, nothing caps the cut: the lower the threshold, the deeper it goes — how a de-esser ends up lisping.',
    ],
    teaches: [
      'More is not better: the symptoms of each stage, from Transparent to Dull and lifeless.',
      'A suggested habit: set it so you only just hear it on the worst S, then back off a little.',
    ],
    tryThis: [
      'Slide How hard to 25% (threshold −6 dB): Transparent. 45%: Controlled. 75%: Lisping.',
      'At 100% (threshold −24 dB) it reads Dull and lifeless — about 16 dB on the S’s.',
    ],
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  connections: {
    seeing: [
      'Five links to labs whose parts the de-esser borrows — EQ Lab, Compression, Gate / Expander, Visual Audio Analysis, Speech & Voice Lab — each says what to do there.',
      'Then the closing question: which description of a de-esser is right?',
    ],
    control: [
      'OPEN › on a row opens that lab; going back returns here.',
      'Tap an answer to the closing question; its explanation follows. FINISH · SEE WHAT’S LEFT lists any page not yet done.',
    ],
    changes: [
      'Each link is the same idea from another side: Compression has the same detector, threshold and gain computer; Gate / Expander uses the threshold the other way around.',
    ],
    teaches: [
      'The one-sentence definition: a compressor whose detector listens through a hiss filter.',
      'The last page of the lab. Its five-question check sits on the Smart Processors page and completes the lab.',
    ],
    tryThis: [
      'Answer the closing question, then take the five questions on the Smart Processors page.',
      'OPEN › Compression and compare: the same parts, listening to the whole signal instead of a filtered copy.',
    ],
  },
};

// ── THE WHAT'S-LEFT SCREEN ──────────────────────────────────────────────────
/** PagedLab's `endGuide`: the de-esser's what's-left screen (LabEndScreen in
 *  "progress" mode — rows read ✓ DONE; DONE goes back one screen, to the hub).
 *  D41 K8 (2026-11-01): PagedLab's creditCheckLabId="smart-processors" lists
 *  the Smart Processors check as the last row (CHECK) and draws it on this
 *  screen, so LAB COMPLETE waits for it. */
export const DEESSER_END_GUIDE: ScreenGuide = {
  seeing: [
    "WHAT'S LEFT lists, by name, each page not done yet, then a CHECK row: the five-question Smart Processors check. LAB COMPLETE once every page is done and the check passed.",
    'Done pages and a passed check fold into one ✓ DONE row; the questions sit just above the list.',
    'If your saved pages cannot be read, the title reads YOUR PROGRESS and every page stays open; only pages done on this visit fold under ✓ DONE.',
  ],
  control: [
    'Tap a page’s row to open it; the CHECK row moves this screen up to the five questions.',
    'REVIEW ▾ on the ✓ DONE row lists the finished pages; tap any one to open it again.',
    'PRACTICE AGAIN FROM THE START opens What Sibilance Is and clears nothing.',
    'DONE · BACK TO LABS goes back one screen, to the Smart Processors Lab page; the same check is there too.',
    "In the strip above, ‹ PREV returns to the page you came from; WHAT'S LEFT ▾ drops down a list of every page, with START OVER (PRACTICE) at its foot, which clears the page ✓ marks after asking; a passed check stays.",
  ],
  changes: [
    'A page counts as done once you use one of its controls (not FULL SCREEN or RESET RACK TO DEFAULTS), get a check on it right, or press NEXT. Connections & Check counts on a right answer to its closing question, or on FINISH.',
    "Opening a page from the WHAT'S LEFT ▾ list or from a row here does not count it.",
    'Certificates count only the five-question check, here or on the Smart Processors Lab page.',
  ],
  teaches: [
    'Which pages of De-Esser & Sibilance Control — sibilance, the detection path, threshold, frequency, gain reduction, mode, over-de-essing — are marked done, and which are still listed.',
    'Reopening a page for practice takes nothing away; only START OVER (PRACTICE) clears the page ✓ marks, and it asks first.',
  ],
  tryThis: [
    'Open the first page still listed and work down in order — each page builds on the last.',
    'Tap the CHECK row and take the five questions: every answer is on one of these pages.',
    'Tap REVIEW ▾ and reopen a finished page you found hard; its ✓ stays.',
  ],
};

/** PagedLab's `pageGuide`: page index → its guide (undefined past the end). */
export function deEsserPageGuide(index: number): ScreenGuide | undefined {
  const page = DEESSER_PAGES[index];
  return page ? DEESSER_SCREEN_GUIDES[page.id] : undefined;
}
