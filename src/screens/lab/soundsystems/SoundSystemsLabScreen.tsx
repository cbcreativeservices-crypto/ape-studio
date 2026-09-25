/**
 * Sound Systems Lab — the home hub (owner brief 2026-09-25).
 *
 * Five modes as cards, and beneath them the WHAT-IS-LEFT summary the owner
 * asked every lab to end with (2026-09-20): what is outstanding for credit,
 * with a link straight to it — never a congratulation for work not done.
 * Navigation is always free; credit is still earned, not given.
 *
 * Reads each mode's PagedLab progress (ape:<labId>:v1), the lab's own
 * progress store (faults, capstones, exercises) and the LEARN check's unit
 * in labCompletion. The page arrays are NOT imported here — the counts come
 * from units.ts — so the hub stays light.
 */
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BACK_HIT_SLOP } from '../../../components/backHitSlop';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { HelpKey } from '../../../components/HelpKey';
import { colors, fonts } from '../../../theme/tokens';
import { readingColumn } from '../../../theme/readingColumn';
import { confirmDialog } from '../../../lib/confirm';
import { loadPagedProgress, resetPagedProgress } from '../../../features/lab/pagedProgress';
import { useLabClearedUnits } from '../../../features/lab/labCompletion';
import { UNDERSTANDING_UNIT } from '../../../features/lab/understanding';
import { resetSoundSystemsProgress, useSoundSystemsProgress } from '../../../features/soundsystems/progress';
import { CAPSTONES } from '../../../features/soundsystems/capstones';
import { FAULTS } from '../../../features/soundsystems/faults';
import { SS_LEARN_ID, SS_MODES, SS_PAGE_COUNTS, type SsModeId } from './units';
import { GearGlyph, type GlyphKind } from './art/gearArt';

const MODE_GLYPH: Record<SsModeId, GlyphKind> = {
  learn: 'console',
  build: 'passiveSpeaker',
  route: 'stagebox',
  operate: 'amp',
  troubleshoot: 'vocalMic',
};

const ROUTE_EXERCISES = 8;
const OPERATE_EXERCISES = 5;

type Row = { id: SsModeId; label: string; done: number; total: number; hint: string };

export function SoundSystemsLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const progress = useSoundSystemsProgress();
  const learnUnits = useLabClearedUnits(SS_LEARN_ID);
  const [pages, setPages] = useState<Record<SsModeId, number>>({ learn: 0, build: 0, route: 0, operate: 0, troubleshoot: 0 });

  const refresh = useCallback(() => {
    let alive = true;
    void Promise.all(SS_MODES.map((m) => loadPagedProgress(m.labId))).then((all) => {
      if (!alive) return;
      const next = { learn: 0, build: 0, route: 0, operate: 0, troubleshoot: 0 } as Record<SsModeId, number>;
      SS_MODES.forEach((m, i) => {
        // Count only the mode's own pages — the appended check page is not one of them.
        next[m.id] = all[i].completed.filter((p) => p < SS_PAGE_COUNTS[m.id]).length;
      });
      setPages(next);
    });
    return () => {
      alive = false;
    };
  }, []);
  useFocusEffect(useCallback(() => refresh(), [refresh]));
  useEffect(() => refresh(), [refresh]);

  const checkPassed = learnUnits.has(UNDERSTANDING_UNIT);
  const rows: Row[] = [
    { id: 'learn', label: 'LEARN · chapter pages', done: pages.learn, total: SS_PAGE_COUNTS.learn, hint: 'Each page marks itself done when its goals are met.' },
    { id: 'build', label: 'BUILD · capstones passed', done: progress.capstones.length, total: CAPSTONES.length, hint: 'A capstone passes when every requirement on its checklist is met.' },
    { id: 'route', label: 'ROUTE · exercises', done: progress.route.length, total: ROUTE_EXERCISES, hint: 'Each console exercise completes when its goals are met.' },
    { id: 'operate', label: 'OPERATE · exercises', done: progress.operate.length, total: OPERATE_EXERCISES, hint: 'Power-up, line check, gain, soundcheck, shutdown.' },
    { id: 'troubleshoot', label: 'TROUBLESHOOT · faults solved', done: progress.faults.length, total: FAULTS.length, hint: `${progress.forward.length} solved with a source-forward walk.` },
  ];
  const outstanding = rows.filter((r) => r.done < r.total);
  const allDone = outstanding.length === 0 && checkPassed;

  const go = (route: string) => navigation.navigate(route as never);

  const reset = () => {
    confirmDialog('Reset this lab?', 'Clears your pages, capstones, exercises and solved faults for the Sound Systems Lab only.', 'Reset', () => {
      void Promise.all([...SS_MODES.map((m) => resetPagedProgress(m.labId)), resetSoundSystemsProgress()]).then(refresh);
    }, { destructive: true });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={BACK_HIT_SLOP} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>SOUND SYSTEMS LAB</Text>
          <Text style={styles.subtitle}>Live sound reinforcement — from an empty venue to a tuned, working system</Text>
        </View>
        <HelpKey search="lab" />
        <AccuracyNote compact />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, readingColumn, { paddingBottom: insets.bottom + 28 }]}>
        <Text style={styles.lead}>
          Begin with an empty venue. Finish having designed, wired, routed, tested, tuned and troubleshot a complete live sound reinforcement system. Five modes, in any order — LEARN teaches, the other four make you do it.
        </Text>

        {SS_MODES.map((m) => {
          const row = rows.find((r) => r.id === m.id)!;
          return (
            <Pressable key={m.id} onPress={() => go(m.route)} style={styles.card} accessibilityRole="button" accessibilityLabel={`${m.name} mode. ${m.blurb} ${row.done} of ${row.total} complete.`}>
              <View style={styles.cardGlyph}>
                <GearGlyph kind={MODE_GLYPH[m.id]} size={54} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>{m.title}</Text>
                  <Text style={[styles.cardCount, row.done >= row.total && { color: colors.green }]}>
                    {row.done}/{row.total}
                  </Text>
                </View>
                <Text style={styles.cardBlurb}>{m.blurb}</Text>
                <View style={styles.bar}>
                  <View style={[styles.barFill, { width: `${Math.round((row.done / row.total) * 100)}%` }]} />
                </View>
              </View>
              <Text style={styles.cardGo}>›</Text>
            </Pressable>
          );
        })}

        {/* WHAT IS LEFT — the lab's honest closing screen, always visible here. */}
        <View style={[styles.left, allDone && styles.leftDone]}>
          <Text style={styles.leftTitle}>{allDone ? 'SOUND SYSTEMS LAB — COMPLETE' : 'WHAT IS LEFT'}</Text>
          {allDone ? (
            <Text style={styles.leftLead}>
              Every chapter, capstone, exercise and fault — and the understanding check. You can design, wire, route, operate and troubleshoot a live sound reinforcement system, and you have shown it.
            </Text>
          ) : (
            <>
              <Text style={styles.leftLead}>
                Everything you have done is saved. Move through the lab in any order — this list is what still counts toward credit, and each row opens where you left off.
              </Text>
              {outstanding.map((r) => (
                <Pressable key={r.id} onPress={() => go(SS_MODES.find((m) => m.id === r.id)!.route)} style={styles.leftRow} accessibilityRole="button" accessibilityLabel={`${r.label}: ${r.done} of ${r.total}. ${r.hint}`}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leftLabel}>{r.label}</Text>
                    <Text style={styles.leftHint}>{r.hint}</Text>
                  </View>
                  <Text style={styles.leftCount}>
                    {r.done}/{r.total}
                  </Text>
                  <Text style={styles.cardGo}>›</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => go('SoundSystemsLearn')} style={[styles.leftRow, checkPassed && styles.leftRowDone]} accessibilityRole="button" accessibilityLabel={`Understanding check: ${checkPassed ? 'passed' : 'not yet passed'}`}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.leftLabel}>UNDERSTANDING CHECK · the last page of LEARN</Text>
                  <Text style={styles.leftHint}>{checkPassed ? 'Passed — the lab’s credit unit is banked.' : 'Every question correct, retry until you are. This is what completes the lab.'}</Text>
                </View>
                <Text style={[styles.leftCount, checkPassed && { color: colors.green }]}>{checkPassed ? '✓' : '—'}</Text>
                <Text style={styles.cardGo}>›</Text>
              </Pressable>
            </>
          )}
        </View>

        <Pressable onPress={reset} style={styles.resetRow} accessibilityRole="button" accessibilityLabel="Reset this lab's progress">
          <Text style={styles.resetText}>RESET LAB PROGRESS</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingTop: 10, gap: 12 },
  lead: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 22 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, borderColor: '#232329', borderTopColor: '#34343c', backgroundColor: '#101014', padding: 10, minHeight: 84 },
  cardGlyph: { width: 60, alignItems: 'center' },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitle: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6 },
  cardCount: { color: colors.textMuted, fontFamily: fonts.mono, fontSize: 12 },
  cardBlurb: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  bar: { height: 4, borderRadius: 2, backgroundColor: '#050609', overflow: 'hidden', marginTop: 3 },
  barFill: { height: '100%', backgroundColor: colors.green, borderRadius: 2 },
  cardGo: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 20 },
  left: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,198,77,.4)', backgroundColor: 'rgba(255,198,77,.05)', padding: 12, gap: 8, marginTop: 4 },
  leftDone: { borderColor: colors.green, backgroundColor: '#0f2416' },
  leftTitle: { color: colors.amberLabel, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.8 },
  leftLead: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  leftRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, borderTopWidth: 1, borderTopColor: colors.hairlineDim, paddingTop: 8 },
  leftRowDone: { opacity: 0.75 },
  leftLabel: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 0.8 },
  leftHint: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  leftCount: { color: colors.amber, fontFamily: fonts.mono, fontSize: 13 },
  resetRow: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  resetText: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
});
