/**
 * StaticLabels — part labels over a canvas whose transform does NOT move
 * (the foundation scenes: HOW IT SOUNDS, THE SETTING). The same look and the
 * same collision rule as PlacementScene's labels (labelLayout.fitLabels): the
 * full words if they fit, else the short form, else nothing. Text is never
 * under 9 pt (P14): 9.5 × the full-screen text scale.
 */
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../../theme/tokens';
import { fitValue } from '../../../../../theme/legibility';
import type { ViewXform } from '../geometry/frame.ts';
import { fitLabels, labelWidth } from './labelLayout.ts';

export type StaticLabel = { id: string; text: string; short?: string; u: number; v: number; align: 'left' | 'center' | 'right'; tone?: 'muted' | 'illustrative' | 'amber' | 'blue' | 'inkBlue' | 'inkAmber' };

/** ink* = dark marks for a LIGHT surface (a coated drumhead), with a light halo. */
const TONE = { muted: colors.textMuted, illustrative: '#aab0bd', amber: '#ffc64d', blue: '#8fbcff', inkBlue: '#123f8c', inkAmber: '#7a4a00' } as const;

export function StaticLabels({ labels, xf, scale, w }: { labels: StaticLabel[]; xf: ViewXform; scale: number; w: number }) {
  const kept = fitLabels(labels, xf, scale, w);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {kept.map((l) => {
        const W = labelWidth(l.text, scale, w);
        const x = xf.ox + l.u * xf.s;
        const left = Math.max(2, Math.min(w - W - 2, l.align === 'left' ? x : l.align === 'right' ? x - W : x - W / 2));
        const top = xf.oy + l.v * xf.s - 7 * scale;
        return (
          <Text
            key={l.id}
            style={[styles.label, { left, top, width: W, fontSize: Math.max(9, 9.5 * scale), textAlign: l.align, color: l.tone ? TONE[l.tone] : colors.textPrimary }, (l.tone === 'inkBlue' || l.tone === 'inkAmber') && styles.ink]}
            {...fitValue(Math.max(9, 9.5 * scale))}
          >
            {l.text}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  ink: { textShadowColor: 'rgba(255,255,255,0.9)', fontFamily: fonts.oswaldSemiBold },
  label: { position: 'absolute', fontFamily: fonts.oswaldMedium, letterSpacing: 0.8, textShadowColor: 'rgba(0,0,0,0.95)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 0 } },
});
