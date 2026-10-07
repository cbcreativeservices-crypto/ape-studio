/**
 * LabCategoryScreen — the second level of the Audio Learning Lab hierarchy
 * (owner IA restructure 2026-07-29): the labs inside ONE category, optionally
 * grouped into Lab Families. Selecting a lab opens its detailed lesson.
 *
 * Category → (Lab Family) → Lab. Reuses the landing's row/badge design
 * language. Purely data-driven from labCatalog — adding a lab needs no change
 * here.
 */
import { Fragment, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import { AccuracyNote } from '../../components/AccuracyNote';
import type { RootStackParamList } from '../../navigation/types';
import { categoryCountLabel, DEV_NOTE, getCategory, type LabLeaf } from './labCatalog';
import { useLabDone } from '../../features/lab/labCompletion';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { useMemberGate } from '../../features/commercial/useTier';
import { MEMBERSHIP_NOT_CONFIRMED } from '../../features/commercial/tier';
import { notify } from '../../lib/confirm';
import { startLabPreview } from '../../features/lab/labPreviewStore';
// Tablet (owner 2026-09-29): a page of rows/cards - capped at the card column
// and centred instead of stretching rows 990 pt wide. No-op on a phone.
import { cardColumn, readingText } from '../../theme/readingColumn';
import { useWideOnTablet } from '../../theme/useIsTablet';
import { TabletGrid } from '../../components/TabletGrid';
import { safeGoBack } from '../../lib/safeGoBack';

type Props = NativeStackScreenProps<RootStackParamList, 'LabCategory'>;

export function LabCategoryScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const cat = getCategory(route.params.id);
  // Accordion (owner 2026-08-07): rows load collapsed; one expanded at a time;
  // the expanded row opens via an explicit [OPEN] button.
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const { resolved } = useEntitlement();
  const gate = useMemberGate();
  const lastOpenAt = useRef(0);
  // Tablet (owner iPad report 2026-10-06): the list takes the iPad's width in
  // two columns instead of a 760 pt strip between black gutters. Phone: as was.
  const wide = useWideOnTablet();

  if (!cat || cat.kind !== 'list') {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
        <Header title="AUDIO FUNDAMENTALS & ADVANCED TRAINING LABS" subtitle="" onBack={() => safeGoBack(navigation)} />
        <Text style={styles.empty}>This category is not available.</Text>
      </View>
    );
  }

  const go = navigation.navigate as unknown as (route: string, params?: object) => void;
  // The Ear Lab's open rule (night pass 3, 2026-10-01). This screen is still
  // reachable by the `labs/:id` deep link, and its OPEN went straight to the
  // lab: a resolved non-member opening a members-only lab whose route is not
  // gated at the screen (withMembershipPreview gates only routes that are
  // members-only EVERYWHERE in the catalog) got it live. And two OPEN taps
  // inside the beat pushed the lab twice.
  //
  // KNOWN non-member only (tier sweep 2026-10-03): `resolved && !isMember`
  // also matched a member whose membership read FAILED — they got the preview
  // scrim and the upgrade sheet.
  const memberOnlyLeaf = (leaf: LabLeaf) => cat.section === 'training' || !!leaf.member;
  const lockedLeaf = (leaf: LabLeaf) => gate === 'locked' && memberOnlyLeaf(leaf);
  // A members-only open while the tier is not KNOWN (tier sweep 2026-10-03):
  // no preview scrim / upgrade sheet (that sells a member their own
  // membership) and no live lab (nothing unlocks on a failed read) — the
  // honest words instead. Before the first read lands (`!resolved`) the old
  // member-favouring open stands.
  const unknownMemberOpen = (): boolean => {
    if (gate === 'unconfirmed') {
      notify('Membership not confirmed', MEMBERSHIP_NOT_CONFIRMED);
      return true;
    }
    if (gate === 'checking' && resolved) {
      notify('One moment', 'Still checking your account. Try again in a moment.');
      return true;
    }
    return false;
  };
  const open = (leaf: LabLeaf) => {
    if (!leaf.route) return;
    const now = Date.now();
    if (now - lastOpenAt.current < 600) return;
    lastOpenAt.current = now;
    if (memberOnlyLeaf(leaf) && gate !== 'open' && unknownMemberOpen()) return;
    if (lockedLeaf(leaf)) startLabPreview(leaf.route, leaf.name);
    go(leaf.route, leaf.params);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <Header title={cat.name.toUpperCase()} subtitle={categoryCountLabel(cat)} onBack={() => safeGoBack(navigation)} />
      <ScrollView contentContainerStyle={[styles.scroll, cardColumn, wide]}>
        <Text style={[styles.intro, wide && readingText]}>{cat.description}</Text>

        {cat.families?.map((fam) => (
          <View key={fam.name} style={styles.section}>
            <Text style={styles.familyTitle}>{fam.name}</Text>
            <View style={styles.list}>
              <TabletGrid minTile={360} maxCols={2} gap={8}>
              {fam.labs.map((leaf) => {
                const k = `${fam.name}:${leaf.name}`;
                return (
                  <LabRow
                    key={k}
                    leaf={leaf}
                    expanded={expandedKey === k}
                    onToggle={() => setExpandedKey((cur) => (cur === k ? null : k))}
                    onOpen={() => open(leaf)}
                  />
                );
              })}
              </TabletGrid>
            </View>
          </View>
        ))}

        {cat.labs && cat.labs.length > 0 ? (
          <View style={styles.list}>
            <TabletGrid minTile={360} maxCols={2} gap={8}>
            {cat.labs.map((leaf) => (
              <Fragment key={leaf.name}>
                <LabRow
                  leaf={leaf}
                  expanded={expandedKey === leaf.name}
                  onToggle={() => setExpandedKey((cur) => (cur === leaf.name ? null : leaf.name))}
                  onOpen={() => open(leaf)}
                />
              </Fragment>
            ))}
            </TabletGrid>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Header({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
        <Text style={styles.back}>‹</Text>
      </Pressable>
      <View style={{ flexShrink: 1, flexGrow: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <AccuracyNote compact />
    </View>
  );
}

function LabRow({
  leaf,
  onOpen,
  expanded,
  onToggle,
}: {
  leaf: LabLeaf;
  onOpen: () => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const dev = leaf.status === 'development';
  // Audio Fundamentals labs carry a stable `key`; show a ✓ once its credit is
  // done (R6c). Hook called unconditionally — keyless labs pass '' (never done).
  const done = useLabDone(leaf.key ?? '');
  return (
      // Demoted from a button (QA night 2026-09-01): the row wrapped the
      // real OPEN button — invalid nesting on web, and the outer label
      // swallowed it from screen readers. Semantics live on the name text;
      // its tap bubbles to this wrapper (the ratified Enrollment pattern).
    <Pressable
      onPress={onToggle}
      accessible={false}
      style={({ pressed }) => [styles.row, dev && styles.rowDev, pressed && styles.rowPressed]}
    >
      <Text style={styles.rowCaret}>{expanded ? '▾' : '▸'}</Text>
      <View style={{ flex: 1 }}>
        <View style={styles.rowNameLine}>
          <Text
            style={[styles.rowName, dev && styles.rowNameDev]}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            aria-expanded={expanded}
            accessibilityLabel={`${leaf.name}${done ? ', completed' : ''}${dev ? `, ${DEV_NOTE}` : ''}, ${expanded ? 'expanded' : 'collapsed'}`}
          >
            {leaf.name}
          </Text>
          {done ? <Text style={styles.doneCheck}>✓</Text> : null}
        </View>
        {expanded ? (
          <>
            <Text style={styles.rowBlurb}>{leaf.blurb}</Text>
            {dev ? <Text style={styles.devNote}>{DEV_NOTE}</Text> : null}
          </>
        ) : null}
      </View>
      {expanded && !dev ? (
        <Pressable
          onPress={onOpen}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Open ${leaf.name}`}
          style={({ pressed }) => [styles.openBtn, pressed && styles.rowPressed]}
        >
          <Text style={styles.openBtnText}>OPEN</Text>
        </Pressable>
      ) : dev ? (
        <Text style={styles.soon}>PLANNED</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 10 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  // Category name is AMBER and larger to stand out as a title (owner 2026-08-10).
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, letterSpacing: 1.4, color: colors.amber },
  subtitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.amber, marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 28, gap: 18 },
  intro: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },
  empty: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub, padding: 16 },

  section: { gap: 8 },
  familyTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  list: { gap: 8 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.45)',
    backgroundColor: '#17140c',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rowPressed: { backgroundColor: '#1f1a0e' },
  rowCaret: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.amber, width: 14, textAlign: 'center' },
  // Revealed OPEN button is GREEN (owner 2026-08-10).
  openBtn: { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(55,224,95,.6)', backgroundColor: '#0c1a10', paddingHorizontal: 14, paddingVertical: 8 },
  openBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.green },
  // Planned (not-yet-open) rows read dim + muted, no amber border.
  rowDev: { borderColor: '#2a2a2e', backgroundColor: '#121214' },
  rowNameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowName: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.4, color: colors.textPrimary, flexShrink: 1 },
  doneCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.green },
  rowNameDev: { color: colors.textSub },
  rowBlurb: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, marginTop: 1 },
  devNote: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1, color: '#7a7c80', marginTop: 4 },
  soon: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: '#7a7c80', paddingHorizontal: 4 },
  chevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.amber, paddingHorizontal: 4 },
});
