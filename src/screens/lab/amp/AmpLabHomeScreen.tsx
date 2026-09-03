/**
 * AmpLabHomeScreen — Amplifier Principles Lab landing: the module map in the
 * lab hub-home accordion style, resume, completion state, and a confirmed
 * reset that touches only this lab's progress (spec Part 3 §11).
 */
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import { confirmDialog } from '../../../lib/confirm';
import type { RootStackParamList } from '../../../navigation/types';
import { ModuleAccordionRow } from '../ModuleAccordionRow';
import { AMP_MODULES } from '../../../features/amp/ampContent';
import { loadAmpProgress, resetAmpProgress, type AmpProgressState } from '../../../features/amp/ampProgress';
import { BUILT_MODULE_IDS } from './modules';

export function AmpLabHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [openId, setOpenId] = useState<string | null>(null);
  const [progress, setProgress] = useState<AmpProgressState | null>(null);

  const reload = useCallback(() => {
    let alive = true;
    void loadAmpProgress().then((s) => {
      if (alive) setProgress(s);
    });
    return () => {
      alive = false;
    };
  }, []);
  useFocusEffect(reload);

  const built = AMP_MODULES.filter((m) => BUILT_MODULE_IDS.includes(m.id));
  const doneCount = built.filter((m) => progress?.modules[m.id]?.done).length;
  const resumeTarget =
    (progress?.lastModule && BUILT_MODULE_IDS.includes(progress.lastModule) && !progress.modules[progress.lastModule]?.done
      ? progress.lastModule
      : built.find((m) => !progress?.modules[m.id]?.done)?.id) ?? built[0]?.id;

  const confirmReset = () => {
    // confirmDialog, not Alert.alert: RN-web's Alert is a no-op, so RESET was
    // a silent tap on the web preview (B-018/B-062).
    confirmDialog(
      'Reset this lab?',
      'Clears your Amplifier Principles progress, checks, and final result. Nothing else in the app is affected.',
      'Reset',
      () => {
        void resetAmpProgress().then(() => setProgress({ modules: {} }));
      },
      { destructive: true },
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>AMPLIFIER PRINCIPLES LAB</Text>
          <Text style={styles.subtitle}>From transistors and transformers to amplifier classes</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.body}>
          One question runs through every module: what is the amplifier doing, what load does it see, and
          where does the extra output energy come from? Every screen answers it with a live, synchronized
          model you can push, break, and fix.
        </Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{doneCount} of {built.length} modules complete</Text>
          {progress?.final ? (
            <Text style={[styles.progressText, { color: progress.final.passed ? colors.green : colors.gold }]}>
              Final: {Math.round(progress.final.scorePct)}%
            </Text>
          ) : null}
        </View>
        {resumeTarget ? (
          <Pressable
            style={styles.resumeBtn}
            onPress={() => navigation.navigate('AmpModule', { id: resumeTarget })}
            accessibilityRole="button"
            accessibilityLabel={`${doneCount ? 'Resume' : 'Start'} at module ${AMP_MODULES.find((m) => m.id === resumeTarget)?.num}`}
          >
            <Text style={styles.resumeText}>
              {doneCount ? 'RESUME' : 'START'} · MODULE {AMP_MODULES.find((m) => m.id === resumeTarget)?.num} ›
            </Text>
          </Pressable>
        ) : null}

        <Text style={styles.sectionTitle}>MODULE MAP</Text>
        {built.map((m) => (
          <ModuleAccordionRow
            key={m.id}
            num={m.num}
            name={m.title}
            blurb={m.blurb}
            expanded={openId === m.id}
            done={!!progress?.modules[m.id]?.done}
            onToggle={() => setOpenId(openId === m.id ? null : m.id)}
            onOpen={() => navigation.navigate('AmpModule', { id: m.id })}
          />
        ))}
        {built.length < AMP_MODULES.length ? (
          <Text style={styles.note}>
            Modules {built.length + 1}–{AMP_MODULES.length} are on the bench.
          </Text>
        ) : null}

        <Text style={styles.safety}>
          ⚠ Amplifiers and their power supplies can contain lethal voltage, and capacitors can stay charged
          after power is removed. This lab teaches operating principles — it is not a repair or construction
          guide. Leave servicing to qualified technicians.
        </Text>

        <Pressable onPress={confirmReset} style={styles.resetBtn} accessibilityRole="button" accessibilityLabel="Reset this lab's progress">
          <Text style={styles.resetText}>RESET LAB PROGRESS</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  back: { color: colors.textPrimary, fontSize: 30, lineHeight: 32, paddingHorizontal: 4 },
  title: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1.2 },
  subtitle: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5 },
  scroll: { paddingHorizontal: 16, gap: 10 },
  body: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  resumeBtn: {
    minHeight: 48, borderRadius: 12, backgroundColor: '#173021', borderWidth: 1, borderColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
  resumeText: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.5 },
  sectionTitle: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 2, marginTop: 8 },
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
  safety: {
    color: colors.gold, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, marginTop: 8,
    borderWidth: 1, borderColor: '#4a3a12', borderRadius: 10, padding: 10, backgroundColor: '#1a160c',
  },
  resetBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  resetText: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.5 },
});
