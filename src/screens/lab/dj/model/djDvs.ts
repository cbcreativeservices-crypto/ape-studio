/**
 * djDvs — a DIGITAL VINYL SYSTEM on the shared booth (Stage 2, Screen 18;
 * research DJ26). SIMULATED: nothing reads a real control record. Pure
 * TypeScript; pinned by test/djStage2Engine.test.ts.
 *
 * THE RIG (one profile; real systems vary): a CONTROL RECORD on the
 * turntable carries no music — a steady 1 kHz stereo tone whose two sides are
 * 90° apart (quadrature). The turntable feeds the mixer's CH1 PHONO jacks;
 * this mixer sends that phono signal over USB to the laptop as CONTROL. The
 * software reads the tone: its PITCH says how fast the platter turns, the
 * order of its two sides says which way, and (on a real record) a code
 * inside it says where the needle is. It plays the track on its DECK 1 to
 * match, and sends that MUSIC back over USB 1/2 — channel 1 hears it with
 * its input selector on USB. Audio and control share the cable; they are
 * different signals.
 *
 * PLAY MODES:
 *   ABSOLUTE  the record's position IS the track's position: a needle drop
 *             jumps the music, and so does a skip.
 *   RELATIVE  only speed and direction follow the record; a needle drop or a
 *             skip does not move the music.
 *   INTERNAL  the software plays on its own; the turntable is ignored — the
 *             recovery mode when the control signal is lost.
 *   THRU      the software passes the turntable's own sound straight back —
 *             for a normal record. With a CONTROL record that sends the
 *             control TONE to the speakers.
 *
 * SIGNAL QUALITY (0 … 1, this model): the software needs a clean ring.
 *   × 0.6  the turntable's preamp on LINE (the phono stage clips the tone);
 *   × 0.72 no ground wire (hum on the tone);
 *   × 0.62 a dirty record or a worn stylus (noise, dropouts);
 *   ×1 / ×0.85 calibrated / not calibrated since the setup changed —
 *   calibrating (the needle on the still record) teaches it the noise floor.
 * 0.8 and above locks; 0.55 – 0.8 is UNSTABLE (the deck stutters); below,
 * LOST. INTERNAL ignores the record entirely.
 */
import type { Booth } from './djModel.ts';

export type DvsMode = 'ABS' | 'REL' | 'INT' | 'THRU';
export const DVS_MODES: readonly DvsMode[] = ['ABS', 'REL', 'INT', 'THRU'];
export const DVS_MODE_WORDS: Record<DvsMode, string> = { ABS: 'ABSOLUTE', REL: 'RELATIVE', INT: 'INTERNAL', THRU: 'THRU' };

export type DvsState = {
  on: boolean;
  mode: DvsMode;
  /** The control record is on the platter (else a normal record). */
  control: boolean;
  dirty: boolean;
  /** Calibrated for the setup as it is now. */
  calibrated: boolean;
};

export const freshDvs = (): DvsState => ({ on: true, mode: 'ABS', control: true, dirty: false, calibrated: true });

export const CONTROL_HZ = 1000;
export const LOCK_Q = 0.8;
export const LOST_Q = 0.55;

/** The control signal's quality as the software reads it. */
export function dvsQuality(b: Booth): number {
  const d = b.dvs;
  if (!d || !d.control) return 0;
  let q = 1;
  if (b.ttPreamp === 'LINE') q *= 0.6;
  if (b.vinyl && !b.vinyl.gnd) q *= 0.72;
  if (d.dirty) q *= 0.62;
  if (!d.calibrated) q *= 0.85;
  // the control signal only reaches the software from the CH1 PHONO jacks
  if (b.plugs['tt.rcaL'] !== 'ch1.phono.L' || b.plugs['tt.rcaR'] !== 'ch1.phono.R') q = 0;
  if (!b.laptop?.usbMixer || b.laptop.device !== 'MIXER USB') q = 0;
  return q;
}

export type DvsLock = 'LOCKED' | 'UNSTABLE' | 'LOST' | 'IGNORED';
export function dvsLock(b: Booth): DvsLock {
  if (b.dvs?.mode === 'INT') return 'IGNORED';
  const q = dvsQuality(b);
  return q >= LOCK_Q ? 'LOCKED' : q >= LOST_Q ? 'UNSTABLE' : 'LOST';
}

/** The control TONE is reaching the mixer's sound: channel 1 listens to its
 *  PHONO jacks (the raw control record), or the software is in THRU. */
export function toneOnChannel(b: Booth): boolean {
  if (!b.dvs?.on || !b.dvs.control || !b.tt.playing) return false;
  return b.ch[1].input === 'PHONO' || (b.dvs.mode === 'THRU' && b.ch[1].input === 'USB');
}

/** One revolution at 33⅓ rpm: what a skip jumps (s of record time). */
export const REV_SEC = 60 / (100 / 3);

/**
 * The software deck (deck A) following the turntable (both anchored at the
 * same booth time), per the mode — a pure state step the page applies after
 * every turntable change. ABSOLUTE takes the record's position too (so a
 * needle drop or a skip moves the music); RELATIVE keeps its own.
 */
export function dvsFollow(b: Booth): Booth {
  const d = b.dvs;
  if (!d?.on) return b;
  const A = b.decks.A;
  if (d.mode === 'INT' || d.mode === 'THRU') return b;
  const tt = b.tt;
  const lock = dvsLock(b);
  const follows = lock !== 'LOST';
  const playing = tt.playing && follows && !!A.track;
  const posSec = d.mode === 'ABS' ? tt.posSec : A.posSec;
  if (A.playing === playing && A.pitch === tt.pitch && A.posSec === posSec) return b;
  return { ...b, decks: { ...b.decks, A: { ...A, playing, pitch: tt.pitch, posSec } } };
}
