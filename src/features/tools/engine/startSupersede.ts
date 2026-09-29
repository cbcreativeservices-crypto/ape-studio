/**
 * startSupersede — what a superseded engine start does with the shared mic
 * (bug hunt 2026-09-29).
 *
 * useDspEngine bumps its generation on every start, stop, blur, unmount and
 * watchdog trip. A start whose generation no longer matches when acquireMic()
 * resolves has been SUPERSEDED — but by what matters:
 *
 *  - by a STOP (or blur / unmount / watchdog): nobody owns the stream any more,
 *    so hand it back with the debounced releaseMic() — a fast re-acquire by the
 *    next screen keeps it warm, otherwise it closes.
 *  - by a NEWER START: that start already owns (or is about to adopt) the same
 *    shared stream. Calling releaseMic() here armed the 1.5 s debounce AFTER the
 *    newer start's acquireMic() had cancelled the previous one, so the timer
 *    fired doStop() under a screen that read 'running' — the UI said ON over a
 *    dead mic (double START, or STOP → START while the HAL was still opening:
 *    the SPL mic cell / tap glass, RT60 ARM auto-start, Waveform TRY AGAIN).
 *
 * `latestStartGen` is the generation handed to the most recent start() call.
 * Pure so the decision is testable without React or the native module.
 */
export function releaseOnSupersede(gen: number, latestStartGen: number): boolean {
  // A newer start() took the stream over — leave it alone.
  return latestStartGen <= gen;
}
