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
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { CredentialBadge, type CredentialKind } from '../../components/CredentialBadge';
import { ProgressRing } from '../../components/ProgressRing';
import { TrophyModal } from '../../components/TrophyModal';
import { credentialArtFor } from '../../features/credentials/credentialArt';
import { exportCertificate } from '../../features/credentials/certificatePdf';
import { fetchEarnedCredentialsByType, fetchNearestCredential, type NearestCredentialResult } from '../../features/achievements/api';
import type { EarnedCredentialRow } from '../../features/credentials/api';

const KIND_ACCENT: Record<CredentialKind, string> = {
  certificate: colors.cyan,
  program: colors.programPurple,
};

function fmtEarned(iso: string | null): string {
  if (!iso) return 'EARNED';
  const d = new Date(iso);
  return 'EARNED ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}

export function CredentialWall({ kind, title }: { kind: CredentialKind; title: string }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const accent = KIND_ACCENT[kind];
  const noun = kind === 'certificate' ? 'certificate' : 'program';
  const [rows, setRows] = useState<EarnedCredentialRow[] | null>(null);
  const [nearest, setNearest] = useState<NearestCredentialResult | null>(null);
  const [open, setOpen] = useState<EarnedCredentialRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchEarnedCredentialsByType(kind).then(setRows).catch(() => setRows([]));
      fetchNearestCredential(kind).then(setNearest).catch(() => setNearest(null));
    }, [kind]),
  );

  const download = useCallback(async () => {
    if (!open) return;
    setBusy(true);
    const res = await exportCertificate({ credentialName: open.name, awardType: open.type, earnedAt: open.awardedAt });
    setBusy(false);
    if (res.ok) return;
    setMessage(
      res.reason === 'needs_build'
        ? 'Certificate download needs the next app build.'
        : res.reason === 'no_share_target'
          ? 'No app on this device can open a PDF.'
          : 'Could not prepare the certificate. Try again.',
    );
  }, [open]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back" style={styles.backBtn}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.flex} />
          <Text style={[styles.counter, { color: accent }]}>{rows ? `${rows.length} EARNED` : '—'}</Text>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {/* The leading "waiting slot" — always first. */}
        <WaitingSlot kind={kind} noun={noun} accent={accent} result={nearest} navigation={navigation} />

        {/* Earned credentials — newest first. Image only appears here. */}
        {(rows ?? []).map((c) => {
          const art = credentialArtFor(c.slug);
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
                  <Image source={art} style={styles.artImg} resizeMode="contain" accessibilityIgnoresInvertColors />
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
      </ScrollView>

      <TrophyModal
        visible={!!open}
        iconUrl={null}
        name={open?.name}
        color={accent}
        meta={open ? fmtEarned(open.awardedAt) : null}
        action={{ label: 'DOWNLOAD CERTIFICATE', onPress: download, busy }}
        onClose={() => setOpen(null)}
      >
        {open && credentialArtFor(open.slug) ? (
          <Image source={credentialArtFor(open.slug)!} style={styles.artImg} resizeMode="contain" accessibilityIgnoresInvertColors />
        ) : (
          <View style={styles.modalBadge}>
            <CredentialBadge kind={kind} size={180} />
          </View>
        )}
      </TrophyModal>
    </View>
  );
}

function WaitingSlot({
  kind,
  noun,
  accent,
  result,
  navigation,
}: {
  kind: CredentialKind;
  noun: string;
  accent: string;
  result: NearestCredentialResult | null;
  navigation: any;
}) {
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
            {result.completeCount} of {result.totalCount} topics complete
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
  modalBadge: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
