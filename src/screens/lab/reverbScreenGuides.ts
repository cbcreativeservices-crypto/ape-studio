/**
 * Reverb Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen (FxLabScreen + fxLabConfigs reverbConfig)
 * with three tabs, so the guides are keyed by the shell's tab id:
 *   explore — the Rack Unit: the animated decay on the glass (fxAnim
 *             ReverbFlow: IN ▸ · the green REVERB stage · ▸ OUT as a
 *             triggered sweep in a dB view over a seconds ruler), the RT60 /
 *             PRE / MIX readouts, the RT60 fader and the PRE-DLY / DAMP /
 *             MIX / SOURCE keys, the header ▶, LAB NOTES;
 *   learn   — the reading page (the guided lesson in full, content.ts reverb);
 *   check   — the end-of-lab understanding check (understandingChecks REVERB,
 *             four questions; passing completes the lab).
 *
 * Every name is the on-screen name in fxLabConfigs.tsx (reverbConfig),
 * FxLabScreen.tsx, fxAnim.tsx (ReverbFlow), fxViz.tsx (DecayCurveGraph),
 * RackUnit / BezelReadouts and LabUnderstandingCheck. Every number in TRY
 * THIS is what the screen draws at that setting, worked out from the code
 * and re-run by test/screenGuide_reverb_20261031.test.ts (ReverbFlow's
 * revCol, the lab defaults PRE 20 ms · MIX 35% · DAMP NATURAL 5.5k, the
 * CLICK 60 source = a 5 ms 1 kHz ping once a second):
 *   - the OUT panel spans 90 dB, its floor 90 dB under the source peak; the
 *     wash starts PRE + 31 ms after the click (the shortest of the reverb's
 *     four loops, 1499 samples at 48 kHz) and falls at 60 ÷ RT60 dB/s plus
 *     what the in-loop damping takes from a 1 kHz ping on each ~45 ms trip
 *     (NATURAL 5.5k ≈ 3 dB/s, DARK 2k ≈ 21.5 dB/s);
 *   - RT60 0.40 s → the wash reaches the floor ≈ 0.5 s after the click;
 *     RT60 6.0 s → about 13 dB/s, still ~50 dB above the floor when the
 *     next click arrives (the tails pile up);
 *   - PRE-DLY 60 ms → the new wash jumps up 91 ms after the click (nearly one
 *     100 ms tick); 0 ms → 31 ms (earlier tails may still ring under it);
 *   - RT60 ≈ 1.5 s with DARK 2k → ~8 dB above the floor at the 1 s mark
 *     (NATURAL: ~24 dB); DESIGNED RESPONSE ignores damping (it draws RT60);
 *   - DESIGNED RESPONSE's marker: a dot on the dashed −60 line, its label
 *     "RT60 {fmt2sig(rt60)} s" (two decimals below 1 s, as the fader and bezel) on the time axis below it. The axis is a
 *     FIXED 7.5 s (fxViz DECAY_SPAN_S, D41 fix 2026-11-01; it used to stretch
 *     to 1.25 × RT60, which held the dot still above 0.48 s), so the dot
 *     slides with RT60: at PRE 20 ms it sits at x ≈ 42 of the 320-wide card
 *     at 0.40 s, ≈ 84 at 1.5 s and ≈ 256 at 6.0 s (the plot runs 26 → 312);
 *     the caption opens "No pre-delay: the wash starts with the dry hit…" at 0 ms.
 *   - OUT's previous sweep (the dimmer line) is drawn only where it is signal
 *     that has already happened: for ~0.5 s after each click the part past
 *     the 1 s mark is blank, then refills (D41 fix 2026-11-01).
 * Change a label, a default or a range → update this file; the test pins the
 * names and the numbers.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers. */
export type ReverbScreenId = 'explore' | 'learn' | 'check';

export const REVERB_SCREEN_GUIDES: Record<ReverbScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    intro: {
      learning: 'What reverb’s main controls do: RT60 sets how long the tail takes to fall 60 dB, PRE-DELAY when it starts, damping how dark it gets, MIX how loud.',
      start: 'Tap ▶ with SOURCE on CLICK 60 and watch the amber wash fall on OUT. Then drag RT60 from 0.40 s to 6.0 s and watch the slope change.',
    },
    seeing: [
      'The glass is a dB VIEW (level in dB). Gray clicks enter at IN ▸ and pass the green REVERB stage. ▸ OUT redraws at each click; its ruler counts seconds since the click.',
      'On OUT: the gray dry click, then the amber wash (reverb) falling as a straight slope. Dashed guides sit 30 dB apart; the dim line is the previous sweep.',
      'RT60, PRE, MIX: your settings. TEACHING MODEL: a drawing of the idea, not a measurement.',
    ],
    control: [
      'Tap ▶ in the header, or tap the glass, to play the source through the reverb; ■ stops it. Every control works while it plays.',
      'Drag the RT60 fader, 0.40 s to 6.0 s. Tap a key for its choices: PRE-DLY (PRE-DELAY: 0, 20, 60 ms), DAMP (HF DAMPING, high-frequency damping: DARK 2k, NATURAL 5.5k, BRIGHT 12k), MIX (35%, 70%, 100% WET).',
      'SOURCE picks CLICK 60 (a short click once a second), BURST 1 kHz or PINK NOISE. Long-press a key or readout for its lesson entry; the ⓘ after the readouts explains the display.',
      '▴ HIDE DISPLAY and ⤢ FULL SCREEN sit under the glass. See LAB NOTES for DESIGNED RESPONSE (the decay line and its RT60 marker), THE AUDIO PATH, two CHECK YOURSELF questions and ⓘ GUIDED LESSON.',
    ],
    changes: [
      'RT60 is how long the wash takes to fall 60 dB: two guide gaps. A longer RT60 means a gentler slope, so tails overlap.',
      'PRE-DELAY holds the wash back after the dry click, on top of about 31 ms the reverb needs for its first echo.',
      'HF DAMPING dulls the wash on every trip around the reverb, so highs fade sooner than RT60 says: DARK is a soft room, BRIGHT a hard one.',
      'At MIX 100% WET, only the wash is left.',
    ],
    teaches: [
      'RT60 is a time, not an amount. How loud the reverb is belongs to MIX; when it starts belongs to PRE-DELAY.',
      'Pre-delay keeps a voice clear; damping tells a soft room from a hard one; mix sets how far back a source sits.',
      'In a real room, size and absorption set RT60, as in the Wave Physics labs; a reverb lets you set it directly.',
    ],
    tryThis: [
      'With SOURCE on CLICK 60, slide RT60 down to 0.40 s: on OUT the wash sinks to the bottom near the 0.5 s mark. At 6.0 s it falls only a little before the next click, and the tails pile up.',
      'Open PRE-DLY and pick 60 ms: the wash now jumps up nearly one 100 ms tick mark after the gray click (60 ms plus the reverb’s 31 ms). At 0 ms it jumps up about a third of a tick after.',
      'Bring RT60 to about 1.5 s, open DAMP and pick DARK 2k: the wash nearly reaches the bottom by the 1 s mark. DESIGNED RESPONSE stays put, because it draws RT60 alone.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The ideas behind EXPLORE, in words: early reflections and the tail, what RT60 measures, why room size and decay time differ, and how Sabine’s formula ties RT60 to a room.',
      start: 'Read what reverb is first. Then find the Sabine formula under FORMULA / CONCEPT, and on EXPLORE slide RT60 to 3.0 s to see that time drawn.',
    },
    seeing: [
      'The LEARN tab: this lab’s lesson as one page. Nothing on it moves; the header ▶ still plays or stops the sound.',
      'First, what reverb is: early reflections, then the tail. Then CONTROLS: the display, RT60 (decay time), PRE-DLY (PRE-DELAY), DAMP (HF DAMPING) and MIX.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT: RT60, and the Sabine formula that links it to a room.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE and CHECK; on EXPLORE you see and hear each idea on the live rack.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the rack.',
      'On EXPLORE, long-press a key or a readout to open just its entry. Long-press a SOURCE choice for that test signal’s own note.',
    ],
    changes: [
      'This page is your reference for what EXPLORE shows.',
      'Each CONTROLS entry names a part of the EXPLORE screen and says what it does to the wash.',
      'Most COMMON MISTAKES pair a choice with its cost: too much reverb blurs clarity, no pre-delay glues the voice to the tail, bass sent to the reverb makes it rumble.',
    ],
    teaches: [
      'What RT60, pre-delay, damping, mix, early reflections and the tail are.',
      'Why room size and decay time are separate ideas.',
      'How RT60 links to a real room through Sabine’s formula: more volume lengthens it, more absorption shortens it.',
      'Why reverb has two parts: early reflections first, then the denser tail.',
    ],
    tryThis: [
      'Read FORMULA / CONCEPT. Then on EXPLORE, slide RT60 to 3.0 s: in DESIGNED RESPONSE the dot sits where the slope meets the dashed −60 line, labeled RT60 3.0 s on the time axis below.',
      'Read the COMMON MISTAKES line on pre-delay. Then on EXPLORE, pick PRE-DLY 0 ms: the caption under DESIGNED RESPONSE now opens “No pre-delay: the wash starts with the dry hit…”',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    intro: {
      learning: 'Review: what RT60 measures, and what PRE-DELAY, HF DAMPING and MIX each change in how a reverb sounds.',
      start: 'Read each card and tap the option you think is right. Not sure? Go to EXPLORE, try the controls the card offers with SOURCE on CLICK 60, then come back.',
    },
    seeing: [
      'CHECK YOUR UNDERSTANDING, over the lab’s name. Get every question right to complete the lab; a line under the intro tells you how many are still to get right.',
      'Four question cards: what RT60 means, a vocal lost in its reverb, HF DAMPING, and a source that sounds far away.',
      'The options come in a mixed order, so the first one isn’t always the answer.',
    ],
    control: [
      'Tap an option to answer. Scroll down for every card.',
      'A wrong answer costs nothing: pick again straight away. There is no score.',
      'The tabs under the title go to EXPLORE or LEARN; cards already right stay right. If you leave the lab before the last right answer, they clear.',
    ],
    changes: [
      'A right answer turns its card green with ✓, shows CORRECT and the reason, and stays right.',
      'A wrong one shows NOT QUITE — TRY ANOTHER and the reason, so you can work the answer out.',
      'Get all four right and the check is passed: a green card says so.',
    ],
    teaches: [
      'Each question asks about an idea EXPLORE showed: what RT60, PRE-DELAY, HF DAMPING and MIX each change in the sound.',
      'Telling them apart is how you fix a reverb problem with the right control, not the nearest one.',
      'The same ideas carry into mixing: placing a sound near or far.',
    ],
    tryThis: [
      'Before you start: two questions offer controls as answers. Try each of those controls on EXPLORE with SOURCE on CLICK 60, and watch the gray click and the amber wash on OUT.',
      'For the RT60 question, reread FORMULA / CONCEPT on LEARN, then come back.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function reverbScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? REVERB_SCREEN_GUIDES[mode] : undefined;
}
