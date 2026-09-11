/**
 * Stations 4 & 7 + the misconceptions challenge — pure data.
 *
 * Cross-section facts follow the Fundamentals lab's verified anatomy
 * vocabulary (cableTypes CableSectionId); the two additions here (stereo
 * common-return, multi-conductor USB/HDMI) are structural descriptions,
 * not electrical claims. Safety rules restate the brief's required cards
 * in the app's verified-safety voice (each maps onto claims already
 * verified in the Fundamentals records — see the test's cross-check list).
 */

// ── Station 4: inside the cable ─────────────────────────────────────────────

export type SectionKind =
  | 'balanced_pair'
  | 'instrument'
  | 'stereo_common'
  | 'speaker'
  | 'coax75'
  | 'category'
  | 'optical'
  | 'multiconductor';

export type CrossSection = {
  id: SectionKind;
  name: string;
  /** What is physically inside, outermost → innermost, for the SVG. */
  layers: string[];
  blurb: string;
  /** The job this construction is built for. */
  job: string;
};

export const CROSS_SECTIONS: readonly CrossSection[] = [
  {
    id: 'balanced_pair',
    name: 'Balanced shielded twisted pair',
    layers: ['Jacket', 'Shield', 'Two twisted conductors'],
    blurb: 'Two signal conductors twisted together inside a shield. The twist and the shield are why balanced runs stay quiet over distance.',
    job: 'Microphone and balanced line connections (XLR, TRS).',
  },
  {
    id: 'instrument',
    name: 'Unbalanced instrument / coaxial audio',
    layers: ['Jacket', 'Shield', 'One small conductor'],
    blurb: 'A single small-gauge conductor inside a shield, built to move a tiny high-impedance signal quietly — not current.',
    job: 'Guitar and unbalanced line connections (TS, RCA analog).',
  },
  {
    id: 'stereo_common',
    name: 'Stereo cable (two conductors + common return)',
    layers: ['Jacket', 'Shield / common return', 'Left conductor · Right conductor'],
    blurb: 'Two signal conductors share one return/shield: left and right ride together, unbalanced.',
    job: 'Headphone and stereo interconnect cables (TRS, 3.5 mm).',
  },
  {
    id: 'speaker',
    name: 'Heavy-gauge speaker cable',
    layers: ['Jacket', 'Two heavy conductors — NO shield'],
    blurb: 'Two large unshielded conductors sized for amplifier current. No shield — a speaker signal is powerful enough not to need one.',
    job: 'Amplifier POWER to passive loudspeakers (speakON, legacy TS).',
  },
  {
    id: 'coax75',
    name: '75-ohm coaxial digital cable',
    layers: ['Jacket', 'Shield', 'Dielectric', 'Center conductor'],
    blurb: 'Center conductor, precise dielectric, shield — built to a 75-ohm impedance specification a continuity tester cannot see.',
    job: 'Coaxial S/PDIF, word clock and video (RCA digital, BNC).',
  },
  {
    id: 'category',
    name: 'Category twisted-pair network cable',
    layers: ['Jacket', 'FOUR twisted pairs'],
    blurb: 'Four twisted pairs, each pair twisted at a different rate, built and certified to a category specification.',
    job: 'Ethernet and networked audio (RJ45, etherCON).',
  },
  {
    id: 'optical',
    name: 'Optical cable',
    layers: ['Jacket', 'Buffer', 'Cladding', 'Light-carrying core'],
    blurb: 'No copper at all: light in a core wrapped in cladding. Immune to electrical interference — and to sharp bends it is not.',
    job: 'TOSLINK optical digital audio.',
  },
  {
    id: 'multiconductor',
    name: 'USB / HDMI multi-conductor cable',
    layers: ['Jacket', 'Overall shield', 'Multiple shielded pairs + power conductors'],
    blurb: 'Many conductors doing different jobs at once — shielded high-speed pairs, power, control — built to the interface’s certification.',
    job: 'USB and HDMI connections; capability is set by the certification, not the shape.',
  },
];

/** The station's REQUIRED comparison (owner brief, load-bearing). */
export const INSTRUMENT_VS_SPEAKER =
  'Instrument cable and speaker cable may use identical 1/4-inch connectors, but they are not interchangeable: one is a shielded small conductor for tiny signals, the other is two heavy unshielded conductors for amplifier current.';

/** The look-identical impedance lesson (verified in the xlr3 record). */
export const AES_VS_MIC =
  'An AES3 digital XLR cable and an ordinary microphone cable can look identical — but AES3 is specified for 110-ohm digital cable. Cables can share a shell and differ in impedance, conductor size, shielding, bandwidth or certification.';

// ── Station 7: safety & professional practice ───────────────────────────────

export type SafetyRule = {
  id: string;
  rule: string;
  why: string;
};

export const SAFETY_RULES: readonly SafetyRule[] = [
  {
    id: 'mute_first',
    rule: 'Mute the system before connecting or disconnecting equipment.',
    why: 'Contacts bridge as plugs seat and pops go through the system at full power — the monitors and the audience hear every one.',
  },
  {
    id: 'amps_last',
    rule: 'Turn power amplifiers and powered loudspeakers on LAST — and off FIRST.',
    why: 'Everything upstream thumps as it powers up or down. If the amplifiers are already off, nobody hears it.',
  },
  {
    id: 'no_speaker_into_input',
    rule: 'Never connect an amplifier’s speaker output to a microphone or line input.',
    why: 'Speaker-level voltage into an input can overdrive and damage the input circuitry — one of the few cable mistakes that harms equipment.',
  },
  {
    id: 'no_instrument_for_speaker',
    rule: 'Never substitute an instrument cable for a speaker cable.',
    why: 'The small shielded conductor loses power and can heat and fail on amplifier duty, putting the amplifier at risk — a failure hiding behind an identical plug.',
  },
  {
    id: 'no_ground_defeat',
    rule: 'Never defeat the AC safety ground to eliminate hum.',
    why: 'The ground pin is what keeps a fault from energizing chassis and mic bodies. Hum has proper fixes; removing shock protection is not one of them.',
  },
  {
    id: 'adapters_dont_convert',
    rule: 'A passive adapter does not convert level, impedance, balance or digital protocol.',
    why: 'An adapter changes the SHAPE of a connection — and can only preserve or degrade what is already there. It never upgrades a signal, and everything wrong with the connection comes through with it.',
  },
  {
    id: 'no_y_outputs',
    rule: 'Do not passively join two outputs with a Y-cable.',
    why: 'Two output stages forced into one jack fight each other — level loss, distortion, and stress on both outputs. Combining is a mixer’s job.',
  },
  {
    id: 'inspect',
    rule: 'Inspect connectors for exposed conductors, burns, corrosion, loose shells and damaged strain relief.',
    why: 'Almost every cable failure announces itself at the connector first. Ten seconds of looking beats an hour of mid-show hunting.',
  },
  {
    id: 'power_separate',
    rule: 'Keep power connectors visually and conceptually separate from audio connectors.',
    why: 'Mains power has its own connectors, its own rules and its own lab. The habit of separating the two families is itself a safety practice.',
  },
];

// ── Misconceptions challenge ────────────────────────────────────────────────

export type Misconception = {
  id: string;
  claim: string;
  /** Every card in this set is FALSE by design (the brief's list) — the
   *  interesting part is the correction. A test pins this so a true claim
   *  can never slip into a deck the UI presents as myth-busting. */
  answer: false;
  correction: string;
};

export const MISCONCEPTIONS: readonly Misconception[] = [
  { id: 'trs_stereo', claim: 'TRS always means stereo.', answer: false, correction: 'TRS means THREE CONTACTS. Balanced mono, stereo headphones and insert send/return all use the same plug.' },
  { id: 'xlr_mic', claim: 'XLR always carries a microphone signal.', answer: false, correction: 'XLR also carries balanced line, AES3 digital, intercom and more. The shell never identifies the signal.' },
  { id: 'balanced_stereo', claim: 'Balanced means stereo.', answer: false, correction: 'Balanced is a NOISE-REJECTION scheme: two copies of ONE signal plus a shield. A balanced connection is mono.' },
  { id: 'fit_compatible', claim: 'If two connectors fit, the devices are compatible.', answer: false, correction: 'Fit is question 1 of 4. Signal, construction and safety still have to pass — the most expensive mistakes all FIT perfectly.' },
  { id: 'midi_audio', claim: 'MIDI cables carry musical audio.', answer: false, correction: 'MIDI carries INSTRUCTIONS — which note, how hard, which control. No recorded sound ever travels down a MIDI cable.' },
  { id: 'adapter_converts', claim: 'An adapter automatically converts the signal.', answer: false, correction: 'A passive adapter converts the SHAPE only — it can preserve or degrade a connection, never upgrade it. Level, balance, impedance and protocol are untouched.' },
  { id: 'usbc_identical', claim: 'All USB-C cables have identical capabilities.', answer: false, correction: 'Identical plugs, different cables: data rate, power rating and video support vary. Some charge-only cables barely carry data at all.' },
  { id: 'any_quarter', claim: 'Any 1/4-inch cable can connect an amplifier to a passive speaker.', answer: false, correction: 'Only actual SPEAKER cable belongs on amplifier duty. An instrument cable with the same plug loses power, heats, and can fail.' },
  { id: 'expensive_better', claim: 'More expensive cables automatically improve sound.', answer: false, correction: 'Correct construction, correct specification, good condition and durability matter. Past that, price buys longevity and handling — not fidelity.' },
];
