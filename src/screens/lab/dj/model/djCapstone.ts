/**
 * djCapstone — screen 24's EVENT SCENARIO: a seeded fault (or two) planted
 * in a small event system, and the debrief (cause, evidence, repair,
 * prevention). Pure; pinned by test/djCapstone.test.ts.
 *
 * Every fault here is one the simulation DEMONSTRATES accurately — the meters,
 * the drawing and the sound all show it, and the learner repairs it with the
 * same controls, never by ticking a box. Faults are combined only when they
 * sit in different parts of the system and neither hides the other (two
 * silences on the same channel would leave nothing to find).
 *
 * The scenario is REPRODUCIBLE: the same event number plants the same
 * faults (a seeded mulberry32), so an exercise can be shared and replayed.
 */
import { BUILT_PLUGS, trimDb, trimPos, xfGainFor, type Booth } from './djModel.ts';
import { recGainDb, recGainPos, withEv } from './djEvent.ts';

export type FaultId = 'CH2_SELECTOR' | 'XF_ASSIGN' | 'MASTER_R' | 'TRIM_HOT' | 'PA_HUM' | 'PHONES_BLEND' | 'REC_NO_MIC' | 'REC_CLIP' | 'MEDIA_FAIL';
export type Subsystem = 'input' | 'assign' | 'output' | 'gain' | 'power' | 'cue' | 'rec' | 'playback';

export type FaultDef = {
  id: FaultId;
  subsystem: Subsystem;
  /** What a learner would notice — never the cause. */
  symptom: string;
  /** The words for the debrief. */
  cause: string;
  evidence: string;
  repair: string;
  prevention: string;
  /** Plant it. */
  inject: (b: Booth) => Booth;
  /** The booth shows it repaired. */
  fixed: (b: Booth) => boolean;
};

export const FAULTS: Record<FaultId, FaultDef> = {
  CH2_SELECTOR: {
    id: 'CH2_SELECTOR',
    subsystem: 'input',
    symptom: 'Deck B plays, but nothing of it reaches the mixer.',
    cause: 'CH 2’s input selector was on PHONO, where nothing is plugged in.',
    evidence: 'Deck B was playing, but the CH 2 meter stayed dark — the signal died at the channel’s input.',
    repair: 'Set CH 2’s input selector back to LINE.',
    prevention: 'Check every channel’s selector against the input list during the line check.',
    inject: (b) => ({ ...b, ch: { ...b.ch, 2: { ...b.ch[2], input: 'PHONO' } } }),
    fixed: (b) => b.ch[2].input === 'LINE',
  },
  XF_ASSIGN: {
    id: 'XF_ASSIGN',
    subsystem: 'assign',
    symptom: 'CH 2 meters fine, but bringing its fader up adds nothing to the room.',
    cause: 'CH 2 was assigned to crossfader side A while the crossfader sat over at side B.',
    evidence: 'The CH 2 meter was live and its fader up, but the MASTER meter did not move — the loss was after the channel fader.',
    repair: 'Put CH 2’s crossfader assign on THRU (or centre the crossfader).',
    prevention: 'Park the crossfader assigns and the crossfader where you expect them before the doors open.',
    inject: (b) => ({ ...b, ch: { ...b.ch, 2: { ...b.ch[2], xf: 'A' } }, mixer: { ...b.mixer, xf: 1 } }),
    fixed: (b) => xfGainFor(b.ch[2].xf, b.mixer.xf, b.mixer.xfCurve) > 0.7,
  },
  MASTER_R: {
    id: 'MASTER_R',
    subsystem: 'output',
    symptom: 'The music sounds thin and one-sided from the floor.',
    cause: 'The MASTER R cable had come out of PA R.',
    evidence: 'Both MASTER meters were live, but only PA L was making sound — the missing side was after the mixer.',
    repair: 'Turn the MASTER down, plug MASTER R back into PA R, bring the MASTER up again.',
    prevention: 'Dress and secure the output cables so a foot or a bag cannot pull them; check both sides in the line check.',
    inject: (b) => ({ ...b, plugs: { ...b.plugs, 'mst.xlrR': null } }),
    fixed: (b) => b.plugs['mst.xlrR'] === BUILT_PLUGS['mst.xlrR'],
  },
  TRIM_HOT: {
    id: 'TRIM_HOT',
    subsystem: 'gain',
    symptom: 'Deck A sounds harsh and crunchy, however low the MASTER is.',
    cause: 'CH 1’s TRIM was turned right up, so the channel itself was clipping.',
    evidence: 'The CH 1 meter sat in the red while the MASTER was low — the distortion started at the channel.',
    repair: 'Bring TRIM 1 down until the CH 1 meter averages with CH 2 and never reaches CLIP.',
    prevention: 'Set each channel’s gain in the headphones by its average level, before it goes on air.',
    inject: (b) => ({ ...b, ch: { ...b.ch, 1: { ...b.ch[1], trim: trimPos(12) } } }),
    fixed: (b) => trimDb(b.ch[1].trim) <= 3,
  },
  PA_HUM: {
    id: 'PA_HUM',
    subsystem: 'power',
    symptom: 'A steady hum comes from the left of the room, even between tracks.',
    cause: 'PA L was plugged into a wall socket on another circuit, making a ground loop through its audio cable.',
    evidence: 'The hum was in the crowd but not in the booth monitors or the headphones, and only on the left — so it entered after the mixer.',
    repair: 'Power PA L from the booth’s own strip (or put an isolation transformer in the MASTER L line). Never remove the mains earth.',
    prevention: 'Power the whole rig from one distribution point; carry an isolation transformer or a DI with a ground lift.',
    inject: (b) => withEv(b, (ev) => ({ ...ev, paLWall: true, paLIsolator: false })),
    fixed: (b) => !b.ev?.paLWall || !!b.ev?.paLIsolator,
  },
  PHONES_BLEND: {
    id: 'PHONES_BLEND',
    subsystem: 'cue',
    symptom: 'Your headphones only ever play what the crowd hears — the cued deck never comes through.',
    cause: 'The headphone CUE ↔ MASTER blend was turned all the way to MASTER.',
    evidence: 'The cued deck’s CUE was on and its channel meter live, but the headphones followed the MASTER — the cue bus was blended out.',
    repair: 'Turn the blend back toward CUE (or use split cue).',
    prevention: 'Check the headphone section — blend, split, level — during the line check.',
    inject: (b) => ({ ...b, mixer: { ...b.mixer, cueMix: 1, splitCue: false } }),
    fixed: (b) => b.mixer.cueMix < 0.5 || b.mixer.splitCue,
  },
  REC_NO_MIC: {
    id: 'REC_NO_MIC',
    subsystem: 'rec',
    symptom: 'The room hears the announcement; the recording will not.',
    cause: 'The mic’s send to the record output was switched off.',
    evidence: 'During the announcement the CROWD carried the voice, but the recorder’s VOICE reading stayed at none.',
    repair: 'Switch MIC → REC on (or record from a feed that carries the mic).',
    prevention: 'Make a short test recording with music AND a voice, and play it back, before the event.',
    inject: (b) => withEv(b, (ev) => ({ ...ev, mic: { ...ev.mic, toRec: false } })),
    fixed: (b) => !!b.ev?.mic.toRec,
  },
  REC_CLIP: {
    id: 'REC_CLIP',
    subsystem: 'rec',
    symptom: 'The room sounds clean, but the recorder’s CLIP light keeps flashing.',
    cause: 'The recorder’s own input gain was turned far up.',
    evidence: 'The MASTER meters were fine while the recorder’s meters hit CLIP — the overload was in the recorder.',
    repair: 'Turn the RECORDER’s input gain down until its peaks stay below about −6 dBFS. Leave the MASTER alone.',
    prevention: 'Set the recorder’s level on the loudest part of a test, with headroom.',
    inject: (b) => withEv(b, (ev) => ({ ...ev, rec: { ...ev.rec, gain: recGainPos(18) } })),
    fixed: (b) => !!b.ev && recGainDb(b.ev.rec.gain) <= 6,
  },
  MEDIA_FAIL: {
    id: 'MEDIA_FAIL',
    subsystem: 'playback',
    symptom: 'Deck B shows FILE ERROR on the next track.',
    cause: 'The file on the USB stick was damaged.',
    evidence: 'Deck B refused the file — the failure was in the media, before any cable or channel.',
    repair: 'Load the same track from the backup stick (or play another track) and carry on.',
    prevention: 'Carry a tested backup copy of every set, on separate media.',
    inject: (b) => withEv({ ...b, decks: { ...b.decks, B: { ...b.decks.B, track: null, playing: false } } }, (ev) => ({ ...ev, mediaFail: true })),
    fixed: (b) => !b.ev?.mediaFail && !!b.decks.B.track,
  },
};

export const FAULT_IDS = Object.keys(FAULTS) as FaultId[];

/** Pairs that would hide each other (beyond sharing a subsystem). */
const MASKS: readonly [FaultId, FaultId][] = [
  ['CH2_SELECTOR', 'XF_ASSIGN'],
  ['CH2_SELECTOR', 'MEDIA_FAIL'],
  ['XF_ASSIGN', 'MEDIA_FAIL'],
];

/** Two faults can share an event: different subsystems, and neither masks the other. */
export function compatible(a: FaultId, b: FaultId): boolean {
  if (a === b) return false;
  if (FAULTS[a].subsystem === FAULTS[b].subsystem) return false;
  return !MASKS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** Seeded mulberry32 (uniform [0, 1)). */
export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 0x9e3779b9;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Scenario = { seed: number; faults: FaultId[] };

/** The event for a seed (1 … 9999): one fault, and half the time a second
 *  compatible one. Deterministic. */
export function scenarioFor(seed: number): Scenario {
  const r = seeded(seed * 2654435761);
  const first = FAULT_IDS[Math.floor(r() * FAULT_IDS.length)];
  const faults: FaultId[] = [first];
  if (r() < 0.5) {
    const ok = FAULT_IDS.filter((f) => compatible(first, f));
    faults.push(ok[Math.floor(r() * ok.length)]);
  }
  return { seed, faults };
}

/** Plant a scenario's faults. */
export const plant = (b: Booth, s: Scenario): Booth => s.faults.reduce((x, f) => FAULTS[f].inject(x), b);

/** Every planted fault is repaired. */
export const allFixed = (b: Booth, s: Scenario): boolean => s.faults.every((f) => FAULTS[f].fixed(b));

/* ── the debrief ──────────────────────────────────────────────────────── */

export type DebriefPart = 'cause' | 'evidence' | 'repair' | 'prevention';
export const DEBRIEF_PARTS: readonly DebriefPart[] = ['cause', 'evidence', 'repair', 'prevention'];

/** One debrief question: the fault's own answer among others drawn from the
 *  bank (seeded, so a replayed event asks the same question). */
export function debriefOptions(fault: FaultId, part: DebriefPart, seed: number): { options: string[]; correct: number } {
  const r = seeded(seed * 7919 + DEBRIEF_PARTS.indexOf(part) * 104729 + FAULT_IDS.indexOf(fault));
  const others = FAULT_IDS.filter((f) => f !== fault && FAULTS[f].subsystem !== FAULTS[fault].subsystem);
  const picks: FaultId[] = [];
  while (picks.length < 2 && others.length) {
    const k = Math.floor(r() * others.length);
    picks.push(others.splice(k, 1)[0]);
  }
  const options = [FAULTS[fault][part], ...picks.map((f) => FAULTS[f][part])];
  // the unsafe "fix" is always offered as a wrong prevention or repair
  if (part === 'repair' || part === 'prevention') options.push('Lift the mains earth on the noisy unit so the hum stops.');
  return { options, correct: 0 };
}

/* ── the capstone's own checks ────────────────────────────────────────── */

/** The transition the capstone asks for: deck B in, deck A out, the room
 *  never silent and nothing clipping. A pure step over chunk readings. */
export type TransitionState = { started: boolean; done: boolean; failed: string | null };
export const TRANSITION_FRESH: TransitionState = { started: false, done: false, failed: null };

export function transitionStep(s: TransitionState, b: Booth, reading: { crowdMinDb: number; clipped: boolean } | null): TransitionState {
  return transitionStepBy(s, b.ch[1].fader > 0.05 && b.decks.A.playing, b.ch[2].fader > 0.05 && b.decks.B.playing, b.ch[2].fader, reading);
}

/** The same step from on-air flags (any sources: decks or laptops). */
export function transitionStepBy(s: TransitionState, aUp: boolean, bUp: boolean, bFader: number, reading: { crowdMinDb: number; clipped: boolean } | null): TransitionState {
  if (s.done || !reading) return s;
  const started = s.started || (aUp && bUp);
  if (!started) return s;
  if (reading.clipped) return { started, done: false, failed: 'The mix clipped during the change — lower a fader or a trim and try again.' };
  if (reading.crowdMinDb < -45) return { started, done: false, failed: 'The room went quiet during the change — keep one deck up until the other is in.' };
  const done = bUp && bFader >= 0.6 && !aUp;
  return { started, done, failed: done ? null : s.failed };
}
