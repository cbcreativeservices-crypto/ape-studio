/**
 * CredentialWall — the earned Certificates / Programs view (parameterized by
 * `kind`). Owner direction 2026-09-04: a LIST (not a card grid); the trophy
 * IMAGE appears ONLY on earned rows; and a leading "waiting slot" always sits
 * at the top, showing the credential you're closest to completing so the list
 * is never empty and never fakes progress.
 *
 * Card-row grammar matches the rest of Achievements (dark card, left accent
 * stripe). Earned rows tap into the full-size TrophyModal with the certificate
 * PDF download; the waiting slot taps into the existing AwardProgress screen
 * (the in-progress checklist + Final Exam gate) rather than duplicating it.
 */
import { useCallback, useRef, useState } from 'react';
import { BACK_HIT_SLOP } from '../../components/backHitSlop';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
// expo-image, not RN Image (perf hunt 2026-10-03): the course-cards bucket
// serves `Cache-Control: no-cache`, so RN's loader re-validated every row's art
// on each visit (and again for the popup's copy of the same file); expo-image's
// memory + disk cache keys on the URL, decodes off the JS thread, and the popup
// art is then the row's already-decoded image. See components/CardArt.
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BACK_GLYPH_MAX_SCALE, colors, fonts } from '../../theme/tokens';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { CredentialBadge, type CredentialKind } from '../../components/CredentialBadge';
import { ProgressRing } from '../../components/ProgressRing';
import { StudioButton } from '../../components/StudioButton';
import { TrophyModal } from '../../components/TrophyModal';
import { credentialArtFor } from '../../features/credentials/credentialArt';
import { exportCertificate, isAvailable as certificateExportAvailable } from '../../features/credentials/certificatePdf';
import { CredentialShareRow } from '../../features/credentials/CredentialShareRow';
// The SHARED NEXT UP read (perf hunt 2026-10-03): joins the hub's press-in
// prefetch instead of starting the same reads again. Same answer, same throws.
import {
  fetchEarnedCredentialsByType,
  fetchNearestCredentialShared as fetchNearestCredential,
  type NearestCredentialResult,
} from '../../features/achievements/api';
import type { EarnedCredentialRow } from '../../features/credentials/api';
// Tablet (owner 2026-09-29): a page of rows/cards - capped at the card column
// and centred instead of stretching rows 990 pt wide. No-op on a phone.
import { cardColumn } from '../../theme/readingColumn';
import { useWideOnTablet } from '../../theme/useIsTablet';
import { TabletGrid } from '../../components/TabletGrid';
import { safeGoBack } from '../../lib/safeGoBack';

/** Slugs whose art 404s (not every credential has a file uploaded yet). Held
 *  per-mount so a failed load falls back to the badge instead of an empty
 *  frame, and a later upload lights up on the next visit without a code change. */
const KIND_ACCENT: Record<CredentialKind, string> = {
  certificate: colors.cyan,
  program: colors.programPurple,
};

function fmtEarned(iso: string | null): string {
  if (!iso) return 'EARNED';
  const d = new Date(iso);
  // An unparseable stamp falls back to the bare "EARNED" the missing-date case
  // already uses (edge-case QA 2026-09-11) — it previously read
  // "EARNED INVALID DATE" on a credential the member had genuinely earned.
  if (Number.isNaN(d.getTime())) return 'EARNED';
  return 'EARNED ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}

export function CredentialWall({ kind, title }: { kind: CredentialKind; title: string }) {
  const insets = useSafeAreaInsets();
  const wide = useWideOnTablet();
  const navigation = useNavigation<any>();
  const accent = KIND_ACCENT[kind];
  const noun = kind === 'certificate' ? 'certificate' : 'program';
  // A guest can't earn credentials (no account): the waiting slot says so
  // inline instead of hopping to a sign-in dead end (Bug+Hater night A1-08).
  // `resolved` REQUIRED (entitlement roll-out 2026-09-11): the provider boots at
  // 'anonymous' and only flips once the server read lands, so an ungated read
  // flashed "Sign in with a free account to track this" at signed-in members
  // before showing their real progress. Holding the guest line until the tier is
  // known costs a guest nothing — the waiting slot simply shows its counts a
  // moment later.
  //
  // KNOWN, not merely resolved (tier sweep 2026-10-03): `resolved` also flips
  // on a FAILED membership read, and a signed-in learner with no remembered
  // tier then reads 'anonymous' — they were told to sign in.
  const { entitlement, tierKnown } = useEntitlement();
  const guest = tierKnown && entitlement === 'anonymous';
  // ONE EXIT for ‹ (night bug pass 3, 2026-10-01): a double tap's second
  // goBack() from the popped route bubbled up and switched to the Home tab.
  // safeGoBack alone guards it (focus check + its time window); the old
  // one-way latch on top left ‹ dead for good if a leave ever did not go
  // through (final round B, 2026-10-02).
  const leave = useCallback(() => {
    safeGoBack(navigation);
  }, [navigation]);
  const [rows, setRows] = useState<EarnedCredentialRow[] | null>(null);
  const [nearest, setNearest] = useState<NearestCredentialResult | null>(null);
  const [open, setOpen] = useState<EarnedCredentialRow | null>(null);
  // The SAMPLE certificate window (owner 2026-10-23): with nothing earned yet,
  // a learner can still open it and see where a certificate, its download and
  // its share buttons will be. Clearly a sample; nothing in it works.
  const [sampleOpen, setSampleOpen] = useState(false);
  // Full-screen certificate (owner 2026-10-23: "seen full screen landscape so
  // they could show another person their phone").
  const [fullOpen, setFullOpen] = useState(false);
  const [artFailed, setArtFailed] = useState<ReadonlySet<string>>(() => new Set());
  const markArtFailed = (slug: string) =>
    setArtFailed((prev) => (prev.has(slug) ? prev : new Set(prev).add(slug)));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Distinguish a failed fetch from a genuinely empty wall: a rejection used to
  // collapse into "COMING SOON — none available yet" / a stuck waiting slot,
  // reporting "you're offline" as "these don't exist" (launch audit 2026-09-09).
  const [failed, setFailed] = useState(false);
  // The NEXT UP read on its own (hunt 4, 2026-10-03): the error card above is
  // drawn only while nothing is earned, so for a member with a credential a
  // failed NEXT UP read left the slot on "Finding your next…" for good.
  const [nearestFailed, setNearestFailed] = useState(false);

  // NEWEST LOAD WINS (hunt 5, 2026-10-03; pattern P2). This runs on every
  // focus and on every Retry / "Tap to try again", and each read can take up
  // to the client's deadline — so an OLDER load's late rejection landed after
  // a newer one had succeeded and put the "Couldn't load" card over a wall
  // that had just loaded (and an older answer could replace a newer one).
  const loadTicket = useRef(0);
  const load = useCallback(() => {
    const ticket = ++loadTicket.current;
    const current = () => ticket === loadTicket.current;
    setFailed(false);
    setNearestFailed(false);
    fetchEarnedCredentialsByType(kind)
      .then((r) => {
        if (current()) setRows(r);
      })
      .catch(() => {
        if (current()) setFailed(true);
      });
    fetchNearestCredential(kind)
      .then((n) => {
        if (current()) setNearest(n);
      })
      .catch(() => {
        if (!current()) return;
        setFailed(true);
        setNearestFailed(true);
      });
  }, [kind]);

  useFocusEffect(useCallback(() => load(), [load]));

  // SYNCHRONOUS LATCH (bug pass 2, 2026-09-30). `busy` disables the button only
  // after a re-render, so a double tap started two exports: two share sheets,
  // the second refused by iOS — and its failure put "Could not prepare the
  // certificate" under the sheet that had actually worked.
  const exportingRef = useRef(false);
  const download = useCallback(async () => {
    if (!open || exportingRef.current) return;
    exportingRef.current = true;
    setBusy(true);
    const res = await exportCertificate({ credentialName: open.name, awardType: open.type, earnedAt: open.awardedAt });
    exportingRef.current = false;
    setBusy(false);
    if (res.ok) return;
    setMessage(
      res.reason === 'needs_build'
        ? 'Certificate download isn’t available on this device. Your certificate is safely recorded on your account.'
        : res.reason === 'no_share_target'
          ? 'No app on this device can open a PDF.'
          : 'Could not prepare the certificate. Try again.',
    );
  }, [open]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.scroll, cardColumn, wide]}>
        <View style={styles.headerRow}>
          <Pressable onPress={leave} hitSlop={BACK_HIT_SLOP} accessibilityRole="button" accessibilityLabel="Back" style={styles.backBtn}>
            <Text style={styles.back} maxFontSizeMultiplier={BACK_GLYPH_MAX_SCALE}>‹</Text>
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.flex} />
          <Text style={[styles.counter, { color: accent }]}>{rows ? `${rows.length} EARNED` : '—'}</Text>
        </View>

        {failed && (!rows || rows.length === 0) ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              Couldn’t load this right now. Nothing you’ve earned is affected — check your connection and retry, and email info@proaudiotrainingacademy.com if it keeps failing.
            </Text>
            <View style={{ width: 180 }}>
              <StudioButton label="Retry" variant="secondary" small onPress={load} />
            </View>
          </View>
        ) : (
          <>
            {/* The leading "waiting slot" — always first. */}
            <WaitingSlot kind={kind} noun={noun} accent={accent} result={nearest} navigation={navigation} guest={guest} failed={nearestFailed} onRetry={load} />

            {/* Earned credentials — newest first. Image only appears here.
                Two columns across a tablet (owner iPad report 2026-10-06);
                a phone renders the plain list. */}
            <TabletGrid minTile={360} maxCols={2} gap={12}>
            {(rows ?? []).map((c) => {
          const art = c.slug && artFailed.has(c.slug) ? null : credentialArtFor(c.slug);
          return (
            <Pressable
              key={c.id}
              style={[styles.row, styles.rowEarned, { borderLeftColor: accent }]}
              onPress={() => {
                setMessage(null);
                setOpen(c);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${c.name}, ${fmtEarned(c.awardedAt).toLowerCase()}`}
            >
              <View style={styles.art}>
                {art ? (
                  <Image
                    source={art}
                    style={styles.artImg}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                    recyclingKey={c.slug ?? undefined}
                    onError={() => c.slug && markArtFailed(c.slug)}
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <CredentialBadge kind={kind} size={48} />
                )}
              </View>
              <View style={styles.rowMain}>
                <Text style={styles.rowName} numberOfLines={2}>
                  {c.name}
                </Text>
                <Text style={styles.rowMeta}>{fmtEarned(c.awardedAt)}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
            })}
            </TabletGrid>

            {/* SAMPLE (owner 2026-10-23) — only while no certificate is earned,
                so the wall shows where certificates appear and what opening
                one looks like. Never counted, never fakes progress. */}
            {kind === 'certificate' && rows != null && rows.length === 0 ? (
              <Pressable
                style={[styles.row, styles.rowSample, { borderLeftColor: `${accent}66` }]}
                onPress={() => setSampleOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Sample certificate. Opens a preview of where your earned certificates, download and sharing will appear."
              >
                <View style={styles.sampleArt}>
                  <Image source={SAMPLE_CERT} style={styles.artImg} contentFit="contain" accessibilityIgnoresInvertColors />
                </View>
                <View style={styles.rowMain}>
                  <View style={styles.sampleHead}>
                    <Text style={[styles.sampleTag, { color: accent, borderColor: `${accent}88` }]}>SAMPLE</Text>
                  </View>
                  <Text style={styles.rowName}>Your certificates appear here</Text>
                  <Text style={styles.rowMeta}>TAP TO SEE THE CERTIFICATE VIEW</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>

      <TrophyModal
        visible={sampleOpen}
        iconUrl={null}
        name="Sample certificate"
        color={accent}
        meta="SAMPLE · NOT EARNED"
        action={null}
        onClose={() => {
          setSampleOpen(false);
          setFullOpen(false);
        }}
        overlay={fullOpen && sampleOpen ? <CertificateFullView source={SAMPLE_CERT} label="Sample certificate" onClose={() => setFullOpen(false)} /> : null}
        onOverlayClose={() => setFullOpen(false)}
        below={
          <View style={styles.belowCol}>
            <FullScreenKey onPress={() => setFullOpen(true)} />
            <SamplePreviewControls accent={accent} />
          </View>
        }
      >
        <Image
          accessible
          source={SAMPLE_CERT}
          style={styles.artImg}
          contentFit="contain"
          accessibilityRole="image"
          accessibilityLabel="Example Pro Audio Training Academy certificate, shown with a placeholder name"
          accessibilityIgnoresInvertColors
        />
      </TrophyModal>

      <TrophyModal
        visible={!!open}
        iconUrl={null}
        name={open?.name}
        color={accent}
        meta={open ? fmtEarned(open.awardedAt) : null}
        action={
          // [8] (2026-09-07): only offer the download when the native print/share
          // module is in the build (matches AwardProgressScreen's honest gate).
          certificateExportAvailable() ? { label: 'DOWNLOAD CERTIFICATE', onPress: download, busy } : null
        }
        onClose={() => {
          setOpen(null);
          setMessage(null);
          setFullOpen(false);
        }}
        // The share row, notes and messages go BELOW the art (owner pass
        // 2026-10-23): as children they sat inside the art frame, which crops
        // its content and is pointerEvents="none" — the buttons were cut off
        // and could not be tapped.
        overlay={fullOpen && open ? <CertificateFullView source={open.slug && !artFailed.has(open.slug) ? credentialArtFor(open.slug) : null} label={open.name} onClose={() => setFullOpen(false)} /> : null}
        onOverlayClose={() => setFullOpen(false)}
        below={
          <View style={styles.belowCol}>
            {open && open.slug && !artFailed.has(open.slug) && credentialArtFor(open.slug) ? <FullScreenKey onPress={() => setFullOpen(true)} /> : null}
            {/* [8] (2026-09-07): honest note when the download isn't in this build. */}
            {!certificateExportAvailable() ? (
              <Text style={styles.exportNote}>Certificate download isn’t available on this device. Your certificate is safely recorded on your account.</Text>
            ) : null}
            {/* Copy / share the verified-record link, and share the QR as an image
                (owner 2026-09-18). The printed certificate keeps the button above:
                that path builds a PDF and already existed. */}
            {open ? <CredentialShareRow credentialName={open.name} onMessage={setMessage} /> : null}
            {/* Download / share feedback lives INSIDE the modal (bug hunt
                2026-09-29): on the page it rendered underneath the open modal, so
                "Could not prepare the certificate" was never seen. */}
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>
        }
      >
        {open && open.slug && !artFailed.has(open.slug) && credentialArtFor(open.slug) ? (
          <Image accessible
            source={credentialArtFor(open.slug)!}
            style={styles.artImg}
            contentFit="contain"
            cachePolicy="memory-disk"
            onError={() => open.slug && markArtFailed(open.slug)}
            accessibilityRole="image"
            accessibilityLabel={open.name}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={styles.modalBadge}>
            <CredentialBadge kind={kind} size={180} />
          </View>
        )}
      </TrophyModal>
    </View>
  );
}

const SAMPLE_CERT = require('../../../assets/YOUR_NAME_certificate_SAMPLE_web.webp');

function FullScreenKey({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.fullKey, pressed && { opacity: 0.8 }]} onPress={onPress} accessibilityRole="button" accessibilityLabel="View the certificate full screen, sideways, to show someone">
      <Text style={styles.fullKeyText}>⤢ VIEW FULL SCREEN</Text>
    </Pressable>
  );
}

/**
 * The certificate filling the phone, laid out LANDSCAPE (owner 2026-10-23) —
 * turn the phone sideways and show it to someone. Drawn rotated inside the
 * popup rather than by locking the device orientation: identical on iOS and
 * Android, no native module needed, and it cannot strand the app sideways. A
 * window that is already landscape (a tablet held sideways) shows it upright.
 */
function CertificateFullView({ source, label, onClose }: { source: unknown; label: string; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const rotate = height > width;
  const w = rotate ? height : width;
  const h = rotate ? width : height;
  return (
    <View style={styles.fullRoot}>
      <View
        style={[
          { width: w, height: h, left: (width - w) / 2, top: (height - h) / 2, position: 'absolute' },
          rotate && { transform: [{ rotate: '90deg' }] },
        ]}
      >
        {source ? (
          <Image
            accessible
            source={source as never}
            style={[styles.fullImg, { margin: rotate ? Math.max(insets.top, 12) : 12 }]}
            contentFit="contain"
            accessibilityRole="image"
            accessibilityLabel={label}
            accessibilityIgnoresInvertColors
          />
        ) : null}
        {/* Close at the TOP-LEFT of the landscape view (tool full-screen
            standard: controls on the left). */}
        <Pressable onPress={onClose} hitSlop={14} style={styles.fullClose} accessibilityRole="button" accessibilityLabel="Close full screen">
          <Text style={styles.fullCloseX}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** What the real certificate window offers — shown greyed and inert in the
 *  SAMPLE so the layout is learnable before anything is earned. */
function SamplePreviewControls({ accent }: { accent: string }) {
  const keys = ['COPY LINK', 'SHARE LINK', 'SHARE QR'];
  return (
    <View style={styles.sampleCtrls} accessible accessibilityLabel="In your own certificate: download certificate, copy link, share link and share QR. Not available in this sample.">
      <View style={[styles.sampleKey, styles.sampleKeyWide, { borderColor: `${accent}55` }]}>
        <Text style={styles.sampleKeyText}>DOWNLOAD CERTIFICATE</Text>
      </View>
      <Text style={styles.sampleHeadText}>SHARE</Text>
      <View style={styles.sampleKeyRow}>
        {keys.map((k) => (
          <View key={k} style={styles.sampleKey}>
            <Text style={styles.sampleKeyText}>{k}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.exportNote}>
        This is a sample. When you earn a certificate it appears in this list — open it to download the printable certificate and share your verification link or QR code.
      </Text>
    </View>
  );
}

function WaitingSlot({
  kind,
  noun,
  accent,
  result,
  navigation,
  guest,
  failed,
  onRetry,
}: {
  kind: CredentialKind;
  noun: string;
  accent: string;
  result: NearestCredentialResult | null;
  navigation: any;
  guest: boolean;
  /** The NEXT UP read failed and nothing was shown yet. */
  failed: boolean;
  onRetry: () => void;
}) {
  // Failed, not loading (hunt 4, 2026-10-03) — say so, and retry on tap.
  if (!result && failed) {
    return (
      <Pressable
        style={[styles.row, styles.rowWaiting, { borderLeftColor: `${accent}66` }]}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={`Could not load your next ${noun}. Try again.`}
      >
        <ProgressRing size={48} progress={null} color={accent} centerLabel="—" />
        <View style={styles.rowMain}>
          <Text style={styles.eyebrow}>NEXT UP</Text>
          <Text style={styles.waitingName}>Couldn’t load your next {noun}.</Text>
          <Text style={styles.waitingMeta}>Tap to try again.</Text>
        </View>
      </Pressable>
    );
  }
  // Loading — a quiet placeholder slot so the layout doesn't jump.
  if (!result) {
    return (
      <View style={[styles.row, styles.rowWaiting, { borderLeftColor: `${accent}66` }]}>
        <ProgressRing size={48} progress={null} color={accent} centerLabel="—" />
        <View style={styles.rowMain}>
          <Text style={styles.eyebrow}>NEXT UP</Text>
          <Text style={styles.waitingName}>Finding your next {noun}…</Text>
        </View>
      </View>
    );
  }

  // A guest never chose a credential (toddler hunt 2026-10-14 #31f): naming
  // the server's nearest one read as "you picked this". A neutral prompt.
  if (result.kind === 'candidate' && guest) {
    return (
      <View
        style={[styles.row, styles.rowWaiting, { borderLeftColor: `${accent}66` }]}
        accessible
        accessibilityLabel={`Next up: choose a ${noun} to work toward. Sign in with a free account to track one.`}
      >
        <ProgressRing size={48} progress={null} color={accent} centerLabel="—" />
        <View style={styles.rowMain}>
          <Text style={[styles.eyebrow, { color: accent }]}>NEXT UP</Text>
          <Text style={styles.waitingName}>Choose a {noun} to work toward.</Text>
          <Text style={styles.waitingMeta}>Sign in with a free account to track one.</Text>
        </View>
      </View>
    );
  }

  if (result.kind === 'candidate') {
    const progress = result.totalCount > 0 ? result.completeCount / result.totalCount : 0;
    return (
      <Pressable
        style={[styles.row, styles.rowWaiting, { borderLeftColor: `${accent}aa` }]}
        onPress={() => navigation.navigate('AwardProgress', { awardType: kind, awardId: result.id, awardName: result.name })}
        accessibilityRole="button"
        accessibilityLabel={`Next up: ${result.name}, ${result.completeCount} of ${result.totalCount} topics complete. Opens its progress.`}
      >
        <ProgressRing size={48} progress={progress} color={accent} centerLabel={`${result.completeCount}/${result.totalCount}`} />
        <View style={styles.rowMain}>
          <Text style={[styles.eyebrow, { color: accent }]}>NEXT UP</Text>
          <Text style={styles.waitingName} numberOfLines={2}>
            {result.name}
          </Text>
          <Text style={styles.waitingMeta}>
            {`${result.completeCount} of ${result.totalCount} topics complete`}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    );
  }

  if (result.kind === 'all_earned') {
    return (
      <View style={[styles.row, styles.rowWaiting, { borderLeftColor: colors.green }]}>
        <ProgressRing size={48} progress={1} color={colors.green} centerLabel="✓" />
        <View style={styles.rowMain}>
          <Text style={[styles.eyebrow, { color: colors.green }]}>ALL EARNED</Text>
          <Text style={styles.waitingName}>You've earned every {noun} available.</Text>
        </View>
      </View>
    );
  }

  // none_published
  return (
    <View style={[styles.row, styles.rowWaiting, { borderLeftColor: colors.hairline }]}>
      <ProgressRing size={48} progress={null} color={colors.textSub} centerLabel="—" />
      <View style={styles.rowMain}>
        <Text style={styles.eyebrow}>COMING SOON</Text>
        <Text style={styles.waitingName}>No {noun}s available yet.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: 16, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  backBtn: { alignSelf: 'center' },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 28, lineHeight: 28, color: colors.textSub, marginRight: -2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1.4, color: colors.textPrimary },
  flex: { flex: 1 },
  counter: { fontFamily: fonts.mono, fontSize: 13, textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
  message: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.amber },
  errorCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    borderRadius: 12,
    padding: 20,
    gap: 14,
    alignItems: 'center',
  },
  errorText: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: colors.textSub, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 10,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 13,
  },
  rowEarned: { backgroundColor: '#181818', borderWidth: 1, borderColor: '#242424' },
  rowWaiting: { backgroundColor: '#121212', borderWidth: 1, borderColor: '#202020', borderStyle: 'dashed' },
  art: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  artImg: { width: '100%', height: '100%' },
  rowMain: { flex: 1, gap: 3 },
  rowName: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.3, color: colors.textPrimary },
  rowMeta: { fontFamily: fonts.mono, fontSize: 11, color: '#777777' },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.6, color: colors.textSub },
  waitingName: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.3, color: colors.textPrimary },
  waitingMeta: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub },
  chevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSub },
  // SAMPLE row + window (owner 2026-10-23).
  rowSample: { backgroundColor: '#141414', borderWidth: 1, borderColor: '#242424', borderStyle: 'dashed' },
  sampleArt: { width: 62, aspectRatio: 486 / 375, alignItems: 'center', justifyContent: 'center', opacity: 0.85 },
  sampleHead: { flexDirection: 'row' },
  sampleTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.4, borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  sampleCtrls: { width: '100%', gap: 8, alignItems: 'center' },
  belowCol: { width: '100%', alignItems: 'center' },
  // Full-screen certificate (owner 2026-10-23).
  fullKey: { borderWidth: 1, borderColor: '#3a3a3a', backgroundColor: '#1a1a1a', borderRadius: 7, paddingVertical: 9, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center', marginBottom: 6 },
  fullKeyText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.textPrimary },
  fullRoot: { flex: 1, backgroundColor: '#000' },
  fullImg: { flex: 1 },
  fullClose: { position: 'absolute', top: 14, left: 14, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,20,22,0.85)', borderWidth: 1, borderColor: '#3a3a42' },
  fullCloseX: { fontSize: 17, color: '#e8ecf2', fontWeight: '600' },
  sampleHeadText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.6, color: colors.textSub },
  sampleKeyRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  sampleKey: { borderWidth: 1, borderColor: '#2e2e2e', backgroundColor: '#151515', borderRadius: 7, paddingVertical: 9, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center', opacity: 0.55 },
  sampleKeyWide: { alignSelf: 'stretch', alignItems: 'center' },
  sampleKeyText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.textPrimary },
  modalBadge: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  exportNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, textAlign: 'center', marginTop: 10 },
});
