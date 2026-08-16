/**
 * lessons — the 12-lesson registry for the Cable & Connector Fundamentals Lab
 * (owner spec 2026-08-15 §4/§5; near-verbatim intros — changes route back to
 * the owner). Pure data, zero React. Array order = step order = nav order.
 *
 * Completion (af_cables, R6c): lesson units clear when the lesson's knowledge
 * check is SOLVED; the tester, both challenges, the final check and every
 * critical-safety question are their own units (cableTypes.ts). CABLE_UNITS
 * below feeds the static LAB_UNITS entry in labCompletion.ts, so boot-time
 * RPC retry works without importing any screen code.
 */
import {
  CHALLENGE_A_UNIT,
  CHALLENGE_B_UNIT,
  FINAL_UNIT,
  SAFETY_UNITS,
  TESTER_UNIT,
  type CableLessonDef,
} from '../cableTypes';

/** The central principle, repeated through the lab (owner spec §3, verbatim
 *  intent): shape is not proof. */
export const CORE_PRINCIPLE =
  'A connector’s shape does not tell you everything about the cable, signal or power behind it. A connector fitting into a receptacle does not prove that the connection is correct or safe.';

/** The core question shown under the lab header (MicSelect coreQ idiom). */
export const CORE_QUESTION = 'What does this connection carry — and is it correct and safe to make?';

export const CABLE_LESSONS: CableLessonDef[] = [
  {
    id: 'l01_what_travels',
    tag: 'LESSON 1',
    title: 'WHAT ARE WE CONNECTING?',
    intro:
      'Before any connector matters, know what has to travel: a whisper-level mic signal, an amplified loudspeaker drive, digital data, network audio, control messages, or electrical power. They are fundamentally different — even when the plugs look alike.',
    unit: 'l01_what_travels',
  },
  {
    id: 'l02_anatomy',
    tag: 'LESSON 2',
    title: 'CABLE & CONNECTOR ANATOMY',
    intro:
      'Plug, jack, pins, shells, latches, strain relief — and inside the jacket: conductors, insulation, shields, twisted pairs, dielectric, fiber. Learn the parts by name, then peel a cable open layer by layer.',
    unit: 'l02_anatomy',
  },
  {
    id: 'l03_analog',
    tag: 'LESSON 3',
    title: 'ANALOG AUDIO CONNECTORS',
    intro:
      'XLR, ¼-inch TS and TRS, 3.5 mm, RCA, and the combo receptacle — what each contact does, what the cable behind it looks like, and what each one can and cannot carry.',
    unit: 'l03_analog',
  },
  {
    id: 'l04_same_plug',
    tag: 'LESSON 4',
    title: 'SAME PLUG, DIFFERENT JOB',
    intro:
      'Two cables can wear identical connectors and still be built for different work. Inspect look-alike pairs, decide whether they are interchangeable, and see the technically honest result of choosing wrong.',
    unit: 'l04_same_plug',
  },
  {
    id: 'l05_loudspeaker',
    tag: 'LESSON 5',
    title: 'LOUDSPEAKER CONNECTIONS',
    intro:
      'Line level into a powered speaker is not amplifier output into a passive one. speakON, binding posts, bananas, bare wire — and why an instrument cable must never stand in for a speaker cable.',
    unit: 'l05_loudspeaker',
  },
  {
    id: 'l06_digital',
    tag: 'LESSON 6',
    title: 'DIGITAL, NETWORKING & CONTROL',
    intro:
      'USB, Ethernet, BNC, TOSLINK, HDMI, MIDI — connectors are not protocols. Two devices with matching ports are not proven compatible until the protocol, the cable class and the direction all agree.',
    unit: 'l06_digital',
  },
  {
    id: 'l07_power',
    tag: 'LESSON 7',
    title: 'POWER CONNECTORS & ELECTRICAL SAFETY',
    intro:
      'Identify power connectors, inspect them, and use them safely. Protective ground is never optional, damaged cords leave service, and mains wiring belongs to qualified people — this lesson draws those lines clearly.',
    unit: 'l07_power',
  },
  {
    id: 'l08_selection',
    tag: 'LESSON 8',
    title: 'SELECTING THE CORRECT CABLE',
    intro:
      'Source, destination, signal type, construction, length, environment, locking — walk real scenarios end to end and choose a cable you can defend. Where several answers work, learn the trade-offs.',
    unit: 'l08_selection',
  },
  {
    id: 'l09_handling',
    tag: 'LESSON 9',
    title: 'HANDLING & INSPECTION',
    intro:
      'Grip the body, release the latch, support the weight, coil over-under, keep power and signal apart, and read a cable’s condition at a glance. Find every fault in the inspection scene.',
    unit: 'l09_handling',
  },
  {
    id: 'l10_tester',
    tag: 'TESTER',
    title: 'VIRTUAL CABLE TESTER',
    intro:
      'Connect a cable to the simulated tester, read the continuity map, and name the fault. Then decide what happens to the cable: return it to service, repair by a qualified person and retest, or remove it from service.',
  },
  {
    id: 'l11_challenge',
    tag: 'CHALLENGE',
    title: 'FINAL SYSTEM CHALLENGE',
    intro:
      'Cable a small live show, then a small recording studio: every source to every destination, signal and power kept separate, network and control connected, power-up in the right order — and the planted faults found.',
  },
  {
    id: 'l12_final',
    tag: 'FINAL CHECK',
    title: 'FINAL KNOWLEDGE CHECK',
    intro:
      'Identification, routing, construction, contact tracing, troubleshooting — and the safety decisions that are never optional. Critical safety questions must each be answered correctly to complete the lab.',
  },
];

/** Required unit set for af_cables — registry-derived, never hard-coded
 *  (house rule). Lessons 1–9 credit on their knowledge-check solve; the
 *  tester, both challenges, every critical-safety question and the final
 *  check are individual units. */
export const CABLE_UNITS: readonly string[] = [
  ...CABLE_LESSONS.filter((l) => l.unit != null).map((l) => l.unit as string),
  TESTER_UNIT,
  CHALLENGE_A_UNIT,
  CHALLENGE_B_UNIT,
  ...SAFETY_UNITS,
  FINAL_UNIT,
];
