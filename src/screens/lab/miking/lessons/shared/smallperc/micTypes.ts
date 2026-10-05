/**
 * SMALL-PERCUSSION FAMILY — microphones BY PROPERTY that Lab 2 adds (generic
 * types; the products their sizes were read from are the INTERNAL record,
 * never shown — owner ruling 2026-10-04). Registered beside the others in
 * data/micTypes.ts.
 *
 * portClip — a compact clip-on dynamic on a PADDED PORT CLAMP (the cajón's
 * sound port: cajon/SOURCES.md MEINL-MPMCC "Adjustable clamping mechanism
 * compatible with all common cajon sound ports"; "Foam padding"). The body is
 * the clip-on dynamic's (snare/SOURCES SN-904-2019); the clamp's reach is a
 * drawing default (the product prints none).
 */
import type { MicType } from '../../../engine/model/types.ts';

export const SMALL_PERC_MIC_TYPES: Record<string, MicType> = {
  portClip: {
    id: 'portClip',
    label: 'Clip-on dynamic, cardioid, on a padded port clamp',
    short: 'PORT CLIP',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: { kind: 'sourced', src: 'SN-904-2019', quote: 'Pick-up pattern cardioid' } }],
    body: {
      length: { mm: 63, prov: { kind: 'sourced', src: 'SN-904-2019', quote: 'Ø 41 mm, length 63 mm' } },
      radius: { mm: 20.5, prov: { kind: 'sourced', src: 'SN-904-2019', quote: 'Ø 41 mm' } },
    },
    power: 'none needed (dynamic)',
    mount: 'clip',
    clip: { reach: { mm: 120, prov: { kind: 'unknown', needed: 'the port clamp’s reach from the port’s edge to the mic' }, placeholder: true } },
    // The mic body's source (snare/SOURCES.md); the clamp's words are
    // cajon/SOURCES.md MEINL-MPMCC (header).
    examples: [{ model: 'a clip-on dynamic on a padded cajón port clamp', fact: 'Mic body: "Ø 41 mm, length 63 mm". Clamp (cajon/SOURCES.md): "Adjustable clamping mechanism compatible with all common cajon sound ports"; "Foam padding"; "250g".', src: 'SN-904-2019' }],
    art: 'clipDynamic',
    blurb: 'A compact dynamic on a padded clamp made for a cajón’s sound port. Needs no power. Only with a clamp designed for the port, the player’s agreement, and the air from the port in mind.',
  },
};
