/**
 * CalcLabScreen — the Audio Calculator Laboratory landing (owner spec
 * 2026-07-29). ONE unified lab: 25 launch workspaces grouped by section, the
 * Calculation Chain banner, and the post-launch tiers listed honestly as
 * IN DEVELOPMENT ("coming soon") — never presented as available.
 */
import { useCallback, useEffect, useState } from 'react';
import { BACK_HIT_SLOP } from '../../../components/backHitSlop';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useBackWhileFocused } from '../../../lib/useBackWhileFocused';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import { cardColumn } from '../../../theme/readingColumn';
import { useIsTablet } from '../../../theme/useIsTablet';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { afterDialogCloses, confirmDialog } from '../../../lib/confirm';
import type { RootStackParamList } from '../../../navigation/types';
import { COMING_SOON, SECTION_META, WORKSPACES } from './registry';
import { setChainValue, useChainValue } from './chainStore';
import { workflowStore } from './workflowStore';
import type { Workflow } from './workflowModel';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { GlassPanel, GlassTile } from '../../tools/GlassTile';
import type { CalcSectionId } from './calcTypes';

const BG_CALC = require('../../../../assets/lab-backgrounds/calc-lab.webp');

export function CalcLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const chain = useChainValue();
  // Tablet (owner 2026-09-29): three calculator plates a row in the centred
  // card column instead of two ~490 pt plates. Phones keep two.
  const tablet = useIsTablet();
  const { isMember, commercialMode, resolved } = useEntitlement();

  // ALL workflows are ACADEMY-ONLY (owner 2026-08-13): running a guided
  // multi-step sequence, using templates, AND building your own. Individual
  // calculators stay open to everyone. Caps only bite in commercial mode.
  // `!resolved` counts as allowed (entitlement roll-out 2026-09-11): the
  // provider boots at 'anonymous', so a member who opened a workflow before the
  // server read landed got the "Workflows are an Academy feature" sell for the
  // membership they already hold.
  const workflowsAllowed = !commercialMode || !resolved || isMember;
  const gateWorkflow = (proceed: () => void) => {
    if (workflowsAllowed) return proceed();
    // confirmDialog, not Alert.alert: RN-web's Alert is a no-op, so this gate
    // was a silent tap on the web preview (B-018/B-062).
    confirmDialog(
      'Workflows are an Academy feature',
      'Calculator workflows — running a guided multi-step sequence, using templates, or building your own — are part of Academy membership. Every individual calculator stays open to browse, with 5 free calculations a week; membership removes that limit.',
      'See membership',
      afterDialogCloses(() => (navigation as any).navigate('Paywall')),
      { cancelText: 'Not now' },
    );
  };
  const onNewWorkflow = () => gateWorkflow(() => navigation.navigate('CalcWorkflowEdit', {}));

  // Collapsible sections (owner 2026-08-09): workflows + description. The
  // calculator categories are a container grid + popup (owner 2026-09-30).
  const [wfOpen, setWfOpen] = useState(false); // default collapsed (owner 2026-08-09)
  const [descOpen, setDescOpen] = useState(true);
  // The category whose calculators are showing in the centred popup.
  const [openSec, setOpenSec] = useState<CalcSectionId | null>(null);
  const openMeta = openSec ? SECTION_META.find((m) => m.id === openSec) ?? null : null;
  const openItems = openSec ? WORKSPACES.filter((w) => w.section === openSec) : [];
  // Android BACK closes the popup before it leaves the lab — only while this
  // screen is focused (pattern hunt P13, 2026-10-02): the Paywall or a
  // workspace pushed over an open popup gets its own BACK.
  const closeSecOnBack = useCallback(() => {
    setOpenSec(null);
    return true;
  }, []);
  useBackWhileFocused(!!openSec, closeSecOnBack);

  // Most-recent saved workflow (owner spec 2026-08-06) — quick jump on the home.
  const [recent, setRecent] = useState<Workflow | null>(null);
  const loadRecent = useCallback(() => {
    void (async () => {
      const [ids, list] = await Promise.all([workflowStore.getRecents(), workflowStore.listWorkflows()]);
      const hit = ids.map((id) => list.find((w) => w.id === id)).find((w) => w != null);
      setRecent(hit ?? list[0] ?? null);
    })();
  }, []);
  useEffect(() => {
    const unsub = navigation.addListener('focus', loadRecent);
    loadRecent();
    return unsub;
  }, [navigation, loadRecent]);

  return (
    <ImageBackground source={BG_CALC} style={[styles.root, { paddingTop: insets.top + 10 }]} imageStyle={styles.bgImage}
      // resizeMode as a PROP (owner 2026-09-29, tablet pass): react-native-web
      // ignores it inside imageStyle, so the art sat as a narrow strip on a
      // wide landscape iPad in the preview. The prop works on every platform.
      resizeMode="cover">
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={BACK_HIT_SLOP} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        {/* Lab glyph: the purple Σ that brands the Audio Calculator Lab (matches
            the glossary's Σ) — a plain symbol before the title, not a button
            (owner 2026-08-01). */}
        <Text style={styles.sigma} accessibilityElementsHidden importantForAccessibility="no">
          Σ
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>AUDIO CALCULATOR LABORATORY</Text>
          <Text style={styles.subtitle}>Calculate · understand · chain results between tools</Text>
        </View>
        <AccuracyNote compact variant="calc" />
        {/* Symbol key (owner 2026-08-05): Greek letters + math/calculus symbols
            used across the calculators. Content authored separately. */}
        <Pressable
          style={styles.keyBtn}
          onPress={() => navigation.navigate('CalcSymbolsKey')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Symbol key — Greek letters and math symbols"
        >
          <Text style={styles.keyBtnGlyph}>π</Text>
          <Text style={styles.keyBtnText}>KEY</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, cardColumn]}>
        {/* CALCULATOR WORKFLOWS — moved to the TOP and collapsible (owner
            2026-08-09). templates + my workflows + new + recent. */}
        <View style={{ gap: 8 }}>
          <Pressable
            onPress={() => setWfOpen((o) => !o)}
            accessibilityRole="button"
            accessibilityState={{ expanded: wfOpen }}
            aria-expanded={wfOpen}
            accessibilityLabel="Calculator workflows section"
          >
            <Text style={[styles.sectionTitle, { color: colors.green }]}>{wfOpen ? '▾' : '▸'}  CUSTOM CALCULATOR WORKFLOWS</Text>
          </Pressable>
          {wfOpen ? (
            <>
              <Text style={[styles.caption, { color: colors.green }]}>
                Run several calculators as one guided sequence — build your own or start from a template.
              </Text>
              <View style={styles.wfRow}>
                <Pressable
                  style={[styles.wfBtn, styles.wfBtnGreen]}
                  onPress={onNewWorkflow}
                  accessibilityRole="button"
                  accessibilityLabel="New workflow"
                >
                  <Text style={[styles.wfBtnText, { color: colors.green }]}>＋ NEW WORKFLOW</Text>
                </Pressable>
                <Pressable
                  style={styles.wfBtn}
                  onPress={() => gateWorkflow(() => navigation.navigate('CalcWorkflows'))}
                  accessibilityRole="button"
                  accessibilityLabel="My workflows and templates"
                >
                  <Text style={styles.wfBtnText}>
                    <Text style={{ color: colors.green }}>MY WORKFLOWS</Text> & <Text style={{ color: colors.blue }}>TEMPLATES</Text> ›
                  </Text>
                </Pressable>
              </View>
              {/* Phase 4: saved projects + saved results. */}
              <View style={styles.wfRow}>
                <Pressable
                  style={styles.wfBtn}
                  onPress={() => navigation.navigate('CalcProjects')}
                  accessibilityRole="button"
                  accessibilityLabel="Saved projects"
                >
                  <Text style={styles.wfBtnText}>SAVED PROJECTS ›</Text>
                </Pressable>
                <Pressable
                  style={styles.wfBtn}
                  onPress={() => navigation.navigate('CalcResults')}
                  accessibilityRole="button"
                  accessibilityLabel="Saved results"
                >
                  <Text style={styles.wfBtnText}>SAVED RESULTS ›</Text>
                </Pressable>
              </View>
              {recent ? (
                <Pressable
                  style={styles.card}
                  onPress={() => gateWorkflow(() => navigation.navigate('CalcWorkflowRun', { id: recent.id }))}
                  accessibilityRole="button"
                  accessibilityLabel={`Run recent workflow ${recent.name}`}
                >
                  <Text style={styles.caption}>RECENT · TAP TO RUN</Text>
                  <Text style={styles.cardName}>{recent.name}</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}
        </View>

        {/* The chain can be cleared (owner 2026-09-30); sign-out clears it too. */}
        {chain ? (
          <View style={styles.chainRow}>
            <Text style={[styles.chainBanner, { flex: 1 }]}>
              ⛓ CHAIN ACTIVE: {chain.label} from {chain.fromWorkspace} — open any calculator with a
              matching input and tap USE.
            </Text>
            <Pressable onPress={() => setChainValue(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear the calculation chain">
              <Text style={styles.chainClear}>✕ CLEAR</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Screen description — collapsible (owner 2026-08-09). */}
        <View style={{ gap: 6 }}>
          <Pressable
            onPress={() => setDescOpen((o) => !o)}
            accessibilityRole="button"
            accessibilityState={{ expanded: descOpen }}
            aria-expanded={descOpen}
            accessibilityLabel="About this lab"
          >
            <Text style={[styles.sectionTitle, { color: colors.blue }]}>{descOpen ? '▾' : '▸'}  ABOUT THIS LAB</Text>
          </Pressable>
          {descOpen ? (
            <Text style={styles.body}>
              Every calculator here shows the result AND the reasoning: the formula, the worked
              steps, why it matters on the job, and the classic mistakes. Results can be SENT into
              another calculator — sensitivity → voltage → gain → headroom — like a real design chain.
            </Text>
          ) : null}
        </View>

        {/* THE TEN CATEGORIES as a 2-column grid of containers, five rows
            (owner 2026-09-30: "instead of 10 expandable bullet list points …
            2 column of 5 rows of containers"). A tap opens that category's
            calculators in a centred popup — popups, never pulldowns. */}
        <GlassPanel style={tablet ? undefined : styles.panelPhone}>
        <View style={styles.catGrid}>
          {SECTION_META.map((sec) => {
            const count = WORKSPACES.filter((w) => w.section === sec.id).length;
            if (count === 0) return null;
            return (
              // The Audio Tools hub's glass hardware (owner 2026-09-30): black
              // recess, raised bevelled glass with the softbox reflection,
              // sinks + powers on when pressed.
              <GlassTile
                key={sec.id}
                style={styles.catFrame}
                glassStyle={[styles.catFace, tablet && styles.catFaceTablet]}
                onPress={() => setOpenSec(sec.id)}
                accessibilityLabel={`${sec.title}. ${sec.note} ${count} calculators. Opens the list.`}
              >
                <Text style={[styles.catTitle, tablet && styles.catTitleTablet]} numberOfLines={2}>{sec.title}</Text>
                <Text style={[styles.catNote, tablet && styles.catNoteTablet]} numberOfLines={4}>{sec.note}</Text>
                <Text style={[styles.catCount, tablet && styles.catCountTablet]}>{count} CALCULATORS ›</Text>
              </GlassTile>
            );
          })}
        </View>
        </GlassPanel>
        {COMING_SOON.map((group) => (
          <View key={group.title} style={{ gap: 6 }}>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            <Text style={styles.caption}>
              On the roadmap — listed so you can see where the laboratory is headed. Not yet
              functional.
            </Text>
            <View style={styles.soonWrap}>
              {group.items.map((it) => (
                <View key={it} style={styles.soonChip}>
                  <Text style={styles.soonText}>{it}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      {/* The category popup is drawn IN the screen (owner 2026-09-30: it
          sat skewed off-screen). As a separate Modal it centred on the host
          window, which on the web preview is not the app's box; in-tree it
          centres on the calculator screen itself everywhere, and it never has
          to present over another Modal on iOS. Android BACK closes it first. */}
      {openMeta ? (
        <View style={[StyleSheet.absoluteFill, styles.popBackdrop]} accessibilityViewIsModal>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpenSec(null)} accessibilityRole="button" accessibilityLabel="Close" />
          {openMeta ? (
            <View style={[styles.popCard, tablet && styles.popCardTablet]}>
              <View style={styles.popHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.popTitle}>{openMeta.title}</Text>
                  <Text style={styles.caption}>{openMeta.note}</Text>
                </View>
                <Pressable onPress={() => setOpenSec(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
                  <Text style={styles.popClose}>✕</Text>
                </Pressable>
              </View>
              <ScrollView>
                <GlassPanel style={styles.grid}>
                {openItems.map((w) => (
                  <GlassTile
                    key={w.id}
                    style={[styles.tileFrame, tablet && styles.tileFrameTablet]}
                    glassStyle={styles.tile}
                    onPress={() => {
                      setOpenSec(null);
                      navigation.navigate('CalcWorkspace', { id: w.id });
                    }}
                    accessibilityLabel={`${w.name} — ${w.tagline}`}
                  >
                    <Text style={styles.tileName} numberOfLines={2}>{w.name}</Text>
                    <Text style={styles.tileTag} numberOfLines={2}>{w.tagline}</Text>
                  </GlassTile>
                ))}
                </GlassPanel>
              </ScrollView>
            </View>
          ) : null}
        </View>
      ) : null}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  bgImage: { resizeMode: 'cover' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  sigma: { fontFamily: fonts.oswaldSemiBold, fontSize: 24, lineHeight: 28, color: colors.purple },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 34, gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber, marginTop: 2 },
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 3 },
  cardName: { fontFamily: fonts.oswaldMedium, fontSize: 15.5, letterSpacing: 0.5, color: colors.textPrimary },
  // The ten category containers: 2 columns × 5 rows (owner 2026-09-30).
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  // The recess (GlassTile supplies the rim, the black cut and the glass).
  catFrame: { width: '48.5%' },
  // Phones: a thinner panel margin so the two containers keep their room.
  panelPhone: { padding: 7 },
  catFace: { minHeight: 132, padding: 12, gap: 5, justifyContent: 'space-between', backgroundColor: '#101116' },
  catTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1, color: colors.amber },
  catNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 16, color: '#d4d6da', flex: 1 },
  catCount: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.1, color: colors.purple },
  // Tablet: the containers are ~370 pt wide, so the type grows with them.
  catFaceTablet: { minHeight: 150, padding: 16 },
  catTitleTablet: { fontSize: 19 },
  catNoteTablet: { fontSize: 15, lineHeight: 20 },
  catCountTablet: { fontSize: 13 },
  // The category popup (centred).
  popBackdrop: { zIndex: 50, elevation: 50, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  popCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '86%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(180,91,255,.6)',
    backgroundColor: '#121215',
    padding: 14,
    gap: 10,
  },
  popCardTablet: { maxWidth: 720 },
  popHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  popTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.2, color: colors.amber },
  popClose: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSub, paddingHorizontal: 4 },
  // Calculator tiles inside the popup.
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  // Graphite instrument plate: black keyline frame wrapping a machined face.
  tileFrameTablet: { width: '32%' },
  tileFrame: { width: '48%' },
  tile: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 3,
    backgroundColor: '#101116',
  },
  tileName: { fontFamily: fonts.oswaldMedium, fontSize: 15, letterSpacing: 0.3, color: '#f2f3f5' },
  tileTag: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 16, color: '#c7cace' },
  chainBanner: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: '#5bff85' },
  chainRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  chainClear: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSub, paddingTop: 1 },
  soonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  soonChip: { borderRadius: 7, borderWidth: 1, borderColor: '#232329', paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#101014' },
  soonText: { fontFamily: fonts.barlowMedium, fontSize: 11.5, color: '#5c5d66' },
  // Calculator Workflows section (owner spec 2026-08-06).
  wfRow: { flexDirection: 'row', gap: 8 },
  wfBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wfBtnGreen: { borderColor: 'rgba(55,224,95,.6)', backgroundColor: '#0c2012' },
  wfBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary, textAlign: 'center' },
  // Symbol-key button (top-right).
  keyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(180,91,255,.6)',
    backgroundColor: '#181818',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  // Purple to match the Σ lab brand and the per-formula π KEY (owner 2026-08-13).
  keyBtnGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.purple, marginTop: -1 },
  keyBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.purple },
});
