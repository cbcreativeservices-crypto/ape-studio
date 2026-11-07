/**
 * Modular Synth Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts, LabShell pattern =
 * chainScreenGuides.ts).
 *
 * The lab is ONE LabShell screen with three tabs, so the guides are keyed by
 * the shell's tab id:
 *   explore — the rack: THE PATCH (the Eurorack case drawing), the PATCH /
 *             VCO / RES / LFO / SEQ bezel, the CUTOFF lane, the PATCH / VCO /
 *             MOD / SEQ trays, the header ▶, LAB NOTES (READING THE CASE,
 *             THE VOICE, AS SOUND, two CHECK YOURSELF questions, FINISH · SEE
 *             WHAT’S LEFT ›);
 *   learn   — the reading page (the guided lesson in full);
 *   check   — LabShell's CHECK tab (the four Modular questions in
 *             understandingChecks.ts) with the lab's FINISH link under it.
 * The what's-left layer ("Where you are") is its own modal with its own
 * header and no ⓘ, so it has no guide here.
 *
 * Every name is the on-screen name in ModularLabScreen.tsx / ModularSpectrum
 * (bezel keys + values, dock labels, tray chips, module names, the case's
 * group labels). Every number in TRY THIS is what the screen draws, worked
 * out from the lab's own formulas (spectrumMath.ts — the engine's filter,
 * Modular.hpp kDamp = 2 − 1.6·res):
 *   SINE (110 Hz) at CUTOFF 8.0 kHz → 0.0 dB; at 250 Hz → −1.5 dB
 *   the filter curve at the CUTOFF line: RES 0 → −6.0 dB, RES MAX → +8.0 dB
 *   WOBBLE → LFO →CUT, cable LFO → VCF; MOD →PITCH → LFO →PIT, cable LFO →
 *     VCO, PATCH CUSTOM
 *   ACID BASS → RES MAX, SEQ 8/s, an ENV → VCF cable
 * test/screenGuide_modular_20261031.test.ts re-runs every one of them.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text. The CHECK guide never gives away an answer.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers. */
export type ModularScreenId = 'explore' | 'learn' | 'check';

export const MODULAR_SCREEN_GUIDES: Record<ModularScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    seeing: [
      'THE PATCH: seven modules. CONTROL SOURCES (CV): SEQ, LFO, ENV. AUDIO PATH → OUT: VCO, VCF, VCA, OUT.',
      'Amber cables carry sound; a cable in its source’s color (SEQ red, LFO blue, ENV green) carries control. When it runs, the ENV light shows the envelope; the lit SEQ step is sounding.',
      'LAB NOTES › THE VOICE, AS SOUND: harmonics of the 110 Hz note as bars (gray = filtered out) under the filter’s dashed curve.',
    ],
    control: [
      '▶ in the header plays the drone (SEQ off) or runs the sequence (SEQ on); ■ stops it.',
      'CUTOFF fader: the filter’s cutoff, 250 Hz to 8.0 kHz, on the control lane by default.',
      'PATCH key: RAW DRONE, ACID BASS, WOBBLE, VIBRATO LEAD, TREMOLO, each with why. VCO key: SAW, SQUARE, TRI or SINE. The readouts echo the keys: PATCH (or CUSTOM), VCO, RES, LFO (route or OFF), SEQ (rate or OFF).',
      'MOD key: RES 0 / ½ / MAX; envelope PLUCK, PAD or ORGAN, with ENV→VCF OFF, +50% or +100%; LFO 0.5, 2 or 6 Hz, DEPTH 0 / ½ / MAX, OFF, →PITCH, →CUTOFF or →AMP.',
      'SEQ key: SEQ ON/OFF, 2/s, 4/s or 8/s, and eight steps (tap to cycle, ✕ = rest). Tap a module, or long-press a key, for its lesson entry.',
    ],
    changes: [
      'The VCF is a low-pass: lower CUTOFF removes harmonics from the top, so the tone darkens. RES boosts right at the cutoff.',
      'The envelope always opens the VCA (loudness); ENV→VCF sweeps the cutoff too.',
      'One LFO, three effects: pitch = vibrato, cutoff = wobble, amp = tremolo. It is live only with DEPTH above 0 and a destination — the cable proves it.',
      'SEQ retunes the VCO and retriggers the envelope each step.',
    ],
    teaches: [
      'Subtractive synthesis: start with a bright wave, then carve harmonics away with a filter.',
      'Audio and control are different signals: a CV cable makes no sound — it turns a setting for you.',
      'Most classic synth sounds are a routing choice: what modulates what.',
      'It follows FM Synthesis; next, the Sound Envelope & Transients Lab looks at how real sounds rise and fall.',
    ],
    tryThis: [
      'Tap ▶, pick VCO SINE and drag CUTOFF from 8.0 kHz to 250 Hz: the one bar in THE VOICE, AS SOUND (LAB NOTES; ▴ HIDE DISPLAY gives room) drops only about 1.5 dB. On SAW, the filtered bars go gray.',
      'In MOD tap RES MAX: in THE VOICE, AS SOUND (LAB NOTES) the dashed filter curve now peaks about 8 dB above 0 dB at the CUTOFF line. At RES 0 it sits 6 dB below.',
      'PATCH → WOBBLE: LFO reads →CUT and a blue cable runs to the VCF. In MOD tap →PITCH: the cable moves to the VCO, LFO reads →PIT, PATCH reads CUSTOM.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: the guided lesson for this lab, as one page to read. Nothing here plays.',
      'First, what the voice is. Then CONTROLS: the display, VCO, VCF, envelope, LFO, sequencer, VCA, output, and each of the five patch ideas.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT — the signal path and the modulation routes, one line each.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE and CHECK.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the rack.',
      'On EXPLORE, tap a module in the case, long-press a dock key or a readout, or tap the ⓘ on the readout strip, for just that entry.',
    ],
    changes: [
      'Nothing on this page moves — it is the reference for what EXPLORE shows.',
      'Each patch entry says which routing makes that sound, and why.',
      'Several COMMON MISTAKES lines mix up what a signal does — a filter on a sine, the loudness envelope taken for the filter envelope, an LFO on the wrong destination.',
    ],
    teaches: [
      'The words of a synth voice: VCO, VCF, VCA, ADSR, LFO, sequencer, CV, cutoff, resonance.',
      'Why the same LFO gives vibrato, a wobble or tremolo.',
      'The reference behind EXPLORE; next in the Synthesis & Sound Design list, the Sound Envelope & Transients Lab.',
    ],
    tryThis: [
      'Read the COMMON MISTAKES line on filtering a sine, then on EXPLORE pick VCO SINE, tap ▶ and ride CUTOFF: the tone hardly changes.',
      'Read the PRO TIPS line on the classic bass, then on EXPLORE tap PATCH → ACID BASS and ▶: RES reads MAX, SEQ 8/s, and a green cable runs from ENV to the VCF.',
    ],
  },

  // ── CHECK — LabShell's understanding check + the FINISH link ──────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING for this lab: four questions — a filtered sine, an LFO moved, a note that starts bright and darkens, and the order of the audio path.',
      'Above them, how many are still to get right; a ✓ replaces a question’s number once it is right.',
      'Below them, FINISH · SEE WHAT’S LEFT › opens Where you are: the check’s status and the way back to labs.',
    ],
    control: [
      'Tap an answer. A wrong one stays open: pick again straight away. Nothing is lost and there is no score.',
      'A right answer locks in, and its explanation stays to read.',
      'The tabs under the title go back to LEARN or EXPLORE to look something up; answers already right stay right when you come back. Leaving the lab before the last one starts the check over.',
    ],
    changes: [
      'Every answer opens its explanation — CORRECT, or NOT QUITE — TRY ANOTHER — with the reason.',
      'All four right completes the lab. It counts toward every certificate and program that needs it.',
      'Passed before? The questions show as done; it never has to be taken twice.',
    ],
    teaches: [
      'Whether the voice’s ideas stuck: what a filter needs to work on, where an LFO can go, how brightness can follow a note, and the signal order.',
      'Each question ties to something THE PATCH shows on EXPLORE.',
    ],
    tryThis: [
      'Unsure about the audio order? On EXPLORE, follow the amber cables under AUDIO PATH → OUT from left to right.',
      'Unsure about LFO destinations? On EXPLORE, pick PATCH → WOBBLE and switch the LFO destination in MOD — watch where the blue cable goes.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function modularScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? MODULAR_SCREEN_GUIDES[mode] : undefined;
}
