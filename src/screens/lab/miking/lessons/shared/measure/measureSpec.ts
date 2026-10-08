/**
 * FRAME M — the shared MEASUREMENT family's facts (measurement_mics/
 * GEOMETRY_PROPOSAL.md §1–§2; source keys in measurement_mics/SOURCES.md §0).
 * Built once by Lab 6 group 4 (branch lab6-g4) for F11–F16. Pure data.
 *
 * Frame M (the bench / chain view): origin = the capsule's diaphragm centre,
 * +x along the capsule axis (its FRONT), +y down, millimetres. Scenes larger
 * than a bench (F12's site, F13's room, F14's venue) use scene frame F
 * (lessons/shared/field/sceneFrame.ts) and place these objects in it.
 *
 * Value classes (as lead_vocal/GEOMETRY_PROPOSAL.md): SOURCED, DERIVED (from a
 * name or a calculator), PRACTICE, and DRAWING DEFAULT (`placeholder: true` —
 * a size the drawing needs, never printed as a readout or taught as a rule).
 * No maker's likeness: every object is generic.
 */
import type { Dim, Provenance } from '../../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const derived = (reason: string): Provenance => ({ kind: 'illustrative', reason: `DERIVED: ${reason}` });
const drawing = (mm: number, reason: string): Dim => ({ mm, prov: ill(`drawing default: ${reason}`), placeholder: true });

/** Nominal capsule diameters, from the names "1/2 inch" and "1/4 inch". */
export const CAPSULE = {
  half: { mm: 12.7, prov: derived('"1/2 inch" = 12.7 mm (conv.)') } as Dim,
  quarter: { mm: 6.35, prov: derived('"1/4 inch" = 6.35 mm (conv.)') } as Dim,
};

/** Drawing defaults for the generic measurement mic and its parts. */
export const MEAS_DIMS = {
  /** The 1/2 in mic with its preamp, front of the grid to the connector. */
  bodyHalf: drawing(185, 'a 1/2 in capsule on a preamp of the same diameter; no length is sourced'),
  /** The 1/4 in mic with its preamp (the preamp is wider than the capsule). */
  bodyQuarter: drawing(150, 'a 1/4 in capsule on a slim preamp; no length is sourced'),
  /** The removable protection grid's length ahead of the diaphragm. */
  grid: drawing(9, 'the protection grid cap over the diaphragm'),
  /** A foam windscreen ball's diameter (outdoor work). */
  windscreen: drawing(90, 'a foam ball over the capsule; no diameter is sourced'),
  /** A complete sound level meter, capsule to base, and its body width. */
  slmLength: drawing(300, 'a handheld meter with its capsule on a neck; no size is sourced'),
  slmWidth: drawing(74, 'the handheld meter body'),
  /** The calibrator body (a cylinder with the coupler cavity at one end). */
  calibratorLength: drawing(110, 'a handheld field calibrator'),
  calibratorDiameter: drawing(56, 'a handheld field calibrator'),
  /** The operator keep-away ring about the capsule (owner list item 3). */
  keepAway: { mm: 1000, prov: ill('drawing default 1 m: the method sets the real distance (F11 L35 "as required by the method")'), placeholder: true } as Dim,
};

/** The field calibrator's outputs (NTI-CAL): 94 or 114 dB at 1 kHz. */
export const CALIBRATOR = {
  levels: [94, 114] as const,
  freqHz: 1000,
  prov: src('NTI-CAL', 'delivers 94 or 114 dB at a frequency of 1 kHz'),
  /** A 1/4 in capsule needs the calibrator's adapter (NTI-CAL). */
  adapterProv: src('NTI-CAL', 'optional "1/4″ Calibration Adapter"'),
} as const;

/** The three response types (GRAS-FF) — the same body; the field differs. */
export type FieldType = 'freeField' | 'pressure' | 'random';
export const FIELD_TYPES: readonly { id: FieldType; label: string; short: string; field: string; aim: string; prov: Provenance }[] = [
  {
    id: 'freeField',
    label: 'Free-field response',
    short: 'FREE FIELD',
    field: 'Sound arriving mostly from one direction — a loudspeaker test, a source in the open.',
    aim: 'Point it as its data says — often straight at the source (0°).',
    prov: src('GRAS-FF', 'measure the sound pressure as it was before the microphone was introduced'),
  },
  {
    id: 'pressure',
    label: 'Pressure response',
    short: 'PRESSURE',
    field: 'The pressure at the diaphragm itself — inside a calibrator’s coupler, or flush in a boundary.',
    aim: 'Seated in the coupler, or flush with the surface — the cavity and the seal matter.',
    prov: src('GRAS-FF', 'the actual sound pressure on the surface of the … diaphragm'),
  },
  {
    id: 'random',
    label: 'Random-incidence response',
    short: 'RANDOM',
    field: 'Sound arriving from many directions at once — a reverberant room, as the method assumes.',
    aim: 'No single direction: set it up as its data and the method say.',
    prov: src('GRAS-FF', 'sound comes from many directions'),
  },
];

/** The three power paths (GRAS-POL, not re-read: standard measurement facts). */
export type PowerPath = 'polarization' | 'ccp' | 'phantom';
export const POWER_PATHS: readonly { id: PowerPath; label: string; short: string; text: string; prov: Provenance }[] = [
  { id: 'polarization', label: 'Polarization supply', short: 'POLARIZATION', text: 'A dedicated supply for an externally polarized capsule and its preamp.', prov: ill('GRAS-POL (not re-read): an externally polarized condenser may need a dedicated polarization supply') },
  { id: 'ccp', label: 'Constant-current input', short: 'CONST. CURRENT', text: 'A constant-current preamp input — the usual path for a prepolarized mic and its preamp.', prov: ill('GRAS-POL (not re-read): a prepolarized microphone often uses a constant-current preamp input') },
  { id: 'phantom', label: '48 V phantom power', short: '48 V PHANTOM', text: 'An ordinary mic input’s phantom power — not automatically suitable for a measurement mic.', prov: ill('F11 L26: "not automatically compatible with ordinary 48 V phantom power"') },
];

/** A seated and a standing listener's ear height (MEYER-MAPP) — used as a
 *  sensible receiver height ("seated ear height"), never as a rule. */
export const LISTENER_HEIGHT = {
  seated: { mm: 1200, prov: src('MEYER-MAPP', '1.2 m (~4 ft.) for seated audience') } as Dim,
  standing: { mm: 1700, prov: src('MEYER-MAPP', '1.7 m (~5.6 ft.) for standing audience') } as Dim,
};

/** One-frequency check: what the calibrator verifies (F11 L33). */
export const ONE_FREQUENCY_LIMIT = 'A check at one frequency verifies the chain near that frequency, under the coupler’s conditions — not the whole frequency range, the response off axis, or a damaged grid.';
