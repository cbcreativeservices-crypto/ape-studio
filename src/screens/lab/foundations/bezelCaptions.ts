/**
 * First-visit bezel captions for the labs F5 owns (lab fix round 2026-11-14,
 * phase 2, S3's BezelItem.caption): 1–3 plain words, at most 14 characters,
 * saying what the number MEANS, never a second unit. Shown on the learner's
 * first visit to a stage only (BezelReadouts / bezelFirstSight).
 *
 * Keyed by the readout's key; a key with a live part ("LOSS @ 1 kHz",
 * "MODE (1,0)", "EFF @ 2.0k") is matched on its stem (captionKey). Keys that
 * are already plain words (BOXES, LEVEL, AREA…) carry none. Pure, so the
 * 14-character rule is tested.
 */
import type { BezelItem } from '../rack/rackTypes';

/** "LOSS @ 1 kHz" → "LOSS @", "MODE (1,0)" → "MODE (", "c @60m 24°" → "c @". */
export function captionKey(k: string): string {
  const at = k.indexOf('@');
  if (at > 0) return `${k.slice(0, at).trim()} @`;
  const par = k.indexOf('(');
  if (par > 0) return `${k.slice(0, par).trim()} (`;
  return k;
}

export const WAVE_CAPTIONS: Readonly<Record<string, string>> = {
  // Modules 1–8
  DIRECT: 'straight path',
  '1ST REFL': 'first bounce',
  'REFL LVL': 'echo vs direct',
  'LOSS/BNC': 'per bounce',
  '1 BOUNCE': 'energy kept',
  'α 125 Hz': 'share absorbed',
  'α 4 kHz': 'share absorbed',
  'α @': 'share absorbed',
  'TOP WALL': 'mirror/scatter',
  DEPTH: 'well depth',
  'MIN ƒ': 'works above',
  'c GROUND': 'sound speed',
  'c @': 'speed up high',
  BEND: 'ray bends',
  'H @': 'ray height',
  λ: 'one wave long',
  BARRIER: 'wall height',
  'FRESNEL N': 'shadow depth',
  'LOSS @': 'shadow loss',
  'S1 PATH': 'to speaker 1',
  'S2 PATH': 'to speaker 2',
  'Δ PATH': 'extra distance',
  'vs 1 SPKR': 'vs one speaker',
  Δt: 'echo delay',
  '1ST NULL': 'lowest dip',
  SPACING: 'dip to dip',
  'MIC→WALL': 'gap to wall',
  'MODE (': 'room note',
  TYPE: 'mode family',
  PRESSURE: 'at your seat',
  VERDICT: 'loud or quiet',
  // Modules 9–16
  'NOM COV': 'rated width',
  'EFF @': 'real width',
  'vs ON-AXIS': 'vs straight on',
  LEN: 'array length',
  'LF CTRL': 'controls lows',
  REQ: 'delay needed',
  SET: 'your delay',
  'OFF BY': 'timing error',
  SUM: 'vs perfect',
  DELAY: 'rear sub wait',
  FRONT: 'level in front',
  REAR: 'level behind',
  'F − R': 'front vs back',
  STEER: 'beam angle',
  'Δt/BOX': 'wait per box',
  GRATING: 'extra beams',
  'vs STRAIGHT': 'vs no steering',
  GAP: 'to 1st bounce',
  'FAR WALL': 'echo delay',
  'RT 125': 'lows ring',
  'RT 500': 'mids ring',
  'RT 2K': 'highs ring',
  RT60: 'ring time',
  ROOM: 'room size',
  'LVL @': 'level here',
  '1ST ARR': 'first arrival',
};

export const FOUNDATIONS_CAPTIONS: Readonly<Record<string, string>> = {
  FREQ: 'cycles a sec',
  MODEL: 'drawing speed',
  λ: 'one wave long',
  FITS: 'waves in room',
  'ABOVE 110': 'octaves up',
  AMP: 'swing size',
  SEND: 'level sent',
  HEARD: 'what ear gets',
  F0: 'base note',
  SEL: 'chosen layer',
  UNMIX: 'pulled apart',
  OUT: 'sum level',
  SUM: 'A plus B',
  'A (': 'fixed tone',
  'B (': 'your tone',
  PERIOD: 'one cycle',
};

export const MIC_CAPTIONS: Readonly<Record<string, string>> = {
  PICKUP: 'how well heard',
  DIST: 'mouth to mic',
  DIRECT: 'voice share',
  ROOM: 'room share',
  BOOST: 'bass lift',
  ANGLE: 'turned away',
  '@100 Hz': 'bass change',
  '@8 kHz': 'treble change',
  'BLAST AT CAPSULE': 'air at mic',
  'INTO MIC': 'shake at mic',
  GRIP: 'hand position',
  PATTERN: 'pickup shape',
};

export const SPEAKER_CAPTIONS: Readonly<Record<string, string>> = {
  EDIT: 'sliders move',
  PATTERN: 'wide × tall',
  'V PATTERN': 'tall coverage',
  TILT: 'aim down',
};

export const ROOM_CAPTIONS: Readonly<Record<string, string>> = {
  'RATIO S:M:L': 'room shape',
  MODE: 'room note',
  'AT EARS': 'note at you',
  'EARLY <15ms': 'quick echoes',
  '1ST': 'first echo',
  TREATED: 'paths treated',
  'RT60 500': 'mids ring',
  'RT60 125 ≈': 'lows ring',
  'VS BARE': 'vs empty room',
  'L−R': 'left vs right',
  // SUGGESTED SETUPS (2026-11-14)
  SETUP: 'which setup',
  'DIPS+PEAKS': 'bass at you',
  'STRONG <15ms': 'strong echoes',
  'WARNINGS !': 'look at first',
};

/** Adds the caption for each cell from a dictionary; a cell's own caption wins. */
export function withCaptions(items: BezelItem[] | undefined, dict: Readonly<Record<string, string>>): BezelItem[] | undefined {
  if (!items) return items;
  return items.map((it) => {
    if (it.caption) return it;
    const c = dict[it.k] ?? dict[captionKey(it.k)];
    return c ? { ...it, caption: c } : it;
  });
}
