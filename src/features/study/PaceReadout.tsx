/**
 * PaceReadout — the THIN, low-height horizontal pace strip.
 *
 * Paced layout: status word · signed offset (m:ss) · mini BEHIND ◄●► AHEAD
 * scale · "K/M · m:ss elapsed". Green ahead / amber on-pace / red behind, and a
 * friendly gold "Time's up — keep going!" overtime state. STOPWATCH layout: a
 * count-up clock + "K/M · m:ss elapsed" (no target, no scale).
 *
 * A practice aid — it never blocks study, so nothing here is interactive.
 */
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { fmtClock, fmtSigned, type PaceStatus } from './paceStore';

const STATUS_COLOR: Record<PaceStatus, string> = {
  ahead: colors.green,
  onpace: colors.amber,
  behind: colors.red,
  overtime: colors.gold,
};

const STATUS_WORD: Record<PaceStatus, string> = {
  ahead: 'AHEAD',
  onpace: 'ON PACE',
  behind: 'BEHIND',
  overtime: "TIME'S UP",
};

export function PaceReadout({
  mode,
  status,
  offsetSeconds,
  markerPos,
  answered,
  total,
  elapsed,
}: {
  mode: 'paced' | 'stopwatch';
  /** paced only */
  status?: PaceStatus;
  offsetSeconds?: number;
  /** −1..+1 */
  markerPos?: number;
  answered: number;
  total: number;
  elapsed: number;
}) {
  const progress = `${answered}/${total} · ${fmtClock(elapsed)}`;

  if (mode === 'stopwatch') {
    return (
      <View style={styles.row}>
        <Text style={styles.stopwatchWord}>STOPWATCH</Text>
        <Text style={styles.stopwatchClock}>{fmtClock(elapsed)}</Text>
        <View style={styles.spacer} />
        <Text style={styles.progress}>{progress}</Text>
      </View>
    );
  }

  const s: PaceStatus = status ?? 'onpace';
  const tint = STATUS_COLOR[s];
  // −1..+1 → 0..1 → left offset within the scale track.
  const pos = Math.max(-1, Math.min(1, markerPos ?? 0));
  const leftPct = ((pos + 1) / 2) * 100;

  return (
    <View style={styles.row}>
      <Text style={[styles.statusWord, { color: tint }]} numberOfLines={1}>
        {STATUS_WORD[s]}
      </Text>
      {s === 'overtime' ? (
        <Text style={[styles.overtimeHint, { color: tint }]} numberOfLines={1}>
          keep going!
        </Text>
      ) : (
        <Text style={[styles.offset, { color: tint }]}>{fmtSigned(offsetSeconds ?? 0)}</Text>
      )}

      {/* mini BEHIND ◄──●──► AHEAD scale */}
      <View style={styles.scaleWrap}>
        <Text style={styles.scaleEnd}>◄</Text>
        <View style={styles.track}>
          <View style={styles.trackLine} />
          <View style={[styles.marker, { left: `${leftPct}%`, backgroundColor: tint }]} />
        </View>
        <Text style={styles.scaleEnd}>►</Text>
      </View>

      <Text style={styles.progress} numberOfLines={1}>
        {progress}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Low height, single line — sits quietly under the LED meter.
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 22 },
  statusWord: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, minWidth: 54 },
  offset: { fontFamily: fonts.mono, fontSize: 12, minWidth: 46 },
  overtimeHint: { fontFamily: fonts.barlowCondensedMedium, fontSize: 12, letterSpacing: 0.4 },
  scaleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  scaleEnd: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted },
  track: { flex: 1, height: 12, justifyContent: 'center' },
  trackLine: { height: 2, borderRadius: 1, backgroundColor: colors.hairlineAlt },
  marker: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4, // center the dot on its left%
  },
  progress: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSubAlt },
  stopwatchWord: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.cyanBright },
  stopwatchClock: { fontFamily: fonts.mono, fontSize: 13, color: colors.textSecondary },
  spacer: { flex: 1 },
});
