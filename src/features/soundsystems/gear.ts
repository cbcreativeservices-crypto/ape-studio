/**
 * Sound Systems Lab — the gear catalogue.
 *
 * Every piece of equipment the builder can place, with the one fact that
 * decides whether two pieces may be joined: the signal level each port
 * accepts and emits. The descriptions are the LEARN chapter-1 copy of record
 * (tap a component → where its signal comes from, where it goes next).
 *
 * Generic hardware only — no brand likeness, no trade dress.
 */
import type { GearKind, SignalLevel, SlotRole } from './types';

export type GearSpec = {
  kind: GearKind;
  name: string;
  /** Short plural-safe label for the parts bin and legends. */
  short: string;
  /** Levels this gear will accept at its input(s). Empty = a source. */
  accepts: readonly SignalLevel[];
  /** Levels this gear can emit. Empty = a sink (the sound leaves as air). */
  emits: readonly SignalLevel[];
  /** Where it may stand on the plot. */
  roles: readonly SlotRole[];
  /** What it does, in one breath — LEARN chapter 1. */
  blurb: string;
  /** Where its signal comes from / where it goes next — the tap-to-inspect card. */
  from: string;
  to: string;
  /** Whether more than one may be placed in one build (mics, speakers, wedges). */
  many?: boolean;
  /** Seeds the signal trace even though it has an electrical input (a DI:
   *  the bass on the player's strap is not a device on the plot). */
  source?: boolean;
  /** Draws sound into the room — the trace treats it as a listener-facing sink. */
  radiates?: boolean;
};

export const GEAR: readonly GearSpec[] = [
  {
    kind: 'vocalMic',
    name: 'Vocal microphone',
    short: 'VOCAL MIC',
    accepts: ['acoustic'],
    emits: ['mic'],
    roles: ['stageSource'],
    blurb: 'Turns the voice into a MIC-LEVEL electrical signal — millivolts, the quietest signal in the system. Needs a preamp before anything can use it.',
    from: 'The performer’s voice in the air.',
    to: 'A mic cable to the stagebox or snake, then a console input where the preamp raises it to line level.',
    many: true,
  },
  {
    kind: 'instrumentMic',
    name: 'Instrument microphone',
    short: 'INST MIC',
    accepts: ['acoustic'],
    emits: ['mic'],
    roles: ['stageSource'],
    blurb: 'A microphone on a drum, amplifier cabinet or acoustic instrument. Same mic-level output as a vocal mic — the source is the only difference.',
    from: 'The instrument or cabinet in the air.',
    to: 'Mic cable → stagebox → console preamp.',
    many: true,
  },
  {
    kind: 'di',
    name: 'DI box',
    short: 'DI',
    accepts: ['instrument', 'line'],
    emits: ['mic'],
    roles: ['stageSource'],
    blurb: 'Direct injection: takes an unbalanced instrument- or line-level signal (bass, acoustic pickup, keyboard, or playback with the pad in) and delivers the balanced mic-level signal a long cable run and a console preamp expect.',
    from: 'An instrument or line output on a ¼-inch cable; its THRU carries the same signal on to the player’s amplifier.',
    to: 'An XLR mic cable to the stagebox, then a console input.',
    many: true,
    source: true,
  },
  {
    kind: 'playback',
    name: 'Playback device',
    short: 'PLAYBACK',
    accepts: [],
    emits: ['line'],
    roles: ['stageSource', 'foh'],
    blurb: 'Walk-in music, backing tracks, video audio. Already LINE LEVEL — it needs no preamp gain, and it must not be plugged into a mic input with phantom power engaged.',
    from: 'A file or stream inside the device.',
    to: 'Line inputs on the console (or a DI when the run is long and unbalanced).',
  },
  {
    kind: 'wirelessRx',
    name: 'Wireless receiver',
    short: 'RF RX',
    accepts: [],
    emits: ['mic', 'line'],
    roles: ['stageSource', 'stageInfra', 'foh'],
    blurb: 'The rack half of a wireless microphone. The transmitter rides on the performer; the receiver outputs the signal on a cable — usually mic level on its XLR, line level on its ¼-inch — set by its switch. The RF rack lives side-stage on any real show.',
    from: 'The handheld or bodypack transmitter over radio.',
    to: 'A console input — match the receiver’s output switch to the input you use.',
    many: true,
  },
  {
    kind: 'snake',
    name: 'Analog snake',
    short: 'SNAKE',
    accepts: ['mic', 'line'],
    emits: ['mic', 'line'],
    roles: ['stageInfra'],
    blurb: 'A multipair cable: many mic and line signals in one jacket from the stage box to front of house, each pair carrying its own channel unchanged. Returns run the other way for mains and monitors.',
    from: 'Every stage source, plugged into the box at the stage end.',
    to: 'The console at front of house, one channel per pair.',
  },
  {
    kind: 'stagebox',
    name: 'Digital stagebox',
    short: 'STAGEBOX',
    accepts: ['mic', 'line', 'digital'],
    emits: ['digital', 'line'],
    roles: ['stageInfra'],
    blurb: 'Preamps on the stage. Every input is converted to digital at the box and travels to the console on one network cable; console outputs usually come back the same way and leave the box at line level for amplifiers and powered loudspeakers. Alternatives: analog console outputs down a return snake, or networked amplifiers fed directly.',
    from: 'Stage sources on the input side; the console over the network on the output side.',
    to: 'The console over a single network cable; amplifiers and powered loudspeakers from its line outputs.',
  },
  {
    kind: 'console',
    name: 'Mixing console',
    short: 'CONSOLE',
    accepts: ['mic', 'line', 'digital'],
    emits: ['line', 'digital'],
    roles: ['foh'],
    blurb: 'Where every input becomes a mix. Preamps set gain, channels shape and balance, buses combine — main, auxiliaries for monitors and effects, subgroups, DCAs, matrices — and outputs leave at line level.',
    from: 'Stage inputs by snake or digital stagebox.',
    to: 'The system processor (or amplifiers and powered speakers directly), monitor sends to wedges and in-ear transmitters.',
  },
  {
    kind: 'processor',
    name: 'Loudspeaker management processor',
    short: 'PROCESSOR',
    accepts: ['line'],
    emits: ['line'],
    roles: ['ampRack', 'foh'],
    blurb: 'Sits between the console and the amplification: crossovers that split lows to the subs and highs to the tops, system EQ, delay for alignment, polarity, and the limiters that protect the loudspeakers. Networked versions take the console over Dante or AES — the same job on one cable — and networked amplifiers build the processing in, with no separate box.',
    from: 'The console’s main and matrix outputs.',
    to: 'Amplifier inputs or powered loudspeakers, one processor output per amplifier channel.',
  },
  {
    kind: 'amp',
    name: 'Power amplifier',
    short: 'AMP',
    accepts: ['line'],
    emits: ['speaker'],
    roles: ['ampRack'],
    blurb: 'Turns a line-level signal into SPEAKER-LEVEL power — tens of volts and amps of current into a low-impedance load. Its output must only ever meet a passive loudspeaker.',
    from: 'A processor output or a console output.',
    to: 'Passive loudspeakers over speaker cable. Never a line input.',
    many: true,
  },
  {
    kind: 'poweredSpeaker',
    name: 'Powered loudspeaker',
    short: 'POWERED TOP',
    accepts: ['line'],
    emits: ['line'],
    roles: ['main', 'fill', 'delay'],
    blurb: 'A loudspeaker with its amplifier and basic processing inside. It takes a LINE-LEVEL feed and mains power — two cables to every box — and nearly every one has a LINK/THRU output carrying its input, unfiltered, to the next cabinet.',
    from: 'A console, processor or powered-sub output at line level.',
    to: 'The audience, as sound — and its LINK/THRU to a second cabinet.',
    many: true,
    radiates: true,
  },
  {
    kind: 'passiveSpeaker',
    name: 'Passive loudspeaker',
    short: 'PASSIVE TOP',
    accepts: ['speaker'],
    emits: [],
    roles: ['main', 'fill', 'delay'],
    blurb: 'Drivers and a crossover in a cabinet, no amplifier. It needs a power amplifier of the right size, connected by speaker cable, and the load it presents to that amplifier has to be respected.',
    from: 'A power amplifier over speaker cable.',
    to: 'The audience, as sound.',
    many: true,
    radiates: true,
  },
  {
    kind: 'poweredSub',
    name: 'Powered subwoofer',
    short: 'POWERED SUB',
    accepts: ['line'],
    emits: ['line'],
    roles: ['sub', 'monitor'],
    blurb: 'Low frequencies only, amplifier inside. Most have an internal crossover with a HIGH-PASSED output for the tops (the sub does the split — the common small-system hookup) and a full-range THRU for the next sub. Beside a drum kit, with a top on it, it is a drum fill.',
    from: 'A console output, a processor output, or the aux/matrix feeding the subs.',
    to: 'The audience below roughly 100 Hz; optionally the tops from its high-passed output.',
    many: true,
    radiates: true,
  },
  {
    kind: 'passiveSub',
    name: 'Passive subwoofer',
    short: 'PASSIVE SUB',
    accepts: ['speaker'],
    emits: [],
    roles: ['sub', 'monitor'],
    blurb: 'A low-frequency cabinet driven by an external amplifier. The crossover must be done upstream — in the processor — because nothing inside the box will do it.',
    from: 'A power amplifier fed by the processor’s LOW output.',
    to: 'The audience below the crossover frequency.',
    many: true,
    radiates: true,
  },
  {
    kind: 'wedge',
    name: 'Floor wedge (passive)',
    short: 'WEDGE',
    accepts: ['speaker'],
    emits: [],
    roles: ['monitor'],
    blurb: 'A stage monitor angled at the performer, driven by an amplifier fed from a monitor mix. Its whole job is to be heard by one person without being heard by the microphone.',
    from: 'An amplifier channel fed by an aux send.',
    to: 'The performer standing in front of it.',
    many: true,
    radiates: true,
  },
  {
    kind: 'poweredWedge',
    name: 'Floor wedge (powered)',
    short: 'POWERED WEDGE',
    accepts: ['line'],
    emits: [],
    roles: ['monitor'],
    blurb: 'A stage monitor with its amplifier inside: a line-level aux send and mains power, no amplifier rack.',
    from: 'An aux send output at line level.',
    to: 'The performer standing in front of it.',
    many: true,
    radiates: true,
  },
  {
    kind: 'iemTx',
    name: 'In-ear monitor transmitter',
    short: 'IEM TX',
    accepts: ['line'],
    emits: ['wireless'],
    roles: ['stageInfra', 'foh', 'ampRack'],
    blurb: 'Takes a monitor mix at line level and broadcasts it to a performer’s bodypack. A stereo mix needs a stereo transmitter and one stereo send — two aux outputs.',
    from: 'An aux or stereo aux send from the console.',
    to: 'The performer’s bodypack over radio.',
    many: true,
  },
  {
    kind: 'iemPack',
    name: 'In-ear bodypack',
    short: 'IEM PACK',
    accepts: ['wireless'],
    emits: [],
    roles: ['stageSource'],
    blurb: 'The receiver on the performer, feeding sealed earphones. Isolation is why it works — and why its limiter and level are a hearing-safety matter, not a taste one.',
    from: 'The transmitter over radio.',
    to: 'The performer’s ears, directly.',
    many: true,
    radiates: true,
  },
  {
    kind: 'powerDistro',
    name: 'Power distribution',
    short: 'DISTRO',
    accepts: [],
    emits: [],
    roles: ['stageInfra', 'ampRack'],
    blurb: 'Not a signal device at all — but every amplifier and powered loudspeaker needs it, and audio and lighting sharing one badly grounded feed is where hum begins. Electrical distribution is designed and approved by licensed people.',
    from: 'The venue’s supply.',
    to: 'Every powered device, on properly grounded circuits.',
  },
];

export function gearSpec(kind: GearKind): GearSpec {
  const g = GEAR.find((x) => x.kind === kind);
  if (!g) throw new Error(`Unknown gear kind: ${kind}`);
  return g;
}

/** Sources start the signal: nothing in the SYSTEM feeds them — a microphone
 *  takes air, a DI takes the instrument on the player's strap, and neither the
 *  air nor the guitar is a device on the plot. */
export function isSource(kind: GearKind): boolean {
  const g = gearSpec(kind);
  return g.source === true || g.accepts.length === 0 || g.accepts.every((l) => l === 'acoustic');
}

/** Sinks end it: the signal leaves as sound (or into an ear). */
export function isSink(kind: GearKind): boolean {
  return !!gearSpec(kind).radiates;
}

/** Human names for the levels — the vocabulary the wiring chapter drills. */
export const LEVEL_LABEL: Record<SignalLevel, string> = {
  acoustic: 'sound in air',
  mic: 'mic level',
  instrument: 'instrument level',
  line: 'line level',
  speaker: 'speaker level',
  digital: 'digital (network)',
  wireless: 'wireless (RF)',
};
