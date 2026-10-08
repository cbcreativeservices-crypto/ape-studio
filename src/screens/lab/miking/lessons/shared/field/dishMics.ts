/**
 * Lab 6 group 2 — the field mics this group adds (registered beside the
 * others in data/micTypes.ts): the PARABOLIC DISH (F07; dish.ts holds its
 * model). Generic; the products its sizes were read from are the internal
 * record only (owner ruling 2026-10-04: no brand or model on screen).
 *
 *   dishMic   a 57 cm dish (CORNELL-MIC's typical size), the focus at
 *             0.36·D (SCH-DISH's ratio: 205 mm, a drawing default), the
 *             capsule at the focus FACING THE DISH (SCH-DISH, INNERCORE).
 *             Its reference point is the focus; the bowl, its vertex and the
 *             handle lie behind it. No free-field lobe is drawn: its beam
 *             depends on pitch (shown on the dish's own page, an
 *             illustrative picture; no gain curve, O-9).
 */
import type { MicType } from '../../../engine/model/types.ts';
import { DISHES } from './dish.ts';

const D = DISHES.typical;
const src = (s: string, quote: string) => ({ kind: 'sourced' as const, src: s, quote });

export const FIELD2_MIC_TYPES: Record<string, MicType> = {
  dishMic: {
    id: 'dishMic',
    label: 'Parabolic dish, the capsule at its focus',
    short: 'DISH',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'unstated', label: 'a beam that narrows as the pitch rises — shown on the dish’s own page', prov: src('CORNELL-MIC', 'Higher frequency sounds, with shorter wavelengths, are amplified more than lower frequency sounds') }],
    body: {
      length: { mm: D.f + 150, prov: { kind: 'unknown', needed: 'the dish from its focus to the end of its handle: the focus 205 mm (0.36·D, a drawing default) plus a 150 mm handle (drawing default)' }, placeholder: true },
      radius: { mm: D.D / 2, prov: src('CORNELL-MIC', 'Telinga and Wildtronics reflectors "57 cm (22 inches) in diameter"') },
      fore: { mm: 60, prov: { kind: 'unknown', needed: 'the capsule’s body ahead of the focus (drawing default 60 mm)' }, placeholder: true },
    },
    power: 'phantom power or the maker’s supply, as the capsule needs',
    mount: 'stand',
    examples: [
      { model: 'a 57 cm bird-recording reflector', fact: 'CORNELL-MIC: typical reflectors 57 cm; SCH-DISH: 585 mm, focal 210 mm, capsule 0° toward the dish, 100 Hz–20 kHz with EQ, 874 g; INNERCORE: 500 mm, focal 140 mm, capsule pointing back at the dish.', src: 'SCH-DISH' },
    ],
    art: 'dish',
    blurb: 'A curved reflector that gathers sound from where it points to a capsule at its focus — the capsule faces the dish. It concentrates the mid and high pitches whose wavelength is shorter than the dish; below that it gives little help. It must be aimed precisely. Needs power for its capsule.',
  },
};
