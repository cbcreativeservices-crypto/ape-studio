/**
 * PatchPairView — the one reusable vertical pair every page of the Patchbay
 * lab teaches on (owner brief 2026-09-10). Renders the spec's two synchronized
 * representations AT ONCE (§13): a physical FACEPLATE slice above the
 * simplified SIGNAL SCHEMATIC, so the learner constantly translates
 * hardware ↔ electrical flow instead of meeting them separately.
 *
 * All routing truth comes from engine/patchbay.resolvePair — this file only
 * DRAWS the resolved flow; it never re-derives it.
 *
 * Locked visual language (spec, final section — never varies mid-lab):
 *   marching dashes  = signal currently flowing
 *   dim line         = possible connection, currently inactive
 *   gap + ✕          = a normal that existed and is BROKEN (held open)
 *   no line at all   = thru: no internal vertical link ever existed
 *   gold cord        = a patch cable (the new physical route)
 *   branching lines  = split / tap
 *
 * Color doctrine (design pass 2026-09-10, matching the app's red rule): a
 * broken normal is usually the POINT of patching, so the break is descriptive
 * ORANGE; red is reserved for the genuine hazards — a normal broken AND the
 * destination left hearing nothing (the silent-destination-mid-take disaster),
 * and the CLASH (two outputs tied into one input: the merged destination leg
 * and the status line turn red — wiring grade PB-R2-05, 2026-10-20).
 *
 * Interaction: the two jacks are 44pt+ tap targets that insert/remove a cord
 * (deliberate a11y choice over drag-only — WCAG 2.5.7). They carry the house
 * breathing affordance until first touched. The tap overlays are SIBLINGS of
 * the accessible Svg (an `accessible` ancestor would flatten them away from
 * VoiceOver — design pass 2026-09-10).
 */
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import { resolvePair, type PairState } from '../engine/patchbay';
import { useDecorativeMotion } from '../../../../features/settings/decorativeMotion';
import { CordPlug, GearArt, gearKind } from './gearArt';

/* Animated SVG parts — module level, or every render makes a new component
 * type and remounts (kills the loop). Same rule as tuning/primitives. */
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** The lab's signal palette — one meaning per color, everywhere. */
export const PB = {
  flow: colors.green, // signal moving right now
  idle: 'rgba(255,255,255,0.22)', // possible, inactive
  break: colors.orange, // an opened normal — descriptive, not a verdict
  hazard: colors.red, // broken normal AND a silenced destination
  cord: colors.gold, // the physical patch cable
  source: colors.amberLabel, // TOP = source / output
  dest: colors.blue, // BOTTOM = destination / input
  panel: '#17181c',
  panelEdge: '#2c2d33',
  jack: '#0c0c0e',
} as const;

const W = 340;
const H = 322;
const CX = 92; // the vertical signal spine
const TOP_Y = 96; // top jack center
const BOT_Y = 208; // bottom jack center
const DASH = 12; // marching-dash period
const FACE_H = 66;
/** Gap between the faceplate strip and the schematic, in viewBox units, so
 *  the two drawings + gap are ONE fixed-aspect figure for FULL SCREEN
 *  (full-screen pass 2026-09-30): aspect = W ÷ (FACE_H + FACE_GAP + H). */
const FACE_GAP = 6;
/** The far plugs' handle back end (viewBox x): the plug + the seated
 *  device panel end at PLUG_X + 30, clear of the labels at W − 87. */
const PLUG_X = W - 130;
export const PATCH_PAIR_ASPECT = W / (FACE_H + FACE_GAP + H);
export const PATCH_PAIR_ASPECT_BARE = W / H;

/** One flowing/idle line along an SVG path. Marching dashes while `flowing`
 *  (static solid under reduce-motion), dim when merely possible. Shared with
 *  JackCutaway so the motion grammar never forks. */
export function FlowPath({ d, flowing, phase, reduceMotion, color = PB.flow, width = 3 }: {
  d: string;
  flowing: boolean;
  phase: Animated.Value;
  reduceMotion: boolean;
  color?: string;
  width?: number;
}) {
  const dashoffset = useMemo(() => phase.interpolate({ inputRange: [0, 1], outputRange: [0, -DASH * 2] }), [phase]);
  if (!flowing) return <Path d={d} stroke={PB.idle} strokeWidth={2} fill="none" strokeDasharray="2 5" />;
  if (reduceMotion) return <Path d={d} stroke={color} strokeWidth={width} fill="none" />;
  return (
    <AnimatedPath
      d={d}
      stroke={color}
      strokeWidth={width}
      fill="none"
      strokeDasharray={`${DASH * 0.55} ${DASH * 0.45}`}
      strokeDashoffset={dashoffset as unknown as number}
      strokeLinecap="round"
    />
  );
}

/** The shared marching phase — one loop per component tree. */
export function useFlowPhase(active: boolean, reduceMotion: boolean): Animated.Value {
  const phase = useRef(new Animated.Value(0)).current;
  // Ambient marching (P10b 2026-10-02): decorative — the path and its colour
  // carry the routing, so Low-Light holds the dashes still as well.
  const decorative = useDecorativeMotion();
  useEffect(() => {
    if (reduceMotion || !active || !decorative) return;
    const loop = Animated.loop(Animated.timing(phase, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: false }));
    phase.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, active, phase, decorative]);
  return phase;
}

const trim = (s: string, n = 24) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** A pair end: the real device drawn at its true outline (gearArt), its
 *  name and role set BESIDE it — never on the metal (art grading
 *  2026-10-16: the ends used to be labelled rectangles). */
function DeviceBox({ y, label, sub, accent, end }: { y: number; label: string; sub: string; accent: string; end: 'bottom' | 'top' }) {
  return (
    <G>
      <GearArt kind={gearKind(label)} x={16} y={y} w={120} h={34} cx={CX} end={end} accent={accent} />
      <SvgText x={144} y={y + 13} fontSize={11} fill={colors.textPrimary} fontFamily={fonts.oswaldMedium}>
        {trim(label)}
      </SvgText>
      <SvgText x={144} y={y + 25} fontSize={9} fill={accent} fontFamily={fonts.oswaldMedium} letterSpacing={1}>
        {sub}
      </SvgText>
    </G>
  );
}

/** A patchbay jack face-on: the metal bushing nut, the socket, the sleeve
 *  contact inside. Plugged, the patch cord's plug handle covers it end-on
 *  and its cord drops away. */
function JackGlyph({ y, plugged, label }: { y: number; plugged: boolean; label: string }) {
  return (
    <G>
      <Circle cx={CX} cy={y} r={11} fill="#2a2b31" stroke={plugged ? PB.cord : '#5a5b63'} strokeWidth={plugged ? 2.2 : 1.2} />
      <Circle cx={CX - 1.4} cy={y - 1.4} r={9} fill="none" stroke="#ffffff" strokeWidth={0.8} opacity={0.14} />
      <Circle cx={CX} cy={y} r={6.4} fill="#08080a" />
      <Circle cx={CX} cy={y} r={4.6} fill="none" stroke="#45464d" strokeWidth={0.9} />
      {plugged ? (
        <G>
          <Circle cx={CX} cy={y} r={8.2} fill="#1d1e22" stroke={PB.cord} strokeWidth={1.6} />
          <Circle cx={CX} cy={y} r={3} fill="#0c0c0e" stroke="#45464d" strokeWidth={0.7} />
        </G>
      ) : null}
      <SvgText x={CX - 22} y={y + 3.5} fontSize={9} fill={colors.textMuted} textAnchor="end" fontFamily={fonts.oswaldMedium} letterSpacing={1}>
        {label}
      </SvgText>
    </G>
  );
}

/** A patch cord's drop from a face-on plug handle at (cx, cy) down past the
 *  strip's bottom edge, on `side` (+1 right, −1 left) of the column. At
 *  cx ± 11 the 2.4-wide cord (inner edge 9.8) clears the jack below it
 *  (bushing 5.5 mm = 7.67 + its 2-unit plugged stroke → 8.67); at cx ± 9 it
 *  grazed that bushing (R4-PB-01). */
export const CORD_DROP_DX = 11;
export const cordDrop = (cx: number, cy: number, side: 1 | -1) =>
  `M ${cx + side} ${cy + 2} C ${cx + 4 * side} ${cy + 10}, ${cx + CORD_DROP_DX * side} ${cy + 14}, ${cx + CORD_DROP_DX * side} ${FACE_H}`;
/** The featured column's outline half-width: wide enough that the cord at
 *  cx + 11 runs inside it, clear of its stroke (R4-PB-01). */
export const FEATURED_HALF_W = 14;

/** A patch cord's FAR plug, SEATED in the jack of the gear it reaches: the
 *  plug (handle + TRS shaft, gearArt's CordPlug) with its shaft entering a
 *  device's panel, drawn in section — never a plug hanging in mid-air
 *  (R3-PB-03 extra, 2026-10-21). (x, y) is the handle's back end; the panel
 *  face sits on the shaft's sleeve, the tip hidden inside the device. */
export const SEATED_PANEL_DX = 17; // panel face, from the handle's back end
export const SEATED_PANEL_W = 13;
function SeatedPlug({ x, y }: { x: number; y: number }) {
  const px = x + SEATED_PANEL_DX;
  return (
    <G>
      <CordPlug x={x} y={y} color={PB.cord} />
      {/* the device's panel and body, in section: the shaft disappears into it */}
      <Rect x={px} y={y - 9} width={SEATED_PANEL_W} height={18} rx={1.5} fill="#1d1e22" stroke="#5a5b63" strokeWidth={0.9} />
      <Rect x={px} y={y - 9} width={2.4} height={18} fill="#3a3b41" />
      <Rect x={px - 1.6} y={y - 4} width={1.6} height={8} fill="#2a2b31" stroke="#5a5b63" strokeWidth={0.6} />
    </G>
  );
}

/** The physical faceplate SLICE: two horizontal rows (sources over
 *  destinations, like a real bay), the featured VERTICAL PAIR as the column
 *  aligned with the schematic spine below, dim neighbor columns for context
 *  (design pass 2026-09-10 — the old strip drew the pair side-by-side and
 *  fought the lab's own "signal falls downhill" model). */
export function PairFaceplate({ topPlugged, bottomPlugged, w }: { topPlugged: boolean; bottomPlugged: boolean; w: number }) {
  // A SLICE of a real 1U, 48-point bay at true scale (art grading
  // 2026-10-16: the old strip showed five columns between two rack screws, so
  // the jacks read oversized): the panel's 44.45 mm height fills the strip,
  // so 1 mm = 1.395 units; columns sit at the 18.4 mm pitch of a 24-pair
  // bay, the jack faces are 11 mm across, and both panel ends are torn
  // BREAK edges — the bay carries on past the slice. Labels sit off the
  // metal, to the right of the right-hand break.
  const MM = 62 / 44.45;
  const PITCH = 18.4 * MM;
  const ROW_TOP = 2 + 12.5 * MM;
  const ROW_BOT = 2 + 29.5 * MM;
  const RIGHT = 214; // the right break edge
  const cols = [-3, -2, -1, 1, 2, 3, 4].map((k) => CX + k * PITCH).filter((x) => x > 6 && x < RIGHT - 8);
  const jack = (cx: number, cy: number, featured: boolean, plugged: boolean, side: 1 | -1 = 1) => (
    <G key={`${cx}-${cy}`}>
      <Circle cx={cx} cy={cy} r={5.5 * MM} fill="#2a2b31" stroke={plugged ? PB.cord : featured ? '#6a6b73' : '#3a3b41'} strokeWidth={plugged ? 2 : 1.1} />
      <Circle cx={cx} cy={cy} r={3.2 * MM} fill="#08080a" />
      <Circle cx={cx} cy={cy} r={2.3 * MM} fill="none" stroke="#3d3e45" strokeWidth={0.7} />
      {plugged ? (
        <G>
          {/* the cord hangs from the plug handle down past the panel's
              bottom edge (it leaves the picture): the TOP cord drops just
              right of the jack below, the BOTTOM cord leaves on the LEFT —
              each cord its own lane when both are plugged (R3-PB-03) */}
          <Path d={cordDrop(cx, cy, side)} stroke={PB.cord} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Circle cx={cx} cy={cy} r={4.6 * MM} fill="#1d1e22" stroke={PB.cord} strokeWidth={1.4} />
          <Circle cx={cx} cy={cy} r={1.4 * MM} fill="#0c0c0e" stroke="#45464d" strokeWidth={0.6} />
        </G>
      ) : null}
    </G>
  );
  // torn edges: a zigzag down each cut (left edge down, right edge up)
  const ys: number[] = [];
  for (let y = 2; y < FACE_H - 2; y += 6) ys.push(y);
  ys.push(FACE_H - 2);
  const leftEdge = ys.map((y, i) => `${i % 2 ? 3 : 0} ${y}`);
  const rightEdge = ys.map((y, i) => `${RIGHT - (i % 2 ? 3 : 0)} ${y}`).reverse();
  const panelPath = `M ${leftEdge.join(' L ')} L ${rightEdge.join(' L ')} Z`;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={(w * FACE_H) / W} viewBox={`0 0 ${W} ${FACE_H}`}>
      <Path d={panelPath} fill={PB.panel} stroke={PB.panelEdge} strokeWidth={0.8} />
      <Line x1={4} y1={3} x2={RIGHT - 4} y2={3} stroke="#ffffff" strokeWidth={1} opacity={0.07} />
      {/* the featured COLUMN — this is the vertical pair */}
      <Rect x={CX - FEATURED_HALF_W} y={ROW_TOP - 11} width={2 * FEATURED_HALF_W} height={ROW_BOT - ROW_TOP + 22} rx={7} fill="none" stroke="#6a6b73" strokeWidth={1.1} />
      {cols.map((x) => (
        <G key={x}>
          {jack(x, ROW_TOP, false, false)}
          {jack(x, ROW_BOT, false, false)}
        </G>
      ))}
      {jack(CX, ROW_TOP, true, topPlugged)}
      {jack(CX, ROW_BOT, true, bottomPlugged, -1)}
      <SvgText x={RIGHT + 10} y={FACE_H - 4} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} letterSpacing={0.5}>FRONT PANEL (SLICE)</SvgText>
      <SvgText x={RIGHT + 10} y={ROW_TOP + 3} fontSize={9} fill={PB.source} fontFamily={fonts.oswaldMedium} letterSpacing={1}>TOP · SOURCES</SvgText>
      <SvgText x={RIGHT + 10} y={ROW_BOT + 3} fontSize={9} fill={PB.dest} fontFamily={fonts.oswaldMedium} letterSpacing={1}>BTM · DESTINATIONS</SvgText>
    </Svg>
  );
}

/**
 * Schematic geometry (Patchbay rack conversion, owner 2026-10-10). PAGE is
 * the original drawing the document pages show; GLASS is the SAME picture
 * re-flowed shorter for the Rack Unit's pinned glass — every element, label
 * and colour is kept, only the vertical spacing tightens — so that at 340
 * viewBox units it fits a ~300 pt glass at ≥ 1× (every label ≥ 9 pt on a
 * 390-wide phone; the PAGE stack is 394 units tall and would have drawn its
 * labels at ~6.6 pt on the glass).
 */
type PairGeo = { H: number; TOP_Y: number; BOT_Y: number; SRC_Y: number; DEST_Y: number };
const GEO_PAGE: PairGeo = { H, TOP_Y, BOT_Y, SRC_Y: 10, DEST_Y: H - 44 };
const GEO_GLASS: PairGeo = { H: 204, TOP_Y: 64, BOT_Y: 132, SRC_Y: 4, DEST_Y: 160 };
/** The glass drawing's aspect, faceplate + gap + schematic. */
export const PATCH_PAIR_GLASS_ASPECT = W / (FACE_H + FACE_GAP + GEO_GLASS.H);
export const PATCH_PAIR_GLASS_ASPECT_BARE = W / GEO_GLASS.H;
/** Height of the glass schematic for a drawing `w` wide (stacking helper). */
export const pairGlassHeight = (w: number, hideFaceplate?: boolean) =>
  (w * ((hideFaceplate ? 0 : FACE_H + FACE_GAP) + GEO_GLASS.H)) / W;

/** The pair's status line — factual, derived from the resolved flow (the four
 *  questions). An idle source gets an honest status: connections may exist,
 *  signal doesn't. Shared by the page figure and the rack's readout. */
export function pairStatus(state: PairState, sourceLabel: string, destLabel: string, sourceLive = true) {
  const flow = resolvePair(state);
  // RED only for the genuine hazard: a normal broken AND the destination left
  // silent (see the color doctrine above). A silent-anyway source can't be
  // silenced — no hazard when it's idle.
  const hazard = flow.normalBroken && flow.destinationHears === 'nothing' && sourceLive;
  const status = !sourceLive
    ? flow.bottomFeedsDestination
      ? `PATCHED — the cord feeds ${destLabel}; ${sourceLabel} itself is idle`
      : `${flow.normalActive ? 'NORMAL CONNECTED' : flow.normalBroken ? 'NORMAL BROKEN' : 'NO CONNECTION'} — ${sourceLabel} is idle, nothing flows`
    : flow.isSplit
      ? `SPLIT — ${sourceLabel} feeds ${destLabel} AND the patch cord`
      : flow.isMerge
        ? `CLASH — two outputs drive ${destLabel} (not a mix)`
        : flow.normalActive
          ? `NORMAL INTACT — ${sourceLabel} → ${destLabel}, no cord required`
          : flow.normalBroken
            ? flow.destinationHears === 'patch'
              ? `NORMAL BROKEN — the patch now feeds ${destLabel}`
              : `NORMAL BROKEN — ${destLabel} hears nothing`
            : flow.destinationHears === 'patch'
              ? `PATCHED — the cord feeds ${destLabel}`
              : flow.topFeedsPatch
                ? `PATCHED — ${sourceLabel} goes only into the cord`
                : `NO CONNECTION — thru pair, nothing patched`;
  return { flow, status, hazard };
}

/** W16 (2026-09-18): Android-only live region. This status line is the answer
 *  to the whole patchbay exercise — what is connected to what, and whether
 *  anything is actually flowing — and on iOS it was silent. `status` is
 *  derived from the resolved flow booleans, so it only changes when a cord
 *  actually moves; keying on the string is enough. */
function useAnnounceStatus(status: string) {
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AccessibilityInfo.announceForAccessibility(status);
  }, [status]);
}

function StatusText({ status, flow, hazard }: ReturnType<typeof pairStatus>) {
  return (
    <Text
      style={[
        styles.status,
        flow.isSplit && { color: PB.flow },
        flow.normalBroken && { color: hazard ? PB.hazard : PB.break },
        flow.isMerge && { color: PB.hazard },
      ]}
      accessibilityLiveRegion="polite"
    >
      {status}
    </Text>
  );
}

/** The pair's READOUT for a rack page (the status line + the page's caption),
 *  placed in the well where the figure's own status used to sit. One per
 *  pair on the page — it announces the status. */
export function PairStatus({ state, sourceLabel, destLabel, sourceLive = true, caption, title }: {
  state: PairState;
  sourceLabel: string;
  destLabel: string;
  sourceLive?: boolean;
  caption?: string;
  /** An eyebrow naming the pair when a page carries two (the processor chain). */
  title?: string;
}) {
  const s = pairStatus(state, sourceLabel, destLabel, sourceLive);
  useAnnounceStatus(s.status);
  return (
    <View style={styles.readout}>
      {title ? <Text style={styles.readoutTitle}>{title}</Text> : null}
      <StatusText {...s} />
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

export type PatchPairViewProps = {
  state: PairState;
  /** Device names on the pair's rear — e.g. "CONSOLE OUT 1" / "INTERFACE IN 1". */
  sourceLabel: string;
  destLabel: string;
  /** Where a TOP cord goes / what a BOTTOM cord brings, when plugged. */
  topPatchLabel?: string;
  bottomPatchLabel?: string;
  /** Tapping the jacks toggles the cords (calls back with the changed jack). */
  onToggleJack?: (jack: 'top' | 'bottom') => void;
  reduceMotion: boolean;
  /** Hide the faceplate strip on pages that need only the schematic. */
  hideFaceplate?: boolean;
  /** Extra caption line under the status (e.g. a page-specific hint). */
  caption?: string;
  /** The pair's OWN rear source is producing signal (default true). A bypassed
   *  processor's OUT has no input — drawing marching dashes from it would be
   *  the fake-meter dishonesty the app bans (design pass 2026-09-10). When
   *  false, connected paths render dim (possible, inactive) and the status
   *  says the source is idle. */
  sourceLive?: boolean;
  /** The page's controls for this pair (goal chips, buttons, a slider),
   *  docked under the drawing in FULL SCREEN so the learner can patch AND
   *  operate there (owner rule D35, full-screen pass 2026-09-30). The status
   *  line and caption ride at the top of the dock as the readouts. */
  controls?: ReactNode;
  /** Title in the full-screen bar (default PATCH PAIR). */
  fsTitle?: string;
};

export type PatchPairDrawingProps = Omit<PatchPairViewProps, 'caption' | 'controls' | 'fsTitle'> & {
  /** Drawing width; the height follows from the geometry. */
  w: number;
  /** The shorter GLASS geometry (the Rack Unit's pinned display). */
  glass?: boolean;
};

/** The drawing alone — faceplate + schematic at width `w`, jack taps included
 *  — for the Rack Unit's glass (and inside PatchPairView's figure). */
export function PatchPairDrawing({
  w, glass, state, sourceLabel, destLabel, topPatchLabel = 'PATCH DESTINATION', bottomPatchLabel = 'ALTERNATE SOURCE',
  onToggleJack, reduceMotion, hideFaceplate, sourceLive = true,
}: PatchPairDrawingProps) {
  const { H, TOP_Y, BOT_Y, SRC_Y, DEST_Y } = glass ? GEO_GLASS : GEO_PAGE;
  const { flow, status, hazard } = pairStatus(state, sourceLabel, destLabel, sourceLive);
  const anythingFlowing = ((flow.normalActive || flow.topFeedsPatch) && sourceLive) || flow.bottomFeedsDestination;
  const phase = useFlowPhase(anythingFlowing, reduceMotion);

  // Breathing affordance on the untouched jacks (house standard) — stops per
  // jack after its first toggle; never runs under reduce-motion or when inert.
  const touchedRef = useRef({ top: false, bottom: false });
  const pulse = useRef(new Animated.Value(0.3)).current;
  // An attention pulse: Low-Light holds it too (shared gate, P10b 2026-10-02).
  const pulseOk = useDecorativeMotion();
  useEffect(() => {
    if (reduceMotion || !onToggleJack || !pulseOk) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.9, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0.3, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, onToggleJack, pulse, pulseOk]);
  const toggle = (jack: 'top' | 'bottom') => {
    touchedRef.current[jack] = true;
    onToggleJack?.(jack);
  };
  // A cord moved from the dock counts as touched too (the pulse is an
  // invitation, and the jack has been used).
  if (state.topPlugged) touchedRef.current.top = true;
  if (state.bottomPlugged) touchedRef.current.bottom = true;

  const breakColor = hazard ? PB.hazard : PB.break;
  const midY = (TOP_Y + BOT_Y) / 2;

  const a11y =
    `Patch pair, ${state.config === 'thru' ? 'thru' : state.config === 'full' ? 'full normal' : 'half normal'} configuration. ` +
    `Top jack ${state.topPlugged ? 'has a patch cord' : 'empty'}, bottom jack ${state.bottomPlugged ? 'has a patch cord' : 'empty'}. ${status}.`;

  return (
      <View style={{ width: w, gap: (w * FACE_GAP) / W }}>
      {!hideFaceplate ? <PairFaceplate topPlugged={state.topPlugged} bottomPlugged={state.bottomPlugged} w={w} /> : null}
      <View style={{ width: w, height: (w * H) / W }}>
        {/* The Svg is the accessible image node; the tap overlays are its
            SIBLINGS so screen readers reach them (an accessible ancestor would
            flatten them away). */}
        <Svg accessible accessibilityRole="image" accessibilityLabel={a11y} width={w} height={(w * H) / W} viewBox={`0 0 ${W} ${H}`}>
          {/* SOURCE device and its permanent rear wiring down to the TOP jack */}
          <DeviceBox y={SRC_Y} label={sourceLabel} sub="SOURCE · OUTPUT" accent={PB.source} end="bottom" />
          <FlowPath d={`M ${CX} ${SRC_Y + 34} L ${CX} ${TOP_Y - 11}`} flowing={sourceLive} phase={phase} reduceMotion={reduceMotion} />

          {/* The internal normal zone between the jacks */}
          {state.config === 'thru' ? (
            <G>
              <SvgText x={CX + 16} y={midY - 2} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} letterSpacing={1}>NO INTERNAL</SvgText>
              <SvgText x={CX + 16} y={midY + 10} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} letterSpacing={1}>CONNECTION</SvgText>
            </G>
          ) : flow.normalActive ? (
            <G>
              <FlowPath d={`M ${CX} ${TOP_Y + 11} L ${CX} ${BOT_Y - 11}`} flowing={sourceLive} phase={phase} reduceMotion={reduceMotion} />
              <SvgText x={CX + 16} y={midY + 3} fontSize={9} fill={sourceLive ? PB.flow : colors.textMuted} fontFamily={fonts.oswaldMedium} letterSpacing={1}>NORMAL</SvgText>
            </G>
          ) : (
            <G>
              {/* the path exists but is HELD OPEN: stubs, a gap, and the ✕ */}
              <Line x1={CX} y1={TOP_Y + 11} x2={CX} y2={midY - 12} stroke={PB.idle} strokeWidth={2} />
              <Line x1={CX} y1={midY + 12} x2={CX} y2={BOT_Y - 11} stroke={PB.idle} strokeWidth={2} />
              <Line x1={CX - 7} y1={midY - 7} x2={CX + 7} y2={midY + 7} stroke={breakColor} strokeWidth={2.6} strokeLinecap="round" />
              <Line x1={CX - 7} y1={midY + 7} x2={CX + 7} y2={midY - 7} stroke={breakColor} strokeWidth={2.6} strokeLinecap="round" />
              <SvgText x={CX + 16} y={midY + 3} fontSize={9} fill={breakColor} fontFamily={fonts.oswaldMedium} letterSpacing={1}>NORMAL BROKEN</SvgText>
            </G>
          )}

          <JackGlyph y={TOP_Y} plugged={state.topPlugged} label="TOP" />
          <JackGlyph y={BOT_Y} plugged={state.bottomPlugged} label="BTM" />
          {onToggleJack && !reduceMotion ? (
            <>
              {!touchedRef.current.top && !state.topPlugged ? (
                <AnimatedCircle cx={CX} cy={TOP_Y} r={16} fill="none" stroke={colors.cyanBright} strokeWidth={1.4} opacity={pulse as unknown as number} />
              ) : null}
              {!touchedRef.current.bottom && !state.bottomPlugged ? (
                <AnimatedCircle cx={CX} cy={BOT_Y} r={16} fill="none" stroke={colors.cyanBright} strokeWidth={1.4} opacity={pulse as unknown as number} />
              ) : null}
            </>
          ) : null}

          {/* TOP patch cord out to its destination */}
          {state.topPlugged ? (
            <G>
              <FlowPath
                d={`M ${CX + 11} ${TOP_Y} C ${CX + 60} ${TOP_Y - 4}, ${PLUG_X - 12} ${TOP_Y - 26}, ${PLUG_X} ${TOP_Y - 28}`}
                flowing={flow.topFeedsPatch && sourceLive}
                phase={phase}
                reduceMotion={reduceMotion}
                color={PB.cord}
              />
              {/* the cord's far plug, seated in what it feeds (named beside it) */}
              <SeatedPlug x={PLUG_X} y={TOP_Y - 28} />
              <SvgText x={W - 87} y={TOP_Y - 31} fontSize={9} fill={PB.cord} fontFamily={fonts.oswaldMedium}>PATCH CORD →</SvgText>
              <SvgText x={W - 87} y={TOP_Y - 20} fontSize={9} fill={colors.textSecondary} fontFamily={fonts.oswaldMedium}>{trim(topPatchLabel, 18)}</SvgText>
            </G>
          ) : null}

          {/* BOTTOM patch cord bringing in an alternate signal */}
          {state.bottomPlugged ? (
            <G>
              {/* the cord's far plug, seated in the alternate source (named beside it) */}
              <SeatedPlug x={PLUG_X} y={BOT_Y + 14} />
              <SvgText x={W - 87} y={BOT_Y + 11} fontSize={9} fill={colors.textSecondary} fontFamily={fonts.oswaldMedium}>{trim(bottomPatchLabel, 18)}</SvgText>
              <SvgText x={W - 87} y={BOT_Y + 22} fontSize={9} fill={PB.cord} fontFamily={fonts.oswaldMedium}>← PATCH CORD</SvgText>
              <FlowPath
                d={`M ${PLUG_X} ${BOT_Y + 14} C ${PLUG_X - 32} ${BOT_Y + 16}, ${CX + 50} ${BOT_Y + 6}, ${CX + 11} ${BOT_Y}`}
                flowing={flow.bottomFeedsDestination}
                phase={phase}
                reduceMotion={reduceMotion}
                color={PB.cord}
              />
            </G>
          ) : null}

          {/* DESTINATION device fed (or not) from the BOTTOM jack's rear */}
          <FlowPath
            d={`M ${CX} ${BOT_Y + 11} L ${CX} ${DEST_Y - 2}`}
            flowing={
              flow.destinationHears === 'patch' || flow.destinationHears === 'both'
                ? true // an external patched-in source has its own life
                : flow.destinationHears === 'normal' && sourceLive
            }
            phase={phase}
            reduceMotion={reduceMotion}
            color={flow.isMerge ? PB.hazard : flow.destinationHears === 'patch' ? PB.cord : PB.flow}
          />
          <DeviceBox y={DEST_Y} label={destLabel} sub="DESTINATION · INPUT" accent={PB.dest} end="top" />
        </Svg>

        {/* 44pt tap overlays aligned to the jacks (percent of the viewBox) —
            siblings of the Svg so assistive tech reaches them. */}
        {onToggleJack ? (
          <>
            <Pressable
              onPress={() => toggle('top')}
              style={[styles.jackTap, { top: `${((TOP_Y - 26) / H) * 100}%`, height: `${(52 / H) * 100}%` }]}
              accessibilityRole="button"
              accessibilityLabel={state.topPlugged ? 'Remove the patch cord from the top jack' : 'Insert a patch cord into the top jack'}
            />
            <Pressable
              onPress={() => toggle('bottom')}
              style={[styles.jackTap, { top: `${((BOT_Y - 26) / H) * 100}%`, height: `${(52 / H) * 100}%` }]}
              accessibilityRole="button"
              accessibilityLabel={state.bottomPlugged ? 'Remove the patch cord from the bottom jack' : 'Insert a patch cord into the bottom jack'}
            />
          </>
        ) : null}
      </View>
      </View>
  );
}

export function PatchPairView({
  state, sourceLabel, destLabel, topPatchLabel = 'PATCH DESTINATION', bottomPatchLabel = 'ALTERNATE SOURCE',
  onToggleJack, reduceMotion, hideFaceplate, caption, sourceLive = true, controls, fsTitle = 'PATCH PAIR',
}: PatchPairViewProps) {
  const s = pairStatus(state, sourceLabel, destLabel, sourceLive);
  useAnnounceStatus(s.status);

  // The status line (and the page's caption) are the pair's READOUTS: under
  // the drawing on the page, and at the top of the docked controls in FULL
  // SCREEN — the same elements, so they can never disagree.
  const statusEl = <StatusText {...s} />;
  const captionEl = caption ? <Text style={styles.caption}>{caption}</Text> : null;

  return (
    <View style={styles.wrap}>
      {/* Faceplate + schematic are ONE fixed-aspect drawing through
          ExpandableFigure: the same taps at the page width and at the zoomed
          size, "⤢ FULL SCREEN" under it, the page's controls docked there
          (full-screen pass 2026-09-30). The gap between the two SVGs is in
          viewBox units so the stack keeps its aspect at every zoom. */}
      <ExpandableFigure
        aspect={hideFaceplate ? PATCH_PAIR_ASPECT_BARE : PATCH_PAIR_ASPECT}
        title={fsTitle}
        controls={
          <View style={styles.dock}>
            {statusEl}
            {captionEl}
            {controls}
          </View>
        }
        render={(w) => (
          <PatchPairDrawing
            w={w}
            state={state}
            sourceLabel={sourceLabel}
            destLabel={destLabel}
            topPatchLabel={topPatchLabel}
            bottomPatchLabel={bottomPatchLabel}
            onToggleJack={onToggleJack}
            reduceMotion={reduceMotion}
            hideFaceplate={hideFaceplate}
            sourceLive={sourceLive}
          />
        )}
      />
      {statusEl}
      {captionEl}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0d0d10', padding: 10 },
  /** The tap band must scale with the art. `top` is a percentage of a
   *  width-scaled container (the Svg carries `aspectRatio: W/H`), so a FIXED
   *  52 pt height drifted off the jack centre as the render got wider — past
   *  roughly 680 pt the band stops covering the jack at all, and app.json has
   *  `supportsTablet: true`. Eight pages gate on these taps and this lab is the
   *  af_patchbay credit, so the lab became uncompletable on a tablet.
   *  `minHeight` keeps the 44 pt target on a small phone.
   *  ⚠️ The dev harness caps itself at maxWidth 480 — BELOW the break-even — so
   *  this is structurally invisible on the one surface a developer can drive. */
  jackTap: { position: 'absolute', left: 0, width: '52%', height: `${(52 / H) * 100}%`, minHeight: 44 },
  /** The rack's readout block in the well (status + caption). */
  readout: { gap: 4 },
  readoutTitle: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.6 },
  /** The full-screen dock: readouts (status, caption) then the page's controls. */
  dock: { paddingHorizontal: 12, gap: 8 },
  status: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17 },
  caption: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
});
