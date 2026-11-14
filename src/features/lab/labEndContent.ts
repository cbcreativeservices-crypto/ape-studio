/**
 * labEndContent — the per-lab words the shared END SCREEN ("What's left",
 * kit/LabEndScreen) shows above and below its rows: a short RECAP and a
 * NEXT-LAB suggestion (lab fix round 2026-11-14, S2; report section 3 row 5
 * and pattern 12. Owner approval: "Begin fixing all bugs found and do obvious
 * ... fixes as you suggested in the report", then the suggested order, item 6
 * "The end screen recap").
 *
 * Keyed by the id the end screen's host already uses:
 *   PagedLab → its labId · LabCheckEnd → its labId · ReviewLabEnd → its
 *   labKey · a lab drawing <LabEndScreen> itself → `labId="…"` on it.
 * Opt-in BY DATA: a lab with no entry shows nothing extra (no empty box).
 *
 * PHASE 2 (S4, 2026-11-14): every lab on the Labs menu has an entry. The
 * recap lines are each lab's own teaching (its end Screen Guide's "what this
 * teaches", its guided-lesson text, its pages), said as what the learner now
 * KNOWS. The next lab follows the Labs menu: Fundamentals in menu order, then
 * a natural next topic in Advanced Training (never a lock, never a
 * placeholder). A few hosts do not pass their id to the end screen yet; their
 * entries wait here under the id S4_REPORT.md asks them to pass (SHARED NEED),
 * and test/labFixes_20261114_S4 lists them.
 *
 * Rules (pinned by test/labFixes_20261114_S2 and _S4):
 *   • recap: 3–5 lines, each ≤ 30 words; KNOWLEDGE, never skills (owner rule,
 *     PROTOCOL 29: no "you can now mix / you'll master / you built"); only
 *     what the lab itself teaches; US spelling.
 *   • next.route: a Labs-menu route with no params (navigate(route) is called
 *     bare); next.title: that lab's name on the Labs menu; next.why ≤ 16
 *     words, starts lower-case, no full stop (it reads "<title> — <why> ›").
 *
 * Pure data, React-free: tests import it directly.
 */
import type { RootStackParamList } from '../../navigation/types';

export type LabEndNext = {
  /** The screen to open (a RootStackParamList route with no params). */
  route: keyof RootStackParamList;
  /** The lab's name as the Labs menu shows it. */
  title: string;
  /** Why it is a good next step, lower-case, ≤ 16 words, no full stop. */
  why?: string;
};

export type LabEndContent = {
  /** What the lab teaches, 3–5 lines (WHAT YOU LEARNED once complete, WHAT
   *  THIS LAB COVERS before that). */
  recap?: readonly string[];
  /** The lab to suggest next (UP NEXT / AFTER THIS LAB). */
  next?: LabEndNext;
};

// The two lines every Miking family shares (MIKING_END_GUIDE's "what this
// teaches"): the same order of decisions, and starting points, not rules.
const MIKING_ORDER =
  'Miking follows the same order every time: find where the sound leaves, compare starting setups, choose the mic by its properties, then place it and keep it clear.';
const MIKING_STARTS = 'Every position is a suggested starting point, and more than one setup can work, each for reasons that can be named.';

export const LAB_END_CONTENT: Readonly<Record<string, LabEndContent>> = {
  // ══ AUDIO FUNDAMENTALS · SOUND ═══════════════════════════════════════════
  af_amplitude: {
    recap: [
      'Every Academy display uses one color language for level: cooler colors mean less, warmer colors mean more, on each display’s own scale.',
      'Amplitude is how big the swings are; level is that size read as a number, counted in dB (decibels).',
      'For the same signal, PEAK reads higher and hotter than RMS, a kind of average.',
      'A waveform shows amplitude over time, a spectrum shows strength across frequency, and a spectrogram shows both at once.',
      'The color scale is a learning aid; real equipment and software use many color schemes.',
    ],
    next: { route: 'FoundationsCourse', title: 'Foundations of Sound', why: 'what sound is, made visible: waves, wavelength, phase and harmonics' },
  },
  af_foundations: {
    recap: [
      'Sound is a pattern of pressure changes traveling through air: each molecule only rocks around its home spot while the pattern moves on.',
      'Amplitude is the size of the vibration and frequency its rate; equal amplitude is not equal loudness, because ears have a curve.',
      'Doubling the frequency halves the wavelength and raises the pitch one octave: pitch is a ratio.',
      'Phase decides whether two copies of a sound add or cancel.',
      'Harmonics stack into a tone’s character, its timbre, and every sound can be described as a sum of sines.',
    ],
    next: { route: 'FoundationsPlayground', title: 'Sound Playground', why: 'every Foundations control acting on one sound at once' },
  },
  af_sound_playground: {
    recap: [
      'Every property from Foundations of Sound acts on one sound at once, and only some of them change what you hear.',
      'Double the frequency and the wavelength halves: about 1.18 m at 290 Hz, about 0.59 m at 580 Hz.',
      'A square wave holds odd harmonics only, and a low-pass filter shortens the harmonic lines above its cutoff.',
      'Flipping polarity turns one sound’s wave upside down with no audible change; it matters only when two copies meet.',
      'LEVEL here is in dBFS, the digital level you set, not a measured sound level.',
    ],
    next: { route: 'MicLab', title: 'Microphone Principles', why: 'what a microphone does with the sound wave you just explored' },
  },
  af_mic_principles: {
    recap: [
      'A mic is a small generator with a direction: it turns sound into a voltage, and its pickup pattern is a map of where it hears.',
      'A mic’s null, the direction it hears least, decides what it ignores.',
      'Distance sets the voice-to-room balance: close sound means more direct sound than room, not just more level.',
      'Directional mics get bassier up close, and off-axis sound is duller as well as quieter.',
      'Cupping a mic erases its null and invites feedback, the howl of a mic hearing its own speaker.',
    ],
    next: { route: 'WaveLab', title: 'Wave Physics Laboratory', why: 'how sound waves bounce, bend and add up in rooms and open air' },
  },

  // ══ AUDIO FUNDAMENTALS · ACOUSTICS ═══════════════════════════════════════
  af_wave_physics: {
    recap: [
      'Sound reflects, is absorbed, scatters and bends, and bass behaves differently from highs at every step.',
      'Two copies of one sound add in some places and at some frequencies and cancel in others: interference, comb filtering and room modes.',
      'One loudspeaker sounds different at every seat; aim, array length, delay and polarity change where its sound goes.',
      'Moving a mic, a speaker or a listener often fixes what EQ can’t.',
    ],
    next: { route: 'SpeakerLab', title: 'Speaker Placement & Coverage', why: 'where a loudspeaker goes so its sound reaches every seat' },
  },
  af_speaker_coverage: {
    recap: [
      'A loudspeaker works like a flashlight for sound: its position, aim and pattern decide who stands in the beam.',
      'A narrow pattern reaches deeper, while a wide one is quieter at every distance.',
      'Height plus down-tilt evens out the front and back rows, which is why speakers fly.',
      'Where one box can’t reach everyone, front fills cover the front rows and time-aligned delay speakers cover the back.',
    ],
    next: { route: 'RoomDesignLab', title: 'Room Design & Monitoring', why: 'the room around your speakers: its modes, reflections and treatment' },
  },
  'room-design': {
    recap: [
      'Room work follows an order: shape and surfaces, then speaker and seat geometry, then modes and reflections, then treatment.',
      'In a stereo triangle, equal left and right distances keep the center image steady.',
      'Bass changes from seat to seat because each room mode has its own peaks and nulls.',
      'Absorbers at reflection points tame mids and highs; corner traps and thickness, not more thin panels, reach the bass.',
      'A model shows where problems are likely; a measurement in the real room has the last word.',
    ],
    next: { route: 'DigitalLab', title: 'Digital Audio Systems', why: 'how sound becomes numbers in a computer, and back again' },
  },

  // ══ AUDIO FUNDAMENTALS · SIGNAL ══════════════════════════════════════════
  af_digital_audio: {
    recap: [
      'A converter measures a voltage two separate ways: in time (sample rate, which sets bandwidth) and in level (bit depth, which sets the noise floor).',
      'A tone above Nyquist, half the sample rate, folds down as an alias, so the filter must come before sampling.',
      'A DAC outputs one smooth wave, not stair steps, and a peak can hide between samples.',
      'Clipping at or before the converter is permanent: floating point can’t repair it.',
      'Jitter is the right voltage measured at the wrong moment, and it matters only where a clock times a conversion.',
    ],
    next: { route: 'MeterLab', title: 'Visual Audio Analysis', why: 'what each meter and display shows about a signal' },
  },
  // Also the end screen of Signal Detective, a module of this lab (MeterModule).
  af_visual_analysis: {
    recap: [
      'Every meter answers one question. Peak: will it clip? VU and LUFS: how loud does it feel? Spectrum: which frequencies? Correlation: will it survive mono?',
      'Peak, VU and LUFS meters read the same sound differently, so engineers read several displays together.',
      'A spectrum, a spectrogram and a waterfall are read by their axes first: what runs across, and what runs up.',
      'Level and decay are different things: EQ changes how high a frequency stands, treatment changes how long it lasts.',
      'A correlation near −1, or a lot of Side, can make a mix thin out or cancel in mono.',
    ],
    next: { route: 'SignalChainLab', title: 'Signal Chain Builder', why: 'how one processor’s output becomes the next one’s input' },
  },
  af_signal_chain: {
    recap: [
      'Each stage works on what the one before hands it, so switching one unit in changes what every later unit does.',
      'EQ placed before a compressor changes what the compressor reacts to.',
      'This rack’s order is fixed, but most engineers gate before they compress, so compression never raises the noise floor.',
      'The limiter goes last, and GR shows how many decibels COMP, GATE and LIMIT are turning down.',
    ],
    next: { route: 'CableLab', title: 'Cable & Connector Fundamentals', why: 'what travels on each cable, and what a connector does and doesn’t tell you' },
  },
  af_cables: {
    recap: [
      'Cables in an audio system carry twelve different kinds of thing, from a mic’s few thousandths of a volt to loudspeaker current, data, clock and AC power.',
      'Professionals name what travels first, because its level and kind decide the cable; the connector comes after.',
      'XLR is not automatically a mic, and TRS is not automatically stereo or balanced: the wiring and the gear decide.',
      'Identical connectors can hide cables built for different jobs, and an instrument cable must never stand in for a speaker cable.',
      'Each AC conductor has one role, line (hot), neutral or safety ground, and lifting the safety ground is never the cure for hum.',
    ],
    next: { route: 'ConnectorSelectLab', title: 'Audio Connectors & Cable Selection', why: 'the right cable for each real system, and the fault when it hides' },
  },
  'connector-select': {
    recap: [
      'Connector, cable construction and signal are three different things; a plug that fits tells you nothing about the other two.',
      'Every connection is judged by four questions, in order: does it fit, what signal does the equipment expect, is the cable built for it, and is it safe?',
      'A powered loudspeaker is fed line level; a passive loudspeaker is fed amplifier power on heavy cable.',
      'A turntable’s phono signal needs a PHONO input’s extra gain and tone curve; through a line input it sounds faint and thin.',
      'A continuity tester proves a path exists, but it can’t show cable type, gauge, shielding or impedance.',
    ],
    next: { route: 'CableInstallLab', title: 'Cable Dressing & Installation', why: 'how cable is routed, supported, protected and labeled once it is chosen' },
  },
  af_cable_install: {
    recap: [
      'Installation is a chain of decisions, route, support, protection, separation, identity and inspection, not neat-looking wire.',
      'Every rule has a source: a code or regulation, an industry standard, a manufacturer requirement or professional practice.',
      'Bend, tension and restraint limits belong to each specific cable, and sag grows with the square of the gap between supports.',
      'No single separation distance keeps signal cable quiet; power and signal stay apart, and cross near a right angle where they must meet.',
      'A cable’s identity is labels at both ends plus records that match reality, with service slack planned, not left over.',
    ],
    next: { route: 'PatchbayLab', title: 'Patchbay Signal Flow & Normalling', why: 'how a patchbay connects the gear, and what each patch changes' },
  },
  patchbay: {
    recap: [
      'On most bays, the top jack is the source and the bottom jack is the destination.',
      'Thru pairs connect nothing until you patch; full-normal pairs break on either jack; common half-normal pairs break only on the bottom jack.',
      'A normal is a spring contact inside the jack, and a plug physically opens it.',
      'On a common half-normal pair, a top plug taps a copy without interrupting; a bottom plug replaces the source.',
    ],
    next: { route: 'GainLabHome', title: 'Gain Staging', why: 'healthy levels at every stage of the chain, from input to output' },
  },
  af_gain_staging: {
    recap: [
      'Gain staging means a healthy level at every stage: high enough above the noise, low enough below overload.',
      'Input gain is the first and most important gain decision, and its right setting depends on the source.',
      'Hiss and clipping made early travel downstream; a fader lowers the level but can’t remove clipping made before it.',
      'A problem is fixed at the stage where it starts, found by checking one stage at a time for the first place it appears.',
    ],
    next: { route: 'EqLab', title: 'Equalizer', why: 'the first processor in the chain: one EQ band and what it changes' },
  },

  // ══ ADVANCED TRAINING · MIXING ═══════════════════════════════════════════
  'mixing-beg': {
    recap: [
      'Mixing is a sequence of listening decisions, not a stack of plugins: every move changes level, frequency, left-right place, distance or change over time.',
      'This lab’s suggested order: prepare, know the signal path, keep headroom, balance, subtract, pan, EQ, compress, add space, route, automate, check and export.',
      'Headroom is the space between your peaks and the 0 dBFS ceiling, and louder tends to sound better, so levels are matched before comparing.',
      'Cue sends are usually pre-fader and effect sends post-fader; conventions vary by desk.',
      'A mix is finished only after checks: matched bypass, references, quiet listening, mono and several playback systems.',
    ],
    next: { route: 'AdvancedMixingLab', title: 'Advanced Mixing', why: 'complex routing, parallel paths, phase, translation, stems and delivery' },
  },
  'mixing-adv': {
    recap: [
      'An advanced mix moves through stages: set priorities, organize and route, process, check translation, deliver stems and files, then diagnose and repair.',
      'Shared processing needs a shared audio path: one compressor on the summed kit reacts to every drum at once.',
      'Parallel processing keeps the untouched signal in charge, with a processed copy underneath.',
      'Two mics on one source pick it up at different times, and summed they comb the tone; a polarity flip can’t undo a delay.',
      'Width added by turning up the side is energy a mono fold can’t keep.',
    ],
    next: { route: 'MasteringLab', title: 'Mastering Lab: From Final Mix to Release', why: 'the last listening, decision and delivery stage after the mix' },
  },
  mastering: {
    recap: [
      'Mastering is the last listening, decision and delivery stage, and it works on the finished stereo program, never on the separate tracks inside it.',
      'A problem with one element inside the mix calls for a mix revision, because a stereo master can’t single out one instrument.',
      'Louder isn’t better, only louder, so fair comparisons happen at matched loudness.',
      'Every judgment depends on the room and one moderate, repeatable monitoring level measured with a meter.',
      'A master is finished only when the right files reach the destination and pass a final check on the files themselves.',
    ],
    next: { route: 'MixingGuides', title: 'Mixing Guides', why: 'what each music style’s audience expects, and where its mix starts' },
  },
  'mixing-guides': {
    recap: [
      'Each music style’s audience expects something different from a mix.',
      'Every mix decision follows from what that audience listens for: balance first, then EQ, compression, effects, vocals and loudness.',
      'Reading styles side by side shows what one style puts up front and another keeps in the background.',
      'Every value is a suggested starting point, not a rule: check against a reference in the style, matched in level.',
    ],
    next: { route: 'EarTrainingLab', title: 'Ear Training Lab', why: 'naming the changes you hear, then seeing them measured' },
  },

  // ══ ADVANCED TRAINING · PRODUCTION WORKFLOW ══════════════════════════════
  preprod: {
    recap: [
      'Pre-production decides what is made, for whom, by whom, when, for how much and how it is captured, before anyone records.',
      'A production is defined by its purpose, audience, scope, one approver and a checkable meaning of “finished”, before any gear is chosen.',
      'Every deliverable needs a format, a destination and a specification set by that destination.',
      'The input list is the document everything on the day is patched from: each source, how it is captured, and its channel.',
      'A plan is ready when its decisions are made and its blockers fixed or accepted in writing by a named person; a high score can’t outrank a blocker.',
    ],
    next: { route: 'StagePlotLab', title: 'Stage Plot and Channel Designer', why: 'the stage plot and input list a venue’s engineer works from' },
  },
  postprod: {
    recap: [
      'Post-production is a chain of jobs in order: organize, edit, build, mix, finish to the specification, deliver and archive.',
      'The originals are protected first, and a copy is proven by its content, a checksum, not a file count, before the cards are cleared.',
      'Recorders on free-running clocks drift apart, so sync is checked at the end of the longest file.',
      'A null test plays the stems against the approved mix with polarity flipped: if they match, the sum is silence.',
      'Exported, uploaded, received, verified and accepted are five different steps; only accepted means delivered.',
    ],
    next: { route: 'MasteringLab', title: 'Mastering Lab: From Final Mix to Release', why: 'the last listening, decision and delivery stage before release' },
  },

  // ══ ADVANCED TRAINING · LIVE SOUND REINFORCEMENT ═════════════════════════
  // Sound Systems Lab: one end screen per mode (SsPagedLab), keyed by the
  // mode's labId (soundsystems/units.ts). Each points to the next mode, in
  // the order the lab's LEARN wrap-up page names them.
  'sound-systems-learn': {
    recap: [
      'Every live system does the same jobs in order: pick up the sound, bring it to the console, process it, amplify it and turn it back into sound.',
      'A subgroup sums audio, an aux copies channels into a new mix, a matrix mixes finished buses, and a DCA moves faders but carries no sound.',
      'Doubling the power gains only 3 dB, but doubling the distance loses 6 dB.',
      'Gain before feedback is won first with geometry, then with lower stage level, and only last with an equalizer.',
      'The source-forward method reads each station in signal order and stops at the first reading that changes.',
    ],
    next: { route: 'SoundSystemsBuild', title: 'Sound Systems · Build', why: 'the gear placed and connected on a venue plot, every link checked' },
  },
  'sound-systems-build': {
    recap: [
      'A sound system is a chain of links, and every link must carry the right level into the right input.',
      'A loudspeaker on the plot stays silent if any link between it and a source is missing or refused.',
      'A digital stagebox puts the preamps on stage and turns the snake into one network cable carrying every channel both ways.',
      'In a passive system the processor holds the crossover and the limiters that protect each box.',
      'Delay loudspeakers wait for the main speakers’ sound: at 20 °C, sound takes about 2.9 ms per meter.',
    ],
    next: { route: 'SoundSystemsRoute', title: 'Sound Systems · Route', why: 'the console under your fingers: sends, subgroups, DCAs, matrices and the patch' },
  },
  'sound-systems-route': {
    recap: [
      'An insert sends the whole channel through a processor; a send or a direct out takes a copy and leaves the channel untouched.',
      'Monitor sends are pre-fader, so house fader moves never change a wedge; effect sends are post-fader, so the reverb follows its vocal.',
      'A DCA only moves faders, so pre-fader sends ignore it; a subgroup is a real bus the audio flows through.',
      'A matrix builds outputs from the finished mix, each with its own level: front fills, an overflow room, a recording.',
      'The cable decides where sound goes, the patch decides what travels in it, and a written patch list lets anyone rebuild the system.',
    ],
    next: { route: 'SoundSystemsOperate', title: 'Sound Systems · Operate', why: 'power-up, line check, gain structure, ring-out and shutdown, in order' },
  },
  'sound-systems-operate': {
    recap: [
      'Power comes up from the source end with the amplifiers last, and they go off first: a thump reaches the loudspeakers only through them.',
      'A line check tests one path at a time before the band arrives, outputs first, then every input.',
      'Gain is set from the front: preamp first, the middle stages near unity, the amplifier last, with headroom at every stage.',
      'The ring-out order: reposition first, notch only what still rings, then set the level, one wedge at a time.',
      'Written scenes, patch lists, positions and delay times let the next engineer rebuild the same system and the same sound.',
    ],
    next: { route: 'SoundSystemsTroubleshoot', title: 'Sound Systems · Troubleshoot', why: 'twenty-two faults on the bench, found by reading each station in order' },
  },
  'sound-systems-troubleshoot': {
    recap: [
      'A symptom already tells you which stations work, so the walk starts where the doubt begins, not always at the microphone.',
      'Reading each station in signal order and stopping at the first change finds the fault with the fewest checks.',
      'Clipping, hum and over-compression are added at one stage and inherited by every later one.',
      'In a routing fault nothing is broken: the signal is healthy, but a send, an assignment or a patch points it to the wrong place.',
      'Two loudspeakers playing the same sound add up only when they arrive in time and in the same polarity.',
    ],
    next: { route: 'DJSystemsLab', title: 'DJ Systems Lab', why: 'a two-deck booth as one chain, from player to PA' },
  },
  'dj-systems': {
    recap: [
      'A real booth works in order: safe level and time first, then the path from player through cable and mixer to the PA.',
      'A turntable needs a phono stage, which lifts a very weak signal by about 36 dB.',
      'Headphone cue is a private, pre-fader feed: the next track is heard and prepared while the room hears the other deck.',
      'Trim sets how much signal enters the channel; the fader only sets how much of it goes to the mix.',
      'Beatmatching needs the same tempo and the beats lined up, and a beatgrid is only the software’s guess at where the beats are.',
    ],
    next: { route: 'StagePlotLab', title: 'Stage Plot and Channel Designer', why: 'the stage plot and input list a venue’s engineer works from' },
  },
  'stage-plot': {
    recap: [
      'A stage plot is drawn from above with the audience at the bottom; stage right is the performer’s right, on the left of the drawing.',
      'A source is not an input: a drum kit can need six inputs, a stereo source needs two, and an acoustic instrument can need none.',
      'A mix is what a performer hears and a monitor device is what plays it; one mix can feed several devices.',
      'A packet joins the stage plot, input list and monitor plan from one revision, and an open question is printed, not hidden.',
      '“Ready to advance” means the document is prepared for discussion, not that the venue has agreed.',
    ],
    next: { route: 'MikingHub', title: 'Miking Labs', why: 'where each microphone on the input list goes on the instrument' },
  },

  // ══ ADVANCED TRAINING · GAME AUDIO ═══════════════════════════════════════
  // Lines 1–2 are GA_END_GUIDE.teaches lines 1–2 (SHARED_API.md S2 §3).
  'game-audio': {
    recap: [
      'Game sound is built from behaviors that wait to be asked for: events start sounds, and switches, states and parameters shape them.',
      'Every sound has a place in a mix and a share of a budget; priority decides what is stopped first.',
      'A positioned sound needs an emitter, where it comes from, and a listener, where it is heard from and which way it faces.',
      'A blocked direct path, sound through a wall, reflections, reverberation and bending through a doorway are five different things.',
      'A networked game usually sends events, not audio, so each machine plays the sound for its own listener.',
    ],
    next: { route: 'BinauralLab', title: 'Binaural Panner', why: 'how two ears place a sound around a listener, as headphone 3D does' },
  },

  // ══ ADVANCED TRAINING · EQUALIZATION ═════════════════════════════════════
  // `eq` is the Equalizer (LabShell / LabCheckEnd 'eq'). The EQ Lab's two end
  // screens (EqLabHomeScreen, EqModuleScreen) pass `eq-lab`: its check block
  // also uses the check id 'eq', so the end-screen key had to differ.
  eq: {
    recap: [
      'An EQ band has three settings: frequency is where it works, gain is how much, and Q is how wide.',
      'The Q number and the width move in opposite directions: Q = center frequency ÷ bandwidth, so a bigger Q is a narrower band.',
      'A high-pass filter has no gain: it removes one end at a slope, a rate in dB per octave.',
      'A boost uses up headroom, so cutting a problem is often cleaner; a parametric band reaches a problem a graphic EQ’s fixed bands can miss.',
    ],
    next: { route: 'EqLabHome', title: 'EQ Lab', why: 'seeing, shaping and diagnosing frequency content, module by module' },
  },
  'eq-lab': {
    recap: [
      'EQ changes the balance of frequency content: where (frequency), how much (gain) and how wide (Q).',
      'The EQ family is a bell, two shelves, two pass filters and a notch; high-pass and low-cut are one filter with two names.',
      'Slope is a rate, how fast a cut grows beyond the cutoff in dB per octave, not a width.',
      'Real EQs run several filters at once, and the combined curve, not any single band, is what the signal gets.',
      'A diagnosis is a method: where first, then how much, then how wide.',
    ],
    next: { route: 'CompressionLab', title: 'Compression', why: 'from which frequencies are loud to when the sound is loud' },
  },

  // ══ ADVANCED TRAINING · DYNAMICS ═════════════════════════════════════════
  compression: {
    recap: [
      'A compressor turns down level that goes over the threshold, and the ratio sets how hard.',
      'Attack and release set how fast it grabs the hit and lets go of the tail.',
      'GR, gain reduction, shows how many dB it is turning down right now.',
      'Makeup gain sets the output level, so compressed and uncompressed sound are compared at matched level.',
    ],
    next: { route: 'GateLab', title: 'Gate / Expander', why: 'the processor that works on the other side of the threshold' },
  },
  gate: {
    recap: [
      'A gate turns down sound that falls below its threshold; sound above the threshold passes unchanged.',
      'RANGE sets how far a closed gate turns the sound down: a partial floor lets leakage duck instead of vanishing.',
      'HOLD and a longer RELEASE stop a gate from chattering when a decaying note hovers at the threshold.',
    ],
    next: { route: 'LimiterLab', title: 'Limiter', why: 'a ceiling on your level: the compressor with its ratio pushed toward infinity' },
  },
  limiter: {
    recap: [
      'A limiter puts a ceiling on level: like a compressor with its ratio pushed toward infinity, it pulls anything over the ceiling down to it.',
      'GR shows how far the input sits over the ceiling, and a GR of 0 is fine.',
      'Engineers put nothing after a limiter that could raise the level again.',
      'Playback and MP3 encoding rebuild the smooth wave, so a final master uses true-peak detection and leaves a margin.',
    ],
    next: { route: 'SmartProcessorsLab', title: 'Smart Processors Lab', why: 'processors that listen first, starting with the de-esser' },
  },
  deesser: {
    recap: [
      'Sibilance is the hiss of S, SH and CH: an S sits mostly at 4–10 kHz, SH and CH nearer 2–5 kHz.',
      'A de-esser is a compressor with a filtered ear: the filter steers only the decision, not the sound.',
      'It acts only while there is an S; a static EQ cut would dull every vowel too.',
      'Threshold decides when it acts and Range limits how far; a suggested starting Range is 4–6 dB.',
      'Broadband ducks the whole voice on each S; split-band touches only the hiss, and pushed too far turns an S into a TH.',
    ],
    next: { route: 'DelayLab', title: 'Delay', why: 'from level over time to time itself: echoes, slapback and feedback' },
  },

  // ══ ADVANCED TRAINING · TIME EFFECTS ═════════════════════════════════════
  delay: {
    recap: [
      'A delay plays a copy of your sound back later as separate echoes: TIME sets the gap, FDBK how slowly the repeats fade.',
      'Feedback changes how many repeats there are and how slowly they fade, never their spacing.',
      'A delay time can follow the tempo: one beat lasts 60,000 ÷ BPM milliseconds.',
      'A slapback lands about 60–150 ms behind the sound and does not come back again.',
      'Repeats usually sit quieter and darker than the dry sound, as real echoes lose their highs.',
    ],
    next: { route: 'ReverbLab', title: 'Reverb', why: 'thousands of reflections blurred into one wash, and what shapes it' },
  },
  reverb: {
    recap: [
      'Reverb is thousands of reflections arriving so close together that they blur into one smooth wash.',
      'RT60 is a time, how long the tail lasts, not an amount of reverb.',
      'PRE-DLY sets when the tail starts, and DAMP how fast its highs fade.',
      'The reverb mix sets how near or far a source sounds.',
    ],
    next: { route: 'ChorusLab', title: 'Chorus', why: 'a delay that never sits still: one sound turned into two players' },
  },

  // ══ ADVANCED TRAINING · MODULATION ═══════════════════════════════════════
  chorus: {
    recap: [
      'Chorus mixes your dry sound with a copy delayed by 15–35 ms, and an LFO, a slow steady wobble, keeps moving that delay.',
      'The moving delay bends the copy’s pitch a little; the shimmer comes from the dry sound and the copy beating together.',
      'At 100% the dry sound leaves the mix entirely, and with it the beating that makes the shimmer.',
      'A flanger’s delay is only a few milliseconds, and a wide chorus needs a mono check.',
    ],
    next: { route: 'FlangerLab', title: 'Flanger', why: 'a far shorter moving delay that carves sweeping notches' },
  },
  flanger: {
    recap: [
      'A flanger mixes your sound with a copy delayed by only a few milliseconds, which cancels wherever it arrives half a cycle late.',
      'The notches repeat at even steps in Hz, like the teeth of a comb, so this is called a comb filter.',
      'The delay sets the notch spacing, and an LFO moves the delay so every notch slides together: the jet.',
      'A test source needs energy at every frequency to show a flanger.',
    ],
    next: { route: 'PhaserLab', title: 'Phaser', why: 'uneven dips made with phase shift instead of delay' },
  },
  phaser: {
    recap: [
      'A phaser sends your sound through all-pass stages: filters that pass every frequency at full strength but shift its phase.',
      'Mixed with the dry sound, any frequency shifted half a cycle cancels and leaves a dip.',
      'Every two stages make one dip, and the dips sit unevenly, unlike a flanger’s even comb.',
      'Nothing is delayed in a phaser: an LFO slides the dips up and down, and too much resonance rings.',
    ],
    next: { route: 'PhaseLab', title: 'Phase', why: 'why a polarity flip and a time delay are different, and what mono reveals' },
  },

  // ══ ADVANCED TRAINING · DISTORTION & SATURATION ══════════════════════════
  distortion: {
    recap: [
      'Distortion bends the shape of a wave, and a bent wave contains new frequencies called harmonics.',
      'Turning up the level or using EQ can’t create harmonics; only reshaping can, and the shape of the bend decides which appear.',
      'Distortion can create aliasing, frequencies above half the sample rate that fold back off-key; oversampling keeps most of it out.',
      'Parallel distortion works when the distorted copy sits under the clean one.',
    ],
    next: { route: 'FmLab', title: 'FM Synthesis', why: 'another way to make new frequencies: sidebands from just two sines' },
  },

  // ══ ADVANCED TRAINING · PHASE ════════════════════════════════════════════
  phase: {
    recap: [
      'A polarity flip turns a wave upside down, the same at every frequency; a delay shifts its phase by a different amount at each frequency.',
      'An upside-down copy adds up to silence in mono.',
      'A fixed delay between L and R combs in mono, and a polarity flip can’t remove those notches.',
      'The correlation reading tells you how L and R will sound when they are added into mono.',
    ],
    next: { route: 'StereoLab', title: 'Stereo Imaging', why: 'width, pan and Mid/Side, and what a mono fold does to them' },
  },

  // ══ ADVANCED TRAINING · SYNTHESIS & SOUND DESIGN ═════════════════════════
  oscillator: {
    recap: [
      'An oscillator, a synth’s sound source, repeats one wave shape, and every repeating wave is a stack of sines called harmonics.',
      'The harmonic recipe sets the timbre, the tone color; the fundamental, F0, sets the pitch.',
      'Sine, square, triangle, saw and pulse differ in which harmonics each holds and how fast they fall.',
      'A pulse wave’s duty cycle changes its mix of harmonics, never its pitch: at 25% every 4th harmonic goes.',
      'Digital audio can’t hold anything above Nyquist, half the sample rate; a harmonic past it lands at a wrong frequency.',
    ],
    next: { route: 'NoiseLab', title: 'Noise', why: 'sound with no pitch at all: energy spread across every frequency' },
  },
  noise: {
    recap: [
      'Noise is sound with no pitch: energy spread across every frequency at once.',
      'Its color names the balance of lows and highs as a slope: white 0, pink −3, brown −6, blue +3 and violet +6 dB per octave.',
      'Pink falls 3 dB per octave, so an octave-band analyzer, the kind used on rooms and speakers, reads it flat.',
      'White noise is a common raw source in synthesis, for sounds like a snare’s rattle or wind.',
    ],
    next: { route: 'HarmonicLab', title: 'Harmonics', why: 'a pitched tone’s recipe, built one harmonic at a time' },
  },
  harmonic: {
    recap: [
      'Most steady pitched sounds are a stack of harmonics: the fundamental (F0) plus whole-number multiples of it, which move with it.',
      'Which harmonics are there, and how loud each one is, makes the timbre: the tone color.',
      'A sine has only the fundamental, a saw has every harmonic, and square and triangle use odd ones only.',
      'The spectrum shows timbre better than the wave’s shape.',
    ],
    next: { route: 'DistortionLab', title: 'Distortion', why: 'how bending a wave adds harmonics that were never played' },
  },
  fm: {
    recap: [
      'In FM, one sine, the modulator, wobbles the phase of another, the carrier, and that creates sidebands.',
      'Sidebands sit on both sides of the carrier, at carrier ± 1, 2, 3… × modulator, so the modulator sets their spacing.',
      'RATIO decides where they land: whole-number and simple ratios sound pitched, other ratios sound like bells.',
      'INDEX decides how far their energy spreads, and a falling index gives FM bells and electric pianos.',
      'Sidebands pushed past 24 kHz fold back as aliasing.',
    ],
    next: { route: 'ModularLab', title: 'Modular Synth', why: 'a whole synth voice, patched module by module' },
  },
  modular: {
    recap: [
      'Sound travels VCO, VCF, VCA to OUT: the oscillator makes a bright wave, the filter carves harmonics away and the amplifier sets the loudness.',
      'SEQ, LFO and ENV make no sound: their cables carry control voltage (CV), which turns another module’s setting.',
      'One LFO makes different effects depending on where it goes, and above about 20 Hz it adds new tones, the sidebands of FM.',
      'An envelope, attack, decay, sustain and release, shapes how each note starts and ends.',
    ],
    next: { route: 'EnvelopeLab', title: 'Sound Envelope & Transients Lab', why: 'how a sound’s level rises, holds and fades at its source' },
  },
  envelope: {
    recap: [
      'An envelope is the shape of a sound’s loudness over time: attack, decay and release are times, and sustain is a level.',
      'Rise time is measured from 10% to 90% of the peak, so it is always a little shorter than the attack itself.',
      'Crest factor is the gap between one sound’s peak and its average level; dynamic range spans a whole performance.',
      'The tail a room adds is reverberation, not the source’s release: a snare’s own envelope is the same near or far.',
    ],
    next: { route: 'CompressionLab', title: 'Compression', why: 'the processor that changes a sound’s level over time' },
  },

  // ══ ADVANCED TRAINING · STEREO & SPATIAL ═════════════════════════════════
  stereo: {
    recap: [
      'WIDTH sets the level of the side signal (what differs between left and right) against the mid (what they share).',
      'Folded to mono, the side signal cancels, so extra width can disappear and leave the mix hollow.',
      'Lows are usually kept mono below roughly 100–150 Hz, a suggested starting point, so the bass stays solid on most systems.',
      'A correlation meter near −1 warns that a mono listener will hear heavy cancellation.',
    ],
    next: { route: 'BinauralLab', title: 'Binaural Panner', why: 'how two ears place a sound around you, beyond left and right' },
  },
  binaural: {
    recap: [
      'A sound to one side reaches the far ear later, up to about 0.7 ms: the interaural time difference (ITD).',
      'The head blocks highs more than lows: the head shadow, or interaural level difference (ILD).',
      'Binaural works on headphones: speakers send both channels into the room, and both ears pick up both (crosstalk).',
      'The head here is a plain sphere with no outer ears, so some directions stay vague; noise is easier to place than a low, steady tone.',
    ],
    next: { route: 'BeginningMixingLab', title: 'Beginning Mixing', why: 'a repeatable process that gives every processor its place in a mix' },
  },

  // ══ ADVANCED TRAINING · PITCH & TUNING ═══════════════════════════════════
  autotune: {
    recap: [
      'Pitch correction measures each sung note, finds the nearest line on a grid, and pulls the note toward it.',
      'Pitch error is counted in cents: 100 cents make one semitone, and a cent is a ratio, not a fixed number of hertz.',
      'AMOUNT sets how much of a note’s error is removed, and SPEED how fast.',
      'At its fastest SPEED gives the robotic “hard-tune” effect; slower, a voice’s natural glides and vibrato survive.',
    ],
    next: { route: 'TuningLab', title: 'Tuning & Temperament Lab', why: 'what the grid of notes is built from, and other ways to build it' },
  },
  tuning: {
    recap: [
      'An interval is a frequency ratio, not a fixed gap in hertz: cents count 1200 to an octave and 100 to an equal semitone.',
      'Twelve pure fifths overshoot seven octaves by the Pythagorean comma, 23.46 ¢, so the circle of pure fifths doesn’t close.',
      'Every tuning system decides where that comma goes: Just intonation, meantone and equal temperament each keep different intervals pure.',
      'Equal temperament uses twelve equal ratios: its fifth is about 1.96 ¢ narrow and its major third about 13.69 ¢ wide.',
      'Two nearly equal pitches played together beat at the difference between their frequencies.',
    ],
    next: { route: 'HarmonographLab', title: 'Harmonograph', why: 'the same interval ratios, drawn as living figures' },
  },
  'drum-tuning': {
    recap: [
      'A drum is a system: two heads, a shell with bearing edges, hoops, rods, lugs and the air inside.',
      'Tension sets pitch, and a bigger or heavier head sits lower at the same tension.',
      'One rod moves its own lug’s pitch and the head’s evenness, which is why tuning is done lug by lug.',
      'The method runs in order: seat the head, finger-tighten, tighten in a star pattern, tap near each lug, adjust, then play from the seat.',
      'Hardware faults often sound like tuning faults, and the ears make the final call, not a number.',
    ],
    next: { route: 'EarTrainingLab', title: 'Ear Training Lab', why: 'naming the changes you hear, then seeing them measured' },
  },

  // ══ ADVANCED TRAINING · SOUND VISUALIZATION ══════════════════════════════
  // `cymatics` serves both hosts: the studios' CHECK (LabShell / LabCheckEnd)
  // and the lab home's own end screen.
  cymatics: {
    recap: [
      'Sand gathers on a plate’s still lines, its nodes, and a clean figure forms only near a resonance.',
      'A frequency has no shape of its own: the figure belongs to the object, not the tone.',
      'Plate and drum modes are not whole-number multiples, so their pitch is vague; a timpani’s kettle pulls its modes close to 1 : 1.5 : 2.',
      'A liquid shaken up and down answers at half the shake frequency, in Faraday waves, and needs enough push to beat damping.',
      'Every pattern here is a simulation: it shows what a physics model predicts.',
    ],
    next: { route: 'DrumTuningLab', title: 'Drum Tuning Lab', why: 'how a real drum’s heads are tuned, lug by lug' },
  },
  harmonograph: {
    recap: [
      'A musical interval is a frequency ratio: 2:1 is the octave, 3:2 the fifth, 4:3 the fourth and 5:4 the major third.',
      'A simple ratio keeps bringing the pen back to where it started, so the figure closes.',
      'A slight detune never quite closes, and it can be heard as well as seen.',
      'Damping and phase change the drawing, but neither changes the interval.',
    ],
    next: { route: 'CymaticsLab', title: 'Cymatics Lab: Sound Made Visible', why: 'what a vibrating plate, liquid or drumhead shows, and what it doesn’t' },
  },

  // ══ ADVANCED TRAINING · INSTRUMENTS & RECORDING ══════════════════════════
  bass: {
    recap: [
      'Pressing a fret shortens the vibrating part of the string, so the pitch rises.',
      'Length and frequency change by the same factor, one down, one up: ⅘ of the length gives 5/4 of the frequency.',
      'Simple fractions of a string give the intervals music is built on.',
      'Touching a node lightly lets the whole string keep vibrating in equal parts, so one harmonic sounds: a whole-number multiple of the open string.',
    ],
    next: { route: 'TuningLab', title: 'Tuning & Temperament Lab', why: 'how those string fractions become whole tuning systems' },
  },
  micselect: {
    recap: [
      'Choosing a microphone starts with the job: the source, the place and the production set the priorities.',
      'Those priorities point to characteristics: pattern, response, self-noise, maximum SPL, power and form.',
      'A pattern is a decision about what to reject: cardioid rejects straight behind, and figure-8 rejects the sides.',
      'A type name like “condenser” or a label like “vocal mic” never settles a match on its own; the spec numbers do.',
      'There is no universally best microphone, only one that suits the source, the place, the placement and the production.',
    ],
    next: { route: 'MikingHub', title: 'Miking Labs', why: 'where the chosen mic goes on each instrument, family by family' },
  },
  // Miking Labs: one entry per family (MikingLessonScreen's end screen, keyed
  // `miking-<lesson.labId>`). Lines 1–2 are shared; the rest is the family's own.
  'miking-drums': {
    recap: [
      MIKING_ORDER,
      'The same method covers the drum kit, hand drums, concert drums and speaker cabinets, with a safe clearance kept, studio or live.',
      MIKING_STARTS,
    ],
    next: { route: 'DrumTuningLab', title: 'Drum Tuning Lab', why: 'how the drums you place mics on are tuned, head by head' },
  },
  'miking-percussion': {
    recap: [
      MIKING_ORDER,
      'Struck, shaken and scraped percussion each need the player’s whole motion kept clear, studio or live.',
      'Some instruments, like the electric pianos, offer a direct signal as well as a mic.',
      MIKING_STARTS,
    ],
    next: { route: 'CymaticsLab', title: 'Cymatics Lab: Sound Made Visible', why: 'why struck plates and bells ring without a clear pitch' },
  },
  'miking-winds': {
    recap: [
      MIKING_ORDER,
      'A wind sound starts at the lips, a reed, an air jet or bellows, and leaves through a bell, open holes, the embouchure, reeds or pipes.',
      'Starting points stay clear of the mouth, the hands, the bell, the slide, the keys, the breath and the player’s movement.',
      MIKING_STARTS,
    ],
    next: { route: 'HarmonicLab', title: 'Harmonics', why: 'what gives each instrument its tone color: its harmonic recipe' },
  },
  'miking-strings': {
    recap: [
      MIKING_ORDER,
      'Guitars and their amps, the bowed strings, piano, harp, clavinet and the lutes are miked from starting points that keep clear of the hands and the bow.',
      MIKING_STARTS,
    ],
    next: { route: 'BassLab', title: 'Bass Guitar Physics', why: 'how a string’s length sets its pitch and its harmonics' },
  },
  'miking-ensembles': {
    recap: [
      MIKING_ORDER,
      'A voice is measured from the lips; an ensemble is drawn whole, with main pairs and the three-omni tree.',
      'Support mics are added only for a named need, studio or live.',
      MIKING_STARTS,
    ],
    next: { route: 'SpeechLab', title: 'Speech & Voice Lab', why: 'how a voice is made, from the lungs to the microphone' },
  },
  'miking-field': {
    recap: [
      MIKING_ORDER,
      'Foley keeps the performer’s whole movement clear; location speech works with the camera’s frame, the boom and the body mic.',
      'Headphone, surround and Ambisonic pickup depend on channel maps that keep it right.',
      'A measurement mic or a meter goes where the question asked needs it, with an honest label for the result.',
      MIKING_STARTS,
    ],
    next: { route: 'SpeechLab', title: 'Speech & Voice Lab', why: 'how the speech on a set is made, from the lungs to the microphone' },
  },
  'miking-broadcast': {
    recap: [
      MIKING_ORDER,
      'On air, a voice is measured from the lips, and every open mic is counted and routed.',
      'In sport, every position is approved and clear of play, and commentary, action and audience run as separate feeds.',
      MIKING_STARTS,
    ],
    next: { route: 'SpeechLab', title: 'Speech & Voice Lab', why: 'how speech is made, from the lungs to the microphone' },
  },

  // ══ ADVANCED TRAINING · VOICE & SPEECH ═══════════════════════════════════
  speech: {
    recap: [
      'The lungs power the voice, the vocal folds make the buzz, the cavities shape it, and the tongue, teeth, lips and jaw cut it into words.',
      'Voicing is the only difference inside pairs such as S and Z: the same mouth shape, with the folds off or on.',
      'A vowel is a mouth shape, not a pitch: F1 follows how open the jaw is, F2 whether the tongue is forward or back.',
      'A “P” is a small sound plus a gust of air; a pop filter’s mesh breaks up the gust and lets the sound through.',
      'Distance is the biggest control at the microphone: it sets the direct-to-room balance and costs nothing.',
    ],
    next: { route: 'SmartProcessorsLab', title: 'Smart Processors Lab', why: 'the de-esser: a processor that acts only while it hears an S' },
  },

  // ══ ADVANCED TRAINING · AUDIO ELECTRONICS ════════════════════════════════
  tube: {
    recap: [
      'A hot cathode gives off electrons, a positive plate pulls them across the vacuum, and a control grid between them sets how many get through.',
      'No heat, no electrons, no current, no sound: that is why tube gear needs time to warm up.',
      'A very small voltage on the grid controls a much larger current through the tube, and that is amplification.',
      'Bias is the idle point: too negative flattens the bottom of the wave, too positive the top.',
      'The B+ supply and its filter capacitors hold a charge that can kill, even after the amp is unplugged.',
    ],
    next: { route: 'AmpLab', title: 'Amplifier Principles Lab', why: 'the same ideas carried over to transistors, transformers and amplifier classes' },
  },
  amp: {
    recap: [
      'An amplifier doesn’t create energy: it builds a bigger copy of the input, and the power supply pays for it.',
      'A transformer trades voltage for current and adds no power.',
      'Each amplifier class trades efficiency, heat and distortion; there is no “best” class, and Class D is switching, not digital.',
      'Lower impedance draws more current for the same voltage: I = V ÷ R, and P = Vrms² ÷ R.',
      'Every amplifier runs out of voltage or current somewhere, and each limit leaves a different shape on the waveform.',
    ],
    next: { route: 'SoundSystemsLab', title: 'Sound Systems Lab', why: 'amplifiers, loads and loudspeakers joined into one complete live system' },
  },

  // ══ ADVANCED TRAINING · EAR TRAINING ═════════════════════════════════════
  'ear-training': {
    recap: [
      'Frequencies sit by ear around 1 kHz as the anchor: weight and boom below it, edge and sizzle above.',
      'An octave is a doubling of frequency, and three third-octave steps, each about ×1.26, make one octave.',
      'A 6 dB change is obvious; 1 dB is near the smallest change most people notice.',
      'Louder usually wins a comparison even when nothing else changed, so fair comparisons match loudness.',
      'Each fault leaves a mark an analyzer shows: harmonics of hum from AC power, a raised noise floor, a spike or a hole.',
    ],
    next: { route: 'TuningLab', title: 'Tuning & Temperament Lab', why: 'the ratios behind the intervals you hear' },
  },
};

/** The entry for a lab, or an empty one (nothing extra is drawn). */
export function labEndContentFor(labId: string | undefined): LabEndContent {
  return (labId && LAB_END_CONTENT[labId]) || {};
}
