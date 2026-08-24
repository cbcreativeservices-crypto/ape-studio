/**
 * CalcLabScreen — the Audio Calculator Laboratory landing (owner spec
 * 2026-07-29). ONE unified lab: 25 launch workspaces grouped by section, the
 * Calculation Chain banner, and the post-launch tiers listed honestly as
 * IN DEVELOPMENT ("coming soon") — never presented as available.
 */
import { useCallback, useEffect, useState } from 'react';
import { Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { COMING_SOON, SECTION_META, WORKSPACES } from './registry';
import { useChainValue } from './chainStore';
import { workflowStore } from './workflowStore';
import type { Workflow } from './workflowModel';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';

const BG_CALC = require('../../../assets/lab-backgrounds/calc-lab.png');

export function CalcLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const chain = useChainValue();
  const { isMember, commercialMode } = useEntitlement();

  // ALL workflows are ACADEMY-ONLY (owner 2026-08-13): running a guided
  // multi-step sequence, using templates, AND building your own. Individual
  // calculators stay open to everyone. Caps only bite in commercial mode.
  const workflowsAllowed = !commercialMode || isMember;
  const gateWorkflow = (proceed: () => void) => {
    if (workflowsAllowed) return proceed();
    Alert.alert(
      'Workflows are an Academy feature',
      'Calculator workflows — running a guided multi-step sequence, using templates, or building your own — are part of Academy membership. Every individual calculator stays free to use.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'See membership', onPress: () => (navigation as any).navigate('Paywall') },
      ],
    );
  };
  const onNewWorkflow = () => gateWorkflow(() => navigation.navigate('CalcWorkflowEdit', {}));

  // Collapsible sections (owner 2026-08-09): workflows + description + each
  // calculator category. Default open; local state (not persisted).
  const [wfOpen, setWfOpen] = useState(false); // default collapsed (owner 2026-08-09)
  const [descOpen, setDescOpen] = useState(true);
  const [openSecs, setOpenSecs] = useState<Record<string, boolean>>({});

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
    <ImageBackground source={BG_CALC} style={[styles.root, { paddingTop: insets.top + 10 }]} imageStyle={styles.bgImage}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
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
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* CALCULATOR WORKFLOWS — moved to the TOP and collapsible (owner
            2026-08-09). templates + my workflows + new + recent. */}
        <View style={{ gap: 8 }}>
          <Pressable
            onPress={() => setWfOpen((o) => !o)}
            accessibilityRole="button"
            accessibilityState={{ expanded: wfOpen }}
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

        {chain ? (
          <Text style={styles.chainBanner}>
            ⛓ CHAIN ACTIVE: {chain.label} from {chain.fromWorkspace} — open any calculator with a
            matching input and tap USE.
          </Text>
        ) : null}

        {/* Screen description — collapsible (owner 2026-08-09). */}
        <View style={{ gap: 6 }}>
          <Pressable
            onPress={() => setDescOpen((o) => !o)}
            accessibilityRole="button"
            accessibilityState={{ expanded: descOpen }}
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

        {/* Dense two-column grid. Categories default COLLAPSED and only one
            opens at a time (owner 2026-08-23), matching the lab-menu accordion
            idiom; each calculator is a compact tile (name + one-line tagline). */}
        {SECTION_META.map((sec) => {
          const items = WORKSPACES.filter((w) => w.section === sec.id);
          if (items.length === 0) return null;
          const open = openSecs[sec.id] ?? false;
          return (
            <View key={sec.id} style={styles.section}>
              <Pressable
                onPress={() => setOpenSecs((m) => (m[sec.id] ? {} : { [sec.id]: true }))}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={`${sec.title} calculators`}
              >
                <Text style={styles.sectionTitle}>{open ? '▾' : '▸'}  {sec.title}</Text>
              </Pressable>
              {open ? (
                <View style={styles.grid}>
                  {items.map((w) => (
                    <Pressable
                      key={w.id}
                      style={styles.tile}
                      onPress={() => navigation.navigate('CalcWorkspace', { id: w.id })}
                      accessibilityRole="button"
                      accessibilityLabel={`${w.name} — ${w.tagline}`}
                    >
                      <Text style={styles.tileName} numberOfLines={2}>{w.name}</Text>
                      <Text style={styles.tileTag} numberOfLines={1}>{w.tagline}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
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
  // Dense two-column calculator grid (owner 2026-08-09).
  section: { gap: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: '48%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 1,
  },
  tileName: { fontFamily: fonts.oswaldMedium, fontSize: 12.5, letterSpacing: 0.3, color: colors.textPrimary },
  tileTag: { fontFamily: fonts.barlowRegular, fontSize: 10.5, lineHeight: 13, color: colors.textSub },
  chainBanner: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: '#5bff85' },
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
