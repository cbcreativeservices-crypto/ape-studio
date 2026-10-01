/**
 * Chapter 11 — Compare Tuning Systems (spec Stage 4): one fair workspace.
 * Same C root for every system, a fixed keyboard whose MARKERS move,
 * readouts derived from the ratio, harmonic preview, A/B audio, the E-moves
 * demonstration, and a deviation chart with an accessible alternative.
 *
 * ON THE RACK (2026-09-30): the deviation chart is the stage (tap a bar or
 * ride NOTE to inspect a degree); SYSTEM flips the four systems; REF sets
 * the reference pitch for the whole lab; A / B is one working tray — the
 * example, system B, the A / B / A→B keys and the three E's over a fixed C —
 * so the comparison is made without leaving the glass. The fixed keyboard
 * sits at the top of the well; the harmonic ladders below it have their own
 * FULL SCREEN.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import {
  TUNING_SYSTEMS, type TuningSystemId, C4_ET, deviationFromEqualCents, frequencyFromRatio,
} from '../../../../features/tuning/tuningMath';
import { concatWithGap, renderNotes, renderSequence } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Btn, Card, Eyebrow, Lead, MathLine, Prompt, Row, usePreloadClips } from '../components/primitives';
import { TuningKeyboard } from '../components/tuningKeyboard';
import { HarmonicComparison, LADDER_H, LADDER_W } from '../components/harmonicLadder';
import { CHART_H, CHART_W, DeviationChart } from '../components/stageFigures';
import { UnderstandingCheck } from '../components/check';
import { StageFit } from '../../rack/StageFit';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import type { DockParam } from '../../rack/rackTypes';
import { TuningRackLayout, flipFader, soundCell, stopKey, usePlayerStatus } from '../rackLayout';

const IDS: TuningSystemId[] = ['pythagorean', 'just', 'meantone', 'equal'];
/** Dock-key width names — at most 5 characters, so "B·Equal" on the A / B key
 *  still fits a five-key dock on a 375 phone (~7 mono characters; "vs Equal"
 *  and "Meantone" cropped, review 2026-09-30). The lane, tray and bezel carry
 *  the full name. */
const KEY_NAME: Record<TuningSystemId, string> = { pythagorean: 'Pyth.', just: 'Just', meantone: 'Mean.', equal: 'Equal' };
const ROOTS = [{ id: '440', label: 'A4 = 440 (C4 = 261.63)', short: 'A = 440', hz: C4_ET }, { id: '442', label: 'A4 = 442', short: 'A = 442', hz: 442 * Math.pow(2, -9 / 12) }, { id: '432', label: 'A4 = 432', short: 'A = 432', hz: 432 * Math.pow(2, -9 / 12) }];
type Example = 'third' | 'fifth' | 'triad' | 'scale' | 'melody';
const EXAMPLES: [Example, string][] = [['third', 'C–E third'], ['fifth', 'C–G fifth'], ['triad', 'C–E–G triad'], ['scale', 'C-major scale'], ['melody', 'short melody']];

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
  const [example, setExample] = useState<Example>('third');
  const status = usePlayerStatus(ctx.player);
  const sys = TUNING_SYSTEMS[sysId];
  const other = TUNING_SYSTEMS[bId];
  const note = sys.notes[sel];
  const root = ctx.rootHz;
  const hz = (r: number) => frequencyFromRatio(root, r);
  const dev = deviationFromEqualCents(note);
  const pair = useMemo(() => bestPair(note.value.numericRatio), [note]);
  const refId = ROOTS.find((r) => Math.abs(root - r.hz) < 0.01)?.id ?? null;

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
  const exampleName = EXAMPLES.find(([k]) => k === example)?.[1] ?? example;
  const play = (make: () => ReturnType<typeof renderNotes>, name: string) => void ctx.player.renderAndPlay(make, name);
  usePreloadClips(ctx.player, () => [() => render(sys), () => render(other), () => concatWithGap(render(sys), render(other))], `${sysId}|${bId}|${example}|${root}`);

  const params: DockParam[] = [
    flipFader({ id: 'system', label: 'SYSTEM', title: 'SYSTEM A · ON THE CHART', items: IDS.map((id) => ({ id })), selectedId: sysId, onSelect: (id) => setSysId(id as TuningSystemId), name: (s) => TUNING_SYSTEMS[s.id as TuningSystemId].name, short: (s) => KEY_NAME[s.id as TuningSystemId], blurb: (s) => TUNING_SYSTEMS[s.id as TuningSystemId].rule }),
    flipFader({ id: 'note', label: 'NOTE', title: 'INSPECT A DEGREE', items: sys.notes.map((n, i) => ({ id: String(i), n })), selectedId: String(sel), onSelect: (id) => setSel(Number(id)), name: (d) => `${d.n.spelling}${d.n.degree === 8 ? ' (octave)' : ''} · ${d.n.value.exactLabel}`, short: (d) => d.n.spelling, blurb: (d) => d.n.value.constructionSource }),
    {
      kind: 'options',
      id: 'ref',
      label: 'REF',
      valueLabel: refId ?? `${root.toFixed(1)}`,
      options: ROOTS.map((r) => ({ id: r.id, label: r.label, blurb: `C4 = ${r.hz.toFixed(2)} Hz. The reference pitch applies to the whole lab; every ratio is applied to this C.` })),
      selectedId: refId,
      onSelect: (id) => {
        const r = ROOTS.find((x) => x.id === id);
        if (r) ctx.setRootHz(r.hz);
      },
      sticky: true,
    },
    {
      kind: 'group',
      id: 'ab',
      label: 'A / B',
      valueLabel: `B·${KEY_NAME[bId]}`,
      render: () => (
        <View style={styles.tray}>
          <Eyebrow>EXAMPLE</Eyebrow>
          <Row>
            {EXAMPLES.map(([k, l]) => (
              <Btn key={k} label={l} tone={example === k ? 'primary' : 'plain'} selected={example === k} onPress={() => setExample(k)} a11y={`Example: ${l}`} />
            ))}
          </Row>
          <Eyebrow>SYSTEM B</Eyebrow>
          <Row>
            {IDS.map((id) => <Btn key={id} label={TUNING_SYSTEMS[id].shortName} tone={bId === id ? 'primary' : 'plain'} selected={bId === id} onPress={() => setBId(id)} a11y={`System B: ${TUNING_SYSTEMS[id].shortName}`} />)}
          </Row>
          <Eyebrow>PLAY · {sys.shortName.toUpperCase()} (A) VS {other.shortName.toUpperCase()} (B) · {exampleName.toUpperCase()}</Eyebrow>
          <Row>
            <Btn label={`▶ A · ${sys.shortName}`} onPress={() => play(() => render(sys), `${sys.shortName} · ${exampleName}`)} a11y={`Play A, ${sys.shortName}`} />
            <Btn label={`▶ B · ${other.shortName}`} onPress={() => play(() => render(other), `${other.shortName} · ${exampleName}`)} a11y={`Play B, ${other.shortName}`} />
            <Btn label="A → B" onPress={() => play(() => concatWithGap(render(sys), render(other)), `${sys.shortName} then ${other.shortName} · ${exampleName}`)} a11y="Play A then B" />
            <Btn label="■ STOP" tone="danger" onPress={() => ctx.player.stop()} a11y="Stop audio" />
          </Row>
          <Eyebrow>HEAR THE SAME NOTE MOVE · E OVER A FIXED C</Eyebrow>
          <Row>
            {(['just', 'equal', 'pythagorean'] as TuningSystemId[]).map((id) => {
              const e = TUNING_SYSTEMS[id].notes[2];
              return <Btn key={id} label={`▶ ${TUNING_SYSTEMS[id].shortName} E · ${e.value.cents.toFixed(2)} ¢`} onPress={() => play(() => renderNotes([root, hz(e.value.numericRatio)], 1.4, 'rich'), `C and ${TUNING_SYSTEMS[id].shortName} E`)} />;
            })}
          </Row>
        </View>
      ),
    },
    stopKey(ctx.player),
  ];

  return (
    <TuningRackLayout
      ctx={ctx}
      rack={{
        size: 'M',
        initialParam: 'system',
        hideDragTag: true,
        bezel: [
          // The spelling rides on the KEY line (review 2026-09-30): meantone's
          // "B 5^(5/4)/4" is 11 mono characters in a ~83 px cell — it cropped
          // to an ellipsis on a 390 phone, and a readout never drops its number.
          { k: `NOTE ${note.spelling}`, v: note.value.exactLabel, tint: colors.cyanBright, flex: 1.15 },
          { k: 'Hz', v: `${hz(note.value.numericRatio).toFixed(2)} Hz`, flex: 1.1 },
          { k: 'VS EQUAL', v: Math.abs(dev) < 0.05 ? '0 ¢' : `${dev > 0 ? '+' : ''}${dev.toFixed(2)} ¢`, tint: Math.abs(dev) < 0.05 ? colors.green : Math.abs(dev) < 10 ? colors.gold : colors.orange },
          soundCell(status),
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={CHART_W / CHART_H}>
            <DeviationChart system={sys} selected={sel} onSelect={setSel} />
          </StageFit>
        ),
        params,
      }}
      caption="Ride SYSTEM through the four systems and watch every bar move; tap a bar, or ride NOTE, to inspect one degree. A / B opens the comparison: pick the example and system B, then play."
      wellTop={
        <Card>
          <Eyebrow>{sys.name.toUpperCase()} · C FIXED AT {root.toFixed(2)} Hz</Eyebrow>
          <TuningKeyboard system={sys} selected={sel} onSelect={setSel} rootHz={root} />
          {/* NEW COPY — the old legend promised ● and ▲ glyphs the keys never drew. */}
          <Text style={styles.legend}>Keys never move. Each bar is that note’s signed distance from equal temperament — green exact · gold within 10 ¢ · orange beyond. Tap a key to inspect it.</Text>
        </Card>
      }
    >
      <Lead>Every system on the same C, the same keys, the same sounds — only the ratios change.</Lead>
      <Card tone="math">
        <Eyebrow>{note.spelling}{sel === 7 ? ' (OCTAVE)' : ''} · {sys.shortName}</Eyebrow>
        <MathLine>ratio {note.value.exactLabel}{ctx.mathView ? ` ≈ ${note.value.decimalLabel}` : ''}</MathLine>
        <MathLine>{hz(note.value.numericRatio).toFixed(2)} Hz · {note.value.cents.toFixed(2)} ¢ above C</MathLine>
        <MathLine emphasis>{Math.abs(dev) < 0.05 ? 'exactly equal temperament' : `${dev > 0 ? '+' : ''}${dev.toFixed(2)} ¢ from equal temperament (${dev > 0 ? 'higher' : 'lower'})`}</MathLine>
        <Text style={styles.legend}>{note.value.constructionSource}</Text>
      </Card>
      {sel > 0 && sel < 7 ? (
        pair ? (
          <>
            <ExpandableFigure
              title={`HARMONIC LADDERS · C–${note.spelling}`}
              aspect={LADDER_W / LADDER_H}
              render={() => <HarmonicComparison fit readout={false} rootHz={root} upperHz={hz(note.value.numericRatio)} rootHarmonic={pair.rootH} upperHarmonic={pair.noteH} rootLabel="root C" upperLabel={`${note.spelling} ${note.value.exactLabel}`} />}
            />
            <Text style={styles.legend}>
              root C harmonic {pair.rootH}: {(root * pair.rootH).toFixed(2)} Hz · {note.spelling} harmonic {pair.noteH}: {(hz(note.value.numericRatio) * pair.noteH).toFixed(2)} Hz · {Math.abs(root * pair.rootH - hz(note.value.numericRatio) * pair.noteH) < 0.005 ? 'same frequency — 0 Hz' : `difference ${(hz(note.value.numericRatio) * pair.noteH - root * pair.rootH).toFixed(2)} Hz`}
            </Text>
          </>
        ) : (
          // NEW COPY — honest empty state instead of a meaningless bracket.
          <Body>No pair of harmonics up to {MAX_H} comes within 2 % for {note.spelling} {note.value.exactLabel}, so no ladder is drawn — the nearest low-harmonic alignment for this ratio lies above the display.</Body>
        )
      ) : null}

      <Prompt>A/B the same example in two systems. Root, register, timbre, duration, articulation, gain, voicing and tempo are held constant.</Prompt>
      <Body>The A / B key holds the comparison: the example ({exampleName}), system B ({other.shortName}), the A / B / A → B keys — and the same E over a fixed C in three systems. Same written scale degree, different assigned frequency.</Body>

      <Eyebrow>DEVIATION FROM EQUAL TEMPERAMENT · {sys.shortName.toUpperCase()}</Eyebrow>
      <Body>The chart on the glass: each bar is that note's signed distance from equal temperament in cents. Ride SYSTEM and watch the bars move.</Body>
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
    </TuningRackLayout>
  );
}

const styles = StyleSheet.create({
  legend: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  tray: { gap: 8 },
});
