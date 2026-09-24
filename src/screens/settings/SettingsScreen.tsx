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
import { BACK_HIT_SLOP } from '../../components/backHitSlop';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { confirmDialog, notify } from '../../lib/confirm';
import { Modal } from '../../components/DimModal';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Toggle } from '../../components/Toggle';
import { autoOfflineEnabled, setAutoOffline } from '../../features/glossary/autoOfflinePref';
import { cancelGlossaryPrefetch, prefetchGlossary } from '../../features/glossary/offlinePrefetch';
import { TextField } from '../../components/TextField';
import { StudioButton } from '../../components/StudioButton';
import { resetCoachMarks } from '../../lib/coachMark';
import { HELP_HUB_ENABLED } from '../../features/help/helpContent';
import { resetScreenIntros } from '../../features/intro/screenIntros';
import { resetOnboarding } from '../../features/intro/onboardingFlow';
import { resetAmplitudeOrientation } from '../../features/lab/amplitudeOrientation';
import { resetAskModes } from '../../features/permissions/permissionStore';
import { hasCrowdsourceConsent, setCrowdsourceConsent } from '../../features/tools/measure/deviceProfile';
import { sendFeedback } from '../../lib/feedback';
import { redeemAccessCode } from '../../features/commercial/accessCode';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { supabase } from '../../lib/supabase';
import { markIntentionalSignOut } from '../../features/auth/intentionalSignOut';
import { replayQueue } from '../../features/study/sync';
import { replayQuizSubmissions } from '../../features/quiz/api';
import { flushScenarioQueue, pendingScenarioCount } from '../../features/study/scenarioHomework';
import { getQueuedBatches } from '../../features/study/studyQueueStorage';
import { getQueuedSubmissions } from '../../features/quiz/submissionQueueStorage';
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
  // The glossary's background save. Read once; the switch writes through.
  const [autoOffline, setAutoOfflineState] = useState(true);
  useEffect(() => {
    let alive = true;
    void autoOfflineEnabled().then((v) => { if (alive) setAutoOfflineState(v); });
    return () => { alive = false; };
  }, []);
  // M12 (2026-09-07): a transient prefs-fetch failure must NOT read as "guest".
  // fetchNotificationPrefs() resolves null on BOTH a guest and a failure, so the
  // error branch below keys off `prefs == null && resolved && !isGuest` — that is
  // the whole discriminator. (A separate `prefsFailed` flag was declared here and
  // never read; removed 2026-09-11 so it doesn't read as a half-applied fix.)
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [apeId, setApeId] = useState('');
  // Community mic-catalog contribution consent (device-local, opt-in, default off).
  const [contribute, setContribute] = useState(false);

  // Access / promo code redemption (owner 2026-08-21) — for users who already
  // have an account (e.g. an influencer comped after signing up free).
  // `tierKnown`, NOT `resolved`, for anything that ASSERTS an identity
  // (2026-09-17). `resolved` flips after the first ATTEMPT even when it failed,
  // so offline this screen told a paying member "GUEST — NO ACCOUNT", offered
  // the members-only upsell, replaced Log out with "Sign in / create account"
  // and hid DELETE ACCOUNT entirely — the one control a store reviewer looks
  // for. `resolved` still governs the first-paint neutral beat.
  const { entitlement, refreshEntitlement, resolved, tierKnown } = useEntitlement();
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemBusy, setRedeemBusy] = useState(false);
  /** Is the soft keyboard up? Drives the backdrop's two-stage dismiss above. */
  const [keyboardUp, setKeyboardUp] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardUp(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardUp(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const isMember = entitlement === 'academy';
  // A no-account GUEST is not a "free account" (QA night 2026-09-01): Settings
  // showed them FREE status, an empty Student ID, a Log out row and a DELETE
  // ACCOUNT section for an account that does not exist.
  const isGuest = entitlement === 'anonymous';

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

  // M12 (2026-09-07): prefs load, retryable and error-aware.
  const reloadPrefs = useCallback(async () => {
    try {
      const loaded = await loadLocalSettings();
      setLocal(loaded);
      const p = await fetchNotificationPrefs();
      setPrefs(p);
      if (p) void setPhoneNotificationsEnabled(p.push_enabled, loaded);
    } catch {
      // A throw leaves `prefs` null, which IS the error state the render reads
      // (error + Retry for a signed-in member; guest copy only for a real guest).
      setPrefs(null);
    }
  }, []);
  useEffect(() => {
    void reloadPrefs();
    // [50] (2026-09-07): guard these against unhandled rejection (offline / RLS).
    void hasCrowdsourceConsent().then(setContribute, () => {});
    void fetchWeeklySubscriptions()
      .then((subs) => setCatSched(scheduleMapFrom(subs)))
      .catch(() => {});
    // ape_student_id via the my_identity() RPC (schema isolation, 2026-09-04)
    // rather than a direct users read.
    supabase
      .rpc('my_identity')
      .single()
      .then(
        ({ data }) => setApeId((data as { ape_student_id?: string | null } | null)?.ape_student_id ?? ''),
        () => {},
      );
  }, [reloadPrefs]);

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
    // SAY WHAT LOGGING OUT ACTUALLY DOES (2026-09-17, bug-hunt pass 3).
    //
    // The old copy — "You can sign in as a different user afterward." — named
    // the one consequence that is NOT destructive and omitted every one that is.
    // Signing out runs the full `ape:*` wipe plus a DELETE over the measurements
    // table, and it runs even when you sign back into the SAME account. That
    // takes: up to 200 saved measurements (device-local by design, never
    // server-backed), all four personal term lists, every preference on this
    // screen, and the user's own dosimeter calibration.
    //
    // Study progress and credentials are on the server and do come back. The
    // rest does not, and someone who has calibrated a meter against a real SPL
    // reference would never guess that Log out throws it away.
    void (async () => {
      /**
       * ⛔ SEND WHAT IS STILL QUEUED **BEFORE** SIGNING OUT. This is the last
       * moment it can be sent at all.
       *
       * The offline study / quiz / scenario queues carry no user id, so
       * `clearLocalAccountData` drops them wholesale on an identity change —
       * correct, because replaying them after a switch would credit the
       * DEPARTING user's work to the NEXT account. But the wipe runs on the
       * SIGNED_OUT event, by which point there is no session left to send
       * them with, so "drop them" had quietly become "lose them". A learner
       * who studied on a train and then logged out lost the lot, while this
       * very dialog told them their progress was safe.
       *
       * Flushing here needs no schema change and no per-user queue: online,
       * which is the ordinary case, the work simply lands.
       */
      await Promise.allSettled([replayQueue(), replayQuizSubmissions(), flushScenarioQueue()]);
      const stranded =
        getQueuedBatches().length + getQueuedSubmissions().length + (await pendingScenarioCount().catch(() => 0));

      const LOCAL_LOSS =
        'This device will lose anything kept only on it — saved measurements, your term lists, your settings, and your microphone calibration. Signing back into the same account does not bring them back.';

      confirmDialog(
        'Log out?',
        stranded > 0
          ? // Do not claim the progress is safe when we just tried to save it
            // and could not. Naming the count is what makes "wait and
            // reconnect" an obvious alternative to losing the work.
            `${stranded} piece${stranded === 1 ? '' : 's'} of study progress could not be saved to your account — most likely you are offline. Logging out now DISCARDS ${stranded === 1 ? 'it' : 'them'}. Reconnect and reopen the app to save ${stranded === 1 ? 'it' : 'them'} first.

${LOCAL_LOSS}`
          : `Your progress and credentials are safe on your account. But ${LOCAL_LOSS.charAt(0).toLowerCase()}${LOCAL_LOSS.slice(1)}`,
        'Log out',
        () => {
          void (async () => {
            markIntentionalSignOut();
            await supabase.auth.signOut();
            navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
          })();
        },
        { destructive: true },
      );
    })();
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

  /**
   * The master Weekly-concept switch. TWO SEPARATE WRITES, TO TWO TABLES.
   *
   * ── WHY THE ORDER AND THE CHECKS MATTER (fixed 2026-09-18) ────────────────
   *
   * A weekly concept is sent only when BOTH halves are true:
   *
   *   notification_preferences.notify_weekly_concept = true   (keyed on app id)
   *   an ACTIVE notification_concept_subscriptions row         (keyed on auth id)
   *
   * They live in different tables, are written by different calls, and either
   * can fail on its own. Of the two possible mismatches, only one is harmful:
   *
   *   rows but no pref  →  nothing sends, switch reads OFF.  Consistent.
   *   PREF BUT NO ROWS  →  nothing sends, switch reads ON.   A LIE.
   *
   * That second state is permanent and completely silent:
   * `get_due_concept_subscriptions` reads only the subscriptions table, so a
   * user with no rows never appears in it, ever. Settings says it is on, no
   * error is raised, and they never receive anything.
   *
   * It was reachable because the old code wrote the pref FIRST and then threw
   * away `saveAllCategorySchedules`'s return value — so a failed row write was
   * invisible and the pref stayed true. One live account was found in exactly
   * that state (0 rows, pref true) during the 2026-09-18 trace.
   *
   * So: write the ROWS first and the PREF last, because the pref is the half
   * the switch renders. If the rows fail we never claim to be on; if the pref
   * fails we put the rows back. The switch can no longer promise something
   * nothing is behind.
   */
  const setWeeklyOn = useCallback(
    async (on: boolean) => {
      if (!prefs) return;
      setPrefs({ ...prefs, notify_weekly_concept: on, push_enabled: on ? true : prefs.push_enabled });
      if (on) {
        // [49] (2026-09-07): the old `if (!prefs.push_enabled) …persist push on`
        // branch was unreachable — the Weekly toggle is disabled whenever push is
        // off (groupLocked), so setWeeklyOn never runs with push_enabled false.
        // Removed. (If push is ever allowed off here, re-add the persist.)
        const token = await registerAndSavePushToken();

        // Make sure every category has a row carrying its own schedule. If the
        // user has never picked any, start ONE on so the switch does something
        // — silently subscribing to all seven would be presumptuous.
        const seeded = { ...catSched };
        if (!WEEKLY_CONCEPT_CATEGORIES.some((c) => seeded[c]?.active)) {
          const first = WEEKLY_CONCEPT_CATEGORIES[0];
          seeded[first] = { ...seeded[first], active: true };
          setCatSched(seeded);
        }

        // ROWS FIRST. Its result is checked now — discarding it is the bug.
        const rowsOk = await saveAllCategorySchedules(seeded);
        if (!rowsOk) {
          setPrefs((p) => (p ? { ...p, notify_weekly_concept: false } : p));
          notify(
            'Notifications',
            'Your weekly concept schedule could not be saved, so the switch has been left off. Nothing was changed on your account — try again in a moment.',
          );
          return;
        }

        // PREF LAST — the half the switch renders.
        const prefOk = await setWeeklyConceptPref(true);
        if (!prefOk) {
          setPrefs((p) => (p ? { ...p, notify_weekly_concept: false } : p));
          // Put the rows back, so we do not leave subscriptions armed behind a
          // switch that reads off.
          await deactivateAllWeeklySubscriptions();
          setCatSched((prev) =>
            Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, active: false }])),
          );
          notify(
            'Notifications',
            'Weekly concepts could not be switched on. Your other reminder settings are unchanged — try again in a moment.',
          );
          return;
        }

        if (!token) {
          notify(
            'Notifications',
            'Weekly concepts are saved. To receive them you need to allow notifications for this app on a phone — they cannot be delivered to this preview.',
          );
        }
      } else {
        // PREF FIRST going off: it alone stops every send, so the switch tells
        // the truth from that moment on even if the row write then fails.
        const prefOk = await setWeeklyConceptPref(false);
        if (!prefOk) {
          setPrefs((p) => (p ? { ...p, notify_weekly_concept: true } : p));
          notify(
            'Notifications',
            'Weekly concepts could not be switched off. No reminders were sent in the meantime — try again in a moment.',
          );
          return;
        }
        const rowsOk = await deactivateAllWeeklySubscriptions();
        // Mirror the server: the rows keep their day/time, they just go quiet.
        // Only claim that locally if the server agreed — otherwise leave the
        // UI alone and let the next fetch reconcile it.
        if (rowsOk) {
          setCatSched((prev) =>
            Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, active: false }])),
          );
        }
      }
    },
    [prefs, catSched],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <Text accessibilityRole="header" style={styles.headerTitle}>SETTINGS</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={BACK_HIT_SLOP} accessibilityRole="button" accessibilityLabel="Close settings">
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
            // FIRST-PAINT GUARD (entitlement audit 2026-09-11). MEMBERSHIP below
            // already shows '…' until `resolved`; this header did not, so the same
            // screen simultaneously said "ACADEMY — ACTIVE" and "members" (i.e.
            // you are not one). Neither claim is knowable before the read lands.
            if (!resolved) return '…';
            if (!isMember) return 'members';
            // Count NOTIFICATION STREAMS only (owner 2026-09-01): the master
            // "Phone notifications" and Email switches are TRANSPORTS — with
            // only the master on, the header used to claim "1 on" while every
            // actual notification was off.
            const n =
              (prefs?.notify_weekly_concept ? 1 : 0) +
              COMMERCIAL_NOTIFY_ROWS.filter((r) => local[r.key]).length;
            return n ? `${n} on` : 'all off';
          })()}
        >
          {!resolved ? (
            /* Pre-resolve: assert NEITHER direction. Showing the 🔒 upsell would
               sell a member their own membership; showing the live switches would
               flash member UI at a guest. A neutral line costs one beat and lies
               to nobody (entitlement audit 2026-09-11). */
            <View style={{ paddingVertical: 10 }}>
              <Text style={styles.rowHint}>Checking your membership…</Text>
            </View>
          ) : !isMember ? (
            /* Notifications are MEMBERS ONLY (owner 2026-09-01). Non-members
               (and guests, and lapsed) see the honest note + the way in — not
               a wall of dead switches. The scheduler enforces the same rule
               independently (localSchedule memberStanding gate), so nothing
               fires either way. NEW COPY — owner review. */
            <View style={{ paddingVertical: 10 }}>
              <Text style={styles.rowHint}>
                🔒 Notifications — daily terms, study reminders, weekly recaps — are an Academy member
                feature.
              </Text>
              <Pressable
                style={[styles.row, { marginTop: 6 }]}
                onPress={() => (navigation as any).navigate('Paywall')}
                accessibilityRole="button"
                accessibilityLabel="See membership"
              >
                <Text style={styles.rowLabel}>See membership</Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </View>
          ) : (
          <>
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
            prefs == null && resolved && !isGuest ? (
              // M12 (2026-09-07): a signed-in member whose prefs failed to load —
              // error + Retry, NOT the guest wording, and toggles aren't "your"
              // settings gone.
              <View style={styles.prefsErrorRow}>
                <Text style={styles.dependencyNote}>
                  Couldn’t load your notification settings — check your connection.
                </Text>
                <Pressable
                  onPress={() => void reloadPrefs()}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading notification settings"
                >
                  <Text style={styles.prefsRetry}>RETRY</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.dependencyNote}>
                {prefs == null
                  ? 'Sign in to manage notifications — a guest session keeps nothing.'
                  : 'Turn on phone notifications to use anything below.'}
              </Text>
            )
          ) : null}

          <View style={!(prefs?.push_enabled ?? false) ? styles.groupOff : undefined} pointerEvents={(prefs?.push_enabled ?? false) ? 'auto' : 'none'}>
          <Text style={styles.groupLabel}>WHAT YOU GET</Text>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.rowLabel}>Weekly concept</Text>
              <Text style={styles.rowHint}>
                {prefs?.notify_weekly_concept
                  ? `${activeCatCount} of ${WEEKLY_CONCEPT_CATEGORIES.length} categories · each on its own day and time`
                  : 'One misunderstood concept a week from each category you choose — each on its own day and time.'}
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
          </>
          )}
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
        <SettingsSection title="GLOSSARY">
          {/* The off switch for the background save (owner 2026-09-22). It is
              automatic for members because 5.4 MB is one photo — but the
              download cannot yet tell wi-fi from cellular (expo-network is a
              native dependency, queued for the next build), so somebody on a
              metered or satellite connection needs a way to say no. Shown to
              everyone: a non-member seeing it is how they learn the app can do
              this at all. */}
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.rowLabel}>Keep the glossary on this phone</Text>
              <Text style={styles.rowHint}>
                Academy members: saves all 31,858 terms in the background (about 5 MB) so the
                glossary works with no signal — on a ship, a flight, or a tour with no wi-fi. Turn
                off to save only the terms you actually read.
              </Text>
            </View>
            <Toggle
              on={autoOffline}
              label="Keep the glossary on this phone"
              onChange={(v) => {
                setAutoOfflineState(v);
                void setAutoOffline(v);
                if (!v) cancelGlossaryPrefetch();
                else void prefetchGlossary();
              }}
            />
          </View>
        </SettingsSection>

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
          {/* Help hub (Pillar C) — gated until the owner ratifies the FAQ copy. */}
          {HELP_HUB_ENABLED ? (
            <Pressable
              style={({ pressed }) => [styles.row, styles.rowBorder, pressed && styles.rowPressed]}
              onPress={() => (navigation as any).navigate('Help')}
              accessibilityRole="button"
              accessibilityLabel="Help and answers"
            >
              <Text style={styles.rowLabel}>Help &amp; answers</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ) : null}
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
              // Every feedback submission carries locating data (owner rule
              // 2026-08-13): screen, tier, student id (Bug+Hater night C1-04).
              onPress={() => sendFeedback(kind, undefined, { screen: 'Settings', tier: entitlement, studentId: apeId || undefined })}
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
        {/* M6 (2026-09-07): keep the first paint NEUTRAL until the server
            entitlement read resolves — otherwise a signed-in member briefly saw
            "GUEST — NO ACCOUNT" on every launch. */}
        <SettingsSection
          title="MEMBERSHIP"
          summary={!tierKnown ? '…' : isMember ? 'ACADEMY' : entitlement === 'lapsed' ? 'LAPSED' : isGuest ? 'GUEST' : 'FREE'}
        >
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Status</Text>
            <Text style={[styles.mono, { color: isMember ? colors.green : colors.textSubAlt }]}>
              {!tierKnown
                ? 'CHECKING…'
                : isMember
                  ? 'ACADEMY — ACTIVE'
                  : entitlement === 'lapsed'
                    ? 'LAPSED'
                    : isGuest
                      ? 'GUEST — NO ACCOUNT'
                      : 'FREE'}
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
          {!isGuest ? (
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Student ID</Text>
              <Text style={styles.mono}>{apeId}</Text>
            </View>
          ) : null}
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
          {/* `resolved &&` — pre-resolve `isGuest` is true for EVERYONE (the
              provider boots at 'anonymous'), so a signed-in member opening this
              section early was offered "Sign in / create account": told they have
              no account, seconds after the header said ACADEMY. The member view
              is the safe neutral — for an actual guest the log-out path is a
              no-op signOut followed by the same bounce to Splash that the sign-in
              row performs (entitlement audit 2026-09-11). */}
          {/* `tierKnown`, not `resolved` (2026-09-17): `resolved` flips after the
              first ATTEMPT even when it FAILED, so an offline member was shown
              "Sign in / create account" and lost the Log out row. The member
              view is the safe neutral either way — for an actual guest, Log out
              is a no-op signOut followed by the same bounce to Splash that the
              sign-in row performs. */}
          {tierKnown && isGuest ? (
            <Pressable
              style={styles.row}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Splash' }] })}
              accessibilityRole="button"
              accessibilityLabel="Sign in or create an account"
            >
              <Text style={styles.rowLabel}>Sign in / create account</Text>
              <Text style={styles.monoAction}>SIGN IN ›</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.row} onPress={confirmLogout} accessibilityRole="button" accessibilityLabel="Log out">
              <Text style={styles.rowLabel}>Log out</Text>
              <Text style={styles.monoAction}>SIGN OUT ›</Text>
            </Pressable>
          )}
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
              Promise.all([resetCoachMarks(), resetScreenIntros(), resetAmplitudeOrientation(), resetOnboarding()]).then(() =>
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
        {/* HIDDEN ONLY FOR A KNOWN GUEST (2026-09-17). `isGuest` is true for
            EVERYONE before a tier is known — the provider boots at 'anonymous' —
            so an account holder whose entitlement read failed, which is every
            member who opens Settings offline, found no DELETE ACCOUNT control at
            all. It is an app-store requirement and the first thing a reviewer
            looks for, and it is the one row that must not disappear on a bad
            connection. When the tier is not known, show it: a guest who taps it
            gets an honest failure, which is far better than a member who cannot
            find it. */}
        {tierKnown && isGuest ? null : (
        <SettingsSection title="DELETE ACCOUNT" danger>
          <View style={{ paddingVertical: 10 }}>
            <Text style={[styles.rowHint, { marginBottom: 10 }]}>
              Permanently erases your personal data and signs you out. This cannot be undone.
            </Text>
            <DeleteAccountButton onDeleted={() => navigation.reset({ index: 0, routes: [{ name: 'Splash' }] })} />
          </View>
        </SettingsSection>
        )}
      </ScrollView>

      {/* Redeem access / promo code popup (owner 2026-08-21). */}
      <Modal accessibilityViewIsModal visible={redeemOpen} transparent animationType="fade" onRequestClose={() => setRedeemOpen(false)}>
        {/* Scrim is NOT an accessible button (QA night 2026-09-01): as one it
            wrapped the card's real buttons — invalid nesting + SR trap. */}
        {/**
          * ⛔ TAPPING OUTSIDE MUST DISMISS THE KEYBOARD, NOT THE DIALOG.
          *
          * Tester report 2026-09-23 (Frank, iPhone SE): "When you finish typing
          * in the code, you can't make the keyboard disappear to press the
          * redeem button — if you press anywhere outside the box, it cancels it."
          *
          * Exactly right. The keyboard covers the REDEEM button on a 667pt
          * screen, and the one gesture everybody uses to put a keyboard away —
          * tap the background — was wired straight to "close and discard".
          * So the code could be typed and then never submitted.
          *
          * Now the backdrop dismisses the keyboard FIRST and only closes on a
          * second tap, the card lifts clear of the keyboard, and the keyboard's
          * own `done` key submits so the button need not be reached at all.
          */}
        <Pressable
          accessible={false}
          style={styles.modalBackdrop}
          onPress={() => {
            if (redeemBusy) return;
            if (keyboardUp) {
              Keyboard.dismiss();
              return;
            }
            setRedeemOpen(false);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalAvoider}
            pointerEvents="box-none"
          >
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
              returnKeyType="done"
              onSubmitEditing={submitRedeem}
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
          </KeyboardAvoidingView>
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
  modalAvoider: { width: '100%', alignItems: 'center', justifyContent: 'center' },
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
  prefsErrorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10 },
  prefsRetry: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },

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
