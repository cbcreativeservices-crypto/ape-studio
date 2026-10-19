/**
 * fxKnob — Screen 13's FX KNOB dock key, the pure half (tests reach it):
 * ONE key shows one of three knobs (TIME, FEEDBACK, LEVEL / RETURN), so its
 * LABEL and its short value both name the knob it is showing (learning
 * review 2, p13 #1), and the key is LOCKED while the effect is OFF — a knob
 * on a stopped effect changes nothing anyone can hear or see (D75; p13 #2).
 * FEEDBACK stays locked on the types it does nothing on.
 */
import { FX_TIMES, fxTimeWord, usesFeedback, type FxRoute, type FxState } from '../model/djEffects.ts';

export type FxKnob = 'time' | 'feedback' | 'level';

/** The dock key's word for the knob it shows (≤ 8 characters: it fits the
 *  dock at 390 without cropping). */
export function knobLabel(focus: FxKnob, route: FxRoute): string {
  if (focus === 'time') return 'FX TIME';
  if (focus === 'feedback') return 'FEEDBACK';
  return route === 'SEND' ? 'RETURN' : 'DRY/WET';
}

/** The short value, carrying the knob's initial too: "T ½B", "FB 55%",
 *  "W 50%" (dry/wet) or "R 50%" (the return) — ≤ 6 characters. */
export function knobShort(focus: FxKnob, fx: FxState, v: number): string {
  const pc = `${Math.round(v * 100)}%`;
  if (focus === 'time') {
    const w = fxTimeWord(fx.type, Math.round(v * (FX_TIMES[fx.type].length - 1)));
    return `T ${w.replace(' BEATS', 'B').replace(' BEAT', 'B').replace(' s', 's')}`;
  }
  if (focus === 'feedback') return `FB ${pc}`;
  return `${fx.route === 'SEND' ? 'R' : 'W'} ${pc}`;
}

export const FX_OFF_LOCK = 'Press FX ON first (the FX key) — these knobs shape an effect that is running.';

/** Why the knob is locked, or undefined when it does something. */
export function fxKnobLock(fx: FxState, focus: FxKnob): string | undefined {
  if (!fx.on) return FX_OFF_LOCK;
  if (focus === 'feedback' && !usesFeedback(fx.type)) {
    return `FEEDBACK does nothing on ${fx.type} — it shapes ECHO repeats and the FLANGER’s sharpness. ${fx.type === 'REVERB' ? 'A reverb’s tail is set by TIME.' : 'The sweep is set by TIME.'}`;
  }
  return undefined;
}
