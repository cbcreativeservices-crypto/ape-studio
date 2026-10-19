/**
 * labTermIntroData — which glossary term opens each lab (owner 2026-10-19).
 *
 * GENERATED from the live glossary on 2026-10-19 (read-only query of
 * `glossary.plain_english`, rows visible in the app = rows with a topic).
 * Every `plainEnglish` below is the glossary text VERBATIM, never a
 * paraphrase; `glossaryId` names the row it came from, so a later glossary
 * edit can be re-copied. Keyed by labTermKey() (labTermIntros.ts).
 *
 *   'wired' — the popup shows (members only, once per lab per device).
 *   'hold'  — no single obvious term, or the glossary row means something
 *             else: NO popup until the owner picks. The candidates and the
 *             suggestion are in Downloads/2026-10-19_LAB_INTRO_TERMS_TO_CHOOSE.md.
 *             To wire one: change it to a wired row with the chosen term,
 *             its exact plain-English text and its glossary id.
 */
export type LabTermEntry =
  | { status: 'wired'; lab: string; term: string; plainEnglish: string; glossaryId: string }
  | { status: 'hold'; lab: string; candidates: readonly string[]; suggested: string | null };

export const LAB_TERM_ENTRIES: Readonly<Record<string, LabTermEntry>> = {
  AmplitudeLab: { status: 'hold', lab: "Understanding Level & Amplitude", candidates: ["Amplitude", "Level"], suggested: "Amplitude" },
  FoundationsCourse: {
    status: 'wired',
    lab: "Foundations of Sound",
    term: "Sound",
    plainEnglish:
      "Sound is a vibration that travels through air or another material. Something vibrates, pushes on the air, and the disturbance spreads out as a wave. Your ears pick up these vibrations and your brain hears them. Sound cannot travel through empty space because there is nothing to carry it.",
    glossaryId: "446db798-ef6e-434f-9e39-e18197e18635",
  },
  FoundationsPlayground: { status: 'hold', lab: "Sound Playground", candidates: ["Sound", "Sound Wave", "Wave"], suggested: "Sound" },
  MicLab: {
    status: 'wired',
    lab: "Microphone Principles",
    term: "Microphone (Mic)",
    plainEnglish:
      "A microphone is the first link in the audio chain. It turns sound in the air into an electrical signal your gear can work with. The types work in different ways. Condenser mics are sensitive and detailed. Dynamic mics are rugged. Knowing your mics is basic to good recording.",
    glossaryId: "651bcc9f-dd53-4c67-8900-92d119497ad2",
  },
  WaveLab: { status: 'hold', lab: "Wave Physics Laboratory", candidates: ["Acoustics", "Wave", "Sound Wave"], suggested: "Acoustics" },
  SpeakerLab: { status: 'hold', lab: "Speaker Placement & Coverage", candidates: ["Speaker Placement", "Coverage", "Dispersion"], suggested: "Speaker Placement" },
  RoomDesignLab: { status: 'hold', lab: "Room Design & Monitoring", candidates: ["Room Acoustics", "Studio Monitor", "Room modes"], suggested: "Room Acoustics" },
  DigitalLab: {
    status: 'wired',
    lab: "Digital Audio Systems",
    term: "Digital Audio",
    plainEnglish:
      "Digital audio is sound stored as a stream of numbers. To create it, the sound is measured many times per second and each measurement is saved as a number. Once stored this way, the audio can be copied, edited, and moved with no added noise or quality loss, which was a problem with older analog tape. This makes it the foundation of modern recording and live sound systems.",
    glossaryId: "e9071a60-cd10-4b1c-a41f-3f033ce9c421",
  },
  MeterLab: { status: 'hold', lab: "Visual Audio Analysis", candidates: ["Metering", "Waveform"], suggested: "Metering" },
  SignalChainLab: {
    status: 'wired',
    lab: "Signal Chain Builder",
    term: "Signal Chain (Signal Path)",
    plainEnglish:
      "The signal chain is the route audio takes - mic, preamp, processing, mixer, output. Knowing the order matters because each stage affects level and tone, and the sequence (e.g. EQ before or after compression) changes the result.",
    glossaryId: "985f3b96-2654-4edc-b1be-4652ab4b1448",
  },
  "MeterModule:detective": { status: 'hold', lab: "Signal Detective", candidates: ["Troubleshooting", "Metering", "Signal flow"], suggested: "Troubleshooting" },
  CableLab: { status: 'hold', lab: "Cable & Connector Fundamentals", candidates: ["Cables (audio)", "Connectors", "Audio cable"], suggested: "Cables (audio)" },
  ConnectorSelectLab: { status: 'hold', lab: "Audio Connectors & Cable Selection", candidates: ["Connectors", "Connector", "Cables (audio)"], suggested: "Connectors" },
  CableInstallLab: {
    status: 'wired',
    lab: "Cable Dressing & Installation",
    term: "Cable dressing",
    plainEnglish:
      "Cable dressing means arranging cables so they are neat and tidy. You route them along clear paths and tie them gently in place. This protects the plugs and makes cables easy to follow. It also keeps power and audio lines apart to avoid noise.",
    glossaryId: "2cd72ce8-81c7-472d-8e37-33468dcf4a74",
  },
  PatchbayLab: { status: 'hold', lab: "Patchbay Signal Flow & Normalling", candidates: ["Patch bay", "patchbay", "Normalling"], suggested: "Patch bay" },
  GainLabHome: {
    status: 'wired',
    lab: "Gain Staging",
    term: "Gain Staging",
    plainEnglish:
      "Gain staging means balancing levels all the way down the signal chain. The aim is that nothing is too quiet, which would let noise show through, and nothing is too loud, which would clip and distort. If you set the levels right early in the chain, the whole path stays clean.",
    glossaryId: "790bc230-ac66-4df0-9bb4-5b1bb439f87f",
  },
  BeginningMixingLab: {
    status: 'wired',
    lab: "Beginning Mixing",
    term: "Mixing",
    plainEnglish:
      "Mixing is where many tracks become one polished piece. You balance levels, place sounds left to right, shape tone, control dynamics, and add effects. The goal is to make everything work together.",
    glossaryId: "5e7e653d-d01d-4cfa-87e9-b81392f97f67",
  },
  AdvancedMixingLab: {
    status: 'wired',
    lab: "Advanced Mixing",
    term: "Mixing",
    plainEnglish:
      "Mixing is where many tracks become one polished piece. You balance levels, place sounds left to right, shape tone, control dynamics, and add effects. The goal is to make everything work together.",
    glossaryId: "5e7e653d-d01d-4cfa-87e9-b81392f97f67",
  },
  MasteringLab: {
    status: 'wired',
    lab: "Mastering Lab: From Final Mix to Release",
    term: "mastering",
    plainEnglish:
      "Mastering is the last polish before release. It balances loudness and tone so songs sound good everywhere.",
    glossaryId: "198ba359-9c41-4dff-9f94-e9358ef41f60",
  },
  MixingGuides: { status: 'hold', lab: "Mixing Guides", candidates: ["Mix", "Mixing"], suggested: "Mix" },
  PreProdLab: {
    status: 'wired',
    lab: "Audio Pre-Production",
    term: "Pre-Production",
    plainEnglish:
      "Pre-production is the planning stage before recording starts. The team sorts out songs, budgets, schedules, and gear. Good planning here saves time and money later. It means fewer surprises once the sessions begin.",
    glossaryId: "0fb3af79-f39d-405b-9abf-61c844330029",
  },
  PostProdLab: {
    status: 'wired',
    lab: "Audio Post-Production",
    term: "Post-production",
    plainEnglish:
      "Post-production is the work after recording ends. Sound gets edited, cleaned, designed, and mixed. Then the finished result is delivered. In film, post is its own entire phase.",
    glossaryId: "02eab4b5-c332-5e14-815e-c951340fcc95",
  },
  SoundSystemsLab: {
    status: 'wired',
    lab: "Sound Systems Lab",
    term: "Sound System",
    plainEnglish:
      "A sound system is all the gear together that turns performers' sound into amplified sound for the audience. That means mics, mixer, amps, and speakers, plus the cables tying them together. It is the whole signal chain from input to loudspeaker.",
    glossaryId: "05d8c0bf-b798-4223-b06e-ef323569e412",
  },
  EqLab: {
    status: 'wired',
    lab: "Equalizer",
    term: "Equalizer",
    plainEnglish:
      "An equalizer boosts or cuts chosen frequencies. It shapes the tone of a sound.",
    glossaryId: "09b3ec3d-8fbe-4a04-8c85-77aa44546a87",
  },
  EqLabHome: {
    status: 'wired',
    lab: "EQ Lab",
    term: "Equalizer",
    plainEnglish:
      "An equalizer boosts or cuts chosen frequencies. It shapes the tone of a sound.",
    glossaryId: "09b3ec3d-8fbe-4a04-8c85-77aa44546a87",
  },
  CompressionLab: { status: 'hold', lab: "Compression", candidates: ["Dynamic range compression", "Compressor", "Compression"], suggested: "Dynamic range compression" },
  GateLab: { status: 'hold', lab: "Gate / Expander", candidates: ["Gate", "Noise Gate", "Expander"], suggested: "Gate" },
  LimiterLab: {
    status: 'wired',
    lab: "Limiter",
    term: "Limiter",
    plainEnglish:
      "A limiter is an extreme compressor with an infinite ratio. You set a threshold, and any signal above it is absolutely stopped from going higher. This protects against surprise clipping. Limiters are essential on the master bus and for safety on inputs. Used right, they are invisible. Used wrong, they squash the sound.",
    glossaryId: "7f621dc4-6d04-4c29-bc61-e6352f8afcd8",
  },
  SmartProcessorsLab: { status: 'hold', lab: "Smart Processors Lab", candidates: ["De-esser", "Dynamics processors", "Sibilance"], suggested: "De-esser" },
  DelayLab: {
    status: 'wired',
    lab: "Delay",
    term: "delay",
    plainEnglish:
      "A delay records your sound and plays it back a moment later, creating an echo. You set how long the gap is and how many times it repeats. This gives you anything from a single tight echo (a slap-back) to long, rhythmic, fading repeats.",
    glossaryId: "24c2c1b2-9449-4a58-b825-551f3c296a38",
  },
  ReverbLab: {
    status: 'wired',
    lab: "Reverb",
    term: "Reverb",
    plainEnglish:
      "Reverb is the lingering wash a space adds to sound. Clap in a hall and the sound hangs in the air. The reverb effect recreates that tail. It makes a recording with no room sound (a 'dry' recording) seem to live inside a space.",
    glossaryId: "cb2ff829-e4dd-5e37-a73a-68399019727c",
  },
  ChorusLab: {
    status: 'wired',
    lab: "Chorus",
    term: "Chorus",
    plainEnglish:
      "Chorus is an effect that makes one sound seem like many. It copies the sound, delays each copy a little, and slowly shifts its pitch. Mixed together, they sound like a group playing as one. It is like one singer turning into a small choir.",
    glossaryId: "d8f9a016-2238-43ee-b5d9-2f1bded98f9c",
  },
  FlangerLab: {
    status: 'wired',
    lab: "Flanger",
    term: "Flanger",
    plainEnglish:
      "A flanger blends a sound with a tiny moving delay of itself. The blend carves a comb of notches that sweeps up and down. It sounds like a jet passing overhead. The name comes from slowing tape reels by hand.",
    glossaryId: "67a6c870-b40a-588c-a463-02587929385e",
  },
  PhaserLab: {
    status: 'wired',
    lab: "Phaser",
    term: "phaser",
    plainEnglish:
      "A phaser splits the signal through a chain of all-pass filters that shift phase differently at different frequencies, then mixes that back with the original. Where the two cancel, you get notches in the spectrum. An LFO sweeps those notches up and down, for the classic swirling sweep. More all-pass stages means more notches and a thicker effect. The LFO rate and depth set how fast and how obvious the sweep is. It differs from a flanger, which makes its comb notches with a short modulated delay.",
    glossaryId: "53870fd2-ddf2-4299-8d29-a0d195e1285e",
  },
  DistortionLab: {
    status: 'wired',
    lab: "Distortion",
    term: "Distortion",
    plainEnglish:
      "Distortion is any change to a signal that adds sound the original did not have. Sometimes it sounds nice, like the warm tone of a tube amp or guitar overdrive. Sometimes it sounds bad, like harsh clipping when a signal is pushed too hard. Engineers measure the extra tones a device adds. These are called harmonic and intermodulation content.",
    glossaryId: "f62fc1ed-05ff-4c60-9f4c-f96ec34400e9",
  },
  PhaseLab: {
    status: 'wired',
    lab: "Phase",
    term: "Phase",
    plainEnglish:
      "Phase is where a wave is in its up-and-down cycle compared to another wave. When two copies line up (in phase) they add together. When one is half a cycle behind (180 degrees) they cancel. Phase drives comb filtering, mono compatibility, and speaker alignment.",
    glossaryId: "a3004045-dce0-4e6d-9a51-f1149c4584a3",
  },
  OscillatorLab: {
    status: 'wired',
    lab: "Oscillators",
    term: "Oscillator",
    plainEnglish:
      "An oscillator is the part of a synth that makes the raw sound. It repeats a wave over and over very fast. How fast it repeats sets the pitch. Other parts then shape this tone.",
    glossaryId: "756698a9-f6c4-4719-bdfd-56044d695b83",
  },
  NoiseLab: {
    status: 'wired',
    lab: "Noise",
    term: "Noise",
    plainEnglish:
      "Noise is everything you didn't want in the signal - electronic hiss and hum, or acoustic background. The goal is a high signal-to-noise ratio so the wanted sound dominates.",
    glossaryId: "dec16fab-229e-46fe-8715-51fc8af9b21a",
  },
  HarmonicLab: {
    status: 'wired',
    lab: "Harmonics",
    term: "Harmonics",
    plainEnglish:
      "Harmonics are extra tones that sit above a note's main pitch. Their pitches are simple multiples of that main pitch. The mix of harmonics gives each instrument its own tone color. A flute and a guitar differ because their harmonics differ.",
    glossaryId: "1a3d423e-5d58-4039-88da-8b2d6cd8e6b1",
  },
  FmLab: { status: 'hold', lab: "FM Synthesis", candidates: ["FM Synthesis", "Frequency modulation"], suggested: "FM Synthesis" },
  ModularLab: {
    status: 'wired',
    lab: "Modular Synth",
    term: "Modular synthesizer",
    plainEnglish:
      "A modular synth is built from separate boxes you wire together. Patch cables decide how the sound flows. Every patch builds a new instrument. Nothing is fixed and nothing is saved — that is the appeal.",
    glossaryId: "d72bd8a0-4b38-5114-b86a-b5a38677b9a1",
  },
  EnvelopeLab: { status: 'hold', lab: "Sound Envelope & Transients Lab", candidates: ["Envelope", "Transient", "ADSR"], suggested: "Envelope" },
  StereoLab: {
    status: 'wired',
    lab: "Stereo Imaging",
    term: "Stereo Imaging",
    plainEnglish:
      "Stereo imaging is where sounds seem to sit between your two speakers. Level and timing differences between the left and right channels place each sound. A good image lets you point to where each instrument sounds like it is.",
    glossaryId: "75592455-aff1-4ec1-9100-a805acac9ee2",
  },
  BinauralLab: { status: 'hold', lab: "Binaural Panner", candidates: ["Binaural rendering", "Binaural sound", "Pan"], suggested: "Binaural rendering" },
  AutotuneLab: { status: 'hold', lab: "Autotune", candidates: ["Pitch Correction", "Auto-Tune"], suggested: "Pitch Correction" },
  TuningLab: { status: 'hold', lab: "Tuning & Temperament Lab", candidates: ["temperament", "Tuning systems", "Equal temperament"], suggested: "temperament" },
  DrumTuningLab: {
    status: 'wired',
    lab: "Drum Tuning Lab",
    term: "Drum Tuning",
    plainEnglish:
      "You tighten or loosen the bolts around a drum head. This sets the drum's pitch and how long it rings. Keeping every bolt at the same tension makes the drum sound clean.",
    glossaryId: "3d488ada-1fd3-4c9a-91d9-3a9b2d122d5f",
  },
  CymaticsLab: {
    status: 'wired',
    lab: "Cymatics Lab: Sound Made Visible",
    term: "Cymatics",
    plainEnglish:
      "Cymatics means making sound patterns you can see. You vibrate a plate or liquid with a tone. Sand or water then forms a clear shape. The shape depends on the pitch and the surface. It shows how the surface vibrates.",
    glossaryId: "4affcf19-496b-5463-b7cf-f022e62e538f",
  },
  HarmonographLab: {
    status: 'wired',
    lab: "Harmonograph",
    term: "Harmonograph",
    plainEnglish:
      "A harmonograph draws pictures with swinging pendulums. One pendulum moves the pen and another moves the paper. Musical ratios between the swings draw beautiful looping figures. As the swinging dies down, the drawing spirals inward.",
    glossaryId: "20aaf2d0-6a59-5d55-b39e-2f0ead18f687",
  },
  BassLab: { status: 'hold', lab: "Bass Guitar Physics", candidates: ["String length", "String harmonic", "Harmonic"], suggested: "String length" },
  MicSelectLab: { status: 'hold', lab: "Microphone Selection Lab", candidates: ["Microphone (Mic)", "miking", "Microphone types"], suggested: "Microphone (Mic)" },
  "MikingHub:drums": { status: 'hold', lab: "Membranophones (Miking Lab 1)", candidates: ["membranophone", "miking"], suggested: "membranophone" },
  "MikingHub:percussion": { status: 'hold', lab: "Idiophones (Miking Lab 2)", candidates: ["Idiophone", "miking"], suggested: "Idiophone" },
  "MikingHub:winds": { status: 'hold', lab: "Aerophones (Miking Lab 3)", candidates: ["Aerophone", "miking"], suggested: "Aerophone" },
  "MikingHub:strings": { status: 'hold', lab: "Chordophones (Miking Lab 4)", candidates: ["Chordophone", "miking"], suggested: "Chordophone" },
  "MikingHub:ensembles": { status: 'hold', lab: "Voice & Ensemble (Miking Lab 5)", candidates: ["miking", "Ensemble"], suggested: "miking" },
  "MikingHub:field": { status: 'hold', lab: "Foley, Field & Scientific (Miking Lab 6)", candidates: ["miking", "Foley", "Field recording"], suggested: "miking" },
  "MikingHub:broadcast": { status: 'hold', lab: "Sports & Broadcast (Miking Lab 7)", candidates: ["miking", "Broadcast"], suggested: "miking" },
  SpeechLab: { status: 'hold', lab: "Speech & Voice Lab", candidates: ["speech chain", "Formant"], suggested: "speech chain" },
  TubeLab: {
    status: 'wired',
    lab: "Vacuum Tube Fundamentals",
    term: "Vacuum tube",
    plainEnglish:
      "A vacuum tube (valve) is a sealed, air-free envelope. A heated cathode sends electrons to a plate, and grids control that flow. It is the amplifying heart of tube amps, preamps, and mics.",
    glossaryId: "687b7510-a5fb-4bef-b058-ce3a3e651c12",
  },
  AmpLab: {
    status: 'wired',
    lab: "Amplifier Principles Lab",
    term: "Amplifier",
    plainEnglish:
      "An amplifier takes a weak signal from a mic, instrument, or line source, and boosts it to a level that can drive speakers or recording gear. Common types are mic preamps (very quiet boosts), line amps (to boost or buffer line-level signals), and power amps (to drive speakers). A good amp adds almost no color - it just makes the signal bigger.",
    glossaryId: "a3eb56c6-2f33-41af-ba4c-382a3a6350c8",
  },
  EarTrainingLab: {
    status: 'wired',
    lab: "Ear Training Lab",
    term: "ear training",
    plainEnglish:
      "It means training your ears the way a musician trains for pitch. You listen to known changes over and over until you recognise them instantly. Then you can hear a boost at a certain frequency, or too much compression, and name it. It turns vague reactions into clear decisions at the desk.",
    glossaryId: "c9f87f96-20eb-44a4-a8fe-5465e49816a2",
  },
  CalcLab: { status: 'hold', lab: "Audio Calculator Laboratory", candidates: ["Decibel", "Sound Pressure Level"], suggested: null },
};
