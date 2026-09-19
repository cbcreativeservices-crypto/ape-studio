/**
 * RowTint — the faint, slowly breathing wash behind a requirement row
 * (owner 2026-09-19: "light fill the labs container with light blue, fill the
 * pre-req containers with a light gray, make both background animate very
 * subtley").
 *
 * The requirement list is long and every row is the same dark card, so the
 * two kinds that are NOT ordinary topics — the lab, and the co-requisites
 * everything depends on — need to read as different at a glance. A tint does
 * that without another badge or another line of copy competing for the row.
 *
 * ── ⛔ "VERY SUBTLE" IS A SPEC, NOT A MOOD ─────────────────────────────────
 * The band is deliberately tiny and the cycle deliberately long: at ~8s a
 * side the change is below the rate at which the eye reports motion, so the
 * card looks alive when you rest on it and never pulls your attention off
 * the row you are reading. Anything faster, or any wider a band, turns a
 * list of study topics into a row of blinking lights.
 *
 * Each row is given a PHASE so a list of them does not breathe in lockstep —
 * in unison the whole list reads as one flashing panel, which is the exact
 * thing the subtlety is for avoiding.
 *
 * ── ⛔ MOTION GATES ────────────────────────────────────────────────────────
 * Under reduced motion, and in Low-Light Production Mode where nothing may
 * draw attention to itself unbidden, this renders a STATIC fill at the
 * middle of the band. The tint still does its job — the row is still marked
 * — it simply stops moving. Never render nothing: the colour is the point,
 * the motion is the decoration.
 *
 * ⚠️ NO `overflow: 'hidden'` ON THE CARD. It would be the obvious way to
 * keep this inside the corners, and on the lab row it would also clip
 * LabScopeSweep, whose trace is meant to straddle the frame line. The tint
 * carries its own borderRadius instead.
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { animationsAllowed } from '../../features/settings/a11y';
import { useOverlaysSuppressed } from '../../features/dev/popupSuppressStore';

/** One direction of the breath. A full cycle is twice this. */
const HALF_CYCLE_MS = 8000;
/** The band, as multipliers on the tint colour's own alpha. */
const DIM = 0.55;
const BRIGHT = 1;
/** Matches `card`'s radius so the wash stops at the corners. */
const RADIUS = 11;

export function RowTint({
  color,
  phase = 0,
}: {
  /** The fill, already faint — this only scales its opacity. */
  color: string;
  /** 0–1, offsets this row's breath so a list does not pulse as one. */
  phase?: number;
}) {
  const t = useRef(new Animated.Value(0)).current;
  const suppressed = useOverlaysSuppressed();
  const still = suppressed || !animationsAllowed();

  useEffect(() => {
    if (still) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: HALF_CYCLE_MS, useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: HALF_CYCLE_MS, useNativeDriver: true }),
      ]),
    );
    // The phase is a delayed start rather than a different speed: same rhythm
    // everywhere, just not the same instant.
    const kick = setTimeout(() => loop.start(), Math.round(phase * HALF_CYCLE_MS));
    return () => {
      clearTimeout(kick);
      loop.stop();
    };
  }, [still, t, phase]);

  const opacity = still
    ? (DIM + BRIGHT) / 2
    : t.interpolate({ inputRange: [0, 1], outputRange: [DIM, BRIGHT] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: color, borderRadius: RADIUS, opacity }]}
    />
  );
}

/**
 * The two tints, kept here beside the component that scales them.
 *
 * Both are faint on purpose: they sit ON TOP of the card's own background, so
 * what you see is the card colour lifted slightly, not a coloured panel. Pick
 * a stronger alpha and the row stops looking like part of the list.
 */
export const LAB_TINT = 'rgba(127,191,255,0.10)';
export const COREQ_TINT = 'rgba(255,255,255,0.055)';

/**
 * A stable phase per row, so a run of co-requisites does not breathe as one.
 *
 * Derived from the gs rather than the list index: the requirement lists put
 * the same topic at different positions under different credentials, and a
 * row that changed its rhythm when you paged the deck would be noticeable in
 * exactly the way this is trying not to be.
 */
export function tintPhase(gs: number): number {
  return ((gs * 0.618) % 1 + 1) % 1;
}
