/**
 * StudyAreaExplore — what a Home "Study Area" card's EXPLORE opens (owner
 * feature 2026-09-16).
 *
 * The card names an area; src/data/studyAreaCredentials.ts lists the
 * certificates + programs behind it. Rules (owner):
 *   • exactly ONE credential → open its expanded view straight away;
 *   • TWO OR MORE → a picker first (thumbnail + name + kind), tap → the
 *     expanded view, ‹ › pages through that area's list;
 *   • none resolvable (unmapped area, catalog still loading and empty) → the
 *     parent's fallback (the curriculum browser, what EXPLORE did before).
 *
 * The expanded view IS the Certificates / Programs screens' popup —
 * CredentialDetailModal, unchanged — with the same in-place ENROLL wiring the
 * AwardsScreen gives it (bundle store + cores + the no-account heads-up).
 * Nested inside the picker modal so iOS layers it on top (AwardsScreen grammar).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal } from '../../components/DimModal';
import { CardArt } from '../../components/CardArt';
import { PrePaywallPrompt } from '../../components/PrePaywallPrompt';
import { colors, fonts } from '../../theme/tokens';
import { officialTopicName } from '../../data/officialTopicNames';
import { STUDY_AREA_CREDENTIALS } from '../../data/studyAreaCredentials';
import { fetchV3Certs, fetchV3Curriculum, fetchV3Programs, flattenV3, type V3Credential } from '../../data/v3Curriculum';
import { addTopics, setActiveMany } from '../../features/enrollment/enrollmentStore';
import { addBundle, bundleKey, removeBundle, useBundles, type BundleKind } from '../../features/enrollment/enrolledBundlesStore';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { trackEvent } from '../../features/telemetry/telemetry';
import { COREQ_TOPIC_GS } from '../awards/awardsData';
import { credentialArtUrl, credentialEyebrow } from '../awards/CredentialThumb';
import { CredentialDetailModal, type CredentialDetail } from '../awards/CredentialDetailModal';

const CERT_BLUE = '#5bb0ff'; // = AwardsScreen GLOSSARY_BLUE (certificate accent)
const PROGRAM_PURPLE = '#c4a2ff'; // = AwardsScreen PURPLE (program accent)
const AREA_AMBER = '#ffc64d';

// The catalog is static for a session: fetch once, share across opens.
let catalogPromise: Promise<{ certs: V3Credential[]; programs: V3Credential[]; names: Map<number, string> }> | null = null;
function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = Promise.all([fetchV3Certs(), fetchV3Programs(), fetchV3Curriculum()]).then(([certs, programs, fields]) => {
      const r = { certs, programs, names: new Map(flattenV3(fields).map((t) => [t.gs, t.name] as const)) };
      if (certs.length === 0 && programs.length === 0) catalogPromise = null; // don't cache a dead read
      return r;
    });
  }
  return catalogPromise;
}

const analyticsKey = (area: string) => area.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

export function StudyAreaExplore({
  area,
  onClose,
  onProgress,
  onFallback,
}: {
  /** The open Study Area's card name, or null when closed. */
  area: string | null;
  onClose: () => void;
  /** VIEW PROGRESS inside the popup — the parent navigates (needs the stack). */
  onProgress: (c: CredentialDetail) => void;
  /** Nothing resolvable for this area → what EXPLORE did before (curriculum browser). */
  onFallback: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [catalog, setCatalog] = useState<Awaited<ReturnType<typeof loadCatalog>> | null>(null);
  const [detail, setDetail] = useState<CredentialDetail | null>(null);
  const [payPrompt, setPayPrompt] = useState<{ label: string } | null>(null);
  const { entitlement, resolved } = useEntitlement();

  useEffect(() => {
    if (!area) return;
    let alive = true;
    void loadCatalog().then((c) => {
      if (alive) setCatalog(c);
    });
    return () => {
      alive = false;
    };
  }, [area]);

  // The area's credentials, in the curated order, resolved against the live
  // catalog (an inactive/unknown slug is skipped, never shown).
  const list = useMemo<CredentialDetail[]>(() => {
    if (!area || !catalog) return [];
    const bySlug = new Map<string, CredentialDetail>();
    for (const c of catalog.certs) bySlug.set(c.slug, { kind: 'certificate', id: c.id, slug: c.slug, name: c.name, topics: c.topicsGs, electives: [] });
    for (const p of catalog.programs) bySlug.set(p.slug, { kind: 'program', id: p.id, slug: p.slug, name: p.name, topics: p.topicsGs, electives: p.electivesGs ?? [] });
    return (STUDY_AREA_CREDENTIALS[area] ?? []).map((s) => bySlug.get(s)).filter((c): c is CredentialDetail => !!c);
  }, [area, catalog]);

  // Route on open: one → straight to the popup; none → fallback; many → picker.
  useEffect(() => {
    if (!area || !catalog) return;
    trackEvent('study_area_explore', { area: analyticsKey(area), options: list.length });
    if (list.length === 1) setDetail(list[0]);
    else if (list.length === 0) onFallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, catalog]);

  // Reset the chosen credential whenever the sheet closes.
  useEffect(() => {
    if (!area) setDetail(null);
  }, [area]);

  const nameForGs = useCallback((gs: number) => officialTopicName(gs, catalog?.names.get(gs)), [catalog]);

  // In-place enrol/unenrol — identical to AwardsScreen.toggleEnrollInPlace.
  const bundles = useBundles();
  const bundleKeys = useMemo(() => new Set(bundles.map((b) => b.key)), [bundles]);
  const credKey = (c: CredentialDetail) => bundleKey(c.kind === 'certificate' ? 'cert' : 'program', c.name);
  const isCredEnrolled = useCallback((c: CredentialDetail) => bundleKeys.has(credKey(c)), [bundleKeys]);
  const toggleEnroll = useCallback(
    (c: CredentialDetail) => {
      const kind: BundleKind = c.kind === 'certificate' ? 'cert' : 'program';
      if (bundleKeys.has(credKey(c))) {
        removeBundle(credKey(c));
        return;
      }
      addBundle(kind, c.name, c.topics);
      addTopics(c.topics);
      setActiveMany(c.topics, false);
      addTopics([...COREQ_TOPIC_GS]);
      if (resolved && entitlement === 'anonymous') setPayPrompt({ label: c.name });
    },
    [bundleKeys, resolved, entitlement],
  );

  // ‹ › neighbours within THIS area's list (clamped, no wrap).
  const idx = detail ? list.findIndex((c) => c.id === detail.id) : -1;
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
  const onStep = (dir: 1 | -1) => {
    const to = idx + dir;
    if (idx >= 0 && to >= 0 && to < list.length) setDetail(list[to]);
  };

  const single = list.length === 1;
  const closeDetail = () => (single ? onClose() : setDetail(null));
  const visible = !!area && list.length > 0;
  const sheetMax = Math.round(height * 0.72);

  return (
    <>
      <Modal accessibilityViewIsModal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
        {/* Picker sheet — only for 2+ options. A single credential renders the
            popup alone over a plain scrim. */}
        <View style={styles.scrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
          {!single && area ? (
            <View style={[styles.sheet, { maxHeight: sheetMax, paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
              <View style={styles.grip} />
              <Text style={styles.eyebrow}>STUDY AREA</Text>
              <Text style={styles.title}>{area}</Text>
              <Text style={styles.hint}>Choose a certificate or program to inspect.</Text>
              <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={styles.rows} showsVerticalScrollIndicator={false}>
                {list.map((c) => {
                  const accent = c.kind === 'certificate' ? CERT_BLUE : PROGRAM_PURPLE;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setDetail(c)}
                      accessibilityRole="button"
                      accessibilityLabel={`${c.name}. Opens details`}
                      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    >
                      <View style={[styles.thumb, isCredEnrolled(c) && { borderColor: accent }]}>
                        <CardArt uri={credentialArtUrl(c.slug)} style={styles.thumbFill} imageStyle={styles.thumbImg} />
                      </View>
                      <View style={styles.rowText}>
                        <Text style={[styles.kind, { color: accent }]}>{credentialEyebrow(c.kind)}</Text>
                        <Text style={styles.name}>{c.name}</Text>
                      </View>
                      <Text style={[styles.chevron, { color: accent }]}>›</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>
        <CredentialDetailModal
          credential={detail}
          accent={detail?.kind === 'program' ? PROGRAM_PURPLE : CERT_BLUE}
          coreCount={COREQ_TOPIC_GS.length}
          nameForGs={nameForGs}
          prev={single ? undefined : prev}
          next={single ? undefined : next}
          onStep={single ? undefined : onStep}
          onEnroll={toggleEnroll}
          isEnrolled={isCredEnrolled}
          onProgress={(c) => {
            onClose();
            onProgress(c);
          }}
          onClose={closeDetail}
        />
      </Modal>
      <PrePaywallPrompt
        visible={!!payPrompt}
        onClose={() => setPayPrompt(null)}
        title="Heads up"
        lines={['Your choices won’t be saved without an account.']}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#141416',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,198,77,.35)',
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  grip: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: '#3a3a3a', marginBottom: 12 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2, color: AREA_AMBER },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 22, lineHeight: 26, color: colors.textPrimary, marginTop: 2 },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub, marginTop: 4, marginBottom: 8 },
  rows: { paddingBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  thumb: { width: 52, height: 52, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0e0e0e' },
  thumbFill: { width: '100%', height: '100%' },
  thumbImg: { borderRadius: 7 },
  rowText: { flex: 1, gap: 1 },
  kind: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.4 },
  name: { fontFamily: fonts.oswaldMedium, fontSize: 16, lineHeight: 20, color: colors.textPrimary },
  chevron: { fontFamily: fonts.oswaldMedium, fontSize: 22, lineHeight: 24, opacity: 0.8, paddingRight: 2 },
});
