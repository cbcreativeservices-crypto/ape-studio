/**
 * FIGURE V2 — A STANDING TALKER PLACED ON A TALKER'S LIP POINT (wave 4,
 * builder "FrontAndBoom", 2026-11-24): the new look of SportSpeechArt's
 * StandingTalker (the standing figure, standing.ts, at any lip point facing
 * ±x), for the lessons converted whole (B11's wearer). The cast member the
 * role table gives the talker's id; the hands at rest; the open mouth in
 * profile; a step that turns the head draws the body headless.
 */
import { Group, Paint, Path, Skia } from '@shopify/react-native-skia';
import type { ViewId } from '../../../engine/model/types.ts';
import { castFor, talkerRole, type RoleKey } from './cast';
import { PersonSideV2, PersonTopV2, personCovers, personTopCovers } from './personV2';
import { standPoses, type Stander } from '../broadcast/standing.ts';
import { OnTalker } from '../broadcast/BroadcastArt';
import { personPlan } from './personV2';
import { personTopPlan } from './topPerson.ts';
import { personFrontPlan } from './FigureV2Front';
import { SINGER_SIDE, SINGER_TOP } from '../voice/voicePose.ts';
import { TORSO_FRONT } from '../broadcast/standing.ts';
import { CAST } from './cast';

const MOUTH = (() => {
  const p = Skia.Path.Make();
  p.moveTo(1.5, -2.5);
  p.cubicTo(-4, -4.5, -11, -3.5, -14, 0);
  p.cubicTo(-11, 3.5, -4, 4.5, 1.5, 2.5);
  p.close();
  return p;
})();

const sideOpts = (t: Stander) => ({ lip: { u: t.lip.x, v: t.lip.y }, rest: 'restSide' as const });

/** The standing talker drawn new (`who`: a role; default the talker's own by its id). */
export function StandingTalkerV2({ view, t, headless = false, dim = 1, who }: { view: ViewId; t: Stander; headless?: boolean; dim?: number; who?: RoleKey }) {
  const poses = standPoses(t);
  const person = castFor(who ?? talkerRole(t.id));
  return (
    <Group layer={dim < 1 ? <Paint opacity={dim} /> : undefined}>
      {view === 'side' ? (
        <Group>
          <PersonSideV2 pose={poses.side} who={person} opts={sideOpts(t)} part={headless ? 'headless' : 'all'} />
          {headless ? null : (
            <OnTalker view={view} t={t}>
              <Path path={MOUTH} color="#24170f" opacity={0.92} />
            </OnTalker>
          )}
        </Group>
      ) : (
        <PersonTopV2 pose={poses.top} who={person} head={headless ? 'none' : 'show'} />
      )}
    </Group>
  );
}

/** Whether the new standing talker covers (u, v) within `tol` (labels keep off it). */
export function standingCoversV2(view: ViewId, t: Stander, u: number, v: number, tol: number, who?: RoleKey): boolean {
  const poses = standPoses(t);
  const person = castFor(who ?? talkerRole(t.id));
  return view === 'side' ? personCovers(poses.side, person, sideOpts(t), u, v, tol) : personTopCovers(poses.top, person, {}, u, v, tol);
}

/* ── where a headset hangs on the new heads (drawing only: every capsule and measured point stays) ── */


const centroid = (ps: readonly { u: number; v: number }[]) => ({ u: ps.reduce((s, p) => s + p.u, 0) / ps.length, v: ps.reduce((s, p) => s + p.v, 0) / ps.length });
const earCache = new Map<string, HeadsetEar>();
/** The near (right) ear of a cast member standing on frame V's lip point, as their new head draws it: in
 *  profile (x, y), from above (x, z: the head from above places its ears at the sides of its middle), from the
 *  front (u = −z, v = y). A bob hides the ears: the same place, under the hair. */
export type HeadsetEar = { side: { x: number; y: number }; top: { x: number; z: number }; front: { u: number; v: number } };
export function headsetEarV2(role: RoleKey): HeadsetEar {
  const hit = earCache.get(role);
  if (hit) return hit;
  const who = castFor(role);
  const side = centroid(personPlan(SINGER_SIDE, who, { lip: { u: 0, v: 0 }, rest: 'restSide' }).head.ear);
  // (from above the skull is everyone's: a person whose hair hides the ears takes another's ear place)
  const tp = personTopPlan(SINGER_TOP, who.head.hair === 'bob' ? CAST.kofi : who, {});
  const near0 = tp.head.ears.map(centroid).sort((a, b) => b.v - a.v)[0];
  // (FrontBoom3, review 2026-11-24: "the headset's ear-loop a dark ring lying on the shoulder below the head") the
  // loop hugs the side of the head at the ear — under a bob, at the hair's side over the hidden ear, never past it
  const c0 = tp.head.c ?? { u: near0.u, v: 0 };
  const near = who.head.hair === 'bob' ? { u: near0.u, v: c0.v + (near0.v - c0.v) * 0.8 } : { u: near0.u, v: c0.v + (near0.v - c0.v) * 0.92 };
  const fp = personFrontPlan(TORSO_FRONT, who, { lip: { u: 0, v: 0 } });
  // (the person's right ear: on the viewer's left from the front)
  const front = fp.head.earsAt[0];
  const out = { side: { x: side.u, y: side.v }, top: { x: near.u, z: near.v }, front: { u: front.u, v: front.v } };
  earCache.set(role, out);
  return out;
}
