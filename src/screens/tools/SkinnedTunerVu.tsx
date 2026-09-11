/**
 * SkinnedTunerVu — the tuner's top display as a photoreal HORIZONTAL (edgewise)
 * VU meter (owner redesign 2026-09-10, replacing the arc "gas gauge").
 *
 * THE 3D MODEL (owner design ruling 2026-09-10, from the Simpson reference):
 * behind the glass sits a ROUND faceplate — a drum on a VERTICAL axis whose
 * front-most line is the scale center, curving BACKWARDS on both sides. The
 * needle rides an arm pivoting on that same axis, so the blade sweeps an arc
 * JUST IN FRONT of the face. Rendered straight-on with the skin's slight
 * above-view, that projection gives:
 *   • tick x = R·sin(φ)  — spacing compresses toward the ends,
 *   • the printed strip RISES at the ends (receding surface, camera above),
 *   • numbers foreshorten in width (scaleX = cos φ),
 *   • the blade stays perfectly VERTICAL (owner ruling: the visible blade
 *     never tilts), translating along the same arc so registration is exact,
 *     its tip tracking the strip's rise, with a parallax shadow cast onto the
 *     face behind it (the "just in front" depth cue),
 *   • the control arm (stem + carrier yoke + soft halo) glimpsed through the
 *     glow at the window's foot, translating with the blade (owner request).
 *
 * Scale is ±30 CENTS (owner: tighter than the old ±50): center = in tune,
 * left = flat (♭ end), right = sharp (♯ end). The ±5¢ in-tune zone is a green
 * segment of the baseline bar — this face's answer to a VU's red "+" block —
 * honoring the member custom in-tune colour. 1¢ fine ticks are printed only
 * inside ±5, where fine tuning actually happens. NO print sits within 7% of
 * the skin's edges (owner margin rule 2026-09-10). The header shows the Hz
 * readout ONLY — the hero note lives on the card below (owner 2026-09-10).
 *
 * Geometry is MEASURED in the skin's 1536×567 pixel space (glass window
 * x 86–1450 · y 48–491, scanned from the source PNG), same discipline as
 * SkinnedVu. All motion is REANIMATED, not RN Animated — the RN native-driver
 * path is a no-op on the 8090 web preview (attentionPulse lesson, owner
 * 2026-09-05); reduced motion snaps the needle and holds the chevrons still.
 *
 * Integrity (§1.7): the needle renders ONLY from real engine cents. With no
 * stable pitch the whole assembly FADES OUT while sliding to its rest past
 * the ♭ end (owner 2026-09-10: hidden, not parked-and-dimmed — the shadow at
 * the left peg read as a ghost needle). Never a fake reading.
 *
 * VuTunerFullScreen (owner 2026-09-10): the same meter as an absolute-fill
 * fullscreen overlay at the screen root — the CenterLock pattern (never a
 * Modal), driven by the published tuner frames, opened by TAPPING the meter
 * display (like the other audio tools — no icon key).
 */
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { animationsAllowed } from '../../features/settings/a11y';
import { optionalModule } from '../../features/tools/capture/optionalModule';
import { lockPortrait, unlockOrientation } from '../../lib/screenOrientationSafe';
import { closeVuTuner, useTunerFrame } from '../../features/tools/tuner/tunerFrameStore';
import { useToolColorPref } from '../../features/tools/waveColorPref';
import { colors, fonts } from '../../theme/tokens';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const TUNER_SKIN = require('../../../assets/tool-strips/tuner_skin.webp');

/* ── Skin-space geometry (1536×567, measured from the source PNG) ────────── */
const VB = { w: 1536, h: 567 };
// The glass window inside the bezel (scanned: x 86–1450, y 48–491). The needle
// assembly is CLIPPED to this rect so it vanishes under the rim like a real
// edgewise blade instead of riding over the bezel.
const GLASS = { x: 90, y: 50, w: 1356, h: 438, r: 30 };
// Owner margin rule (2026-09-10, widened from 7% same day): no graphics/text
// inside 13% of the skin's side edges.
const MARGIN_X = VB.w * 0.13; // ≈ 199.7
export const TUNER_MAX_CENTS = 30; // ±30¢ edge-to-edge (owner 2026-09-10)
const CX = VB.w / 2; // 768 — the 0¢ column (the drum's front-most line)

/* ── The drum projection ─────────────────────────────────────────────────── */
// ±30¢ wraps ±20° around the drum (owner 2026-09-10: 45° read too tight —
// loosened a third to 30°, then a third again to 20°; foreshortening, end
// compression and wrap-lean all soften with it).
const PHI_MAX = (20 * Math.PI) / 180;
// Scale half-span, sized from the margins: ♭ box [200..270] + 12 gap + the
// bar's 14 px lead-in puts the −30 column at x ≥ 296 → half-span 472; the
// mirror side then ends its bar at 1254, clear of the ♯ box [1266..1336].
const HALF_SPAN = 472;
const R_FACE = HALF_SPAN / Math.sin(PHI_MAX); // ≈ 668 — so x(±30¢) = ±472 px
// Vertical curve of the strip: a TRUE cylinder projection is dead-flat at
// center (rise ∝ φ², under 1 px across the green zone) — physically right,
// visually flat (owner 2026-09-10: "the green line looks perfectly flat").
// So the rise is drawn as a VISIBLE circular arc instead: R_VIS is tuned so
// the curve reads even across ±5¢ (~2 px sagitta) and gives ~37 px at the
// ends. Perceptual styling only — cent positions stay exact.
// 3000 → 4500 → 6750 (owner 2026-09-10, two loosening passes): end rise
// ~16.5 px, green-zone sagitta ~1 px.
const R_VIS = 6750;
const riseAtX = (x: number) => -(R_VIS - Math.sqrt(R_VIS * R_VIS - x * x)); // ≤ 0
// The needle ASSEMBLY rides a gentler arc than the print (owner 2026-09-10:
// the full strip rise swung the blade too far up at the pegs). Print keeps
// riseAtX; the blade/arm/shadow climb only this fraction of it.
const NEEDLE_RISE_K = 0.6;
const phiFor = (cents: number) => (cents / TUNER_MAX_CENTS) * PHI_MAX;
const xArc = (cents: number) => R_FACE * Math.sin(phiFor(cents));
const yArc = (cents: number) => riseAtX(xArc(cents));
const squish = (cents: number) => Math.cos(phiFor(cents)); // text foreshorten
// Wrap rotation: text on the drum leans its top gently toward center at the
// ends (visible on the Hoyt reference). Negative-sin so left leans clockwise.
const wrapDeg = (phi: number) => -6 * Math.sin(phi);
// Full drum treatment for print at a FIXED x (♭ ♯ and the range badge live
// PAST the ±30 columns, so their curve is derived from position, not cents —
// they must sell the same surface as the scale (owner 2026-09-10).
function drumAtX(dxFromCenter: number) {
  const phi = Math.asin(Math.max(-0.97, Math.min(0.97, dxFromCenter / R_FACE)));
  return {
    rise: riseAtX(dxFromCenter),
    transform: [{ scaleX: Math.cos(phi) }, { rotate: `${wrapDeg(phi)}deg` }],
  };
}

const BAR_Y = 312; // the baseline bar at scale center (ends ride yArc up)
const BAR_TH = 9;
const TOP_MINOR = 276; // 5¢ tick tops (center column values — all ride yArc)
const TOP_MAJOR = 256;
const TOP_ZERO = 240;
const TOP_FINE = 292; // 1¢ fine ticks (printed only inside ±5)
const NUM_Y = 224; // number row: text-box TOP sits at NUM_Y − 46 (46 = size)
const LEGEND_Y = 152; // "CENTS" — the reference meters' "−db+" slot
// The blade's free end stops AT the tick zone with clear glass above it
// (owner: the blade must not connect at the top — real edgewise blades rise
// from below and leave an open gap above the tip). 252 → 266: owner asked the
// whole assembly lowered a touch (2026-09-10).
const NEEDLE_TIP_Y = 266;
const INK = '#33200e'; // printed ink: warm near-black, reads on the amber glass
const INK_SOFT = 'rgba(51,32,14,0.72)';

// De-energised rest: PAST the −30 mark, leaning toward the ♭ glyph — parked on
// the printed −30 tick it could misread as a −30¢ measurement.
const REST_CENTS = -(TUNER_MAX_CENTS + 3.5);
const BLADE_W = 16; // blade width in SKIN px, so it scales with the face
const ARM_DEPTH = 600; // skin px from the window bottom down to the arm pivot

/* ── The printed face — absolutely-positioned ink scaled by one factor `s`
      (device px per skin px), so there is no per-frame SVG relayout ───────── */
function pxStyle(s: number, x: number, y: number, w: number, h: number) {
  return { position: 'absolute' as const, left: x * s, top: y * s, width: w * s, height: h * s };
}

function PrintedScale({ s, tuneInk }: { s: number; tuneInk: string }) {
  const ticks: { c: number; top: number; w: number; ink: 'zero' | 'zone' | 'soft' | 'fine' }[] = [];
  for (let c = -TUNER_MAX_CENTS; c <= TUNER_MAX_CENTS; c += 5) {
    const major = c % 10 === 0;
    ticks.push({
      c,
      top: c === 0 ? TOP_ZERO : major ? TOP_MAJOR : TOP_MINOR,
      w: c === 0 ? 7 : major ? 5 : 3.4,
      // The ±5 boundary ticks take the in-tune ink — they frame the zone.
      ink: c === 0 ? 'zero' : Math.abs(c) === 5 ? 'zone' : 'soft',
    });
  }
  // 1¢ fine ticks inside ±5 — full ink and real width, or they vanish at
  // phone scale (2.2 skin px rendered sub-pixel on a phone).
  for (let c = -4; c <= 4; c++) if (c !== 0) ticks.push({ c, top: TOP_FINE, w: 3.2, ink: 'fine' });

  // The baseline bar is drawn as 1¢ segments so it follows the drum's curve;
  // segments inside ±5 are the in-tune zone — taller and in the tune ink,
  // this face's answer to a VU's bold red block.
  const barSegs: { c: number; zone: boolean }[] = [];
  for (let c = -TUNER_MAX_CENTS; c < TUNER_MAX_CENTS; c++) barSegs.push({ c, zone: c >= -5 && c < 5 });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {barSegs.map((seg) => {
        const x0 = CX + xArc(seg.c);
        const x1 = CX + xArc(seg.c + 1);
        const y0 = yArc(seg.c);
        const y1 = yArc(seg.c + 1);
        // The zone is a COLOR change only — same thickness as the black bar
        // it extends into (owner 2026-09-10). Each segment ROTATES to its
        // local slope so the bar bends as one smooth arc, no stair-steps.
        return (
          <View
            key={`bar${seg.c}`}
            style={[
              pxStyle(s, x0, BAR_Y + (y0 + y1) / 2, x1 - x0 + 1.5, BAR_TH),
              { backgroundColor: seg.zone ? tuneInk : INK, transform: [{ rotate: `${Math.atan2(y1 - y0, x1 - x0)}rad` }] },
            ]}
          />
        );
      })}
      {ticks.map((t) => (
        <View
          key={`${t.c}@${t.top}`}
          style={[
            pxStyle(s, CX + xArc(t.c) - t.w / 2, t.top + yArc(t.c), t.w, BAR_Y - t.top),
            { backgroundColor: t.ink === 'zone' ? tuneInk : t.ink === 'soft' ? INK_SOFT : INK },
          ]}
        />
      ))}
      {/* numbers — unsigned (the ♭ / ♯ ends carry the polarity, VU-style),
          foreshortened toward the ends as the drum turns away */}
      {[-30, -20, -10, 0, 10, 20, 30].map((c) => (
        <Text
          key={c}
          style={[
            st.num,
            {
              left: (CX + xArc(c) - 60) * s,
              top: (NUM_Y - 46 + yArc(c)) * s,
              width: 120 * s,
              fontSize: 46 * s,
              transform: [{ scaleX: squish(c) }, { rotate: `${wrapDeg(phiFor(c))}deg` }],
            },
          ]}
        >
          {Math.abs(c)}
        </Text>
      ))}
      <Text style={[st.legend, { left: (CX - 200) * s, top: (LEGEND_Y - 38) * s, width: 400 * s, fontSize: 38 * s, letterSpacing: 6 * s }]}>CENTS</Text>
      {/* accidentals + range legend — inside the 7% margin, riding the ends'
          rise so they sit with the receding strip */}
      {(() => {
        const flatXf = drumAtX(MARGIN_X + 35 - CX);
        const sharpXf = drumAtX(VB.w - MARGIN_X - 35 - CX);
        const badgeXf = drumAtX(MARGIN_X + 10 + 65 - CX);
        return (
          <>
            <Text style={[st.endGlyph, { left: MARGIN_X * s, top: (306 - 62 + flatXf.rise) * s, width: 70 * s, fontSize: 62 * s, transform: flatXf.transform }]}>♭</Text>
            <Text style={[st.endGlyph, { left: (VB.w - MARGIN_X - 70) * s, top: (306 - 62 + sharpXf.rise) * s, width: 70 * s, fontSize: 62 * s, transform: sharpXf.transform }]}>♯</Text>
            <Text style={[st.badge, { left: (MARGIN_X + 10) * s, top: (410 - 44 + badgeXf.rise) * s, width: 130 * s, fontSize: 44 * s, transform: badgeXf.transform }]}>±30¢</Text>
          </>
        );
      })()}
    </View>
  );
}

/* ── The meter ───────────────────────────────────────────────────────────── */
export function SkinnedTunerVu({
  hzText,
  cents,
  dim,
  inTune,
  tuneColor,
  onExpand,
}: {
  /** Pre-formatted Hz readout — the screen owns fmtHz. (The header shows Hz
   *  ONLY; the hero note card below carries the note — owner 2026-09-10.) */
  hzText: string;
  /** Real engine cents, or null when there is no stable pitch. */
  cents: number | null;
  dim: boolean;
  inTune: boolean;
  /** MEMBER custom in-tune colour (owner 2026-08-21). null = default green. */
  tuneColor?: string | null;
  /** When set, TAPPING THE DISPLAY opens the meter full screen (owner
   *  2026-09-10 — like the other audio tools; no icon key). */
  onExpand?: () => void;
}) {
  const tuneInk = tuneColor ?? colors.green;
  const allowed = animationsAllowed();
  const [w, setW] = useState(0);
  const s = w > 0 ? w / VB.w : 0;
  const h = Math.round(VB.h * s);

  const cv = useSharedValue(REST_CENTS); // clamped cents driving the arm
  const alive = useSharedValue(0); // 0 = de-energised rest, 1 = live
  useEffect(() => {
    const target = cents == null ? REST_CENTS : Math.max(-TUNER_MAX_CENTS, Math.min(TUNER_MAX_CENTS, cents));
    if (allowed) {
      cv.value = withTiming(target, { duration: cents == null ? 320 : 90, easing: Easing.out(Easing.quad) });
      alive.value = withTiming(cents == null ? 0 : 1, { duration: 200 });
    } else {
      cv.value = target;
      alive.value = cents == null ? 0 : 1;
    }
  }, [cents, allowed, cv, alive]);

  // The whole arm assembly translates along the drum arc; the tip also rides
  // the strip's rise. dim folds INTO the worklet — a static style in the
  // array loses to later animated opacity frames (HOLD would stay bright).
  const armStyle = useAnimatedStyle(() => {
    const phi = (cv.value / TUNER_MAX_CENTS) * PHI_MAX;
    const x = R_FACE * Math.sin(phi);
    return {
      transform: [
        { translateX: x * s },
        { translateY: -(R_VIS - Math.sqrt(R_VIS * R_VIS - x * x)) * NEEDLE_RISE_K * s },
      ],
      // No stable pitch → the assembly fades fully OUT as it slides to rest
      // (owner 2026-09-10: hide it — a parked dimmed blade read as a ghost).
      opacity: alive.value * (dim ? 0.45 : 1),
    };
  }, [s, dim]);

  // Parallax shadow on the face BEHIND the blade. The LIGHT SOURCE is the
  // glow lamp at bottom-center (owner physics ruling 2026-09-10): the shadow
  // is thrown AWAY from the lamp — left of the blade on the flat side, right
  // on the sharp side, hidden exactly behind the blade at center — and
  // slightly UPWARD, because the lamp sits below the blade.
  const shadowStyle = useAnimatedStyle(() => {
    const phi = (cv.value / TUNER_MAX_CENTS) * PHI_MAX;
    const x = R_FACE * Math.sin(phi);
    return {
      transform: [
        { translateX: (R_FACE + 30) * Math.sin(phi) * s },
        { translateY: (-(R_VIS - Math.sqrt(R_VIS * R_VIS - x * x)) * NEEDLE_RISE_K - 6) * s },
      ],
      opacity: 0.22 * alive.value * (dim ? 0.45 : 1),
    };
  }, [s, dim]);

  // The blade runs 60 skin px PAST the window bottom (owner 2026-09-10: its
  // end must never be seen — at center everything below the rim is clipped;
  // at the extremes the drum rise lifts the assembly ~26 px, still covered).
  const bladeLen = (GLASS.y + GLASS.h - NEEDLE_TIP_Y + 60) * s;
  const boxBase = {
    left: (CX - GLASS.x - 50) * s,
    top: (NEEDLE_TIP_Y - GLASS.y) * s,
    width: 100 * s,
    height: bladeLen,
  };
  // Control arm (owner realism pass 2026-09-10 — "not a paint drop"): the
  // visible hardware is a squared CLAMP COLLAR seating the blade, buried
  // 2 skin px below the rim at center, with the angled SHAFT emerging from
  // UNDER it on the inboard side. The collar covers the shaft's top end, so
  // the reveal is always a straight-edged angled bar sliding out from behind
  // the rim — never a rounded cap. The drum rise makes the reveal
  // progressive: nothing at center, a sliver by ~±15¢, ~24 px at the pegs.
  // The shaft RISES FROM the fixed pivot under the window center, so it leans
  // in from the INBOARD side (owner physics ruling; RN rotate is
  // clockwise-positive: +atan swings the shaft's lower end back to center).
  const rimY = (GLASS.y + GLASS.h - NEEDLE_TIP_Y) * s;
  const rodLen = 190 * s;
  // Connection point (owner 2026-09-10): buried so the hardware reveal tops
  // out around 8 px at the pegs — present, never showy. Re-tuned with each
  // arc loosening (needle end rise now ~10 px): collar 2 below the rim,
  // anchor 8.
  const rodAnchorY = rimY + 8 * s;
  const rodStyle = useAnimatedStyle(() => {
    const phi = (cv.value / TUNER_MAX_CENTS) * PHI_MAX;
    return { transform: [{ rotate: `${Math.atan((R_FACE * Math.sin(phi)) / ARM_DEPTH)}rad` }] };
  }, []);

  const meterLabel =
    cents == null
      ? `Tuner meter, no stable pitch. ${hzText}.`
      : `Tuner meter, ${hzText}, ${Math.round(Math.abs(cents))} cents ${cents < 0 ? 'flat' : cents > 0 ? 'sharp' : ''}${inTune ? ', in tune' : ''}. Scale plus or minus 30 cents.`;
  return (
    <View style={[styles.wrap, inTune && { borderColor: tuneInk }]}>
      <View style={[styles.header, dim && styles.dim]}>
        <Text style={styles.hz}>{hzText}</Text>
      </View>
      {/* Fullscreen = tap the display itself, like the other audio tools
          (owner 2026-09-10 — no ⛶ icon key). */}
      <Pressable
        style={styles.meterClip}
        onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}
        onPress={onExpand}
        disabled={!onExpand}
        accessible
        accessibilityRole={onExpand ? 'button' : 'image'}
        accessibilityLabel={onExpand ? `${meterLabel} Tap for full screen.` : meterLabel}
      >
        {s > 0 && (
          <View style={{ width: w, height: h }}>
            <Image source={TUNER_SKIN} style={{ width: w, height: h }} resizeMode="stretch" />
            <PrintedScale s={s} tuneInk={tuneInk} />
            <View
              pointerEvents="none"
              style={[pxStyle(s, GLASS.x, GLASS.y, GLASS.w, GLASS.h), { overflow: 'hidden', borderRadius: GLASS.r * s }]}
            >
              {/* the blade's shadow, cast onto the curved face behind it */}
              <Animated.View style={[styles.bladeBox, boxBase, shadowStyle]}>
                <View style={[styles.bladeShadow, { width: BLADE_W * 0.9 * s, height: bladeLen, borderRadius: (BLADE_W / 2) * s }]} />
              </Animated.View>
              {/* the vertical blade + its clamp collar + the angled shaft
                  leaning toward the central pivot (owner 2026-09-10) */}
              <Animated.View style={[styles.bladeBox, boxBase, armStyle]}>
                <Animated.View
                  style={[
                    styles.armPivotBox,
                    { top: rodAnchorY - rodLen, height: rodLen * 2, width: 60 * s },
                    rodStyle,
                  ]}
                >
                  <View style={[styles.armRod, { width: 26 * s, height: rodLen, borderRadius: 4 * s }]}>
                    <View style={[styles.armRodStripe, { width: 8 * s }]} />
                  </View>
                </Animated.View>
                <View style={[styles.armCollar, { top: rimY + 2 * s, width: 34 * s, height: 60 * s, borderRadius: 3 * s }]}>
                  <View style={[styles.armCollarEdge, { height: 4 * s }]} />
                </View>
                <View
                  style={[
                    styles.blade,
                    { width: BLADE_W * s, height: bladeLen, borderRadius: (BLADE_W / 2) * s },
                    inTune && { backgroundColor: tuneInk },
                  ]}
                />
              </Animated.View>
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}

/* ── TuneChevrons — the correction cue below the note readout (owner
      2026-09-10: the old duplicate cents mini-bar is gone; arrows animate
      toward the fix). Flat → ❯❯❯ marching right (bring the pitch UP); sharp →
      ❮❮❮ marching left (bring it DOWN). In tune (or no pitch) → an even,
      quiet row, no march. Proximity fades the row as the player closes in. ── */
function Chev({ phase, index, flat, glyph }: { phase: SharedValue<number>; index: number; flat: boolean; glyph: string }) {
  // Wave travels in the direction of the needed correction.
  const cs = useAnimatedStyle(() => {
    const off = (flat ? index : 2 - index) / 3;
    const p = (phase.value - off + 1) % 1;
    const tri = 1 - Math.abs(2 * p - 1); // 0→1→0 triangle
    return { opacity: 0.25 + 0.75 * tri };
  });
  return <Animated.Text style={[styles.chev, cs]}>{glyph}</Animated.Text>;
}

export function TuneChevrons({ cents, dim, tuneColor }: { cents: number | null; dim: boolean; tuneColor?: string | null }) {
  const allowed = animationsAllowed();
  const active = cents != null && Math.abs(cents) >= 1;
  const flat = (cents ?? 0) < 0;
  const phase = useSharedValue(0.999);
  useEffect(() => {
    if (active && allowed) {
      phase.value = 0;
      phase.value = withRepeat(withTiming(1, { duration: 850, easing: Easing.linear }), -1, false);
    } else {
      phase.value = 0.999; // reduced motion: hold each chevron near-solid
    }
    return () => cancelAnimation(phase);
  }, [active, allowed, phase]);

  const strength = cents == null ? 0 : Math.min(1, Math.abs(cents) / 12);
  const glyph = flat ? '❯' : '❮';
  return (
    <View
      style={[styles.chevRow, { opacity: active ? 0.45 + 0.55 * strength : 0.35 }, dim && styles.dim]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={
        cents == null ? 'No tuning direction — no stable pitch.' : active ? (flat ? 'Flat — tune up.' : 'Sharp — tune down.') : 'On pitch.'
      }
    >
      {active ? (
        [0, 1, 2].map((i) => <Chev key={i} phase={phase} index={i} flat={flat} glyph={glyph} />)
      ) : (
        <Text style={[styles.chev, { color: tuneColor ?? colors.green, opacity: 0.75 }]}>· · ·</Text>
      )}
    </View>
  );
}

/* ── VuTunerFullScreen — the meter as THE display (owner 2026-09-10) ─────── */
const FS_NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
/** Nearest chromatic note vs the published A4 — the same formula as the
 *  screen's noteFor (duplicated here: importing it back would create a
 *  require cycle with FrequencyCounterScreen). */
function fsNoteFor(freq: number, a4: number): { name: string; octave: number; cents: number } {
  const n = Math.max(0, Math.min(127, Math.round(12 * Math.log2(freq / a4)) + 69));
  const fNote = a4 * Math.pow(2, (n - 69) / 12);
  return { name: FS_NOTE_NAMES[((n % 12) + 12) % 12], octave: Math.floor(n / 12) - 1, cents: 1200 * Math.log2(freq / fNote) };
}
type KeepAwakeLib = { activateKeepAwakeAsync?: (tag?: string) => Promise<void>; deactivateKeepAwake?: (tag?: string) => Promise<void> | void };

/**
 * Absolute-fill overlay at the screen root (CenterLock pattern — never a
 * Modal). Reads the published tuner frames, keeps the screen awake, allows
 * rotation (the meter's 2.7:1 face earns its size in landscape), closes with ✕.
 */
export function VuTunerFullScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const frame = useTunerFrame();
  const [tunerColor] = useToolColorPref('ape:tools:tunerColor');
  useEffect(() => {
    const ka = optionalModule<KeepAwakeLib>('expo-keep-awake');
    void ka?.activateKeepAwakeAsync?.('vutuner').catch(() => {});
    unlockOrientation();
    return () => {
      Promise.resolve()
        .then(() => ka?.deactivateKeepAwake?.('vutuner'))
        .catch(() => {});
      lockPortrait();
    };
  }, []);

  const note = frame.accepted && frame.freq != null ? fsNoteFor(frame.freq, frame.a4) : null;
  const cents = note != null ? note.cents : null;
  const inTune = note != null && Math.abs(note.cents) < 1;
  const hzText = frame.freq != null ? `${frame.freq < 10 ? frame.freq.toFixed(2) : frame.freq.toFixed(1)} Hz` : '— Hz';
  const tuneInk = tunerColor ?? colors.green;
  // The face is 2.71:1 — size it to whichever axis binds, leaving room for
  // the note block below (and the safe areas around).
  const chromeH = 210;
  const meterW = Math.round(Math.min(width - insets.left - insets.right - 24, (height - insets.top - insets.bottom - chromeH) * (VB.w / VB.h)));
  const noteSize = Math.round(Math.min(110, (height - insets.top - insets.bottom) * 0.2));

  return (
    <View style={[fs.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 10, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <Pressable onPress={closeVuTuner} hitSlop={16} style={fs.closeKey} accessibilityRole="button" accessibilityLabel="Close full screen">
        <Text style={fs.closeX}>✕</Text>
      </Pressable>
      <View style={fs.center}>
        <View style={{ width: meterW }}>
          <SkinnedTunerVu hzText={hzText} cents={cents} dim={false} inTune={inTune} tuneColor={tunerColor} />
        </View>
        <View
          style={fs.noteRow}
          accessible
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
          accessibilityLabel={note == null ? 'No stable pitch' : `${note.name}${note.octave}, ${Math.abs(note.cents).toFixed(1)} cents ${note.cents < 0 ? 'flat' : 'sharp'}${inTune ? ', in tune' : ''}`}
        >
          <Text style={[fs.note, { fontSize: noteSize, lineHeight: Math.round(noteSize * 1.1) }, inTune && { color: tuneInk }]}>
            {note != null ? `${note.name}${note.octave}` : '—'}
          </Text>
        </View>
        <TuneChevrons cents={cents} dim={false} tuneColor={tunerColor} />
        <Text style={[fs.cents, inTune && { color: tuneInk }]}>
          {note != null ? `${(Math.abs(note.cents) < 0.05 ? 0 : note.cents) >= 0 ? '+' : ''}${(Math.abs(note.cents) < 0.05 ? 0 : note.cents).toFixed(1)} cents` : 'no stable pitch'}
        </Text>
      </View>
      <Text style={fs.foot}>Phone microphone · ±30¢ scale · A4 {frame.a4} · silent by design</Text>
    </View>
  );
}

const fs = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0a0a0c', zIndex: 40 },
  closeKey: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.textSecondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  noteRow: { alignItems: 'center' },
  note: { fontFamily: fonts.oswaldBold, color: '#5fd9c4', letterSpacing: 1 },
  cents: { fontFamily: fonts.mono, fontSize: 16, color: colors.textSecondary },
  foot: { textAlign: 'center', fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted },
});

const st = StyleSheet.create({
  num: { position: 'absolute', textAlign: 'center', fontFamily: fonts.oswaldSemiBold, color: INK },
  legend: { position: 'absolute', textAlign: 'center', fontFamily: fonts.oswaldSemiBold, color: INK_SOFT },
  endGlyph: { position: 'absolute', textAlign: 'center', fontFamily: fonts.barlowSemiBold, color: INK },
  // Printed voice like its neighbors, full ink — mono is the app's DIGITAL
  // readout voice and was unreadable in the glow.
  badge: { position: 'absolute', fontFamily: fonts.oswaldSemiBold, color: INK },
});

const styles = StyleSheet.create({
  wrap: {
    // 12 matches the sibling tunerCurrent card.
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#101013',
    paddingTop: 8,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 6,
  },
  hz: { fontFamily: fonts.mono, fontSize: 22, color: colors.amber },
  meterClip: { overflow: 'hidden' },
  bladeBox: { position: 'absolute', alignItems: 'center' },
  blade: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#1d1208',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 2,
    shadowOffset: { width: 2, height: 0 },
  },
  bladeShadow: { position: 'absolute', top: 0, backgroundColor: '#000' },
  // The control arm — rotation about the container's CENTER equals the
  // shaft's top anchor (the shaft fills only the bottom half of the box).
  armPivotBox: { position: 'absolute', alignItems: 'center', justifyContent: 'flex-end' },
  // Straight-edged shaft with a brushed highlight stripe down its middle —
  // squared ends; the collar hides its top, so no rounded cap ever shows.
  armRod: { backgroundColor: '#170b03', opacity: 0.92, alignItems: 'center', overflow: 'hidden' },
  armRodStripe: { height: '100%', backgroundColor: '#4a3018', opacity: 0.85 },
  // The clamp collar seating the blade: squared machined block with a faint
  // edge highlight along its top face.
  armCollar: { position: 'absolute', backgroundColor: '#2a1608', overflow: 'hidden' },
  armCollarEdge: { width: '100%', backgroundColor: '#7a5228', opacity: 0.7 },
  chevRow: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  chev: { fontFamily: fonts.barlowSemiBold, fontSize: 22, color: colors.amber, lineHeight: 26 },
  dim: { opacity: 0.45 },
});

export default SkinnedTunerVu;
