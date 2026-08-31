/**
 * PresetFader — a hold-to-open popup that switches the pace PRESET with a
 * draggable fader "on a line" (user request 2026-07-25).
 *
 * Restyled 2026-07-25 to resemble a professional mixing-console linear fader
 * (straight-on / upright — no 3D perspective): the preset LABELS sit to the
 * LEFT, and to their right is a matte-black fader BODY panel with a recessed
 * vertical SLOT groove, tick marks at every preset stop, and a brushed-metal
 * CAP (rounded-rectangle silver knob with horizontal grip grooves + a center
 * indicator line) that rides to the current preset.
 *
 * A draggable cap slides along the slot and SNAPS to the nearest stop as you
 * drag; releasing applies the selection via onChange (setPreset). Tapping a
 * label jumps straight to it.
 *
 * The same component is opened from BOTH the in-container fader button
 * (PaceReadout) and the modal mini-fader (PaceTimerModal) — one shared popup.
 * MiniFader (below) is the compact, tap-to-open preview used by the modal.
 *
 * Self-contained (PanResponder + theme tokens); no external gesture deps.
 */
import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Modal } from '../../components/DimModal';
import { colors, fonts } from '../../theme/tokens';
import { PACE_PRESETS, type PacePreset } from './paceStore';

const TRACK_HEIGHT = 275; // px the cap travels (23% larger, user request 2026-07-25)
const N = PACE_PRESETS.length;
const STEP = N > 1 ? TRACK_HEIGHT / (N - 1) : 0;

// Full-size console-fader geometry (scaled up ~23%).
const CAP_W = 49; // brushed-metal cap width (overhangs the body)
const CAP_H = 30; // cap height (grip grooves + indicator stack inside)
const BODY_W = 32; // matte-black fader body panel width
const LABEL_H = 25;

function indexOfPreset(preset: PacePreset): number {
  const i = PACE_PRESETS.findIndex((p) => p.key === preset);
  return i < 0 ? 0 : i;
}

export function PresetFader({
  visible,
  preset,
  onChange,
  onClose,
}: {
  visible: boolean;
  preset: PacePreset;
  onChange: (preset: PacePreset) => void;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(() => indexOfPreset(preset));
  const indexRef = useRef(index);
  const startYRef = useRef(0);

  // Re-sync to the live preset each time the fader is opened.
  useEffect(() => {
    if (!visible) return;
    const i = indexOfPreset(preset);
    indexRef.current = i;
    setIndex(i);
  }, [visible, preset]);

  const apply = (i: number) => {
    const clamped = Math.max(0, Math.min(N - 1, i));
    indexRef.current = clamped;
    setIndex(clamped);
    onChange(PACE_PRESETS[clamped].key);
  };

  const setPreview = (i: number) => {
    const clamped = Math.max(0, Math.min(N - 1, i));
    if (clamped !== indexRef.current) {
      indexRef.current = clamped;
      setIndex(clamped);
    }
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startYRef.current = indexRef.current * STEP;
      },
      onPanResponderMove: (_evt, g) => {
        const y = Math.max(0, Math.min(TRACK_HEIGHT, startYRef.current + g.dy));
        setPreview(STEP > 0 ? Math.round(y / STEP) : 0);
      },
      onPanResponderRelease: () => apply(indexRef.current),
      onPanResponderTerminate: () => apply(indexRef.current),
    }),
  ).current;

  const capTop = index * STEP;

  return (
    <Modal accessibilityViewIsModal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss pace fader"
        />
        <View style={styles.card}>
          <Text style={styles.title}>PACE</Text>
          <Text style={styles.current} numberOfLines={1}>
            {PACE_PRESETS[index].label}
          </Text>
          <Text style={styles.currentHint} numberOfLines={1}>
            {PACE_PRESETS[index].hint}
          </Text>

          <View style={styles.faderRow}>
            {/* Labels to the LEFT of the track — tap to jump. */}
            <View style={styles.labels}>
              {PACE_PRESETS.map((p, i) => {
                const active = i === index;
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => apply(i)}
                    style={[styles.labelBtn, { top: CAP_H / 2 + i * STEP - LABEL_H / 2 }]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${p.label}, ${p.hint}`}
                  >
                    <Text style={[styles.labelText, active && styles.labelTextActive]} numberOfLines={1}>
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Console fader body: matte panel + recessed slot + ticks + metal cap. */}
            <View style={styles.faderBody} {...pan.panHandlers}>
              <View style={styles.panel} />
              <View style={styles.slot} />
              {PACE_PRESETS.map((p, i) => (
                <View key={p.key} style={[styles.stopTick, { top: CAP_H / 2 + i * STEP - 1 }]} />
              ))}
              <View style={[styles.cap, { top: capTop }]}>
                <View style={styles.capGroove} />
                <View style={styles.capIndicator} />
                <View style={styles.capGroove} />
              </View>
            </View>
            {/* Balances the left-hand labels so the fader track sits CENTERED in
                the card (user 2026-07-25 — was off-center to the right). */}
            <View style={styles.faderSpacer} />
          </View>

          <Pressable
            style={styles.doneBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={styles.doneText}>DONE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ---- MiniFader — compact, tap-to-open preview (modal, no-scroll access) ----
const MINI_TRACK = 92;
const MINI_STEP = N > 1 ? MINI_TRACK / (N - 1) : 0;
const MCAP_W = 30;
const MCAP_H = 16;
const MBODY_W = 18;

/**
 * A small static fader showing the current preset's cap position. Not draggable
 * itself — tapping anywhere opens the full-size PresetFader (shared popup).
 */
export function MiniFader({ preset, onPress }: { preset: PacePreset; onPress: () => void }) {
  const index = indexOfPreset(preset);
  const capTop = index * MINI_STEP;
  return (
    <Pressable
      style={styles.mini}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Pace: ${PACE_PRESETS[index].label}. Tap to open the pace fader`}
    >
      <View style={styles.miniText}>
        <Text style={styles.miniKicker}>PACE</Text>
        <Text style={styles.miniLabel} numberOfLines={1}>
          {PACE_PRESETS[index].label}
        </Text>
        <Text style={styles.miniHint} numberOfLines={1}>
          {PACE_PRESETS[index].hint}
        </Text>
        <Text style={styles.miniTap}>Tap to change ▸</Text>
      </View>
      <View style={styles.miniBody}>
        <View style={styles.miniPanel} />
        <View style={styles.miniSlot} />
        {PACE_PRESETS.map((p, i) => (
          <View key={p.key} style={[styles.miniTick, { top: MCAP_H / 2 + i * MINI_STEP - 1 }]} />
        ))}
        <View style={[styles.miniCap, { top: capTop }]}>
          <View style={styles.miniGroove} />
          <View style={styles.miniIndicator} />
          <View style={styles.miniGroove} />
        </View>
      </View>
    </Pressable>
  );
}

// Brushed-metal cap look, shared by the full cap and the mini cap: light-grey
// fill with a light top edge + darker bottom edge to fake a straight-on sheen.
const METAL_FILL = '#c6c9cf';
const METAL_TOP = '#eef0f3';
const METAL_BOTTOM = '#83868c';
const METAL_SIDE = '#a9acb2';
const GROOVE = '#9a9da3';

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,8,10,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
  },
  card: {
    width: '100%',
    maxWidth: 344,
    backgroundColor: '#17181a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(47,155,255,.35)',
    padding: 18,
    gap: 6,
  },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.textPrimary },
  current: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.blue, marginTop: 2 },
  currentHint: { fontFamily: fonts.barlowCondensedRegular, fontSize: 12, color: colors.textMuted },

  faderRow: { flexDirection: 'row', justifyContent: 'center', height: TRACK_HEIGHT + CAP_H, marginTop: 10 },

  // Labels LEFT — right-aligned so they hug the track. Fixed width + a matching
  // right spacer (faderSpacer) keeps the track centered in the card.
  labels: { width: 116, height: TRACK_HEIGHT + CAP_H, marginRight: 10 },
  faderSpacer: { width: 126 },
  labelBtn: { position: 'absolute', left: 0, right: 0, height: LABEL_H, justifyContent: 'center' },
  labelText: {
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'right',
  },
  labelTextActive: { fontFamily: fonts.oswaldSemiBold, color: colors.textPrimary },

  // Fader body (right).
  faderBody: { width: CAP_W, height: TRACK_HEIGHT + CAP_H },
  panel: {
    position: 'absolute',
    left: (CAP_W - BODY_W) / 2,
    top: CAP_H / 2,
    width: BODY_W,
    height: TRACK_HEIGHT,
    borderRadius: 6,
    backgroundColor: '#141416', // matte-black body
    borderWidth: 1,
    borderColor: '#2a2a2c',
  },
  slot: {
    position: 'absolute',
    left: CAP_W / 2 - 3,
    top: CAP_H / 2,
    width: 6,
    height: TRACK_HEIGHT,
    borderRadius: 3,
    backgroundColor: '#050506', // recessed travel groove
    borderWidth: 1,
    borderColor: '#000',
  },
  stopTick: {
    position: 'absolute',
    left: CAP_W / 2 - 8.5,
    width: 17,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.hairline,
  },
  cap: {
    position: 'absolute',
    left: 0,
    width: CAP_W,
    height: CAP_H,
    borderRadius: 6,
    backgroundColor: METAL_FILL,
    borderTopWidth: 2,
    borderTopColor: METAL_TOP,
    borderBottomWidth: 2,
    borderBottomColor: METAL_BOTTOM,
    borderLeftWidth: 1,
    borderLeftColor: METAL_SIDE,
    borderRightWidth: 1,
    borderRightColor: METAL_SIDE,
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  capGroove: { height: 2.5, borderRadius: 1, backgroundColor: GROOVE },
  capIndicator: { height: 3, borderRadius: 1, backgroundColor: colors.blue },

  doneBtn: {
    marginTop: 4,
    borderRadius: 9,
    backgroundColor: 'rgba(47,155,255,.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(47,155,255,.7)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  doneText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.blue },

  // ---- MiniFader ----
  mini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(47,155,255,.4)',
    backgroundColor: 'rgba(47,155,255,.06)',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  miniText: { flex: 1, gap: 1 },
  miniKicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.cyanBright },
  miniLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.textPrimary },
  miniHint: { fontFamily: fonts.barlowCondensedRegular, fontSize: 12, color: colors.textMuted },
  miniTap: { fontFamily: fonts.barlowCondensedMedium, fontSize: 11, color: colors.blue, marginTop: 3 },
  miniBody: { width: MCAP_W, height: MINI_TRACK + MCAP_H },
  miniPanel: {
    position: 'absolute',
    left: (MCAP_W - MBODY_W) / 2,
    top: MCAP_H / 2,
    width: MBODY_W,
    height: MINI_TRACK,
    borderRadius: 5,
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#2a2a2c',
  },
  miniSlot: {
    position: 'absolute',
    left: MCAP_W / 2 - 2,
    top: MCAP_H / 2,
    width: 4,
    height: MINI_TRACK,
    borderRadius: 2,
    backgroundColor: '#050506',
  },
  miniTick: {
    position: 'absolute',
    left: MCAP_W / 2 - 5,
    width: 10,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: colors.hairline,
  },
  miniCap: {
    position: 'absolute',
    left: 0,
    width: MCAP_W,
    height: MCAP_H,
    borderRadius: 4,
    backgroundColor: METAL_FILL,
    borderTopWidth: 1,
    borderTopColor: METAL_TOP,
    borderBottomWidth: 1,
    borderBottomColor: METAL_BOTTOM,
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  miniGroove: { height: 1.5, borderRadius: 1, backgroundColor: GROOVE },
  miniIndicator: { height: 2, borderRadius: 1, backgroundColor: colors.blue },
});
