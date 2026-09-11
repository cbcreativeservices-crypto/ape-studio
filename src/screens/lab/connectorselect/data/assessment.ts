/**
 * Final assessment — "You're on the Job" question bank (owner brief:
 * 12 randomized questions; ≥2 troubleshooting, ≥2 safety,
 * same-connector/different-signal represented; 80% to pass; every
 * safety-critical question must be correct; unlimited retries).
 *
 * Bank > draw size so retries genuinely reshuffle. `correct` indexes the
 * AUTHORED options array; presentation order is shuffled by the engine.
 * Every wrong option carries its own correction (no explain-leak; the
 * mixing-lab round-2 lesson). Facts trace to the verified
 * ConnectorRecords and this lab's scenario/fault data.
 */
import type { ConnectorId } from '../../cable/cableTypes';

export type AsmtKind = 'identify' | 'select' | 'samejob' | 'fault' | 'safety';

export type AsmtQuestion = {
  id: string;
  kind: AsmtKind;
  /** Safety-critical: must be answered correctly to pass, regardless of
   *  overall score. */
  critical?: boolean;
  /** Optional connector photo shown with the question. */
  image?: ConnectorId;
  q: string;
  options: string[];
  correct: number;
  explain: string;
  wrong: (string | undefined)[];
};

export const ASSESSMENT_BANK: readonly AsmtQuestion[] = [
  // ── identify ──────────────────────────────────────────────────────────────
  {
    id: 'id_xlr',
    kind: 'identify',
    image: 'xlr3',
    q: 'Name this connector.',
    options: ['3-pin XLR', '1/4-inch TRS', '5-pin DIN (MIDI)', 'speakON'],
    correct: 0,
    explain: 'Three pins in a latching circular shell: the 3-pin XLR.',
    wrong: [undefined, 'TRS is a straight phone plug with tip, ring and sleeve bands.', 'DIN plugs are circular too — but with five pins in an arc and no latch tab.', 'speakON is a twist-locking loudspeaker connector, much larger.'],
  },
  {
    id: 'id_trs_ts',
    kind: 'identify',
    image: 'trs_quarter',
    q: 'This 1/4-inch plug has TWO insulator rings dividing it into three contacts. It is a…',
    options: ['TRS plug', 'TS plug', 'TRRS plug', 'Banana plug'],
    correct: 0,
    explain: 'Two rings → three contacts: Tip, Ring, Sleeve.',
    wrong: [undefined, 'A TS plug has one ring — two contacts.', 'TRRS has three rings — four contacts — and lives on 3.5 mm headset plugs.', 'A banana plug is a bare single-conductor speaker connector.'],
  },
  {
    id: 'id_toslink',
    kind: 'identify',
    image: 'toslink',
    q: 'This squarish plug glows faint red when its source is running. What is it?',
    options: ['TOSLINK optical', 'BNC coaxial', 'RCA phono pair', 'etherCON data'],
    correct: 0,
    explain: 'The glow is the point: TOSLINK carries digital audio as LIGHT.',
    wrong: [undefined, 'BNC is a round bayonet-locking coaxial connector.', 'RCA is the round push-on consumer plug — copper, never light.', 'etherCON is a ruggedized RJ45 carrier — data over copper pairs.'],
  },
  {
    id: 'id_midi',
    kind: 'identify',
    image: 'midi_din5',
    q: 'A round plug with five pins in an arc, on a keyboard labeled OUT. What does the cable carry?',
    options: ['MIDI performance data', 'Recorded stereo audio', 'Balanced mono audio', 'Speaker-level audio'],
    correct: 0,
    explain: '5-pin DIN MIDI carries performance DATA — which note, how hard, which control. Never recorded sound.',
    wrong: [undefined, 'No audio of any kind travels down a MIDI cable.', 'It is not an audio connection at all — balanced or otherwise.', 'It is a data connection; no speaker signal is present.'],
  },
  // ── select ────────────────────────────────────────────────────────────────
  {
    id: 'sel_monitor',
    kind: 'select',
    q: 'An interface’s balanced TRS output feeds a powered monitor’s XLR input, 6 m away. Best cable?',
    options: ['Balanced TRS-to-XLR cable', 'TS instrument cable + adapter', 'Speaker cable + adapter', 'TOSLINK optical cable'],
    correct: 0,
    explain: 'Balanced out to balanced in wants a balanced cable — different plugs, same shielded-pair construction.',
    wrong: [undefined, 'A TS plug grounds the inverting leg: it works, but the noise rejection is gone.', 'Powered monitors take line level on shielded cable — speaker cable is the wrong construction.', 'Both ports are analog; optical fits neither.'],
  },
  {
    id: 'sel_passive',
    kind: 'select',
    critical: true,
    q: 'A power amplifier drives a passive PA cabinet. Which cable?',
    options: ['speakON speaker cable', 'XLR microphone cable', '1/4-inch instrument cable', 'Category network cable'],
    correct: 0,
    explain: 'Amplifier POWER needs heavy unshielded speaker conductors in a locking connector — exactly what speakON is.',
    wrong: [undefined, 'Mic cable is small shielded pair for tiny signals — amplifier current does not belong on it.', 'The most damaging swap in live audio: the small conductor heats and can fail at power.', 'Data cable has no business on a power run — and fits neither end.'],
  },
  {
    id: 'sel_spdif',
    kind: 'select',
    q: 'A CD player’s coaxial S/PDIF output feeds a DAC. The cable should be…',
    options: ['A true 75-ohm coaxial cable', 'Any RCA cable that fits', 'A balanced XLR cable', 'An optical cable with RCA adapters'],
    correct: 0,
    explain: 'Coaxial S/PDIF is specified for 75-ohm cable. Ordinary analog interconnects fit the jack but are not impedance-controlled — marginal runs drop out.',
    wrong: [undefined, 'Fit is not the specification: short runs may work, longer runs drop out or fail to lock.', 'S/PDIF coax is unbalanced on RCA — XLR belongs to AES3, a different interface.', 'Light does not adapt to copper: there is no passive optical-to-RCA adapter.'],
  },
  {
    id: 'sel_stagebox',
    kind: 'select',
    q: 'A digital console reaches its stagebox through one etherCON port. What cable — and what must you verify?',
    options: ['Rugged category cable, verified to spec', 'Any office patch cable, no checks needed', 'An XLR microphone cable', 'A 75-ohm BNC word-clock cable'],
    correct: 0,
    explain: 'One data link now carries every channel — the cable must meet the system’s category spec, and rugged latching shells earn their keep on stage.',
    wrong: [undefined, 'It may pass — but an unlatched cable of unknown category carrying the WHOLE show is a gamble, not a choice.', 'The network port will not accept an XLR; this link is data.', 'BNC coax is a different connector for different jobs (word clock, AES3id).'],
  },
  // ── same connector, different signal ─────────────────────────────────────
  {
    id: 'same_trs',
    kind: 'samejob',
    q: 'Two identical 1/4-inch TRS cables: one feeds a balanced MONO line input, the other drives STEREO headphones. What changed?',
    options: ['Only the job each end expects — the plug is identical', 'The stereo cable has an extra contact', 'The balanced cable is thicker by standard', 'Nothing — TRS is always stereo'],
    correct: 0,
    explain: 'Same three contacts, different assignment: +/−/shield on one job, L/R/common on the other. The equipment defines the job.',
    wrong: [undefined, 'Both plugs have exactly three contacts — count the rings.', 'No standard ties thickness to balance; construction follows the cable’s job, not a rule of thumb.', '“TRS = stereo” is the exact myth this lab exists to bust.'],
  },
  {
    id: 'same_xlr',
    kind: 'samejob',
    q: 'A wall panel has three identical female XLR jacks: MIC 1, AES OUT, and COMMS. What is true?',
    options: ['Each may need a DIFFERENT cable despite identical jacks', 'Any XLR cable serves all three equally well', 'The AES jack is analog because it is XLR', 'Identical jacks guarantee identical signals'],
    correct: 0,
    explain: 'Analog mic, 110-ohm digital and intercom share the shell — the label, not the jack, tells you what runs there.',
    wrong: [undefined, 'An analog mic cable on a long AES3 run can drop out — digital wants its specified 110-ohm cable.', 'AES3 is digital audio in an XLR shell — the shell says nothing about the signal.', 'That is the central lesson, inverted: the shape never determines the signal.'],
  },
  {
    id: 'same_rca',
    kind: 'samejob',
    q: 'A receiver has RCA jacks labeled CD, PHONO and COAX DIGITAL. Plugging a CD player into PHONO gives…',
    options: ['Grossly loud, distorted sound — wrong LEVEL for that input', 'Perfect sound — RCA is RCA', 'Silence, because the plug does not fit', 'Better sound, because phono stages are high quality'],
    correct: 0,
    explain: 'The phono input adds huge gain and RIAA equalization for millivolt cartridges. Line level into it slams the stage: loud and distorted.',
    wrong: [undefined, 'Identical jacks, three different electrical worlds — the label decides.', 'It fits perfectly; fit was never the problem.', 'The phono stage’s gain and EQ are exactly WRONG for a line signal.'],
  },
  {
    id: 'same_hdmi',
    kind: 'samejob',
    q: 'A soundbar’s HDMI cable works on TV port HDMI 2 (ARC) but returns no TV audio on port HDMI 1. Why?',
    options: ['Only ARC/eARC-marked ports support the audio RETURN path', 'The cable is directional and was reversed', 'HDMI never carries audio', 'Port 1 needs an optical adapter inside it'],
    correct: 0,
    explain: 'The connector is identical on every port; the RETURN capability lives only behind ports marked ARC or eARC.',
    wrong: [undefined, 'Standard HDMI cables are not directional; the port capability differs.', 'HDMI carries multichannel audio with the picture — and ARC sends it back the other way.', 'There is no such adapter; the return path is a port protocol feature.'],
  },
  // ── troubleshooting / faults ─────────────────────────────────────────────
  {
    id: 'fault_open',
    kind: 'fault',
    q: 'A continuity tester on an XLR cable shows 1→1 ✓, 3→3 ✓, 2→2 dark. Diagnosis?',
    options: ['Open conductor on pin 2', 'Pins 2 and 3 reversed', 'Shield disconnected', 'Cable is healthy'],
    correct: 0,
    explain: 'One straight path missing, others intact: the hot conductor is broken.',
    wrong: [undefined, 'A reversal leaves no conductor missing — every path still arrives somewhere. Here one conductor never arrives at all.', 'A floating shield darkens 1→1, not 2→2.', 'A healthy cable lights all three straight paths.'],
  },
  {
    id: 'fault_swap',
    kind: 'fault',
    q: 'On an XLR cable: 1→1 lights, 2→2 and 3→3 are DARK — but 2→3 and 3→2 both light. The cable…',
    options: ['Has pins 2 and 3 swapped', 'Is perfectly healthy', 'Has a short between pins 2 and 3', 'Has a broken shield'],
    correct: 0,
    explain: 'Every conductor arrives — crossed. It carries audio, inverted; mixed with a correct cable on a paired source, the two partially cancel. Flag and fix.',
    wrong: [undefined, 'Healthy is straight through: 1→1, 2→2, 3→3 — here the straight signal pairs are dark.', 'A short lights EXTRA paths on top of the straight ones; here the straight pairs went dark instead.', 'Pin 1 passed — the shield is fine; the signal pair is crossed.'],
  },
  {
    id: 'fault_intermittent',
    kind: 'fault',
    q: 'A cable passes every continuity check at rest, yet drops out on stage. Best next test?',
    options: ['Flex the cable at each connector while watching the lamps', 'Declare it healthy — the tester passed it', 'Measure its impedance with the same tester', 'Replace the connectors immediately'],
    correct: 0,
    explain: 'Intermittents hide at rest and reveal under flex — wiggle at the strain reliefs while testing.',
    wrong: [undefined, 'A resting pass means nothing to a strain-relief break that only opens when bent.', 'A continuity tester cannot measure characteristic impedance at all.', 'Diagnose before surgery: find WHERE it fails first — it may be one ten-second fix.'],
  },
  {
    id: 'fault_wrongtype',
    kind: 'fault',
    q: 'A 1/4-inch cable passes every continuity test. Can you now trust it on an amplifier-to-speaker run?',
    options: ['No — continuity cannot see the construction', 'Yes — all paths pass, the cable is good', 'Yes, as long as both plugs are metal-bodied', 'No cable with TS plugs can drive a speaker'],
    correct: 0,
    explain: 'The tester proves the paths exist, not what they are built from. Read the jacket: instrument cable on speaker duty heats and fails.',
    wrong: [undefined, 'The tester passes BOTH constructions identically — it is blind to gauge and shielding.', 'Plug bodies say nothing about the conductors inside the jacket.', 'Genuine speaker cable with TS plugs exists (the legacy connection) — the construction, not the plug, decides.'],
  },
  // ── safety ────────────────────────────────────────────────────────────────
  {
    id: 'safe_ground',
    kind: 'safety',
    critical: true,
    q: 'A system hums. Someone offers a ground-lift adapter to “fix” the amp’s mains plug. You…',
    options: ['Refuse it and find the actual cause of the hum', 'Use it — a hum gone is a hum gone', 'Use it, but only for the show tonight', 'Use it on the mixer instead of the amp'],
    correct: 0,
    explain: 'The safety ground is shock protection for every hand that touches the system. Hum has proper fixes; removing protection is never one.',
    wrong: [undefined, 'The hum stops because the protective path is GONE — a fault can now energize the chassis.', 'One show is exactly when a fault plus a missing ground meets a hand on a mic.', 'Defeating ANY safety ground creates the hazard — the location does not matter.'],
  },
  {
    id: 'safe_speaker_out',
    kind: 'safety',
    critical: true,
    q: 'A cable from a power amplifier’s SPEAKER OUTPUT physically fits the mixer’s line input. Connecting it…',
    options: ['Can damage the input circuitry — never do it', 'Is fine at low volume', 'Works if the cable is shielded', 'Only fails if the speaker is disconnected'],
    correct: 0,
    explain: 'Speaker-level voltage is enormously above what any input expects — it can overdrive and damage the input circuitry. One of the few cable mistakes that harms equipment outright.',
    wrong: [undefined, '“Low volume” is one knob-twist from damage — the connection itself is the hazard.', 'Shielding does not change the level; the voltage is the problem.', 'The input is at risk the moment amplifier power reaches it, speaker or no speaker.'],
  },
  {
    id: 'safe_order',
    kind: 'safety',
    q: 'Correct power sequence for a PA at the end of the night?',
    options: ['Amps and powered speakers off first', 'Mixer off first, amplifiers last', 'Everything off at one power strip', 'Order does not matter at shutdown'],
    correct: 0,
    explain: 'Amplifiers off FIRST at shutdown (and on LAST at startup) — so nobody amplifies the thumps of everything else.',
    wrong: [undefined, 'A mixer powering down thumps — and the amps are still on to broadcast it.', 'One strip drops everything at once: every transient reaches live amplifiers.', 'It matters at both ends of the night — amps last on, first off.'],
  },
  {
    id: 'safe_hot_swap',
    kind: 'safety',
    q: 'Swapping a vocal mic mid-soundcheck. Best practice?',
    options: ['Mute the channel first, then swap', 'Swap fast — speed beats muting', 'Turn phantom up so the new mic is ready', 'Unplug at the mixer end instead'],
    correct: 0,
    explain: 'Mute first: the connection pop never reaches the PA. With phantom on a condenser, switch it off and pause before unplugging.',
    wrong: [undefined, 'However fast, the contacts still bridge — the pop happens at any speed.', 'Phantom stays as needed by the MIC — raising anything “ready” is not a thing; mute is the protection.', 'Unplugging a live line pops from either end — mute is what prevents it.'],
  },
];

/** Composition rule for a drawn paper (brief): 12 questions, ≥2 fault,
 *  ≥2 safety, ≥1 samejob, ≥1 identify, ≥1 select. */
export const DRAW_SIZE = 12;
export const DRAW_MINIMUMS: Readonly<Partial<Record<AsmtKind, number>>> = {
  fault: 2,
  safety: 2,
  samejob: 1,
  identify: 1,
  select: 1,
};
export const PASS_PCT = 80;
