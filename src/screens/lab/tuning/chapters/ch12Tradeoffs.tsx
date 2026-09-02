/**
 * Chapter 12 — Tradeoffs, Musical Use, and Misconceptions (spec Stage 4):
 * each system as a design choice (no rankings), the nine misconception
 * cards, and where these ideas meet professional audio.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { TUNING_SYSTEMS, type TuningSystemId } from '../../../../features/tuning/tuningMath';
import type { ChapterProps } from '../labCtx';
import { Body, Btn, Card, Eyebrow, Lead } from '../components/primitives';
// (Body is now also used for the up-front misconception instruction.)

const POINTS: Record<TuningSystemId, string[]> = {
  pythagorean: ['Built from powers of 2 and 3', 'Prioritizes pure 3:2 fifths', 'Produces wide major thirds (81/64)', 'Twelve fifths do not close against seven octaves'],
  just: ['Uses selected small whole-number ratios', 'Produces exact selected intervals', 'A fixed mapping cannot preserve every desired ratio in every key', 'Pitch assignments may change with tonal context'],
  meantone: ['Narrows ordinary fifths by a quarter of the syntonic comma', 'Creates selected pure 5:4 major thirds', 'Produces unequal key behavior', 'Contains a wolf interval in the selected twelve-note chain'],
  equal: ['Uses twelve identical ratios per octave', 'Keeps interval patterns consistent in every key', 'Keeps the octave exact', 'Slightly tempers fifths (−1.96 ¢) and major thirds (+13.69 ¢)'],
};

const MYTHS: { statement: string; correction: string }[] = [
  { statement: 'A note name always has one frequency.', correction: 'Frequency depends on octave, reference pitch, tuning system, and sometimes musical context.' },
  { statement: 'Equal semitones mean equal Hz differences.', correction: 'They use equal frequency ratios and equal 100-cent steps.' },
  { statement: 'The Pythagorean comma is rounding error.', correction: 'It is the exact mismatch between twelve 3:2 fifths and seven 2:1 octaves.' },
  { statement: 'Just Intonation is one universal scale.', correction: 'Many just mappings exist, and desired ratios can depend on tonal context.' },
  { statement: 'Quarter-comma meantone makes every interval pure.', correction: 'It prioritizes selected pure major thirds by narrowing fifths and creating a wolf interval elsewhere.' },
  { statement: 'Well temperament and equal temperament are identical.', correction: 'Well temperaments use unequal interval patterns while making all keys usable. Equal temperament makes every semitone ratio identical.' },
  { statement: 'A4 = 440 Hz is a law of nature.', correction: 'It is a widely used reference convention.' },
  { statement: 'Predicted beating is equally audible on every instrument.', correction: 'The relevant partials must be present and strong enough to hear.' },
  { statement: 'Western twelve-note tuning represents all musical tuning.', correction: 'Many cultures and contemporary practices use other pitch organizations.' },
];

const PRO: [string, string][] = [
  ['Pitch correction', 'a correction target is a tuning choice — equal-tempered by default, but not the only option'],
  ['Synthesizer tuning tables', 'many synths and software instruments load alternative scales per note'],
  ['Software instruments and sample libraries', 'samples carry the tuning they were recorded in; retuning changes ratios, not just pitch'],
  ['Choir and ensemble recording', 'singers and strings drift toward pure thirds and fifths against a fixed-pitch accompaniment — a real mixing consideration'],
  ['Historical instruments', 'period keyboards are often tuned in meantone or well temperaments; keys sound different on purpose'],
  ['MIDI and per-note pitch control', 'MIDI Tuning Standard and per-note pitch bend make non-equal tunings playable'],
  ['Piano tuning', 'acoustic pianos may use octave stretch because string inharmonicity affects perceived octave alignment'],
];

/** Cards the learner must open before UNDERSTOOD lights up — passive reading
 *  of nine corrections is not retrieval; opening at least three is a small,
 *  honest floor (completion policy: finish, not perfect). */
const MIN_OPENED = 3;

export function Ch12Tradeoffs({ ctx }: ChapterProps) {
  const [open, setOpen] = useState<number | null>(null);
  const [opened, setOpened] = useState<Set<number>>(() => new Set());
  const toggle = (i: number) => {
    setOpen(open === i ? null : i);
    setOpened((s) => (s.has(i) ? s : new Set(s).add(i)));
  };
  const enough = opened.size >= MIN_OPENED;
  return (
    <View style={{ gap: 12 }}>
      <Lead>Each system is a design choice about what to preserve and where to put the mismatch — not a winner.</Lead>
      {(Object.keys(TUNING_SYSTEMS) as TuningSystemId[]).map((id) => (
        <Card key={id}>
          <Eyebrow>{TUNING_SYSTEMS[id].name.toUpperCase()}</Eyebrow>
          <Text style={styles.rule}>{TUNING_SYSTEMS[id].rule}</Text>
          {POINTS[id].map((p) => <Text key={p} style={styles.point}>• {p}</Text>)}
        </Card>
      ))}
      <Eyebrow>MISCONCEPTIONS</Eyebrow>
      {/* NEW COPY — instruction stated up front, not hidden inside the cards. */}
      <Body>Nine claims people make about tuning. Decide whether each is true before you open it — then tap to read the correction. Open at least {MIN_OPENED} to finish this chapter.</Body>
      {MYTHS.map((m, i) => (
        <Pressable key={i} onPress={() => toggle(i)} style={[styles.myth, opened.has(i) && styles.mythSeen]} accessibilityRole="button" accessibilityState={{ expanded: open === i }} accessibilityLabel={`Misconception: ${m.statement}`} accessibilityHint={open === i ? 'Collapses the correction' : 'Reveals the correction'}>
          <Text style={styles.mythStatement}>“{m.statement}”</Text>
          {open === i ? <Text style={styles.mythFix}>{m.correction}</Text> : <Text style={styles.tap}>{opened.has(i) ? 'seen · tap to reread ▸' : 'tap for the correction ▸'}</Text>}
        </Pressable>
      ))}
      <Text style={styles.count} accessibilityLiveRegion="polite">{opened.size} of {MYTHS.length} corrections opened{enough ? '' : ` · open ${MIN_OPENED - opened.size} more to finish`}</Text>
      <Eyebrow>WHERE THIS MEETS PROFESSIONAL AUDIO</Eyebrow>
      <Card>
        {PRO.map(([t, d]) => (
          <Text key={t} style={styles.point}><Text style={{ color: colors.textPrimary, fontFamily: fonts.barlowMedium }}>{t}</Text> — {d}</Text>
        ))}
      </Card>
      <Body>This lab examined several influential Western tuning approaches. It is not a complete history of tuning and does not represent every musical culture or pitch system.</Body>
      {!ctx.isDone ? <Btn label="UNDERSTOOD ›" tone="primary" onPress={ctx.markDone} disabled={!enough} a11y={enough ? 'Understood: complete this chapter' : `Open ${MIN_OPENED - opened.size} more corrections to enable`} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rule: { color: colors.gold, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  point: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  myth: { borderRadius: 12, borderWidth: 1, borderColor: colors.steelBorder, backgroundColor: '#15121a', padding: 12, gap: 4, minHeight: 44 },
  mythSeen: { borderColor: colors.hairline, backgroundColor: '#111114' },
  mythStatement: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, fontStyle: 'italic' },
  mythFix: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  tap: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11.5 },
  count: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1 },
});
