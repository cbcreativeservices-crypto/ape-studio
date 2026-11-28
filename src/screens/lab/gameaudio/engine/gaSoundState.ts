/**
 * gaSoundState — what the Game Audio lab's screen may honestly say about
 * sound, as a pure function (no React Native), so node:test pins it.
 *
 *   off          not asked, or switched off with the SOUND key
 *   declined     the learner said no to the output gate
 *   starting     the engine is starting
 *   on           the engine is running, the gate is open, SOUND is wanted
 *   blocked      the device is holding audio back: tap again
 *   unavailable  no engine on this device
 *   failed       it did not start
 */
import type { GaEngineStatus } from './gaEngine.ts';

export type GaSoundState = 'off' | 'starting' | 'on' | 'blocked' | 'declined' | 'unavailable' | 'failed';

/**
 * @param wanted  the learner asked for sound, the fenced start went through,
 *                and sound has not been switched off since (audit 2, F7:
 *                before this the SOUND key could not switch sound off; check
 *                E, problem 5: it was set before the fence decided, so a
 *                blocked start could read ON with the output shut)
 * @param gateOn  the app's output gate: closed means nothing may sound,
 *                whatever the engine says
 * @param asking  a SOUND press is being answered: 'starting' may be said,
 *                never 'on'
 */
export function gaSoundStateOf(status: GaEngineStatus, declined: boolean, wanted: boolean, gateOn: boolean, asking = false): GaSoundState {
  if (declined) return 'declined';
  if (status === 'unavailable') return 'unavailable';
  if (!wanted) return asking && status === 'starting' ? 'starting' : 'off';
  if (status === 'running') return gateOn ? 'on' : 'off';
  return status === 'starting' ? 'starting' : status === 'blocked' ? 'blocked' : status === 'failed' ? 'failed' : 'off';
}
