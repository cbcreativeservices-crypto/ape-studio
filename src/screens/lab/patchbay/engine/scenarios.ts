/**
 * Patchbay lab — Phase A exercise data (spec §14 predict-before-patching and
 * §15 detective mode). Pure data, no React.
 *
 * HONESTY WIRING: every predict scenario carries a machine-checkable
 * `expected` claim about the post-action PairFlow, and every detective case
 * carries its probe list; test/patchbayEngine.test.ts resolves each one
 * through the engine and asserts (a) the expected facts hold and (b) each
 * detective case narrows to exactly its answer. Authored prose can be edited
 * freely — the facts underneath cannot silently rot.
 */
import type { DetectiveTest, PairFlow, PairKind, PairState } from './patchbay';

/* ── predict before patching (§14) ─────────────────────────────────────── */

export type PredictScenario = {
  id: string;
  /** Bay configuration as told to the student. */
  state: Omit<PairState, 'topPlugged' | 'bottomPlugged'>;
  sourceLabel: string;
  destLabel: string;
  /** The action the question poses. */
  action: 'plugTop' | 'plugBottom';
  question: string;
  options: string[];
  correct: number;
  explain: string;
  wrong: (string | undefined)[];
  /** Machine-checkable facts about the flow AFTER the action. */
  expected: Partial<Pick<PairFlow, 'destinationHears' | 'isSplit' | 'topFeedsPatch' | 'normalBroken' | 'normalActive'>>;
};

export function afterAction(s: PredictScenario): PairState {
  return {
    ...s.state,
    topPlugged: s.action === 'plugTop',
    bottomPlugged: s.action === 'plugBottom',
  };
}

export const PREDICT_SCENARIOS: PredictScenario[] = [
  {
    id: 'p1-half-top',
    state: { config: 'half', breakSide: 'bottom' },
    sourceLabel: 'CONSOLE DIRECT OUT 1',
    destLabel: 'INTERFACE INPUT 1',
    action: 'plugTop',
    question:
      'This pair is HALF-NORMALLED (common bay). Console Direct Out 1 is recording into Interface Input 1. You plug a cable into the TOP front jack. What happens?',
    options: [
      'Interface Input 1 goes silent',
      'The signal goes only into the patch cable',
      'The signal continues to Interface Input 1 AND appears at the patch cable',
      'Nothing happens',
    ],
    correct: 2,
    explain:
      'On a half-normal bay the top insertion does NOT break the normal — the top jack becomes a tap. The recording continues, and the cable carries a copy.',
    wrong: [
      'That would be FULL-normal behavior. On the common half-normal bay, a top insertion leaves the normal intact.',
      'The top jack does present the source to the cable — but the internal normal is still closed, so the original path keeps flowing too.',
      undefined,
      'Something did happen: the source now also appears at the far end of your cable.',
    ],
    expected: { isSplit: true, destinationHears: 'normal', topFeedsPatch: true, normalBroken: false },
  },
  {
    id: 'p2-full-top',
    state: { config: 'full' },
    sourceLabel: 'MIC PRE 1 OUT',
    destLabel: 'CONSOLE LINE 1',
    action: 'plugTop',
    question:
      'This pair is FULL-NORMALLED. Mic Pre 1 normally feeds Console Line 1. You plug a cable into the TOP front jack. What happens?',
    options: [
      'Console Line 1 goes silent — the pre now feeds only the cable',
      'The pre feeds both the console and the cable',
      'Nothing changes until you also patch the bottom',
      'The console now hears the cable instead of the pre',
    ],
    correct: 0,
    explain:
      'Full-normal: inserting into EITHER front jack opens the switching contact. The normal is broken, the console loses the pre, and the cable carries it away.',
    wrong: [
      undefined,
      'Feeding both is the HALF-normal tap. A full-normal bay breaks the normal on a top insertion.',
      'A full-normal contact opens the moment either plug seats — the break has already happened.',
      'The bottom jack is what feeds the console from a cable. Nothing was plugged there.',
    ],
    expected: { destinationHears: 'nothing', topFeedsPatch: true, normalBroken: true },
  },
  {
    id: 'p3-half-bottom',
    state: { config: 'half', breakSide: 'bottom' },
    sourceLabel: 'SYNTH OUT',
    destLabel: 'MIXER INPUT 1',
    action: 'plugBottom',
    question:
      'Same HALF-NORMALLED bay. The synth normally feeds Mixer Input 1. You patch a DRUM MACHINE into the BOTTOM front jack. What does the mixer hear now?',
    options: [
      'The synth and the drum machine mixed together',
      'Only the drum machine — the synth’s normal was broken and replaced',
      'Only the synth — the bottom jack is just a tap',
      'Nothing — the pair went silent',
    ],
    correct: 1,
    explain:
      'Half-normal breaks on the BOTTOM. The insertion opens the normal and the patched drum machine takes over the destination; the synth now dead-ends at its jack.',
    wrong: [
      'Parallel mixing is not what the common bay does — the bottom insertion physically opens the normal contact first.',
      undefined,
      'The TAP is the top jack’s trick. The bottom is the breaking side on the common half-normal bay.',
      'The destination isn’t silent — your patched source is feeding it.',
    ],
    expected: { destinationHears: 'patch', normalBroken: true },
  },
  {
    id: 'p4-thru-none',
    state: { config: 'thru' },
    sourceLabel: 'INTERFACE OUT 2',
    destLabel: 'COMPRESSOR IN',
    action: 'plugTop',
    question:
      'This pair is wired THRU. No cables are in the BOTTOM jack; you plug the TOP jack out to a meter. What is the compressor receiving?',
    options: [
      'The interface signal, through the internal normal',
      'The interface signal, but quieter',
      'Nothing — a thru pair has no internal path, and nothing is patched into the bottom',
      'The meter’s output',
    ],
    correct: 2,
    explain:
      'Thru means NO internal vertical connection exists — with the bottom jack empty, nothing reaches the compressor no matter what the top jack does.',
    wrong: [
      'There is no internal normal on a thru pair — that is exactly what "thru" means.',
      'Level isn’t the issue: there is no path at all from top to bottom inside a thru pair.',
      undefined,
      'A meter is a destination — it doesn’t send signal back down your patch cable.',
    ],
    expected: { destinationHears: 'nothing', topFeedsPatch: true, normalBroken: false, normalActive: false },
  },
];

/* ── patchbay detective (§15) ──────────────────────────────────────────── */

export type DetectiveCase = {
  id: string;
  intro: string;
  /** Each probe: what was patched and what was observed, with its prose. */
  probes: { prose: string; test: DetectiveTest }[];
  question: string;
  answer: PairKind;
  explain: string;
  /** Per-accusation feedback indexed [full, half, thru] — cites the probe that
   *  contradicts the accusation WITHOUT naming the verdict (cognition pass
   *  2026-09-10: without these, a wrong guess printed the full explanation and
   *  turned deduction into dictation). undefined at the answer's index. */
  wrong: (string | undefined)[];
};

export const DETECTIVE_CASES: DetectiveCase[] = [
  {
    id: 'd1-half',
    intro: 'An unlabeled pair: KEYBOARD on top, MIXER INPUT 5 on the bottom.',
    probes: [
      {
        prose: 'Test 1 — no patch cables anywhere: the keyboard reaches Mixer Input 5.',
        test: { topPlugged: false, bottomPlugged: false, destinationHears: 'normal' },
      },
      {
        prose: 'Test 2 — you patch the TOP jack to an analyzer: the analyzer shows the keyboard, and the mixer STILL hears it.',
        test: { topPlugged: true, bottomPlugged: false, destinationHears: 'normal', sourceAtPatch: true },
      },
    ],
    question: 'What configuration must this pair be using?',
    answer: 'half',
    explain:
      'A default path existed (rules out thru), and a top insertion did not break it (rules out full-normal). Only half-normal taps the top while the normal keeps flowing.',
    wrong: [
      'Check Test 2 against that configuration’s rule: what would a TOP insertion have done to the mixer’s feed?',
      undefined,
      'Test 1 already rules that out — with NO cables anywhere, the keyboard still reached the mixer. Which configurations even have a default path?',
    ],
  },
  {
    id: 'd2-thru',
    intro: 'Another pair: DRUM MACHINE on top, MONITOR CONTROLLER L on the bottom.',
    probes: [
      {
        prose: 'Test 1 — no patch cables: the monitor hears NOTHING from the drum machine.',
        test: { topPlugged: false, bottomPlugged: false, destinationHears: 'nothing' },
      },
      {
        prose: 'Test 2 — you patch the TOP jack to a meter: the meter shows the drum machine.',
        test: { topPlugged: true, bottomPlugged: false, sourceAtPatch: true },
      },
    ],
    question: 'What configuration is this pair?',
    answer: 'thru',
    explain:
      'The source is alive (the meter proves it), yet with no cables the destination hears nothing — there is no default connection. That is a thru pair: every route must be patched.',
    wrong: [
      'That configuration ships with a default route. Re-read Test 1: what did the monitor hear with no cables in?',
      'That configuration also ships with a default route. Test 1 says the monitor heard nothing with the bay untouched — square that with a normal.',
      undefined,
    ],
  },
  {
    id: 'd3-full',
    intro: 'A third pair: PLAYBACK L on top, CONSOLE LINE 7 on the bottom.',
    probes: [
      {
        prose: 'Test 1 — no patch cables: Console Line 7 hears the playback.',
        test: { topPlugged: false, bottomPlugged: false, destinationHears: 'normal' },
      },
      {
        prose: 'Test 2 — you patch the TOP jack to a tuner: the tuner shows playback, but Console Line 7 has gone SILENT.',
        test: { topPlugged: true, bottomPlugged: false, destinationHears: 'nothing', sourceAtPatch: true },
      },
    ],
    question: 'What configuration is this pair?',
    answer: 'full',
    explain:
      'A default path existed, and the TOP insertion broke it. That is the full-normal signature — either front jack opens the normal.',
    wrong: [
      undefined,
      'Think back to your own tap experiment: on that configuration, what happens to the destination when you patch the TOP? Compare with Test 2.',
      'Test 1 rules that out — Console Line 7 heard the playback with no cables anywhere. Which configurations provide a route by default?',
    ],
  },
];
