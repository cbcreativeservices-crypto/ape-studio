/**
 * MicPrinciplesLabScreen — "Microphone Principles" (owner 2026-07-29).
 * Single mission: HOW MICROPHONES CAPTURE SOUND.
 *
 * VISUAL-FIRST LAUNCH (owner decision): every concept is taught through
 * manipulable drawings — no audio playback; the screen states plainly that
 * audio demonstrations are coming in a future release (§1.7: say what is and
 * isn't real). Every curve is an ILLUSTRATIVE MODEL and badged as such.
 *
 * SHAPE: a sectioned lab — a topic chip-row selects ONE active section
 * (Polar · Distance · Proximity · Off-axis · Plosives · Handling · Stereo ·
 * Hand Grip · Mistakes); each renders its interactive + explanation, with
 * answer→reveal checks at the highest-value beats (proximity, cupping).
 *
 * VISUALS: Skia via micspeaker/skiaGate (pre-Skia clients get the honest
 * card; text still teaches). Help: every control long-presses into the
 * two-tier guided-lesson popup ('mic' lesson).
 */
import { useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { LabChip } from '../LabShell';
import { GuidedLessonSheet, getLabLesson, DisplayGuideButton } from '../../../features/lab/guidedLessons';
import { CheckQuestion, DragSlider, VizUnavailableCard, type CheckSpec } from '../foundations/bits';
import { requireMsViz, skiaAvailable, type MsVizModule } from './skiaGate';

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
// the mic. It is now the HEAD icon, draggable ANYWHERE on the canvas, and the
// only restriction is that its silhouette may not INTERSECT the mic's — it may
// come right up next to it. Solved here (not in viz.tsx) because this screen
// must also run on pre-Skia clients, which never load viz.tsx; the numbers
// mirror viz.tsx's POLAR_MIC_* / HEAD_COLLIDERS exactly.
const POLAR_H = 230; // PolarPatternView's default canvas height
const POLAR_GR = 8; // grille radius
const POLAR_LEN = 37; // body length
const POLAR_MIC_DY = -6; // grille centre offset from the canvas centre
/** headScaleForMic(): a 23 cm head against the 16 cm mic actually drawn. */
const POLAR_HEAD_S = ((1.72 * POLAR_GR + POLAR_LEN) * (23 / 16)) / 45.6;
/** The head silhouette as three circles in head units, head frame
 *  (origin = the mouth, +x = the facing direction). */
const HEAD_CIRCLES: [number, number, number][] = [
  [-14, -20, 20],
  [-4, -10, 13],
  [4, -2, 10],
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
 * Collision FLOOR (not a keep-out radius): push the head out along the
 * mic→head axis just far enough that no part of its silhouette overlaps the
 * mic. Touching is allowed; intersecting is not.
 */
function clampPolarSource(x: number, y: number, w: number): { x: number; y: number } {
  const cx = w / 2;
  const cy = POLAR_H / 2;
  const my = cy + POLAR_MIC_DY + (POLAR_GR * 0.72 + POLAR_LEN) / 2 - POLAR_GR / 2;
  let px = Math.max(2, Math.min(w - 2, x));
  let py = Math.max(2, Math.min(POLAR_H - 2, y));
  for (let iter = 0; iter < 4; iter++) {
    const face = Math.atan2(cy + POLAR_MIC_DY - py, cx - px); // head faces the mic
    const cs = Math.cos(face);
    const sn = Math.sin(face);
    let worst = 0;
    for (const [u, v, r] of HEAD_CIRCLES) {
      const wx = px + (u * cs - v * sn) * POLAR_HEAD_S;
      const wy = py + (u * sn + v * cs) * POLAR_HEAD_S;
      worst = Math.max(worst, r * POLAR_HEAD_S - micSdf(wx, wy, cx, cy));
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

const PROX_DISTANCES: { label: string; inches: number; boostDb: number }[] = [
  { label: '12 in', inches: 12, boostDb: 1 },
  { label: '6 in', inches: 6, boostDb: 3 },
  { label: '3 in', inches: 3, boostDb: 6 },
  { label: '1 in', inches: 1, boostDb: 10 },
];

const OFF_ANGLES = [0, 30, 60, 90, 180];

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

const STEREO_TECHS: { key: 'xy' | 'ortf' | 'ab' | 'ms'; label: string; note: string }[] = [
  { key: 'xy', label: 'XY', note: 'Two cardioids COINCIDENT at ~90°. Stereo comes from level differences only — perfectly mono-compatible, modest width.' },
  { key: 'ortf', label: 'ORTF', note: 'Two cardioids 17 cm apart at 110°. Level AND small time differences — wider, natural image; good mono behavior.' },
  { key: 'ab', label: 'AB', note: 'Two spaced omnis facing forward. Stereo from time differences — big, open image; watch mono fold-down.' },
  { key: 'ms', label: 'MID-SIDE', note: 'Cardioid forward + figure-8 sideways at one point. Width is a MIX decision after the fact — fully mono-safe.' },
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

function FutureAudioNote() {
  return (
    <Text style={styles.futureNote}>
      🔈 Audio demonstrations — coming in a future release. This lab teaches visually first.
    </Text>
  );
}

/** A thin labeled meter bar (RN — works on every client). */
function MeterBar({ label, frac, color }: { label: string; frac: number; color: string }) {
  return (
    <View style={{ gap: 3 }}>
      <Text style={styles.meterLabel}>{label}</Text>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${Math.max(2, Math.min(100, frac * 100))}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

type SectionProps = { viz: MsVizModule | null; width: number; focused: boolean; help: (k: string) => void };

// ── 1 · Polar patterns ──────────────────────────────────────────────────────

function PolarSection({ viz, width, focused, help }: SectionProps) {
  const [patIdx, setPatIdx] = useState(1);
  // The source is now a FREE position in canvas px, not an angle on a fixed
  // radius. It starts at the old 35° / near-edge spot so the scene opens the
  // same way, then may be dragged anywhere (collision-clamped off the mic).
  const [src, setSrc] = useState(() => {
    const R = Math.min(width, POLAR_H) / 2 - 16;
    const th = (35 * Math.PI) / 180;
    return clampPolarSource(width / 2 + R * Math.sin(th), POLAR_H / 2 - R * Math.cos(th), width);
  });
  const widthRef = useRef(width);
  widthRef.current = width;
  const pat = PATTERNS[patIdx];
  // Polar math UNCHANGED: θ is still measured from the mic's front axis (up).
  const angle = Math.round(
    (Math.atan2(src.x - width / 2, -(src.y - (POLAR_H / 2 + POLAR_MIC_DY))) * 180) / Math.PI,
  );
  const g = gainAt(pat.a, pat.b, angle);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, gs) => Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4,
      onPanResponderMove: (e) => {
        // Free positioning: the head goes wherever the finger is; the ONLY
        // limit is the collision floor against the mic's silhouette.
        setSrc(
          clampPolarSource(e.nativeEvent.locationX, e.nativeEvent.locationY, widthRef.current),
        );
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View style={styles.panelCard}>
      <View {...pan.panHandlers}>
        {viz ? <PolarViz viz={viz} width={width} a={pat.a} b={pat.b} src={src} running={focused} /> : <VizUnavailableCard />}
      </View>
      <IllustrationBadge text="CONCEPTUAL PICKUP FIELD — ILLUSTRATIVE MODEL, NOT A MEASURED POLAR RESPONSE · color = r(θ) = |A + B·cosθ| × 1/d falloff · drag the head anywhere — it can come right up next to the mic, but never through it" />
      <DisplayGuideButton onPress={() => help('polar_pattern')} />
      <View style={styles.chipRow}>
        {PATTERNS.map((p, i) => (
          <LabChip key={p.key} label={p.label} selected={patIdx === i} onPress={() => setPatIdx(i)} onLongPress={() => help('polar_pattern')} />
        ))}
      </View>
      <Text style={styles.readout}>
        Source at {((angle % 360) + 360) % 360}° · pickup{' '}
        {g < 0.05 ? 'NULL (−30 dB or more down)' : `${(20 * Math.log10(g)).toFixed(1)} dB`}
      </Text>
      <Text style={styles.caption}>
        The pattern is the mic’s sensitivity by direction. Cardioid rejects the rear (monitor
        wedges live there). Figure-8 has two lobes and two deep side nulls. Omni hears everything —
        no proximity effect, no null to aim.
      </Text>
    </View>
  );
}
function PolarViz({
  viz,
  width,
  a,
  b,
  src,
  running,
}: {
  viz: MsVizModule;
  width: number;
  a: number;
  b: number;
  src: { x: number; y: number };
  running: boolean;
}) {
  const phase = viz.usePhaseClock(running, 0.7);
  return <viz.PolarPatternView phase={phase} width={width} a={a} b={b} srcX={src.x} srcY={src.y} />;
}

// ── 2 · Distance ────────────────────────────────────────────────────────────

function DistanceSection({ viz, width, focused, help }: SectionProps) {
  const [d01, setD01] = useState(0.3);
  const inches = Math.round(4 + d01 * 44);
  const relDb = -20 * Math.log10(inches / 4);
  const direct = Math.min(1, 6 / inches);
  const room = 0.32;
  return (
    <View style={styles.panelCard}>
      {viz ? <DistanceViz viz={viz} width={width} d01={d01} running={focused} /> : <VizUnavailableCard />}
      <IllustrationBadge text="CONCEPTUAL SOUND FIELD — ILLUSTRATIVE MODEL, NOT A MEASUREMENT · direct energy fading into the room glow; wavefronts slowed for visibility" />
      <DisplayGuideButton onPress={() => help('distance')} />
      <DragSlider
        value={d01}
        onChange={setD01}
        label="MIC DISTANCE"
        readout={`${inches} in · ${relDb.toFixed(1)} dB rel 4 in`}
        onHelp={() => help('distance')}
      />
      <MeterBar label="DIRECT SOUND (falls with distance)" frac={direct} color="#5bff85" />
      <MeterBar label="ROOM SOUND (stays roughly constant)" frac={room} color="#6fa8ff" />
      <Text style={styles.caption}>
        Halving the distance gains ~6 dB of DIRECT sound while the room stays put — that ratio is
        what “close” sounds like. Typical speech working distance: about 4–12 inches. Beyond that,
        the room starts winning.
      </Text>
    </View>
  );
}
function DistanceViz({ viz, width, d01, running }: { viz: MsVizModule; width: number; d01: number; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.55);
  return <viz.DistanceView phase={phase} width={width} dist01={d01} />;
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
  wrongHint: 'Flip the pattern toggle and watch the curve — which pattern refuses to change?',
};

function ProximitySection({ viz, width, focused, help }: SectionProps) {
  const [distIdx, setDistIdx] = useState(0);
  const [directional, setDirectional] = useState(true);
  const d = PROX_DISTANCES[distIdx];
  return (
    <View style={styles.panelCard}>
      {/* The approach: watch the mic physically close in on the singer. */}
      {viz ? (
        <ProxApproachViz viz={viz} width={width} inches={d.inches} boostDb={d.boostDb} directional={directional} running={focused} />
      ) : (
        <VizUnavailableCard />
      )}
      {viz ? (
        <viz.ResponseCurveView width={width} dbAt={(f) => (directional ? viz.proximityDb(f, d.boostDb) : 0)} />
      ) : null}
      <IllustrationBadge text="ILLUSTRATIVE — conceptual approach scene + a simplified low-shelf response; real mics vary by design" />
      <DisplayGuideButton onPress={() => help('proximity')} />
      <View style={styles.chipRow}>
        {PROX_DISTANCES.map((p, i) => (
          <LabChip key={p.label} label={p.label} selected={distIdx === i} onPress={() => setDistIdx(i)} onLongPress={() => help('proximity')} />
        ))}
      </View>
      <View style={styles.chipRow}>
        <LabChip label="CARDIOID" selected={directional} onPress={() => setDirectional(true)} onLongPress={() => help('proximity')} />
        <LabChip label="OMNI" selected={!directional} onPress={() => setDirectional(false)} onLongPress={() => help('proximity')} />
      </View>
      <Text style={styles.readout}>
        {directional ? `≈ +${d.boostDb} dB low-shelf at ${d.label}` : 'OMNI — flat at every distance (no proximity effect)'}
      </Text>
      <Text style={styles.caption}>
        Radio-voice warmth IS this effect, used on purpose. It is also why a singer who swallows
        the mic turns muddy — and why the high-pass filter exists on every channel strip.
      </Text>
      <CheckQuestion spec={PROX_CHECK} />
    </View>
  );
}
function ProxApproachViz({
  viz,
  width,
  inches,
  boostDb,
  directional,
  running,
}: {
  viz: MsVizModule;
  width: number;
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
      inches={inches}
      boostDb={boostDb}
      directional={directional}
    />
  );
}

// ── 4 · Off-axis response ───────────────────────────────────────────────────

function OffAxisSection({ viz, width, help }: SectionProps) {
  const [angle, setAngle] = useState(0);
  return (
    <View style={styles.panelCard}>
      {viz ? <viz.OffAxisMicView width={width} angleDeg={angle} /> : <VizUnavailableCard />}
      {viz ? <viz.ResponseCurveView width={width} dbAt={(f) => viz.offAxisDb(f, angle)} floorDb={-26} ceilDb={6} /> : null}
      <IllustrationBadge text="ILLUSTRATIVE — broadband polar loss + growing high-frequency rolloff off-axis" />
      <DisplayGuideButton onPress={() => help('off_axis')} />
      <View style={styles.chipRow}>
        {OFF_ANGLES.map((a) => (
          <LabChip key={a} label={`${a}°`} selected={angle === a} onPress={() => setAngle(a)} onLongPress={() => help('off_axis')} />
        ))}
      </View>
      <Text style={styles.caption}>
        Off-axis sound isn’t just QUIETER — it’s DULLER: the highs fall off faster than the lows.
        That’s why a singer drifting off-mic changes tone before they change level, and why good
        off-axis behavior is a mark of a great microphone.
      </Text>
    </View>
  );
}

// ── 5 · Plosives & wind ─────────────────────────────────────────────────────

function PopSection({ viz, width, focused, help }: SectionProps) {
  const [modeIdx, setModeIdx] = useState(0);
  const m = POP_MODES[modeIdx];
  return (
    <View style={styles.panelCard}>
      {viz ? <PopViz viz={viz} width={width} mode={m.key} running={focused} /> : <VizUnavailableCard />}
      <IllustrationBadge text="CONCEPTUAL — blue = the air blast (wind), amber = the voice; the voice always passes" />
      <DisplayGuideButton onPress={() => help('pop_filter')} />
      <View style={styles.chipRow}>
        {POP_MODES.map((p, i) => (
          <LabChip key={p.key} label={p.label} selected={modeIdx === i} onPress={() => setModeIdx(i)} onLongPress={() => help('pop_filter')} />
        ))}
      </View>
      <MeterBar label="PLOSIVE ENERGY REACHING THE CAPSULE" frac={m.pass} color={m.pass > 0.6 ? '#ff6b5e' : m.pass > 0.35 ? '#ffd76b' : '#5bff85'} />
      <Text style={styles.caption}>{m.note}</Text>
      <Text style={styles.caption}>
        “P” and “B” fire a jet of air, not just sound. The fix is always the same idea: break up
        the MOVING AIR before it hits the diaphragm while letting the sound wave through.
      </Text>
    </View>
  );
}
function PopViz({ viz, width, mode, running }: { viz: MsVizModule; width: number; mode: 'none' | 'pop' | 'foam' | 'blimp'; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.5);
  return <viz.PopFilterView phase={phase} width={width} mode={mode} />;
}

// ── 6 · Handling noise & isolation ──────────────────────────────────────────

function ShockSection({ viz, width, focused, help }: SectionProps) {
  const [shock, setShock] = useState(false);
  return (
    <View style={styles.panelCard}>
      {viz ? <ShockViz viz={viz} width={width} shock={shock} running={focused} /> : <VizUnavailableCard />}
      <IllustrationBadge text="CONCEPTUAL — the STAND is being shaken (red readout, bottom). The readout above the capsule shows how much of that shake actually arrives at the mic; with a shock mount you can watch the elastic bands take up the difference." />
      <DisplayGuideButton onPress={() => help('shock_mount')} />
      <View style={styles.chipRow}>
        <LabChip label="RIGID MOUNT" selected={!shock} onPress={() => setShock(false)} onLongPress={() => help('shock_mount')} />
        <LabChip label="SHOCK MOUNT" selected={shock} onPress={() => setShock(true)} onLongPress={() => help('shock_mount')} />
      </View>
      <MeterBar label="VIBRATION TRANSMITTED INTO THE MIC" frac={shock ? 0.15 : 0.9} color={shock ? '#5bff85' : '#ff6b5e'} />
      <Text style={styles.caption}>
        Footsteps, cable tugs and stand knocks travel THROUGH solids into the capsule as
        low-frequency thumps. A shock mount is a soft spring between stand and mic — the vibration
        stays in the stand. (The high-pass filter is the electrical version of the same idea.)
      </Text>
    </View>
  );
}
function ShockViz({ viz, width, shock, running }: { viz: MsVizModule; width: number; shock: boolean; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.8);
  return <viz.ShockMountView phase={phase} width={width} shockMount={shock} />;
}

// ── 7 · Stereo techniques ───────────────────────────────────────────────────

function StereoSection({ viz, width, help }: SectionProps) {
  const [techIdx, setTechIdx] = useState(0);
  const t = STEREO_TECHS[techIdx];
  return (
    <View style={styles.panelCard}>
      {viz ? <viz.StereoTechniqueView width={width} tech={t.key} /> : <VizUnavailableCard />}
      <IllustrationBadge text="CONCEPTUAL PICKUP FIELD — ILLUSTRATIVE MODEL, NOT A MEASUREMENT · the two capsules' |A + B·cosθ| gains × 1/d, summed for this technique's geometry · the lit deck at the top is the stage" />
      <DisplayGuideButton onPress={() => help('stereo_pair')} />
      <View style={styles.chipRow}>
        {STEREO_TECHS.map((s, i) => (
          <LabChip key={s.key} label={s.label} selected={techIdx === i} onPress={() => setTechIdx(i)} onLongPress={() => help('stereo_pair')} />
        ))}
      </View>
      <Text style={styles.caption}>{t.note}</Text>
      <Text style={styles.caption}>
        Two mics make stereo from LEVEL differences, TIME differences, or both — every named
        technique is just a different trade between width, focus, and mono compatibility.
      </Text>
    </View>
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
  wrongHint: 'Watch the polar panel as you slide to FULL CUP — what happened to the rear of the pattern?',
};

function HandSection({ viz, width, help }: SectionProps) {
  // Starts in the CORRECT zone by construction (ZONE_P_CORRECT ≤ 0.35 < ZONE_P_RIM).
  const [pos, setPos] = useState(ZONE_P_DEFAULT);
  const [why, setWhy] = useState(false);
  const zone = zoneAt(pos);

  const pan = useRef(
    PanResponder.create({
      // Claim on TOUCH START: this vertical drag would otherwise race the
      // vertical ScrollView on Android (reviewer finding). The canvas is a
      // dedicated interactive area — scrolling starts from anywhere else, and
      // the position chips remain the tap alternative.
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, gs) => Math.abs(gs.dy) > 2,
      onPanResponderGrant: (e) => {
        const v = Math.max(0, Math.min(1, 1 - (e.nativeEvent.locationY - 16) / 184));
        setPos(v);
      },
      onPanResponderMove: (e) => {
        // Drag the hand along the mic body: top of the canvas = full cup.
        const v = Math.max(0, Math.min(1, 1 - (e.nativeEvent.locationY - 16) / 184));
        setPos(v);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View style={styles.panelCard}>
      <View {...pan.panHandlers}>{viz ? <viz.HandPlacementView width={width} pos01={pos} /> : <VizUnavailableCard />}</View>
      <IllustrationBadge text="THREE SYNCHRONIZED PANELS — mic & hand · polar pattern (ghost = intended cardioid) · frequency response. ILLUSTRATIVE MODEL" />
      <DisplayGuideButton onPress={() => help('hand_position')} />
      <View style={styles.chipRow}>
        {HAND_POSITIONS.map((p) => (
          <LabChip key={p.label} label={p.label} selected={zone.label === p.label} onPress={() => setPos(p.pos)} onLongPress={() => help('hand_position')} />
        ))}
      </View>
      <Text style={[styles.readout, !zone.good && pos >= ZONE_P_RIM ? styles.readoutBad : null]}>{zone.title}</Text>
      <Text style={styles.caption}>{zone.note}</Text>
      <View style={styles.chipRow}>
        <LabChip label={why ? 'HIDE — WHY IT HAPPENS ▴' : 'WHY IT HAPPENS ▾'} selected={why} onPress={() => setWhy((v) => !v)} onLongPress={() => help('cupping_why')} />
      </View>
      {/* "Blocked" starts exactly where the hand reaches the rim — the same
          onset cupMorph() now uses, so the picture and the physics agree. */}
      {why ? <WhyCutaway viz={viz} width={width} blocked={pos >= ZONE_P_RIM} help={help} /> : null}
      <CheckQuestion spec={CUP_CHECK} />
    </View>
  );
}

function WhyCutaway({ viz, width, blocked, help }: { viz: MsVizModule | null; width: number; blocked: boolean; help: (k: string) => void }) {
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

// ── 9 · Common handheld mistakes — swipeable gallery ────────────────────────

function MistakesSection({ viz, width, help }: SectionProps) {
  const cardW = Math.max(200, width - 44);
  return (
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
      <Text style={styles.caption}>
        Swipe through — these habits apply immediately in live sound, presentations, theater,
        houses of worship, and broadcast.
      </Text>
    </View>
  );
}

// ── The sectioned shell ─────────────────────────────────────────────────────

const SECTIONS: { key: string; label: string; title: string; blurb: string; Comp: (p: SectionProps) => React.JSX.Element }[] = [
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
  const [width, setWidth] = useState(0);
  const viz = useState(() => requireMsViz())[0];

  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const help = (k?: string) => {
    setLessonKey(k);
    setLessonOpen(true);
  };

  const s = SECTIONS[sectionIdx];
  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>MICROPHONE PRINCIPLES</Text>
          <Text style={styles.subtitle}>How microphones capture sound</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FutureAudioNote />
        {!skiaAvailable ? <VizUnavailableCard /> : null}
        <View style={styles.chipRow}>
          <LabChip label="ⓘ GUIDED LESSON" selected={lessonOpen} onPress={() => help(undefined)} />
          {SECTIONS.map((sec, i) => (
            <LabChip key={sec.key} label={sec.label} selected={sectionIdx === i} onPress={() => setSectionIdx(i)} />
          ))}
        </View>
        <Text style={styles.sectionTitle}>{s.title}</Text>
        <Text style={styles.body}>{s.blurb}</Text>
        {/* panelCard consumes 24 padding + 2 border → content box is −26. */}
        <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
          {width > 0 ? <s.Comp viz={viz} width={width} focused={focused} help={help} /> : null}
        </View>
      </ScrollView>
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
  scroll: { padding: 16, paddingBottom: 30, gap: 12 },
  sectionTitle: { fontFamily: fonts.oswaldMedium, fontSize: 20, letterSpacing: 0.6, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  panelCard: { gap: 10, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1, lineHeight: 13, color: colors.textSub },
  readout: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.5, color: colors.amber },
  readoutBad: { color: '#ff6b5e' },
  futureNote: {
    fontFamily: fonts.barlowMedium,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textSub,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#101014',
    padding: 10,
  },
  meterLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.1, color: colors.textSecondary },
  meterTrack: { height: 9, borderRadius: 5, backgroundColor: '#1c1c22', overflow: 'hidden' },
  meterFill: { height: 9 },
  mistakeCard: { gap: 6, borderRadius: 9, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#0f0f13', padding: 10 },
  mistakeTitle: { fontFamily: fonts.oswaldMedium, fontSize: 14.5, letterSpacing: 0.4, color: colors.textPrimary },
});
