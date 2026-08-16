/**
 * connectors.power — core power connector records for the Cable & Connector
 * Fundamentals Lab (owner spec 2026-08-15 §5.7/§7).
 *
 * MOST SAFETY-CRITICAL FILE IN THE LAB (owner mandate 2026-08-15): scope is
 * identification, purpose, inspection and safe use ONLY. Nothing here is ever
 * termination, repair or wiring instruction — internal wiring of any mains
 * connector is qualified-person work, and every record says so. Every rating,
 * mating and hot-connection claim is subject to the B2 fact-verification
 * protocol (docs/APE_CABLE_LAB_PLAN_2026_08_15.md §9); sourceNotes carry the
 * governing standard per claim group with '— VERIFY' tags. Facts that vary by
 * equipment or model are marked `equipment-dependent` or hedged with
 * "commonly" — never presented as universal.
 *
 * Central lab principle, enforced hardest here: a connector's shape does not
 * define the cable, signal or power behind it. Fitting is not proof of
 * correctness or safety. Prohibited practices (ground-pin removal, ground-lift
 * adapters for hum, damaged cords in service, male-to-male mains cables,
 * wet/energized handling, unqualified mains wiring, signal connectors used
 * for mains) appear ONLY as never-acceptable items.
 *
 * VOICE: concise, professional, misconception-correcting. No real brands or
 * model likenesses; standard connector names (powerCON, TRUE1, NEMA, IEC…)
 * used nominatively. The xlr3 record in connectors.analog.ts is the
 * calibration exemplar for depth and voice.
 */
import type { ConnectorRecord } from '../cableTypes';

export const CONNECTORS_POWER: ConnectorRecord[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // mains_wall — regional record, structured for localization. NA (NEMA 5-15)
  // content ships first; other regions add sibling records keyed by `region`.
  {
    id: 'mains_wall',
    displayName: 'Mains wall plug (NEMA 5-15)',
    aliases: [
      'Edison plug (informal)',
      'wall plug / grounded three-prong plug',
      'NEMA 5-15P / 5-15R (plug / receptacle designations)',
    ],
    category: 'power_mains',
    tier: 'core',
    region: 'NA',
    carried: ['ac_mains'],
    typicalSources: [
      'Wall receptacles on building branch circuits',
      'Power strips and rack power distribution',
      'GFCI-protected outlets in damp or outdoor locations',
    ],
    typicalDestinations: [
      'Detachable equipment cords (to IEC couplers at the equipment end)',
      'Power adapters and supplies',
      'Powered loudspeakers, amplifiers, backline and rack gear',
    ],
    construction: 'ac_3c_grounded',
    constructionNote:
      'Grounded North American flexible cord carries three conductors — line, neutral and protective earth. The conventional NA insulation colors are black (line), white (neutral) and green (earth); that is a regional color code, not a worldwide one, and it is recognition knowledge only — cord wiring and plug termination are qualified-person work.',
    pinouts: [
      {
        id: 'nema_5_15',
        application: 'North American grounded wall power (blade recognition only — never wiring guidance)',
        carried: ['ac_mains'],
        contacts: [
          {
            label: 'Narrow blade',
            role: 'Line (“hot”) — the energized conductor',
            ink: 'lineHot',
            note: 'Polarization keeps this role consistent so switches and fuses sit in the energized conductor.',
          },
          {
            label: 'Wide blade',
            role: 'Neutral — the grounded return conductor',
            ink: 'neutral',
          },
          {
            label: 'Round pin',
            role: 'Protective earth (equipment ground)',
            ink: 'groundEarth',
            note: 'The fault-current path that protects people. Never removed, never bypassed.',
          },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'n/a',
    channels: 'n/a',
    locking: {
      method: 'friction',
      howToConfirm:
        'Fully seated: no blade metal visible at the receptacle face. Friction is the only retention, so dress cables away from feet and traffic.',
    },
    directionality:
      'Energized contacts always live on the recessed (female) side — receptacles and cord sockets. Exposed pins belong to the load side — but during insertion and removal there is a moment when a partially seated plug has energized blade metal exposed at the receptacle face, because NEMA blades carry no insulating sleeves. Insert and remove in one full motion, grip only the plug body, and keep fingers and anything metallic away from the receptacle face. This is also exactly why a male-to-male mains cable is never acceptable: it puts live mains voltage on fully exposed pins.',
    hotPlug: {
      policy: 'de_energize_first',
      rationale:
        'A wall plug is built to be inserted into a live receptacle, but the working default is: equipment switched off, then connect, then power up. That prevents contact arcing under load, prevents pops through an audio system, and means a fault is discovered at switch-on rather than at full load.',
    },
    advantages: [
      'Polarized — the wide (neutral) and narrow (line) blades keep conductor roles consistent through the system',
      'Grounded — the earth pin provides the fault-current path that protects users',
      'Universally available in North American buildings and venues',
    ],
    limitations: [
      'Region-specific: this pattern is North American; other regions use different plugs, voltages and frequencies',
      'No locking or retention — a snagged cable pulls free, or worse, partway free',
      'Two-blade plugs on double-insulated (Class II) devices share the same receptacles; the absence of an earth pin is only correct on equipment designed without one',
    ],
    commonMistakes: [
      'Removing, bending back, or adapting away the ground pin so a three-prong plug fits a two-slot outlet — never acceptable; the earth pin is what keeps a fault from energizing the equipment chassis',
      'Using a ground-lift (“cheater”) adapter to cure hum — never acceptable; hum is solved on the signal side (isolation transformers, proper grounding practice), never by defeating the safety earth',
      'Keeping a damaged cord in service because “it still works” — cracked jackets, exposed conductors and heat-marked plugs leave service immediately',
      'Unplugging by pulling the cord instead of gripping the plug body — cord-yanking is how strain reliefs fail and conductors pull loose inside the plug; grip the plug itself, every time',
      'Building or using a male-to-male mains cable for any purpose — the free end carries live, exposed pins the instant the other end is plugged in',
      'Handling plugs, receptacles or connections with wet hands, in rain, or in standing water while anything is energized',
      'Drawing a heavy load through a coiled extension reel — a coiled cord traps its own heat; uncoil fully before loading it',
    ],
    notInterchangeableWith: [
      {
        otherName: 'Wall plugs of other regions (via shape adapters)',
        why: 'Travel adapters change the blade shape only. The voltage and frequency behind the receptacle do not change.',
        consequence:
          'Equipment rated for one voltage on a higher supply can fail violently — burst capacitors, smoke, and fire risk, not just a dead unit — and the building breaker will not save it. Check the device’s rated input range printed near its inlet (“100–240 V” means universal; a single voltage means that voltage only) — never the plug shape. If the mistake happens, unplug immediately and treat the device as suspect until inspected.',
      },
      {
        otherName: 'NEMA 5-20 (20 A straight-blade) devices',
        why: 'The 20 A receptacle has a T-shaped neutral slot that accepts both 15 A and 20 A plugs; a 20 A plug will not enter a 15 A receptacle.',
        consequence:
          'The keying protects the wiring: it prevents a 20 A load from being drawn through a 15 A path. Never modify blades to force a fit — overload and overheating follow.',
      },
      {
        otherId: 'nema_twist_lock',
        otherName: 'NEMA twist-lock connectors',
        why: 'Stage and distribution power often uses twist-locking blade connectors — a related-looking but separate, locking system.',
        consequence:
          'They do not mate with straight-blade devices, and twist-lock distribution is qualified-person territory — recognition only at this level.',
      },
    ],
    inspectionPoints: [
      'Bent, loose or heat-discolored blades; a plug with a missing ground pin leaves service — it is not a working plug',
      'Cracked plug body; jacket pulled out of the strain relief exposing inner conductors',
      'Melting, browning or a burnt smell at the plug or receptacle face — signs of overheated contacts',
      'A plug that sits loosely in its receptacle — worn contacts run hot',
      'Environment: cords dry, protected from traffic (cable ramps in walkways), and rated for outdoor use before going outdoors',
    ],
    basicTest:
      'Only with the cord unplugged from every supply and every device: continuity end-to-end on each conductor, and no continuity between line, neutral or earth in any combination. Any conductor-to-conductor bridge — especially anything touching earth — removes the cord from service. There is no beginner live test on mains equipment.',
    safety: {
      level: 'mains',
      cautions: [
        'Internal wiring, termination or repair of any mains plug, cord or receptacle is qualified-person work — never beginner work.',
        'Outdoors and in damp locations, use GFCI (RCD) protected circuits: they disconnect quickly when current leaks to earth. Confirm protection before powering anything where water is possible.',
        'Use cords and connectors rated for the environment — indoor-rated cords do not belong outdoors, and cords crossing walkways belong under cable ramps.',
        'Never defeat polarization or grounding. The wide blade, narrow blade and earth pin each has a specific safety role.',
      ],
    },
    glossary: ['Edison Plug', 'Cable Ramp'],
    relatedLessons: ['l02_anatomy', 'l07_power', 'l09_handling'],
    sourceNotes: [
      'NEMA 5-15: 15 A / 125 V straight-blade configuration; narrow blade line, wide blade neutral, round pin equipment ground: NEMA WD 6 — VERIFIED 2026-08-15: NEMA WD 6 configuration chart',
      'NA flexible-cord color convention black=line, white=neutral, green=earth: NEC / UL flexible-cord standards — VERIFIED 2026-08-15: NEC 200.6/250.119 + UL cordset convention (EC&M flexible-cord code basics)',
      '5-20R T-slot accepts 5-15P and 5-20P; 5-20P does not enter 5-15R: NEMA WD 6 — VERIFIED 2026-08-15: NEMA WD 6 configuration chart',
      'GFCI protection for outdoor/damp use: NEC / OSHA construction-power guidance — VERIFIED 2026-08-15: NEC 210.8/406.9 + OSHA 1926.404',
      'Coiled cable reels must be fully uncoiled under significant load (heat build-up): manufacturer reel derating guidance — VERIFIED 2026-08-15: Brennenstuhl reel-safety guidance',
      'Partially inserted NEMA plugs expose energized blade metal at the receptacle face (blades carry no insulating sleeves; the documented hazard behind tamper-resistant receptacles): ESFI tamper-resistant receptacle white paper — VERIFIED 2026-08-15',
      'Unplug by gripping the plug body, never by pulling the cord: OSHA 1910.334 / ESFI extension-cord safety guidance — VERIFIED 2026-08-15',
      'Single-voltage equipment on a higher supply fails violently (burst input capacitors, smoke, fire risk) and the branch breaker does not protect against it: overvoltage failure-mode references (engineerfix.com et al.) — VERIFIED 2026-08-15',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'iec_c13_c14',
    displayName: 'IEC C13 / C14 coupler',
    aliases: [
      'IEC lead / IEC cable (informal)',
      '“kettle lead” (informal and imprecise — the true kettle coupler is the hot-rated C15/C16)',
      'computer power cord connector',
    ],
    category: 'power_mains',
    tier: 'core',
    carried: ['ac_mains'],
    typicalSources: [
      'Detachable power cords fed from wall or distribution',
      'Power strips and PDUs with C13 outlets',
      'UPS outputs (C13 outlets)',
    ],
    typicalDestinations: [
      'Mixers, amplifiers, computers and rack processors with C14 inlets',
      'Powered loudspeakers with C14 inlets',
      'Stage and studio rack equipment generally',
    ],
    construction: 'ac_3c_grounded',
    constructionNote:
      'Three-conductor cord — line, neutral and protective earth. The identical coupler ships on 120 V and 230 V cordsets worldwide, in several conductor gauges. The coupler tells you nothing about the voltage or the gauge behind it; the printed rating on the cord jacket does.',
    pinouts: [
      {
        id: 'c13_c14',
        application: 'Earthed appliance coupler, Class I equipment (recognition only)',
        carried: ['ac_mains'],
        contacts: [
          {
            label: 'L',
            role: 'Line (energized conductor)',
            ink: 'lineHot',
            note: 'Terminal designations are recognition knowledge; cord termination is factory or qualified-person work.',
          },
          { label: 'N', role: 'Neutral (grounded return conductor)', ink: 'neutral' },
          { label: 'E', role: 'Protective earth', ink: 'groundEarth' },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'n/a',
    channels: 'n/a',
    locking: {
      method: 'friction',
      howToConfirm:
        'Pushed fully home with the coupler shroud flush against the inlet. Friction is the only retention on the standard coupler — dress the cable so nothing pulls on it. Locking retention accessories exist on some equipment (equipment-dependent).',
    },
    directionality:
      'C14 (the side with pins) is the equipment inlet — the load. C13 (recessed sockets) is the cord end that brings power to it. Energized contacts always live on the recessed side; that is why the cord end is the female connector.',
    hotPlug: {
      policy: 'de_energize_first',
      rationale:
        'Ordinary appliance couplers are not certified to be connected or disconnected under load — that capability is a separate IEC 60320 classification (coupler with breaking capacity) these cordsets do not carry. Separating one while the equipment draws current can arc across the contacts: switch the equipment off first, every time.',
    },
    advantages: [
      'Detachable, replaceable cordset — a damaged cord is replaced whole, never repaired inline',
      'One worldwide equipment-side coupler; the regional wall plug lives at the other end of the cord',
      'Earthed (Class I) connection rated generously for most rack and stage equipment',
    ],
    limitations: [
      'Friction retention only — easily kicked or vibrated loose unless the cable is secured',
      'The same coupler appears on cords of very different gauge and regional voltage; the cord’s printed rating governs, never the shape',
      'Not weatherproof — an indoor-class connection unless a specifically rated assembly is used',
    ],
    commonMistakes: [
      'Grabbing “any IEC lead” without reading the printed cord rating — the coupler fits, but the conductor gauge may not match the load',
      'Treating a cord that fits as proof the equipment accepts the local voltage — the device’s rated input range governs, not the coupler',
      'Keeping a cord with a cracked coupler, heat marks or loose strain relief in service — damaged mains cords leave service immediately',
      'Feeding a chain of power strips through one light-duty cordset',
    ],
    notInterchangeableWith: [
      {
        otherName: 'IEC C15 / C16 (hot-condition coupler)',
        why: 'C15/C16 is the higher-temperature variant, distinguished by a notch. A C15 cord connector also fits C14 inlets, but a C13 will not enter a C16 inlet — the keying ridge blocks it deliberately.',
        consequence:
          'The keying prevents a standard-temperature coupler from serving hot-running equipment. Never modify a coupler to force the fit.',
      },
      {
        otherId: 'iec_c19_c20',
        otherName: 'IEC C19 / C20 coupler',
        why: 'The high-current member of the same coupler family — larger, rectangular, differently keyed.',
        consequence:
          'They do not mate, by design: the keying prevents a lighter cordset from feeding a high-current load.',
      },
    ],
    inspectionPoints: [
      'Cracked or heat-discolored coupler bodies',
      'Loose strain relief; jacket slipping out of the molded boot',
      'Bent, recessed or corroded pins on the equipment inlet',
      'Printed cord rating legible and adequate for the load it will carry',
      'A coupler that sits loose in its inlet — weak contact pressure overheats',
    ],
    basicTest:
      'Only with the cord unplugged from everything: continuity end-to-end per conductor (wall-plug blade to coupler contact) and no continuity between any two conductors. Any bridge between conductors — above all anything touching earth — removes the cord from service.',
    safety: {
      level: 'mains',
      cautions: [
        'Internal wiring or termination of mains couplers and cords is qualified-person work.',
        'The earth contact is part of the equipment’s fault protection — a cord with a broken earth conductor is not a working cord, even though the equipment powers up.',
        'Indoor-class connection: keep couplers dry and off the ground; wet locations require assemblies rated for the environment and GFCI/RCD-protected circuits.',
      ],
    },
    glossary: ['IEC Connector'],
    relatedLessons: ['l04_same_plug', 'l07_power', 'l09_handling'],
    sourceNotes: [
      'C13/C14 coupler rated 10 A / 250 V under IEC 60320-1 — VERIFIED 2026-08-15: Interpower IEC 60320 C13/C14 guide',
      'North American cordsets with the same coupler are commonly rated 15 A / 250 V under UL/CSA cordset standards — regional ratings differ from the IEC figure — VERIFIED 2026-08-15: Interpower IEC 60320 C13/C14 guide',
      'C15/C16 is the hot-condition (higher-temperature) variant; C15 mates with C14 inlets, C13 is blocked from C16 by keying: IEC 60320 — VERIFIED 2026-08-15: Access Communications IEC 60320 guide',
      'IEC 60320-1 cl. 19 type-tests couplers above 0.2 A to survive make/break cycles as a safety margin; certification for live connect/disconnect in normal use is the separate CBC classification (coupler with breaking capacity), which ordinary C13/C14 cordsets do not carry: IEC 60320-1 cl. 19 + manufacturer CBC documentation — VERIFIED 2026-08-15',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'iec_c19_c20',
    displayName: 'IEC C19 / C20 coupler',
    aliases: ['high-current IEC coupler', 'server/PDU power coupler (informal)'],
    category: 'power_mains',
    tier: 'core',
    carried: ['ac_mains'],
    typicalSources: [
      'High-current PDU outlets (C19)',
      'Dedicated high-current distribution circuits',
      'Large UPS outputs',
    ],
    typicalDestinations: [
      'Large power amplifiers with C20 inlets',
      'Amplifier racks, server and UPS equipment',
      'High-draw processing and LED equipment',
    ],
    construction: 'ac_3c_grounded',
    constructionNote:
      'Same three-conductor construction as the C13/C14 family, in heavier gauge for higher current. The rectangular coupler shape is the family’s size/keying step — the printed cord rating still governs what the cord may carry.',
    pinouts: [
      {
        id: 'c19_c20',
        application: 'High-current earthed appliance coupler (recognition only)',
        carried: ['ac_mains'],
        contacts: [
          { label: 'L', role: 'Line (energized conductor)', ink: 'lineHot' },
          { label: 'N', role: 'Neutral (grounded return conductor)', ink: 'neutral' },
          { label: 'E', role: 'Protective earth', ink: 'groundEarth' },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'n/a',
    channels: 'n/a',
    locking: {
      method: 'friction',
      howToConfirm:
        'Fully seated, shroud flush against the inlet. Friction-retained — secure the cable; retention brackets exist on some equipment (equipment-dependent).',
    },
    directionality:
      'C20 (pins) is the equipment inlet; C19 (recessed sockets) is the cord end delivering power. Energized contacts stay on the recessed side.',
    hotPlug: {
      policy: 'de_energize_first',
      rationale:
        'At this coupler’s current class, separating under load draws a substantial arc. Ordinary couplers are not certified to be connected or disconnected under load — de-energize or switch the load off before connecting or disconnecting.',
    },
    advantages: [
      'Higher current class than C13/C14 in the same detachable-cordset system',
      'Keyed so lighter-family cords cannot serve high-current loads',
      'Earthed (Class I) connection standard on high-power equipment',
    ],
    limitations: [
      'Friction retention only — heavy cords put real strain on the coupler; secure them',
      'Bulkier cordsets; not interchangeable with the far more common C13/C14 family',
      'Not weatherproof — indoor-class connection',
    ],
    commonMistakes: [
      'Assuming any “IEC cable” fits — this is a different, larger coupler than C13/C14',
      'Adapting between the C13 and C19 families to “make it work” — the keying difference exists to protect the wiring',
      'Keeping a heat-marked or cracked coupler in service on a high-current load',
    ],
    notInterchangeableWith: [
      {
        otherId: 'iec_c13_c14',
        otherName: 'IEC C13 / C14 coupler',
        why: 'The common lower-current member of the family — smaller and differently keyed.',
        consequence:
          'They do not mate. An adapter that defeats this forces a lighter cord to carry a heavy load — overheating risk. The correct answer is the correct cordset.',
      },
    ],
    inspectionPoints: [
      'Heat discoloration on the coupler face or inlet — high-current contacts show overheating first',
      'Cracked bodies, loose strain relief, jacket damage',
      'Bent or corroded inlet pins',
      'A loose-fitting coupler under a high-current load is an overheating point — verify a firm fit',
    ],
    basicTest:
      'Identical discipline to every mains cord: unplugged from everything, continuity end-to-end per conductor, no conductor-to-conductor continuity in any combination. Any anomaly removes the cord from service.',
    safety: {
      level: 'mains',
      cautions: [
        'Internal wiring or termination of mains couplers and cords is qualified-person work.',
        'High-current circuits make contact quality matter more, not less — loose or damaged couplers overheat at these loads.',
        'Indoor-class connection; wet or outdoor use requires rated assemblies and GFCI/RCD protection.',
      ],
    },
    glossary: ['IEC Connector'],
    relatedLessons: ['l07_power', 'l09_handling'],
    sourceNotes: [
      'C19/C20 coupler rated 16 A / 250 V under IEC 60320-1 — VERIFIED 2026-08-15: Interpower IEC 60320 C19/C20 guide',
      'North American use commonly rated 20 A / 250 V under UL/CSA cordset standards — regional ratings differ from the IEC figure — VERIFIED 2026-08-15: Interpower IEC 60320 C19/C20 guide',
      'C19/C20 and C13/C14 are non-intermateable by size/keying: IEC 60320 — VERIFIED 2026-08-15: Interpower IEC 60320 C19/C20 guide',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'iec_c5_c6',
    displayName: 'IEC C5 / C6 coupler',
    aliases: ['cloverleaf connector', '“Mickey Mouse” connector (informal)'],
    category: 'power_mains',
    tier: 'core',
    carried: ['ac_mains'],
    typicalSources: [
      'Detachable two-stage power cords (wall plug to C5)',
      'Compact power strips serving small equipment',
    ],
    typicalDestinations: [
      'Laptop-style power bricks with C6 inlets',
      'Small projectors and compact equipment with C6 inlets',
    ],
    construction: 'ac_3c_grounded',
    constructionNote:
      'A light three-conductor cord — line, neutral and protective earth — despite the small size. The three-lobed shape carries a full earth contact; this is the earthed small-appliance coupler, unlike the two-pole figure-8 (C7/C8).',
    pinouts: [
      {
        id: 'c5_c6',
        application: 'Low-current earthed appliance coupler, Class I equipment (recognition only)',
        carried: ['ac_mains'],
        contacts: [
          { label: 'L', role: 'Line (energized conductor)', ink: 'lineHot' },
          { label: 'N', role: 'Neutral (grounded return conductor)', ink: 'neutral' },
          { label: 'E', role: 'Protective earth', ink: 'groundEarth' },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'n/a',
    channels: 'n/a',
    locking: {
      method: 'friction',
      howToConfirm: 'Fully seated with the lobes flush against the inlet. Friction only — no latch to confirm.',
    },
    directionality:
      'C6 (pins) is the equipment inlet, typically on a power brick; C5 (recessed sockets) is the cord end that powers it. Energized contacts stay recessed.',
    hotPlug: {
      policy: 'de_energize_first',
      rationale:
        'Low current class, same discipline: ordinary appliance couplers are not certified to be connected or disconnected under load. Switch the equipment off before connecting or disconnecting.',
    },
    advantages: [
      'Compact earthed coupler for small equipment',
      'Keyed shape cannot be confused with higher-current couplers',
      'Detachable cord — regional wall plugs swap without touching the power brick',
    ],
    limitations: [
      'Low current class — light equipment only; the printed cord rating governs',
      'Friction retention; small cords snag and pull free easily',
      'Not weatherproof',
    ],
    commonMistakes: [
      'Confusing it with the two-pole figure-8 (C7) — the third lobe is a protective earth contact the equipment requires',
      'Keeping a frayed or crushed light cord in service because the equipment is small — damaged mains cords leave service regardless of size',
      'Treating the small size as a low-stakes connection — it is still mains voltage',
    ],
    notInterchangeableWith: [
      {
        otherId: 'iec_c7_c8',
        otherName: 'IEC C7 / C8 (figure-8) coupler',
        why: 'C7 is the two-pole, unearthed cousin. C5 carries a third, earth contact and a different three-lobed shape.',
        consequence:
          'They do not mate. Equipment with a C6 inlet requires the earth path — never adapt an earthed inlet onto an unearthed cord.',
      },
    ],
    inspectionPoints: [
      'Cracked lobes or heat discoloration at the coupler',
      'Strain relief integrity — thin cords fail at the boot first',
      'Bent or corroded inlet pins on the power brick',
      'Loose fit in the inlet',
    ],
    basicTest:
      'Unplugged from everything: continuity end-to-end on all three conductors, no continuity between any two. An earth conductor that reads open means the cord leaves service even though the equipment would still power up.',
    safety: {
      level: 'mains',
      cautions: [
        'Internal wiring or termination of mains couplers and cords is qualified-person work.',
        'The earth contact exists because the connected equipment is designed to need it — a missing or broken earth path is a fault, not a detail.',
      ],
    },
    glossary: ['IEC Connector'],
    relatedLessons: ['l07_power', 'l09_handling'],
    sourceNotes: [
      'C5/C6 coupler rated 2.5 A / 250 V under IEC 60320-1 — VERIFIED 2026-08-15: Interpower IEC 60320 C5–C8 guide',
      'C5/C6 is the earthed low-current coupler (three contacts incl. protective earth), distinct from two-pole C7/C8: IEC 60320 — VERIFIED 2026-08-15: Interpower IEC 60320 C5–C8 guide',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'iec_c7_c8',
    displayName: 'IEC C7 / C8 coupler',
    aliases: ['figure-8 connector', 'figure-of-eight power coupler'],
    category: 'power_mains',
    tier: 'core',
    carried: ['ac_mains'],
    typicalSources: ['Detachable two-conductor power cords (wall plug to C7)'],
    typicalDestinations: [
      'Double-insulated (Class II) consumer devices with C8 inlets',
      'Small power bricks, compact players and chargers with C8 inlets',
    ],
    constructionNote:
      'A two-conductor Class II cord — there is no earth conductor anywhere in the cable, by design. Class II means the equipment protects users with double or reinforced insulation instead of a protective earth. The missing third contact is a design property of the equipment, not a defect — but it is only safe because the equipment is built that way.',
    pinouts: [
      {
        id: 'c7_c8',
        application: 'Two-pole Class II appliance coupler — no protective earth (recognition only)',
        carried: ['ac_mains'],
        contacts: [
          {
            label: 'Pole 1',
            role: 'Line or neutral — unpolarized versions do not fix which',
            ink: 'lineHot',
            note: 'On the common unpolarized C7 either pole may be the energized conductor, depending on orientation.',
          },
          {
            label: 'Pole 2',
            role: 'Line or neutral — the other conductor of the pair',
            ink: 'neutral',
            note: 'A polarized C7 variant exists (one edge squared) for equipment that requires fixed line/neutral orientation — check the equipment inlet and documentation.',
          },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'n/a',
    channels: 'n/a',
    locking: {
      method: 'friction',
      howToConfirm: 'Fully seated in the inlet. Friction only.',
    },
    directionality:
      'C8 (pins) is the equipment inlet; C7 (recessed) is the cord end. Unpolarized C7 cords insert either way up; polarized variants are keyed to insert one way.',
    hotPlug: {
      policy: 'de_energize_first',
      rationale:
        'Same rule as every ordinary appliance coupler: not certified to be connected or disconnected under load. Switch the device off before connecting or disconnecting.',
    },
    advantages: [
      'Very compact two-pole coupler for double-insulated devices',
      'Cannot be mistaken for an earthed coupler — visibly two-pole',
      'Detachable cord keeps regional wall plugs off the device',
    ],
    limitations: [
      'No protective earth — correct only for equipment designed as Class II (double insulated)',
      'Low current class; light cords only',
      'Polarized and unpolarized variants exist and look nearly identical — match the cord to the inlet',
    ],
    commonMistakes: [
      'Treating the missing earth contact as a defect and trying to “add a ground” — Class II equipment is designed without one',
      'Forcing a polarized C7 (one squared edge) where it does not seat, or forcing any coupler that resists — keying differences are intentional',
      'Keeping a kinked, crushed or split figure-8 cord in service — thin two-conductor cords damage easily and still carry mains voltage',
    ],
    notInterchangeableWith: [
      {
        otherId: 'iec_c5_c6',
        otherName: 'IEC C5 / C6 (cloverleaf) coupler',
        why: 'The earthed small-appliance coupler — three contacts and a different shape.',
        consequence: 'They do not mate; the equipment classes they serve (earthed vs double-insulated) are different by design.',
      },
      {
        otherName: 'Polarized vs unpolarized C7 (within the family)',
        why: 'A polarized C7 has one squared edge and mates one way with a polarized inlet; the common unpolarized C7 is rounded on both edges.',
        consequence:
          'Using an unpolarized cord where the equipment specifies a polarized one can defeat the line/neutral orientation the designer intended. Match the cord to the inlet per the equipment documentation.',
      },
    ],
    inspectionPoints: [
      'Splits or kinks in the thin two-conductor cord — the most common failure',
      'Cracked coupler body or heat marks',
      'Strain relief at both ends intact',
      'Loose fit in the inlet',
    ],
    basicTest:
      'Unplugged from everything: continuity end-to-end on both conductors, no continuity between the two. Both-pole integrity matters — an intermittent pole makes the device cut in and out at mains voltage.',
    safety: {
      level: 'mains',
      cautions: [
        'Internal wiring or termination of mains couplers and cords is qualified-person work.',
        'No earth does not mean low stakes: both conductors carry mains voltage. Damaged figure-8 cords leave service immediately.',
        'Never adapt Class I (earthed) equipment onto a two-pole cord — the earth path is part of that equipment’s protection.',
      ],
    },
    glossary: ['IEC Connector'],
    relatedLessons: ['l07_power', 'l09_handling'],
    sourceNotes: [
      'C7/C8 coupler rated 2.5 A / 250 V, two-pole, Class II (no earth) under IEC 60320-1 — VERIFIED 2026-08-15: Interpower IEC 60320 C5–C8 guide',
      'Polarized C7 variant (one squared edge, squared side = neutral) is a North American cordset-industry variant (C7P) used where equipment requires fixed polarity — not an IEC 60320 standard sheet; unpolarized C7 is the common form: cordset-industry documentation — VERIFIED 2026-08-15',
      'Class II = protection by double/reinforced insulation, no reliance on protective earth: IEC 61140 protection-class definitions — VERIFIED 2026-08-15: Interpower guide (protection classes per IEC 61140)',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'powercon_xx',
    displayName: 'powerCON (20 A family)',
    aliases: ['powerCON (original blue/gray family)', 'locking mains connector (stage power)'],
    category: 'power_mains',
    tier: 'core',
    carried: ['ac_mains'],
    typicalSources: [
      'Power distribution with powerCON outputs',
      'Daisy-chain power-out sockets on stage equipment',
    ],
    typicalDestinations: [
      'Powered loudspeakers with powerCON inlets',
      'Moving lights and LED fixtures',
      'Amplifier racks and touring equipment',
    ],
    construction: 'ac_3c_grounded',
    constructionNote:
      'Three-conductor mains cable (line, neutral, protective earth) in a locking stage shell. The locking shell changes reliability, not the stakes: this is a mains connection, identical in seriousness to a wall plug.',
    pinouts: [
      {
        id: 'powercon_20a',
        application: 'Locking mains power, stage and touring equipment (recognition only)',
        carried: ['ac_mains'],
        contacts: [
          {
            label: 'L',
            role: 'Line (energized conductor)',
            ink: 'lineHot',
            note: 'Contact roles are marked on the connector insert; the exact model’s datasheet governs.',
          },
          { label: 'N', role: 'Neutral (grounded return conductor)', ink: 'neutral' },
          { label: 'E', role: 'Protective earth', ink: 'groundEarth' },
        ],
        confidence: 'convention',
        verifyAgainst: 'The exact connector model’s datasheet and the L/N/earth markings on the insert.',
      },
    ],
    balanced: 'n/a',
    channels: 'n/a',
    locking: {
      method: 'twist_lock',
      howToConfirm:
        'With the circuit de-energized: insert and twist until the latch clicks home; a locked connector will not rotate back without pressing the release. Confirm the click, then tug gently — this check belongs BEFORE power is applied, because a tug on an unlatched connector must never happen on a live line.',
    },
    directionality:
      'This family separates power-in and power-out into differently keyed, color-coded connectors (power-in conventionally blue, power-out gray) so an energized output cannot be mated where an input belongs. If two parts do not go together, the answer is the correct part — never force, never adapt.',
    hotPlug: {
      policy: 'de_energize_first',
      rationale:
        'The original powerCON family has no breaking capacity — it is not rated to make or break the circuit under load, and the manufacturer prohibits connecting or disconnecting while energized. De-energize first, every time.',
    },
    advantages: [
      'Locking mains connection — cannot be kicked or vibrated loose like a friction coupler',
      'Keyed input/output versions prevent miswiring a daisy-chain',
      'Rugged shell built for touring conditions',
    ],
    limitations: [
      'No breaking capacity — must never be connected or disconnected under load',
      'Not intermateable with the TRUE1 family despite the related name',
      'Ratings and environmental capability are model-specific — the exact product’s documentation governs',
    ],
    commonMistakes: [
      'Assuming a loudspeaker twist-lock connector and a powerCON are interchangeable because they look and lock similarly — a loudspeaker connector is never used for mains, and a mains connector is never used for loudspeakers',
      'Treating powerCON and TRUE1 as one system — they are separate, non-intermateable families',
      'Breaking a powered connection “just this once” — this family has no breaking capacity; de-energize first is the rule, not a preference',
      'Handling stage power connections in rain or standing water while energized',
      'Keeping a scorched or cracked connector in service',
    ],
    notInterchangeableWith: [
      {
        otherId: 'powercon_true1',
        otherName: 'powerCON TRUE1',
        why: 'A separate connector family with different geometry and keying, despite the related name.',
        consequence: 'They do not mate. Treat them as different connectors, not versions of one — the correct mating part is the only fix.',
      },
      {
        otherId: 'speakon_nl4',
        otherName: 'speakON loudspeaker connector',
        why: 'The loudspeaker twist-lock family shares the insert-and-twist gesture and a similar shell style. speakON carries loudspeaker signal; powerCON carries mains.',
        consequence:
          'They are keyed differently and must never be adapted to each other. A mismade adapter would put mains voltage on loudspeaker wiring — equipment damage and electrical danger.',
      },
      {
        otherName: 'Its own power-in vs power-out versions',
        why: 'Input (blue) and output (gray) connectors within the family are keyed so they cannot cross-mate.',
        consequence: 'A cable that does not fit is telling you it is the wrong part. Never force or modify it.',
      },
    ],
    inspectionPoints: [
      'Latch engages with a positive click and holds against a gentle tug',
      'Scorching, discoloration or pitting at the contacts — signs of connection under load or poor contact',
      'Cracked shell or damaged keyway',
      'Strain relief tight; jacket undamaged into the boot',
      'Correct family and direction (in vs out) for the socket it will mate with',
    ],
    basicTest:
      'De-energized and disconnected at both ends only: continuity end-to-end per conductor and no continuity between conductors. Assembly, repair and termination are qualified-person work — a beginner’s test role is inspection and continuity on a dead cable.',
    safety: {
      level: 'mains',
      cautions: [
        'This is a mains power connector. It is never a loudspeaker connector, whatever it visually resembles.',
        'De-energize before making or breaking the connection — this family has no breaking capacity.',
        'Internal termination of any mains connector is qualified-person work.',
        'Verify environmental ratings from the exact model’s documentation before any outdoor use, and keep energized connections out of rain and standing water.',
      ],
    },
    glossary: ['Speakon'],
    relatedLessons: ['l05_loudspeaker', 'l07_power', 'l09_handling'],
    sourceNotes: [
      'Original powerCON family rated 20 A / 250 V: manufacturer datasheet — VERIFIED 2026-08-15: Neutrik powerCON documentation',
      'No breaking capacity — connection/disconnection under load prohibited: manufacturer datasheet — VERIFIED 2026-08-15: Neutrik powerCON documentation',
      'Power-in (blue) and power-out (gray) versions keyed non-intermateable: manufacturer datasheet — VERIFIED 2026-08-15: Neutrik powerCON documentation',
      'powerCON and powerCON TRUE1 are not intermateable: manufacturer documentation — VERIFIED 2026-08-15: Neutrik powerCON documentation',
      'L/N/PE contact designations marked on the insert: manufacturer datasheet — VERIFIED 2026-08-15: Neutrik datasheet insert markings (model-datasheet pointer retained for brand-neutral compatibles)',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'powercon_true1',
    displayName: 'powerCON TRUE1',
    aliases: ['TRUE1', 'locking mains connector with breaking capacity (model-specific)'],
    category: 'power_mains',
    tier: 'core',
    carried: ['ac_mains'],
    typicalSources: [
      'Power distribution with TRUE1 outputs',
      'Daisy-chain power-out sockets on fixtures and speakers',
    ],
    typicalDestinations: [
      'Powered loudspeakers with TRUE1 inlets',
      'Moving lights, LED fixtures and video panels',
      'Touring racks and portable systems',
    ],
    construction: 'ac_3c_grounded',
    constructionNote:
      'Three-conductor mains cable in a locking shell, like the original powerCON — but a physically different, non-intermateable connector family. The related name does not make the parts compatible.',
    pinouts: [
      {
        id: 'true1',
        application: 'Locking mains power, stage and touring equipment (recognition only)',
        carried: ['ac_mains'],
        contacts: [
          {
            label: 'L',
            role: 'Line (energized conductor)',
            ink: 'lineHot',
            note: 'Contact roles are marked on the connector insert; the exact model’s datasheet governs.',
          },
          { label: 'N', role: 'Neutral (grounded return conductor)', ink: 'neutral' },
          { label: 'E', role: 'Protective earth', ink: 'groundEarth' },
        ],
        confidence: 'convention',
        verifyAgainst: 'The exact connector model’s datasheet and the L/N/earth markings on the insert.',
      },
    ],
    balanced: 'n/a',
    channels: 'n/a',
    locking: {
      method: 'twist_lock',
      howToConfirm:
        'With the circuit de-energized (the beginner default for every mains connection): insert and twist until the latch clicks home; the connector should not rotate back without pressing the release. Confirm the click and tug gently before power is applied.',
    },
    directionality:
      'Input and output versions are keyed differently so a live output socket and an equipment inlet cannot be confused. As with the original family: parts that do not fit are the wrong parts.',
    hotPlug: {
      policy: 'de_energize_first',
      rationale:
        'Some TRUE1-style couplers are certified with breaking capacity — rated to be connected and disconnected under load. That property is model-specific: the exact product’s documentation governs, and it is never assumed from the shape. The beginner default remains: de-energize before making or breaking any mains connection.',
    },
    advantages: [
      'Locking mains connection designed as a true appliance coupler',
      'Breaking capacity on models certified for it (model-specific — see documentation)',
      'Sealed variants offer environmental protection when fully mated (model-specific)',
    ],
    limitations: [
      'Not intermateable with the original powerCON family despite the related name',
      'Lower current class than the original 20 A family (commonly rated 16 A — verify the exact model)',
      'Every capability that matters (breaking capacity, outdoor rating) is model-specific, never assumed from the shell',
    ],
    commonMistakes: [
      'Assuming every TRUE1-style connector may be disconnected under load because “TRUE1 can do that” — breaking capacity belongs to specific certified models, and the habit of de-energizing first costs nothing',
      'Forcing or adapting between TRUE1 and original powerCON — separate families, by design',
      'Using a loudspeaker connector and a mains connector interchangeably in any direction — never acceptable',
      'Assuming outdoor capability without checking the exact model’s rating and confirming the connection is fully mated',
      'Keeping a scorched, cracked or unsealed-when-it-should-seal connector in service',
    ],
    notInterchangeableWith: [
      {
        otherId: 'powercon_xx',
        otherName: 'powerCON (20 A family)',
        why: 'The original family — different geometry, different keying, different ratings.',
        consequence: 'They do not mate. Only the correct mating part fixes a mismatch.',
      },
      {
        otherId: 'speakon_nl4',
        otherName: 'speakON loudspeaker connector',
        why: 'Similar twist-lock stagecraft, entirely different job: loudspeaker signal vs mains power.',
        consequence:
          'Never adapted to each other in either direction. Mains on loudspeaker wiring means equipment damage and electrical danger.',
      },
    ],
    inspectionPoints: [
      'Latch clicks home and resists a gentle tug',
      'Sealing surfaces (on sealed models) clean and undamaged',
      'Contact scorching or pitting — evidence of load-breaking beyond the model’s rating or poor contact',
      'Strain relief and jacket condition at the boot',
      'Correct family and direction for the mating socket',
    ],
    basicTest:
      'De-energized and disconnected at both ends only: continuity end-to-end per conductor, no continuity between conductors. Termination and repair are qualified-person work.',
    safety: {
      level: 'mains',
      cautions: [
        'This is a mains power connector — never a loudspeaker connector.',
        'Breaking capacity is a certified, model-specific property. The beginner rule that is always safe: de-energize before making or breaking mains connections.',
        'Internal termination of any mains connector is qualified-person work.',
        'Outdoor use requires the exact model’s environmental rating and a fully mated connection; energized connectors never live in rain or standing water.',
      ],
    },
    glossary: ['Neutrik powerCON TRUE1 Connector', 'Speakon'],
    relatedLessons: ['l05_loudspeaker', 'l07_power', 'l09_handling'],
    sourceNotes: [
      'TRUE1 family commonly rated 16 A / 250 V: manufacturer datasheet — VERIFIED 2026-08-15: Neutrik TRUE1 documentation (UL/VDE 16 A 250 V)',
      'Certified breaking capacity (connect/disconnect under load) on specific TRUE1 models — model-specific, never universal: manufacturer datasheet / VDE certification — VERIFIED 2026-08-15: Neutrik TRUE1 documentation',
      'TRUE1 and original powerCON are not intermateable: manufacturer documentation — VERIFIED 2026-08-15: Neutrik TRUE1 documentation',
      'Environmental sealing when mated on specific models: manufacturer datasheet — VERIFIED 2026-08-15: Neutrik TRUE1 documentation (IP65 when mated)',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'dc_barrel',
    displayName: 'DC barrel connector',
    aliases: ['coaxial power connector', 'DC plug', '“wall-wart” plug (informal)'],
    category: 'power_dc',
    tier: 'core',
    carried: ['dc_power'],
    typicalSources: [
      'External power adapters (wall-mount and inline bricks)',
      'Pedalboard power supplies',
      'Bench supplies with barrel-terminated leads',
    ],
    typicalDestinations: [
      'Effects pedals',
      'Small mixers, interfaces and preamps',
      'Routers, small synths and LED devices',
    ],
    constructionNote:
      'Typically a light two-conductor cord — center conductor and surrounding return, often coaxial in construction. Nothing in the cord or the plug indicates voltage, polarity or current. Only the printed labels do — on the supply and beside the device jack.',
    pinouts: [
      {
        id: 'dc_barrel_generic',
        application: 'Low-voltage DC power — polarity is a per-device fact, never assumed',
        carried: ['dc_power'],
        contacts: [
          {
            label: 'Center pin',
            role: 'One DC pole — commonly positive, but never assumed; the device label governs',
            ink: 'dcPos',
            note: 'Diagram shows the common center-positive arrangement only. Center-negative devices are widespread — notably 9 V guitar pedals.',
          },
          {
            label: 'Sleeve (barrel)',
            role: 'The other DC pole / return',
            ink: 'dcNeg',
          },
        ],
        confidence: 'equipment-dependent',
        verifyAgainst:
          'The polarity symbol and voltage/current marking printed beside the device jack, and the supply’s output label — every item must match.',
      },
    ],
    balanced: 'n/a',
    channels: 'n/a',
    locking: {
      method: 'friction',
      howToConfirm:
        'Seated to full depth. Friction only on the common form; threaded-collar locking variants exist on some equipment (equipment-dependent).',
    },
    directionality:
      'The supply provides the plug; the device carries the jack. Polarity is marked with the center-dot symbol: a dot (the center pin) joined by a line to + or −, with a C-shaped arc (the sleeve) joined to the opposite sign. Center-positive and center-negative both exist; the device symbol and the supply symbol must match exactly.',
    hotPlug: {
      policy: 'de_energize_first',
      rationale:
        'A barrel connector has no negotiation and no breaking design — whatever the supply delivers hits the device the instant the tip touches. Verify voltage, DC type, polarity and current against the device label first, and prefer connecting the barrel before energizing the supply.',
    },
    advantages: [
      'Simple, compact and inexpensive',
      'Ubiquitous on small equipment',
      'Locking (threaded-collar) variants exist where retention matters',
    ],
    limitations: [
      'Physical fit proves nothing — voltage, AC-vs-DC output, polarity, current capacity and BOTH barrel dimensions (outer and inner diameter, plus depth) must all match',
      'Many near-identical sizes exist that partially or fully mate',
      'Friction fit dislodges easily; a browning-out device may just have a half-seated barrel',
    ],
    commonMistakes: [
      'Assuming center-positive — common but never guaranteed; 9 V guitar-pedal supplies are commonly center-NEGATIVE, the reverse of much other equipment',
      'Powering a device with “a barrel that fits” — matching plug size proves nothing about what the supply delivers',
      'Ignoring the polarity symbol printed beside the jack',
      'Missing that some adapters output AC, not DC, from the same barrel — the label states which',
      'Using a supply with a lower current rating than the device requires — brownouts, resets and unreliable behavior',
    ],
    notInterchangeableWith: [
      {
        otherName: 'Another barrel of nearly the same size',
        why: 'Barrel plugs vary in outer diameter, inner (pin) diameter and depth; several near-sizes partially mate.',
        consequence:
          'A near-fit makes intermittent contact — the device browns out or resets. A full fit with the wrong electrical spec is worse: wrong voltage, AC on a DC input, or reversed polarity can damage the device immediately.',
      },
      {
        otherName: 'A same-size barrel from a different adapter',
        why: 'The plug carries no electrical information; the label does. Identical plugs ship on 5 V, 9 V, 12 V, 19 V and higher supplies, in both polarities, and in AC-output versions.',
        consequence:
          'Overvoltage or reversed polarity can permanently damage equipment; undervoltage or insufficient current makes it unreliable. Match every label item, every time.',
      },
    ],
    inspectionPoints: [
      'Bent or wobbling center pin in the device jack; spread or cracked sleeve on the plug',
      'Frayed cord at the plug boot — the most common failure point',
      'A jack that has gone loose on the device (connection cuts in and out when the plug moves)',
      'Both labels legible: device requirement and supply output — voltage, DC (or AC), polarity symbol, current rating',
    ],
    basicTest:
      'With the supply unplugged and disconnected: a continuity tester identifies which lead reaches the tip and which the sleeve on a bare-ended barrel cable. Voltage and polarity of a supply are label facts at this level — no live measurement in beginner work.',
    safety: {
      level: 'low_voltage_power',
      cautions: [
        'Low voltage does not mean no consequence — the wrong supply destroys equipment even where it cannot shock anyone.',
        'Never open a power adapter: the mains side inside is qualified-person territory, and internal capacitors can hold charge after unplugging.',
        'Check both labels every time: device requirement and supply output — voltage, DC (or AC) type, polarity symbol, and a supply current rating at or above the device’s requirement.',
      ],
    },
    glossary: [],
    relatedLessons: ['l01_what_travels', 'l04_same_plug', 'l07_power', 'l08_selection'],
    sourceNotes: [
      'Barrel connectors vary by outer diameter, inner pin diameter and depth with no universal electrical standard behind any size; some voltage-classed sizes exist under EIAJ definitions — VERIFIED 2026-08-15: EIAJ RC-5320A voltage-classed plug sizes',
      'Center-negative is the common convention on 9 V guitar-pedal supplies; center-positive is common elsewhere — convention, never assumed — VERIFIED 2026-08-15: Boss PSA convention (industry documentation)',
      'Center-polarity marking symbol (center dot joined to + or −, C-arc as sleeve): standardized device-labeling symbol — VERIFIED 2026-08-15: IEC 60417-5926',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'usb_c_power',
    displayName: 'USB-C as a power connector (USB PD)',
    aliases: ['USB Type-C (power role)', 'USB Power Delivery (USB PD)', 'USB-C charging'],
    category: 'power_dc',
    tier: 'core',
    carried: ['dc_power', 'hybrid_power_data'],
    typicalSources: [
      'USB PD chargers and power banks',
      'Laptop and phone chargers with USB-C output',
      'Powered docks and hubs',
    ],
    typicalDestinations: [
      'Laptops, tablets and phones',
      'Portable recorders and wireless units that charge over USB-C',
      'Small interfaces and mixers that accept USB-C power',
    ],
    constructionNote:
      'One identical plug covers wildly different cables: 3 A vs 5 A power capability, USB 2.0-only vs full-featured data, and different supported wattage tiers — with capability declared by an electronic marker chip inside capable cables. The shape guarantees none of it; capability lives in the cable’s electronics and its verified rating.',
    pinouts: [
      {
        id: 'usb_pd_power_path',
        application: 'USB Power Delivery — simplified power-path view (full contact map lives in the USB-C data record)',
        carried: ['dc_power'],
        contacts: [
          {
            label: 'VBUS',
            role: 'Power bus — 5 V default; higher voltages only after PD negotiation',
            ink: 'dcPos',
          },
          {
            label: 'GND',
            role: 'Power and signal return',
            ink: 'dcNeg',
          },
          {
            label: 'CC1 / CC2',
            role: 'Configuration channel — orientation, source/sink roles, current advertisement and PD voltage negotiation',
            ink: 'dataA',
            note: 'The negotiation happens here before any elevated voltage is applied.',
          },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'n/a',
    channels: 'n/a',
    locking: {
      method: 'friction',
      howToConfirm: 'Fully seated; the plug should sit without wobble. Friction retention only.',
    },
    directionality:
      'Reversible plug, and power direction is not fixed by the connector: source and sink roles are negotiated over the CC line, and capable devices can swap roles. Which end charges which is a negotiation outcome, not a connector property.',
    hotPlug: {
      policy: 'normally_fine',
      rationale:
        'Designed for hot connection: VBUS sits at the 5 V default (or off) until the configuration channel negotiates roles and any higher power level. No de-energizing ritual is required for normal connect/disconnect.',
    },
    advantages: [
      'One small reversible connector for power and data',
      'Negotiated power — voltage rises only after both ends agree',
      'High wattage possible when source, cable and device are all rated for it',
    ],
    limitations: [
      'Cable capability is invisible from the outside — power rating, e-marker and data class all vary behind one identical plug',
      'Charge-only and USB 2.0-only cables exist and look identical to full-featured ones',
      'The advertised wattage requires all three parties to support it: source, cable and device',
    ],
    commonMistakes: [
      'Assuming any USB-C cable delivers a charger’s full wattage — the cable is often the limiting component',
      'Assuming a cable that charges also carries data — charge-only cables exist',
      'Blaming the device or charger when a substituted, known-rated cable would have fixed it',
      'Buying by plug shape instead of certified rating',
    ],
    notInterchangeableWith: [
      {
        otherId: 'usb_c',
        otherName: 'USB-C as a data connector',
        why: 'Identical connector, different job — this record covers the power role; the data record covers data classes and alternate modes.',
        consequence:
          'A cable chosen for charging may not do a data job, and vice versa. Select cables by rated capability, never by shape.',
      },
      {
        otherName: 'Legacy USB-A chargers behind an A-to-C cable',
        why: 'USB-A sources cannot perform USB PD voltage negotiation.',
        consequence: 'The device charges slowly or not at all — a capability limit, not a fault.',
      },
    ],
    inspectionPoints: [
      'Bent or spread plug shell; the plug should seat without force or wobble',
      'Lint or debris packed into the receptacle — a common cause of “broken” ports',
      'Scorched or discolored contacts; melted strain relief on high-wattage cables',
      'Kinks at the plug boot',
    ],
    basicTest:
      'No live measurement at this level. The practical check is substitution and labeling: certified cables carry verifiable ratings, and swapping in a known-rated cable isolates cable faults before equipment gets blamed.',
    safety: {
      level: 'low_voltage_power',
      cautions: [
        'USB PD can negotiate tens of volts and substantial current — enough that a damaged cable or connector can heat up. Discard cables with bent shells, scorched contacts or melted strain relief.',
        'Use certified cables for high-wattage charging; miscapable cables misreport what they can carry.',
        'Never open a charger — the mains side inside is qualified-person territory.',
      ],
    },
    glossary: [],
    relatedLessons: ['l04_same_plug', 'l06_digital', 'l07_power', 'l08_selection'],
    sourceNotes: [
      'USB-C default current up to 3 A; 5 A operation requires an electronically marked (e-marked) cable: USB Type-C Cable and Connector Specification (USB-IF) — VERIFIED 2026-08-15: USB-IF Type-C specification',
      'USB PD Standard Power Range up to 100 W (20 V / 5 A); PD 3.1 Extended Power Range up to 240 W (48 V / 5 A) with EPR-rated cables: USB Power Delivery Specification (USB-IF) — VERIFIED 2026-08-15: USB-IF USB PD specification',
      'VBUS at 5 V default (or unpowered) until PD negotiation over CC completes: USB PD Specification — VERIFIED 2026-08-15: USB-IF USB PD specification',
      'Charge-only cables (missing data wiring) exist in the market; the Type-C specification expects at least USB 2.0 data wiring in compliant cables: USB-IF — VERIFIED 2026-08-15: USB-IF Type-C specification',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'poe',
    displayName: 'Power over Ethernet (PoE)',
    aliases: ['PoE / PoE+ / PoE++', 'IEEE 802.3af / 802.3at / 802.3bt (standards family)'],
    category: 'power_dc',
    tier: 'core',
    carried: ['hybrid_power_data'],
    typicalSources: [
      'PoE network switches (PSE — power sourcing equipment)',
      'PoE injectors (midspans)',
    ],
    typicalDestinations: [
      'Networked audio endpoints and stageboxes',
      'Wireless access points',
      'IP intercom panels and cameras',
      'Network-powered DSP endpoints',
    ],
    construction: 'ethernet_4pair',
    constructionNote:
      'The same 8P8C plug and four-pair cable may carry data only, or data plus DC power — nothing visible on the connector or cable shows which. Port labeling and equipment documentation govern.',
    pinouts: [
      {
        id: 'poe_pairs',
        application: 'DC power carried on the data pairs (recognition view)',
        carried: ['hybrid_power_data'],
        contacts: [
          {
            label: 'Pair 1-2',
            role: 'Data pair; carries one side of the PoE supply in Mode A and in four-pair (802.3bt) operation',
            ink: 'dataA',
            note: 'Power rides the pairs common-mode through the magnetics — data and power coexist on the same conductors.',
          },
          {
            label: 'Pair 3-6',
            role: 'Data pair; the other side of the Mode A supply',
            ink: 'dataB',
          },
          {
            label: 'Pair 4-5',
            role: 'Data pair (gigabit); carries one side of the supply in Mode B and four-pair operation',
            ink: 'dcPos',
          },
          {
            label: 'Pair 7-8',
            role: 'Data pair (gigabit); the other side of the Mode B supply',
            ink: 'dcNeg',
            note: 'The PSE chooses Mode A or Mode B; compliant powered devices accept either mode and either polarity.',
          },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'n/a',
    channels: 'n/a',
    locking: {
      method: 'latch',
      howToConfirm: 'The tab clicks home; a gentle pull without pressing the tab should not release the plug.',
    },
    directionality:
      'Power flows from the PSE (switch or injector) to the PD (powered device) — and only after detection: a compliant PSE probes for a valid PD signature before applying operating voltage. An unpowered data device on a compliant PoE port is left unpowered.',
    hotPlug: {
      policy: 'normally_fine',
      rationale:
        'PoE is designed for hot connection — compliant equipment detects and negotiates before applying power. One refinement at the high end: unplugging under a heavy 802.3bt-class load draws a small arc at the contacts that wears them over time — where practical, power down the powered device or disable the port before disconnecting high-power runs. The rule that stands regardless: never handle exposed conductors of an energized run; unplug the source end before any work on the cable itself.',
    },
    advantages: [
      'One cable delivers both network data and DC power',
      'Detection and classification — a compliant source powers only devices that ask for it',
      'Standardized classes span from a few watts to roughly 90 W at the source',
    ],
    limitations: [
      'Delivered wattage depends on the class of both ends, and cable quality/length erodes headroom at the high end',
      'Passive (non-negotiating) injectors exist outside the standards and bypass the protection that detection provides',
      'High-class PoE in large cable bundles accumulates heat — installation guidance applies',
    ],
    commonMistakes: [
      'Assuming every Ethernet port supplies power — most do not, and nothing about the connector shows it',
      'Using a passive injector on equipment that never asked for power — compliant PSEs protect via detection; passive injectors apply voltage blindly and can damage non-PoE devices',
      'Counting the source’s wattage as the wattage available at the device — cable losses reduce it',
      'Splicing, terminating or probing the conductors of a run that may be energized',
    ],
    notInterchangeableWith: [
      {
        otherId: 'ethernet_8p8c',
        otherName: 'Ordinary (data-only) Ethernet',
        why: 'Identical connector and cable; nothing visible marks a powered port.',
        consequence:
          'Data-only gear on a compliant PoE port is safe — detection withholds power without a valid signature. The real risk concentrates in non-compliant passive injectors, which skip detection entirely.',
      },
      {
        otherId: 'ethercon_style',
        otherName: 'Ruggedized (etherCON-style) shells',
        why: 'The same 8P8C connection inside a locking stage shell.',
        consequence:
          'Electrically the same connection — the shell changes durability and retention, not whether power is present on the pairs.',
      },
    ],
    inspectionPoints: [
      'Latch tab intact — a broken tab means intermittent connection, which matters more when power rides the pairs',
      'Bent or corroded contacts in jacks and plugs',
      'Jacket damage anywhere along a powered run — a compromised conductor carrying PoE current can heat at the fault',
      'Boot and strain relief condition at both ends',
    ],
    basicTest:
      'De-energized only: a standard network cable tester verifies pin-to-pin continuity and pairing on an unpowered run. Never open, splice or probe conductors of a run that may be powered — unplug the source end first.',
    safety: {
      level: 'low_voltage_power',
      cautions: [
        'PoE operates at roughly 44–57 V DC. Shock risk in dry conditions is low, but the working rule stands: never handle exposed conductors of an energized run — unplug the source end first.',
        'Bundles carrying many high-class PoE runs accumulate heat; follow installation guidance on bundle sizes.',
        'A damaged jacket on a powered run concentrates heating at the fault — repair means replacing the cable, done unpowered.',
      ],
    },
    glossary: [],
    relatedLessons: ['l01_what_travels', 'l04_same_plug', 'l06_digital', 'l07_power'],
    sourceNotes: [
      'IEEE 802.3af (Type 1): 15.4 W at the PSE, about 12.95 W available at the PD: IEEE 802.3 — VERIFIED 2026-08-15: Eaton/Tripp Lite PoE overview',
      'IEEE 802.3at (Type 2): 30 W PSE / 25.5 W PD; 802.3bt Type 3: 60 W PSE / 51 W PD; Type 4: 90 W PSE / 71.3 W PD: IEEE 802.3 — VERIFIED 2026-08-15: Eaton/Tripp Lite PoE overview',
      'PSE detection probes for the ~25 kΩ PD signature before applying operating voltage: IEEE 802.3 — VERIFIED 2026-08-15: Eaton/Tripp Lite PoE overview',
      'Operating voltage range approximately 44–57 V DC (nominal 48 V): IEEE 802.3 — VERIFIED 2026-08-15: Eaton/Tripp Lite PoE overview',
      'Two-pair delivery Mode A (pairs 1-2 / 3-6) and Mode B (pairs 4-5 / 7-8); 802.3bt uses all four pairs; compliant PDs accept either mode and polarity: IEEE 802.3 — VERIFIED 2026-08-15: Eaton/Tripp Lite PoE overview',
      'Unmating under heavy 802.3bt-class load arcs at the contacts and wears them over time; IEC 60512-99-001/-002 define separation-under-PoE-load connector tests: UL insights on IEC 60512-99-001/-002 — VERIFIED 2026-08-15',
    ],
  },
];
