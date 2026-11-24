/**
 * THE GUITAR FAMILY'S PLAYER IN THE NEW LOOK — the drawing (figure V2, wave 3
 * set 3c of D78, 2026-11-24). The player (guitarPlayerV2.ts on the shared
 * "player who holds an instrument" renderer, figureV2/familyV2) drawn round
 * the lesson's own instrument drawing, passed in (GuitarArt draws it; this
 * file does not import GuitarArt): the whole person behind the instrument,
 * the instrument, the flat pick and the thumb and finger picks, then the
 * person again over the instrument where the arms and hands lie nearer the
 * viewer (a tip curled behind the hand hides its pick). A standing player's strap runs from the
 * neck's heel up over the left shoulder.
 */
import { memo, type ReactNode } from 'react';
import { Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { ViewId } from '../../../engine/model/types.ts';
import { famFrontRegion, famPlan, famProj, FamilyFigureFrontV2, FamilyFigureV2, type FamPlan } from '../figureV2/familyV2';
import { familyHandSilhouette } from '../figureV2/familyHandV2';
import { FigureScale, levelOf, useFigureScale } from '../figureV2/detail';
import { castFor, type CastMember, type RoleKey } from '../figureV2/cast';
import { inPoly, P, type Pt } from '../figureV2/geom.ts';
import type { GuitarScene } from './guitarModel.ts';
import { guitarFamIn, guitarFamParts, pickStyleOf } from './guitarPlayerV2.ts';
import { pickHandOf } from './pluckHands.ts';
import { guitarPlayerPose, lapHands } from './guitarPlayer.ts';

/** (a lesson whose guitarist is someone else — E07's singer) the role and the measured lips, by the scene's
 *  instrument and variant ids. */
const SCENE_CAST = new Map<string, { role: RoleKey; lip: boolean }>();
const sceneKey = (sc: GuitarScene) => `${sc.variant.spec.id}|${sc.variant.id}|${sc.variant.posture}`;
/** A lesson casts its guitar scene: `role` the person; `lip` true draws the head's mouth at the scene's own
 *  measured mouth (fit.mouth), where the lesson reads its vocal distances from. */
export function castGuitarScene(sc: GuitarScene, o: { role: RoleKey; lip: boolean }): void {
  SCENE_CAST.set(sceneKey(sc), o);
}

/** Who plays each instrument (one person per lesson; the role table in cast.ts). */
export function guitarPlayerOf(sc: GuitarScene): CastMember {
  const cast = SCENE_CAST.get(sceneKey(sc));
  if (cast) return castFor(cast.role);
  const id = sc.variant.spec.id.toLowerCase();
  const role: RoleKey = sc.variant.spec.body.pot
    ? 'player.banjo'
    : /mando/.test(id)
      ? 'player.mandolin'
      : /uke/.test(id)
        ? 'player.ukulele'
        : /bass/.test(id)
          ? 'player.acousticBass'
          : /reso/.test(id)
            ? 'player.resonator'
            : 'player.guitar';
  return castFor(role);
}

const planOf = (sc: GuitarScene, view: ViewId): FamPlan => {
  const fi = guitarFamIn(sc, view === 'side' ? 'side' : 'top', guitarPlayerOf(sc));
  const cast = SCENE_CAST.get(sceneKey(sc));
  return famPlan(cast?.lip ? { ...fi, key: `${fi.key}|${cast.role}|lip`, lip: sc.fit.mouth } : fi);
};

const PICK = ['#d9a25e', '#a8682e', '#5e3412'];
const STEEL = ['#f2f4f7', '#b9bfc8', '#6b727c'];
const STRAP = ['#6a4528', '#3c2615', '#24170c'];

/** The flat pick (tortoiseshell celluloid), seen in the view: its two shoulders and its point. */
function FlatPick({ sc, view }: { sc: GuitarScene; view: ViewId }) {
  const h = pickHandOf(sc, pickStyleOf(sc), guitarPlayerPose(sc, 'side'));
  if (!h.pick) return null;
  const pr = famProj(view === 'side' ? 'front' : 'top');
  const q = (x: { x: number; y: number; z: number }) => pr(x);
  const a = q(h.pick.a);
  const b = q(h.pick.b);
  const t = q(h.pick.tip);
  const p = Skia.Path.Make();
  p.moveTo(a.u, a.v);
  p.quadTo((a.u + b.u) / 2 - (t.u - (a.u + b.u) / 2) * 0.35, (a.v + b.v) / 2 - (t.v - (a.v + b.v) / 2) * 0.35, b.u, b.v);
  p.quadTo((b.u + t.u) / 2 + (t.v - b.v) * 0.1, (b.v + t.v) / 2 - (t.u - b.u) * 0.1, t.u, t.v);
  p.quadTo((a.u + t.u) / 2 - (t.v - a.v) * 0.1, (a.v + t.v) / 2 + (t.u - a.u) * 0.1, a.u, a.v);
  p.close();
  return (
    <Group>
      <Path path={p}>
        <LinearGradient start={vec(a.u, a.v)} end={vec(t.u, t.v)} colors={PICK} />
      </Path>
      <Path path={p} style="stroke" strokeWidth={0.8} color="#2a170a" opacity={0.7} />
    </Group>
  );
}

/** The thumb pick and finger picks on the fingertips (nickel bands, the thumb pick's blade). */
function FingerPicks({ sc, view }: { sc: GuitarScene; view: ViewId }) {
  const h = pickHandOf(sc, pickStyleOf(sc), guitarPlayerPose(sc, 'side'));
  if (!h.picks.length) return null;
  const pr = famProj(view === 'side' ? 'front' : 'top');
  const sk = h.sk;
  const tips = [sk.thumb, sk.fingers[0], sk.fingers[1]];
  return (
    <Group>
      {tips.map((d, i) => {
        const j = d.joints;
        const a = pr(j[j.length - 2]);
        const b = pr(j[j.length - 1]);
        // the band round the last bone, just behind the pad; the thumb pick's blade out past the pad
        const t = 0.62;
        const c = P(a.u + (b.u - a.u) * t, a.v + (b.v - a.v) * t);
        const ang = Math.atan2(b.v - a.v, b.u - a.u);
        const r = d.r[d.r.length - 1] + 1.2;
        const band = Skia.Path.Make();
        band.addRRect(Skia.RRectXY(Skia.XYWHRect(-3.5, -r, 7, 2 * r), 2, 2));
        if (i === 0) band.addRRect(Skia.RRectXY(Skia.XYWHRect(2, -r * 0.55, 12, r * 1.1), 4, 4));
        return (
          <Group key={i} transform={[{ translateX: c.u }, { translateY: c.v }, { rotate: ang }]}>
            <Path path={band}>
              <LinearGradient start={vec(0, -r)} end={vec(0, r)} colors={i === 0 ? ['#e9dcc3', '#b8a27c', '#7c6648'] : STEEL} />
            </Path>
            <Path path={band} style="stroke" strokeWidth={0.6} color="#3a3d44" opacity={0.7} />
          </Group>
        );
      })}
    </Group>
  );
}

const CHROME = ['#f6f8fb', '#c3c9d2', '#7d8591', '#c8ced8', '#59606b'];

/** The lap steel's bar (a chromed steel cylinder lying across the strings, lapHands.bar), in the view. */
function SteelBar({ sc, view }: { sc: GuitarScene; view: ViewId }) {
  const b = lapHands(sc).bar;
  const pr = famProj(view === 'side' ? 'front' : 'top');
  // (the lap frame read into the renderer's: (x, −z, y))
  const L = (q: { x: number; y: number; z: number }) => pr({ x: q.x, y: -q.z, z: q.y });
  const a = L(b.a);
  const c = L(b.b);
  const ang = Math.atan2(c.v - a.v, c.u - a.u);
  const len = Math.hypot(c.u - a.u, c.v - a.v);
  const r = b.r;
  const p = Skia.Path.Make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(0, -r, Math.max(len, 2 * r), 2 * r), r, r));
  return (
    <Group transform={[{ translateX: a.u }, { translateY: a.v }, { rotate: ang }]}>
      <Path path={p}>
        <LinearGradient start={vec(0, -r)} end={vec(0, r)} colors={CHROME} />
      </Path>
      <Path path={p} style="stroke" strokeWidth={1} color="#4a4f58" opacity={0.8} />
    </Group>
  );
}

/** The strap of a standing player, from the neck's heel up over the left shoulder (face-on). */
function Strap({ sc }: { sc: GuitarScene }) {
  const pose = guitarPlayerPose(sc, 'side');
  if (!pose.strapTo) return null;
  const s = pose.shoulderL;
  const a = pose.strapTo;
  const top = P(s.u - 34, s.v - 10);
  const p = Skia.Path.Make();
  p.moveTo(a.u, a.v);
  p.quadTo((a.u + top.u) / 2 + 30, (a.v + top.v) / 2, top.u, top.v);
  return (
    <Group>
      <Path path={p} style="stroke" strokeWidth={40} strokeCap="round" color="#141519" opacity={0.95} />
      <Path path={p} style="stroke" strokeWidth={34} strokeCap="round">
        <LinearGradient start={vec(top.u - 40, top.v)} end={vec(a.u + 40, a.v)} colors={STRAP} />
      </Path>
      <Path path={p} style="stroke" strokeWidth={1.6} strokeCap="round" color="#a07850" opacity={0.45} />
    </Group>
  );
}

/**
 * The player round the instrument: `under` (the floor) first, the whole person, `instrument`, the flat pick,
 * the person again over the instrument where nearer, the picks on the fingertips. `assumePtPerMm`: the scale
 * where the picture provides none (the stage plan).
 */
export const GuitarPlayerV2Scene = memo(function GuitarPlayerV2Scene({ sc, view, instrument, under, assumePtPerMm }: { sc: GuitarScene; view: ViewId; instrument: ReactNode; under?: ReactNode; assumePtPerMm?: number }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? assumePtPerMm ?? null;
  const level = levelOf({ ptPerMm, level: v.level });
  const fp = planOf(sc, view);
  const region = famFrontRegion(fp, -9999);
  const side = view === 'side';
  return (
    <FigureScale ptPerMm={ptPerMm} level={level}>
      <Group>
        {under ?? null}
        <FamilyFigureV2 fp={fp} />
        {side && !sc.o.lap ? <Strap sc={sc} /> : null}
        {instrument}
        {!sc.o.lap ? <FlatPick sc={sc} view={view} /> : <SteelBar sc={sc} view={view} />}
        {/* (the picks sit on the fingertips: under the hand's front layer, so a tip curled behind the hand hides
            its pick too) */}
        {!sc.o.lap ? <FingerPicks sc={sc} view={view} /> : null}
        <FamilyFigureFrontV2 fp={fp} region={region} />
      </Group>
    </FigureScale>
  );
});

/** Whether the new player, as drawn, covers (u, v) within `tol` mm (the arms, the hands, the body). */
export function guitarV2Covers(sc: GuitarScene, view: ViewId, u: number, v: number, tol: number): boolean {
  const fp = planOf(sc, view);
  const pts: Pt[] = tol > 0 ? [P(u, v), P(u - tol, v), P(u + tol, v), P(u, v - tol), P(u, v + tol)] : [P(u, v)];
  const polys = fp.arms.flatMap((a) => [a.arm.upper, a.arm.foreSleeve, a.arm.cuff]);
  for (const q of pts) {
    if (polys.some((pl) => inPoly(q, pl))) return true;
    for (const a of fp.arms) {
      const h = familyHandSilhouette(a.hand);
      if (h && typeof h.contains === 'function' && h.contains(q.u, q.v)) return true;
    }
  }
  return false;
}

export { guitarFamParts };
