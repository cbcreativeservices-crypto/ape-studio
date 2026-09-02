/**
 * Chapter 2 — Ratio Landmarks (spec Stage 2): five selectable ratio cards,
 * a whole-number preview, and the mini challenge "place a 3:2 on the rail".
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { LANDMARKS, frequencyFromRatio } from '../../../../features/tuning/tuningMath';
import { renderNotes } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Btn, Card, CentsRail, Eyebrow, Lead, Prompt, RatioTile, Row } from '../components/primitives';
import { DragRail } from '../components/dragRail';
import { UnderstandingCheck } from '../components/check';

const CARDS = LANDMARKS.filter((l) => l.value.cents > 0); // 6/5 5/4 4/3 3/2 2/1
/** Short tile names — the full name lives in the detail card below. The full
 *  names wrapped to three lines inside a 58-pt compact tile. */
const SHORT: Record<string, string> = { 'Just minor third': 'minor 3rd', 'Just major third': 'major 3rd', 'Pure perfect fourth': 'fourth', 'Pure perfect fifth': 'fifth', Octave: 'octave' };

export function Ch2Landmarks({ ctx }: ChapterProps) {
  const [sel, setSel] = useState<number>(3); // 3/2 by default
  const [placed, setPlaced] = useState<number | null>(null);
  const [challenge, setChallenge] = useState(0);
  const [solved, setSolved] = useState(false);
  const card = CARDS[sel];
  const upperHz = frequencyFromRatio(ctx.rootHz, card.value.numericRatio);
  // The octave's exact label is "2" (no slash): default the denominator to 1
  // or the whole-number preview rendered "2:NaN" with an empty lower row.
  const [num, den = 1] = card.value.exactLabel.split('/').map(Number);

  return (
    <View style={{ gap: 12 }}>
      <Lead>Five simple ratios carry most of Western tuning. Hear each one before building anything with it.</Lead>
      <Row>
        {CARDS.map((c, i) => (
          <RatioTile key={c.name} note={SHORT[c.name] ?? c.name} value={c.value} selected={i === sel} onPress={() => setSel(i)} compact />
        ))}
      </Row>
      <Card>
        <Eyebrow>{card.name.toUpperCase()}</Eyebrow>
        <Text style={styles.big}>{card.value.exactLabel}</Text>
        <Text style={styles.line}>decimal ≈ {card.value.decimalLabel} · {card.value.cents.toFixed(2)} ¢</Text>
        <Text style={styles.line}>at this root: {ctx.rootHz.toFixed(2)} Hz → {upperHz.toFixed(2)} Hz</Text>
        <Row>
          <Btn label="▶ PLAY" onPress={() => void ctx.player.play(renderNotes([ctx.rootHz, upperHz], 1.6, 'rich'), card.name)} a11y={`Play ${card.name}`} />
          <Btn label="PLACE ON RAIL" onPress={() => setPlaced(sel)} a11y={`Place ${card.name} on the pitch rail`} />
          <Btn label="■" tone="danger" onPress={() => ctx.player.stop()} a11y="Stop audio" />
        </Row>
      </Card>
      <CentsRail
        markers={[
          { id: 'root', cents: 0, label: 'root', role: 'neutral' },
          ...(placed != null ? [{ id: 'placed', cents: CARDS[placed].value.cents, label: `${CARDS[placed].value.exactLabel}`, role: 'operation' as const, emphasis: true }] : []),
        ]}
        reduceMotion={ctx.reduceMotion}
      />
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
      <DragRail
        cents={challenge}
        onChange={(c) => {
          setChallenge(c);
          if (Math.abs(c - 701.955) < 0.01 && !solved) {
            setSolved(true);
            ctx.markDone();
          }
        }}
        label="Marker"
        hideLabel={!solved}
        showMeTarget={701.955}
        reduceMotion={ctx.reduceMotion}
      />
      {solved ? (
        <Card tone="ok">
          <Text style={styles.ok}>✓ 3:2 — PURE PERFECT FIFTH · 701.96 ¢</Text>
          <Row>
            <Btn label="▶ HEAR IT" onPress={() => void ctx.player.play(renderNotes([ctx.rootHz, ctx.rootHz * 1.5], 1.6, 'rich'), 'pure perfect fifth')} />
          </Row>
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
    </View>
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
