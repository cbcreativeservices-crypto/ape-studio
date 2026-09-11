/**
 * Station 6 — the simulated cable tester (pure model; the UI renders lamps
 * from this file's answers and never re-keys the truth).
 *
 * Model: a cable under test has N contacts on end A and N on end B. A
 * fault defines the actual internal wiring as a set of A→B links plus
 * optional cross-contact shorts. The tester lights a lamp for the pair of
 * test points you select:
 *   'lit'     — continuous path between the selected A and B contacts
 *   'dark'    — no path
 *   'flicker' — path exists only while the cable is NOT being flexed
 *               (intermittent strain-relief failure, revealed by wiggling)
 *
 * The teaching limits are honest and test-pinned: a continuity tester
 * CANNOT tell instrument cable from speaker cable (both pass), cannot see
 * an impedance specification, and shows a not-fully-seated connector as
 * dead air. Those limits come from the verified ConnectorRecords'
 * `basicTest` claims (ts_quarter, rca).
 */

export type LampState = 'lit' | 'dark' | 'flicker';

export type TestedCableKind = 'xlr' | 'trs' | 'rca_pair';

/** Contact labels per cable kind, index-aligned A↔B. */
export const CABLE_CONTACTS: Record<TestedCableKind, readonly string[]> = {
  xlr: ['1 (shield)', '2 (hot +)', '3 (cold −)'],
  trs: ['Tip', 'Ring', 'Sleeve'],
  rca_pair: ['L center', 'L shell', 'R center', 'R shell'],
};

/** Short display labels for narrow tester columns (design pass: the full
 *  names overflow a 360 pt three-column layout). The full names stay as the
 *  accessibility labels and in the contact key line above the rig. */
export const CABLE_CONTACTS_SHORT: Record<TestedCableKind, readonly string[]> = {
  xlr: ['1', '2', '3'],
  trs: ['T', 'R', 'S'],
  rca_pair: ['L·C', 'L·S', 'R·C', 'R·S'],
};

export type FaultId =
  | 'open_hot'
  | 'short_tip_ring'
  | 'shield_open'
  | 'pins_23_reversed'
  | 'lr_reversed'
  | 'intermittent'
  | 'bent_pin'
  | 'wrong_type'
  | 'not_seated';

export type FaultCase = {
  id: FaultId;
  kind: TestedCableKind;
  /** Bench label for the cable as handed to the learner. */
  handed: string;
  /** links[aIndex] = bIndex reached, or null for no path. */
  links: (number | null)[];
  /** Extra always-connected pairs WITHIN the mapping (shorts): [aIdx,bIdx
   *  through the short]. Modeled as additional A→B paths. */
  shorts?: [number, number][];
  /** Intermittent: listed links drop while wiggling. */
  flickerLinks?: number[];
  /** All links read dark until the RESEAT action is taken. */
  needsReseat?: boolean;
  /** What LOOKING at the connector shows (the INSPECT action). */
  inspect: string;
  /** Diagnosis options (shuffled by the UI); index of the right one. */
  options: string[];
  correct: number;
  explain: string;
};

/** The nine fault cases from the owner brief, in queue order. Two of them
 *  deliberately PASS a resting continuity test (wrong_type, intermittent at
 *  rest) — the tester's limits are part of the curriculum. */
export const FAULTS: readonly FaultCase[] = [
  {
    id: 'open_hot',
    kind: 'xlr',
    handed: 'XLR cable pulled from the dead-vocal channel',
    links: [0, null, 2],
    inspect: 'Both connectors look clean. Nothing visibly wrong.',
    options: ['Open conductor on pin 2', 'Shield disconnected', 'Pins 2 and 3 reversed', 'The cable is fine'],
    correct: 0,
    explain: 'Pin 2 never arrives: the hot conductor is broken somewhere inside. 1→1 and 3→3 pass, 2→2 stays dark — a classic open conductor.',
  },
  {
    id: 'short_tip_ring',
    kind: 'trs',
    handed: 'TRS cable from the crackling monitor send',
    links: [0, 1, 2],
    shorts: [
      [0, 1],
      [1, 0],
    ],
    inspect: 'The plug’s insulator ring near the tip looks scorched and slightly deformed.',
    options: ['Short between tip and ring', 'Open conductor on the ring', 'Sleeve disconnected', 'Left and right reversed'],
    correct: 0,
    explain: 'Tip reaches BOTH tip and ring on the far end — two contacts that should never touch are joined. On a balanced line that shorts + to −, collapsing the signal.',
  },
  {
    id: 'shield_open',
    kind: 'xlr',
    handed: 'XLR cable from the channel that hums when you touch the mic',
    links: [null, 1, 2],
    inspect: 'The boot slides back too easily — the shield braid has pulled away from the pin-1 solder cup.',
    options: ['Shield (pin 1) disconnected', 'Open conductor on pin 3', 'Pins 2 and 3 reversed', 'The cable is fine'],
    correct: 0,
    explain: 'Signal pins pass but pin 1 is dark: the shield is open. Audio often still passes — with the interference protection gone. Hum that changes when you touch things is the giveaway.',
  },
  {
    id: 'pins_23_reversed',
    kind: 'xlr',
    handed: 'Home-soldered XLR cable from the borrowed-gear bin',
    links: [0, 2, 1],
    inspect: 'Tidy soldering. Nothing looks wrong from outside.',
    options: ['Pins 2 and 3 reversed (polarity flip)', 'Open conductor on pin 2', 'Short between pins 2 and 3', 'The cable is fine'],
    correct: 0,
    explain: 'Every conductor arrives — crossed: 2→3 and 3→2 light while the straight pairs 2→2 and 3→3 go dark. The cable still carries audio, inverted. Paired with a correct cable on the other mic, the two signals partially cancel.',
  },
  {
    id: 'lr_reversed',
    kind: 'rca_pair',
    handed: 'RCA stereo pair where the mix sounds mirror-imaged',
    links: [2, 3, 0, 1],
    inspect: 'Someone re-terminated one end — the red and white plugs are swapped relative to the other end.',
    options: ['Left and right channels reversed', 'Open conductor on the left channel', 'Short between left and right', 'The pair is fine'],
    correct: 0,
    explain: 'Straight-through tests all read dark — as if BOTH channels were dead. Only cross-channel tests reveal the truth: L center arrives at R center. Both channels pass perfectly, into each other’s positions — electrically healthy, musically mirrored.',
  },
  {
    id: 'intermittent',
    kind: 'trs',
    handed: 'Headphone extension that “sometimes cuts out”',
    links: [0, 1, 2],
    flickerLinks: [0],
    inspect: 'The jacket is kinked hard right at the strain relief, and the relief spins loosely.',
    options: ['Intermittent break at the strain relief', 'Open conductor on the tip', 'Short between ring and sleeve', 'The cable is fine'],
    correct: 0,
    explain: 'Every path passes — until you flex the cable at the relief and the tip path flickers. Intermittents hide from a resting test: always wiggle while watching.',
  },
  {
    id: 'bent_pin',
    kind: 'xlr',
    handed: 'XLR cable that killed the channel the moment it was plugged in',
    links: [0, null, 2],
    inspect: 'INSPECTION FINDS IT: pin 2 is bent flat against the insert and pushed back — it never reaches its mating contact.',
    options: ['Bent / recessed contact', 'Open conductor inside the cable', 'Shield disconnected', 'Pins 2 and 3 reversed'],
    correct: 0,
    explain: 'The tester says “open on 2” — same reading as a broken conductor. Only INSPECTION tells them apart, and this one is a ten-second fix versus a re-soldering job. Look before you cut.',
  },
  {
    id: 'wrong_type',
    kind: 'trs',
    handed: '1/4-inch cable grabbed for the amp-to-cabinet run',
    // TS plugs in a TRS test fixture: the plug's single long sleeve spans
    // BOTH the ring and sleeve positions, so ring and sleeve read joined —
    // the physically honest reading for a TS cable (cognition pass).
    links: [0, 1, 2],
    shorts: [
      [1, 2],
      [2, 1],
    ],
    inspect: 'The jacket printing reads “INSTRUMENT CABLE — 1 × 24 AWG shielded”. This is not speaker cable. (Ring and sleeve read joined at both ends — that is the TS plug’s one long sleeve spanning both positions, not a fault.)',
    options: ['Wrong cable TYPE despite correct connectors', 'Open conductor', 'Short between tip and ring', 'The cable is fine for the job'],
    correct: 0,
    explain: 'Every straight path lights — the tester passes it completely. A continuity test cannot tell instrument cable from speaker cable; only the jacket and construction can. On amplifier duty this cable heats and fails.',
  },
  {
    id: 'not_seated',
    kind: 'xlr',
    handed: 'Cable from the dead stage drop — tested straight off the stand',
    links: [0, 1, 2],
    needsReseat: true,
    inspect: 'The connector is resting in the tester HALF-INSERTED — the latch never clicked.',
    options: ['Connector not fully inserted / locked', 'Open conductor on every pin', 'Shield disconnected', 'The cable is dead — bin it'],
    correct: 0,
    explain: 'Everything reads dead — then you seat the connector until the latch clicks and every path passes. The most common “bad cable” is a connection nobody pushed home. Check seating before blaming copper.',
  },
];

/** Lamp truth for one selected pair of test points. */
export function lampFor(fault: FaultCase, aIdx: number, bIdx: number, wiggling: boolean, reseated: boolean): LampState {
  if (fault.needsReseat && !reseated) return 'dark';
  const linked = fault.links[aIdx] === bIdx || (fault.shorts ?? []).some(([a, b]) => a === aIdx && b === bIdx);
  if (!linked) return 'dark';
  if (fault.flickerLinks?.includes(aIdx)) return wiggling ? 'flicker' : 'lit';
  return 'lit';
}

/** Straight-through expectation for the kind — what a healthy cable shows. */
export function expectedLink(kind: TestedCableKind, aIdx: number): number {
  return aIdx; // every tested kind is nominally straight through, index-aligned
}
