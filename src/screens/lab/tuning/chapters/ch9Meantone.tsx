/**
 * Chapter 9 — Build Quarter-Comma Meantone (spec Stage 4): the whole tone
 * as a multiplicative midpoint, the fifth derived from g⁴ = 5, the
 * fifth-width slider that lands four fifths on 5/4, the diatonic scale with
 * exact radicals, and the wolf that closes the selected E♭…G♯ chain.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import {
  TUNING_SYSTEMS, MEANTONE_FIFTH, MEANTONE_TONE, PURE_FIFTH, JUST_MAJOR_THIRD, ET_FIFTH, MEANTONE_WOLF_CHAIN,
  centsToRatio, ratioToCents, frequencyFromRatio, meantoneWolf, normalizeRatioToOctave,
} from '../../../../features/tuning/tuningMath';
import { renderNotes, renderSequence } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Btn, Card, CentsRail, DeviationMeter, EquationStage, Eyebrow, Lead, MathLine, Prompt, RatioTile, Row, type RailMarker } from '../components/primitives';
import { HarmonicComparison } from '../components/harmonicLadder';

const MT = TUNING_SYSTEMS.meantone;

export function Ch9Meantone({ ctx }: ChapterProps) {
  const [part, setPart] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [fifthCents, setFifthCents] = useState(700);
  const [revealed, setRevealed] = useState(1);
  const root = ctx.rootHz;
  const hz = (r: number) => frequencyFromRatio(root, r);

  // Part C: four stacked fifths from the slider, reduced by two octaves.
  const slider = useMemo(() => {
    const g = centsToRatio(fifthCents);
    const third = Math.pow(g, 4) / 4;
    const thirdCents = ratioToCents(third);
    return { g, third, thirdCents, err: thirdCents - JUST_MAJOR_THIRD.cents };
  }, [fifthCents]);
  const exact = Math.abs(slider.err) < 0.05;

  const wolf = meantoneWolf();
  // Frequencies for the wolf: G♯ is eight tempered fifths above C, E♭ three below — folded.
  const gSharp = hz(normalizeRatioToOctave(Math.pow(MEANTONE_FIFTH.numericRatio, 8)));
  const eFlatAbove = gSharp * centsToRatio(wolf.wolfCents);
  const normalFifthFrom = (f: number) => f * MEANTONE_FIFTH.numericRatio;

  const stepSlider = (d: number) => setFifthCents(+Math.max(690, Math.min(705, fifthCents + d)).toFixed(2));

  return (
    <View style={{ gap: 12 }}>
      <Lead>Quarter-comma meantone: narrow every fifth slightly so that selected major thirds become pure 5:4 — and see where the discrepancy goes instead.</Lead>
      <Row>
        {(['A', 'B', 'C', 'D', 'E'] as const).map((p) => (
          <Btn key={p} label={{ A: 'A · WHOLE TONE', B: 'B · THE FIFTH', C: 'C · SLIDER', D: 'D · SCALE', E: 'E · WOLF' }[p]} tone={part === p ? 'primary' : 'plain'} onPress={() => setPart(p)} />
        ))}
      </Row>

      {part === 'A' ? (
        <>
          <CentsRail markers={[{ id: 'C', cents: 0, label: 'C · 1', role: 'neutral' }, { id: 'D', cents: MEANTONE_TONE.cents, label: 'D · ×t', role: 'operation', emphasis: true, row: 1 }, { id: 'E', cents: JUST_MAJOR_THIRD.cents, label: 'E · 5/4', role: 'exact' }]} reduceMotion={ctx.reduceMotion} height={110} />
          <EquationStage
            title="FIND THE WHOLE TONE"
            reduceMotion={ctx.reduceMotion}
            steps={[
              { text: '1 × t × t = 5/4', note: 'two identical steps from C reach the pure major third E' },
              { text: 't² = 5/4' },
              { text: 't = √(5/4)' },
              { text: 't = √5 / 2', emphasis: true },
              { text: `t ≈ ${MEANTONE_TONE.decimalLabel} · ${MEANTONE_TONE.cents.toFixed(2)} ¢`, note: 'both segments C→D and D→E are the same ×t' },
            ]}
          />
          <Card>
            <Eyebrow>HALFWAY — MULTIPLICATIVELY, NOT IN HERTZ</Eyebrow>
            <MathLine>C {root.toFixed(2)} Hz · D {hz(MEANTONE_TONE.numericRatio).toFixed(2)} Hz · E {hz(1.25).toFixed(2)} Hz</MathLine>
            <Body>The arithmetic midpoint between C and E would be {((root + hz(1.25)) / 2).toFixed(2)} Hz — a different, wrong place. D is halfway multiplicatively: the same ratio on both sides.</Body>
          </Card>
        </>
      ) : null}

      {part === 'B' ? (
        <>
          <Card>
            <Eyebrow>FOUR IDENTICAL FIFTHS</Eyebrow>
            <Text style={styles.chain}>C ×g→ G ×g→ D ×g→ A ×g→ E</Text>
          </Card>
          <EquationStage
            title="DERIVE THE MEANTONE FIFTH"
            reduceMotion={ctx.reduceMotion}
            steps={[
              { text: 'g × g × g × g = g⁴', note: 'four ascending fifths reach an E two octaves above C' },
              { text: 'two octaves + pure major third = 4 × 5/4 = 5' },
              { text: 'g⁴ = 5', emphasis: true },
              { text: 'g = ⁴√5' },
              { text: `g ≈ ${MEANTONE_FIFTH.decimalLabel} · ${MEANTONE_FIFTH.cents.toFixed(2)} ¢` },
            ]}
          />
          <Card>
            <MathLine>pure fifth 3/2 ≈ {PURE_FIFTH.cents.toFixed(2)} ¢</MathLine>
            <MathLine>meantone fifth ≈ {MEANTONE_FIFTH.cents.toFixed(2)} ¢</MathLine>
            <MathLine emphasis>difference ≈ {(PURE_FIFTH.cents - MEANTONE_FIFTH.cents).toFixed(2)} ¢ narrower</MathLine>
            {ctx.mathView ? (
              <>
                <MathLine>g = (3/2) ÷ (81/80)^(1/4)</MathLine>
                <Body>The pure fifth has been narrowed by one quarter of the syntonic comma — hence the name.</Body>
              </>
            ) : null}
          </Card>
          <Row>
            <Btn label="▶ PURE FIFTH" onPress={() => void ctx.player.play(renderNotes([root, root * 1.5], 1.4, 'rich'), 'pure fifth 3/2')} />
            <Btn label="▶ MEANTONE FIFTH" onPress={() => void ctx.player.play(renderNotes([root, root * MEANTONE_FIFTH.numericRatio], 1.4, 'rich'), 'meantone fifth')} />
            <Btn label="■" tone="danger" onPress={() => ctx.player.stop()} a11y="Stop audio" />
          </Row>
        </>
      ) : null}

      {part === 'C' ? (
        <>
          <Prompt>Narrow the fifth until four fifths create a pure 5:4 major third.</Prompt>
          <Track value={fifthCents} onChange={setFifthCents} />
          <Row>
            <Btn label="−1 ¢" onPress={() => stepSlider(-1)} a11y="Narrow the fifth by one cent" />
            <Btn label="−0.1 ¢" onPress={() => stepSlider(-0.1)} a11y="Narrow by a tenth of a cent" />
            <Btn label="+0.1 ¢" onPress={() => stepSlider(0.1)} a11y="Widen by a tenth of a cent" />
            <Btn label="+1 ¢" onPress={() => stepSlider(1)} a11y="Widen the fifth by one cent" />
            <Btn label="SHOW ME" onPress={() => setFifthCents(+MEANTONE_FIFTH.cents.toFixed(2))} />
            <Btn label="RESET" onPress={() => setFifthCents(700)} />
          </Row>
          <Card tone="math">
            <MathLine>fifth = {fifthCents.toFixed(2)} ¢ → g = 2^({fifthCents.toFixed(2)}/1200) = {slider.g.toFixed(6)}</MathLine>
            <MathLine>four fifths: g⁴ = {Math.pow(slider.g, 4).toFixed(6)}</MathLine>
            <MathLine>÷ 4 (two octaves down): g⁴/4 = {slider.third.toFixed(6)} → {slider.thirdCents.toFixed(2)} ¢</MathLine>
            <MathLine emphasis>{exact ? 'g⁴/4 = 5/4 — the major third is pure' : `vs 5/4 at ${JUST_MAJOR_THIRD.cents.toFixed(2)} ¢: ${slider.err > 0 ? '+' : ''}${slider.err.toFixed(2)} ¢ ${slider.err > 0 ? 'wide' : 'narrow'}`}</MathLine>
          </Card>
          <DeviationMeter cents={slider.err} rangeCents={25} label="Major-third error from 5/4" />
          <HarmonicComparison rootHz={root} upperHz={hz(slider.third)} rootHarmonic={5} upperHarmonic={4} rootLabel="root C" upperLabel="E from four fifths" />
          {exact ? <MarkOnce onMark={ctx.markDone} /> : null}
          <Row>
            <Btn label="▶ C–E–G AT THIS FIFTH" onPress={() => void ctx.player.play(renderNotes([root, hz(slider.third), hz(slider.g)], 2.2, 'rich'), `triad with fifth ${fifthCents.toFixed(2)} ¢`)} />
            <Btn label="■" tone="danger" onPress={() => ctx.player.stop()} a11y="Stop audio" />
          </Row>
        </>
      ) : null}

      {part === 'D' ? (
        <>
          <Eyebrow>QUARTER-COMMA MEANTONE C-MAJOR EXAMPLE</Eyebrow>
          <Row>
            {MT.notes.slice(0, revealed).map((n, i) => (
              <RatioTile key={i} note={n.spelling} value={n.value} hz={hz(n.value.numericRatio)} fresh={i === revealed - 1} compact showDecimal={ctx.mathView} />
            ))}
          </Row>
          <Row>
            {revealed < MT.notes.length ? <Btn label={`REVEAL ${MT.notes[revealed].spelling} ›`} tone="primary" onPress={() => setRevealed(revealed + 1)} /> : <Btn label="REPLAY" onPress={() => setRevealed(1)} />}
            <Btn label="▶ SCALE SO FAR" onPress={() => void ctx.player.play(renderSequence(MT.notes.slice(0, revealed).map((n) => hz(n.value.numericRatio)), 0.3, 'rich'), `meantone scale, ${revealed} note${revealed > 1 ? 's' : ''}`)} a11y="Play the scale so far" />
            <Btn label="■" tone="danger" onPress={() => ctx.player.stop()} a11y="Stop audio" />
          </Row>
          <CentsRail markers={MT.notes.slice(0, revealed).map((n, i) => ({ id: `m${i}`, cents: n.value.cents, label: n.spelling, role: i === revealed - 1 ? 'operation' : 'neutral', emphasis: i === revealed - 1, row: i % 2 }))} reduceMotion={ctx.reduceMotion} height={110} />
          <Body>Each pitch is generated from the same tempered fifth and then folded into one octave. {ctx.mathView ? `${MT.notes[revealed - 1].spelling} = ${MT.notes[revealed - 1].value.exactLabel} (${MT.notes[revealed - 1].value.constructionSource}).` : 'Switch to See the Math for the exact radical forms.'}</Body>
        </>
      ) : null}

      {part === 'E' ? (
        <>
          <Eyebrow>THE WOLF FIFTH · CHAIN E♭ … G♯ (ONE SELECTED MAPPING)</Eyebrow>
          <Card>
            <Text style={styles.chain}>{MEANTONE_WOLF_CHAIN.join(' → ')} ⟶ (E♭)</Text>
            <MathLine>eleven normal fifths × {wolf.normalFifthCents.toFixed(2)} ¢ = {(11 * wolf.normalFifthCents).toFixed(2)} ¢</MathLine>
            <MathLine>seven octaves = 8400 ¢</MathLine>
            <MathLine emphasis>closing interval G♯ → E♭ = 8400 − {(11 * wolf.normalFifthCents).toFixed(2)} = {wolf.wolfCents.toFixed(2)} ¢</MathLine>
          </Card>
          <Card tone="warn">
            <Text style={styles.wolf}>WOLF · {wolf.wolfCents.toFixed(2)} ¢ · {wolf.widerThanNormalBy.toFixed(2)} ¢ wider than a normal fifth · {(wolf.wolfCents - PURE_FIFTH.cents).toFixed(2)} ¢ wider than pure</Text>
            <Body>Normal meantone fifth ≈ {wolf.normalFifthCents.toFixed(2)} ¢ · pure fifth ≈ {PURE_FIFTH.cents.toFixed(2)} ¢ · this closing interval ≈ {wolf.wolfCents.toFixed(2)} ¢, spelled G♯ up to E♭.</Body>
            <Row>
              <Btn label="▶ NORMAL FIFTH (G♯–D♯)" onPress={() => void ctx.player.play(renderNotes([gSharp, normalFifthFrom(gSharp)], 1.6, 'rich'), 'normal meantone fifth')} />
              <Btn label="▶ WOLF (G♯–E♭)" tone="danger" onPress={() => void ctx.player.play(renderNotes([gSharp, eFlatAbove], 1.6, 'rich'), 'wolf fifth')} />
              <Btn label="■" tone="danger" onPress={() => ctx.player.stop()} a11y="Stop audio" />
            </Row>
          </Card>
          <Body>The discrepancy has not disappeared. This twelve-note layout concentrates it into the closing interval. Other chains and spellings put the wolf between other named notes — its location is a choice, not a law.</Body>
          <Body>Quarter-comma meantone narrows ordinary fifths so selected major thirds become pure. A finite twelve-note layout still contains a severe closing interval — and not every major third in every key is pure.</Body>
        </>
      ) : null}
    </View>
  );
}

function Track({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const min = 690, max = 705;
  const [w, setW] = useState(300);
  const fromX = (x: number) => +Math.max(min, Math.min(max, min + (x / Math.max(1, w)) * (max - min))).toFixed(2);
  const marks = [{ c: MEANTONE_FIFTH.cents, l: '¼-comma' }, { c: ET_FIFTH.cents, l: 'equal' }, { c: PURE_FIFTH.cents, l: 'pure' }];
  return (
    <View style={{ gap: 2 }}>
      <View style={styles.track} onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible accessibilityRole="adjustable" accessibilityLabel="Fifth width" accessibilityValue={{ text: `${value.toFixed(2)} cents` }}
        onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => onChange(fromX(e.nativeEvent.locationX))} onResponderMove={(e) => onChange(fromX(e.nativeEvent.locationX))}>
        {marks.map((m) => (
          <View key={m.l} style={[styles.tick, { left: `${((m.c - min) / (max - min)) * 100}%` }]} />
        ))}
        <View style={[styles.thumb, { left: `${((value - min) / (max - min)) * 100}%` }]} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.tickLabel}>690 ¢</Text>
        <Text style={[styles.tickLabel, { color: colors.gold }]}>¼-comma {MEANTONE_FIFTH.cents.toFixed(2)}</Text>
        <Text style={styles.tickLabel}>equal 700</Text>
        <Text style={[styles.tickLabel, { color: colors.green }]}>pure {PURE_FIFTH.cents.toFixed(2)}</Text>
        <Text style={styles.tickLabel}>705 ¢</Text>
      </View>
    </View>
  );
}

function MarkOnce({ onMark }: { onMark: () => void }) {
  const [done, setDone] = useState(false);
  if (!done) { setDone(true); onMark(); }
  return null;
}

const styles = StyleSheet.create({
  chain: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20 },
  wolf: { color: colors.red, fontFamily: fonts.oswaldMedium, fontSize: 12.5, letterSpacing: 0.8, lineHeight: 18 },
  track: { height: 44, borderRadius: 10, backgroundColor: '#101013', borderWidth: 1, borderColor: colors.hairline, justifyContent: 'center', overflow: 'hidden' },
  tick: { position: 'absolute', top: 6, bottom: 6, width: 1, backgroundColor: colors.textMuted },
  thumb: { position: 'absolute', top: 4, bottom: 4, width: 4, marginLeft: -2, borderRadius: 2, backgroundColor: colors.cyanBright },
  tickLabel: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 9.5 },
});
