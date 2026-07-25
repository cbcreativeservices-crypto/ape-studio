/**
 * DeleteAccountButton — irreversible account erasure (owner-approved 2026-07-25).
 * Press-and-HOLD for 5 seconds (animated fill + live countdown) → a FINAL confirm
 * popup → calls the user-triggered `delete_my_account` RPC → signs out. Deletes the
 * caller's personal records + identity; any future registry link then resolves to a
 * generic "account deleted" page (no personal info).
 */
import { useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { colors, fonts } from '../../theme/tokens';

const HOLD_MS = 5000;

export function DeleteAccountButton({ onDeleted }: { onDeleted: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const [holding, setHolding] = useState(false);
  const [secs, setSecs] = useState(5);
  const [busy, setBusy] = useState(false);

  const clearTick = () => {
    if (tick.current) {
      clearInterval(tick.current);
      tick.current = null;
    }
  };

  const reset = () => {
    anim.current?.stop();
    clearTick();
    setHolding(false);
    setSecs(5);
    Animated.timing(progress, { toValue: 0, duration: 140, useNativeDriver: false }).start();
  };

  const start = () => {
    if (busy) return;
    setHolding(true);
    setSecs(5);
    progress.setValue(0);
    let left = 5;
    tick.current = setInterval(() => {
      left -= 1;
      setSecs(Math.max(0, left));
      if (left <= 0) clearTick();
    }, 1000);
    anim.current = Animated.timing(progress, { toValue: 1, duration: HOLD_MS, useNativeDriver: false });
    anim.current.start(({ finished }) => {
      clearTick();
      setHolding(false);
      if (finished) askFinalConfirm();
    });
  };

  const askFinalConfirm = () => {
    Animated.timing(progress, { toValue: 0, duration: 140, useNativeDriver: false }).start();
    Alert.alert(
      'Delete account permanently?',
      'This erases your account and all personal records for good. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete forever', style: 'destructive', onPress: runDelete },
      ],
    );
  };

  const runDelete = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
      await supabase.auth.signOut();
      onDeleted();
    } catch {
      setBusy(false);
      Alert.alert('Could not delete account', 'Something went wrong. Please check your connection and try again.');
    }
  };

  const fillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View>
      <Pressable
        onPressIn={start}
        onPressOut={reset}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Delete account. Press and hold for five seconds."
        style={styles.btn}
      >
        <Animated.View style={[styles.fill, { width: fillWidth }]} />
        <Text style={styles.label}>
          {busy ? 'DELETING…' : holding ? `HOLD TO DELETE · ${secs}` : 'DELETE ACCOUNT'}
        </Text>
      </Pressable>
      <Text style={styles.hint}>
        Press and hold for 5 seconds, then confirm. This permanently erases your account and personal
        data — it cannot be undone.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,90,80,.6)',
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a0f0e',
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,90,80,.28)' },
  label: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: '#ff5b52' },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: colors.textSub, marginTop: 6 },
});
