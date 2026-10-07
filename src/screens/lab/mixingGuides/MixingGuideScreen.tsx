/**
 * MixingGuideScreen — route `MixingGuide { id }`: ONE style rendered through
 * the template (data/types.ts). Written reference, no visuals (owner
 * 2026-10-07: "This one should not be visual").
 *
 * Top to bottom: what the audience expects (a sentence of the guide's own
 * section 1) and the mix priority; the starting-points line; the six
 * at-a-glance rows; then the thirteen sections, each a collapsible header
 * (section 1 starts open; OPEN ALL / CLOSE ALL beside them). Tables (EQ,
 * compression, effects, live vs studio) read as one card per row — a phone is
 * too narrow for six columns. Prose sits in the 560 reading column on a
 * tablet.
 *
 * Navigation is the shared lab strip (useLabNav + LabNavBar): ‹ PREV / NEXT ›
 * walk the 50 styles in index order, the readout opens CONTENTS, FINISH and
 * the CONTENTS footer open the what's-left screen (LabEndScreen). The header
 * ‹ always leaves. Never blocked.
 *
 * READ: NEXT › and FINISH mark the guide being left as read; MARK AS READ at
 * the foot does it in place. ✓ READ shows only from the record (a write
 * result or this session's held reading for a guest), never optimistically.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { readingColumn } from '../../../theme/readingColumn';
import type { RootStackParamList } from '../../../navigation/types';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { persistAllowed } from '../../../features/commercial/tier';
import { useTier } from '../../../features/commercial/useTier';
import { useLabPreview } from '../../../features/lab/labPreviewStore';
import { safeGoBack } from '../../../lib/safeGoBack';
import { useLatchedPress } from '../../../lib/latch';
import { LabEndScreen } from '../kit/LabEndScreen';
import { LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav } from '../kit/LabNavBar';
import { ProgressUnreadableNote } from '../kit/ProgressUnreadableNote';
import { MIXING_GUIDE_INDEX } from './data/index';
import { loadGuide } from './data/load';
import {
  GLANCE_ROWS,
  GUIDE_SECTIONS,
  STARTING_POINTS_LINE,
  TABLE_COLUMNS,
  type GuideSectionKey,
  type GuideText,
  type MixingGuide,
  type TableKey,
} from './data/types';
import { markGuideRead, setGuidesSaveBlocked, useGuidesRead, useGuidesUnreadable } from './readProgress';

const ACCURACY_DETAIL =
  'The SPL and loudness figures are typical ranges, for learning. Always follow venue limits and local rules, and measure with a calibrated SPL meter and certified loudness metering.';

const UNITS = MIXING_GUIDE_INDEX.map((g) => ({ id: g.id, title: g.title }));

export function MixingGuideScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const wantId = (route.params as { id?: string } | undefined)?.id;
  const index = Math.max(0, MIXING_GUIDE_INDEX.findIndex((g) => g.id === wantId));
  const entry = MIXING_GUIDE_INDEX[index];
  const guide = useMemo(() => loadGuide(entry.id), [entry.id]);

  const tier = useTier();
  setGuidesSaveBlocked(!persistAllowed(tier));
  const progress = useGuidesRead();
  const unreadable = useGuidesUnreadable();
  const readIds = useMemo(() => new Set(progress.read), [progress.read]);
  const isRead = readIds.has(entry.id);
  // A members-only PREVIEW earns nothing (readProgress), so MARK AS READ
  // would be a dead button there (hunt 2026-10-07): it says so instead.
  const inPreview = useLabPreview().active;

  const [ending, setEnding] = useState(false);
  // Which sections are open. Kept across styles: a reader who opens EQ on one
  // guide finds it open on the next.
  const [open, setOpen] = useState<ReadonlySet<GuideSectionKey>>(() => new Set<GuideSectionKey>(['purpose']));
  const scroll = useRef<ScrollView>(null);

  const go = useCallback(
    (i: number) => {
      const target = MIXING_GUIDE_INDEX[Math.max(0, Math.min(MIXING_GUIDE_INDEX.length - 1, i))];
      setEnding(false);
      navigation.setParams({ id: target.id });
    },
    [navigation],
  );
  // A new guide starts at its top.
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [entry.id]);

  const nav = useLabNav({
    units: useMemo(() => UNITS.map((u) => ({ ...u, done: readIds.has(u.id) })), [readIds]),
    index,
    ending,
    go,
    // Leaving a guide forward with NEXT › / FINISH counts it as read.
    beforeAdvance: (from) => {
      void markGuideRead(MIXING_GUIDE_INDEX[from].id);
    },
    finish: () => setEnding(true),
    unEnd: () => setEnding(false),
  });

  const markRead = useLatchedPress(() => markGuideRead(entry.id));

  // Stable, so a memoised Section re-renders only when its own open state
  // changes (hunt 2026-10-07 timing: OPEN ALL / a toggle re-rendered every body).
  const toggle = useCallback(
    (k: GuideSectionKey) =>
      setOpen((prev) => {
        const next = new Set(prev);
        if (next.has(k)) next.delete(k);
        else next.add(k);
        return next;
      }),
    [],
  );
  const sections = guide ? GUIDE_SECTIONS.filter((s) => !guide.empty.includes(s.key)) : [];
  const allOpen = sections.every((s) => open.has(s.key));
  const setAll = () => setOpen(allOpen ? new Set<GuideSectionKey>() : new Set(sections.map((s) => s.key)));

  return (
    <LabNavProvider value={nav}>
      <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
        <LabHeader
          title={ending ? 'MIXING GUIDES' : entry.title.toUpperCase()}
          subtitle={ending ? 'What’s left' : `Mixing guide ${entry.num} of ${MIXING_GUIDE_INDEX.length}${isRead ? ' · read' : ''}`}
          right={<AccuracyNote compact detail={ACCURACY_DETAIL} />}
        />
        <LabNavBar nav={nav} />
        {ending ? (
          <LabEndScreen
            labTitle="Mixing Guides"
            units={MIXING_GUIDE_INDEX.map((g) => ({ id: g.id, label: g.title }))}
            cleared={readIds}
            unreadable={unreadable}
            mode="progress"
            noun="guide"
            onJump={(id) => go(MIXING_GUIDE_INDEX.findIndex((g) => g.id === id))}
            onPracticeAgain={() => go(0)}
            onDone={() => safeGoBack(navigation)}
            doneLabel="DONE · BACK TO THE GUIDES"
            bottomInset
          />
        ) : (
          <ScrollView ref={scroll} style={styles.body} contentContainerStyle={[styles.scroll, readingColumn, { paddingBottom: insets.bottom + 28 }]}>
            {unreadable ? <ProgressUnreadableNote /> : null}
            {guide ? (
              <>
                <View style={styles.expectsCard}>
                  <Text style={styles.eyebrow}>WHAT THE AUDIENCE EXPECTS</Text>
                  <Text style={styles.expects}>{guide.expects}</Text>
                  <Text style={[styles.eyebrow, styles.eyebrowGap]}>MIX PRIORITY #1</Text>
                  <Text style={styles.priority}>{guide.glance.priority}</Text>
                </View>
                <Text style={styles.startingPoints}>{STARTING_POINTS_LINE}</Text>

                <Text style={styles.blockHead} accessibilityRole="header">AT A GLANCE</Text>
                <View style={styles.glance}>
                  {GLANCE_ROWS.filter((r) => r.key !== 'priority').map((r, i) => (
                    <View key={r.key} style={[styles.glanceRow, i > 0 && styles.rowRule]}>
                      <Text style={styles.glanceLabel}>{r.label}</Text>
                      <Text style={styles.glanceValue}>{guide.glance[r.key]}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.sectionsHead}>
                  <Text style={styles.blockHead} accessibilityRole="header">THE GUIDE</Text>
                  <Pressable onPress={setAll} hitSlop={8} style={styles.allBtn} accessibilityRole="button" accessibilityLabel={allOpen ? 'Close every section' : 'Open every section'}>
                    <Text style={styles.allText}>{allOpen ? 'CLOSE ALL ▴' : 'OPEN ALL ▾'}</Text>
                  </Pressable>
                </View>
                {sections.map((s, i) => (
                  <Section key={s.key} k={s.key} n={i + 1} title={s.title} open={open.has(s.key)} onToggle={toggle} guide={guide} />
                ))}

                <View style={styles.footer}>
                  {isRead ? (
                    <Text style={styles.readTag}>✓ READ</Text>
                  ) : inPreview ? (
                    <Text style={styles.previewNote}>Members-only preview — reading here is not recorded.</Text>
                  ) : (
                    <Pressable onPress={markRead} style={styles.markBtn} accessibilityRole="button" accessibilityLabel={`Mark ${entry.title} as read`}>
                      <Text style={styles.markText}>MARK AS READ</Text>
                    </Pressable>
                  )}
                  <LabNextButton />
                </View>
              </>
            ) : (
              <Text style={styles.para}>This guide could not be opened. Use ‹ PREV, NEXT › or CONTENTS to pick another style.</Text>
            )}
          </ScrollView>
        )}
      </View>
    </LabNavProvider>
  );
}

const Section = memo(function Section({
  k,
  n,
  title,
  open,
  onToggle,
  guide,
}: {
  k: GuideSectionKey;
  n: number;
  title: string;
  open: boolean;
  onToggle: (k: GuideSectionKey) => void;
  guide: MixingGuide;
}) {
  return (
    <View style={styles.section}>
      <Pressable
        onPress={() => onToggle(k)}
        style={styles.sectionHead}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        accessibilityLabel={`${n}. ${title}. ${open ? 'Close' : 'Open'} this section`}
      >
        <Text style={styles.sectionNum}>{String(n).padStart(2, '0')}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.chev}>{open ? '▴' : '▾'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.sectionBody}>
          <SectionBody guide={guide} k={k} />
        </View>
      ) : null}
    </View>
  );
});

function SectionBody({ guide, k }: { guide: MixingGuide; k: GuideSectionKey }) {
  if (k === 'references') {
    return (
      <View style={styles.items}>
        <Text style={styles.small}>Listen to these as references for the style — match their level before you compare.</Text>
        {guide.references.map((r, i) => (
          <Text key={i} style={styles.bullet}>
            {'•  '}
            {r}
          </Text>
        ))}
      </View>
    );
  }
  if (k === 'eq' || k === 'compression' || k === 'fx' || k === 'liveStudio') return <TableBody guide={guide} k={k} />;
  return <Prose items={guide[k]} />;
}

function Prose({ items }: { items: readonly GuideText[] }) {
  return (
    <View style={styles.items}>
      {items.map((t, i) => (
        <Text key={i} style={t.bullet ? styles.bullet : styles.para}>
          {t.bullet ? '•  ' : ''}
          {t.label ? <Text style={styles.label}>{`${t.label} `}</Text> : null}
          {t.text}
        </Text>
      ))}
    </View>
  );
}

function TableBody({ guide, k }: { guide: MixingGuide; k: TableKey }) {
  const cols = TABLE_COLUMNS[k];
  const rows = guide[k].rows as unknown as Record<string, string>[];
  const [head, ...rest] = cols;
  const lead = guide[k].notes.filter((n) => n.before);
  const after = guide[k].notes.filter((n) => !n.before);
  return (
    <View style={styles.items}>
      {lead.length ? <Prose items={lead} /> : null}
      {rows.map((r, i) => (
        <View key={i} style={styles.rowCard}>
          <Text style={styles.rowHead}>{r[head.key]}</Text>
          {rest.map((c) =>
            r[c.key] && r[c.key] !== '—' ? (
              <Text key={c.key} style={styles.rowLine}>
                <Text style={styles.rowLabel}>{`${c.label}: `}</Text>
                {r[c.key]}
              </Text>
            ) : null,
          )}
        </View>
      ))}
      {after.length ? <Prose items={after} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  body: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  expectsCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.35)',
    backgroundColor: '#15130d',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.4, color: colors.amberLabel },
  eyebrowGap: { marginTop: 8 },
  expects: { fontFamily: fonts.barlowMedium, fontSize: 16, lineHeight: 23, color: colors.textPrimary },
  priority: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },
  startingPoints: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSub, fontStyle: 'italic' },
  blockHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.amber, marginTop: 4 },
  glance: { borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, backgroundColor: '#111215' },
  glanceRow: { paddingHorizontal: 12, paddingVertical: 9, gap: 2 },
  rowRule: { borderTopWidth: 1, borderTopColor: colors.hairlineDim },
  glanceLabel: { fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 0.9, color: colors.textSub, textTransform: 'uppercase' },
  glanceValue: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  sectionsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  allBtn: { minHeight: 44, justifyContent: 'center', paddingLeft: 12 },
  allText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.amber },
  section: { borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, backgroundColor: '#101114', overflow: 'hidden' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 12, paddingVertical: 8 },
  sectionNum: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  sectionTitle: { flex: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.5, color: colors.textPrimary },
  chev: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.amber },
  sectionBody: { paddingHorizontal: 12, paddingBottom: 14, borderTopWidth: 1, borderTopColor: colors.hairlineDim, paddingTop: 10 },
  items: { gap: 9 },
  para: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  bullet: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, paddingLeft: 2 },
  label: { fontFamily: fonts.barlowSemiBold, color: colors.textPrimary },
  small: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSub },
  rowCard: { borderLeftWidth: 2, borderLeftColor: 'rgba(255,198,77,.45)', paddingLeft: 10, paddingVertical: 2, gap: 3 },
  rowHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 14.5, letterSpacing: 0.4, color: colors.amber },
  rowLine: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  rowLabel: { fontFamily: fonts.barlowSemiBold, color: colors.textSub },
  footer: { gap: 12, marginTop: 6, alignItems: 'stretch' },
  markBtn: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  markText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: colors.green },
  previewNote: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSub, textAlign: 'center', paddingVertical: 10 },
  readTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: colors.green, textAlign: 'center', paddingVertical: 12 },
});
