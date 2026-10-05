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
import { fitLabels, labelRect, labelWidth, leaderLine } from './labelLayout.ts';

/** `lead`: the part the label names (u, v) — a thin leader runs back to it. */
export type StaticLabel = { id: string; text: string; short?: string; u: number; v: number; align: 'left' | 'center' | 'right'; tone?: 'muted' | 'illustrative' | 'amber' | 'blue' | 'inkBlue' | 'inkAmber'; lead?: { u: number; v: number } };

/** ink* = dark marks for a LIGHT surface (a coated drumhead), with a light halo. */
const TONE = { muted: colors.textMuted, illustrative: '#aab0bd', amber: '#ffc64d', blue: '#8fbcff', inkBlue: '#123f8c', inkAmber: '#7a4a00' } as const;

export function StaticLabels({ labels, xf, scale, w }: { labels: StaticLabel[]; xf: ViewXform; scale: number; w: number }) {
  const kept = fitLabels(labels, xf, scale, w);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {kept.map((l) => {
        // A leader (a hairline View, turned) from the box to the part it names.
        const ln = l.lead ? leaderLine(labelRect(l, xf, scale, w), xf, l.lead) : null;
        if (!ln) return null;
        const len = Math.hypot(ln.x2 - ln.x1, ln.y2 - ln.y1);
        const ang = Math.atan2(ln.y2 - ln.y1, ln.x2 - ln.x1);
        return <View key={`${l.id}:lead`} style={[styles.leader, { left: (ln.x1 + ln.x2) / 2 - len / 2, top: (ln.y1 + ln.y2) / 2 - 0.4, width: len, transform: [{ rotate: `${ang}rad` }] }]} />;
      })}
      {kept.map((l) => {
        // A one-glyph mark (+ / −) gets room to breathe: fitValue never shrinks it.
        const W = Math.max(22 * scale, labelWidth(l.text, scale, w));
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
  leader: { position: 'absolute', height: 0.8, backgroundColor: 'rgba(225,228,235,0.55)' },
  ink: { textShadowColor: 'rgba(255,255,255,0.9)', fontFamily: fonts.oswaldSemiBold },
  label: { position: 'absolute', fontFamily: fonts.oswaldMedium, letterSpacing: 0.8, textShadowColor: 'rgba(0,0,0,0.95)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 0 } },
});
