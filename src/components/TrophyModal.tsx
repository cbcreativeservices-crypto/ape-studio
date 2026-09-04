/**
 * TrophyModal — a full-screen popup that shows a single trophy at FULL size,
 * 100% colour and brightness (Booth 2026-07-11). Opened by tapping a trophy on
 * the Achievements grid or the Dashboard topic card; tap anywhere to dismiss.
 * Presentation only — no data fetching, no navigation.
 */
import { type ReactNode } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { TrophyImage } from './TrophyImage';
import { fonts } from '../theme/tokens';
import { LowLightDim } from '../features/settings/LowLightLayer';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// Trophy zoom art reduced 23% (Booth 2026-07-11).
const ART = Math.round(Math.min(SCREEN_W * 0.82, SCREEN_H * 0.55, 360) * 0.77);

export function TrophyModal({
  visible,
  iconUrl,
  name,
  color = '#ffc233',
  meta,
  action,
  children,
  onClose,
}: {
  visible: boolean;
  iconUrl: string | null | undefined;
  name?: string | null;
  /** Field/category color — used for the frame glow behind the art. */
  color?: string;
  /** Optional line under the name (e.g. "EARNED SEP 2, 2026"). */
  meta?: string | null;
  /** Optional action (e.g. download the certificate PDF). Its own tap does not
   *  dismiss — only the surrounding scrim does. */
  action?: { label: string; onPress: () => void; busy?: boolean } | null;
  /** Optional custom art node (used when art is a bundled asset, not a URL). */
  children?: ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal accessibilityViewIsModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Tap anywhere on the scrim to hide (Booth 2026-07-11). */}
      <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close trophy">
        <View
          style={[styles.frame, { width: ART, height: ART, borderColor: color, shadowColor: color }]}
          pointerEvents="none"
        >
          {children ?? (
            <TrophyImage iconUrl={iconUrl} fill radius={14} fallback={<View style={styles.empty} />} />
          )}
        </View>
        {name ? <Text style={styles.name}>{name.toUpperCase()}</Text> : null}
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        {action ? (
          <Pressable
            onPress={action.onPress}
            disabled={action.busy}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            style={({ pressed }) => [styles.action, { borderColor: color }, pressed && styles.actionPressed]}
          >
            <Text style={[styles.actionText, { color }]}>{action.busy ? 'WORKING…' : action.label}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.hint}>TAP TO CLOSE</Text>
      </Pressable>
      <LowLightDim />
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    padding: 24,
  },
  frame: {
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#0d0d0e',
    overflow: 'hidden',
    shadowOpacity: 0.7,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  empty: { flex: 1, backgroundColor: '#1a1a1c' },
  name: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 18,
    letterSpacing: 1.2,
    color: '#f2f2f2',
    textAlign: 'center',
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.62)',
    textAlign: 'center',
    marginTop: -8,
  },
  action: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  actionPressed: { opacity: 0.7 },
  actionText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4 },
  hint: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.5)',
  },
});
