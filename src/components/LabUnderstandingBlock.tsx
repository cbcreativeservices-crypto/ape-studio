/**
 * LabUnderstandingBlock — the end-of-lab understanding check for the labs
 * that build their own screen rather than LabShell / PagedLab (Smart
 * Processors, Cymatics, Mic Selection, Vacuum Tube, Amp, the EQ Lab home).
 * Owner 2026-10-13: passing a practice lab's check is what completes it for
 * the certificates, so every 'understanding' lab in trainingLabKeys must be
 * able to show its check.
 *
 * Opt-in BY DATA, exactly like the shells: with no questions authored under
 * `labId` in UNDERSTANDING_CHECKS this renders NOTHING — no empty checkbox, no
 * promise of one. Passing banks the lab's UNDERSTANDING unit (the same queue
 * the shells use) and reports the lab's tr_ key (trainingKeyForCheck).
 */
import { StyleSheet, View } from 'react-native';
import { LabUnderstandingCheck } from './LabUnderstandingCheck';
import { UNDERSTANDING_UNIT, understandingFor } from '../features/lab/understanding';
import { markLabUnit, registerLabUnits, useLabClearedUnits } from '../features/lab/labCompletion';
import { trainingKeyForCheck } from '../features/lab/trainingLabKeys';
import { reportTrainingComplete } from '../features/lab/trainingSignal';

/** What a passed check does — shared so every surface banks it the same way. */
export function passUnderstandingCheck(labId: string): void {
  registerLabUnits(labId as never, [UNDERSTANDING_UNIT]);
  markLabUnit(labId as never, UNDERSTANDING_UNIT);
  reportTrainingComplete(trainingKeyForCheck(labId));
}

export function LabUnderstandingBlock({ labId, labTitle }: { labId: string; labTitle: string }) {
  const banked = useLabClearedUnits(labId);
  const questions = understandingFor(labId);
  if (!questions) return null;
  return (
    <View style={styles.wrap}>
      <LabUnderstandingCheck labTitle={labTitle} questions={questions} passed={banked.has(UNDERSTANDING_UNIT)} onPassed={() => passUnderstandingCheck(labId)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
});
