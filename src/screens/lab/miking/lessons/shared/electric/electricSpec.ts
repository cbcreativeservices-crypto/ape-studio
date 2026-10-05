/**
 * ELECTRIC STRING INSTRUMENTS — where things are, for the drawings and the
 * string display (Lab 4's amplified-chain lessons). Pure; tested.
 *
 * The miked source in these lessons is the AMPLIFIER'S SPEAKER, so the
 * instruments are drawn only to name their parts (ORIENT), to place the
 * pickup on the string (HOW IT SOUNDS) and to draw the player's space (THE
 * SETTING). The research sources the pedal steel's PART NAMES (SGF-MAP:
 * necks, pedal rods & pedals, knee levers, pickups, pedal stops) but no
 * dimension of any of the three instruments: every size below is a DRAWING
 * DEFAULT (`placeholder: true`), recorded in each lesson's `unknowns` and
 * never shown as a readout. Scale lengths are common ones (the 25.5 in and
 * 34 in figures appear in the Lab 4 research for acoustic instruments only);
 * the steel's 24 in is a drawing default.
 *
 * Local frame for every instrument: u along the strings, 0 at the NUT (or the
 * keyhead end) and L at the BRIDGE; v across, + toward the player's side
 * (front view) — millimetres.
 */
import type { Dim } from '../../../engine/model/types.ts';

const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });
const IN = 25.4;

export type PickupSpot = { id: string; label: string; short: string; fromBridge: number };
export type ElectricSpec = {
  id: 'guitar' | 'bass' | 'pedalSteel' | 'lapSteel';
  /** Nut (or keyhead end) to bridge saddle. */
  scale: Dim;
  strings: number;
  /** The open strings, low to high (MIDI note numbers). */
  openMidi: readonly number[];
  pickups: readonly PickupSpot[];
  frets: number;
  /** Body outline: from u = bodyU0 to the tail, half-width at the bouts. */
  bodyU0: number;
  bodyLen: number;
  bodyHalfW: number;
  neckHalfW: [number, number];
  headLen: number;
};

export const GUITAR: ElectricSpec = {
  id: 'guitar',
  scale: placeholder(25.5 * IN, 'the electric guitar’s scale length: a common 25.5 in, a drawing default'),
  strings: 6,
  openMidi: [40, 45, 50, 55, 59, 64],
  pickups: [
    { id: 'neck', label: 'neck pickup', short: 'NECK', fromBridge: 160 },
    { id: 'middle', label: 'middle pickup', short: 'MIDDLE', fromBridge: 100 },
    { id: 'bridge', label: 'bridge pickup', short: 'BRIDGE', fromBridge: 41 },
  ],
  frets: 21,
  bodyU0: 25.5 * IN - 240,
  bodyLen: 410,
  bodyHalfW: 160,
  neckHalfW: [21, 28],
  headLen: 175,
};

export const BASS: ElectricSpec = {
  id: 'bass',
  scale: placeholder(34 * IN, 'the electric bass’s scale length: a common 34 in, a drawing default'),
  strings: 4,
  openMidi: [28, 33, 38, 43],
  pickups: [
    { id: 'neck', label: 'neck pickup', short: 'NECK', fromBridge: 210 },
    { id: 'bridge', label: 'bridge pickup', short: 'BRIDGE', fromBridge: 95 },
  ],
  frets: 20,
  bodyU0: 34 * IN - 300,
  bodyLen: 460,
  bodyHalfW: 175,
  neckHalfW: [21, 32],
  headLen: 200,
};

export const PEDAL_STEEL: ElectricSpec = {
  id: 'pedalSteel',
  scale: placeholder(24 * IN, 'the pedal steel’s scale length: drawing default 24 in'),
  strings: 10,
  // A common ten-string tuning, string 10 (nearest the player) to string 1
  // (a drawing default for the string display): B D E F# G# B E G# D# F#.
  openMidi: [47, 50, 52, 54, 56, 59, 64, 68, 63, 66],
  pickups: [{ id: 'bridge', label: 'pickup', short: 'PICKUP', fromBridge: 50 }],
  frets: 24,
  bodyU0: -110,
  bodyLen: 900,
  bodyHalfW: 150,
  neckHalfW: [45, 45],
  headLen: 0,
};

export const LAP_STEEL: ElectricSpec = {
  id: 'lapSteel',
  scale: placeholder(22.5 * IN, 'the lap steel’s scale length: drawing default 22.5 in'),
  strings: 6,
  openMidi: [43, 47, 50, 55, 59, 62],
  pickups: [{ id: 'bridge', label: 'pickup', short: 'PICKUP', fromBridge: 45 }],
  frets: 24,
  bodyU0: -90,
  bodyLen: 700,
  bodyHalfW: 75,
  neckHalfW: [38, 38],
  headLen: 0,
};

/** The pedal steel on its legs, from the audience side (u along, y down; floor at 0). */
export const STEEL_FRAME = {
  bodyLen: placeholder(900, 'the pedal steel body’s length: drawing default 900'),
  bodyDepth: placeholder(300, 'the pedal steel body’s depth (front to back): drawing default 300'),
  bodyH: placeholder(90, 'the pedal steel body’s height: drawing default 90'),
  topY: placeholder(700, 'the top of the pedal steel above the floor: drawing default 700'),
  pedals: placeholder(3, 'the number of floor pedals: drawing default 3'),
  pedalRackDepth: placeholder(200, 'the pedal rack’s depth: drawing default 200'),
  kneeLevers: placeholder(4, 'the number of knee levers: drawing default 4'),
  kneeDrop: placeholder(150, 'how far the knee levers hang below the body: drawing default 150'),
  seatH: placeholder(550, 'the player’s seat height: drawing default 550'),
  legsZone: { w: placeholder(1000, 'the pedal-and-knee-lever working zone’s width: drawing default 1000'), d: placeholder(600, 'its depth: drawing default 600') },
} as const;

/** Every string's open frequency (Hz), low to high. */
export function openHz(spec: ElectricSpec): number[] {
  return spec.openMidi.map((m) => 440 * Math.pow(2, (m - 69) / 12));
}

/** Fret n's distance from the nut (ideal equal temperament). */
export function fretU(n: number, L: number): number {
  return L * (1 - Math.pow(2, -n / 12));
}
