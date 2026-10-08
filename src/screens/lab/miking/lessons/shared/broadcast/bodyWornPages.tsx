/**
 * THE BODY-WORN STEPS (Lab 7 group 2; LessonArt.pages tools) — used by B05
 * and B02, and by any later lesson with a body mic. Each is a rack step for
 * MEET IT's second half (broadcastPages.makeBroadcastSound's `useTools`):
 *
 *   useBodyTurnStep  CHEST OR HEAD (key 'turn'): TURN (yaw) and LOOK (pitch)
 *                    the wearer's head. A mic on the chest — or fixed on a
 *                    desk or a boom — stays put; a headset turns WITH the
 *                    head. Each mic's distance, angle off the mouth's axis
 *                    and level change are read from the drawing
 *                    (bodyWorn.bodyMicReadout; inverse square).
 *   useCableStep     THE LOOPS (key 'cable'): the wearer stands, sits, turns
 *                    or gestures; with no loop, the broadcast loop, or both
 *                    loops — where the tug ends up (bodyWorn.cablePull; a
 *                    simplified picture, the moves drawing defaults).
 *   useBreathStep    OUT OF THE BREATH (key 'breath'): slide a headset's
 *                    capsule from beside the corner of the mouth toward the
 *                    front of the lips; inside the plosive jet it hears the
 *                    puffs (bodyWorn.inBreathJet; an illustrative cone).
 * FULLY SILENT; nothing loops (D8); every state reachable by a control.
 */
import { useState, type ReactNode } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { MicArtId, ViewBox, Vec3 } from '../../../engine/model/types.ts';
import type { MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point } from '../../../engine/kit';
import { Aim, Dim, FieldStage, MicAt, Ray, uvOf, type FieldInset } from '../field/FieldStage';
import { TURN_LIMITS, TURN_PIVOT, turnHead } from './talkerPose.ts';
import { TurnedHeadSide, TurnedHeadTop } from './BroadcastArt';
import { BeltPack, BreathJet, FabricOver, HeadsetFrame, LavCable, LavClip } from './BodyWornArt';
import { BREATH_JET, LOOPS, MOVES, MOVE_IDS, cablePull, bodyMicReadout, fromCorner, inBreathJet, packAt, turnImbalanceDb, withHead, type BodyMount, type MoveId } from './bodyWorn.ts';

const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const sub = (a: Vec3, b: Vec3): Vec3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return v3(a.x / l, a.y / l, a.z / l);
};
const cm = (mm: number) => `${Math.round(mm / 10)} cm`;
const deg5 = (d: number) => `${Math.round(d / 5) * 5}°`;
const LIP = v3(0, 0, 0);
const dbWords = (db: number) => (Math.abs(db) < 0.5 ? 'about the same' : `about ${Math.abs(db).toFixed(0)} dB ${db > 0 ? 'lower' : 'higher'}`);
const dbCell = (db: number) => (Math.abs(db) < 0.5 ? '0 dB' : `${db > 0 ? '−' : '+'}${Math.abs(db).toFixed(0)} dB`);

/* ── CHEST OR HEAD ── */

/** A mic the step draws: where its front is (frame V, facing ahead), what
 *  it moves with, how it is drawn, and its aim (default at the lips). */
export type WornMic = { id: string; label: string; short: string; p: Vec3; rides: 'chest' | 'head' | 'fixed'; art: MicArtId; r: number; len: number; aim?: Vec3; headset?: boolean };

export type BodyTurnSpec = {
  mics: readonly WornMic[];
  /** The scene from above and from the side, the wearer drawn WITHOUT a
   *  head (the step draws it turned). */
  top: (px: number) => ReactNode;
  side: (px: number) => ReactNode;
  boxTop: ViewBox;
  boxSide: ViewBox;
  pitch: boolean;
  /** Where TURN starts and its preset words (a partner on the right…). */
  words: { looking: string; prompt: string; done: string; subject: string; right?: string; left?: string };
};

export function useBodyTurnStep(spec: BodyTurnSpec): MikingStep {
  const [yaw, setYaw] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [micId, setMicId] = useState(spec.mics[0].id);
  const [seen, setSeen] = useState({ left: false, right: false, down: false });
  const m = spec.mics.find((q) => q.id === micId) ?? spec.mics[0];
  const t = turnHead(yaw, pitch);
  const read = (q: WornMic) => bodyMicReadout(q.p, q.rides === 'head' ? 'head' : 'chest', yaw, pitch);
  const r = read(m);
  const aimOf = (q: WornMic): Vec3 => {
    const a = q.aim ?? unit(sub(LIP, q.p));
    if (q.rides !== 'head') return a;
    return unit(sub(withHead(v3(q.p.x + a.x * 50, q.p.y + a.y * 50, q.p.z + a.z * 50), yaw, pitch), withHead(q.p, yaw, pitch)));
  };
  const axisEnd = v3(t.mouth.x + t.dir.x * 560, t.mouth.y + t.dir.y * 560, t.mouth.z + t.dir.z * 560);
  const side = yaw > 2 ? spec.words.right ?? 'to their right' : yaw < -2 ? spec.words.left ?? 'to their left' : 'straight ahead';
  const look = pitch < -2 ? `looking down ${Math.abs(pitch)} degrees` : pitch > 2 ? `looking up ${pitch} degrees` : 'level';
  const a11y = `From above, ${spec.words.subject}: the head turned ${Math.abs(Math.round(yaw))} degrees ${side}, ${look}. ${spec.mics.map((q) => { const k = read(q); return `${q.label}: ${cm(k.d)} from the lips, ${deg5(k.offAxis)} off the mouth’s axis`; }).join('. ')}.`;
  const span = TURN_LIMITS.pitch.max - TURN_LIMITS.pitch.min;
  const yawOf = (v: number) => Math.round((v * 120 - 60) / 5) * 5;
  const pitchOf = (v: number) => Math.round((TURN_LIMITS.pitch.min + v * span) / 5) * 5;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'turn',
      label: 'TURN',
      value: (yaw + 60) / 120,
      onChange: (v) => {
        const y = yawOf(v);
        setYaw(y);
        if (y <= -30) setSeen((s) => (s.left ? s : { ...s, left: true }));
        if (y >= 30) setSeen((s) => (s.right ? s : { ...s, right: true }));
      },
      format: (v) => {
        const y = yawOf(v);
        return y === 0 ? 'facing ahead' : `${Math.abs(y)}° ${y > 0 ? spec.words.right ?? 'to the wearer’s right' : spec.words.left ?? 'to the wearer’s left'}`;
      },
      formatShort: (v) => `${yawOf(v)}°`,
      home: 0.5,
    },
    ...(spec.pitch
      ? [
          {
            kind: 'fader' as const,
            id: 'look',
            label: 'LOOK',
            value: (pitch - TURN_LIMITS.pitch.min) / span,
            onChange: (v: number) => {
              const p = pitchOf(v);
              setPitch(p);
              if (p <= -15) setSeen((s) => (s.down ? s : { ...s, down: true }));
            },
            format: (v: number) => {
              const p = pitchOf(v);
              return p === 0 ? 'head level' : p < 0 ? `${-p}° down (reading)` : `${p}° up`;
            },
            formatShort: (v: number) => `${pitchOf(v)}°`,
            home: -TURN_LIMITS.pitch.min / span,
          },
        ]
      : []),
    {
      kind: 'options',
      id: 'mic',
      label: 'MIC',
      valueLabel: m.short,
      selectedId: micId,
      onSelect: setMicId,
      sticky: true,
      options: spec.mics.map((q) => ({ id: q.id, label: q.label, blurb: q.rides === 'head' ? 'Worn on the head: it turns with it.' : q.rides === 'chest' ? 'Worn on the chest: it stays where it is clipped.' : 'Fixed in place: the mouth moves, the mic does not.' })),
    },
  ];
  const bezel: BezelItem[] = [
    { k: 'TURN', v: `${yaw}°`, flex: 0.7 },
    ...(spec.pitch ? [{ k: 'LOOK', v: `${pitch}°`, flex: 0.7 }] : []),
    { k: 'TO LIPS', v: cm(r.d), flex: 0.9 },
    { k: 'OFF AXIS', v: deg5(r.offAxis), tint: r.offAxis > 100 ? '#ff6b5e' : undefined, flex: 0.9 },
    { k: 'LEVEL', v: dbCell(r.distDb), flex: 0.9 },
  ];
  // The head (and anything worn on it) turned about the head's centre.
  const turnTop = [{ translateX: TURN_PIVOT.x }, { translateY: TURN_PIVOT.z }, { rotate: (yaw * Math.PI) / 180 }, { translateX: -TURN_PIVOT.x }, { translateY: -TURN_PIVOT.z }];
  const turnSide = [{ translateX: TURN_PIVOT.x }, { translateY: TURN_PIVOT.y }, { rotate: (-pitch * Math.PI) / 180 }, { translateX: -TURN_PIVOT.x }, { translateY: -TURN_PIVOT.y }];
  const mics = (view: 'top' | 'side') =>
    spec.mics.map((q) => {
      const at = q.rides === 'head' ? withHead(q.p, yaw, pitch) : q.p;
      return <MicAt key={q.id} view={view} p={at} aim={aimOf(q)} art={q.art} r={q.r} len={q.len} />;
    });
  const headset = (view: 'top' | 'side') => {
    const hs = spec.mics.find((q) => q.headset);
    return hs ? (
      <Group transform={view === 'top' ? turnTop : turnSide}>
        <HeadsetFrame view={view} capsule={hs.p} />
      </Group>
    ) : null;
  };
  const inset: FieldInset | null = spec.pitch
    ? {
        view: 'side',
        box: spec.boxSide,
        at: { x: 0.6, y: 0.02, w: 0.39, h: 0.46 },
        title: 'SIDE',
        draw: (px) => (
          <>
            {spec.side(px)}
            <TurnedHeadSide pitchDeg={pitch} />
            {headset('side')}
            <Ray a={uvOf('side', t.mouth)} b={uvOf('side', axisEnd)} px={px} color="#e8eaee" width={2} />
            {mics('side')}
          </>
        ),
        labels: [{ id: 'side', text: 'SIDE', u: spec.boxSide.u0 + (spec.boxSide.u1 - spec.boxSide.u0) * 0.08, v: spec.boxSide.v0 + (spec.boxSide.v1 - spec.boxSide.v0) * 0.1, align: 'left', tone: 'muted' }],
      }
    : null;
  const mAt = m.rides === 'head' ? withHead(m.p, yaw, pitch) : m.p;
  const imb = turnImbalanceDb(m.p, m.rides === 'head' ? 'head' : 'chest');
  return {
    key: 'turn',
    title: 'Chest or head',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <FieldStage
          w={w}
          h={h}
          view="top"
          box={spec.boxTop}
          a11y={a11y}
          inset={inset}
          labels={[
            { id: 'axis', text: 'THE MOUTH’S AXIS', short: 'AXIS', u: axisEnd.x, v: axisEnd.z + (t.dir.z >= 0 ? 110 : -130), align: 'right', tone: 'muted' },
            { id: 'sel', text: m.short, u: mAt.x + 70, v: mAt.z + (mAt.z >= 0 ? 150 : -150), align: 'left', tone: 'amber', at: { u: mAt.x, v: mAt.z } },
          ]}
        >
          {(px) => (
            <>
              {spec.top(px)}
              <TurnedHeadTop yawDeg={yaw} />
              {headset('top')}
              <Ray a={uvOf('top', t.mouth)} b={uvOf('top', axisEnd)} px={px} color="#e8eaee" width={2.2} />
              {mics('top')}
              <Dim a={uvOf('top', t.mouth)} b={uvOf('top', mAt)} px={px} />
            </>
          )}
        </FieldStage>
      ),
      badge: 'From above, the side in the corner · calculated from the drawing · the head turns about its centre (a simplified picture) · silent',
      bezel,
      params,
      initialParam: 'turn',
    },
    well: (
      <>
        <Landing looking={spec.words.looking} prompt={spec.words.prompt} />
        <Card>
          {spec.mics.map((q) => {
            const k = read(q);
            const how = q.rides === 'head' ? ' — it turned with the head' : q.rides === 'chest' ? ' — on the chest, it stayed put' : ' — fixed, it stayed put';
            return (
              <Point key={q.id} title={q.label.toUpperCase()}>
                {`${cm(k.d)} from the lips (${cm(k.d0)} facing ahead), ${deg5(k.offAxis)} off the mouth’s axis${how}: the voice ${dbWords(k.distDb)} by distance alone.`}
              </Point>
            );
          })}
          <Point title="ONE WAY AND THE OTHER">{`${m.label}: turning 45° to one side or the other changes its level by ${imb < 0.5 ? 'about the same amount both ways' : `about ${imb.toFixed(0)} dB more one way than the other`} — ${imb < 0.5 ? 'on the middle line, a turn either way reads alike.' : 'off the middle, the two directions sound different.'}`}</Point>
        </Card>
        {seen.left && seen.right && (!spec.pitch || seen.down) ? <Note tone="ok">{spec.words.done}</Note> : null}
        <Body>The voice’s highest frequencies go out ahead of the mouth: a mic well off the mouth’s axis hears a duller voice, and a chest mic is always below it. The angles and distances are calculated from the drawing; the level is by distance alone — a simplified picture.</Body>
      </>
    ),
  };
}

/* ── THE LOOPS ── */

export type CableSpec = {
  mount: BodyMount;
  standing: boolean;
  /** The wearer from the side, close on the chest (the scene's figure). */
  side: (px: number) => ReactNode;
  box: ViewBox;
  words: { subject: string; done: string };
};
type LoopsId = 'none' | 'broadcast' | 'both';
const LOOP_OPTS: readonly { id: LoopsId; label: string; blurb: string }[] = [
  { id: 'none', label: 'No loops', blurb: 'The cable runs straight from the capsule to the pack.' },
  { id: 'broadcast', label: 'A broadcast loop', blurb: 'A small loop of spare cable just under the clip.' },
  { id: 'both', label: 'Both loops', blurb: 'The broadcast loop, and a second loop lower down, taped to the shirt.' },
];

export function useCableStep(spec: CableSpec): MikingStep {
  const [move, setMove] = useState<MoveId>('sit');
  const [loopsId, setLoopsId] = useState<LoopsId>('none');
  const [tried, setTried] = useState<ReadonlySet<string>>(() => new Set());
  const loops = { broadcast: loopsId !== 'none', secondary: loopsId === 'both' };
  const mv = MOVES[move];
  const pull = cablePull(mv.mm, loops);
  const note = (mId: MoveId, l: LoopsId) => setTried((s) => (s.has(`${mId}:${l}`) ? s : new Set([...s, `${mId}:${l}`])));
  const capsule = spec.mount.at;
  const tail = v3(capsule.x - 1, capsule.y + 12, capsule.z);
  const pack = packAt(spec.standing);
  const showBroadcast = loops.broadcast && !(!loops.secondary && mv.mm >= LOOPS.broadcast.mm);
  const showSecondary = loops.secondary && mv.mm < LOOPS.secondary.mm;
  const a11y = `The ${spec.words.subject} from the side, close on the chest: a lavalier clipped ${spec.mount.label.toLowerCase()}, its cable down the shirt to a bodypack on the belt. The wearer is ${mv.words}; ${LOOP_OPTS.find((o) => o.id === loopsId)!.label.toLowerCase()}. ${pull.atCapsule > 0 ? `The pull reaches the capsule: about ${pull.atCapsule} millimetres of tug.` : 'No pull reaches the capsule.'}`;
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'move',
      label: 'MOVE',
      valueLabel: mv.label.slice(0, 10),
      selectedId: move,
      onSelect: (id) => {
        setMove(id as MoveId);
        note(id as MoveId, loopsId);
      },
      sticky: true,
      options: MOVE_IDS.map((id) => ({ id, label: MOVES[id].label, blurb: `The wearer is ${MOVES[id].words}.` })),
    },
    {
      kind: 'options',
      id: 'loops',
      label: 'LOOPS',
      valueLabel: loopsId === 'none' ? 'NONE' : loopsId === 'broadcast' ? 'AT CLIP' : 'BOTH',
      selectedId: loopsId,
      onSelect: (id) => {
        setLoopsId(id as LoopsId);
        note(move, id as LoopsId);
      },
      sticky: true,
      options: LOOP_OPTS.map((o) => ({ id: o.id, label: o.label, blurb: o.blurb })),
    },
  ];
  const bezel: BezelItem[] = [
    { k: 'MOVE', v: mv.label, flex: 1.1 },
    { k: 'PATH LONGER', v: mv.mm ? `${mv.mm} mm` : '—', flex: 1 },
    { k: 'AT THE CAPSULE', v: pull.atCapsule > 0 ? `${pull.atCapsule} mm TUG` : 'NONE', tint: pull.atCapsule > 0 ? '#ff6b5e' : '#5bff85', flex: 1.3 },
  ];
  const done = tried.has('gesture:both') && [...tried].some((k) => k.endsWith(':none') && !k.startsWith('stand'));
  return {
    key: 'cable',
    title: 'The loops',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <FieldStage
          w={w}
          h={h}
          view="side"
          box={spec.box}
          a11y={a11y}
          labels={[
            { id: 'cap', text: 'CAPSULE', u: capsule.x + 90, v: capsule.y - 70, align: 'left', tone: 'amber', at: { u: capsule.x, v: capsule.y } },
            { id: 'pack', text: 'BODYPACK', short: 'PACK', u: pack.x - 70, v: pack.y - 160, align: 'right', tone: 'muted', at: { u: pack.x - 8, v: pack.y - 30 } },
            ...(showSecondary ? [{ id: 'tape', text: 'TAPED LOOP', short: 'TAPE', u: capsule.x + 90, v: capsule.y + 210, align: 'left' as const, tone: 'muted' as const, at: { u: capsule.x - 4, v: capsule.y + 210 } }] : []),
          ]}
        >
          {(px) => (
            <>
              {spec.side(px)}
              <BeltPack view="side" at={pack} />
              <LavCable view="side" from={tail} pack={pack} loops={{ broadcast: showBroadcast, secondary: showSecondary }} taut={pull.atCapsule > 0} tug={pull.atCapsule > 0} standing={spec.standing} />
              <LavClip view="side" grip={spec.mount.grip} />
              {spec.mount.covered ? <FabricOver view="side" at={capsule} /> : null}
              <MicAt view="side" p={capsule} aim={unit(sub(LIP, capsule))} art="lavalier" r={3} len={12} />
            </>
          )}
        </FieldStage>
      ),
      badge: 'Side view, close on the chest · dashed = under the shirt · how far each move pulls is a drawing default: a simplified picture · silent',
      bezel,
      params,
      initialParam: 'move',
    },
    well: (
      <>
        <Landing looking="Side view · the chest, the clip, the cable and the pack" prompt="Choose a MOVE, then try LOOPS: none, a broadcast loop, both. Where does the tug end up?" />
        <Card>
          <Point title={`${mv.label} · ${LOOP_OPTS.find((o) => o.id === loopsId)!.label.toUpperCase()}`}>
            {mv.mm === 0
              ? 'Standing still, the cable rests: nothing pulls. Now try a move.'
              : pull.atCapsule > 0
                ? `The path from the clip to the pack grows about ${mv.mm} mm and nothing stops it before the capsule: about ${pull.atCapsule} mm of tug at the clip — a rub or a thump in the sound, and the capsule can twist off the mouth.`
                : loops.secondary
                  ? `The taped loop lower down takes the pull${pull.atTape > 0 ? ` (and past its spare cable, the tape itself — about ${pull.atTape} mm)` : ''}: nothing reaches the clip.`
                  : `The broadcast loop’s spare cable gives first: nothing reaches the capsule.`}
          </Point>
        </Card>
        {done ? <Note tone="ok">{spec.words.done}</Note> : null}
        <Body>Let the wearer sit, stand, turn and gesture before the take, and listen for cable taps, a tie or a necklace on the capsule, and the pack moving. A high-pass filter can soften a little rumble; it cannot repair a rub or a tug.</Body>
      </>
    ),
  };
}

/* ── OUT OF THE BREATH ── */

export type BreathSpec = {
  /** The face from above (the scene's head, facing ahead). */
  top: (px: number) => ReactNode;
  box: ViewBox;
  /** The headset's place (frame V): the step slides it toward the lips. */
  home: Vec3;
  words: { done: string };
};

export function useBreathStep(spec: BreathSpec): MikingStep {
  const [s, setS] = useState(0);
  const [seen, setSeen] = useState({ in: false });
  const a0 = Math.atan2(spec.home.z, spec.home.x);
  const r0 = Math.hypot(spec.home.x, spec.home.z);
  const a = a0 * (1 - s);
  const rad = r0 + (30 - r0) * s;
  const p = v3(rad * Math.cos(a), spec.home.y, rad * Math.sin(a));
  const hit = inBreathJet(p);
  const off = (a * 180) / Math.PI;
  const a11y = `The face from above, the lips at the front. The headset’s capsule ${cm(fromCorner(p))} from the corner of the mouth, ${deg5(off)} off the mouth’s axis: ${hit ? 'inside the breath jet — it hears the puffs of P and B' : 'outside the breath jet'}.`;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'slide',
      label: 'CAPSULE',
      value: s,
      onChange: (v) => {
        const q = Math.round(v * 20) / 20;
        setS(q);
        const ang = a0 * (1 - q);
        const pp = v3((r0 + (30 - r0) * q) * Math.cos(ang), spec.home.y, (r0 + (30 - r0) * q) * Math.sin(ang));
        if (inBreathJet(pp)) setSeen((x) => (x.in ? x : { ...x, in: true }));
      },
      format: (v) => (v < 0.05 ? 'beside the corner of the mouth' : v > 0.95 ? 'straight in front of the lips' : `${Math.round(v * 100)}% of the way to the front of the lips`),
      formatShort: (v) => `${Math.round(v * 100)}%`,
      home: 0,
    },
  ];
  const bezel: BezelItem[] = [
    { k: 'FROM CORNER', v: `${Math.round(fromCorner(p))} mm`, flex: 1 },
    { k: 'OFF AXIS', v: deg5(off), flex: 0.9 },
    { k: 'BREATH', v: hit ? 'IN THE JET' : 'CLEAR', tint: hit ? '#ff6b5e' : '#5bff85', flex: 1.1 },
  ];
  return {
    key: 'breath',
    title: 'Out of the breath',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <FieldStage w={w} h={h} view="top" box={spec.box} a11y={a11y} labels={[{ id: 'jet', text: 'THE BREATH', short: 'BREATH', u: BREATH_JET.reach * 0.62, v: -BREATH_JET.reach * 0.32, align: 'center', tone: 'muted' }, { id: 'cap', text: 'CAPSULE', u: p.x + 40, v: p.z + 90, align: 'left', tone: 'amber', at: { u: p.x, v: p.z } }]}>
          {(px) => (
            <>
              {spec.top(px)}
              <TurnedHeadTop yawDeg={0} />
              <BreathJet view="top" hit={hit} />
              <HeadsetFrame view="top" capsule={p} />
              <MicAt view="top" p={p} aim={unit(sub(LIP, p))} art="gooseneck" r={3} len={14} />
              <Aim from={uvOf('top', p)} dir={{ u: -p.x / Math.hypot(p.x, p.z), v: -p.z / Math.hypot(p.x, p.z) }} len={24} px={px} />
            </>
          )}
        </FieldStage>
      ),
      badge: 'From above, close on the face · the breath jet is a simplified cone (its angle and reach are drawing defaults) · silent',
      bezel,
      params,
      initialParam: 'slide',
    },
    well: (
      <>
        <Landing looking="Top view · the face, a headset’s capsule beside the mouth" prompt="Slide the CAPSULE from beside the corner of the mouth toward the front of the lips. When does it meet the breath?" />
        <Card>
          <Point title={hit ? 'IN THE BREATH' : 'OUT OF THE BREATH'}>{hit ? 'P and B push a puff of air straight out of the lips: here the capsule sits in it and hears pops and breath blasts. Move it back toward the corner of the mouth.' : `${Math.round(fromCorner(p))} mm from the corner of the mouth, ${deg5(off)} off the mouth’s axis: the puffs go past it. Beside the corner — where its maker says — it stays at one distance as the head turns.`}</Point>
        </Card>
        {seen.in && s < 0.25 ? <Note tone="ok">{spec.words.done}</Note> : null}
        <Body>Follow the headset maker’s position: bend its boom only as its instructions say, keep the capsule off the cheek, and check smiling, glasses, earrings, a beard and hair against it. A small foam windscreen made for that capsule can help with breath.</Body>
      </>
    ),
  };
}
