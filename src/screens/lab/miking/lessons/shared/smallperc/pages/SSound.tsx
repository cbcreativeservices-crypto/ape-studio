/**
 * HOW IT SOUNDS for the SMALL-PERCUSSION family (LESSON_JOURNEY §6 stage 2,
 * §7: idiophones have no drumhead — the membrane-shapes step of the drum page
 * does not apply, so this page has three steps). FULLY SILENT: "the sounds"
 * is how the instrument PRODUCES and RADIATES sound, shown, never played.
 *
 *   STRIKE TO SOUND (rack)  PREDICT FIRST, then the four events on the
 *                           instrument, numbered (an EXPLANATORY OVERLAY):
 *                           STEP through them, or PLAY ONCE — a staged reveal
 *                           that stops at ④ (not a loop, D8); PAUSE stops it
 *                           where it is. Under reduced motion PLAY advances
 *                           one step, instantly. It stops when the page is
 *                           covered.
 *   THE MOTION (rack)       the lesson's own pair of motions (copy.sound.pair:
 *                           the fill at the stroke's end or mid-stroke, a
 *                           clave cradled or squeezed, a long or short
 *                           scrape …), swung by hand.
 *   ATTACK AND BODY (read)  in words — no curve, no invented time scale — then
 *                           the three checks.
 * Credit: the strike sequence reached ④ + the three checks.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { cancelAnimation, Easing, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, fonts } from '../../../../../../../theme/tokens';
import { useAnimationsAllowed } from '../../../../../../../features/settings/a11y';
import type { BezelItem, DockParam } from '../../../../../rack/rackTypes';
import { copyOf } from '../../../../engine/model/copy.ts';
import { PageSteps, type MikingStep } from '../../../../engine/steps';
import { Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../../../engine/kit';
import type { PageProps } from '../../../../pages/pageTypes';
import { spOf } from '../family.ts';

const STEP_MS = 1300;

function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

export function SSound({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant, setVariant, hidden }: PageProps) {
  const S = lesson.sound;
  const C = copyOf(lesson);
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
  const stageText = (i: number) => S.stages[i].byVariant?.[variant] ?? S.stages[i].text;

  const P = C.sound.pair;
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
        id: 'state',
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
  const strikeBezel: BezelItem[] = [
    { k: 'EVENT', v: `${shown} / ${n}`, flex: 0.8 },
    ...C.sound.cells.map((c) => {
      const at = c.byVariant?.[variant] ?? c.at;
      return { k: c.k, v: at[Math.min(at.length - 1, shown - 1)] ?? '—', flex: c.flex ?? 1 };
    }),
  ];

  const pairParams: DockParam[] = P
    ? [
        {
          kind: 'fader',
          id: 'swing',
          label: 'SWING',
          value: (pairSwing + 1) / 2,
          home: 1,
          onChange: (v) => setPairSwing(Math.round((v * 2 - 1) * 20) / 20),
          format: () => (Math.abs(pairSwing) < 0.05 ? P.rest : `${Math.round(Math.abs(pairSwing) * 100)} % of the way, ${pairSwing > 0 ? 'one way' : 'the other way'}`),
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
      ]
    : [];
  const PM = P ? P[pair] : null;
  const pairBezel: BezelItem[] =
    P && PM
      ? [
          { k: P.cells[0], v: PM.v0, sub: PM.sub0, flex: 1 },
          { k: P.cells[1], v: PM.v1, flex: 1.1 },
          { k: P.cells[2], v: Math.abs(pairSwing) < 0.05 ? PM.air.rest : pairSwing > 0 ? PM.air.plus : PM.air.minus, flex: 1.1 },
        ]
      : [];

  const pred = lesson.predictions.sound;
  const Strike = art.StrikeSequence;
  const Coupled = art.CoupledHeads;
  const reached = shown >= n;
  const steps: MikingStep[] = [
    {
      key: 'strike',
      title: spOf(lesson).strikeTitle,
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: (w, h) =>
          Strike ? (
            <Strike w={w} h={h} variant={variant} reveal={reveal} shown={shown} accessibilityLabel={`${C.sound.subject}. Event ${shown} of ${n}: ${stage.title}. ${stageText(shown - 1)}`} />
          ) : (
            <Text style={styles.missing}>No drawing for this step.</Text>
          ),
        badge: 'The order of events, not their speed · motion drawn larger than it really is · silent',
        bezel: strikeBezel,
        params: strikeParams,
        initialParam: 'step',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={C.sound.looking[variant] ?? 'Side view'} prompt="STEP through it, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
          <Card>
            <Point title={`${shown} · ${stage.title.toUpperCase()}`}>{stageText(shown - 1)}</Point>
          </Card>
          {reached && predicted != null && C.sound.reveal ? <Note tone="ok">{`You predicted “${predicted}”. ${C.sound.reveal}`}</Note> : null}
          {reached ? <Note>{C.sound.after}</Note> : null}
        </>
      ),
    },
  ];
  if (P && PM) {
    steps.push({
      key: 'motion',
      title: P.title,
      kind: 'COMPARE',
      layout: 'rack',
      rack: {
        render: (w, h) =>
          Coupled ? (
            <Coupled w={w} h={h} variant={variant} mode={pair} swing={pairSwing} accessibilityLabel={`${C.sound.coupledSubject}: ${PM.title.toLowerCase()}. ${PM.blurb} Motion drawn larger.`} />
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
    });
  }
  steps.push({
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
        {C.sound.shapesNotes.map((t) => (
          <Note key={t.slice(0, 24)}>{t}</Note>
        ))}
        <Note>{C.sound.silentNote}</Note>
        <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
      </>
    ),
  });
  return <PageSteps steps={steps} />;
}

const styles = StyleSheet.create({
  missing: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 13, padding: 12 },
});
