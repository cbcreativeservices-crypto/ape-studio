/**
 * AchievementsHomeScreen — the "Trophy Case" hub (v3 redesign 2026-09-04),
 * the PROGRESS tab. Four tiles in a 2×2 (owner 2026-10-29: "better design
 * layout to fit everything") — Topics | Labs, Certificates | Programs — each
 * with its count and a strip of the most recent, then the share card. Counts
 * never show a total (owner 2026-10-29). Tapping a tile drills into it.
 *
 * Reached from the bottom tab OR the Profile "Trophies & records" link; the
 * latter passes `from: 'profile'` so a back-to-Profile chevron shows (owner
 * 2026-08-07).
 */
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { AchievementsStackParamList } from '../../navigation/types';
import { BACK_GLYPH_MAX_SCALE, colors, fonts } from '../../theme/tokens';
import { TrophyImage } from '../../components/TrophyImage';
import { StudioButton } from '../../components/StudioButton';
import { CredentialBadge, type CredentialKind } from '../../components/CredentialBadge';
import { fetchAchievementsHub, prefetchTrophyCase, type HubData } from '../../features/achievements/api';
import { TROPHY_CASE_EMPTY } from '../../features/celebration/catalog';
import { ScreenIntroOverlay } from '../../features/intro/ScreenIntroOverlay';
import { readingColumn, readingText } from '../../theme/readingColumn';
import { useWideOnTablet } from '../../theme/useIsTablet';
import { TabletGrid } from '../../components/TabletGrid';
import { AppHeader, TabIconTile } from '../../components/AppHeader';
import { useCompletedLabs } from '../../features/lab/completedLabs';
import { fitValue } from '../../theme/legibility';
import { CredentialQr } from '../../components/CredentialQr';
import { CertificateArt, CertificateRenderHost, CERT_ASPECT } from '../../features/credentials/certificateRender';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { useTier } from '../../features/commercial/useTier';
import { fetchMyQrTokenOrThrow } from '../../features/profile/api';
import { REGISTRY_BASE_URL, registryUrl } from '../../features/profile/registry';
import { notify } from '../../lib/confirm';

const MINI = 40;
/** A small certificate in a tile: three fit a half-width tile on a 390 pt phone. */
const MINI_CERT_W = 42;
/** Items in a tile's strip — the count says how many there are in all. */
const STRIP_MAX = 3;
/** Lab names on the LABS tile; the rest read "+N more". */
const LAB_NAMES_MAX = 2;
const SHARE_QR = 76;
const SAMPLE_CERT = require('../../../assets/YOUR_NAME_certificate_SAMPLE_web.webp');

function MiniTopic({ iconUrl }: { iconUrl: string | null }) {
  return (
    <View style={[styles.mini, { borderColor: `${colors.amber}55` }]}>
      <TrophyImage
        iconUrl={iconUrl}
        fill
        radius={6}
        fallback={<Text style={[styles.miniGlyph, { color: colors.amber }]}>★</Text>}
      />
    </View>
  );
}

function TileStrip({
  children,
  empty,
  loading,
  failed,
  emptyLabel,
}: {
  children: ReactNode;
  empty: boolean;
  loading?: boolean;
  /** The hub read failed: say nothing here (the error card above says it) —
   *  never the "will appear here" line, which would read as "none". */
  failed?: boolean;
  /** Owner copy 2026-09-18 — each category says what WILL appear here. */
  emptyLabel: string;
}) {
  // While loading, a same-height placeholder (no text) so the tiles don't jump
  // taller once the data lands (Bug+Hater night A1-04).
  if (loading || failed) return <View style={styles.miniPlaceholder} />;
  if (empty) return <Text style={styles.tileNote}>{emptyLabel}</Text>;
  return <View style={styles.strip}>{children}</View>;
}

/** One progress tile. The whole tile is the button, except `headOnly` (the
 *  certificates tile, whose small certificates are buttons of their own). */
function Tile({
  name,
  accent,
  value,
  unit,
  a11y,
  onPress,
  onPressIn,
  headOnly,
  children,
}: {
  name: string;
  accent: string;
  /** null = not read yet (or the read failed): '—', never 0. */
  value: number | null;
  unit: string;
  a11y: string;
  onPress: () => void;
  onPressIn?: () => void;
  headOnly?: boolean;
  children: ReactNode;
}) {
  const head = (
    <>
      <View style={styles.tileTop}>
        <Text style={styles.tileName} {...fitValue(13)}>
          {name}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </View>
      <View style={styles.tileValueRow}>
        <Text style={[styles.tileValue, { color: accent, textShadowColor: `${accent}66` }]} {...fitValue(28)}>
          {value === null ? '—' : String(value)}
        </Text>
        <Text style={styles.tileUnit} {...fitValue(11)}>
          {unit}
        </Text>
      </View>
    </>
  );
  const frame = [styles.tile, { borderColor: `${accent}44` }];
  if (headOnly) {
    return (
      <View style={frame}>
        <Pressable
          style={({ pressed }) => [styles.tileHead, pressed && styles.cardPressed]}
          onPressIn={onPressIn}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={a11y}
          hitSlop={6}
        >
          {head}
        </Pressable>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      style={({ pressed }) => [...frame, pressed && styles.cardPressed]}
      onPressIn={onPressIn}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
    >
      <View style={styles.tileHead}>{head}</View>
      {children}
    </Pressable>
  );
}

export function AchievementsHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AchievementsStackParamList, 'AchievementsHome'>>();
  const cameFromProfile = route.params?.from === 'profile';
  const [hub, setHub] = useState<HubData | null>(null);
  // Distinguish a failed fetch (offline/blip) from a genuinely empty trophy
  // case: a rejection used to leave all three strips in a permanent skeleton
  // with no error and no retry (launch audit 2026-09-09).
  const [error, setError] = useState(false);
  // Tablet (owner iPad report 2026-10-06): the three cases sit side by side
  // across the iPad instead of a 560 pt strip between black gutters.
  const wide = useWideOnTablet();

  // NEWEST LOAD WINS (hunt 5, 2026-10-03; pattern P2). This is a tab root: it
  // stays mounted and reloads on every focus, and the hub fans out into
  // several reads that can each take up to the client's deadline. An OLDER
  // load landing after a newer one put the earlier counts back (a trophy
  // earned in between disappeared until the next visit).
  const loadTicket = useRef(0);
  const load = useCallback(() => {
    const ticket = ++loadTicket.current;
    setError(false);
    fetchAchievementsHub()
      .then((h) => {
        if (ticket === loadTicket.current) setHub(h);
      })
      .catch(() => {
        // keep any hub already on screen; surface the error only when there's none
        if (ticket === loadTicket.current) setError(true);
      });
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  // The share card's QR (owner 2026-10-26). A KNOWN guest gets the website;
  // a member gets their own Registry page. A failed read is said so, never
  // shown as "no QR" (DirectoryScreen's rule, network audit 2026-09-11).
  // KNOWN only (tier sweep 2026-10-03): a failed membership read is not a guest.
  const { tierKnown } = useEntitlement();
  const tier = useTier();
  const guest = tierKnown && tier === 'guest';
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrFailed, setQrFailed] = useState(false);
  const qrTicket = useRef(0);
  useFocusEffect(
    useCallback(() => {
      const ticket = ++qrTicket.current;
      setQrFailed(false);
      if (guest) {
        setQrToken(null);
        return;
      }
      fetchMyQrTokenOrThrow()
        .then((tok) => {
          if (ticket === qrTicket.current) setQrToken(tok);
        })
        .catch(() => {
          if (ticket === qrTicket.current) setQrFailed(true);
        });
    }, [guest]),
  );
  const qr = { token: guest ? null : qrToken, guest, failed: qrFailed };

  const t = hub?.topics;
  const c = hub?.certificates;
  const p = hub?.programs;
  const hubFailed = error && !hub;
  const hubLoading = !hub && !hubFailed;
  // LABS (owner 2026-10-29): the device lab-credit record, read live.
  const { state: labs } = useCompletedLabs();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.scroll, wide]}>
        <View style={styles.headerRow}>
          {cameFromProfile ? (
            <Pressable
              onPress={() => {
                navigation.setParams({ from: undefined });
                navigation.navigate('Profile');
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Back to profile"
              style={styles.backBtn}
            >
              <Text style={styles.back} maxFontSizeMultiplier={BACK_GLYPH_MAX_SCALE}>‹</Text>
            </Pressable>
          ) : null}
          {/* The PROGRESS tab's icon + title in the Study Dashboard's own
              header (owner 2026-10-29: the three tab titles match). */}
          <View style={styles.flex}>
            <AppHeader title={TROPHY_CASE_EMPTY.title} logo={<TabIconTile icon="Achievements" tint="#d6d6d6" />} />
          </View>
        </View>

        {/* Owner copy 2026-09-18. Sits above the error branch so the case still
            introduces itself when the counts cannot be read. */}
        <Text style={styles.tagline}>{TROPHY_CASE_EMPTY.tagline}</Text>
        <Text style={[styles.intro, wide && readingText]}>{TROPHY_CASE_EMPTY.intro}</Text>

        {/* A failed hub read says so ABOVE the tiles; the tiles it feeds show
            '—', never "nothing earned". LABS reads the device lab record, so it
            still shows (owner 2026-10-29). */}
        {hubFailed ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              Couldn’t load this right now. Nothing you’ve earned is affected — check your connection and retry, and email info@proaudiotrainingacademy.com if it keeps failing.
            </Text>
            <View style={{ width: 180 }}>
              <StudioButton label="Retry" variant="secondary" small onPress={load} />
            </View>
          </View>
        ) : null}

        {/* ── THE 2×2 (owner 2026-10-29: "better design layout to fit
            everything"): TOPICS | LABS, then CERTIFICATES | PROGRAMS. Counts
            only — no "N / total" (owner 2026-10-29: "the 'out of' sounds
            intimidating and defeating"). On a tablet the four sit in a row. */}
        <View style={styles.tiles}>
          {/* Phone: a Fragment (the 2×2 above); tablet: four columns. */}
          <TabletGrid minTile={200} maxCols={4} gap={10}>
          <Tile
            key="topics"
            name="TOPICS"
            accent={colors.amber}
            value={t ? t.earned : null}
            unit="COMPLETED"
            a11y={t ? `Topics, ${t.earned} completed` : 'Topics'}
            onPressIn={() => prefetchTrophyCase('topics')}
            onPress={() => navigation.navigate('Topics')}
          >
            <TileStrip loading={hubLoading} failed={hubFailed} empty={!!t && t.recent.length === 0} emptyLabel={TROPHY_CASE_EMPTY.topics}>
              {(t?.recent ?? []).slice(0, STRIP_MAX).map((topic) => (
                <MiniTopic key={topic.achievementId} iconUrl={topic.iconUrl} />
              ))}
            </TileStrip>
          </Tile>

          <Tile
            key="labs"
            name="LABS"
            accent={colors.green}
            value={labs.status === 'ready' ? labs.labs.length : null}
            unit="COMPLETED"
            a11y={labs.status === 'ready' ? `Labs, ${labs.labs.length} completed` : 'Labs'}
            onPress={() => navigation.navigate('Labs')}
          >
            {labs.status === 'loading' ? (
              <View style={styles.miniPlaceholder} />
            ) : labs.status === 'unreadable' ? (
              <Text style={styles.tileNote}>Couldn’t read your lab record. Tap to retry.</Text>
            ) : labs.labs.length === 0 ? (
              <Text style={styles.tileNote}>{TROPHY_CASE_EMPTY.labs}</Text>
            ) : (
              <View style={styles.labNames}>
                {labs.labs.slice(0, LAB_NAMES_MAX).map((lab) => (
                  <View key={lab.key} style={styles.labNameRow}>
                    <Text style={styles.labTick}>✓</Text>
                    <Text style={styles.labName} numberOfLines={2}>
                      {lab.name}
                    </Text>
                  </View>
                ))}
                {labs.labs.length > LAB_NAMES_MAX ? (
                  <Text style={styles.labMore}>+{labs.labs.length - LAB_NAMES_MAX} more</Text>
                ) : null}
              </View>
            )}
          </Tile>

          {/* CERTIFICATES — the head opens the wall; each small certificate
              opens THAT certificate (owner 2026-10-26). Separate pressables,
              not one nested in another, so a screen reader reaches each. */}
          <Tile
            key="certificates"
            name="CERTIFICATES"
            accent={colors.cyan}
            value={c ? c.earned : null}
            unit="EARNED"
            a11y={c ? `Certificates, ${c.earned} earned` : 'Certificates'}
            onPressIn={() => prefetchTrophyCase('certificate')}
            onPress={() => navigation.navigate('Certificates')}
            headOnly
          >
            <TileStrip loading={hubLoading} failed={hubFailed} empty={!!c && c.recent.length === 0} emptyLabel={TROPHY_CASE_EMPTY.certificates}>
              {(c?.recent ?? []).slice(0, STRIP_MAX).map((cred) => (
                <Pressable
                  key={cred.id}
                  style={({ pressed }) => [styles.miniCert, pressed && styles.cardPressed]}
                  onPressIn={() => prefetchTrophyCase('certificate')}
                  onPress={() => navigation.navigate('Certificates', { openId: cred.id })}
                  accessibilityRole="button"
                  accessibilityLabel={`${cred.name} certificate. Opens it.`}
                >
                  <CertificateArt
                    req={{ credentialName: cred.name, awardType: 'certificate', earnedAt: cred.awardedAt }}
                    fallback={<MiniCredential kind="certificate" />}
                  />
                </Pressable>
              ))}
            </TileStrip>
          </Tile>

          <Tile
            key="programs"
            name="PROGRAMS"
            accent={colors.programPurple}
            value={p ? p.earned : null}
            // COMPLETED, not EARNED — owner copy 2026-09-18. Certificates are
            // "earned", programs are "completed".
            unit="COMPLETED"
            a11y={p ? `Programs, ${p.earned} completed` : 'Programs'}
            onPressIn={() => prefetchTrophyCase('program')}
            onPress={() => navigation.navigate('Programs')}
          >
            <TileStrip loading={hubLoading} failed={hubFailed} empty={!!p && p.recent.length === 0} emptyLabel={TROPHY_CASE_EMPTY.programs}>
              {(p?.recent ?? []).slice(0, STRIP_MAX).map((cred) => (
                <MiniCredential key={cred.id} kind="program" />
              ))}
            </TileStrip>
          </Tile>
          </TabletGrid>
        </View>

        {/* ── SHARE YOUR ACHIEVEMENTS — under the tiles now, smaller (owner
            2026-10-29), and still NOT a button (owner 2026-10-26). It holds
            what there is to share: the certificate itself, the QR, and the
            link to the learner's own Registry page (the same page and link as
            Get Discovered). With no account yet the QR and link go to the
            website. Featuring does not exist (owner 2026-09-18: "remove
            feature, user can only share"). */}
        <View style={styles.featured}>
          <Text style={styles.cardName}>{TROPHY_CASE_EMPTY.shareHead}</Text>
          <View style={styles.shareRow}>
            <View style={styles.shareCert}>
              {c?.recent[0] ? (
                <CertificateArt
                  req={{ credentialName: c.recent[0].name, awardType: 'certificate', earnedAt: c.recent[0].awardedAt }}
                  label={`Your certificate: ${c.recent[0].name}`}
                  fallback={<Image source={SAMPLE_CERT} style={styles.certImg} contentFit="contain" accessibilityIgnoresInvertColors />}
                />
              ) : (
                <Image source={SAMPLE_CERT} style={styles.certImg} contentFit="contain" accessibilityIgnoresInvertColors />
              )}
            </View>
            <CredentialQr
              token={qr.token}
              url={qr.guest ? REGISTRY_BASE_URL : undefined}
              size={SHARE_QR}
              pendingLabel={qr.failed ? 'Couldn’t load your QR' : 'Your QR appears here soon'}
            />
          </View>
          {qr.guest || qr.token ? (
            <Text
              style={styles.shareLink}
              suppressHighlighting
              onPress={() => {
                const to = qr.token ? registryUrl(qr.token) : REGISTRY_BASE_URL;
                Linking.openURL(to).catch(() => {
                  notify('Page unavailable', 'We couldn’t open that page. Check your connection, or scan the QR instead.');
                });
              }}
              accessibilityRole="link"
              accessibilityLabel={qr.token ? 'Open your verification page' : 'Open the Pro Audio Training Academy website'}
            >
              {qr.token ? 'Scan or tap to open your verification page' : 'proaudiotrainingacademy.com'}
            </Text>
          ) : null}
          {c && c.recent.length === 0 ? <Text style={styles.featuredLead}>{TROPHY_CASE_EMPTY.shareLead}</Text> : null}
          <Text style={styles.emptyText}>{TROPHY_CASE_EMPTY.shareHint}</Text>
        </View>
      </ScrollView>

      {/* Trophy-case intro (Pillar B, plan §3) — draft copy awaits owner
          ratification; hidden from real users while placeholder-tagged. */}
      <ScreenIntroOverlay introKey="awards" />
      {/* Draws the real certificates above off-screen (owner 2026-10-26). */}
      <CertificateRenderHost />
    </View>
  );
}

function MiniCredential({ kind }: { kind: CredentialKind }) {
  return (
    <View style={styles.miniCred}>
      <CredentialBadge kind={kind} size={MINI} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: 16, gap: 12, ...readingColumn },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  backBtn: { alignSelf: 'center' },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 28, lineHeight: 28, color: colors.textSub, marginRight: -2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1.6, color: colors.textPrimary },
  cardPressed: { opacity: 0.85 },
  tagline: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 1.6,
    color: colors.amber,
    marginTop: -2,
  },
  intro: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  // ── the 2×2 (owner 2026-10-29). Two tiles fit a 390 pt phone (358 wide);
  // a tablet's wider column takes all four in one row.
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    flexGrow: 1,
    flexBasis: 150,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  tileHead: { gap: 2 },
  tileTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileName: { flex: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.3, color: colors.textPrimary },
  tileValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  tileValue: {
    flexShrink: 1,
    fontFamily: fonts.mono,
    fontSize: 28,
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  tileUnit: { fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2, color: colors.textSub },
  tileNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  chevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, lineHeight: 20, color: colors.textSub },
  labNames: { gap: 3 },
  labNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  labTick: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.green },
  labName: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textPrimary },
  labMore: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub, marginLeft: 18 },
  strip: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  mini: {
    width: MINI,
    height: MINI,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  miniCred: { width: MINI, height: MINI, alignItems: 'center', justifyContent: 'center' },
  miniCert: { width: MINI_CERT_W, borderRadius: 2, overflow: 'hidden' },
  miniGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 18 },
  miniPlaceholder: {
    width: MINI,
    height: MINI,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#242424',
    backgroundColor: '#111111',
    opacity: 0.6,
  },
  // Share card (owner 2026-10-26; under the tiles and smaller 2026-10-29):
  // the certificate beside the QR, the link under them. Not pressable.
  featured: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  cardName: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.3, color: colors.textPrimary },
  shareRow: { flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center' },
  shareCert: { flex: 1, maxWidth: 150, borderRadius: 3, overflow: 'hidden' },
  certImg: { width: '100%', aspectRatio: CERT_ASPECT },
  // The Get Discovered link's own look (DirectoryScreen registryLink).
  shareLink: { fontFamily: fonts.barlowMedium, fontSize: 13, color: '#7fd4ff', textDecorationLine: 'underline' },
  featuredLead: {
    fontFamily: fonts.barlowMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  emptyText: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSub },
  errorCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    borderRadius: 12,
    padding: 18,
    gap: 12,
    alignItems: 'center',
  },
  errorText: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: colors.textSub, textAlign: 'center' },
});
