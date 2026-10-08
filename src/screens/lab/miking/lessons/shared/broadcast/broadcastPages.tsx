/**
 * THE BROADCAST PAGES' OWN STEPS (Lab 7; LessonArt.pages) — built once by
 * group 1, used by B01, B07, B06 and the later broadcast lessons. Served by
 * the journey (engine/restructure):
 *
 *   sound   → the second half of MEET IT — WHERE THE SOUND COMES FROM:
 *     WHERE THE VOICE COMES FROM (rack, key 'seq')  the voice family's
 *                 sequence — STEP or PLAY ONCE (a staged reveal, stops);
 *     a lesson's own tool steps:
 *       useTurnStep     THE HEAD TURNS (rack, 'turn'): TURN (yaw) and LOOK
 *                       (pitch) the talker's head; fixed mics read their
 *                       distance, angle off the mouth's axis and level
 *                       change (talkerPose.turnReadout);
 *       useReflectStep  THE DESK ANSWERS BACK (rack, 'desk'): a hard surface
 *                       below or beside the mouth sends a second, later copy
 *                       of the voice to the mic (deskReflection.ts): the
 *                       mirror image, Δt, the first notch, a comb strip;
 *       useOpenMicStep  EVERY OPEN MIC (rack, 'mics'): who speaks, which
 *                       mics are open — the bleed into each, the later
 *                       arrival's comb, the open-mic cost (openMicPanel.ts);
 *     SPEECH AND CONSONANTS (read, 'body')  in words; then the checks.
 *   setting → its last steps on STARTING SETUPS:
 *     WHERE EACH MIC GOES (rack, key 'path' — kept by setupsKeep)
 *                 useRoutingStep: the RoutingPanel; TRACE a source, flip the
 *                 lesson's switches, read the problems in words;
 *     BEFORE ANY MIC (read, 'before')  the lesson's points, hearing, checks.
 * FULLY SILENT; nothing loops (D8); every state reachable by a control.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, Path, Skia, vec } from '@shopify/react-native-skia';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import { colors, fonts } from '../../../../../../theme/tokens';
import { fitValue } from '../../../../../../theme/legibility';
import type { MicArtId, PatternId, SourcePageId, Vec3, ViewBox } from '../../../engine/model/types.ts';
import { copyOf } from '../../../engine/model/copy.ts';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { C20, COMB_FLOOR_DB, combDb } from '../../../engine/physics/twoMic.ts';
import { aimOf } from '../ensemble/frameS.ts';
import { useStepper } from '../hand/handPages';
import { VoiceSequence } from '../voice/VoiceSoundArt';
import { Aim, Dim, FieldStage, MicAt, Ray, uvOf, type FieldInset } from '../field/FieldStage';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import { TURN_LIMITS, turnHead, turnReadout } from './talkerPose.ts';
import { TurnedHeadSide, TurnedHeadTop } from './BroadcastArt';
import { deskReflection, type Plate } from './deskReflection.ts';
import { bleedMatrix, openMics, strongestLeak, threeToOneNote, type PanelMic, type PanelTalker } from './openMicPanel.ts';
import { CONNECT_WORDS, DESTINATIONS, connect, feeds, problemWords, routeProblems, type DestId, type Level, type RoutingPlan } from './routing.ts';
import { RoutingPanel, type SourceLook } from './RoutingPanel';

type PageFn = (p: PageProps) => ReactNode;
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
export const hz = (f: number | null) => (f == null ? 'above 20 kHz' : f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 0 : 1)} kHz` : `${Math.round(f / 10) * 10} Hz`);
const ms = (t: number) => `${Math.abs(t).toFixed(2)} ms`;

/** A mic as the tool steps draw it: its front `p`, its aim (unit), how it is
 *  drawn (a MikingMicArt id, radius, length) — frame V of the talker. */
export type ToolMic = { id: string; label: string; short: string; p: Vec3; aim: Vec3; art: MicArtId; r: number; len: number; pattern: PatternId; cross?: number; /** Its extent from above, when not 2r (a boundary plate's width). */ crossTop?: number };

/** A mic aimed at the lips from `p`. */
export function aimedAtLips(id: string, label: string, short: string, p: Vec3, look: { art: MicArtId; r: number; len: number; pattern: PatternId; cross?: number }): ToolMic {
  return { id, label, short, p, aim: unit(sub(LIP, p)), ...look };
}

/* ── a comb strip (the simplified two-arrival sum) ── */

const F0 = 100;
const F1 = 20000;

/** |direct + later copy| from 100 Hz to 20 kHz on a log axis, the first notch
 *  marked — the ideal sum of two arrivals (twoMic.combDb). Native labels. */
export function CombStrip({ w, h, dtMs, gA, gB, a11y }: { w: number; h: number; dtMs: number; gA: number; gB: number; a11y: string }) {
  const padL = 6;
  const padR = 6;
  const padT = 6;
  const padB = 18;
  const gw = Math.max(40, w - padL - padR);
  const gh = Math.max(30, h - padT - padB);
  const xOf = (f: number) => padL + (Math.log10(f / F0) / Math.log10(F1 / F0)) * gw;
  const yOf = (db: number) => padT + ((6 - db) / (6 - COMB_FLOOR_DB)) * gh;
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i <= 220; i++) {
      const f = F0 * Math.pow(F1 / F0, i / 220);
      const d = combDb(f, dtMs, gA, gB, 1);
      if (i === 0) p.moveTo(xOf(f), yOf(d));
      else p.lineTo(xOf(f), yOf(d));
    }
    return p;
  }, [dtMs, gA, gB, w, h]); // eslint-disable-line react-hooks/exhaustive-deps
  const first = Math.abs(dtMs) > 1e-6 ? 1 / (2 * (Math.abs(dtMs) / 1000)) : null;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
        <Line p1={vec(padL, yOf(0))} p2={vec(padL + gw, yOf(0))} color="#3a3d45" strokeWidth={1} />
        {[1000, 10000].map((f) => (
          <Line key={f} p1={vec(xOf(f), padT)} p2={vec(xOf(f), padT + gh)} color="#2a2d34" strokeWidth={1} />
        ))}
        <Path path={path} style="stroke" strokeWidth={2} color="#6fa8ff" />
        {first != null && first < F1 && first > F0 ? (
          <Group>
            <Line p1={vec(xOf(first), padT)} p2={vec(xOf(first), padT + gh)} color="#ffc64d" strokeWidth={1.5}>
              <DashPathEffect intervals={[4, 3]} />
            </Line>
            <Circle cx={xOf(first)} cy={yOf(combDb(first, dtMs, gA, gB, 1))} r={3.5} color="#ffc64d" />
          </Group>
        ) : null}
      </Canvas>
      {[100, 1000, 10000].map((f) => (
        <Text key={f} style={[styles.tick, { left: Math.max(0, Math.min(w - 40, xOf(f) - 20)), top: h - padB + 2 }]} {...fitValue(9)}>
          {f >= 1000 ? `${f / 1000}k` : `${f}`}
        </Text>
      ))}
    </View>
  );
}

/* ── THE HEAD TURNS ── */

export type TurnSpec = {
  /** The fixed mics (frame V of the talker). */
  mics: readonly ToolMic[];
  /** The scene round the talker from above and from the side (frame V);
   *  the talker drawn without a head (`headless`) — the step draws it turned. */
  top: (px: number) => ReactNode;
  side: (px: number) => ReactNode;
  boxTop: ViewBox;
  boxSide: ViewBox;
  /** Show the LOOK (pitch) control and the side inset. */
  pitch: boolean;
  /** Draw only the mic chosen with MIC (two places for one mic). */
  oneAtATime?: boolean;
  phones?: boolean;
  words: { looking: string; prompt: string; done: string; subject: string };
};

export function useTurnStep(spec: TurnSpec): MikingStep {
  const [yaw, setYaw] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [micId, setMicId] = useState(spec.mics[0].id);
  const [seen, setSeen] = useState({ left: false, right: false, down: false });
  const m = spec.mics.find((q) => q.id === micId) ?? spec.mics[0];
  const shown = spec.oneAtATime ? [m] : spec.mics;
  const t = turnHead(yaw, pitch);
  const r = turnReadout(m.p, m.aim, yaw, pitch);
  const axisEnd = v3(t.mouth.x + t.dir.x * 640, t.mouth.y + t.dir.y * 640, t.mouth.z + t.dir.z * 640);
  const side = yaw > 2 ? 'to their right' : yaw < -2 ? 'to their left' : 'straight ahead';
  const look = pitch < -2 ? `looking down ${Math.abs(pitch)} degrees` : pitch > 2 ? `looking up ${pitch} degrees` : 'level';
  const a11y = `From above, ${spec.words.subject}: the head turned ${Math.abs(Math.round(yaw))} degrees ${side}, ${look}. ${spec.mics.map((q) => { const k = turnReadout(q.p, q.aim, yaw, pitch); return `${q.label}: ${cm(k.d)} from the lips, ${deg5(k.offAxis)} off the mouth’s axis`; }).join('. ')}.`;
  const yawFmt = (v: number) => {
    const y = Math.round((v * 120 - 60) / 5) * 5;
    return y === 0 ? 'facing ahead' : `${Math.abs(y)}° to the talker’s ${y > 0 ? 'right' : 'left'}`;
  };
  const span = TURN_LIMITS.pitch.max - TURN_LIMITS.pitch.min;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'turn',
      label: 'TURN',
      value: (yaw + 60) / 120,
      onChange: (v) => {
        const y = Math.round((v * 120 - 60) / 5) * 5;
        setYaw(y);
        if (y <= -30) setSeen((s) => (s.left ? s : { ...s, left: true }));
        if (y >= 30) setSeen((s) => (s.right ? s : { ...s, right: true }));
      },
      format: yawFmt,
      formatShort: (v) => `${Math.round((v * 120 - 60) / 5) * 5}°`,
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
              const p = Math.round((TURN_LIMITS.pitch.min + v * span) / 5) * 5;
              setPitch(p);
              if (p <= -15) setSeen((s) => (s.down ? s : { ...s, down: true }));
            },
            format: (v: number) => {
              const p = Math.round((TURN_LIMITS.pitch.min + v * span) / 5) * 5;
              return p === 0 ? 'head level' : p < 0 ? `${-p}° down (reading)` : `${p}° up`;
            },
            formatShort: (v: number) => `${Math.round((TURN_LIMITS.pitch.min + v * span) / 5) * 5}°`,
            home: -TURN_LIMITS.pitch.min / span,
          },
        ]
      : []),
    ...(spec.mics.length > 1
      ? [
          {
            kind: 'options' as const,
            id: 'mic',
            label: 'MIC',
            valueLabel: m.short,
            selectedId: micId,
            onSelect: (id: string) => setMicId(id),
            sticky: true,
            options: spec.mics.map((q) => ({ id: q.id, label: q.label, blurb: `Read ${q.label.toLowerCase()} on the bezel.` })),
          },
        ]
      : []),
  ];
  const bezel: BezelItem[] = [
    { k: 'TURN', v: `${yaw}°`, flex: 0.7 },
    ...(spec.pitch ? [{ k: 'LOOK', v: `${pitch}°`, flex: 0.7 }] : []),
    { k: 'TO LIPS', v: cm(r.d), flex: 0.9 },
    { k: 'OFF AXIS', v: deg5(r.offAxis), tint: r.offAxis > 45 ? '#ff6b5e' : undefined, flex: 0.9 },
    { k: 'LEVEL', v: Math.abs(r.distDb) < 0.5 ? '0 dB' : `${r.distDb > 0 ? '−' : '+'}${Math.abs(r.distDb).toFixed(0)} dB`, flex: 0.9 },
  ];
  const head = (view: 'top' | 'side') => (view === 'top' ? <TurnedHeadTop yawDeg={yaw} /> : <TurnedHeadSide pitchDeg={pitch} phones={spec.phones} />);
  const inset: FieldInset | null = spec.pitch
    ? {
        view: 'side',
        box: spec.boxSide,
        at: { x: 0.6, y: 0.02, w: 0.39, h: 0.46 },
        title: 'SIDE',
        draw: (px) => (
          <>
            {spec.side(px)}
            {head('side')}
            <Ray a={uvOf('side', t.mouth)} b={uvOf('side', axisEnd)} px={px} color="#e8eaee" width={2} />
            {shown.map((q) => (
              <MicAt key={q.id} view="side" p={q.p} aim={q.aim} art={q.art} r={q.r} len={q.len} cross={q.cross} />
            ))}
          </>
        ),
        labels: [{ id: 'side', text: 'SIDE', u: spec.boxSide.u0 + (spec.boxSide.u1 - spec.boxSide.u0) * 0.08, v: spec.boxSide.v0 + (spec.boxSide.v1 - spec.boxSide.v0) * 0.1, align: 'left', tone: 'muted' }],
      }
    : null;
  return {
    key: 'turn',
    title: 'The head turns',
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
            { id: 'axis', text: 'THE MOUTH’S AXIS', short: 'AXIS', u: axisEnd.x, v: axisEnd.z + (t.dir.z >= 0 ? 60 : -80), align: 'right', tone: 'muted' },
            ...shown.map((q, i) => ({ id: `m.${q.id}`, text: q.short, u: q.p.x + 60, v: q.p.z + (i % 2 ? 140 : -140), align: 'left' as const, tone: 'amber' as const, at: { u: q.p.x, v: q.p.z } })),
          ]}
        >
          {(px) => (
            <>
              {spec.top(px)}
              {head('top')}
              <Ray a={uvOf('top', t.mouth)} b={uvOf('top', axisEnd)} px={px} color="#e8eaee" width={2.2} />
              {shown.map((q) => (
                <MicAt key={q.id} view="top" p={q.p} aim={q.aim} art={q.art} r={q.r} len={q.len} cross={q.crossTop} />
              ))}
              <Dim a={uvOf('top', t.mouth)} b={uvOf('top', m.p)} px={px} />
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
            const k = turnReadout(q.p, q.aim, yaw, pitch);
            return (
              <Point key={q.id} title={q.label.toUpperCase()}>
                {`${cm(k.d)} from the lips (${cm(k.d0)} facing ahead), ${deg5(k.offAxis)} off the mouth’s axis — the voice ${dbWords(k.distDb)} by distance alone.`}
              </Point>
            );
          })}
        </Card>
        {seen.left && seen.right && (!spec.pitch || seen.down) ? <Note tone="ok">{spec.words.done}</Note> : null}
        <Body>The voice’s highest frequencies go out ahead of the mouth: off its axis a mic hears a duller voice. The angles and distances are calculated from the drawing; the level is by distance alone — a simplified picture.</Body>
      </>
    ),
  };
}

/* ── THE DESK ANSWERS BACK ── */

export type ReflectSpec = {
  plate: Plate;
  /** Where the mic can start: each a direction from the lips (unit, frame V)
   *  and its aim rule (at the lips). */
  places: readonly { id: string; label: string; blurb: string; dir: Vec3 }[];
  look: { art: MicArtId; r: number; len: number; pattern: PatternId; cross?: number };
  range: { min: number; max: number; start: number };
  side: (px: number) => ReactNode;
  box: ViewBox;
  words: { title: string; looking: string; prompt: string; surface: string; subject: string; done: string };
};

export function useReflectStep(spec: ReflectSpec): MikingStep {
  const [placeId, setPlaceId] = useState(spec.places[0].id);
  const [d, setD] = useState(spec.range.start);
  const [tried, setTried] = useState<ReadonlySet<string>>(() => new Set([spec.places[0].id]));
  const place = spec.places.find((q) => q.id === placeId) ?? spec.places[0];
  const p = v3(place.dir.x * d, place.dir.y * d, place.dir.z * d);
  const aim = unit(sub(LIP, p));
  const pose = { p, ...aimOf(aim) };
  const R = deskReflection(LIP, pose, spec.look.pattern, spec.plate);
  const gA = 1 / Math.max(1, R.r1);
  const gB = R.exists ? (R.patternDb == null ? 0 : Math.pow(10, -(R.distDb + R.patternDb) / 20) * gA) : 0;
  const lower = R.patternDb == null ? null : R.distDb + R.patternDb;
  const a11y = `Side view of ${spec.words.subject}. The mic ${cm(R.r1)} from the lips, ${place.label.toLowerCase()}. ${R.exists ? `The voice also bounces off ${spec.words.surface}: that path is ${cm(R.r2)}, arriving ${ms(R.dtMs)} later and ${lower == null ? 'in the mic’s null' : `about ${lower.toFixed(0)} dB lower`}; the first notch near ${hz(R.firstNotchHz)}.` : `From here no reflection off ${spec.words.surface} reaches the mic.`}`;
  const span = spec.range.max - spec.range.min;
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'place',
      label: 'MIC AT',
      valueLabel: place.label.toUpperCase().slice(0, 10),
      selectedId: placeId,
      onSelect: (id) => {
        setPlaceId(id);
        setTried((s) => (s.has(id) ? s : new Set([...s, id])));
      },
      sticky: true,
      options: spec.places.map((q) => ({ id: q.id, label: q.label, blurb: q.blurb })),
    },
    {
      kind: 'fader',
      id: 'dist',
      label: 'DISTANCE',
      value: (d - spec.range.min) / span,
      onChange: (v) => setD(Math.round((spec.range.min + v * span) / 5) * 5),
      format: (v) => `${cm(spec.range.min + v * span)} from the lips`,
      formatShort: (v) => cm(spec.range.min + v * span),
    },
  ];
  const bezel: BezelItem[] = [
    { k: 'DIRECT', v: cm(R.r1), flex: 0.9 },
    { k: 'BOUNCE', v: R.exists ? cm(R.r2) : '—', flex: 0.9 },
    { k: 'LATER BY', v: R.exists ? ms(R.dtMs) : '—', flex: 1 },
    { k: 'FIRST NOTCH', v: R.exists ? hz(R.firstNotchHz) : '—', flex: 1.1 },
  ];
  const labels: StaticLabel[] = [
    { id: 'img', text: 'MIRROR IMAGE OF THE MOUTH', short: 'MIRROR IMAGE', u: R.image.x + 40, v: R.image.y + 20, align: 'left', tone: 'muted' },
    { id: 'mic', text: 'MIC', u: p.x + 40, v: p.y - 50, align: 'left', tone: 'amber', at: { u: p.x, v: p.y } },
  ];
  return {
    key: 'desk',
    title: spec.words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <FieldStage w={w} h={h} view="side" box={spec.box} a11y={a11y} labels={labels}>
          {(px) => (
            <>
              {spec.side(px)}
              {/* The image source: a faint ring where the mirror mouth sits. */}
              <Circle cx={R.image.x} cy={R.image.y} r={14 * px * 3} style="stroke" strokeWidth={2 * px} color="#8fbcff" opacity={0.6}>
                <DashPathEffect intervals={[6 * px, 5 * px]} />
              </Circle>
              <Ray a={uvOf('side', LIP)} b={uvOf('side', p)} px={px} color="#e8eaee" width={2.4} dash={[1000, 0]} />
              {R.exists && R.at ? (
                <>
                  <Ray a={uvOf('side', LIP)} b={uvOf('side', R.at)} px={px} color="#ffc64d" width={2.2} />
                  <Ray a={uvOf('side', R.at)} b={uvOf('side', p)} px={px} color="#ffc64d" width={2.2} />
                  <Ray a={uvOf('side', R.at)} b={uvOf('side', R.image)} px={px} color="#8fbcff" width={1.4} />
                  <Circle cx={R.at.x} cy={R.at.y} r={6 * px} color="#ffc64d" />
                </>
              ) : null}
              <MicAt view="side" p={p} aim={aim} art={spec.look.art} r={spec.look.r} len={spec.look.len} cross={spec.look.cross} />
              <Aim from={uvOf('side', p)} dir={{ u: aim.x, v: aim.y }} len={Math.min(R.r1 * 0.6, 120)} px={px} />
            </>
          )}
        </FieldStage>
      ),
      badge: 'Side view · white = straight to the mic · amber = off the surface · a hard, flat surface and a point mouth: a simplified picture · silent',
      bezel,
      params,
      initialParam: 'dist',
    },
    well: (
      <>
        <Landing looking={spec.words.looking} prompt={spec.words.prompt} />
        <Card>
          <Point title="TWO COPIES OF ONE VOICE">
            {R.exists
              ? `Straight to the mic: ${cm(R.r1)}. Off ${spec.words.surface}: ${cm(R.r2)} — ${ms(R.dtMs)} later and ${lower == null ? 'arriving in the mic’s null' : `about ${lower.toFixed(0)} dB lower (by distance and the mic’s pattern)`}. Together they cancel some pitches: the first dip near ${hz(R.firstNotchHz)}, then more above it.`
              : `From here the bounce off ${spec.words.surface} misses the mic: the reflection’s mirror point falls off the surface.`}
          </Point>
        </Card>
        <CombStrip w={300} h={86} dtMs={R.exists ? R.dtMs : 0} gA={gA} gB={gB} a11y={`A simplified graph of the direct sound plus its reflection, 100 hertz to 20 kilohertz: ${R.exists ? `dips start near ${hz(R.firstNotchHz)}.` : 'flat — no reflection reaches the mic.'}`} />
        {tried.size >= Math.min(2, spec.places.length) ? <Note tone="ok">{spec.words.done}</Note> : null}
        <Body>Real desks and stands absorb and scatter some of the sound, and a voice is not one point: read where the first dip falls, not its depth. Move the mic or the surface first; EQ cannot pull a cancelled pitch back.</Body>
      </>
    ),
  };
}

/* ── EVERY OPEN MIC ── */

export type OpenMicSpec = {
  talkers: readonly PanelTalker[];
  mics: readonly (PanelMic & { look: { art: MicArtId; r: number; len: number }; short: string })[];
  /** Ready-made open/muted sets (the dock's OPEN presets). */
  presets: readonly { id: string; label: string; blurb: string; open: readonly string[] }[];
  top: (px: number) => ReactNode;
  box: ViewBox;
  words: { looking: string; prompt: string; done: string; subject: string };
};

export function useOpenMicStep(spec: OpenMicSpec): MikingStep {
  const [speaker, setSpeaker] = useState(spec.talkers[0].id);
  const [presetId, setPresetId] = useState(spec.presets[0].id);
  const [seenPresets, setSeen] = useState<ReadonlySet<string>>(() => new Set([spec.presets[0].id]));
  const preset = spec.presets.find((q) => q.id === presetId) ?? spec.presets[0];
  const mics = useMemo(() => spec.mics.map((m) => ({ ...m, open: preset.open.includes(m.id) })), [spec.mics, preset]);
  const talker = spec.talkers.find((q) => q.id === speaker) ?? spec.talkers[0];
  const matrix = bleedMatrix(mics, spec.talkers);
  const nom = openMics(mics);
  const leaks = strongestLeak(mics, spec.talkers.filter((q) => q.id === speaker));
  const three = threeToOneNote(mics, spec.talkers);
  const ti = spec.talkers.findIndex((q) => q.id === speaker);
  const a11y = `From above, ${spec.words.subject}. ${talker.label} is speaking. Open mics: ${mics.filter((m) => m.open).map((m) => m.label).join(', ') || 'none'}. ${leaks ? `${talker.label} also reaches ${spec.mics.find((m) => m.id === leaks.other)?.label}, ${ms(leaks.dtMs)} later and ${leaks.levelDb == null ? 'in its null' : `about ${leaks.levelDb.toFixed(0)} dB lower`}.` : 'No second open mic hears them.'}`;
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'speaker',
      label: 'WHO SPEAKS',
      valueLabel: talker.label.toUpperCase().slice(0, 10),
      selectedId: speaker,
      onSelect: setSpeaker,
      sticky: true,
      options: spec.talkers.map((q) => ({ id: q.id, label: q.label })),
    },
    {
      kind: 'options',
      id: 'open',
      label: 'OPEN MICS',
      valueLabel: `${nom.open}`,
      selectedId: presetId,
      onSelect: (id) => {
        setPresetId(id);
        setSeen((s) => (s.has(id) ? s : new Set([...s, id])));
      },
      sticky: true,
      options: spec.presets.map((q) => ({ id: q.id, label: q.label, blurb: q.blurb })),
    },
  ];
  const bezel: BezelItem[] = [
    { k: 'OPEN', v: `${nom.open}`, flex: 0.6 },
    { k: 'MARGIN LOST', v: nom.open > 1 ? `≈ ${nom.costDb.toFixed(1)} dB` : '0 dB', flex: 1.1 },
    { k: 'LEAK', v: leaks ? (leaks.levelDb == null ? 'REAR NULL' : `−${Math.max(0, leaks.levelDb).toFixed(0)} dB`) : '—', flex: 0.9 },
    { k: 'FIRST NOTCH', v: leaks ? hz(leaks.firstNotchHz) : '—', flex: 1.1 },
  ];
  const labels: StaticLabel[] = [
    ...spec.talkers.map((q) => ({ id: `t.${q.id}`, text: q.label.toUpperCase(), short: q.label.toUpperCase().slice(0, 8), u: q.mouth.x - 160, v: q.mouth.z + (q.mouth.z >= 0 ? 260 : -260), align: 'center' as const, tone: q.id === speaker ? ('amber' as const) : ('muted' as const) })),
  ];
  return {
    key: 'mics',
    title: 'Every open mic',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <FieldStage w={w} h={h} view="top" box={spec.box} a11y={a11y} labels={labels}>
          {(px) => (
            <>
              {spec.top(px)}
              {mics.map((m) => {
                const own = m.owner === speaker;
                return m.open ? <Ray key={`r.${m.id}`} a={uvOf('top', talker.mouth)} b={uvOf('top', m.pose.p)} px={px} color={own ? '#ffc64d' : '#8fbcff'} width={own ? 3 : 2} dash={own ? [1000, 0] : [10, 7]} /> : null;
              })}
              {mics.map((m) => {
                const a = { x: -Math.cos((m.pose.az * Math.PI) / 180) * Math.cos((m.pose.el * Math.PI) / 180), y: -Math.sin((m.pose.el * Math.PI) / 180), z: Math.sin((m.pose.az * Math.PI) / 180) * Math.cos((m.pose.el * Math.PI) / 180) };
                return (
                  <Group key={m.id} opacity={m.open ? 1 : 0.45}>
                    <MicAt view="top" p={m.pose.p} aim={a} art={m.look.art} r={m.look.r} len={m.look.len} />
                    <Circle cx={m.pose.p.x - a.x * m.look.len * 0.9} cy={m.pose.p.z - a.z * m.look.len * 0.9} r={6 * px} color={m.open ? '#5bff85' : '#ff5a48'} />
                  </Group>
                );
              })}
            </>
          )}
        </FieldStage>
      ),
      badge: 'From above · green dot = open, red = muted · straight paths, point mouths, no room: a simplified picture · silent',
      bezel,
      params,
      initialParam: 'open',
    },
    well: (
      <>
        <Landing looking={spec.words.looking} prompt={spec.words.prompt} />
        <Card>
          <Point title={`${talker.label.toUpperCase()} AT EACH MIC`}>
            {mics
              .map((m, i) => {
                const c = matrix[i][ti];
                const tag = m.open ? '' : ' (muted)';
                return m.owner === speaker ? `${m.label}${tag}: ${cm(c.r)} — their own mic.` : `${m.label}${tag}: ${cm(c.r)}, ${c.totalDb == null ? 'in its null (a simplified pattern)' : `about ${c.totalDb.toFixed(0)} dB lower than its own talker`}.`;
              })
              .join(' ')}
          </Point>
          <Point title={`OPEN MICS · ${nom.open}`}>{nom.open > 1 ? `Each doubling of open mics costs about 3 dB of gain before feedback: ${nom.open} open, about ${nom.costDb.toFixed(1)} dB less margin than one. Mute the mics no one is using.` : 'One open mic: the most margin this setup can have.'}</Point>
          {leaks ? <Point title="ONE VOICE, TWO MICS">{`In the mix, ${talker.label.toLowerCase()} arrives through their own mic first and through ${spec.mics.find((m) => m.id === leaks.other)?.label.toLowerCase()} ${ms(leaks.dtMs)} later${leaks.levelDb == null ? ' — off the back of its pattern, where the simplified drawing shows a null; a real mic in a real room rejects much less there, so the copy is still heard' : ''}. The two copies cancel some pitches, the first near ${hz(leaks.firstNotchHz)}.`}</Point> : null}
          {three ? <Point title="THE 3:1 NOTE">{`A helpful starting idea, not a test: the closest pair of open mics is ${cm(three.apart)} apart, ${three.ok ? 'at least' : 'less than'} three times the farther mic-to-talker distance (${cm(three.need)}). It helps with spaced mics; it cannot promise a quiet mix at a talking table.`}</Point> : null}
        </Card>
        {seenPresets.size >= Math.min(2, spec.presets.length) ? <Note tone="ok">{spec.words.done}</Note> : null}
      </>
    ),
  };
}

/* ── WHERE EACH MIC GOES ── */

export type RoutingSwitch = { id: string; label: string; options: readonly { id: string; label: string; blurb: string; sends: Readonly<Record<string, readonly DestId[]>> }[] };
export type RoutingSpec = {
  plan: RoutingPlan;
  looks: Readonly<Record<string, SourceLook>>;
  switches: readonly RoutingSwitch[];
  words: { looking: string; prompt: string; done: string };
  /** Plain points under the diagram (the lesson's routing words). */
  points: readonly { title: string; text: string }[];
  /** A connection to check (B06: a reporter's recorder on the press box's
   *  mic-level output): the input setting is a switch; a mismatch is a
   *  problem (routing.connect). */
  levelCheck?: { id: string; label: string; title: string; out: Level; options: readonly { id: Level; label: string; blurb: string }[] };
};

export function useRoutingStep(spec: RoutingSpec): MikingStep {
  const [trace, setTrace] = useState(spec.plan.sources[0].id);
  const [picks, setPicks] = useState<Record<string, string>>(() => Object.fromEntries(spec.switches.map((s) => [s.id, s.options[0].id])));
  const [flipped, setFlipped] = useState(false);
  const plan = useMemo(() => {
    let sends = { ...spec.plan.sends };
    for (const s of spec.switches) {
      const o = s.options.find((q) => q.id === picks[s.id]) ?? s.options[0];
      sends = { ...sends, ...o.sends };
    }
    return { ...spec.plan, sends };
  }, [spec.plan, spec.switches, picks]);
  const problems = routeProblems(plan);
  const [inLevel, setInLevel] = useState<Level | null>(spec.levelCheck ? spec.levelCheck.options[0].id : null);
  const conn = spec.levelCheck && inLevel ? connect(spec.levelCheck.out, inLevel) : 'ok';
  const nProblems = problems.length + (conn === 'ok' ? 0 : 1);
  const src = plan.sources.find((s) => s.id === trace) ?? plan.sources[0];
  const reached = plan.dests.filter((d) => plan.sends[src.id]?.includes(d));
  const a11y = `A signal-flow drawing: ${plan.sources.length} sources into the mixer, ${plan.dests.length} destinations out of it. Tracing ${src.label}: it reaches ${reached.map((d) => DESTINATIONS[d].label).join(', ') || 'nothing'}. ${nProblems ? `${nProblems} routing problem${nProblems > 1 ? 's' : ''}.` : 'No routing problems.'}`;
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'trace',
      label: 'TRACE',
      valueLabel: src.short.slice(0, 10),
      selectedId: trace,
      onSelect: setTrace,
      sticky: true,
      options: plan.sources.map((s) => ({ id: s.id, label: s.label, blurb: `Light every destination ${s.label.toLowerCase()} reaches.` })),
    },
    ...spec.switches.map((s) => {
      const o = s.options.find((q) => q.id === picks[s.id]) ?? s.options[0];
      return {
        kind: 'options' as const,
        id: `sw.${s.id}`,
        label: s.label,
        valueLabel: o.label.toUpperCase().slice(0, 10),
        selectedId: o.id,
        onSelect: (id: string) => {
          setPicks((p) => ({ ...p, [s.id]: id }));
          setFlipped(true);
        },
        sticky: true,
        options: s.options.map((q) => ({ id: q.id, label: q.label, blurb: q.blurb })),
      };
    }),
    ...(spec.levelCheck
      ? [
          {
            kind: 'options' as const,
            id: spec.levelCheck.id,
            label: spec.levelCheck.label,
            valueLabel: (spec.levelCheck.options.find((o) => o.id === inLevel)?.label ?? '').toUpperCase().slice(0, 10),
            selectedId: inLevel,
            onSelect: (id: string) => {
              setInLevel(id as Level);
              setFlipped(true);
            },
            sticky: true,
            options: spec.levelCheck.options.map((o) => ({ id: o.id, label: o.label, blurb: o.blurb })),
          },
        ]
      : []),
  ];
  const bezel: BezelItem[] = [
    { k: 'TRACING', v: src.short, flex: 1.2 },
    { k: 'REACHES', v: `${reached.length}`, flex: 0.8 },
    { k: 'PROBLEMS', v: `${nProblems}`, tint: nProblems ? '#ff6b5e' : '#5bff85', flex: 0.9 },
  ];
  return {
    key: 'path',
    title: 'Where each mic goes',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <RoutingPanel w={w} h={h} plan={plan} trace={trace} problems={problems} looks={spec.looks} a11y={a11y} />,
      badge: 'A signal-flow drawing · amber = the traced source’s paths · ✕ = a routing problem · silent',
      bezel,
      params,
      initialParam: 'trace',
    },
    well: (
      <>
        <Landing looking={spec.words.looking} prompt={spec.words.prompt} />
        <Card>
          <Point title={`${src.label.toUpperCase()} REACHES`}>{reached.length ? `${reached.map((d) => DESTINATIONS[d].label).join(', ')}.` : 'Nothing: it is not sent anywhere.'}</Point>
          {spec.levelCheck ? <Point title={`${conn === 'ok' ? '' : '✕ '}${spec.levelCheck.title}`}>{CONNECT_WORDS[conn]}</Point> : null}
          {problems.length ? (
            problems.map((p, i) => (
              <Point key={`${p.code}${i}`} title="✕ PROBLEM">
                {problemWords(plan, p)}
              </Point>
            ))
          ) : (
            <Point title="NO ROUTING PROBLEMS">Each feed carries what its listeners need, and nobody hears themselves come back.</Point>
          )}
        </Card>
        {flipped && !nProblems ? <Note tone="ok">{spec.words.done}</Note> : null}
        <Card>
          {spec.points.map((b) => (
            <Point key={b.title} title={b.title}>
              {b.text}
            </Point>
          ))}
        </Card>
        <Body>{`The feeds in this drawing: ${plan.dests.map((d) => `${DESTINATIONS[d].short} (${feeds(plan, d).length} source${feeds(plan, d).length === 1 ? '' : 's'})`).join(', ')}.`}</Body>
      </>
    ),
  };
}

/* ── the page makers ── */

export type BroadcastSoundSpec = {
  /** The lesson's own tool steps (hooks: called on every render). */
  useTools: (p: PageProps) => MikingStep[];
  silentNote: string;
  highs: string;
};

/** MEET IT's second half: the voice sequence, the lesson's tool steps, then
 *  speech and consonants in words with the checks. */
export function makeBroadcastSound(spec: BroadcastSoundSpec): PageFn {
  return function BroadcastSound(p: PageProps) {
    const { lesson, answers, onAnswered, hidden } = p;
    const S = lesson.sound;
    const n = S.stages.length;
    const st = useStepper(n, hidden);
    const [predicted, setPredicted] = useState<string | null>(null);
    const pred = lesson.predictions.sound;
    const stage = S.stages[st.shown - 1];
    const tools = spec.useTools(p);
    const steps: MikingStep[] = [
      {
        key: 'seq',
        title: 'Where the voice comes from',
        kind: 'WATCH',
        layout: 'rack',
        rack: {
          render: (w, h) => <VoiceSequence w={w} h={h} shown={st.shown} accessibilityLabel={`A talker in profile, the head and neck cut through the middle to show the airway, step ${st.shown} of ${n}: ${stage.title}. ${stage.text}`} />,
          badge: 'A simplified picture: a cut through the middle of the head · the order of events, not their speed or size · silent',
          bezel: [
            { k: 'STEP', v: `${st.shown} / ${n}`, flex: 0.8 },
            { k: 'EVENT', v: stage.title.toUpperCase(), flex: 2 },
          ],
          params: st.params,
          initialParam: 'step',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking="Side view · the talker from the right, cut through the middle" prompt="STEP through how breath becomes speech — or PLAY ONCE. It stops at the end." />
            <Card>
              <Point title={`${st.shown} · ${stage.title.toUpperCase()}`}>{stage.text}</Point>
            </Card>
            {st.shown >= n && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. The voice leaves through the mouth, so every distance here is read from the lips.`}</Note> : null}
          </>
        ),
      },
      ...tools,
      {
        key: 'body',
        title: 'Speech and consonants',
        kind: 'CHECK',
        layout: 'read',
        body: (
          <>
            <Card>
              <Point title="CONSONANTS AND BREATH">{S.attack}</Point>
              <Point title="SPEECH">{S.body}</Point>
              <Point title="WHERE THE HIGHS GO">{spec.highs}</Point>
            </Card>
            <Note>{spec.silentNote}</Note>
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}

/** Hearing, for broadcast work (BEFORE ANY MIC). */
export const BROADCAST_HEARING =
  'Protect hearing — the talent’s, the guests’ and yours. Keep headphone and earpiece levels comfortable and avoid sudden loud returns: a useful balance should never need a dangerous level. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that — a limit for PEOPLE, measured where a person listens. If anyone reports pain, ringing or a change in their hearing, stop and deal with the level.';

export type BroadcastSettingSpec = { useRouting: () => MikingStep; hearing?: string };

/** STARTING SETUPS' tail: where each mic goes (key 'path'), then BEFORE ANY
 *  MIC with the checks. */
export function makeBroadcastSetting(spec: BroadcastSettingSpec): PageFn {
  return function BroadcastSetting(p: PageProps) {
    const { lesson, answers, onAnswered } = p;
    const C = copyOf(lesson);
    const routing = spec.useRouting();
    const steps: MikingStep[] = [
      routing,
      {
        key: 'before',
        title: 'Before any mic',
        kind: 'CHECK',
        layout: 'read',
        body: (
          <>
            <Card>
              {C.setting.before.map((b) => (
                <Point key={b.title} title={b.title}>
                  {b.text}
                </Point>
              ))}
            </Card>
            <Note tone="warn">{spec.hearing ?? BROADCAST_HEARING}</Note>
            <Body>Then the checks.</Body>
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'setting')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}

/** The speed of sound the tools use (the calculator's, 20 °C). */
export const BROADCAST_C = C20;

const styles = StyleSheet.create({
  tick: { position: 'absolute', width: 40, textAlign: 'center', fontFamily: fonts.mono, fontSize: 9, color: colors.textMuted },
});

export type { SourcePageId };
