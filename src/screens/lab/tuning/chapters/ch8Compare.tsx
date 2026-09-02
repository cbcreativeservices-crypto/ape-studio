/**
 * Chapter 8 — Spot the Difference: Pythagorean Versus Just (spec Stage 3).
 * Two rows that look identical until Compare reveals the ratios, splits
 * E, A and B on the rail, and measures the shared 81/80.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { TUNING_SYSTEMS, SYNTONIC_COMMA, frequencyFromRatio, fracDiv, frac, fracLabel } from '../../../../features/tuning/tuningMath';
import { renderNotes, renderSequence } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { AudioComparisonControls, Body, Btn, Card, CentsRail, Eyebrow, Lead, MathLine, Prompt, Row, type RailMarker } from '../components/primitives';
import { HarmonicComparison } from '../components/harmonicLadder';
import { UnderstandingCheck } from '../components/check';

const PY = TUNING_SYSTEMS.pythagorean;
const JU = TUNING_SYSTEMS.just;
const DIFFER = ['E', 'A', 'B'];
const PY_FRACS: Record<string, [number, number]> = { E: [81, 64], A: [27, 16], B: [243, 128] };
const JU_FRACS: Record<string, [number, number]> = { E: [5, 4], A: [5, 3], B: [15, 8] };

export function Ch8Compare({ ctx }: ChapterProps) {
  const [compared, setCompared] = useState(false);
  const [sel, setSel] = useState<'E' | 'A' | 'B'>('E');
  const [phrase, setPhrase] = useState<'third' | 'triad' | 'FA' | 'GB' | 'scale'>('third');
  const root = ctx.rootHz;
  const note = (sys: typeof PY, sp: string) => sys.notes.find((n) => n.spelling === sp && n.degree < 8)!;
  const hzOf = (sys: typeof PY, sp: string) => frequencyFromRatio(root, note(sys, sp).value.numericRatio);

  const markers: RailMarker[] = compared
    ? [
        ...PY.notes.slice(0, 7).map((n) => ({ id: `p${n.spelling}`, cents: n.value.cents, label: n.spelling, role: DIFFER.includes(n.spelling) ? ('near' as const) : ('muted' as const), lane: 0 as const, emphasis: n.spelling === sel })),
        ...JU.notes.slice(0, 7).filter((n) => DIFFER.includes(n.spelling)).map((n) => ({ id: `j${n.spelling}`, cents: n.value.cents, label: `${n.spelling} just`, role: 'exact' as const, lane: 1 as const, emphasis: n.spelling === sel })),
      ]
    : PY.notes.slice(0, 7).map((n) => ({ id: `p${n.spelling}`, cents: n.value.cents, label: n.spelling, role: 'neutral' as const }));

  const renders = {
    third: { a: () => renderNotes([root, hzOf(PY, 'E')], 1.6, 'rich'), b: () => renderNotes([root, hzOf(JU, 'E')], 1.6, 'rich'), name: 'C–E major third' },
    triad: { a: () => renderNotes([root, hzOf(PY, 'E'), hzOf(PY, 'G')], 2.2, 'rich'), b: () => renderNotes([root, hzOf(JU, 'E'), hzOf(JU, 'G')], 2.2, 'rich'), name: 'C–E–G triad' },
    FA: { a: () => renderNotes([hzOf(PY, 'F'), hzOf(PY, 'A')], 1.6, 'rich'), b: () => renderNotes([hzOf(JU, 'F'), hzOf(JU, 'A')], 1.6, 'rich'), name: 'F–A major third' },
    GB: { a: () => renderNotes([hzOf(PY, 'G'), hzOf(PY, 'B')], 1.6, 'rich'), b: () => renderNotes([hzOf(JU, 'G'), hzOf(JU, 'B')], 1.6, 'rich'), name: 'G–B major third' },
    scale: { a: () => renderSequence(PY.notes.map((n) => frequencyFromRatio(root, n.value.numericRatio)), 0.32, 'rich'), b: () => renderSequence(JU.notes.map((n) => frequencyFromRatio(root, n.value.numericRatio)), 0.32, 'rich'), name: 'C-major phrase' },
  } as const;

  return (
    <View style={{ gap: 12 }}>
      <Lead>Two C-major scales with the same note names. Are they the same scale?</Lead>
      <Card>
        <Eyebrow>PYTHAGOREAN</Eyebrow>
        <Text style={styles.rowText}>{PY.notes.map((n) => (compared ? `${n.spelling} ${n.value.exactLabel}` : n.spelling)).join('   ')}</Text>
        <Eyebrow>JUST (ONE COMMON FIVE-LIMIT EXAMPLE)</Eyebrow>
        <Text style={styles.rowText}>{JU.notes.map((n) => (compared ? `${n.spelling} ${n.value.exactLabel}` : n.spelling)).join('   ')}</Text>
      </Card>
      {!compared ? <Btn label="COMPARE" tone="primary" onPress={() => setCompared(true)} a11y="Compare: reveal the ratios of both scales" /> : null}
      <CentsRail
        markers={markers}
        height={compared ? 128 : 96}
        selectedId={compared ? `p${sel}` : null}
        onPressMarker={(id) => { const sp = id.slice(1, 2); if (DIFFER.includes(sp)) setSel(sp as 'E' | 'A' | 'B'); }}
        brackets={compared ? [{ fromCents: note(JU, sel).value.cents, toCents: note(PY, sel).value.cents, label: `81/80 · ${SYNTONIC_COMMA.cents.toFixed(2)} ¢`, role: 'near' }] : undefined}
        reduceMotion={ctx.reduceMotion}
      />
      {compared ? (
        <>
          <Body>C, D, F and G match in these selected examples. E, A and B do not: the same written scale degrees receive slightly different frequencies — the Pythagorean versions sit higher by 81/80 ({SYNTONIC_COMMA.decimalLabel}, ≈ {SYNTONIC_COMMA.cents.toFixed(2)} ¢).</Body>
          <Row>
            {DIFFER.map((sp) => <Btn key={sp} label={sp} tone={sel === sp ? 'primary' : 'plain'} selected={sel === sp} onPress={() => setSel(sp as 'E' | 'A' | 'B')} a11y={`Inspect ${sp}`} />)}
          </Row>
          <Card tone="math">
            <Eyebrow>{sel} DETAIL</Eyebrow>
            <MathLine>Pythagorean {sel}: {fracLabel(frac(...PY_FRACS[sel]))} ≈ {note(PY, sel).value.decimalLabel} · {note(PY, sel).value.cents.toFixed(2)} ¢ · {hzOf(PY, sel).toFixed(2)} Hz</MathLine>
            <MathLine>Just {sel}: {fracLabel(frac(...JU_FRACS[sel]))} ≈ {note(JU, sel).value.decimalLabel} · {note(JU, sel).value.cents.toFixed(2)} ¢ · {hzOf(JU, sel).toFixed(2)} Hz</MathLine>
            <MathLine emphasis>({fracLabel(frac(...PY_FRACS[sel]))}) ÷ ({fracLabel(frac(...JU_FRACS[sel]))}) = {fracLabel(fracDiv(frac(...PY_FRACS[sel]), frac(...JU_FRACS[sel])))} = {SYNTONIC_COMMA.decimalLabel} ≈ {SYNTONIC_COMMA.cents.toFixed(2)} ¢</MathLine>
          </Card>
          <Prompt>Hear the same passage both ways — same root, timbre, register, duration and gain; only the ratios change.</Prompt>
          <Row>
            {(Object.keys(renders) as (keyof typeof renders)[]).map((k) => (
              <Btn key={k} label={renders[k].name} tone={phrase === k ? 'primary' : 'plain'} selected={phrase === k} onPress={() => setPhrase(k)} a11y={`Choose the ${renders[k].name} example`} />
            ))}
          </Row>
          <AudioComparisonControls player={ctx.player} a={renders[phrase].a} b={renders[phrase].b} labelA={`Pythagorean · ${renders[phrase].name}`} labelB={`Just · ${renders[phrase].name}`} />
          {/* The lone "JUST E" toggle that sat here only re-selected E — the two
              ladders below are always C–E, so it did nothing visible. Removed. */}
          <Eyebrow>HARMONIC COMPARISON · C–E IN BOTH SYSTEMS</Eyebrow>
          <HarmonicComparison rootHz={root} upperHz={hzOf(JU, 'E')} rootHarmonic={5} upperHarmonic={4} rootLabel="root C" upperLabel="Just E 5/4" />
          <HarmonicComparison rootHz={root} upperHz={hzOf(PY, 'E')} rootHarmonic={5} upperHarmonic={4} rootLabel="root C" upperLabel="Pythagorean E 81/64" />
          <Body>Just: the fourth harmonic of E aligns with the fifth harmonic of C. Pythagorean: the fourth harmonic of E lies above the fifth harmonic of C. The Pythagorean scale prioritizes pure 3:2 fifths; this Just scale changes selected notes to create pure 5:4 major thirds. Neither is “correct.”</Body>
          {/* NEW COPY — per-distractor feedback. */}
          <UnderstandingCheck
            question="Which notes differ between these selected C-major examples?"
            options={['C, D and G', 'E, A and B', 'F and G only', 'All seven']}
            correct={1}
            explain="E, A and B. The Pythagorean versions are higher by the ratio 81/80 — about 21.51 cents — because they come from stacked fifths, while the Just versions are built as pure thirds."
            wrong={[
              'Look at the rail: C, D and G carry ONE marker each — both systems build them from fifths alone (1, 9/8, 3/2).',
              undefined,
              'F (4/3) and G (3/2) are identical in both — they are the pure fourth and fifth, which every system here agrees on.',
              'Only three degrees split on the rail. The rest are built from 2 and 3 alone, so both systems reach the same ratio.',
            ]}
            onCorrect={ctx.markDone}
          />
          <Body>Different tuning systems can use the same note names while assigning different exact frequencies. Those changes alter both interval size and harmonic interaction.</Body>
        </>
      ) : (
        <Body>Note names only, for now. Press COMPARE to reveal the ratios and see which degrees move.</Body>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rowText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 19 },
});
