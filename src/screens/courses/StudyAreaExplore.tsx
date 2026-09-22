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
import { COPY } from '../../lib/copy';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
  onStudy,
  onEnrollments,
  onFallback,
}: {
  /** The open Study Area's card name, or null when closed. */
  area: string | null;
  onClose: () => void;
  /** VIEW PROGRESS inside the popup — the parent navigates (needs the stack). */
  onProgress: (c: CredentialDetail) => void;
  /** STUDY NOW and GO TO MY ENROLLMENTS, shown only once a credential is
   *  enrolled (owner 2026-09-19). The parent navigates, as with onProgress.
   *  Both are withheld from an anonymous account below — the same account that
   *  gets the "won't be saved" prompt must not be offered an enrollments list. */
  onStudy: (c: CredentialDetail) => void;
  onEnrollments: () => void;
  /** Nothing resolvable for this area → what EXPLORE did before (curriculum browser). */
  onFallback: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [catalog, setCatalog] = useState<Awaited<ReturnType<typeof loadCatalog>> | null>(null);
  const [detail, setDetail] = useState<CredentialDetail | null>(null);
  const [payPrompt, setPayPrompt] = useState<{ label: string } | null>(null);
  const { entitlement, resolved } = useEntitlement();
  /** Can this account actually HOLD an enrollment? Gates the two onward doors:
   *  an anonymous pick does not survive, so offering "my enrollments" would
   *  send them to a list their choice will never appear in. */
  const hasAccount = resolved && entitlement !== 'anonymous';

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

  // SWIPE DOWN TO CLOSE (owner 2026-09-16: "they do not wish to swipe down
  // close — it is a struggle"). The sheet follows the finger; a drag past
  // DISMISS_PX or a downward flick dismisses, anything less springs back.
  // Claims the gesture from the header always, and from the list ONLY when
  // the list is scrolled to the top and the finger moves down — so scrolling
  // the options still works and an upward drag never closes anything.
  const DISMISS_PX = 90;
  const dragY = useRef(new Animated.Value(0)).current;
  const atTop = useRef(true);
  // ANDROID: a native ScrollView intercepts any vertical drag past ~8 dp
  // before JS can claim it, so a drag that starts on a row only reaches the
  // sheet's PanResponder when the list is NOT scrollable. Most areas fit
  // without scrolling (≤ 6 options) — for those the whole sheet drags. Long
  // lists keep scrolling and close from the header, the ✕, or the scrim.
  const [listScrollable, setListScrollable] = useState(false);
  const listSize = useRef({ content: 0, view: 0 });
  const updateScrollable = () => {
    const { content, view } = listSize.current;
    setListScrollable(view > 0 && content > view + 1);
  };
  const closing = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const sheetMaxRef = useRef(sheetMax);
  sheetMaxRef.current = sheetMax;
  useEffect(() => {
    // Fresh open: sheet back at rest.
    if (area) {
      closing.current = false;
      dragY.setValue(0);
    }
  }, [area, dragY]);
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => !closing.current && g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onMoveShouldSetPanResponderCapture: (_e, g) =>
        !closing.current && atTop.current && g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderMove: (_e, g) => dragY.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_e, g) => {
        if (g.dy > DISMISS_PX || g.vy > 0.6) {
          closing.current = true;
          Animated.timing(dragY, { toValue: sheetMaxRef.current, duration: 180, useNativeDriver: true }).start(() => onCloseRef.current());
        } else {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
      onPanResponderTerminate: () => Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start(),
    }),
  ).current;

  return (
    <>
      <Modal accessibilityViewIsModal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
        {/* Picker sheet — only for 2+ options. A single credential renders the
            popup alone over a plain scrim. */}
        <View style={styles.scrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
          {!single && area ? (
            <Animated.View
              style={[styles.sheet, { maxHeight: sheetMax, paddingBottom: Math.max(insets.bottom, 12) + 6, transform: [{ translateY: dragY }] }]}
              {...pan.panHandlers}
            >
              <View style={styles.grip} accessible accessibilityRole="button" accessibilityLabel="Swipe down to close" />
              <View style={styles.headRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eyebrow}>STUDY AREA</Text>
                  <Text style={styles.title}>{area}</Text>
                </View>
                {/* Explicit close — no gesture needed (owner 2026-09-16). */}
                <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
                  <Text style={styles.closeX}>✕</Text>
                </Pressable>
              </View>
              <Text style={styles.hint}>Choose a certificate or program to inspect. Swipe down to close.</Text>
              <ScrollView
                style={{ flexGrow: 0 }}
                contentContainerStyle={styles.rows}
                showsVerticalScrollIndicator={false}
                scrollEnabled={listScrollable}
                scrollEventThrottle={16}
                onScroll={(e) => {
                  atTop.current = e.nativeEvent.contentOffset.y <= 0;
                }}
                onLayout={(e) => {
                  listSize.current.view = e.nativeEvent.layout.height;
                  updateScrollable();
                }}
                onContentSizeChange={(_w, h) => {
                  listSize.current.content = h;
                  updateScrollable();
                }}
              >
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
            </Animated.View>
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
          onStudy={
            hasAccount
              ? (c) => {
                  onClose();
                  onStudy(c);
                }
              : undefined
          }
          onEnrollments={
            hasAccount
              ? () => {
                  onClose();
                  onEnrollments();
                }
              : undefined
          }
          onClose={closeDetail}
          /* The notice must render INSIDE this Modal. As a sibling it lands on
             the activity window, i.e. BEHIND this card on Android — which is
             exactly what it did until 2026-09-19. */
          overlay={
            <PrePaywallPrompt
              embedded
              visible={!!payPrompt}
              onClose={() => setPayPrompt(null)}
              title="Heads up"
              lines={[
                'Your choices won’t be saved without an account.',
                COPY.enrollFreeLine,
          COPY.membershipCoversLine,
              ]}
            />
          }
        />
      </Modal>
      {/* Only when NO detail card is open — otherwise the embedded copy above
          is the one that shows. Never both. */}
      <PrePaywallPrompt
        visible={!!payPrompt && !detail}
        onClose={() => setPayPrompt(null)}
        title="Heads up"
        lines={[
          'Your choices won’t be saved without an account.',
          COPY.enrollFreeLine,
          COPY.membershipCoversLine,
        ]}
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
  // A grip you can actually see and grab (was a 38×4 hairline).
  grip: { alignSelf: 'center', width: 56, height: 5, borderRadius: 3, backgroundColor: '#5a5a62', marginTop: 2, marginBottom: 12 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: -6, marginRight: -8 },
  closeX: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSecondary },
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
