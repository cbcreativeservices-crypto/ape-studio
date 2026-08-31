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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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

const WORK_PREFS: { key: WorkPref; label: string }[] = [
  { key: 'remote', label: 'Remote' },
  { key: 'local', label: 'Local / in person' },
  { key: 'either', label: 'Either' },
];

/** Confirm dialogs must work on web too — react-native-web ships Alert as a
 *  literal no-op, which would make Publish silently do nothing in a browser. */
function confirmThen(title: string, body: string, yes: string, onYes: () => void): void {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || window.confirm(`${title}\n\n${body}`)) onYes();
    return;
  }
  Alert.alert(title, body, [
    { text: 'Cancel', style: 'cancel' },
    { text: yes, onPress: onYes },
  ]);
}

function notify(title: string, body: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${body}`);
    return;
  }
  Alert.alert(title, body);
}

export function MyProfileView() {
  const [tax, setTax] = useState<Taxonomy | null>(null);
  const [p, setP] = useState<CommunityProfile>(EMPTY_COMMUNITY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [creds, setCreds] = useState<EarnedCredentialRow[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [legacy, setLegacy] = useState<LegacyDraft | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [t, mine, c, migrated] = await Promise.all([
        fetchTaxonomy(),
        fetchMyCommunityProfile(),
        fetchMyCredentials().catch(() => []),
        alreadyMigrated(),
      ]);
      if (!alive) return;
      setTax(t);
      setCreds(c);
      if (mine) setP(mine);
      // Only offer to carry the old profile over when there is no new one yet —
      // never overwrite something the member has already built here.
      if (!migrated && (!mine || (!mine.displayName && !mine.areas.length))) {
        setLegacy(await buildLegacyDraft());
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const label = useCallback(
    (kind: keyof Taxonomy, slug: string) => tax?.[kind].find((x) => x.slug === slug)?.label ?? slug,
    [tax],
  );

  /** One save path. Every edit goes through the server so the caps, the About
   *  rules and the specialty/area rule are applied by the same code that will
   *  be applied at publish time. */
  const persist = useCallback(async (next: CommunityProfile) => {
    setP(next);
    setSaving(true);
    const res = await saveCommunityProfile(next);
    setSaving(false);
    setErr(res.ok ? null : res.error);
    return res.ok;
  }, []);

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
    if (!p.roles.length) g.push('how you’re involved');
    return g;
  }, [p.displayName, p.primaryArea, p.roles.length]);

  const onPublish = (on: boolean) => {
    if (!on) {
      confirmThen(
        'Unpublish your profile?',
        'Your public page goes offline immediately and you are removed from directory search. Your draft is kept here, and your earned credentials are not affected.',
        'Unpublish',
        () => void publishCommunityProfile(false).then((r) => (r.ok ? refresh() : setErr(r.error))),
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
        'Your display name, areas, specialties, how you’re involved and About My Work become visible to anyone with your link. Your private account name, email address, learning progress, quiz scores, notes and unselected credentials are never published.',
        'Publish',
        () => void publishCommunityProfile(true, adult).then((r) => (r.ok ? refresh() : setErr(r.error))),
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
    const mine = await fetchMyCommunityProfile();
    if (mine) setP(mine);
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

  if (loading || !tax) return <Loading label="Loading your community profile…" />;

  const specialtyPool = tax.specialties.filter((s) => s.areas.some((a) => p.areas.includes(a)));

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
        accessibilityLabel="Public display name"
      />

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
          onChangeText={(t) => setP({ ...p, countryCode: t.toUpperCase().slice(0, 2) })}
          onBlur={() => void persist(p)}
          placeholder="Country code, e.g. US"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          maxLength={2}
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
                    setP({ ...p, featuredCredentialIds: ids });
                    void setFeaturedCredentials(ids);
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
              void deleteCommunityProfile().then((r) => {
                if (!r.ok) return setErr(r.error);
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
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
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
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
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
  body: { padding: 14, paddingBottom: 40 },
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
