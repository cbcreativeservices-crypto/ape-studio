/**
 * ShareTermSheet — pop-up preview for sharing a glossary term (user request
 * 2026-07-17: show the share as a styled card FIRST so its look can be tuned,
 * then hand off to the native share sheet on SHARE).
 *
 * The preview card mirrors the exact plain-text message that gets shared:
 * term · definition · the academy sign-off line.
 */
import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { GlassButton } from './GlassButton';
import { StudioButton } from './StudioButton';
import { ShareIcon } from './ShareIcon';
import { colors, fonts } from '../theme/tokens';

export type ShareTermPayload = { term: string; definition: string };

export function shareMessageFor(p: ShareTermPayload): string {
  return `${p.term}\n\n${p.definition}\n\n— from the Pro Audio Training Academy glossary`;
}

export function ShareTermSheet({
  payload,
  onClose,
}: {
  /** Term to preview/share; null = sheet hidden. */
  payload: ShareTermPayload | null;
  onClose: () => void;
}) {
  const doShare = () => {
    if (!payload) return;
    void Share.share({ message: shareMessageFor(payload) }).finally(onClose);
  };
  return (
    <Modal visible={!!payload} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
        {payload ? (
          <View style={styles.card}>
            <View style={styles.headRow}>
              <ShareIcon size={17} color={colors.amber} />
              <Text style={styles.eyebrow}>SHARE THIS TERM</Text>
            </View>

            {/* Preview — what the recipient reads. */}
            <View style={styles.preview}>
              <Text style={styles.term}>{payload.term}</Text>
              <Text style={styles.def} numberOfLines={8}>
                {payload.definition}
              </Text>
              <View style={styles.brandRow}>
                <View style={styles.brandRule} />
                <Text style={styles.brand}>PRO AUDIO TRAINING ACADEMY · GLOSSARY</Text>
              </View>
            </View>
            <Text style={styles.note}>Sent as plain text via your share sheet.</Text>

            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <StudioButton label="Cancel" variant="secondary" small onPress={onClose} />
              </View>
              <View style={{ flex: 1 }}>
                <GlassButton label="SHARE…" tint="blue" height={42} fontSize={13} onPress={doShare} />
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.74)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#161719',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2c2d31',
    padding: 18,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.amber },
  // Preview card — deliberately lighter than the sheet so it reads as "the
  // thing being sent", not more UI.
  preview: {
    backgroundColor: '#1e1f22',
    borderWidth: 1,
    borderColor: '#33343a',
    borderRadius: 10,
    padding: 16,
    gap: 10,
  },
  term: { fontFamily: fonts.oswaldMedium, fontSize: 21, letterSpacing: 0.5, color: colors.textPrimary },
  def: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  brandRule: { width: 18, height: 1, backgroundColor: 'rgba(255,180,0,.5)' },
  brand: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.4, color: colors.amberLabel },
  note: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 14 },
});
