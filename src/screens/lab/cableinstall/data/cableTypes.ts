/**
 * Cable Dressing & Installation Lab — CABLE TYPE CARDS (Module 2 workbench).
 *
 * Teaching stance: installation method FOLLOWS cable type and use case. Each
 * card carries the signal/application, whether it's typically permanent or
 * temporary (many are both — that is itself a lesson), and the PRIMARY
 * installation concerns an installer must check before routing it. No numeric
 * limits live here — those always come from the specific cable's manufacturer
 * documentation (see rules R-MECH-*).
 *
 * Training visualization colors — actual field cable colors vary (stated in
 * the UI wherever these tints render).
 */

export type CiCableClass =
  | 'mic'
  | 'line'
  | 'unbalanced'
  | 'speaker'
  | 'power'
  | 'network'
  | 'poe'
  | 'fiber'
  | 'coax'
  | 'control'
  | 'multipair'
  | 'snake'
  | 'tacfiber'
  | 'extension';

export type CiCableType = {
  id: CiCableClass;
  name: string;
  /** Training tint (visualization only — field colors vary). */
  tint: string;
  signal: string;
  use: 'permanent' | 'temporary' | 'both';
  useNote?: string;
  concerns: string[];
};

/** Training color language for cable classes — visualization ONLY. */
export const CI_CLASS_TINTS = {
  power: '#ff5a48',
  analog: '#4fd0e0',
  network: '#37d97b',
  speaker: '#ffd35e',
  fiber: '#c77dff',
  control: '#e0b25e',
} as const;

export const CI_CABLE_TYPES: CiCableType[] = [
  {
    id: 'mic',
    name: 'Microphone cable',
    tint: CI_CLASS_TINTS.analog,
    signal: 'Mic-level balanced analog audio (very low level)',
    use: 'both',
    useNote: 'Flexible stage cable is for portable use — permanent runs use cable rated for the space.',
    concerns: ['Low signal level → interference susceptibility', 'Shield integrity end to end', 'Strain relief at connectors', 'Flex life on stages'],
  },
  {
    id: 'line',
    name: 'Balanced line cable',
    tint: CI_CLASS_TINTS.analog,
    signal: 'Line-level balanced analog audio',
    use: 'both',
    concerns: ['Shield/drain termination practice', 'Routing near power and dimmed loads', 'Pair integrity', 'Documented both ends'],
  },
  {
    id: 'unbalanced',
    name: 'Unbalanced audio cable',
    tint: CI_CLASS_TINTS.analog,
    signal: 'Unbalanced (single-conductor + shield) audio',
    use: 'both',
    useNote: 'Most interference-prone audio interconnect — keep runs short and routes clean.',
    concerns: ['No common-mode rejection → route/length matter most', 'Shield is the return — damage = hum', 'Keep away from noisy sources'],
  },
  {
    id: 'speaker',
    name: 'Loudspeaker cable',
    tint: CI_CLASS_TINTS.speaker,
    signal: 'Amplifier output — real current',
    use: 'both',
    concerns: ['Conductor size vs. load & length', 'Connector integrity under current', 'Physical protection (it moves gear)', 'Never confuse with mic/line paths'],
  },
  {
    id: 'power',
    name: 'AC mains / power cable',
    tint: CI_CLASS_TINTS.power,
    signal: 'Mains power',
    use: 'both',
    useNote: 'Permanent electrical wiring must be installed by appropriately qualified personnel under applicable local requirements.',
    concerns: ['Electrical safety & approved cable type for the space', 'Physical protection', 'Planned relationship to signal routes', 'Applicable electrical code governs'],
  },
  {
    id: 'network',
    name: 'Ethernet / data cable',
    tint: CI_CLASS_TINTS.network,
    signal: 'Balanced twisted-pair data (increasingly carries audio — Dante/AVB/AES67)',
    use: 'both',
    concerns: ['Pair geometry — deformation degrades performance', 'Bend and pulling limits per spec', 'Bundle/termination quality', 'Category & rating match the application'],
  },
  {
    id: 'poe',
    name: 'PoE network cable',
    tint: CI_CLASS_TINTS.network,
    signal: 'Twisted-pair data + DC power to devices',
    use: 'permanent',
    concerns: ['Same geometry care as data pairs', 'Heat in large powered bundles — follow applicable guidance', 'Connector/termination quality carries power too'],
  },
  {
    id: 'fiber',
    name: 'Fiber-optic cable',
    tint: CI_CLASS_TINTS.fiber,
    signal: 'Optical — immune to EMI, fragile mechanically',
    use: 'both',
    concerns: ['Bend sensitivity (macro/micro bends)', 'Tensile load limits — pull on strength member, never the fiber', 'Connector cleanliness', 'Crush protection'],
  },
  {
    id: 'coax',
    name: 'Coaxial cable',
    tint: CI_CLASS_TINTS.control,
    signal: 'RF / video / digital audio (word clock, AES3-id, antenna feeds)',
    use: 'both',
    concerns: ['Impedance depends on geometry — kinks are permanent damage', 'Bend limits per spec', 'Connector quality dominates performance'],
  },
  {
    id: 'control',
    name: 'Control cable',
    tint: CI_CLASS_TINTS.control,
    signal: 'GPIO, serial, dimming/control protocols',
    use: 'both',
    concerns: ['Identify the protocol before routing', 'Some control (e.g. dimmer runs) is a NOISE SOURCE — plan neighbors', 'Documentation prevents mystery wires'],
  },
  {
    id: 'multipair',
    name: 'Multipair audio cable',
    tint: CI_CLASS_TINTS.analog,
    signal: 'Many balanced pairs in one jacket (installs, panels)',
    use: 'permanent',
    concerns: ['Heavier — support the weight, not the terminations', 'Larger bend behavior than single pairs', 'Per-pair identification is essential'],
  },
  {
    id: 'snake',
    name: 'Stage snake / loom',
    tint: CI_CLASS_TINTS.analog,
    signal: 'Portable multichannel audio trunk',
    use: 'temporary',
    concerns: ['Heavy — protect from traffic & casters', 'Coil and deploy properly (over-under for appropriate flexible cable)', 'Fan-out/connector strain'],
  },
  {
    id: 'tacfiber',
    name: 'Tactical fiber',
    tint: CI_CLASS_TINTS.fiber,
    signal: 'Ruggedized deployable optical trunk',
    use: 'temporary',
    concerns: ['Still fiber inside — respect bend/crush limits', 'Connector caps & cleanliness in the field', 'Manufacturer deployment/storage procedure governs'],
  },
  {
    id: 'extension',
    name: 'Temporary extension / portable power',
    tint: CI_CLASS_TINTS.power,
    signal: 'Temporary mains distribution (cords, cable assemblies)',
    use: 'temporary',
    useNote: 'Flexible cords are not a substitute for permanent building wiring.',
    concerns: ['Protection from traffic, doors, pinch points', 'Approved type & condition for the environment', 'Workplace/electrical rules apply to cord use'],
  },
];

export const cableTypeById = (id: CiCableClass) => CI_CABLE_TYPES.find((c) => c.id === id)!;
