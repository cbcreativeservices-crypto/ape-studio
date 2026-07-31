/**
 * EarLabScreen — AUDIO FUNDAMENTALS & TRAINING LAB landing (owner 2026-08-01).
 *
 * The lab is partitioned in the title into two top-level sections:
 *   • AUDIO FUNDAMENTALS — the FREE + required part of the curriculum.
 *   • TRAINING LAB       — the members-only part (everything else).
 *
 * Within each section we show the lab CATEGORIES and the individual LABS inside
 * them. A category that is itself one big lab environment (Wave Physics, Visual
 * Audio Analysis, Digital Systems, Calculators) is a tappable card that opens
 * that lab's own module drill-down; a multi-lab category lists its individual
 * labs inline. Planned-but-unbuilt labs show as non-tappable "in development —
 * soon to be released" rows (§1.7: no dead links). Fully data-driven from
 * labCatalog — adding a lab needs no change here.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import type { RootStackParamList } from '../../navigation/types';
import {
  categoryCountLabel,
  categoryLabRows,
  DEV_NOTE,
  sectionCategories,
  type LabCategory,
  type LabLeaf,
  type LabSection,
} from './labCatalog';

type Props = NativeStackScreenProps<RootStackParamList, 'EarLab'>;

const INTRO =
  'A professional audio curriculum in two parts: the free, required Audio ' +
  'Fundamentals, and the members-only Training Lab. Choose a lab to hear it, ' +
  'see it, measure it, and take it apart.';

const SECTIONS: { key: LabSection; title: string; note: string }[] = [
  { key: 'fundamentals', title: 'AUDIO FUNDAMENTALS', note: 'Free & required' },
  { key: 'training', title: 'TRAINING LAB', note: 'Members only' },
];

export function EarLabScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  // navigate is over-strict about the (route, params?) tuple across a union of
  // routes; go loose (the app-wide escape hatch) since routes/params come from
  // the typed labCatalog.
  const go = navigation.navigate as unknown as (route: string, params?: object) => void;

  const openLeaf = (leaf: LabLeaf) => {
    if (leaf.route) go(leaf.route, leaf.params);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>AUDIO FUNDAMENTALS & TRAINING LAB</Text>
          <Text style={styles.subtitle}>The Academy's hands-on labs</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>{INTRO}</Text>

        {SECTIONS.map((sec) => {
          const cats = sectionCategories(sec.key);
          if (cats.length === 0) return null;
          return (
            <View key={sec.key} style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>{sec.title}</Text>
                <Text style={styles.sectionNote}>{sec.note}</Text>
              </View>
              {cats.map((cat) => (
                <CategoryBlock key={cat.id} cat={cat} onOpenHub={() => go(cat.kind === 'hub' ? cat.route : '', cat.kind === 'hub' ? cat.params : undefined)} onOpenLeaf={openLeaf} />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** One category: a header (a tappable card for hub labs, a label for multi-lab
 *  categories) followed by the individual lab rows inside it. */
function CategoryBlock({
  cat,
  onOpenHub,
  onOpenLeaf,
}: {
  cat: LabCategory;
  onOpenHub: () => void;
  onOpenLeaf: (leaf: LabLeaf) => void;
}) {
  const rows = categoryLabRows(cat);
  const isHub = cat.kind === 'hub';
  return (
    <View style={styles.catBlock}>
      {isHub ? (
        <Pressable
          onPress={onOpenHub}
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
      ) : (
        <View style={styles.catLabel}>
          <View style={styles.iconBadgeSm}>
            <Text style={styles.iconGlyphSm}>{cat.glyph}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.catName}>{cat.name}</Text>
            <Text style={styles.catCount}>{categoryCountLabel(cat)}</Text>
          </View>
        </View>
      )}

      {rows.map((leaf) => (
        <LabRow key={leaf.name} leaf={leaf} onOpen={() => onOpenLeaf(leaf)} inset={!isHub} />
      ))}
    </View>
  );
}

/** One individual lab row. Dev placeholders are non-tappable + labeled. */
function LabRow({ leaf, onOpen, inset }: { leaf: LabLeaf; onOpen: () => void; inset: boolean }) {
  const dev = leaf.status === 'development';
  return (
    <Pressable
      onPress={dev ? undefined : onOpen}
      disabled={dev}
      accessibilityRole="button"
      accessibilityState={{ disabled: dev }}
      accessibilityLabel={dev ? `${leaf.name}, in development` : `Open ${leaf.name}`}
      style={({ pressed }) => [styles.row, inset && styles.rowInset, dev && styles.rowDev, pressed && !dev && styles.rowPressed]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowName, dev && styles.rowNameDev]}>{leaf.name}</Text>
        <Text style={styles.rowBlurb}>{leaf.blurb}</Text>
        {dev ? <Text style={styles.devNote}>{DEV_NOTE}</Text> : null}
      </View>
      {dev ? <Text style={styles.soon}>SOON</Text> : <Text style={styles.rowChevron}>›</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 10 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 15.5, letterSpacing: 0.8, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 28, gap: 16 },
  intro: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary, marginBottom: 2 },

  // Top-level section (Audio Fundamentals / Training Lab).
  section: { gap: 12 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255,198,77,.35)',
    paddingBottom: 5,
  },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.6, color: colors.amber },
  sectionNote: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.textSub },

  catBlock: { gap: 8 },

  // Hub category card (opens the lab's own module list).
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

  // Multi-lab category label (its labs are the tappable rows beneath).
  catLabel: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 2 },
  iconBadgeSm: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.45)',
    backgroundColor: 'rgba(255,198,77,.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyphSm: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.amber },
  catName: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1, color: colors.textPrimary },
  catCount: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1, color: colors.amberLabel, marginTop: 1 },

  // Individual lab rows.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.42)',
    backgroundColor: '#17140c',
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  rowInset: { marginLeft: 12 },
  rowPressed: { backgroundColor: '#1f1a0e' },
  rowDev: { borderColor: '#2a2a2e', backgroundColor: '#121214' },
  rowName: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.4, color: colors.textPrimary },
  rowNameDev: { color: colors.textSub },
  rowBlurb: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub, marginTop: 1 },
  devNote: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1, color: '#7a7c80', marginTop: 4 },
  soon: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: '#7a7c80', paddingHorizontal: 4 },
  rowChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.amber, paddingHorizontal: 4 },
});
