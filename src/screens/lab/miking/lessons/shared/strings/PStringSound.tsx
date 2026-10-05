/**
 * Page 2 for a STRING instrument — HOW IT SOUNDS (LESSON_JOURNEY §6 stage 2,
 * §7 strings row). FULLY SILENT: how the instrument PRODUCES and RADIATES
 * sound, shown with real physics, never played (owner ruling). A lesson's own
 * page (LessonArt.pages.sound) for Lab 4's keyboards and harp; the drum page
 * (pages/PSound.tsx) is unchanged.
 *
 *   THE SEQUENCE (rack)   PREDICT FIRST, then the events on the instrument,
 *                         numbered (the lesson's StrikeSequence art): STEP
 *                         through them, or PLAY ONCE — a staged reveal that
 *                         stops at the end (not a loop, D8). Under reduced
 *                         motion PLAY advances one step, instantly. It stops
 *                         when the page is covered or loses focus.
 *   THE STRING'S SHAPES   one shape of an IDEAL string (stringModes.ts): its
 *   (rack)                still points, its whole-number ratio, and how much
 *                         of it the strike / pluck / pickup point meets.
 *                         SWING is dragged by hand.
 *   WHERE IT LEAVES       the instrument with where the sound leaves it drawn
 *   (rack)                as an overlay (direction, never an amount) and the
 *                         lesson's own option (a lid, a wall, a sound hole).
 *   ATTACK AND BODY (read) in words, then the three checks.
 * Credit: the sequence reached its end + the three checks (as the drums).
 */
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { cancelAnimation, Easing, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, fonts } from '../../../../../../theme/tokens';
import { useAnimationsAllowed } from '../../../../../../features/settings/a11y';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { VariantId } from '../../../engine/model/types.ts';
import type { CopyCell } from '../../../engine/model/copy.ts';
import { copyOf } from '../../../engine/model/copy.ts';
import { MAX_SHAPE, stillPoints, stringShare, STRING_SHAPES } from '../../../engine/physics/stringModes.ts';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { StringShapes, type StringEnds } from './StringShapes';

const STEP_MS = 1300;

export type StringPoint = { id: string; label: string; frac: number; blurb: string };
export type RadiateOption = { id: string; label: string; blurb: string; card: { title: string; text: string } };
export type StringSoundSpec = {
  /** The first step's title ("Key to sound"). */
  seqTitle: string;
  /** The sequence in words, for the screen reader ("Side view of the grand, cut open"). */
  subject: string;
  looking: Readonly<Partial<Record<VariantId, string>>>;
  /** The bezel cells, their value at each event (index = event − 1). */
  cells: readonly CopyCell[];
  badge: string;
  /** After the sequence reached its end with a prediction made / without. */
  reveal: string;
  after: string;
  shapes: {
    /** "HAMMER", "PLUCK", "PICKUP" — the point's word on the drawing and the bezel. */
    word: string;
    /** In a sentence ("the hammer"). */
    phrase: string;
    points: readonly StringPoint[];
    defaultPoint: string;
    ends: StringEnds;
    /** What the string is in words ("one of the piano's strings"). */
    subject: string;
    notes: readonly string[];
  };
  radiate: {
    title: string;
    key: string;
    options: (variant: VariantId) => readonly RadiateOption[];
    defaultOption: (variant: VariantId) => string;
    Component: (props: { w: number; h: number; variant: VariantId; option: string; accessibilityLabel: string }) => ReactElement;
    badge: string;
    looking: (variant: VariantId) => string;
    prompt: string;
    bezel: (variant: VariantId, option: string) => BezelItem[];
  };
  silentNote: string;
};

function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

export function makeStringSoundPage(spec: StringSoundSpec) {
  return function PStringSound({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant, setVariant, hidden }: PageProps) {
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
    const stageText = (i: number) => S.stages[i].byVariant?.[variant] ?? S.stages[i].text;
    const setupParam: DockParam = {
      kind: 'options',
      id: 'setup',
      label: C.variantKey,
      valueLabel: variantLabel,
      selectedId: variant,
      onSelect: (id) => setVariant(id),
      options: lesson.model.variants.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })),
    };

    const seqParams: DockParam[] = useMemo(
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
        setupParam,
      ],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [shown, n, stage, playing, motion, variant, variantLabel],
    );
    const seqBezel: BezelItem[] = [
      { k: 'EVENT', v: `${shown} / ${n}`, flex: 0.8 },
      ...spec.cells.map((c) => {
        const at = c.byVariant?.[variant] ?? c.at;
        return { k: c.k, v: at[Math.min(at.length - 1, shown - 1)] ?? '—', flex: c.flex ?? 1 };
      }),
    ];

    /* ── the string's shapes ── */
    const SH = spec.shapes;
    const [shapeIdx, setShapeIdx] = useState(0);
    const [pointId, setPointId] = useState(SH.defaultPoint);
    const [swing, setSwing] = useState(1);
    const shape = STRING_SHAPES[shapeIdx];
    const pt = SH.points.find((q) => q.id === pointId) ?? SH.points[0];
    const share = stringShare(shape.n, pt.frac);
    const pct = Math.round(share * 100);
    const still = stillPoints(shape.n).length;
    const shapeParams: DockParam[] = [
      {
        kind: 'fader',
        id: 'shape',
        label: 'SHAPE',
        value: shapeIdx / (MAX_SHAPE - 1),
        onChange: (v) => setShapeIdx(Math.round(v * (MAX_SHAPE - 1))),
        format: () => `${shape.label} · ${shape.still}`,
        formatShort: () => `${shape.n}`,
      },
      {
        kind: 'fader',
        id: 'swing',
        label: 'SWING',
        value: (swing + 1) / 2,
        home: 1,
        onChange: (v) => setSwing(Math.round((v * 2 - 1) * 20) / 20),
        format: () => (Math.abs(swing) < 0.05 ? 'passing through straight' : `${Math.round(Math.abs(swing) * 100)} % of its swing, ${swing > 0 ? 'one way' : 'the other way'}`),
        formatShort: () => `${Math.round(swing * 100)} %`,
      },
      {
        kind: 'options',
        id: 'point',
        label: SH.word,
        valueLabel: pt.label,
        selectedId: pointId,
        onSelect: (id) => setPointId(id),
        sticky: true,
        options: SH.points.map((q) => ({ id: q.id, label: q.label, blurb: q.blurb })),
      },
    ];
    const shapeBezel: BezelItem[] = [
      { k: 'SHAPE', v: `${shape.n}`, flex: 0.7 },
      { k: 'RATIO', v: `× ${shape.ratio}`, sub: 'vs lowest', flex: 0.9 },
      { k: `AT ${SH.word}`, v: `${pct} %`, sub: 'of its peak', tint: share < 0.05 ? '#ff6b5e' : undefined, flex: 1.2 },
      { k: 'STILL POINTS', v: still === 0 ? 'NONE' : `${still}`, flex: 1.1 },
    ];

    /* ── where it leaves ── */
    const R = spec.radiate;
    const opts = R.options(variant);
    const [optId, setOptId] = useState<string>(() => R.defaultOption(variant));
    const opt = opts.find((o) => o.id === optId) ?? opts[0];
    useEffect(() => {
      if (!opts.some((o) => o.id === optId)) setOptId(R.defaultOption(variant));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variant]);
    const radParams: DockParam[] = [
      {
        kind: 'options',
        id: 'opt',
        label: R.key,
        valueLabel: opt.label,
        selectedId: opt.id,
        onSelect: (id) => setOptId(id),
        sticky: true,
        options: opts.map((o) => ({ id: o.id, label: o.label, blurb: o.blurb })),
      },
      setupParam,
    ];

    const pred = lesson.predictions.sound;
    const Seq = art.StrikeSequence;
    const reached = shown >= n;
    const RadComp = R.Component;
    const steps: MikingStep[] = [
      {
        key: 'seq',
        title: spec.seqTitle,
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) =>
            Seq ? (
              <Seq w={w} h={h} variant={variant} reveal={reveal} shown={shown} accessibilityLabel={`${spec.subject}. Event ${shown} of ${n}: ${stage.title}. ${stageText(shown - 1)}`} />
            ) : (
              <Text style={styles.missing}>No drawing for this step.</Text>
            ),
          badge: spec.badge,
          bezel: seqBezel,
          params: seqParams,
          initialParam: 'step',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking={spec.looking[variant] ?? 'Side view'} prompt="STEP through it, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
            <Card>
              <Point title={`${shown} · ${stage.title.toUpperCase()}`}>{stageText(shown - 1)}</Point>
            </Card>
            {reached && predicted != null && spec.reveal ? <Note tone="ok">{`You predicted “${predicted}”. ${spec.reveal}`}</Note> : null}
            {reached ? <Note>{spec.after}</Note> : null}
          </>
        ),
      },
      {
        key: 'shapes',
        title: 'The string’s shapes',
        kind: 'COMPARE',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <StringShapes
              w={w}
              h={h}
              n={shape.n}
              swing={swing}
              point={pt.frac}
              pointWord={SH.word}
              ends={SH.ends}
              accessibilityLabel={`${SH.subject} in shape ${shape.n}: ${shape.still}. ${Math.abs(swing) < 0.05 ? 'Passing through straight.' : 'Blue parts move one way, amber the other.'} At ${SH.phrase} (${pt.label.toLowerCase()}) the string moves ${pct} percent of this shape's peak.`}
            />
          ),
          badge: 'A simplified picture: an ideal, flexible string · motion drawn much larger · blue and amber move opposite ways',
          bezel: shapeBezel,
          params: shapeParams,
          initialParam: 'shape',
        },
        well: (
          <>
            <Landing looking={`${SH.subject} · shape ${shape.n}`} prompt={`Step through SHAPE, then try each ${SH.word} point. Which shapes does each point leave still?`} />
            <Card>
              <Point title={`SHAPE ${shape.n} · ${shape.still.toUpperCase()}`}>
                {`A plucked or struck string vibrates in several shapes at once; this is one of them. ${shape.n === 1 ? 'It is the lowest — the note you name.' : `Its pitch is exactly ${shape.n} times the lowest on an ideal string: a whole number, which is why a string sounds clearly pitched (a drumhead’s shapes are not whole numbers).`} At ${SH.phrase} (${pt.label.toLowerCase()}) the string moves ${pct} % of this shape’s peak, so ${share < 0.05 ? `${SH.phrase} is on a still point: it cannot set this shape going at all` : `it can set this shape going — the nearer to the shape’s peak, the harder; only a still point leaves a shape out`}.`}
              </Point>
            </Card>
            {SH.notes.map((t) => (
              <Note key={t.slice(0, 24)}>{t}</Note>
            ))}
          </>
        ),
      },
      {
        key: 'radiate',
        title: R.title,
        kind: 'COMPARE',
        layout: 'rack',
        rack: {
          render: (w, h) => <RadComp w={w} h={h} variant={variant} option={opt.id} accessibilityLabel={`${R.looking(variant)}. ${opt.card.title}: ${opt.card.text}`} />,
          badge: R.badge,
          bezel: R.bezel(variant, opt.id),
          params: radParams,
          initialParam: 'opt',
        },
        well: (
          <>
            <Landing looking={R.looking(variant)} prompt={R.prompt} />
            <Card>
              <Point title={opt.card.title}>{opt.card.text}</Point>
            </Card>
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
            <Note>{spec.silentNote}</Note>
            {!reached ? <Note tone="warn">The sequence on step 1 has not reached its end yet — step it through to earn this page’s credit.</Note> : null}
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}

const styles = StyleSheet.create({
  missing: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 13, padding: 12 },
});
