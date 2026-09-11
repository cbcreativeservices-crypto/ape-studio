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
 * ORANGE; red is reserved for the one genuine hazard — a normal broken AND the
 * destination left hearing nothing (the silent-destination-mid-take disaster).
 *
 * Interaction: the two jacks are 44pt+ tap targets that insert/remove a cord
 * (deliberate a11y choice over drag-only — WCAG 2.5.7). They carry the house
 * breathing affordance until first touched. The tap overlays are SIBLINGS of
 * the accessible Svg (an `accessible` ancestor would flatten them away from
 * VoiceOver — design pass 2026-09-10).
 */
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { resolvePair, type PairState } from '../engine/patchbay';

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
  useEffect(() => {
    if (reduceMotion || !active) return;
    const loop = Animated.loop(Animated.timing(phase, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: false }));
    phase.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, active, phase]);
  return phase;
}

const trim = (s: string, n = 24) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function DeviceBox({ y, label, sub, accent }: { y: number; label: string; sub: string; accent: string }) {
  return (
    <G>
      <Rect x={16} y={y} width={168} height={34} rx={7} fill="#101013" stroke={accent} strokeWidth={1.3} />
      <SvgText x={100} y={y + 15} fontSize={11} fill={colors.textPrimary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>
        {trim(label)}
      </SvgText>
      <SvgText x={100} y={y + 28} fontSize={9} fill={accent} textAnchor="middle" fontFamily={fonts.oswaldMedium} letterSpacing={1}>
        {sub}
      </SvgText>
    </G>
  );
}

function JackGlyph({ y, plugged, label }: { y: number; plugged: boolean; label: string }) {
  return (
    <G>
      <Circle cx={CX} cy={y} r={11} fill={PB.jack} stroke={plugged ? PB.cord : '#3d3e44'} strokeWidth={plugged ? 2.4 : 1.6} />
      <Circle cx={CX} cy={y} r={4.5} fill={plugged ? PB.cord : '#1c1d21'} />
      <SvgText x={CX - 22} y={y + 3.5} fontSize={9} fill={colors.textMuted} textAnchor="end" fontFamily={fonts.oswaldMedium} letterSpacing={1}>
        {label}
      </SvgText>
    </G>
  );
}

/** The physical faceplate SLICE: two horizontal rows (sources over
 *  destinations, like a real bay), the featured VERTICAL PAIR as the column
 *  aligned with the schematic spine below, dim neighbor columns for context
 *  (design pass 2026-09-10 — the old strip drew the pair side-by-side and
 *  fought the lab's own "signal falls downhill" model). */
function Faceplate({ topPlugged, bottomPlugged }: { topPlugged: boolean; bottomPlugged: boolean }) {
  const ROW_TOP = 22;
  const ROW_BOT = 48;
  const neighbor = (cx: number, cy: number) => (
    <G key={`${cx}-${cy}`}>
      <Circle cx={cx} cy={cy} r={7} fill="#0d0d10" stroke="#2c2d33" strokeWidth={1.2} />
      <Circle cx={cx} cy={cy} r={2.6} fill="#141518" />
    </G>
  );
  const featured = (cy: number, plugged: boolean) => (
    <G>
      <Circle cx={CX} cy={cy} r={8} fill="#0a0a0c" stroke={plugged ? PB.cord : '#55565e'} strokeWidth={plugged ? 2 : 1.5} />
      <Circle cx={CX} cy={cy} r={3.2} fill={plugged ? PB.cord : '#17171a'} />
    </G>
  );
  return (
    <Svg width="100%" height={undefined} viewBox={`0 0 ${W} ${FACE_H}`} style={{ aspectRatio: W / FACE_H }}>
      <Rect x={0} y={2} width={W} height={FACE_H - 4} rx={6} fill={PB.panel} stroke={PB.panelEdge} />
      <Circle cx={12} cy={FACE_H / 2} r={2.4} fill="#3a3b41" />
      <Circle cx={W - 12} cy={FACE_H / 2} r={2.4} fill="#3a3b41" />
      {/* the featured COLUMN — this is the vertical pair */}
      <Rect x={CX - 14} y={8} width={28} height={FACE_H - 16} rx={7} fill="none" stroke="#45464d" strokeWidth={1.2} />
      {[CX - 72, CX - 36, CX + 36, CX + 72].map((x) => (
        <G key={x}>
          {neighbor(x, ROW_TOP)}
          {neighbor(x, ROW_BOT)}
        </G>
      ))}
      {featured(ROW_TOP, topPlugged)}
      {featured(ROW_BOT, bottomPlugged)}
      {/* cords exit on separated paths */}
      {topPlugged ? <Path d={`M ${CX} ${ROW_TOP} C ${CX + 60} ${ROW_TOP - 8}, ${W - 90} 8, ${W - 24} 10`} stroke={PB.cord} strokeWidth={2.2} fill="none" strokeLinecap="round" /> : null}
      {bottomPlugged ? <Path d={`M ${CX} ${ROW_BOT} C ${CX + 60} ${ROW_BOT + 8}, ${W - 90} ${FACE_H - 6}, ${W - 24} ${FACE_H - 8}`} stroke={PB.cord} strokeWidth={2.2} fill="none" strokeLinecap="round" /> : null}
      <SvgText x={W - 30} y={ROW_TOP + 3} fontSize={9} fill={PB.source} textAnchor="end" fontFamily={fonts.oswaldMedium} letterSpacing={1}>TOP · SOURCES</SvgText>
      <SvgText x={W - 30} y={ROW_BOT + 3} fontSize={9} fill={PB.dest} textAnchor="end" fontFamily={fonts.oswaldMedium} letterSpacing={1}>BTM · DESTINATIONS</SvgText>
      <SvgText x={20} y={13} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} letterSpacing={1}>FRONT PANEL</SvgText>
    </Svg>
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
};

export function PatchPairView({
  state, sourceLabel, destLabel, topPatchLabel = 'PATCH DESTINATION', bottomPatchLabel = 'ALTERNATE SOURCE',
  onToggleJack, reduceMotion, hideFaceplate, caption, sourceLive = true,
}: PatchPairViewProps) {
  const flow = resolvePair(state);
  const anythingFlowing = ((flow.normalActive || flow.topFeedsPatch) && sourceLive) || flow.bottomFeedsDestination;
  const phase = useFlowPhase(anythingFlowing, reduceMotion);

  // Breathing affordance on the untouched jacks (house standard) — stops per
  // jack after its first toggle; never runs under reduce-motion or when inert.
  const touchedRef = useRef({ top: false, bottom: false });
  const pulse = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    if (reduceMotion || !onToggleJack) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.9, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0.3, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, onToggleJack, pulse]);
  const toggle = (jack: 'top' | 'bottom') => {
    touchedRef.current[jack] = true;
    onToggleJack?.(jack);
  };

  // The break is descriptive orange; RED only for the genuine hazard: a normal
  // broken AND the destination left silent (see the color doctrine above). A
  // silent-anyway source can't be silenced — no hazard when it's idle.
  const hazard = flow.normalBroken && flow.destinationHears === 'nothing' && sourceLive;
  const breakColor = hazard ? PB.hazard : PB.break;

  const midY = (TOP_Y + BOT_Y) / 2;
  // Status line — factual, derived from the resolved flow (the four questions).
  // An idle source gets an honest status: connections may exist, signal doesn't.
  const status = !sourceLive
    ? flow.bottomFeedsDestination
      ? `PATCHED — the cord feeds ${destLabel}; ${sourceLabel} itself is idle`
      : `${flow.normalActive ? 'NORMAL CONNECTED' : flow.normalBroken ? 'NORMAL BROKEN' : 'NO CONNECTION'} — ${sourceLabel} is idle, nothing flows`
    : flow.isSplit
      ? `SPLIT — ${sourceLabel} feeds ${destLabel} AND the patch cord`
      : flow.isMerge
        ? `PARALLEL — ${destLabel} receives the normal AND the patch`
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

  const a11y =
    `Patch pair, ${state.config === 'thru' ? 'thru' : state.config === 'full' ? 'full normal' : 'half normal'} configuration. ` +
    `Top jack ${state.topPlugged ? 'has a patch cord' : 'empty'}, bottom jack ${state.bottomPlugged ? 'has a patch cord' : 'empty'}. ${status}.`;

  return (
    <View style={styles.wrap}>
      {!hideFaceplate ? <Faceplate topPlugged={state.topPlugged} bottomPlugged={state.bottomPlugged} /> : null}
      <View style={{ width: '100%' }}>
        {/* The Svg is the accessible image node; the tap overlays are its
            SIBLINGS so screen readers reach them (an accessible ancestor would
            flatten them away). */}
        <Svg accessible accessibilityRole="image" accessibilityLabel={a11y} width="100%" height={undefined} viewBox={`0 0 ${W} ${H}`} style={{ aspectRatio: W / H }}>
          {/* SOURCE device and its permanent rear wiring down to the TOP jack */}
          <DeviceBox y={10} label={sourceLabel} sub="SOURCE · OUTPUT" accent={PB.source} />
          <FlowPath d={`M ${CX} 44 L ${CX} ${TOP_Y - 11}`} flowing={sourceLive} phase={phase} reduceMotion={reduceMotion} />

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
                d={`M ${CX + 11} ${TOP_Y} C ${CX + 60} ${TOP_Y - 4}, ${W - 130} ${TOP_Y - 26}, ${W - 118} ${TOP_Y - 28}`}
                flowing={flow.topFeedsPatch && sourceLive}
                phase={phase}
                reduceMotion={reduceMotion}
                color={PB.cord}
              />
              <Rect x={W - 116} y={TOP_Y - 44} width={104} height={30} rx={6} fill="#101013" stroke={PB.cord} strokeWidth={1.2} />
              <SvgText x={W - 64} y={TOP_Y - 31} fontSize={9} fill={PB.cord} textAnchor="middle" fontFamily={fonts.oswaldMedium}>PATCH CORD →</SvgText>
              <SvgText x={W - 64} y={TOP_Y - 20} fontSize={9} fill={colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{trim(topPatchLabel, 20)}</SvgText>
            </G>
          ) : null}

          {/* BOTTOM patch cord bringing in an alternate signal */}
          {state.bottomPlugged ? (
            <G>
              <Rect x={W - 116} y={BOT_Y - 2} width={104} height={30} rx={6} fill="#101013" stroke={PB.cord} strokeWidth={1.2} />
              <SvgText x={W - 64} y={BOT_Y + 11} fontSize={9} fill={colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{trim(bottomPatchLabel, 20)}</SvgText>
              <SvgText x={W - 64} y={BOT_Y + 22} fontSize={9} fill={PB.cord} textAnchor="middle" fontFamily={fonts.oswaldMedium}>← PATCH CORD</SvgText>
              <FlowPath
                d={`M ${W - 118} ${BOT_Y + 14} C ${W - 150} ${BOT_Y + 16}, ${CX + 50} ${BOT_Y + 6}, ${CX + 11} ${BOT_Y}`}
                flowing={flow.bottomFeedsDestination}
                phase={phase}
                reduceMotion={reduceMotion}
                color={PB.cord}
              />
            </G>
          ) : null}

          {/* DESTINATION device fed (or not) from the BOTTOM jack's rear */}
          <FlowPath
            d={`M ${CX} ${BOT_Y + 11} L ${CX} ${H - 46}`}
            flowing={
              flow.destinationHears === 'patch' || flow.destinationHears === 'both'
                ? true // an external patched-in source has its own life
                : flow.destinationHears === 'normal' && sourceLive
            }
            phase={phase}
            reduceMotion={reduceMotion}
            color={flow.destinationHears === 'patch' ? PB.cord : PB.flow}
          />
          <DeviceBox y={H - 44} label={destLabel} sub="DESTINATION · INPUT" accent={PB.dest} />
        </Svg>

        {/* 44pt tap overlays aligned to the jacks (percent of the viewBox) —
            siblings of the Svg so assistive tech reaches them. */}
        {onToggleJack ? (
          <>
            <Pressable
              onPress={() => toggle('top')}
              style={[styles.jackTap, { top: `${((TOP_Y - 26) / H) * 100}%` }]}
              accessibilityRole="button"
              accessibilityLabel={state.topPlugged ? 'Remove the patch cord from the top jack' : 'Insert a patch cord into the top jack'}
            />
            <Pressable
              onPress={() => toggle('bottom')}
              style={[styles.jackTap, { top: `${((BOT_Y - 26) / H) * 100}%` }]}
              accessibilityRole="button"
              accessibilityLabel={state.bottomPlugged ? 'Remove the patch cord from the bottom jack' : 'Insert a patch cord into the bottom jack'}
            />
          </>
        ) : null}
      </View>
      <Text
        style={[
          styles.status,
          flow.isSplit && { color: PB.flow },
          flow.normalBroken && { color: hazard ? PB.hazard : PB.break },
        ]}
        accessibilityLiveRegion="polite"
      >
        {status}
      </Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0d0d10', padding: 10 },
  jackTap: { position: 'absolute', left: 0, width: '52%', height: 52, minHeight: 44 },
  status: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17 },
  caption: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
});
