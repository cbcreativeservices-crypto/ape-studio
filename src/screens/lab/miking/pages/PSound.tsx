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
import { KETTLE_SHAPES } from '../engine/physics/kettle.ts';
import { copyOf, type PairCopy } from '../engine/model/copy.ts';
import { MembraneFace } from '../engine/scene/MembraneFace';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ScenarioList } from '../engine/kit';
import type { PageProps } from './pageTypes';

const STEP_MS = 1300;

/** Step 3's words for a two-headed drum (the default; a lesson with one head
 *  over a kettle, or a frame with jingles, brings its own: copy.sound.pair). */
const TWO_HEADS: PairCopy = {
  title: 'Two heads, one air',
  badge: 'A simplified picture: two equal heads and the air between them · motion drawn larger · no levels or pitches implied',
  looking: 'Side view · both heads in their lowest shape',
  prompt: 'Drag SWING, then switch PAIR. Watch the air between the heads.',
  key: 'PAIR',
  rest: 'both heads passing through rest',
  cells: ['PAIR', 'HEADS', 'AIR'],
  together: {
    option: 'HEADS TOGETHER (the lower one)',
    blurb: 'Both heads move the same way at the same moment; the air inside is carried along rather than squeezed. The lower-pitched of the pair.',
    short: 'TOGETHER',
    title: 'HEADS TOGETHER',
    card: 'Both heads move the same way at the same moment. The air between them is carried along more than squeezed, so it pushes back gently: this is the LOWER-pitched of the pair. It moves little air in the room overall, so it radiates weakly and rings on longer.',
    v0: 'LOWER',
    sub0: 'of the two',
    v1: 'SAME WAY',
    air: { plus: 'CARRIED', minus: 'CARRIED', rest: 'CARRIED' },
  },
  opposed: {
    option: 'HEADS OPPOSED (the higher one)',
    blurb: 'The heads move in and out together, squeezing and easing the air between them; the air’s springiness makes this the higher-pitched of the pair.',
    short: 'OPPOSED',
    title: 'HEADS OPPOSED',
    card: 'The heads move in together, then out together. The air between them is squeezed and eased, and its springiness pushes back hard: this is the HIGHER-pitched of the pair. It changes the drum’s whole volume, so it radiates strongly — and spends its energy sooner.',
    v0: 'HIGHER',
    sub0: 'of the two',
    v1: 'OPPOSITE',
    air: { plus: 'SQUEEZED', minus: 'EASED', rest: 'AT REST' },
  },
};
/** "{ratio}" in a copy line. */
const fillRatio = (s: string, ratio: number) => s.replace('{ratio}', ratio.toFixed(2));

function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

export function PSound({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant, setVariant, hidden }: PageProps) {
  const S = lesson.sound;
  const C = copyOf(lesson);
  /** Where the strike lands on the face-on head (the lesson's own points). */
  const STRIKES = C.sound.strikes;
  const variantLabel = lesson.model.variants.find((v) => v.id === variant)?.label ?? variant.toUpperCase();
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
  const stageText = (i: number) => S.stages[i].byVariant?.[variant] ?? (variant === 'ported' && S.stages[i].ported ? S.stages[i].ported! : S.stages[i].text);

  /* ── the head's shapes ── */
  const [shapeIdx, setShapeIdx] = useState(0);
  const [strikeId, setStrikeId] = useState<string>(C.sound.strikeDefault);
  const [swing, setSwing] = useState(1);
  const SHAPES = S.head.shapes === 'kettle' ? KETTLE_SHAPES : HEAD_SHAPES;
  const shape = SHAPES[shapeIdx];
  const strike = STRIKES.find((s) => s.id === strikeId) ?? STRIKES[0];
  const R = S.head.diameterMm / 2;
  const share = strikeShare(shape, strike.mm / R);
  const sharePct = Math.round(share * 100);

  /* ── two heads, one air (or the lesson's own step 3) ── */
  const P: PairCopy = C.sound.pair ?? TWO_HEADS;
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
        label: C.variantKey,
        valueLabel: variantLabel,
        selectedId: variant,
        onSelect: (id) => setVariant(id),
        options: lesson.model.variants.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shown, n, stage, playing, motion, variant, lesson.model.variants, C.variantKey, variantLabel],
  );
  // The lesson's cells, each read at this event (and for this variant).
  const strikeBezel: BezelItem[] = [
    { k: 'EVENT', v: `${shown} / ${n}`, flex: 0.8 },
    ...C.sound.cells.map((c) => {
      const at = c.byVariant?.[variant] ?? c.at;
      return { k: c.k, v: at[Math.min(at.length - 1, shown - 1)] ?? '—', flex: c.flex ?? 1 };
    }),
  ];

  const shapeParams: DockParam[] = [
    {
      kind: 'fader',
      id: 'shape',
      label: 'SHAPE',
      value: shapeIdx / (SHAPES.length - 1),
      onChange: (v) => setShapeIdx(Math.round(v * (SHAPES.length - 1))),
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
      onSelect: (id) => setStrikeId(id),
      sticky: true,
      options: STRIKES.map((s) => ({ id: s.id, label: s.label, blurb: s.blurb })),
    },
  ];
  const shapeBezel: BezelItem[] = [
    { k: 'SHAPE', v: shape.label, flex: 0.8 },
    { k: 'RATIO', v: `× ${shape.ratio.toFixed(2)}`, sub: C.sound.shapeWords?.ratioSub ?? 'vs lowest', flex: 0.9 },
    { k: `UNDER ${C.sound.striker}`, v: `${sharePct} %`, sub: 'of its peak', tint: share < 0.05 ? '#ff6b5e' : undefined, flex: 1.2 },
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
      format: () => (Math.abs(pairSwing) < 0.05 ? P.rest : `${Math.round(Math.abs(pairSwing) * 100)} % of the swing`),
      formatShort: () => `${Math.round(pairSwing * 100)} %`,
    },
    {
      kind: 'options',
      id: 'pair',
      label: P.key,
      valueLabel: P[pair].short,
      selectedId: pair,
      onSelect: (id) => setPair(id as 'together' | 'opposed'),
      sticky: true,
      options: [
        { id: 'together', label: P.together.option, blurb: P.together.blurb },
        { id: 'opposed', label: P.opposed.option, blurb: P.opposed.blurb },
      ],
    },
  ];
  const PM = P[pair];
  const pairBezel: BezelItem[] = [
    { k: P.cells[0], v: PM.v0, sub: PM.sub0, flex: 1 },
    { k: P.cells[1], v: PM.v1, flex: 1.1 },
    { k: P.cells[2], v: Math.abs(pairSwing) < 0.05 ? PM.air.rest : pairSwing > 0 ? PM.air.plus : PM.air.minus, flex: 1.1 },
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
            <Strike w={w} h={h} variant={variant} reveal={reveal} shown={shown} accessibilityLabel={`${C.sound.subject}. Event ${shown} of ${n}: ${stage.title}. ${stageText(shown - 1)}`} />
          ) : (
            <Text style={styles.missing}>No drawing for this step.</Text>
          ),
        badge: 'The order of events, not their speed · head motion drawn much larger than it really is · silent',
        bezel: strikeBezel,
        params: strikeParams,
        initialParam: 'step',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={C.sound.looking[variant] ?? 'Side view'} prompt="STEP through the strike, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
          <Card>
            <Point title={`${shown} · ${stage.title.toUpperCase()}`}>{stageText(shown - 1)}</Point>
          </Card>
          {reached && predicted != null && C.sound.reveal ? <Note tone="ok">{`You predicted “${predicted}”. ${C.sound.reveal}`}</Note> : null}
          {reached ? <Note>{C.sound.after}</Note> : null}
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
            striker={C.sound.striker}
            hoop={S.head.hoop}
            accessibilityLabel={`The ${S.head.label}, in the shape ${shape.label}: ${shape.still}. ${Math.abs(swing) < 0.05 ? 'Passing through flat.' : 'Blue regions move toward you, amber away.'} Under ${C.sound.strikerPhrase}, ${strike.label.toLowerCase()}, the head moves ${sharePct} percent of this shape's peak.`}
          />
        ),
        badge: C.sound.shapeWords?.badge ?? 'A simplified picture: one head on its own, no air, no second head · blue + toward you, amber − away',
        bezel: shapeBezel,
        params: shapeParams,
        initialParam: 'shape',
      },
      well: (
        <>
          <Landing looking={`${S.head.label} · shape ${shape.label}`} prompt="Step through SHAPE, then try each STRIKE point. Which shapes does a centre strike leave still?" />
          <Card>
            <Point title={`SHAPE ${shape.label} · ${shape.still.toUpperCase()}`}>
              {`A struck head vibrates in several shapes at once; this is one of them. ${C.sound.shapeWords ? fillRatio(Math.abs(shape.ratio - 1) < 1e-9 ? C.sound.shapeWords.lowest : C.sound.shapeWords.other, shape.ratio) : shapeIdx === 0 ? 'It is the lowest shape — the others are measured against it, and none of them is a whole-number multiple, which is part of why a drum sounds less “pitched” than a string.' : `Its pitch is ${shape.ratio.toFixed(2)} times the lowest shape’s on a simplified head — not a whole number, which is part of why a drum sounds less “pitched” than a string.`} Under ${C.sound.strikerPhrase} (${strike.label.toLowerCase()}) the head moves ${sharePct} % of this shape’s peak, so the strike ${share < 0.05 ? `does not drive this shape at all: ${C.sound.strikerPhrase} is on a still line` : share < 0.4 ? 'drives it only a little' : 'drives it strongly'}.`}
            </Point>
          </Card>
          {C.sound.shapesNotes.map((t) => (
            <Note key={t.slice(0, 24)}>{t}</Note>
          ))}
        </>
      ),
    },
    {
      key: 'air',
      title: P.title,
      kind: 'COMPARE',
      layout: 'rack',
      rack: {
        render: (w, h) =>
          Coupled ? (
            <Coupled w={w} h={h} variant={variant} mode={pair} swing={pairSwing} accessibilityLabel={`${C.sound.coupledSubject}: ${PM.title.toLowerCase()}. ${PM.blurb} Motion exaggerated.`} />
          ) : (
            <Text style={styles.missing}>No drawing for this step.</Text>
          ),
        badge: P.badge,
        bezel: pairBezel,
        params: pairParams,
        initialParam: 'swing',
      },
      well: (
        <>
          <Landing looking={P.looking} prompt={P.prompt} />
          <Card>
            <Point title={PM.title}>{PM.card}</Point>
          </Card>
          <Note>{C.sound.coupledNote}</Note>
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
          <Note>{C.sound.silentNote}</Note>
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
