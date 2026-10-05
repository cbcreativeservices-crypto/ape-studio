/**
 * MikingHubScreen — route `MikingHub { lab? }` (blueprint §2; ruling §16.3:
 * the "Miking Lab 1: Drums" row opens this hub, which lists its lessons).
 * Only labs and lessons that are READY are listed (owner rule: no
 * placeholder rows). Each lesson shows ✓ and "n of N pages" — the lab-local
 * credit of ruling §16.1. A failed progress read says so (D51) and every
 * lesson still opens.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { readingColumn } from '../../../theme/readingColumn';
import type { RootStackParamList } from '../../../navigation/types';
import { LabHeader } from '../kit/LabNavBar';
import { ProgressUnreadableNote } from '../kit/ProgressUnreadableNote';
import { PAGE_IDS } from './engine/model/types.ts';
import { lessonProgress, useMikingProgress, useMikingUnreadable } from './engine/progress/mikingProgress';
import { lessonsOf, readyLabs, type MikingLabMeta } from './data/registry';

export function MikingHubScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const want = (route.params as { lab?: string } | undefined)?.lab;
  const labs = readyLabs();
  const shown: MikingLabMeta[] = want ? labs.filter((l) => l.id === want) : labs;
  const progress = useMikingProgress();
  const unreadable = useMikingUnreadable();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <LabHeader title={shown.length === 1 ? shown[0].name.toUpperCase() : 'MIKING LABS'} subtitle="Place microphones on drawn instruments — silent; tendencies in words" />
      <ScrollView contentContainerStyle={[styles.scroll, readingColumn, { paddingBottom: insets.bottom + 24 }]}>
        {unreadable ? <ProgressUnreadableNote /> : null}
        {shown.map((lab) => (
          <View key={lab.id} style={{ gap: 10 }}>
            <Text style={styles.blurb}>{lab.blurb}</Text>
            {lessonsOf(lab.id).map((ls) => {
              const lp = lessonProgress(progress, ls.id);
              const n = PAGE_IDS.filter((p) => lp.done.includes(p)).length;
              const all = n === PAGE_IDS.length;
              return (
                <Pressable
                  key={ls.id}
                  onPress={() => navigation.navigate('MikingLesson', { id: ls.id })}
                  style={styles.row}
                  accessibilityRole="button"
                  accessibilityLabel={`${ls.title}. ${ls.subtitle}. ${n} of ${PAGE_IDS.length} pages done.`}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.title}>{`${all ? '✓ ' : ''}${ls.title}`}</Text>
                    <Text style={styles.sub}>{ls.subtitle}</Text>
                  </View>
                  <Text style={[styles.count, all && { color: colors.green }]}>{`${n} of ${PAGE_IDS.length} pages`}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
        <Text style={styles.note}>After our research, these lessons suggest where to begin — starting points, not rules. Move the mic, listen, and trust your ears and the room. Place real mics with the player stopped.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { paddingHorizontal: 16, paddingTop: 10, gap: 16 },
  blurb: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 64, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#111114' },
  title: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 0.8 },
  sub: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 17 },
  count: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.8 },
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
