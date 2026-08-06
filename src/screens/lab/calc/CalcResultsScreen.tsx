/**
 * CalcResultsScreen — Saved Workflow Results (Phase 4, owner spec 2026-08-06).
 *
 * Reopens a completed run's stored summary WITHOUT recalculating anything —
 * every number shown is exactly what was saved (inputs with sources, results
 * with the step that produced them, warnings, notes). Share re-uses the same
 * formatted-text layout the runner shares.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import type { SavedRunSummary } from './workflowModel';
import { workflowStore } from './workflowStore';
import * as shareImage from './shareImage';
import { buildReportFromSummary, reportToText } from './calcReport';
import { ReportCard } from './ReportCard';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** The shared formatted-text layout — now the professional report (owner spec
 *  2026-08-06). Kept as `summaryToText` so the runner's call site is unchanged. */
export function summaryToText(s: SavedRunSummary): string {
  return reportToText(buildReportFromSummary(s));
}

export function CalcResultsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [results, setResults] = useState<SavedRunSummary[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  // Only one card expands at a time, so one capture ref serves them all.
  const shareRef = useRef<View | null>(null);

  const shareAsImage = async () => {
    const ok = await shareImage.captureAndShare(shareRef.current, 'Workflow results');
    if (!ok) {
      Alert.alert('Image sharing unavailable', 'Sharing as an image needs the next app build. SHARE AS TEXT works now.');
    }
  };

  const reload = useCallback(() => {
    void workflowStore.listResults().then(setResults);
  }, []);
  useEffect(reload, [reload]);

  const remove = (r: SavedRunSummary) => {
    Alert.alert('Delete result?', `The saved result for “${r.workflowName}” will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void workflowStore.deleteResult(r.id).then(reload) },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>SAVED RESULTS</Text>
          <Text style={styles.subtitle}>Completed workflow runs — stored, never recalculated</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {results.length === 0 ? (
          <Text style={styles.caption}>
            Nothing saved yet — finish a workflow run and tap SAVE RESULT on its summary.
          </Text>
        ) : (
          results.map((r) => {
            const open = openId === r.id;
            return (
              <View key={r.id} style={styles.card}>
                <Pressable
                  onPress={() => setOpenId(open ? null : r.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  accessibilityLabel={`${r.workflowName}, ${new Date(r.completedAt).toLocaleDateString()}`}
                >
                  <View style={styles.cardHead}>
                    <Text style={styles.cardName}>{open ? '▾ ' : '▸ '}{r.workflowName}</Text>
                    <Text style={styles.cardDate}>{new Date(r.completedAt).toLocaleDateString()}</Text>
                  </View>
                  {r.projectName ? <Text style={styles.caption}>Project: {r.projectName}</Text> : null}
                </Pressable>

                {open ? (
                  <>
                    {/* Shared professional report card — captured for SHARE AS
                        IMAGE; every interactive control stays outside it. */}
                    <ReportCard ref={shareRef} report={buildReportFromSummary(r)} />
                    <View style={styles.actionRow}>
                      <ActionBtn label="SHARE AS TEXT" onPress={() => Share.share({ message: summaryToText(r) }).catch(() => {})} />
                      {shareImage.isAvailable() ? <ActionBtn label="SHARE AS IMAGE" onPress={() => void shareAsImage()} /> : null}
                      <ActionBtn label="DELETE" destructive onPress={() => remove(r)} />
                    </View>
                  </>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function ActionBtn({ label, onPress, destructive }: { label: string; onPress: () => void; destructive?: boolean }) {
  return (
    <Pressable style={[styles.actionBtn, destructive && styles.actionBtnDanger]} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={[styles.actionText, destructive && styles.actionTextDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 34, gap: 10 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardName: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 15, letterSpacing: 0.4, color: colors.textPrimary },
  cardDate: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.amber, marginTop: 4 },
  // Branded capture card — solid background so the PNG isn't transparent.
  shareCard: { backgroundColor: '#131316', gap: 8, paddingVertical: 4 },
  brandHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2, color: colors.amber, textAlign: 'center' },
  brandSub: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub, textAlign: 'center', marginTop: -2 },
  sumRow: { flexDirection: 'row', gap: 10, borderRadius: 8, borderWidth: 1, borderColor: '#1f1f24', backgroundColor: '#101014', padding: 10 },
  sumLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.8, color: colors.textSecondary, width: 120 },
  sumValue: { fontFamily: fonts.mono, fontSize: 14, color: colors.textPrimary },
  sumResult: { fontFamily: fonts.oswaldMedium, fontSize: 16, color: colors.amber },
  srcLabel: { fontFamily: fonts.barlowRegular, fontSize: 12, color: '#7fa8ff' },
  sumWarn: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.amber },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  actionBtn: { borderRadius: 8, borderWidth: 1, borderColor: '#3a3a3a', backgroundColor: '#161616', paddingHorizontal: 12, paddingVertical: 9 },
  actionBtnDanger: { borderColor: 'rgba(255,75,58,.5)', backgroundColor: '#1c0f0d' },
  actionText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.textSecondary },
  actionTextDanger: { color: '#ff8d7a' },
});
