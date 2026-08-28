/**
 * MicPrinciplesLabScreen — "Microphone Principles" (owner 2026-07-29).
 * Single mission: HOW MICROPHONES CAPTURE SOUND.
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23, owner-approved): each interactive
 * section now declares the Rack Unit frame directly (LiveSpectrumEq idiom) —
 * *reading may scroll; operating may not*. The section's canvas PINS on the
 * stage (the polar drag surface and the hand-grip drag no longer share a
 * scroller with anything, so the old InteractionZone scroll-lock workaround is
 * retired for staged canvases); live numbers read on the bezel; chips became
 * sticky option trays and sliders became dock faders. The section chip-row,
 * prose, checks and the mistakes carousel live in the scroll well. CAPSULE and
 * MISTAKES have zero operable controls — pure reading — so they render as a
 * plain scroll (the law holds trivially; the tall portrait cutaway reads
 * in-flow, where it fits).
 *
 * VISUAL-FIRST LAUNCH (owner decision): every concept is taught through
 * manipulable drawings — no audio playback; the screen states plainly that
 * audio demonstrations are coming in a future release (§1.7: say what is and
 * isn't real). Every curve is an ILLUSTRATIVE MODEL and badged as such
 * (verbatim honesty text on each stage's badge strip).
 *
 * VISUALS: Skia via micspeaker/skiaGate (pre-Skia clients get the honest
 * card; text still teaches). Help: every control long-presses into the
 * two-tier guided-lesson popup ('mic' lesson); the bezel ⓘ opens the display
 * guide.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../../../theme/tokens';
import { levelColor, levelColorForDb, rampColors } from '../../../features/tools/levelColor';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { LabChip, CollapsibleSection } from '../LabShell';
import { markLabUnit, registerLabUnits } from '../../../features/lab/labCompletion';
import { GuidedLessonSheet, getLabLesson, DisplayGuideButton } from '../../../features/lab/guidedLessons';
import { CheckQuestion, VizUnavailableCard, type CheckSpec } from '../foundations/bits';
import { RackUnit } from '../rack/RackUnit';
import type { DockParam } from '../rack/rackTypes';
import { requireMsViz, skiaAvailable, type MsVizModule } from './skiaGate';
import { MicCutaway } from './MicCutaway';

// ── Pure models the SCREEN owns (no Skia dependency — readouts must work
//    even on pre-Skia clients showing the honest card). ─────────────────────

const PATTERNS: { key: string; label: string; a: number; b: number }[] = [
  { key: 'omni', label: 'OMNI', a: 1, b: 0 },
  { key: 'cardioid', label: 'CARDIOID', a: 0.5, b: 0.5 },
  { key: 'super', label: 'SUPER', a: 0.37, b: 0.63 },
  { key: 'hyper', label: 'HYPER', a: 0.25, b: 0.75 },
  { key: 'fig8', label: 'FIGURE-8', a: 0, b: 1 },
];

function gainAt(a: number, b: number, deg: number): number {
  return Math.abs(a + b * Math.cos((deg * Math.PI) / 180));
}

// ── POLAR: free source positioning with a COLLISION FLOOR (owner 2026-07-29)
// The source used to be pinned to a fixed radius and blocked from approaching
// the mic. It is now the CLAVES icon (owner 2026-07-29), draggable ANYWHERE on
// the canvas, and the only restriction is that its silhouette may not INTERSECT
// the mic's — it may come right up next to it. Solved here (not in viz.tsx)
// because this screen must also run on pre-Skia clients, which never load
// viz.tsx; the numbers mirror viz.tsx's CLAVES_COLLIDERS / clavesScaleForMic
// exactly. Claves do NOT rotate — the crossing point is the acoustic origin,
// so colliders place directly (no face-angle rotation).
// RACK 2026-08-23: the canvas height is now the STAGE's glass height, so the
// clamp/angle math is height-parametric (viz.PolarPatternView already was).
const POLAR_GR = 8; // grille radius
const POLAR_LEN = 37; // body length
const POLAR_MIC_DY = -6; // grille centre offset from the canvas centre
/** clavesScaleForMic(): a 20 cm clave against the 16 cm mic actually drawn
 *  (canon length 44 units). Mirrors viz.tsx clavesScaleForMic exactly. */
const POLAR_CLAVES_S = ((1.72 * POLAR_GR + POLAR_LEN) * (20 / 16)) / 44;
/** The claves silhouette as three circles in icon units (origin = the crossing
 *  = the acoustic origin; the icon never rotates). Mirrors CLAVES_COLLIDERS. */
const CLAVES_CIRCLES: [number, number, number][] = [
  [0, 0, 10],
  [10.9, 15.6, 8],
  [-10.9, 15.6, 8],
];

/** Signed distance from a point to the mic's rounded-rect silhouette. */
function micSdf(px: number, py: number, cx: number, cy: number): number {
  const halfW = POLAR_GR;
  const top = cy + POLAR_MIC_DY - POLAR_GR;
  const bot = cy + POLAR_MIC_DY + POLAR_GR * 0.72 + POLAR_LEN;
  const my = (top + bot) / 2;
  const halfH = (bot - top) / 2;
  const r = POLAR_GR * 0.8;
  const qx = Math.abs(px - cx) - (halfW - r);
  const qy = Math.abs(py - my) - (halfH - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

/**
 * Collision FLOOR (not a keep-out radius): push the claves out along the
 * mic→source axis just far enough that no part of its silhouette overlaps the
 * mic. Touching is allowed; intersecting is not. The claves icon does not
 * rotate, so colliders place directly (no face-angle transform).
 */
function clampPolarSource(x: number, y: number, w: number, h: number): { x: number; y: number } {
  const cx = w / 2;
  const cy = h / 2;
  const my = cy + POLAR_MIC_DY + (POLAR_GR * 0.72 + POLAR_LEN) / 2 - POLAR_GR / 2;
  let px = Math.max(2, Math.min(w - 2, x));
  let py = Math.max(2, Math.min(h - 2, y));
  for (let iter = 0; iter < 4; iter++) {
    let worst = 0;
    for (const [u, v, r] of CLAVES_CIRCLES) {
      const wx = px + u * POLAR_CLAVES_S;
      const wy = py + v * POLAR_CLAVES_S;
      worst = Math.max(worst, r * POLAR_CLAVES_S - micSdf(wx, wy, cx, cy));
    }
    if (worst <= 0.25) break;
    let dx = px - cx;
    let dy = py - my;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    px += dx * worst;
    py += dy * worst;
  }
  return { x: px, y: py };
}

/** The scene opens the same way it always has: the source at 35°, near the
 *  edge — expressed against the ACTUAL glass size the stage granted. */
function defaultPolarSrc(w: number, h: number): { x: number; y: number } {
  const R = Math.min(w, h) / 2 - 16;
  const th = (35 * Math.PI) / 180;
  return clampPolarSource(w / 2 + R * Math.sin(th), h / 2 - R * Math.cos(th), w, h);
}

const OFF_ANGLES = [0, 30, 60, 90, 180];

// Vertical level ramps for the response graphs (owner 2026-08-05). PROXIMITY
// only boosts (0…+10 dB): green at unity → red at the top. OFF-AXIS spans a
// loss range: MIDI blue at the −25 dB floor up through warm to red on top.
//
// Colours DERIVED from the standard, not typed by hand: these were five
// near-miss hexes (#37e05f where the ramp's green is #3fae52, #ff5a48 where its
// red is #ff5f4e), so the response graphs spoke a slightly different colour
// language than the meters beside them. levelColorForDb maps each stop's own dB
// through the ramp, so the tint and the number can never disagree.
//
// These stay on the METER ramp (levelColorForDb), not heatColor: a response
// graph's floor is the bottom of its plotted RANGE, not an absence of signal,
// so MIDI-0 blue is right there and the fade-to-black rule does not apply.
// PROXIMITY only ever BOOSTS (0…+12 dB), so its 0 dB is UNITY — "no boost" —
// not silence. The window is offset to −8 so unity lands on GREEN and the top
// on red, preserving the original green→red intent; mapping 0…12 straight onto
// the ramp would have painted unity BLUE, i.e. "no signal", which is a
// different claim entirely.
const PROX_STOPS = [
  { db: 0, color: levelColorForDb(0, -8, 12) },
  { db: 6, color: levelColorForDb(6, -8, 12) },
  { db: 12, color: levelColorForDb(12, -8, 12) },
];
const OFFAXIS_STOPS = [
  { db: -26, color: levelColorForDb(-26, -26, 6) },
  { db: -14, color: levelColorForDb(-14, -26, 6) },
  { db: -2, color: levelColorForDb(-2, -26, 6) },
  { db: 6, color: levelColorForDb(6, -26, 6) },
];

/** Illustrative proximity low-shelf boost (dB) as the mic nears the mouth —
 *  smooth so a slider can drive it. ~+10 dB at 1 in, tapering to ~0 by 12 in. */
function proxBoostForInches(inches: number): number {
  const t = Math.max(0, Math.min(1, (12 - inches) / 11));
  return Math.round(10 * Math.pow(t, 1.4) * 10) / 10;
}

const POP_MODES: { key: 'none' | 'pop' | 'foam' | 'blimp'; label: string; pass: number; note: string }[] = [
  { key: 'none', label: 'NONE', pass: 1, note: 'The full plosive blast hits the capsule — a low-frequency POP that can overload it.' },
  { key: 'pop', label: 'POP FILTER', pass: 0.3, note: 'A mesh disc a few inches out breaks up the air burst; the voice passes untouched.' },
  { key: 'foam', label: 'FOAM', pass: 0.5, note: 'Foam over the grille softens wind and breath — good outdoors, mild HF cost.' },
  { key: 'blimp', label: 'SHOTGUN WINDSHIELD', pass: 0.12, note: 'A full basket creates still air around the mic — the outdoor standard for wind.' },
];

// ── Grip zones — DERIVED from the drawn geometry (owner defect ruling
//    2026-07-29). These numbers are exactly viz.tsx's GRIP_P_CORRECT /
//    GRIP_P_RIM / GRIP_P_FULL / GRIP_P_DEFAULT. They are duplicated here
//    rather than imported because this screen must also work on pre-Skia
//    clients, which never load viz.tsx.
//
//    Panel geometry (viz.tsx HandPlacementView, fixed 216-px panel):
//      grilleR 15 · bodyLen 70 → total 95.8 ≈ 3.2 × the 30-px grille
//      diameter · grille ball centre y = 73 · grille RIM (the grille/body
//      joint) y = 83.8 · tail end y = 153.8 · the canonical hand at scale
//      1.11 is 40.5 px tall = 58 % of the body.
//    Grip centre travels yC(p) = 130.71 − 57.71·p (p = 0 rests the hand on
//    the tail, p = 1 centres it on the grille ball), so the gap between the
//    TOP EDGE of the hand and the rim is clearance(p) = 27.48 − 57.71·p:
//      clearance > 13.74 (over half the slack still unused) → LOW HANDLE
//                                                             p < 0.24
//      0 < clearance ≤ 13.74 — hand fully on the body, top edge just below
//      the rim, touching nothing                            → CORRECT
//                                                             p < 0.48
//      clearance ≤ 0 — the top of the hand has REACHED the rim and
//      fingertips overlap the ball                          → PARTIAL CUP
//                                                             p < 0.81
//      grip CENTRE at/above the rim — hand around the ball  → FULL CUP
const ZONE_P_CORRECT = 0.24;
const ZONE_P_RIM = 0.48;
const ZONE_P_FULL = 0.81;
/** Default/showcase grip — mid-band inside CORRECT (7.3 px of clearance). */
const ZONE_P_DEFAULT = 0.35;

const HAND_POSITIONS: { label: string; pos: number; title: string; note: string; good?: boolean }[] = [
  { label: 'LOW HANDLE', pos: 0, title: 'Low grip — acceptable', note: 'Hand at the bottom of the handle. The pattern stays intact, so this grip is fine — but it gives up control of the mic, and on a wireless mic this is where the antenna lives (see MISTAKES).' },
  { label: 'CORRECT', pos: ZONE_P_DEFAULT, good: true, title: 'Correct grip ✅', note: 'Hand on the upper body with its TOP EDGE just below the grille rim — on the body, touching the grille nowhere. Intended cardioid pattern, flat response, maximum feedback rejection — the microphone performs as designed.' },
  { label: 'GRILLE RIM', pos: 0.62, title: 'Partial cup — fingers on the rim', note: 'The top of the hand has reached the grille rim and fingertips now overlap it, shading the acoustic ports: the pattern begins collapsing, the response grows peaks and dips, feedback becomes more likely, intelligibility drops.' },
  { label: 'FULL CUP', pos: 1, title: 'Cupping the mic ❌', note: 'The hand surrounds the grille: the cardioid collapses toward omni, coloration is strong, feedback susceptibility jumps. Covering the acoustic ports prevents the microphone from operating as intended.' },
];

/** pos01 → grip zone (mirrors the tint thresholds in viz exactly). */
function zoneAt(pos: number): (typeof HAND_POSITIONS)[number] {
  return pos < ZONE_P_CORRECT
    ? HAND_POSITIONS[0]
    : pos < ZONE_P_RIM
      ? HAND_POSITIONS[1]
      : pos < ZONE_P_FULL
        ? HAND_POSITIONS[2]
        : HAND_POSITIONS[3];
}

const STEREO_TECHS: { key: 'xy' | 'ortf' | 'ab' | 'ms'; label: string; from: string; note: string }[] = [
  { key: 'xy', label: 'XY', from: 'LEVEL', note: 'Two cardioids COINCIDENT at ~90°. Stereo comes from level differences only — perfectly mono-compatible, modest width.' },
  { key: 'ortf', label: 'ORTF', from: 'LVL+TIME', note: 'Two cardioids 17 cm apart at 110°. Level AND small time differences — wider, natural image; good mono behavior.' },
  { key: 'ab', label: 'AB', from: 'TIME', note: 'Two spaced omnis facing forward. Stereo from time differences — big, open image; watch mono fold-down.' },
  { key: 'ms', label: 'MID-SIDE', from: 'MIX', note: 'Cardioid forward + figure-8 sideways at one point. Width is a MIX decision after the fact — fully mono-safe.' },
];

const MISTAKES: { kind: 'correct' | 'grille' | 'cup' | 'away' | 'far' | 'switch' | 'antenna'; title: string; note: string }[] = [
  { kind: 'correct', title: '✅ Correct grip', note: 'Handle below the grille, capsule pointed at the mouth, a hand-width away.' },
  { kind: 'grille', title: '❌ Holding the grille', note: 'Fingers on the grille color the sound and start to distort the pickup pattern.' },
  { kind: 'cup', title: '❌ Cupping the grille', note: 'Blocks the rear ports — the pattern collapses, feedback risk jumps.' },
  { kind: 'away', title: '❌ Pointing away', note: 'The most sensitive axis misses the mouth — thin, quiet, off-axis sound.' },
  { kind: 'far', title: '❌ Too far away', note: 'Level drops and the room takes over — distant, roomy, feedback-prone.' },
  { kind: 'switch', title: '❌ Covering the switch', note: 'A hand over the switch can mute the mic mid-sentence (wired or wireless).' },
  { kind: 'antenna', title: '❌ Blocking the antenna', note: 'On wireless mics, a hand over the transmitter antenna causes dropouts.' },
];

// ── Small shared bits ────────────────────────────────────────────────────────

function IllustrationBadge({ text }: { text?: string }) {
  return <Text style={styles.badge}>{text ?? 'ILLUSTRATIVE MODEL — DRAWN FROM THE EQUATIONS, NOT A MEASUREMENT'}</Text>;
}

/** A thin labeled meter bar (RN — works on every client). */
/**
 * A bar whose LENGTH encodes a level/share/amount — so per the app-wide
 * amplitude standard it must wear the ramp, not a flat colour (owner
 * 2026-08-28; ruling of record 2026-08-16 in levelColor.ts: "a bar whose SIZE
 * encodes a level must show the RAMP climbing from silence (blue) up to the
 * level's colour — the peak colour belongs only at the TIP").
 *
 * Every bar on this screen used to be painted one hardcoded hex (green for
 * DIRECT, blue for ROOM, green/red for VIBRATION), which said nothing about
 * magnitude and contradicted the standard the rest of the app follows.
 */
function MeterBar({ label, frac }: { label: string; frac: number }) {
  const f = Math.max(0, Math.min(1, frac));
  return (
    <View style={{ gap: 3 }}>
      <Text style={styles.meterLabel}>{label}</Text>
      <View style={styles.meterTrack}>
        <LinearGradient
          colors={rampColors(f)}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.meterFill, { width: `${Math.max(2, Math.min(100, f * 100))}%` }]}
        />
      </View>
    </View>
  );
}

type SectionProps = {
  viz: MsVizModule | null;
  focused: boolean;
  help: (k?: string) => void;
  /** Shared well header: honest no-Skia card + section chip-row + title +
   *  blurb. First thing in every section's scroll region. */
  wellTop: ReactNode;
  /** Shared well footer: the guided-lesson entry row. */
  wellBottom: ReactNode;
};

// ── 0 · Inside the capsule — the generator (react-native-svg, works on every
//    client; does NOT use the Skia viz module). PURE READING — no operable
//    controls — so this section is a plain scroll: the tall portrait cutaway
//    (width/0.7732 ≈ 1.3× width) reads in-flow, where it fits. ───────────────

function CapsuleSection({ focused, help, wellTop, wellBottom }: SectionProps) {
  const [width, setWidth] = useState(0);
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {wellTop}
      {/* panelCard consumes 24 padding + 2 border → content box is −26. */}
      <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
        {width > 0 ? (
          <View style={styles.panelCard}>
            <MicCutaway width={width} running={focused} />
            <IllustrationBadge text="MOVING-COIL DYNAMIC CUTAWAY — ILLUSTRATIVE MODEL · coil travel exaggerated ~1,000×; the on-drawing caveat states the mass-controlled-cardioid honesty note · amber = induced current (⊗/⊙ mark its direction, and flip as it reverses)" />
            <DisplayGuideButton onPress={() => help('capsule')} />
            <Text style={styles.readout}>e = B · l · v — voltage tracks the coil’s VELOCITY</Text>
            <CollapsibleSection title="WHAT'S HAPPENING" onHelp={() => help('capsule')}>
              <Text style={styles.caption}>
                A dynamic mic is a tiny generator run in reverse of a speaker. Sound pressure moves the
                diaphragm, the diaphragm moves a coil of wire through the magnet’s gap, and moving a wire
                through a magnetic field induces a voltage — e = B·l·v. The output follows the coil’s
                SPEED, not its position: it peaks when the coil moves fastest and reverses every half-cycle
                (watch the ⊗/⊙ current markers flip and the glow pulse). The little humbucking coil outside
                the gap cancels stray hum. The rear port and phase-shift felt are what make it directional —
                the same parts you meet again in POLAR, PROXIMITY, and the cupping cutaway.
              </Text>
            </CollapsibleSection>
          </View>
        ) : null}
      </View>
      {wellBottom}
    </ScrollView>
  );
}

// ── 1 · Polar patterns — the star drag surface, pinned on the stage ─────────

function PolarSection({ viz, focused, help, wellTop, wellBottom }: SectionProps) {
  const [patIdx, setPatIdx] = useState(1);
  // The source is a FREE position in canvas px, not an angle on a fixed
  // radius. It spawns at the old 35° / near-edge spot once the stage reports
  // its glass size, then may be dragged anywhere (collision-clamped off the
  // mic). The drag lives ON the stage — outside every ScrollView — so the old
  // InteractionZone scroll-lock is retired here.
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [src, setSrc] = useState<{ x: number; y: number } | null>(null);
  const dimsRef = useRef(dims);
  dimsRef.current = dims;
  // Glass resized (stage auto-drop on rotation/short viewports): re-clamp a
  // dragged source back inside the new bounds.
  useEffect(() => {
    if (dims) setSrc((s) => (s ? clampPolarSource(s.x, s.y, dims.w, dims.h) : s));
  }, [dims]);

  const pat = PATTERNS[patIdx];
  const eff = src ?? (dims ? defaultPolarSrc(dims.w, dims.h) : null);
  // Polar math UNCHANGED: θ is still measured from the mic's front axis (up).
  const angle =
    eff && dims
      ? Math.round((Math.atan2(eff.x - dims.w / 2, -(eff.y - (dims.h / 2 + POLAR_MIC_DY))) * 180) / Math.PI)
      : 35;
  const g = gainAt(pat.a, pat.b, angle);
  const angle360 = ((angle % 360) + 360) % 360;

  const posBaseRef = useRef({ x: 0, y: 0 }); // anchored-drag base — see onPanResponderGrant
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, gs) => Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4,
      onPanResponderGrant: (e, gs) => {
        // Anchor to the gesture START (owner 2026-08-23): base = location − dx.
        posBaseRef.current = { x: e.nativeEvent.locationX - gs.dx, y: e.nativeEvent.locationY - gs.dy };
      },
      onPanResponderMove: (_e, gs) => {
        // Free positioning: the head follows the finger. base + gestureState
        // reproduces the true finger position without re-basing, so it no longer
        // teleports when the finger leaves the canvas bounds. The ONLY limit is
        // the collision floor against the mic's silhouette.
        const d = dimsRef.current;
        if (!d) return;
        setSrc(clampPolarSource(posBaseRef.current.x + gs.dx, posBaseRef.current.y + gs.dy, d.w, d.h));
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'pattern',
      label: 'PATTERN',
      valueLabel: pat.label,
      options: PATTERNS.map((p) => ({ id: p.key, label: p.label })),
      selectedId: pat.key,
      onSelect: (id) => {
        const i = PATTERNS.findIndex((p) => p.key === id);
        if (i >= 0) setPatIdx(i);
      },
      sticky: true, // A/B the patterns while the field redraws — the lesson
      helpKey: 'polar_pattern',
    },
  ];

  return (
    <RackUnit
      initialParam="pattern"
      params={params}
      onHelp={help}
      stage={{
        size: 'L', // the pickup field IS the lab — earns the tall glass
        badge:
          'CONCEPTUAL PICKUP FIELD — ILLUSTRATIVE MODEL, NOT A MEASURED POLAR RESPONSE · color = r(θ) = |A + B·cosθ| × 1/d falloff · drag the speaker anywhere — it can come right up next to the mic, but never through it',
        onGuide: () => help('polar_pattern'),
        bezel: [
          { k: 'PATTERN', v: pat.label, helpKey: 'polar_pattern' },
          { k: 'SOURCE', v: dims ? `${angle360}°` : '—', helpKey: 'polar_pattern' },
          {
            k: 'PICKUP',
            v: !dims ? '—' : g < 0.05 ? 'NULL ≤−30 dB' : `${(20 * Math.log10(g)).toFixed(1)} dB`,
            tint: g < 0.05 ? '#ff6b5e' : undefined,
            flex: 1.3,
            helpKey: 'polar_pattern',
          },
        ],
        render: (w, h) => (
          <View
            style={{ width: w, height: h }}
            onLayout={() => setDims((d) => (d && d.w === w && d.h === h ? d : { w, h }))}
            {...pan.panHandlers}
          >
            {viz && eff ? (
              <PolarViz viz={viz} width={w} height={h} a={pat.a} b={pat.b} src={eff} running={focused} />
            ) : viz ? null : (
              <VizUnavailableCard />
            )}
          </View>
        ),
      }}
    >
      {wellTop}
      <CollapsibleSection title="WHAT'S HAPPENING" onHelp={() => help('polar_pattern')}>
        <Text style={styles.caption}>
          The pattern is the mic’s sensitivity by direction. Cardioid rejects the rear (monitor
          wedges live there). Figure-8 has two lobes and two deep side nulls. Omni hears everything —
          no proximity effect, no null to aim.
        </Text>
      </CollapsibleSection>
      {wellBottom}
    </RackUnit>
  );
}
function PolarViz({
  viz,
  width,
  height,
  a,
  b,
  src,
  running,
}: {
  viz: MsVizModule;
  width: number;
  height: number;
  a: number;
  b: number;
  src: { x: number; y: number };
  running: boolean;
}) {
  const phase = viz.usePhaseClock(running, 0.7);
  return <viz.PolarPatternView phase={phase} width={width} height={height} a={a} b={b} srcX={src.x} srcY={src.y} />;
}

// ── 2 · Distance ────────────────────────────────────────────────────────────

function DistanceSection({ viz, focused, help, wellTop, wellBottom }: SectionProps) {
  const [d01, setD01] = useState(0.3);
  const inches = Math.round(4 + d01 * 44);
  const relDb = -20 * Math.log10(inches / 4);
  // DIRECT-to-REVERBERANT SHARE (fix 2026-08-28 — owner marked these bars "NOT
  // WORKING"). They were `6 / inches` (a hyperbola that spent almost all its
  // travel in the first few percent of the fader) and a hard literal `0.32`
  // that could never move at all — so the ROOM bar AND the ROOM bezel % were
  // frozen for every distance.
  //
  // Now both bars show each source's SHARE of what the mic picks up, which is
  // the actual lesson the caption already states ("beyond that, the room starts
  // winning"). Direct energy obeys the inverse-square law from the 4-inch
  // reference; the room's reverberant energy really is ~constant, so the SHARE
  // is what moves. ROOM_E is set so the two cross at ~12 in — the critical
  // distance, matching the stated 4–12 in working range.
  const directE = Math.pow(4 / inches, 2);
  const ROOM_E = Math.pow(4 / 12, 2); // equal shares at 12 in
  const direct = directE / (directE + ROOM_E);
  const room = ROOM_E / (directE + ROOM_E);

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'dist',
      label: 'DISTANCE',
      value: d01,
      onChange: setD01,
      format: () => `${inches} in · ${relDb.toFixed(1)} dB rel 4 in`,
      formatShort: () => `${inches} in`,
      helpKey: 'distance',
    },
  ];

  return (
    <RackUnit
      initialParam="dist"
      params={params}
      onHelp={help}
      stage={{
        size: 'M',
        badge: 'CONCEPTUAL SOUND FIELD — ILLUSTRATIVE MODEL, NOT A MEASUREMENT · direct energy fading into the room glow; wavefronts slowed for visibility',
        onGuide: () => help('distance'),
        bezel: [
          { k: 'DIST', v: `${inches} in`, helpKey: 'distance' },
          // Level-bearing readouts wear the amplitude ramp (owner 2026-08-28):
          // LEVEL is a real dB value; DIRECT/ROOM are shares of what the mic
          // hears, so each is tinted by its own magnitude rather than by a
          // fixed identity colour.
          { k: 'LEVEL', v: `${relDb.toFixed(1)} dB`, tint: levelColorForDb(relDb, -24, 0), helpKey: 'distance' },
          { k: 'DIRECT', v: `${Math.round(direct * 100)}%`, tint: levelColor(direct), helpKey: 'distance' },
          { k: 'ROOM', v: `${Math.round(room * 100)}%`, tint: levelColor(room), helpKey: 'distance' },
        ],
        render: (w, h) =>
          viz ? <DistanceViz viz={viz} width={w} height={h} d01={d01} running={focused} /> : <VizUnavailableCard />,
      }}
    >
      {wellTop}
      <MeterBar label="DIRECT SOUND — share of what the mic hears" frac={direct} />
      <MeterBar label="ROOM SOUND — share of what the mic hears" frac={room} />
      <CollapsibleSection title="WHAT'S HAPPENING" onHelp={() => help('distance')}>
        <Text style={styles.caption}>
          Halving the distance gains ~6 dB of DIRECT sound while the room’s reverberant energy stays
          put — so what changes is the BALANCE, and that ratio is what “close” sounds like. The two
          bars are each source’s share of what the mic picks up. They cross at about 12 inches (the
          critical distance): closer than that you are recording the talker, farther than that you
          are recording the room. Typical speech working distance: about 4–12 inches.
        </Text>
      </CollapsibleSection>
      {wellBottom}
    </RackUnit>
  );
}
function DistanceViz({ viz, width, height, d01, running }: { viz: MsVizModule; width: number; height: number; d01: number; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.55);
  return <viz.DistanceView phase={phase} width={width} height={height} dist01={d01} />;
}

// ── 3 · Proximity effect ────────────────────────────────────────────────────

const PROX_CHECK: CheckSpec = {
  question: 'Which microphone gets BASSIER as you move in close?',
  options: [
    'Any microphone — closeness always adds bass',
    'Directional mics (cardioid, figure-8) — omnis do not have proximity effect',
    'Only large-diaphragm mics',
  ],
  correctIdx: 1,
  reveal:
    'Proximity effect comes from the PRESSURE-GRADIENT design that makes a mic directional — the same rear ports that create the cardioid pattern create the up-close bass boost. An omni is a pure pressure mic: no ports, no gradient, no proximity effect.',
  wrongHint: 'Flip the pattern tray and watch the curve — which pattern refuses to change?',
};

function ProximitySection({ viz, focused, help, wellTop, wellBottom }: SectionProps) {
  // Distance is a continuous control (owner 2026-08-05): ride the DISTANCE
  // lane to bring the mic in toward the mouth and watch the low-shelf grow.
  // d01 = 0 far (12 in) → 1 close (1 in).
  const [d01, setD01] = useState(0);
  const [directional, setDirectional] = useState(true);
  const inches = Math.round((12 - d01 * 11) * 10) / 10;
  const boostDb = proxBoostForInches(inches);

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'dist',
      label: 'DISTANCE',
      value: d01,
      onChange: setD01,
      format: () => (inches >= 12 ? '12 in · no boost' : `${inches} in · +${boostDb} dB low-shelf`),
      formatShort: () => `${inches} in`,
      helpKey: 'proximity',
    },
    {
      kind: 'options',
      id: 'micpat',
      label: 'MIC',
      valueLabel: directional ? 'CARDIOID' : 'OMNI',
      options: [
        { id: 'cardioid', label: 'CARDIOID' },
        { id: 'omni', label: 'OMNI' },
      ],
      selectedId: directional ? 'cardioid' : 'omni',
      onSelect: (id) => setDirectional(id === 'cardioid'),
      sticky: true, // A/B the two designs while the curve reacts — the lesson
      helpKey: 'proximity',
    },
  ];

  return (
    <RackUnit
      initialParam="dist"
      params={params}
      onHelp={help}
      stage={{
        size: 'L', // approach scene + response curve stack on one glass
        badge: 'ILLUSTRATIVE — conceptual approach scene + a simplified low-shelf response; real mics vary by design',
        onGuide: () => help('proximity'),
        bezel: [
          { k: 'DIST', v: `${inches} in`, helpKey: 'proximity' },
          {
            k: 'BOOST',
            v: directional ? (boostDb > 0 ? `+${boostDb} dB` : 'NONE') : 'FLAT',
            tint: directional && boostDb >= 6 ? '#ff5a48' : directional && boostDb > 0 ? '#ffd76b' : '#37e05f',
            helpKey: 'proximity',
          },
          { k: 'MIC', v: directional ? 'CARDIOID' : 'OMNI', helpKey: 'proximity' },
        ],
        render: (w, h) => {
          if (!viz) return <VizUnavailableCard />;
          const sceneH = Math.round(h * 0.5);
          return (
            <View style={{ width: w, height: h }}>
              <ProxApproachViz viz={viz} width={w} height={sceneH} inches={inches} boostDb={boostDb} directional={directional} running={focused} />
              <viz.ResponseCurveView
                width={w}
                height={h - sceneH}
                dbAt={(f) => (directional ? viz.proximityDb(f, boostDb) : 0)}
                floorDb={0}
                ceilDb={12}
                vStops={directional ? PROX_STOPS : undefined}
              />
            </View>
          );
        },
      }}
    >
      {wellTop}
      <CollapsibleSection title="WHAT'S HAPPENING" onHelp={() => help('proximity')}>
        <Text style={styles.caption}>
          Radio-voice warmth IS this effect, used on purpose. It is also why a singer who swallows
          the mic turns muddy — and why the high-pass filter exists on every channel strip.
        </Text>
      </CollapsibleSection>
      <CheckQuestion spec={PROX_CHECK} />
      {wellBottom}
    </RackUnit>
  );
}
function ProxApproachViz({
  viz,
  width,
  height,
  inches,
  boostDb,
  directional,
  running,
}: {
  viz: MsVizModule;
  width: number;
  height: number;
  inches: number;
  boostDb: number;
  directional: boolean;
  running: boolean;
}) {
  const phase = viz.usePhaseClock(running, 0.55);
  return (
    <viz.ProximityApproachView
      phase={phase}
      width={width}
      height={height}
      inches={inches}
      boostDb={boostDb}
      directional={directional}
    />
  );
}

// ── 4 · Off-axis response ───────────────────────────────────────────────────

function OffAxisSection({ viz, help, wellTop, wellBottom }: SectionProps) {
  const [angle, setAngle] = useState(0);

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'angle',
      label: 'ANGLE',
      // Continuous sweep 0–180° — the lane IS the old chip row, made smooth.
      value: angle / 180,
      onChange: (v) => setAngle(Math.round(Math.max(0, Math.min(1, v)) * 180)),
      format: () => `${angle}° off-axis`,
      formatShort: () => `${angle}°`,
      helpKey: 'off_axis',
    },
    {
      kind: 'options',
      id: 'preset',
      label: 'PRESET',
      valueLabel: OFF_ANGLES.includes(angle) ? `${angle}°` : '·',
      options: OFF_ANGLES.map((a) => ({ id: String(a), label: `${a}°` })),
      selectedId: OFF_ANGLES.includes(angle) ? String(angle) : null,
      onSelect: (id) => setAngle(Number(id)),
      sticky: true, // A/B the canonical angles while the curve reacts
      helpKey: 'off_axis',
    },
  ];

  return (
    <RackUnit
      initialParam="angle"
      params={params}
      onHelp={help}
      stage={{
        size: 'L', // mic diagram + response curve stack on one glass
        badge: 'ILLUSTRATIVE — broadband polar loss + growing high-frequency rolloff off-axis',
        onGuide: () => help('off_axis'),
        bezel: [
          { k: 'ANGLE', v: `${angle}°`, helpKey: 'off_axis' },
          { k: '@100 Hz', v: viz ? `${viz.offAxisDb(100, angle).toFixed(1)} dB` : '—', helpKey: 'off_axis' },
          { k: '@8 kHz', v: viz ? `${viz.offAxisDb(8000, angle).toFixed(1)} dB` : '—', tint: '#7fd4ff', helpKey: 'off_axis' },
        ],
        render: (w, h) => {
          if (!viz) return <VizUnavailableCard />;
          const micH = Math.min(110, Math.round(h * 0.42));
          return (
            <View style={{ width: w, height: h }}>
              <viz.OffAxisMicView width={w} height={micH} angleDeg={angle} />
              <viz.ResponseCurveView
                width={w}
                height={h - micH}
                dbAt={(f) => viz.offAxisDb(f, angle)}
                floorDb={-26}
                ceilDb={6}
                vStops={OFFAXIS_STOPS}
              />
            </View>
          );
        },
      }}
    >
      {wellTop}
      <CollapsibleSection title="WHAT'S HAPPENING" onHelp={() => help('off_axis')}>
        <Text style={styles.caption}>
          Off-axis sound isn’t just QUIETER — it’s DULLER: the highs fall off faster than the lows.
          That’s why a singer drifting off-mic changes tone before they change level, and why good
          off-axis behavior is a mark of a great microphone.
        </Text>
      </CollapsibleSection>
      {wellBottom}
    </RackUnit>
  );
}

// ── 5 · Plosives & wind ─────────────────────────────────────────────────────

function PopSection({ viz, focused, help, wellTop, wellBottom }: SectionProps) {
  const [modeIdx, setModeIdx] = useState(0);
  const m = POP_MODES[modeIdx];
  const blastTint = m.pass > 0.6 ? '#ff6b5e' : m.pass > 0.35 ? '#ffd76b' : '#5bff85';

  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'barrier',
      label: 'BARRIER',
      valueLabel: m.label,
      options: POP_MODES.map((p) => ({ id: p.key, label: p.label })),
      selectedId: m.key,
      onSelect: (id) => {
        const i = POP_MODES.findIndex((p) => p.key === id);
        if (i >= 0) setModeIdx(i);
      },
      sticky: true, // A/B the barriers while the blast redraws — the lesson
      helpKey: 'pop_filter',
    },
  ];

  return (
    <RackUnit
      initialParam="barrier"
      params={params}
      onHelp={help}
      stage={{
        size: 'M',
        badge: 'CONCEPTUAL — blue = the air blast (wind), amber = the voice; the voice always passes',
        onGuide: () => help('pop_filter'),
        bezel: [
          { k: 'BARRIER', v: m.label, flex: 1.5, helpKey: 'pop_filter' },
          { k: 'BLAST AT CAPSULE', v: `${Math.round(m.pass * 100)}%`, tint: blastTint, flex: 1.5, helpKey: 'pop_filter' },
        ],
        render: (w, h) =>
          viz ? <PopViz viz={viz} width={w} height={h} mode={m.key} running={focused} /> : <VizUnavailableCard />,
      }}
    >
      {wellTop}
      <MeterBar label="PLOSIVE ENERGY REACHING THE CAPSULE" frac={m.pass} />
      <CollapsibleSection title="WHAT'S HAPPENING" onHelp={() => help('pop_filter')}>
        <Text style={styles.caption}>{m.note}</Text>
        <Text style={styles.caption}>
          “P” and “B” fire a jet of air, not just sound. The fix is always the same idea: break up
          the MOVING AIR before it hits the diaphragm while letting the sound wave through.
        </Text>
      </CollapsibleSection>
      {wellBottom}
    </RackUnit>
  );
}
function PopViz({ viz, width, height, mode, running }: { viz: MsVizModule; width: number; height: number; mode: 'none' | 'pop' | 'foam' | 'blimp'; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.5);
  return <viz.PopFilterView phase={phase} width={width} height={height} mode={mode} />;
}

// ── 6 · Handling noise & isolation ──────────────────────────────────────────

// ShockMountView draws at a FIXED 262-px internal height (floor strip and
// stand-shake readout live at fixed y) — it is the one non-parametric viz, so
// the stage fits it by uniform scale instead of clipping the bottom readout.
const SHOCK_H = 262;

function ShockSection({ viz, focused, help, wellTop, wellBottom }: SectionProps) {
  const [shock, setShock] = useState(false);

  const params: DockParam[] = [
    {
      kind: 'toggle',
      id: 'mount',
      label: 'SHOCK MT',
      value: shock,
      onToggle: () => setShock((v) => !v),
      helpKey: 'shock_mount',
    },
  ];

  return (
    <RackUnit
      initialParam="mount"
      params={params}
      onHelp={help}
      stage={{
        size: 'L',
        badge: 'CONCEPTUAL — the STAND is being shaken (red readout, bottom). The readout above the capsule shows how much of that shake actually arrives at the mic; with a shock mount you can watch the elastic bands take up the difference.',
        onGuide: () => help('shock_mount'),
        bezel: [
          { k: 'MOUNT', v: shock ? 'SHOCK' : 'RIGID', helpKey: 'shock_mount' },
          // Magnitude, so it wears the ramp rather than a green/red state colour.
          { k: 'INTO MIC', v: shock ? '15%' : '90%', tint: levelColor(shock ? 0.15 : 0.9), helpKey: 'shock_mount' },
        ],
        render: (w, h) => {
          if (!viz) return <VizUnavailableCard />;
          const s = Math.min(1, h / SHOCK_H);
          return (
            <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <View style={{ width: w / s, height: SHOCK_H, transform: [{ scale: s }] }}>
                <ShockViz viz={viz} width={w / s} shock={shock} running={focused} />
              </View>
            </View>
          );
        },
      }}
    >
      {wellTop}
      <MeterBar label="VIBRATION TRANSMITTED INTO THE MIC" frac={shock ? 0.15 : 0.9} />
      <CollapsibleSection title="WHAT'S HAPPENING" onHelp={() => help('shock_mount')}>
        <Text style={styles.caption}>
          Footsteps, cable tugs and stand knocks travel THROUGH solids into the capsule as
          low-frequency thumps. A shock mount is a soft spring between stand and mic — the vibration
          stays in the stand. (The high-pass filter is the electrical version of the same idea.)
        </Text>
      </CollapsibleSection>
      {wellBottom}
    </RackUnit>
  );
}
function ShockViz({ viz, width, shock, running }: { viz: MsVizModule; width: number; shock: boolean; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.8);
  return <viz.ShockMountView phase={phase} width={width} shockMount={shock} />;
}

// ── 7 · Stereo techniques ───────────────────────────────────────────────────

function StereoSection({ viz, help, wellTop, wellBottom }: SectionProps) {
  const [techIdx, setTechIdx] = useState(0);
  const t = STEREO_TECHS[techIdx];

  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'tech',
      label: 'TECHNIQUE',
      valueLabel: t.label,
      options: STEREO_TECHS.map((s) => ({ id: s.key, label: s.label })),
      selectedId: t.key,
      onSelect: (id) => {
        const i = STEREO_TECHS.findIndex((s) => s.key === id);
        if (i >= 0) setTechIdx(i);
      },
      sticky: true, // A/B the arrays while the field redraws — the lesson
      helpKey: 'stereo_pair',
    },
  ];

  return (
    <RackUnit
      initialParam="tech"
      params={params}
      onHelp={help}
      stage={{
        size: 'L',
        badge: "CONCEPTUAL PICKUP FIELD — ILLUSTRATIVE MODEL, NOT A MEASUREMENT · the two capsules' |A + B·cosθ| gains × 1/d, summed for this technique's geometry · the lit deck at the top is the stage",
        onGuide: () => help('stereo_pair'),
        bezel: [
          { k: 'TECHNIQUE', v: t.label, flex: 1.3, helpKey: 'stereo_pair' },
          { k: 'STEREO FROM', v: t.from, flex: 1.3, helpKey: 'stereo_pair' },
        ],
        render: (w, h) => (viz ? <viz.StereoTechniqueView width={w} height={h} tech={t.key} /> : <VizUnavailableCard />),
      }}
    >
      {wellTop}
      <CollapsibleSection title="WHAT'S HAPPENING" onHelp={() => help('stereo_pair')}>
        <Text style={styles.caption}>{t.note}</Text>
        <Text style={styles.caption}>
          Two mics make stereo from LEVEL differences, TIME differences, or both — every named
          technique is just a different trade between width, focus, and mono compatibility.
        </Text>
      </CollapsibleSection>
      {wellBottom}
    </RackUnit>
  );
}

// ── 8 · Hand placement — the cupping star ───────────────────────────────────

const CUP_CHECK: CheckSpec = {
  question: 'Cupping a cardioid mic’s grille makes feedback MORE likely because…',
  options: [
    'The hand reflects sound back into the mic',
    'Blocking the rear ports collapses the pattern toward OMNI — the null aimed at the monitor disappears',
    'It boosts the microphone’s output level',
  ],
  correctIdx: 1,
  reveal:
    'The cardioid null is what lets the mic sit near a monitor wedge without howling. The rear ports CREATE that null — cover them and the mic hears in every direction (toward omni), the monitor pours straight in, and the engineer must pull the fader down. Cupped mic = quieter in the mix AND worse tone.',
  wrongHint: 'Watch the polar panel as you ride the GRIP lane to FULL CUP — what happened to the rear of the pattern?',
};

// HandPlacementView draws at a fixed 216-px height; the drag maps the canvas
// y-range 16…200 → pos 1…0 — both unchanged. The pan handlers wrap the panel
// itself (content-height view), so locationY math is untouched; the stage
// merely centers it in the glass.
const HAND_PANEL_H = 216;

function HandSection({ viz, focused, help, wellTop, wellBottom }: SectionProps) {
  // Starts in the CORRECT zone by construction (ZONE_P_CORRECT ≤ 0.35 < ZONE_P_RIM).
  const [pos, setPos] = useState(ZONE_P_DEFAULT);
  const [why, setWhy] = useState(false);
  const [wellW, setWellW] = useState(0);
  const zone = zoneAt(pos);

  const baseYRef = useRef(0); // anchored-drag base — see onPanResponderGrant
  const pan = useRef(
    PanResponder.create({
      // Claim on TOUCH START — kept from the in-scroll era (harmless on the
      // stage, where no ScrollView competes; the GRIP lane and the POSITION
      // tray remain the no-drag alternatives).
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, gs) => Math.abs(gs.dy) > 2,
      onPanResponderGrant: (e, gs) => {
        // Anchor to the gesture's START Y (owner 2026-08-23): base + gestureState.dy
        // reproduces the true finger Y without re-basing, so dragging past the
        // canvas edge no longer whips the hand to the opposite end.
        baseYRef.current = e.nativeEvent.locationY - gs.dy;
        setPos(Math.max(0, Math.min(1, 1 - (baseYRef.current - 16) / 184)));
      },
      onPanResponderMove: (_e, gs) => {
        // Drag the hand along the mic body: top of the canvas = full cup.
        const y = baseYRef.current + gs.dy;
        setPos(Math.max(0, Math.min(1, 1 - (y - 16) / 184)));
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'grip',
      label: 'GRIP',
      value: pos,
      onChange: (v) => setPos(Math.max(0, Math.min(1, v))),
      format: () => zone.label,
      tint: pos >= ZONE_P_RIM ? '#ff6b5e' : zone.good ? '#5bff85' : undefined,
      helpKey: 'hand_position',
    },
    {
      kind: 'options',
      id: 'position',
      label: 'POSITION',
      valueLabel: zone.label,
      options: HAND_POSITIONS.map((p) => ({ id: p.label, label: p.label })),
      selectedId: zone.label,
      onSelect: (id) => {
        const p = HAND_POSITIONS.find((x) => x.label === id);
        if (p) setPos(p.pos);
      },
      sticky: true, // A/B the grips while all three panels react — the lesson
      helpKey: 'hand_position',
    },
  ];

  return (
    <RackUnit
      initialParam="grip"
      params={params}
      onHelp={help}
      stage={{
        size: 'L', // three synchronized panels — earns the tall glass
        badge: 'THREE SYNCHRONIZED PANELS — mic & hand · polar pattern (ghost = intended cardioid) · frequency response. ILLUSTRATIVE MODEL',
        onGuide: () => help('hand_position'),
        bezel: [
          {
            k: 'GRIP',
            v: zone.label,
            tint: pos >= ZONE_P_RIM ? '#ff6b5e' : zone.good ? '#5bff85' : undefined,
            helpKey: 'hand_position',
          },
          {
            k: 'PATTERN',
            v: pos < ZONE_P_RIM ? 'INTACT' : pos < ZONE_P_FULL ? 'DEGRADING' : 'COLLAPSED',
            tint: pos < ZONE_P_RIM ? '#5bff85' : pos < ZONE_P_FULL ? '#ffd76b' : '#ff6b5e',
            helpKey: 'cupping_why',
          },
        ],
        render: (w, h) => (
          <View style={{ width: w, height: h, justifyContent: 'center' }}>
            <View {...pan.panHandlers}>
              {viz ? <viz.HandPlacementView width={w} pos01={pos} /> : <VizUnavailableCard />}
            </View>
          </View>
        ),
      }}
    >
      {wellTop}
      <Text style={[styles.readout, !zone.good && pos >= ZONE_P_RIM ? styles.readoutBad : null]}>{zone.title}</Text>
      <CollapsibleSection title="WHAT'S HAPPENING" onHelp={() => help('hand_position')}>
        <Text style={styles.caption}>{zone.note}</Text>
      </CollapsibleSection>
      <View style={styles.chipRow}>
        <LabChip label={why ? 'HIDE — WHY IT HAPPENS ▴' : 'WHY IT HAPPENS ▾'} selected={why} onPress={() => setWhy((v) => !v)} onLongPress={() => help('cupping_why')} />
      </View>
      {/* "Blocked" starts exactly where the hand reaches the rim — the same
          onset cupMorph() now uses, so the picture and the physics agree. */}
      <View onLayout={(e) => setWellW(Math.round(e.nativeEvent.layout.width))}>
        {why && wellW > 0 ? <WhyCutaway viz={viz} width={wellW} blocked={pos >= ZONE_P_RIM} help={help} /> : null}
      </View>
      <CheckQuestion spec={CUP_CHECK} />
      {wellBottom}
    </RackUnit>
  );
}

function WhyCutaway({ viz, width, blocked, help }: { viz: MsVizModule | null; width: number; blocked: boolean; help: (k?: string) => void }) {
  return (
    <View style={{ gap: 8 }}>
      {viz ? <CutawayViz viz={viz} width={width} blocked={blocked} /> : <VizUnavailableCard />}
      <IllustrationBadge text="CUTAWAY — diaphragm · front entry (top) · rear ports (sides). Green dots = sound reaching each entry" />
      <Pressable onLongPress={() => help('cupping_why')} delayLongPress={300}>
        <Text style={styles.caption}>
          A cardioid is a PRESSURE-GRADIENT design: sound reaches the diaphragm from the front AND
          — through the rear ports — from behind, timed so rear sound cancels itself. Cover the
          ports and only the front path remains: a pressure (omni) mic with none of the intended
          rejection, plus a resonant cavity (your hand) stuck on the front.
        </Text>
      </Pressable>
    </View>
  );
}
function CutawayViz({ viz, width, blocked }: { viz: MsVizModule; width: number; blocked: boolean }) {
  const focused = useIsFocused();
  const phase = viz.usePhaseClock(focused, 0.6);
  return <viz.MicCutawayView phase={phase} width={width} blocked={blocked} />;
}

// ── 9 · Common handheld mistakes — swipeable gallery. PURE READING (no
//    operable controls), so a plain scroll; the horizontal snap carousel is
//    reading and scrolls inside the vertical flow, exactly as before. ────────

function MistakesSection({ viz, help, wellTop, wellBottom }: SectionProps) {
  const [width, setWidth] = useState(0);
  const cardW = Math.max(200, width - 44);
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {wellTop}
      {/* panelCard consumes 24 padding + 2 border → content box is −26. */}
      <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
        {width > 0 ? (
          <View style={styles.panelCard}>
            <DisplayGuideButton onPress={() => help('mistakes')} />
            <ScrollView horizontal pagingEnabled={false} snapToInterval={cardW + 10} decelerationRate="fast" showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {MISTAKES.map((mk) => (
                  <Pressable key={mk.kind} style={[styles.mistakeCard, { width: cardW }]} onLongPress={() => help('mistakes')} delayLongPress={300}>
                    {viz ? <viz.MistakeIllustration width={cardW - 20} kind={mk.kind} /> : <VizUnavailableCard />}
                    <Text style={styles.mistakeTitle}>{mk.title}</Text>
                    <Text style={styles.caption}>{mk.note}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <CollapsibleSection title="WHAT'S HAPPENING" onHelp={() => help('mistakes')}>
              <Text style={styles.caption}>
                Swipe through — these habits apply immediately in live sound, presentations, theater,
                houses of worship, and broadcast.
              </Text>
            </CollapsibleSection>
          </View>
        ) : null}
      </View>
      {wellBottom}
    </ScrollView>
  );
}

// ── The sectioned shell ─────────────────────────────────────────────────────

const SECTIONS: { key: string; label: string; title: string; blurb: string; Comp: (p: SectionProps) => React.JSX.Element }[] = [
  { key: 'capsule', label: 'CAPSULE', title: 'INSIDE THE CAPSULE', blurb: 'Before the patterns: how a dynamic mic turns sound into voltage — a coil moving in a magnetic gap.', Comp: CapsuleSection },
  { key: 'polar', label: 'POLAR', title: 'PICKUP PATTERNS', blurb: 'A microphone doesn’t hear equally in every direction — the pattern is its map of sensitivity.', Comp: PolarSection },
  { key: 'distance', label: 'DISTANCE', title: 'DISTANCE & THE ROOM', blurb: 'Move in and the direct sound wins; back off and the room takes over.', Comp: DistanceSection },
  { key: 'proximity', label: 'PROXIMITY', title: 'PROXIMITY EFFECT', blurb: 'Directional mics get bassier as you move in — a tool AND a trap.', Comp: ProximitySection },
  { key: 'offaxis', label: 'OFF-AXIS', title: 'OFF-AXIS RESPONSE', blurb: 'Turn the mic away and the sound gets quieter — and duller.', Comp: OffAxisSection },
  { key: 'pop', label: 'PLOSIVES', title: 'PLOSIVES & WIND', blurb: '“P” and “B” fire moving air at the diaphragm. Barriers stop the wind, not the voice.', Comp: PopSection },
  { key: 'shock', label: 'HANDLING', title: 'HANDLING NOISE & ISOLATION', blurb: 'Vibration travels through solids into the capsule — decouple it.', Comp: ShockSection },
  { key: 'stereo', label: 'STEREO', title: 'STEREO TECHNIQUES', blurb: 'XY · ORTF · AB · Mid-Side — level differences, time differences, or both.', Comp: StereoSection },
  { key: 'hand', label: 'HAND GRIP', title: 'HOW YOUR HAND CHANGES THE MIC', blurb: 'Everyone has seen a singer cup the mic. Here is exactly what that does.', Comp: HandSection },
  { key: 'mistakes', label: 'MISTAKES', title: 'COMMON HANDHELD MISTAKES', blurb: 'A field guide — what to do, and the six habits to unlearn.', Comp: MistakesSection },
];

export function MicPrinciplesLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const focused = useIsFocused();
  const [sectionIdx, setSectionIdx] = useState(0);
  const viz = useState(() => requireMsViz())[0];

  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const help = (k?: string) => {
    setLessonKey(k);
    setLessonOpen(true);
  };

  // R6c: mark each section viewed → the Microphone Principles lab completes once
  // all sections have been seen.
  useEffect(() => {
    registerLabUnits('af_mic_principles', SECTIONS.map((x) => x.key));
  }, []);
  useEffect(() => {
    markLabUnit('af_mic_principles', SECTIONS[sectionIdx].key);
  }, [sectionIdx]);

  const s = SECTIONS[sectionIdx];
  // Shared well header/footer every section places in its scroll region: the
  // topic nav is READING/navigation, so it lives in the well by design.
  const wellTop = (
    <View style={{ gap: 12 }}>
      {!skiaAvailable ? <VizUnavailableCard /> : null}
      <View style={styles.chipRow}>
        {SECTIONS.map((sec, i) => (
          <LabChip key={sec.key} label={sec.label} selected={sectionIdx === i} onPress={() => setSectionIdx(i)} />
        ))}
      </View>
      <Text style={styles.sectionTitle}>{s.title}</Text>
      <Text style={styles.body}>{s.blurb}</Text>
    </View>
  );
  // Guided-lesson entry lives at the BOTTOM (owner 2026-07-29, LabShell v2).
  const wellBottom = (
    <Pressable
      style={styles.lessonRow}
      onPress={() => help(undefined)}
      accessibilityRole="button"
      accessibilityLabel="Open the guided lesson"
    >
      <Text style={styles.lessonRowText}>ⓘ GUIDED LESSON — every control long-presses for its own entry</Text>
    </Pressable>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>MICROPHONE PRINCIPLES</Text>
          <Text style={styles.subtitle}>How microphones capture sound</Text>
        </View>
        <AccuracyNote compact />
      </View>
      {/* The RackUnit (or reading scroll) owns everything below the header —
          it needs the full flex:1 vertical space. Keyed remount per section:
          each section declares its own rack, exactly as it owned its own
          panel before. */}
      <View style={{ flex: 1 }}>
        <s.Comp key={s.key} viz={viz} focused={focused} help={help} wellTop={wellTop} wellBottom={wellBottom} />
      </View>
      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('mic')}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  // Plain-scroll sections (CAPSULE · MISTAKES — reading only) keep the old
  // page rhythm; rack wells carry their own padding.
  scroll: { padding: 16, paddingBottom: 30, gap: 12 },
  sectionTitle: { fontFamily: fonts.oswaldMedium, fontSize: 20, letterSpacing: 0.6, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  panelCard: { gap: 10, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1, lineHeight: 13, color: colors.textSub },
  readout: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.5, color: colors.amber },
  readoutBad: { color: '#ff6b5e' },
  meterLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.1, color: colors.textSecondary },
  meterTrack: { height: 9, borderRadius: 5, backgroundColor: '#1c1c22', overflow: 'hidden' },
  meterFill: { height: 9 },
  mistakeCard: { gap: 6, borderRadius: 9, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#0f0f13', padding: 10 },
  mistakeTitle: { fontFamily: fonts.oswaldMedium, fontSize: 14.5, letterSpacing: 0.4, color: colors.textPrimary },
  // Bottom guided-lesson row — mirrors LabShell v2's lessonRow styling.
  lessonRow: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  lessonRowText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.9, color: colors.textSecondary },
});
