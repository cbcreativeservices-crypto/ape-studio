/**
 * pages/shared — what every Game Audio lab page uses to talk to the scene:
 * the dock keys the pages share, and `useSince`, which lets a page judge its
 * goals from what happened DURING THIS VISIT.
 *
 * GOALS ARE FACTS. The model counts what really happened (model/gaModel
 * `facts`): a door event posted, a speed changed while its instance played,
 * a duplicate ignored. A goal is "that count went up since the page opened".
 * Pressing a button never completes a goal by itself; with sound off the
 * facts still happen, so nobody is blocked by not hearing.
 */
import { useRef } from 'react';
import { colors } from '../../../../theme/tokens';
import type { DockParam } from '../../rack/rackTypes';
import { gaFact, gaFactKinds, type GaState } from '../model/gaModel';
import { gaDispatch } from '../model/gaStore';

/** Counts since this page was opened. `since(k)` = how many times fact `k`
 *  happened on this visit; `kinds(prefix)` = how many NEW different facts
 *  with that prefix (for "hear three different takes"). */
export function useSince(s: GaState): { since: (k: string) => number; kinds: (prefix: string) => number } {
  const base = useRef<Record<string, number> | null>(null);
  if (base.current === null) base.current = { ...s.facts };
  const b = base.current;
  return {
    since: (k) => gaFact(s, k) - (b[k] ?? 0),
    kinds: (prefix) => Object.keys(s.facts).filter((k) => k.startsWith(prefix) && (s.facts[k] ?? 0) > (b[k] ?? 0)).length,
  };
}
export { gaFact, gaFactKinds };

const pct = (v: number) => `${Math.round(v * 100)}%`;

/*
 * ONE NAME FOR EACH SHARED KEY (audit 2, learning report section 4):
 *   the generator   GENERATOR 1 / GENERATOR 2 wherever there is room (the
 *                   slider's own line, tray chips, lesson text, the log).
 *                   GEN 1 / GEN 2 only on a dock key, which is too narrow
 *                   for the whole name. Never "machine": on page 18 a
 *                   machine is a player's computer.
 *   the door        OPEN DOOR / CLOSE DOOR: the key names what a press does.
 *   a footstep      STEP where only YOU walk; STEP: YOU and STEP: GUIDE where
 *                   both walk (a colon, never a middle dot: "·" marks a state).
 *   the slider      SPEED, FACING: the word on the key is the word in the text.
 */

/** The generator's SPEED: a PARAMETER. The value is kept on that one
 *  generator (the game object); the instance playing on it follows it. A
 *  value set while nothing plays is kept, and the next start begins there. */
export const speedKey = (s: GaState, id = 'generator-1', label = 'SPEED'): DockParam => {
  const m = s.machines.find((x) => x.id === id);
  return {
    kind: 'fader',
    id: `speed-${id}`,
    label,
    value: m?.speed ?? 0.4,
    home: 0.4,
    onChange: (v) => gaDispatch({ type: 'speed', id, value: v }),
    format: (v) => `${id === 'generator-1' ? 'GENERATOR 1' : 'GENERATOR 2'} · ${pct(v)}`,
    formatShort: pct,
    locked: m ? undefined : 'There is no second generator in the scene yet',
  };
};

/** Start or stop a generator: an EVENT (start) and its stop. */
export const machineKey = (s: GaState, id = 'generator-1', label = id === 'generator-1' ? 'GEN 1' : 'GEN 2'): DockParam => {
  const m = s.machines.find((x) => x.id === id);
  return {
    kind: 'toggle',
    id: `machine-${id}`,
    label,
    value: !!m?.on,
    onToggle: () => gaDispatch({ type: 'machine', id, on: !m?.on }),
    locked: m ? undefined : 'There is no second generator in the scene yet',
  };
};

/** Open or close the door: one event, posted by the game each time. */
export const doorKey = (s: GaState): DockParam => ({
  kind: 'action',
  id: 'door',
  label: s.doorOpen ? 'CLOSE DOOR' : 'OPEN DOOR',
  onPress: () => gaDispatch({ type: 'door' }),
  tint: colors.amber,
});

/** One footstep: a foot-contact TRIGGER from this character. The guide's key
 *  says whose step it is; a page where both walk passes 'STEP: YOU' for you. */
export const stepKey = (who: 'player' | 'guide' = 'player', label = who === 'guide' ? 'STEP: GUIDE' : 'STEP'): DockParam => ({
  kind: 'action',
  id: `step-${who}`,
  label,
  onPress: () => gaDispatch({ type: 'step', who }),
  tint: colors.amber,
});

/** The FACING lane's position (0 … 1) as degrees: steps of 5°, from 0° at the
 *  left end to 355° at the right end. The right end is NOT 360°: the model
 *  keeps 360° as 0°, so the knob jumped from the far right to the far left
 *  when the finger let go there (audit 2: W1 F19, W2-08). */
export const facingFromLane = (v: number): number => Math.min(71, Math.max(0, Math.round(v * 72))) * 5;

/** Which way the player (the listener) faces, as a lane. */
export const facingKey = (s: GaState): DockParam => ({
  kind: 'fader',
  id: 'facing',
  label: 'FACING',
  value: s.chars.player.facing / 360,
  onChange: (v) => gaDispatch({ type: 'face', who: 'player', facing: facingFromLane(v) }),
  format: (v) => `YOU FACE ${facingFromLane(v)}°`,
  formatShort: (v) => `${facingFromLane(v)}°`,
});

export const doorWord = (s: GaState): string => (s.doorOpen ? 'OPEN' : 'CLOSED');
export { pct };
