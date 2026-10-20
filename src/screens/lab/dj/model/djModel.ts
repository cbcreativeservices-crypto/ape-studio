/**
 * djModel — THE SHARED DJ BOOTH: one technical model every screen of the
 * DJ Systems Lab reads and writes (owner brief 2026-10-18). Pure TypeScript,
 * no React Native; pinned by test/djRender.test.ts and
 * test/djLessons.test.ts (routing, connect, hot-patching). The full model, with every
 * range, taper, curve, tap point and simplification, is documented in
 * docs/labs/dj/MODEL.md; the sources and unknowns in docs/labs/dj/SOURCES.md.
 *
 * THE BOOTH (Stage 1): two media players (DECK A, DECK B) → a two-channel
 * club-style DJ mixer → a pair of powered PA speakers (the audience), a pair
 * of powered booth monitors, and headphones. A turntable appears on the
 * connection lessons only (phono versus line).
 *
 * THE SIGNAL MODEL (default order of processing — the device profile of this
 * generic mixer; real mixers differ and their manuals win):
 *
 *   source (player line out, stereo)
 *     → cable (each plug, L and R, is its own conductor)
 *     → INPUT jack class (LINE / PHONO) — a phono jack adds +36 dB and RIAA
 *       playback EQ, then CLIPS (the phono stage)
 *     → INPUT SELECTOR (which jack pair the channel listens to)
 *     → TRIM  (−20 … +12 dB, 0 dB at the centre detent)
 *     → EQ    (3-band isolator: +6 dB … −26 dB, then KILL)
 *     → FILTER (one knob: low-pass ← off → high-pass)
 *     → CHANNEL CLIP (0 dBFS)  ── CHANNEL METER tap and CUE tap (pre-fader)
 *     → CHANNEL FADER (square law)
 *     → CROSSFADER (assign A / THRU / B; BLEND, DIP or CUT curve)
 *     → MIX BUS (sum)  → MIX BUS CLIP (0 dBFS) ── the BUS OVER light
 *          ├→ MASTER knob → MASTER CLIP → MASTER METER tap → MASTER OUT (XLR)
 *          ├→ BOOTH knob  → BOOTH CLIP  → BOOTH OUT (TRS)
 *          └→ (headphone MASTER side, before the MASTER knob)
 *   CUE BUS = sum of the cued channels' pre-fader signals
 *   PHONES = CUE/MASTER blend (or SPLIT: cue left, master right, each mono)
 *            → PHONES knob → PHONES CLIP → the headphone jack
 *
 * Every stage clips at its own full scale, so a mix bus can overload while
 * both channels are clean, and turning the MASTER down after the bus clipped
 * leaves the distortion in. dBFS (this digital model's scale) is kept apart
 * from analog line levels (dBu, dBV) and from sound in the room (dBA).
 */
import { TRACKS, type TrackId } from '../engine/djMusic.ts';
import { advance, type Loop } from './djTime.ts';

export type DeckId = 'A' | 'B';
export const DECK_IDS: readonly DeckId[] = ['A', 'B'];
export type ChannelId = 1 | 2;
export const CHANNEL_IDS: readonly ChannelId[] = [1, 2];

export type InputSel = 'LINE' | 'PHONO' | 'USB';
export type XfAssign = 'A' | 'THRU' | 'B';
export type XfCurve = 'BLEND' | 'DIP' | 'CUT';
export type Perspective = 'CROWD' | 'BOOTH' | 'PHONES';
/** The ANALYSED grid scenario a deck's track carries (Screen 11). */
export type GridMode = 'TRUE' | 'LATE_HALF' | 'HALF_BPM';

/* ── tapers (control position → gain), every one stated ───────────────── */

export const TRIM_MIN_DB = -20;
export const TRIM_MAX_DB = 12;
/** Trim: 0 dB at the 12 o'clock centre detent, as real trims are marked
 *  (audio review 2026-10-18 #24) — linear in dB on each half: the left half
 *  −20 … 0 dB, the right half 0 … +12 dB. */
export const TRIM_UNITY = 0.5;
export function trimDb(p: number): number {
  const x = clamp01(p);
  return x <= TRIM_UNITY ? TRIM_MIN_DB * (1 - x / TRIM_UNITY) : (TRIM_MAX_DB * (x - TRIM_UNITY)) / (1 - TRIM_UNITY);
}
export function trimPos(db: number): number {
  const d = Math.max(TRIM_MIN_DB, Math.min(TRIM_MAX_DB, db));
  return d <= 0 ? TRIM_UNITY * (1 - d / TRIM_MIN_DB) : TRIM_UNITY + (1 - TRIM_UNITY) * (d / TRIM_MAX_DB);
}

export const EQ_BOOST_DB = 6;
export const EQ_CUT_DB = -26;
/** Below this knob position the band is KILLED (the isolator's end stop). */
export const EQ_KILL_BELOW = 0.04;
/** EQ knob (0 … 1, centre 0.5 = 0 dB) → band gain in dB (−Infinity = kill). */
export function eqDb(p: number): number {
  const x = clamp01(p);
  if (x >= 0.5) return (EQ_BOOST_DB * (x - 0.5)) / 0.5;
  if (x <= EQ_KILL_BELOW) return -Infinity;
  return EQ_CUT_DB * (1 - (x - EQ_KILL_BELOW) / (0.5 - EQ_KILL_BELOW));
}

/** Channel fader: square law — gain = p², so 0.5 is −12.04 dB. */
export const faderGain = (p: number): number => clamp01(p) * clamp01(p);

/** Rotary level knobs (MASTER, BOOTH, PHONES): gain = (p / 0.75)², unity at
 *  three-quarters of the travel, +5.0 dB at the end stop. */
export const LEVEL_UNITY = 0.75;
export const levelKnobGain = (p: number): number => (clamp01(p) / LEVEL_UNITY) ** 2;

/** Crossfader curves, x = 0 (full side A) … 1 (full side B). */
export const XF_CUT_IN = 0.05;
export function xfGains(x: number, curve: XfCurve): { a: number; b: number } {
  const t = clamp01(x);
  if (curve === 'BLEND') return { a: Math.cos((t * Math.PI) / 2), b: Math.sin((t * Math.PI) / 2) };
  if (curve === 'DIP') return { a: 1 - t, b: t };
  return { a: Math.min(1, (1 - t) / XF_CUT_IN), b: Math.min(1, t / XF_CUT_IN) };
}
/** The gain the crossfader applies to a channel with assignment `as`. */
export function xfGainFor(as: XfAssign, x: number, curve: XfCurve): number {
  if (as === 'THRU') return 1;
  const g = xfGains(x, curve);
  return as === 'A' ? g.a : g.b;
}

/** Cue/master blend, equal power: 0 = all cue, 1 = all master. */
export const cueBlend = (m: number): { cue: number; master: number } => ({ cue: Math.cos((clamp01(m) * Math.PI) / 2), master: Math.sin((clamp01(m) * Math.PI) / 2) });

/** The filter's resonance knob (0 … 1) → filter Q. */
export const filterQ = (res: number): number => 0.7 + 2.8 * clamp01(res);

/** The lab's LISTEN level (what the phone plays, not a calibrated level):
 *  0 → −30 dB, 1 → 0 dB, before the protective limiter. */
export const listenDb = (p: number): number => -30 * (1 - clamp01(p));
/** A route change starts again from this LOW listen level. */
export const LISTEN_FRESH = 0.35;

/* ── analog reference levels (taught in Screen 3; never on the dBFS meters) */

/** Typical nominal levels, volts RMS. A cartridge and a microphone vary
 *  widely with the model and the playing; these are teaching values
 *  (docs/labs/dj/SOURCES.md). dBu is re 0.7746 V, dBV re 1 V. */
export const LEVELS = {
  mic: { label: 'MIC', volts: 0.002, note: 'a dynamic microphone, speech at close range — varies widely' },
  phono: { label: 'PHONO', volts: 0.005, note: 'a moving-magnet cartridge — varies by cartridge' },
  consumerLine: { label: 'LINE −10 dBV', volts: 0.316, note: 'consumer line level (RCA)' },
  proLine: { label: 'LINE +4 dBu', volts: 1.228, note: 'professional line level (XLR / TRS)' },
} as const;
/** The phono preamp's gain in this model (a moving-magnet stage, at 1 kHz). */
export const PHONO_GAIN_DB = 36;

/* ── equipment, jacks, plugs (the connection lessons) ─────────────────── */

export type DeviceId = 'playerA' | 'playerB' | 'mixer' | 'paL' | 'paR' | 'boothL' | 'boothR' | 'turntable';
export const POWERED: readonly DeviceId[] = ['playerA', 'playerB', 'mixer', 'paL', 'paR', 'boothL', 'boothR'];

/** A jack the learner can plug into. */
export type JackId =
  | 'ch1.line.L' | 'ch1.line.R' | 'ch1.phono.L' | 'ch1.phono.R'
  | 'ch2.line.L' | 'ch2.line.R' | 'ch2.phono.L' | 'ch2.phono.R'
  // ONE headphone output: the mixer front's 6.35 mm and 3.5 mm jacks
  // (art/MicGear FRONT phones635 / phones35) are wired in parallel and carry
  // the same signal, so the model gives them one jack
  | 'mix.phones'
  | 'paL.in' | 'paR.in' | 'boothL.in' | 'boothR.in'
  | 'strip.1' | 'strip.2' | 'strip.3' | 'strip.4' | 'strip.5' | 'strip.6' | 'strip.7' | 'strip.8';

/** A plug on a cable whose OTHER end is fixed at its source (stated in the
 *  lesson: "one end is already in its source; you choose where the other end
 *  goes"). */
export type PlugId =
  | 'A.rcaL' | 'A.rcaR' | 'B.rcaL' | 'B.rcaR' | 'tt.rcaL' | 'tt.rcaR'
  | 'mst.xlrL' | 'mst.xlrR' | 'bth.trsL' | 'bth.trsR' | 'phones'
  | 'ac.playerA' | 'ac.playerB' | 'ac.mixer' | 'ac.paL' | 'ac.paR' | 'ac.boothL' | 'ac.boothR';

export type CableKind = 'rca' | 'xlr' | 'trs' | 'phones' | 'iec';

export type PlugDef = {
  id: PlugId;
  kind: CableKind;
  /** The fixed end, in words. */
  from: string;
  /** The device the fixed end is on. */
  device: DeviceId | 'phones';
  /** Short name for a dock key. */
  short: string;
  /** The jacks the PATCH tray offers it — NOT every physical fit: on real
   *  gear the BOOTH TRS plug also goes into the headphone jack, and the
   *  headphone plug into a speaker's combo input (wiring audit WF-DJ-02,
   *  waiting on the owner: Screen 4 has no drawn route for those moves). */
  fits: readonly JackId[];
};

const LINE_PHONO_JACKS: readonly JackId[] = ['ch1.line.L', 'ch1.line.R', 'ch1.phono.L', 'ch1.phono.R', 'ch2.line.L', 'ch2.line.R', 'ch2.phono.L', 'ch2.phono.R'];
const SPEAKER_JACKS: readonly JackId[] = ['paL.in', 'paR.in', 'boothL.in', 'boothR.in'];
const STRIP_JACKS: readonly JackId[] = ['strip.1', 'strip.2', 'strip.3', 'strip.4', 'strip.5', 'strip.6', 'strip.7', 'strip.8'];

export const PLUGS: Record<PlugId, PlugDef> = {
  'A.rcaL': { id: 'A.rcaL', kind: 'rca', from: 'Deck A audio out L (white)', device: 'playerA', short: 'A·L', fits: LINE_PHONO_JACKS },
  'A.rcaR': { id: 'A.rcaR', kind: 'rca', from: 'Deck A audio out R (red)', device: 'playerA', short: 'A·R', fits: LINE_PHONO_JACKS },
  'B.rcaL': { id: 'B.rcaL', kind: 'rca', from: 'Deck B audio out L (white)', device: 'playerB', short: 'B·L', fits: LINE_PHONO_JACKS },
  'B.rcaR': { id: 'B.rcaR', kind: 'rca', from: 'Deck B audio out R (red)', device: 'playerB', short: 'B·R', fits: LINE_PHONO_JACKS },
  'tt.rcaL': { id: 'tt.rcaL', kind: 'rca', from: 'Turntable out L (white)', device: 'turntable', short: 'TT·L', fits: LINE_PHONO_JACKS },
  'tt.rcaR': { id: 'tt.rcaR', kind: 'rca', from: 'Turntable out R (red)', device: 'turntable', short: 'TT·R', fits: LINE_PHONO_JACKS },
  'mst.xlrL': { id: 'mst.xlrL', kind: 'xlr', from: 'Mixer MASTER OUT L (XLR)', device: 'mixer', short: 'MST·L', fits: SPEAKER_JACKS },
  'mst.xlrR': { id: 'mst.xlrR', kind: 'xlr', from: 'Mixer MASTER OUT R (XLR)', device: 'mixer', short: 'MST·R', fits: SPEAKER_JACKS },
  'bth.trsL': { id: 'bth.trsL', kind: 'trs', from: 'Mixer BOOTH OUT L (TRS)', device: 'mixer', short: 'BTH·L', fits: SPEAKER_JACKS },
  'bth.trsR': { id: 'bth.trsR', kind: 'trs', from: 'Mixer BOOTH OUT R (TRS)', device: 'mixer', short: 'BTH·R', fits: SPEAKER_JACKS },
  phones: { id: 'phones', kind: 'phones', from: 'Headphones (stereo plug)', device: 'phones', short: 'PHONES', fits: ['mix.phones'] },
  'ac.playerA': { id: 'ac.playerA', kind: 'iec', from: 'Deck A power cord', device: 'playerA', short: 'PWR A', fits: STRIP_JACKS },
  'ac.playerB': { id: 'ac.playerB', kind: 'iec', from: 'Deck B power cord', device: 'playerB', short: 'PWR B', fits: STRIP_JACKS },
  'ac.mixer': { id: 'ac.mixer', kind: 'iec', from: 'Mixer power cord', device: 'mixer', short: 'PWR MIX', fits: STRIP_JACKS },
  'ac.paL': { id: 'ac.paL', kind: 'iec', from: 'PA speaker L power cord', device: 'paL', short: 'PWR PA L', fits: STRIP_JACKS },
  'ac.paR': { id: 'ac.paR', kind: 'iec', from: 'PA speaker R power cord', device: 'paR', short: 'PWR PA R', fits: STRIP_JACKS },
  'ac.boothL': { id: 'ac.boothL', kind: 'iec', from: 'Booth monitor L power cord', device: 'boothL', short: 'PWR BTH L', fits: STRIP_JACKS },
  'ac.boothR': { id: 'ac.boothR', kind: 'iec', from: 'Booth monitor R power cord', device: 'boothR', short: 'PWR BTH R', fits: STRIP_JACKS },
};
export const PLUG_IDS = Object.keys(PLUGS) as PlugId[];
export const AUDIO_PLUGS: readonly PlugId[] = ['A.rcaL', 'A.rcaR', 'B.rcaL', 'B.rcaR', 'mst.xlrL', 'mst.xlrR', 'bth.trsL', 'bth.trsR', 'phones'];
export const POWER_PLUGS: readonly PlugId[] = ['ac.playerA', 'ac.playerB', 'ac.mixer', 'ac.paL', 'ac.paR', 'ac.boothL', 'ac.boothR'];

export const JACK_NAMES: Record<JackId, string> = {
  'ch1.line.L': 'CH1 LINE L', 'ch1.line.R': 'CH1 LINE R', 'ch1.phono.L': 'CH1 PHONO L', 'ch1.phono.R': 'CH1 PHONO R',
  'ch2.line.L': 'CH2 LINE L', 'ch2.line.R': 'CH2 LINE R', 'ch2.phono.L': 'CH2 PHONO L', 'ch2.phono.R': 'CH2 PHONO R',
  'mix.phones': 'PHONES jack',
  'paL.in': 'PA speaker L input', 'paR.in': 'PA speaker R input', 'boothL.in': 'Booth monitor L input', 'boothR.in': 'Booth monitor R input',
  'strip.1': 'Power strip 1', 'strip.2': 'Power strip 2', 'strip.3': 'Power strip 3', 'strip.4': 'Power strip 4',
  'strip.5': 'Power strip 5', 'strip.6': 'Power strip 6', 'strip.7': 'Power strip 7', 'strip.8': 'Power strip 8',
};

/** Where each plug goes in a correctly built system. */
export const BUILT_PLUGS: Record<PlugId, JackId | null> = {
  'A.rcaL': 'ch1.line.L', 'A.rcaR': 'ch1.line.R', 'B.rcaL': 'ch2.line.L', 'B.rcaR': 'ch2.line.R',
  'tt.rcaL': null, 'tt.rcaR': null,
  'mst.xlrL': 'paL.in', 'mst.xlrR': 'paR.in', 'bth.trsL': 'boothL.in', 'bth.trsR': 'boothR.in', phones: 'mix.phones',
  // power: any outlet is correct; these follow the devices left to right so
  // the cords never cross on the way to the strip
  'ac.paR': 'strip.1', 'ac.boothL': 'strip.2', 'ac.playerA': 'strip.3', 'ac.mixer': 'strip.4', 'ac.playerB': 'strip.5', 'ac.boothR': 'strip.6', 'ac.paL': 'strip.7',
};

/* ── state ────────────────────────────────────────────────────────────── */

export type DeckState = {
  track: TrackId | null;
  playing: boolean;
  /** Track time at booth time `at`. */
  posSec: number;
  at: number;
  /** The transport (main) CUE point. */
  cueSec: number;
  pitch: number;
  hotCues: (number | null)[];
  loop: Loop | null;
  quantize: boolean;
  gridMode: GridMode;
  /** The learner's grid edit: the first beat moved by this many beats. */
  gridShiftBeats: number;
  /** The learner's BPM fix: ×2 / ×½ on a mis-analysed tempo. */
  bpmFix: 1 | 2 | 0.5;
  /* ── Stage 2, all optional (absent = Stage 1 behaviour) ── */
  /** KEY LOCK: the tempo moves, the pitch stays (a real time-stretch). */
  keyLock?: boolean;
  /** KEY SHIFT in semitones (pitch only). */
  keyShift?: number;
  /** The tempo fader's range, ± % (default PITCH_RANGE_PCT). */
  tempoRange?: number;
  /** Per-stem levels (0 … 1). Present = the deck plays from its stems. */
  stems?: StemGains;
  /** Where the stems come from: the track's own parts, or a SIMULATED
   *  separation of the mix (leakage and artifacts, labelled as such). */
  stemFrom?: 'ORIGINAL' | 'SEPARATED';
};
export type StemGains = { drums: number; bass: number; chords: number; lead: number };

export type ChannelState = {
  input: InputSel;
  trim: number;
  eq: { hi: number; mid: number; lo: number };
  filter: number;
  fader: number;
  cue: boolean;
  xf: XfAssign;
};

export type MixerState = {
  xf: number;
  xfCurve: XfCurve;
  master: number;
  booth: number;
  phones: number;
  cueMix: number;
  splitCue: boolean;
  resonance: number;
};

export type SamplerState = {
  /** The player whose software hosts the sampler: its pads play out of THAT
   *  player's audio output, so they follow its channel, fader and cue. */
  on: DeckId;
  /** Pad hits waiting to sound: booth time + sample. */
  hits: { at: number; id: import('../engine/djMusic.ts').SampleId }[];
};

export type Booth = {
  decks: Record<DeckId, DeckState>;
  /** The turntable (connection lessons only): plays the Night Ferry record. */
  tt: DeckState;
  ch: Record<ChannelId, ChannelState>;
  mixer: MixerState;
  plugs: Record<PlugId, JackId | null>;
  power: Record<DeviceId, boolean>;
  /** The turntable's built-in preamp switch: PHONO (raw cartridge) / LINE. */
  ttPreamp: 'PHONO' | 'LINE';
  perspective: Perspective;
  listen: number;
  sampler: SamplerState;
  /* ── Stage 2, all optional (absent = Stage 1 behaviour) ── */
  /** The mixer's effects unit (Screen 13, model/djEffects). */
  fx?: import('./djEffects.ts').FxState;
  /** A laptop running DJ software over the mixer's USB (Screens 16, 18). */
  laptop?: import('./djLaptop.ts').LaptopState;
  /** The turntable's setup (Screen 17, model/djVinyl). */
  vinyl?: import('./djVinyl.ts').VinylState;
  /** A digital vinyl system on the turntable (Screen 18, model/djDvs). */
  dvs?: import('./djDvs.ts').DvsState;
  /** ADDITIVE (Stage 2b, screens 19–24): the EVENT RIG — microphone, venue
   *  PA, recorder, drum machine, laptops (model/djEvent.ts). Absent on the
   *  Stage 1 screens, which therefore render exactly as before. */
  ev?: import('./djEvent.ts').EventRig;
};

export const freshDeck = (track: TrackId | null = null): DeckState => ({
  track,
  playing: false,
  // A loaded deck is cued at its first beat (a player's auto-cue).
  posSec: track ? TRACKS[track].leadInSec : 0,
  at: 0,
  cueSec: track ? TRACKS[track].leadInSec : 0,
  pitch: 0,
  hotCues: [null, null, null, null],
  loop: null,
  quantize: true,
  gridMode: 'TRUE',
  gridShiftBeats: 0,
  bpmFix: 1,
});

export const freshChannel = (): ChannelState => ({
  input: 'LINE',
  trim: TRIM_UNITY,
  eq: { hi: 0.5, mid: 0.5, lo: 0.5 },
  filter: 0,
  fader: 0,
  cue: false,
  xf: 'THRU',
});

export const freshMixer = (): MixerState => ({
  xf: 0.5,
  xfCurve: 'BLEND',
  master: 0.6,
  booth: 0.45,
  phones: 0.45,
  cueMix: 0,
  splitCue: false,
  resonance: 0.1,
});

/** A booth with everything connected and powered and both decks loaded —
 *  the start of every operating lesson. */
export function builtBooth(): Booth {
  return {
    decks: { A: freshDeck('nightFerry'), B: freshDeck('glassHarbour') },
    tt: { ...freshDeck('nightFerry'), posSec: 31.6 },
    ch: { 1: freshChannel(), 2: freshChannel() },
    mixer: freshMixer(),
    plugs: { ...BUILT_PLUGS },
    power: { playerA: true, playerB: true, mixer: true, paL: true, paR: true, boothL: true, boothR: true, turntable: true },
    ttPreamp: 'LINE',
    perspective: 'CROWD',
    listen: LISTEN_FRESH,
    sampler: { on: 'B', hits: [] },
  };
}

/** Nothing connected, nothing on (Screens 3–4 start here). */
export function unbuiltBooth(): Booth {
  const b = builtBooth();
  for (const p of PLUG_IDS) b.plugs[p] = null;
  for (const d of POWERED) b.power[d] = false;
  return b;
}

/* ── derived truths (what reaches where) ──────────────────────────────── */

/** A device can pass audio: plugged into the strip AND switched on. */
export function deviceLive(b: Booth, d: DeviceId): boolean {
  if (d === 'turntable') return b.power.turntable;
  const plug = (`ac.${d}` as PlugId);
  return b.power[d] && b.plugs[plug] != null;
}

export type SourceRef = { source: 'A' | 'B' | 'TT'; side: 'L' | 'R' } | null;

/** What a jack receives (the plug in it), as a source and its side. */
export function jackSource(b: Booth, jack: JackId): SourceRef {
  for (const p of ['A.rcaL', 'A.rcaR', 'B.rcaL', 'B.rcaR', 'tt.rcaL', 'tt.rcaR'] as PlugId[]) {
    if (b.plugs[p] === jack) {
      const src = p.startsWith('A.') ? 'A' : p.startsWith('B.') ? 'B' : 'TT';
      return { source: src, side: p.endsWith('L') ? 'L' : 'R' };
    }
  }
  return null;
}

/** The two jacks a channel's input selector listens to. */
export function selectedJacks(ch: ChannelId, input: InputSel): { L: JackId; R: JackId } | null {
  if (input === 'USB') return null; // computer audio over USB is not part of Stage 1
  const k = input === 'LINE' ? 'line' : 'phono';
  return { L: `ch${ch}.${k}.L` as JackId, R: `ch${ch}.${k}.R` as JackId };
}

/** The level class of a source (a turntable with its preamp OFF is phono). */
export function sourceLevel(b: Booth, src: 'A' | 'B' | 'TT'): 'line' | 'phono' {
  return src === 'TT' && b.ttPreamp === 'PHONO' ? 'phono' : 'line';
}

export type ChannelRoute = {
  /** Per side: the source feeding it through the selected input. */
  L: SourceRef;
  R: SourceRef;
  jackClass: 'line' | 'phono' | 'none';
  /** A line-level source in a PHONO jack: far too hot (it overloads the
   *  phono stage). */
  tooHot: boolean;
  /** A raw cartridge in a LINE jack: far too quiet, no RIAA (thin). */
  tooQuiet: boolean;
};

export function channelRoute(b: Booth, ch: ChannelId): ChannelRoute {
  const c = b.ch[ch];
  const jacks = selectedJacks(ch, c.input);
  if (!jacks || !deviceLive(b, 'mixer')) return { L: null, R: null, jackClass: 'none', tooHot: false, tooQuiet: false };
  const live = (s: SourceRef): SourceRef => {
    if (!s) return null;
    if (s.source === 'TT') return deviceLive(b, 'turntable') ? s : null;
    return deviceLive(b, s.source === 'A' ? 'playerA' : 'playerB') ? s : null;
  };
  const L = live(jackSource(b, jacks.L));
  const R = live(jackSource(b, jacks.R));
  const cls = c.input === 'PHONO' ? 'phono' : 'line';
  const lv = [L, R].filter(Boolean).map((s) => sourceLevel(b, s!.source));
  return { L, R, jackClass: cls, tooHot: cls === 'phono' && lv.includes('line'), tooQuiet: cls === 'line' && lv.includes('phono') };
}

export type SpeakerId = 'paL' | 'paR' | 'boothL' | 'boothR';
export type MixerOut = { out: 'MASTER' | 'BOOTH'; side: 'L' | 'R' } | null;

/** Which mixer output feeds a speaker's input (and the speaker is live). */
export function speakerFeed(b: Booth, spk: SpeakerId): MixerOut {
  if (!deviceLive(b, spk) || !deviceLive(b, 'mixer')) return null;
  const jack = `${spk}.in` as JackId;
  for (const p of ['mst.xlrL', 'mst.xlrR', 'bth.trsL', 'bth.trsR'] as PlugId[]) {
    if (b.plugs[p] === jack) return { out: p.startsWith('mst') ? 'MASTER' : 'BOOTH', side: p.endsWith('L') ? 'L' : 'R' };
  }
  return null;
}

export const phonesPlugged = (b: Booth): boolean => b.plugs.phones === 'mix.phones' && deviceLive(b, 'mixer');

/** Every plug is where a correct system has it, and everything is on. */
export function systemBuilt(b: Booth): boolean {
  for (const p of PLUG_IDS) if (BUILT_PLUGS[p] && !plugCorrect(b, p)) return false;
  return POWERED.every((d) => deviceLive(b, d));
}

/** A plug is "correct" when it is where the built system has it — power
 *  cords count when they are in ANY strip outlet. */
export function plugCorrect(b: Booth, p: PlugId): boolean {
  const want = BUILT_PLUGS[p];
  const at = b.plugs[p];
  if (PLUGS[p].kind === 'iec') return at != null;
  return at === want;
}

/** A plug in a jack outside its `fits` list is refused — tap-to-connect
 *  never makes a connection the tray does not offer. Returns the new booth or null. Any plug already
 *  in that jack comes out (one plug per jack). */
export function connect(b: Booth, p: PlugId, jack: JackId | null): Booth | null {
  if (jack != null && !PLUGS[p].fits.includes(jack)) return null;
  const plugs = { ...b.plugs };
  if (jack != null) for (const q of PLUG_IDS) if (plugs[q] === jack) plugs[q] = null;
  plugs[p] = jack;
  return { ...b, plugs };
}

/* ── power sequencing (Screen 4) ──────────────────────────────────────── */

export const SPEAKERS: readonly SpeakerId[] = ['paL', 'paR', 'boothL', 'boothR'];

/**
 * Switching a SOURCE or the MIXER on or off while a powered speaker fed from
 * it is already on makes a THUMP (the turn-on transient travels down the
 * line into a live amplifier). This model flags it — it never plays it loud.
 * The safe order: on = sources → mixer → speakers LAST; off = speakers FIRST.
 */
export function powerThump(b: Booth, d: DeviceId): boolean {
  if (d !== 'mixer' && d !== 'playerA' && d !== 'playerB') return false;
  return SPEAKERS.some((s) => deviceLive(b, s) && speakerCabled(b, s));
}

/** A mixer output cable is in this speaker's input. */
export function speakerCabled(b: Booth, s: SpeakerId): boolean {
  const jack = `${s}.in` as JackId;
  return (['mst.xlrL', 'mst.xlrR', 'bth.trsL', 'bth.trsR'] as PlugId[]).some((p) => b.plugs[p] === jack);
}

/** Where a mixer output's level is up enough to carry a bang. */
const LEVEL_DOWN = 0.02;

/**
 * HOT-PATCHING (audio review 2026-10-18 #3): plugging or unplugging an audio
 * cable while it is live sends a pop or a buzz straight to the speakers — a
 * half-inserted RCA plug buzzes loudly through a live PA, and a master cable
 * pushed into a live powered speaker can bang. This model FLAGS it (never
 * plays it). Returns the speakers that would hear it (empty = safe):
 *   - a MASTER / BOOTH cable moved into or out of a LIVE speaker while the
 *     mixer is on and that output's level is up;
 *   - a SOURCE cable moved on a jack its channel is listening to, while that
 *     channel's fader is up — every live speaker fed from the mixer hears it.
 * The safe habit: fader (or MASTER) down, or the speakers off, first.
 */
export function hotPatchSpeakers(b: Booth, p: PlugId, to: JackId | null): SpeakerId[] {
  const from = b.plugs[p];
  if (from === to || !deviceLive(b, 'mixer')) return [];
  const kind = PLUGS[p].kind;
  if (kind === 'xlr' || kind === 'trs') {
    const level = p.startsWith('mst') ? b.mixer.master : b.mixer.booth;
    if (level <= LEVEL_DOWN) return [];
    const hit: SpeakerId[] = [];
    for (const j of [from, to]) {
      if (!j || !j.endsWith('.in')) continue;
      const spk = j.slice(0, -3) as SpeakerId;
      if (deviceLive(b, spk) && !hit.includes(spk)) hit.push(spk);
    }
    return hit;
  }
  if (kind !== 'rca') return [];
  const touched = [from, to].some((j) => {
    if (!j || !j.startsWith('ch')) return false;
    const ch = Number(j[2]) as ChannelId;
    const sel = selectedJacks(ch, b.ch[ch].input);
    return !!sel && (sel.L === j || sel.R === j) && b.ch[ch].fader > LEVEL_DOWN;
  });
  if (!touched) return [];
  return SPEAKERS.filter((spk) => {
    const f = speakerFeed(b, spk);
    if (!f) return false;
    return (f.out === 'MASTER' ? b.mixer.master : b.mixer.booth) > LEVEL_DOWN;
  });
}

/* ── decks: position, grid ────────────────────────────────────────────── */

/** A deck's track time at booth time `t`. */
export function deckPos(d: DeckState, t: number): number {
  if (!d.playing) return d.posSec;
  return advance(d.posSec, Math.max(0, t - d.at), d.pitch, d.loop);
}

/** Re-anchor every deck at booth time `t` (before any change is applied). */
export function anchorAt(b: Booth, t: number): Booth {
  const decks = { ...b.decks };
  for (const id of DECK_IDS) {
    const d = decks[id];
    decks[id] = { ...d, posSec: deckPos(d, t), at: t };
  }
  const out: Booth = { ...b, decks, tt: { ...b.tt, posSec: deckPos(b.tt, t), at: t } };
  // the event rig's laptop decks keep their place the same way (Stage 2b)
  if (b.ev) {
    const lap = (l: import('./djEvent.ts').Laptop) => ({ ...l, deck: { ...l.deck, posSec: deckPos(l.deck, t), at: t } });
    out.ev = { ...b.ev, lap1: lap(b.ev.lap1), lap2: lap(b.ev.lap2) };
  }
  return out;
}

/* ── helpers ──────────────────────────────────────────────────────────── */

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export const dbStr = (db: number, digits = 1): string => (db === -Infinity || db <= -120 ? '−∞ dB' : `${db > 0 ? '+' : db < 0 ? '−' : ''}${Math.abs(db).toFixed(digits)} dB`);
