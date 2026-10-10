/**
 * CameraAnalogy — EQ Lab lesson 4 (owner spec 2026-08-07): the owner's
 * classroom analogy, preserved as a distinctive interactive lesson.
 *
 *   FIXED EQ            = camera on a tripod; you may LOOK around, but the EQ
 *                         cannot follow — the bell stays put.
 *   SEMI-PARAMETRIC EQ  = camera pans AND the EQ follows (frequency moves);
 *                         width fixed.
 *   FULLY PARAMETRIC EQ = camera pans and ZOOMS (frequency + Q).
 *
 *   MOVE THE CAMERA = FREQUENCY · ZOOM THE CAMERA = Q / BANDWIDTH
 *
 * RULING: the analogy STOPS there — gain is NOT mapped (next lesson). The room
 * scene and the response graph share ONE log-frequency axis (fxViz's 320-unit
 * geometry, padL/padR 8, both scaled by the same width ÷ 320 — legibility pass
 * 2026-09-26), so the camera's field of view sits pixel-aligned above the bell
 * it points at. The pair is one ExpandableFigure: FULL SCREEN enlarges both.
 * PAN is active from stage 1 onward (`panActive`); the stage-0 row is
 * deliberately locked. (Corrected 2026-08-28 — this comment used
 * to claim pan worked in EVERY mode, which the code has never done.)
 *
 * RACK (2026-10-10, owner rule: every lab control lives in the bottom dock):
 * the two pixel-aligned panels are the rack's display, held to their own
 * shape and centred in the L glass; EQ TYPE / PAN / ZOOM are dock keys, and
 * the FIXED stage shows PAN and ZOOM as LOCKED keys with their reason (the
 * rack's `locked` fader) instead of a lane that refuses to move.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect } from 'react-native-svg';
import { FigureStandingFrontSvg } from '../../../../features/lab/figureBodySvg';
import { ResponseCurveGraph, eqResponseDb, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, type CheckSpec } from '../../foundations/bits';
import { RackUnit } from '../../rack/RackUnit';
import type { DockParam } from '../../rack/rackTypes';
import { colors, fonts } from '../../../../theme/tokens';
import { bwOctFromQ, fFromNorm, fmtHz, gainColor, normFromF, qFromBwOct } from './eqMath';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import type { EqModuleComponentProps } from './registry';

// ---- Shared axis (mirrors fxViz's logX: W=320, padL=padR=8) ----------------
const W = 320;
const PAD = 8;
const PLOT_W = W - 2 * PAD;
const PX_PER_OCT = PLOT_W / 10;
const xForF = (f: number) => PAD + ((Math.log10(f) - Math.log10(20)) / 3) * PLOT_W;

// ---- Scene geometry (compressed 2026-08-07: shorter scene lifts the sliders
// higher on the phone screen) --------------------------------------------------
const SCENE_H = 168;
/** Response graph under the scene: plot height at 1× (its 14 px label strip is
 *  added by the graph). */
const GRAPH_H = 116;
/** The two-panel figure's shape at 320 units wide: scene + graph + label strip.
 *  Both panels scale uniformly with the width, so the shape holds at any size. */
const FIG_ASPECT = W / (SCENE_H + GRAPH_H + 14);
const FLOOR_Y = 116;
const FOV_TOP = 42;
const CAM_APEX: [number, number] = [160, 148];

// ---- Analogy ↔︎ EQ mapping ---------------------------------------------------
const bwFromZoom = (z: number) => 4 - 3.75 * z; // wide 4 oct … tight 0.25 oct
const ANALOGY_GAIN_DB = 9; // fixed — gain is NOT part of the analogy (ruling)
/** The frequency a FIXED EQ is bolted to. 2 kHz lands at x≈211 on the shared
 *  log axis — right on the LAMP, so the locked camera stares at exactly one
 *  object (owner 2026-08-07: not the person, not the speaker beside it). */
const FIXED_FREQ = 2000;
/** Stages 0–1: the lens that cannot zoom. ≈0.89 octaves ⇒ a ±13.5 px view that
 *  covers the lamp alone (person ends at x≈172, the monitor starts at x≈268). */
const LOCKED_ZOOM = 0.83;

type Stage = 0 | 1 | 2;
const STAGE_META: { label: string; camera: string; eq: string }[] = [
  {
    label: 'FIXED',
    camera: 'The camera is bolted to its tripod, staring at one object — the lamp. It cannot move.',
    eq: 'A FIXED EQ works at ONE frequency (2 kHz here) — you can’t choose where it operates.',
  },
  {
    label: 'SEMI-PARAMETRIC',
    camera: 'Now the camera pans AND the EQ follows it around the room.',
    eq: 'The EQ frequency moves across the spectrum; the width stays fixed.',
  },
  {
    label: 'FULLY PARAMETRIC',
    camera: 'The camera pans — and now it can ZOOM in tight or out wide.',
    eq: 'Frequency = where you’re looking. Q / bandwidth = how wide your view is.',
  },
];

const CHECK: CheckSpec = {
  question: 'Zooming the camera IN (a tighter view of one object) corresponds to…',
  options: ['Lower Q — wider bandwidth', 'Higher Q — narrower bandwidth', 'More gain'],
  correctIdx: 1,
  reveal:
    'Zoom in = see less of the room = a narrower frequency region = HIGHER Q. Remember: Q works opposite the apparent width.',
  wrongHint: 'The analogy never maps gain — and zooming IN sees LESS of the room.',
};

const INK = '#c7ccd6';
const FILL = '#191b21';
const FILL2 = '#22242c';

/** The room, drawn with a little depth: window · chair · person · lamp ·
 *  studio monitor. `aimX`/`halfW` place the camera's field-of-view wedge on the
 *  shared frequency axis; `locked` dims the tie between camera and EQ (fixed). */
function RoomScene({ aimX, halfW, width }: { aimX: number; halfW: number; width: number }) {
  // Camera and EQ always point at the same place now, so the field of view is
  // always the live amber (owner 2026-08-07).
  const fov = colors.amber;
  // Drawn at the pixel width the figure grants, scaled uniformly from the
  // 320-unit scene — the SAME width ÷ 320 scale the response graph below uses
  // for its x-axis, so the field of view stays over the bell at every size.
  const s = width / W;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={SCENE_H * s} viewBox={`0 0 ${W} ${SCENE_H}`}>
      {/* Back wall / floor split for depth */}
      <Rect x={PAD} y={28} width={PLOT_W} height={FLOOR_Y - 28} fill="#101216" />
      <Polygon points={`${PAD},${FLOOR_Y} ${W - PAD},${FLOOR_Y} ${W - PAD - 14},${FLOOR_Y + 16} ${PAD + 14},${FLOOR_Y + 16}`} fill="#0c0d11" />
      <Line x1={PAD} y1={FLOOR_Y} x2={W - PAD} y2={FLOOR_Y} stroke="#3a4150" strokeWidth={1.2} />

      {/* WINDOW — framed, no sill (owner 2026-10-10: the sill looked odd) */}
      <Rect x={28} y={50} width={34} height={36} rx={2} fill={FILL} stroke={INK} strokeWidth={1.5} />
      <Line x1={45} y1={50} x2={45} y2={86} stroke={INK} strokeWidth={1} />
      <Line x1={28} y1={68} x2={62} y2={68} stroke={INK} strokeWidth={1} />

      {/* CHAIR — at the room's scale (≈ 37.7 units/m, from the 1.75 m
          figure): seat 450 mm high × 450 wide, backrest top at 900 mm;
          seat, legs and back with a small depth offset. */}
      <Path d="M97 101 L97 116 M113 101 L113 116 M100.5 98 L100.5 112 M116.5 98 L116.5 112" stroke={INK} strokeWidth={1.3} strokeLinecap="round" />
      <Polygon points={`96,101 114,101 117.5,97 99.5,97`} fill={FILL2} stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M114 101 L114 82 L117.5 79 L117.5 97" fill={FILL} stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
      <Line x1={114.8} y1={86} x2={116.8} y2={84.2} stroke={INK} strokeWidth={0.8} strokeOpacity={0.6} />

      {/* PERSON (figure polish 2026-10-10 — it was a stick body under a
          head): the shared standing FIGURE, front view, at the room's scale
          (≈ 37.7 units/m: an adult 1.75 m = 66 units, crown at y 50), feet
          on the floor, centred; the figure's own skin-silhouette head. */}
      <FigureStandingFrontSvg cx={160} floorY={FLOOR_Y} px={0.0377} minContour={0.7} />

      {/* FLOOR LAMP — base, pole, shade */}
      <Ellipse cx={214} cy={116} rx={10} ry={2.6} fill={FILL2} stroke={INK} strokeWidth={1.2} />
      <Line x1={214} y1={116} x2={214} y2={70} stroke={INK} strokeWidth={1.6} />
      <Polygon points={`205,70 223,70 219,54 209,54`} fill={FILL} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Line x1={208} y1={60} x2={220} y2={60} stroke={INK} strokeWidth={0.8} strokeOpacity={0.6} />

      {/* STUDIO MONITOR on its floor stand, at the room's scale: an 8"
          two-way, 250 W × 400 H mm (9.4 × 15 units) with iso depth, its
          tweeter at ≈ 1.2 m — seated ear height — on a stand (top plate,
          column, base). Woofer Ø165 frame, tweeter, slot port. */}
      <Line x1={273} y1={84} x2={273} y2={114.5} stroke={INK} strokeWidth={1.8} />
      <Polygon points={`266,116 280,116 283,113.5 269,113.5`} fill={FILL2} stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
      <Polygon points={`267.5,84 278.5,84 281.5,81.6 270.5,81.6`} fill={FILL2} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      <Polygon points={`268.3,67 277.7,67 281.2,64 271.8,64`} fill={FILL2} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      <Polygon points={`277.7,67 277.7,82 281.2,79 281.2,64`} fill="#0f1116" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      <Rect x={268.3} y={67} width={9.4} height={15} rx={1} fill={FILL} stroke={INK} strokeWidth={1.3} />
      <Circle cx={273} cy={76.4} r={3.1} fill={FILL2} stroke={INK} strokeWidth={1} />
      <Circle cx={273} cy={76.4} r={1.1} fill={INK} fillOpacity={0.5} />
      <Circle cx={273} cy={70.4} r={1.5} fill={FILL2} stroke={INK} strokeWidth={0.9} />
      <Line x1={270.6} y1={80.4} x2={275.4} y2={80.4} stroke={INK} strokeWidth={0.9} strokeOpacity={0.6} />

      {/* CAMERA seen from behind, nearest the viewer, on its tripod: body
          with the viewfinder hump on top centre, mode dial and shutter button,
          the right-hand grip, the rear screen; a pan head on three splayed
          legs. (Its lens faces into the room — the field of view's apex.) */}
      <Path d="M152.5 150.5 L154.5 146.2 L165.5 146.2 L167.5 150.5 Z" fill={FILL2} stroke={colors.amber} strokeWidth={1.2} strokeLinejoin="round" />
      <Rect x={147.5} y={147.6} width={5} height={2.6} rx={1} fill={FILL} stroke={colors.amber} strokeWidth={1} />
      <Rect x={168.6} y={148.4} width={3.4} height={1.8} rx={0.9} fill={colors.amber} />
      <Rect x={146} y={150} width={28} height={14} rx={2.5} fill={FILL2} stroke={colors.amber} strokeWidth={1.4} />
      <Path d="M168.5 150.6 Q174.6 151 174.6 157 Q174.6 163.4 168.5 163.4" fill={FILL} stroke={colors.amber} strokeWidth={1} />
      <Rect x={149} y={152.6} width={16.4} height={9} rx={1.2} fill="#0b0c10" stroke={colors.amber} strokeWidth={0.8} strokeOpacity={0.7} />
      <Rect x={157} y={164} width={6} height={1.6} fill={FILL} stroke={colors.amber} strokeWidth={0.9} />
      <Path d="M158 165.6 L147 168 M162 165.6 L173 168 M160 165.6 L160 168" stroke={colors.amber} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

export function CameraAnalogyModule(p: EqModuleComponentProps) {
  const [stage, setStage] = useState<Stage>(0);
  // Starts pointed at the lamp, so unlocking PAN continues from where the fixed
  // camera was staring instead of jumping.
  const [pan, setPan] = useState(normFromF(FIXED_FREQ));
  const [zoom, setZoom] = useState(LOCKED_ZOOM);

  // FIXED (owner 2026-08-07): the camera is bolted down — the pan slider is
  // LOCKED and the camera stares at the lamp. Panning only unlocks at
  // semi-parametric, where the EQ can actually follow the camera.
  const panActive = stage >= 1;
  const zoomActive = stage >= 2;
  const cameraF = panActive ? fFromNorm(pan) : FIXED_FREQ;
  const eqFreq = cameraF; // camera and EQ always agree now
  const bwOct = bwFromZoom(zoomActive ? zoom : LOCKED_ZOOM);
  const q = qFromBwOct(bwOct);

  const aimX = xForF(cameraF);
  const halfW = (bwOct * PX_PER_OCT) / 2;
  const gc = gainColor(ANALOGY_GAIN_DB, 12);

  const curves = useMemo<ResponseCurve[]>(
    () => [
      {
        at: (f: number) => eqResponseDb([{ type: 'peak', freq: eqFreq, q, gainDb: ANALOGY_GAIN_DB }], f),
        emphasis: 'main',
      },
    ],
    [eqFreq, q],
  );

  const meta = STAGE_META[stage];

  // THE DOCK (owner rule 2026-10-10: every lab control lives in the bottom
  // dock). EQ TYPE replaces the three buttons that sat above the display;
  // PAN and ZOOM are the camera's two faders. A control the chosen EQ type
  // does not have stays on the dock as a LOCKED key with its reason — the
  // fixed EQ's camera is bolted to the tripod; only the fully parametric lens
  // zooms (owner 2026-08-07).
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'type',
      label: 'EQ TYPE',
      valueLabel: STAGE_SHORT[stage],
      valueA11y: meta.label.toLowerCase(),
      options: STAGE_META.map((m, i) => ({ id: String(i), label: m.label, blurb: `${m.camera} ${m.eq}` })),
      selectedId: String(stage),
      onSelect: (id) => setStage(Number(id) as Stage),
      sticky: true,
    },
    {
      kind: 'fader',
      id: 'pan',
      label: 'PAN',
      value: pan,
      onChange: setPan,
      format: () => `pan the camera · ${fmtHz(cameraF)}`,
      formatShort: () => fmtHz(cameraF),
      locked: panActive ? undefined : 'a FIXED EQ is bolted to the tripod — pick SEMI or FULLY PARAMETRIC',
    },
    {
      kind: 'fader',
      id: 'zoom',
      label: 'ZOOM',
      value: zoom,
      onChange: setZoom,
      format: () => `zoom the camera · Q ${q.toFixed(1)} · ${bwOct.toFixed(2)} oct`,
      formatShort: () => `Q${q.toFixed(1)}`,
      locked: zoomActive ? undefined : 'this lens cannot zoom — only FULLY PARAMETRIC sets Q',
    },
  ];

  return (
    <RackUnit
      initialParam="pan"
      params={params}
      stage={{
        size: 'L',
        fullScreen: true,
        badge: 'REAL PEAKING RESPONSE AT A FIXED +9 dB — GAIN IS NOT PART OF THE ANALOGY',
        bezel: [
          { k: 'EQ TYPE', v: STAGE_SHORT[stage], flex: 1.1 },
          { k: 'FREQ', v: fmtHz(eqFreq) },
          { k: 'Q', v: stage === 0 ? 'FIXED' : q.toFixed(1) },
          { k: 'WIDTH', v: stage === 0 ? 'FIXED' : `${bwOct.toFixed(2)} oct` },
        ],
        // One figure, two pixel-aligned panels: the room over the response, on
        // a shared log-frequency axis — held to its own shape and centred so
        // the camera's view stays over the bell at every glass size.
        render: (w, h) => {
          const fw = Math.max(120, Math.min(w, h * FIG_ASPECT));
          const fh = fw / FIG_ASPECT;
          const sceneH = SCENE_H * (fw / W);
          return (
            <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: fw, height: fh }}>
                <RoomScene aimX={aimX} halfW={halfW} width={fw} />
                <ResponseCurveGraph curves={curves} dbRange={12} width={fw} totalHeight={Math.max(40, fh - sceneH)} mainColor={gc} />
              </View>
            </View>
          );
        },
      }}
    >
      <GlossaryText style={styles.body}>
        Imagine a camera in a room. What the camera can DO — stay bolted down, pan, or pan and
        zoom — is exactly the difference between fixed, semi-parametric, and fully parametric EQ.
        Open EQ TYPE to switch between them.
      </GlossaryText>

      <Text style={styles.stageCamera}>{meta.camera}</Text>
      <Text style={styles.stageEq}>→ {meta.eq}</Text>
      <Text style={styles.honest}>
        {stage === 0
          ? 'Locked on the lamp at 2 kHz. Nothing you do moves it — that is what “fixed” means.'
          : 'The bell = the real peaking response at a fixed +9 dB — gain is NOT part of this analogy.'}
      </Text>

      <View style={styles.banner}>
        <Text style={styles.bannerText}>MOVE THE CAMERA = FREQUENCY</Text>
        <Text style={styles.bannerText}>ZOOM THE CAMERA = Q / BANDWIDTH</Text>
      </View>
      <Text style={styles.caption}>
        Remember: Q works opposite the apparent width — zooming IN sees LESS of the room, which is
        a NARROWER bandwidth and a HIGHER Q. Gain (boost or cut) is the next lesson.
      </Text>

      <CheckQuestion spec={CHECK} />
    </RackUnit>
  );
}

/** EQ TYPE on the narrow key and the bezel. */
const STAGE_SHORT = ['FIXED', 'SEMI', 'FULL'] as const;

const styles = StyleSheet.create({
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  stageCamera: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  stageEq: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19, color: colors.amber },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub },
  banner: { borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,198,77,.4)', backgroundColor: '#17130a', padding: 12, gap: 4, alignItems: 'center' },
  bannerText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: colors.amber },
});
