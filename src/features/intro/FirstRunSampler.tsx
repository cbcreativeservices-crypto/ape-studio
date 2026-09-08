/**
 * FirstRunSampler — the first-launch guided-exploration screen (plan §2.1).
 *
 * One presentational component, two modes:
 *  - `initial`     → "What would you like to do first?"  + Skip for now
 *  - `continuation`→ "What would you like to explore next?" + the reflective
 *                    "Was that helpful?" micro-question + "take me to Home"
 *
 * Choices already sampled show a green ✓ Explored chip and read "Revisit".
 * Purely presentational: the coordinator owns navigation, the visited set, and
 * completion; this renders state and reports taps via callbacks. The preview
 * harness (`#samplerpreview`) drives it with local state.
 */
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors, fonts } from '../../theme/tokens';
import { animationsAllowed } from '../settings/a11y';
import type { OnboardingChoice } from './onboardingFlow';

type Mode = 'initial' | 'continuation';

export type SamplerChoiceMeta = {
  id: OnboardingChoice;
  title: string;
  blurb: string;
  accent: string;
  Icon: (props: { color: string; size: number }) => ReactElement;
};

// ---- Clean line glyphs (accent-tinted), one per starting choice -------------
function MagnifierIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={10.5} cy={10.5} r={6.5} stroke={color} strokeWidth={1.8} />
      <Line x1={15.4} y1={15.4} x2={20} y2={20} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={8} y1={10.5} x2={13} y2={10.5} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
function BookIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 6.2C10.4 5 8.2 4.6 5.5 4.9C4.7 5 4 5.7 4 6.5V17c0 .9.8 1.6 1.7 1.5C8 18.2 10.3 18.6 12 19.8"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 6.2C13.6 5 15.8 4.6 18.5 4.9C19.3 5 20 5.7 20 6.5V17c0 .9-.8 1.6-1.7 1.5C16 18.2 13.7 18.6 12 19.8"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1={12} y1={6.2} x2={12} y2={19.8} stroke={color} strokeWidth={1.4} />
    </Svg>
  );
}
function MeterIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 14a8 8 0 0 1 16 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={12} y1={14} x2={16} y2={9.5} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={12} cy={14} r={1.6} fill={color} />
      <Rect x={4} y={17} width={16} height={2.2} rx={1.1} fill={color} opacity={0.35} />
    </Svg>
  );
}

/** The three starting choices, in order, with on-brand accents. */
export const SAMPLER_CHOICES: SamplerChoiceMeta[] = [
  {
    id: 'glossary',
    title: 'Search the glossary',
    blurb: 'Look up a professional audio term — no account needed.',
    accent: colors.cyanBright,
    Icon: MagnifierIcon,
  },
  {
    id: 'learn',
    title: 'Learn a topic',
    blurb: 'Browse subjects and structured lessons.',
    accent: colors.blue,
    Icon: BookIcon,
  },
  {
    id: 'tools',
    title: 'Use an audio tool',
    blurb: 'Explore the live meters and measurement tools.',
    accent: colors.amber,
    Icon: MeterIcon,
  },
];

function CheckIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5l4.2 4.3L19 7" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function ChevronIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5l7 7-7 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChoiceCard({
  meta,
  visited,
  onPress,
}: {
  meta: SamplerChoiceMeta;
  visited: boolean;
  onPress: () => void;
}) {
  const { Icon, accent, title, blurb } = meta;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={visited ? `${title}. Explored. Revisit.` : title}
      accessibilityHint={blurb}
      style={({ pressed }) => [
        styles.card,
        { borderColor: hexA(accent, 0.4) },
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.iconTile, { backgroundColor: hexA(accent, 0.12), borderColor: hexA(accent, 0.35) }]}>
        <Icon color={accent} size={26} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardBlurb}>{blurb}</Text>
      </View>
      {visited ? (
        <View style={styles.exploredChip}>
          <CheckIcon color={colors.green} size={13} />
          <Text style={styles.exploredText}>EXPLORED</Text>
        </View>
      ) : (
        <ChevronIcon color={colors.textMuted} size={20} />
      )}
    </Pressable>
  );
}

export function FirstRunSampler({
  mode,
  visited,
  onSelect,
  onHome,
}: {
  mode: Mode;
  visited: OnboardingChoice[];
  onSelect: (choice: OnboardingChoice) => void;
  /** Leave onboarding for the Home screen (Skip on initial, "take me to Home"
   *  on continuation). The coordinator marks onboarding complete. */
  onHome: () => void;
}) {
  const insets = useSafeAreaInsets();
  const visitedSet = useMemo(() => new Set(visited), [visited]);
  const allExplored = visitedSet.size >= SAMPLER_CHOICES.length;

  // Gentle entrance; skipped entirely under Reduce Motion.
  const anim = useRef(new Animated.Value(animationsAllowed() ? 0 : 1)).current;
  const [helpful, setHelpful] = useState<null | 'yes' | 'no'>(null);
  useEffect(() => {
    if (animationsAllowed()) {
      Animated.timing(anim, { toValue: 1, duration: 340, useNativeDriver: true }).start();
    }
  }, [anim]);

  const isInitial = mode === 'initial';
  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
          }}
        >
          <Text style={styles.eyebrow}>{isInitial ? 'WELCOME' : 'NICE WORK'}</Text>
          <Text style={styles.title}>
            {isInitial ? 'What would you like to do first?' : 'What would you like to explore next?'}
          </Text>
          <View style={styles.rule} />
          <Text style={styles.sub}>
            {isInitial
              ? 'Pick a starting point — you can come back and try the others.'
              : 'Visit another part of Pro Audio Training Academy, or continue to your Home screen.'}
          </Text>

          {/* Reflective micro-question — continuation only, optional, one-tap. */}
          {!isInitial ? (
            <View style={styles.helpfulBar}>
              <Text style={styles.helpfulQ}>Was that helpful?</Text>
              {helpful == null ? (
                <View style={styles.helpfulBtns}>
                  <Pressable
                    onPress={() => setHelpful('yes')}
                    accessibilityRole="button"
                    accessibilityLabel="Yes, that was helpful"
                    style={styles.helpfulBtn}
                  >
                    <Text style={styles.helpfulBtnText}>Yes</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setHelpful('no')}
                    accessibilityRole="button"
                    accessibilityLabel="Not really"
                    style={styles.helpfulBtn}
                  >
                    <Text style={styles.helpfulBtnText}>Not really</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.helpfulThanks}>Thanks — noted.</Text>
              )}
            </View>
          ) : null}

          <View style={styles.cards}>
            {SAMPLER_CHOICES.map((meta) => (
              <ChoiceCard
                key={meta.id}
                meta={meta}
                visited={visitedSet.has(meta.id)}
                onPress={() => onSelect(meta.id)}
              />
            ))}
          </View>

          <Pressable
            onPress={onHome}
            accessibilityRole="button"
            accessibilityLabel={isInitial ? 'Skip for now, go to Home' : "I'm ready — take me to the Home screen"}
            style={({ pressed }) => [
              isInitial ? styles.skipBtn : styles.homeBtn,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={isInitial ? styles.skipText : styles.homeText}>
              {isInitial ? 'Skip for now' : allExplored ? 'Take me to the Home screen' : "I’m ready — take me to the Home screen"}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/** Hex + alpha → rgba() string (tokens are #rrggbb). */
function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBgDeep },
  scroll: { paddingHorizontal: 22, maxWidth: 480, width: '100%', alignSelf: 'center' },
  eyebrow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 3,
    color: colors.amberLabel,
    marginBottom: 8,
  },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 27, lineHeight: 32, color: colors.textPrimary },
  rule: { width: 46, height: 2, backgroundColor: colors.amber, borderRadius: 1, marginTop: 12, marginBottom: 12 },
  sub: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 21, color: colors.textSub, marginBottom: 22 },

  helpfulBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 20,
  },
  helpfulQ: { fontFamily: fonts.barlowSemiBold, fontSize: 14, color: colors.textSecondary },
  helpfulBtns: { flexDirection: 'row', gap: 8 },
  helpfulBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: hexA('#37e05f', 0.5),
    backgroundColor: hexA('#37e05f', 0.08),
  },
  helpfulBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.5, color: colors.green },
  helpfulThanks: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textSub },

  cards: { gap: 12, marginBottom: 26 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#141310',
  },
  cardPressed: { backgroundColor: '#1b1a16' },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 3 },
  cardTitle: { fontFamily: fonts.oswaldMedium, fontSize: 17.5, color: colors.textPrimary },
  cardBlurb: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSub },
  exploredChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: hexA('#37e05f', 0.45),
    backgroundColor: hexA('#37e05f', 0.1),
  },
  exploredText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1, color: colors.green },

  skipBtn: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 20 },
  skipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 1, color: colors.textSub },
  homeBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: hexA('#37e05f', 0.7),
    backgroundColor: hexA('#37e05f', 0.1),
  },
  homeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.5, color: colors.green },
});
