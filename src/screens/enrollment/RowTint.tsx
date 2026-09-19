/**
 * RowTint — the faint wash behind a requirement row.
 *
 * The requirement list is a long run of identical dark cards, and two kinds
 * of row in it are not ordinary topics: the lab, which is advanced somewhere
 * else entirely, and the co-requisites everything depends on. A tint says so
 * at a glance without another badge competing for the row.
 *
 * ── ⛔ THE ANIMATION IS REMOVED, NOT DISABLED (owner 2026-09-19: "remove
 * background animations for now, just leave the light tint") ──────────────
 * It used to breathe very slowly — a 16-second cycle, a 0.55–1.0 band, each
 * row phase-shifted off its gs so a run of them did not pulse as one. All of
 * that is gone rather than left behind a flag, because a switched-off
 * animation is code nobody reads and every prop it needed (`phase`, the
 * reduced-motion and Low-Light gates, the Animated value) is dead weight
 * around a coloured rectangle.
 *
 * ⚠️ IT IS IN THE HISTORY, NOT LOST. `git show eab7fdfd` is the full
 * breathing version if the owner wants it back — that is the point of "for
 * now", and it is cheaper to restore from there than to carry it switched
 * off. Restoring it also means restoring the MOTION GATES with it: it must
 * not run under reduced motion, or in Low-Light Production Mode where
 * nothing may draw attention to itself unbidden.
 *
 * ⚠️ NO `overflow: 'hidden'` ON THE CARD. That is the obvious way to keep a
 * wash inside the corners, and on the lab row it would also clip
 * LabScopeSweep, whose trace is meant to straddle the frame line. The tint
 * carries its own borderRadius instead.
 */
import { StyleSheet, View } from 'react-native';

/** Matches `card`'s radius so the wash stops at the corners. */
const RADIUS = 11;

export function RowTint({ color }: { color: string }) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: color, borderRadius: RADIUS }]}
    />
  );
}

/**
 * The two tints.
 *
 * Both are faint on purpose: they sit ON TOP of the card's own background, so
 * what you see is the card colour lifted slightly, not a coloured panel. Pick
 * a stronger alpha and the row stops looking like part of the list.
 */
export const LAB_TINT = 'rgba(127,191,255,0.10)';
export const COREQ_TINT = 'rgba(255,255,255,0.055)';
