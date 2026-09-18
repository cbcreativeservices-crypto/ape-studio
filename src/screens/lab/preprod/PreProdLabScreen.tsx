/**
 * PreProdLabScreen — the Audio Pre-Production lab home.
 *
 * Two states: no project yet (pick a project type and start one), or a project
 * open (its readiness, its stages, and the packet).
 *
 * The stage list shows the WHOLE process, including the stages not authored
 * yet, because a user planning a production should see the shape of the work
 * rather than only the parts that happen to be finished. Unauthored stages are
 * plainly not open — with no timeline and no promise attached, per the standing
 * copy rule.
 */
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { resolveStage } from '../../../features/production/schema';
import { readProject } from '../../../features/production/readiness';
import { buildPacketHtml, exportPacketPdf, isPdfAvailable } from '../../../features/production/packet';
import { createProjectStore, newProject, projectStore } from '../../../features/production/projectStore';
import type { PathwayId, ProductionProject } from '../../../features/production/types';
import { LAUNCH_PATHWAYS, PATHWAY_LABEL } from '../../../features/production/types';
import { PREPROD_OUTLINE, PREPROD_STAGES, authoredStage } from '../../../features/production/preprod';
import { ReadinessMeter, StageProgressRow } from './ReadinessMeter';
import { STATE_TINT } from './FieldRow';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PreProdLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [projects, setProjects] = useState<ProductionProject[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const list = await projectStore().load('preprod');
    setProjects(list);
    setOpenId((cur) => cur ?? list[0]?.id ?? null);
  }, []);

  // Re-read on focus: a stage screen writes through the store, so coming back
  // must show the new readiness rather than a stale snapshot.
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const project = useMemo(() => projects?.find((p) => p.id === openId) ?? null, [projects, openId]);

  const { stages, report } = useMemo(() => {
    if (!project) return { stages: [], report: null };
    const resolved = PREPROD_OUTLINE.map((o) => authoredStage(o.stageId))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => resolveStage(s, project.pathway));
    return { stages: resolved, report: readProject(resolved, project) };
  }, [project]);

  const start = useCallback(
    async (pathway: PathwayId) => {
      const p = newProject('preprod', pathway, `${PATHWAY_LABEL[pathway]} project`);
      await projectStore().upsert(p);
      await reload();
      setOpenId(p.id);
    },
    [reload],
  );

  const sharePacket = useCallback(async () => {
    if (!project || !report) return;
    const res = await exportPacketPdf({ project, stages, report });
    if (res.ok) return;
    Alert.alert(
      'Packet not shared',
      res.reason === 'needs_build'
        ? 'Printing to PDF needs the next app build. The packet is readable here in the meantime.'
        : res.reason === 'no_share_target'
          ? 'This device has nowhere to send the file.'
          : 'The packet could not be produced.',
    );
  }, [project, report, stages]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>PRODUCTION WORKFLOW</Text>
          <Text style={styles.title}>Audio Pre-Production</Text>
        </View>
        <AccuracyNote variant="practice" compact />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 34 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.blurb}>
          Everything that should happen before recording, filming, broadcasting or presenting begins. Build a plan,
          find what is missing, and leave with a packet a crew could actually work from.
        </Text>

        {projects === null ? null : projects.length === 0 || !project ? (
          <View style={styles.startBlock}>
            <Text style={styles.sectionTitle}>START A PROJECT</Text>
            <Text style={styles.sectionIntro}>
              What you are making changes the questions, the documents and the problems you will hit. The planning
              process underneath stays the same.
            </Text>
            {LAUNCH_PATHWAYS.map((p) => (
              <Pressable
                key={p}
                style={styles.pathway}
                onPress={() => void start(p)}
                accessibilityRole="button"
                accessibilityLabel={`Start a ${PATHWAY_LABEL[p]} project`}
              >
                <Text style={styles.pathwayName}>{PATHWAY_LABEL[p]}</Text>
                <Text style={styles.pathwayGo}>›</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <>
            {projects.length > 1 ? (
              <View style={styles.switcher}>
                {projects.map((p) => (
                  <Pressable
                    key={p.id}
                    style={[styles.switchChip, p.id === openId && styles.switchChipOn]}
                    onPress={() => setOpenId(p.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: p.id === openId }}
                  >
                    <Text style={[styles.switchText, p.id === openId && styles.switchTextOn]} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Text style={styles.projectName}>{project.name}</Text>
            <Text style={styles.projectMeta}>{PATHWAY_LABEL[project.pathway]}</Text>

            {report ? <ReadinessMeter report={report} lab="preprod" /> : null}

            <Text style={styles.sectionTitle}>THE SIX STAGES</Text>
            {PREPROD_OUTLINE.map((o) => {
              const sr = report?.stages.find((s) => s.stageId === o.stageId);
              const open = Boolean(authoredStage(o.stageId));
              return (
                <Pressable
                  key={o.stageId}
                  style={[styles.stage, !open && styles.stageClosed]}
                  disabled={!open}
                  onPress={() => navigation.navigate('PreProdStage', { projectId: project.id, stageId: o.stageId })}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !open }}
                  accessibilityLabel={
                    open ? `Stage ${o.num}, ${o.title}` : `Stage ${o.num}, ${o.title}, not open yet`
                  }
                >
                  {sr ? (
                    <StageProgressRow stage={sr} />
                  ) : (
                    <View style={styles.closedRow}>
                      <View style={[styles.closedDot, { backgroundColor: STATE_TINT.missing }]} />
                      <Text style={styles.closedNum}>{o.num}</Text>
                      <Text style={styles.closedTitle}>{o.title}</Text>
                      <Text style={styles.closedNote}>Not open yet</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}

            {/* Exercises. Each one seeds a REAL project into a broken state and
                sends the user to the ordinary stage screen to repair it, so the
                practice happens on the same screens as the work.

                An activity declares the pathways it makes sense on (the stage 3
                scenario is a recorded live show and seeds live-only fields), so
                offering it on a podcast project would seed values into fields
                that are not there. Filtered here rather than hidden later. */}
            <Text style={styles.sectionTitle}>EXERCISES</Text>
            <Text style={styles.sectionIntro}>
              A plan that has already gone wrong, for you to repair. Each one checks your work decision by
              decision and tells you what is still outstanding.
            </Text>
            {PREPROD_STAGES.filter(
              (s) => s.activity && (!s.activity.onlyFor || s.activity.onlyFor.includes(project.pathway)),
            ).map((s) => (
              <Pressable
                key={s.activity!.activityId}
                style={styles.exercise}
                onPress={() =>
                  navigation.navigate('PreProdActivity', {
                    activityId: s.activity!.activityId,
                    pathway: project.pathway,
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Exercise, ${s.activity!.title}, from stage ${s.num}`}
              >
                <Text style={styles.exerciseNum}>{s.num}</Text>
                <Text style={styles.exerciseName}>{s.activity!.title}</Text>
                <Text style={styles.exerciseGo}>›</Text>
              </Pressable>
            ))}

            <Text style={styles.sectionTitle}>PRODUCTION PACKET</Text>
            <Text style={styles.sectionIntro}>
              Everything decided so far, as one document, with the gaps and any accepted conditions printed rather
              than hidden.
            </Text>
            <Pressable
              style={styles.packetBtn}
              onPress={() => void sharePacket()}
              accessibilityRole="button"
              accessibilityLabel="Share the production packet as a PDF"
            >
              <Text style={styles.packetBtnText}>SHARE AS PDF</Text>
            </Pressable>
            {!isPdfAvailable() ? (
              <Text style={styles.packetNote}>
                Printing to PDF needs the next app build. Everything in the packet is readable on these screens now.
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineDim,
  },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.amber, marginTop: -4 },
  kicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textMuted },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 19, color: colors.textPrimary },

  body: { padding: 16, gap: 12 },
  blurb: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSub },

  startBlock: { gap: 9, marginTop: 6 },
  sectionTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 1.1,
    color: colors.amberLabel,
    marginTop: 12,
  },
  sectionIntro: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSub },
  pathway: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 9,
    backgroundColor: '#121215',
    paddingVertical: 14,
    paddingHorizontal: 13,
  },
  pathwayName: { flex: 1, fontFamily: fonts.barlowSemiBold, fontSize: 14.5, color: colors.textPrimary },
  pathwayGo: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.amber },

  switcher: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  switchChip: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 7,
    paddingVertical: 6,
    paddingHorizontal: 10,
    maxWidth: 210,
  },
  switchChipOn: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,.12)' },
  switchText: { fontFamily: fonts.barlowMedium, fontSize: 12, color: colors.textSub },
  switchTextOn: { color: colors.amber },

  projectName: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, color: colors.textPrimary, marginTop: 6 },
  projectMeta: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textMuted, marginBottom: 4 },

  stage: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 9,
    backgroundColor: '#121215',
    paddingHorizontal: 12,
  },
  stageClosed: { opacity: 0.55, backgroundColor: '#0e0e11' },
  closedRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 13 },
  closedDot: { width: 8, height: 8, borderRadius: 4 },
  closedNum: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.textMuted, width: 15 },
  closedTitle: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14, color: colors.textSub },
  closedNote: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMutedDeep },

  packetBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
    backgroundColor: 'rgba(255,198,77,.1)',
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  packetBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.1, color: colors.amber },
  packetNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textMuted },

  exercise: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 9,
    backgroundColor: '#121215',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  exerciseNum: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.textMuted, width: 15 },
  exerciseName: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14, color: colors.textPrimary },
  exerciseGo: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.amber },
});

/** Exported for tests: the packet HTML for a project, without touching native. */
export { buildPacketHtml, createProjectStore };
