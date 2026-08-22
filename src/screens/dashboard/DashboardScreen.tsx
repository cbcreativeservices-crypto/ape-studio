/**
 * S4* — Dashboard (RE-LOCKED v3.5, MASTER; visuals from design-reference
 * 05-s4-dashboard.dc.html).
 *
 * - Loads straight to the last-used topic (no Resume modal).
 * - Swipe L/R on the topic title block moves freely between ALL topics in the
 *   course (user request 2026-07-17). The old per-topic frontier gate (hard
 *   stop + screen-shake/haptic past the one-ahead boundary) is removed; a
 *   per-course gate will replace it later.
 * - Provisional (clamped) topic = predecessor status passed_incomplete:
 *   distinct border + persistent reminder (copy locked; styling is a
 *   [TBD-DESIGN] proposal).
 * - Method blocks 1–5 + quiz block 6 with glow-pulse while locked and a
 *   which-gate-remains readout mirrored DISPLAY-ONLY from server rows.
 * - Topic "overall progress" = mean of the applicable methods' server
 *   completion_pct (display aggregation of server truth — flagged in review).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  InteractionManager,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StudyStackParamList } from '../../navigation/types';
import Svg, { Circle, Rect, Defs, LinearGradient as SvgLinearGradient, Stop, Line } from 'react-native-svg';
import { AppHeader } from '../../components/AppHeader';
import { NavIcon } from '../../components/nav/NavIcon';
import { FundamentalsCreditBanner } from '../../features/lab/FundamentalsCreditBanner';
import { StudyAccessSheet } from '../../features/commercial/StudyAccessSheet';
import { TopicDeckSheet } from './TopicDeckSheet';
import {
  orderDeckIds,
  removeFromDeck,
  restoreToDeck,
  setDeckMode,
  setDeckOrder,
  useDeckPrefs,
  type DeckPrefs,
} from '../../features/dashboard/deckOrderStore';
import { DeckIcon } from '../../components/DeckIcon';
import { ElevatedFrame } from '../../components/ElevatedFrame';
import { GlassButton } from '../../components/GlassButton';
import { LedMeter, segmentsForPct } from '../../components/LedMeter';
import { MethodIcon, METHOD_COLORS, type MethodKey } from '../../components/MethodIcon';
import { StudioButton } from '../../components/StudioButton';
import { SwitchButton } from '../../components/SwitchButton';
import { TrophyImage } from '../../components/TrophyImage';
import { JogDial, JogOverlay } from '../../components/JogWheel';
import { TrophyModal } from '../../components/TrophyModal';
import { useTopicTrophies, trophyForTopicName } from '../../features/profile/topicTrophies';
import { colors, fonts, spacing } from '../../theme/tokens';
import {
  fetchDashboard,
  fetchEnrollmentDashboard,
  getLastTopicIndex,
  setLastTopicIndex,
  type DashboardData,
  type Topic,
} from '../../features/dashboard/api';
import { getDashboardCache, setDashboardCache } from '../../features/dashboard/dashboardCache';
import { FREE_ENROLL_GS, isFreeEnrollGs, useEnrollment } from '../../features/enrollment/enrollmentStore';
import { supabase } from '../../lib/supabase';
import { fetchGlossaryItemsByIds, fetchTopicItems, studyDisplayPct } from '../../features/study/api';
import { setLastStudyLocation } from '../../features/study/lastStudyLocation';
import {
  FLAGGED_TOPIC_ID,
  FLAGGED_TOPIC_NAME,
  useCustomOnDashboard,
  useTermList,
} from '../../features/flags/flaggedStore';
import { TermSelectIcons } from '../../features/flags/TermSelectIcons';
import { LowLightDim } from '../../features/settings/LowLightLayer';
import { consumeDevPreview } from '../../features/dev/devPreview';
import { devBypass } from '../../config/devMode';
import { ScreenIntroOverlay } from '../../features/intro/ScreenIntroOverlay';
import { LearningIntroSheet } from '../../features/intro/LearningIntroSheet';
import { getCourseIntro, getTopicIntro, isIntroEmpty } from '../../features/intro/learningIntros';
import { replayQuizSubmissions } from '../../features/quiz/api';
import { onStudyProgress } from '../../features/study/sync';
import { isScenariosExempt, useScenarioExempt } from '../../features/study/scenarioExempt';
import { loadAllLocalMethodStates, mergeItemStates } from '../../features/study/localProgress';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { fetchCommercialDashboard, getLastPublicCourse } from '../../features/commercial/commercialDashboard';

// Rack density (owner 2026-08-11): ONE knob scales every rack slot's height
// together — method rows, quiz, and the section labels — so the whole stack
// fits on screen without scrolling. Lower = shorter/denser. Tune here only.
const RACK_SCALE = 0.82;
const rs = (n: number) => Math.round(n * RACK_SCALE);
// Glass-screen readout type scales WITH the chassis (owner 2026-08-11 — the
// softer half-scale left it too big for the shorter panels).
const rt = (n: number) => Math.round(n * RACK_SCALE);
const RACK_ICON = rs(43);
const RACK_SWITCH_H = rs(54);
const RACK_QUIZ_SWITCH_H = rs(58);
// 19" mounting screw head, sized to the scaled rack. The 4 screws are pinned to
// the panel CORNERS (absolute), not carried in the content row (owner 2026-08-11).
const RACK_SCREW = rs(15);
// A powered-off panel's icon glyph — dark, unlit (owner 2026-08-11).
const OFF_ICON = '#3a3b41';
const SCREW_INSET = 3; // horizontal inset from the rail edge
// Vertical hole geometry (EIA-310): a 1U panel's two screws sit in the top &
// bottom holes of its U — hole CENTERS 0.25" in from each edge on a 1.75" U =
// 14.3%, giving the real 71.4% center-to-center. Inset the screw BOX so its
// CENTER lands at 14.3% (subtract the screw radius). Proportional to rs(80) so
// it stays true at any RACK_SCALE — a fixed px inset drifted as panels grew
// (owner 2026-08-11).
const SCREW_VINSET = Math.max(2, Math.round(rs(80) * 0.143 - RACK_SCREW / 2));

const METHOD_ORDER: { key: MethodKey; label: string }[] = [
  { key: 'flashcards', label: 'FLASHCARDS' },
  { key: 'fill_in_blank', label: 'FILL-IN-BLANK' },
  { key: 'matching', label: 'MATCHING' },
  { key: 'scenarios', label: 'SCENARIOS' },
];

/** CornerScrews — the four 19" rack mounting screws, ABSOLUTELY pinned to the
 *  panel's corners (owner 2026-08-11) so they always sit top-left/top-right/
 *  bottom-left/bottom-right regardless of how tall the content row is. `angles`
 *  = [TL, TR, BL, BR], each a hair off-true like a hand-mounted rack. */
function CornerScrews({ angles }: { angles: [number, number, number, number] }) {
  return (
    <>
      <View style={[styles.cornerScrew, { top: SCREW_VINSET, left: SCREW_INSET }]} pointerEvents="none">
        <PanelScrew angle={angles[0]} size={RACK_SCREW} />
      </View>
      <View style={[styles.cornerScrew, { top: SCREW_VINSET, right: SCREW_INSET }]} pointerEvents="none">
        <PanelScrew angle={angles[1]} size={RACK_SCREW} />
      </View>
      <View style={[styles.cornerScrew, { bottom: SCREW_VINSET, left: SCREW_INSET }]} pointerEvents="none">
        <PanelScrew angle={angles[2]} size={RACK_SCREW} />
      </View>
      <View style={[styles.cornerScrew, { bottom: SCREW_VINSET, right: SCREW_INSET }]} pointerEvents="none">
        <PanelScrew angle={angles[3]} size={RACK_SCREW} />
      </View>
    </>
  );
}

/** SectionRackPanel — the Homework / Proficiency Check dividers as REAL rack
 *  hardware (owner 2026-08-11 rev2, per rack reference): a HALF-RU vented
 *  blank — extra-dark face, ONE mounting screw per side (vertically centred,
 *  like a 0.5U filler), BEEHIVE perforation flanking the centred LED label. */
function SectionRackPanel({ label, angles }: { label: string; angles: [number, number] }) {
  return (
    <ElevatedFrame borderless contentStyle={styles.sectionInner}>
      <BlackFaceBg dark />
      <View style={[styles.sideScrew, { left: SCREW_INSET }]} pointerEvents="none">
        <PanelScrew angle={angles[0]} size={RACK_SCREW} />
      </View>
      <View style={[styles.sideScrew, { right: SCREW_INSET }]} pointerEvents="none">
        <PanelScrew angle={angles[1]} size={RACK_SCREW} />
      </View>
      <View style={styles.methodRow}>
        <VentHoles />
        <StencilLabel label={label} />
        <VentHoles />
      </View>
    </ElevatedFrame>
  );
}

/** StencilLabel — the label rendered as a LASER-CUT STENCIL in the panel, lit
 *  from BEHIND (owner 2026-08-11): a wide soft bloom (light bleeding out of the
 *  cut onto the dark panel) with a crisp bright letter on top (the cutout
 *  itself). The dark section panel sits above the glow, so the type reads as
 *  light coming through sharp cut-outs, not ink printed on the face. */
function StencilLabel({ label }: { label: string }) {
  return (
    <View style={styles.stencilWrap}>
      {/* TOP cut wall in shadow — the panel's thickness at the near edge */}
      <Text style={[styles.stencilBase, styles.stencilWallTop]} numberOfLines={1}>
        {label}
      </Text>
      {/* BOTTOM cut lip catching the front light — the far edge of the bore */}
      <Text style={[styles.stencilBase, styles.stencilLipBottom]} numberOfLines={1}>
        {label}
      </Text>
      {/* the glowing cut-out itself, recessed (light lower lip via its shadow) */}
      <Text style={[styles.stencilBase, styles.stencilFace]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** BEEHIVE venting — staggered rows of small punched round holes (honeycomb
 *  pattern, like perforated rack blanks). Overflow-clipped so the field just
 *  fills whatever width it gets. */
function VentHoles() {
  return (
    <View style={styles.ventField}>
      {[0, 1, 2].map((r) => (
        <View key={r} style={[styles.ventHoleRow, r % 2 === 1 && styles.ventHoleRowStagger]}>
          {Array.from({ length: 26 }, (_, i) => (
            <View key={i} style={styles.ventHole} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** Per-method display %. Scenarios is round-based homework: its LED reflects
 *  server completion_pct (rounds ÷ 3 → 33/67/100), set by complete_scenario_round.
 *  Every other method creeps per-item from item_states via studyDisplayPct. */
/** The Audio Fundamentals Lab is a lab-proxy topic (gs3081) — progress comes from
 *  lab activities, not term study — so it is never placed in the Dashboard deck. */
const AUDIO_FUNDAMENTALS_LAB_GS = 3081;

function methodDisplayPct(
  row: { item_states?: unknown; completion_pct?: number | null } | undefined,
  itemCount: number,
  key: string,
  requiredPasses: number,
): number {
  if (key === 'scenarios') {
    // Round-based server completion (record_scenario_answer / round RPCs).
    return Math.round(row?.completion_pct ?? 0);
  }
  // flashcards / fill-in-blank / matching: full-set completion via studyDisplayPct.
  return studyDisplayPct(
    (row?.item_states ?? {}) as Parameters<typeof studyDisplayPct>[0],
    itemCount,
    key,
    requiredPasses,
  );
}

// LA-2A-inspired panel textures (owner request 2026-07-25). Pure react-native-svg
// gradients + fine vertical striations — NO image assets. Both fill their
// container absolutely BEHIND the content; the parent ElevatedFrame already
// clips to its rounded corners (own overflow:hidden wrapper as a second clip).
// viewBox 0..100 with preserveAspectRatio="none" stretches to any panel size.

/** BLACK FACE — the LA-2A near-black matte control panel with a subtle vertical
 *  brushed grain (for the study-method panels; existing light-on-black content
 *  stays legible). */
// Bead-blast GRIT — randomly-scattered particulate specks (owner 2026-08-01).
// The old version tiled a fixed 5×5 speck motif and stretched it with the panel,
// which turned the dots into regular horizontal streaks (the "wavy" look). This
// is a one-time RANDOM point cloud (deterministic xorshift, so it's stable),
// stored as fractions of the panel and multiplied into PIXEL space at render so
// every speck stays a round particulate at any panel size — no tiling, no grain
// direction.
const GRIT_SPECKS = (() => {
  let s = 0x2545f491 >>> 0;
  const rnd = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
  const out: { fx: number; fy: number; r: number; light: boolean; a: number }[] = [];
  for (let i = 0; i < 130; i++) {
    out.push({
      fx: rnd(),
      fy: rnd(),
      r: 0.45 + rnd() * 0.7, // px radius — tiny round particulate
      light: rnd() > 0.5,
      a: 0.05 + rnd() * 0.09,
    });
  }
  return out;
})();

// GRAY textured rack-blank face (owner 2026-08-01) — modeled on the SPL 500-rack
// blank panels: a medium-gray vertical gradient (lighter upper-mid, darker top &
// bottom edges) with random bead-blasted particulate grit. The debossed titles
// were already tuned for a gray floor, so they read correctly here. Drawn in
// measured PIXEL space so the specks are round dots, not stretched streaks.
function BlackFaceBg({
  dark = false,
  light = false,
  lighter = false,
  gold = false,
}: {
  dark?: boolean;
  light?: boolean;
  lighter?: boolean;
  gold?: boolean;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  // Face coats: default method gray · `dark` = the darker section-filler gray ·
  // `light` = the MID gray (halfway to LA-2A, the QUIZ face) · `lighter` = the
  // Flashcards face, halfway again from mid toward the full LA-2A light gray ·
  // `gold` = a reflective brushed-silver panel (unused). (owner 2026-08-11)
  const gradId = gold
    ? 'apeSilverFace'
    : lighter
      ? 'apeGrayFaceLighter'
      : light
        ? 'apeGrayFaceMid'
        : dark
          ? 'apeGrayFaceDark'
          : 'apeGrayFace';
  const gradStops: { o: number; c: string }[] = gold
    ? [
        { o: 0, c: '#6f7376' },
        { o: 0.16, c: '#b9bec2' },
        { o: 0.4, c: '#f4f6f8' },
        { o: 0.56, c: '#cdd2d6' },
        { o: 0.8, c: '#9aa0a4' },
        { o: 1, c: '#63686b' },
      ]
    : lighter
      ? [{ o: 0, c: '#a6a7a8' }, { o: 0.42, c: '#b6b8b9' }, { o: 1, c: '#9c9e9f' }]
      : light
        ? [{ o: 0, c: '#828385' }, { o: 0.42, c: '#919294' }, { o: 1, c: '#77787a' }]
        : dark
          ? [{ o: 0, c: '#17171b' }, { o: 0.42, c: '#232327' }, { o: 1, c: '#0d0d11' }]
          : [{ o: 0, c: '#3a3a3e' }, { o: 0.42, c: '#46464b' }, { o: 1, c: '#2c2c30' }];
  return (
    <View
      pointerEvents="none"
      style={styles.textureFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ w: Math.round(width), h: Math.round(height) });
      }}
    >
      {size.w > 0 && size.h > 0 ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            {/* objectBoundingBox gradient (default units) — size-independent, so
                the shared id is safe across every panel instance. */}
            <SvgLinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              {gradStops.map((s) => (
                <Stop key={s.o} offset={String(s.o)} stopColor={s.c} />
              ))}
            </SvgLinearGradient>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} fill={`url(#${gradId})`} />
          {/* Random particulate specks — round dots at pixel radius. */}
          {GRIT_SPECKS.map((g, i) => (
            <Circle
              key={i}
              cx={g.fx * size.w}
              cy={g.fy * size.h}
              r={g.r}
              fill={g.light ? `rgba(255,255,255,${g.a})` : `rgba(0,0,0,${g.a + 0.03})`}
            />
          ))}
          {/* Top lit lip + bottom shadow so each blank reads as its own mounted panel. */}
          <Line x1={0} y1={0.6} x2={size.w} y2={0.6} stroke="rgba(255,255,255,0.16)" strokeWidth={0.7} />
          <Line x1={0} y1={size.h - 0.6} x2={size.w} y2={size.h - 0.6} stroke="rgba(0,0,0,0.4)" strokeWidth={0.9} />
        </Svg>
      ) : null}
    </View>
  );
}

/** BRUSHED METAL — the LA-2A brushed-aluminum chassis (for the quiz panel). A
 *  MID-tone metallic vertical gradient with a lighter top edge, a darker bottom,
 *  and fine vertical striations alternating light/dark. Mid-tone keeps the quiz's
 *  dark engraved title + dark LED boxes legible. */
/** Panel mounting screw (Booth 2026-07-10) — BLACK phillips head. `angle`
 *  rotates the slots: mostly cardinal, a few a hair off-true like a real rack
 *  (#4). */
function PanelScrew({ angle = 0, size = 15 }: { angle?: number; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" style={{ transform: [{ rotate: `${angle}deg` }] }}>
      <Circle cx={7} cy={7} r={6.4} fill="#131416" stroke="#000000" strokeWidth={0.9} />
      <Circle cx={7} cy={7} r={5} fill="#1e1f22" />
      <Circle cx={5.2} cy={5} r={1.8} fill="rgba(255,255,255,0.10)" />
      {/* Phillips cross — black recess + a hair of light on the lower/right
          edge so the engraved slot (the "teeth") is barely noticeable, and the
          head reads a touch larger (Booth 2026-07-11 #4). */}
      <Rect x={2.8} y={6.2} width={8.4} height={1.6} rx={0.8} fill="#000000" />
      <Rect x={6.2} y={2.8} width={1.6} height={8.4} rx={0.8} fill="#000000" />
      <Rect x={2.8} y={7.7} width={8.4} height={0.5} rx={0.25} fill="rgba(255,255,255,0.08)" />
      <Rect x={7.7} y={2.8} width={0.5} height={8.4} rx={0.25} fill="rgba(255,255,255,0.08)" />
    </Svg>
  );
}

/**
 * GlassScreen — the study-method / quiz readout as an LED instrument screen
 * behind ONE continuous glass panel (owner 2026-08-06, ref: M2-PRO face). The
 * gray textured rack container stays; inside it the middle area now reads as a
 * dark screen — TITLE over the % over a full-width LED meter — all under a
 * single dimmed glass sheet with an ambient specular highlight for realism.
 * Replaces the old engraved-nameplate title (and its fine white trace line).
 *
 * ADA: the wrapper carries a combined label; the glass overlay never intercepts
 * touches (pointerEvents none) so the surrounding switch/icon stay reachable.
 */
function GlassScreen({
  title,
  value,
  valueColor,
  segments,
  subtitle,
  subtitleColor,
  complete,
  off = false,
}: {
  title: string;
  value: string;
  valueColor: string;
  /** Method meter fill (0–21 segments). Omit for the quiz (uses `subtitle`). */
  segments?: number;
  /** Quiz gate summary shown where the method meter would sit. */
  subtitle?: string;
  subtitleColor?: string;
  /** Method fully done (pct ≥ 100): show a green check instead of the % and
   *  drop the number entirely (owner 2026-08-06). */
  complete?: boolean;
  /** POWERED OFF (owner 2026-08-11): the screen is dark — title dimmed, no
   *  value/check, LED strip unlit. Its stage of the rack hasn't unlocked yet. */
  off?: boolean;
}) {
  return (
    <View
      style={[styles.cutoutMount, styles.glassScreen]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${title}, ${off ? 'powered off' : complete ? 'complete' : value}${subtitle && !off ? `, ${subtitle}` : ''}`}
    >
      {/* The lit readout, beneath the glass. Now TWO rows (owner 2026-08-06):
          line 1 = title (left) + % / green check (right); line 2 = LED meter or
          the quiz gate summary. The extra width from stacking the % beside the
          title lets the title run larger/taller. */}
      <View style={styles.glassReadout}>
        <View style={styles.glassHeaderRow}>
          {/* Title LED goes GREEN once the method is fully complete (owner
              2026-08-06) — matching the check on the right. Dim + unlit when the
              panel is powered off. */}
          <Text
            style={[styles.glassTitle, complete && styles.glassTitleDone, off && styles.glassTitleOff]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {title}
          </Text>
          {off ? (
            // Powered off — a dark placeholder in the % slot so the row stays
            // justified (title left · value right) exactly like a lit panel.
            <Text style={[styles.glassValue, styles.glassValueOff]} numberOfLines={1}>
              —
            </Text>
          ) : complete ? (
            // Green LED check — replaces the % once the method is fully complete.
            <Text style={styles.glassCheck} accessibilityElementsHidden importantForAccessibility="no">
              ✓
            </Text>
          ) : (
            <Text
              style={[styles.glassValue, { color: valueColor, textShadowColor: valueColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {value}
            </Text>
          )}
        </View>
        {off ? (
          // Powered off — always the unlit LED strip on the second line (methods
          // AND quiz), so every dark panel matches the lit layout (owner 2026-08-11).
          <LedMeter filled={0} fullWidth flat segHeight={rs(10)} />
        ) : segments != null ? (
          // flat: behind the glass the meter is lit segments only — no bevel,
          // no molded frame (owner 2026-08-06). Segment height rides RACK_SCALE
          // so the strip stays balanced in the shorter screen (owner 2026-08-11).
          // MIDI blue→red ramp for the method meters (owner 2026-08-13).
          <LedMeter filled={segments} fullWidth flat midi segHeight={rs(10)} />
        ) : subtitle != null ? (
          <Text
            style={[styles.glassSub, { color: subtitleColor ?? valueColor, textShadowColor: subtitleColor ?? valueColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <GlassCover />
    </View>
  );
}

/**
 * GlassCover — the ONE continuous tinted-glass sheet, shared by the title/%
 * LED screens AND the method-icon wells so every pane reads identically
 * (owner 2026-08-06). A flat smoked tint (constant translucent overlay) does
 * the heavy lifting of pushing the lit content BEHIND the pane — the gradients
 * alone read as content printed on top. Decorative only; never blocks touches.
 */
function GlassCover() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Flat smoked-glass tint over EVERYTHING beneath the pane. */}
      <View style={styles.glassTint} />
      {/* Vertical sheen → dim: glass catches a little light up top and darkens
          toward the bottom (the "slight dimming affect"). */}
      <LinearGradient
        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.14)', 'rgba(0,0,0,0.28)']}
        locations={[0, 0.45, 0.75, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Ambient specular highlight sweeping from the top-left corner. */}
      <LinearGradient
        colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
        locations={[0, 0.35, 0.7]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.75, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Crisp glass edge glare along the very top. */}
      <View style={styles.glassTopGlare} />
      {/* Bottom edge = a gray highlight lip with the finest black line right at
          the extreme bottom beneath it (owner 2026-08-06). The black line is
          the container's own bottom border (see cutoutMount); this gray line
          sits just above it. */}
      <View style={styles.glassBottomHighlight} />
    </View>
  );
}

/** Per-panel screw rotations: mostly true, screws 3L and 4R sit slightly off. */
const SCREW_ROT: [number, number][] = [
  [0, 90],
  [90, 0],
  [8, 90],
  [0, -7],
  [90, 0],
];

const STUDY_ROUTES: Partial<
  Record<MethodKey, 'Flashcards' | 'FillInBlank' | 'Matching' | 'Scenarios'>
> = {
  flashcards: 'Flashcards',
  fill_in_blank: 'FillInBlank',
  matching: 'Matching',
  scenarios: 'Scenarios',
};

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<StudyStackParamList>>();
  const route = useRoute<RouteProp<StudyStackParamList, 'Dashboard'>>();
  // Topic → trophy art by NAME (owner 2026-08-07): v3 topic rows carry no
  // icon_url of their own, so the current-topic image resolves the trophy by
  // name and only falls back to the row's own icon_url when there's no match.
  const trophies = useTopicTrophies();
  // Instant landing (owner 2026-08-17): seed from the in-memory cache of the
  // last successful load, so a remounted Dashboard paints its content
  // immediately and the fresh fetch streams in silently behind it.
  const [data, setData] = useState<DashboardData | null>(() => getDashboardCache()?.data ?? null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  // A persisted session with no student record: self-healed to the guest view,
  // with a non-blocking banner offering to finish registration or sign out.
  const [strandedSession, setStrandedSession] = useState(false);
  const [loading, setLoading] = useState(() => getDashboardCache() == null);
  const [topicIdx, setTopicIdx] = useState(() => getDashboardCache()?.topicIdx ?? 0);
  // During a jog scroll, the TOP container previews this index while the lower
  // rack stays on topicIdx until release (owner 2026-08-01) — keeps it fast.
  const [scrollIdx, setScrollIdx] = useState(0);
  const scrollIdxRef = useRef(0);
  scrollIdxRef.current = scrollIdx;
  // Jog dial (owner 2026-08-01): the small dial IS the live control — holding it
  // opens a big mirror wheel and the SAME gesture turns it instantly (no Modal,
  // no tap-then-grab). The wheel spins endlessly (the topic index WRAPS — no
  // end-stops). jogActiveRef tells the card's swipe to stand down while held.
  // UI-thread rotation value (owner 2026-08-05): a Reanimated shared value so the
  // overlay dimple tracks the thumb without the JS-Animated bridge lag.
  const jogSpin = useSharedValue(0);
  const jogActiveRef = useRef(false);
  const [jogActive, setJogActive] = useState(false);
  // CM6 (Booth 2026-07-11): commercialMode renders a PUBLIC course (seq order
  // from the seed) through this same screen; institutional path unchanged.
  const { commercialMode, caps, entitlement } = useEntitlement();
  // Membership gate (user request 2026-08-12): a free user may LOAD a locked/paid
  // topic into the Dashboard, but studying it raises the Academy upgrade sheet.
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Enrollment-driven Dashboard (user request 2026-07-22): a COURSE ⇄ MY
  // ENROLLMENT toggle. In enrollment mode the top swiper iterates the user's
  // enrolled topics (active + inactive; inactive dimmed) and the full study
  // machinery loads per topic. Available to ANY user with enrolled topics.
  const enrolled = useEnrollment();
  // The dashboard is now driven by the user's ENROLLMENT (they manage it via the
  // "My Enrollments" screen); the COURSE ⇄ ENROLLMENT toggle was removed (user
  // request 2026-07-23). Falls back to the course/commercial fetch only when no
  // topics are loaded (see load() guard).
  const [viewMode, setViewMode] = useState<'course' | 'enrollment'>('enrollment');
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;
  // The study swipe shows ACTIVE enrolled topics the user can ACCESS. Free/
  // The dashboard deck = every ACTIVE enrolled topic, locked or not (user request
  // 2026-08-13, reversing the 2026-07-22 free-only rule): a non-member SEES the
  // paid topics they added and hits the Academy paywall when they try to STUDY one
  // — the membership gate below enforces access, not this loader. Free topics stay
  // open; locked ones render and gate on tap.
  const enrolledGsRef = useRef<number[]>([]);
  // The Audio Fundamentals Lab (gs3081) is a LAB-PROXY topic — progress comes from
  // working through the lab activities, not studying terms — so it must NEVER appear
  // in the Dashboard's topic deck (owner 2026-08-13).
  enrolledGsRef.current = enrolled
    .filter((e) => e.active && e.gs !== AUDIO_FUNDAMENTALS_LAB_GS)
    .map((e) => e.gs);
  const inactiveGs = useRef(new Set<number>());
  inactiveGs.current = new Set(enrolled.filter((e) => !e.active).map((e) => e.gs));

  const pulse = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  // Tap the topic trophy → full-size popup (Booth 2026-07-11).
  const [trophyOpen, setTrophyOpen] = useState(false);
  // Tap the topic card → all terms in this topic as a list (Booth 2026-07-18).
  // Rows carry ids so each row's select icons (⚑ ♥ ★ ✓ ✗) can tag the term.
  const [termsOpen, setTermsOpen] = useState(false);
  const [termList, setTermList] = useState<{ id: string; term: string }[] | null>(null);
  // The same sheet also serves the user's Custom List card.
  const [termsSource, setTermsSource] = useState<'topic' | 'flagged'>('topic');
  // The user's ★ CUSTOM LIST (starred) — built via the ★ icon in the Glossary /
  // Flashcards term popups (user request 2026-07-18: the card is the star list,
  // not the ⚑ flagged list).
  const starred = useTermList('starred');

  // Whether the user's Custom List shows as a synthetic current-topic here
  // (toggled from the Enrollment screen). Device-local; default off.
  const customOnDashboard = useCustomOnDashboard();
  const customOnDashboardRef = useRef(customOnDashboard);
  customOnDashboardRef.current = customOnDashboard;
  // Topic-deck ordering (owner 2026-08-01): default alphabetical; the Topic-Deck
  // sheet (blue Study icon) lets the user engage a custom order, remove topics,
  // and jump to one.
  const deckPrefs = useDeckPrefs();
  const deckPrefsRef = useRef<DeckPrefs>(deckPrefs);
  deckPrefsRef.current = deckPrefs;
  const [deckOpen, setDeckOpen] = useState(false);

  // Learning intros (user request 2026-07-18): a COURSE intro before beginning
  // a course and a TOPIC intro before beginning each topic. Auto-shown once
  // each (persisted in one set), and re-openable from the topic card. `intro`
  // holds whichever sheet is currently up.
  const [intro, setIntro] = useState<{ kind: 'course' | 'topic'; key: string; name: string } | null>(null);
  const [introSeen, setIntroSeen] = useState<Set<string>>(new Set());
  useEffect(() => {
    AsyncStorage.getItem('ape:learnIntrosSeen').then((v) => {
      if (v) setIntroSeen(new Set(JSON.parse(v) as string[]));
    });
  }, []);

  // The Dashboard must always open at the TOP (Booth 2026-07-11): a stale scroll
  // offset was leaving it scrolled down on focus. Reset to y=0 whenever focused.
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  // Record that the learner last sat on the Dashboard, so the Enrollments
  // "CONTINUE LEARNING" banner returns here (not into a method) when they left
  // from the dashboard.
  useFocusEffect(
    useCallback(() => {
      setLastStudyLocation({ kind: 'dashboard' });
    }, []),
  );

  const load = useCallback(async () => {
    // Silent refresh (owner 2026-08-17): only show the cold spinner when there
    // is NOTHING to display — with content (state or cache) on screen, the
    // refetch streams in behind it and swaps in via setData.
    if (!dataRef.current) setLoading(true);
    setError(null);
    setStrandedSession(false);
    try {
      // Reconnect path (Code brief §6): flush any offline quiz submissions
      // first so the fetched progress reflects the finalized attempt.
      const replayed = await replayQuizSubmissions().catch(() => []);
      for (const { result } of replayed) {
        Alert.alert(
          'Offline quiz submitted',
          `Score ${result.score}/25 — ${result.outcome.replace(/_/g, ' ')}.`,
        );
      }
      // A session-less GUEST studies the FREE topics on-device only. It must NEVER
      // touch the student-record path: fetchDashboard()/fetchCommercialDashboard()
      // query users/enrollment/progress, which throw 'user_not_found' for a guest
      // (that used to blank the whole Study tab). Instead load the free topics
      // through the guest-safe enrollment fetch (userId stays 'local' → no progress
      // queries; content — achievements/glossary — is anon-readable). Progress = the
      // device-local mirror merged below. Keyed on the real session, NOT entitlement,
      // since returning authed users also default to the mock 'anonymous' state.
      const { data: sessData } = await supabase.auth.getSession();
      const isGuest = !sessData.session;
      // A guest also sees all their ACTIVE topics (locked included) so the paywall
      // is reachable; a guest with nothing enrolled falls back to the free topics.
      const guestFetch = () =>
        fetchEnrollmentDashboard(
          enrolledGsRef.current.length > 0 ? enrolledGsRef.current : [...FREE_ENROLL_GS],
        );
      let d: DashboardData;
      if (isGuest) {
        d = await guestFetch();
      } else {
        try {
          d =
            viewModeRef.current === 'enrollment' && enrolledGsRef.current.length > 0
              ? await fetchEnrollmentDashboard(enrolledGsRef.current)
              : commercialMode
                ? await fetchCommercialDashboard((await getLastPublicCourse()) ?? 1, caps)
                : await fetchDashboard();
        } catch (e: any) {
          // SELF-HEAL (owner 2026-08-06): a session persisted on-device whose
          // account has no student record throws user_not_found on EVERY cold
          // boot — Splash sees the session, routes to Main, and the Study tab
          // dead-ended on a retry loop that no restart could clear. Instead of
          // stranding the user, fall back to the guest free-topics view so the
          // app is immediately usable. The session is left intact so a genuine
          // new signup can still finish via Complete Registration, and a stale
          // orphan can sign out via Back to Login.
          if (e?.message === 'user_not_found') {
            setStrandedSession(true);
            d = await guestFetch();
          } else {
            throw e;
          }
        }
      }

      // Merge the device-local progress mirror OVER the server rows for DISPLAY
      // (LED + START→CONTINUE), so the dashboard reacts to work the user just
      // did even before the server write lands (Booth 2026-07-15). Gates below
      // still read server truth.
      const localRows = await loadAllLocalMethodStates();
      if (localRows.length) {
        const rows = [...d.methodRows];
        for (const lr of localRows) {
          const existing = rows.find(
            (r) => r.achievement_id === lr.achievement_id && r.method_key === lr.method_key,
          );
          if (existing) {
            existing.item_states = mergeItemStates(existing.item_states, lr.item_states);
          } else {
            rows.push({
              achievement_id: lr.achievement_id,
              method_key: lr.method_key,
              completion_pct: 0,
              engagement_seconds: 0,
              answered_count: 0,
              correct_count: 0,
              item_states: lr.item_states,
            });
          }
        }
        d.methodRows = rows;
      }

      // First open lands on the furthest topic with progress (the "frontier");
      // after that the stored index wins. Movement itself is free — the old
      // per-topic gate is gone (user request 2026-07-17), so the stored index
      // is clamped only to the real array bounds, not the frontier.
      // The carousel order is CUSTOM-first then alphabetical (owner 2026-08-01),
      // so map the frontier topic's ID to its index in THAT reordered list.
      let frontierId: string | null = null;
      d.topics.forEach((t) => {
        const st = d.progressByTopic.get(t.id)?.status ?? 'locked';
        if (st !== 'locked') frontierId = t.id;
      });
      const members = [
        ...(customOnDashboardRef.current ? [{ id: FLAGGED_TOPIC_ID, name: FLAGGED_TOPIC_NAME }] : []),
        ...d.topics.map((t) => ({ id: t.id, name: t.name })),
      ];
      const orderedIds = orderDeckIds(
        members,
        deckPrefsRef.current,
        customOnDashboardRef.current ? FLAGGED_TOPIC_ID : undefined,
      );
      const frontier = frontierId ? Math.max(0, orderedIds.indexOf(frontierId)) : 0;
      const stored = await getLastTopicIndex(d.currentCourse.id);
      const idx = stored != null ? Math.min(stored, orderedIds.length - 1) : frontier;
      setTopicIdx(idx);
      setData(d);
      setDashboardCache(d, idx); // instant landing next time (owner 2026-08-17)
    } catch (e: any) {
      // A SILENT refresh that fails must never replace good on-screen content
      // with the error screen (owner 2026-08-17) — e.g. a brief offline blip on
      // return. The error state is for the no-content cold path only.
      if (dataRef.current) return;
      setErrorCode(e?.message ?? 'unknown');
      setError(
        e?.message === 'not_enrolled'
          ? 'No enrolled courses found for this account.'
          : e?.message === 'user_not_found'
            ? 'This account is not linked to a student record. Complete registration first.'
            : 'Could not load the dashboard. Check your connection and pull to retry.',
      );
    } finally {
      setLoading(false);
    }
  }, [commercialMode, caps]);

  useFocusEffect(
    useCallback(() => {
      // Defer the refetch until the landing transition has finished (owner
      // 2026-08-17): kicking off the fetch + full re-render mid-transition was
      // janking the arrival. Content (cached or live) is already on screen.
      const task = InteractionManager.runAfterInteractions(() => void load());
      return () => task.cancel();
    }, [load]),
  );

  // A study write commits asynchronously (flush on leaving a method + the 30s
  // loop). The focus-reload above can race ahead of that write and read stale
  // rows — leaving START/empty-LED even after real progress. Re-fetch whenever a
  // write actually lands, so the meters + START→CONTINUE catch up (Booth
  // 2026-07-15). The Dashboard stays mounted under the pushed study screen, so
  // this fires while the flush completes and again on return.
  useEffect(() => onStudyProgress(() => void load()), [load]);

  // Subscribe to scenario exemptions (owner launch-triage E4): hydrates the set
  // on mount and re-renders when a topic is confirmed to have no scenarios, so
  // the quiz gate below can unlock without a manual reload.
  useScenarioExempt();

  // Toggle Course ⇄ My Enrollment (user request 2026-07-22) — reload at once.
  const switchMode = useCallback(
    (next: 'course' | 'enrollment') => {
      if (viewModeRef.current === next) return;
      setViewMode(next);
      viewModeRef.current = next;
      void load();
    },
    [load],
  );

  // Keep the enrollment view in sync as the list is edited: reload on any change
  // while viewing it, and fall back to the course view if it empties.
  const enrolledKey = enrolled.map((e) => `${e.gs}${e.active ? '' : '!'}`).join(',');
  useEffect(() => {
    if (viewModeRef.current !== 'enrollment') return;
    // Reload as the enrollment list is edited; an empty list simply falls back to
    // the course/commercial fetch inside load() (user request 2026-07-23).
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrolledKey]);

  // Quiz-block glow pulse (quizPulse 2.4s ease-in-out infinite).
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Derived per-render (cheap; small arrays). When the user has opted in, a
  // synthetic "My Custom List" topic is appended LAST so it rides the same
  // current-topic carousel. It carries applicable_methods=[] so every derived
  // value (overallPct, quizState, rowsForTopic…) computes safely to 0/empty.
  const customTopic: Topic = {
    id: FLAGGED_TOPIC_ID,
    course_id: '',
    sequence_in_course: 9999,
    name: FLAGGED_TOPIC_NAME,
    applicable_methods: [],
    is_prerequisite: false,
    icon_url: null,
    global_sequence: null,
  };
  // Scroll order (owner 2026-08-01): resolved from the deck prefs — ALPHABETICAL
  // by default (★ Custom List pinned first), or the user's CUSTOM order; removed
  // topics are excluded. data.topics keeps its course order for the progress/
  // frontier logic; only this carousel is reordered.
  const deckMembers: Topic[] = data ? (customOnDashboard ? [customTopic, ...data.topics] : [...data.topics]) : [];
  const deckById = new Map(deckMembers.map((t) => [t.id, t] as const));
  const orderedIds = orderDeckIds(
    deckMembers.map((t) => ({ id: t.id, name: t.name })),
    deckPrefs,
    customOnDashboard ? FLAGGED_TOPIC_ID : undefined,
  );
  const topics = orderedIds.map((id) => deckById.get(id)).filter((t): t is Topic => t != null);
  const removedMembers = deckMembers
    .filter((t) => deckPrefs.removed.includes(t.id))
    .map((t) => ({ id: t.id, name: t.name }));
  const topic = topics[topicIdx];
  const isCustom = topic?.id === FLAGGED_TOPIC_ID;

  // Study-icon deep link (user request 2026-07-24): when navigated here with a
  // `focusGs` (a topic global_sequence, or FLAGGED_TOPIC_ID for the custom list),
  // front that topic immediately once its data is loaded, then clear the param.
  const focusGs = route.params?.focusGs;
  useEffect(() => {
    if (focusGs == null || topics.length === 0) return;
    const i = topics.findIndex((t) =>
      typeof focusGs === 'string' ? t.id === focusGs : t.global_sequence === focusGs,
    );
    if (i >= 0) setTopicIdx(i);
    navigation.setParams({ focusGs: undefined });
  }, [focusGs, topics, navigation]);
  const status = topic ? (data!.progressByTopic.get(topic.id)?.status ?? 'locked') : 'locked';
  const lastTopicIdx = Math.max(0, topics.length - 1);

  const goTo = useCallback(
    (next: number) => {
      if (!data) return;
      // Free roam across all topics (user request 2026-07-17); clamp only to
      // the real array bounds. A per-course gate will replace the old
      // per-topic frontier stop later.
      if (next < 0 || next > topics.length - 1) return;
      setTopicIdx(next);
      setLastTopicIndex(data.currentCourse.id, next);
    },
    [data, topics.length],
  );

  // Deck can shrink (topic removed) or reorder — keep topicIdx in bounds.
  useEffect(() => {
    setTopicIdx((i) => Math.min(i, Math.max(0, topics.length - 1)));
  }, [topics.length]);

  const goToRef = useRef(goTo);
  goToRef.current = goTo;
  const idxRef = useRef(topicIdx);
  idxRef.current = topicIdx;

  const pan = useRef(
    PanResponder.create({
      // A tap must still reach the trophy / title Pressables inside the card,
      // so DON'T claim on start. But a horizontal drag has to win over those
      // child Pressables — claim it in the CAPTURE phase so the parent
      // intercepts the swipe before the children (fix 2026-07-17: swipes that
      // began on the title/trophy were being eaten by the child Pressables and
      // never moved the topic). Vertical drags fall through to the ScrollView.
      onStartShouldSetPanResponder: () => false,
      // Stand down while the jog dial is held (owner 2026-08-01) — otherwise the
      // card's horizontal-swipe capture steals the dial's gesture and it freaks
      // out. jogActiveRef is set on the dial's touch-down (before this fires).
      onMoveShouldSetPanResponderCapture: (_e, g) =>
        !jogActiveRef.current && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      // Once we own the swipe, don't let the ScrollView steal it back.
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_e, g) => {
        if (g.dx <= -40) goToRef.current(idxRef.current + 1); // next topic
        else if (g.dx >= 40) goToRef.current(idxRef.current - 1); // prior topic
      },
    }),
  ).current;

  // Topic card tap → all terms in the topic (Booth 2026-07-18). Lazy-fetched
  // per open; list is display-only with a jump-off into the Glossary.
  const topicIdForTerms = topic?.id;
  const openTerms = useCallback(async () => {
    if (!topicIdForTerms) return;
    setTermsSource('topic');
    setTermsOpen(true);
    setTermList(null);
    try {
      const items = await fetchTopicItems(topicIdForTerms);
      setTermList(
        items
          .map((i) => ({ id: i.id, term: i.term }))
          .sort((a, b) => a.term.localeCompare(b.term)),
      );
    } catch {
      setTermList([]);
    }
  }, [topicIdForTerms]);

  // Flagged topic card tap → the user's own flagged terms in the same sheet.
  const openFlaggedTerms = useCallback(async () => {
    setTermsSource('flagged');
    setTermsOpen(true);
    setTermList(null);
    try {
      const items = await fetchGlossaryItemsByIds([...starred]);
      setTermList(items.map((i) => ({ id: i.id, term: i.term }))); // API pre-sorts by term
    } catch {
      setTermList([]);
    }
  }, [starred]);

  // Dev Visual Index: auto-open the Custom List terms popup for preview (TEMPORARY).
  useEffect(() => {
    if (consumeDevPreview('dashboard:terms')) void openFlaggedTerms();
  }, [openFlaggedTerms]);

  // Auto-open the not-yet-seen intro (user request 2026-07-18): the COURSE
  // intro first, then the CURRENT TOPIC's — so there is always an intro before
  // beginning. Each is shown once (persisted); re-openable from the card.
  useEffect(() => {
    if (!data || intro) return;
    // Only AUTO-open an intro that actually has authored content — otherwise an
    // empty placeholder modal would cover the dashboard and block all input
    // (bug fix 2026-07-18). The ⓘ buttons still open them on demand.
    const courseKey = `course:${data.currentCourse.id}`;
    if (!introSeen.has(courseKey) && !isIntroEmpty(getCourseIntro(data.currentCourse.name))) {
      setIntro({ kind: 'course', key: courseKey, name: data.currentCourse.name });
      return;
    }
    const t = topics[topicIdx];
    if (t) {
      const topicKey = `topic:${t.id}`;
      if (!introSeen.has(topicKey) && !isIntroEmpty(getTopicIntro(t.name))) {
        setIntro({ kind: 'topic', key: topicKey, name: t.name });
      }
    }
  }, [data, topics, topicIdx, introSeen, intro]);

  const dismissIntro = useCallback(() => {
    setIntro((cur) => {
      if (cur) {
        setIntroSeen((prev) => {
          const next = new Set(prev).add(cur.key);
          void AsyncStorage.setItem('ape:learnIntrosSeen', JSON.stringify([...next]));
          return next;
        });
      }
      return null;
    });
  }, []);

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  if (error || !data || !topic) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Nothing to show yet.'}</Text>
        {errorCode === 'user_not_found' && (
          <View style={{ width: 220 }}>
            <StudioButton
              label="Complete Registration"
              variant="primary"
              small
              // Auth lives on the ROOT stack; unknown route names bubble up
              // from the nested Study stack, so the loose cast is safe here.
              onPress={() => (navigation as any).navigate('Auth')}
            />
          </View>
        )}
        {/* Universal escape hatch (owner 2026-08-06): every failure that lands
            here used to offer only Retry — which re-runs the same failing
            fetch. When the CAUSE is a stale/broken session (e.g. an account
            with no student record persisted on-device), that loop can never
            resolve, so this exit SIGNS OUT first (clearing the poison session)
            and then returns to the login screen. Complete Registration above
            keeps the session on purpose — registration links the student
            record to that signed-in account.
            ("View course instead" removed from the error state — it switched
            mode but kept the same broken session, so it just bugged out.) */}
        <View style={{ width: 220 }}>
          <StudioButton
            label="Back to Login"
            variant={errorCode === 'user_not_found' ? 'secondary' : 'primary'}
            small
            onPress={() => {
              void supabase.auth
                .signOut()
                .catch(() => {})
                .then(() => (navigation as any).navigate('Auth'));
            }}
          />
        </View>
        <View style={{ width: 180 }}>
          <StudioButton label="Retry" variant="secondary" small onPress={load} />
        </View>
      </View>
    );
  }

  const prevStatus =
    topicIdx > 0 ? (data.progressByTopic.get(topics[topicIdx - 1].id)?.status ?? 'locked') : null;
  const provisional = prevStatus === 'passed_incomplete';

  // Enrollment view: this topic is INACTIVE (set aside) — shown but dimmed.
  const topicInactive =
    viewMode === 'enrollment' &&
    topic.global_sequence != null &&
    inactiveGs.current.has(topic.global_sequence);

  // EVERY real topic offers all four methods + a quiz — no exceptions (owner
  // 2026-08-13). The backend `applicable_methods` column is incomplete/legacy
  // (e.g. DAW gs3970 omits scenarios), so it is NOT authoritative here. Only the
  // synthetic Custom List pseudo-topic (a flagged-terms list) has no methods.
  const applicable = new Set<MethodKey>(isCustom ? [] : METHOD_ORDER.map((m) => m.key));
  // The membership gate is computed from the DISPLAYED topic as `actMembershipLocked`
  // (below, once dispTopic is known) — free = Safety gs3060 / DAW gs3970 only; gate
  // on ENTITLEMENT, never caps; fail closed when gs is missing.
  const rowsForTopic = data.methodRows.filter((r) => r.achievement_id === topic.id);
  const rowFor = (key: string) => rowsForTopic.find((r) => r.method_key === key);

  // POWER SEQUENCING — strict, staged unlock (owner 2026-08-13):
  //   1. Flashcards — always live.
  //   2. Fill-in-blank + Matching — power on once flashcards is complete.
  //   3. Scenarios — powers on only after flashcards AND fill-in-blank AND
  //      matching are ALL complete (never before).
  //   4. Quiz — powers on only after scenarios is complete (⇒ everything is).
  const rackItemCount = data.itemCountByTopic.get(topic.id) ?? 0;
  const rpFor = (key: string) => data.methodConfigs.find((c) => c.key === key)?.required_passes ?? 2;
  // Smooth display % for one method. A topic CONFIRMED to have no scenario content
  // (marked exempt by the Scenarios screen — owner launch-triage E4) reads 100%
  // for scenarios: its quiz already unlocks via the exemption, so its meter and
  // the topic's overall % must show complete too, not a stuck 0%.
  const smoothPct = (
    row: Parameters<typeof methodDisplayPct>[0],
    itemCount: number,
    key: string,
    topicId: string,
  ) =>
    key === 'scenarios' && isScenariosExempt(topicId) ? 100 : methodDisplayPct(row, itemCount, key, rpFor(key));
  const methodPct = (key: string) => Math.round(smoothPct(rowFor(key), rackItemCount, key, topic.id));
  const bypassLocks = devBypass('bypassMethodLocks');
  const flashcardsSeenAll = methodPct('flashcards') >= 100;
  const coreHomeworkComplete = methodPct('fill_in_blank') >= 100 && methodPct('matching') >= 100;
  // Scenarios is a hard term of the quiz gate; methodPct already treats a
  // confirmed-empty topic as 100% (smoothPct), so exempt topics read complete
  // and their quiz can't lock forever.
  const scenariosComplete = methodPct('scenarios') >= 100;
  // Stage 2 powered: fill-in-blank + matching.
  const homeworkPowered = bypassLocks || flashcardsSeenAll;
  // Stage 3 powered: scenarios — gated behind flashcards + the two core homeworks.
  const scenariosPowered = bypassLocks || (flashcardsSeenAll && coreHomeworkComplete);
  // Stage 4 gate: the quiz powers on only when every method before it is complete.
  const allMethodsComplete = flashcardsSeenAll && coreHomeworkComplete && scenariosComplete;

  // Topic "overall progress" = mean of the applicable methods' smooth display
  // progress (creeps with every pass, consistent with the per-method meters).
  const topicItemCount = data.itemCountByTopic.get(topic.id) ?? 0;
  // Overall progress iterates over the topic's applicable_methods (the SAME
  // source the per-method meters use), NOT methodConfigs — which is EMPTY for a
  // guest (study_methods 403s for anon), so overall read 0% while every meter
  // showed 100% (owner 2026-08-13). smoothPct handles the required_passes
  // fallback + the scenarios exemption so overall matches the per-method meters.
  const applicableKeys = METHOD_ORDER.filter((m) => applicable.has(m.key)).map((m) => m.key);
  const overallPct =
    applicableKeys.length > 0
      ? Math.floor(
          applicableKeys.reduce((s, k) => s + smoothPct(rowFor(k), topicItemCount, k, topic.id), 0) /
            applicableKeys.length,
        )
      : 0;

  // ---- Jog preview: the TOP container shows dispTopic while scrolling; the
  // lower rack stays on the committed `topic` until release (owner 2026-08-01).
  const overallPctFor = (t: Topic): number => {
    // Every real topic has all four methods (owner 2026-08-13); only the Custom
    // List pseudo-topic has none.
    const keys = t.id === FLAGGED_TOPIC_ID ? [] : METHOD_ORDER.map((m) => m.key);
    if (keys.length === 0) return 0;
    const rows = data.methodRows.filter((r) => r.achievement_id === t.id);
    const itemCount = data.itemCountByTopic.get(t.id) ?? 0;
    return Math.floor(
      keys.reduce((s, k) => s + smoothPct(rows.find((r) => r.method_key === k), itemCount, k, t.id), 0) /
        keys.length,
    );
  };
  const dispIdx = jogActive ? scrollIdx : topicIdx;
  const dispTopic = topics[dispIdx] ?? topic;
  const dispIsCustom = dispTopic.id === FLAGGED_TOPIC_ID;
  // The rack + quiz must ACT on the DISPLAYED topic (what the card shows), never
  // the frozen committed `topic`: mid-jog the two diverge, so tapping a method
  // while the carousel previews another topic opened the WRONG one and bypassed
  // the gate (user bug 2026-08-13: an Astronomical Acoustics card opened DAW's
  // flashcards). In steady state dispTopic === topic, so this only matters mid-jog.
  const actMembershipLocked =
    entitlement !== 'academy' &&
    !dispIsCustom &&
    !(dispTopic.global_sequence != null && isFreeEnrollGs(dispTopic.global_sequence));
  const dispTopicInactive =
    viewMode === 'enrollment' &&
    dispTopic.global_sequence != null &&
    inactiveGs.current.has(dispTopic.global_sequence);
  const dispOverallPct = jogActive ? overallPctFor(dispTopic) : overallPct;

  const topicProg = data.progressByTopic.get(topic.id);
  const rawQuizState =
    status === 'complete'
      ? 'passed'
      : status === 'passed_incomplete'
        ? 'partial'
        : // The quiz is READY (powers on) ONLY once flashcards + both core
          // homeworks + scenarios are all complete (owner 2026-08-13).
          allMethodsComplete
          ? 'ready'
          : 'locked';
  // DEV BYPASS (Booth 2026-07-18): quiz always startable for screen testing.
  // The server (`start_quiz_attempt`) still re-checks gates and may refuse —
  // that error surfacing is expected. Restore = devMode.ts → bypassQuizLocks:false.
  const quizState =
    rawQuizState === 'locked' && devBypass('bypassQuizLocks') ? 'ready' : rawQuizState;

  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        {/* Header (shared, 30%-enlarged tile — Booth 2026-07-08).
            Logo tap → About/Credits (Dashboard only). */}
        <AppHeader
          // The blue Study icon opens the Topic-Deck manager (owner 2026-08-01);
          // About moved to Settings.
          onLogoPress={() => setDeckOpen(true)}
          logo={
            <View style={styles.studyLogo}>
              {/* Scaled down with the smaller key (owner 2026-08-06); trimmed a
                  further ~13% to sit better inside its border (owner 2026-08-13). */}
              <View style={{ transform: [{ scale: 1.52 }] }}>
                <NavIcon icon="Study" lit showLabel={false} />
              </View>
            </View>
          }
          right={
            // "My Enrollments" → the enrollment screen. Styled to MATCH the home
            // screen's green Enrollments nav button (dark box + green border/text)
            // rather than the lighter glass look (user request 2026-07-23).
            <Pressable
              style={styles.myEnrollBtn}
              onPress={() => (navigation as any).navigate('Awards', { category: 'enrollment' })}
              accessibilityRole="button"
              accessibilityLabel="Enrollments"
            >
              <Text style={styles.myEnrollBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                ENROLLMENTS
              </Text>
            </Pressable>
          }
        />

        {/* Stranded-session banner (owner 2026-08-06): shown when a persisted
            session had no student record and we self-healed to the free view.
            Non-blocking — the free topics are usable above/below it. */}
        {strandedSession ? (
          <View style={styles.strandedBanner}>
            <Text style={styles.strandedText}>
              You’re signed in, but this account isn’t linked to a student record yet — showing the free
              topics. Finish setting up to save progress, or sign out to switch accounts.
            </Text>
            <View style={styles.strandedRow}>
              <StudioButton
                label="Complete Registration"
                variant="primary"
                small
                onPress={() => (navigation as any).navigate('Auth')}
              />
              <StudioButton
                label="Sign Out"
                variant="secondary"
                small
                onPress={() => {
                  void supabase.auth
                    .signOut()
                    .catch(() => {})
                    .then(() => (navigation as any).navigate('Auth'));
                }}
              />
            </View>
          </View>
        ) : null}

        {/* R6c: Audio Fundamentals labs credit — renders only once earned. */}
        <FundamentalsCreditBanner />

        {/* The COURSE ⇄ MY ENROLLMENT toggle was removed (user request
            2026-07-23) — the dashboard follows the enrollment list, adjusted via
            the "My Enrollments" button above. */}

        {/* Topic title block (swipeable — free roam across all topics) */}
        <View
          {...pan.panHandlers}
          style={[styles.topicCard, provisional && styles.topicCardProvisional, dispTopicInactive && styles.topicCardInactive]}
        >
          {/* Texture removed + darkened 2 more shades (Booth 2026-07-11) — the
              Current Topic display is now a plain dark panel. */}
          {/* pilot dot removed (Booth 2026-07-11 #6). */}
          {/* Current topic's trophy, top-right — ALWAYS full clarity here, even
              when unearned (the gray→lit earn state lives on the Achievements
              screen; the Dashboard shows the topic art at full illumination).
              Booth 2026-07-09d. Subtle placeholder when the topic has no art. */}
          {/* Header row (owner 2026-08-01): labels + % on the LEFT, the trophy
              over the enlarged jog wheel in the CENTER, and the overall-progress
              meter as a vertical VU column (filling up) on the FAR RIGHT. */}
          <View style={styles.topicHeadRow}>
            <View style={styles.topicTextCol}>
              {/* The whole left half is now the SAME glass-covered LED readout
                  as the method screens below (owner 2026-08-06): recessed
                  cutout, dark screen face, one tinted pane over the lit text.
                  GlassCover never intercepts touches, so tap/swipe still work. */}
              <View style={[styles.cutoutMount, styles.topicGlass]}>
                {/* Tap the title area → full term list for this topic (Booth
                    2026-07-18). Swipe still owned by the card's PanResponder. */}
                <Pressable
                  onPress={isCustom ? openFlaggedTerms : openTerms}
                  accessibilityRole="button"
                  accessibilityLabel={isCustom ? `List terms in ${topic.name}` : `List all terms in ${topic.name}`}
                >
                  <Text style={styles.topicEyebrow}>{dispTopicInactive ? 'CURRENT TOPIC · INACTIVE' : 'CURRENT TOPIC'}</Text>
                  <Text style={[styles.topicName, dispTopicInactive && styles.topicNameDim]}>{dispTopic.name}</Text>
                  <Text style={styles.topicMeta}>
                    {dispIsCustom
                      ? `${starred.size} TERM${starred.size === 1 ? '' : 'S'}`
                      : `TOPIC ${dispIdx + 1} OF ${topics.length} · ${data.currentCourse.name.toUpperCase()}`}
                  </Text>
                </Pressable>
                {/* Overall progress — label left-justified, the amber % below
                    it (owner 2026-08-01). */}
                <View style={styles.pctBlock}>
                  <Text style={styles.pctLabel}>OVERALL TOPIC PROGRESS</Text>
                  <Text style={styles.pctBig}>{dispOverallPct}%</Text>
                </View>
                <GlassCover />
                {/* Prev / next topic — top-right of the glass, level with the
                    CURRENT TOPIC eyebrow (owner 2026-08-12). Rendered ABOVE the
                    pointer-transparent GlassCover so they stay tappable. */}
                <View style={styles.topicNavArrows}>
                  <Pressable
                    onPress={() => goTo(topicIdx - 1)}
                    disabled={topicIdx <= 0}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="Previous topic"
                  >
                    <Text style={[styles.topicNavArrow, topicIdx <= 0 && styles.pctArrowDisabled]}>‹</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => goTo(topicIdx + 1)}
                    disabled={topicIdx >= lastTopicIdx}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="Next topic"
                  >
                    <Text style={[styles.topicNavArrow, topicIdx >= lastTopicIdx && styles.pctArrowDisabled]}>›</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.topicCenterCol}>
              {/* Tap the trophy → full-size popup (Booth 2026-07-11). */}
              <Pressable
                style={[styles.topicTrophy, styles.topicTrophyBevel]}
                onPress={() => setTrophyOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={`View ${topic.name} trophy`}
              >
                {/* Image 92 inside the 2+2 bevel keeps the 100px footprint —
                    the card height doesn't grow (owner 2026-08-06). */}
                <TrophyImage
                  iconUrl={trophyForTopicName(trophies, dispTopic.name) ?? dispTopic.icon_url}
                  size={92}
                  radius={10}
                  fallback={<View style={styles.topicTrophyEmpty} />}
                />
              </Pressable>
              {/* Jog dial — hold it and turn; the big mirror wheel opens
                  instantly and the same gesture scrolls the topics (owner
                  2026-08-01). Endless spin: the index wraps. Hidden (but still
                  driving the gesture) while the full-size wheel is open. */}
              <View style={[styles.topicJog, jogActive && styles.hidden]}>
                {/* Small dial just OPENS the big wheel (owner 2026-08-06); the
                    big wheel is the turn control. Tap or press-hold both open. */}
                <JogDial
                  size={96}
                  disabled={topics.length <= 1}
                  onOpen={() => {
                    jogActiveRef.current = true;
                    scrollIdxRef.current = idxRef.current;
                    setScrollIdx(idxRef.current);
                    setJogActive(true);
                  }}
                />
              </View>
            </View>

            {/* Overall progress — vertical VU column, filling upward. */}
            <View style={styles.topicMeterCol}>
              {/* Always at least 1 green segment lit (owner 2026-08-06). midi:
                  EXPERIMENTAL blue→red comparison on this vertical meter ONLY —
                  likely to be reverted. */}
              <LedMeter filled={Math.max(1, segmentsForPct(dispOverallPct))} vertical midi />
            </View>
          </View>
          {/* Topic/course intro buttons removed (user request 2026-07-18) — the
              intros still auto-show once before beginning (when content exists). */}
          {provisional && (
            <Text style={styles.provisionalNote}>
              Provisional access — score 24+ on the previous topic to earn its trophy and continue
              further.
            </Text>
          )}
          {/* Same gray-lip-over-black-line lower edge as the glass readouts
              (owner 2026-08-06). The black line is the card's own bottom border
              (set below); this gray line sits just above it. */}
          <View pointerEvents="none" style={styles.glassBottomHighlight} />
        </View>

        {/* Method blocks 1–5 — each frame carries its OWN LED meter (Booth
            2026-07-07: 6 meters total on this screen incl. the topic card).
            Rack group: tight inter-panel gap like a real 500 lunchbox (#6). */}
        <View style={styles.rackGroup}>
        {isCustom ? (
          // Custom List body — no methods, no quiz: a single dark panel that
          // studies the user's ★ starred terms in local Flashcards mode.
          <ElevatedFrame depressed={false} contentStyle={styles.methodInner}>
            <View style={styles.customRow}>
              <View style={styles.customDeck}>
                <DeckIcon color={colors.blue} size={40} fill="rgba(47,155,255,0.22)" />
              </View>
              <View style={styles.methodLeft}>
                <Text style={styles.customCount}>
                  {`${starred.size} TERM${starred.size === 1 ? '' : 'S'} · MY CUSTOM LIST`}
                </Text>
              </View>
              <SwitchButton
                label="Study"
                variant="primary"
                width={96}
                height={RACK_QUIZ_SWITCH_H}
                disabled={starred.size === 0}
                onPress={() =>
                  navigation.navigate('Flashcards', {
                    achievementId: FLAGGED_TOPIC_ID,
                    topicName: FLAGGED_TOPIC_NAME,
                  })
                }
              />
            </View>
          </ElevatedFrame>
        ) : (
          <>
        {METHOD_ORDER.map((m, i) => {
          const isApplicable = applicable.has(m.key);
          const cfgRow = rowFor(m.key);
          // Smooth display progress (Booth: creep, never leap) — partial
          // credit per pass from the server-stored item_states. Gate lines
          // below still read the server completion/time/accuracy fields.
          // smoothPct handles the required_passes fallback + the scenarios
          // exemption (an empty-scenarios topic reads 100% so its meter matches
          // the unlocked quiz — owner launch-triage E4).
          const pct = Math.round(smoothPct(cfgRow, data.itemCountByTopic.get(topic.id) ?? 0, m.key, topic.id));
          const complete = isApplicable && pct >= 100;
          // Power gate: flashcards is always live; the 3 homework methods light
          // up only once flashcards has shown every term once (owner 2026-08-11).
          // Staged power: flashcards always; fill-in-blank/matching after
          // flashcards; scenarios only after both of those too (owner 2026-08-13).
          const powered =
            m.key === 'flashcards' ? true : m.key === 'scenarios' ? scenariosPowered : homeworkPowered;
          return (
            // 3D console-key frame (Booth 2026-07-09): raised while incomplete,
            // DEPRESSED (indented) once at 100%. Unavailable methods (ear
            // training / scenarios) render already-indented + grayed.
            // Unavailable methods are NOT recessed or dimmed — every slot reads
            // as one mounted 500-series surface (Booth 2026-07-10 #9).
            <View key={m.key}>
              {/* Section header over the homework methods (owner 2026-08-11) —
                  a vented blank rack panel, per the studio-rack reference. */}
              {m.key === 'fill_in_blank' ? (
                <View style={styles.sectionPanelWrap}>
                  <SectionRackPanel label="Homework" angles={[6, -5]} />
                </View>
              ) : null}
              {/* All method panels share the SAME gray coat again (user request
                  2026-07-23) — the Flashcards charcoal special-case was reverted. */}
              <ElevatedFrame depressed={complete} contentStyle={styles.methodInner}>
                {/* Panel face: methods use the default gray; FLASHCARDS wears the
                    lighter LA-2A gray (owner 2026-08-11). */}
                <BlackFaceBg lighter={m.key === 'flashcards'} />
                {/* 4 corner mounting screws pinned to the panel corners (owner 2026-08-11) */}
                <CornerScrews angles={[SCREW_ROT[i][0], SCREW_ROT[i][1], SCREW_ROT[i][1], SCREW_ROT[i][0]]} />
                {/* Layout (Booth 2026-07-09e): a flex LEFT column (title row +
                    a PARTIAL-width LED meter) with a SQUARE action button on the
                    right. The LED no longer spans the full container width. */}
                <View style={styles.methodRow}>
                  {/* Icon in its recessed well. The glyph is always lit; the
                      ICON TILE's own thin line stays OFF (default faint line)
                      while the method still needs work, and LIGHTS (70% glow)
                      in the method color once the method is complete — a "done"
                      cue, inverted from the old needs-action glow (user request
                      2026-07-17). */}
                  <View style={[styles.cutoutMount, styles.iconWell]}>
                    <View style={styles.iconSticker}>
                      <MethodIcon
                        method={m.key}
                        size={RACK_ICON}
                        // Glyph lit when powered; fully dark (accents suppressed)
                        // when the stage is powered off (owner 2026-08-11). Frame
                        // lights on complete.
                        off={!powered}
                        color={powered ? undefined : OFF_ICON}
                        glowColor={powered && isApplicable && complete ? METHOD_COLORS[m.key] : undefined}
                      />
                    </View>
                    {/* Same tinted-glass pane as the title readout (owner 2026-08-06). */}
                    <GlassCover />
                  </View>
                  <View style={styles.methodLeft}>
                    {/* LED instrument screen under one glass panel (owner
                        2026-08-06): TITLE · % · full-width LED meter. */}
                    <GlassScreen
                      title={m.label}
                      // % only ever shows 0–99 (never "100%"): completion swaps
                      // it for the green check via `complete` below.
                      value={isApplicable ? `${Math.min(pct, 99)}%` : '--'}
                      // Command AMBER, not pctColor's orange (owner 2026-08-06) —
                      // completion is signalled by the green check, not a ramp.
                      valueColor={isApplicable ? colors.amber : '#6f7072'}
                      // Always at least 1 green segment lit (owner 2026-08-06).
                      segments={isApplicable ? Math.max(1, segmentsForPct(pct)) : 0}
                      complete={complete}
                      off={!powered}
                    />
                  </View>

                  {!powered ? (
                    // Powered off — a DEAD clear cap: no light, no colour, no nav.
                    <SwitchButton label="" variant="clear" width={89} height={RACK_SWITCH_H} disabled />
                  ) : isApplicable ? (
                    <SwitchButton
                      // Start (blue) → Continue (amber) → Review (green), by progress.
                      label={pct >= 100 ? 'Review' : pct <= 0 ? 'Start' : 'Continue'}
                      variant={pct >= 100 ? 'success' : pct <= 0 ? 'outline' : 'primary'}
                      width={89}
                      height={RACK_SWITCH_H}
                      onPress={() => {
                        // Locked/paid topic + non-member → the study-access sheet
                        // instead of opening the study method.
                        if (actMembershipLocked) {
                          setUpgradeOpen(true);
                          return;
                        }
                        const routeName = STUDY_ROUTES[m.key];
                        if (routeName) {
                          navigation.navigate(routeName, { achievementId: dispTopic.id, topicName: dispTopic.name });
                        }
                      }}
                    />
                  ) : devBypass('bypassMethodLocks') ? (
                    // DEV BYPASS (Booth 2026-07-18): dead switches come alive so
                    // every method screen is reachable (may be empty of content).
                    // Restore = devMode.ts → bypassMethodLocks:false.
                    <SwitchButton
                      label="Open"
                      variant="outline"
                      width={89}
                      height={RACK_SWITCH_H}
                      onPress={() => {
                        const routeName = STUDY_ROUTES[m.key];
                        if (routeName) {
                          navigation.navigate(routeName, { achievementId: topic.id, topicName: topic.name });
                        }
                      }}
                    />
                  ) : (
                    // Inactive slots carry the SAME action button as a CLEAR,
                    // UNLIT cap (not grey) — a DEAD switch: it travels + clicks
                    // on touch but opens nothing (Booth 2026-07-11).
                    <SwitchButton label="" variant="clear" width={89} height={RACK_SWITCH_H} disabled />
                  )}
                </View>
              </ElevatedFrame>
            </View>
          );
        })}

        {/* Section header over the quiz (owner 2026-08-11) — a vented blank
            rack panel; marks the quiz as the proficiency gate for the topic. */}
        <SectionRackPanel label="Complete This Topic" angles={[-6, 5]} />

        {/* Quiz — the 6th slot in the SAME rack (same tight gap, Booth
            2026-07-10 #4). Kept RAISED at all times (Booth 2026-07-11 #4): when
            passed it was seating while the inactive method panels beside it stay
            proud, which read as the quiz being recessed below its neighbours.
            No static amber accent — the animated quizPulseBorder is the only
            amber cue, so the scenarios→quiz seam matches every method frame. */}
        <ElevatedFrame depressed={false} contentStyle={styles.methodInner}>
          {/* Mid LA-2A gray face — same as the Flashcards panel (owner 2026-08-11). */}
          <BlackFaceBg light />
          <CornerScrews angles={[0, 5, -4, 3]} />
          {/* Amber attention pulse only once the quiz has POWERED ON and is
              ready to take (owner 2026-08-11) — never on the dead/locked panel. */}
          {quizState === 'ready' && (
            <Animated.View pointerEvents="none" style={[styles.quizPulseBorder, { opacity: pulseOpacity }]} />
          )}
          {/* Same anatomy as the method rows so every object aligns (#4):
              screw · icon square · title+status LED column · switch · screw. */}
          {(() => {
            const score = topicProg?.best_genuine_score ?? '';
            // Powered on iff not locked (quizState is locked until the homework
            // methods are complete — see rawQuizState above).
            const quizPowered = quizState !== 'locked';
            const qColor =
              quizState === 'ready' || quizState === 'passed'
                ? '#5bff85'
                : quizState === 'partial'
                  ? '#ffc04a'
                  : '#ff6a5e';
            const qShort =
              quizState === 'passed' || quizState === 'partial'
                ? `${score}/25`
                : quizState === 'ready'
                  ? 'READY'
                  : 'LOCKED';
            const qSummary =
              quizState === 'locked'
                ? 'GATES UNMET'
                : quizState === 'ready'
                  ? 'ALL GATES MET'
                  : quizState === 'passed'
                    ? `PASSED ${score}/25`
                    : 'RETRY FOR 24+';
            return (
              <>
                <View style={styles.methodRow}>
                  <View style={[styles.cutoutMount, styles.iconWell]}>
                    <View style={styles.iconSticker}>
                      <MethodIcon
                        method="quiz"
                        size={RACK_ICON}
                        // Dark when powered off; PASSED → the whole icon goes
                        // GREEN (glyph AND border) once powered (owner 2026-08-11).
                        off={!quizPowered}
                        color={!quizPowered ? OFF_ICON : quizState === 'passed' ? '#3fe06a' : undefined}
                        glowColor={quizPowered && quizState === 'passed' ? '#3fe06a' : undefined}
                      />
                    </View>
                    {/* Same tinted-glass pane as the title readout (owner 2026-08-06). */}
                    <GlassCover />
                  </View>
                  <View style={styles.methodLeft}>
                    {/* Same LED-screen-under-glass as the method panels (owner
                        2026-08-06): TITLE · status · gate summary line. */}
                    <GlassScreen title="TOPIC QUIZ" value={qShort} valueColor={qColor} subtitle={qSummary} subtitleColor={qColor} off={!quizPowered} />
                  </View>
                  {!quizPowered ? (
                    // Powered off — a DEAD clear cap, no light/colour/nav.
                    <SwitchButton label="" variant="clear" width={96} height={RACK_QUIZ_SWITCH_H} disabled />
                  ) : (
                    <SwitchButton
                      label={quizState === 'passed' ? 'Practice' : quizState === 'partial' ? 'Retry' : 'Start'}
                      variant={quizState === 'passed' ? 'success' : 'primary'}
                      width={96}
                      height={RACK_QUIZ_SWITCH_H}
                      onPress={() => {
                        if (actMembershipLocked) {
                          setUpgradeOpen(true);
                          return;
                        }
                        navigation.navigate('Quiz', { achievementId: dispTopic.id, topicName: dispTopic.name });
                      }}
                    />
                  )}
                </View>

                {/* No gate-line readout when powered off — the dead panel stays
                    dark (owner 2026-08-11); the sequence itself is the guidance. */}
              </>
            );
          })()}
        </ElevatedFrame>
          </>
        )}
        </View>

        {/* The bottom "My Custom List" card was removed (user request
            2026-07-24). The custom list is moving to a selection from the topic
            carousel at the top of the current-topic area. */}
      </ScrollView>

      <TrophyModal
        visible={trophyOpen}
        iconUrl={trophyForTopicName(trophies, topic.name) ?? topic.icon_url}
        name={topic.name}
        onClose={() => setTrophyOpen(false)}
      />

      {/* Topic term list (Booth 2026-07-18): every term in the current topic. */}
      <Modal
        visible={termsOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setTermsOpen(false)}
      >
        <View style={styles.termsBackdrop}>
          <View style={[styles.termsSheet, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.termsHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.termsEyebrow}>
                  {termsSource === 'flagged' ? 'MY CUSTOM LIST' : 'ALL TERMS IN TOPIC'}
                </Text>
                <Text style={styles.termsTitle} numberOfLines={1}>
                  {termsSource === 'flagged' ? FLAGGED_TOPIC_NAME : topic.name}
                </Text>
              </View>
              <Pressable
                onPress={() => setTermsOpen(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close term list"
              >
                <Text style={styles.termsClose}>✕</Text>
              </Pressable>
            </View>
            {termList == null ? (
              <View style={{ paddingVertical: 32 }}>
                <ActivityIndicator color={colors.amber} />
              </View>
            ) : (
              <>
                <Text style={styles.termsCount}>
                  {termList.length} term{termList.length === 1 ? '' : 's'}
                </Text>
                <FlatList
                  data={termList}
                  keyExtractor={(t) => t.id}
                  style={{ flexGrow: 0 }}
                  renderItem={({ item }) => (
                    <View style={styles.termsRow}>
                      <Text style={styles.termsRowText} numberOfLines={1}>
                        {item.term}
                      </Text>
                      {/* Select icons (Booth 2026-07-18): tag this term into
                          the user's flagged/heart/notify/known lists. */}
                      <TermSelectIcons
                        id={item.id}
                        bookmarkCtx={termsSource === 'flagged' ? 'glossary' : (topicIdForTerms ?? 'glossary')}
                        // The custom-list ('flagged') popup shows ONLY the custom
                        // icon (no bookmark / ✓ / ✗); topic-term popups keep them.
                        hideBookmark={termsSource === 'flagged'}
                        hideKnown={termsSource === 'flagged'}
                      />
                    </View>
                  )}
                />
              </>
            )}
            <View style={{ marginTop: 10 }}>
              {termsSource === 'flagged' ? (
                <GlassButton
                  label="STUDY FLASHCARDS"
                  tint="orange"
                  height={42}
                  onPress={() => {
                    setTermsOpen(false);
                    navigation.navigate('Flashcards', {
                      achievementId: FLAGGED_TOPIC_ID,
                      topicName: FLAGGED_TOPIC_NAME,
                    });
                  }}
                />
              ) : (
                <GlassButton
                  label="OPEN IN GLOSSARY"
                  tint="blue"
                  height={42}
                  onPress={() => {
                    setTermsOpen(false);
                    navigation.navigate('Glossary', {
                      courseId: data.currentCourse.id,
                      courseCode: data.currentCourse.code,
                      achievementId: topic.id,
                      topicName: topic.name,
                    });
                  }}
                />
              )}
            </View>
          </View>
        </View>
        <LowLightDim />
      </Modal>

      {/* Study gate (user request 2026-08-12/13): a locked/paid topic loads and is
          browsable, but tapping a study method raises the topic-specific STUDY
          ACCESS sheet for non-members (distinct copy from the generic ACADEMY MODE
          upgrade sheet). Free topics + academy members are never gated. */}
      <StudyAccessSheet
        visible={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onUnlock={() => {
          setUpgradeOpen(false);
          (navigation as any).navigate('Paywall');
        }}
      />

      {/* Big-wheel jog popup (owner 2026-08-01) — stays open while in use; the
          ✕ key (or a clean second tap on the dial) closes it (owner 2026-08-06). */}
      <JogOverlay
        active={jogActive}
        spin={jogSpin}
        disabled={topics.length <= 1}
        // Drag the big wheel to preview the top container; commit on close.
        onStep={(dir) => {
          const n = topics.length;
          if (n <= 0) return;
          const next = (((scrollIdxRef.current + dir) % n) + n) % n;
          scrollIdxRef.current = next;
          setScrollIdx(next);
        }}
        onClose={() => {
          jogActiveRef.current = false;
          setJogActive(false);
          goTo(scrollIdxRef.current);
        }}
      />

      {/* Topic-deck manager (blue Study icon) — reorder / remove / jump / mode. */}
      <TopicDeckSheet
        visible={deckOpen}
        onClose={() => setDeckOpen(false)}
        mode={deckPrefs.mode}
        active={topics.map((t) => ({ id: t.id, name: t.name }))}
        removed={removedMembers}
        onSetMode={setDeckMode}
        onReorder={setDeckOrder}
        onRemove={removeFromDeck}
        onRestore={restoreToDeck}
        onSelect={(id) => {
          const i = topics.findIndex((t) => t.id === id);
          if (i >= 0) goTo(i);
          setDeckOpen(false);
        }}
      />

      {/* Method-cards intro placeholder (Booth 2026-07-18). */}
      <ScreenIntroOverlay introKey="dashboard" />

      {/* Topic / course learning intro (user request 2026-07-18) — shown before
          the student begins; content fills in as topics/courses are developed. */}
      {intro ? (
        <LearningIntroSheet
          visible
          kind={intro.kind}
          title={intro.name}
          intro={intro.kind === 'course' ? getCourseIntro(intro.name) : getTopicIntro(intro.name)}
          onBegin={dismissIntro}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  center: {
    flex: 1,
    backgroundColor: colors.screenBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xxl,
  },
  errorText: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSub,
    textAlign: 'center',
  },
  scroll: { padding: 14, paddingBottom: 10, gap: 8 },
  // Stranded-session self-heal banner.
  strandedBanner: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.5)',
    backgroundColor: 'rgba(255,180,0,.08)',
    padding: 12,
    gap: 10,
  },
  strandedText: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  strandedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // Topic term-list sheet (Booth 2026-07-18).
  termsBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.7)', justifyContent: 'flex-end' },
  termsSheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2b2e',
    backgroundColor: '#141517',
    padding: 16,
  },
  termsHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  termsEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 2, color: colors.amber },
  termsTitle: { fontFamily: fonts.oswaldMedium, fontSize: 20, color: colors.textPrimary, marginTop: 2 },
  termsClose: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSub, padding: 4 },
  termsCount: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginBottom: 8 },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#212226',
    paddingVertical: 9,
  },
  termsRowText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 15, color: colors.textSecondary },

  // The user's custom "Flagged" topic card (Booth 2026-07-18) — same chassis
  // metal as the topic display, standalone below the rack.
  flagCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1f2021',
    borderWidth: 2.5,
    borderTopColor: '#4d4e52',
    borderLeftColor: '#34353a',
    borderRightColor: '#34353a',
    borderBottomColor: '#070708',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 2,
  },
  flagStar: {
    fontSize: 30,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.5)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },


  topicCard: {
    // Powder-coat panel base (fallback behind the PanelFace texture), 3 shades
    // darker than the panels below (Booth 2026-07-11). overflow clips the coat
    // to the rounded top corners.
    backgroundColor: '#1f2021',
    overflow: 'hidden',
    // Metallic 500-series CHASSIS frame (Booth 2026-07-11 #3): light top edge,
    // dark bottom — as if this display is mounted in the same rack chassis the
    // method panels sit in. Darkened 1 more step all around (Booth 2026-07-11).
    borderWidth: 2.5,
    borderTopColor: '#4d4e52',
    borderLeftColor: '#34353a',
    borderRightColor: '#34353a',
    // Pure black bottom line (owner 2026-08-06) — the glassBottomHighlight gray
    // lip sits just above it, matching the glass readouts' lower edge.
    borderBottomColor: '#000000',
    borderBottomWidth: 1,
    // Square bottom corners so the side rails flow straight into the rack
    // chassis below (Booth 2026-07-11 #5).
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
    // Tall enough for the center trophy+jog cluster and the far-right vertical
    // meter (owner 2026-08-01) — the card clips its overflow, so reserve room.
    // Trimmed a little (owner 2026-08-06) so the full screen fits without scroll.
    minHeight: 222,
  },
  topicCardProvisional: {
    // [TBD-DESIGN] proposal #1: warm tint + orange border for clamped topics.
    borderColor: 'rgba(255,138,30,.65)',
    backgroundColor: '#1d1206',
  },
  // Enrollment view: inactive topic panel reads set-aside (user request 2026-07-22).
  topicCardInactive: { borderTopColor: '#3a3a3a', backgroundColor: '#151515', opacity: 0.82 },
  topicNameDim: { opacity: 0.55 },
  // COURSE ⇄ MY ENROLLMENT toggle (user request 2026-07-22).
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  modeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#131313',
  },
  modeBtnOn: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,.1)' },
  modeBtnOnGreen: { borderColor: 'rgba(55,224,95,.7)', backgroundColor: 'rgba(55,224,95,.1)' },
  modeBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSub },
  // MY ENROLLMENTS header button — matches the home screen's green Enrollments
  // nav button (user request 2026-07-23).
  myEnrollBtn: {
    width: 82,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.7)',
    backgroundColor: 'rgba(55,224,95,.1)',
  },
  myEnrollBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.2, color: '#37e05f' },
  // Blue Study icon standing in for the company logo (owner 2026-08-01) — the
  // NavIcon Study glyph scaled up to the logo footprint.
  // Bordered so it reads as a pressable BUTTON (owner 2026-08-06) — the study
  // headphones sit in a subtly-lit rounded key that opens the Topic Deck.
  // Sized down (owner 2026-08-06) — the 47px key crowded the header title.
  studyLogo: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(120,155,190,0.55)',
    backgroundColor: 'rgba(47,155,255,0.08)',
  },
  modeBtnTextOn: { color: colors.amber },
  modeBtnTextOnGreen: { color: '#37e05f' },
  pilotDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4a4a4a',
    borderWidth: 1,
    borderColor: '#222222',
  },
  topicEyebrow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.4)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  // Header row + its three columns (owner 2026-08-01).
  topicHeadRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  // Stretches so its glass pane spans the full card height beside the trophy
  // cluster (owner 2026-08-06).
  topicTextCol: { flex: 1, minWidth: 0, alignSelf: 'stretch' },
  // The left-half glass LED readout — same recipe as the method screens:
  // cutoutMount edges + dark face + GlassCover pane (owner 2026-08-06).
  topicGlass: {
    flex: 1,
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: '#050608',
    borderRadius: 3,
    paddingHorizontal: 9,
    paddingVertical: 7,
    // Top-aligned (owner 2026-08-11): the progress block sits just below the
    // meta line at a CONSISTENT gap. 'space-between' pushed it to the bottom, so
    // the meta→progress gap ballooned whenever the meta was one line instead of
    // two.
    justifyContent: 'flex-start',
  },
  topicCenterCol: { alignItems: 'center', justifyContent: 'flex-start', gap: 6 },
  topicMeterCol: { alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  topicTrophy: { width: 100, height: 100 },
  // Beveled frame around the topic image (owner 2026-08-06): RAISED metal lip
  // lit from the same top-left as the glass panes' specular sweep — light
  // top/left edges, shadow bottom/right — complementary to (not copying) the
  // recessed cutoutMount used by the readouts.
  topicTrophyBevel: {
    padding: 2,
    borderWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.35)',
    borderLeftColor: 'rgba(255,255,255,0.20)',
    borderBottomColor: '#000000',
    borderRightColor: 'rgba(0,0,0,0.72)',
    borderRadius: 13,
    backgroundColor: '#101113',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Jog wheel under the trophy image, centered + enlarged (owner 2026-08-01).
  topicJog: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  // Small dial hidden (still interactive) while the full-size wheel is open.
  hidden: { opacity: 0 },
  topicTrophyEmpty: {
    width: 92,
    height: 92,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  // Keep title/meta clear of the trophy in the top-right.
  // Behind-glass fuzz (owner 2026-08-06) — the smallest soft halo so the text
  // reads as sitting under the pane, not printed on it (RN <Text> has no true
  // blur; a faint same-tone textShadow is the softening).
  topicName: {
    fontFamily: fonts.oswaldMedium,
    fontSize: 18,
    letterSpacing: 0.4,
    color: colors.textPrimary,
    marginTop: 4,
    textShadowColor: 'rgba(220,228,238,0.35)',
    textShadowRadius: 3.4,
    textShadowOffset: { width: 0, height: 0 },
  },
  topicMeta: {
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 12,
    letterSpacing: 0.7,
    color: colors.textSub,
    marginTop: 2,
    textShadowColor: 'rgba(200,210,222,0.3)',
    textShadowRadius: 3.4,
    textShadowOffset: { width: 0, height: 0 },
  },
  pctBlock: { alignItems: 'flex-start', marginTop: 6, gap: 1 },
  // Prev/next topic arrows — absolute, top-right of the glass, on the CURRENT
  // TOPIC eyebrow line (owner 2026-08-12).
  topicNavArrows: { position: 'absolute', top: 3, right: 8, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 4 },
  topicNavArrow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 30,
    lineHeight: 32,
    color: colors.amber,
    paddingHorizontal: 5,
  },
  pctArrowDisabled: { color: '#45454d' },
  pctBig: {
    fontFamily: fonts.oswaldBold,
    fontSize: 32,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.5)',
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  pctLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.textSubAlt,
    textShadowColor: 'rgba(200,205,212,0.3)',
    textShadowRadius: 3.4,
    textShadowOffset: { width: 0, height: 0 },
  },
  provisionalNote: {
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 13,
    letterSpacing: 0.5,
    color: colors.orange,
    marginTop: 10,
  },

  methodFrame: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
  },
  // Real 500-series blank-panel proportion (~3.5:1 on its side) restored via
  // minHeight; the 58px content row centers, so icon/title/LED/button still
  // share top+bottom edges (Booth 2026-07-11 #4/#5).
  methodInner: { paddingVertical: rs(6), paddingHorizontal: RACK_SCREW + 5, minHeight: rs(80), justifyContent: 'center' },
  // Section dividers as VENTED BLANK RACK PANELS (owner 2026-08-11): same
  // ElevatedFrame + black-face + screws as the method rows, with punched vent
  // slats flanking the engraved label. Height rides methodInner (equal slots).
  sectionPanelWrap: { marginBottom: 8 },
  // HALF-RU filler panel (owner 2026-08-11 rev2): half the method-slot height,
  // content back to vertical CENTER (the taller panel's lower-half bias is out).
  sectionInner: {
    minHeight: rs(40),
    paddingVertical: rs(4),
    paddingHorizontal: RACK_SCREW + 5,
    justifyContent: 'center',
  },
  // The single per-side mounting screw, vertically centred like a 0.5U filler.
  sideScrew: { position: 'absolute', top: '50%', marginTop: -RACK_SCREW / 2, zIndex: 3 },
  // Laser-cut stencil label lit from behind (owner 2026-08-11): two stacked
  // layers share this base; the wrap centres them and the glow layer fills it.
  // Backlit laser-cut stencil with CUT-EDGE DEPTH (owner 2026-08-11). Four
  // stacked layers: dim bloom behind → dark top wall → lit bottom lip → the
  // recessed glowing cut on top. The panel reads as having real thickness, the
  // light coming from below through the bore.
  stencilWrap: { flexShrink: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  stencilBase: {
    fontFamily: fonts.panelSemiBold,
    fontSize: rt(10.5),
    lineHeight: rt(13),
    letterSpacing: 1,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
  },
  // TOP cut wall in shadow — a black copy nudged UP a WHOLE pixel (crisp, no
  // blur) so a sharp dark rim sits at the letters' top edge.
  stencilWallTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    color: '#000000',
    transform: [{ translateY: -1 }],
  },
  // BOTTOM cut lip catching the light — a bright copy nudged DOWN a whole pixel.
  stencilLipBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    color: 'rgba(205,230,255,0.8)',
    transform: [{ translateY: 1 }],
  },
  // The cut itself — a SOLID, CRISP letter (opaque, no blur) so the type stays
  // sharp; the layers above/below give the depth, the glow behind gives the halo.
  stencilFace: {
    color: '#dfeeff',
  },
  // Beehive perforation — staggered rows of punched round holes. The field
  // clips its fixed-count rows to whatever width flex gives it.
  ventField: { flex: 1, minWidth: 14, justifyContent: 'center', gap: 2.5, paddingHorizontal: 4, overflow: 'hidden' },
  ventHoleRow: { flexDirection: 'row', gap: 3 },
  ventHoleRowStagger: { marginLeft: 4 },
  // Punched hole with depth (owner 2026-08-11): a near-black bore, a dark rim
  // shadow cast in from the TOP (near wall), and a lit crescent on the BOTTOM
  // lip catching the top light — so each hole reads as bored, not painted.
  ventHole: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: '#030405',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.17)',
  },
  // LA-2A texture layer (BlackFaceBg / BrushedMetalBg): absolutely fills the
  // panel behind its content. overflow:hidden + matching radius is a second clip
  // on top of the parent ElevatedFrame's own rounded-corner clip.
  textureFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 2, overflow: 'hidden' },
  // Custom List panel — deck icon · count line · STUDY switch, aligned like a
  // method row so it seats flush in the rack.
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  customDeck: { width: 48, alignItems: 'center', justifyContent: 'center' },
  customCount: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 1,
    color: colors.blue,
  },
  // Rack group — panels nearly touching, like real 500-series slots.
  // Rack CHASSIS (Booth 2026-07-11 #5): the topic card's metallic side rails
  // continue DOWN behind the method panels + quiz to the bottom of the rack —
  // one continuous 500-series chassis. marginTop cancels the scroll gap so the
  // rails butt flush under the topic card; the panels inset 4px so the dark
  // rails read behind them.
  rackGroup: {
    gap: 4,
    marginTop: -10,
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: '#0a0a0b',
    borderLeftWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    // Rails darkened 1 step to match the topic card above (Booth 2026-07-11) so
    // the continuous chassis stays one shade.
    borderLeftColor: '#34353a',
    borderRightColor: '#34353a',
    // Visible metallic bottom rail — matches the side rails so the chassis reads
    // as a COMPLETE enclosure around the whole rack, not an open-bottomed frame.
    borderBottomColor: '#34353a',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  // A single corner-pinned mounting screw (owner 2026-08-11). Absolute so it
  // always lands at the true panel corner regardless of content-row height.
  cornerScrew: { position: 'absolute', zIndex: 3 },
  // Column spans the button height; title at top, LED at bottom → their edges
  // align with the button's top/bottom.
  methodLeft: { flex: 1, height: rs(58), justifyContent: 'center' },
  // LED instrument screen behind one continuous glass panel (owner 2026-08-06).
  glassScreen: { flex: 1, alignSelf: 'stretch', overflow: 'hidden', backgroundColor: '#050608', borderRadius: 3 },
  // Bottom padding > top (owner 2026-08-06): lifts the LED meter off the glass
  // container's lower edge a touch. Vertical paddings ride RACK_SCALE so the
  // readout stays balanced inside the shorter panel (owner 2026-08-11).
  glassReadout: { flex: 1, paddingHorizontal: 8, paddingTop: rs(4), paddingBottom: rs(9), justifyContent: 'space-between' },
  // Line 1 of the readout: title (left, grows) + % / green check (right).
  glassHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  // Instrument label — squared control-panel face. Brighter cool-white with a
  // stronger bloom so it reads as an LED lit BEHIND the glass, not ink printed
  // on top (owner 2026-08-06). Larger + taller now that the % sits beside it.
  glassTitle: {
    flex: 1,
    fontFamily: fonts.panelSemiBold,
    fontSize: rt(14.5),
    lineHeight: rt(17),
    letterSpacing: 1,
    color: '#d3e0f0',
    textShadowColor: 'rgba(150,190,235,0.6)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  // Completed method — the title segment relights in the check green.
  glassTitleDone: { color: '#3fe06a', textShadowColor: 'rgba(63,224,106,0.6)' },
  // Powered off — the readout is dark, no backlight glow.
  glassTitleOff: { color: '#41434a', textShadowColor: 'transparent', textShadowRadius: 0 },
  // The % (or quiz status) — colored LED digits; colored glow set inline. Larger
  // to the right of the title, right-aligned; never shrinks below the title.
  glassValue: {
    flexShrink: 0,
    fontFamily: fonts.barlowCondensedSemiBold,
    fontSize: rt(22),
    lineHeight: rt(24),
    letterSpacing: 1,
    textAlign: 'right',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
  // Powered-off % slot — a dim dash so the readout row stays justified.
  glassValueOff: { color: '#41434a', textShadowColor: 'transparent', textShadowRadius: 0 },
  // Green LED check — shown in place of the % when a method is fully complete.
  glassCheck: {
    flexShrink: 0,
    fontFamily: fonts.barlowCondensedSemiBold,
    fontSize: rt(24),
    lineHeight: rt(24),
    textAlign: 'right',
    color: '#3fe06a',
    textShadowColor: 'rgba(63,224,106,0.75)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
  // Quiz gate-summary line (sits where the method meter would be). Lit glow now
  // tracks the status colour (set inline) so it reads backlit like the title.
  glassSub: {
    fontFamily: fonts.barlowCondensedSemiBold,
    fontSize: rt(12),
    lineHeight: rt(15),
    letterSpacing: 1.2,
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  glassTopGlare: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.30)' },
  // Gray highlight lip along the lower edge (owner 2026-08-06) — sits just above
  // the container's finest black bottom line (cutoutMount borderBottom). One
  // shade darker (owner 2026-08-06 rev2): 0.38 -> 0.28.
  glassBottomHighlight: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.28)' },
  // Glass tint (owner 2026-08-06, rev 3): 5% gloss — 13% washed the panes too
  // light; a faint milky lift reads as room light off the glass without dimming
  // the LEDs. The gradients still shape the depth.
  glassTint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.05)' },
  // Top row: engraved title (left, on the coat) + square % LED box (right).
  methodTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  // Virtually-engraved Cinzel nameplate (Booth 2026-07-15). The wrapper bounds
  // the stacked copies; a fixed lineHeight keeps all three vertically aligned
  // even as adjustsFontSizeToFit shrinks a long legend uniformly.
  engWrap: { flex: 1, height: 30, justifyContent: 'center' },
  engLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    // CENTER the text (owner 2026-08-01) so the inner white trace scales about
    // its OWN centre — otherwise, on a full-width left-aligned frame, the scaled
    // trace drifted rightward off the deboss (looked doubled toward the right).
    // Now it shrinks symmetrically INSIDE the debossed letters, left to right.
    textAlign: 'center',
    // Chakra Petch — squared retro-technical control-panel face (user request
    // 2026-07-18); tracked out for a labeled-gear look.
    fontFamily: fonts.panelSemiBold,
    fontSize: 18,
    lineHeight: 30,
    letterSpacing: 1.5,
  },
  // DEBOSSED (user request 2026-07-18): top-LEFT light source. The cut's
  // top-left edge falls in shadow (dark copy up-left); the bottom-right lip
  // catches light (bright copy down-right). The letter FLOOR sits darker than
  // the (lightened) panel so it reads as pressed IN, not raised.
  engDark: { color: 'rgba(0,0,0,0.95)', transform: [{ translateX: -0.9 }, { translateY: -1.3 }] },
  engLight: { color: 'rgba(255,255,255,0.6)', transform: [{ translateX: 1.0 }, { translateY: 1.5 }] },
  // Thin near-white inner trace (user request 2026-07-24; centered 2026-08-01) —
  // it MUST sit DEAD CENTER of the debossed letter, in the groove valley, with
  // NO offset: any nudge made it drift off the fill and read as a second shadow
  // crossing the outer edge. Zero-offset = aligned with the letter floor, so the
  // white line lives inside the incised channel and never crosses the deboss.
  // A hair SMALLER than the debossed letter (owner 2026-08-01) so the sides of
  // the incised groove show around the white trace — scaled from its centre so
  // it stays aligned in the channel.
  // Nudged the fine white trace a hair LEFT then UP (owner 2026-08-05) — the
  // smallest increment that reads, to seat it better in the debossed channel.
  engTrace: { color: 'rgba(235,235,235,0.55)', transform: [{ translateX: -0.5 }, { translateY: -0.5 }, { scale: 0.96 }] },
  // Base floor style shared by all fills (color set per variant).
  // The letter FLOOR only — NO white text-shadow (owner 2026-08-01): the lit lip
  // is drawn once by engLight; a shadow here duplicated it and read as an extra
  // layer. Two effects now: the deboss (engDark + engLight + this floor) and the
  // fine engTrace line.
  engFillBase: {},
  // Active method floor on the DEFAULT gray panel — a couple shades under it.
  engFill: { color: '#2f3133' },
  // Inactive method — shallower, lower-contrast cut.
  engFillOff: { color: '#3f4143' },
  // Flashcards-only DARK-panel floors — sit under the charcoal coat so the cut
  // still reads pressed in (user request 2026-07-18).
  engFillDark: { color: '#0b0c0e' },
  engFillOffDark: { color: '#121315' },
  // Small SQUARE recessed LED box holding just the % (or quiz status).
  pctBox: {
    minWidth: 40,
    height: 32,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0c0d0c',
  },
  methodRowDim: { opacity: 0.45, borderColor: '#232323' },
  // Shared "mounted from below through a panel cutout" edge treatment.
  // THICKER panel metal (Booth 2026-07-10 #2): a deeper dark shadow on the
  // top/left cut edges; a small bright bevel catching light on the bottom/
  // right lip (#8) gives the cutaway visible depth.
  cutoutMount: {
    borderTopWidth: 2.5,
    borderLeftWidth: 1.5,
    // Right edge is a BLACK opening/gap (owner 2026-08-06 rev 3): earlier revs
    // made it a WHITE lit lip, which ate INTO the black gap — wrong direction.
    // Now black like the top/left shadow edges, and a touch bigger, so the
    // cutout reads as a dark opening on the right too.
    borderRightWidth: 3,
    borderTopColor: '#000000',
    borderLeftColor: '#000000',
    borderRightColor: '#000000',
    // Black line at the extreme bottom (owner 2026-08-06); the gray highlight lip
    // moved just above it (glassBottomHighlight in GlassCover) so it's gray-over-
    // black at the lower edge. A hair thicker than hairline (owner 2026-08-06 rev2).
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderRadius: 2.5,
  },
  // ONE readout: method # + name left, % right (Booth 2026-07-10). Modern
  // display type (Barlow Condensed), not generic LED-mono.
  titleDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#0c0d0c',
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  titleDigits: {
    flexShrink: 1,
    fontFamily: fonts.barlowCondensedSemiBold,
    fontSize: 15,
    letterSpacing: 1,
    color: '#ffc04a',
    textShadowColor: 'rgba(255,180,0,0.55)',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 0 },
  },
  pctDigits: {
    fontFamily: fonts.barlowCondensedSemiBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255,255,255,0.25)',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 0 },
  },
  // Unlit LED digits — inactive methods' displays (Booth 2026-07-10 #5).
  titleDigitsOff: {
    color: '#6f7072',
    textShadowColor: 'rgba(255,255,255,0.08)',
    textShadowRadius: 1,
  },
  // Quiz status/gate text LED screen (#4).
  gateDisplay: {
    overflow: 'hidden',
    backgroundColor: '#0c0d0c',
    paddingVertical: 7,
    paddingHorizontal: 10,
    gap: 4,
  },
  // Quiz's one-line status in the LED-meter position (aligns with methods).
  gateLed: {
    alignSelf: 'stretch',
    backgroundColor: '#0c0d0c',
    paddingVertical: 3,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  // Recessed cutout WELL — 58×58 so its top/bottom align with the button +
  // title/LED column (#5). Neutral dark recess (NOT lit).
  // Recessed like the title readout (owner 2026-08-06): the shared cutoutMount
  // supplies the panel-cut edges (replacing the old thin 1px border) and the
  // face matches the glass screens' dark tone; GlassCover lays the pane on top.
  iconWell: {
    width: rs(54),
    // Same height as the title glass container (methodLeft) so the two panes
    // read as one row of matched instruments (owner 2026-08-06).
    height: rs(58),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050608',
  },
  // Plain black square surround (no border — the LIT line is the MethodIcon
  // TILE's own border, Booth 2026-07-11 #1). Sized so the enlarged 46px tile
  // (#7) sits with a small black margin inside the 58 well.
  iconSticker: {
    width: rs(50),
    height: rs(50),
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    // Transparent (owner 2026-08-06): the well's dark face shows through — the
    // old lighter fill read as a square seam under the new glass pane.
    backgroundColor: 'transparent',
  },
  ledWell: {
    alignSelf: 'stretch',
    backgroundColor: '#0b0b0d',
    padding: 2.5,
  },

  quizCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.5)',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#1a1409',
  },
  // Inset 0 so it stays inside ElevatedFrame's clipped rounded rect.
  quizPulseBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1.5,
    borderColor: 'rgba(255,180,0,.85)',
    borderRadius: 11,
  },
  quizHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quizTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 10 },
  // Gate/status lines on the quiz's LED screen — same modern display type.
  gateLine: {
    fontFamily: fonts.barlowCondensedSemiBold,
    fontSize: 13,
    letterSpacing: 0.6,
    textShadowColor: 'rgba(255,255,255,0.2)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 0 },
  },
});
