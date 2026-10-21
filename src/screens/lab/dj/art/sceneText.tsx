/**
 * sceneText — text drawn INSIDE a booth scene (a player's screen readouts,
 * a panel legend) in Skia, at a size given in millimetres. House rule P14:
 * nothing renders under 9 pt on a phone, so a text whose rendered size
 * (mm × the scene's pt-per-mm) would fall below 9 pt is simply not drawn —
 * the bezel or the well carries that number instead. This is the LEVEL OF
 * DETAIL of the silk-screen legends: authored at their real size (about
 * 3–4 mm type, 2.3–2.8 mm capitals), they appear as the learner zooms in.
 *
 * FONTS are loaded ONCE for the whole lab (a module cache): every scene
 * canvas after the first has its type on its first frame, so titles and
 * readouts never pop in late (visual review 2026-10-18, finding 23). A failed
 * load reads as "not loaded" (the guarded loader of lib/skiaSafeAssets).
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Group, Skia, Text, loadData, type SkData, type SkFont, type SkTypeface } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';

const MONO_TTF = require('@expo-google-fonts/share-tech-mono/400Regular/ShareTechMono_400Regular.ttf');
const LABEL_TTF = require('@expo-google-fonts/oswald/600SemiBold/Oswald_600SemiBold.ttf');

/** The house floor for display text, in points. */
export const MIN_TEXT_PT = 9;

export type SceneFonts = { mono: SkFont | null; label: SkFont | null; s: number; textScale: number };
export const SceneFontsContext = createContext<SceneFonts>({ mono: null, label: null, s: 1, textScale: 1 });

type Face = 'mono' | 'label';
const SRC: Record<Face, number> = { mono: MONO_TTF, label: LABEL_TTF };
const fontCache: Partial<Record<Face, SkFont>> = {};
const pending: Partial<Record<Face, Promise<SkFont | null>>> = {};
const typefaceFactory = (d: SkData) => Skia.Typeface.MakeFreeTypeFaceFromData(d);

function loadFace(face: Face): Promise<SkFont | null> {
  if (fontCache[face]) return Promise.resolve(fontCache[face]!);
  if (!pending[face]) {
    pending[face] = loadData<SkTypeface>(SRC[face], typefaceFactory)
      .then((tf) => {
        if (!tf) return null;
        const f = Skia.Font(tf, 10);
        fontCache[face] = f;
        return f;
      })
      .catch(() => {
        pending[face] = undefined; // a later scene may try again
        return null;
      });
  }
  return pending[face]!;
}

/** One 10-unit font per face, shared by every scene of the lab. */
function useSceneFont(face: Face): SkFont | null {
  const [f, setF] = useState<SkFont | null>(() => fontCache[face] ?? null);
  useEffect(() => {
    if (f) return;
    let live = true;
    void loadFace(face).then((v) => {
      if (live && v) setF(v);
    });
    return () => {
      live = false;
    };
  }, [face, f]);
  return f;
}

export function SceneFontsProvider({ s, textScale = 1, children }: { s: number; textScale?: number; children: ReactNode }) {
  const mono = useSceneFont('mono');
  const label = useSceneFont('label');
  return <SceneFontsContext.Provider value={{ mono, label, s, textScale }}>{children}</SceneFontsContext.Provider>;
}

/** Will `sizeMm` text render at or above the floor in this scene? */
export function useTextFits(sizeMm: number): boolean {
  const { s } = useContext(SceneFontsContext);
  return sizeMm * s >= MIN_TEXT_PT - 1e-3;
}

/** The mm size that renders `pt` points on the glass, growing with the
 *  full-screen zoom (D35: everything zooms) — for flags and tags that must
 *  always read, whatever the scene's scale. */
export function useLabelMm(pt: number): number {
  const { s, textScale } = useContext(SceneFontsContext);
  return (pt * textScale) / Math.max(1e-6, s);
}

/**
 * Text at (x, y) (mm; y = baseline), `size` mm tall (font size). `align`
 * centre/right measure the string. A SharedValue string updates per frame
 * (time readouts) without React state; to right-align one, give it a
 * fixed-width `slot` (characters, the mono face) and pad the string to that
 * width — a moving number then never runs out of its window (D36).
 */
export function SceneText({ x, y, size, text, color, face = 'mono', align = 'left', minPt = MIN_TEXT_PT, slot, opacity }: {
  x: number;
  y: number;
  size: number;
  text: string | SharedValue<string>;
  color: string;
  face?: Face;
  align?: 'left' | 'center' | 'right';
  minPt?: number;
  slot?: number;
  opacity?: number;
}) {
  const f = useContext(SceneFontsContext);
  const font = face === 'mono' ? f.mono : f.label;
  // the floor is compared with a rounding tolerance ONCE, here (visual review
  // 2026-10-18 #29): a size authored at exactly 9 pt never needs a minPt below 9
  if (!font || size * f.s < minPt - 1e-3) return null;
  const k = size / 10;
  let dx = 0;
  if (align !== 'left') {
    const w = typeof text === 'string' ? font.getTextWidth(text) : slot ? font.getTextWidth('0'.repeat(slot)) : 0;
    dx = align === 'center' ? -w / 2 : -w;
  }
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: k }]} opacity={opacity}>
      <Text x={dx} y={0} text={text} font={font} color={color} />
    </Group>
  );
}

/** Text width in mm at `size` (0 before the font loads). */
export function useTextWidthMm(text: string, size: number, face: Face = 'label'): number {
  const f = useContext(SceneFontsContext);
  const font = face === 'mono' ? f.mono : f.label;
  return font ? (font.getTextWidth(text) * size) / 10 : text.length * size * 0.5;
}
