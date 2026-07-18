/**
 * AwardsScreen — the two Award levels (Specialization Certificate · Professional
 * Certificate Program) as a horizontal SWIPE pager: open lands on the tapped
 * category, swipe left/right moves between them. No diploma / master tiers (user
 * request 2026-07-18). Content is data-only (awardsData.ts). Bottom nav hidden;
 * back chevron exits.
 */
import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, ScrollView, StyleSheet, Text, View, type ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import { ScreenIntroOverlay } from '../../features/intro/ScreenIntroOverlay';
import { awardPage, AWARD_ORDER, type AwardPage, type AwardTier } from './awardsData';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Awards'>;

const { width: SCREEN_W } = Dimensions.get('window');

function TierBlock({ tier, accent }: { tier: AwardTier; accent: string }) {
  const [policyOpen, setPolicyOpen] = useState(false);
  return (
    <View style={[styles.tier, { borderColor: accent }]}>
      {tier.level ? <Text style={[styles.tierLevel, { color: accent }]}>{tier.level.toUpperCase()}</Text> : null}
      <Text style={styles.tierTitle}>{tier.title}</Text>

      {/* Pre-reqs and requirements side by side (Booth 2026-07-16). */}
      {(tier.prerequisite?.length || tier.requirements?.length) ? (
        <View style={styles.twoCol}>
          {tier.prerequisite && tier.prerequisite.length > 0 ? (
            <View style={[styles.group, styles.col]}>
              <Text style={[styles.groupHead, { color: accent }]}>PRE-REQUISITES</Text>
              {tier.prerequisite.map((r) => (
                <View key={r} style={styles.row}>
                  <Text style={[styles.check, { color: accent }]}>✓</Text>
                  <Text style={styles.rowText}>{r}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {tier.requirements && tier.requirements.length > 0 ? (
            <View style={[styles.group, styles.col]}>
              <Text style={[styles.groupHead, { color: accent }]}>REQUIREMENTS</Text>
              {tier.requirements.map((r) => (
                <View key={r} style={styles.row}>
                  <Text style={[styles.check, { color: accent }]}>✓</Text>
                  <Text style={styles.rowText}>{r}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {tier.programs && tier.programs.length > 0 ? (
        <View style={styles.group}>
          <Text style={[styles.groupHead, { color: accent }]}>PROGRAMS</Text>
          {tier.programs.map((p) => (
            <View key={p} style={styles.row}>
              <Text style={[styles.bulletDot, { color: accent }]}>•</Text>
              <Text style={styles.rowText}>{p}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {tier.perks && tier.perks.length > 0 ? (
        <View style={styles.group}>
          <Text style={[styles.groupHead, { color: accent }]}>GRADUATES RECEIVE</Text>
          {tier.perks.map((p) => (
            <View key={p} style={styles.row}>
              <Text style={[styles.bulletDot, { color: accent }]}>•</Text>
              <Text style={styles.rowText}>{p}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {tier.note ? <Text style={styles.note}>{tier.note}</Text> : null}

      {tier.policy ? (
        <View style={styles.policy}>
          <Pressable
            style={styles.policyHeader}
            onPress={() => setPolicyOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: policyOpen }}
            accessibilityLabel={tier.policy.title}
          >
            <Text style={[styles.policyTitle, { color: accent }]}>{tier.policy.title.toUpperCase()}</Text>
            <Text style={[styles.policyChevron, { color: accent }]}>{policyOpen ? '▾' : '▸'}</Text>
          </Pressable>
          {policyOpen ? (
            <View style={styles.policyBody}>
              {tier.policy.paragraphs.map((para, i) => (
                <Text key={i} style={styles.policyPara}>
                  {para}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** One full-width award page (its own vertical scroll). */
function AwardPageView({ page }: { page: AwardPage }) {
  return (
    <View style={{ width: SCREEN_W }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>{page.intro}</Text>

        {page.tiers.map((tier) => (
          <TierBlock key={tier.title} tier={tier} accent={page.accent} />
        ))}
      </ScrollView>
    </View>
  );
}

export function AwardsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const startIdx = Math.max(0, AWARD_ORDER.indexOf(route.params.category));
  const [idx, setIdx] = useState(startIdx);
  const listRef = useRef<FlatList<(typeof AWARD_ORDER)[number]>>(null);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const i = viewableItems[0]?.index;
    if (i != null) setIdx(i);
  }).current;

  const current = awardPage(AWARD_ORDER[idx]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        {/* Clear labeled return button at the top (user request 2026-07-18). */}
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.backBtnText}>‹ BACK</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={[styles.title, { color: current.accent }]}>{current.headline}</Text>
          <Text style={styles.subtitle}>Pro Audio Training Academy · swipe ‹ ›</Text>
        </View>
      </View>

      {/* Page dots — each in its category's accent when active. */}
      <View style={styles.dots}>
        {AWARD_ORDER.map((c, i) => {
          const accent = awardPage(c).accent;
          return (
            <View
              key={c}
              style={[
                styles.dot,
                i === idx && { backgroundColor: accent, width: 20 },
              ]}
            />
          );
        })}
      </View>

      <FlatList
        ref={listRef}
        data={AWARD_ORDER}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c}
        initialScrollIndex={startIdx}
        getItemLayout={(_d, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => <AwardPageView page={awardPage(item)} />}
      />

      {/* Intro placeholder (Booth 2026-07-18) — always shown in dev bypass. */}
      <ScreenIntroOverlay introKey="awards" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingBottom: 8 },
  backBtn: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 11,
    backgroundColor: '#161616',
  },
  backBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.textSecondary },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, letterSpacing: 2 },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingBottom: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2e2e2e' },

  scroll: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 44, gap: 16 },

  intro: { fontFamily: fonts.barlowRegular, fontSize: 16.5, lineHeight: 25, color: colors.textSecondary },

  tier: {
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#17181a',
    padding: 18,
    gap: 12,
  },
  tierLevel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 2 },
  tierTitle: { fontFamily: fonts.oswaldMedium, fontSize: 21, lineHeight: 26, color: colors.textPrimary },

  // Pre-reqs | Requirements side by side; each column wraps its own list.
  twoCol: { flexDirection: 'row', gap: 16, marginTop: 3 },
  col: { flex: 1 },
  group: { gap: 7, marginTop: 3 },
  groupHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.8 },
  row: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  check: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, lineHeight: 23, width: 15 },
  bulletDot: { fontFamily: fonts.barlowRegular, fontSize: 17, lineHeight: 23, width: 15 },
  rowText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },

  note: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Collapsible policy section, set off by a rule.
  policy: { marginTop: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2b2d' },
  policyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  policyTitle: { flex: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.4 },
  policyChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 13 },
  policyBody: { gap: 9, marginTop: 10 },
  policyPara: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: '#c4c4c4' },
});
