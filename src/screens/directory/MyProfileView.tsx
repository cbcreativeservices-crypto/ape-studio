/**
 * MY PROFILE — the community-profile editor (spec §6, §8, §9).
 *
 * The four concepts stay visibly separate, because that separation IS the
 * feature: areas are domains, specialties are focus, "How I'm Involved" is a
 * relationship to the work, and "Open To" is consent to be contacted about
 * something specific. The old screen mixed all four in one chip wall.
 *
 * Every limit shown here is mirrored from the database (api.LIMITS). The UI
 * disables a control at the cap so the member sees the boundary before they hit
 * it; the server refuses regardless, which is what actually enforces it.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Modal } from '../../components/DimModal';
import { Section } from '../../components/Section';
import { Toggle } from '../../components/Toggle';
import { colors, fonts } from '../../theme/tokens';
import { fetchMyCredentials, type EarnedCredentialRow } from '../../features/credentials/api';
import {
  Banner,
  Chip,
  ChipWrap,
  CountHint,
  Eyebrow,
  Helper,
  Loading,
  PrimaryButton,
  SelfReportedNote,
} from './directoryBits';
import {
  EMPTY_COMMUNITY_PROFILE,
  LIMITS,
  deleteCommunityProfile,
  fetchMyCommunityProfile,
  fetchTaxonomy,
  publishCommunityProfile,
  saveCommunityProfile,
  setContactEnabled,
  setDiscoverable,
  setFeaturedCredentials,
  type CommunityProfile,
  type Taxonomy,
  type WorkPref,
} from '../../features/directory/api';
import { alreadyMigrated, buildLegacyDraft, markMigrated, type LegacyDraft } from '../../features/directory/legacyMigration';
import { ProfileSetupFlow } from './ProfileSetupFlow';
import { confirmDialog, notify as appNotify } from '../../lib/confirm';
import { cardColumn } from '../../theme/readingColumn';

const WORK_PREFS: { key: WorkPref; label: string }[] = [
  { key: 'remote', label: 'Remote' },
  { key: 'local', label: 'Local / in person' },
  { key: 'either', label: 'Either' },
];

/**
 * The public display name is the one free-text field on this screen the
 * database does NOT bound, so it is deliberately not in `LIMITS`: that object
 * mirrors server rules, and filing this next to them would claim an enforcement
 * that does not exist. `community_profiles.display_name` is plain `text` with no
 * length constraint, and `community_profile_save` only trims it (read off the
 * live schema 2026-09-11) — the client is the only thing bounding this value,
 * which is exactly why it needs a bound.
 *
 * 30 is what the narrowest place the name is drawn can actually hold. The public
 * profile sheet header (AudioCommunityDirectoryScreen) draws it UPPERCASED at
 * 13pt Oswald SemiBold with 2 of letter-spacing, in a space-between row it
 * shares with the close control and which gives it neither `flex` nor
 * `numberOfLines` — about 270 of title width on a 320-wide phone at about 9 per
 * uppercase character. Past that the name starts shoving the ✕ off the row.
 */
const DISPLAY_NAME_MAX = 30;

/** ISO 3166-1 alpha-2. Two letters is the whole definition of the format. */
export const COUNTRY_CODE_LENGTH = 2;

/**
 * A country code, or nothing — never a fragment of something else.
 *
 * Splitting by CODE POINTS is the load-bearing part, and it is the same
 * `Array.from` split GlossaryScreen uses for its two-tone terms and
 * test/hostileInput.test.ts pins as the rule: an emoji flag is a PAIR of astral
 * regional-indicator characters, and the old code-unit `slice(0, 2)` cut one of
 * them in half the moment anything preceded it ("a🇺🇸" → "A\uD83C") — a lone
 * surrogate then sat in the field, in the saved profile and in the search
 * filter, drawing as a replacement glyph wherever it landed. Keeping only A–Z
 * means a surrogate can never be emitted, half or whole, and that non-letter
 * input is refused where a country code is expected rather than stored and sent
 * to `directory_search` as one.
 *
 * It lives here, in the editor that WRITES the field, because Explore only
 * filters on one — a second copy over there is how the two ends drift apart.
 */
export function toCountryCode(raw: string): string {
  return Array.from(raw.toUpperCase())
    .filter((c) => c >= 'A' && c <= 'Z')
    .slice(0, COUNTRY_CODE_LENGTH)
    .join('');
}

/** Confirm dialogs must work on web too — react-native-web ships Alert as a
 *  literal no-op, which would make Publish silently do nothing in a browser. */
function confirmThen(title: string, body: string, yes: string, onYes: () => void): void {
  confirmDialog(title, body, yes, onYes);
}

function notify(title: string, body: string): void {
  appNotify(title, body);
}

export function MyProfileView() {
  const [tax, setTax] = useState<Taxonomy | null>(null);
  const [p, setP] = useState<CommunityProfile>(EMPTY_COMMUNITY_PROFILE);
  const pRef = useRef(p);
  pRef.current = p;
  /**
   * SAVES RUN ONE AT A TIME (bug hunt 2026-09-29). Every save writes the WHOLE
   * profile, so two in flight could land out of order — an older snapshot
   * arriving last overwrote the newer tap on the server — and a failed older
   * save rolled the screen back over taps made after it. `saveChain`
   * serialises them; `saveSeq` lets only the LATEST save touch the error line
   * and the rollback (a later successful save already carries the earlier edit).
   */
  const saveChain = useRef<Promise<unknown>>(Promise.resolve());
  const saveSeq = useRef(0);
  /** Same idea for the featured-credential picker, which has its own RPC. */
  const featuredSeq = useRef(0);
  /**
   * Featured writes run ONE AT A TIME too (bug hunt 2026-09-30, pass 2). Each
   * write replaces the whole list, and two quick chip taps sent two unordered
   * RPCs: the older list could land last and win on the server while the
   * screen showed the newer one. `featuredOk` is the last list the server
   * accepted — what a refused write rolls back to (the tap before it may
   * itself have been refused, so "the list before this tap" is not it).
   */
  const featuredChain = useRef<Promise<unknown>>(Promise.resolve());
  const featuredOk = useRef<string[] | null>(null);
  /** The last profile handed to the server (or read from it) — the unmount
   *  flush below compares against it. */
  const lastSent = useRef<CommunityProfile | null>(null);
  /** True once the server's profile has been read. Before that the editor
   *  holds the EMPTY default, which must never be flushed over a real profile. */
  const hydrated = useRef(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // A FAILED first load is its own state (network audit 2026-09-11). It must
  // never fall through to the editor: the editor's default is an EMPTY profile,
  // so a published member on a dropped connection saw their profile as blank and
  // unpublished, the legacy-migration offer fired at them as if they had no
  // profile, and the very first thing they typed was persisted over the real
  // server-side profile. Error + Retry instead — nothing is editable until we
  // actually know what the server holds.
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [creds, setCreds] = useState<EarnedCredentialRow[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [legacy, setLegacy] = useState<LegacyDraft | null>(null);
  /**
   * Guided setup vs the full form (owner 2026-09-19).
   *
   * `null` means "nobody has chosen", so the DEFAULT is derived from the
   * profile itself: a member with nothing set gets the guide, a member who
   * already has one gets their editor back exactly as before. Once they choose
   * — either way — the choice sticks for the visit.
   *
   * Deliberately NOT persisted. It is a presentation preference, and a stored
   * "skip the guide" flag would silently outlive the reason for it.
   */
  const [useGuide, setUseGuide] = useState<boolean | null>(null);
  /**
   * The derived default, LATCHED once the profile has loaded (bug hunt
   * 2026-09-30). It was re-derived on every render, so it flipped under the
   * member's fingers: typing the first letter of a display name in the guide
   * (areas and roles already chosen) made the profile "finished" and swapped
   * the whole guide for the editor mid-word; clearing the name in the editor
   * swapped the editor for the guide. Cleared on delete so a now-empty
   * profile gets the guide again.
   */
  const guideDefault = useRef<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      // Every await sits inside the try and setLoading(false) inside the finally:
      // the old shape reached setLoading(false) only on the success path, so a
      // throw (buildLegacyDraft / alreadyMigrated / a rejected credentials read)
      // left "Loading your community profile…" spinning with no way out.
      try {
        setLoading(true);
        setLoadErr(null);
        const [t, mine, c, migrated] = await Promise.all([
          fetchTaxonomy(),
          fetchMyCommunityProfile(),
          fetchMyCredentials().catch(() => []),
          alreadyMigrated().catch(() => false),
        ]);
        if (!alive) return;
        if (mine.status === 'error') {
          setLoadErr(mine.error);
          return;
        }
        if (!t) {
          setLoadErr('Couldn’t load the directory options. Check your connection and try again.');
          return;
        }
        setTax(t);
        setCreds(c);
        if (mine.status === 'ok') {
          setP(mine.profile);
          pRef.current = mine.profile;
        }
        lastSent.current = pRef.current;
        hydrated.current = true;
        // Only offer to carry the old profile over when there is genuinely no new
        // one yet — never overwrite something the member has already built here,
        // and never on the strength of a request that failed (handled above).
        const blank =
          mine.status === 'none' ||
          (!mine.profile.displayName && !mine.profile.areas.length);
        if (!migrated && blank) {
          const draft = await buildLegacyDraft().catch(() => null);
          if (alive) setLegacy(draft);
        }
      } catch {
        if (alive) setLoadErr('Couldn’t load your community profile. Check your connection and try again.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const label = useCallback(
    // [26] (2026-09-07): on taxonomy drift (a removed/renamed slug still stored on
    // the profile), humanize the slug ("foh-mixing" → "Foh Mixing") instead of
    // showing the raw machine slug to the user.
    (kind: keyof Taxonomy, slug: string) => {
      const hit = tax?.[kind].find((x) => x.slug === slug)?.label;
      if (hit) return hit;
      return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    },
    [tax],
  );

  /** One save path. Every edit goes through the server so the caps, the About
   *  rules and the specialty/area rule are applied by the same code that will
   *  be applied at publish time. */
  const persist = useCallback((next: CommunityProfile): Promise<boolean> => {
    const prev = pRef.current;
    setP(next);
    pRef.current = next;
    lastSent.current = next;
    setSaving(true);
    const seq = ++saveSeq.current;
    const run = saveChain.current.then(async () => {
      const res = await saveCommunityProfile(next);
      if (seq !== saveSeq.current) return res.ok; // a newer save owns the outcome
      setSaving(false);
      setErr(res.ok ? null : res.error);
      // Roll back on refusal (QA night 2026-09-01): a guest's tapped chip
      // stayed visually selected after the server said no.
      if (!res.ok && prev) {
        setP(prev);
        pRef.current = prev;
        lastSent.current = prev;
      }
      return res.ok;
    });
    saveChain.current = run.catch(() => {});
    return run;
  }, []);

  // FLUSH ON LEAVE (bug hunt 2026-09-29). The text fields save on blur, but
  // switching the Directory tab UNMOUNTS this view — and a tab tap does not
  // reliably blur the field first — so whatever was typed since the last save
  // vanished. Save the latest edit on the way out if it was never sent.
  useEffect(
    () => () => {
      if (hydrated.current && pRef.current !== lastSent.current) {
        const latest = pRef.current;
        saveChain.current = saveChain.current.then(() => saveCommunityProfile(latest)).catch(() => {});
      }
    },
    [],
  );

  const toggleArea = (slug: string) => {
    const has = p.areas.includes(slug);
    const areas = has ? p.areas.filter((a) => a !== slug) : [...p.areas, slug];
    if (!has && areas.length > LIMITS.areas) return;
    // Dropping an area drops the specialties it was justifying (§6.3).
    const keep = new Set(
      (tax?.specialties ?? [])
        .filter((s) => s.areas.some((a) => areas.includes(a)))
        .map((s) => s.slug),
    );
    void persist({
      ...p,
      areas,
      specialties: p.specialties.filter((s) => keep.has(s)),
      primaryArea: areas.includes(p.primaryArea ?? '') ? p.primaryArea : (areas[0] ?? null),
    });
  };

  const setPrimary = (slug: string) => void persist({ ...p, primaryArea: slug });

  const toggleIn = (key: 'specialties' | 'roles' | 'openTo', slug: string, cap: number) => {
    const cur = p[key];
    const has = cur.includes(slug);
    const next = has ? cur.filter((x) => x !== slug) : [...cur, slug];
    if (!has && next.length > cap) return;
    void persist({ ...p, [key]: next });
  };

  const gaps = useMemo(() => {
    const g: string[] = [];
    if (!p.displayName.trim()) g.push('a public display name');
    if (!p.primaryArea) g.push('one primary area');
    if (!p.roles.length) g.push('How I’m Involved');
    return g;
  }, [p.displayName, p.primaryArea, p.roles.length]);

  // One publish/unpublish at a time (bug hunt 2026-09-29): while the server
  // call is out the switch has not moved yet, so further taps re-ran the whole
  // 18+ → Publish chain and queued a second copy of every question.
  const publishing = useRef(false);
  const sendPublish = (on: boolean, adult?: boolean) => {
    if (publishing.current) return;
    publishing.current = true;
    // An edit never SENT goes first (bug hunt 2026-09-30, pass 2). The switch
    // and the guide's button are taps the ScrollView hands straight to them
    // (keyboardShouldPersistTaps), so a name typed and not yet blurred had no
    // save in the chain at all — the gaps check passed on the screen's copy
    // and the server was asked to publish a profile without it.
    if (hydrated.current && pRef.current !== lastSent.current) void persist(pRef.current);
    // Behind any save still out (bug hunt 2026-09-30): tapping the switch
    // straight from the display-name box blurs it into a save, and the publish
    // raced it — the server checked a profile that did not have the name yet.
    void saveChain.current
      .then(() => publishCommunityProfile(on, adult))
      .then((r) => (r.ok ? refresh() : setErr(r.error)))
      .finally(() => {
        publishing.current = false;
      });
  };
  const onPublish = (on: boolean) => {
    if (publishing.current) return;
    if (!on) {
      confirmThen(
        'Unpublish your profile?',
        'Your public page goes offline immediately and you are removed from directory search. Your draft is kept here, and your earned credentials are not affected.',
        'Unpublish',
        () => sendPublish(false),
      );
      return;
    }
    if (gaps.length) {
      notify('Not ready yet', `Add ${gaps.join(', ')} before publishing.`);
      return;
    }
    const go = (adult: boolean) =>
      confirmThen(
        'Publish your community profile?',
        'Your display name, areas, specialties, How I’m Involved and About My Work become visible to anyone with your link. Your private account name, email address, learning progress, quiz scores, notes and unselected credentials are never published.',
        'Publish',
        () => sendPublish(true, adult),
      );
    if (p.adultConfirmed) {
      go(false);
      return;
    }
    confirmThen(
      'Confirm your age',
      'I confirm that I am at least 18 years old and understand that the information selected above will appear on my community profile.',
      'I am 18+',
      () => go(true),
    );
  };

  const refresh = useCallback(async () => {
    // ── NEVER READ OVER AN EDIT (bug hunt 2026-09-30) ──────────────────────
    // Type in About, then tap a visibility switch: the tap goes to the switch
    // (keyboardShouldPersistTaps) so the box may not even blur, or it blurs
    // into a save that is still out. This re-read then replaced the screen
    // with the server's OLDER profile — the text vanished, and the next save
    // of any field sent that older copy back, erasing it on the server too.
    // Wait for queued saves; if anything is still unsent or a newer save
    // started meanwhile, take only the switch state the server owns.
    await saveChain.current;
    const seq = saveSeq.current;
    const mine = await fetchMyCommunityProfile();
    if (mine.status === 'ok' && (seq !== saveSeq.current || pRef.current !== lastSent.current)) {
      const s = mine.profile;
      const clean = pRef.current === lastSent.current;
      const next: CommunityProfile = {
        ...pRef.current,
        published: s.published,
        discoverable: s.discoverable,
        contactEnabled: s.contactEnabled,
        adultConfirmed: s.adultConfirmed,
        publicToken: s.publicToken,
      };
      pRef.current = next;
      if (clean) lastSent.current = next;
      setP(next);
    } else if (mine.status === 'ok') {
      // Straight from the server, so nothing here is unsent — without this the
      // flush-on-leave re-saved the whole profile after every publish/toggle.
      pRef.current = mine.profile;
      lastSent.current = mine.profile;
      setP(mine.profile);
    }
    // A failed re-read after a successful publish/toggle leaves the switches
    // showing what we last knew — say so rather than let a stale row look live.
    else if (mine.status === 'error') setErr(mine.error);
  }, []);

  const applyLegacy = () => {
    if (!legacy) return;
    void (async () => {
      const next: CommunityProfile = {
        ...p,
        displayName: p.displayName || legacy.displayName,
        about: p.about || legacy.about,
        areas: legacy.areas,
        primaryArea: legacy.primaryArea,
        specialties: legacy.specialties,
        roles: legacy.roles,
      };
      if (await persist(next)) {
        await markMigrated();
        setLegacy(null);
      }
    })();
  };

  if (loading) return <Loading label="Loading your community profile…" />;

  // Error + Retry, never the blank editor — see the loadErr note above.
  if (loadErr || !tax) {
    return (
      <ScrollView contentContainerStyle={st.body}>
        <Banner tone="warn">
          {loadErr ?? 'Couldn’t load your community profile. Check your connection and try again.'}
        </Banner>
        <PrimaryButton label="RETRY" onPress={() => setReloadKey((k) => k + 1)} />
      </ScrollView>
    );
  }

  const specialtyPool = tax.specialties.filter((s) => s.areas.some((a) => p.areas.includes(a)));

  /**
   * Show the guide while the profile is genuinely unstarted-or-unfinished and
   * not yet public. A published member NEVER gets a wizard in front of their
   * own profile, whatever else is true.
   */
  const setupUnfinished =
    !p.published && (!p.displayName.trim() || !p.areas.length || !p.roles.length);

  if (guideDefault.current === null) guideDefault.current = setupUnfinished;
  // Published during this visit ⇒ the editor is theirs from here (bug hunt
  // 2026-09-30, pass 2). The latch above kept the guide default from the load,
  // so publishing from the guide and then UNPUBLISHING in the editor swapped
  // the editor back out for the guide under the member's finger.
  if (p.published) guideDefault.current = false;
  if ((useGuide ?? guideDefault.current) && !p.published) {
    return (
      <ProfileSetupFlow
        tax={tax}
        p={p}
        saving={saving}
        err={err}
        gaps={gaps}
        label={label}
        onToggleArea={toggleArea}
        onToggle={toggleIn}
        onEdit={setP}
        onCommit={(next) => void persist(next)}
        onPublish={() => onPublish(true)}
        onExit={() => setUseGuide(false)}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled">
      {legacy ? (
        <View style={st.legacy}>
          <Text style={st.legacyTitle}>Bring your old profile across?</Text>
          <Text style={st.legacyBody}>
            Your previous work areas can be sorted into the new sections. Nothing is published —
            you’ll review it first.
            {legacy.roles.length
              ? ` “${legacy.roles.map((r) => label('roles', r)).join('” and “')}” move to How I’m Involved, because they describe a role rather than a work area.`
              : ''}
            {legacy.droppedForLimit.length
              ? ` ${legacy.droppedForLimit.length} won’t fit the new limits and will be left out.`
              : ''}
            {legacy.aboutNeedsEdit ? ' Your old bio contained contact details, so it was not carried over.' : ''}
          </Text>
          <View style={st.legacyRow}>
            <PrimaryButton label="BRING IT ACROSS" onPress={applyLegacy} />
            <View style={{ width: 10 }} />
            <PrimaryButton
              label="START FRESH"
              tone="danger"
              onPress={() => void markMigrated().then(() => setLegacy(null))}
            />
          </View>
        </View>
      ) : null}

      {err ? <Banner tone="warn">{err}</Banner> : null}
      {p.needsIdentityReview ? (
        <Banner tone="warn">
          Check your public display name below. It came from the name on your certificates, which is
          not the same thing as a directory name — confirm it before you appear in search.
        </Banner>
      ) : null}

      <Eyebrow>PUBLIC DISPLAY NAME</Eyebrow>
      <Helper>
        Shown on your community profile. It can be a professional name or your first name and last
        initial. This is never your private account name.
      </Helper>
      <TextInput
        style={st.input}
        value={p.displayName}
        onChangeText={(t) => setP({ ...p, displayName: t })}
        onBlur={() => void persist({ ...p, needsIdentityReview: false })}
        placeholder="e.g. Alex R."
        placeholderTextColor={colors.textMuted}
        autoCapitalize="words"
        maxLength={DISPLAY_NAME_MAX}
        accessibilityLabel="Public display name"
      />
      <Text style={st.hintRow}>
        {p.displayName.length}/{DISPLAY_NAME_MAX}
      </Text>

      <Eyebrow>MY AREAS OF AUDIO &amp; ACOUSTICS</Eyebrow>
      <Helper>
        Choose one primary area and up to two additional areas. These can describe what you work in,
        study, research, teach or create.
      </Helper>
      <CountHint used={p.areas.length} cap={LIMITS.areas} noun="areas" />
      <ChipWrap>
        {tax.areas.map((a) => {
          const on = p.areas.includes(a.slug);
          return (
            <Chip
              key={a.slug}
              label={a.label}
              on={on}
              disabled={!on && p.areas.length >= LIMITS.areas}
              starred={p.primaryArea === a.slug}
              onPress={() => toggleArea(a.slug)}
              onStar={on ? () => setPrimary(a.slug) : undefined}
            />
          );
        })}
      </ChipWrap>

      <Eyebrow>SPECIALTIES</Eyebrow>
      <Helper>
        Choose up to six areas that best describe your current focus. These are self-reported and do
        not replace verified credentials.
      </Helper>
      {p.areas.length === 0 ? (
        <Banner tone="info">Choose an area above first — specialties are grouped under them.</Banner>
      ) : (
        <>
          <CountHint used={p.specialties.length} cap={LIMITS.specialties} noun="specialties" />
          <ChipWrap>
            {p.specialties.map((s) => (
              <Chip key={s} label={label('specialties', s)} on onRemove={() => toggleIn('specialties', s, LIMITS.specialties)} />
            ))}
          </ChipWrap>
          <PrimaryButton
            label={p.specialties.length ? 'ADD OR CHANGE SPECIALTIES' : 'CHOOSE SPECIALTIES'}
            onPress={() => setPickerOpen(true)}
          />
        </>
      )}

      <Eyebrow>HOW I’M INVOLVED</Eyebrow>
      <Helper>
        Choose up to two. This describes your relationship to the areas you selected, not a verified
        qualification.
      </Helper>
      <CountHint used={p.roles.length} cap={LIMITS.roles} noun="chosen" />
      <ChipWrap>
        {tax.roles.map((r) => {
          const on = p.roles.includes(r.slug);
          return (
            <Chip
              key={r.slug}
              label={r.label}
              on={on}
              disabled={!on && p.roles.length >= LIMITS.roles}
              onPress={() => toggleIn('roles', r.slug, LIMITS.roles)}
            />
          );
        })}
      </ChipWrap>

      <Eyebrow>OPEN TO</Eyebrow>
      <Helper>
        Choose what members may contact you about. You can change this or pause contact at any time.
      </Helper>
      <CountHint used={p.openTo.length} cap={LIMITS.openTo} noun="chosen" />
      <ChipWrap>
        {tax.openTo.map((o) => {
          const on = p.openTo.includes(o.slug);
          return (
            <Chip
              key={o.slug}
              label={o.label}
              on={on}
              disabled={!on && p.openTo.length >= LIMITS.openTo}
              onPress={() => toggleIn('openTo', o.slug, LIMITS.openTo)}
            />
          );
        })}
      </ChipWrap>

      <Eyebrow>ABOUT MY WORK</Eyebrow>
      <Helper>
        Briefly describe your audio or acoustics work, study, research, teaching or creative focus.
      </Helper>
      <TextInput
        style={[st.input, st.multiline]}
        value={p.about}
        onChangeText={(t) => setP({ ...p, about: t })}
        onBlur={() => void persist(p)}
        placeholder="e.g. FOH engineer, six years, clubs and theatre"
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={LIMITS.about}
        accessibilityLabel="About my work"
      />
      <Text style={st.hintRow}>
        Keep this professional. Do not include email addresses, phone numbers, social handles, exact
        locations or other sensitive personal information.  {p.about.length}/{LIMITS.about}
      </Text>

      <Section title="LOCATION & LANGUAGES" summary={p.countryCode || 'optional'}>
        <Helper>All optional. Country and general region only — never an exact address.</Helper>
        <TextInput
          style={st.input}
          value={p.countryCode}
          onChangeText={(t) => setP({ ...p, countryCode: toCountryCode(t) })}
          onBlur={() => void persist(p)}
          placeholder="Country code, e.g. US"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          maxLength={COUNTRY_CODE_LENGTH}
          accessibilityLabel="Country code"
        />
        <TextInput
          style={st.input}
          value={p.region}
          onChangeText={(t) => setP({ ...p, region: t })}
          onBlur={() => void persist(p)}
          placeholder="General region or metro area (optional)"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="General region"
        />
        <Text style={st.fieldLabel}>How you work</Text>
        <ChipWrap>
          {WORK_PREFS.map((w) => (
            <Chip
              key={w.key}
              label={w.label}
              on={p.workPref === w.key}
              onPress={() => void persist({ ...p, workPref: p.workPref === w.key ? null : w.key })}
            />
          ))}
        </ChipWrap>
      </Section>

      {creds.length ? (
        <Section title="FEATURED CREDENTIALS" summary={`${p.featuredCredentialIds.length} shown`}>
          <Helper>
            Choose which earned Pro Audio Training Academy credentials appear on your profile.
            Nothing is shown unless you pick it, and each one links to its permanent verification
            page.
          </Helper>
          <ChipWrap>
            {creds.map((c) => {
              const on = p.featuredCredentialIds.includes(c.id);
              return (
                <Chip
                  key={c.id}
                  label={c.name}
                  on={on}
                  onPress={() => {
                    const ids = on
                      ? p.featuredCredentialIds.filter((x) => x !== c.id)
                      : [...p.featuredCredentialIds, c.id];
                    const prevIds = p.featuredCredentialIds;
                    // Nothing in flight on the first tap, so the list on screen
                    // is the server's.
                    if (featuredOk.current === null) featuredOk.current = prevIds;
                    setP({ ...p, featuredCredentialIds: ids });
                    // The result was dropped (bug hunt 2026-09-30): a refused or
                    // failed write left the chip lit, so the member believed a
                    // credential was on their public profile when it was not.
                    // Only the LATEST tap may report or roll back; writes are
                    // chained so they land in tap order (see featuredChain).
                    const seq = ++featuredSeq.current;
                    const run = featuredChain.current
                      .then(() => setFeaturedCredentials(ids))
                      .then((r) => {
                        if (r.ok) featuredOk.current = ids;
                        if (seq !== featuredSeq.current) return;
                        if (r.ok) return setErr(null);
                        setErr(r.error);
                        const back = featuredOk.current ?? prevIds;
                        setP((cur) => ({ ...cur, featuredCredentialIds: back }));
                      });
                    featuredChain.current = run.catch(() => {});
                  }}
                />
              );
            })}
          </ChipWrap>
        </Section>
      ) : null}

      {/* ── Visibility (§8): three separate switches, in order, all off by
          default. Each states plainly what it does and does not do. ───── */}
      <Eyebrow>VISIBILITY</Eyebrow>
      <PrimaryButton label="PREVIEW MY PUBLIC PROFILE" onPress={() => setPreviewOpen(true)} />

      <View style={st.switchRow}>
        <Text style={st.switchLabel}>Publish my community profile</Text>
        <Toggle on={p.published} label="Publish my community profile" onChange={onPublish} />
      </View>
      <Helper>
        Creates a public profile that anyone with the link can open. Your private account name,
        email address, learning progress, quiz scores, notes and unselected credentials are never
        published.
      </Helper>

      <View style={st.switchRow}>
        <Text style={st.switchLabel}>Include me in the Audio Community Directory</Text>
        <Toggle
          on={p.discoverable}
          disabled={!p.published}
          label="Include me in the Audio Community Directory"
          onChange={(v) => void setDiscoverable(v).then((r) => (r.ok ? refresh() : setErr(r.error)))}
        />
      </View>
      <Helper>
        Lets verified members find your profile using professional audio and acoustics filters. This
        does not make your email visible.
      </Helper>

      <View style={st.switchRow}>
        <Text style={st.switchLabel}>Let members contact me</Text>
        <Toggle
          on={p.contactEnabled}
          disabled={!p.published}
          label="Let members contact me"
          onChange={(v) => void setContactEnabled(v).then((r) => (r.ok ? refresh() : setErr(r.error)))}
        />
      </View>
      <Helper>
        Your email address is never shown. Verified members can send limited contact requests
        through Pro Audio Training Academy. You can accept, decline, block or report any request.
      </Helper>

      <SelfReportedNote />

      <PrimaryButton
        label="DELETE COMMUNITY PROFILE"
        tone="danger"
        onPress={() =>
          confirmThen(
            'Delete your community profile?',
            'This removes your public page, your directory listing and everything you selected here. Your account, your studies and your earned credentials are not affected, and your credentials stay verifiable by their own link. Safety records from any blocks or reports are kept.',
            'Delete',
            () =>
              // Behind any save still out (bug hunt 2026-09-30): the blur of
              // a text box into this button queued a save, and it could land
              // AFTER the delete and re-create the profile just removed.
              void saveChain.current.then(() => deleteCommunityProfile()).then((r) => {
                if (!r.ok) return setErr(r.error);
                guideDefault.current = null;
                featuredOk.current = null;
                // Mark the blank as already SENT (bug hunt 2026-09-30). Only
                // `p` changed here, so the flush-on-leave below saw an unsent
                // edit and saved the empty profile on the next tab switch —
                // re-creating the community profile the member had just
                // deleted.
                pRef.current = EMPTY_COMMUNITY_PROFILE;
                lastSent.current = EMPTY_COMMUNITY_PROFILE;
                setP(EMPTY_COMMUNITY_PROFILE);
              }),
          )
        }
      />
      {saving ? <Text style={st.saving}>Saving…</Text> : null}

      <SpecialtyPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        pool={specialtyPool}
        areas={tax.areas}
        chosen={p.specialties}
        onToggle={(slug) => toggleIn('specialties', slug, LIMITS.specialties)}
      />
      <PreviewSheet open={previewOpen} onClose={() => setPreviewOpen(false)} p={p} label={label} creds={creds} />
    </ScrollView>
  );
}

/** §6.3: a searchable sheet grouped by area — never the whole catalogue as one
 *  wall of buttons. 119 specialties would be unusable that way. */
function SpecialtyPicker({
  open,
  onClose,
  pool,
  areas,
  chosen,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  pool: { slug: string; label: string; areas: string[] }[];
  areas: { slug: string; label: string }[];
  chosen: string[];
  onToggle: (slug: string) => void;
}) {
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return areas
      .map((a) => ({
        area: a,
        items: pool.filter(
          (s) => s.areas.includes(a.slug) && (!needle || s.label.toLowerCase().includes(needle)),
        ),
      }))
      .filter((g) => g.items.length);
  }, [areas, pool, q]);

  return (
    <Modal accessibilityViewIsModal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.sheetRoot}>
        <View style={st.sheet}>
          <View style={st.sheetHead}>
            <Text accessibilityRole="header" style={st.sheetTitle}>
              SPECIALTIES
            </Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={st.sheetClose}>✕</Text>
            </Pressable>
          </View>
          <TextInput
            style={st.input}
            value={q}
            onChangeText={setQ}
            placeholder="Search specialties"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            accessibilityLabel="Search specialties"
          />
          <CountHint used={chosen.length} cap={LIMITS.specialties} noun="specialties" />
          <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
            {groups.length === 0 ? (
              <Helper>Nothing matches “{q}”. Try a shorter word.</Helper>
            ) : (
              groups.map((g) => (
                <View key={g.area.slug}>
                  <Eyebrow>{g.area.label}</Eyebrow>
                  <ChipWrap>
                    {g.items.map((s) => {
                      const on = chosen.includes(s.slug);
                      return (
                        <Chip
                          key={s.slug}
                          label={s.label}
                          on={on}
                          disabled={!on && chosen.length >= LIMITS.specialties}
                          onPress={() => onToggle(s.slug)}
                        />
                      );
                    })}
                  </ChipWrap>
                </View>
              ))
            )}
          </ScrollView>
          <PrimaryButton label="DONE" tone="green" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

/** §8.1 requires an exact preview before final confirmation. */
function PreviewSheet({
  open,
  onClose,
  p,
  label,
  creds,
}: {
  open: boolean;
  onClose: () => void;
  p: CommunityProfile;
  label: (k: keyof Taxonomy, s: string) => string;
  creds: EarnedCredentialRow[];
}) {
  return (
    <Modal accessibilityViewIsModal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.sheetRoot}>
        <View style={st.sheet}>
          <View style={st.sheetHead}>
            <Text accessibilityRole="header" style={st.sheetTitle}>
              THIS IS WHAT OTHERS SEE
            </Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close preview">
              <Text style={st.sheetClose}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }}>
            <Text style={st.pvName}>{p.displayName || 'Your display name'}</Text>
            {p.primaryArea ? <Text style={st.pvArea}>{label('areas', p.primaryArea)}</Text> : null}
            {p.about ? <Text style={st.pvAbout}>{p.about}</Text> : null}
            {p.specialties.length ? (
              <ChipWrap>
                {p.specialties.map((s) => (
                  <Chip key={s} label={label('specialties', s)} />
                ))}
              </ChipWrap>
            ) : null}
            {p.roles.length ? (
              <Text style={st.pvMeta}>{p.roles.map((r) => label('roles', r)).join(' · ')}</Text>
            ) : null}
            {p.featuredCredentialIds.length ? (
              <>
                <Eyebrow>VERIFIED CREDENTIALS</Eyebrow>
                {creds
                  .filter((c) => p.featuredCredentialIds.includes(c.id))
                  .map((c) => (
                    <Text key={c.id} style={st.pvCred}>
                      {c.name}
                    </Text>
                  ))}
              </>
            ) : null}
            <Eyebrow>NEVER SHOWN</Eyebrow>
            <Text style={st.pvNever}>· Your email address</Text>
            <Text style={st.pvNever}>· Your private account name</Text>
            <Text style={st.pvNever}>· Your progress, quiz scores and notes</Text>
            <Text style={st.pvNever}>· Any credential you did not select</Text>
            <SelfReportedNote />
          </ScrollView>
          <PrimaryButton label="CLOSE PREVIEW" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  // Tablet (owner 2026-09-29): card column, centred. No-op on a phone.
  body: { padding: 14, paddingBottom: 40, ...cardColumn },
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
    marginTop: 6,
  },
  multiline: { minHeight: 84, textAlignVertical: 'top' },
  hintRow: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    marginTop: 6,
  },
  fieldLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textSecondary,
    marginTop: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    marginTop: 16,
  },
  switchLabel: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 15, color: colors.textPrimary },
  saving: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted, marginTop: 10 },
  legacy: {
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.4)',
    backgroundColor: '#1e1a10',
    borderRadius: 10,
    padding: 12,
  },
  legacyTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.6, color: colors.amber },
  legacyBody: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 6,
  },
  legacyRow: { flexDirection: 'row' },
  sheetRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,.75)', justifyContent: 'flex-end' },
  sheet: {
    // Tablet (owner 2026-09-29): the sheet rides centred at the card column
    // instead of spanning a 1024 pt iPad. No-op on a phone.
    ...cardColumn,
    maxHeight: '88%',
    backgroundColor: '#141414',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    padding: 14,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2, color: colors.amberLabel },
  sheetClose: { fontFamily: fonts.barlowMedium, fontSize: 18, color: colors.textSub, padding: 4 },
  pvName: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.textPrimary, marginTop: 8 },
  pvArea: { fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.6, color: colors.amber, marginTop: 4 },
  pvAbout: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 10,
  },
  pvMeta: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub, marginTop: 8 },
  pvCred: { fontFamily: fonts.barlowSemiBold, fontSize: 14, color: colors.textPrimary, marginTop: 4 },
  pvNever: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textMuted },
});
