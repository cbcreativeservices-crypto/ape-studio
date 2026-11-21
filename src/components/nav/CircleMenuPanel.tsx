/**
 * CircleMenuPanel — the OPEN circle menu (owner-approved mockup 2026-11-20,
 * scratchpad qnav-mock/index.html: its geometry, colours and motion are the
 * spec). Loaded after the first frame by CircleMenu (app-start budget).
 *
 * The panel rises to half the screen over a dimmed screen; the twelve places
 * fly OUT of the corner MENU button into one clock-face ring with an empty
 * centre, the circle nearest the button first, and fold back into it on the
 * way down. The current place is lit (its colour ring, a glow and a coloured
 * word) the same way on both phones; the others are softly dimmed. Under
 * Reduce Motion / Low-Light everything simply fades in place.
 *
 * Close: drag down (from the panel or any circle), tap the dim area, tap the
 * grip, or Android BACK (CircleMenu). Every place is a plain button, so a
 * screen reader reaches each one by name, in clock order from 12; no drag is
 * ever needed.
 */
import { memo, useMemo, type RefObject } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlackFaceBg, PanelScrew } from '../ElevatedFrame';
import Svg, { Circle, Defs, RadialGradient, Stop, SvgXml } from 'react-native-svg';
import { fonts } from '../../theme/tokens';
import { A11Y_HIDDEN } from '../../features/settings/a11y';
import { COMMUNITY_VISIBLE } from '../../config/communityVisible';
import { CommunityBadge } from '../../features/directory/CommunityBadge';
import { badgeA11y, type InboxState } from '../../features/directory/inboxCounts';
import { ProgressFadersLit } from './NavIcon';
import { DRAWN_ICON, iconXml } from './circleMenuIconArt';
import {
  CIRCLE,
  LABEL_POS,
  circlePlaces,
  dragTop,
  flight,
  settleOpen,
  slotCentre,
  spreadRanks,
  type Place,
  type PlaceKey,
  type RingGeometry,
} from './circleMenuPlaces';

export type CircleMenuPanelProps = {
  /** 0 closed … 1 open. */
  p: SharedValue<number>;
  geo: RingGeometry;
  width: number;
  height: number;
  insetTop: number;
  here: PlaceKey | null;
  /** false = Reduce Motion / Low-Light: fade in place. */
  motion: boolean;
  /** Fully open: the circles take taps. */
  live: boolean;
  /** Any part on screen. */
  shown: boolean;
  inbox: InboxState;
  onPick: (key: PlaceKey) => void;
  onClose: () => void;
  settleTo: (open: boolean, velocityPtPerS?: number) => void;
  firstCircleRef: RefObject<View | null>;
};

const ICON = 28;
/** A circle's tap box (the mockup's .dot: 76 wide, the circle centred). */
const BOX_W = 76;
const LABEL_W = 124;
/** The panel reaches this far below the screen so a drag past half never
 *  shows its bottom edge. */
const SHEET_OVERSHOOT = 60;

const PNG: Partial<Record<PlaceKey, number>> = {
  home: require('../../../assets/icons/nav/nav-home.png'),
  // Labs = the headphones (owner 2026-11-20); Study Dashboard is drawn (study3).
  labs: require('../../../assets/icons/nav/nav-study.png'),
  prog: require('../../../assets/icons/nav/nav-progress.png'),
  prof: require('../../../assets/icons/nav/nav-profile.png'),
};

function rgbOf(hex: string): string {
  const s = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(s.substr(i, 2), 16)).join(',');
}

/** The circle's rim, as drawn shadows (identical on iPhone and Android). */
function ringShadow(rgb: string, lit: boolean, pressed: boolean): string {
  if (pressed) {
    return `0px 0px 0px 1.5px rgba(${rgb},0.95), 0px 0px 18px 0px rgba(${rgb},0.6), 0px 0px 0px 3px #0b0b0b, inset 0px -2px 6px 0px rgba(0,0,0,0.6)`;
  }
  if (lit) {
    return `0px 0px 0px 1.5px rgba(${rgb},0.95), 0px 0px 14px 0px rgba(${rgb},0.45), 0px 0px 0px 3px #0b0b0b, inset 0px 1px 0px 0px rgba(255,255,255,0.12), inset 0px -3px 6px 0px rgba(0,0,0,0.55), 0px 4px 10px 0px rgba(0,0,0,0.6)`;
  }
  return `0px 0px 0px 1px rgba(${rgb},0.34), 0px 0px 0px 2px #0b0b0b, inset 0px 1px 0px 0px rgba(255,255,255,0.1), inset 0px -3px 6px 0px rgba(0,0,0,0.55), 0px 4px 10px 0px rgba(0,0,0,0.6)`;
}

export function CircleMenuPanel(props: CircleMenuPanelProps) {
  const { p, geo, height: h, here, motion, live, shown, inbox, onPick, onClose, settleTo, firstCircleRef } = props;
  const span = Math.max(1, h - geo.openTop);
  const places = useMemo(() => circlePlaces(COMMUNITY_VISIBLE), []);
  const ranks = useMemo(() => spreadRanks(geo, places.map((pl) => pl.hour)), [geo, places]);

  // Drag the open panel (from the panel or any circle): down folds it away.
  const startP = useSharedValue(0);
  const drag = useMemo(
    () =>
      Gesture.Pan()
        .enabled(shown)
        .activeOffsetY([-8, 8])
        .failOffsetX([-30, 30])
        .onStart(() => {
          startP.value = p.value;
          cancelAnimation(p);
        })
        .onUpdate((e) => {
          const top0 = h - startP.value * span;
          p.value = (h - dragTop(top0 + e.translationY, geo.openTop, h)) / span;
        })
        .onEnd((e) => {
          settleTo(settleOpen(h - p.value * span, e.velocityY, geo.openTop, h), e.velocityY);
        }),
    [shown, p, startP, h, span, geo.openTop, settleTo],
  );

  const dimStyle = useAnimatedStyle(() => ({ opacity: 0.58 * Math.max(0, Math.min(1, p.value)) }));
  const sheetStyle = useAnimatedStyle(() => {
    if (!motion) return { opacity: Math.max(0, Math.min(1, p.value)), transform: [{ translateY: geo.openTop }] };
    return { opacity: 1, transform: [{ translateY: h - p.value * span }] };
  }, [motion, geo.openTop, h, span]);
  const handleStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, (p.value - 0.15) * 3)) }));
  const trackStyle = useAnimatedStyle(() => ({
    opacity: motion ? Math.max(0, Math.min(1, (p.value - 0.45) / 0.55)) : Math.max(0, Math.min(1, p.value)),
  }), [motion]);

  return (
    <GestureDetector gesture={drag}>
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents={shown ? 'box-none' : 'none'}
        {...(shown ? null : A11Y_HIDDEN)}
      >
        {/* The dim behind the panel: a tap closes. */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.dim, dimStyle]} pointerEvents={shown ? 'auto' : 'none'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} {...A11Y_HIDDEN} />
        </Animated.View>

        {/* The panel. */}
        <Animated.View style={[styles.sheet, { height: span + SHEET_OVERSHOOT }, sheetStyle]} pointerEvents="box-none">
          {/* The Study Dashboard's rack-blank face (owner 2026-11-20: "the same
              texture and treatment as the ... rack equipment panels"; then
              "DARKER, like the old dark bar"): the very BlackFaceBg the
              Dashboard wears, on the mockup's charcoal coat (#1c1c1f / #232326
              / #0f0f11) with its grit made stronger to read on it, the lit top
              lip, a dark cut edge and two of its black rack screws, light-
              rimmed so they read on the dark. */}
          <View style={styles.sheetBody} pointerEvents="none" {...A11Y_HIDDEN}>
            <BlackFaceBg menu />
            <View style={styles.sheetEdge} />
          </View>
          <View style={[styles.screw, { left: 14 }]} pointerEvents="none" {...A11Y_HIDDEN}>
            <View style={styles.screwRim}>
              <PanelScrew angle={12} size={13} />
            </View>
          </View>
          <View style={[styles.screw, { right: 14 }]} pointerEvents="none" {...A11Y_HIDDEN}>
            <View style={styles.screwRim}>
              <PanelScrew angle={-27} size={13} />
            </View>
          </View>
          <Pressable
            style={styles.grip}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close the menu"
            hitSlop={4}
          >
            <Animated.View style={[styles.handle, handleStyle]} />
          </Pressable>
        </Animated.View>

        {/* The clock face's faint track (no centre: the middle stays empty). */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.track,
            { left: geo.cx - geo.r - 2, top: geo.cy - geo.r - 2, width: geo.r * 2 + 4, height: geo.r * 2 + 4 },
            trackStyle,
          ]}
          {...A11Y_HIDDEN}
        >
          <Svg width={geo.r * 2 + 4} height={geo.r * 2 + 4} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Circle cx={geo.r + 2} cy={geo.r + 2} r={geo.r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1.2} />
            <Circle
              cx={geo.r + 2}
              cy={geo.r + 2}
              r={geo.r - 36 * geo.k}
              fill="none"
              stroke="rgba(255,198,77,0.05)"
              strokeWidth={1}
              strokeDasharray="2 7"
            />
          </Svg>
        </Animated.View>

        {places.map((pl) => (
          <MenuCircle
            key={pl.key}
            place={pl}
            rank={ranks[pl.hour] ?? 0}
            geo={geo}
            p={p}
            motion={motion}
            lit={pl.key === here}
            live={live}
            badge={pl.key === 'comm' ? inbox : null}
            onPick={onPick}
            circleRef={pl.hour === 12 ? firstCircleRef : undefined}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

type CircleProps = {
  place: Place;
  rank: number;
  geo: RingGeometry;
  p: SharedValue<number>;
  motion: boolean;
  lit: boolean;
  live: boolean;
  badge: InboxState | null;
  onPick: (key: PlaceKey) => void;
  circleRef?: RefObject<View | null>;
};

const MenuCircle = memo(function MenuCircle({ place, rank, geo, p, motion, lit, live, badge, onPick, circleRef }: CircleProps) {
  const target = slotCentre(geo, place.hour);
  const dx = target.x - geo.fabX;
  const dy = target.y - geo.fabY;
  const k = geo.k;
  const rgb = rgbOf(place.color);
  const pos = LABEL_POS[place.hour] ?? '';

  const flyStyle = useAnimatedStyle(() => {
    if (!motion) {
      return { opacity: Math.max(0, Math.min(1, p.value)), transform: [{ translateX: dx }, { translateY: dy }, { scale: k }] };
    }
    const f = flight(p.value, rank);
    return { opacity: f.opacity, transform: [{ translateX: dx * f.q }, { translateY: dy * f.q }, { scale: f.scale * k }] };
  }, [motion, dx, dy, rank, k]);
  const labelStyle = useAnimatedStyle(() => {
    if (!motion) return { opacity: Math.max(0, Math.min(1, p.value)) };
    return { opacity: flight(p.value, rank).label };
  }, [motion, rank]);

  const extra = badge && COMMUNITY_VISIBLE ? badgeA11y(badge) : '';

  return (
    <Animated.View
      style={[styles.box, { left: geo.fabX - BOX_W / 2, top: geo.fabY - CIRCLE / 2 }, flyStyle]}
      pointerEvents={live ? 'box-none' : 'none'}
    >
      <Pressable
        ref={circleRef}
        onPress={() => onPick(place.key)}
        hitSlop={6}
        style={styles.press}
        accessibilityRole="button"
        accessibilityLabel={extra ? `${place.name}, ${extra}` : place.name}
        accessibilityState={{ selected: lit }}
        accessibilityHint={lit ? 'You are here' : undefined}
      >
        {({ pressed }) => (
          <View
            style={[
              styles.disc,
              { boxShadow: ringShadow(rgb, lit, pressed) },
              pressed ? styles.discPressed : null,
            ]}
          >
            {lit ? <IconGlow color={place.color} /> : null}
            <View style={{ opacity: lit ? 1 : 0.7 }} {...A11Y_HIDDEN}>
              <PlaceIcon place={place} lit={lit} />
            </View>
          </View>
        )}
      </Pressable>

      <Animated.View pointerEvents="none" style={[labelBoxStyle(pos), labelStyle]} {...A11Y_HIDDEN}>
        <Text
          maxFontSizeMultiplier={1.15}
          style={[
            styles.label,
            { textAlign: pos === 'sl' ? 'right' : pos === 'sr' ? 'left' : 'center' },
            lit
              ? { color: place.color, textShadowColor: `rgba(${rgb},0.6)`, textShadowRadius: 7, textShadowOffset: { width: 0, height: 0 } }
              : null,
          ]}
        >
          {place.label}
        </Text>
      </Animated.View>

      {badge ? (
        <View pointerEvents="none" style={styles.badge}>
          <CommunityBadge state={badge} />
        </View>
      ) : null}
    </Animated.View>
  );
});

/** Where a circle's word sits (per clock slot, as in the mockup). */
function labelBoxStyle(pos: string) {
  const disc = { left: (BOX_W - CIRCLE) / 2, right: (BOX_W + CIRCLE) / 2 };
  switch (pos) {
    case 'up':
      return [styles.labelBox, { left: BOX_W / 2 - LABEL_W / 2, bottom: CIRCLE + 6 }];
    case 'sl':
      return [styles.labelBox, styles.labelSide, { left: disc.left - 6 - LABEL_W, alignItems: 'flex-end' as const }];
    case 'sr':
      return [styles.labelBox, styles.labelSide, { left: disc.right + 6, alignItems: 'flex-start' as const }];
    default:
      return [styles.labelBox, { left: BOX_W / 2 - LABEL_W / 2, top: CIRCLE + 6 }];
  }
}

/** The lit place's icon glow: a soft halo of its colour behind the art. */
function IconGlow({ color }: { color: string }) {
  return (
    <View style={styles.glow} pointerEvents="none" {...A11Y_HIDDEN}>
      <Svg width={46} height={46} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.42} />
            <Stop offset="0.55" stopColor={color} stopOpacity={0.16} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={23} cy={23} r={23} fill="url(#g)" />
      </Svg>
    </View>
  );
}

/** Drawn icons are built once per colour. */
const xmlCache = new Map<string, string>();
function xmlFor(key: PlaceKey, color: string): string | null {
  const art = DRAWN_ICON[key];
  if (!art) return null;
  const k = `${art}:${color}`;
  let x = xmlCache.get(k);
  if (!x) {
    x = iconXml(art, color);
    xmlCache.set(k, x);
  }
  return x;
}

function PlaceIcon({ place, lit }: { place: Place; lit: boolean }) {
  // PROGRESS keeps its moving faders when it is the current place (owner
  // 2026-11-20), the same component the tab used, with its own Reduce
  // Motion / Low-Light rule; otherwise the still PNG.
  if (place.key === 'prog' && lit) {
    return (
      <View style={styles.icon}>
        <View style={styles.faders}>
          <ProgressFadersLit />
        </View>
      </View>
    );
  }
  const png = PNG[place.key];
  if (png != null) return <Image source={png} style={styles.icon} resizeMode="contain" accessible={false} />;
  const xml = xmlFor(place.key, place.color);
  return xml ? (
    <SvgXml xml={xml} width={ICON} height={ICON} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
  ) : null;
}

/** A place's menu picture at any size, for a hub screen's top-left key
 *  (owner 2026-11-20: Audio Tools, Calculator Lab and Labs wear their own
 *  menu icon where the HOME house was). The same art as its circle. */
export function PlaceArt({ place, size = 22 }: { place: PlaceKey; size?: number }) {
  const pl = circlePlaces(true).find((x) => x.key === place);
  if (!pl) return null;
  const png = PNG[place];
  if (png != null) return <Image source={png} style={{ width: size, height: size }} resizeMode="contain" accessible={false} />;
  const xml = xmlFor(place, pl.color);
  return xml ? (
    <SvgXml xml={xml} width={size} height={size} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
  ) : null;
}

const styles = StyleSheet.create({
  dim: { backgroundColor: '#000' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    boxShadow: '0px -10px 30px 0px rgba(0,0,0,0.6)',
  },
  sheetBody: { ...StyleSheet.absoluteFill, borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden' },
  // The blank's cut edge: a dark hairline all round (the lit top lip is BlackFaceBg's own).
  sheetEdge: {
    ...StyleSheet.absoluteFill,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    boxShadow: 'inset 0px 0px 0px 1px rgba(0,0,0,0.6)',
  },
  screw: { position: 'absolute', top: 10 },
  screwRim: { width: 13, height: 13, borderRadius: 6.5, boxShadow: '0px 0px 0px 0.8px rgba(255,255,255,0.14), 0px 1px 0px 0px rgba(255,255,255,0.12)' },
  grip: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -80,
    width: 160,
    height: 44,
    alignItems: 'center',
  },
  // The mockup's grip bar: light gray with a lit top edge, clear on the dark face.
  handle: {
    marginTop: 17,
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#6e6e72',
    boxShadow: 'inset 0px 1px 0px 0px rgba(255,255,255,0.15)',
  },
  track: { position: 'absolute' },
  box: { position: 'absolute', width: BOX_W, height: CIRCLE },
  press: { width: BOX_W, height: CIRCLE, alignItems: 'center' },
  disc: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1c1e',
    experimental_backgroundImage: 'radial-gradient(circle at 50% 28%, #2e2e30 0%, #1c1c1e 46%, #121213 100%)',
  },
  discPressed: { transform: [{ scale: 0.92 }] },
  glow: { position: 'absolute', left: (CIRCLE - 46) / 2, top: (CIRCLE - 46) / 2, width: 46, height: 46 },
  icon: { width: ICON, height: ICON },
  // The tab's 22 pt faders, scaled to the circle's 28 pt icon.
  faders: { position: 'absolute', left: 3, top: 3, width: 22, height: 22, transform: [{ scale: ICON / 22 }] },
  labelBox: { position: 'absolute', width: LABEL_W, alignItems: 'center' },
  labelSide: { top: 0, height: CIRCLE, justifyContent: 'center' },
  label: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    lineHeight: 13.5,
    letterSpacing: 0.7,
    color: '#b9b9be',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  badge: { position: 'absolute', left: (BOX_W + CIRCLE) / 2 - 14, top: -5 },
});
