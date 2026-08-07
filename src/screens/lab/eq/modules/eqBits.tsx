/**
 * eqBits — shared EQ Lab interactives (owner spec 2026-08-07): the vertical
 * graphic-EQ fader and the multi-band board. Mirrors the DragSlider contract
 * (foundations/bits): claims the responder on touch, locks the host scroll via
 * the ScrollLock context for the gesture's duration, children are
 * pointerEvents-none so locationY stays track-relative.
 */
import { useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { useScrollLock } from '../../LabShell';

const TRACK_H = 104;

/** One vertical fader: value 0..1 (bottom→top). */
export function VerticalFader({
  value,
  onChange,
  label,
  hot,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  /** Non-zero gain — tints the thumb amber so set bands read at a glance. */
  hot?: boolean;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const ctxLock = useScrollLock();
  const lockRef = useRef(ctxLock);
  lockRef.current = ctxLock;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: (e) => {
        lockRef.current?.(true);
        onChangeRef.current(1 - Math.max(0, Math.min(1, e.nativeEvent.locationY / TRACK_H)));
      },
      onPanResponderMove: (e) => {
        onChangeRef.current(1 - Math.max(0, Math.min(1, e.nativeEvent.locationY / TRACK_H)));
      },
      onPanResponderRelease: () => lockRef.current?.(false),
      onPanResponderTerminate: () => lockRef.current?.(false),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View style={styles.faderWrap}>
      <View style={styles.track} {...pan.panHandlers}>
        <View pointerEvents="none" style={styles.trackLine} />
        <View pointerEvents="none" style={styles.centerTick} />
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            { top: (1 - value) * TRACK_H - 5 },
            hot ? { backgroundColor: colors.amber } : null,
          ]}
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
  range = 12,
}: {
  centers: readonly number[];
  gains: number[];
  onGain: (i: number, db: number) => void;
  range?: number;
}) {
  const faders = centers.map((c, i) => (
    <VerticalFader
      key={c}
      label={c >= 1000 ? `${c / 1000}k` : `${c}`}
      value={(gains[i] + range) / (2 * range)}
      onChange={(v) => onGain(i, Math.round((v * 2 * range - range) * 2) / 2)}
      hot={gains[i] !== 0}
    />
  ));
  if (centers.length > 12) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.boardScroll}>
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
  faderWrap: { alignItems: 'center', gap: 4, width: 28 },
  track: { width: 28, height: TRACK_H, alignItems: 'center' },
  trackLine: { position: 'absolute', top: 0, bottom: 0, width: 3, borderRadius: 1.5, backgroundColor: '#2a2c34' },
  centerTick: { position: 'absolute', top: TRACK_H / 2 - 0.75, left: 2, right: 2, height: 1.5, backgroundColor: '#4a5060' },
  thumb: { position: 'absolute', width: 20, height: 10, borderRadius: 3, backgroundColor: '#8f96a3', borderWidth: 1, borderColor: '#0c0c0f' },
  faderLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.textSub },
  boardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  boardScroll: { gap: 6, paddingRight: 8 },
  miniBtn: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#17171c' },
  miniBtnActive: { borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#1d1708' },
  miniBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.9, color: colors.textSecondary },
  miniBtnTextActive: { color: colors.amber },
});
