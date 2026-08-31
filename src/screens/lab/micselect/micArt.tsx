/**
 * micArt — recognizable microphone illustrations for the Microphone Selection
 * Lab (visual standards 2026-07-29: real objects get real drawings — layered
 * shapes, gradients for form, upper-left light, rim highlights; never a bare
 * rect/circle stand-in). All mics are FICTIONAL designs — no brand likenesses.
 *
 * Every drawing lives in a normalized 100×150 space and is scaled to the
 * requested size, so one set of coordinates serves cards, chips and the
 * challenge list. Static geometry only — no animation.
 */
import { createContext, useContext, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Modal } from '../../../components/DimModal';
import { Canvas, Circle, Group, Line, LinearGradient, Oval, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { CondenserMic as SharedLdcMic, HandheldMic } from '../../../features/lab/micDrawings';
import type { MicKind } from './micSelectData';
import { micImageUrl } from './micImages';

const BODY_HI = '#6e7482';
const BODY_MID = '#3b3f49';
const BODY_LO = '#15161b';
const GRILLE_HI = '#8b909c';
const GRILLE_LO = '#23252c';
const MESH = '#565b66';
const RIM = 'rgba(255,255,255,0.35)';
const ACCENT = '#ffc64d';
const CABLE = '#2a2c33';

/** Vertical metal-sheen gradient (light from upper-left). */
function BodyGrad({ x, w }: { x: number; w: number }) {
  return <LinearGradient start={vec(x, 0)} end={vec(x + w, 0)} colors={[BODY_HI, BODY_MID, BODY_LO]} positions={[0, 0.42, 1]} />;
}
function GrilleGrad({ x, w }: { x: number; w: number }) {
  return <LinearGradient start={vec(x, 0)} end={vec(x + w, 0)} colors={[GRILLE_HI, GRILLE_LO]} />;
}

/** Horizontal mesh lines inside a grille area. */
function Mesh({ x, y, w, h, n = 4 }: { x: number; y: number; w: number; h: number; n?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const yy = y + ((i + 1) * h) / (n + 1);
        return <Line key={i} p1={vec(x, yy)} p2={vec(x + w, yy)} color={MESH} strokeWidth={1.4} />;
      })}
    </>
  );
}

// The two mic types the owner named (2026-08-28) draw from the SHARED canonical
// art in features/lab/micDrawings.tsx, so the catalogue entry and the Mic
// Principles scenes are the same illustration. Geometry is placed to match the
// silhouettes these two used to have inside the 100×150 design space.
function DynamicMic() {
  return <HandheldMic x={50} y={30} angleDeg={0} grilleR={26} bodyLen={93} />;
}

function LdcMic() {
  return (
    <>
      {/* shock-ring hint, kept: it reads as a studio mount in the catalogue. */}
      <Oval x={18} y={126} width={64} height={16} color={BODY_LO} />
      <SharedLdcMic x={50} y={46} headR={24} bodyLen={62} />
    </>
  );
}

function SdcMic() {
  return (
    <>
      <RoundedRect x={43} y={30} width={14} height={112} r={6}>
        <BodyGrad x={43} w={14} />
      </RoundedRect>
      <RoundedRect x={43} y={10} width={14} height={18} r={6}>
        <GrilleGrad x={43} w={14} />
      </RoundedRect>
      <Mesh x={44} y={11} w={12} h={15} n={3} />
      <RoundedRect x={42} y={30} width={16} height={5} r={2} color={ACCENT} opacity={0.65} />
      <Line p1={vec(45, 34)} p2={vec(45, 138)} color={RIM} strokeWidth={1.2} opacity={0.5} />
    </>
  );
}

function RibbonMic() {
  return (
    <>
      <RoundedRect x={28} y={14} width={44} height={102} r={20}>
        <BodyGrad x={28} w={44} />
      </RoundedRect>
      <RoundedRect x={34} y={20} width={32} height={90} r={14}>
        <GrilleGrad x={34} w={32} />
      </RoundedRect>
      {/* vertical ribbon-grille slots */}
      {[40, 46, 52, 58, 64].map((x) => (
        <Line key={x} p1={vec(x, 26)} p2={vec(x, 104)} color={BODY_LO} strokeWidth={2.2} />
      ))}
      {/* the ribbon glint down the center */}
      <Line p1={vec(50, 30)} p2={vec(50, 100)} color={ACCENT} strokeWidth={1.2} opacity={0.55} />
      <RoundedRect x={44} y={116} width={12} height={26} r={4}>
        <BodyGrad x={44} w={12} />
      </RoundedRect>
      <Line p1={vec(30, 20)} p2={vec(30, 110)} color={RIM} strokeWidth={1.4} opacity={0.45} />
    </>
  );
}

function CondenserMic() {
  return (
    <>
      <RoundedRect x={31} y={40} width={38} height={98} r={12}>
        <BodyGrad x={31} w={38} />
      </RoundedRect>
      <RoundedRect x={31} y={12} width={38} height={32} r={12}>
        <GrilleGrad x={31} w={38} />
      </RoundedRect>
      <Mesh x={34} y={14} w={32} h={28} n={4} />
      <RoundedRect x={31} y={46} width={38} height={5} r={2} color={ACCENT} opacity={0.55} />
      <Circle cx={50} cy={70} r={3.4} color={ACCENT} opacity={0.75} />
      <Line p1={vec(34, 46)} p2={vec(34, 134)} color={RIM} strokeWidth={1.3} opacity={0.5} />
    </>
  );
}

function ElectretMic() {
  const cable = Skia.Path.Make();
  cable.moveTo(50, 74);
  cable.cubicTo(50, 100, 34, 108, 36, 140);
  return (
    <>
      <Path path={cable} style="stroke" strokeWidth={3} color={CABLE} />
      <Circle cx={50} cy={48} r={20}>
        <LinearGradient start={vec(32, 30)} end={vec(68, 66)} colors={[BODY_HI, BODY_LO]} />
      </Circle>
      <Circle cx={50} cy={48} r={20} color={RIM} style="stroke" strokeWidth={1.2} opacity={0.4} />
      {/* port hole */}
      <Circle cx={50} cy={44} r={6} color={GRILLE_LO} />
      <Circle cx={50} cy={44} r={6} color={MESH} style="stroke" strokeWidth={1} />
      <RoundedRect x={44} y={64} width={12} height={12} r={3}>
        <BodyGrad x={44} w={12} />
      </RoundedRect>
    </>
  );
}

function LavMic() {
  const cable = Skia.Path.Make();
  cable.moveTo(50, 52);
  cable.cubicTo(52, 84, 34, 96, 40, 142);
  const clip = Skia.Path.Make();
  clip.moveTo(58, 40);
  clip.lineTo(74, 30);
  clip.lineTo(74, 56);
  clip.lineTo(58, 48);
  clip.close();
  return (
    <>
      <Path path={cable} style="stroke" strokeWidth={2.6} color={CABLE} />
      <Path path={clip}>
        <LinearGradient start={vec(58, 30)} end={vec(74, 56)} colors={[BODY_MID, BODY_LO]} />
      </Path>
      <RoundedRect x={40} y={22} width={20} height={32} r={9}>
        <LinearGradient start={vec(40, 22)} end={vec(60, 54)} colors={[BODY_HI, BODY_LO]} />
      </RoundedRect>
      <Circle cx={50} cy={28} r={5} color={GRILLE_LO} />
      <Circle cx={50} cy={28} r={5} color={MESH} style="stroke" strokeWidth={1} />
      <Line p1={vec(43, 26)} p2={vec(43, 50)} color={RIM} strokeWidth={1.1} opacity={0.5} />
    </>
  );
}

function HeadwornMic() {
  const hook = Skia.Path.Make();
  hook.moveTo(66, 26);
  hook.cubicTo(88, 34, 88, 78, 64, 84);
  const boom = Skia.Path.Make();
  boom.moveTo(64, 82);
  boom.cubicTo(48, 92, 34, 100, 26, 112);
  return (
    <>
      <Path path={hook} style="stroke" strokeWidth={5.5} color={BODY_MID} />
      <Path path={hook} style="stroke" strokeWidth={1.4} color={RIM} opacity={0.45} />
      <Path path={boom} style="stroke" strokeWidth={3.4} color={BODY_MID} />
      {/* capsule at the boom tip */}
      <Circle cx={24} cy={114} r={7}>
        <LinearGradient start={vec(17, 107)} end={vec(31, 121)} colors={[BODY_HI, BODY_LO]} />
      </Circle>
      <Circle cx={23} cy={113} r={2.6} color={GRILLE_LO} />
    </>
  );
}

function ShotgunMic() {
  return (
    <>
      <RoundedRect x={44} y={8} width={12} height={104} r={6}>
        <BodyGrad x={44} w={12} />
      </RoundedRect>
      {/* interference-tube slots */}
      {Array.from({ length: 9 }, (_, i) => (
        <Line key={i} p1={vec(46.5, 16 + i * 10)} p2={vec(53.5, 16 + i * 10)} color={BODY_LO} strokeWidth={2.4} />
      ))}
      <RoundedRect x={42} y={112} width={16} height={30} r={6}>
        <BodyGrad x={42} w={16} />
      </RoundedRect>
      <RoundedRect x={42} y={112} width={16} height={5} r={2} color={ACCENT} opacity={0.55} />
      <Line p1={vec(46, 12)} p2={vec(46, 108)} color={RIM} strokeWidth={1.1} opacity={0.5} />
    </>
  );
}

function BoundaryMic() {
  const wedge = Skia.Path.Make();
  wedge.moveTo(22, 102);
  wedge.lineTo(50, 74);
  wedge.lineTo(78, 102);
  wedge.close();
  return (
    <>
      {/* the boundary surface itself */}
      <Oval x={8} y={96} width={84} height={26}>
        <LinearGradient start={vec(8, 96)} end={vec(92, 122)} colors={[BODY_MID, BODY_LO]} />
      </Oval>
      <Path path={wedge}>
        <LinearGradient start={vec(22, 74)} end={vec(78, 102)} colors={[BODY_HI, BODY_LO]} />
      </Path>
      {/* capsule slot at the front lip */}
      <RoundedRect x={38} y={94} width={24} height={6} r={3} color={GRILLE_LO} />
      <Mesh x={39} y={93} w={22} h={7} n={1} />
      <Line p1={vec(24, 100)} p2={vec(50, 76)} color={RIM} strokeWidth={1.2} opacity={0.5} />
    </>
  );
}

function MeasurementMic() {
  return (
    <>
      <RoundedRect x={46} y={26} width={8} height={116} r={4}>
        <BodyGrad x={46} w={8} />
      </RoundedRect>
      {/* slim tip capsule */}
      <RoundedRect x={46.6} y={12} width={6.8} height={14} r={3.2}>
        <GrilleGrad x={46.6} w={6.8} />
      </RoundedRect>
      {/* calibration ring */}
      <RoundedRect x={45} y={40} width={10} height={4} r={2} color={ACCENT} opacity={0.7} />
      <Line p1={vec(47.4, 30)} p2={vec(47.4, 138)} color={RIM} strokeWidth={1} opacity={0.45} />
    </>
  );
}

function ContactMic() {
  const cable = Skia.Path.Make();
  cable.moveTo(68, 74);
  cable.cubicTo(88, 82, 78, 112, 62, 140);
  return (
    <>
      <Path path={cable} style="stroke" strokeWidth={3} color={CABLE} />
      <Circle cx={50} cy={66} r={24}>
        <LinearGradient start={vec(28, 44)} end={vec(72, 88)} colors={[BODY_HI, BODY_MID, BODY_LO]} positions={[0, 0.5, 1]} />
      </Circle>
      <Circle cx={50} cy={66} r={15} color={BODY_LO} style="stroke" strokeWidth={2.4} />
      <Circle cx={50} cy={66} r={6} color={ACCENT} opacity={0.5} />
      <Circle cx={43} cy={59} r={24} color={RIM} style="stroke" strokeWidth={1.2} opacity={0.4} />
    </>
  );
}

const DRAWINGS: Record<MicKind, () => React.JSX.Element> = {
  dynamic: DynamicMic,
  condenser: CondenserMic,
  electret: ElectretMic,
  ribbon: RibbonMic,
  ldc: LdcMic,
  sdc: SdcMic,
  lav: LavMic,
  headworn: HeadwornMic,
  shotgun: ShotgunMic,
  boundary: BoundaryMic,
  measurement: MeasurementMic,
  contact: ContactMic,
};

/** One microphone illustration, scaled from the 100×150 design space. */
export function MicArt({ kind, w = 56, h = 84 }: { kind: MicKind; w?: number; h?: number }) {
  const Draw = DRAWINGS[kind];
  return (
    <Canvas style={{ width: w, height: h }}>
      <Group transform={[{ scaleX: w / 100 }, { scaleY: h / 150 }]}>
        <Draw />
      </Group>
    </Canvas>
  );
}

// ── Tap-to-enlarge photo lightbox (owner 2026-08-18) ─────────────────────────
// One shared fullscreen modal for the whole lab. Wrap the lab screen in
// <MicPhotoLightbox> once; every MicVisual then opens the big photo on tap.
const LightboxCtx = createContext<((kind: MicKind) => void) | null>(null);

export function MicPhotoLightbox({ children }: { children: ReactNode }) {
  const [kind, setKind] = useState<MicKind | null>(null);
  const url = kind ? micImageUrl(kind) : null;
  return (
    <LightboxCtx.Provider value={setKind}>
      {children}
      <Modal accessibilityViewIsModal visible={!!url} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setKind(null)}>
        <Pressable style={styles.lbBackdrop} onPress={() => setKind(null)} accessibilityRole="button" accessibilityLabel="Close photo">
          <View style={styles.lbCard}>
            {url ? (
              <Image
                source={{ uri: url }}
                style={styles.lbImage}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
                accessibilityRole="image"
                accessibilityLabel={kind ? `${kind} microphone reference image` : 'Microphone reference image'}
              />
            ) : null}
          </View>
          <View style={styles.lbClose} pointerEvents="none">
            <Text style={styles.lbCloseX}>✕</Text>
          </View>
        </Pressable>
      </Modal>
    </LightboxCtx.Provider>
  );
}

/** Mic visual = the real reference PHOTO when the kind has one (owner 2026-08-17,
 *  Option A), on a light tile so the seamless-white product shot reads cleanly
 *  against the dark lab UI. TAP to enlarge in the shared lightbox (owner
 *  2026-08-18) — a ⤢ hint marks it zoomable. Falls back to the code-drawn MicArt
 *  illustration if the kind is unmapped or the image fails to load — never a blank. */
export function MicVisual({
  kind,
  w = 56,
  h = 84,
  zoomable = true,
}: {
  kind: MicKind;
  w?: number;
  h?: number;
  /**
   * Set false when this photo sits INSIDE another button. The tile wraps itself
   * in its own Pressable to open the lightbox; nested inside the mic-type grid
   * cards that produced twelve <button>-in-<button> pairs on one screen —
   * invalid on web, and a screen reader could not reach either action cleanly.
   * A 44×66 thumbnail is too small to hold a second target anyway; the lightbox
   * stays reachable from the full-size photo in the detail panel.
   */
  zoomable?: boolean;
}) {
  const url = micImageUrl(kind);
  const ctxOpen = useContext(LightboxCtx);
  const open = zoomable ? ctxOpen : null;
  const [failed, setFailed] = useState(false);
  if (!url || failed) return <MicArt kind={kind} w={w} h={h} />;
  const tile = (
    <View style={[styles.photoTile, { width: w, height: h }]}>
      <Image
        source={{ uri: url }}
        style={styles.photo}
        resizeMode="contain"
        onError={() => setFailed(true)}
        accessibilityIgnoresInvertColors
        accessibilityLabel={`${kind} microphone photo`}
      />
      {open && w >= 40 ? (
        <View style={styles.zoomBadge} pointerEvents="none">
          <Text style={styles.zoomIcon}>⤢</Text>
        </View>
      ) : null}
    </View>
  );
  if (!open) return tile;
  return (
    <Pressable onPress={() => open(kind)} accessibilityRole="button" accessibilityLabel={`Enlarge ${kind} microphone photo`}>
      {tile}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Light product-card tile — the bucket photos are on seamless white, so a
  // white/near-white rounded tile makes that read as intentional on the dark UI.
  photoTile: { backgroundColor: '#f4f4f5', borderRadius: 7, overflow: 'hidden', padding: 3 },
  photo: { width: '100%', height: '100%' },
  // Small "tap to enlarge" hint, bottom-right of the photo.
  zoomBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 15,
    height: 15,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomIcon: { color: '#fff', fontSize: 10, lineHeight: 12 },
  // Fullscreen lightbox.
  lbBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  lbCard: { width: '92%', aspectRatio: 1, backgroundColor: '#f4f4f5', borderRadius: 14, overflow: 'hidden', padding: 10 },
  lbImage: { width: '100%', height: '100%' },
  lbClose: { position: 'absolute', top: 44, right: 22 },
  lbCloseX: { color: '#fff', fontSize: 26, fontWeight: '700' },
});
