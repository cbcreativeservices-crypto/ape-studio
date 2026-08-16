/**
 * cableTypes — the data model behind the Cable & Connector Fundamentals Lab
 * (owner spec 2026-08-15; plan of record docs/APE_CABLE_LAB_PLAN_2026_08_15.md).
 *
 * SAFETY-CRITICAL CONTENT AREA (owner mandate 2026-08-15): every pinout,
 * rating, interchangeability, hot-connection and safety claim carried by these
 * types MUST be verified against authoritative sources before it ships
 * (AES / IEC / Neutrik / USB-IF / HDMI LA / TIA-568 / MIDI Assn / OSHA).
 * Facts that vary by equipment are marked `equipment-dependent`, never
 * presented as universal. Nothing in this model may be guessed.
 *
 * House conventions honored (audit 2026-08-15): pure .ts, zero React imports;
 * `type` aliases, not interfaces; content arrays typed `Type[]` (no `as const`);
 * one source of truth per fact — the virtual tester derives its continuity maps
 * from `contacts`/`pinoutVariants`, never a re-keyed copy.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Connector identity

/** Every connector taught or recognized in the lab. Adding an id forces a
 *  drawing (Record<ConnectorId, …> art registry) and a data record. */
export type ConnectorId =
  // Core analog audio
  | 'xlr3'
  | 'ts_quarter'
  | 'trs_quarter'
  | 'trs_35'
  | 'trrs_35'
  | 'rca'
  | 'combo_xlr_trs'
  // Core loudspeaker
  | 'speakon_nl2'
  | 'speakon_nl4'
  | 'binding_post'
  | 'banana'
  | 'bare_wire'
  | 'ts_speaker_legacy'
  // Core digital / network / control
  | 'usb_a'
  | 'usb_b'
  | 'usb_micro_b'
  | 'usb_c'
  | 'ethernet_8p8c'
  | 'ethercon_style'
  | 'bnc'
  | 'toslink'
  | 'hdmi'
  | 'midi_din5'
  // Core power
  | 'mains_wall' // regional wall plug/receptacle — NEMA 5-15 is the NA variant
  | 'iec_c13_c14'
  | 'iec_c19_c20'
  | 'iec_c5_c6'
  | 'iec_c7_c8'
  | 'powercon_xx'
  | 'powercon_true1'
  | 'dc_barrel'
  | 'usb_c_power' // power-delivery application of the USB-C connector
  | 'poe' // power-and-data application of the 8P8C/Ethernet connection
  // Recognition tier (identify + purpose only)
  | 'tt_bantam'
  | 'quarter_patch'
  | 'db25'
  | 'edac'
  | 'lk_veam'
  | 'euroblock'
  | 'mini_xlr'
  | 'xlr4'
  | 'xlr5'
  | 'speakon_nl8'
  | 'opticalcon_style'
  // Qualified-person power (recognition ONLY — hard boundary, never beginner handling)
  | 'nema_twist_lock'
  | 'stage_pin'
  | 'cam_type'
  | 'socapex_style';

/** Broad family a connector card is grouped under in lessons. */
export type ConnectorCategory =
  | 'analog_audio'
  | 'loudspeaker'
  | 'digital_data'
  | 'network'
  | 'optical'
  | 'video_av'
  | 'control'
  | 'power_mains'
  | 'power_dc'
  | 'patch_multipin';

/** Instructional depth (owner spec §6):
 *  - core: full beginner instruction and assessment.
 *  - recognition: identify + purpose; no detailed pin mastery assessed.
 *  - qualified-person: recognition plus an explicit boundary — beginners never
 *    handle, wire or mate these; a qualified person does. */
export type LearningTier = 'core' | 'recognition' | 'qualified-person';

// ─────────────────────────────────────────────────────────────────────────────
// What a connection carries (Lesson 1 categories, owner spec §5.1)

export type CarriedType =
  | 'mic_level'
  | 'instrument_level'
  | 'line_level'
  | 'headphone_level'
  | 'speaker_level'
  | 'digital_audio'
  | 'network_audio'
  | 'clock_sync'
  | 'control_data'
  | 'dc_power'
  | 'ac_mains'
  | 'hybrid_power_data';

// ─────────────────────────────────────────────────────────────────────────────
// Contacts & pinouts

/** One contact/pin/terminal on a connector. `ink` keys into connectorInks —
 *  diagram colors are UI semantics, ALWAYS paired with the text label (never
 *  color-alone, and never the amplitude ramp — governance R2). */
export type PinDef = {
  /** Pin number or contact name as printed/spoken ("1", "Tip", "L", "E"). */
  label: string;
  /** What this contact does in the pinout variant it belongs to. */
  role: string;
  /** connectorInks key for diagram rendering. */
  ink: string;
  /** Optional clarifying note (kept short; verified or equipment-dependent). */
  note?: string;
};

/** How confident/universal a pinout assignment is. `equipment-dependent`
 *  assignments are TAUGHT as "check the documentation" — never as fact. */
export type PinoutConfidence = 'standard' | 'convention' | 'equipment-dependent';

/** One complete contact assignment for one application of the connector
 *  (e.g. TRS balanced-mono vs TRS unbalanced-stereo vs TRS insert). */
export type PinoutVariant = {
  id: string;
  /** Application name shown on the card ("Balanced mono", "Insert send/return"). */
  application: string;
  carried: CarriedType[];
  contacts: PinDef[];
  confidence: PinoutConfidence;
  /** Required when confidence is not 'standard': what governs the real answer. */
  verifyAgainst?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Cable construction (Lesson 2 cross-sections, owner spec §5.2)

export type CableSectionId =
  | 'balanced_shielded' // shielded twisted pair
  | 'instrument_unbalanced' // single conductor + shield
  | 'speaker_2c' // two heavier unshielded conductors
  | 'ac_3c_grounded' // line + neutral + protective earth
  | 'ethernet_4pair' // four twisted pairs
  | 'coax' // center conductor + dielectric + shield
  | 'optical_fiber'; // core + cladding + buffer/jacket

// ─────────────────────────────────────────────────────────────────────────────
// Safety & handling

/** How serious mis-handling of this connector can get. Drives CautionBadge
 *  placement — never dramatized beyond the verified consequence. */
export type SafetyLevel = 'signal' | 'speaker' | 'low_voltage_power' | 'mains';

/** Whether making/breaking the connection with the system operating is
 *  normally acceptable. NEVER claim universal hot-plug capability where it is
 *  model- or rating-specific — that nuance lives in `rationale`. */
export type HotPlugPolicy = {
  policy: 'normally_fine' | 'mute_first' | 'de_energize_first' | 'qualified_person_only';
  rationale: string;
};

export type Locking = {
  method: 'none' | 'friction' | 'latch' | 'twist_lock' | 'bayonet' | 'screw' | 'push_pull';
  /** How to CONFIRM it is locked (owner spec: speakON insert-and-twist check). */
  howToConfirm?: string;
};

/** A "do not confuse with" pairing and its proportionate consequence. */
export type ConfusionRisk = {
  otherId?: ConnectorId;
  otherName: string;
  why: string;
  /** Technically proportionate outcome — no signal / noise / unreliable /
   *  equipment risk / personal danger (owner spec §5.4: no dramatizing). */
  consequence: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// The connector record (owner spec §6 field set → house shape)

export type ConnectorRecord = {
  id: ConnectorId;
  displayName: string;
  aliases: string[];
  category: ConnectorCategory;
  tier: LearningTier;
  /** Regional availability/localization hook (mains connectors). Absent =
   *  worldwide. The data structure is region-ready; NA content ships first. */
  region?: string;
  carried: CarriedType[];
  typicalSources: string[];
  typicalDestinations: string[];
  /** Primary construction of the cable conventionally behind this connector —
   *  taught with the explicit rule that the connector does NOT define the
   *  cable (owner spec §5.2). */
  construction?: CableSectionId;
  constructionNote?: string;
  pinouts: PinoutVariant[];
  balanced: 'balanced' | 'unbalanced' | 'either' | 'n/a';
  channels: 'mono' | 'stereo' | 'multi' | 'varies' | 'n/a';
  locking: Locking;
  /** Direction/keying notes (MIDI IN/OUT/THRU, USB host/device, active HDMI). */
  directionality?: string;
  hotPlug: HotPlugPolicy;
  advantages: string[];
  limitations: string[];
  commonMistakes: string[];
  notInterchangeableWith: ConfusionRisk[];
  inspectionPoints: string[];
  /** What a basic (de-energized, continuity-style) test shows on this
   *  connector. No live-voltage measurement is ever simulated (owner spec §5.10). */
  basicTest: string;
  safety: {
    level: SafetyLevel;
    qualifiedPersonOnly?: boolean;
    cautions: string[];
  };
  /** Glossary term display names VERIFIED to exist in the live glossary table
   *  before shipping (frozen backend — read-only verification). */
  glossary: string[];
  relatedLessons: CableLessonId[];
  /** Citations from the fact-verification pass (B2) — authoritative source
   *  notes per claim group. Not rendered; audit trail. */
  sourceNotes: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Lessons

export type CableLessonId =
  | 'l01_what_travels'
  | 'l02_anatomy'
  | 'l03_analog'
  | 'l04_same_plug'
  | 'l05_loudspeaker'
  | 'l06_digital'
  | 'l07_power'
  | 'l08_selection'
  | 'l09_handling'
  | 'l10_tester'
  | 'l11_challenge'
  | 'l12_final';

export type CableLessonDef = {
  id: CableLessonId;
  /** Step eyebrow tag (LESSON n / TESTER / CHALLENGE / FINAL CHECK). */
  tag: string;
  title: string;
  intro: string;
  /** Completion unit cleared when this lesson's knowledge check is SOLVED
   *  (not merely viewed — §1.7 honesty for a gated lab). Lessons whose credit
   *  comes from richer interactions (tester/challenges/final) omit this and
   *  use the dedicated unit ids below. */
  unit?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Completion units (af_cables — R6c; owner ruling 2026-08-15: FULL certificate
// credit at launch, 12th audio_fundamentals lab, owner-run seed SQL)

/** Virtual Cable Tester passed (all faults identified). */
export const TESTER_UNIT = 'tester_pass';
/** Final System Challenge A (small live show) passed. */
export const CHALLENGE_A_UNIT = 'challenge_a';
/** Final System Challenge B (small recording studio) passed. */
export const CHALLENGE_B_UNIT = 'challenge_b';
/** Final knowledge check: all non-critical items solved. */
export const FINAL_UNIT = 'final_pass';

/** Critical electrical-safety questions — each is its OWN persisted unit, so
 *  the lab is structurally incapable of completing until every one has been
 *  answered correctly (owner spec §5.12 required-correct mandate). */
export const SAFETY_UNITS: readonly string[] = [
  'q_safety_ground_lift', // defeating protective ground / ground-lift adapters
  'q_safety_damaged_cord', // damaged power cables leave service
  'q_safety_m2m_mains', // male-to-male mains cables are never acceptable
  'q_safety_wet', // wet/energized handling
  'q_safety_mains_mating', // incorrect mains connector mating
  'q_safety_unqualified_wiring', // mains wiring is qualified-person work
  'q_safety_speakon_mains', // loudspeaker vs mains connectors never conflated
];
