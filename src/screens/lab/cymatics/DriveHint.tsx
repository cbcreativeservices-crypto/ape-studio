/**
 * DriveHint — "press play to drive the plate" (slider HOLD #19, owner
 * 2026-10-14). The plate and the drum only move while they are DRIVEN (the
 * tone, or the silent drive); with nothing driving, a fader move changes the
 * physics but the picture holds still, and the learner read it as a dead
 * slider. This line on the glass says why, and goes away the moment a drive
 * starts. Physics untouched — it only reads `driving`.
 *
 * Read-only chrome: never takes a touch (the plate's exciter / support and
 * the drum's strike point stay draggable under it), pinned to the TOP edge so
 * the settled sand / the head stays readable. ≥ 9 pt at any text scale.
 * Low-Light Production Mode: nothing auto-appears — `useOverlaysSuppressed`
 * hides it (the well's caption still carries the same instruction).
 */
import { StyleSheet, Text, View } from 'react-native';
import { useOverlaysSuppressed } from '../../../features/dev/popupSuppressStore';
import { fonts } from '../../../theme/tokens';
import { useStageTextScale } from '../rack/stageAspect';

/** Hint wording per surface — the owner's default, "press play to drive the plate". */
export function driveHintText(what: 'plate' | 'drum head' | 'cone'): string {
  return `PRESS ▶ PLAY TO DRIVE THE ${what.toUpperCase()}`;
}

export function DriveHint({
  driving,
  canPlay = true,
  what,
  silentKey,
  top = 6,
}: {
  /** The same `driving` the physics is gated on. */
  driving: boolean;
  /** The tone engine is ready (▶ works). Without it only the silent drive
   *  moves the picture, so the hint names that instead of a dead ▶. */
  canPlay?: boolean;
  what: 'plate' | 'drum head' | 'cone';
  /** Where the silent drive lives, e.g. "DRIVE › SILENT". */
  silentKey: string;
  /** Glass px from the top (before the text scale) — clears on-glass labels. */
  top?: number;
}) {
  const suppressed = useOverlaysSuppressed();
  const ts = useStageTextScale();
  if (driving || suppressed) return null;
  const main = canPlay ? driveHintText(what) : `${silentKey} TO DRIVE THE ${what.toUpperCase()}`;
  const sub = canPlay ? `or ${silentKey} — moves it without sound` : 'the tone is not available — the picture still moves';
  return (
    <View pointerEvents="none" style={[styles.wrap, { top: top * ts }]}>
      <View style={styles.pill} accessible accessibilityRole="text" accessibilityLabel={`${main}. ${sub}.`}>
        <Text style={[styles.main, { fontSize: 11 * ts }]}>{main}</Text>
        <Text style={[styles.sub, { fontSize: 9.5 * ts }]}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 10 },
  pill: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(13,14,18,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,0.45)',
  },
  main: { fontFamily: fonts.oswaldSemiBold, letterSpacing: 1.2, color: '#ffc64d', textAlign: 'center' },
  sub: { fontFamily: fonts.barlowRegular, color: 'rgba(255,255,255,0.72)', textAlign: 'center' },
});
