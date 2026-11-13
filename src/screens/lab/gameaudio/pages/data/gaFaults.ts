/**
 * gaFaults — page 19's test bench ("Testing and fault finding"): the five
 * planted faults, what each one's symptom is, and when each counts as fixed.
 * Pure TypeScript (test/gameAudioChD.test.ts drives it with the reducer).
 *
 * Each fault is ONE wrong setting in the model (model/gaModel `faults`, or
 * the variation option). The bench does not trust a button press:
 *
 *   planted   the wrong setting went in ON THIS PAGE          (the state;
 *             every page opens on a clean scene with no fault in)
 *   seen      its SYMPTOM really happened while it was in      (two states
 *             compared: a fact the reducer counted went up)
 *   fixed     planted, seen, and the setting corrected         (the state)
 *
 * Every fault goes in SILENTLY. The repeat fault is the VARIATION option,
 * and the model logs option changes, so it is planted with `quiet: true`:
 * a planted fault must not name itself in the log. Correcting it is the
 * learner's own change and is logged like any other setting.
 *
 * So a learner who starts a fault and switches it straight back has fixed
 * nothing: finding comes before fixing. The orphan loop needs one thing
 * more, the stray loop itself gone, because correcting the setting does
 * not stop a loop that already lost its owner.
 *
 * EVERY SYMPTOM CAN BE MADE FROM THE CLEAN SCENE with the page's own TEST
 * tray, as often as the learner likes (the test walks each one). So the
 * tray's two STEP chips step IN PLACE (`stepInPlace`): a character that
 * walked would reach a wall after a few presses, and a step that cannot
 * move plays no footstep, which would leave faults 3 and 4 with no symptom
 * to make. The wrong-surface fault needs YOU off the wood floor, so the
 * tray has two places to stand (`standMoves`).
 *
 * ONE NAME FOR EACH SETTING. The FIX tray uses the words the learner met
 * where each setting was taught (page 7: WHEN A GENERATOR IS REMOVED · STOP
 * ITS LOOP / LEAVE IT PLAYING; page 8: FOR EACH CHARACTER / FOR EVERYONE;
 * page 9: VARIATION · ON / VARIATION · OFF), the model's bus names, and
 * "generator", never "machine" (page 18 uses that word for a player's
 * computer).
 */
import { gaFact, type GaAction, type GaInstance, type GaState } from '../../model/gaModel.ts';
import { DOOR_POS, START, WALL_X, surfaceAt, zoneAt, type GaPoint, type GaZone } from '../../model/gaWorld.ts';

export type FaultId = 'missingFile' | 'wrongBus' | 'repeat' | 'scope' | 'orphan';

export type FaultDef = {
  id: FaultId;
  /** The card's title: what the learner notices, not the cause. */
  title: string;
  /** The goal chip's words. */
  goal: string;
  /** How to reproduce it, and what to read. */
  symptom: string;
  hints: readonly string[];
  /** Shown once it is fixed: what was wrong and what it teaches. */
  why: string;
  /** How many times the symptom has to be seen (identical footsteps are
   *  only a pattern after a few). */
  need: number;
  /** The setting in the FIX tray: its name (the heading over its two
   *  values), the short name on its chip in the tray's first row, and its
   *  two values. */
  setting: string;
  pick: string;
  right: string;
  wrong: string;
  /** The wrong value is the first of the two chips (mixed from row to row,
   *  so the right one is not always in the same place). */
  wrongFirst: boolean;
};

export const FAULTS: readonly FaultDef[] = [
  {
    id: 'missingFile',
    title: 'FAULT 1 · THE DOOR HAS LOST ITS MAIN SOUND',
    goal: 'Fault 1 fixed: the door',
    symptom: 'Start the fault. In TEST, press OPEN DOOR. The door moves in the picture, but its main sound does not start. Only the latch rattle plays, one second later. Read the newest log lines to find the reason.',
    hints: [
      'Look for the GAME lines first: was the door event posted?',
      'The next line is marked FAULT, and it names a file.',
      'Open FIX and choose DOOR FILE. The door event can point at one of two files. One of them is not in the build.',
    ],
    why: 'The game posted the event correctly. The file the event pointed to was not in the build, so the door layer could not play. Only the rattle layer played. The picture changed all the same; only the log showed the problem. Press the door key again and read the START line that names the door’s file.',
    need: 1,
    setting: 'DOOR EVENT: FILE',
    pick: 'DOOR FILE',
    right: 'door_open.wav',
    wrong: 'door_open_v2.wav',
    wrongFirst: false,
  },
  {
    id: 'wrongBus',
    title: 'FAULT 2 · THE GUIDE SPEAKS, NOTHING TURNS DOWN',
    goal: 'Fault 2 fixed: the guide’s voice',
    symptom: 'Start the fault. In TEST, switch GENERATOR 1 on so that something is playing, then press GUIDE LINE. The caption appears and the line starts, but the log prints no DUCK line and the generator stays at full level. Read which bus the line went to.',
    hints: [
      'A START line ends with the bus the sound was sent to.',
      'This one ends “→ EFFECTS bus”.',
      'The duck acts only for a line on the DIALOGUE bus. Open FIX and choose VOICE BUS.',
    ],
    why: 'The line itself was fine, and it played. It was sent to the effects bus, so the mix did not treat it as speech and nothing turned down. A good sound can still fail through its routing. When the line has ended, play it again and read DUCK on.',
    need: 1,
    setting: 'GUIDE’S VOICE: BUS',
    pick: 'VOICE BUS',
    right: 'DIALOGUE',
    wrong: 'EFFECTS',
    wrongFirst: true,
  },
  {
    id: 'repeat',
    title: 'FAULT 3 · EVERY FOOTSTEP IS IDENTICAL',
    goal: 'Fault 3 fixed: the footsteps',
    symptom: 'Start the fault. In TEST, press STEP: GUIDE three times or more and read the START lines. Each one names the same take, and each step sounds exactly like the one before.',
    hints: [
      'Each footstep START line names its take, for example “take 1 of 4”.',
      'With the fault in, the take number does not change.',
      'Open FIX and choose TAKES.',
    ],
    why: 'Four takes were in the build, but the event played only the first. The ear notices an exact repeat very quickly. With variation on, the take changes from step to step, and level and pitch move a little each time.',
    need: 3,
    setting: 'FOOTSTEPS: THE TAKES',
    // five chips share a row: FOOTSTEPS broke into "FOOTSTE / PS" (seen at 390 pt)
    pick: 'TAKES',
    right: 'VARIATION · ON',
    wrong: 'VARIATION · OFF',
    wrongFirst: false,
  },
  {
    id: 'scope',
    title: 'FAULT 4 · THE GUIDE’S STEPS USE THE WRONG SURFACE',
    goal: 'Fault 4 fixed: the surface',
    symptom: 'Start the fault. In TEST, choose YOU: STONE PATH so that you stand outside. The guide stands on the wood floor of the workshop. Press STEP: GUIDE and read which surface the log names.',
    hints: [
      'The first GAME line for a footstep ends “SWITCH surface = …”.',
      'Compare that word with the floor under the guide in the picture. If you and the guide stand on the same surface, the fault cannot show: choose YOU: STONE PATH in TEST.',
      'The guide’s step used YOUR surface. Open FIX and choose SURFACE.',
    ],
    why: 'The surface is a switch that each character holds for itself. Set for everyone, it gave every character the player’s surface. This is a scope fault: a value that belongs to one object was applied to all of them.',
    need: 1,
    setting: 'SURFACE SWITCH',
    pick: 'SURFACE',
    right: 'FOR EACH CHARACTER',
    wrong: 'FOR EVERYONE',
    wrongFirst: true,
  },
  {
    id: 'orphan',
    title: 'FAULT 5 · A LOOP PLAYS WITH NO GENERATOR',
    goal: 'Fault 5 fixed: the loop',
    symptom: 'Start the fault. In TEST, press ADD GENERATOR 2, switch GENERATOR 2 on, then press REMOVE GENERATOR 2. The generator leaves the picture. Read the log and the PLAYING readout.',
    hints: [
      'The newest log line is marked FAULT and contains the word ORPHAN.',
      'PLAYING still counts the loop, although its generator is gone.',
      'Open FIX, choose REMOVAL and correct the setting. Then stop the stray loop: press ADD GENERATOR 2 and REMOVE GENERATOR 2 again, or press ■ STOP.',
    ],
    why: 'Removing the generator did not stop its loop, so the loop kept its voices with no owner. Cleanup is part of a sound’s design: whatever starts a loop also needs a way to stop it.',
    need: 1,
    setting: 'WHEN A GENERATOR IS REMOVED',
    pick: 'REMOVAL',
    right: 'STOP ITS LOOP',
    wrong: 'LEAVE IT PLAYING',
    wrongFirst: false,
  },
];

export const FAULT_IDS: readonly FaultId[] = FAULTS.map((f) => f.id);
export const faultDef = (id: FaultId): FaultDef => FAULTS.find((f) => f.id === id) as FaultDef;

/** Is this fault's wrong SETTING in right now? */
export function faultSet(id: FaultId, s: GaState): boolean {
  switch (id) {
    case 'missingFile':
      return s.faults.missingDoor;
    case 'wrongBus':
      return s.faults.voWrongBus;
    case 'repeat':
      return !s.options.variation;
    case 'scope':
      return s.faults.globalSurface;
    case 'orphan':
      return s.faults.orphanLoop;
  }
}

/** The actions that put a fault in, or correct its setting. Planting is
 *  silent (see the header). Planting the routing fault also makes sure the
 *  duck is on: a test starts from a known situation, and without the duck
 *  there would be nothing to miss. */
export function faultActions(id: FaultId, on: boolean): GaAction[] {
  switch (id) {
    case 'missingFile':
      return [{ type: 'fault', patch: { missingDoor: on } }];
    case 'wrongBus':
      return on ? [{ type: 'option', patch: { duck: true }, quiet: true }, { type: 'fault', patch: { voWrongBus: true } }] : [{ type: 'fault', patch: { voWrongBus: false } }];
    case 'repeat':
      return on ? [{ type: 'option', patch: { variation: false }, quiet: true }] : [{ type: 'option', patch: { variation: true } }];
    case 'scope':
      return [{ type: 'fault', patch: { globalSurface: on } }];
    case 'orphan':
      return [{ type: 'fault', patch: { orphanLoop: on } }];
  }
}

/** The two values of a fault's setting, in the order the FIX tray shows
 *  them. */
export function fixChoices(def: FaultDef): readonly { label: string; right: boolean }[] {
  const right = { label: def.right, right: true };
  const wrong = { label: def.wrong, right: false };
  return def.wrongFirst ? [wrong, right] : [right, wrong];
}

/** Generator loops still playing whose machine is no longer in the scene. */
export const strayLoops = (s: GaState): GaInstance[] => s.inst.filter((i) => i.event === 'generator' && !s.machines.some((m) => m.id === i.owner));

/* ── the TEST tray's steps ──────────────────────────────────────────────── */

/** STEP: GUIDE and STEP: YOU on page 19: one footstep where the character
 *  stands. A step in place posts its foot-contact trigger and its footstep
 *  like any other, and can be repeated without end (see the header). */
export const stepInPlace = (who: 'player' | 'guide'): GaAction => ({ type: 'step', who, dx: 0, dy: 0 });

/* ── two places to stand ────────────────────────────────────────────────── */

export type StandId = 'path' | 'workshop';

/** STONE PATH is where every page starts YOU; WORKSHOP is on the wood floor,
 *  on the door's line and clear of the guide. */
export const STAND: Readonly<Record<StandId, GaPoint>> = {
  path: { x: START.player.x, y: START.player.y },
  workshop: { x: 13.4, y: DOOR_POS.y },
};
/** In front of the door, on each side of the wall. */
const DOORSTEP: Readonly<Record<GaZone, GaPoint>> = {
  yard: { x: WALL_X - 1, y: DOOR_POS.y },
  room: { x: WALL_X + 1, y: DOOR_POS.y },
};

/** The `move` actions that take YOU to a place from anywhere. A walker
 *  passes the wall only through the open doorway, so a change of zone goes
 *  by the two doorsteps. With the door closed YOU walk up to the door and
 *  stop there: `blocked`, and the tray says to open the door. */
export function standMoves(from: GaPoint, doorOpen: boolean, to: StandId): { moves: GaAction[]; blocked: boolean } {
  const target = STAND[to];
  const here = zoneAt(from);
  const there = zoneAt(target);
  const mv = (p: GaPoint): GaAction => ({ type: 'move', who: 'player', x: p.x, y: p.y });
  if (here === there) return { moves: [mv(target)], blocked: false };
  if (!doorOpen) return { moves: [mv(DOORSTEP[here])], blocked: true };
  return { moves: [mv(DOORSTEP[here]), mv(DOORSTEP[there]), mv(target)], blocked: false };
}

/** Which of the two chips describes where YOU stand now: STONE PATH on the
 *  stone, WORKSHOP on the wood floor, neither on the gravel. */
export function standingOn(s: GaState): StandId | null {
  const su = surfaceAt(s.chars.player);
  return su === 'stone' ? 'path' : su === 'wood' ? 'workshop' : null;
}

/* ── the bench: what was planted, and what was seen ─────────────────────── */

export type FaultProgress = { planted: boolean; seen: number };
export type Bench = Record<FaultId, FaultProgress>;

/** An empty bench. A page opens on a clean scene (the model's `enterPage`),
 *  so whatever the first state still shows was planted somewhere else and
 *  is not this visit's. */
export function benchStart(_s?: GaState): Bench {
  const b = {} as Bench;
  for (const id of FAULT_IDS) b[id] = { planted: false, seen: 0 };
  return b;
}

const delta = (prev: GaState, next: GaState, k: string): number => gaFact(next, k) - gaFact(prev, k);

/** How many times this fault's symptom happened between two states. It can
 *  only happen while the wrong setting is in. */
export function symptomCount(id: FaultId, prev: GaState, next: GaState): number {
  if (!faultSet(id, next)) return 0;
  switch (id) {
    case 'missingFile':
      // the door event was posted and its file was not in the build
      return Math.max(0, delta(prev, next, 'missingAsset'));
    case 'wrongBus':
      // a spoken line was posted to a bus that is not the dialogue bus
      return Math.max(0, delta(prev, next, 'lineOnWrongBus'));
    case 'repeat':
      // a footstep started with only one take allowed
      return Math.max(0, delta(prev, next, 'inst:footstep'));
    case 'scope':
      // a character stepped, and the surface used is not the one under it
      return Math.max(0, delta(prev, next, 'stepWrongSurface'));
    case 'orphan':
      // a machine was removed and its loop played on
      return Math.max(0, delta(prev, next, 'orphan'));
  }
}

/** Advance the bench by one change of the scene. */
export function benchAdvance(b: Bench, prev: GaState, next: GaState): Bench {
  let out = b;
  for (const id of FAULT_IDS) {
    const planted = b[id].planted || faultSet(id, next);
    const seen = b[id].seen + symptomCount(id, prev, next);
    if (planted !== b[id].planted || seen !== b[id].seen) {
      if (out === b) out = { ...b };
      out[id] = { planted, seen };
    }
  }
  return out;
}

/** The fault is still open: its setting is wrong, or (the orphan) the stray
 *  loop it left behind is still playing. */
export function faultOpen(id: FaultId, b: Bench, s: GaState): boolean {
  if (faultSet(id, s)) return true;
  return id === 'orphan' && b.orphan.planted && strayLoops(s).length > 0;
}

/** Fixed: planted on this visit, its symptom seen, and nothing left open. */
export function faultFixed(id: FaultId, b: Bench, s: GaState): boolean {
  return b[id].planted && b[id].seen >= faultDef(id).need && !faultOpen(id, b, s);
}

export const faultsOpen = (b: Bench, s: GaState): number => FAULT_IDS.filter((id) => faultOpen(id, b, s)).length;
/** How many of the five settings are wrong right now. */
export const settingsWrong = (s: GaState): number => FAULT_IDS.filter((id) => faultSet(id, s)).length;

/* ── one card on screen (walk audit W2-19) ──────────────────────────────── */

/** How a fault stands on this visit, in one word and one mark: not started,
 *  ACTIVE (its wrong setting, or the stray loop it left, is in the scene),
 *  or FIXED. A fault that was started and switched straight back, with its
 *  symptom never seen, is "not started" again: it can be started again. */
export type FaultStatus = 'idle' | 'active' | 'fixed';
export function faultStatus(id: FaultId, b: Bench, s: GaState): FaultStatus {
  if (faultOpen(id, b, s)) return 'active';
  return faultFixed(id, b, s) ? 'fixed' : 'idle';
}
export const FAULT_STATUS_MARK: Readonly<Record<FaultStatus, string>> = { idle: '○', active: '●', fixed: '✓' };
export const FAULT_STATUS_WORD: Readonly<Record<FaultStatus, string>> = { idle: 'not started', active: 'active', fixed: 'fixed' };

/** The fault after this one that is not fixed yet (in order, coming back to
 *  the start); null when every other fault is fixed. The card's NEXT FAULT
 *  button goes there. */
export function nextFault(from: FaultId, b: Bench, s: GaState): FaultId | null {
  const at = FAULT_IDS.indexOf(from);
  for (let k = 1; k < FAULT_IDS.length; k++) {
    const id = FAULT_IDS[(at + k) % FAULT_IDS.length];
    if (!faultFixed(id, b, s)) return id;
  }
  return null;
}
