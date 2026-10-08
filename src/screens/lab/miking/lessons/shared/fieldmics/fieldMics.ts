/**
 * FIELD MICS — microphones BY PROPERTY that Lab 6 (Foley, field and
 * scientific) adds, shared by every Lab 6 lesson and Lab 7 (built once by
 * group 1, lab6-g1; foley_footsteps/GEOMETRY_PROPOSAL.md §4, SOURCES.md §c).
 * Generic types; the products their sizes were read from are the INTERNAL
 * record only (owner ruling 2026-10-04: no brand or model on screen).
 * Registered beside the others in data/micTypes.ts.
 *
 *   shotgunShort  a short shotgun on a stand in a shock mount: Ø 19 × 250 mm,
 *                 the CAPSULE 200 mm behind the grille — `pose.p` is the
 *                 capsule (body.fore = the tube ahead of it), so every
 *                 distance is read to the capsule, never to the grille. Its
 *                 base pattern is a supercardioid; above roughly the upper
 *                 mids the lobe narrows (`lobe: 'shotgun'`, a simplified
 *                 picture: engine/physics/shotgun.ts).
 *   shotgunPole   the same mic on a hand-held boom pole ('pole' mount).
 *   scSupercard   a small-diaphragm supercardioid with NO interference tube
 *                 ("a small directional microphone with smooth off-axis
 *                 response … can often be placed closer", SCH-SHOTGUN).
 *   ldcRoom       the shared side-address large condenser (Lab 5's body),
 *                 cardioid or omni — the Foley stage's room / second mic.
 *   hydrophone    a sensor for pressure in WATER — a card only in Lab 6
 *                 part 1 (O-7): never placed, no free-field pattern.
 *   contactSensor a sensor for vibration in a STRUCTURE — a card only.
 *
 * EXPORT NAMES other groups import (keep them): SHOTGUN_SHORT, FIELD_MIC_TYPES.
 */
import type { Dim, MicType, Provenance } from '../../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });

/** The short shotgun's drawn body (drawing defaults from one real model's
 *  published size, SEN-416 search summary, Low: Ø 19 × 250 mm). */
export const SHOTGUN_BODY = {
  /** Behind the capsule: 250 − 200 mm. */
  length: placeholder(50, 'a short shotgun’s body behind the capsule (Ø 19 × 250 mm overall, capsule 200 mm behind the grille — drawing defaults)'),
  radius: placeholder(9.5, 'a short shotgun’s radius (Ø 19 mm, drawing default)'),
  /** The interference tube ahead of the capsule: L_tube (SOURCES.md §c). */
  fore: placeholder(200, 'the interference tube’s length ahead of the capsule (drawing default 200 mm)'),
};

const SHOTGUN_PATTERN = [{ id: 'supercardioid' as const, label: 'supercardioid below the upper mids; narrower above (a simplified picture)', prov: src('SCH-SHOTGUN', 'For wavelengths longer than the tube — at low and midrange frequencies — the tube has little effect … no greater rejection of off-axis sound than the capsule on which it is based. At higher frequencies the pickup pattern becomes narrower') }];
const SHOTGUN_EXAMPLES = [
  { model: 'a short shotgun (the Foley stage pair compared on concrete, wood, leaves and gravel; one studio’s recurring short shotgun)', fact: 'Body Ø 19 × 250 mm (one maker’s specs page, search summary, Low): a drawing default. The capsule sits behind the tube (SCH-SHOTGUN): the readout measures to the capsule.', src: 'SCH-SHOTGUN' },
  { model: 'interference-tube physics', fact: '"Increased interference tube length will result in increased attenuation at lower frequencies"; "when a shotgun microphone is rotated, the surroundings sound different due to shifts in sound color."', src: 'DPA-TUBE' },
];

/** lab6 group 1 — the short shotgun on a stand, in a shock mount. */
export const SHOTGUN_SHORT: MicType = {
  id: 'shotgunShort',
  label: 'Short shotgun, in a shock mount on a stand',
  short: 'SHOTGUN',
  transducer: 'condenser',
  address: 'end',
  patterns: SHOTGUN_PATTERN,
  body: SHOTGUN_BODY,
  lobe: 'shotgun',
  power: 'phantom power (48 V) for most',
  mount: 'stand',
  examples: SHOTGUN_EXAMPLES,
  art: 'shotgunMount',
  blurb: 'A short shotgun: a slotted tube in front of a supercardioid capsule. Through the lows and mids it hears like that capsule; higher up its pickup narrows — and off its axis the tone changes. It does not remove the room’s reflections. Distances are read to the capsule, at the back of the tube. In a shock mount; needs phantom power.',
};

export const FIELD_MIC_TYPES: Record<string, MicType> = {
  shotgunShort: SHOTGUN_SHORT,
  shotgunPole: {
    ...SHOTGUN_SHORT,
    id: 'shotgunPole',
    label: 'Short shotgun, in a shock mount on a hand-held boom pole',
    short: 'SHOTGUN · POLE',
    mount: 'pole',
    blurb: 'The same short shotgun on a boom pole held by an operator — over or to the side of the action, following a short move. The pole, the operator and the cable keep clear of the performer; listen for handling and cable noise. Needs phantom power.',
  },
  scSupercard: {
    id: 'scSupercard',
    label: 'Small-diaphragm condenser, supercardioid, no tube',
    short: 'SMALL SUPER',
    transducer: 'condenser',
    address: 'end',
    patterns: [
      { id: 'supercardioid', label: 'supercardioid', prov: src('SCH-SHOTGUN', 'A small directional microphone with smooth off-axis response … can often be placed closer to a sound source than a shotgun microphone') },
      { id: 'cardioid', label: 'cardioid capsule', prov: src('S-3REASONS', 'cardioid … pickup patterns reduce off-axis sound') },
    ],
    body: {
      length: { mm: 104, prov: src('AX-DPE8', 'SCX1 length "104 mm / 4.1 in" (overheads/GEOMETRY_PROPOSAL.md §5) — the kit lessons’ pencil body') },
      radius: placeholder(10.5, 'a pencil condenser’s diameter (drawing default Ø 21 mm)'),
    },
    power: 'phantom power (48 V) for most',
    mount: 'stand',
    examples: [{ model: 'a small supercardioid condenser without an interference tube', fact: 'The Foley lessons’ comparison mic ("a cardioid or a supercardioid microphone without an interference tube"); the pencil body of the kit lessons.', src: 'SCH-SHOTGUN' }],
    art: 'sdc',
    blurb: 'A small pencil condenser with a supercardioid capsule and no tube: smoother off its axis than a shotgun, so it can often sit a little closer and cover a wider moving area in a real room. Needs phantom power.',
  },
  ldcRoom: {
    id: 'ldcRoom',
    label: 'Large-diaphragm condenser, side-address, for the room',
    short: 'LARGE COND.',
    transducer: 'condenser',
    address: 'side',
    patterns: [
      { id: 'cardioid', label: 'cardioid', prov: src('MIX-2005', 'a Neumann U67 functioning as room microphone') },
      { id: 'omni', label: 'omni (textbook shape)', prov: { kind: 'illustrative', reason: 'a textbook pattern for a multi-pattern condenser' } },
    ],
    body: {
      length: { mm: 80.01, prov: src('S-SM4-WEB', 'height "80.01" (product data), drawn as the depth front to back — Lab 5’s shared large condenser') },
      radius: { mm: 59.004, prov: src('S-SM4-WEB', 'width "118.008" (product data)') },
      width: { mm: 254.991, prov: src('S-SM4-WEB', 'depth "254.991" (product data), drawn as the upright length') },
    },
    power: 'phantom power (48 V)',
    mount: 'stand',
    examples: [
      { model: 'a large-diaphragm studio condenser as the room mic', fact: 'MIX-2005: close shotguns "and a Neumann U67 functioning as room microphone"; another stage used "two mics: one close and one far away". NF-FOLEY: a short shotgun and a large condenser as recurring options.', src: 'MIX-2005' },
    ],
    art: 'sideLdc',
    blurb: 'A side-address studio condenser: as a second, farther mic it hears the action with the room — a perspective to blend, not a replacement for the close mic. Needs phantom power.',
  },
  hydrophone: {
    id: 'hydrophone',
    label: 'Hydrophone (a sensor made for water)',
    short: 'HYDROPHONE',
    transducer: 'hydrophone',
    address: 'end',
    patterns: [{ id: 'unstated', label: 'no pattern drawn (it senses pressure in water)', prov: src('ASE-ELEM', 'a hydrophone for selected internal water sounds') }],
    body: { length: placeholder(60, 'a hydrophone’s body (drawing default)'), radius: placeholder(12, 'a hydrophone’s radius (drawing default)') },
    power: 'as its maker specifies',
    mount: 'surface',
    examples: [{ model: 'an immersion-rated hydrophone', fact: 'ASE-ELEM: a hydrophone for internal water sounds, airborne mics for the surface. Shown as a card only (O-7): never placed.', src: 'ASE-ELEM' }],
    art: 'sdc',
    blurb: 'A sensor built to go INTO water: it hears pressure in the water, not the air above it. Only a model made and rated for immersion — never an ordinary microphone lowered into a basin.',
  },
  contactSensor: {
    id: 'contactSensor',
    label: 'Contact transducer (a sensor on a surface)',
    short: 'CONTACT',
    transducer: 'contact',
    address: 'boundary',
    patterns: [{ id: 'unstated', label: 'no pattern drawn (it senses the surface it touches)', prov: { kind: 'illustrative', reason: 'the lesson’s structure-borne path (F04 L28)' } }],
    body: { length: placeholder(30, 'a contact transducer’s body (drawing default)'), radius: placeholder(12, 'a contact transducer’s radius (drawing default)') },
    power: 'as its maker specifies',
    mount: 'surface',
    examples: [{ model: 'a contact transducer on a dry container wall', fact: 'F04 L28: structure-borne vibration, a distinct path. Shown as a card only.', src: 'ASE-ELEM' }],
    art: 'boundary',
    blurb: 'A sensor that touches a dry surface and hears the vibration IN that surface — the container wall, a board — not the air. A third path, kept on its own labelled track.',
  },
};

/** The same table under a name that cannot be mistaken for Lab 6 group 6's location /
 *  spatial FIELD_MIC_TYPES (lessons/shared/field/fieldMics.ts): data/micTypes.ts imports this one. */
export const FOLEY_MIC_TYPES = FIELD_MIC_TYPES;
