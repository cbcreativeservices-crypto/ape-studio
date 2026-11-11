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
  intro: {
    learning: 'What gain staging means: a healthy level at every stage of a signal path, above the noise and below overload, and why early mistakes travel downstream.',
    start: 'Tap What Gain Staging Is to read what it covers, then tap OPEN. New to gain staging? Take the LEARN modules in order before EXPLORE and CHALLENGE.',
  },
  seeing: [
    'The strip on top, SOURCE › PREAMP › PROCESSING › FADER › OUTPUT, is the signal’s path. Each module shows part of the path, or a fuller version.',
    'LEARN shows how each stage feeds the next. EXPLORE adds a full channel strip with Signal X-Ray, plus Free Practice. CHALLENGE: find the stage that’s wrong.',
    'A ✓ marks a module you’ve done. RELATED opens the LEVELS & DECIBELS CALC, SIGNAL CHAIN BUILDER and SPL METER.',
  ],
  control: [
    'Tap a module’s name to read what it covers, then tap OPEN to start it.',
    'Inside a module, the chain fills the display, with live level readouts around its edge. Your faders sit in the dock at the bottom, and the notes scroll below.',
    'Use the strip under a module’s title to move between modules, and ‹ to leave the lab. SEE WHAT’S LEFT lists what you still have to do.',
    'Tap the ⓘ at the right of a module’s title whenever you want that screen explained.',
  ],
  changes: [
    'In the LEARN modules most stages are FIXED and you get one or two faders, so each cause shows on its own.',
    'Multiple Gain Stages opens a seven-column channel strip; Free Practice hands you the SOURCE as well.',
    'The Troubleshooting Challenge hides every meter except the MASTER, the way real gear often does.',
    'Every module follows one rule: a stage that hits its ceiling clips, and the distortion travels downstream.',
  ],
  teaches: [
    'Gain staging means a healthy level at every stage: high enough above the noise, low enough below overload.',
    'The first gain stage matters most, because noise and distortion made there travel downstream.',
    'A fader lowers the level, but it can’t remove clipping made before it.',
    'Levels here are on a relative scale where 0 dB means overload, not real units like dBu or dBFS.',
  ],
  tryThis: [
    'New to gain staging? Work through LEARN in order. Each module adds one stage or one idea.',
    'Start with What Gain Staging Is: move SOURCE and watch the level ripple from stage to stage.',
    'Finish with the Troubleshooting Challenge: only the MASTER is visible, and you find the stage that clips.',
  ],
};

/** The in-place what's-left screen (LabEndScreen) — home and last module. */
export const GAIN_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'A review of the lab’s core ideas: a healthy level at every stage, noise and clipping that travel downstream, and fixing a problem where it starts.',
    start: 'Tap any module still listed to open it. Tap REVIEW ▾ to see the ones you’ve finished, or PRACTICE AGAIN FROM THE START to begin again with What Gain Staging Is.',
  },
  seeing: [
    'WHAT’S LEFT lists the Gain Staging modules you haven’t finished yet, each with a › to jump straight in. Once nothing is left, the title reads LAB COMPLETE.',
    'Modules you’ve finished fold into one ✓ line; tap REVIEW ▾ to open them. Nothing on this screen is graded or timed.',
  ],
  control: [
    'Tap a row to open that module.',
    'PRACTICE AGAIN FROM THE START reopens What Gain Staging Is. Your finished modules stay finished.',
    'DONE · BACK TO LABS leaves this screen.',
  ],
  changes: [
    'Every module except the Troubleshooting Challenge counts as done as soon as you open it.',
    'The Troubleshooting Challenge counts only when you pass it: you find the fault and bring every stage back to healthy.',
  ],
  teaches: [
    'What a healthy level means at every stage of the chain.',
    'How hiss and clipping made early travel downstream, and what a later fader can and can’t change.',
    'Where in the chain a fault has to be fixed.',
  ],
  tryThis: [
    'Challenge still listed? Open the Troubleshooting Challenge and fix the chain.',
    'Finished everything? Go back to Free Practice, make a mistake on purpose, and trace it back to the stage where it started.',
  ],
};

export const GAIN_SCREEN_GUIDES: Record<GainModuleId, ScreenGuide> = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  intro: {
    intro: {
      learning: 'A signal passes through stages, and each stage has a healthy range: loud enough above the hiss, with headroom left below the 0 dB overload ceiling.',
      start: 'Raise SOURCE from −30 dB and watch PREAMP and OUTPUT climb with it. Stop when STATUS reads HOT, then keep going until it reads CLIP.',
    },
    seeing: [
      'Your signal runs left to right: SOURCE, PREAMP, OUTPUT. Meter colors: blue TOO LOW, green HEALTHY, red from −6 dB (HOT) to the 0 dB line (OVERLOAD).',
      'Gray at the foot of PREAMP and OUTPUT is hiss, the noise floor. The word under a meter names its zone; QUIET SOURCE is normal for a mic.',
      'PREAMP (+18 dB) and OUTPUT (+0 dB) are FIXED. Each readout is dB below the 0 dB ceiling; STATUS reads OK, HOT or CLIP.',
    ],
    control: [
      'SOURCE fader (−40 to −6 dB, starts at −30 dB): how loud the signal reaching the preamp is, from a quiet mic at the bottom to a loud source at the top.',
      'It’s the only fader here, so every change you see starts at the source.',
      'Tap a meter to clear its peak line, the thin light mark at the highest level it reached.',
      'FULL SCREEN enlarges the chain; HIDE DISPLAY gives the notes and the check question the whole screen.',
    ],
    changes: [
      'Each stage adds its gain to the level it’s handed: −30 dB in, plus 18 dB of preamp gain, gives −12 dB out.',
      'Raise SOURCE and every later meter rises with it, left to right.',
      'A stage that reaches 0 dB clips. It can’t go higher, so the peaks are cut off: distortion. CLIP shows under it.',
      'Lower SOURCE and the stages sink toward the blue zone, closer to the hiss.',
    ],
    teaches: [
      'A signal is a path through stages, and each stage has a healthy operating range.',
      'Healthy means two margins at once: enough level above the noise, and enough headroom (the dB left below 0) under overload.',
      'Gain staging is not a race to be loud: too hot clips, too quiet sinks toward the hiss.',
    ],
    tryThis: [
      'Raise SOURCE to −24 dB: PREAMP reads −6 dB and STATUS turns HOT. Only 6 dB of headroom is left.',
      'Raise SOURCE to −18 dB: PREAMP hits 0 dB and STATUS reads CLIP. The FIXED preamp is forced into overload.',
      'Drop SOURCE to −40 dB: PREAMP falls to −22 dB, near the bottom of the healthy band.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  input: {
    intro: {
      learning: 'Input gain is the first level decision in a chain: the preamp lifts a quiet source above the hiss, and headroom shrinks as the gain rises.',
      start: 'Slide INPUT GAIN up from +0 dB and watch PREAMP leave the blue zone. Keep going until HEADROOM reads 6 dB, then 0 dB, and read STATUS each time.',
    },
    seeing: [
      'The same chain, but now the SOURCE is FIXED, a quiet mic at −30 dB, and so is OUTPUT (+0 dB). The preamp is yours.',
      'Your gain setting shows under PREAMP. Blue is TOO LOW, green HEALTHY, red HOT (from −6 dB). Raise INPUT GAIN and gray hiss appears at the meter foot.',
      'Readouts: PREAMP (its level), HEADROOM (dB left below the 0 dB ceiling), OUTPUT, and STATUS, the preamp’s state: LOW, OK, HOT or CLIP.',
    ],
    control: [
      'INPUT GAIN fader (+0 to +40 dB, starts at +0 dB): how much the preamp lifts the quiet source.',
      'It’s the only control here. The box in the notes tells you how the preamp is doing: too low, healthy, hot or clipping.',
      'FULL SCREEN enlarges the chain; HIDE DISPLAY gives the notes the whole screen.',
    ],
    changes: [
      'PREAMP = source + input gain: at +18 dB, −30 + 18 = −12 dB. HEADROOM shrinks as gain rises.',
      'Too little gain leaves the signal in the blue zone, a small gap above the hiss. Too much hits 0 dB: the waveform is clipped flat and HEADROOM reads 0 dB.',
      'Hiss rises with gain: slowly at first, while the preamp’s own hiss is louder than the source’s, then 1 dB per dB of gain. No gain removes the source’s own hiss.',
    ],
    teaches: [
      'Input gain is the first, and most important, gain decision in the chain.',
      'The target is a level, not a magic number: strong, clean, with headroom to spare.',
      'Headroom is the space between the level and the overload ceiling; a loud note needs some of it.',
    ],
    tryThis: [
      'Slide INPUT GAIN to +6 dB: PREAMP reads −24 dB, the bottom edge of healthy, and STATUS turns OK.',
      'Push it to +24 dB: PREAMP reads −6 dB, HEADROOM 6 dB, STATUS HOT. It’s usable, but there’s little room for a loud note.',
      'Push it to +30 dB: HEADROOM reads 0 dB and STATUS CLIP. The preamp has run out of room.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  follow: {
    intro: {
      learning: 'Each stage’s output is the next stage’s input, so the preamp setting decides how much room every later stage has, and clipping anywhere rides on to the output.',
      start: 'Raise PREAMP from +6 dB to +18 dB and compare the PREAMP and PROC readouts. Then try +24 dB and see which stage reaches CLIP first.',
    },
    seeing: [
      'Four stages: SOURCE (FIXED, a quiet mic at −30 dB), PREAMP (yours), PROC (a FIXED processor adding +6 dB) and OUTPUT (FIXED, +0 dB).',
      'Watch the arrows between stages: they turn red once the signal is distorted. Meters run blue TOO LOW, green HEALTHY, red from −6 dB; gray hiss shows once there’s enough gain.',
      'Readouts: PREAMP, PROC and OUTPUT levels, and STATUS, which reports the output’s state.',
    ],
    control: [
      'PREAMP fader (+0 to +40 dB, starts at +6 dB): the only control on this screen, so every change downstream comes from it.',
      'FULL SCREEN enlarges the chain; HIDE DISPLAY gives the notes and the check question the whole screen.',
    ],
    changes: [
      'Each stage starts from the level the one before hands it: PROC adds its 6 dB to whatever PREAMP sends.',
      'A weak preamp leaves later stages near the hiss: at +0 dB, PROC and OUTPUT only just reach HEALTHY’s bottom edge.',
      'A hot preamp leaves no room for PROC’s +6 dB: PROC reaches 0 dB and clips, even though the preamp hasn’t.',
      'Once a stage clips, the distortion is part of the signal and rides on to the OUTPUT.',
    ],
    teaches: [
      'A chain is a sequence: each stage’s output is the next stage’s input.',
      'An early mistake can’t be rescued downstream; it has to be fixed where it happens.',
      'Headroom at one stage must leave room for the gain of the stages after it.',
    ],
    tryThis: [
      'Raise PREAMP to +18 dB: PREAMP reads −12 dB (healthy), but PROC already reads −6 dB, HOT.',
      'Raise it to +24 dB: PREAMP is only HOT (−6 dB), yet PROC clips and STATUS reads CLIP.',
      'Drop PREAMP to +0 dB: PREAMP sinks to −30 dB, TOO LOW; PROC and OUTPUT read −24 dB, right on HEALTHY’s bottom edge.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  lowhigh: {
    intro: {
      learning: 'Gain staging goes wrong in two opposite ways: too low early leaves the signal close to the hiss, too high early clips it, and later gain fixes neither.',
      start: 'Tap SCENARIO and pick BALANCED, and note the NOISE readout. Then pick TOO LOW EARLY and TOO HIGH EARLY, and compare NOISE and STATUS with BALANCED.',
    },
    seeing: [
      'Three columns: SOURCE (FIXED, −30 dB), PREAMP and OUTPUT, with each gain setting under its column.',
      'Watch the gray hiss, the noise floor, rise from a meter’s foot once there’s enough gain to show it. Every boost lifts it; a cut lowers it.',
      'Readouts: PREAMP and OUTPUT levels, NOISE (the noise floor at the output; amber when it intrudes) and STATUS: OK, LOW, HOT, CLIP or DIST (clipped earlier, baked in).',
    ],
    control: [
      'PREAMP fader (+0 to +40 dB, starts at +18 dB): gain early in the chain.',
      'OUTPUT fader (−20 to +26 dB, starts at +0 dB): gain late in the chain.',
      'SCENARIO key: TOO LOW EARLY, TOO HIGH EARLY or BALANCED sets both faders at once and explains what each means. Move a fader afterwards and the key reads —.',
    ],
    changes: [
      'Too low early: the weak preamp signal sits near the hiss. Big late gain lifts signal and hiss together, so the gap lost early never comes back.',
      'Too high early: the preamp clips. Turning OUTPUT down lowers the level, but STATUS reads DIST: the distortion stays.',
      'Balanced: a healthy level at both stages, headroom above, hiss far below.',
      'The note under the display judges the whole chain, not just the last meter.',
    ],
    teaches: [
      'There are two opposite ways to get gain staging wrong, and each hurts differently: hiss when too low, distortion when too high.',
      'Late gain amplifies everything upstream, noise included.',
      'A healthy final meter doesn’t prove a healthy chain.',
    ],
    tryThis: [
      'Pick BALANCED: PREAMP and OUTPUT both read −12 dB, NOISE reads −34 dB and STATUS OK.',
      'Pick TOO LOW EARLY, then set OUTPUT to +16 dB: OUTPUT reads −12 dB as in BALANCED, but NOISE reads −30 dB (amber), not −34 dB. Same level, more hiss.',
      'Pick TOO HIGH EARLY: OUTPUT drops to −16 dB, yet STATUS reads DIST. The preamp clipped, and no later fader undoes it.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  fadervsgain: {
    intro: {
      learning: 'A fader sets level, not quality: once the preamp clips, pulling a later fader down only makes the distortion quieter. Clipping is fixed where it happens.',
      start: 'Press OVERDRIVE and watch DIST turn YES. Pull FADER down to −20 dB and check whether DIST clears. Then lower PREAMP and compare.',
    },
    seeing: [
      'Four stages: SOURCE (FIXED, −30 dB), PREAMP, FADER and OUTPUT (FIXED, +0 dB).',
      'The first stage to hit 0 dB shows CLIP. A later stage at +0 dB is handed a signal already at the ceiling, so it shows CLIP too. Pull FADER down and it shows DIST: quieter, still damaged.',
      'Red arrows mark distortion. Readouts: PREAMP and OUTPUT levels, DIST (YES once the output carries distortion) and STATUS, the output’s state.',
    ],
    control: [
      'PREAMP fader (+0 to +40 dB, starts at +18 dB): the input gain.',
      'FADER fader (−30 to +10 dB, starts at +0 dB): the channel fader, after the preamp.',
      'OVERDRIVE key: sets PREAMP to +36 dB and FADER to +0 dB in one press. RESET: back to +18 dB and +0 dB.',
    ],
    changes: [
      'OVERDRIVE drives the preamp past 0 dB: it clips, and the cut-off peaks are now part of the waveform.',
      'Pulling FADER down lowers the level after the clip: OUTPUT gets quieter, but DIST stays YES.',
      'Only lowering PREAMP stops the clip, because that’s where it happens.',
      'Here every stage, the fader included, has its own ceiling; on a real mixing console a passive fader can’t clip by itself.',
    ],
    teaches: [
      'A fader sets LEVEL, not quality.',
      'Distortion created upstream can’t be removed by any control downstream.',
      'Clipping is fixed where it occurs, which here means at the input gain.',
    ],
    tryThis: [
      'Press OVERDRIVE: PREAMP reads 0 dB, DIST reads YES and STATUS reads CLIP.',
      'Now pull FADER to −20 dB: OUTPUT falls to −20 dB, but DIST still reads YES and STATUS reads DIST.',
      'Lower PREAMP to +18 dB and bring FADER back to +0 dB (or press RESET): PREAMP and OUTPUT read −12 dB, DIST reads — and STATUS OK. Fixed where it happened.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  multistage: {
    intro: {
      learning: 'A whole channel strip is one system: each stage’s gain shifts every stage after it, and a MASTER that looks fine can hide a weak or clipping stage upstream.',
      start: 'With X-RAY OFF, find the SIG lights that stay dark. Tap X-RAY to see every meter, then open PROCESS and set EQ GAIN to +0 dB.',
    },
    seeing: [
      'A channel strip as seven columns: SOURCE (FIXED, a quiet mic at −30 dB), PREAMP, EQ, COMP, FADER, BUS and MASTER, each with its gain setting below.',
      'With X-RAY OFF, each stage shows only a SIG light (lit above TOO LOW) and a CLIP light, which is often all real gear shows you from the outside. X-RAY ON shows every meter.',
      'Readouts: MASTER, HEADROOM, X-RAY and BALANCE (✓ OK when every stage is healthy).',
    ],
    control: [
      'PREAMP fader (+0 to +40 dB, starts at +8 dB).',
      'PROCESS key: EQ GAIN and COMPRESSOR OUTPUT (each −12 to +12 dB). EQ GAIN here moves the whole signal; a real EQ band changes only its own frequencies.',
      'LEVELS key: CHANNEL FADER (−30 to +10 dB), BUS (−12 to +12 dB) and MASTER OUTPUT (−30 to +6 dB), plus TEST YOURSELF — RANDOM, which scrambles every stage, and RESET.',
      'X-RAY key: see inside every stage at once.',
    ],
    changes: [
      'Each stage adds its gain to what it receives, so one weak or hot stage shifts every stage after it.',
      'You start unbalanced: EQ GAIN is at −6 dB, so EQ and COMP sit at −28 dB, TOO LOW, while MASTER looks fine.',
      'A stage that clips lights CLIP, and every stage after it carries the distortion.',
      'BALANCE turns ✓ OK only when every stage is healthy, with no distortion.',
    ],
    teaches: [
      'Gain staging is a system: every control changes the level for everything after it.',
      'Real gear rarely has a meter at every point; SIG and CLIP lights are often all you get.',
      'A problem is fixed at the stage where it starts, not at the end.',
    ],
    tryThis: [
      'With X-RAY OFF, look at the SIG lights: the SOURCE, EQ and COMP lights stay dark. Tap X-RAY: EQ and COMP read TOO LOW.',
      'Open PROCESS and set EQ GAIN to +0 dB: every stage after the SOURCE turns healthy, MASTER reads −10 dB and BALANCE reads ✓ OK.',
      'Open LEVELS, tap TEST YOURSELF — RANDOM, then rebalance from the PREAMP forward until BALANCE reads ✓ OK.',
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  freeplay: {
    intro: {
      learning: 'There is no single right input gain: the right setting depends on how loud the source is, and you recover from a mistake at the stage where it started.',
      start: 'Raise SOURCE to −10 dB and watch the PREAMP clip. Then pull PREAMP down until every stage is healthy again and STATUS reads OK.',
    },
    seeing: [
      'The same seven-column channel strip, SOURCE, PREAMP, EQ, COMP, FADER, BUS, MASTER, with X-RAY on, so every meter shows.',
      'This time the SOURCE is yours too; its level shows under its column.',
      'Readouts: SOURCE, MASTER, X-RAY and STATUS, the MASTER’s state: OK, LOW, HOT, CLIP or DIST.',
    ],
    control: [
      'SOURCE fader (−40 to −2 dB, starts at −30 dB): a whisper at the bottom, a scream at the top.',
      'PREAMP fader (+0 to +40 dB, starts at +20 dB).',
      'PROCESS key: EQ GAIN and COMPRESSOR OUTPUT. LEVELS key: CHANNEL FADER, BUS, MASTER OUTPUT, TEST YOURSELF — RANDOM (scrambles the source and every stage) and RESET.',
      'X-RAY key: turn it OFF to work from the SIG and CLIP lights alone.',
    ],
    changes: [
      'You start balanced: every stage after the SOURCE (−30 dB) reads −10 dB.',
      'A louder source needs less input gain, a quieter one more; one preamp setting can’t suit both.',
      'Clip any stage and every stage after it carries the distortion; lowering a later stage only lowers the level.',
      'Nothing is graded here: the meters simply show what the chain is doing.',
    ],
    teaches: [
      'Input gain depends on the source: there is no single right setting.',
      'A whisper and a scream need very different preamp gain to reach the same healthy level.',
      'Recovering from a mistake means finding the stage where it started.',
    ],
    tryThis: [
      'Raise SOURCE to −10 dB: with PREAMP at +20 dB the preamp clips, and every stage after it shows CLIP.',
      'Now pull PREAMP to +0 dB: every stage reads −10 dB and STATUS reads OK. A loud source needs little gain.',
      'Turn X-RAY OFF, tap TEST YOURSELF — RANDOM and rebalance by the SIG and CLIP lights alone. Turn X-RAY back ON: any HOT stage the lights could not show is now visible.',
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  troubleshoot: {
    intro: {
      learning: 'Real systems rarely show a meter at every stage, so you find a fault by checking one stage at a time for the first place clipping appears.',
      start: 'Tap a hidden column marked INSPECT, starting with Preamp, and read its meter. Work stage by stage until FOUND reads ✓, then lower that stage’s fader.',
    },
    seeing: [
      'The seven-column strip, every stage hidden (?) except MASTER, and MASTER is clipping.',
      'One stage is set too hot. Every later stage at +0 dB sits on the ceiling and shows CLIP too. Here the fader and bus have their own ceilings; a real passive fader can’t clip by itself.',
      'Readouts: MASTER, STATUS (the MASTER’s state), INSPECT (the stage you opened) and FOUND (✓ once you open the faulty stage).',
    ],
    control: [
      'Tap a hidden column (marked INSPECT) to open its meter, or use the INSPECT key: Source, Preamp, EQ, Compressor, Channel Fader or Bus. One stage opens at a time.',
      'Once FOUND reads ✓, the open stage’s fader appears in the dock (PREAMP, EQ, COMP, FADER, BUS or MASTER), and Master Output joins the INSPECT list.',
      'Fix the chain and a TRY AGAIN key appears with a new fault.',
    ],
    changes: [
      'Every stage before the fault reads −10 dB (the Source itself is −30 dB). A stage that clips reads 0 dB with CLIP under its meter.',
      'The CLIP stage nearest the Source is the fault; the ones after it clip only because they inherit its level.',
      'Lower the faulty stage and the whole chain drops back to healthy: STATUS clears and a green frame lights the display.',
    ],
    teaches: [
      'Real systems seldom show a meter at every stage; a clipping output is often the only clue.',
      'Troubleshooting means checking one stage at a time for the FIRST place the problem appears.',
      'The fault is fixed where it starts, not at the output.',
    ],
    tryThis: [
      'Search from either end: forward from the Preamp, or back from the Bus as the notes suggest. The fault is the CLIP stage nearest the Source; the rest only inherit it.',
      'Found it? Lower that stage until its meter leaves CLIP and sits in HEALTHY: STATUS turns OK and the green frame appears.',
      'Press TRY AGAIN for a new fault, picked at random from Preamp, EQ, Compressor, Channel Fader or Bus. It may be the same stage again.',
    ],
  },
};
