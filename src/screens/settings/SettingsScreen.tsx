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
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Toggle } from '../../components/Toggle';
import { TextField } from '../../components/TextField';
import { StudioButton } from '../../components/StudioButton';
import { resetCoachMarks } from '../../lib/coachMark';
import { resetScreenIntros } from '../../features/intro/screenIntros';
import { resetAmplitudeOrientation } from '../../features/lab/amplitudeOrientation';
import { resetAskModes } from '../../features/permissions/permissionStore';
import { hasCrowdsourceConsent, setCrowdsourceConsent } from '../../features/tools/measure/deviceProfile';
import { sendFeedback } from '../../lib/feedback';
import { redeemAccessCode } from '../../features/commercial/accessCode';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { supabase } from '../../lib/supabase';
import { colors, fonts } from '../../theme/tokens';
import {
  COLOR_BLIND_MODES,
  COMMERCIAL_NOTIFY_ROWS,
  DEFAULT_LOCAL_SETTINGS,
  FONT_SIZES,
  fetchNotificationPrefs,
  formatClock,
  loadLocalSettings,
  NOTIFICATION_ROWS,
  NOTIFY_FREQ,
  saveLocalSettings,
  shortDay,
  updateNotificationPref,
  type CommercialNotifyKey,
  type LocalSettings,
  type NotificationPrefs,
} from '../../features/settings/store';
import { NotifyScheduleModal } from '../../features/settings/NotifyScheduleModal';
import { DeleteAccountButton } from '../../features/settings/DeleteAccountButton';
import { registerAndSavePushToken } from '../../features/notifications/push';
import {
  WEEKLY_CONCEPT_CATEGORIES,
  deactivateAllWeeklySubscriptions,
  dowToDayName,
  fetchWeeklySubscriptions,
  setWeeklyConceptPref,
  syncWeeklySchedule,
  timeToHhmm,
} from '../../features/notifications/weeklyConcept';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [local, setLocal] = useState<LocalSettings>(DEFAULT_LOCAL_SETTINGS);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [apeId, setApeId] = useState('');
  // Community mic-catalog contribution consent (device-local, opt-in, default off).
  const [contribute, setContribute] = useState(false);

  // Access / promo code redemption (owner 2026-08-21) — for users who already
  // have an account (e.g. an influencer comped after signing up free).
  const { entitlement, refreshEntitlement } = useEntitlement();
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemBusy, setRedeemBusy] = useState(false);
  const isMember = entitlement === 'academy';

  const submitRedeem = useCallback(async () => {
    const code = redeemCode.trim();
    if (!code || redeemBusy) return;
    setRedeemBusy(true);
    try {
      const res = await redeemAccessCode(code);
      if (res.ok) await refreshEntitlement();
      setRedeemOpen(false);
      setRedeemCode('');
      Alert.alert(res.ok ? 'Code applied' : 'Code not applied', res.message);
    } finally {
      setRedeemBusy(false);
    }
  }, [redeemCode, redeemBusy, refreshEntitlement]);

  useEffect(() => {
    loadLocalSettings().then(setLocal);
    void hasCrowdsourceConsent().then(setContribute);
    fetchNotificationPrefs().then(setPrefs);
    void fetchWeeklySubscriptions().then((subs) => {
      if (!subs.length) return;
      setWeeklyCats(subs.map((s) => s.category));
      setWeeklyDay(dowToDayName(subs[0].day_of_week));
      setWeeklyTime(timeToHhmm(subs[0].send_time));
    });
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

  // Per-notification day (dayTime modes) — device-local.
  const setFreq = useCallback((key: string, value: string) => {
    setLocal((prev) => {
      const next = { ...prev, notifyFreq: { ...prev.notifyFreq, [key]: value } };
      void saveLocalSettings(next);
      return next;
    });
  }, []);
  // Per-notification delivery time ("HH:MM") — device-local (user request 2026-07-23).
  const setTime = useCallback((key: string, value: string) => {
    setLocal((prev) => {
      const next = { ...prev, notifyTime: { ...prev.notifyTime, [key]: value } };
      void saveLocalSettings(next);
      return next;
    });
  }, []);
  // Which notification's schedule popup is open (user request 2026-07-23).
  const [picker, setPicker] = useState<CommercialNotifyKey | null>(null);
  const [weeklyPicker, setWeeklyPicker] = useState(false);
  const [weeklyDay, setWeeklyDay] = useState('Monday');
  const [weeklyTime, setWeeklyTime] = useState('09:00');
  const [weeklyCats, setWeeklyCats] = useState<string[]>(['Acoustics']);

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
      if (key === 'push_enabled' && value) {
        void registerAndSavePushToken();
      }
    },
    [prefs],
  );

  const persistWeeklySubs = useCallback(
    (cats: string[], dayName: string, hhmm: string) => {
      void syncWeeklySchedule({ categories: cats, dayName, hhmm });
    },
    [],
  );

  const setWeeklyOn = useCallback(
    async (on: boolean) => {
      if (!prefs) return;
      setPrefs({ ...prefs, notify_weekly_concept: on, push_enabled: on ? true : prefs.push_enabled });
      if (on) {
        const token = await registerAndSavePushToken();
        const prefOk = await setWeeklyConceptPref(true);
        const cats = weeklyCats.length ? weeklyCats : ['Acoustics'];
        setWeeklyCats(cats);
        await persistWeeklySubs(cats, weeklyDay, weeklyTime);
        if (!prefOk) {
          setPrefs((p) => (p ? { ...p, notify_weekly_concept: false } : p));
          return;
        }
        if (!token) {
          Alert.alert(
            'Notifications',
            'Weekly concepts are saved. Push delivery needs a physical device build with notification permission allowed.',
          );
        }
      } else {
        const prefOk = await setWeeklyConceptPref(false);
        await deactivateAllWeeklySubscriptions();
        if (!prefOk) setPrefs((p) => (p ? { ...p, notify_weekly_concept: true } : p));
      }
    },
    [prefs, persistWeeklySubs, weeklyCats, weeklyDay, weeklyTime],
  );

  const toggleWeeklyCat = useCallback(
    (category: string) => {
      setWeeklyCats((prev) => {
        const has = prev.includes(category);
        const next = has ? prev.filter((c) => c !== category) : [...prev, category];
        const cats = next.length ? next : [category];
        persistWeeklySubs(cats, weeklyDay, weeklyTime);
        return cats;
      });
    },
    [persistWeeklySubs, weeklyDay, weeklyTime],
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
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                {!(prefs?.[row.key] ?? false) ? <Text style={styles.rowHint}>{row.hint}</Text> : null}
              </View>
              <Toggle
                on={prefs?.[row.key] ?? false}
                disabled={!prefs}
                onChange={(v) => setPref(row.key, v)}
              />
            </View>
          ))}
          <View style={[styles.row, styles.rowBorder]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.rowLabel}>Weekly concept</Text>
              {!prefs?.notify_weekly_concept ? (
                <Text style={styles.rowHint}>One misunderstood concept a week, per category you select.</Text>
              ) : null}
            </View>
            {prefs?.notify_weekly_concept ? (
              <Pressable
                style={styles.schedBtn}
                onPress={() => setWeeklyPicker(true)}
                accessibilityRole="button"
                accessibilityLabel={`Edit weekly concept schedule, currently ${shortDay(weeklyDay)} · ${formatClock(weeklyTime)}`}
              >
                <Text style={styles.schedText}>{`${shortDay(weeklyDay)} · ${formatClock(weeklyTime)}`}</Text>
              </Pressable>
            ) : null}
            <Toggle
              on={prefs?.notify_weekly_concept ?? false}
              disabled={!prefs}
              onChange={(v) => void setWeeklyOn(v)}
            />
          </View>
          {prefs?.notify_weekly_concept ? (
            <View style={[styles.rowCol, styles.rowBorder]}>
              <Text style={styles.rowHint}>Categories</Text>
              <View style={styles.chipWrap}>
                {WEEKLY_CONCEPT_CATEGORIES.map((cat) => {
                  const on = weeklyCats.includes(cat);
                  return (
                    <Pressable
                      key={cat}
                      style={[styles.catChip, on && styles.catChipOn]}
                      onPress={() => toggleWeeklyCat(cat)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={[styles.catChipText, on && styles.catChipTextOn]}>{cat}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
          {/* The 7 commercial notifications (user request 2026-07-18). Turning
              one ON reveals its frequency editor; the toggle is the "turn off",
              the editor is the "edit". */}
          {/* Each notification is ONE line: label · (schedule button when ON) ·
              toggle. The schedule button opens a popup that picks a specific time
              (and day, for weekly / new terms) — user request 2026-07-23. */}
          {COMMERCIAL_NOTIFY_ROWS.map((row, i) => {
            const on = local[row.key];
            const freq = NOTIFY_FREQ[row.key];
            const summary =
              freq.mode === 'idleDays'
                ? `${local.continueDays} ${local.continueDays === 1 ? 'day' : 'days'}`
                : freq.mode === 'dayTime'
                  ? `${shortDay(local.notifyFreq[row.key] ?? 'Monday')} · ${formatClock(local.notifyTime[row.key] ?? '09:00')}`
                  : formatClock(local.notifyTime[row.key] ?? '08:00');
            return (
              <View key={row.key} style={[styles.row, i < COMMERCIAL_NOTIFY_ROWS.length - 1 && styles.rowBorder]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  {!on ? <Text style={styles.rowHint}>{row.hint}</Text> : null}
                </View>
                {on ? (
                  <Pressable
                    style={styles.schedBtn}
                    onPress={() => setPicker(row.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${row.label} schedule, currently ${summary}`}
                  >
                    <Text style={styles.schedText}>{summary}</Text>
                  </Pressable>
                ) : null}
                <Toggle on={on} onChange={(v) => setLocalKey(row.key, v)} />
              </View>
            );
          })}
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

        {/* MICROPHONE — live measurement-tool capture behaviour (rev 24). */}
        <View>
          <Text style={styles.sectionEyebrow}>MICROPHONE</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.rowLabel}>Release mic in the background</Text>
              <Text style={styles.rowHint}>
                Stops the microphone the moment you switch away from a measurement tool, and re-starts it when you return. Turn off to keep it ready for an instant resume.
              </Text>
            </View>
            <Toggle on={local.micReleaseOnBackground} onChange={(v) => setLocalKey('micReleaseOnBackground', v)} />
          </View>
        </View>

        {/* COMMUNITY MIC CATALOG — anonymous, opt-in calibration contribution. */}
        <View>
          <Text style={styles.sectionEyebrow}>COMMUNITY MIC CATALOG</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.rowLabel}>Contribute anonymized calibration data</Text>
              <Text style={styles.rowHint}>
                When you calibrate, share your offset and phone model anonymously so other owners of your phone start closer to accurate. Never sends audio, location, or anything that identifies you. Turning this off clears anything queued.
              </Text>
            </View>
            <Toggle
              on={contribute}
              onChange={(v) => {
                setContribute(v);
                void setCrowdsourceConsent(v);
              }}
            />
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

        {/* MEMBERSHIP — redeem an access / promo code (owner 2026-08-21): comp
            accounts, bulk seats, event offers. Available to any signed-in user. */}
        <View>
          <Text style={styles.sectionEyebrow}>MEMBERSHIP</Text>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Status</Text>
            <Text style={[styles.mono, { color: isMember ? colors.green : colors.textSubAlt }]}>
              {isMember ? 'ACADEMY — ACTIVE' : entitlement === 'lapsed' ? 'LAPSED' : 'FREE'}
            </Text>
          </View>
          <Pressable
            style={styles.row}
            onPress={() => {
              setRedeemCode('');
              setRedeemOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Redeem an access or promo code"
          >
            <Text style={styles.rowLabel}>Redeem access or promo code</Text>
            <Text style={[styles.mono, { color: colors.amber }]}>›</Text>
          </Pressable>
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
          {/* About / credits — moved here from the Dashboard logo (owner 2026-08-01). */}
          <Pressable
            style={[styles.row, styles.rowBorder]}
            onPress={() => (navigation as any).navigate('About')}
            accessibilityRole="button"
            accessibilityLabel="About this app"
          >
            <Text style={styles.rowLabel}>About &amp; credits</Text>
            <Text style={[styles.mono, { color: colors.amber }]}>›</Text>
          </Pressable>
          {/* Log out → sign out then bounce to Splash, which re-checks the
              session and routes to the login screen for the next user. */}
          <Pressable style={styles.row} onPress={confirmLogout} accessibilityRole="button" accessibilityLabel="Log out">
            <Text style={styles.rowLabel}>Log out</Text>
            <Text style={[styles.mono, { color: colors.amber }]}>SIGN OUT ›</Text>
          </Pressable>
        </View>

        {/* DEV — only in development builds; not shipped to students. */}
        <View>
          <Text style={styles.sectionEyebrow}>ONBOARDING</Text>
          <Pressable
            style={styles.row}
            onPress={() =>
              // Also replays the amplitude color-language orientation (its key is
              // in the ape:intro:* family; the explicit call resets the LIVE flag
              // so the gate re-arms without a relaunch).
              Promise.all([resetCoachMarks(), resetScreenIntros(), resetAmplitudeOrientation()]).then(() =>
                Alert.alert(
                  'Hints reset',
                  'Onboarding hints and the welcome greeting will show again on next open.',
                ),
              )
            }
          >
            <Text style={styles.rowLabel}>Reset onboarding hints</Text>
            <Text style={[styles.mono, { color: colors.amber }]}>RESET</Text>
          </Pressable>
          <Pressable
            style={styles.row}
            onPress={() =>
              resetAskModes().then(() =>
                Alert.alert(
                  'Permission prompts reset',
                  'The camera, location, and photo explainer popups will ask again next time — including if you had chosen “always allow.” This does not change what you’ve allowed in your device Settings.',
                ),
              )
            }
          >
            <Text style={styles.rowLabel}>Reset permission prompts</Text>
            <Text style={[styles.mono, { color: colors.amber }]}>RESET</Text>
          </Pressable>
        </View>

        {/* DELETE ACCOUNT — permanent, at the very bottom (user request 2026-07-25).
            Hold 5s → final confirm → erase personal data via delete_my_account, then
            sign out and bounce to Splash. */}
        <View>
          <Text style={styles.sectionEyebrow}>DELETE ACCOUNT</Text>
          <DeleteAccountButton onDeleted={() => navigation.reset({ index: 0, routes: [{ name: 'Splash' }] })} />
        </View>
      </ScrollView>

      {/* Redeem access / promo code popup (owner 2026-08-21). */}
      <Modal visible={redeemOpen} transparent animationType="fade" onRequestClose={() => setRedeemOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => !redeemBusy && setRedeemOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>REDEEM A CODE</Text>
            <Text style={styles.modalBody}>
              Enter an access or promo code from an event, sponsor, or the Academy. Membership codes apply
              instantly; discount codes apply at checkout when purchasing is available.
            </Text>
            <TextField
              label="Access or promo code"
              value={redeemCode}
              onChangeText={setRedeemCode}
              placeholder="Enter your code"
              autoCapitalize="characters"
            />
            {redeemBusy ? (
              <View style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.amber} />
              </View>
            ) : (
              <View style={{ gap: 10, marginTop: 6 }}>
                <StudioButton label="Redeem" variant="primary" onPress={submitRedeem} />
                <StudioButton label="Cancel" variant="secondary" onPress={() => setRedeemOpen(false)} />
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Notification schedule popup (user request 2026-07-23). */}
      {weeklyPicker ? (
        <NotifyScheduleModal
          visible
          title="Weekly concept"
          mode="dayTime"
          time={weeklyTime}
          day={weeklyDay}
          days={3}
          onSetTime={(hhmm) => {
            setWeeklyTime(hhmm);
            persistWeeklySubs(weeklyCats, weeklyDay, hhmm);
          }}
          onSetDay={(d) => {
            setWeeklyDay(d);
            persistWeeklySubs(weeklyCats, d, weeklyTime);
          }}
          onSetDays={() => {}}
          onClose={() => setWeeklyPicker(false)}
        />
      ) : null}
      {picker ? (
        <NotifyScheduleModal
          visible
          title={COMMERCIAL_NOTIFY_ROWS.find((r) => r.key === picker)?.label ?? 'Schedule'}
          mode={NOTIFY_FREQ[picker].mode}
          time={local.notifyTime[picker] ?? '08:00'}
          day={local.notifyFreq[picker] ?? 'Monday'}
          days={local.continueDays}
          onSetTime={(hhmm) => setTime(picker, hhmm)}
          onSetDay={(d) => setFreq(picker, d)}
          onSetDays={(n) => setLocalKey('continueDays', n)}
          onClose={() => setPicker(null)}
        />
      ) : null}
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.4, color: colors.textPrimary },
  modalBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textMuted },
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
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catChip: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 7,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#141414',
  },
  catChipOn: { borderColor: 'rgba(255,198,77,.7)', backgroundColor: 'rgba(255,198,77,.12)' },
  catChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.4, color: colors.textSub },
  catChipTextOn: { color: colors.amber },
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

  // One-line schedule button on the right of a notification row (user request
  // 2026-07-23) — opens the time/day popup.
  schedBtn: { borderWidth: 1, borderColor: 'rgba(255,198,77,.55)', backgroundColor: 'rgba(255,198,77,.1)', borderRadius: 7, paddingVertical: 6, paddingHorizontal: 10, marginRight: 10 },
  schedText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.4, color: colors.amber },

  // Per-notification frequency editor (user request 2026-07-18).
  freqBlock: { paddingLeft: 12, paddingBottom: 12, paddingTop: 2, gap: 8 },
  freqLabel: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textMuted },
  freqChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

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
