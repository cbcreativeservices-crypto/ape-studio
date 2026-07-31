/**
 * EarLabScreen — AUDIO FUNDAMENTALS & TRAINING LAB landing (owner 2026-08-01).
 *
 * The lab is partitioned in the title into two top-level sections:
 *   • AUDIO FUNDAMENTALS — the FREE + required part. Shown as ONE flat list of
 *     labs in a logical order (no category headers, owner 2026-08-01).
 *   • TRAINING LAB       — the members-only part. Keeps its category headers,
 *     with the labs listed beneath each.
 *
 * Every lab is the SAME uniform row size whether it is one big lab environment
 * (Wave Physics, Visual Audio Analysis, Digital Systems, Calculators — a row
 * that opens that lab's own module drill-down) or a single lab. Planned labs
 * show as non-tappable "in development — soon to be released" rows (§1.7: no
 * dead links). Fully data-driven from labCatalog.
 */
import { Fragment } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import type { RootStackParamList } from '../../navigation/types';
import {
  categoryCountLabel,
  categoryEntries,
  DEV_NOTE,
  sectionCategories,
  type LabCategory,
  type LabLeaf,
} from './labCatalog';

type Props = NativeStackScreenProps<RootStackParamList, 'EarLab'>;

const INTRO =
  'A professional audio curriculum in two parts: the free, required Audio ' +
  'Fundamentals, and the members-only Training Lab. Choose a lab to hear it, ' +
  'see it, measure it, and take it apart.';

export function EarLabScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  // navigate is over-strict about the (route, params?) tuple across a union of
  // routes; go loose (the app-wide escape hatch) since routes/params come from
  // the typed labCatalog.
  const go = navigation.navigate as unknown as (route: string, params?: object) => void;

  const openLeaf = (leaf: LabLeaf) => {
    if (leaf.route) go(leaf.route, leaf.params);
  };

  // AUDIO FUNDAMENTALS — one flat, logically-ordered list (catalog order:
  // Foundations → Wave Physics → Mics & Loudspeakers → Digital → Visual Audio
  // Analysis (+ Harmonograph) → Interactive), no category grouping.
  const fundamentals = sectionCategories('fundamentals').flatMap(categoryEntries);
  const training = sectionCategories('training');

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

        {/* ── AUDIO FUNDAMENTALS — flat list, no category headers ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>AUDIO FUNDAMENTALS</Text>
            <Text style={styles.sectionNote}>Free & required</Text>
          </View>
          {fundamentals.map((leaf) => (
            <LabRow key={leaf.name} leaf={leaf} onOpen={() => openLeaf(leaf)} />
          ))}
        </View>

        {/* ── TRAINING LAB — keeps category headers ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>TRAINING LAB</Text>
            <Text style={styles.sectionNote}>Members only</Text>
          </View>
          {training.map((cat) => (
            <Fragment key={cat.id}>
              {cat.kind === 'hub' ? (
                // A hub is one lab — a single uniform row, no header of its own.
                categoryEntries(cat).map((leaf) => (
                  <LabRow key={leaf.name} leaf={leaf} onOpen={() => openLeaf(leaf)} />
                ))
              ) : (
                <View style={styles.catBlock}>
                  <CategoryLabel cat={cat} />
                  {categoryEntries(cat).map((leaf) => (
                    <LabRow key={leaf.name} leaf={leaf} onOpen={() => openLeaf(leaf)} inset />
                  ))}
                </View>
              )}
            </Fragment>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/** Small category header (glyph + name + count) for Training-Lab groups. */
function CategoryLabel({ cat }: { cat: LabCategory }) {
  return (
    <View style={styles.catLabel}>
      <View style={styles.iconBadgeSm}>
        <Text style={styles.iconGlyphSm}>{cat.glyph}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.catName}>{cat.name}</Text>
        <Text style={styles.catCount}>{categoryCountLabel(cat)}</Text>
      </View>
    </View>
  );
}

/** One uniform lab row (identical size for hub labs and single labs). Dev
 *  placeholders are non-tappable + labeled. */
function LabRow({ leaf, onOpen, inset }: { leaf: LabLeaf; onOpen: () => void; inset?: boolean }) {
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
        <Text style={styles.rowBlurb} numberOfLines={2}>{leaf.blurb}</Text>
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
  section: { gap: 8 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255,198,77,.35)',
    paddingBottom: 5,
    marginBottom: 2,
  },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.6, color: colors.amber },
  sectionNote: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.textSub },

  catBlock: { gap: 8, marginTop: 4 },

  // Training-Lab category label (its labs are the tappable rows beneath).
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

  // Uniform lab rows — same size for every topic (hub or single lab).
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
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
  rowName: { fontFamily: fonts.oswaldSemiBold, fontSize: 14.5, letterSpacing: 0.4, color: colors.textPrimary },
  rowNameDev: { color: colors.textSub },
  rowBlurb: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub, marginTop: 2 },
  devNote: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1, color: '#7a7c80', marginTop: 4 },
  soon: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: '#7a7c80', paddingHorizontal: 4 },
  rowChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.amber, paddingHorizontal: 4 },
});
