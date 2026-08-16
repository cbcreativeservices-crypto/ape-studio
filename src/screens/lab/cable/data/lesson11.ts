/**
 * lesson11 data — "Final System Challenge" (owner spec 2026-08-15 §5.11).
 * Two complete routing challenges: SHOW A (small live show) and STUDIO B
 * (small recording studio). Pure data, zero React.
 *
 * SAFETY-CRITICAL CONTENT: every factual claim below is derived from the
 * VERIFIED connector records (data/connectors.*.ts) or from owner-ratified
 * lesson01 data — nothing new-authored. Wrong-pick feedback follows the owner
 * feedback spec: what was selected, why it fails, the category mismatch, the
 * correct choice, and the honest consequence class (never a bare "incorrect").
 * Consequences are technically proportionate — never dramatized (§5.4).
 */
import type { CarriedType } from '../cableTypes';
import { CHALLENGE_A_UNIT, CHALLENGE_B_UNIT } from '../cableTypes';
import { carriedLabel } from './lesson01';

// ─────────────────────────────────────────────────────────────────────────────
// Shared shapes

/** Honest consequence classes (owner spec §5.4/§5.11). */
export type ConsequenceClass = 'no_signal' | 'noise' | 'unreliable' | 'equipment_risk' | 'danger';

export const CONSEQUENCE_LABEL: Record<ConsequenceClass, string> = {
  no_signal: 'no signal',
  noise: 'noise / degraded signal',
  unreliable: 'unreliable connection',
  equipment_risk: 'equipment risk',
  danger: 'electrical danger',
};

/** Structurally identical to bits.Verdict — declared here so this file stays
 *  pure data with zero React-file imports. */
export type PickVerdict = 'correct' | 'accepted' | 'wrong';

export type ChallengeOption = {
  id: string;
  label: string;
  verdict: PickVerdict;
  /** Full feedback. Wrong picks: what was selected, why it fails, the
   *  category mismatch, and the correct choice — record-derived. */
  explain: string;
  /** Honest consequence class, rendered as its own line on wrong picks. */
  consequence?: ConsequenceClass;
};

export type ConnectionPick = {
  id: string;
  from: string;
  to: string;
  q1Label: string;
  q1: ChallengeOption[];
  q2Label: string;
  q2: ChallengeOption[];
};

export type OrderItem = {
  id: string;
  label: string;
  /** 1 = source/processor group, 2 = amplification group. Order is judged by
   *  the safety rule (all of group 1 before any of group 2) — the order inside
   *  a group is genuinely flexible, so the check does not pretend otherwise. */
  phase: 1 | 2;
};

export type PatchRow =
  | { id: string; label: string; fault: false; okExplain: string }
  | { id: string; label: string; fault: true; faultName: string; why: ChallengeOption[] };

export type PickStage = { kind: 'picks'; title: string; intro: string; picks: ConnectionPick[] };
export type OrderStage = {
  kind: 'order';
  title: string;
  intro: string;
  items: OrderItem[];
  solveExplain: string;
  wrongExplain: string;
};
export type FaultStage = { kind: 'faults'; title: string; intro: string; rows: PatchRow[] };
export type ChallengeStage = PickStage | OrderStage | FaultStage;

export type ChallengeDef = {
  id: 'A' | 'B';
  tabLabel: string;
  title: string;
  scene: string;
  /** Completion unit for af_cables (cableTypes CHALLENGE_*_UNIT). */
  unit: string;
  stages: ChallengeStage[];
  doneText: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Option helpers (labels for carried categories come from lesson01 so the two
// lessons can never drift apart)

function travels(
  id: CarriedType,
  verdict: PickVerdict,
  explain: string,
  consequence?: ConsequenceClass,
): ChallengeOption {
  return { id, label: carriedLabel(id), verdict, explain, consequence };
}

function cable(
  id: string,
  label: string,
  verdict: PickVerdict,
  explain: string,
  consequence?: ConsequenceClass,
): ChallengeOption {
  return { id, label, verdict, explain, consequence };
}

const Q1 = 'WHAT TRAVELS HERE?';
const Q2 = 'WHICH CABLE MAKES IT?';

// ─────────────────────────────────────────────────────────────────────────────
// CHALLENGE A — small live show
// ─────────────────────────────────────────────────────────────────────────────

const A_PICKS: ConnectionPick[] = [
  {
    id: 'a_mic1',
    from: 'Vocal microphone 1',
    to: 'Stage box CH 1',
    q1Label: Q1,
    q1: [
      travels(
        'mic_level',
        'correct',
        'A microphone puts out mic-level analog audio — thousandths of a volt, the most fragile signal in the room. The stage box carries it toward a preamp that raises it to working level.',
      ),
      travels(
        'line_level',
        'wrong',
        'You picked LINE-LEVEL AUDIO. A microphone does not produce line level — its output is thousandths of a volt, far below the working level professional gear trades in. Treated as line level, it arrives faint and has to be gained up. What must travel here is MIC-LEVEL AUDIO.',
        'noise',
      ),
      travels(
        'speaker_level',
        'wrong',
        'You picked LOUDSPEAKER-LEVEL AUDIO — a power amplifier’s output, whole volts with real current behind it. Nothing on this line has been amplified; a microphone produces thousandths of a volt. What must travel here is MIC-LEVEL AUDIO.',
        'no_signal',
      ),
      travels(
        'digital_audio',
        'wrong',
        'You picked DIGITAL AUDIO. This microphone’s output is analog — a continuously varying mic-level voltage, not data. An XLR shell CAN carry AES3 digital, which is exactly why you identify what travels before trusting the plug. What must travel here is MIC-LEVEL AUDIO.',
        'no_signal',
      ),
    ],
    q2Label: Q2,
    q2: [
      cable(
        'xlr',
        '3-pin XLR microphone cable',
        'correct',
        'A balanced XLR microphone cable — shielded twisted pair in a latching shell, the de-facto professional standard for microphone connections. Balanced rejection matters on a run this long.',
      ),
      cable(
        'ts_inst',
        '1/4-inch TS instrument cable',
        'wrong',
        'You picked a 1/4-inch TS instrument cable. It is unbalanced — one conductor plus shield — so it gives up the interference rejection a long mic run depends on, and its friction plug has no latch. The correct choice is a balanced XLR microphone cable.',
        'noise',
      ),
      cable(
        'spk_lead',
        'speakON-style loudspeaker lead',
        'wrong',
        'You picked a speakON-style loudspeaker lead. That family carries power-amplifier output only, and its shell does not even mate with microphone or line connectors — it exists so loudspeaker lines can never land where signals belong. The correct choice is a balanced XLR microphone cable.',
        'no_signal',
      ),
    ],
  },
  {
    id: 'a_gtr_di',
    from: 'Electric guitar',
    to: 'DI box',
    q1Label: Q1,
    q1: [
      travels(
        'instrument_level',
        'correct',
        'A passive pickup produces instrument-level audio that wants a high-impedance input — exactly what the DI box provides before converting the signal for the mic line.',
      ),
      travels(
        'mic_level',
        'wrong',
        'You picked MIC-LEVEL AUDIO. A pickup’s output is stronger than mic level and expects a high-impedance instrument input, not a mic preamp — the wrong input stage sounds weak and dull. What must travel here is INSTRUMENT-LEVEL AUDIO.',
        'noise',
      ),
      travels(
        'line_level',
        'wrong',
        'You picked LINE-LEVEL AUDIO. A passive pickup is weaker than line level and picky about the input that receives it — treated as line level it arrives weak and dull, the wrong input stage. What must travel here is INSTRUMENT-LEVEL AUDIO.',
        'noise',
      ),
      travels(
        'speaker_level',
        'wrong',
        'You picked LOUDSPEAKER-LEVEL AUDIO. Nothing here is amplified — that category belongs to a power amplifier’s output terminals, not an instrument’s pickup. What must travel here is INSTRUMENT-LEVEL AUDIO.',
        'no_signal',
      ),
    ],
    q2Label: Q2,
    q2: [
      cable(
        'ts_inst',
        '1/4-inch TS instrument cable',
        'correct',
        'A 1/4-inch TS instrument cable — a single shielded small-gauge conductor built to move a tiny high-impedance signal quietly.',
      ),
      cable(
        'ts_spk',
        'Speaker cable with 1/4-inch TS plugs',
        'wrong',
        'You picked a loudspeaker cable with 1/4-inch TS plugs. The plugs are identical, but the cable is two heavier unshielded conductors built for amplifier current — with no shield, an instrument-level signal riding it collects hum and buzz. The correct choice is a shielded TS instrument cable.',
        'noise',
      ),
      cable(
        'xlr',
        '3-pin XLR microphone cable',
        'wrong',
        'You picked an XLR microphone cable. A passive guitar’s output is an unbalanced 1/4-inch TS jack expecting a high-impedance instrument input — an XLR mic line is the wrong connector on one end and the wrong input stage on the other. The correct choice is a TS instrument cable into the DI.',
        'no_signal',
      ),
    ],
  },
  {
    id: 'a_di_box',
    from: 'DI box output',
    to: 'Stage box CH 3',
    q1Label: Q1,
    q1: [
      travels(
        'mic_level',
        'correct',
        'The DI converts the instrument signal for the mic line — what leaves its XLR output travels at mic level toward a preamp, like any microphone source.',
      ),
      travels(
        'instrument_level',
        'wrong',
        'You picked INSTRUMENT-LEVEL AUDIO — but that is what ENTERED the DI. The DI’s whole job is conversion: its XLR output feeds a mic line at mic level. What must travel here is MIC-LEVEL AUDIO.',
        'noise',
      ),
      travels(
        'line_level',
        'wrong',
        'You picked LINE-LEVEL AUDIO. The DI’s output is not the working line level gear trades in — it feeds the stage box’s mic channel, which expects a mic-level source into a preamp. What must travel here is MIC-LEVEL AUDIO.',
        'noise',
      ),
      travels(
        'digital_audio',
        'wrong',
        'You picked DIGITAL AUDIO. Nothing on this line is data — the DI passes an analog signal, converted for the mic line. What must travel here is MIC-LEVEL AUDIO.',
        'no_signal',
      ),
    ],
    q2Label: Q2,
    q2: [
      cable(
        'xlr',
        '3-pin XLR microphone cable',
        'correct',
        'DI box outputs are a standard XLR source — a balanced, latching mic-line connection, exactly what the stage box channel expects.',
      ),
      cable(
        'ts_inst',
        '1/4-inch TS instrument cable',
        'wrong',
        'You picked a TS instrument cable. It is unbalanced and unlatched — the run from the DI to the stage box is exactly where the balanced XLR mic line earns its keep. The correct choice is a balanced XLR cable.',
        'noise',
      ),
      cable(
        'rca',
        'RCA (phono) cable',
        'wrong',
        'You picked an RCA cable — an unbalanced consumer connector with friction-grip retention. The stage box channel is an XLR mic input; an RCA plug does not mate with it. The correct choice is a balanced XLR cable.',
        'no_signal',
      ),
    ],
  },
  {
    id: 'a_sbox_net',
    from: 'Stage box',
    to: 'Network switch',
    q1Label: Q1,
    q1: [
      travels(
        'network_audio',
        'correct',
        'The digital stage box moves many channels as networked audio — audio riding an ordinary computer network. The network AND the protocol must both match; the ports look like any network jack.',
      ),
      travels(
        'digital_audio',
        'wrong',
        'You picked DIGITAL AUDIO — the point-to-point formats like AES3 or S/PDIF. A stage box trunk carries MANY channels as NETWORKED AUDIO: audio on a computer network, where the protocol, not the connector, decides compatibility.',
        'no_signal',
      ),
      travels(
        'mic_level',
        'wrong',
        'You picked MIC-LEVEL AUDIO. Dozens of analog mic lines would need a multicore snake — this single network line carries them all as data after the stage box converts them. What travels here is NETWORKED AUDIO.',
        'no_signal',
      ),
      travels(
        'clock_sync',
        'wrong',
        'You picked CLOCK / SYNC — the timing reference that keeps digital devices sampling in step. That is not audio at all; this trunk carries the audio itself, as NETWORKED AUDIO.',
        'no_signal',
      ),
    ],
    q2Label: Q2,
    q2: [
      cable(
        'ethercon',
        'etherCON-style locking network trunk',
        'correct',
        'An etherCON-style locking network trunk — electrically standard Ethernet, mechanically armored and positively latched for stage duty. Push in until the shell latch clicks, then pull back gently to confirm.',
      ),
      cable(
        'enet',
        'Ethernet patch cable (8P8C)',
        'accepted',
        'Also defensible: an ordinary Ethernet patch cable is electrically the identical connection. What it gives up is the positive lock and the stage armor — an unlocked patch can vibrate or pull loose during a show. A reliability difference, not a signal difference.',
      ),
      cable(
        'xlr',
        '3-pin XLR cable',
        'wrong',
        'You picked an XLR cable. An analog XLR line carries ONE balanced channel; this trunk is a computer-network connection carrying many channels as data, on 8P8C network connectors an XLR cannot mate with. The correct choice is a locking network trunk.',
        'no_signal',
      ),
    ],
  },
  {
    id: 'a_net_mixer',
    from: 'Network switch',
    to: 'Digital mixer (front of house)',
    q1Label: Q1,
    q1: [
      travels(
        'network_audio',
        'correct',
        'Networked audio — the show’s channels riding the computer network into the mixer’s network port. Matching ports do not prove compatible equipment; the protocol decides.',
      ),
      travels(
        'control_data',
        'accepted',
        'Also defensible: mixer control and remote-control traffic ride the same network line. The connection carries networked audio AND control — one more reason the protocol, not the plug, defines a network connection.',
      ),
      travels(
        'line_level',
        'wrong',
        'You picked LINE-LEVEL AUDIO. A network port is not an analog input — nothing analog crosses this link, and an analog line cable cannot mate with it. What travels here is NETWORKED AUDIO.',
        'no_signal',
      ),
      travels(
        'digital_audio',
        'wrong',
        'You picked DIGITAL AUDIO — the point-to-point formats like AES3 or S/PDIF. This link is a network connection: many channels as network traffic, where the protocol decides compatibility. What travels here is NETWORKED AUDIO.',
        'no_signal',
      ),
    ],
    q2Label: Q2,
    q2: [
      cable(
        'enet',
        'Ethernet patch cable (8P8C)',
        'correct',
        'A standard Ethernet patch cable of adequate category — the latch tab clicks home, and at front of house it sits out of stage traffic.',
      ),
      cable(
        'ethercon',
        'etherCON-style locking network trunk',
        'accepted',
        'Equally valid: the locking shell adds mechanical protection and a positive latch, and changes nothing electrical. Pick by the exposure of the run and the connectors on the equipment.',
      ),
      cable(
        'phone_cord',
        'Telephone-style modular cord (6-position)',
        'wrong',
        'You picked a telephone-style modular cord. The narrower plug physically enters an 8P8C network jack but makes no working connection — and it can bend the jack’s outer contacts, leaving intermittent faults for the next proper cable. The correct choice is an Ethernet patch cable.',
        'equipment_risk',
      ),
      cable(
        'usb',
        'USB cable',
        'wrong',
        'You picked a USB cable. USB is a host-to-peripheral connection with its own connector family — it does not mate with an 8P8C network port on either end. The correct choice is an Ethernet patch cable.',
        'no_signal',
      ),
    ],
  },
  {
    id: 'a_mix_mains',
    from: 'Digital mixer main outputs',
    to: 'Powered main loudspeakers',
    q1Label: Q1,
    q1: [
      travels(
        'line_level',
        'correct',
        'A powered loudspeaker amplifies INSIDE the cabinet, so the mixer sends it line-level audio. Its power arrives separately, on a mains cable — two connections, two different things traveling.',
      ),
      travels(
        'speaker_level',
        'wrong',
        'You picked LOUDSPEAKER-LEVEL AUDIO. There is no external power amplifier on this line — the powered cabinet amplifies internally and expects line level at its input. Speaker-level voltage into a line input can overdrive and damage the input circuitry. What travels here is LINE-LEVEL AUDIO.',
        'equipment_risk',
      ),
      travels(
        'ac_mains',
        'wrong',
        'You picked AC MAINS POWER. The cabinet’s power arrives on its own mains cordset into its power inlet — never through the signal connector. Keeping power and signal on separate connections is the point of this design. What travels here is LINE-LEVEL AUDIO.',
        'danger',
      ),
      travels(
        'network_audio',
        'wrong',
        'You picked NETWORKED AUDIO. This feed is the analog line connection the cabinet’s input expects — the network stayed behind at the mixer. What travels here is LINE-LEVEL AUDIO.',
        'no_signal',
      ),
    ],
    q2Label: Q2,
    q2: [
      cable(
        'xlr',
        'Balanced XLR line cables',
        'correct',
        'Balanced XLR line cables — powered loudspeaker inputs are a standard XLR destination, latched and balanced for the long run to the mains.',
      ),
      cable(
        'spk_lead',
        'speakON-style loudspeaker lead',
        'wrong',
        'You picked a speakON-style loudspeaker lead. That carries power-amplifier output to PASSIVE cabinets — it is not how a line-level feed reaches a powered loudspeaker, and it does not mate with an XLR line input. The correct choice is a balanced XLR line cable.',
        'no_signal',
      ),
      cable(
        'ts_inst',
        '1/4-inch TS instrument cables',
        'wrong',
        'You picked TS instrument cables — unbalanced and unlatched. On a long main feed they give up interference rejection, and the friction plugs pull out under foot traffic. The correct choice is balanced, latching XLR line cables.',
        'unreliable',
      ),
    ],
  },
  {
    id: 'a_ac_main',
    from: 'Wall receptacle',
    to: 'Powered main loudspeaker',
    q1Label: Q1,
    q1: [
      travels(
        'ac_mains',
        'correct',
        'Wall power — AC mains. It runs the cabinet’s internal amplifier and shares nothing with the signal connection beside it. It is dangerous to handle carelessly, and it never shares a connector with signal.',
      ),
      travels(
        'speaker_level',
        'wrong',
        'You picked LOUDSPEAKER-LEVEL AUDIO. A powered cabinet contains its own amplifier — no speaker-level line ever reaches it, and loudspeaker and mains connections are never interchangeable in either direction. What travels here is AC MAINS POWER.',
        'danger',
      ),
      travels(
        'line_level',
        'wrong',
        'You picked LINE-LEVEL AUDIO — but that is the SIGNAL connection, arriving separately on XLR. What comes out of a wall receptacle is mains voltage, whatever it gets called; treat every wall line as power. What travels here is AC MAINS POWER.',
        'danger',
      ),
      travels(
        'dc_power',
        'wrong',
        'You picked LOW-VOLTAGE DC POWER. Wall receptacles supply AC mains — low-voltage DC exists only after a power adapter built for a specific device. Treating a mains line as harmless low voltage is how mains gets handled carelessly. What travels here is AC MAINS POWER.',
        'danger',
      ),
    ],
    q2Label: Q2,
    q2: [
      cable(
        'iec',
        'IEC C13/C14 detachable mains cordset',
        'correct',
        'A detachable IEC C13/C14 cordset into the cabinet’s power inlet — three conductors: line, neutral and protective earth. The printed rating on the cord jacket governs, and a damaged mains cord leaves service immediately.',
      ),
      cable(
        'pcon',
        'powerCON-type locking mains cordset',
        'accepted',
        'Also defensible: many stage cabinets carry a locking powerCON-type inlet instead — the inlet on the equipment decides which cordset is right. Same seriousness either way: it is a mains connection, de-energized before connecting or disconnecting.',
      ),
      cable(
        'spk_lead',
        'speakON-style loudspeaker lead',
        'wrong',
        'You picked a speakON-style loudspeaker lead. It is NEVER a mains connector — the twist-lock resemblance to power connectors is a look-alike, not an equivalence, and no adapter between loudspeaker and mains connections is ever acceptable. The correct choice is the mains cordset made for the cabinet’s power inlet.',
        'danger',
      ),
      cable(
        'ts_inst',
        '1/4-inch TS instrument cable',
        'wrong',
        'You picked an instrument cable. Signal connectors never carry mains power — an instrument cable is neither built nor insulated for wall voltage, and using signal connectors for mains is never acceptable. The correct choice is a proper mains cordset.',
        'danger',
      ),
    ],
  },
  {
    id: 'a_mix_amp',
    from: 'Digital mixer monitor send',
    to: 'Power amplifier input',
    q1Label: Q1,
    q1: [
      travels(
        'line_level',
        'correct',
        'The mixer’s monitor send is a line-level output feeding the amplifier’s input — the working level professional gear trades in.',
      ),
      travels(
        'speaker_level',
        'wrong',
        'You picked LOUDSPEAKER-LEVEL AUDIO — but that is what leaves the amplifier’s OUTPUT terminals. Nothing at speaker level ever feeds an input: speaker-level voltage into an input can overdrive and damage its circuitry. What travels here is LINE-LEVEL AUDIO.',
        'equipment_risk',
      ),
      travels(
        'mic_level',
        'wrong',
        'You picked MIC-LEVEL AUDIO. A mixer output is far above mic level — and the amplifier’s input expects a line-level source, not a fragile mic signal needing a preamp. What travels here is LINE-LEVEL AUDIO.',
        'noise',
      ),
      travels(
        'network_audio',
        'wrong',
        'You picked NETWORKED AUDIO. The network ends at the mixer — this send is an analog line-level connection into the amplifier. What travels here is LINE-LEVEL AUDIO.',
        'no_signal',
      ),
    ],
    q2Label: Q2,
    q2: [
      cable(
        'xlr',
        'Balanced XLR line cable',
        'correct',
        'A balanced XLR line cable — amplifier and processor inputs are a standard XLR destination, latched and interference-rejecting for the run to the amp rack.',
      ),
      cable(
        'rca',
        'RCA (phono) cable',
        'wrong',
        'You picked an RCA cable — unbalanced only, friction-grip, keep-runs-short territory. For a monitor feed crossing a stage, the balanced, latching XLR line is the correct choice.',
        'noise',
      ),
      cable(
        'spk_lead',
        'speakON-style loudspeaker lead',
        'wrong',
        'You picked a speakON-style loudspeaker lead — but that family carries the amplifier’s OUTPUT. Its input side is a line-level connection on XLR; one connector family per side keeps the two levels from ever meeting. The correct choice is a balanced XLR line cable.',
        'no_signal',
      ),
    ],
  },
  {
    id: 'a_amp_mon',
    from: 'Power amplifier output',
    to: 'Passive stage monitor',
    q1Label: Q1,
    q1: [
      travels(
        'speaker_level',
        'correct',
        'An amplifier’s output is loudspeaker-level — volts of drive with real current. It belongs only on loudspeaker terminals, over speaker cable sized for the job.',
      ),
      travels(
        'line_level',
        'wrong',
        'You picked LINE-LEVEL AUDIO — but that is what FED the amplifier. What leaves it is loudspeaker-level drive; treating this line as line level invites patching it into an input, and speaker-level voltage into an input can damage it. What travels here is LOUDSPEAKER-LEVEL AUDIO.',
        'equipment_risk',
      ),
      travels(
        'mic_level',
        'wrong',
        'You picked MIC-LEVEL AUDIO. A passive monitor needs an amplifier’s drive — mic level is thousandths of a volt, and almost nothing audible would result. What travels here is LOUDSPEAKER-LEVEL AUDIO.',
        'no_signal',
      ),
      travels(
        'ac_mains',
        'wrong',
        'You picked AC MAINS POWER. The amplifier’s output is audio drive, not mains — and loudspeaker and mains connections are never interchangeable, in either direction. What travels here is LOUDSPEAKER-LEVEL AUDIO.',
        'danger',
      ),
    ],
    q2Label: Q2,
    q2: [
      cable(
        'spk_lead',
        'speakON-style loudspeaker lead',
        'correct',
        'A speakON-style loudspeaker lead — two heavier unshielded conductors sized for the current, in a twist-locking, touch-protected shell. Insert, twist until it clicks, and confirm the lock with a gentle tug — with the line muted or powered down.',
      ),
      cable(
        'ts_inst',
        '1/4-inch TS instrument cable',
        'wrong',
        'You picked a 1/4-inch TS instrument cable. Its single shielded small-gauge conductor is built for tiny signals, not amplifier current: on a loudspeaker run it loses power in the small conductor, can heat at higher power, and can fail — putting the amplifier at risk. The correct choice is a loudspeaker lead.',
        'equipment_risk',
      ),
      cable(
        'iec',
        'IEC mains cordset',
        'wrong',
        'You picked a mains cordset. Mains cordsets carry wall power — a mains connector never lands on loudspeaker wiring, and no adapter between loudspeaker and mains connections is ever acceptable. The correct choice is a loudspeaker lead.',
        'danger',
      ),
      cable(
        'xlr',
        '3-pin XLR microphone cable',
        'wrong',
        'You picked an XLR microphone cable — a shielded twisted pair for mic-level signals. It does not mate with a speakON output, and its small shielded conductors are not loudspeaker cable in any case. The correct choice is a loudspeaker lead.',
        'no_signal',
      ),
    ],
  },
];

const A_ORDER: OrderStage = {
  kind: 'order',
  title: 'POWER-UP SEQUENCE',
  intro:
    'Everything is cabled. Tap the equipment in the order it should power up — numbered badges show your sequence, and tapping an item again removes it. When all five are ordered, confirm.',
  items: [
    { id: 'net', label: 'Network switch & stage box', phase: 1 },
    { id: 'computer', label: 'Computer (playback & control)', phase: 1 },
    { id: 'mixer', label: 'Digital mixer', phase: 1 },
    { id: 'amp', label: 'Power amplifier (stage monitor)', phase: 2 },
    { id: 'mains', label: 'Powered main loudspeakers', phase: 2 },
  ],
  solveExplain:
    'Sources and processors first, amplification LAST — whatever the upstream equipment does as it wakes happens while nothing is amplifying it into the room. Within the source group the exact order is flexible; the amplification rule is not. Power-down runs in REVERSE: amplifiers and powered loudspeakers off FIRST, sources last.',
  wrongExplain:
    'Not yet. The rule: every source and processor powers up BEFORE anything that amplifies — the power amplifier and the powered mains come up last, so nothing upstream is amplified into the room as it wakes. Within the source group the exact order is flexible. The sequence has been cleared — order it again.',
};

const A_FAULTS: FaultStage = {
  kind: 'faults',
  title: 'FAULT HUNT',
  intro:
    'The show is patched — but ONE connection in this list is wrong. Read it line by line, tap the faulty connection, then name exactly why it fails.',
  rows: [
    {
      id: 'af_mic1',
      label: 'Vocal mic 1 → Stage box CH 1 — balanced XLR microphone cable',
      fault: false,
      okExplain:
        'That line is sound: a mic-level source on a balanced, latching XLR microphone cable — the standard mic connection.',
    },
    {
      id: 'af_mic2',
      label: 'Vocal mic 2 → Stage box CH 2 — balanced XLR microphone cable',
      fault: false,
      okExplain:
        'That line is sound: same as channel 1 — mic level on a balanced XLR mic cable into the stage box.',
    },
    {
      id: 'af_gtr',
      label: 'Electric guitar → DI box → Stage box CH 3 — TS instrument cable into the DI, XLR out',
      fault: false,
      okExplain:
        'That line is sound: instrument level rides shielded instrument cable into the DI, which converts it for the mic line on a balanced XLR.',
    },
    {
      id: 'af_net',
      label: 'Stage box → Network switch → Digital mixer — locking network trunk lines',
      fault: false,
      okExplain:
        'That line is sound: networked audio on locked etherCON-style trunk connections — electrically standard Ethernet with stage-worthy retention.',
    },
    {
      id: 'af_comp',
      label: 'Computer (playback) → Network switch — Ethernet patch cable',
      fault: false,
      okExplain:
        'That line is sound: the computer joins the audio network on a standard Ethernet patch cable — the protocol, not the plug, is what makes it audio.',
    },
    {
      id: 'af_mains',
      label: 'Mixer main outputs → Powered mains — balanced XLR line cables; power from the wall on IEC cordsets',
      fault: false,
      okExplain:
        'That line is sound: line level to the powered cabinets on XLR, power arriving separately from the wall — signal and power on separate connections, as they must be.',
    },
    {
      id: 'af_amp_mon',
      label: 'Power amplifier output → Passive stage monitor — 1/4-inch instrument cable',
      fault: true,
      faultName: 'Instrument cable on a loudspeaker run',
      why: [
        {
          id: 'why_current',
          label: 'Wrong cable construction: an instrument cable cannot carry amplifier current',
          verdict: 'correct',
          explain:
            'Exactly. An instrument cable is a single shielded small-gauge conductor built for tiny signals. Under amplifier current it loses power in the small conductor, can heat at higher power, and can fail — a reliability problem that puts the amplifier at risk. This run needs loudspeaker cable: two heavier unshielded conductors sized for the job.',
          consequence: 'equipment_risk',
        },
        {
          id: 'why_fit',
          label: 'The plugs will not fit the amplifier or the monitor',
          verdict: 'wrong',
          explain:
            'They fit — older amplifiers and cabinets use exactly this 1/4-inch TS jack for loudspeaker connections, which is what makes this the classic wrong-cable trap. Fitting is never proof of correctness; the cable construction is the problem here.',
        },
        {
          id: 'why_hum',
          label: 'The cable is unbalanced, so the monitor will hum',
          verdict: 'wrong',
          explain:
            'Noise is not the issue — loudspeaker runs are unbalanced by nature. The issue is CURRENT: the small shielded conductor is not built to carry amplifier output. That is a heat-and-failure problem, not a hum problem.',
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CHALLENGE B — small recording studio
// ─────────────────────────────────────────────────────────────────────────────

const B_PICKS: ConnectionPick[] = [
  {
    id: 'b_mic',
    from: 'Vocal microphone',
    to: 'Interface input 1 (combo)',
    q1Label: Q1,
    q1: [
      travels(
        'mic_level',
        'correct',
        'Mic-level analog audio — thousandths of a volt into the combo input’s mic-gain path, where the interface’s preamp raises it to working level.',
      ),
      travels(
        'instrument_level',
        'wrong',
        'You picked INSTRUMENT-LEVEL AUDIO — a pickup’s output wanting a high-impedance instrument input. A microphone’s output is weaker still: mic level, into the mic-gain path. What must travel here is MIC-LEVEL AUDIO.',
        'noise',
      ),
      travels(
        'line_level',
        'wrong',
        'You picked LINE-LEVEL AUDIO. A microphone produces thousandths of a volt — far below line level; sending it into a line path leaves it faint and gained-up. What must travel here is MIC-LEVEL AUDIO.',
        'noise',
      ),
      travels(
        'digital_audio',
        'wrong',
        'You picked DIGITAL AUDIO. The microphone’s output is analog — the conversion to data happens inside the interface, one connection later. What must travel here is MIC-LEVEL AUDIO.',
        'no_signal',
      ),
    ],
    q2Label: Q2,
    q2: [
      cable(
        'xlr',
        '3-pin XLR microphone cable',
        'correct',
        'A balanced XLR microphone cable into the combo receptacle’s XLR path — the mic-gain path, with phantom power routed as the interface documentation defines.',
      ),
      cable(
        'ts_inst',
        '1/4-inch TS instrument cable',
        'wrong',
        'You picked a TS instrument cable. A 1/4-inch plug enters the combo’s OTHER electrical path — typically line or instrument gain, with phantom conventionally on the XLR pins only. The mic belongs on the XLR path, on a balanced microphone cable.',
        'noise',
      ),
      cable(
        'rca',
        'RCA (phono) cable',
        'wrong',
        'You picked an RCA cable — an unbalanced consumer connector. A combo receptacle accepts XLR in the center and a 1/4-inch plug in the bore; an RCA plug mates with neither path. The correct choice is a balanced XLR microphone cable.',
        'no_signal',
      ),
    ],
  },
  {
    id: 'b_gtr_di',
    from: 'Electric guitar',
    to: 'DI box',
    q1Label: Q1,
    q1: [
      travels(
        'instrument_level',
        'correct',
        'A passive pickup produces instrument-level audio that wants a high-impedance input — exactly what the DI box provides before converting the signal for the mic line.',
      ),
      travels(
        'mic_level',
        'wrong',
        'You picked MIC-LEVEL AUDIO. A pickup’s output is stronger than mic level and expects a high-impedance instrument input — the wrong input stage sounds weak and dull. What must travel here is INSTRUMENT-LEVEL AUDIO.',
        'noise',
      ),
      travels(
        'line_level',
        'wrong',
        'You picked LINE-LEVEL AUDIO. A passive pickup is weaker than line level and picky about the input that receives it. What must travel here is INSTRUMENT-LEVEL AUDIO.',
        'noise',
      ),
      travels(
        'headphone_level',
        'wrong',
        'You picked HEADPHONE AUDIO — a small amplifier’s output for driving earcups. A pickup is not an amplifier output of any kind. What must travel here is INSTRUMENT-LEVEL AUDIO.',
        'no_signal',
      ),
    ],
    q2Label: Q2,
    q2: [
      cable(
        'ts_inst',
        '1/4-inch TS instrument cable',
        'correct',
        'A 1/4-inch TS instrument cable — a single shielded small-gauge conductor built to move a tiny high-impedance signal quietly.',
      ),
      cable(
        'ts_spk',
        'Speaker cable with 1/4-inch TS plugs',
        'wrong',
        'You picked a loudspeaker cable with identical TS plugs. It has no shield — two heavier unshielded conductors built for amplifier current — so the instrument signal riding it collects hum and buzz. The correct choice is a shielded TS instrument cable.',
        'noise',
      ),
      cable(
        'rca',
        'RCA (phono) cable',
        'wrong',
        'You picked an RCA cable — an unbalanced consumer connector. The guitar’s output and the DI’s input are 1/4-inch jacks; an RCA plug mates with neither end. The correct choice is a TS instrument cable.',
        'no_signal',
      ),
    ],
  },
  {
    id: 'b_di_iface',
    from: 'DI box output',
    to: 'Interface input 2 (combo, XLR path)',
    q1Label: Q1,
    q1: [
      travels(
        'mic_level',
        'correct',
        'The DI converts the instrument signal for the mic line — its XLR output feeds the interface’s mic-gain path at mic level, like any microphone source.',
      ),
      travels(
        'instrument_level',
        'wrong',
        'You picked INSTRUMENT-LEVEL AUDIO — that is what ENTERED the DI. Its XLR output leaves converted for the mic line. What must travel here is MIC-LEVEL AUDIO.',
        'noise',
      ),
      travels(
        'line_level',
        'wrong',
        'You picked LINE-LEVEL AUDIO. The DI feeds the interface’s mic-gain path, not a line input — its output travels at mic level toward the preamp. What must travel here is MIC-LEVEL AUDIO.',
        'noise',
      ),
      travels(
        'digital_audio',
        'wrong',
        'You picked DIGITAL AUDIO. The DI passes an analog signal — data begins inside the interface, not here. What must travel here is MIC-LEVEL AUDIO.',
        'no_signal',
      ),
    ],
    q2Label: Q2,
    q2: [
      cable(
        'xlr',
        '3-pin XLR microphone cable',
        'correct',
        'DI box outputs are a standard XLR source — balanced and latching, into the combo input’s XLR path.',
      ),
      cable(
        'ts_inst',
        '1/4-inch TS instrument cable',
        'wrong',
        'You picked a TS instrument cable. It would land on the combo’s 1/4-inch path — a different electrical path than the mic-gain path the DI output is meant for, and unbalanced besides. The correct choice is a balanced XLR cable.',
        'noise',
      ),
      cable(
        'spk_lead',
        'speakON-style loudspeaker lead',
        'wrong',
        'You picked a speakON-style loudspeaker lead — the power-amplifier output family. It does not mate with any input path on the interface; it exists so loudspeaker lines can never land where signals belong. The correct choice is a balanced XLR cable.',
        'no_signal',
      ),
    ],
  },
  {
    id: 'b_iface_mon',
    from: 'Interface line outputs',
    to: 'Powered monitors',
    q1Label: Q1,
    q1: [
      travels(
        'line_level',
        'correct',
        'The interface’s line outputs feed the powered monitors at line level — each cabinet amplifies internally, and its power arrives separately from the wall.',
      ),
      travels(
        'headphone_level',
        'wrong',
        'You picked HEADPHONE AUDIO — a small amplifier’s output, from the headphone jack. The line outputs are a different connection at line level; mixing the two up is one of this room’s classic miswires. What travels here is LINE-LEVEL AUDIO.',
        'noise',
      ),
      travels(
        'speaker_level',
        'wrong',
        'You picked LOUDSPEAKER-LEVEL AUDIO. Powered monitors amplify inside the cabinet — no speaker-level line ever reaches them, and speaker-level voltage into a line input can overdrive and damage it. What travels here is LINE-LEVEL AUDIO.',
        'equipment_risk',
      ),
      travels(
        'digital_audio',
        'wrong',
        'You picked DIGITAL AUDIO. The interface already converted — what leaves its line outputs is analog line level, which is what the monitors’ inputs expect. What travels here is LINE-LEVEL AUDIO.',
        'no_signal',
      ),
    ],
    q2Label: 'BALANCED OR UNBALANCED?',
    q2: [
      cable(
        'trs_bal',
        'Balanced TRS line cables',
        'correct',
        'Balanced TRS line cables — tip +, ring −, sleeve shield. The balanced connection rejects interference, which is why it is the default choice wherever the monitors provide balanced inputs.',
      ),
      cable(
        'xlr_bal',
        'Balanced XLR line cables',
        'accepted',
        'Equally correct where the monitors carry XLR inputs — the same balanced connection in a latching shell. Pick by the jacks on the equipment.',
      ),
      cable(
        'rca_unbal',
        'Unbalanced RCA cables',
        'accepted',
        'Also defensible where the monitors provide RCA inputs: it works, but unbalanced — keep the runs short and expect less interference rejection than the balanced choice gives you. That trade-off is the balanced-vs-unbalanced decision in one sentence.',
      ),
      cable(
        'spk_lead',
        'speakON-style loudspeaker lead',
        'wrong',
        'You picked a speakON-style loudspeaker lead. Powered monitors take a LINE-LEVEL feed — no loudspeaker-level line ever reaches them, and a speakON lead does not mate with a line input. The correct choice is a balanced line cable (TRS or XLR), or RCA where that is what the monitor offers.',
        'no_signal',
      ),
    ],
  },
  {
    id: 'b_hp',
    from: 'Interface headphone output',
    to: 'Headphones',
    q1Label: Q1,
    q1: [
      travels(
        'headphone_level',
        'correct',
        'Headphone audio — a small amplifier’s output, enough to drive earcups. Headphone outputs can reach levels harmful to hearing: set the volume low before putting headphones on, then raise it.',
      ),
      travels(
        'line_level',
        'wrong',
        'You picked LINE-LEVEL AUDIO. The headphone jack is driven by its own small amplifier — that is what makes it a headphone output; the line outputs are a separate connection. Treating one as the other is how monitors end up wired to the wrong jack. What travels here is HEADPHONE AUDIO.',
        'noise',
      ),
      travels(
        'speaker_level',
        'wrong',
        'You picked LOUDSPEAKER-LEVEL AUDIO. A headphone amplifier drives earcups — more than line level demands, far less than a loudspeaker needs. The categories differ by orders of magnitude. What travels here is HEADPHONE AUDIO.',
        'no_signal',
      ),
      travels(
        'dc_power',
        'wrong',
        'You picked LOW-VOLTAGE DC POWER. No power rides a headphone line — it carries audio from a small amplifier to the earcups. What travels here is HEADPHONE AUDIO.',
        'no_signal',
      ),
    ],
    q2Label: 'WHICH CONNECTION MAKES IT?',
    q2: [
      cable(
        'trs_st',
        'The headphones’ TRS plug (stereo wiring: tip left, ring right, sleeve common)',
        'correct',
        'The headphones’ own TRS plug in stereo wiring — tip left, ring right, sleeve common return. Same plug family as a balanced cable, entirely different job: the equipment on each end decides which job a TRS connection does.',
      ),
      cable(
        'trrs',
        '3.5 mm TRRS headset plug (via adapter)',
        'wrong',
        'You picked a TRRS headset plug. Its fourth contact is a microphone path this stereo jack does not provide — playback commonly works, but the mic is unavailable, and on some combinations audio is weak or one-sided because the ground lands on the wrong contact. The correct choice is the headphones’ own TRS stereo plug.',
        'unreliable',
      ),
      cable(
        'xlr',
        'XLR microphone cable',
        'wrong',
        'You picked an XLR microphone cable — a balanced mono mic-line connection. A headphone output is an unbalanced stereo jack; an XLR does not mate with it, and it carries one channel, not two. The correct choice is the headphones’ TRS stereo plug.',
        'no_signal',
      ),
    ],
  },
  {
    id: 'b_dc',
    from: 'DC power adapter',
    to: 'Interface DC inlet',
    q1Label: Q1,
    q1: [
      travels(
        'dc_power',
        'correct',
        'Low-voltage DC power from the adapter — voltage, polarity and current capacity must all match the device, and only the printed labels say what they are: on the supply, and beside the device jack.',
      ),
      travels(
        'ac_mains',
        'wrong',
        'You picked AC MAINS POWER. Mains stops at the adapter — the wall side. What travels from the adapter to the device is low-voltage DC. (Some adapters DO output AC from the same barrel — the label states which; one more reason the label, never the plug, governs.)',
        'equipment_risk',
      ),
      travels(
        'hybrid_power_data',
        'wrong',
        'You picked POWER + DATA TOGETHER. A barrel connector carries power only — there is no data path in it. Power-plus-data is USB or PoE territory. What travels here is LOW-VOLTAGE DC POWER.',
        'no_signal',
      ),
      travels(
        'line_level',
        'wrong',
        'You picked LINE-LEVEL AUDIO. Nothing on this line is audio — it is the device’s power feed, low-voltage DC from the adapter. What travels here is LOW-VOLTAGE DC POWER.',
        'no_signal',
      ),
    ],
    q2Label: 'WHICH SUPPLY MAKES IT?',
    q2: [
      cable(
        'dc_match',
        'The DC barrel supply whose label matches the device label',
        'correct',
        'The supply whose printed output matches the label beside the device jack — voltage, DC type, polarity symbol, and a current rating at or above the device’s requirement. Every item, every time; the plug fitting proves none of it.',
      ),
      cable(
        'dc_fits',
        'Any barrel supply whose plug fits the jack',
        'wrong',
        'You picked “any barrel that fits.” Fit proves nothing: identical plugs ship on 5 V, 9 V, 12 V and higher supplies, in both polarities, and in AC-output versions. Wrong voltage, AC on a DC input, or reversed polarity can damage the device immediately. The correct choice is the supply whose label matches the device label — every item.',
        'equipment_risk',
      ),
      cable(
        'usbc_pd',
        'A USB-C Power Delivery source',
        'wrong',
        'You picked a USB-C PD source. Some interfaces do accept USB-C power — the documentation defines that — but this inlet is a barrel jack: a USB-C plug does not mate with it, and capability lives in the equipment, not the plug shape. The correct choice is the labeled barrel supply.',
        'no_signal',
      ),
    ],
  },
];

const B_DATA: PickStage = {
  kind: 'picks',
  title: 'DATA & CONTROL',
  intro: 'Data and control have direction. For each connection, pick what travels — then which way around it runs.',
  picks: [
    {
      id: 'b_usb',
      from: 'Audio interface',
      to: 'Computer',
      q1Label: Q1,
      q1: [
        travels(
          'digital_audio',
          'correct',
          'The audio crosses as computer data — digital audio over USB. The interface converts; the computer records data.',
        ),
        travels(
          'hybrid_power_data',
          'accepted',
          'Also defensible: many interfaces draw their power back up the very same cable, which makes the connection a power-and-data hybrid.',
        ),
        travels(
          'line_level',
          'wrong',
          'You picked LINE-LEVEL AUDIO. Nothing analog crosses this link — line level lives on the interface’s analog jacks; the computer receives data. What travels here is DIGITAL AUDIO.',
          'no_signal',
        ),
        travels(
          'network_audio',
          'wrong',
          'You picked NETWORKED AUDIO — audio riding a computer network on Ethernet-based systems. USB is a host-to-peripheral connection, not a network. What travels here is DIGITAL AUDIO over USB.',
          'no_signal',
        ),
      ],
      q2Label: 'WHICH WAY AROUND?',
      q2: [
        cable(
          'usb_ok',
          'Type-A/C end to the computer, Type-B end to the interface',
          'correct',
          'USB is directional by shape: Type-A (or C) marks the HOST end — the computer — and the squarish Type-B socket lives on the peripheral. The keyed shapes exist so host and peripheral can never be confused.',
        ),
        cable(
          'usb_rev',
          'Type-B end to the computer, Type-A end to the interface',
          'wrong',
          'Backwards. Type-B is the PERIPHERAL end — the fixed socket on the interface — and the host end of the cable is A or C, facing the computer. The keying makes the reversal physically impossible to force: the shapes will not mate the wrong way round. The correct answer is A/C to the computer, B to the interface.',
          'no_signal',
        ),
        cable(
          'usb_any',
          'Either way — USB ends are interchangeable',
          'wrong',
          'They are not: the connector shapes are keyed to their roles precisely so a host port is never plugged into another host port. A or C faces the host; B (or the device’s own C/Micro-B socket) marks the peripheral.',
          'no_signal',
        ),
      ],
    },
    {
      id: 'b_midi',
      from: 'MIDI controller',
      to: 'Audio interface (5-pin DIN)',
      q1Label: Q1,
      q1: [
        travels(
          'control_data',
          'correct',
          'MIDI is control data — which note, how hard, which knob moved. No sound ever travels down a MIDI cable; the receiving equipment makes the sound when told to.',
        ),
        travels(
          'digital_audio',
          'wrong',
          'You picked DIGITAL AUDIO. A MIDI cable carries instructions, never audio — the audio appears wherever those instructions drive an instrument, through its own audio outputs. What travels here is CONTROL DATA.',
          'no_signal',
        ),
        travels(
          'mic_level',
          'wrong',
          'You picked MIC-LEVEL AUDIO. A MIDI cable can share the shielded two-conductor construction of a mic cable, but the systems are unrelated — what rides it is a one-way digital current loop of instructions. What travels here is CONTROL DATA.',
          'no_signal',
        ),
        travels(
          'clock_sync',
          'wrong',
          'You picked CLOCK / SYNC — the sample-timing reference between digital audio devices. That is a different system entirely; this DIN cable carries MIDI performance instructions. What travels here is CONTROL DATA.',
          'no_signal',
        ),
      ],
      q2Label: 'WHICH PORTS?',
      q2: [
        cable(
          'midi_ok',
          'Controller MIDI OUT → Interface MIDI IN',
          'correct',
          'Data flows one way: OUT of the sender, INTO the receiver — OUT→IN, always. The controller performs, so its OUT feeds the interface’s IN. Two-way communication would take a second cable.',
        ),
        cable(
          'midi_rev',
          'Controller MIDI IN → Interface MIDI OUT',
          'wrong',
          'That direction carries data INTO the controller — the interface would be the sender. The controller’s performance leaves through its OUT, into the interface’s IN. The correct hookup is OUT→IN, controller to interface.',
          'no_signal',
        ),
        cable(
          'midi_oo',
          'Controller MIDI OUT → Interface MIDI OUT',
          'wrong',
          'OUT to OUT does nothing — and harms nothing; both ends are senders. Data flows OUT→IN: the controller’s OUT into the interface’s IN.',
          'no_signal',
        ),
      ],
    },
  ],
};

const B_FAULTS: FaultStage = {
  kind: 'faults',
  title: 'FAULT HUNT',
  intro:
    'TWO connections in this patch list are wrong. Find both — tap a suspect line, then name exactly why it fails.',
  rows: [
    {
      id: 'bf_mic',
      label: 'Vocal mic → Interface input 1 — balanced XLR microphone cable into the combo’s XLR path',
      fault: false,
      okExplain:
        'That line is sound: mic level on a balanced XLR cable into the mic-gain path, with phantom routed as the interface documentation defines.',
    },
    {
      id: 'bf_gtr',
      label: 'Electric guitar → DI box → Interface input 2 — TS instrument cable in, XLR out',
      fault: false,
      okExplain:
        'That line is sound: instrument level on shielded instrument cable into the DI, converted for the mic line on a balanced XLR.',
    },
    {
      id: 'bf_usb',
      label: 'Interface ↔ Computer — USB cable, Type-B end at the interface',
      fault: false,
      okExplain:
        'That line is sound: digital audio (and often the interface’s power) as data, with the Type-B peripheral end at the interface and the host end at the computer.',
    },
    {
      id: 'bf_monL',
      label: 'Powered monitor LEFT — fed from the interface’s headphone jack with a TRS cable',
      fault: true,
      faultName: 'Monitor fed from the headphone output',
      why: [
        {
          id: 'bwhy_lr',
          label: 'A stereo headphone feed into a balanced input cancels the center of the mix',
          verdict: 'correct',
          explain:
            'Exactly. A headphone jack is an unbalanced STEREO output on one TRS plug. Into the monitor’s balanced input, left lands on the + leg and right on the − leg — and a balanced input amplifies the difference between its legs, so center-panned content largely cancels: thin, hollow sound with the vocal and bass nearly missing. Wrong connection, no damage. Feed each monitor from a line output.',
          consequence: 'noise',
        },
        {
          id: 'bwhy_dmg',
          label: 'Headphone level will damage the monitor’s input',
          verdict: 'wrong',
          explain:
            'No — this is a wrong connection, not a damaging one. The problem is wiring arithmetic: stereo on one plug meeting a balanced input that amplifies the difference between its legs. The fix is routing, not repair.',
        },
        {
          id: 'bwhy_fit',
          label: 'A TRS plug cannot mate with the monitor’s input',
          verdict: 'wrong',
          explain:
            'It mates perfectly — which is exactly the trap. The same TRS plug serves balanced mono and unbalanced stereo, and nothing on the plug distinguishes them. Fitting proves nothing; what the jack at each end does is what matters.',
        },
      ],
    },
    {
      id: 'bf_monR',
      label: 'Powered monitor RIGHT — fed from interface line output 2 with a balanced TRS cable',
      fault: false,
      okExplain:
        'That line is sound: a line output into the powered monitor’s balanced input on a balanced TRS cable. (Its LEFT-side partner is worth a second look.)',
    },
    {
      id: 'bf_midi',
      label: 'MIDI controller MIDI OUT → Interface MIDI IN — 5-pin DIN cable',
      fault: false,
      okExplain: 'That line is sound: control data flowing OUT→IN, the only direction MIDI data moves.',
    },
    {
      id: 'bf_dc',
      label: 'Interface DC inlet (label: 9 V DC, center-negative) — powered from a 12 V center-positive adapter whose barrel fits',
      fault: true,
      faultName: 'Wrong DC supply on a barrel that fits',
      why: [
        {
          id: 'bwhy_label',
          label: 'The supply label does not match the device label — wrong voltage AND polarity',
          verdict: 'correct',
          explain:
            'Exactly. The supply label and the device label must match on every item — voltage, DC type, polarity symbol, current. This one misses on voltage AND polarity, and a full fit with the wrong electrical spec can damage the device immediately. The barrel fitting proves nothing.',
          consequence: 'equipment_risk',
        },
        {
          id: 'bwhy_size',
          label: 'The barrel is the wrong size for the jack',
          verdict: 'wrong',
          explain:
            'It fits — that is the point. Barrel plugs carry no electrical information at all; identical plugs ship on 5 V, 9 V, 12 V and higher supplies, in both polarities. The label governs, never the fit.',
        },
        {
          id: 'bwhy_close',
          label: 'Only the voltage matters, and 12 V is close enough to 9 V',
          verdict: 'wrong',
          explain:
            'Voltage, polarity, DC-vs-AC type and current capacity must ALL match — and this supply is wrong on two of them. Overvoltage and reversed polarity are each individually able to damage equipment.',
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// The two challenges

export const CHALLENGE_A: ChallengeDef = {
  id: 'A',
  tabLabel: 'SHOW A',
  title: 'SMALL LIVE SHOW',
  scene:
    'Two vocal microphones · electric guitar into a DI box · stage box on a network trunk · network switch · digital mixer · computer for playback and control · two powered main loudspeakers · power amplifier driving one passive stage monitor · wall power.',
  unit: CHALLENGE_A_UNIT,
  stages: [
    {
      kind: 'picks',
      title: 'SIGNAL PATH',
      intro:
        'Every connection below names its two ends. Pick what must travel between them, then the cable that makes the connection. Wrong picks stay open — keep trying.',
      picks: A_PICKS,
    },
    A_ORDER,
    A_FAULTS,
  ],
  doneText: 'SHOW A cabled, powered in order, and the planted fault caught — challenge complete.',
};

export const CHALLENGE_B: ChallengeDef = {
  id: 'B',
  tabLabel: 'STUDIO B',
  title: 'SMALL RECORDING STUDIO',
  scene:
    'Vocal microphone · electric guitar into a DI box · audio interface · computer · headphones · two powered monitors · MIDI controller · wall power plus a DC supply for the interface.',
  unit: CHALLENGE_B_UNIT,
  stages: [
    {
      kind: 'picks',
      title: 'SIGNAL PATH',
      intro:
        'Route the studio: for each connection, pick what travels, then the cable. The monitor feed asks for a balanced-vs-unbalanced decision — choose what you can defend.',
      picks: B_PICKS,
    },
    B_DATA,
    B_FAULTS,
  ],
  doneText:
    'STUDIO B routed, data and control flowing the right way, and both planted faults caught — challenge complete.',
};

/** Lesson takeaway (LessonBanner idiom). */
export const L11_LESSON =
  'A system is cabled correctly when every connection can answer the core question — what travels here, on which cable, in which direction — with power and signal kept separate, amplification powered up last and down first, and no choice defended by “it fits.”';
