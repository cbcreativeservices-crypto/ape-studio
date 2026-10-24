/**
 * OnboardingLandingScreen — the one-time page a new user lands on when the
 * onboarding video ends (owner spec 2026-10-09). It shows once per install;
 * "Replay intro video" on the Academy menu plays the video again.
 *
 * REDESIGN (owner decisions 2026-10-22, H1–H11 + compliance H-A; review:
 * Downloads/2026-10-22_LANDING_PAYWALL_DESIGN_REVIEW.md §7). Three weight
 * tiers instead of ten equal-looking choices:
 *
 *   1. THE OFFER — one gold-framed membership card: what you get (three ✓
 *      lines), SEE MEMBERSHIP PLANS (the breathing gold ring), and the SHAPE of
 *      the pricing — "Monthly, yearly, or pay once for lifetime." Never a price
 *      here (H3); prices live on the plans screen and come from the store.
 *   2. THE FREE PATH — "NEW TO AUDIO? START HERE", full width with a FREE tag:
 *      "A short beginner lab. No account needed." It stays one tap away and
 *      clearly free — we are a learning app; a lesson is never hidden.
 *   3. LOOK AROUND — Glossary, Calculators, Labs, and TOPICS & CERTIFICATES
 *      (Explore Topics + Enroll merged, H2), then footer links: Skip to Home
 *      (H1, demoted from a big button), Watch again, Learn more.
 *
 * Members never see the membership card (no marketing to members): it shows
 * only when upsell is allowed, the same rule as Home's corner button.
 *
 * Every choice LEAVES this page (it is shown once): it pops back to the
 * Academy menu and opens the destination from there, so Back from any of them
 * returns to the menu, never here. "Watch again" swaps this page for the video.
 * Membership is the exception: the Paywall opens OVER this page and comes
 * back to it (owner 2026-10-09) — after a guest's sign-up too (H9).
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { navigationRef } from '../../navigation/navigationRef';
import { safeGoBack } from '../../lib/safeGoBack';
import { armLandingReturn } from '../../features/onboarding/landingReturn';
import type { GlossaryParams } from '../glossary/GlossaryScreen';
import { GlassButton } from '../../components/GlassButton';
import { AttractRing } from '../../features/onboarding/AttractCue';
import { ResetIcon } from '../../components/ResetIcon';
import { HomeIcon } from '../../components/HomeIcon';
import { MethodGlyph } from '../../components/MethodIcon';
import { LabsIcon } from '../../components/LabsIcon';
import { MyTopicsIcon } from '../../components/MyTopicsIcon';
import { BrandLogo } from '../../components/BrandLogo';
import { colors, fonts } from '../../theme/tokens';
import { COPY } from '../../lib/copy';
import { useUpsellAllowed } from '../../features/commercial/useTier';

export type OnboardingChoice =
  | 'membership'
  | 'startHere'
  | 'glossary'
  | 'calculators'
  | 'labs'
  | 'topics'
  | 'watchAgain'
  | 'about'
  | 'home';

export function OnboardingLandingScreen({ onChoose }: { onChoose?: (choice: OnboardingChoice) => void }) {
  const insets = useSafeAreaInsets();
  const upsell = useUpsellAllowed();
  // The logo matches the title block's measured height (owner 2026-10-10).
  const [titleH, setTitleH] = useState(0);
  // The membership button glows (the Home Explore ring) until it is tapped once.
  const [memberTapped, setMemberTapped] = useState(false);
  // Logo + gap + title must fit the column: the row is ~9.5 × fontSize + 41 wide.
  const { width } = useWindowDimensions();
  // Smallest phones (< 360 wide): no logo, the original centred title (owner 2026-10-10).
  const showLogo = width >= 360;
  const titleSize = showLogo ? Math.min(32, Math.floor((Math.min(width - 40, 560) - 41) / 9.5)) : 32;
  // "TOPICS & CERTIFICATES" is the longest key in the browse grid: a notch
  // smaller on narrow phones so it stays on one line beside LABS.
  const topicsFont = width < 370 ? 12.5 : 14;

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const choose = (c: OnboardingChoice) => {
    if (onChoose) return onChoose(c);
    // ONE CHOICE PER VISIT (toddler night 2026-10-24). Every choice leaves this
    // page, and the navigation store updates synchronously — so a second tap in
    // the same moment (double tap, two fingers) finds the page no longer
    // focused. It used to carry on past the refused safeGoBack and open its
    // destination too (GLOSSARY + LABS stacked; the Paywall re-armed over a
    // destination, whose purchase then put this one-time page back).
    if (!navigation.isFocused()) return;
    if (c === 'membership') {
      // Over this page, not from the menu: closing the Paywall — or finishing a
      // purchase — comes back HERE to make a choice (owner 2026-10-09).
      armLandingReturn();
      navigation.navigate('Paywall');
      return;
    }
    if (c === 'watchAgain') {
      navigation.replace('IntroVideo', { replay: true });
      return;
    }
    // Back to the Academy menu first, then open the destination from there.
    safeGoBack(navigation);
    if (c === 'home') return;
    const nav = navigationRef as unknown as { navigate: (name: string, params?: object) => void };
    switch (c) {
      case 'startHere':
        return nav.navigate('StartHere');
      case 'glossary': {
        const params: GlossaryParams = { from: 'home' };
        return nav.navigate('Study', { screen: 'Glossary', params, initial: false });
      }
      case 'calculators':
        return nav.navigate('CalcLab');
      case 'labs':
        // The Labs menu opens on its first section, AUDIO FUNDAMENTALS.
        return nav.navigate('EarLab');
      case 'topics':
        // H2 (2026-10-22): one door for Explore Topics + Enroll — they opened
        // the same Awards screen. It opens on the curriculum, where each
        // topic, certificate and program says what it needs.
        return nav.navigate('Awards', { category: 'curriculum', focus: 'topics' });
      case 'about':
        return nav.navigate('About');
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.column}>
        <View style={styles.header}>
          {showLogo && titleH > 0 ? <BrandLogo size={titleH} /> : null}
          <View style={showLogo ? styles.headerText : null} onLayout={(e) => setTitleH(Math.round(e.nativeEvent.layout.height))}>
            <Text style={[styles.eyebrow, showLogo && styles.left]}>WELCOME TO THE ACADEMY</Text>
            <Text style={[styles.title, showLogo && styles.left, { fontSize: titleSize, lineHeight: Math.round(titleSize * 1.25) }]} accessibilityRole="header">
              {'Where would you\nlike to begin?'}
            </Text>
          </View>
        </View>

        {/* 1 · THE OFFER — a gold-framed card, the one loud thing on the page. */}
        {upsell ? (
          <LinearGradient colors={['#17120a', '#0a0805']} style={styles.offerCard}>
            <Text style={styles.offerEyebrow}>{COPY.membershipEyebrow}</Text>
            <View style={styles.points}>
              {COPY.membershipPoints.map((line) => (
                <View key={line} style={styles.pointRow}>
                  <Text style={styles.pointCheck}>✓</Text>
                  <Text style={styles.pointText}>{line}</Text>
                </View>
              ))}
            </View>
            {/* the Home Explore button's breathing gold ring (owner 2026-10-19),
                until the learner taps it */}
            <View style={styles.offerButton}>
              <GlassButton
                label={COPY.seeMembershipPlans}
                tint="gold"
                height={58}
                fontSize={18}
                onPress={() => {
                  setMemberTapped(true);
                  choose('membership');
                }}
              />
              <AttractRing active={!memberTapped} radius={8.5} />
            </View>
            {/* H3: the shape of the pricing, never a price. */}
            <Text style={styles.offerShape}>{COPY.membershipShape}</Text>
          </LinearGradient>
        ) : null}

        {/* 2 · THE FREE PATH — full width, plainly FREE, one tap away. */}
        <Pressable
          onPress={() => choose('startHere')}
          accessibilityRole="button"
          accessibilityLabel={`New to audio? Start here. Free. ${COPY.startHereCaption}`}
          style={({ pressed }) => [styles.freeOuter, pressed && styles.freePressed]}
        >
          <LinearGradient colors={['#23252a', '#111215']} style={styles.freeRow}>
            <View style={styles.freeTopEdge} />
            <View style={styles.freeText}>
              <View style={styles.freeHead}>
                <View style={styles.freePill}>
                  <Text style={styles.freePillText}>FREE</Text>
                </View>
                <Text style={styles.freeLabel}>NEW TO AUDIO? START HERE</Text>
              </View>
              <Text style={styles.freeCaption}>{COPY.startHereCaption}</Text>
            </View>
            <Text style={styles.freeChevron}>›</Text>
          </LinearGradient>
        </Pressable>

        {/* 3 · LOOK AROUND */}
        <Text style={[styles.eyebrow, styles.sectionEyebrow]}>OR JUMP RIGHT IN</Text>
        <View style={styles.gridRow}>
          <View style={styles.half}>
            <GlassButton label="GLOSSARY" tint="steel" height={48} fontSize={14} icon={<MethodGlyph method="glossary" size={22} />} onPress={() => choose('glossary')} />
          </View>
          <View style={styles.half}>
            <GlassButton label="CALCULATORS" tint="steel" height={48} fontSize={14} icon={<Text style={styles.sigma}>Σ</Text>} onPress={() => choose('calculators')} />
          </View>
        </View>
        <View style={styles.gridRow}>
          {/* LABS is short; TOPICS & CERTIFICATES takes the rest of the row. */}
          <View style={styles.narrow}>
            <GlassButton label="LABS" tint="steel" height={48} fontSize={14} icon={<LabsIcon color={colors.amber} size={18} />} onPress={() => choose('labs')} />
          </View>
          <View style={styles.wide}>
            <GlassButton label={COPY.topicsAndCertificates} tint="steel" height={48} fontSize={topicsFont} icon={<MyTopicsIcon size={20} />} onPress={() => choose('topics')} />
          </View>
        </View>

        <View style={styles.links}>
          {/* H1: the "do nothing" choice is a link, not a primary button. */}
          <Pressable
            style={styles.link}
            onPress={() => choose('home')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Skip to the Home screen"
          >
            <HomeIcon filled size={15} />
            <Text style={styles.linkText}>{COPY.skipToHome}</Text>
          </Pressable>
          <Pressable
            style={styles.link}
            onPress={() => choose('watchAgain')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Watch the intro video again"
          >
            <ResetIcon color={REPLAY_GREEN} size={15} />
            <Text style={[styles.linkText, styles.replayText]}>Watch again</Text>
          </Pressable>
          <Pressable
            style={styles.link}
            onPress={() => choose('about')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Learn more about the Academy"
          >
            <Text style={styles.linkText}>Learn more about the Academy</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

// Same dim green as "Replay intro" on the Academy menu (owner 2026-10-09).
const REPLAY_GREEN = '#2a9a48';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  content: { paddingHorizontal: 20, flexGrow: 1, justifyContent: 'center' },
  column: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  eyebrow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: colors.amberLabel,
    textAlign: 'center',
  },
  sectionEyebrow: { marginTop: 24, marginBottom: 10 },
  title: {
    fontFamily: fonts.oswaldBold,
    fontSize: 32,
    lineHeight: 40,
    color: colors.amber,
    textAlign: 'center',
    marginTop: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginBottom: 20 },
  headerText: { marginLeft: 16 },
  left: { textAlign: 'left' },

  // ── 1 · the offer card ──
  offerCard: {
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#8a6a1f',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  offerEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2, color: colors.amber },
  points: { gap: 5, marginTop: 9 },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pointCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, lineHeight: 18.5, color: colors.greenBright, width: 12 },
  pointText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18.5, color: colors.textSecondary },
  offerButton: { marginTop: 14 },
  offerShape: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.textSub,
    textAlign: 'center',
    marginTop: 9,
  },

  // ── 2 · the free path: a steel glass row with a lit FREE tag ──
  freeOuter: { marginTop: 14, borderRadius: 12 },
  freePressed: { opacity: 0.8, transform: [{ translateY: 1 }] },
  freeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#2f6a3e',
    paddingVertical: 13,
    paddingLeft: 16,
    paddingRight: 12,
    overflow: 'hidden',
  },
  freeTopEdge: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  freeText: { flex: 1 },
  freeHead: { flexDirection: 'row', alignItems: 'center', gap: 9, flexWrap: 'wrap' },
  freePill: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.green,
    backgroundColor: '#0f2a17',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  freePillText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.greenBright },
  freeLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.9, color: colors.textPrimary },
  freeCaption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 18, color: colors.textSub, marginTop: 5 },
  freeChevron: { fontFamily: fonts.oswaldMedium, fontSize: 30, lineHeight: 34, color: colors.greenBright, marginLeft: 8 },

  // ── 3 · browse grid ──
  gridRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  half: { flex: 1 },
  narrow: { width: '36%' },
  wide: { flex: 1 },

  links: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 22,
    rowGap: 10,
  },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  linkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.6, color: colors.amberLabel },
  replayText: { color: REPLAY_GREEN },
  // The calculators' purple sigma, as on "The Academy at a glance".
  sigma: { fontSize: 17, lineHeight: 19, fontWeight: '700', color: colors.purple },
});
