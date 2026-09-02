/**
 * AmpModuleScreen — the generic module shell (spec Part 2 preamble): objective
 * → the module's own explanation + interactions → knowledge checks →
 * takeaway → complete & continue. Progress (visited/done/checks) persists to
 * ape:amp:v1; nothing per-frame is ever stored.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { AMP_MODULES, ampModuleById, checksForModule } from '../../../features/amp/ampContent';
import {
  emptyAmpModule, loadAmpProgress, saveAmpProgress, type AmpProgressState,
} from '../../../features/amp/ampProgress';
import { AMP_MODULE_COMPONENTS, BUILT_MODULE_IDS } from './modules';
import { CheckCard, SectionTitle, TakeawayCard } from './kit';

export function AmpModuleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AmpModule'>>();
  const mod = ampModuleById(route.params.id);
  const Component = AMP_MODULE_COMPONENTS[mod.id];
  const stateRef = useRef<AmpProgressState | null>(null);
  const [checksAnswered, setChecksAnswered] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  const checks = checksForModule(mod.id);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await loadAmpProgress();
      if (!alive) return;
      const m = s.modules[mod.id] ?? emptyAmpModule();
      s.modules[mod.id] = { ...m, visited: true };
      s.lastModule = mod.id;
      stateRef.current = s;
      setDone(m.done);
      setChecksAnswered(m.checks);
      setFinalSubmitted(!!s.final);
      void saveAmpProgress(s);
    })();
    return () => {
      alive = false;
    };
  }, [mod.id]);

  const onCheck = useCallback(
    (id: string, correct: boolean) => {
      const s = stateRef.current;
      if (!s) return;
      const m = s.modules[mod.id] ?? emptyAmpModule();
      m.checks = { ...m.checks, [id]: correct };
      s.modules[mod.id] = m;
      setChecksAnswered(m.checks);
      void saveAmpProgress(s);
    },
    [mod.id],
  );

  // The last module completes only after the final assessment is submitted
  // (spec Part 3 §11); every other module after its checks.
  const needsFinal = mod.id === 'apply' && !finalSubmitted;
  const allChecksAnswered = checks.every((c) => c.id in checksAnswered) && !needsFinal;

  const complete = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    const m = s.modules[mod.id] ?? emptyAmpModule();
    s.modules[mod.id] = { ...m, done: true };
    void saveAmpProgress(s);
    setDone(true);
    const idx = AMP_MODULES.findIndex((x) => x.id === mod.id);
    const next = AMP_MODULES.slice(idx + 1).find((x) => BUILT_MODULE_IDS.includes(x.id));
    if (next) navigation.replace('AmpModule', { id: next.id });
    else navigation.goBack();
  }, [mod.id, navigation]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back to the lab home">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{mod.title.toUpperCase()}</Text>
          <Text style={styles.subtitle}>Module {mod.num} of {AMP_MODULES.length}{done ? ' · completed' : ''}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.objective}>
          <Text style={styles.objectiveLabel}>OBJECTIVE</Text>
          <Text style={styles.objectiveText}>{mod.objective}</Text>
        </View>

        {Component ? (
          <Component
            onFinalSubmitted={() => {
              setFinalSubmitted(true);
              // Module 8 saved the result itself; refresh our copy so the
              // completion write below does not clobber it.
              void loadAmpProgress().then((s) => {
                stateRef.current = s;
              });
            }}
          />
        ) : (
          <Text style={styles.missing}>This module is not available.</Text>
        )}

        {checks.length ? (
          <>
            <SectionTitle>CHECK YOURSELF</SectionTitle>
            {checks.map((c) => (
              <CheckCard key={c.id} check={c} onAnswered={(ok) => onCheck(c.id, ok)} />
            ))}
          </>
        ) : null}

        <TakeawayCard>{mod.takeaway}</TakeawayCard>

        <Pressable
          style={[styles.completeBtn, !allChecksAnswered && styles.completeBtnDim]}
          onPress={complete}
          disabled={!allChecksAnswered}
          accessibilityRole="button"
          accessibilityState={{ disabled: !allChecksAnswered }}
          accessibilityLabel={allChecksAnswered ? 'Mark module complete and continue' : 'Answer every check above to continue'}
        >
          <Text style={styles.completeText}>{done ? 'CONTINUE ›' : 'MARK COMPLETE & CONTINUE ›'}</Text>
        </Pressable>
        {!allChecksAnswered ? (
          <Text style={styles.requirement}>
            {needsFinal
              ? 'Submit the final assessment above to complete the lab.'
              : `Answer the ${checks.length} check${checks.length > 1 ? 's' : ''} above to continue — a wrong pick is fine, the explanation is the point.`}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  back: { color: colors.textPrimary, fontSize: 30, lineHeight: 32, paddingHorizontal: 4 },
  title: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1 },
  subtitle: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5 },
  scroll: { paddingHorizontal: 16, gap: 10 },
  objective: { borderLeftWidth: 2, borderLeftColor: colors.amberLabel, paddingLeft: 10, gap: 2 },
  objectiveLabel: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 2 },
  objectiveText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  missing: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 13 },
  completeBtn: {
    marginTop: 8, minHeight: 50, borderRadius: 12, backgroundColor: '#173021', borderWidth: 1, borderColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
  completeBtnDim: { opacity: 0.45 },
  completeText: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.5 },
  requirement: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, textAlign: 'center' },
});
