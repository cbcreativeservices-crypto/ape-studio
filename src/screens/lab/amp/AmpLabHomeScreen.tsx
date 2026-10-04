/**
 * AmpLabHomeScreen — Amplifier Principles Lab landing: the module map in the
 * lab hub-home accordion style, resume, completion state, and a confirmed
 * reset that touches only this lab's progress (spec Part 3 §11).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { confirmDialog } from '../../../lib/confirm';
import type { RootStackParamList } from '../../../navigation/types';
import { ModuleAccordionRow } from '../ModuleAccordionRow';
import { AMP_MODULES, type AmpModuleId } from '../../../features/amp/ampContent';
import { ampEndModel } from '../../../features/amp/ampEnd';
import { isAmpProgressUnreadable, resetAmpProgress, setAmpSaveBlocked, updateAmpProgress, type AmpProgressState } from '../../../features/amp/ampProgress';
import { ProgressLoadingNote, ProgressUnreadableNote } from '../kit/ProgressUnreadableNote';
import { LabEndLink, LabEndScreen, useLabEndGuest } from '../kit/LabEndScreen';
import { LabHeader } from '../kit/LabNavBar';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { BUILT_MODULE_IDS } from './modules';
// Tablet (owner 2026-09-29): a page of rows/cards - capped at the card column
// and centred instead of stretching rows 990 pt wide. No-op on a phone.
import { cardColumn } from '../../../theme/readingColumn';
import { safeGoBack } from '../../../lib/safeGoBack';

export function AmpLabHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [openId, setOpenId] = useState<string | null>(null);
  const [progress, setProgress] = useState<AmpProgressState | null>(null);
  // HOUSE GUEST RULE (bug hunt 2026-09-30 pass 2): a signed-out guest's
  // progress is neither restored nor written (see ampProgress).
  setAmpSaveBlocked(useLabEndGuest());

  // ⛔ WAIT FOR `resolved` (bug pass 3, 2026-09-30; the kit/PagedLab fix):
  // before the tier is known the save-block flag reads false, so a signed-out
  // device's first read restored the previous account's modules.
  const { resolved } = useEntitlement();
  const reload = useCallback(() => {
    if (!resolved) return;
    let alive = true;
    // Queued behind every pending write (bug pass 2026-10-01): a module's
    // MARK COMPLETE still saving when ‹ came back here read as not done.
    void updateAmpProgress(() => {}).then((s) => {
      if (alive) setProgress(s);
    });
    return () => {
      alive = false;
    };
  }, [resolved]);
  useFocusEffect(reload);

  /**
   * WHAT'S LEFT (owner 2026-10-02, "favor consistency"): the Meter hub's
   * SEE WHAT'S LEFT link, the same way — it swaps LabEndScreen in for the
   * list. The list is the one the module host's FINISH shows: the same
   * ape:amp:v1 read (queued behind every pending write), the same builder
   * (features/amp/ampEnd: modules + the final assessment, best result) and
   * the same progress mode. The end screen appears only once that read has
   * landed, so it never flashes an older state; a read still queued when the
   * learner opens a module (or leaves the hub) is fenced off — no setState
   * after unmount. PRACTISE AGAIN reopens Module 1 and clears nothing.
   */
  const [ending, setEndingRaw] = useState(false);
  const endReq = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      endReq.current++;
    };
  }, []);
  const setEnding = useCallback(
    (on: boolean) => {
      const my = ++endReq.current;
      if (!on) {
        setEndingRaw(false);
        return;
      }
      if (!resolved) return;
      void updateAmpProgress(() => {}).then((s) => {
        if (!mounted.current || my !== endReq.current) return;
        setProgress(s);
        setEndingRaw(true);
      });
    },
    [resolved],
  );
  const open = (id: AmpModuleId) => {
    setEnding(false);
    navigation.navigate('AmpModule', { id });
  };

  // THREE FACES (owner 2026-10-03, "do 2"; D51): still reading → a quiet
  // line, never "0 of N modules complete"; the read FAILED → the shared note
  // where the count would be, never "not started"; only a read that landed
  // says how many are done. The module map stays open either way.
  const unreadable = !!progress && isAmpProgressUnreadable(progress);
  const built = AMP_MODULES.filter((m) => BUILT_MODULE_IDS.includes(m.id));
  const endModel = ampEndModel(progress ?? { modules: {} }, built);
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
      'Starts a fresh practice run: clears your answered checks and your latest final attempt. Completed modules and your best final result are kept. Nothing else in the app is affected.',
      'Reset',
      () => {
        void resetAmpProgress().then(setProgress);
      },
      { destructive: true },
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      {/* The shared lab header (kit/LabNavBar, 2026-09-30): ‹ leaves the lab.
          Standing rule: every lab steers the user to a dedicated CALIBRATED
          instrument for real measurement — this app teaches, and the phone's
          mic and audio path are uncalibrated. Added 2026-09-17 after a
          bug-hunt pass found this lab had no note at all. */}
      <LabHeader title="AMPLIFIER PRINCIPLES LAB" subtitle="From transistors and transformers to amplifier classes" right={<AccuracyNote compact />} />
      {ending ? (
        <LabEndScreen
          labTitle="Amplifier Principles Lab"
          units={endModel.units}
          cleared={endModel.cleared}
          unreadable={unreadable}
          mode="progress"
          onJump={(id) => open(id === 'final' ? 'apply' : (id as AmpModuleId))}
          onPracticeAgain={() => open(built[0]?.id ?? AMP_MODULES[0].id)}
          onDone={() => safeGoBack(navigation)}
          bottomInset
        />
      ) : (
      <ScrollView contentContainerStyle={[styles.scroll, cardColumn, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.body}>
          One question runs through every module: what is the amplifier doing, what load does it see, and
          where does the extra output energy come from? Every screen answers it with a live, synchronized
          model you can push, break, and fix.
        </Text>
        {unreadable ? (
          <ProgressUnreadableNote />
        ) : !progress ? (
          <ProgressLoadingNote />
        ) : (
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{doneCount} of {built.length} modules complete</Text>
          {progress?.final ? (
            <Text style={[styles.progressText, { color: progress.final.passed ? colors.green : colors.gold }]}>
              Final: {Math.round(progress.final.scorePct)}%
            </Text>
          ) : null}
        </View>
        )}
        {resumeTarget ? (
          <Pressable
            style={styles.resumeBtn}
            onPress={() => navigation.navigate('AmpModule', { id: resumeTarget })}
            accessibilityRole="button"
            accessibilityLabel={`${doneCount ? 'Resume' : unreadable ? 'Open' : 'Start'} at module ${AMP_MODULES.find((m) => m.id === resumeTarget)?.num}`}
          >
            <Text style={styles.resumeText}>
              {doneCount ? 'RESUME' : unreadable ? 'OPEN' : 'START'} · MODULE {AMP_MODULES.find((m) => m.id === resumeTarget)?.num} ›
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
        <LabEndLink label="SEE WHAT’S LEFT ›" onPress={() => setEnding(true)} />

        <Text style={styles.safety}>
          ⚠ Amplifiers and their power supplies can contain lethal voltage, and capacitors can stay charged
          after power is removed. This lab teaches operating principles — it is not a repair or construction
          guide. Leave servicing to qualified technicians.
        </Text>

        <Pressable onPress={confirmReset} style={styles.resetBtn} accessibilityRole="button" accessibilityLabel="Reset this lab's progress">
          <Text style={styles.resetText}>RESET LAB PROGRESS</Text>
        </Pressable>
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  // header / back / title / subtitle now live in kit/LabNavBar's LabHeader.
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
