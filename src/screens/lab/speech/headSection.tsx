/**
 * Speech & Voice Lab — the HEAD-AND-NECK cross-section (pages 1–2), redrawn
 * 2026-10-14 at the current standard (owner: "the whole speech lab's
 * animations all need upgrading"; the old drawing was blocks and blobs — a
 * round tongue, a box larynx, rectangles for the trachea).
 *
 * Mid-sagittal section, facing LEFT, ~0.78 viewBox units per mm, with the
 * landmarks at their real levels: hard palate ≈ C1, mandible's lower border
 * ≈ C2/C3, hyoid ≈ C3/C4, thyroid cartilage ≈ C4–C5 with the vocal folds at
 * C5, cricoid ≈ C6, the trachea from C6–C7. Below a dashed line, the CHEST in
 * FRONT view (a true mid-sagittal cut passes between the lungs and would show
 * neither — the drawing says so); the trachea runs on into it.
 *
 * Colour language: dark blue-grey = air; red = muscle; cream = bone;
 * blue-grey = cartilage; pink = mucosa (lining); the true vocal fold pearly.
 *
 * Page 2 passes `stage`: the stage's parts light up and — unless motion is
 * reduced or Low-Light is on (useDecorativeMotion) — the stage plays: air
 * flows up from the lungs and out of the mouth, the folds buzz, the tract
 * rings, the tongue tip and lips articulate. One UI-thread clock; geometry
 * built once; no per-frame React state.
 */
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { useAnimatedProps, useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { colors, fonts } from '../../../theme/tokens';
import { useDecorativeMotion } from '../../../features/settings/decorativeMotion';
import { ANATOMY } from '../../../features/speech/speechModel';
import { ExpandableFigure } from '../kit/ExpandableFigure';

const F = fonts.barlowMedium;

const SKIN = '#17181d';
const SKIN_EDGE = '#3d3f48';
const CAVITY = '#1a1b21';
const BRAIN = '#202129';
const BRAIN_EDGE = '#2d2e37';
const AIR = '#1b2430';
const AIR_EDGE = '#2c3644';
const CONCHA = '#2f3d4d';
const BONE = '#c9c0ae';
const ENAMEL = '#efe9dc';
const CARTILAGE = '#9fb0c4';
const MUSCLE = '#a1524f';
const MUSCLE_EDGE = '#c46a66';
const MUSCLE_DEEP = '#7d3d3b';
const MUCOSA = '#d78a80';
const MUCOSA_DEEP = '#c97b7b';
const FOLD = '#ece7dd';
const OESOPHAGUS = '#5b3034';
const LUNG = '#2b3d4a';
const LUNG_EDGE = '#4a6274';
const DIAPHRAGM = '#9a8a74';
const HI = colors.cyanBright;

/** Radius of the invisible hit circle around each numbered disc (viewBox
 *  units; the drawing renders at ≥ 1 pt per unit on a phone, so ≥ 44 pt). */
const HIT_R = 22;
const DISC_R = 10;

/* ── static geometry (viewBox 300 × 320) ──────────────────────────────── */

const SILHOUETTE =
  'M 76 174 C 72 172 66 168 65 160 C 64 154 66 151 68 150 C 64 147 62 143 63 140 C 63 137 65 135 66 134 ' +
  'C 63 132 61 130 62 128 C 62 124 64 122 66 120 C 62 120 56 118 53 115 C 50 112 51 108 54 104 L 74 84 ' +
  'C 75 82 73 78 72 72 C 70 56 76 38 92 26 C 110 12 134 6 152 7 C 186 9 214 28 224 56 C 230 76 228 98 220 110 ' +
  'C 214 120 208 130 206 142 L 207 246 L 128 246 L 124 236 C 122 226 121 214 120 206 C 118 200 115 194 115 188 ' +
  'C 114 184 112 181 106 180 C 96 179 86 177 76 174 Z';

const CRANIAL_CAVITY = 'M 84 72 C 82 52 96 30 120 22 C 146 14 182 18 204 38 C 216 52 220 74 214 96 L 196 104 L 180 110 C 172 100 160 90 150 86 C 136 82 118 80 100 80 C 92 80 86 78 84 72 Z';
const CEREBRUM = 'M 90 70 C 90 48 108 30 134 26 C 162 22 192 30 204 50 C 210 62 210 76 204 86 C 194 90 186 88 178 86 C 168 84 160 80 150 80 C 128 78 104 80 94 78 C 91 76 90 73 90 70 Z';
const GYRI = 'M 104 46 C 112 40 120 42 126 36 M 140 32 C 146 40 156 38 162 44 M 176 40 C 178 50 188 52 192 60 M 112 62 C 122 56 134 60 142 54 M 154 58 C 162 66 174 62 182 70 M 98 72 C 108 68 118 72 126 68';
const CEREBELLUM = 'M 180 88 C 190 86 204 88 210 94 C 208 102 198 106 188 104 C 182 100 179 94 180 88 Z';
const BRAINSTEM = 'M 166 84 C 171 92 175 100 177 110 L 171 112 C 169 102 165 94 160 86 Z';

const NASAL_AIR = 'M 58 113 C 62 104 70 94 80 88 C 94 82 112 82 126 90 L 128 117 L 124 117 C 104 116 88 115 72 117 C 66 117 61 116 58 113 Z';
const CONCHAE = [
  'M 86 110 C 94 104 112 104 124 108 C 120 112 104 113 88 113 Z',
  'M 94 99 C 102 94 116 94 125 97 C 120 101 106 101 96 101 Z',
  'M 106 90 C 112 87 120 87 126 89 C 122 92 114 92 108 92 Z',
];
const PHARYNX_AIR = 'M 126 90 C 138 88 150 94 155 106 C 158 120 158 150 157 180 C 156 196 155 206 154 214 L 146 214 L 147 184 C 146 170 146 156 145 146 L 140 120 L 128 117 Z';
const LARYNX_AIR = 'M 124 180 C 132 176 140 172 146 170 L 150 182 L 150 214 L 127 214 L 124 205 Z';
const ORAL_AIR = 'M 70 124 C 84 118 110 119 124 121 L 140 140 L 142 150 L 120 148 L 84 140 L 72 134 Z';
const TRACHEA_NECK_AIR = 'M 127 214 L 148 214 L 149 246 L 128 246 Z';
/** The whole resonating tract (for the resonance glow). */
const TRACT = [PHARYNX_AIR, ORAL_AIR, NASAL_AIR, LARYNX_AIR];

const PHARYNX_WALL = 'M 140 90 C 150 94 156 104 157 116 C 158 150 158 180 155 214 L 155 246';
const SKULL_BASE = 'M 150 84 C 160 90 170 98 178 108 M 178 108 C 192 106 204 102 214 96';
const SPHENOID_SINUS = { cx: 138, cy: 84, rx: 9, ry: 5.5 };

const HARD_PALATE = 'M 72 120 C 84 115 104 115 125 116 L 125 120 C 104 120 88 121 78 125 C 75 126 72 124 72 120 Z';
const PALATE_MUCOSA = 'M 76 125.4 C 90 121.4 106 121.2 125 121.2';
const SOFT_PALATE = 'M 124 116.5 C 131 118 136 122 139 128 C 141 132 142 137 140.5 140.5 C 138.5 141 137 138.5 136 135.5 C 133 129.5 129 124.5 124 120.5 Z';

const UPPER_INCISOR = 'M 73 120 C 75 124 75 130 72 137 L 70 137 C 69 132 70 126 71 120 Z';
const LOWER_INCISOR = 'M 70 137 L 72 137 C 75 141 75 146 74 151 L 71 151 C 70 147 69 142 70 137 Z';
const INCISOR_ROOTS = 'M 72 120 L 74 110 M 72.5 151 L 74 160';
const MANDIBLE = 'M 72 151 C 70 156 69 162 71 167 C 73 171 79 172 85 168 C 88 162 86 156 80 150 Z';
const FLOOR_OF_MOUTH = 'M 84 166 C 98 172 112 176 125 177 L 125 174 C 110 172 96 168 86 162 Z';
const HYOID = 'M 122 173 C 126 171 131 172 132 176 C 130 179 125 179 122 177 Z';

const EPIGLOTTIS = 'M 129 186 C 133 179 139 171 146 165 C 148 164 149 166 147 168 C 142 175 137 182 133 188 Z';
const AE_FOLD = 'M 146 166 C 150 172 151 177 150 183';
const THYROID = 'M 119 180 C 121 184 120 190 118 194 C 119 198 121 202 122 205 L 125 205 C 124 200 122 195 122 190 C 123 186 123 182 122 179 Z';
const VENTRICULAR_FOLD = 'M 124 189 C 132 188 141 188 148 189 L 148 191.5 C 141 191 132 191 124 192 Z';
const VENTRICLE = 'M 124 193.2 L 148 193.2';
const VOCAL_FOLD = 'M 123 195 C 132 194 141 194 149 195 L 149 198 C 141 198 132 198 123 198.5 Z';
const ARYTENOID = 'M 148 183 C 152 181 155 185 155 190 L 154 198 L 148 198 C 147 194 147 188 148 183 Z';
const CRICOID = 'M 148 199 L 155 199 L 156 214 L 149 214 Z M 122 207 L 128 207 L 128 212 L 122 212 Z';
const TRACHEA_RINGS = [216, 222, 228, 234, 240];
const OESOPHAGUS_PATH = 'M 150 214 L 156 214 L 156 246 L 150 246 Z';

const VERTEBRAE = [
  'M 162 112 L 169 112 L 169 120 L 162 120 Z', // C1 anterior arch
  'M 163 108 C 166 104 170 104 172 108 L 173 124 L 177 128 L 177 150 L 162 150 L 162 128 L 164 124 Z', // C2 with the dens
  ...[155, 171, 187, 203, 219].map((y) => `M 162 ${y + 1} Q 162 ${y} 163 ${y} L 176 ${y} Q 177 ${y} 177 ${y + 1} L 177 ${y + 11} Q 177 ${y + 12} 176 ${y + 12} L 163 ${y + 12} Q 162 ${y + 12} 162 ${y + 11} Z`),
  'M 162 236 Q 162 235 163 235 L 176 235 Q 177 235 177 236 L 177 246 L 162 246 Z', // T1 (cut)
];
const SPINOUS = [138, 160, 176, 192, 208, 224].map((y, i) => `M 188 ${y} L ${i === 5 ? 206 : 200} ${y + 8} L 188 ${y + 7} Z`);

/* chest, front view */
const CHEST_TOP = 250;
const TRACHEA_CHEST = 'M 131 250 L 145 250 L 145 266 L 131 266 Z';
const BRONCHI = 'M 135 265 L 118 282 M 141 265 L 162 280';
const LUNG_R = 'M 126 258 C 118 251 104 252 97 262 C 89 274 85 292 84 310 C 96 305 114 304 130 310 C 131 292 131 272 126 258 Z';
const LUNG_L = 'M 150 258 C 158 251 172 252 179 262 C 187 274 191 292 192 310 C 180 305 162 304 152 310 C 154 304 150 298 146 294 C 150 286 152 272 150 258 Z';
const FISSURES = 'M 88 296 C 100 290 116 282 126 272 M 104 286 L 129 284 M 188 298 C 176 290 162 282 152 272';
const DIAPHRAGM_AT = (lift: number) => {
  'worklet';
  const a = 302 - lift, b = 304 - lift;
  return `M 80 314 C 92 ${a.toFixed(1)} 120 ${a.toFixed(1)} 136 312 C 152 ${b.toFixed(1)} 180 ${b.toFixed(1)} 196 314`;
};

/* ── moving parts (page 2): same command structure, two poses ───────── */

// tongue: rest, and tip raised to the alveolar ridge (as for T, D, N, L)
const TONGUE_REST = [74, 140, 76, 132, 82, 127, 90, 124, 100, 120, 116, 120, 126, 124, 134, 128, 140, 136, 142, 146, 145, 156, 145, 166, 142, 172, 128, 176, 110, 172, 94, 164, 84, 156, 80, 152, 76, 148, 74, 140];
const TONGUE_TIP = [78, 135, 74, 130, 75, 125, 81, 123, 96, 121, 114, 121, 126, 124, 134, 128, 140, 136, 142, 146, 145, 156, 145, 166, 142, 172, 128, 176, 110, 172, 94, 164, 84, 156, 81, 150, 79, 142, 78, 135];
function tongueD(k: number): string {
  'worklet';
  const p: string[] = [];
  for (let i = 0; i < TONGUE_REST.length; i++) p.push((TONGUE_REST[i] + (TONGUE_TIP[i] - TONGUE_REST[i]) * k).toFixed(1));
  const P = (i: number) => p[2 * i] + ' ' + p[2 * i + 1];
  return 'M ' + P(0) + ' C ' + P(1) + ' ' + P(2) + ' ' + P(3) + ' C ' + P(4) + ' ' + P(5) + ' ' + P(6) + ' C ' + P(7) + ' ' + P(8) + ' ' + P(9)
    + ' C ' + P(10) + ' ' + P(11) + ' ' + P(12) + ' L ' + P(13) + ' C ' + P(14) + ' ' + P(15) + ' ' + P(16) + ' C ' + P(17) + ' ' + P(18) + ' ' + P(19) + ' Z';
}
// lips: `open` 0 = together (rest), 1 = parted ~4 mm
function upperLipD(open: number): string {
  'worklet';
  const u = open * 1.2;
  return `M 66 120 C 63 122 61 126 62 128 C 61 ${(130 - u).toFixed(1)} 63 ${(133 - u).toFixed(1)} 66 ${(134 - u).toFixed(1)} L 70 ${(134 - u).toFixed(1)} C 70 128 70 123 70 120 Z`;
}
function lowerLipD(open: number): string {
  'worklet';
  const l = open * 3.2;
  return `M 66 ${(134 + l).toFixed(1)} C 63 ${(136 + l).toFixed(1)} 62 ${(139 + l * 0.6).toFixed(1)} 63 141 C 64 144 66 147 68 149 L 70 149 C 70 144 70 ${(139 + l * 0.5).toFixed(1)} 70 ${(135 + l).toFixed(1)} Z`;
}

// exhaled air: lungs → trachea → glottis → pharynx → over the tongue → out of the lips
const AIR_PATH: number[] = [138, 286, 138, 266, 138, 250, 138, 232, 137, 214, 136, 197, 140, 182, 150, 168, 151, 150, 147, 139, 132, 128, 104, 123, 82, 127, 67, 135, 44, 135];
const AIR_CUM: number[] = (() => {
  const c = [0];
  for (let i = 2; i < AIR_PATH.length; i += 2) c.push(c[c.length - 1] + Math.hypot(AIR_PATH[i] - AIR_PATH[i - 2], AIR_PATH[i + 1] - AIR_PATH[i - 1]));
  return c;
})();
const AIR_LEN = AIR_CUM[AIR_CUM.length - 1];
function airPoint(s: number): [number, number] {
  'worklet';
  const d = Math.max(0, Math.min(1, s)) * AIR_LEN;
  for (let i = 1; i < AIR_CUM.length; i++) {
    if (d <= AIR_CUM[i]) {
      const k = (d - AIR_CUM[i - 1]) / (AIR_CUM[i] - AIR_CUM[i - 1] || 1);
      return [AIR_PATH[2 * i - 2] + (AIR_PATH[2 * i] - AIR_PATH[2 * i - 2]) * k, AIR_PATH[2 * i - 1] + (AIR_PATH[2 * i + 1] - AIR_PATH[2 * i - 1]) * k];
    }
  }
  return [AIR_PATH[AIR_PATH.length - 2], AIR_PATH[AIR_PATH.length - 1]];
}

const STAGES = ['breath', 'phonation', 'resonance', 'articulation', 'speech'] as const;
const PARTICLES = 7;

const ACircle = Animated.createAnimatedComponent(Circle);
const APath = Animated.createAnimatedComponent(Path);
const AG = Animated.createAnimatedComponent(G);

/** Highlight overlay for a structure group: a cyan wash and outline on top. */
const STRUCT: Record<string, string[]> = {
  lungs: [LUNG_R, LUNG_L],
  trachea: [TRACHEA_NECK_AIR, TRACHEA_CHEST],
  larynx: [THYROID, ARYTENOID, CRICOID, VOCAL_FOLD, VENTRICULAR_FOLD, EPIGLOTTIS],
  pharynx: [PHARYNX_AIR],
  velum: [SOFT_PALATE],
  nasal: [NASAL_AIR],
  palate: [HARD_PALATE],
  teeth: [UPPER_INCISOR, LOWER_INCISOR],
  jaw: [MANDIBLE],
};

/**
 * Mid-sagittal head and neck, facing LEFT, with the chest below in front view.
 * Numbered tap discs sit off the structures on leader lines, textbook style;
 * the tongue is the one structure large enough to be labelled in place.
 */
export function HeadCrossSection({ selected, onSelect, highlight, controls, fsTitle = 'ANATOMY', stage, reduceMotion = false }: {
  selected: string | null; onSelect: (id: string) => void; highlight?: string[];
  /** The page's picker, docked under the drawing in full screen. */ controls?: ReactNode; fsTitle?: string;
  /** Page 2: the production stage to play. */ stage?: string; reduceMotion?: boolean;
}) {
  return (
    <ExpandableFigure aspect={300 / 320} title={fsTitle} controls={controls} render={(w, h) => (
      <View accessible accessibilityLabel={`Side-view cross-section of the head and neck, with the chest below in front view, ${ANATOMY.length} numbered structures: ${ANATOMY.map((a, i) => `${i + 1} ${a.name}`).join(', ')}.${stage ? ` Stage shown: ${stage}.` : ''} Use the buttons below the drawing to select one.`} style={{ width: w, height: h }}>
        <HeadSvg w={w} h={h} selected={selected} onSelect={onSelect} highlight={highlight} stage={stage} reduceMotion={reduceMotion} />
      </View>
    )} />
  );
}

function HeadSvg({ w, h, selected, onSelect, highlight, stage, reduceMotion }: { w: number; h: number; selected: string | null; onSelect: (id: string) => void; highlight?: string[]; stage?: string; reduceMotion: boolean }) {
  const hi = (id: string) => selected === id || (highlight?.includes(id) ?? false);
  const decorative = useDecorativeMotion();
  const si = stage ? STAGES.indexOf(stage as (typeof STAGES)[number]) : -1;
  const playing = si >= 0 && decorative && !reduceMotion;
  const clk = useSharedValue(0);
  const st = useSharedValue(si);
  useEffect(() => { st.value = playing ? si : -1; }, [si, playing, st]);
  const tick = useFrameCallback((info) => {
    const dt = info.timeSincePreviousFrame;
    if (dt == null) return;
    let c = clk.value + Math.min(dt, 64) / 1000;
    if (c > 3600) c -= 3600;
    clk.value = c;
  }, false);
  useEffect(() => { tick.setActive(playing); }, [playing, tick]);

  // what each stage shows (0 = breath … 4 = speech)
  const f = useDerivedValue(() => {
    const s = st.value, t = clk.value;
    const on = s >= 0;
    const buzz = on && s >= 1 ? 1 : 0;
    const ring = on && (s === 2 || s === 4) ? 1 : 0;
    const artic = on && s >= 3 ? 1 : 0;
    // articulation: a slow "ta-pa" cycle — tongue tip up, then the lips close
    const ph = (t * 0.7) % 1;
    const tip = artic ? Math.max(0, Math.sin(Math.PI * Math.min(1, ph / 0.4))) : 0;
    const lipsClosed = artic ? Math.max(0, Math.sin(Math.PI * Math.max(0, Math.min(1, (ph - 0.5) / 0.35)))) : 0;
    const lipOpen = on ? 0.7 * (1 - lipsClosed) : 0;
    const breathLift = on ? 3 * (0.5 - 0.5 * Math.cos(2 * Math.PI * (t / 4))) : 0;
    return { on, t, buzz, ring, tip, lipOpen, breathLift, flow: on ? 1 - 0.85 * lipsClosed : 0 };
  });
  const tongue = useAnimatedProps(() => ({ d: tongueD(f.value.tip) }));
  const lipU = useAnimatedProps(() => ({ d: upperLipD(f.value.lipOpen) }));
  const lipL = useAnimatedProps(() => ({ d: lowerLipD(f.value.lipOpen) }));
  const dia = useAnimatedProps(() => ({ d: DIAPHRAGM_AT(f.value.breathLift) }));
  const glow = useAnimatedProps(() => ({ opacity: f.value.ring ? 0.12 + 0.16 * (0.5 + 0.5 * Math.sin(2 * Math.PI * f.value.t * 1.6)) : 0 }));
  const mkRipple = (k: number) => () => {
    'worklet';
    const p = (f.value.t * 1.4 + k / 3) % 1;
    return { r: 2 + 9 * p, opacity: f.value.buzz ? 0.9 * (1 - p) : 0 };
  };
  const rip0 = useAnimatedProps(mkRipple(0));
  const rip1 = useAnimatedProps(mkRipple(1));
  const rip2 = useAnimatedProps(mkRipple(2));
  const mkParticle = (k: number) => () => {
    'worklet';
    const s = (f.value.t * 0.16 + k / PARTICLES) % 1;
    const p = airPoint(s);
    const fade = Math.min(1, s / 0.06, (1 - s) / 0.08);
    return { cx: p[0], cy: p[1], opacity: f.value.on ? 0.95 * fade * (s > 0.86 ? f.value.flow : 1) : 0 };
  };
  const pa0 = useAnimatedProps(mkParticle(0));
  const pa1 = useAnimatedProps(mkParticle(1));
  const pa2 = useAnimatedProps(mkParticle(2));
  const pa3 = useAnimatedProps(mkParticle(3));
  const pa4 = useAnimatedProps(mkParticle(4));
  const pa5 = useAnimatedProps(mkParticle(5));
  const pa6 = useAnimatedProps(mkParticle(6));
  const particles = [pa0, pa1, pa2, pa3, pa4, pa5, pa6];

  const lipRest = 0;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox="0 0 300 320">
      <Defs>
        <LinearGradient id="hsLung" x1={0} y1={0} x2={0} y2={1}>
          <Stop offset={0} stopColor="#35505f" />
          <Stop offset={1} stopColor={LUNG} />
        </LinearGradient>
        <LinearGradient id="hsMuscle" x1={0} y1={0} x2={0} y2={1}>
          <Stop offset={0} stopColor="#b25d59" />
          <Stop offset={1} stopColor={MUSCLE} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={300} height={320} rx={10} fill="#0a0a0c" stroke={colors.hairline} />

      {/* ── head and neck (side view) ── */}
      <Path d={SILHOUETTE} fill={SKIN} stroke={SKIN_EDGE} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d={CRANIAL_CAVITY} fill={CAVITY} />
      <Path d={CRANIAL_CAVITY} fill="none" stroke={BONE} strokeWidth={1.6} opacity={0.14} />
      <Path d={CEREBRUM} fill={BRAIN} stroke={BRAIN_EDGE} strokeWidth={1} />
      <Path d={GYRI} fill="none" stroke={BRAIN_EDGE} strokeWidth={1} />
      <Path d={CEREBELLUM} fill={BRAIN} stroke={BRAIN_EDGE} strokeWidth={1} />
      <Path d={BRAINSTEM} fill={BRAIN} stroke={BRAIN_EDGE} strokeWidth={1} />
      <Path d={SKULL_BASE} fill="none" stroke={BONE} strokeWidth={3} opacity={0.3} strokeLinecap="round" />
      <Ellipse {...SPHENOID_SINUS} fill="#1d232c" stroke={BONE} strokeWidth={0.8} opacity={0.35} />

      {/* spine (kept faint so it frames, never competes) */}
      <G opacity={0.4}>
        {VERTEBRAE.map((d, i) => <Path key={`v${i}`} d={d} fill={BONE} />)}
        {SPINOUS.map((d, i) => <Path key={`s${i}`} d={d} fill={BONE} />)}
      </G>
      <Line x1={182} y1={110} x2={183} y2={246} stroke="#2a2b33" strokeWidth={6} />

      {/* air spaces first, so tissue sits on top */}
      <Path d={NASAL_AIR} fill={AIR} stroke={AIR_EDGE} strokeWidth={1} />
      {CONCHAE.map((d, i) => <Path key={`c${i}`} d={d} fill={CONCHA} stroke="#3c4d60" strokeWidth={0.6} />)}
      <Path d={PHARYNX_AIR} fill={AIR} stroke={AIR_EDGE} strokeWidth={1} />
      <Path d={ORAL_AIR} fill={AIR} />
      <Path d={LARYNX_AIR} fill={AIR} />
      <Path d={TRACHEA_NECK_AIR} fill={AIR} stroke={AIR_EDGE} strokeWidth={1} />
      {/* resonance: the tract rings (page 2) */}
      <AG animatedProps={glow} opacity={0}>
        {TRACT.map((d, i) => <Path key={`t${i}`} d={d} fill={HI} />)}
      </AG>
      <Path d={PHARYNX_WALL} fill="none" stroke={MUCOSA_DEEP} strokeWidth={2.2} strokeLinecap="round" />
      <Path d={OESOPHAGUS_PATH} fill={OESOPHAGUS} />
      <Line x1={153} y1={215} x2={153} y2={245} stroke="#2a1416" strokeWidth={0.8} />

      {/* mouth: palate, soft palate, teeth, jaw, tongue, lips */}
      <Path d={HARD_PALATE} fill={BONE} />
      <Path d={PALATE_MUCOSA} fill="none" stroke={MUCOSA} strokeWidth={1.2} />
      <Path d={MANDIBLE} fill={BONE} />
      <Path d={INCISOR_ROOTS} fill="none" stroke="#d8cfbf" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
      <Path d={FLOOR_OF_MOUTH} fill={MUSCLE_DEEP} />
      <APath animatedProps={tongue} d={tongueD(0)} fill="url(#hsMuscle)" stroke={MUSCLE_EDGE} strokeWidth={1} />
      {/* genioglossus: the tongue's main muscle fans up from the inside of the chin */}
      <Path d="M 84 152 L 100 128 M 85 153 L 114 126 M 86 154 L 127 129 M 87 156 L 136 138 M 88 158 L 140 152 M 89 160 L 138 166" fill="none" stroke={MUSCLE_EDGE} strokeWidth={0.7} opacity={0.35} />
      <Path d={SOFT_PALATE} fill={MUCOSA_DEEP} stroke={MUSCLE_EDGE} strokeWidth={0.8} />
      <Path d={UPPER_INCISOR} fill={ENAMEL} />
      <Path d={LOWER_INCISOR} fill={ENAMEL} />
      <APath animatedProps={lipU} d={upperLipD(lipRest)} fill={MUSCLE} stroke={MUCOSA} strokeWidth={0.8} />
      <APath animatedProps={lipL} d={lowerLipD(lipRest)} fill={MUSCLE} stroke={MUCOSA} strokeWidth={0.8} />
      <Path d={HYOID} fill={BONE} />

      {/* larynx */}
      <Path d={EPIGLOTTIS} fill={MUCOSA} />
      <Path d={AE_FOLD} fill="none" stroke={MUCOSA} strokeWidth={1.6} strokeLinecap="round" />
      <Path d={THYROID} fill={CARTILAGE} />
      <Path d={VENTRICULAR_FOLD} fill={MUCOSA_DEEP} />
      <Path d={VENTRICLE} stroke="#0d1118" strokeWidth={1.4} />
      <Path d={VOCAL_FOLD} fill={FOLD} />
      <Path d={ARYTENOID} fill={CARTILAGE} />
      <Path d={CRICOID} fill={CARTILAGE} />
      {TRACHEA_RINGS.map((y) => <Rect key={y} x={123.5} y={y} width={4.5} height={3.6} rx={1.6} fill={CARTILAGE} />)}
      <Line x1={149} y1={214} x2={149.5} y2={246} stroke={MUCOSA_DEEP} strokeWidth={1.4} />

      {/* the buzz at the folds (page 2) */}
      <ACircle animatedProps={rip0} cx={136} cy={196.5} r={2} fill="none" stroke={HI} strokeWidth={1.1} opacity={0} />
      <ACircle animatedProps={rip1} cx={136} cy={196.5} r={2} fill="none" stroke={HI} strokeWidth={1.1} opacity={0} />
      <ACircle animatedProps={rip2} cx={136} cy={196.5} r={2} fill="none" stroke={HI} strokeWidth={1.1} opacity={0} />

      {/* ── chest (front view) ── */}
      <Line x1={8} y1={CHEST_TOP - 2} x2={292} y2={CHEST_TOP - 2} stroke={colors.hairline} strokeDasharray="4,3" />
      <Path d={LUNG_R} fill="url(#hsLung)" stroke={LUNG_EDGE} strokeWidth={1} />
      <Path d={LUNG_L} fill="url(#hsLung)" stroke={LUNG_EDGE} strokeWidth={1} />
      <Path d={FISSURES} fill="none" stroke={LUNG_EDGE} strokeWidth={0.8} opacity={0.8} />
      <Path d={BRONCHI} fill="none" stroke="#3d4f5e" strokeWidth={5} strokeLinecap="round" />
      <Path d={TRACHEA_CHEST} fill={AIR} stroke={AIR_EDGE} strokeWidth={1} />
      {[253, 257, 261].map((y) => <Line key={y} x1={132} y1={y} x2={144} y2={y} stroke={CARTILAGE} strokeWidth={1.4} opacity={0.8} />)}
      <APath animatedProps={dia} d={DIAPHRAGM_AT(0)} fill="none" stroke={hi('lungs') ? HI : DIAPHRAGM} strokeWidth={2.5} strokeLinecap="round" />

      {/* exhaled air (page 2) */}
      {particles.map((p, i) => <ACircle key={`p${i}`} animatedProps={p} cx={138} cy={286} r={1.7} fill={HI} opacity={0} />)}

      {/* ── selection / stage highlight: cyan wash + outline on top ── */}
      {Object.entries(STRUCT).filter(([id]) => hi(id)).map(([id, ds]) => ds.map((d, i) => (
        <Path key={`${id}${i}`} d={d} fill={HI} fillOpacity={0.38} stroke={HI} strokeWidth={1.2} />
      )))}
      {hi('tongue') ? <APath animatedProps={tongue} d={tongueD(0)} fill={HI} fillOpacity={0.3} stroke={HI} strokeWidth={1.2} /> : null}
      {hi('lips') ? <><APath animatedProps={lipU} d={upperLipD(0)} fill={HI} fillOpacity={0.4} stroke={HI} strokeWidth={1.1} /><APath animatedProps={lipL} d={lowerLipD(0)} fill={HI} fillOpacity={0.4} stroke={HI} strokeWidth={1.1} /></> : null}

      {/* ── captions ── */}
      <SvgText x={12} y={16} fontSize={9} fill={colors.textMuted} fontFamily={F}>SIDE VIEW · HEAD AND NECK</SvgText>
      <SvgText x={12} y={27} fontSize={9} fill={colors.textMuted} fontFamily={F}>NOT TO SCALE</SvgText>
      <SvgText x={12} y={CHEST_TOP + 12} fontSize={9} fill={colors.textMuted} fontFamily={F}>CHEST</SvgText>
      <SvgText x={12} y={CHEST_TOP + 23} fontSize={9} fill={colors.textMuted} fontFamily={F}>FRONT VIEW</SvgText>

      {/* ── numbered tap discs on leader lines ── */}
      {ANATOMY.map((a, i) => {
        const on = selected === a.id;
        const lit = hi(a.id);
        const inPlace = a.ax === a.x && a.ay === a.y;
        const dx = a.ax - a.x, dy = a.ay - a.y, len = Math.hypot(dx, dy) || 1;
        const sx = a.x + (dx / len) * (DISC_R + 1), sy = a.y + (dy / len) * (DISC_R + 1);
        return (
          <G key={a.id} onPress={() => onSelect(a.id)}>
            <Circle cx={a.x} cy={a.y} r={HIT_R} fill="#000" fillOpacity={0.001} />
            {!inPlace ? (
              <>
                <Line x1={sx} y1={sy} x2={a.ax} y2={a.ay} stroke={lit ? HI : colors.textMuted} strokeWidth={lit ? 1.5 : 1} opacity={lit ? 1 : 0.85} />
                <Circle cx={a.ax} cy={a.ay} r={1.8} fill={lit ? HI : '#ffffff'} stroke="#000" strokeWidth={0.5} />
              </>
            ) : null}
            <Circle cx={a.x} cy={a.y} r={DISC_R} fill={on ? HI : 'rgba(12,12,14,0.92)'} stroke={lit ? HI : colors.textSub} strokeWidth={lit ? 1.5 : 1} />
            <SvgText x={a.x} y={a.y + 3.5} fontSize={9.5} fill={on ? '#000' : colors.textPrimary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{i + 1}</SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
