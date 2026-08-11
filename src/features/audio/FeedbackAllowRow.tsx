/**
 * FeedbackAllowRow — the PHYSICAL override for the mic↔︎speaker feedback
 * interlock (owner request 2026-07-26: "If and only when my app needs them to
 * turn this off, have it there in that location a setting the user can
 * physically have to switch on them self").
 *
 * By default the speaker is auto-muted whenever the mic is capturing (see
 * MicFeedbackGuard). This tickbox — shown ONLY in the one place the app needs
 * mic + speaker at once (Harmonic Lab LIVE) — lets the user knowingly accept the
 * feedback risk so the reference tone can sound while the mic measures it.
 *
 * Session-only + self-resetting: it defaults OFF and forces itself back OFF when
 * it unmounts, so leaving LIVE mode always re-arms the interlock. Styled as a
 * WARNING (red), distinct from the neutral SpeakerOutputToggle.
 */
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { setFeedbackAllowed, useFeedbackAllowed } from './audioOutputStore';

const WARN_RED = '#ff2a2a';

export function FeedbackAllowRow() {
  const allowed = useFeedbackAllowed();

  // Always leave the interlock armed when this control goes away.
  useEffect(() => () => setFeedbackAllowed(false), []);

  return (
    <Pressable
      style={[styles.row, allowed && styles.rowOn]}
      onPress={() => setFeedbackAllowed(!allowed)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: allowed }}
      accessibilityLabel="Allow speaker output while the microphone is on"
    >
      <View style={[styles.box, allowed && styles.boxOn]}>
        {allowed ? <Text style={styles.check}>✓</Text> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, allowed && styles.labelOn]}>
          ⚠ ALLOW SPEAKER WHILE MIC IS ON
        </Text>
        <Text style={styles.sub}>
          {allowed
            ? 'Feedback protection OFF — the reference tone can sound while the mic listens. Use headphones or low volume to avoid howl.'
            : 'The speaker is muted while the mic is on to prevent feedback. Turn this on only if you need to hear the tone while measuring.'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,42,42,.35)',
    backgroundColor: 'rgba(255,42,42,.06)',
  },
  rowOn: { borderColor: WARN_RED, backgroundColor: 'rgba(255,42,42,.14)' },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,42,42,.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxOn: { borderColor: WARN_RED, backgroundColor: 'rgba(255,42,42,.2)' },
  check: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: WARN_RED, marginTop: -1 },
  label: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
  labelOn: { color: WARN_RED },
  sub: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub, marginTop: 2 },
});
