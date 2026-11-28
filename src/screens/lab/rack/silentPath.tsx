/**
 * silentPath — the SILENT LEARNER's frame (lab fix round 1, 2026-11-14,
 * section 3 row 3; owner: "Begin fixing all bugs found and do obvious ...
 * fixes as you suggested in the report", suggested order item 4).
 *
 * The audit (pattern 3): "Set SOURCE to PINK NOISE and tap ▶. With sound off,
 * nothing visible happens and nothing says why." Game Audio already proves the
 * cure ("(not heard: sound is off)", and it still teaches). Three small parts,
 * each opt-in per lab:
 *
 *   1. SoundOffLine — one line in the student's voice, shown ONLY while sound
 *      is off: "Sound off? You can still do every step. The readouts show what
 *      you would hear." A rack prints it at the top of its well when the stage
 *      asks (`RackStage.soundOffLine`).
 *   2. NeedsSoundTag — a small "NEEDS SOUND" pill a lab puts on a step or a
 *      goal chip that truly cannot be done or seen without sound. Grey while
 *      sound is on, amber while it is off (that is when it matters).
 *   3. silentValue / BezelItem.silent — what a readout shows while sound is
 *      off: a stored, last-heard or modelled value instead of "—", read aloud
 *      with "(not heard: sound is off)".
 *
 * "Sound is off" is the app's own AUDIO OUTPUT gate (audioOutputStore): off by
 * default, on only after the learner turned it on this session. Nothing here
 * plays, asks for or changes sound. The words and the pure rules live in
 * silentRules.ts.
 */
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { useAudioOutputEnabled } from '../../../features/audio/audioOutputStore';
import { colors, fonts } from '../../../theme/tokens';
import { NEEDS_SOUND, SOUND_OFF_LINE } from './silentRules';

export { NEEDS_SOUND, NOT_HEARD, SOUND_OFF_LINE, needsSoundA11y, silentValue, soundOffLineText } from './silentRules';

/** True while the app's sound output is off (the default on every launch). */
export function useSoundOff(): boolean {
  return !useAudioOutputEnabled();
}

/**
 * The frame line. Renders nothing while sound is on. `text` = the lab's own
 * words (default SOUND_OFF_LINE).
 */
export function SoundOffLine({ text, style }: { text?: string; style?: StyleProp<TextStyle> }) {
  const off = useSoundOff();
  if (!off) return null;
  return (
    <Text style={[styles.line, style]} accessibilityRole="text" accessibilityLiveRegion="polite">
      {text ?? SOUND_OFF_LINE}
    </Text>
  );
}

/**
 * The "needs sound" pill. Works inline inside a <Text> (a nested Text) or on
 * its own beside a chip. Never a lock: it only says what the step needs.
 */
export function NeedsSoundTag({ style }: { style?: StyleProp<TextStyle> }) {
  const off = useSoundOff();
  return (
    <Text style={[styles.tag, off && styles.tagOff, style]} accessibilityLabel="needs sound" maxFontSizeMultiplier={1.4}>
      {` ${NEEDS_SOUND} `}
    </Text>
  );
}

const styles = StyleSheet.create({
  line: {
    fontFamily: fonts.barlowMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,198,77,.55)',
    paddingLeft: 9,
  },
  tag: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textSub,
    backgroundColor: '#1d1d22',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tagOff: { color: colors.amber, backgroundColor: '#2a2210' },
});
