/**
 * CredentialShareCard — the picture a member sends when they share their QR.
 *
 * ── WHY A CARD AND NOT JUST THE QR ───────────────────────────────────────────
 *
 * A bare QR square is useless once it leaves the app. The recipient sees a
 * black-and-white pattern with no indication of who it belongs to, what it
 * certifies, or where it goes — and cannot decide whether to trust it before
 * scanning. Worse, a QR nobody can read the destination of is exactly the shape
 * of a phishing image.
 *
 * So the captured card carries all four: the academy, the holder, what they
 * earned, and the URL PRINTED IN WORDS beneath the code. Anyone can read where
 * it goes without scanning anything, and the member can see what they are
 * handing over.
 *
 * ── HOW IT IS CAPTURED ───────────────────────────────────────────────────────
 *
 * `react-native-view-shot` photographs the NATIVE VIEW, so this must be laid
 * out on screen — not `display:none`, not zero-sized — or it captures blank.
 * Callers park it behind the sheet (see the note on `offscreen`), which is the
 * same approach ShareTermSheet and MeasurementShareCard already use.
 *
 * Deliberately NOT a rendering of the printed certificate. That document is
 * built as HTML by `certificateHtml.ts` and exported as a PDF; re-drawing it
 * here in React would create a second, divergent definition of the same
 * artefact — and the two would drift the first time either was edited. The PDF
 * is the certificate. This is the link, made shareable.
 */
import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CredentialQr } from '../../components/CredentialQr';
import { colors, fonts } from '../../theme/tokens';

export const CARD_W = 320;

export type ShareCardProps = {
  /** The member's registry name. 'Academy Member' when they have not set one —
   *  the same honest fallback the printed certificate uses. */
  holderName: string;
  /** The credential being shared, or null for the member's record as a whole. */
  credentialName: string | null;
  /** Their qr_token. Without it the QR renders its own pending state. */
  token: string | null;
  /** The registry URL, printed so it can be read without scanning. */
  url: string | null;
};

export const CredentialShareCard = forwardRef<View, ShareCardProps>(function CredentialShareCard(
  { holderName, credentialName, token, url },
  ref,
) {
  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      <Text style={styles.brand}>PRO AUDIO TRAINING ACADEMY</Text>
      <View style={styles.rule} />

      <Text style={styles.holder} numberOfLines={2}>
        {holderName}
      </Text>
      {credentialName ? (
        <Text style={styles.credential} numberOfLines={3}>
          {credentialName}
        </Text>
      ) : (
        <Text style={styles.credential}>Verified Academy Record</Text>
      )}

      <View style={styles.qrWrap}>
        <CredentialQr token={token} size={180} />
      </View>

      <Text style={styles.verifyLead}>VERIFY AT</Text>
      {/* The address in words. A QR whose destination cannot be read before
          scanning asks for trust it has not earned. */}
      <Text style={styles.url} numberOfLines={3}>
        {url ?? 'Your verified record is still being set up.'}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    backgroundColor: '#0f0f12',
    borderWidth: 1,
    borderColor: '#2a2a30',
    borderRadius: 14,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 6,
  },
  brand: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.8,
    color: colors.amber,
    textAlign: 'center',
  },
  rule: { width: 48, height: 1, backgroundColor: '#3a3a42', marginTop: 4, marginBottom: 10 },
  holder: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 20,
    letterSpacing: 0.4,
    color: '#ffffff',
    textAlign: 'center',
  },
  credential: {
    fontFamily: fonts.barlowMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  qrWrap: { marginBottom: 12 },
  verifyLead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: colors.textSub,
  },
  url: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
