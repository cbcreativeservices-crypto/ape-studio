/**
 * PermissionPrompt + usePermissionFlow — the reusable PRE-PERMISSION popup
 * (owner 2026-07-29). Before the OS dialog we show a short explainer of WHY a
 * capability is needed; the user can Allow, decline (Not now), and — the owner
 * ask — tick "Always allow — don't ask me again" so future uses skip straight
 * to the OS request (which the OS itself only prompts for once).
 *
 * The actual OS request is injected by the caller (`osRequest`) so this file
 * stays free of the native permission libs (which may be absent until the new
 * build): camera → ape-optical, location → expo-location, photo →
 * expo-image-picker. All are behind optional-require gates upstream.
 */
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { getAskMode, setAskMode, type CapabilityKey } from './permissionStore';

export type PermissionCopy = {
  title: string;
  /** Why we need it — plain language, honest about what we do and don't do. */
  body: string;
  /** e.g. 'ALLOW CAMERA'. */
  allowLabel: string;
};

const COPY: Record<CapabilityKey, PermissionCopy> = {
  camera: {
    title: 'Use the camera to measure light?',
    body:
      'The Light-Pulse frequency counter watches how bright the camera image is, ' +
      'over time, to estimate how fast a light flashes. No photo or video is saved, ' +
      'and nothing leaves your device — only the overall brightness is measured.',
    allowLabel: 'ALLOW CAMERA',
  },
  location: {
    title: 'Tag this snapshot with your location?',
    body:
      'A measurement snapshot can record where you took it (GPS), which is handy for ' +
      'venue and field documentation. It is optional, stored only in your device’s ' +
      'measurement library, and never shared automatically.',
    allowLabel: 'ALLOW LOCATION',
  },
  photo: {
    title: 'Add a photo of the room?',
    body:
      'A snapshot can include one photo of the space — useful when documenting a ' +
      'system tuning or a classroom exercise. The photo is stored with the snapshot ' +
      'on your device and never uploaded automatically.',
    allowLabel: 'OPEN CAMERA',
  },
};

/** Result of a permission flow: 'granted' proceeds, anything else stops. */
export type FlowResult = 'granted' | 'denied' | 'blocked' | 'cancelled';

/**
 * usePermissionFlow — returns { request, promptProps }. Render
 * <PermissionPrompt {...promptProps} /> once in the screen; call request()
 * when the user triggers the feature. `osRequest` performs the real OS ask and
 * resolves to whether it was granted.
 */
export function usePermissionFlow(cap: CapabilityKey, osRequest: () => Promise<'granted' | 'denied' | 'blocked'>) {
  const [visible, setVisible] = useState(false);
  const [always, setAlways] = useState(false);
  const [pending, setPending] = useState<((r: FlowResult) => void) | null>(null);

  const runOs = useCallback(
    async (resolve: (r: FlowResult) => void) => {
      try {
        const r = await osRequest();
        resolve(r === 'granted' ? 'granted' : r);
      } catch {
        resolve('denied');
      }
    },
    [osRequest],
  );

  const request = useCallback((): Promise<FlowResult> => {
    return new Promise<FlowResult>(async (resolve) => {
      const mode = await getAskMode(cap);
      if (mode === 'never') {
        resolve('blocked'); // user chose don't-ask; caller points to Settings
        return;
      }
      if (mode === 'always') {
        void runOs(resolve); // skip our explainer, go straight to the OS
        return;
      }
      setAlways(false);
      setPending(() => resolve);
      setVisible(true);
    });
  }, [cap, runOs]);

  const onAllow = useCallback(async () => {
    setVisible(false);
    if (always) await setAskMode(cap, 'always');
    if (pending) void runOs(pending);
    setPending(null);
  }, [always, cap, pending, runOs]);

  const onDecline = useCallback(async () => {
    setVisible(false);
    if (always) await setAskMode(cap, 'never'); // "don't ask again" while declining
    pending?.('cancelled');
    setPending(null);
  }, [always, cap, pending]);

  const promptProps = useMemo(
    () => ({ cap, visible, always, onToggleAlways: () => setAlways((a) => !a), onAllow, onDecline }),
    [cap, visible, always, onAllow, onDecline],
  );

  return { request, promptProps };
}

export function PermissionPrompt({
  cap,
  visible,
  always,
  onToggleAlways,
  onAllow,
  onDecline,
}: {
  cap: CapabilityKey;
  visible: boolean;
  always: boolean;
  onToggleAlways: () => void;
  onAllow: () => void;
  onDecline: () => void;
}) {
  const copy = COPY[cap];
  return (
    <Modal accessibilityViewIsModal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onDecline}>
      <View style={styles.scrim}>
        <View style={styles.card}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.body}>{copy.body}</Text>
          <Pressable style={styles.remember} onPress={onToggleAlways} accessibilityRole="checkbox" accessibilityState={{ checked: always }}>
            <View style={[styles.box, always && styles.boxOn]}>{always ? <Text style={styles.check}>✓</Text> : null}</View>
            <Text style={styles.rememberText}>Always allow — don’t ask me again</Text>
          </Pressable>
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onDecline} accessibilityRole="button" accessibilityLabel="Not now">
              <Text style={styles.btnGhostText}>NOT NOW</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnAllow]} onPress={onAllow} accessibilityRole="button" accessibilityLabel={copy.allowLabel}>
              <Text style={styles.btnAllowText}>{copy.allowLabel}</Text>
            </Pressable>
          </View>
          <Text style={styles.foot}>
            You’re always in control — change this any time in your device Settings, or reset these
            prompts in the app’s Settings.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, borderRadius: 14, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#131316', padding: 18, gap: 12 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 0.4, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  box: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#3a3a44', alignItems: 'center', justifyContent: 'center' },
  boxOn: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,.15)' },
  check: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.amber, marginTop: -1 },
  rememberText: { fontFamily: fonts.barlowMedium, fontSize: 13.5, color: colors.textSecondary, flexShrink: 1 },
  row: { flexDirection: 'row', gap: 10, marginTop: 2 },
  btn: { flex: 1, borderRadius: 9, paddingVertical: 12, alignItems: 'center' },
  btnGhost: { borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#17171c' },
  btnGhostText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
  btnAllow: { backgroundColor: '#1a1409', borderWidth: 1, borderColor: 'rgba(255,198,77,.65)' },
  btnAllowText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
  foot: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: colors.textSub },
});
