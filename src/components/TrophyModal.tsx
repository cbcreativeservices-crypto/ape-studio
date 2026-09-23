/**
 * TrophyModal — a full-screen popup that shows a single trophy at FULL size,
 * 100% colour and brightness (Booth 2026-07-11). Opened by tapping a trophy on
 * the Achievements grid or the Dashboard topic card; tap anywhere to dismiss.
 * Presentation only — no data fetching, no navigation.
 */
import { type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ALL_ORIENTATIONS } from './modalOrientations';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrophyImage } from './TrophyImage';
import { fonts } from '../theme/tokens';
import { LowLightDim } from '../features/settings/LowLightLayer';

/**
 * The art is sized against BOTH axes - 82% of the width but only 55% of the
 * HEIGHT - so the height term is what governs in landscape. Read once at module
 * scope (app boot) it was whichever orientation the app happened to launch in:
 * open this on a phone held sideways after a portrait launch and the trophy is
 * sized for a tall window it is no longer in, overflowing the short axis it was
 * specifically capped against. Hooked, 2026-09-13.
 */
function artSize(w: number, h: number, withBelow: boolean): number {
  // Trophy zoom art reduced 23% (Booth 2026-07-11).
  // With a `below` panel sharing the window (the topic overview, owner
  // 2026-09-20) the art yields height so the prose has somewhere to live —
  // otherwise on a short phone the art alone eats the screen and the panel
  // opens two lines tall. Unchanged when there is no panel, which is every
  // other caller.
  const hShare = withBelow ? 0.3 : 0.55;
  const cap = withBelow ? 230 : 360;
  return Math.round(Math.min(w * 0.82, h * hShare, cap) * 0.77);
}

export function TrophyModal({
  visible,
  iconUrl,
  name,
  color = '#ffc233',
  meta,
  action,
  children,
  below,
  grayed = false,
  onClose,
}: {
  visible: boolean;
  iconUrl: string | null | undefined;
  name?: string | null;
  /** Show the art grayscale + dimmed (topic not yet earned, owner 2026-09-09). */
  grayed?: boolean;
  /** Field/category color — used for the frame glow behind the art. */
  color?: string;
  /** Optional line under the name (e.g. "EARNED SEP 2, 2026"). */
  meta?: string | null;
  /** Optional action (e.g. download the certificate PDF). Its own tap does not
   *  dismiss — only the surrounding scrim does. */
  action?: { label: string; onPress: () => void; busy?: boolean } | null;
  /** Optional custom art node (used when art is a bundled asset, not a URL). */
  children?: ReactNode;
  /**
   * Optional long-form block under the name — the topic overview (owner
   * 2026-09-20). It is rendered OUTSIDE the scrim Pressable so its own
   * scrolling and taps cannot dismiss the popup, and its presence shrinks the
   * art to make room. Leave it out and this modal behaves exactly as before.
   */
  below?: ReactNode;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ART = artSize(width, height, !!below);
  return (
    <Modal supportedOrientations={ALL_ORIENTATIONS} accessibilityViewIsModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* The dark backdrop lives on the HOST, not the scrim, so an optional
          `below` panel sits on the same dimmed field instead of floating on
          nothing. With no panel this is pixel-identical to before. */}
      <View style={styles.host}>
      {/* Tap anywhere on the scrim to hide (Booth 2026-07-11). */}
      <Pressable
        style={styles.scrim}
        onPress={onClose}
        accessibilityRole="button"
        // The scrim is the only accessible element, so it must READ the trophy
        // (name + earned meta), not just "Close trophy" (Bug+Hater night A1-03).
        accessibilityLabel={`${name ?? 'Trophy'}${meta ? `, ${meta.toLowerCase()}` : ''}. Tap to close.`}
      >
        <View
          style={[styles.frame, { width: ART, height: ART, borderColor: color, shadowColor: color }]}
          pointerEvents="none"
        >
          {children ?? (
            <TrophyImage iconUrl={iconUrl} grayed={grayed} fill radius={14} fallback={<View style={styles.empty} />} />
          )}
        </View>
        {name ? <Text style={styles.name}>{name.toUpperCase()}</Text> : null}
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        {action ? (
          <Pressable
            onPress={action.onPress}
            disabled={action.busy}
            accessibilityRole="button"
            accessibilityLabel={action.busy ? 'Working, please wait' : action.label}
            accessibilityState={{ disabled: !!action.busy, busy: !!action.busy }}
            aria-disabled={!!action.busy}
            aria-busy={!!action.busy}
            style={({ pressed }) => [styles.action, { borderColor: color }, pressed && styles.actionPressed]}
          >
            <Text style={[styles.actionText, { color }]}>{action.busy ? 'WORKING…' : action.label}</Text>
          </Pressable>
        ) : null}
        {/* With a panel present a tap on the PROSE deliberately does nothing,
            so "tap to close" would be a half-truth on the half of the screen
            people are actually touching. */}
        <Text style={styles.hint}>{below ? 'TAP OUTSIDE TO CLOSE' : 'TAP TO CLOSE'}</Text>
      </Pressable>
        {below ? (
          <View style={[styles.belowWrap, { paddingBottom: insets.bottom + 12 }]}>{below}</View>
        ) : null}
      </View>
      <LowLightDim />
    </Modal>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, backgroundColor: 'rgba(0,0,0,0.86)' },
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    padding: 24,
  },
  /* The overview sits BELOW the tap-to-close scrim, sharing the host's dim.
     No flex: it is sized by its own maxHeight, so the art above keeps every
     pixel the panel does not need. */
  belowWrap: { paddingHorizontal: 24 },
  frame: {
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#0d0d0e',
    overflow: 'hidden',
    shadowOpacity: 0.7,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  empty: { flex: 1, backgroundColor: '#1a1a1c' },
  name: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 18,
    letterSpacing: 1.2,
    color: '#f2f2f2',
    textAlign: 'center',
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.62)',
    textAlign: 'center',
    marginTop: -8,
  },
  action: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  actionPressed: { opacity: 0.7 },
  actionText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4 },
  hint: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.5)',
  },
});
