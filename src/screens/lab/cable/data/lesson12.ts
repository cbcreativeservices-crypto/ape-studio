/**
 * lesson12 data — "Final Knowledge Check" (owner spec §5.12).
 * Two question banks rendered with the foundations CheckQuestion primitive:
 *   • FINAL_QUESTIONS (general, 10) — ONE completion unit (FINAL_UNIT,
 *     cableTypes.ts) marked only when ALL ten are solved.
 *   • SAFETY_QUESTIONS (critical safety, 7) — EACH marks its OWN persisted
 *     unit from SAFETY_UNITS (cableTypes.ts) on solve, so af_cables is
 *     structurally incapable of completing until every safety question has
 *     been answered correctly (owner required-correct mandate; CheckQuestion
 *     is retry-until-correct by design).
 *
 * Pure data, zero React. SAFETY-CRITICAL CONTENT AREA: every question and
 * reveal below is derived from the VERIFIED connector records
 * (data/connectors.*.ts) — the source record id is noted per question; no new
 * factual claims are authored in this file.
 */

/** One CheckQuestion-shaped item (structurally compatible with the
 *  foundations CheckSpec — kept local so this file stays pure data). */
export type FinalCheckItem = {
  id: string;
  question: string;
  options: string[];
  correctIdx: number;
  /** Shown after the correct answer — the teaching moment. */
  reveal: string;
  /** Gentle nudge after a wrong pick (stays until solved). */
  wrongHint?: string;
};

/** A critical-safety item: also names the af_cables completion unit it clears
 *  on solve. Unit ids mirror SAFETY_UNITS in cableTypes.ts EXACTLY, in the
 *  same order. */
export type SafetyCheckItem = FinalCheckItem & {
  unit: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// BANK 1 — GENERAL (10). All solved → FINAL_UNIT.

export const FINAL_QUESTIONS: FinalCheckItem[] = [
  // 1 · visual ID by description — from bnc (locking method + howToConfirm).
  {
    id: 'q_id_bayonet',
    question:
      'A connector goes on with a push, then a quarter turn of its locking collar until the bayonet pins seat in their slots. Which connector is this?',
    options: ['3-pin XLR', 'speakON-style 4-pole', 'BNC', 'RCA (phono)'],
    correctIdx: 2,
    reveal:
      'That is the BNC bayonet: push, quarter-twist, positive stop — and a gentle pull-back confirms it, because a seated BNC does not come off without twisting. speakON-style connectors also twist, but it is the whole body that turns to a click; the quarter-turn bayonet collar is the BNC signature.',
    wrongHint: 'Only one of these locks with a quarter-turn BAYONET collar.',
  },
  // 2 · source→destination routing — from speakon_nl2 (commonMistakes: powered
  //     vs passive) + lesson01 mixer_powered pair.
  {
    id: 'q_route_powered_speaker',
    question: 'A mixer output feeds a POWERED loudspeaker. Which connection carries that feed?',
    options: [
      'A speakON-style loudspeaker cable from a power amplifier',
      'A balanced line-level cable — typically XLR',
      'An instrument cable, since the plugs fit',
      'No signal cable — the mains cord carries the audio too',
    ],
    correctIdx: 1,
    reveal:
      'A powered loudspeaker amplifies INSIDE the cabinet, so the mixer sends it a line-level feed — typically XLR. Its power arrives separately, on a mains cable: two connections, two different things traveling. An amplifier output into a PASSIVE loudspeaker is a different connection, and the two are not interchangeable.',
    wrongHint: 'The amplifier is INSIDE a powered loudspeaker — what level must reach it?',
  },
  // 3 · internal construction — from ts_quarter / ts_speaker_legacy
  //     constructionNote (instrument vs speaker cable construction).
  {
    id: 'q_construction_speaker_cable',
    question: 'Inside the jacket of a proper loudspeaker cable you would find:',
    options: [
      'A shielded twisted pair with an overall screen',
      'One small-gauge conductor inside a shield',
      'A light-carrying fiber inside cladding',
      'Two heavier unshielded conductors sized for amplifier current',
    ],
    correctIdx: 3,
    reveal:
      'Loudspeaker cable is two heavier unshielded conductors sized for the current, the run length and the load. The single small-gauge shielded conductor is instrument cable — and the identical TS plug can sit on either, which is why the jacket printing and the construction identify a cable, never the plug.',
    wrongHint: 'Amplifier current needs conductor size; a shield is for small signals.',
  },
  // 4 · balanced vs unbalanced — from trs_quarter (limitations, safety caution,
  //     commonMistakes: "assuming TRS means balanced").
  {
    id: 'q_balanced_trs_proof',
    question: 'A cable wears 1/4-inch TRS plugs. What does that prove about the connection being balanced?',
    options: [
      'Nothing by itself — the same jack may be a balanced input, a stereo output, or an insert point; the equipment decides',
      'TRS always means balanced',
      'TRS always means stereo',
      'TRS proves the cable is shielded twisted pair',
    ],
    correctIdx: 0,
    reveal:
      'Three contacts serve three different jobs — balanced mono, unbalanced stereo, and insert duty — and the contact count does not tell you which. Identify the jack’s job before patching; fit proves nothing.',
    wrongHint: '“Assuming a TRS plug means balanced” is one of the classic mistakes this lab corrects.',
  },
  // 5 · signal vs speaker vs power levels — from combo_xlr_trs
  //     (notInterchangeableWith ts_speaker_legacy + safety caution).
  {
    id: 'q_levels_amp_into_input',
    question: 'A power amplifier’s speaker output is patched into a mixer’s line input by mistake. The technically honest outcome:',
    options: [
      'Nothing — the input pads it down automatically',
      'The mixer just plays louder than intended',
      'Speaker-level voltage can overdrive and damage the input circuitry — a genuine equipment-damage risk',
      'It cannot happen, because the plugs will not fit',
    ],
    correctIdx: 2,
    reveal:
      'Never patch amplifier outputs into inputs. The plugs CAN fit — a speaker cable with a TS plug seats in a combo input’s 1/4-inch path — and speaker-level signals are far above what an input expects. This is one of the few wrong patches in this lab that goes beyond “no signal.”',
    wrongHint: 'Rank what travels: signal level, loudspeaker level, mains. What just arrived where it does not belong?',
  },
  // 6 · connector vs protocol — from ethernet_8p8c (limitations,
  //     notInterchangeableWith: different protocol on the same connector).
  {
    id: 'q_protocol_matching_ports',
    question: 'Two devices both have 8P8C (Ethernet-style) network ports. Are they compatible with each other?',
    options: [
      'Yes — matching ports prove compatible equipment',
      'Not proven — audio-over-IP systems, digital snake protocols and office networking all use the same plug; the protocol decides',
      'Yes, as long as the cable is a high enough category',
      'Only if both ends use locking shells',
    ],
    correctIdx: 1,
    reveal:
      'The connector proves NOTHING about the protocol. Identify ports from labels and documentation, not shape — a mismatched link can even show activity yet pass no usable audio.',
    wrongHint: 'The lab’s digital rule: connectors are not protocols.',
  },
  // 7 · inspection judgment — from ethernet_8p8c (locking.howToConfirm +
  //     commonMistakes: "ignoring a snapped latch tab").
  {
    id: 'q_inspect_latch_tab',
    question: 'A network cable’s latch tab has snapped off, but the plug still seats in the jack and passes signal. The call:',
    options: [
      'Keep it in service — it still passes signal',
      'Tape the plug into the jack',
      'Replace it only after audio actually drops out',
      'Retire it — the plug will seat but WILL work loose',
    ],
    correctIdx: 3,
    reveal:
      'A plug with a snapped-off tab will seat but WILL work loose. Retire it — inspection judgment acts on what a fault will do in service, not only on whether signal passes on the bench.',
    wrongHint: 'Ask what the latch DOES for a cable in service.',
  },
  // 8 · troubleshooting from symptoms — from trs_quarter
  //     (notInterchangeableWith: stereo TRS source into balanced mono input).
  {
    id: 'q_symptom_thin_hollow',
    question:
      'A stereo TRS source was patched into a balanced mono TRS input. The program sounds thin and hollow, with the vocal nearly missing. Why?',
    options: [
      'The balanced input amplifies the DIFFERENCE between its legs — left minus right — so center-panned content largely cancels',
      'The cable has a broken shield',
      'Phantom power is muting the vocal',
      'The input is padding the signal down',
    ],
    correctIdx: 0,
    reveal:
      'Left lands on the + leg and right on the − leg, and a balanced input hears L minus R: center-panned content — vocals, bass — largely cancels. Wrong connection, no damage.',
    wrongHint: 'The symptom is CENTER content missing. What arithmetic does a balanced input perform on its two legs?',
  },
  // 9 · contact-role tracing — from xlr3 (balanced_analog pinout).
  {
    id: 'q_trace_xlr_hot',
    question: 'On a balanced analog XLR connection, which pin carries the non-inverting (“hot”) leg of the signal?',
    options: ['Pin 1', 'Pin 3', 'Pin 2', 'The connector shell'],
    correctIdx: 2,
    reveal:
      'Pin 2 is signal + (non-inverting, “hot”), pin 3 is signal − (inverting, “cold”), and pin 1 ties the cable shield to the equipment reference.',
    wrongHint: 'Pin 1 is the shield — the signal pair lives on the other two pins.',
  },
  // 10 · same plug, different job — from ts_quarter constructionNote +
  //      notInterchangeableWith ts_speaker_legacy.
  {
    id: 'q_same_plug_ts',
    question:
      'Two cables wear identical 1/4-inch TS plugs — one is an instrument cable, one is a speaker cable. What tells you which is which?',
    options: [
      'The plug — speaker plugs are slightly larger',
      'The jacket printing and the construction — the plug cannot tell you',
      'Nothing — either cable does either job',
      'The color of the plastic boot',
    ],
    correctIdx: 1,
    reveal:
      'The plug does not define the cable. Instrument cable is a small shielded conductor for tiny signals; speaker cable is two heavier unshielded conductors for amplifier current. Swapped, one direction costs reliability under load and can put the amplifier at risk — the other direction collects hum because there is no shield.',
    wrongHint: 'The lab’s central principle: shape is not proof.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BANK 2 — CRITICAL SAFETY (7). Each marks its OWN unit (SAFETY_UNITS order).

export const SAFETY_QUESTIONS: SafetyCheckItem[] = [
  // q_safety_ground_lift — from mains_wall (commonMistakes: ground pin /
  // ground-lift adapter; contacts note on the earth pin).
  {
    unit: 'q_safety_ground_lift',
    id: 'q_safety_ground_lift',
    question: 'A system hums, and someone offers a ground-lift (“cheater”) adapter to fix it. The correct response:',
    options: [
      'Use it — that is what those adapters are for',
      'Use it on one piece of equipment only',
      'Use it during the show, then remove it',
      'Never — hum is solved on the signal side; the protective earth is never defeated',
    ],
    correctIdx: 3,
    reveal:
      'The earth pin is what keeps a fault from energizing the equipment chassis — it is never removed, bent back, or adapted away. Hum is solved on the signal side (isolation transformers, proper grounding practice), never by defeating the safety earth.',
    wrongHint: 'What does the protective earth protect — the sound, or the people touching the equipment?',
  },
  // q_safety_damaged_cord — from mains_wall (commonMistakes: damaged cord) +
  // iec_c13_c14 (advantages: replaced whole, never repaired inline).
  {
    unit: 'q_safety_damaged_cord',
    id: 'q_safety_damaged_cord',
    question: 'A power cord has a cracked jacket with inner conductors showing, but the equipment still powers up. What happens to that cord?',
    options: [
      'It leaves service immediately — damaged mains cords are never taped and returned to use',
      'Tape the damaged section and keep using it',
      'Downgrade it to low-power equipment only',
      'Keep it as an emergency spare',
    ],
    correctIdx: 0,
    reveal:
      'Cracked jackets, exposed conductors and heat-marked plugs leave service immediately. A detachable cordset is replaced whole — never repaired inline, and never taped. “It still works” is not a condition report.',
    wrongHint: '“It still works” is exactly the reasoning this rule exists to stop.',
  },
  // q_safety_m2m_mains — from mains_wall (commonMistakes + directionality:
  // male-to-male puts live mains on exposed pins).
  {
    unit: 'q_safety_m2m_mains',
    id: 'q_safety_m2m_mains',
    question: 'When is a male-to-male mains cable acceptable to build or use?',
    options: [
      'When both ends will be plugged in quickly',
      'When it is clearly labeled as male-to-male',
      'Never — the free end carries live, exposed pins the instant the other end is plugged in',
      'When feeding power from a generator into a building',
    ],
    correctIdx: 2,
    reveal:
      'Energized contacts belong on the recessed (female) side — that is the design rule a male-to-male cable violates. It puts live mains voltage on fully exposed pins, and there is no acceptable use, no labeling fix, and no careful way to do it.',
    wrongHint: 'Picture the free end of the cable the instant the other end goes live.',
  },
  // q_safety_wet — from mains_wall (commonMistakes: wet handling; cautions:
  // GFCI/RCD in damp locations).
  {
    unit: 'q_safety_wet',
    id: 'q_safety_wet',
    question: 'Rain starts reaching a powered outdoor connection point. Handling plugs and receptacles there while anything is energized is:',
    options: [
      'Acceptable if you work quickly and carefully',
      'Not acceptable — de-energize first; wet hands, rain and standing water never mix with energized mains handling',
      'Acceptable if the connectors feel dry to the touch',
      'Acceptable if you touch only the cable jacket',
    ],
    correctIdx: 1,
    reveal:
      'Never handle mains plugs, receptacles or connections with wet hands, in rain, or in standing water while anything is energized. Outdoors and in damp locations, the circuit itself should be GFCI (RCD) protected — confirmed before powering anything where water is possible.',
    wrongHint: 'The rule has no “if you are careful” clause.',
  },
  // q_safety_mains_mating — from mains_wall (NEMA 5-20 keying: never modify
  // blades) + iec_c13_c14 / iec_c19_c20 (keying protects the wiring) +
  // powercon_xx (directionality: never force, never adapt).
  {
    unit: 'q_safety_mains_mating',
    id: 'q_safety_mains_mating',
    question: 'A mains connector does not quite fit its receptacle — a hard push or a filed-down blade would “make it work.” What is true?',
    options: [
      'Never force or modify a mains connector — the keying is protecting the wiring, and the answer is the correct part',
      'Forcing is fine if the voltage matches',
      'Filing a blade down is acceptable on low-power equipment',
      'In an emergency, any mains connector may be made to mate',
    ],
    correctIdx: 0,
    reveal:
      'Keying differences are intentional: they prevent a 20 A load from drawing through a 15 A path, and a lighter cordset from feeding a high-current load. Never modify blades or couplers to force a fit — overload and overheating follow. A part that does not fit is telling you it is the wrong part.',
    wrongHint: 'The shapes differ on purpose. What is the keying protecting?',
  },
  // q_safety_unqualified_wiring — from every connectors.power record
  // (safety.cautions: internal wiring/termination/repair is qualified-person
  // work — uniform across mains_wall, IEC couplers, powerCON families).
  {
    unit: 'q_safety_unqualified_wiring',
    id: 'q_safety_unqualified_wiring',
    question: 'The internal wiring, termination or repair of a mains plug, cord or receptacle is:',
    options: [
      'Beginner work, if a tutorial is followed closely',
      'Beginner work, as long as the cord is unplugged',
      'Beginner work for low-current couplers only',
      'Qualified-person work — never beginner work, no matter how simple it looks',
    ],
    correctIdx: 3,
    reveal:
      'Every power connector in this lab draws the same line: identification, inspection and safe use are beginner skills; internal mains wiring, termination and repair belong to qualified people. The boundary does not move with confidence, cord size, or convenience.',
    wrongHint: 'The boundary is about the work itself, not about how careful the worker plans to be.',
  },
  // q_safety_speakon_mains — from speakon_nl2 / speakon_nl4 (safety cautions +
  // notInterchangeableWith powercon_xx) and powercon_xx / powercon_true1
  // (safety cautions: never a loudspeaker connector).
  {
    unit: 'q_safety_speakon_mains',
    id: 'q_safety_speakon_mains',
    question:
      'A loudspeaker twist-lock connector (speakON-style) and a locking mains connector look and lock similarly. Which statement is true?',
    options: [
      'They are interchangeable when the current ratings match',
      'A loudspeaker connector is never a mains connector, a mains connector is never a loudspeaker connector, and no adapter between them is ever acceptable',
      'An adapter between them is acceptable for short runs',
      'The twist-lock action means they belong to the same family',
    ],
    correctIdx: 1,
    reveal:
      'The twist-lock resemblance is a look-alike, not an equivalence. A mismade adapter would put mains voltage on loudspeaker wiring — equipment damage and electrical danger. Read the connector markings and the cable label before connecting; never let fit be the test.',
    wrongHint: 'One carries loudspeaker output, the other carries wall power. Can an adapter change what either one is?',
  },
];

/** Lesson takeaway (LessonBanner idiom). */
export const L12_LESSON =
  'Routing, construction, contact roles and troubleshooting can all be reasoned out from what a connection carries. The critical safety rules cannot be reasoned around — they are rules. And a connector fitting is never proof the connection is correct or safe.';
