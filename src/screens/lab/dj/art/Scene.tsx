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
import { Canvas, Circle, Group, Line, LinearGradient, Rect, Skia, vec } from '@shopify/react-native-skia';
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
  const boxes = useMemo(() => layoutCallouts(callouts, toScreen, w, h), [callouts, ox, oy, s, w, h]);
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
        {boxes.map((b) => (
          <Group key={`l${b.c.id}`}>
            <Line p1={vec(b.px, b.py)} p2={vec(b.lx, b.ly)} color={EDGE[b.c.tone ?? 'amber']} strokeWidth={1} />
            <Circle cx={b.px} cy={b.py} r={1.8} color={EDGE[b.c.tone ?? 'amber']} />
          </Group>
        ))}
      </Canvas>
      {boxes.map((b) => (
        <View key={b.c.id} pointerEvents="none" style={[styles.callout, { borderColor: EDGE[b.c.tone ?? 'amber'], left: b.x, top: b.y, width: b.w }]}>
          <Text style={[styles.calloutText, { color: TONE[b.c.tone ?? 'amber'] }]} {...fitValue(10.5)}>
            {b.c.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Callout boxes: placed at the part + (dx, dy), kept inside the glass, pushed
 *  apart when two would overlap, each with a leader from its part to the
 *  nearest point of its box. */
const CH = 18;
function layoutCallouts(cs: readonly Callout[], toScreen: (p: Pt) => { x: number; y: number }, w: number, h: number) {
  const out = cs.map((c) => {
    const p = toScreen(c.at);
    const bw = Math.min(160, Math.round(c.text.length * 6.4 + 14));
    const qx = p.x + c.dx;
    const qy = p.y + c.dy;
    let x = c.dx < 0 ? qx - bw : c.dx > 0 ? qx : qx - bw / 2;
    let y = qy - CH / 2;
    x = Math.max(3, Math.min(w - bw - 3, x));
    y = Math.max(3, Math.min(h - CH - 3, y));
    return { c, px: p.x, py: p.y, x, y, w: bw, lx: 0, ly: 0 };
  });
  // push apart, top to bottom
  const order = [...out].sort((a, b) => a.y - b.y);
  for (let i = 0; i < order.length; i++) {
    for (let j = 0; j < i; j++) {
      const a = order[j];
      const b = order[i];
      const overlapX = a.x < b.x + b.w + 2 && b.x < a.x + a.w + 2;
      const overlapY = a.y < b.y + CH + 2 && b.y < a.y + CH + 2;
      if (overlapX && overlapY) b.y = Math.min(h - CH - 3, a.y + CH + 3);
    }
  }
  for (const b of out) {
    b.lx = Math.max(b.x, Math.min(b.x + b.w, b.px));
    b.ly = Math.max(b.y, Math.min(b.y + CH, b.py));
  }
  return out;
}

const styles = StyleSheet.create({
  callout: { position: 'absolute', height: CH, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(8,8,10,0.88)', borderRadius: 5, borderWidth: 1, paddingHorizontal: 4 },
  calloutText: { fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.6 },
});
