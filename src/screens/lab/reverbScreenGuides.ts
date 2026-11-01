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
 *     "RT60 {fmt2sig(rt60)} s" (two decimals below 1 s, as the fader and bezel) on the time axis below it. The axis spans
 *     max(1.25 × RT60, 0.6 s), so above RT60 0.48 s the dot barely moves
 *     ((PRE + RT60) ÷ 1.25·RT60 ≈ 0.80–0.83 of the width at PRE 20 ms) and
 *     the axis stretches; the caption opens "No pre-delay: the wash starts with the dry hit…" at 0 ms.
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
    seeing: [
      'The glass, in a dB VIEW (level in decibels): grey clicks come in on IN ▸ and pass the green REVERB stage. ▸ OUT redraws from the left at each click; its ruler counts seconds since then.',
      'On OUT: the grey dry click, then the amber wash falling as a straight slope. Dashed guides sit 30 dB apart; the dimmer line is the sweep before.',
      'Readouts: RT60, PRE, MIX. The strip under them says this is a TEACHING MODEL.',
    ],
    control: [
      '▶ in the header, or a tap on the glass, plays the source through the reverb; ■ stops it. Every control works while it plays.',
      'The fader is RT60, 0.40 s to 6.0 s. Tap a key for its choices: PRE-DLY (PRE-DELAY: 0, 20, 60 ms), DAMP (HF DAMPING, high-frequency damping: DARK 2k, NATURAL 5.5k, BRIGHT 12k), MIX (35%, 70%, 100% WET), SOURCE (CLICK 60, BURST 1 kHz, PINK NOISE).',
      'Long-press a key or a readout for its lesson entry. The ⓘ at the end of the readouts explains the display.',
      '▴ HIDE DISPLAY and ⤢ FULL SCREEN sit under the glass. LAB NOTES below: DESIGNED RESPONSE (the decay line and its RT60 marker), THE AUDIO PATH, two CHECK YOURSELF questions, ⓘ GUIDED LESSON.',
    ],
    changes: [
      'RT60 is the time the wash takes to fall 60 dB, two guide gaps. More RT60, a gentler slope, so tails overlap.',
      'PRE-DELAY holds the wash back after the dry click, on top of about 31 ms the reverb needs for its first echo.',
      'HF DAMPING dulls the wash on every trip round the reverb, so highs fade sooner than RT60 says: DARK is a soft room, BRIGHT a hard one.',
      'MIX: at 100% WET only the wash is left.',
    ],
    teaches: [
      'RT60 is a time, not an amount: how loud the reverb is belongs to MIX, when it starts to PRE-DELAY.',
      'Pre-delay keeps a voice clear; damping tells a soft room from a hard one; mix sets how far back a source sits.',
      'It follows Delay (separate echoes) and builds on the Absorption and Reverberation Laboratories in Wave Physics, where RT60 comes from a room. Modulation is next.',
    ],
    tryThis: [
      'With SOURCE on CLICK 60, slide RT60 down to 0.40 s: on OUT the wash sinks to the bottom near the 0.5 s mark. At 6.0 s it falls only a little before the next click, and the tails pile up.',
      'Open PRE-DLY and pick 60 ms: on OUT the wash now jumps up nearly one 100 ms tick after the grey click (60 ms plus the reverb’s 31 ms). At 0 ms it jumps up about a third of a tick after.',
      'Bring RT60 back to about 1.5 s, open DAMP and pick DARK 2k: the wash now nearly reaches the bottom by the 1 s mark. DESIGNED RESPONSE stays put: it draws RT60 alone.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: the guided lesson for this lab as one page to read. Nothing here plays.',
      'First, what reverb is: early reflections, then the tail. Then CONTROLS: the display, RT60 (decay time), Pre-delay, HF damping and Mix.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT: RT60, and the Sabine formula that links it to a room.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE and CHECK; EXPLORE is the live rack.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the rack.',
      'On EXPLORE, long-press a dock key or a readout to open just its entry. A SOURCE choice opens that test signal’s own note.',
    ],
    changes: [
      'Nothing on this page moves: it is the reference for what EXPLORE shows.',
      'Each CONTROLS entry names a part of the EXPLORE screen and says what it does to the wash.',
      'Most COMMON MISTAKES lines pair a choice with its cost: too much reverb blurs clarity, no pre-delay glues the voice to the tail, bass sent to the reverb makes it rumble.',
    ],
    teaches: [
      'The words for reverb: RT60, pre-delay, damping, mix, early reflections and tail.',
      'Why room size and decay time are separate ideas.',
      'How RT60 links to a real room through Sabine’s formula — volume over absorption.',
      'The reference behind EXPLORE and the CHECK tab.',
    ],
    tryThis: [
      'Read FORMULA / CONCEPT. Then on EXPLORE slide RT60 to 3.0 s: in DESIGNED RESPONSE the dot sits where the slope meets the dashed −60 line, labelled RT60 3.0 s on the time axis below.',
      'Read the COMMON MISTAKES line on pre-delay. Then on EXPLORE pick PRE-DLY 0 ms: the caption under DESIGNED RESPONSE now opens “No pre-delay: the wash starts with the dry hit…”',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING, over the lab’s name. Get every question right to complete the lab; a line under the lead counts the ones still to get right.',
      'Four question cards: what RT60 means, a vocal lost in its reverb, HF DAMPING, and a source that sounds far away.',
      'The options come in a mixed order, so the first one is not always the answer.',
    ],
    control: [
      'Tap an option to answer. Scroll down for every card.',
      'A wrong answer costs nothing: pick again straight away. There is no score.',
      'The tabs under the title go to EXPLORE or LEARN. Leaving this tab before the last right answer clears the cards.',
    ],
    changes: [
      'A right answer turns its card green with ✓, shows CORRECT and the reason, and stays right.',
      'A wrong one shows NOT QUITE — TRY ANOTHER and the reason, so the answer can be worked out.',
      'When the last card is right, a green card says the lab is complete. It counts once, for every certificate that needs it.',
    ],
    teaches: [
      'Each question asks about an idea EXPLORE showed: RT60 is a time, PRE-DELAY is a gap, MIX is how much.',
      'This is the last step of the lab, and what marks it complete.',
      'The same ideas carry into mixing: placing a sound near or far.',
    ],
    tryThis: [
      'Before you start: two questions offer controls as answers. Try each of those controls on EXPLORE with SOURCE on CLICK 60, and watch the grey click and the amber wash on OUT.',
      'Also on EXPLORE: slide RT60 and watch DESIGNED RESPONSE. Above about 0.5 s the marker barely moves along the dashed −60 line while the time axis stretches: read its label, RT60 … s.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function reverbScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? REVERB_SCREEN_GUIDES[mode] : undefined;
}
