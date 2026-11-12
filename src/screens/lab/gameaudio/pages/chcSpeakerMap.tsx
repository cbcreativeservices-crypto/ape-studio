/**
 * ChcSpeakerMap — page 13's read-only figure: a 5.1 loudspeaker layout seen
 * from above, with one listener in the middle. It is a PICTURE of a layout
 * (the caption says so): the phone is not sending surround channels.
 *
 * WHAT IS DRAWN, AND FROM WHERE (the lab's SOURCES file keeps the reference):
 * the 3/2 arrangement of Recommendation ITU-R BS.775 — center at 0°, left and
 * right at ±30°, the two surrounds inside its 100°–120° range (here ±110°),
 * every loudspeaker on one circle around the listener and turned to face the
 * listener. The recommendation gives the subwoofer (the ".1") no fixed place;
 * it is drawn on the floor near the front, as a common position. No angle is
 * printed on the figure: home and studio rooms differ, and the page teaches
 * the idea of a fixed layout, not a set-up procedure.
 *
 * Charter: upper-left light (every cabinet's gradient is turned back into
 * screen space, so a rotated cabinet is still lit from the upper left), rim
 * highlights, text at 9.5 pt whatever the figure's width, and an
 * accessibility label that says what the picture shows. Static: no motion.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../theme/tokens';
import { SceneFontsProvider, SceneText, useLabelMm } from '../../dj/art/sceneText';
import { PlayerBehind, PlayerInFront } from '../../miking/lessons/shared/players/PlayerFigure';
import { SINGER_TOP } from '../../miking/lessons/shared/voice/voicePose';

/** The figure's own space, in meters: x → right, y ↓ toward the back. */
const W = 6;
const H = 4.5;
const CX = 3;
const CY = 2.75;
/** The circle the five loudspeakers stand on. */
const R = 1.85;
const ASPECT = W / H;

type Spk = { id: string; name: string; deg: number; label: 'above' | 'below' };
/** Degrees clockwise from straight ahead (ITU-R BS.775: 0°, ±30°, ±110°). */
const SPEAKERS: readonly Spk[] = [
  { id: 'c', name: 'CENTER', deg: 0, label: 'below' },
  { id: 'l', name: 'LEFT', deg: -30, label: 'above' },
  { id: 'r', name: 'RIGHT', deg: 30, label: 'above' },
  { id: 'ls', name: 'LEFT SURROUND', deg: -110, label: 'below' },
  { id: 'rs', name: 'RIGHT SURROUND', deg: 110, label: 'below' },
];
const SUB = { x: 4.95, y: 0.8, size: 0.5 };
const BOX_W = 0.5;
const BOX_D = 0.36;

const at = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: CX + R * Math.sin(a), y: CY - R * Math.cos(a), a };
};

/** One loudspeaker cabinet from above, its front turned to the listener.
 *  Local +y is the front (toward the listener) once rotated by `a`. */
function Cabinet({ deg }: { deg: number }) {
  const { x, y, a } = at(deg);
  // the light comes from the upper left of the SCREEN: turn that direction
  // back into the cabinet's own rotated space
  const g = 0.3;
  const lx = g * (Math.cos(a) + Math.sin(a));
  const ly = g * (Math.cos(a) - Math.sin(a));
  return (
    <Group>
      <Group transform={[{ translateX: x + 0.05 }, { translateY: y + 0.07 }, { rotate: a }]}>
        <RoundedRect x={-BOX_W / 2} y={-BOX_D / 2} width={BOX_W} height={BOX_D} r={0.06} color="rgba(0,0,0,0.5)" />
      </Group>
      <Group transform={[{ translateX: x }, { translateY: y }, { rotate: a }]}>
        <RoundedRect x={-BOX_W / 2} y={-BOX_D / 2} width={BOX_W} height={BOX_D} r={0.06}>
          <LinearGradient start={vec(-lx, -ly)} end={vec(lx, ly)} colors={['#6a6f79', '#3a3d45', '#1d1f24']} />
        </RoundedRect>
        <RoundedRect x={-BOX_W / 2} y={-BOX_D / 2} width={BOX_W} height={BOX_D} r={0.06} style="stroke" strokeWidth={0.022} color="rgba(255,255,255,0.3)" />
        {/* the grille: the side the sound leaves from */}
        <RoundedRect x={-BOX_W / 2 + 0.045} y={BOX_D / 2 - 0.115} width={BOX_W - 0.09} height={0.085} r={0.03} color="#0c0d10" />
        <Line p1={vec(-BOX_W / 2 + 0.07, BOX_D / 2 - 0.1)} p2={vec(BOX_W / 2 - 0.07, BOX_D / 2 - 0.1)} color="rgba(255,198,77,0.75)" strokeWidth={0.02} />
      </Group>
    </Group>
  );
}

function Labels() {
  const size = useLabelMm(9.5);
  const line = size * 1.05;
  return (
    <Group>
      <SceneText x={CX} y={0.24} size={size} text="SCREEN" color="rgba(244,246,248,0.62)" face="label" align="center" />
      {SPEAKERS.map((s) => {
        const p = at(s.deg);
        const y = s.label === 'above' ? p.y - 0.34 : p.y + 0.3 + line;
        return <SceneText key={s.id} x={p.x} y={y} size={size} text={s.name} color="#f4f6f8" face="label" align="center" />;
      })}
      <SceneText x={SUB.x} y={SUB.y + SUB.size / 2 + 0.08 + line} size={size} text="SUBWOOFER" color="#f4f6f8" face="label" align="center" />
      <SceneText x={CX} y={CY + 0.62 + line} size={size} text="YOU" color={colors.amber} face="label" align="center" />
    </Group>
  );
}

const SPOKES = [0.14, 0.14] as const;

const A11Y =
  'A picture of a 5.1 speaker layout, seen from above. You sit in the middle and face a screen. Three speakers are in front of you: left, center and right. Two surround speakers are at your sides, a little behind you. One subwoofer stands on the floor near the front. Every speaker is turned to face you. This is a picture of a layout: the phone is not sending surround sound.';

export function ChcSpeakerMap() {
  const [w, setW] = useState(0);
  const h = Math.round(w / ASPECT);
  const k = w / W;
  const spokes = useMemo(() => SPEAKERS.map((s) => ({ id: s.id, ...at(s.deg) })), []);
  return (
    <View style={styles.wrap}>
      <View style={styles.glass} onLayout={(e) => setW(Math.max(0, Math.floor(e.nativeEvent.layout.width) - 2))} accessible accessibilityRole="image" accessibilityLabel={A11Y}>
        {w > 0 ? (
          <Canvas style={{ width: w, height: h }}>
            <SceneFontsProvider s={k}>
              <Group transform={[{ scale: k }]}>
                <RoundedRect x={0} y={0} width={W} height={H} r={0.16}>
                  <LinearGradient start={vec(0, 0)} end={vec(W, H)} colors={['#181b21', '#0d0f13', '#08090b']} />
                </RoundedRect>
                {/* the screen the listener faces */}
                <RoundedRect x={CX - 1.1 + 0.04} y={0.36} width={2.2} height={0.12} r={0.05} color="rgba(0,0,0,0.5)" />
                <RoundedRect x={CX - 1.1} y={0.32} width={2.2} height={0.12} r={0.05}>
                  <LinearGradient start={vec(CX - 1.1, 0.32)} end={vec(CX + 1.1, 0.44)} colors={['#5d7591', '#2c3a4c', '#18212c']} />
                </RoundedRect>
                <Line p1={vec(CX - 1.04, 0.345)} p2={vec(CX + 1.04, 0.345)} color="rgba(255,255,255,0.35)" strokeWidth={0.02} />
                {/* every loudspeaker is the same distance from the listener */}
                <Circle cx={CX} cy={CY} r={R} style="stroke" strokeWidth={0.03} color="rgba(111,168,255,0.5)">
                  <DashPathEffect intervals={[0.2, 0.16]} />
                </Circle>
                {spokes.map((p) => (
                  <Line key={p.id} p1={vec(CX, CY)} p2={vec(p.x, p.y)} color="rgba(244,246,248,0.2)" strokeWidth={0.025}>
                    <DashPathEffect intervals={[...SPOKES]} />
                  </Line>
                ))}
                {SPEAKERS.map((s) => (
                  <Cabinet key={s.id} deg={s.deg} />
                ))}
                {/* the subwoofer: a larger box on the floor, with its port */}
                <RoundedRect x={SUB.x - SUB.size / 2 + 0.06} y={SUB.y - SUB.size / 2 + 0.08} width={SUB.size} height={SUB.size} r={0.07} color="rgba(0,0,0,0.5)" />
                <RoundedRect x={SUB.x - SUB.size / 2} y={SUB.y - SUB.size / 2} width={SUB.size} height={SUB.size} r={0.07}>
                  <LinearGradient start={vec(SUB.x - 0.3, SUB.y - 0.3)} end={vec(SUB.x + 0.3, SUB.y + 0.3)} colors={['#6a6f79', '#33363d', '#17181c']} />
                </RoundedRect>
                <RoundedRect x={SUB.x - SUB.size / 2} y={SUB.y - SUB.size / 2} width={SUB.size} height={SUB.size} r={0.07} style="stroke" strokeWidth={0.022} color="rgba(255,255,255,0.3)" />
                <Circle cx={SUB.x + 0.11} cy={SUB.y + 0.11} r={0.075} color="#0a0b0d" />
                <Circle cx={SUB.x + 0.11} cy={SUB.y + 0.11} r={0.075} style="stroke" strokeWidth={0.018} color="rgba(255,255,255,0.22)" />
                {/* the listener: the house top-view figure, facing the screen */}
                <Circle cx={CX + 0.05} cy={CY + 0.08} r={0.36} color="rgba(0,0,0,0.42)" />
                <Circle cx={CX} cy={CY} r={0.52} style="stroke" strokeWidth={0.035} color={colors.amber} opacity={0.85} />
                <Group transform={[{ translateX: CX }, { translateY: CY }, { rotate: -Math.PI / 2 }, { scale: 0.0017 }]}>
                  <PlayerBehind pose={SINGER_TOP} />
                  <PlayerInFront pose={SINGER_TOP} hands={false} />
                </Group>
                <Labels />
              </Group>
            </SceneFontsProvider>
          </Canvas>
        ) : null}
      </View>
      <Text style={styles.head}>A PICTURE OF A 5.1 SPEAKER LAYOUT</Text>
      <Text style={styles.cap}>Five speakers around one listener, and a subwoofer for the lowest sounds. This is a picture of a layout: your phone is not sending surround.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  glass: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#08090b', overflow: 'hidden', aspectRatio: ASPECT },
  head: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.4 },
  cap: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
});
