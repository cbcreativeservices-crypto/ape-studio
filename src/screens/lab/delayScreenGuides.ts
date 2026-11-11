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
    intro: {
      learning: 'How a delay works: TIME sets the gap between repeats, FEEDBACK sets how long the trail lasts, and a delay time can match the song’s tempo.',
      start: 'Set SOURCE to CLICK 90 and tap ▶. Watch the repeats leave on ▸ OUT. Then step FDBK from 25% to 75% and see the trail grow while the spacing stays the same.',
    },
    seeing: [
      'Your source comes in on IN ▸ in gray, passes the green DELAY stage and leaves on ▸ OUT with its repeats in color. The ruler under OUT counts seconds since the stage.',
      'TIME, FDBK and MIX show your settings. The strip under them says TEACHING MODEL: the picture comes from the same math as the sound you hear.',
      'A steady SINE or PINK source draws a band and says TRY CLICK: repeats of a steady sound blur into it.',
    ],
    control: [
      'Tap ▶ in the header, or tap the glass, to play the source through the delay; ■ stops it. Every control works while it plays.',
      'Drag the TIME fader, 80 to 500 ms. Tap a key for its choices: FDBK (FEEDBACK: 0%, 25%, 50% or 75%), MIX (25%, 50%, 100% WET), COLOR (PING-PONG, and REPEAT DAMPING: DARK 2k, TAPE 6k, OFF 20k), SOURCE (CLICK 90, PINK NOISE, SINE 220 Hz).',
      'Long-press a key or a readout for its lesson entry. The ⓘ at the end of the readouts explains the display.',
      '▴ HIDE DISPLAY and ⤢ FULL SCREEN sit under the glass. Scroll to LAB NOTES for DESIGNED RESPONSE (each repeat drawn as a stem, a line whose height is its level), THE AUDIO PATH, two CHECK YOURSELF questions and ⓘ GUIDED LESSON.',
    ],
    changes: [
      'TIME is the gap from a sound to its first repeat, and between repeats: more TIME, wider spacing.',
      'FDBK feeds each repeat back in; at 50% each is half the one before (6 dB down). It sets how long the trail lasts, never the spacing.',
      'MIX blends dry sound and repeats: at 100% WET the gray dry click leaves OUT.',
      'REPEAT DAMPING darkens each pass after the first. PING-PONG sends repeats left, right, left.',
    ],
    teaches: [
      'A delay hands back separate copies of a sound in time. Reverb, the next lab, blurs thousands of them into a wash.',
      'A delay time can match the song: a quarter note lasts 60,000 ÷ BPM ms. Slapback is one quick repeat, about 60–150 ms.',
      'A delay repeat is an echo you place on purpose, like those in the Echo Laboratory in Wave Physics. Chorus and flanger, later in Modulation, use very short delays that move.',
    ],
    tryThis: [
      'With FDBK under 75% (at 75% the caption warns of a long trail), slide TIME to the top: 500 ms. In LAB NOTES, the caption under DESIGNED RESPONSE names a quarter-note at 120 BPM (60,000 ÷ 500).',
      'Keep TIME at 500 ms and MIX at 50%. Set FDBK to 25%: DESIGNED RESPONSE shows 3 stems after the gray dry one. At 75%: 6, and the trail runs past the 3250 ms edge.',
      'Open COLOR and turn PING-PONG on with SOURCE on CLICK 90: OUT splits into an L lane over an R lane, odd repeats left, even right. In LAB NOTES, DESIGNED RESPONSE letters one click’s repeats L, R, L.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The words of delay (time, feedback, wet / dry, slapback, ping-pong, damping) and how a song’s tempo turns into a delay time in milliseconds.',
      start: 'Scroll to FORMULA / CONCEPT and work out a quarter note at 120 BPM. Then switch to EXPLORE, slide TIME to 500 ms, and check your answer in LAB NOTES.',
    },
    seeing: [
      'This is the Delay lab’s guided lesson as one page to read. Nothing on it moves, but the ▶ in the header still plays or stops the sound.',
      'It starts with what a delay is. Then CONTROLS: the display, TIME, FDBK (FEEDBACK), MIX, PING-PONG and REPEAT DAMPING, each with what it does to the repeats.',
      'It ends with COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT: the delay time for a note at any tempo.',
    ],
    control: [
      'Scroll to read. Use the tabs under the title to switch between LEARN, EXPLORE (the live rack) and CHECK.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the rack.',
      'On EXPLORE, long-press a dock key or a readout to open just its entry. A SOURCE choice opens that test signal’s own note.',
    ],
    changes: [
      'Read this page beside EXPLORE: each CONTROLS entry names a part of the rack and says what it does to the repeats.',
      'Most COMMON MISTAKES lines pair a setting with what goes wrong: too much feedback runs away, a delay off the tempo smears the groove, full-range repeats pile up.',
      'FORMULA / CONCEPT turns BPM into milliseconds. On EXPLORE, the caption under DESIGNED RESPONSE names the BPM for your TIME.',
    ],
    teaches: [
      'The words for a delay: delay time, feedback, wet / dry, slapback (one quick repeat), ping-pong (repeats alternating left and right), damping (darker repeats).',
      'How to turn a tempo into a delay time, for a quarter, an eighth or a dotted eighth note.',
      'Why repeats are usually kept quieter than the dry sound, and darker than it.',
      'Why too much feedback runs away, and why a delay off the tempo smears the groove.',
    ],
    tryThis: [
      'Read FORMULA / CONCEPT and work out a quarter note at 120 BPM. Then on EXPLORE, with FDBK under 75%, slide TIME to 500 ms: the caption under DESIGNED RESPONSE names 120 BPM.',
      'Read the COMMON MISTAKES line on slapback. Then on EXPLORE set TIME to 80 ms and FDBK to 0%: DESIGNED RESPONSE shows one stem after the dry one — a single quick repeat.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    intro: {
      learning: 'A review of delay’s core ideas: turning tempo into delay time, what FEEDBACK controls, what makes a slapback, and what REPEAT DAMPING does to the repeats.',
      start: 'Tap an answer on each card. If the tempo question stumps you, reread FORMULA / CONCEPT on LEARN. For the others, try that control on EXPLORE and come back.',
    },
    seeing: [
      'This is CHECK YOUR UNDERSTANDING for the Delay lab. A line under the heading counts the questions you still need to get right.',
      'Four question cards: tempo and delay time, FEEDBACK, slapback, and REPEAT DAMPING.',
      'The options come in a mixed order, so the first one is not always the answer.',
    ],
    control: [
      'Tap an option to answer. Scroll down for every card.',
      'A wrong answer costs nothing: pick again straight away. There is no score.',
      'Use the tabs under the title to go to EXPLORE or LEARN; cards already right stay right. If you leave the lab before the last right answer, they clear.',
    ],
    changes: [
      'A right answer turns its card green with ✓, shows CORRECT and the reason, and stays right.',
      'A wrong one shows NOT QUITE — TRY ANOTHER and the reason, so you can work out the answer.',
      'Get all four right and the check is passed: a green card says so.',
    ],
    teaches: [
      'On a delay, TIME and FEEDBACK each shape the repeats in a different way.',
      'How a song’s tempo turns into a delay time, and what makes a slapback different from other echoes.',
      'Why an engineer might darken the repeats with REPEAT DAMPING.',
    ],
    tryThis: [
      'Test the tempo law on a different note: on EXPLORE, with FDBK under 75%, set TIME to 375 ms. The caption under DESIGNED RESPONSE names 160 BPM. FORMULA / CONCEPT on LEARN shows why.',
      'Stuck on FEEDBACK or REPEAT DAMPING? On LEARN, each CONTROLS entry says what that control does to the repeats. Read it, then try it on EXPLORE.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function delayScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? DELAY_SCREEN_GUIDES[mode] : undefined;
}
