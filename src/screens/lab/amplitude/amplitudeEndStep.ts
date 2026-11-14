/**
 * The "What's left" step for Understanding Level & Amplitude — pure, so it is
 * testable (lab fix round 2026-11-14, G1_AmplitudeLab.md page 2: the card
 * still said "Pass CHECK YOURSELF" after the check was passed, which reads as
 * "your answers were lost").
 *
 * The lab's credit needs two acts: pass the ramp check, then press
 * UNDERSTOOD — MARK REVIEWED. Once the orientation is complete the page shows
 * a plain MARK REVIEWED instead.
 */
export function amplitudeEndStep(s: { checkPassed: boolean; orientationDone: boolean }): string {
  if (s.orientationDone) return 'Press MARK REVIEWED (your check is already passed)';
  if (s.checkPassed) return 'Press UNDERSTOOD — MARK REVIEWED (your check is passed)';
  return 'Pass CHECK YOURSELF — THREE QUICK READS, then press UNDERSTOOD — MARK REVIEWED';
}
