/**
 * lesson01 data — "What Are We Connecting?" (owner spec §5.1).
 * Teaches the CATEGORIES of what travels through cables before any connector
 * is named. Pure data, zero React. Copy is consistent with the verified
 * connector records (no new factual claims beyond them).
 */
import type { CarriedType } from '../cableTypes';

export type CarriedCategory = {
  id: CarriedType;
  label: string;
  blurb: string;
};

export const CARRIED_CATEGORIES: CarriedCategory[] = [
  {
    id: 'mic_level',
    label: 'MIC-LEVEL AUDIO',
    blurb:
      'A few thousandths of a volt from a microphone — the most fragile signal in the room. It needs a preamplifier before anything else can use it.',
  },
  {
    id: 'instrument_level',
    label: 'INSTRUMENT-LEVEL AUDIO',
    blurb:
      'A guitar or bass pickup’s signal: stronger than mic level, weaker than line level, and picky about the input that receives it.',
  },
  {
    id: 'line_level',
    label: 'LINE-LEVEL AUDIO',
    blurb: 'The working level professional gear trades in — mixers, processors, interfaces and playback devices talk to each other at line level.',
  },
  {
    id: 'headphone_level',
    label: 'HEADPHONE AUDIO',
    blurb: 'A small amplifier’s output — enough to drive earcups. More than line level demands, far less than a loudspeaker needs.',
  },
  {
    id: 'speaker_level',
    label: 'LOUDSPEAKER-LEVEL AUDIO',
    blurb:
      'A power amplifier’s output: whole volts to well over a hundred, with real current behind it. It belongs only on loudspeaker terminals.',
  },
  {
    id: 'digital_audio',
    label: 'DIGITAL AUDIO',
    blurb: 'Audio traveling as data — AES3, S/PDIF, ADAT. The format and the cable built for it matter, not just the plug that fits.',
  },
  {
    id: 'network_audio',
    label: 'NETWORKED AUDIO',
    blurb: 'Many channels of audio riding a computer network — Dante, AES50, AVB. The network AND the protocol must both match.',
  },
  {
    id: 'clock_sync',
    label: 'CLOCK / SYNC',
    blurb: 'Not audio at all: the timing reference that keeps digital devices sampling in step with each other.',
  },
  {
    id: 'control_data',
    label: 'CONTROL DATA',
    blurb: 'Messages that tell equipment what to do — MIDI performance data, DMX lighting levels. Control, not sound.',
  },
  {
    id: 'dc_power',
    label: 'LOW-VOLTAGE DC POWER',
    blurb: 'Power for small devices — pedals, interfaces, receivers. Voltage, polarity and current capacity must all match the device.',
  },
  {
    id: 'ac_mains',
    label: 'AC MAINS POWER',
    blurb: 'Wall power. It runs the equipment, it is dangerous to handle carelessly, and it never shares a connector with signal.',
  },
  {
    id: 'hybrid_power_data',
    label: 'POWER + DATA TOGETHER',
    blurb: 'One cable doing two jobs — USB charging while it carries data, or PoE powering a device over the same network line.',
  },
];

const LABELS: Record<CarriedType, string> = Object.fromEntries(CARRIED_CATEGORIES.map((c) => [c.id, c.label])) as Record<
  CarriedType,
  string
>;

export function carriedLabel(id: CarriedType): string {
  return LABELS[id];
}

export type CarryPair = {
  id: string;
  from: string;
  to: string;
  options: CarriedType[];
  correct: CarriedType;
  /** Alternatives accepted as also-defensible (tri-state verdict, MicSelect idiom). */
  accept?: CarriedType[];
  explain: string;
};

/** The owner-spec source→destination pairs (§5.1) — what must TRAVEL between
 *  them, asked before any connector is named. */
export const CARRY_PAIRS: CarryPair[] = [
  {
    id: 'mic_mixer',
    from: 'Microphone',
    to: 'Mixer',
    options: ['mic_level', 'line_level', 'speaker_level', 'digital_audio'],
    correct: 'mic_level',
    explain:
      'A microphone puts out mic-level analog audio — thousandths of a volt. The mixer’s preamp raises it to working level. (Phantom power may ride the same cable, but what travels down it is a mic-level signal.)',
  },
  {
    id: 'guitar_di',
    from: 'Electric guitar',
    to: 'DI box',
    options: ['instrument_level', 'mic_level', 'line_level', 'speaker_level'],
    correct: 'instrument_level',
    explain:
      'A passive pickup produces instrument-level audio that wants a high-impedance input — exactly what a DI box provides before converting the signal for the mic line.',
  },
  {
    id: 'mixer_powered',
    from: 'Mixer',
    to: 'Powered loudspeaker',
    options: ['line_level', 'speaker_level', 'ac_mains', 'network_audio'],
    correct: 'line_level',
    explain:
      'A powered loudspeaker amplifies INSIDE the cabinet, so the mixer sends it line-level audio. Its power arrives separately — from the wall, on a mains cable. Two connections, two different things traveling.',
  },
  {
    id: 'amp_passive',
    from: 'Power amplifier',
    to: 'Passive loudspeaker',
    options: ['speaker_level', 'line_level', 'instrument_level', 'ac_mains'],
    correct: 'speaker_level',
    explain:
      'An amplifier’s output is loudspeaker-level — volts of drive with real current. It belongs only on loudspeaker terminals, over speaker cable sized for the job.',
  },
  {
    id: 'interface_computer',
    from: 'Audio interface',
    to: 'Computer',
    options: ['digital_audio', 'line_level', 'hybrid_power_data', 'clock_sync'],
    correct: 'digital_audio',
    accept: ['hybrid_power_data'],
    explain:
      'The audio crosses as computer data — digital audio over USB. Also defensible: many interfaces draw their power back up the very same cable, which makes the connection a power-and-data hybrid.',
  },
  {
    id: 'switch_dante',
    from: 'Network switch',
    to: 'Dante-enabled device',
    options: ['network_audio', 'digital_audio', 'control_data', 'clock_sync'],
    correct: 'network_audio',
    explain:
      'Dante is networked audio — many channels riding an ordinary computer network. The ports look like any network jack; the protocol is what makes it audio.',
  },
  {
    id: 'wordclock_recorder',
    from: 'Word-clock generator',
    to: 'Digital recorder',
    options: ['clock_sync', 'digital_audio', 'control_data', 'line_level'],
    correct: 'clock_sync',
    explain:
      'Word clock carries no audio at all — it is the timing pulse that keeps every digital device sampling in step. Losing it causes clicks and drift, not silence in the cable.',
  },
  {
    id: 'midi_synth',
    from: 'MIDI controller',
    to: 'Synthesizer',
    options: ['control_data', 'digital_audio', 'line_level', 'clock_sync'],
    correct: 'control_data',
    explain:
      'MIDI is control data — which note, how hard, which knob moved. No sound travels down a MIDI cable; the synthesizer MAKES the sound when told to.',
  },
  {
    id: 'outlet_powered',
    from: 'Power outlet',
    to: 'Powered loudspeaker',
    options: ['ac_mains', 'speaker_level', 'dc_power', 'line_level'],
    correct: 'ac_mains',
    explain:
      'This one is wall power — AC mains. It shares nothing with the loudspeaker-level connection an amplifier makes, even though history has seen similar-looking connectors on both. That is exactly why we identify what travels FIRST.',
  },
];

/** Lesson takeaway (LessonBanner idiom). */
export const L01_LESSON =
  'A microphone signal, a loudspeaker output and wall power are fundamentally different things — even when the connectors look alike. Name what must travel FIRST; only then pick the cable.';
