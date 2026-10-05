/**
 * HAND-DRUM FAMILY — microphones BY PROPERTY (congas, bongos, timbales,
 * djembe). Generic types; the products their sizes and specs were read from
 * are the INTERNAL record (`examples`, every `prov`) — never shown (owner
 * ruling 2026-10-04). Registered beside the kick's types in data/micTypes.ts.
 *
 * Source keys: docs/labs/miking/snare/SOURCES.md (S-SM57-UG), toms/SOURCES.md
 * (AX-D2, AX-D4), overheads/GEOMETRY_PROPOSAL.md (pencil condenser drawing
 * default, AX-SCX1 length), congas/SOURCES.md (DPA-JB) and the retailer
 * listing logged in congas/SOURCES.md (MKT-4099). A size no maker sheet
 * confirmed is a flagged placeholder (drawn, never printed as a spec).
 */
import type { MicType, Provenance } from '../../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const generic = src('WP-MIC', 'a superposition of an omnidirectional (pressure) and a figure-8 (pressure gradient)');

export const HAND_DRUM_MIC_TYPES: Record<string, MicType> = {
  hdDynCard: {
    id: 'hdDynCard',
    label: 'Compact dynamic, cardioid',
    short: 'DYN · CARD',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: src('S-SM57-UG', 'Cardioid') }],
    body: {
      length: { mm: 157, prov: src('S-SM57-UG', '157 mm (6 3/16 in.) overall length (p.6 drawing)') },
      radius: { mm: 16, prov: src('S-SM57-UG', '32 mm (1 1/4 in.) grille/front diameter (p.6 drawing)') },
    },
    power: 'none needed (dynamic)',
    mount: 'stand',
    examples: [{ model: 'Shure SM57', fact: '"Dynamic (moving coil)"; "Cardioid"; 157 mm long, 32 mm grille, 23 mm tail; no max SPL printed.', src: 'S-SM57-UG' }],
    art: 'kickDynamic',
    blurb: 'A rugged, compact dynamic with a cardioid pattern — a practical close choice amid a loud band. Needs no power.',
  },
  hdDynHyper: {
    id: 'hdDynHyper',
    label: 'Compact dynamic, hypercardioid (short body)',
    short: 'DYN · HYPER',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'hypercardioid', label: 'hypercardioid', prov: src('AX-D2', 'The polar pattern of the microphone shall be hypercardioid') }],
    body: {
      length: { mm: 100, prov: src('AX-D2', '100 mm in length (D2 and D4 alike)') },
      radius: { mm: 19.5, prov: src('AX-D2', '39 mm in diameter at the widest point') },
    },
    power: 'none needed (dynamic)',
    mount: 'stand',
    examples: [
      { model: 'Audix D2', fact: 'hypercardioid; 100 mm × Ø 39 mm (widest); applications "Rack tom, floor tom congas"; "in excess of 144 dB".', src: 'AX-D2' },
      { model: 'Audix D4', fact: 'same body; applications include "djembe".', src: 'AX-D4' },
    ],
    art: 'kickDynamic',
    blurb: 'A short-bodied dynamic with a tight hypercardioid pattern, made to sit close to a drumhead without crowding the player. Needs no power.',
  },
  hdSdc: {
    id: 'hdSdc',
    label: 'Small-diaphragm condenser (pencil), cardioid',
    short: 'CONDENSER',
    transducer: 'condenser',
    address: 'end',
    patterns: [
      { id: 'cardioid', label: 'cardioid', prov: generic },
      { id: 'omni', label: 'omni (textbook shape)', prov: generic },
    ],
    body: {
      length: { mm: 104, prov: src('AX-SCX1', '104 mm / 4.1 in (overheads/GEOMETRY_PROPOSAL.md)') },
      radius: { mm: 10.5, prov: unk('a pencil condenser’s body diameter (drawing default Ø 21 mm, overheads/GEOMETRY_PROPOSAL.md)'), placeholder: true },
    },
    power: 'phantom power (check the maker’s figure and your desk)',
    mount: 'stand',
    examples: [{ model: 'Shure KSM137 (Duvel, djembe); Audix SCX1 (length)', fact: 'pencil condensers named in the hand-drum research; KSM137 pattern not printed in the article.', src: 'S-DUVEL' }],
    art: 'sdc',
    blurb: 'A slim condenser that can cover the hand detail of a whole pair in a controlled room. Needs phantom power; check its maximum level against loud slaps.',
  },
  hdClip: {
    id: 'hdClip',
    label: 'Miniature clip-on condenser, supercardioid',
    short: 'CLIP-ON',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'supercardioid', prov: src('MKT-4099', 'Directional Pattern: "Supercardioid" (retailer listing)') }],
    body: {
      length: { mm: 50, prov: src('MKT-4099', 'Microphone Length: "1.97" (50mm)" (retailer listing)') },
      radius: { mm: 9, prov: unk('the capsule’s diameter (the listing’s 5.7 mm looks like the gooseneck; drawing default Ø 18 mm)'), placeholder: true },
    },
    neck: { mm: 140, prov: src('MKT-4099', 'Gooseneck Length: "5.5" (140mm)" (retailer listing)') },
    power: 'phantom power through its adapter',
    mount: 'clip',
    examples: [{ model: 'DPA 4099', fact: 'touring case: "4099s on high and low congas, the bongos, two toms and two timbales"; listing: supercardioid, 50 mm, gooseneck 140 mm, 145 dB SPL peak.', src: 'DPA-JB' }],
    art: 'clipMini',
    blurb: 'A tiny condenser on a short gooseneck that clips to the rim and moves with the drum — little stage space, independent control. Needs phantom power through its adapter.',
  },
};
