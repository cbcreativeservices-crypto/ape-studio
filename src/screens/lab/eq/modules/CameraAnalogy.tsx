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
import { bwOctFromQ, fFromNorm, fmtHz, gainColor, qFromBwOct } from './eqMath';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import type { EqModuleComponentProps } from './registry';

// ---- Shared axis (mirrors fxViz's logX: W=320, padL=padR=8) ----------------
const W = 320;
const PAD = 8;
const PLOT_W = W - 2 * PAD;
const PX_PER_OCT = PLOT_W / 10;
const xForF = (f: number) => PAD + ((Math.log10(f) - Math.log10(20)) / 3) * PLOT_W;

// ---- Scene geometry ---------------------------------------------------------
const SCENE_H = 210;
const FLOOR_Y = 150;
const FOV_TOP = 60;
const CAM_APEX: [number, number] = [160, 188];

// ---- Analogy ↔ EQ mapping ---------------------------------------------------
const bwFromZoom = (z: number) => 4 - 3.75 * z; // wide 4 oct … tight 0.25 oct
const ANALOGY_GAIN_DB = 9; // fixed — gain is NOT part of the analogy (ruling)
const FIXED_FREQ = 1000; // the frequency a FIXED EQ is bolted to
const LOCKED_ZOOM = 0.35; // stages 1–2: the lens that cannot zoom

type Stage = 0 | 1 | 2;
const STAGE_META: { label: string; camera: string; eq: string }[] = [
  {
    label: 'FIXED',
    camera: 'The camera is on a tripod. You can swing it to look around the room…',
    eq: '…but a FIXED EQ can’t follow — its frequency is bolted at 1 kHz.',
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
function RoomScene({ aimX, halfW, locked }: { aimX: number; halfW: number; locked: boolean }) {
  const fov = locked ? '#6c7688' : colors.amber;
  return (
    <Svg width="100%" height={SCENE_H} viewBox={`0 0 ${W} ${SCENE_H}`}>
      {/* Back wall / floor split for depth */}
      <Rect x={PAD} y={40} width={PLOT_W} height={FLOOR_Y - 40} fill="#101216" />
      <Polygon points={`${PAD},${FLOOR_Y} ${W - PAD},${FLOOR_Y} ${W - PAD - 16},${FLOOR_Y + 22} ${PAD + 16},${FLOOR_Y + 22}`} fill="#0c0d11" />
      <Line x1={PAD} y1={FLOOR_Y} x2={W - PAD} y2={FLOOR_Y} stroke="#3a4150" strokeWidth={1.2} />

      {/* WINDOW — framed, with a sill in slight perspective */}
      <Rect x={28} y={66} width={38} height={46} rx={2} fill={FILL} stroke={INK} strokeWidth={1.5} />
      <Line x1={47} y1={66} x2={47} y2={112} stroke={INK} strokeWidth={1} />
      <Line x1={28} y1={89} x2={66} y2={89} stroke={INK} strokeWidth={1} />
      <Polygon points={`25,112 69,112 73,118 21,118`} fill={FILL2} stroke={INK} strokeWidth={1} strokeLinejoin="round" />

      {/* CHAIR — seat + back + legs with a depth offset */}
      <Path d="M92 118 L92 150 M118 118 L118 150 M96 146 L114 146" stroke={INK} strokeWidth={1.4} />
      <Polygon points={`92,116 118,116 122,110 96,110`} fill={FILL2} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M118 116 L118 86 L122 82 L122 110" fill={FILL} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />

      {/* PERSON — proportioned figure, centered */}
      <Circle cx={160} cy={78} r={8} fill={FILL2} stroke={INK} strokeWidth={1.5} />
      <Path d="M160 86 Q152 98 154 120 L166 120 Q168 98 160 86 Z" fill={FILL} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M154 92 L146 110 M166 92 L174 110" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M156 120 L153 150 M164 120 L167 150" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />

      {/* FLOOR LAMP — base, pole, shade */}
      <Ellipse cx={214} cy={150} rx={11} ry={3} fill={FILL2} stroke={INK} strokeWidth={1.2} />
      <Line x1={214} y1={150} x2={214} y2={92} stroke={INK} strokeWidth={1.6} />
      <Polygon points={`204,92 224,92 219,72 209,72`} fill={FILL} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <Line x1={207} y1={78} x2={221} y2={78} stroke={INK} strokeWidth={0.8} strokeOpacity={0.6} />

      {/* STUDIO MONITOR — front face + top + side, iso depth; woofer/tweeter/port */}
      <Polygon points={`262,84 286,84 292,78 268,78`} fill={FILL2} stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
      <Polygon points={`286,84 286,128 292,122 292,78`} fill="#0f1116" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
      <Rect x={262} y={84} width={24} height={44} rx={1.5} fill={FILL} stroke={INK} strokeWidth={1.4} />
      <Circle cx={274} cy={112} r={7} fill={FILL2} stroke={INK} strokeWidth={1.2} />
      <Circle cx={274} cy={112} r={2.4} fill={INK} fillOpacity={0.5} />
      <Circle cx={274} cy={94} r={3} fill={FILL2} stroke={INK} strokeWidth={1.1} />
      <Line x1={269} y1={122} x2={279} y2={122} stroke={INK} strokeWidth={1} strokeOpacity={0.6} />

      {/* CAMERA field of view — apex at the lens, covering the aimed zone */}
      <Polygon
        points={`${CAM_APEX[0]},${CAM_APEX[1]} ${aimX - halfW},${FOV_TOP} ${aimX + halfW},${FOV_TOP}`}
        fill={fov}
        fillOpacity={locked ? 0.06 : 0.12}
        stroke={fov}
        strokeOpacity={locked ? 0.4 : 0.6}
        strokeWidth={1}
        strokeDasharray={locked ? '4 4' : undefined}
      />
      <Line x1={aimX - halfW} y1={FOV_TOP} x2={aimX + halfW} y2={FOV_TOP} stroke={fov} strokeWidth={2} strokeOpacity={0.85} />

      {/* CAMERA body — on its tripod */}
      <Rect x={146} y={190} width={28} height={15} rx={2.5} fill={FILL2} stroke={colors.amber} strokeWidth={1.5} />
      <Circle cx={160} cy={190} r={5.5} fill={FILL} stroke={colors.amber} strokeWidth={1.5} />
      <Rect x={166} y={185} width={8} height={5} rx={1} fill={FILL} stroke={colors.amber} strokeWidth={1.2} />
      <Path d="M150 205 L142 210 M170 205 L178 210 M160 205 L160 210" stroke={colors.amber} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

export function CameraAnalogyModule(_p: EqModuleComponentProps) {
  const [stage, setStage] = useState<Stage>(0);
  const [pan, setPan] = useState(0.5); // 0..1 → 20 Hz…20 kHz (where the camera points)
  const [zoom, setZoom] = useState(LOCKED_ZOOM);

  const zoomActive = stage >= 2;
  const cameraF = fFromNorm(pan); // where the camera is pointed
  const eqFreq = stage === 0 ? FIXED_FREQ : cameraF; // a fixed EQ can't follow
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
        Imagine a camera in a room. What the camera can DO — swing, pan-and-follow, or pan and
        zoom — is exactly the difference between fixed, semi-parametric, and fully parametric EQ.
      </GlossaryText>

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
      <Text style={styles.stageCamera}>{meta.camera}</Text>
      <Text style={styles.stageEq}>→ {meta.eq}</Text>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelEyebrow}>THE ROOM</Text>
          <Text style={styles.readout}>
            {stage === 0 ? `Camera ${fmtHz(cameraF)} · EQ 1 kHz (fixed)` : `${fmtHz(eqFreq)} · Q ${q.toFixed(1)} · ${bwOct.toFixed(2)} oct`}
          </Text>
        </View>
        <RoomScene aimX={aimX} halfW={halfW} locked={stage === 0} />
        <ResponseCurveGraph curves={curves} dbRange={12} height={116} mainColor={gc} />
        <Text style={styles.honest}>
          {stage === 0
            ? 'Sweep the camera — the bell stays at 1 kHz. A fixed EQ can look, but not move.'
            : 'The bell = the real peaking response at a fixed +9 dB — gain is NOT part of this analogy.'}
        </Text>
      </View>

      {/* Pan works in EVERY mode now (owner 2026-08-07). */}
      <DragSlider label="PAN THE CAMERA" value={pan} onChange={setPan} readout={fmtHz(cameraF)} />
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
