/**
 * CalcSymbolsKeyScreen — the Audio Calculator Laboratory's symbol key (owner
 * 2026-08-05): a reference for the Greek letters and math / calculus symbols
 * used across the calculators.
 *
 * The CONTENT is owner-authored and supplied separately (see symbolsKey.ts) —
 * this screen only renders it. While the list is empty it shows an honest
 * "being prepared" state rather than any placeholder definitions.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { SYMBOL_GROUPS } from './symbolsKey';

export function CalcSymbolsKeyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const empty = SYMBOL_GROUPS.length === 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.glyph} accessibilityElementsHidden importantForAccessibility="no">
          π
        </Text>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>SYMBOL KEY</Text>
          <Text style={styles.subtitle}>Greek letters & math symbols used in the calculators</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {empty ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Key coming soon</Text>
            <Text style={styles.emptyBody}>
              A reference for the Greek letters and calculus / math symbols used across the audio
              calculators is being prepared. Check back shortly.
            </Text>
          </View>
        ) : (
          SYMBOL_GROUPS.map((group) => (
            <View key={group.title} style={{ gap: 8 }}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.entries.map((e) => (
                <View key={`${group.title}-${e.symbol}-${e.name}`} style={styles.row}>
                  <Text style={styles.symbol}>{e.symbol}</Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.name}>{e.name}</Text>
                    <Text style={styles.meaning}>{e.meaning}</Text>
                    {e.example ? <Text style={styles.example}>{e.example}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  glyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 24, lineHeight: 28, color: colors.purple },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 34, gap: 14 },

  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 16,
    gap: 8,
  },
  emptyTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.6, color: colors.amber },
  emptyBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },

  groupTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber, marginTop: 6 },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
  },
  symbol: { fontFamily: fonts.mono, fontSize: 24, color: colors.textPrimary, minWidth: 34, textAlign: 'center' },
  name: { fontFamily: fonts.oswaldMedium, fontSize: 14.5, letterSpacing: 0.4, color: colors.textPrimary },
  meaning: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  example: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
});
