/**
 * lesson09 data — "Handling & Inspection" (owner spec §5.9).
 * Pure data, zero React.
 *
 * SOURCE DISCIPLINE: every inspection fact and safety claim here is drawn from
 * the verified connector records (data/connectors.*.ts) — grip-the-plug-body,
 * damaged-cord removal and full-uncoil-under-load are VERIFIED claims in
 * mains_wall; latch behavior from xlr3/speakon/ethercon; bend-radius and
 * end-face care from toslink/opticalcon; Class II no-earth design from
 * iec_c7_c8; combo no-latch from combo_xlr_trs; label legibility from
 * bnc/iec_c13_c14/dc_barrel/ts_speaker_legacy. Items that are standard rigging
 * practice rather than record-verified (over-under coiling, end labeling,
 * right-angle crossing, no-knots) are marked STANDARD PRACTICE in comments and
 * flagged to the orchestrator.
 */

// ─────────────────────────────────────────────────────────────────────────────
// (a) Correct handling practices — chip-selected practice cards

export type HandlingPractice = {
  id: string;
  /** Chip label (short, uppercase). */
  label: string;
  /** Card headline. */
  title: string;
  /** Practice copy — record-consistent where the records cover it. */
  copy: string;
};

export const HANDLING_PRACTICES: HandlingPractice[] = [
  {
    id: 'grip_body',
    label: 'GRIP THE BODY',
    title: 'Connect and disconnect by the connector body',
    copy:
      'Never pull the cable. Cord-yanking is how strain reliefs fail and conductors pull loose inside the connector — on a mains plug, grip the plug itself, every time. The cable carries signal or power; the connector body carries the pulling.',
  },
  {
    id: 'release_latch',
    label: 'RELEASE THE LATCH',
    title: 'Operate the release before pulling',
    copy:
      'Latching connectors do not pull free by design: a locked XLR will not come out without its release tab pressed, and a locked twist-lock will not rotate back without its release operated. Resistance means find the latch — not pull harder.',
  },
  {
    id: 'support_weight',
    label: 'SUPPORT THE WEIGHT',
    title: 'Support the cable along its run',
    copy:
      'A cable should be supported along its run rather than hanging by the connector. Shells and receptacles are contact systems, not load-bearing hardware — years of cable strain is exactly what makes ports loose, rocking and intermittent.',
  },
  {
    id: 'traffic_ramps',
    label: 'PROTECT FROM TRAFFIC',
    title: 'Cable ramps where cable meets traffic',
    copy:
      'Cords crossing walkways belong under cable ramps. A run through a traffic area or under scenery without protection is a hazard to people and to the cable — and on power runs, protection from traffic is part of the connection being safe at all.',
  },
  {
    id: 'pinch_points',
    label: 'AVOID PINCH POINTS',
    title: 'Keep cable out of doors, edges and pinch points',
    copy:
      'Doors, sharp edges and pinch points cut jackets and crush what is inside. Crush and kink damage can be invisible from outside — network pair geometry and optical fiber both fail this way while the jacket still looks fine.',
  },
  {
    id: 'keep_dry',
    label: 'KEEP IT DRY',
    title: 'Dry connections, unless the assembly is rated',
    copy:
      'Keep connections dry unless the exact assembly is rated for the environment. Never handle energized power connections with wet hands, in rain, or in standing water — and outdoors, power belongs on GFCI-protected circuits with rated cords and connectors.',
  },
  {
    // STANDARD PRACTICE: the both-ends labeling habit is textbook rigging
    // practice; the legibility requirement itself is record-derived
    // (bnc / iec_c13_c14 / dc_barrel / ts_speaker_legacy).
    id: 'label_ends',
    label: 'LABEL BOTH ENDS',
    title: 'Label both ends, keep every marking legible',
    copy:
      'Label both ends of a cable consistently, and keep printed ratings and jacket markings readable. Identification lives in the labeling, never in the connector shape — a cable that cannot prove what it is (speaker or instrument, cord gauge, impedance) cannot be trusted with a job.',
  },
  {
    // STANDARD PRACTICE: over-under coiling is standard rigging craft, not a
    // connector-record claim (owner list + lesson intro sanction the item).
    id: 'over_under',
    label: 'COIL OVER-UNDER',
    title: 'Over-under coiling for flexible signal cables',
    copy:
      'Coil flexible signal cables over-under — alternating each loop’s twist so the cable stores without building in coil memory and pays out flat instead of in kinks. Work with the cable’s natural lay; forcing loops against it is how permanent twists start.',
  },
  {
    // Knot prohibition is STANDARD PRACTICE; bend-radius consequences are
    // record-derived (toslink / opticalcon_style / ethernet_8p8c).
    id: 'bend_radius',
    label: 'NO KNOTS, NO TIGHT BENDS',
    title: 'Respect bend radius; never knot a cable',
    copy:
      'Tight knots and tight-radius bends damage cables from the inside. Optical fiber is the extreme case — kinks, tight bends and crushing damage the fiber invisibly, and a rugged trunk shell does not make the glass kink-proof — but copper pairs lose their geometry the same quiet way.',
  },
  {
    // STANDARD PRACTICE: separation/right-angle crossing is standard system
    // practice (lesson intro sanctions "keep power and signal apart").
    id: 'separation',
    label: 'SIGNAL APART FROM MAINS',
    title: 'Separate signal from mains; cross at right angles',
    copy:
      'Run signal cables and mains power apart, not bundled side by side. Where they must meet, cross cleanly at right angles instead of running parallel — the least coupling for the shortest distance.',
  },
  {
    id: 'uncoil_reels',
    label: 'UNCOIL POWER REELS',
    title: 'Fully uncoil extension reels under heavy load',
    copy:
      'A coiled extension reel drawing a heavy load traps its own heat — the cable becomes its own insulation. Uncoil the reel fully before putting real current through it.',
  },
  {
    id: 'defective_out',
    label: 'DEFECTIVE = OUT',
    title: 'Damaged power cables leave service immediately',
    copy:
      'Cracked jackets, exposed conductors, heat-marked plugs, a missing ground pin: the cord leaves service the moment you see it. “It still works” is not a working cord — and mains cord repair is qualified-person work, never beginner work.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// (b) The inspection eye — record-derived fault vocabulary (reference list)

export type FaultTerm = {
  id: string;
  term: string;
  /** What it looks like in the field — drawn from record inspectionPoints. */
  looksLike: string;
};

export const FAULT_VOCABULARY: FaultTerm[] = [
  {
    id: 'bent_missing_pins',
    term: 'BENT / MISSING PINS',
    looksLike:
      'Bent, pushed-in or missing contacts — sight down the connector face. A mains plug missing its ground pin is not a working plug.',
  },
  {
    id: 'corrosion',
    term: 'CORROSION',
    looksLike:
      'Dull, darkened or corroded contact surfaces; oxidized copper at terminals — a resistance and reliability problem wherever it appears.',
  },
  {
    id: 'burn_marks',
    term: 'BURN MARKS',
    looksLike:
      'Melting, browning, scorching, pitting or a burnt smell at contacts or connector faces — evidence of overheated contacts or connection under load.',
  },
  {
    id: 'cracked_bodies',
    term: 'CRACKED BODIES',
    looksLike: 'Cracked shells, plug bodies, lobes or the insulating washers that separate contacts.',
  },
  {
    id: 'loose_shells',
    term: 'LOOSE SHELLS',
    looksLike: 'Loose or spinning barrels, spread shell edges, screw-together bodies that have backed off.',
  },
  {
    id: 'broken_latches',
    term: 'BROKEN LATCHES',
    looksLike:
      'A latch that no longer clicks, holds against a gentle tug, or springs back — on XLRs, locking power connectors and shell systems alike.',
  },
  {
    id: 'strain_relief',
    term: 'DAMAGED STRAIN RELIEF',
    looksLike: 'Strain relief pulled out of the boot; the jacket slipping or twisting where it enters the connector.',
  },
  {
    id: 'jacket_cuts',
    term: 'JACKET CUTS',
    looksLike: 'Cut, cracked or split outer jacket anywhere along the run.',
  },
  {
    id: 'exposed_insulation',
    term: 'EXPOSED INSULATION',
    looksLike:
      'Inner conductors or their insulation visible where the jacket has pulled back or been cut. On a power cable this means immediate removal from service.',
  },
  {
    id: 'crush_kink',
    term: 'CRUSH / KINK',
    looksLike:
      'Kinks, crush marks, flattened sections, tight staples. Twisted-pair geometry and optical fiber are damaged invisibly — the jacket can look fine.',
  },
  {
    id: 'loose_strands',
    term: 'LOOSE STRANDS',
    looksLike:
      'Frayed, broken or whiskering strands at terminations; stray strands escaping a clamp can bridge adjacent terminals.',
  },
  {
    id: 'optical_ends',
    term: 'CONTAMINATED OPTICAL ENDS',
    looksLike:
      'Dirty, scratched or chipped fiber end-faces (inspect against light); dust caps missing from unused ports and stored cables.',
  },
  {
    id: 'modular_latches',
    term: 'DAMAGED MODULAR LATCHES',
    looksLike: 'Snapped or weakened latch tabs on network plugs — the plug stays seated only by luck.',
  },
  {
    id: 'movement_intermittents',
    term: 'MOVEMENT INTERMITTENTS',
    looksLike:
      'Crackle, dropout or cut-in-and-out when the cable is flexed or wiggled at the connector — a failing joint at the termination.',
  },
  {
    id: 'missing_ground',
    term: 'MISSING GROUND CONTACT',
    looksLike:
      'A ground pin absent from a plug that was built with one — removal from service. (A two-pole Class II cord never had one, by design.)',
  },
  {
    id: 'unreadable_labeling',
    term: 'UNREADABLE LABELING',
    looksLike:
      'Jacket printing or rating labels worn illegible — the cable can no longer prove what it is or what it may safely carry.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// (c) The Inspection Scene — 12 judged vignettes (8 faulty + 4 acceptable)

export type SceneJudgment = 'fault' | 'ok';

export type SceneItem = {
  id: string;
  /** Short field vignette the learner judges. */
  vignette: string;
  answer: SceneJudgment;
  /** Shown on a wrong pick — points back at the deciding detail. */
  nudge: string;
  /** Shown on the correct pick — fault + disposition, or why it passes. */
  explain: string;
};

export const SCENE_ITEMS: SceneItem[] = [
  {
    id: 'xlr_boot',
    vignette: 'An XLR whose boot slides freely and the jacket turns inside the shell.',
    answer: 'fault',
    nudge: 'What is protecting the solder joints inside that shell from every pull on the cable?',
    explain:
      'Damaged strain relief — the terminations are taking every pull directly. Crackle when flexed comes next, then a dead conductor. Disposition: repair by a qualified person (re-termination), or remove it from service.',
  },
  {
    id: 'figure8_no_ground',
    vignette: 'A small player’s detachable power cord with only two poles — no ground contact anywhere on it.',
    answer: 'ok',
    nudge: 'Was this cord ever built with a third contact? Equipment class decides what “complete” looks like.',
    explain:
      'Passes. This is a two-pole Class II (figure-8) cord: the equipment protects users with double or reinforced insulation instead of a protective earth. The missing third contact is a design property, not a defect — a missing ground is only a fault on a plug built with one.',
  },
  {
    id: 'mains_jacket_cut',
    vignette: 'A mains extension cord with a cut in the jacket; the colored insulation of the inner conductors shows through.',
    answer: 'fault',
    nudge: 'One layer of this cable’s protection is already gone. What does the next layer down carry?',
    explain:
      'A jacket cut exposing inner conductors on a power cable. Disposition: remove from service immediately — “it still works” is not a working cord, and mains cord repair is qualified-person work, never a taped-over field fix.',
  },
  {
    id: 'ts_crackle',
    vignette: 'A ¼-inch instrument cable that crackles every time it is flexed near the plug.',
    answer: 'fault',
    nudge: 'The sound only happens when the cable moves at the plug. What does that localize?',
    explain:
      'A movement-related intermittent — a failing joint at the termination. Intermittents get worse, never better. Disposition: repair by a qualified person (re-termination), or remove it from service.',
  },
  {
    id: 'speakon_locked',
    vignette: 'A speakON that will not pull straight out, and will not twist back until its release is operated.',
    answer: 'ok',
    nudge: 'How is a correctly locked twist-lock supposed to behave under a firm tug?',
    explain:
      'Passes. That is the positive lock doing its job: insert, twist to the click — then a firm tug should NOT pull it free and a gentle counter-twist should NOT rotate it back without the release. Refusing to yield is the confirmation, not a defect.',
  },
  {
    id: 'rj45_latch',
    vignette: 'A network plug whose latch tab has snapped off; it seats in the jack but slides back out on its own.',
    answer: 'fault',
    nudge: 'What was holding this plug in the jack — and what holds it now?',
    explain:
      'A damaged modular latch — retention is gone, and a plug that stays seated only by luck is an intermittent waiting to happen. Disposition: re-termination with a new plug by a qualified person, or remove the cable from service.',
  },
  {
    id: 'ground_pin_missing',
    vignette: 'A three-prong wall plug with the ground pin missing — it plugs in fine and the equipment powers up.',
    answer: 'fault',
    nudge: 'Powering up proves the line and neutral paths. What path did this plug lose?',
    explain:
      'A plug missing its ground pin is not a working plug — the earth pin is the fault-current path that keeps a fault from energizing the equipment chassis. Disposition: remove from service immediately; the missing pin is never adapted around or ignored.',
  },
  {
    id: 'combo_no_latch',
    vignette: 'A compact interface’s combo input that holds an XLR by friction only — no click on insertion.',
    answer: 'ok',
    nudge: 'Do all combo receptacles latch? Check what this design ships with before judging it.',
    explain:
      'Passes. Many combo receptacles — including those on common compact interfaces — have no XLR latch at all, and the ¼-inch path is always friction-only. On these, the absence of a click is a design property, not damage. Check the receptacle in front of you.',
  },
  {
    id: 'iec_heat',
    vignette: 'An IEC power cord browned around the coupler face, with a faint burnt smell.',
    answer: 'fault',
    nudge: 'What leaves brown marks and a smell on a power coupler — and does that get better on its own?',
    explain:
      'Heat discoloration and a burnt smell are signs of overheated contacts — a high-resistance connection that only gets hotter under load. Disposition: remove from service immediately.',
  },
  {
    id: 'optical_kinked',
    vignette: 'An optical cable stored in a tight knotted coil; one section is visibly kinked and both dust caps are missing.',
    answer: 'fault',
    nudge: 'This cable carries light through glass fiber. What do a kink and an uncapped end-face each do to that?',
    explain:
      'Two faults at once: kinks and tight-radius bends damage the fiber invisibly, and uncapped end-faces collect the dirt that later gets troubleshot as an equipment problem. Disposition: a kinked fiber is suspect — remove it from service.',
  },
  {
    id: 'barrel_labels',
    vignette:
      'A power adapter whose barrel seats to full depth without wobble; the supply label and the label beside the device jack are both legible and agree — voltage, DC, polarity symbol and current.',
    answer: 'ok',
    nudge: 'Walk the checklist: seating, both labels legible, every item matched. Which one failed?',
    explain:
      'Passes. This is exactly what a healthy low-voltage power connection looks like: fully seated with no wobble, both labels legible, and every label item matched — voltage, DC type, polarity symbol, and supply current at or above the device’s requirement.',
  },
  {
    id: 'worn_printing',
    vignette:
      'A ¼-inch-to-¼-inch lead from the loudspeaker bin — but the jacket printing is completely worn away, and nothing says whether it is speaker or instrument cable.',
    answer: 'fault',
    nudge: 'Could you prove what this cable is before patching it? A continuity test will not tell you.',
    explain:
      'Unreadable labeling on a cable whose job depends on its construction — and a continuity test cannot tell speaker cable from instrument cable. Disposition: identify it by inspecting the construction at a connector, then RELABEL it before it returns to the shelf.',
  },
];

/** Lesson takeaway (LessonBanner idiom). */
export const L09_LESSON =
  'Handle by the body, release before pulling, support, protect, keep power and signal apart — and read a cable’s condition before you trust it. Faults are repaired by qualified people, relabeled, or removed from service; they are never talked back into the rack.';
