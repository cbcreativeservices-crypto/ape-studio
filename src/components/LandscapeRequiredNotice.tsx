/**
 * LandscapeRequiredNotice — the honest fallback for the landscape-only
 * fullscreens (owner bug report 2026-09-01: "full screen view VU meter goes to
 * a black screen on iOS").
 *
 * The three landscape fullscreens (SPL Full VU, SPL gauge, Waveform) each draw
 * an OPAQUE #0c0c0f overlay and render their content only while
 * `winW >= winH`. That gate is deliberate — it stops the portrait layout
 * ghosting during the flip (owner 2026-08-19). But it assumes the flip always
 * arrives, and on iOS it may never: `lockLandscape()` silently no-ops when the
 * device's rotation lock is on, or when the running build has no
 * ExpoScreenOrientation native module. The overlay then stays up with nothing
 * in it — an unexplained black screen with only a tiny ✕.
 *
 * So: keep the gate, but bound it in TIME. After a grace period longer than any
 * real rotation, a still-portrait fullscreen says what is wrong and how to fix
 * it, and offers a real close button. A black void is never an acceptable
 * state.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/tokens';

/**
 * True once a landscape-only fullscreen has been open, in portrait, for longer
 * than a rotation could plausibly take — i.e. the rotation is not coming.
 * Resets the moment the screen turns landscape or the fullscreen closes.
 *
 * @param active     the fullscreen is open AND not in its closing phase
 * @param isPortrait current window is taller than it is wide
 */
export function useLandscapeGrace(active: boolean, isPortrait: boolean, ms = 1100): boolean {
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (!active || !isPortrait) {
      setExpired(false);
      return undefined;
    }
    const t = setTimeout(() => setExpired(true), ms);
    return () => clearTimeout(t);
  }, [active, isPortrait, ms]);
  return expired && active && isPortrait;
}

/** The panel itself. `what` names the instrument, e.g. "full VU meter". */
export function LandscapeRequiredNotice({ what, onClose }: { what: string; onClose: () => void }): ReactNode {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.card}>
        {/* NEW COPY — owner review. */}
        <Text style={styles.title}>TURN YOUR PHONE SIDEWAYS</Text>
        <Text style={styles.body}>
          The {what} is a landscape view. If the screen will not turn, your phone&apos;s rotation lock is on — switch it
          off and try again.
        </Text>
        <Pressable style={styles.btn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={styles.btnText}>CLOSE</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: {
    maxWidth: 340,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2b2b33',
    backgroundColor: '#141418',
    paddingVertical: 20,
    paddingHorizontal: 22,
    alignItems: 'center',
    gap: 12,
  },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.6, color: colors.amber, textAlign: 'center' },
  body: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textMuted, textAlign: 'center' },
  btn: {
    marginTop: 4,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a44',
    backgroundColor: '#1c1c22',
  },
  btnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.textSecondary },
});
