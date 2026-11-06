/**
 * Gate / Expander Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts, LabShell pattern =
 * chainScreenGuides.ts).
 *
 * The lab is ONE LabShell screen (FxLabScreen + fxLabConfigs gateConfig) with
 * three tabs, keyed by the shell's tab id:
 *   explore — the rack: the animated flow display (IN ▸ GATE ▸ OUT) with the GR
 *             ladder, the THRESH / RANGE / GR readouts, the THRESH fader and
 *             the RANGE / HOLD / RLS / SOURCE keys, LAB NOTES;
 *   learn   — the guided lesson as one reading page;
 *   check   — CHECK YOUR UNDERSTANDING (understandingChecks.ts GATE).
 *
 * Every name is the on-screen name (fxLabConfigs gateConfig, FxLabScreen,
 * fxAnim DynamicsFlow, fxViz). Every GR number in TRY THIS was worked out from
 * the engine (Effects.hpp DynamicsEffect GateMode: a peak detector — the gate
 * attack is 1 ms, written by gateConfig `fixed` (D41 fix 2026-11-01; the
 * engine's own 10 ms default was too slow for the 5 ms click); the gate gain
 * opens at that rate above the threshold, holds for HOLD, then closes toward
 * the RANGE floor at the RELEASE rate, and RELEASE also sets how fast the
 * detector falls) on the lab's CLICK 90 at −20 dBFS peak, on BOTH routes
 * (headphones, and the phone speaker's 150 Hz high-pass), re-run sample by
 * sample in the test:
 *   THRESH −35 (the default), RLS 100 → the detector peaks ≈ −24.6 dBFS, the
 *     gate opens on every hit: GR 0.0 for ~140 ms, then up to ~36.6 between
 *     hits; the hit itself comes out ≈ −23.5 dBFS (the 1 ms opening ramp);
 *   THRESH −20                       → never opens (−24.6 < −20): GR = |RANGE|;
 *   THRESH −50, RLS 100 ms           → GR swings from 0.0 to ~29 and back;
 *   THRESH −50, RLS 20 ms CHATTER    → shut for most of each gap: GR reaches
 *     exactly |RANGE| — 20.0 / 40.0 / 70.0 — before the next hit;
 *   THRESH −50, RLS 500 ms           → GR 0.0 throughout (never closes: the
 *     detector falls at RLS speed too, bottoms near −35.8 dB > −50, so the
 *     close branch never runs — the guide gives THAT reason);
 *   THRESH −50, HOLD 100 vs 0 (RLS 20) → GR < 1 dB for ~160 ms vs ~60 ms per hit.
 * Before the D41 fix the engine's 10 ms attack let the detector reach only
 * −37.6 dBFS on the click, so at the default −35 the gate never opened while
 * the intro, caption and drawing said it did; the drawing now uses the same
 * 1 ms (gateConfig anim attackMs). The CLICK drawing is still called a model.
 * PINK NOISE is route-dependent (the speaker's high-pass drops its level about
 * 3 dB, enough to flip the gate at −35) — so no step quotes a number on it.
 * RANGE, HOLD and RLS show on GR on the CLICK, but the sound is only 5 ms long,
 * so they are barely HEARD there: the SOURCE line and the screen's caption send
 * the ear to PINK NOISE (audit decision 2, 2026-11-05; not yet heard on a phone).
 * Change a label, a default or the source level → update this file;
 * test/screenGuide_gate_20261031.test.ts pins names + numbers.
 *
 * STEPPED: each section fits SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers. */
export type GateScreenId = 'explore' | 'learn' | 'check';

export const GATE_SCREEN_GUIDES: Record<GateScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    seeing: [
      'Sound flows left → right: IN ▸, through the green GATE bar, ▸ OUT. Dashed lines on IN mark the threshold; the dotted outline is the sound untouched.',
      'The GR ladder (0 to 70 dB) grows down as the gate closes.',
      'Readouts: THRESH, RANGE and GR (how far it turns down), measured live; — dB while stopped.',
      'The drawing is a TEACHING MODEL: CLICK is drawn as a longer DRUM-HIT MODEL; GR measures the real click.',
    ],
    control: [
      '▶ in the header, or a tap on the display, plays the SOURCE through the gate; ■ stops it. The THRESH fader runs from −50 to −20 dB.',
      'RANGE key: −20 dB GENTLE, −40 dB or −70 dB SILENCE. HOLD key: 0, 10 or 100 ms. RLS key: 20 ms CHATTER, 100 ms or 500 ms.',
      'SOURCE key: CLICK 90 or PINK NOISE. On the 5 ms click, RANGE, HOLD and RLS show on GR but barely in the sound: to hear them, use PINK NOISE with THRESH near its level.',
      'Long-press any key or readout for its lesson entry. Below, LAB NOTES: the intro, the GATE ATTENUATION meter, the DESIGNED RESPONSE curve, THE AUDIO PATH, two CHECK YOURSELF questions and the GUIDED LESSON.',
    ],
    changes: [
      'Above the threshold the gate opens (GR near 0); below, it closes toward the RANGE floor (−40 dB = 40 dB quieter).',
      'HOLD keeps it open a set time after the level falls. RLS sets how fast it then closes, and how fast its sensed level falls. A level wobbling at the line with a fast RLS flickers: chatter.',
      'Each click opens it at the starting THRESH −35 dB; at −20 dB the short click never does.',
    ],
    teaches: [
      'Downward expansion: the gate works the other side of the threshold from the compressor — quiet sound turned down, loud sound let through.',
      'Range sets how deep it closes; hold and release set how it closes — and why chatter happens.',
      'It follows Compression in the Dynamics labs; Limiter is next.',
    ],
    tryThis: [
      'Play CLICK 90 and raise THRESH to −20 dB: GR stays at the RANGE floor, as the short click never opens the gate. Pull it down to −50 dB: GR drops toward 0 on each hit and climbs back between them.',
      'Still at −50 dB, set RLS to 20 ms CHATTER and step RANGE: between hits GR reaches 20.0, 40.0, then 70.0 dB. The click is a clean hit, so this shows depth, not chatter.',
      'Now set RLS to 500 ms: GR stays at 0.0. The sensed level falls so slowly it never drops below −50 dB before the next hit, so the gate never starts to close.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: this lab’s guided lesson as one page to read. Nothing here plays.',
      'First what a gate is. Then CONTROLS — Threshold, Attack, Hold, Release, Range, the GR meter and more. Some (Attack, Hysteresis, Lookahead, sidechain and key filter) are on real gates, not on this screen.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE (the live gate) and CHECK (four questions).',
      'On EXPLORE, long-press any key or readout to open just its entry as a sheet; ⓘ GUIDED LESSON at the end of LAB NOTES opens this whole lesson.',
    ],
    changes: [
      'Nothing on this page moves — it is the reference for what EXPLORE shows.',
      'FORMULA / CONCEPT: below the threshold, gain falls toward the Range floor; above it, the gate is open at 0 dB.',
      'Most COMMON MISTAKES come in pairs: threshold too high chops tails, too low lets bleed through; release too fast chatters.',
    ],
    teaches: [
      'The words of gating: threshold, range (floor), hold, release, hysteresis, key filter, chatter.',
      'Why a partial range often sounds more natural than full silence.',
      'CHECK asks four questions on it; Limiter is the next Dynamics lab.',
    ],
    tryThis: [
      'Read the COMMON MISTAKES line on release, then on EXPLORE play CLICK 90 at THRESH −50 dB: at RLS 20 ms CHATTER GR reaches the RANGE floor between hits; at 500 ms it stays at 0.0.',
      'Read the line on Range at −∞, then on EXPLORE (CLICK 90, THRESH −50 dB, RLS 20 ms CHATTER) step RANGE: between hits GR reaches 70.0 at −70 dB SILENCE, 20.0 at −20 dB GENTLE.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING: four questions on this lab — which side of the threshold a gate works on, a partial range, chatter, and hold.',
      'A ✓ replaces a question’s number once it is right. The line under the title says how many are still to get right.',
    ],
    control: [
      'Tap an option. Right: it turns green and CORRECT explains why. Wrong: NOT QUITE — TRY ANOTHER explains, and you pick again straight away.',
      'Nothing is scored. The tabs switch to LEARN or EXPLORE at any time to look something up.',
    ],
    changes: [
      'Each answer shows its explanation at once, right or wrong, so a wrong pick still teaches.',
      'All four right and the lab is complete — passing this check is what counts it toward certificates, and a pass stays passed.',
    ],
    teaches: [
      'Whether the ideas stuck: the gate turns quiet sound down, range is how far, and hold or a slower release stops chatter.',
      'Every question is answered by something EXPLORE shows or LEARN says.',
    ],
    tryThis: [
      'Unsure about RANGE? On EXPLORE, CLICK 90 at THRESH −50 dB with RLS 20 ms CHATTER and RANGE −20 dB GENTLE: GR tops out at 20.0 dB — quieter, not silent.',
      'Unsure about HOLD? On EXPLORE (CLICK 90, THRESH −50 dB, RLS 20 ms CHATTER) compare HOLD 0 ms and 100 ms: at 100 ms GR rests at 0.0 a moment after each hit before it falls.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function gateScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? GATE_SCREEN_GUIDES[mode] : undefined;
}
