/**
 * M11 COMPLETE DRUM-KIT SETUPS — where things are: the shared kit as one
 * scene (wide enough for a low room pair in front of the kick), the same
 * stage monitors as every Lab 1 lesson, and the two recommended starting
 * points the two-mic page pairs: a kick mic just outside the front head and
 * an overhead over the snare (the overheads lesson's own zone).
 */
import type { DocumentedZone } from '../../engine/model/types.ts';
import { KIT_FLOOR_Y } from '../shared/kitPlanModel.ts';
import { KICK_FRONT, kitModel } from '../shared/kitScene/kitSceneModel.ts';
import { M09_ZONES } from '../m09Overheads/model.ts';
import { M09_WEDGES } from '../m09Overheads/geometry.ts';

const ill = (reason: string) => ({ kind: 'illustrative', reason }) as const;

export const M11_VIEWS = {
  side: { u0: -1150, u1: 1750, v0: -1750, v1: KIT_FLOOR_Y + 30 },
  top: { u0: -1150, u1: 1750, v0: -1150, v1: 1100 },
};

export const M11_MODEL = kitModel({
  id: 'kit5complete',
  name: '5-piece drum kit, every channel',
  variants: [
    { id: 'studio', label: 'STUDIO', blurb: 'A studio: separate tracks for later decisions, and a room that may help.' },
    { id: 'live', label: 'LIVE STAGE', blurb: 'A stage: open mics hear the monitors and the PA; use the channels the audience needs.' },
  ],
  defaultVariant: 'studio',
  views: M11_VIEWS,
  // The two-mic page pairs the kick mic with an overhead: open on the kick.
  firstRegion: 'src.kick',
  roles: {
    'kit.kick': 'The kick: inside toward the batter for attack, outside or near the front head for more body — the kick lesson has the starting points.',
    'kit.snare': 'The snare: a top mic from outside the sticks’ path; a bottom mic for the wires is optional.',
    'kit.tom1': 'A rack tom: one mic per tom, or a shared one where the coverage and the bleed allow.',
    'kit.tom2': 'A rack tom: its fills may already be clear in the overheads — check before adding a mic.',
    'kit.floor': 'The floor tom: a spot of its own, or left to the overheads.',
    'cym.hihat': 'A spot only if its pattern needs its own balance — away from the air that puffs out as it closes.',
    'cym.crash1': 'Crashes: hear the overheads first; a dedicated mic only for a clear need.',
    'cym.crash2': 'Crashes: hear the overheads first; a dedicated mic only for a clear need.',
    'cym.ride': 'The ride: a spot if the pattern must be balanced on its own; otherwise the overheads.',
    'kit.throne': 'The player’s space: no stand, boom or cable in it, whatever the plan.',
  },
});

const KICK_OUT: DocumentedZone = {
  id: 'kit.kick.out',
  label: 'Just outside the kick’s front head, toward its edge',
  band: 'Start about 2–15 cm (1–6 in) outside the front head, toward its edge, facing it — one of the kick lesson’s starting points.',
  kind: 'sourced',
  src: 'DPA-KICK',
  quote: 'Sometimes placing a kick drum mic just outside the drum, on the edge of the resonator head, gives more impact.',
  refSurface: 'kickFront',
  side: 'outside',
  distance: { min: 20, max: 150 },
  bandProv: ill('"just outside": 2 to 15 cm is the kick lesson’s drawing of it'),
  radial: { line: 'kickAxis', min: 180, max: 300, prov: ill('"on the edge": 18 to 30 cm from the drum’s axis (the kick lesson’s drawing)') },
  requires: { micTypeIds: ['kickDynSuper'] },
  aim: { maxOffAxis: 30, prov: ill('facing the front head: ±30° is the lab’s tolerance') },
  drawn: { side: { u0: KICK_FRONT.x + 20, u1: KICK_FRONT.x + 150, v0: -300, v1: 300 }, top: { u0: KICK_FRONT.x + 20, u1: KICK_FRONT.x + 150, v0: -300, v1: 300 } },
  start: { p: { x: KICK_FRONT.x + 60, y: -220, z: 0 }, az: 0, el: 0 },
  tendency: 'More body and some impact, with more of the kit around it than an inside mic.',
  checks: ['Clear of the front hoop', 'The kick against the overheads, in mono'],
};

export const M11_ZONES: DocumentedZone[] = [KICK_OUT, ...M09_ZONES.filter((z) => z.id === 'oh.gj.main' || z.id === 'oh.mono')];
export const M11_WEDGES = M09_WEDGES;
