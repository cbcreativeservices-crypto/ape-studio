/**
 * STUDY PAGE — the shared figure from the FRONT and the two-handed boom grip
 * (wave 4 of D78, builder "FrontAndBoom", 2026-11-24). Dev only, on the web
 * preview: `#labpreview/FigureStudy/front` (and `/frontclose`, `/frontlesson`).
 *   • the five cast members from the front, standing and seated, with and
 *     without the jacket, the hands at rest — old beside new, at the lesson's
 *     size and enlarged about three times.
 */
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Canvas, Group, Path, Rect, Skia } from '@shopify/react-native-skia';
import { FigureScale, type FigureLevel } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { CAST, type CastId } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { PersonFrontV2 } from '../screens/lab/miking/lessons/shared/figureV2/FigureV2Front';
import { FRONT_SEATED, FRONT_STANDING } from '../screens/lab/miking/lessons/shared/figureV2/frontPlan';
import { PlayerBehind, PlayerInFront } from '../screens/lab/miking/lessons/shared/players/PlayerFigure';
import type { PlayerPose } from '../screens/lab/miking/lessons/shared/players/playerPose';
import { BoomOperatorV2, boomPlans, type BoomRig, type BoomView } from '../screens/lab/miking/lessons/shared/figureV2/BoomV2';
import { castFor } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { BoomOperator } from '../screens/lab/miking/lessons/shared/field/LocationArt';
import { B04_V2_RIGS } from '../screens/lab/miking/lessons/b04BoomCamera/scene';
import { FULL_POLE as F09_POLE, OPERATOR_POSES as F09_POSES, REAR_HAND as F09_REAR } from '../screens/lab/miking/lessons/f09LocationSpeech/scene';
import { GRIP as F09_GRIP } from '../screens/lab/miking/lessons/f09LocationSpeech/geometry';
import { B10_BOOM_RIGS, B10_OPERATOR_WHO, B10BoomDebugV2, B10BoomHandsOver, B10Scene } from '../screens/lab/miking/lessons/b10Sideline/scene';
import { GRIP as B10_GRIP_PT, SHOULDER_REP as B10_SHOULDER_REP } from '../screens/lab/miking/lessons/b10Sideline/geometry';
import { B10_HELD } from '../screens/lab/miking/lessons/b10Sideline/held';
import { HeldStatic, heldMicAt, type HeldMicNow } from '../screens/lab/miking/lessons/shared/figureV2/heldLive';
import { FigureLook } from '../screens/lab/miking/lessons/shared/figureV2/look';
import { HeldStudy, heldGeo, type HeldCaseId } from './heldStudy';
import { APPROVED_PALMS, POLE_SIDE_HANDS, SIDE_TURN_MAX } from '../screens/lab/miking/lessons/shared/figureV2/BoomV2';
import { OPERATOR_POSES as B11_POSES } from '../screens/lab/miking/lessons/b11Athletes/scene';
import { GRIP as B11_GRIP } from '../screens/lab/miking/lessons/b11Athletes/geometry';
import { FLOOR as B10_FLOOR } from '../screens/lab/miking/lessons/b10Sideline/geometry';
import { operatorPoses as b10OperatorPoses } from '../screens/lab/miking/lessons/shared/field/LocationArt';
import { alongPole } from '../screens/lab/miking/lessons/shared/figureV2/boomGrip';

const STAGE = '#14171d';
const INK = '#d7dbe3';
const DIM = '#9aa3b2';
const IDS: CastId[] = ['drummer', 'ana', 'ruth', 'kofi', 'mei'];
const LIP = { u: 0, v: 0 };
/** The lip point of a front pose (the standing figure's mouth is at the origin; a seated one is lowered). */
const lipOf = (pose: PlayerPose) => ({ u: 0, v: pose.head.c.v - FRONT_STANDING.head.c.v });

function Caption({ title, note }: { title: string; note?: string }) {
  return (
    <View style={{ marginBottom: 6, marginTop: 4 }}>
      <Text style={{ color: INK, fontSize: 13, fontWeight: '700', letterSpacing: 0.6 }}>{title}</Text>
      {note ? <Text style={{ color: DIM, fontSize: 11, marginTop: 2 }}>{note}</Text> : null}
    </View>
  );
}

export type PicItem = { key: string; cu: number; cv: number; mmW: number; mmH: number; label?: string; node: ReactNode };

/** Several windows of a view side by side, each `w` pt wide — ONE canvas per row of `per` (the web build has
 *  only a few WebGL contexts). */
export function Pics({ w, items, level, per = 3 }: { w: number; items: PicItem[]; level?: FigureLevel; per?: number }) {
  const rows: PicItem[][] = [];
  for (let i = 0; i < items.length; i += per) rows.push(items.slice(i, i + per));
  const gap = 8;
  return (
    <View>
      {rows.map((row, r) => {
        const h = Math.max(...row.map((it) => (it.mmH * w) / it.mmW));
        return (
          <View key={r} style={{ marginBottom: 8 }}>
            <Canvas style={{ width: row.length * (w + gap), height: h }}>
              {row.map((it, i) => {
                const s = w / it.mmW;
                return (
                  <Group key={it.key}>
                    <Rect x={i * (w + gap)} y={0} width={w} height={h} color={STAGE} />
                    <Group clip={{ x: i * (w + gap), y: 0, width: w, height: h }}>
                      <Group transform={[{ translateX: i * (w + gap) + w / 2 - it.cu * s }, { translateY: h / 2 - it.cv * s }, { scale: s }]}>
                        <FigureScale ptPerMm={s} level={level}>
                          {it.node}
                        </FigureScale>
                      </Group>
                    </Group>
                  </Group>
                );
              })}
            </Canvas>
            <View style={{ flexDirection: 'row' }}>
              {row.map((it) => (
                <Text key={it.key} style={{ color: DIM, fontSize: 10, width: w + gap }}>
                  {it.label ?? ''}
                </Text>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const Old = ({ pose }: { pose: PlayerPose }) => (
  <Group>
    <PlayerBehind pose={pose} />
    <PlayerInFront pose={pose} hands />
  </Group>
);

/** The figure's whole height window for a pose. */
function windowOf(pose: PlayerPose) {
  const top = pose.head.c.v - 170;
  const bot = (pose.floor ?? 1550) + 30;
  return { cu: 0, cv: (top + bot) / 2, mmW: 620, mmH: bot - top };
}

function Row({ pose, jacket, w, level, old = true, per = 6 }: { pose: PlayerPose; jacket: boolean; w: number; level?: FigureLevel; old?: boolean; per?: number }) {
  // (the drummer has no jacket of his own: the approved dress variant leaves him out)
  const who = jacket ? IDS.filter((id) => id !== 'drummer') : IDS;
  const all: (CastId | 'old')[] = old ? ['old', ...who] : who;
  const chunks: (CastId | 'old')[][] = [];
  for (let i = 0; i < all.length; i += per) chunks.push(all.slice(i, i + per));
  return (
    <View>
      {chunks.map((c, i) => (
        <Strip key={i} pose={pose} jacket={jacket} w={w} level={level} ids={c} />
      ))}
    </View>
  );
}

function Strip({ pose, jacket, w, level, ids }: { pose: PlayerPose; jacket: boolean; w: number; level?: FigureLevel; ids: (CastId | 'old')[] }) {
  // ONE canvas per strip (the web build has a small number of WebGL contexts)
  const win = windowOf(pose);
  const s = w / win.mmW;
  const h = win.mmH * s;
  const gap = 8;
  const W = ids.length * (w + gap);
  return (
    <View style={{ marginBottom: 10 }}>
      <Canvas style={{ width: W, height: h }}>
        {ids.map((id, i) => (
          <Group key={id}>
            <Rect x={i * (w + gap)} y={0} width={w} height={h} color={STAGE} />
            <Group transform={[{ translateX: i * (w + gap) + w / 2 - win.cu * s }, { translateY: h / 2 - win.cv * s }, { scale: s }]}>
              <FigureScale ptPerMm={s} level={level}>
                {id === 'old' ? <Old pose={pose} /> : <PersonFrontV2 pose={pose} who={CAST[id]} opts={{ lip: lipOf(pose), jacket }} />}
              </FigureScale>
            </Group>
          </Group>
        ))}
      </Canvas>
      <View style={{ flexDirection: 'row' }}>
        {ids.map((id) => (
          <Text key={id} style={{ color: DIM, fontSize: 10, width: w + gap }}>
            {id === 'old' ? 'OLD' : CAST[id].name}
          </Text>
        ))}
      </View>
    </View>
  );
}

/* ── SET 2: the boom-pole grip ── */

const OPERATOR = castFor('operator.boom');
/** B04's close shot: the overhead hold (the near arm — the operator's left — on the rear hand, as the old drawing). */
export const RIG_B04: BoomRig = B04_V2_RIGS.close.full;
/** B04's setup from below: the pole held low (the near arm on the FRONT hand). */
export const RIG_B04_LOW: BoomRig = B04_V2_RIGS.low.full;
/** F09's set: the rear hand 0.8 m back along the pole. */
export const RIG_F09: BoomRig = { side: F09_POSES.side, top: F09_POSES.top, front: F09_GRIP, rear: F09_REAR, pole: F09_POLE, rearArm: 'L' };

function boomItems(rig: BoomRig, view: BoomView, mm: number, key: string, old = true, who = OPERATOR, at?: { u: number; v: number }): PicItem[] {
  const B = boomPlans(rig, who, view);
  const c = at ?? (view === 'front' ? { u: 0, v: 300 } : view === 'side' ? { u: rig.side.neck.u - 100, v: rig.side.neck.v + 200 } : { u: rig.top.neck.u, v: rig.top.neck.v });
  void B;
  const out: PicItem[] = [];
  if (old && view !== 'front')
    out.push({ key: `${key}o`, cu: c.u, cv: c.v, mmW: mm, mmH: mm * 1.55, label: `OLD · ${view}`, node: <BoomOperator view={view} poses={{ side: rig.side, top: rig.top }} stub={rig.pole} dim={1} /> });
  out.push({ key: `${key}n`, cu: c.u, cv: c.v, mmW: mm, mmH: mm * 1.55, label: `NEW · ${view}`, node: <BoomOperatorV2 view={view} rig={rig} who={who} dim={1} /> });
  return out;
}

/** (FrontBoom5) the approved mic hand, palm side (/michand: B03 · the shared omni), beside the boom operator's two
 *  hands from the front — one window size, so one pt/mm. They must read as the same hand turned on the page. */
function approvedBeside(mm: number, keyP: string): PicItem[] {
  const B = boomPlans(RIG_B04, OPERATOR, 'front');
  // (each window on the hand itself: a third of the way from the fist's middle to the wrist)
  const mid = (f: { u: number; v: number }, w: { u: number; v: number }) => ({ u: f.u + (w.u - f.u) * 0.35, v: f.v + (w.v - f.v) * 0.35 });
  const approvedOf = (id: string, k: string): PicItem => {
    const A = APPROVED_PALMS.find((p) => p.id === id)!;
    const g = heldGeo(id as HeldCaseId);
    const pr = (p: { x: number; y: number; z: number }) => (A.plane === 'side' ? { u: p.x, v: p.y } : { u: p.x, v: p.z });
    const ca = mid(pr(g.fist), pr(g.wrist));
    return {
      key: `${keyP}ap${k}`,
      cu: ca.u,
      cv: ca.v,
      mmW: mm,
      mmH: mm,
      label: `APPROVED ${id}, palm side (${A.plane === 'side' ? '/michand' : '/michandtop'})`,
      node: (
        <FigureLook look={OPERATOR.look}>
          <HeldStudy id={id as HeldCaseId} view={A.plane} />
        </FigureLook>
      ),
    };
  };
  // (on the viewer's left the operator's right hand: each beside the approved picture it is drawn from)
  return [...B.arms]
    .sort((p, q) => (p.hand.arm.side === 'R' ? -1 : 1) - (q.hand.arm.side === 'R' ? -1 : 1))
    .flatMap((a, i): PicItem[] => {
      const c = mid(B.vs.proj(a.hand.arm.fist), a.hand.grip.wrist);
      const left = a.hand.arm.side === 'L';
      return [
        approvedOf(a.approved ?? 'b3.shared', String(i)),
        { key: `${keyP}b${i}`, cu: c.u, cv: c.v, mmW: mm, mmH: mm, label: `boom hand, front, ${left ? 'LEFT (the approved hand mirrored, turned)' : 'RIGHT (the approved hand turned)'}`, node: <BoomOperatorV2 view="front" rig={RIG_B04} who={OPERATOR} dim={1} /> },
      ];
    });
}

/** A close window on each hand (side, above, front). */
function handItems(rig: BoomRig, view: BoomView, mm: number): PicItem[] {
  const B = boomPlans(rig, OPERATOR, view);
  return B.arms.map((a, i) => {
    const f = B.vs.proj(a.hand.arm.fist);
    return { key: `h${view}${i}`, cu: f.u, cv: f.v + 40, mmW: mm, mmH: mm, label: `${view} · ${a.hand.arm.side === 'L' ? 'left' : 'right'} hand${a.far ? ' (far)' : ''}`, node: <BoomOperatorV2 view={view} rig={rig} who={OPERATOR} dim={1} /> };
  });
}

/**
 * B10 POST-EVENT AS THE LESSON DRAWS IT (dev): the scene, the engine's pole (from the mic's tail to the grip, as
 * PlacementScene's PoleMount draws it), then the operator's fists again over it (B10BoomHandsOver, the lesson's
 * HeldConfig.front) — with the boom mic at its start, dragged below the guest's mouth, and raised over her head.
 * `boomb10` side; `boomb10-top` from above.
 */
const B10_MICS: { label: string; front: { x: number; y: number; z: number }; aim: { x: number; y: number; z: number } }[] = (() => {
  const u = (x: number, y: number, z: number) => {
    const l = Math.hypot(x, y, z) || 1;
    return { x: x / l, y: y / l, z: z / l };
  };
  return [
    { label: 'start (900 mm at 45° over the mouth)', front: { x: 900 * Math.SQRT1_2, y: -900 * Math.SQRT1_2, z: 0 }, aim: u(-1, 1, 0) },
    { label: 'dragged below the mouth (aimed up)', front: { x: 260, y: 260, z: 0 }, aim: u(-0.7, -1, 0) },
    { label: 'raised over the head', front: { x: 250, y: -620, z: 0 }, aim: u(-0.3, 1, 0) },
  ];
})();
/** B10's faint reporter behind the guest (side): old (whole at one opacity) beside new (the ghost), the sideline
 *  setup with the reporter's handheld at its start; at about 3x and at the lesson's size. `boomb10ghost`. */
const GHOST_FLAG = { front: { x: 100, y: 30, z: 0 }, aim: { x: -1, y: 0, z: 0 } };
function B10GhostStudy({ width }: { width: number }) {
  const mic: HeldMicNow = heldMicAt('hand', GHOST_FLAG.front, GHOST_FLAG.aim, 200, 25, B10_SHOULDER_REP, B10_HELD, 'bcFlagOmni');
  const it = (ghost: boolean, mm: number, key: string): PicItem => ({
    key,
    cu: -40,
    cv: 40,
    mmW: mm,
    mmH: mm * 0.9,
    label: `${ghost ? 'NEW · the reporter a ghost' : 'OLD · the reporter whole, faint'} · ${mm < 700 ? 'about 3x' : 'lesson size'}`,
    node: (
      <HeldStatic cfg={B10_HELD} mics={[mic]}>
        <B10Scene view="side" variant="sideline" ghost={ghost} />
      </HeldStatic>
    ),
  });
  return (
    <View>
      <Caption title="B10 — THE FAINT REPORTER BEHIND THE GUEST (side)" note="Old: the reporter whole at one opacity over the guest (a double exposure). New: one soft even tone with a darker edge, no inner detail; her held arm and hand solid." />
      <Pics w={Math.min(Math.floor((width - 40) / 2), 380)} per={2} level="full" items={[it(false, 560, 'go'), it(true, 560, 'gn')]} />
      <Pics w={Math.min(Math.floor((width - 40) / 2), 380)} per={2} level="lite" items={[it(false, 2400, 'lo'), it(true, 2400, 'ln')]} />
    </View>
  );
}

function B10LiveStudy({ width, only }: { width: number; only: string }) {
  const view = only.endsWith('top') ? 'top' : 'side';
  const len = 50;
  const items: PicItem[] = B10_MICS.map((m, i) => {
    const tail = { x: m.front.x - m.aim.x * len, y: m.front.y - m.aim.y * len, z: m.front.z - m.aim.z * len };
    const mic: HeldMicNow = { key: 'boom', front: m.front, aim: m.aim, grip: B10_GRIP_PT, fist: B10_GRIP_PT, r: 10, len };
    const pr = (p: { x: number; y: number; z: number }) => (view === 'side' ? { u: p.x, v: p.y } : { u: p.x, v: p.z });
    const A = pr(tail);
    const Bp = pr(B10_GRIP_PT);
    const F = pr(m.front);
    const pole = Skia.Path.Make();
    pole.moveTo(A.u, A.v);
    pole.lineTo(Bp.u, Bp.v);
    const body = Skia.Path.Make();
    body.moveTo(F.u, F.v);
    body.lineTo(A.u, A.v);
    // ('boomb10hands', dev: a close window on the operator's hands, about 0.85 pt/mm)
    const close = only.includes('hands') && view === 'side';
    return {
      key: `b10l${i}`,
      cu: close ? B10_GRIP_PT.x - (only.includes('handsz') ? 60 : 180) : 500,
      cv: close ? B10_GRIP_PT.y - (only.includes('handsz') ? 0 : 60) : view === 'side' ? 0 : 400,
      mmW: close ? (only.includes('handsz') ? 420 : 900) : 2200,
      mmH: (close ? (only.includes('handsz') ? 420 : 900) : 2200) * 0.85,
      label: m.label,
      node: (
        <HeldStatic cfg={B10_HELD} mics={[mic]}>
          <B10Scene view={view} variant="postEvent" />
          <Path path={pole} style="stroke" strokeWidth={24} strokeCap="round" color="#060608" />
          <Path path={pole} style="stroke" strokeWidth={20} strokeCap="round" color="#2b2e35" />
          <Path path={body} style="stroke" strokeWidth={40} strokeCap="round" color="#5a5f6a" />
          {only.includes('nohands') ? null : only.includes('debug') ? <B10BoomDebugV2 view={view} /> : <B10BoomHandsOver view={view} />}
        </HeldStatic>
      ),
    };
  });
  return (
    <View>
      <Caption title={`B10 POST-EVENT — as the lesson draws it (${view})`} note="The scene, the engine's pole from the mic's tail to the grip, the operator's fists painted again over it. Mic at its start, dragged below the guest's mouth, raised over her head." />
      <Pics w={Math.min(width - 24, 760)} per={1} level="full" items={items} />
    </View>
  );
}

/* ── "Boom side" (2026-11-24): the approved authored pole hands on the side view the lessons draw ── */

const B11_STUB = { a: B11_GRIP, b: { x: B11_GRIP.x - 380, y: B11_GRIP.y + 420, z: B11_GRIP.z - 300 } };
/** B11's perimeter boom, as b11Athletes/scene builds its rig. */
export const RIG_B11: BoomRig = { side: B11_POSES.side, top: B11_POSES.top, front: B11_GRIP, rear: alongPole(B11_GRIP, B11_STUB.b, 420), pole: B11_STUB, rearArm: 'L' };
/**
 * (dev) B10's live rig for a dragged boom mic, rebuilt as b10Sideline/scene's liveRig builds it (that function is the
 * lesson's own and not exported): the pole from the mic's tail through the grip, the front hand 42 cm toward the mic,
 * her stance under the pole or behind its end. For the study page only; the lesson keeps its own.
 */
function b10LiveRig(front: { x: number; y: number; z: number }, aim: { x: number; y: number; z: number }): BoomRig | null {
  const len = 50;
  const G = B10_GRIP_PT;
  const tail = { x: front.x - aim.x * len, y: front.y - aim.y * len, z: front.z - aim.z * len };
  const l = Math.hypot(G.x - tail.x, G.y - tail.y, G.z - tail.z) || 1;
  const d = { x: (G.x - tail.x) / l, y: (G.y - tail.y) / l, z: (G.z - tail.z) / l };
  const at = (k: number) => ({ x: G.x + d.x * k, y: G.y + d.y * k, z: G.z + d.z * k });
  const fr = at(-420);
  const headTop = B10_FLOOR - 1750;
  const end = at(110);
  const clear = (hx: number) => {
    for (let x = hx - 135; x <= hx + 110; x += 15) {
      const den = end.x - tail.x;
      if (Math.abs(den) < 1) return false;
      const t = (x - tail.x) / den;
      if (t < 0 || t > 1) continue;
      if (tail.y + (end.y - tail.y) * t > headTop - 45) return false;
    }
    return true;
  };
  for (const k of [-210, -240, -180, -270, -150, -300, -120, -90, -60, -30, 0, 40, 200, 240, 280, 320, 360]) {
    const mid = at(k);
    const feet = { x: mid.x - 10, y: B10_FLOOR, z: mid.z };
    if (k <= 110 && (mid.y > headTop - 60 || at(k - 100).y > headTop + 10)) continue;
    if (!clear(feet.x + 10)) continue;
    const neck = { x: feet.x + 28, y: B10_FLOOR - (1750 - 114 - 172), z: feet.z };
    const far = (p: { x: number; y: number; z: number }) => Math.hypot(p.x - neck.x, p.y - neck.y, p.z - neck.z) > 760;
    if (far(fr) || far(G)) continue;
    const poses = b10OperatorPoses(feet, fr, { rear: G });
    return { side: poses.side, top: poses.top, front: fr, rear: G, pole: { a: tail, b: end }, rearArm: 'R', elbows: 'beside', ...(k > 110 ? { sideRearFar: true } : {}) };
  }
  return null;
}
const B10_LIVE = B10_MICS.map((m) => b10LiveRig(m.front, m.aim));
export const SIDE_RIGS: { key: string; title: string; rig: BoomRig; who: typeof OPERATOR }[] = [
  { key: 'b04', title: 'B04 · CLOSE SHOT (overhead)', rig: RIG_B04, who: OPERATOR },
  { key: 'low', title: 'B04 · HELD LOW (the shot from below)', rig: RIG_B04_LOW, who: OPERATOR },
  { key: 'f09', title: 'F09 · ON SET (the rear hand 0.8 m back)', rig: RIG_F09, who: OPERATOR },
  { key: 'b10', title: 'B10 · POST-EVENT OVERHEAD (the starting setup)', rig: B10_BOOM_RIGS.overhead, who: B10_OPERATOR_WHO },
  { key: 'b11', title: 'B11 · PERIMETER', rig: RIG_B11, who: OPERATOR },
  ...B10_LIVE.flatMap((rig, i) => (rig ? [{ key: `b10live${i}`, title: `B10 · POST-EVENT, THE BOOM MIC ${B10_MICS[i].label}`, rig, who: B10_OPERATOR_WHO }] : [])),
];

/** In words, what each hand shows the side camera and how far the drawing is from the hand's real turn. */
function sideWords(rig: BoomRig, who: typeof OPERATOR): string {
  const B = boomPlans(rig, who, 'side');
  return B.arms
    .map((a) => {
      const f = a.hand.sideFace;
      const side = a.hand.arm.side === 'L' ? 'left' : 'right';
      if (!f) return `${side}: old hand`;
      const art = f.face === 'back' ? 'BACK of the hand (poleHandBack)' : 'PALM side (poleHandFront)';
      const kept = a.hand.painter === 'poleBack' || a.hand.painter === 'poleFront' ? '' : ` — OLD HAND KEPT (${f.fits ? 'the other hand cannot be placed' : f.why})`;
      return `${a.far ? 'far' : 'near'} ${side} hand: ${art}${a.hand.arm.side === 'L' ? ', mirrored' : ''}; the real hand turned ${f.turn.toFixed(0)}° from square to the camera${f.turn > SIDE_TURN_MAX ? ' (PAST 30°: the nearer drawing)' : ''}; its forearm ${f.foreSquare.toFixed(0)}° off square to the pole${kept}`;
    })
    .join('  ·  ');
}

function BoomSideStudy({ width, only }: { width: number; only: string }) {
  const w = Math.min(Math.floor((width - 40) / 2), 560);
  if (only.startsWith('boomsidez')) {
    // (dev) each hand close (about 2.5 pt/mm), old beside new: boomsidez[-<rig key>]
    const pick = only.split('-')[1];
    const z = Math.min(Math.floor((width - 40) / 2), 400);
    return (
      <View>
        {SIDE_RIGS.filter((r) => !pick || r.key === pick).map((r) => {
          const B = boomPlans(r.rig, r.who, 'side');
          const its: PicItem[] = B.arms.flatMap((a, i) => {
            const f = B.vs.proj(a.hand.arm.fist);
            const at = a.hand.poleBack ?? a.hand.poleFront;
            // (the window on the hand: a little toward its wrist)
            const c = at ? { u: f.u - Math.sin(at.rot) * 30, v: f.v + Math.cos(at.rot) * 30 } : f;
            const mm = z / 2.5;
            const lab = `${a.far ? 'far' : 'near'} ${a.hand.arm.side === 'L' ? 'left' : 'right'}`;
            return [
              { key: `z${r.key}${i}o`, cu: c.u, cv: c.v, mmW: mm, mmH: mm, label: `${r.key} OLD · ${lab}`, node: <BoomOperatorV2 view="side" rig={r.rig} who={r.who} dim={1} oldSide /> },
              { key: `z${r.key}${i}n`, cu: c.u, cv: c.v, mmW: mm, mmH: mm, label: `${r.key} NEW · ${lab} · ${a.hand.sideFace?.face ?? ''} ${a.hand.sideFace ? `${a.hand.sideFace.turn.toFixed(0)}°` : ''}`, node: <BoomOperatorV2 view="side" rig={r.rig} who={r.who} dim={1} /> },
            ];
          });
          return <Pics key={r.key} w={z} per={2} level="full" items={its} />;
        })}
      </View>
    );
  }
  const items = (r: (typeof SIDE_RIGS)[number], mm: number, k: string, whole: boolean): PicItem[] => {
    const B = boomPlans(r.rig, r.who, 'side');
    const fs = B.arms.map((a) => B.vs.proj(a.hand.arm.fist));
    const c = whole ? { u: r.rig.side.neck.u - 100, v: r.rig.side.neck.v + 200 } : { u: (fs[0].u + fs[1].u) / 2, v: (fs[0].v + fs[1].v) / 2 + 60 };
    const h = whole ? mm * 1.55 : mm * 0.8;
    return [
      { key: `${k}o`, cu: c.u, cv: c.v, mmW: mm, mmH: h, label: `OLD side hands · ${whole ? 'lesson size' : '1 pt/mm'}`, node: <BoomOperatorV2 view="side" rig={r.rig} who={r.who} dim={1} oldSide /> },
      { key: `${k}n`, cu: c.u, cv: c.v, mmW: mm, mmH: h, label: `NEW · the approved pole hands · ${whole ? 'lesson size' : '1 pt/mm'}`, node: <BoomOperatorV2 view="side" rig={r.rig} who={r.who} dim={1} /> },
    ];
  };
  return (
    <View>
      <Caption
        title="THE BOOM OPERATOR FROM THE SIDE — THE APPROVED POLE HANDS (Boom side)"
        note={`Each rig: old beside new, the two hands at about 1 pt/mm, then the whole operator at the lesson's size. Each hand is one of the two approved drawings (back of the hand / palm side), the left hand the mirror image, its pole axis on the rig's pole through the middle of the fist, the wrist straight. POLE_SIDE_HANDS = ${String(POLE_SIDE_HANDS)}.`}
      />
      {SIDE_RIGS.map((r) => (
        <View key={r.key}>
          <Caption title={r.title} note={sideWords(r.rig, r.who)} />
          <Pics w={w} per={2} level="full" items={items(r, w, `s${r.key}`, false)} />
          <Pics w={130} per={2} level="lite" items={items(r, 1500, `l${r.key}`, true)} />
        </View>
      ))}
    </View>
  );
}

function BoomStudy({ width, only }: { width: number; only: string }) {
  const w3 = Math.min(Math.floor((width - 50) / 3), 300);
  const w2 = Math.min(Math.floor((width - 40) / 2), 420);
  if (only.startsWith('boomside')) return <BoomSideStudy width={width} only={only} />;
  return (
    <View>
      {only === 'boom' || only === 'boomwhole' ? (
        <View>
          <Caption title="THE BOOM OPERATOR — B04, CLOSE SHOT (overhead hold)" note="Old beside new, side view and from above; then from the front. Mei holds the pole overhead: both hands on it, the elbows bent out beside the head; each hand the approved 3-D grip closed round the pole (fingers round one side, the thumb round the other)." />
          <Pics w={w3} level="full" items={[...boomItems(RIG_B04, 'side', 1300, 'bs'), ...boomItems(RIG_B04, 'front', 1100, 'bf', false)]} />
          <Pics w={w3} level="full" items={[...boomItems(RIG_B04, 'top', 1300, 'bt')]} />
          <Caption title="FROM THE FRONT, BESIDE THE APPROVED STANDING FIGURE (FrontBoom4)" note="Mei as passed on /frontstand, then the boom operator from the front at the same scale: the trousers no wider than hers; each armpit one soft line from the shirt into the raised sleeve; both fists closed round the pole. At about 3x, then at the lesson's size." />
          <Pics w={w3} level="full" per={2} items={[{ key: 'cmpS', cu: 0, cv: 380, mmW: 1100, mmH: 1705, label: 'APPROVED · Mei standing (/frontstand)', node: <PersonFrontV2 pose={FRONT_STANDING} who={CAST.mei} opts={{ lip: LIP }} /> }, ...boomItems(RIG_B04, 'front', 1100, 'cmpB', false, OPERATOR, { u: 0, v: 380 })]} />
          <Pics w={90} per={2} level="lite" items={[{ key: 'cmpSl', cu: 0, cv: 380, mmW: 1100, mmH: 1705, label: 'APPROVED', node: <PersonFrontV2 pose={FRONT_STANDING} who={CAST.mei} opts={{ lip: LIP }} /> }, ...boomItems(RIG_B04, 'front', 1100, 'cmpBl', false, OPERATOR, { u: 0, v: 380 })]} />
          <Caption title="F09, ON SET (the rear hand 0.8 m back) AND B04 HELD LOW (from below the frame)" />
          <Pics w={w3} level="full" items={[...boomItems(RIG_F09, 'side', 1500, 'fs', false), ...boomItems(RIG_B04_LOW, 'side', 1500, 'ls', false), ...boomItems(RIG_F09, 'top', 1500, 'ft', false)]} />
          <Caption title="AT THE LESSON'S SIZE (lite)" />
          <Pics w={90} per={6} level="lite" items={[...boomItems(RIG_B04, 'side', 1500, 'Ls'), ...boomItems(RIG_B04, 'top', 1500, 'Lt'), ...boomItems(RIG_F09, 'side', 1500, 'Lf', false)]} />
        </View>
      ) : null}
      {only.startsWith('boomz-') ? (
        // (dev) one whole operator at the page's width: boomz-<b04|low|f09>-<side|top|front>[-<mm>[-<u>_<v>]] (u, v: the
        // window's middle, mm; a minus sign as 'm')
        (() => {
          const [, r, vw, mm, cuv] = only.split('-');
          const rig = r === 'low' ? RIG_B04_LOW : r === 'f09' ? RIG_F09 : r === 'b10' ? B10_BOOM_RIGS.overhead : RIG_B04;
          const at = cuv ? (([u, v]) => ({ u: Number(u.replace('m', '-')), v: Number(v.replace('m', '-')) }))(cuv.split('_')) : undefined;
          return <Pics w={Math.min(width - 24, 760)} per={1} level="full" items={boomItems(rig, vw as BoomView, Number(mm) || 1300, 'z', false, r === 'b10' ? B10_OPERATOR_WHO : OPERATOR, at)} />;
        })()
      ) : null}
      {only === 'boomb10ghost' ? <B10GhostStudy width={width} /> : only.startsWith('boomb10') ? <B10LiveStudy width={width} only={only} /> : null}
      {only === 'boomzoom' ? (
        <Pics w={Math.min(width - 24, 760)} per={1} level="full" items={[...handItems(RIG_B04, 'side', 160), ...handItems(RIG_B04, 'front', 170)]} />
      ) : null}
      {only === 'boom' || only === 'boomhands' || only === 'boomwhole' ? (
        <View>
          <Caption title="THE APPROVED MIC HAND BESIDE THE BOOM HANDS FROM THE FRONT (FrontBoom5)" note="Each row: an approved hand round a handle, palm side (as /michand or /michandtop draws it), then the boom operator's hand from the front drawn by the same call and painter, turned on the page so the handle's line lies along the pole and the forearm comes up from below with a straight wrist (the operator's left hand the mirror image). The right hand is the owner's named picture (B03 · the shared omni); the left takes the approved palm-side picture whose forearm angle this rig's left forearm needs. Same pt/mm (about 3 pt/mm), then at the lesson's size." />
          <Pics w={w2} per={2} level="full" items={approvedBeside(Math.round(w2 / 3), 'ab')} />
          <Pics w={90} per={4} level="lite" items={approvedBeside(900, 'al')} />
        </View>
      ) : null}
      {only === 'boom' || only === 'boomhands' ? (
        <View>
          <Caption title="THE HANDS ON THE POLE, CLOSE (about 2 pt/mm)" note="Side, from above and from the front: the fingers over one side of the pole, the thumb round the other, their ends meeting; the pole through the fist." />
          <Pics w={w2} per={2} level="full" items={[...handItems(RIG_B04, 'side', 200), ...handItems(RIG_B04, 'front', 220), ...handItems(RIG_B04, 'top', 200)]} />
        </View>
      ) : null}
    </View>
  );
}

export function FrontStudy({ width, only }: { width: number; only: string }) {
  if (only.startsWith('boom')) return <BoomStudy width={width} only={only} />;
  const lesson = 64; // ≈ 0.1 pt/mm: a standing person about 190 pt tall, as the body-worn layout shows them
  const big = Math.min(Math.floor((width - 50) / 3), 300);
  if (only === 'frontzoom') {
    // (dev) single pictures at the page's full width, for checking forms one by one
    const W = Math.min(width - 24, 780);
    const z = (key: string, pose: PlayerPose, id: CastId, cu: number, cv: number, mm: number, jacket = false): PicItem => ({ key, cu, cv, mmW: mm, mmH: mm * 0.8, label: key, node: <PersonFrontV2 pose={pose} who={CAST[id]} opts={{ lip: lipOf(pose), jacket }} /> });
    return (
      <View>
        <Pics w={W} per={1} level="full" items={[z('hand · Ruth left', FRONT_STANDING, 'ruth', 212, 780, 220), z('hand · Kofi right', FRONT_STANDING, 'kofi', -212, 780, 220), z('seated · Mei', FRONT_SEATED, 'mei', 0, FRONT_SEATED.kneeR.v - 60, 520), z('jacket · Kofi', FRONT_STANDING, 'kofi', 0, 120, 420, true)]} />
      </View>
    );
  }
  if (only === 'frontclose' || only === 'fronthands') {
    const head = (id: CastId, jacket = false): PicItem => ({ key: `hd${id}${jacket}`, cu: 0, cv: -40, mmW: 260, mmH: 300, label: CAST[id].name, node: <PersonFrontV2 pose={FRONT_STANDING} who={CAST[id]} opts={{ lip: LIP, jacket }} /> });
    const hand = (id: CastId, side: 'R' | 'L'): PicItem => ({ key: `h${id}${side}`, cu: side === 'R' ? -212 : 212, cv: 790, mmW: 160, mmH: 240, label: `${CAST[id].name} · ${side === 'R' ? 'right' : 'left'} hand`, node: <PersonFrontV2 pose={FRONT_STANDING} who={CAST[id]} opts={{ lip: LIP }} /> });
    const lap = (id: CastId, side: 'R' | 'L', jacket = false): PicItem => ({ key: `s${id}${side}${jacket}`, cu: side === 'R' ? -150 : 150, cv: FRONT_SEATED.kneeR.v - 40, mmW: 260, mmH: 300, label: `${CAST[id].name} · seated, ${side === 'R' ? 'right' : 'left'} hand`, node: <PersonFrontV2 pose={FRONT_SEATED} who={CAST[id]} opts={{ lip: lipOf(FRONT_SEATED), jacket }} /> });
    const torso = (id: CastId, jacket: boolean): PicItem => ({ key: `t${id}${jacket}`, cu: 0, cv: 300, mmW: 560, mmH: 640, label: `${CAST[id].name}${jacket ? ' · jacket' : ''}`, node: <PersonFrontV2 pose={FRONT_STANDING} who={CAST[id]} opts={{ lip: LIP, jacket }} /> });
    return (
      <View>
        {only === 'frontclose' ? (
          <View>
            <Caption title="FRONT — HEADS, CLOSE (full detail)" note="Each person's head and neck from the front, about 1.2 pt/mm." />
            <Pics w={big} level="full" items={IDS.map((id) => head(id))} />
            <Caption title="FRONT — SHOULDERS, CHEST, JACKET" />
            <Pics w={big} level="full" items={[torso('drummer', false), torso('ruth', false), torso('kofi', true), torso('mei', true), torso('ana', true), torso('kofi', false)]} />
          </View>
        ) : null}
        <Caption title="FRONT — THE HANDS AT REST, CLOSE" note="Standing: the hand hanging at the side, its thumb's side toward the viewer. Seated: the hand on the knee." />
        <Pics w={big} level="full" items={[hand('ana', 'R'), hand('kofi', 'R'), hand('ruth', 'L'), hand('mei', 'L'), hand('drummer', 'R'), hand('kofi', 'L')]} />
        <Pics w={big} level="full" items={[lap('kofi', 'R'), lap('mei', 'L'), lap('ruth', 'R', true)]} />
      </View>
    );
  }
  const part = (k: string) => only === 'front' || only === k;
  return (
    <View>
      {part('frontstand') ? (
        <View>
          <Caption title="THE CAST FROM THE FRONT — ENLARGED (full detail)" note="Standing, the hands at rest. Old figure first. About 0.45 pt/mm (three times the lesson's size)." />
          <Row pose={FRONT_STANDING} jacket={false} w={big} level="full" per={3} />
          <Caption title="IN THE JACKET — STANDING" note="Each person in their own jacket tone; the drummer has none." />
          <Row pose={FRONT_STANDING} jacket w={big} level="full" old={false} per={3} />
        </View>
      ) : null}
      {part('frontseat') ? (
        <View>
          <Caption title="SEATED" note="On a chair (not drawn), seen from a standing person's eye: the thighs foreshortened, the hands on the thighs behind the knees." />
          <Row pose={FRONT_SEATED} jacket={false} w={big} level="full" per={3} />
          <Caption title="SEATED, IN THE JACKET" />
          <Row pose={FRONT_SEATED} jacket w={big} level="full" old={false} per={3} />
        </View>
      ) : null}
      {part('frontlesson') ? (
        <View>
          <Caption title="AT THE LESSON'S SIZE (lite, about 0.1 pt/mm)" note="The size the body-worn layout (B11) draws a standing person on a 390 pt phone." />
          <Row pose={FRONT_STANDING} jacket={false} w={lesson} level="lite" />
          <Row pose={FRONT_STANDING} jacket w={lesson} level="lite" old={false} />
          <Row pose={FRONT_SEATED} jacket={false} w={lesson} level="lite" />
          <Row pose={FRONT_SEATED} jacket w={lesson} level="lite" old={false} />
        </View>
      ) : null}
    </View>
  );
}
