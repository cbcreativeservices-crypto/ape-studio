/**
 * AwardsScreen — the two Award levels (Specialization Certificate · Professional
 * Certificate Program) as a horizontal SWIPE pager: open lands on the tapped
 * category, swipe left/right moves between them. No diploma / master tiers (user
 * request 2026-07-18). Content is data-only (awardsData.ts). Bottom nav hidden;
 * back chevron exits.
 *
 * CHOOSER GRAMMAR (2026-09-15, popup redesign): the cert/program chooser modals
 * have exactly ONE screen exit — the labeled "‹ BACK TO …" in ChooserHeader.
 * The catalog is a FLAT list of rows (art thumb + name); tapping a row opens
 * CredentialDetailModal — the TopicDetailModal shell with the credential's art,
 * topics, info readout and the ENROLL / VIEW PROGRESS actions. No inline
 * expand/collapse. The ✕ glyph appears only inside the full-screen art viewer.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { officialTopicName } from '../../data/officialTopicNames';
import { HelpKey } from '../../components/HelpKey';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ViewToken } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import { CompactBrandBar } from '../../components/CompactBrandBar';
import { BrandLogo } from '../../components/BrandLogo';
import { PrePaywallPrompt } from '../../components/PrePaywallPrompt';
import { LowLightDim } from '../../features/settings/LowLightLayer';
import { consumeDevPreview } from '../../features/dev/devPreview';
import { CurriculumView } from '../curriculum/CurriculumScreen';
import { DirectoryView } from '../directory/DirectoryScreen';
import { EnrollmentView } from '../enrollment/EnrollmentScreen';
import { addTopics, setActiveMany } from '../../features/enrollment/enrollmentStore';
import { addBundle, bundleKey, removeBundle, useBundles, type BundleKind } from '../../features/enrollment/enrolledBundlesStore';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import {
  awardPage,
  AWARD_ORDER,
  COREQ_TOPIC_GS,
  type AwardPage,
  type AwardTier,
} from './awardsData';
import { fetchV3Programs, fetchV3Certs, fetchV3Curriculum, flattenV3, type V3Credential } from '../../data/v3Curriculum';
import { CardArt } from '../../components/CardArt';
import { credentialArtUrl } from './CredentialThumb';
import { CredentialDetailModal, type CredentialDetail } from './CredentialDetailModal';
import type { RootStackParamList } from '../../navigation/types';
import { CERTIFICATE_REQUIRES_EXAM } from '../../features/finalExam/tenure';

const SPEC_CERT_KEY = 'ape:specCert'; // chosen Specialization Certificate name (Level 1)
const PROGRAM_PATH_KEY = 'ape:programPath'; // chosen program path name (Level 2)

type Props = NativeStackScreenProps<RootStackParamList, 'Awards'>;

/**
 * PAGE WIDTH IS A HOOK, NOT A MODULE CONSTANT (2026-09-13).
 *
 * This was `Dimensions.get('window')` read once at module scope - i.e. at app
 * BOOT, in whatever geometry the app happened to launch in. Every consumer
 * below sizes a horizontally PAGED FlatList: the page views, `getItemLayout`
 * and the `contentOffset.x / width` index maths. Rotate the device, or drag an
 * iPad into Split View, and all three keep using the boot width - the pager
 * lands between pages and the tab strip highlights a page the user is not
 * looking at. `useWindowDimensions` re-renders on both.
 */

// Glossary blue — matches the Glossary card on Course Selection (user request
// 2026-07-18); used for the Specialization Certificate builder + its top button.
const GLOSSARY_BLUE = '#5bb0ff';
// Academy amber (the specialization gold) — reused for the Program title +
// tier frame (user request 2026-07-18).
const AMBER = '#ffc64d';
// Academy purple — the Program accent.
const PURPLE = '#c4a2ff';
// Directory green — matches the "get discovered" optional/verified theme.
const DIRECTORY_GREEN = '#37e05f';

/** The five side-by-side pages, left → right (Directory + Enrollment added
 *  2026-07-22). */
const PAGE_ORDER = ['curriculum', 'specialization', 'program', 'directory', 'enrollment'] as const;
type PageKey = (typeof PAGE_ORDER)[number];
// Enrollments is a terminal page (owner 2026-07-31): once the user lands there,
// the horizontal swipe locks so they can't slide back to the Pro Registry
// (directory) page — they exit only via the top Home button (or a tab tap).
const ENROLLMENT_IDX = PAGE_ORDER.indexOf('enrollment');

// Tab / nav-button labels (user request 2026-07-22) — also used by the Course
// Select top buttons.
const PAGE_TAB: Record<PageKey, string> = {
  curriculum: 'Explore',
  specialization: 'Certificates',
  program: 'Programs',
  directory: 'Pro Registry',
  enrollment: 'Enrollments',
};
// Big header title per page (user request 2026-07-22).
const PAGE_TITLE: Record<PageKey, string> = {
  curriculum: 'Explore the Academy',
  specialization: 'Specialize. Learn. Earn the Certificate.',
  program: 'Complete Certificate Programs',
  directory: 'Get Discovered',
  enrollment: 'Manage My Learning',
};

function pageLabel(key: PageKey): string {
  return PAGE_TAB[key];
}
function pageHeadline(key: PageKey): string {
  return PAGE_TITLE[key];
}
function pageTint(key: PageKey): string {
  return key === 'specialization'
    ? GLOSSARY_BLUE
    : key === 'program'
      ? PURPLE
      : key === 'directory'
        ? '#ffffff' // Pro Registry tab tint = white (was DIRECTORY_GREEN)
        : key === 'enrollment'
          ? DIRECTORY_GREEN
          : AMBER;
}

function TierBlock({
  tier,
  accent,
  builderTint,
  onBuild,
  buildSummary,
}: {
  tier: AwardTier;
  /** Accent for the container border + inner elements (group heads, checks). */
  accent: string;
  /** Color for the builder button ONLY (kept distinct so the program's
   *  "choose a path" button stays purple while its frame/text are amber). */
  builderTint: string;
  onBuild: (kind: 'specializations' | 'programs') => void;
  /** Short "you've chosen …" summary for this tier's builder, if any. */
  buildSummary?: string;
}) {
  const [policyOpen, setPolicyOpen] = useState(false);
  return (
    <View style={[styles.tier, { borderColor: accent }]}>
      <Text style={styles.tierTitle}>{tier.title}</Text>

      {/* Interactive builder moved to right after the title (user request
          2026-07-22) — the "choose a certificate / program path" container now
          precedes the co-reqs + requirements. */}
      {tier.builder ? (
        // The builder button keeps its own tint (spec = glossary blue, program
        // = purple) independent of the amber frame/text (user request 2026-07-18).
        (() => {
          const buildTint = builderTint;
          return (
            <Pressable
              style={[styles.buildBtn, { borderColor: buildTint }]}
              onPress={() => onBuild(tier.builder!)}
              accessibilityRole="button"
              accessibilityLabel={
                tier.builder === 'specializations' ? 'Choose a specialization certificate' : 'Choose a program path'
              }
            >
              <Text style={[styles.buildBtnText, { color: buildTint }]}>
                {tier.builder === 'specializations' ? 'CHOOSE A SPECIALIZATION CERTIFICATE' : 'CHOOSE A PROGRAM PATH'}
              </Text>
              <Text style={styles.buildBtnSummary}>{buildSummary ?? 'Tap to choose ›'}</Text>
            </Pressable>
          );
        })()
      ) : null}

      {/* CO-requisites and requirements side by side (user request 2026-07-18:
          these are co-reqs, taken alongside — not pre-reqs). Now BELOW the
          builder (user request 2026-07-22). */}
      {(tier.corequisite?.length || tier.requirements?.length) ? (
        <View style={styles.twoCol}>
          {tier.corequisite && tier.corequisite.length > 0 ? (
            <View style={[styles.group, styles.col]}>
              <Text style={[styles.groupHead, { color: accent }]}>CO-REQUISITES</Text>
              {tier.corequisite.map((r) => (
                <View key={r} style={styles.row}>
                  <Text style={[styles.check, { color: accent }]}>✓</Text>
                  <Text style={styles.rowText}>{r}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {tier.requirements && tier.requirements.length > 0 ? (
            <View style={[styles.group, styles.col]}>
              <Text style={[styles.groupHead, { color: accent }]}>REQUIREMENTS</Text>
              {tier.requirements.map((r) => (
                <View key={r} style={styles.row}>
                  <Text style={[styles.check, { color: accent }]}>✓</Text>
                  <Text style={styles.rowText}>{r}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {tier.programs && tier.programs.length > 0 ? (
        <View style={styles.group}>
          <Text style={[styles.groupHead, { color: accent }]}>PROGRAMS</Text>
          {tier.programs.map((p) => (
            <View key={p} style={styles.row}>
              <Text style={[styles.bulletDot, { color: accent }]}>•</Text>
              <Text style={styles.rowText}>{p}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {tier.perks && tier.perks.length > 0 ? (
        <View style={styles.group}>
          <Text style={[styles.groupHead, { color: accent }]}>GRADUATES RECEIVE</Text>
          {tier.perks.map((p) => (
            <View key={p} style={styles.row}>
              <Text style={[styles.bulletDot, { color: accent }]}>•</Text>
              <Text style={styles.rowText}>{p}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {tier.note ? <Text style={styles.note}>{tier.note}</Text> : null}

      {tier.policy ? (
        <View style={styles.policy}>
          <Pressable
            style={styles.policyHeader}
            onPress={() => setPolicyOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: policyOpen }}
            aria-expanded={policyOpen}
            accessibilityLabel={tier.policy.title}
          >
            <Text style={[styles.policyTitle, { color: accent }]}>{tier.policy.title.toUpperCase()}</Text>
            <Text style={[styles.policyChevron, { color: accent }]}>{policyOpen ? '▾' : '▸'}</Text>
          </Pressable>
          {policyOpen ? (
            <View style={styles.policyBody}>
              {tier.policy.paragraphs.map((para, i) => (
                <Text key={i} style={styles.policyPara}>
                  {para}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Chooser header (redesign 2026-09-15). CLOSE GRAMMAR — the chooser had THREE
 * "close" actions that all looked alike (a top-right ✕, a bottom DONE, and the
 * whole header as a tap-to-close), and users kept hitting the screen-level ✕
 * expecting it to collapse the card / close the image they had just opened.
 * Now exactly ONE screen exit, and it is the app's navigation grammar rather
 * than a glyph: a left-aligned "‹ BACK" that names WHERE it returns to. No ✕
 * anywhere on the chooser — that glyph belongs to the image viewer only — and
 * the header itself is no longer a tap target. It sits OUTSIDE the scroll, so
 * the exit is always on screen no matter how far down the A–Z list you are.
 */
// A light-highlight that traces LEFT→RIGHT through the "BACK TO …" text, matching
// the Home featured-card shimmer's timing (owner 2026-09-15): one pass every 37 s,
// ~1670 ms sweep, eased. No masked-view dep — a bright copy of the text is revealed
// through a narrow window that moves across, so the highlight registers to the glyphs.
const SWEEP_EVERY_MS = 37000;
const SWEEP_MS = 1670;
const SWEEP_BAND = 46;
function BackSweep({ label, tint }: { label: string; tint: string }) {
  const [w, setW] = useState(0);
  const x = useSharedValue(0);
  useEffect(() => {
    if (w <= 0) return;
    let alive = true;
    const run = () => { if (!alive) return; x.value = 0; x.value = withTiming(1, { duration: SWEEP_MS, easing: Easing.inOut(Easing.cubic) }); };
    const first = setTimeout(run, 1200);
    const iv = setInterval(run, SWEEP_EVERY_MS);
    return () => { alive = false; clearTimeout(first); clearInterval(iv); cancelAnimation(x); };
  }, [w, x]);
  const winStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -SWEEP_BAND + x.value * (w + SWEEP_BAND) }] }));
  const innerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: SWEEP_BAND - x.value * (w + SWEEP_BAND) }] }));
  return (
    <View style={styles.sweepWrap} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
      <Text style={[styles.backText, { color: tint }]}>{label}</Text>
      {w > 0 ? (
        <Animated.View pointerEvents="none" style={[styles.sweepWindow, winStyle]}>
          <Animated.Text numberOfLines={1} style={[styles.backText, styles.sweepBright, { width: w }, innerStyle]}>{label}</Animated.Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

function ChooserHeader({
  accent,
  backTint,
  backTo,
  title,
  sub,
  count,
  noun,
  onBack,
}: {
  accent: string;
  /** Colour of the "‹ BACK TO …" control ONLY (2026-09-15): the tint of the
   *  page it returns to — Certificates blue, Programs purple. */
  backTint: string;
  /** Destination named on the back control ("Certificates" / "Programs"). */
  backTo: string;
  title: string;
  sub: string;
  /** Catalog size for the meta readout; null while loading. */
  count: number | null;
  noun: string;
  onBack: () => void;
}) {
  return (
    <View style={[styles.chooserHead, { borderBottomColor: accent }]}>
      <Pressable
        onPress={onBack}
        hitSlop={{ top: 10, bottom: 10, left: 14, right: 20 }}
        accessibilityRole="button"
        accessibilityLabel={`Back to ${backTo}`}
        style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
      >
        <Text style={[styles.backChevron, { color: backTint }]}>‹</Text>
        <BackSweep label={`BACK TO ${backTo.toUpperCase()}`} tint={backTint} />
      </Pressable>
      <Text accessibilityRole="header" style={[styles.chooserTitle, { color: accent }]}>
        {title}
      </Text>
      <Text style={styles.chooserSub}>{sub}</Text>
      {count != null && count > 0 ? (
        <Text style={styles.chooserMeta}>
          {count} {noun} · A–Z
        </Text>
      ) : null}
    </View>
  );
}

/**
 * One flat chooser row (2026-09-15): small credential-art thumb (the Explore
 * topic-row grammar) + name (+ optional meta line) + a trailing › that says
 * "opens". Tapping anywhere on the row opens the credential popup; the row
 * itself never expands.
 */
function CredentialRow({
  slug,
  name,
  meta,
  accent,
  selected,
  onPress,
}: {
  slug: string;
  name: string;
  meta?: string;
  accent: string;
  /** The user's current pick for this level — a thin accent rule on the thumb. */
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}. Opens details`}
      style={({ pressed }) => [styles.credRow, pressed && styles.credRowPressed]}
    >
      <View style={[styles.credThumb, selected && { borderColor: accent }]}>
        <CardArt uri={credentialArtUrl(slug)} style={styles.credThumbFill} imageStyle={styles.credThumbImg} />
      </View>
      <View style={styles.credRowText}>
        <Text style={styles.credName}>{name}</Text>
        {meta ? <Text style={styles.credMeta}>{meta}</Text> : null}
      </View>
      <Text style={[styles.credChevron, { color: accent }]}>›</Text>
    </Pressable>
  );
}

/** One full-width award page (its own vertical scroll). */
function AwardPageView({
  page,
  onBuild,
  summaryForTier,
}: {
  page: AwardPage;
  onBuild: (kind: 'specializations' | 'programs') => void;
  summaryForTier: (tier: AwardTier) => string | undefined;
}) {
  const { width: screenW } = useWindowDimensions();
  return (
    <View style={{ width: screenW }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {page.introTitle ? <Text style={styles.introTitle}>{page.introTitle}</Text> : null}
        <Text style={styles.intro}>{page.intro}</Text>

        {page.tiers.map((tier) => (
          <TierBlock
            key={tier.title}
            tier={tier}
            // Program frame + inner text are amber; only its "choose a path"
            // button stays purple. Specialization keeps its gold, blue button
            // (user request 2026-07-18).
            accent={page.key === 'program' ? AMBER : page.accent}
            builderTint={page.key === 'specialization' ? GLOSSARY_BLUE : page.accent}
            onBuild={onBuild}
            buildSummary={summaryForTier(tier)}
          />
        ))}
        {/* Small, upfront grant requirement (user request 2026-07-22). */}
        {/* Gated on the real server flag — see AwardProgressScreen for the note. */}
        <Text style={styles.grantNote}>
          {CERTIFICATE_REQUIRES_EXAM
            ? 'A minimum of 1 complete month of paid membership is required before a certificate can be granted.'
            : // ⛔ NOT "as soon as their requirements are met" — that was my own
              //    wording earlier tonight and copy pass 2 was right to call it
              //    false. While certificate_requires_exam is false,
              //    evaluate_user_credentials takes a branch its own comment
              //    calls "deliberately still the stale" hardcoded draft list,
              //    which no v3 learner can satisfy. submit_final_exam is the
              //    only path that writes a credential_awards row.
              'Complete a certificate’s required topics, then pass its Final Exam — the certificate is issued to your record straight away.'}
        </Text>
      </ScrollView>
    </View>
  );
}

export function AwardsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const startIdx = Math.max(0, PAGE_ORDER.indexOf(route.params.category as PageKey));
  const [idx, setIdx] = useState(startIdx);
  // Lock the pager swipe once settled on Enrollments. Flipped only AFTER a swipe
  // fully settles (onMomentumScrollEnd) or a deliberate tab/jump, so ENTERING the
  // page never freezes it mid-snap.
  const [swipeLocked, setSwipeLocked] = useState(startIdx === ENROLLMENT_IDX);
  const listRef = useRef<FlatList<PageKey>>(null);

  /**
   * Move the pager to a page. USE THIS, NEVER `navigate('Awards', …)`.
   *
   * ⛔ WHY THIS EXISTS. Every page of this screen — including the Enrollments
   * view — is rendered INSIDE this pager, so anything on them that called
   * `navigation.navigate('Awards', { category })` was navigating to the route
   * it was already on. React Navigation 7 reuses a focused route with the same
   * key and merely swaps its params; the component does not remount. And
   * `startIdx` is read from `route.params.category` exactly once, into
   * `useState`, with no effect watching it — so the swapped param was read by
   * nobody and the button did nothing at all.
   *
   * It killed two real buttons: the glowing "FINAL EXAM · EARN CERTIFICATE
   * AWARD" on the Enrollments page — dead for precisely the learner who had
   * just finished a certificate — and "GO TO MY ENROLLMENTS" in the credential
   * popup. Both looked wired, because the identical call works from Home,
   * where the route is genuinely not focused yet.
   *
   * A callback cannot silently no-op the way a repeat navigate() does, which
   * is why the page passes this down (as `CurriculumView` already did) instead
   * of letting children route to themselves.
   */
  const goToPage = useCallback((key: PageKey) => {
    const i = PAGE_ORDER.indexOf(key);
    if (i < 0) return;
    setIdx(i);
    // Landing on Enrollments locks the swipe (exit via Home) — same rule the
    // picker flow applies, kept here so every jump agrees.
    if (i === ENROLLMENT_IDX) setSwipeLocked(true);
    // Instant jump so it does not flash through the pages in between.
    requestAnimationFrame(() => listRef.current?.scrollToIndex({ index: i, animated: false }));
  }, []);

  // A paged list keeps its scroll offset in PIXELS, so when the window width
  // changes under it (rotation, iPad Split View) the content re-lays out at the
  // new page width while the offset stays where it was - and the pager settles
  // straddling two pages, with the tab strip lit for whichever one wins the
  // rounding. Re-snap to the page the user was actually on. Skipped on mount so
  // it never fights `initialScrollIndex`.
  const lastPagerW = useRef(0);
  useEffect(() => {
    if (lastPagerW.current === 0) { lastPagerW.current = screenW; return; }
    if (lastPagerW.current === screenW) return;
    lastPagerW.current = screenW;
    // After the re-layout has been committed at the new width, not before.
    requestAnimationFrame(() => listRef.current?.scrollToIndex({ index: idx, animated: false }));
  }, [screenW, idx]);

  // Account signal — anonymous = no account (selections won't be saved).
  // GATED ON `resolved` (entitlement roll-out 2026-09-11): the provider boots at
  // 'anonymous' and only flips once the server read lands, so an ungated read
  // meant a signed-in member who picked in that window wrote nothing — and, if
  // the read then failed, never wrote at all. We deliberately do NOT write
  // optimistically: a guest must leave no local preference behind (no-tracking
  // promise). Instead the pick is re-persisted by the effect below the moment
  // the tier resolves to a real account.
  const { entitlement, resolved } = useEntitlement();
  const hasAccount = resolved && entitlement !== 'anonymous';

  // Builder selections (user request 2026-07-18): a Specialization Certificate
  // (Level 1) + an Academy Program Certificate (Level 2) — each chosen from its
  // catalog. Persisted only when there's an account.
  const [specCert, setSpecCert] = useState<string | null>(null);
  const [programPath, setProgramPath] = useState<string | null>(null);
  const [picker, setPicker] = useState<'specializations' | 'programs' | null>(null);
  // The credential whose popup is open (2026-09-15) — replaces the accordion
  // expanded-card state + its auto-scroll-to-top machinery, which had nothing
  // left to scroll once rows stopped expanding in place.
  const [detail, setDetail] = useState<CredentialDetail | null>(null);

  // LIVE v3 certificates + programs (owner 2026-08-06) — replace the retired v2
  // award data; aliased to the field names the picker/render already use.
  const [v3Programs, setV3Programs] = useState<V3Credential[]>([]);
  const [v3Certs, setV3Certs] = useState<V3Credential[]>([]);
  // v3 gs → topic name (same source Explore uses). The award tables store only
  // gs numbers; names resolve off the live v3 curriculum (owner 2026-08-11).
  const [v3TopicNames, setV3TopicNames] = useState<Map<number, string>>(new Map());
  // Distinguishes "still loading" from "genuinely empty" so the pickers can show
  // an honest empty state instead of just the REQUIRED-CORE banner over blank.
  const [v3Loaded, setV3Loaded] = useState(false);
  useEffect(() => {
    let alive = true;
    void Promise.all([fetchV3Programs(), fetchV3Certs()]).then(([p, c]) => {
      if (!alive) return;
      setV3Programs(p);
      setV3Certs(c);
      setV3Loaded(true);
    });
    void fetchV3Curriculum().then((fields) => {
      if (!alive) return;
      setV3TopicNames(new Map(flattenV3(fields).map((t) => [t.gs, t.name] as const)));
    });
    return () => {
      alive = false;
    };
  }, []);
  // Both award catalogs listed A–Z by name (user request 2026-07-22).
  const specCertsAZ = useMemo(
    () =>
      v3Certs
        .map((c) => ({ id: c.id, slug: c.slug, name: c.name, specializationTopics: c.topicsGs }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [v3Certs],
  );
  const programPathsAZ = useMemo(
    () =>
      v3Programs
        .map((p) => ({ id: p.id, slug: p.slug, name: p.name, requiredTopics: p.topicsGs, electiveChooseOne: p.electivesGs ?? [] }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [v3Programs],
  );

  useEffect(() => {
    AsyncStorage.getItem(SPEC_CERT_KEY).then((v) => {
      if (v) setSpecCert(v);
    });
    AsyncStorage.getItem(PROGRAM_PATH_KEY).then((v) => {
      if (v) setProgramPath(v);
    });
    // Dev Visual Index: auto-open a picker for preview (TEMPORARY).
    if (consumeDevPreview('awards:specPicker')) setPicker('specializations');
    else if (consumeDevPreview('awards:programPicker')) setPicker('programs');
  }, []);

  // RE-PERSIST ONCE THE TIER RESOLVES. A pick made while the entitlement read
  // was still in flight was silently dropped (the write is account-gated, and
  // the provider reads 'anonymous' until the server answers). Writing
  // optimistically would leave a local preference behind for someone who turns
  // out to be a guest, so the write is simply repeated the moment the account
  // is confirmed. Idempotent: AsyncStorage.setItem with the value already
  // stored is a no-op, so the common case re-writes what is already there.
  useEffect(() => {
    if (!hasAccount) return;
    if (specCert) void AsyncStorage.setItem(SPEC_CERT_KEY, specCert).catch(() => {});
    if (programPath) void AsyncStorage.setItem(PROGRAM_PATH_KEY, programPath).catch(() => {});
  }, [hasAccount, specCert, programPath]);

  // Tapping a row opens that credential's popup AND records it as the current
  // selection for its level (same persistence the inline cards had).
  const openCert = (c: (typeof specCertsAZ)[number]) => {
    setSpecCert(c.name);
    if (hasAccount) void AsyncStorage.setItem(SPEC_CERT_KEY, c.name).catch(() => {});
    setDetail({ kind: 'certificate', id: c.id, slug: c.slug, name: c.name, topics: c.specializationTopics, electives: [] });
  };
  const openProg = (p: (typeof programPathsAZ)[number]) => {
    setProgramPath(p.name);
    if (hasAccount) void AsyncStorage.setItem(PROGRAM_PATH_KEY, p.name).catch(() => {});
    setDetail({ kind: 'program', id: p.id, slug: p.slug, name: p.name, topics: p.requiredTopics, electives: p.electiveChooseOne });
  };
  // Swipe pager (2026-09-15): the open credential's neighbours in the A–Z list
  // + a step handler. Stepping goes through openCert / openProg, so the open
  // credential stays the recorded pick for its level (same invariant a row tap
  // keeps). Clamped at both ends — no wrap (null neighbour).
  const certDetail = (c: (typeof specCertsAZ)[number]): CredentialDetail => ({
    kind: 'certificate', id: c.id, slug: c.slug, name: c.name, topics: c.specializationTopics, electives: [],
  });
  const progDetail = (p: (typeof programPathsAZ)[number]): CredentialDetail => ({
    kind: 'program', id: p.id, slug: p.slug, name: p.name, topics: p.requiredTopics, electives: p.electiveChooseOne,
  });
  const detailNeighbors = (() => {
    const empty = { prev: null as CredentialDetail | null, next: null as CredentialDetail | null };
    if (!detail) return empty;
    if (detail.kind === 'certificate') {
      const i = specCertsAZ.findIndex((c) => c.id === detail.id);
      if (i < 0) return empty;
      return {
        prev: i > 0 ? certDetail(specCertsAZ[i - 1]) : null,
        next: i < specCertsAZ.length - 1 ? certDetail(specCertsAZ[i + 1]) : null,
      };
    }
    const i = programPathsAZ.findIndex((p) => p.id === detail.id);
    if (i < 0) return empty;
    return {
      prev: i > 0 ? progDetail(programPathsAZ[i - 1]) : null,
      next: i < programPathsAZ.length - 1 ? progDetail(programPathsAZ[i + 1]) : null,
    };
  })();
  const onDetailStep = (dir: 1 | -1) => {
    if (!detail) return;
    if (detail.kind === 'certificate') {
      const i = specCertsAZ.findIndex((c) => c.id === detail.id);
      const to = i + dir;
      if (i >= 0 && to >= 0 && to < specCertsAZ.length) openCert(specCertsAZ[to]);
    } else {
      const i = programPathsAZ.findIndex((p) => p.id === detail.id);
      const to = i + dir;
      if (i >= 0 && to >= 0 && to < programPathsAZ.length) openProg(programPathsAZ[to]);
    }
  };

  // Topic name lookup: v3 curriculum first (the award tables use v3 gs), then
  // the codified-name fallback.
  // gs3081 is the lab-proxy topic that exists only server-side (owner
  // 2026-08-30 core swap) — without this fallback the REQUIRED CORE banner
  // read "Topic gs3081" (QA night 2026-08-31).
  const nameForGs = (gs: number) => officialTopicName(gs, v3TopicNames.get(gs));

  const summaryForTier = (tier: AwardTier): string | undefined => {
    if (tier.builder === 'specializations') return specCert ? `Certificate: ${specCert}` : undefined;
    if (tier.builder === 'programs') return programPath ? `Path: ${programPath}` : undefined;
    return undefined;
  };

  // ENROLL (user request 2026-07-22): add the award's topics to the enrollment
  // list, close the picker, and jump to the Enrollment page for EVERYONE. A free
  // user with NO account (anonymous) also gets an "account needed to save" prompt.
  const [payPrompt, setPayPrompt] = useState<{ label: string } | null>(null);
  const enrollTopics = useCallback(
    (gsList: number[], label: string, kind?: BundleKind) => {
      // Selecting a certificate/program = the "ADD ALL" action in the Enrollment
      // browser (user request 2026-07-22): record the bundle container AND enroll
      // its topics (added, not loaded onto the Dashboard until LOAD).
      if (kind) {
        addBundle(kind, label, gsList);
        addTopics(gsList);
        setActiveMany(gsList, false);
        // The required cores join the list on the first cert/program (user
        // request 2026-07-22).
        addTopics([...COREQ_TOPIC_GS]);
      } else {
        addTopics(gsList);
      }
      setDetail(null); // close the credential popup
      setPicker(null); // close the cert/program picker modal
      const ei = ENROLLMENT_IDX;
      setIdx(ei);
      setSwipeLocked(true); // landing on Enrollments locks the swipe (exit via Home)
      // Instant jump so it doesn't flash through the Directory page en route.
      requestAnimationFrame(() => listRef.current?.scrollToIndex({ index: ei, animated: false }));
      // `resolved` matters here: EntitlementProvider defaults to 'anonymous',
      // and this screen has no top-level resolved guard, so it is interactive
      // the instant it mounts. Without this check a paying member who picks a
      // certificate before the entitlement read lands is told their choices
      // "won't be saved without an account" — false, and alarming. (The pick
      // itself was never at risk; the re-persist effect below already rewrites
      // it once the tier resolves.)
      if (resolved && entitlement === 'anonymous') setPayPrompt({ label });
    },
    [entitlement, resolved],
  );

  // Popup actions (2026-09-15) — the SAME calls the inline card buttons made.
  const enrollFromDetail = useCallback(
    (c: CredentialDetail) => enrollTopics(c.topics, c.name, c.kind === 'certificate' ? 'cert' : 'program'),
    [enrollTopics],
  );

  // In-place enrol/unenrol for the credential popup (owner 2026-09-16): toggle
  // the credential WITHOUT closing the popup or navigating to Enrollments —
  // mirrors the topic view. Reflected live via the bundle store.
  const bundles = useBundles();
  const bundleKeys = useMemo(() => new Set(bundles.map((b) => b.key)), [bundles]);
  const credKey = useCallback(
    (c: CredentialDetail) => bundleKey(c.kind === 'certificate' ? 'cert' : 'program', c.name),
    [],
  );
  const isCredEnrolled = useCallback((c: CredentialDetail) => bundleKeys.has(credKey(c)), [bundleKeys, credKey]);
  const toggleEnrollInPlace = useCallback(
    (c: CredentialDetail) => {
      const kind: BundleKind = c.kind === 'certificate' ? 'cert' : 'program';
      if (bundleKeys.has(credKey(c))) {
        // Un-enrol: drop the bundle record. Leave the shared topics enrolled so
        // other bundles that use them are unaffected (managed in Enrollments).
        removeBundle(credKey(c));
        return;
      }
      addBundle(kind, c.name, c.topics);
      addTopics(c.topics);
      setActiveMany(c.topics, false);
      addTopics([...COREQ_TOPIC_GS]);
      if (resolved && entitlement === 'anonymous') setPayPrompt({ label: c.name });
    },
    [bundleKeys, credKey, resolved, entitlement],
  );
  /**
   * STUDY NOW / GO TO MY ENROLLMENTS — the two onward doors that open once a
   * credential is enrolled (owner 2026-09-19). Both close the modal AND the
   * picker first, or the pushed screen lands behind them.
   *
   * `focusGs` takes the credential's FIRST topic: the dashboard opens already
   * loaded rather than on whatever was last viewed, which is the whole point
   * of the button.
   */
  const studyFromDetail = useCallback(
    (c: CredentialDetail) => {
      setDetail(null);
      setPicker(null);
      const first = c.topics[0];
      /* popTo, not navigate — same rule the rest of this screen follows. RN7
         pushes a SECOND tab shell on a navigate to a non-focused route, so
         Back returns to a duplicate Awards pager instead of leaving. */
      (navigation as unknown as { popTo: (name: string, params?: object) => void }).popTo('Main', {
        screen: 'Study',
        params: { screen: 'Dashboard', params: first != null ? { focusGs: first } : undefined },
      });
    },
    [navigation],
  );

  const enrollmentsFromDetail = useCallback(() => {
    setDetail(null);
    setPicker(null);
    // Was navigate('Awards', …) — a no-op from inside this very screen. See goToPage.
    goToPage('enrollment');
  }, [goToPage]);

  const progressFromDetail = useCallback(
    (c: CredentialDetail) => {
      setDetail(null);
      setPicker(null); // close the picker modal so the pushed screen is visible
      navigation.navigate('AwardProgress', {
        awardType: c.kind,
        awardId: c.id,
        awardName: c.name,
      });
    },
    [navigation],
  );

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const i = viewableItems[0]?.index;
    if (i != null) setIdx(i);
  }).current;

  const currentKey = PAGE_ORDER[idx];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      {/* The shared compact header (extracted from this very screen,
          2026-09-19). Logo, wordmark, HOME — and HOME's `popTo` rule now
          lives inside the component rather than in a comment here, which is
          what stops the next copy getting it wrong.

          ⚠️ The two `BrandLogo size={30}` sub-views further down this file
          are NOT this pattern and were deliberately left alone. */}
      <CompactBrandBar />
      {/* The whole title area (below the logo, above the page buttons) is still a
          return action (user request 2026-07-18). */}
      <Pressable
        style={styles.header}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Return"
      >
        <View style={{ flex: 1 }}>
          {/* Amber titles; now full sentence headlines (user request 2026-07-22)
              so they wrap / shrink to fit. */}
          <Text style={[styles.title, { color: AMBER }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
            {pageHeadline(currentKey)}
          </Text>
        </View>
        {/* Consistent per-screen help (Pillar C), Enrollments page only —
            lands in the hub with the enrollment answers surfaced (LOADED/
            UNLOADED, add/remove, reorder, meters, HOME SETUP). */}
        {currentKey === 'enrollment' ? <HelpKey search="enroll" /> : null}
      </Pressable>

      {/* Category buttons (user request 2026-07-18): CURRICULUM · SPECIALIZATION
          · PROGRAM — tap to switch between the three side-by-side pages. */}
      <View style={styles.tabRow} accessibilityRole="tablist">
        {PAGE_ORDER.map((c, i) => {
          const active = i === idx;
          const tint = pageTint(c);
          return (
            <Pressable
              key={c}
              onPress={() => {
                setIdx(i);
                setSwipeLocked(i === ENROLLMENT_IDX);
                // Jump straight to the tapped page (animated:false) — an animated
                // scroll slides THROUGH the in-between pages and onViewable flips
                // the title/tab highlight through each, which read as a flash.
                listRef.current?.scrollToIndex({ index: i, animated: false });
              }}
              style={[styles.tabBtn, active && { borderColor: tint, backgroundColor: '#1a1a1a' }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              aria-selected={active}
              accessibilityLabel={pageHeadline(c)}
            >
              {/* 5 tabs now (Directory + Enrollment added 2026-07-22) —
                  shrink-to-fit keeps the longest label (SPECIALIZATION) on one
                  line even in the narrower slots. */}
              <Text
                style={[styles.tabBtnText, active && { color: tint }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.55}
              >
                {pageLabel(c)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        ref={listRef}
        data={PAGE_ORDER as readonly PageKey[]}
        style={{ flex: 1 }}
        horizontal
        pagingEnabled
        scrollEnabled={!swipeLocked}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c}
        initialScrollIndex={startIdx}
        getItemLayout={(_d, i) => ({ length: screenW, offset: screenW * i, index: i })}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / screenW);
          setIdx(i);
          setSwipeLocked(i === ENROLLMENT_IDX);
        }}
        renderItem={({ item }) =>
          item === 'curriculum' ? (
            <View style={{ width: screenW }}>
              <CurriculumView
                showBrand={false}
                onOpenCategory={(key) => {
                  const i = PAGE_ORDER.indexOf(key);
                  if (i >= 0) {
                    setIdx(i);
                    // Instant jump (no flash through intermediate pages).
                    listRef.current?.scrollToIndex({ index: i, animated: false });
                  }
                }}
              />
            </View>
          ) : item === 'directory' ? (
            <View style={{ width: screenW }}>
              <DirectoryView showBrand={false} />
            </View>
          ) : item === 'enrollment' ? (
            <View style={{ width: screenW }}>
              <EnrollmentView showBrand={false} onOpenCategory={goToPage} />
            </View>
          ) : (
            <AwardPageView page={awardPage(item)} onBuild={setPicker} summaryForTier={summaryForTier} />
          )
        }
      />

      {/* LEVEL 1 — choose one Specialization Certificate (user request 2026-07-18):
          each = the COREQ_TOPIC_GS core topics and lab + that certificate's own
          specialization topics. NOTE: the list rendered here is `specCertsAZ`,
          which comes from the LIVE v3 backend (fetchV3Certs) — NOT the legacy
          68-entry SPECIALIZED_CERTS array in awardsData.ts, which is marked
          PARTIALLY DEAD. Don't restate "68", "3 core" or "3 specialization
          topics" here; all three drifted and were corrected in [18]/[18b]. */}
      <Modal accessibilityViewIsModal visible={picker === 'specializations'} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setPicker(null)}>
        <View style={[styles.pickerRoot, { paddingTop: insets.top }]}>
          <View style={styles.brandRow}>
            <BrandLogo size={30} />
            <Text style={styles.brandWordmark}>
              PRO AUDIO <Text style={styles.brandAccent}>TRAINING ACADEMY</Text>
            </Text>
          </View>
          {/* ⚠️ 2026-09-20: deriving the count from COREQ_TOPIC_GS.length printed
              "the 4 core courses", while the intro block on this same page says
              "three required core topics and one training lab". 3081 is the
              Audio Fundamentals LAB proxy, not a topic, so the derived count was
              the wrong shape, not just the wrong word. Stated literally, matching
              the intro. If COREQ_TOPIC_GS changes, both must change together.
              [18] (2026-09-11): the core count was derived from COREQ_TOPIC_GS so
              it can never contradict the REQUIRED CORE banner below; no claim is
              made about the (variable) specialization-topic count. */}
          <ChooserHeader
            accent={GLOSSARY_BLUE}
            backTint={GLOSSARY_BLUE}
            backTo="Certificates"
            title="CHOOSE A SPECIALIZATION CERTIFICATE"
            sub={`A focused credential: the 3 core topics and 1 training lab every student completes (shown below), plus a short, specialized topic set. Choose one to work toward.`}
            count={v3Loaded ? specCertsAZ.length : null}
            noun="certificates"
            onBack={() => setPicker(null)}
          />
          <ScrollView contentContainerStyle={[styles.pickerScroll, { paddingBottom: insets.bottom + 28 }]}>
            {/* Required core — stated ONCE for all certificates (user request
                2026-07-18) instead of repeated on every award. */}
            <View style={styles.coreBanner}>
              <Text style={styles.coreBannerHead}>REQUIRED CORE · EVERY CERTIFICATE</Text>
              <Text style={styles.coreBannerText}>{COREQ_TOPIC_GS.map((gs) => nameForGs(gs)).join('  ·  ')}</Text>
            </View>

            {specCertsAZ.length === 0 ? (
              <Text style={styles.awardsEmpty}>
                {v3Loaded
                  ? 'Specialization certificates aren’t available right now. Pull up again in a moment, or check your connection.'
                  : 'Loading certificates…'}
              </Text>
            ) : null}

            {/* Flat rows (2026-09-15): tap → CredentialDetailModal. */}
            {specCertsAZ.map((c) => (
              <CredentialRow
                key={c.name}
                slug={c.slug}
                name={c.name}
                accent={AMBER}
                selected={specCert === c.name}
                onPress={() => openCert(c)}
              />
            ))}
          </ScrollView>
          {/* No bottom DONE (2026-09-15): it duplicated the screen exit and
              read as an item-level close. The single exit is ‹ BACK, above. */}
        </View>
        {/* The credential popup is NESTED in the picker modal (like the old
            thumb's viewer) so iOS presents it on top of the picker. ENROLL and
            VIEW PROGRESS call the same handlers the inline cards did. */}
        <CredentialDetailModal
          credential={detail?.kind === 'certificate' ? detail : null}
          accent={GLOSSARY_BLUE}
          coreCount={COREQ_TOPIC_GS.length}
          nameForGs={nameForGs}
          prev={detail?.kind === 'certificate' ? detailNeighbors.prev : null}
          next={detail?.kind === 'certificate' ? detailNeighbors.next : null}
          onStep={detail?.kind === 'certificate' ? onDetailStep : undefined}
          onEnroll={toggleEnrollInPlace}
          isEnrolled={isCredEnrolled}
          onProgress={progressFromDetail}
          onStudy={hasAccount ? studyFromDetail : undefined}
          onEnrollments={hasAccount ? enrollmentsFromDetail : undefined}
          /* INSIDE the Modal on purpose: a sibling Modal attaches to the
             activity window and is drawn BENEATH this card on Android.
             See components/PrePaywallPrompt. */
          overlay={
            <PrePaywallPrompt
              embedded
              visible={!!payPrompt}
              onClose={() => setPayPrompt(null)}
              title="Heads up"
              lines={[
                'Your choices won’t be saved without an account.',
                'Enrolling is free to do and always included — one membership covers every topic and certificate, however many you pick.',
              ]}
            />
          }
          onClose={() => setDetail(null)}
        />
        <LowLightDim />
      </Modal>

      {/* LEVEL 2 — choose an established Program Path (TBD course sets). */}
      <Modal accessibilityViewIsModal visible={picker === 'programs'} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setPicker(null)}>
        <View style={[styles.pickerRoot, { paddingTop: insets.top }]}>
          <View style={styles.brandRow}>
            <BrandLogo size={30} />
            <Text style={styles.brandWordmark}>
              PRO AUDIO <Text style={styles.brandAccent}>TRAINING ACADEMY</Text>
            </Text>
          </View>
          {/* [18b] (2026-09-11): core count derived from COREQ_TOPIC_GS (twin of
              [18]) so it can't drift from the banner or the per-program total. */}
          <ChooserHeader
            accent={PURPLE}
            backTint={PURPLE}
            backTo="Programs"
            title="CHOOSE A PROGRAM PATH"
            sub={`A comprehensive credential: the 3 core topics and 1 training lab every student completes (shown below), plus a broad topic set across the discipline. Choose one to work toward.`}
            count={v3Loaded ? programPathsAZ.length : null}
            noun="program paths"
            onBack={() => setPicker(null)}
          />
          <ScrollView contentContainerStyle={[styles.pickerScroll, { paddingBottom: insets.bottom + 28 }]}>
            {/* Required core — stated ONCE for all programs (user request
                2026-07-18) instead of repeated on every award. */}
            <View style={styles.coreBanner}>
              <Text style={styles.coreBannerHead}>REQUIRED CORE · EVERY PROGRAM</Text>
              <Text style={styles.coreBannerText}>{COREQ_TOPIC_GS.map((gs) => nameForGs(gs)).join('  ·  ')}</Text>
            </View>

            {programPathsAZ.length === 0 ? (
              <Text style={styles.awardsEmpty}>
                {v3Loaded
                  ? 'Program paths aren’t available right now. Pull up again in a moment, or check your connection.'
                  : 'Loading program paths…'}
              </Text>
            ) : null}

            {/* Flat rows (2026-09-15): tap → CredentialDetailModal. The meta
                line keeps the per-program total (core + required) it always had. */}
            {programPathsAZ.map((p) => (
              <CredentialRow
                key={p.name}
                slug={p.slug}
                name={p.name}
                meta={`${COREQ_TOPIC_GS.length + p.requiredTopics.length} required topics${p.electiveChooseOne.length ? ' + 1 elective' : ''}`}
                accent={PURPLE}
                selected={programPath === p.name}
                onPress={() => openProg(p)}
              />
            ))}
          </ScrollView>
          {/* No bottom DONE — see the certificate chooser above. */}
        </View>
        <CredentialDetailModal
          credential={detail?.kind === 'program' ? detail : null}
          accent={PURPLE}
          coreCount={COREQ_TOPIC_GS.length}
          nameForGs={nameForGs}
          prev={detail?.kind === 'program' ? detailNeighbors.prev : null}
          next={detail?.kind === 'program' ? detailNeighbors.next : null}
          onStep={detail?.kind === 'program' ? onDetailStep : undefined}
          onEnroll={toggleEnrollInPlace}
          isEnrolled={isCredEnrolled}
          onProgress={progressFromDetail}
          onStudy={hasAccount ? studyFromDetail : undefined}
          onEnrollments={hasAccount ? enrollmentsFromDetail : undefined}
          /* INSIDE the Modal on purpose: a sibling Modal attaches to the
             activity window and is drawn BENEATH this card on Android.
             See components/PrePaywallPrompt. */
          overlay={
            <PrePaywallPrompt
              embedded
              visible={!!payPrompt}
              onClose={() => setPayPrompt(null)}
              title="Heads up"
              lines={[
                'Your choices won’t be saved without an account.',
                'Enrolling is free to do and always included — one membership covers every topic and certificate, however many you pick.',
              ]}
            />
          }
          onClose={() => setDetail(null)}
        />
        <LowLightDim />
      </Modal>

      {/* Anonymous ENROLL → brief "won't be saved" notice (user request
          2026-07-22). Dismiss-only; no account/plans link. */}
      {/* Root level: ONLY for the trigger that fires with no detail card open
          (picking a credential straight from the pager). When a detail card is
          open the embedded copy inside it shows instead — never both. */}
      <PrePaywallPrompt
        visible={!!payPrompt && !detail}
        onClose={() => setPayPrompt(null)}
        title="Heads up"
        lines={[
          'Your choices won’t be saved without an account.',
          'Enrolling is free to do and always included — one membership covers every topic and certificate, however many you pick.',
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  /* ⚠️ STILL USED — by the two picker MODALS below, which carry a
     BrandLogo size={30} and no HOME and are NOT the CompactBrandBar
     pattern. The screen's own header moved to that component. */
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 14, paddingRight: 6, paddingBottom: 8 },
  brandWordmark: { flexShrink: 1, fontFamily: fonts.oswaldBold, fontSize: 14, letterSpacing: 0.6, color: colors.textPrimary },
  brandAccent: { fontFamily: fonts.oswaldMedium, color: colors.amber },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingBottom: 8 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, letterSpacing: 0.4, lineHeight: 24 },
  // Category buttons (replaced the readout dots, user request 2026-07-18).
  tabRow: { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingHorizontal: 12, paddingBottom: 10 },
  tabBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#131313',
  },
  tabBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textSub, textAlign: 'center' },

  // paddingTop bumped so the first title clears the pager tab row (user request
  // 2026-07-22) — applies to the Certificate + Program pages (they use this scroll).
  scroll: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 44, gap: 16 },

  introTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 19,
    letterSpacing: 0.4,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  intro: { fontFamily: fonts.barlowMedium, fontSize: 16.5, lineHeight: 26, color: colors.textSecondary },
  // Small, upfront certificate-grant requirement (user request 2026-07-22).
  grantNote: { fontFamily: fonts.barlowMedium, fontStyle: 'italic', fontSize: 12.5, lineHeight: 18, color: colors.textSub, marginTop: 2 },

  tier: {
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#17181a',
    padding: 18,
    gap: 12,
  },
  tierTitle: { fontFamily: fonts.oswaldMedium, fontSize: 21, lineHeight: 26, color: colors.textPrimary },

  // Pre-reqs | Requirements side by side; each column wraps its own list.
  twoCol: { flexDirection: 'row', gap: 16, marginTop: 3 },
  col: { flex: 1 },
  group: { gap: 7, marginTop: 3 },
  groupHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.8 },
  row: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  check: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, lineHeight: 23, width: 15 },
  bulletDot: { fontFamily: fonts.barlowRegular, fontSize: 17, lineHeight: 23, width: 15 },
  rowText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 15.5, lineHeight: 24, color: colors.textSecondary },

  note: {
    fontFamily: fonts.barlowMedium,
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Collapsible policy section, set off by a rule.
  policy: { marginTop: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2b2d' },
  policyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  policyTitle: { flex: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.4 },
  policyChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 13 },
  policyBody: { gap: 9, marginTop: 10 },
  policyPara: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 22, color: '#c4c4c4' },

  // Interactive builder button + pickers (user request 2026-07-18).
  buildBtn: {
    marginTop: 4,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,.03)',
    gap: 3,
  },
  buildBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8 },
  buildBtnSummary: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSub },

  pickerRoot: { flex: 1, backgroundColor: '#0d0d0f' },
  // Chooser header (2026-09-15): fixed above the scroll; a 2px accent rule
  // under it is the one place the cert-amber / program-purple identity is
  // stated at screen level.
  chooserHead: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 14,
    gap: 4,
    borderBottomWidth: 2,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 6, marginLeft: -2, marginBottom: 6 },
  backBtnPressed: { opacity: 0.6 },
  backChevron: { fontFamily: fonts.oswaldMedium, fontSize: 22, lineHeight: 24, color: colors.textSub, marginTop: -2 },
  backText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.8, color: colors.textSub },
  // Left→right highlight sweep on the BACK label (matches Home card shimmer).
  sweepWrap: { position: 'relative', overflow: 'hidden' },
  sweepWindow: { position: 'absolute', top: 0, bottom: 0, left: 0, width: SWEEP_BAND, overflow: 'hidden' },
  // A soft glow so the white sweep reads over ANY tint — on the light Glossary
  // blue (#5bb0ff) a plain white pass was nearly invisible; the glow makes the
  // shimmer register on both the blue (Certificates) and purple (Programs) back
  // text (owner 2026-09-16).
  sweepBright: { color: '#ffffff', textShadowColor: 'rgba(255,255,255,0.95)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 7 },
  chooserTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, lineHeight: 26, letterSpacing: 1.2 },
  chooserSub: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSub },
  chooserMeta: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0.4, color: colors.textMuted, marginTop: 4 },
  // Flat chooser rows (2026-09-15): a hairline-separated list, not cards, so
  // the catalog reads as an A–Z index the popup opens from. The thumb takes the
  // accent only on the user's current pick.
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineDim,
  },
  credRowPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  credThumb: { width: 44, height: 44, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0e0e0e' },
  credThumbFill: { width: '100%', height: '100%' },
  credThumbImg: { borderRadius: 7 },
  credRowText: { flex: 1, gap: 1 },
  credName: { fontFamily: fonts.oswaldMedium, fontSize: 16.5, lineHeight: 21, color: colors.textPrimary },
  credMeta: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub },
  credChevron: { fontFamily: fonts.oswaldMedium, fontSize: 22, lineHeight: 24, opacity: 0.8, paddingRight: 4 },
  pickerWarn: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13,
    color: '#ffb43a',
    backgroundColor: '#241a05',
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  pickerScroll: { paddingHorizontal: 18, paddingTop: 10, gap: 6 },
  pickerGroup: { marginTop: 10, gap: 2 },
  pickerGroupHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amberLabel, marginBottom: 4 },
  pickerRow: { flexDirection: 'row', gap: 11, alignItems: 'center', paddingVertical: 7 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#4a4a4a',
    backgroundColor: '#0e0e0e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { borderColor: 'rgba(255,198,77,.9)', backgroundColor: 'rgba(255,198,77,.18)' },
  checkboxDim: { opacity: 0.4 },
  checkMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: '#ffc64d' },
  pickerRowText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 15, color: colors.textSecondary },
  pickerRowDim: { color: colors.textMuted },

  // Required-core banner shown once atop each picker (user request 2026-07-18).
  coreBanner: {
    borderWidth: 1,
    borderColor: '#3aa657', // green (user request 2026-07-18)
    borderRadius: 10,
    backgroundColor: '#101010',
    padding: 12,
    gap: 3,
    marginBottom: 4,
  },
  coreBannerHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.6, color: colors.textSub },
  coreBannerText: { fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  awardsEmpty: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  // The ENROLL / VIEW PROGRESS buttons + topic lists now live in
  // CredentialDetailModal (2026-09-15).
});
