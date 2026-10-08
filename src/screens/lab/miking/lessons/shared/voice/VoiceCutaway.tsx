/**
 * THE VOICE CUTAWAY (owner 2026-10-08, on the Pixel: the old drawing — a bald
 * blob with a hose through it — "is horrible… I cannot launch with it"). A
 * MID-SAGITTAL SIDE VIEW of an adult head, neck and upper chest, facing +x,
 * in frame V (mm; the lips at the origin, y down), in the house flat-shaded
 * figure style: the skin is FIGURE_SKIN (FigureMass 'skin'), the shirt the
 * shared slate blue.
 *
 * Proportions are an adult's (a TEACHING DRAWING, simplified; every point a
 * drawing default): vertex to chin ≈ 232 mm, glabella to the back of the
 * skull ≈ 200 mm, the eyes halfway down the head, the nose tip at voiceSpec's
 * NOSE, the vocal folds at voiceArt's FOLDS — in the larynx behind the Adam's
 * apple (≈ C5), well below the jaw. Inside: the nasal cavity with its
 * turbinates, the hard and soft palate, the tongue, the pharynx down behind
 * the tongue, the epiglottis, the larynx with the vocal folds, the trachea
 * into the chest, the oesophagus and the spine behind.
 *
 * Pure geometry is built once (module scope helpers, memoised paths); the
 * component takes the step `s` and lights the parts in order.
 */
import { useMemo } from 'react';
import { BlurMask, Circle, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { FigureMass } from '../players/PlayerFigure';
import { FOLDS } from './VoiceArt';

type SkPath = ReturnType<typeof Skia.Path.Make>;
type P2 = readonly [number, number];

/** A smooth closed outline through points (Catmull-Rom as cubics). */
function closed(points: readonly P2[], tension = 0.5): SkPath {
  const p = Skia.Path.Make();
  const n = points.length;
  const at = (i: number) => points[(i + n) % n];
  p.moveTo(points[0][0], points[0][1]);
  const k = tension / 3;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    p.cubicTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
  }
  p.close();
  return p;
}

/** An open smooth stroke through points. */
function open(points: readonly P2[]): SkPath {
  const p = Skia.Path.Make();
  const n = points.length;
  const at = (i: number) => points[Math.max(0, Math.min(n - 1, i))];
  p.moveTo(points[0][0], points[0][1]);
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    p.cubicTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  return p;
}

/* ── the outside: head and neck, shirt, the far arm ── */

/** Head and neck in profile, from the crown over the face, down the throat,
 *  into the collar and back up the nape. */
export const CUT_HEAD: readonly P2[] = [
  [-96, -178], [-58, -173], [-30, -158], [-14, -136], [-6, -110], [-2, -88], [0, -78], [-3, -70], [-6, -65], // forehead, brow, nasion
  [-3, -55], [5, -45], [13, -36], [19, -29], [17, -23], [10, -20], [4, -19], // nose
  [3, -14], [7, -8], [6, -3], [1, -1], [1, 1], [6, 4], [7, 10], [2, 16], // lips
  [-1, 20], [0, 27], [3, 35], [0, 45], [-10, 53], // chin
  [-24, 58], [-38, 63], [-45, 71], [-44, 84], [-40, 95], [-44, 108], [-46, 130], [-48, 160], [-52, 210], // under the jaw, the throat, Adam's apple
  [-160, 210], [-162, 150], [-163, 100], [-166, 52], [-172, 16], [-184, -16], [-196, -54], [-200, -94], [-192, -134], [-170, -162], [-136, -177], // nape, occiput
];
const SHIRT: readonly P2[] = [
  [-50, 152], [-36, 176], [-22, 210], [-12, 250], [-6, 290], [-4, 340], [-3, 620], [-232, 620], [-231, 320], [-226, 250], [-214, 196], [-194, 158], [-174, 134], [-158, 120], [-108, 134],
];
const COLLAR: readonly P2[] = [[-160, 119], [-112, 133], [-74, 144], [-49, 153]];
/** The cut through the chest: a window in the shirt along the midline. */
const CHEST_CUT: readonly P2[] = [
  [-50, 158], [-48, 200], [-50, 260], [-52, 330], [-52, 620], [-150, 620], [-152, 300], [-150, 232], [-152, 180], [-153, 132], [-110, 142],
];
const HAIR: readonly P2[] = [[-20, -147], [-36, -164], [-62, -176], [-96, -180], [-138, -178], [-172, -162], [-194, -134], [-202, -94], [-198, -58], [-189, -30]];

/* ── the inside ── */

const BRAIN: readonly P2[] = [
  [-20, -98], [-28, -136], [-56, -158], [-96, -165], [-136, -161], [-168, -142], [-184, -106], [-182, -72], [-168, -50], [-142, -50], [-118, -62], [-92, -70], [-58, -74], [-30, -80],
];
const NASAL: readonly P2[] = [
  [2, -22], [-4, -30], [-14, -42], [-30, -55], [-58, -60], [-86, -57], [-100, -47], [-108, -31], [-100, -27], [-70, -29], [-36, -28], [-8, -25],
];
const TURBINATES: readonly (readonly P2[])[] = [
  [[-34, -51], [-56, -56], [-80, -53], [-64, -49.5], [-40, -49]],
  [[-22, -41], [-50, -47], [-84, -45], [-66, -40], [-30, -39]],
  [[-14, -31], [-44, -37], [-84, -35], [-64, -30.5], [-24, -29.5]],
];
/** The mouth and the pharynx as one airway: from the lips back under the
 *  palate, down behind the tongue to the larynx's inlet. */
const ORAL: readonly P2[] = [
  [1, -1], [3, -2], [-5, -4], [-11, -12], [-16, -19], [-40, -21], [-68, -21], [-84, -16], [-98, -26], [-108, -31], [-110, 0], [-109, 40], [-106, 70], [-102, 96], [-97, 108],
  [-92, 106], [-90, 88], [-86, 74], [-80, 64], [-66, 52], [-44, 40], [-24, 28], [-12, 16], [-5, 5], [3, 2],
];
const PALATE: readonly P2[] = [[-5, -17], [-12, -23], [-30, -26], [-66, -27], [-70, -23], [-40, -21], [-14, -19]];
const VELUM: readonly P2[] = [[-64, -28], [-80, -27], [-93, -19], [-101, -6], [-100, 6], [-94, 9], [-89, 0], [-82, -11], [-72, -18], [-64, -20]];
const TONGUE: readonly P2[] = [
  [-9, 6], [-13, -3], [-24, -9], [-40, -13], [-58, -13], [-74, -9], [-86, 2], [-90, 22], [-91, 38], [-88, 52], [-80, 62], [-66, 66], [-48, 60], [-30, 48], [-18, 34], [-11, 20],
];
const TEETH_UP: readonly P2[] = [[-4, -18], [-1, -7], [-3, -3], [-8, -6], [-10, -17]];
const TEETH_LO: readonly P2[] = [[-4, 2], [-6, 1.5], [-11, 7], [-11, 17], [-6, 17]];
const JAW_BONE: readonly P2[] = [[-8, 18], [-5, 27], [-7, 40], [-16, 47], [-25, 43], [-23, 28], [-14, 20]];
const EPIGLOTTIS: readonly P2[] = [[-82, 64], [-88, 52], [-93, 40], [-96, 35], [-92, 37], [-86, 50], [-78, 62]];
const LARYNX: readonly P2[] = [[-93, 74], [-86, 68], [-79, 66], [-66, 74], [-58, 86], [-56, 96], [-58, 106], [-60, 124], [-82, 124], [-82, 106], [-84, 96], [-88, 86]];
const THYROID: readonly P2[] = [[-53, 72], [-48, 84], [-46, 94], [-49, 106], [-53, 115], [-57, 112], [-55, 96], [-57, 78]];
const TRACHEA: readonly P2[] = [[-60, 122], [-61, 170], [-65, 220], [-69, 270], [-73, 330], [-75, 372], [-95, 372], [-93, 330], [-89, 270], [-85, 220], [-82, 170], [-82, 122]];
const FOLD_FRONT: readonly P2[] = [[-56, 91], [-67, 96], [-56, 101]];
const FOLD_BACK: readonly P2[] = [[-84, 91], [-71, 96], [-84, 101]];
const FALSE_FRONT: readonly P2[] = [[-58, 81], [-64, 84.5], [-58, 88]];
const FALSE_BACK: readonly P2[] = [[-86, 81], [-80, 84.5], [-86, 88]];

/** The spine's centre line: the neck's gentle forward curve, the chest's back. */
const spineX = (y: number) => -131 - 0.00028 * (y - 90) ** 2;

function poly(pts: readonly P2[]): SkPath {
  const p = Skia.Path.Make();
  p.moveTo(pts[0][0], pts[0][1]);
  for (const q of pts.slice(1)) p.lineTo(q[0], q[1]);
  p.close();
  return p;
}

function cutawayPaths() {
  const head = closed(CUT_HEAD, 0.5);
  const shirt = closed(SHIRT, 0.5);
  const vertebrae = Skia.Path.Make();
  for (let y = -12; y < 620; y += 23) {
    const x = spineX(y + 8);
    vertebrae.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 13, y, 26, 16), 4, 4));
  }
  const rings = Skia.Path.Make();
  for (let y = 128; y < 370; y += 12) {
    const t = (y - 122) / (372 - 122);
    rings.addCircle(-60 - 15 * t * t - 1, y, 2.6);
  }
  const oesophagus = open([[-99, 110], [-102, 170], [-108, 250], [-114, 340], [-120, 620]]);
  const hyoid = Skia.Path.Make();
  hyoid.addOval(Skia.XYWHRect(-71, 64, 18, 7));
  return {
    head,
    shirt,
    collar: open(COLLAR),
    chestCut: closed(CHEST_CUT, 0.45),
    hair: open(HAIR),
    brain: closed(BRAIN, 0.5),
    nasal: closed(NASAL, 0.45),
    turbinates: TURBINATES.map((t) => closed(t, 0.5)),
    oral: closed(ORAL, 0.4),
    palate: closed(PALATE, 0.4),
    velum: closed(VELUM, 0.5),
    tongue: closed(TONGUE, 0.5),
    tongueTop: open(TONGUE.slice(0, 11)),
    teethUp: closed(TEETH_UP, 0.4),
    teethLo: closed(TEETH_LO, 0.4),
    jaw: closed(JAW_BONE, 0.5),
    epiglottis: closed(EPIGLOTTIS, 0.4),
    larynx: closed(LARYNX, 0.4),
    thyroid: closed(THYROID, 0.5),
    trachea: closed(TRACHEA, 0.35),
    folds: (() => {
      const p = poly(FOLD_FRONT);
      p.addPath(poly(FOLD_BACK));
      return p;
    })(),
    falseFolds: (() => {
      const p = poly(FALSE_FRONT);
      p.addPath(poly(FALSE_BACK));
      return p;
    })(),
    vertebrae,
    rings,
    oesophagus,
    hyoid,
    brow: open([[-28, -76], [-17, -80], [-5, -78]]),
    lidUp: open([[-29, -62], [-21, -66], [-11, -62]]),
    lidLo: open([[-28, -61], [-19, -57.5], [-11, -61]]),
    ear: closed([[-110, -76], [-100, -66], [-100, -40], [-106, -20], [-118, -18], [-126, -34], [-128, -60], [-122, -76]], 0.55),
    jawline: open([[-12, 52], [-50, 44], [-86, 32], [-102, 14], [-106, -14]]),
  };
}

const LUMEN = '#121722';
const TISSUE = '#a07f6f';
const TISSUE_DEEP = '#7c5a4d';
const MUSCLE = '#b0645b';
const MUSCLE_LIGHT = '#c47d70';
const BONE = '#ddd1bb';
const CARTILAGE = '#cdd3d6';
const EDGE = '#2a201a';
const HAIR_TONE = '#2e2521';

export type CutawayTint = { pipe: string | null; tract: string | null; nasal: string | null; folds: string | null };

/** The cutaway; `tint` lights the airway in the order the steps name it. */
export function VoiceCutaway({ tint }: { tint: CutawayTint }) {
  const A = useMemo(cutawayPaths, []);
  return (
    <Group>
      {/* The head and neck in the figure skin, the torso in the shirt. */}
      <FigureMass path={A.head} tone="skin" contour={2.6} />
      <FigureMass path={A.shirt} tone="shirt" />
      <Path path={A.collar} style="stroke" strokeWidth={9} strokeCap="round" color="#2b3242" />
      {/* The chest cut along the midline: tissue, the spine, the gullet. */}
      <Path path={A.chestCut} color={TISSUE} />
      <Path path={A.chestCut} style="stroke" strokeWidth={2.4} color="#12151c" opacity={0.9} />
      <Group clip={A.head}>
        <Path path={A.brain} color="#b59b8a" opacity={0.55} />
        <Path path={A.brain} style="stroke" strokeWidth={5} color={BONE} opacity={0.7} />
      </Group>
      <Path path={A.vertebrae} color="#d3c4ab" opacity={0.42} />
      <Path path={A.oesophagus} style="stroke" strokeWidth={11} strokeCap="round" color={TISSUE_DEEP} />
      <Path path={A.oesophagus} style="stroke" strokeWidth={1.6} color={EDGE} opacity={0.7} />
      {/* The face outside: hair, brow, eye, the ear and jaw implied. */}
      <Path path={A.hair} style="stroke" strokeWidth={13} strokeCap="round" strokeJoin="round" color={HAIR_TONE} />
      <Path path={A.ear} style="stroke" strokeWidth={2} color={EDGE} opacity={0.35} />
      <Path path={A.jawline} style="stroke" strokeWidth={2} strokeCap="round" color={EDGE} opacity={0.22} />
      <Path path={A.brow} style="stroke" strokeWidth={4} strokeCap="round" color={HAIR_TONE} />
      <Path path={A.lidUp} style="stroke" strokeWidth={2.6} strokeCap="round" color={EDGE} />
      <Path path={A.lidLo} style="stroke" strokeWidth={1.4} strokeCap="round" color={EDGE} opacity={0.7} />
      <Circle cx={-14} cy={-61.5} r={2.6} color={EDGE} />
      {/* The airway's lumen: nose, mouth, pharynx, larynx, windpipe. */}
      <Path path={A.nasal} color={LUMEN} />
      <Path path={A.oral} color={LUMEN} />
      <Path path={A.larynx} color={LUMEN} />
      <Path path={A.trachea} color={LUMEN} />
      {/* The light on the airway, step by step (under the solid parts). */}
      {tint.nasal ? <Path path={A.nasal} color={tint.nasal} opacity={0.5} /> : null}
      {tint.tract ? (
        <Group opacity={0.5}>
          <Path path={A.oral} color={tint.tract} />
          <Group clip={Skia.XYWHRect(-120, 40, 80, FOLDS.y - 40)}>
            <Path path={A.larynx} color={tint.tract} />
          </Group>
        </Group>
      ) : null}
      {tint.pipe ? (
        <Group opacity={0.5}>
          <Path path={A.trachea} color={tint.pipe} />
          <Group clip={Skia.XYWHRect(-120, FOLDS.y, 80, 40)}>
            <Path path={A.larynx} color={tint.pipe} />
          </Group>
        </Group>
      ) : null}
      {/* The windpipe's wall and its cartilage rings. */}
      <Path path={A.trachea} style="stroke" strokeWidth={4} color={CARTILAGE} opacity={0.8} />
      <Path path={A.rings} color={CARTILAGE} />
      {TURBINATES.map((_, i) => (
        <Path key={i} path={A.turbinates[i]} color={TISSUE} />
      ))}
      <Path path={A.jaw} color={BONE} opacity={0.4} />
      <Path path={A.tongue}>
        <LinearGradient start={vec(-40, -12)} end={vec(-60, 60)} colors={[MUSCLE_LIGHT, MUSCLE, MUSCLE]} />
      </Path>
      <Path path={A.tongueTop} style="stroke" strokeWidth={1.6} strokeCap="round" color={EDGE} opacity={0.6} />
      <Path path={A.velum} color={MUSCLE} />
      <Path path={A.palate} color={BONE} />
      <Path path={A.teethUp} color="#f3efe6" />
      <Path path={A.teethLo} color="#f3efe6" />
      <Path path={A.hyoid} color={BONE} />
      <Path path={A.epiglottis} color={CARTILAGE} />
      <Path path={A.thyroid} color="#cbb7aa" opacity={0.85} />
      <Path path={A.thyroid} style="stroke" strokeWidth={1.4} color={EDGE} opacity={0.5} />
      <Path path={A.falseFolds} color="#d9a597" />
      <Path path={A.folds} color={tint.folds ?? '#ead2c6'} />
      <Path path={A.folds} style="stroke" strokeWidth={1.2} strokeJoin="round" color={EDGE} opacity={0.6} />
      {tint.folds ? (
        <Circle cx={FOLDS.x - 1} cy={FOLDS.y} r={20} color={tint.folds} opacity={0.25}>
          <BlurMask blur={8} style="normal" />
        </Circle>
      ) : null}
    </Group>
  );
}
