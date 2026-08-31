/**
 * AUDIO COMMUNITY DIRECTORY (spec §5) — one screen, three compact
 * destinations: Explore · My Profile · Requests.
 *
 * Deliberately NOT a new bottom-navigation tab. The existing architecture is a
 * single native stack with a custom bottom nav rendered inside screens, and the
 * spec asks for another primary tab only if the architecture makes it
 * necessary. It does not: this is reached from Profile, and from the old
 * Pro Registry routes, which still resolve here.
 */
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Modal } from '../../components/DimModal';
import { colors, fonts } from '../../theme/tokens';
import { Banner, Chip, ChipWrap, Helper, Loading, PrimaryButton, SelfReportedNote } from './directoryBits';
import { ExploreView } from './ExploreView';
import { MyProfileView } from './MyProfileView';
import { RequestsView } from './RequestsView';
import {
  blockMember,
  fetchPublicProfile,
  reportMember,
  sendContactRequest,
  type PublicCredential,
  type PublicProfile,
  type ReportReason,
} from '../../features/directory/api';

type Tab = 'explore' | 'profile' | 'requests';
const TABS: { key: Tab; label: string }[] = [
  { key: 'explore', label: 'EXPLORE' },
  { key: 'profile', label: 'MY PROFILE' },
  { key: 'requests', label: 'REQUESTS' },
];

export function AudioCommunityDirectoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [tab, setTab] = useState<Tab>('explore');
  const [memberToken, setMemberToken] = useState<string | null>(null);

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={st.back}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={st.backGlyph}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={st.title}>
            AUDIO COMMUNITY DIRECTORY
          </Text>
          <Text style={st.sub}>Pro Audio Training Academy</Text>
        </View>
      </View>

      <View style={st.tabs} accessibilityRole="tablist">
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[st.tab, tab === t.key && st.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.key }}
            accessibilityLabel={t.label}
          >
            <Text style={[st.tabText, tab === t.key && st.tabTextOn]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'explore' ? <ExploreView onOpenMember={setMemberToken} /> : null}
      {tab === 'profile' ? <MyProfileView /> : null}
      {tab === 'requests' ? <RequestsView /> : null}

      <MemberSheet token={memberToken} onClose={() => setMemberToken(null)} />
    </View>
  );
}

/** A member's public profile, as seen from inside the app, plus the contact,
 *  block and report controls. This is the same projection the web page renders. */
function MemberSheet({ token, onClose }: { token: string | null; onClose: () => void }) {
  const [data, setData] = useState<{ profile: PublicProfile; credentials: PublicCredential[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [sent, setSent] = useState(false);

  // Load in an effect, never during render: calling a setter while rendering is
  // how you get an endless fetch loop the moment the fetch resolves.
  useEffect(() => {
    let alive = true;
    if (!token) {
      setData(null);
      setSent(false);
      setErr(null);
      return;
    }
    setBusy(true);
    void fetchPublicProfile(token).then((d) => {
      if (!alive) return;
      setData(d);
      setBusy(false);
    });
    return () => {
      alive = false;
    };
  }, [token]);

  if (!token) return null;

  const p = data?.profile;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.sheetRoot}>
        <View style={st.sheet}>
          <View style={st.sheetHead}>
            <Text accessibilityRole="header" style={st.sheetTitle}>
              {p ? p.displayName.toUpperCase() : 'MEMBER'}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={st.close}>✕</Text>
            </Pressable>
          </View>

          {busy || !p ? (
            <Loading label="Loading profile…" />
          ) : (
            <>
              {err ? <Banner tone="warn">{err}</Banner> : null}
              {sent ? <Banner tone="good">Request sent. You’ll see the reply under Requests.</Banner> : null}
              {p.primaryArea ? <Text style={st.area}>{p.primaryArea}</Text> : null}
              {p.about ? <Text style={st.about}>{p.about}</Text> : null}
              {p.specialties.length ? (
                <ChipWrap>
                  {p.specialties.map((s) => (
                    <Chip key={s} label={s} />
                  ))}
                </ChipWrap>
              ) : null}
              <Text style={st.meta}>
                {[p.roles.join(' · ') || null, p.countryCode, p.region, p.languages.join(', ') || null]
                  .filter(Boolean)
                  .join('  ·  ')}
              </Text>

              {data.credentials.length ? (
                <>
                  <Text style={st.credHead}>VERIFIED CREDENTIALS</Text>
                  {data.credentials.map((c, i) => (
                    <Text key={`${c.credentialName}-${i}`} style={st.cred}>
                      {c.credentialName}
                      {c.levelOrTier ? ` · ${c.levelOrTier}` : ''}
                    </Text>
                  ))}
                </>
              ) : null}

              {p.openTo.length ? (
                <>
                  <Text style={st.credHead}>OPEN TO</Text>
                  <ChipWrap>
                    {p.openTo.map((o) => (
                      <Chip key={o} label={o} />
                    ))}
                  </ChipWrap>
                </>
              ) : null}

              {p.contactEnabled && !sent ? (
                <PrimaryButton label="SEND A CONTACT REQUEST" tone="green" onPress={() => setContactOpen(true)} />
              ) : null}

              <View style={st.row}>
                <Pressable
                  onPress={() =>
                    void blockMember(token, true).then((r) => {
                      if (!r.ok) return setErr(r.error);
                      onClose();
                    })
                  }
                  hitSlop={6}
                  style={st.link}
                  accessibilityRole="button"
                  accessibilityLabel={`Block ${p.displayName}`}
                >
                  <Text style={st.linkText}>BLOCK</Text>
                </Pressable>
                <Pressable
                  onPress={() => setReportOpen(true)}
                  hitSlop={6}
                  style={st.link}
                  accessibilityRole="button"
                  accessibilityLabel={`Report ${p.displayName}`}
                >
                  <Text style={st.linkText}>REPORT</Text>
                </Pressable>
              </View>

              <SelfReportedNote />

              <ContactSheet
                open={contactOpen}
                onClose={() => setContactOpen(false)}
                openTo={p.openTo}
                onSend={(purpose, message) =>
                  sendContactRequest(token, purpose, message).then((r) => {
                    setContactOpen(false);
                    if (!r.ok) {
                      setErr(r.error);
                      return false;
                    }
                    setErr(null);
                    setSent(true);
                    return true;
                  })
                }
              />
              <ReportSheet
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                onSend={(reason, detail) =>
                  void reportMember({ token, reason, detail }).then((r) => {
                    setReportOpen(false);
                    if (!r.ok) setErr(r.error);
                  })
                }
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

/** §6.5: the purpose must be something the recipient actually offered, so the
 *  picker only ever shows THEIR Open To list. */
function ContactSheet({
  open,
  onClose,
  openTo,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  openTo: string[];
  onSend: (purpose: string, message: string) => Promise<boolean>;
}) {
  const [purpose, setPurpose] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  // The labels come back from the server; the RPC wants the slug. Rebuilding it
  // the same way the database does keeps the two in step.
  const slug = (label: string) =>
    label
      .toLowerCase()
      .replace(/&/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.sheetRoot}>
        <View style={st.sheet}>
          <Text accessibilityRole="header" style={st.sheetTitle}>
            SEND A CONTACT REQUEST
          </Text>
          <Helper>
            Choose what this is about — you can only pick something this member is open to. Keep it
            short and professional. Links and contact details are not allowed in a first message.
          </Helper>
          <ChipWrap>
            {openTo.map((o) => (
              <Chip key={o} label={o} on={purpose === slug(o)} onPress={() => setPurpose(slug(o))} />
            ))}
          </ChipWrap>
          <TextInput
            style={st.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Why you’re getting in touch"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            accessibilityLabel="Your message"
          />
          <PrimaryButton
            label="SEND REQUEST"
            tone="green"
            disabled={!purpose || !message.trim()}
            onPress={() => void onSend(purpose ?? '', message.trim()).then((ok) => ok && setMessage(''))}
          />
          <PrimaryButton label="CANCEL" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const REASONS: { key: ReportReason; label: string }[] = [
  { key: 'spam', label: 'Spam' },
  { key: 'harassment', label: 'Harassment' },
  { key: 'solicitation', label: 'Solicitation' },
  { key: 'impersonation', label: 'Impersonation' },
  { key: 'other', label: 'Something else' },
];

function ReportSheet({
  open,
  onClose,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  onSend: (reason: ReportReason, detail: string) => void;
}) {
  const [reason, setReason] = useState<ReportReason>('spam');
  const [detail, setDetail] = useState('');
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.sheetRoot}>
        <View style={st.sheet}>
          <Text accessibilityRole="header" style={st.sheetTitle}>
            REPORT THIS MEMBER
          </Text>
          <Helper>Reports go to Pro Audio Training Academy, not to the other member.</Helper>
          <ChipWrap>
            {REASONS.map((r) => (
              <Chip key={r.key} label={r.label} on={reason === r.key} onPress={() => setReason(r.key)} />
            ))}
          </ChipWrap>
          <TextInput
            style={st.input}
            value={detail}
            onChangeText={setDetail}
            placeholder="Anything else we should know (optional)"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
            accessibilityLabel="Report details"
          />
          <PrimaryButton label="SEND REPORT" tone="danger" onPress={() => onSend(reason, detail)} />
          <PrimaryButton label="CANCEL" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  back: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { fontFamily: fonts.oswaldMedium, fontSize: 26, color: colors.textSub },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.6, color: colors.textPrimary },
  sub: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingBottom: 8 },
  tab: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    backgroundColor: '#141414',
  },
  tabOn: { borderColor: 'rgba(255,198,77,.6)', backgroundColor: '#241a06' },
  tabText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.textMuted },
  tabTextOn: { color: colors.amber },
  sheetRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,.75)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '90%',
    backgroundColor: '#141414',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    padding: 14,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2, color: colors.amberLabel },
  close: { fontFamily: fonts.barlowMedium, fontSize: 18, color: colors.textSub, padding: 4 },
  area: { fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.6, color: colors.amber, marginTop: 8 },
  about: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 10 },
  meta: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textMutedDeep, marginTop: 8 },
  credHead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10.5,
    letterSpacing: 1.8,
    color: colors.textMutedDeep,
    marginTop: 16,
    marginBottom: 4,
  },
  cred: { fontFamily: fonts.barlowSemiBold, fontSize: 14, color: colors.textPrimary, marginTop: 2 },
  row: { flexDirection: 'row', gap: 16, marginTop: 8 },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.3, color: colors.textMuted },
  input: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#2c2c2c',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.barlowRegular,
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
