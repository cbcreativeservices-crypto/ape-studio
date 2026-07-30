/**
 * EarLabScreen — AUDIO LEARNING LAB landing (owner IA restructure 2026-07-29).
 *
 * Replaces the long flat list with a subject-based CATEGORY menu. Each card
 * shows an icon, the category name, a one-sentence description, and a COMPUTED
 * lab count (never hard-coded — see labCatalog.ts). Selecting a category:
 *   • HUB category → opens the existing lab home (Wave/Digital/Meter/
 *     Calculator), which already owns its module drill-down.
 *   • LIST category with one leaf and no families → opens that lab directly.
 *   • otherwise → opens LabCategory (the second-level list of its labs).
 *
 * Category → (optional Lab Family) → Lab. No functionality removed — every
 * existing lab route is reachable; the data model scales to 50–100+ labs.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import type { RootStackParamList } from '../../navigation/types';
import {
  LAB_CATEGORIES,
  categoryCountLabel,
  categoryLeaves,
  type LabCategory,
} from './labCatalog';

type Props = NativeStackScreenProps<RootStackParamList, 'EarLab'>;

const INTRO =
  'A professional audio curriculum, organized by subject. Choose an area to ' +
  'explore its labs — hear it, see it, measure it, and take it apart.';

export function EarLabScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  // navigate is over-strict about the (route, params?) tuple across a union of
  // routes; go loose (the app-wide escape hatch) since routes/params come from
  // the typed labCatalog.
  const go = navigation.navigate as unknown as (route: string, params?: object) => void;

  const openCategory = (cat: LabCategory) => {
    if (cat.kind === 'hub') {
      go(cat.route, cat.params);
      return;
    }
    const leaves = categoryLeaves(cat);
    // A single-lab category with no families opens that lab directly — no
    // point in a one-row detail screen (still scales: add labs → it lists).
    if (leaves.length === 1 && !cat.families) {
      go(leaves[0].route, leaves[0].params);
      return;
    }
    go('LabCategory', { id: cat.id });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>AUDIO LEARNING LAB</Text>
          <Text style={styles.subtitle}>Ear Training & Audio Lab</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>{INTRO}</Text>
        {LAB_CATEGORIES.map((cat) => (
          <CategoryCard key={cat.id} cat={cat} onOpen={() => openCategory(cat)} />
        ))}
      </ScrollView>
    </View>
  );
}

/** A top-level category card: icon · name · one-sentence description · count. */
function CategoryCard({ cat, onOpen }: { cat: LabCategory; onOpen: () => void }) {
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${cat.name}, ${categoryCountLabel(cat)}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.iconBadge}>
        <Text style={styles.iconGlyph}>{cat.glyph}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.cardName}>{cat.name}</Text>
        <Text style={styles.cardDesc}>{cat.description}</Text>
        <Text style={styles.cardCount}>{categoryCountLabel(cat)}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 10 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 28, gap: 12 },
  intro: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary, marginBottom: 4 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.30)',
    backgroundColor: '#15130d',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  cardPressed: { backgroundColor: '#1f1a0e' },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.55)',
    backgroundColor: 'rgba(255,198,77,.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.amber },
  cardName: { fontFamily: fonts.oswaldSemiBold, fontSize: 15.5, letterSpacing: 0.5, color: colors.textPrimary },
  cardDesc: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  cardCount: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.amber, marginTop: 3 },
  chevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 24, color: colors.amber, paddingHorizontal: 2 },
});
