/**
 * LowLightLayer — low-light mode UI (user request 2026-07-18):
 *  - <LowLightDim/>  a full-bleed black wash that dims the app's OUTPUT (not the
 *                    device brightness) when ON, PLUS a persistent line at the
 *                    top of every screen marking the mode active. Mounted once
 *                    at the app root, pointer-transparent.
 *  - <LowLightRow/>  the toggle control, placed at the TOP of the Profile
 *                    screen. Lights up when engaged.
 *
 * Colour (owner request 2026-07-26): the low-light indicator is a BURNT, darker
 * glowing ORANGE — not the red used for the audio-output frame. Keeping the two
 * warnings distinct hues means they're never confused when both are on screen,
 * and the warm ember reads gentler than red in a dark theater. The top line is
 * also thicker (doubled) to match the audio frame's new weight.
 */
import { useEffect, useState } from 'react';
import { AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import {
  checkLowLightExpiry,
  LOW_LIGHT_DIM,
  onLowLightActivated,
  setLowLight,
  setLowLightGatePending,
  toggleLowLight,
  useLowLight,
  useLowLightDim,
} from './lowLight';

// Burnt, darker, glowing orange (owner request 2026-07-26) — the low-light
// indicator hue, deliberately distinct from the audio-output frame's red.
const EMBER = '#c2540f';

/** Dim wash + red tint — painted once low-light is ON *and* the activation
 *  notice has been acknowledged (owner 2026-08-31). */
export function LowLightDim() {
  const on = useLowLightDim();
  // Auto-revert after 12h UNTOUCHED (owner 2026-07-30): foreground only CHECKS
  // expiry (reverts if the app was away past the window) — the clock is
  // refreshed by real user touches via the root touch-capture (App.tsx),
  // deliberately NOT by app-open. Registered once regardless of current state.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') checkLowLightExpiry();
    });
    return () => sub.remove();
  }, []);
  if (!on) return null;
  return (
    <>
      <View pointerEvents="none" style={[styles.dim, { opacity: LOW_LIGHT_DIM }]} />
      {/* Very-light RED wash over the ENTIRE screen while low-light is engaged
          (owner 2026-08-01) — full-bleed from y=0 so it also tints the status-bar
          region (clock, cell, Wi-Fi, battery background) as far as the app can
          reach. The OS's own status-bar glyphs are composited above the app and
          can't be recoloured from JS, but everything the app draws is tinted.
          The old red "active" top line is removed (owner 2026-08-01). */}
      <View pointerEvents="none" style={styles.redWash} />
    </>
  );
}

/** Low-light toggle row (Profile screen). */
export function LowLightRow() {
  const on = useLowLight();
  return (
    <Pressable
      onPress={toggleLowLight}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel="Low-Light Production Mode"
      accessibilityHint="Dims the whole app and stops anything from appearing on screen. Tap the screen quickly six times to cancel it."
      style={[styles.row, on && styles.rowOn]}
    >
      <View style={[styles.dot, on && styles.dotOn]} />
      <Text style={[styles.label, on && styles.labelOn]}>
        LOW-LIGHT PRODUCTION MODE{on ? ' · ON' : ''}
      </Text>
      <View style={{ flex: 1 }} />
      <View style={[styles.track, on && styles.trackOn]}>
        <View style={[styles.thumb, on && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

/**
 * LowLightProductionGate — mounted once at the app root. The moment Low-Light
 * Production Mode is switched ON, it shows a single confirming popup that tells
 * the user (a) nothing will appear/flash anywhere in the app while it's on, and
 * (b) they can cancel it at any time by tapping the screen quickly six times (or
 * from Settings). This is the ONE popup allowed on enable — everything else is
 * suppressed. It self-closes when the mode turns off.
 */
export function LowLightProductionGate() {
  const on = useLowLight();
  const [showInfo, setShowInfo] = useState(false);
  // Show ONLY on an explicit user activation (never on a persisted-on relaunch).
  useEffect(() => onLowLightActivated(() => setShowInfo(true)), []);
  // Any time the mode is off, make sure the notice is closed (6-tap, toggle-off,
  // or expiry).
  useEffect(() => {
    if (!on) setShowInfo(false);
  }, [on]);
  // Hold the dim wash back for exactly as long as this notice is up — and
  // release it however the notice goes away, including an unmount or a 6-tap
  // cancel, so the flag can never strand the app un-dimmed while the mode is on.
  useEffect(() => {
    setLowLightGatePending(showInfo && on);
    return () => setLowLightGatePending(false);
  }, [showInfo, on]);

  if (!on || !showInfo) return null;
  return (
    <Modal accessibilityViewIsModal transparent animationType="fade" visible statusBarTranslucent onRequestClose={() => setShowInfo(false)}>
      <View style={styles.gateBackdrop}>
        <View style={styles.gateCard}>
          <Text style={styles.gateEyebrow}>LOW-LIGHT PRODUCTION MODE</Text>
          <Text style={styles.gateTitle}>Nothing will appear on screen</Text>
          <View style={styles.gateRule} />
          <Text style={styles.gateBody}>
            While this mode is on, no pop-ups, notifications, intros, or other screens will appear
            anywhere in the app. The display stays dim and steady, so nothing flashes during a show.
          </Text>
          <Text style={styles.gateBody}>
            You can cancel it at any time: tap the screen quickly six times in a row. You can also turn
            it off from this switch in Settings.
          </Text>
          <Text style={styles.gateNote}>The screen dims when you press PROCEED.</Text>
          <View style={styles.gateBtnRow}>
            <Pressable
              style={[styles.gateBtn, styles.gateBtnGhost]}
              onPress={() => setLowLight(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancel, do not turn on low-light mode"
            >
              <Text style={[styles.gateBtnText, styles.gateBtnTextGhost]}>CANCEL</Text>
            </Pressable>
            <Pressable
              style={[styles.gateBtn, styles.gateBtnPrimary]}
              onPress={() => setShowInfo(false)}
              accessibilityRole="button"
              accessibilityLabel="Proceed and dim the screen"
            >
              <Text style={styles.gateBtnText}>PROCEED</Text>
            </Pressable>
          </View>
        </View>
      </View>
      {/* NO LowLightDim here (owner 2026-08-31). The notice used to sit under
          the wash "so it doesn't read bright" — but that dimmed the one thing
          the user still has to READ, and committed them to the mode before they
          had agreed. The wash is held back until PROCEED instead; the card is
          already near-black on an .86 backdrop, so nothing flashes. */}
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 50,
  },
  // Very-light red wash — a translucent red laid over the whole (already dimmed)
  // screen so low-light mode reads as a gentle night-vision red (owner 2026-08-01).
  redWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,45,30,0.05)',
    zIndex: 55,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
  },
  rowOn: { backgroundColor: '#1c1108', borderColor: EMBER },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#555' },
  dotOn: { backgroundColor: EMBER },
  label: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: '#8a8c90' },
  labelOn: { color: EMBER },
  track: {
    width: 34,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    padding: 2,
    justifyContent: 'center',
  },
  trackOn: { backgroundColor: '#3a1f0d', borderColor: EMBER, alignItems: 'flex-end' },
  thumb: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#777' },
  thumbOn: { backgroundColor: EMBER },

  // On-enable confirmation popup — kept DARK + ember-accented so it doesn't
  // flash bright in a theater (owner 2026-08-01).
  gateBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.86)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
  },
  gateCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(194,84,15,.55)',
    backgroundColor: '#120b06',
    padding: 20,
    gap: 10,
  },
  gateEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 2, color: EMBER },
  gateTitle: { fontFamily: fonts.oswaldMedium, fontSize: 22, color: colors.textPrimary },
  gateRule: { width: 44, height: 2, backgroundColor: EMBER, borderRadius: 1 },
  gateBody: { fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  // Two choices now, so they share a row and each takes half. Both stay ember
  // on near-black — a bright "primary" button would be the exact flash this
  // mode exists to prevent.
  gateBtnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  gateBtn: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(194,84,15,.7)',
    backgroundColor: '#241206',
  },
  gateBtnPrimary: { borderColor: EMBER },
  gateBtnGhost: { borderColor: '#3a3a3a', backgroundColor: 'transparent' },
  gateBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1, color: EMBER },
  gateBtnTextGhost: { color: '#8a8c90' },
  gateNote: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12,
    lineHeight: 16,
    color: '#8a8c90',
    marginTop: 10,
  },
});
