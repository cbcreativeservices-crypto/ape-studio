/**
 * Award Progress — the earn path for one certificate or program (R6b, A4).
 *
 * Three states, driven entirely by server data:
 *   1. In progress   → required-topic checklist, exam button disabled
 *   2. All complete  → "Take Final Exam" opens the capstone
 *   3. Earned        → credential panel; the exam button is gone
 *
 * The required set comes from award_required_topics, which already merges the
 * four universal standing requirements (Safety, Grounding, Workplace Skills,
 * Audio Fundamentals Lab) into the award's own topics — this screen must not
 * add them again.
 *
 * The unlock shown here is a convenience only. start_final_exam re-checks
 * entitlement, completion and lockout server-side, so a stale screen can never
 * grant an exam it shouldn't.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StudioButton } from '../../components/StudioButton';
import { colors, fonts } from '../../theme/tokens';
import { fetchAwardProgress, type AwardProgress } from '../../features/awards/api';
import {
  exportCertificate,
  isAvailable as certificateExportAvailable,
} from '../../features/credentials/certificatePdf';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AwardProgress'>;

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
}

export function AwardProgressScreen({ navigation, route }: Props) {
  const { awardType, awardId, awardName } = route.params;
  const insets = useSafeAreaInsets();

  const [progress, setProgress] = useState<AwardProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  // Certificate export (owner-approved 2026-08-29). Declared here with the other
  // hooks — ABOVE the loading/error early returns — so hook order is stable.
  const [exporting, setExporting] = useState(false);
  const [certMessage, setCertMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFailed(false);
    const p = await fetchAwardProgress(awardType, awardId);
    if (p == null) setFailed(true);
    setProgress(p);
  }, [awardType, awardId]);

  const onExportCertificate = useCallback(async () => {
    const cred = progress?.credential ?? null;
    setCertMessage(null);
    setExporting(true);
    const res = await exportCertificate({
      credentialName: awardName,
      awardType,
      earnedAt: cred?.issuedAt ?? cred?.earnedAt ?? null,
    });
    setExporting(false);
    if (res.ok) return;
    setCertMessage(
      res.reason === 'needs_build'
        ? 'Certificate download needs the next app build.'
        : res.reason === 'no_share_target'
          ? 'No app on this device can open a PDF.'
          : 'Could not prepare the certificate. Try again.',
    );
  }, [awardName, awardType, progress]);

  // Reload on focus so returning from a topic quiz or the Final Exam shows the
  // new state immediately rather than a stale checklist.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        await load();
        if (alive) setLoading(false);
      })();
      return () => {
        alive = false;
      };
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  if (failed || !progress) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>
          Could not load this award's requirements right now. Pull to retry, or check your connection.
        </Text>
        <View style={{ width: 200 }}>
          <StudioButton label="Back" variant="secondary" small onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  const { topics, completeCount, totalCount, allComplete, credential } = progress;


  const earned = credential != null;
  const earnedOn = fmtDate(credential?.issuedAt ?? credential?.earnedAt ?? null);
  const pct = totalCount > 0 ? Math.round((completeCount / totalCount) * 100) : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerKicker}>
          {awardType === 'program' ? 'PROGRAM' : 'CERTIFICATE'}
        </Text>
        <View style={{ width: 14 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />}
      >
        <Text style={styles.awardName}>{awardName}</Text>

        {earned ? (
          <View style={styles.credentialBox}>
            <Text style={styles.credentialLabel}>EARNED</Text>
            {earnedOn && <Text style={styles.credentialDate}>{earnedOn}</Text>}
            <Text style={styles.credentialBody}>
              This credential is part of your permanent record.
            </Text>

            {/* Certificate document (owner-approved 2026-08-29). The button is
                shown only when this build actually has the native print/share
                modules — an older dev client gets an honest line instead of a
                control that would do nothing. */}
            {certificateExportAvailable() ? (
              <View style={styles.certRow}>
                <StudioButton
                  label={exporting ? 'PREPARING…' : 'DOWNLOAD CERTIFICATE'}
                  onPress={onExportCertificate}
                  disabled={exporting}
                />
              </View>
            ) : (
              <Text style={styles.certNote}>
                Certificate download needs the next app build.
              </Text>
            )}
            {certMessage != null && <Text style={styles.certNote}>{certMessage}</Text>}
          </View>
        ) : (
          <>
            <View style={styles.progressRow}>
              <Text style={styles.progressCount}>
                {completeCount}
                <Text style={styles.progressOf}> / {totalCount}</Text>
              </Text>
              <Text style={styles.progressPct}>{pct}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%` }]} />
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>REQUIRED TOPICS</Text>
        {totalCount === 0 ? (
          <Text style={styles.muted}>
            No requirements are published for this award yet.
          </Text>
        ) : (
          <View style={styles.list}>
            {topics.map((t) => (
              <View key={t.achievementId} style={styles.row}>
                <Text style={[styles.mark, t.complete ? styles.markDone : styles.markTodo]}>
                  {t.complete ? '✓' : '○'}
                </Text>
                <Text style={[styles.rowName, t.complete && styles.rowNameDone]} numberOfLines={2}>
                  {t.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {!earned && (
          <View style={styles.actions}>
            {allComplete ? (
              <StudioButton
                label="Take Final Exam"
                variant="success"
                onPress={() =>
                  (navigation as any).navigate('FinalExam', { awardType, awardId, awardName })
                }
              />
            ) : (
              <>
                <StudioButton label="Take Final Exam" variant="secondary" disabled onPress={() => {}} />
                <Text style={styles.gateNote}>
                  Complete every required topic to unlock the Final Exam.
                </Text>
              </>
            )}
            <Text style={styles.examNote}>
              30 questions · 10 minutes · one sitting
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  center: {
    flex: 1,
    backgroundColor: colors.screenBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineDim,
    backgroundColor: '#121212',
  },
  back: { fontFamily: fonts.oswaldMedium, fontSize: 24, color: colors.textSub, marginTop: -2 },
  headerKicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.8, color: colors.textSubAlt },
  scroll: { padding: 20, gap: 14, paddingBottom: 48 },
  awardName: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, lineHeight: 29, color: colors.textPrimary },
  progressRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4 },
  progressCount: { fontFamily: fonts.mono, fontSize: 30, color: colors.textPrimary },
  progressOf: { fontSize: 18, color: colors.textSubAlt },
  progressPct: { fontFamily: fonts.mono, fontSize: 15, color: colors.textSubAlt },
  track: { height: 6, borderRadius: 3, backgroundColor: '#1e1e1e', overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.green },
  sectionLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.8,
    color: colors.textSubAlt,
    marginTop: 12,
  },
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  mark: { fontFamily: fonts.mono, fontSize: 15, lineHeight: 22, width: 16 },
  markDone: { color: colors.green },
  markTodo: { color: colors.textSubAlt },
  rowName: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  rowNameDone: { color: colors.textSubAlt },
  actions: { gap: 10, marginTop: 22 },
  gateNote: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 20, color: colors.textSubAlt, textAlign: 'center' },
  examNote: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.2, color: colors.textSubAlt, textAlign: 'center' },
  credentialBox: {
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.5)',
    borderRadius: 8,
    padding: 18,
    gap: 6,
    marginTop: 6,
  },
  credentialLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.green,
    textAlign: 'center',
  },
  credentialDate: { fontFamily: fonts.mono, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  certRow: { marginTop: 16, alignSelf: 'stretch' },
  certNote: {
    marginTop: 10,
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
  },
  credentialBody: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  muted: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 22, color: colors.textSub, textAlign: 'center' },
});
