/**
 * MembershipGate — the app-themed "Academy membership required" popup
 * (owner 2026-09-10: the native Alert the tool gates used — gray card, white
 * text, blue links — "does not match the app at all").
 *
 * One HOST at the App root + a tiny external store, so every gate call site
 * (useFullScreenGate / useSaveGate across the seven tool screens, and any
 * future gate) opens the SAME styled card with no per-screen wiring — the
 * tunerFrameStore pattern. Visuals match the app's standing member popup
 * (ColorWheelButton's MEMBER FEATURE card): dimmed scrim, dark card, amber
 * title, GET MEMBERSHIP glass-adjacent CTA → Paywall, quiet NOT NOW.
 */
import { useSyncExternalStore } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { navigationRef } from '../../navigation/navigationRef';
import { colors, fonts } from '../../theme/tokens';

export type MembershipGatePayload = {
  /** Card headline (defaults to ACADEMY MEMBERSHIP). */
  title?: string;
  /** One short paragraph on what membership unlocks here. */
  body: string;
};

let current: MembershipGatePayload | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function openMembershipGate(payload: MembershipGatePayload): void {
  current = payload;
  emit();
}

export function closeMembershipGate(): void {
  if (current == null) return;
  current = null;
  emit();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

function useMembershipGate(): MembershipGatePayload | null {
  return useSyncExternalStore(subscribe, () => current, () => current);
}

/** Render ONCE at the App root (inside the NavigationContainer). */
export function MembershipGateHost() {
  const gate = useMembershipGate();
  if (gate == null) return null;
  return (
    <Modal accessibilityViewIsModal visible transparent animationType="fade" onRequestClose={closeMembershipGate}>
      <Pressable style={styles.scrim} onPress={closeMembershipGate} accessible={false}>
        {/* Stop card taps from falling through to the scrim's dismiss. */}
        <Pressable style={styles.card} onPress={() => {}} accessible={false}>
          <Text style={styles.lock}>🔒</Text>
          <Text style={styles.title}>{gate.title ?? 'ACADEMY MEMBERSHIP'}</Text>
          <Text style={styles.body}>{gate.body}</Text>
          <Pressable
            style={styles.cta}
            onPress={() => {
              closeMembershipGate();
              if (navigationRef.isReady()) navigationRef.navigate('Paywall');
            }}
            accessibilityRole="button"
            accessibilityLabel="Get Academy membership"
          >
            <Text style={styles.ctaText}>GET MEMBERSHIP</Text>
          </Pressable>
          <Pressable onPress={closeMembershipGate} hitSlop={8} accessibilityRole="button" accessibilityLabel="Not now">
            <Text style={styles.dismiss}>NOT NOW</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Visual twins of ColorWheelButton's member card — the app's popup voice.
const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b2b33',
    backgroundColor: '#141418',
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  lock: { fontSize: 30 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 2, color: colors.amber, textAlign: 'center' },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
  cta: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.55)',
    backgroundColor: '#1c1608',
    paddingVertical: 12,
    paddingHorizontal: 26,
  },
  ctaText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.amber },
  dismiss: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textMuted, paddingVertical: 6 },
});
