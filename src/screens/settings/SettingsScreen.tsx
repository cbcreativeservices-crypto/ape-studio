/**
 * S11 — Settings (LOCKED June 7; root-stack modal, bottom nav hidden, ✕
 * top-right; visuals from 18-s11-settings.dc.html).
 * Sections: NOTIFICATIONS (the 6 live toggles → notification_preferences,
 * immediate writes, revert on failure) · DISPLAY (Dark mode — dark is the
 * only shipped theme; toggle stored, disabled) · ACCESSIBILITY (font size
 * 13/16/19/24 chips, high contrast, D-1 Color-blind 5-option selector —
 * required by the locked spec though the design omits it, reduce animations,
 * haptics) · ACCOUNT (AP&E ID + app version, read-only). No Save button.
 */
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Toggle } from '../../components/Toggle';
import { resetCoachMarks } from '../../lib/coachMark';
import { sendFeedback } from '../../lib/feedback';
import { supabase } from '../../lib/supabase';
import { colors, fonts } from '../../theme/tokens';
import {
  COLOR_BLIND_MODES,
  COMMERCIAL_NOTIFY_ROWS,
  DEFAULT_LOCAL_SETTINGS,
  FONT_SIZES,
  fetchNotificationPrefs,
  loadLocalSettings,
  NOTIFICATION_ROWS,
  saveLocalSettings,
  updateNotificationPref,
  type LocalSettings,
  type NotificationPrefs,
} from '../../features/settings/store';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [local, setLocal] = useState<LocalSettings>(DEFAULT_LOCAL_SETTINGS);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [apeId, setApeId] = useState('');

  useEffect(() => {
    loadLocalSettings().then(setLocal);
    fetchNotificationPrefs().then(setPrefs);
    supabase
      .from('users')
      .select('ape_student_id')
      .single()
      .then(({ data }) => setApeId(data?.ape_student_id ?? ''));
  }, []);

  const setLocalKey = useCallback(<K extends keyof LocalSettings>(key: K, value: LocalSettings[K]) => {
    setLocal((prev) => {
      const next = { ...prev, [key]: value };
      void saveLocalSettings(next); // immediate write, no Save (locked)
      return next;
    });
  }, []);

  const confirmLogout = useCallback(() => {
    Alert.alert('Log out?', 'You can sign in as a different user afterward.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
        },
      },
    ]);
  }, [navigation]);

  const setPref = useCallback(
    (key: keyof NotificationPrefs, value: boolean) => {
      if (!prefs) return;
      setPrefs({ ...prefs, [key]: value }); // optimistic
      updateNotificationPref(key, value).then((ok) => {
        if (!ok) setPrefs((p) => (p ? { ...p, [key]: !value } : p)); // revert
      });
    },
    [prefs],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close settings">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}>
        {/* NOTIFICATIONS — transport toggles (server) + the commercial content
            notifications (device-local; server prefs frozen). */}
        <View>
          <Text style={styles.sectionEyebrow}>NOTIFICATIONS</Text>
          {NOTIFICATION_ROWS.map((row) => (
            <View key={row.key} style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Toggle
                on={prefs?.[row.key] ?? false}
                disabled={!prefs}
                onChange={(v) => setPref(row.key, v)}
              />
            </View>
          ))}
          {/* The 7 commercial notifications (user request 2026-07-18). */}
          {COMMERCIAL_NOTIFY_ROWS.map((row, i) => (
            <View key={row.key}>
              <View style={[styles.row, i < COMMERCIAL_NOTIFY_ROWS.length - 1 && styles.rowBorder]}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowHint}>{row.hint}</Text>
                </View>
                <Toggle on={local[row.key]} onChange={(v) => setLocalKey(row.key, v)} />
              </View>
              {/* #2 threshold — days of no use before the reminder fires. */}
              {row.key === 'notifyContinue' && local.notifyContinue ? (
                <View style={[styles.row, styles.rowBorder, { paddingLeft: 12 }]}>
                  <Text style={styles.rowHint}>Remind me after this many days of no use</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      style={styles.stepBtn}
                      onPress={() => setLocalKey('continueDays', Math.max(1, local.continueDays - 1))}
                      accessibilityRole="button"
                      accessibilityLabel="Fewer days"
                    >
                      <Text style={styles.stepGlyph}>−</Text>
                    </Pressable>
                    <Text style={styles.stepValue}>
                      {local.continueDays} {local.continueDays === 1 ? 'day' : 'days'}
                    </Text>
                    <Pressable
                      style={styles.stepBtn}
                      onPress={() => setLocalKey('continueDays', Math.min(30, local.continueDays + 1))}
                      accessibilityRole="button"
                      accessibilityLabel="More days"
                    >
                      <Text style={styles.stepGlyph}>+</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          ))}
        </View>

        {/* DISPLAY */}
        <View>
          <Text style={styles.sectionEyebrow}>DISPLAY</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Dark mode</Text>
            {/* Dark is the only shipped theme — value stored, control inert. */}
            <Toggle on={local.darkMode} disabled onChange={(v) => setLocalKey('darkMode', v)} />
          </View>
        </View>

        {/* ACCESSIBILITY */}
        <View>
          <Text style={styles.sectionEyebrow}>ACCESSIBILITY</Text>

          <View style={[styles.rowCol, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Font size</Text>
            <View style={styles.chipRow}>
              {FONT_SIZES.map((fs) =>
                local.fontSize === fs ? (
                  <LinearGradient key={fs} colors={['#ffd35e', '#f09e1a']} style={styles.sizeChipActive}>
                    <Text style={[styles.sizeChipActiveText, { fontSize: fs }]}>{fs}</Text>
                  </LinearGradient>
                ) : (
                  <Pressable key={fs} style={styles.sizeChip} onPress={() => setLocalKey('fontSize', fs)}>
                    <Text style={[styles.sizeChipText, { fontSize: fs }]}>{fs}</Text>
                  </Pressable>
                ),
              )}
            </View>
          </View>

          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>High contrast</Text>
            <Toggle on={local.highContrast} onChange={(v) => setLocalKey('highContrast', v)} />
          </View>

          {/* D-1: Color-blind mode — required by the locked S11 spec. */}
          <View style={[styles.rowCol, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Color-blind mode</Text>
            <View style={styles.chipRow}>
              {COLOR_BLIND_MODES.map((m) => {
                const active = local.colorBlind === m.key;
                return (
                  <Pressable
                    key={m.key}
                    style={[styles.cbChip, active && styles.cbChipActive]}
                    onPress={() => setLocalKey('colorBlind', m.key)}
                  >
                    <Text style={[styles.cbChipText, active && styles.cbChipTextActive]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Reduce animations</Text>
            <Toggle on={local.reduceAnimations} onChange={(v) => setLocalKey('reduceAnimations', v)} />
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Haptic feedback</Text>
            <Toggle on={local.haptics} onChange={(v) => setLocalKey('haptics', v)} />
          </View>
        </View>

        {/* FEEDBACK & SUPPORT — opens the mail composer, pre-filled. */}
        <View>
          <Text style={styles.sectionEyebrow}>FEEDBACK & SUPPORT</Text>
          {(
            [
              ['bug', 'Report a bug'],
              ['term', 'Suggest a new term'],
              ['definition', 'Report a definition error'],
              ['suggestion', 'Suggest a feature for the next version'],
            ] as const
          ).map(([kind, label], i, arr) => (
            <Pressable
              key={kind}
              style={[styles.row, i < arr.length - 1 && styles.rowBorder]}
              onPress={() => sendFeedback(kind)}
              accessibilityRole="button"
            >
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={[styles.mono, { color: colors.amber }]}>›</Text>
            </Pressable>
          ))}
          <Text style={styles.thanks}>Thank you for your support!</Text>
        </View>

        {/* ACCOUNT */}
        <View>
          <Text style={styles.sectionEyebrow}>ACCOUNT</Text>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Student ID</Text>
            <Text style={styles.mono}>{apeId}</Text>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>App version</Text>
            <Text style={[styles.mono, { color: colors.textSubAlt }]}>
              {Constants.expoConfig?.version ?? '0.0.0'}
            </Text>
          </View>
          {/* Log out → sign out then bounce to Splash, which re-checks the
              session and routes to Landing/Auth for the next user (Booth 2026-07-11). */}
          <Pressable style={styles.row} onPress={confirmLogout} accessibilityRole="button" accessibilityLabel="Log out">
            <Text style={styles.rowLabel}>Log out</Text>
            <Text style={[styles.mono, { color: colors.amber }]}>SIGN OUT ›</Text>
          </Pressable>
        </View>

        {/* DEV — only in development builds; not shipped to students. */}
        {__DEV__ && (
          <View>
            <Text style={styles.sectionEyebrow}>DEV</Text>
            <Pressable
              style={styles.row}
              onPress={() =>
                resetCoachMarks().then(() =>
                  Alert.alert('Hints reset', 'Onboarding hints will show again on next open.'),
                )
              }
            >
              <Text style={styles.rowLabel}>Reset onboarding hints</Text>
              <Text style={[styles.mono, { color: colors.amber }]}>RESET</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineDim,
    backgroundColor: '#121212',
  },
  headerTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.6, color: colors.textPrimary },
  close: { fontSize: 18, color: colors.textSubAlt },
  scroll: { padding: 16, gap: 20 },

  sectionEyebrow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 2.2,
    color: colors.amberLabel,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowCol: { paddingVertical: 12, gap: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  rowLabel: { fontFamily: fonts.barlowRegular, fontSize: 15, color: colors.textSecondary },
  rowHint: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  thanks: { fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 13, color: colors.amber, marginTop: 10, paddingVertical: 4 },
  mono: { fontFamily: fonts.mono, fontSize: 12, color: colors.amber },

  chipRow: { flexDirection: 'row', gap: 8 },
  sizeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sizeChipText: { fontFamily: fonts.barlowRegular, color: '#888888' },
  sizeChipActive: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 6 },
  sizeChipActiveText: { fontFamily: fonts.barlowSemiBold, color: '#221500' },

  cbChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cbChipActive: { backgroundColor: '#1d1607', borderColor: 'rgba(255,180,0,.65)' },
  cbChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.9, color: '#999999' },
  cbChipTextActive: { color: colors.amber },

  // "Days of no use" stepper (user request 2026-07-18).
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  stepGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.amber, marginTop: -2 },
  stepValue: { fontFamily: fonts.barlowSemiBold, fontSize: 14, color: colors.textSecondary, minWidth: 48, textAlign: 'center' },
});
