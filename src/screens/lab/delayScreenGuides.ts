/**
 * Delay Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen (FxLabScreen + fxLabConfigs delayConfig)
 * with three tabs, so the guides are keyed by the shell's tab id:
 *   explore — the Rack Unit: the animated echo flow on the glass (fxAnim
 *             EchoFlow: IN ▸ · the green DELAY stage · ▸ OUT over a seconds
 *             ruler), the TIME / FDBK / MIX readouts, the TIME fader and the
 *             FDBK / MIX / COLOR / SOURCE keys, the header ▶, LAB NOTES;
 *   learn   — the reading page (the guided lesson in full, content.ts delay);
 *   check   — the end-of-lab understanding check (understandingChecks DELAY,
 *             four questions; passing completes the lab).
 *
 * Every name is the on-screen name in fxLabConfigs.tsx (delayConfig),
 * FxLabScreen.tsx, fxAnim.tsx (EchoFlow), fxViz.tsx (EchoTimelineGraph),
 * RackUnit / BezelReadouts and LabUnderstandingCheck. Every number in TRY
 * THIS is what the screen draws at that setting, worked out from the code
 * and re-run by test/screenGuide_delay_20261031.test.ts:
 *   - the DESIGNED RESPONSE stems (EchoTimelineGraph): repeat n sits at
 *     n × TIME with height MIX × FDBK^(n−1); a stem is drawn while its height
 *     is over 0.02 and n × TIME ≤ 3250 ms (ECHO_SPAN_MS). At TIME 500 ms,
 *     MIX 50%: FDBK 25% → 3 stems, FDBK 75% → 6 (the 7th would sit past
 *     3250 ms); TIME 80 ms, FDBK 0% → 1 stem;
 *   - the caption under it: "a quarter-note at {60000 ÷ TIME} BPM" while
 *     FDBK < 75% and TIME ≥ 250 ms (500 ms → 120 BPM; shorter TIMEs get a
 *     slapback / short-echo line, no BPM), "a long trail; runaway starts near
 *     100%" at 75% — the rack
 *     stays mounted across tabs, so FDBK 75% from EXPLORE TRY THIS 2 carries
 *     into LEARN / CHECK: every BPM step says "with FDBK under 75%";
 *   - ping-pong (EchoFlow + Effects.hpp DelayEffect, engine 10): OUT splits
 *     into an L lane over an R lane, odd repeats left, even right (every
 *     click's repeats share the lanes, so successive trails interleave on
 *     OUT); DESIGNED RESPONSE letters one click's stems L, R, L…
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
export type DelayScreenId = 'explore' | 'learn' | 'check';

export const DELAY_SCREEN_GUIDES: Record<DelayScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    seeing: [
      'The glass: the source comes in on IN ▸ in grey, passes the green DELAY stage and leaves on ▸ OUT with its repeats in colour. The ruler under OUT counts seconds since the stage.',
      'Readouts: TIME, FDBK, MIX. The strip under them says this is a TEACHING MODEL, drawn from the same math as the audio.',
      'A steady SINE or PINK source draws a band and says TRY CLICK: repeats of a steady sound blur into it.',
    ],
    control: [
      '▶ in the header, or a tap on the glass, plays the source through the delay; ■ stops it. Every control works while it plays.',
      'The fader is TIME, 80 to 500 ms. Tap a key for its choices: FDBK (FEEDBACK: 0% to 75%), MIX (25%, 50%, 100% WET), COLOR (PING-PONG, and REPEAT DAMPING: DARK 2k, TAPE 6k, OFF 20k), SOURCE (CLICK 90, PINK NOISE, SINE 220 Hz).',
      'Long-press a key or a readout for its lesson entry. The ⓘ at the end of the readouts explains the display.',
      '▴ HIDE DISPLAY and ⤢ FULL SCREEN sit under the glass. LAB NOTES below: DESIGNED RESPONSE (the echo pattern as stems), THE AUDIO PATH, two CHECK YOURSELF questions, ⓘ GUIDED LESSON.',
    ],
    changes: [
      'TIME is the gap from a sound to its first repeat, and between repeats: more TIME, wider spacing.',
      'FDBK feeds each repeat back in. At 50% each repeat is half the one before, so FDBK sets how long the trail lasts, never the spacing.',
      'MIX blends dry and repeats: at 100% WET the grey dry click leaves OUT.',
      'REPEAT DAMPING dulls every pass after the first; PING-PONG sends repeats left, right, left.',
    ],
    teaches: [
      'A delay hands back separate copies of a sound in time. Reverb, the next lab, blurs thousands of them into a wash.',
      'A delay time can match the song: a quarter note lasts 60,000 ÷ BPM ms. Slapback is one quick repeat, about 60–150 ms.',
      'It builds on the Echo Laboratory in Wave Physics. Chorus and flanger, in Modulation, are very short delays that move.',
    ],
    tryThis: [
      'With FDBK under 75%, slide TIME to the top: the readout says 500 ms, and the caption under DESIGNED RESPONSE in LAB NOTES names a quarter-note at 120 BPM (60,000 ÷ 500).',
      'Keep TIME at 500 ms and MIX at 50%. Set FDBK to 25%: DESIGNED RESPONSE shows 3 stems after the grey dry one. At 75%: 6, and the trail runs past the 3250 ms edge.',
      'Open COLOR and turn PING-PONG on with SOURCE on CLICK 90: OUT splits into an L lane over an R lane, odd repeats left, even right. In LAB NOTES, DESIGNED RESPONSE letters one click’s repeats L, R, L.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: the guided lesson for this lab as one page to read. Nothing here plays.',
      'First, what a delay is. Then CONTROLS: the display, Delay time, Feedback, Wet / Dry (the dock’s MIX), Ping-pong and Repeat damping, each with what it does.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT: the delay time for a note at any tempo.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE and CHECK; EXPLORE is the live rack.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the rack.',
      'On EXPLORE, long-press a dock key or a readout to open just its entry. A SOURCE choice opens that test signal’s own note.',
    ],
    changes: [
      'Nothing on this page moves: it is the reference for what EXPLORE shows.',
      'Each CONTROLS entry names a part of the EXPLORE screen and says what it does to the repeats.',
      'Most COMMON MISTAKES lines pair a setting with what goes wrong: too much feedback runs away, a delay off the tempo smears the groove, full-range repeats pile up.',
    ],
    teaches: [
      'The words for a delay: delay time, feedback, wet / dry, slapback, ping-pong, damping.',
      'How to turn a tempo into a delay time, for a quarter, an eighth or a dotted eighth note.',
      'Why repeats are usually kept behind the dry sound, and darker than it.',
      'The reference behind EXPLORE and the CHECK tab.',
    ],
    tryThis: [
      'Read FORMULA / CONCEPT and work out a quarter note at 120 BPM. Then on EXPLORE, with FDBK under 75%, slide TIME to 500 ms: the caption under DESIGNED RESPONSE names 120 BPM.',
      'Read the COMMON MISTAKES line on slapback. Then on EXPLORE set TIME to 80 ms and FDBK to 0%: DESIGNED RESPONSE shows one stem after the dry one — a single quick repeat.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING, over the lab’s name. Get every question right to complete the lab; a line under the lead counts the ones still to get right.',
      'Four question cards: tempo and delay time, FEEDBACK, slapback, and REPEAT DAMPING.',
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
      'Each question asks about an idea EXPLORE showed: spacing is TIME, trail length is FEEDBACK.',
      'This is the last step of the lab, and what marks it complete.',
      'The same words come back in Reverb, next in Time Effects.',
    ],
    tryThis: [
      'Before you start: a quarter note lasts 60,000 ÷ BPM ms. On EXPLORE, with FDBK under 75%, the caption under DESIGNED RESPONSE names the BPM for a TIME of 250 ms or more — test your answer there.',
      'Also on EXPLORE: switch FDBK between 25% and 75%. The stems keep their spacing; only how many and how tall change.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function delayScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? DELAY_SCREEN_GUIDES[mode] : undefined;
}
