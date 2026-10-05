/**
 * M11 COMPLETE DRUM-KIT SETUPS — the channel plans as data (kit/
 * GEOMETRY_PROPOSAL.md §4–§5): every channel a plan can use, where its mic
 * goes on the shared kit (each drum's own lesson owns the numbers; here they
 * are illustrative starting places, never taught as distances), and the
 * counters a plan computes — channels, stands, phantom inputs, open mics.
 * Pure; tested (test/mikingModelM11.test.ts: every pose is clear of the kit,
 * the counts add up, a plan grows by stages).
 *
 * "No number on screen is a recommended count" (proposal §5, lesson L69):
 * the counters describe a plan, they never grade its size.
 */
import type { MicPose, Vec3 } from '../../engine/model/types.ts';
import { yAt } from '../shared/kitPlanModel.ts';
import { KIT_DRUMS } from '../shared/kitPlanModel.ts';
import { frameOf, pointOn } from '../shared/drums/drumSpec.ts';
import { KIT_PLACED_CYMBALS, cymbalFrame, cymbalPoint } from '../shared/cymbals/cymbalSpec.ts';
import { KICK_FRONT, S0, aimToward } from '../shared/kitScene/kitSceneModel.ts';
import { AB_HAT, AB_RIDE, MONO_START } from '../m09Overheads/model.ts';
import { LOW_A, LOW_B } from '../m10Room/model.ts';

export type ChannelId = 'oh' | 'ohL' | 'ohR' | 'kick' | 'snare' | 'snareBot' | 'hihat' | 'tom1' | 'tom2' | 'floor' | 'ride' | 'roomL' | 'roomR';
export type Channel = {
  id: ChannelId;
  /** What the learner reads. */
  label: string;
  short: string;
  /** The mic type that draws it (data/micTypes). */
  typeId: string;
  pose: MicPose;
  /** Its role in a plan, in a few words. */
  role: string;
};

const toward = (p: Vec3, q: Vec3): MicPose => ({ p, ...aimToward(p, q) });

/** A spot over a drum's rim on the audience side, `up` above its head, aimed at its centre. */
function overRim(id: 'tom1' | 'tom2' | 'floor', out: number, up: number, thetaDeg = 0): MicPose {
  const d = KIT_DRUMS[id];
  const f = frameOf(d);
  const base = pointOn(f, f.R + out, thetaDeg, 0);
  const p = { x: base.x + f.n.x * up, y: base.y + f.n.y * up, z: base.z + f.n.z * up };
  return toward(p, d.c);
}

const SNARE_TOP: MicPose = toward({ x: S0.x + 150, y: yAt(700), z: S0.z - 120 }, S0);
const SNARE_BOT: MicPose = toward({ x: S0.x + 160, y: yAt(455), z: S0.z - 110 }, { x: S0.x, y: S0.y + KIT_DRUMS.snare.spec.depth.mm, z: S0.z });
const HAT: MicPose = (() => {
  const c = KIT_PLACED_CYMBALS.hihat.c;
  // Above the top cymbal, toward the side away from the snare.
  const ux = c.x - S0.x;
  const uz = c.z - S0.z;
  const l = Math.hypot(ux, uz);
  const p = { x: c.x + (ux / l) * 105, y: c.y - 78, z: c.z + (uz / l) * 105 };
  return toward(p, { x: c.x, y: c.y, z: c.z });
})();
const RIDE: MicPose = (() => {
  const pc = KIT_PLACED_CYMBALS.ride;
  const f = cymbalFrame(pc);
  // Above the bow on the audience side, away from the player's sticks.
  const p = cymbalPoint(f, 150, 35, 160);
  return toward(p, cymbalPoint(f, 150, 35, 0));
})();

export const CHANNELS: Readonly<Record<ChannelId, Channel>> = {
  oh: { id: 'oh', label: 'One overhead over the kit', short: 'OVERHEAD', typeId: 'ohPencil', pose: { p: MONO_START, az: 0, el: -90 }, role: 'The whole kit in one channel.' },
  ohL: { id: 'ohL', label: 'Overhead pair, hi-hat side', short: 'OH HAT SIDE', typeId: 'ohPencil', pose: { p: AB_HAT, az: 0, el: -90 }, role: 'Half of a stereo kit picture, the same distance from the snare as its partner.' },
  ohR: { id: 'ohR', label: 'Overhead pair, ride side', short: 'OH RIDE SIDE', typeId: 'ohPencil', pose: { p: AB_RIDE, az: 0, el: -90 }, role: 'The other half of the pair.' },
  kick: { id: 'kick', label: 'Kick', short: 'KICK', typeId: 'kickDynSuper', pose: { p: { x: KICK_FRONT.x + 60, y: -220, z: 0 }, az: 0, el: 0 }, role: 'The kick’s own weight and attack.' },
  snare: { id: 'snare', label: 'Snare top', short: 'SNARE', typeId: 'smallDynCard', pose: SNARE_TOP, role: 'The snare’s own presence and crack.' },
  snareBot: { id: 'snareBot', label: 'Snare bottom', short: 'SNARE BTM', typeId: 'smallDynCard', pose: SNARE_BOT, role: 'The snare wires, optional — check it against the top mic in mono.' },
  hihat: { id: 'hihat', label: 'Hi-hat', short: 'HI-HAT', typeId: 'ohPencil', pose: HAT, role: 'The hi-hat on its own fader, when a pattern needs its own balance.' },
  tom1: { id: 'tom1', label: '10 in tom', short: 'TOM 1', typeId: 'smallDynCard', pose: overRim('tom1', 30, 70), role: 'The 10 in tom’s fills under control.' },
  tom2: { id: 'tom2', label: '12 in tom', short: 'TOM 2', typeId: 'smallDynCard', pose: overRim('tom2', 30, 70, 20), role: 'The 12 in tom’s fills under control.' },
  floor: { id: 'floor', label: 'Floor tom', short: 'FLOOR', typeId: 'smallDynCard', pose: overRim('floor', 40, 70, 30), role: 'The floor tom’s weight under control.' },
  ride: { id: 'ride', label: 'Ride', short: 'RIDE', typeId: 'ohPencil', pose: RIDE, role: 'The ride on its own fader, when the overheads do not carry it.' },
  roomL: { id: 'roomL', label: 'Room pair, left', short: 'ROOM L', typeId: 'roomPencil', pose: { p: LOW_A, az: 0, el: 0 }, role: 'Space around the kit — usually a recording or broadcast choice.' },
  roomR: { id: 'roomR', label: 'Room pair, right', short: 'ROOM R', typeId: 'roomPencil', pose: { p: LOW_B, az: 0, el: 0 }, role: 'The other half of the room pair.' },
};

export type PlanId = 'one' | 'two' | 'three' | 'four' | 'expanded' | 'extensive';
export type Plan = { id: PlanId; label: string; short: string; channels: readonly ChannelId[]; why: string };

/** The stages (proposal §4; lesson L11-L24): functional examples, never a
 *  rigid count order. */
export const PLANS: readonly Plan[] = [
  { id: 'one', label: 'One mic', short: '1 MIC', channels: ['oh'], why: 'One safe whole-kit position, aimed for the balance the music needs. If the kick is missing, try the position before adding a spot.' },
  { id: 'two', label: 'Two mics', short: '2 MICS', channels: ['oh', 'kick'], why: 'A whole-kit mic plus the kick: a common low-channel plan. Does the second mic fix what was missing — and does the pair hold its weight in mono?' },
  { id: 'three', label: 'Three mics', short: '3 MICS', channels: ['oh', 'kick', 'snare'], why: 'The snare top, when it needs its own presence. Check the image, the mono sum and the drummer’s movement.' },
  { id: 'four', label: 'Four mics', short: '4 MICS', channels: ['ohL', 'ohR', 'kick', 'snare'], why: 'Two overheads plus kick and snare: a coherent base for many studio plans. (The floor-tom method is another four-mic family, in the overheads lesson.)' },
  { id: 'expanded', label: 'Expanded', short: 'EXPANDED', channels: ['ohL', 'ohR', 'kick', 'snare', 'hihat', 'tom1', 'tom2', 'floor'], why: 'The overhead pair, kick, snare, each tom and the hi-hat — each added for a distinct control. Count the stands, the inputs and the bleed.' },
  { id: 'extensive', label: 'Extensive', short: 'EXTENSIVE', channels: ['ohL', 'ohR', 'kick', 'snare', 'snareBot', 'hihat', 'tom1', 'tom2', 'floor', 'ride', 'roomL', 'roomR'], why: 'Add a snare bottom, the ride and a room pair only when each gives a useful control. An optional channel is not automatically an improvement.' },
];

export const CHANNEL_IDS = Object.keys(CHANNELS) as ChannelId[];

/** The counters (proposal §5), from the plan alone. Mic types say what is
 *  powered: a condenser needs phantom. */
export function counts(ids: readonly ChannelId[], phantom: (typeId: string) => boolean): { channels: number; stands: number; phantom: number; open: number } {
  const n = ids.length;
  return { channels: n, stands: n, phantom: ids.filter((id) => phantom(CHANNELS[id].typeId)).length, open: n };
}

/* ── routing (proposal §5): rows = channels; columns = the feeds ── */

export type Feed = 'pa' | 'mon' | 'rec' | 'bcast';
export const FEEDS: readonly Feed[] = ['pa', 'mon', 'rec', 'bcast'];
export const FEED_LABEL: Record<Feed, string> = { pa: 'PA', mon: 'MONITORS', rec: 'RECORD', bcast: 'BROADCAST' };
export type Routing = Readonly<Record<string, readonly Feed[]>>;

/** A starting routing for a plan: everything to the record and broadcast
 *  feeds; live, the drums the audience needs to the PA, the kick and snare
 *  to the monitors — and the room channels off the PA and the monitors
 *  (proposal §5 default; lesson L48). */
export function defaultRouting(ids: readonly ChannelId[], live: boolean): Routing {
  const out: Record<string, Feed[]> = {};
  for (const id of ids) {
    const room = id === 'roomL' || id === 'roomR';
    const f: Feed[] = ['rec', 'bcast'];
    if (live && !room) f.unshift('pa');
    if (live && (id === 'kick' || id === 'snare')) f.splice(1, 0, 'mon');
    out[id] = f;
  }
  return out;
}

/** Open mics in a feed (the counter a live engineer watches). */
export function openIn(r: Routing, feed: Feed): number {
  return Object.values(r).filter((fs) => fs.includes(feed)).length;
}

/** The channels on the routing page (the expanded plan plus the room pair). */
export const ROUTE_IDS: readonly ChannelId[] = ['ohL', 'ohR', 'kick', 'snare', 'hihat', 'tom1', 'tom2', 'floor', 'roomL', 'roomR'];

/** Is the live routing task met: the room pair only on record / broadcast,
 *  the kick and snare in the PA. */
export function routingDone(r: Routing): boolean {
  const room = (['roomL', 'roomR'] as const).every((id) => !r[id]?.includes('pa') && !r[id]?.includes('mon') && (r[id]?.includes('rec') || r[id]?.includes('bcast')));
  return room && !!r.kick?.includes('pa') && !!r.snare?.includes('pa');
}
