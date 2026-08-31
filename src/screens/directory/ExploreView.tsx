/**
 * EXPLORE — search and browse opted-in profiles (spec §10).
 *
 * Only members who published AND switched on discoverability appear here, and
 * only signed-in, email-verified members can look. Blocks apply in both
 * directions, so neither party sees the other.
 *
 * The filters cover professional facts only — area, specialty, role, what
 * someone is open to, country, remote/local. §7 forbids the rest, and the free
 * text box deliberately searches display names and SPECIALTY LABELS rather than
 * the About paragraph: free-text search over a personal description is exactly
 * how you fish for the characteristics that are not allowed to be filters.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { Banner, Chip, ChipWrap, EmptyState, Eyebrow, Helper, Loading, SelfReportedNote } from './directoryBits';
import {
  fetchTaxonomy,
  searchDirectory,
  type DirectoryCard,
  type DirectoryFilters,
  type Taxonomy,
  type WorkPref,
} from '../../features/directory/api';

const WORK_PREFS: { key: WorkPref; label: string }[] = [
  { key: 'remote', label: 'Remote' },
  { key: 'local', label: 'Local / in person' },
  { key: 'either', label: 'Either' },
];

export function ExploreView({ onOpenMember }: { onOpenMember: (token: string) => void }) {
  const [tax, setTax] = useState<Taxonomy | null>(null);
  const [f, setF] = useState<DirectoryFilters>({});
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<DirectoryCard[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    void fetchTaxonomy().then(setTax);
  }, []);

  const run = useCallback(async (filters: DirectoryFilters) => {
    setBusy(true);
    const out = await searchDirectory(filters);
    setBusy(false);
    if (out.status === 'error') {
      setErr(out.error);
      setRows([]);
      setTotal(0);
      return;
    }
    setErr(null);
    setRows(out.results);
    setTotal(out.total);
  }, []);

  useEffect(() => {
    void run(f);
  }, [f, run]);

  // Debounce the text box so a search does not fire per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setF((prev) => ({ ...prev, q })), 350);
    return () => clearTimeout(t);
  }, [q]);

  const activeCount = useMemo(
    () =>
      (f.areas?.length ?? 0) +
      (f.specialties?.length ?? 0) +
      (f.roles?.length ?? 0) +
      (f.openTo?.length ?? 0) +
      (f.country ? 1 : 0) +
      (f.workPref ? 1 : 0),
    [f],
  );

  const toggle = (key: 'areas' | 'specialties' | 'roles' | 'openTo', slug: string) =>
    setF((prev) => {
      const cur = prev[key] ?? [];
      const next = cur.includes(slug) ? cur.filter((x) => x !== slug) : [...cur, slug];
      return { ...prev, [key]: next.length ? next : undefined };
    });

  const specialtyPool = useMemo(
    () =>
      (tax?.specialties ?? []).filter(
        (s) => !f.areas?.length || s.areas.some((a) => f.areas?.includes(a)),
      ),
    [tax, f.areas],
  );

  return (
    <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled">
      <Text style={st.lede}>
        Find people working, studying, researching, teaching and creating across audio, acoustics and
        sound science.
      </Text>

      <TextInput
        style={st.input}
        value={q}
        onChangeText={setQ}
        placeholder="Search by name or specialty"
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        accessibilityLabel="Search the directory by name or specialty"
      />

      <View style={st.toolbar}>
        <Pressable
          onPress={() => setShowFilters((v) => !v)}
          style={st.filterBtn}
          accessibilityRole="button"
          accessibilityState={{ expanded: showFilters }}
          accessibilityLabel={`Filters${activeCount ? `, ${activeCount} active` : ''}`}
        >
          <Text style={st.filterBtnText}>
            FILTERS{activeCount ? ` · ${activeCount}` : ''} {showFilters ? '▾' : '▸'}
          </Text>
        </Pressable>
        {activeCount || q ? (
          <Pressable
            onPress={() => {
              setQ('');
              setF({});
            }}
            style={st.filterBtn}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
          >
            <Text style={st.filterBtnText}>CLEAR ALL</Text>
          </Pressable>
        ) : null}
      </View>

      {showFilters && tax ? (
        <View>
          <Eyebrow>AREA</Eyebrow>
          <ChipWrap>
            {tax.areas.map((a) => (
              <Chip key={a.slug} label={a.label} on={f.areas?.includes(a.slug)} onPress={() => toggle('areas', a.slug)} />
            ))}
          </ChipWrap>

          <Eyebrow>SPECIALTY</Eyebrow>
          {f.areas?.length ? null : <Helper>Pick an area to narrow this list.</Helper>}
          <ChipWrap>
            {specialtyPool.slice(0, f.areas?.length ? 200 : 24).map((s) => (
              <Chip
                key={s.slug}
                label={s.label}
                on={f.specialties?.includes(s.slug)}
                onPress={() => toggle('specialties', s.slug)}
              />
            ))}
          </ChipWrap>

          <Eyebrow>HOW THEY’RE INVOLVED</Eyebrow>
          <ChipWrap>
            {tax.roles.map((r) => (
              <Chip key={r.slug} label={r.label} on={f.roles?.includes(r.slug)} onPress={() => toggle('roles', r.slug)} />
            ))}
          </ChipWrap>

          <Eyebrow>OPEN TO</Eyebrow>
          <ChipWrap>
            {tax.openTo.map((o) => (
              <Chip key={o.slug} label={o.label} on={f.openTo?.includes(o.slug)} onPress={() => toggle('openTo', o.slug)} />
            ))}
          </ChipWrap>

          <Eyebrow>WHERE</Eyebrow>
          <TextInput
            style={st.input}
            value={f.country ?? ''}
            onChangeText={(t) => setF({ ...f, country: t.toUpperCase().slice(0, 2) || undefined })}
            placeholder="Country code, e.g. US"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            maxLength={2}
            accessibilityLabel="Filter by country code"
          />
          <ChipWrap>
            {WORK_PREFS.map((w) => (
              <Chip
                key={w.key}
                label={w.label}
                on={f.workPref === w.key}
                onPress={() => setF({ ...f, workPref: f.workPref === w.key ? undefined : w.key })}
              />
            ))}
          </ChipWrap>
        </View>
      ) : null}

      {err ? <Banner tone="warn">{err}</Banner> : null}

      {busy ? (
        <Loading label="Searching the directory…" />
      ) : rows.length === 0 && !err ? (
        <EmptyState
          title="No members match yet"
          lines={[
            'The directory is new, so it is still filling up.',
            activeCount ? 'Try removing a filter or choosing a broader area.' : 'Check back soon.',
          ]}
        />
      ) : (
        <>
          <Text style={st.count} accessibilityRole="header">
            {total} {total === 1 ? 'member' : 'members'}
          </Text>
          {rows.map((r) => (
            <Pressable
              key={r.publicToken}
              onPress={() => onOpenMember(r.publicToken)}
              style={({ pressed }) => [st.card, pressed && st.cardPressed]}
              accessibilityRole="button"
              accessibilityLabel={[
                r.displayName,
                r.primaryArea,
                r.roles.join(', '),
                r.credentialCount ? `${r.credentialCount} verified credentials` : null,
                r.contactEnabled ? 'open to contact' : null,
              ]
                .filter(Boolean)
                .join('. ')}
              accessibilityHint="Opens their profile"
            >
              <View style={{ flex: 1 }}>
                <Text style={st.cardName}>{r.displayName}</Text>
                {r.primaryArea ? <Text style={st.cardArea}>{r.primaryArea}</Text> : null}
                {r.specialties.length ? (
                  <Text style={st.cardSpecs} numberOfLines={2}>
                    {r.specialties.slice(0, 4).join(' · ')}
                  </Text>
                ) : null}
                <Text style={st.cardMeta}>
                  {[
                    r.roles.join(' · ') || null,
                    r.countryCode,
                    r.workPref === 'remote' ? 'Remote' : r.workPref === 'local' ? 'Local' : null,
                    r.credentialCount ? `${r.credentialCount} verified` : null,
                  ]
                    .filter(Boolean)
                    .join('  ·  ')}
                </Text>
              </View>
              <Text style={st.chev}>›</Text>
            </Pressable>
          ))}
          <SelfReportedNote />
        </>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  body: { padding: 14, paddingBottom: 40 },
  lede: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSub },
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
  },
  toolbar: { flexDirection: 'row', gap: 8, marginTop: 10 },
  filterBtn: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    backgroundColor: '#141414',
  },
  filterBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.3, color: colors.amber },
  count: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: colors.textMutedDeep,
    marginTop: 16,
    marginBottom: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    minHeight: 72,
  },
  cardPressed: { backgroundColor: '#1f1f1f' },
  cardName: { fontFamily: fonts.oswaldSemiBold, fontSize: 16.5, color: colors.textPrimary },
  cardArea: { fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.4, color: colors.amber, marginTop: 3 },
  cardSpecs: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, marginTop: 5 },
  cardMeta: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: colors.textMutedDeep, marginTop: 5 },
  chev: { fontFamily: fonts.oswaldMedium, fontSize: 20, color: colors.textMutedDeep, paddingLeft: 8 },
});
