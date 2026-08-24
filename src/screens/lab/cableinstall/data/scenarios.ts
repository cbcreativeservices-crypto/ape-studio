/**
 * Cable Dressing & Installation Lab — SCENARIO DATA (spec §49).
 *
 * Everything the interaction engine consumes is authored here as data, so new
 * installations can be added without rewriting scenes. Simulated numeric
 * specifications are SCENARIO-SPECIFIC by design (spec §29): each exercise
 * hands the learner "this cable's / this support system's documentation" and
 * tests whether they FOLLOW the supplied spec — the professional behavior —
 * never a universal number. Zero React (house rule).
 */
import type { CiCableClass } from './cableTypes';
import type { CiRouteOption } from '../engine/routeEval';
import type { CiDim } from '../engine/score';
import type { CheckSpec } from '../../foundations/bits';

/* ── M2 — cable-in-scenario identification ────────────────────────────── */
export type CiIdScenario = {
  id: string;
  prompt: string;
  cable: CiCableClass;
  use: 'permanent' | 'temporary';
  pathway: string;
  pathwayOptions: string[];
  keyRisk: string;
  keyRiskOptions: string[];
  doc: string;
};

export const CI_ID_SCENARIOS: CiIdScenario[] = [
  {
    id: 'mic-perm',
    prompt: 'Permanent microphone line from a stage wall plate to the equipment room.',
    cable: 'mic',
    use: 'permanent',
    pathway: 'Building pathway (conduit / tray) rated for the spaces it crosses',
    pathwayOptions: [
      'Building pathway (conduit / tray) rated for the spaces it crosses',
      'Lie it above the ceiling tiles — it\'s low voltage',
      'Across the corridor floor under a mat',
    ],
    keyRisk: 'Low-level signal: interference exposure and shield integrity over a long run',
    keyRiskOptions: [
      'Low-level signal: interference exposure and shield integrity over a long run',
      'Overheating from signal current',
      'None — mic cable has no installation concerns',
    ],
    doc: 'Both ends labeled to the project scheme; run recorded in the cable schedule.',
  },
  {
    id: 'foh-temp',
    prompt: 'One-night concert: multichannel snake from the stage to front of house.',
    cable: 'snake',
    use: 'temporary',
    pathway: 'Perimeter route with a protected crossing only where unavoidable',
    pathwayOptions: [
      'Perimeter route with a protected crossing only where unavoidable',
      'Straight across the audience aisle — it\'s fastest',
      'Through the ceiling cavity for the night',
    ],
    keyRisk: 'Traffic: feet, carts and doors will attack it all night',
    keyRiskOptions: [
      'Traffic: feet, carts and doors will attack it all night',
      'EMI from the moving lights only',
      'Bend radius — snakes cannot turn corners',
    ],
    doc: 'Ends tagged (stage / FOH) so strike and troubleshooting are fast.',
  },
  {
    id: 'dante-perm',
    prompt: 'Permanent Dante audio-network run from a DSP rack to a stage box location.',
    cable: 'network',
    use: 'permanent',
    pathway: 'Telecom pathway (tray / J-hooks / conduit) per the project design',
    pathwayOptions: [
      'Telecom pathway (tray / J-hooks / conduit) per the project design',
      'Tie-wrapped along the sprinkler pipe — it goes the right way',
      'Loose on top of the HVAC duct',
    ],
    keyRisk: 'Pair geometry: deformation from crush/over-tension degrades the link',
    keyRiskOptions: [
      'Pair geometry: deformation from crush/over-tension degrades the link',
      'It might get too loud',
      'Nothing — data cable is indestructible',
    ],
    doc: 'Labeled both ends to the scheme; port + pathway recorded.',
  },
];

/* ── M3 — route planning (evaluated options) ───────────────────────────── */
export type CiRouteScenario = {
  id: string;
  title: string;
  brief: string;
  cable: CiCableClass;
  options: CiRouteOption[];
};

export const CI_ROUTE_SCENARIOS: CiRouteScenario[] = [
  {
    id: 'stage-to-rack',
    title: 'Stage input box → control-room rack',
    brief:
      'A permanent balanced audio multipair from the stage input panel to the control-room rack. Three candidate routes — judge the whole life of the cable, not the pull day.',
    cable: 'multipair',
    options: [
      {
        id: 'mech-shortcut',
        name: 'Shortest — through the mechanical bay',
        path: 'Straight line behind the stage wall, through the HVAC/mechanical bay, into the rack wall.',
        relLength: 1,
        flags: [
          { ruleId: 'plan-shortest-not-best', dim: 'routing', cost: 0.3, note: 'Shortest run — but distance was the ONLY thing it wins.' },
          { ruleId: 'mech-edges', dim: 'protection', cost: 0.45, note: 'Passes equipment that moves and sheet-metal edges — high mechanical exposure.' },
          { ruleId: 'plan-service-access', dim: 'serviceability', cost: 0.4, note: 'The mechanical bay is another trade\'s space — future access is not yours.' },
          { ruleId: 'emi-parallel-exposure', dim: 'signal', cost: 0.3, note: 'Runs beside motor loads for most of its length.' },
        ],
      },
      {
        id: 'tray-route',
        name: 'Cable tray via the corridor ceiling',
        path: 'Up to the corridor tray, along the accessible ceiling, down the riser sleeve into the rack.',
        relLength: 1.4,
        flags: [
          { ruleId: 'plan-defined-pathways', dim: 'routing', cost: 0.4, positive: true, note: 'Uses the pathway built for exactly this — supported, documented, expandable.' },
          { ruleId: 'plan-service-access', dim: 'serviceability', cost: 0.4, positive: true, note: 'Every foot reachable from the corridor — future service is easy.' },
          { ruleId: 'plan-capacity', dim: 'routing', cost: 0.1, note: 'Tray has room today — record the added fill.' },
        ],
      },
      {
        id: 'floor-shortcut',
        name: 'Across the hallway floor',
        path: 'Out the stage door, across the public hallway under a protector, into the control-room door.',
        relLength: 1.1,
        flags: [
          { ruleId: 'floor-walkways', dim: 'safety', cost: 0.7, note: 'A PERMANENT run across a public walking route — protector or not, this is wrong.' },
          { ruleId: 'wall-doorway', dim: 'protection', cost: 0.5, note: 'Two active doorways pinch it forever.' },
          { ruleId: 'floor-ramp-not-magic', dim: 'safety', cost: 0.3, note: 'A protector does not make a permanent public crossing acceptable.' },
        ],
      },
    ],
  },
  {
    id: 'amp-to-cluster',
    title: 'Amp room → loudspeaker cluster',
    brief:
      'Loudspeaker feeds from the amplifier rack to a flown center cluster. Consider the space each route crosses — and who must reach it later.',
    cable: 'speaker',
    options: [
      {
        id: 'catwalk',
        name: 'Riser + catwalk with J-hook run',
        path: 'Riser sleeve to the catwalk level, J-hook run along the catwalk, drop to the cluster point.',
        relLength: 1.3,
        flags: [
          { ruleId: 'sup-purpose-built', dim: 'routing', cost: 0.4, positive: true, note: 'Purpose-installed supports the whole way, anchored to structure.' },
          { ruleId: 'plan-service-access', dim: 'serviceability', cost: 0.4, positive: true, note: 'Catwalk access means the run can be serviced without a lift.' },
          { ruleId: 'fire-riser-spaces', dim: 'safety', cost: 0.1, note: 'Riser space: verify cable rating + the sleeve\'s penetration treatment.' },
        ],
      },
      {
        id: 'over-grid',
        name: 'Shortest — draped over the ceiling grid',
        path: 'Straight across the ceiling cavity, resting on grid members and tiles to the cluster point.',
        relLength: 1,
        flags: [
          { ruleId: 'sup-no-ceiling-tile', dim: 'safety', cost: 0.7, note: 'Resting on tiles and grid — a finish system carrying cable weight.' },
          { ruleId: 'ceil-span-sag', dim: 'routing', cost: 0.5, note: 'Long unsupported spans sag into lights and tiles.' },
          { ruleId: 'ceil-maintain-access', dim: 'serviceability', cost: 0.4, note: 'Every tile lift now fights your cable.' },
        ],
      },
      {
        id: 'duct-ride',
        name: 'Along the main supply duct',
        path: 'Tie the feeds along the big HVAC duct that happens to head toward the cluster.',
        relLength: 1.1,
        flags: [
          { ruleId: 'sup-purpose-built', dim: 'safety', cost: 0.6, note: 'The duct is another system — not a cable support.' },
          { ruleId: 'ceil-maintain-access', dim: 'serviceability', cost: 0.3, note: 'Duct service now requires cutting your feeds free.' },
        ],
      },
    ],
  },
];

/* ── M4 — mechanical exercises (scenario-specific simulated specs) ─────── */
export type CiBendExercise = {
  id: string;
  cable: CiCableClass;
  cableName: string;
  /** SIMULATED manufacturer line shown to the learner before the exercise. */
  specText: string;
  /** Installed min bend radius in "cable diameters" for the sim geometry. */
  minRadiusDia: number;
  note?: string;
};

/** Different cables bend differently — each exercise supplies ITS cable's
 *  simulated spec (never one universal ratio; spec §29). */
export const CI_BEND_EXERCISES: CiBendExercise[] = [
  { id: 'bend-mic', cable: 'mic', cableName: 'Copper audio (mic) cable', specText: 'SIMULATED SPEC — flexible audio cable, installed bend radius: ≥ 6× cable diameter.', minRadiusDia: 6 },
  { id: 'bend-utp', cable: 'network', cableName: 'Twisted-pair data cable', specText: 'SIMULATED SPEC — 4-pair data cable, installed bend radius: ≥ 4× cable diameter (pull-in: larger).', minRadiusDia: 4, note: 'Under pulling tension the same cable\'s limit is larger — this exercise is the INSTALLED condition.' },
  { id: 'bend-coax', cable: 'coax', cableName: 'Coaxial cable', specText: 'SIMULATED SPEC — flexible coax, installed bend radius: ≥ 10× cable diameter. Kinks are permanent damage.', minRadiusDia: 10 },
  { id: 'bend-fiber', cable: 'fiber', cableName: 'Fiber-optic cable', specText: 'SIMULATED SPEC — indoor fiber, installed bend radius: ≥ 15× cable diameter; never load the fiber in tension.', minRadiusDia: 15 },
];

export const CI_PULL_SPEC = {
  specText: 'SIMULATED SPEC — this cable\'s maximum pulling tension: 100 units, smooth pull only.',
  maxTension: 100,
  events: [
    { id: 'smooth', label: 'Steady smooth pull', tension: 55, ok: true, note: 'Within spec — steady force, cable moving.' },
    { id: 'snag', label: 'Pull harder through the snag', tension: 140, ok: false, ruleId: 'mech-pull-tension', note: 'Forcing a snag spikes tension past spec — stop and clear it instead.' },
    { id: 'corner', label: 'Hard yank around the corner', tension: 120, ok: false, ruleId: 'mech-bend-radius', note: 'Tension across a tight corner multiplies sidewall pressure at the bend.' },
    { id: 'connector', label: 'Pull it through by the connector', tension: 80, ok: false, ruleId: 'mech-no-connector-pull', note: 'Even in-spec force is wrong applied AT the termination.' },
  ],
} as const;

export const CI_RESTRAINT_ZONES = {
  /** Slider 0..1 → zone; deformation begins past `secureMax`. */
  looseMax: 0.3,
  secureMax: 0.7,
  notes: {
    loose: 'Loose — the bundle isn\'t supported or organized yet.',
    secure: 'Secure — held, organized, round. This is the job.',
    excessive: 'Excessive — the bundle is deforming. The restraint became the hazard.',
  },
} as const;

/* ── M5 — supports & pathways sort ─────────────────────────────────────── */
export type CiSupportItem = {
  id: string;
  name: string;
  ok: boolean;
  roles?: ('support' | 'pathway' | 'protection' | 'management')[];
  why: string;
  ruleId: string;
};

export const CI_SUPPORT_ITEMS: CiSupportItem[] = [
  { id: 'jhook', name: 'J-hook', ok: true, roles: ['support'], why: 'Purpose-built cable support, anchored to structure, spaced to its system criteria.', ruleId: 'sup-spacing-mfr' },
  { id: 'tray', name: 'Cable tray', ok: true, roles: ['support', 'pathway', 'protection'], why: 'Carries weight, defines the route, and partly protects — with fill limits.', ruleId: 'plan-capacity' },
  { id: 'ladder', name: 'Ladder rack', ok: true, roles: ['support', 'pathway'], why: 'Heavy-duty open pathway, common above racks.', ruleId: 'sup-purpose-built' },
  { id: 'basket', name: 'Wire basket', ok: true, roles: ['support', 'pathway'], why: 'Continuous support with easy adds — respect its fill.', ruleId: 'plan-capacity' },
  { id: 'conduit', name: 'Conduit (for this system)', ok: true, roles: ['pathway', 'protection'], why: 'Defined, protected route — fill and bends per applicable rules.', ruleId: 'plan-defined-pathways' },
  { id: 'raceway', name: 'Surface raceway', ok: true, roles: ['pathway', 'protection', 'management'], why: 'Finished-space pathway with fittings for every transition.', ruleId: 'wall-raceway-fill-transitions' },
  { id: 'underfloor', name: 'Underfloor pathway', ok: true, roles: ['pathway', 'protection'], why: 'Defined floor route — capacity and access planned in.', ruleId: 'plan-defined-pathways' },
  { id: 'vmgr', name: 'Vertical manager', ok: true, roles: ['management'], why: 'Organizes rack cable for service — it manages; supports carry.', ruleId: 'sup-roles' },
  { id: 'hmgr', name: 'Horizontal manager', ok: true, roles: ['management'], why: 'Per-RU organization at the patch field.', ruleId: 'sup-roles' },
  { id: 'strap', name: 'Approved strap / saddle', ok: true, roles: ['support'], why: 'Listed support hardware — wide bearing, no crush.', ruleId: 'mech-restraint-tension' },
  { id: 'protector', name: 'Floor cable protector', ok: true, roles: ['protection'], why: 'Protects a crossing FOR THE RIGHT LOADS — route rules still apply.', ruleId: 'floor-ramp-not-magic' },
  { id: 'plumbing', name: 'Plumbing pipe', ok: false, why: 'Another trade\'s system — never a cable support.', ruleId: 'sup-purpose-built' },
  { id: 'foreign-conduit', name: 'Another system\'s conduit', ok: false, why: 'Belongs to a different system — not yours to load or enter.', ruleId: 'sup-purpose-built' },
  { id: 'tile', name: 'Ceiling tile', ok: false, why: 'A finish surface — cable may not rest on it.', ruleId: 'sup-no-ceiling-tile' },
  { id: 'grid', name: 'Ceiling grid member / support wire', ok: false, why: 'Holds the ceiling up — not your cable.', ruleId: 'sup-no-ceiling-tile' },
  { id: 'sprinkler', name: 'Sprinkler pipe', ok: false, why: 'Life-safety system — loading it is a serious violation.', ruleId: 'sup-purpose-built' },
  { id: 'hanger', name: 'Unrelated hanger / loose hardware', ok: false, why: 'Unrated, unknown anchor — not a listed support.', ruleId: 'sup-purpose-built' },
];

export const CI_SUPPORT_SPACING_SPEC =
  'SIMULATED SUPPORT SYSTEM SPEC — this J-hook system, at this load: supports every 4 grid units, max sag ½ unit. (Real spacing comes from the support manufacturer + applicable standard.)';

/* ── M6 — rack ─────────────────────────────────────────────────────────── */
export type CiRackIssue = { id: string; mistakeId: string; label: string; /** rear-view zone 0..1 y */ zone: number };

/** Phase A bad rack — 14 findable issues (require 10). */
export const CI_RACK_ISSUES: CiRackIssue[] = [
  { id: 'ri-1', mistakeId: 'power-signal-mess', label: 'Power + mic lines twisted through each other', zone: 0.16 },
  { id: 'ri-2', mistakeId: 'connector-strain', label: 'XLR loom hanging its full weight on the DSP jacks', zone: 0.3 },
  { id: 'ri-3', mistakeId: 'slack-pile', label: 'A drum of excess Cat6 stuffed behind the switch', zone: 0.4 },
  { id: 'ri-4', mistakeId: 'unlabeled', label: 'Not one label on the patch field', zone: 0.1 },
  { id: 'ri-5', mistakeId: 'blocked-access', label: 'Amp rear blocked by a taut bundle', zone: 0.62 },
  { id: 'ri-6', mistakeId: 'blocked-vent', label: 'Loom dressed straight across the amp\'s intake', zone: 0.7 },
  { id: 'ri-7', mistakeId: 'crushed-by-tie', label: 'Ties cinched until the snake is oval', zone: 0.48 },
  { id: 'ri-8', mistakeId: 'sharp-bend', label: 'Cat6 folded 180° over a rail edge', zone: 0.22 },
  { id: 'ri-9', mistakeId: 'bad-rack-entry', label: 'Whole trunk dives over the raw top edge', zone: 0.04 },
  { id: 'ri-10', mistakeId: 'connector-strain', label: 'Power connectors levered sideways by the bundle', zone: 0.82 },
  { id: 'ri-11', mistakeId: 'hidden-loop', label: 'Service loops zip-tied where no hand fits', zone: 0.55 },
  { id: 'ri-12', mistakeId: 'slack-none', label: 'Interface lines bowstring-tight — zero slack', zone: 0.35 },
  { id: 'ri-13', mistakeId: 'label-mismatch', label: 'The two labels that exist disagree with each other', zone: 0.12 },
  { id: 'ri-14', mistakeId: 'power-signal-mess', label: 'AC distro feeds woven through the analog loom', zone: 0.88 },
];

export const CI_RACK_GROUPS: { id: string; name: string; tintKey: 'power' | 'analog' | 'network' | 'speaker' | 'control' | 'fiber'; zoneId: string }[] = [
  { id: 'g-ac', name: 'AC power', tintKey: 'power', zoneId: 'z-right' },
  { id: 'g-analog', name: 'Analog audio', tintKey: 'analog', zoneId: 'z-left' },
  { id: 'g-net', name: 'Network', tintKey: 'network', zoneId: 'z-left' },
  { id: 'g-spk', name: 'Loudspeaker out', tintKey: 'speaker', zoneId: 'z-right' },
  { id: 'g-ctl', name: 'Control', tintKey: 'control', zoneId: 'z-left' },
  { id: 'g-fib', name: 'Fiber', tintKey: 'fiber', zoneId: 'z-left' },
];

export const CI_RACK_ZONES: { id: string; name: string; note: string }[] = [
  { id: 'z-left', name: 'Left vertical manager', note: 'Signal-class side in this project\'s plan.' },
  { id: 'z-right', name: 'Right vertical manager', note: 'Power + high-current side in this project\'s plan.' },
  { id: 'z-entry', name: 'Top cable entry', note: 'Protected entry with strain relief.' },
  { id: 'z-hmgr', name: 'Horizontal manager', note: 'Patch-field organization row.' },
];

export const CI_RACK_PLAN_NOTE =
  'THIS PROJECT\'S PLAN — signal classes dress the left manager, AC power and speaker outputs dress the right. What matters is that a plan exists, classes stay separated, and the dressing follows it (side assignment itself is project-specific).';

/* ── M7 — walls ────────────────────────────────────────────────────────── */
export const CI_WALL_TYPES: { id: string; label: string; correctAction: string; actions: string[]; ruleId: string }[] = [
  {
    id: 'w-ordinary',
    label: 'Ordinary non-rated partition (verified from drawings)',
    correctAction: 'Sleeve/bushing the opening and route through',
    actions: ['Sleeve/bushing the opening and route through', 'Treat it as rated anyway and stop work', 'No opening treatment needed — bare drywall hole is fine'],
    ruleId: 'wall-bushings',
  },
  {
    id: 'w-rated',
    label: 'Fire-resistance-rated assembly (marked on plans)',
    correctAction: 'Use the listed penetration/firestop system for this assembly',
    actions: ['Use the listed penetration/firestop system for this assembly', 'Any fire caulk from the truck', 'Drill it now, treat it during punch list'],
    ruleId: 'fire-system-not-sealant',
  },
  {
    id: 'w-unknown',
    label: 'Unknown — the drawing doesn\'t say',
    correctAction: 'Verify the assembly before penetrating',
    actions: ['Verify the assembly before penetrating', 'Drill first — determine later', 'Assume non-rated; most walls are'],
    ruleId: 'wall-verify-assembly',
  },
];

/* ── M8 — ceiling ──────────────────────────────────────────────────────── */
export type CiCeilingDefect = { id: string; mistakeId: string; label: string; x: number; y: number };

/** Find-the-problems positions on the ceiling cutaway (viewBox 0..100). */
export const CI_CEILING_DEFECTS: CiCeilingDefect[] = [
  { id: 'cd-1', mistakeId: 'on-ceiling-tile', label: 'Data bundle lying across the tiles', x: 18, y: 72 },
  { id: 'cd-2', mistakeId: 'foreign-support', label: 'Audio pair draped over the sprinkler main', x: 44, y: 36 },
  { id: 'cd-3', mistakeId: 'unsupported-span', label: 'Long span with no support, sagging', x: 62, y: 52 },
  { id: 'cd-4', mistakeId: 'foreign-support', label: 'Cable resting on the light fixture housing', x: 30, y: 60 },
  { id: 'cd-5', mistakeId: 'sharp-bend', label: 'Hard 90° fold where the run turns', x: 76, y: 44 },
  { id: 'cd-6', mistakeId: 'overfilled-pathway', label: 'J-hook stuffed far past its capacity', x: 54, y: 30 },
  { id: 'cd-7', mistakeId: 'unverified-wall', label: 'Run disappears through an unmarked penetration', x: 90, y: 48 },
  { id: 'cd-8', mistakeId: 'hidden-loop', label: 'Service loop tied above the rigid duct — unreachable', x: 12, y: 34 },
];

export const CI_CEILING_INSTALL_STEPS = [
  'Pick the pathway/support for the run',
  'Place supports to the given system spec',
  'Route the bundle through them',
  'Keep bends easy and utilities clear',
  'Enter the destination properly',
] as const;

/* ── M9 — floor & events (route options per environment) ───────────────── */
export const CI_FLOOR_SCENARIOS: CiRouteScenario[] = [
  {
    id: 'foh-run',
    title: 'Stage → FOH for tonight\'s show',
    brief: 'Temporary snake run to front of house, audience in the room. Egress and accessibility still apply tonight.',
    cable: 'snake',
    options: [
      {
        id: 'aisle',
        name: 'Straight down the center aisle under a ramp',
        path: 'Shortest: down the main aisle with a cable protector the whole way.',
        relLength: 1,
        flags: [
          { ruleId: 'floor-walkways', dim: 'safety', cost: 0.55, note: 'The main aisle is the audience\'s walking + egress route.' },
          { ruleId: 'floor-ramp-not-magic', dim: 'safety', cost: 0.35, note: 'A ramp doesn\'t neutralize an egress/accessible route — suitability and route rules still apply.' },
        ],
      },
      {
        id: 'perimeter',
        name: 'Perimeter wall route with one protected door crossing',
        path: 'Along the side wall, one short protected crossing at a non-egress service door.',
        relLength: 1.5,
        flags: [
          { ruleId: 'floor-stage-craft', dim: 'safety', cost: 0.4, positive: true, note: 'Out of every walking lane; one deliberate, protected crossing.' },
          { ruleId: 'floor-ramp-not-magic', dim: 'protection', cost: 0.2, positive: true, note: 'The protector is sized to the actual traffic there.' },
        ],
      },
      {
        id: 'overhead',
        name: 'Temporary overhead hop on rated truss points',
        path: 'Up and over the doorway span on the venue\'s rated rigging points.',
        relLength: 1.3,
        flags: [
          { ruleId: 'sup-purpose-built', dim: 'routing', cost: 0.3, positive: true, note: 'Off the floor entirely — using points intended for load.' },
          { ruleId: 'plan-service-access', dim: 'serviceability', cost: 0.15, note: 'Needs the venue\'s rigging approval and a plan for strike.' },
        ],
      },
    ],
  },
  {
    id: 'backstage',
    title: 'Backstage power + signal to monitor world',
    brief: 'Feeder and signal must cross the load-in path where cases and forklifts roll all night.',
    cable: 'extension',
    options: [
      {
        id: 'loadin-bare',
        name: 'Across the load-in path under a doormat',
        path: 'Straight across the roll path, a rubber mat thrown over it.',
        relLength: 1,
        flags: [
          { ruleId: 'floor-ramp-not-magic', dim: 'safety', cost: 0.6, note: 'Cases and forklifts will find it — a mat is not load-rated protection.' },
          { ruleId: 'floor-ramp-not-magic', dim: 'protection', cost: 0.4, note: 'Protection must match the actual loads (vehicle-rated where vehicles roll).' },
        ],
      },
      {
        id: 'loadin-rated',
        name: 'Vehicle-rated protector at a marked crossing',
        path: 'One crossing, vehicle-rated protector, high-vis marked, out of the door swing.',
        relLength: 1.1,
        flags: [
          { ruleId: 'floor-ramp-not-magic', dim: 'safety', cost: 0.45, positive: true, note: 'Protector suits the real loads; the crossing is deliberate and visible.' },
          { ruleId: 'floor-stage-craft', dim: 'protection', cost: 0.2, positive: true, note: 'Clear of the door swing and pinch points.' },
        ],
      },
      {
        id: 'perimeter-long',
        name: 'Long perimeter route behind the cases',
        path: 'Around the wall behind stacked road cases and the door hinge side.',
        relLength: 1.7,
        flags: [
          { ruleId: 'mech-edges', dim: 'protection', cost: 0.35, note: 'Cases get restacked all night — the "safe" wall is a crush zone here.' },
          { ruleId: 'floor-stage-craft', dim: 'routing', cost: 0.2, note: 'Longer isn\'t safer when the perimeter is active work space.' },
        ],
      },
    ],
  },
];

export const CI_OVERUNDER_STEPS = [
  'First loop: natural lay — let the cable curl the way it wants.',
  'Second loop: reverse — roll your wrist so the loop lays under.',
  'Alternate over… under… over… under to the end.',
  'Secure the coil; it now pays out straight, without twist.',
] as const;

/* ── M10 — EMI crossing choice ─────────────────────────────────────────── */
export const CI_EMI_CHOICES: { id: string; label: string; ok: boolean; note: string; ruleId: string }[] = [
  { id: 'parallel-close', label: 'Long close parallel run with the feeder', ok: false, note: 'Maximum shared length at minimum distance — worst coupling geometry.', ruleId: 'emi-parallel-exposure' },
  { id: 'separated', label: 'Same direction, greater separation', ok: true, note: 'Distance buys margin — exposure drops fast as separation grows.', ruleId: 'emi-no-universal-distance' },
  { id: 'perpendicular', label: 'Cross near perpendicular', ok: true, note: 'Steep crossing minimizes shared length — engineering practice, not a code number.', ruleId: 'emi-parallel-exposure' },
  { id: 'other-pathway', label: 'Move to the separate signal pathway', ok: true, note: 'Pathway planning is the cleanest separation of all.', ruleId: 'plan-defined-pathways' },
];

/* ── M11 — spaces & penetration flow ───────────────────────────────────── */
export const CI_FIRE_SPACES: { id: string; label: string; isPlenum?: boolean; question: string; correctIdx: number; options: string[]; reveal: string; ruleId: string }[] = [
  {
    id: 'fs-cavity',
    label: 'Suspended-ceiling cavity (return air NOT ducted through it)',
    question: 'What is this space, for cable purposes?',
    options: ['A ceiling cavity — not automatically a plenum; verify how air is handled', 'A plenum — every ceiling cavity is one', 'Nothing special — ratings never apply above ceilings'],
    correctIdx: 0,
    reveal: 'Environmental-air handling is a property of the building design, not of ceilings in general. Identify it before selecting cable.',
    ruleId: 'fire-plenum-not-assumed',
  },
  {
    id: 'fs-plenum',
    label: 'Ceiling space actively used for environmental air movement',
    question: 'What does this space change?',
    options: ['Requirements can extend beyond the cable jacket — materials in the space matter, where adopted', 'Only the cable color', 'Nothing, if the cable is "low voltage"'],
    correctIdx: 0,
    reveal: 'Air-handling spaces carry requirements for what may live in them. That\'s why the identification step comes first.',
    ruleId: 'fire-plenum-not-assumed',
  },
  {
    id: 'fs-riser',
    label: 'Floor-to-floor shaft with a conduit sleeve',
    question: 'Routing up this shaft means…',
    options: ['Riser-space rules: cable rating for the vertical space AND treatment of the floor penetration', 'Just pull it — vertical runs are unregulated', 'Fill the sleeve with any sealant afterwards'],
    correctIdx: 0,
    reveal: 'Vertical spaces can carry fire between floors — both the cable and the penetration treatment are part of the installation.',
    ruleId: 'fire-riser-spaces',
  },
];

/* ── M12 — labeling & documentation ────────────────────────────────────── */
export const CI_LABEL_SCHEME_NOTE =
  'TRAINING EXAMPLE NAMING SCHEME — real projects define their own convention; what must survive is uniqueness, consistency, readability and matching records.';

export type CiScheduleRow = { cableId: string; source: string; destination: string; type: string; pathway: string; note?: string };

export const CI_CABLE_SCHEDULE: CiScheduleRow[] = [
  { cableId: 'A-010', source: 'STG-A-IN10', destination: 'R1-PP2-10', type: 'Balanced audio', pathway: 'Tray T1 → riser' },
  { cableId: 'A-011', source: 'STG-A-IN11', destination: 'R1-PP2-11', type: 'Balanced audio', pathway: 'Tray T1 → riser' },
  { cableId: 'A-012', source: 'STG-A-IN12', destination: 'R1-PP2-12', type: 'Balanced audio', pathway: 'Tray T1 → riser', note: 'Service loop at pull box PB-3' },
  { cableId: 'N-004', source: 'R1-SW1-04', destination: 'STG-NET-A', type: 'Network (audio transport)', pathway: 'Tray T1 → riser' },
];

export const CI_TRACE_TARGET = 'A-012';

/* ── M12b — service loops slider ───────────────────────────────────────── */
export const CI_SLACK_SCENARIO = {
  brief: 'Rack-end service slack for the multipair at R1. SIMULATED PROJECT NOTE — this project stores one accessible service loop per multipair at the rack, sized to allow one full re-termination.',
  /** slider 0..1 zones */
  tooLittleMax: 0.25,
  goodMax: 0.65,
  notes: {
    little: 'Too little — one damaged termination means a re-pull.',
    good: 'Intentional — enough accessible slack to re-terminate, dressed out of the way.',
    much: 'Excessive — an unmanaged pile that blocks the pathway and hides problems.',
  },
} as const;

/* ── M13 — final inspection pool (25; scene draws 15–18) ───────────────── */
export type CiInspectionDefect = {
  id: string;
  mistakeId: string;
  label: string;
  /** capstone scene zone: 0 stage · 1 floor · 2 wall/door · 3 rack · 4 ceiling/tray · 5 equip room */
  zone: 0 | 1 | 2 | 3 | 4 | 5;
  x: number;
  y: number;
};

export const CI_INSPECTION_POOL: CiInspectionDefect[] = [
  { id: 'ins-1', mistakeId: 'sharp-bend', label: 'Mic line folded hard behind the stage box', zone: 0, x: 12, y: 78 },
  { id: 'ins-2', mistakeId: 'crushed-by-tie', label: 'Snake waist-tied to oval at the stage edge', zone: 0, x: 22, y: 84 },
  { id: 'ins-3', mistakeId: 'connector-strain', label: 'Stage-box fan-out hanging on its XLRs', zone: 0, x: 8, y: 70 },
  { id: 'ins-4', mistakeId: 'bad-floor-crossing', label: 'Snake crossing the audience aisle bare', zone: 1, x: 42, y: 88 },
  { id: 'ins-5', mistakeId: 'traffic-exposure', label: 'Feeder under a doormat in the roll path', zone: 1, x: 58, y: 90 },
  { id: 'ins-6', mistakeId: 'slack-pile', label: 'A spaghetti pile of "spare" cable at stage right', zone: 0, x: 30, y: 80 },
  { id: 'ins-7', mistakeId: 'door-pinch', label: 'Line pinched under the equipment-room door', zone: 2, x: 66, y: 72 },
  { id: 'ins-8', mistakeId: 'cord-as-permanent', label: 'Extension cord stapled along the baseboard as permanent feed', zone: 2, x: 74, y: 78 },
  { id: 'ins-9', mistakeId: 'unverified-wall', label: 'Fresh unlabeled hole through the corridor wall', zone: 2, x: 70, y: 55 },
  { id: 'ins-10', mistakeId: 'bad-penetration', label: 'Rated-wall sleeve left open around the bundle', zone: 2, x: 78, y: 48 },
  { id: 'ins-11', mistakeId: 'power-signal-mess', label: 'AC and mic lines share one tight bundle up the wall', zone: 2, x: 62, y: 60 },
  { id: 'ins-12', mistakeId: 'blocked-vent', label: 'Loom dressed across the amp intake', zone: 3, x: 88, y: 66 },
  { id: 'ins-13', mistakeId: 'blocked-access', label: 'DSP rear unreachable behind a taut trunk', zone: 3, x: 92, y: 58 },
  { id: 'ins-14', mistakeId: 'unlabeled', label: 'Patch field with zero labels', zone: 3, x: 86, y: 50 },
  { id: 'ins-15', mistakeId: 'label-mismatch', label: 'Cable labeled A-07 one end, A-17 the other', zone: 3, x: 90, y: 44 },
  { id: 'ins-16', mistakeId: 'undocumented', label: 'Schedule says PP2-09 — the wall says PP2-12', zone: 3, x: 84, y: 38 },
  { id: 'ins-17', mistakeId: 'slack-none', label: 'Interface lines bowstring-tight, zero slack', zone: 3, x: 94, y: 52 },
  { id: 'ins-18', mistakeId: 'on-ceiling-tile', label: 'Data bundle lying on the tiles', zone: 4, x: 34, y: 22 },
  { id: 'ins-19', mistakeId: 'foreign-support', label: 'Audio run tied to the sprinkler main', zone: 4, x: 48, y: 16 },
  { id: 'ins-20', mistakeId: 'unsupported-span', label: 'Sagging span between tray and wall', zone: 4, x: 60, y: 20 },
  { id: 'ins-21', mistakeId: 'overfilled-pathway', label: 'Tray heaped past its side rails', zone: 4, x: 52, y: 10 },
  { id: 'ins-22', mistakeId: 'wrong-space-cable', label: 'Ordinary-jacket cable in the air-handling space', zone: 4, x: 40, y: 12 },
  { id: 'ins-23', mistakeId: 'jacket-damage', label: 'Jacket sliced where it crosses a strut edge', zone: 4, x: 68, y: 18 },
  { id: 'ins-24', mistakeId: 'bad-rack-entry', label: 'Trunk dives over the rack\'s raw top edge', zone: 3, x: 88, y: 30 },
  { id: 'ins-25', mistakeId: 'hidden-loop', label: 'Service loop sealed above the rigid duct', zone: 4, x: 26, y: 14 },
];

export const CI_INSPECTION_DRAW = { min: 15, max: 18 } as const;

/* ── Rule-or-Myth interstitials (spec §25) ─────────────────────────────── */
export type CiMyth = { id: string; statement: string; answer: boolean; reveal: string; ruleId?: string };

export const CI_MYTHS: CiMyth[] = [
  { id: 'my-tile', statement: 'All low-voltage cable can simply lie above ceiling tiles.', answer: false, reveal: 'Cable needs its own approved supports — tiles and grid are a finish system, and where the electrical code is adopted this is a violation.', ruleId: 'sup-no-ceiling-tile' },
  { id: 'my-neat', statement: 'The neatest-looking bundle is automatically the best installation.', answer: false, reveal: 'Neat ≠ correct. A pretty loom that blocks airflow, strains connectors or kills serviceability is a defect with good posture.', ruleId: 'rack-not-max-tight' },
  { id: 'my-bend', statement: 'Every cable has the same bend-radius requirement.', answer: false, reveal: 'Bend limits are a property of each cable\'s construction — the manufacturer\'s specification governs.', ruleId: 'mech-bend-radius' },
  { id: 'my-plenum', statement: 'Every ceiling cavity is a plenum.', answer: false, reveal: 'Environmental-air handling is a building-design fact to identify — assuming either way produces wrong installations.', ruleId: 'fire-plenum-not-assumed' },
  { id: 'my-ramp', statement: 'A cable ramp automatically makes any floor crossing acceptable.', answer: false, reveal: 'The protector must suit the loads and the route — egress and accessibility requirements don\'t disappear under rubber.', ruleId: 'floor-ramp-not-magic' },
  { id: 'my-ties', statement: 'All cable ties are forbidden.', answer: false, reveal: 'Ties are a tool. What\'s universal is that restraints must not damage the cable — and project/manufacturer requirements decide the rest.', ruleId: 'mech-ties-not-banned' },
  { id: 'my-distance', statement: 'Power and signal must always be separated by one universal fixed distance.', answer: false, reveal: 'Coupling depends on level, balancing, shielding, current, geometry and grounding. Scenario-specific requirements exist; a universal number does not.', ruleId: 'emi-no-universal-distance' },
  { id: 'my-mfr', statement: 'The cable manufacturer\'s specification can affect the installation method.', answer: true, reveal: 'It usually governs it — bend, tension, support and environment limits are the manufacturer\'s numbers for that cable.', ruleId: 'mech-bend-radius' },
  { id: 'my-caulk', statement: 'Firestop material can be selected solely because its tube says "fire rated."', answer: false, reveal: 'Incomplete at best: firestopping is a tested, LISTED SYSTEM matched to the assembly and the penetrating items — not a product off a shelf.', ruleId: 'fire-system-not-sealant' },
  { id: 'my-lv', statement: '"Low voltage" means the installation is unregulated.', answer: false, reveal: 'Spaces, supports, penetrations and workplaces all carry requirements that apply regardless of signal level.', ruleId: 'plan-environment' },
];

/* ── Final knowledge check (spec §41/§42) — scenario judgment items ─────── */
export type CiQuizItem = CheckSpec & { id: string; ruleId?: string };

export const CI_QUIZ_BANK: CiQuizItem[] = [
  {
    id: 'q-wall',
    question: 'The drawing does not identify whether this wall is fire-rated. Before routing cable through it, the installer should…',
    options: [
      'Verify the assembly and project requirements before creating the penetration',
      'Route through the shortest opening available',
      'Drill now and add generic fire sealant later',
      'Use the nearest existing penetration regardless of its listing',
    ],
    correctIdx: 0,
    reveal: 'Unknown assembly = stop and verify. Life-safety construction is never a guess, and existing penetrations are only usable within their listed systems.',
    wrongHint: 'What do you actually know about this wall right now?',
    ruleId: 'wall-verify-assembly',
  },
  {
    id: 'q-bend',
    question: 'You\'re about to route a fiber trunk around a tight column. The FIRST professional step is…',
    options: [
      'Check this cable\'s specified minimum bend radius',
      'Apply the universal 4× rule every cable uses',
      'Bend it until it looks stressed, then back off',
      'Fiber can\'t be bent — abandon the route',
    ],
    correctIdx: 0,
    reveal: 'Bend limits belong to the specific cable. "Check the specification" IS the skill — there is no universal ratio.',
    ruleId: 'mech-bend-radius',
  },
  {
    id: 'q-authority-sep',
    question: '"Cross power and signal near perpendicular instead of running them closely parallel." That guidance is best classified as…',
    options: [
      'Professional/engineering practice (scenario requirements may add specifics)',
      'A universal electrical-code clause',
      'A manufacturer requirement for all cables',
      'Folklore with no basis',
    ],
    correctIdx: 0,
    reveal: 'It\'s sound coupling-reduction practice. It only becomes a "requirement" when a standard, project or manufacturer specifies it for the scenario.',
    ruleId: 'emi-parallel-exposure',
  },
  {
    id: 'q-support',
    question: 'The sprinkler main runs exactly where your cable needs to go. You should…',
    options: [
      'Install purpose-built supports anchored to structure alongside the route',
      'Tie the cable to the sprinkler pipe neatly',
      'Rest the cable on the ceiling grid instead',
      'Drape it over the duct — it\'s only temporary-ish',
    ],
    correctIdx: 0,
    reveal: 'Other systems are never cable supports — life-safety systems least of all. Purpose-built supports exist for exactly this.',
    ruleId: 'sup-purpose-built',
  },
  {
    id: 'q-strain',
    question: 'A heavy multipair hangs off the back of a DSP with no support. The primary problem is…',
    options: [
      'The termination is carrying the cable\'s weight',
      'The cable is the wrong color',
      'It\'s too visible',
      'Nothing, if the connector clicked in',
    ],
    correctIdx: 0,
    reveal: 'Connectors are signal joints, not load hardware. Support the cable ahead of the termination and dress strain-free slack.',
    ruleId: 'mech-strain-relief',
  },
  {
    id: 'q-tie',
    question: 'A tie has visibly ovalized a Cat6 bundle. The correct read is…',
    options: [
      'Over-tension — the restraint is deforming the pairs; re-restrain to support, not crush',
      'Good — tighter is always more professional',
      'Fine as long as the tie doesn\'t snap',
      'Only a problem for fiber',
    ],
    correctIdx: 0,
    reveal: 'Deformed geometry is real damage in twisted-pair. Restraint supports and organizes — it never crushes.',
    ruleId: 'mech-restraint-tension',
  },
  {
    id: 'q-aisle',
    question: 'Tonight\'s snake must reach FOH. The main audience aisle is the shortest path. Professionally, you…',
    options: [
      'Route the perimeter; protect the one unavoidable crossing suitably',
      'Ramp the whole aisle — ramps make it fine',
      'Run it bare and gaff a "watch your step" sign',
      'Refuse to run FOH cable at all',
    ],
    correctIdx: 0,
    reveal: 'Walking and egress routes stay clear. Protectors are for the deliberate, suitable crossing — not for converting an aisle into a pathway.',
    ruleId: 'floor-walkways',
  },
  {
    id: 'q-plenum',
    question: 'Above this corridor the ceiling cavity moves return air. Cable-wise, that means…',
    options: [
      'Requirements can extend beyond the jacket — verify what may be installed in the space',
      'Nothing — ceilings are ceilings',
      'Only fiber may enter',
      'Any cable is fine if supported',
    ],
    correctIdx: 0,
    reveal: 'Environmental-air spaces carry requirements for what lives in them, where adopted. Identify the space, then choose materials.',
    ruleId: 'fire-plenum-not-assumed',
  },
  {
    id: 'q-label',
    question: 'A tech must swap one failed line in a 48-point patch field. What made it a 5-minute job?',
    options: [
      'Unique, consistent labels at both ends matching the cable schedule',
      'All the cables being the same color',
      'Extra-tight dressing',
      'Memorizing the rack',
    ],
    correctIdx: 0,
    reveal: 'Identification + matching records = traceability. That\'s what labeling standards exist to guarantee.',
    ruleId: 'label-both-ends',
  },
  {
    id: 'q-slack',
    question: 'How much service slack should a run get?',
    options: [
      'An intentional amount sized to the service need, per project/manufacturer requirements, stored accessibly',
      'Always exactly the same length — that\'s the standard',
      'None — slack is waste',
      'As much as fits — more is safer',
    ],
    correctIdx: 0,
    reveal: 'Slack is a design decision, not a constant: enough to service and re-terminate, stored deliberately, never an obstructing pile.',
    ruleId: 'slack-intentional',
  },
  {
    id: 'q-authority-mfr',
    question: 'The installed J-hook system\'s instructions specify its maximum spacing at your load. That number is…',
    options: [
      'A manufacturer requirement — it governs this system\'s installation',
      'A myth to ignore',
      'A U.S. federal law for all hooks',
      'Optional if the run looks tight',
    ],
    correctIdx: 0,
    reveal: 'Support spacing comes from the support system\'s documentation plus the applicable installation standard — that\'s why the exercise handed you the spec first.',
    ruleId: 'sup-spacing-mfr',
  },
  {
    id: 'q-rack-air',
    question: 'The prettiest place to dress the loom is straight across the amplifier\'s intake. You…',
    options: [
      'Re-route it — equipment cooling is a manufacturer requirement, and airflow beats aesthetics',
      'Dress it there — symmetry wins',
      'Add a second loom to balance it',
      'Remove the amp\'s fans for clearance',
    ],
    correctIdx: 0,
    reveal: 'Thermal requirements come from the equipment manufacturer; rack standards require preserving the cooling plan. Neat ≠ correct.',
    ruleId: 'rack-airflow',
  },
  {
    id: 'q-doorway',
    question: 'A cable must get past an active doorway for a two-day event. Acceptable thinking is…',
    options: [
      'Protect a proper threshold crossing or route around — never let the door pinch the cable',
      'Close the door on it gently — it\'s only two days',
      'Staple it across the frame',
      'Any solution, since temporary means unregulated',
    ],
    correctIdx: 0,
    reveal: 'Doors cycle thousands of times, and workplace rules apply to temporary work too. Temporary changes the solutions, not the standards of care.',
    ruleId: 'wall-doorway',
  },
  {
    id: 'q-incomplete',
    question: 'An exercise asks you to space supports but gives no system specification. The professional response is…',
    options: [
      'Identify the missing information — the support system\'s criteria — before installing',
      'Use the spacing you saw online once',
      'Space by eye; it\'s all the same',
      'Skip supports entirely',
    ],
    correctIdx: 0,
    reveal: 'Recognizing INCOMPLETE information is a tested skill: the governing criteria come from the support manufacturer and applicable standard.',
    ruleId: 'sup-spacing-mfr',
  },
  {
    id: 'q-docs',
    question: 'After swapping a run to a new port, the last professional step is…',
    options: [
      'Update the labels and the records so documentation matches reality',
      'Nothing — the electrons know the way',
      'Remove the labels so no one is misled',
      'Email someone, eventually',
    ],
    correctIdx: 0,
    reveal: 'Records that disagree with the wall send the next tech confidently to the wrong place. Administration means records move when cables move.',
    ruleId: 'label-docs-match',
  },
];

export const CI_QUIZ_DRAW = 10;
