/**
 * SPORTS MICS — the microphone types Lab 7 part 2 adds (built once by group
 * 2, lab7-g5; registered beside the others in data/micTypes.ts). Generic
 * types; the products their sizes come from are the INTERNAL record only.
 *
 *   spDish   a hand-held PARABOLIC DISH with an omni element at its focus,
 *            facing the bowl as the maker specifies (parabolic/SOURCES.md:
 *            one maker's large dish "calls for omni"). `pose.p` is the RIM
 *            plane's centre, the front of the assembly; the body is the bowl
 *            behind it (the large preset: rim Ø 660 mm, depth 224 mm —
 *            DERIVED drawing defaults, `placeholder`). Its pickup is not a
 *            free-field pattern: narrow only where the wavelength is shorter
 *            than the dish is wide, so no lobe is drawn by the engine
 *            ('unstated'); the lesson's own pages draw the bowl and its rays
 *            (shared/sports/DishArt). The engine draws only its element.
 *
 * The other sports mics are existing types: the short shotgun on a stand or a
 * pole (fieldmics, shotgunShort / shotgunPole), the small supercardioid with
 * no tube as the "compact directional" (scSupercard), the main-array
 * condensers for an ambience pair (ensemble).
 */
import type { MicType } from '../../../engine/model/types.ts';
import { DISHES } from './parabolic.ts';

const L = DISHES.large;

export const SPORTS_MIC_TYPES: Record<string, MicType> = {
  spDish: {
    id: 'spDish',
    label: 'Parabolic dish with an omni element at its focus',
    short: 'DISH',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'unstated', label: 'narrow only at higher frequencies; little help below about c ÷ dish width (a simplified picture)', prov: { kind: 'sourced', src: 'KLOVER-FAQ', quote: 'MiK 26 specifies an omni capsule; reflector gain stronger at high frequencies (parabolic/SOURCES.md §a, §b)' } }],
    body: {
      length: { mm: L.depth, prov: { kind: 'unknown', needed: 'the bowl’s depth behind the rim — DERIVED 224 mm for a 26-inch dish (parabolic/SOURCES.md §b), a drawing default' }, placeholder: true },
      radius: { mm: L.D / 2, prov: { kind: 'unknown', needed: 'the rim radius — 330 mm, the model number read as the rim diameter (Medium), a drawing default' }, placeholder: true },
    },
    power: 'as its maker specifies (phantom power for most condenser elements)',
    mount: 'stand',
    examples: [
      { model: 'a large hand-held parabolic dish (one maker’s 26-inch model)', fact: 'omni element; focal reference 2-1/4 in behind the hub rear / 4 in behind the front face', src: 'KLOVER-FAQ' },
      { model: 'a small hand-held parabolic dish (one maker’s 16-inch model)', fact: 'omni or wide cardioid; focal reference 1-1/8 in / 1-1/2 in', src: 'KLOVER-FAQ' },
    ],
    art: 'sdc',
    blurb: 'A curved bowl that gathers sound arriving along its axis onto a small element at its focus. It narrows and lifts the HIGH frequencies of a distant target; low sound mostly reaches the element directly. Assembled and focused exactly as its maker says — never a shotgun swapped in.',
  },
};
