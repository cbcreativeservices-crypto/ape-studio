/**
 * SHARE MY PUBLIC PAGE — for a verified employer or instructor (must-do H5,
 * owner GO 2026-10-29).
 *
 * Drawn by EmployerSection only when verified. The link is the website's
 * /e/<public_token> page (web/app/e/[token]). The token comes from
 * `my_employer_public_token()`, written for Comp A to create; until it is live
 * the call fails and this row draws NOTHING — never a link that would not
 * open. A null (not verified, revoked) also draws nothing.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { myEmployerPublicToken } from '../../features/employer/api';
import { employerPageUrl } from '../../features/employer/publicPage';
import type { VerifierKind } from '../../features/employer/verifierKind';
import { useLatchedPress } from '../../lib/latch';
import { notify } from '../../lib/confirm';
import { colors, fonts } from '../../theme/tokens';

export function PublicPageRow({ kind }: { kind: VerifierKind }) {
  const [url, setUrl] = useState<string | null>(null);

  // Newest read wins, and nothing lands after unmount (pattern P11).
  const ticket = useRef(0);
  useEffect(() => () => void ++ticket.current, []);
  const load = useCallback(async () => {
    const mine = ++ticket.current;
    const token = await myEmployerPublicToken();
    if (mine === ticket.current) setUrl(employerPageUrl(token));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const onShare = useLatchedPress(async () => {
    if (!url) return;
    try {
      await Share.share({
        message:
          kind === 'instructor'
            ? `My verified instructor page on Pro Audio Training Academy: ${url}`
            : `Our verified employer page on Pro Audio Training Academy: ${url}`,
      });
    } catch {
      notify('Couldn’t open sharing', `Copy this address instead: ${url}`);
    }
  });

  if (!url) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.head}>YOUR PUBLIC PAGE</Text>
      <Text style={styles.body}>
        {kind === 'instructor'
          ? 'A page on our website that shows your name, website and that you are a verified instructor. Anyone with the link can open it.'
          : 'A page on our website that shows your organization, website and that you are a verified employer. Anyone with the link can open it.'}
      </Text>
      <Text selectable style={styles.url} numberOfLines={2}>
        {url}
      </Text>
      <Pressable onPress={onShare} style={styles.link} accessibilityRole="button" accessibilityLabel="Share my public page">
        <Text style={styles.linkText}>SHARE MY PUBLIC PAGE ›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, marginTop: 4, borderTopWidth: 1, borderTopColor: colors.hairlineDim, paddingTop: 10 },
  head: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.3, color: colors.textSub },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  url: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.textSub },
  link: { paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  linkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
});
