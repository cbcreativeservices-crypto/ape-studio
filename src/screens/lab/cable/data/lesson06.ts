/**
 * lesson06 data — "Digital, Networking & Control" (owner spec §5.6).
 * Pure data, zero React (type-only import from foundations/bits is erased at
 * compile time).
 *
 * SOURCE DISCIPLINE (safety-critical lab): every factual claim below is
 * DERIVED from the verified records in connectors.digital.ts — the concept
 * strips are condensed, near-verbatim restatements of record fields
 * (constructionNote / directionality / limitations / commonMistakes /
 * safety.cautions / basicTest / hotPlug.rationale). No new facts are authored
 * here; anything the records do not contain stays out.
 */
import type { ConnectorId } from '../cableTypes';
import type { ConnectorInk } from '../connectorInks';
import type { CheckSpec } from '../../foundations/bits';

// ─────────────────────────────────────────────────────────────────────────────
// (a) Lead banner — connector ≠ protocol (owner spec §5.6 lead, ratified copy)

export const L06_LEAD =
  'Two devices with matching ports are not proven compatible. The connector, the cable class, the protocol and the direction must ALL agree.';

// ─────────────────────────────────────────────────────────────────────────────
// (b) Card browser groups — the 10 core digital/network/control records,
// grouped exactly per the owner spec chips.

export type L06GroupId = 'usb' | 'network' | 'coax_optical' | 'av_control';

export type L06Group = {
  id: L06GroupId;
  label: string;
  connectors: { id: ConnectorId; chip: string }[];
};

export const L06_GROUPS: L06Group[] = [
  {
    id: 'usb',
    label: 'USB',
    connectors: [
      { id: 'usb_a', chip: 'USB-A' },
      { id: 'usb_b', chip: 'USB-B' },
      { id: 'usb_micro_b', chip: 'USB MICRO-B' },
      { id: 'usb_c', chip: 'USB-C' },
    ],
  },
  {
    id: 'network',
    label: 'NETWORK',
    connectors: [
      { id: 'ethernet_8p8c', chip: 'ETHERNET 8P8C' },
      { id: 'ethercon_style', chip: 'ETHERCON-STYLE' },
    ],
  },
  {
    id: 'coax_optical',
    label: 'COAX & OPTICAL',
    connectors: [
      { id: 'bnc', chip: 'BNC' },
      { id: 'toslink', chip: 'TOSLINK' },
    ],
  },
  {
    id: 'av_control',
    label: 'AV & CONTROL',
    connectors: [
      { id: 'hdmi', chip: 'HDMI' },
      { id: 'midi_din5', chip: 'MIDI DIN-5' },
    ],
  },
];

/** Every ink the ten digital records use — rendered once as the InkLegend. */
export const L06_INKS: ConnectorInk[] = [
  'dataA',
  'dataB',
  'clock',
  'dcPos',
  'dcNeg',
  'signalPos',
  'shield',
  'optical',
  'insulator',
];

// ─────────────────────────────────────────────────────────────────────────────
// (c) Concept strips — short DetailCards condensed from the verified records.
// Attribution per strip is noted in comments (record → fields).

export type L06Strip = {
  id: string;
  title: string;
  paras: string[];
};

export const L06_STRIPS: L06Strip[] = [
  {
    // usb_a limitations/directionality; usb_b/usb_micro_b directionality;
    // usb_c constructionNote/directionality.
    id: 'usb_concept',
    title: 'USB — THE PLUG DOES NOT DEFINE THE CABLE',
    paras: [
      'The plug shape does not identify the USB generation, speed, or cable capability — a charge-only cable fits exactly like a data cable, and the generation a link actually runs at is negotiated by the ports, the cable, and the devices together.',
      'Roles are physical on the A and B shapes: Type-A marks the HOST end of a link (computer or hub); B and Micro-B mark the PERIPHERAL end. On USB-C, host/device and power source/sink roles are negotiated electronically instead of being fixed by connector gender.',
      'USB-C is where this matters most: behind identical oval plugs, one cable may hold only the USB 2.0 pair and power conductors while another carries a full set of high-speed pairs and an electronic marker for higher current. Two identical-looking USB-C cables can differ in data speed, power rating, and alternate-mode support. The cable is a component with its own specification — check it, don’t assume it.',
    ],
  },
  {
    // ethernet_8p8c pinout note (T568A/B), commonMistakes (mixed ends),
    // limitations (protocol ≠ connector), safety.cautions (PoE, near-verbatim).
    id: 'ethernet_concept',
    title: 'ETHERNET — ONE PLUG, MANY SYSTEMS',
    paras: [
      'T568A and T568B are BOTH valid termination schemes. What matters is that both ends of a cable follow the same one: mixing ends builds a crossover cable, which modern auto-sensing equipment may tolerate but which is a mislabeled, inconsistent termination that will confuse later troubleshooting.',
      'The connector proves NOTHING about the protocol: networked-audio systems (such as Dante or AVB), digital snake protocols (such as AES50), and plain office networking all use the same plug. Matching ports do not mean compatible equipment — the system behind the port decides, so identify ports from labels and documentation, not shape.',
      'Power over Ethernet can place tens of watts of DC power on the same cable as the data (up to roughly 90 W under IEEE 802.3bt). Standards-based PoE energizes only after detecting a compatible device — but that detection step belongs only to standards-based (IEEE 802.3af/at/bt) equipment. “Passive” PoE injectors — still widely sold — put their full voltage on the pairs permanently with no detection and can damage non-PoE devices (or a cable tester) connected to an energized run. Identify what feeds a run before patching it.',
    ],
  },
  {
    // ethercon_style constructionNote/limitations/locking.howToConfirm.
    id: 'ethercon_concept',
    title: 'ETHERCON-STYLE — ARMOR, NOT A NEW STANDARD',
    paras: [
      'Electrically this IS an Ethernet connection: the same four twisted pairs and the same termination standards inside a locking shell. The shell adds mechanical protection — it adds nothing electrical, and it does not change speed, protocol, or compatibility.',
      'Confirm the lock: push in until the shell latch clicks, then pull back gently — a locked connector will not release without pressing the latch. And the protocol caution still applies: a locking shell on both ends does not prove the two devices speak the same system.',
    ],
  },
  {
    // bnc limitations/notInterchangeableWith (50 vs 75 ohm), basicTest,
    // hotPlug.rationale (mute-first), commonMistakes (read the panel label).
    id: 'bnc_concept',
    title: 'BNC — TWO CONTACTS, MANY SYSTEMS',
    paras: [
      '50-ohm and 75-ohm cable and connector families look nearly identical and mate physically — the impedance difference is invisible from outside, and a continuity tester cannot measure it. A mismatch causes reflections: on long runs or marginal equipment that means clocking instability or signal-integrity problems, not equipment damage. Match the impedance the system specifies, identified from the jacket printing and the datasheet.',
      'Word clock is electrically safe to re-patch live — but MUTE MONITORING FIRST: every device slaved to the clock will unlock and re-lock, producing clicks, dropouts, or brief mutes. Re-patch clock lines between takes, never mid-take. And read the panel label before patching: a BNC port may be word clock, video, sync, or something else entirely.',
    ],
  },
  {
    // toslink limitations/notInterchangeableWith (S/PDIF vs ADAT),
    // constructionNote/inspectionPoints (bends, end-faces, dust caps),
    // basicTest + safety.cautions (fiber-safe check, near-verbatim).
    id: 'toslink_concept',
    title: 'TOSLINK — LIGHT, NOT ELECTRICITY',
    paras: [
      'The port does not identify the protocol: optical S/PDIF (stereo) and ADAT (multichannel) use the same connector and fiber but are different, incompatible formats — both devices must be set to the same one. Most equipment mutes on an unrecognized format, but some instead outputs noise; keep monitor levels down until both ends match.',
      'There is no electrical conductor in the cable — that is why it is immune to hum, interference, and ground loops, and why kinks, tight bends, and dirty or scratched end-faces can degrade or kill the signal. Keep dust caps on unused ports and stored cables, and respect the bend radius.',
      'The basic field check, done the fiber-safe way: with the far end connected to a powered source, point the free end at your palm or a white surface and look for the dim red glow, viewing from an angle — never bring a fiber end toward your eye. TOSLINK is low-power LED light, but the same check performed on other fiber systems would aim invisible laser light at your eye; the technique, like the no-staring habit, must not distinguish.',
    ],
  },
  {
    // hdmi directionality/limitations/notInterchangeableWith.
    id: 'hdmi_concept',
    title: 'HDMI — DIRECTION RULES',
    paras: [
      'ARC/eARC reverses AUDIO back down the cable — but only between ports specifically labeled ARC or eARC on both devices. Plugging into any handy display input and expecting audio return is the classic mistake.',
      'Many ACTIVE long-reach cables are directional: their ends are marked source/display, and a reversed active cable passes nothing at all — no image, no sound, no damage. Check the end markings before diagnosing dead equipment.',
    ],
  },
  {
    // midi_din5 constructionNote/directionality/limitations/safety.cautions.
    id: 'midi_concept',
    title: 'MIDI — INSTRUCTIONS, NOT AUDIO',
    paras: [
      'No sound ever travels down a MIDI cable. It carries instructions — which note, how hard, which knob moved — and the receiving instrument turns them into sound through its own audio outputs.',
      'Direction is strict: data flows from an OUT (or THRU) port into an IN port — OUT→IN, always. THRU retransmits a copy of what arrived at IN for daisy-chaining, and two-way communication takes two cables. OUT-to-OUT or IN-to-IN does nothing — and harms nothing.',
      'A 5-pin DIN connector does not automatically mean MIDI: the same shell served older audio interconnects, sync systems, and accessory ports on vintage equipment — some carrying voltage on pins MIDI leaves unused. Identify an unlabeled port from the manual before patching it.',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge check (unit gate) — 4 questions, all derived from record facts.
// All four solved → markLabUnit('af_cables', 'l06_digital').

export const L06_CHECKS: CheckSpec[] = [
  {
    question: 'Two devices have matching ports and the cable clicks home at both ends. Is the connection proven to work?',
    options: [
      'Yes — matching connectors mean matching systems',
      'No — the connector, the cable class, the protocol and the direction must all agree',
      'Yes, as long as the cable itself is undamaged',
      'Only if both devices are professional equipment',
    ],
    correctIdx: 1,
    reveal:
      'Fitting is not proof. The same plug serves unrelated systems — Dante and office networking, ADAT and optical S/PDIF, Thunderbolt and basic USB — so the protocol, the cable’s capability and the direction must all agree before the link works.',
    wrongHint: 'Think of Dante vs office networking, or ADAT vs S/PDIF — same plug, different systems.',
  },
  {
    question: 'Two USB-C cables look identical from the outside. What can you safely conclude?',
    options: [
      'They have identical capabilities — USB-C is standardized',
      'Nothing — they can differ in data speed, power rating and alternate-mode support',
      'The thicker one is always the full-featured one',
      'If both can charge a phone, both will also carry data',
    ],
    correctIdx: 1,
    reveal:
      'Behind identical oval plugs, one cable may hold only the USB 2.0 pair and power conductors while another carries a full set of high-speed pairs and an electronic marker for higher current. The cable is a component with its own specification — check it, don’t assume it.',
    wrongHint: 'Charge-only and USB 2.0-only C-to-C cables are common — and they look exactly like full-featured ones.',
  },
  {
    question: 'A network cable is terminated T568A on one end and T568B on the other. What is true?',
    options: [
      'T568B is the standard; T568A terminations are defective',
      'Both schemes are valid, so any combination of ends is correct',
      'Both schemes are valid — but both ends of one cable must follow the same scheme',
      'T568A is reserved for audio networks',
    ],
    correctIdx: 2,
    reveal:
      'T568A and T568B are equally valid. Mixing them on one cable builds a crossover — modern auto-sensing equipment may tolerate it, but it is a mislabeled, inconsistent termination that will confuse later troubleshooting.',
    wrongHint: 'Neither scheme is “the wrong one.” The problem is consistency between the two ends.',
  },
  {
    question: 'What travels down a MIDI cable?',
    options: [
      'The instrument’s audio, in digital form',
      'Audio and control data together',
      'Control instructions only — which note, how hard, which knob moved',
      'Nothing until audio software opens the port',
    ],
    correctIdx: 2,
    reveal:
      'MIDI carries no audio — ever. It is a one-way loop of instructions flowing OUT→IN; the receiving instrument makes the sound through its own audio outputs.',
    wrongHint: 'Connect a MIDI OUT toward an amplifier and you get silence — what does that say about the cable’s contents?',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Lesson takeaway — restates the family's central principle
// (connectors.digital.ts header) in banner form.

export const L06_LESSON =
  'In the digital world a matching plug proves almost nothing: the connector does not define the protocol, the cable’s capability, or the power on the line. Identify ports from labels and documentation — fitting is not proof of correctness.';
