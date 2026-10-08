/**
 * FIELD SAFETY CARDS (Lab 6 group 2; field_ambience/GEOMETRY_PROPOSAL.md §5):
 * the exact facts of the sources, in plain words, with no authority's name
 * on screen (owner ruling 2026-10-04; the names live in the research record).
 * Pure data; tested. Every field lesson (F06–F08) shows the cards it needs.
 *
 *   lightning  NWS-LTG: thunder heard → indoors, a substantial building or a
 *              hard-topped vehicle; rain shelters, small sheds and open
 *              vehicles are not safe; wait 30 minutes after the last
 *              lightning or thunder (F06-C5). A recording is never a reason
 *              to stay out (F06 L46).
 *   wildlife   NPS-WILD (US national parks): 25 yd (≈ 23 m) from most
 *              wildlife, 100 yd (≈ 91 m) from bears and wolves, some parks
 *              more; if an animal reacts you are too close; no calls or
 *              attractants (F06-C3, F07-C2) — local rules first (O-11).
 *   traffic    stands off vehicle lanes, walking paths and access routes
 *              (F06 L33); a stand or a cone is not traffic control (OSHA-WZ,
 *              F08 L37); nothing inside the path's envelope (F08 L37).
 *   water      a windscreen is not waterproofing; shelter outdoor mics from
 *              precipitation (S-SM63); flooding, unstable banks, surf (F06 L46).
 *   hearing    NIOSH-NOISE: 85 dBA averaged over 8 hours, 3 dB exchange —
 *              protection that keeps situational awareness (F08 L38).
 */
import { yd } from './frameG.ts';

export type SafetyId = 'lightning' | 'wildlife' | 'traffic' | 'water' | 'hearing';
export type SafetyCard = { id: SafetyId; title: string; text: string };

/** The wildlife setback examples (mm): US national parks; local rules come first. */
export const SETBACK = {
  most: { yd: 25, mm: yd(25) },
  bearWolf: { yd: 100, mm: yd(100) },
} as const;

export const SAFETY: Readonly<Record<SafetyId, SafetyCard>> = {
  lightning: {
    id: 'lightning',
    title: 'LIGHTNING',
    text: 'If you hear thunder, you are likely within striking distance: go indoors at once — a substantial building or a hard-topped vehicle. Rain shelters, small sheds and open vehicles are not safe. Wait 30 minutes after the last lightning or thunder before going back out. A recording is never a reason to stay outside: record a storm only from a safe shelter, or with a safe remote plan.',
  },
  wildlife: {
    id: 'wildlife',
    title: 'WILDLIFE',
    text: 'Local rules come first. As an example, US national parks ask visitors to stay at least 25 yards (about 23 m) from most wildlife and 100 yards (about 91 m) from bears and wolves — some parks ask for more. If an animal reacts to you, you are too close: back away. Never use calls, recorded playback or attractants, and keep away from nests.',
  },
  traffic: {
    id: 'traffic',
    title: 'TRAFFIC AND PATHS',
    text: 'Keep stands, cables and crew off vehicle lanes, walking paths and access routes. Never set up on an active roadway: a stand or a cone is not traffic control. Nothing and nobody inside a moving source’s path, its possible deviation or its stopping room.',
  },
  water: {
    id: 'water',
    title: 'WATER AND WEATHER',
    text: 'A windscreen is not waterproofing: even a rugged outdoor mic needs shelter from rain, sleet and snow, and connectors need protecting from moisture. Stay away from flooding, unstable banks, ledges and surf — no take is worth a step closer.',
  },
  hearing: {
    id: 'hearing',
    title: 'HEARING',
    text: 'Monitor at a comfortable level. For long, loud exposure — traffic, machinery, a loud vehicle — use hearing protection that still lets you hear what is around you. A widely used guideline: no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA above that.',
  },
};

/** The cards a lesson shows, in its order. */
export function safetyCards(ids: readonly SafetyId[]): SafetyCard[] {
  return ids.map((id) => SAFETY[id]);
}
