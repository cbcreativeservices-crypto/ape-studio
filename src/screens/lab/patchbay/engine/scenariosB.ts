/**
 * Patchbay lab — Phase B exercise data (owner go 2026-09-10): the 8-pair
 * studio bay (§16), what's-wrong-with-this-patch (§20), design-your-own-bay
 * judgments (§25), and the final proficiency assessment (§26). Pure data.
 *
 * HONESTY WIRING, same contract as Phase A: every case that renders a pair
 * carries a machine-checkable `expected` claim asserted by
 * test/patchbayEngine.test.ts, and the one hard design rule (a processor's
 * own loop must be THRU) is machine-guarded there too. Wrong-answer feedback
 * points at evidence and never names the verdict.
 */
import type { BreakSide, NormalConfig, PairFlow, PairKind, PairState } from './patchbay';

/* ── the 8-pair studio bay (§16) ───────────────────────────────────────── */

export type StudioPair = {
  n: number;
  sourceLabel: string;
  destLabel: string;
  config: NormalConfig;
  breakSide?: BreakSide;
};

/** The teaching studio: pairs 01–06 are the common half-normal defaults;
 *  07–08 (the processors) are deliberately THRU — a processor's output must
 *  never be normalled toward its own input (§20 explains the feedback risk). */
export const STUDIO_PAIRS: StudioPair[] = [
  { n: 1, sourceLabel: 'CONSOLE OUT 1', destLabel: 'INTERFACE IN 1', config: 'half', breakSide: 'bottom' },
  { n: 2, sourceLabel: 'CONSOLE OUT 2', destLabel: 'INTERFACE IN 2', config: 'half', breakSide: 'bottom' },
  { n: 3, sourceLabel: 'MIC PRE 1 OUT', destLabel: 'CONSOLE LINE 1', config: 'half', breakSide: 'bottom' },
  { n: 4, sourceLabel: 'MIC PRE 2 OUT', destLabel: 'CONSOLE LINE 2', config: 'half', breakSide: 'bottom' },
  { n: 5, sourceLabel: 'INTERFACE OUT 1', destLabel: 'MONITOR CTRL L', config: 'half', breakSide: 'bottom' },
  { n: 6, sourceLabel: 'INTERFACE OUT 2', destLabel: 'MONITOR CTRL R', config: 'half', breakSide: 'bottom' },
  { n: 7, sourceLabel: 'COMPRESSOR OUT', destLabel: 'COMPRESSOR IN', config: 'thru' },
  { n: 8, sourceLabel: 'EQ OUT', destLabel: 'EQ IN', config: 'thru' },
];

/* ── what's wrong with this patch? (§20) ───────────────────────────────── */

export type WrongPatchCase = {
  id: string;
  title: string;
  situation: string;
  /** When present, the pair rendered above the question — and a machine-
   *  checkable claim about it that the test suite asserts. */
  render?: {
    state: PairState;
    sourceLabel: string;
    destLabel: string;
    expected: Partial<Pick<PairFlow, 'normalActive' | 'destinationHears' | 'normalBroken'>>;
  };
  question: string;
  options: string[];
  correct: number;
  explain: string;
  wrong: (string | undefined)[];
};

export const WRONG_PATCH_CASES: WrongPatchCase[] = [
  {
    id: 'w1-feedback',
    title: 'The re-wired compressor',
    situation:
      'A helpful tech re-wired pair 07 so COMPRESSOR OUT is FULL-NORMALLED to COMPRESSOR IN. No cables are patched anywhere.',
    render: {
      state: { config: 'full', topPlugged: false, bottomPlugged: false },
      sourceLabel: 'COMPRESSOR OUT',
      destLabel: 'COMPRESSOR IN',
      expected: { normalActive: true },
    },
    question: 'Look at the diagram. Why is this wiring dangerous?',
    options: [
      'Its output now feeds its own input by default',
      'Nothing is dangerous — no cables are patched',
      'The compressor will run out of headroom',
      'The normal will wear out the jack contacts',
    ],
    correct: 0,
    explain:
      'The normal connects the device’s output straight back to its own input with no cable in sight. That is why manufacturers warn against normalling a processor’s output to its own input — processor pairs are wired THRU.',
    wrong: [
      undefined,
      'That is exactly the trap: a NORMAL is a connection that exists with no cables. Read the green path in the diagram.',
      'Headroom isn’t the issue — trace where the output arrives.',
      'Contacts don’t wear from carrying a normal. Trace the path: where does the output arrive?',
    ],
  },
  {
    id: 'w2-direction',
    title: 'Nothing happens',
    situation:
      'An engineer patches a cord from the INTERFACE IN 1 front jack (bottom row) to the CONSOLE LINE 1 front jack (also bottom row) and waits for signal.',
    question: 'Why is there no signal anywhere?',
    options: [
      'Both jacks are destinations — no source feeds the cord',
      'The cord must be broken',
      'Bottom jacks only work with the top jack patched too',
      'The interface needs to be restarted',
    ],
    correct: 0,
    explain:
      'Patching runs SOURCE / OUTPUT → DESTINATION / INPUT. Two bottom-row jacks are two inputs: nothing in that cord is producing signal. Signal falls downhill — a patch must start at a top-row source.',
    wrong: [
      undefined,
      'The cord is fine. Check what KIND of jack each end is plugged into.',
      'A bottom jack accepts a source on its own — when the far end IS a source. What row is the far end in?',
      'No gear is misbehaving. Check the direction rule from page one.',
    ],
  },
  {
    id: 'w3-disappeared',
    title: 'Why did my signal disappear?',
    situation:
      'On a FULL-NORMAL bay, an engineer patches the TOP jack of a working pair out to a meter — expecting the original route to keep running underneath.',
    render: {
      state: { config: 'full', topPlugged: true, bottomPlugged: false },
      sourceLabel: 'CONSOLE OUT 1',
      destLabel: 'INTERFACE IN 1',
      expected: { destinationHears: 'nothing', normalBroken: true },
    },
    question: 'Diagnose it.',
    options: [
      'The top insertion broke the normal',
      'The meter is loading down the signal',
      'The patch cord is wired backwards',
      'The interface input failed',
    ],
    correct: 0,
    explain:
      'Full-normal breaks on EITHER insertion. The engineer expected half-normal tap behavior from a full-normal bay — the diagram shows the opened contact and the silent destination.',
    wrong: [
      undefined,
      'A meter is a high-impedance destination — it isn’t stealing the signal. What did the insertion do to the internal contact?',
      'Cords aren’t directional. The break happened inside the bay, not in the cable.',
      'The input is fine — nothing is arriving at it. Trace why.',
    ],
  },
  {
    id: 'w4-vanished',
    title: 'The vanished synth',
    situation:
      'The synth normally feeds MIXER INPUT 1 on a common half-normal pair. Someone patches a drum machine into the BOTTOM front jack. The synth is gone from the mix.',
    render: {
      state: { config: 'half', breakSide: 'bottom', topPlugged: false, bottomPlugged: true },
      sourceLabel: 'SYNTH OUT',
      destLabel: 'MIXER INPUT 1',
      expected: { destinationHears: 'patch', normalBroken: true },
    },
    question: 'What happened to the synth?',
    options: [
      'Its normal broke — the drum machine replaced it',
      'The drum machine and synth should be mixing together — something is faulty',
      'The synth’s top jack must also be patched somewhere',
      'Half-normal bays mute the top row while the bottom is patched',
    ],
    correct: 0,
    explain:
      'Half-normal keeps the top gentle, but the BOTTOM still breaks. The patched source takes over the destination; the original source keeps running — into an open contact.',
    wrong: [
      undefined,
      'The common bay doesn’t parallel two sources into one input — the bottom insertion physically opens the normal first.',
      'The top jack is empty; nothing routed the synth away. The change happened at the BOTTOM contact.',
      '“Mute” isn’t a patchbay concept — a specific contact opened. Which one?',
    ],
  },
];

/* ── design your own bay (§25) ─────────────────────────────────────────── */

export type DesignVerdict = { ok: boolean; note: string };

export type DesignRow = {
  id: string;
  pair: string;
  context: string;
  verdicts: Record<PairKind, DesignVerdict>;
};

/** Routing DESIGN judgments (not raw electronics): several rows accept more
 *  than one configuration with different tradeoffs — the notes explain the
 *  trade either way. The one hard rule (a processor's own loop must be THRU)
 *  is machine-guarded in the test suite. */
export const DESIGN_ROWS: DesignRow[] = [
  {
    id: 'g1',
    pair: 'CONSOLE DIRECT OUT 1 → INTERFACE INPUT 1',
    context: 'Your main recording path. Mid-take you often feed a tuner or analyzer.',
    verdicts: {
      half: { ok: true, note: 'The classic choice: recording runs by default, and the top jack taps a copy to the analyzer without interrupting a take.' },
      full: { ok: true, note: 'Workable — recording runs by default — but every tap now costs you the take. Half-normal would give you the split for free.' },
      thru: { ok: false, note: 'Your primary path would need a patch cord every single session. Default routes are what normals are for.' },
    },
  },
  {
    id: 'g2',
    pair: 'STEREO PLAYBACK L → MONITOR CONTROLLER L',
    context: 'Playback should reach the monitors with an empty bay; sometimes you meter it.',
    verdicts: {
      half: { ok: true, note: 'Playback runs by default and the top tap feeds meters without dropping the monitors.' },
      full: { ok: true, note: 'The default route works — just remember a top tap will silence your monitors on this bay.' },
      thru: { ok: false, note: 'Silent monitors until someone patches — the opposite of a sensible default.' },
    },
  },
  {
    id: 'g3',
    pair: 'COMPRESSOR OUT → COMPRESSOR IN',
    context: 'The insert pair for your outboard compressor.',
    verdicts: {
      half: { ok: false, note: 'Any normal here points the compressor’s output at its own input — a feedback loop with no cables patched. Processor pairs stay THRU.' },
      full: { ok: false, note: 'Any normal here points the compressor’s output at its own input — a feedback loop with no cables patched. Processor pairs stay THRU.' },
      thru: { ok: true, note: 'Exactly. The processor only ever joins a chain deliberately, by cable — never by default.' },
    },
  },
  {
    id: 'g4',
    pair: 'MIC PRE 1 OUT → CONSOLE LINE 1',
    context: 'The pre feeds the console daily; you occasionally borrow the pre for other destinations.',
    verdicts: {
      half: { ok: true, note: 'Daily route by default, and a top tap lends the pre’s signal elsewhere while the console keeps it.' },
      full: { ok: true, note: 'Works for the daily route; borrowing the pre via the top will interrupt the console — acceptable if that is your intent.' },
      thru: { ok: false, note: 'You’d re-patch the same daily route forever.' },
    },
  },
  {
    id: 'g5',
    pair: 'SPARE PAIR (future gear)',
    context: 'Nothing is connected to the rears yet.',
    verdicts: {
      half: { ok: false, note: 'A normal between two empty rears is a surprise waiting for whatever gets wired later. Keep spares neutral.' },
      full: { ok: false, note: 'A normal between two empty rears is a surprise waiting for whatever gets wired later. Keep spares neutral.' },
      thru: { ok: true, note: 'Neutral and predictable — the pair does nothing until future-you decides what it should do.' },
    },
  },
  {
    id: 'g6',
    pair: 'INTERFACE OUT 1 → MONITOR CTRL INPUT',
    context: 'Your mix bus must reach the monitor controller whenever the studio powers on.',
    verdicts: {
      half: { ok: true, note: 'Monitoring by default, plus a free top tap for a meter or a second feed.' },
      full: { ok: true, note: 'Monitoring by default; taps will cost you the monitors, which some rooms accept for simplicity.' },
      thru: { ok: false, note: 'No sound until someone patches the monitor path — a daily annoyance with no upside.' },
    },
  },
];

/* ── final proficiency assessment (§26) ────────────────────────────────── */

export type AssessmentItem = {
  id: string;
  eyebrow: string;
  question: string;
  options: string[];
  correct: number;
  explain: string;
  wrong: (string | undefined)[];
  /** Optional rendered pair + machine-checkable claim (test-enforced). */
  render?: {
    state: PairState;
    sourceLabel: string;
    destLabel: string;
    expected: Partial<Pick<PairFlow, 'normalActive' | 'destinationHears' | 'isSplit' | 'normalBroken'>>;
  };
};

export const ASSESSMENT_ITEMS: AssessmentItem[] = [
  {
    id: 'a1',
    eyebrow: 'IDENTIFY THE CONFIGURATION',
    question:
      'With no cables anywhere, a pair carries signal top → bottom. You patch the TOP; the destination keeps playing and your cable carries a copy. The configuration?',
    options: ['Full-normal', 'Half-normal (common bay)', 'Thru'],
    correct: 1,
    explain: 'A default path plus a non-breaking top tap is the half-normal signature.',
    wrong: [
      'A full-normal bay would have silenced the destination the moment the top plug seated.',
      undefined,
      'Thru has no default path — yet this pair carried signal with an empty bay.',
    ],
  },
  {
    id: 'a2',
    eyebrow: 'IDENTIFY THE CONFIGURATION',
    question:
      'A pair passes nothing with an empty bay, no matter what the source does. Patching top→bottom with one cord completes the route. The configuration?',
    options: ['Full-normal', 'Half-normal (common bay)', 'Thru'],
    correct: 2,
    explain: 'No default connection, cords make every route: thru.',
    wrong: [
      'Full-normal ships with its route connected — this pair shipped with silence.',
      'Half-normal also ships connected. This pair needed a cord for its FIRST route.',
      undefined,
    ],
  },
  {
    id: 'a3',
    eyebrow: 'PREDICT — TOP JACK',
    question: 'FULL-NORMAL pair, working route. You patch the TOP to a tuner. What does the destination receive?',
    options: ['Nothing at all', 'The source, unchanged', 'The tuner’s output'],
    correct: 0,
    explain: 'Either insertion on a full-normal pair opens the contact; the destination loses its feed.',
    wrong: [undefined, 'That is the HALF-normal tap. This bay breaks on top.', 'A tuner is a destination at the far end of your cord — it sends nothing back.'],
    render: {
      state: { config: 'full', topPlugged: true, bottomPlugged: false },
      sourceLabel: 'CONSOLE OUT 1',
      destLabel: 'INTERFACE IN 1',
      expected: { destinationHears: 'nothing', normalBroken: true },
    },
  },
  {
    id: 'a4',
    eyebrow: 'PREDICT — TOP JACK',
    question: 'HALF-NORMAL (common) pair, working route. You patch the TOP to a meter. What does the destination receive?',
    options: ['Nothing — the tap silenced it', 'The source — and the meter reads a copy', 'The meter’s output'],
    correct: 1,
    explain: 'The non-breaking top is the whole point: original route intact, meter fed in parallel.',
    wrong: ['That is full-normal behavior — the common half bay keeps the top gentle.', undefined, 'Meters read; they don’t feed.'],
    render: {
      state: { config: 'half', breakSide: 'bottom', topPlugged: true, bottomPlugged: false },
      sourceLabel: 'CONSOLE OUT 2',
      destLabel: 'INTERFACE IN 2',
      expected: { isSplit: true, destinationHears: 'normal' },
    },
  },
  {
    id: 'a5',
    eyebrow: 'PREDICT — BOTTOM JACK',
    question: 'HALF-NORMAL (common) pair. You patch a sampler into the BOTTOM front jack. What happens?',
    options: [
      'The sampler and the original source arrive mixed together',
      'The sampler replaces the original source at the destination',
      'Nothing — the bottom is only a tap',
    ],
    correct: 1,
    explain: 'The bottom is the breaking side: your patch takes over the destination; the original dead-ends.',
    wrong: [
      'The bottom contact opens BEFORE your signal lands — no parallel mix on the common bay.',
      undefined,
      'The TAP is the top jack’s trick. The bottom replaces.',
    ],
    render: {
      state: { config: 'half', breakSide: 'bottom', topPlugged: false, bottomPlugged: true },
      sourceLabel: 'MIC PRE 2 OUT',
      destLabel: 'CONSOLE LINE 2',
      expected: { destinationHears: 'patch', normalBroken: true },
    },
  },
  {
    id: 'a6',
    eyebrow: 'FIND THE BROKEN NORMAL',
    question:
      'Interface In 1 went silent mid-session. The bay is full-normal. One cord hangs from the TOP of pair 01 to an analyzer someone left connected. The fix?',
    options: [
      'Pull the forgotten top cord',
      'Replace the interface input',
      'Patch a second cord into the bottom',
      'Power-cycle the console',
    ],
    correct: 0,
    explain: 'The forgotten tap broke the normal on this full-normal bay. Remove it and the contact closes — the default route returns.',
    wrong: [
      undefined,
      'The input is healthy — it is receiving nothing. Look at the bay.',
      'That routes something NEW into the input; the question is why the DEFAULT died.',
      'No gear failed. A metal contact is being held open — by what?',
    ],
  },
  {
    id: 'a7',
    eyebrow: 'ROUTE WITHOUT INTERRUPTING',
    question:
      'You must feed a spectrum analyzer a copy of Console Out 1 WITHOUT touching the recording. On the studio bay (pair 01 is common half-normal), you…',
    options: [
      'Patch pair 01’s TOP front jack to the analyzer',
      'Patch pair 01’s BOTTOM front jack to the analyzer',
      'Re-plug the console output directly into the analyzer',
    ],
    correct: 0,
    explain: 'The half-normal top is a tap: recording continues, the analyzer gets its copy.',
    wrong: [
      undefined,
      'The bottom insertion BREAKS the normal — that kills the recording you were protecting.',
      'That removes the recording feed entirely — the patchbay exists so you never re-plug rears mid-session.',
    ],
  },
  {
    id: 'a8',
    eyebrow: 'REPLACE THE DEFAULT SOURCE',
    question:
      'The client wants the DRUM MACHINE — not the console — feeding Interface In 2 for one song. Fastest correct move on the common half-normal bay?',
    options: [
      'Patch the drum machine into pair 02’s BOTTOM front jack',
      'Patch the drum machine into pair 02’s TOP front jack',
      'Unscrew the rear connections and swap them',
    ],
    correct: 0,
    explain: 'The breaking bottom exists for exactly this: your patch replaces the normal source for as long as the cord stays in.',
    wrong: [
      undefined,
      'The TOP presents the console’s signal outward — it doesn’t accept a new source for the destination.',
      'Rear rewiring for a one-song change is what patch cords were invented to avoid.',
    ],
  },
  {
    id: 'a9',
    eyebrow: 'SPOT THE HAZARD',
    question: 'Which wiring choice creates a feedback loop with ZERO cables patched?',
    options: [
      'Normalling a compressor’s OUT to its own IN',
      'Wiring a compressor pair thru',
      'Half-normalling console out → interface in',
      'Leaving a spare pair thru',
    ],
    correct: 0,
    explain:
      'A normal is a connection that exists by default — output into own input is a loop armed the moment gain allows. Processor pairs stay thru.',
    wrong: [
      undefined,
      'Thru is the SAFE choice for a processor pair — no default connection at all.',
      'That is the ordinary recording default — no loop; the two devices are different boxes.',
      'A thru spare connects nothing. Nothing can loop.',
    ],
  },
  {
    id: 'a10',
    eyebrow: 'CHOOSE THE CONFIGURATION',
    question:
      'A broadcast room wants its air chain to survive an empty bay, but engineers must monitor the feed mid-air without ever interrupting it. The air-chain pairs should be…',
    options: ['Half-normal (common: top taps, bottom breaks)', 'Full-normal', 'Thru'],
    correct: 0,
    explain:
      'Default route + non-breaking taps is exactly the half-normal trade. (On an unfamiliar bay, still verify which side breaks before trusting it on air.)',
    wrong: [
      undefined,
      'Full-normal survives the empty bay, but the first monitoring tap takes you off the air.',
      'Thru dies the moment the bay is empty — no default route at all.',
    ],
  },
];
