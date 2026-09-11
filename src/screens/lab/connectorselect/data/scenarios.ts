/**
 * Station 5 — Build the system: the 12 connection scenarios (owner brief
 * 2026-09-11). Each scenario is one real connection with a cable tray of
 * four choices; exactly one is correct, and every wrong choice explains
 * the ACTUAL problem through a typed ProblemKind.
 *
 * Facts honored from the verified ConnectorRecords (Cable & Connector
 * Fundamentals, B2 protocol): instrument-vs-speaker cable consequences,
 * phantom power practice, S/PDIF 75-ohm specification, phono levels,
 * stereo-into-balanced-mono cancellation, speaker-output-into-input damage
 * risk, proprietary-vs-Ethernet stagebox caveat. A test pins: unique ids,
 * exactly one correct per scenario, every ProblemKind exercised at least
 * once, and every referenced connector resolving to a verified record.
 */
import type { ConnectorId } from '../../cable/cableTypes';

/** The brief's eight wrong-connection problem classes. */
export type ProblemKind =
  | 'no_fit' // physically will not fit
  | 'wrong_level' // wrong signal level
  | 'wrong_construction' // wrong cable construction
  | 'bal_unbal' // balanced/unbalanced mismatch
  | 'protocol' // digital protocol mismatch
  | 'speaker_into_input' // speaker output into a line/mic input
  | 'outputs_combined' // two outputs incorrectly joined
  | 'fits_but_verify'; // fits, but compatibility cannot be assumed

export const PROBLEM_LABELS: Record<ProblemKind, string> = {
  no_fit: 'DOES NOT FIT',
  wrong_level: 'WRONG SIGNAL LEVEL',
  wrong_construction: 'WRONG CABLE CONSTRUCTION',
  bal_unbal: 'BALANCED / UNBALANCED MISMATCH',
  protocol: 'PROTOCOL MISMATCH',
  speaker_into_input: 'SPEAKER OUTPUT INTO AN INPUT',
  outputs_combined: 'TWO OUTPUTS JOINED',
  fits_but_verify: 'FITS — BUT VERIFY',
};

export type CableChoice = {
  id: string;
  /** Tray label: what the cable IS, construction included. */
  name: string;
  /** Connector on each end — photos come from the verified image map. */
  a: ConnectorId;
  b: ConnectorId;
  verdict: 'correct' | ProblemKind;
  /** Overrides the FINAL four-question row values where the problem kind's
   *  default mapping would claim something the verified records deny
   *  (cognition pass: a stereo-into-balanced mismatch is NOT a construction
   *  fault — the construction is identical; only the assignment differs). */
  rowsOverride?: Partial<Record<'fit' | 'signal' | 'construction' | 'safe', boolean>>;
  explain: string;
};

export type Scenario = {
  id: string;
  title: string;
  /** The job, in one sentence. */
  brief: string;
  from: { device: string; port: string };
  to: { device: string; port: string };
  choices: CableChoice[];
  /** Extra teaching note shown after the scenario is solved. */
  note?: string;
};

export const SCENARIOS: readonly Scenario[] = [
  {
    id: 's01_dyn_mic',
    title: 'Dynamic microphone → mixer',
    brief: 'A dynamic vocal mic on stage needs to reach a mixer mic input 15 m away.',
    from: { device: 'Dynamic microphone', port: 'XLR output (male pins)' },
    to: { device: 'Mixer', port: 'Channel 1 mic input (XLR female)' },
    choices: [
      { id: 'a', name: 'XLR microphone cable — balanced shielded pair', a: 'xlr3', b: 'xlr3', verdict: 'correct', explain: 'The classic connection: balanced mic level on shielded twisted pair, latched at both ends. 15 m is easy for a balanced run.' },
      { id: 'b', name: '1/4-inch TS instrument cable', a: 'ts_quarter', b: 'ts_quarter', verdict: 'no_fit', explain: 'A TS plug does not mate with the mic’s XLR output or the XLR input. The system stopped you at question 1 — fit.' },
      { id: 'c', name: 'RCA stereo interconnect pair', a: 'rca', b: 'rca', verdict: 'no_fit', explain: 'RCA plugs fit neither end. Consumer interconnects live in a different part of the system.' },
      { id: 'd', name: 'XLR-shell lighting/data cable from the utility bin', a: 'xlr3', b: 'xlr3', verdict: 'fits_but_verify', explain: 'It fits perfectly — and that proves nothing. XLR shells also serve digital and control runs built on different cable. An unknown cable must be verified before it carries your show.' },
    ],
    note: 'The correct choice was decided by all four questions, not the plug: fit, mic-level signal, shielded-pair construction, and a safe path.',
  },
  {
    id: 's02_condenser',
    title: 'Condenser microphone → mixer (phantom power)',
    brief: 'A condenser mic needs the same mixer input — and it needs +48 V phantom power to work at all.',
    from: { device: 'Condenser microphone', port: 'XLR output' },
    to: { device: 'Mixer', port: 'Channel 2 mic input · +48 V available' },
    choices: [
      { id: 'a', name: 'XLR microphone cable — balanced shielded pair', a: 'xlr3', b: 'xlr3', verdict: 'correct', explain: 'Phantom power rides the SAME two signal pins back up the mic cable — a proper balanced cable carries the signal down and the power up. Mute the channel before plugging, then switch +48 V on.' },
      { id: 'b', name: 'XLR-to-TS adapter cable into a line input', a: 'xlr3', b: 'ts_quarter', verdict: 'bal_unbal', explain: 'The adapter unbalances the connection — and an unbalanced path cannot deliver phantom power correctly. The condenser stays silent.' },
      { id: 'c', name: 'RCA interconnect with adapters piled on each end', a: 'rca', b: 'rca', verdict: 'bal_unbal', explain: 'Adapters make it fit; they do not make it balanced, and phantom cannot ride an unbalanced consumer interconnect. An adapter never converts the signal.' },
      { id: 'd', name: '1/4-inch speaker cable', a: 'ts_speaker_legacy', b: 'ts_speaker_legacy', verdict: 'no_fit', explain: 'Wrong plugs for both ends — and speaker cable is the wrong construction for any mic-level job even where it fits.' },
    ],
    note: 'Phantom power is the reason the CABLE matters, not just the plugs: it needs both signal conductors and the shield reference intact.',
  },
  {
    id: 's03_guitar_di',
    title: 'Guitar → DI → mixer',
    brief: 'An electric guitar plays through a DI box; the DI feeds the mixer. Two cables, two different jobs.',
    from: { device: 'Electric guitar', port: '1/4-inch output' },
    to: { device: 'DI box → mixer', port: 'DI instrument in · DI XLR out → mic input' },
    choices: [
      { id: 'a', name: 'TS instrument cable to the DI + XLR mic cable to the mixer', a: 'ts_quarter', b: 'xlr3', verdict: 'correct', explain: 'Exactly the DI’s job: a short unbalanced instrument cable into the DI, then a balanced XLR run to the mixer. High-impedance signal travels short; balanced signal travels far.' },
      { id: 'b', name: 'One long TS instrument cable straight to a mixer line input', a: 'ts_quarter', b: 'ts_quarter', verdict: 'fits_but_verify', explain: 'It fits and may pass sound — but a long unbalanced high-impedance run collects noise and loses top end, and a line input is not an instrument input. This is what the DI exists to fix.' },
      { id: 'c', name: '1/4-inch speaker cable to the DI', a: 'ts_speaker_legacy', b: 'ts_speaker_legacy', verdict: 'wrong_construction', explain: 'Identical plug, wrong cable: unshielded speaker cable on an instrument run hums and buzzes. The jacket printing — not the plug — tells you which you are holding.' },
      { id: 'd', name: 'XLR mic cable straight from the guitar', a: 'xlr3', b: 'xlr3', verdict: 'no_fit', explain: 'The guitar has no XLR output. Fit fails first.' },
    ],
  },
  {
    id: 's04_stereo_keys',
    title: 'Stereo keyboard → two mixer inputs',
    brief: 'A keyboard with LEFT and RIGHT 1/4-inch outputs needs both channels on the mixer.',
    from: { device: 'Keyboard', port: 'OUTPUT L and OUTPUT R (1/4-inch)' },
    to: { device: 'Mixer', port: 'Line inputs 5 and 6' },
    choices: [
      { id: 'a', name: 'TWO balanced TRS cables — L to input 5, R to input 6', a: 'trs_quarter', b: 'trs_quarter', verdict: 'correct', explain: 'Stereo is two mono connections. Two cables, two inputs, panned left and right at the mixer.' },
      { id: 'b', name: 'One Y-cable joining L and R into one input', a: 'trs_quarter', b: 'trs_quarter', verdict: 'outputs_combined', explain: 'A passive Y forces two output stages to fight each other into one jack — level and tone suffer and the outputs are stressed. Outputs are never passively joined.' },
      { id: 'c', name: 'One stereo TRS cable into ONE balanced input', a: 'trs_quarter', b: 'trs_quarter', verdict: 'bal_unbal', rowsOverride: { construction: true }, explain: 'A balanced input amplifies the DIFFERENCE between tip and ring — fed L and R, it hears left-minus-right and the center of the music cancels to a thin ghost. The cable’s construction is fine; the ASSIGNMENT is the mismatch.' },
      { id: 'd', name: 'RCA stereo pair', a: 'rca', b: 'rca', verdict: 'no_fit', explain: 'The keyboard’s 1/4-inch outputs will not accept RCA plugs without adapters — and the right answer is sitting in the tray.' },
    ],
    note: 'The Y-cable rule has a mirror: one output may feed a Y that SPLITS to two inputs on some gear, but two OUTPUTS never passively join.',
  },
  {
    id: 's05_interface_monitors',
    title: 'Audio interface → two powered monitors',
    brief: 'An interface’s two balanced TRS main outputs feed a pair of powered studio monitors with XLR inputs.',
    from: { device: 'Audio interface', port: 'MAIN OUT L/R (1/4-inch TRS, balanced)' },
    to: { device: 'Powered monitors ×2', port: 'INPUT (XLR female)' },
    choices: [
      { id: 'a', name: 'Two balanced TRS-to-XLR cables', a: 'trs_quarter', b: 'xlr3', verdict: 'correct', explain: 'Balanced out to balanced in, one cable per monitor. Different plugs on each end, same balanced construction inside.' },
      { id: 'b', name: 'Two TS instrument cables with TS-to-XLR adapters', a: 'ts_quarter', b: 'xlr3', verdict: 'bal_unbal', explain: 'The TS plug grounds the balanced input’s inverting leg — it usually passes sound but throws away the noise rejection you paid for. The adapter converted the fit, not the signal.' },
      { id: 'c', name: 'Two 1/4-inch speaker cables with adapters', a: 'ts_speaker_legacy', b: 'xlr3', verdict: 'wrong_construction', explain: 'Powered monitors take LINE level on shielded cable — unshielded speaker cable is built for a different job and invites hum.' },
      { id: 'd', name: 'One TOSLINK optical cable', a: 'toslink', b: 'toslink', verdict: 'no_fit', explain: 'Neither the interface’s analog outs nor the monitors’ XLR inputs are optical ports.' },
    ],
  },
  {
    id: 's06_mixer_powered',
    title: 'Mixer → powered loudspeaker',
    brief: 'The mixer’s main XLR output feeds a powered (self-amplified) PA speaker 20 m away.',
    from: { device: 'Mixer', port: 'MAIN OUT L (XLR male)' },
    to: { device: 'Powered loudspeaker', port: 'INPUT (XLR/combo)' },
    choices: [
      { id: 'a', name: 'XLR cable — balanced shielded pair', a: 'xlr3', b: 'xlr3', verdict: 'correct', explain: 'A powered speaker takes LINE level — its amplifier is inside the box. Balanced XLR handles the 20 m run quietly.' },
      { id: 'b', name: 'speakON speaker cable with an adapter', a: 'speakon_nl4', b: 'xlr3', verdict: 'wrong_construction', explain: 'speakON cable is for amplifier POWER runs to passive speakers. A powered speaker’s input wants a line-level signal on shielded cable — the adapter changed the plug, not the job.' },
      { id: 'c', name: 'RCA interconnect with adapters', a: 'rca', b: 'rca', verdict: 'bal_unbal', explain: 'Unbalanced consumer cable on a 20 m stage run collects hum and buzz. It may pass signal; it will not pass it quietly.' },
      { id: 'd', name: 'Category network cable', a: 'ethernet_8p8c', b: 'ethernet_8p8c', verdict: 'no_fit', explain: 'Neither end is a network port. Data cable has its own scenarios.' },
    ],
  },
  {
    id: 's07_amp_passive',
    title: 'Power amplifier → passive loudspeaker',
    brief: 'A rack power amplifier drives a passive PA cabinet. This is amplifier POWER, not signal.',
    from: { device: 'Power amplifier', port: 'CH A OUTPUT (speakON)' },
    to: { device: 'Passive loudspeaker', port: 'INPUT (speakON)' },
    choices: [
      { id: 'a', name: 'speakON speaker cable — heavy-gauge two-conductor', a: 'speakon_nl4', b: 'speakon_nl4', verdict: 'correct', explain: 'Exactly what speakON exists for: latched, touch-safe contacts and heavy unshielded conductors sized for amplifier current.' },
      { id: 'b', name: '1/4-inch instrument cable with adapters', a: 'ts_quarter', b: 'ts_quarter', verdict: 'wrong_construction', explain: 'The classic damaging substitution in live sound: an instrument cable’s small conductor loses power and can heat and fail on amplifier duty. Never substitute instrument cable for speaker cable.' },
      { id: 'c', name: 'XLR mic cable with adapters', a: 'xlr3', b: 'xlr3', verdict: 'wrong_construction', explain: 'Mic cable is shielded small-gauge pair for tiny signals — amplifier power does not belong on it, whatever adapters make fit.' },
      { id: 'd', name: 'speakON cable, amp output → mixer LINE INPUT', a: 'speakon_nl4', b: 'xlr3', verdict: 'speaker_into_input', explain: 'Never. An amplifier output into any mic or line input can overdrive and damage the input circuitry — this is the one tray choice that risks equipment, not just the show.' },
    ],
    note: 'Speaker runs follow their own power rule: amplifier off before connecting or disconnecting speaker cables.',
  },
  {
    id: 's08_phones_headset',
    title: 'Headphones vs headset',
    brief: 'Two jobs at the same 3.5 mm jack: just LISTENING — or listening AND talking on a call.',
    from: { device: 'Laptop', port: 'Headset jack (3.5 mm TRRS)' },
    to: { device: 'On your head', port: 'Ears — and maybe a microphone' },
    choices: [
      { id: 'a', name: 'Headset on a TRRS plug (4 contacts) — for the call', a: 'trrs_35', b: 'trrs_35', verdict: 'correct', explain: 'The fourth contact IS the microphone path. Stereo down, mic back up, one plug — provided the headset’s wiring order (CTIA/OMTP) matches the jack.' },
      { id: 'b', name: 'Headphones on a TRS plug (3 contacts) — for the call', a: 'trs_35', b: 'trs_35', verdict: 'fits_but_verify', explain: 'It fits and music plays — but three contacts have no microphone path. Nothing failed; a capability is simply missing. Count the rings.' },
      { id: 'c', name: 'TRS extension cable in the middle of a headset run', a: 'trs_35', b: 'trrs_35', verdict: 'wrong_construction', explain: 'The 3-contact extension is built without the fourth conductor, so it physically drops the headset’s mic path — a chain’s contact count is only as good as its weakest cable.' },
      { id: 'd', name: '1/4-inch TRS headphone cable', a: 'trs_quarter', b: 'trs_quarter', verdict: 'no_fit', explain: 'The big brother does not fit the 3.5 mm jack without an adapter — and adapters never add a missing mic path.' },
    ],
  },
  {
    id: 's09_turntable',
    title: 'Turntable → phono input',
    brief: 'A turntable with a magnetic cartridge (PHONO output) connects to an amplifier.',
    from: { device: 'Turntable', port: 'OUTPUT (RCA pair) · PHONO level' },
    to: { device: 'Amplifier', port: 'PHONO input (RCA pair) with ground post' },
    choices: [
      { id: 'a', name: 'RCA stereo pair into the PHONO input (+ ground lead)', a: 'rca', b: 'rca', verdict: 'correct', explain: 'Phono level is millivolts with RIAA equalization — it needs the phono stage behind the PHONO jacks, and the ground lead stops the hum.' },
      { id: 'b', name: 'Same RCA pair into the CD/LINE input', a: 'rca', b: 'rca', verdict: 'wrong_level', explain: 'Identical plugs, wrong level: phono into a line input is faint and thin because the line input has no phono gain or RIAA curve. Fit was never the question.' },
      { id: 'c', name: 'RCA pair through a coaxial S/PDIF DIGITAL input', a: 'rca', b: 'rca', verdict: 'protocol', explain: 'The S/PDIF jack expects digital data, not analog millivolts — same shell, different world. Silence.' },
      { id: 'd', name: '3.5 mm TRS cable with RCA adapters into LINE', a: 'trs_35', b: 'rca', verdict: 'wrong_level', explain: 'However it is adapted, phono level into a line input stays faint and thin — an adapter converts fit, never level or equalization.' },
    ],
    note: 'If the turntable has a PHONO/LINE switch, the switch decides which input is right — check it before blaming the cable.',
  },
  {
    id: 's10_tv_soundbar',
    title: 'Television → receiver / soundbar',
    brief: 'The TV’s sound should play through the soundbar. Both have HDMI and optical connections.',
    from: { device: 'Television', port: 'HDMI port labeled ARC/eARC · OPTICAL OUT' },
    to: { device: 'Soundbar', port: 'HDMI ARC · OPTICAL IN' },
    choices: [
      { id: 'a', name: 'HDMI cable between the ARC/eARC-labeled ports', a: 'hdmi', b: 'hdmi', verdict: 'correct', explain: 'ARC/eARC sends the TV’s audio BACK down the HDMI cable to the soundbar — one cable, control included. It must be the marked port on both ends.' },
      { id: 'b', name: 'HDMI cable into a non-ARC HDMI input', a: 'hdmi', b: 'hdmi', verdict: 'protocol', explain: 'Identical connector, missing capability: a non-ARC port cannot return audio. The cable is fine; the port’s protocol support is what failed.' },
      { id: 'c', name: 'TOSLINK optical cable to OPTICAL IN', a: 'toslink', b: 'toslink', verdict: 'fits_but_verify', explain: 'Genuinely workable — optical carries the TV audio too. It is the fallback rather than the first choice here only because ARC also carries control and, on eARC, higher-bandwidth formats. Verify what each path supports.' },
      { id: 'd', name: 'RCA analog pair', a: 'rca', b: 'rca', verdict: 'no_fit', explain: 'Neither the TV output nor this soundbar exposes analog RCA audio for this job.' },
    ],
  },
  {
    id: 's11_computer_interface',
    title: 'Computer → USB audio interface',
    brief: 'A laptop records through a USB audio interface with a USB-C port.',
    from: { device: 'Laptop', port: 'USB-C port' },
    to: { device: 'Audio interface', port: 'USB-C port' },
    choices: [
      { id: 'a', name: 'The interface’s own USB-C data cable', a: 'usb_c', b: 'usb_c', verdict: 'correct', explain: 'A cable KNOWN to carry data at the needed rate — audio is data here, and the manufacturer shipped a cable that carries it.' },
      { id: 'b', name: 'A charge-only USB-C cable from a phone charger', a: 'usb_c', b: 'usb_c', verdict: 'fits_but_verify', explain: 'Identical plugs — but some USB-C cables are wired for power with minimal data. The interface may not even appear. All USB-C cables are NOT the same; verify the cable’s capability.' },
      { id: 'c', name: 'USB-A to USB-B printer-style cable', a: 'usb_a', b: 'usb_b', verdict: 'no_fit', explain: 'Neither end matches this laptop or this interface. USB’s shapes exist to stop wrong topologies.' },
      { id: 'd', name: 'HDMI cable', a: 'hdmi', b: 'hdmi', verdict: 'no_fit', explain: 'HDMI and USB do not mate — different connectors for different protocols.' },
    ],
  },
  {
    id: 's12_stagebox',
    title: 'Console → networked stagebox',
    brief: 'A digital console connects to its stagebox across the stage with one rugged data cable.',
    from: { device: 'Digital console', port: 'NETWORK / AUDIO PORT (etherCON)' },
    to: { device: 'Stagebox', port: 'NETWORK / AUDIO PORT (etherCON)' },
    choices: [
      { id: 'a', name: 'Ruggedized category cable with etherCON shells', a: 'ethercon_style', b: 'ethercon_style', verdict: 'correct', explain: 'Dozens of channels down four twisted pairs, in a shell that latches and shrugs off stage traffic. The cable must meet the system’s category specification.' },
      { id: 'b', name: 'Office patch cable from the IT drawer', a: 'ethernet_8p8c', b: 'ethernet_8p8c', verdict: 'fits_but_verify', explain: 'It fits and may pass — but an unlatched, light-duty cable of unknown category on the one link carrying EVERY channel of the show is a gamble. Verify category, then choose the rugged cable anyway.' },
      { id: 'c', name: 'XLR mic cable', a: 'xlr3', b: 'xlr3', verdict: 'no_fit', explain: 'The network port will not accept an XLR — this link is data, not an analog channel.' },
      { id: 'd', name: 'The SAME cable into an office network switch', a: 'ethercon_style', b: 'ethernet_8p8c', verdict: 'protocol', explain: 'Some console↔stagebox links are real Ethernet; others are proprietary point-to-point protocols that only LOOK like it. Into the wrong network, nothing routes — check the system’s documentation, not the connector.' },
    ],
    note: 'One data cable now does what a 48-channel copper snake did — which is exactly why its specification and condition matter more, not less.',
  },
];
