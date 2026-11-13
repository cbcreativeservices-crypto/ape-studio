/**
 * bKit — the glass every hudB strip is drawn on, and its type and colors.
 *
 * A strip is laid out in UNITS: 48 units high (GA_HUD_H), `w / k` wide, where
 * k = h / 48 is 1 on a phone and 1.5 in FULL SCREEN. One scaled Skia group,
 * so in full screen every line and every word grows together. Words go
 * through the scene's own SceneText (dj/art): the same two faces as the
 * picture above the strip, and nothing under 9 pt is ever drawn.
 *
 * Read-only: the glass takes no touch (pointerEvents none), and says what it
 * shows in its accessibility label.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Canvas, Group, Line, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import { SceneFontsProvider, SceneText } from '../../../dj/art/sceneText';
import { GA_HUD_H } from './gaHudTypes';

/** The strip's height in units. */
export const BH = GA_HUD_H;
/** The smallest word on a strip, in units (= points on a phone). */
export const B_TEXT = 9.5;

export const B = {
  /** The strip's face: the same recessed band, lit from the upper left, as
   *  the other strips of this lab (cKit.StripFace). */
  ground: '#0c0d11',
  groundHi: '#16171d',
  rim: '#2f313a',
  rimDark: '#050506',
  ink: '#f4f6f8',
  sub: '#a6a6ad',
  muted: '#8a8b93',
  rule: '#3a3b43',
  hair: '#26272d',
  well: '#0b0c0f',
  amber: '#ffc64d',
  guide: '#9fd0ff',
  layer: '#c4a2ff',
  refuse: '#ff5a48',
} as const;

export function BGlass({ w, h, label, children }: { w: number; h: number; label: string; children: (W: number) => ReactNode }) {
  const k = h / BH;
  const W = w / k;
  return (
    <View style={{ width: w, height: h }} pointerEvents="none" accessible accessibilityRole="image" accessibilityLabel={label}>
      <Canvas style={{ width: w, height: h }}>
        <SceneFontsProvider s={k} textScale={1}>
          <Group transform={[{ scale: k }]}>
            <Rect x={0} y={0} width={W} height={BH}>
              <LinearGradient start={vec(0, 0)} end={vec(W * 0.6, BH)} colors={[B.groundHi, B.ground]} />
            </Rect>
            <Line p1={vec(0, 0.5)} p2={vec(W, 0.5)} color={B.rim} strokeWidth={1} />
            <Line p1={vec(0, BH - 0.5)} p2={vec(W, BH - 0.5)} color={B.rimDark} strokeWidth={1} />
            {children(W)}
          </Group>
        </SceneFontsProvider>
      </Canvas>
    </View>
  );
}

/** A word on the strip. `y` is the baseline. Names in the label face, numbers
 *  in the mono face. */
export function BText({ x, y, text, color = B.sub, face = 'label', align = 'left', size = B_TEXT, slot, opacity }: {
  x: number;
  y: number;
  text: string | SharedValue<string>;
  color?: string;
  face?: 'label' | 'mono';
  align?: 'left' | 'center' | 'right';
  size?: number;
  slot?: number;
  opacity?: number;
}) {
  return <SceneText x={x} y={y} size={size} text={text} color={color} face={face} align={align} slot={slot} opacity={opacity} />;
}
