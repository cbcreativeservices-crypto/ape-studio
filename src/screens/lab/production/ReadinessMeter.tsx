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
import { stageSignal } from '../../../features/production/readiness';
import { fitValue } from '../../../theme/legibility';
import { STATE_TINT } from './FieldRow';

export function ReadinessMeter({
  report,
  lab,
  onAcceptBlocker,
  unreadable,
}: {
  report: ReadinessReport;
  lab: LabKind;
  /** Tapping a blocker offers to record an accepted condition. */
  onAcceptBlocker?: (f: Finding) => void;
  /**
   * The saved projects could not be re-read (K2, 2026-10-04): the report is
   * from the copy on screen, which may be out of date, so the NUMBER is not
   * stated — "—", never a figure that may no longer be true.
   */
  unreadable?: boolean;
}) {
  const verdictTint = unreadable
    ? colors.textMuted
    : report.verdict === 'ready' ? colors.green : report.verdict === 'ready_with_conditions' ? colors.amber : colors.red;

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>PRODUCTION READINESS</Text>
          <Text style={[styles.verdict, { color: verdictTint }]}>
            {unreadable ? 'Could not be re-read just now' : VERDICT_LABEL[lab][report.verdict]}
          </Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={[styles.score, { color: verdictTint }]}>{unreadable ? '—' : report.score}</Text>
          <Text style={styles.scoreOf}>/ 100</Text>
        </View>
      </View>

      {/* ── THE BAR IS PROGRESS, NOT VERDICT (2026-09-18, design review #4) ────
          It used to fill with `verdictTint`, and the verdict stays `not_ready`
          while a single required decision is outstanding — so the bar read
          red at 5%, red at 60%, red at 95%, then green in one jump after hours
          of work. A progress bar that is red until the instant it is finished
          is not reporting progress, it is reporting incompleteness, which the
          user already knows.

          The verdict still owns the verdict TEXT and the score above. The bar
          now owns progress, in amber, which reads as "underway". */}
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${unreadable || report.totalRequired === 0 ? 0 : (report.answeredRequired / report.totalRequired) * 100}%`,
              backgroundColor: report.verdict === 'ready' ? verdictTint : colors.amber,
            },
          ]}
        />
      </View>
      <Text style={styles.counts}>
        {unreadable
          ? 'Your saved answers could not be read just now, so no figure is shown.'
          : `${report.answeredRequired} of ${report.totalRequired} required decisions made`}
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

/**
 * The words a screen reader hears for one stage's signal — the number, the
 * state and the counts, so nothing is carried by colour alone.
 */
export function stageSignalLabel(stage: StageReadiness | null, unreadable?: boolean): string {
  const sig = stageSignal(unreadable ? null : stage);
  if (sig.pct === null || !stage) return 'progress could not be read just now';
  return `${sig.pct} percent, ${READINESS_LABEL[stage.state]}, ${stage.answeredRequired} of ${stage.totalRequired} required decisions, ${stage.answeredAll} of ${stage.totalAll} questions answered`;
}

/**
 * One row per stage, for the lab home.
 *
 * ── A NUMBER, A STATE AND THE COUNTS (2026-10-04, design review #4) ──────────
 * The number is `stageSignal` — the project score's formula on one stage, held
 * under 100 until the stage is complete, so an open blocker can never read as
 * done. Its colour is the state's `STATE_TINT`. Under the title: the state
 * word and BOTH counts, because a stage measured on its required fields can be
 * "Complete" with optional questions still blank, and those print "Not
 * decided" in the packet — green must never mean "nothing left here".
 *
 * `stage` null or `unreadable`: the project could not be (re-)read, so the row
 * shows "—" and says so. Never 0%: that would tell the learner the work is gone.
 */
export function StageProgressRow({
  stage,
  num,
  title,
  unreadable,
}: {
  stage: StageReadiness | null;
  num: number;
  title: string;
  unreadable?: boolean;
}) {
  const sig = stageSignal(unreadable ? null : stage);
  const tint = sig.state ? STATE_TINT[sig.state] : colors.textMuted;
  return (
    <View style={styles.stageRow}>
      <View style={[styles.stageDot, { backgroundColor: tint }]} />
      <Text style={styles.stageNum}>{num}</Text>
      <View style={styles.stageMid}>
        <Text style={styles.stageTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.stageSub}>
          {sig.state && stage ? (
            <>
              <Text style={{ color: tint }}>{READINESS_LABEL[sig.state]}</Text>
              {` · ${stage.answeredRequired} of ${stage.totalRequired} required · ${stage.answeredAll} of ${stage.totalAll} answered`}
            </>
          ) : (
            'Could not be read just now'
          )}
        </Text>
      </View>
      <Text style={[styles.stagePct, { color: tint }]} {...fitValue(17)}>
        {sig.text}
      </Text>
    </View>
  );
}

/**
 * The same signal for the stage screen's header: the number over the state
 * word. `stage` null = not read (yet, or at all) → "—".
 */
export function StageSignalBadge({ stage }: { stage: StageReadiness | null }) {
  const sig = stageSignal(stage);
  const tint = sig.state ? STATE_TINT[sig.state] : colors.textMuted;
  return (
    <View
      style={styles.badge}
      accessible
      accessibilityLabel={`This stage: ${stageSignalLabel(stage)}`}
    >
      <Text style={[styles.badgePct, { color: tint }]} {...fitValue(18)}>
        {sig.text}
      </Text>
      {sig.state ? <Text style={[styles.badgeWord, { color: tint }]}>{BADGE_WORD[sig.state]}</Text> : null}
    </View>
  );
}

/** The header has room for one short word; the full state is in its label. */
const BADGE_WORD: Record<ReadinessState, string> = {
  complete: 'COMPLETE',
  attention: 'UNDER WAY',
  missing: 'NOT STARTED',
  conflict: 'BLOCKED',
  na: 'N/A',
};

const styles = StyleSheet.create({
  stageMid: { flex: 1, gap: 2 },
  stageSub: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub },
  stagePct: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, minWidth: 46, textAlign: 'right' },
  badge: { alignItems: 'flex-end', minWidth: 58 },
  badgePct: { fontFamily: fonts.oswaldSemiBold, fontSize: 18 },
  badgeWord: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.6 },
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

  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 9, minHeight: 48 },
  stageDot: { width: 8, height: 8, borderRadius: 4 },
  stageNum: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.textMuted, width: 15 },
  stageTitle: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14, color: colors.textPrimary },
});
