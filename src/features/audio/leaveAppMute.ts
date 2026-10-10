/**
 * "Mute audio when I leave the app" (owner 2026-10-01: "Leaving the app mutes
 * audio — make it optional in Settings").
 *
 * Pure module — no React Native, no storage — so the decision and the copy can
 * be tested in node. The persisted value lives in `ape:settings`
 * (`muteAudioOnLeave`, settings/store.ts), which pushes it here on load, save
 * and account reset; this is the synchronous mirror the AppState handler in
 * AudioOutputGate reads at the moment the app is backgrounded.
 *
 * DEFAULT ON — today's behaviour (2026-09-17): leaving the app runs
 * panicMuteAudio(), which stops every voice AND re-locks the output gate.
 *
 * OFF — leaving the app STILL stops every sounding voice (stopAllSound()); it
 * only leaves the gate on. ⛔ The setting never permits a tone to keep playing
 * behind the user: on Android the ape-dsp Oboe stream holds no audio focus and
 * would play on with nothing to stop it. The 20-minute idle rule is unchanged —
 * coming back after 20 minutes untouched still finds the output off.
 */

export const MUTE_ON_LEAVE_DEFAULT = true;

let muteOnLeave = MUTE_ON_LEAVE_DEFAULT;

/** Read by the AppState handler — synchronous, never awaits storage. */
/**
 * A system sheet WE opened (owner 2026-10-09: "pressing the save button auto
 * muted the Pixel"). Android's share sheet is another app's window, so the app
 * reads 'background' and the leave-the-app mute fired. While a sheet the app
 * itself opened is up, that background is not "leaving". Bounded: after
 * `maxMs` the normal leave rule applies again (AudioOutputGate re-checks).
 */
let sheetUntil = 0;
export function expectSystemSheet(maxMs = 60_000): () => void {
  sheetUntil = Date.now() + maxMs;
  return () => {
    sheetUntil = 0;
  };
}
/** ms left on an open system sheet (0 = none). */
export function systemSheetMsLeft(): number {
  return Math.max(0, sheetUntil - Date.now());
}

export function muteOnLeaveEnabled(): boolean {
  return muteOnLeave;
}

/** Fed by settings/store.ts (load / save / resetLocal). */
export function setMuteOnLeave(on: boolean): void {
  muteOnLeave = on !== false; // anything but an explicit false keeps the safe default
}

export type LeaveAction = 'mute' | 'stopSound';

/**
 * What leaving the app does. Both branches stop every sound; only 'mute'
 * locks the output gate as well.
 */
export function onLeaveApp(
  muteOnLeaveOn: boolean,
  fx: { panicMute: () => void; stopAllSound: () => void },
): LeaveAction {
  if (muteOnLeaveOn) {
    fx.panicMute();
    return 'mute';
  }
  fx.stopAllSound();
  return 'stopSound';
}

/** The enable-audio popup's body sentence — true for the current setting. */
export function enableAudioBody(muteOnLeaveOn: boolean): string {
  return muteOnLeaveOn
    ? "Hold the button for 5 seconds to allow sound. It stays on while you're using the app, mutes itself after 20 minutes untouched, and mutes when you leave the app — so nothing is left playing behind you."
    : "Hold the button for 5 seconds to allow sound. It stays on while you're using the app and mutes itself after 20 minutes untouched. When you leave the app, any sound that is playing stops — so nothing is left playing behind you.";
}

/** Settings row copy. */
export const MUTE_ON_LEAVE_LABEL = 'Mute audio when I leave the app';
export const MUTE_ON_LEAVE_HINT =
  'On: switching apps or locking the phone turns audio output off, and you re-enable it when you come back. Off: any sound that is playing stops when you leave, but audio output stays on for when you return (it still turns itself off after 20 minutes untouched).';
