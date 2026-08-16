/**
 * lesson08 data — "Selecting the Correct Cable" (owner spec §5.8).
 * Fourteen guided source→destination selection scenarios, each walked as a
 * short chain of decisions: what travels → connector → construction/class →
 * the special requirement that makes the connection reliable and safe.
 *
 * Pure data, zero React. Every option, explanation and hint is derived from
 * the VERIFIED connector records (data/connectors.*.ts) and the lesson-01
 * carried-type teaching — no new factual claims are authored here. Where
 * several answers are genuinely valid (per the records), the alternates live
 * in accept[] and the trade-off is stated in explain (tri-state verdict,
 * MicSelect idiom) — the owner spec requires accepting all valid answers.
 */

export type SelectionStep = {
  /** The decision being made at this step. */
  prompt: string;
  /** 3–4 tappable choices (labels rendered on OptionChips). */
  options: string[];
  /** The primary correct option — exactly matches an options[] entry. */
  correct: string;
  /** Also-valid alternates (verdict 'accepted'); trade-offs covered in explain. */
  accept?: string[];
  /** Teaching shown when the step is solved (correct or accepted pick). */
  explain: string;
  /** Misconception-correcting nudge on a wrong pick — retry stays open. */
  hint: string;
};

export type SelectionScenario = {
  id: string;
  /** Short label for the scenario picker chip. */
  chip: string;
  from: string;
  to: string;
  steps: SelectionStep[];
};

export const SELECTION_SCENARIOS: SelectionScenario[] = [
  // ── 1 ─────────────────────────────────────────────────────────────────────
  {
    id: 'mic_mixer',
    chip: 'MIC → MIXER',
    from: 'Vocal microphone',
    to: 'Mixer',
    steps: [
      {
        prompt: 'What must travel from the microphone to the mixer?',
        options: ['MIC-LEVEL AUDIO', 'LINE-LEVEL AUDIO', 'LOUDSPEAKER-LEVEL AUDIO', 'DIGITAL AUDIO'],
        correct: 'MIC-LEVEL AUDIO',
        explain:
          'A microphone puts out mic-level analog audio — thousandths of a volt, the most fragile signal in the room. The mixer’s preamp raises it to working level; every later choice protects that signal on its way there.',
        hint: 'Think about the LEVEL of what leaves a microphone before any electronics have touched it.',
      },
      {
        prompt: 'Which connector carries it?',
        options: ['3-PIN XLR', '1/4-INCH TS', 'RCA (PHONO)', 'SPEAKON-STYLE TWIST-LOCK'],
        correct: '3-PIN XLR',
        explain:
          'The de-facto professional standard for microphone connections: a balanced connection that rejects interference over long runs, in a rugged latching shell that will not pull out by accident.',
        hint: 'The professional microphone connection is balanced — and it latches.',
      },
      {
        prompt: 'What construction belongs behind those plugs?',
        options: ['SHIELDED TWISTED PAIR', 'TWO HEAVY UNSHIELDED CONDUCTORS', '75-OHM COAX', 'FOUR TWISTED PAIRS'],
        correct: 'SHIELDED TWISTED PAIR',
        explain:
          'Conventional microphone cable is a shielded twisted pair — two conductors for the balanced pair plus an overall shield. The connector does not guarantee the construction: an unknown cable is verified, not assumed.',
        hint: 'A balanced pair needs two signal conductors — and a shield around them.',
      },
      {
        prompt: 'Phantom power is on and the channel is live. Before unplugging?',
        options: ['MUTE, PHANTOM OFF, PAUSE, THEN UNPLUG', 'JUST PULL — THE LATCH RELEASED', 'ONLY NUDGE THE MASTER FADER DOWN', 'NOTHING — XLR IS HOT-SAFE'],
        correct: 'MUTE, PHANTOM OFF, PAUSE, THEN UNPLUG',
        explain:
          'Connecting or unplugging a live channel can pop loudly through the system. Mute the channel first — and with +48 V phantom power, switch phantom off and pause briefly before unplugging.',
        hint: 'A live channel pops — and +48 V phantom power has its own extra rule.',
      },
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  {
    id: 'guitar_di',
    chip: 'GUITAR → DI',
    from: 'Electric guitar',
    to: 'DI box',
    steps: [
      {
        prompt: 'What must travel from the guitar to the DI box?',
        options: ['INSTRUMENT-LEVEL AUDIO', 'MIC-LEVEL AUDIO', 'LINE-LEVEL AUDIO', 'LOUDSPEAKER-LEVEL AUDIO'],
        correct: 'INSTRUMENT-LEVEL AUDIO',
        explain:
          'A passive pickup produces instrument-level audio that wants a high-impedance input — exactly what a DI box provides before converting the signal for the mic line.',
        hint: 'Stronger than mic level, weaker than line level — and picky about the input that receives it.',
      },
      {
        prompt: 'Which connector?',
        options: ['1/4-INCH TS', '3-PIN XLR', '3.5 MM TRS (MINI)', 'RCA (PHONO)'],
        correct: '1/4-INCH TS',
        explain:
          'The universal instrument-world connector — rugged, simple, and exactly what DI box inputs expect. Two contacts: the tip carries the signal, the sleeve doubles as return path and shield.',
        hint: 'The instrument world runs on one rugged two-contact plug.',
      },
      {
        prompt: 'Which cable construction?',
        options: ['SHIELDED INSTRUMENT CABLE', 'UNSHIELDED SPEAKER CABLE', 'FOUR TWISTED PAIRS', 'OPTICAL FIBER'],
        correct: 'SHIELDED INSTRUMENT CABLE',
        explain:
          'Instrument cable is a single small-gauge conductor inside a shield, built to move a tiny high-impedance signal quietly. A speaker cable wearing the identical TS plug is two heavier unshielded conductors — the jacket printing and the construction tell them apart, never the plug.',
        hint: 'A tiny high-impedance signal needs a shield around it.',
      },
      {
        prompt: 'A lead in the bag has identical TS plugs, but its jacket reads SPEAKER. Use it?',
        options: ['NO — NO SHIELD, IT WILL HUM', 'YES — THE PLUGS MATCH', 'YES, IF THE RUN IS SHORT'],
        correct: 'NO — NO SHIELD, IT WILL HUM',
        explain:
          'A speaker cable used for an instrument has no shield, so it hums and buzzes — noise, not damage. The identical plug is exactly why the jacket printing must be read before patching.',
        hint: 'Same plug, different cable — what does a missing shield do to a tiny signal?',
      },
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  {
    id: 'di_stagebox',
    chip: 'DI → STAGE BOX',
    from: 'DI box',
    to: 'Stage box',
    steps: [
      {
        prompt: 'The DI has done its job. What travels on to the stage box?',
        options: ['MIC-LEVEL AUDIO (BALANCED)', 'INSTRUMENT-LEVEL AUDIO', 'LOUDSPEAKER-LEVEL AUDIO', 'NETWORKED AUDIO'],
        correct: 'MIC-LEVEL AUDIO (BALANCED)',
        explain:
          'The DI converts the instrument signal for the mic line — a balanced output ready for a stage box channel and the console preamp at the far end of the snake.',
        hint: 'A DI converts the signal FOR a specific kind of line — which one?',
      },
      {
        prompt: 'Which connector into the stage box channel?',
        options: ['3-PIN XLR', '1/4-INCH TS', 'ETHERNET 8P8C', 'RCA (PHONO)'],
        correct: '3-PIN XLR',
        explain:
          'DI box outputs feed stage box and snake channels on 3-pin XLR — the balanced professional standard, with contacts recessed and protected inside a rugged body.',
        hint: 'Stage box channels speak the professional balanced standard.',
      },
      {
        prompt: 'Construction for the run across the stage?',
        options: ['SHIELDED TWISTED PAIR', 'UNSHIELDED SPEAKER CABLE', '75-OHM COAX'],
        correct: 'SHIELDED TWISTED PAIR',
        explain:
          'Shielded twisted pair — the balanced connection rejects interference over long cable runs, which is the whole point of getting onto the mic line in the first place.',
        hint: 'The reason to go balanced is what happens over DISTANCE.',
      },
      {
        prompt: 'The lead crosses the stage floor under foot traffic. What retention does XLR give you?',
        options: ['A LATCH — CLICK IN, THEN CHECK', 'FRICTION ONLY — TAPE IT DOWN', 'A TWIST-LOCK COLLAR', 'A SCREW RING'],
        correct: 'A LATCH — CLICK IN, THEN CHECK',
        explain:
          'XLR latches: push in until the latch clicks, and a locked plug will not pull free without pressing the release tab. That is what keeps a floor run connected under traffic.',
        hint: 'One of these families clicks in and holds until a release tab is pressed.',
      },
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  {
    id: 'mixer_powered',
    chip: 'MIXER → POWERED SPKR',
    from: 'Mixer',
    to: 'Powered loudspeaker',
    steps: [
      {
        prompt: 'What travels from the mixer to a POWERED loudspeaker?',
        options: ['LINE-LEVEL AUDIO', 'LOUDSPEAKER-LEVEL AUDIO', 'AC MAINS POWER', 'NETWORKED AUDIO'],
        correct: 'LINE-LEVEL AUDIO',
        explain:
          'A powered loudspeaker amplifies INSIDE the cabinet, so the mixer sends it line-level audio. Its power arrives separately, from the wall — two connections, two different things traveling.',
        hint: 'Where does the amplification happen in a POWERED cabinet?',
      },
      {
        prompt: 'Which connector for that feed?',
        options: ['3-PIN XLR', 'SPEAKON-STYLE TWIST-LOCK', 'POWERCON-FAMILY', 'BANANA PLUGS'],
        correct: '3-PIN XLR',
        explain:
          'A line-level feed to a powered loudspeaker typically rides 3-pin XLR into the cabinet’s input panel. speakON-style connectors carry amplifier output only — they are not how line level reaches a powered box.',
        hint: 'This is a line-level SIGNAL connection — not amplifier output, and not mains.',
      },
      {
        prompt: 'Construction?',
        options: ['SHIELDED TWISTED PAIR', 'TWO HEAVY UNSHIELDED CONDUCTORS', 'FOUR TWISTED PAIRS'],
        correct: 'SHIELDED TWISTED PAIR',
        explain:
          'A balanced shielded twisted pair carries the line feed and rejects interference across the room. Heavy unshielded conductors belong to amplifier outputs — a different connection entirely.',
        hint: 'Line level over distance wants the same construction every balanced signal does.',
      },
      {
        prompt: 'Someone offers a speakON-style lead — “it locks, even better.” Use it?',
        options: ['NO — WRONG CONNECTION ENTIRELY', 'YES — LOCKING IS ALWAYS BETTER', 'YES, WITH AN ADAPTER'],
        correct: 'NO — WRONG CONNECTION ENTIRELY',
        explain:
          'A line-level feed to a powered loudspeaker and an amplifier output to a passive one are different connections. speakON-style connectors carry amplifier output only — a different shell entirely that cannot land on a mic or line input. The answer is the correct lead, never an adapter.',
        hint: 'Twist-locks of that family carry amplifier output — what is THIS connection carrying?',
      },
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  {
    id: 'mixer_amp',
    chip: 'MIXER → POWER AMP',
    from: 'Mixer',
    to: 'Power amplifier',
    steps: [
      {
        prompt: 'What travels from the mixer to the power amplifier’s input?',
        options: ['LINE-LEVEL AUDIO', 'LOUDSPEAKER-LEVEL AUDIO', 'MIC-LEVEL AUDIO', 'AC MAINS POWER'],
        correct: 'LINE-LEVEL AUDIO',
        explain:
          'Line level is the working level professional gear trades in — the mixer’s output feeds the amplifier’s input at line level. Loudspeaker level does not exist until the amplifier has done its work.',
        hint: 'Loudspeaker level only exists AFTER this box does its job.',
      },
      {
        prompt: 'Which connector into the amplifier?',
        options: ['3-PIN XLR', '1/4-INCH TRS (BALANCED)', '1/4-INCH TS', 'SPEAKON-STYLE TWIST-LOCK'],
        correct: '3-PIN XLR',
        accept: ['1/4-INCH TRS (BALANCED)'],
        explain:
          'Mixer outputs feed amplifier and processor inputs on 3-pin XLR — balanced and latching. Also defensible: a balanced 1/4-inch TRS line connection where the equipment provides it; the trade-off is friction-only retention, no latch.',
        hint: 'Balanced line comes in two common shapes — one latches, one does not. Neither has just two contacts.',
      },
      {
        prompt: 'Construction?',
        options: ['SHIELDED TWISTED PAIR', 'TWO HEAVY UNSHIELDED CONDUCTORS', 'OPTICAL FIBER'],
        correct: 'SHIELDED TWISTED PAIR',
        explain:
          'Balanced line runs ride a shielded twisted pair — two conductors plus shield. Save the heavy unshielded conductors for the OTHER side of the amplifier.',
        hint: 'This is still a signal connection — the loudspeaker side comes later.',
      },
      {
        prompt: 'Patching this line during show prep — the discipline?',
        options: ['MUTE THE CHANNEL FIRST', 'PATCH IT HOT — LINE LEVEL IS HARMLESS', 'YANK IT FAST SO THE POP IS SHORT'],
        correct: 'MUTE THE CHANNEL FIRST',
        explain:
          'The contacts bridge on the way in and out, popping through the system — and here the pop goes straight into a power amplifier. Mute the channel before connecting or disconnecting.',
        hint: 'What do bridging contacts do to a live channel — and what sits downstream of THIS one?',
      },
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  {
    id: 'amp_passive',
    chip: 'AMP → PASSIVE SPKR',
    from: 'Power amplifier',
    to: 'Passive loudspeaker',
    steps: [
      {
        prompt: 'What travels from the amplifier to a PASSIVE loudspeaker?',
        options: ['LOUDSPEAKER-LEVEL AUDIO', 'LINE-LEVEL AUDIO', 'AC MAINS POWER', 'INSTRUMENT-LEVEL AUDIO'],
        correct: 'LOUDSPEAKER-LEVEL AUDIO',
        explain:
          'An amplifier’s output is loudspeaker-level — whole volts with real current behind it. It belongs only on loudspeaker terminals, over cable sized for the job.',
        hint: 'On this one connection, the amplifier has already done its work.',
      },
      {
        prompt: 'Which connector?',
        options: ['SPEAKON-STYLE TWIST-LOCK', 'BINDING POSTS / BANANA PLUGS', '3-PIN XLR', 'POWERCON-FAMILY'],
        correct: 'SPEAKON-STYLE TWIST-LOCK',
        accept: ['BINDING POSTS / BANANA PLUGS'],
        explain:
          'speakON-style connectors are built for the job: enclosed, touch-protected contacts and a positive twist-lock. Also defensible: binding posts taking bananas, spades or bare wire on hi-fi and studio amplifiers — the trade-off is exposed conductors, no lock, and a power-down-first handling rule.',
        hint: 'Amplifier output wants enclosed locking contacts — or the exposed-terminal tradition that demands far more care.',
      },
      {
        prompt: 'Cable construction?',
        options: ['TWO HEAVY UNSHIELDED CONDUCTORS', 'SHIELDED INSTRUMENT CABLE', 'SHIELDED TWISTED PAIR', 'FOUR TWISTED PAIRS'],
        correct: 'TWO HEAVY UNSHIELDED CONDUCTORS',
        explain:
          'Loudspeaker cable is two heavier unshielded conductors, sized for the current, the run length and the load. The connector does not enforce this — the cable itself must be verified, not assumed from the plug.',
        hint: 'Amplifier current needs conductor, not shielding.',
      },
      {
        prompt: 'Connecting the cabinet — the safe sequence?',
        options: ['MUTE OR POWER DOWN → CONNECT → CONFIRM THE LOCK', 'CONNECT WHILE DRIVEN — IT LOCKS ANYWAY', 'VOLUME AT HALF IS ENOUGH'],
        correct: 'MUTE OR POWER DOWN → CONNECT → CONFIRM THE LOCK',
        explain:
          'Stop the signal before making or breaking a loudspeaker line — separating a driven line can arc across the contacts, and no speakON-style connector is rated to break a driven load (“NOT FOR INTERRUPTING CURRENT”). Insert, twist until it clicks, then confirm with a gentle tug while the line is still muted.',
        hint: 'What happens across contacts that separate while a loudspeaker line is driven?',
      },
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  {
    id: 'interface_computer',
    chip: 'INTERFACE → COMPUTER',
    from: 'Audio interface',
    to: 'Computer',
    steps: [
      {
        prompt: 'What travels between the interface and the computer?',
        options: ['DIGITAL AUDIO AS DATA', 'POWER + DATA TOGETHER', 'LINE-LEVEL AUDIO', 'CLOCK / SYNC'],
        correct: 'DIGITAL AUDIO AS DATA',
        accept: ['POWER + DATA TOGETHER'],
        explain:
          'The audio crosses as computer data — digital audio over USB. Also defensible: many interfaces draw their power back up the very same cable, which makes the connection a power-and-data hybrid.',
        hint: 'No analog level fits here — think about what a computer port actually speaks.',
      },
      {
        prompt: 'Which connector family?',
        options: ['USB — TYPE-C OR TYPE-B, PER THE INTERFACE', 'HDMI', 'TOSLINK OPTICAL', 'ETHERNET 8P8C'],
        correct: 'USB — TYPE-C OR TYPE-B, PER THE INTERFACE',
        explain:
          'Audio interfaces connect over USB: many wear USB-C, desktop units often wear the squarish Type-B, and the host end of the cable is Type-A or C. The interface’s own inlet decides which cable — the job is identical.',
        hint: 'The peripheral end matches the interface; the host end matches the computer.',
      },
      {
        prompt: 'Which cable requirement matters most here?',
        options: ['A DATA-CAPABLE CABLE, NOT CHARGE-ONLY', 'THE THICKEST CABLE AVAILABLE', 'ANY CABLE THAT FITS THE PORTS'],
        correct: 'A DATA-CAPABLE CABLE, NOT CHARGE-ONLY',
        explain:
          'Charge-only cables omit the data pair entirely and look identical from outside. One on an audio interface powers the device but never connects it — test or label cables so the data cables stay identifiable.',
        hint: 'Two identical-looking USB cables can differ by an entire missing pair.',
      },
      {
        prompt: 'Mid-session you need to unplug the interface. What first?',
        options: ['STOP THE AUDIO SOFTWARE, THEN UNPLUG', 'JUST PULL — USB IS HOT-PLUGGABLE', 'SHUT THE WHOLE COMPUTER DOWN'],
        correct: 'STOP THE AUDIO SOFTWARE, THEN UNPLUG',
        explain:
          'USB is designed for live connection and removal — but close or stop the audio software gracefully before unplugging an audio interface, to avoid dropouts and driver errors.',
        hint: 'The connector is hot-safe by design; the SESSION is what needs protecting.',
      },
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  {
    id: 'interface_monitors',
    chip: 'INTERFACE → MONITORS',
    from: 'Audio interface',
    to: 'Powered studio monitors',
    steps: [
      {
        prompt: 'What travels from the interface’s outputs to powered monitors?',
        options: ['LINE-LEVEL AUDIO', 'DIGITAL AUDIO AS DATA', 'HEADPHONE AUDIO', 'LOUDSPEAKER-LEVEL AUDIO'],
        correct: 'LINE-LEVEL AUDIO',
        explain:
          'The interface’s balanced line outputs feed the monitors at line level — each powered monitor amplifies inside its own cabinet.',
        hint: 'Powered monitors amplify for themselves — what do their inputs expect?',
      },
      {
        prompt: 'Which connector? The monitors accept several.',
        options: ['1/4-INCH TRS (BALANCED)', '3-PIN XLR', '1/4-INCH TS', 'SPEAKON-STYLE TWIST-LOCK'],
        correct: '1/4-INCH TRS (BALANCED)',
        accept: ['3-PIN XLR'],
        explain:
          'Both balanced choices are correct: 1/4-inch TRS from the interface’s line outputs, or 3-pin XLR where both ends provide it. The trade-off — XLR adds a latch; TRS is more compact but friction-only. A TS plug would seat too, but it grounds the ring and the connection silently runs unbalanced.',
        hint: 'Two balanced shapes are defensible here — the two-contact plug is not one of them.',
      },
      {
        prompt: 'Construction?',
        options: ['SHIELDED TWISTED PAIR', 'UNSHIELDED SPEAKER CABLE', 'OPTICAL FIBER'],
        correct: 'SHIELDED TWISTED PAIR',
        explain:
          'Balanced use conventionally rides a shielded twisted pair — two conductors plus shield. Speaker cable belongs to amplifier outputs, and a powered monitor’s input is a line input.',
        hint: 'Line level in, amplification inside — which side of the amplifier is this cable on?',
      },
      {
        prompt: 'Connecting the monitors — discipline?',
        options: ['MUTE OR TURN THE LEVEL DOWN FIRST', 'CONNECT HOT AT WORKING VOLUME', 'NO RULE — LINE LEVEL IS TOO SMALL TO MATTER'],
        correct: 'MUTE OR TURN THE LEVEL DOWN FIRST',
        explain:
          'The contacts bridge on the way in and out, popping through the system — and monitors point straight at your ears. Mute the channel or turn the level down before connecting or disconnecting.',
        hint: 'The pop goes wherever the output points — where does THIS output point?',
      },
    ],
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  {
    id: 'wordclock_recorder',
    chip: 'CLOCK → RECORDER',
    from: 'Word-clock generator',
    to: 'Digital recorder',
    steps: [
      {
        prompt: 'What travels down this line?',
        options: ['CLOCK / SYNC — NO AUDIO AT ALL', 'DIGITAL AUDIO', 'CONTROL DATA', 'LINE-LEVEL AUDIO'],
        correct: 'CLOCK / SYNC — NO AUDIO AT ALL',
        explain:
          'Word clock carries no audio — it is the timing pulse that keeps every digital device sampling in step. Losing it causes clicks and drift, not silence in the cable.',
        hint: 'This cable never carries a single sample of audio.',
      },
      {
        prompt: 'Which connector?',
        options: ['BNC', 'RCA (PHONO)', '3-PIN XLR', 'TOSLINK OPTICAL'],
        correct: 'BNC',
        explain:
          'BNC is the standard connector for word clock — a bayonet lock that is fast, positive and vibration-resistant: push, quarter-twist to the stop, and a gentle pull-back confirms it.',
        hint: 'The clock connector locks with a quarter-twist bayonet collar.',
      },
      {
        prompt: 'Which cable behind it?',
        options: ['75-OHM COAX, AS THE SYSTEM SPECIFIES', 'ANY COAX WITH THE RIGHT PLUG', 'SHIELDED TWISTED PAIR', 'FOUR TWISTED PAIRS'],
        correct: '75-OHM COAX, AS THE SYSTEM SPECIFIES',
        explain:
          'Word clock I/O is commonly a 75-ohm system, and 50-ohm and 75-ohm cables look nearly identical and mate physically. Impedance is invisible to the eye and to a continuity tester alike — the jacket printing and the equipment manuals govern.',
        hint: 'The property that matters here cannot be seen — or measured with a continuity tester.',
      },
      {
        prompt: 'One more check before the session?',
        options: ['TERMINATION PER THE MANUALS; PATCH ONLY BETWEEN TAKES', 'NOTHING — CLOCK LINES ARE CASUAL', 'RE-PATCH FREELY DURING TAKES'],
        correct: 'TERMINATION PER THE MANUALS; PATCH ONLY BETWEEN TAKES',
        explain:
          'Whether a clock chain needs a termination at the last device — or a device self-terminates via a switch — varies by product: the manuals govern. And re-patch clock lines only between takes: every slaved device unlocks and re-locks when the line is interrupted, producing clicks, dropouts or brief mutes.',
        hint: 'Two words: termination — and the TIMING of the patch itself.',
      },
    ],
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  {
    id: 'switch_dante',
    chip: 'SWITCH → DANTE',
    from: 'Network switch',
    to: 'Dante-enabled device',
    steps: [
      {
        prompt: 'What travels?',
        options: ['NETWORKED AUDIO', 'DIGITAL AUDIO (POINT-TO-POINT)', 'CONTROL DATA', 'CLOCK / SYNC'],
        correct: 'NETWORKED AUDIO',
        explain:
          'Dante is networked audio — many channels riding an ordinary computer network. The ports look like any network jack; the protocol is what makes it audio.',
        hint: 'Many channels of audio, riding one ordinary-looking network line.',
      },
      {
        prompt: 'Which connector?',
        options: ['8P8C MODULAR (ETHERNET)', 'ETHERCON-STYLE LOCKING SHELL', 'USB TYPE-C', 'BNC'],
        correct: '8P8C MODULAR (ETHERNET)',
        accept: ['ETHERCON-STYLE LOCKING SHELL'],
        explain:
          'The connection is Ethernet on the 8P8C modular plug. Also defensible — and the stage-worthy choice: an etherCON-style locking shell around the same connection. It adds a positive lock and impact protection, and changes nothing electrical.',
        hint: 'It is a network connection — with an optional stage-armored version of the same plug.',
      },
      {
        prompt: 'Which cable?',
        options: ['THE CATEGORY THE SYSTEM CALLS FOR, WIREMAP-TESTED', 'ANY CORD WITH THE RIGHT PLUG', 'A TELEPHONE CORD — IT FITS', 'COAX WITH ADAPTERS'],
        correct: 'THE CATEGORY THE SYSTEM CALLS FOR, WIREMAP-TESTED',
        explain:
          'Cable category (Cat 5e, 6, 6A…) sets the speed and distance a run supports, and the plug looks identical on every grade. The wiremap matters too: a split pair passes simple continuity yet fails at speed. Some audio transports carry stricter cable and length requirements than office networking — the system manual governs.',
        hint: 'The plug is identical on every grade of this cable — so what actually differs?',
      },
      {
        prompt: 'Both ends have the port. Compatibility proven?',
        options: ['NO — THE PROTOCOL DECIDES; CHECK LABELS AND DOCS', 'YES — MATCHING PORTS MEAN MATCHING SYSTEMS', 'YES, IF THE LINK LIGHT COMES ON'],
        correct: 'NO — THE PROTOCOL DECIDES; CHECK LABELS AND DOCS',
        explain:
          'The connector proves nothing about the protocol: audio-over-IP systems, digital snake protocols and plain office networking all use the same plug. A link may even show activity yet pass no usable audio — identify ports from labels and documentation, not shape.',
        hint: 'The lab’s principle at full strength: fitting proves what, exactly?',
      },
    ],
  },

  // ── 11 ────────────────────────────────────────────────────────────────────
  {
    id: 'midi_synth',
    chip: 'MIDI → SYNTH',
    from: 'MIDI controller',
    to: 'Synthesizer',
    steps: [
      {
        prompt: 'What travels?',
        options: ['CONTROL DATA — INSTRUCTIONS, NOT SOUND', 'DIGITAL AUDIO', 'LINE-LEVEL AUDIO', 'CLOCK / SYNC'],
        correct: 'CONTROL DATA — INSTRUCTIONS, NOT SOUND',
        explain:
          'MIDI is control data — which note, how hard, which knob moved. No sound travels down a MIDI cable; the synthesizer MAKES the sound when told to.',
        hint: 'Nothing you could listen to ever rides this cable.',
      },
      {
        prompt: 'Which connector?',
        options: ['MIDI 5-PIN DIN', '3-PIN XLR', 'RCA (PHONO)', 'BNC'],
        correct: 'MIDI 5-PIN DIN',
        explain:
          'The MIDI 5-pin DIN — a one-way, opto-isolated current loop that has kept decades of instruments interoperating. The cable can physically resemble audio cabling; the systems are unrelated.',
        hint: 'Five slim pins in a round shell, with decades of instruments behind it.',
      },
      {
        prompt: 'Which ports do the two ends land on?',
        options: ['CONTROLLER OUT → SYNTH IN', 'OUT TO OUT', 'IN TO IN', 'EITHER WAY — IT IS SYMMETRIC'],
        correct: 'CONTROLLER OUT → SYNTH IN',
        explain:
          'MIDI is strictly one-way: data flows from an OUT (or THRU) port into an IN port — always. Two-way communication takes two cables; OUT-to-OUT does nothing (and harms nothing).',
        hint: 'One direction per cable — the port names say which way.',
      },
      {
        prompt: 'The only DIN-5 cable on hand is unlabeled, from a box of vintage leads. Trust it?',
        options: ['MAP IT FIRST — CONTINUITY 4→4, 5→5, 2→2', 'YES — DIN-5 IS DIN-5', 'CUT IT OPEN AND LOOK'],
        correct: 'MAP IT FIRST — CONTINUITY 4→4, 5→5, 2→2',
        explain:
          'Cables sold for other DIN-5 purposes may connect different pins than a MIDI cable does. A standard MIDI cable runs straight through on pins 4, 5 and 2 — a quick continuity map identifies an unknown lead before it wastes troubleshooting time.',
        hint: 'The DIN shell predates MIDI and served many jobs — how do you find out what this lead is?',
      },
    ],
  },

  // ── 12 ────────────────────────────────────────────────────────────────────
  {
    id: 'tv_earc',
    chip: 'TV eARC → SOUNDBAR',
    from: 'TV (eARC port)',
    to: 'Soundbar',
    steps: [
      {
        prompt: 'What travels here?',
        options: ['DIGITAL AUDIO, SENT BACK DOWN THE LINK', 'ANALOG LINE-LEVEL AUDIO', 'NETWORKED AUDIO', 'AC MAINS POWER'],
        correct: 'DIGITAL AUDIO, SENT BACK DOWN THE LINK',
        explain:
          'ARC/eARC reverses AUDIO back down an HDMI link — the TV returns digital audio to the soundbar over the same cable that normally carries picture toward a display.',
        hint: 'The unusual thing about this connection is its DIRECTION.',
      },
      {
        prompt: 'Which connector?',
        options: ['HDMI', 'TOSLINK OPTICAL', 'RCA (PHONO)', 'USB TYPE-A'],
        correct: 'HDMI',
        explain:
          'eARC is an HDMI feature: the audio return channel rides the HEAC contacts of an HDMI link between equipment that supports it.',
        hint: 'The feature’s full name is Audio Return Channel — a channel of which link?',
      },
      {
        prompt: 'Which ports on the two devices?',
        options: ['THE PORTS LABELED ARC/eARC ON BOTH', 'ANY HDMI PORT ON EACH', 'THE HIGHEST-NUMBERED PORTS'],
        correct: 'THE PORTS LABELED ARC/eARC ON BOTH',
        explain:
          'Audio return only works between ports specifically labeled ARC or eARC, on both devices. Plugging into any handy HDMI input and expecting return audio is the classic mistake.',
        hint: 'Read the port labels — this feature does not live on every socket.',
      },
      {
        prompt: 'Cable and mounting care?',
        options: ['CERTIFIED BANDWIDTH CLASS + SUPPORT THE CABLE’S WEIGHT', 'ANY HDMI CABLE — THEY ARE ALL ALIKE', 'HANG ADAPTERS OFF THE TV PORT AS NEEDED'],
        correct: 'CERTIFIED BANDWIDTH CLASS + SUPPORT THE CABLE’S WEIGHT',
        explain:
          'The plug looks identical across every bandwidth class — check the cable’s certified class against what the link needs. And support the cable: heavy cables levering on friction-fit ports work equipment sockets loose, and the socket costs far more than the cable.',
        hint: 'Two chronic HDMI weaknesses: what the cable can carry, and what its weight does to the socket.',
      },
    ],
  },

  // ── 13 ────────────────────────────────────────────────────────────────────
  {
    id: 'wall_powered',
    chip: 'WALL AC → POWERED SPKR',
    from: 'AC wall receptacle',
    to: 'Powered loudspeaker',
    steps: [
      {
        prompt: 'What travels?',
        options: ['AC MAINS POWER', 'LOUDSPEAKER-LEVEL AUDIO', 'LOW-VOLTAGE DC POWER', 'LINE-LEVEL AUDIO'],
        correct: 'AC MAINS POWER',
        explain:
          'This is wall power — AC mains. It shares nothing with the line-level signal feed the same cabinet also needs: two connections, two different things traveling.',
        hint: 'The powered speaker needs two cables — this is the one from the WALL.',
      },
      {
        prompt: 'Which connector at the speaker end?',
        options: ['IEC C13 INTO THE C14 INLET', 'POWERCON-FAMILY, IF THAT IS THE INLET', 'SPEAKON-STYLE TWIST-LOCK', 'DC BARREL'],
        correct: 'IEC C13 INTO THE C14 INLET',
        accept: ['POWERCON-FAMILY, IF THAT IS THE INLET'],
        explain:
          'The cabinet’s inlet decides: many powered loudspeakers take a C13/C14 cordset, and touring cabinets often wear a locking powerCON-family inlet instead — same mains seriousness, better retention. A speakON-style connector is never a mains connector, whatever it visually resembles.',
        hint: 'Match the cabinet’s power INLET — and remember which twist-lock family is mains and which is loudspeaker.',
      },
      {
        prompt: 'Which cord?',
        options: ['A CORD WHOSE PRINTED RATING SUITS THE LOAD, UNDAMAGED', 'ANY IEC LEAD — THEY ALL FIT', 'THE ONE WITH TAPE OVER THE JACKET NICK'],
        correct: 'A CORD WHOSE PRINTED RATING SUITS THE LOAD, UNDAMAGED',
        explain:
          'The identical coupler ships on cords of very different gauge and regional voltage — the printed rating on the cord jacket governs, never the shape. And damaged mains cords leave service immediately; tape is not a repair.',
        hint: 'The coupler is identical across many cords — where is the real rating written?',
      },
      {
        prompt: 'The safe sequence?',
        options: ['SWITCH OFF → CONNECT → THEN POWER UP', 'CONNECT UNDER LOAD — IT IS BUILT FOR THAT', 'PULL IT BY THE CORD WHEN DONE'],
        correct: 'SWITCH OFF → CONNECT → THEN POWER UP',
        explain:
          'Ordinary appliance couplers are not certified to be connected or disconnected under load. Switch the equipment off, connect, then power up — a fault shows itself at switch-on rather than at full load. And unplug by gripping the plug body, never by pulling the cord.',
        hint: 'Ordinary couplers carry a specific limitation about LOAD.',
      },
    ],
  },

  // ── 14 ────────────────────────────────────────────────────────────────────
  {
    id: 'dc_device',
    chip: 'DC SUPPLY → DEVICE',
    from: 'External DC supply',
    to: 'Small device',
    steps: [
      {
        prompt: 'What travels?',
        options: ['LOW-VOLTAGE DC POWER', 'AC MAINS POWER', 'POWER + DATA TOGETHER', 'CONTROL DATA'],
        correct: 'LOW-VOLTAGE DC POWER',
        explain:
          'Low-voltage DC for a small device — where voltage, polarity and current capacity must all match the device. The danger here is to equipment, not to people.',
        hint: 'Small device, external supply — what kind of power reaches the equipment jack?',
      },
      {
        prompt: 'Which connector?',
        options: ['DC BARREL', 'USB-C, WHERE THE DEVICE TAKES USB PD', 'BANANA PLUGS', 'IEC C7 FIGURE-8'],
        correct: 'DC BARREL',
        accept: ['USB-C, WHERE THE DEVICE TAKES USB PD'],
        explain:
          'The DC barrel is the classic small-device power connector. Also defensible: USB-C on devices built to take USB PD power — with the advantage that voltage rises only after negotiation, where a barrel delivers whatever the supply produces the instant the tip touches.',
        hint: 'Two low-voltage DC deliveries exist — one simple and classic, one negotiated.',
      },
      {
        prompt: 'What must match before connecting?',
        options: ['VOLTAGE, DC TYPE, POLARITY SYMBOL, CURRENT — BOTH LABELS', 'JUST THE PLUG SIZE', 'JUST THE VOLTAGE NUMBER'],
        correct: 'VOLTAGE, DC TYPE, POLARITY SYMBOL, CURRENT — BOTH LABELS',
        explain:
          'Fit proves nothing: identical barrels ship on supplies of many voltages, in both polarities, and some adapters output AC. Match every label item — voltage, DC (or AC) type, the polarity symbol, and a supply current rating at or above the device’s requirement. And 9 V pedal supplies are commonly center-NEGATIVE.',
        hint: 'Several separate facts live on those two labels — the plug carries none of them.',
      },
      {
        prompt: 'Connection sequence?',
        options: ['VERIFY LABELS → CONNECT BARREL → ENERGIZE SUPPLY', 'ENERGIZE FIRST, THEN TOUCH THE TIP TO TEST', 'IF IT FITS SNUGLY, IT IS FINE'],
        correct: 'VERIFY LABELS → CONNECT BARREL → ENERGIZE SUPPLY',
        explain:
          'A barrel connector has no negotiation and no breaking design — whatever the supply delivers hits the device the instant the tip touches. Verify both labels first, and prefer connecting the barrel before energizing the supply.',
        hint: 'What happens at the instant a live barrel tip touches the jack?',
      },
    ],
  },
];

/** Lesson takeaway (LessonBanner idiom). */
export const L08_LESSON =
  'A defensible cable choice is a chain of verified answers: what travels, which connector, which construction, and the requirement that makes the connection reliable and safe. Where two cables both work, know the trade-off you accepted.';
