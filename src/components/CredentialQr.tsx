/**
 * CredentialQr — the real, scannable QR for a user's permanent credential token
 * (owner 2026-08-21, QR feature). Encodes the Academy Registry lookup URL
 * (registryUrl(qrToken)). Renders on a white quiet-zone tile so it scans
 * reliably. When no token is available yet (signed out / not issued), callers
 * pass `token={null}` and we show an honest pending tile instead of a fake code.
 */
import { Text, View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { registryUrl } from '../features/profile/registry';
import { fonts } from '../theme/tokens';

export function CredentialQr({
  token,
  size = 120,
  pendingLabel = 'Issued when your Registry ID goes live',
}: {
  token: string | null | undefined;
  size?: number;
  pendingLabel?: string;
}) {
  if (!token) {
    return (
      <View style={[styles.tile, { width: size, height: size }]}>
        <Text style={styles.pendingTitle}>QR</Text>
        <Text style={styles.pendingSub}>{pendingLabel}</Text>
      </View>
    );
  }
  // White quiet-zone padding around the code keeps it scannable on the dark card.
  const inner = size - 16;
  return (
    <View style={[styles.tile, { width: size, height: size }]}>
      <QRCode value={registryUrl(token)} size={inner} backgroundColor="#ffffff" color="#000000" />
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
