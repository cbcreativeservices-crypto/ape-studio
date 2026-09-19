/**
 * PrePaywallPrompt — a brief, dismiss-only notice (user request 2026-07-22:
 * make it as short as possible; a single "Got it, continue" button, no
 * create-account / see-plans link). Used by the Enrollment screen edit-gate and
 * the Awards enroll buttons to briefly explain and dismiss.
 *
 * ⛔ `embedded` — USE IT WHENEVER A MODAL IS ALREADY OPEN.
 *
 * On Android every RN <Modal> is its own Dialog window. A Modal rendered as a
 * SIBLING of an open Modal attaches to the ACTIVITY window, which sits BELOW
 * that open Dialog — so the notice renders behind the sheet that triggered it,
 * unreadable and unreachable, and then fades out. Found on device 2026-09-19:
 * an anonymous user enrolled, the button said ENROLLED ✓, and the one message
 * telling them it would not be saved was drawn behind the card.
 *
 * `embedded` drops the Modal wrapper and renders the same backdrop + card as an
 * absolutely-positioned overlay, so it can be placed INSIDE the open modal's
 * own tree and is then guaranteed to be on top. Identical look either way.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Modal } from './DimModal';
import { colors, fonts } from '../theme/tokens';

const GREEN = '#37e05f';

export function PrePaywallPrompt({
  visible,
  onClose,
  title,
  lines,
  primaryLabel,
  onPrimary,
  dismissLabel,
  embedded,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  lines?: string[];
  /** Optional primary CTA (e.g. "EXPLORE MEMBERSHIP?") shown above a plain
   *  RETURN button. When omitted the prompt keeps its single dismiss button. */
  primaryLabel?: string;
  onPrimary?: () => void;
  dismissLabel?: string;
  /** Render as an in-tree overlay instead of its own Modal. Required when a
   *  Modal is already open — see the note at the top of this file. */
  embedded?: boolean;
}) {
  const body = (
    <View style={[styles.backdrop, embedded ? StyleSheet.absoluteFill : null]} accessibilityViewIsModal>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss" />
        <View style={styles.card}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {(lines ?? []).map((l, i) => (
            <Text key={i} style={styles.body}>
              {l}
            </Text>
          ))}
          {onPrimary ? (
            <>
              <Pressable style={styles.btn} onPress={onPrimary} accessibilityRole="button" accessibilityLabel={primaryLabel ?? 'Explore membership'}>
                <Text style={styles.btnText}>{primaryLabel ?? 'EXPLORE MEMBERSHIP?'}</Text>
              </Pressable>
              <Pressable style={styles.btnSecondary} onPress={onClose} accessibilityRole="button" accessibilityLabel={dismissLabel ?? 'Return'}>
                <Text style={styles.btnSecondaryText}>{dismissLabel ?? 'RETURN'}</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.btn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Got it, continue">
              <Text style={styles.btnText}>GOT IT, CONTINUE</Text>
            </Pressable>
          )}
        </View>
    </View>
  );

  if (embedded) return visible ? body : null;
  return (
    <Modal accessibilityViewIsModal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      {body}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,8,10,0.72)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  card: { width: '100%', maxWidth: 340, backgroundColor: '#17181a', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(55,224,95,.35)', padding: 18, gap: 8 },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 17, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },
  btn: { marginTop: 4, borderRadius: 9, backgroundColor: 'rgba(55,224,95,.12)', borderWidth: 1.5, borderColor: 'rgba(55,224,95,.7)', paddingVertical: 11, alignItems: 'center' },
  btnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: GREEN },
  btnSecondary: { borderRadius: 9, borderWidth: 1, borderColor: '#3a3a3a', backgroundColor: '#141414', paddingVertical: 11, alignItems: 'center' },
  btnSecondaryText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: colors.textSecondary },
});
