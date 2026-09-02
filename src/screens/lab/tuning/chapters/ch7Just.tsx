/**
 * Chapter 7 — Build Harmony With Just Intonation (spec Stage 3): one common
 * five-limit C-major mapping revealed a note at a time, the 4:5:6 triad,
 * three pure major thirds one arc at a time, harmonic alignment, and the
 * key-dependence demonstration (keep pitches vs retune around a new tonic).
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import {
  TUNING_SYSTEMS, frac, fracDiv, fracLabel, fracValue, frequencyFromRatio, normalizeFracToOctave, ratioToCents, JUST_MAJOR_THIRD,
} from '../../../../features/tuning/tuningMath';
import { renderNotes, renderPartials } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Btn, Card, CentsRail, EquationStage, Eyebrow, Lead, MathLine, Prompt, RatioTile, Row, type RailMarker } from '../components/primitives';
import { HarmonicComparison } from '../components/harmonicLadder';

const JUST = TUNING_SYSTEMS.just;
const JUST_FRACS: Record<string, ReturnType<typeof frac>> = { C: frac(1, 1), D: frac(9, 8), E: frac(5, 4), F: frac(4, 3), G: frac(3, 2), A: frac(5, 3), B: frac(15, 8) };
const THIRDS: [string, string][] = [['C', 'E'], ['F', 'A'], ['G', 'B']];

export function Ch7Just({ ctx }: ChapterProps) {
  const [revealed, setRevealed] = useState(1);
  const [arcs, setArcs] = useState(0); // how many pure-third arcs shown
  const [tonic, setTonic] = useState<'C' | 'F' | 'G' | 'D'>('C');
  const [mode, setMode] = useState<'keep' | 'retune'>('keep');
  const root = ctx.rootHz;
  const hz = (r: number) => frequencyFromRatio(root, r);

  const markers: RailMarker[] = JUST.notes.slice(0, revealed).map((n, i) => ({ id: `${n.spelling}${i}`, cents: n.value.cents, label: n.spelling, role: i === revealed - 1 ? 'operation' : 'neutral', emphasis: i === revealed - 1, row: i % 2 }));

  // Key dependence: compare the fixed C-major pitches against a mapping rebuilt on the new tonic.
  const keyDemo = useMemo(() => {
    const t = JUST_FRACS[tonic];
    const names = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    // Retuned mapping: tonic × the same seven Just ratios, folded, spelled in scale order from the tonic.
    const startIdx = names.indexOf(tonic);
    const retuned = names.map((_, k) => {
      const spelling = names[(startIdx + k) % 7];
      const base = JUST_FRACS[names[k]]; // the C-major pattern's k-th degree ratio
      const f = normalizeFracToOctave(frac(t.n * base.n, t.d * base.d)).ratio;
      return { spelling, ratio: f };
    });
    const kept = names.map((sp) => ({ spelling: sp, ratio: JUST_FRACS[sp] }));
    const changed = retuned.filter((r) => { const k = kept.find((x) => x.spelling === r.spelling)!; return fracValue(k.ratio) !== fracValue(r.ratio); });
    // In "keep" mode: which simple ratios from the new tonic are no longer exact?
    const fromTonic = (sp: string) => fracDiv(JUST_FRACS[sp], t);
    const fifthTarget = names[(startIdx + 4) % 7];
    const thirdTarget = names[(startIdx + 2) % 7];
    const fifth = normalizeFracToOctave(fromTonic(fifthTarget)).ratio;
    const third = normalizeFracToOctave(fromTonic(thirdTarget)).ratio;
    return { retuned, changed, fifthTarget, thirdTarget, fifth, third, fifthOk: fracValue(fifth) === 1.5, thirdOk: fracValue(third) === 1.25 };
  }, [tonic]);

  return (
    <View style={{ gap: 12 }}>
      <Lead>What if we build around simple harmonic relationships instead of generating every note from pure fifths?</Lead>
      <Eyebrow>ONE COMMON FIVE-LIMIT JUST C-MAJOR EXAMPLE</Eyebrow>
      <Row>
        {JUST.notes.slice(0, revealed).map((n, i) => (
          <RatioTile key={i} note={n.spelling} value={n.value} hz={hz(n.value.numericRatio)} fresh={i === revealed - 1} compact showDecimal={ctx.mathView} />
        ))}
      </Row>
      <Row>
        {revealed < JUST.notes.length ? <Btn label={`REVEAL ${JUST.notes[revealed].spelling} ›`} tone="primary" onPress={() => setRevealed(revealed + 1)} /> : <Btn label="REPLAY" onPress={() => setRevealed(1)} />}
        {revealed > 1 ? <Btn label={`▶ C + ${JUST.notes[revealed - 1].spelling}`} onPress={() => void ctx.player.play(renderNotes([root, hz(JUST.notes[revealed - 1].value.numericRatio)], 1.4, 'rich'), `C and ${JUST.notes[revealed - 1].spelling}`)} /> : null}
        <Btn label="■" tone="danger" onPress={() => ctx.player.stop()} a11y="Stop audio" />
      </Row>
      <CentsRail markers={markers} reduceMotion={ctx.reduceMotion} height={110} />
      <Body>{revealed < JUST.notes.length ? `${JUST.notes[revealed - 1].value.constructionSource}. Reveal the next note.` : 'All eight revealed. This is ONE selected mapping — Just Intonation is a family of choices, not a single fixed table.'}</Body>

      {revealed >= 5 ? (
        <>
          <Eyebrow>THE 4:5:6 MAJOR TRIAD</Eyebrow>
          <EquationStage
            reduceMotion={ctx.reduceMotion}
            steps={[
              { text: 'C, E, G = 1, 5/4, 3/2' },
              { text: 'multiply all three by 4', note: 'the smallest number that clears every denominator' },
              { text: '4 × 1, 4 × 5/4, 4 × 3/2', emphasis: true },
              { text: '= 4 : 5 : 6', note: 'the C-major triad as a simple whole-number relationship' },
            ]}
          />
          <Body>The C-major triad can be expressed as the simple whole-number relationship 4:5:6 — a ratio between the three notes, not harmonic numbers of one displayed fundamental (that reading only holds if all three are built on a shared reference two octaves below C).</Body>
          <Row>
            <Btn label="▶ C" onPress={() => void ctx.player.play(renderNotes([root], 1, 'rich'), 'C')} />
            <Btn label="▶ E" onPress={() => void ctx.player.play(renderNotes([hz(5 / 4)], 1, 'rich'), 'E 5/4')} />
            <Btn label="▶ G" onPress={() => void ctx.player.play(renderNotes([hz(3 / 2)], 1, 'rich'), 'G 3/2')} />
            <Btn label="▶ CHORD" onPress={() => void ctx.player.play(renderNotes([root, hz(5 / 4), hz(3 / 2)], 2.2, 'rich'), 'C major triad 4:5:6')} />
            <Btn label="▶ ALIGNED PARTIALS" onPress={() => void ctx.player.play(renderPartials([root * 5, hz(5 / 4) * 4], 2), 'isolated: C harmonic 5 and E harmonic 4')} a11y="Play the isolated aligned partials" />
          </Row>
        </>
      ) : null}

      {revealed >= 7 ? (
        <>
          <Eyebrow>PURE MAJOR THIRDS IN THIS MAPPING</Eyebrow>
          {THIRDS.slice(0, Math.max(1, arcs)).map(([lo, hi]) => {
            const q = fracDiv(JUST_FRACS[hi], JUST_FRACS[lo]);
            return (
              <Card key={lo} tone="math">
                <MathLine>{lo} → {hi}: ({fracLabel(JUST_FRACS[hi])}) ÷ ({fracLabel(JUST_FRACS[lo])}) = {fracLabel(q)}</MathLine>
                <Text style={styles.sub}>{ratioToCents(fracValue(q)).toFixed(2)} ¢ · pure 5/4 major third{arcs >= 1 ? '' : ' — press SHOW NEXT ARC'}</Text>
                <Row>
                  <Btn label={`▶ ${lo}–${hi}`} onPress={() => void ctx.player.play(renderNotes([hz(fracValue(JUST_FRACS[lo])), hz(fracValue(JUST_FRACS[hi]))], 1.4, 'rich'), `${lo} to ${hi}`)} />
                </Row>
              </Card>
            );
          })}
          <Row>
            {arcs < 3 ? <Btn label={arcs === 0 ? 'SHOW FIRST ARC' : arcs < 2 ? 'SHOW NEXT ARC' : 'SHOW ALL'} tone="primary" onPress={() => setArcs(arcs === 2 ? 3 : arcs + 1)} /> : <Btn label="REPLAY ARCS" onPress={() => setArcs(0)} />}
          </Row>
          <HarmonicComparison rootHz={root} upperHz={hz(5 / 4)} rootHarmonic={5} upperHarmonic={4} rootLabel="root C" upperLabel="E 5/4" />
        </>
      ) : null}

      {revealed >= 8 ? (
        <>
          <Prompt>Change the tonic and choose what happens to the pitches.</Prompt>
          <Row>
            {(['C', 'F', 'G', 'D'] as const).map((t) => (
              <Btn key={t} label={`TONIC ${t}`} tone={tonic === t ? 'primary' : 'plain'} onPress={() => setTonic(t)} />
            ))}
          </Row>
          <Row>
            <Btn label="KEEP CURRENT PITCHES" tone={mode === 'keep' ? 'primary' : 'plain'} onPress={() => setMode('keep')} />
            <Btn label="RETUNE AROUND NEW TONIC" tone={mode === 'retune' ? 'primary' : 'plain'} onPress={() => setMode('retune')} />
          </Row>
          {tonic === 'C' ? (
            <Body>With C as the tonic every relationship above is exact. Pick another tonic.</Body>
          ) : mode === 'keep' ? (
            <Card tone={keyDemo.fifthOk && keyDemo.thirdOk ? 'ok' : 'warn'}>
              <Eyebrow>ALL SEVEN PITCHES UNCHANGED · MEASURED FROM {tonic}</Eyebrow>
              <MathLine>{tonic} → {keyDemo.fifthTarget} (fifth): {fracLabel(keyDemo.fifth)} = {ratioToCents(fracValue(keyDemo.fifth)).toFixed(2)} ¢ {keyDemo.fifthOk ? '✓ pure 3/2' : `✗ not 3/2 (${(ratioToCents(fracValue(keyDemo.fifth)) - 701.955).toFixed(2)} ¢ off)`}</MathLine>
              <MathLine>{tonic} → {keyDemo.thirdTarget} (third): {fracLabel(keyDemo.third)} = {ratioToCents(fracValue(keyDemo.third)).toFixed(2)} ¢ {keyDemo.thirdOk ? '✓ pure 5/4' : `✗ not 5/4 (${(ratioToCents(fracValue(keyDemo.third)) - JUST_MAJOR_THIRD.cents).toFixed(2)} ¢ off)`}</MathLine>
              <Body>The pitches stayed where the C-major mapping put them, so some of the simple ratios you would want from {tonic} are no longer exact.</Body>
            </Card>
          ) : (
            <Card tone="ok">
              <Eyebrow>REBUILT AROUND {tonic} · {tonic} STAYS FIXED</Eyebrow>
              {keyDemo.changed.length ? (
                keyDemo.changed.map((c) => (
                  <MathLine key={c.spelling}>{c.spelling}: {fracLabel(JUST_FRACS[c.spelling])} → {fracLabel(c.ratio)} ({(ratioToCents(fracValue(c.ratio)) - ratioToCents(fracValue(JUST_FRACS[c.spelling]))).toFixed(2)} ¢ {ratioToCents(fracValue(c.ratio)) > ratioToCents(fracValue(JUST_FRACS[c.spelling])) ? 'higher' : 'lower'})</MathLine>
                ))
              ) : (
                <MathLine>No note needs to move.</MathLine>
              )}
              <Body>Recomputing the mapping on the new tonic restores the simple relationships — at the cost of moving {keyDemo.changed.length} note{keyDemo.changed.length === 1 ? '' : 's'} away from where the C-major set had them.</Body>
            </Card>
          )}
          <Body>Just relationships can be extremely pure for a chosen tonal center, but one fixed set of pitches does not preserve every simple ratio in every key. Performers may adjust pitch dynamically with harmony, melody, style and ensemble context.</Body>
          {!ctx.isDone ? <Btn label="I’VE GOT IT ›" tone="primary" onPress={ctx.markDone} /> : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
});
