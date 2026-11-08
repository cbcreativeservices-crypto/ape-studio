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
import { memo, useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Keyboard, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { notify } from '../../lib/confirm';
import { employerPageUrl } from '../../features/employer/publicPage';
import { colors, fonts } from '../../theme/tokens';
import { DirectoryChipRow, RecentGraduates } from './DirectoryChips';
import { KindPlate, type PlateKey } from './KindPlate';
import { searchByChip, type ChipOutcome, type GraduateCard } from '../../features/directory/kindsApi';
import {
  badgeLabel,
  chipEmpty,
  chipNoun,
  memberCardA11y,
  scanNote,
  type DirectoryChip,
  type MemberBadge,
  type VerifiedOrg,
} from '../../features/directory/kinds';
import { sampleState } from '../../features/forum/sampleSwitch';
import { cardColumn } from '../../theme/readingColumn';
import { Banner, Chip, ChipWrap, EmptyState, Eyebrow, Helper, Loading, PrimaryButton, RetryOrSignIn, SelfReportedNote } from './directoryBits';
import { ChannelBadge } from './ChannelBadge';
// The country filter has to normalise a typed code exactly the way the profile
// editor normalises a stored one, or the filter searches for something no
// profile can hold — so both ends use the editor's single normaliser.
import { COUNTRY_CODE_LENGTH, toCountryCode } from './MyProfileView';
import {
  fetchTaxonomy,
  prefetchPublicProfile,
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

/**
 * One result card. Module-level + memoized (perf hunt 2026-10-03): the cards
 * were inline in ExploreView, so EVERY keystroke in the search box — which
 * updates `q` straight away, ahead of the 350 ms debounce — re-rendered every
 * card on screen (30 per page, more after "Show more"). Markup is unchanged.
 *
 * Press-IN starts the member's profile read (prefetchPublicProfile), so the
 * sheet that opens on release usually has its answer already in flight — or
 * landed — instead of starting the round trip after the finger lifts.
 */
const MemberCard = memo(function MemberCard({
  r,
  onOpen,
  badge,
}: {
  r: DirectoryCard;
  onOpen: (token: string, name?: string) => void;
  badge: MemberBadge | null;
}) {
  // One meta line, as in the mockup: what they do (specialties), then how
  // they are involved (roles).
  const meta = [...r.specialties.slice(0, 4), ...r.roles].join(' · ');
  const where = [r.countryCode, workPrefShort(r.workPref)].filter(Boolean).join(' · ');
  const plate = badgeLabel(badge);
  const latest = (r as Partial<GraduateCard>).latestCredential ?? null;
  return (
    <Pressable
      onPressIn={() => prefetchPublicProfile(r.publicToken)}
      onPress={() => onOpen(r.publicToken, r.displayName)}
      style={({ pressed }) => [st.card, pressed && st.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={memberCardA11y({
        displayName: r.displayName,
        plate,
        primaryArea: r.primaryArea,
        roles: r.roles,
        credentialCount: r.credentialCount,
        contactEnabled: r.contactEnabled,
      })}
      accessibilityHint="Opens their profile"
    >
      {/* The channel badge: green LED = accepts contact requests, dark = does
          not (Explore's one LED fact — see ChannelBadge). */}
      <ChannelBadge name={r.displayName} led={r.contactEnabled ? 'green' : 'off'} steel={!!badge?.verifiedKind} />
      <View style={st.cardBody}>
        <View style={st.nameRow}>
          <Text style={st.cardName}>{r.displayName}</Text>
          {plate ? <KindPlate tone={(badge?.verifiedKind ?? 'graduate') as PlateKey} label={plate} /> : null}
        </View>
        {r.primaryArea ? <Text style={st.cardArea}>{r.primaryArea}</Text> : null}
        {latest ? <Text style={st.cardMeta}>{latest}</Text> : null}
        {meta ? (
          <Text style={st.cardMeta} numberOfLines={2}>
            {meta}
          </Text>
        ) : null}
        {r.credentialCount > 0 || where ? (
          <View style={st.cardFoot}>
            {r.credentialCount > 0 ? (
              <View style={st.credPill}>
                <Text style={st.credText}>{`✓ ${r.credentialCount} VERIFIED`}</Text>
              </View>
            ) : null}
            {where ? <Text style={st.where}>{where}</Text> : null}
          </View>
        ) : null}
      </View>
      <Text style={st.chev}>›</Text>
    </Pressable>
  );
});

/**
 * A verified organization with no community profile (directory_verified,
 * SERVER_GAPS row 14). It has no Directory profile to open, so the card opens
 * its public page on the website.
 */
const OrgCard = memo(function OrgCard({ org }: { org: VerifiedOrg }) {
  const url = employerPageUrl(org.pageToken);
  const plate = org.kind.toUpperCase();
  return (
    <Pressable
      onPress={() => {
        if (!url) return;
        void Linking.openURL(url).catch(() => notify('Couldn’t open the page', `Open this address in your browser: ${url}`));
      }}
      disabled={!url}
      style={({ pressed }) => [st.card, pressed && st.cardPressed]}
      accessibilityRole="link"
      accessibilityLabel={`${org.name}. ${plate}. Verified, no community profile`}
      accessibilityHint="Opens their page on the website"
    >
      <ChannelBadge name={org.name} led="off" steel />
      <View style={st.cardBody}>
        <View style={st.nameRow}>
          <Text style={st.cardName}>{org.name}</Text>
          <KindPlate tone={org.kind as PlateKey} label={plate} />
        </View>
        <Text style={st.cardMeta}>Verified. No community profile yet: opens their page on the website.</Text>
      </View>
      <Text style={st.chev}>›</Text>
    </Pressable>
  );
});

/** "6 graduates", "1 employer": what the chip is listing. */
function countLine(chip: DirectoryChip, n: number): string {
  return `${n} ${chipNoun(chip, n)}`;
}

/** The card's "where" words: country code and how they like to work. */
function workPrefShort(w: WorkPref | null): string | null {
  return w === 'remote' ? 'Remote' : w === 'local' ? 'Local' : w === 'either' ? 'Remote or local' : null;
}

/**
 * The filter chips. Module-level + memoized for the same reason as MemberCard
 * (perf hunt 2026-10-03): with FILTERS open, each keystroke in the search box
 * re-rendered every chip — up to 200 specialties once an area is picked. Its
 * props only change when the filters or the taxonomy do. `setF` is React's
 * stable setter, and every write is a functional update so none reads a stale
 * `f` (the country box and the work chips used to spread the render's `f`).
 */
const FilterPanel = memo(function FilterPanel({
  tax,
  f,
  setF,
}: {
  tax: Taxonomy;
  f: DirectoryFilters;
  setF: Dispatch<SetStateAction<DirectoryFilters>>;
}) {
  const toggle = (key: 'areas' | 'specialties' | 'roles' | 'openTo', slug: string) =>
    setF((prev) => {
      const cur = prev[key] ?? [];
      const next = cur.includes(slug) ? cur.filter((x) => x !== slug) : [...cur, slug];
      return { ...prev, [key]: next.length ? next : undefined };
    });

  const specialtyPool = useMemo(
    () =>
      tax.specialties.filter(
        (s) => !f.areas?.length || s.areas.some((a) => f.areas?.includes(a)),
      ),
    [tax, f.areas],
  );

  return (
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
        onChangeText={(t) => setF((prev) => ({ ...prev, country: toCountryCode(t) || undefined }))}
        placeholder="Country code, e.g. US"
        placeholderTextColor={P.muted}
        autoCapitalize="characters"
        maxLength={COUNTRY_CODE_LENGTH}
        accessibilityLabel="Filter by country code"
      />
      <ChipWrap>
        {WORK_PREFS.map((w) => (
          <Chip
            key={w.key}
            label={w.label}
            on={f.workPref === w.key}
            onPress={() => setF((prev) => ({ ...prev, workPref: prev.workPref === w.key ? undefined : w.key }))}
          />
        ))}
      </ChipWrap>
    </View>
  );
});

export function ExploreView({
  onOpenMember,
  hiddenTokens,
  active = true,
}: {
  onOpenMember: (token: string, name?: string) => void;
  /** False while another Directory tab is showing (perf hunt 2026-10-03). The
   *  host keeps Explore MOUNTED across tab switches so the list, the search
   *  text and the filters are still there on return; coming back re-runs the
   *  current search in the background (the list stays up meanwhile), so a
   *  member blocked from Requests still drops out of it. */
  active?: boolean;
  /** Tokens blocked in THIS session. The server drops them from the next
   *  search, but the results already on screen were fetched before the block —
   *  without this a just-blocked member stayed listed and re-openable until the
   *  user searched again ([77], app-nav audit 2026-09-07). */
  hiddenTokens?: readonly string[];
}) {
  const [tax, setTax] = useState<Taxonomy | null>(null);
  const [f, setF] = useState<DirectoryFilters>({});
  const [chip, setChip] = useState<DirectoryChip>(sampleState()?.chip ?? 'all');
  const chipRef = useRef(chip);
  chipRef.current = chip;
  const [badges, setBadges] = useState<ReadonlyMap<string, MemberBadge>>(new Map());
  /** A kind chip stopped before the end of the members: say so. */
  const [scanned, setScanned] = useState<{ read: number; of: number } | null>(null);
  /** Verified organizations with no community profile, under their kind chip. */
  const [orgs, setOrgs] = useState<VerifiedOrg[]>([]);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<DirectoryCard[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(true);
  /** Which page has been loaded. The header shows the SERVER's total, so
   *  without a way to reach page 2 the screen said "212 members" over a list of
   *  thirty and the other 182 were unreachable by any interaction
   *  (overnight hunt 2026-09-23). */
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  /** The server handed back an empty page — see loadMore. */
  const [ended, setEnded] = useState(false);
  /**
   * A failed "Show more", kept apart from `err` (bug hunt 2026-09-30, pass 2).
   * It went into `err`, and `err` renders INSTEAD of the list — so the thirty
   * results on screen vanished to report that a thirty-first could not load,
   * the very trade loadMore's own note refuses, and RETRY restarted at page 1.
   */
  const [moreErr, setMoreErr] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // fetchTaxonomy resolves NULL on failure and caches only successes, so this
  // re-runs with the search: a filter panel with every chip row silently blank
  // looked like "there is nothing to filter by" rather than a dropped request
  // (network audit 2026-09-11).
  const [taxErr, setTaxErr] = useState(false);
  const loadTax = useCallback(async () => {
    const t = await fetchTaxonomy();
    setTax(t);
    setTaxErr(t == null);
  }, []);

  useEffect(() => {
    void loadTax();
  }, [loadTax]);

  /**
   * Which search is current (bug hunt 2026-09-29). Filters change faster than
   * searches return, and the answers can arrive in any order: an older, slower
   * search landed last and replaced the list with results for filters no
   * longer selected, and the FIRST search to finish cleared the spinner while
   * the current one was still out. Only the latest request may touch either.
   */
  const reqId = useRef(0);
  const run = useCallback(async (filters: DirectoryFilters) => {
    const id = ++reqId.current;
    setBusy(true);
    setPage(0);
    setMoreErr(null);
    // A "Show more" still out for the OLD list must not leave the new one's
    // button reading "Loading…" and dead until it lands (night pass 2).
    setLoadingMore(false);
    setEnded(false);
    // try/finally, not a bare sequence: the spinner must be cleared by the
    // language, not by reaching the next statement. searchDirectory is bounded
    // now and returns its errors rather than throwing, but a future throw
    // between these lines would leave the view spinning for good.
    let out: ChipOutcome;
    try {
      out = await searchByChip(chipRef.current, filters);
    } finally {
      if (id === reqId.current) setBusy(false);
    }
    if (id !== reqId.current) return; // superseded by a newer search
    if (out.status === 'error') {
      setErr(out.error);
      setRows([]);
      setTotal(0);
      setScanned(null);
      setOrgs([]);
      return;
    }
    setErr(null);
    setRows(out.results);
    setTotal(out.total);
    setBadges(out.badges);
    setScanned(out.scanned);
    setOrgs(out.orgs);
  }, []);

  /** Fetch the next page and APPEND. A failure here leaves what is already
   *  listed alone — losing thirty results the reader is looking at, to report
   *  that a thirty-first could not be fetched, is the wrong trade. */
  const loadMore = useCallback(async () => {
    const next = page + 1;
    const id = reqId.current;
    setLoadingMore(true);
    let out: ChipOutcome;
    try {
      out = await searchByChip(chipRef.current, f, next);
    } finally {
      if (id === reqId.current) setLoadingMore(false);
    }
    // The filters changed while this page was out — it belongs to a list
    // that is no longer on screen.
    if (id !== reqId.current) return;
    if (out.status === 'error') {
      setMoreErr(out.error);
      return;
    }
    setMoreErr(null);
    setPage(next);
    // An empty page is the end of the list, whatever `total` says (night pass
    // 2). The de-duplication below means `rows` can fall short of `total` for
    // good — a member published between pages lands on a page already read —
    // and `hasMore` alone then kept a "Show more members" button that fetched
    // an empty page on every tap, forever.
    if (out.results.length === 0) setEnded(true);
    // De-duplicate by token: a member published between the two requests shifts
    // the window, and React would otherwise throw on the duplicate key.
    setRows((prev) => {
      const seen = new Set(prev.map((r) => r.publicToken));
      return [...prev, ...out.results.filter((r) => !seen.has(r.publicToken))];
    });
    setBadges((prev) => new Map([...prev, ...out.badges]));
    setTotal(out.total);
  }, [f, page]);

  useEffect(() => {
    void run(f);
  }, [f, chip, run]);

  // "Also in the Directory" under the Graduates list: the verified accounts
  // among the first members read. Optional: a failed read shows nothing.
  const [also, setAlso] = useState<DirectoryCard[]>([]);
  useEffect(() => {
    if (chip !== 'graduates') {
      setAlso([]);
      return undefined;
    }
    let alive = true;
    void searchByChip('all', {}).then((r) => {
      if (!alive || r.status === 'error') return;
      setBadges((prev) => new Map([...prev, ...r.badges]));
      setAlso(r.results.filter((m) => !!r.badges.get(m.publicToken)?.verifiedKind).slice(0, 3));
    });
    return () => {
      alive = false;
    };
  }, [chip]);

  // Back on this tab (see `active`): refresh the current search behind the
  // list already on screen. Not on mount — the effect above has just run it.
  const fRef = useRef(f);
  fRef.current = f;
  const wasActive = useRef(active);
  useEffect(() => {
    if (active && !wasActive.current) void run(fRef.current);
    // Hidden now, not unmounted: a search box that still holds focus would
    // keep the keyboard up over the next tab (unmounting used to drop it).
    if (!active && wasActive.current) Keyboard.dismiss();
    wasActive.current = active;
  }, [active, run]);

  // Debounce the text box so a search does not fire per keystroke.
  useEffect(() => {
    // Same text ⇒ same filters object (bug hunt 2026-09-30, pass 2). This ran
    // on mount with q '' and handed back a NEW object, so every visit to
    // Explore searched twice: the list loaded, then flipped back to the
    // spinner 350 ms later for an identical search. CLEAR ALL did the same.
    const t = setTimeout(() => setF((prev) => ((prev.q ?? '') === q ? prev : { ...prev, q })), 350);
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

  // [77]: hide anyone blocked since this result set was fetched, and keep the
  // "N members" tally honest about what is actually listed.
  const visibleRows = useMemo(
    () => (hiddenTokens?.length ? rows.filter((r) => !hiddenTokens.includes(r.publicToken)) : rows),
    [rows, hiddenTokens],
  );
  /** ALSO IN THE DIRECTORY: never someone blocked this visit, never someone
   *  the list above already shows. */
  const alsoVisible = useMemo(
    () =>
      also.filter(
        (r) => !(hiddenTokens ?? []).includes(r.publicToken) && !visibleRows.some((v) => v.publicToken === r.publicToken),
      ),
    [also, hiddenTokens, visibleRows],
  );
  // At the end of the list the count IS what is listed — `total` can sit above
  // it after a shifted window (see loadMore).
  const visibleTotal = ended ? visibleRows.length : Math.max(0, total - (rows.length - visibleRows.length));
  const hasMore = !ended && rows.length < total;

  return (
    <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled">
      {/* Search box and FILTERS on one row (owner-approved mockup 2026-11-01). */}
      <View style={st.searchRow}>
        <TextInput
          style={st.searchBox}
          value={q}
          onChangeText={setQ}
          placeholder="Search by name or specialty"
          placeholderTextColor={P.muted}
          autoCorrect={false}
          accessibilityLabel="Search the directory by name or specialty"
        />
        <Pressable
          onPress={() => setShowFilters((v) => !v)}
          style={({ pressed }) => [st.filterBtn, (showFilters || activeCount > 0) && st.filterBtnOn, pressed && st.pressed]}
          accessibilityRole="button"
          accessibilityState={{ expanded: showFilters }}
          aria-expanded={showFilters}
          accessibilityLabel={`Filters${activeCount ? `, ${activeCount} active` : ''}`}
        >
          <Text style={st.filterBtnText}>
            FILTERS{activeCount ? ` · ${activeCount}` : ''} {showFilters ? '▾' : '▸'}
          </Text>
        </Pressable>
      </View>

      {sampleState() ? <Text style={st.sample}>SAMPLE DATA · NOTHING HERE IS REAL</Text> : null}
      <DirectoryChipRow chip={chip} onChange={setChip} />

      {(chip === 'all' || chip === 'graduates') && !activeCount && !q ? (
        <RecentGraduates
          onOpen={onOpenMember}
          onSeeAll={chip === 'all' ? () => setChip('graduates') : undefined}
          hiddenTokens={hiddenTokens}
        />
      ) : null}

      {activeCount || q ? (
        <View style={st.clearRow}>
          <Pressable
            onPress={() => {
              setQ('');
              setF({});
            }}
            hitSlop={6}
            style={st.clearBtn}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
          >
            <Text style={st.clearText}>CLEAR ALL</Text>
          </Pressable>
        </View>
      ) : null}

      {showFilters && taxErr ? (
        <View>
          <Banner tone="warn">Couldn’t load the filter options — check your connection.</Banner>
          <PrimaryButton label="RETRY" onPress={() => void loadTax()} />
        </View>
      ) : null}

      {showFilters && tax ? (
        <View style={st.panel}>
          <FilterPanel tax={tax} f={f} setF={setF} />
        </View>
      ) : null}

      {/* A failed search needs a way BACK, not just a notice: the only other way
          to re-run one was to change a filter (network audit 2026-09-11). */}
      {err ? (
        <>
          <Banner tone="warn">{err}</Banner>
          {/* A guest gets SIGN IN, not a RETRY that can never work (#26). */}
          <RetryOrSignIn message={err} onRetry={() => void run(f)} />
        </>
      ) : null}

      {/* KEEP THE LIST UP WHILE A NEW SEARCH IS OUT (perf hunt 2026-10-03).
          Every pause in typing, every chip tap and every return to this tab
          swapped the whole list for a spinner until the new answer landed —
          the screen blinked empty on each refinement. Now the spinner is only
          for "nothing to show yet"; otherwise the last results stay on screen
          and the count line says a search is running. A failed search still
          clears the rows (run()), so an error never sits over stale results. */}
      {busy && visibleRows.length === 0 ? (
        <Loading label="Searching the directory…" />
      ) : !busy && err ? null : !busy && visibleRows.length === 0 && orgs.length === 0 ? (
        <EmptyState
          title={chip === 'all' ? 'No members match yet' : chipEmpty(chip).title}
          lines={[
            'The directory is new, so it is still filling up.',
            activeCount ? 'Try removing a filter or choosing a broader area.' : 'Check back soon.',
          ]}
        />
      ) : (
        <>
          <Text style={st.count} accessibilityRole="header">
            {busy
              ? 'Searching the directory…'
              : hasMore
                ? `Showing ${visibleRows.length} of ${visibleTotal} ${chipNoun(chip, visibleTotal)}`
                : countLine(chip, visibleTotal + orgs.length)}
          </Text>
          {visibleRows.map((r) => (
            <MemberCard key={r.publicToken} r={r} badge={badges.get(r.publicToken) ?? null} onOpen={onOpenMember} />
          ))}
          {orgs.map((o) => (
            <OrgCard key={`org-${o.pageToken}`} org={o} />
          ))}
          {scanned ? <Text style={st.scanned}>{scanNote(scanned.read, scanned.of)}</Text> : null}
          {alsoVisible.length > 0 ? <Text style={st.alsoHead}>ALSO IN THE DIRECTORY</Text> : null}
          {alsoVisible.map((r) => (
            <MemberCard key={`also-${r.publicToken}`} r={r} badge={badges.get(r.publicToken) ?? null} onOpen={onOpenMember} />
          ))}
          {/* Not while a new search is out: run() has already reset `page` for
              the NEW filters, so a page fetched now would be appended to the
              old list. */}
          {hasMore && !busy ? (
            <View style={st.moreWrap}>
              {moreErr ? <Banner tone="warn">{moreErr}</Banner> : null}
              <PrimaryButton
                label={loadingMore ? 'Loading…' : 'Show more members'}
                onPress={() => void loadMore()}
                disabled={loadingMore}
              />
            </View>
          ) : null}
          <SelfReportedNote />
        </>
      )}
    </ScrollView>
  );
}

/** The approved mockup's palette (Downloads/2026-11-01_COMMUNITY_CHAT_REDESIGN_MOCKUP.html). */
const P = {
  panel: '#121318',
  raised: '#181a21',
  line: '#24262e',
  line2: '#2e313b',
  text: '#f0f0f0',
  sub: '#a6a6ad',
  muted: '#7f818a',
} as const;

const st = StyleSheet.create({
  // Tablet (owner 2026-09-29): card column, centred. No-op on a phone.
  body: { paddingHorizontal: 18, paddingTop: 0, paddingBottom: 40, ...cardColumn },
  moreWrap: { marginTop: 4 },
  pressed: { opacity: 0.8 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchBox: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    backgroundColor: P.panel,
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    color: P.text,
  },
  filterBtn: {
    minHeight: 44,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.panel,
  },
  filterBtnOn: { borderColor: 'rgba(255,198,77,.5)' },
  filterBtnText: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
  clearRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: -4, marginBottom: 8 },
  clearBtn: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 4 },
  clearText: { fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.2, color: P.sub },
  // The open filter panel sits in its own quiet panel above the results.
  panel: {
    backgroundColor: P.panel,
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingBottom: 12,
    marginBottom: 14,
  },
  // The country code box inside the filter panel.
  input: {
    backgroundColor: P.raised,
    borderWidth: 1,
    borderColor: P.line2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    color: P.text,
    marginTop: 2,
    marginBottom: 4,
  },
  // A result count (allowed), in the mockup's mono.
  count: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: P.muted,
    marginTop: 2,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    backgroundColor: P.panel,
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  cardPressed: { backgroundColor: P.raised },
  cardBody: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  sample: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: '#5bb0ff', textAlign: 'center', paddingVertical: 4, marginBottom: 10 },
  scanned: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: P.muted, marginTop: 10 },
  alsoHead: { fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.84, color: P.muted, marginTop: 16, marginBottom: 8 },
  cardName: { fontFamily: fonts.oswaldSemiBold, fontSize: 16.5, letterSpacing: 0.3, color: P.text },
  cardArea: { fontFamily: fonts.barlowSemiBold, fontSize: 13, color: colors.amber, marginTop: 2 },
  cardMeta: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17.5, color: P.sub, marginTop: 5 },
  cardFoot: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10, rowGap: 6, marginTop: 9 },
  credPill: {
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.35)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  credText: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 0.6, color: colors.green },
  where: { fontFamily: fonts.barlowRegular, fontSize: 12, color: P.muted },
  chev: { fontFamily: fonts.barlowRegular, fontSize: 18, color: P.muted, alignSelf: 'center', paddingLeft: 2 },
});
