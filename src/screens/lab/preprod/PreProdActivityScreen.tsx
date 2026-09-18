/**
 * PreProdActivityScreen — runs ONE interactive exercise.
 *
 * The design decision that matters: an activity does NOT get its own editor.
 * It seeds a real project into a deliberately broken state and sends the user
 * into the ordinary stage screen to repair it. So the learner does the real
 * task on the real screens, with every rule and the whole readiness meter live,
 * rather than practising on a simulator that behaves differently.
 *
 * This screen is therefore a brief, a live checklist and a debrief. It holds no
 * copy of the engine's judgement — `checkActivity` decides, and it reports each
 * criterion separately so somebody who has done three of four things sees the
 * one that is left. Showing WHICH one is outstanding is the difference between
 * teaching and marking.
 */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { checkActivity, seedActivityProject, type ActivityResult } from '../../../features/production/activities';
import { projectStore } from '../../../features/production/projectStore';
import type { ProductionProject } from '../../../features/production/types';
import { PATHWAY_LABEL } from '../../../features/production/types';
import { PREPROD_STAGES } from '../../../features/production/preprod';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, 'PreProdActivity'>;

export function PreProdActivityScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { activityId, pathway } = useRoute<R>().params;

  const [project, setProject] = useState<ProductionProject | null>(null);
  const [debriefOpen, setDebriefOpen] = useState(false);

  const stage = useMemo(
    () => PREPROD_STAGES.find((s) => s.activity?.activityId === activityId),
    [activityId],
  );
  const activity = stage?.activity;

  /**
   * Resume the exercise if it is already under way, otherwise seed it.
   * Keyed on scenarioId so a learner who leaves mid-repair comes back to their
   * own work rather than a fresh broken copy.
   */
  const load = useCallback(async () => {
    if (!activity) return;
    const existing = (await projectStore().load('preprod')).find((p) => p.scenarioId === activityId);
    if (existing) {
      setProject(existing);
      return;
    }
    const seeded = seedActivityProject('preprod', pathway, activity);
    await projectStore().upsert(seeded);
    setProject(seeded);
  }, [activity, activityId, pathway]);

  // Re-read on focus: the repair happens on the stage screen, so coming back
  // must re-run the check rather than show a stale verdict.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const result: ActivityResult | null = useMemo(
    () => (project ? checkActivity(activityId, project) : null),
    [activityId, project],
  );

  const restart = useCallback(async () => {
    if (!activity || !project) return;
    await projectStore().remove('preprod', project.id);
    const seeded = seedActivityProject('preprod', pathway, activity);
    await projectStore().upsert(seeded);
    setProject(seeded);
    setDebriefOpen(false);
  }, [activity, project, pathway]);

  if (!activity || !stage) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <Header onBack={() => navigation.goBack()} title="Exercise" />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>This exercise is not available.</Text>
        </View>
      </View>
    );
  }

  const done = result?.passed === true;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Header onBack={() => navigation.goBack()} title={activity.title} kicker={`STAGE ${stage.num} · EXERCISE`} />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 34 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.prompt}>{activity.prompt}</Text>
        <Text style={styles.pathway}>{PATHWAY_LABEL[pathway]}</Text>

        <Pressable
          style={styles.openBtn}
          onPress={() =>
            project && navigation.navigate('PreProdStage', { projectId: project.id, stageId: stage.stageId })
          }
          accessibilityRole="button"
          accessibilityLabel={`Open ${stage.title} and work on the exercise`}
        >
          <Text style={styles.openBtnText}>{done ? 'REVIEW YOUR WORK' : 'OPEN THE PLAN AND FIX IT'}</Text>
        </Pressable>
        <Text style={styles.openHint}>
          You work on the real stage screen, with every check live. Come back here to see how you are doing.
        </Text>

        {result ? (
          <>
            <Text style={styles.sectionTitle}>
              {done
                ? 'SOLVED'
                : `${result.met.length} OF ${result.met.length + result.unmet.length} DONE`}
            </Text>

            {result.met.map((c) => (
              <View key={c.id} style={styles.row}>
                <Text style={styles.tickDone}>✓</Text>
                <Text style={styles.rowTextDone}>{c.label}</Text>
              </View>
            ))}
            {result.unmet.map((c) => (
              <View key={c.id} style={styles.row}>
                <Text style={styles.tickTodo}>○</Text>
                <Text style={styles.rowText}>{c.label}</Text>
              </View>
            ))}
          </>
        ) : null}

        {done ? (
          debriefOpen ? (
            <View style={styles.debrief}>
              <Text style={styles.debriefHead}>WHAT THAT WAS REALLY TEACHING</Text>
              <Text style={styles.debriefText}>{activity.debrief}</Text>
            </View>
          ) : (
            <Pressable
              style={styles.debriefBtn}
              onPress={() => setDebriefOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Read the debrief"
            >
              <Text style={styles.debriefBtnText}>READ THE DEBRIEF</Text>
            </Pressable>
          )
        ) : null}

        <Pressable
          style={styles.restart}
          onPress={() => void restart()}
          accessibilityRole="button"
          accessibilityLabel="Start this exercise again from the beginning"
        >
          <Text style={styles.restartText}>START AGAIN</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Header({ onBack, title, kicker }: { onBack: () => void; title: string; kicker?: string }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
        <Text style={styles.back}>‹</Text>
      </Pressable>
      <View style={{ flex: 1 }}>
        {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <AccuracyNote variant="practice" compact />
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
  prompt: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  pathway: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textMuted },

  openBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
    backgroundColor: 'rgba(255,198,77,.1)',
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  openBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.1, color: colors.amber },
  openHint: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textMuted },

  sectionTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 1.1,
    color: colors.amberLabel,
    marginTop: 10,
  },
  row: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  tickDone: { fontFamily: fonts.barlowSemiBold, fontSize: 14, color: colors.green, width: 14 },
  tickTodo: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textMuted, width: 14 },
  rowText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  rowTextDone: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textMuted },

  debriefBtn: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  debriefBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.textSub },
  debrief: {
    borderLeftWidth: 3,
    borderLeftColor: colors.green,
    backgroundColor: '#111114',
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  debriefHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.9, color: colors.green, marginBottom: 5 },
  debriefText: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },

  restart: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  restartText: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.textMuted },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyText: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub, textAlign: 'center' },
});
