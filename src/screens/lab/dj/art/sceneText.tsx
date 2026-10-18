/**
 * sceneText — text drawn INSIDE a booth scene (a player's screen readouts,
 * a panel legend) in Skia, at a size given in millimetres. House rule P14:
 * nothing renders under 9 pt on a phone, so a text whose rendered size
 * (mm × the scene's pt-per-mm) would fall below 9 pt is simply not drawn —
 * the bezel or the well carries that number instead.
 *
 * One 10-unit font per face is loaded per scene (useSafeSkiaFont, so a
 * failed fetch reads as "not loaded"); each text is scaled from it.
 */
import { createContext, useContext, type ReactNode } from 'react';
import { Group, Text, type SkFont } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import { useSafeSkiaFont } from '../../../../lib/skiaSafeAssets';

const MONO_TTF = require('@expo-google-fonts/share-tech-mono/400Regular/ShareTechMono_400Regular.ttf');
const LABEL_TTF = require('@expo-google-fonts/oswald/600SemiBold/Oswald_600SemiBold.ttf');

/** The house floor for display text, in points. */
export const MIN_TEXT_PT = 9;

export type SceneFonts = { mono: SkFont | null; label: SkFont | null; s: number };
export const SceneFontsContext = createContext<SceneFonts>({ mono: null, label: null, s: 1 });

export function SceneFontsProvider({ s, children }: { s: number; children: ReactNode }) {
  const mono = useSafeSkiaFont(MONO_TTF, 10);
  const label = useSafeSkiaFont(LABEL_TTF, 10);
  return <SceneFontsContext.Provider value={{ mono, label, s }}>{children}</SceneFontsContext.Provider>;
}

/** Will `sizeMm` text render at or above the floor in this scene? */
export function useTextFits(sizeMm: number): boolean {
  const { s } = useContext(SceneFontsContext);
  return sizeMm * s >= MIN_TEXT_PT;
}

/**
 * Text at (x, y) (mm; y = baseline), `size` mm tall (font size). `align`
 * centre/right measure the string. A SharedValue string updates per frame
 * (time readouts) without React state.
 */
export function SceneText({ x, y, size, text, color, face = 'mono', align = 'left', minPt = MIN_TEXT_PT }: {
  x: number;
  y: number;
  size: number;
  text: string | SharedValue<string>;
  color: string;
  face?: 'mono' | 'label';
  align?: 'left' | 'center' | 'right';
  minPt?: number;
}) {
  const f = useContext(SceneFontsContext);
  const font = face === 'mono' ? f.mono : f.label;
  if (!font || size * f.s < minPt) return null;
  const k = size / 10;
  let dx = 0;
  if (align !== 'left' && typeof text === 'string') {
    const w = font.getTextWidth(text);
    dx = align === 'center' ? -w / 2 : -w;
  }
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: k }]}>
      <Text x={dx} y={0} text={text} font={font} color={color} />
    </Group>
  );
}
