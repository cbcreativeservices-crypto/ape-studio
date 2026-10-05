/**
 * Page 2 — HOW IT SOUNDS (LESSON_JOURNEY §6 stage 2). FULLY SILENT: "the
 * sounds" is how the drum PRODUCES and RADIATES sound, shown with real
 * physics, never played (owner ruling).
 *
 *   STRIKE TO SOUND (rack)  PREDICT FIRST, then the four events on the drum,
 *                           numbered (an EXPLANATORY OVERLAY): STEP through
 *                           them, or PLAY ONCE — a staged reveal that stops at
 *                           ④ (not a loop, D8); PAUSE stops it where it is.
 *                           Under reduced motion PLAY advances one step,
 *                           instantly. It stops when the page is covered.
 *   THE HEAD'S SHAPES (rack) the batter head face-on in one IDEAL membrane
 *                           shape (Bessel tables shared with the Cymatics and
 *                           Drum Tuning Labs): still lines, + / −, the ratio
 *                           to the lowest shape, and how much moves under the
 *                           beater. SWING is dragged by hand.
 *   TWO HEADS, ONE AIR (rack) the two heads' lowest shape coupled through the
 *                           air (the Drum Tuning Lab's two-head model).
 *   ATTACK AND BODY (read)  in words — no curve, no invented time scale — then
 *                           the three checks.
 * Credit: the strike sequence reached ④ + the three checks.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { cancelAnimation, Easing, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, fonts } from '../../../../theme/tokens';
import { useAnimationsAllowed } from '../../../../features/settings/a11y';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import { HEAD_SHAPES, strikeShare } from '../engine/physics/membrane.ts';
import { MembraneFace } from '../engine/scene/MembraneFace';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ProvenanceTag, ScenarioList } from '../engine/kit';
import type { PageProps } from './pageTypes';

const STEP_MS = 1300;
const IN = 25.4;
/** DW: the beater strikes "the center of the drum or an area 1-2 inches above the center". */
const STRIKES = [
  { id: 'c', label: 'CENTRE', mm: 0, blurb: 'The exact centre of the head.' },
  { id: '1', label: '1 IN ABOVE', mm: 1 * IN, blurb: '1 in (25 mm) above the centre — inside the DW pedal manual’s range.' },
  { id: '2', label: '2 IN ABOVE', mm: 2 * IN, blurb: '2 in (51 mm) above the centre — the top of the DW pedal manual’s range.' },
] as const;

function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

export function PSound({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant, setVariant, hidden }: PageProps) {
  const S = lesson.sound;
  const n = S.stages.length;
  const motion = useAnimationsAllowed();
  const focused = useFocusedSafe();
  const reveal = useSharedValue(1);
  const [shown, setShown] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [predicted, setPredicted] = useState<string | null>(null);

  // The integer stage follows the reveal (a handful of React updates per play,
  // never one per frame).
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
  // Covered (the what's-left screen) or out of focus: stop where it is.
  useEffect(() => {
    if ((hidden || !focused) && playing) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden, focused]);
  // `reveal` is a shared value (stable identity): cancel once, on unmount.
  useEffect(() => () => cancelAnimation(reveal), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (shown >= n && !interactiveDone.has('soundPath')) onInteractive('soundPath');
  }, [shown, n, interactiveDone, onInteractive]);

  const stage = S.stages[shown - 1];
  const stageText = (i: number) => (variant === 'ported' && S.stages[i].ported ? S.stages[i].ported! : S.stages[i].text);

  /* ── the head's shapes ── */
  const [shapeIdx, setShapeIdx] = useState(0);
  const [strikeId, setStrikeId] = useState<(typeof STRIKES)[number]['id']>('1');
  const [swing, setSwing] = useState(1);
  const shape = HEAD_SHAPES[shapeIdx];
  const strike = STRIKES.find((s) => s.id === strikeId)!;
  const R = S.head.diameterMm / 2;
  const share = strikeShare(shape, strike.mm / R);
  const sharePct = Math.round(share * 100);

  /* ── two heads, one air ── */
  const [pair, setPair] = useState<'together' | 'opposed'>('together');
  const [pairSwing, setPairSwing] = useState(1);

  const strikeParams: DockParam[] = useMemo(
    () => [
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
        id: 'head',
        label: 'FRONT HEAD',
        valueLabel: variant === 'ported' ? 'PORTED' : 'INTACT',
        selectedId: variant,
        onSelect: (id) => setVariant(id),
        options: lesson.model.variants.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shown, n, stage, playing, motion, variant, lesson.model.variants],
  );
  const strikeBezel: BezelItem[] = [
    { k: 'EVENT', v: `${shown} / ${n}`, flex: 0.8 },
    { k: 'BATTER', v: shown >= 2 ? 'PUSHED IN' : 'AT REST', flex: 1.2 },
    { k: 'FRONT', v: shown >= 3 ? 'PUSHED OUT' : 'AT REST', flex: 1.2 },
    { k: 'PORT', v: variant !== 'ported' ? 'NONE' : shown >= 3 ? 'AIR OUT' : '—', flex: 1 },
  ];

  const shapeParams: DockParam[] = [
    {
      kind: 'fader',
      id: 'shape',
      label: 'SHAPE',
      value: shapeIdx / (HEAD_SHAPES.length - 1),
      onChange: (v) => setShapeIdx(Math.round(v * (HEAD_SHAPES.length - 1))),
      format: () => `${shape.label} · ${shape.still}`,
      formatShort: () => shape.label,
    },
    {
      kind: 'fader',
      id: 'swing',
      label: 'SWING',
      value: (swing + 1) / 2,
      home: 1,
      onChange: (v) => setSwing(Math.round((v * 2 - 1) * 20) / 20),
      format: () => (Math.abs(swing) < 0.05 ? 'passing through flat' : `${Math.round(Math.abs(swing) * 100)} % of its swing, ${swing > 0 ? 'one way' : 'the other way'}`),
      formatShort: () => `${Math.round(swing * 100)} %`,
    },
    {
      kind: 'options',
      id: 'strike',
      label: 'STRIKE',
      valueLabel: strike.label,
      selectedId: strikeId,
      onSelect: (id) => setStrikeId(id as (typeof STRIKES)[number]['id']),
      sticky: true,
      options: STRIKES.map((s) => ({ id: s.id, label: s.label, blurb: s.blurb })),
    },
  ];
  const shapeBezel: BezelItem[] = [
    { k: 'SHAPE', v: shape.label, flex: 0.8 },
    { k: 'RATIO', v: `× ${shape.ratio.toFixed(2)}`, sub: 'ideal', flex: 0.9 },
    { k: 'UNDER BEATER', v: `${sharePct} %`, sub: 'of its peak', tint: share < 0.05 ? '#ff6b5e' : undefined, flex: 1.2 },
    { k: 'STILL LINES', v: shape.n + shape.s - 1 === 0 ? 'NONE' : `${shape.n + shape.s - 1}`, flex: 1 },
  ];

  const pairParams: DockParam[] = [
    {
      kind: 'fader',
      id: 'swing',
      label: 'SWING',
      value: (pairSwing + 1) / 2,
      home: 1,
      onChange: (v) => setPairSwing(Math.round((v * 2 - 1) * 20) / 20),
      format: () => (Math.abs(pairSwing) < 0.05 ? 'both heads passing through rest' : `${Math.round(Math.abs(pairSwing) * 100)} % of the swing`),
      formatShort: () => `${Math.round(pairSwing * 100)} %`,
    },
    {
      kind: 'options',
      id: 'pair',
      label: 'PAIR',
      valueLabel: pair === 'together' ? 'TOGETHER' : 'OPPOSED',
      selectedId: pair,
      onSelect: (id) => setPair(id as 'together' | 'opposed'),
      sticky: true,
      options: [
        { id: 'together', label: 'HEADS TOGETHER (the lower one)', blurb: 'Both heads move the same way at the same moment; the air inside is carried along rather than squeezed. The lower-pitched of the pair.' },
        { id: 'opposed', label: 'HEADS OPPOSED (the higher one)', blurb: 'The heads move in and out together, squeezing and easing the air between them; the air’s springiness makes this the higher-pitched of the pair.' },
      ],
    },
  ];
  const pairBezel: BezelItem[] = [
    { k: 'PAIR', v: pair === 'together' ? 'LOWER' : 'HIGHER', sub: 'of the two', flex: 1 },
    { k: 'HEADS', v: pair === 'together' ? 'SAME WAY' : 'OPPOSITE', flex: 1.1 },
    { k: 'AIR', v: pair === 'together' ? 'CARRIED' : Math.abs(pairSwing) < 0.05 ? 'AT REST' : pairSwing > 0 ? 'SQUEEZED' : 'EASED', flex: 1.1 },
  ];

  const pred = lesson.predictions.sound;
  const Strike = art.StrikeSequence;
  const Coupled = art.CoupledHeads;
  const reached = shown >= n;
  const steps: MikingStep[] = [
    {
      key: 'strike',
      title: 'Strike to sound',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: (w, h) =>
          Strike ? (
            <Strike w={w} h={h} variant={variant} reveal={reveal} shown={shown} accessibilityLabel={`Side view of the kick, cut open. Event ${shown} of ${n}: ${stage.title}. ${stageText(shown - 1)}`} />
          ) : (
            <Text style={styles.missing}>No drawing for this step.</Text>
          ),
        badge: 'EXPLANATORY OVERLAY · the ORDER of events, not their speed or size · head motion EXAGGERATED (ideal membrane’s lowest shape) · silent',
        bezel: strikeBezel,
        params: strikeParams,
        initialParam: 'step',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={`Side view · the kick cut open · ${variant === 'ported' ? 'ported' : 'intact'} front head`} prompt="STEP through the strike, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
          <Card>
            <Point title={`${shown} · ${stage.title.toUpperCase()}`}>{stageText(shown - 1)}</Point>
          </Card>
          {reached && predicted != null ? (
            <Note tone="ok">{`You predicted “${predicted}”. The squeezed air pushes the front head OUTWARD, away from the player — both heads move the same way at that moment. The two heads are coupled through the air inside.`}</Note>
          ) : null}
          {reached ? <Note>Then both heads spring back and keep ringing for a while — the BODY of the sound. How long depends on the tuning, the damping and the drum (the Drum Tuning Lab covers that).</Note> : null}
        </>
      ),
    },
    {
      key: 'shapes',
      title: 'The head’s shapes',
      kind: 'COMPARE',
      layout: 'rack',
      rack: {
        render: (w, h) => (
          <MembraneFace
            w={w}
            h={h}
            diameterMm={S.head.diameterMm}
            rods={S.head.rods}
            shape={shape}
            strikeMm={strike.mm}
            swing={swing}
            accessibilityLabel={`The ${S.head.label}, in the ideal shape ${shape.label}: ${shape.still}. ${Math.abs(swing) < 0.05 ? 'Passing through flat.' : 'Blue regions move toward you, amber away.'} Under the beater, ${strike.label.toLowerCase()}, the head moves ${sharePct} percent of this shape's peak.`}
          />
        ),
        badge: 'IDEAL MEMBRANE · exact Bessel shapes · no air, no second head · blue + toward you, amber − away · claw positions ILLUSTRATIVE',
        bezel: shapeBezel,
        params: shapeParams,
        initialParam: 'shape',
      },
      well: (
        <>
          <Landing looking={`${S.head.label} · shape ${shape.label}`} prompt="Step through SHAPE, then try each STRIKE point. Which shapes does a centre strike leave still?" />
          <Card>
            <Point title={`SHAPE ${shape.label} · ${shape.still.toUpperCase()}`}>
              {`A struck head vibrates in several shapes at once; this is one of them. Its pitch is ${shape.ratio.toFixed(2)} times the lowest shape’s on an ideal head — not a whole number, which is part of why a drum sounds less “pitched” than a string. Under the beater (${strike.label.toLowerCase()}) the head moves ${sharePct} % of this shape’s peak, so the strike ${share < 0.05 ? 'does not drive this shape at all: the beater is on a still line' : share < 0.4 ? 'drives it only a little' : 'drives it strongly'}.`}
            </Point>
            <ProvenanceTag kind="ideal" />
          </Card>
          <Note>A shape is set moving only as much as the head moves at the strike point in that shape. At the exact centre, every shape with a still line across the head stands still — so a centre strike drives only the ring-shaped ones. The DW pedal manual puts the strike at the centre or 1–2 in above it.</Note>
          <Note>This is an ideal head in empty space. On a real kick, the air inside and the second head pull these numbers around — the next step shows the two heads working together.</Note>
        </>
      ),
    },
    {
      key: 'air',
      title: 'Two heads, one air',
      kind: 'COMPARE',
      layout: 'rack',
      rack: {
        render: (w, h) =>
          Coupled ? (
            <Coupled w={w} h={h} variant={variant} mode={pair} swing={pairSwing} accessibilityLabel={`Side view of the kick: both heads in their lowest shape, ${pair === 'together' ? 'moving the same way, the air carried along' : 'moving in and out together, the air squeezed and eased'}. Motion exaggerated.`} />
          ) : (
            <Text style={styles.missing}>No drawing for this step.</Text>
          ),
        badge: 'IDEAL two-head model (the Drum Tuning Lab’s) · equal heads · motion EXAGGERATED · no levels or pitches implied',
        bezel: pairBezel,
        params: pairParams,
        initialParam: 'swing',
      },
      well: (
        <>
          <Landing looking="Side view · both heads in their lowest shape" prompt="Drag SWING, then switch PAIR. Watch the air between the heads." />
          <Card>
            <Point title={pair === 'together' ? 'HEADS TOGETHER' : 'HEADS OPPOSED'}>
              {pair === 'together'
                ? 'Both heads move the same way at the same moment. The air between them is carried along more than squeezed, so it pushes back gently: this is the LOWER-pitched of the pair. It moves little air in the room overall, so it radiates weakly and rings on longer.'
                : 'The heads move in together, then out together. The air between them is squeezed and eased, and its springiness pushes back hard: this is the HIGHER-pitched of the pair. It changes the drum’s whole volume, so it radiates strongly — and spends its energy sooner.'}
            </Point>
            <ProvenanceTag kind="ideal" />
          </Card>
          <Note>One strike sets both going; the sound you hear is the two together. A port lets some of the squeezed air out — the moving air that can pop a mic at the port.</Note>
        </>
      ),
    },
    {
      key: 'body',
      title: 'Attack and body',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="ATTACK">{S.attack}</Point>
            <Point title="BODY">{S.body}</Point>
          </Card>
          <Note>This lab never plays a sound and draws no frequency curve for the drum: how a real kick sounds depends on the drum, the heads, the tuning, the beater and the player. The pictures show where the sound comes from and where it leaves.</Note>
          {!reached ? <Note tone="warn">The strike sequence on step 1 has not reached its end yet — step it through to earn this page’s credit.</Note> : null}
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

const styles = StyleSheet.create({
  missing: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 13, padding: 12 },
});
