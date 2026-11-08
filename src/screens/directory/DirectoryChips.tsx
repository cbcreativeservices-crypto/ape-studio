/**
 * The Directory's chips and the Recent graduates strip (approved mockup,
 * screen 2).
 */
import { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts } from '../../theme/tokens';
import { fetchGraduates, type GraduateCard } from '../../features/directory/kindsApi';
import { DIRECTORY_CHIPS, stripName, type DirectoryChip } from '../../features/directory/kinds';
import { ChannelBadge } from './ChannelBadge';
import { needsSignIn } from './directoryBits';
import { useGuestWording } from '../../features/commercial/useTier';

const P = {
  panel: '#121318',
  line2: '#2e313b',
  text: '#f0f0f0',
  sub: '#a6a6ad',
  muted: '#7f818a',
  amber: '#ffc64d',
} as const;

const STRIP_SIZE = 10;

export function DirectoryChipRow({ chip, onChange }: { chip: DirectoryChip; onChange: (c: DirectoryChip) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={st.chips}
      style={st.chipScroll}
      accessibilityRole="tablist"
    >
      {DIRECTORY_CHIPS.map((c) => {
        const on = c.key === chip;
        return (
          <Pressable
            key={c.key}
            onPress={() => onChange(c.key)}
            hitSlop={{ top: 4, bottom: 4 }}
            style={[st.chip, on && st.chipOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            aria-selected={on}
          >
            <Text style={[st.chipText, on && st.chipTextOn]}>{c.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/**
 * Recent graduates: the newest credentials on members who chose to show them.
 * A decoration above the list, so a failed read says so in one line and offers
 * RETRY rather than taking the list with it, and an empty one draws nothing.
 */
export const RecentGraduates = memo(function RecentGraduates({
  onOpen,
  onSeeAll,
  hiddenTokens,
}: {
  onOpen: (token: string, name?: string) => void;
  /** Blocked this visit: gone from the strip at once, as from the list. */
  hiddenTokens?: readonly string[];
  /** Absent when the list below is already the graduates. */
  onSeeAll?: () => void;
}) {
  const [state, setState] = useState<{ face: 'loading' | 'failed' | 'ready'; rows: GraduateCard[]; error?: string }>({
    face: 'loading',
    rows: [],
  });
  // A KNOWN guest only (bug pass 2026-11-08, CODE-1-31): the same rule as
  // RetryOrSignIn, so a guest is never offered a RETRY that cannot work.
  const { guest } = useGuestWording();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, face: 'loading' }));
    void fetchGraduates({}, 0, STRIP_SIZE).then((r) => {
      if (!alive) return;
      setState(r.status === 'ok' ? { face: 'ready', rows: r.results } : { face: 'failed', rows: [], error: r.error });
    });
    return () => {
      alive = false;
    };
  }, [attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (state.face === 'loading') return null;
  // Signed out: the list below already says SIGN IN; the strip adds nothing.
  if (state.face === 'failed' && needsSignIn(guest, state.error)) return null;
  if (state.face === 'failed') {
    return (
      <View style={st.failed}>
        <Text style={st.failedText}>Couldn’t load recent graduates.</Text>
        <Pressable onPress={retry} hitSlop={8} accessibilityRole="button" accessibilityLabel="Retry recent graduates">
          <Text style={st.link}>RETRY</Text>
        </Pressable>
      </View>
    );
  }
  const rows = hiddenTokens?.length ? state.rows.filter((g) => !hiddenTokens.includes(g.publicToken)) : state.rows;
  if (rows.length === 0) return null;
  return (
    <View>
      <View style={st.head}>
        <Text accessibilityRole="header" style={st.headText}>
          RECENT GRADUATES
        </Text>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8} accessibilityRole="button" accessibilityLabel="See all graduates">
            <Text style={st.link}>SEE ALL</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.strip}>
        {rows.map((g) => (
          <Pressable
            key={g.publicToken}
            onPress={() => onOpen(g.publicToken, g.displayName)}
            style={st.tile}
            accessibilityRole="button"
            accessibilityLabel={`${g.displayName}${g.latestCredential ? `, ${g.latestCredential}` : ''}`}
          >
            <ChannelBadge name={g.displayName} led="off" gold size={46} />
            <Text style={st.tileName}>{stripName(g.displayName)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
});

const st = StyleSheet.create({
  chipScroll: { flexGrow: 0, marginBottom: 12 },
  chips: { gap: 6 },
  chip: { borderWidth: 1, borderColor: P.line2, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  chipOn: { backgroundColor: P.amber, borderColor: P.amber },
  chipText: { fontFamily: fonts.barlowRegular, fontSize: 12, color: P.sub },
  chipTextOn: { fontFamily: fonts.barlowSemiBold, color: '#111' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4, marginBottom: 8 },
  headText: { fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.84, color: P.muted },
  link: { fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.1, color: P.amber },
  strip: { gap: 12, paddingBottom: 14, paddingTop: 2 },
  tile: { width: 58, alignItems: 'center', gap: 5 },
  tileName: { fontFamily: fonts.barlowRegular, fontSize: 11, lineHeight: 13, color: P.sub, textAlign: 'center' },
  failed: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  failedText: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: P.muted },
});
