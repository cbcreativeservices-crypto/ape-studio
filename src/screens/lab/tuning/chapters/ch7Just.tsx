/**
 * Chapter 7 — Build Harmony With Just Intonation (spec Stage 3): one common
 * five-limit C-major mapping revealed a note at a time, the 4:5:6 triad,
 * three pure major thirds one arc at a time, harmonic alignment, and the
 * key-dependence demonstration (keep pitches vs retune around a new tonic).
 *
 * ON THE RACK (2026-09-30): the cents rail is the stage. NOTES on the lane
 * reveals the mapping a note at a time; PLAY is a tray of every clip the
 * chapter can sound (the clips arrive as the chapter unfolds); once all
 * eight are revealed, TONIC and RETUNE drive the key-dependence
 * demonstration — in RETUNE the rail's lower lane shows where each note
 * moves. The C–E harmonic ladders, a secondary figure, sit in the well with
 * their own FULL SCREEN.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import {
  TUNING_SYSTEMS, type Frac, frac, fracDiv, fracEq, fracLabel, fracMul, fracValue, frequencyFromRatio, normalizeFracToOctave, ratioToCents,
} from '../../../../features/tuning/tuningMath';
import { renderNotes, renderPartials } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Btn, Card, CentsRail, CENTS_RAIL_W, EquationStage, Eyebrow, Lead, MathLine, Prompt, RatioTile, Row, usePreloadClips, type RailMarker } from '../components/primitives';
import { HarmonicComparison, LADDER_H, LADDER_W } from '../components/harmonicLadder';
import { UnderstandingCheck } from '../components/check';
import { StageFit } from '../../rack/StageFit';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import type { DockParam } from '../../rack/rackTypes';
import { TuningRackLayout, playTray, soundCell, stopKey, usePlayerStatus, type PlayClip } from '../rackLayout';

const JUST = TUNING_SYSTEMS.just;
const JUST_FRACS: Record<string, Frac | undefined> = { C: frac(1, 1), D: frac(9, 8), E: frac(5, 4), F: frac(4, 3), G: frac(3, 2), A: frac(5, 3), B: frac(15, 8) };
const jf = (sp: string): Frac => JUST_FRACS[sp] ?? frac(1, 1);
const THIRDS: [string, string][] = [['C', 'E'], ['F', 'A'], ['G', 'B']];
const NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
type Tonic = 'C' | 'F' | 'G' | 'D';
/** Proper major-scale spellings. The letter alone is not enough: F major
 *  needs B♭, G major F♯, D major F♯ and C♯ — none of which the C-major set
 *  contains. (An earlier version spelled them B, F and C and reported
 *  "B moved −92 ¢" — a different note, not a moved one.) */
const SCALE_SPELLING: Record<Tonic, string[]> = {
  C: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  F: ['F', 'G', 'A', 'B♭', 'C', 'D', 'E'],
  G: ['G', 'A', 'B', 'C', 'D', 'E', 'F♯'],
  D: ['D', 'E', 'F♯', 'G', 'A', 'B', 'C♯'],
};
const RAIL_H = 128;
const N = JUST.notes.length; // 8

export function Ch7Just({ ctx }: ChapterProps) {
  const [revealed, setRevealed] = useState(1);
  const [arcs, setArcs] = useState(0); // how many pure-third arcs shown
  const [tonic, setTonic] = useState<Tonic>('C');
  const [mode, setMode] = useState<'keep' | 'retune'>('keep');
  const [last, setLast] = useState<string | null>(null);
  const status = usePlayerStatus(ctx.player);
  const root = ctx.rootHz;
  const hz = (r: number) => frequencyFromRatio(root, r);
  // Saved + pre-rendered clips (owner 2026-09-29): the fixed buttons' clips render in the background.
  usePreloadClips(
    ctx.player,
    () => [
      () => renderNotes([root], 1, 'rich'),
      () => renderNotes([hz(5 / 4)], 1, 'rich'),
      () => renderNotes([hz(3 / 2)], 1, 'rich'),
      () => renderNotes([root, hz(5 / 4), hz(3 / 2)], 2.2, 'rich'),
      () => renderPartials([root * 5, hz(5 / 4) * 4], 2),
    ],
    String(root),
  );

  // Key dependence: compare the fixed C-major pitches against a mapping rebuilt on the new tonic.
  const keyDemo = useMemo(() => {
    const t = jf(tonic);
    const spell = SCALE_SPELLING[tonic];
    const idx = NAMES.indexOf(tonic);
    // RETUNE: the same seven Just ratios rebuilt on the new tonic, folded, properly spelled.
    const retuned = NAMES.map((deg, k) => ({ spelling: spell[k], ratio: normalizeFracToOctave(fracMul(t, jf(deg))).ratio }));
    const moved = retuned.flatMap((r) => {
      const was = JUST_FRACS[r.spelling];
      return was && !fracEq(was, r.ratio) ? [{ ...r, was }] : [];
    });
    const added = retuned.filter((r) => !JUST_FRACS[r.spelling]); // needs a pitch the C set never had
    // KEEP: measure the intervals the new key wants, using only the fixed C-major pitches.
    const deg = (k: number) => ({ letter: NAMES[(idx + k) % 7] as string, spelled: spell[k] });
    const mk = (name: string, ka: number, kb: number, want: Frac, wantLabel: string) => {
      const a = deg(ka), b = deg(kb);
      const missing = [a, b].filter((d) => d.letter !== d.spelled).map((d) => d.spelled);
      const got = normalizeFracToOctave(fracDiv(jf(b.letter), jf(a.letter))).ratio;
      const ok = missing.length === 0 && fracEq(got, want);
      return { name, label: `${a.spelled} → ${b.spelled}`, missing, got, wantLabel, ok, offCents: ratioToCents(fracValue(got)) - ratioToCents(fracValue(want)) };
    };
    const checks = [
      mk('fifth', 0, 4, frac(3, 2), '3/2'),
      mk('major third', 0, 2, frac(5, 4), '5/4'),
      mk('major sixth', 0, 5, frac(5, 3), '5/3'),
      mk('fifth from the 2nd degree', 1, 5, frac(3, 2), '3/2'),
    ];
    const missingNotes = spell.filter((s) => !JUST_FRACS[s]);
    return { retuned, moved, added, checks, missingNotes, allOk: checks.every((c) => c.ok) && missingNotes.length === 0 };
  }, [tonic]);

  const keyStage = revealed >= N;
  const newest = JUST.notes[revealed - 1];
  // The rail: the mapping as revealed (upper lane). Once the key demonstration
  // is live, the tonic is emphasised, and in RETUNE the lower lane shows the
  // rebuilt set — moved notes in the operation colour, new pitches orange.
  const markers: RailMarker[] = [
    ...JUST.notes.slice(0, revealed).map((n, i) => ({
      id: `${n.spelling}${i}`,
      cents: n.value.cents,
      label: n.spelling,
      role: keyStage ? (n.spelling === tonic ? ('active' as const) : mode === 'retune' ? ('muted' as const) : ('neutral' as const)) : i === revealed - 1 ? ('operation' as const) : ('neutral' as const),
      emphasis: keyStage ? n.spelling === tonic : i === revealed - 1,
      row: i % 2,
    })),
    ...(keyStage && mode === 'retune'
      ? keyDemo.retuned.map((r) => {
          const was = JUST_FRACS[r.spelling];
          const role = !was ? ('far' as const) : fracEq(was, r.ratio) ? ('exact' as const) : ('operation' as const);
          return { id: `r${r.spelling}`, cents: ratioToCents(fracValue(r.ratio)), label: r.spelling, role, lane: 1 as const, emphasis: role !== 'exact' };
        })
      : []),
  ];

  const clips: PlayClip[] = [
    ...(revealed > 1 ? [{ id: 'newest', label: `C + ${newest.spelling}`, make: () => renderNotes([root, hz(newest.value.numericRatio)], 1.4, 'rich'), name: `C and ${newest.spelling}` }] : []),
    ...(revealed >= 5
      ? [
          { id: 'c', label: 'C', make: () => renderNotes([root], 1, 'rich'), name: 'C' },
          { id: 'e', label: 'E 5/4', make: () => renderNotes([hz(5 / 4)], 1, 'rich'), name: 'E 5/4' },
          { id: 'g', label: 'G 3/2', make: () => renderNotes([hz(3 / 2)], 1, 'rich'), name: 'G 3/2' },
          { id: 'chord', label: 'CHORD 4:5:6', make: () => renderNotes([root, hz(5 / 4), hz(3 / 2)], 2.2, 'rich'), name: 'C major triad 4:5:6' },
          { id: 'partials', label: 'ALIGNED PARTIALS', make: () => renderPartials([root * 5, hz(5 / 4) * 4], 2), name: 'isolated: C harmonic 5 and E harmonic 4', blurb: 'C’s 5th harmonic and E’s 4th by themselves — the same frequency.' },
        ]
      : []),
    ...(revealed >= 7
      ? THIRDS.slice(0, arcs).map(([lo, hi]) => ({ id: `arc${lo}`, label: `${lo}–${hi} · 5/4`, make: () => renderNotes([hz(fracValue(jf(lo))), hz(fracValue(jf(hi)))], 1.4, 'rich'), name: `${lo} to ${hi}` }))
      : []),
  ];

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'notes',
      label: 'NOTES',
      value: (revealed - 1) / (N - 1),
      onChange: (p) => setRevealed(1 + Math.round(p * (N - 1))),
      format: (p) => {
        const n = 1 + Math.round(p * (N - 1));
        return `${n} of ${N} · ${JUST.notes[n - 1].spelling} ${JUST.notes[n - 1].value.exactLabel}`;
      },
      formatShort: (p) => `${1 + Math.round(p * (N - 1))}/${N}`,
    },
    ...(clips.length ? [playTray({ player: ctx.player, last, setLast, clips, short: (c) => c.label.split(' ')[0] })] : []),
    ...(keyStage
      ? ([
          {
            kind: 'options',
            id: 'tonic',
            label: 'TONIC',
            valueLabel: tonic,
            options: (['C', 'F', 'G', 'D'] as const).map((t) => ({ id: t, label: `Tonic ${t}`, blurb: t === 'C' ? 'The mapping was built here.' : `${t} major needs ${SCALE_SPELLING[t].filter((s) => !JUST_FRACS[s]).join(' and ')} — pitches this seven-note set does not contain.` })),
            selectedId: tonic,
            onSelect: (id) => setTonic(id as Tonic),
            sticky: true,
          },
          { kind: 'toggle', id: 'retune', label: 'RETUNE', value: mode === 'retune', onToggle: () => setMode((m) => (m === 'keep' ? 'retune' : 'keep')) },
        ] as DockParam[])
      : []),
    stopKey(ctx.player),
  ];

  return (
    <TuningRackLayout
      ctx={ctx}
      rack={{
        size: 'S',
        initialParam: 'notes',
        hideDragTag: true,
        bezel: keyStage
          ? [
              { k: 'TONIC', v: tonic, tint: colors.cyanBright, flex: 0.8 },
              { k: 'MODE', v: mode === 'keep' ? 'KEEP' : 'RETUNE', tint: mode === 'retune' ? colors.gold : undefined },
              { k: mode === 'keep' ? 'IMPURE' : 'MOVED', v: mode === 'keep' ? `${keyDemo.checks.filter((c) => !c.ok).length} of 4` : `${keyDemo.moved.length} + ${keyDemo.added.length} new`, tint: colors.gold, flex: 1.1 },
              soundCell(status),
            ]
          : [
              { k: 'NOTE', v: `${newest.spelling} ${newest.value.exactLabel}`, tint: colors.gold, flex: 1.1 },
              { k: 'CENTS', v: `${newest.value.cents.toFixed(2)} ¢` },
              { k: 'Hz', v: `${hz(newest.value.numericRatio).toFixed(2)} Hz`, flex: 1.1 },
              soundCell(status),
            ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={CENTS_RAIL_W / RAIL_H}>
            <CentsRail markers={markers} reduceMotion={ctx.reduceMotion} height={RAIL_H} fit />
          </StageFit>
        ),
        params,
      }}
      caption={keyStage
        ? 'Tap TONIC to change the key, then RETUNE: the lower lane shows every note that would have to move — and the new pitches the C set never had.'
        : 'Ride NOTES to reveal the mapping one note at a time — each lands on the rail, and from the second note a PLAY key sounds C with the newest one.'}
    >
      <Lead>What if we build around simple harmonic relationships instead of generating every note from pure fifths?</Lead>
      <Eyebrow>ONE COMMON FIVE-LIMIT JUST C-MAJOR EXAMPLE</Eyebrow>
      <Row>
        {JUST.notes.slice(0, revealed).map((n, i) => (
          <RatioTile key={i} note={n.spelling} value={n.value} hz={hz(n.value.numericRatio)} fresh={i === revealed - 1} compact showDecimal={ctx.mathView} />
        ))}
      </Row>
      <Body>{revealed < N ? `${JUST.notes[revealed - 1].value.constructionSource}. Reveal the next note.` : 'All eight revealed. This is ONE selected mapping — Just Intonation is a family of choices, not a single fixed table.'}</Body>

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
          <Body>The C-major triad can be expressed as the simple whole-number relationship 4:5:6 — a ratio between the three notes, not harmonic numbers of one displayed fundamental (that reading only holds if all three are built on a shared reference two octaves below C). Hear C, E, G, the chord and the aligned partials from the PLAY key.</Body>
        </>
      ) : null}

      {revealed >= 7 ? (
        <>
          <Eyebrow>PURE MAJOR THIRDS IN THIS MAPPING</Eyebrow>
          {/* One arc per press — the first card used to appear before the first
              press, captioned "press SHOW NEXT ARC" while the button said FIRST. */}
          {arcs === 0 ? <Body>Three of the major thirds in this mapping are exactly 5/4. Reveal them one at a time.</Body> : null}
          {THIRDS.slice(0, arcs).map(([lo, hi]) => {
            const q = fracDiv(jf(hi), jf(lo));
            return (
              <Card key={lo} tone="math">
                <MathLine>{lo} → {hi}: ({fracLabel(jf(hi))}) ÷ ({fracLabel(jf(lo))}) = {fracLabel(q)}</MathLine>
                <Text style={styles.sub}>{ratioToCents(fracValue(q)).toFixed(2)} ¢ · pure 5/4 major third · hear it from the PLAY key</Text>
              </Card>
            );
          })}
          <Row>
            {arcs < 3 ? <Btn label={arcs === 0 ? 'SHOW FIRST ARC' : arcs === 1 ? 'SHOW NEXT ARC' : 'SHOW LAST ARC'} tone="primary" onPress={() => setArcs(arcs + 1)} /> : <Btn label="REPLAY ARCS" onPress={() => setArcs(0)} />}
          </Row>
          <ExpandableFigure
            title="HARMONIC LADDERS · C–E"
            aspect={LADDER_W / LADDER_H}
            render={() => <HarmonicComparison fit readout={false} rootHz={root} upperHz={hz(5 / 4)} rootHarmonic={5} upperHarmonic={4} rootLabel="root C" upperLabel="E 5/4" />}
          />
          <HarmonicComparisonReadout rootHz={root} upperHz={hz(5 / 4)} />
        </>
      ) : null}

      {keyStage ? (
        <>
          <Prompt>Change the tonic and choose what happens to the pitches.</Prompt>
          {/* NEW COPY throughout this block. KEEP measures four intervals the
              new key wants — fifth, third, sixth from the tonic and the fifth
              from the 2nd degree — and lists the notes the key needs that
              this seven-note set does not contain. Even C fails one line:
              D → A is 40/27, the classic five-limit impure fifth. */}
          {mode === 'keep' ? (
            <Card tone={keyDemo.allOk ? 'ok' : 'warn'}>
              <Eyebrow>ALL SEVEN PITCHES UNCHANGED · MEASURED FROM {tonic}</Eyebrow>
              {keyDemo.checks.map((c) => (
                <MathLine key={c.name}>
                  {c.label} ({c.name}): {c.missing.length ? `${c.missing.join(' and ')} not in this set` : `${fracLabel(c.got)} = ${ratioToCents(fracValue(c.got)).toFixed(2)} ¢ ${c.ok ? `✓ pure ${c.wantLabel}` : `✗ not ${c.wantLabel} (${c.offCents > 0 ? '+' : ''}${c.offCents.toFixed(2)} ¢)`}`}
                </MathLine>
              ))}
              {keyDemo.missingNotes.length ? <MathLine emphasis>{tonic} major needs {keyDemo.missingNotes.join(' and ')} — this seven-note set has no such pitch.</MathLine> : null}
              <Body>
                {tonic === 'C'
                  ? 'Even with C as the tonic, one fifth inside this set is impure: D → A is 40/27, 21.51 ¢ narrow. A single fixed set of seven pitches cannot make every fifth AND every third pure at once.'
                  : keyDemo.checks.every((c) => c.ok)
                    ? `Every interval measured here is exact from ${tonic} — but ${tonic} major needs ${keyDemo.missingNotes.join(' and ')}, and this seven-note set has no such pitch. The key cannot even be played from it without adding a note.`
                    : `The pitches stayed where the C-major mapping put them, so ${tonic} major does not get all of its simple ratios${keyDemo.missingNotes.length ? ' — and is missing notes it needs' : ''}.`}
              </Body>
            </Card>
          ) : (
            <Card tone="ok">
              <Eyebrow>REBUILT AROUND {tonic} · {tonic} STAYS FIXED</Eyebrow>
              {keyDemo.moved.map((c) => (
                <MathLine key={c.spelling}>{c.spelling}: {fracLabel(c.was)} → {fracLabel(c.ratio)} ({(ratioToCents(fracValue(c.ratio)) - ratioToCents(fracValue(c.was))).toFixed(2)} ¢ {ratioToCents(fracValue(c.ratio)) > ratioToCents(fracValue(c.was)) ? 'higher' : 'lower'})</MathLine>
              ))}
              {keyDemo.added.map((c) => (
                <MathLine key={c.spelling} emphasis>{c.spelling}: {fracLabel(c.ratio)} — a new pitch the C-major set never had</MathLine>
              ))}
              {!keyDemo.moved.length && !keyDemo.added.length ? <MathLine>No note needs to move — you are already in C.</MathLine> : null}
              <Body>
                {keyDemo.moved.length || keyDemo.added.length
                  ? `Recomputing the mapping around ${tonic} restores its simple relationships — at the cost of moving ${keyDemo.moved.length} note${keyDemo.moved.length === 1 ? '' : 's'} and adding ${keyDemo.added.length} new pitch${keyDemo.added.length === 1 ? '' : 'es'}. A fixed instrument cannot do this mid-piece; a singer or string player can.`
                  : 'Pick another tonic to see which notes would have to move.'}
              </Body>
            </Card>
          )}
          <Body>Just relationships can be extremely pure for a chosen tonal center, but one fixed set of pitches does not preserve every simple ratio in every key. Performers may adjust pitch dynamically with harmony, melody, style and ensemble context.</Body>
          {/* NEW COPY — targets "Just Intonation is one universal scale". */}
          <UnderstandingCheck
            question="You keep the C-major Just pitches fixed and the music moves to D major. What happens?"
            options={['Nothing — the same pitches give pure intervals from D', 'Some ratios from D are impure, and D major needs missing notes', 'Every interval from D becomes exactly one comma sharp', 'The octave from D is no longer exactly 2:1']}
            correct={1}
            explain="Some ratios from D are no longer exact (D → A = 40/27, 21.51 ¢ narrow) and D major needs F♯ and C♯, which this seven-note set does not contain."
            wrong={[
              'Measure it: D → A is 40/27, not 3/2 — 21.51 ¢ narrow. Fixed pitches do not re-tune themselves.',
              undefined,
              'The errors are not uniform: some intervals from D stay pure (D → B = 5/3) while others miss by a comma.',
              'Octaves are untouched — every note keeps its ×2 partner. It is the fifths and thirds that shift.',
            ]}
            onCorrect={ctx.markDone}
          />
          {!ctx.isDone ? <Btn label="I’VE GOT IT ›" tone="primary" onPress={ctx.markDone} /> : null}
        </>
      ) : null}
    </TuningRackLayout>
  );
}

/** The ladder figure's numbers, printed under it (the figure itself keeps its
 *  text inside the drawing so it zooms). */
function HarmonicComparisonReadout({ rootHz, upperHz }: { rootHz: number; upperHz: number }) {
  const pa = rootHz * 5, pb = upperHz * 4;
  return (
    <Text style={styles.sub}>root C harmonic 5: {pa.toFixed(2)} Hz · E 5/4 harmonic 4: {pb.toFixed(2)} Hz · {Math.abs(pa - pb) < 0.005 ? 'same frequency — 0 Hz · 0 ¢' : `difference ${(pb - pa).toFixed(2)} Hz`}</Text>
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
});
