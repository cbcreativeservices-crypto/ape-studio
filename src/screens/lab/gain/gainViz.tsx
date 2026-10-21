/**
 * gainViz — the Gain Staging Lab's visual system (owner spec + edit pass
 * 2026-08-07).
 *
 * Layouts:
 *  • ChainStage — every module today (rack conversion 2026-08-23, below):
 *    the chain as drawn channel-strip gear (gainGear.tsx) over meter columns.
 *    Real-gear honesty in modules 6–8: with Signal X-Ray OFF a column shows
 *    only its SIG/CLIP LEDs; X-Ray ON reveals every meter at once.
 *    (The old TRS-patched DeviceCard rack and the pre-rack ChainColumns
 *    layout were never rendered and were removed 2026-10-20, wiring finding
 *    GN-02, owner go.)
 *
 * Meters colour by the app MIDI ramp (levelColor): blue = too low, green =
 * healthy, yellow/red = hot/overload.
 *
 * RACK UNIT (2026-08-23, APE_LAB_UX_PROPOSAL): ChainStage renders the whole
 * chain as meter columns inside the pinned stage glass, height-parametric —
 * faders move to the dock, so the columns carry meters/LEDs/collapsed slots
 * only. stageTint/stageStatus feed the bezel readouts.
 */
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fitValue } from '../../../theme/legibility';
import { colors, fonts } from '../../../theme/tokens';
import { levelColor, rampColors } from '../../../features/tools/levelColor';
import { LinearGradient as GradientView } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useDecorativeMotion } from '../../../features/settings/decorativeMotion';
import { GEAR_ASPECT, MicCableRun, StageGear, StageLink } from './gainGear';
import { DragSlider } from '../foundations/bits';
import { useStageTextScale } from '../rack/stageAspect';
import { useScaledStyles } from '../stageScale';
import {
  meterFill,
  LOW_EDGE,
  ZONE_CLIP_FILL,
  ZONE_HOT_FILL,
  ZONE_LOW_FILL,
  type ChainNode,
  type Stage,
  type StageKind,
} from './gainEngine';

const pct = (x: number): `${number}%` => `${Number((x * 100).toFixed(1))}%`;

/** Region label — the SOURCE is never scolded for being quiet (owner
 *  2026-08-07): a mic-level source is SUPPOSED to be quiet. */
function regionLabelFor(node: ChainNode): string {
  if (node.kind === 'source' && node.region === 'low') return 'QUIET SOURCE';
  switch (node.region) {
    case 'low': return 'TOO LOW';
    case 'healthy': return 'HEALTHY';
    case 'hot': return 'HOT';
    default: return 'OVERLOAD';
  }
}

/** Source descriptor under the source column (owner wording). */
export function sourceDesc(node: ChainNode): string {
  return node.region === 'low'
    ? 'a quiet instrument/source'
    : node.region === 'healthy'
      ? 'a moderate source'
      : node.region === 'hot'
        ? 'a loud source'
        : 'a very loud source';
}

// ───────────────────────────────────────────── vertical 3-zone meter ────────
const VM_H = 118;
const VM_W = 18;

/** The level change travels the chain: each stage's meter starts moving
 *  RIPPLE_MS after the stage before it (art grading 2026-10-16: the copy
 *  says "watch the level ripple through the chain" and every meter snapped
 *  at once). Reduce Motion / Low-Light: the meters snap, as before. */
const RIPPLE_MS = 70;
const RIPPLE_GLIDE_MS = 170;

export function StageMeterV({
  node,
  height = VM_H,
  shortLabel,
  index = 0,
}: {
  node: ChainNode;
  height?: number;
  /** Position in the chain (0 = source) — sets the ripple delay. */
  index?: number;
  /** The glass has no room for a two-line region word: "QUIET SOURCE" drops
   *  to "QUIET" so the readout / FIXED tag under the column stays on the
   *  glass (a cropped readout drops its label, never its number). */
  shortLabel?: boolean;
}) {
  const fill = meterFill(node.level);
  const col = levelColor(fill);
  const { peak, reset: resetPeak } = usePeakHold(fill);
  const motionOk = useDecorativeMotion();
  const fillSv = useSharedValue(fill);
  useEffect(() => {
    fillSv.value = motionOk ? withDelay(index * RIPPLE_MS, withTiming(fill, { duration: RIPPLE_GLIDE_MS })) : fill;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the shared value is stable
  }, [fill, index, motionOk]);
  const fillStyle = useAnimatedStyle(() => ({ height: `${Math.max(0, Math.min(1, fillSv.value)) * 100}%` }));
  // FULL SCREEN (D35): the track width, ceiling hairline, peak line and the
  // 9-pt region label all zoom with the stage (1 on the glass = unchanged;
  // the caller passes `height` already scaled).
  const s = useScaledStyles(styles);
  return (
    <View style={s.vWrap}>
      <Pressable
        onPress={resetPeak}
        accessibilityRole="button"
        accessibilityLabel="Peak hold. Double tap to clear."
        style={[s.vTrack, { height }]}
      >
        {/* zones, bottom-up: too-low · healthy · hot/over */}
        <View style={[s.vZone, { bottom: 0, height: pct(ZONE_LOW_FILL), backgroundColor: '#13233f' }]} />
        <View style={[s.vZone, { bottom: pct(ZONE_LOW_FILL), height: pct(ZONE_HOT_FILL - ZONE_LOW_FILL), backgroundColor: '#122a17' }]} />
        <View style={[s.vZone, { bottom: pct(ZONE_HOT_FILL), height: pct(1 - ZONE_HOT_FILL), backgroundColor: '#2a1410' }]} />
        <Animated.View style={[s.vFill, fillStyle]}>
          <GradientView colors={rampColors(fill)} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        {/* Cumulative noise floor — grey hiss eating the meter from below.
            This is the visual referent for the too-low lesson (learning pass
            2026-08-31): pile on late gain and watch the hiss ride up. */}
        {meterFill(node.noise) > 0.005 ? (
          <View style={[s.vNoise, { height: pct(meterFill(node.noise)) }]}>
            <View style={s.vNoiseTop} />
          </View>
        ) : null}
        <View style={[s.vCeil, { bottom: pct(ZONE_CLIP_FILL) }]} />
        {/* Peak hold — stays at the highest level this stage reached until it
            is cleared. Drawn ABOVE the ceiling line so a peak that hit the
            wall is still visible against it. Light, not red, and only once it
            stands clear of the bar (art grading 2026-10-16: a red tick riding
            the fill read as a second clip line). */}
        {peak > fill + 0.015 ? <View style={[s.vPeak, { bottom: pct(peak) }]} /> : null}
      </Pressable>
      {node.stageClipped ? (
        <Text style={s.clipBadge}>CLIP</Text>
      ) : node.distorted ? (
        <Text style={s.distBadge}>DIST</Text>
      ) : (
        // 44 wide, centred under the 34-pt meter: at 9 pt "OVERLOAD" (~38 pt)
        // no longer breaks mid-word; "QUIET SOURCE" wraps at the space as it
        // always did. Bug pass 3: pass 2's 64 let QUIET SOURCE run ~52 pt on
        // one line, into the PREAMP column's label on a 7-column X-Ray chain
        // at 360 wide (column pitch ~45 pt).
        <Text style={[s.vRegion, s.vRegionUnder, { color: node.region === 'low' ? '#6f9bff' : col }]}>
          {shortLabel ? regionLabelFor(node).split(' ')[0] : regionLabelFor(node)}
        </Text>
      )}
    </View>
  );
}

// ───────────────────────────────────── rack stage (Rack Unit, 2026-08-23) ───
/** Meter-tint helper for bezel cells / dock faders (the MIDI ramp). */
export function stageTint(node: ChainNode): string {
  return levelColor(meterFill(node.level));
}

/** Compact bezel status cell for a node — spread into a BezelItem. */
export function stageStatus(node: ChainNode): { v: string; tint: string } {
  if (node.stageClipped) return { v: 'CLIP', tint: '#ff5f4e' };
  if (node.distorted) return { v: 'DIST', tint: '#ff7a1e' };
  if (node.region === 'low') return { v: 'LOW', tint: '#6f9bff' };
  if (node.region === 'hot') return { v: 'HOT', tint: '#ffc64d' };
  return { v: 'OK', tint: '#3fae52' };
}

export type StageColSpec = {
  key: string;
  name: string;
  kind: StageKind;
  node: ChainNode;
  /** 'meter' (default) — the 3-zone meter; 'leds' — closed-face SIG/CLIP only
   *  (real-gear honesty, X-Ray OFF); 'hidden' — collapsed, tap to inspect. */
  display?: 'meter' | 'leds' | 'hidden';
  /** Gain readout under the column (stages whose fader rides the dock). */
  readout?: string;
  /** Show the FIXED tag under the column (no user control anywhere). */
  fixed?: boolean;
  onPress?: () => void;
  /** Scan-blue highlight (the inspected / X-Rayed column). */
  active?: boolean;
};

/** The drawn gear above each column (pt, unscaled) — art fix 2026-10-16:
 *  the 20-pt line icons became the real channel-strip sections. */
const GEAR_H = 36;
/** The link drawn between two stages' gear (pt, unscaled). */
const LINK_W = 10;

/** Glass height (pt, unscaled) taken by everything but the meter track,
 *  at real line heights (Oswald ≈ 1.48 × size): glass padding 12 · path
 *  header 19 (the 13-pt ▸) · gap 6 · column border+padding 6 · icon 20 ·
 *  gap 4 · name 14 · gap 4 · meter gap 3 · one region line 13 · gap 4 ·
 *  FIXED tag 19 = 124, +2 slack. It was 110, so every column already ran
 *  ~7 pt past each edge of the glass (stageCols centres it) — the bottom
 *  readout under the bezel strip, the X-Ray column's highlight over the
 *  INPUT header (emulator pass 2026-10-14). */
// 2026-10-16: the 20-pt icon became the 36-pt gear (GEAR_H) → 126 − 20 + 36.
const METER_CHROME = 142;
/** One more 9-pt region-word line (the second line of "QUIET SOURCE"). */
const REGION_LINE = 14;
const MIN_METER = 44;

/** The pinned chain display for the Rack Unit stage: the whole signal path as
 *  columns inside the glass, height-parametric. Faders live on the dock — the
 *  columns show only what the signal is DOING at each point. */
export function ChainStage({ w, h, cols }: { w: number; h: number; cols: StageColSpec[] }) {
  // FULL SCREEN (D35): a view-built stage — every px in its StyleSheet
  // (fonts, meter widths, LEDs, tags, gaps) is multiplied by the stage text
  // scale and the flex layout fills the real (w, h); the icon and the meter
  // height scale by hand. 1 on the glass = exactly as before.
  const ts = useStageTextScale();
  const s = useScaledStyles(styles);
  // A quiet SOURCE's region word "QUIET SOURCE" wraps to two lines under its
  // 44-wide meter; the budget below assumed one, so the column ran ~14 pt
  // past the glass and its readout (−30 dB) / FIXED tag sat under the bezel
  // strip on every Gain page with a quiet source (emulator pass 2026-10-14).
  // Reserve the second line; where even the floor meter leaves no room for
  // it, the word drops to "QUIET" — the number below always stays.
  const twoLineLabel = cols.some((c) => (c.display ?? 'meter') === 'meter' && regionLabelFor(c.node).includes(' ') && !c.node.stageClipped && !c.node.distorted);
  const room = h / ts - METER_CHROME;
  const shortLabel = twoLineLabel && room - REGION_LINE < MIN_METER;
  const meterH = Math.max(MIN_METER, room - (twoLineLabel && !shortLabel ? REGION_LINE : 0)) * ts;
  // The mic → preamp XLR cable (GN-R2-03): one lane drawn over both gear
  // boxes, so it is placed from the same flex geometry the columns get —
  // the glass's inner width split into equal wraps, each a link (or the
  // first column's spacer) plus a column with its gear centred.
  const micCable = cols.length > 1 && cols[0].kind === 'source';
  const gearW = GEAR_H * GEAR_ASPECT * ts;
  const wrapW = (w - 2 * 10 * ts) / cols.length;
  const gearLeft0 = LINK_W * ts + (wrapW - LINK_W * ts - gearW) / 2;
  return (
    <View style={[s.stageGlass, { width: w, height: h }]}>
      {/* Signal path header: INPUT ▸ … ▸ OUTPUT */}
      <View style={s.pathRow}>
        <Text style={s.pathEnd}>INPUT</Text>
        <View style={s.pathLine} />
        <Text style={s.pathArrowBig}>▸</Text>
        <View style={s.pathLine} />
        <Text style={s.pathEnd}>OUTPUT</Text>
      </View>
      <View style={s.stageCols}>
        {/* The signal path itself: one line on the gear's centre line, from
            the mic's cable to the master, behind the gear (art grading
            2026-10-16: "stages are linked only by tiny grey arrowheads").
            The chevron on each hop turns red once the signal is distorted. */}
        {cols.length > 1 ? (
          <View
            pointerEvents="none"
            style={[
              s.pathTrace,
              {
                // with the mic cable drawn, the printed flow line starts at
                // the preamp: the first hop is the cable itself
                left: `${(micCable ? 150 : 50) / cols.length}%`,
                right: `${50 / cols.length}%`,
                top: (3 + GEAR_H / 2) * ts - 0.75,
              },
            ]}
          />
        ) : null}
        {cols.map((c, i) => {
          const display = c.display ?? 'meter';
          const inner = (
            <View style={[s.stageCol, c.active && s.stageColActive]}>
              <StageGear node={c.node} w={GEAR_H * GEAR_ASPECT * ts} h={GEAR_H * ts} hidden={display === 'hidden'} />
              <Text style={s.colName} numberOfLines={1} adjustsFontSizeToFit>
                {c.name}
              </Text>
              {display === 'meter' ? (
                <StageMeterV node={c.node} height={meterH} shortLabel={shortLabel} index={i} />
              ) : display === 'leds' ? (
                <View style={s.slotWrap}>
                  <View style={[s.slotBox, { height: meterH }]}>
                    <View style={[s.led, c.node.level > LOW_EDGE && s.ledSig]} />
                    <Text style={s.slotLedLabel}>SIG</Text>
                    <View style={[s.led, c.node.stageClipped && s.ledClip, { marginTop: 8 }]} />
                    <Text style={s.slotLedLabel}>CLIP</Text>
                  </View>
                  <Text style={s.slotUnder}> </Text>
                </View>
              ) : (
                <View style={s.slotWrap}>
                  <View style={[s.slotBox, { height: meterH }]}>
                    <Text style={s.slotQ}>?</Text>
                  </View>
                  <Text style={s.slotUnder}>INSPECT</Text>
                </View>
              )}
              {c.readout ? (
                <Text style={[s.colReadout, { color: stageTint(c.node) }]} {...fitValue(10)}>
                  {c.readout}
                </Text>
              ) : c.fixed ? (
                <View style={s.fixedTag}>
                  <Text style={s.fixedTagText}>FIXED</Text>
                </View>
              ) : (
                <Text style={s.colReadout}> </Text>
              )}
            </View>
          );
          return (
            <View key={c.key} style={s.stageColWrap}>
              {/* The first column carries no link: an equal spacer keeps
                  every column the same width (review 2026-10-16). */}
              {i === 0 ? <View style={{ width: LINK_W * ts }} /> : null}
              {/* Arrow tint guarded on display (fix 2026-08-31): a red arrow
                  between HIDDEN columns pointed straight at the Troubleshoot
                  fault. */}
              {i > 0 ? (
                <View style={s.stageLink}>
                  <StageLink w={LINK_W * ts} h={GEAR_H * ts} cable={i === 1 && cols[0].kind === 'source'} hot={c.node.distorted && display !== 'hidden'} />
                </View>
              ) : null}
              {c.onPress ? (
                <Pressable
                  onPress={c.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.name} stage — tap to inspect`}
                  style={s.stageColPress}
                >
                  {inner}
                </Pressable>
              ) : (
                inner
              )}
            </View>
          );
        })}
        {micCable ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: gearLeft0, top: 3 * ts, width: wrapW + gearW, height: GEAR_H * ts }}>
            <MicCableRun
              gearW={gearW}
              gearH={GEAR_H * ts}
              span={wrapW}
              chevronX={wrapW + (LINK_W * ts) / 2 - gearLeft0}
              hot={!!cols[1].node.distorted && (cols[1].display ?? 'meter') !== 'hidden'}
              dim={cols[0].display === 'hidden' || cols[1].display === 'hidden'}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ───────────────────────────────────────────── peak hold ─────────────────────
/**
 * Peak hold — the thin tick that stays at the highest level reached.
 *
 * The moving bar tells you about now; the tick tells you about the take. A
 * learner who looks away for two seconds has no other way to know what the
 * chorus did.
 */
function usePeakHold(fill: number) {
  const [peak, setPeak] = useState(fill);
  useEffect(() => {
    setPeak((p) => (fill > p ? fill : p));
  }, [fill]);
  return { peak, reset: () => setPeak(fill) };
}

// ───────────────────────────────────────────── stage icons + button ─────────
/** Small tappable button used across the lab. `good` = the green variant. */
export function GainBtn({
  label,
  active,
  danger,
  good,
  onPress,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  good?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={active != null ? { selected: active } : undefined}
      aria-pressed={active ?? undefined}
      style={[styles.btn, active && styles.btnActive, danger && styles.btnDanger, good && styles.btnGood]}
    >
      <Text
        style={[styles.btnText, active && styles.btnTextActive, danger && styles.btnTextDanger, good && styles.btnTextGood]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Re-export the horizontal DragSlider so modules import everything from here.
export { DragSlider };

const styles = StyleSheet.create({
  // vertical meter
  vWrap: { alignItems: 'center', gap: 3, width: 34 },
  vTrack: { width: VM_W, height: VM_H, borderRadius: 4, overflow: 'hidden', backgroundColor: '#0c0d11', borderWidth: 1, borderColor: '#23252d' },
  vZone: { position: 'absolute', left: 0, right: 0 },
  vFill: { position: 'absolute', left: 1, right: 1, bottom: 0, borderRadius: 2, opacity: 0.95, overflow: 'hidden' },
  vCeil: { position: 'absolute', left: -1, right: -1, height: 2, backgroundColor: '#ff5f4e' },
  vNoise: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(158,158,168,0.42)' },
  /* The noise floor's own edge — the hiss reads as a level, not a tint. */
  vNoiseTop: { position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: 'rgba(214,214,222,0.85)' },
  // ≥ 9 pt on a phone (bug pass 2 2026-09-30 — vRegion / fixedTagText /
  // slotUnder were 8.5, slotLedLabel 8).
  vRegion: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.4 },
  vRegionUnder: { width: 44, textAlign: 'center' },
  clipBadge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.8, color: '#fff', backgroundColor: '#c62f22', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, overflow: 'hidden' },
  distBadge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.5, color: '#ff7a1e' },

  // columns
  pathRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pathEnd: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.amber },
  pathLine: { flex: 1, height: 1, backgroundColor: '#3a4150' },
  pathArrowBig: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.amber },
  colName: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.6, color: colors.textPrimary, textAlign: 'center' },
  colReadout: { fontFamily: fonts.mono, fontSize: 10 },
  fixedTag: { borderRadius: 4, borderWidth: 1, borderColor: '#33353d', paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#101014' },
  fixedTagText: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.8, color: colors.textSub },

  // rack stage — the chain as columns inside the pinned glass (2026-08-23)
  stageGlass: { paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  // Top-aligned (art grading 2026-10-16): centred columns let a two-line
  // "QUIET SOURCE" lift the source meter above the others, so it read as a
  // bigger meter. Every gear and every meter now starts on the same line.
  stageCols: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  stageColWrap: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', minWidth: 0 },
  // The link sits on the gear's centre line: column border 1 + padding 2.
  stageLink: { marginTop: 3 },
  pathTrace: { position: 'absolute', height: 1.5, backgroundColor: '#7a6630' },
  stageColPress: { flex: 1, minWidth: 0 },
  stageCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: 2,
    minWidth: 0,
  },
  stageColActive: { borderColor: 'rgba(127,212,255,.55)', backgroundColor: '#10151b' },
  stageArrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: '#4a5060', paddingHorizontal: 1 },
  slotWrap: { alignItems: 'center', gap: 3, width: 34 },
  slotBox: {
    width: 26,
    borderRadius: 4,
    backgroundColor: '#0c0d11',
    borderWidth: 1,
    borderColor: '#23252d',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  slotQ: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.textSub },
  slotUnder: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.4, color: colors.textSub },
  slotLedLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.textSub, marginTop: 2 },



  led: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#23252d', borderWidth: 1, borderColor: '#0c0c0f' },
  ledSig: { backgroundColor: '#3fae52' },
  ledClip: { backgroundColor: '#ff3b2a' },
  /* Peak hold: a light hairline spanning the track — never red, so the
     only red mark on a meter is its ceiling. */
  vPeak: { position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: '#e9e9ef' },


  // buttons
  btn: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#17171c' },
  btnActive: { borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#1d1708' },
  btnDanger: { borderColor: 'rgba(198,47,34,.5)', backgroundColor: '#1c0f0d' },
  btnGood: { borderColor: 'rgba(55,224,95,.55)', backgroundColor: '#0c1a10' },
  btnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.7, color: colors.textSecondary },
  btnTextActive: { color: colors.amber },
  btnTextDanger: { color: '#ff7a6a' },
  btnTextGood: { color: colors.green },
});
