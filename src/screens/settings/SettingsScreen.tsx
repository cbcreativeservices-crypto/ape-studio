/**
 * S11 — Settings (root-stack modal, bottom nav hidden, ✕ top-right).
 *
 * Every section is a COLLAPSIBLE card (SettingsSection) whose header carries a
 * state summary, so the whole configuration is readable while closed —
 * owner 2026-08-30, replacing one flat scroll of ten un-grouped sections.
 *
 * NOTIFICATIONS · "Phone notifications" is the MASTER switch for everything
 *   this device sends (it mirrors to localSchedule, so the 7 local reminders
 *   really do stop); Email is an independent transport. Weekly concept lists
 *   its 7 categories, each with its OWN day and time.
 * DISPLAY & ACCESSIBILITY · MICROPHONE & PRIVACY · FEEDBACK & SUPPORT ·
 * MEMBERSHIP · ACCOUNT · ONBOARDING HINTS · DELETE ACCOUNT (red, collapsed).
 * Writes are immediate; there is no Save button.
 */
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { confirmDialog, notify } from '../../lib/confirm';
import { Modal } from '../../components/DimModal';
import Constants from 'expo-constants';
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
  COMMERCIAL_NOTIFY_ROWS,
  DEFAULT_LOCAL_SETTINGS,
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
import { setPhoneNotificationsEnabled } from '../../features/notifications/localSchedule';
import {
  WEEKLY_CONCEPT_CATEGORIES,
  deactivateAllWeeklySubscriptions,
  defaultScheduleFor,
  fetchWeeklySubscriptions,
  saveAllCategorySchedules,
  saveCategorySchedule,
  scheduleMapFrom,
  setWeeklyConceptPref,
  shortCategory,
  type CategorySchedule,
} from '../../features/notifications/weeklyConcept';
import { SettingsSection } from '../../features/settings/SettingsSection';
import { osReduceMotionOn } from '../../features/settings/a11y';
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
      notify(res.ok ? 'Code applied' : 'Code not applied', res.message);
    } finally {
      setRedeemBusy(false);
    }
  }, [redeemCode, redeemBusy, refreshEntitlement]);

  useEffect(() => {
    // Load the local settings FIRST, then mirror the server's master switch
    // using those freshly-loaded values — reading `local` here would capture
    // the defaults from this []-dep effect's closure, not what was stored.
    void (async () => {
      const loaded = await loadLocalSettings();
      setLocal(loaded);
      const p = await fetchNotificationPrefs();
      setPrefs(p);
      if (p) void setPhoneNotificationsEnabled(p.push_enabled, loaded);
    })();
    void hasCrowdsourceConsent().then(setContribute);
    void fetchWeeklySubscriptions().then((subs) => setCatSched(scheduleMapFrom(subs)));
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
  // Per-CATEGORY schedule (owner 2026-08-30): each of the 7 weekly-concept
  // categories carries its own day AND time. `weeklyPicker` holds the category
  // whose popup is open, or null.
  const [weeklyPicker, setWeeklyPicker] = useState<string | null>(null);
  const [catSched, setCatSched] = useState<Record<string, CategorySchedule>>(() =>
    Object.fromEntries(WEEKLY_CONCEPT_CATEGORIES.map((c) => [c, defaultScheduleFor(c)])),
  );
  const activeCatCount = WEEKLY_CONCEPT_CATEGORIES.filter((c) => catSched[c]?.active).length;

  const confirmLogout = useCallback(() => {
    // confirmDialog: Alert.alert is a no-op on RN-web — Log out was a dead
    // button on the web preview (QA night 2026-09-01).
    confirmDialog('Log out?', 'You can sign in as a different user afterward.', 'Log out', () => {
      void (async () => {
        await supabase.auth.signOut();
        navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
      })();
    }, { destructive: true });
  }, [navigation]);

  // The whole reminders group is inert while the master switch is off —
  // pointerEvents only blocks pointer input; keyboard/switch access could
  // still toggle "dimmed" switches (QA night 2026-09-01).
  const groupLocked = !(prefs?.push_enabled ?? false);
  const setPref = useCallback(
    (key: keyof NotificationPrefs, value: boolean) => {
      if (!prefs) return;
      setPrefs({ ...prefs, [key]: value }); // optimistic
      updateNotificationPref(key, value).then((ok) => {
        if (!ok) {
          setPrefs((p) => (p ? { ...p, [key]: !value } : p)); // revert
          // Restore the scheduler mirror too (QA night 2026-09-01): committing
          // it before the server write left the UI and the device scheduler
          // disagreeing whenever the write failed.
          if (key === 'push_enabled') void setPhoneNotificationsEnabled(!value, local);
          return;
        }
        if (key === 'push_enabled') {
          // Master switch: mirror it to the device scheduler so the 7 local
          // reminders actually stop when it is off (owner-approved 2026-08-30).
          void setPhoneNotificationsEnabled(value, local);
          if (value) void registerAndSavePushToken();
        }
      });
    },
    [prefs, local],
  );

  /** Change ONE category (its own day, time, or on/off) and persist just it. */
  const setCategory = useCallback((category: string, patch: Partial<CategorySchedule>) => {
    setCatSched((prev) => {
      const next = { ...prev[category], ...patch };
      void saveCategorySchedule(category, next);
      return { ...prev, [category]: next };
    });
  }, []);

  const setWeeklyOn = useCallback(
    async (on: boolean) => {
      if (!prefs) return;
      setPrefs({ ...prefs, notify_weekly_concept: on, push_enabled: on ? true : prefs.push_enabled });
      if (on) {
        // BUG FIX (design review 2026-08-30): turning this on flipped
        // push_enabled in local state ONLY, so the switch appeared on and was
        // off again next time Settings opened. Persist it too.
        if (!prefs.push_enabled) void updateNotificationPref('push_enabled', true);
        const token = await registerAndSavePushToken();
        const prefOk = await setWeeklyConceptPref(true);
        // Make sure every category has a row carrying its own schedule. If the
        // user has never picked any, start ONE on so the switch does something
        // — silently subscribing to all seven would be presumptuous.
        const seeded = { ...catSched };
        if (!WEEKLY_CONCEPT_CATEGORIES.some((c) => seeded[c]?.active)) {
          const first = WEEKLY_CONCEPT_CATEGORIES[0];
          seeded[first] = { ...seeded[first], active: true };
          setCatSched(seeded);
        }
        await saveAllCategorySchedules(seeded);
        if (!prefOk) {
          setPrefs((p) => (p ? { ...p, notify_weekly_concept: false } : p));
          return;
        }
        if (!token) {
          notify(
            'Notifications',
            'Weekly concepts are saved. Push delivery needs a physical device build with notification permission allowed.',
          );
        }
      } else {
        const prefOk = await setWeeklyConceptPref(false);
        await deactivateAllWeeklySubscriptions();
        // Mirror the server: the rows keep their day/time, they just go quiet.
        setCatSched((prev) =>
          Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, active: false }])),
        );
        if (!prefOk) setPrefs((p) => (p ? { ...p, notify_weekly_concept: true } : p));
      }
    },
    [prefs, catSched],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <Text accessibilityRole="header" style={styles.headerTitle}>SETTINGS</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close settings">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}>
        {/* NOTIFICATIONS — transport toggles (server) + the commercial content
            notifications (device-local; server prefs frozen). */}
        {/* Every section starts CLOSED (owner 2026-08-30): six collapsed
            headers fit on one screen, each showing its own state on the right,
            so the whole configuration is readable before anything is opened.
            Auto-opening one section buried the others under its length. */}
        <SettingsSection
          title="NOTIFICATIONS"
          summary={(() => {
            const n =
              (prefs?.push_enabled ? 1 : 0) +
              (prefs?.email_enabled ? 1 : 0) +
              (prefs?.notify_weekly_concept ? 1 : 0) +
              COMMERCIAL_NOTIFY_ROWS.filter((r) => local[r.key]).length;
            return n ? `${n} on` : 'all off';
          })()}
        >
          <Text style={styles.groupLabel}>HOW THEY REACH YOU</Text>
          {NOTIFICATION_ROWS.map((row) => (
            <View key={row.key} style={[styles.row, styles.rowBorder]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                {/* ALWAYS shown. Hiding the hint when a toggle went on changed
                    the row height mid-tap (every row below shifted under the
                    user's finger) and removed the explanation at exactly the
                    moment someone auditing "why am I getting this?" needs it. */}
                <Text style={styles.rowHint}>{row.hint}</Text>
              </View>
              <Toggle
                on={prefs?.[row.key] ?? false}
                disabled={!prefs}
                label={row.label}
                onChange={(v) => setPref(row.key, v)}
              />
            </View>
          ))}
          {!(prefs?.push_enabled ?? false) ? (
            <Text style={styles.dependencyNote}>
              Turn on phone notifications to use anything below.
            </Text>
          ) : null}

          <View style={!(prefs?.push_enabled ?? false) ? styles.groupOff : undefined} pointerEvents={(prefs?.push_enabled ?? false) ? 'auto' : 'none'}>
          <Text style={styles.groupLabel}>WHAT YOU GET</Text>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.rowLabel}>Weekly concept</Text>
              <Text style={styles.rowHint}>
                {prefs?.notify_weekly_concept
                  ? `${activeCatCount} of ${WEEKLY_CONCEPT_CATEGORIES.length} categories · each on its own day and time`
                  : 'One misunderstood concept a week, from the categories you choose.'}
              </Text>
            </View>
            <Toggle
              on={prefs?.notify_weekly_concept ?? false}
              disabled={!prefs || groupLocked}
              label="Weekly concept"
              onChange={(v) => void setWeeklyOn(v)}
            />
          </View>
          {/* PER-CATEGORY schedules (owner 2026-08-30): every category carries
              its OWN day and time, so one row each — name, its schedule pill,
              and its own switch. Defaults are staggered across the week. */}
          {prefs?.notify_weekly_concept
            ? WEEKLY_CONCEPT_CATEGORIES.map((cat, i) => {
                const s = catSched[cat] ?? defaultScheduleFor(cat);
                return (
                  <View
                    key={cat}
                    style={[
                      styles.row,
                      styles.catRow,
                      i < WEEKLY_CONCEPT_CATEGORIES.length - 1 && styles.rowBorder,
                    ]}
                  >
                    <Text style={[styles.catName, !s.active && styles.catNameOff]} numberOfLines={1}>
                      {shortCategory(cat)}
                    </Text>
                    {/* Pill is ALWAYS rendered, dimmed when the category is
                        off: setting a day before subscribing is harmless, and
                        it avoids a 7-row reflow every time a switch is tapped. */}
                    <Pressable
                      style={[styles.schedBtn, !s.active && styles.schedBtnOff]}
                      onPress={() => setWeeklyPicker(cat)}
                      hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${cat} schedule, currently ${shortDay(s.dayName)} at ${formatClock(s.hhmm)}`}
                    >
                      <Text style={styles.schedText}>{`${shortDay(s.dayName)} · ${formatClock(s.hhmm)}`}</Text>
                      <Text style={styles.schedCaret}>›</Text>
                    </Pressable>
                    <Toggle
                      on={s.active}
                      disabled={groupLocked}
                      label={`Weekly concept: ${cat}`}
                      onChange={(v) => setCategory(cat, { active: v })}
                    />
                  </View>
                );
              })
            : null}
          {/* The 7 commercial notifications (user request 2026-07-18). Turning
              one ON reveals its frequency editor; the toggle is the "turn off",
              the editor is the "edit". */}
          {/* Each notification is ONE line: label · (schedule button when ON) ·
              toggle. The schedule button opens a popup that picks a specific time
              (and day, for weekly / new terms) — user request 2026-07-23. */}
          <Text style={styles.groupLabel}>REMINDERS</Text>
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
                  <Text style={styles.rowHint}>{row.hint}</Text>
                </View>
                {on ? (
                  <Pressable
                    style={styles.schedBtn}
                    onPress={() => setPicker(row.key)}
                    hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${row.label} schedule, currently ${summary}`}
                  >
                    <Text style={styles.schedText}>{summary}</Text>
                    <Text style={styles.schedCaret}>›</Text>
                  </Pressable>
                ) : null}
                <Toggle on={on} disabled={groupLocked} label={row.label} onChange={(v) => setLocalKey(row.key, v)} />
              </View>
            );
          })}
          </View>
        </SettingsSection>

        {/* DISPLAY + ACCESSIBILITY are one concern to a user ("how it looks and
            reads"), so they live in one section rather than two one-row stubs. */}
        <SettingsSection
          title="DISPLAY & ACCESSIBILITY"
          summary={local.reduceAnimations || osReduceMotionOn() ? 'reduced motion' : undefined}
        >
          {/* DARK MODE ROW REMOVED (owner 2026-08-31: "I don't want the other
              mode — so no confusion"). It was a permanently `disabled` switch
              wired to a field nothing read: there is no light palette, and
              app.json pins userInterfaceStyle to dark. A control that invites a
              tap and cannot move teaches people the settings cannot be trusted
              — the same reason the text-size and contrast chips went on
              2026-08-30. */}

          {/* TEXT SIZE, CONTRAST AND COLOUR NOW DEFER TO THE PHONE (owner
              2026-08-30). The in-app font-size chips were competing with
              something that already worked: React Native scales every Text in
              this app with the OS accessibility font setting by default
              (allowFontScaling is nowhere disabled), so the chips changed
              nothing and duplicated a system control. High contrast and
              colour filters are likewise system-wide on both platforms — and
              the amplitude colour ramp CANNOT be re-visualised for colour
              blindness (owner ruling: the ramp carries meaning and is fixed),
              so an in-app colour-blind remap would have been a promise we
              cannot keep. One honest row replaces all three. */}
          <View style={[styles.rowCol, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Text size, contrast &amp; colour</Text>
            <Text style={styles.rowHint}>
              These follow your phone&apos;s own accessibility settings and already apply
              throughout this app — text here grows with your system text size.
            </Text>
            <Text style={[styles.rowHint, { marginTop: 6 }]}>
              {Platform.OS === 'ios'
                ? 'Settings › Accessibility › Display & Text Size'
                : 'Settings › Accessibility › Display size and text'}
            </Text>
          </View>

          <View style={[styles.row, styles.rowBorder]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.rowLabel}>Reduce animations</Text>
              <Text style={styles.rowHint}>
                {osReduceMotionOn()
                  ? 'Your phone already has reduced motion switched on, so animations are off here regardless.'
                  : 'Turns off motion in the labs and menus.'}
              </Text>
            </View>
            <Toggle
              on={local.reduceAnimations || osReduceMotionOn()}
              disabled={osReduceMotionOn()}
              label="Reduce animations"
              onChange={(v) => setLocalKey('reduceAnimations', v)}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Haptic feedback</Text>
            <Toggle on={local.haptics} label="Haptic feedback" onChange={(v) => setLocalKey('haptics', v)} />
          </View>
        </SettingsSection>

        {/* Both rows answer "what does the app do with my microphone?", so they
            belong together — they were two separate one-row sections before. */}
        <SettingsSection title="MICROPHONE & PRIVACY">
          <View style={[styles.row, styles.rowBorder]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.rowLabel}>Release mic in the background</Text>
              <Text style={styles.rowHint}>
                Stops the microphone the moment you switch away from a measurement tool, and re-starts it when you return. Turn off to keep it ready for an instant resume.
              </Text>
            </View>
            <Toggle
              on={local.micReleaseOnBackground}
              label="Release mic in the background"
              onChange={(v) => setLocalKey('micReleaseOnBackground', v)}
            />
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.rowLabel}>Contribute anonymized calibration data</Text>
              <Text style={styles.rowHint}>
                When you calibrate, share your offset and phone model anonymously so other owners of your phone start closer to accurate. Never sends audio, location, or anything that identifies you. Turning this off clears anything queued.
              </Text>
            </View>
            <Toggle
              on={contribute}
              label="Contribute anonymized calibration data"
              onChange={(v) => {
                setContribute(v);
                void setCrowdsourceConsent(v);
              }}
            />
          </View>
        </SettingsSection>

        {/* FEEDBACK & SUPPORT — opens the mail composer, pre-filled. */}
        <SettingsSection title="FEEDBACK & SUPPORT">
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
              style={({ pressed }) => [styles.row, i < arr.length - 1 && styles.rowBorder, pressed && styles.rowPressed]}
              onPress={() => sendFeedback(kind)}
              accessibilityRole="button"
            >
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
          <Text style={styles.thanks}>Thank you for your support!</Text>
        </SettingsSection>

        {/* MEMBERSHIP — redeem an access / promo code (owner 2026-08-21): comp
            accounts, bulk seats, event offers. Available to any signed-in user. */}
        <SettingsSection
          title="MEMBERSHIP"
          summary={isMember ? 'ACADEMY' : entitlement === 'lapsed' ? 'LAPSED' : 'FREE'}
        >
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
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </SettingsSection>

        {/* ACCOUNT */}
        <SettingsSection title="ACCOUNT" summary={apeId || undefined}>
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
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          {/* Log out → sign out then bounce to Splash, which re-checks the
              session and routes to the login screen for the next user. */}
          <Pressable style={styles.row} onPress={confirmLogout} accessibilityRole="button" accessibilityLabel="Log out">
            <Text style={styles.rowLabel}>Log out</Text>
            <Text style={styles.monoAction}>SIGN OUT ›</Text>
          </Pressable>
        </SettingsSection>

        {/* Shipped to students on purpose: replaying the hints is a legitimate
            recovery action. (An older comment claimed this block was dev-only —
            it never had a __DEV__ guard, so the comment was simply wrong.) */}
        <SettingsSection title="ONBOARDING HINTS">
          <Pressable accessibilityRole="button"
            style={[styles.row, styles.rowBorder]}
            onPress={() =>
              // Also replays the amplitude color-language orientation (its key is
              // in the ape:intro:* family; the explicit call resets the LIVE flag
              // so the gate re-arms without a relaunch).
              Promise.all([resetCoachMarks(), resetScreenIntros(), resetAmplitudeOrientation()]).then(() =>
                notify(
                  'Hints reset',
                  'Onboarding hints and the welcome greeting will show again on next open.',
                ),
              )
            }
          >
            <Text style={styles.rowLabel}>Replay onboarding hints</Text>
            <Text style={styles.monoAction}>RESET</Text>
          </Pressable>
          <Pressable accessibilityRole="button"
            style={styles.row}
            onPress={() =>
              resetAskModes().then(() =>
                notify(
                  'Permission prompts reset',
                  'The camera, location, and photo explainer popups will ask again next time — including if you had chosen “always allow.” This does not change what you’ve allowed in your device Settings.',
                ),
              )
            }
          >
            <Text style={styles.rowLabel}>Ask about permissions again</Text>
            <Text style={styles.monoAction}>RESET</Text>
          </Pressable>
        </SettingsSection>

        {/* DELETE ACCOUNT — permanent, at the very bottom (user request 2026-07-25).
            Hold 5s → final confirm → erase personal data via delete_my_account, then
            sign out and bounce to Splash. Collapsed AND red-keyed: it should take a
            deliberate tap to even see the control. */}
        <SettingsSection title="DELETE ACCOUNT" danger>
          <View style={{ paddingVertical: 10 }}>
            <Text style={[styles.rowHint, { marginBottom: 10 }]}>
              Permanently erases your personal data and signs you out. This cannot be undone.
            </Text>
            <DeleteAccountButton onDeleted={() => navigation.reset({ index: 0, routes: [{ name: 'Splash' }] })} />
          </View>
        </SettingsSection>
      </ScrollView>

      {/* Redeem access / promo code popup (owner 2026-08-21). */}
      <Modal accessibilityViewIsModal visible={redeemOpen} transparent animationType="fade" onRequestClose={() => setRedeemOpen(false)}>
        {/* Scrim is NOT an accessible button (QA night 2026-09-01): as one it
            wrapped the card's real buttons — invalid nesting + SR trap. */}
        <Pressable accessible={false} style={styles.modalBackdrop} onPress={() => !redeemBusy && setRedeemOpen(false)}>
          <Pressable accessible={false} style={styles.modalCard} onPress={() => {}}>
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
      {/* One category at a time — the popup title names which one, so it is
          never ambiguous whose day/time you are editing. */}
      {weeklyPicker ? (
        <NotifyScheduleModal
          visible
          title={weeklyPicker}
          mode="dayTime"
          time={(catSched[weeklyPicker] ?? defaultScheduleFor(weeklyPicker)).hhmm}
          day={(catSched[weeklyPicker] ?? defaultScheduleFor(weeklyPicker)).dayName}
          days={3}
          onSetTime={(hhmm) => setCategory(weeklyPicker, { hhmm })}
          onSetDay={(dayName) => setCategory(weeklyPicker, { dayName })}
          onSetDays={() => {}}
          onClose={() => setWeeklyPicker(null)}
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
  // Sections are cards now, so the gap between them is tighter than the old
  // flat list needed (20 -> 10): the border does the separating.
  scroll: { padding: 14, gap: 10 },

  sectionEyebrow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 2.2,
    color: colors.amberLabel,
    marginBottom: 8,
  },
  /** Sub-heading INSIDE a section — splits NOTIFICATIONS into "how they reach
   *  you" (transport) vs "what you get" (content) vs reminders. */
  groupLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.textSubAlt,
    marginTop: 12,
    marginBottom: 2,
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
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#1f1f24' },
  // Medium, not Regular: label and hint sit only 2.5 px apart in size, so
  // without a weight difference they read as one grey block.
  rowLabel: { fontFamily: fonts.barlowSemiBold, fontSize: 15, color: colors.textSecondary },
  rowHint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textMuted, marginTop: 3 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  // Per-category rows are INDENTED under "Weekly concept" so they read as its
  // children rather than as seven more top-level notifications.
  catRow: { paddingLeft: 12, paddingVertical: 9, gap: 8 },
  catName: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 13.5, color: colors.textSecondary },
  catNameOff: { color: colors.textMuted },
  thanks: { fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 13, color: colors.amber, marginTop: 10, paddingVertical: 4 },
  // Amber means INTERACTIVE or ON — nothing else (design review 2026-08-30).
  // `mono` used to default to amber, so inert data (student id, version) had to
  // override it inline and everything looked equally tappable.
  mono: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt },
  monoAction: { fontFamily: fonts.mono, fontSize: 12, color: colors.amber },
  chevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.textSubAlt },

  // flexWrap was missing: the five colour-blind chips measure ~343 px against a
  // 328 px inner width at 360, so they overflowed off-screen (design review
  // 2026-08-30). Wrapping + a row gap is the correct outcome, not a squeeze.
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, rowGap: 8 },
  /** Sample line rendered AT the chosen size — the only way to judge the
   *  choice without leaving the screen. */


  // One-line schedule button on the right of a notification row (user request
  // 2026-07-23) — opens the time/day popup. An amber-outlined capsule around a
  // value reads as a READOUT, so it gains a trailing caret and a real height:
  // it was ~29 px with no hitSlop (design review 2026-08-30).
  schedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.55)',
    backgroundColor: 'rgba(255,198,77,.1)',
    borderRadius: 7,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  // mono, not Oswald: it is a data readout, and Oswald's condensed digits make
  // a time read cramped.
  schedText: { fontFamily: fonts.mono, fontSize: 12, color: colors.amber },
  schedCaret: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.amber, opacity: 0.75, marginLeft: 6 },
  schedBtnOff: { opacity: 0.42 },
  /** Pressed feedback — not one row on this screen had any. */
  rowPressed: { backgroundColor: 'rgba(255,198,77,0.06)' },
  /** Everything below the master switch is inert while it is off — dimmed and
   *  non-interactive rather than silently ignored. */
  groupOff: { opacity: 0.4 },
  dependencyNote: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.amberLabel,
    marginTop: 10,
  },

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
