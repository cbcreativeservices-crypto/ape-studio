/**
 * CredentialWall — the earned-only trophy wall shared by the Certificates and
 * Programs categories (parameterized by `kind`). Newest-earned first, 2-column
 * cards. Real credential art (bundled, keyed by slug) when present, else the
 * CredentialBadge disc — the graceful placeholder until the owner supplies art.
 * Tapping a card opens the full-size TrophyModal with the earned date and a
 * "download certificate" action (reuses the awards-screen PDF export).
 *
 * This is the EARNED side; the in-progress checklist + Final Exam gate live on
 * the browse/enroll side (AwardProgressScreen), linked from Profile — not
 * duplicated here.
 */
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { CredentialBadge, type CredentialKind } from '../../components/CredentialBadge';
import { TrophyModal } from '../../components/TrophyModal';
import { credentialArtFor } from '../../features/credentials/credentialArt';
import { exportCertificate } from '../../features/credentials/certificatePdf';
import { fetchEarnedCredentialsByType } from '../../features/achievements/api';
import type { EarnedCredentialRow } from '../../features/credentials/api';

const KIND_ACCENT: Record<CredentialKind, string> = {
  certificate: colors.cyan,
  program: colors.purple,
};

function fmtEarned(iso: string | null): string {
  if (!iso) return 'EARNED';
  const d = new Date(iso);
  return (
    'EARNED ' +
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
  );
}

export function CredentialWall({ kind, title }: { kind: CredentialKind; title: string }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const accent = KIND_ACCENT[kind];
  const [rows, setRows] = useState<EarnedCredentialRow[] | null>(null);
  const [open, setOpen] = useState<EarnedCredentialRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchEarnedCredentialsByType(kind)
        .then(setRows)
        .catch(() => setRows([]));
    }, [kind]),
  );

  const download = useCallback(async () => {
    if (!open) return;
    setBusy(true);
    const res = await exportCertificate({
      credentialName: open.name,
      awardType: open.type,
      earnedAt: open.awardedAt,
    });
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
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backBtn}
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.flex} />
          <Text style={[styles.counter, { color: accent }]}>
            {rows ? `${rows.length} EARNED` : '—'}
          </Text>
        </View>

        {rows && rows.length === 0 && (
          <Text style={styles.empty}>
            Nothing earned here yet. {kind === 'certificate' ? 'Certificates' : 'Programs'} appear the
            moment you finish their required topics — track your progress on your Profile.
          </Text>
        )}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.grid}>
          {(rows ?? []).map((c) => {
            const art = credentialArtFor(c.slug);
            return (
              <Pressable
                key={c.id}
                style={[styles.card, { borderColor: `${accent}66`, shadowColor: accent }]}
                onPress={() => {
                  setMessage(null);
                  setOpen(c);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${c.name}, ${fmtEarned(c.awardedAt).toLowerCase()}`}
              >
                <View style={styles.artBox}>
                  {art ? (
                    <Image source={art} style={styles.art} resizeMode="contain" accessibilityIgnoresInvertColors />
                  ) : (
                    <CredentialBadge kind={kind} size={56} />
                  )}
                </View>
                <Text style={styles.cardName}>{c.name.toUpperCase()}</Text>
                <Text style={styles.cardMeta}>{fmtEarned(c.awardedAt)}</Text>
              </Pressable>
            );
          })}
        </View>
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
          <Image source={credentialArtFor(open.slug)!} style={styles.art} resizeMode="contain" accessibilityIgnoresInvertColors />
        ) : (
          <View style={styles.modalBadge}>
            <CredentialBadge kind={kind} size={180} />
          </View>
        )}
      </TrophyModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: 16, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { alignSelf: 'center' },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 28, lineHeight: 28, color: colors.textSub, marginRight: -2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1.4, color: colors.textPrimary },
  flex: { flex: 1 },
  counter: { fontFamily: fonts.mono, fontSize: 13, textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
  empty: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub, marginTop: 4, lineHeight: 20 },
  message: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.amber },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%',
    backgroundColor: '#181818',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    gap: 10,
    alignItems: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  artBox: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  art: { width: '100%', height: '100%' },
  cardName: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.5, color: colors.textPrimary, textAlign: 'center' },
  cardMeta: { fontFamily: fonts.mono, fontSize: 11, color: '#777777' },
  modalBadge: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
