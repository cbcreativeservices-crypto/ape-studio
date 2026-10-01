/**
 * Chapter 9 — Build Quarter-Comma Meantone (spec Stage 4): the whole tone
 * as a multiplicative midpoint, the fifth derived from g⁴ = 5, the
 * fifth-width slider that lands four fifths on 5/4, the diatonic scale with
 * exact radicals, and the wolf that closes the selected E♭…G♯ chain.
 *
 * ON THE RACK (2026-09-30): PART is a flip-through key (ride it A → E or tap
 * for the list) and the stage follows the part — the C·D·E rail (A), the
 * four stacked fifths on the rail (B), the harmonic ladders the FIFTH fader
 * drives (C), the scale as NOTES reveals it (D), the twelve-note chain with
 * the wolf's two ends in red (E). SHOW ME, the play trays and ■ STOP are
 * dock keys; the derivations and cards read in the well.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import {
  TUNING_SYSTEMS, MEANTONE_FIFTH, MEANTONE_TONE, PURE_FIFTH, JUST_MAJOR_THIRD, ET_FIFTH, MEANTONE_WOLF_CHAIN,
  centsToRatio, ratioToCents, frequencyFromRatio, meantoneWolf, normalizeRatioToOctave,
} from '../../../../features/tuning/tuningMath';
import { renderNotes, renderSequence } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Card, CentsRail, CENTS_RAIL_W, DeviationMeter, EquationStage, Eyebrow, Lead, MathLine, Prompt, RatioTile, Row, useMarkWhen, usePreloadClips, type RailMarker } from '../components/primitives';
import { HarmonicComparison, LADDER_H, LADDER_W } from '../components/harmonicLadder';
import { UnderstandingCheck } from '../components/check';
import { StageFit } from '../../rack/StageFit';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import { TuningRackLayout, flipFader, lanePos, laneVal, playKey, playTray, snapNear, soundCell, stopKey, usePlayerStatus } from '../rackLayout';

const MT = TUNING_SYSTEMS.meantone;
type Part = 'A' | 'B' | 'C' | 'D' | 'E';
const PARTS: { id: Part; name: string; short: string; blurb: string }[] = [
  { id: 'A', name: 'A · The whole tone', short: 'A TONE', blurb: 'Two identical steps from C reach the pure major third E. What is one step?' },
  { id: 'B', name: 'B · The fifth', short: 'B FIFTH', blurb: 'Four identical fifths reach that same E two octaves up. What is one fifth?' },
  { id: 'C', name: 'C · Find it yourself', short: 'C FIND', blurb: 'Narrow the fifth until four of them make a pure 5:4 major third.' },
  { id: 'D', name: 'D · The scale', short: 'D SCALE', blurb: 'Every pitch from the same tempered fifth, folded into one octave.' },
  { id: 'E', name: 'E · The wolf', short: 'E WOLF', blurb: 'Where the discrepancy went: the closing interval of a twelve-note chain.' },
];
const RAIL_H = 110;
const MIN = 690, MAX = 705;

export function Ch9Meantone({ ctx }: ChapterProps) {
  const [part, setPart] = useState<Part>('A');
  const [fifthCents, setFifthCents] = useState(700);
  const [revealed, setRevealed] = useState(1);
  const [last, setLast] = useState<string | null>(null);
  const status = usePlayerStatus(ctx.player);
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
  // Completion: the learner landed four fifths on a pure third (Part C).
  useMarkWhen(exact, ctx.markDone);

  const wolf = meantoneWolf();
  // Frequencies for the wolf: G♯ is eight tempered fifths above C, E♭ three below — folded.
  const gSharp = hz(normalizeRatioToOctave(Math.pow(MEANTONE_FIFTH.numericRatio, 8)));
  const eFlatAbove = gSharp * centsToRatio(wolf.wolfCents);
  const normalFifthFrom = (f: number) => f * MEANTONE_FIFTH.numericRatio;
  // Saved + pre-rendered clips (owner 2026-09-29): the fixed buttons' clips render in the background.
  usePreloadClips(
    ctx.player,
    () => [
      () => renderNotes([root, root * 1.5], 1.4, 'rich'),
      () => renderNotes([root, root * MEANTONE_FIFTH.numericRatio], 1.4, 'rich'),
      () => renderNotes([gSharp, normalFifthFrom(gSharp)], 1.6, 'rich'),
      () => renderNotes([gSharp, eFlatAbove], 1.6, 'rich'),
    ],
    String(root),
  );

  /* ── the stage per part ───────────────────────────────────────────────── */
  // B: the four meantone fifths C → G → D → A → E, each folded. The label is
  // the FOLDED power (review 2026-09-30): g² is 1393 ¢ and g³ 2090 ¢ — what
  // sits on the rail at 193 ¢ and 890 ¢ is g²/2 and g³/2, one octave down.
  const fourFifths: RailMarker[] = ['C', 'G', 'D', 'A', 'E'].map((sp, k) => ({
    id: `ff${k}`,
    cents: k === 0 ? 0 : ratioToCents(normalizeRatioToOctave(Math.pow(MEANTONE_FIFTH.numericRatio, k))),
    label: k === 0 ? 'C · 1' : k === 4 ? 'E · g⁴/4 = 5/4' : `${sp} · ${['', 'g', 'g²/2', 'g³/2'][k]}`,
    role: k === 4 ? 'exact' : k === 0 ? 'neutral' : 'operation',
    emphasis: k === 4,
    row: k % 2,
  }));
  // E: the selected twelve-note chain E♭ … G♯ — g^k for k = −3 … 8, folded.
  const chain: RailMarker[] = MEANTONE_WOLF_CHAIN.map((sp, i) => {
    const k = i - 3;
    const wolfEnd = sp === 'G♯' || sp === 'E♭';
    return { id: `w${i}`, cents: ratioToCents(normalizeRatioToOctave(Math.pow(MEANTONE_FIFTH.numericRatio, k))), label: sp, role: wolfEnd ? 'error' : 'neutral', emphasis: wolfEnd, row: i % 2 };
  });
  const scaleMarkers: RailMarker[] = MT.notes.slice(0, revealed).map((n, i) => ({ id: `m${i}`, cents: n.value.cents, label: n.spelling, role: i === revealed - 1 ? 'operation' : 'neutral', emphasis: i === revealed - 1, row: i % 2 }));
  const toneMarkers: RailMarker[] = [{ id: 'C', cents: 0, label: 'C · 1', role: 'neutral' }, { id: 'D', cents: MEANTONE_TONE.cents, label: 'D · ×t', role: 'operation', emphasis: true, row: 1 }, { id: 'E', cents: JUST_MAJOR_THIRD.cents, label: 'E · 5/4', role: 'exact' }];
  const rail = (markers: RailMarker[]) => (w: number, h: number) => (
    <StageFit w={w} h={h} aspect={CENTS_RAIL_W / RAIL_H}>
      <CentsRail markers={markers} reduceMotion={ctx.reduceMotion} height={RAIL_H} fit />
    </StageFit>
  );
  const stage =
    part === 'A' ? rail(toneMarkers)
    : part === 'B' ? rail(fourFifths)
    : part === 'C' ? (w: number, h: number) => (
        <StageFit w={w} h={h} aspect={LADDER_W / LADDER_H}>
          <HarmonicComparison fit readout={false} rootHz={root} upperHz={hz(slider.third)} rootHarmonic={5} upperHarmonic={4} rootLabel="root C" upperLabel="E from four fifths" />
        </StageFit>
      )
    : part === 'D' ? rail(scaleMarkers)
    : rail(chain);

  const errTint = exact ? colors.green : Math.abs(slider.err) < 8 ? colors.gold : colors.orange;
  const bezel: BezelItem[] =
    part === 'A' ? [
      { k: 't = √5/2', v: MEANTONE_TONE.decimalLabel, tint: colors.gold, flex: 1.2 },
      { k: 'D', v: `${MEANTONE_TONE.cents.toFixed(2)} ¢`, tint: colors.gold },
      { k: 'E = t²', v: `${JUST_MAJOR_THIRD.cents.toFixed(2)} ¢`, tint: colors.green },
    ]
    : part === 'B' ? [
      { k: 'g = ⁴√5', v: `${MEANTONE_FIFTH.cents.toFixed(2)} ¢`, tint: colors.gold },
      { k: 'PURE 3/2', v: `${PURE_FIFTH.cents.toFixed(2)} ¢` },
      { k: 'NARROWER', v: `${(PURE_FIFTH.cents - MEANTONE_FIFTH.cents).toFixed(2)} ¢`, tint: colors.gold },
      soundCell(status),
    ]
    : part === 'C' ? [
      { k: 'FIFTH', v: `${fifthCents.toFixed(2)} ¢`, tint: colors.cyanBright },
      { k: 'g⁴/4', v: `${slider.thirdCents.toFixed(2)} ¢` },
      { k: 'FROM 5/4', v: exact ? '0 ¢' : `${slider.err > 0 ? '+' : ''}${slider.err.toFixed(2)} ¢`, tint: errTint },
      soundCell(status),
    ]
    : part === 'D' ? [
      // The spelling rides on the KEY line: "B 5^(5/4)/4" is 11 mono characters
      // and cropped at a raised font size — a cropped readout may drop its
      // label, never its number (D36).
      { k: `NOTE ${MT.notes[revealed - 1].spelling}`, v: MT.notes[revealed - 1].value.exactLabel, tint: colors.gold, flex: 1.3 },
      { k: 'CENTS', v: `${MT.notes[revealed - 1].value.cents.toFixed(2)} ¢` },
      { k: 'Hz', v: `${hz(MT.notes[revealed - 1].value.numericRatio).toFixed(2)} Hz`, flex: 1.1 },
      soundCell(status),
    ]
    : [
      { k: 'WOLF', v: `${wolf.wolfCents.toFixed(2)} ¢`, tint: colors.red },
      { k: 'NORMAL', v: `${wolf.normalFifthCents.toFixed(2)} ¢` },
      { k: 'WIDER BY', v: `${wolf.widerThanNormalBy.toFixed(2)} ¢`, tint: colors.red },
      soundCell(status),
    ];

  /* ── the dock per part ────────────────────────────────────────────────── */
  const params: DockParam[] = [
    flipFader({ id: 'part', label: 'PART', title: 'FIVE SHORT PARTS, IN ORDER', items: PARTS, selectedId: part, onSelect: (id) => setPart(id as Part), name: (p) => p.name, short: (p) => p.short, blurb: (p) => p.blurb }),
    ...(part === 'B'
      ? [
          playTray({
            player: ctx.player, last, setLast,
            clips: [
              { id: 'pure', label: 'PURE FIFTH 3/2', make: () => renderNotes([root, root * 1.5], 1.4, 'rich'), name: 'pure fifth 3/2' },
              { id: 'mt', label: 'MEANTONE FIFTH ⁴√5', make: () => renderNotes([root, root * MEANTONE_FIFTH.numericRatio], 1.4, 'rich'), name: 'meantone fifth' },
            ],
            short: (c) => c.label.split(' ')[0],
          }),
        ]
      : []),
    ...(part === 'C'
      ? ([
          {
            kind: 'fader',
            id: 'fifth',
            label: 'FIFTH',
            value: lanePos(fifthCents, MIN, MAX),
            // 0.1 ¢ steps on the lane, and a gentle snap onto ⁴√5 (review
            // 2026-09-30): four fifths multiply the step to 0.4 ¢ on the
            // third, so 696.6 missed the 0.05 ¢ window by 0.09 ¢ and the lane
            // could not reach it at all. Within a quarter cent the value is
            // the exact generator — the rail's landmark rule, on a lane.
            onChange: (p) => setFifthCents(snapNear(laneVal(p, MIN, MAX, 0.1), MEANTONE_FIFTH.cents)),
            format: (p) => `${snapNear(laneVal(p, MIN, MAX, 0.1), MEANTONE_FIFTH.cents).toFixed(2)} ¢`,
            // Five keys on a 375 phone leave ~7 mono characters: "700.00 ¢" cropped.
            formatShort: (p) => `${snapNear(laneVal(p, MIN, MAX, 0.1), MEANTONE_FIFTH.cents).toFixed(1)}¢`,
            home: lanePos(700, MIN, MAX), // the equal fifth, where the part starts (double-tap = RESET)
          },
          { kind: 'action', id: 'showme', label: 'SHOW ME', onPress: () => setFifthCents(MEANTONE_FIFTH.cents) },
          playKey(ctx.player, 'play', '▶ C–E–G', () => renderNotes([root, hz(slider.third), hz(slider.g)], 2.2, 'rich'), `triad with fifth ${fifthCents.toFixed(2)} ¢`),
        ] as DockParam[])
      : []),
    ...(part === 'D'
      ? ([
          {
            kind: 'fader',
            id: 'notes',
            label: 'NOTES',
            value: (revealed - 1) / (MT.notes.length - 1),
            onChange: (p) => setRevealed(1 + Math.round(p * (MT.notes.length - 1))),
            format: (p) => {
              const n = 1 + Math.round(p * (MT.notes.length - 1));
              return `${n} of ${MT.notes.length} · ${MT.notes[n - 1].spelling}`;
            },
            formatShort: (p) => `${1 + Math.round(p * (MT.notes.length - 1))}/${MT.notes.length}`,
          },
          playKey(ctx.player, 'play', '▶ SCALE', () => renderSequence(MT.notes.slice(0, revealed).map((n) => hz(n.value.numericRatio)), 0.3, 'rich'), `meantone scale, ${revealed} note${revealed > 1 ? 's' : ''}`),
        ] as DockParam[])
      : []),
    ...(part === 'E'
      ? [
          playTray({
            player: ctx.player, last, setLast,
            clips: [
              { id: 'normal', label: 'NORMAL FIFTH G♯–D♯', make: () => renderNotes([gSharp, normalFifthFrom(gSharp)], 1.6, 'rich'), name: 'normal meantone fifth', blurb: `${wolf.normalFifthCents.toFixed(2)} ¢ — the fifth every other step of the chain uses.` },
              { id: 'wolf', label: 'WOLF G♯–E♭', make: () => renderNotes([gSharp, eFlatAbove], 1.6, 'rich'), name: 'wolf fifth', blurb: `${wolf.wolfCents.toFixed(2)} ¢ — ${wolf.widerThanNormalBy.toFixed(2)} ¢ wider than a normal fifth.` },
            ],
            short: (c) => c.label.split(' ')[0],
          }),
        ]
      : []),
    // ONE ■ STOP on every part (review 2026-09-30): a clip started in part B
    // or E kept sounding after a ride to A, where the dock had no stop — and
    // in full screen the footer's ■ STOP is off screen.
    stopKey(ctx.player),
  ];

  const caption: Record<Part, string> = {
    A: 'Two identical steps ×t from C reach the pure E 5/4 on the rail. Ride PART to move on when you have the whole tone.',
    B: 'Four identical fifths ×g, each folded, land on that same E. PLAY the pure fifth against the meantone fifth.',
    C: 'Ride FIFTH until the two compared harmonics meet — four fifths, two octaves down, on 5/4. The lane snaps gently near ⁴√5; SHOW ME lands it; double-tap the lane for 700 ¢.',
    D: 'Ride NOTES to reveal the scale one pitch at a time — each from the same tempered fifth, folded. ▶ SCALE plays what is revealed.',
    E: 'The chain E♭ … G♯ on the rail: eleven normal fifths and one closing interval between the two red notes. PLAY a normal fifth, then the wolf.',
  };

  return (
    <TuningRackLayout ctx={ctx} rack={{ size: 'M', initialParam: 'part', hideDragTag: true, bezel, stage, params }} caption={caption[part]}>
      <Lead>Quarter-comma meantone: narrow every fifth slightly so that selected major thirds become pure 5:4 — and see where the discrepancy goes instead.</Lead>
      <Body>Five short parts, in order: the whole tone, the fifth it implies, a slider to find that fifth yourself, the scale it builds, and the wolf that closes it.</Body>

      {part === 'A' ? (
        <>
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
        </>
      ) : null}

      {part === 'C' ? (
        <>
          <Prompt>Narrow the fifth until four fifths create a pure 5:4 major third.</Prompt>
          <Body>Reference marks: pure 3/2 at {PURE_FIFTH.cents.toFixed(2)} ¢ · equal at {ET_FIFTH.cents.toFixed(0)} ¢ · quarter-comma at {MEANTONE_FIFTH.cents.toFixed(2)} ¢. The lane runs {MIN}–{MAX} ¢.</Body>
          <Card tone="math">
            <MathLine>fifth = {fifthCents.toFixed(2)} ¢ → g = 2^({fifthCents.toFixed(2)}/1200) = {slider.g.toFixed(6)}</MathLine>
            <MathLine>four fifths: g⁴ = {Math.pow(slider.g, 4).toFixed(6)}</MathLine>
            <MathLine>÷ 4 (two octaves down): g⁴/4 = {slider.third.toFixed(6)} → {slider.thirdCents.toFixed(2)} ¢</MathLine>
            <MathLine emphasis>{exact ? 'g⁴/4 = 5/4 — the major third is pure' : `vs 5/4 at ${JUST_MAJOR_THIRD.cents.toFixed(2)} ¢: ${slider.err > 0 ? '+' : ''}${slider.err.toFixed(2)} ¢ ${slider.err > 0 ? 'wide' : 'narrow'}`}</MathLine>
          </Card>
          <DeviationMeter cents={slider.err} rangeCents={25} label="Major-third distance from 5/4" />
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
          <Body>Each pitch is generated from the same tempered fifth and then folded into one octave. {ctx.mathView ? `${MT.notes[revealed - 1].spelling} = ${MT.notes[revealed - 1].value.exactLabel} (${MT.notes[revealed - 1].value.constructionSource}).` : 'Switch to MATH (top right) for the exact radical forms.'}</Body>
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
          </Card>
          <Body>The discrepancy has not disappeared. This twelve-note layout concentrates it into the closing interval. Other chains and spellings put the wolf between other named notes — its location is a choice, not a law.</Body>
          <Body>Quarter-comma meantone narrows ordinary fifths so selected major thirds become pure. A finite twelve-note layout still contains a severe closing interval — and not every major third in every key is pure.</Body>
          {/* NEW COPY — targets "meantone makes every interval pure". */}
          <UnderstandingCheck
            question="In quarter-comma meantone, what is given up so that selected major thirds can be a pure 5/4?"
            options={['Every ordinary fifth is narrowed by about 5.4 ¢', 'The octave is stretched slightly wider than 2:1', 'Nothing — every interval in the system is pure', 'The major thirds are made wider than 5/4']}
            correct={0}
            explain={`Each ordinary fifth is narrowed by a quarter of the syntonic comma (≈ ${(PURE_FIFTH.cents - MEANTONE_FIFTH.cents).toFixed(2)} ¢) so that four of them reach a pure 5/4 — and one closing fifth, the wolf, absorbs what is left.`}
            wrong={[
              undefined,
              'The octave stays exactly 2:1 — every ÷2 in the derivation was exact. It is the FIFTH that is tempered.',
              `Look at the wolf: ${wolf.wolfCents.toFixed(2)} ¢. The discrepancy did not vanish — it was spread as narrow fifths and dumped into one closing interval.`,
              'Backwards — the thirds are the thing being made PURE (5/4). It is the fifths that move, and they move narrower.',
            ]}
          />
        </>
      ) : null}
    </TuningRackLayout>
  );
}

const styles = StyleSheet.create({
  chain: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20 },
  wolf: { color: colors.red, fontFamily: fonts.oswaldMedium, fontSize: 12.5, letterSpacing: 0.8, lineHeight: 18 },
});
