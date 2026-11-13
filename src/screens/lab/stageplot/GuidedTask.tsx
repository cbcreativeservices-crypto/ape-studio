/**
 * GuidedTask — the OPTIONAL walk-through of the Stage Plot lab (handoff §9):
 * place the performers, add what each one plays or sings, assign monitors, answer the
 * review, make the packet.
 *
 * It is closed until asked for, it never blocks anything, and a user working
 * on a real gig can ignore it. Each step is judged from the project itself
 * (spGuidedSteps), never from a button press, and is shown as done or still
 * to do in words and with a mark; there is no "N of total".
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spGuidedSteps, type SpGuidedStep } from '../../../features/stageplot/spReview';
import { colors, fonts } from '../../../theme/tokens';
import { useSpEditor, type SpAreaId } from './spContext';
import { Button, Section } from './spForm';

const WHERE: Record<SpGuidedStep['id'], { area: SpAreaId; go: string; how: string }> = {
  performers: { area: 'stage', go: 'Stage', how: 'Add each performer in Setup, then put them on the stage in Stage.' },
  sources: { area: 'inputs', go: 'Inputs', how: 'In Inputs, add what each performer plays or sings. For someone who plays nothing that reaches the sound system, add a source with no sound system connection.' },
  monitors: { area: 'monitors', go: 'Monitors', how: 'In Monitors, put each performer on a mix, or say they need none.' },
  review: { area: 'export', go: 'Export', how: 'The tab bar marks each area that has a question. Export lists them all.' },
  export: { area: 'export', go: 'Export', how: 'In Export, print or share the packet.' },
};

/** Open or closed, remembered while the app is open: a visit to another
 *  area (often through a step's GO) does not close the steps (S3-07). */
let stepsOpen = false;

export function GuidedTask() {
  const ed = useSpEditor();
  const [open, setOpenState] = useState(stepsOpen);
  const setOpen = (next: (o: boolean) => boolean) =>
    setOpenState((o) => {
      stepsOpen = next(o);
      return stepsOpen;
    });
  // Worked out only while the steps are on screen.
  const steps = useMemo(() => (open ? spGuidedSteps(ed.project, ed.exported) : []), [open, ed.project, ed.exported]);
  return (
    <Section title="GUIDED TASK (OPTIONAL)" hint="Five steps from an empty stage to a packet. All five done on one stage plot complete this lab. Working on a real gig? Skip this and build what you need.">
      <Button label={open ? 'HIDE THE STEPS' : 'SHOW THE STEPS'} onPress={() => setOpen((o) => !o)} a11yLabel={open ? 'Hide the guided task steps' : 'Show the guided task steps'} />
      {open
        ? steps.map((s) => {
            const w = WHERE[s.id];
            return (
              <View key={s.id} style={styles.step}>
                <Text style={[styles.mark, s.done && styles.markDone]}>{s.done ? '✓' : '○'}</Text>
                <View style={styles.text}>
                  <Text style={styles.label}>{s.label}</Text>
                  {/* "Done" for the review is about its QUESTIONS: a detail that is
                      still to be confirmed is not one, and the user sees those
                      lines in Export beside this "Done". */}
                  <Text style={styles.how}>{!s.done ? `To do. ${w.how}` : s.id === 'review' ? 'Done. A detail that is still to be confirmed can stay open: it is printed as a question for the venue.' : 'Done.'}</Text>
                </View>
                <Button label="GO" onPress={() => ed.goTo(w.area)} a11yLabel={`${s.label}: ${s.done ? 'done' : 'to do'}. Go to ${w.go}`} />
              </View>
            );
          })
        : null}
    </Section>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 18, textAlign: 'center', fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.textSub },
  markDone: { color: colors.green },
  text: { flex: 1, gap: 2 },
  label: { fontFamily: fonts.barlowSemiBold, fontSize: 14.5, lineHeight: 20, color: colors.textPrimary },
  how: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSub },
});
