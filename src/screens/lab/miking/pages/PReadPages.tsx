/**
 * Pages 6–8 — TROUBLESHOOT, PRACTICE, SOURCES (blueprint §7 rows 6–8).
 * Document pages (no live display), so they are READ steps.
 *
 * Practice's observation sheet is OPTIONAL (it needs a real drum) and never
 * gates credit. It is kept on this device for a signed-in account only;
 * "Saved on this device" comes only from a write that returned true (P6),
 * and the save button is latched while the write is out (P9).
 */
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { useLatchedPress } from '../../../../lib/latch';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, KeyButton, Note, Point, ScenarioList, SymptomCard } from '../engine/kit';
import { saveObservation, useObservations } from '../engine/progress/observations';
import type { PageProps } from './pageTypes';

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
          <Body>Each card is a row of the lesson’s troubleshooting table. Choose the FIRST things to check; a retry is explained, never penalised.</Body>
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
  const steps: MikingStep[] = [
    {
      key: 'practice',
      title: 'Your setup',
      kind: 'PRACTICE',
      layout: 'read',
      body: (
        <>
          <Body>{lesson.practice.task}</Body>
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'practice')} answers={answers} onAnswered={onAnswered} />
          <Card>
            <Point title="OBSERVATION SHEET · OPTIONAL">For a real drum, with the drummer’s agreement and the drummer stopped while anything moves. Write tendencies in words — what you heard, not a promised result.</Point>
            {lesson.practice.fields.map((f) =>
              f.kind === 'choice' ? (
                <View key={f.id} style={{ gap: 4 }}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <View style={styles.chips}>
                    {(f.choices ?? []).map((c) => (
                      <Pressable key={c} onPress={() => setFields((p) => ({ ...p, [f.id]: c }))} style={[styles.chip, fields[f.id] === c && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: fields[f.id] === c }}>
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

export function PSources({ lesson }: PageProps) {
  const steps: MikingStep[] = [
    {
      key: 'sources',
      title: 'Sources',
      kind: 'READ',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="WHERE THE SOURCES AGREE">{lesson.audit.agreement}</Point>
            <Point title="WHERE THEY PULL APART">{lesson.audit.tension}</Point>
            <Point title="WHAT THEY DO NOT GIVE">{lesson.audit.gaps}</Point>
          </Card>
          <Text style={styles.head}>REFERENCES</Text>
          {lesson.sources.map((s) => (
            <View key={s.key} style={styles.src}>
              {s.url ? (
                <Text style={styles.link} onPress={() => void Linking.openURL(s.url!).catch(() => {})} accessibilityRole="link">
                  {s.label}
                </Text>
              ) : (
                <Text style={styles.srcText}>{s.label}</Text>
              )}
              {s.note ? <Text style={styles.small}>{s.note}</Text> : null}
              {s.checked ? <Text style={styles.small}>{`Checked ${s.checked}`}</Text> : null}
            </View>
          ))}
          <Text style={styles.head}>STILL UNKNOWN (drawn ILLUSTRATIVE, never a readout)</Text>
          {lesson.unknowns.map((u) => (
            <Text key={u} style={styles.srcText}>{`• ${u}`}</Text>
          ))}
          <Text style={styles.head}>CORRECTIONS MADE TO THE LESSON TEXT</Text>
          {lesson.corrections.map((c) => (
            <Text key={c.id} style={styles.srcText}>{`${c.id} · ${c.text}`}</Text>
          ))}
          <Note>Manufacturer positions are documented starting points for particular products — not mandatory positions, and not predictions of another mic or drum. A drummer and a qualified practitioner should review real setups.</Note>
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

const styles = StyleSheet.create({
  head: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.6, marginTop: 6 },
  src: { gap: 2, borderLeftWidth: 2, borderLeftColor: colors.hairline, paddingLeft: 8 },
  link: { color: colors.cyanBright, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18, textDecorationLine: 'underline' },
  srcText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  small: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  fieldLabel: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1 },
  input: { minHeight: 40, borderWidth: 1, borderColor: colors.hairline, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: colors.textPrimary, fontFamily: fonts.barlowRegular, fontSize: 14, backgroundColor: '#101013' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#101114' },
  chipOn: { borderColor: colors.amber, backgroundColor: '#1d1709' },
  chipText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
});
