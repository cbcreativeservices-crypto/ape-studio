/**
 * ExperimentWell — the guided experiment that opened this studio, PINNED at the
 * top of the well (owner 2026-09-17: "you go away, come back, then eventually
 * find the instructions, but then you go away again"). Two faults were behind
 * that sentence and both are fixed here:
 *
 *   1. The card used to be a child of the rack well, and in rack mode every
 *      child sits INSIDE the LAB NOTES collapsible, under the generic intro —
 *      so arriving from module 8 the steps were out of sight. It now renders
 *      through LabShell's `rack.wellTop`, above the caption and outside every
 *      disclosure (the same house rule the first-move caption follows).
 *   2. Running the series meant back → scroll module 8 → SET UP → back again,
 *      once per experiment. The card now carries the series itself: N / 17,
 *      PREV and NEXT replace the studio route in place (jumping studios when
 *      the next experiment lives in another one), so the whole run happens
 *      without leaving the instrument. Back still returns to module 8.
 *
 * Teaching order is unchanged: PREDICT first, steps as tick-off rows, LOOK FOR
 * only on reveal.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StackActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import { EXPERIMENTS, experimentRoute, type Experiment } from '../../../features/cymatics/presets';
import type { RootStackParamList } from '../../../navigation/types';

export function ExperimentWell({ experiment }: { experiment: Experiment }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [done, setDone] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState(true);
  const toggle = (i: number) => setDone((d) => (d.includes(i) ? d.filter((k) => k !== i) : [...d, i]));

  const index = EXPERIMENTS.findIndex((e) => e.id === experiment.id);
  const prev = index > 0 ? EXPERIMENTS[index - 1] : undefined;
  const next = index >= 0 && index < EXPERIMENTS.length - 1 ? EXPERIMENTS[index + 1] : undefined;
  // Replace, never push: the studio stays a single screen in the stack, so ‹
  // back always lands on the experiments list however far the learner ran.
  const go = (e: Experiment) => {
    const r = experimentRoute(e);
    setDone([]);
    setRevealed(false);
    setOpen(true);
    navigation.dispatch(StackActions.replace(r.route, r.params));
  };
  const where = (e: Experiment) => (e.studio === 'liquid' ? 'dish' : e.studio === 'membrane' ? 'drum' : 'plate');

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <Text style={styles.eyebrow}>EXPERIMENT {experiment.num} / {EXPERIMENTS.length}</Text>
        <Pressable onPress={() => setOpen((o) => !o)} hitSlop={8} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={open ? 'Fold the experiment steps' : 'Unfold the experiment steps'}>
          <Text style={styles.fold}>{open ? '▾ FOLD' : '▸ STEPS'}</Text>
        </Pressable>
      </View>
      <Text style={styles.title}>{experiment.title}</Text>
      {open ? (
        <>
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
        </>
      ) : null}
      {/* The series, in the instrument: run all seventeen without going back. */}
      <View style={styles.navRow}>
        <Pressable
          style={[styles.navBtn, !prev && styles.navBtnOff]}
          disabled={!prev}
          onPress={() => prev && go(prev)}
          accessibilityRole="button"
          accessibilityLabel={prev ? `Previous experiment: ${prev.title}, on the ${where(prev)}` : 'No previous experiment'}
        >
          <Text style={[styles.navText, !prev && styles.navTextOff]}>‹ PREV</Text>
        </Pressable>
        <Pressable style={styles.navBtn} onPress={() => navigation.navigate('CymaticsModule', { id: 'experiments' })} accessibilityRole="button" accessibilityLabel="Back to the list of all experiments">
          <Text style={styles.navText}>ALL 17</Text>
        </Pressable>
        <Pressable
          style={[styles.navBtn, styles.navNext, !next && styles.navBtnOff]}
          disabled={!next}
          onPress={() => next && go(next)}
          accessibilityRole="button"
          accessibilityLabel={next ? `Next experiment: ${next.title}, on the ${where(next)}` : 'No next experiment'}
        >
          <Text style={[styles.navText, styles.navNextText, !next && styles.navTextOff]}>
            {next ? (next.studio === experiment.studio ? 'NEXT ›' : `NEXT · ${where(next).toUpperCase()} ›`) : 'NEXT ›'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#15120a', padding: 12, gap: 8 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber },
  fold: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textSecondary },
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
  navRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  navBtn: { flex: 1, borderRadius: 8, borderWidth: 1, borderColor: '#3a3a44', paddingVertical: 9, alignItems: 'center' },
  navBtnOff: { opacity: 0.35 },
  navNext: { flex: 1.4, borderColor: 'rgba(255,198,77,.7)', backgroundColor: 'rgba(255,198,77,.10)' },
  navText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textSecondary },
  navNextText: { color: colors.amber },
  navTextOff: { color: colors.textSub },
});
