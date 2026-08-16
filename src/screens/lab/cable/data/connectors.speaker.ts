/**
 * connectors.speaker — core loudspeaker connector records for the Cable &
 * Connector Fundamentals Lab (owner spec 2026-08-15 §5.5/§7).
 *
 * SAFETY-CRITICAL CONTENT (owner mandate 2026-08-15): every claim in this file
 * is subject to the B2 fact-verification protocol
 * (docs/APE_CABLE_LAB_PLAN_2026_08_15.md §9). sourceNotes carry the governing
 * standard or manufacturer specification per claim group; claims that vary by
 * equipment are marked `equipment-dependent` and taught as "verify from the
 * documentation." Consequences are technically proportionate — never
 * dramatized (§5.4).
 *
 * FAMILY PRINCIPLES taught across these six records:
 *  - speakON-style connectors are LOUDSPEAKER connectors, never AC mains — the
 *    twist-lock resemblance to power connectors is a look-alike, not a kinship.
 *  - Loudspeaker cable is two or more HEAVIER UNSHIELDED conductors sized for
 *    current, run length and load — not shielded small-conductor instrument
 *    cable. The connector never enforces the cable behind it.
 *  - A line-level feed to a POWERED loudspeaker and an amplifier output to a
 *    PASSIVE loudspeaker are different connections and are not interchangeable.
 *  - Exposed-conductor terminations (binding post, banana, bare wire) can
 *    present hazardous voltages from high-power amplifiers, and stray strands
 *    invite short circuits — power down and confirm silence before handling.
 *  - Default hot-connection teaching: power down or mute before making or
 *    breaking a loudspeaker connection; no speakON-style connector is rated to
 *    break a driven load (UL/CSA marking "NOT FOR INTERRUPTING CURRENT").
 *
 * VOICE: concise, professional, misconception-correcting. No real brands or
 * model likenesses in rendered copy; standard connector names (speakON…) are
 * used nominatively. The xlr3 record in connectors.analog.ts is the
 * calibration exemplar for depth and voice.
 */
import type { ConnectorRecord } from '../cableTypes';

export const CONNECTORS_SPEAKER: ConnectorRecord[] = [
  {
    id: 'speakon_nl2',
    displayName: 'speakON-style 2-pole (NL2 type)',
    aliases: ['speakON', 'NL2', '2-pole speaker twist-lock', 'speaker connector (informal)'],
    category: 'loudspeaker',
    tier: 'core',
    carried: ['speaker_level'],
    typicalSources: [
      'Power amplifier outputs',
      'Powered mixer loudspeaker outputs',
      'Amplifier rack panel outputs',
    ],
    typicalDestinations: [
      'Passive loudspeaker inputs',
      'Passive stage monitor inputs',
      'Loudspeaker patch and breakout panels',
    ],
    construction: 'speaker_2c',
    constructionNote:
      'Loudspeaker cable is two heavier unshielded conductors, sized for the current, the run length, and the load — not shielded small-conductor instrument or microphone cable. The connector does not enforce this: a speakON-style shell can be wrongly fitted to the wrong cable, so the cable itself must be verified, not assumed from the plug.',
    pinouts: [
      {
        id: 'speaker_1ch',
        application: 'Single loudspeaker (one amplifier channel)',
        carried: ['speaker_level'],
        contacts: [
          {
            label: '1+',
            role: 'Loudspeaker + (amplifier output +)',
            ink: 'speakerPos',
            note: 'The contact designations 1+ / 1− are molded into the connector itself.',
          },
          { label: '1−', role: 'Loudspeaker − (amplifier output − — on bridged or floating outputs this terminal is also driven)', ink: 'speakerNeg' },
        ],
        confidence: 'convention',
        verifyAgainst:
          'Amplifier and loudspeaker documentation. The 1+/1− contact designations are the connector manufacturer’s specification; wiring amplifier + to 1+ is the universal practice those documents state.',
      },
    ],
    balanced: 'n/a',
    channels: 'mono',
    locking: {
      method: 'twist_lock',
      howToConfirm:
        'Insert fully, then twist the body clockwise until it stops with a positive click. Confirm the lock: a firm tug should not pull it straight out, and a gentle counter-twist should not rotate it back without operating the release. Make this check with the line muted or powered down — the same state you connected it in. If the latch never engaged, the tug becomes a live disconnection.',
    },
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'Stop the signal — mute or power down the amplifier — before connecting or disconnecting. Breaking a driven loudspeaker line can arc across the contacts as they separate. Neutrik’s own speakON instructions carry the UL/CSA caution “NOT FOR INTERRUPTING CURRENT” — treat no speakON-style connector as rated to break a driven load.',
    },
    advantages: [
      'Positive twist-lock — will not pull out by accident',
      'Contacts are enclosed and touch-protected, unlike open speaker terminals',
      'Designed for high-current loudspeaker use (see the specific model’s rating)',
      'Cannot be mistaken for, or plugged into, microphone or line inputs — a different shell entirely',
    ],
    limitations: [
      'One circuit only — a 2-pole connector cannot carry a bi-amplified feed',
      'Requires matching chassis connectors; not found on most home and instrument gear',
      'Carries amplifier output only — it is not how a line-level feed reaches a powered loudspeaker',
    ],
    commonMistakes: [
      'Treating any twist-lock connector as the same thing — loudspeaker twist-locks and AC power twist-locks are unrelated jobs',
      'Confusing the two kinds of “speaker connection”: a line-level feed to a POWERED loudspeaker (typically XLR) and an amplifier output to a PASSIVE loudspeaker are different connections. An amplifier output driven into a line-level input risks damaging that input; a line-level signal into a passive loudspeaker produces almost nothing.',
      'Building a loudspeaker lead from shielded instrument cable because the connector fits over it',
      'Inserting without completing the twist — an unlatched connector can work loose under vibration',
    ],
    notInterchangeableWith: [
      {
        otherId: 'powercon_xx',
        otherName: 'powerCON-family AC power connector',
        why: 'Similar-looking twist-lock shells; one carries loudspeaker output, the other carries AC mains.',
        consequence:
          'speakON-family and powerCON-family connectors are keyed differently and are not intended to mate — but never let fit be the test. Read the connector markings and the cable label before connecting: one carries loudspeaker output, the other AC mains. Loudspeaker and mains connections are never interchangeable, and no adapter between them is ever acceptable.',
      },
      {
        otherId: 'speakon_nl4',
        otherName: '4-pole speakON-style connector',
        why: '2-pole cable connectors can mate with 4-pole chassis connectors, engaging circuit 1 only.',
        consequence:
          'On a line that uses circuit 2 (bi-amp or dual-channel), everything wired to 2+/2− is simply absent — missing output. But if the cabinet is switched to bi-amp mode, circuit 1 feeds one driver section directly with no crossover in the way, and a full-range feed onto a high-frequency section can damage it. Fitting is not proof the whole connection is made — or that the right band reaches the right section. Verify the cabinet’s mode and circuit assignments.',
      },
    ],
    inspectionPoints: [
      'Cracked or heat-discolored shell (discoloration near contacts suggests arcing or a high-resistance joint)',
      'Twist action that no longer clicks or locks positively',
      'Loose or backed-out terminal screws inside the connector',
      'Strain relief that lets the jacket slip or twist at the boot',
    ],
    basicTest:
      'With the lead disconnected at both ends, a continuity tester shows 1+→1+ and 1−→1− straight through with no bridge between the two contacts. A cable that passes with + and − swapped still makes sound but inverts polarity — combined with correctly wired loudspeakers, the result is thin, weakened low end. Flag and correct it.',
    safety: {
      level: 'speaker',
      cautions: [
        'speakON-style connectors carry loudspeaker output only. Never present, adapt, or wire one as an AC mains connector — the resemblance to twist-lock power connectors is a look-alike, not an equivalence.',
        'High-power amplifier outputs can exceed voltage levels generally considered safe to touch. The enclosed contact design keeps them covered — one reason locking loudspeaker connectors displaced exposed terminals in high-power systems.',
        'Power down or mute before making or breaking the connection; separating a driven loudspeaker line can arc across the contacts.',
      ],
    },
    glossary: ['Speakon'],
    relatedLessons: ['l05_loudspeaker', 'l02_anatomy', 'l09_handling'],
    sourceNotes: [
      'Contact designations 1+/1− and insert-then-twist locking action: Neutrik speakON NL2 series documentation — VERIFIED 2026-08-15: Neutrik speakON Product Guide',
      '2-pole cable connectors mate with 4-pole chassis connectors, engaging circuit 1 only: Neutrik speakON compatibility documentation — VERIFIED 2026-08-15: Neutrik NL2FXX-W-S product page',
      'speakON and powerCON are differently keyed families; cross-family non-mating asserted by trade sources, no explicit Neutrik guarantee located — teach label-first, fit-never — EXPERT REVIEW PENDING',
      'speakON not rated to interrupt current: Neutrik BDA 114 assembly instruction (NL4FX/NL4FRX), UL/CSA marking "CAUTION: NOT FOR INTERRUPTING CURRENT" — VERIFIED 2026-08-15',
      'High-power amplifier outputs can exceed commonly accepted touch-voltage limits: IEC touch-voltage guidance (e.g. IEC 61201) applied to amplifier output voltage at rated power — VERIFIED 2026-08-15: IEC TS 61201',
      'Speaker-level output into a line-level input risks damage to the input stage: level-structure teaching, cross-checked against amplifier/console documentation — VERIFIED 2026-08-15: epanorama.net engineering note',
      'Full-range feed into a bi-amp-mode cabinet can damage the high-frequency section (a 2-pole lead engages circuit 1 only, which may be the HF section): compression drivers require high-pass protection — EXPERT REVIEW PENDING',
      'Continuity testing only with the lead disconnected at both ends (never on an energized circuit): Fluke continuity testing guidance — VERIFIED 2026-08-15',
      'Bridged and floating amplifier outputs drive both terminals; never treat − as ground or ground a speaker output terminal: amplifier manual bridge-mode warnings — EXPERT REVIEW PENDING',
    ],
  },

  {
    id: 'speakon_nl4',
    displayName: 'speakON-style 4-pole (NL4 type)',
    aliases: ['speakON', 'NL4', '4-pole speaker twist-lock'],
    category: 'loudspeaker',
    tier: 'core',
    carried: ['speaker_level'],
    typicalSources: [
      'Power amplifier outputs (single and dual channel)',
      'Amplifier rack and processor-amplifier system outputs',
      'Loudspeaker patch panels',
    ],
    typicalDestinations: [
      'Passive full-range loudspeaker inputs',
      'Bi-amplified passive loudspeaker inputs',
      'Passive subwoofer inputs and through connections',
    ],
    construction: 'speaker_2c',
    constructionNote:
      'Behind a 4-pole connector may be two-conductor or four-conductor loudspeaker cable — heavier unshielded conductors sized for current, length, and load. A 4-pole shell on 2-conductor cable serves circuit 1 only; the shell does not reveal how many conductors are actually wired. Verify the cable, not the plug.',
    pinouts: [
      {
        id: 'full_range_1ch',
        application: 'Full-range loudspeaker on circuit 1',
        carried: ['speaker_level'],
        contacts: [
          { label: '1+', role: 'Loudspeaker + (amplifier output +)', ink: 'speakerPos' },
          { label: '1−', role: 'Loudspeaker − (amplifier output − — on bridged or floating outputs this terminal is also driven)', ink: 'speakerNeg' },
          {
            label: '2+',
            role: 'Unused in this application',
            ink: 'speakerPos',
            note: 'May be unconnected or passed through for linking, per the loudspeaker documentation.',
          },
          {
            label: '2−',
            role: 'Unused in this application',
            ink: 'speakerNeg',
            note: 'May be unconnected or passed through for linking, per the loudspeaker documentation.',
          },
        ],
        confidence: 'convention',
        verifyAgainst:
          'The loudspeaker and amplifier documentation. Full-range use on 1+/1− is the widespread practice, but what a given cabinet does with circuit 2 (nothing, or a pass-through) is stated only in its documentation.',
      },
      {
        id: 'biamp_2ch',
        application: 'Bi-amplified loudspeaker (two amplifier channels in one cable)',
        carried: ['speaker_level'],
        contacts: [
          {
            label: '1+',
            role: 'Circuit 1 + (often the low-frequency section — verify)',
            ink: 'speakerPos',
          },
          { label: '1−', role: 'Circuit 1 −', ink: 'speakerNeg' },
          {
            label: '2+',
            role: 'Circuit 2 + (often the high-frequency section — verify)',
            ink: 'speakerPos',
          },
          { label: '2−', role: 'Circuit 2 −', ink: 'speakerNeg' },
        ],
        confidence: 'equipment-dependent',
        verifyAgainst:
          'The loudspeaker documentation. Which section sits on which circuit is a design decision that varies by model and system — assignments beyond 1+/1− must be read, never assumed.',
      },
    ],
    balanced: 'n/a',
    channels: 'varies',
    locking: {
      method: 'twist_lock',
      howToConfirm:
        'Insert fully, then twist the body clockwise until it stops with a positive click. Confirm the lock: a firm tug should not pull it straight out, and a gentle counter-twist should not rotate it back without operating the release. Make this check with the line muted or powered down — the same state you connected it in. If the latch never engaged, the tug becomes a live disconnection.',
    },
    directionality:
      'Cable-end connectors mate with chassis sockets, not with each other — extending a run takes a coupler made for the purpose. The amplifier end and the loudspeaker end of a lead use the same cable connector, so labeling the lead is what tells you what it was built for.',
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'Stop the signal — mute or power down the amplifier — before connecting or disconnecting. Breaking a driven loudspeaker line can arc across the contacts as they separate. Neutrik’s own speakON instructions carry the UL/CSA caution “NOT FOR INTERRUPTING CURRENT” — treat no speakON-style connector as rated to break a driven load.',
    },
    advantages: [
      'Positive twist-lock with enclosed, touch-protected contacts',
      'Two circuits in one cable — a bi-amplified cabinet needs only one lead',
      'Widely fitted on professional amplifiers and loudspeakers',
      'Accepts 2-pole cable connectors on circuit 1, so single-circuit leads still connect',
    ],
    limitations: [
      'Circuit assignments beyond 1+/1− vary by loudspeaker — the connector cannot tell you what 2+/2− feed',
      'A 4-pole lead wired only on circuit 1 looks identical from outside to a fully wired one',
      'Carries amplifier output only — not a substitute for the line-level connection to a powered loudspeaker',
    ],
    commonMistakes: [
      'Assuming 2+/2− assignments (or assuming they are wired at all) without reading the loudspeaker documentation',
      'Sending a bi-amplified feed into a full-range cabinet, or a full-range feed into a bi-amp cabinet set to bi-amp mode — sections go missing or receive the wrong band',
      'Treating loudspeaker twist-locks and power twist-locks as one family because both twist',
      'Building a loudspeaker lead from shielded instrument or microphone multicore because the connector fits',
    ],
    notInterchangeableWith: [
      {
        otherId: 'powercon_xx',
        otherName: 'powerCON-family AC power connector',
        why: 'Similar-looking twist-lock shells; one carries loudspeaker output, the other carries AC mains.',
        consequence:
          'speakON-family and powerCON-family connectors are keyed differently and are not intended to mate — but never let fit be the test. Read the connector markings and the cable label before connecting: one carries loudspeaker output, the other AC mains. Loudspeaker and mains connections are never interchangeable, and no adapter between them is ever acceptable.',
      },
      {
        otherId: 'speakon_nl8',
        otherName: '8-pole speakON-style connector',
        why: 'Same connector family, but a larger shell carrying eight contacts for multi-way systems.',
        consequence:
          'The shells do not mate, so the risk is stocking or patching the wrong lead — a show-stopping inconvenience, not equipment damage.',
      },
    ],
    inspectionPoints: [
      'Cracked or heat-discolored shell (discoloration near contacts suggests arcing or a high-resistance joint)',
      'Twist action that no longer clicks or locks positively',
      'Loose terminal screws or conductors pulled back inside the shell — especially on circuit 2, which fails silently in full-range use',
      'Strain relief that lets the jacket slip or twist at the boot',
    ],
    basicTest:
      'With the lead disconnected at both ends, a continuity tester shows 1+→1+, 1−→1−, 2+→2+, 2−→2− with no bridging between any contacts. Test all four even on a lead used full-range — a fault on circuit 2 hides until the lead meets a bi-amplified cabinet. A swap between + and − on a circuit inverts polarity: audible as thin, weakened low end alongside correctly wired boxes.',
    safety: {
      level: 'speaker',
      cautions: [
        'speakON-style connectors carry loudspeaker output only. Never present, adapt, or wire one as an AC mains connector — the twist-lock resemblance to power connectors is a look-alike, not an equivalence.',
        'High-power amplifier outputs can exceed voltage levels generally considered safe to touch; the enclosed contact design is part of why this connector family exists.',
        'Power down or mute before making or breaking the connection; separating a driven loudspeaker line can arc across the contacts.',
      ],
    },
    glossary: ['Speakon'],
    relatedLessons: ['l05_loudspeaker', 'l08_selection', 'l09_handling'],
    sourceNotes: [
      'Contact designations 1+/1−/2+/2−: Neutrik speakON NL4 series documentation — VERIFIED 2026-08-15: Neutrik speakON Product Guide',
      'Bi-amp circuit-to-section assignment varies by loudspeaker model; no governing standard assigns LF/HF to circuits: loudspeaker manufacturer documentation (equipment-dependent) — VERIFIED 2026-08-15: Neutrik speakON Product Guide p.16 (Wiring Suggestion only)',
      '2-pole cable connectors mate with 4-pole chassis connectors on circuit 1: Neutrik speakON compatibility documentation — VERIFIED 2026-08-15: Neutrik NL2FXX-W-S product page',
      '8-pole shell is a larger size and does not mate with 4-pole: Neutrik speakON NL8 documentation — VERIFIED 2026-08-15: Neutrik speakON Product Guide (NL8FC)',
      'speakON and powerCON are differently keyed families; cross-family non-mating asserted by trade sources, no explicit Neutrik guarantee located — teach label-first, fit-never — EXPERT REVIEW PENDING',
      'Cable connectors require a purpose-made coupler to join lead-to-lead: Neutrik speakON accessory documentation — VERIFIED 2026-08-15: Neutrik NL4MMX product page',
      'speakON not rated to interrupt current: Neutrik BDA 114 assembly instruction (NL4FX/NL4FRX), UL/CSA marking "CAUTION: NOT FOR INTERRUPTING CURRENT" — VERIFIED 2026-08-15',
      'Continuity testing only with the lead disconnected at both ends (never on an energized circuit): Fluke continuity testing guidance — VERIFIED 2026-08-15',
      'Bridged and floating amplifier outputs drive both terminals; never treat − as ground or ground a speaker output terminal: amplifier manual bridge-mode warnings — EXPERT REVIEW PENDING',
    ],
  },

  {
    id: 'binding_post',
    displayName: 'Binding post',
    aliases: ['Five-way binding post', 'Speaker terminal post', 'Terminal post'],
    category: 'loudspeaker',
    tier: 'core',
    carried: ['speaker_level'],
    typicalSources: [
      'Hi-fi and studio power amplifier outputs',
      'AV receiver loudspeaker outputs',
      'Amplifier zones in fixed installations',
    ],
    typicalDestinations: [
      'Passive hi-fi and monitor loudspeaker inputs',
      'Loudspeaker wall plates in installations',
      'Also found on test equipment and bench power supplies — a different job behind the same terminal',
    ],
    construction: 'speaker_2c',
    constructionNote:
      'Fed by two heavier unshielded conductors sized for current, length, and load. Binding posts accept bare wire, spade lugs, and banana plugs — that versatility is exactly why the cable and the equipment behind the posts must be verified rather than assumed from the terminal.',
    pinouts: [
      {
        id: 'speaker_pair',
        application: 'Loudspeaker connection (one pair of posts = one channel)',
        carried: ['speaker_level'],
        contacts: [
          {
            label: 'Red (+)',
            role: 'Loudspeaker +',
            ink: 'speakerPos',
            note: 'Red = + is a widespread convention, not a law — confirm against the equipment marking.',
          },
          { label: 'Black (−)', role: 'Loudspeaker − (amplifier output − — on bridged or floating outputs this terminal is also driven)', ink: 'speakerNeg' },
        ],
        confidence: 'convention',
        verifyAgainst: 'The terminal markings on the amplifier and the loudspeaker at both ends of the run.',
      },
    ],
    balanced: 'n/a',
    channels: 'mono',
    locking: {
      method: 'screw',
      howToConfirm:
        'After tightening the post, a gentle tug on the wire should not move it, and no strands should be visible outside the clamped area.',
    },
    hotPlug: {
      policy: 'de_energize_first',
      rationale:
        'Binding posts expose live conductor while being handled. Power the amplifier down and wait for the output to fall silent before connecting, disconnecting, or dressing wires: a high-power output can be hazardous to touch, and one slipped strand across the posts short-circuits the output.',
    },
    advantages: [
      'Accepts multiple terminations — bare wire, spade lugs, banana plugs',
      'Screw clamping gives a solid, low-resistance joint when tightened properly',
      'Ubiquitous on hi-fi amplifiers and passive loudspeakers',
      'Color and +/− markings at the terminal make polarity checkable at a glance',
    ],
    limitations: [
      'Exposed conductors — no touch protection and no locking shell',
      'Slower to connect than any plug-in connector; unsuitable for fast stage turnarounds',
      'The identical terminal appears on non-loudspeaker equipment, so the post itself identifies nothing',
      'Clamping force loosens over time and with vibration — joints need periodic re-checking',
    ],
    commonMistakes: [
      'Leaving stray strands outside the clamp, where they can bridge to the neighboring post',
      'Clamping the insulation instead of bare copper — a joint that looks made but conducts poorly or not at all',
      'Connecting a line-level output to a passive loudspeaker’s posts and expecting full volume — a passive loudspeaker needs an amplifier output',
      'Assuming red = + without checking the marking at both ends of the run',
    ],
    notInterchangeableWith: [
      {
        otherName: 'Binding posts on test equipment and bench power supplies',
        why: 'The identical terminal appears on equipment carrying DC power or measurement signals.',
        consequence:
          'A loudspeaker cable fits either. Landing a loudspeaker on a bench supply output, or an amplifier output on measurement inputs, risks equipment damage — the terminal tells you nothing about what is behind it.',
      },
    ],
    inspectionPoints: [
      'Posts that no longer tighten firmly or have stripped threads',
      'Oxidized (dull, darkened) copper at the clamp — a resistance and reliability problem',
      'Stray strands escaping the clamped area',
      'Cracked post bodies or insulating collars',
    ],
    basicTest:
      'With the run disconnected at both ends, a continuity tester shows each conductor straight through, no continuity between the two conductors, and the marked (+) conductor landing on the + terminal at both ends. A swap at one end inverts polarity — audible as thin, weakened low end alongside correctly wired loudspeakers.',
    safety: {
      level: 'speaker',
      cautions: [
        'The output of a high-power amplifier can exceed voltage levels generally considered safe to touch. Treat exposed loudspeaker terminations on an energized system as live conductors — power down, and confirm the system has actually gone silent, before handling.',
        'A single stray strand bridging + and − short-circuits the amplifier output; the honest outcome ranges from protective shutdown to amplifier damage, depending on the design. Trim and secure strands so none escape the clamp.',
        'Do not assume the black (−) terminal is ground. On bridged and many floating-output amplifiers both terminals are driven — treat both as live, and never connect either speaker output terminal to ground.',
      ],
    },
    glossary: ['Banana Plug'],
    relatedLessons: ['l05_loudspeaker', 'l02_anatomy', 'l09_handling'],
    sourceNotes: [
      'Red = + / black = − loudspeaker terminal coloring: industry convention, no single governing standard — VERIFIED 2026-08-15: Pomona binding post catalog (convention held, no governing standard)',
      'High-power amplifier outputs can exceed commonly accepted touch-voltage limits: IEC touch-voltage guidance (e.g. IEC 61201) applied to amplifier output voltage at rated power — VERIFIED 2026-08-15: IEC TS 61201',
      'Shorted output consequence (protective shutdown vs damage) is amplifier-design-dependent: amplifier documentation — VERIFIED 2026-08-15: QSC Series One owner’s manual (Output Averaging short-circuit protection)',
      'Five-way binding post accepts bare wire, spades, and banana plugs: terminal manufacturer documentation — VERIFIED 2026-08-15: Pomona binding post catalog',
      'Bridged and floating amplifier outputs drive both terminals; never treat − as ground or ground a speaker output terminal: amplifier manual bridge-mode warnings — EXPERT REVIEW PENDING',
      'Amplifier outputs can remain driven briefly after power-off (stored energy); confirm silence before handling: verify-de-energized practice (NFPA 70E principle) — EXPERT REVIEW PENDING',
    ],
  },

  {
    id: 'banana',
    displayName: 'Banana plug',
    aliases: ['4 mm plug', 'Dual banana (paired form)', 'Banana connector'],
    category: 'loudspeaker',
    tier: 'core',
    carried: ['speaker_level'],
    typicalSources: [
      'Loudspeaker leads terminated for amplifiers with binding posts',
      'Amplifier outputs fitted with binding posts',
    ],
    typicalDestinations: [
      'Binding posts on passive loudspeakers',
      'Binding posts on amplifiers and receivers',
      'Also common on test-equipment leads — a different job for the same plug',
    ],
    construction: 'speaker_2c',
    constructionNote:
      'In loudspeaker use, banana plugs terminate two heavier unshielded conductors sized for current, length, and load. The same plug terminates test leads carrying entirely different signals and voltages — the plug never identifies the circuit.',
    pinouts: [
      {
        id: 'speaker_pair',
        application: 'Loudspeaker connection (pair of plugs, one channel)',
        carried: ['speaker_level'],
        contacts: [
          { label: '+ plug', role: 'Loudspeaker +', ink: 'speakerPos' },
          {
            label: '− plug',
            role: 'Loudspeaker −',
            ink: 'speakerNeg',
            note: 'On molded dual-banana bodies, a tab or ridge marks one leg. The marking only helps if the lead was wired to it — check, do not trust the molding alone.',
          },
        ],
        confidence: 'convention',
        verifyAgainst:
          'The wiring at both ends of the lead and the terminal markings. A single banana plug carries no polarity identity of its own.',
      },
    ],
    balanced: 'n/a',
    channels: 'mono',
    locking: {
      method: 'friction',
    },
    hotPlug: {
      policy: 'de_energize_first',
      rationale:
        'A banana plug exposes bare metal while partially inserted, and the mating binding posts are themselves exposed. Power the amplifier down and wait for the output to fall silent before connecting or disconnecting — a high-power output can be hazardous to touch, and a dangling live plug can bridge terminals.',
    },
    advantages: [
      'Fast, tool-free insertion into binding posts',
      'Neater and more repeatable than dressing bare wire under a post',
      'Dual-plug molded bodies keep the pair together at a standard spacing',
      'Spring-leaf contact gives good contact area when the plug is in good condition',
    ],
    limitations: [
      'Friction fit only — pulls free under modest tension, with no lock to confirm',
      'No polarity enforcement: the two plugs of a pair are physically identical',
      'Bare pin is exposed during insertion and removal',
      'The same plug family serves test equipment at other voltages — the plug identifies nothing',
    ],
    commonMistakes: [
      'Trusting the molded ridge or tab on a dual banana as polarity truth without checking how the lead was actually wired',
      'Leaving a live, unplugged banana lead dangling where its bare pins can touch chassis or bridge terminals',
      'Assuming a plug that fits a socket belongs in it — banana pins physically enter openings they were never meant for',
      'Relying on a worn, loose plug — spread or collapsed spring leaves make an intermittent joint',
    ],
    notInterchangeableWith: [
      {
        otherName: 'Mains receptacle openings a banana pin can physically enter',
        why: 'A bare 4 mm-class pin fits round openings it was never designed for; in some regions that includes mains receptacles.',
        consequence:
          'Contact with an energized mains receptacle is an electrical danger. Never insert a banana plug into anything except the terminal its lead was wired for — fitting is not permission.',
      },
      {
        otherName: 'Banana test leads on measurement equipment',
        why: 'The identical plug terminates leads for meters and bench supplies carrying different signals and voltages.',
        consequence:
          'Swapping loudspeaker and test leads connects the wrong circuit to the wrong equipment — outcomes range from no result to equipment damage, and the plug gives no warning.',
      },
    ],
    inspectionPoints: [
      'Spread, collapsed, or fatigued spring leaves — the plug slides in loose or falls out',
      'Oxidized or darkened contact surfaces',
      'Insulation pulled back from the plug body, exposing conductor',
      'Set screws or solder joints inside the plug working loose',
    ],
    basicTest:
      'With the lead disconnected at both ends, a continuity tester shows each conductor straight through, no continuity between the pair, and the marked plug landing on + at both ends. Wiggle the plugs during the test — a loose spring leaf shows up as flickering continuity.',
    safety: {
      level: 'speaker',
      cautions: [
        'The output of a high-power amplifier can exceed voltage levels generally considered safe to touch. Treat exposed loudspeaker terminations on an energized system as live conductors — power down, and confirm the system has actually gone silent, before handling.',
        'A banana pin can physically enter openings it was never meant for, including some mains receptacles depending on region. Physical fit is never proof of electrical correctness — this is the sharpest example in the lab.',
      ],
    },
    glossary: ['Banana Plug'],
    relatedLessons: ['l05_loudspeaker', 'l04_same_plug', 'l09_handling'],
    sourceNotes: [
      'Dual banana nominal pin spacing 19 mm (0.75 in): long-standing test-equipment convention — VERIFIED 2026-08-15: Pomona banana plugs & jacks catalog',
      '4 mm banana pins can physically enter some mains receptacles (region-dependent); shrouded/sheathed designs exist for this reason: test-lead safety design guidance (IEC 61010 lead requirements) — VERIFIED 2026-08-15: IEC/EN 61010-031 shrouded-lead requirements',
      'Tab/ridge marking on one leg of molded dual-banana bodies denotes the ground/− side by convention: test-equipment convention — VERIFIED 2026-08-15: test-equipment vendor documentation (Pomona MDP family)',
      'High-power amplifier outputs can exceed commonly accepted touch-voltage limits: IEC touch-voltage guidance (e.g. IEC 61201) — VERIFIED 2026-08-15: IEC TS 61201',
      'Amplifier outputs can remain driven briefly after power-off (stored energy); confirm silence before handling: verify-de-energized practice (NFPA 70E principle) — EXPERT REVIEW PENDING',
    ],
  },

  {
    id: 'bare_wire',
    displayName: 'Bare-wire termination',
    aliases: ['Stripped wire', 'Direct wire connection', 'Zip-cord termination (informal)'],
    category: 'loudspeaker',
    tier: 'core',
    carried: ['speaker_level'],
    typicalSources: [
      'Amplifier outputs with binding posts, spring clips, or barrier strips',
      'Installation amplifier terminal blocks',
    ],
    typicalDestinations: [
      'Loudspeaker spring clips and binding posts',
      'Barrier strips and terminal blocks in fixed installations',
      'Distributed-line loudspeaker taps in installed systems (higher-voltage lines — see cautions)',
    ],
    construction: 'speaker_2c',
    constructionNote:
      'This is the loudspeaker cable itself with no connector at all: two heavier unshielded conductors sized for current, run length, and load. With no connector to (mis)read, every scrap of identity comes from the cable marking and the terminal labels — the lab’s central principle in its purest form.',
    pinouts: [
      {
        id: 'speaker_pair',
        application: 'Loudspeaker connection (two conductors, one channel)',
        carried: ['speaker_level'],
        contacts: [
          {
            label: '+ conductor',
            role: 'Loudspeaker +',
            ink: 'speakerPos',
            note: 'Identified only by the cable marking — stripe, ribbing, printed trace, or jacket color. Verify the same marking lands on + at both ends.',
          },
          { label: '− conductor', role: 'Loudspeaker −', ink: 'speakerNeg' },
        ],
        confidence: 'equipment-dependent',
        verifyAgainst:
          'The cable’s own marking scheme and the terminal labels at both ends. Nothing about bare wire is standardized — the run is only as correct as its labeling and your check.',
      },
    ],
    balanced: 'n/a',
    channels: 'mono',
    locking: {
      method: 'none',
      howToConfirm:
        'Retention comes entirely from the terminal clamping the wire. Confirm with a gentle tug, and check that no strands escaped the clamp and no insulation is trapped under it.',
    },
    hotPlug: {
      policy: 'de_energize_first',
      rationale:
        'Bare conductors are live the moment the amplifier drives them. Power the system down and wait for the output to fall silent before stripping, landing, or dressing wires — a high-power output can be hazardous to touch, and loose strands invite short circuits as they are handled.',
    },
    advantages: [
      'No connector cost and no connector to fail',
      'Fits any clamp-style terminal — posts, spring clips, barrier strips',
      'The default in fixed installations where connections are made once and documented',
    ],
    limitations: [
      'No strain relief and no locking — the joint is only as good as the clamp and the dressing',
      'Strands fray and oxidize over time; joints need periodic inspection and re-torque',
      'Polarity exists only as a marking to be read — nothing enforces it',
      'Slowest possible connection; unsuited to portable and stage use',
    ],
    commonMistakes: [
      'Stripping too much insulation, leaving exposed copper outside the terminal',
      'Letting one whiskered strand touch the neighboring terminal — a short circuit invisible from a step away',
      'Clamping insulation instead of copper, making a joint that looks finished but barely conducts',
      'Swapping + and − at one end because the cable marking was never checked',
      'Leaving frayed strands untwisted instead of twisting them neatly or fitting a crimped ferrule where the terminal type calls for one',
    ],
    notInterchangeableWith: [
      {
        otherName: 'Any other bare-wire circuit (power, control, distributed audio)',
        why: 'Stripped wire has no connector identity at all — nothing about it indicates level, polarity, or purpose.',
        consequence:
          'Landing a conductor on the wrong terminal ranges from no signal to equipment damage, and on mains or distributed-line terminals it is an electrical danger. The terminal labels and system documentation are the connection’s only identity.',
      },
    ],
    inspectionPoints: [
      'Frayed, broken, or whiskering strands at the termination',
      'Oxidized (dull, darkened) copper — cut back to bright metal when re-terminating',
      'Nicked conductors from over-aggressive stripping — a future breakage point',
      'Clamps that have loosened with time, heat cycles, or vibration',
    ],
    basicTest:
      'With the run disconnected at both ends, a continuity tester shows each conductor straight through, no continuity between conductors, and the marked conductor landing on + at both ends. Test after dressing the strands — a whisker short created during termination is exactly what this check catches.',
    safety: {
      level: 'speaker',
      cautions: [
        'The output of a high-power amplifier can exceed voltage levels generally considered safe to touch. Treat bare loudspeaker conductors on an energized system as live — power down, and confirm the system has actually gone silent, before handling.',
        'Distributed “constant-voltage” loudspeaker lines (70 V / 100 V systems) operate above commonly accepted touch-voltage limits by design — hazardous to touch in their own right, not merely “higher” than low-impedance runs. Work on those terminations per the installation documentation and local requirements — do not treat them as interchangeable with low-impedance speaker wiring.',
        'A single stray strand bridging terminals short-circuits the amplifier output; outcomes range from protective shutdown to amplifier damage depending on the design.',
      ],
    },
    glossary: [],
    relatedLessons: ['l02_anatomy', 'l05_loudspeaker', 'l09_handling'],
    sourceNotes: [
      'Conductor sizing versus run length and load (voltage drop / damping): amplifier and loudspeaker documentation, wire-gauge tables — VERIFY',
      'Distributed loudspeaker lines at 70 V / 100 V nominal operate above conventional touch-voltage limits and are treated distinctly in installation codes: NEC Article 640 / IEC TS 61201 touch-voltage limits — VERIFIED 2026-08-15: NEC Article 640 (UpCodes)',
      'High-power amplifier outputs can exceed commonly accepted touch-voltage limits: IEC touch-voltage guidance (e.g. IEC 61201) — VERIFIED 2026-08-15: IEC TS 61201',
      'Ferrule use for stranded wire in screw-clamp terminals: terminal manufacturer guidance — EXPERT REVIEW PENDING',
      'Cable polarity marking schemes (stripe/ribbing/print) are manufacturer conventions, not a standard: cable manufacturer documentation — VERIFY',
      'Amplifier outputs can remain driven briefly after power-off (stored energy); confirm silence before handling: verify-de-energized practice (NFPA 70E principle) — EXPERT REVIEW PENDING',
    ],
  },

  {
    id: 'ts_speaker_legacy',
    displayName: '1/4-inch TS (legacy loudspeaker use)',
    aliases: ['Speaker jack lead (informal)', 'Phone plug (loudspeaker use)', 'TS speaker cable'],
    category: 'loudspeaker',
    tier: 'core',
    carried: ['speaker_level'],
    typicalSources: [
      'Instrument amplifier heads (loudspeaker outputs)',
      'Combo amplifier internal-speaker connections',
      'Older powered mixers and PA amplifiers',
    ],
    typicalDestinations: [
      'Guitar and bass loudspeaker cabinets',
      'Older passive PA loudspeakers and monitors',
    ],
    construction: 'speaker_2c',
    constructionNote:
      'The correct cable behind a loudspeaker TS plug is two heavier unshielded conductors sized for current, length, and load. The plug is physically identical to an instrument plug, whose cable is a small shielded conductor for instrument-level signal — this connector is the lab’s clearest case of the plug not defining the cable.',
    pinouts: [
      {
        id: 'speaker_ts',
        application: 'Loudspeaker connection (amplifier output to passive cabinet)',
        carried: ['speaker_level'],
        contacts: [
          { label: 'Tip', role: 'Loudspeaker +', ink: 'speakerPos' },
          { label: 'Sleeve', role: 'Loudspeaker −', ink: 'speakerNeg' },
        ],
        confidence: 'convention',
        verifyAgainst: 'The amplifier and cabinet documentation and jack labeling.',
      },
    ],
    balanced: 'n/a',
    channels: 'mono',
    locking: {
      method: 'friction',
    },
    hotPlug: {
      policy: 'de_energize_first',
      rationale:
        'Power the amplifier down first. Inserting or removing the plug drags the tip across the sleeve contact, which can momentarily short-circuit the output — and some amplifier designs (notably valve output stages) also tolerate losing their load badly while driven, an equipment-dependent risk stated in the amplifier documentation.',
    },
    advantages: [
      'The jack is ubiquitous and the lead is simple to build',
      'Historically fitted across decades of instrument amplifiers and cabinets, so it remains in wide service',
    ],
    limitations: [
      'No locking — a foot through the lead disconnects the loudspeaker mid-performance',
      'Insertion and removal can momentarily short the line as the tip passes the sleeve contact',
      'Small contact area for loudspeaker current compared with connectors designed for the job',
      'Physically identical to the instrument plug — the single most common wrong-cable trap in this lab; current professional practice favors locking loudspeaker connectors for new high-power work',
    ],
    commonMistakes: [
      'Using an instrument cable as a loudspeaker cable because the plugs are identical — the classic error this connector invites',
      'Using a loudspeaker TS lead as an instrument cable — it has no shield, so it collects hum and noise',
      'Unplugging or plugging the cabinet while the amplifier is driven',
      'Assuming any 1/4-inch jack on an amplifier is safe for any 1/4-inch lead — output jacks and input jacks are different jobs on the same shell',
    ],
    notInterchangeableWith: [
      {
        otherId: 'ts_quarter',
        otherName: '1/4-inch TS instrument cable',
        why: 'The plugs are identical; the cables are not. Instrument cable is one small shielded conductor for instrument-level signal; loudspeaker cable is two heavier unshielded conductors for amplifier current.',
        consequence:
          'An instrument cable carrying loudspeaker current can heat, lose level, and fail — reduced reliability, and with some amplifier designs a failed loudspeaker line risks equipment damage. A loudspeaker lead used for an instrument picks up hum and noise because it has no shield.',
      },
      {
        otherId: 'trs_quarter',
        otherName: '1/4-inch TRS (balanced line or headphone) connection',
        why: 'Same barrel diameter — a TRS plug seats in a TS loudspeaker jack and vice versa.',
        consequence:
          'Mis-termination: the connection may pass partial signal or none, and it invites line-level or headphone cabling onto an amplifier output where it does not belong.',
      },
    ],
    inspectionPoints: [
      'Bent or worn tip; plating worn through to base metal',
      'Loose barrel or strain relief letting the cable twist at the plug',
      'Heat discoloration at the plug — a sign of high-resistance contact under loudspeaker current',
      'Crackle or dropout when the lead is flexed near the plug',
    ],
    basicTest:
      'With the lead disconnected at both ends, a continuity tester shows tip→tip and sleeve→sleeve with no tip-to-sleeve short. Also confirm what the cable IS: unshielded two-conductor loudspeaker cable, not shielded instrument cable — continuity alone cannot tell them apart, so read the jacket printing or inspect the construction at a connector.',
    safety: {
      level: 'speaker',
      cautions: [
        'Power down before connecting or disconnecting: the plug geometry can momentarily short the amplifier output during insertion and removal, and some amplifier designs are damaged by operating without a proper load — check the amplifier documentation.',
        'Never substitute an instrument cable on a loudspeaker output. It can heat and fail under loudspeaker current — this is a cable-construction limit, not a plug problem, which is exactly why the identical plug is a trap.',
      ],
    },
    glossary: ['TS Connector (Tip-Sleeve)', 'Speakon'],
    relatedLessons: ['l04_same_plug', 'l05_loudspeaker', 'l08_selection'],
    sourceNotes: [
      'Tip = +, sleeve = − loudspeaker wiring: common practice, no single governing standard — VERIFIED 2026-08-15: Neutrik speakON Product Guide (NA4LJX / Combo PA-wiring)',
      'Insertion/removal of a TS plug drags the tip across the sleeve contact and can momentarily bridge the line (plug/jack geometry-dependent — near-universal, not guaranteed): Elliott Sound Products, "Phone Jacks and Plugs" — VERIFIED 2026-08-15',
      'Some amplifier designs (notably valve output stages) can be damaged operating without a proper load: equipment-dependent, per amplifier documentation — VERIFIED 2026-08-15: Carvin Audio education article',
      'Instrument cable (single small shielded conductor) versus loudspeaker cable (two heavier unshielded conductors) construction and current-handling distinction: cable manufacturer construction data — VERIFIED 2026-08-15: Fender cable education article',
      'Professional practice favors locking loudspeaker connectors for high-power use: current industry practice, cross-check against pro-audio installation guidance — VERIFY',
      'Continuity testing only with the lead disconnected at both ends (never on an energized circuit): Fluke continuity testing guidance — VERIFIED 2026-08-15',
    ],
  },
];
