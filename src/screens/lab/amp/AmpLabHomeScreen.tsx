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
import { confirmDialog } from '../../../lib/confirm';
import type { RootStackParamList } from '../../../navigation/types';
import { ModuleAccordionRow } from '../ModuleAccordionRow';
import { AMP_MODULES, type AmpModuleId } from '../../../features/amp/ampContent';
import { AMP_CHECK_UNIT, ampEndModel } from '../../../features/amp/ampEnd';
import { isAmpProgressUnreadable, resetAmpProgress, setAmpSaveBlocked, updateAmpProgress, type AmpProgressState } from '../../../features/amp/ampProgress';
import { ProgressLoadingNote, ProgressUnreadableNote } from '../kit/ProgressUnreadableNote';
import { LabEndLink, LabEndScreen, useLabEndGuest } from '../kit/LabEndScreen';
import { LabHeader } from '../kit/LabNavBar';
// Screen Guide (owner 2026-10-31): the header ⓘ explains the menu (and the what's-left view).
import { ScreenGuideHost } from '../../../features/lab/screenGuide';
import { AMP_END_GUIDE, AMP_HOME_GUIDE } from './ampScreenGuides';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { BUILT_MODULE_IDS } from './modules';
// Tablet (owner 2026-09-29): a page of rows/cards - capped at the card column
// and centred instead of stretching rows 990 pt wide. No-op on a phone.
import { cardColumn } from '../../../theme/readingColumn';
import { useWideOnTablet } from '../../../theme/useIsTablet';
import { TabletGrid } from '../../../components/TabletGrid';
import { safeGoBack } from '../../../lib/safeGoBack';
import { LabUnderstandingBlock } from '../../../components/LabUnderstandingBlock';
import { useLabClearedUnits, useLabCompletionUnreadable } from '../../../features/lab/labCompletion';
import { understandingFor } from '../../../features/lab/understanding';

export function AmpLabHomeScreen() {
  const insets = useSafeAreaInsets();
  // Tablet (owner iPad report 2026-10-06): the module list takes the iPad's
  // width in two columns. Phone: unchanged (`wide` is null, TabletGrid a
  // Fragment).
  const wide = useWideOnTablet();
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
  // THE CHECK IS A UNIT (D41 J2, owner 2026-11-01): the understanding check
  // completes this lab for certificates, so WHAT'S LEFT lists it last and LAB
  // COMPLETE never shows above an unpassed check. Banked record — a practice
  // run (RESET LAB PROGRESS) never clears it.
  const bankedUnits = useLabClearedUnits('amp');
  const completionUnreadable = useLabCompletionUnreadable();
  const hasCheck = !!understandingFor('amp');
  const endModel = ampEndModel(progress ?? { modules: {} }, built, hasCheck ? { passed: bankedUnits.has(AMP_CHECK_UNIT) } : undefined);
  // Either record unread = the end screen's note, never "all left" (D51).
  const endUnreadable = unreadable || (hasCheck && completionUnreadable);
  const doneCount = built.filter((m) => progress?.modules[m.id]?.done).length;
  const resumeTarget =
    (progress?.lastModule && BUILT_MODULE_IDS.includes(progress.lastModule) && !progress.modules[progress.lastModule]?.done
      ? progress.lastModule
      : built.find((m) => !progress?.modules[m.id]?.done)?.id) ?? built[0]?.id;

  const confirmReset = () => {
    // confirmDialog, not Alert.alert: RN-web's Alert is a no-op, so RESET was
    // a silent tap on the web preview (B-018/B-062).
    confirmDialog(
      'Start a fresh practice run?',
      'Starts a fresh practice run: clears your answered checks and your latest final attempt. Completed modules and your best final result are kept. Nothing else in the app is affected.',
      'Start over',
      () => {
        void resetAmpProgress().then(setProgress);
      },
      { destructive: true },
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      {/* Screen Guide (owner 2026-10-31): no Rack Unit on the menu, so no
          regions — the steps sit in a bottom card. */}
      <ScreenGuideHost regions={false} resetKey={ending ? 'end' : 'list'}>
      {/* The shared lab header (kit/LabNavBar, 2026-09-30): ‹ leaves the lab.
          The ⓘ explains the menu, or the what's-left view. The Amplifier
          Principles Lab is a CONCEPT lab — conceptual models with labeled
          teaching numbers, no live input, no real-world measurement — so the
          accuracy chip is gone and the ⓘ takes its spot (owner rule
          2026-10-31). The menu keeps its own lethal-voltage safety note. */}
      <LabHeader
        title="AMPLIFIER PRINCIPLES LAB"
        subtitle="From transistors and transformers to amplifier classes"
        guide={ending ? AMP_END_GUIDE : AMP_HOME_GUIDE}
        guideTitle={ending ? 'WHAT’S LEFT' : undefined}
      />
      {ending ? (
        <LabEndScreen
          labTitle="Amplifier Principles Lab"
          units={endModel.units}
          cleared={endModel.cleared}
          unreadable={endUnreadable}
          mode="progress"
          // The CHECK row stays here: the check is drawn on this screen (extra).
          onJump={(id) => { if (id !== AMP_CHECK_UNIT) open(id === 'final' ? 'apply' : (id as AmpModuleId)); }}
          // D41 K6: the CHECK row moves the screen to the check drawn here (extra).
          shownHereId={AMP_CHECK_UNIT}
          onPracticeAgain={() => open(built[0]?.id ?? AMP_MODULES[0].id)}
          onDone={() => safeGoBack(navigation)}
          bottomInset
          extra={<LabUnderstandingBlock labId="amp" labTitle="Amp Lab" />}
        />
      ) : (
      <ScrollView contentContainerStyle={[styles.scroll, cardColumn, wide, { paddingBottom: insets.bottom + 24 }]}>
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
          <Text style={styles.progressText}>{doneCount} {doneCount === 1 ? 'module' : 'modules'} complete</Text>
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
        <TabletGrid minTile={360} maxCols={2} gap={8}>
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
        </TabletGrid>
        {built.length < AMP_MODULES.length ? (
          <Text style={styles.note}>
            Modules {built.length + 1}–{AMP_MODULES.length} are on the bench.
          </Text>
        ) : null}
        {/* Certificate credit (owner 2026-10-13): the check renders only once
            questions are authored for this lab (trainingLabKeys UNDERSTANDING_LAB_IDS). */}
        <LabUnderstandingBlock labId="amp" labTitle="Amp Lab" />
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
      </ScreenGuideHost>
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
