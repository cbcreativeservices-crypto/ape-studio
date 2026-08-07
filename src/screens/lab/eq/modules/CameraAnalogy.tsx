/**
 * CameraAnalogy — EQ Lab lesson 4 (owner spec 2026-08-07): the owner's
 * classroom analogy, preserved as a distinctive interactive lesson.
 *
 *   FIXED EQ            = camera locked on a tripod (cannot move)
 *   SEMI-PARAMETRIC EQ  = camera can PAN across the room
 *   FULLY PARAMETRIC EQ = camera can PAN and ZOOM
 *
 *   MOVE THE CAMERA = FREQUENCY · ZOOM THE CAMERA = Q / BANDWIDTH
 *
 * RULING: the analogy STOPS there — gain is deliberately NOT mapped (it's the
 * next lesson). The room scene and the response graph share ONE log-frequency
 * axis (the fxViz 320-unit viewBox, padL/padR 8), so the camera's field of
 * view sits pixel-aligned above the bell it creates: pan slides both, zoom
 * narrows both. The bell is the REAL RBJ peaking response at a fixed +9 dB —
 * the readouts show the true F / Q / bandwidth numbers.
 *
 * Visual standards 2026-07-29: the room is drawn as illustrated real objects
 * in minimal line art (window · chair · person · lamp · loudspeaker).
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';
import { ResponseCurveGraph, eqResponseDb, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, DragSlider, type CheckSpec } from '../../foundations/bits';
import { colors, fonts } from '../../../../theme/tokens';
import { bwOctFromQ, fFromNorm, fmtHz, qFromBwOct } from './eqMath';
import type { EqModuleComponentProps } from './registry';

// ---- Shared axis (mirrors fxViz's logX: W=320, padL=padR=8) ----------------
const W = 320;
const PAD = 8;
const PLOT_W = W - 2 * PAD; // 304 px across 10 octaves (20 Hz → 20 kHz)
const PX_PER_OCT = PLOT_W / 10;
const xForF = (f: number) => PAD + (Math.log10(f) - Math.log10(20)) / 3 * PLOT_W;

// ---- Scene geometry ---------------------------------------------------------
const SCENE_H = 200;
const FLOOR_Y = 120;
const FOV_TOP = 70; // wedge top edge — the object zone
const CAM_APEX: [number, number] = [160, 164];

// ---- Analogy ↔ EQ mapping ---------------------------------------------------
/** Zoom 0..1 → bandwidth 4 oct (wide view) … 0.25 oct (tight close-up). */
const bwFromZoom = (z: number) => 4 - 3.75 * z;
const ANALOGY_GAIN_DB = 9; // fixed — gain is NOT part of the analogy (ruling)
const FIXED_FREQ = 1000; // stage 1: the bell locked at ~1 kHz (spec)
const LOCKED_ZOOM = 0.35; // stages 1–2: the lens that cannot zoom

type Stage = 0 | 1 | 2; // fixed · semi · fully parametric
const STAGE_META: { label: string; camera: string; eq: string }[] = [
  {
    label: 'FIXED',
    camera: 'The camera is locked on a tripod, pointed at one object. It cannot move.',
    eq: 'The EQ frequency is fixed — you can’t change where it operates.',
  },
  {
    label: 'SEMI-PARAMETRIC',
    camera: 'The camera can now PAN and point at different objects around the room — but the lens cannot zoom.',
    eq: 'The EQ frequency can be moved across the spectrum; the width stays fixed.',
  },
  {
    label: 'FULLY PARAMETRIC',
    camera: 'The camera can point anywhere — and now it can also ZOOM in tightly or out to a wider view.',
    eq: 'Frequency = where you’re looking. Q / bandwidth = how narrow or wide your view is.',
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

/** The room: window · chair · person · lamp · loudspeaker, minimal line art. */
function RoomScene({ aimX, halfW }: { aimX: number; halfW: number }) {
  const ink = colors.textSecondary;
  return (
    <Svg width="100%" height={SCENE_H} viewBox={`0 0 ${W} ${SCENE_H}`}>
      {/* Floor */}
      <Line x1={PAD} y1={FLOOR_Y} x2={W - PAD} y2={FLOOR_Y} stroke="#3a4150" strokeWidth={1.2} />

      {/* Window (left wall) */}
      <Rect x={30} y={78} width={30} height={34} rx={1.5} stroke={ink} strokeWidth={1.5} fill="none" />
      <Line x1={45} y1={78} x2={45} y2={112} stroke={ink} strokeWidth={1} />
      <Line x1={30} y1={95} x2={60} y2={95} stroke={ink} strokeWidth={1} />

      {/* Chair (side profile) */}
      <Path d="M95 84 L95 120 M95 104 L118 104 L118 120 M95 104 L95 84" stroke={ink} strokeWidth={1.5} fill="none" strokeLinecap="round" />

      {/* Person (minimal line art) */}
      <Circle cx={160} cy={84} r={7} stroke={ink} strokeWidth={1.5} fill="none" />
      <Path
        d="M160 91 L160 112 M160 97 L151 106 M160 97 L169 106 M160 112 L153 120 M160 112 L167 120"
        stroke={ink}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />

      {/* Floor lamp */}
      <Path d="M211 74 L219 74 L223 86 L207 86 Z" stroke={ink} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
      <Line x1={215} y1={86} x2={215} y2={120} stroke={ink} strokeWidth={1.5} />
      <Line x1={208} y1={120} x2={222} y2={120} stroke={ink} strokeWidth={1.5} />

      {/* Loudspeaker */}
      <Rect x={263} y={80} width={24} height={40} rx={2} stroke={ink} strokeWidth={1.5} fill="none" />
      <Circle cx={275} cy={108} r={6} stroke={ink} strokeWidth={1.2} fill="none" />
      <Circle cx={275} cy={90} r={3} stroke={ink} strokeWidth={1.2} fill="none" />

      {/* Field of view — apex at the lens, covering the aimed zone. */}
      <Polygon
        points={`${CAM_APEX[0]},${CAM_APEX[1]} ${aimX - halfW},${FOV_TOP} ${aimX + halfW},${FOV_TOP}`}
        fill={colors.amber}
        fillOpacity={0.1}
        stroke={colors.amber}
        strokeOpacity={0.5}
        strokeWidth={1}
      />
      <Line x1={aimX - halfW} y1={FOV_TOP} x2={aimX + halfW} y2={FOV_TOP} stroke={colors.amber} strokeWidth={2} strokeOpacity={0.8} />

      {/* Camera (minimal line art, pointing up into the room) */}
      <Rect x={146} y={168} width={28} height={16} rx={2} stroke={colors.amber} strokeWidth={1.5} fill="none" />
      <Circle cx={160} cy={166} r={5} stroke={colors.amber} strokeWidth={1.5} fill="none" />
      <Rect x={166} y={163} width={7} height={4} rx={1} stroke={colors.amber} strokeWidth={1.2} fill="none" />
    </Svg>
  );
}

export function CameraAnalogyModule(_p: EqModuleComponentProps) {
  const [stage, setStage] = useState<Stage>(0);
  const [pan, setPan] = useState(0.5); // 0..1 → 20 Hz…20 kHz
  const [zoom, setZoom] = useState(LOCKED_ZOOM);

  const panActive = stage >= 1;
  const zoomActive = stage >= 2;
  const freq = panActive ? fFromNorm(pan) : FIXED_FREQ;
  const bwOct = bwFromZoom(zoomActive ? zoom : LOCKED_ZOOM);
  const q = qFromBwOct(bwOct);

  const aimX = xForF(freq);
  const halfW = (bwOct * PX_PER_OCT) / 2;

  const curves = useMemo<ResponseCurve[]>(
    () => [
      {
        at: (f: number) => eqResponseDb([{ type: 'peak', freq, q, gainDb: ANALOGY_GAIN_DB }], f),
        emphasis: 'main',
      },
    ],
    [freq, q],
  );

  const meta = STAGE_META[stage];

  return (
    <View style={styles.root}>
      <Text style={styles.body}>
        Imagine a camera in a room. What the camera can DO — stay locked, pan, or pan and zoom —
        is exactly the difference between fixed, semi-parametric, and fully parametric EQ.
      </Text>

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
            {fmtHz(freq)} · Q {q.toFixed(1)} · {bwOct.toFixed(2)} oct
          </Text>
        </View>
        <RoomScene aimX={aimX} halfW={halfW} />
        {/* The field of view lands directly on the bell it creates — one axis. */}
        <ResponseCurveGraph curves={curves} dbRange={12} height={120} />
        <Text style={styles.honest}>
          Bell = the real peaking-filter response, drawn at a fixed +9 dB — gain is deliberately
          NOT part of this analogy.
        </Text>
      </View>

      {panActive ? (
        <DragSlider label="PAN THE CAMERA" value={pan} onChange={setPan} readout={fmtHz(freq)} />
      ) : (
        <View style={styles.lockedRow}>
          <Text style={styles.lockedLabel}>PAN THE CAMERA</Text>
          <Text style={styles.lockedNote}>locked — the camera is on a tripod</Text>
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
