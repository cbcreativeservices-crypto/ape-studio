/**
 * ReadinessMeter — the persistent state of a project, and why it is in it.
 *
 * Shows DECISIONS made, never screens visited. The number here comes straight
 * from readiness.ts, which is where the rule that a blocker cannot be outscored
 * lives — so a project can read 96% and still say Not Ready, and that is
 * correct rather than a bug.
 *
 * Low-Light Production Mode: nothing here auto-appears. It is drawn inline as
 * part of the screen, never pushed over one.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { READINESS_LABEL, VERDICT_LABEL } from '../../../features/production/types';
import type { Finding, LabKind, ReadinessState } from '../../../features/production/types';
import type { ReadinessReport, StageReadiness } from '../../../features/production/readiness';
import { STATE_TINT } from './FieldRow';

export function ReadinessMeter({
  report,
  lab,
  onAcceptBlocker,
}: {
  report: ReadinessReport;
  lab: LabKind;
  /** Tapping a blocker offers to record an accepted condition. */
  onAcceptBlocker?: (f: Finding) => void;
}) {
  const verdictTint =
    report.verdict === 'ready' ? colors.green : report.verdict === 'ready_with_conditions' ? colors.amber : colors.red;

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>PRODUCTION READINESS</Text>
          <Text style={[styles.verdict, { color: verdictTint }]}>{VERDICT_LABEL[lab][report.verdict]}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={[styles.score, { color: verdictTint }]}>{report.score}</Text>
          <Text style={styles.scoreOf}>/ 100</Text>
        </View>
      </View>

      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${report.totalRequired === 0 ? 0 : (report.answeredRequired / report.totalRequired) * 100}%`,
              backgroundColor: verdictTint,
            },
          ]}
        />
      </View>
      <Text style={styles.counts}>
        {report.answeredRequired} of {report.totalRequired} required decisions made
      </Text>

      {report.blockers.length > 0 ? (
        <View style={styles.blockerBox}>
          <Text style={styles.blockerHead}>
            {report.blockers.length === 1 ? 'ONE THING BLOCKS THIS PROJECT' : `${report.blockers.length} THINGS BLOCK THIS PROJECT`}
          </Text>
          {report.blockers.map((b) =>
            onAcceptBlocker ? (
              <Pressable
                key={b.ruleId}
                onPress={() => onAcceptBlocker(b)}
                accessibilityRole="button"
                accessibilityLabel={`${b.title}. Record an accepted condition.`}
              >
                <Text style={styles.blockerItemTappable}>{b.title}</Text>
              </Pressable>
            ) : (
              <Text key={b.ruleId} style={styles.blockerItem}>
                {b.title}
              </Text>
            ),
          )}
          {/* Stated plainly so a high score never reads as a contradiction. */}
          <Text style={styles.blockerWhy}>
            A score cannot clear these. Fix them, or{onAcceptBlocker ? ' tap one to ' : ' '}record who
            accepted it and why.
          </Text>
        </View>
      ) : null}

      {report.acceptedBlockers.length > 0 ? (
        <View style={styles.condBox}>
          <Text style={styles.condHead}>PROCEEDING WITH ACCEPTED CONDITIONS</Text>
          {report.acceptedBlockers.map((b) => (
            <Text key={b.ruleId} style={styles.condItem}>
              {b.title} — accepted by {b.accepted?.acceptedBy}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** One row per stage, for the lab home. */
export function StageProgressRow({ stage }: { stage: StageReadiness }) {
  const tint = STATE_TINT[stage.state as ReadinessState];
  return (
    <View style={styles.stageRow}>
      <View style={[styles.stageDot, { backgroundColor: tint }]} />
      <Text style={styles.stageNum}>{stage.num}</Text>
      <Text style={styles.stageTitle} numberOfLines={1}>
        {stage.title}
      </Text>
      <Text style={[styles.stageState, { color: tint }]}>{READINESS_LABEL[stage.state]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 11,
    backgroundColor: '#101013',
    padding: 14,
    gap: 9,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  kicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textMuted },
  verdict: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 0.3, marginTop: 2 },
  scoreBox: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  score: { fontFamily: fonts.oswaldBold, fontSize: 30 },
  scoreOf: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted },

  barTrack: { height: 6, borderRadius: 3, backgroundColor: '#1d1d22', overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  counts: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub },

  blockerBox: {
    borderLeftWidth: 3,
    borderLeftColor: colors.red,
    backgroundColor: 'rgba(255,75,58,.08)',
    borderRadius: 6,
    padding: 10,
    gap: 4,
  },
  blockerHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.9, color: colors.red },
  blockerItem: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textSecondary },
  blockerItemTappable: {
    fontFamily: fonts.barlowMedium,
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
    paddingVertical: 2,
  },
  blockerWhy: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub, marginTop: 3 },

  condBox: {
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
    backgroundColor: 'rgba(255,198,77,.08)',
    borderRadius: 6,
    padding: 10,
    gap: 4,
  },
  condHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.9, color: colors.amber },
  condItem: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSecondary },

  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 9 },
  stageDot: { width: 8, height: 8, borderRadius: 4 },
  stageNum: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.textMuted, width: 15 },
  stageTitle: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14, color: colors.textPrimary },
  stageState: { fontFamily: fonts.barlowMedium, fontSize: 12 },
});
