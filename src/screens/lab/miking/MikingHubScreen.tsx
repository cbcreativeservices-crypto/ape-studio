/**
 * MikingHubScreen — route `MikingHub { lab? }` (blueprint §2; ruling §16.3).
 *
 * The member Labs menu carries ONE tile per instrument FAMILY (owner
 * 2026-10-06: "those tiles (membranophone, aerophone, etc.) should be on the
 * member lab menu, not inside another menu" — labCatalog, Instruments &
 * Recording), and each opens this screen with `{ lab }`: that family's
 * lessons, in the same animated two-column push-button menu (owner: "in the
 * same animated 2 column push button menu format like calculators, tools
 * menu, members on labs"). BACK returns to the Labs menu.
 *
 * Only READY labs and lessons are listed (owner rule: no placeholder rows).
 * Each lesson shows ✓ and "n of N pages" — the lab-local credit of ruling
 * §16.1. A failed progress read says so (D51) and every lesson still opens.
 * Without `lab` (the #labpreview harness) every ready family's lessons are
 * shown in turn; nothing in the app links there.
 *
 * The tiles are the shared GlassTile / GlassPanel hardware (src/screens/tools/
 * GlassTile.tsx) that the Calculator Lab and the Labs menu (EarLabScreen) use
 * — recess, raised glass, sink + power-on press, one activation per tap —
 * laid out the way the Labs menu lays them out (two columns on a phone, three
 * on a tablet). Members-only gating is the navigator's (MemberGated +
 * withMembershipPreview), unchanged.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { cardColumn } from '../../../theme/readingColumn';
import { useIsTablet } from '../../../theme/useIsTablet';
import { fitValue } from '../../../theme/legibility';
import type { RootStackParamList } from '../../../navigation/types';
import { GlassPanel, GlassTile } from '../../tools/GlassTile';
import { LabHeader } from '../kit/LabNavBar';
import { ProgressUnreadableNote } from '../kit/ProgressUnreadableNote';
import { PAGE_IDS } from './engine/model/types.ts';
import { creditedCount } from './engine/progress/creditMap.ts';
import { lessonProgress, useMikingProgress, useMikingUnreadable } from './engine/progress/mikingProgress';
import { lessonsOf, readyLabs, type MikingLabMeta } from './data/registry';

export function MikingHubScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tablet = useIsTablet();
  const want = (route.params as { lab?: string } | undefined)?.lab;
  const labs = readyLabs();
  // An unknown or retired `lab` (an old link) shows every family, never an
  // empty menu (toddler hunt 2026-10-07, T1-04).
  const picked = want ? labs.filter((l) => l.id === want) : [];
  const shown: MikingLabMeta[] = picked.length ? picked : labs;
  const one = shown.length === 1 ? shown[0] : undefined;
  const progress = useMikingProgress();
  const unreadable = useMikingUnreadable();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <LabHeader
        title={one ? one.family.toUpperCase() : 'MIKING LABS'}
        subtitle={one ? one.name : 'Place microphones on drawn instruments — silent; tendencies in words'}
      />
      <ScrollView contentContainerStyle={[styles.scroll, cardColumn, { paddingBottom: insets.bottom + 24 }]}>
        {unreadable ? <ProgressUnreadableNote /> : null}
        {shown.map((lab) => (
          <View key={lab.id} style={styles.family}>
            {one ? null : <Text style={styles.familyHead}>{lab.family.toUpperCase()}</Text>}
            <Text style={styles.blurb}>{lab.blurb}</Text>
            <GlassPanel style={[styles.tileGrid, !tablet && styles.tilePanelPhone]}>
              {lessonsOf(lab.id).map((ls) => {
                const lp = lessonProgress(progress, ls.id);
                // Read through the credit map: a record from before the 2026-10-06
                // restructure counts its instrument / sound / setting as the page
                // built from them (never more than the eight pages).
                const n = creditedCount(lp.done);
                const all = n === PAGE_IDS.length;
                return (
                  <GlassTile
                    key={ls.id}
                    style={tablet ? styles.tileThird : styles.tileHalf}
                    glassStyle={styles.tileFace}
                    onPress={() => navigation.navigate('MikingLesson', { id: ls.id })}
                    accessibilityLabel={`${ls.title}. ${ls.subtitle}. ${n} of ${PAGE_IDS.length} pages done.`}
                  >
                    <Text style={styles.tileName}>{`${all ? '✓ ' : ''}${ls.title}`}</Text>
                    <Text style={styles.tileSub}>{ls.subtitle}</Text>
                    <Text style={[styles.count, all && { color: colors.green }]} {...fitValue(12)}>{`${n} of ${PAGE_IDS.length} pages`}</Text>
                  </GlassTile>
                );
              })}
            </GlassPanel>
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
  family: { gap: 10 },
  familyHead: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1 },
  blurb: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  // The Labs menu's tile grid (EarLabScreen): the panel, its thinner phone
  // margin, the tile widths and the tile face.
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', columnGap: 8, rowGap: 10 },
  tilePanelPhone: { padding: 7 },
  tileHalf: { width: '48.5%' },
  tileThird: { width: '32%' },
  tileFace: { minHeight: 118, padding: 12, gap: 5, justifyContent: 'space-between', backgroundColor: '#101116' },
  tileName: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.4, color: colors.textPrimary },
  // Never cut short: the subtitle wraps in full (the tile grows).
  tileSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 16, color: '#d4d6da', flexGrow: 1 },
  count: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.8, color: colors.amberLabel },
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
