/**
 * HAND DRUMS · Page 2 — HOW IT SOUNDS (LESSON_JOURNEY §6 stage 2, §7
 * membranes), the family's version of pages/PSound.tsx. FULLY SILENT: how
 * the drum PRODUCES and RADIATES sound, shown with real physics, never played.
 *
 *   STRIKE TO SOUND (rack)  PREDICT FIRST, then the four events on the drum
 *                           cut open (the lesson's art.StrikeSequence): STEP
 *                           through them or PLAY ONCE — a staged reveal that
 *                           stops at ④ (not a loop, D8).
 *   THE HEAD'S SHAPES (rack) one IDEAL membrane shape (the Bessel tables
 *                           shared with the Cymatics and Drum Tuning Labs):
 *                           still lines, + / −, the ratio to the lowest, and
 *                           how much moves under the strike. SWING by hand.
 *   WHERE IT LANDS (rack)   the lesson's strokes (sourced descriptions at
 *                           drawing positions) and how strongly each point
 *                           drives the first five shapes (strikeShare).
 *   TOP AND BOTTOM (read)   the attack and the body in words; the checks.
 * Credit: the strike sequence reached ④ + the checks.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { cancelAnimation, Easing, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, fonts } from '../../../../../../../theme/tokens';
import { useAnimationsAllowed } from '../../../../../../../features/settings/a11y';
import type { BezelItem, DockParam } from '../../../../../rack/rackTypes';
import { HEAD_SHAPES, strikeShare } from '../../../../engine/physics/membrane.ts';
import { MembraneFace } from '../../../../engine/scene/MembraneFace';
import { PageSteps, type MikingStep } from '../../../../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../../../engine/kit';
import type { PageProps } from '../../../../pages/pageTypes';
import { handOf } from '../family.ts';
import { faceLook } from '../handDrumArt';
import { StrokeMap, strokeShares } from '../handSoundArt';

const STEP_MS = 1300;

function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

export function HSound({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant, setVariant, hidden }: PageProps) {
  const H = handOf(lesson);
  const S = lesson.sound;
  const n = S.stages.length;
  const motion = useAnimationsAllowed();
  const focused = useFocusedSafe();
  const reveal = useSharedValue(1);
  const [shown, setShown] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [predicted, setPredicted] = useState<string | null>(null);
  const open = H.openEnd[variant] ?? H.openEnd.default;
  const multi = lesson.model.variants.length > 1;

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
  useEffect(() => {
    if (shown >= n && !interactiveDone.has('soundPath')) onInteractive('soundPath');
  }, [shown, n, interactiveDone, onInteractive]);

  const stage = S.stages[shown - 1];
  // `ported` carries a stage's words for a drum whose lower end is CLEAR of the floor.
  const stageText = (i: number) => (open && S.stages[i].ported ? S.stages[i].ported! : S.stages[i].text);

  /* ── the head's shapes ── */
  const [shapeIdx, setShapeIdx] = useState(0);
  const [pointId, setPointId] = useState(H.facePoints[0]?.id ?? '');
  const [swing, setSwing] = useState(1);
  const shape = HEAD_SHAPES[shapeIdx];
  const point = H.facePoints.find((p) => p.id === pointId) ?? H.facePoints[0];
  const R = S.head.diameterMm / 2;
  const share = strikeShare(shape, point.frac);
  const sharePct = Math.round(share * 100);
  const look = useMemo(() => faceLook({ ...H.drum, R }, H.face.kind, H.face.lugs, H.headLook), [H, R]);

  /* ── where the hand / stick lands ── */
  const [strokeId, setStrokeId] = useState(H.strokes.items[0]?.id ?? '');
  const stroke = H.strokes.items.find((s) => s.id === strokeId) ?? H.strokes.items[0];
  const strokeDrum = (stroke.drum && H.drums?.[stroke.drum]) || H.drum;
  const shares = strokeShares(stroke.frac);
  const top = shares.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v)[0];

  const setupParam: DockParam[] = multi
    ? [
        {
          kind: 'options',
          id: 'setup',
          label: H.variantKey,
          valueLabel: (lesson.model.variants.find((v) => v.id === variant)?.label ?? '').split(' ')[0],
          selectedId: variant,
          onSelect: (id) => setVariant(id),
          options: lesson.model.variants.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })),
        },
      ]
    : [];
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
      ...setupParam,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shown, n, stage, playing, motion, variant, lesson.model.variants],
  );
  const strikeBezel: BezelItem[] = [
    { k: 'EVENT', v: `${shown} / ${n}`, flex: 0.8 },
    { k: 'HEAD', v: shown >= 2 ? 'PUSHED IN' : 'AT REST', flex: 1.2 },
    { k: 'AIR', v: shown >= 3 ? 'PUSHED DOWN' : 'AT REST', flex: 1.3 },
    { k: 'OPEN END', v: open ? 'CLEAR' : 'ON FLOOR', flex: 1.1 },
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
      id: 'point',
      label: 'STRIKE',
      valueLabel: point.label,
      selectedId: point.id,
      onSelect: setPointId,
      sticky: true,
      options: H.facePoints.map((p) => ({ id: p.id, label: p.label, blurb: p.blurb })),
    },
  ];
  const shapeBezel: BezelItem[] = [
    { k: 'SHAPE', v: shape.label, flex: 0.8 },
    { k: 'RATIO', v: `× ${shape.ratio.toFixed(2)}`, sub: 'vs lowest', flex: 0.9 },
    { k: `UNDER ${H.strikeWord}`, v: `${sharePct} %`, sub: 'of its peak', tint: share < 0.05 ? '#ff6b5e' : undefined, flex: 1.3 },
    { k: 'STILL LINES', v: shape.n + shape.s - 1 === 0 ? 'NONE' : `${shape.n + shape.s - 1}`, flex: 1 },
  ];

  const strokeParams: DockParam[] = [
    {
      kind: 'options',
      id: 'stroke',
      label: H.strokes.key ?? (H.tool === 'stick' ? 'STICK ON' : 'STROKE'),
      valueLabel: stroke.short,
      selectedId: stroke.id,
      onSelect: setStrokeId,
      sticky: true,
      options: H.strokes.items.map((s) => ({ id: s.id, label: s.label, blurb: s.text })),
    },
  ];
  const strokeBezel: BezelItem[] = [
    { k: H.strokes.key === 'HEAD' ? 'HEAD' : H.tool === 'stick' ? 'TARGET' : 'STROKE', v: stroke.short, flex: 1.2 },
    { k: 'WHERE', v: stroke.frac == null ? 'OFF THE HEAD' : stroke.frac < 0.35 ? 'NEAR CENTRE' : stroke.frac < 0.7 ? 'HALFWAY' : 'NEAR EDGE', flex: 1.3 },
    { k: 'DRIVES MOST', v: stroke.frac == null ? '—' : HEAD_SHAPES[top.i].label, flex: 1.1 },
  ];

  const pred = lesson.predictions.sound;
  const Strike = art.StrikeSequence;
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
            <Strike w={w} h={h} variant={variant} reveal={reveal} shown={shown} accessibilityLabel={`The ${H.drum.name} cut open down its middle. Event ${shown} of ${n}: ${stage.title}. ${stageText(shown - 1)}`} />
          ) : (
            <Text style={styles.missing}>No drawing for this step.</Text>
          ),
        badge: H.soundBadge,
        bezel: strikeBezel,
        params: strikeParams,
        initialParam: 'step',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={`The ${H.drum.name} cut open · ${open ? 'lower end clear' : 'lower end on the floor'}`} prompt="STEP through the strike, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
          <Card>
            <Point title={`${shown} · ${stage.title.toUpperCase()}`}>{stageText(shown - 1)}</Point>
          </Card>
          {reached && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. ${H.soundReveal}`}</Note> : null}
          {reached ? <Note>Then the head springs back and keeps ringing for a moment — the BODY of the sound. How long depends on the head, its tuning, the drum and the player’s hand.</Note> : null}
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
            strikeMm={point.frac * R}
            swing={swing}
            look={{ under: look.under, over: look.over, head: look.head, strikeLabel: H.strikeWord }}
            accessibilityLabel={`The ${S.head.label}, in the shape ${shape.label}: ${shape.still}. ${Math.abs(swing) < 0.05 ? 'Passing through flat.' : 'Blue regions move up, amber down.'} At the strike point, ${point.label.toLowerCase()}, the head moves ${sharePct} percent of this shape's peak.`}
          />
        ),
        badge: 'A simplified picture: one head on its own, no air, no shell · blue + one way, amber − the other',
        bezel: shapeBezel,
        params: shapeParams,
        initialParam: 'shape',
      },
      well: (
        <>
          <Landing looking={`${S.head.label} · shape ${shape.label}`} prompt="Step through SHAPE, then try each STRIKE point. Which shapes does a strike at the centre leave still?" />
          <Card>
            <Point title={`SHAPE ${shape.label} · ${shape.still.toUpperCase()}`}>
              {`A struck head vibrates in several shapes at once; this is one of them. ${shapeIdx === 0 ? 'It is the lowest shape — the others are measured against it, and none of them is a whole-number multiple, which is part of why a drum sounds less “pitched” than a string.' : `Its pitch is ${shape.ratio.toFixed(2)} times the lowest shape’s on a simplified head — not a whole number.`} At this strike point (${point.label.toLowerCase()}) the head moves ${sharePct} % of this shape’s peak, so the strike ${share < 0.05 ? 'does not drive this shape at all: it lands on a still line' : share < 0.4 ? 'drives it only a little' : 'drives it strongly'}.`}
            </Point>
          </Card>
          <Note>A shape is set moving only as much as the head moves at the strike point in that shape. At the exact centre, every shape with a still line across the head stands still — so a strike there drives only the ring-shaped ones. Toward the edge, the shapes with still lines across the head join in.</Note>
          <Note>This is a simplified head in empty space. On a real drum the air in the shell, the rim and the hand pull these numbers around.</Note>
        </>
      ),
    },
    {
      key: 'strokes',
      title: H.strokes.title,
      kind: 'COMPARE',
      layout: 'rack',
      rack: {
        render: (w, h) => <StrokeMap w={w} h={h} drum={strokeDrum} scaleR={Math.max(H.drum.R, ...Object.values(H.drums ?? {}).map((x) => x.R))} head={H.headLook} stroke={stroke} accessibilityLabel={`The ${strokeDrum.name} head from above, the player at the left. ${stroke.label}: ${stroke.text} ${stroke.frac == null ? 'This lands off the head, so the head’s shapes are not shown driven.' : `At this point it drives ${HEAD_SHAPES.map((sh, i) => `${sh.label} ${Math.round(shares[i] * 100)} percent`).join(', ')}.`}`} />,
        badge: H.strokes.badge,
        bezel: strokeBezel,
        params: strokeParams,
        initialParam: 'stroke',
      },
      well: (
        <>
          <Landing looking={`The ${strokeDrum.name} head from above · ${stroke.label.toLowerCase()}`} prompt={H.strokes.intro} />
          <Card>
            <Point title={stroke.label.toUpperCase()}>{stroke.text}</Point>
          </Card>
          {stroke.frac != null ? (
            <Body>{`At this spot the strike drives ${HEAD_SHAPES[top.i].label} most (${Math.round(top.v * 100)} % of its peak), and the lowest shape (0,1) ${Math.round(shares[0] * 100)} %. ${stroke.frac < 0.35 ? 'Near the centre the ring-shaped shapes dominate — a rounder, lower sound.' : 'Toward the edge the shapes with still lines across the head join in — more of the higher shapes.'}`}</Body>
          ) : null}
          <Note>{H.strokes.note}</Note>
        </>
      ),
    },
    {
      key: 'body',
      title: 'Top and bottom',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="ATTACK">{S.attack}</Point>
            <Point title="BODY">{S.body}</Point>
          </Card>
          <Note>This lab never plays a sound and draws no frequency curve for the drum: how a real drum sounds depends on the drum, the head, the tuning and the player. The pictures show where the sound comes from and where it leaves.</Note>
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
