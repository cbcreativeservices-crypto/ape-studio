/**
 * Chapter 1 — Intervals Are Frequency Relationships (spec Stage 2).
 * Drag the upper note from unison to the octave; ratio, cents and interval
 * name update from the same value; the octave demonstration compares two
 * registers to show the hertz difference changes while the ratio does not.
 *
 * ON THE RACK (2026-09-30): the draggable rail is the stage (it still drags),
 * the UPPER fader on the lane is the teaching parameter, PLAY is a tray of
 * the chapter's clips, SHOW ME slides the marker to the octave; ratio, cents
 * and the interval name print on the bezel.
 */
import { useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { centsToRatio, frequencyFromRatio, nearestLandmark, ratioToCents } from '../../../../features/tuning/tuningMath';
import { renderNotes } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Card, CENTS_RAIL_W, Eyebrow, Lead, MathLine, Row, dec, usePreloadClips } from '../components/primitives';
import { DragRail, slideTo, snapToLandmark } from '../components/dragRail';
import { UnderstandingCheck } from '../components/check';
import { StageFit } from '../../rack/StageFit';
import type { DockParam } from '../../rack/rackTypes';
import { TuningRackLayout, playTray, soundCell, stopKey, usePlayerStatus } from '../rackLayout';

const RAIL_H = 110;
/** Bezel-width names for the landmarks (the full name reads in the well). */
const SHORT: Record<string, string> = { Unison: 'unison', 'Just minor third': 'minor 3rd', 'Just major third': 'major 3rd', 'Pure perfect fourth': 'fourth', 'Pure perfect fifth': 'fifth', Octave: 'octave' };

export function Ch1Intervals({ ctx }: ChapterProps) {
  const [cents, setCents] = useState(0);
  const [reachedOctave, setReachedOctave] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const status = usePlayerStatus(ctx.player);
  const ratio = centsToRatio(cents);
  const upperHz = frequencyFromRatio(ctx.rootHz, ratio);
  const landmark = nearestLandmark(cents, 6);
  const shownRatio = landmark ? landmark.value.exactLabel : dec(ratio, 4);
  const name = landmark?.name ?? (cents < 1 ? 'Unison' : 'between landmarks');
  const rootLow = ctx.rootHz / 2;

  const onSettle = (c: number) => {
    if (c >= 1199.5) setReachedOctave(true);
  };
  const setFromLane = (c: number) => {
    setCents(c);
    onSettle(c);
  };

  const timbre = 'rich' as const;
  // Saved + pre-rendered clips (owner 2026-09-29): the fixed buttons' clips render in the background.
  // (The slider's upper note is not pre-rendered: it changes every frame of a drag.)
  usePreloadClips(ctx.player, () => [() => renderNotes([ctx.rootHz], 1.2, timbre), () => renderNotes([rootLow, ctx.rootHz], 1.4, timbre), () => renderNotes([ctx.rootHz, ctx.rootHz * 2], 1.4, timbre)], String(ctx.rootHz));

  const octaveInfo = useMemo(
    () => ({
      lowDiff: ctx.rootHz - rootLow, // C3→C4
      highDiff: ctx.rootHz * 2 - ctx.rootHz, // C4→C5
    }),
    [ctx.rootHz, rootLow],
  );

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'upper',
      label: 'UPPER',
      value: cents / 1200,
      // The lane snaps the way a finger on the rail does (9 ¢ window), so the
      // landmarks are reachable by thumb.
      onChange: (p) => setFromLane(snapToLandmark(p * 1200, 9)),
      format: (p) => `${(p * 1200).toFixed(2)} ¢`,
      formatShort: (p) => `${Math.round(p * 1200)} ¢`,
    },
    playTray({
      player: ctx.player,
      last,
      setLast,
      clips: [
        { id: 'root', label: 'ROOT', make: () => renderNotes([ctx.rootHz], 1.2, timbre), name: 'root' },
        { id: 'upper', label: 'UPPER NOTE', make: () => renderNotes([upperHz], 1.2, timbre), name: 'upper note' },
        { id: 'both', label: 'TOGETHER', make: () => renderNotes([ctx.rootHz, upperHz], 1.6, timbre), name: 'both notes' },
        ...(reachedOctave
          ? [
              { id: 'c3c4', label: 'C3–C4', make: () => renderNotes([rootLow, ctx.rootHz], 1.4, timbre), name: 'C3 and C4' },
              { id: 'c4c5', label: 'C4–C5', make: () => renderNotes([ctx.rootHz, ctx.rootHz * 2], 1.4, timbre), name: 'C4 and C5' },
            ]
          : []),
      ],
    }),
    { kind: 'action', id: 'showme', label: 'SHOW ME', onPress: () => slideTo(anim, cents, 1200, ctx.reduceMotion, setCents, onSettle) },
    stopKey(ctx.player),
  ];

  return (
    <TuningRackLayout
      ctx={ctx}
      rack={{
        size: 'S',
        initialParam: 'upper',
        hideDragTag: true,
        bezel: [
          { k: 'RATIO', v: shownRatio, tint: colors.cyanBright },
          { k: 'CENTS', v: `${cents.toFixed(2)} ¢` },
          { k: 'INTERVAL', v: SHORT[name] ?? 'between', flex: 1.1 },
          soundCell(status),
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={CENTS_RAIL_W / RAIL_H}>
            {/* The root marker lights while a clip that contains it sounds
                (review 2026-09-30) — a PLAY pick changes the picture, not
                only the SOUND cell. */}
            <DragRail bare fit cents={cents} onChange={setCents} label="Upper note" reduceMotion={ctx.reduceMotion} onSettle={onSettle} fixedMarkers={[{ id: 'root', cents: 0, label: 'root', role: status.playing && (last === 'root' || last === 'both' || last === 'c4c5') ? 'exact' : 'neutral', emphasis: status.playing && (last === 'root' || last === 'both' || last === 'c4c5') }]} />
          </StageFit>
        ),
        params,
      }}
      caption="Ride UPPER, or drag the marker on the rail, from unison (1:1) all the way to the octave (2:1). Ratio, cents and the interval name follow on the bezel."
    >
      <Lead>An interval is a relationship between two frequencies — not a fixed difference in hertz.</Lead>
      <Row>
        <Card><Eyebrow>ROOT</Eyebrow><Text style={styles.big}>C4</Text><Text style={styles.sub}>{ctx.rootHz.toFixed(2)} Hz</Text></Card>
        <Card><Eyebrow>UPPER NOTE</Eyebrow><Text style={[styles.big, { color: colors.cyanBright }]}>{name}</Text><Text style={styles.sub}>{upperHz.toFixed(2)} Hz</Text></Card>
      </Row>

      <Card>
        <Body>
          {cents >= 1199.5
            ? `Upper frequency = 2 × root frequency: ${upperHz.toFixed(2)} = 2 × ${ctx.rootHz.toFixed(2)}. Ratio 2:1, 1200 cents — an octave.`
            : landmark
              ? `${landmark.name}: ratio ${landmark.value.exactLabel}, ${landmark.value.cents.toFixed(2)} cents above the root.`
              : 'Between landmarks — every position is a valid interval; the named ones are just the simplest ratios.'}
        </Body>
      </Card>

      {reachedOctave ? (
        <Card tone="ok">
          <Eyebrow>TWO OCTAVES, TWO REGISTERS</Eyebrow>
          <Text style={styles.line}>C3 → C4: {rootLow.toFixed(2)} → {ctx.rootHz.toFixed(2)} Hz · ratio 2:1 · 1200 ¢ · difference {octaveInfo.lowDiff.toFixed(2)} Hz</Text>
          <Text style={styles.line}>C4 → C5: {ctx.rootHz.toFixed(2)} → {(ctx.rootHz * 2).toFixed(2)} Hz · ratio 2:1 · 1200 ¢ · difference {octaveInfo.highDiff.toFixed(2)} Hz</Text>
          <Body>The hertz difference changes with register, but the interval ratio remains 2:1. Hear both from the PLAY key: C3–C4, then C4–C5.</Body>
        </Card>
      ) : null}

      {ctx.mathView ? (
        <Card tone="math">
          <Eyebrow>SEE THE MATH</Eyebrow>
          <MathLine>r = f₂ ÷ f₁ = {upperHz.toFixed(2)} ÷ {ctx.rootHz.toFixed(2)} = {dec(ratio, 6)}</MathLine>
          <MathLine>c = 1200 · log₂(r) = 1200 · log₂({dec(ratio, 6)}) = {ratioToCents(ratio).toFixed(2)} ¢</MathLine>
          <Body>You do not need to compute logarithms to use this lab — cents are just a way to make equal ratios look like equal distances.</Body>
        </Card>
      ) : (
        <Body>Intervals compare frequencies. The same interval can begin on any pitch.</Body>
      )}

      {/* NEW COPY — options rebalanced to similar length (the correct one was
          the longest by far) + per-distractor misconception feedback. */}
      <UnderstandingCheck
        question="If the lower note changes but the ratio remains 3:2, what stays the same?"
        options={['The difference in hertz between the two notes', 'The interval — still a pure perfect fifth', 'The frequency of the upper note', 'Nothing — a new root makes a new interval']}
        correct={1}
        explain="The interval remains a pure perfect fifth, although both frequencies change. A ratio is preserved; hertz differences are not."
        wrong={[
          'A hertz difference scales with the root: 200 → 300 Hz are 100 Hz apart, 400 → 600 Hz are 200 Hz apart — and both are 3:2.',
          undefined,
          'The upper note moves with the root — it is always 1.5 × the lower note, so it cannot stay put.',
          'The interval IS the ratio, not the notes. Any two frequencies in a 3:2 relationship make the same interval.',
        ]}
        onCorrect={ctx.markDone}
      />
    </TuningRackLayout>
  );
}

const styles = StyleSheet.create({
  big: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 20 },
  sub: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
  line: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17 },
});
