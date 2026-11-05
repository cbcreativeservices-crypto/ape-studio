/**
 * Microphone Selection Lab — "explain this screen" content (Screen Guide
 * rollout, 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is one stepped screen (MicSelectLabScreen.tsx) on the shared lab
 * navigation: nine lessons, the CHOOSE THE MICROPHONE challenge and the
 * optional mic locker (STEPS — the keys below), then the what's-left end
 * screen, which also carries the lab's understanding check (MIC_SELECT in
 * understandingChecks.ts, via LabUnderstandingBlock). One guide per step,
 * keyed by its STEPS key, plus MICSEL_END_GUIDE. No rack, no audio, no
 * engine on any of them.
 *
 * Every name is the on-screen name in MicSelectLabScreen.tsx /
 * micSelectData.ts / polarStage.tsx (chip labels, headings, verdict words,
 * buttons), the shared LabEndScreen / LabUnderstandingCheck, and the
 * CHECK YOURSELF card (foundations/bits.tsx). Every verdict quoted in a TRY
 * THIS is what the screen computes for that choice — the polar verdicts from
 * polarR() at each neighbour's bearing (picked up ≥ 0.6, partial 0.25–0.6),
 * the SPL verdicts from SPL_MATCH, the challenge answers from CHALLENGE_*,
 * the locker counts from LOCKER_MICS — re-derived in
 * test/screenGuide_micselect_20261031.test.ts.
 *
 * The header's accuracy chip is gone (owner rule 2026-10-31: a CONCEPT lab —
 * teaching models, no live mic, no measured numbers); its honesty point —
 * the patterns, curves and comparisons are teaching models, not any real
 * mic's measurements — is carried by the guides that show those drawings.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand or model names; no "N of total"; "suggest" never "recommend";
 * no build notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

/** STEPS keys in MicSelectLabScreen.tsx, in lab order. */
export type MicSelStepId =
  | 'types'
  | 'chars'
  | 'patterns'
  | 'curves'
  | 'spl'
  | 'power'
  | 'form'
  | 'env'
  | 'jobs'
  | 'challenge'
  | 'locker';

export const MICSEL_SCREEN_GUIDES: Record<MicSelStepId, ScreenGuide> = {
  // ── LESSON 1 · MEET THE MICROPHONE TYPES ─────────────────────────────────
  types: {
    seeing: [
      'Twelve microphone types with photos: four named for how they turn sound into signal (Moving-Coil Dynamic, Condenser, Electret Condenser, Ribbon), eight for their design or form, from Large-Diaphragm to Contact.',
      'The amber banner: these are NOT equivalent categories — a shotgun is usually a condenser.',
      'The card under the grid: WHAT IT IS, MAJOR CHARACTERISTICS, TYPICAL APPLICATIONS, IMPORTANT LIMITATION.',
    ],
    control: [
      'TAP A MICROPHONE: tap one to show its card; Moving-Coil Dynamic is shown first.',
      'COMPARE: tap it, then pick two mics — their cards sit side by side. Tap COMPARING to go back to one card.',
      'Tap the photo on a card (⤢) to enlarge it.',
      'NEXT: CHARACTERISTICS THAT MATTER › at the bottom, or the strip under the title, moves between lessons; tap the readout in the strip for the list of lessons. ‹ leaves the lab.',
    ],
    changes: [
      'The card follows the mic you tap. Its class line — TRANSDUCER PRINCIPLE or DESIGN / FORM FACTOR — says whether the name is about the parts inside or the body around them.',
      'In COMPARE, a third pick replaces the older of the two.',
      'Every card ends on a limitation: no type is best at everything.',
    ],
    teaches: [
      'The main microphone families: what each is, where it is typically used, and its main limitation.',
      'Why "condenser", "shotgun" and "lavalier" can all describe one mic — principle, directivity design and form are separate questions.',
      'The base for every later lesson. How a mic works lives in Microphone Principles.',
    ],
    tryThis: [
      'Tap Shotgun / Interference-Tube: its class reads DESIGN / FORM FACTOR, and WHAT IT IS puts a (condenser) capsule behind the tube.',
      'COMPARE Moving-Coil Dynamic with Condenser: passive and rugged against powered and detailed — each one’s limitation is the other’s strength.',
      'Tap Contact: it senses vibration, not air. Read its limitation — the tone is different.',
    ],
  },

  // ── LESSON 2 · CHARACTERISTICS THAT MATTER ───────────────────────────────
  chars: {
    seeing: [
      'Sixteen characteristic chips beside a condenser photo, from Polar pattern to Environmental suitability.',
      'The card below names the chosen one and why it matters to a choice. Some add an amber warning, such as "Flat is not synonymous with better."',
    ],
    control: [
      'Tap any chip to show its card; Polar pattern is shown first.',
      'NEXT: POLAR PATTERN SELECTION ›, or the strip under the title, moves between lessons.',
    ],
    changes: [
      'Each card answers one question: what this characteristic changes about the job — not how the mic is built.',
      'The amber warnings correct common beliefs: higher sensitivity is not automatically better, and flat is not automatically better.',
    ],
    teaches: [
      'The characteristics that drive a selection — far more than "dynamic or condenser".',
      'Self-noise, Signal-to-noise ratio and Equivalent noise level state one thing three ways.',
      'The lessons that follow apply these in turn: pattern, response, noise and SPL, power, form, environment.',
    ],
    tryThis: [
      'Tap Sensitivity, then Maximum SPL: one sets how much output you get, the other how loud a source can be — a kick drum up close can peak above 140 dB SPL.',
      'Tap Self-noise, Signal-to-noise ratio and Equivalent noise level: three ways of stating the same hiss.',
      'Tap Weight: why a boom operator holding a mic overhead for hours counts grams.',
    ],
  },

  // ── LESSON 3 · POLAR PATTERN SELECTION ───────────────────────────────────
  patterns: {
    seeing: [
      'A stage vocal mic from above, aimed at the singer, with neighbors on a ring: Singer · wanted, Drum kit, Audience, Wedge monitor, Reflective wall, HVAC vent.',
      'Amber outline: the chosen pattern. Dotted ring: full pickup. TOP VIEW · DIRECTIONS ONLY, NOT TO SCALE — teaching shapes, not a real mic’s chart.',
      'Tags: ✓ good, ⚠ a problem, △ partial. Singer: ✓ picked up or ⚠ missed. Others: ⚠ picked up or ✓ rejected.',
    ],
    control: [
      'Pattern chips: Omni, Cardioid (shown first), Supercardioid, Hypercardioid, Figure-8.',
      'WHY DID YOU CHOOSE …?: tap the reason that fits the pattern. The line under it says whether the reason belongs to this pattern or points to another. A new pattern clears the reason.',
      'NEXT: FREQUENCY RESPONSE & TONAL CHARACTER ›, or the strip, moves on.',
    ],
    changes: [
      'Where a neighbor’s dashed line crosses the outline is how much the mic hears from that direction: at 60% of the dotted ring or more, picked up; 25–60%, partial; below that, rejected (missed, if wanted).',
      'Green is the good outcome — wanted and heard, or unwanted and rejected. Unwanted and heard shows ⚠ in red-orange.',
    ],
    teaches: [
      'A pattern is a decision about what to reject as much as what to hear.',
      'Cardioid rejects straight behind; super- and hypercardioid narrow the front but grow a rear lobe; figure-8 hears front and back and rejects the sides.',
      'How patterns are made lives in Microphone Principles; here only the choice matters.',
    ],
    tryThis: [
      'On Cardioid the Wedge monitor, straight behind, reads ✓ rejected. Hypercardioid: △ partial — its rear lobe. Figure-8: ⚠ picked up.',
      'The Drum kit, off to the side, is △ partial on Cardioid but ✓ rejected on Hypercardioid — the tighter front pays off at the side.',
      'Pick Omni: every unwanted neighbor reads ⚠ picked up (only the Singer stays ✓). Then tap "Need equal pickup in all directions" — that is what Omni is for.',
    ],
  },

  // ── LESSON 4 · FREQUENCY RESPONSE & TONAL CHARACTER ──────────────────────
  curves: {
    seeing: [
      'A response graph from 20 Hz (left) to 20 kHz (right). The amber line is the chosen curve; the grey line is flat.',
      'Every curve is fictional but realistic — read the SHAPE, not a brand.',
      'Under it: EMPHASIZES, ATTENUATES and WHERE THAT IS USEFUL; then a CHECK YOURSELF question and the lesson banner.',
    ],
    control: [
      'Curve chips: Relatively flat (shown first), Presence rise (3–6 kHz), Low-frequency rolloff, Extended high-frequency response, Strongly shaped (application-voiced).',
      'CHECK YOURSELF: tap an answer — a wrong one gives a hint, the right one the reason. ▾ folds the card.',
      'NEXT: SENSITIVITY, NOISE & SPL ›, or the strip, moves on.',
    ],
    changes: [
      'Above the grey line, that range comes out louder; below it, quieter.',
      'The low rolloff falls more the lower it goes. The strongly shaped curve lifts the lows and the highs and scoops the low-mids between — EQ built into the mic.',
    ],
    teaches: [
      'How to read a response curve like a spec sheet: what it lifts, what it cuts, and where that helps.',
      'Flat is not synonymous with better — a shaped curve can be exactly right for the job.',
      'Next, Lesson 5 asks whether the mic can capture the source at all.',
      'A real mic’s chart is its maker’s measurement, usually on-axis, at one distance and smoothed: use it as a guide, then trust your ears in the room.',
    ],
    tryThis: [
      'Pick Low-frequency rolloff: ATTENUATES lists rumble, handling noise, stage wash and HVAC. Then answer the lectern question below.',
      'Compare Relatively flat with Strongly shaped: one reports the source as it is; the other is a kick-drum-style voicing.',
      'Pick Presence rise (3–6 kHz): the hump sits in the upper part of the graph’s range — the band that helps a voice cut through.',
    ],
  },

  // ── LESSON 5 · SENSITIVITY, NOISE & SPL ──────────────────────────────────
  spl: {
    seeing: [
      'Three example mics with their traits: Studio condenser (shown first), Moving-coil dynamic, Electret lavalier.',
      'THE SOURCE SCALE, quiet at the top: Very quiet, Quiet, Moderate, Loud, Extremely loud — each with examples and a verdict for the chosen mic: ✓ good match, △ depends or ⚠ caution.',
    ],
    control: [
      'Tap a mic to re-score the whole scale.',
      'Tap a source row to open the reason for its verdict; tap it again to close.',
      'NEXT: ACTIVE VS. PASSIVE / POWER ›, or the strip, moves on.',
    ],
    changes: [
      'Sensitivity sets how much output you get, self-noise the floor under quiet sources, maximum SPL the ceiling over loud ones — so the verdicts move with the mic.',
      'The condenser’s risk sits at the loud end, the dynamic’s at the quiet end.',
    ],
    teaches: [
      'Three specs, one question: can this mic capture this source cleanly?',
      'Why a quiet source exposes self-noise and a loud one tests maximum SPL.',
      'It builds on Lesson 2’s characteristics; powering comes next.',
    ],
    tryThis: [
      'Studio condenser: Very quiet reads ✓ good match, Extremely loud ⚠ caution. Switch to Moving-coil dynamic and the two swap.',
      'Pick Electret lavalier and tap Quiet: ✓ good match — speech is what it is designed around.',
      'Studio condenser on Loud reads △ depends. Tap it: the max SPL spec decides, not the "condenser" label.',
    ],
  },

  // ── LESSON 6 · ACTIVE VS. PASSIVE / POWER ────────────────────────────────
  power: {
    seeing: [
      'A small diagram: the mic, its cable, and a PREAMP box with a 48 V badge that lights when the chosen mic needs phantom power.',
      'The card below says what that mic needs; the banner under it covers the exceptions.',
    ],
    control: [
      'Chips: Passive moving-coil (shown first), Passive ribbon, Condenser.',
      'NEXT: FORM FACTOR MATTERS ›, or the strip, moves on.',
    ],
    changes: [
      '48 V lights only for Condenser: its electronics need power, in professional rigs most often 48 V phantom on the mic cable.',
      'The passive moving-coil and ribbon need none. The ribbon card adds a caution: leave phantom off while patching, and check the mic’s manual.',
    ],
    teaches: [
      'What a mic asks of the rig: nothing, phantom power, or a supply of its own.',
      '"Condenser" does not always mean 48 V: batteries, plug-in power and tube-mic supplies exist.',
      'The selection question: can the rig on this job power this mic?',
    ],
    tryThis: [
      'Tap Condenser: 48 V lights. Tap Passive moving-coil: it goes dark — plug in anywhere with a mic input.',
      'Tap Passive ribbon and read why phantom stays off while patching.',
      'Read the banner: most tube (valve) condensers run on their own power supply, not phantom.',
    ],
  },

  // ── LESSON 7 · FORM FACTOR MATTERS ───────────────────────────────────────
  form: {
    seeing: [
      'Seven rows, each a mic body and its typical jobs: Handheld, Lavalier, Headworn, Shotgun, Boundary, Pencil / SDC (small-diaphragm condenser), Large-diaphragm studio.',
      'Below: the lesson banner.',
    ],
    control: [
      'Nothing to set: read down the rows and compare the jobs. Tap a photo (⤢) to enlarge it.',
      'NEXT: SELECTING FOR THE ENVIRONMENT ›, or the strip, moves on.',
    ],
    changes: [
      'Nothing moves here. The point is the pattern across the rows: the same capsule idea in a different body serves a different job.',
    ],
    teaches: [
      'The physical design of a microphone can matter as much as its specifications.',
      'Why a handheld, a lavalier and a headworn suit different jobs.',
    ],
    tryThis: [
      'Find the rows that list Theater: Lavalier and Headworn — two bodies, one job.',
      'Compare Shotgun and Boundary: one reaches from a distance on a boom, one hides in a table or floor.',
    ],
  },

  // ── LESSON 8 · SELECTING FOR THE ENVIRONMENT ─────────────────────────────
  env: {
    seeing: [
      'Three places for the same voice, on chips A, B and C.',
      'The card: the place (A · Controlled recording studio, B · Loud concert stage, C · Outdoor interview), one line about it, and its PRIORITIES. The banner sums it up.',
    ],
    control: [
      'Tap A, B or C to change the place; A, the studio, is shown first.',
      'NEXT: APPLICATION EXPLORER ›, or the strip, moves on.',
    ],
    changes: [
      'The voice never changes; the priorities do. Studio: tonal detail and low self-noise. Stage: feedback rejection and ruggedness. Outdoors: wind protection and handling noise.',
    ],
    teaches: [
      'The environment sets the priorities before any spec sheet is opened.',
      'It feeds the Application Explorer next, where each job’s priorities are rated.',
    ],
    tryThis: [
      'Tap B: Feedback rejection (pattern!) tops the list — Lesson 3’s choice, now set by the room.',
      'Tap C: Wind protection comes first — the same brief as the final challenge.',
    ],
  },

  // ── LESSON 9 · APPLICATION EXPLORER ──────────────────────────────────────
  jobs: {
    seeing: [
      'Job groups — Voice (shown first), Instruments, Production / AV — and under them a chip for each job.',
      'The card: the job, four priorities rated in stars, a note, and the question WHICH MICROPHONE CHARACTERISTICS SATISFY THESE REQUIREMENTS?',
      'Below: a CHECK YOURSELF question and the lesson banner.',
    ],
    control: [
      'Tap a group to list its jobs, then a job to show its card; Live vocal is shown first.',
      'CHECK YOURSELF: tap an answer for a hint or the reason.',
      'NEXT: CHOOSE THE MICROPHONE ›, or the strip, moves on.',
    ],
    changes: [
      'Each job reorders the priorities: Live vocal gives Feedback rejection and Ruggedness five stars; Studio vocal gives them to Tonal detail and Self-noise.',
      'No microphone is named, on purpose — the stars point to characteristics, and the characteristics pick the mic.',
    ],
    teaches: [
      'Choosing by job: the job sets priorities, priorities point to characteristics, characteristics select the mic.',
      'Labels like "vocal mic" describe common use, not capability.',
      'It is the last lesson before CHOOSE THE MICROPHONE.',
    ],
    tryThis: [
      'Voice → Voiceover: Self-noise and Tonal detail get five stars, Ruggedness one — a quiet voice in a quiet room.',
      'Instruments → Kick: Max SPL five stars, Self-noise one. Then Strings: the reverse.',
      'Production / AV → Measurement: Voicing gets one star — accuracy is the whole job.',
    ],
  },

  // ── CHALLENGE · CHOOSE THE MICROPHONE ────────────────────────────────────
  challenge: {
    seeing: [
      'The brief, Outdoor interview: One speaker, Moderate traffic noise, Wind, Camera must stay several feet away, Boom operator available.',
      'CHOOSE THE MICROPHONE: five fictional mics, Microphone A to E, each with its specs.',
      'After a pick: WHY? SELECT THE FACTORS THAT DROVE YOUR CHOICE, then CHECK MY REASONING.',
    ],
    control: [
      'Tap a mic to pick it; a new pick clears the factors.',
      'Tick the factors that drove the choice, then CHECK MY REASONING.',
      'Once the original brief has been checked, CHANGE ONE VARIABLE appears: Original brief, plus "The boom operator is no longer available", "The interview is now inside a quiet studio" and "The interviewee must walk around freely". Pick again, then CHECK.',
      'NEXT: BUILD YOUR MIC LOCKER ›, or the strip, moves on.',
    ],
    changes: [
      'The verdict: ✓ A defensible professional choice, △ Also defensible (with its tradeoff), or ✗ Not the strongest choice — try again. The full reason shows only once the pick is defensible.',
      'On the original brief, once the pick is defensible, a reasoning line checks your factors against the key three: directionality, working distance, wind protection.',
      'Change one condition and the right mic changes with it.',
    ],
    teaches: [
      'There is no universally best microphone — only one appropriate to the source, the place, the placement and the production.',
      'How to justify a choice by its factors, and how one changed condition changes the answer.',
    ],
    tryThis: [
      'Pick Microphone B (the shotgun), tick Directionality, Working distance / application and Wind protection, and CHECK MY REASONING: ✓, with all three key factors.',
      'Now choose "The boom operator is no longer available": Microphone D, the rugged handheld, is the strongest pick; E, the lavalier, is also defensible.',
      'Try "The interview is now inside a quiet studio": wind and traffic are gone — Microphone A, the large-diaphragm condenser.',
    ],
  },

  // ── OPTIONAL · BUILD YOUR MIC LOCKER ─────────────────────────────────────
  locker: {
    seeing: [
      'Six slots, ten jobs this week. Ten mics to tick, each row saying which jobs it covers.',
      'Two counters, SLOTS USED and JOBS COVERED (green at nine or more). THIS WEEK’S JOBS marks each job ✓ covered or —.',
    ],
    control: [
      'Tap a mic to add it to the locker or take it out. With six chosen, the rest dim until you take one out.',
      'This is the last page: FINISH · SEE WHAT’S LEFT › opens the end screen and the lab’s check.',
    ],
    changes: [
      'A job counts once any chosen mic covers it; a second mic for the same job adds nothing to the count.',
      'So a mic that covers several missing jobs is worth more than another of a kind you already have.',
    ],
    teaches: [
      'Versatility is a characteristic too: choosing a set of mics is systems thinking.',
      'Why a small-diaphragm pair can cover more of a week than a second large-diaphragm condenser.',
    ],
    tryThis: [
      'Cover all ten jobs — five well-chosen mics can do it. Hint: Kick drum, Snare, Live vocal and Choir each have only one mic that covers them.',
      'Add Large-diaphragm condenser, then Second large-diaphragm condenser: JOBS COVERED does not move the second time — it covers nothing new.',
    ],
  },
};

// ── The what's-left end screen (with the understanding check) ──────────────
export const MICSEL_END_GUIDE: ScreenGuide = {
  seeing: [
    'The title reads WHAT’S LEFT, listing what is still to do, until every step is opened (the mic locker too, though marked Optional) and the check is passed; then it reads LAB COMPLETE. The CHECK row comes last.',
    'CHECK YOUR UNDERSTANDING: four questions on the whole lab — categories, lectern rumble, self-noise, and a label versus the specs.',
    'REVIEW ▾ lists the lessons already opened, and the check once passed.',
  ],
  control: [
    'Tap an answer: CORRECT and why, or NOT QUITE — TRY ANOTHER with the reason; pick again straight away.',
    'Tap a lesson row to jump to it; the CHECK row scrolls this screen to the questions. PRACTICE AGAIN FROM THE START reopens Lesson 1; DONE · BACK TO LABS leaves the lab.',
  ],
  changes: [
    'A lesson counts once it is opened — progress on this device, not a grade.',
    'Answering every question right completes the lab for the certificates that include it. Leaving this screen starts the questions over; a pass is kept.',
  ],
  teaches: [
    'This lab covered types, characteristics, patterns, response, noise and SPL, power, form, environment and jobs — and choosing by them.',
    'It pairs with Microphone Principles (how a mic works), one of the Audio Fundamentals labs.',
  ],
  tryThis: [
    'Unsure on the lectern question? Tap FREQUENCY RESPONSE & TONAL CHARACTER (under REVIEW ▾ once opened) and pick Low-frequency rolloff.',
    'For the label question, tap APPLICATION EXPLORER (under REVIEW ▾ once opened): the stars rate characteristics, never a label.',
  ],
};

/** The guide for the screen showing: the end screen, or a step by its key. */
export function micSelScreenGuide(stepKey: string, ending: boolean): ScreenGuide | undefined {
  if (ending) return MICSEL_END_GUIDE;
  return (MICSEL_SCREEN_GUIDES as Record<string, ScreenGuide>)[stepKey];
}
