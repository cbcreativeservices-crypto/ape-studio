/**
 * OnboardingLandingScreen — the one-time page a new user lands on when the
 * onboarding video ends (owner spec 2026-10-09). It shows once per install;
 * "Replay intro video" on the Academy menu plays the video again.
 *
 * Choices, in the owner's order: MEMBERSHIP first and biggest, then Start
 * Here, then the four areas (Glossary, Calculators, Labs → the Audio
 * Fundamentals section only, Explore topics), then Enroll. "Watch again" and
 * "Learn more about the Academy" are small text links at the foot.
 *
 * Members never see the Membership pitch (no marketing to members): the key
 * is hidden when upsell is not allowed, the same rule as Home's corner button.
 *
 * Every choice LEAVES this page (it is shown once): it pops back to the
 * Academy menu and opens the destination from there, so Back from any of them
 * returns to the menu, never here. "Watch again" swaps this page for the video.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { navigationRef } from '../../navigation/navigationRef';
import { safeGoBack } from '../../lib/safeGoBack';
import type { GlossaryParams } from '../glossary/GlossaryScreen';
import { GlassButton } from '../../components/GlassButton';
import { ResetIcon } from '../../components/ResetIcon';
import { colors, fonts } from '../../theme/tokens';
import { useUpsellAllowed } from '../../features/commercial/useTier';

export type OnboardingChoice =
  | 'membership'
  | 'startHere'
  | 'glossary'
  | 'calculators'
  | 'labs'
  | 'explore'
  | 'enroll'
  | 'watchAgain'
  | 'about'
  | 'home';

export function OnboardingLandingScreen({ onChoose }: { onChoose?: (choice: OnboardingChoice) => void }) {
  const insets = useSafeAreaInsets();
  const upsell = useUpsellAllowed();

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const choose = (c: OnboardingChoice) => {
    if (onChoose) return onChoose(c);
    if (c === 'watchAgain') {
      navigation.replace('IntroVideo', { replay: true });
      return;
    }
    // Back to the Academy menu first, then open the destination from there.
    safeGoBack(navigation);
    if (c === 'home') return;
    const nav = navigationRef as unknown as { navigate: (name: string, params?: object) => void };
    switch (c) {
      case 'membership':
        return nav.navigate('Paywall');
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
      case 'explore':
        return nav.navigate('Awards', { category: 'curriculum', focus: 'topics' });
      case 'enroll':
        return nav.navigate('Awards', { category: 'enrollment', focus: 'browse' });
      case 'about':
        return nav.navigate('About');
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 }]}
    >
      <View style={styles.column}>
        <Text style={styles.eyebrow}>WELCOME TO THE ACADEMY</Text>
        <Text style={styles.title} accessibilityRole="header">
          {'Where would you\nlike to begin?'}
        </Text>

        {upsell ? (
          <View style={styles.block}>
            <GlassButton label="MEMBERSHIP" tint="gold" height={62} fontSize={20} onPress={() => choose('membership')} />
            <Text style={styles.caption}>
              Become a member and unlock all of the academy’s learning resources.
            </Text>
          </View>
        ) : null}

        <View style={styles.block}>
          <GlassButton label="NEW TO AUDIO? START HERE" tint="green" height={54} fontSize={17} onPress={() => choose('startHere')} />
          <Text style={styles.caption}>The free beginner lab is the place to start your journey.</Text>
        </View>

        {/* Owner 2026-10-09: a second big choice — straight to the Academy menu. */}
        <View style={styles.block}>
          <GlassButton label="TAKE ME TO THE HOME SCREEN" tint="steel" height={54} fontSize={16} onPress={() => choose('home')} />
        </View>

        <Text style={[styles.eyebrow, styles.sectionEyebrow]}>OR JUMP RIGHT IN</Text>
        <View style={styles.grid}>
          <View style={styles.cell}>
            <GlassButton label="GLOSSARY" tint="steel" height={48} fontSize={14} onPress={() => choose('glossary')} />
          </View>
          <View style={styles.cell}>
            <GlassButton label="CALCULATORS" tint="steel" height={48} fontSize={14} onPress={() => choose('calculators')} />
          </View>
          <View style={styles.cell}>
            <GlassButton label="LABS" tint="steel" height={48} fontSize={14} onPress={() => choose('labs')} />
          </View>
          <View style={styles.cell}>
            <GlassButton label="EXPLORE TOPICS" tint="steel" height={48} fontSize={14} onPress={() => choose('explore')} />
          </View>
        </View>

        <View style={styles.block}>
          <GlassButton
            label="ENROLL IN TOPICS, CERTIFICATES & PROGRAMS"
            tint="blue"
            height={50}
            fontSize={13}
            onPress={() => choose('enroll')}
          />
        </View>

        <View style={styles.links}>
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
  sectionEyebrow: { marginTop: 26, marginBottom: 10 },
  title: {
    fontFamily: fonts.oswaldBold,
    fontSize: 32,
    lineHeight: 40,
    color: colors.amber,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
  },
  block: { marginTop: 14 },
  caption: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textSub,
    textAlign: 'center',
    marginTop: 7,
    paddingHorizontal: 8,
  },
  captionStrong: { fontFamily: fonts.barlowSemiBold, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  cell: { width: '50%', paddingHorizontal: 5, paddingBottom: 10 },
  links: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 24,
    rowGap: 12,
  },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  linkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.6, color: colors.amberLabel },
  replayText: { color: REPLAY_GREEN },
});
