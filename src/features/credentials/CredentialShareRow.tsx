/**
 * CredentialShareRow — copy the link, share the link, share the QR card.
 *
 * Drops into any panel that already knows which credential is open. The printed
 * certificate keeps its own button (`certificatePdf.exportCertificate`), because
 * that path builds a PDF and is already wired in three screens; this adds the
 * two ways of sharing that did not exist at all.
 *
 * ── THE HIDDEN CARD IS NOT HIDDEN ────────────────────────────────────────────
 *
 * `react-native-view-shot` photographs the NATIVE VIEW. A card behind
 * `display:none`, or sized to zero, captures BLANK — MeasurementShareCard
 * carries the same warning after it happened there. So the card is laid out for
 * real and moved off the visible area with a negative offset, inside a
 * `pointerEvents="none"` wrapper so it can never intercept a touch.
 *
 * It is also hidden from assistive technology: a screen reader announcing a
 * duplicate of the credential the user is already looking at is noise.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { captureAndShare, isAvailable as canShareImage } from '../../screens/lab/calc/shareImage';
import { colors, fonts } from '../../theme/tokens';
import { CARD_W, CredentialShareCard } from './CredentialShareCard';
import {
  canCopy,
  copyRegistryLink,
  myRegistryLink,
  shareOutcomeMessage,
  shareRegistryLink,
} from './shareCredential';
import { fetchMyQrToken, fetchMyRegistryName } from '../profile/api';

export function CredentialShareRow({
  credentialName,
  onMessage,
}: {
  /** The credential being shared, or null to share the record as a whole. */
  credentialName: string | null;
  /** Where to surface a one-line result. The row never renders its own toast. */
  onMessage: (text: string | null) => void;
}) {
  const cardRef = useRef<View>(null);
  const [holderName, setHolderName] = useState('Academy Member');
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | 'copy' | 'link' | 'qr'>(null);

  useEffect(() => {
    let alive = true;
    // All three reads are best-effort: the row still renders, and each action
    // reports honestly if the token never arrived.
    void Promise.all([fetchMyRegistryName(), fetchMyQrToken(), myRegistryLink()]).then(
      ([name, tok, link]) => {
        if (!alive) return;
        if (name) setHolderName(name);
        setToken(tok);
        setUrl(link);
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  const copy = useCallback(async () => {
    setBusy('copy');
    const res = await copyRegistryLink();
    setBusy(null);
    onMessage(res.ok ? 'Link copied.' : shareOutcomeMessage(res, 'link'));
  }, [onMessage]);

  const link = useCallback(async () => {
    setBusy('link');
    const res = await shareRegistryLink(credentialName ?? undefined);
    setBusy(null);
    // A dismissed sheet reports null — the user closed it on purpose.
    onMessage(res.ok ? null : shareOutcomeMessage(res, 'link'));
  }, [credentialName, onMessage]);

  const qr = useCallback(async () => {
    setBusy('qr');
    const ok = await captureAndShare(
      cardRef.current,
      'Your credential',
      url ? `Verify at ${url}` : undefined,
    );
    setBusy(null);
    // captureAndShare returns false for both "no native module" and "user
    // cancelled", so this cannot distinguish them — it says the one thing that
    // is true either way rather than guessing.
    onMessage(ok ? null : 'Could not share the QR image. You can copy the link instead.');
  }, [url, onMessage]);

  const imageAvailable = canShareImage();

  return (
    <View style={styles.wrap}>
      <Text style={styles.head}>SHARE</Text>
      <View style={styles.row}>
        {canCopy() ? (
          <ShareBtn label="COPY LINK" onPress={copy} busy={busy === 'copy'} />
        ) : null}
        <ShareBtn label="SHARE LINK" onPress={link} busy={busy === 'link'} />
        {imageAvailable ? <ShareBtn label="SHARE QR" onPress={qr} busy={busy === 'qr'} /> : null}
      </View>
      {!imageAvailable ? (
        // Honest, not silent: the button is absent and the reason is given,
        // rather than a control that does nothing.
        <Text style={styles.note}>Sharing the QR as an image isn’t available on this device.</Text>
      ) : null}

      {/* Laid out for real — see the note at the top of this file. */}
      <View style={styles.offscreen} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <CredentialShareCard ref={cardRef} holderName={holderName} credentialName={credentialName} token={token} url={url} />
      </View>
    </View>
  );
}

function ShareBtn({ label, onPress, busy }: { label: string; onPress: () => void; busy: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, busy && styles.btnBusy]}
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: busy }}
    >
      <Text style={styles.btnText}>{busy ? '…' : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 8, marginTop: 14 },
  head: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.textSub,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  btn: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#1a1a1a',
    borderRadius: 7,
    paddingVertical: 9,
    paddingHorizontal: 14,
    // 44pt minimum touch target (a11y worklist).
    minHeight: 44,
    justifyContent: 'center',
  },
  btnPressed: { opacity: 0.8 },
  btnBusy: { opacity: 0.6 },
  btnText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11.5,
    letterSpacing: 1,
    color: colors.textPrimary,
  },
  note: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12,
    color: colors.textSub,
    textAlign: 'center',
  },
  // Kept in the tree and LAID OUT so react-native-view-shot can photograph it,
  // pushed far off-screen so it never shows. Matches ShareTermSheet's
  // `captureHost`, which is the pattern that already works in this app.
  //
  // ⚠️ NO `opacity: 0` HERE. view-shot photographs the native view, and a
  // transparent view can photograph transparent — the same class of mistake as
  // display:none, which MeasurementShareCard documents after it captured blank.
  // Moving it off-screen is enough.
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
    width: CARD_W,
  },
});
