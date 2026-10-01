/**
 * Chapter 2 — Ratio Landmarks (spec Stage 2): five selectable ratio cards,
 * a whole-number preview, and the mini challenge "place a 3:2 on the rail".
 *
 * ON THE RACK (2026-09-30): one rail is the stage — the root, the chosen
 * landmark placed on it, and the challenge marker the learner drags (or
 * rides with MARKER). RATIO is a flip-through chooser-fader of the five
 * landmarks (choosing places it); PLAY sounds the chosen ratio; SHOW ME
 * slides the challenge marker to 3:2.
 */
import { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { LANDMARKS, PURE_FIFTH, frequencyFromRatio } from '../../../../features/tuning/tuningMath';
import { renderNotes } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Card, CENTS_RAIL_W, Eyebrow, Lead, Prompt, RatioTile, Row, usePreloadClips, type RailMarker } from '../components/primitives';
import { DragRail, slideTo, snapToLandmark } from '../components/dragRail';
import { UnderstandingCheck } from '../components/check';
import { StageFit } from '../../rack/StageFit';
import type { DockParam } from '../../rack/rackTypes';
import { TuningRackLayout, flipFader, playTray, soundCell, stopKey, usePlayerStatus } from '../rackLayout';

const RAIL_H = 110;
const CARDS = LANDMARKS.filter((l) => l.value.cents > 0).map((l) => ({ ...l, id: l.name })); // 6/5 5/4 4/3 3/2 2/1
/** Short tile names — the full name lives in the detail card below. The full
 *  names wrapped to three lines inside a 58-pt compact tile. */
const SHORT: Record<string, string> = { 'Just minor third': 'minor 3rd', 'Just major third': 'major 3rd', 'Pure perfect fourth': 'fourth', 'Pure perfect fifth': 'fifth', Octave: 'octave' };
const TARGET = PURE_FIFTH.cents; // 701.955…

export function Ch2Landmarks({ ctx }: ChapterProps) {
  const [sel, setSel] = useState<number>(3); // 3/2 by default
  // Placed from the start (review 2026-09-30): the bezel already reads
  // RATIO 3/2, and riding the lane back onto the selected item fires no
  // onSelect — so the default landmark could not be placed by the lane at
  // all, and the rail disagreed with the bezel until the learner moved away
  // and back. The rail and the bezel now agree from the first frame.
  const [placed, setPlaced] = useState<number | null>(3);
  const [challenge, setChallenge] = useState(0);
  const [solved, setSolved] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const status = usePlayerStatus(ctx.player);
  const card = CARDS[sel];
  const upperHz = frequencyFromRatio(ctx.rootHz, card.value.numericRatio);
  // The octave's exact label is "2" (no slash): default the denominator to 1
  // or the whole-number preview rendered "2:NaN" with an empty lower row.
  const [num, den = 1] = card.value.exactLabel.split('/').map(Number);
  // Saved + pre-rendered clips (owner 2026-09-29): the fixed buttons' clips render in the background.
  usePreloadClips(
    ctx.player,
    () => [
      ...CARDS.map((c) => () => renderNotes([ctx.rootHz, frequencyFromRatio(ctx.rootHz, c.value.numericRatio)], 1.6, 'rich')),
      () => renderNotes([ctx.rootHz, ctx.rootHz * 1.5], 1.6, 'rich'),
    ],
    String(ctx.rootHz),
  );

  const onChallenge = (c: number) => {
    setChallenge(c);
    if (Math.abs(c - TARGET) < 0.01 && !solved) {
      setSolved(true);
      ctx.markDone();
    }
  };

  const fixed: RailMarker[] = [
    { id: 'root', cents: 0, label: 'root', role: 'neutral' },
    ...(placed != null ? [{ id: 'placed', cents: CARDS[placed].value.cents, label: `${CARDS[placed].value.exactLabel}`, role: 'operation' as const, emphasis: true }] : []),
  ];

  const params: DockParam[] = [
    flipFader({
      id: 'ratio',
      label: 'RATIO',
      title: 'RATIO LANDMARK',
      items: CARDS,
      selectedId: card.id,
      onSelect: (id) => {
        const i = CARDS.findIndex((c) => c.id === id);
        if (i < 0) return;
        setSel(i);
        setPlaced(i); // choosing a landmark places it on the rail
      },
      name: (c) => `${c.value.exactLabel} · ${SHORT[c.name] ?? c.name}`,
      short: (c) => c.value.exactLabel,
      blurb: (c) => `${c.name}: ${c.value.cents.toFixed(2)} ¢ above the root · ${ctx.rootHz.toFixed(2)} → ${frequencyFromRatio(ctx.rootHz, c.value.numericRatio).toFixed(2)} Hz.`,
    }),
    {
      kind: 'fader',
      id: 'marker',
      label: 'MARKER',
      value: challenge / 1200,
      // The lane snaps the way the rail's own drag does (the 9 ¢ landmark
      // window): the win is exact 701.955, so the gentle snap is what makes
      // it reachable by thumb.
      onChange: (p) => onChallenge(snapToLandmark(p * 1200, 9)),
      format: (p) => `${(p * 1200).toFixed(2)} ¢`,
      formatShort: (p) => `${Math.round(p * 1200)} ¢`,
    },
    playTray({
      player: ctx.player,
      last,
      setLast,
      clips: [
        { id: 'sel', label: `${card.value.exactLabel} · ${SHORT[card.name] ?? card.name}`, make: () => renderNotes([ctx.rootHz, upperHz], 1.6, 'rich'), name: card.name },
        ...(solved ? [{ id: 'fifth', label: '3:2 · YOUR ANSWER', make: () => renderNotes([ctx.rootHz, ctx.rootHz * 1.5], 1.6, 'rich'), name: 'pure perfect fifth' }] : []),
      ],
      short: (c) => (c.id === 'sel' ? card.value.exactLabel : '3:2'),
    }),
    { kind: 'action', id: 'showme', label: 'SHOW ME', onPress: () => slideTo(anim, challenge, TARGET, ctx.reduceMotion, setChallenge, onChallenge) },
    stopKey(ctx.player),
  ];

  return (
    <TuningRackLayout
      ctx={ctx}
      rack={{
        size: 'S',
        initialParam: 'ratio',
        hideDragTag: true,
        bezel: [
          { k: 'RATIO', v: card.value.exactLabel, tint: colors.gold },
          { k: 'CENTS', v: `${card.value.cents.toFixed(2)} ¢` },
          // Two decimals like every cents cell: at one decimal the solved
          // marker read "702.0 ¢" while the target is 701.96 ¢.
          { k: 'MARKER', v: `${challenge.toFixed(2)} ¢`, tint: solved ? colors.green : colors.cyanBright },
          soundCell(status),
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={CENTS_RAIL_W / RAIL_H}>
            <DragRail bare fit cents={challenge} onChange={onChallenge} label="Marker" hideLabel={!solved} reduceMotion={ctx.reduceMotion} fixedMarkers={fixed} />
          </StageFit>
        ),
        params,
      }}
      caption="Ride RATIO through the five landmarks — each one lands on the rail — and PLAY it. Then the mini challenge: ride MARKER, or drag the blue marker, to put a 3:2 on the rail."
    >
      <Lead>Five simple ratios carry most of Western tuning. Hear each one before building anything with it.</Lead>
      <Row>
        {CARDS.map((c, i) => (
          <RatioTile key={c.name} note={SHORT[c.name] ?? c.name} value={c.value} selected={i === sel} compact />
        ))}
      </Row>
      <Card>
        <Eyebrow>{card.name.toUpperCase()}</Eyebrow>
        <Text style={styles.big}>{card.value.exactLabel}</Text>
        <Text style={styles.line}>decimal ≈ {card.value.decimalLabel} · {card.value.cents.toFixed(2)} ¢</Text>
        <Text style={styles.line}>at this root: {ctx.rootHz.toFixed(2)} Hz → {upperHz.toFixed(2)} Hz</Text>
      </Card>
      {/* whole-number preview — frequency units, not amplitude */}
      <Card>
        <Eyebrow>WHOLE-NUMBER RELATIONSHIP · {num}:{den}</Eyebrow>
        <UnitRow n={num} label="upper note" color={colors.gold} />
        <UnitRow n={den} label="lower note" color={colors.cyanBright} />
        <Body>
          In the time the lower note completes {den} cycle{den > 1 ? 's' : ''}, the upper completes {num}. Small whole-number ratios often create strong harmonic alignment in harmonic sounds — how strongly that is heard also depends on timbre, register, loudness, context and culture.
        </Body>
      </Card>

      <Prompt>Mini challenge: place a 3:2 ratio on the pitch rail.</Prompt>
      {solved ? (
        <Card tone="ok">
          <Text style={styles.ok}>✓ 3:2 — PURE PERFECT FIFTH · 701.96 ¢</Text>
          <Body>Hear it from the PLAY key: 3:2 · YOUR ANSWER.</Body>
        </Card>
      ) : (
        <Body>Aim for about 702 cents. The marker snaps gently when you are close.</Body>
      )}

      {/* NEW COPY — worked example → retrieval: the ratio multiplies, it never adds. */}
      <UnderstandingCheck
        question="A pure perfect fifth (3:2) above 200 Hz sits at which frequency?"
        options={['300 Hz', '201.5 Hz', '350 Hz', '400 Hz']}
        correct={0}
        explain="200 × 3/2 = 300 Hz. A ratio multiplies the root; it never adds to it."
        wrong={[
          undefined,
          '3:2 is a multiplier, not an addition: 200 × 1.5, not 200 + 1.5.',
          '350 Hz is 7:4 above 200 Hz (about 969 ¢) — a different, wider interval.',
          '400 Hz is 2:1 above 200 Hz — that is the octave, not the fifth.',
        ]}
      />
    </TuningRackLayout>
  );
}

function UnitRow({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <View style={styles.unitRow} accessible accessibilityLabel={`${label}: ${n} equal frequency units`}>
      <Text style={[styles.unitLabel, { color }]}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 3, flex: 1 }}>
        {Array.from({ length: n }, (_, i) => (
          <View key={i} style={[styles.unit, { backgroundColor: color, flex: 1 }]} />
        ))}
      </View>
      <Text style={[styles.unitLabel, { color }]}>{n}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  big: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 28 },
  line: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  ok: { color: colors.green, fontFamily: fonts.oswaldMedium, fontSize: 13, letterSpacing: 1 },
  unitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unitLabel: { width: 78, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 0.5 },
  unit: { height: 14, borderRadius: 3, opacity: 0.85 },
});
