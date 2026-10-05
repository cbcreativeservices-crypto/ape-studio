/**
 * TROUBLESHOOT and PRACTICE (blueprint §7). Document pages (no live display),
 * so they are READ steps. The lesson ends at Practice → the what's-left
 * screen (owner ruling 2026-10-04 took the Sources page out of the lesson).
 *
 * PRACTICE (reviews C1/C2/M12, 2026-10-04) is three steps: the one-mic setup
 * IN ORDER plus a gain/headroom judgement; two setup BRIEFS where several
 * setups pass and the reasons are what is checked (lesson L89: "more than one
 * acceptable solution"), plus the second-channel card; and a short MIXED
 * review reaching back to pages 3–5.
 *
 * Practice's observation sheet is OPTIONAL (it needs a real drum) and never
 * gates credit. It is kept on this device for a signed-in account only;
 * "Saved on this device" comes only from a write that returned true (P6),
 * and the save button is latched while the write is out (P9).
 */
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { useLatchedPress } from '../../../../lib/latch';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, KeyButton, Note, OrderTaskCard, Point, ScenarioList, SetupTaskCard, SymptomCard } from '../engine/kit';
import { saveObservation, useObservations } from '../engine/progress/observations';
import type { PageProps } from './pageTypes';
import { copyOf } from '../engine/model/copy.ts';

export function PTroubleshoot({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const all = lesson.symptoms.every((s) => s.id in answers);
  useEffect(() => {
    if (all && !interactiveDone.has('symptoms')) onInteractive('symptoms');
  }, [all, interactiveDone, onInteractive]);
  const steps: MikingStep[] = [
    {
      key: 'symptoms',
      title: 'Symptoms',
      kind: 'READ',
      layout: 'read',
      body: (
        <>
          <Body>Each card is a symptom you may meet. Choose the FIRST things to check; a retry is explained, never penalised.</Body>
          <Body>{`${lesson.symptoms.filter((s) => s.id in answers).length} of ${lesson.symptoms.length} answered.`}</Body>
          {lesson.symptoms.map((s) => (
            <SymptomCard key={s.id} s={s} answered={s.id in answers} onAnswered={(ok) => onAnswered(s.id, ok)} />
          ))}
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

export function PPractice({ lesson, answers, onAnswered, canSave, preview }: PageProps) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [result, setResult] = useState<'saved' | 'failed' | null>(null);
  const sheets = useObservations(lesson.id);
  const save = useLatchedPress(async () => {
    const ok = await saveObservation({ id: `${lesson.id}:${Date.now()}`, lessonId: lesson.id, at: Date.now(), fields });
    setResult(ok ? 'saved' : 'failed');
    if (ok) setFields({});
  });
  const order = lesson.orderTasks.filter((t) => t.page === 'practice');
  const setups = lesson.setupTasks.filter((t) => t.page === 'practice');
  const pick = (ids: readonly string[]) => lesson.scenarios.filter((s) => ids.includes(s.id));
  const P = copyOf(lesson).practice;
  const steps: MikingStep[] = [
    {
      key: 'order',
      title: 'Set up in order',
      kind: 'PRACTICE',
      layout: 'read',
      body: (
        <>
          <Body>A one-mic setup, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.</Body>
          {order.map((t) => (
            <OrderTaskCard key={t.id} t={t} answered={t.id in answers} onAnswered={(ok) => onAnswered(t.id, ok)} />
          ))}
          <ScenarioList items={pick([P.gain])} answers={answers} onAnswered={onAnswered} />
          <Note tone="warn">Protect your hearing through all of this: keep levels and repetitions down during soundcheck, and use hearing protection.</Note>
        </>
      ),
    },
    {
      key: 'setup',
      title: 'Your setup',
      kind: 'PRACTICE',
      layout: 'read',
      body: (
        <>
          <Body>{lesson.practice.task}</Body>
          <Body>Each brief accepts more than one setup — there is no single right answer. Choose one, then tick every reason that justifies it: the check reads your reasoning, not a single “right” position.</Body>
          {setups.map((t) => (
            <SetupTaskCard key={t.id} t={t} answered={t.id in answers} onAnswered={(ok) => onAnswered(t.id, ok)} />
          ))}
          <ScenarioList items={pick([P.second])} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
    {
      key: 'mixed',
      title: 'Mixed review',
      kind: 'PRACTICE',
      layout: 'read',
      body: (
        <>
          <Body>{P.mixedIntro}</Body>
          <ScenarioList items={pick(P.mixed)} answers={answers} onAnswered={onAnswered} />
          <Card>
            <Point title="OBSERVATION SHEET · OPTIONAL">{copyOf(lesson).terms?.observation ?? 'For a real drum, with the drummer’s agreement and the drummer stopped while anything moves. Write tendencies in words — what you heard, not a promised result.'}</Point>
            {lesson.practice.fields.map((f) =>
              f.kind === 'choice' ? (
                <View key={f.id} style={{ gap: 4 }}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <View style={styles.chips}>
                    {(f.choices ?? []).map((c) => (
                      <Pressable key={c} onPress={() => setFields((p) => ({ ...p, [f.id]: c }))} style={[styles.chip, fields[f.id] === c && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: fields[f.id] === c }} accessibilityLabel={`${f.label}: ${c}`}>
                        <Text style={[styles.chipText, fields[f.id] === c && { color: colors.amber }]}>{c}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                <View key={f.id} style={{ gap: 4 }}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput value={fields[f.id] ?? ''} onChangeText={(v) => setFields((p) => ({ ...p, [f.id]: v }))} style={styles.input} placeholderTextColor={colors.textMuted} accessibilityLabel={f.label} maxLength={600} multiline={f.id === 'notes'} />
                </View>
              ),
            )}
            {canSave ? (
              <KeyButton label="SAVE THIS SHEET" onPress={save} disabled={Object.values(fields).every((v) => !v.trim())} />
            ) : (
              <Note>{preview ? 'The preview does not keep sheets.' : 'Sheets are kept only when you are signed in to your account.'}</Note>
            )}
            {result === 'saved' ? <Note tone="ok">Saved on this device.</Note> : null}
            {sheets.length ? <Body>{`${sheets.length} sheet${sheets.length === 1 ? '' : 's'} on this device for this lesson (the newest 24 are kept).`}</Body> : null}
          </Card>
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

const styles = StyleSheet.create({
  fieldLabel: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1 },
  input: { minHeight: 40, borderWidth: 1, borderColor: colors.hairline, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: colors.textPrimary, fontFamily: fonts.barlowRegular, fontSize: 14, backgroundColor: '#101013' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#101114' },
  chipOn: { borderColor: colors.amber, backgroundColor: '#1d1709' },
  chipText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
});
