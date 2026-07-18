/**
 * StudyHeader — shared method-screen header: MethodIcon 34 + uppercase Oswald
 * title (design-reference S2/S3/S4 headers). Booth 2026-07-08: the method
 * icon is ALWAYS tappable and returns to the Dashboard from any learning
 * mode (in addition to the Study-tab re-tap exit).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MethodIcon, type MethodKey } from '../../components/MethodIcon';
import { colors, fonts } from '../../theme/tokens';

export function StudyHeader({
  method,
  title,
  subtitle,
}: {
  method: MethodKey;
  title: string;
  /** e.g. the topic under study (Booth 2026-07-08). */
  subtitle?: string;
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
      {/* Explicit RETURN control on every study method screen (Booth
          2026-07-18) — the icon tap above stays, but this one is visible. */}
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
  );
}

const styles = StyleSheet.create({
  row: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10 },
  returnBtn: {
    marginLeft: 'auto',
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
