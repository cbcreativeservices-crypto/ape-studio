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
import { fitLabels, labelWidth, leaderEnd } from './labelLayout.ts';

export type StaticLabel = {
  id: string;
  text: string;
  short?: string;
  u: number;
  v: number;
  align: 'left' | 'center' | 'right';
  tone?: 'muted' | 'illustrative' | 'amber' | 'blue' | 'inkBlue' | 'inkAmber';
  alts?: readonly { u: number; v: number; align: 'left' | 'center' | 'right' }[];
  at?: { u: number; v: number };
  /** The Lab 4 review's name for `at`. */
  lead?: { u: number; v: number };
};

/** ink* = dark marks for a LIGHT surface (a coated drumhead), with a light halo. */
const TONE = { muted: colors.textMuted, illustrative: '#aab0bd', amber: '#ffc64d', blue: '#8fbcff', inkBlue: '#123f8c', inkAmber: '#7a4a00' } as const;

/** `laidOut`: the labels come already placed (artLabels.layoutArtLabels —
 *  level of detail, clear of the drawing); draw them as they are. */
export function StaticLabels({ labels, xf, scale, w, laidOut = false }: { labels: (StaticLabel & { leader?: { u: number; v: number } })[]; xf: ViewXform; scale: number; w: number; laidOut?: boolean }) {
  const kept = laidOut ? labels : fitLabels(labels, xf, scale, w);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {kept.map((l) => {
        // A one-glyph mark (+ / −) gets room to breathe: fitValue never shrinks it.
        const W = Math.max(22 * scale, labelWidth(l.text, scale, w));
        const x = xf.ox + l.u * xf.s;
        const left = Math.max(2, Math.min(w - W - 2, l.align === 'left' ? x : l.align === 'right' ? x - W : x - W / 2));
        const top = xf.oy + l.v * xf.s - 7 * scale;
        // A label moved off its part: a thin leader from the part to the words.
        const lead = l.leader ? leaderEnd({ x0: left + 3, x1: left + W - 3, y0: top + 2, y1: top + 9.5 * scale * 1.25 - 2 }, xf.ox + l.leader.u * xf.s, xf.oy + l.leader.v * xf.s) : null;
        const ax = l.leader ? xf.ox + l.leader.u * xf.s : 0;
        const ay = l.leader ? xf.oy + l.leader.v * xf.s : 0;
        const len = lead ? Math.hypot(lead.x - ax, lead.y - ay) : 0;
        return [
          lead && len > 2 ? (
            <View
              key={`${l.id}:lead`}
              style={[styles.lead, { left: (ax + lead.x) / 2 - len / 2, top: (ay + lead.y) / 2 - 0.6, width: len, transform: [{ rotate: `${Math.atan2(lead.y - ay, lead.x - ax)}rad` }] }]}
            />
          ) : null,
          lead ? <View key={`${l.id}:dot`} style={[styles.dot, { left: ax - 2.5, top: ay - 2.5 }]} /> : null,
          <Text
            key={l.id}
            style={[styles.label, { left, top, width: W, fontSize: Math.max(9, 9.5 * scale), textAlign: l.align, color: l.tone ? TONE[l.tone] : colors.textPrimary }, (l.tone === 'inkBlue' || l.tone === 'inkAmber') && styles.ink]}
            {...fitValue(Math.max(9, 9.5 * scale))}
          >
            {l.text}
          </Text>,
        ];
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { position: 'absolute', height: 1.2, backgroundColor: 'rgba(255,198,77,0.85)' },
  dot: { position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,198,77,0.9)' },
  ink: { textShadowColor: 'rgba(255,255,255,0.9)', fontFamily: fonts.oswaldSemiBold },
  label: { position: 'absolute', fontFamily: fonts.oswaldMedium, letterSpacing: 0.8, textShadowColor: 'rgba(0,0,0,0.95)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 0 } },
});
