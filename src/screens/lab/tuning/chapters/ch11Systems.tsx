/**
 * Chapter 11 — Compare Tuning Systems (spec Stage 4): one fair workspace.
 * Same C root for every system, a fixed keyboard whose MARKERS move,
 * readouts derived from the ratio, harmonic preview, A/B audio, the E-moves
 * demonstration, and a deviation chart with an accessible alternative.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import {
  TUNING_SYSTEMS, type TuningSystemId, type TuningSystem, C4_ET, deviationFromEqualCents, frequencyFromRatio,
} from '../../../../features/tuning/tuningMath';
import { renderNotes, renderSequence } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { AudioComparisonControls, Body, Btn, Card, Eyebrow, Lead, MathLine, Prompt, ROLE, Row } from '../components/primitives';
import { TuningKeyboard } from '../components/tuningKeyboard';
import { HarmonicComparison } from '../components/harmonicLadder';
import { UnderstandingCheck } from '../components/check';

const IDS: TuningSystemId[] = ['pythagorean', 'just', 'meantone', 'equal'];
const ROOTS = [{ label: 'A4 = 440 (C4 = 261.63)', hz: C4_ET }, { label: 'A4 = 442', hz: 442 * Math.pow(2, -9 / 12) }, { label: 'A4 = 432', hz: 432 * Math.pow(2, -9 / 12) }];

/** Harmonics searched for a near-coincidence, and how near counts. Up to 9
 *  lets D 9/8 find its exact pair (D·8 = C·9); 2 % keeps the Pythagorean
 *  third (4 vs 5, 1.25 % apart) — the comparison the lab is built on — while
 *  refusing pairs like B 15/8, whose "best" match under 9 was 6 % apart and
 *  drew a meaningless bracket. */
const MAX_H = 9;
const NEAR = 0.02;

/** Lowest harmonic pair (≤ MAX_H) that nearly coincides for this ratio, or null. */
function bestPair(ratio: number): { rootH: number; noteH: number; err: number } | null {
  let best = { rootH: 1, noteH: 1, err: Infinity };
  for (let q = 1; q <= MAX_H; q++) for (let p = 1; p <= MAX_H; p++) {
    const err = Math.abs(q * ratio - p) / p;
    if (err < best.err) best = { rootH: p, noteH: q, err };
  }
  return best.err <= NEAR ? best : null;
}

export function Ch11Systems({ ctx }: ChapterProps) {
  const [sysId, setSysId] = useState<TuningSystemId>('just');
  const [bId, setBId] = useState<TuningSystemId>('equal');
  const [sel, setSel] = useState(2); // E
  const [example, setExample] = useState<'third' | 'fifth' | 'triad' | 'scale' | 'melody'>('third');
  const sys = TUNING_SYSTEMS[sysId];
  const other = TUNING_SYSTEMS[bId];
  const note = sys.notes[sel];
  const root = ctx.rootHz;
  const hz = (r: number) => frequencyFromRatio(root, r);
  const dev = deviationFromEqualCents(note);
  const pair = useMemo(() => bestPair(note.value.numericRatio), [note]);

  const freqsOf = (s: typeof sys, degrees: number[]) => degrees.map((d) => hz(s.notes[d].value.numericRatio));
  const render = (s: typeof sys) => {
    switch (example) {
      case 'third': return renderNotes(freqsOf(s, [0, 2]), 1.6, 'rich');
      case 'fifth': return renderNotes(freqsOf(s, [0, 4]), 1.6, 'rich');
      case 'triad': return renderNotes(freqsOf(s, [0, 2, 4]), 2.2, 'rich');
      case 'scale': return renderSequence(freqsOf(s, [0, 1, 2, 3, 4, 5, 6, 7]), 0.3, 'rich');
      case 'melody': return renderSequence(freqsOf(s, [0, 2, 4, 5, 4, 2, 0]), 0.3, 'rich');
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Lead>Every system on the same C, the same keys, the same sounds — only the ratios change.</Lead>
      <Eyebrow>SYSTEM A</Eyebrow>
      <Row>
        {IDS.map((id) => <Btn key={id} label={TUNING_SYSTEMS[id].shortName} tone={sysId === id ? 'primary' : 'plain'} selected={sysId === id} onPress={() => setSysId(id)} a11y={`System A: ${TUNING_SYSTEMS[id].shortName}`} />)}
      </Row>
      <Eyebrow>REFERENCE PITCH · APPLIES TO THE WHOLE LAB</Eyebrow>
      <Row>
        {ROOTS.map((r) => <Btn key={r.label} label={r.label} tone={Math.abs(root - r.hz) < 0.01 ? 'primary' : 'plain'} selected={Math.abs(root - r.hz) < 0.01} onPress={() => ctx.setRootHz(r.hz)} a11y={`Set reference ${r.label}`} />)}
      </Row>
      <Card>
        <Eyebrow>{sys.name.toUpperCase()} · C FIXED AT {root.toFixed(2)} Hz</Eyebrow>
        <TuningKeyboard system={sys} selected={sel} onSelect={setSel} rootHz={root} />
        {/* NEW COPY — the old legend promised ● and ▲ glyphs the keys never drew. */}
        <Text style={styles.legend}>Keys never move. Each bar is that note’s signed distance from equal temperament — green exact · gold within 10 ¢ · orange beyond. Tap a key to inspect it.</Text>
      </Card>
      <Card tone="math">
        <Eyebrow>{note.spelling}{sel === 7 ? ' (OCTAVE)' : ''} · {sys.shortName}</Eyebrow>
        <MathLine>ratio {note.value.exactLabel}{ctx.mathView ? ` ≈ ${note.value.decimalLabel}` : ''}</MathLine>
        <MathLine>{hz(note.value.numericRatio).toFixed(2)} Hz · {note.value.cents.toFixed(2)} ¢ above C</MathLine>
        <MathLine emphasis>{Math.abs(dev) < 0.05 ? 'exactly equal temperament' : `${dev > 0 ? '+' : ''}${dev.toFixed(2)} ¢ from equal temperament (${dev > 0 ? 'higher' : 'lower'})`}</MathLine>
        <Text style={styles.legend}>{note.value.constructionSource}</Text>
      </Card>
      {sel > 0 && sel < 7 ? (
        pair ? (
          <HarmonicComparison rootHz={root} upperHz={hz(note.value.numericRatio)} rootHarmonic={pair.rootH} upperHarmonic={pair.noteH} rootLabel="root C" upperLabel={`${note.spelling} ${note.value.exactLabel}`} />
        ) : (
          // NEW COPY — honest empty state instead of a meaningless bracket.
          <Body>No pair of harmonics up to {MAX_H} comes within 2 % for {note.spelling} {note.value.exactLabel}, so no ladder is drawn — the nearest low-harmonic alignment for this ratio lies above the display.</Body>
        )
      ) : null}

      <Prompt>A/B the same example in two systems. Root, register, timbre, duration, articulation, gain, voicing and tempo are held constant.</Prompt>
      <Row>
        {([['third', 'C–E third'], ['fifth', 'C–G fifth'], ['triad', 'C–E–G triad'], ['scale', 'C-major scale'], ['melody', 'short melody']] as const).map(([k, l]) => (
          <Btn key={k} label={l} tone={example === k ? 'primary' : 'plain'} selected={example === k} onPress={() => setExample(k)} a11y={`Example: ${l}`} />
        ))}
      </Row>
      <Eyebrow>SYSTEM B</Eyebrow>
      <Row>
        {IDS.map((id) => <Btn key={id} label={TUNING_SYSTEMS[id].shortName} tone={bId === id ? 'primary' : 'plain'} selected={bId === id} onPress={() => setBId(id)} a11y={`System B: ${TUNING_SYSTEMS[id].shortName}`} />)}
      </Row>
      <AudioComparisonControls player={ctx.player} a={() => render(sys)} b={() => render(other)} labelA={`${sys.shortName} · ${example}`} labelB={`${other.shortName} · ${example}`} />

      <Eyebrow>HEAR THE SAME NOTE MOVE · E OVER A FIXED C</Eyebrow>
      <Row>
        {(['just', 'equal', 'pythagorean'] as TuningSystemId[]).map((id) => {
          const e = TUNING_SYSTEMS[id].notes[2];
          return <Btn key={id} label={`▶ ${TUNING_SYSTEMS[id].shortName} E · ${e.value.cents.toFixed(2)} ¢`} onPress={() => void ctx.player.play(renderNotes([root, hz(e.value.numericRatio)], 1.4, 'rich'), `C and ${TUNING_SYSTEMS[id].shortName} E`)} />;
        })}
        <Btn label="■" tone="danger" onPress={() => ctx.player.stop()} a11y="Stop audio" />
      </Row>
      <Body>Same written scale degree, different assigned frequency.</Body>

      <Eyebrow>DEVIATION FROM EQUAL TEMPERAMENT · {sys.shortName.toUpperCase()}</Eyebrow>
      <DeviationChart system={sys} selected={sel} onSelect={setSel} />
      {ctx.mathView ? (
        <Card tone="math">
          <Eyebrow>ALL EIGHT · COMPUTED FROM ratio × {root.toFixed(6)} Hz</Eyebrow>
          {sys.notes.map((n, i) => (
            <MathLine key={i}>{n.spelling}{i === 7 ? '5' : '4'}: {n.value.exactLabel} → {hz(n.value.numericRatio).toFixed(2)} Hz · {n.value.cents.toFixed(2)} ¢ · {deviationFromEqualCents(n) >= 0 ? '+' : ''}{deviationFromEqualCents(n).toFixed(2)} ¢ vs ET</MathLine>
          ))}
        </Card>
      ) : null}
      {/* NEW COPY — targets "one system is the correct one". */}
      <UnderstandingCheck
        question="Four systems, one C, one key called E. Which statement is true?"
        options={['E has one true frequency; the other systems are out of tune', 'Each system assigns E its own ratio; none is the single right one', 'Equal temperament is the physically correct E', 'The four E’s differ only because the root changed']}
        correct={1}
        explain="Each system chooses what to preserve — pure fifths, pure thirds, equal keys — and E lands where that choice puts it. There is no privileged E; the chart shows differences from equal temperament, not errors."
        wrong={[
          'Tune the keyboard to Just and the Pythagorean E is “out”; tune it Pythagorean and the reverse. Neither is a reference for the other.',
          undefined,
          'Equal temperament is a design choice (twelve identical ratios) — convenient, not physical. Its third is 13.69 ¢ from the harmonic 5/4.',
          'The root is FIXED at the same C for every system here. Only the ratio applied to it changes.',
        ]}
        onCorrect={ctx.markDone}
      />
      {!ctx.isDone ? <Btn label="I’VE COMPARED THEM ›" tone="primary" onPress={ctx.markDone} /> : null}
    </View>
  );
}

function DeviationChart({ system, selected, onSelect }: { system: TuningSystem; selected: number; onSelect: (i: number) => void }) {
  const W = 340, H = 150, zeroY = 66, scale = 2.2; // px per cent
  const notes = system.notes;
  const summary = `Deviation from equal temperament: ${notes.map((n) => `${n.spelling} ${deviationFromEqualCents(n) >= 0 ? '+' : ''}${deviationFromEqualCents(n).toFixed(2)} cents`).join(', ')}.`;
  return (
    <View accessible accessibilityLabel={summary}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        <Line x1={10} y1={zeroY} x2={W - 10} y2={zeroY} stroke={colors.textSub} strokeWidth={1.2} />
        <SvgText x={12} y={zeroY - 4} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium}>0 ¢ = EQUAL TEMPERAMENT</SvgText>
        <SvgText x={12} y={14} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium}>+ HIGHER</SvgText>
        <SvgText x={12} y={zeroY + 13} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium}>− LOWER</SvgText>
        {notes.map((n, i) => {
          const dev = deviationFromEqualCents(n);
          const x = 40 + i * 38;
          const h = Math.min(50, Math.abs(dev) * scale);
          // Descriptive distance: green exact, gold within 10 ¢, orange beyond. Never red.
          const role = Math.abs(dev) < 0.05 ? 'exact' : Math.abs(dev) < 10 ? 'near' : 'far';
          return (
            <Svg key={i} onPress={() => onSelect(i)}>
              <Rect x={x - 9} y={dev >= 0 ? zeroY - h : zeroY} width={18} height={Math.max(2, h)} fill={ROLE[role]} opacity={i === selected ? 1 : 0.6} stroke={i === selected ? ROLE.active : 'none'} />
              <SvgText x={x} y={H - 8} fontSize={9.5} fill={i === selected ? ROLE.active : colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{n.spelling}</SvgText>
              <SvgText x={x} y={dev >= 0 ? zeroY - h - 4 : zeroY + h + 11} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{Math.abs(dev) < 0.05 ? '0' : `${dev > 0 ? '+' : ''}${dev.toFixed(1)}`}</SvgText>
            </Svg>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
});
