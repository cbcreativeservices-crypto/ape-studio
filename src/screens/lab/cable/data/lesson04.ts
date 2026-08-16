/**
 * lesson04 data — "Same Plug, Different Job" (owner spec §5.4).
 * The lab's major look-alike demonstration: ten comparisons of connections
 * that physically mate (or look near-identical) yet do different work.
 *
 * FACT SOURCE DISCIPLINE (owner mandate 2026-08-15): every `why` and
 * `consequence` below is quote-faithful to — or a proportionate condensation
 * of — the corresponding VERIFIED connector records:
 *   connectors.analog.ts   (xlr3, ts_quarter, trs_quarter, rca)
 *   connectors.speaker.ts  (ts_speaker_legacy)
 *   connectors.digital.ts  (usb_c, ethernet_8p8c, bnc, toslink)
 *   connectors.power.ts    (powercon_xx, powercon_true1)
 * primarily their notInterchangeableWith / limitations / constructionNote
 * fields. Nothing here is authored as a new factual claim. Consequences stay
 * technically proportionate — never dramatized (§5.4).
 *
 * ANSWER KEY: 'yes' is never correct. 'depends' is correct ONLY where the
 * records themselves say the physical parts serve either job and the
 * ASSIGNMENT/format must match (TRS three-way; TOSLINK S/PDIF vs ADAT —
 * "Configuration, not cabling, is the fix"). Everything else is 'no'.
 *
 * Pure data, zero React.
 */

export type InterchangeAnswer = 'no' | 'depends';

export type PlugComparison = {
  id: string;
  aLabel: string;
  bLabel: string;
  /** Third side — used only by the TRS three-way comparison. */
  cLabel?: string;
  /** One line on why the sides look alike (record-derived). */
  sameLooks: string;
  /** The question posed for every comparison. */
  question: string;
  answer: InterchangeAnswer;
  /** Why the answer is what it is — derived from the records' fields. */
  why: string;
  /** The technically honest result of choosing wrong — record-derived. */
  consequence: string;
};

export const PLUG_COMPARISONS: PlugComparison[] = [
  {
    id: 'ts_instrument_vs_speaker',
    aLabel: '1/4-inch TS instrument cable',
    bLabel: '1/4-inch TS speaker cable',
    sameLooks:
      'The plugs are identical; the cables are not — the jacket printing and the construction are what tell them apart.',
    question: 'Interchangeable?',
    answer: 'no',
    why:
      'Instrument cable is one small shielded conductor for instrument-level signal; speaker cable is two heavier unshielded conductors for amplifier current. Older amplifiers and loudspeakers used TS jacks for speaker connections, so both cables exist in the field.',
    consequence:
      'An instrument cable carrying loudspeaker current can heat, lose level, and fail — reduced reliability, and with some amplifier designs a failed loudspeaker line risks equipment damage. A speaker cable used for an instrument picks up hum and noise because it has no shield.',
  },
  {
    id: 'xlr_analog_vs_aes3',
    aLabel: 'XLR analog microphone cable',
    bLabel: 'XLR AES3 digital cable',
    sameLooks:
      'The same 3-pin XLR shell serves several different jobs — the connector alone does not identify the signal.',
    question: 'Interchangeable?',
    answer: 'no',
    why:
      'Same connector, different cable: AES3 digital audio is specified for 110-ohm balanced digital cable, not analog microphone cable.',
    consequence:
      'An analog mic cable on a long AES3 run can drop out intermittently or fail to lock at all — a reliability failure, not equipment damage.',
  },
  {
    id: 'xlr_mic_vs_dmx',
    aLabel: 'XLR analog microphone line',
    bLabel: 'XLR-shell DMX lighting control line',
    sameLooks:
      'Some lighting fixtures use XLR-shell connectors, so audio and lighting lines can physically mate.',
    question: 'Interchangeable?',
    answer: 'no',
    why:
      'Lighting control (DMX512) specifies 120-ohm data cable, and what it carries is control data, not audio — the shared shell is a look-alike, not a kinship.',
    consequence:
      'Microphone cable in a DMX line invites flickering and erratic fixture behavior. Patching audio gear into a control line fails to work and can disrupt the control network — and if the audio line carries +48 V phantom power, it can damage lighting-control electronics. Verify what a line carries before connecting.',
  },
  {
    id: 'rca_analog_vs_spdif',
    aLabel: 'RCA analog interconnect',
    bLabel: 'RCA coaxial S/PDIF digital cable',
    sameLooks:
      'Identical plugs, different cable specification — the connector does not certify the cable behind it.',
    question: 'Interchangeable?',
    answer: 'no',
    why:
      'S/PDIF is specified as a 75-ohm digital interface; ordinary analog interconnects are coaxial in form but not impedance-controlled.',
    consequence:
      'Short analog cables often appear to work; longer or marginal runs drop out or fail to lock. A reliability failure, not damage — use a true 75-ohm cable for digital.',
  },
  {
    id: 'bnc_50_vs_75',
    aLabel: '50-ohm BNC cable',
    bLabel: '75-ohm BNC cable',
    sameLooks:
      '50-ohm and 75-ohm cables and connectors look nearly identical — the printing on the jacket and the datasheet are what tell them apart.',
    question: 'Interchangeable?',
    answer: 'no',
    why:
      'Both families mate mechanically; the impedance difference is invisible from outside — and a continuity tester cannot measure it.',
    consequence:
      'An impedance mismatch causes reflections — on long runs or marginal equipment that means clocking instability or signal-integrity problems, not equipment damage. Match the impedance the system specifies.',
  },
  {
    id: 'trs_three_jobs',
    aLabel: 'TRS balanced mono line',
    bLabel: 'TRS unbalanced stereo lead',
    cLabel: 'TRS insert lead (send/return)',
    sameLooks:
      'One connector serves balanced mono, unbalanced stereo, and insert duty — and three contacts do not tell you which of its three jobs a jack performs.',
    question: 'Interchangeable?',
    answer: 'depends',
    why:
      'These are all TRS cables — balanced and stereo use even ride the same two-conductors-plus-shield construction. The construction cannot tell you which job the cable is doing; the equipment on each end decides, so the ASSIGNMENT at both ends must match.',
    consequence:
      'A balanced source patched into an insert lands on a send/return pair instead of an input: the channel goes silent or routes wrongly. A stereo source into a balanced mono input is heard as left-minus-right, so center-panned content largely cancels: thin, hollow audio with vocals and bass nearly missing. Wrong connection, no damage.',
  },
  {
    id: 'usbc_charge_vs_full',
    aLabel: 'USB-C charge-only or USB 2.0-only cable',
    bLabel: 'USB-C full-featured cable',
    sameLooks:
      'Two USB-C cables that look identical can differ in data speed, power rating, and alternate-mode support.',
    question: 'Interchangeable?',
    answer: 'no',
    why:
      'Same plug, reduced cable: the high-speed pairs (or the data pair entirely) are absent. The cable is a component with its own specification — check it, don’t assume it.',
    consequence:
      'The link falls back to whatever the cable supports — low speed or power-only. No signal or reduced capability, not damage — the negotiation protects the equipment when the cable reports itself honestly, which is one more reason to buy certified cables.',
  },
  {
    id: 'eth_8p8c_protocols',
    aLabel: 'Audio-over-IP network port (e.g. Dante)',
    bLabel: 'Digital-snake or office LAN port (e.g. AES50)',
    sameLooks:
      'Audio-over-IP systems, digital-snake protocols, and plain office networking all use the same 8P8C modular plug.',
    question: 'Interchangeable?',
    answer: 'no',
    why:
      'The connector proves nothing about the protocol: many systems use this connection, and the shell cannot tell you which one a port speaks. Matching ports do not mean compatible equipment.',
    consequence:
      'Protocol incompatibility — the link may show activity yet pass no usable audio, or fail entirely. Identify ports from labels and documentation, not shape.',
  },
  {
    id: 'toslink_spdif_vs_adat',
    aLabel: 'Optical S/PDIF connection (stereo)',
    bLabel: 'ADAT optical connection (multichannel)',
    sameLooks:
      'Two different digital audio protocols share the identical connector and fiber.',
    question: 'Interchangeable?',
    answer: 'depends',
    why:
      'The fiber and connector serve either job — the port does not identify the protocol. Optical S/PDIF and ADAT are different, incompatible formats, so whether the connection works depends on both devices being set to the same one.',
    consequence:
      'With the two ends set to different formats, the receiver does not decode the stream: most equipment mutes on an unrecognized format, but some instead outputs noise — keep monitor levels down until both ends are set to the same format. Configuration, not cabling, is the fix.',
  },
  {
    id: 'powercon_xx_vs_true1',
    aLabel: 'powerCON (20 A family)',
    bLabel: 'powerCON TRUE1',
    sameLooks:
      'Related names and similar locking stage-power shells — but physically different, non-intermateable connector families.',
    question: 'Interchangeable?',
    answer: 'no',
    why:
      'A separate connector family with different geometry and keying, despite the related name. They also differ in duty: the original family has no breaking capacity and must never be connected or disconnected under load, while breaking capacity on TRUE1-style couplers is a certified, model-specific property — never assumed from the shape.',
    consequence:
      'They do not mate. Treat them as different connectors, not versions of one — the correct mating part is the only fix.',
  },
];
