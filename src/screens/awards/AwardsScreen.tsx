/**
 * AwardsScreen — the two Award levels (Specialization Certificate · Professional
 * Certificate Program) as a horizontal SWIPE pager: open lands on the tapped
 * category, swipe left/right moves between them. No diploma / master tiers (user
 * request 2026-07-18). Content is data-only (awardsData.ts). Bottom nav hidden;
 * back chevron exits.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View, type ViewToken } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import { BrandLogo } from '../../components/BrandLogo';
import { NavIcon } from '../../components/nav/NavIcon';
import { PrePaywallPrompt } from '../../components/PrePaywallPrompt';
import { LowLightDim } from '../../features/settings/LowLightLayer';
import { consumeDevPreview } from '../../features/dev/devPreview';
import { CurriculumView } from '../curriculum/CurriculumScreen';
import { DirectoryView } from '../directory/DirectoryScreen';
import { EnrollmentView } from '../enrollment/EnrollmentScreen';
import { addTopics, setActiveMany } from '../../features/enrollment/enrollmentStore';
import { addBundle, type BundleKind } from '../../features/enrollment/enrolledBundlesStore';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { MATRIX_SUBJECTS } from '../../data/courseTopicMatrix';
import {
  awardPage,
  AWARD_ORDER,
  COREQ_TOPIC_GS,
  PROGRAM_PATHS,
  SPECIALIZED_CERTIFICATES,
  type AwardPage,
  type AwardTier,
} from './awardsData';
import type { RootStackParamList } from '../../navigation/types';

const SPEC_CERT_KEY = 'ape:specCert'; // chosen Specialized Certificate name (Level 1)
const PROGRAM_PATH_KEY = 'ape:programPath'; // chosen program path name (Level 2)

type Props = NativeStackScreenProps<RootStackParamList, 'Awards'>;

const { width: SCREEN_W } = Dimensions.get('window');

// Glossary blue — matches the Glossary card on Course Selection (user request
// 2026-07-18); used for the Specialized Certificate builder + its top button.
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
  specialization: 'Specialize. Learn. Get Certified.',
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
        ? DIRECTORY_GREEN
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
                tier.builder === 'specializations' ? 'Choose a specialized certificate' : 'Choose a program path'
              }
            >
              <Text style={[styles.buildBtnText, { color: buildTint }]}>
                {tier.builder === 'specializations' ? 'CHOOSE A SPECIALIZED CERTIFICATE' : 'CHOOSE A PROGRAM PATH'}
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
  return (
    <View style={{ width: SCREEN_W }}>
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
        <Text style={styles.grantNote}>
          A minimum of 1 complete month of paid membership is required before a certificate can be granted.
        </Text>
      </ScrollView>
    </View>
  );
}

export function AwardsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const startIdx = Math.max(0, PAGE_ORDER.indexOf(route.params.category as PageKey));
  const [idx, setIdx] = useState(startIdx);
  const listRef = useRef<FlatList<PageKey>>(null);

  // Account signal — anonymous = no account (selections won't be saved).
  const { entitlement } = useEntitlement();
  const hasAccount = entitlement !== 'anonymous';

  // Builder selections (user request 2026-07-18): a Specialized Certificate
  // (Level 1) + an Academy Program Certificate (Level 2) — each chosen from its
  // catalog. Persisted only when there's an account.
  const [specCert, setSpecCert] = useState<string | null>(null);
  const [programPath, setProgramPath] = useState<string | null>(null);
  const [picker, setPicker] = useState<'specializations' | 'programs' | null>(null);
  // Accordion — which award is expanded (collapsed by default; tap a name to
  // reveal its topics). One open at a time per picker (user request 2026-07-18).
  const [expandedCert, setExpandedCert] = useState<string | null>(null);
  const [expandedProg, setExpandedProg] = useState<string | null>(null);

  // Both award catalogs listed A–Z by name (user request 2026-07-22). Sorted
  // copies so the source arrays (and any other consumer) keep their order;
  // every certificate/program is included — nothing is filtered.
  const specCertsAZ = useMemo(
    () => [...SPECIALIZED_CERTIFICATES].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const programPathsAZ = useMemo(
    () => [...PROGRAM_PATHS].sort((a, b) => a.name.localeCompare(b.name)),
    [],
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

  // Tapping an award name toggles its topics open/closed AND records it as the
  // current selection.
  // Click open / click close (user request 2026-07-22 — reverses the earlier
  // "stay open" rule); tapping another switches. Programs already toggle.
  const toggleCert = (name: string) => {
    setExpandedCert((prev) => (prev === name ? null : name));
    setSpecCert(name);
    if (hasAccount) void AsyncStorage.setItem(SPEC_CERT_KEY, name);
  };
  const toggleProg = (name: string) => {
    setExpandedProg((prev) => (prev === name ? null : name));
    setProgramPath(name);
    if (hasAccount) void AsyncStorage.setItem(PROGRAM_PATH_KEY, name);
  };

  // Topic name lookup for the Level-1 summary.
  const topicNameByGs = useRef(
    new Map(MATRIX_SUBJECTS.flatMap((s) => s.topics.map((t) => [t.gs, t.name] as const))),
  ).current;
  const nameForGs = (gs: number) => topicNameByGs.get(gs) ?? `Topic gs${gs}`;

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
      setPicker(null); // close the cert/program picker modal
      const ei = PAGE_ORDER.indexOf('enrollment');
      setIdx(ei);
      requestAnimationFrame(() => listRef.current?.scrollToIndex({ index: ei, animated: true }));
      if (entitlement === 'anonymous') setPayPrompt({ label });
    },
    [entitlement],
  );

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const i = viewableItems[0]?.index;
    if (i != null) setIdx(i);
  }).current;

  const currentKey = PAGE_ORDER[idx];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      {/* Company logo header. The RETURN button now lives up here, pinned to the
          utmost top-right corner across all 4 pages (user request 2026-07-22). */}
      <View style={styles.brandRow}>
        <BrandLogo size={34} />
        <Text style={styles.brandWordmark} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          PRO AUDIO <Text style={styles.brandAccent}>TRAINING ACADEMY</Text>
        </Text>
        <View style={{ flex: 1 }} />
        {/* Return control = the exact bottom-nav HOME icon + label, so it reads
            clearly as HOME / Course Select (user request 2026-07-23). Nudged in
            from the far edge with a little padding. */}
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Home"
          style={styles.homeBtn}
        >
          <NavIcon icon="Home" lit />
        </Pressable>
      </View>
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
      </Pressable>

      {/* Category buttons (user request 2026-07-18): CURRICULUM · SPECIALIZATION
          · PROGRAM — tap to switch between the three side-by-side pages. */}
      <View style={styles.tabRow}>
        {PAGE_ORDER.map((c, i) => {
          const active = i === idx;
          const tint = pageTint(c);
          return (
            <Pressable
              key={c}
              onPress={() => {
                setIdx(i);
                listRef.current?.scrollToIndex({ index: i, animated: true });
              }}
              style={[styles.tabBtn, active && { borderColor: tint, backgroundColor: '#1a1a1a' }]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
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
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c}
        initialScrollIndex={startIdx}
        getItemLayout={(_d, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) =>
          item === 'curriculum' ? (
            <View style={{ width: SCREEN_W }}>
              <CurriculumView
                showBrand={false}
                onOpenCategory={(key) => {
                  const i = PAGE_ORDER.indexOf(key);
                  if (i >= 0) {
                    setIdx(i);
                    listRef.current?.scrollToIndex({ index: i, animated: true });
                  }
                }}
              />
            </View>
          ) : item === 'directory' ? (
            <View style={{ width: SCREEN_W }}>
              <DirectoryView showBrand={false} />
            </View>
          ) : item === 'enrollment' ? (
            <View style={{ width: SCREEN_W }}>
              <EnrollmentView showBrand={false} />
            </View>
          ) : (
            <AwardPageView page={awardPage(item)} onBuild={setPicker} summaryForTier={summaryForTier} />
          )
        }
      />

      {/* LEVEL 1 — choose one of the 68 Specialized Certificates (user request
          2026-07-18): each = the 3 required core courses + 3 specialization
          topics. */}
      <Modal visible={picker === 'specializations'} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setPicker(null)}>
        <View style={[styles.pickerRoot, { paddingTop: insets.top }]}>
          <View style={styles.brandRow}>
            <BrandLogo size={30} />
            <Text style={styles.brandWordmark}>
              PRO AUDIO <Text style={styles.brandAccent}>TRAINING ACADEMY</Text>
            </Text>
          </View>
          {/* The whole header is the close/return action (user request
              2026-07-18); the ✕ stays as an affordance. */}
          <Pressable
            style={styles.pickerHead}
            onPress={() => setPicker(null)}
            accessibilityRole="button"
            accessibilityLabel="Close and return"
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.pickerTitle, { color: AMBER }]}>CHOOSE A SPECIALIZED CERTIFICATE</Text>
              <Text style={styles.pickerSub}>
                Each Specialized Certificate is the 3 required core courses plus 3 specialization topics.
                Choose one.
              </Text>
            </View>
            <Text style={styles.pickerClose}>✕</Text>
          </Pressable>
          <ScrollView contentContainerStyle={[styles.pickerScroll, { paddingBottom: insets.bottom + 20 }]}>
            {/* Required core — stated ONCE for all certificates (user request
                2026-07-18) instead of repeated on every award. */}
            <View style={styles.coreBanner}>
              <Text style={styles.coreBannerHead}>REQUIRED CORE · EVERY CERTIFICATE</Text>
              <Text style={styles.coreBannerText}>{COREQ_TOPIC_GS.map((gs) => nameForGs(gs)).join('  ·  ')}</Text>
            </View>

            {specCertsAZ.map((c) => {
              const open = expandedCert === c.name;
              return (
                <View key={c.name} style={[styles.pathCard, open && styles.pathCardGoldOn]}>
                  <Pressable
                    style={styles.pathHead}
                    onPress={() => toggleCert(c.name)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    accessibilityLabel={c.name}
                  >
                    <Text style={[styles.cardChevron, open && { color: '#ffc64d' }]}>{open ? '▾' : '▸'}</Text>
                    <Text style={[styles.pathName, { color: GLOSSARY_BLUE }]}>{c.name}</Text>
                  </Pressable>

                  {open ? (
                    <>
                      {/* Tap anywhere in the expanded body (except ENROLL) to
                          collapse it back (user request 2026-07-22). */}
                      <Pressable onPress={() => toggleCert(c.name)} accessibilityRole="button" accessibilityLabel={`Collapse ${c.name}`}>
                        <Text style={styles.specGroupHead}>SPECIALIZATION TOPICS</Text>
                        {c.specializationTopics.map((gs) => (
                          <View key={gs} style={styles.pathCourseRow}>
                            <Text style={styles.specBullet}>•</Text>
                            <Text style={styles.pathCourseText}>{nameForGs(gs)}</Text>
                          </View>
                        ))}
                      </Pressable>
                      {/* Enroll — adds this certificate's topics to the list. */}
                      <Pressable
                        style={styles.enrollBtn}
                        onPress={() => enrollTopics(c.specializationTopics, c.name, 'cert')}
                        accessibilityRole="button"
                        accessibilityLabel={`Enroll in ${c.name}`}
                      >
                        <Text style={styles.enrollBtnText}>ENROLL IN THIS CERTIFICATE ›</Text>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
          <Pressable style={styles.pickerDone} onPress={() => setPicker(null)}>
            <Text style={styles.pickerDoneText}>DONE</Text>
          </Pressable>
        </View>
        <LowLightDim />
      </Modal>

      {/* LEVEL 2 — choose an established Program Path (TBD course sets). */}
      <Modal visible={picker === 'programs'} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setPicker(null)}>
        <View style={[styles.pickerRoot, { paddingTop: insets.top }]}>
          <View style={styles.brandRow}>
            <BrandLogo size={30} />
            <Text style={styles.brandWordmark}>
              PRO AUDIO <Text style={styles.brandAccent}>TRAINING ACADEMY</Text>
            </Text>
          </View>
          {/* The whole header is the close/return action (user request
              2026-07-18); the ✕ stays as an affordance. */}
          <Pressable
            style={styles.pickerHead}
            onPress={() => setPicker(null)}
            accessibilityRole="button"
            accessibilityLabel="Close and return"
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.pickerTitle, { color: AMBER }]}>CHOOSE A PROGRAM PATH</Text>
              <Text style={styles.pickerSub}>
                Each Academy Program Certificate combines the 3 required core courses with a set of related
                topics. Choose one.
              </Text>
            </View>
            <Text style={styles.pickerClose}>✕</Text>
          </Pressable>
          <ScrollView contentContainerStyle={[styles.pickerScroll, { paddingBottom: insets.bottom + 20 }]}>
            {/* Required core — stated ONCE for all programs (user request
                2026-07-18) instead of repeated on every award. */}
            <View style={styles.coreBanner}>
              <Text style={styles.coreBannerHead}>REQUIRED CORE · EVERY PROGRAM</Text>
              <Text style={styles.coreBannerText}>{COREQ_TOPIC_GS.map((gs) => nameForGs(gs)).join('  ·  ')}</Text>
            </View>

            {programPathsAZ.map((p) => {
              const open = expandedProg === p.name;
              const total = COREQ_TOPIC_GS.length + p.requiredTopics.length;
              return (
                <View key={p.name} style={[styles.pathCard, open && styles.pathCardOn]}>
                  <Pressable
                    style={styles.pathHead}
                    onPress={() => toggleProg(p.name)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    accessibilityLabel={p.name}
                  >
                    <Text style={[styles.cardChevron, open && { color: '#c4a2ff' }]}>{open ? '▾' : '▸'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pathName, { color: PURPLE }]}>{p.name}</Text>
                      <Text style={styles.pathMeta}>
                        {total} required topics
                        {p.electiveChooseOne?.length ? ' + 1 elective' : ''}
                      </Text>
                    </View>
                  </Pressable>

                  {open ? (
                    <>
                      {/* Tap the expanded body (except ENROLL) to collapse it
                          back (user request 2026-07-22). */}
                      <Pressable onPress={() => toggleProg(p.name)} accessibilityRole="button" accessibilityLabel={`Collapse ${p.name}`}>
                        <Text style={styles.pathGroupHead}>REQUIRED TOPICS</Text>
                        {p.requiredTopics.map((gs) => (
                          <View key={gs} style={styles.pathCourseRow}>
                            <Text style={styles.pathBullet}>•</Text>
                            <Text style={styles.pathCourseText}>{nameForGs(gs)}</Text>
                          </View>
                        ))}

                        {p.electiveChooseOne?.length ? (
                          <>
                            <Text style={styles.pathGroupHead}>ELECTIVE — CHOOSE ONE</Text>
                            {p.electiveChooseOne.map((gs) => (
                              <View key={gs} style={styles.pathCourseRow}>
                                <Text style={styles.pathBullet}>○</Text>
                                <Text style={styles.pathCourseText}>{nameForGs(gs)}</Text>
                              </View>
                            ))}
                          </>
                        ) : null}
                      </Pressable>
                      {/* Enroll — adds this program's required topics to the list. */}
                      <Pressable
                        style={styles.enrollBtn}
                        onPress={() => enrollTopics(p.requiredTopics, p.name, 'program')}
                        accessibilityRole="button"
                        accessibilityLabel={`Enroll in ${p.name}`}
                      >
                        <Text style={styles.enrollBtnText}>ENROLL IN THIS PROGRAM ›</Text>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
          <Pressable style={styles.pickerDone} onPress={() => setPicker(null)}>
            <Text style={styles.pickerDoneText}>DONE</Text>
          </Pressable>
        </View>
        <LowLightDim />
      </Modal>

      {/* Anonymous ENROLL → brief "won't be saved" notice (user request
          2026-07-22). Dismiss-only; no account/plans link. */}
      <PrePaywallPrompt
        visible={!!payPrompt}
        onClose={() => setPayPrompt(null)}
        title="Heads up"
        lines={['Your choices won’t be saved without an account.']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  // Company logo header (user request 2026-07-18).
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 14, paddingRight: 6, paddingBottom: 8 },
  homeBtn: { padding: 4, marginRight: 8 },
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
  pickerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#232327',
  },
  pickerTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1.2, color: colors.textPrimary },
  pickerSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  pickerClose: { fontFamily: fonts.oswaldSemiBold, fontSize: 24, color: colors.textSubAlt },
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
  pickerDone: {
    margin: 14,
    borderRadius: 10,
    backgroundColor: '#1d1607',
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.55)',
    paddingVertical: 13,
    alignItems: 'center',
  },
  pickerDoneText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.6, color: colors.amber },

  // Program-path cards (Level 2).
  pathCard: {
    borderWidth: 1,
    borderColor: '#2c2c2c',
    borderRadius: 10,
    backgroundColor: '#161616',
    padding: 14,
    gap: 6,
    marginTop: 8,
  },
  pathCardOn: { borderColor: 'rgba(196,162,255,.75)', backgroundColor: '#161225' },
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
  cardChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.textSub, width: 14 },
  pathCardGoldOn: { borderColor: 'rgba(255,198,77,.75)', backgroundColor: '#221c0d' },
  radioGoldOn: { borderColor: '#ffc64d' },
  radioGoldDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffc64d' },
  specGroupHead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: '#ffc64d',
    marginTop: 8,
    marginBottom: 2,
  },
  specBullet: { fontFamily: fonts.barlowRegular, fontSize: 16, lineHeight: 21, color: '#ffc64d', width: 12 },
  pathHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4a4a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: '#c4a2ff' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#c4a2ff' },
  pathName: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 17, color: colors.textPrimary },
  pathMeta: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, paddingLeft: 2 },
  pathGroupHead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: '#c4a2ff',
    marginTop: 8,
    marginBottom: 2,
  },
  pathCourseRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', paddingLeft: 2 },
  pathBullet: { fontFamily: fonts.barlowRegular, fontSize: 16, lineHeight: 21, color: '#c4a2ff', width: 12 },
  pathCourseText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  // Enroll button inside an expanded cert/program (user request 2026-07-22).
  enrollBtn: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(55,224,95,.7)',
    backgroundColor: 'rgba(55,224,95,.1)',
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: 'center',
  },
  enrollBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: '#37e05f' },
});
