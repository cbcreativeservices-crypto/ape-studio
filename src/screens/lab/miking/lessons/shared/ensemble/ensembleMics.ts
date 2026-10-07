/**
 * Microphones BY PROPERTY for Lab 5's arrays and supports (E11–E16). Generic
 * types; their sizes and patterns come from documented products kept in
 * `examples` and every `prov` — the INTERNAL record only (owner ruling
 * 2026-10-04: no brand or model name on screen). Merged into MIC_TYPES by
 * data/micTypes.ts. Research: full_orchestra/SOURCES.md §A.
 *
 * Reference point: the FRONT of the mic (an end-address pencil's grille; a
 * side-address body's FACE), not its acoustic centre.
 */
import type { MicType } from '../../../engine/model/types.ts';

const unk = (needed: string) => ({ kind: 'unknown', needed }) as const;
const generic = { kind: 'sourced', src: 'WP-MIC', quote: 'a superposition of an omnidirectional (pressure) and a figure-8 (pressure gradient)' } as const;

/** A pencil condenser's drawn body (the kit lessons' pencil: 104 mm long, Ø 21 drawing default). */
const pencil = {
  length: { mm: 104, prov: { kind: 'sourced', src: 'AX-DPE8', quote: 'SCX1 length "104 mm / 4.1 in"' } as const },
  radius: { mm: 10.5, prov: unk('a pencil condenser’s diameter (drawing default Ø 21 mm)'), placeholder: true },
};

export const ENSEMBLE_MIC_TYPES: Record<string, MicType> = {
  arrOmni: {
    id: 'arrOmni',
    label: 'Small-diaphragm condenser, omni, on a tall stand',
    short: 'OMNI',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'omni', label: 'omni (textbook shape)', prov: { kind: 'sourced', src: 'DPA-AB-ORCH', quote: 'an AB pair, commonly omnidirectional (the orchestral example)' } }],
    body: pencil,
    power: 'phantom power (48 V) for most',
    mount: 'stand',
    examples: [{ model: 'small omni pressure condensers (the orchestral A/B example; the tree’s three omnis)', fact: 'omni capsules for a spaced pair and a tree; body drawn as the kit lessons’ pencil (104 mm, Ø 21 drawing default).', src: 'DPA-AB-ORCH' }],
    art: 'sdc',
    blurb: 'A small condenser that hears all round: the usual choice for a spaced pair, a tree and outriggers — the ensemble with its room. Needs phantom power.',
  },
  arrCard: {
    id: 'arrCard',
    label: 'Small-diaphragm condenser, cardioid, on a tall stand',
    short: 'CARDIOID',
    transducer: 'condenser',
    address: 'end',
    patterns: [
      { id: 'cardioid', label: 'cardioid', prov: { kind: 'sourced', src: 'DPA-STEREO', quote: 'a pair of first-order cardioid microphones' } },
      { id: 'omni', label: 'omni capsule (textbook shape)', prov: generic },
    ],
    body: pencil,
    power: 'phantom power (48 V) for most',
    mount: 'stand',
    examples: [{ model: 'matched small cardioid condensers (X/Y, ORTF; section supports)', fact: 'cardioid pencils for a coincident or near-coincident pair, and for a section support aimed across three or four players.', src: 'DPA-MULTI' }],
    art: 'sdc',
    blurb: 'A small condenser that favours what is in front of it: a coincident or near-coincident pair, or a support aimed across a few players. Needs phantom power.',
  },
  arrFig8: {
    id: 'arrFig8',
    label: 'Figure-8 condenser, side-address (the Side of an M/S pair)',
    short: 'FIGURE-8',
    transducer: 'condenser',
    address: 'side',
    patterns: [{ id: 'figure8', label: 'figure-8 (textbook shape)', prov: { kind: 'sourced', src: 'UA-MS', quote: 'Side: a bidirectional (figure-8) microphone facing sideways' } }],
    body: {
      length: { mm: 50, prov: unk('a side-address figure-8 body’s depth (drawing default 50 mm)'), placeholder: true },
      radius: { mm: 25, prov: unk('a side-address figure-8 body’s width (drawing default 50 mm)'), placeholder: true },
      width: { mm: 150, prov: unk('a side-address figure-8 body’s height (drawing default 150 mm)'), placeholder: true },
    },
    power: 'phantom power (48 V) for most',
    mount: 'stand',
    examples: [{ model: 'a figure-8 condenser (M/S Side)', fact: 'hears front and back, rejects its sides; the Side mic of an M/S pair faces left and right.', src: 'UA-MS' }],
    art: 'sideLdc',
    blurb: 'Hears front and back equally, with opposite polarity, and rejects its sides: turned sideways over a Mid mic it is the Side of an M/S pair. Needs phantom power.',
  },
};
