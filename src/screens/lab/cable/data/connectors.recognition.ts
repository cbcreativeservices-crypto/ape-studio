/**
 * connectors.recognition — recognition-tier and qualified-person-tier connector
 * records for the Cable & Connector Fundamentals Lab (owner spec 2026-08-15 §6).
 *
 * SAFETY-CRITICAL CONTENT (owner mandate 2026-08-15): every claim in this file
 * is subject to the B2 fact-verification protocol
 * (docs/APE_CABLE_LAB_PLAN_2026_08_15.md §9). sourceNotes carry the governing
 * standard per claim group; claims that vary by equipment are marked
 * `equipment-dependent` and taught as "verify from the documentation."
 * Consequences are technically proportionate — never dramatized (§5.4).
 *
 * RECOGNITION DEPTH: these records teach identify + purpose + where seen +
 * locking + inspection. Detailed pin mastery is NOT taught or assessed —
 * `pinouts` is empty or carries at most one coarse variant. The final
 * assessment never tests these connectors' pins.
 *
 * QUALIFIED-PERSON TIER (last four records): recognition ONLY, with an explicit
 * boundary — beginners never connect, disconnect, or handle these energized;
 * they belong to qualified/authorized personnel under site procedures.
 *
 * VOICE: concise, professional, misconception-correcting. No real brands or
 * model likenesses; standard connector names used nominatively. The central
 * lab principle informs every record: a connector's shape does not define the
 * cable, signal, or power behind it — fitting is not proof of correctness or
 * safety.
 */
import type { ConnectorRecord } from '../cableTypes';

export const CONNECTORS_RECOGNITION: ConnectorRecord[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // Recognition tier
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'tt_bantam',
    displayName: 'TT / bantam patch plug',
    aliases: ['TT', 'Bantam', 'Tiny Telephone (historical name)', '4.4 mm patch plug'],
    category: 'patch_multipin',
    tier: 'recognition',
    carried: ['line_level'],
    typicalSources: ['Patchbay output rows in studios and broadcast facilities'],
    typicalDestinations: ['Patchbay input rows; the bay routes to the equipment behind it'],
    construction: 'balanced_shielded',
    constructionNote:
      'Patch cables for TT bays are short shielded twisted-pair cables. The plug looks like a shrunken 1/4-inch TRS but is a different, smaller size — the two are not interchangeable.',
    pinouts: [
      {
        id: 'balanced_patch',
        application: 'Balanced patch point (typical)',
        carried: ['line_level'],
        contacts: [
          { label: 'Tip', role: 'Signal + (non-inverting)', ink: 'signalPos' },
          { label: 'Ring', role: 'Signal − (inverting)', ink: 'signalNeg' },
          { label: 'Sleeve', role: 'Shield / reference', ink: 'shield' },
        ],
        confidence: 'convention',
        verifyAgainst:
          'The patchbay wiring chart — bays can be wired unbalanced, normalled differently, or to older facility conventions.',
      },
    ],
    balanced: 'either',
    channels: 'mono',
    locking: {
      method: 'friction',
      howToConfirm: 'Push fully home; retention is friction only. A half-seated plug causes intermittent contact.',
    },
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'Patching a live line-level point can pop or thump through the monitoring. Bring monitor level down or mute the destination before repatching. If the bay carries microphone lines, also turn phantom power (+48 V) off and let it drain before repatching mic-level points — the plug momentarily shorts its contacts during insertion, and patching with phantom engaged can damage preamp inputs and phantom-sensitive microphones.',
    },
    advantages: [
      'Very high patch-point density — many more points per rack space than 1/4-inch bays',
      'Purpose-built for frequent plugging and unplugging',
    ],
    limitations: [
      'Smaller contacts than 1/4-inch; worn or dirty jacks cause intermittents',
      'A patch point tells you nothing about what is wired behind it — the bay label and wiring chart do',
      'Normalled bays pass signal with no cable inserted; patching changes routing, it does not simply "add" a connection',
    ],
    commonMistakes: [
      'Assuming a TT plug and a 1/4-inch plug are the same connector at different ages — they are different sizes',
      'Repatching at full monitor level',
      'Ignoring the bay\'s normalling: pulling or inserting a patch cable can silently break an existing signal path',
    ],
    notInterchangeableWith: [
      {
        otherId: 'trs_quarter',
        otherName: '1/4-inch TRS',
        why: 'Same tip-ring-sleeve idea, but the TT/bantam plug is smaller in diameter than a 1/4-inch plug.',
        consequence:
          'They do not mate: a 1/4-inch plug does not enter a TT jack, and a TT plug in a 1/4-inch jack makes no reliable contact. Forcing the wrong plug can damage the jack.',
      },
      {
        otherId: 'trs_35',
        otherName: '3.5 mm TRS',
        why: 'Close in size at a glance, but 3.5 mm and TT/bantam are different diameters with different jack geometry.',
        consequence: 'No reliable connection — intermittent or no signal.',
      },
    ],
    inspectionPoints: [
      'Worn or scored plug plating (a source of crackle in heavily used bays)',
      'Loose or spinning barrel; strain relief pulled at the boot',
      'Bay jacks that no longer grip the plug firmly',
    ],
    basicTest:
      'On a patch cable, a continuity tester shows tip→tip, ring→ring, sleeve→sleeve straight through with no bridging between contacts.',
    safety: {
      level: 'signal',
      cautions: [
        'Signal-level only. The main risks are monitor pops and silently re-routing a live signal path — mute first and know the bay\'s normalling before pulling cables.',
        'If the bay carries microphone lines, phantom power (+48 V) may be present at patch points. A patch plug momentarily shorts its contacts together during insertion, and patching with phantom engaged can damage preamp inputs and phantom-sensitive microphones (vintage ribbons especially). Turn phantom off and let it drain (roughly half a minute) before repatching any mic-level point — or confirm the bay is line-level only.',
      ],
    },
    glossary: ['Patchbay', 'TRS Connector (Tip-Ring-Sleeve)', 'Balanced signaling'],
    relatedLessons: ['l03_analog', 'l04_same_plug', 'l08_selection'],
    sourceNotes: [
      'TT/bantam plug nominal diameter 0.173 in (4.40 mm), smaller than the 6.35 mm 1/4-inch plug; the two do not intermate: connector manufacturer datasheets — VERIFIED 2026-08-15: Neutrik 0.173" bantam plug product page',
      'Balanced patch wiring tip = +, ring = −, sleeve = shield is common pro-audio TRS convention, but bay wiring is facility-specific — VERIFIED 2026-08-15: Neutrik 0.173" bantam plug product page',
      'Patch plugs momentarily short their contacts together during insertion; patching with +48 V phantom engaged can damage preamp inputs and phantom-sensitive microphones — phantom off and drained before repatching mic-level points: Sound On Sound patchbay guidance + Focusrite phantom-power support documentation — VERIFIED 2026-08-15',
    ],
  },

  {
    id: 'quarter_patch',
    displayName: '1/4-inch patch plug',
    aliases: ['1/4-inch patch cable', 'TRS patch plug', 'Patch cord (informal)'],
    category: 'patch_multipin',
    tier: 'recognition',
    carried: ['line_level'],
    typicalSources: ['Patchbay output rows in project studios and live racks'],
    typicalDestinations: ['Patchbay input rows; the bay routes to the equipment behind it'],
    construction: 'balanced_shielded',
    constructionNote:
      'Typically a short shielded twisted-pair cable with TRS plugs. The same 1/4-inch shell also serves instrument, headphone, and insert jobs elsewhere — the patchbay context, not the plug, defines the job here.',
    pinouts: [
      {
        id: 'balanced_patch',
        application: 'Balanced patch point (typical)',
        carried: ['line_level'],
        contacts: [
          { label: 'Tip', role: 'Signal + (non-inverting)', ink: 'signalPos' },
          { label: 'Ring', role: 'Signal − (inverting)', ink: 'signalNeg' },
          { label: 'Sleeve', role: 'Shield / reference', ink: 'shield' },
        ],
        confidence: 'convention',
        verifyAgainst:
          'The patchbay wiring chart — bays can be wired unbalanced, half-normalled, full-normalled, or open, and insert points may use TRS differently.',
      },
    ],
    balanced: 'either',
    channels: 'mono',
    locking: {
      method: 'friction',
      howToConfirm: 'Push fully home; retention is friction only.',
    },
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'Patching a live point can pop through the system. Bring monitor level down or mute the destination before repatching. Muting protects your ears and the monitors, but not the patched circuit itself: if the bay carries microphone lines, phantom power (+48 V) may be present — turn it off and let it drain before repatching mic-level points, or confirm the bay is line-level only.',
    },
    advantages: [
      'Rugged, familiar 1/4-inch format; easy to inspect and re-terminate',
      'Normalled bays put the most-used signal path in place with no cable at all',
    ],
    limitations: [
      'Lower patch density than TT/bantam bays',
      'Older "long-frame" bays use a 1/4-inch-diameter plug with a different tip profile — same apparent size, not reliably interchangeable with standard TRS',
      'The plug fitting proves nothing about what the point carries — read the bay label',
    ],
    commonMistakes: [
      'Treating every 1/4-inch jack as the same job — a patch point, an instrument input, and an insert jack all use the same shell',
      'Using a standard TRS plug in an older long-frame bay because it "sort of fits"',
      'Forgetting that inserting a cable into a normalled point interrupts the built-in signal path',
    ],
    notInterchangeableWith: [
      {
        otherName: 'Long-frame / B-gauge patch plug (older bays)',
        why: 'Same 1/4-inch diameter, different tip and contact profile from standard TRS.',
        consequence: 'Unreliable contact — intermittent signal — and repeated forcing can wear or damage the bay\'s jacks.',
      },
      {
        otherId: 'tt_bantam',
        otherName: 'TT / bantam patch plug',
        why: 'Same patchbay role, physically smaller connector.',
        consequence: 'They do not mate; no connection.',
      },
    ],
    inspectionPoints: [
      'Worn plating or a bent tip',
      'Loose barrel or failed strain relief',
      'Crackle when the cable is flexed at the plug',
    ],
    basicTest:
      'On a patch cable, a continuity tester shows tip→tip, ring→ring, sleeve→sleeve straight through with no bridging between contacts.',
    safety: {
      level: 'signal',
      cautions: [
        'Signal-level only. Mute before repatching, and know the bay\'s normalling so pulling a cable does not silently break a live path.',
        'If the bay carries microphone lines, phantom power (+48 V) may be present at patch points. A patch plug momentarily shorts its contacts together during insertion, and patching with phantom engaged can damage preamp inputs and phantom-sensitive microphones (vintage ribbons especially). Muting protects ears and monitors but not the phantom-carrying circuit itself — turn phantom off and let it drain (roughly half a minute) before repatching any mic-level point, or confirm the bay is line-level only.',
      ],
    },
    glossary: ['Patchbay', 'TRS Connector (Tip-Ring-Sleeve)', 'Insert Cable', 'Balanced signaling'],
    relatedLessons: ['l03_analog', 'l04_same_plug', 'l08_selection'],
    sourceNotes: [
      'Long-frame/B-gauge 1/4-inch patch plugs have a different tip profile from standard A-gauge TRS and are not reliably interchangeable: connector manufacturer documentation — VERIFIED 2026-08-15: Neutrik Plugs & Jacks FAQ',
      'Normalling behavior (full/half/open) is a property of the bay, not the plug: patchbay manufacturer documentation — VERIFIED 2026-08-15: Neutrik Plugs & Jacks FAQ',
      'Patch plugs momentarily short their contacts together during insertion; patching with +48 V phantom engaged can damage preamp inputs and phantom-sensitive microphones — phantom off and drained before repatching mic-level points: Sound On Sound patchbay guidance + Focusrite phantom-power support documentation — VERIFIED 2026-08-15',
    ],
  },

  {
    id: 'db25',
    displayName: 'DB25 (D-sub)',
    aliases: ['DB-25', 'D-sub 25', '25-pin D-sub'],
    category: 'patch_multipin',
    tier: 'recognition',
    carried: ['line_level', 'digital_audio'],
    typicalSources: [
      'Multichannel interface and converter breakout ports',
      'Console and recorder multichannel I/O',
    ],
    typicalDestinations: [
      'Breakout looms fanning out to XLR or TRS',
      'Other DB25-equipped multichannel gear',
    ],
    constructionNote:
      'Behind a DB25 audio port is multipair cable — several individually shielded twisted pairs in one jacket. The same 25-pin shell was also used for decades on computer printer and serial ports; the shell alone identifies nothing.',
    pinouts: [],
    balanced: 'balanced',
    channels: 'multi',
    locking: {
      method: 'screw',
      howToConfirm: 'Finger-tighten both jackscrews/thumbscrews. An unscrewed D-sub works loose and drops channels.',
    },
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'Connecting or breaking eight live channels at once can pop loudly through the system. Mute or bring down the affected channels first.',
    },
    advantages: [
      'Eight balanced channels through one compact, screw-retained connector',
      'Dense multichannel wiring between racks without eight separate cables',
    ],
    limitations: [
      'The pin assignment is NOT universal: a common 8-channel analog convention exists, but equipment from different heritages wires DB25 differently — the documentation governs',
      'Analog and digital (AES3) DB25 ports use different wiring — same shell, different job',
      'Fine pins bend easily; a bent pin takes out one or more channels',
    ],
    commonMistakes: [
      'Assuming any DB25 loom fits any DB25 port because it mates — channel order and analog-vs-digital wiring must match the equipment',
      'Leaving the jackscrews loose',
      'Using a computer-heritage DB25 data cable for audio — the internal construction and wiring are wrong for the job',
    ],
    notInterchangeableWith: [
      {
        otherName: 'DB25 wired to a different audio convention (or the AES3 digital variant)',
        why: 'The identical shell carries at least two distinct professional audio pinout families plus legacy variations; the connector mates regardless.',
        consequence: 'Channels land on the wrong pins: no signal, or the wrong channels appear — a routing failure, not equipment damage.',
      },
      {
        otherName: 'Computer-heritage DB25 data cable (printer/serial)',
        why: 'Same shell, built for data — usually unpaired, differently shielded, and wired for a different purpose entirely.',
        consequence: 'No usable audio, or noisy and unreliable audio.',
      },
    ],
    inspectionPoints: [
      'Bent, pushed-in, or corroded pins (sight down the connector face)',
      'Missing or stripped jackscrews',
      'Jacket strain where the multipair cable enters the hood',
    ],
    basicTest:
      'A continuity check against the documented pinout for that specific piece of equipment — never against an assumed "standard" — confirms each pair and shield lands where the documentation says.',
    safety: {
      level: 'signal',
      cautions: [
        'Signal-level only. The practical risk is mis-wiring, not electricity: verify the pinout convention from the documentation before trusting any DB25 loom.',
      ],
    },
    glossary: ['DB25 (D-sub)', 'Snake', 'Balanced signaling'],
    relatedLessons: ['l04_same_plug', 'l06_digital', 'l08_selection'],
    sourceNotes: [
      'A widely used 8-channel balanced analog DB25 pinout is documented in AES59, but it is a convention adopted unevenly — legacy equipment heritages wire DB25 differently, so the equipment documentation governs: AES59 — VERIFIED 2026-08-15: AES59-2012 (r2023)',
      'AES59 also documents a DB25 arrangement for multichannel AES3 digital audio distinct from the analog arrangement — VERIFIED 2026-08-15: AES59-2012 (r2023)',
      'DB25 shells were historically standard on computer parallel/serial interfaces — general connector history — VERIFIED 2026-08-15: AES59-2012 (r2023)',
    ],
  },

  {
    id: 'edac',
    displayName: 'EDAC / Elco multipin',
    aliases: ['EDAC', 'Elco (historical name)', 'Rack multipin'],
    category: 'patch_multipin',
    tier: 'recognition',
    carried: ['mic_level', 'line_level'],
    typicalSources: [
      'Console and recorder multichannel I/O panels',
      'Studio wall boxes and machine-room tie lines',
    ],
    typicalDestinations: ['Multipair looms to patchbays, stage boxes, and racks'],
    constructionNote:
      'Behind an EDAC shell is multipair audio cable — many shielded twisted pairs. The connector is available in several contact counts, and every contact assignment is whatever the facility wired it to be.',
    pinouts: [],
    balanced: 'either',
    channels: 'multi',
    locking: {
      method: 'screw',
      howToConfirm: 'Tighten the central jackscrew until the shells are fully drawn together; the screw also does the work of seating the many contacts.',
    },
    hotPlug: {
      policy: 'mute_first',
      rationale: 'Making or breaking dozens of live audio channels at once can pop through the system. Mute the affected channels first.',
    },
    advantages: [
      'Dozens of audio channels through one screw-retained connector',
      'Long-established in studio installs — decades of facilities are wired with it',
    ],
    limitations: [
      'Contact assignments are entirely facility- and equipment-specific — there is no universal EDAC audio pinout',
      'The jackscrew must be used: partially mated shells misalign many fine contacts at once',
      'Re-terminating requires the correct insertion/extraction tooling and patience',
    ],
    commonMistakes: [
      'Plugging a loom from one facility or console into another and expecting the channels to line up',
      'Forcing the shells together without running the jackscrew in',
      'Assuming two identical-looking EDAC connectors are wired identically',
    ],
    notInterchangeableWith: [
      {
        otherName: 'An EDAC of a different contact count, or one wired to a different chart',
        why: 'Multiple shell sizes exist, and even matching shells carry facility-specific wiring.',
        consequence: 'Wrong-size shells do not mate; matching shells with different wiring put channels in the wrong places — no signal or wrong routing.',
      },
    ],
    inspectionPoints: [
      'Bent or backed-out contacts in the insert',
      'A stripped or missing jackscrew',
      'Crushed or kinked multipair cable at the hood',
    ],
    basicTest:
      'Continuity checked pair-by-pair against the facility\'s wiring chart — the chart, not an assumed standard, is the reference.',
    safety: {
      level: 'signal',
      cautions: [
        'Signal-level only. The risk is mis-routing many channels at once — always work from the wiring chart.',
      ],
    },
    glossary: ['EDAC / Elco Connector', 'Multipin Connector', 'Snake'],
    relatedLessons: ['l08_selection', 'l09_handling'],
    sourceNotes: [
      'EDAC (historically Elco) rack-and-panel connector series are made in multiple contact counts; audio contact assignments are facility/equipment-specific: manufacturer datasheets + facility wiring charts — VERIFIED 2026-08-15: EDAC 516 Series documentation',
    ],
  },

  {
    id: 'lk_veam',
    displayName: 'Circular multipin snake connector (LK / VEAM style)',
    aliases: ['LK-style multipin', 'VEAM-style multipin (historical name)', 'Mass connector (informal)'],
    category: 'patch_multipin',
    tier: 'recognition',
    carried: ['mic_level', 'line_level'],
    typicalSources: ['Stage box / snake head multipin ports', 'Touring rack and console dock panels'],
    typicalDestinations: ['Multipin trunk lines between stage, racks, and front-of-house'],
    constructionNote:
      'The trunk behind the shell is heavy multipair audio cable. The keyed circular shell exists so large channel counts connect in one motion — the wiring inside is whatever the shop built.',
    pinouts: [],
    balanced: 'either',
    channels: 'multi',
    locking: {
      method: 'twist_lock',
      howToConfirm:
        'Align the key, seat fully, and engage the coupling until it locks — the exact coupling (quarter-turn or threaded) varies by series. A misaligned key means it is the wrong connector or the wrong orientation: never force it.',
    },
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'One mate/de-mate action makes or breaks an entire show\'s worth of audio lines. Mute or bring down the system before connecting or splitting trunks.',
    },
    advantages: [
      'An entire snake\'s channel count connects in one keyed, locking action',
      'Rugged shells built for touring abuse',
      'Keying prevents wrong-orientation and wrong-family mating',
    ],
    limitations: [
      'Wiring is shop-specific — a trunk from one inventory does not automatically match another shop\'s boxes',
      'Bent contacts in a high-density insert are expensive, show-stopping repairs',
      'Heavy: trunk connections are typically rigged by experienced crew',
    ],
    commonMistakes: [
      'Forcing a coupling that is not key-aligned',
      'Letting the connector face hang in dirt or rain without its cap',
      'Assuming any circular multipin on a stage is audio — power multipin systems use visually similar circular shells',
    ],
    notInterchangeableWith: [
      {
        otherId: 'socapex_style',
        otherName: 'Multicircuit POWER multipin (Socapex-style)',
        why: 'Stages carry circular multipin connectors for both audio signals and mains power; at a glance the families resemble each other.',
        consequence:
          'Different connector families are keyed and will not couple — never force or defeat keying. But keying is not the safeguard: identical 19-pin multipin connectors are used in the field for both mains-power distribution and loudspeaker feeds, so a shell that mates proves nothing about what is behind it. Identify the system from labels and documentation before touching anything; putting mains power into signal wiring means equipment damage and electrical danger.',
      },
    ],
    inspectionPoints: [
      'Bent, recessed, or burned contacts in the insert',
      'Damaged key or coupling mechanism',
      'Trunk jacket damage at the backshell; missing protective caps',
    ],
    basicTest:
      'Continuity checked channel-by-channel against the shop\'s wiring chart, typically with a purpose-built snake tester — the chart is the reference.',
    safety: {
      level: 'signal',
      cautions: [
        'Signal-level only, but heavy: multipin trunks are rigged by experienced crew. Beginners identify them and stay clear of rigging paths.',
        'Confirm a circular multipin is the AUDIO system before touching it — power multipin shells look similar and are qualified-person territory.',
      ],
    },
    glossary: ['Multipin Connector', 'Snake'],
    relatedLessons: ['l08_selection', 'l09_handling'],
    sourceNotes: [
      'Circular multipin snake systems use keyed shells; coupling style (quarter-turn vs threaded) varies by connector series, and contact assignments are shop-specific: manufacturer documentation + shop wiring charts — VERIFIED 2026-08-15: ITT Cannon VEAM CIR documentation',
      'Visually similar circular multipin shells serve both mains power and signal; different series are keyed against each other, but identical 19-pin Socapex-type connectors are commercially used for both power and loudspeaker service — labeling and identification, not keying, is the safeguard: manufacturer catalogs and commercial breakout-product documentation — VERIFIED 2026-08-15',
    ],
  },

  {
    id: 'euroblock',
    displayName: 'Euroblock terminal connector',
    aliases: ['Euroblock', 'Pluggable terminal block', 'Phoenix-style block (informal)'],
    category: 'analog_audio',
    tier: 'recognition',
    carried: ['line_level', 'control_data'],
    typicalSources: ['Installed-sound processor and mixer outputs', 'Paging and control system terminals'],
    typicalDestinations: ['Amplifier and processor inputs in equipment racks', 'Wall-panel and ceiling-device terminations'],
    constructionNote:
      'There is no molded cable: install cable is stripped and terminated into the block by a technician, screw or spring clamp onto bare conductors. The block then plugs onto the device\'s header.',
    pinouts: [
      {
        id: 'balanced_terminals',
        application: 'Balanced analog terminals (typical labeling)',
        carried: ['line_level'],
        contacts: [
          { label: '+', role: 'Signal + (non-inverting)', ink: 'signalPos' },
          { label: '−', role: 'Signal − (inverting)', ink: 'signalNeg' },
          { label: 'S', role: 'Shield / screen', ink: 'shield', note: 'Marking varies: S, G, ⏚, or a shield symbol.' },
        ],
        confidence: 'equipment-dependent',
        verifyAgainst: 'The device\'s rear-panel legend and manual — terminal order and markings vary by device.',
      },
    ],
    balanced: 'either',
    channels: 'varies',
    locking: {
      method: 'friction',
      howToConfirm: 'The block seats fully onto its header; some variants add flange screws — use them where fitted.',
    },
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'Unplugging a block from a live system pops and drops every circuit on it. Termination work (stripping and clamping conductors) is done with the equipment powered down, by the installing technician.',
    },
    advantages: [
      'Terminates bare install cable without a soldered connector — standard in installed sound',
      'Blocks unplug from equipment for service without disturbing the terminations',
      'Compact: many channels of I/O fit on a shallow rack panel',
    ],
    limitations: [
      'Termination quality is up to the technician — a loose clamp or a stray shield strand is a fault waiting to happen',
      'Terminal order is device-specific; the printed legend governs',
      'Similar-looking blocks on the same rear panel can serve different jobs (audio, control, and on some compact amplifiers, loudspeaker outputs) — read the labeling',
    ],
    commonMistakes: [
      'Landing wires by matching block position between two different devices instead of reading each legend',
      'Leaving shield whiskers that short to the adjacent terminal',
      'Over-tightening or under-tightening screw clamps',
    ],
    notInterchangeableWith: [
      {
        otherName: 'A block on the same panel serving a different job (control, or loudspeaker output on compact amplifiers)',
        why: 'The identical block style is used for several jobs; position and labeling — not shape — define each one.',
        consequence: 'Mis-landed wiring: no signal at best; landing a loudspeaker-level output into a line input risks equipment damage.',
      },
    ],
    inspectionPoints: [
      'Loose conductors under clamps (gentle tug test only on wiring confirmed line-level/control and confirmed de-energized at the source)',
      'Stray strands bridging adjacent terminals',
      'Blocks not fully seated on their headers',
    ],
    basicTest:
      'Only on a block confirmed line-level/control and confirmed de-energized at the source: continuity from each terminal to the far end of its conductor confirms the run; the device legend confirms the landing order.',
    safety: {
      level: 'signal',
      cautions: [
        'Signal-level in this lab\'s scope. Termination is technician work with the equipment powered down; beginners identify blocks and read legends rather than re-landing wires on live systems.',
        'Installed systems also run 70 V / 100 V distributed loudspeaker lines that terminate on identical-looking terminal blocks — enough voltage to shock, and a paging amplifier elsewhere in the building can drive the line at any moment. Confirm from labeling, documentation, and the technician in charge that a block is line-level or control wiring AND that its source is powered down before any touch or continuity test; if a block might be a 70/100 V speaker line, treat it as qualified-person territory.',
      ],
    },
    glossary: ['Balanced signaling'],
    relatedLessons: ['l03_analog', 'l08_selection'],
    sourceNotes: [
      'Pluggable terminal blocks in common installed-audio pitches; screw and spring-clamp termination variants: manufacturer datasheets — VERIFIED 2026-08-15: QSC CX168 user manual',
      'Terminal order/marking is device-specific; some compact installation amplifiers also use terminal blocks for loudspeaker outputs: equipment documentation — VERIFIED 2026-08-15: QSC CX168 user manual',
      'Installed 70 V / 100 V distributed loudspeaker lines land on identical-looking terminal blocks and are a shock hazard (70.7 V rms derives from the UL 100 V-peak threshold; unloaded low-power transformer taps can float far higher): Rane Note 136 + Lowell constant-voltage speaker system note — VERIFIED 2026-08-15',
    ],
  },

  {
    id: 'mini_xlr',
    displayName: 'Mini XLR',
    aliases: ['Mini-XLR', 'TA3 / TA4 / TA5 (informal series names)', 'Bodypack connector (informal)'],
    category: 'analog_audio',
    tier: 'recognition',
    carried: ['mic_level', 'dc_power'],
    typicalSources: ['Lavalier and headset microphone cables', 'Instrument cables for wireless bodypacks'],
    typicalDestinations: ['Wireless bodypack transmitter inputs', 'Some compact headphones and gear I/O'],
    constructionNote:
      'Thin, flexible shielded cable built for body-worn use. The connector commonly carries the mic signal AND a small DC bias supply for the microphone element — which pin does what is set by the wireless system\'s maker.',
    pinouts: [],
    balanced: 'either',
    channels: 'varies',
    locking: {
      method: 'latch',
      howToConfirm: 'Push in until the latch clicks; it should not pull free without pressing the release.',
    },
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'Connecting or unplugging with the channel live pops through the system, and the bias supply is present at the contacts. Mute the channel (or power the pack down) first.',
    },
    advantages: [
      'Small and light enough for body-worn transmitters',
      'Latching — will not pull free during performance movement',
    ],
    limitations: [
      'Comes in 3-, 4-, and 5-pin variants that do not intermate',
      'Wiring is manufacturer-specific: a lavalier terminated for one wireless system usually does not work on another without rewiring or an adapter',
      'Fine contacts and thin cable are the most fragile part of a wireless rig',
    ],
    commonMistakes: [
      'Assuming any lavalier with the right-looking plug works on any bodypack — pin count AND wiring must match the system',
      'Yanking the cable instead of pressing the latch release',
      'Blaming the transmitter for faults that live in the crushed, body-worn cable',
    ],
    notInterchangeableWith: [
      {
        otherId: 'xlr3',
        otherName: 'Full-size 3-pin XLR',
        why: 'Same family idea, physically smaller connector.',
        consequence: 'They do not mate; no connection without an adapter built for the specific systems involved.',
      },
      {
        otherName: 'Mini XLR wired for a different wireless system',
        why: 'The identical shell and pin count can carry a different manufacturer\'s wiring and bias scheme.',
        consequence: 'No signal, or distorted/wrong-level audio — the shell fitting proves nothing about the wiring.',
      },
    ],
    inspectionPoints: [
      'Intermittent audio when the cable is flexed at the plug (the classic body-worn failure)',
      'Bent or recessed pins; a latch that no longer clicks',
      'Kinked or crushed cable from costume runs',
    ],
    basicTest:
      'Continuity checked against the manufacturer\'s published wiring for that system — there is no universal mini-XLR pinout to test against.',
    safety: {
      level: 'signal',
      cautions: [
        'Signal-level with a small DC bias supply present — not a shock hazard, but another reason wiring must match the system it was built for.',
      ],
    },
    glossary: [],
    relatedLessons: ['l03_analog', 'l04_same_plug', 'l08_selection'],
    sourceNotes: [
      'Mini-XLR (TA-series style) connectors exist in 3/4/5-pin variants; bodypack wiring and bias schemes vary by wireless system manufacturer and are not cross-compatible: manufacturer wiring charts — VERIFIED 2026-08-15: cross-brand adapter wiring documentation (YPA/Hixman)',
    ],
  },

  {
    id: 'xlr4',
    displayName: '4-pin XLR',
    aliases: ['XLR4', 'Intercom headset connector (informal)'],
    category: 'analog_audio',
    tier: 'recognition',
    carried: ['mic_level', 'headphone_level', 'dc_power'],
    typicalSources: ['Wired intercom beltpack headset ports', 'DC power supplies on some cameras and field equipment'],
    typicalDestinations: ['Single-ear intercom headsets', 'DC power inputs on equipment wired for it'],
    constructionNote:
      'For intercom use, the one connector carries both the headset microphone and the earphone. For DC power use, the same shell carries a supply instead — two very different jobs in one housing.',
    pinouts: [],
    balanced: 'either',
    channels: 'varies',
    locking: {
      method: 'latch',
      howToConfirm: 'Push in until the latch clicks; it should not pull free without pressing the release.',
    },
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'Headsets pop when connected live — mute or turn down first. Where the connector carries DC power, follow that equipment\'s procedure; many devices expect power connections made before switch-on.',
    },
    advantages: [
      'One latching connector for a complete headset (mic + earphone)',
      'Rugged, familiar XLR-family shell',
    ],
    limitations: [
      'The same shell serves intercom audio on some systems and DC power on others — the application varies and the shell does not announce it',
      'Headset wiring conventions are common but not universal — check the intercom system\'s documentation',
    ],
    commonMistakes: [
      'Assuming every 4-pin XLR port is a headset port — some are DC power',
      'Mixing headsets between intercom systems without confirming the wiring matches',
    ],
    notInterchangeableWith: [
      {
        otherId: 'xlr3',
        otherName: '3-pin XLR',
        why: 'Different pin counts in the XLR family do not intermate.',
        consequence: 'No connection.',
      },
      {
        otherName: '4-pin XLR DC power circuit',
        why: 'The identical shell is used for DC power on some equipment; a headset and a power port can physically match.',
        consequence: 'Connecting a headset to a DC power port (or a power lead to audio equipment) can damage the equipment — verify what the port carries before plugging.',
      },
    ],
    inspectionPoints: [
      'Bent or corroded pins; latch that no longer clicks',
      'Cable damage at the headset\'s boom and boot ends',
    ],
    basicTest:
      'Continuity checked against the specific system\'s documented wiring — not against an assumed universal 4-pin standard.',
    safety: {
      level: 'signal',
      cautions: [
        'Signal-level for headsets; some 4-pin XLR circuits carry DC power. Confirm the port\'s job from labeling or documentation before connecting anything.',
      ],
    },
    glossary: [],
    relatedLessons: ['l04_same_plug', 'l08_selection'],
    sourceNotes: [
      'Common wired-intercom headset wiring on 4-pin XLR (mic pair and earphone pair) is a convention that varies by system: intercom system documentation — VERIFIED 2026-08-15: Clear-Com Solution Finder pin-out pages',
      'A 4-pin XLR DC power convention (ground and +12 V on designated pins) exists in broadcast practice but is equipment-dependent, never universal: equipment documentation — VERIFIED 2026-08-15: Clear-Com Solution Finder pin-out pages',
    ],
  },

  {
    id: 'xlr5',
    displayName: '5-pin XLR',
    aliases: ['XLR5', 'DMX connector (informal — lighting control is one of its uses)'],
    category: 'analog_audio',
    tier: 'recognition',
    carried: ['mic_level', 'headphone_level', 'control_data'],
    typicalSources: [
      'Lighting console DMX512 outputs',
      'Dual-ear intercom beltpack headset ports',
      'Stereo microphones needing two channels through one connector',
    ],
    typicalDestinations: [
      'Dimmers, moving lights, and other DMX512 fixtures',
      'Dual-ear intercom headsets',
      'Stereo microphone power supplies / preamp pairs',
    ],
    constructionNote:
      'The cable behind a 5-pin XLR depends entirely on the job: 120-ohm data cable for DMX512 control, shielded audio pairs for headsets and stereo microphones. Same shell, different cables, different signals.',
    pinouts: [],
    balanced: 'either',
    channels: 'varies',
    locking: {
      method: 'latch',
      howToConfirm: 'Push in until the latch clicks; it should not pull free without pressing the release.',
    },
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'For audio uses, connect muted to avoid pops. The DMX512 data link itself is not damaged by re-plugging, but fixtures can respond physically — motorized fixtures may move or re-home without warning and outputs can jump on a data glitch — so never re-plug a control line while anyone is working at a fixture, and coordinate with the lighting operator first.',
    },
    advantages: [
      'The connector specified by the DMX512 lighting-control standard',
      'Two audio channels (or mic + both ears) through one latching connector',
    ],
    limitations: [
      'Application varies by system: lighting control, intercom, and stereo microphone uses share the shell and are mutually incompatible',
      'DMX512 wants 120-ohm data cable — an audio pair in a control line is a reliability problem',
    ],
    commonMistakes: [
      'Assuming a 5-pin XLR line is DMX (or audio) without tracing or reading labels',
      'Pressing microphone cable into DMX service on long or heavily loaded runs',
      'Adapting between 3-pin audio lines and lighting control without confirming what each line actually is',
    ],
    notInterchangeableWith: [
      {
        otherId: 'xlr3',
        otherName: '3-pin XLR',
        why: 'Different pin counts do not intermate directly, but adapters exist and make audio and lighting-control lines physically compatible.',
        consequence: 'A mismatched patch fails to work or gives erratic, flickering control — protocol and impedance incompatibility, not equipment damage.',
      },
      {
        otherName: '5-pin XLR wired for a different job (intercom vs DMX vs stereo mic)',
        why: 'The identical connector serves at least three unrelated jobs.',
        consequence: 'No signal or non-functioning control — the shell fitting proves nothing.',
      },
    ],
    inspectionPoints: [
      'Bent or pushed-in pins; latch that no longer clicks',
      'For control runs: flicker or dropouts pointing at a failing cable or connector',
    ],
    basicTest:
      'Pin-to-pin continuity straight through, checked against what that line is documented to carry; a data-line tester is the right tool for DMX runs.',
    safety: {
      level: 'signal',
      cautions: [
        'Signal-level only. The practical risk is cross-plugging unrelated systems that share the shell — identify the line before connecting.',
      ],
    },
    glossary: ['Balanced signaling'],
    relatedLessons: ['l04_same_plug', 'l06_digital', 'l08_selection'],
    sourceNotes: [
      'DMX512 (ANSI E1.11) specifies the 5-pin XLR as its standard connector and 120-ohm balanced data cable — VERIFIED 2026-08-15: ANSI E1.11-2008 (R2018), ESTA TSP',
      'Dual-ear intercom headset and stereo microphone wiring on 5-pin XLR varies by system; documentation governs — VERIFY',
      'Fixtures can respond physically to control-line re-plugs and data glitches (motorized fixtures may move or re-home; outputs can jump) — coordinate with the operator before re-plugging control lines: lighting-console manufacturer/community documentation on fixture re-homing — VERIFIED 2026-08-15',
    ],
  },

  {
    id: 'speakon_nl8',
    displayName: '8-pole speakON',
    aliases: ['NL8', 'speakON NL8', '8-pole loudspeaker multiway'],
    category: 'loudspeaker',
    tier: 'recognition',
    carried: ['speaker_level'],
    typicalSources: ['Multichannel amplifier rack panels', 'Loudspeaker processor/amp system outputs'],
    typicalDestinations: ['Multi-way loudspeaker cabinets (separate LF/MF/HF sections)', 'Loudspeaker breakout panels'],
    constructionNote:
      'Behind it is heavy multiconductor loudspeaker cable — up to four ± pairs, unshielded, sized for amplifier current. Which pair drives which driver section is a property of the system design, not the connector.',
    pinouts: [],
    balanced: 'n/a',
    channels: 'multi',
    locking: {
      method: 'twist_lock',
      howToConfirm:
        'Insert and twist until the lock engages, then confirm with a gentle pull — the 8-pole format locks with a twist (quick-lock) action.',
    },
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'Mute the amplifier channels (many crews power the amps down) before connecting or disconnecting. Making or breaking a full multiway feed under drive pops hard and stresses drivers; genuine speakON contacts are designed to make and break inside the housing, but working de-energized remains standard practice for high-power systems.',
    },
    advantages: [
      'Up to four amplifier channels to a multi-way cabinet through one locking connector',
      'Contacts are recessed — no exposed speaker-level terminals',
      'Locks positively; cannot be pulled out by cable tension',
    ],
    limitations: [
      'Not intermateable with 2- and 4-pole speakON sizes — the 8-pole is its own physical format',
      'Cables may be wired with fewer than all four pairs — a loom that mates can still leave driver sections silent',
      'Which pair feeds which driver band is system-specific; a wrong assumption sends the wrong amplifier band to the wrong driver',
    ],
    commonMistakes: [
      'Assuming any 8-pole loom matches any system — pair assignment follows the system documentation',
      'Trusting an un-twisted, half-engaged connector',
      'Moving a multiway loom between different systems without re-checking the drive assignment',
    ],
    notInterchangeableWith: [
      {
        otherId: 'speakon_nl4',
        otherName: '2-/4-pole speakON',
        why: 'The 8-pole connector is a different physical size from the 2- and 4-pole family.',
        consequence: 'They do not mate; no connection.',
      },
      {
        otherName: 'An 8-pole loom wired for a different system\'s drive assignment',
        why: 'The connector mates regardless of which amplifier band lands on which pair.',
        consequence: 'Wrong amplifier bands reach wrong drivers — a high-power band into a high-frequency driver can damage the driver.',
      },
    ],
    inspectionPoints: [
      'Burned or pitted contacts (evidence of connection under load)',
      'Locking mechanism that no longer engages crisply',
      'Heavy cable pulling at the backshell strain relief',
    ],
    basicTest:
      'De-energized continuity across each ± pair to the documented pole assignment, and confirmation that no pole bridges to any other.',
    safety: {
      level: 'speaker',
      cautions: [
        'Amplifier outputs on high-power systems reach and can exceed 100 V — a genuine electric-shock hazard, which is why amplifier manufacturers mark output terminals with the lightning-flash symbol and require covers over them. Never touch exposed speaker wiring or connector contacts while amplifiers are on; make and break speaker-level multiway connections with the amps muted or off.',
        'Loudspeaker connectors and cabling are never substituted with mains connectors or mains thinking — different system, different rules.',
      ],
    },
    glossary: ['Speakon'],
    relatedLessons: ['l05_loudspeaker', 'l08_selection', 'l09_handling'],
    sourceNotes: [
      '8-pole speakON (NL8) mates only with its own 8-pole counterparts; not intermateable with 2-/4-pole speakON sizes: manufacturer documentation — VERIFIED 2026-08-15: Neutrik NL8FC product page',
      'Locking is insert-and-twist (Quick Lock) on the 8-pole cable connector: Neutrik NL8FC product documentation — VERIFIED 2026-08-15',
      'Multiway drive assignment (which ± pair feeds which driver band) is system/processor-specific: system documentation — VERIFIED 2026-08-15: Neutrik NL8FC product page',
      'High-power amplifier outputs reach and can exceed 100 V and are a marked shock hazard (lightning-flash symbol on output terminals; covers required): QSC CX-series and PLX-series amplifier manuals — VERIFIED 2026-08-15',
    ],
  },

  {
    id: 'opticalcon_style',
    displayName: 'Ruggedized fiber connector (opticalCON-style)',
    aliases: ['opticalCON-style shell', 'Ruggedized optical connector', 'Fiber trunk connector (informal)'],
    category: 'optical',
    tier: 'recognition',
    carried: ['network_audio', 'digital_audio'],
    typicalSources: ['Digital stage box and console fiber ports', 'Fiber trunk reels between stage and control positions'],
    typicalDestinations: ['Console/stage-rack fiber ports', 'Media network switches with ruggedized fiber I/O'],
    construction: 'optical_fiber',
    constructionNote:
      'This is a ruggedized SHELL system around standard optical fiber connections — not a new kind of fiber. The shell adds sealing, locking, and abuse protection; the fiber and its optical standards inside are unchanged.',
    pinouts: [],
    balanced: 'n/a',
    channels: 'varies',
    locking: {
      method: 'push_pull',
      howToConfirm: 'Push in until it clicks; it releases only by pulling the outer sleeve/latch, not the cable.',
    },
    hotPlug: {
      policy: 'normally_fine',
      rationale:
        'No electrical hazard in the optical path — but the digital link drops the instant it is unplugged, and open ends start collecting contamination. Re-cap both sides immediately.',
    },
    advantages: [
      'Brings fragile fiber connections up to stage/touring durability',
      'Enormous data capacity over long runs with no electrical interference pickup',
      'Sealed shells and dust caps protect the polished fiber end-faces',
    ],
    limitations: [
      'End-face cleanliness is everything: an invisible film of dirt degrades or kills the link',
      'Fiber inside the trunk still has a minimum bend radius — the rugged shell does not make the glass kink-proof',
      'The shell system does not tell you what protocol runs over the fiber — both ends must speak the same system',
    ],
    commonMistakes: [
      'Leaving dust caps off open connectors and ports',
      'Treating the rugged shell as proof the cable can be kinked or crushed like copper',
      'Assuming any two fiber-equipped devices will interoperate because the connectors mate',
    ],
    notInterchangeableWith: [
      {
        otherId: 'ethercon_style',
        otherName: 'Ruggedized copper network connector (etherCON-style)',
        why: 'Both are ruggedized shells in a similar housing family — but one contains copper contacts, the other polished fiber.',
        consequence: 'They do not intermate; different media entirely. No connection.',
      },
      {
        otherName: 'Bare (non-ruggedized) fiber patch connectors',
        why: 'The ruggedized shell is built around a standard fiber connector (commonly LC), and compatibility is one-way on many systems: some ruggedized chassis accept a bare standard connector directly, but a standard coupler does not accept the ruggedized shell.',
        consequence: 'Whether a bare patch cable and a ruggedized port can connect depends on the specific system — check the documentation instead of assuming either way, and keep every open connection capped and clean.',
      },
    ],
    inspectionPoints: [
      'Dust caps present on every unmated connector and port',
      'Kinks, crush points, or tight bends in the trunk',
      'Link/error indicators on the equipment after connection — the practical field check',
    ],
    basicTest:
      'Beginner-level checking is visual: caps on, no kinks, shells latched. Optical loss and end-face inspection require dedicated fiber tools and training — a copper continuity tester tells you nothing about fiber.',
    safety: {
      level: 'signal',
      cautions: [
        'Never look into the end of a fiber or an open port: transmitter light is often invisible infrared. Treat every connected fiber as potentially carrying light.',
      ],
    },
    glossary: [],
    relatedLessons: ['l06_digital', 'l08_selection', 'l09_handling'],
    sourceNotes: [
      'Ruggedized fiber shell systems house standard optical connections (commonly LC-based; fiber count varies by version) — the shell is protection, not a new optical standard: manufacturer documentation — VERIFIED 2026-08-15: Neutrik opticalCON DUO/QUAD product pages',
      'Fiber end-face cleanliness/inspection practice: IEC 61300-3-35 — VERIFIED 2026-08-15: IEC 61300-3-35',
      'Optical transmitters in comms equipment commonly operate at invisible infrared wavelengths (700–1400 nm retinal hazard); do-not-view guidance: IEC 60825-2 (Safety of optical fibre communication systems) — VERIFIED 2026-08-15: IEC 60825-2',
      'Some ruggedized fiber chassis accept bare standard LC connectors directly (one-way, system-dependent compatibility): Neutrik opticalCON DUO product documentation — VERIFIED 2026-08-15',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Qualified-person tier — recognition ONLY, hard boundary.
  // Beginners never connect, disconnect, or handle these energized.
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'nema_twist_lock',
    displayName: 'NEMA locking connector (twist-lock)',
    aliases: ['Twist-lock (informal)', 'NEMA L-series locking connector'],
    category: 'power_mains',
    tier: 'qualified-person',
    region: 'NA',
    carried: ['ac_mains'],
    typicalSources: ['Generator and distro panel outputs', 'Venue receptacles for temporary/production power'],
    typicalDestinations: ['Amplifier racks and portable power distros', 'Motor controllers and production equipment'],
    construction: 'ac_3c_grounded',
    constructionNote:
      'Behind it is heavy flexible power cable sized by a qualified person for the circuit. Configurations exist for many voltage/current combinations — the blade pattern is specific to the rating.',
    pinouts: [],
    balanced: 'n/a',
    channels: 'n/a',
    locking: {
      method: 'twist_lock',
      howToConfirm: 'Blades insert and the plug rotates to lock. Verifying engagement on power circuits is part of the qualified person\'s job, not a beginner check.',
    },
    directionality:
      'By design — and by electrical code for correctly built cables — the energized source side ends in a female connector so exposed pins should never be live. Treat that as a design rule, not a guarantee: damaged, miswired, or improvised cables (illegal male-to-male backfeed cords exist in the field) can put mains voltage on exposed pins. Never touch the contacts of any power connector.',
    hotPlug: {
      policy: 'qualified_person_only',
      rationale:
        'Connecting and disconnecting production power circuits is qualified-person work under site procedures — not a beginner task, energized or not.',
    },
    advantages: [
      'Locks against pull-out — vibration and cable tension cannot disconnect it',
      'Blade patterns are keyed per voltage/current configuration, so unlike ratings do not mate',
    ],
    limitations: [
      'Many visually similar configurations exist; only the matching configuration mates — and that keying is a safety feature, not an inconvenience',
      'Adapters between configurations can defeat the rating protections the keying provides — adapter decisions belong to qualified personnel',
    ],
    commonMistakes: [
      'Assuming any twist-lock fits any twist-lock outlet — configurations are rating-specific by design',
      'Treating a locking plug as beginner-serviceable because it resembles a household plug: never wire, repair, or connect mains as a beginner',
      'Continuing to use a cord with a damaged plug or jacket instead of reporting it and taking it out of service',
    ],
    notInterchangeableWith: [
      {
        otherId: 'mains_wall',
        otherName: 'Straight-blade wall plug (NEMA 5-15)',
        why: 'Locking and straight-blade patterns are physically different, and different locking configurations differ from each other.',
        consequence: 'They do not mate. Improvised adaptation between unlike ratings defeats a designed safety barrier — electrical danger.',
      },
    ],
    inspectionPoints: [
      'From a respectful distance: damaged jackets, bent blades, scorch marks, or strain at the plug — REPORT, do not touch or fix',
      'Cords run through doorways or pinch points (report the hazard)',
    ],
    basicTest:
      'None at this tier. Electrical testing of power circuits and connectors is performed by qualified personnel with appropriate equipment and procedures.',
    safety: {
      level: 'mains',
      qualifiedPersonOnly: true,
      cautions: [
        'Beginners never connect, disconnect, or handle these energized; they belong to qualified/authorized personnel under site procedures.',
        'A damaged mains cord or connector leaves service immediately — report it; never tape it up or keep using it.',
        'Never bypass, remove, or adapt away a ground/earth connection for any reason.',
      ],
    },
    glossary: ['Edison Plug'],
    relatedLessons: ['l07_power', 'l09_handling'],
    sourceNotes: [
      'NEMA locking configurations key blade patterns to specific voltage/current ratings so unlike ratings do not mate: ANSI/NEMA WD 6 — VERIFIED 2026-08-15: NEMA WD 11-2023 Wiring Devices FAQ',
      'Energized-source-is-female is a design convention and a code requirement for correctly built cables (NEC 406.6(B)), not a field guarantee — illegal male-to-male backfeed cords and miswired or damaged cables can put mains voltage on exposed pins: NEMA WD 11-2023 Wiring Devices FAQ + CPSC stop-use warning on male-to-male cords — VERIFIED 2026-08-15',
    ],
  },

  {
    id: 'stage_pin',
    displayName: 'Stage pin connector',
    aliases: ['2P&G', 'Grounded pin connector (GPC)', 'Stage pin (informal)'],
    category: 'power_mains',
    tier: 'qualified-person',
    region: 'NA',
    carried: ['ac_mains'],
    typicalSources: ['Dimmer and relay circuits in theatrical rigs', 'Stage power drops and raceways'],
    typicalDestinations: ['Conventional stage lighting fixtures', 'Two-fers and theatrical cable runs'],
    construction: 'ac_3c_grounded',
    constructionNote:
      'Behind it is heavy theatrical power cable. The flat body with three in-line pins is the North American entertainment-lighting power connector — mains power, despite looking nothing like a wall plug.',
    pinouts: [],
    balanced: 'n/a',
    channels: 'n/a',
    locking: {
      method: 'friction',
      howToConfirm:
        'There is no positive lock — retention is pin friction only. Pin tension maintenance (with a pin splitter) is qualified-tech work, never a beginner adjustment.',
    },
    directionality:
      'By design, the energized source side ends in the female connector so exposed pins should never be live on correctly built cables. Treat that as a design rule, not a guarantee: miswired adapters, shop-built two-fers, and damaged connectors can violate it. Never touch the contacts of any power connector.',
    hotPlug: {
      policy: 'qualified_person_only',
      rationale:
        'Connecting and disconnecting stage power circuits is qualified-person work under site procedures — dimmer circuits can be energized at any time from the console.',
    },
    advantages: [
      'Flat, low-profile body suits taped-down runs on stage decks',
      'Long-established standard for North American entertainment lighting power',
    ],
    limitations: [
      'No positive lock — connections can pull apart under cable tension',
      'Loose pin tension causes heat and intermittent power; correcting it is qualified maintenance',
      'Looks nothing like household power, which misleads beginners into underestimating it — it is full mains power',
    ],
    commonMistakes: [
      'Treating a stage pin connector as "just lighting stuff" rather than a mains power connector',
      'Attempting to re-tension pins or open a connector — qualified-tech work only',
      'Leaving a damaged or scorched connector in service instead of reporting it',
    ],
    notInterchangeableWith: [
      {
        otherId: 'mains_wall',
        otherName: 'Household wall plug (Edison)',
        why: 'Both carry mains power in the same buildings; adapters between them exist in theatrical stock.',
        consequence:
          'They do not mate directly, and whether an adapter is appropriate for a given circuit is a qualified person\'s call — improvised adaptation is electrical danger.',
      },
    ],
    inspectionPoints: [
      'From a respectful distance: scorch marks, cracked bodies, exposed conductor at the cable entry — REPORT, do not touch',
      'Connections lying in walkways or under scenery without protection (report the hazard)',
    ],
    basicTest:
      'None at this tier. Electrical testing of power circuits and connectors is performed by qualified personnel with appropriate equipment and procedures.',
    safety: {
      level: 'mains',
      qualifiedPersonOnly: true,
      cautions: [
        'Beginners never connect, disconnect, or handle these energized; they belong to qualified/authorized personnel under site procedures.',
        'Dimmer-fed circuits can go live remotely at any time — treat every stage pin connector as energized.',
        'A damaged connector or cable leaves service immediately — report it; never tape or improvise.',
      ],
    },
    glossary: ['Edison Plug'],
    relatedLessons: ['l07_power', 'l09_handling'],
    sourceNotes: [
      'Stage pin (2P&G / GPC) connector dimensions for entertainment lighting: ANSI E1.24 — VERIFIED 2026-08-15: ANSI E1.24-2012 (R2021), ESTA TSP',
      'Retention is friction-fit via split pins with no positive lock; pin tension is restored with a dedicated pin-splitter tool: ANSI E1.24 + tool manufacturer documentation — VERIFIED 2026-08-15; the qualified-tech-only boundary for pin tensioning is a lab/site-procedure policy statement, not a cited standard — EXPERT REVIEW PENDING',
      'Female-source directionality is a design rule for correctly built cables, not a field guarantee — miswired adapters, shop-built two-fers, and damaged connectors can violate it: CPSC/PIRG male-to-male cord warnings (ANSI E1.24 defines dimensions only) — VERIFIED 2026-08-15',
    ],
  },

  {
    id: 'cam_type',
    displayName: 'Cam-type single-conductor feeder',
    aliases: ['Camlock (informal)', 'Cam-style feeder connector', 'Feeder cam (informal)'],
    category: 'power_mains',
    tier: 'qualified-person',
    region: 'NA',
    carried: ['ac_mains'],
    typicalSources: ['Generator output panels and building company switches (qualified crews only)'],
    typicalDestinations: ['Main power distribution racks (distros) feeding an entire production'],
    constructionNote:
      'Each connector terminates ONE very heavy single-conductor feeder cable. A complete service is a set of them — phases, neutral, and ground as separate cables — carrying an entire production\'s power.',
    pinouts: [],
    balanced: 'n/a',
    channels: 'n/a',
    locking: {
      method: 'twist_lock',
      howToConfirm: 'Cam contacts insert and twist to lock. Beginners never perform or verify this connection — recognition only.',
    },
    hotPlug: {
      policy: 'qualified_person_only',
      rationale:
        'Feeder connection and disconnection is strictly qualified-person work under site electrical procedures, including connection order and lockout. There is no beginner version of this task.',
    },
    advantages: [
      'Carries service-level current that no multi-pin connector format handles',
      'Single-conductor-per-connector format lets qualified crews build large services cable by cable',
    ],
    limitations: [
      'Nothing about the connector prevents wrong-order or wrong-conductor connection — safe use lives entirely in qualified procedure, which is why it is restricted work',
      'Reduced-size cam variants exist and do not mate with full-size — rating and fit are a qualified person\'s determination',
    ],
    commonMistakes: [
      'Any beginner contact at all — the correct beginner action around feeder is distance and reporting',
      'Assuming a feeder run is dead because equipment is off: only a qualified person\'s verification under lockout establishes that',
      'Judging conductor roles by insulation color alone across different shops or regions',
    ],
    notInterchangeableWith: [
      {
        otherName: 'Reduced-size cam-style connectors',
        why: 'Smaller cam series exist for lower-current feeders and do not mate with full-size connectors.',
        consequence: 'They do not mate — and any decision about matching feeder to service belongs to qualified personnel. Electrical danger is the stake.',
      },
    ],
    inspectionPoints: [
      'From a distance only: feeder lying in water, damaged insulation, or strain on connections — REPORT immediately, touch nothing',
      'Cable ramps or protection missing where feeder crosses walkways (report the hazard)',
    ],
    basicTest:
      'None, ever, at this tier. Feeder verification is qualified-person work under lockout/tagout with rated test equipment.',
    safety: {
      level: 'mains',
      qualifiedPersonOnly: true,
      cautions: [
        'STRICT BOUNDARY: beginners never connect, disconnect, touch, or handle feeder connectors — energized or not. Feeder work belongs exclusively to qualified/authorized personnel under site procedures and lockout/tagout.',
        'Feeder carries enough energy to be lethal on contact and to arc without contact when mishandled. Recognition means: identify it, keep clear, report concerns.',
        'Treat every feeder cable as energized unless a qualified person has verified otherwise under lockout.',
      ],
    },
    glossary: ['Camlock', 'Cable Ramp'],
    relatedLessons: ['l07_power', 'l09_handling'],
    sourceNotes: [
      'Single-conductor cam-style feeder connectors carry one conductor each (phases, neutral, ground as separate cables) at service-level current; connection order and verification fall under qualified-person electrical procedures (NFPA 70 / NFPA 70E context) — VERIFIED 2026-08-15: NFPA 70E qualified-person/LOTO framework (context)',
      'NA feeder insulation color conventions vary in detail by jurisdiction and shop; the AHJ and site procedures govern — VERIFIED 2026-08-15: NEC neutral/ground color requirements (phase colors largely not mandated)',
      'Reduced-size cam-style series exist and do not intermate with full-size: manufacturer documentation — VERIFIED 2026-08-15: Hubbell/Leviton/Ericson camlock series listings (15-series 150 A vs 16-series 400 A)',
    ],
  },

  {
    id: 'socapex_style',
    displayName: 'Multicircuit power connector (Socapex-style)',
    aliases: ['Soca (informal)', '19-pin multicircuit connector', 'Lighting multi (informal)'],
    category: 'power_mains',
    tier: 'qualified-person',
    carried: ['ac_mains'],
    typicalSources: ['Dimmer, relay, and power distribution rack outputs'],
    typicalDestinations: ['Breakout assemblies feeding lighting fixtures', 'Multicircuit drops to electrics and set positions'],
    constructionNote:
      'One round connector, MANY mains circuits: the multicore cable behind it carries several complete power circuits to one position. It closely resembles circular signal multipin connectors — which is exactly why identification matters.',
    pinouts: [],
    balanced: 'n/a',
    channels: 'n/a',
    locking: {
      method: 'screw',
      howToConfirm: 'A threaded coupling ring draws the shells together. Beginners never perform or verify this connection — recognition only.',
    },
    hotPlug: {
      policy: 'qualified_person_only',
      rationale:
        'Every pin group can be a live mains circuit, and circuits may be energized remotely from a console at any time. Connection work belongs to qualified/authorized personnel under site procedures.',
    },
    advantages: [
      'Several power circuits run to a lighting position in one cable and one connection',
      'Keyed circular shell with threaded coupling — solid retention on rigged positions',
    ],
    limitations: [
      'Multiple mains circuits in one connector means one damaged cable or wrong connection affects many circuits at once',
      'Its resemblance to circular signal multipins invites dangerous misidentification — the label and system, not the shape, tell you what it is',
    ],
    commonMistakes: [
      'Mistaking a multicircuit POWER connector for an audio/data multipin because the round shells look alike — identify before approaching any circular multipin',
      'Assuming the circuits inside are dead because the fixtures are dark: dimmer and relay circuits energize remotely',
      'Any beginner attempt to connect, disconnect, or "help" with multicircuit power',
    ],
    notInterchangeableWith: [
      {
        otherId: 'lk_veam',
        otherName: 'Circular multipin AUDIO snake connector',
        why: 'Both are keyed circular multipin shells seen on the same stages; visually similar at a glance.',
        consequence:
          'Different connector families are keyed and will not couple — never force or defeat keying. But keying is not the safeguard: identical 19-pin multipin connectors are used in the field for both mains-power distribution and loudspeaker feeds, so a shell that mates proves nothing about what is behind it. Identify the system from labels and documentation before touching anything; putting mains power into signal wiring means equipment damage and electrical danger.',
      },
    ],
    inspectionPoints: [
      'From a respectful distance: damaged multicore jacket, scorched or deformed shells, strain at rigged positions — REPORT, do not touch',
      'Multicircuit cable run without protection through traffic areas (report the hazard)',
    ],
    basicTest:
      'None at this tier. Multicircuit power testing is qualified-person work with rated equipment under site procedures.',
    safety: {
      level: 'mains',
      qualifiedPersonOnly: true,
      cautions: [
        'STRICT BOUNDARY: beginners never connect, disconnect, or handle multicircuit power connectors — energized or not. This is qualified/authorized-personnel work under site procedures.',
        'One connector can carry several live mains circuits simultaneously, and any of them can energize remotely at any time.',
        'Never assume a circular multipin is signal wiring — confirm the system before touching anything, and when in doubt, ask and keep clear.',
      ],
    },
    glossary: ['Multipin Connector'],
    relatedLessons: ['l07_power', 'l09_handling'],
    sourceNotes: [
      '19-pin multicircuit connectors conventionally carry six mains circuits (line/neutral pairs plus grounds, pin 19 alignment/pilot) in entertainment lighting practice; exact wiring per system documentation — VERIFIED 2026-08-15: Phase 3 Connectors Socapex wiring documentation',
      'Visually similar circular multipin shells serve both mains power and signal; different series are keyed against each other, but identical 19-pin Socapex-type connectors are commercially used for both power and loudspeaker service — labeling and identification, not keying, is the safeguard: manufacturer catalogs and commercial breakout-product documentation — VERIFIED 2026-08-15',
    ],
  },
];
