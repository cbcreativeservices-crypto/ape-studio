/**
 * THE FREE REEDS — the numbers Lab 3's harmonica (A10) and accordion (A11)
 * are drawn from, each with its provenance (charter §2: a fact without a
 * source is a flagged PLACEHOLDER — "a drawing default, not a published
 * figure" — never a readout). Pure.
 *
 * Sources: docs/labs/miking/harmonica/SOURCES.md (HOH-ROCKET, HOH-SP20,
 * S-520DX) and GEOMETRY_PROPOSAL.md; docs/labs/miking/accordion/SOURCES.md
 * (S-ACC, HOH-XS, AKG-416, DPA-CLIPS) and GEOMETRY_PROPOSAL.md. The owner's
 * ruling 2026-10-04: none of these keys reach the screen.
 */
import type { Dim, Provenance } from '../../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const trial = (s: string, note: string): Provenance => ({ kind: 'trial', src: s, note });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });

export const IN = 25.4;

/* ═══ the harmonica (a 10-hole diatonic) ═══ */
export const HARMONICA = {
  /** "Length: 10.2 cm / 4.0"" (both maker pages). */
  length: { mm: 102, prov: src('HOH-SP20', 'Length: 10.2 cm / 4.0"') } as Dim,
  holes: { mm: 10, prov: src('HOH-ROCKET', 'Number of holes: 10') } as Dim,
  /** 20 reeds for 10 holes: two reeds per hole (one sounds on the blow, one on the draw). */
  reeds: { mm: 20, prov: src('HOH-ROCKET', 'Reeds… 20, brass') } as Dim,
  height: placeholder(26, 'the harmonica’s height (comb and cover plates): drawing default 26'),
  depth: placeholder(28, 'the harmonica’s depth, mouth side to back: drawing default 28'),
  /** The comb's channels and the reed plates inside the covers: drawing defaults. */
  combH: placeholder(10, 'the comb’s thickness: drawing default 10'),
  plateT: placeholder(1.2, 'a reed plate’s thickness: drawing default 1.2'),
  /** Where the player holds it: the mouth 1550 mm above the floor (standing). */
  mouthH: placeholder(1550, 'the mouth’s height above the floor for a standing player: drawing default 1550'),
  /** The hands' working envelope round the harmonica (open … cupped): an
   *  ellipsoid 140 × 120 × 120 in the proposal, drawn as a capsule. */
  handsX: placeholder(140, 'the hands’ envelope, front to back: drawing default 140'),
  handsY: placeholder(120, 'the hands’ envelope, up–down: drawing default 120'),
  handsZ: placeholder(120, 'the hands’ envelope, across: drawing default 120'),
  /** The breath leaving the back of the harmonica: a cone, half-angle 20°, 200 long. */
  breathHalf: placeholder(20, 'the breath stream’s half-angle: drawing default 20°'),
  breathLen: placeholder(200, 'the breath stream drawn 200 mm long: drawing default'),
  /** The acoustic stand mic's starting distance: the lesson's own practical
   *  trial, NOT a published harmonica standard (lesson L25). */
  standMin: { mm: 150, prov: trial('LESSON-HM', 'A distance around 15–30 cm is a practical trial, not a published harmonica standard') } as Dim,
  standMax: { mm: 300, prov: trial('LESSON-HM', 'A distance around 15–30 cm is a practical trial, not a published harmonica standard') } as Dim,
} as const;

/** The dedicated harp mic (a high-impedance omni bullet, the lesson's example). */
export const BULLET = {
  d: { mm: 63, prov: src('S-520DX', '63 mm (2.5 in) max diameter') } as Dim,
  l: { mm: 82.6, prov: src('S-520DX', '82.6 mm (3 1/4 in) long') } as Dim,
  pattern: src('S-520DX', 'Polar Pattern Omnidirectional'),
  hiZ: src('S-520DX', 'An attached cable with a standard 1/4-inch phone plug allows the microphone to be connected to a high-impedance device.'),
  transformer: src('S-520DX', 'a low-to-high impedance-matching line transformer, such as the Shure model A95U'),
  knob: src('S-520DX', 'Adjust the volume of monitors or loudspeakers… so that no feedback is present when the volume control knob on the harmonica microphone is at its maximum setting.'),
  startLow: src('S-520DX', 'The volume control on the microphone should be turned down before plugging it into an amplifier.'),
} as const;

/* ═══ the accordion (a full-size piano accordion) ═══ */
export const ACCORDION = {
  keys: { mm: 41, prov: src('S-ACC', 'A full-size accordion has 41 treble keys and 120–140 buttons for the bass.') } as Dim,
  buttons: { mm: 120, prov: src('S-ACC', 'A full-size accordion has 41 treble keys and 120–140 buttons for the bass.') } as Dim,
  /** Treble box: height (y) × thickness along the bellows (z) × depth front to back (x). */
  trebleH: placeholder(480, 'the treble box’s height: drawing default 480'),
  trebleW: placeholder(200, 'the treble box’s thickness, keyboard included: drawing default 200'),
  trebleD: placeholder(180, 'the treble box’s depth, chest to front: drawing default 180'),
  bassH: placeholder(480, 'the bass box’s height: drawing default 480'),
  bassW: placeholder(140, 'the bass box’s thickness: drawing default 140'),
  bassD: placeholder(180, 'the bass box’s depth: drawing default 180'),
  /** The bellows between the boxes, measured at the bass edge. */
  bellowsClosed: placeholder(100, 'the bellows closed: drawing default 100'),
  bellowsMax: placeholder(600, 'the bellows’ maximum opening at the bass edge: drawing default 600'),
  fanMax: placeholder(35, 'how far the bellows fan open, the bottom more than the top: drawing default up to 35°'),
  /** The treble grille on the treble box's front face, and the bass outlets. */
  grilleH: placeholder(300, 'the treble grille’s height: drawing default 300'),
  grilleW: placeholder(80, 'the treble grille’s width: drawing default 80'),
  /** The accordion's grille centre at chest height for a standing player. */
  grilleHt: placeholder(1150, 'the treble grille’s centre above the floor for a standing player: drawing default 1150'),
  /** A cable's slack for the full bellows cycle: the maximum opening + 150. */
  cableSlack: placeholder(750, 'cable slack for a bellows-mounted mic: the maximum opening plus 150, a drawing default'),
} as const;

/** The research words behind the accordion's mounts and sources (internal). */
export const ACC_SRC = {
  bothSides: src('S-ACC', 'The sound comes from both sides of the instrument.'),
  timbres: src('S-ACC', 'each accordion surface produces a distinct timbre'),
  airButton: src('HOH-XS', 'The bigger button on the bass keyboard is called the air button.'),
  sides: src('HOH-XS', 'the keys on one side and bass buttons on the other'),
  bellows: src('HOH-XS', 'draw air through the tone channels and tune reeds'),
  diatonic: src('S-ACC', 'The pitch of a single key changes as the bellows are pushed or pulled'),
  akgTwo: src('AKG-416', 'To mic up an accordion optimally, you will need two microphones, one for the bass and one for the treble range.'),
  akgMount: src('AKG-416', 'Mount the C 416III on the bass side of the accordion and point the microphone to one of the sound holes. Align the stand-mounted microphone with the treble side'),
  akgHyper: src('AKG-416', 'The C 416III is a miniature hypercardioid condenser microphone'),
  aClip: src('DPA-CLIPS', 'A-CLIP allows a user to mount a 4099 CORE+ Instrument Microphones to an accordion. The mic clip can be attached permanently to the instrument using screws if desired.'),
  strap: src('S-ACC', 'MX185 "Clipped onto shoulder strap"'),
  internal: src('S-ACC', 'Chris favored his accordion’s internal mics for live performance because they’re convenient'),
} as const;
