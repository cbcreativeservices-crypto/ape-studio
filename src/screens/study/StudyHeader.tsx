/**
 * StudyHeader — shared method-screen header: MethodIcon 34 + uppercase Oswald
 * title (design-reference S2/S3/S4 headers). Booth 2026-07-08: the method
 * icon is ALWAYS tappable and returns to the Dashboard from any learning
 * mode (in addition to the Study-tab re-tap exit).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MethodIcon, type MethodKey } from '../../components/MethodIcon';
import { TimerIcon } from '../../components/TimerIcon';
import { colors, fonts } from '../../theme/tokens';

export function StudyHeader({
  method,
  title,
  subtitle,
  onOpenTimer,
  hideTimerButton,
}: {
  method: MethodKey;
  title: string;
  /** e.g. the topic under study (Booth 2026-07-08). */
  subtitle?: string;
  /** When provided (the 3 paced study screens), show a pace-timer button to the
   *  LEFT of RETURN that opens the pace-timer settings popup. */
  onOpenTimer?: () => void;
  /** When true, suppress the top pace-timer button — the in-screen pace
   *  CONTAINER (readout) is already showing, so the top icon would be a
   *  redundant second entry point (2026-07-25). */
  hideTimerButton?: boolean;
}) {
  const navigation = useNavigation();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => (navigation as any).navigate('Dashboard')}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back to Dashboard"
      >
        <MethodIcon method={method} size={34} />
      </Pressable>
      <View style={{ flexShrink: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle.toUpperCase()}
          </Text>
        ) : null}
      </View>
      {/* Right cluster: optional pace-timer button, then the always-visible
          RETURN control (Booth 2026-07-18). */}
      <View style={styles.rightCluster}>
        {onOpenTimer && !hideTimerButton ? (
          <Pressable
            onPress={onOpenTimer}
            hitSlop={8}
            style={styles.timerBtn}
            accessibilityRole="button"
            accessibilityLabel="Pace timer"
          >
            <TimerIcon color={colors.blue} size={17} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => (navigation as any).navigate('Dashboard')}
          hitSlop={8}
          style={styles.returnBtn}
          accessibilityRole="button"
          accessibilityLabel="Return to Dashboard"
        >
          <Text style={styles.returnText}>‹ RETURN</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10 },
  rightCluster: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerBtn: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 4.5,
    backgroundColor: '#1b1b1b',
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  timerGlyph: { fontSize: 15, color: colors.textSub },
  returnBtn: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 4.5,
    backgroundColor: '#1b1b1b',
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  returnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSub },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: {
    fontFamily: fonts.barlowCondensedSemiBold,
    fontSize: 12,
    letterSpacing: 1.1,
    color: colors.amberLabel,
    marginTop: 2,
  },
});
