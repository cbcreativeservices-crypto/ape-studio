/**
 * Cable Dressing & Installation Lab — RULE LIBRARY.
 *
 * The content/authority/source model is SEPARATE from rendering (owner spec
 * §26): scenes reference rules by id; badges, WHY panels and source sheets all
 * render from here. Every sentence is an ORIGINAL summary — no standards text
 * is reproduced (§5).
 *
 * AUTHORITY HONESTY (§3/§29 — the load-bearing rule set):
 *  - 'code' = legal requirement where adopted (labeled U.S. where applicable;
 *    the lab states local regulations always govern).
 *  - 'standard' = professional consensus standards (TIA/BICSI/AVIXA/AES/ISO).
 *  - 'manufacturer' = the installed product's documentation governs.
 *  - 'professional_practice' = widely accepted workmanship — NOT law.
 *  - 'project_specification' = imposed by the project's documents.
 *  NO universal numerics are hard-coded here: any exercise that needs a number
 *  supplies a SCENARIO-SPECIFIC simulated specification and says so.
 */

export type AuthorityClass = 'code' | 'standard' | 'manufacturer' | 'professional_practice' | 'project_specification';

export type CiSeverity = 'info' | 'minor' | 'major' | 'critical';

export type CiRule = {
  id: string;
  title: string;
  category:
    | 'planning'
    | 'mechanical'
    | 'supports'
    | 'rack'
    | 'wall'
    | 'ceiling'
    | 'floor'
    | 'emi'
    | 'fire'
    | 'labeling'
    | 'slack'
    | 'safety';
  authorityClass: AuthorityClass;
  /** Present when the rule is jurisdiction-bound (badged in the UI). */
  jurisdiction?: 'US';
  severity: CiSeverity;
  /** Immediate feedback — short, one breath. */
  studentText: string;
  /** The expandable WHY — mechanism, 2–4 sentences. */
  whyText: string;
  correctionText?: string;
  sourceRefs: string[];
  /** True when an exercise supplies the governing number per scenario. */
  numericValueIsScenarioSpecific?: boolean;
};

export const CI_RULES: CiRule[] = [
  /* ── PLANNING / ROUTING ─────────────────────────────────────────────── */
  {
    id: 'plan-shortest-not-best',
    title: 'The shortest route is not always the best route',
    category: 'planning',
    authorityClass: 'professional_practice',
    severity: 'info',
    studentText: 'Judge a route on safety, protection, pathway quality and serviceability — not just length.',
    whyText:
      'A short route through a mechanical space or across a doorway saves cable and costs everything else: damage exposure, service access, and safety. Professional routing weighs the whole life of the cable, not the pull day.',
    sourceRefs: ['bicsi_tdmm', 'tia569'],
  },
  {
    id: 'plan-defined-pathways',
    title: 'Use defined pathways where they exist',
    category: 'planning',
    authorityClass: 'standard',
    severity: 'major',
    studentText: 'Route through the pathways provided for cabling — tray, conduit, raceway — before inventing your own.',
    whyText:
      'Pathways exist to provide support, protection, capacity planning and future access. A cable outside the pathway system is undocumented, unsupported and in the way of every other trade.',
    sourceRefs: ['tia569', 'bicsi_n1', 'bicsi_tdmm'],
  },
  {
    id: 'plan-service-access',
    title: 'Plan for the next technician',
    category: 'planning',
    authorityClass: 'professional_practice',
    severity: 'major',
    studentText: 'Every run should be reachable, traceable and replaceable without demolition.',
    whyText:
      'Cables fail, systems change, and someone must service this install for years. A route that cannot be accessed again converts a ten-minute swap into a construction project.',
    sourceRefs: ['bicsi_tdmm', 'avixa_verify'],
  },
  {
    id: 'plan-capacity',
    title: 'Respect pathway capacity — today and tomorrow',
    category: 'planning',
    authorityClass: 'standard',
    severity: 'major',
    studentText: 'Do not stuff a pathway full; fill limits and future growth both matter.',
    whyText:
      'Overfilled pathways crush cable at the bottom of the pile, make pulls damaging, and leave no room for the next add. Applicable fill limits depend on the pathway type and the governing code/standard — check them, don\'t guess.',
    sourceRefs: ['tia569', 'nec', 'mfr_support'],
    numericValueIsScenarioSpecific: true,
  },
  {
    id: 'plan-environment',
    title: 'The space dictates the cable',
    category: 'planning',
    authorityClass: 'code',
    jurisdiction: 'US',
    severity: 'critical',
    studentText: 'A cable must be rated/approved for the space it passes through — verify before routing.',
    whyText:
      'Environmental-air spaces, risers and other building spaces carry requirements for what may be installed in them (where the electrical code is adopted). The route can be perfect and the installation still wrong if the jacket rating is not.',
    correctionText: 'Identify the space classification, then select cable listed for it — or reroute.',
    sourceRefs: ['nec', 'bldg_fire'],
  },

  /* ── MECHANICAL ─────────────────────────────────────────────────────── */
  {
    id: 'mech-bend-radius',
    title: 'Bend radius comes from the cable specification',
    category: 'mechanical',
    authorityClass: 'manufacturer',
    severity: 'major',
    studentText: 'Check THIS cable\'s minimum bend radius — there is no universal number.',
    whyText:
      'Bend limits differ by construction: twisted-pair geometry, coax dielectric, fiber stress limits and multipair fillers all behave differently, and installed vs. under-pull limits differ too. The governing figure is the manufacturer\'s, sometimes tightened by the applicable standard for that cabling class.',
    correctionText: 'Ease the bend to meet the specified radius, or re-form the route to remove the tight turn.',
    sourceRefs: ['mfr_cable', 'tia568', 'bicsi_n1'],
    numericValueIsScenarioSpecific: true,
  },
  {
    id: 'mech-pull-tension',
    title: 'Pulling force is limited — by the cable',
    category: 'mechanical',
    authorityClass: 'manufacturer',
    severity: 'major',
    studentText: 'Pull smoothly within the cable\'s rated tension; never yank through resistance.',
    whyText:
      'Exceeding pull tension stretches conductors, deforms pairs, and breaks fiber — damage you cannot see from outside the jacket. Sharp turns under tension multiply sidewall pressure at the bend.',
    correctionText: 'Stop, find the snag, add a pulling aid or re-feed — do not force it.',
    sourceRefs: ['mfr_cable', 'bicsi_itsimm'],
    numericValueIsScenarioSpecific: true,
  },
  {
    id: 'mech-no-connector-pull',
    title: 'Connectors are not pulling handles',
    category: 'mechanical',
    authorityClass: 'professional_practice',
    severity: 'major',
    studentText: 'Where inappropriate, never pull a cable by its connector.',
    whyText:
      'Termination joints are the weakest mechanical point of most assemblies. Pulling on them stresses solder/crimp joints and strain reliefs invisibly, creating the intermittent faults that take longest to find.',
    sourceRefs: ['mfr_cable', 'bicsi_itsimm'],
  },
  {
    id: 'mech-restraint-tension',
    title: 'Restraints support — they must not crush',
    category: 'mechanical',
    authorityClass: 'manufacturer',
    severity: 'major',
    studentText: 'Tighten ties/straps to secure, not deform. If the bundle changes shape, it\'s too tight.',
    whyText:
      'Over-tight restraints deform pair geometry, pinch fiber and damage jackets — the restraint becomes the hazard. The right restraint and tension depend on the cable type, its specification and the environment; the goal is support and organization.',
    correctionText: 'Back the restraint off (or swap to a wider/softer restraint) until the bundle is held without deformation.',
    sourceRefs: ['mfr_cable', 'bicsi_n1', 'avixa_f502_01'],
  },
  {
    id: 'mech-ties-not-banned',
    title: 'Cable ties are a tool, not a sin',
    category: 'mechanical',
    authorityClass: 'professional_practice',
    severity: 'info',
    studentText: 'Ties aren\'t universally prohibited — the right restraint depends on cable, spec and environment.',
    whyText:
      'Some projects specify hook-and-loop for sensitive or frequently-serviced bundles; others permit ties correctly tensioned. What is universal: the restraint must not damage the cable, and project/manufacturer requirements win.',
    sourceRefs: ['mfr_cable', 'avixa_f502_01'],
  },
  {
    id: 'mech-edges',
    title: 'Protect cable from edges, pinches and traffic',
    category: 'mechanical',
    authorityClass: 'professional_practice',
    severity: 'major',
    studentText: 'Sharp edges, door pinch points, casters and foot traffic all need physical protection between them and the cable.',
    whyText:
      'Jacket damage is cumulative and often invisible until failure. Bushings, grommets, sleeves, protectors and simple rerouting are cheap compared to re-pulling a damaged run.',
    correctionText: 'Add a fitting/bushing/protector at the contact point, or move the route away from the hazard.',
    sourceRefs: ['bicsi_itsimm', 'mfr_cable'],
  },
  {
    id: 'mech-strain-relief',
    title: 'Cable weight never hangs on a termination',
    category: 'mechanical',
    authorityClass: 'professional_practice',
    severity: 'major',
    studentText: 'Support the cable so the connector carries signal, not weight.',
    whyText:
      'A connector loaded by cable weight is under constant tension plus every vibration and service touch. Terminations should be approached with strain relieved by supports, dressing or service loops.',
    correctionText: 'Add support ahead of the termination and dress slack so the connector floats strain-free.',
    sourceRefs: ['avixa_f502_01', 'bicsi_itsimm', 'mfr_cable'],
  },

  /* ── SUPPORTS & PATHWAYS ────────────────────────────────────────────── */
  {
    id: 'sup-purpose-built',
    title: 'Support cable with supports',
    category: 'supports',
    authorityClass: 'code',
    jurisdiction: 'US',
    severity: 'critical',
    studentText: 'Use purpose-built, appropriately rated supports — never other trades\' pipes, ceilings or equipment.',
    whyText:
      'Where adopted, the electrical code requires cabling to be supported by approved means and prohibits using ceiling grids/support wires and other systems as carriers. Sprinkler pipes, conduit belonging to another system, and ductwork are life-safety or licensed systems — hanging cable on them creates hazards in both directions.',
    correctionText: 'Move the cable onto a listed support (J-hook, tray, strap) anchored to structure.',
    sourceRefs: ['nec', 'bicsi_n1', 'mfr_support'],
  },
  {
    id: 'sup-spacing-mfr',
    title: 'Support spacing follows the system\'s criteria',
    category: 'supports',
    authorityClass: 'manufacturer',
    severity: 'major',
    studentText: 'Space supports per the support system\'s design criteria and the applicable standard — not a folklore number.',
    whyText:
      'Allowable span depends on the support product, its load rating, and the cable weight in it. The exercise gives you the simulated system\'s criteria: meeting the given spec IS the skill.',
    sourceRefs: ['mfr_support', 'bicsi_n1', 'tia569'],
    numericValueIsScenarioSpecific: true,
  },
  {
    id: 'sup-roles',
    title: 'Support · Pathway · Protection · Management are different jobs',
    category: 'supports',
    authorityClass: 'professional_practice',
    severity: 'info',
    studentText: 'Support carries weight; pathway defines the route; protection blocks damage; management organizes for service.',
    whyText:
      'One component can do several jobs (a tray supports, routes and partly protects), but choosing hardware by the job it must do prevents the classic error: something that organizes beautifully while supporting nothing.',
    sourceRefs: ['tia569', 'bicsi_tdmm'],
  },
  {
    id: 'sup-no-ceiling-tile',
    title: 'Ceiling tiles are not a pathway',
    category: 'ceiling',
    authorityClass: 'code',
    jurisdiction: 'US',
    severity: 'critical',
    studentText: 'Cable may not lie on ceiling tiles or hang from tile grid/support wires.',
    whyText:
      'Tiles and grid are a finish system, not structure — cable loads them, blocks access, and where the electrical code is adopted this is a violation, not a shortcut. Independent, approved supports exist precisely for this.',
    correctionText: 'Lift the cable onto J-hooks/tray/straps anchored to structure, clear of the tiles.',
    sourceRefs: ['nec', 'bicsi_n1'],
  },

  /* ── RACK ───────────────────────────────────────────────────────────── */
  {
    id: 'rack-power-signal-plan',
    title: 'Plan power and signal routing inside the rack',
    category: 'rack',
    authorityClass: 'standard',
    severity: 'major',
    studentText: 'Give AC power and signal classes planned, separated routes through the rack — not an interleaved bundle.',
    whyText:
      'AV rack standards call for deliberate class routing: it reduces coupling risk into low-level audio, and it makes every later service task sane. Which side carries what matters less than that the plan exists and is followed.',
    sourceRefs: ['avixa_f502_01', 'avixa_f502_02', 'aes48'],
  },
  {
    id: 'rack-airflow',
    title: 'Dressing must respect airflow',
    category: 'rack',
    authorityClass: 'manufacturer',
    severity: 'major',
    studentText: 'Never dress bundles across intakes, exhausts or fan paths — equipment cooling is a manufacturer requirement.',
    whyText:
      'A beautiful loom across a vent is a heat failure on a schedule. Equipment thermal requirements come from its manufacturer; rack design standards require preserving the cooling plan.',
    correctionText: 'Re-route the bundle around the ventilation path, using managers/side rails.',
    sourceRefs: ['mfr_cable', 'avixa_f502_02'],
  },
  {
    id: 'rack-service-access',
    title: 'Dress for the service call',
    category: 'rack',
    authorityClass: 'professional_practice',
    severity: 'major',
    studentText: 'Any single cable should be removable without disturbing its neighbors.',
    whyText:
      'A rack is serviced tens of times in its life. Managers, planned slack and per-device dressing make single-cable replacement routine; a maximally tight loom means every repair disturbs working connections.',
    sourceRefs: ['avixa_f502_01', 'bicsi_itsimm'],
  },
  {
    id: 'rack-excess',
    title: 'Excess cable is managed, not stuffed',
    category: 'rack',
    authorityClass: 'professional_practice',
    severity: 'minor',
    studentText: 'Store intentional service slack in managers — not as a pile behind the gear.',
    whyText:
      'Random excess blocks airflow and access and hides problems. Intentional slack, dressed where it can be reached, is what makes re-termination and equipment swaps possible.',
    sourceRefs: ['avixa_f502_01'],
  },
  {
    id: 'rack-not-max-tight',
    title: 'Dressing is not maximum tightness',
    category: 'rack',
    authorityClass: 'professional_practice',
    severity: 'minor',
    studentText: 'Cables need natural bends, connector approach angles and room to breathe — rigid geometry is its own defect.',
    whyText:
      'Real cable has diameter, weight and bend behavior. Forcing perfectly parallel, tensioned lines stresses terminations and makes service worse. Professional means installable, traceable, serviceable — not mathematical art.',
    sourceRefs: ['avixa_f502_01', 'mfr_cable'],
  },

  /* ── WALL ───────────────────────────────────────────────────────────── */
  {
    id: 'wall-verify-assembly',
    title: 'Know the wall before you penetrate it',
    category: 'wall',
    authorityClass: 'code',
    jurisdiction: 'US',
    severity: 'critical',
    studentText: 'Unknown wall? VERIFY the assembly before drilling — never penetrate first and ask later.',
    whyText:
      'Fire-resistance-rated assemblies are life-safety construction; an unapproved penetration defeats them and is a code violation where adopted. Verification (drawings, markings, the project team, the AHJ) comes before the drill.',
    correctionText: 'Stop. Identify the assembly from documents or the responsible party, then use the penetration method the assembly requires.',
    sourceRefs: ['bldg_fire', 'nec', 'firestop_listed'],
  },
  {
    id: 'wall-raceway-fill-transitions',
    title: 'Raceway needs capacity and clean transitions',
    category: 'wall',
    authorityClass: 'standard',
    severity: 'major',
    studentText: 'Surface raceway must have room for the cables, gentle direction changes, and proper entry/exit fittings.',
    whyText:
      'Raceway that is overfilled or turns hard corners defeats its purpose — it becomes the crush and bend hazard it was meant to prevent. Fittings exist for every transition; bare cut ends are edge hazards.',
    sourceRefs: ['tia569', 'mfr_support'],
    numericValueIsScenarioSpecific: true,
  },
  {
    id: 'wall-doorway',
    title: 'Cable does not fight doors',
    category: 'floor',
    authorityClass: 'professional_practice',
    severity: 'major',
    studentText: 'Never let a door pinch a cable — go over, under (protected), around, or through a proper pathway.',
    whyText:
      'A door cycles thousands of times; a pinched cable fails and can hold the door itself out of its safe operation. Temporary events may protect a threshold crossing properly; permanent runs belong in building pathways, and flexible cord is not permanent building wiring.',
    correctionText: 'Reroute via a pathway, or protect a temporary crossing with a suitable threshold solution.',
    sourceRefs: ['osha', 'nec', 'bicsi_itsimm'],
  },
  {
    id: 'wall-bushings',
    title: 'Finish every opening the cable passes through',
    category: 'wall',
    authorityClass: 'professional_practice',
    severity: 'major',
    studentText: 'A raw opening needs a bushing, grommet, sleeve or fitting before the cable does.',
    whyText:
      'Unfinished edges — cut metal studs, drilled plates, raceway ends — abrade jackets with every micro-movement. The fix costs pennies during install and a re-pull after.',
    sourceRefs: ['bicsi_itsimm', 'mfr_support'],
  },

  /* ── CEILING ────────────────────────────────────────────────────────── */
  {
    id: 'ceil-independent-support',
    title: 'Overhead cable gets its own supports',
    category: 'ceiling',
    authorityClass: 'code',
    jurisdiction: 'US',
    severity: 'critical',
    studentText: 'Support overhead runs from structure with approved hardware — independent of ceilings, ducts, pipes and other systems.',
    whyText:
      'Overhead cable that borrows other systems\' supports endangers both systems and the people below. Where the electrical code is adopted this is required; everywhere it is simply how professionals stay out of trouble.',
    sourceRefs: ['nec', 'bicsi_n1', 'mfr_support'],
  },
  {
    id: 'ceil-span-sag',
    title: 'Spans follow the support system design',
    category: 'ceiling',
    authorityClass: 'manufacturer',
    severity: 'major',
    studentText: 'Place supports to the given system\'s criteria; long unsupported spans stress cable and sag into everything below.',
    whyText:
      'Real cable sags under its own weight; allowable span is a property of the support product and the load, defined by its manufacturer and the applicable installation standard — the exercise supplies the criteria to meet.',
    sourceRefs: ['mfr_support', 'bicsi_n1'],
    numericValueIsScenarioSpecific: true,
  },
  {
    id: 'ceil-maintain-access',
    title: 'Leave the ceiling serviceable',
    category: 'ceiling',
    authorityClass: 'professional_practice',
    severity: 'major',
    studentText: 'Route so tiles lift, lights service, and mechanicals stay reachable.',
    whyText:
      'Every trade above that ceiling will return. A run that blocks a VAV box or pins a light fixture guarantees your cable gets moved — badly — by whoever gets there next.',
    sourceRefs: ['bicsi_tdmm', 'tia569'],
  },

  /* ── FLOOR / EVENTS ─────────────────────────────────────────────────── */
  {
    id: 'floor-walkways',
    title: 'Walking routes stay safe',
    category: 'floor',
    authorityClass: 'code',
    jurisdiction: 'US',
    severity: 'critical',
    studentText: 'Keep walking/working surfaces free of trip hazards — route around, overhead, or protect the crossing properly.',
    whyText:
      'Workplace regulations require walking-working surfaces be kept safe; egress paths carry further fire-code requirements, and public accessible routes bring accessibility requirements. A cable across a path is everyone\'s problem.',
    correctionText: 'Prefer perimeter/overhead routes; where a crossing is unavoidable, use a protector suitable for the traffic and verify route requirements still hold.',
    sourceRefs: ['osha', 'bldg_fire', 'ada'],
  },
  {
    id: 'floor-ramp-not-magic',
    title: 'A cable protector is not automatically the answer',
    category: 'floor',
    authorityClass: 'professional_practice',
    severity: 'major',
    studentText: 'Protectors must suit the load, the traffic, and the route — egress and accessibility still apply.',
    whyText:
      'A ramp rated for foot traffic dies under a forklift; a tall protector in an accessible route or egress path can itself be a violation. The protector is one tool inside a route decision, not a permission slip.',
    sourceRefs: ['mfr_support', 'ada', 'osha'],
  },
  {
    id: 'floor-stage-craft',
    title: 'Stage cable is routed, dressed and protected on purpose',
    category: 'floor',
    authorityClass: 'professional_practice',
    severity: 'major',
    studentText: 'Route along edges and lanes, keep performer paths clear, secure at boxes, and separate working slack from loose spaghetti.',
    whyText:
      'Stages combine traffic, movement, and show-critical timing. Intentional routes with dressed slack survive the show and strike; random webs fail at downbeat.',
    sourceRefs: ['bicsi_itsimm', 'osha'],
  },
  {
    id: 'floor-overunder',
    title: 'Coil flexible production cable over-under',
    category: 'floor',
    authorityClass: 'professional_practice',
    severity: 'info',
    studentText: 'Alternate normal and reversed loops so the cable stores without twist and deploys straight.',
    whyText:
      'Over-under cancels the twist each loop adds, so the cable pays out flat and its behavior lasts. It applies to appropriate flexible production/audio cable — specialized fiber, hybrid and large feeder follow their manufacturer\'s procedure instead.',
    sourceRefs: ['bicsi_itsimm', 'mfr_cable'],
  },

  /* ── EMI / POWER+SIGNAL ─────────────────────────────────────────────── */
  {
    id: 'emi-no-universal-distance',
    title: 'There is no one magic separation distance',
    category: 'emi',
    authorityClass: 'professional_practice',
    severity: 'info',
    studentText: 'Coupling risk depends on level, balancing, shielding, current, distance, geometry and grounding — manage exposure, don\'t recite a number.',
    whyText:
      'A balanced mic pair beside a lighting dimmer feed is a different problem than shielded data beside clean receptacle power. Where a standard, project or manufacturer specifies separation for a scenario, that specific requirement governs; otherwise the engineering levers are distance, parallel length, crossing angle and pathway choice.',
    sourceRefs: ['bicsi_n1', 'en50174', 'aes48'],
    numericValueIsScenarioSpecific: true,
  },
  {
    id: 'emi-parallel-exposure',
    title: 'Reduce long parallel exposure',
    category: 'emi',
    authorityClass: 'professional_practice',
    severity: 'minor',
    studentText: 'Prefer separation and short, near-perpendicular crossings over long close parallel runs with noisy neighbors.',
    whyText:
      'Coupling grows with shared length and shrinks with distance; crossing at a steep angle minimizes shared length. That is engineering practice — not a universal electrical-code clause — and it is why tray layouts and rack dressing plan class routes.',
    sourceRefs: ['bicsi_n1', 'aes48', 'en50174'],
  },
  {
    id: 'emi-balanced-helps',
    title: 'Balancing and shielding are the first defense',
    category: 'emi',
    authorityClass: 'standard',
    severity: 'info',
    studentText: 'Healthy balanced interconnects with correct shield practice reject most induced noise — routing is the second layer.',
    whyText:
      'Audio interconnection practice (shield termination, pin-1 handling, bonding) determines how much induced energy becomes audible. Routing distance buys margin; correct interconnection buys immunity.',
    sourceRefs: ['aes48', 'tia607'],
  },

  /* ── FIRE / BUILDING SPACES ─────────────────────────────────────────── */
  {
    id: 'fire-system-not-sealant',
    title: 'Firestopping is a listed SYSTEM',
    category: 'fire',
    authorityClass: 'code',
    jurisdiction: 'US',
    severity: 'critical',
    studentText: 'A rated penetration needs the tested/listed system matched to that assembly — not "red caulk."',
    whyText:
      'Listed firestop systems specify the assembly, the penetrating items, the annular space and the materials together. A tube labeled "fire rated" means nothing outside its tested system; the wrong system is a failed assembly.',
    correctionText: 'Identify the assembly, select a listed system that matches it and the penetrants, and install per that system\'s documentation.',
    sourceRefs: ['bldg_fire', 'firestop_listed', 'nec'],
  },
  {
    id: 'fire-plenum-not-assumed',
    title: 'Ceiling cavity ≠ automatically plenum',
    category: 'fire',
    authorityClass: 'code',
    jurisdiction: 'US',
    severity: 'major',
    studentText: 'Identify whether the space actually handles environmental air before applying plenum requirements — or assuming you\'re free of them.',
    whyText:
      'Environmental-air spaces trigger requirements beyond the jacket (materials in the space matter too, where adopted). But not every ceiling cavity is one — misidentifying in either direction produces a wrong installation.',
    sourceRefs: ['nec', 'bldg_fire', 'bicsi_tdmm'],
  },
  {
    id: 'fire-riser-spaces',
    title: 'Vertical spaces have their own rules',
    category: 'fire',
    authorityClass: 'code',
    jurisdiction: 'US',
    severity: 'major',
    studentText: 'Floor-to-floor runs bring riser/penetration requirements — cable rating and penetration treatment both.',
    whyText:
      'Vertical pathways can carry fire between floors; where adopted, code addresses both what cable may run there and how floor penetrations are protected. Identify the space, then install to it.',
    sourceRefs: ['nec', 'bldg_fire', 'tia569'],
  },
  {
    id: 'fire-when-unsure',
    title: 'When the rating is unknown — verify',
    category: 'fire',
    authorityClass: 'professional_practice',
    severity: 'critical',
    studentText: 'Unknown assembly, unknown space, unknown system: stop and verify with documents, the project team, or the AHJ.',
    whyText:
      'Guessing at life-safety construction converts an installer into a liability. Verification is the professional behavior the whole industry\'s documents assume.',
    sourceRefs: ['bldg_fire', 'firestop_listed'],
  },

  /* ── LABELING / DOCUMENTATION ───────────────────────────────────────── */
  {
    id: 'label-both-ends',
    title: 'Identify every cable — legibly, durably, at both ends',
    category: 'labeling',
    authorityClass: 'standard',
    severity: 'major',
    studentText: 'A unique, consistent identifier at each end (and at service points) is what makes a system serviceable.',
    whyText:
      'Labeling standards for AV and telecom exist because unlabeled cable turns every fault into archaeology. Unique IDs matched in the records let a technician trace, isolate and swap without disturbing working circuits.',
    sourceRefs: ['avixa_f501_01', 'tia606'],
  },
  {
    id: 'label-scheme-consistent',
    title: 'One scheme, used everywhere',
    category: 'labeling',
    authorityClass: 'professional_practice',
    severity: 'minor',
    studentText: 'The exact format matters less than that it is unique, consistent, and matches the documentation.',
    whyText:
      'This lab\'s IDs (e.g. STG-A-IN12 → R1-PP2-12, cable A-012) are a TRAINING EXAMPLE scheme, not an industry mandate. Real projects define their convention; professionals follow the project\'s.',
    sourceRefs: ['tia606', 'avixa_f501_01'],
  },
  {
    id: 'label-docs-match',
    title: 'Records and reality must agree',
    category: 'labeling',
    authorityClass: 'standard',
    severity: 'major',
    studentText: 'The cable schedule/as-builts must reflect what is actually installed — update them when anything changes.',
    whyText:
      'Documentation that disagrees with the wall is worse than none: it sends the next technician confidently to the wrong place. Administration standards tie identifiers to records for exactly this reason.',
    sourceRefs: ['tia606', 'avixa_verify'],
  },

  /* ── SLACK / SERVICE LOOPS ──────────────────────────────────────────── */
  {
    id: 'slack-intentional',
    title: 'Slack is intentional',
    category: 'slack',
    authorityClass: 'professional_practice',
    severity: 'minor',
    studentText: 'Provide enough accessible slack to service and re-terminate — no more, no less — stored deliberately.',
    whyText:
      'Too little slack makes every re-termination a re-pull; a giant unmanaged loop blocks pathways and access. The right amount and storage depend on cable type, location, service needs and project/manufacturer requirements — never one universal length.',
    sourceRefs: ['bicsi_itsimm', 'avixa_f502_01', 'mfr_cable'],
    numericValueIsScenarioSpecific: true,
  },

  /* ── SAFETY / SCOPE ─────────────────────────────────────────────────── */
  {
    id: 'safety-qualified-electrical',
    title: 'Permanent electrical work is for qualified persons',
    category: 'safety',
    authorityClass: 'code',
    jurisdiction: 'US',
    severity: 'critical',
    studentText: 'Permanent mains wiring must be installed by appropriately qualified personnel under applicable local requirements — this lab teaches recognition and coordination, not electrical installation.',
    whyText:
      'Electrical distribution is regulated, licensed work. The AV professional\'s job around it: recognize approved cable and routing, protect it, coordinate separation, and never modify distribution, open energized equipment, or defeat grounding.',
    sourceRefs: ['nec', 'osha'],
  },
];

export const ruleById = (id: string): CiRule | undefined => CI_RULES.find((r) => r.id === id);

/** UI copy + tint per authority class (badge system, spec §3). */
export const AUTHORITY_META: Record<AuthorityClass, { label: string; tint: string; blurb: string }> = {
  code: {
    label: 'CODE / REGULATION',
    tint: '#ff5a48',
    blurb: 'Legal or regulatory requirement where adopted/applicable. Local regulations always govern.',
  },
  standard: {
    label: 'INDUSTRY STANDARD',
    tint: '#4fd0e0',
    blurb: 'Requirement or guidance from professional consensus standards (TIA, BICSI, AVIXA, AES, ISO/IEC…).',
  },
  manufacturer: {
    label: 'MANUFACTURER REQUIREMENT',
    tint: '#ffd35e',
    blurb: 'Dictated by the installed product\'s documentation — the governing numbers for a specific cable or support.',
  },
  professional_practice: {
    label: 'PROFESSIONAL PRACTICE',
    tint: '#37d97b',
    blurb: 'Widely accepted workmanship that improves reliability, safety and serviceability — not automatically law.',
  },
  project_specification: {
    label: 'PROJECT SPECIFICATION',
    tint: '#c77dff',
    blurb: 'Imposed by an owner, consultant, venue, integrator or construction document for this project.',
  },
};
