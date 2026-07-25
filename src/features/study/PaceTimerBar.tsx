/**
 * PaceTimerBar — the in-screen container shown when the pace timer is enabled:
 * the thin PaceReadout plus a small gear button to reopen the settings modal.
 * Computes the paced math from the current preset; in stopwatch mode it just
 * passes the count-up through. Renders nothing extra — kept low and quiet so it
 * never crowds the study content.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { PaceReadout } from './PaceReadout';
import { paceMath, SEC_PER_Q, type PacePreset } from './paceStore';

export function PaceTimerBar({
  preset,
  answered,
  total,
  elapsed,
  onOpenSettings,
}: {
  preset: PacePreset;
  answered: number;
  total: number;
  elapsed: number;
  onOpenSettings: () => void;
}) {
  const secPerQ = SEC_PER_Q[preset];
  const isStopwatch = secPerQ == null;

  const math = isStopwatch ? null : paceMath({ secPerQ, answered, total, elapsed });

  return (
    <View style={styles.wrap}>
      <View style={styles.readout}>
        {isStopwatch ? (
          <PaceReadout mode="stopwatch" answered={answered} total={total} elapsed={elapsed} />
        ) : (
          <PaceReadout
            mode="paced"
            status={math?.status}
            offsetSeconds={math?.offsetSeconds}
            markerPos={math?.markerPos}
            answered={answered}
            total={total}
            elapsed={elapsed}
          />
        )}
      </View>
      <Pressable
        onPress={onOpenSettings}
        hitSlop={8}
        style={styles.gear}
        accessibilityRole="button"
        accessibilityLabel="Pace timer settings"
      >
        <Text style={styles.gearGlyph}>⚙</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1c1c1e',
    backgroundColor: '#0e0e10',
  },
  readout: { flex: 1 },
  gear: {
    width: 30,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearGlyph: { fontSize: 14, color: colors.textSub },
});
