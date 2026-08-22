/**
 * CredentialQr — the real, scannable QR for a user's permanent credential token
 * (owner 2026-08-21, QR feature). Encodes the Academy Registry lookup URL
 * (registryUrl(qrToken)). Renders on a white quiet-zone tile so it scans
 * reliably. When no token is available yet (signed out / not issued), callers
 * pass `token={null}` and we show an honest pending tile instead of a fake code.
 *
 * react-native-qrcode-svg is loaded GUARDED (require, not a top-level import): it
 * pulls in `text-encoding` + `qrcode`, which can throw at import on Hermes/newer
 * RN. This component is in the startup chain (RootNavigator → Profile/Directory),
 * so a throwing import would crash the whole app. Guarded require → if it fails
 * we fall back to the pending tile; the app never crashes.
 */
import type { ComponentType } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { registryUrl } from '../features/profile/registry';
import { fonts } from '../theme/tokens';

type QrComponent = ComponentType<{ value: string; size: number; backgroundColor?: string; color?: string }>;

// TEMPORARILY DISABLED (2026-08-21): react-native-qrcode-svg is being isolated as
// a possible launch-crash cause (it drags in text-encoding + qrcode). Kept out of
// the bundle entirely — renders the pending tile — until confirmed safe. Restore
// by uncommenting the require below.
const QRCode: QrComponent | null = null;
// try {
//   const mod = require('react-native-qrcode-svg');
//   QRCode = (mod?.default ?? mod) as QrComponent;
// } catch (e) {
//   console.warn('[credential-qr] react-native-qrcode-svg unavailable:', (e as Error).message);
//   QRCode = null;
// }

export function CredentialQr({
  token,
  size = 120,
  pendingLabel = 'Issued when your Registry ID goes live',
}: {
  token: string | null | undefined;
  size?: number;
  pendingLabel?: string;
}) {
  if (!token || !QRCode) {
    return (
      <View style={[styles.tile, { width: size, height: size }]}>
        <Text style={styles.pendingTitle}>QR</Text>
        <Text style={styles.pendingSub}>{pendingLabel}</Text>
      </View>
    );
  }
  const Qr = QRCode;
  const inner = size - 16;
  return (
    <View style={[styles.tile, { width: size, height: size }]}>
      <Qr value={registryUrl(token)} size={inner} backgroundColor="#ffffff" color="#000000" />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  pendingTitle: { fontFamily: fonts.oswaldBold, fontSize: 22, letterSpacing: 2, color: '#c9c9c9' },
  pendingSub: {
    marginTop: 6,
    fontFamily: fonts.barlowMedium,
    fontSize: 9.5,
    lineHeight: 13,
    textAlign: 'center',
    color: '#9a9a9a',
  },
});
