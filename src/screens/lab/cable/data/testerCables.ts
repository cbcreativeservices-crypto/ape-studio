/**
 * testerCables — the Virtual Cable Tester bench (Lesson 10, owner spec §5.10).
 * Pure data, zero React.
 *
 * FACT DISCIPLINE (safety-critical lab): every expectedMap below is derived
 * from the VERIFIED pinouts and basicTest text of the connector records —
 * the source record is cited in a comment on each cable. Fault consequences
 * and dispositions use the records' own language; nothing here is authored
 * beyond them.
 *
 * The tester simulates CONTINUITY ONLY. Every test is framed de-energized
 * with the cable disconnected at both ends (the records' basicTest
 * discipline; Fluke continuity guidance in their sourceNotes). No
 * live-voltage measurement is ever simulated (owner spec §5.10).
 *
 * Row-alignment invariant: expectedMap and actualMap have the SAME length and
 * the SAME `path` strings row for row — the tester UI zips them by index and
 * marks a fault wherever the values differ.
 */

/** One labeled row of a continuity map. `value` strings are compared verbatim
 *  between the expected and measured maps: equal = match, different = fault. */
export type TesterMapRow = {
  /** The tested path, exactly as the tester prints it ("Pin 2 → Pin 2"). */
  path: string;
  /** Compact reading: CLOSED / OPEN / PAIRED / SPLIT (two pairs) / STEADY / DROPS ON FLEX. */
  value: string;
};

export type TesterDisposition = 'requalify' | 'relabel' | 'remove' | 'repair_qualified';

export type TesterFaultOption = {
  id: string;
  label: string;
};

export type TesterCable = {
  id: string;
  /** Chip label on the bench ("CABLE A"). */
  chip: string;
  /** Full card title ("Cable A — microphone lead"). */
  label: string;
  /** What is on each end — recognition context only. */
  connectorEnds: string;
  /** The correct continuity map, derived from the record's verified pinout/basicTest. */
  expectedMap: TesterMapRow[];
  /** What the simulated tester measures on THIS cable (the faulty wiring). */
  actualMap: TesterMapRow[];
  /** id of the correct entry in faultOptions. */
  faultId: string;
  /** Exactly 4 choices, correct one included. */
  faultOptions: TesterFaultOption[];
  /** Shown on the correct fault pick — what the map proved. */
  faultExplain: string;
  /** The correct disposition for this cable. */
  disposition: TesterDisposition;
  /** Nudge shown on a wrong disposition pick (retry-until-correct). */
  dispositionHint: string;
  /** Shown when the disposition is solved — the full teaching for this cable. */
  explain: string;
};

/** Required badge copy (owner spec §5.10) — rendered verbatim, never reworded. */
export const SIMULATION_BADGE = 'Simulated tester — a training model, not a live measurement';

/** The bench rule, from the records' basicTest discipline ("with the lead
 *  disconnected at both ends" / "only with the cord unplugged from every
 *  supply and every device"). */
export const DE_ENERGIZED_RULE =
  'Every test on this bench is de-energized: the cable is disconnected from every device and every supply, and both ends plug into the tester alone. A continuity tester never touches a live or connected circuit.';

/** Generic retry nudge for a wrong fault pick. */
export const FAULT_RETRY_HINT =
  'Read the map row by row — every ✕ marks a measured reading that disagrees with the expected one, and the pattern of ✕ rows IS the fault. Try again.';

/** Lesson takeaway (LessonBanner idiom). */
export const L10_LESSON =
  'A cable that fits — even one that passes audio — can still be wired wrong. The continuity map is the proof a connector’s shape can never give: test disconnected at both ends, read every row, and let the result decide whether a cable returns to service, gets repaired and retested, or leaves service for good.';

/** The four dispositions, always offered in this order. */
export const TESTER_DISPOSITIONS: { id: TesterDisposition; label: string }[] = [
  { id: 'requalify', label: 'PASSES — RETURN TO SERVICE' },
  { id: 'relabel', label: 'RELABEL IT AND KEEP USING IT' },
  { id: 'repair_qualified', label: 'REPAIR (QUALIFIED PERSON), THEN RETEST' },
  { id: 'remove', label: 'REMOVE FROM SERVICE' },
];

export function dispositionLabel(id: TesterDisposition): string {
  return TESTER_DISPOSITIONS.find((d) => d.id === id)?.label ?? id;
}

export const TESTER_CABLES: TesterCable[] = [
  // ── Cable A — control case. Source: connectors.analog.ts › xlr3
  // (basicTest: "1→1, 2→2, 3→3 straight through with the shield intact and no
  //  contact bridging").
  {
    id: 'xlr_good',
    chip: 'CABLE A',
    label: 'Cable A — microphone lead',
    connectorEnds: '3-pin XLR female → 3-pin XLR male',
    expectedMap: [
      { path: 'Pin 1 → Pin 1', value: 'CLOSED' },
      { path: 'Pin 2 → Pin 2', value: 'CLOSED' },
      { path: 'Pin 3 → Pin 3', value: 'CLOSED' },
      { path: 'Pin 2 → Pin 3', value: 'OPEN' },
      { path: 'Pin 3 → Pin 2', value: 'OPEN' },
    ],
    actualMap: [
      { path: 'Pin 1 → Pin 1', value: 'CLOSED' },
      { path: 'Pin 2 → Pin 2', value: 'CLOSED' },
      { path: 'Pin 3 → Pin 3', value: 'CLOSED' },
      { path: 'Pin 2 → Pin 3', value: 'OPEN' },
      { path: 'Pin 3 → Pin 2', value: 'OPEN' },
    ],
    faultId: 'no_fault',
    faultOptions: [
      { id: 'pins_swapped', label: 'Pins 2 and 3 reversed' },
      { id: 'no_fault', label: 'No fault — wired straight through' },
      { id: 'pin_open', label: 'One pin open (no continuity)' },
      { id: 'bridged', label: 'Two contacts bridged together' },
    ],
    faultExplain:
      'No fault: 1→1, 2→2, 3→3 straight through, shield intact, no contact bridging — every expected row matched. That is what a pass looks like.',
    disposition: 'requalify',
    dispositionHint: 'Every row matched. What does a full pass earn a cable?',
    explain:
      'A pass is the only thing that returns a cable to service. The connector fitting the receptacle never proved anything — this map is what proof looks like, and this lead goes back in the case as tested and known good.',
  },

  // ── Cable B — pins 2/3 reversed. Source: connectors.analog.ts › xlr3
  // (basicTest: "A cable that passes 2↔3 swapped still carries audio but
  //  inverts polarity — it should be flagged and corrected").
  {
    id: 'xlr_swapped',
    chip: 'CABLE B',
    label: 'Cable B — microphone lead',
    connectorEnds: '3-pin XLR female → 3-pin XLR male',
    expectedMap: [
      { path: 'Pin 1 → Pin 1', value: 'CLOSED' },
      { path: 'Pin 2 → Pin 2', value: 'CLOSED' },
      { path: 'Pin 3 → Pin 3', value: 'CLOSED' },
      { path: 'Pin 2 → Pin 3', value: 'OPEN' },
      { path: 'Pin 3 → Pin 2', value: 'OPEN' },
    ],
    actualMap: [
      { path: 'Pin 1 → Pin 1', value: 'CLOSED' },
      { path: 'Pin 2 → Pin 2', value: 'OPEN' },
      { path: 'Pin 3 → Pin 3', value: 'OPEN' },
      { path: 'Pin 2 → Pin 3', value: 'CLOSED' },
      { path: 'Pin 3 → Pin 2', value: 'CLOSED' },
    ],
    faultId: 'pins_swapped',
    faultOptions: [
      { id: 'pin_open', label: 'One pin open (no continuity)' },
      { id: 'pins_swapped', label: 'Pins 2 and 3 reversed end to end' },
      { id: 'no_fault', label: 'No fault — it carries audio, so it passes' },
      { id: 'shield_open', label: 'Shield (pin 1) open' },
    ],
    faultExplain:
      'Pins 2 and 3 are swapped end to end — the cross paths read closed where the straight paths should. A cable wired 2↔3 still carries audio, and inverts polarity while doing it: a working-sounding cable is not a correct cable.',
    disposition: 'repair_qualified',
    dispositionHint:
      'It works — and it is still wrong. A mis-wired signal lead gets corrected and retested; anything else keeps its fault in circulation.',
    explain:
      'Flag and correct: a qualified person rewires one end straight through, and the lead passes a retest before it returns to service. Relabeling it as-is would keep a polarity-inverting lead circulating as if inversion were a kind of correct — it is a fault, and faults get corrected.',
  },

  // ── Cable C — one pin open. Source: connectors.analog.ts › xlr3
  // (basicTest requires all three pins straight through; a missing path is a
  //  broken conductor or failed joint — inspectionPoints idiom).
  {
    id: 'xlr_open',
    chip: 'CABLE C',
    label: 'Cable C — microphone lead',
    connectorEnds: '3-pin XLR female → 3-pin XLR male',
    expectedMap: [
      { path: 'Pin 1 → Pin 1', value: 'CLOSED' },
      { path: 'Pin 2 → Pin 2', value: 'CLOSED' },
      { path: 'Pin 3 → Pin 3', value: 'CLOSED' },
      { path: 'Pin 2 → Pin 3', value: 'OPEN' },
      { path: 'Pin 3 → Pin 2', value: 'OPEN' },
    ],
    actualMap: [
      { path: 'Pin 1 → Pin 1', value: 'CLOSED' },
      { path: 'Pin 2 → Pin 2', value: 'CLOSED' },
      { path: 'Pin 3 → Pin 3', value: 'OPEN' },
      { path: 'Pin 2 → Pin 3', value: 'OPEN' },
      { path: 'Pin 3 → Pin 2', value: 'OPEN' },
    ],
    faultId: 'pin_open',
    faultOptions: [
      { id: 'pins_swapped', label: 'Pins 2 and 3 reversed' },
      { id: 'bridged', label: 'Two contacts bridged together' },
      { id: 'no_fault', label: 'No fault — wired straight through' },
      { id: 'pin_open', label: 'Pin 3 open — broken conductor or failed joint' },
    ],
    faultExplain:
      'Pin 3 reads open on every path it appears in — a broken conductor or a failed joint at one connector. A pass requires all three pins straight through with the shield intact; a missing path is a hard fail even though the shells mate perfectly.',
    disposition: 'repair_qualified',
    dispositionHint:
      'The shells are fine; one path through the cable is not. Signal-lead faults like this are correctable — and then proven again on the bench.',
    explain:
      'A failed joint or broken conductor in a signal lead is repair work for a qualified person. Repair, then a full retest — every straight path closed, every cross path open — before this lead carries a signal again.',
  },

  // ── Cable D — intermittent under flex. Source: connectors.analog.ts ›
  // ts_quarter (basicTest: "Flex the cable at each plug while watching the
  //  reading — an intermittent drop means a failing joint").
  {
    id: 'ts_intermittent',
    chip: 'CABLE D',
    label: 'Cable D — instrument lead',
    connectorEnds: '1/4-inch TS → 1/4-inch TS',
    expectedMap: [
      { path: 'Tip → Tip', value: 'CLOSED' },
      { path: 'Sleeve → Sleeve', value: 'CLOSED' },
      { path: 'Tip → Sleeve', value: 'OPEN' },
      { path: 'Sleeve, flexed at each plug', value: 'STEADY' },
    ],
    actualMap: [
      { path: 'Tip → Tip', value: 'CLOSED' },
      { path: 'Sleeve → Sleeve', value: 'CLOSED' },
      { path: 'Tip → Sleeve', value: 'OPEN' },
      { path: 'Sleeve, flexed at each plug', value: 'DROPS ON FLEX' },
    ],
    faultId: 'intermittent_joint',
    faultOptions: [
      { id: 'no_fault', label: 'No fault — every static reading is correct' },
      { id: 'tip_sleeve_short', label: 'Tip shorted to sleeve' },
      { id: 'intermittent_joint', label: 'Intermittent sleeve joint — drops under flex' },
      { id: 'tip_open', label: 'Tip conductor open' },
    ],
    faultExplain:
      'Every static reading passes — the fault only appears when the cable is flexed at the plug, where the sleeve path drops out. An intermittent drop under flex means a failing joint: this is exactly why the test includes flexing the cable at each plug while watching the reading.',
    disposition: 'repair_qualified',
    dispositionHint:
      'A failing joint in a signal lead: correct it, then prove it. Leaving it in service just postpones the fault to a worse moment.',
    explain:
      'Repair by a qualified person, then retest — this simple two-contact connector is easy to test and re-solder. Left in service, an intermittent joint becomes the crackle that appears only mid-performance and vanishes on the bench.',
  },

  // ── Cable E — tip/ring crossed. Source: connectors.analog.ts › trs_quarter
  // (basicTest: straight through with no cross-contact continuity; pinouts:
  //  balanced tip = +, ring = −; stereo tip = left, ring = right).
  {
    id: 'trs_crossed',
    chip: 'CABLE E',
    label: 'Cable E — TRS lead (balanced or stereo duty)',
    connectorEnds: '1/4-inch TRS → 1/4-inch TRS',
    expectedMap: [
      { path: 'Tip → Tip', value: 'CLOSED' },
      { path: 'Ring → Ring', value: 'CLOSED' },
      { path: 'Sleeve → Sleeve', value: 'CLOSED' },
      { path: 'Tip → Ring', value: 'OPEN' },
      { path: 'Ring → Tip', value: 'OPEN' },
    ],
    actualMap: [
      { path: 'Tip → Tip', value: 'OPEN' },
      { path: 'Ring → Ring', value: 'OPEN' },
      { path: 'Sleeve → Sleeve', value: 'CLOSED' },
      { path: 'Tip → Ring', value: 'CLOSED' },
      { path: 'Ring → Tip', value: 'CLOSED' },
    ],
    faultId: 'tip_ring_crossed',
    faultOptions: [
      { id: 'sleeve_open', label: 'Sleeve open' },
      { id: 'tip_ring_crossed', label: 'Tip and ring crossed end to end' },
      { id: 'bridged', label: 'Tip bridged to ring (short)' },
      { id: 'no_fault', label: 'No fault — wired straight through' },
    ],
    faultExplain:
      'Tip and ring are crossed end to end — not bridged: the straight paths read open while the cross paths read closed. On a balanced line those contacts are signal + and signal −, so the cross inverts polarity; on stereo wiring they are left and right, so the channels swap. Crossed contacts misroute signal.',
    disposition: 'repair_qualified',
    dispositionHint:
      'The cable stock is healthy; the wiring at one end is not. Think correction, then proof on the bench.',
    explain:
      'Qualified repair and a retest: one end is rewired straight through, and the lead must show every straight path closed and every cross path open before it carries a session again.',
  },

  // ── Cable F — loudspeaker polarity reversed. Source: connectors.speaker.ts ›
  // speakon_nl2 (basicTest: "with the lead disconnected at both ends … 1+→1+
  //  and 1−→1− straight through … a cable that passes with + and − swapped
  //  still makes sound but inverts polarity — thin, weakened low end. Flag and
  //  correct it").
  {
    id: 'spk_swapped',
    chip: 'CABLE F',
    label: 'Cable F — loudspeaker lead',
    connectorEnds: 'speakON-style 2-pole → speakON-style 2-pole',
    expectedMap: [
      { path: '1+ → 1+', value: 'CLOSED' },
      { path: '1− → 1−', value: 'CLOSED' },
      { path: '1+ → 1−', value: 'OPEN' },
      { path: '1− → 1+', value: 'OPEN' },
    ],
    actualMap: [
      { path: '1+ → 1+', value: 'OPEN' },
      { path: '1− → 1−', value: 'OPEN' },
      { path: '1+ → 1−', value: 'CLOSED' },
      { path: '1− → 1+', value: 'CLOSED' },
    ],
    faultId: 'polarity_swapped',
    faultOptions: [
      { id: 'conductor_open', label: 'One conductor open' },
      { id: 'no_fault', label: 'No fault — it will make sound' },
      { id: 'polarity_swapped', label: '+ and − swapped end to end' },
      { id: 'bridged', label: '1+ bridged to 1− (short)' },
    ],
    faultExplain:
      'The + and − conductors are swapped end to end. This lead still makes sound — and inverts polarity: alongside correctly wired loudspeakers the result is thin, weakened low end. Flag and correct it.',
    disposition: 'repair_qualified',
    dispositionHint:
      'A loudspeaker lead that inverts polarity is a fault to correct, not a quirk to keep — and never a reason to relabel.',
    explain:
      'Repair by a qualified person, then retest. And notice the discipline this whole bench runs on: the lead was disconnected at both ends before the tester ever touched it — a continuity tester never belongs on an energized loudspeaker line.',
  },

  // ── Cable G — split pair. Source: connectors.digital.ts › ethernet_8p8c
  // (basicTest: "Simple continuity cannot catch a split pair — the classic
  //  fault that passes a basic test and still fails at speed";
  //  constructionNote: pair integrity is what makes high speeds work).
  {
    id: 'eth_split',
    chip: 'CABLE G',
    label: 'Cable G — network patch lead',
    connectorEnds: '8P8C modular → 8P8C modular (T568B intended, both ends)',
    expectedMap: [
      { path: 'Pin 1 → Pin 1', value: 'CLOSED' },
      { path: 'Pin 2 → Pin 2', value: 'CLOSED' },
      { path: 'Pin 3 → Pin 3', value: 'CLOSED' },
      { path: 'Pin 4 → Pin 4', value: 'CLOSED' },
      { path: 'Pin 5 → Pin 5', value: 'CLOSED' },
      { path: 'Pin 6 → Pin 6', value: 'CLOSED' },
      { path: 'Pin 7 → Pin 7', value: 'CLOSED' },
      { path: 'Pin 8 → Pin 8', value: 'CLOSED' },
      { path: 'Pins 1+2 — one twisted pair', value: 'PAIRED' },
      { path: 'Pins 3+6 — one twisted pair', value: 'PAIRED' },
      { path: 'Pins 4+5 — one twisted pair', value: 'PAIRED' },
      { path: 'Pins 7+8 — one twisted pair', value: 'PAIRED' },
    ],
    actualMap: [
      { path: 'Pin 1 → Pin 1', value: 'CLOSED' },
      { path: 'Pin 2 → Pin 2', value: 'CLOSED' },
      { path: 'Pin 3 → Pin 3', value: 'CLOSED' },
      { path: 'Pin 4 → Pin 4', value: 'CLOSED' },
      { path: 'Pin 5 → Pin 5', value: 'CLOSED' },
      { path: 'Pin 6 → Pin 6', value: 'CLOSED' },
      { path: 'Pin 7 → Pin 7', value: 'CLOSED' },
      { path: 'Pin 8 → Pin 8', value: 'CLOSED' },
      { path: 'Pins 1+2 — one twisted pair', value: 'PAIRED' },
      { path: 'Pins 3+6 — one twisted pair', value: 'SPLIT (two pairs)' },
      { path: 'Pins 4+5 — one twisted pair', value: 'SPLIT (two pairs)' },
      { path: 'Pins 7+8 — one twisted pair', value: 'PAIRED' },
    ],
    faultId: 'split_pair',
    faultOptions: [
      { id: 'no_fault', label: 'No fault — every pin maps straight through' },
      { id: 'crossover', label: 'Crossed wiring — T568A on one end, T568B on the other' },
      { id: 'split_pair', label: 'Split pairs — pin map right, pairing wrong' },
      { id: 'conductor_open', label: 'An open conductor' },
    ],
    faultExplain:
      'Every pin lands on the right pin, so simple continuity passes completely — but the circuits on pins 3+6 and 4+5 are riding wires from two different twisted pairs. Pair twisting is what rejects interference, so a split pair passes a basic test and still fails at speed: a reliability failure, not a broken wire.',
    disposition: 'repair_qualified',
    dispositionHint:
      'The copper is fine — the termination is not. What fixes a termination, and what must the retest check besides the pin map?',
    explain:
      'Re-termination is the repair — field termination is skill-sensitive work — and the retest must pass BOTH the pin map and the pairing. Relabeling it for lighter duty would just keep a defective termination in circulation.',
  },

  // ── Cable H — open protective earth. Source: connectors.power.ts ›
  // iec_c13_c14 (basicTest: "Only with the cord unplugged from everything:
  //  continuity end-to-end per conductor … "; cautions: "a cord with a broken
  //  earth conductor is not a working cord, even though the equipment powers
  //  up"; commonMistakes: "damaged mains cords leave service immediately";
  //  advantages: "a damaged cord is replaced whole, never repaired inline")
  //  + mains_wall blade roles (narrow = line, wide = neutral, round = earth).
  {
    id: 'iec_earth_open',
    chip: 'CABLE H',
    label: 'Cable H — detachable power cord',
    connectorEnds: 'NEMA 5-15 wall plug → IEC C13',
    expectedMap: [
      { path: 'Narrow blade → L (line)', value: 'CLOSED' },
      { path: 'Wide blade → N (neutral)', value: 'CLOSED' },
      { path: 'Round pin → E (earth)', value: 'CLOSED' },
      { path: 'L ↔ N', value: 'OPEN' },
      { path: 'L ↔ E', value: 'OPEN' },
      { path: 'N ↔ E', value: 'OPEN' },
    ],
    actualMap: [
      { path: 'Narrow blade → L (line)', value: 'CLOSED' },
      { path: 'Wide blade → N (neutral)', value: 'CLOSED' },
      { path: 'Round pin → E (earth)', value: 'OPEN' },
      { path: 'L ↔ N', value: 'OPEN' },
      { path: 'L ↔ E', value: 'OPEN' },
      { path: 'N ↔ E', value: 'OPEN' },
    ],
    faultId: 'earth_open',
    faultOptions: [
      { id: 'ln_swapped', label: 'Line and neutral reversed' },
      { id: 'earth_open', label: 'Protective earth conductor open' },
      { id: 'bridge', label: 'Two conductors bridged together' },
      { id: 'no_fault', label: 'No fault — the equipment powers up' },
    ],
    faultExplain:
      'Line and neutral read perfectly — this cord will power the equipment and everything will appear to work. But the protective earth path is open, and the earth conductor is part of the equipment’s fault protection: a cord with a broken earth conductor is not a working cord, even though the equipment powers up.',
    disposition: 'remove',
    dispositionHint:
      'It powers the equipment — and it is still not a working cord. A mains cord with a failed safety conductor is never taped, adapted, or “watched.”',
    explain:
      'Remove from service. Damaged mains cords leave service immediately: a detachable cordset is replaced whole, never repaired inline, and never taped over. Mains cord wiring is qualified-person work in every case — and for this cordset the answer is replacement, not rescue.',
  },
];
