/**
 * FirstRunSampler — the first-launch connected-path screen (plan §2.1 + §2.3).
 *
 * Three modes:
 *  - `initial`  → "What would you like to do first?" (the full path, start anywhere)
 *  - `recommend`→ contextual: recaps the last stop and RECOMMENDS the connected
 *                 next stops (e.g. after Decibel → Calculate / Measure / Room),
 *                 plus "Choose something different" and "Take me to Home"
 *  - `menu`     → generic "What would you like to explore next?" (full path again)
 *
 * Sampled stops show a green ✓ Explored chip and stay selectable (Revisit).
 * Purely presentational: the coordinator owns navigation, the visited set, the
 * last stop, and completion. The `#samplerpreview` harness drives it locally.
 */
import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors, fonts } from '../../theme/tokens';
import { animationsAllowed } from '../settings/a11y';
import type { OnboardingChoice } from './onboardingFlow';
import { SAMPLER_STOPS, getStop, type StopId } from './samplerStops';

type Mode = 'initial' | 'recommend' | 'menu';

// ---- Clean line glyphs, one per stop ----------------------------------------
function WaveIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12c2 0 2-7 4-7s2 14 4 14 2-11 4-11 2 8 4 8 2-4 4-4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function DecibelIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={13} width={3.4} height={7} rx={1} fill={color} opacity={0.55} />
      <Rect x={8.3} y={9} width={3.4} height={11} rx={1} fill={color} opacity={0.75} />
      <Rect x={13.6} y={5} width={3.4} height={15} rx={1} fill={color} />
      <Line x1={3} y1={20} x2={21} y2={20} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}
function CalcIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={3} width={14} height={18} rx={2.4} stroke={color} strokeWidth={1.7} />
      <Rect x={7.8} y={5.6} width={8.4} height={3.2} rx={1} fill={color} opacity={0.5} />
      <Circle cx={9} cy={13} r={1.1} fill={color} />
      <Circle cx={12} cy={13} r={1.1} fill={color} />
      <Circle cx={15} cy={13} r={1.1} fill={color} />
      <Circle cx={9} cy={16.6} r={1.1} fill={color} />
      <Circle cx={12} cy={16.6} r={1.1} fill={color} />
      <Circle cx={15} cy={16.6} r={1.1} fill={color} />
    </Svg>
  );
}
function RoomIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={5} width={17} height={14} rx={1.6} stroke={color} strokeWidth={1.7} />
      <Circle cx={8} cy={12} r={1.6} fill={color} />
      <Path d="M9.6 12H12M12 12l4 -3.2M12 12l4 3.2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
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
function CompassIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={1.7} />
      <Path d="M15.2 8.8l-1.8 4.6-4.6 1.8 1.8-4.6z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" fill={color} fillOpacity={0.25} />
    </Svg>
  );
}

const STOP_ICON: Record<StopId, (p: { color: string; size: number }) => ReactElement> = {
  fundamentals: WaveIcon,
  decibel: DecibelIcon,
  calc: CalcIcon,
  acoustics: RoomIcon,
  splmeter: MeterIcon,
  career: CompassIcon,
};

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

function StopCard({ id, visited, onPress }: { id: StopId; visited: boolean; onPress: () => void }) {
  const stop = getStop(id);
  const Icon = STOP_ICON[id];
  const { accent, label, blurb } = stop;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={visited ? `${label}. Explored. Revisit.` : label}
      accessibilityHint={blurb}
      style={({ pressed }) => [styles.card, { borderColor: hexA(accent, 0.4) }, pressed && styles.cardPressed]}
    >
      <View style={[styles.iconTile, { backgroundColor: hexA(accent, 0.12), borderColor: hexA(accent, 0.35) }]}>
        <Icon color={accent} size={26} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{label}</Text>
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
  lastStop,
  visited,
  onSelect,
  onChooseDifferent,
  onHome,
}: {
  mode: Mode;
  /** The stop just sampled — drives the recap + recommendations in `recommend`. */
  lastStop?: StopId;
  visited: OnboardingChoice[];
  onSelect: (id: StopId) => void;
  /** `recommend` → open the full menu of every stop. */
  onChooseDifferent: () => void;
  /** Leave onboarding for Home (Skip on initial, "take me to Home" elsewhere). */
  onHome: () => void;
}) {
  const insets = useSafeAreaInsets();
  const visitedSet = useMemo(() => new Set(visited), [visited]);

  const anim = useRef(new Animated.Value(animationsAllowed() ? 0 : 1)).current;
  useEffect(() => {
    if (animationsAllowed()) {
      Animated.timing(anim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    } else {
      anim.setValue(1);
    }
    // Re-run the entrance each time the mode/stop changes so a returning user
    // feels the new screen arrive.
  }, [anim, mode, lastStop]);

  const recapStop = mode === 'recommend' && lastStop ? getStop(lastStop) : null;
  const cardIds: StopId[] = recapStop
    ? recapStop.next
    : SAMPLER_STOPS.map((s) => s.id);

  const eyebrow = mode === 'initial' ? 'WELCOME' : mode === 'recommend' ? 'NICE WORK' : 'KEEP EXPLORING';
  const title =
    mode === 'initial'
      ? 'What would you like to do first?'
      : mode === 'recommend' && recapStop
        ? recapStop.recap
        : 'What would you like to explore next?';
  const sub =
    mode === 'initial'
      ? 'Start anywhere — each step connects to the next.'
      : mode === 'recommend'
        ? 'Here’s where this leads — or pick your own way.'
        : 'Pick any part of the Academy, or head to your Home screen.';

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
          }}
        >
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.rule} />
          <Text style={styles.sub}>{sub}</Text>

          <View style={styles.cards}>
            {cardIds.map((id) => (
              <StopCard key={id} id={id} visited={visitedSet.has(id)} onPress={() => onSelect(id)} />
            ))}
          </View>

          {mode === 'recommend' ? (
            <Pressable
              onPress={onChooseDifferent}
              accessibilityRole="button"
              accessibilityLabel="Choose something different"
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.secondaryText}>Choose something different</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={onHome}
            accessibilityRole="button"
            accessibilityLabel={mode === 'initial' ? 'Skip for now, go to Home' : 'Take me to the Home screen'}
            style={({ pressed }) => [mode === 'initial' ? styles.skipBtn : styles.homeBtn, pressed && { opacity: 0.75 }]}
          >
            <Text style={mode === 'initial' ? styles.skipText : styles.homeText}>
              {mode === 'initial' ? 'Skip for now' : 'Take me to the Home screen'}
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
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 3, color: colors.amberLabel, marginBottom: 8 },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 26, lineHeight: 31, color: colors.textPrimary },
  rule: { width: 46, height: 2, backgroundColor: colors.amber, borderRadius: 1, marginTop: 12, marginBottom: 12 },
  sub: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 21, color: colors.textSub, marginBottom: 22 },

  cards: { gap: 12, marginBottom: 20 },
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
  iconTile: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
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

  secondaryBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 18, marginBottom: 6 },
  secondaryText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: colors.textSub },

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
