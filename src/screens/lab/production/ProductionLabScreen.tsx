/**
 * ProductionLabScreen — the home of EITHER production lab.
 *
 * One screen, two labs. Which one it is arrives in the route params, and
 * everything else — the title, the stage list, the exercises, what the export
 * is called — is read from `labs.ts`. A third lab would be a row in that file
 * and no new screen at all.
 *
 * Two states: no project yet (pick a project type and start one), or a project
 * open (its readiness, its stages, and the packet).
 *
 * The stage list shows the WHOLE process, including any stage not authored yet,
 * because a user should see the shape of the work rather than only the parts
 * that happen to be finished. An unauthored stage is plainly not open — with no
 * timeline and no promise attached, per the standing copy rule. Both labs are
 * fully authored as of 2026-09-17, so today that path draws nothing.
 */
import { Fragment, useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { notify } from '../../../lib/confirm';
import type { RootStackParamList } from '../../../navigation/types';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { resolveStage } from '../../../features/production/schema';
import { readProject } from '../../../features/production/readiness';
import { buildPacketHtml, exportPacketPdf, isPdfAvailable } from '../../../features/production/packet';
import { createProjectStore, newProject, projectStore } from '../../../features/production/projectStore';
import type { Finding, PathwayId, ProductionProject } from '../../../features/production/types';
import { LAUNCH_PATHWAYS, PATHWAY_LABEL } from '../../../features/production/types';
import { authoredStage, labDef } from '../../../features/production/labs';
import { ReadinessMeter, StageProgressRow } from './ReadinessMeter';
import { AcceptConditionSheet } from './AcceptConditionSheet';
import { STATE_TINT } from './FieldRow';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, 'ProductionLab'>;

/** Small numbers read better as words in a heading. */
const NUMBER_WORD: Record<number, string> = { 4: 'FOUR', 5: 'FIVE', 6: 'SIX', 7: 'SEVEN', 8: 'EIGHT', 9: 'NINE' };

export function ProductionLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { lab } = useRoute<R>().params;
  const def = labDef(lab);
  const [projects, setProjects] = useState<ProductionProject[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  /** The blocker the user is choosing to accept rather than fix. */
  const [accepting, setAccepting] = useState<Finding | null>(null);

  const reload = useCallback(async () => {
    const list = await projectStore().load(lab);
    setProjects(list);
    setOpenId((cur) => cur ?? list[0]?.id ?? null);
  }, [lab]);

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
    const resolved = def.outline
      .map((o) => authoredStage(lab, o.stageId))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      // Values are passed so `showWhen` can hide conditional fields — and,
      // crucially, so readiness counts the SAME set the user was asked. A
      // hidden field must never count as missing.
      .map((s) => resolveStage(s, project.pathway, project.values));
    return { stages: resolved, report: readProject(resolved, project) };
  }, [project, def, lab]);

  const start = useCallback(
    async (pathway: PathwayId) => {
      const p = newProject(lab, pathway, `${PATHWAY_LABEL[pathway]} ${def.newProjectNoun}`);
      // A new project that did not reach storage looks identical to one that
      // did, right up until the learner closes the app (2026-09-17).
      const ok = await projectStore().upsert(p);
      if (!ok) {
        notify(
          'Could not create the project',
          'This device could not save a new project. Free up some space and try again.',
        );
        return;
      }
      await reload();
      setOpenId(p.id);
    },
    [reload, lab, def],
  );

  /**
   * Record an accepted condition. The store refuses one without a name AND a
   * reason, so this cannot become a dismiss button even by accident.
   */
  const acceptCondition = useCallback(
    async (acceptedBy: string, reason: string) => {
      if (!project || !accepting) return;
      const saved = await projectStore().acceptCondition(lab, project.id, {
        ruleId: accepting.ruleId,
        acceptedBy,
        reason,
        at: Date.now(),
      });
      setAccepting(null);
      if (saved) await reload();
    },
    [project, accepting, reload, lab],
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
          <Text style={styles.title}>{def.title}</Text>
        </View>
        <AccuracyNote variant="practice" compact />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 34 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.blurb}>{def.blurb}</Text>

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

            {report ? (
              <ReadinessMeter report={report} lab={lab} onAcceptBlocker={setAccepting} />
            ) : null}

            <Text style={styles.sectionTitle}>
              {`THE ${NUMBER_WORD[def.outline.length] ?? def.outline.length} STAGES`}
            </Text>
            {def.outline.map((o, i) => {
              const sr = report?.stages.find((s) => s.stageId === o.stageId);
              const open = Boolean(authoredStage(lab, o.stageId));
              // Post-Production groups its eight stages into the owner's three
              // chapters; Pre-Production has none and draws no headings.
              const chapter =
                def.chapters && o.chapter && def.outline[i - 1]?.chapter !== o.chapter
                  ? def.chapters.find((c) => c.num === o.chapter)
                  : undefined;
              return (
                <Fragment key={o.stageId}>
                  {chapter ? (
                    <Text style={styles.chapter}>
                      {`CHAPTER ${chapter.num} · ${chapter.title.toUpperCase()}`}
                    </Text>
                  ) : null}
                  <Pressable
                  style={[styles.stage, !open && styles.stageClosed]}
                  disabled={!open}
                  onPress={() =>
                    navigation.navigate('ProductionStage', { lab, projectId: project.id, stageId: o.stageId })
                  }
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
                </Fragment>
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
            {def.stages
              .filter((s) => s.activity && (!s.activity.onlyFor || s.activity.onlyFor.includes(project.pathway)))
              .map((s) => (
              <Pressable
                key={s.activity!.activityId}
                style={styles.exercise}
                onPress={() =>
                  navigation.navigate('ProductionActivity', {
                    lab,
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

            <Text style={styles.sectionTitle}>{def.packetName.toUpperCase()}</Text>
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

      <AcceptConditionSheet
        finding={accepting}
        onCancel={() => setAccepting(null)}
        onAccept={(name, reason) => void acceptCondition(name, reason)}
      />
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
  /** Chapter heading above the first stage of each of Post-Production's three. */
  chapter: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textSub,
    marginTop: 10,
    marginBottom: 2,
  },
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
