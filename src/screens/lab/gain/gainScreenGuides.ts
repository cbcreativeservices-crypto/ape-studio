/**
 * Gain Staging Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; the pattern and standard are wave/waveScreenGuides.ts). One
 * guide per module (keyed by GainModuleId), one for the lab home, and one
 * for the in-place what's-left screen (home SEE WHAT'S LEFT and the last
 * module's FINISH both swap LabEndScreen in).
 *
 * Every line was written against the module's own code (modLearn /
 * modExplore / gainViz / gainEngine): the names are the on-screen names
 * (bezel keys, dock labels, tray labels, column names, tags drawn on the
 * glass), and every number in TRY THIS is what computeChain prints for that
 * setting, from the module's default state unless the step says otherwise
 * (levels are rounded the way the bezel rounds them). Change a module's
 * labels, ranges, defaults or the engine's zone edges → update its guide
 * here; test/screenGuide_gain_20261031.test.ts pins the shape and names.
 *
 * Engine facts the copy relies on (gainEngine.ts): relative dB, 0 dB = the
 * overload ceiling; TOO LOW below −24 dB, HOT from −6 dB, CLIP at 0 dB; a
 * clip latches DIST for every later stage (a later stage at +0 dB is handed
 * 0 dB and reads CLIP itself); noise floor −52 dB at the source plus −48 dB
 * of self-noise per stage. The grey hiss is drawn only once the noise is on
 * the meter scale (above about −40 dB), and the red meter zone starts at HOT
 * (−6 dB) with the 0 dB ceiling as a red line (gainViz StageMeterV).
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts) — tighten
 * wording, never cut accuracy. Copy rules: plain language, short sentences;
 * claims KNOWLEDGE, never skills; no gear brand names; no "N of total"; no
 * build notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import type { GainModuleId } from './modules/registry';

export const GAIN_HOME_GUIDE: ScreenGuide = {
  seeing: [
    'The lab menu. The strip on top — SOURCE › PREAMP › PROCESSING › FADER › OUTPUT — is the general path; each module shows part of it, or a fuller version.',
    'LEARN: how each stage feeds the next. EXPLORE: a full channel strip with Signal X-Ray, plus Free Practice. CHALLENGE: find the stage that’s wrong.',
    'A ✓ marks a module done. RELATED opens the LEVELS & DECIBELS CALC, SIGNAL CHAIN BUILDER and SPL METER.',
  ],
  control: [
    'Tap a module’s name to read its one-line description; tap OPEN to start it.',
    'Inside a module: the chain on the display, live levels on its frame, faders in the dock at the bottom, notes to scroll below.',
    'The strip under a module’s title moves between modules; ‹ leaves the lab. SEE WHAT’S LEFT lists what is still to do.',
    'Tap the ⓘ at the right of a module’s title to have that screen explained.',
  ],
  changes: [
    'The LEARN modules keep most stages FIXED and hand you one or two faders, so each cause shows on its own.',
    'Multiple Gain Stages opens a seven-column channel strip; Free Practice hands you the SOURCE as well.',
    'The Troubleshooting Challenge hides every meter except the MASTER — the way real gear often works.',
    'All run on one model: a stage that hits its ceiling clips, and the distortion travels downstream.',
  ],
  teaches: [
    'Gain staging: a healthy level at every stage — above the noise, below overload.',
    'Why the first gain stage matters most: noise and distortion both travel downstream.',
    'Why a fader lowers level but cannot remove clipping made before it.',
    'Levels are simulated on a relative scale (0 dB = overload), not real units like dBu or dBFS (see the LEVELS & DECIBELS CALC). It follows the signal-flow labs, before mixing.',
  ],
  tryThis: [
    'New to gain staging? Work through LEARN in order — each module adds one stage or one idea.',
    'Start with What Gain Staging Is: move SOURCE and watch the level ripple from stage to stage.',
    'Finish with the Troubleshooting Challenge: only the MASTER is visible — find the stage that clips.',
  ],
};

/** The in-place what's-left screen (LabEndScreen) — home and last module. */
export const GAIN_END_GUIDE: ScreenGuide = {
  seeing: [
    'WHAT’S LEFT: the Gain Staging modules not yet credited, each with a › to jump straight in. With nothing left, the title reads LAB COMPLETE.',
    'Modules already credited fold into one ✓ line; REVIEW ▾ opens them.',
  ],
  control: [
    'Tap a row to open that module.',
    'PRACTICE AGAIN FROM THE START reopens What Gain Staging Is; it never removes credit.',
    'DONE · BACK TO LABS leaves this screen.',
  ],
  changes: [
    'Every module except the Troubleshooting Challenge is credited when you open it.',
    'The Troubleshooting Challenge is credited only when you pass it: fault found and every stage healthy again.',
  ],
  teaches: [
    'Where you stand in the lab. Nothing here is graded or timed.',
    'Every module stays open for practice after it is credited.',
  ],
  tryThis: [
    'Challenge still listed? Open the Troubleshooting Challenge and fix the chain.',
    'Everything credited? Practice again in Free Practice: make deliberate mistakes and recover.',
  ],
};

export const GAIN_SCREEN_GUIDES: Record<GainModuleId, ScreenGuide> = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  intro: {
    seeing: [
      'The chain: SOURCE, PREAMP, OUTPUT. Meters: blue TOO LOW, green HEALTHY, red from −6 dB (HOT) to the 0 dB line (OVERLOAD). Grey at the foot of PREAMP and OUTPUT is hiss (the noise floor).',
      'The word under a meter names its zone (a mic’s QUIET SOURCE is normal). PREAMP (+18 dB) and OUTPUT (+0 dB) are FIXED.',
      'Readouts: SOURCE, PREAMP, OUTPUT and STATUS (OK, HOT or CLIP). Each level is dB below the 0 dB ceiling.',
    ],
    control: [
      'SOURCE fader (−40 to −6 dB, starts at −30 dB): how loud the signal reaching the preamp is — a quiet mic at the bottom, a loud source at the top.',
      'Nothing else moves on this screen.',
      'Tap a meter to clear its peak line (the thin light mark at the highest level it reached).',
      'FULL SCREEN enlarges the chain; HIDE DISPLAY gives the notes and the check question the whole screen.',
    ],
    changes: [
      'Each stage adds its gain to the level it is handed: −30 dB in, +18 dB of preamp gain, −12 dB out.',
      'Raise SOURCE and every later meter rises with it; the change ripples left to right.',
      'A stage that reaches 0 dB clips: it cannot go higher, so the peaks are cut off — distortion. CLIP shows under it.',
      'Lower SOURCE and the stages sink toward the blue zone, closer to the hiss.',
    ],
    teaches: [
      'A signal is a path through stages, and each stage has a healthy operating range.',
      'Healthy means two margins at once: enough level above the noise, enough headroom (the dB left below 0) under overload.',
      'Gain staging is not a race to be loud.',
      'This is the lab’s first module; the next ones hand you the stage controls, starting with input gain.',
    ],
    tryThis: [
      'Raise SOURCE to −24 dB: PREAMP reads −6 dB and STATUS turns HOT — only 6 dB of headroom left.',
      'Raise SOURCE to −18 dB: PREAMP hits 0 dB and STATUS reads CLIP — the FIXED preamp is forced into overload.',
      'Drop SOURCE to −40 dB: PREAMP falls to −22 dB, near the bottom of the healthy band.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  input: {
    seeing: [
      'The same chain: SOURCE, PREAMP, OUTPUT. Now the SOURCE is FIXED — a quiet mic at −30 dB — and so is the OUTPUT (+0 dB).',
      'Under PREAMP: your gain setting. Meters: blue TOO LOW, green HEALTHY, red from −6 dB (HOT). Raise INPUT GAIN and grey hiss appears at the meter foot.',
      'Readouts: PREAMP (its level), HEADROOM (dB left below the 0 dB ceiling), OUTPUT, and STATUS — the preamp’s state: LOW, OK, HOT or CLIP.',
    ],
    control: [
      'INPUT GAIN fader (+0 to +40 dB, starts at +0 dB): how much the preamp lifts the quiet source.',
      'Nothing else moves here. The box in the notes tells you how the preamp is doing: too low, healthy, hot or clipping.',
      'FULL SCREEN enlarges the chain; HIDE DISPLAY gives the notes the whole screen.',
    ],
    changes: [
      'PREAMP = source + input gain: at +18 dB, −30 + 18 = −12 dB. HEADROOM shrinks as gain rises.',
      'Too little gain leaves the signal in the blue zone, a small gap above the noise. Too much hits 0 dB: the waveform is clipped flat, HEADROOM 0 dB.',
      'Hiss rises with gain too: slowly at first, while the preamp’s own fixed hiss is the louder part, then dB for dB. No gain removes hiss that came in with the source.',
    ],
    teaches: [
      'Input gain is the first, and most important, gain decision in the chain.',
      'The target is a level, not a magic number: strong, clean, with headroom to spare.',
      'Headroom is the space between the level and the overload ceiling.',
      'It follows What Gain Staging Is; next, Follow the Signal shows what this setting does to every later stage.',
    ],
    tryThis: [
      'Slide INPUT GAIN to +6 dB: PREAMP reads −24 dB, the bottom edge of healthy, and STATUS turns OK.',
      'Push it to +24 dB: PREAMP reads −6 dB, HEADROOM 6 dB, STATUS HOT — usable, but little room for a loud note.',
      'Push it to +30 dB: HEADROOM reads 0 dB and STATUS CLIP — the preamp has run out of room.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  follow: {
    seeing: [
      'Four stages: SOURCE (FIXED, a quiet mic at −30 dB), PREAMP (yours), PROC (a FIXED processor adding +6 dB) and OUTPUT (FIXED, +0 dB).',
      'Meters: blue TOO LOW, green HEALTHY, red from −6 dB (HOT) to the 0 dB line; grey hiss shows once there is enough gain. The arrows between stages turn red once the signal is distorted.',
      'Readouts: PREAMP, PROC and OUTPUT levels, and STATUS — the output’s state.',
    ],
    control: [
      'PREAMP fader (+0 to +40 dB, starts at +6 dB): the only control on this screen.',
      'FULL SCREEN enlarges the chain; HIDE DISPLAY gives the notes and the check question the whole screen.',
    ],
    changes: [
      'Each stage starts from the level the one before hands it: PROC adds its 6 dB to whatever PREAMP sends.',
      'A weak preamp leaves later stages near the hiss: at +0 dB, PROC and OUTPUT just reach HEALTHY’s bottom edge.',
      'A hot preamp leaves no room for PROC’s +6 dB: PROC reaches 0 dB and clips, even though the preamp has not.',
      'Once a stage clips, the distortion is part of the signal and rides on to the OUTPUT.',
    ],
    teaches: [
      'A chain is a sequence: each stage’s output is the next stage’s input.',
      'An early mistake cannot be rescued downstream; it has to be fixed where it happens.',
      'Headroom at one stage must leave room for the gain of the stages after it.',
      'It builds on Input Gain First; next, Too Low vs. Too High compares the two ways to get it wrong.',
    ],
    tryThis: [
      'Raise PREAMP to +18 dB: PREAMP reads −12 dB (healthy), but PROC reads −6 dB — already HOT.',
      'Raise it to +24 dB: PREAMP is only HOT (−6 dB), yet PROC clips and STATUS reads CLIP.',
      'Drop PREAMP to +0 dB: PREAMP sinks to −30 dB, TOO LOW; PROC and OUTPUT read −24 dB, right on the bottom edge of HEALTHY.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  lowhigh: {
    seeing: [
      'SOURCE (FIXED, −30 dB), PREAMP and OUTPUT, each gain setting under its column.',
      'Watch the grey hiss (the noise floor) rise from a meter’s foot once there is enough gain to show it. Every boost lifts it; a cut lowers it.',
      'Readouts: PREAMP and OUTPUT levels, NOISE (the noise floor at the output; amber when it intrudes) and STATUS — OK, LOW, HOT, CLIP or DIST (clipped earlier, baked in).',
    ],
    control: [
      'PREAMP fader (+0 to +40 dB, starts at +18 dB): gain early in the chain.',
      'OUTPUT fader (−20 to +26 dB, starts at +0 dB): gain late in the chain.',
      'SCENARIO key: TOO LOW EARLY, TOO HIGH EARLY or BALANCED sets both faders at once and says what each means. Move a fader afterwards and the key reads —.',
    ],
    changes: [
      'Too low early: the weak preamp signal sits near the hiss. Big late gain lifts signal and hiss together, so the gap lost early never comes back.',
      'Too high early: the preamp clips. OUTPUT down lowers the level, but STATUS reads DIST — the distortion stays.',
      'Balanced: a healthy level at both stages, headroom above, hiss far below.',
      'The note under the display judges the whole chain, not just the last meter.',
    ],
    teaches: [
      'There are two opposite ways to get gain staging wrong, and each one hurts differently.',
      'Late gain amplifies everything upstream — noise included.',
      'A healthy final meter does not prove a healthy chain.',
      'It follows Follow the Signal; next, Gain vs. Fader shows why a fader cannot undo clipping.',
    ],
    tryThis: [
      'Pick BALANCED: PREAMP and OUTPUT both read −12 dB, NOISE reads −34 dB and STATUS OK.',
      'Pick TOO LOW EARLY, then set OUTPUT to +16 dB: OUTPUT reads −12 dB as in BALANCED, but NOISE reads −30 dB (amber), not −34 dB. Same level, more hiss.',
      'Pick TOO HIGH EARLY: OUTPUT drops to −16 dB, yet STATUS reads DIST — the preamp clipped, and no later fader undoes it.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  fadervsgain: {
    seeing: [
      'SOURCE (FIXED, −30 dB), PREAMP, FADER and OUTPUT (FIXED, +0 dB).',
      'The first stage to hit 0 dB shows CLIP. A later stage at +0 dB gets a signal already at the ceiling, so it shows CLIP too; pull FADER down and it shows DIST — quieter, still damaged. Red arrows mark distortion.',
      'Readouts: PREAMP and OUTPUT levels, DIST (YES once the output carries distortion) and STATUS — the output’s state.',
    ],
    control: [
      'PREAMP fader (+0 to +40 dB, starts at +18 dB): the input gain.',
      'FADER fader (−30 to +10 dB, starts at +0 dB): the channel fader, after the preamp.',
      'OVERDRIVE key: PREAMP to +36 dB and FADER to +0 dB in one press. RESET: back to +18 dB and +0 dB.',
    ],
    changes: [
      'OVERDRIVE drives the preamp past 0 dB: it clips, and the cut-off peaks are now part of the waveform.',
      'Pulling FADER down lowers the level after the clip: OUTPUT gets quieter, DIST stays YES.',
      'Only lowering PREAMP stops the clip, because that is where it happens.',
      'Here every stage, the fader included, has its own ceiling; on a real desk a passive fader cannot clip by itself.',
    ],
    teaches: [
      'A fader sets LEVEL, not quality.',
      'Distortion created upstream cannot be removed by any control downstream.',
      'Clipping is fixed where it occurs — here, at the input gain.',
      'It closes the LEARN section; next, Multiple Gain Stages puts these ideas into a full channel strip.',
    ],
    tryThis: [
      'Press OVERDRIVE: PREAMP reads 0 dB, DIST reads YES and STATUS reads CLIP.',
      'Now pull FADER to −20 dB: OUTPUT falls to −20 dB, but DIST still reads YES and STATUS reads DIST.',
      'Lower PREAMP to +18 dB and bring FADER back to +0 dB (or press RESET): PREAMP and OUTPUT read −12 dB, DIST reads — and STATUS OK. Fixed where it happened.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  multistage: {
    seeing: [
      'A channel strip as seven columns: SOURCE (FIXED, a quiet mic at −30 dB), PREAMP, EQ, COMP, FADER, BUS and MASTER, each with its gain setting below.',
      'X-RAY OFF: each stage shows only a SIG light (lit once the level is above TOO LOW) and a CLIP light — often all a real stage shows from outside. X-RAY ON shows every meter.',
      'Readouts: MASTER, HEADROOM, X-RAY and BALANCE (✓ OK when every stage is healthy).',
    ],
    control: [
      'PREAMP fader (+0 to +40 dB, starts at +8 dB).',
      'PROCESS key: EQ GAIN and COMPRESSOR OUTPUT (each −12 to +12 dB). EQ GAIN here moves the whole signal; a real EQ band changes only its own frequencies.',
      'LEVELS key: CHANNEL FADER (−30 to +10 dB), BUS (−12 to +12 dB) and MASTER OUTPUT (−30 to +6 dB), plus TEST YOURSELF — RANDOM (scrambles every stage) and RESET.',
      'X-RAY key: see inside every stage at once.',
    ],
    changes: [
      'Each stage adds its gain to what it receives, so one weak or hot stage shifts every stage after it.',
      'It starts unbalanced: EQ GAIN is set to −6 dB, so EQ and COMP sit at −28 dB, TOO LOW, while MASTER looks fine.',
      'A stage that clips lights CLIP, and every stage after it carries the distortion.',
      'BALANCE turns ✓ OK only when every stage is healthy with no distortion.',
    ],
    teaches: [
      'Gain staging is a system: every control changes the level for everything after it.',
      'Real gear rarely has a meter at every point — SIG and CLIP lights are often all you get.',
      'A problem is fixed at the stage where it starts, not at the end.',
      'It applies the LEARN modules to a full chain; Free Practice and the Troubleshooting Challenge come next.',
    ],
    tryThis: [
      'With X-RAY OFF, look at the SIG lights: the SOURCE, EQ and COMP lights stay dark. Tap X-RAY: EQ and COMP read TOO LOW.',
      'Open PROCESS and set EQ GAIN to +0 dB: every stage turns healthy, MASTER reads −10 dB and BALANCE ✓ OK.',
      'Open LEVELS, tap TEST YOURSELF — RANDOM, then rebalance from the PREAMP forward until BALANCE reads ✓ OK.',
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  freeplay: {
    seeing: [
      'The same seven-column channel strip — SOURCE, PREAMP, EQ, COMP, FADER, BUS, MASTER — with X-RAY on, so every meter shows.',
      'This time the SOURCE is yours; its level shows under its column.',
      'Readouts: SOURCE, MASTER, X-RAY and STATUS — the MASTER’s state: OK, LOW, HOT, CLIP or DIST.',
    ],
    control: [
      'SOURCE fader (−40 to −2 dB, starts at −30 dB): a whisper at the bottom, a scream at the top.',
      'PREAMP fader (+0 to +40 dB, starts at +20 dB).',
      'PROCESS key: EQ GAIN and COMPRESSOR OUTPUT. LEVELS key: CHANNEL FADER, BUS, MASTER OUTPUT, TEST YOURSELF — RANDOM (the source and every stage) and RESET.',
      'X-RAY key: turn it OFF to work from the SIG and CLIP lights alone.',
    ],
    changes: [
      'It starts balanced: every stage after the SOURCE (−30 dB) reads −10 dB.',
      'A louder source needs less input gain, a quieter one more — one preamp setting cannot suit both.',
      'Clip any stage and every stage after it carries the distortion; lowering a later stage only lowers the level.',
      'Nothing is graded: the meters simply show what the chain is doing.',
    ],
    teaches: [
      'Input gain depends on the source: there is no single right setting.',
      'Recovering from a mistake means finding the stage where it started.',
      'Free Practice sits between the guided modules and the Troubleshooting Challenge: the same chain, with nothing hidden.',
    ],
    tryThis: [
      'Raise SOURCE to −10 dB: with PREAMP at +20 dB the preamp clips, and every stage after it shows CLIP.',
      'Now pull PREAMP to +0 dB: every stage reads −10 dB and STATUS reads OK — a loud source needs little gain.',
      'Turn X-RAY OFF, tap TEST YOURSELF — RANDOM and rebalance by the SIG and CLIP lights alone. Turn X-RAY back ON: any HOT stage the lights could not show is now visible.',
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  troubleshoot: {
    seeing: [
      'The seven-column strip, every stage hidden (?) except MASTER — and MASTER is clipping.',
      'One stage is set too hot. Every later stage at +0 dB sits on the ceiling and shows CLIP too. Here every stage, fader and bus too, has its own ceiling; a real passive fader cannot clip by itself.',
      'Readouts: MASTER, STATUS (the MASTER’s state), INSPECT (the stage you opened) and FOUND (✓ once you open the faulty stage).',
    ],
    control: [
      'Tap a hidden column (marked INSPECT) to open its meter, or use the INSPECT key: Source, Preamp, EQ, Compressor, Channel Fader or Bus. One stage opens at a time.',
      'Once FOUND reads ✓, the open stage’s fader appears in the dock (PREAMP, EQ, COMP, FADER, BUS or MASTER), and Master Output joins the INSPECT list.',
      'Fix the chain and a TRY AGAIN key appears for a new fault.',
    ],
    changes: [
      'Every stage upstream of the fault reads −10 dB (the Source itself is −30 dB). A stage that clips reads 0 dB with CLIP under its meter.',
      'The CLIP stage nearest the Source is the fault; the ones after it clip only because they inherit its level.',
      'Lower the faulty stage and the whole chain drops back to healthy: STATUS clears and a green frame lights the display.',
    ],
    teaches: [
      'Real systems seldom show a meter at every stage: a clipping output is often the only clue.',
      'Troubleshooting means checking one stage at a time for the FIRST place the problem appears.',
      'The fault is fixed where it starts, not at the output.',
      'The lab’s final module: it uses everything from LEARN and EXPLORE, and passing it credits the challenge.',
    ],
    tryThis: [
      'Search from either end: forward from the Preamp, or back from the Bus as the notes suggest. The fault is the CLIP stage nearest the Source; the rest only inherit it.',
      'Found it? Lower that stage until its meter leaves CLIP and sits in HEALTHY: STATUS turns OK and the green frame appears.',
      'Press TRY AGAIN: a new fault is picked at random, possibly the same stage — Preamp, EQ, Compressor, Channel Fader or Bus.',
    ],
  },
};
