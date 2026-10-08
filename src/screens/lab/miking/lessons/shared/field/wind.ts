/**
 * WIND PROTECTION (Lab 6 group 2; field_ambience/GEOMETRY_PROPOSAL.md §4 —
 * group 1 left the drawings to this group). The layers a field mic wears,
 * as REAL objects (WindArt.tsx draws them), and what each one tends to do
 * at three kinds of site — in WORDS only, never a level (CORNELL-ACC: "A foam
 * windscreen is adequate for recording in protected areas, such as the
 * interior of a forest, but is insufficient for recording in grasslands and
 * other windy open habitats"; a basket with a long-hair cover is "the most
 * effective", with some high-frequency loss; F06 L36–L37: fit the windshield
 * to the mic and the conditions, monitor while adjusting, a filter is no
 * rescue). Pure; tested.
 *
 * The "wind on the capsule" marks WindArt draws are ILLUSTRATIVE (a count of
 * turbulence curls, 0–3), never a level.
 */

export type WindLayerId = 'none' | 'foam' | 'softie' | 'basket' | 'basketFur';
export type ExposureId = 'forest' | 'open' | 'plaza';

export type WindLayer = { id: WindLayerId; label: string; short: string; what: string; rank: number };
export type Exposure = { id: ExposureId; label: string; short: string; what: string };

/** The layers, lightest first (the order they are added in). */
export const WIND_LAYERS: readonly WindLayer[] = [
  { id: 'none', label: 'Bare mic', short: 'BARE', what: 'Nothing over the capsule: air moving across the grille makes its own low rumble — a different sound from wind in the trees.', rank: 0 },
  { id: 'foam', label: 'Foam windscreen', short: 'FOAM', what: 'A close-fitting foam sleeve: enough in light, sheltered air.', rank: 1 },
  { id: 'softie', label: 'Fur over foam', short: 'FUR · FOAM', what: 'A long-hair fur slipped over the foam: slows the air at the surface before it reaches the capsule.', rank: 2 },
  { id: 'basket', label: 'Basket with suspension', short: 'BASKET', what: 'A rigid open cage round the mic, held on a suspension inside: a still pocket of air round the capsule, and handling kept out.', rank: 3 },
  { id: 'basketFur', label: 'Fur over the basket', short: 'BASKET · FUR', what: 'The basket under a long-hair cover: the most protection here — listen for a little of the top end lost.', rank: 4 },
];

export const EXPOSURES: readonly Exposure[] = [
  { id: 'forest', label: 'Inside a forest', short: 'FOREST', what: 'Sheltered: the trees break the wind before it reaches the mic.' },
  { id: 'open', label: 'Open grassland', short: 'OPEN', what: 'Exposed: wind crosses the open ground at full strength.' },
  { id: 'plaza', label: 'A city plaza', short: 'PLAZA', what: 'Gusty: air swirls round buildings and corners, changing from moment to moment.' },
];

export type WindVerdict = { marks: 0 | 1 | 2 | 3; enough: boolean; words: string };

/** The illustrative turbulence at the capsule (0–3 curls) per site and layer. */
const MARKS: Readonly<Record<ExposureId, readonly (0 | 1 | 2 | 3)[]>> = {
  //            none foam softie basket basketFur
  forest: [2, 0, 0, 0, 0],
  open: [3, 2, 1, 1, 0],
  plaza: [3, 2, 1, 1, 0],
};

/** What a layer tends to do at a site — words, never a level. */
export function windVerdict(exposure: ExposureId, layer: WindLayerId): WindVerdict {
  const L = WIND_LAYERS.find((l) => l.id === layer)!;
  const marks = MARKS[exposure][L.rank];
  if (exposure === 'forest') {
    if (layer === 'none') return { marks, enough: false, words: 'Even sheltered air buffets a bare capsule: start with at least foam.' };
    if (layer === 'foam') return { marks, enough: true, words: 'In a protected forest interior, foam is often enough — listen, and add more if the wind picks up.' };
    return { marks, enough: true, words: 'More protection than this sheltered spot needs today — fine, as long as the top end still sounds right.' };
  }
  const where = exposure === 'open' ? 'on open ground' : 'round buildings';
  if (layer === 'none') return { marks, enough: false, words: `A bare capsule ${where} rumbles and can overload: protect it before anything else.` };
  if (layer === 'foam') return { marks, enough: false, words: `Foam alone is not enough ${where}: add fur, then a basket with its suspension.` };
  if (layer === 'basketFur') return { marks, enough: true, words: 'Basket and fur together: the most protection — listen for a little top end lost, and still monitor for gusts.' };
  return { marks, enough: false, words: `Better — keep monitoring: if gusts still thump the capsule ${where}, add the next layer or find shelter.` };
}

/** The filter is no rescue (F06 L37): the line every wind step ends with. */
export const FILTER_LINE = 'A high-pass filter can take away some rumble — and real thunder, traffic, surf or a low call with it. It cannot undo a buffeted take: protect the mic first, keep an unfiltered track if you can, and write down any filter you used.';

/** One monitoring protocol's wind line (science only, F06-C4). */
export const MONITOR_WIND_LINE = 'One park sound-monitoring protocol leaves out wind above about 5 m/s (11 mph), because wind interferes with its measurements. That is a measurement rule — not a reason to throw away every windy creative take.';
