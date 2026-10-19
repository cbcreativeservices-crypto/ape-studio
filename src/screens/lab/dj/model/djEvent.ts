/**
 * djEvent — THE EVENT RIG: what the shared booth gains for screens 19–24
 * (microphones, the PA and the venue, recording, a hybrid rig, performer
 * changeovers, the capstone). It lives on the ONE shared booth as the
 * optional `booth.ev` (djModel.Booth), so every change re-renders through
 * the same engine and the same snapshot. Pure TypeScript; pinned by
 * test/djEvent.test.ts. Documented in docs/labs/dj/MODEL.md §12–§17.
 *
 * ONE GENERIC DEVICE PROFILE (as Stage 1): real mixers differ in where the
 * microphone is sent, which inputs carry phantom power, what the record
 * output carries and how talkover works — their manuals win.
 *
 * THIS MIXER'S MICROPHONE SECTION (its FRONT panel, under the crossfader):
 *   MIC 1  XLR / jack combo, with a +48 V phantom switch — the only input
 *          that can power a condenser microphone
 *   MIC 2  XLR / jack combo, NO phantom power
 *   GAIN 1, GAIN 2   +10 … +60 dB (the mic preamp)
 *   MIC LEVEL        unity at ¾ travel (the house level-knob taper)
 *   MIC ON           the mute
 *   TALK OVER + DEPTH   dips the music −6 … −24 dB while the mic hears speech
 *   SEND switches    MIC → BOOTH and MIC → REC (MASTER always carries the mic)
 * Defaults follow the common factory setting: the mic is NOT in the booth
 * (feedback) and NOT in the record output — the diagnosis challenge.
 *
 * THIS MIXER'S EXTRA REAR SOCKETS (RearPanels `extras`): REC OUT (RCA, a
 * fixed-level copy of the mix, before the MASTER knob), MIDI OUT (DIN, clock
 * from the beat counter of the channel the CLOCK switch picks), USB 1 and
 * USB 2 (computer audio for CH 1 / CH 2 when their selector is on USB).
 */
import { deckPos, freshDeck, levelKnobGain, type Booth, type ChannelId, type DeckState } from './djModel.ts';
import { TRACKS, trueGrid, type TrackId } from '../engine/djMusic.ts';
import { beatAt, playedBpm, timeOfBeat } from './djTime.ts';
import { MONITORS, PLACEMENTS, REF_FEED_DBFS, MON_DBA_1M, ROOM, TOP_DBA_1M, cardioidDb, micAngleDeg, powerSum, relLevelDb, subsRelAt, type Placement, type SubPlace, type V2 } from './djRoom.ts';

/* ── the microphone ───────────────────────────────────────────────────── */

export type MicDevice = 'DYNAMIC' | 'CONDENSER' | 'WIRELESS';
export type MicInput = 'NONE' | 'MIC1' | 'MIC2';
export type RxOut = 'MIC' | 'LINE';
export type MicPos = 'DECKS' | 'MONITOR' | 'FLOOR';

/** Phantom power belongs to the INPUT, not to the mixer as a whole. */
export const MIC_INPUTS: Record<Exclude<MicInput, 'NONE'>, { label: string; phantom: boolean }> = {
  MIC1: { label: 'MIC 1', phantom: true },
  MIC2: { label: 'MIC 2', phantom: false },
};

export const MIC_GAIN_MIN_DB = 10;
export const MIC_GAIN_MAX_DB = 60;
export const micGainDb = (p: number): number => MIC_GAIN_MIN_DB + (MIC_GAIN_MAX_DB - MIC_GAIN_MIN_DB) * Math.max(0, Math.min(1, p));
export const micGainPos = (db: number): number => Math.max(0, Math.min(1, (db - MIC_GAIN_MIN_DB) / (MIC_GAIN_MAX_DB - MIC_GAIN_MIN_DB)));
/** Talkover depth knob → the dip in dB (−6 … −24). */
export const duckDepthDb = (p: number): number => -(6 + 18 * Math.max(0, Math.min(1, p)));

/** Speech at the capsule, close up: its PEAK at the input with 0 dB of
 *  preamp gain, dBFS of this model, from a dynamic mic (about 94 dB SPL at
 *  the grille). A gain of about +44 dB puts speech peaks near −8 dBFS. */
export const SPEECH_PEAK_AT_0DB = -52;
/** The mic SIGNAL relative to a dynamic mic (dB): a condenser is hotter; a
 *  wireless receiver's output switch picks mic level or LINE. Line level is
 *  some 40–55 dB above a dynamic mic on close speech (about −52 dBu against
 *  −10 dBV / +4 dBu): the model uses +44 dB (second audio review
 *  2026-10-18 #6; it overloads the mic input exactly as before). */
export const LINE_OVER_MIC_DB = 44;
export function micSensDb(device: MicDevice, rxOut: RxOut): number {
  if (device === 'CONDENSER') return 12;
  if (device === 'WIRELESS') return rxOut === 'LINE' ? LINE_OVER_MIC_DB : 0;
  return 0;
}
/** The mic input stage overloads above this level (dBFS at 0 dB gain) —
 *  BEFORE the gain knob, so turning GAIN down cannot rescue a line-level
 *  signal in a mic input. */
export const MIC_INPUT_CLIP_AT_0DB = -20;

/** One announcement: when its first syllable sounds, and (ADDITIVE) how
 *  much louder than normal speech it is — a shout is about +10 dB. */
export type MicSay = { at: number; db?: number };
/** A DJ's "make some noise!" over conversational speech (dB). */
export const SHOUT_DB = 10;

export type MicState = {
  device: MicDevice;
  input: MicInput;
  rxOut: RxOut;
  /** MIC 1's +48 V switch (MIC 2 has none). */
  phantom: boolean;
  gain1: number;
  gain2: number;
  level: number;
  on: boolean;
  talkover: boolean;
  depth: number;
  toBooth: boolean;
  toRec: boolean;
  pos: MicPos;
  /** Announcements waiting to sound (booth time of their first syllable). */
  says: MicSay[];
};

export const freshMic = (): MicState => ({
  device: 'DYNAMIC',
  input: 'NONE',
  rxOut: 'MIC',
  phantom: false,
  gain1: 0.5,
  gain2: 0.5,
  level: 0.75,
  on: false,
  talkover: false,
  depth: 1 / 3,
  toBooth: false,
  toRec: false,
  pos: 'DECKS',
  says: [],
});

/** The gain knob of the input the mic is plugged into. */
export const micGainKnob = (m: MicState): number => (m.input === 'MIC2' ? m.gain2 : m.gain1);

/** Does the microphone make a signal at all? A condenser needs phantom from
 *  its input; nothing plugged in is silence. */
export function micAlive(m: MicState): boolean {
  if (m.input === 'NONE') return false;
  if (m.device === 'CONDENSER') return MIC_INPUTS[m.input].phantom && m.input === 'MIC1' && m.phantom;
  return true;
}

/** Speech peak (dBFS) at the mic channel's meter (after GAIN, before LEVEL),
 *  or null when the mic makes no signal. Over 0 = the preamp clips. */
export function micPeakDb(m: MicState): number | null {
  if (!micAlive(m)) return null;
  return SPEECH_PEAK_AT_0DB + micSensDb(m.device, m.rxOut) + micGainDb(micGainKnob(m));
}

/** The input stage itself overloads (a line-level signal in a mic input). */
export const micInputOverload = (m: MicState): boolean => micAlive(m) && SPEECH_PEAK_AT_0DB + micSensDb(m.device, m.rxOut) > MIC_INPUT_CLIP_AT_0DB;

/** The mic's gain from the capsule to the mic BUS (dB): sensitivity + gain +
 *  level, −Infinity when it is off or silent. */
export function micChainDb(m: MicState): number {
  if (!micAlive(m) || !m.on || m.level <= 0.001) return -Infinity;
  return micSensDb(m.device, m.rxOut) + micGainDb(micGainKnob(m)) + 20 * Math.log10(levelKnobGain(m.level));
}

/** Switching +48 V while the mic channel is ON and up sends a loud POP down
 *  every feed that carries the mic — flagged, never played. */
export const phantomPop = (m: MicState): boolean => m.input === 'MIC1' && m.on && m.level > 0.02;

/* ── where the mic is, and feedback ───────────────────────────────────── */

/** The mic's place on the room plan and the way its FRONT points. */
export const MIC_POS: Record<MicPos, { at: V2; axis: V2; label: string; blurb: string }> = {
  DECKS: { at: { x: 0, y: 0.95 }, axis: { x: 0, y: -1 }, label: 'AT THE DECKS', blurb: 'At your mouth behind the decks: its front points back at you, its rear at the room.' },
  MONITOR: { at: { x: 0.15, y: 0.95 }, axis: { x: 1.1, y: 0.35 }, label: 'AT A MONITOR', blurb: 'Lowered to your chest — and now its front points straight at the left booth monitor.' },
  FLOOR: { at: { x: 0, y: 4.6 }, axis: { x: 0, y: -1 }, label: 'ON THE FLOOR', blurb: 'Out on the dance floor, in front of the PA — the speakers are now aimed at the mic.' },
};

/** A narrow room resonance above the broadband average: where feedback
 *  starts first (model). */
export const ROOM_PEAK_DB = 3;
/** Mic capsule: speech at 94 dB SPL → SPEECH_PEAK_AT_0DB, so dBFS (0 dB gain)
 *  = SPL − MIC_SPL_OFFSET. */
export const MIC_SPL_OFFSET = 94 - SPEECH_PEAK_AT_0DB;

export type FeedbackPath = { id: 'topL' | 'topR' | 'monL' | 'monR'; loopDb: number };
export type Feedback = {
  /** Loop gain (dB) at the ring frequency, every path summed as power. */
  loopDb: number;
  /** −loopDb: how much more gain before it howls. Infinity = no loop. */
  marginDb: number;
  paths: FeedbackPath[];
  /** The path that dominates, and the frequency this room rings at there. */
  worst: FeedbackPath | null;
  ringHz: number;
  state: 'SAFE' | 'EDGE' | 'RINGING';
};

/** Where the room rings first: the booth corner booms lower, the PA path
 *  rings in the presence band (model). */
export const RING_HZ = { booth: 630, pa: 2500 } as const;
/** Margin below this = on the edge (it rings after each word). */
export const EDGE_DB = 3;

/**
 * The FEEDBACK MODEL: the mic hears each speaker that carries it, and that
 * speaker plays the mic back. Loop gain (dB) per path =
 *   speaker level at 1 m per dBFS − mic capsule offset
 *   + the mic chain (sensitivity, gain, level) + the output knob (MASTER and
 *     the venue's gain for the PA; BOOTH for the monitors)
 *   + the speaker's directivity toward the mic − distance (inverse square)
 *   + the mic's cardioid pickup toward that speaker + the room's peak.
 * Paths add as power. Loop ≥ 0 dB = it RINGS (keeps going on its own).
 * The lab never plays a howl: the ring it plays is capped and quiet.
 */
export function feedbackOf(b: Booth): Feedback {
  const ev = b.ev;
  if (!ev) return { loopDb: -Infinity, marginDb: Infinity, paths: [], worst: null, ringHz: RING_HZ.pa, state: 'SAFE' };
  const m = ev.mic;
  const chain = micChainDb(m);
  const pos = MIC_POS[m.pos];
  const paths: FeedbackPath[] = [];
  if (chain > -Infinity) {
    const masterDb = 20 * Math.log10(Math.max(1e-6, levelKnobGain(b.mixer.master)));
    const venueDb = ev.venue.on ? ev.venue.gainDb : 0;
    const tops = PLACEMENTS[ev.venue.place].tops;
    const kPa = TOP_DBA_1M - REF_FEED_DBFS - MIC_SPL_OFFSET + chain + masterDb + venueDb + ROOM_PEAK_DB;
    for (const t of [tops.L, tops.R]) {
      paths.push({ id: t.id as 'topL' | 'topR', loopDb: kPa + relLevelDb(t, pos.at) + cardioidDb(micAngleDeg(pos.at, pos.axis, t.at)) });
    }
    if (m.toBooth) {
      const boothDb = 20 * Math.log10(Math.max(1e-6, levelKnobGain(b.mixer.booth)));
      const kMon = MON_DBA_1M - REF_FEED_DBFS - MIC_SPL_OFFSET + chain + boothDb + ROOM_PEAK_DB;
      for (const s of [MONITORS.L, MONITORS.R]) paths.push({ id: s.id as 'monL' | 'monR', loopDb: kMon + relLevelDb(s, pos.at) + cardioidDb(micAngleDeg(pos.at, pos.axis, s.at)) });
    }
  }
  if (!paths.length) return { loopDb: -Infinity, marginDb: Infinity, paths, worst: null, ringHz: RING_HZ.pa, state: 'SAFE' };
  const loopDb = powerSum(paths.map((p) => p.loopDb));
  const worst = paths.reduce((a, p) => (p.loopDb > a.loopDb ? p : a));
  const marginDb = -loopDb;
  return { loopDb, marginDb, paths, worst, ringHz: worst.id.startsWith('mon') ? RING_HZ.booth : RING_HZ.pa, state: marginDb <= 0 ? 'RINGING' : marginDb < EDGE_DB ? 'EDGE' : 'SAFE' };
}

/* ── the venue's PA (screen 20) ───────────────────────────────────────── */

export type VenuePatch = 'MST_L' | 'MST_R' | null;
export type VenueState = {
  /** The MASTER feeds the VENUE's system (true) instead of the booth's own
   *  powered PA speakers (Stage 1's direct rig). */
  on: boolean;
  /** What is plugged into the venue's DJ L and DJ R inputs. */
  djL: VenuePatch;
  djR: VenuePatch;
  /** The run to the venue's inputs: balanced XLR, or an unbalanced cable. */
  cable: 'XLR' | 'UNBAL';
  /** The ENGINEER's input gain for the DJ feed (dB): never a DJ control. */
  gainDb: number;
  /** The system processor's crossover (tops above it, subs below). */
  xover: boolean;
  subs: boolean;
  tops: 'POWERED' | 'PASSIVE';
  place: Placement;
  subPos: SubPlace;
  /** The turntable on the booth table sits on isolation feet. */
  ttIso: boolean;
};

export const XOVER_HZ = 100;
/** The engineer's gain range (what they will give the DJ feed). */
export const VENUE_GAIN_MIN_DB = -12;
export const VENUE_GAIN_MAX_DB = 9;

export const freshVenue = (): VenueState => ({ on: false, djL: null, djR: null, cable: 'XLR', gainDb: 0, xover: true, subs: true, tops: 'POWERED', place: 'CORNERS', subPos: 'TOPS', ttIso: false });

/** The DJ's L and R both arrive, the right way round, balanced. */
export const venueHandoffOk = (v: VenueState): boolean => v.djL === 'MST_L' && v.djR === 'MST_R' && v.cable === 'XLR';
export const venueSwapped = (v: VenueState): boolean => v.djL === 'MST_R' && v.djR === 'MST_L';

/** Long unbalanced runs pick up hum (and lose top end) — modelled level of
 *  the hum the venue hears, dBFS. */
export const UNBAL_HUM_DBFS = -50;

/**
 * TURNTABLE ACOUSTIC FEEDBACK (a different loop from the mic's): the subs
 * shake the table, the stylus reads the shaking as music, the PA plays it
 * louder. Model margin (dB) at about 60 Hz: the sub level at the decks (re
 * the floor centre's bass), how loud the system plays, and the isolation.
 */
/** The turntable-and-table resonance: ONE value for the whole lab (second
 *  audio review 2026-10-18 #4) — the same 80 Hz as Screen 17's model
 *  (djVinyl FEEDBACK_HZ), within the usual 60–80 Hz. */
export const TT_RUMBLE_HZ = 80;
/** Isolation feet (or a heavy isolation platform) under the turntable. */
export const TT_ISOLATION_DB = 18;
/** The margin with the subs' bass at the decks equal to the floor centre's,
 *  at the reference feed (model calibration). */
export const TT_MARGIN_REF_DB = 6.8;
/** How much louder (dB) the subs are at the decks than at the floor centre. */
export const subsAtDecksRelDb = (place: SubPlace): number => subsRelAt(ROOM.decks, place) - subsRelAt(ROOM.floorCentre, place);
export function turntableMarginDb(v: VenueState, feedDbfs: number = REF_FEED_DBFS): number {
  if (!v.subs) return Infinity;
  return TT_MARGIN_REF_DB - subsAtDecksRelDb(v.subPos) - (feedDbfs - REF_FEED_DBFS) - v.gainDb + (v.ttIso ? TT_ISOLATION_DB : 0);
}

/* ── recording (screen 21) ────────────────────────────────────────────── */

export type RecTap = 'NONE' | 'REC_OUT' | 'BOOTH' | 'LOOPBACK';
export type RecState = {
  tap: RecTap;
  /** The recorder's input gain knob (−20 … +20 dB, 0 dB at the centre). */
  gain: number;
  /** Recording now: the take started at this booth time. */
  armedAt: number | null;
};
export const recGainDb = (p: number): number => -20 + 40 * Math.max(0, Math.min(1, p));
export const recGainPos = (db: number): number => Math.max(0, Math.min(1, (db + 20) / 40));
export const freshRec = (): RecState => ({ tap: 'NONE', gain: 0.5, armedAt: null });

/** What the recorder's input carries, in words. */
export const REC_TAPS: Record<Exclude<RecTap, 'NONE'>, { label: string; blurb: string }> = {
  REC_OUT: { label: 'REC OUT', blurb: 'The mixer’s record output: a fixed-level copy of the mix taken before the MASTER knob — your MASTER moves never ride the take.' },
  BOOTH: { label: 'BOOTH OUT', blurb: 'The booth output: it follows the BOOTH knob, so every booth move is in the take.' },
  LOOPBACK: { label: 'LOOPBACK', blurb: 'The computer recording what it plays itself. The players and the mic never pass through it.' },
};

/* ── the hybrid rig (screen 22) ───────────────────────────────────────── */

export type ClockCable = 'NONE' | 'DIN' | 'TRS_A' | 'TRS_B' | 'USB';
export type DrumMachine = {
  /** The mixer's CLOCK switch: which channel's beat counter sends MIDI clock. */
  clockSrc: 'OFF' | ChannelId;
  /** What joins the mixer's MIDI OUT to the drum machine's MIDI IN. */
  cable: ClockCable;
  /** The drum machine's own setting: follow its INTERNAL tempo or EXTERNAL clock. */
  sync: 'INT' | 'EXT';
  intBpm: number;
  /** Running since this booth time (its bar 1 starts there). */
  startedAt: number | null;
  /** Its audio outputs are patched into CH 2's LINE inputs (deck B's RCA
   *  cables come out of them). */
  audio: boolean;
};
export const freshDrumMachine = (): DrumMachine => ({ clockSrc: 'OFF', cable: 'NONE', sync: 'INT', intBpm: 120, startedAt: null, audio: false });

export const CLOCK_CABLES: Record<Exclude<ClockCable, 'NONE'>, { label: string; works: boolean; why: string }> = {
  DIN: { label: '5-PIN MIDI', works: true, why: 'A 5-pin MIDI cable from MIDI OUT to MIDI IN carries the clock.' },
  TRS_A: { label: 'TRS-MIDI (A)', works: true, why: 'A 3.5 mm MIDI adapter of the type this drum machine uses (type A) carries it too.' },
  TRS_B: { label: 'TRS-MIDI (B)', works: false, why: 'The other adapter type swaps two wires: the plug fits, but no MIDI arrives.' },
  USB: { label: 'USB CABLE', works: false, why: 'Two USB devices cannot talk on their own — USB needs a host (usually a computer) between them.' },
};

/** Clock reaches the drum machine: the mixer is sending, and the cable carries it. */
export function clockArrives(b: Booth): boolean {
  const dm = b.ev?.dm;
  if (!dm || dm.clockSrc === 'OFF' || dm.cable === 'NONE') return false;
  return CLOCK_CABLES[dm.cable].works;
}

/** The tempo the beat counter of a channel reads: its source deck's played
 *  BPM (CH 1 = deck A, CH 2 = deck B), or null with nothing playing there. */
export function counterBpm(b: Booth, ch: ChannelId): number | null {
  const d = ch === 1 ? b.decks.A : b.decks.B;
  if (!d.track || !d.playing) return null;
  return playedBpm(TRACKS[d.track].bpm, d.pitch);
}

/** The drum machine's tempo now: the clock's (EXT, clock arriving), its own
 *  (INT), or null (EXT with no clock: it waits). */
export function dmBpm(b: Booth): number | null {
  const dm = b.ev?.dm;
  if (!dm) return null;
  if (dm.sync === 'INT') return dm.intBpm;
  if (!clockArrives(b) || dm.clockSrc === 'OFF') return null;
  return counterBpm(b, dm.clockSrc);
}

/* ── laptops and changeovers (screen 23) ──────────────────────────────── */

export type Laptop = {
  deck: DeckState;
  /** Its USB cable is in the mixer (USB 1 for laptop 1, USB 2 for laptop 2). */
  usb: boolean;
  /** Running (false = frozen: its audio stops). */
  alive: boolean;
  charger: 'NONE' | 'STRIP' | 'WALL';
  /** A USB isolator sits in its USB cable. */
  isolator: boolean;
};
export const freshLaptop = (track: TrackId | null): Laptop => ({ deck: freshDeck(track), usb: false, alive: true, charger: 'NONE', isolator: false });

/** A ground loop: the laptop's charger is earthed in a DIFFERENT circuit
 *  (a wall socket across the room) and its USB ties it to the mixer's
 *  ground, with nothing breaking the loop. The cure keeps protective earth:
 *  the battery, the booth's own strip, or an isolator in the AUDIO/USB path.
 *  In this model the shared strip cures it; in life it OFTEN does — a
 *  two-pin charger can still leak a whine into USB on the same strip, and
 *  then the battery is the test (second audio review 2026-10-18 #27). */
export const laptopHum = (l: Laptop): boolean => l.usb && l.charger === 'WALL' && !l.isolator;
export const HUM_DBFS = -42;
/** The MAINS frequency of every hum in this lab: 60 Hz, the US standard
 *  (50 Hz in many other countries). One booth, one mains (second audio
 *  review 2026-10-18 #4; Screen 17's model uses the same value). */
export const MAINS_HZ = 60;
export const HUM_HZ = MAINS_HZ;

/** Why lifting the mains earth is refused (it is never applied). */
export const EARTH_LIFT_REFUSAL =
  'Refused. The earth pin is what keeps a fault on the mains from making the metal of the gear live — it is the safety, not the hum. Break the loop in the audio path instead (an isolator or a DI with a ground lift), power both from the same strip, or run the laptop on its battery.';

/* ── the whole rig ────────────────────────────────────────────────────── */

export type EventRig = {
  mic: MicState;
  venue: VenueState;
  rec: RecState;
  dm: DrumMachine;
  lap1: Laptop;
  lap2: Laptop;
  /** Listen to the RECORDER's input (overrides the booth's perspective). */
  hearRec: boolean;
  /** Capstone: PA L's cord is in a wall socket on another circuit (a hum
   *  loop through the PA L feed), and whether an isolation transformer sits
   *  in the MASTER L line. */
  paLWall: boolean;
  paLIsolator: boolean;
  /** Capstone: deck B's next file fails to load until the backup copy is used. */
  mediaFail: boolean;
  /** Capstone (ADDITIVE, audio review #30): PA R's own input switch is on
   *  MIC, so the line feed overloads the speaker's input — PA R distorts,
   *  its clip light is red, the MASTER meters stay clean. */
  paRMic?: boolean;
};

export function freshEvent(): EventRig {
  return {
    mic: freshMic(),
    venue: freshVenue(),
    rec: freshRec(),
    dm: freshDrumMachine(),
    lap1: freshLaptop('nightFerry'),
    lap2: freshLaptop('glassHarbour'),
    hearRec: false,
    paLWall: false,
    paLIsolator: false,
    mediaFail: false,
    paRMic: false,
  };
}

/** The booth's event rig (a fresh one when a screen has not set it). */
export const evOf = (b: Booth): EventRig => b.ev ?? freshEvent();

/** Update the event rig immutably. */
export function withEv(b: Booth, f: (ev: EventRig) => EventRig): Booth {
  return { ...b, ev: f(evOf(b)) };
}
export const withMic = (b: Booth, patch: Partial<MicState>): Booth => withEv(b, (ev) => ({ ...ev, mic: { ...ev.mic, ...patch } }));
export const withVenue = (b: Booth, patch: Partial<VenueState>): Booth => withEv(b, (ev) => ({ ...ev, venue: { ...ev.venue, ...patch } }));
export const withRec = (b: Booth, patch: Partial<RecState>): Booth => withEv(b, (ev) => ({ ...ev, rec: { ...ev.rec, ...patch } }));
export const withDm = (b: Booth, patch: Partial<DrumMachine>): Booth => withEv(b, (ev) => ({ ...ev, dm: { ...ev.dm, ...patch } }));
export const withLap = (b: Booth, k: 1 | 2, patch: Partial<Laptop>): Booth => withEv(b, (ev) => (k === 1 ? { ...ev, lap1: { ...ev.lap1, ...patch } } : { ...ev, lap2: { ...ev.lap2, ...patch } }));

/** Play / pause a laptop's track at booth time t (anchored first). With
 *  `alignTo`, a laptop that starts while the other plays starts IN PHASE
 *  with it (the changeover screen pre-matches tempos: beatmatching is not
 *  its lesson). */
export function lapPlay(b: Booth, t: number, k: 1 | 2, on: boolean, alignTo?: 1 | 2): Booth {
  const ev = evOf(b);
  const me = k === 1 ? ev.lap1 : ev.lap2;
  const pos = deckPos(me.deck, t);
  let deck: DeckState = { ...me.deck, posSec: pos, at: t, playing: on && !!me.deck.track };
  const other = alignTo ? (alignTo === 1 ? ev.lap1 : ev.lap2) : null;
  if (on && other && other.deck.playing && other.deck.track && deck.track) {
    const bo = beatAt(trueGrid(other.deck.track), deckPos(other.deck, t));
    const bm = beatAt(trueGrid(deck.track), pos);
    const want = Math.round(bm - (bo - Math.floor(bo))) + (bo - Math.floor(bo));
    deck = { ...deck, posSec: timeOfBeat(trueGrid(deck.track), want) };
  }
  return withLap(b, k, { deck });
}

/** Any event source is sounding (keeps the booth clock running). */
export function evPlaying(ev: EventRig | undefined): boolean {
  if (!ev) return false;
  return (ev.lap1.deck.playing && !!ev.lap1.deck.track) || (ev.lap2.deck.playing && !!ev.lap2.deck.track) || ev.dm.startedAt != null;
}

/** Re-anchor the laptops' decks at booth time t (with djModel.anchorAt). */
export function anchorEv(ev: EventRig, t: number): EventRig {
  const a = (l: Laptop): Laptop => ({ ...l, deck: { ...l.deck, posSec: deckPos(l.deck, t), at: t } });
  return { ...ev, lap1: a(ev.lap1), lap2: a(ev.lap2) };
}

/** STOP ALL reaches the event sources too. */
export function stopEv(ev: EventRig, t: number): EventRig {
  const s = (l: Laptop): Laptop => ({ ...l, deck: { ...l.deck, posSec: deckPos(l.deck, t), at: t, playing: false } });
  return { ...ev, lap1: s(ev.lap1), lap2: s(ev.lap2), dm: { ...ev.dm, startedAt: null }, mic: { ...ev.mic, says: [] } };
}
