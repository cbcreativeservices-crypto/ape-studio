/**
 * Audio Connectors & Cable Selection Lab — the lab's connector roster
 * (owner brief 2026-09-11: first-release scope, 20 connector families).
 *
 * HONESTY ARCHITECTURE: this lab AUTHORS NO CONNECTOR FACTS. Every card
 * renders from the Cable & Connector Fundamentals Lab's VERIFIED
 * ConnectorRecords (B2 fact-verification protocol, docs/
 * APE_CABLE_LAB_VERIFICATION_2026_08_15.md) via getConnector(), and every
 * photo comes from the same verified connectorImages map. This file only
 * SELECTS and GROUPS — a test pins that every roster id resolves to a
 * verified record AND a live image.
 *
 * Advanced families (TT/bantam, DB25, Euroblock, mini-XLR, multipin,
 * opticalCON, MADI) are deliberately excluded — reserved for the Advanced
 * Connectors expansion per the brief. Power connectors are excluded as
 * SUBJECTS on purpose: the brief's rule is "keep power connectors visually
 * and conceptually separate from audio connectors" (they stay in the
 * Cable & Connector Fundamentals Lab).
 */
import type { ConnectorId } from '../../cable/cableTypes';

export type BenchGroupId = 'analog' | 'speaker' | 'digital';

export type BenchGroup = {
  id: BenchGroupId;
  title: string;
  blurb: string;
  ids: readonly ConnectorId[];
};

/** Station 2 bench — three family pages. speakON NL2/NL4 are presented as
 *  one family with both records reachable (the brief's "two-pole/four-pole
 *  family"). MIDI rides with digital/data, flagged NOT-audio on its card. */
export const BENCH_GROUPS: readonly BenchGroup[] = [
  {
    id: 'analog',
    title: 'Core analog connectors',
    blurb: 'The everyday analog plugs — and the reason their shape alone never tells you the signal.',
    ids: ['xlr3', 'ts_quarter', 'trs_quarter', 'trs_35', 'trrs_35', 'rca', 'combo_xlr_trs'],
  },
  {
    id: 'speaker',
    title: 'Loudspeaker connections',
    blurb: 'Amplifier power moves through these — different rules, different cable, different consequences.',
    ids: ['speakon_nl2', 'speakon_nl4', 'binding_post', 'banana', 'bare_wire', 'ts_speaker_legacy'],
  },
  {
    id: 'digital',
    title: 'Digital, data & MIDI',
    blurb: 'Protocol connections: the plug fitting proves nothing about what the two devices can say to each other.',
    ids: ['usb_a', 'usb_b', 'usb_c', 'toslink', 'hdmi', 'ethernet_8p8c', 'ethercon_style', 'bnc', 'midi_din5'],
  },
];

/** Every connector this lab teaches, in bench order. */
export const ROSTER: readonly ConnectorId[] = BENCH_GROUPS.flatMap((g) => [...g.ids]);

/** Connectors whose card carries an extra headline flag (rendered as a
 *  prominent banner, not buried in prose). */
export const CARD_FLAGS: Partial<Record<ConnectorId, string>> = {
  midi_din5: 'MIDI DATA — NOT AUDIO. A MIDI cable carries musical instructions (which note, how hard, which knob), never recorded sound.',
  hdmi: 'ARC / eARC: on equipped ports, HDMI can also RETURN audio from a TV back down the same cable — a port capability, not a cable guarantee.',
  usb_c: 'Capabilities vary by device AND by cable. Two USB-C cables can look identical and support different data rates, power levels and video modes.',
};

/** The four questions (Station 1 — asked before every connection, forever). */
export const FOUR_QUESTIONS: readonly { q: string; why: string }[] = [
  { q: '1 · Does it physically fit?', why: 'Fit is the FIRST test, not the last. Passing it proves geometry, nothing else.' },
  { q: '2 · What signal or protocol does the equipment expect?', why: 'The equipment on each end defines the job. Read the panel and the manual — not the plug.' },
  { q: '3 · Is the cable construction correct?', why: 'What is inside the jacket must match the job: shielded pair, speaker gauge, 75-ohm coax, category pair, fiber.' },
  { q: '4 · Is the connection safe?', why: 'Levels, phantom power, amplifier outputs, mains — some wrong connections just fail; a few damage equipment.' },
];

/** The lab's central lesson (owner brief, verbatim) — repeated on purpose. */
export const CENTRAL_LESSON =
  'A connector’s shape does not determine the signal, cable construction, level, or protocol.';

/** Exploded-cable parts (Station 1). Neutral anatomy — no per-connector
 *  claims; each blurb states what the part IS, matching the Fundamentals
 *  lab's verified anatomy lesson vocabulary. */
export type CablePart = {
  id: string;
  name: string;
  blurb: string;
};

export const CABLE_PARTS: readonly CablePart[] = [
  { id: 'plug', name: 'Cable connector (plug)', blurb: 'The hardware on the cable end. It mates with the equipment — and it is the ONLY part of this list people usually look at.' },
  { id: 'jack', name: 'Equipment jack (receptacle)', blurb: 'The mating half mounted on the equipment. The equipment behind it — not the jack shape — defines what the connection expects.' },
  { id: 'contacts', name: 'Contacts / pins', blurb: 'The metal points where signal actually crosses. Their count and assignment differ by application — the same three contacts can serve three different jobs.' },
  { id: 'conductors', name: 'Signal conductors', blurb: 'The wires that carry the signal itself. How many there are, and their gauge, is the cable construction question.' },
  { id: 'shield', name: 'Shield', blurb: 'A conductive screen around the signal conductors that drains interference. Speaker and optical cables manage without one — for different reasons.' },
  { id: 'insulation', name: 'Insulation', blurb: 'The dielectric separating each conductor from its neighbours. Damaged insulation is how shorts start.' },
  { id: 'jacket', name: 'Outer jacket', blurb: 'The cable’s skin. Its printing is where the construction is declared — read it instead of guessing from the plug.' },
  { id: 'relief', name: 'Strain relief', blurb: 'The transition that spreads bending stress where cable meets connector. The most common failure point on any cable.' },
];
