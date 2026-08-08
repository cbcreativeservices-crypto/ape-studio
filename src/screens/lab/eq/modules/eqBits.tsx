/**
 * eqBits — shared EQ Lab interactives (owner spec 2026-08-07): the vertical
 * graphic-EQ fader and the multi-band board.
 *
 * Gesture rules (owner 2026-08-07 fix round 2 — "it just wants to scroll"):
 *  - the fader CAPTURES the touch immediately and locks the host vertical
 *    ScrollView (via the ScrollLock context), so a vertical drag always moves
 *    the fader, never the screen;
 *  - drag math is ANCHORED: the grant tap sets the value from locationY once,
 *    then moves apply gestureState.dy to that anchor — locationY re-bases when
 *    the finger leaves the track, which caused the whip-to-the-other-end jump;
 *  - a clearly HORIZONTAL gesture hands the touch off (termination allowed) so
 *    the 1/3-octave board still scrolls sideways.
 * `onActive` reports which fader is being dragged for live readouts.
 */
import { useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { useScrollLock } from '../../LabShell';

const TRACK_H = 108;

/** One vertical fader: value 0..1 (bottom→top). */
export function VerticalFader({
  value,
  onChange,
  onActive,
  label,
  tint,
}: {
  value: number;
  onChange: (v: number) => void;
  /** Fires true when this fader starts moving, false on release. */
  onActive?: (active: boolean) => void;
  label: string;
  /** Colour for the thumb/fill when set (else neutral / amber-when-nonzero). */
  tint?: string;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onActiveRef = useRef(onActive);
  onActiveRef.current = onActive;
  const ctxLock = useScrollLock();
  const lockRef = useRef(ctxLock);
  lockRef.current = ctxLock;
  const baseRef = useRef(0);

  const done = (grabbed: boolean) => {
    lockRef.current?.(false);
    if (grabbed) onActiveRef.current?.(false);
  };

  const pan = useRef(
    PanResponder.create({
      // Claim immediately — the host ScrollView must never steal a fader touch.
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (e) => {
        lockRef.current?.(true);
        onActiveRef.current?.(true);
        const v = 1 - Math.max(0, Math.min(1, e.nativeEvent.locationY / TRACK_H));
        baseRef.current = v;
        onChangeRef.current(v);
      },
      onPanResponderMove: (_e, g) => {
        onChangeRef.current(Math.max(0, Math.min(1, baseRef.current - g.dy / TRACK_H)));
      },
      onPanResponderRelease: () => done(true),
      onPanResponderTerminate: () => done(true),
      // Hand off ONLY clearly horizontal gestures (the board's sideways scroll);
      // vertical stays ours no matter what.
      onPanResponderTerminationRequest: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy) + 6,
    }),
  ).current;

  const thumbTint = tint ?? (value !== 0.5 ? colors.amber : undefined);
  return (
    <View style={styles.faderWrap}>
      <View style={styles.track} {...pan.panHandlers}>
        <View pointerEvents="none" style={styles.trackLine} />
        <View pointerEvents="none" style={styles.centerTick} />
        <View
          pointerEvents="none"
          style={[styles.thumb, { top: (1 - value) * TRACK_H - 5 }, thumbTint ? { backgroundColor: thumbTint } : null]}
        />
      </View>
      <Text style={styles.faderLabel}>{label}</Text>
    </View>
  );
}

/** A graphic-EQ board over fixed centers. Gains in dB (±range). Boards wider
 *  than 12 bands scroll horizontally (the spec's 1/3-octave presentation). */
export function GraphicBoard({
  centers,
  gains,
  onGain,
  onActiveIndex,
  tintFor,
  range = 12,
}: {
  centers: readonly number[];
  gains: number[];
  onGain: (i: number, db: number) => void;
  /** Index of the fader currently being dragged, or null on release. */
  onActiveIndex?: (i: number | null) => void;
  /** Optional per-band thumb colour. */
  tintFor?: (i: number) => string | undefined;
  range?: number;
}) {
  const faders = centers.map((c, i) => (
    <VerticalFader
      key={c}
      label={c >= 1000 ? `${c / 1000}k` : `${c}`}
      value={(gains[i] + range) / (2 * range)}
      onChange={(v) => onGain(i, Math.round((v * 2 * range - range) * 2) / 2)}
      onActive={(a) => onActiveIndex?.(a ? i : null)}
      tint={tintFor?.(i)}
    />
  ));
  if (centers.length > 12) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        directionalLockEnabled
        contentContainerStyle={styles.boardScroll}
      >
        {faders}
      </ScrollView>
    );
  }
  return <View style={styles.boardRow}>{faders}</View>;
}

/** Small labeled action button (RESET · BYPASS · presets). */
export function MiniBtn({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={active != null ? { selected: active } : undefined}
      style={[styles.miniBtn, active && styles.miniBtnActive]}
    >
      <Text style={[styles.miniBtnText, active && styles.miniBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  faderWrap: { alignItems: 'center', gap: 4, width: 30 },
  track: { width: 30, height: TRACK_H, alignItems: 'center' },
  trackLine: { position: 'absolute', top: 0, bottom: 0, width: 3, borderRadius: 1.5, backgroundColor: '#2a2c34' },
  centerTick: { position: 'absolute', top: TRACK_H / 2 - 0.75, left: 3, right: 3, height: 1.5, backgroundColor: '#4a5060' },
  thumb: { position: 'absolute', width: 22, height: 11, borderRadius: 3, backgroundColor: '#8f96a3', borderWidth: 1, borderColor: '#0c0c0f' },
  faderLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.textSub },
  boardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  boardScroll: { gap: 6, paddingRight: 8 },
  miniBtn: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#17171c' },
  miniBtnActive: { borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#1d1708' },
  miniBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.9, color: colors.textSecondary },
  miniBtnTextActive: { color: colors.amber },
});
