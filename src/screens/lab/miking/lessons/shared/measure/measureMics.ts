/**
 * The MEASUREMENT mic types (frame M; measurement_mics/GEOMETRY_PROPOSAL.md
 * §2). Generic types, no maker's likeness; the internal record names no
 * product, only the source keys of measurement_mics/SOURCES.md §0. Every
 * size is a drawing default (measureSpec.MEAS_DIMS) except the capsule
 * diameters, which come from the names "1/2 inch" and "1/4 inch".
 *
 * Pattern: omni — the drawn lobe is the textbook shape; "omni" is a polar
 * description and NOT the same thing as a field response (F11 L24), which
 * is why the field type is part of each mic's name.
 */
import type { MicType, Provenance } from '../../../engine/model/types.ts';
import { CAPSULE, MEAS_DIMS } from './measureSpec.ts';

const omni: { id: 'omni'; label: string; prov: Provenance } = {
  id: 'omni',
  label: 'omni',
  prov: { kind: 'trial', src: 'GRAS-FF', note: 'a measurement mic is drawn with the textbook omni; its FIELD response is a separate property (F11 L24)' },
};
const half = { length: MEAS_DIMS.bodyHalf, radius: { mm: CAPSULE.half.mm / 2, prov: CAPSULE.half.prov } };
const quarter = { length: MEAS_DIMS.bodyQuarter, radius: { mm: CAPSULE.quarter.mm / 2 + 0.6, prov: { kind: 'illustrative', reason: 'DERIVED: the 1/4 in capsule (6.35 mm) on a slightly wider preamp, drawing default' } as Provenance } };

export const MEASURE_MIC_TYPES: Record<string, MicType> = {
  measFF: {
    id: 'measFF',
    label: '1/2 in measurement mic, free-field response',
    short: 'MEAS · FREE FIELD',
    transducer: 'condenser',
    address: 'end',
    patterns: [omni],
    body: half,
    power: 'its own approved supply: a polarization supply or a constant-current input — never assumed to be 48 V phantom power',
    mount: 'stand',
    examples: [{ model: 'generic 1/2 in free-field measurement microphone on its preamp', fact: 'free-field mics "measure the sound pressure as it was before the microphone was introduced"', src: 'GRAS-FF' }],
    art: 'measMic',
    blurb: 'For sound arriving mostly from one direction — a loudspeaker test, a source in the open. Pointed as its data says, often straight at the source.',
  },
  measRI: {
    id: 'measRI',
    label: '1/2 in measurement mic, random-incidence response',
    short: 'MEAS · RANDOM',
    transducer: 'condenser',
    address: 'end',
    patterns: [omni],
    body: half,
    power: 'its own approved supply: a polarization supply or a constant-current input — never assumed to be 48 V phantom power',
    mount: 'stand',
    examples: [{ model: 'generic 1/2 in random-incidence measurement microphone on its preamp', fact: 'random incidence: "sound comes from many directions"', src: 'GRAS-FF' }],
    art: 'measMic',
    blurb: 'For sound arriving from many directions — a reverberant room, as the method assumes. Set up as its data and the method say.',
  },
  measQuarter: {
    id: 'measQuarter',
    label: '1/4 in measurement mic (high level, small)',
    short: 'MEAS · 1/4 IN',
    transducer: 'condenser',
    address: 'end',
    patterns: [omni],
    body: quarter,
    power: 'its own approved supply; the field calibrator needs its 1/4 in adapter',
    mount: 'stand',
    examples: [{ model: 'generic 1/4 in measurement microphone on its preamp', fact: 'a 1/4 in capsule needs the calibrator’s 1/4 in adapter', src: 'NTI-CAL' }],
    art: 'measMic',
    blurb: 'A smaller capsule for higher levels and higher frequencies. Check its field response in its data; the calibrator needs its adapter.',
  },
  slm: {
    id: 'slm',
    label: 'Sound level meter (complete instrument) with windscreen',
    short: 'METER',
    transducer: 'condenser',
    address: 'end',
    patterns: [omni],
    body: { length: MEAS_DIMS.slmLength, radius: { mm: MEAS_DIMS.slmWidth.mm / 2, prov: MEAS_DIMS.slmWidth.prov } },
    power: 'its own batteries — the meter, its capsule and its settings are one instrument',
    mount: 'stand',
    examples: [{ model: 'generic handheld sound level meter on a tripod', fact: 'a complete meter with its capsule, preamp and settings', src: 'FHWA-FG' }],
    art: 'slm',
    blurb: 'The whole instrument: capsule, preamp, weighting, averaging and the display in one body, on a tripod, with a foam windscreen outdoors.',
  },
};
