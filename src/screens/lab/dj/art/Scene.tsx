/**
 * Scene — one Skia canvas showing a FRAME of millimetre-authored drawings,
 * fitted to the glass (w × h) by one transform, with React Native callouts
 * (≥ 9.5 pt) joined to their parts by thin leaders. Every lab stage is a
 * Scene: the booth (BoothStage), the rear panels, the system map, the
 * equipment catalogue. FULL SCREEN simply hands it a bigger (w, h): every
 * anchor and label stays aligned at every size.
 *
 * React context does not cross into the Skia reconciler, so the motion clock
 * and the scene fonts are provided again INSIDE the canvas.
 */
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Group, Line, LinearGradient, Rect, Skia, vec } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../theme/tokens';
import { fitValue } from '../../../../theme/legibility';
import { fitView, type Box, type Pt } from '../geometry/boothGeometry';
import { MotionContext, type BoothMotion } from './motion';
import { SceneFontsProvider } from './sceneText';

export type Callout = {
  id: string;
  text: string;
  /** The part, in scene mm. */
  at: Pt;
  /** Where the words sit, in points from the part (the leader joins them). */
  dx: number;
  dy: number;
  tone?: 'amber' | 'plain' | 'blue' | 'red' | 'green';
};

const TONE = { amber: colors.amber, plain: colors.textPrimary, blue: '#8fbcff', red: '#ff8a7e', green: '#7dff9f' } as const;
const EDGE = { amber: 'rgba(255,198,77,0.5)', plain: 'rgba(255,255,255,0.3)', blue: 'rgba(143,188,255,0.55)', red: 'rgba(255,138,126,0.6)', green: 'rgba(125,255,159,0.55)' } as const;

export function Scene({ w, h, frame, motion, callouts = [], screenOverlay, a11y, children, pad = 6, fit }: {
  w: number;
  h: number;
  frame: Box;
  motion: BoothMotion;
  callouts?: readonly Callout[];
  screenOverlay?: (w: number, h: number, xf: { s: number; ox: number; oy: number }) => ReactNode;
  a11y: string;
  children: ReactNode;
  pad?: number;
  /** The part of the glass (points) the frame is fitted into — a stage that
   *  shares the glass with a plot keeps its drawing out of the plot's area. */
  fit?: { x: number; y: number; w: number; h: number };
}) {
  const xf = useMemo(() => {
    const f = fit ?? { x: 0, y: 0, w, h };
    const v = fitView(frame, f.w, f.h, pad);
    return { s: v.s, ox: v.ox + f.x, oy: v.oy + f.y };
  }, [frame, w, h, pad, fit?.x, fit?.y, fit?.w, fit?.h]);
  const { s, ox, oy } = xf;
  const toScreen = (p: Pt) => ({ x: ox + p.x * s, y: oy + p.y * s });
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
        <Rect x={0} y={0} width={w} height={h}>
          <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={['#0e0f13', '#08080a']} />
        </Rect>
        <MotionContext.Provider value={motion}>
          <SceneFontsProvider s={s}>
            <Group clip={fit ? Skia.XYWHRect(fit.x, fit.y, fit.w, fit.h) : undefined}>
              <Group transform={[{ translateX: ox }, { translateY: oy }, { scale: s }]}>{children}</Group>
            </Group>
          </SceneFontsProvider>
          {/* screen-space overlays (plots, panels) draw at 1 pt per unit */}
          {screenOverlay ? <SceneFontsProvider s={1}>{screenOverlay(w, h, xf)}</SceneFontsProvider> : null}
        </MotionContext.Provider>
        {callouts.map((c) => {
          const p = toScreen(c.at);
          return <Line key={`l${c.id}`} p1={vec(p.x, p.y)} p2={vec(p.x + c.dx, p.y + c.dy)} color={EDGE[c.tone ?? 'amber']} strokeWidth={1} />;
        })}
      </Canvas>
      {callouts.map((c) => {
        const p = toScreen(c.at);
        const left = c.dx < 0;
        const centre = c.dx === 0;
        return (
          <View
            key={c.id}
            pointerEvents="none"
            style={[
              styles.callout,
              { borderColor: EDGE[c.tone ?? 'amber'], top: p.y + c.dy - 9 },
              centre ? { left: p.x - 60, width: 120, alignItems: 'center', backgroundColor: 'transparent', borderWidth: 0 } : left ? { right: w - (p.x + c.dx) } : { left: p.x + c.dx },
            ]}
          >
            <Text style={[styles.calloutText, centre && styles.calloutPill, { color: TONE[c.tone ?? 'amber'], borderColor: EDGE[c.tone ?? 'amber'] }]} {...fitValue(10.5)}>
              {c.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  callout: { position: 'absolute', backgroundColor: 'rgba(8,8,10,0.88)', borderRadius: 5, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1.5, maxWidth: 150 },
  calloutText: { fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.6 },
  calloutPill: { backgroundColor: 'rgba(8,8,10,0.88)', borderRadius: 5, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1.5, overflow: 'hidden' },
});
