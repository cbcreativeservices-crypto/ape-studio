/**
 * DEV STUDY — THE HELD ARM IN ITS LESSONS (figure V2, wave 3 step B round 2,
 * 2026-11-24): B10 sideline interviews, B03 field reporters, B09 commentators
 * converted whole. Each setup with a hand-held mic at its suggested start, the
 * lesson's own scene (`v2` switch only), old beside new: at about the
 * lesson's phone size, enlarged about 3×, and the joins closer (hand, wrist,
 * cuff). Dev page: `#labpreview/FigureStudy/heldlessons` (`-b10`, `-b3`,
 * `-b9` for one lesson).
 */
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Canvas, Group, Rect, Skia } from '@shopify/react-native-skia';
import { FigureScale } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { aimVec } from '../screens/lab/miking/engine/geometry/vec';
import { heldFist } from '../screens/lab/miking/engine/geometry/arm';
import type { DocumentedZone, VariantId, Vec3, ViewBox } from '../screens/lab/miking/engine/model/types';
import { MicAt } from '../screens/lab/miking/lessons/shared/field/FieldStage';
import { HeldArmArt } from '../screens/lab/miking/lessons/shared/broadcast/SportSpeechArt';
import { HeldFront, HeldStatic, heldMicAt, type HeldConfig, type HeldHolder } from '../screens/lab/miking/lessons/shared/figureV2/heldLive';
import { B10Scene, B10_BOOM_RIGS, B10_OPERATOR_WHO } from '../screens/lab/miking/lessons/b10Sideline/scene';
import { BoomOperatorV2 } from '../screens/lab/miking/lessons/shared/figureV2/BoomV2';
import { StandingV2 as GuestV2 } from '../screens/lab/miking/lessons/shared/broadcast/heldPeopleV2';
import { GUEST as B10_GUEST_T } from '../screens/lab/miking/lessons/b10Sideline/geometry';
import { B10_ZONES } from '../screens/lab/miking/lessons/b10Sideline/model';
import { B10_VIEWS, GRIP as B10_GRIP } from '../screens/lab/miking/lessons/b10Sideline/geometry';
import { B10_HELD, GUEST_HOLDER as B10_GUEST, REP_HOLDER as B10_REP, flagDrawLen } from '../screens/lab/miking/lessons/b10Sideline/held';
import { B03Scene } from '../screens/lab/miking/lessons/b03FieldReporter/scene';
import { B03_ZONES } from '../screens/lab/miking/lessons/b03FieldReporter/model';
import { B03_VIEWS, GUEST as B03_GUEST_T, REPORTER as B03_REP_T, SHOULDER_REP as B03_SHOULDER } from '../screens/lab/miking/lessons/b03FieldReporter/geometry';
import { B03_HELD, REACH, REP_HOLDER as B03_REP } from '../screens/lab/miking/lessons/b03FieldReporter/held';
import { B09Scene } from '../screens/lab/miking/lessons/b09Commentators/scene';
import { B09_ZONES } from '../screens/lab/miking/lessons/b09Commentators/model';
import { B09_VIEWS } from '../screens/lab/miking/lessons/b09Commentators/geometry';
import { B09_HELD, CALLER_HOLDER } from '../screens/lab/miking/lessons/b09Commentators/held';
import { StandingV2, heldConfig, standingHolder } from '../screens/lab/miking/lessons/shared/broadcast/heldPeopleV2';
import { castFor } from '../screens/lab/miking/lessons/shared/figureV2/cast';

const STAGE = '#14171d';
const INK = '#d7dbe3';
const DIM = '#9aa3b2';

type View2 = 'side' | 'top';
type HeldMic = { zone: string; holder: HeldHolder; typeId: string; art: 'flagHandheld' | 'lipRibbon'; r: number; len: number; drawLen?: number };
type Setup = { focus?: Record<View2, { u: number; v: number }>; id: string; title: string; variant: VariantId; scene: (view: View2, v2: boolean) => ReactNode; zones: readonly DocumentedZone[]; cfg: HeldConfig; mics: HeldMic[]; box: Record<View2, ViewBox> };

const FLAG = { typeId: 'bcFlagOmni', art: 'flagHandheld' as const, r: 25, len: 162 };
const OMNI = { typeId: 'repOmni', art: 'flagHandheld' as const, r: 24, len: 230 };
const CARD = { typeId: 'bcFlagCard', art: 'flagHandheld' as const, r: 25, len: 162 };
const LIPR = { typeId: 'bcLipRibbon', art: 'lipRibbon' as const, r: 20, len: 220 };

const SETUPS: Record<string, Setup[]> = {
  b10: [
    { id: 'b10s', title: 'B10 · SIDELINE — the reporter holds the flag handheld at the guest’s mouth', variant: 'sideline', scene: (view, v2) => <B10Scene view={view} variant="sideline" v2={v2} />, zones: B10_ZONES, cfg: B10_HELD, mics: [{ zone: 'b10.hand', holder: B10_REP, ...FLAG, drawLen: flagDrawLen('bcFlagOmni') }], box: B10_VIEWS.sideline },
    {
      id: 'b10t',
      title: 'B10 · TWO HANDHELDS — the guest holds their own, the reporter theirs',
      variant: 'twoMics',
      scene: (view, v2) => <B10Scene view={view} variant="twoMics" v2={v2} />,
      zones: B10_ZONES,
      cfg: B10_HELD,
      mics: [
        { zone: 'b10.hand', holder: B10_GUEST, ...FLAG, drawLen: flagDrawLen('bcFlagOmni') },
        { zone: 'b10.reporter', holder: B10_REP, ...FLAG, drawLen: flagDrawLen('bcFlagOmni') },
      ],
      box: B10_VIEWS.twoMics,
    },
    { id: 'b10p', title: 'B10 · POST-EVENT — the boom operator (Ruth) beside the mark, nobody holds a handheld', variant: 'postEvent', scene: (view, v2) => <B10Scene view={view} variant="postEvent" v2={v2} />, zones: B10_ZONES, cfg: B10_HELD, mics: [], box: B10_VIEWS.postEvent, focus: { side: { u: B10_GRIP.x + 120, v: B10_GRIP.y + 200 }, top: { u: B10_GRIP.x + 150, v: B10_GRIP.z + 150 } } },
    { id: 'b10n', title: 'B10 · SIDELINE, no handheld shown — both people with their own arms', variant: 'sideline', scene: (view, v2) => <B10Scene view={view} variant="sideline" v2={v2} />, zones: B10_ZONES, cfg: B10_HELD, mics: [], box: B10_VIEWS.sideline },
  ],
  b3: [
    { id: 'b3s', title: 'B03 · ON THE STREET — the shared omni at chest height between them', variant: 'street', scene: (view, v2) => <B03Scene view={view} variant="street" v2={v2} />, zones: B03_ZONES, cfg: B03_HELD, mics: [{ zone: 'b3.shared', holder: B03_REP, ...OMNI }], box: B03_VIEWS.street },
    { id: 'b3g', title: 'B03 · ON THE STREET — the omni moved to the guest’s mouth (as they stand: the elbow dropped)', variant: 'street', scene: (view, v2) => <B03Scene view={view} variant="street" v2={v2} />, zones: B03_ZONES, cfg: B03_HELD, mics: [{ zone: 'b3.handoffOmni', holder: B03_REP, ...OMNI }], box: B03_VIEWS.street },
    { id: 'b3d', title: 'B03 · ON THE STREET — the cardioid flag at the guest’s mouth (drawn longer at the tail)', variant: 'street', scene: (view, v2) => <B03Scene view={view} variant="street" v2={v2} />, zones: B03_ZONES, cfg: B03_HELD, mics: [{ zone: 'b3.handoffDir', holder: B03_REP, ...CARD, drawLen: flagDrawLen('bcFlagCard') }], box: B03_VIEWS.street },
    { id: 'b3o', title: 'B03 · TWO MICS — the reporter’s own cardioid flag at their mouth', variant: 'twoMics', scene: (view, v2) => <B03Scene view={view} variant="twoMics" v2={v2} />, zones: B03_ZONES, cfg: B03_HELD, mics: [{ zone: 'b3.repOwn', holder: B03_REP, ...CARD, drawLen: flagDrawLen('bcFlagCard') }], box: B03_VIEWS.twoMics },
  ],
  b9: [
    { id: 'b9o', title: 'B09 · OPEN POSITION — the commentator holds the lip ribbon to the mouth', variant: 'open', scene: (view, v2) => <B09Scene view={view} variant="open" v2={v2} />, zones: B09_ZONES, cfg: B09_HELD, mics: [{ zone: 'b9.lip', holder: CALLER_HOLDER, ...LIPR }], box: B09_VIEWS.open },
    { id: 'b9b', title: 'B09 · BOOTH — nobody holds a mic: both with their own arms', variant: 'booth', scene: (view, v2) => <B09Scene view={view} variant="booth" v2={v2} />, zones: B09_ZONES, cfg: B09_HELD, mics: [], box: B09_VIEWS.booth },
  ],
};

/* ── owner decision (a): B03 at the guest's mouth, the reporter as they stand or 14 cm nearer ── */
const STEP_IN = 140;
const B03_REP_IN_T = { ...B03_REP_T, lip: { ...B03_REP_T.lip, x: B03_REP_T.lip.x - STEP_IN } };
const B03_SHOULDER_IN = { ...B03_SHOULDER, x: B03_SHOULDER.x - STEP_IN };
const B03_REP_IN = standingHolder('b3.reporter.in', B03_REP_IN_T, B03_SHOULDER_IN, 'talker.reporter', { drop: REACH });
const B03_IN_HELD = heldConfig([B03_REP_IN], { artOf: () => 'flagHandheld' });
function DecisionA({ view, stepIn }: { view: View2; stepIn: boolean }) {
  const z = B03_ZONES.find((q) => q.id === 'b3.handoffOmni')!.start;
  const aim = aimVec(z.az, z.el);
  const holder = stepIn ? B03_REP_IN : B03_REP;
  const cfg = stepIn ? B03_IN_HELD : B03_HELD;
  return (
    <HeldStatic cfg={cfg} mics={[heldMicAt('a', z.p, aim, OMNI.len, OMNI.r, holder.shoulder, cfg, 'repOmni')]}>
      <StandingV2 view={view} t={B03_GUEST_T} who={castFor('talker.guest')} />
      <StandingV2 view={view} t={stepIn ? B03_REP_IN_T : B03_REP_T} who={castFor('talker.reporter')} holder={holder} />
      <MicAt view={view} p={z.p} aim={aim} art="flagHandheld" r={OMNI.r} len={OMNI.len} />
      <HeldFront view={view} />
    </HeldStatic>
  );
}

type At = { front: Vec3; aim: Vec3; m: HeldMic };
const atOf = (s: Setup): At[] =>
  s.mics.map((m) => {
    const z = s.zones.find((q) => q.id === m.zone)!.start;
    return { front: z.p, aim: aimVec(z.az, z.el), m };
  });

function Drawn({ s, view, v2 }: { s: Setup; view: View2; v2: boolean }) {
  const at = atOf(s);
  const mics = at.map((a) => <MicAt key={a.m.zone} view={view} p={a.front} aim={a.aim} art={a.m.art} r={a.m.r} len={v2 ? (a.m.drawLen ?? a.m.len) : a.m.len} />);
  if (!v2)
    return (
      <Group>
        {s.scene(view, false)}
        {mics}
        {at.map((a) => (
          <HeldArmArt key={`arm${a.m.zone}`} view={view} shoulder={a.m.holder.shoulder} p={a.front} aim={a.aim} len={a.m.len} />
        ))}
      </Group>
    );
  const held = at.map((a, i) => heldMicAt(`m${i}`, a.front, a.aim, a.m.len, a.m.r, a.m.holder.shoulder, s.cfg, a.m.typeId));
  return (
    <HeldStatic cfg={s.cfg} mics={held}>
      {s.scene(view, true)}
      {mics}
      <HeldFront view={view} />
    </HeldStatic>
  );
}

type Pic = { key: string; title: string; draw: ReactNode; cu: number; cv: number; mmW: number; mmH: number };
function Grid({ pics, w, cols, gap = 8 }: { pics: Pic[]; w: number; cols: number; gap?: number }) {
  const h = Math.max(...pics.map((q) => (q.mmH * w) / q.mmW));
  const rows = Math.ceil(pics.length / cols);
  const lab = 14;
  const W = cols * w + (cols - 1) * gap;
  const H = rows * (h + lab) + (rows - 1) * gap;
  return (
    <View>
      <Canvas style={{ width: W, height: H }}>
        {pics.map((q, i) => {
          const s = w / q.mmW;
          const x0 = (i % cols) * (w + gap);
          const y0 = Math.floor(i / cols) * (h + lab + gap);
          return (
            <Group key={q.key} clip={Skia.XYWHRect(x0, y0, w, h)}>
              <Rect x={x0} y={y0} width={w} height={h} color={STAGE} />
              <Group transform={[{ translateX: x0 + w / 2 - q.cu * s }, { translateY: y0 + h / 2 - q.cv * s }, { scale: s }]}>
                <FigureScale ptPerMm={s}>{q.draw}</FigureScale>
              </Group>
            </Group>
          );
        })}
      </Canvas>
      <View style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }} pointerEvents="none">
        {pics.map((q, i) => (
          <Text key={q.key} style={{ position: 'absolute', left: (i % cols) * (w + gap), top: Math.floor(i / cols) * (h + lab + gap) + h + 1, color: DIM, fontSize: 10, width: w }}>
            {q.title}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** Where the hand is (the first held mic's fist), else the box's middle. */
function focusOf(s: Setup, view: View2): { u: number; v: number } {
  if (s.focus) return s.focus[view];
  const a = atOf(s)[0];
  const uv = (p: Vec3) => ({ u: p.x, v: view === 'side' ? p.y : p.z });
  if (!a) {
    const b = s.box[view];
    return { u: (b.u0 + b.u1) / 2, v: (b.v0 + b.v1) / 2 };
  }
  const f = heldFist({ x: a.front.x - a.aim.x * a.m.len, y: a.front.y - a.aim.y * a.m.len, z: a.front.z - a.aim.z * a.m.len }, a.aim);
  const sh = uv(a.m.holder.shoulder);
  const fu = uv(f);
  return { u: (sh.u + fu.u) / 2, v: (sh.v + fu.v) / 2 };
}

/** One setup, ONE canvas (a browser allows only so many): old beside new at the lesson's size (its own scale,
 *  the picture wider than the lesson's frame), about 3x, then the joins closer (new only). */
function SetupGrid({ s, width }: { s: Setup; width: number }) {
  const col = Math.min(520, Math.floor((width - 32) / 2));
  const pics: Pic[] = [];
  for (const view of ['side', 'top'] as const) {
    const b = s.box[view];
    const W = b.u1 - b.u0;
    const lesson = Math.min(360, col) / W;
    const f = focusOf(s, view);
    for (const v2 of [false, true]) pics.push({ key: `${view}L${v2}`, title: `${v2 ? 'NEW' : 'OLD'} - ${view} - lesson size (${lesson.toFixed(2)} pt/mm)`, draw: <Drawn s={s} view={view} v2={v2} />, cu: (b.u0 + b.u1) / 2, cv: (b.v0 + b.v1) / 2, mmW: col / lesson, mmH: (col / lesson) * 0.8 });
    const W3 = Math.max(700, W / 3);
    for (const v2 of [false, true]) pics.push({ key: `${view}3${v2}`, title: `${v2 ? 'NEW' : 'OLD'} - ${view} - about 3x (${(col / W3).toFixed(2)} pt/mm)`, draw: <Drawn s={s} view={view} v2={v2} />, cu: f.u, cv: f.v, mmW: W3, mmH: W3 * 0.8 });
  }
  for (const view of ['side', 'top'] as const)
    atOf(s).forEach((a, i) => {
      const fl = heldFist({ x: a.front.x - a.aim.x * a.m.len, y: a.front.y - a.aim.y * a.m.len, z: a.front.z - a.aim.z * a.m.len }, a.aim);
      pics.push({ key: `${view}J${i}`, title: `NEW - ${view} - the joins (${a.m.holder.id})`, draw: <Drawn s={s} view={view} v2 />, cu: fl.x, cv: view === 'side' ? fl.y : fl.z, mmW: 240, mmH: 192 });
    });
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ color: INK, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>{s.title}</Text>
      <Grid w={col} cols={2} pics={pics} />
    </View>
  );
}

export function HeldLessonsStudy({ width, only }: { width: number; only: string }) {
  const which = only.split('-')[1];
  const ids = which ? [which] : Object.keys(SETUPS);
  return (
    <View>
      <Text style={{ color: INK, fontSize: 15, fontWeight: '700', marginBottom: 6 }}>THE HELD ARM IN ITS LESSONS (dev, step B round 2)</Text>
      <Text style={{ color: DIM, fontSize: 11, marginBottom: 10 }}>Each setup with a hand-held mic at its suggested start, the lesson’s own scene: old beside new at the lesson’s size and about 3×, then the joins. The mics, the capsules and every measured point are the lesson’s own.</Text>
      {!which || which === 'b10' ? (
        <View style={{ marginBottom: 18 }}>
          <Text style={{ color: INK, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>B10 FROM THE SIDE — the faint reporter over the guest: her face drawn (left) · her head with no face (right, the default)</Text>
          <Grid
            w={Math.min(520, Math.floor((width - 32) / 2))}
            cols={2}
            pics={[0.6, 0.25].flatMap((k) =>
              [false, true].map((plain) => {
                const s = SETUPS.b10[k === 0.6 ? 1 : 0];
                return { key: `${k}${plain}`, title: `${plain ? 'no face' : 'face drawn'} - ${s.variant} - ${k === 0.6 ? 'about 3x' : 'closer'}`, draw: <HeldStatic cfg={s.cfg} mics={atOf(s).map((a, i) => heldMicAt(`m${i}`, a.front, a.aim, a.m.len, a.m.r, a.m.holder.shoulder, s.cfg, a.m.typeId))}><B10Scene view="side" variant={s.variant} plainFaint={plain} />{atOf(s).map((a) => <MicAt key={a.m.zone} view="side" p={a.front} aim={a.aim} art={a.m.art} r={a.m.r} len={a.m.drawLen ?? a.m.len} />)}<HeldFront view="side" /></HeldStatic>, cu: -40, cv: k === 0.6 ? 150 : -40, mmW: k === 0.6 ? 900 : 420, mmH: k === 0.6 ? 720 : 336 };
              }),
            )}
          />
        </View>
      ) : null}
      {!which || which === 'b10' || which === 'b10p' ? (
        <View style={{ marginBottom: 18 }}>
          <Text style={{ color: INK, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>B10 POST-EVENT — the boom hold: old (left: the stub bending down through the head) · overhead (right: under the pole, both hands up, the default)</Text>
          <Grid
            w={Math.min(520, Math.floor((width - 32) / 2))}
            cols={2}
            pics={(['side', 'top'] as const).flatMap((view) =>
              (['old', 'overhead'] as const).map((k) => ({
                key: `${view}${k}`,
                title: `${k} - ${view}`,
                draw: (
                  <Group>
                    <GuestV2 view={view} t={B10_GUEST_T} who={castFor('talker.guest')} />
                    <BoomOperatorV2 view={view} rig={B10_BOOM_RIGS[k]} who={B10_OPERATOR_WHO} />
                    <MicAt view={view} p={{ x: 636.4, y: -636.4, z: 0 }} aim={{ x: -Math.SQRT1_2, y: Math.SQRT1_2, z: 0 }} art="shotgun" r={10} len={50} />
                  </Group>
                ),
                cu: view === 'side' ? 750 : 750,
                cv: view === 'side' ? -200 : 650,
                mmW: 1500,
                mmH: 1200,
              })),
            )}
          />
        </View>
      ) : null}
      {!which || which === 'b3' ? (
        <View style={{ marginBottom: 18 }}>
          <Text style={{ color: INK, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>OWNER DECISION (a) — B03, the omni at the guest’s mouth: as they stand (the default, the elbow dropped) · 14 cm nearer</Text>
          <Grid w={Math.min(520, Math.floor((width - 32) / 2))} cols={2} pics={(['side', 'top'] as const).flatMap((view) => [false, true].map((stepIn) => ({ key: `${view}${stepIn}`, title: `${stepIn ? '14 cm nearer' : 'as they stand'} - ${view}`, draw: <DecisionA view={view} stepIn={stepIn} />, cu: 380, cv: view === 'side' ? 250 : 0, mmW: 1500, mmH: 1200 })))} />
        </View>
      ) : null}
      {(SETUPS[which] ? ids : Object.keys(SETUPS)).flatMap((id) =>
        (SETUPS[id] ?? []).filter((s) => !which || SETUPS[which] || s.id === which).map((s) => (
          <SetupGrid key={s.id} s={s} width={width} />
        )),
      )}
    </View>
  );
}
