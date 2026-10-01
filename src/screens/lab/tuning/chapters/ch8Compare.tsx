/**
 * Chapter 8 — Spot the Difference: Pythagorean Versus Just (spec Stage 3).
 * Two rows that look identical until Compare reveals the ratios, splits
 * E, A and B on the rail, and measures the shared 81/80.
 *
 * ON THE RACK (2026-09-30): the two-lane rail is the stage. RATIOS reveals
 * the ratios (and the split); NOTE flips E / A / B (the bracket follows);
 * EXAMPLE picks the passage; A / B is the play tray — Pythagorean, Just, or
 * one after the other. The two C–E ladders, a secondary figure, sit in the
 * well with their own FULL SCREEN.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { TUNING_SYSTEMS, SYNTONIC_COMMA, frequencyFromRatio, fracDiv, frac, fracLabel } from '../../../../features/tuning/tuningMath';
import { concatWithGap, renderNotes, renderSequence } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Card, CentsRail, CENTS_RAIL_W, Eyebrow, Lead, MathLine, Prompt, usePreloadClips, type RailMarker } from '../components/primitives';
import { HarmonicComparison, LADDER_H, LADDER_W } from '../components/harmonicLadder';
import { UnderstandingCheck } from '../components/check';
import { StageFit } from '../../rack/StageFit';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import type { DockParam } from '../../rack/rackTypes';
import { TuningRackLayout, flipFader, playTray, soundCell, stopKey, usePlayerStatus } from '../rackLayout';

const PY = TUNING_SYSTEMS.pythagorean;
const JU = TUNING_SYSTEMS.just;
const DIFFER = ['E', 'A', 'B'] as const;
type Differ = (typeof DIFFER)[number];
const PY_FRACS: Record<string, [number, number]> = { E: [81, 64], A: [27, 16], B: [243, 128] };
const JU_FRACS: Record<string, [number, number]> = { E: [5, 4], A: [5, 3], B: [15, 8] };
const RAIL_H = 128;
type Phrase = 'third' | 'triad' | 'FA' | 'GB' | 'scale';

export function Ch8Compare({ ctx }: ChapterProps) {
  const [compared, setCompared] = useState(false);
  const [sel, setSel] = useState<Differ>('E');
  const [phrase, setPhrase] = useState<Phrase>('third');
  const [last, setLast] = useState<string | null>(null);
  const status = usePlayerStatus(ctx.player);
  const root = ctx.rootHz;
  const note = (sys: typeof PY, sp: string) => sys.notes.find((n) => n.spelling === sp && n.degree < 8)!;
  const hzOf = (sys: typeof PY, sp: string) => frequencyFromRatio(root, note(sys, sp).value.numericRatio);

  // The notes the chosen EXAMPLE sounds stay lit on the rail (review
  // 2026-09-30): picking a passage used to change only the A / B key's
  // label — now C and G light for the triad, F for F–A, the whole row for the
  // scale — so the EXAMPLE key changes the picture.
  const inExample: readonly string[] = phrase === 'third' ? ['C', 'E'] : phrase === 'triad' ? ['C', 'E', 'G'] : phrase === 'FA' ? ['F', 'A'] : phrase === 'GB' ? ['G', 'B'] : ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const markers: RailMarker[] = compared
    ? [
        ...PY.notes.slice(0, 7).map((n) => ({ id: `p${n.spelling}`, cents: n.value.cents, label: n.spelling, role: (DIFFER as readonly string[]).includes(n.spelling) ? ('near' as const) : inExample.includes(n.spelling) ? ('neutral' as const) : ('muted' as const), lane: 0 as const, emphasis: n.spelling === sel })),
        ...JU.notes.slice(0, 7).filter((n) => (DIFFER as readonly string[]).includes(n.spelling)).map((n) => ({ id: `j${n.spelling}`, cents: n.value.cents, label: `${n.spelling} just`, role: 'exact' as const, lane: 1 as const, emphasis: n.spelling === sel })),
      ]
    : PY.notes.slice(0, 7).map((n) => ({ id: `p${n.spelling}`, cents: n.value.cents, label: n.spelling, role: 'neutral' as const }));

  const renders: Record<Phrase, { a: () => ReturnType<typeof renderNotes>; b: () => ReturnType<typeof renderNotes>; name: string }> = {
    third: { a: () => renderNotes([root, hzOf(PY, 'E')], 1.6, 'rich'), b: () => renderNotes([root, hzOf(JU, 'E')], 1.6, 'rich'), name: 'C–E major third' },
    triad: { a: () => renderNotes([root, hzOf(PY, 'E'), hzOf(PY, 'G')], 2.2, 'rich'), b: () => renderNotes([root, hzOf(JU, 'E'), hzOf(JU, 'G')], 2.2, 'rich'), name: 'C–E–G triad' },
    FA: { a: () => renderNotes([hzOf(PY, 'F'), hzOf(PY, 'A')], 1.6, 'rich'), b: () => renderNotes([hzOf(JU, 'F'), hzOf(JU, 'A')], 1.6, 'rich'), name: 'F–A major third' },
    GB: { a: () => renderNotes([hzOf(PY, 'G'), hzOf(PY, 'B')], 1.6, 'rich'), b: () => renderNotes([hzOf(JU, 'G'), hzOf(JU, 'B')], 1.6, 'rich'), name: 'G–B major third' },
    scale: { a: () => renderSequence(PY.notes.map((n) => frequencyFromRatio(root, n.value.numericRatio)), 0.32, 'rich'), b: () => renderSequence(JU.notes.map((n) => frequencyFromRatio(root, n.value.numericRatio)), 0.32, 'rich'), name: 'C-major phrase' },
  };
  const cur = renders[phrase];
  usePreloadClips(ctx.player, () => [cur.a, cur.b, () => concatWithGap(cur.a(), cur.b())], `${phrase}|${root}`);

  const pyC = note(PY, sel).value.cents, juC = note(JU, sel).value.cents;

  const params: DockParam[] = [
    { kind: 'toggle', id: 'ratios', label: 'RATIOS', value: compared, onToggle: () => setCompared((c) => !c) },
    ...(compared
      ? ([
          flipFader({
            id: 'note',
            label: 'NOTE',
            title: 'INSPECT A DEGREE',
            items: DIFFER.map((sp) => ({ id: sp })),
            selectedId: sel,
            onSelect: (id) => setSel(id as Differ),
            name: (d) => `${d.id} · Pythagorean vs Just`,
            short: (d) => d.id,
            blurb: (d) => `Pythagorean ${d.id} ${fracLabel(frac(...PY_FRACS[d.id]))} sits ${SYNTONIC_COMMA.cents.toFixed(2)} ¢ above Just ${d.id} ${fracLabel(frac(...JU_FRACS[d.id]))}.`,
          }),
          {
            kind: 'options',
            id: 'example',
            label: 'EXAMPLE',
            valueLabel: cur.name.split(' ')[0],
            options: (Object.keys(renders) as Phrase[]).map((k) => ({ id: k, label: renders[k].name })),
            selectedId: phrase,
            onSelect: (id) => setPhrase(id as Phrase),
          },
          playTray({
            player: ctx.player,
            id: 'ab',
            label: 'A / B',
            last,
            setLast,
            clips: [
              { id: 'a', label: `A · PYTHAGOREAN`, make: cur.a, name: `Pythagorean · ${cur.name}`, blurb: `${cur.name} with the Pythagorean ratios.` },
              { id: 'b', label: `B · JUST`, make: cur.b, name: `Just · ${cur.name}`, blurb: `${cur.name} with the Just ratios.` },
              { id: 'ab', label: 'A → B', make: () => concatWithGap(cur.a(), cur.b()), name: `Pythagorean then Just · ${cur.name}`, blurb: 'Same root, timbre, register, duration and gain — only the ratios change.' },
            ],
            short: (c) => c.label.split(' ')[0],
          }),
        ] as DockParam[])
      : []),
    stopKey(ctx.player),
  ];

  return (
    <TuningRackLayout
      ctx={ctx}
      rack={{
        size: 'S',
        initialParam: 'ratios',
        hideDragTag: true,
        bezel: compared
          ? [
              { k: `PYTH ${sel}`, v: `${pyC.toFixed(2)} ¢`, tint: colors.gold },
              { k: `JUST ${sel}`, v: `${juC.toFixed(2)} ¢`, tint: colors.green },
              { k: '81/80', v: `${SYNTONIC_COMMA.cents.toFixed(2)} ¢` },
              soundCell(status),
            ]
          : [
              { k: 'PYTHAGOREAN', v: PY.notes.slice(0, 7).map((n) => n.spelling).join(' '), flex: 1.5 },
              { k: 'JUST', v: JU.notes.slice(0, 7).map((n) => n.spelling).join(' '), flex: 1.5 },
              soundCell(status),
            ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={CENTS_RAIL_W / RAIL_H}>
            <CentsRail
              markers={markers}
              height={RAIL_H}
              fit
              selectedId={compared ? `p${sel}` : null}
              onPressMarker={(id) => { const sp = id.slice(1, 2); if ((DIFFER as readonly string[]).includes(sp)) setSel(sp as Differ); }}
              brackets={compared ? [{ fromCents: juC, toCents: pyC, label: `81/80 · ${SYNTONIC_COMMA.cents.toFixed(2)} ¢`, role: 'near' }] : undefined}
              reduceMotion={ctx.reduceMotion}
            />
          </StageFit>
        ),
        params,
      }}
      caption={compared
        ? 'Ride NOTE through E, A and B — the bracket measures each split. Pick an EXAMPLE (its notes stay lit on the rail), then A / B it: Pythagorean, Just, or one after the other.'
        : 'Note names only, for now. Press RATIOS to reveal the ratios and see which degrees move.'}
    >
      <Lead>Two C-major scales with the same note names. Are they the same scale?</Lead>
      <Card>
        <Eyebrow>PYTHAGOREAN</Eyebrow>
        <Text style={styles.rowText}>{PY.notes.map((n) => (compared ? `${n.spelling} ${n.value.exactLabel}` : n.spelling)).join('   ')}</Text>
        <Eyebrow>JUST (ONE COMMON FIVE-LIMIT EXAMPLE)</Eyebrow>
        <Text style={styles.rowText}>{JU.notes.map((n) => (compared ? `${n.spelling} ${n.value.exactLabel}` : n.spelling)).join('   ')}</Text>
      </Card>
      {compared ? (
        <>
          <Body>C, D, F and G match in these selected examples. E, A and B do not: the same written scale degrees receive slightly different frequencies — the Pythagorean versions sit higher by 81/80 ({SYNTONIC_COMMA.decimalLabel}, ≈ {SYNTONIC_COMMA.cents.toFixed(2)} ¢).</Body>
          <Card tone="math">
            <Eyebrow>{sel} DETAIL</Eyebrow>
            <MathLine>Pythagorean {sel}: {fracLabel(frac(...PY_FRACS[sel]))} ≈ {note(PY, sel).value.decimalLabel} · {note(PY, sel).value.cents.toFixed(2)} ¢ · {hzOf(PY, sel).toFixed(2)} Hz</MathLine>
            <MathLine>Just {sel}: {fracLabel(frac(...JU_FRACS[sel]))} ≈ {note(JU, sel).value.decimalLabel} · {note(JU, sel).value.cents.toFixed(2)} ¢ · {hzOf(JU, sel).toFixed(2)} Hz</MathLine>
            <MathLine emphasis>({fracLabel(frac(...PY_FRACS[sel]))}) ÷ ({fracLabel(frac(...JU_FRACS[sel]))}) = {fracLabel(fracDiv(frac(...PY_FRACS[sel]), frac(...JU_FRACS[sel])))} = {SYNTONIC_COMMA.decimalLabel} ≈ {SYNTONIC_COMMA.cents.toFixed(2)} ¢</MathLine>
          </Card>
          <Prompt>Hear the same passage both ways — same root, timbre, register, duration and gain; only the ratios change.</Prompt>
          <Body>EXAMPLE: {cur.name}. The A / B key plays it Pythagorean, Just, or one after the other.</Body>
          <Eyebrow>HARMONIC COMPARISON · C–E IN BOTH SYSTEMS</Eyebrow>
          <ExpandableFigure
            title="C–E · JUST OVER PYTHAGOREAN"
            aspect={LADDER_W / (LADDER_H * 2 + 8)}
            render={(w) => (
              <View style={{ width: w, gap: 8 }}>
                <HarmonicComparison fit readout={false} rootHz={root} upperHz={hzOf(JU, 'E')} rootHarmonic={5} upperHarmonic={4} rootLabel="root C" upperLabel="Just E 5/4" />
                <HarmonicComparison fit readout={false} rootHz={root} upperHz={hzOf(PY, 'E')} rootHarmonic={5} upperHarmonic={4} rootLabel="root C" upperLabel="Pythagorean E 81/64" />
              </View>
            )}
          />
          <Body>Just: the fourth harmonic of E aligns with the fifth harmonic of C ({(hzOf(JU, 'E') * 4).toFixed(2)} Hz = {(root * 5).toFixed(2)} Hz). Pythagorean: the fourth harmonic of E ({(hzOf(PY, 'E') * 4).toFixed(2)} Hz) lies above the fifth harmonic of C. The Pythagorean scale prioritizes pure 3:2 fifths; this Just scale changes selected notes to create pure 5:4 major thirds. Neither is “correct.”</Body>
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
        <Body>Note names only, for now. Press RATIOS to reveal the ratios and see which degrees move.</Body>
      )}
    </TuningRackLayout>
  );
}

const styles = StyleSheet.create({
  rowText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 19 },
});
