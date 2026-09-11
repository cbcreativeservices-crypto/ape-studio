/**
 * Station 3 — Same connector, different job. The lab's most important
 * interactive section (owner brief 2026-09-11).
 *
 * Each entry lists the JOBS a connector family can and cannot do. Every
 * `can: true` claim is backed by the verified ConnectorRecord (its
 * `carried` types and pinout applications) — a test cross-checks each
 * claim against the registry so this file can never drift from the
 * verified facts. `can: false` rows are the tempting wrong answers, each
 * with its own misconception-targeting correction.
 */
import type { ConnectorId, CarriedType } from '../../cable/cableTypes';

export type JobRow = {
  id: string;
  label: string;
  can: boolean;
  /** For can:true — the CarriedType(s) in the verified record that back this
   *  job (the consistency test asserts they are all present on the record). */
  backs?: CarriedType[];
  /** VISIBLE escape hatch for a can:true claim whose backing is adjacent to
   *  (not literally listed in) the record's carried types — must cite where
   *  in the verified record the support lives. The validator requires
   *  either `backs` (checked against carried) or a non-empty `basis`;
   *  silent fudges are impossible (cognition-pass round 1). */
  basis?: string;
  explain: string;
};

export type JobMatrixEntry = {
  connector: ConnectorId;
  /** Sibling records this entry ALSO speaks for (a family entry like
   *  "3.5 mm TRS / TRRS" or "RJ45 / etherCON") — the consistency test
   *  validates `backs` against the union of all listed records. */
  alsoFrom?: ConnectorId[];
  title: string;
  /** One-line reminder rendered above the job list. */
  headline: string;
  jobs: JobRow[];
};

export const JOB_MATRIX: readonly JobMatrixEntry[] = [
  {
    connector: 'xlr3',
    title: '3-pin XLR',
    headline: 'The most famous “microphone connector” — that carries far more than microphones.',
    jobs: [
      { id: 'mic', label: 'Balanced microphone signal', can: true, backs: ['mic_level'], explain: 'The classic job: two signal legs plus shield, mic level.' },
      { id: 'line', label: 'Balanced line-level signal', can: true, backs: ['line_level'], explain: 'Console outputs, processor I/O, powered-speaker inputs — same pins, hotter signal.' },
      { id: 'aes3', label: 'AES3 digital audio', can: true, backs: ['digital_audio'], explain: 'Same shell, digital data — specified for 110-ohm digital cable, not mic cable.' },
      { id: 'intercom', label: 'Intercom and specialized systems', can: true, basis: 'xlr3 record, limitations: "The same 3-pin shell serves several different jobs (analog audio, AES3 digital, some control uses)"', explain: 'Wired intercom and other specialized systems also ride XLR shells — one more reason to read the label, not the plug.' },
      { id: 'speaker', label: 'Amplifier speaker output', can: false, explain: 'No. Speaker level belongs on speaker connectors and speaker cable. XLR loudspeaker use is not a job this lab’s systems ever ask of it.' },
    ],
  },
  {
    connector: 'trs_quarter',
    title: '1/4-inch TRS',
    headline: 'Three contacts, three completely different jobs — and “stereo” is only one of them.',
    jobs: [
      { id: 'balmono', label: 'Balanced MONO line signal', can: true, backs: ['line_level'], explain: 'Tip +, ring −, sleeve shield. One channel, noise-rejecting.' },
      { id: 'phones', label: 'Stereo headphones', can: true, backs: ['headphone_level'], explain: 'Tip left, ring right, sleeve common. Two channels, unbalanced.' },
      { id: 'insert', label: 'Console insert send/return', can: true, backs: ['line_level'], explain: 'Send on one contact, return on the other — one jack, two directions. Which is which is equipment-defined: verify.' },
      { id: 'balstereo', label: 'Balanced stereo on one plug', can: false, explain: 'No. Three contacts cannot carry two balanced channels — balanced stereo needs two balanced connections.' },
    ],
  },
  {
    connector: 'trs_35',
    alsoFrom: ['trrs_35'],
    title: '3.5 mm TRS / TRRS',
    headline: 'The consumer mini-jack family — stereo, headset, sometimes balanced, never guaranteed.',
    jobs: [
      { id: 'phones', label: 'Headphones / earbuds', can: true, backs: ['headphone_level'], explain: 'The everyday job: tip left, ring right, sleeve common.' },
      { id: 'stereo', label: 'Stereo line (aux) connection', can: true, backs: ['line_level'], explain: 'Same wiring as headphones at line level — phone or laptop into a mixer’s media input.' },
      { id: 'headsetmic', label: 'Headset microphone (TRRS)', can: true, backs: ['mic_level'], explain: 'The fourth contact adds a mic path — in TWO competing contact orders (CTIA and OMTP), so a headset can be incompatible with a jack it fits.' },
      { id: 'control', label: 'Specialized control uses', can: true, basis: 'trs_35 record, commonMistakes: "equipment that uses 3.5 mm jacks for balanced or non-obvious purposes" (equipment-defined)', explain: 'Some compact gear uses mini-jacks for balanced mono or control duty — equipment-defined; the manual decides.' },
      { id: 'speaker', label: 'Passive speaker connection', can: false, explain: 'No. Amplifier power does not belong on a mini-jack or its fine-gauge cable.' },
      { id: 'balstereo', label: 'Balanced stereo through one mini plug', can: false, explain: 'No. Even the four-contact TRRS cannot carry two balanced channels — balanced stereo needs two balanced connections.' },
    ],
  },
  {
    connector: 'rca',
    title: 'RCA (phono)',
    headline: 'One shell, three different electrical worlds — line, phono, and digital.',
    jobs: [
      { id: 'line', label: 'Unbalanced analog line', can: true, backs: ['line_level'], explain: 'The consumer standard — one channel per plug, red right, white left.' },
      { id: 'phono', label: 'Phono-level (turntable) signal', can: true, basis: 'rca record, typicalSources: turntables (phono level, RIAA — phono stage required)', explain: 'Millivolts with RIAA equalization — it needs a phono stage, and line level into a phono input is grossly loud. Same plugs, very different level.' },
      { id: 'spdif', label: 'Coaxial S/PDIF digital audio', can: true, backs: ['digital_audio'], explain: 'Same shell, digital job — specified for genuine 75-ohm coaxial cable.' },
      { id: 'balanced', label: 'Balanced connection', can: false, explain: 'No. Two contacts cannot make a balanced pair plus shield — RCA is unbalanced by construction.' },
      { id: 'phantom', label: 'Phantom power to a microphone', can: false, explain: 'No. Phantom rides a balanced XLR connection — an RCA has neither the pins nor the balanced pair to carry it.' },
    ],
  },
  {
    connector: 'bnc',
    title: 'BNC',
    headline: 'The bayonet coax connector — what changes between its jobs is the SYSTEM, never the two contacts.',
    jobs: [
      { id: 'wordclock', label: 'Word clock (sample-rate sync)', can: true, backs: ['clock_sync'], explain: 'The studio job you will meet first: one device’s clock distributed so converters agree.' },
      { id: 'digital', label: 'Digital audio (AES3id and similar)', can: true, backs: ['digital_audio'], explain: 'Unbalanced 75-ohm digital audio also rides BNC.' },
      { id: 'rf_video', label: 'RF and video applications', can: true, basis: 'bnc record, pinouts: "Coaxial signal (all uses — the two contacts never change, the system does)" — video/RF are system applications of the same coax interface', explain: 'The same connector serves video and RF worlds — cable impedance must match the system’s specification.' },
      { id: 'analogmic', label: 'Balanced microphone signal', can: false, explain: 'No. BNC is an unbalanced coaxial connector — a balanced mic pair is a different construction entirely.' },
    ],
  },
  {
    connector: 'ethernet_8p8c',
    alsoFrom: ['ethercon_style'],
    title: 'RJ45 / etherCON',
    headline: 'Four twisted pairs — Ethernet, audio networks, and proprietary systems that only LOOK like Ethernet.',
    jobs: [
      { id: 'ethernet', label: 'Ethernet networking', can: true, backs: ['network_audio', 'control_data'], explain: 'The native job: standard network traffic over category cable.' },
      { id: 'netaudio', label: 'Networked audio (Dante-style systems)', can: true, backs: ['network_audio'], explain: 'Audio-over-IP rides real Ethernet — many channels down one category cable.' },
      { id: 'proprietary', label: 'Proprietary digital snakes', can: true, backs: ['network_audio'], explain: 'Some digital snakes use the same connector but are NOT Ethernet — plugging them into a network switch does nothing useful. The connector fitting proves nothing.' },
      { id: 'analog', label: 'Analog microphone signal', can: false, explain: 'No. An 8P8C jack on a stagebox is a data port. An analog mic needs an analog input — the fact that neither will fit the other is the system protecting you.' },
    ],
  },
  {
    connector: 'usb_c',
    title: 'USB-C',
    headline: 'One connector; data, audio, power and sometimes video — capabilities vary by device AND cable.',
    jobs: [
      { id: 'audio', label: 'Audio data (interfaces, USB audio)', can: true, backs: ['digital_audio'], explain: 'Audio streams as USB data — the computer and interface negotiate the protocol.' },
      { id: 'data', label: 'General data', can: true, backs: ['control_data'], explain: 'Files, control, MIDI-over-USB — all data jobs share the connector.' },
      { id: 'power', label: 'Power delivery', can: true, backs: ['dc_power'], explain: 'The same connector negotiates power — and how much depends on BOTH devices and the cable’s own rating.' },
      { id: 'identical', label: 'Every USB-C cable does all of this', can: false, explain: 'No. Cables differ in data rate, power rating and video support while looking identical — the central lesson wearing its newest shell.' },
    ],
  },
  {
    connector: 'hdmi',
    title: 'HDMI',
    headline: 'Audio/video transport — and on ARC/eARC ports, audio coming BACK the other way.',
    jobs: [
      { id: 'av', label: 'Audio + video to a display', can: true, backs: ['digital_audio'], explain: 'The main job: multichannel audio travels with the picture.' },
      { id: 'arc', label: 'Audio Return Channel (ARC / eARC)', can: true, backs: ['digital_audio'], explain: 'On ARC/eARC-equipped ports, the TV sends its audio BACK down the same cable to a receiver or soundbar — port capability, marked on the jack.' },
      { id: 'anyport', label: 'ARC works on every HDMI port', can: false, explain: 'No. Only ports marked ARC or eARC support the return path — the connector is identical, the capability is not.' },
    ],
  },
];

/** Station 3's rule, printed above the matrix. */
export const MATRIX_RULE =
  'Before any of these connections is called compatible, you must know THREE things the plug cannot tell you: what the equipment expects, what the cable is built as, and which job this particular connection is doing.';
