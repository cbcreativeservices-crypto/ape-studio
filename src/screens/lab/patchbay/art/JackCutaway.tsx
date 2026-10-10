import { useEffect, type ReactNode } from 'react';
/**
 * JackCutaway — the inside of one normalled patch point, side cutaway
 * (spec §6 + the §21 X-ray insertion model). The single most important
 * animation of the lab: the learner drives the plug in with a slider and
 * WATCHES the tip spring leave the normal contact — the normal isn't
 * software, it's a metal switch being held open.
 *
 * Mechanism drawn truthfully: the source feeds the TIP SPRING (a steel leaf —
 * the metal IS the conductor, so the signal rides it as a thin marching
 * overlay). At rest the spring presses on the NORMAL CONTACT, which wires to
 * the destination. An entering plug wedges its tip under the leaf mid-span
 * and lifts it off the contact (the normal BREAKS — descriptive orange, per
 * the lab's color doctrine); the spring now touches the plug and the source
 * rides the cord instead.
 *
 * The exact insertion fraction where a real jack opens varies by design, so
 * the electrical threshold is the engine's CONTACT_OPEN_AT teaching constant,
 * the visible lift begins exactly THERE (never before — the picture must not
 * contradict the readout), and the panel carries a CONCEPTUAL MODEL badge.
 */
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import { CONTACT_OPEN_AT, contactsOpen } from '../engine/patchbay';
import { FlowPath, PB, useFlowPhase } from './PatchPairView';

const W = 340;
const H = 200;
const STEEL = '#8a8b93';
const STEEL_EDGE = '#b0b1ba';
const CONTACT_X = 172; // the spring's free end + anvil — right of the plug's reach

/** Leaf-tip height. The lift STARTS at the electrical threshold so the first
 *  visible separation coincides with the declared break (cognition pass
 *  2026-09-10 — a slow scrubber must never see the model contradict itself). */
function leafTipY(insertion: number): number {
  const lift = Math.max(0, Math.min(1, (insertion - CONTACT_OPEN_AT) / 0.2));
  return 104 - lift * 20;
}

export function JackCutaway({ insertion, reduceMotion, showConductors, controls }: {
  insertion: number;
  reduceMotion: boolean;
  /** §23 (Phase B): label the plug's TIP / RING / SLEEVE bands — the reveal
   *  that "one line" has been a balanced circuit all along. */
  showConductors?: boolean;
  /** The page's PLUG INSERTION slider (+ goal chips), docked under the
   *  drawing in FULL SCREEN so the plug can be driven there (D35,
   *  full-screen pass 2026-09-30). The % / contacts readout rides on top. */
  controls?: ReactNode;
}) {
  const open = contactsOpen(insertion);

  // W16 (2026-09-18): Android-only live region; silent on iOS. `insertion` is a DRAG,
  // so this keys on the derived boolean: the contacts opening is the event,
  // not the millimetre. Nothing is said while sliding between states.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AccessibilityInfo.announceForAccessibility(
      open ? 'Contacts open, normal broken' : 'Contacts touching, normal intact',
    );
  }, [open]);
  const tipX = 26 + insertion * 122; // plug tip travel; max 148 — wedges under the leaf mid-span
  const leafY = leafTipY(insertion);
  const phase = useFlowPhase(true, reduceMotion);

  const a11y = `Jack cutaway at ${Math.round(insertion * 100)} percent insertion. ` +
    (open
      ? 'The plug has lifted the tip spring off the normal contact: the normal is broken and the source now rides the patch cord.'
      : 'The tip spring is resting on the normal contact: the normal path to the destination is intact.');

  // Steel leaf spring: a closed tapered shape from the anchor block to the
  // free end above the anvil, plus a thin signal overlay along its centerline.
  const leafShape = `M 292 57 Q 226 ${leafY - 15} ${CONTACT_X} ${leafY - 2.6} L ${CONTACT_X} ${leafY + 2.6} Q 228 ${leafY - 7} 292 66 Z`;
  const leafCenter = `M 292 61 Q 227 ${leafY - 11} ${CONTACT_X} ${leafY}`;

  const badge = `CONCEPTUAL MODEL — real jacks open partway through insertion; the exact point varies by design (this model opens at ${Math.round(CONTACT_OPEN_AT * 100)}%).`;
  // The readout row is the figure's READOUT: under the drawing on the page
  // and at the top of the docked controls in full screen — one element.
  const readout = (
    <View style={styles.readoutRow}>
      <Text style={styles.pct}>{Math.round(insertion * 100)}%</Text>
      <Text style={[styles.state, { color: open ? PB.break : PB.flow }]} accessibilityLiveRegion="polite">
        {open ? 'CONTACTS OPEN — NORMAL BROKEN' : 'CONTACTS TOUCHING — NORMAL INTACT'}
      </Text>
    </View>
  );

  return (
    <View style={styles.wrap}>
      {/* The accessible image node is the DRAWING, not the card: an accessible
          card would flatten the FULL SCREEN button (and the docked slider)
          away from screen readers. */}
      <ExpandableFigure
        aspect={W / H}
        title="INSIDE THE JACK"
        badge={badge}
        controls={
          <View style={styles.dock}>
            {readout}
            {controls}
          </View>
        }
        render={(w, h) => (
      <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${W} ${H}`}>
        {/* jack body + front bushing */}
        <Rect x={62} y={30} width={262} height={134} rx={8} fill="#101013" stroke="#34353b" strokeWidth={1.4} />
        <Rect x={42} y={80} width={20} height={44} rx={3} fill="#1a1b1f" stroke="#3d3e44" strokeWidth={1.4} />
        <SvgText x={193} y={44} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium} letterSpacing={1.6}>INSIDE THE JACK — CUTAWAY</SvgText>

        {/* SOURCE feed from the rear into the spring anchor block */}
        <FlowPath d={`M 326 61 L 298 61`} flowing phase={phase} reduceMotion={reduceMotion} color={PB.source} width={2.4} />
        <SvgText x={320} y={54} fontSize={9} fill={PB.source} textAnchor="end" fontFamily={fonts.oswaldMedium} letterSpacing={1}>FROM SOURCE · REAR</SvgText>
        <Rect x={290} y={54} width={10} height={14} rx={2} fill={STEEL} stroke={STEEL_EDGE} strokeWidth={0.8} />

        {/* TIP SPRING — steel leaf with a leader-line callout (no label overlap) */}
        <Path d={leafShape} fill={STEEL} stroke={STEEL_EDGE} strokeWidth={0.8} />
        <Circle cx={CONTACT_X} cy={leafY} r={3.2} fill={STEEL} stroke={STEEL_EDGE} strokeWidth={0.8} />
        {/* the signal rides the metal: thin marching overlay along the leaf */}
        <FlowPath d={leafCenter} flowing phase={phase} reduceMotion={reduceMotion} color={open ? PB.cord : PB.flow} width={1.6} />
        <SvgText x={314} y={82} fontSize={9} fill={colors.textSecondary} textAnchor="end" fontFamily={fonts.oswaldMedium} letterSpacing={1}>TIP SPRING</SvgText>
        <Line x1={286} y1={78} x2={272} y2={70} stroke="#5a5b63" strokeWidth={1} />

        {/* NORMAL CONTACT anvil + wire to the destination */}
        <Rect x={CONTACT_X - 8} y={108} width={16} height={8} rx={2} fill={open ? '#3a3b41' : STEEL} stroke={open ? '#4a4b52' : STEEL_EDGE} strokeWidth={0.8} />
        <Line x1={CONTACT_X - 8} y1={108.6} x2={CONTACT_X + 8} y2={108.6} stroke={open ? '#55565e' : '#d3d4db'} strokeWidth={0.9} />
        {!open ? <FlowPath d={`M ${CONTACT_X} 109 L ${CONTACT_X} 150`} flowing phase={phase} reduceMotion={reduceMotion} width={2.4} /> : <Line x1={CONTACT_X} y1={116} x2={CONTACT_X} y2={150} stroke={PB.idle} strokeWidth={2} strokeDasharray="2 5" />}
        <Path d={`M ${CONTACT_X - 5} 145 L ${CONTACT_X} 155 L ${CONTACT_X + 5} 145`} fill="none" stroke={open ? PB.idle : PB.flow} strokeWidth={2} strokeLinecap="round" />
        <SvgText x={CONTACT_X + 14} y={114} fontSize={9} fill={open ? colors.textMuted : PB.flow} fontFamily={fonts.oswaldMedium} letterSpacing={1}>NORMAL CONTACT</SvgText>
        <SvgText x={CONTACT_X + 14} y={155} fontSize={9} fill={PB.dest} fontFamily={fonts.oswaldMedium} letterSpacing={1}>TO DESTINATION · REAR</SvgText>

        {/* the broken gap ✕ — descriptive orange, confined to the gap zone
            above the anvil, clear of the plug tip (which stops left of it) */}
        {open ? (
          <G>
            <Line x1={CONTACT_X - 6} y1={leafY + 7} x2={CONTACT_X + 6} y2={104} stroke={PB.break} strokeWidth={2.2} strokeLinecap="round" />
            <Line x1={CONTACT_X + 6} y1={leafY + 7} x2={CONTACT_X - 6} y2={104} stroke={PB.break} strokeWidth={2.2} strokeLinecap="round" />
            <SvgText x={CONTACT_X + 14} y={98} fontSize={9} fill={PB.break} fontFamily={fonts.oswaldSemiBold} letterSpacing={1.2}>NORMAL BROKEN</SvgText>
          </G>
        ) : null}

        {/* the plug: TT anatomy — tip cap, insulator, ring band, insulator,
            sleeve — riding the insertion slider */}
        {insertion > 0.02 ? (
          <G>
            <Rect x={-6} y={92} width={Math.max(0, tipX - 40)} height={22} rx={4} fill="#63656d" stroke="#7d7f88" strokeWidth={1} />
            <Rect x={Math.max(-6, tipX - 40)} y={92} width={4} height={22} fill="#141518" />
            <Rect x={Math.max(-6, tipX - 36)} y={92} width={14} height={22} fill="#c8a24a" />
            <Rect x={Math.max(-6, tipX - 22)} y={92} width={4} height={22} fill="#141518" />
            {/* the TT tip (art pass 2026-10-10): a ball nose behind which the
                neck groove narrows — the groove the tip spring rides */}
            <Path d={`M ${tipX - 18} 96 L ${tipX - 13} 96 Q ${tipX - 12} 92 ${tipX - 8} 92 Q ${tipX + 1} 92 ${tipX + 1} 103 Q ${tipX + 1} 114 ${tipX - 8} 114 Q ${tipX - 12} 114 ${tipX - 13} 110 L ${tipX - 18} 110 Z`} fill={PB.cord} />
            {/* round-bar shading: a lit band along the top, core shadow below */}
            <Rect x={-6} y={95} width={Math.max(0, tipX - 10)} height={3} fill="#ffffff" opacity={0.22} />
            <Rect x={-6} y={107} width={Math.max(0, tipX - 10)} height={6} fill="#000000" opacity={0.22} />
            {showConductors && insertion > 0.3 ? (
              <G>
                <SvgText x={tipX - 9} y={128} fontSize={9} fill={PB.cord} textAnchor="middle" fontFamily={fonts.oswaldMedium}>T</SvgText>
                <Line x1={tipX - 9} y1={116} x2={tipX - 9} y2={120} stroke={PB.cord} strokeWidth={1} />
                <SvgText x={tipX - 29} y={128} fontSize={9} fill="#c8a24a" textAnchor="middle" fontFamily={fonts.oswaldMedium}>R</SvgText>
                <Line x1={tipX - 29} y1={116} x2={tipX - 29} y2={120} stroke="#c8a24a" strokeWidth={1} />
                <SvgText x={Math.max(24, tipX - 60)} y={128} fontSize={9} fill="#9a9ca4" textAnchor="middle" fontFamily={fonts.oswaldMedium}>S</SvgText>
                <Line x1={Math.max(24, tipX - 60)} y1={116} x2={Math.max(24, tipX - 60)} y2={120} stroke="#9a9ca4" strokeWidth={1} />
              </G>
            ) : null}
          </G>
        ) : (
          <SvgText x={10} y={106} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} letterSpacing={1}>← PLUG OUT</SvgText>
        )}
      </Svg>
      </View>
        )}
      />
      {readout}
      <Text style={styles.badge}>{badge}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 5, borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0d0d10', padding: 10 },
  readoutRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dock: { paddingHorizontal: 12, gap: 8 },
  pct: { color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 15 },
  state: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1 },
  badge: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
});
