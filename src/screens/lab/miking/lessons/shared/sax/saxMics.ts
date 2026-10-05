/**
 * Microphones BY PROPERTY for Lab 3's saxophones (alto_sax/SOURCES.md §2:
 * Shure's booklets name a dynamic, a condenser and a bell clip; DPA mounts a
 * supercardioid miniature on the bell rim). Generic types; the products the
 * sizes come from stay in `examples` and every `prov` — the INTERNAL record
 * (owner ruling 2026-10-04: no brand or model name on screen). Merged into
 * MIC_TYPES by data/micTypes.ts.
 *
 * The bodies are the shared ones (the compact dynamic of S-SM57-UG, the
 * kit lessons' side-address condenser of S-SM4-WEB); the words are the
 * horn's (the shared `instDynCard` and `roomLdc` speak of a guitar speaker
 * and a drum kit on the microphone page):
 *   saxDynCard   the compact instrument dynamic, cardioid;
 *   saxLdc       the side-address large-diaphragm condenser, cardioid;
 *   saxDynSuper  the same compact dynamic body with a SUPERCARDIOID capsule
 *                (its nulls ≈ 125° off the front, toward the rear — the
 *                Studio-or-live page aims them);
 *   saxClip      a supercardioid miniature on a clip made for the bell rim.
 */
import type { MicType } from '../../../engine/model/types.ts';

const placeholder = (mm: number, needed: string) => ({ mm, prov: { kind: 'unknown', needed } as const, placeholder: true });

export const SAX_MIC_TYPES = {
  saxDynCard: {
    id: 'saxDynCard',
    label: 'End-address instrument dynamic, cardioid',
    short: 'DYN · CARD',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: { kind: 'sourced', src: 'S-SM57-UG', quote: 'Cardioid' } }],
    body: {
      length: { mm: 157, prov: { kind: 'sourced', src: 'S-SM57-UG', quote: '157 mm (6 3/16 in.) overall length (p.6 drawing)' } },
      radius: { mm: 16, prov: { kind: 'sourced', src: 'S-SM57-UG', quote: '32 mm (1 1/4 in.) grille/front diameter (p.6 drawing)' } },
    },
    power: 'none needed (dynamic)',
    mount: 'stand',
    examples: [{ model: 'Shure SM57 (the compact instrument dynamic the S-SAX engineers use close on horns)', fact: '"Dynamic (moving coil)"; "Cardioid"; 157 mm long, 32 mm grille.', src: 'S-SM57-UG' }],
    art: 'smallDynamic',
    blurb: 'A compact instrument dynamic with a cardioid pattern — a common close choice on a horn, live and in the studio. It takes the level a few centimetres from a bell. Needs no power.',
  },
  saxLdc: {
    id: 'saxLdc',
    label: 'Large-diaphragm condenser, side-address, on a floor stand',
    short: 'LARGE SIDE',
    transducer: 'condenser',
    address: 'side',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: { kind: 'sourced', src: 'S-SM4-UG', quote: 'Polar Pattern: Cardioid' } }],
    // The kit lessons' side-address body (S-SM4-WEB product data), reused.
    body: {
      length: { mm: 80.01, prov: { kind: 'sourced', src: 'S-SM4-WEB', quote: 'height "80.01" (product data), drawn as the depth front to back' } },
      radius: { mm: 59.004, prov: { kind: 'sourced', src: 'S-SM4-WEB', quote: 'width "118.008" (product data)' } },
      width: { mm: 254.991, prov: { kind: 'sourced', src: 'S-SM4-WEB', quote: 'depth "254.991" (product data), drawn as the upright length' } },
    },
    power: 'phantom power (48 V)',
    mount: 'stand',
    examples: [{ model: 'Shure SM4 (side-address cardioid condenser)', fact: '"Polar Pattern: Cardioid"; 48 V phantom; the S-SAX engineers name neutral condensers for detail in a quiet room.', src: 'S-SM4-UG' }],
    art: 'sideLdc',
    blurb: 'A side-address cardioid condenser a little way off the horn: aim its FACE between the bell and the keys. Detailed, with more of the room. Needs phantom power.',
  },
  saxDynSuper: {
    id: 'saxDynSuper',
    label: 'End-address instrument dynamic, supercardioid',
    short: 'DYN · SUPER',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'supercardioid', prov: { kind: 'sourced', src: 'S-POLAR', quote: 'the supercardioid is least sensitive at 125 degrees' } }],
    // The compact dynamic's silhouette (S-SM57-UG drawing), its capsule
    // supercardioid: the body is a drawing default for the generic type.
    body: { length: placeholder(157, 'a supercardioid instrument dynamic’s length (drawn as the compact dynamic’s)'), radius: placeholder(17, 'a supercardioid instrument dynamic’s grille radius') },
    power: 'none needed (dynamic)',
    mount: 'stand',
    examples: [{ model: 'supercardioid instrument dynamics (generic)', fact: 'Shure’s polar-pattern article: a supercardioid is "least sensitive at 125 degrees"; the S-SAX engineers name dynamics for close live work.', src: 'S-SAX' }],
    art: 'smallDynamic',
    blurb: 'A compact dynamic with a tighter, supercardioid pattern — its least-sensitive directions sit toward the rear, about 125° off the front, with a small lobe straight behind. Needs no power.',
  },
  saxClip: {
    id: 'saxClip',
    label: 'Miniature condenser on a bell clip, supercardioid',
    short: 'BELL CLIP',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'supercardioid', prov: { kind: 'sourced', src: 'DPA-MOUNT', quote: '4099S … do not point the microphone directly into the bell, but angle it between the bell and the keys' } }],
    body: { length: placeholder(30, 'the miniature capsule’s length'), radius: placeholder(6, 'the miniature capsule’s radius') },
    power: 'phantom power through its adapter; a wireless pack may cut below 80 Hz',
    mount: 'clip',
    clip: { reach: placeholder(140, 'the bell clip’s gooseneck reach from the rim to the capsule (proposal §4: ≤ 140)') },
    examples: [{ model: 'DPA 4099S on the saxophone clip', fact: '"do not point the microphone directly into the bell, but angle it between the bell and the keys"; "low-cut filter at 80 Hz in the transmitter… built into the adapter supplied with 4099G, 4099V, 4099S and 4099T"; dedicated foam windscreen and shock-absorbing mount.', src: 'DPA-MOUNT' }],
    art: 'gooseneck',
    blurb: 'A tiny condenser on a short gooseneck, held by a clip made for the bell rim: it moves with the horn, so the player can move. Needs phantom power through its adapter; some wireless packs cut the lows below about 80 Hz. Only a clip made for this bell, with the player’s agreement.',
  },
} satisfies Record<string, MicType>;
