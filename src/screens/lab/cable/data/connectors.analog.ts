/**
 * connectors.analog — core analog audio connector records for the Cable &
 * Connector Fundamentals Lab (owner spec 2026-08-15 §5.3/§7).
 *
 * SAFETY-CRITICAL CONTENT (owner mandate 2026-08-15): every claim in this file
 * is subject to the B2 fact-verification protocol
 * (docs/APE_CABLE_LAB_PLAN_2026_08_15.md §9). sourceNotes carry the governing
 * standard per claim group; claims that vary by equipment are marked
 * `equipment-dependent` and taught as "verify from the documentation."
 * Consequences are technically proportionate — never dramatized (§5.4).
 *
 * VOICE: concise, professional, misconception-correcting. No real brands or
 * model likenesses; standard connector names (XLR, RCA…) used nominatively.
 * The xlr3 record below is the calibration exemplar for depth and voice.
 */
import type { ConnectorRecord } from '../cableTypes';

export const CONNECTORS_ANALOG: ConnectorRecord[] = [
  {
    id: 'xlr3',
    displayName: '3-pin XLR',
    aliases: ['XLR', 'XLR3', 'Cannon connector (historical name)', 'mic connector (informal)'],
    category: 'analog_audio',
    tier: 'core',
    carried: ['mic_level', 'line_level', 'digital_audio'],
    typicalSources: [
      'Microphones',
      'DI box outputs',
      'Mixer / console main and aux outputs',
      'Wireless receiver outputs',
      'Processor and crossover outputs',
    ],
    typicalDestinations: [
      'Mixer / console mic and line inputs',
      'Stage box / snake channels',
      'Powered loudspeaker inputs',
      'Audio interface mic inputs',
      'Amplifier and processor inputs',
    ],
    construction: 'balanced_shielded',
    constructionNote:
      'Conventional microphone cable is a shielded twisted pair — two conductors for the balanced pair, plus an overall shield. The connector does not guarantee the construction: an AES3 digital XLR cable is built as 110-ohm digital cable, and an unknown cable must be verified, not assumed.',
    pinouts: [
      {
        id: 'balanced_analog',
        application: 'Balanced analog audio (microphone or line level)',
        carried: ['mic_level', 'line_level'],
        contacts: [
          { label: '1', role: 'Cable shield / reference', ink: 'shield', note: 'Ties the cable screen to the equipment reference.' },
          { label: '2', role: 'Signal + (non-inverting, “hot”)', ink: 'signalPos' },
          { label: '3', role: 'Signal − (inverting, “cold”)', ink: 'signalNeg' },
        ],
        confidence: 'standard',
      },
      {
        id: 'aes3_digital',
        application: 'AES3 digital audio — same shell, different cable and signal',
        carried: ['digital_audio'],
        contacts: [
          { label: '1', role: 'Cable shield', ink: 'shield' },
          { label: '2', role: 'Data + (balanced digital pair)', ink: 'dataA' },
          { label: '3', role: 'Data − (balanced digital pair)', ink: 'dataB' },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'either',
    channels: 'mono',
    locking: {
      method: 'latch',
      howToConfirm: 'Push in until the latch clicks. A locked plug will not pull free without pressing the release tab.',
    },
    directionality:
      'By convention, outputs are male (pins) and inputs are female (sockets) — the signal flows out of pins, into sockets. Phantom power travels the opposite direction, supplied by the input that provides it.',
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'Connecting or unplugging a live channel can pop loudly through the system. Mute the channel first; with +48 V phantom power, switch phantom off and pause briefly before unplugging.',
    },
    advantages: [
      'Latching shell — will not pull out by accident',
      'Balanced connection rejects interference over long cable runs',
      'Rugged body; contacts are recessed and protected',
      'The de-facto professional standard for microphone connections',
    ],
    limitations: [
      'Bulkier than 1/4-inch or 3.5 mm connectors',
      'The same 3-pin shell serves several different jobs (analog audio, AES3 digital, some control uses) — the connector alone does not identify the signal',
      'Phantom power on the line can misbehave with equipment not designed to receive it — verify before patching',
    ],
    commonMistakes: [
      'Assuming every XLR connection is an analog microphone signal',
      'Using an ordinary analog microphone cable for a long AES3 digital run',
      'Unplugging a phantom-powered microphone with the channel live',
      'Ignoring what a wall plate or snake line actually carries because the shell “fits”',
    ],
    notInterchangeableWith: [
      {
        otherName: 'XLR AES3 digital cable',
        why: 'Same connector, different cable: AES3 digital audio is specified for 110-ohm balanced digital cable, not analog microphone cable.',
        consequence:
          'An analog mic cable on a long AES3 run can drop out intermittently or fail to lock at all — a reliability failure, not equipment damage.',
      },
      {
        otherName: 'DMX lighting control run (XLR-shell use)',
        why: 'Lighting control (DMX512) specifies 120-ohm data cable; some fixtures use XLR-shell connectors, so audio and lighting lines can physically mate.',
        consequence:
          'Microphone cable in a DMX line invites flickering and erratic fixture behavior. Patching audio gear into a control line fails to work and can disrupt the control network — and if the audio line carries +48 V phantom power, it can damage lighting-control electronics. Verify what a line carries before connecting.',
      },
    ],
    inspectionPoints: [
      'Bent, pushed-in or corroded pins',
      'Cracked shell, loose insert, or a latch that no longer clicks',
      'Strain relief pulled out of the boot; jacket slipping at the connector',
      'Crackle or dropout when the cable is flexed near the connector',
    ],
    basicTest:
      'A continuity tester shows 1→1, 2→2, 3→3 straight through with the shield intact and no contact bridging. A cable that passes 2↔3 swapped still carries audio but inverts polarity — it should be flagged and corrected.',
    safety: {
      level: 'signal',
      cautions: [
        '+48 V phantom power may be present between pins 2/3 and pin 1. It is not a shock hazard, but switch it off before patching equipment that should not receive it.',
        'A shock, tingle, or buzz felt from a microphone, connector shell, or equipment chassis is never phantom power — it indicates a mains grounding fault somewhere in the system. Stop, do not keep touching the equipment, power the system down, and have the equipment and outlets checked by a qualified person before use. Never defeat a ground pin to make a hum go away.',
      ],
    },
    glossary: ['XLR Cable', 'XLRF', 'XLRM', 'Balanced signaling'],
    relatedLessons: ['l03_analog', 'l04_same_plug', 'l08_selection'],
    sourceNotes: [
      'Pin assignment (1 shield, 2 non-inverting/+, 3 inverting/−): AES14-1992 / IEC 60268-12 convention — VERIFIED 2026-08-15: AES14-1992 (s2019)',
      'Phantom power P48: +48 V applied equally to pins 2 and 3 relative to pin 1: IEC 61938 — VERIFIED 2026-08-15: IEC 61938 (per DPA Mic University)',
      'AES3 specifies 110-ohm balanced cable: AES3 — VERIFIED 2026-08-15: TV Tech (Use Correct Cables for AES3)',
      'DMX512 specifies 120-ohm cable; 5-pin XLR is its standard connector with 3-pin appearing on some fixtures: ANSI E1.11 — VERIFIED 2026-08-15: ETC DMX512 Info',
      'Audio line carrying +48 V phantom power patched into a DMX fixture data port can damage lighting-control electronics: Sweetwater Lighting 101 Part 2 (Understanding DMX) — VERIFIED 2026-08-15',
      'Shock, tingle, or buzz from a microphone or chassis indicates a mains grounding fault, not phantom power — stop, power down, and have equipment and outlets checked by a qualified person; never defeat a ground pin: Audio University (Electric Shock From a Microphone or Guitar) — VERIFIED 2026-08-15',
    ],
  },
  {
    id: 'ts_quarter',
    displayName: '1/4-inch TS',
    aliases: ['TS', '1/4-inch phone plug (2-contact, mono)', '6.35 mm jack plug', 'guitar cable plug (informal)'],
    category: 'analog_audio',
    tier: 'core',
    carried: ['instrument_level', 'line_level'],
    typicalSources: [
      'Electric guitars and basses',
      'Keyboards and synthesizers (unbalanced outputs)',
      'Effects pedal outputs',
      'Some unbalanced line outputs on mixers and playback gear',
    ],
    typicalDestinations: [
      'Instrument amplifier inputs',
      'Effects pedal inputs',
      'DI box inputs',
      'Interface and mixer instrument or unbalanced line inputs',
    ],
    construction: 'instrument_unbalanced',
    constructionNote:
      'Conventional instrument cable is a single small-gauge conductor inside a shield, built to move a tiny high-impedance signal quietly. A speaker cable wearing the identical TS plug is two heavier unshielded conductors built to move amplifier current. The plug does not tell you which one you are holding — the jacket printing and the construction do.',
    pinouts: [
      {
        id: 'unbalanced_mono',
        application: 'Unbalanced mono — instrument or unbalanced line signal',
        carried: ['instrument_level', 'line_level'],
        contacts: [
          { label: 'Tip', role: 'Signal', ink: 'signalPos' },
          { label: 'Sleeve', role: 'Return / shield', ink: 'shield', note: 'One conductor doubles as return path and shield.' },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'unbalanced',
    channels: 'mono',
    locking: {
      method: 'friction',
      howToConfirm: 'Fully seated is a firm push to a positive stop. There is no lock — the plug relies on jack spring tension alone.',
    },
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'The exposed tip drags across the jack contacts as it seats, producing loud pops. Mute the channel or turn the amplifier down before plugging or unplugging an instrument.',
    },
    advantages: [
      'Rugged, inexpensive, and easy to repair',
      'The universal instrument-world connector with an enormous installed base',
      'Simple two-contact construction is easy to test and re-solder',
    ],
    limitations: [
      'Unbalanced: picks up more interference as runs get longer',
      'Friction retention only — pulls out under foot traffic',
      'The identical plug appears on instrument cables and speaker cables that must not be swapped',
      'The tip bridges contacts during insertion, so live connections pop',
    ],
    commonMistakes: [
      'Grabbing any cable with 1/4-inch plugs for speaker duty because it fits',
      'Using a speaker cable for an instrument and blaming the instrument for the hum',
      'Assuming a 1/4-inch jack is an instrument input without checking what it actually is',
      'Pulling cables out by the cord instead of the plug',
    ],
    notInterchangeableWith: [
      {
        otherId: 'ts_speaker_legacy',
        otherName: 'Speaker cable with 1/4-inch TS plugs',
        why: 'Same plug, different cable: instrument cable is a shielded small-gauge conductor for tiny signals; speaker cable is two heavier unshielded conductors for amplifier current. Older amplifiers and loudspeakers used TS jacks for speaker connections, so both cables exist in the field.',
        consequence:
          'An instrument cable on a speaker run loses power in its small conductor and can heat at higher power — a reliability problem that can become cable failure and put the amplifier at risk. A speaker cable used for an instrument has no shield, so it hums and buzzes — noise, not damage.',
      },
      {
        otherId: 'trs_quarter',
        otherName: '1/4-inch TRS',
        why: 'A TS plug seats in a TRS jack and shorts the ring contact to the sleeve.',
        consequence:
          'Into a balanced input this usually passes signal but gives up the noise rejection. Into a stereo jack it shorts one channel to ground: that side of the program is missing, and the shorted output is working into a dead short — poor practice even when nothing fails.',
      },
    ],
    inspectionPoints: [
      'Bent or pitted tip; loose screw-together barrels',
      'Jacket pulling out of the strain relief',
      'Crackle when the cable is flexed at the plug',
      'Corrosion or grime on the plug body',
    ],
    basicTest:
      'Continuity tip→tip and sleeve→sleeve with no tip↔sleeve short. Flex the cable at each plug while watching the reading — an intermittent drop means a failing joint. A continuity test cannot tell instrument cable from speaker cable; read the jacket and construction for that.',
    safety: {
      level: 'signal',
      cautions: [
        'The plug fitting a jack does not confirm the level behind it. Legacy amplifier speaker outputs also use 1/4-inch TS jacks — verify what a jack carries before patching. Speaker connections follow a different rule: power the amplifier off before connecting or disconnecting a speaker cable. A tube amplifier driven without a speaker load can damage its output transformer and tubes — turning the volume down is not enough.',
      ],
    },
    glossary: ['TS Connector (Tip-Sleeve)', 'DI box (direct injection)'],
    relatedLessons: ['l02_anatomy', 'l03_analog', 'l04_same_plug', 'l05_loudspeaker'],
    sourceNotes: [
      'Two-contact 1/4-inch phone plug: tip = signal, sleeve = return/shield — universal unbalanced convention; connector family dimensions IEC 60603-11 — VERIFIED 2026-08-15: IEC 60603-11:1992 scope',
      'Instrument cable (single small-gauge shielded conductor) vs speaker cable (two heavier unshielded conductors): industry construction convention — VERIFIED 2026-08-15: Fender (instrument vs speaker cables)',
      'Instrument cable on loudspeaker duty: undersized conductor loses power and can heat at higher amplifier power, with failure risk — VERIFIED 2026-08-15: Fender (instrument vs speaker cables)',
      'Legacy loudspeaker connections on 1/4-inch TS jacks (instrument amplifiers, vintage PA): historical practice — VERIFIED 2026-08-15: Fender (instrument vs speaker cables)',
      'Tube amplifier driven without a speaker load can damage its output transformer and tubes; power the amplifier off before changing speaker connections: amplifier-technician consensus (diyAudio, Marshall Forum) — EXPERT REVIEW PENDING',
    ],
  },
  {
    id: 'trs_quarter',
    displayName: '1/4-inch TRS',
    aliases: ['TRS', '1/4-inch phone plug (3-contact)', '6.35 mm stereo/balanced jack plug', 'stereo jack (informal — not always stereo)'],
    category: 'analog_audio',
    tier: 'core',
    carried: ['line_level', 'headphone_level'],
    typicalSources: [
      'Balanced line outputs on interfaces, consoles and processors',
      'Headphone outputs (stereo wiring)',
      'Console insert jacks (send and return on one jack)',
      'Keyboard and monitor-controller outputs',
    ],
    typicalDestinations: [
      'Balanced line inputs on consoles, monitors and processors',
      'Headphones',
      'Insert points on consoles and channel strips',
      'Patchbays',
    ],
    construction: 'balanced_shielded',
    constructionNote:
      'Balanced use conventionally rides a shielded twisted pair — two conductors plus shield. Unbalanced stereo use rides the same two-conductors-plus-shield construction with the conductors carrying left and right instead of + and −. The construction cannot tell you which job the cable is doing; the equipment on each end decides.',
    pinouts: [
      {
        id: 'balanced_mono',
        application: 'Balanced mono line signal',
        carried: ['line_level'],
        contacts: [
          { label: 'Tip', role: 'Signal + (non-inverting, “hot”)', ink: 'signalPos' },
          { label: 'Ring', role: 'Signal − (inverting, “cold”)', ink: 'signalNeg' },
          { label: 'Sleeve', role: 'Shield / reference', ink: 'shield' },
        ],
        confidence: 'standard',
      },
      {
        id: 'unbalanced_stereo',
        application: 'Unbalanced stereo (headphones, stereo interconnects)',
        carried: ['headphone_level', 'line_level'],
        contacts: [
          { label: 'Tip', role: 'Left channel', ink: 'signalPos' },
          { label: 'Ring', role: 'Right channel', ink: 'signalPos', note: 'An ordinary unbalanced signal here — not an inverting leg.' },
          { label: 'Sleeve', role: 'Common return / shield', ink: 'shield' },
        ],
        confidence: 'standard',
      },
      {
        id: 'insert',
        application: 'Console insert — send and return share one jack',
        carried: ['line_level'],
        contacts: [
          { label: 'Tip', role: 'Send (commonly — verify)', ink: 'signalPos', note: 'Tip-send is common, not universal.' },
          { label: 'Ring', role: 'Return (commonly — verify)', ink: 'signalPos', note: 'Some equipment reverses send and return.' },
          { label: 'Sleeve', role: 'Shield / reference', ink: 'shield' },
        ],
        confidence: 'equipment-dependent',
        verifyAgainst:
          'The console’s documentation. Tip-send/ring-return is common, but manufacturers differ; a reversed insert cable leaves the channel silent or the processor out of the path.',
      },
    ],
    balanced: 'either',
    channels: 'varies',
    locking: {
      method: 'friction',
      howToConfirm: 'A firm push to a positive stop; there is no lock. On insert jacks, a half-seated plug lands on the wrong contacts on purpose in some designs — seat it fully.',
    },
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'The contacts bridge on the way in and out, popping through the system. Mute the channel first — especially at insert jacks, where partial insertion interrupts the channel path.',
    },
    advantages: [
      'One connector serves balanced mono, unbalanced stereo, and insert duty',
      'Balanced use gains interference rejection over distance',
      'More compact than XLR; suits dense jack fields',
    ],
    limitations: [
      'Three contacts do not tell you which of its three jobs a jack performs',
      'Friction retention only — no latch',
      'Insert send/return assignment varies by manufacturer',
      'Partially inserted plugs bridge contacts and misroute signal briefly',
    ],
    commonMistakes: [
      'Assuming a TRS plug means the connection is stereo',
      'Assuming a TRS plug means the connection is balanced',
      'Patching a balanced source into an insert jack and expecting a line input',
      'Wiring an insert cable tip-send without checking the console’s convention',
    ],
    notInterchangeableWith: [
      {
        otherId: 'ts_quarter',
        otherName: '1/4-inch TS',
        why: 'TS and TRS plugs mate with each other’s jacks, so mixed connections happen silently; what results depends on the circuits at both ends.',
        consequence:
          'Commonly the connection works but becomes unbalanced without announcing it. With some output designs, grounding the inverting leg raises distortion or shifts level, and a minority of electronically balanced outputs are not designed to drive a grounded leg at all. Check the documentation rather than trusting the fit.',
      },
      {
        otherName: 'Console insert point (send/return on one TRS jack)',
        why: 'An insert jack looks identical to a balanced line jack, but the console expects send on one contact and return on the other.',
        consequence:
          'A balanced source patched into an insert lands on a send/return pair instead of an input: the channel goes silent or routes wrongly. A routing failure, not damage.',
      },
      {
        otherName: 'Stereo TRS source into a balanced mono TRS input',
        why: 'Left lands on the + leg and right on the − leg, and a balanced input amplifies the difference between its legs.',
        consequence:
          'The input hears left-minus-right, so center-panned content largely cancels: thin, hollow audio with vocals and bass nearly missing. Wrong connection, no damage.',
      },
    ],
    inspectionPoints: [
      'Bent tip or worn insulation bands between contacts',
      'Cracked insulating washers separating tip, ring and sleeve',
      'Intermittent contact when the plug is rotated in the jack',
      'Strain relief and jacket condition at the plug',
    ],
    basicTest:
      'Tip→tip, ring→ring, sleeve→sleeve straight through, with no continuity between different contacts. Bridged or crossed contacts misroute signal: a tip↔ring short collapses a stereo pair or shorts a balanced pair to near-silence.',
    safety: {
      level: 'signal',
      cautions: [
        'A TRS jack may be a balanced input, a stereo output, or an insert point — the contact count does not tell you which. Identify the jack’s job before patching; fit proves nothing.',
      ],
    },
    glossary: ['TRS Connector (Tip-Ring-Sleeve)', 'TS Connector (Tip-Sleeve)', 'Balanced signaling', 'Insert Cable', 'Patchbay'],
    relatedLessons: ['l03_analog', 'l04_same_plug', 'l08_selection'],
    sourceNotes: [
      'Balanced wiring tip = + (non-inverting), ring = − (inverting), sleeve = shield: professional standard practice, polarity consistent with the AES14 XLR convention — VERIFIED 2026-08-15: Rane Note 110',
      'Unbalanced stereo wiring tip = left, ring = right, sleeve = common: universal headphone/stereo convention — VERIFY',
      'Insert jacks: tip-send/ring-return common but manufacturer-specific; some equipment reverses it — VERIFIED 2026-08-15: Hosa STP-200 insert cable documentation',
      'Stereo source into a balanced mono input yields the L−R difference (center content cancels): consequence of differential input arithmetic — VERIFIED 2026-08-15: Q-SYS application note (stereo outputs to mono input)',
      'TS plug in a balanced TRS input grounds the inverting leg: usually functional unbalanced; a minority of non-cross-coupled electronically balanced outputs are not designed to drive a grounded leg and can be stressed or damaged: EDN (cross-coupled output stages) / ProSoundWeb — VERIFIED 2026-08-15',
    ],
  },
  {
    id: 'trs_35',
    displayName: '3.5 mm TRS (mini)',
    aliases: ['3.5 mm mini jack', '1/8-inch mini plug', 'aux plug (informal)', 'headphone mini plug'],
    category: 'analog_audio',
    tier: 'core',
    carried: ['headphone_level', 'line_level'],
    typicalSources: [
      'Phone, tablet and computer headphone or line outputs',
      'Portable player and media device outputs',
      'Some compact wireless-system and camera audio connections (equipment-dependent)',
    ],
    typicalDestinations: [
      'Headphones and earbuds',
      'Powered desktop monitor aux inputs',
      'Mixer aux/media inputs (often via adaptation to 1/4-inch or RCA)',
      'Camera and portable recorder inputs (equipment-dependent)',
    ],
    construction: 'balanced_shielded',
    constructionNote:
      'Consumer 3.5 mm cables typically carry two small conductors plus a common shield/return — the same two-plus-shield idea as larger cables, miniaturized. The small build trades durability for size; the strain relief is usually what determines the cable’s lifespan.',
    pinouts: [
      {
        id: 'unbalanced_stereo',
        application: 'Unbalanced stereo — the common consumer wiring',
        carried: ['headphone_level', 'line_level'],
        contacts: [
          { label: 'Tip', role: 'Left channel', ink: 'signalPos' },
          { label: 'Ring', role: 'Right channel', ink: 'signalPos', note: 'An ordinary unbalanced signal — not an inverting leg.' },
          { label: 'Sleeve', role: 'Common return / shield', ink: 'shield' },
        ],
        confidence: 'standard',
      },
      {
        id: 'balanced_mono',
        application: 'Balanced mono — used by some compact equipment',
        carried: ['line_level'],
        contacts: [
          { label: 'Tip', role: 'Signal + (non-inverting)', ink: 'signalPos' },
          { label: 'Ring', role: 'Signal − (inverting)', ink: 'signalNeg' },
          { label: 'Sleeve', role: 'Shield / reference', ink: 'shield' },
        ],
        confidence: 'equipment-dependent',
        verifyAgainst:
          'The equipment documentation. Some compact and portable gear wires 3.5 mm TRS as balanced mono; most consumer jacks are stereo unbalanced. The plug looks identical either way.',
      },
    ],
    balanced: 'either',
    channels: 'varies',
    locking: {
      method: 'friction',
      howToConfirm: 'A light click into the jack’s spring detent; there is no lock. Cable strain unseats it easily.',
    },
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'Connections into live systems pop as the contacts bridge — mute or turn the level down first. When plugging in headphones, start with the volume low to protect your hearing.',
    },
    advantages: [
      'Extremely common on consumer and portable devices',
      'Small size suits compact equipment',
      'Stereo through a single miniature plug',
    ],
    limitations: [
      'Small contacts and thin cables fail sooner than 1/4-inch equivalents',
      'Mostly unbalanced — limited run length before noise intrudes',
      'Friction-only retention; easily unseated by cable strain',
      'The identical plug may be stereo unbalanced or balanced mono depending on the equipment',
    ],
    commonMistakes: [
      'Assuming every 3.5 mm TRS connection is stereo',
      'Running long unbalanced 3.5 mm cables and accepting the hum',
      'Plugging a TRS-only plug into a TRRS headset jack and expecting a microphone path',
      'Ignoring the manual on equipment that uses 3.5 mm jacks for balanced or non-obvious purposes',
    ],
    notInterchangeableWith: [
      {
        otherId: 'trrs_35',
        otherName: '3.5 mm TRRS (headset)',
        why: 'The plugs mate physically — a TRS plug seats in a TRRS jack and bridges the fourth contact to the third.',
        consequence:
          'Playback usually works; the microphone path simply does not exist on a TRS plug, so headset functions are missing. No damage — a capability mismatch.',
      },
      {
        otherName: 'Balanced mono 3.5 mm connection on compact equipment',
        why: 'The same plug serves stereo unbalanced and balanced mono duty, and nothing on the plug distinguishes them.',
        consequence:
          'A stereo source into a balanced mono input arrives as left-minus-right and center content cancels; a balanced output into a stereo input puts an inverted copy on one side. Odd, thin audio — no damage.',
      },
    ],
    inspectionPoints: [
      'Bent plug shaft (common on pocketed devices)',
      'Cracked or worn insulator rings between contacts',
      'Audio cutting in and out when the plug is wiggled',
      'Fraying where the cable enters the plug',
    ],
    basicTest:
      'The same three-path check as 1/4-inch TRS: each contact straight through, none bridged. Miniature plugs most often fail at the strain relief — flex the cable there while testing.',
    safety: {
      level: 'signal',
      cautions: [
        'Headphone outputs can reach levels that are harmful to hearing. Set the volume low before putting headphones on, then raise it.',
      ],
    },
    glossary: ['3.5mm Connector', 'TRS Connector (Tip-Ring-Sleeve)', 'Balanced signaling'],
    relatedLessons: ['l03_analog', 'l04_same_plug', 'l08_selection'],
    sourceNotes: [
      'Stereo wiring tip = left, ring = right, sleeve = common: universal consumer convention; 3.5 mm connector family IEC 60603-11 — VERIFY',
      'Balanced-mono 3.5 mm TRS use on some compact/portable equipment: equipment-dependent practice — VERIFIED 2026-08-15: Audio-Technica System 10 output Q&A',
      'Stereo-into-balanced-mono L−R cancellation: consequence of differential input arithmetic — VERIFIED 2026-08-15: Q-SYS application note (stereo outputs to mono input)',
    ],
  },
  {
    id: 'trrs_35',
    displayName: '3.5 mm TRRS (headset)',
    aliases: ['TRRS', 'headset plug', '4-contact 3.5 mm mini plug'],
    category: 'analog_audio',
    tier: 'core',
    carried: ['headphone_level', 'mic_level'],
    typicalSources: [
      'Headset microphones (mic path toward the device)',
      'Phones, tablets, laptops and portable recorders (playback path toward the headset)',
    ],
    typicalDestinations: [
      'Phone, tablet and laptop headset jacks',
      'Headsets combining stereo earphones and a microphone',
      'Streaming and broadcast adapters (equipment-dependent)',
    ],
    constructionNote:
      'Headset cables carry three signal conductors plus a common return in very fine gauges; there is no single standardized construction. The fine conductors and the strain relief are the usual failure points.',
    pinouts: [
      {
        id: 'ctia',
        application: 'CTIA/AHJ headset wiring — prevalent on recent devices',
        carried: ['headphone_level', 'mic_level'],
        contacts: [
          { label: 'Tip', role: 'Left channel', ink: 'signalPos' },
          { label: 'Ring 1', role: 'Right channel', ink: 'signalPos' },
          { label: 'Ring 2', role: 'Common / ground', ink: 'shield' },
          { label: 'Sleeve', role: 'Microphone', ink: 'signalPos', note: 'On many devices this contact also carries a small DC bias for the mic (equipment-dependent).' },
        ],
        confidence: 'convention',
        verifyAgainst:
          'The device documentation. CTIA/AHJ (mic on sleeve) is the prevalent modern order, but it is not universal — OMTP devices exist.',
      },
      {
        id: 'omtp',
        application: 'OMTP headset wiring — older and regional devices',
        carried: ['headphone_level', 'mic_level'],
        contacts: [
          { label: 'Tip', role: 'Left channel', ink: 'signalPos' },
          { label: 'Ring 1', role: 'Right channel', ink: 'signalPos' },
          { label: 'Ring 2', role: 'Microphone', ink: 'signalPos' },
          { label: 'Sleeve', role: 'Common / ground', ink: 'shield' },
        ],
        confidence: 'convention',
        verifyAgainst:
          'The device documentation. OMTP swaps the microphone and ground contacts relative to CTIA — the same plug fits both kinds of jack, so fit proves nothing.',
      },
    ],
    balanced: 'unbalanced',
    channels: 'varies',
    locking: {
      method: 'friction',
      howToConfirm: 'A light click into the jack’s spring detent; there is no lock.',
    },
    hotPlug: {
      policy: 'normally_fine',
      rationale:
        'Consumer headset jacks are designed for connection during operation and detect the plug on insertion. Keep playback level low when connecting headphones; when feeding a sound system from a headset jack, mute the destination channel first.',
    },
    advantages: [
      'Stereo audio plus a microphone through one compact plug',
      'Ubiquitous on phones, laptops and portable recorders',
    ],
    limitations: [
      'Two contact orders (CTIA and OMTP) exist — a headset can be incompatible with a jack it fits perfectly',
      'Small contacts and fine conductors are fragile',
      'Not intended for professional interconnect distances',
      'Adapters between TRRS and separate mic/headphone plugs must match the wiring scheme in use',
    ],
    commonMistakes: [
      'Assuming all headset plugs are wired alike — CTIA and OMTP both exist',
      'Blaming the headset when the real problem is a contact-order mismatch',
      'Extending a headset with a TRS-only extension cable and losing the microphone',
      'Presenting either scheme as “the standard” — neither is universal',
    ],
    notInterchangeableWith: [
      {
        otherId: 'trs_35',
        otherName: '3.5 mm TRS',
        why: 'A TRRS headset plug seats in a three-contact TRS jack, but the jack has no fourth contact for the microphone.',
        consequence:
          'Playback commonly works; the microphone is unavailable, and on some combinations audio is weak or one-sided because the ground lands on the wrong contact. No damage — a wiring mismatch.',
      },
      {
        otherName: 'CTIA-wired jack ↔ OMTP-wired headset (and vice versa)',
        why: 'The two schemes swap the microphone and ground contacts; the plugs are physically identical.',
        consequence:
          'Very quiet, hollow or distorted audio and a dead microphone. Passive crossover adapters exist. Annoying, not damaging.',
      },
    ],
    inspectionPoints: [
      'Bent shaft or worn insulator rings',
      'One earpiece or the microphone dropping out as the plug rotates',
      'Kinks or fraying near the plug',
      'Debris packed into the device jack — a common cause of a “broken” headset',
    ],
    basicTest:
      'Four contact paths, each straight through, none bridged. On adapters, a continuity map also reveals which scheme (CTIA or OMTP) the adapter implements — useful when the labeling is silent.',
    safety: {
      level: 'signal',
      cautions: [
        'Headset earphones sit directly on the ear — set the volume low before putting them on, then raise it.',
      ],
    },
    glossary: ['TRRS Connector', '3.5mm Connector'],
    relatedLessons: ['l03_analog', 'l04_same_plug'],
    sourceNotes: [
      'CTIA/AHJ order (tip L, ring 1 R, ring 2 ground, sleeve mic) vs OMTP order (ring 2 mic, sleeve ground): both deployed; CTIA prevalent on recent devices (CTIA AHJ specification; OMTP Local Connectivity specification) — VERIFIED 2026-08-15: Audio-Technica support',
      'Headset microphone contact commonly carries a small DC bias (“plug-in power”) from the host device: equipment-dependent, defined in IEC 61938 — VERIFIED 2026-08-15: Sound On Sound plug-in power glossary',
      'Mismatch symptoms (quiet/hollow audio, dead mic) follow from swapped ground/mic contacts — VERIFIED 2026-08-15: Audio-Technica support',
    ],
  },
  {
    id: 'rca',
    displayName: 'RCA (phono)',
    aliases: ['RCA', 'phono connector', 'cinch connector'],
    category: 'analog_audio',
    tier: 'core',
    carried: ['line_level', 'digital_audio'],
    typicalSources: [
      'Consumer players and media devices',
      'Mixer tape/record outputs',
      'DJ equipment outputs',
      'Turntables (traditionally phono level, requiring a phono stage — many current models have a built-in switchable preamp with a PHONO/LINE switch; check the switch and the manual before choosing the input)',
      'Coaxial S/PDIF digital outputs (75-ohm application)',
    ],
    typicalDestinations: [
      'Consumer amplifier and receiver inputs',
      'Mixer tape/aux inputs',
      'Powered speaker RCA inputs',
      'Coaxial S/PDIF digital inputs',
    ],
    construction: 'coax',
    constructionNote:
      'Analog RCA interconnects are coaxial in form — a center conductor inside a shield — but are not impedance-controlled. Coaxial S/PDIF digital requires genuine 75-ohm coaxial cable. Identical plugs, different cable specification: the connector does not certify the cable behind it.',
    pinouts: [
      {
        id: 'analog_line',
        application: 'Unbalanced analog audio — one channel per connector',
        carried: ['line_level'],
        contacts: [
          { label: 'Center', role: 'Signal', ink: 'signalPos' },
          { label: 'Shell', role: 'Return / shield', ink: 'shield' },
        ],
        confidence: 'convention',
        verifyAgainst:
          'Universal consumer-audio practice — center carries signal, shell carries the return. Channel identity comes from the color code (red = right, white or black = left) and the equipment labeling, not the connector.',
      },
      {
        id: 'spdif_coax',
        application: 'Coaxial S/PDIF digital audio — same shell, 75-ohm digital application',
        carried: ['digital_audio'],
        contacts: [
          { label: 'Center', role: 'Digital audio data', ink: 'dataA' },
          { label: 'Shell', role: 'Return / shield', ink: 'shield' },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'unbalanced',
    channels: 'mono',
    locking: {
      method: 'friction',
      howToConfirm: 'The shell’s spring grip should hold the plug snugly on the jack; a loose, wobbly fit means worn spring fingers.',
    },
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'On many RCA connections the center pin touches before the shell completes the return path, so a live connection buzzes loudly while the plug seats. Mute or turn down first.',
    },
    advantages: [
      'Simple, compact and inexpensive',
      'Universal on consumer and DJ equipment',
      'Color-coded pairs make stereo hookup quick',
    ],
    limitations: [
      'Unbalanced only — keep runs short',
      'No retention beyond the shell’s friction grip',
      'The center pin can make contact before the shell during insertion (loud buzz when live)',
      'The same connector serves analog audio, S/PDIF digital and legacy video — the shell does not identify the signal',
    ],
    commonMistakes: [
      'Grabbing any RCA cable for a coaxial digital connection because it fits',
      'Plugging a turntable into the wrong input for its output — phono-level output into a line input, or a line-switched turntable into a phono stage — instead of checking the PHONO/LINE switch',
      'Connecting and disconnecting live and accepting the buzz',
      'Judging a cable by its plug color — the color code is for humans; the construction is what matters',
    ],
    notInterchangeableWith: [
      {
        otherName: 'Coaxial S/PDIF digital connection (same RCA shell)',
        why: 'S/PDIF is specified as a 75-ohm digital interface; ordinary analog interconnects are not impedance-controlled.',
        consequence:
          'Short analog cables often appear to work; longer or marginal runs drop out or fail to lock. A reliability failure, not damage — use a true 75-ohm cable for digital.',
      },
      {
        otherName: 'Turntable phono output (same connectors, very different level)',
        why: 'A magnetic cartridge outputs millivolts with RIAA pre-emphasis; line level is far higher and flat.',
        consequence:
          'Phono into a line input is faint and thin; line into a phono input is grossly loud and distorted. A level and equalization mismatch, not damage — route through the correct phono stage.',
      },
    ],
    inspectionPoints: [
      'Loose or spread shell spring fingers (grip failure)',
      'Corroded center pin or shell',
      'Center pin pushed back into the plug body',
      'Jacket cracking where the cable meets the plug',
    ],
    basicTest:
      'Center→center and shell→shell continuity with no center↔shell short. A continuity test cannot show characteristic impedance — it cannot tell an ordinary analog interconnect from a 75-ohm digital cable.',
    safety: {
      level: 'signal',
      cautions: [
        'Connecting RCA cables with the system live often produces loud hum or buzz while the plug seats — mute first.',
      ],
    },
    glossary: ['Coaxial Cable'],
    relatedLessons: ['l03_analog', 'l04_same_plug', 'l06_digital', 'l08_selection'],
    sourceNotes: [
      'RCA analog use: center = signal, shell = return/shield — universal consumer-audio convention; no single governing standard for the analog assignment — VERIFIED 2026-08-15: Broadcasters’ Desktop Reference',
      'Coaxial S/PDIF: IEC 60958-3 consumer digital audio interface over an unbalanced 75-ohm coaxial connection, RCA connector customary — VERIFIED 2026-08-15: Rane Note 149',
      'Non-75-ohm cable on S/PDIF runs: impedance mismatch causes reflections; short runs often work, longer runs drop out or fail to lock — VERIFIED 2026-08-15: ShowMeCables impedance-mismatch engineering blog',
      'Turntable magnetic-cartridge outputs are millivolt-level with RIAA equalization applied in the phono stage — VERIFIED 2026-08-15: Elliott Sound Products RIAA phono preamp',
      'Stereo color code red = right, white/black = left: labeling convention — VERIFIED 2026-08-15: Broadcasters’ Desktop Reference',
      'Many current turntables include a built-in switchable phono preamp (PHONO/LINE switch) whose LINE position outputs line level: Audio-Technica AT-LP60X documentation — VERIFIED 2026-08-15',
    ],
  },
  {
    id: 'combo_xlr_trs',
    displayName: 'XLR/TRS combo receptacle',
    aliases: ['combo jack', 'combination XLR + 1/4-inch input', 'combi jack (informal)'],
    category: 'analog_audio',
    tier: 'core',
    carried: ['mic_level', 'line_level', 'instrument_level'],
    typicalSources: [
      'Microphones (XLR path)',
      'Instruments and line sources (1/4-inch path)',
      'DI box and wireless receiver outputs',
    ],
    typicalDestinations: [
      'Audio interface channel inputs',
      'Compact mixer channel inputs',
      'Powered loudspeaker input panels',
    ],
    constructionNote:
      'A panel receptacle has no cable of its own — the construction question belongs to whatever cable arrives. The XLR path conventionally receives shielded twisted-pair microphone cable; the 1/4-inch path receives balanced shielded or instrument cable. The receptacle accepting a plug says nothing about whether that cable suits the job.',
    pinouts: [
      {
        id: 'xlr_path',
        application: 'XLR path — balanced input, typically mic level (the equipment defines it)',
        carried: ['mic_level', 'line_level'],
        contacts: [
          { label: '1', role: 'Cable shield / reference', ink: 'shield' },
          { label: '2', role: 'Signal + (non-inverting, “hot”)', ink: 'signalPos' },
          { label: '3', role: 'Signal − (inverting, “cold”)', ink: 'signalNeg' },
        ],
        confidence: 'standard',
        verifyAgainst:
          'Pin roles follow the XLR standard; what the path expects (gain range, pad, phantom routing) is defined by the host equipment’s documentation.',
      },
      {
        id: 'trs_path',
        application: '1/4-inch TRS path — balanced line or instrument input (the equipment defines which)',
        carried: ['line_level', 'instrument_level'],
        contacts: [
          { label: 'Tip', role: 'Signal + (non-inverting)', ink: 'signalPos' },
          { label: 'Ring', role: 'Signal − (inverting)', ink: 'signalNeg', note: 'A TS plug grounds this contact — the connection then runs unbalanced.' },
          { label: 'Sleeve', role: 'Shield / reference', ink: 'shield' },
        ],
        confidence: 'standard',
        verifyAgainst:
          'Contact roles follow the balanced TRS convention; whether the path is line-only, instrument-switchable, or padded is defined by the host equipment’s documentation.',
      },
    ],
    balanced: 'either',
    channels: 'mono',
    locking: {
      method: 'latch',
      howToConfirm:
        'On latching models an inserted XLR clicks in and will not pull free without pressing the release tab. Many combo receptacles — including those on common compact interfaces — have no XLR latch, and the 1/4-inch path is always friction-only. Check the one in front of you.',
    },
    directionality:
      'A combo receptacle is an input on equipment: the center accepts a male XLR and the surrounding bore accepts a 1/4-inch plug. One receptacle, two electrical paths — the host equipment defines what each path expects.',
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'Both paths pop when connected live, and the XLR pins may carry phantom power. Mute the channel first, and switch phantom off before connecting equipment that should not receive it.',
    },
    advantages: [
      'One panel hole accepts both XLR and 1/4-inch sources',
      'Saves space on compact interfaces and mixers',
      'Lets one channel serve mic, line and instrument sources — as the equipment defines',
    ],
    limitations: [
      'The receptacle cannot tell you what each path expects — gain, impedance and phantom routing are equipment-defined',
      'The 1/4-inch path has no latch',
      'The convenient fit invites patching before reading the manual',
    ],
    commonMistakes: [
      'Assuming the XLR and 1/4-inch paths are electrically identical',
      'Sending a line-level source into the mic-gain path and wondering about the distortion',
      'Expecting phantom power on the 1/4-inch path',
      'Patching by fit alone without checking what the channel expects',
    ],
    notInterchangeableWith: [
      {
        otherName: 'Mic path vs line/instrument path within the same receptacle',
        why: 'The two paths usually feed different input stages with different gain and impedance; the equipment documentation defines which path expects what.',
        consequence:
          'A line source forced into the mic-gain path distorts; an instrument into a line-only path sounds weak and dull. The wrong input stage — a signal problem, not damage.',
      },
      {
        otherId: 'ts_speaker_legacy',
        otherName: 'Amplifier speaker output on a 1/4-inch TS cable',
        why: 'A speaker cable with a TS plug physically fits the combo’s 1/4-inch path, but speaker-level signals are far above what an input expects.',
        consequence:
          'Speaker-level voltage into a mic/line input can overdrive and damage the input circuitry — a genuine equipment-damage risk. Never patch amplifier outputs into inputs.',
      },
    ],
    inspectionPoints: [
      'Bent or recessed contacts in either path (inspect with the equipment de-energized)',
      'Cracked receptacle body or loose panel mounting',
      'An XLR latch that no longer holds, on latching models',
      'Debris in the 1/4-inch bore',
    ],
    basicTest:
      'The receptacle is checked visually and by exercising it with a known-good cable while de-energized: a bent or recessed contact shows as a missing connection on the corresponding pin. The mating cables are tested as their own connector types.',
    safety: {
      level: 'signal',
      cautions: [
        'Phantom power may be present on the XLR pins. Switch it off before connecting equipment that should not receive it.',
        'Never patch an amplifier speaker output into a combo input — speaker-level voltage can damage input circuitry.',
      ],
    },
    glossary: ['XLR Cable', 'XLRF', 'XLRM', 'TRS Connector (Tip-Ring-Sleeve)', 'Balanced signaling'],
    relatedLessons: ['l03_analog', 'l04_same_plug', 'l08_selection'],
    sourceNotes: [
      'Combination receptacle geometry (XLR contacts in the center, 1/4-inch jack in the surrounding bore): widely produced connector type; “combo” used generically — VERIFIED 2026-08-15: Neutrik NCJ6FI-S product page',
      'XLR path pin roles 1 shield / 2 + / 3 −: AES14-1992 / IEC 60268-12 convention — VERIFIED 2026-08-15: AES14-1992 (s2019)',
      'TRS path tip +/ring −/sleeve shield balanced convention; what each path expects (mic/line/instrument, pad, phantom routing) is equipment-defined — VERIFIED 2026-08-15: Focusrite Scarlett user guides',
      'Phantom power conventionally applied to the XLR pins only, not the TRS path: common design practice, equipment-dependent — VERIFIED 2026-08-15: Focusrite Scarlett user guides',
      'Speaker-level output patched into a mic/line input can overdrive and damage input circuitry — VERIFIED 2026-08-15: Focusrite (mic/line/instrument level differences)',
      'Latchless combo receptacles are widespread (including on common compact interfaces) while latching combo models also exist: Neutrik NCJ6FI-S / Amphenol combo series — VERIFIED 2026-08-15',
    ],
  },
];
