/**
 * PreProdStageScreen — ONE screen that draws ANY stage of either production lab.
 *
 * Every stage, every pathway, every field goes through here. That is the whole
 * point of the schema: adding Stage 4 is a content file, not a screen (plan
 * §2.1). If this file ever grows a `if (stageId === ...)`, the design has been
 * broken and should be fixed here rather than worked around.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { resolveStage } from '../../../features/production/schema';
import type { NoticeDef } from '../../../features/production/schema';
import { readStage } from '../../../features/production/readiness';
import { projectStore } from '../../../features/production/projectStore';
import type { ProductionProject, FieldValue } from '../../../features/production/types';
import { valueKey } from '../../../features/production/types';
import { authoredStage } from '../../../features/production/preprod';
import { FieldRow, STATE_TINT } from './FieldRow';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, 'PreProdStage'>;

export function PreProdStageScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { projectId, stageId } = useRoute<R>().params;

  const [project, setProject] = useState<ProductionProject | null>(null);

  useEffect(() => {
    let alive = true;
    void projectStore()
      .get('preprod', projectId)
      .then((p) => {
        if (alive) setProject(p);
      });
    return () => {
      alive = false;
    };
  }, [projectId]);

  const authored = authoredStage(stageId);
  const stage = useMemo(
    () => (authored && project ? resolveStage(authored, project.pathway) : null),
    [authored, project],
  );
  const report = useMemo(() => (stage && project ? readStage(stage, project) : null), [stage, project]);

  const setValue = useCallback(
    async (fieldId: string, v: FieldValue) => {
      if (!project) return;
      // Optimistic: the field must feel immediate, and the store is the record.
      setProject((cur) => (cur ? { ...cur, values: { ...cur.values, [valueKey(stageId, fieldId)]: v } } : cur));
      const saved = await projectStore().setValue('preprod', project.id, stageId, fieldId, v);
      if (saved) setProject(saved);
    },
    [project, stageId],
  );

  const setNa = useCallback(
    async (fieldId: string, reason: string) => {
      if (!project) return;
      const saved = await projectStore().setNa('preprod', project.id, stageId, fieldId, reason);
      if (saved) setProject(saved);
    },
    [project, stageId],
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 8}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>PRE-PRODUCTION{stage ? ` · STAGE ${stage.num}` : ''}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {stage?.title ?? 'Stage'}
          </Text>
        </View>
        <AccuracyNote variant="practice" compact />
      </View>

      {!project || !stage || !report ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {project ? 'This stage is not authored yet.' : 'Opening the project…'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.intro}>{stage.intro}</Text>

          <View style={styles.why}>
            <Text style={styles.whyHead}>WHY THIS MATTERS</Text>
            <Text style={styles.whyText}>{stage.whyItMatters}</Text>
          </View>

          {stage.notices.map((n, i) => (
            <Notice key={`stage-${i}`} notice={n} />
          ))}

          <View style={styles.progressRow}>
            <View style={[styles.dot, { backgroundColor: STATE_TINT[report.state] }]} />
            <Text style={styles.progressText}>
              {report.answeredRequired} of {report.totalRequired} required decisions made
            </Text>
          </View>

          {stage.sections.map((section) => (
            <View key={section.sectionId} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.intro ? <Text style={styles.sectionIntro}>{section.intro}</Text> : null}
              {section.notices.map((n, i) => (
                <Notice key={`${section.sectionId}-${i}`} notice={n} />
              ))}
              {section.fields.map((field) => {
                const key = valueKey(stage.stageId, field.fieldId);
                const fieldState = report.fields.find((f) => f.fieldId === field.fieldId)?.state ?? 'missing';
                return (
                  <FieldRow
                    key={field.fieldId}
                    field={field}
                    value={project.values[key]}
                    naReason={project.na[key]}
                    state={fieldState}
                    onChange={(v) => void setValue(field.fieldId, v)}
                    onSetNa={(reason) => void setNa(field.fieldId, reason)}
                  />
                );
              })}
            </View>
          ))}

          {report.findings.length > 0 ? (
            <View style={styles.findings}>
              <Text style={styles.findingsHead}>WHAT THIS PLAN IS STILL MISSING</Text>
              {report.findings.map((f) => (
                <View
                  key={f.ruleId}
                  style={[styles.finding, f.severity === 'blocker' && styles.findingBlocker]}
                >
                  <Text style={[styles.findingTitle, f.severity === 'blocker' && styles.findingTitleBlocker]}>
                    {f.title}
                  </Text>
                  <Text style={styles.findingDetail}>{f.detail}</Text>
                  {f.fixHint ? <Text style={styles.findingHint}>{f.fixHint}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

function Notice({ notice }: { notice: NoticeDef }) {
  const tint = notice.kind === 'qualified' ? colors.red : notice.kind === 'safety' ? colors.orange : colors.textSub;
  const head = notice.kind === 'qualified' ? 'QUALIFIED PERSONNEL' : notice.kind === 'safety' ? 'SAFETY' : 'LEGAL';
  return (
    <View style={[styles.notice, { borderLeftColor: tint }]}>
      <Text style={[styles.noticeHead, { color: tint }]}>{head}</Text>
      <Text style={styles.noticeText}>{notice.text}</Text>
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

  body: { padding: 16, gap: 14 },
  intro: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  why: { borderLeftWidth: 3, borderLeftColor: colors.hairlineAlt, paddingLeft: 11, paddingVertical: 2 },
  whyHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textMuted, marginBottom: 3 },
  whyText: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSub },

  notice: {
    borderLeftWidth: 3,
    backgroundColor: '#111114',
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  noticeHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.9, marginBottom: 3 },
  noticeText: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSub },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  progressText: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.textSub },

  section: { marginTop: 8 },
  sectionTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 15,
    letterSpacing: 0.5,
    color: colors.amber,
    marginBottom: 4,
  },
  sectionIntro: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSub, marginBottom: 12 },

  findings: { marginTop: 6, gap: 9 },
  findingsHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textMuted },
  finding: {
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
    backgroundColor: '#111114',
    borderRadius: 6,
    padding: 11,
  },
  findingBlocker: { borderLeftColor: colors.red },
  findingTitle: { fontFamily: fonts.barlowSemiBold, fontSize: 13.5, color: colors.textPrimary, marginBottom: 3 },
  findingTitleBlocker: { color: colors.red },
  findingDetail: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSub },
  findingHint: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary, marginTop: 5 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyText: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub, textAlign: 'center' },
});
