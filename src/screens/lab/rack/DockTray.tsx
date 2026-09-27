/**
 * DockTray — the tools' value-button→popup idiom re-anchored as the Rack
 * Unit's drawer. The one deliberate, documented divergence from the tools
 * popup, and it is the load-bearing one:
 *
 *   TOOLS POPUPS CONFIGURE — pick and close.
 *   LAB TRAYS EXPERIMENT — a sticky tray applies the pick and STAYS OPEN,
 *   because A/B-ing FOAM → BRICK → CURTAIN while RT60 moves on the bezel IS
 *   the lesson.
 *
 * The card uses the tools' popup tokens (#141418 face, #2b2b33 border, r14 —
 * SplMeter popupCard) and rises from the bottom of the faceplate; the backdrop
 * dims everything BELOW the stage (well + dock) but the GLASS/BEZEL stay
 * bright and live — that is the load-bearing rule. De-modalized in-tree
 * overlay (never a native Modal — the 2026-08-19 iOS lesson); Android back
 * closes the tray first (BackHandler, registered only while open).
 */
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts } from '../../../theme/tokens';
import { hapticsEnabled } from '../../../features/settings/store';
import type { DockParam } from './rackTypes';

/** In-tray option chip — LabChip's semantics (selected state, 📷 photoHint,
 *  long-press lesson) in the tools' PopupOpt skin. Own component (not LabChip)
 *  so the rack kit never imports LabShell (import-cycle kill). */
function TrayChip({
  label,
  selected,
  onPress,
  onLongPress,
  photoHint,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  photoHint?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.opt, selected && styles.optSel, pressed && styles.optPressed]}
      onPress={() => {
        // Selecting an option is the main verb in a tray — it should be felt
        // as well as seen (the dock keys got the same treatment).
        if (hapticsEnabled()) void Haptics.selectionAsync();
        onPress();
      }}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      aria-pressed={selected}
      accessibilityLabel={
        photoHint ? `${label} — long-press to see a photo` : onLongPress ? `${label} — long-press for its guided lesson` : label
      }
    >
      <Text style={[styles.optText, selected && styles.optTextSel]}>
        {label}
        {photoHint ? <Text style={styles.optPhotoHint}> 📷</Text> : null}
      </Text>
    </Pressable>
  );
}

export function DockTray({
  param,
  onClose,
  onHelp,
  bottomInset = 0,
  dim = true,
  onCardLayout,
  maxHeight,
}: {
  /** The open options/group param (null = tray closed, renders nothing). */
  param: Extract<DockParam, { kind: 'options' | 'group' }> | null;
  onClose: () => void;
  /** Long-press lesson router (helpKey → GuidedLessonSheet). */
  onHelp?: (helpKey?: string) => void;
  /** Bottom safe-area (the overlay layer is positioned to the border box, so
   *  the parent's padding does not apply here). */
  bottomInset?: number;
  /** Wash the area behind the card. Off inside FULL SCREEN (2026-09-25):
   *  there the drawing IS the area behind the card, and the learner opened
   *  the tray to A/B while watching it — a veil would defeat the purpose.
   *  The backdrop still closes the tray on a tap. */
  dim?: boolean;
  /** Reports the card's height, so a host can lift its controls above it
   *  (full screen, owner 2026-09-26). */
  onCardLayout?: (h: number) => void;
  /** Card height cap in dp. Inline the tray layer is exactly the room
   *  between the stage and the live dock (owner 2026-09-27), so the host
   *  passes that room and the card may use all of it; unset = 86%. */
  maxHeight?: number;
}) {
  const open = param != null;
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [open, onClose]);

  // "more ↓" cue (owner 2026-09-27, SE pass): on a 667 pt phone a two-row
  // tray (ENV: attack + release) is taller than the room above the live dock,
  // and a clipped row read as "that's all there is". Same cue as flashcards.
  const [viewH, setViewH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const trayId = param?.id;
  useEffect(() => setScrollY(0), [trayId]);

  if (!param) return null;
  const blurbSel = param.kind === 'options' ? param.options.find((o) => o.id === param.selectedId) : undefined;
  const blurbNode = blurbSel?.blurb ? (
    <View style={styles.blurbBox}>
      <Text style={styles.blurbName}>{blurbSel.label}</Text>
      <Text style={styles.blurbText}>{blurbSel.blurb}</Text>
    </View>
  ) : null;
  const overflows = contentH - viewH > 4;
  const moreBelow = overflows && scrollY + viewH < contentH - 4;
  const sticky = param.kind === 'group' || param.sticky === true;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop dims the WELL only (this overlay lives inside the well wrap —
          the stage above and dock below stay bright and live). */}
      <Pressable
        style={[styles.backdrop, !dim && styles.backdropClear]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close the tray"
      />
      <View style={[styles.card, { bottom: 6 + bottomInset }, maxHeight != null && maxHeight > 0 && { maxHeight }]} onLayout={onCardLayout ? (e) => onCardLayout(Math.round(e.nativeEvent.layout.height)) : undefined}>
        <View style={styles.head}>
          <Text style={styles.title} numberOfLines={1}>
            {param.label}
            {sticky ? <Text style={styles.stickyNote}>  ·  stays open — A/B while you watch</Text> : null}
          </Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.bodyWrap}>
        <ScrollView
          key={param.id}
          bounces={false}
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          onLayout={(e) => setViewH(e.nativeEvent.layout.height)}
          onContentSizeChange={(_w, h) => setContentH(h)}
          onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={32}
        >
          {/* WHAT-AM-I-CHANGING readout (owner 2026-08-28): the open tray
              COVERS the lab's teaching prose, so the tray itself explains the
              selected option — tap CLASSROOM and read what a classroom does to
              the picture above, no scrolling, no memory of the lesson needed.
              Sticky trays apply on tap, so this updates live while A/B-ing.
              Rendered only when the selected option carries a blurb — trays of
              self-evident values (frequencies, on/off) are unchanged. */}
          {/* …except when the tray is too short for both (SE, 2026-09-27):
              then the CHOICES come first — they are the controls — and the
              readout follows them. The total height is the same either way,
              so the order cannot flip-flop. */}
          {overflows ? null : blurbNode}
          {param.kind === 'options' ? (
            <View style={styles.grid}>
              {param.options.map((o) => (
                <TrayChip
                  key={o.id}
                  label={o.label}
                  selected={param.selectedId === o.id}
                  photoHint={o.photoHint}
                  onPress={() => {
                    param.onSelect(o.id);
                    if (!sticky) onClose();
                  }}
                  onLongPress={o.onLongPress ?? (param.helpKey ? () => onHelp?.(param.helpKey) : undefined)}
                />
              ))}
            </View>
          ) : (
            param.render()
          )}
          {overflows ? blurbNode : null}
          {param.kind === 'options' && param.onReset ? (
            <Pressable
              style={styles.resetBtn}
              onPress={param.onReset.onPress}
              accessibilityRole="button"
              accessibilityLabel={param.onReset.label}
            >
              <Text style={styles.resetText}>⟲ {param.onReset.label}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
        </View>
        {/* Its own line under the list, never over a chip (an overlaid cue
            covered SINE 440 Hz on the SE). The line stays while the list
            overflows — only the text goes at the end — so reaching the end
            does not resize the scroller under the finger. */}
        {overflows ? (
          <Text style={styles.moreText} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {moreBelow ? 'more ↓' : ' '}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)', // the tools popup backdrop token
  },
  backdropClear: { backgroundColor: 'transparent' },
  card: {
    position: 'absolute',
    left: 8,
    right: 8,
    maxHeight: '86%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2b2b33',
    backgroundColor: '#141418',
    padding: 12,
    gap: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: {
    flex: 1,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.textPrimary,
  },
  stickyNote: { fontSize: 12, letterSpacing: 0.3, color: colors.textSub },
  close: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.textSub, paddingHorizontal: 4 },
  bodyWrap: { flexShrink: 1, minHeight: 0 },
  body: { flexGrow: 0 },
  moreText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: '#9aa0a8', textAlign: 'center', marginTop: -4 },
  bodyContent: { gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  // TrayChip — PopupOpt tokens (SplMeter popup) at the MIN_FONT 12 floor.
  opt: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#33333c',
    backgroundColor: '#1a1a1f',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 44, // rapid A/B tapping is the tray's job — full-size targets
    justifyContent: 'center',
  },
  optPressed: { backgroundColor: '#23232a', borderColor: '#3a3a44' },
  optSel: { borderColor: 'rgba(255,198,77,.7)', backgroundColor: '#1c1608' },
  optText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.7, color: colors.textSecondary },
  optTextSel: { color: colors.amber },
  optPhotoHint: { fontSize: 12 },
  resetBtn: {
    alignSelf: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#3a3a44',
    backgroundColor: '#17171c',
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  resetText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
  // What-am-I-changing readout — quiet panel above the chips, amber-named.
  // minHeight ≈ two body lines so the card doesn't jump height while A/B-ing
  // between short and long blurbs.
  blurbBox: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262e',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,198,77,.55)',
    backgroundColor: '#0f0f13',
    paddingVertical: 8,
    paddingHorizontal: 11,
    gap: 2,
    minHeight: 58,
  },
  blurbName: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.1, color: colors.amber },
  blurbText: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
});
