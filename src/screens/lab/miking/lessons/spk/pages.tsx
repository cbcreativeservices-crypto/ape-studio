/**
 * SPEAKER CABINET & LESLIE MODULE — its own pages (LessonArt.pages), on the
 * same journey as the kick (LESSON_JOURNEY.md): meet → how it sounds → where
 * it sits → microphones → placement (worked example first) → advanced →
 * practice. The kick's pages carry the kick's words and its one drum; this
 * module mics a speaker AND a rotary cabinet, so it has its own.
 *
 *   1 MEET         start · what it is · the cabinet's parts (front, cut,
 *                  one speaker face-on) · the rotary cabinet's parts
 *   2 HOW IT SOUNDS cone to air (stepped) · the beam (a piston in a wall) ·
 *                  centre and edge · the rotary cabinet turning (a lesson
 *                  display the learner starts) · air, not wire + checks
 *   3 WHERE IT SITS the signal path · stage and studio · before any mic
 *   4 MICROPHONES  shared piece (journeyPages.GMicrophone)
 *   5 PLACEMENT    worked example · place on a cabinet · build a rotary
 *                  cabinet's pickup from outside · how zones work · checks
 *   6 ADVANCED     studio or live (aim the null) · two mics (front + open
 *                  back: polarity vs delay) · troubleshoot (shared page)
 *   7 PRACTICE     shared piece (journeyPages.GPractice)
 * FULLY SILENT; nothing loops (the rotor display plays a finite run).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { cancelAnimation, Easing, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, fonts } from '../../../../../theme/tokens';
import { useAnimationsAllowed } from '../../../../../features/settings/a11y';
import { ExpandableFigure } from '../../../kit/ExpandableFigure';
import type { BezelItem, DockParam } from '../../../rack/rackTypes';
import type { Lesson, MicPattern, MicPose, MicSlot, PatternId, Vec3, ViewBox, ViewId } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { PairComb } from '../shared/speakers/PairComb';
import { Body, Card, Landing, Note, NowLine, Point, PredictCard, ScenarioList, ZoneCard } from '../../engine/kit';
import { useRig, type Rig } from '../../engine/scene/useRig.ts';
import { DualView } from '../../engine/scene/DualView';
import { PlacementScene } from '../../engine/scene/PlacementScene';
import { placementBezel, lenCell, stopShortOf } from '../../engine/scene/readoutText.ts';
import { readoutWords } from '../../engine/scene/sceneWords.ts';
import { zonesAvailable } from '../../engine/geometry/zones.ts';
import { dist } from '../../engine/geometry/vec.ts';
import { arrivalAngle, gainDb, nearNull, nullAngles } from '../../engine/physics/polar.ts';
import { C20, EQUAL_PATH_MM, deltaTms, notchesHz } from '../../engine/physics/twoMic.ts';
import { fmtAngle, fmtDb, fmtHz, fmtIdealPickup, fmtLen, fmtMs, isDeepNull } from '../../engine/model/units.ts';
import { MIC_TYPES, micType } from '../../data/micTypes';
import { PTroubleshoot } from '../../pages/PReadPages';
import type { PageProps } from '../../pages/pageTypes';
import { Chip, GMicrophone, GPractice, factsStep, micSentence, posParams, startStep, type AimAxis, type AxisWords, type PosAxis } from '../shared/journeyPages';
import { CabExplorer, SPOT_WORDS, type CabExplorerView } from '../shared/speakers/CabExplorer';
import { ConeSequence, BeamDisplay } from '../shared/speakers/SpeakerSound';
import { LeslieDisplay, rampWords, useLeslieRig, type LeslieView } from '../shared/speakers/LeslieDisplay';
import { StagePlan, SignalChain, CHAIN, type PlanScene } from '../shared/speakers/StagePlan';
import { BEAM_F_MAX, BEAM_F_MIN, farFieldFromMm, halfAngle, inNearField, kaOf, pistonDb } from '../shared/speakers/pistonBeam.ts';
import { LESLIE_RANGES, distanceFromCabinet, inRange, leslieMics, type LeslieArrangement } from '../shared/speakers/leslieMics.ts';
import { CABINETS, CROSSOVER_HZ, GRILLE_X, type CabKind } from '../shared/speakers/speakerModel.ts';
import { ROTORS, TIME_BASES, type RotorMode, type TimeBaseId } from '../shared/speakers/rotor.ts';
import { CAB_ORDER, SPK_CABS } from './geometry.ts';
import { cabArt } from './art';
import type { Back } from '../shared/speakers/cabGeometry.ts';
import { viewToggle } from '../../engine/scene/viewToggle.ts';

const G = GRILLE_X.mm;

function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

/** One lesson object per cabinet (stable identities: the rig memoises on it). */
const CAB_LESSONS = new Map<string, Record<CabKind, Lesson>>();
function cabLessons(lesson: Lesson): Record<CabKind, Lesson> {
  let m = CAB_LESSONS.get(lesson.id);
  if (!m) {
    m = Object.fromEntries(CAB_ORDER.map((k) => [k, { ...lesson, model: SPK_CABS[k].model, zones: SPK_CABS[k].zones }])) as Record<CabKind, Lesson>;
    CAB_LESSONS.set(lesson.id, m);
  }
  return m;
}

const CAB_CHOICES: { id: string; kind: CabKind; back: Back; label: string; blurb: string }[] = [
  { id: '1x12:closed', kind: '1x12', back: 'closed', label: '1 × 12, CLOSED BACK', blurb: 'One 12 in speaker in a closed box: the back of the cone sounds into the box.' },
  { id: '1x12:open', kind: '1x12', back: 'open', label: '1 × 12, OPEN BACK', blurb: 'The same speaker with the back open: the back of the cone sounds out behind, opposite in polarity.' },
  { id: '4x12:closed', kind: '4x12', back: 'closed', label: '4 × 12', blurb: 'Four 12 in speakers, the upper pair on an angled front. They may not all sound alike — find the active one.' },
  { id: 'bass410:closed', kind: 'bass410', back: 'closed', label: 'BASS 4 × 10 + HORN', blurb: 'Four 10 in speakers and a small horn for the highest frequencies: one cone may not represent the whole cabinet.' },
];

const PART_ORDER = ['spk.grille', 'spk.cabinet', 'spk.baffle', 'spk.cone', 'spk.dust', 'spk.surround', 'spk.frame', 'spk.magnet', 'spk.back', 'spk.openBack', 'spk.horn'];

/** The rotary cabinet's parts, in plain words (orient page). */
const LESLIE_PARTS: { id: string; title: string; text: string; view: 'inside' | 'front' }[] = [
  { id: 'les.upper', title: 'UPPER LOUVERS', text: 'Slatted openings round the top, where the horn’s sound leaves. Upper mics go OUTSIDE them — nothing goes through.', view: 'front' },
  { id: 'les.lower', title: 'LOWER OPENINGS', text: 'Openings round the bottom, where the low rotor’s sound leaves. The lower mic goes outside one of them.', view: 'front' },
  { id: 'les.cabinet', title: 'THE CABINET', text: 'A closed wooden cabinet with turning parts, hot parts and dangerous voltages inside. It stays closed: only a qualified technician opens it.', view: 'front' },
  { id: 'les.horn', title: 'HORN ROTOR', text: `Two horn bells turning on one axis at the top — on the classic cabinet only one sounds; the other is blocked and balances it. The highs, above about ${CROSSOVER_HZ} Hz, sweep past a mic once per turn.`, view: 'inside' },
  { id: 'les.driver', title: 'HORN DRIVER', text: 'The speaker under the horn rotor that feeds it; the bells turn above it.', view: 'inside' },
  { id: 'les.xo', title: 'CROSSOVER AND AMPLIFIER', text: `The crossover splits the sound at about ${CROSSOVER_HZ} Hz: highs up to the horn, lows down to the woofer. The amplifier inside is installed equipment, not a mic input.`, view: 'inside' },
  { id: 'les.woofer', title: 'WOOFER', text: 'A 15 in speaker facing DOWN into the low rotor. It does not turn.', view: 'inside' },
  { id: 'les.drum', title: 'LOW ROTOR', text: 'A turning drum under the woofer with one opening that throws the low sound round the cabinet. Drawn here with one scoop — a drawing choice.', view: 'inside' },
];

/* ═══════════════ 1 · MEET THE SPEAKERS ═══════════════ */
export function SpkInstrument({ lesson, journey, hidden }: PageProps) {
  const motion = useAnimationsAllowed();
  const focused = useFocusedSafe();
  const [cabId, setCabId] = useState('1x12:closed');
  const cab = CAB_CHOICES.find((c) => c.id === cabId)!;
  const [view, setView] = useState<CabExplorerView>('front');
  const [cloth, setCloth] = useState(true);
  const [partId, setPartId] = useState<string | null>(null);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  const model = SPK_CABS[cab.kind].model;
  const parts = model.parts.filter((p) => (!p.variants || p.variants.includes(cab.back)) && PART_ORDER.includes(p.id)).sort((a, b) => PART_ORDER.indexOf(a.id) - PART_ORDER.indexOf(b.id));
  const shown = model.parts.find((p) => p.id === partId);
  const pick = (id: string) => {
    setPartId(id);
    setSeen((s) => (s.has(id) ? s : new Set([...s, id])));
  };
  const partIdx = Math.max(0, parts.findIndex((p) => p.id === partId));

  /* the rotary cabinet (at rest on this page: it is explored, not run) */
  const les = useLeslieRig({ motion, hidden, focused, start: 'stop' });
  const [lView, setLView] = useState<'inside' | 'front'>('inside');
  const [lPart, setLPart] = useState<string | null>(null);
  const lp = LESLIE_PARTS.find((p) => p.id === lPart);
  const lIdx = Math.max(0, LESLIE_PARTS.findIndex((p) => p.id === lPart));

  const viewOpts = [
    { id: 'front', label: 'FROM THE FRONT', blurb: 'The cabinet as you see it, with its grille cloth — switch the cloth off to find the speaker behind it.' },
    { id: 'side', label: 'CUT, FROM THE SIDE', blurb: 'Cut through the speaker’s middle: the cone, the magnet, the box and the back.' },
    { id: 'top', label: 'CUT, FROM ABOVE', blurb: 'The same cut seen from above.' },
    { id: 'face', label: 'ONE SPEAKER, FACE-ON', blurb: 'One 12 in speaker up close: dust cap, cone, surround and frame.' },
  ];
  const steps: MikingStep[] = [
    startStep(lesson, journey, `This lesson is about putting a microphone on an amplified speaker — a guitar or bass cabinet, and the rotary cabinet an organ plays through. First the speakers themselves: what they are, how they make their sound, and where they sit. Then the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.`),
    factsStep(
      lesson,
      <ExpandableFigure
        aspect={1.55}
        title="SPEAKER CABINET"
        badge="A 1 × 12 cabinet cut through its speaker · a simplified picture"
        render={(fw, fh) => <CabExplorer w={fw} h={fh} kind="1x12" back="closed" view="side" accessibilityLabel="A 1 by 12 inch speaker cabinet cut open from the side: the grille cloth at the front, the speaker behind the front board with its cone, dust cap and magnet, and the closed back." />}
      />,
    ),
    {
      key: 'parts',
      title: 'The cabinet’s parts',
      kind: 'TRY',
      layout: 'rack',
      rack: {
        render: (w, h) => (
          <CabExplorer
            w={w}
            h={h}
            kind={cab.kind}
            back={cab.back}
            view={view}
            frontMode={cloth ? 'cloth' : 'baffle'}
            highlight={partId}
            onTapPart={pick}
            accessibilityLabel={`The ${cab.label.toLowerCase()}, ${viewOpts.find((v) => v.id === view)!.label.toLowerCase()}.${shown ? ` Highlighted: the ${shown.label}.` : ''} The miked speaker is ringed.`}
          />
        ),
        badge: view === 'front' ? (cloth ? 'From the front · the miked speaker ringed in amber · its dust cap marked through the cloth' : 'The grille cloth taken away IN THE DRAWING only — never on a real cabinet') : view === 'face' ? 'One 12 in speaker face-on · tap a part' : 'Cut through the speaker’s middle · tap a part',
        bezel: [
          { k: 'PART', v: shown ? shown.short.toUpperCase() : 'TAP ONE', flex: 1.4 },
          { k: 'LOOKED AT', v: `${seen.size} / ${parts.length}` },
          { k: 'CABINET', v: CABINETS[cab.kind].short, flex: 1.1 },
        ],
        params: [
          {
            kind: 'fader',
            id: 'part',
            label: 'PART',
            value: parts.length > 1 ? partIdx / (parts.length - 1) : 0,
            onChange: (v) => {
              const p = parts[Math.round(v * (parts.length - 1))];
              if (p) pick(p.id);
            },
            format: () => (shown ? `${shown.short.toUpperCase()} · ${seen.size} of ${parts.length} looked at` : `step through the ${parts.length} parts`),
            formatShort: () => (shown ? shown.short.toUpperCase().slice(0, 9) : 'STEP'),
          },
          { kind: 'options', id: 'view', label: 'VIEW', valueLabel: view.toUpperCase(), selectedId: view, onSelect: (id) => setView(id as CabExplorerView), sticky: true, options: viewOpts },
          { kind: 'options', id: 'cab', label: 'CABINET', valueLabel: CABINETS[cab.kind].short, selectedId: cabId, onSelect: setCabId, sticky: true, options: CAB_CHOICES.map((c) => ({ id: c.id, label: c.label, blurb: c.blurb })) },
          { kind: 'toggle', id: 'cloth', label: cloth ? 'CLOTH ON' : 'CLOTH OFF', value: !cloth, onToggle: () => setCloth((x) => !x) },
        ],
        initialParam: 'part',
      },
      well: (
        <>
          <Landing looking={`${cab.label} · ${viewOpts.find((v) => v.id === view)!.label.toLowerCase()}`} prompt="Tap any part — or step through PART — to see what it is and what it does. There is nothing to answer on this page." />
          {shown ? (
            <Card>
              <Point title={shown.label.toUpperCase()}>{shown.role}</Point>
            </Card>
          ) : (
            <Note>The amplifier drives the cone; the cone pushes the air; the mic hears the air. The grille cloth hides the speaker — find it before you place a mic.</Note>
          )}
          {cab.kind !== '1x12' ? <Note>{`In a cabinet with several speakers, close in a mic hears mostly the one it faces. They may not sound alike, or one may not work: ask which is active, and mark it from outside the grille with the amp off or muted.`}</Note> : null}
          {cab.back === 'open' ? <Note>An open back lets the back of the cone sound out behind the cabinet — the next page shows why it is opposite in polarity.</Note> : null}
        </>
      ),
    },
    {
      key: 'rotary',
      title: 'The rotary cabinet',
      kind: 'TRY',
      layout: 'rack',
      rack: {
        render: (w, h) => (
          <LeslieDisplay
            w={w}
            h={h}
            rig={les}
            view={lView}
            showStrip={false}
            highlight={lPart}
            onTapPart={setLPart}
            accessibilityLabel={`The rotary cabinet, ${lView === 'inside' ? 'an inside view drawn as a diagram: the horn rotor at the top, one sounding bell and one capped balance bell, over its driver, the woofer facing down, the crossover and amplifier, and the low rotor drum at the bottom' : 'from the front: the upper louvers and the lower openings'}.${lp ? ` Highlighted: ${lp.title.toLowerCase()}.` : ''}`}
          />
        ),
        badge: lView === 'inside' ? 'An inside view as a diagram — never open the cabinet · sizes and openings are drawing choices' : 'From the front · the openings’ layout is a drawing choice',
        bezel: [
          { k: 'PART', v: lp ? lp.title.split(' ')[0] : 'TAP ONE', flex: 1.4 },
          { k: 'HIGHS', v: 'HORN', sub: `above ${CROSSOVER_HZ} Hz` },
          { k: 'LOWS', v: 'DRUM', sub: `below ${CROSSOVER_HZ} Hz` },
        ],
        params: [
          {
            kind: 'fader',
            id: 'part',
            label: 'PART',
            value: lIdx / (LESLIE_PARTS.length - 1),
            onChange: (v) => {
              const p = LESLIE_PARTS[Math.round(v * (LESLIE_PARTS.length - 1))];
              setLPart(p.id);
              setLView(p.view);
            },
            format: () => (lp ? lp.title : 'step through the parts'),
            formatShort: () => (lp ? lp.title.split(' ')[0].slice(0, 9) : 'STEP'),
          },
          {
            kind: 'options',
            id: 'view',
            label: 'VIEW',
            valueLabel: lView === 'inside' ? 'INSIDE' : 'FRONT',
            selectedId: lView,
            onSelect: (id) => setLView(id as 'inside' | 'front'),
            sticky: true,
            options: [
              { id: 'inside', label: 'INSIDE VIEW (A DIAGRAM)', blurb: 'What is inside, drawn as a diagram. A real cabinet is never opened for miking.' },
              { id: 'front', label: 'FROM THE FRONT', blurb: 'The closed cabinet, as you meet it: upper louvers, lower openings.' },
            ],
          },
        ],
        initialParam: 'part',
      },
      well: (
        <>
          <Landing looking={`The rotary cabinet · ${lView === 'inside' ? 'inside view (a diagram)' : 'from the front'}`} prompt="Tap a part — or step through PART. Next page you will set it turning." />
          {lp ? (
            <Card>
              <Point title={lp.title}>{lp.text}</Point>
            </Card>
          ) : (
            <Note>A rotary cabinet is two turning speakers in one box: a horn at the top for the highs and a drum at the bottom for the lows. The motion is part of the sound.</Note>
          )}
          <Note tone="warn">Never open a rotary cabinet, and never push a mic, cable, finger or tool through a louver: there are turning parts, hot parts and dangerous voltages inside. Its connection to the organ is installed equipment — never a mic input.</Note>
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ═══════════════ 2 · HOW A SPEAKER SOUNDS ═══════════════ */
const STEP_MS = 1300;
const SPOTS = ['centre', 'boundary', 'edge'] as const;

export function SpkSound({ lesson, answers, onAnswered, onInteractive, interactiveDone, hidden }: PageProps) {
  const S = lesson.sound;
  const n = S.stages.length;
  const motion = useAnimationsAllowed();
  const focused = useFocusedSafe();
  const reveal = useSharedValue(1);
  const [shown, setShown] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [back, setBack] = useState<Back>('closed');
  const [predicted, setPredicted] = useState<string | null>(null);
  useAnimatedReaction(
    () => Math.max(1, Math.min(n, Math.floor(reveal.value + 0.001))),
    (cur, prev) => {
      if (cur !== prev) scheduleOnRN(setShown, cur);
    },
  );
  const stop = () => {
    cancelAnimation(reveal);
    setPlaying(false);
  };
  const goTo = (k: number) => {
    cancelAnimation(reveal);
    setPlaying(false);
    reveal.value = k;
    setShown(k);
  };
  const play = () => {
    if (playing) {
      stop();
      return;
    }
    const from = shown >= n ? 1 : Math.floor(reveal.value);
    if (!motion) {
      goTo(Math.min(n, from + (shown >= n ? 0 : 1)));
      return;
    }
    reveal.value = from;
    setPlaying(true);
    reveal.value = withTiming(n, { duration: (n - from) * STEP_MS, easing: Easing.linear }, (done) => {
      if (done) scheduleOnRN(setPlaying, false);
    });
  };
  useEffect(() => {
    if ((hidden || !focused) && playing) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden, focused]);
  useEffect(() => () => cancelAnimation(reveal), []); // eslint-disable-line react-hooks/exhaustive-deps
  const stage = S.stages[shown - 1];
  const stageText = (i: number) => (back === 'open' && S.stages[i].ported ? S.stages[i].ported! : S.stages[i].text);

  /* the beam */
  const [fNorm, setFNorm] = useState(0.62);
  const fHz = Math.round(BEAM_F_MIN * Math.pow(BEAM_F_MAX / BEAM_F_MIN, fNorm));
  const [micDeg, setMicDeg] = useState(30);
  const ka = kaOf(fHz);
  const atMic = pistonDb(ka, micDeg);
  const half = halfAngle(ka);
  const farFrom = farFieldFromMm(fHz);

  /* centre and edge */
  const [spot, setSpot] = useState<(typeof SPOTS)[number]>('boundary');

  /* the rotary cabinet: a lesson display the learner starts */
  const les = useLeslieRig({ motion, hidden, focused, start: 'slow' });
  const [lView, setLView] = useState<LeslieView>('inside');

  // CREDIT: the cone reached its end AND the horn reached fast once.
  const coneDone = useRef(false);
  if (shown >= n) coneDone.current = true;
  useEffect(() => {
    if (coneDone.current && les.reachedFast && !interactiveDone.has('soundPath')) onInteractive('soundPath');
  }, [shown, les.reachedFast, interactiveDone, onInteractive]);

  const pred = lesson.predictions.sound;
  const reached = shown >= n;
  const steps: MikingStep[] = [
    {
      key: 'cone',
      title: 'Cone to air',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: (w, h) => <ConeSequence w={w} h={h} back={back} reveal={reveal} shown={shown} accessibilityLabel={`The 1 by 12 cabinet cut open from the side, ${back} back. Event ${shown} of ${n}: ${stage.title}. ${stageText(shown - 1)}`} />,
        badge: 'The order of events, not their speed · cone motion drawn much larger · silent',
        bezel: [
          { k: 'EVENT', v: `${shown} / ${n}`, flex: 0.8 },
          { k: 'CONE', v: shown >= 2 ? 'FORWARD' : 'AT REST', flex: 1.1 },
          { k: 'FRONT AIR', v: shown >= 3 ? 'PUSHED' : '—', flex: 1.1 },
          { k: 'BACK AIR', v: shown >= 3 ? (back === 'open' ? 'PULLED · OUT' : 'PULLED · IN BOX') : '—', flex: 1.4 },
        ],
        params: [
          {
            kind: 'fader',
            id: 'step',
            label: 'STEP',
            value: (shown - 1) / Math.max(1, n - 1),
            onChange: (v) => goTo(1 + Math.round(v * (n - 1))),
            format: () => `${shown} of ${n} · ${stage.title.toLowerCase()}`,
            formatShort: () => `${shown} / ${n}`,
          },
          { kind: 'action', id: 'play', label: playing ? 'PAUSE' : shown >= n ? 'REPLAY ONCE' : motion ? 'PLAY ONCE' : 'NEXT STEP', onPress: play, tint: colors.green },
          {
            kind: 'options',
            id: 'back',
            label: 'BACK',
            valueLabel: back === 'open' ? 'OPEN' : 'CLOSED',
            selectedId: back,
            onSelect: (id) => setBack(id as Back),
            options: [
              { id: 'closed', label: 'CLOSED BACK', blurb: 'The sound from the back of the cone stays in the box.' },
              { id: 'open', label: 'OPEN BACK', blurb: 'The back of the cone sounds out behind the cabinet — opposite in polarity.' },
            ],
          },
        ],
        initialParam: 'step',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={`Side view · the 1 × 12 cut open · ${back} back`} prompt="STEP through the four events, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
          <Card>
            <Point title={`${shown} · ${stage.title.toUpperCase()}`}>{stageText(shown - 1)}</Point>
          </Card>
          {reached && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. Moving forward, the cone pushes the air in front and PULLS the air behind — the same motion, opposite ways. That is why a mic behind an open back hears the sound inverted.`}</Note> : null}
          {reached ? <Note>Then the cone moves back, and the push and pull swap — over and over, at the pitch of the note.</Note> : null}
        </>
      ),
    },
    {
      key: 'beam',
      title: 'How it spreads',
      kind: 'COMPARE',
      layout: 'rack',
      rack: {
        render: (w, h) => <BeamDisplay w={w} h={h} fHz={fHz} micDeg={micDeg} accessibilityLabel={`How a 12 inch speaker spreads its sound at ${fmtHz(fHz)}, a simplified picture. A mic ${micDeg} degrees off the speaker's axis is ${atMic <= -39.5 ? 'in a deep dip' : fmtDb(atMic)} from on-axis.`} />,
        badge: 'A simplified picture: a rigid disc the size of the cone, in an endless wall, far away · blue = how loud, by direction',
        bezel: [
          { k: 'PITCH', v: fmtHz(fHz), flex: 1 },
          { k: 'MIC OFF AXIS', v: `${micDeg}°`, flex: 1.1 },
          { k: 'AT THE MIC', v: atMic <= -39.5 ? 'DEEP DIP' : fmtDb(atMic), sub: 'vs on axis', flex: 1.1 },
          { k: 'HALF LEVEL', v: half == null ? 'WIDE' : `±${Math.round(half)}°`, sub: half == null ? 'no beam' : '−6 dB', flex: 1 },
        ],
        params: [
          { kind: 'fader', id: 'pitch', label: 'PITCH', value: fNorm, onChange: (v) => setFNorm(Math.round(v * 100) / 100), format: () => `${fmtHz(fHz)} · ${half == null ? 'spreads wide' : `half level at ±${Math.round(half)}°`}`, formatShort: () => fmtHz(fHz) },
          { kind: 'fader', id: 'mic', label: 'MIC ANGLE', value: micDeg / 80, home: 0, onChange: (v) => setMicDeg(Math.round(v * 16) * 5), format: () => `${micDeg}° off the speaker’s axis`, formatShort: () => `${micDeg}°` },
        ],
        initialParam: 'pitch',
      },
      well: (
        <>
          <Landing looking={`A speaker’s spread · ${fmtHz(fHz)}`} prompt="Slide PITCH from low to high and watch the spread narrow. Then move the MIC off the axis." />
          <Card>
            <Point title={half == null ? 'LOW PITCH: IT SPREADS WIDE' : 'HIGHER PITCH: IT BEAMS'}>
              {half == null
                ? 'At low pitches the cone is small next to the wavelength, so the sound spreads to the sides almost as strongly as straight ahead.'
                : `Here the cone is large next to the wavelength, so the sound narrows into a beam: half the level (−6 dB) by about ±${Math.round(half)}° off the axis. A mic off to the side hears less of these highs.`}
            </Point>
          </Card>
          <Note>{`This beam is a far-field picture. At ${fmtHz(fHz)} it only applies from ${fmtLen(farFrom)} out. A mic a few centimetres from the grille sits in the speaker’s near field, where the spot it faces on the cone matters more — the next step.`}</Note>
          {inNearField(50, fHz) ? null : <Note>At this low pitch even a close mic is past the near field — but the spread is wide anyway.</Note>}
        </>
      ),
    },
    {
      key: 'spots',
      title: 'Centre and edge',
      kind: 'COMPARE',
      layout: 'rack',
      rack: {
        render: (w, h) => <CabExplorer w={w} h={h} kind="1x12" back="closed" view="face" spot={spot} accessibilityLabel={`One 12 inch speaker face-on, the spot marked: ${SPOT_WORDS[spot].title.toLowerCase()}.`} />,
        badge: 'One 12 in speaker face-on · the blue ring is where the mic aims · tendencies to check, not results',
        bezel: [
          { k: 'SPOT', v: spot === 'centre' ? 'CENTRE' : spot === 'boundary' ? 'CAP EDGE' : 'EDGE', flex: 1.2 },
          { k: 'FROM CENTRE', v: lenCell(SPOT_WORDS[spot].r).v, sub: lenCell(SPOT_WORDS[spot].r).sub, flex: 1.3 },
          { k: 'TENDS TO', v: spot === 'centre' ? 'BRIGHTER' : spot === 'boundary' ? 'BETWEEN' : 'MELLOWER', flex: 1.3 },
        ],
        params: [
          {
            kind: 'fader',
            id: 'spot',
            label: 'SPOT',
            value: SPOTS.indexOf(spot) / 2,
            onChange: (v) => setSpot(SPOTS[Math.round(v * 2)]),
            format: () => SPOT_WORDS[spot].title.toLowerCase(),
            formatShort: () => (spot === 'centre' ? 'CENTRE' : spot === 'boundary' ? 'CAP EDGE' : 'EDGE'),
          },
        ],
        initialParam: 'spot',
      },
      well: (
        <>
          <Landing looking="One speaker, face-on" prompt="Step SPOT from the centre to the edge. Each is a place to aim a close mic." />
          <Card>
            <Point title={SPOT_WORDS[spot].title}>{SPOT_WORDS[spot].text}</Point>
          </Card>
          <Note>Why: at low pitches the whole cone moves as one. Higher up the cone flexes, and more of the high-frequency sound comes from the middle, near the voice coil. Close in, the spot a mic faces tilts the balance — the centre most often brighter, the edge mellower. A tendency, and speakers vary: check by ear.</Note>
        </>
      ),
    },
    {
      key: 'rotary',
      title: 'The rotary cabinet turning',
      kind: 'WATCH',
      layout: 'rack',
      rack: {
        render: (w, h) => <LeslieDisplay w={w} h={h} rig={les} view={lView} accessibilityLabel={`The rotary cabinet, ${lView === 'plan' ? 'both rotors from above' : lView === 'inside' ? 'an inside view drawn as a diagram' : 'from the front'}. Speed: ${les.mode === 'fast' ? 'fast' : les.mode === 'slow' ? 'slow' : 'stopped'}. ${rampWords()}`} />,
        badge: `${les.motion ? TIME_BASES.find((b) => b.id === les.timeBase)!.label : 'Stepped'} · true speeds printed · speed changes drawn linear · direction of turn is a drawing choice`,
        bezel: [
          { k: 'SPEED', v: les.mode === 'fast' ? 'FAST' : les.mode === 'slow' ? 'SLOW' : 'STOP', sub: les.mode === 'fast' ? 'tremolo' : les.mode === 'slow' ? 'chorale' : 'off', flex: 1 },
          { k: 'HORN', v: `${les.hornRamp.rpm1} rpm`, sub: 'target', flex: 1.1 },
          { k: 'LOW ROTOR', v: `${les.drumRamp.rpm1} rpm`, sub: 'target', flex: 1.2 },
          { k: 'PLAY', v: les.running ? 'RUNNING' : 'PAUSED', flex: 1 },
        ],
        params: [
          {
            kind: 'options',
            id: 'speed',
            label: 'SPEED',
            valueLabel: les.mode === 'fast' ? 'FAST' : les.mode === 'slow' ? 'SLOW' : 'STOP',
            selectedId: les.mode,
            onSelect: (id) => les.setMode(id as RotorMode),
            sticky: true,
            options: [
              { id: 'slow', label: 'SLOW (CHORALE)', blurb: `Horn ${ROTORS.horn.slowRpm} rpm, low rotor ${ROTORS.drum.slowRpm} rpm.` },
              { id: 'fast', label: 'FAST (TREMOLO)', blurb: `Horn ${ROTORS.horn.fastRpm} rpm (up in ${ROTORS.horn.riseS} s), low rotor ${ROTORS.drum.fastRpm} rpm (up in ${ROTORS.drum.riseS} s) — one adjustable cabinet’s settings; classic cabinets run the low rotor slower.` },
              { id: 'stop', label: 'STOP', blurb: 'Both rotors come to rest (some cabinets offer this).' },
            ],
          },
          les.motion ? { kind: 'action', id: 'run', label: les.running ? 'PAUSE' : 'RUN', onPress: les.running ? les.pause : les.run, tint: colors.green } : { kind: 'action', id: 'step', label: 'STEP', onPress: les.step, tint: colors.green },
          { kind: 'options', id: 'time', label: 'TIME', valueLabel: TIME_BASES.find((b) => b.id === les.timeBase)!.label.replace('SLOWED ', '').replace('REAL SPEED', '×1'), selectedId: les.timeBase, onSelect: (id) => les.setTimeBase(id as TimeBaseId), options: TIME_BASES.map((b) => ({ id: b.id, label: b.label, blurb: b.id === 'x1' ? 'The true speed. At fast, the eye cannot follow the horn — the drawing may seem to jump.' : 'Everything slowed together — the turning AND the speed change — so the eye can follow. The numbers stay the true ones.' })) },
          {
            kind: 'options',
            id: 'view',
            label: 'VIEW',
            valueLabel: lView === 'plan' ? 'ABOVE' : lView === 'inside' ? 'INSIDE' : 'FRONT',
            selectedId: lView,
            onSelect: (id) => setLView(id as LeslieView),
            sticky: true,
            options: [
              { id: 'inside', label: 'INSIDE VIEW (A DIAGRAM)', blurb: 'Both rotors turning, one above the other. Never open a real cabinet.' },
              { id: 'plan', label: 'FROM ABOVE', blurb: 'Each rotor seen from above: where the horn bells and the drum’s opening point as they turn.' },
              { id: 'front', label: 'FROM THE FRONT', blurb: 'The closed cabinet.' },
            ],
          },
        ],
        initialParam: 'speed',
      },
      well: (
        <>
          <Landing looking={`The rotary cabinet · ${lView === 'plan' ? 'from above' : lView === 'inside' ? 'inside view' : 'from the front'}`} prompt={les.motion ? 'Press RUN, then switch SPEED from SLOW to FAST and back. Watch the speed strip: which rotor gets there first?' : 'Switch SPEED, then STEP the rotors round. The speed strip shows how long each change takes.'} />
          <Card>
            <Point title="TWO ROTORS, TWO RATES">{rampWords()}</Point>
          </Card>
          <Note>The horn is light and changes speed in a couple of seconds; the heavier drum takes several. A speed change is part of the performance — when you mic one, listen through slow, fast AND the change between them.</Note>
          <Note>{`In this cabinet the sound is split at about ${CROSSOVER_HZ} Hz: the highs go up to the horn, the lows down to the woofer and the drum. That is why the upper and lower openings sound different.`}</Note>
          {les.reachedFast ? <Note tone="ok">The horn reached its fast speed — and the drum followed, more slowly.</Note> : null}
        </>
      ),
    },
    {
      key: 'air',
      title: 'Air, not wire',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="THE START OF A NOTE">{S.attack}</Point>
            <Point title="THE HELD TONE">{S.body}</Point>
          </Card>
          <Note>A mic on a speaker hears AIR — the speaker, the cabinet and the room. A direct output is a separate electrical signal: it does not carry the speaker, the box or the room, and on some instruments it carries a simulated cabinet instead. Label each as its own source.</Note>
          <Note>This lab never plays a sound and draws no frequency curve for any speaker: how a real cabinet sounds depends on the speaker, the box, the amp and the player.</Note>
          {!reached || !les.reachedFast ? <Note tone="warn">{`Still to do for this page’s credit: ${!reached ? 'step the cone through to the end' : ''}${!reached && !les.reachedFast ? ', and ' : ''}${!les.reachedFast ? 'take the rotary cabinet to FAST once' : ''}.`}</Note> : null}
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ═══════════════ 3 · WHERE IT SITS ═══════════════ */
export function SpkSetting({ lesson, answers, onAnswered }: PageProps) {
  const items = lesson.setting.items;
  const byId = (id: string | null) => items.find((i) => i.id === id);
  const shortOf = (id: string) => byId(id)?.short ?? id.toUpperCase();
  const [chainSel, setChainSel] = useState<string | null>(null);
  const [chainSeen, setChainSeen] = useState<ReadonlySet<string>>(() => new Set());
  const [scene, setScene] = useState<PlanScene>('stage');
  const [sel, setSel] = useState<string | null>(null);
  const chainItems = CHAIN.map((id) => byId(id)!).filter(Boolean);
  const planIds = scene === 'stage' ? ['cab', 'player', 'di', 'wedge', 'sideFill', 'drums', 'organ', 'leslie', 'audience'] : ['cab', 'player', 'di', 'organ', 'leslie', 'room'];
  const planItems = planIds.map((id) => byId(id) ?? (id === 'sideFill' ? { id, label: 'a side-fill monitor', short: 'SIDE FILL', note: lesson.live.wedges.find((w) => w.id === 'sideFill')?.note ?? '', tag: 'MONITOR' } : null)).filter((x): x is NonNullable<typeof x> => !!x);
  const pickChain = (id: string) => {
    setChainSel(id);
    setChainSeen((s) => (s.has(id) ? s : new Set([...s, id])));
  };
  const chainIdx = Math.max(0, chainItems.findIndex((i) => i.id === chainSel));
  const planIdx = Math.max(0, planItems.findIndex((i) => i.id === sel));
  const cs = byId(chainSel);
  const ps = planItems.find((i) => i.id === sel);
  const steps: MikingStep[] = [
    {
      key: 'path',
      title: 'The signal path',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: (w, h) => <SignalChain w={w} h={h} highlight={chainSel} onTap={pickChain} accessibilityLabel={`The signal path: the player, the amplifier, the speaker, the air, the mic and the desk — the air path. Below it, a direct output going straight to the desk: a separate electrical path.${cs ? ` Highlighted: ${cs.label}.` : ''}`} />,
        badge: 'Blue = the air a mic hears · amber dashes = a separate electrical path',
        bezel: [
          { k: 'ITEM', v: cs ? cs.short : 'TAP ONE', flex: 1.4 },
          { k: 'FOR A MIC', v: cs ? cs.tag : '—', flex: 1.4 },
          { k: 'LOOKED AT', v: `${chainSeen.size} / ${chainItems.length}` },
        ],
        params: [
          {
            kind: 'fader',
            id: 'item',
            label: 'ITEM',
            value: chainItems.length > 1 ? chainIdx / (chainItems.length - 1) : 0,
            onChange: (v) => {
              const it = chainItems[Math.round(v * (chainItems.length - 1))];
              if (it) pickChain(it.id);
            },
            format: () => (cs ? `${cs.short} · ${cs.tag}` : `step through the ${chainItems.length} items`),
            formatShort: () => (cs ? cs.short.slice(0, 9) : 'STEP'),
          },
        ],
        initialParam: 'item',
      },
      well: (
        <>
          <Landing looking="From the player to the desk" prompt="Tap each link — or step through ITEM. Which path is the air?" />
          {cs ? (
            <Card>
              <Point title={cs.label.toUpperCase()}>{cs.note}</Point>
            </Card>
          ) : (
            <Note>A mic hears the air the speaker moves. A direct output skips the speaker, the box and the room: it is its own source, not a copy of the mic.</Note>
          )}
        </>
      ),
    },
    {
      key: 'stage',
      title: 'Stage and studio',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: (w, h) => (
          <StagePlan
            w={w}
            h={h}
            scene={scene}
            wedges={lesson.live.wedges}
            highlight={sel}
            onTap={(id) => setSel(id)}
            shortOf={(id) => (id === 'sideFill' ? 'SIDE FILL' : shortOf(id))}
            accessibilityLabel={scene === 'stage' ? `A stage from above: a guitar combo on the backline with its player in front and the guitarist's wedge downstage, a side fill, a drum kit, an organ with its bench and pedals and the rotary cabinet beside it, and the audience and PA.${ps ? ` Highlighted: ${ps.label}.` : ''}` : `A studio room from above: the guitar combo, the organ and the rotary cabinet, no monitors on the floor.${ps ? ` Highlighted: ${ps.label}.` : ''}`}
          />
        ),
        badge: scene === 'stage' ? 'From above · a typical layout · grey dashes = the players’ space, keep clear' : 'From above · a typical studio room',
        bezel: [
          { k: 'ITEM', v: ps ? ps.short : 'TAP ONE', flex: 1.4 },
          { k: 'FOR A MIC', v: ps ? ps.tag : '—', flex: 1.4 },
          { k: 'WHERE', v: scene === 'stage' ? 'LIVE' : 'STUDIO' },
        ],
        params: [
          {
            kind: 'fader',
            id: 'item',
            label: 'ITEM',
            value: planItems.length > 1 ? planIdx / (planItems.length - 1) : 0,
            onChange: (v) => {
              const it = planItems[Math.round(v * (planItems.length - 1))];
              if (it) setSel(it.id);
            },
            format: () => (ps ? `${ps.short} · ${ps.tag}` : `step through the ${planItems.length} items`),
            formatShort: () => (ps ? ps.short.slice(0, 9) : 'STEP'),
          },
          {
            kind: 'options',
            id: 'where',
            label: scene === 'stage' ? 'STAGE' : 'STUDIO',
            valueLabel: scene === 'stage' ? 'LIVE' : 'STUDIO',
            selectedId: scene,
            onSelect: (id) => {
              setScene(id as PlanScene);
              setSel(null);
            },
            sticky: true,
            options: [
              { id: 'stage', label: 'ON A STAGE (LIVE)', blurb: lesson.setting.stage },
              { id: 'studio', label: 'IN A STUDIO', blurb: lesson.setting.studio },
            ],
          },
        ],
        initialParam: 'item',
      },
      well: (
        <>
          <Landing looking={scene === 'stage' ? 'Plan · a stage from above, the audience at the right' : 'Plan · a studio room from above'} prompt="Tap what sits round the cabinets — or step through ITEM." />
          <Body>{scene === 'stage' ? lesson.setting.stage : lesson.setting.studio}</Body>
          {ps ? (
            <Card>
              <Point title={ps.label.toUpperCase()}>{ps.note}</Point>
            </Card>
          ) : null}
        </>
      ),
    },
    {
      key: 'before',
      title: 'Before any mic',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="ASK THE PLAYER FIRST">What feeds the cabinet? Which speaker or opening is active? Is there a crossover, a separate sub, or a direct output? How should it sound? Then listen from a safe spot while they play the real passage at its real level.</Point>
            <Point title="WORK WITH THE AMP AS IT IS">The amp’s settings and the speaker are the player’s sound. Mic the cabinet they bring; leave the tone controls to them.</Point>
            <Point title="A ROTARY CABINET STAYS CLOSED">Plan the stands while it is off. Keep every mic, stand and cable outside, clear of the openings, the vents, the power cord, the organ pedals and the walkways. Never push anything through a louver; never touch connector pins; leave the organ’s cable and any switch on the cabinet alone. Make sure the cabinet stands steady.</Point>
          </Card>
          <Note tone="warn">Protect your hearing at soundcheck. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens. It has nothing to do with a microphone’s maximum SPL rating. Keep levels and repetitions down, and use hearing protection.</Note>
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'setting')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ═══════════════ 4 · MICROPHONES ═══════════════ */
export function SpkMicrophone(p: PageProps) {
  return GMicrophone(p, {
    intro: 'No brand is required. Choose by what the job needs: the pattern, the power it needs, its size and how it mounts, and the level it is rated for. Dynamics and condensers are both used on speakers — compare them by ear on the cabinet in front of you.',
    mountLine: () => 'Mount: a stand in front of the speaker, kept off the grille cloth',
  });
}

/* ═══════════════ 5 · PLACEMENT ═══════════════ */
const CAB_AXES: AxisWords = {
  x: { label: 'OUT FROM THE GRILLE', short: 'OUT', blurb: 'Toward or away from the cabinet (x). Distances are read from the grille.', fmt: (v) => `${fmtLen(Math.abs(v - G))} ${v >= G ? 'in front of' : 'behind'} the grille` },
  y: { label: 'UP–DOWN', short: 'HEIGHT', blurb: 'Up or down across the speaker (y). Height above the floor is not shown.', fmt: (v) => `${fmtLen(Math.abs(v))} ${v <= 0 ? 'above' : 'below'} the cone axis` },
  z: { label: 'ACROSS', short: 'ACROSS', blurb: 'Left or right across the speaker (z).', fmt: (v) => `${fmtLen(Math.abs(v))} to the ${v >= 0 ? 'right' : 'left'} of the axis` },
};
const AIM_WORDS = { az: 'Swing the front left or right (seen from above).', el: 'Tilt the front up or down (seen from the side).' };

function cabNow(rig: Rig, slots: MicSlot[]): string {
  return slots.map((s) => micSentence(rig, s, { outside: 'outside the cabinet' })).join(' ');
}

export function SpkPlacement({ lesson, answers, onAnswered, onInteractive, interactiveDone, hidden }: PageProps) {
  const L = cabLessons(lesson);
  const motion = useAnimationsAllowed();
  const focused = useFocusedSafe();
  /* WATCH: the worked example on the 1×12, at the dust-cap edge */
  const exZone = L['1x12'].zones.find((z) => z.id === 'cab.boundary')!;
  const ex = useRig(L['1x12'], { variant: 'closed', mics: [{ slot: 'A', typeId: 'instDynCard', pattern: 'cardioid', pose: exZone.start }] });
  const [exView, setExView] = useState<ViewId>('side');
  const [exStep, setExStep] = useState(0);
  const exShown = ex.shown('A');
  const worked: { title: string; text: string; cell: number }[] = [
    { title: 'WHERE TO BEGIN', text: `${exZone.label}. After our research, this is one place we recommend you begin with a cabinet — a starting point, not a rule, and not a promise of a sound.`, cell: 3 },
    { title: 'THE SPEAKER', text: 'In front of the speaker that is really sounding — marked from outside the grille with the amp off or muted. In a cabinet with several, ask which one.', cell: 1 },
    { title: 'THE DISTANCE', text: `${exZone.band} The readout measures from the grille cloth to the mic’s FRONT, rounded to ≈ 5 mm.`, cell: 0 },
    { title: 'ACROSS THE CONE', text: 'Off the cone axis by the dust cap’s radius: aimed at the line where the dust cap meets the cone. The bezel reads how far off the axis the mic sits.', cell: 1 },
    { title: 'THE AIM', text: `Facing the speaker — the lab counts anything within ±${exZone.aim?.maxOffAxis ?? 20}°. Distance, the spot across the cone and the angle are separate things to try.`, cell: 2 },
    { title: 'CLEARANCE', text: 'Off the grille cloth — never touching it — on a secure stand, the cable routed away from the player’s feet and the walkway. With the amp off or muted while you place it.', cell: 3 },
  ];
  const wk = worked[exStep];
  const exBezel: BezelItem[] = placementBezel(exShown, readoutWords(ex, 'A'), exZone, stopShortOf(L['1x12'].model)).map((c, i) => (i === wk.cell ? { ...c, k: `▸ ${c.k}`, tint: '#ffc64d' } : c));

  /* PLACE: one rig per cabinet; the dock edits the chosen one */
  const [cabId, setCabId] = useState('1x12:closed');
  const cab = CAB_CHOICES.find((c) => c.id === cabId)!;
  const r112 = useRig(L['1x12'], { variant: 'closed', mics: [{ slot: 'A', typeId: 'instDynCard', pattern: 'cardioid', pose: L['1x12'].zones.find((z) => z.id === 'cab.close')!.start }] });
  const r412 = useRig(L['4x12'], { variant: 'closed', mics: [{ slot: 'A', typeId: 'instDynCard', pattern: 'cardioid', pose: L['4x12'].zones.find((z) => z.id === 'cab.close')!.start }] });
  const rBass = useRig(L.bass410, { variant: 'closed', mics: [{ slot: 'A', typeId: 'kickDynCard', pattern: 'cardioid', pose: L.bass410.zones.find((z) => z.id === 'cab.close')!.start }] });
  const rig = cab.kind === '1x12' ? r112 : cab.kind === '4x12' ? r412 : rBass;
  useEffect(() => {
    if (cab.kind === '1x12' && r112.variant !== cab.back) r112.setVariant(cab.back);
  }, [cab, r112]);
  const [view, setView] = useState<ViewId>('side');
  const [posAxis, setPosAxis] = useState<PosAxis>('x');
  const [aimAxis, setAimAxis] = useState<AimAxis>('el');
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set());
  const [predicted, setPredicted] = useState<string | null>(null);
  const mic = rig.mics[0];
  const t = micType(mic.typeId);
  const r0 = rig.readouts('A');
  const zone = r0.zoneId ? rig.lesson.zones.find((z) => z.id === r0.zoneId) ?? null : null;
  useEffect(() => {
    if (zone && zone.refSurface !== rig.surfaceId) rig.setSurfaceId(zone.refSurface);
  }, [zone, rig]);
  const shown = rig.shown('A');
  const lastVersion = useRef(-1);
  useEffect(() => {
    if (rig.version === lastVersion.current) return;
    lastVersion.current = rig.version;
    if (r0.zoneId && !r0.blocked) setVisited((prev) => (prev.has(r0.zoneId!) ? prev : new Set([...prev, r0.zoneId!])));
  }, [rig.version, r0.zoneId, r0.blocked]);
  const available = zonesAvailable(rig.lesson.zones, rig.variant, mic.typeId, t.mount);
  const azCentre = mic.pose.az > 90 || mic.pose.az < -90 ? 180 : 0;
  const params: DockParam[] = [
    ...posParams({ rig, slot: 'A', posAxis, setPosAxis, aimAxis, setAimAxis, words: CAB_AXES, aimWords: AIM_WORDS, azCentre }),
    ...viewToggle({ view: view, setView: setView, stage: 'dual' }),
    {
      kind: 'group',
      id: 'setup',
      label: 'SETUP',
      valueLabel: t.short,
      render: () => (
        <View style={styles.tray}>
          <Text style={styles.trayHead}>MIC TYPE</Text>
          <View style={styles.chips}>
            {lesson.micTypeIds.map((id) => (
              <Chip key={id} on={id === mic.typeId} label={MIC_TYPES[id].label} onPress={() => rig.setType('A', id)} />
            ))}
          </View>
          <Text style={styles.trayHead}>CABINET</Text>
          <View style={styles.chips}>
            {CAB_CHOICES.map((c) => (
              <Chip key={c.id} on={c.id === cabId} label={c.label} onPress={() => setCabId(c.id)} />
            ))}
          </View>
          <Text style={styles.trayHead}>MEASURE FROM (when not in a zone)</Text>
          <View style={styles.chips}>
            {rig.lesson.model.surfaces
              .filter((s) => s.id !== 'back' || rig.variant === 'open')
              .map((s) => (
                <Chip key={s.id} on={s.id === rig.surfaceId} label={s.label} onPress={() => rig.setSurfaceId(s.id)} />
              ))}
          </View>
        </View>
      ),
    },
    {
      kind: 'options',
      id: 'zone',
      label: 'ZONE',
      valueLabel: zone ? 'IN ZONE' : 'GO TO',
      selectedId: zone?.id ?? null,
      onSelect: (id) => {
        const z = rig.lesson.zones.find((q) => q.id === id);
        if (z) rig.jumpTo('A', z.start);
      },
      options: available.map((z) => ({ id: z.id, label: z.label, blurb: z.band })),
    },
  ];
  const bezel: BezelItem[] = placementBezel(shown, readoutWords(rig, 'A'), zone, stopShortOf(rig.lesson.model));

  /* ROTARY: build the pickup from outside, with the cabinet off */
  const les = useLeslieRig({ motion, hidden, focused, start: 'stop' });
  const [arr, setArr] = useState<LeslieArrangement>('upper');
  const [dNorm, setDNorm] = useState(0.4);
  const dClose = Math.round(20 + dNorm * (LESLIE_RANGES.close.max + 60 - 20));
  const [lowerFace, setLowerFace] = useState<'front' | 'back'>('front');
  const [power, setPower] = useState(false);
  const [lView, setLView] = useState<LeslieView>('plan');
  const mics = useMemo(() => leslieMics(arr, dClose, dClose, lowerFace), [arr, dClose, lowerFace]);
  const allIn = mics.every((m) => inRange(arr, m));
  const hasLower = mics.some((m) => m.level === 'lower');
  const [built, setBuilt] = useState(false);
  useEffect(() => {
    if (!power && hasLower && allIn && arr !== 'room') setBuilt(true);
  }, [power, hasLower, allIn, arr]);
  useEffect(() => {
    if (!power) {
      les.pause();
      if (les.mode !== 'stop') les.setMode('stop');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [power]);
  useEffect(() => {
    if (visited.size >= 2 && built && !interactiveDone.has('twoZones')) onInteractive('twoZones');
  }, [visited, built, interactiveDone, onInteractive]);
  const ARR: { id: LeslieArrangement; label: string; blurb: string }[] = [
    { id: 'upper', label: 'ONE MIC, UPPER', blurb: 'One mic outside the upper louvers — when one channel is all there is. The low register may be thin.' },
    { id: 'upperLower', label: 'UPPER + LOWER', blurb: 'One mic at the upper louvers, one at a lower opening: articulation and body. Check the blend in mono.' },
    { id: 'xyLower', label: 'X/Y UPPER + LOWER', blurb: 'A coincident X/Y pair outside the upper louvers, and one lower mic: steadier in mono.' },
    { id: 'sidesLower', label: 'TWO SIDES + LOWER', blurb: 'One upper mic at each side, and one lower mic: a wider, moving picture — check it in mono.' },
    { id: 'room', label: 'A PAIR FARTHER BACK', blurb: 'In a good, quiet room: a pair about 2 m away for the cabinet and the room together.' },
  ];
  const leslieBezel: BezelItem[] = [
    { k: 'MICS', v: `${mics.length}`, sub: arr === 'room' ? 'about 2 m away' : hasLower ? 'upper + lower' : 'upper only', flex: 1 },
    { k: 'DISTANCE', v: arr === 'room' ? '≈ 2 m' : lenCell(dClose).v, sub: arr === 'room' ? undefined : lenCell(dClose).sub, flex: 1.2 },
    { k: 'RANGE', v: allIn ? 'IN RANGE' : 'CHECK', tint: allIn ? '#6fa8ff' : '#ffc64d', flex: 1.1 },
    { k: 'CABINET', v: power ? 'ON' : 'OFF', tint: power ? '#5bff85' : undefined, flex: 0.9 },
  ];
  // Cabinet ON: only RUN, SPEED, the switch and the view (no mic moves while
  // it runs). OFF: the pickup controls.
  const onParams: DockParam[] = [
    { kind: 'toggle', id: 'power', label: 'CABINET ON', value: true, onToggle: () => setPower(false) },
    les.motion
      ? { kind: 'action', id: 'run', label: les.running ? 'PAUSE' : 'RUN', onPress: () => (les.running ? les.pause() : (les.setMode(les.mode === 'stop' ? 'slow' : les.mode), les.run())), tint: colors.green }
      : { kind: 'action', id: 'step', label: 'STEP', onPress: () => (les.mode === 'stop' ? les.setMode('slow') : les.step()), tint: colors.green },
    { kind: 'options', id: 'speed', label: 'SPEED', valueLabel: les.mode === 'fast' ? 'FAST' : les.mode === 'slow' ? 'SLOW' : 'STOP', selectedId: les.mode, onSelect: (id: string) => les.setMode(id as RotorMode), options: [{ id: 'slow', label: 'SLOW (CHORALE)' }, { id: 'fast', label: 'FAST (TREMOLO)' }, { id: 'stop', label: 'STOP' }] },
    { kind: 'options', id: 'view', label: 'VIEW', valueLabel: lView === 'plan' ? 'ABOVE' : 'FRONT', selectedId: lView, onSelect: (id) => setLView(id as LeslieView), options: [{ id: 'plan', label: 'FROM ABOVE', blurb: 'Both rotor levels, and the mics round them.' }, { id: 'front', label: 'FROM THE FRONT', blurb: 'The mics at their heights.' }] },
  ];
  const offParams: DockParam[] = [
    {
      kind: 'options',
      id: 'arr',
      label: 'PICKUP',
      valueLabel: ARR.find((a) => a.id === arr)!.label.slice(0, 10),
      selectedId: arr,
      onSelect: (id) => {
        if (power) return;
        setArr(id as LeslieArrangement);
      },
      sticky: true,
      options: ARR.map((a) => ({ id: a.id, label: a.label, blurb: power ? 'Switch the cabinet OFF before moving a mic.' : a.blurb })),
    },
    {
      kind: 'fader',
      id: 'dist',
      label: 'DISTANCE',
      value: dNorm,
      onChange: (v) => {
        if (power) return;
        setDNorm(v);
      },
      format: () => (power ? 'switch the cabinet OFF to move a mic' : `${fmtLen(dClose)} outside the cabinet`),
      formatShort: () => lenCell(dClose).v.replace('≈ ', ''),
    },
    { kind: 'options', id: 'lower', label: 'LOWER AT', valueLabel: lowerFace === 'front' ? 'FRONT' : 'BACK', selectedId: lowerFace, onSelect: (id) => !power && setLowerFace(id as 'front' | 'back'), options: [{ id: 'front', label: 'FRONT LOWER OPENING', blurb: 'The tables’ usual place for the lower mic.' }, { id: 'back', label: 'BACK LOWER OPENING', blurb: 'An organist’s variation: the lower mic about 7.5 cm (3 in) outside the back opening.' }] },
    { kind: 'toggle', id: 'power', label: 'CABINET OFF', value: false, onToggle: () => setPower(true) },
    { kind: 'options', id: 'view', label: 'VIEW', valueLabel: lView === 'plan' ? 'ABOVE' : 'FRONT', selectedId: lView, onSelect: (id) => setLView(id as LeslieView), options: [{ id: 'plan', label: 'FROM ABOVE', blurb: 'Both rotor levels, and the mics round them.' }, { id: 'front', label: 'FROM THE FRONT', blurb: 'The mics at their heights.' }] },
  ];
  const leslieParams = power ? onParams : offParams;

  const pred = lesson.predictions.placement;
  const tried = predicted != null && visited.size >= 2;
  const steps: MikingStep[] = [
    {
      key: 'watch',
      title: 'Worked example',
      kind: 'WATCH',
      layout: 'rack',
      rack: {
        render: (w, h) => <DualView rig={ex} art={cabArt('1x12')} view={exView} setView={setExView} w={w} h={h} slots={['A']} interactive={false} labelFor={(v) => `${v === 'side' ? 'Side' : 'Top'} view of a 1 by 12 cabinet cut through its speaker. A worked example: the mic is placed for you. ${cabNow(ex, ['A'])}`} />,
        badge: 'WORKED EXAMPLE · placed for you · blue = recommended starting point · dashed lobe = pattern shape',
        bezel: exBezel,
        params: [
          { kind: 'fader', id: 'piece', label: 'STEP', value: exStep / (worked.length - 1), onChange: (v) => setExStep(Math.round(v * (worked.length - 1))), format: () => `${exStep + 1} of ${worked.length} · ${wk.title.toLowerCase()}`, formatShort: () => `${exStep + 1} / ${worked.length}` },
          ...viewToggle({ view: exView, setView: setExView, stage: 'dual' }),
        ],
        initialParam: 'piece',
      },
      well: (
        <>
          <Landing looking="Worked example · an instrument dynamic · a 1 × 12 cabinet" prompt="Step through how this starting point is read, piece by piece. The lit cell on the bezel is the piece being read." />
          <Card>
            <Point title={`${exStep + 1} · ${wk.title}`}>{wk.text}</Point>
          </Card>
          {exStep === worked.length - 1 ? <Note tone="ok">That is the whole reading: where to begin, the speaker, the distance, across the cone, the aim, clearance. Next you place the mic yourself — then build a rotary cabinet’s pickup.</Note> : null}
        </>
      ),
    },
    {
      key: 'place',
      title: 'Place on a cabinet',
      kind: 'PLACE',
      layout: 'rack',
      rack: {
        render: (w, h) => <DualView key={cabId} rig={rig} art={cabArt(cab.kind)} view={view} setView={setView} w={w} h={h} slots={['A']} interactive={!hidden} labelFor={(v) => `${v === 'side' ? 'Side' : 'Top'} view of the ${cab.label.toLowerCase()}, cut through the miked speaker. ${cabNow(rig, ['A'])}`} />,
        badge: 'Blue = recommended starting points · dashed lobe = pattern shape · pinch to zoom',
        bezel,
        params,
        initialParam: 'pos',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={`${t.short} · ${cab.label.toLowerCase()}`} prompt="Drag the mic (or use POSITION and AIM; drag the amber ring to turn it). Rest it in two different blue zones — then move it across the cone and away from it, one change at a time." />
          <NowLine text={cabNow(rig, ['A'])} />
          {shown.blocked ? <Note tone="warn">{`It would touch the ${shown.blocked.label} — the mic stops there. Keep it off the grille cloth.`}</Note> : null}
          {zone ? <ZoneCard z={zone} /> : <Body>{`Not at a recommended starting point. Starting points for this mic: ${available.map((z) => z.label).join('; ')}.`}</Body>}
          <Body>{`Activity: zones rested in, clear of every part — ${visited.size} of 2${visited.size ? ` (${[...visited].map((id) => rig.lesson.zones.find((z) => z.id === id)?.label ?? id).join('; ')})` : ''}.`}</Body>
          {tried ? <Note tone="ok">{`You predicted “${predicted}”. Across the cone at the same distance, the edge most often sounds mellower — and speakers vary, so “it depends on this speaker” is fair too.`}</Note> : null}
          {cab.kind !== '1x12' ? <Note>The zones sit on the miked speaker (ringed on page 1). Placing a mic between two speakers can give strong phase effects — start on one.</Note> : null}
          {cab.kind === 'bass410' ? <Note>A bass cabinet: a low-frequency-capable mic with enough headroom, and listen for what the horn adds — one cone may not represent the whole cabinet.</Note> : null}
        </>
      ),
    },
    {
      key: 'rotary',
      title: 'Build a rotary pickup',
      kind: 'PLACE',
      layout: 'rack',
      rack: {
        render: (w, h) => <LeslieDisplay w={w} h={h} rig={les} view={lView} mics={mics} showStrip={power} accessibilityLabel={`The rotary cabinet ${lView === 'plan' ? 'from above, both rotor levels' : 'from the front'}, with ${mics.length} mic${mics.length === 1 ? '' : 's'} outside: ${mics.map((m) => `${m.label}, ${fmtLen(distanceFromCabinet(m))} out`).join('; ')}. The cabinet is ${power ? 'on' : 'off'}.`} />,
        badge: power ? 'Cabinet ON · a mic lights while a horn bell (or the drum’s opening) points at it · no mic moves while it runs' : 'Cabinet OFF · place every mic outside, clear of the openings · amber = a mic',
        bezel: leslieBezel,
        params: leslieParams,
        initialParam: 'dist',
      },
      well: (
        <>
          <Landing looking={`The rotary cabinet · ${ARR.find((a) => a.id === arr)!.label.toLowerCase()}`} prompt={power ? 'Run it, slow then fast: watch which mic each bell points at as it turns. Switch the cabinet OFF to move a mic.' : 'With the cabinet OFF, choose a PICKUP and set the DISTANCE. Build an upper-and-lower pickup inside the starting range — then switch it on.'} />
          <Card>
            <Point title="WHERE WE RECOMMEND YOU BEGIN">{`Start about 7.5–30 cm (3–12 in) outside the upper louvers, and the same outside a lower opening. Side mics can sit from a few centimetres to about 30 cm out, just under the top louvers. A pair farther back: about 2 m, in a good room.`}</Point>
          </Card>
          <Body>{`Activity: an upper-and-lower pickup built outside, in range, with the cabinet off — ${built ? 'done' : 'not yet'}.`}</Body>
          {!allIn ? <Note tone="warn">{mics.some((m) => distanceFromCabinet(m) < LESLIE_RANGES.close.min && m.level !== 'room') ? 'Closer than the starting range: keep every mic clear of the openings and the moving air — move it out.' : 'Farther than the starting range: try it closer, from outside.'}</Note> : null}
          {arr === 'sidesLower' ? <Note>Two side mics hear the horn turn toward one, then the other: a wide, moving picture in stereo that can sound uneven in mono. Check the mono sum through a full turn and a speed change.</Note> : null}
          {arr === 'xyLower' ? <Note>An X/Y pair: two directional capsules as close together as their mounts allow without touching, angled apart — a steadier mono sum than a spaced pair.</Note> : null}
          {arr === 'upper' ? <Note>One upper mic carries the horn’s highs; the low register may be thin. Compare the full range and the speed changes.</Note> : null}
          <Note tone="warn">Never push a mic, cable, finger or tool through a louver, and do not take a panel off. Keep cables off the cabinet and out of the moving air, and do not reach toward it while it runs. A lower mic can catch thumps from the moving air — angle or move it from outside, or try a windscreen if the mic allows.</Note>
        </>
      ),
    },
    {
      key: 'learn',
      title: 'How zones work',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Body>What you just did, in words. After our research, each blue zone is where we recommend you begin, measured from the grille in front of the speaker that is really sounding. They are starting points, not rules: move from there and listen — there is no single right answer, and every speaker and cabinet is different.</Body>
          <Body>Change one thing at a time. Keep the distance and move across the cone — centre, dust-cap edge, toward the edge — or keep the spot and move away from the grille. A mic farther back hears more of the cabinet and the room; a mic moved toward the edge most often sounds mellower. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.</Body>
          <Body>On a rotary cabinet: start with each mic alone, then add the lower to the upper at a useful level and check the blend in mono — through slow, fast and the change between them.</Body>
          <Note tone="warn">Clearance comes first: off the grille cloth, the stand steady, the cable away from the player and the walkway; on a rotary cabinet everything outside, with the cabinet off while you place it.</Note>
        </>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'placement')} answers={answers} onAnswered={onAnswered} />,
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ═══════════════ 6a · STUDIO OR LIVE ═══════════════ */
const NULL_TOL = 15;
const AZ_MAX = 45;
const EL_MAX = 30;
const PATTERNS: { id: PatternId; label: string }[] = [
  { id: 'cardioid', label: 'cardioid' },
  { id: 'supercardioid', label: 'supercardioid' },
  { id: 'hypercardioid', label: 'hypercardioid' },
];

export function SpkContext({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const L = cabLessons(lesson);
  const z = L['1x12'].zones.find((q) => q.id === 'cab.close')!;
  // The mic starts angled in at the cone from one side (25°): its back is not
  // yet toward the wedge — the learner turns it.
  const rig = useRig(L['1x12'], { variant: 'closed', mics: [{ slot: 'A', typeId: 'instDynCard', pattern: 'cardioid', pose: { p: { x: G + 70, y: 0, z: -45 }, az: 25, el: 0 } }] });
  const [live, setLive] = useState(true);
  const [pattern, setPattern] = useState<PatternId>('cardioid');
  const [wedgeId, setWedgeId] = useState(lesson.live.wedges[0]?.id ?? '');
  const [view, setView] = useState<ViewId>('top');
  const [aimAxis, setAimAxis] = useState<'az' | 'el'>('az');
  const [predicted, setPredicted] = useState<string | null>(null);
  const [aimed, setAimed] = useState(false);
  const pose = rig.mics[0].pose;
  const wedge = lesson.live.wedges.find((w) => w.id === wedgeId) ?? lesson.live.wedges[0];
  const src: Vec3 = useMemo(() => ({ x: wedge.p.x, y: wedge.p.y - wedge.lift, z: wedge.p.z }), [wedge]);
  const theta = arrivalAngle(pose, src);
  const db = gainDb(pattern, theta);
  const inNull = nearNull(pattern, theta, NULL_TOL);
  const nulls = nullAngles(pattern);
  const tried = predicted != null && aimed;
  useEffect(() => {
    if (live && wedge.id === 'guitarWedge' && inNull && aimed && !interactiveDone.has('wedgeInNull')) onInteractive('wedgeInNull');
  }, [live, wedge.id, inNull, aimed, interactiveDone, onInteractive]);
  useEffect(() => {
    if (rig.mics[0].pattern !== pattern) rig.setPattern('A', pattern as MicPattern);
  }, [pattern, rig]);
  const a = aimAxis === 'az' ? pose.az : pose.el;
  const lim = aimAxis === 'az' ? AZ_MAX : EL_MAX;
  const FLOOR = L['1x12'].model.yFloor.mm;
  const PLAN: ViewBox = wedge.id === 'sideFill' ? { u0: -500, u1: 2250, v0: -1850, v1: 650 } : { u0: -500, u1: 2250, v0: -800, v1: 800 };
  const SIDE: ViewBox = { u0: -500, u1: 2250, v0: -520, v1: FLOOR + 40 };
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'aim',
      label: 'AIM',
      value: (a + lim) / (2 * lim),
      home: 0.5,
      // Preview while the finger rides the lane, commit on release (the
      // engine's fader contract, 2026-10-06: no page re-render per move).
      onChange: (v) => {
        const ang = Math.round((v * 2 - 1) * lim);
        rig.preview('A', aimAxis === 'az' ? { ...pose, az: ang } : { ...pose, el: ang });
      },
      onCommit: () => {
        rig.commit('A');
        setAimed(true);
      },
      format: (v) => {
        const x = Math.round((v * 2 - 1) * lim);
        return x === 0 ? 'facing the speaker' : `${fmtAngle(Math.abs(x))} ${aimAxis === 'az' ? (x > 0 ? 'right' : 'left') : x > 0 ? 'up' : 'down'}`;
      },
      formatShort: () => fmtAngle(a),
      chooser: {
        title: 'TURN THE MIC',
        selectedId: aimAxis,
        onSelect: (id) => setAimAxis(id as 'az' | 'el'),
        options: [
          { id: 'az', label: 'LEFT–RIGHT', blurb: `Swing the front up to ${AZ_MAX}° either way — it still faces the speaker.` },
          { id: 'el', label: 'UP–DOWN', blurb: `Tilt the front up to ${EL_MAX}° up or down.` },
        ],
      },
    },
    {
      kind: 'options',
      id: 'pattern',
      label: 'PATTERN',
      valueLabel: pattern === 'cardioid' ? 'CARDIOID' : pattern === 'supercardioid' ? 'SUPER' : 'HYPER',
      selectedId: pattern,
      onSelect: (id) => {
        setPattern(id as PatternId);
        setAimed(true);
      },
      sticky: true,
      options: PATTERNS.map((p) => ({ id: p.id, label: p.label, blurb: `A cabinet mic with a ${p.id} pattern, drawn as a simplified shape. Its null sits at ≈ ${Math.round(nullAngles(p.id)[0])}° off the front axis.` })),
    },
    { kind: 'options', id: 'wedge', label: 'MONITOR', valueLabel: wedge.short, selectedId: wedge.id, onSelect: setWedgeId, sticky: true, options: lesson.live.wedges.map((w) => ({ id: w.id, label: w.label, blurb: w.note })) },
    { kind: 'toggle', id: 'scenario', label: live ? 'LIVE' : 'STUDIO', value: live, onToggle: () => setLive((x) => !x) },
    ...viewToggle({ view: view, setView: setView, stage: 'single' }),
  ];
  const bezel: BezelItem[] = live
    ? [
        { k: 'OFF AXIS', v: `≈ ${Math.round(theta / 5) * 5}°`, sub: 'monitor', flex: 1 },
        isDeepNull(db) ? { k: 'PICKUP', v: 'DEEP NULL', flex: 1.15 } : { k: 'PICKUP', v: fmtDb(db), flex: 1.15 },
        { k: 'NULL', v: tried ? `≈ ${Math.round(nulls[0])}°` : '?', flex: 0.8 },
        { k: 'REJECTION', v: inNull ? 'IN NULL' : 'NO', tint: inNull ? '#5bff85' : undefined, flex: 1.15 },
      ]
    : [
        { k: 'SCENARIO', v: 'STUDIO' },
        { k: 'PATTERN', v: pattern.toUpperCase() },
      ];
  const label = `${view === 'top' ? 'Top' : 'Side'} view: the 1 by 12 cabinet with a mic in front of its speaker. ${live ? `${wedge.label}, ${Math.round(theta)} degrees off the mic's front axis: ${fmtIdealPickup(db)}${inNull ? ', in the rejection region' : ''}.` : 'Studio: no monitor.'}`;
  const pred = lesson.predictions.context;
  const studioCard = lesson.scenarios.filter((s) => s.id === 'spk.ctx.studio');
  const steps: MikingStep[] = [
    {
      key: 'live',
      title: 'Aim the rejection',
      kind: 'LIVE',
      layout: 'rack',
      rack: {
        render: (w, h) => <PlacementScene rig={rig} art={cabArt('1x12')} view={view} w={w} h={h} slots={['A']} showZones={false} interactive={false} boxOverride={view === 'top' ? PLAN : SIDE} wedge={live ? { at: wedge.p, faces: wedge.faces, src } : null} showLabels={false} accessibilityLabel={label} />,
        badge: `A simplified pattern (white dashed: shape, not range) · monitors where a stage often puts them · counts within ±${NULL_TOL}° of a null`,
        bezel,
        params,
        initialParam: 'aim',
      },
      well: live ? (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={`Top view · a mic in front of the speaker · ${wedge.short.toLowerCase()}`} prompt="The monitor stays where the player needs it. Turn the MIC (AIM) or change its PATTERN until the guitarist’s wedge sits in the rejection." />
          <Body>{`Activity: ${interactiveDone.has('wedgeInNull') ? 'done — the wedge sat in a null by your aim or pattern' : 'not yet'}.`}</Body>
          {wedge.id === 'sideFill' ? <Note tone="warn">{wedge.note}</Note> : null}
          {isDeepNull(db) ? <Note>On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence.</Note> : null}
          {tried ? (pattern === 'cardioid' ? <Note tone="ok">What you just saw: a cardioid rejects most directly behind (180°) — exactly where a mic facing the cabinet points its back at a downstage wedge.</Note> : <Note tone="ok">{`What you just saw: a ${pattern} rejects most at ≈ ${Math.round(nulls[0])}° — toward the rear but OFF the axis — and picks up a little directly behind (${fmtDb(gainDb(pattern, 180))}). With the wedge straight behind, the cardioid suits it better here.`}</Note>) : null}
        </>
      ) : (
        <>
          <Landing looking="Studio · no monitor" prompt="A studio session has no wedge to reject. The decision changes: what is the room worth?" />
          <ScenarioList items={studioCard} answers={answers} onAnswered={onAnswered} />
          <Note>In a studio you have time to compare positions with the player stopped; a farther mic or a pair can add a useful room. Switch back to LIVE for the monitor exercise.</Note>
        </>
      ),
    },
    {
      key: 'learn',
      title: 'Studio and live',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Body>These are scenario-based comparisons, not restrictions.</Body>
          <Card>
            <Point title="A GUITAR OR BASS CABINET">Studio: a close mic gives isolation in a dense mix; a farther mic can add the cabinet and the room. Live: a close, directional mic is often more controllable — but look at the real PA and monitor positions.</Point>
            <Point title="A ROTARY CABINET, STUDIO">A farther perspective or a room pair can suit a good room. Keep a close upper-and-lower option if it shares the room with other players, and check the stereo picture in mono — especially for broadcast or a single speaker.</Point>
            <Point title="A ROTARY CABINET, LIVE">Stable stands outside, usable gain, nothing in the players’ or crew’s way. A mono PA can use one upper and one lower channel; a stereo upper pair is optional. Room mics hear the PA and cut the feedback margin.</Point>
            <Point title="WHAT TO SEND">The cabinets are already loud in the room: reinforce only what the audience needs. Let the system operator route the PA, wedges, in-ears and recording separately.</Point>
          </Card>
          <Note tone="warn">No mic position alone prevents feedback: the monitors and PA, the gain, the room and the open mics all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.</Note>
        </>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'context' && s.id !== 'spk.ctx.studio')} answers={answers} onAnswered={onAnswered} />,
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ═══════════════ 6b · TWO MICROPHONES ═══════════════ */
export function SpkTwoMic({ lesson, answers, onAnswered, onInteractive, interactiveDone, hidden }: PageProps) {
  const L = cabLessons(lesson);
  const zl = L['1x12'].zones;
  const front = zl.find((z) => z.id === 'cab.boundary')!;
  const rear = zl.find((z) => z.id === 'cab.rear')!;
  const rig = useRig(L['1x12'], {
    variant: 'open',
    mics: [
      { slot: 'A', typeId: 'instDynCard', pattern: 'cardioid', pose: front.start },
      { slot: 'B', typeId: 'instDynCard', pattern: 'cardioid', pose: rear.start },
    ],
  });
  const [view, setView] = useState<ViewId>('side');
  const [slot, setSlot] = useState<MicSlot>('B');
  const [posAxis, setPosAxis] = useState<PosAxis>('x');
  const [aimAxis, setAimAxis] = useState<AimAxis>('el');
  // The readouts measure from the surface the EDITED mic faces: the grille
  // for the front mic, the open back for the rear one.
  useEffect(() => {
    const want = slot === 'B' ? 'back' : 'grille';
    if (rig.surfaceId !== want) rig.setSurfaceId(want);
  }, [slot, rig]);
  const model = L['1x12'].model;
  const sFront = model.regions.find((r) => r.id === 'r.cone')!.anchor;
  const sBack = model.regions.find((r) => r.id === 'r.back')!.anchor;
  const A = rig.mics.find((m) => m.slot === 'A')!;
  const B = rig.mics.find((m) => m.slot === 'B')!;
  const dMm = dist(B.pose.p, sBack) - dist(A.pose.p, sFront);
  const dt = deltaTms(dMm);
  const equal = Math.abs(dMm) < EQUAL_PATH_MM;
  const gainOf = (pose: MicPose, s: Vec3, p: MicPattern) => {
    const r = Math.max(1, dist(pose.p, s)) / 1000;
    return Math.max(0.001, Math.abs(p === 'cardioid' ? 0.5 + 0.5 * Math.cos((arrivalAngle(pose, s) * Math.PI) / 180) : 1)) / r;
  };
  const gA = gainOf(A.pose, sFront, A.pattern);
  const gB = gainOf(B.pose, sBack, B.pattern);
  // The back of the cone is the same motion, opposite in sign: the sum's
  // EFFECTIVE polarity is the switch times −1.
  const sEff = (B.polarity * -1) as 1 | -1;
  const first = equal ? null : notchesHz(dt, sEff, 20000, 4)[sEff === 1 ? 0 : 1] ?? null;
  const dt0 = useRef(dt);
  const [flips, setFlips] = useState({ toInv: false, toNorm: false });
  const [predicted, setPredicted] = useState<string | null>(null);
  const moved = Math.abs(dt - dt0.current) > 0.05;
  useEffect(() => {
    if (flips.toInv && flips.toNorm && moved && !interactiveDone.has('polarityVsDelay')) onInteractive('polarityVsDelay');
  }, [flips, moved, interactiveDone, onInteractive]);
  const azCentre = rig.mics.find((m) => m.slot === slot)!.pose.az > 90 ? 180 : 0;
  const params: DockParam[] = [
    ...posParams({ rig, slot, posAxis, setPosAxis, aimAxis, setAimAxis, words: CAB_AXES, aimWords: AIM_WORDS, azCentre }),
    { kind: 'toggle', id: 'mic', label: slot === 'A' ? 'EDIT FRONT' : 'EDIT REAR', value: slot === 'B', onToggle: () => setSlot((s) => (s === 'A' ? 'B' : 'A')) },
    {
      kind: 'toggle',
      id: 'polarity',
      label: B.polarity === 1 ? 'REAR POL +' : 'REAR POL −',
      value: B.polarity === -1,
      onToggle: () => {
        const next = B.polarity === 1 ? -1 : 1;
        rig.setPolarity('B', next);
        setFlips((f) => (next === -1 ? { ...f, toInv: true } : { ...f, toNorm: true }));
      },
    },
    ...viewToggle({ view: view, setView: setView, stage: 'dual' }),
  ];
  const dCell = lenCell(dMm, true);
  const bezel: BezelItem[] = [
    { k: 'PATH Δd R−F', v: equal ? 'NONE' : dCell.v, sub: equal ? 'same path' : dCell.sub, flex: 1.35 },
    { k: 'DELAY Δt', v: equal ? '0 ms' : fmtMs(dt).replace('≈ ', `≈ ${dt > 0 ? '+' : '−'}`), sub: equal ? 'no comb' : dt > 0 ? 'rear later' : 'rear earlier', flex: 1.3 },
    { k: '1ST NOTCH', v: equal ? (sEff === -1 ? 'CANCELS' : 'NO COMB') : first == null ? 'OVER 20 kHz' : `≈ ${fmtHz(first)}`, flex: 1.15 },
    { k: 'REAR', v: B.polarity === 1 ? 'SWITCH +' : 'SWITCH −', sub: sEff === 1 ? 'sum: in step' : 'sum: opposed', tint: sEff === 1 ? '#5bff85' : '#ff6b5e', flex: 1.2 },
  ];
  const [wellW, setWellW] = useState(0);
  const combLabel = `Simplified sum of the front and rear mics: ${equal ? 'no path difference' : `path difference ${fmtLen(Math.abs(dMm))}, delay ${fmtMs(dt)}`}; the rear polarity switch is ${B.polarity === 1 ? 'normal, so the sum is opposed' : 'inverted, so the sum is in step'}${first ? `; first notch about ${fmtHz(first)}` : ''}.`;
  const pred = lesson.predictions.twoMic;
  const tick = (on: boolean) => (on ? '✓' : '○');
  const steps: MikingStep[] = [
    {
      key: 'pair',
      title: 'Front and rear',
      kind: 'PAIR',
      layout: 'rack',
      rack: {
        render: (w, h) => <DualView rig={rig} art={cabArt('1x12')} view={view} setView={setView} w={w} h={h} slots={['A', 'B']} showZones={false} interactive={!hidden} labelFor={(v) => `${v === 'side' ? 'Side' : 'Top'} view of the open-backed 1 by 12 cabinet, a mic in front and a mic behind. ${cabNow(rig, ['A', 'B'])}`} />,
        badge: `A simplified picture · each mic hears its own side of the cone · c = ${C20.toFixed(1)} m/s, 20 °C`,
        bezel,
        params,
        initialParam: 'pos',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking="An open-backed 1 × 12 · mic A in front, mic B behind" prompt="Flip REAR POLARITY both ways, then move a mic. Watch which readout each action changes." />
          <Text style={styles.activity} accessibilityLabel={`Activity: polarity to minus ${flips.toInv ? 'done' : 'not yet'}, back to plus ${flips.toNorm ? 'done' : 'not yet'}, mic moved ${moved ? 'done' : 'not yet'}.`}>
            {`Activity: polarity → − ${tick(flips.toInv)} · back to + ${tick(flips.toNorm)} · mic moved ${tick(moved)}`}
          </Text>
          <NowLine text={cabNow(rig, ['A', 'B'])} />
          <View onLayout={(e) => setWellW(Math.round(e.nativeEvent.layout.width))}>{wellW > 0 ? <PairComb w={wellW} h={150} dtMs={dt} gA={gA} gB={gB} sEff={sEff} label={combLabel} /> : null}</View>
          <Body>{B.polarity === 1 ? 'With the rear switch at +, the two arrive OPPOSED: the back of the cone is the same motion, inverted. The lows cancel most — thin.' : 'With the rear switch at −, the inversion is undone: the two arrive in step, and only the delay is left — its notches sit higher up.'}</Body>
          {predicted != null && (flips.toInv || flips.toNorm) ? <Note tone="ok">{`You predicted “${predicted}”. Δt did not change when you flipped polarity — only moving a mic changes it. Polarity flips the sign: it moves the notches, it does not remove the delay.`}</Note> : null}
          <Note tone="warn">Each mic really hears its own side of the cone AND the room, so this graph shows only the shared part, not what the pair will sound like. Judge it by ear, in mono, at matched levels.</Note>
        </>
      ),
    },
    {
      key: 'rotary',
      title: 'Rotary mics in mono',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="UPPER + LOWER">Start with each mic alone. Add the lower to the upper at a musically useful level, then check that the low register and the organ’s articulation stay clear — in mono, through slow, fast and the change.</Point>
            <Point title="AN X/Y PAIR">Directional capsules as close to coincident as their mounts safely allow, without touching, angled for the louvers you want to cover. The arrivals line up, so the mono sum stays steadier.</Point>
            <Point title="SPACED SIDE MICS">As the horn turns it faces one mic, then the other: a larger, more moving picture in stereo — and time differences and room pickup that can colour the mono sum. Listen through a whole rotation.</Point>
          </Card>
          <Note>A polarity flip is a diagnostic, not a general repair for different arrival times. Panning is a separate decision from the pickup: the lower channel is often centred, but the balance depends on the arrangement.</Note>
        </>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'twoMic')} answers={answers} onAnswered={onAnswered} />,
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ═══════════════ 7 · PRACTICE ═══════════════ */
export function SpkPractice(p: PageProps) {
  return GPractice(p, {
    orderNote: 'A one-mic cabinet setup, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'spk.prac.gain',
    secondId: 'spk.prac.3',
    mixIds: ['spk.mix.1', 'spk.mix.2', 'spk.mix.3'],
    mixIntro: 'Three cards from earlier pages, mixed: a reference surface, what to send live, and polarity versus delay.',
    sheetNote: 'For a real amp or cabinet, with the player’s agreement and the amp off or muted while anything moves. Write tendencies in words — what you heard, not a promised result.',
  });
}

export const SPK_PAGES = {
  instrument: SpkInstrument,
  sound: SpkSound,
  setting: SpkSetting,
  microphone: SpkMicrophone,
  placement: SpkPlacement,
  context: SpkContext,
  twoMic: SpkTwoMic,
  troubleshoot: PTroubleshoot,
  practice: SpkPractice,
};

const styles = StyleSheet.create({
  tray: { gap: 6, paddingVertical: 4 },
  trayHead: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  activity: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
});
