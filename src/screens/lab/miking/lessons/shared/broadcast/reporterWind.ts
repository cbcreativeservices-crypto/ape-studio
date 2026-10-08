/**
 * WIND ON A HANDHELD — Lab 7 group 3 (B03; field_reporter/GEOMETRY_PROPOSAL
 * §4 "wind kit"). The build prompt asks group 3 to check for a Lab 6 wind
 * kit first: Lab 6 group 2 built one (shared/field/wind.ts + WindArt.tsx) for
 * a SHOTGUN in the field — foam, fur over foam, a basket, fur over the
 * basket — and B08's outdoor crowd mic reuses it as it is. A reporter's
 * HANDHELD wears different layers, so this file keeps the same idea (the
 * layers lightest first, the place, the "wind on the capsule" marks) for the
 * handheld, and borrows the Lab 6 kit's rule that the marks are
 * ILLUSTRATIVE (a count of turbulence curls, 0–3), never a level.
 *
 * The layers (the lesson L27): the built-in mesh grille and pop filter
 * ("can reduce breath blasts and light wind"); a correctly sized open-cell
 * foam reporter windscreen ("a common additional layer for light wind"); a
 * compatible furry cover ("may be needed for stronger moving air"). Words
 * only — no wind speed and no dB (none sourced). A windshield is not
 * waterproofing, and no layer makes a mic "immune" (the lesson L21/L68: a
 * maker's "impervious to wind" is marketing — the app teaches a monitored
 * test). Pure; tested.
 */

export type ReporterCover = 'grille' | 'foam' | 'fur';
export type ReporterSite = 'sheltered' | 'street' | 'exposed';

export type Cover = { id: ReporterCover; label: string; short: string; what: string; rank: number };
export type Site = { id: ReporterSite; label: string; short: string; what: string };

/** The layers, lightest first. */
export const REPORTER_COVERS: readonly Cover[] = [
  { id: 'grille', label: 'The built-in grille only', short: 'GRILLE', what: 'The mic’s own mesh grille with the pop filter inside it: it breaks up breath blasts and very light air — nothing more.', rank: 0 },
  { id: 'foam', label: 'A foam reporter windscreen', short: 'FOAM', what: 'A correctly sized open-cell foam ball over the grille: a common extra layer for light wind. It needs to fit snugly and not hide the flag or the capsule’s front.', rank: 1 },
  { id: 'fur', label: 'A fitted furry cover', short: 'FUR', what: 'A long-hair cover made for this mic, over its foam: slows moving air at the surface before it reaches the capsule — for stronger wind. Check the fit, that it stays on, and how it sounds.', rank: 2 },
];

export const REPORTER_SITES: readonly Site[] = [
  { id: 'sheltered', label: 'A sheltered doorway', short: 'SHELTERED', what: 'Out of the wind: only light, steady air at the mic.' },
  { id: 'street', label: 'An open street', short: 'STREET', what: 'Gusts round the corners of buildings and from passing vehicles.' },
  { id: 'exposed', label: 'An exposed waterfront', short: 'EXPOSED', what: 'Strong, steady wind straight across the mic.' },
];

export type CoverVerdict = { marks: 0 | 1 | 2 | 3; enough: boolean; words: string };

/** The illustrative turbulence at the capsule (0–3 curls) per site and layer. */
const MARKS: Readonly<Record<ReporterSite, readonly (0 | 1 | 2 | 3)[]>> = {
  //          grille foam fur
  sheltered: [1, 0, 0],
  street: [2, 1, 0],
  exposed: [3, 2, 1],
};

/** What a layer tends to do at a place — words, never a level. */
export function coverVerdict(site: ReporterSite, cover: ReporterCover): CoverVerdict {
  const c = REPORTER_COVERS.find((q) => q.id === cover)!;
  const marks = MARKS[site][c.rank];
  if (site === 'sheltered') {
    if (cover === 'grille') return { marks, enough: false, words: 'Even light air and close breath can thump a bare grille: a foam is a small, cheap step — listen with it on.' };
    if (cover === 'foam') return { marks, enough: true, words: 'Out of the wind, a fitted foam is often enough. Keep listening: wind at the capsule, not the forecast, decides.' };
    return { marks, enough: true, words: 'More than this spot needs today — fine if the voice still sounds clear and the cover stays on.' };
  }
  if (site === 'street') {
    if (cover === 'grille') return { marks, enough: false, words: 'Gusts across a bare grille rumble and can overload the input: add a layer before anything else.' };
    if (cover === 'foam') return { marks, enough: false, words: 'Foam helps in light wind; a gust between buildings can still thump it. Add the fitted fur, or turn the pair so the bodies shelter the mic.' };
    return { marks, enough: true, words: 'The fitted fur takes the gusts at the surface. Still monitor: if the wind changes direction, recheck.' };
  }
  if (cover === 'grille') return { marks, enough: false, words: 'Strong wind straight across a bare grille: the take is buffeted and can overload. Protect the mic, then find shelter.' };
  if (cover === 'foam') return { marks, enough: false, words: 'Foam alone is for light wind: here the capsule is still buffeted. Add the fitted fur — and look for a sheltered, permitted spot.' };
  return { marks, enough: false, words: 'Fur is the most this handheld can wear, and the capsule still feels the gusts: turn the pair’s backs to the wind or move to a sheltered, permitted spot. If it keeps overloading, pause and relocate.' };
}

/** The filter is no rescue (the lesson L29): said once, after the layers. */
export const REPORTER_FILTER_LINE = 'A high-pass filter can take away some low wind or handling rumble — and can also thin the voice. It cannot undo a capsule or an input that already overloaded: protect the mic first, and recheck if the wind changes.';
/** A windshield is not waterproofing (the lesson L27; safety). */
export const NOT_WATERPROOF = 'A windscreen is not waterproofing: keep the mic, the transmitter and the connectors out of the rain — under cover, or stop.';
