/**
 * AudioOutputRow — the Profile-screen control for the global audio-output mute
 * (owner request 2026-07-25). Placed directly below <LowLightRow/>.
 *
 *  • MUTED (default): a status line ("AUDIO OUTPUT · MUTED") plus the 5-second
 *    HoldToActivate button — holding the full 5s enables output.
 *  • ON: an "AUDIO OUTPUT · ON" row that taps to mute again, with a hint that it
 *    auto-mutes after 10 minutes idle or when the app is reopened.
 *
 * Styling follows features/settings/LowLightLayer.tsx so it sits consistently in
 * the Profile row stack.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HoldToActivate } from '../../components/HoldToActivate';
import { colors, fonts } from '../../theme/tokens';
import { disableAudioOutput, enableAudioOutput, noteAudioActivity, useAudioOutputEnabled } from './audioOutputStore';

// ON state reads RED (owner request 2026-07-25) — a live "audio output is armed"
// warning colour, matching the global red screen border.
const RED = '#e0342f';

export function AudioOutputRow() {
  const on = useAudioOutputEnabled();

  if (on) {
    return (
      <Pressable
        onPress={disableAudioOutput}
        accessibilityRole="switch"
        accessibilityState={{ checked: true }}
        accessibilityLabel="Audio output is on. Tap to mute."
        style={[styles.row, styles.rowOn]}
      >
        <View style={[styles.dot, styles.dotOn]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, styles.labelOn]}>AUDIO OUTPUT · ON</Text>
          <Text style={styles.hint}>Tap to mute · auto-mutes after 10 min idle or on reopen</Text>
        </View>
        <View style={[styles.track, styles.trackOn]}>
          <View style={[styles.thumb, styles.thumbOn]} />
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.mutedWrap}>
      <View style={styles.statusRow}>
        <View style={styles.dot} />
        <Text style={styles.label}>AUDIO OUTPUT · MUTED</Text>
      </View>
      <Text style={styles.mutedHint}>
        The app is silent by default. Hold to allow sound (playback, tone generator, spoken terms).
      </Text>
      <HoldToActivate
        label="HOLD 5s TO TURN ON AUDIO OUTPUT"
        onComplete={() => {
          enableAudioOutput();
          noteAudioActivity();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Shared "muted" container (matches the LowLight row surface).
  mutedWrap: {
    borderRadius: 12,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 9,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mutedHint: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textMuted },

  // ON row — a tappable switch row, green when active.
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
  rowOn: { backgroundColor: '#1f0d0d', borderColor: 'rgba(224,52,47,.6)' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#555' },
  dotOn: { backgroundColor: RED },
  label: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: '#8a8c90' },
  labelOn: { color: RED },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textMuted, marginTop: 2 },
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
  trackOn: { backgroundColor: '#30120f', borderColor: RED, alignItems: 'flex-end' },
  thumb: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#777' },
  thumbOn: { backgroundColor: RED },
});
