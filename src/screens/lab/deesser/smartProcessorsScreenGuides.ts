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
  intro: {
    learning: 'Smart processors listen, decide, then act. The de-esser lab shows you which parts do the listening and deciding, and how they tame the harsh S sounds in a voice.',
    start: 'Tap the De-Esser & Sibilance Control row and work through its pages in order. When you’re done, come back here and answer the five CHECK YOUR UNDERSTANDING questions.',
  },
  seeing: [
    'This is the Smart Processors menu. Every processor here listens first, decides, then acts. Each is built from a detector, a threshold, a gain computer and a choice of what to change.',
    'One lab is here: De-Esser & Sibilance Control, marked OPEN.',
    'Below it, CHECK YOUR UNDERSTANDING holds five questions on the de-esser.',
  ],
  control: [
    'Tap the De-Esser & Sibilance Control row to open the lab. ‹ goes back to the Dynamics list.',
    'In the check, tap the answer you think is right. CORRECT explains why. NOT QUITE — TRY ANOTHER explains the miss, and you can pick again right away. Nothing is scored.',
    'Inside the de-esser lab, tap ⓘ beside any page title to have that page explained.',
  ],
  changes: [
    'Nothing on this page moves. In the de-esser lab nothing plays either: you read a drawn spoken phrase, so its dB numbers are relative, not measured sound levels.',
    'Each right answer shows a ✓ and its explanation. Get all five right and the check is passed.',
  ],
  teaches: [
    'What makes a processor “smart”: it listens to the sound first, then decides when to act and how much.',
    'It builds on Compression, Gate / Expander and Limiter: the same detector and threshold, now aimed at the harsh S sounds in a voice.',
  ],
  tryThis: [
    'Open the de-esser lab and take its pages in order. Each builds on the last, from what an S is to how far to turn it down.',
    'Then come back for the check. Every answer is on one of the lab’s pages.',
    'Curious what you already know? Try the check first. Nothing is scored, so note the questions you miss and read those pages closely.',
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
    intro: {
      learning: 'Sibilance is the hiss of S, SH and CH: air forced past the teeth. An S sits mostly at 4–10 kHz; SH and CH sit lower, nearer 2–5 kHz.',
      start: 'Tap the “i” after “th”, then the “s” after it, and watch the SPECTRUM change. Then tap JUMP TO AN S until you reach “sh”.',
    },
    seeing: [
      'PHRASE shows a spoken phrase cut into frames, one column each. Cyan is the voice body; orange is the hiss band (2–10 kHz). Orange labels mark the sibilants.',
      'Under it, SPECTRUM shows the frame you picked: low frequencies on the left, high on the right. The orange strip marks the hiss region.',
      'The card tells you what kind of frame it is: sibilant, voiced, or a gap between words.',
    ],
    control: [
      'Tap a frame in the strip, or step with ‹ and ›. JUMP TO AN S skips straight to the next sibilant.',
      'Tap ⤢ FULL SCREEN under either drawing to enlarge it, with the same buttons docked below.',
      'Tap NEXT at the end of the page, or use the strip under the title, to move between pages. ‹ leaves the lab.',
    ],
    changes: [
      'On a vowel, the energy sits low: that’s the body of the voice. On an S, almost all of it is hiss, high up. SH and CH sit lower than S.',
      'The hiss is air forced through the narrow gap at the teeth. The small space in front of them tunes it high, into the 2–10 kHz region, where your ears are very sensitive.',
    ],
    teaches: [
      'Sibilance is the hiss of S, SH and CH. An S sits mostly at 4–10 kHz; SH and CH sit nearer 2–5 kHz.',
      'Close mic placement, bright mics, a presence boost in the EQ and heavy compression all push the S’s out of proportion to the rest of the voice.',
      'A de-esser’s first job is to tell these frames apart: sibilant, voiced, or a gap.',
    ],
    tryThis: [
      'Tap the “i” after “th”, then the “s” after it. The cyan body shrinks and the orange hiss takes over.',
      'Tap JUMP TO AN S until you reach “sh”. Its hiss sits near 4.0 kHz, lower than the S’s near 6.5–7.0 kHz.',
      'Pick a “·” gap. There’s almost nothing in either band, so there’s nothing for a de-esser to decide.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  eqVs: {
    intro: {
      learning: 'Why a static EQ cut dulls the whole voice, while a de-esser turns down only the S’s, because it acts only while its detector hears hiss.',
      start: 'Tap STATIC EQ CUT · −8 dB and read how much brightness the vowels lose. Then tap DE-ESSER and compare both numbers in the readout.',
    },
    seeing: [
      'Two buttons choose the fix: STATIC EQ CUT · −8 dB or DE-ESSER. The drawing shows the output, with the input behind it as a ghost.',
      'The top strip shows body and hiss per frame. HISS BAND ALONE, below, is in dB, so an 8 dB loss looks the same height on a vowel as on an S.',
      'The readout shows the brightness taken from everything that is not an S, and how far the S’s come down.',
    ],
    control: [
      'Tap STATIC EQ CUT · −8 dB or DE-ESSER to switch between the two fixes. ⤢ FULL SCREEN enlarges the drawing with both buttons docked.',
      'In the UNDERSTANDING CHECK below, tap an answer to see its explanation.',
    ],
    changes: [
      'The EQ cut never switches off, so every frame loses 8 dB of hiss: vowels, breaths and gaps too.',
      'The de-esser’s gain moves only while its detector hears hiss, so only the S frames drop. Everything between them keeps its brightness.',
    ],
    teaches: [
      'What sets a de-esser apart from EQ: it works only while there’s an S, and leaves the rest of the voice alone.',
      'Fixing sibilance with a static EQ cut dulls the whole voice, because it also takes brightness from every vowel.',
      'Both tools reach the same frequencies. The difference is when they act.',
    ],
    tryThis: [
      'Tap STATIC EQ CUT · −8 dB: the readout takes 8.0 dB from everything that is not an S. Tap DE-ESSER: 0.0 dB.',
      'With DE-ESSER on, read the second number: the S’s drop by about 7.0 dB while the vowels keep their brightness.',
      'Look at a vowel in HISS BAND ALONE. With the EQ cut, the output sits below its ghost; with DE-ESSER, the two line up.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  path: {
    intro: {
      learning: 'A de-esser is a compressor with a filtered ear: its side chain hears only the hiss, while the voice itself never passes through that filter.',
      start: 'Tap NEXT BLOCK › to step through the diagram, reading the card for each block. Then tap WALK THE SIGNAL and follow the lit block from INPUT to OUTPUT.',
    },
    seeing: [
      'SIGNAL PATH shows two routes. The MAIN PATH carries the voice to a gain element. The SIDE CHAIN listens to a copy: BAND-PASS, DETECTOR, THRESHOLD, GAIN COMP.',
      'In split-band mode, where the lab starts, the main path adds a BAND SPLIT and a SUM.',
      'The card under the diagram names the lit block and tells you what it does.',
    ],
    control: [
      'Tap a block, or tap NEXT BLOCK › to step through them. WALK THE SIGNAL steps on its own; STOP halts it.',
      '⤢ FULL SCREEN enlarges the diagram with the card docked. The diagram follows the BROADBAND / SPLIT-BAND choice you make on Broadband vs Split-Band.',
      'In the UNDERSTANDING CHECK at the end, tap an answer to see its explanation.',
    ],
    changes: [
      'The band-pass filter sits in the side chain, not the main path. It only shapes what the detector hears.',
      'So the decision is made on the hiss alone, and the voice passes untouched until the gain moves.',
      'In split-band, only the hiss band meets the gain element. With no reduction, the two bands add back up to the voice as it came in.',
    ],
    teaches: [
      'A de-esser is a compressor with a filtered ear. It uses the detector, threshold and gain computer you met in Compression.',
      'Many de-essers listen through a high-pass filter instead of a band-pass, or offer both. Either way, the filter steers only the decision, not the sound.',
    ],
    tryThis: [
      'Tap BAND-PASS, then GAIN. The filter sits in the side chain; the voice itself never passes through it.',
      'In split-band, tap WALK THE SIGNAL. The lit block runs INPUT, BAND SPLIT, around the side chain, then GAIN, SUM, OUTPUT.',
      'On Broadband vs Split-Band choose BROADBAND, then walk the signal here again: no BAND SPLIT or SUM, so the whole voice meets the gain. Set it back to SPLIT-BAND after.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  threshold: {
    intro: {
      learning: 'Threshold is the level the hiss must reach before the de-esser acts, the same idea as a compressor’s. Set it too low and it catches sounds that aren’t S’s.',
      start: 'Set Threshold to −10 dB and check that GAIN REDUCTION appears only under orange labels. Then drag it down to −19 dB and see which other sound crosses.',
    },
    seeing: [
      'DETECTOR shows how much hiss the detector hears on each frame, in dB, where 0 is the loudest S. The gold THRESHOLD line runs across it.',
      'Below, GAIN REDUCTION is drawn downward, capped at the range (the most it may cut). Orange labels mark the sibilants.',
      'The readout counts the sibilants above the line and any other sounds that cross it.',
    ],
    control: [
      'Drag the Threshold slider from −40 to 0 dB. ⤢ FULL SCREEN docks the readout and slider under the enlarged trace.',
      'The lab keeps one set of de-esser settings while it’s open, so the threshold you set here carries to the other pages.',
      'In the UNDERSTANDING CHECK at the end, tap an answer to see its explanation.',
    ],
    changes: [
      'Above the line the de-esser turns down; below it, nothing happens at all. This de-esser has a hard knee: no gentle in-between zone.',
      'Set it too high and no S crosses. Too low, and TH and P cross first, then vowels, then even the gaps between words.',
    ],
    teaches: [
      'Threshold is the level the hiss must reach before anything happens, the same idea as a compressor’s threshold.',
      'Gain reduction under a sound that isn’t an S tells you the threshold is too low.',
      'The right threshold sits in the gap between the quietest S and the hissiest other sound.',
    ],
    tryThis: [
      'With the detector where the lab starts (6.5 kHz, Q 1.4), set Threshold to −10 dB: every sibilant crosses, nothing else does, and the card reads About right.',
      'Drag down to −19 dB: one other sound crosses, the TH. At −21 dB the P joins it.',
      'Drag up to 0 dB: nothing crosses, and the card reads Too high.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  frequency: {
    intro: {
      learning: 'Why the detector must be tuned to where this voice hisses, and how a narrow band trades coverage for focus. SH hisses lower than S.',
      start: 'Pick the “s” · 7.0k button and read how much of its hiss the detector hears. Then slide Band width to Q 4.0 and watch that share drop.',
    },
    seeing: [
      'SPECTRUM shows the sibilant you picked. The gold dashed line over it is the detector’s band-pass: the part of the sound the detector can hear.',
      'The readout tells you what share of this sibilant’s hiss the detector hears. STARTING POINTS offers five suggested frequencies.',
    ],
    control: [
      'Detector frequency slider: 2.0–10.0 kHz. Band width: Q 0.7 (wide) to Q 4.0 (narrow). The higher the Q, the narrower the band.',
      'The sibilant buttons pick the sound to look at: “s” · 6.5k, “z” · 6.0k, “sh” · 4.0k, “s” · 7.0k, “s” · 6.8k.',
      'A STARTING POINTS button moves the detector to a suggested place and shows a short note. ⤢ FULL SCREEN docks the controls under the spectrum.',
      'In the UNDERSTANDING CHECK at the end, tap an answer to see its explanation.',
    ],
    changes: [
      'The band hears most at its center and less on either side. Aim it too low and it hears the voice; too high and it misses the S.',
      'A narrower band (higher Q) is pickier, so it can miss an S that sits off its center.',
      'Every voice hisses in its own place, and SH sits lower than S.',
    ],
    teaches: [
      'The detector frequency must match where this voice hisses. Band width trades focus for coverage: a narrow band is precise, a wide one still catches an S that sits off-center.',
      'Starting points are where you begin, not where you finish.',
    ],
    tryThis: [
      'At 6.5 kHz and Q 1.4, “s” · 7.0k is heard 98%. Slide Band width to Q 4.0 · narrow: 86%. A narrow band misses an off-center S.',
      'Still at 6.5 kHz and Q 4.0, pick “sh” · 4.0k: 24%, Missing it. Under STARTING POINTS, tap the "SH" rather than "S" · 4.0k button: the detector moves to 4.0 kHz and hears 100%.',
      'Before the next page, set the detector back to 6.5 kHz and Q 1.4, where the lab starts. The next pages’ numbers assume it.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  gr: {
    intro: {
      learning: 'How to read a gain-reduction meter as a question: is it working on the S’s only, and by a sensible amount? And how Range caps the cut.',
      start: 'With Threshold at −10 dB and Range at 8.0 dB, read the peak and the average. Then pull Range down to 4.0 dB and watch the range line cap every S.',
    },
    seeing: [
      'GAIN REDUCTION shows the detector trace on top. Below it, the reduction on each frame is drawn downward, capped at the range line.',
      'The readout gives the peak reduction, the average on the S’s, and the stage that average falls in, such as Transparent or Controlled.',
      'Orange labels mark the sibilants, so you can see whether each bar sits under an S.',
    ],
    control: [
      'Range (maximum reduction) slider: 0–8 dB. Threshold slider: −40 to 0 dB. ⤢ FULL SCREEN docks both under the trace.',
      'Both settings carry to the other pages while the lab is open.',
    ],
    changes: [
      'Range is the safety rail: however far an S goes over the threshold, the gain never drops more than this.',
      'A lower threshold deepens the reduction, until it reaches the range.',
      'Bars should appear only under orange labels. A bar anywhere else means the threshold is too low.',
    ],
    teaches: [
      'A gain-reduction meter answers two questions: is it working on the S’s only, and by a sensible amount?',
      'Threshold decides when the de-esser acts; Range limits how far it can go.',
      'For a natural-sounding voice, a suggested starting Range is 4–6 dB.',
    ],
    tryThis: [
      'With the detector at 6.5 kHz and Q 1.4 (where the lab starts), Threshold −10 dB and Range 8.0 dB: peak 7.4 dB, average 5.8 dB — Controlled.',
      'Pull Range down to 4.0 dB: peak 4.0 dB, average 3.7 dB — Transparent. The rail now caps every S.',
      'Drag Threshold down to −21 dB and look for bars under the TH and the P: the sign of a threshold set too low.',
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  mode: {
    intro: {
      learning: 'Broadband and split-band de-essers make the same decision but act differently: broadband turns the whole sound down, split-band only the hiss band.',
      start: 'Tap JUMP TO AN S, then switch between BROADBAND and SPLIT-BAND. Watch the cyan body bar: does it drop with the hiss, or stay put?',
    },
    seeing: [
      'Two buttons choose the mode: BROADBAND or SPLIT-BAND. The strip shows the output frame by frame, with the input as a ghost.',
      'THIS FRAME · BEFORE (GHOST) AND AFTER shows the spectrum of the frame you’re on. In split-band, a gold dashed line marks the band being turned down.',
      'The card compares both modes on this frame.',
    ],
    control: [
      'BROADBAND or SPLIT-BAND sets what gets turned down. Step frames with ‹ and ›; AUTO-STEP runs through them; JUMP TO AN S skips to the next sibilant.',
      '⤢ FULL SCREEN under either drawing docks the same buttons.',
      'The mode you choose here carries to The Detection Path and Over-De-Essing.',
      'In the UNDERSTANDING CHECK at the end, tap an answer to see its explanation.',
    ],
    changes: [
      'Same decision, different action: broadband turns the whole frame down, split-band only the hiss band.',
      'So on an S, the cyan body bar drops in broadband and stays put in split-band.',
      'On a frame with no reduction, the mode makes no difference: both pass it untouched.',
    ],
    teaches: [
      'Broadband sounds natural in small doses, but it makes the whole voice duck on each S.',
      'Split-band is surgical: it touches only the hiss. Pushed too far, it can turn an S into a TH.',
      'The mode never changes when the de-esser acts, only what it turns down.',
    ],
    tryThis: [
      'Set detector 6.5 kHz, Q 1.4, Threshold −10 dB, Range 8.0 dB. JUMP TO AN S lands on frame 3, “s”, at −7.2 dB reduction. In BROADBAND its body bar drops too; in SPLIT-BAND it stays.',
      'Step to frame 8, “a”: no reduction, so both modes pass it untouched.',
      'In BROADBAND, tap AUTO-STEP and watch the body bars dip on each S. That dip is the duck you’d hear on the whole voice.',
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  over: {
    intro: {
      learning: 'More de-essing is not better. Push harder and each S goes from tamed to softened, then blurred, then gone, and the voice starts to lisp.',
      start: 'Slide How hard to 25% and read the stage name. Then try 45% and 75%, and read what the card says you would hear at each.',
    },
    seeing: [
      'OUTPUT shows the phrase after de-essing, with the input as a ghost. The name after OUTPUT · is the stage you’re in.',
      'The card names the stage and what you would hear. THE PROGRESSION lists every stage; ▶ marks the current one.',
    ],
    control: [
      'The How hard slider runs 0–100%. It lowers the threshold from 0 to −24 dB with the range wide open.',
      'RESET RACK TO DEFAULTS puts every de-esser setting back where the lab started. ⤢ FULL SCREEN docks the slider.',
      'In the UNDERSTANDING CHECK at the end, tap an answer to see its explanation.',
    ],
    changes: [
      'Pushing harder takes more off each S: first tamed, then softened, then blurred, then gone.',
      'With the range wide open, nothing caps the cut. The lower the threshold, the deeper it goes, and that’s how a de-esser ends up making a voice lisp.',
    ],
    teaches: [
      'More is not better. Each stage has its own symptom, from Transparent to Dull and lifeless.',
      'A suggested habit: set it so you only just hear it on the worst S, then back off a little.',
      'An S cut too far stops sounding like an S, so words get harder to understand.',
    ],
    tryThis: [
      'Slide How hard to 25% (threshold −6 dB): Transparent. Then 45%: Controlled. Then 75%: Lisping.',
      'At 100% (threshold −24 dB) the card reads Dull and lifeless, about 16 dB off the S’s. Tap RESET RACK TO DEFAULTS when you’re done.',
    ],
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  connections: {
    intro: {
      learning: 'How the de-esser’s parts link it to EQ, compression and gates, so you can sum up what a de-esser is in one sentence.',
      start: 'Answer the closing question about what a de-esser is. Then tap OPEN › on Compression and compare its parts with the de-esser’s.',
    },
    seeing: [
      'Five links open labs whose parts the de-esser borrows: EQ Lab, Compression, Gate / Expander, Visual Audio Analysis and Speech & Voice Lab. Each says what to do there.',
      'Below them is the closing question: which description of a de-esser is right?',
    ],
    control: [
      'Tap OPEN › on a row to open that lab. Going back returns you here.',
      'Tap an answer to the closing question to see its explanation. FINISH · SEE WHAT’S LEFT lists any page you haven’t done yet.',
    ],
    changes: [
      'Each link shows the same idea from another side. Compression has the same detector, threshold and gain computer; Gate / Expander uses the threshold the other way around.',
    ],
    teaches: [
      'Every part of a de-esser comes from tools you already know, so one sentence can sum it up.',
      'A gate turns sound down below its threshold; a compressor and a de-esser turn it down above theirs.',
    ],
    tryThis: [
      'Answer the closing question, then take the five questions on the Smart Processors page.',
      'Tap OPEN › on Compression and compare: the same parts, listening to the whole signal instead of a filtered copy.',
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
  intro: {
    learning: 'A review of the de-esser: where sibilance sits, how the detector hears it, and how threshold, frequency, range and mode decide what gets turned down.',
    start: 'Tap the first page still listed under WHAT\'S LEFT and work down in order. Then tap the CHECK row and answer the five questions.',
  },
  seeing: [
    'WHAT\'S LEFT lists each page you haven’t done, then a CHECK row: the five Smart Processors questions. LAB COMPLETE shows once every page is done and the check is passed.',
    'Done pages and a passed check fold into one ✓ DONE row; the questions sit just above the list.',
    'If the title reads YOUR PROGRESS, your saved pages couldn’t be read: every page stays listed, and only pages done on this visit fold under ✓ DONE.',
  ],
  control: [
    'Tap a page’s row to open it. The CHECK row scrolls you up to the five questions.',
    'REVIEW ▾ on the ✓ DONE row lists the finished pages; tap any one to open it again.',
    'PRACTICE AGAIN FROM THE START opens What Sibilance Is and clears nothing.',
    'DONE · BACK TO LABS goes back one screen, to the Smart Processors Lab page; the same check is there too.',
    'In the strip above, ‹ PREV returns to the page you came from. WHAT\'S LEFT ▾ lists every page, with START OVER (PRACTICE) at its foot. START OVER asks first, then clears the page ✓ marks; a passed check stays.',
  ],
  changes: [
    'A page counts as done when you use one of its controls (not FULL SCREEN or RESET RACK TO DEFAULTS), answer its check right, or press NEXT.',
    'Connections & Check counts when you answer its closing question right, or tap FINISH. Opening a page from a list doesn’t count it.',
    'You can pass the five-question check here or on the Smart Processors Lab page; either one counts.',
  ],
  teaches: [
    'A review of the lab’s ideas: where sibilance sits, how the side chain hears it, and how threshold, detector frequency and range set what the de-esser takes off.',
    'How broadband and split-band differ, and what over-de-essing does to a voice.',
  ],
  tryThis: [
    'Open the first page still listed and work down in order. Each page builds on the last.',
    'Tap the CHECK row and take the five questions. Every answer is on one of these pages.',
    'Tap REVIEW ▾ and reopen a finished page you found hard. Its ✓ stays.',
  ],
};

/** PagedLab's `pageGuide`: page index → its guide (undefined past the end). */
export function deEsserPageGuide(index: number): ScreenGuide | undefined {
  const page = DEESSER_PAGES[index];
  return page ? DEESSER_SCREEN_GUIDES[page.id] : undefined;
}
