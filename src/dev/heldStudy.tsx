/**
 * DEV — THE HAND ROUND A HAND-HELD MIC (wave 3, step A): the lessons' own held
 * mics (B03, B10, B09) at their starting places, the arm as the engine solves it
 * (geometry/arm.ts: the fist on the handle 45 mm up from its tail, the elbow
 * lowered from the shoulder), the hand's side read from that arm's real
 * rotation (heldHands.heldFrame / heldViewFor), drawn on the forearm out of a
 * jacket sleeve with 10 mm of shirt cuff, round the lesson's own mic drawing.
 * Study pages only: no lesson draws this yet.
 */
import { Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { aimVec } from '../screens/lab/miking/engine/geometry/vec';
import { heldElbowOf, heldFist } from '../screens/lab/miking/engine/geometry/arm';
import { B03_ZONES } from '../screens/lab/miking/lessons/b03FieldReporter/model';
import { REPORTER as R03, SHOULDER_REP as S03 } from '../screens/lab/miking/lessons/b03FieldReporter/geometry';
import { B10_ZONES } from '../screens/lab/miking/lessons/b10Sideline/model';
import { REPORTER as R10, SHOULDER_REP as S10 } from '../screens/lab/miking/lessons/b10Sideline/geometry';
import { B09_ZONES } from '../screens/lab/miking/lessons/b09Commentators/model';
import { CALLER, SHOULDER_A } from '../screens/lab/miking/lessons/b09Commentators/geometry';
import { HELD_SIDE_WORDS, heldFrame, heldSides, heldViewFor, placeGrip, type HeldView, type V3 } from '../screens/lab/miking/lessons/shared/figureV2/heldHands';
import { HeldHand } from '../screens/lab/miking/lessons/shared/figureV2/heldHandV2';
import { limbOutline, P, type Pt } from '../screens/lab/miking/lessons/shared/figureV2/geom';
import { smoothClosed } from '../screens/lab/miking/lessons/shared/figureV2/paths';
import { useLook } from '../screens/lab/miking/lessons/shared/figureV2/look';
import { across } from '../screens/lab/miking/lessons/shared/figureV2/paint';
import { MikingMicArt } from '../features/lab/micDrawings';

export type HeldCaseId = 'b3.shared' | 'b3.handoffOmni' | 'b3.repOwn' | 'b10.hand' | 'b10.reporter' | 'b9.lip';
export type Mic = { art: 'flagHandheld' | 'lipRibbon'; r: number; len: number; /** (step A round 2) drawn longer at the tail: the flag mic's free handle below the flag (≈ 95 mm) */ drawLen?: number };
export const REP_OMNI: Mic = { art: 'flagHandheld', r: 24, len: 230 };
// (the flag cube runs 2.25 r → 4.75 r from the front: 56–119 mm; ≈ 95 mm of free handle below it)
export const FLAG_BOTTOM = 4.75 * 25;
export const FLAG: Mic = { art: 'flagHandheld', r: 25, len: 162, drawLen: FLAG_BOTTOM + 95 };
export const LIP: Mic = { art: 'lipRibbon', r: 20, len: 220 };

const DEF: Record<HeldCaseId, { title: string; zones: readonly { id: string; start: { p: V3; az: number; el: number } }[]; shoulder: V3; lip: V3; mic: Mic }> = {
  'b3.shared': { title: 'B03 · the shared omni, between reporter and guest', zones: B03_ZONES as never, shoulder: S03, lip: R03.lip, mic: REP_OMNI },
  'b3.handoffOmni': { title: 'B03 · the omni moved to the guest’s mouth', zones: B03_ZONES as never, shoulder: S03, lip: R03.lip, mic: REP_OMNI },
  'b3.repOwn': { title: 'B03 · the reporter’s own handheld at their mouth', zones: B03_ZONES as never, shoulder: S03, lip: R03.lip, mic: REP_OMNI },
  'b10.hand': { title: 'B10 · the reporter holds the flag mic to the guest', zones: B10_ZONES as never, shoulder: S10, lip: R10.lip, mic: FLAG },
  'b10.reporter': { title: 'B10 · the reporter’s own flag mic at their mouth', zones: B10_ZONES as never, shoulder: S10, lip: R10.lip, mic: FLAG },
  'b9.lip': { title: 'B09 · the seated commentator’s lip ribbon', zones: B09_ZONES as never, shoulder: SHOULDER_A, lip: CALLER.lip, mic: LIP },
};

export const HELD_CASES = Object.keys(DEF) as HeldCaseId[];

export type HeldGeo = { title: string; mic: Mic; front: V3; aim: V3; tail: V3; fist: V3; elbow: V3; shoulder: V3; wrist: V3; fr: { f: V3; h: V3; d: V3 }; /** the engine's own elbow, where the study corrects it */ engineElbow: V3; corrected: boolean };

const sub3 = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add3 = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul3 = (a: V3, k: number): V3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const len3 = (a: V3) => Math.hypot(a.x, a.y, a.z);
const unit3 = (a: V3): V3 => mul3(a, 1 / (len3(a) || 1));
const cross3 = (a: V3, b: V3): V3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });

/**
 * (step A round 2, B03 omni at the guest's mouth) The engine's elbow puts the forearm ALONG the handle,
 * which no hand can grip. Among the elbows the same arm can take (upper arm 300, forearm 290, the same
 * shoulder and fist: a circle), the one whose forearm meets the handle nearest 75°, the elbow no higher
 * than the shoulder. From where the reporter stands the arm is near full reach (542 of 590 mm), so the
 * best it can do is about 45°; 60–90° needs the reporter about 140 mm nearer the guest (STEP_IN). Measured points unchanged: the fist and the mic stay where they are.
 */
export function correctedElbow(shoulder: V3, fist: V3, handle: V3, a = 300, b = 290, want = 75): V3 {
  const d = len3(sub3(fist, shoulder));
  const u = unit3(sub3(fist, shoulder));
  const t = (a * a - b * b + d * d) / (2 * d);
  const r = Math.sqrt(Math.max(0, a * a - t * t));
  const c = add3(shoulder, mul3(u, t));
  let e1 = cross3(u, { x: 0, y: 1, z: 0 });
  if (len3(e1) < 1e-3) e1 = cross3(u, { x: 1, y: 0, z: 0 });
  e1 = unit3(e1);
  const e2 = unit3(cross3(u, e1));
  let best = c;
  let score = Infinity;
  for (let k = 0; k < 360; k += 1) {
    const ph = (k * Math.PI) / 180;
    const e = add3(c, add3(mul3(e1, r * Math.cos(ph)), mul3(e2, r * Math.sin(ph))));
    if (e.y < shoulder.y) continue; // (the elbow never rises above the shoulder)
    const f = unit3(sub3(fist, e));
    const ang = (Math.acos(Math.max(-1, Math.min(1, Math.abs(dot3(f, unit3(handle)))))) * 180) / Math.PI;
    const sc = Math.abs(ang - want);
    if (sc < score) {
      score = sc;
      best = e;
    }
  }
  return best;
}

export function heldGeo(id: HeldCaseId, corrected = true): HeldGeo {
  const c = DEF[id];
  const z = c.zones.find((q) => q.id === id)!;
  const aim = aimVec(z.start.az, z.start.el);
  const front = z.start.p;
  const len = corrected && c.mic.drawLen ? c.mic.drawLen : c.mic.len;
  const tail = { x: front.x - aim.x * len, y: front.y - aim.y * len, z: front.z - aim.z * len };
  // (the flag mic, drawn longer: the hand closes on the middle of the free handle below the flag)
  const fist = corrected && c.mic.drawLen ? sub3(front, mul3(aim, FLAG_BOTTOM + 47.5)) : heldFist(tail, aim);
  const engineElbow = heldElbowOf(c.shoulder, fist, 300, 290);
  const fEngine = unit3(sub3(fist, engineElbow));
  const along = Math.abs(dot3(fEngine, unit3(aim))) > 0.85;
  const elbow = corrected && along ? correctedElbow(c.shoulder, fist, aim) : engineElbow;
  const outward = { x: 0, y: 0, z: Math.sign(c.shoulder.z - c.lip.z) || 1 };
  const fr = heldFrame(elbow, fist, aim, 'R', outward);
  const wrist = { x: fist.x - fr.f.x * 104, y: fist.y - fr.f.y * 104, z: fist.z - fr.f.z * 104 };
  return { title: c.title, mic: corrected ? c.mic : { ...c.mic, drawLen: undefined }, front, aim, tail, fist, elbow, shoulder: c.shoulder, wrist, fr, engineElbow, corrected: corrected && (along || !!c.mic.drawLen) };
}

export const TOWARD: Record<'side' | 'top', V3> = { side: { x: 0, y: 0, z: 1 }, top: { x: 0, y: -1, z: 0 } };
export const proj = (view: 'side' | 'top', p: V3): Pt => (view === 'side' ? P(p.x, p.y) : P(p.x, p.z));
const neg = (a: V3): V3 => ({ x: -a.x, y: -a.y, z: -a.z });
/** A view vector at least `m` long (a part turned toward the viewer is drawn for reading, not shrunk away). */
const atLeast = (a: Pt, m: number, fallback: Pt): Pt => {
  const l = Math.hypot(a.u, a.v);
  if (l < 1e-3) return P(fallback.u * m, fallback.v * m);
  return l >= m ? a : P((a.u / l) * m, (a.v / l) * m);
};

/** (study, needs the owner's word: it moves the reporter) the shoulder this much nearer the guest. */
export const STEP_IN = 140;
export function steppedIn(id: HeldCaseId): { shoulder: V3; elbow: V3; angle: number } {
  const g = heldGeo(id);
  const toward = unit3({ x: g.fist.x - g.shoulder.x, y: 0, z: 0 });
  const shoulder = add3(g.shoulder, mul3(toward, STEP_IN));
  const elbow = correctedElbow(shoulder, g.fist, g.aim);
  const angle = (Math.acos(Math.min(1, Math.abs(dot3(unit3(sub3(g.fist, elbow)), unit3(g.aim))))) * 180) / Math.PI;
  return { shoulder, elbow, angle };
}

/** (study numbers) the forearm's angle to the handle and the arm's reach, engine and drawn. */
export function heldArmNumbers(id: HeldCaseId) {
  const g0 = heldGeo(id, false);
  const g = heldGeo(id, true);
  const ang = (e: V3, f: V3, aim: V3) => (Math.acos(Math.min(1, Math.abs(dot3(unit3(sub3(f, e)), unit3(aim))))) * 180) / Math.PI;
  return {
    engine: { elbow: g0.engineElbow, angle: ang(g0.engineElbow, g0.fist, g0.aim), upper: len3(sub3(g0.engineElbow, g0.shoulder)), fore: len3(sub3(g0.fist, g0.engineElbow)) },
    drawn: { elbow: g.elbow, angle: ang(g.elbow, g.fist, g.aim), upper: len3(sub3(g.elbow, g.shoulder)), fore: len3(sub3(g.fist, g.elbow)) },
    fistMoved: len3(sub3(g.fist, g0.fist)),
    corrected: g.corrected,
  };
}

export function heldViewOf(id: HeldCaseId, view: 'side' | 'top', corrected = false): { view: HeldView; words: string; sides: { back: number; forearm: number; thumb: number } } {
  const g = heldGeo(id, corrected);
  const s = heldSides(g.fr, TOWARD[view]);
  const v = heldViewFor(s);
  return { view: v, words: HELD_SIDE_WORDS[v], sides: s };
}

/** The mic, the lesson's own drawing: its front at `front`, laid along the handle as the view sees it. */
export function MicAt({ g, view, endOn }: { g: Pick<HeldGeo, 'front' | 'aim' | 'mic'>; view: 'side' | 'top'; endOn: boolean }) {
  const f = proj(view, g.front);
  const a = proj(view, g.aim);
  const la = Math.hypot(a.u, a.v);
  if (endOn) {
    // (an upright mic from above: its flag's top face and the grille, end-on)
    const r = g.mic.r;
    const s = r * 2.5;
    const flag = Skia.Path.Make();
    flag.addRRect(Skia.RRectXY(Skia.XYWHRect(f.u - s / 2, f.v - s / 2, s, s), r * 0.16, r * 0.16));
    const grille = Skia.Path.Make();
    grille.addCircle(f.u, f.v, r);
    return (
      <Group>
        {g.mic.art === 'flagHandheld' ? (
          <Group>
            <Path path={flag}>
              <LinearGradient start={vec(f.u - s / 2, f.v - s / 2)} end={vec(f.u + s / 2, f.v + s / 2)} colors={['#3a63a8', '#24427a', '#132748']} />
            </Path>
            <Path path={flag} style="stroke" strokeWidth={1.4} color="#08080a" opacity={0.9} />
          </Group>
        ) : null}
        <Path path={grille}>
          <RadialGradient c={vec(f.u - r * 0.35, f.v - r * 0.4)} r={r * 1.75} colors={['#e3e6ec', '#a9aeb8', '#62666f', '#2a2c32']} positions={[0, 0.3, 0.68, 1]} />
        </Path>
        <Path path={grille} style="stroke" strokeWidth={1.2} color="#0a0a0d" opacity={0.85} />
      </Group>
    );
  }
  const th = Math.atan2(-a.v, -a.u) - Math.PI / 2;
  return (
    <Group transform={[{ translateX: f.u }, { translateY: f.v }, { rotate: th }, { scaleY: Math.max(0.2, la) }]}>
      <MikingMicArt art={g.mic.art} r={g.mic.r} len={g.mic.drawLen ?? g.mic.len} />
    </Group>
  );
}

/** The forearm in the jacket sleeve, 10 mm of shirt cuff at the wrist (the cast's own cloth). */
function Sleeve({ g, view, wrist, dir }: { g: HeldGeo; view: 'side' | 'top'; wrist: Pt; /** the drawn forearm's direction toward the hand (unit times its foreshortening) */ dir: Pt }) {
  const { MAT, JACKET } = useLook();
  const fl = Math.hypot(dir.u, dir.v);
  const du = fl > 1e-6 ? P(dir.u / fl, dir.v / fl) : P(1, 0);
  const at = (k: number) => P(wrist.u - du.u * k * Math.max(fl, 0.3), wrist.v - du.v * k * Math.max(fl, 0.3));
  const E = proj(view, g.elbow);
  const J = at(26);
  const C = at(16);
  const jm = JACKET ?? MAT.shirt;
  if (fl < 0.35) {
    // (the forearm toward the viewer: the sleeve's end seen as a ring round the wrist, behind the fist)
    const ring = Skia.Path.Make();
    ring.addCircle(J.u, J.v, 40);
    const cuff = Skia.Path.Make();
    cuff.addCircle(C.u, C.v, 34);
    return (
      <Group>
        <Path path={ring} color={jm.form[2]} />
        <Path path={ring} style="stroke" strokeWidth={1.2} color={jm.edge} opacity={0.7} />
        <Path path={cuff} color={MAT.shirt.form[2]} />
        <Path path={cuff} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.6} />
      </Group>
    );
  }
  const jacket = smoothClosed(limbOutline([E, J], [43, 39], { capStart: true, capEnd: false }), 0.4);
  const shirt = smoothClosed(limbOutline([J, C], [34.5, 34], { capStart: false, capEnd: false }), 0.3);
  const [s0, s1] = across(E, J, 40);
  return (
    <Group>
      <Path path={shirt}>
        <LinearGradient start={vec(s0.u, s0.v)} end={vec(s1.u, s1.v)} colors={MAT.shirt.form} positions={MAT.shirt.pos} />
      </Path>
      <Path path={shirt} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.6} />
      <Path path={jacket}>
        <LinearGradient start={vec(s0.u, s0.v)} end={vec(s1.u, s1.v)} colors={jm.form} positions={jm.pos} />
      </Path>
      <Path path={jacket} style="stroke" strokeWidth={1.1} color={jm.edge} opacity={0.7} />
    </Group>
  );
}

/** The handle's radius where the hand closes on it (the drawing's own taper near the tail). */
export const gripR = (m: Mic) => (m.art === 'lipRibbon' ? 0.6 * m.r : 0.52 * m.r);

/** The grip as a view sees it (the true projection of the one 3-D hand). */
export function heldGripOf(id: HeldCaseId, view: 'side' | 'top') {
  const g = heldGeo(id);
  return placeGrip(g.fist, g.fr, TOWARD[view], (p) => proj(view, p), gripR(g.mic));
}

/** The held hand on its arm with the lesson's mic, as the view sees it. */
export function HeldStudy({ id, view, arms = false }: { id: HeldCaseId; view: 'side' | 'top'; /** draw the arm's lines: the engine's (dashed) and the corrected one */ arms?: boolean }) {
  const g = heldGeo(id);
  const v = heldViewFor(heldSides(g.fr, TOWARD[view]));
  const F = proj(view, g.fist);
  const h = heldGripOf(id, view);
  const mic = <MicAt g={g} view={view} endOn={v === 'heldEnd'} />;
  const sleeveBehind = h.sleeveBehind;
  const dir = h.forearm;
  const wrist = h.wrist;
  const armLine = (e: V3, sh: V3 = g.shoulder) => {
    const p = Skia.Path.Make();
    const S = proj(view, sh);
    const E = proj(view, e);
    p.moveTo(S.u, S.v);
    p.lineTo(E.u, E.v);
    p.lineTo(F.u, F.v);
    return p;
  };
  return (
    <Group>
      {arms ? (
        <Group>
          {g.corrected ? <Path path={armLine(g.engineElbow)} style="stroke" strokeWidth={14} strokeJoin="round" color="#8a93a6" opacity={0.35} /> : null}
          <Path path={armLine(g.elbow)} style="stroke" strokeWidth={8} strokeJoin="round" color="#ffc64d" opacity={0.7} />
          {g.corrected && !g.mic.drawLen ? (() => {
            const st = steppedIn(id);
            return <Path path={armLine(st.elbow, st.shoulder)} style="stroke" strokeWidth={6} strokeJoin="round" color="#5fd4c8" opacity={0.7} />;
          })() : null}
        </Group>
      ) : null}
      {sleeveBehind ? <Sleeve g={g} view={view} wrist={wrist} dir={dir} /> : null}
      <HeldHand h={h} mic={mic} />
      {sleeveBehind ? null : <Sleeve g={g} view={view} wrist={wrist} dir={dir} />}
    </Group>
  );
}
