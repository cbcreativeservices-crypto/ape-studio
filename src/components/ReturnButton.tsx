/**
 * ReturnButton — the app's standard top-right return control (user request
 * 2026-07-18: a nicer, more polished pill than the old flat box). A subtle
 * brushed gradient, a soft top highlight, a rounded chevron badge, and a
 * brighter label. Defaults to navigation.goBack(); pass `onPress` to override.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../theme/tokens';

export function ReturnButton({ onPress }: { onPress?: () => void }) {
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={onPress ?? (() => navigation.goBack())}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Return"
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={['#333537', '#202223', '#161718']}
        locations={[0, 0.5, 1]}
        style={styles.grad}
      >
        {/* machined top-edge glint */}
        <View pointerEvents="none" style={styles.topGlint} />
        <View style={styles.chevWell}>
          <Text style={styles.chev}>‹</Text>
        </View>
        <Text style={styles.text}>RETURN</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#4a4d4f',
    overflow: 'hidden',
    // soft lift
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pressed: { opacity: 0.82 },
  grad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
  },
  topGlint: {
    position: 'absolute',
    top: 0,
    left: 6,
    right: 6,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 1,
  },
  chevWell: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  chev: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, lineHeight: 17, color: colors.textSecondary },
  text: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.textPrimary },
});
