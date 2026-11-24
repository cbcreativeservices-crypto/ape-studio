/**
 * THE LUTE PLAYER IN THE APPROVED LOOK (figure roll-out wave 5, D78,
 * 2026-11-24): oud on a chair (C13), sitar and veena cross-legged on the
 * floor (C14, C15) — the scene face-on and from above, the placement studio,
 * the setting plan (with its accompanists in the approved look).
 *
 * Nothing of the scene moves (luteModel.ts fit, luteHands.ts): the joints the
 * keep-outs read, the posed hands — the oud's left hand stopping the strings,
 * the thumb behind the neck, the risha pinched in the right hand; the sitar's
 * mizrab on the right index, the left fingers pulling on the frets; the
 * veena's picks. Only the drawing is new: the body is the cast member from
 * the front and from above (figureV2/familyV2), the approved sleeves, the
 * posed hands in the approved look (familyHand). Cross-legged on the floor the
 * front and top figures have no legs to draw, so the legs are the scene's own
 * masses (lutePlayers bodyGeo: the thighs out to the knees, the shins
 * crossing, the bare feet) repainted in the person's trouser cloth and skin.
 *
 * Who plays (cast.ts ROLES): oud Kofi, sitar Ana, veena Mei.
 */
import type { ReactNode } from 'react';
import { Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import type { ViewId, Vec3 } from '../../../engine/model/types.ts';
import { castFor, type CastMember } from '../figureV2/cast';
import { famFrontRegion, famPlan, FamilyFigureFrontV2, FamilyFigureV2, type FamIn, type FamPlan } from '../figureV2/familyV2';
import { useLook } from '../figureV2/look';
import type { SkPath } from '../figureV2/paths.ts';
import { luteHands } from './luteHands.ts';
import { bodyGeo, lowerBody, neckCut, toInstX, type BodyGeo, type LuteArmOpts } from './lutePlayers';
import type { LuteScene } from './luteModel.ts';

const ROLE = { oud: 'lute.oud', sitar: 'lute.sitar', veena: 'lute.veena' } as const;
export const lutePlayer = (sc: Pick<LuteScene, 'kind'>): CastMember => castFor(ROLE[sc.kind]);

const depthOf = (view: ViewId, p: Vec3) => (view === 'side' ? p.z : -p.y);

/** The scene's cross-legged legs in the person's trouser cloth and skin (face-on or from above). */
function LegsV2({ g, view }: { g: BodyGeo; view: ViewId }) {
  const { CLOTH, MAT, HAND } = useLook();
  const tb = g.trousers.getBounds();
  const cloth = (p: SkPath) => (
    <Group>
      <Path path={p}>
        <LinearGradient start={vec(tb.x, tb.y)} end={vec(tb.x + tb.width, tb.y + tb.height)} colors={CLOTH.form} positions={CLOTH.pos} />
      </Path>
      <Path path={p} style="stroke" strokeWidth={1} color={CLOTH.edge} opacity={0.5} />
    </Group>
  );
  const foot = (f: BodyGeo['feet'][number], i: number) => {
    const b = f.path.getBounds();
    return (
      <Group key={i} opacity={f.far ? 0.92 : 1}>
        <Path path={f.path}>
          <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width * 0.4, b.y + b.height)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
        </Path>
        <Group clip={f.path}>
          <Path path={f.lines} style="stroke" strokeWidth={1.2} strokeCap="round" color={MAT.skin.deep} opacity={0.45} />
        </Group>
        <Path path={f.path} style="stroke" strokeWidth={0.9} color={MAT.skin.edge} opacity={0.5} />
      </Group>
    );
  };
  return (
    <Group>
      {g.feet.filter((f) => f.far).map(foot)}
      {cloth(g.trousers)}
      {g.nearShin ? cloth(g.nearShin.path) : null}
      {g.feet.filter((f) => !f.far).map(foot)}
      {view === 'side' ? null : null}
    </Group>
  );
}

export function luteFamIn(sc: LuteScene, view: ViewId, opts: LuteArmOpts): FamIn {
  const f = sc.fit;
  const H = luteHands(sc);
  const lb = lowerBody(sc);
  const floor = f.seat === 'floor';
  const neck: Vec3 = { x: f.head.c.x, y: (f.shoulderR.y + f.shoulderL.y) / 2 - 30, z: (f.shoulderR.z + f.shoulderL.z) / 2 };
  const ankle = (k: Vec3, a?: Vec3): Vec3 => a ?? { x: k.x, y: sc.floorY - 74, z: k.z };
  const aR = floor && lb.near ? (lb.near.side === 'R' ? lb.near.ankle : lb.near.farAnkle) : ankle(f.kneeR);
  const aL = floor && lb.near ? (lb.near.side === 'L' ? lb.near.ankle : lb.near.farAnkle) : ankle(f.kneeL);
  const fretX = toInstX(sc, H.fret.sk.fingers[1].joints[3]);
  const g = floor ? bodyGeo(sc, view, opts) : null;
  const hipV = f.hipY;
  return {
    key: `lute|${sc.kind}`,
    s: {
      head: f.head.c,
      headR: f.head.r,
      face: { x: 0, y: 0, z: 1 },
      neck,
      pelvis: { x: (lb.hipR.x + lb.hipL.x) / 2, y: hipV, z: lb.hipR.z },
      shoulderL: f.shoulderL,
      shoulderR: f.shoulderR,
      hipL: lb.hipL,
      hipR: lb.hipR,
      kneeL: f.kneeL,
      kneeR: f.kneeR,
      ankleL: aL,
      ankleR: aR,
      toeL: { x: aL.x, y: aL.y, z: aL.z + 120 },
      toeR: { x: aR.x, y: aR.y, z: aR.z + 120 },
    },
    view: view === 'side' ? 'front' : 'top',
    who: lutePlayer(sc),
    seated: true,
    floorY: sc.floorY,
    arms: {
      L: { sk: H.fret.sk, elbow: H.fret.elbow, shoulder: H.fret.shoulder, cut: neckCut(sc, view, fretX) },
      R: { sk: H.pluck.sk, elbow: H.pluck.elbow, shoulder: H.pluck.shoulder, cut: sc.kind === 'veena' && view === 'side' ? neckCut(sc, view, fretX) : null },
    },
    ...(g ? { lowerOverride: { front: { node: <LegsV2 g={g} view="side" />, clipAboveV: hipV - 26 }, top: <LegsV2 g={g} view="top" /> } } : {}),
  };
}

/** The figure's plan and its parts over the instrument (the instrument's own body depth). */
export function luteFigure(sc: LuteScene, view: ViewId, opts: LuteArmOpts): { fp: FamPlan; region: SkPath | null } {
  const fp = famPlan(luteFamIn(sc, view, opts));
  const inst = depthOf(view, sc.posture.P({ x: 0, y: 0, z: 0 }));
  return { fp, region: famFrontRegion(fp, inst) };
}

/** The scene's player in the approved look: the person behind (`back`) and over (`front`) the instrument. */
export function LuteFigureV2({ sc, view, opts, part }: { sc: LuteScene; view: ViewId; opts: LuteArmOpts; part: 'back' | 'front' }): ReactNode {
  const { fp, region } = luteFigure(sc, view, opts);
  return part === 'back' ? <FamilyFigureV2 fp={fp} /> : <FamilyFigureFrontV2 fp={fp} region={region} />;
}
