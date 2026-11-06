/**
 * SPEECH IN SPORT — the tool steps (Lab 7b group 1; LessonArt.pages). Built
 * once for B09, B10, B11; B17 may reuse the feeds step. Each is a rack step
 * (engine/steps): the display pinned above, the well between, the controls
 * docked below — FULLY SILENT, static until a control changes it (D8).
 *
 *   useFeedsStep    WHERE EACH MIC GOES (key 'path'): Lab 7's RoutingPanel
 *                   on a FEED STATE (feeds.ts) — the mic key (on air, cough,
 *                   talkback), the return (mix-minus or the whole program),
 *                   the crowd bed's own channel, an official's announcement
 *                   mic; the officials' PRIVATE circuit drawn closed under
 *                   the panel — a request to put it on air is refused.
 *   useSpillStep    THE PARTNER'S VOICE (key 'spill'): the booth from above
 *                   (boothPlan.ts, the minimal plan canvas): which mic, which
 *                   side the boom sits, the seats' gap, the partner's turn —
 *                   the partner's voice at this mic by distance and pattern.
 *   useHandoffStep  THE HANDOFF (key 'handoff'): one handheld between a
 *                   reporter and a guest (handoff.ts) — where the mic is,
 *                   who speaks, the timeline strip (question → move → pause
 *                   → answer) and what a late move costs.
 *   useBodyStep     A BODY MIC, FRONT AND SIDE (key 'body'): frame T
 *                   (standing.ts) — the wearer (coach, official, athlete),
 *                   the mic's place, the pack, the cable's loop, the antenna,
 *                   the keep-outs; the head turn's change at a chest mic
 *                   against a headset, seen from above in the corner.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import { colors, fonts } from '../../../../../../theme/tokens';
import { fitValue } from '../../../../../../theme/legibility';
import type { MicArtId, PatternId, Vec3, ViewBox } from '../../../engine/model/types.ts';
import type { MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point } from '../../../engine/kit';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import { PlayerBehind, PlayerInFront } from '../players/PlayerFigure';
import { SINGER_SIDE } from '../voice/voicePose.ts';
import { Dim, FieldStage, MicAt, Ray, fieldXform, uvOf, type FieldInset } from '../field/FieldStage';
import { DESTINATIONS, problemWords, type DestId } from './routing.ts';
import { RoutingPanel, type SourceLook } from './RoutingPanel';
import { BODY_CHAIN, FEED_HOME, KEY_WORDS, PRIVATE_REFUSED, feedPlan, feedProblemWords, feedProblems, type FeedSpec, type FeedState } from './feeds.ts';
import { boothSpill, partnerAt, partnerMouth } from './boothPlan.ts';
import { HANDOFF_EARLY, HANDOFF_LATE, HANDOFF_ON_TIME, between, betweenDrop, clippedQuestion, handoffOk, levelDb, lostSyllables, type Handoff } from './handoff.ts';
import { TORSO, TORSO_FRONT, bodyWornChain, chestVsHeadset, frontUV, keepOutsOf, type Wearer } from './standing.ts';
import { HOST, TURN_PIVOT, turnHead } from './talkerPose.ts';
import { withHead } from './bodyWorn.ts';
import { TurnedHeadTop } from './BroadcastArt';
import { HeadsetFrame } from './BodyWornArt';
import { BodyChain, HeadsetOnHead, HeldArmArt, KeepOutRegion, PlaceRing, RoleTag, StandingTalker } from './SportSpeechArt';

const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return v3(a.x / l, a.y / l, a.z / l);
};
const sub = (a: Vec3, b: Vec3): Vec3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const cm = (mm: number) => (mm < 95 ? `${Math.round(mm / 5) * 5} mm` : `${Math.round(mm / 10)} cm`);
const db0 = (d: number) => `${Math.abs(d) < 0.5 ? 0 : Math.round(d)} dB`;
const LIP = v3(0, 0, 0);

/* ── WHERE EACH MIC GOES (the feed state) ── */

export type FeedControl = 'key' | 'ret' | 'crowd' | 'official' | 'priv';
export type FeedsSpec = {
  feed: FeedSpec;
  looks: Readonly<Record<string, SourceLook>>;
  controls: readonly FeedControl[];
  /** The officials' private circuit, drawn closed under the panel. */
  privateCircuit?: { label: string };
  words: { looking: string; prompt: string; done: string };
  points: readonly { title: string; text: string }[];
  /** Show the body-worn chain (mic → transmitter → … → the approved path). */
  chain?: boolean;
};

/** The officials' closed circuit: two headsets on beltpacks, joined to each
 *  other and nothing else, a lock on the loop; red when a request to put it
 *  on air was refused. One labelled image. */
function PrivateCircuitStrip({ w, h, label, refused }: { w: number; h: number; label: string; refused: boolean }) {
  const p = useMemo(() => {
    const loop = Skia.Path.Make();
    loop.addRRect(Skia.RRectXY(Skia.XYWHRect(w * 0.12, h * 0.25, w * 0.5, h * 0.5), h * 0.25, h * 0.25));
    const packs = Skia.Path.Make();
    for (const x of [0.12, 0.62]) packs.addRRect(Skia.RRectXY(Skia.XYWHRect(w * x - 16, h * 0.5 - 20, 32, 40), 6, 6));
    const shackle = Skia.Path.Make();
    shackle.moveTo(w * 0.37 - 9, h * 0.25 - 2);
    shackle.lineTo(w * 0.37 - 9, h * 0.25 - 14);
    shackle.cubicTo(w * 0.37 - 9, h * 0.25 - 26, w * 0.37 + 9, h * 0.25 - 26, w * 0.37 + 9, h * 0.25 - 14);
    shackle.lineTo(w * 0.37 + 9, h * 0.25 - 2);
    return { loop, packs, shackle };
  }, [w, h]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={`${label}: a closed loop between the officials’ own headsets, outside the mixer. ${refused ? 'A request to put it on air was refused.' : 'It reaches nothing on air.'}`}>
        <RoundedRect x={2} y={2} width={w - 4} height={h - 4} r={10} color="#0d0f13" />
        <Path path={p.loop} style="stroke" strokeWidth={4} color={refused ? '#ff6b5e' : '#8a8f99'}>
          <DashPathEffect intervals={[10, 6]} />
        </Path>
        <Path path={p.packs} color="#3a3d45" />
        <Path path={p.packs} style="stroke" strokeWidth={2} color="#060607" />
        <Path path={p.shackle} style="stroke" strokeWidth={4} color="#c9ced8" />
        <RoundedRect x={w * 0.37 - 13} y={h * 0.25 - 4} width={26} height={20} r={4} color="#c9ced8" />
        {refused ? <Line p1={vec(w * 0.66, h * 0.5)} p2={vec(w * 0.8, h * 0.5)} color="#ff6b5e" strokeWidth={4} /> : null}
      </Canvas>
      <Text style={[styles.strip, { left: w * 0.66, top: h * 0.08, width: w * 0.33, color: refused ? '#ff6b5e' : colors.textPrimary }]} {...fitValue(10)}>
        {refused ? '✕ REFUSED' : 'CLOSED'}
      </Text>
      <Text style={[styles.strip, { left: w * 0.66, top: h * 0.4, width: w * 0.33, color: colors.textMuted }]} {...fitValue(9)}>
        PRIVATE CIRCUIT
      </Text>
      <Text style={[styles.strip, { left: w * 0.66, top: h * 0.66, width: w * 0.33, color: colors.textMuted }]} {...fitValue(9)}>
        NEVER ON AIR
      </Text>
    </View>
  );
}

export function useFeedsStep(spec: FeedsSpec): MikingStep {
  const [s, setS] = useState<FeedState>(FEED_HOME);
  const [trace, setTrace] = useState(spec.feed.commentators[0]?.id ?? spec.feed.official?.id ?? '');
  const [flipped, setFlipped] = useState(false);
  const plan = useMemo(() => feedPlan(spec.feed, s), [spec.feed, s]);
  const problems = feedProblems(spec.feed, s);
  const panelProblems = problems.filter((p) => p.code !== 'lateSelf' && p.code !== 'offAir') as Parameters<typeof RoutingPanel>[0]['problems'];
  const drawnProblems = [...panelProblems, ...problems.filter((p) => p.code === 'lateSelf').map(() => ({ code: 'missing' as const, dest: 'ifb' as DestId, source: '' }))];
  const src = plan.sources.find((q) => q.id === trace) ?? plan.sources[0];
  const reached = plan.dests.filter((d) => plan.sends[src.id]?.includes(d));
  const refused = s.priv === 'tryAir';
  // A switch acts on one source: the panel lights only the traced source, so
  // the trace follows the switch and the route's change shows at once.
  const set = (patch: Partial<FeedState>, source?: string) => {
    setS((q) => ({ ...q, ...patch }));
    setFlipped(true);
    if (source) setTrace(source);
  };
  const opt = <T extends string>(id: FeedControl, label: string, value: T, options: readonly { id: T; label: string; blurb: string }[], on: (v: T) => void): DockParam => ({
    kind: 'options',
    id: `f.${id}`,
    label,
    valueLabel: (options.find((o) => o.id === value)?.label ?? '').toUpperCase().slice(0, 10),
    selectedId: value,
    onSelect: (v) => on(v as T),
    sticky: true,
    options: options.map((o) => ({ id: o.id, label: o.label, blurb: o.blurb })),
  });
  const first = spec.feed.commentators[0];
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'trace',
      label: 'TRACE',
      valueLabel: src.short.slice(0, 10),
      selectedId: trace,
      onSelect: setTrace,
      sticky: true,
      options: plan.sources.map((q) => ({ id: q.id, label: q.label, blurb: `Light every destination ${q.label.toLowerCase()} reaches.` })),
    },
    ...(spec.controls.includes('key') && first
      ? [opt('key', 'MIC KEY', s.key, [{ id: 'onAir', label: 'On air', blurb: KEY_WORDS.onAir }, { id: 'cough', label: 'Cough', blurb: KEY_WORDS.cough }, { id: 'talkback', label: 'Talkback', blurb: KEY_WORDS.talkback }] as const, (v) => set({ key: v }, first.id))]
      : []),
    ...(spec.controls.includes('ret')
      ? [opt('ret', 'RETURN', s.ret, [{ id: 'mixMinus', label: 'Mix-minus', blurb: 'The program without the commentators’ own voices: their own mics come back to them locally, never late.' }, { id: 'full', label: 'Full mix', blurb: 'The whole program comes back, their own voices included — late, through the chain.' }] as const, (v) => set({ ret: v }, spec.feed.commentators.some((c) => c.id === trace) ? trace : first?.id))]
      : []),
    ...(spec.controls.includes('crowd') && spec.feed.crowd
      ? [opt('crowd', 'CROWD', s.crowd, [{ id: 'own', label: 'Separate', blurb: 'The crowd bed on its own channel into the program, added on purpose.' }, { id: 'none', label: 'Not routed', blurb: 'The crowd mics are not in the program: only what the commentary mics happen to hear.' }] as const, (v) => set({ crowd: v }, spec.feed.crowd?.id))]
      : []),
    ...(spec.controls.includes('official') && spec.feed.official
      ? [opt('official', 'OFFICIAL MIC', s.official, [{ id: 'off', label: 'Off', blurb: 'The announcement mic muted between announcements.' }, { id: 'pa', label: 'To the PA', blurb: 'Opened on purpose for an announcement: the crowd hears it on the PA.' }, { id: 'paProgram', label: 'PA + air', blurb: 'Also split to the broadcast — only with explicit permission for that split.' }] as const, (v) => set({ official: v }, spec.feed.official?.id))]
      : []),
    ...(spec.controls.includes('priv') && spec.privateCircuit
      ? [opt('priv', 'PRIVATE', s.priv, [{ id: 'closed', label: 'Closed', blurb: 'The officials’ private circuit on its own approved route.' }, { id: 'tryAir', label: 'Put on air', blurb: 'Ask the tool to open the private circuit into the program. It will refuse.' }] as const, (v) => set({ priv: v }))]
      : []),
  ];
  const nProblems = problems.length;
  const bezel: BezelItem[] = [
    { k: 'TRACING', v: src.short, flex: 1.2 },
    { k: 'REACHES', v: `${reached.length}`, flex: 0.8 },
    { k: 'PROBLEMS', v: `${nProblems}`, tint: nProblems ? '#ff6b5e' : '#5bff85', flex: 0.9 },
    ...(spec.privateCircuit ? [{ k: 'PRIVATE', v: refused ? 'REFUSED' : 'CLOSED', tint: refused ? '#ff6b5e' : undefined, flex: 1 }] : []),
  ];
  const a11y = `A signal-flow drawing: ${plan.sources.length} sources into the mixer, ${plan.dests.length} destinations out of it. Tracing ${src.label}: it reaches ${reached.map((d) => DESTINATIONS[d].label).join(', ') || 'nothing'}. ${nProblems ? `${nProblems} routing problem${nProblems > 1 ? 's' : ''}.` : 'No routing problems.'}`;
  return {
    key: 'path',
    title: 'Where each mic goes',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => {
        const ph = spec.privateCircuit ? Math.max(64, Math.round(h * 0.2)) : 0;
        return (
          <View style={{ width: w, height: h }}>
            <RoutingPanel w={w} h={h - ph} plan={plan} trace={src.id} problems={drawnProblems} looks={spec.looks} a11y={a11y} />
            {spec.privateCircuit ? <PrivateCircuitStrip w={w} h={ph} label={spec.privateCircuit.label} refused={refused} /> : null}
          </View>
        );
      },
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
          {spec.controls.includes('key') && first ? <Point title="THE KEY">{KEY_WORDS[s.key]}</Point> : null}
          {problems.length ? (
            problems.map((p, i) => (
              <Point key={`${p.code}${i}`} title="✕ PROBLEM">
                {feedProblemWords(spec.feed, plan, p, problemWords)}
              </Point>
            ))
          ) : (
            <Point title="NO ROUTING PROBLEMS">Each feed carries what its listeners need, and nobody hears themselves come back late.</Point>
          )}
          {refused ? <Point title="✕ REFUSED">{PRIVATE_REFUSED}</Point> : null}
        </Card>
        {flipped && !nProblems && !refused ? <Note tone="ok">{spec.words.done}</Note> : null}
        {spec.chain ? (
          <Card>
            {BODY_CHAIN.map((c, i) => (
              <Point key={c.id} title={`${i + 1} · ${c.label}`}>
                {c.words}
              </Point>
            ))}
          </Card>
        ) : null}
        <Card>
          {spec.points.map((b) => (
            <Point key={b.title} title={b.title}>
              {b.text}
            </Point>
          ))}
        </Card>
      </>
    ),
  };
}

/* ── THE PARTNER'S VOICE (the booth from above) ── */

export type SpillMic = { id: string; label: string; short: string; p: Vec3; art: MicArtId; r: number; len: number; pattern: PatternId; /** Mirror its place across the mouth's axis (the boom on the other side). */ side?: boolean };
export type SpillSpec = {
  mics: readonly SpillMic[];
  /** The booth from above, around commentator A at the origin and the
   *  partner `gap` mm to their right (frame V on A). */
  top: (gap: number, px: number, mic: SpillMic) => ReactNode;
  box: (gap: number) => ViewBox;
  words: { looking: string; prompt: string; done: string };
};

const GAPS = [600, 900, 1200, 1500] as const;
const TURNS = [0, -30, -45] as const;

export function useSpillStep(spec: SpillSpec): MikingStep {
  const [micId, setMic] = useState(spec.mics[0].id);
  const [far, setFar] = useState(false);
  const [gap, setGap] = useState(900);
  const [turn, setTurn] = useState(0);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set([spec.mics[0].id]));
  const m0 = spec.mics.find((q) => q.id === micId) ?? spec.mics[0];
  const m = m0.side && far ? { ...m0, p: v3(m0.p.x, m0.p.y, -m0.p.z) } : m0;
  const aim = unit(sub(LIP, m.p));
  const partner = partnerAt(gap);
  const pm = partnerMouth(partner, turn);
  const S = boothSpill(m.p, aim, LIP, pm, m.pattern);
  const nearNull = S.patternDb == null || S.patternDb > 25;
  const box = spec.box(gap);
  const tw = turn === 0 ? 'facing the field' : `turned ${-turn}° toward the other commentator`;
  const a11y = `From above, two commentators side by side at a desk, ${Math.round(gap / 10)} cm apart. The partner is ${tw}. ${m.label}: ${cm(S.own)} from its own commentator’s lips, ${cm(S.partner)} from the partner’s, ${Math.round(S.offAxis / 5) * 5}° off its front. The partner arrives about ${Math.round(S.distDb)} dB lower by distance${nearNull ? ', near the ideal pattern’s null' : `, ${Math.round(S.patternDb ?? 0)} dB by the pattern`}.`;
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'mic',
      label: 'MIC',
      valueLabel: m0.short.slice(0, 10),
      selectedId: micId,
      onSelect: (id) => {
        setMic(id);
        setSeen((q) => (q.has(id) ? q : new Set([...q, id])));
      },
      sticky: true,
      options: spec.mics.map((q) => ({ id: q.id, label: q.label })),
    },
    ...(m0.side
      ? [
          {
            kind: 'options' as const,
            id: 'side',
            label: 'BOOM SIDE',
            valueLabel: far ? 'AWAY' : 'TOWARD',
            selectedId: far ? 'away' : 'toward',
            onSelect: (id: string) => setFar(id === 'away'),
            sticky: true,
            options: [
              { id: 'toward', label: 'On the partner’s side', blurb: 'The boom on the side the partner sits: the partner is behind the capsule.' },
              { id: 'away', label: 'Away from the partner', blurb: 'The boom on the far side: the partner is more in front of the capsule.' },
            ],
          },
        ]
      : []),
    {
      kind: 'options',
      id: 'turn',
      label: 'PARTNER',
      valueLabel: turn === 0 ? 'AHEAD' : `${-turn}° TURN`,
      selectedId: `${turn}`,
      onSelect: (id) => setTurn(Number(id)),
      sticky: true,
      options: TURNS.map((t) => ({ id: `${t}`, label: t === 0 ? 'Facing the field' : `Turned ${-t}° toward you`, blurb: t === 0 ? 'Calling the play.' : 'Turning to talk to the other commentator.' })),
    },
    {
      kind: 'options',
      id: 'gap',
      label: 'SEATS',
      valueLabel: `${(gap / 1000).toFixed(1)} m`,
      selectedId: `${gap}`,
      onSelect: (id) => setGap(Number(id)),
      sticky: true,
      options: GAPS.map((g) => ({ id: `${g}`, label: `${(g / 1000).toFixed(1)} m apart`, blurb: g === 900 ? 'The drawing’s booth.' : 'Seats moved.' })),
    },
  ];
  const bezel: BezelItem[] = [
    { k: 'OWN', v: cm(S.own), flex: 0.8 },
    { k: 'PARTNER', v: cm(S.partner), flex: 0.9 },
    { k: 'BY DISTANCE', v: `−${Math.round(S.distDb)} dB`, flex: 1 },
    // An ideal null's depth is an artefact (Kick review M3): past 25 dB the
    // bezel says NULL, never a number.
    { k: 'BY PATTERN', v: nearNull ? 'NULL (IDEAL)' : `${(S.patternDb ?? 0) >= 0 ? '−' : '+'}${Math.abs(Math.round(S.patternDb ?? 0))} dB`, flex: 1 },
  ];
  const labels: StaticLabel[] = [
    { id: 'own', text: 'YOU', u: -260, v: -330, align: 'center', tone: 'amber' },
    { id: 'pt', text: 'PARTNER', u: -260, v: gap + 330, align: 'center', tone: 'muted' },
    { id: 'field', text: 'THE FIELD', u: box.u1 - 60, v: box.v0 + 90, align: 'right', tone: 'muted' },
  ];
  return {
    key: 'spill',
    title: 'The partner’s voice',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <FieldStage w={w} h={h} view="top" box={box} a11y={a11y} labels={labels}>
          {(px) => (
            <>
              {spec.top(gap, px, m)}
              <Ray a={uvOf('top', pm)} b={uvOf('top', m.p)} px={px} color="#8fbcff" width={2.4} />
              <Ray a={uvOf('top', LIP)} b={uvOf('top', m.p)} px={px} color="#ffc64d" width={3} dash={[1000, 0]} />
              <MicAt view="top" p={m.p} aim={aim} art={m.art} r={m.r} len={m.len} />
              <Dim a={uvOf('top', pm)} b={uvOf('top', m.p)} px={px} color="#8fbcff" />
            </>
          )}
        </FieldStage>
      ),
      badge: 'From above · amber = your voice, blue = the partner’s · point mouths, free field: a simplified picture · silent',
      bezel,
      params,
      initialParam: 'mic',
    },
    well: (
      <>
        <Landing looking={spec.words.looking} prompt={spec.words.prompt} />
        <Card>
          <Point title="BY DISTANCE">{`Your lips ${cm(S.own)} from the mic, the partner’s ${cm(S.partner)}: the partner arrives about ${Math.round(S.distDb)} dB lower by distance alone (20·log of the ratio).`}</Point>
          <Point title="BY PATTERN">{nearNull ? `The partner sits about ${Math.round(S.offAxis / 5) * 5}° off the mic’s front — at or near the ideal pattern’s null, where the drawing promises more than 25 dB. A real mic in a real booth rejects far less there, least in the lows, and reflections come round any null.` : `The partner sits about ${Math.round(S.offAxis / 5) * 5}° off the mic’s front: the ideal pattern takes about ${Math.abs(Math.round(S.patternDb ?? 0))} dB ${(S.patternDb ?? 0) >= 0 ? 'more off' : 'LESS off — the partner is nearer its front than you'}.`}</Point>
          <Point title="TOGETHER">{nearNull ? `By distance alone about ${Math.round(S.distDb)} dB; the pattern adds more on paper. In the booth the partner never vanishes: check each mic alone while the other commentator talks.` : `About ${Math.round(S.totalDb ?? S.distDb)} dB between your voice and your partner’s in your mic — a calculated, simplified number. Listen to each channel alone while the other talks.`}</Point>
        </Card>
        {seen.size >= Math.min(2, spec.mics.length) ? <Note tone="ok">{spec.words.done}</Note> : null}
      </>
    ),
  };
}

/* ── THE HANDOFF ── */

export type HandoffSpec = {
  reporter: Vec3;
  guest: Vec3;
  /** The mic's front at the reporter's and at the guest's mouth (frame V on the guest). */
  atReporter: Vec3;
  atGuest: Vec3;
  look: { art: MicArtId; r: number; len: number };
  /** The holder's shoulder (the reporter's): the arm is drawn from it. */
  shoulder: Vec3;
  top: (px: number) => ReactNode;
  box: ViewBox;
  words: { looking: string; prompt: string; done: string };
};

const TIMINGS: Readonly<Record<'onTime' | 'late' | 'early', { h: Handoff; label: string; blurb: string }>> = {
  onTime: { h: HANDOFF_ON_TIME, label: 'Moved, then a pause', blurb: 'The question ends, the mic moves, a short pause — the answer starts at the guest’s mouth.' },
  late: { h: HANDOFF_LATE, label: 'Moved late', blurb: 'The guest starts answering before the mic arrives.' },
  early: { h: HANDOFF_EARLY, label: 'Moved early', blurb: 'The mic leaves before the question has ended.' },
};

/** The strip's height: drawn under the top view, inside the display. */
const STRIP_H = 84;
/** A display too short for both (the phone on its side): the strip goes beside
 *  the top view, so the people and the mic stay in the picture. */
const STAGE_MIN_H = 120;
const STRIP_BESIDE_W = 330;

/** The strip: the speech along the track (the question, then the answer), the
 *  mic's line stepping from the reporter's lane to the guest's across its
 *  move, and in red the words heard from the wrong mouth's distance. Read only. */
export function HandoffStrip({ w, h, t }: { w: number; h: number; t: Handoff }) {
  const T = 10;
  const x = (s: number) => 8 + (s / T) * (w - 16);
  const late = lostSyllables(t);
  const early = clippedQuestion(t);
  const BAR = 20;
  const y0 = 4;
  const y1 = y0 + BAR + 14;
  const atReporter = y0 + BAR + 2;
  const atGuest = y1 - 2;
  const arrives = t.moveStart + t.moveDur;
  const mic = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(x(0), atReporter);
    p.lineTo(x(t.moveStart), atReporter);
    p.lineTo(x(arrives), atGuest);
    p.lineTo(x(T), atGuest);
    return p;
  }, [w, t]); // eslint-disable-line react-hooks/exhaustive-deps
  const lost = late > 0 ? `${late.toFixed(1)} s OF THE ANSWER LOST` : early > 0 ? `${early.toFixed(1)} s OF THE QUESTION LOST` : 'NO WORDS LOST';
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={`A timeline: the question until ${t.questionEnd} s, the mic moves from ${t.moveStart} s for ${t.moveDur} s, the answer from ${t.answerStart} s. ${late > 0 ? `The first ${late.toFixed(1)} s of the answer are heard from the reporter’s side.` : early > 0 ? `The last ${early.toFixed(1)} s of the question are heard from the guest’s side.` : 'The mic arrives before the answer.'}`}>
        <RoundedRect x={0} y={0} width={w} height={h} r={0} color="#0d0f13" />
        <RoundedRect x={x(0)} y={y0} width={x(t.questionEnd) - x(0)} height={BAR} r={4} color="#44618a" />
        <RoundedRect x={x(t.answerStart)} y={y1} width={x(t.answerEnd) - x(t.answerStart)} height={BAR} r={4} color="#3f7350" />
        {late > 0 ? <RoundedRect x={x(t.answerStart)} y={y1} width={x(t.answerStart + late) - x(t.answerStart)} height={BAR} r={4} color="#ff6b5e" /> : null}
        {early > 0 ? <RoundedRect x={x(t.moveStart)} y={y0} width={x(t.questionEnd) - x(t.moveStart)} height={BAR} r={4} color="#ff6b5e" /> : null}
        <Path path={mic} style="stroke" strokeWidth={3} strokeJoin="round" strokeCap="round" color="#ffc64d" />
        <Circle cx={x(arrives)} cy={atGuest} r={5} color="#ffc64d" />
      </Canvas>
      <Text style={[styles.tick, { left: x(0) + 5, top: y0 + 4 }]} {...fitValue(9)}>
        QUESTION
      </Text>
      <Text style={[styles.tick, { left: x(t.answerStart + late) + 5, top: y1 + 4 }]} {...fitValue(9)}>
        ANSWER
      </Text>
      <Text style={[styles.tick, { left: x(0), top: y1 + BAR + 5, width: w * 0.4, color: '#ffc64d' }]} {...fitValue(9)}>
        {`MIC MOVES AT ${t.moveStart} s`}
      </Text>
      <Text style={[styles.tick, { right: 8, top: y1 + BAR + 5, width: w * 0.55, textAlign: 'right', color: late > 0 || early > 0 ? '#ff6b5e' : '#5bff85' }]} {...fitValue(9)}>
        {lost}
      </Text>
    </View>
  );
}

export function useHandoffStep(spec: HandoffSpec): MikingStep {
  const [at, setAt] = useState<'reporter' | 'between' | 'guest'>('guest');
  const [who, setWho] = useState<'guest' | 'reporter'>('guest');
  const [timing, setTiming] = useState<'onTime' | 'late' | 'early'>('onTime');
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set(['guest']));
  const mid = between(spec.reporter, spec.guest);
  const micP = at === 'guest' ? spec.atGuest : at === 'reporter' ? spec.atReporter : v3(mid.x + 60, mid.y + 40, mid.z);
  const speaker = who === 'guest' ? spec.guest : spec.reporter;
  const other = who === 'guest' ? spec.reporter : spec.guest;
  const aim = unit(sub(at === 'between' ? speaker : at === 'guest' ? spec.guest : spec.reporter, micP));
  const dS = Math.hypot(micP.x - speaker.x, micP.y - speaker.y, micP.z - speaker.z);
  const lv = levelDb(micP, speaker, other);
  const close = Math.hypot(spec.atGuest.x - spec.guest.x, spec.atGuest.y - spec.guest.y, spec.atGuest.z - spec.guest.z);
  const midD = Math.hypot(mid.x - spec.guest.x, mid.y - spec.guest.y, mid.z - spec.guest.z);
  const drop = betweenDrop(close, midD);
  const T = TIMINGS[timing].h;
  const ok = handoffOk(T);
  const a11y = `From above, a reporter and a guest side by side; the handheld ${at === 'between' ? 'left between them' : `at the ${at}’s mouth`}. The ${who} is speaking: ${cm(dS)} from the mic, about ${Math.abs(Math.round(lv))} dB ${lv >= 0 ? 'louder' : 'quieter'} there than the other voice.`;
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'at',
      label: 'MIC AT',
      valueLabel: at.toUpperCase(),
      selectedId: at,
      onSelect: (id) => {
        setAt(id as typeof at);
        setSeen((q) => (q.has(id) ? q : new Set([...q, id])));
      },
      sticky: true,
      options: [
        { id: 'guest', label: 'At the guest’s mouth', blurb: 'Moved to the guest, aimed at their mouth.' },
        { id: 'between', label: 'Left between them', blurb: 'Halfway between the two mouths — the thing to avoid.' },
        { id: 'reporter', label: 'At the reporter’s mouth', blurb: 'Back with the reporter for the next question.' },
      ],
    },
    {
      kind: 'options',
      id: 'who',
      label: 'WHO SPEAKS',
      valueLabel: who.toUpperCase(),
      selectedId: who,
      onSelect: (id) => setWho(id as typeof who),
      sticky: true,
      options: [
        { id: 'guest', label: 'The guest answers' },
        { id: 'reporter', label: 'The reporter asks' },
      ],
    },
    {
      kind: 'options',
      id: 'timing',
      label: 'TIMING',
      valueLabel: timing === 'onTime' ? 'ON TIME' : timing.toUpperCase(),
      selectedId: timing,
      onSelect: (id) => setTiming(id as typeof timing),
      sticky: true,
      options: (Object.keys(TIMINGS) as (keyof typeof TIMINGS)[]).map((k) => ({ id: k, label: TIMINGS[k].label, blurb: TIMINGS[k].blurb })),
    },
  ];
  const bezel: BezelItem[] = [
    { k: 'TO SPEAKER', v: cm(dS), flex: 1 },
    { k: 'OVER OTHER', v: `${lv >= 0 ? '+' : '−'}${db0(Math.abs(lv))}`, tint: lv < 3 ? '#ff6b5e' : undefined, flex: 1 },
    { k: 'HANDOFF', v: ok ? 'ON TIME' : 'WORDS LOST', tint: ok ? '#5bff85' : '#ff6b5e', flex: 1.1 },
  ];
  const labels: StaticLabel[] = [
    { id: 'g', text: 'GUEST', u: spec.guest.x - 160, v: spec.guest.z + 330, align: 'center', tone: who === 'guest' ? 'amber' : 'muted' },
    { id: 'r', text: 'REPORTER', u: spec.reporter.x - 160, v: spec.reporter.z - 330, align: 'center', tone: who === 'reporter' ? 'amber' : 'muted' },
  ];
  const draw = (px: number) => (
    <>
      {spec.top(px)}
      <Ray a={uvOf('top', speaker)} b={uvOf('top', micP)} px={px} color="#ffc64d" width={3} dash={[1000, 0]} />
      <Ray a={uvOf('top', other)} b={uvOf('top', micP)} px={px} color="#8fbcff" width={2} />
      <MicAt view="top" p={micP} aim={aim} art={spec.look.art} r={spec.look.r} len={spec.look.len} />
      <HeldArmArt view="top" shoulder={spec.shoulder} p={micP} aim={aim} len={spec.look.len} />
    </>
  );
  return {
    key: 'handoff',
    title: 'The handoff',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) =>
        h - STRIP_H < STAGE_MIN_H ? (
          <View style={{ width: w, height: h, flexDirection: 'row' }}>
            <FieldStage w={w - STRIP_BESIDE_W} h={h} view="top" box={spec.box} a11y={a11y} labels={labels}>
              {draw}
            </FieldStage>
            <HandoffStrip w={STRIP_BESIDE_W} h={h} t={T} />
          </View>
        ) : (
          <View style={{ width: w, height: h }}>
            <FieldStage w={w} h={h - STRIP_H} view="top" box={spec.box} a11y={a11y} labels={labels}>
              {draw}
            </FieldStage>
            <HandoffStrip w={w} h={STRIP_H} t={T} />
          </View>
        ),
      badge: 'From above · amber = the voice speaking, blue = the other voice · by distance alone: a simplified picture · silent',
      bezel,
      params,
      initialParam: 'at',
    },
    well: (
      <>
        <Landing looking={spec.words.looking} prompt={spec.words.prompt} />
        <Card>
          <Point title={`${who === 'guest' ? 'THE GUEST' : 'THE REPORTER'} AT THE MIC`}>{`${cm(dS)} from the mic; the other voice is about ${Math.abs(Math.round(lv))} dB ${lv >= 0 ? 'lower' : 'HIGHER'} there by distance — ${lv >= 6 ? 'the speaker clearly ahead' : 'not much between them: the crowd and the other voice come up with it'}.`}</Point>
          <Point title="LEFT BETWEEN THEM">{`A mic left halfway hears the guest about ${Math.round(drop)} dB lower than a mic moved to their mouth — and turning up the gain raises the crowd by the same amount.`}</Point>
          <Point title={ok ? 'THE HANDOFF' : '✕ THE HANDOFF'}>{ok ? 'The question ends, the mic moves, a short pause: the answer’s first words land at the guest’s mouth. Then the mic goes back before the next question.' : lostSyllables(T) > 0 ? `The answer starts before the mic arrives: its first ${lostSyllables(T).toFixed(1)} s are heard from the wrong mouth’s distance — the first words of an answer are often the ones that matter.` : `The mic left before the question ended: its last ${clippedQuestion(T).toFixed(1)} s are heard from the guest’s side.`}</Point>
        </Card>
        {seen.has('between') && seen.size >= 3 ? <Note tone="ok">{spec.words.done}</Note> : null}
        <Body>Distances are calculated from the drawing and the levels by distance alone — the crowd, the wind and the mic’s pattern change the real picture. A pattern cannot make up for a mic left far from the mouth.</Body>
      </>
    ),
  };
}

/* ── A BODY MIC, FRONT AND SIDE (frame T) ── */

export type BodySpec = {
  wearers: readonly Wearer[];
  words: { looking: string; prompt: string; done: string; wearer: Readonly<Record<Wearer, string>> };
};

const FRONT_BOX: ViewBox = { u0: -470, u1: 470, v0: -320, v1: 1640 };
const SIDE_BOX: ViewBox = { u0: -560, u1: 380, v0: -320, v1: 1640 };
/** The corner view from above: the head and the chest, close in. */
const ABOVE_BOX: ViewBox = { u0: -290, u1: 170, v0: -200, v1: 200 };
/** The role tag's place: the torso's middle, between the chest mic and the belt. */
const TAG_V = (TORSO.sternum.y + TORSO.beltFront.y) / 2 + 60;
const TAG_SIDE_U = (TORSO.beltFront.x + TORSO.smallOfBack.x) / 2;
/** A figure drawn smaller than this (px per mm: a short display) is narrower
 *  than its tag: the tag sits beside it, clear of the mic and the torso. */
const TAG_ON_FIGURE_S = 0.11;
const TAG_BESIDE_PX = 58;

export function useBodyStep(spec: BodySpec): MikingStep {
  const [who, setWho] = useState<Wearer>(spec.wearers[0]);
  const [view, setView] = useState<'front' | 'side'>('front');
  const [at, setAt] = useState<'chest' | 'headset'>('chest');
  const [yaw, setYaw] = useState(0);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set([`${spec.wearers[0]}`]));
  const chain = bodyWornChain(at);
  const kos = keepOutsOf(who);
  const cmp = chestVsHeadset(yaw, 0, turnHead);
  const uvF = (p: Vec3) => frontUV(p);
  const uvS = (p: Vec3) => ({ u: p.x, v: p.y });
  const uv = view === 'front' ? uvF : uvS;
  const mic = uv(chain.mic);
  // From above: the mouth goes round with the head; the chest mic stays on the
  // chest, the headset's boom goes round with the head.
  const mouth = turnHead(yaw, 0).mouth;
  const worn = at === 'chest' ? chain.mic : withHead(chain.mic, yaw, 0);
  const a11y = `The ${who} seen from the ${view}: ${at === 'chest' ? 'a body mic clipped at the breastbone' : 'a headset with its boom at the corner of the mouth'}, the cable with a strain-relief loop to a pack at the small of the back, its antenna hanging straight.${kos.length ? ` Never mount on: ${kos.map((k) => k.short.toLowerCase()).join(', ')}.` : ''} Turned ${Math.abs(yaw)}°: the chest mic is ${cm(cmp.chest.d)} from the mouth (${cm(cmp.chest.d0)} facing ahead), the headset ${cm(cmp.headset.d)} at every turn.`;
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'who',
      label: 'WEARER',
      valueLabel: who.toUpperCase(),
      selectedId: who,
      onSelect: (id) => {
        setWho(id as Wearer);
        setSeen((q) => (q.has(id) ? q : new Set([...q, id])));
      },
      sticky: true,
      options: spec.wearers.map((w0) => ({ id: w0, label: w0 === 'coach' ? 'A coach' : w0 === 'official' ? 'An official' : 'An athlete (approved mount)', blurb: spec.words.wearer[w0] })),
    },
    {
      kind: 'options',
      id: 'at',
      label: 'MIC',
      valueLabel: at === 'chest' ? 'CHEST' : 'HEADSET',
      selectedId: at,
      onSelect: (id) => setAt(id as typeof at),
      sticky: true,
      options: [
        { id: 'chest', label: 'A body mic on the chest', blurb: 'Clipped at the breastbone, the capsule clear of fabric edges.' },
        { id: 'headset', label: 'A headset boom', blurb: 'The boom at the corner of the mouth; it turns with the head.' },
      ],
    },
    {
      kind: 'options',
      id: 'view',
      label: 'VIEW',
      valueLabel: view.toUpperCase(),
      selectedId: view,
      onSelect: (id) => setView(id as typeof view),
      sticky: true,
      options: [
        { id: 'front', label: 'From the front' },
        { id: 'side', label: 'From the side' },
      ],
    },
    {
      kind: 'fader',
      id: 'turn',
      label: 'TURN',
      value: (yaw + 60) / 120,
      onChange: (v) => setYaw(Math.round((v * 120 - 60) / 5) * 5),
      format: (v) => {
        const y = Math.round((v * 120 - 60) / 5) * 5;
        return y === 0 ? 'facing ahead' : `the head ${Math.abs(y)}° to the ${y > 0 ? 'right' : 'left'}`;
      },
      formatShort: (v) => `${Math.round((v * 120 - 60) / 5) * 5}°`,
      home: 0.5,
    },
  ];
  const bezel: BezelItem[] = [
    { k: 'WEARER', v: who.toUpperCase(), flex: 1 },
    { k: 'CHEST MIC', v: cm(cmp.chest.d), flex: 1 },
    { k: 'TURN COSTS', v: Math.abs(cmp.chest.db) < 0.5 ? '0 dB' : `${cmp.chest.db > 0 ? '−' : '+'}${db0(Math.abs(cmp.chest.db))}`, flex: 1 },
    { k: 'HEADSET', v: '0 dB', flex: 0.9 },
  ];
  const labels: StaticLabel[] = [
    { id: 'mic', text: at === 'chest' ? 'BODY MIC' : 'HEADSET', u: mic.u + (view === 'front' ? 220 : 160), v: mic.v - 40, align: 'left', tone: 'amber', at: { u: mic.u, v: mic.v } },
    { id: 'pack', text: 'PACK · SMALL OF THE BACK', short: 'PACK', u: view === 'front' ? 260 : TORSO.smallOfBack.x - 60, v: view === 'front' ? 1180 : TORSO.smallOfBack.y + 200, align: view === 'front' ? 'left' : 'right', tone: 'muted', at: uv(TORSO.smallOfBack) },
    ...kos.slice(0, 2).map((k, i) => ({ id: k.id, text: `NEVER MOUNT HERE · ${k.short}`, short: k.short, u: view === 'front' ? -440 : -540, v: i === 0 ? -260 : 160, align: 'left' as const, tone: 'muted' as const })),
  ];
  const pose = view === 'front' ? TORSO_FRONT : SINGER_SIDE;
  const inset: FieldInset = {
    view: 'top',
    box: ABOVE_BOX,
    at: { x: 0.02, y: 0.6, w: 0.37, h: 0.38 },
    title: 'FROM ABOVE',
    draw: (px) => (
      <>
        <StandingTalker view="top" t={HOST} headless />
        <TurnedHeadTop yawDeg={yaw} />
        {at === 'headset' ? (
          <Group transform={[{ translateX: TURN_PIVOT.x }, { translateY: TURN_PIVOT.z }, { rotate: (yaw * Math.PI) / 180 }, { translateX: -TURN_PIVOT.x }, { translateY: -TURN_PIVOT.z }]}>
            <HeadsetFrame view="top" capsule={chain.mic} />
          </Group>
        ) : null}
        <Dim a={uvOf('top', mouth)} b={uvOf('top', worn)} px={px} color="#ffc64d" />
        <Circle cx={worn.x} cy={worn.z} r={5 * px} color="#ffc64d" />
      </>
    ),
  };
  // A wide, low corner (the phone on its side) has room beside the drawing:
  // the words sit there, off the head and the mic.
  const aboveLabels = (w: number, h: number): StaticLabel[] => {
    const wide = w * inset.at.w > 2 * h * inset.at.h;
    const dist = cm(at === 'chest' ? cmp.chest.d : cmp.headset.d);
    return wide
      ? [
          { id: 'above', text: 'FROM ABOVE', short: 'ABOVE', u: ABOVE_BOX.u0 - 12, v: 0, align: 'right' },
          { id: 'dist', text: dist, u: ABOVE_BOX.u1 + 12, v: 0, align: 'left', tone: 'amber' },
        ]
      : [
          { id: 'above', text: 'FROM ABOVE', short: 'ABOVE', u: ABOVE_BOX.u0 + 18, v: ABOVE_BOX.v0 + 44, align: 'left' },
          { id: 'dist', text: dist, u: ABOVE_BOX.u1 - 14, v: ABOVE_BOX.v1 - 56, align: 'right', tone: 'amber' },
        ];
  };
  return {
    key: 'body',
    title: 'A body mic, front and side',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => {
        const box = view === 'front' ? FRONT_BOX : SIDE_BOX;
        const xf = fieldXform('side', box, w, h);
        return (
          <View style={{ width: w, height: h }}>
            <FieldStage w={w} h={h} view="side" box={box} a11y={a11y} labels={labels} inset={{ ...inset, labels: aboveLabels(w, h) }}>
              {() => (
                <>
                  {view === 'side' ? <BodyChain uv={uvS} chain={chain} /> : null}
                  <PlayerBehind pose={pose} />
                  <PlayerInFront pose={pose} hands />
                  {at === 'headset' ? <HeadsetOnHead view={view} /> : null}
                  {view === 'front' ? <BodyChain uv={uvF} chain={chain} showPack={false} /> : null}
                  {kos.map((k) => (
                    <KeepOutRegion key={k.id} shape={k.shape} uv={uv} />
                  ))}
                  <PlaceRing u={mic.u} v={mic.v} r={34} />
                  {at === 'chest' ? <MicAt view="side" p={view === 'front' ? v3(mic.u, mic.v, 0) : chain.mic} aim={view === 'front' ? v3(0, -1, 0) : unit(sub(LIP, chain.mic))} art="lavalier" r={4} len={14} /> : null}
                </>
              )}
            </FieldStage>
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, xf.s < TAG_ON_FIGURE_S && { left: -TAG_BESIDE_PX, right: TAG_BESIDE_PX }]}>
              <RoleTag who={who} x={xf.ox + (view === 'front' ? 0 : TAG_SIDE_U) * xf.s} y={xf.oy + TAG_V * xf.s} />
            </View>
          </View>
        );
      },
      badge: 'Front or side, above in the corner · the places are drawing defaults · hatched = never mount here · silent',
      bezel,
      params,
      initialParam: 'who',
    },
    well: (
      <>
        <Landing looking={spec.words.looking} prompt={spec.words.prompt} />
        <Card>
          <Point title={who.toUpperCase()}>{spec.words.wearer[who]}</Point>
          <Point title="CHEST AGAINST HEADSET">{`Turned ${Math.abs(yaw)}°: the chest mic is ${cm(cmp.chest.d)} from the mouth (${cm(cmp.chest.d0)} facing ahead) — about ${Math.abs(Math.round(cmp.chest.db))} dB ${cmp.chest.db > 0 ? 'lower' : 'different'} by distance, and duller as the mouth turns away. A headset boom turns with the head: its distance stays the same.`}</Point>
          <Point title="THE CHAIN ON THE BODY">The cable leaves the mic with a small strain-relief loop and enough slack for the head and the torso to move — no loop a hand can catch. The pack sits in the approved low-profile place, its antenna straight, never coiled or folded.</Point>
        </Card>
        {seen.size >= Math.min(2, spec.wearers.length) ? <Note tone="ok">{spec.words.done}</Note> : null}
        <Body>Every place here is a drawing default on a generic figure — no chest position or mouth offset fits every uniform, body and mic. The approval, the equipment people and the wearer decide.</Body>
      </>
    ),
  };
}

const styles = StyleSheet.create({
  tick: { position: 'absolute', fontFamily: fonts.mono, fontSize: 9, color: colors.textPrimary },
  strip: { position: 'absolute', fontFamily: fonts.mono, fontSize: 10, color: colors.textPrimary },
});
