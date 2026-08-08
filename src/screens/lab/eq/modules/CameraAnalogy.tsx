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
 * viewBox, padL/padR 8), so the camera's field of view sits pixel-aligned above
 * the bell it points at. Owner 2026-08-07: the pan slider works in EVERY mode —
 * in FIXED you can sweep the camera and watch the EQ refuse to move.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect } from 'react-native-svg';
import { ResponseCurveGraph, eqResponseDb, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, DragSlider, type CheckSpec } from '../../foundations/bits';
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
const FLOOR_Y = 116;
const FOV_TOP = 42;
const CAM_APEX: [number, number] = [160, 148];

// ---- Analogy ↔ EQ mapping ---------------------------------------------------
const bwFromZoom = (z: number) => 4 - 3.75 * z; // wide 4 oct … tight 0.25 oct
const ANALOGY_GAIN_DB = 9; // fixed — gain is NOT part of the analogy (ruling)
/** The frequency a FIXED EQ is bolted to. 2 kHz lands at x≈211 on the shared
 *  log axis — right on the LAMP, so the locked camera stares at exactly one
 *  object (owner 2026-08-07: not the person, not the speaker beside it). */
const FIXED_FREQ = 2000;
/** Stages 0–1: the lens that cannot zoom. ≈0.89 octaves ⇒ a ±13.5 px view that
 *  covers the lamp alone (person ends at x≈172, monitor starts at x≈262). */
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
function RoomScene({ aimX, halfW }: { aimX: number; halfW: number }) {
  // Camera and EQ always point at the same place now, so the field of view is
  // always the live amber (owner 2026-08-07).
  const fov = colors.amber;
  return (
    <Svg width="100%" height={SCENE_H} viewBox={`0 0 ${W} ${SCENE_H}`}>
      {/* Back wall / floor split for depth */}
      <Rect x={PAD} y={28} width={PLOT_W} height={FLOOR_Y - 28} fill="#101216" />
      <Polygon points={`${PAD},${FLOOR_Y} ${W - PAD},${FLOOR_Y} ${W - PAD - 14},${FLOOR_Y + 16} ${PAD + 14},${FLOOR_Y + 16}`} fill="#0c0d11" />
      <Line x1={PAD} y1={FLOOR_Y} x2={W - PAD} y2={FLOOR_Y} stroke="#3a4150" strokeWidth={1.2} />

      {/* WINDOW — framed, with a sill in slight perspective */}
      <Rect x={28} y={50} width={34} height={36} rx={2} fill={FILL} stroke={INK} strokeWidth={1.5} />
      <Line x1={45} y1={50} x2={45} y2={86} stroke={INK} strokeWidth={1} />
      <Line x1={28} y1={68} x2={62} y2={68} stroke={INK} strokeWidth={1} />
      <Polygon points={`25,86 65,86 69,91 21,91`} fill={FILL2} stroke={INK} strokeWidth={1} strokeLinejoin="round" />

      {/* CHAIR — seat + back + legs with a depth offset */}
      <Path d="M94 92 L94 116 M116 92 L116 116 M97 113 L113 113" stroke={INK} strokeWidth={1.4} />
      <Polygon points={`94,90 116,90 120,85 98,85`} fill={FILL2} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M116 90 L116 66 L120 62 L120 85" fill={FILL} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />

      {/* PERSON — proportioned figure, centered */}
      <Circle cx={160} cy={58} r={7} fill={FILL2} stroke={INK} strokeWidth={1.5} />
      <Path d="M160 65 Q153 75 155 92 L165 92 Q167 75 160 65 Z" fill={FILL} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M155 70 L148 84 M165 70 L172 84" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M157 92 L154 116 M163 92 L166 116" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />

      {/* FLOOR LAMP — base, pole, shade */}
      <Ellipse cx={214} cy={116} rx={10} ry={2.6} fill={FILL2} stroke={INK} strokeWidth={1.2} />
      <Line x1={214} y1={116} x2={214} y2={70} stroke={INK} strokeWidth={1.6} />
      <Polygon points={`205,70 223,70 219,54 209,54`} fill={FILL} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Line x1={208} y1={60} x2={220} y2={60} stroke={INK} strokeWidth={0.8} strokeOpacity={0.6} />

      {/* STUDIO MONITOR — front face + top + side, iso depth; woofer/tweeter/port */}
      <Polygon points={`262,62 284,62 290,57 268,57`} fill={FILL2} stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
      <Polygon points={`284,62 284,98 290,93 290,57`} fill="#0f1116" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
      <Rect x={262} y={62} width={22} height={36} rx={1.5} fill={FILL} stroke={INK} strokeWidth={1.4} />
      <Circle cx={273} cy={85} r={6} fill={FILL2} stroke={INK} strokeWidth={1.2} />
      <Circle cx={273} cy={85} r={2} fill={INK} fillOpacity={0.5} />
      <Circle cx={273} cy={70} r={2.6} fill={FILL2} stroke={INK} strokeWidth={1.1} />
      <Line x1={268} y1={93} x2={278} y2={93} stroke={INK} strokeWidth={1} strokeOpacity={0.6} />

      {/* CAMERA field of view — apex at the lens, covering the aimed zone */}
      <Polygon
        points={`${CAM_APEX[0]},${CAM_APEX[1]} ${aimX - halfW},${FOV_TOP} ${aimX + halfW},${FOV_TOP}`}
        fill={fov}
        fillOpacity={0.12}
        stroke={fov}
        strokeOpacity={0.6}
        strokeWidth={1}
      />
      <Line x1={aimX - halfW} y1={FOV_TOP} x2={aimX + halfW} y2={FOV_TOP} stroke={fov} strokeWidth={2} strokeOpacity={0.85} />

      {/* CAMERA body — on its tripod */}
      <Rect x={147} y={150} width={26} height={13} rx={2.5} fill={FILL2} stroke={colors.amber} strokeWidth={1.5} />
      <Circle cx={160} cy={150} r={5} fill={FILL} stroke={colors.amber} strokeWidth={1.5} />
      <Rect x={165} y={146} width={7} height={4} rx={1} fill={FILL} stroke={colors.amber} strokeWidth={1.2} />
      <Path d="M151 163 L144 167 M169 163 L176 167 M160 163 L160 167" stroke={colors.amber} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

export function CameraAnalogyModule(_p: EqModuleComponentProps) {
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

  return (
    <View style={styles.root}>
      <GlossaryText style={styles.body}>
        Imagine a camera in a room. What the camera can DO — stay bolted down, pan, or pan and
        zoom — is exactly the difference between fixed, semi-parametric, and fully parametric EQ.
      </GlossaryText>

      <Text style={styles.stageCamera}>{meta.camera}</Text>
      <Text style={styles.stageEq}>→ {meta.eq}</Text>

      {/* EQ-type buttons sit JUST ABOVE the display (owner 2026-08-07). */}
      <View style={styles.chipRow}>
        {STAGE_META.map((s, i) => (
          <Pressable
            key={s.label}
            onPress={() => setStage(i as Stage)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${s.label} stage`}
            accessibilityState={{ selected: stage === i }}
            style={[styles.chip, stage === i && styles.chipActive]}
          >
            <Text style={[styles.chipText, stage === i && styles.chipTextActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelEyebrow}>THE ROOM</Text>
          <Text style={styles.readout}>
            {stage === 0
              ? `${fmtHz(eqFreq)} — FIXED`
              : `${fmtHz(eqFreq)} · Q ${q.toFixed(1)} · ${bwOct.toFixed(2)} oct`}
          </Text>
        </View>
        <RoomScene aimX={aimX} halfW={halfW} />
        <ResponseCurveGraph curves={curves} dbRange={12} height={116} mainColor={gc} />
        <Text style={styles.honest}>
          {stage === 0
            ? 'Locked on the lamp at 2 kHz. Nothing you do moves it — that is what “fixed” means.'
            : 'The bell = the real peaking response at a fixed +9 dB — gain is NOT part of this analogy.'}
        </Text>
      </View>

      {/* FIXED locks BOTH controls (owner 2026-08-07) — a bolted-down camera
          has no pan handle to grab. */}
      {panActive ? (
        <DragSlider label="PAN THE CAMERA" value={pan} onChange={setPan} readout={fmtHz(cameraF)} />
      ) : (
        <View style={styles.lockedRow}>
          <Text style={styles.lockedLabel}>PAN THE CAMERA</Text>
          <Text style={styles.lockedNote}>locked — bolted to the tripod</Text>
        </View>
      )}
      {zoomActive ? (
        <DragSlider
          label="ZOOM THE CAMERA"
          value={zoom}
          onChange={setZoom}
          readout={`Q ${q.toFixed(1)} · ${bwOct.toFixed(2)} oct`}
        />
      ) : (
        <View style={styles.lockedRow}>
          <Text style={styles.lockedLabel}>ZOOM THE CAMERA</Text>
          <Text style={styles.lockedNote}>locked — this lens cannot zoom</Text>
        </View>
      )}

      <View style={styles.banner}>
        <Text style={styles.bannerText}>MOVE THE CAMERA = FREQUENCY</Text>
        <Text style={styles.bannerText}>ZOOM THE CAMERA = Q / BANDWIDTH</Text>
      </View>
      <Text style={styles.caption}>
        Remember: Q works opposite the apparent width — zooming IN sees LESS of the room, which is
        a NARROWER bandwidth and a HIGHER Q. Gain (boost or cut) is the next lesson.
      </Text>

      <CheckQuestion spec={CHECK} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#17171c' },
  chipActive: { borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#1d1708' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.8, color: colors.textSecondary },
  chipTextActive: { color: colors.amber },
  stageCamera: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  stageEq: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19, color: colors.amber },
  panel: { borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 8 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.amber },
  readout: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.amber },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub },
  lockedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#101014', paddingHorizontal: 12, paddingVertical: 12, opacity: 0.6 },
  lockedLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSub },
  lockedNote: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub },
  banner: { borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,198,77,.4)', backgroundColor: '#17130a', padding: 12, gap: 4, alignItems: 'center' },
  bannerText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: colors.amber },
});
