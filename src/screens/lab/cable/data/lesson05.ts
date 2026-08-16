/**
 * lesson05 data — "Loudspeaker Connections" (owner spec §5.5).
 * Pure data, zero React. EVERY factual claim below is derived verbatim-
 * faithfully from the verified connector records:
 *   connectors.speaker.ts (speakon_nl2, speakon_nl4, binding_post, banana,
 *   bare_wire, ts_speaker_legacy), connectors.analog.ts (xlr3, ts_quarter),
 *   connectors.power.ts (mains_wall, iec_c13_c14, powercon_xx,
 *   powercon_true1) — no new connector facts are authored here.
 */
import type { ConnectorId } from '../cableTypes';

// ─────────────────────────────────────────────────────────────────────────────
// (a) The four different connections around loudspeakers

export type SpeakerConnection = {
  id: string;
  title: string;
  /** What travels through this connection. */
  travels: string;
  /** Which connector families serve it (record typicalSources/Destinations). */
  servedBy: string;
  /** Misconception-correcting detail, record-derived. */
  detail: string;
};

export const FOUR_CONNECTIONS: SpeakerConnection[] = [
  {
    id: 'line_to_powered',
    title: 'LINE-LEVEL OUT → POWERED LOUDSPEAKER',
    travels: 'Line-level audio — the mixer’s working level. The cabinet amplifies inside, after its input.',
    // xlr3.typicalDestinations: 'Powered loudspeaker inputs';
    // speakon_nl2.commonMistakes: 'a line-level feed to a POWERED loudspeaker (typically XLR)'.
    servedBy: 'Typically XLR — powered loudspeaker inputs are a standard balanced-line destination.',
    // speakon_nl2.limitations: 'Carries amplifier output only — it is not how a
    // line-level feed reaches a powered loudspeaker.'
    detail:
      'This is a signal connection, not a loudspeaker-cable connection. A speakON-style lead carries amplifier output only — it is not how a line-level feed reaches a powered loudspeaker.',
  },
  {
    id: 'amp_to_passive',
    title: 'AMPLIFIER OUT → PASSIVE LOUDSPEAKER',
    travels: 'Loudspeaker-level audio — a power amplifier’s output, with real current behind it.',
    // typicalSources/Destinations across all six speaker records.
    servedBy: 'speakON-style 2-pole and 4-pole · binding posts · banana plugs · bare wire · legacy 1/4-inch TS.',
    // speakon_nl2.commonMistakes, quote-faithful.
    detail:
      'A passive cabinet has no amplifier of its own. An amplifier output driven into a line-level input risks damaging that input; a line-level signal into a passive loudspeaker produces almost nothing.',
  },
  {
    id: 'speaker_cable',
    title: 'THE LOUDSPEAKER CABLE ITSELF',
    travels: 'The amplifier’s output current, between the amplifier and the cabinet.',
    // speakon_nl2/nl4 constructionNote ('two-conductor or four-conductor').
    servedBy: 'Two or more heavier unshielded conductors, sized for the current, the run length and the load.',
    // speakon_nl2.constructionNote, quote-faithful.
    detail:
      'Not shielded small-conductor instrument or microphone cable. The connector does not enforce this: a speakON-style shell can be wrongly fitted to the wrong cable, so the cable itself must be verified, not assumed from the plug.',
  },
  {
    id: 'powered_ac',
    title: 'POWERED LOUDSPEAKER → AC MAINS',
    travels: 'AC mains power — wall power. It runs the cabinet, and it is dangerous to handle carelessly.',
    // mains_wall / iec_c13_c14 / powercon_xx / powercon_true1
    // typicalDestinations all list powered loudspeakers.
    servedBy:
      'A regional wall plug feeding a detachable cordset into the cabinet’s power inlet — IEC C13/C14, or a locking powerCON-family / TRUE1 inlet.',
    // speakon safety caution + notInterchangeableWith consequence, quote-faithful.
    detail:
      'Signal input and power input are SEPARATE connections on a powered loudspeaker. A speakON-style connector carries loudspeaker output only — it is never an AC mains connector; the twist-lock resemblance to power connectors is a look-alike, not an equivalence, and no adapter between them is ever acceptable.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// (b) Connector-card browser — the six verified speaker records

export type SpeakerConnectorChip = {
  id: ConnectorId;
  /** Short chip label; the full displayName renders on the ConnectorCard. */
  chip: string;
};

export const SPEAKER_CONNECTORS: SpeakerConnectorChip[] = [
  { id: 'speakon_nl2', chip: 'SPEAKON-STYLE 2-POLE' },
  { id: 'speakon_nl4', chip: 'SPEAKON-STYLE 4-POLE' },
  { id: 'binding_post', chip: 'BINDING POST' },
  { id: 'banana', chip: 'BANANA PLUG' },
  { id: 'bare_wire', chip: 'BARE WIRE' },
  { id: 'ts_speaker_legacy', chip: 'LEGACY 1/4-INCH TS' },
];

// ─────────────────────────────────────────────────────────────────────────────
// (c) Instrument cable vs loudspeaker cable — all cells from the ts_quarter
//     and ts_speaker_legacy records (constructionNote, notInterchangeableWith,
//     basicTest).

export type CompareRow = {
  label: string;
  instrument: string;
  speaker: string;
};

export const CABLE_COMPARE_ROWS: CompareRow[] = [
  {
    label: 'THE PLUG',
    instrument: '1/4-inch TS',
    speaker: 'The physically identical 1/4-inch TS',
  },
  {
    label: 'INSIDE THE JACKET',
    instrument: 'One small-gauge conductor inside a shield',
    speaker: 'Two heavier unshielded conductors',
  },
  {
    label: 'BUILT TO MOVE',
    instrument: 'A tiny high-impedance instrument signal, quietly',
    speaker: 'Amplifier current to a passive cabinet',
  },
  {
    label: 'ON THE WRONG JOB',
    instrument:
      'On a loudspeaker run it loses power in its small conductor and can heat at higher power — a reliability problem that can become cable failure and put the amplifier at risk.',
    speaker: 'On an instrument it has no shield, so it collects hum and buzz — noise, not damage.',
  },
];

/** ts_speaker_legacy.basicTest / ts_quarter.basicTest, quote-faithful. */
export const CABLE_COMPARE_NOTE =
  'A continuity test cannot tell instrument cable from loudspeaker cable — read the jacket printing or inspect the construction at a connector.';

// ─────────────────────────────────────────────────────────────────────────────
// (d) Routing picks — the lesson's knowledge check (unit gate)

export type RoutingOption = {
  id: string;
  label: string;
};

export type RoutingScenario = {
  id: string;
  from: string;
  to: string;
  options: RoutingOption[];
  correct: string;
  /** Alternatives accepted as also-defensible (tri-state verdict). */
  accept?: string[];
  /** Shown on a correct pick — record-derived. */
  explain: string;
  /** Shown on an accepted pick (falls back to explain). */
  acceptExplain?: string;
  /** Shown on a wrong pick — retry stays open. */
  wrongHint: string;
};

export const ROUTING_SCENARIOS: RoutingScenario[] = [
  {
    id: 'mixer_powered',
    from: 'Mixer',
    to: 'Powered loudspeaker',
    options: [
      { id: 'line_xlr', label: 'LINE LEVEL — balanced cable (typically XLR)' },
      { id: 'spk_lead', label: 'SPEAKER LEVEL — speakON-style loudspeaker lead' },
      { id: 'inst_cable', label: 'INSTRUMENT — shielded 1/4-inch instrument cable' },
      { id: 'mains_cord', label: 'AC MAINS — mains cordset' },
    ],
    correct: 'line_xlr',
    // speakon_nl2.commonMistakes + limitations; xlr3.typicalDestinations.
    explain:
      'A powered loudspeaker amplifies inside the cabinet, so its signal input takes line-level audio — typically on XLR. A speakON-style lead carries amplifier output only; it is not how a line-level feed reaches a powered loudspeaker. The cabinet’s power arrives separately, on its own mains connection.',
    wrongHint:
      'The amplifier is INSIDE this cabinet. Think about what its SIGNAL input needs — its power arrives on a different connection entirely.',
  },
  {
    id: 'mixer_amp',
    from: 'Mixer',
    to: 'Power amplifier',
    options: [
      { id: 'line_bal', label: 'LINE LEVEL — balanced cable into the amplifier input' },
      { id: 'spk_lead', label: 'SPEAKER LEVEL — speakON-style loudspeaker lead' },
      { id: 'bare_pair', label: 'SPEAKER LEVEL — bare-wire pair into binding posts' },
      { id: 'mains_cord', label: 'AC MAINS — mains cordset' },
    ],
    correct: 'line_bal',
    // xlr3.typicalDestinations ('Amplifier and processor inputs');
    // speakon_nl2.commonMistakes (amp output into line input risks damage).
    explain:
      'Amplifier inputs are line-level destinations: the mixer feeds the amplifier at line level, and the amplifier raises it to loudspeaker level at its OUTPUT terminals. Sent the wrong way, an amplifier output driven into a line-level input risks damaging that input.',
    wrongHint:
      'Loudspeaker level is what LEAVES this device — what arrives at its input is still the mixer’s working level.',
  },
  {
    id: 'amp_passive',
    from: 'Power amplifier',
    to: 'Passive loudspeaker (full-range)',
    options: [
      { id: 'nl2_lead', label: 'SPEAKER LEVEL — loudspeaker cable, 2-pole speakON-style' },
      { id: 'nl4_full', label: 'SPEAKER LEVEL — 4-pole speakON-style lead, full-range on circuit 1' },
      { id: 'inst_cable', label: 'INSTRUMENT — shielded 1/4-inch instrument cable' },
      { id: 'line_xlr', label: 'LINE LEVEL — balanced XLR cable' },
    ],
    correct: 'nl2_lead',
    accept: ['nl4_full'],
    // speakon_nl2: pinout roles, hotPlug rationale ('NOT FOR INTERRUPTING
    // CURRENT'), locking.howToConfirm — quote-faithful.
    explain:
      'Amplifier output travels over loudspeaker cable — heavier unshielded conductors — with amplifier + on 1+ and − on 1−. Mute or power down before connecting or disconnecting: no speakON-style connector is rated to break a driven load. Then insert fully, twist clockwise until it stops with a positive click, and confirm the lock — a firm tug should not pull it straight out — in the same muted or powered-down state you connected it in.',
    // speakon_nl4 full_range_1ch pinout + speakon_nl2.notInterchangeableWith
    // (2-pole mates with 4-pole chassis, circuit 1 only).
    acceptExplain:
      'Also correct in the field: a 4-pole lead serves a full-range cabinet on circuit 1 (1+/1−), and 2-pole cable connectors even mate with 4-pole chassis connectors, engaging circuit 1 only. The same rules hold: mute or power down first — no speakON-style connector is rated to break a driven load — then insert, twist to the positive click, and confirm the lock with a firm tug while the line is still muted or powered down.',
    wrongHint:
      'A passive cabinet needs the amplifier’s output, over cable built for that current — two heavier unshielded conductors, not a shielded signal cable.',
  },
  {
    id: 'amp_biamp',
    from: 'Power amplifier (two channels)',
    to: 'Bi-amplified passive loudspeaker',
    options: [
      { id: 'nl4_biamp', label: 'SPEAKER LEVEL — 4-pole speakON-style lead, both circuits wired' },
      { id: 'nl2_lead', label: 'SPEAKER LEVEL — 2-pole speakON-style lead' },
      { id: 'two_xlr', label: 'LINE LEVEL — two balanced XLR cables' },
      { id: 'two_inst', label: 'INSTRUMENT — two shielded instrument cables' },
    ],
    correct: 'nl4_biamp',
    // speakon_nl4 biamp_2ch pinout (equipment-dependent) + verifyAgainst,
    // and speakon_nl2.notInterchangeableWith consequence — quote-faithful.
    explain:
      'A bi-amplified cabinet takes two amplifier channels in one 4-pole lead: circuit 1 on 1+/1−, circuit 2 on 2+/2−. Which section sits on which circuit is a design decision that varies by model and system — assignments beyond 1+/1− are equipment-dependent and must be read from the loudspeaker documentation, never assumed. A 2-pole lead engages circuit 1 only: in bi-amp mode that feeds one driver section directly, with no crossover in the way, and a full-range feed onto a high-frequency section can damage it.',
    wrongHint:
      'Two amplifier channels must reach this cabinet down one lead. Count the circuits the lead has to carry — a 2-pole connector carries exactly one.',
  },
  {
    id: 'powered_ac',
    from: 'Powered loudspeaker',
    to: 'AC mains',
    options: [
      { id: 'mains_cord', label: 'AC MAINS — the cabinet’s mains cordset, matched to its inlet' },
      { id: 'spk_lead', label: 'SPEAKER LEVEL — speakON-style loudspeaker lead' },
      { id: 'adapter', label: 'AC MAINS — an adapter from a speakON-style lead to the power inlet' },
      { id: 'line_xlr', label: 'LINE LEVEL — balanced XLR cable' },
    ],
    correct: 'mains_cord',
    // iec_c13_c14 / powercon records (de-energize first) + speakon safety
    // caution and adapter consequence — quote-faithful.
    explain:
      'The cabinet’s power is its own separate mains connection — a cordset matched to its inlet (IEC C13/C14 or a locking powerCON-family inlet), connected de-energized. A speakON-style connector carries loudspeaker output only: it is never an AC mains connector, and no adapter between loudspeaker and mains connections is ever acceptable.',
    wrongHint:
      'This is the POWER side of the cabinet. Signal and power are two separate connections on a powered loudspeaker — and loudspeaker connectors never carry mains.',
  },
];

/** Lesson takeaway (LessonBanner idiom). */
export const L05_LESSON =
  'Line level into a powered cabinet, amplifier output into a passive one, the loudspeaker cable that carries it, and the mains that powers the cabinet are four different connections. The connector never enforces the cable behind it — verify what travels, confirm the lock de-energized, and never let loudspeaker and mains connectors trade jobs.';
