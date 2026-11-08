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
    intro: {
      learning: 'The main microphone families, and why some names say how a mic turns sound into signal while others only describe its design or body.',
      start: 'Read the Moving-Coil Dynamic card down to IMPORTANT LIMITATION. Then tap COMPARE, pick Moving-Coil Dynamic and Condenser, and read the two cards side by side.',
    },
    seeing: [
      'Twelve mic types with photos. Four are named for how they turn sound into signal (Moving-Coil Dynamic, Condenser, Electret Condenser, Ribbon), eight for their design or form, from Large-Diaphragm to Contact.',
      'The amber banner warns these are NOT equivalent categories: a shotgun is usually a condenser.',
      'The card below gives WHAT IT IS, MAJOR CHARACTERISTICS, TYPICAL APPLICATIONS and IMPORTANT LIMITATION.',
    ],
    control: [
      'Under TAP A MICROPHONE, tap one to show its card. Moving-Coil Dynamic shows first.',
      'Tap COMPARE, then pick two mics to see their cards side by side. Tap COMPARING to go back to one card.',
      'Tap the photo on a card (⤢) to see it bigger.',
      'Tap NEXT: CHARACTERISTICS THAT MATTER › at the bottom, or use the strip under the title, to move between lessons. Tap the readout in the strip for the list of lessons. ‹ leaves the lab.',
    ],
    changes: [
      'The card follows the mic you tap. Its class line reads TRANSDUCER PRINCIPLE when the name is about the parts inside, or DESIGN / FORM FACTOR when it’s about the body around them.',
      'In COMPARE, a third pick replaces the older of your two.',
      'Every card ends on a limitation, because no type is best at everything.',
    ],
    teaches: [
      'The main microphone families: what each one is, where it’s typically used, and its main limitation.',
      'One mic can be a “condenser,” a “shotgun” and a “lavalier” at once: how it turns sound into signal, how it’s made directional, and its body are separate questions.',
      'Every type trades something away, so the job decides which trade you can accept.',
    ],
    tryThis: [
      'Tap Shotgun / Interference-Tube: its class reads DESIGN / FORM FACTOR, and WHAT IT IS puts a condenser capsule behind the tube.',
      'COMPARE Moving-Coil Dynamic with Condenser: passive and rugged against powered and detailed. Each one’s limitation is the other’s strength.',
      'Tap Contact: it senses vibration through the surface it touches, not sound in the air. Read its limitation: the tone is different.',
    ],
  },

  // ── LESSON 2 · CHARACTERISTICS THAT MATTER ───────────────────────────────
  chars: {
    intro: {
      learning: 'Which characteristics drive a mic choice, far beyond “dynamic or condenser,” and why more sensitivity or a flatter response is not automatically better.',
      start: 'Polar pattern shows first; read its card. Then tap Sensitivity and Maximum SPL in turn: one is about output, the other about how loud a source the mic can take.',
    },
    seeing: [
      'Sixteen characteristic chips sit beside a condenser photo, from Polar pattern to Environmental suitability.',
      'The card below names the one you picked and why it matters when you choose a mic. Some cards add an amber warning, such as “Flat is not synonymous with better.”',
    ],
    control: [
      'Tap any chip to show its card. Polar pattern shows first.',
      'Tap NEXT: POLAR PATTERN SELECTION ›, or use the strip under the title, to move between lessons.',
    ],
    changes: [
      'Each card answers one question: what does this characteristic change about the job? It’s not about how the mic is built.',
      'The amber warnings correct common beliefs: higher sensitivity is not automatically better, and a flat response is not automatically better either.',
    ],
    teaches: [
      'Many characteristics drive a selection, far more than “dynamic or condenser.”',
      'Self-noise, Signal-to-noise ratio and Equivalent noise level state the same thing, the mic’s own hiss, three ways.',
      'The best number on paper isn’t always the right one: each characteristic matters only as much as the job needs it.',
    ],
    tryThis: [
      'Tap Sensitivity, then Maximum SPL: one sets how much output you get, the other how loud a source can be. A kick drum up close can peak above 140 dB SPL.',
      'Tap Self-noise, Signal-to-noise ratio and Equivalent noise level: three ways of stating the same hiss.',
      'Tap Weight, and picture a boom operator holding a mic overhead for hours. Every gram counts.',
    ],
  },

  // ── LESSON 3 · POLAR PATTERN SELECTION ───────────────────────────────────
  patterns: {
    intro: {
      learning: 'A pickup pattern decides what a mic rejects as much as what it hears, and each pattern rejects different directions.',
      start: 'Cardioid shows first. Find the Wedge monitor straight behind the mic and read its tag. Then tap Hypercardioid and Figure-8 and watch that tag change.',
    },
    seeing: [
      'You’re looking down on a stage vocal mic aimed at the singer. On the ring: Singer · wanted, Drum kit, Audience, Wedge monitor, Reflective wall, HVAC vent.',
      'Amber outline: your pattern. Dotted ring: full pickup. TOP VIEW · DIRECTIONS ONLY, NOT TO SCALE: teaching shapes, not a real mic’s chart.',
      'Tags: ✓ good, ⚠ a problem, △ partial. Singer: ✓ picked up or ⚠ missed. The rest: ⚠ picked up or ✓ rejected.',
    ],
    control: [
      'Tap a pattern chip: Omni, Cardioid (shown first), Supercardioid, Hypercardioid or Figure-8.',
      'Under WHY DID YOU CHOOSE …?, tap the reason that fits your pattern. The line under it says whether that reason belongs to this pattern or points to another. A new pattern clears the reason.',
      'Tap NEXT: FREQUENCY RESPONSE & TONAL CHARACTER ›, or use the strip, to move on.',
    ],
    changes: [
      'Follow each neighbor’s dashed line to where it crosses the outline: that’s how much the mic hears from there. At 60% of the dotted ring or more, picked up; 25–60%, partial; below that, rejected (or missed, if wanted).',
      'Green is the good outcome: wanted and heard, or unwanted and rejected. Unwanted and heard shows ⚠ in red-orange.',
    ],
    teaches: [
      'A pattern is a decision about what to reject as much as what to hear.',
      'Cardioid rejects straight behind. Super- and hypercardioid narrow the front but grow a rear lobe. Figure-8 hears front and back and rejects the sides.',
      'On stage, you aim the direction a mic hears least toward the loudest thing you don’t want, such as the wedge.',
    ],
    tryThis: [
      'On Cardioid, the Wedge monitor straight behind reads ✓ rejected. On Hypercardioid it reads △ partial: that’s its rear lobe. On Figure-8: ⚠ picked up.',
      'The Drum kit, off to the side, reads △ partial on Cardioid but ✓ rejected on Hypercardioid: the tighter front pays off at the side.',
      'Pick Omni: every unwanted neighbor reads ⚠ picked up, and only the Singer stays ✓. Then tap “Need equal pickup in all directions”: that’s what Omni is for.',
    ],
  },

  // ── LESSON 4 · FREQUENCY RESPONSE & TONAL CHARACTER ──────────────────────
  curves: {
    intro: {
      learning: 'How to read a frequency response curve: what a mic lifts, what it cuts, and why a shaped curve can suit a job better than a flat one.',
      start: 'Relatively flat shows first: compare the amber line with the gray flat line. Then tap Low-frequency rolloff and read ATTENUATES and WHERE THAT IS USEFUL.',
    },
    seeing: [
      'A response graph runs from 20 Hz on the left to 20 kHz on the right. The amber line is the curve you chose; the gray line is flat.',
      'Every curve is fictional but realistic: read the SHAPE, not a brand.',
      'Under the graph you’ll find EMPHASIZES, ATTENUATES and WHERE THAT IS USEFUL, then a CHECK YOURSELF question and the lesson banner.',
    ],
    control: [
      'Tap a curve chip: Relatively flat (shown first), Presence rise (3–6 kHz), Low-frequency rolloff, Extended high-frequency response or Strongly shaped (application-voiced).',
      'In CHECK YOURSELF, tap an answer. A wrong one gives a hint; the right one gives the reason. ▾ folds the card.',
      'Tap NEXT: SENSITIVITY, NOISE & SPL ›, or use the strip, to move on.',
    ],
    changes: [
      'Where the amber line rises above the gray line, that range comes out louder; where it dips below, quieter.',
      'The low rolloff falls more the lower it goes. The strongly shaped curve lifts the lows and the highs and scoops the low-mids between: EQ built into the mic.',
    ],
    teaches: [
      'A response curve shows what a mic lifts, what it cuts, and where that helps.',
      'Flat is not synonymous with better: a shaped curve can be exactly right for the job.',
      'A real mic’s chart is its maker’s measurement, usually on-axis, at one distance and smoothed. Read it like a guide, then trust your ears in the room.',
    ],
    tryThis: [
      'Pick Low-frequency rolloff: ATTENUATES lists rumble, handling noise, stage wash and HVAC. Then answer the lectern question below.',
      'Compare Relatively flat with Strongly shaped: one reports the source as it is; the other is voiced like a kick drum mic.',
      'Pick Presence rise (3–6 kHz): the hump sits toward the right of the graph, in the band that helps a voice cut through.',
    ],
  },

  // ── LESSON 5 · SENSITIVITY, NOISE & SPL ──────────────────────────────────
  spl: {
    intro: {
      learning: 'Why a quiet source exposes a mic’s self-noise and a loud one tests its maximum SPL, so one mic can suit one source and struggle with another.',
      start: 'Studio condenser shows first: read its verdicts down THE SOURCE SCALE. Then tap Moving-coil dynamic and watch the verdicts at the quiet and loud ends swap.',
    },
    seeing: [
      'Three example mics with their traits: Studio condenser (shown first), Moving-coil dynamic and Electret lavalier.',
      'THE SOURCE SCALE runs from quiet at the top down to loud: Very quiet, Quiet, Moderate, Loud, Extremely loud. Each row has examples and a verdict for your mic: ✓ good match, △ depends or ⚠ caution.',
    ],
    control: [
      'Tap a mic to re-score the whole scale.',
      'Tap a source row to read the reason for its verdict; tap it again to close it.',
      'Tap NEXT: ACTIVE VS. PASSIVE / POWER ›, or use the strip, to move on.',
    ],
    changes: [
      'Sensitivity sets how much output you get. Self-noise is the floor under quiet sources, and maximum SPL the ceiling over loud ones. So the verdicts move with the mic.',
      'The condenser’s risk sits at the loud end, the dynamic’s at the quiet end.',
    ],
    teaches: [
      'Three specs answer one question: can this mic capture this source cleanly?',
      'A quiet source puts the mic’s own hiss close to the sound you want; a very loud one can push past its maximum SPL and distort.',
      'The type name doesn’t settle it: the spec numbers decide each match.',
    ],
    tryThis: [
      'On Studio condenser, Very quiet reads ✓ good match and Extremely loud ⚠ caution. Switch to Moving-coil dynamic and the two swap.',
      'Pick Electret lavalier and tap Quiet: ✓ good match, because speech is what it’s designed around.',
      'Studio condenser on Loud reads △ depends. Tap it: the max SPL spec decides, not the “condenser” label.',
    ],
  },

  // ── LESSON 6 · ACTIVE VS. PASSIVE / POWER ────────────────────────────────
  power: {
    intro: {
      learning: 'What a microphone asks of the rig (nothing, 48 V phantom power, or a power supply of its own) and why that is part of choosing it.',
      start: 'Passive moving-coil shows first, and the 48 V badge is dark. Tap Condenser and watch 48 V light on the PREAMP. Then tap Passive ribbon and read its caution.',
    },
    seeing: [
      'A small diagram: the mic, its cable, and a PREAMP box with a 48 V badge. The badge lights when your mic needs phantom power, which is power sent to the mic along its own cable.',
      'The card below says what that mic needs; the banner under it covers the exceptions.',
    ],
    control: [
      'Tap a chip: Passive moving-coil (shown first), Passive ribbon or Condenser.',
      'Tap NEXT: FORM FACTOR MATTERS ›, or use the strip, to move on.',
    ],
    changes: [
      '48 V lights only for Condenser. Its electronics need power, and in professional rigs that is most often 48 V phantom on the mic cable.',
      'The passive moving-coil and ribbon need none. The ribbon card adds a caution: leave phantom off while patching, and check the mic’s manual.',
    ],
    teaches: [
      'A mic asks the rig for nothing, for phantom power, or for a supply of its own.',
      '“Condenser” does not always mean 48 V: batteries, plug-in power and tube-mic supplies exist.',
      'So one selection question is practical: can the rig on this job power this mic?',
    ],
    tryThis: [
      'Tap Condenser: 48 V lights. Tap Passive moving-coil: it goes dark. That mic works plugged into any mic input.',
      'Tap Passive ribbon and read why phantom stays off while you patch.',
      'Read the banner: most tube condensers run on their own power supply, not phantom.',
    ],
  },

  // ── LESSON 7 · FORM FACTOR MATTERS ───────────────────────────────────────
  form: {
    intro: {
      learning: 'Why the body of a microphone (handheld, lavalier, headworn, shotgun, boundary and more) can matter as much as its specs.',
      start: 'Read down the seven rows and note the jobs each body serves. Tap a photo (⤢) to see it bigger. Then find the two rows that list Theater.',
    },
    seeing: [
      'Seven rows, each a mic body and its typical jobs: Handheld, Lavalier, Headworn, Shotgun, Boundary, Pencil / SDC (small-diaphragm condenser), Large-diaphragm studio.',
      'Below the rows, the lesson banner sums up the idea.',
    ],
    control: [
      'There’s nothing to set here. Read down the rows and compare the jobs. Tap a photo (⤢) to see it bigger.',
      'Tap NEXT: SELECTING FOR THE ENVIRONMENT ›, or use the strip, to move on.',
    ],
    changes: [
      'Nothing moves on this page. Look for the pattern across the rows: the same capsule idea in a different body serves a different job.',
    ],
    teaches: [
      'The physical design of a microphone can matter as much as its specifications.',
      'A handheld, a lavalier and a headworn suit different jobs: where the mic sits, whether it’s seen, and whether the person can move freely.',
    ],
    tryThis: [
      'Find the rows that list Theater: Lavalier and Headworn. Two bodies, one job.',
      'Compare Shotgun and Boundary: one reaches from a distance on a boom; the other hides on a table or the floor.',
    ],
  },

  // ── LESSON 8 · SELECTING FOR THE ENVIRONMENT ─────────────────────────────
  env: {
    intro: {
      learning: 'How the place sets the priorities for the same voice: detail and low noise in a studio, feedback rejection on stage, wind protection outdoors.',
      start: 'A, the studio, shows first: read its PRIORITIES. Then tap B and C and see the list reorder while the voice stays the same.',
    },
    seeing: [
      'Three places for the same voice, on chips A, B and C.',
      'The card names the place (A · Controlled recording studio, B · Loud concert stage or C · Outdoor interview), gives one line about it, and lists its PRIORITIES. The banner sums it up.',
    ],
    control: [
      'Tap A, B or C to change the place. A, the studio, shows first.',
      'Tap NEXT: APPLICATION EXPLORER ›, or use the strip, to move on.',
    ],
    changes: [
      'The voice never changes; the priorities do. Studio: tonal detail and low self-noise. Stage: feedback rejection and ruggedness. Outdoors: wind protection and handling noise.',
    ],
    teaches: [
      'The environment sets the priorities before you open any spec sheet.',
      'The same spec can count for a lot in one place and little in another: low self-noise matters in a quiet studio, far less beside a loud stage.',
    ],
    tryThis: [
      'Tap B: Feedback rejection (pattern!) tops the list. That’s the pattern choice from Lesson 3, now set by the room.',
      'Tap C: Wind protection comes first. Remember it: this is the same brief as the final challenge.',
    ],
  },

  // ── LESSON 9 · APPLICATION EXPLORER ──────────────────────────────────────
  jobs: {
    intro: {
      learning: 'How a job sets priorities, priorities point to characteristics, and characteristics pick the mic, and why “vocal mic” describes a common use, not a capability.',
      start: 'Live vocal shows first: read its four star ratings. Then tap Studio vocal and see which priorities get five stars instead.',
    },
    seeing: [
      'Three job groups, Voice (shown first), Instruments and Production / AV, each with a chip for every job.',
      'The card shows the job, four priorities rated in stars, a note, and the question WHICH MICROPHONE CHARACTERISTICS SATISFY THESE REQUIREMENTS?',
      'Below it: a CHECK YOURSELF question and the lesson banner.',
    ],
    control: [
      'Tap a group to list its jobs, then tap a job to show its card. Live vocal shows first.',
      'In CHECK YOURSELF, tap an answer for a hint or the reason.',
      'Tap NEXT: CHOOSE THE MICROPHONE ›, or use the strip, to move on.',
    ],
    changes: [
      'Each job reorders the priorities. Live vocal gives Feedback rejection and Ruggedness five stars; Studio vocal gives them to Tonal detail and Self-noise.',
      'No microphone is named, on purpose. The stars point to characteristics, and the characteristics pick the mic.',
    ],
    teaches: [
      'Choosing by job: the job sets priorities, priorities point to characteristics, and characteristics select the mic.',
      'Labels like “vocal mic” describe common use, not capability.',
      'A low rating matters too: it tells you which characteristic you can trade away for this job.',
    ],
    tryThis: [
      'Voice → Voiceover: Self-noise and Tonal detail get five stars, Ruggedness one. It’s a quiet voice in a quiet room.',
      'Instruments → Kick: Max SPL gets five stars, Self-noise one. Then tap Strings: the reverse.',
      'Production / AV → Measurement: Voicing gets one star, because accuracy is the whole job.',
    ],
  },

  // ── CHALLENGE · CHOOSE THE MICROPHONE ────────────────────────────────────
  challenge: {
    intro: {
      learning: 'There’s no universally best microphone: the right one fits the source, place, placement and production, and one changed condition can change the answer.',
      start: 'Read the Outdoor interview brief. Tap the mic you’d choose, check the factors that drove your choice, then tap CHECK MY REASONING.',
    },
    seeing: [
      'The brief, Outdoor interview: One speaker, Moderate traffic noise, Wind, Camera must stay several feet away, Boom operator available.',
      'CHOOSE THE MICROPHONE lists five fictional mics, Microphone A to E, each with its specs.',
      'After you pick one: WHY? SELECT THE FACTORS THAT DROVE YOUR CHOICE, then CHECK MY REASONING.',
    ],
    control: [
      'Tap a mic to pick it. A new pick clears your factors.',
      'Check the factors that drove your choice, then tap CHECK MY REASONING.',
      'Once you’ve checked the original brief, CHANGE ONE VARIABLE appears: Original brief, “The boom operator is no longer available,” “The interview is now inside a quiet studio” and “The interviewee must walk around freely.” Pick again, then CHECK MY REASONING.',
      'Tap NEXT: BUILD YOUR MIC LOCKER ›, or use the strip, to move on.',
    ],
    changes: [
      'The verdict reads ✓ A defensible professional choice, △ Also defensible (with its tradeoff), or ✗ Not the strongest choice — try again. The full reason appears once your pick is defensible.',
      'On the original brief, a defensible pick also gets a line that checks your factors against the key three: directionality, working distance, wind protection.',
      'Change one condition and the right mic changes with it.',
    ],
    teaches: [
      'There is no universally best microphone, only one that suits the source, the place, the placement and the production.',
      'A choice is justified by its factors, and one changed condition can change the answer.',
    ],
    tryThis: [
      'Pick Microphone B (the shotgun), check Directionality, Working distance / application and Wind protection, then CHECK MY REASONING: ✓, with all three key factors.',
      'Now choose “The boom operator is no longer available”: Microphone D, the rugged handheld, is the strongest pick; E, the lavalier, is also defensible.',
      'Try “The interview is now inside a quiet studio”: wind and traffic are gone, so Microphone A, the large-diaphragm condenser, fits.',
    ],
  },

  // ── OPTIONAL · BUILD YOUR MIC LOCKER ─────────────────────────────────────
  locker: {
    intro: {
      learning: 'Why choosing a set of mics differs from choosing one: versatility counts, and a mic that covers new jobs is worth more than a duplicate.',
      start: 'Tap a mic to add it and watch JOBS COVERED and THIS WEEK’S JOBS update. Try to cover all ten jobs within the six slots.',
    },
    seeing: [
      'You have six slots and ten jobs this week. There are ten mics to choose from, and each row says which jobs that mic covers.',
      'Two counters: SLOTS USED and JOBS COVERED, which turns green at nine or more. THIS WEEK’S JOBS marks each job ✓ covered or —.',
    ],
    control: [
      'Tap a mic to add it to the locker or take it out. With six chosen, the rest dim until you take one out.',
      'This is the lab’s last page. FINISH · SEE WHAT’S LEFT › opens the end screen and the lab’s check.',
    ],
    changes: [
      'A job counts once any mic you chose covers it. A second mic for the same job adds nothing to the count.',
      'So a mic that covers several missing jobs is worth more than another of a kind you already have.',
    ],
    teaches: [
      'Versatility is a characteristic too: choosing a set of mics means thinking about the whole week, not one job at a time.',
      'That’s why a small-diaphragm pair can cover more of a week than a second large-diaphragm condenser.',
    ],
    tryThis: [
      'Cover all ten jobs; five well-chosen mics can do it. Hint: Kick drum, Snare, Live vocal and Choir each have only one mic that covers them.',
      'Add Large-diaphragm condenser, then Second large-diaphragm condenser: JOBS COVERED doesn’t move the second time, because it covers nothing new.',
    ],
  },
};

// ── The what's-left end screen (with the understanding check) ──────────────
export const MICSEL_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'How the lab’s lessons fit together into one way of choosing a microphone, starting from the job, the place and the source.',
    start: 'Answer the four questions under CHECK YOUR UNDERSTANDING. If one stumps you, open REVIEW ▾, tap the lesson it comes from, then come back and try again.',
  },
  seeing: [
    'You’ve reached the end of the lab. The title reads WHAT’S LEFT until every step is opened (the optional mic locker too) and the check is passed; then it reads LAB COMPLETE.',
    'CHECK YOUR UNDERSTANDING asks four questions on the whole lab: mic categories, rumble at a lectern, self-noise, and a label versus the specs.',
    'REVIEW ▾ lists the lessons you’ve opened, and the check once you pass it.',
  ],
  control: [
    'Tap the answer you think is right. CORRECT shows why; NOT QUITE — TRY ANOTHER gives the reason, and you can pick again straight away.',
    'Tap a lesson row to go back to it. The CHECK row, last in the list, scrolls down to the questions.',
    'PRACTICE AGAIN FROM THE START reopens Lesson 1. DONE · BACK TO LABS leaves the lab.',
  ],
  changes: [
    'A lesson counts as done as soon as you open it. That’s your progress on this device, not a grade.',
    'Get every question right and the lab is complete. If you leave this screen, the questions start over, but a pass is kept.',
  ],
  teaches: [
    'Choosing a microphone starts with the job: the source, the place and the production set the priorities.',
    'Which characteristics those priorities point to: pattern, response, self-noise, maximum SPL, power and form.',
    'What a type name like “condenser” or a label like “vocal mic” can and can’t tell you about a mic.',
  ],
  tryThis: [
    'Unsure on the lectern question? Open FREQUENCY RESPONSE & TONAL CHARACTER (in the list, or under REVIEW ▾ once opened) and compare what each curve ATTENUATES.',
    'For the label question, open APPLICATION EXPLORER (in the list, or under REVIEW ▾ once opened) and look at what the stars rate.',
  ],
};

/** The guide for the screen showing: the end screen, or a step by its key. */
export function micSelScreenGuide(stepKey: string, ending: boolean): ScreenGuide | undefined {
  if (ending) return MICSEL_END_GUIDE;
  return (MICSEL_SCREEN_GUIDES as Record<string, ScreenGuide>)[stepKey];
}
