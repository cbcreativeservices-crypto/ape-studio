/**
 * THE FIELD REPORTER — the tool steps (Lab 7 group 3, B03; LessonArt.pages).
 * Each is a rack step (engine/steps): the display pinned above, the well
 * between, the controls docked below — FULLY SILENT, static until a control
 * changes it (D8).
 *
 *   useInterviewStep   THE ONE-MIC INTERVIEW (key 'interview'): one handheld
 *                      on the handoff path between a reporter and a guest
 *                      (fieldInterview.ts) — where it is along the path, its
 *                      pattern (the omni or a cardioid), where a cardioid
 *                      points (at the speaker or "between"), who speaks, and
 *                      a loud source the pair can be turned against; the
 *                      readings by distance and by the pattern, a simplified
 *                      picture. From above, with the side in the corner (the
 *                      shared place is at CHEST height).
 *   useReporterWindStep  WIND ON THE HANDHELD (key 'wind'): the layer (grille,
 *                      foam, fitted fur) and the place (reporterWind.ts) —
 *                      words and illustrative marks, never a level.
 */
import { useState, type ReactNode } from 'react';
import { Circle, DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { PatternId, Vec3, ViewBox } from '../../../engine/model/types.ts';
import type { MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point } from '../../../engine/kit';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import { gain } from '../../../engine/physics/polar.ts';
import { FieldStage, MicAt, Ray, uvOf } from '../field/FieldStage';
import { HeldArmArt } from './SportSpeechArt';
import { LoudSource, ReporterWindScene } from './ReporterArt';
import { aimFrom, interviewReading, noiseAt, pathPoint, type FieldPair } from './fieldInterview.ts';
import { NOT_WATERPROOF, REPORTER_COVERS, REPORTER_FILTER_LINE, REPORTER_SITES, coverVerdict, type ReporterCover, type ReporterSite } from './reporterWind.ts';

const AMBER = '#ffc64d';
const BLUE = '#8fbcff';
const RED = '#ff6b5e';
const cm = (mm: number) => (mm < 95 ? `${Math.round(mm / 5) * 5} mm` : `${Math.round(mm / 10)} cm`);
const db = (d: number) => `${d >= 0 ? '+' : '−'}${Math.abs(Math.round(d))} dB`;

/** A pattern's shape from above, round the mic at `p`, its front along the
 *  plan direction of `aim` (a first-order pattern; an omni is a circle). */
function LobeTop({ p, aim, pattern, r, px }: { p: Vec3; aim: Vec3; pattern: PatternId; r: number; px: number }) {
  const a0 = Math.atan2(aim.z, aim.x);
  const path = Skia.Path.Make();
  for (let k = 0; k <= 72; k++) {
    const th = (k / 72) * Math.PI * 2;
    const g = Math.abs(gain(pattern, (th * 180) / Math.PI));
    const u = p.x + Math.cos(a0 + th) * g * r;
    const v = p.z + Math.sin(a0 + th) * g * r;
    if (k === 0) path.moveTo(u, v);
    else path.lineTo(u, v);
  }
  path.close();
  return (
    <Group>
      <Path path={path} color="#e8eef5" opacity={0.08} />
      <Path path={path} style="stroke" strokeWidth={1.6 * px} color="#e8eef5" opacity={0.75}>
        <DashPathEffect intervals={[6 * px, 4 * px]} />
      </Path>
    </Group>
  );
}

/* ── THE ONE-MIC INTERVIEW ── */

export type InterviewSpec = {
  pair: FieldPair;
  /** The holder's shoulder (the reporter's right): the arm is drawn from it. */
  shoulder: Vec3;
  /** The scene from above and from the side (the people, the camera, the street). */
  top: (px: number) => ReactNode;
  side: (px: number) => ReactNode;
  box: ViewBox;
  sideBox: ViewBox;
  /** The two mics compared: the omni and the directional handheld (art and size). */
  omni: { art: 'flagHandheld'; r: number; len: number };
  dir: { art: 'flagHandheld'; r: number; len: number };
  words: { looking: string; prompt: string; done: string };
};

type Bearing = 'guest' | 'side' | 'reporter';
const BEARINGS: Readonly<Record<Bearing, { deg: number; label: string; blurb: string }>> = {
  guest: { deg: 0, label: 'Behind the guest', blurb: 'The loud source behind the guest — facing the reporter and the camera.' },
  side: { deg: 90, label: 'Off to the side', blurb: 'The loud source off to one side of the pair.' },
  reporter: { deg: 180, label: 'Behind the reporter', blurb: 'The pair turned round: the loud source now behind the reporter.' },
};

export function useInterviewStep(spec: InterviewSpec): MikingStep {
  const [s, setS] = useState(0.5);
  const [pattern, setPattern] = useState<'omni' | 'cardioid'>('omni');
  const [aimMode, setAimMode] = useState<'speaker' | 'between'>('speaker');
  const [who, setWho] = useState<'b' | 'a'>('b');
  const [bearing, setBearing] = useState<Bearing>('guest');
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  const mark = (k: string) => setSeen((q) => (q.has(k) ? q : new Set([...q, k])));
  const p = pathPoint(spec.pair, s);
  const aim = pattern === 'omni' ? aimFrom(spec.pair, p, who, 'between') : aimFrom(spec.pair, p, who, aimMode);
  const noise = noiseAt(spec.pair, BEARINGS[bearing].deg);
  const R = interviewReading(spec.pair, p, aim, pattern, who, noise);
  const look = pattern === 'omni' ? spec.omni : spec.dir;
  const speaker = spec.pair[who];
  const other = who === 'a' ? spec.pair.b : spec.pair.a;
  const where = s < 0.15 ? 'at the reporter’s mouth' : s > 0.85 ? 'at the guest’s mouth' : Math.abs(s - 0.5) < 0.08 ? 'shared, at chest height between them' : s < 0.5 ? 'toward the reporter' : 'toward the guest';
  const whoWord = who === 'b' ? 'the guest' : 'the reporter';
  const a11y = `From above, a reporter and a guest face to face; the ${pattern === 'omni' ? 'omni' : 'cardioid'} handheld ${where}. ${whoWord} speaks: ${cm(R.rSpeaker)} from the mic, ${Math.abs(Math.round(R.totalDb))} dB ${R.totalDb >= 0 ? 'above' : 'below'} the other voice there; the loud source ${BEARINGS[bearing].label.toLowerCase()}.`;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'at',
      label: 'MIC AT',
      value: s,
      onChange: (v) => {
        setS(v);
        if (v > 0.85) mark('atGuest');
        if (Math.abs(v - 0.5) < 0.08) mark('shared');
      },
      format: () => where,
      formatShort: () => (s < 0.15 ? 'REPORTER' : s > 0.85 ? 'GUEST' : Math.abs(s - 0.5) < 0.08 ? 'SHARED' : s < 0.5 ? '← REP' : 'GUEST →'),
    },
    {
      kind: 'options',
      id: 'pattern',
      label: 'MIC',
      valueLabel: pattern === 'omni' ? 'OMNI' : 'CARDIOID',
      selectedId: pattern,
      sticky: true,
      onSelect: (id) => {
        setPattern(id as typeof pattern);
        mark(id);
      },
      options: [
        { id: 'omni', label: 'The reporter’s omni', blurb: 'Hears every side about equally: forgiving of aim — and of the street.' },
        { id: 'cardioid', label: 'A cardioid handheld', blurb: 'Hears most in front, least behind: it must point at the speaking mouth.' },
      ],
    },
    {
      kind: 'options',
      id: 'aim',
      label: 'AIM',
      valueLabel: pattern === 'omni' ? '—' : aimMode === 'speaker' ? 'SPEAKER' : 'BETWEEN',
      selectedId: aimMode,
      sticky: true,
      onSelect: (id) => {
        setAimMode(id as typeof aimMode);
        if (id === 'between' && pattern === 'cardioid') mark('between');
      },
      options: [
        { id: 'speaker', label: 'At the speaking mouth', blurb: 'The front turned to whoever is speaking.' },
        { id: 'between', label: 'Between the two mouths', blurb: 'Pointed at the gap between them, hoping to catch both — the thing to avoid with a directional mic.' },
      ],
    },
    {
      kind: 'options',
      id: 'who',
      label: 'WHO SPEAKS',
      valueLabel: who === 'b' ? 'GUEST' : 'REPORTER',
      selectedId: who,
      sticky: true,
      onSelect: (id) => setWho(id as typeof who),
      options: [
        { id: 'b', label: 'The guest answers' },
        { id: 'a', label: 'The reporter asks' },
      ],
    },
    {
      kind: 'options',
      id: 'noise',
      label: 'LOUD SOURCE',
      valueLabel: bearing === 'guest' ? 'BEHIND G' : bearing === 'side' ? 'SIDE' : 'BEHIND R',
      selectedId: bearing,
      sticky: true,
      onSelect: (id) => {
        setBearing(id as Bearing);
        mark(`n:${id}`);
      },
      options: (Object.keys(BEARINGS) as Bearing[]).map((k) => ({ id: k, label: BEARINGS[k].label, blurb: BEARINGS[k].blurb })),
    },
  ];
  const bezel: BezelItem[] = [
    { k: 'TO SPEAKER', v: cm(R.rSpeaker), flex: 1 },
    { k: 'OVER OTHER', v: db(R.totalDb), tint: R.totalDb < 3 ? RED : undefined, flex: 1 },
    { k: 'LOUD SOURCE', v: pattern === 'omni' ? 'ALL ROUND' : db(R.noiseDb), tint: pattern === 'omni' ? undefined : R.noiseDb <= -6 ? '#5bff85' : undefined, flex: 1.1 },
  ];
  const labels: StaticLabel[] = [
    { id: 'g', text: 'GUEST', u: spec.pair.b.x - 160, v: spec.pair.b.z + 360, align: 'center', tone: who === 'b' ? 'amber' : 'muted' },
    { id: 'r', text: 'REPORTER', u: spec.pair.a.x + 160, v: spec.pair.a.z + 360, align: 'center', tone: who === 'a' ? 'amber' : 'muted' },
    { id: 'n', text: 'LOUD SOURCE', short: 'LOUD', u: noise.x, v: noise.z + (bearing === 'side' ? 420 : -420), align: 'center', tone: 'muted' },
  ];
  const done = seen.has('shared') && seen.has('atGuest') && seen.has('between');
  const verdict =
    pattern === 'omni'
      ? Math.abs(s - 0.5) < 0.08
        ? 'Shared, the omni favours neither voice — fine in a quiet place, and it needs no rushed aiming. It hears the loud source from every side just as well: being a dynamic does not make it pick out a voice.'
        : `Moved ${where}: the speaker is ${Math.round(R.distDb)} dB above the other voice by distance alone — and above the street by the same closeness. The pattern adds nothing: an omni hears all round.`
      : aimMode === 'between'
        ? `Pointed between the mouths, the cardioid serves neither: each voice arrives about ${Math.round(R.offSpeaker / 5) * 5}° off its front. Turn it to whoever is speaking.`
        : `Its front on ${whoWord}: the other voice arrives ${Math.round(R.offOther / 5) * 5}° off its front, ${Math.abs(Math.round(R.patternDb))} dB less by the pattern. A missed aim or a turned head costs the speaker the same way.`;
  return {
    key: 'interview',
    title: 'One mic, two people',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <FieldStage
          w={w}
          h={h}
          view="top"
          box={spec.box}
          a11y={a11y}
          labels={labels}
          inset={{
            view: 'side',
            box: spec.sideBox,
            at: { x: 0.6, y: 0.62, w: 0.38, h: 0.36 },
            title: 'FROM THE SIDE',
            draw: (px) => (
              <>
                {spec.side(px)}
                <HeldArmArt view="side" shoulder={spec.shoulder} p={p} aim={aim} len={look.len} dim={0.7} />
                <MicAt view="side" p={p} aim={aim} art={look.art} r={look.r} len={look.len} />
              </>
            ),
            labels: [{ id: 'sideT', text: 'FROM THE SIDE', short: 'SIDE', u: (spec.sideBox.u0 + spec.sideBox.u1) / 2, v: spec.sideBox.v0 + 90, align: 'center', tone: 'muted' }],
          }}
        >
          {(px) => (
            <>
              {spec.top(px)}
              <LoudSource view="top" c={noise} toward={{ x: (spec.pair.a.x + spec.pair.b.x) / 2, y: 0, z: (spec.pair.a.z + spec.pair.b.z) / 2 }} floor={0} />
              <Ray a={uvOf('top', noise)} b={uvOf('top', p)} px={px} color={RED} width={2} />
              <Ray a={uvOf('top', other)} b={uvOf('top', p)} px={px} color={BLUE} width={2} />
              <Ray a={uvOf('top', speaker)} b={uvOf('top', p)} px={px} color={AMBER} width={3} dash={[1000, 0]} />
              <LobeTop p={p} aim={aim} pattern={pattern} r={260} px={px} />
              <HeldArmArt view="top" shoulder={spec.shoulder} p={p} aim={aim} len={look.len} />
              <MicAt view="top" p={p} aim={aim} art={look.art} r={look.r} len={look.len} />
              <Circle cx={p.x} cy={p.z} r={5 * px} color={AMBER} />
            </>
          )}
        </FieldStage>
      ),
      badge: 'From above, the side in the corner · amber = the voice speaking, blue = the other voice, red = the loud source · white dashed = the pattern’s shape · by distance and an ideal pattern: a simplified picture · silent',
      bezel,
      params,
      initialParam: 'at',
    },
    well: (
      <>
        <Landing looking={spec.words.looking} prompt={spec.words.prompt} />
        <Card>
          <Point title="THE VOICES">{`${whoWord === 'the guest' ? 'The guest' : 'The reporter'} is ${cm(R.rSpeaker)} from the mic, the other voice ${cm(R.rOther)}: ${db(R.distDb)} by distance alone${pattern === 'omni' ? '' : `, ${db(R.patternDb)} by the pattern`} — ${db(R.totalDb)} together.`}</Point>
          <Point title={pattern === 'omni' ? 'THE OMNI' : aimMode === 'between' ? '✕ POINTED BETWEEN' : 'THE CARDIOID'}>{verdict}</Point>
          <Point title="THE LOUD SOURCE">{pattern === 'omni' ? 'An omni hears it about as well from any side: turning the pair changes little for the mic — closeness to the speaking mouth does the work. Turn the pair anyway so the bodies and the camera keep their shot, and never into the traffic.' : R.noiseDb <= -6 ? `It sits ${Math.round(R.offNoise / 5) * 5}° off the mic’s front: about ${Math.abs(Math.round(R.noiseDb))} dB less than the speaker by the pattern. Turning the pair so the loud source is behind the mic helps a directional mic.` : `It sits ${Math.round(R.offNoise / 5) * 5}° off the mic’s front — the pattern takes little off it here. Turn the pair so the loud source falls behind the mic, not in front.`}</Point>
        </Card>
        {done ? <Note tone="ok">{spec.words.done}</Note> : <Note>{'Try the shared place (MIC AT in the middle), then all the way to the guest; then a CARDIOID pointed BETWEEN them.'}</Note>}
        <Body>Distances are calculated from the drawing; levels by distance and an ideal, first-order pattern only. Real patterns change with pitch, and the street’s walls, the wind and the crowd change the real picture — listen at the program.</Body>
      </>
    ),
  };
}

/* ── WIND ON THE HANDHELD ── */

export function useReporterWindStep(spec: { words: { looking: string; prompt: string; done: string } }): MikingStep {
  const [cover, setCover] = useState<ReporterCover>('grille');
  const [site, setSite] = useState<ReporterSite>('street');
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  const v = coverVerdict(site, cover);
  const C = REPORTER_COVERS.find((q) => q.id === cover)!;
  const S = REPORTER_SITES.find((q) => q.id === site)!;
  const mark = (s0: ReporterSite, c0: ReporterCover) => setSeen((q) => new Set(q).add(`${s0}:${c0}`).add(coverVerdict(s0, c0).enough ? `${s0}:ok` : `${s0}:try`));
  const done = REPORTER_SITES.every((q) => seen.has(`${q.id}:ok`) || seen.has(`${q.id}:fur`));
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'cover',
      label: 'COVER',
      valueLabel: C.short,
      selectedId: cover,
      sticky: true,
      onSelect: (id) => {
        setCover(id as ReporterCover);
        mark(site, id as ReporterCover);
      },
      options: REPORTER_COVERS.map((q) => ({ id: q.id, label: q.label, blurb: q.what })),
    },
    {
      kind: 'options',
      id: 'site',
      label: 'PLACE',
      valueLabel: S.short,
      selectedId: site,
      sticky: true,
      onSelect: (id) => {
        setSite(id as ReporterSite);
        mark(id as ReporterSite, cover);
      },
      options: REPORTER_SITES.map((q) => ({ id: q.id, label: q.label, blurb: q.what })),
    },
  ];
  return {
    key: 'wind',
    title: 'Wind on the handheld',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <ReporterWindScene w={w} h={h} cover={cover} site={site} accessibilityLabel={`The reporter’s handheld, ${C.label.toLowerCase()}, ${S.label.toLowerCase()}. ${v.words}`} />,
      badge: 'Close up, from the side · the air from the left · the curls at the capsule = wind there, drawn larger: never a level · silent',
      bezel: [
        { k: 'PLACE', v: S.short, flex: 1.1 },
        { k: 'COVER', v: C.short, flex: 0.9 },
        { k: 'AT THE CAPSULE', v: v.marks === 0 ? 'STILL' : v.marks === 1 ? 'SOME WIND' : 'BUFFETING', tint: v.marks >= 2 ? RED : undefined, flex: 1.3 },
      ],
      params,
      initialParam: 'cover',
    },
    well: (
      <>
        <Landing looking={`${spec.words.looking} · ${S.label}`} prompt={spec.words.prompt} />
        <Card>
          <Point title={C.label.toUpperCase()}>{C.what}</Point>
          <Body>{v.words}</Body>
        </Card>
        <Note>{REPORTER_FILTER_LINE}</Note>
        <Note tone="warn">{NOT_WATERPROOF}</Note>
        {done ? <Note tone="ok">{spec.words.done}</Note> : <Note>Add the layers one at a time with COVER, then change PLACE and see what each one needs.</Note>}
      </>
    ),
  };
}
