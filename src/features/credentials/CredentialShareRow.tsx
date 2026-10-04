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
import { useInFlightLatch, useLatchedPress } from '../../lib/latch';
import { colors, fonts } from '../../theme/tokens';
import { CARD_W, CredentialShareCard } from './CredentialShareCard';
import {
  canCopy,
  copyRegistryLink,
  shareOutcomeMessage,
  shareRegistryLink,
} from './shareCredential';
import { fetchMyQrTokenOrThrow, fetchMyRegistryName } from '../profile/api';
import { registryUrl } from '../profile/registry';

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
  /** Re-runs the reads below — SHARE QR asks for it when the token is missing. */
  const [loadNonce, setLoadNonce] = useState(0);
  /** The holder-name read FAILED (as opposed to "no name set"). */
  const [nameFailed, setNameFailed] = useState(false);
  /** The QR-token read FAILED (as opposed to "no token yet"). */
  const [tokenFailed, setTokenFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    // All three reads are best-effort: the row still renders, and each action
    // reports honestly if the token never arrived.
    // fetchMyRegistryName THROWS on a failed read (2026-10-01). The failure is
    // REMEMBERED, not flattened to "no name" (full-app run 2): the placeholder
    // 'Academy Member' is right only for a member who has not set a name, and
    // SHARE QR below refuses to photograph a card that guessed.
    void Promise.all([
      fetchMyRegistryName().then(
        (n) => ({ failed: false, name: n }),
        () => ({ failed: true, name: null as string | null }),
      ),
      // STRICT token read (hunt 9, 2026-10-03): a token read that FAILED is
      // remembered, not flattened to "no token yet" — SHARE QR used to tell an
      // offline member their record "is still being set up".
      fetchMyQrTokenOrThrow().then(
        (t) => ({ failed: false, token: t }),
        () => ({ failed: true, token: null as string | null }),
      ),
    ]).then(
      ([nameRead, tokRead]) => {
        if (!alive) return;
        setNameFailed(nameRead.failed);
        if (nameRead.name) setHolderName(nameRead.name);
        setTokenFailed(tokRead.failed);
        setToken(tokRead.token);
        // ONE READ, ONE TOKEN (hunt 10, 2026-10-03): the printed address came
        // from a SECOND, independent token read (myRegistryLink). When that one
        // failed and the first did not, SHARE QR sent a card with a working QR
        // captioned "Your verified record is still being set up." The address
        // is derived from the token on the card, as certificatePdf does.
        setUrl(tokRead.token ? registryUrl(tokRead.token) : null);
      },
    );
    return () => {
      alive = false;
    };
  }, [loadNonce]);

  const copyNow = useCallback(async () => {
    setBusy('copy');
    const res = await copyRegistryLink();
    setBusy(null);
    onMessage(res.ok ? 'Link copied.' : shareOutcomeMessage(res, 'link'));
  }, [onMessage]);

  const linkNow = useCallback(async () => {
    setBusy('link');
    const res = await shareRegistryLink(credentialName ?? undefined);
    setBusy(null);
    // A dismissed sheet reports null — the user closed it on purpose.
    onMessage(res.ok ? null : shareOutcomeMessage(res, 'link'));
  }, [credentialName, onMessage]);

  const qrNow = useCallback(async () => {
    /**
     * NO TOKEN, NO CARD (full-app run 1, 2026-10-01). Tapped before the reads
     * above landed — or after a read that came back empty — the card was
     * photographed as it stood: no QR, "still being set up" for the address,
     * and the placeholder 'Academy Member' in place of the member's name. That
     * image went out through the share sheet as their credential. Say the
     * honest thing and read again, so "try again shortly" actually works.
     */
    if (!token) {
      setLoadNonce((n) => n + 1);
      onMessage(shareOutcomeMessage({ ok: false, reason: tokenFailed ? 'failed' : 'no_token' }, 'QR'));
      return;
    }
    // …and no card carrying a stand-in name because the name read FAILED
    // (full-app run 2): read again, and say so honestly.
    if (nameFailed) {
      setLoadNonce((n) => n + 1);
      onMessage(shareOutcomeMessage({ ok: false, reason: 'failed' }, 'QR'));
      return;
    }
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
  }, [token, tokenFailed, nameFailed, url, onMessage]);

  // ONE share at a time across all three buttons (pattern P9, 2026-10-02).
  // `busy` is state, so a same-frame double tap — or SHARE LINK then SHARE QR —
  // started a second share while the first sheet was opening; iOS refused it
  // and the row reported "Could not share the QR image" for a share that was
  // in fact on screen. The latch is a ref, claimed inside the tap.
  const shareLatch = useInFlightLatch();
  const copy = useLatchedPress(copyNow, shareLatch);
  const link = useLatchedPress(linkNow, shareLatch);
  const qr = useLatchedPress(qrNow, shareLatch);

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
