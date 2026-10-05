/**
 * THE AMPLIFIED CHAIN — one set of journey pages for Lab 4's electric string
 * lessons (C02 electric guitar, C08 electric bass, C04 pedal and lap steel),
 * on the Kick journey (LESSON_JOURNEY.md): meet → how it sounds → where it
 * sits → microphones → placement (worked example first) → advanced →
 * practice. Each lesson hands `makeAmpPages` its own words and choices; the
 * miked source is always the AMPLIFIER'S SPEAKER (the speaker family,
 * reused), and a DI or an amp's direct output is drawn and taught as its own,
 * separate electrical path.
 *
 *   1 MEET         start · what it is · the instrument's parts · the amp's parts
 *   2 HOW IT SOUNDS the string and the pickup (harmonics; a steel's bar and
 *                  pedal) · signal to air (the cone, stepped) · how it spreads
 *                  · centre and edge · air, not wire + checks
 *   3 WHERE IT SITS the signal path (air apart from the DI; the one patch that
 *                  is never made) · stage and studio · before any mic + checks
 *   4 MICROPHONES  shared piece (journeyPages.GMicrophone)
 *   5 PLACEMENT    worked example · place on the amp · how zones work · checks
 *   6 ADVANCED     studio or live (aim the rejection) · two sources (front +
 *                  open back, or mic + DI: polarity vs delay) · troubleshoot
 *   7 PRACTICE     shared piece (journeyPages.GPractice)
 *
 * FULLY SILENT; nothing loops (D8): the cone plays ONCE, the string is swung
 * by hand.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { cancelAnimation, Easing, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, fonts } from '../../../../../../theme/tokens';
import { useAnimationsAllowed } from '../../../../../../features/settings/a11y';
import { ExpandableFigure } from '../../../../kit/ExpandableFigure';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { MicPattern, MicPose, MicSlot, PageId, PatternId, Vec3, ViewBox, ViewId } from '../../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, NowLine, Point, PredictCard, ScenarioList, ZoneCard } from '../../../engine/kit';
import { useRig, type Rig } from '../../../engine/scene/useRig.ts';
import { DualView } from '../../../engine/scene/DualView';
import { PlacementScene } from '../../../engine/scene/PlacementScene';
import { placementBezel, lenCell } from '../../../engine/scene/readoutText.ts';
import { readoutWords } from '../../../engine/scene/sceneWords.ts';
import { zonesAvailable } from '../../../engine/geometry/zones.ts';
import { dist } from '../../../engine/geometry/vec.ts';
import { arrivalAngle, gainDb, nearNull, nullAngles } from '../../../engine/physics/polar.ts';
import { C20, EQUAL_PATH_MM, deltaTms, notchesHz } from '../../../engine/physics/twoMic.ts';
import { fmtAngle, fmtDb, fmtHz, fmtIdealPickup, fmtLen, fmtMs, isDeepNull } from '../../../engine/model/units.ts';
import { MIC_TYPES, micType } from '../../../data/micTypes';
import { PTroubleshoot } from '../../../pages/PReadPages';
import type { PageProps } from '../../../pages/pageTypes';
import { Chip, GMicrophone, GPractice, factsStep, micSentence, posParams, startStep, type AimAxis, type AxisWords, type MicPageSpec, type PosAxis, type PracticeSpec } from '../journeyPages';
import { CabExplorer, SPOT_WORDS, type CabExplorerView } from '../speakers/CabExplorer';
import { ConeSequence, BeamDisplay } from '../speakers/SpeakerSound';
import { BEAM_F_MAX, BEAM_F_MIN, farFieldFromMm, halfAngle, kaOf, pistonDb } from '../speakers/pistonBeam.ts';
import { CABINETS, GRILLE_X } from '../speakers/speakerModel.ts';
import { ampExtras, ampLessonArt } from '../speakers/ampArt';
import { cabOf, type AmpRig } from '../speakers/ampModel.ts';
import { DiPath } from '../speakers/DiPath';
import { patchVerdict, type ChainSpec } from '../speakers/signalChain.ts';
import { BacklinePlan, type Backline, type BacklineScene } from '../speakers/BacklinePlan';
import { PairComb } from '../speakers/PairComb';
import type { Back } from '../speakers/cabGeometry.ts';
import { ElectricExplorer, electricAspect, type ElectricShow } from './ElectricExplorer';
import { StringDisplay, HARMONICS } from './StringDisplay';
import { atNode, barFor, barHz, pickupWeight } from './stringModel.ts';
import { openHz, type ElectricSpec } from './electricSpec.ts';

const G = GRILLE_X.mm;

function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

export type AmpPart = { id: string; title: string; text: string; shows?: readonly ElectricShow[] };
export type AmpPagesSpec = {
  rig: AmpRig;
  who: Backline;
  /** Page 1's START paragraph. */
  intro: string;
  /** The instrument's views on page 1. */
  shows: readonly { id: ElectricShow; label: string; blurb: string }[];
  instParts: readonly AmpPart[];
  figure: { show: ElectricShow; title: string; badge: string; label: string };
  /** The amp's parts, in the order PART steps through them. */
  ampParts: readonly string[];
  /** What the amp is called in running text ("the combo"). */
  ampNoun: string;
  /** HOW IT SOUNDS: the string drawn (its spec, which string, its name). */
  string: { spec: ElectricSpec; idx: number; name: string; steel?: boolean };
  chain: ChainSpec;
  /** The worked example's zone and mic, and where PLACE starts. */
  workedZone: string;
  placeZone: string;
  micDefault: string;
  /** Page 6b: front + open back, and/or a mic + a DI. */
  pairs: readonly ('rear' | 'di')[];
  mic: MicPageSpec;
  practice: PracticeSpec;
  /** Lesson-specific notes on the sound steps. */
  notes: { beam: string; spots: string; place: string; context: string };
  /** Page 6a's studio-and-live cards (scenario comparisons, not rules). */
  liveCards: readonly { title: string; text: string }[];
};

const AXES: AxisWords = {
  x: { label: 'OUT FROM THE GRILLE', short: 'OUT', blurb: 'Toward or away from the amp (x). Distances are read from the grille.', fmt: (v) => `${fmtLen(Math.abs(v - G))} ${v >= G ? 'in front of' : 'behind'} the grille` },
  y: { label: 'UP–DOWN', short: 'HEIGHT', blurb: 'Up or down across the speaker (y). Height above the floor is not shown.', fmt: (v) => `${fmtLen(Math.abs(v))} ${v <= 0 ? 'above' : 'below'} the cone axis` },
  z: { label: 'ACROSS', short: 'ACROSS', blurb: 'Left or right across the speaker (z).', fmt: (v) => `${fmtLen(Math.abs(v))} to the ${v >= 0 ? 'right' : 'left'} of the axis` },
};
const AIM_WORDS = { az: 'Swing the front left or right (seen from above).', el: 'Tilt the front up or down (seen from the side).' };
const now = (rig: Rig, slots: MicSlot[]) => slots.map((s) => micSentence(rig, s, { outside: 'outside the amp' })).join(' ');

export function makeAmpPages(spec: AmpPagesSpec): Partial<Record<PageId, (p: PageProps) => ReactNode>> {
  const art = ampLessonArt(spec.rig);
  const kind = cabOf(spec.rig);
  const back: Back = spec.rig === 'combo' ? 'open' : 'closed';

  /* ═══════════════ 1 · MEET ═══════════════ */
  function AmpInstrument({ lesson, journey }: PageProps) {
    const [show, setShow] = useState<ElectricShow>(spec.shows[0].id);
    const [partId, setPartId] = useState<string | null>(null);
    const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
    const parts = spec.instParts.filter((p) => !p.shows || p.shows.includes(show));
    const shown = spec.instParts.find((p) => p.id === partId);
    const pick = (id: string) => {
      setPartId(id);
      setSeen((s) => (s.has(id) ? s : new Set([...s, id])));
    };
    const pIdx = Math.max(0, parts.findIndex((p) => p.id === partId));
    const showMeta = spec.shows.find((s) => s.id === show)!;
    /* the amp */
    const [view, setView] = useState<CabExplorerView>('front');
    const [cloth, setCloth] = useState(true);
    const [aPart, setAPart] = useState<string | null>(null);
    const [aSeen, setASeen] = useState<ReadonlySet<string>>(() => new Set());
    const aParts = spec.ampParts.map((id) => lesson.model.parts.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
    const aShown = lesson.model.parts.find((p) => p.id === aPart);
    const aPick = (id: string) => {
      setAPart(id);
      setASeen((s) => (s.has(id) ? s : new Set([...s, id])));
    };
    const aIdx = Math.max(0, aParts.findIndex((p) => p.id === aPart));
    const extras = useMemo(() => ampExtras(spec.rig, aPart), [aPart]);
    const viewOpts = [
      { id: 'front', label: 'FROM THE FRONT', blurb: 'As you meet it, with its grille cloth — switch the cloth off to find the speaker behind it.' },
      { id: 'side', label: 'CUT, FROM THE SIDE', blurb: 'Cut through the miked speaker’s middle: the cone, the magnet, the box and the back.' },
      { id: 'top', label: 'CUT, FROM ABOVE', blurb: 'The same cut seen from above.' },
      { id: 'face', label: 'ONE SPEAKER, FACE-ON', blurb: 'One speaker up close: dust cap, cone, surround and frame.' },
    ];
    const steps: MikingStep[] = [
      startStep(lesson, journey, spec.intro),
      factsStep(
        lesson,
        <ExpandableFigure aspect={electricAspect(spec.figure.show)} title={spec.figure.title} badge={spec.figure.badge} render={(fw, fh) => <ElectricExplorer w={fw} h={fh} show={spec.figure.show} accessibilityLabel={spec.figure.label} />} />,
      ),
      {
        key: 'inst',
        title: 'The instrument',
        kind: 'TRY',
        layout: 'rack',
        rack: {
          render: (w, h) => <ElectricExplorer w={w} h={h} show={show} highlight={partId} pickupLit={null} onTapPart={pick} accessibilityLabel={`${showMeta.label.toLowerCase()}.${shown ? ` Highlighted: the ${shown.title.toLowerCase()}.` : ''}`} />,
          badge: 'A simplified drawing with typical proportions · tap a part',
          bezel: [
            { k: 'PART', v: shown ? shown.title.split(' ')[0] : 'TAP ONE', flex: 1.4 },
            { k: 'LOOKED AT', v: `${[...seen].filter((id) => spec.instParts.some((p) => p.id === id)).length} / ${spec.instParts.length}` },
            { k: 'VIEW', v: showMeta.label.split(' ')[0], flex: 1.1 },
          ],
          params: [
            {
              kind: 'fader',
              id: 'part',
              label: 'PART',
              value: parts.length > 1 ? pIdx / (parts.length - 1) : 0,
              onChange: (v) => {
                const p = parts[Math.round(v * (parts.length - 1))];
                if (p) pick(p.id);
              },
              format: () => (shown ? shown.title : `step through the ${parts.length} parts`),
              formatShort: () => (shown ? shown.title.split(' ')[0].slice(0, 9) : 'STEP'),
            },
            ...(spec.shows.length > 1 ? [{ kind: 'options' as const, id: 'view', label: 'VIEW', valueLabel: showMeta.label.split(' ')[0], selectedId: show, onSelect: (id: string) => setShow(id as ElectricShow), sticky: true, options: spec.shows.map((s) => ({ id: s.id, label: s.label, blurb: s.blurb })) }] : []),
          ],
          initialParam: 'part',
        },
        well: (
          <>
            <Landing looking={showMeta.label.toLowerCase()} prompt="Tap any part — or step through PART — to see what it is and what it does. There is nothing to answer on this page." />
            {shown ? (
              <Card>
                <Point title={shown.title}>{shown.text}</Point>
              </Card>
            ) : (
              <Note>{showMeta.blurb}</Note>
            )}
          </>
        ),
      },
      {
        key: 'amp',
        title: 'The amp',
        kind: 'TRY',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <CabExplorer
              w={w}
              h={h}
              kind={kind}
              back={back}
              view={view}
              frontMode={cloth ? 'cloth' : 'baffle'}
              highlight={aPart}
              onTapPart={aPick}
              extras={extras}
              accessibilityLabel={`${CABINETS[kind].label}, ${viewOpts.find((v) => v.id === view)!.label.toLowerCase()}.${aShown ? ` Highlighted: the ${aShown.label}.` : ''} The miked speaker is ringed.`}
            />
          ),
          badge: view === 'front' ? (cloth ? 'From the front · the miked speaker ringed in amber · its dust cap marked through the cloth' : 'The grille cloth taken away IN THE DRAWING only — never on a real amp') : view === 'face' ? 'One speaker face-on · tap a part' : 'Cut through the speaker’s middle · tap a part',
          bezel: [
            { k: 'PART', v: aShown ? aShown.short.toUpperCase() : 'TAP ONE', flex: 1.4 },
            { k: 'LOOKED AT', v: `${aSeen.size} / ${aParts.length}` },
            { k: 'AMP', v: CABINETS[kind].short, flex: 1.1 },
          ],
          params: [
            {
              kind: 'fader',
              id: 'part',
              label: 'PART',
              value: aParts.length > 1 ? aIdx / (aParts.length - 1) : 0,
              onChange: (v) => {
                const p = aParts[Math.round(v * (aParts.length - 1))];
                if (p) aPick(p.id);
              },
              format: () => (aShown ? `${aShown.short.toUpperCase()} · ${aSeen.size} of ${aParts.length} looked at` : `step through the ${aParts.length} parts`),
              formatShort: () => (aShown ? aShown.short.toUpperCase().slice(0, 9) : 'STEP'),
            },
            { kind: 'options', id: 'view', label: 'VIEW', valueLabel: view.toUpperCase(), selectedId: view, onSelect: (id) => setView(id as CabExplorerView), sticky: true, options: viewOpts },
            { kind: 'toggle', id: 'cloth', label: cloth ? 'CLOTH ON' : 'CLOTH OFF', value: !cloth, onToggle: () => setCloth((x) => !x) },
          ],
          initialParam: 'part',
        },
        well: (
          <>
            <Landing looking={`${CABINETS[kind].label} · ${viewOpts.find((v) => v.id === view)!.label.toLowerCase()}`} prompt="Tap any part of the amp — or step through PART. This is the sound source you will mic." />
            {aShown ? (
              <Card>
                <Point title={aShown.label.toUpperCase()}>{aShown.role}</Point>
              </Card>
            ) : (
              <Note>{`The instrument makes a small electrical signal; ${spec.ampNoun} turns it into the power that moves a speaker cone; the cone pushes the air; the mic hears the air. The grille cloth hides the speaker — find it before you place a mic.`}</Note>
            )}
            {spec.rig === 'bass' ? <Note>In a cabinet with several speakers, close in a mic hears mostly the one it faces, and the middle of the grille may fall between two of them. Ask which speaker is active, and mark it from outside with the amp off or muted.</Note> : <Note>The combo’s speaker sits off-centre, under the controls: the middle of the grille is not the middle of the speaker. Find the speaker itself.</Note>}
            <Note tone="warn">Never open an amp’s chassis or change its speaker wiring to place a mic: the inside is hot and carries dangerous voltages.</Note>
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  }

  /* ═══════════════ 2 · HOW IT SOUNDS ═══════════════ */
  const STEP_MS = 1300;
  const SPOTS = ['centre', 'boundary', 'edge'] as const;
  function AmpSound({ lesson, answers, onAnswered, onInteractive, interactiveDone, hidden }: PageProps) {
    const S = lesson.sound;
    const n = S.stages.length;
    const motion = useAnimationsAllowed();
    const focused = useFocusedSafe();
    /* the string */
    const st = spec.string;
    const L = st.spec.scale.mm;
    const [harm, setHarm] = useState(1);
    const [swing, setSwing] = useState(0);
    const [pu, setPu] = useState(st.spec.pickups[st.spec.pickups.length - 1].id);
    const [frets, setFrets] = useState(0);
    const [pedal, setPedal] = useState(false);
    const [hSeen, setHSeen] = useState<ReadonlySet<number>>(() => new Set([1]));
    const [puSeen, setPuSeen] = useState<ReadonlySet<string>>(() => new Set([st.spec.pickups[st.spec.pickups.length - 1].id]));
    const bar = st.steel ? barFor(frets, L) : null;
    const f0 = openHz(st.spec)[st.idx] * (pedal ? Math.pow(2, 2 / 12) : 1);
    const f = bar == null ? f0 : barHz(f0, L, bar);
    const q = st.spec.pickups.find((p) => p.id === pu)!.fromBridge;
    const Ls = L - (bar ?? 0);
    const weight = pickupWeight(harm, q, Ls);
    const still = atNode(harm, q, Ls, 8);
    const stringDone = hSeen.size >= 3 && (st.spec.pickups.length > 1 ? puSeen.size >= 2 : frets > 0);
    /* the cone */
    const reveal = useSharedValue(1);
    const [shown, setShown] = useState(1);
    const [playing, setPlaying] = useState(false);
    const [coneBack, setConeBack] = useState<Back>(back);
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
    const stageText = (i: number) => (coneBack === 'open' && S.stages[i].ported ? S.stages[i].ported! : S.stages[i].text);
    /* the beam and the spots */
    const [fNorm, setFNorm] = useState(0.62);
    const fHz = Math.round(BEAM_F_MIN * Math.pow(BEAM_F_MAX / BEAM_F_MIN, fNorm));
    const [micDeg, setMicDeg] = useState(30);
    const ka = kaOf(fHz);
    const atMic = pistonDb(ka, micDeg);
    const half = halfAngle(ka);
    const farFrom = farFieldFromMm(fHz);
    const [spot, setSpot] = useState<(typeof SPOTS)[number]>('boundary');
    // CREDIT: the cone reached its end AND the string was explored.
    const coneDone = useRef(false);
    if (shown >= n) coneDone.current = true;
    useEffect(() => {
      if (coneDone.current && stringDone && !interactiveDone.has('soundPath')) onInteractive('soundPath');
    }, [shown, stringDone, interactiveDone, onInteractive]);
    const reached = shown >= n;
    const pred = lesson.predictions.sound;
    const puShort = st.spec.pickups.find((p) => p.id === pu)!.short;
    const stringParams: DockParam[] = [
      {
        kind: 'fader',
        id: 'harm',
        label: 'HARMONIC',
        value: (harm - 1) / (HARMONICS - 1),
        onChange: (v) => {
          const k = 1 + Math.round(v * (HARMONICS - 1));
          setHarm(k);
          setHSeen((s) => (s.has(k) ? s : new Set([...s, k])));
        },
        format: () => `harmonic ${harm} · ${fmtHz(harm * f)}${harm === 1 ? ' (the note itself)' : ''}`,
        formatShort: () => `${harm}`,
      },
      ...(st.spec.pickups.length > 1
        ? [
            {
              kind: 'options' as const,
              id: 'pickup',
              label: 'PICKUP',
              valueLabel: puShort,
              selectedId: pu,
              onSelect: (id: string) => {
                setPu(id);
                setPuSeen((s) => (s.has(id) ? s : new Set([...s, id])));
              },
              sticky: true,
              options: st.spec.pickups.map((p) => ({ id: p.id, label: p.label.toUpperCase(), blurb: `About ${fmtLen(p.fromBridge)} from the bridge in this drawing.` })),
            },
          ]
        : []),
      ...(st.steel
        ? [
            { kind: 'fader' as const, id: 'bar', label: 'BAR', value: frets / 12, home: 0, onChange: (v: number) => setFrets(Math.round(v * 12)), format: () => (frets === 0 ? 'no bar: the open string' : `bar over fret ${frets} · ${fmtHz(f)}`), formatShort: () => (frets === 0 ? 'OPEN' : `F${frets}`) },
            { kind: 'toggle' as const, id: 'pedal', label: pedal ? 'PEDAL DOWN' : 'PEDAL UP', value: pedal, onToggle: () => setPedal((x) => !x) },
          ]
        : []),
      { kind: 'fader', id: 'swing', label: 'SWING', value: swing, home: 0, onChange: (v) => setSwing(Math.round(v * 40) / 40), format: () => 'swing the string through its cycle by hand', formatShort: () => `${Math.round(swing * 360)}°` },
    ];
    const steps: MikingStep[] = [
      {
        key: 'string',
        title: 'String and pickup',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <StringDisplay
              w={w}
              h={h}
              L={L}
              bar={bar}
              n={harm}
              swing={swing}
              pickups={st.spec.pickups}
              lit={pu}
              accessibilityLabel={`${st.name}, vibrating in harmonic ${harm} at ${fmtHz(harm * f)}, drawn larger than it moves. The ${puShort.toLowerCase()} pickup ${still ? 'sits at a still point of this shape and senses almost none of it' : `senses ${Math.round(weight * 100)} percent of this harmonic’s peak`}.`}
            />
          ),
          badge: 'An ideal string · motion drawn much larger · silent · blue dots = still points',
          bezel: [
            { k: 'HARMONIC', v: `${harm}`, sub: harm === 1 ? 'the note' : `${harm} × the note`, flex: 1 },
            { k: 'PITCH', v: fmtHz(harm * f), flex: 1.1 },
            { k: 'PICKUP SENSES', v: still ? 'ALMOST NONE' : `${Math.round(weight * 100)} %`, sub: puShort, flex: 1.3, tint: still ? '#ffc64d' : undefined },
            ...(st.steel ? [{ k: 'TENSION', v: pedal ? '+26 %' : 'AS TUNED', sub: pedal ? 'one whole tone up' : undefined, flex: 1.1 } as BezelItem] : []),
          ],
          params: stringParams,
          initialParam: 'harm',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking={`${st.name} · ${puShort.toLowerCase()} pickup`} prompt={st.steel ? 'Step HARMONIC, slide the BAR along, and press the PEDAL. Watch the pitch — and what the pickup senses.' : 'Step HARMONIC from 1 to 8, then switch PICKUP. Watch the bars below: what does each pickup sense?'} />
            <Card>
              <Point title="A STRING VIBRATES IN MANY SHAPES AT ONCE">{`A plucked string moves in its whole length (the note) and in halves, thirds, quarters… at the same time — its harmonics, at 2, 3, 4 … times the note. Each shape has still points (blue) where the string does not move.`}</Point>
              <Point title="THE PICKUP SENSES ITS OWN SPOT">{`A pickup is a magnet wound with fine wire: the steel string moving over it makes a small electrical signal. It senses only the string above it — so a shape with a still point right over the pickup is hardly sensed at all.`}</Point>
            </Card>
            {st.spec.pickups.length > 1 ? <Note>{`Near the bridge, the note itself moves the string very little, while the higher harmonics still move it well: a bridge pickup tends to sound brighter and thinner, a neck pickup rounder. ${hSeen.size >= 3 && puSeen.size >= 2 ? 'You have just seen why.' : ''}`}</Note> : null}
            {st.steel ? <Note>{`The bar is a movable fret: the string sounds only between the bar and the bridge — the shorter, the higher (at half the length, the octave). A pedal or knee lever pulls a string tighter at the changer, raising its pitch; one whole tone up needs about a quarter more tension.`}</Note> : null}
            {predicted != null && hSeen.size >= 3 ? <Note tone="ok">{`You predicted “${predicted}”. The string itself is very quiet — the pickup turns its motion into a small signal, and the amp and speaker make the sound you will mic.`}</Note> : null}
            <Note>A real string runs slightly sharp of these exact harmonics, and a real pickup senses a short stretch of string, not one point — the picture is simplified. Nothing here makes a sound.</Note>
          </>
        ),
      },
      {
        key: 'cone',
        title: 'Signal to air',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => <ConeSequence w={w} h={h} back={coneBack} reveal={reveal} shown={shown} accessibilityLabel={`A speaker cut open from the side, ${coneBack} back. Event ${shown} of ${n}: ${stage.title}. ${stageText(shown - 1)}`} />,
          badge: 'The order of events, not their speed · cone motion drawn much larger · silent',
          bezel: [
            { k: 'EVENT', v: `${shown} / ${n}`, flex: 0.8 },
            { k: 'CONE', v: shown >= 2 ? 'FORWARD' : 'AT REST', flex: 1.1 },
            { k: 'FRONT AIR', v: shown >= 3 ? 'PUSHED' : '—', flex: 1.1 },
            { k: 'BACK AIR', v: shown >= 3 ? (coneBack === 'open' ? 'PULLED · OUT' : 'PULLED · IN BOX') : '—', flex: 1.4 },
          ],
          params: [
            { kind: 'fader', id: 'step', label: 'STEP', value: (shown - 1) / Math.max(1, n - 1), onChange: (v) => goTo(1 + Math.round(v * (n - 1))), format: () => `${shown} of ${n} · ${stage.title.toLowerCase()}`, formatShort: () => `${shown} / ${n}` },
            { kind: 'action', id: 'play', label: playing ? 'PAUSE' : shown >= n ? 'REPLAY ONCE' : motion ? 'PLAY ONCE' : 'NEXT STEP', onPress: play, tint: colors.green },
            {
              kind: 'options',
              id: 'back',
              label: 'BACK',
              valueLabel: coneBack === 'open' ? 'OPEN' : 'CLOSED',
              selectedId: coneBack,
              onSelect: (id) => setConeBack(id as Back),
              options: [
                { id: 'open', label: 'OPEN BACK', blurb: 'Like most guitar combos: the back of the cone sounds out behind, opposite in polarity.' },
                { id: 'closed', label: 'CLOSED BACK', blurb: 'Like most bass cabinets: the sound from the back of the cone stays in the box.' },
              ],
            },
          ],
          initialParam: 'step',
        },
        well: (
          <>
            <Landing looking={`Side view · a speaker cut open · ${coneBack} back`} prompt="STEP through the four events, or PLAY ONCE — it stops at the end." />
            <Card>
              <Point title={`${shown} · ${stage.title.toUpperCase()}`}>{stageText(shown - 1)}</Point>
            </Card>
            {reached ? <Note>Then the cone moves back, and the push and pull swap — over and over, following the signal from the pickup, harmonics and all.</Note> : null}
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
          badge: 'A simplified picture: a rigid disc the size of a 12 in cone, in an endless wall, far away',
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
              <Point title={half == null ? 'LOW PITCH: IT SPREADS WIDE' : 'HIGHER PITCH: IT BEAMS'}>{half == null ? 'At low pitches the cone is small next to the wavelength, so the sound spreads to the sides almost as strongly as straight ahead.' : `Here the cone is large next to the wavelength, so the sound narrows into a beam: half the level (−6 dB) by about ±${Math.round(half)}° off the axis. A mic off to the side hears less of these highs.`}</Point>
            </Card>
            <Note>{spec.notes.beam}</Note>
            <Note>{`This beam is a far-field picture: at ${fmtHz(fHz)} it applies from about ${fmtLen(farFrom)} out. A close mic sits in the speaker’s near field, where the spot it faces on the cone matters more — the next step.`}</Note>
          </>
        ),
      },
      {
        key: 'spots',
        title: 'Centre and edge',
        kind: 'COMPARE',
        layout: 'rack',
        rack: {
          render: (w, h) => <CabExplorer w={w} h={h} kind="1x12" back="closed" view="face" spot={spot} accessibilityLabel={`One speaker face-on, the spot marked: ${SPOT_WORDS[spot].title.toLowerCase()}.`} />,
          badge: 'One speaker face-on · the blue ring is where the mic aims · tendencies to check, not results',
          bezel: [
            { k: 'SPOT', v: spot === 'centre' ? 'CENTRE' : spot === 'boundary' ? 'CAP EDGE' : 'EDGE', flex: 1.2 },
            { k: 'FROM CENTRE', v: lenCell(SPOT_WORDS[spot].r).v, sub: lenCell(SPOT_WORDS[spot].r).sub, flex: 1.3 },
            { k: 'TENDS TO', v: spot === 'centre' ? 'BRIGHTER' : spot === 'boundary' ? 'BETWEEN' : 'DARKER', flex: 1.3 },
          ],
          params: [{ kind: 'fader', id: 'spot', label: 'SPOT', value: SPOTS.indexOf(spot) / 2, onChange: (v) => setSpot(SPOTS[Math.round(v * 2)]), format: () => SPOT_WORDS[spot].title.toLowerCase(), formatShort: () => (spot === 'centre' ? 'CENTRE' : spot === 'boundary' ? 'CAP EDGE' : 'EDGE') }],
          initialParam: 'spot',
        },
        well: (
          <>
            <Landing looking="One speaker, face-on" prompt="Step SPOT from the centre to the edge. Each is a place to aim a close mic." />
            <Card>
              <Point title={SPOT_WORDS[spot].title}>{SPOT_WORDS[spot].text}</Point>
            </Card>
            <Note>{spec.notes.spots}</Note>
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
            <Note>A mic on the amp hears AIR — the speaker, the box and the room. A DI or the amp’s direct output is a separate electrical signal, taken earlier in the chain: it does not carry the speaker, the box or the room (unless it imitates one). Label each as its own source.</Note>
            {!reached || !stringDone ? <Note tone="warn">{`Still to do for this page’s credit: ${!stringDone ? (st.steel ? 'step through three harmonics and move the bar' : 'step through three harmonics and try two pickups') : ''}${!stringDone && !reached ? ', and ' : ''}${!reached ? 'step the cone through to the end' : ''}.`}</Note> : null}
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  }

  /* ═══════════════ 3 · WHERE IT SITS ═══════════════ */
  function AmpSetting({ lesson, answers, onAnswered }: PageProps) {
    const items = lesson.setting.items;
    const byId = (id: string | null) => items.find((i) => i.id === id);
    const shortOf = (id: string) => byId(id)?.short ?? id.toUpperCase();
    const [cSel, setCSel] = useState<string | null>(null);
    const [cSeen, setCSeen] = useState<ReadonlySet<string>>(() => new Set());
    const [patch, setPatch] = useState<'cab' | 'desk'>('cab');
    const [scene, setScene] = useState<BacklineScene>('stage');
    const [sel, setSel] = useState<string | null>(null);
    const chainIds = ['player', ...(spec.chain.diBox ? ['dibox'] : []), ...(spec.chain.pedals ? ['pedals'] : []), 'amp', 'cab', 'mic', 'desk', ...(spec.chain.ampDirect ? ['ampdi'] : [])];
    const chainItems = chainIds.map((id) => byId(id)).filter((x): x is NonNullable<typeof x> => !!x);
    const planIds = scene === 'stage' ? ['amp', 'player', 'pedals', 'dibox', 'wedge', ...lesson.live.wedges.slice(1).map((w) => w.id), 'drums', 'otherAmp', 'audience'] : ['amp', 'player', 'pedals', 'dibox', 'otherAmp', 'room'];
    const planItems = planIds.map((id) => byId(id) ?? (lesson.live.wedges.some((w) => w.id === id) ? { id, label: lesson.live.wedges.find((w) => w.id === id)!.label, short: lesson.live.wedges.find((w) => w.id === id)!.short, note: lesson.live.wedges.find((w) => w.id === id)!.note, tag: 'MONITOR' } : null)).filter((x): x is NonNullable<typeof x> => !!x);
    const pickC = (id: string) => {
      setCSel(id);
      setCSeen((s) => (s.has(id) ? s : new Set([...s, id])));
    };
    const cIdx = Math.max(0, chainItems.findIndex((i) => i.id === cSel));
    const pIdx = Math.max(0, planItems.findIndex((i) => i.id === sel));
    const cs = byId(cSel);
    const ps = planItems.find((i) => i.id === sel);
    const verdict = patchVerdict('speakerOut', patch === 'cab' ? 'cabinet' : 'micIn');
    const steps: MikingStep[] = [
      {
        key: 'path',
        title: 'The signal path',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <DiPath
              w={w}
              h={h}
              spec={spec.chain}
              highlight={cSel}
              onTap={pickC}
              shortOf={shortOf}
              badPatch={patch === 'desk'}
              accessibilityLabel={`The signal path. Top, the air path: ${chainItems.filter((i) => !['dibox', 'ampdi'].includes(i.id)).map((i) => i.label).join(', then ')}. Below, drawn apart: ${spec.chain.diBox ? 'a DI box between the instrument and the amp, its output to the desk' : ''}${spec.chain.diBox && spec.chain.ampDirect ? '; and ' : ''}${spec.chain.ampDirect ? 'the amp’s own direct output to the desk' : ''} — separate electrical sources.${patch === 'desk' ? ' Shown struck out in red: a speaker output patched into the desk, which is never done.' : ''}${cs ? ` Highlighted: ${cs.label}.` : ''}`}
            />
          ),
          badge: 'Blue = the air a mic hears · amber dashes = a separate electrical path · brown = speaker cable',
          bezel: [
            { k: 'ITEM', v: cs ? cs.short : 'TAP ONE', flex: 1.4 },
            { k: 'FOR A MIC', v: cs ? cs.tag : '—', flex: 1.3 },
            { k: 'SPEAKER OUT →', v: patch === 'cab' ? 'CABINET' : 'DESK', sub: verdict === 'ok' ? 'correct' : 'never', tint: verdict === 'ok' ? '#5bff85' : '#ff5a48', flex: 1.3 },
          ],
          params: [
            {
              kind: 'fader',
              id: 'item',
              label: 'ITEM',
              value: chainItems.length > 1 ? cIdx / (chainItems.length - 1) : 0,
              onChange: (v) => {
                const it = chainItems[Math.round(v * (chainItems.length - 1))];
                if (it) pickC(it.id);
              },
              format: () => (cs ? `${cs.short} · ${cs.tag}` : `step through the ${chainItems.length} items`),
              formatShort: () => (cs ? cs.short.slice(0, 9) : 'STEP'),
            },
            {
              kind: 'options',
              id: 'patch',
              label: 'PATCH',
              valueLabel: patch === 'cab' ? 'TO CAB' : 'TO DESK',
              selectedId: patch,
              onSelect: (id) => setPatch(id as 'cab' | 'desk'),
              options: [
                { id: 'cab', label: 'SPEAKER OUT → THE CABINET', blurb: 'By a speaker cable, as the amp’s manual says — the only place a speaker output goes.' },
                { id: 'desk', label: 'SPEAKER OUT → A DESK INPUT', blurb: 'Shown so you can recognise it — never do it: a speaker output carries high power.' },
              ],
            },
          ],
          initialParam: 'item',
        },
        well: (
          <>
            <Landing looking="From the strings to the desk" prompt="Tap each link — or step through ITEM. Which path is the air, and which are wires?" />
            {cs ? (
              <Card>
                <Point title={cs.label.toUpperCase()}>{cs.note}</Point>
              </Card>
            ) : (
              <Note>The mic hears the air the speaker moves. A DI or the amp’s direct output is an electrical copy taken earlier in the chain: its own source, not a copy of the mic.</Note>
            )}
            {patch === 'desk' ? <Note tone="warn">Never patch a speaker output into a mic input, a line input or an ordinary DI: it carries high power and can damage the desk, the amp and hearing. Speaker outputs go to a speaker, by a speaker cable — and some amps must never run without their speaker connected. Read the amp’s own manual; when unsure, stop and ask a qualified technician.</Note> : null}
          </>
        ),
      },
      {
        key: 'stage',
        title: 'Stage and studio',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => <BacklinePlan w={w} h={h} who={spec.who} scene={scene} wedges={lesson.live.wedges} highlight={sel} onTap={setSel} shortOf={(id) => planItems.find((i) => i.id === id)?.short ?? shortOf(id)} accessibilityLabel={`${scene === 'stage' ? 'A stage' : 'A studio room'} from above: the amp, the player and their keep-clear space, a DI box, the other amp${scene === 'stage' ? ', the monitor wedge, the drum kit, the PA and the audience' : ''}.${ps ? ` Highlighted: ${ps.label}.` : ''}`} />,
          badge: scene === 'stage' ? 'From above · a typical layout · grey dashes = the player’s space, keep clear' : 'From above · a typical studio room',
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
              value: planItems.length > 1 ? pIdx / (planItems.length - 1) : 0,
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
                setScene(id as BacklineScene);
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
            <Landing looking={scene === 'stage' ? 'Plan · a stage from above, the audience at the right' : 'Plan · a studio room from above'} prompt="Tap what sits round the amp — or step through ITEM." />
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
              <Point title="ASK THE PLAYER FIRST">{spec.who === 'steel' ? 'Which neck and pickup, the volume-pedal range, the effects and the amp settings that make their sound. Then listen from a safe spot while they play the real passage — quiet swells and the strongest attacks — at its real level.' : 'The instrument, the pickups, the pedals, the amp channel and the level they will really play at. Then listen from a safe spot while they play the real part — the quietest and the strongest passages.'}</Point>
              <Point title="WORK WITH THE AMP AS IT IS">The amp’s settings and its speaker are the player’s sound. Keep them as set while you compare positions; mic the amp they bring.</Point>
              <Point title="ELECTRICAL SAFETY">Do not open a chassis, defeat a safety ground, change speaker wiring or block an amp’s vents for a miking exercise. Follow the amp’s own manual for its speaker load and direct outputs. Stop for hum from damaged cable, a hot smell, smoke or any shock, and involve a qualified technician.</Point>
            </Card>
            <Note tone="warn">Protect your hearing at soundcheck. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, halving the time for every 3 dBA above that — and below it is not a promise of safety. That is a limit for PEOPLE, measured where a person listens, and it has nothing to do with a microphone’s maximum SPL rating. Keep levels and repetitions down, and use hearing protection.</Note>
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'setting')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  }

  /* ═══════════════ 4 · MICROPHONES ═══════════════ */
  function AmpMicrophone(p: PageProps) {
    return GMicrophone(p, spec.mic);
  }

  /* ═══════════════ 5 · PLACEMENT ═══════════════ */
  function AmpPlacement({ lesson, answers, onAnswered, onInteractive, interactiveDone, hidden }: PageProps) {
    const exZone = lesson.zones.find((z) => z.id === spec.workedZone)!;
    const ex = useRig(lesson, { mics: [{ slot: 'A', typeId: spec.micDefault, pattern: 'cardioid', pose: exZone.start }] });
    const [exView, setExView] = useState<ViewId>('side');
    const [exStep, setExStep] = useState(0);
    const exShown = ex.shown('A');
    const worked: { title: string; text: string; cell: number }[] = [
      { title: 'WHERE TO BEGIN', text: `${exZone.label}. After our research, this is one place we recommend you begin — a starting point, not a rule, and not a promise of a sound.`, cell: 3 },
      { title: 'THE SPEAKER', text: `In front of the speaker that is really sounding — found from outside the grille with the amp off or muted. ${spec.rig === 'combo' ? 'On this combo it sits off-centre, under the controls.' : 'On this cabinet, one woofer — not the gap between two.'}`, cell: 1 },
      { title: 'THE DISTANCE', text: `${exZone.band} The readout measures from the grille cloth to the mic’s FRONT, rounded to ≈ 5 mm.`, cell: 0 },
      { title: 'ACROSS THE CONE', text: 'Off the cone axis by about the dust cap’s radius: aimed at the line where the dust cap meets the cone. The bezel reads how far off the axis the mic sits.', cell: 1 },
      { title: 'THE AIM', text: `Facing the speaker — the lab counts anything within ±${exZone.aim?.maxOffAxis ?? 20}°. Distance, the spot across the cone and the angle are separate things to try, one at a time.`, cell: 2 },
      { title: 'CLEARANCE', text: `Off the grille cloth — never touching it — on a stable stand, the cable routed away from the player’s ${spec.who === 'steel' ? 'pedals, knee levers and volume pedal' : 'feet and pedalboard'} and from the amp’s hot vents.`, cell: 3 },
    ];
    const wk = worked[exStep];
    const partShort = (id: string) => lesson.model.parts.find((p) => p.id === id)?.short ?? id;
    const exBezel: BezelItem[] = placementBezel(exShown, readoutWords(ex, 'A'), exZone, partShort).map((c, i) => (i === wk.cell ? { ...c, k: `▸ ${c.k}`, tint: '#ffc64d' } : c));
    /* PLACE */
    const startZ = lesson.zones.find((z) => z.id === spec.placeZone)!;
    const rig = useRig(lesson, { mics: [{ slot: 'A', typeId: spec.micDefault, pattern: 'cardioid', pose: startZ.start }] });
    const [view, setView] = useState<ViewId>('side');
    const [posAxis, setPosAxis] = useState<PosAxis>('y');
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
    useEffect(() => {
      if (visited.size >= 2 && !interactiveDone.has('twoZones')) onInteractive('twoZones');
    }, [visited, interactiveDone, onInteractive]);
    const available = zonesAvailable(rig.lesson.zones, rig.variant, mic.typeId, t.mount);
    const azCentre = mic.pose.az > 90 || mic.pose.az < -90 ? 180 : 0;
    const params: DockParam[] = [
      ...posParams({ rig, slot: 'A', posAxis, setPosAxis, aimAxis, setAimAxis, words: AXES, aimWords: AIM_WORDS, azCentre }),
      { kind: 'toggle', id: 'view', label: view === 'side' ? 'SIDE VIEW' : 'TOP VIEW', value: view === 'top', onToggle: () => setView((v) => (v === 'side' ? 'top' : 'side')) },
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
            <Text style={styles.trayHead}>MEASURE FROM (when not in a zone)</Text>
            <View style={styles.chips}>
              {rig.lesson.model.surfaces.map((s) => (
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
    const bezel: BezelItem[] = placementBezel(shown, readoutWords(rig, 'A'), zone, partShort);
    const pred = lesson.predictions.placement;
    const tried = predicted != null && visited.size >= 2;
    const steps: MikingStep[] = [
      {
        key: 'watch',
        title: 'Worked example',
        kind: 'WATCH',
        layout: 'rack',
        rack: {
          render: (w, h) => <DualView rig={ex} art={art} view={exView} setView={setExView} w={w} h={h} slots={['A']} interactive={false} labelFor={(v) => `${v === 'side' ? 'Side' : 'Top'} view of ${spec.ampNoun} cut through its speaker. A worked example: the mic is placed for you. ${now(ex, ['A'])}`} />,
          badge: 'WORKED EXAMPLE · placed for you · blue = recommended starting point · dashed lobe = pattern shape',
          bezel: exBezel,
          params: [
            { kind: 'fader', id: 'piece', label: 'STEP', value: exStep / (worked.length - 1), onChange: (v) => setExStep(Math.round(v * (worked.length - 1))), format: () => `${exStep + 1} of ${worked.length} · ${wk.title.toLowerCase()}`, formatShort: () => `${exStep + 1} / ${worked.length}` },
            { kind: 'toggle', id: 'view', label: exView === 'side' ? 'SIDE VIEW' : 'TOP VIEW', value: exView === 'top', onToggle: () => setExView((v) => (v === 'side' ? 'top' : 'side')) },
          ],
          initialParam: 'piece',
        },
        well: (
          <>
            <Landing looking={`Worked example · ${micType(spec.micDefault).label.toLowerCase()} · ${spec.ampNoun}`} prompt="Step through how this starting point is read, piece by piece. The lit cell on the bezel is the piece being read." />
            <Card>
              <Point title={`${exStep + 1} · ${wk.title}`}>{wk.text}</Point>
            </Card>
            {exStep === worked.length - 1 ? <Note tone="ok">That is the whole reading: where to begin, the speaker, the distance, across the cone, the aim, clearance. Next you place the mic yourself.</Note> : null}
          </>
        ),
      },
      {
        key: 'place',
        title: 'Place on the amp',
        kind: 'PLACE',
        layout: 'rack',
        rack: {
          render: (w, h) => <DualView rig={rig} art={art} view={view} setView={setView} w={w} h={h} slots={['A']} interactive={!hidden} labelFor={(v) => `${v === 'side' ? 'Side' : 'Top'} view of ${spec.ampNoun}, cut through the miked speaker. ${now(rig, ['A'])}`} />,
          badge: 'Blue = recommended starting points · dashed lobe = pattern shape · hatched = keep clear · pinch to zoom',
          bezel,
          params,
          initialParam: 'pos',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking={`${t.short} · ${spec.ampNoun}`} prompt="Drag the mic (or use POSITION and AIM; drag the amber ring to turn it). Rest it in two different blue zones — then move it across the cone and away from it, one change at a time." />
            <NowLine text={now(rig, ['A'])} />
            {shown.blocked ? <Note tone="warn">{`It would touch the ${shown.blocked.label} — the mic stops there.`}</Note> : null}
            {zone ? <ZoneCard z={zone} /> : <Body>{`Not at a recommended starting point. Starting points for this mic: ${available.map((z) => z.label).join('; ')}.`}</Body>}
            <Body>{`Activity: zones rested in, clear of every part — ${visited.size} of 2${visited.size ? ` (${[...visited].map((id) => rig.lesson.zones.find((z) => z.id === id)?.label ?? id).join('; ')})` : ''}.`}</Body>
            {tried ? <Note tone="ok">{`You predicted “${predicted}”. Across the cone at the same distance, toward the edge most often sounds smoother and darker — and speakers vary, so “it depends on this speaker” is fair too.`}</Note> : null}
            <Note>{spec.notes.place}</Note>
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
            <Body>What you just did, in words. After our research, each blue zone is where we recommend you begin, measured from the grille in front of the speaker that is really sounding. They are starting points, not rules: move from there and listen — there is no single right answer, and every speaker, amp and player is different.</Body>
            <Body>Change one thing at a time. Keep the distance and slide across the cone — centre, dust-cap edge, toward the edge — or keep the spot and move away from the grille, or keep both and change only the angle. A mic farther back hears more of the cabinet and the room, and more of the stage. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.</Body>
            <Body>Compare at matched level, on the same passage — louder always sounds “better” at first. Then write down where you ended: the speaker, the spot, the distance, the angle, and the player’s settings.</Body>
            <Note tone="warn">Clearance comes first: off the grille cloth, the stand steady, the cable away from the player and the walkway, nothing against the amp’s vents.</Note>
          </>
        ),
      },
      { key: 'check', title: 'Check', kind: 'CHECK', layout: 'read', body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'placement')} answers={answers} onAnswered={onAnswered} /> },
    ];
    return <PageSteps steps={steps} />;
  }

  /* ═══════════════ 6a · STUDIO OR LIVE ═══════════════ */
  const NULL_TOL = 15;
  const AZ_MAX = 45;
  const EL_MAX = 30;
  const PATTERNS: PatternId[] = ['cardioid', 'supercardioid', 'hypercardioid'];
  function AmpContext({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
    const close = lesson.zones.find((z) => z.id === spec.placeZone)!;
    const rig = useRig(lesson, { mics: [{ slot: 'A', typeId: spec.micDefault, pattern: 'cardioid', pose: { p: { x: G + 70, y: close.start.p.y, z: -45 }, az: 25, el: 0 } }] });
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
    const first = lesson.live.wedges[0];
    useEffect(() => {
      if (live && wedge.id === first.id && inNull && aimed && !interactiveDone.has('wedgeInNull')) onInteractive('wedgeInNull');
    }, [live, wedge.id, first.id, inNull, aimed, interactiveDone, onInteractive]);
    useEffect(() => {
      if (rig.mics[0].pattern !== pattern) rig.setPattern('A', pattern as MicPattern);
    }, [pattern, rig]);
    const a = aimAxis === 'az' ? pose.az : pose.el;
    const lim = aimAxis === 'az' ? AZ_MAX : EL_MAX;
    const FLOOR = lesson.model.yFloor.mm;
    const zs = lesson.live.wedges.map((w) => w.p.z);
    const PLAN: ViewBox = { u0: lesson.model.views.top!.u0, u1: Math.max(...lesson.live.wedges.map((w) => w.p.x)) + 350, v0: Math.min(-800, ...zs.map((z) => z - 450)), v1: Math.max(800, ...zs.map((z) => z + 450)) };
    const SIDE: ViewBox = { u0: lesson.model.views.side!.u0, u1: PLAN.u1, v0: lesson.model.views.side!.v0, v1: FLOOR + 40 };
    const params: DockParam[] = [
      {
        kind: 'fader',
        id: 'aim',
        label: 'AIM',
        value: (a + lim) / (2 * lim),
        home: 0.5,
        onChange: (v) => {
          const ang = Math.round((v * 2 - 1) * lim);
          rig.moveTo('A', aimAxis === 'az' ? { ...pose, az: ang } : { ...pose, el: ang });
          setAimed(true);
        },
        format: () => (a === 0 ? 'facing the speaker' : `${fmtAngle(Math.abs(a))} ${aimAxis === 'az' ? (a > 0 ? 'right' : 'left') : a > 0 ? 'up' : 'down'}`),
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
        options: PATTERNS.map((p) => ({ id: p, label: p, blurb: `An amp mic with a ${p} pattern, drawn as a simplified shape. Its null sits at ≈ ${Math.round(nullAngles(p)[0])}° off the front axis.` })),
      },
      { kind: 'options', id: 'wedge', label: 'MONITOR', valueLabel: wedge.short, selectedId: wedge.id, onSelect: setWedgeId, sticky: true, options: lesson.live.wedges.map((w) => ({ id: w.id, label: w.label, blurb: w.note })) },
      { kind: 'toggle', id: 'scenario', label: live ? 'LIVE' : 'STUDIO', value: live, onToggle: () => setLive((x) => !x) },
      { kind: 'toggle', id: 'view', label: view === 'side' ? 'SIDE VIEW' : 'TOP VIEW', value: view === 'top', onToggle: () => setView((v) => (v === 'side' ? 'top' : 'side')) },
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
    const label = `${view === 'top' ? 'Top' : 'Side'} view: ${spec.ampNoun} with a mic in front of its speaker. ${live ? `${wedge.label}, ${Math.round(theta)} degrees off the mic's front axis: ${fmtIdealPickup(db)}${inNull ? ', in the rejection region' : ''}.` : 'Studio: no monitor.'}`;
    const pred = lesson.predictions.context;
    const studioCard = lesson.scenarios.filter((s) => s.page === 'context' && s.id.endsWith('.studio'));
    const steps: MikingStep[] = [
      {
        key: 'live',
        title: 'Aim the rejection',
        kind: 'LIVE',
        layout: 'rack',
        rack: {
          render: (w, h) => <PlacementScene rig={rig} art={art} view={view} w={w} h={h} slots={['A']} showZones={false} interactive={false} boxOverride={view === 'top' ? PLAN : SIDE} wedge={live ? { at: wedge.p, faces: wedge.faces, src } : null} showLabels={false} accessibilityLabel={label} />,
          badge: `A simplified pattern (white dashed: shape, not range) · monitors where a stage often puts them · counts within ±${NULL_TOL}° of a null`,
          bezel,
          params,
          initialParam: 'aim',
        },
        well: live ? (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking={`Top view · a mic in front of the speaker · ${wedge.short.toLowerCase()}`} prompt={`The monitor stays where the player needs it. Turn the MIC (AIM) or change its PATTERN until ${first.label.split(',')[0]} sits in the rejection.`} />
            <Body>{`Activity: ${interactiveDone.has('wedgeInNull') ? 'done — the monitor sat in a null by your aim or pattern' : 'not yet'}.`}</Body>
            {wedge.id !== first.id ? <Note tone="warn">{wedge.note}</Note> : null}
            {isDeepNull(db) ? <Note>On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence.</Note> : null}
            {tried ? (pattern === 'cardioid' ? <Note tone="ok">What you just saw: a cardioid rejects most directly behind (180°). A super- or hypercardioid rejects most off to each side of the rear, and picks up a little straight behind — so “put the monitor directly behind it” suits a cardioid, not every pattern.</Note> : <Note tone="ok">{`What you just saw: a ${pattern} rejects most at ≈ ${Math.round(nulls[0])}° — toward the rear but OFF the axis — and picks up a little directly behind (${fmtDb(gainDb(pattern, 180))}). Aim by the mic’s real pattern, not by a rule.`}</Note>) : null}
            <Note>{spec.notes.context}</Note>
          </>
        ) : (
          <>
            <Landing looking="Studio · no monitor" prompt="A studio session has no wedge to reject. The decision changes: what is the room worth?" />
            <ScenarioList items={studioCard} answers={answers} onAnswered={onAnswered} />
            <Note>In a studio you have time to compare positions with the player; a farther mic can add a useful room. Switch back to LIVE for the monitor exercise.</Note>
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
              {spec.liveCards.map((c) => (
                <Point key={c.title} title={c.title}>
                  {c.text}
                </Point>
              ))}
            </Card>
            <Note tone="warn">No mic position alone prevents feedback: the monitors and PA, the gain, the room and the open mics all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency. If it starts, lower the level first, then revisit the geometry.</Note>
          </>
        ),
      },
      { key: 'check', title: 'Check', kind: 'CHECK', layout: 'read', body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'context' && !s.id.endsWith('.studio'))} answers={answers} onAnswered={onAnswered} /> },
    ];
    return <PageSteps steps={steps} />;
  }

  /* ═══════════════ 6b · TWO SOURCES ═══════════════ */
  function AmpTwoMic({ lesson, answers, onAnswered, onInteractive, interactiveDone, hidden }: PageProps) {
    const [pair, setPair] = useState<'rear' | 'di'>(spec.pairs[0]);
    const front = lesson.zones.find((z) => z.id === spec.workedZone)!;
    const rear = lesson.zones.find((z) => z.id.endsWith('.rear'));
    const rig = useRig(lesson, {
      mics: [{ slot: 'A', typeId: spec.micDefault, pattern: 'cardioid', pose: front.start }, ...(rear ? [{ slot: 'B' as const, typeId: spec.micDefault, pattern: 'cardioid' as const, pose: rear.start }] : [])],
    });
    const [view, setView] = useState<ViewId>('side');
    const [slot, setSlot] = useState<MicSlot>(pair === 'rear' ? 'B' : 'A');
    const [posAxis, setPosAxis] = useState<PosAxis>('x');
    const [aimAxis, setAimAxis] = useState<AimAxis>('el');
    const [diPol, setDiPol] = useState<1 | -1>(1);
    const [diDb, setDiDb] = useState(0);
    useEffect(() => {
      if (pair === 'di' && slot !== 'A') setSlot('A');
    }, [pair, slot]);
    useEffect(() => {
      const want = pair === 'rear' && slot === 'B' ? 'back' : 'grille';
      if (rig.surfaceId !== want) rig.setSurfaceId(want);
    }, [slot, pair, rig]);
    useEffect(() => {
      const b = rig.mics.find((m) => m.slot === 'B');
      if (b && b.on !== (pair === 'rear')) rig.setOn('B', pair === 'rear');
    }, [pair, rig]);
    const model = lesson.model;
    const sFront = model.regions.find((r) => r.id === 'r.cone')!.anchor;
    const sBack = model.regions.find((r) => r.id === 'r.back')?.anchor ?? sFront;
    const A = rig.mics.find((m) => m.slot === 'A')!;
    const B = rig.mics.find((m) => m.slot === 'B');
    const gainOf = (pose: MicPose, s: Vec3, p: MicPattern) => {
      const r = Math.max(1, dist(pose.p, s)) / 1000;
      return Math.max(0.001, Math.abs(p === 'cardioid' ? 0.5 + 0.5 * Math.cos((arrivalAngle(pose, s) * Math.PI) / 180) : 1)) / r;
    };
    // REAR: the back of the cone is the same motion, opposite in sign.
    // DI: the electrical copy arrives first; the mic, d / c later. Whether the
    // amp and speaker invert the signal is not known here (said on screen).
    const rearMode = pair === 'rear' && !!B;
    const dMm = rearMode ? dist(B!.pose.p, sBack) - dist(A.pose.p, sFront) : dist(A.pose.p, sFront);
    const dt = deltaTms(dMm);
    const equal = Math.abs(dMm) < EQUAL_PATH_MM;
    const gA = rearMode ? gainOf(A.pose, sFront, A.pattern) : 1;
    const gB = rearMode ? gainOf(B!.pose, sBack, B!.pattern) : Math.pow(10, diDb / 20);
    const switchB: 1 | -1 = rearMode ? B!.polarity : diPol;
    const sEff = (rearMode ? switchB * -1 : switchB) as 1 | -1;
    const first = equal ? null : notchesHz(dt, sEff, 20000, 4)[sEff === 1 ? 0 : 1] ?? null;
    const dt0 = useRef<number | null>(null);
    if (dt0.current == null) dt0.current = dt;
    const [flips, setFlips] = useState({ toInv: false, toNorm: false });
    const [predicted, setPredicted] = useState<string | null>(null);
    const moved = Math.abs(dt - dt0.current) > 0.05;
    useEffect(() => {
      if (flips.toInv && flips.toNorm && moved && !interactiveDone.has('polarityVsDelay')) onInteractive('polarityVsDelay');
    }, [flips, moved, interactiveDone, onInteractive]);
    const flip = () => {
      const next = (switchB === 1 ? -1 : 1) as 1 | -1;
      if (rearMode) rig.setPolarity('B', next);
      else setDiPol(next);
      setFlips((f) => (next === -1 ? { ...f, toInv: true } : { ...f, toNorm: true }));
    };
    const azCentre = (rig.mics.find((m) => m.slot === slot)?.pose.az ?? 0) > 90 ? 180 : 0;
    const params: DockParam[] = [
      ...posParams({ rig, slot, posAxis, setPosAxis, aimAxis, setAimAxis, words: AXES, aimWords: AIM_WORDS, azCentre }),
      { kind: 'toggle', id: 'polarity', label: `${rearMode ? 'REAR' : 'DI'} POL ${switchB === 1 ? '+' : '−'}`, value: switchB === -1, onToggle: flip },
      ...(rearMode ? [{ kind: 'toggle' as const, id: 'mic', label: slot === 'A' ? 'EDIT FRONT' : 'EDIT REAR', value: slot === 'B', onToggle: () => setSlot((s) => (s === 'A' ? 'B' : 'A')) }] : [{ kind: 'fader' as const, id: 'blend', label: 'DI LEVEL', value: (diDb + 12) / 12, home: 1, onChange: (v: number) => setDiDb(Math.round(v * 12) - 12), format: () => `the DI ${diDb === 0 ? 'at the mic’s level' : `${-diDb} dB under the mic`}`, formatShort: () => `${diDb} dB` }]),
      ...(spec.pairs.length > 1 ? [{ kind: 'options' as const, id: 'pair', label: 'PAIR', valueLabel: pair === 'rear' ? 'FRONT+REAR' : 'MIC+DI', selectedId: pair, onSelect: (id: string) => setPair(id as 'rear' | 'di'), sticky: true, options: [{ id: 'rear', label: 'FRONT + REAR MIC', blurb: 'A mic in front and a mic behind the open back.' }, { id: 'di', label: 'MIC + DI', blurb: 'The front mic, blended with a direct (electrical) feed.' }] }] : []),
      { kind: 'toggle', id: 'view', label: view === 'side' ? 'SIDE VIEW' : 'TOP VIEW', value: view === 'top', onToggle: () => setView((v) => (v === 'side' ? 'top' : 'side')) },
    ];
    const dCell = lenCell(dMm, rearMode);
    const bezel: BezelItem[] = rearMode
      ? [
          { k: 'PATH Δd R−F', v: equal ? 'NONE' : dCell.v, sub: equal ? 'same path' : dCell.sub, flex: 1.35 },
          { k: 'DELAY Δt', v: equal ? '0 ms' : fmtMs(dt).replace('≈ ', `≈ ${dt > 0 ? '+' : '−'}`), sub: equal ? 'no comb' : dt > 0 ? 'rear later' : 'rear earlier', flex: 1.3 },
          { k: '1ST NOTCH', v: equal ? (sEff === -1 ? 'CANCELS' : 'NO COMB') : first == null ? 'OVER 20 kHz' : `≈ ${fmtHz(first)}`, flex: 1.15 },
          { k: 'REAR', v: switchB === 1 ? 'SWITCH +' : 'SWITCH −', sub: sEff === 1 ? 'sum: in step' : 'sum: opposed', tint: sEff === 1 ? '#5bff85' : '#ff6b5e', flex: 1.2 },
        ]
      : [
          { k: 'MIC PATH', v: dCell.v, sub: 'cone to mic', flex: 1.2 },
          { k: 'MIC LATER BY', v: fmtMs(dt), sub: 'than the DI', flex: 1.3 },
          { k: '1ST NOTCH', v: first == null ? 'OVER 20 kHz' : `≈ ${fmtHz(first)}`, flex: 1.15 },
          { k: 'DI', v: switchB === 1 ? 'SWITCH +' : 'SWITCH −', sub: switchB === 1 ? 'as wired' : 'flipped', flex: 1.1 },
        ];
    const [wellW, setWellW] = useState(0);
    const combLabel = `Simplified sum of the ${rearMode ? 'front and rear mics' : 'mic and the DI'}: ${equal ? 'no path difference' : `delay ${fmtMs(dt)}`}; ${rearMode ? 'rear' : 'DI'} polarity switch ${switchB === 1 ? 'normal' : 'inverted'}${first ? `; first notch about ${fmtHz(first)}` : ''}.`;
    const pred = lesson.predictions.twoMic;
    const tick = (on: boolean) => (on ? '✓' : '○');
    const steps: MikingStep[] = [
      {
        key: 'pair',
        title: rearMode ? 'Front and rear' : 'Mic and DI',
        kind: 'PAIR',
        layout: 'rack',
        rack: {
          render: (w, h) => <DualView rig={rig} art={art} view={view} setView={setView} w={w} h={h} slots={rearMode ? ['A', 'B'] : ['A']} showZones={false} interactive={!hidden} labelFor={(v) => `${v === 'side' ? 'Side' : 'Top'} view of ${spec.ampNoun}${rearMode ? ', a mic in front and a mic behind the open back' : ', a mic in front; the DI is electrical and not drawn here'}. ${now(rig, rearMode ? ['A', 'B'] : ['A'])}`} />,
          badge: `A simplified picture · ${rearMode ? 'each mic hears its own side of the cone' : 'the DI arrives first; the mic, after the sound crosses the air'} · c = ${C20.toFixed(1)} m/s, 20 °C`,
          bezel,
          params,
          initialParam: 'pos',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking={rearMode ? 'An open-backed combo · mic A in front, mic B behind' : `${spec.ampNoun} · a mic in front, blended with a DI`} prompt={`Flip ${rearMode ? 'REAR' : 'DI'} POLARITY both ways, then move a mic. Watch which readout each action changes.`} />
            <Text style={styles.activity} accessibilityLabel={`Activity: polarity to minus ${flips.toInv ? 'done' : 'not yet'}, back to plus ${flips.toNorm ? 'done' : 'not yet'}, mic moved ${moved ? 'done' : 'not yet'}.`}>
              {`Activity: polarity → − ${tick(flips.toInv)} · back to + ${tick(flips.toNorm)} · mic moved ${tick(moved)}`}
            </Text>
            <NowLine text={now(rig, rearMode ? ['A', 'B'] : ['A'])} />
            <View onLayout={(e) => setWellW(Math.round(e.nativeEvent.layout.width))}>{wellW > 0 ? <PairComb w={wellW} h={150} dtMs={dt} gA={gA} gB={gB} sEff={sEff} label={combLabel} /> : null}</View>
            {rearMode ? (
              <Body>{switchB === 1 ? 'With the rear switch at +, the two arrive OPPOSED: the back of the cone is the same motion, inverted. The lows cancel most — thin.' : 'With the rear switch at −, the inversion is undone: the two arrive in step, and only the delay is left — its notches sit higher up.'}</Body>
            ) : (
              <Body>{`The DI reaches the desk at once; the mic hears the speaker only after the sound crosses the air — about ${fmtMs(dt).replace('≈ ', '')} here. Every centimetre the mic moves back adds about 0.03 ms. Flipping the DI's polarity changes where the notches fall, not that delay.`}</Body>
            )}
            {predicted != null && (flips.toInv || flips.toNorm) ? <Note tone="ok">{`You predicted “${predicted}”. Δt did not change when you flipped polarity — only moving a mic changes it. Polarity flips the sign: it moves the notches; it does not remove the delay.`}</Note> : null}
            {!rearMode ? <Note>Whether the amp and speaker invert the signal is not known for any real amp from here — so try BOTH polarity settings by ear, in mono, and keep the fuller one. In a fixed studio setup the DI can also be delayed to line up; no single delay or polarity fixes every frequency.</Note> : null}
            <Note tone="warn">{rearMode ? 'Each mic really hears its own side of the cone AND the room, so this graph shows only the shared part. Judge it by ear, in mono, at matched levels.' : 'A real DI and mic differ in more than delay: the amp, the speaker and the room shape the mic’s sound. This graph shows only the shared part — judge the blend by ear, in mono, at matched levels.'}</Note>
          </>
        ),
      },
      { key: 'check', title: 'Check', kind: 'CHECK', layout: 'read', body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'twoMic')} answers={answers} onAnswered={onAnswered} /> },
    ];
    return <PageSteps steps={steps} />;
  }

  /* ═══════════════ 7 · PRACTICE ═══════════════ */
  function AmpPractice(p: PageProps) {
    return GPractice(p, spec.practice);
  }

  return { instrument: AmpInstrument, sound: AmpSound, setting: AmpSetting, microphone: AmpMicrophone, placement: AmpPlacement, context: AmpContext, twoMic: AmpTwoMic, troubleshoot: PTroubleshoot, practice: AmpPractice };
}

const styles = StyleSheet.create({
  tray: { gap: 6, paddingVertical: 4 },
  trayHead: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  activity: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
});
