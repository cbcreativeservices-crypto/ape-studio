/**
 * ExperimentWell — the guided experiment that opened this studio, kept in the
 * well (learning pass 2026-09-17, findings D3 + D4). Before this the learner
 * read the steps on the experiments card, tapped SET UP, and landed in the
 * studio with nothing to follow; and LOOK FOR gave the answer before the
 * observation. Now: PREDICT first (commit to an expectation), the steps as
 * tick-off rows, and LOOK FOR only on reveal — prediction, then check.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { Experiment } from '../../../features/cymatics/presets';

export function ExperimentWell({ experiment }: { experiment: Experiment }) {
  const [done, setDone] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const toggle = (i: number) => setDone((d) => (d.includes(i) ? d.filter((k) => k !== i) : [...d, i]));
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>EXPERIMENT {experiment.num}</Text>
      <Text style={styles.title}>{experiment.title}</Text>
      <Text style={styles.goal}>{experiment.goal}</Text>
      {experiment.predict ? (
        <View style={styles.predict}>
          <Text style={styles.predictHead}>PREDICT FIRST</Text>
          <Text style={styles.predictBody}>{experiment.predict}</Text>
        </View>
      ) : null}
      {experiment.steps.map((s, i) => {
        const on = done.includes(i);
        return (
          <Pressable key={i} onPress={() => toggle(i)} style={styles.step} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`Step ${i + 1}: ${s}`}>
            <Text style={[styles.box, on && styles.boxOn]}>{on ? '✓' : `${i + 1}`}</Text>
            <Text style={[styles.stepText, on && styles.stepDone]}>{s}</Text>
          </Pressable>
        );
      })}
      {revealed ? (
        <Text style={styles.lookFor}>
          <Text style={styles.lookForHead}>LOOK FOR · </Text>
          {experiment.lookFor}
        </Text>
      ) : (
        <Pressable onPress={() => setRevealed(true)} style={styles.reveal} accessibilityRole="button" accessibilityLabel="Reveal what to look for">
          <Text style={styles.revealText}>REVEAL LOOK FOR ›</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#15120a', padding: 12, gap: 8 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 16, color: colors.textPrimary, marginTop: -4 },
  goal: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  predict: { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(127,212,255,.5)', backgroundColor: '#0a1520', padding: 10, gap: 3 },
  predictHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: '#7fd4ff' },
  predictBody: { fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  step: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', minHeight: 32 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: '#3a3a44', textAlign: 'center', lineHeight: 22, fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amber },
  boxOn: { backgroundColor: 'rgba(55,224,95,.18)', borderColor: '#37e05f', color: '#37e05f' },
  stepText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  stepDone: { color: colors.textSub },
  reveal: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, borderColor: '#3a3a44', paddingHorizontal: 12, paddingVertical: 7 },
  revealText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.amber },
  lookFor: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  lookForHead: { fontFamily: fonts.oswaldSemiBold, color: colors.amber },
});
