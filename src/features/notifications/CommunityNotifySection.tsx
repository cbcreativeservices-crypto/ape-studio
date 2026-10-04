/**
 * Settings → MESSAGES & REQUESTS (owner decision 2026-10-04): opt-in alerts
 * between members.
 *
 *  - OFF by default. The phone's permission is asked ONLY when the person
 *    switches it on — our explainer first (PermissionPrompt), then the OS.
 *  - Per type: new messages, contact requests. Message text on the lock screen
 *    is a separate choice, OFF by default.
 *  - Every switch shows what the SERVER holds: it moves only on a write result,
 *    and a failed write is told (K2/K6).
 *  - Not a members-only feature: the community is open to every account. A
 *    guest (no account) is not shown the section at all — guests receive
 *    nothing.
 *  - Until Comp A applies migration 2026100401 the server has no such setting;
 *    the section is then not shown (no promise of a future feature).
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Toggle } from '../../components/Toggle';
import { SettingsSection } from '../settings/SettingsSection';
import { PermissionPrompt, usePermissionFlow } from '../permissions/PermissionPrompt';
import { notify, useModalHandoff } from '../../lib/confirm';
import { useInFlightLatch } from '../../lib/latch';
import { colors, fonts } from '../../theme/tokens';
import {
  fetchCommunityPrefs,
  notificationPermission,
  registerCommunityDevice,
  releaseCommunityDevice,
  saveCommunityPrefs,
  type CommunityPrefsLoad,
} from './communityPush';
import { COMMUNITY_COPY as C, type CommunityNotifyPrefs } from './communityRules';

type Load = CommunityPrefsLoad | { status: 'loading' };

const osAsk = async (): Promise<'granted' | 'denied' | 'blocked'> => {
  const r = await notificationPermission(true);
  return r === 'unavailable' ? 'denied' : r;
};

export function CommunityNotifySection() {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [busy, setBusy] = useState(false);
  const latch = useInFlightLatch();
  const handoff = useModalHandoff();
  const flow = usePermissionFlow('notifications', osAsk);

  // Newest read wins (a RETRY double-tapped, or a retry racing the first read).
  const readTicket = useRef(0);
  const reload = useCallback(async () => {
    const t = ++readTicket.current;
    const r = await fetchCommunityPrefs();
    if (t === readTicket.current) setLoad(r);
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);

  /** Show what the server now holds; any read still out is older than it. */
  const showSaved = (prefs: CommunityNotifyPrefs) => {
    readTicket.current += 1;
    setLoad({ status: 'ok', prefs });
  };

  /** One write at a time across every switch here (latched: a same-frame
   *  second tap is refused, not queued). */
  const write = (task: () => Promise<void>) => {
    void latch.run(async () => {
      setBusy(true);
      try {
        await task();
      } finally {
        setBusy(false);
      }
    });
  };

  const turnOn = async () => {
    if (Platform.OS === 'web') {
      notify(C.noticeTitle, C.webOnly);
      return;
    }
    // Already allowed at the OS level: no explainer needed.
    let perm = await notificationPermission(false);
    if (perm !== 'granted') {
      const res = await flow.request();
      if (res === 'cancelled' || res === 'denied') return; // NOT NOW / the OS said no: stays off
      if (res === 'blocked') {
        perm = await notificationPermission(false);
        handoff(() => notify(C.noticeTitle, perm === 'blocked' ? C.permissionBlocked : C.askedNotTo));
        return;
      }
    }
    // The phone first, the switch last: the setting is never ON with no phone
    // behind it.
    if (!(await registerCommunityDevice())) {
      handoff(() => notify(C.noticeTitle, C.registerFailed));
      return;
    }
    const saved = await saveCommunityPrefs({ pushEnabled: true });
    if (!saved.ok) {
      void releaseCommunityDevice();
      handoff(() => notify(C.noticeTitle, C.onFailed));
      return;
    }
    showSaved(saved.prefs);
  };

  const turnOff = async () => {
    // The setting first: it alone stops every send, so the switch tells the
    // truth from that moment even if releasing the phone then fails.
    const saved = await saveCommunityPrefs({ pushEnabled: false });
    if (!saved.ok) {
      notify(C.noticeTitle, C.offFailed);
      return;
    }
    showSaved(saved.prefs);
    void releaseCommunityDevice();
  };

  const setOne = async (patch: Partial<CommunityNotifyPrefs>) => {
    const saved = await saveCommunityPrefs(patch);
    if (!saved.ok) {
      notify(C.noticeTitle, C.changeFailed);
      return;
    }
    showSaved(saved.prefs);
  };

  // Not offered: the server has no such setting yet, or there is no account.
  // The first read shows nothing rather than a section that may vanish.
  if (load.status === 'unsupported' || load.status === 'signedOut' || load.status === 'loading') {
    return <PermissionPrompt {...flow.promptProps} />;
  }

  const prefs = load.status === 'ok' ? load.prefs : null;
  const on = !!prefs?.pushEnabled;
  return (
    <>
      <SettingsSection title={C.section} summary={prefs ? (on ? 'on' : 'off') : undefined}>
        <Text style={st.intro}>{C.intro}</Text>
        {load.status === 'error' ? (
          <View style={st.errorRow}>
            <Text style={st.note}>{C.loadFailed}</Text>
            <Pressable onPress={() => void reload()} hitSlop={8} accessibilityRole="button" accessibilityLabel={C.retryA11y}>
              <Text style={st.retry}>RETRY</Text>
            </Pressable>
          </View>
        ) : null}
        {prefs ? (
          <>
            <Row label={C.masterLabel} hint={C.masterHint} border>
              <Toggle
                on={on}
                disabled={busy}
                label={C.masterLabel}
                onChange={(v) => write(v ? turnOn : turnOff)}
              />
            </Row>
            <View style={!on ? st.groupOff : undefined} pointerEvents={on ? 'auto' : 'none'}>
              <Row label={C.messagesLabel} hint={C.messagesHint} border>
                <Toggle
                  on={prefs.messages}
                  disabled={busy || !on}
                  label={C.messagesLabel}
                  onChange={(v) => write(() => setOne({ messages: v }))}
                />
              </Row>
              <Row label={C.requestsLabel} hint={C.requestsHint} border>
                <Toggle
                  on={prefs.requests}
                  disabled={busy || !on}
                  label={C.requestsLabel}
                  onChange={(v) => write(() => setOne({ requests: v }))}
                />
              </Row>
              <Row label={C.previewLabel} hint={C.previewHint}>
                <Toggle
                  on={prefs.showPreview}
                  disabled={busy || !on}
                  label={C.previewLabel}
                  onChange={(v) => write(() => setOne({ showPreview: v }))}
                />
              </Row>
            </View>
            <Text style={st.footer}>{C.footer}</Text>
          </>
        ) : null}
      </SettingsSection>
      <PermissionPrompt {...flow.promptProps} />
    </>
  );
}

function Row({ label, hint, border, children }: { label: string; hint: string; border?: boolean; children: ReactNode }) {
  return (
    <View style={[st.row, border && st.rowBorder]}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={st.rowLabel}>{label}</Text>
        <Text style={st.rowHint}>{hint}</Text>
      </View>
      {children}
    </View>
  );
}

// Matches SettingsScreen's row styles so the section reads as one of its own.
const st = StyleSheet.create({
  intro: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textMuted, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#1f1f24' },
  rowLabel: { fontFamily: fonts.barlowSemiBold, fontSize: 15, color: colors.textSecondary },
  rowHint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textMuted, marginTop: 3 },
  groupOff: { opacity: 0.4 },
  footer: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textMuted, marginTop: 10 },
  note: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.amberLabel },
  errorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10 },
  retry: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
});
