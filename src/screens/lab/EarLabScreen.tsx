/**
 * EarLabScreen — AUDIO FUNDAMENTALS & TRAINING LAB landing (owner 2026-08-01).
 *
 * Two top-level sections, each grouped into SUBJECT categories (owner
 * 2026-08-01): AUDIO FUNDAMENTALS (Sound, then Signal) and TRAINING LAB
 * (Equalization, Dynamics, Time Effects, … Calculators). Each subject shows a
 * header + its labs; a subject that IS one big lab environment (the Calculator
 * Lab) is a tappable header that opens its own drill-down. Planned labs show as
 * non-tappable "in development — soon to be released" rows (§1.7: no dead
 * links). Fully data-driven from labCatalog.
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import type { RootStackParamList } from '../../navigation/types';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { startLabPreview } from '../../features/lab/labPreviewStore';
import {
  categoryCountLabel,
  categoryEntries,
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
const FUNDAMENTALS_INTRO =
  'Included free for everyone: the essential principles of sound and signal — ' +
  'hear them, see them, measure them, and take them apart.';
const TRAINING_INTRO_MEMBER =
  'Your members-only workbench: interactive demonstrations, visualizations, ' +
  'controls and guided experiments across every audio discipline.';
const TRAINING_INTRO_FREE =
  'Preview everything the Training Labs include with Academy membership. Browse ' +
  'the full catalog below — unlock any lab to launch it.';

export function EarLabScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { entitlement } = useEntitlement();
  const isMember = entitlement === 'academy';
  const section = route.params?.section; // undefined = the full combined list
  // Accordion (owner 2026-08-07): every lab row loads COLLAPSED (name + reveal
  // triangle); at most ONE row is expanded at a time, and the expanded row
  // carries an explicit [OPEN] button — the triangle never opens the lab.
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // navigate is over-strict about the (route, params?) tuple across a union of
  // routes; go loose (the app-wide escape hatch) since routes/params come from
  // the typed labCatalog.
  const go = navigation.navigate as unknown as (route: string, params?: object) => void;

  // Training labs are members-only. Free users still OPEN the real lab (live
  // readouts / animations / mic), but a preview flag makes the root overlay gray
  // it out, block interaction, and show the Academy upgrade sheet (owner
  // 2026-08-02). Fundamentals are free to everyone.
  const isLocked = (sec: LabSection) => sec === 'training' && !isMember;

  const openLeaf = (leaf: LabLeaf, sec: LabSection) => {
    if (!leaf.route) return;
    if (isLocked(sec)) startLabPreview(leaf.route, leaf.name);
    go(leaf.route, leaf.params);
  };
  const openHub = (cat: LabCategory) => {
    if (cat.kind !== 'hub') return;
    if (isLocked(cat.section)) startLabPreview(cat.route, cat.name);
    go(cat.route, cat.params);
  };

  const shownSections = section ? SECTIONS.filter((s) => s.key === section) : SECTIONS;
  const headerTitle =
    section === 'fundamentals'
      ? 'AUDIO FUNDAMENTALS'
      : section === 'training'
        ? 'TRAINING LABS'
        : 'AUDIO FUNDAMENTALS & TRAINING LAB';
  const headerSub =
    section === 'fundamentals'
      ? 'Free & required — the foundation'
      : section === 'training'
        ? isMember
          ? 'Members-only hands-on labs'
          : 'Preview — included with Academy membership'
        : "The Academy's hands-on labs";
  const intro =
    section === 'fundamentals'
      ? FUNDAMENTALS_INTRO
      : section === 'training'
        ? isMember
          ? TRAINING_INTRO_MEMBER
          : TRAINING_INTRO_FREE
        : INTRO;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>{headerTitle}</Text>
          <Text style={styles.subtitle}>{headerSub}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>{intro}</Text>

        {shownSections.map((sec) => {
          const locked = isLocked(sec.key);
          return (
            <View key={sec.key} style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>{sec.title}</Text>
                <Text style={styles.sectionNote}>{locked ? 'Members only · preview' : sec.note}</Text>
              </View>
              {sectionCategories(sec.key).map((cat) => (
                <View key={cat.id} style={styles.catBlock}>
                  {cat.kind === 'hub' ? (
                    // A hub subject is one lab environment — a tappable header that
                    // opens its own module drill-down (e.g. the Calculator Lab).
                    <CategoryLabel cat={cat} locked={locked} onPress={() => openHub(cat)} />
                  ) : (
                    <>
                      <CategoryLabel cat={cat} />
                      {categoryEntries(cat).map((leaf) => {
                        const k = `${cat.id}:${leaf.name}`;
                        return (
                          <LabRow
                            key={k}
                            leaf={leaf}
                            locked={locked}
                            expanded={expandedKey === k}
                            onToggle={() => setExpandedKey((cur) => (cur === k ? null : k))}
                            onOpen={() => openLeaf(leaf, sec.key)}
                            inset
                          />
                        );
                      })}
                    </>
                  )}
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const SECTIONS = [
  { key: 'fundamentals' as const, title: 'AUDIO FUNDAMENTALS', note: 'Free & required' },
  { key: 'training' as const, title: 'TRAINING LAB', note: 'Members only' },
];

/** Subject header (glyph + name + count). Tappable (a card, with a chevron) when
 *  the subject is a single hub lab; a plain label when it heads a list of labs. */
function CategoryLabel({ cat, onPress, locked }: { cat: LabCategory; onPress?: () => void; locked?: boolean }) {
  const inner = (
    <>
      <View style={styles.iconBadgeSm}>
        <Text style={styles.iconGlyphSm}>{cat.glyph}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.catName}>{cat.name}</Text>
        <Text style={styles.catCount}>{categoryCountLabel(cat)}</Text>
      </View>
      {onPress ? <Text style={locked ? styles.lock : styles.rowChevron}>{locked ? '🔒' : '›'}</Text> : null}
    </>
  );
  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${cat.name}, ${categoryCountLabel(cat)}${locked ? ', Academy members only' : ''}`}
      style={({ pressed }) => [styles.catLabel, styles.catCard, pressed && styles.rowPressed]}
    >
      {inner}
    </Pressable>
  ) : (
    <View style={styles.catLabel}>{inner}</View>
  );
}

/** One uniform lab row — an ACCORDION item (owner 2026-08-07): collapsed =
 *  name + reveal triangle only; expanded = blurb + an explicit [OPEN] button
 *  (never an arrow that could read as another triangle). Dev placeholders
 *  expand to show their note but carry SOON instead of OPEN. */
function LabRow({
  leaf,
  onOpen,
  inset,
  locked,
  expanded,
  onToggle,
}: {
  leaf: LabLeaf;
  onOpen: () => void;
  inset?: boolean;
  locked?: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const dev = leaf.status === 'development';
  const showLock = !!locked && !dev; // preview: readable + a small lock, never dimmed
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${leaf.name}${dev ? ', in development' : ''}, ${expanded ? 'expanded' : 'collapsed'}`}
      style={({ pressed }) => [
        styles.row,
        !expanded && styles.rowTight,
        inset && styles.rowInset,
        dev && styles.rowDev,
        pressed && styles.rowPressed,
      ]}
    >
      <Text style={styles.rowCaret}>{expanded ? '▾' : '▸'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowName, dev && styles.rowNameDev]}>{leaf.name}</Text>
        {expanded ? (
          <>
            <Text style={styles.rowBlurb}>{leaf.blurb}</Text>
            {dev ? <Text style={styles.devNote}>{DEV_NOTE}</Text> : null}
          </>
        ) : null}
      </View>
      {expanded ? (
        dev ? (
          <Text style={styles.soon}>SOON</Text>
        ) : (
          <Pressable
            onPress={onOpen}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              showLock ? `${leaf.name}, Academy members only — open the preview` : `Open ${leaf.name}`
            }
            style={({ pressed }) => [styles.openBtn, pressed && styles.rowPressed]}
          >
            <Text style={styles.openBtnText}>{showLock ? '🔒 OPEN' : 'OPEN'}</Text>
          </Pressable>
        )
      ) : dev ? (
        <Text style={styles.soon}>SOON</Text>
      ) : showLock ? (
        <Text style={styles.lock}>🔒</Text>
      ) : null}
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

  // Subject header (its labs are the tappable rows beneath).
  catLabel: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 2 },
  // A hub subject is a single tappable card that opens its own lab.
  catCard: {
    paddingTop: 0,
    minHeight: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.42)',
    backgroundColor: '#17140c',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
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
  rowTight: { minHeight: 48, paddingVertical: 9 },
  rowCaret: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.amber, width: 14, textAlign: 'center' },
  openBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.6)',
    backgroundColor: '#1d1708',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  openBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
  rowPressed: { backgroundColor: '#1f1a0e' },
  rowDev: { borderColor: '#2a2a2e', backgroundColor: '#121214' },
  rowName: { fontFamily: fonts.oswaldSemiBold, fontSize: 14.5, letterSpacing: 0.4, color: colors.textPrimary },
  rowNameDev: { color: colors.textSub },
  rowBlurb: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub, marginTop: 2 },
  devNote: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1, color: '#7a7c80', marginTop: 4 },
  soon: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: '#7a7c80', paddingHorizontal: 4 },
  rowChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.amber, paddingHorizontal: 4 },
  lock: { fontSize: 15, paddingHorizontal: 4 },
});
