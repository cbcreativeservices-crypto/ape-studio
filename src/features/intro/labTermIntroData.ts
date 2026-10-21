/**
 * labTermIntroData — which glossary term opens each lab (owner 2026-10-19).
 *
 * GENERATED from the live glossary on 2026-10-19 (read-only query of
 * `glossary.plain_english`, rows visible in the app = rows with a topic).
 * Every `plainEnglish` below is the glossary text VERBATIM, never a
 * paraphrase; `glossaryId` names the row it came from, so a later glossary
 * edit can be re-copied. Keyed by labTermKey() (labTermIntros.ts).
 *
 *   'wired' — the popup shows (members only, once per glossary TERM per
 *             device: labs that share a term share one seen flag).
 *   'hold'  — no usable glossary row yet: NO popup until one exists (none
 *             today). To wire one: change it to a wired row with the chosen
 *             term, its exact plain-English text and its glossary id.
 *   'none'  — no popup, by the owner's decision (the Audio Calculator
 *             Laboratory). Not pending.
 *
 * THE RULE (owner 2026-10-19): each popup explains the lab's ACTION, or its
 * device, as it applies to audio ("always explain the action"; "miking is the
 * action, that is what is defined"). Never a row with the wrong meaning (the
 * air-pressure "Compression", the synth "Voice", the RF "Spectrum Analyzer",
 * the operations "Monitoring") and never a row whose text names a maker,
 * model or product ("FM Synthesis", "Microphone types", "Auto-Tune", and
 * "Pitch Correction", whose text ends with the product's name). Rows re-read
 * and md5-checked against the live glossary 2026-10-19.
 */
export type LabTermEntry =
  | { status: 'wired'; lab: string; term: string; plainEnglish: string; glossaryId: string }
  | { status: 'hold'; lab: string; candidates: readonly string[]; suggested: string | null }
  /** No popup for this lab, by the owner's decision (not pending). */
  | { status: 'none'; lab: string; reason: string };

export const LAB_TERM_ENTRIES: Readonly<Record<string, LabTermEntry>> = {
  AmplitudeLab: {
    status: 'wired',
    lab: "Understanding Level & Amplitude",
    term: "Amplitude",
    plainEnglish:
      "Amplitude is how big the wave is, the height of its swings. Bigger amplitude usually means a louder sound, though how loud we feel it also depends on frequency.",
    glossaryId: "b5abc50e-bdb3-4c2f-be1b-1e571b5adad6",
  },
  FoundationsCourse: {
    status: 'wired',
    lab: "Foundations of Sound",
    term: "Sound",
    plainEnglish:
      "Sound is a vibration that travels through air or another material. Something vibrates, pushes on the air, and the disturbance spreads out as a wave. Your ears pick up these vibrations and your brain hears them. Sound cannot travel through empty space because there is nothing to carry it.",
    glossaryId: "446db798-ef6e-434f-9e39-e18197e18635",
  },
  FoundationsPlayground: {
    status: 'wired',
    lab: "Sound Playground",
    term: "Sound Wave",
    plainEnglish:
      "It is the back-and-forth pressure ripple that travels through air and lets us hear. The air molecules just vibrate in place and pass the energy along, rather than flying from the source to your ear.",
    glossaryId: "ae191bcd-f5eb-4ec1-ae40-c4cc52e7706a",
  },
  MicLab: {
    status: 'wired',
    lab: "Microphone Principles",
    term: "Microphone (Mic)",
    plainEnglish:
      "A microphone is the first link in the audio chain. It turns sound in the air into an electrical signal your gear can work with. The types work in different ways. Condenser mics are sensitive and detailed. Dynamic mics are rugged. Knowing your mics is basic to good recording.",
    glossaryId: "651bcc9f-dd53-4c67-8900-92d119497ad2",
  },
  WaveLab: {
    status: 'wired',
    lab: "Wave Physics Laboratory",
    term: "Acoustics",
    plainEnglish:
      "Acoustics is the physics and science of sound. It explains why some rooms sound great and others are muddy, how sound travels through materials, what happens when sound bounces off walls, and why some frequencies get louder in certain spots. Understanding acoustics helps you control how spaces handle sound.",
    glossaryId: "abbad623-df2d-42a3-92bb-1ce1dd3d20a2",
  },
  SpeakerLab: {
    status: 'wired',
    lab: "Speaker Placement & Coverage",
    term: "Coverage pattern",
    plainEnglish:
      "A coverage pattern is the footprint of sound a speaker throws on the audience. Picture a flashlight beam landing on the seats. Designers shape and aim that footprint to cover people evenly. Sound aimed at walls instead of people is wasted.",
    glossaryId: "1d902c18-a95e-5c78-9277-144b666580ed",
  },
  RoomDesignLab: {
    status: 'wired',
    lab: "Room Design & Monitoring",
    term: "Acoustic Treatment",
    plainEnglish:
      "Acoustic treatment changes how a room sounds by controlling reflections, echoes, and resonances. You add absorbers to kill reflections, diffusers to scatter sound, and bass traps to tame low frequencies. Good treatment makes a room sound controlled but not dead, and clear but not harsh.",
    glossaryId: "f6b731bd-e2ec-4b59-b34a-9909e5fe24c2",
  },
  DigitalLab: {
    status: 'wired',
    lab: "Digital Audio Systems",
    term: "Digital Audio",
    plainEnglish:
      "Digital audio is sound stored as a stream of numbers. To create it, the sound is measured many times per second and each measurement is saved as a number. Once stored this way, the audio can be copied, edited, and moved with no added noise or quality loss, which was a problem with older analog tape. This makes it the foundation of modern recording and live sound systems.",
    glossaryId: "e9071a60-cd10-4b1c-a41f-3f033ce9c421",
  },
  MeterLab: {
    status: 'wired',
    lab: "Visual Audio Analysis",
    term: "Audio Analyzer",
    plainEnglish:
      "An audio analyzer is a tool that listens to or measures an audio signal. It tells you exactly what the signal is doing: how loud it is, what frequencies are present, and how clean it is.",
    glossaryId: "a0b9c0cc-ad43-455c-aabc-8c27750c893e",
  },
  SignalChainLab: {
    status: 'wired',
    lab: "Signal Chain Builder",
    term: "Signal Chain (Signal Path)",
    plainEnglish:
      "The signal chain is the route audio takes - mic, preamp, processing, mixer, output. Knowing the order matters because each stage affects level and tone, and the sequence (e.g. EQ before or after compression) changes the result.",
    glossaryId: "985f3b96-2654-4edc-b1be-4652ab4b1448",
  },
  "MeterModule:detective": {
    status: 'wired',
    lab: "Signal Detective",
    term: "Troubleshooting",
    plainEnglish:
      "Troubleshooting is carefully tracking down why the system is not working. You check each part of the chain, from the sound source to the loudspeaker, until you find the problem.",
    glossaryId: "5fcb98b8-b98a-4537-bccd-382bdf630033",
  },
  CableLab: {
    status: 'wired',
    lab: "Cable & Connector Fundamentals",
    term: "Cables (audio)",
    plainEnglish:
      "Audio cables move your signal from one piece of gear to the next. They come in different builds for different jobs: balanced mic and line cables for clean long runs, unbalanced instrument and consumer cables for short hops, speaker cables (no shield, heavier wire) for amp-to-speaker, and coax for digital and video. Good cable has solid shielding, strong strain relief at the plugs, and the right gauge. Cheap or damaged cable is a top cause of hum and dropouts. Picking the correct type for each signal level keeps a system quiet.",
    glossaryId: "655b0ee1-89ca-4f10-a50b-51819adc2750",
  },
  ConnectorSelectLab: {
    status: 'wired',
    lab: "Audio Connectors & Cable Selection",
    term: "Connector",
    plainEnglish:
      "A connector is the plug-and-socket hardware on the end of a cable. It makes a firm electrical contact you can also undo. Each family fits its own jack and carries its own kind of signal. The right connector matches the signal and the job.",
    glossaryId: "8538ff6d-d841-50b7-a36b-25ba4d86a137",
  },
  CableInstallLab: {
    status: 'wired',
    lab: "Cable Dressing & Installation",
    term: "Cable dressing",
    plainEnglish:
      "Cable dressing means arranging cables so they are neat and tidy. You route them along clear paths and tie them gently in place. This protects the plugs and makes cables easy to follow. It also keeps power and audio lines apart to avoid noise.",
    glossaryId: "2cd72ce8-81c7-472d-8e37-33468dcf4a74",
  },
  PatchbayLab: {
    status: 'wired',
    lab: "Patchbay Signal Flow & Normalling",
    term: "Patch bay",
    plainEnglish:
      "A patch bay brings the inputs and outputs of all your gear onto one row of jacks. Instead of crawling behind racks to re-cable, you re-route signals by moving short patch cables on the front. The tricky part is 'normalling,' which sets what each jack does when nothing is plugged in. A normalled point passes a default connection straight through until you insert a cable. A non-normalled point connects nothing until you patch it. Good labeling and a logical layout make even a complex studio fast to use.",
    glossaryId: "ecebd487-9163-4e3b-88cd-d7c2ffb280ab",
  },
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
  MixingGuides: {
    status: 'wired',
    lab: "Mixing Guides",
    term: "Mixing",
    plainEnglish:
      "Mixing is where many tracks become one polished piece. You balance levels, place sounds left to right, shape tone, control dynamics, and add effects. The goal is to make everything work together.",
    glossaryId: "5e7e653d-d01d-4cfa-87e9-b81392f97f67",
  },
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
  CompressionLab: {
    status: 'wired',
    lab: "Compression",
    term: "Dynamic range compression",
    plainEnglish:
      "A compressor makes loud parts quieter, shrinking the gap between soft and loud. Above a set level (the threshold), it turns the signal down by a chosen ratio. Attack and release set how fast it reacts. Make-up gain restores overall loudness.",
    glossaryId: "037a431c-1b1a-418f-b6c1-51e0cea14a9b",
  },
  GateLab: {
    status: 'wired',
    lab: "Gate / Expander",
    term: "Downward expansion",
    plainEnglish:
      "Downward expansion makes quiet sounds even quieter. When the signal drops below a set level, the tool turns it down further. This pushes soft background noise down between the loud parts. A noise gate is an extreme version of the same idea.",
    glossaryId: "484e28c0-8ddc-40c8-8f06-347ee12fb285",
  },
  LimiterLab: {
    status: 'wired',
    lab: "Limiter",
    term: "Limiter",
    plainEnglish:
      "A limiter is an extreme compressor with an infinite ratio. You set a threshold, and any signal above it is absolutely stopped from going higher. This protects against surprise clipping. Limiters are essential on the master bus and for safety on inputs. Used right, they are invisible. Used wrong, they squash the sound.",
    glossaryId: "7f621dc4-6d04-4c29-bc61-e6352f8afcd8",
  },
  SmartProcessorsLab: {
    status: 'wired',
    lab: "Smart Processors Lab",
    term: "De-esser",
    plainEnglish:
      "Sibilance is the harsh 'S' sound in words like 'yes,' 'sister,' or 'sound,' and it sits around 4 to 8 kHz. A de-esser is a processor that spots this excessive sibilance and turns it down. Some work by compressing only at the sibilance frequencies, an approach called dynamic EQ. Others find the specific 'S' syllables and reduce just those. De-essers are key in vocal recording, where harsh esses can be distracting.",
    glossaryId: "13de599c-2d67-45b9-8e64-d1a6ebb9219f",
  },
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
  FmLab: {
    status: 'wired',
    lab: "FM Synthesis",
    term: "Frequency modulation synthesis",
    plainEnglish:
      "A way to build sounds by using one fast wobbling tone to shake the pitch of another tone. That shaking adds many extra tones (overtones), so a plain tone can turn bright, metallic, or bell-like.",
    glossaryId: "79923475-794e-49df-8132-25c70ab44c91",
  },
  ModularLab: {
    status: 'wired',
    lab: "Modular Synth",
    term: "Modular synthesizer",
    plainEnglish:
      "A modular synth is built from separate boxes you wire together. Patch cables decide how the sound flows. Every patch builds a new instrument. Nothing is fixed and nothing is saved — that is the appeal.",
    glossaryId: "d72bd8a0-4b38-5114-b86a-b5a38677b9a1",
  },
  EnvelopeLab: {
    status: 'wired',
    lab: "Sound Envelope & Transients Lab",
    term: "Envelope",
    plainEnglish:
      "The envelope is the shape of a sound's loudness from start to finish. A drum hit has a spiky envelope - a sharp burst that dies away fast. A bowed string has a gentle one that swells and holds. Synthesizers and processors like compressors work by shaping this loudness contour, often described in four stages: attack, decay, sustain, and release.",
    glossaryId: "2497363d-569d-4afb-abd6-f934e723ef84",
  },
  StereoLab: {
    status: 'wired',
    lab: "Stereo Imaging",
    term: "Stereo Imaging",
    plainEnglish:
      "Stereo imaging is where sounds seem to sit between your two speakers. Level and timing differences between the left and right channels place each sound. A good image lets you point to where each instrument sounds like it is.",
    glossaryId: "75592455-aff1-4ec1-9100-a805acac9ee2",
  },
  BinauralLab: {
    status: 'wired',
    lab: "Binaural Panner",
    term: "Binaural rendering",
    plainEnglish:
      "This makes headphone sound seem to come from around you. Each sound is filtered for the left and right ear. The filters copy how your head and ears change sound by direction. Your brain then hears a direction.",
    glossaryId: "dac286af-6c80-4042-a8bb-83a8976bcfb8",
  },
  AutotuneLab: {
    status: 'wired',
    lab: "Autotune",
    term: "Vocal tuning pass",
    plainEnglish:
      "A round of fixing notes that are slightly out of tune. Software nudges each note to the right pitch, like snapping it to the correct key.",
    glossaryId: "241fa144-2edc-47f4-99e5-1c02a2b41035",
  },
  TuningLab: {
    status: 'wired',
    lab: "Tuning & Temperament Lab",
    term: "Tuning systems",
    plainEnglish:
      "A tuning system decides the exact pitches used in music. One common system splits the octave into twelve equal steps. Another uses simple whole-number ratios between notes. Musicians measure tiny pitch gaps in units called cents.",
    glossaryId: "5be5e0bc-00d7-4ec5-bdb3-b914fa4ece5f",
  },
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
  BassLab: {
    status: 'wired',
    lab: "Bass Guitar Physics",
    term: "String length",
    plainEnglish:
      "String length is the part of the string free to vibrate. Shorter length means higher pitch. Halve the length and the note jumps an octave. Pressing a fret just shortens the vibrating part.",
    glossaryId: "e2db8c3d-790d-50d1-91d0-2d00fb3f10e6",
  },
  MicSelectLab: {
    status: 'wired',
    lab: "Microphone Selection Lab",
    term: "Mic Technique",
    plainEnglish:
      "The whole skill of picking the right mic and putting it in the right place to get the sound you want. It is the part of recording that happens before any knob on the console is touched.",
    glossaryId: "786545cf-6e0b-4b3e-9d3c-cf2fb1ec561c",
  },
  "MikingHub:drums": {
    status: 'wired',
    lab: "Membranophones (Miking Lab 1)",
    term: "miking",
    plainEnglish:
      "Miking means choosing and placing microphones on a source. Distance and angle change the tone and room sound.",
    glossaryId: "a40d40b1-35b3-496c-b488-65163b445bed",
  },
  "MikingHub:percussion": {
    status: 'wired',
    lab: "Idiophones (Miking Lab 2)",
    term: "miking",
    plainEnglish:
      "Miking means choosing and placing microphones on a source. Distance and angle change the tone and room sound.",
    glossaryId: "a40d40b1-35b3-496c-b488-65163b445bed",
  },
  "MikingHub:winds": {
    status: 'wired',
    lab: "Aerophones (Miking Lab 3)",
    term: "miking",
    plainEnglish:
      "Miking means choosing and placing microphones on a source. Distance and angle change the tone and room sound.",
    glossaryId: "a40d40b1-35b3-496c-b488-65163b445bed",
  },
  "MikingHub:strings": {
    status: 'wired',
    lab: "Chordophones (Miking Lab 4)",
    term: "miking",
    plainEnglish:
      "Miking means choosing and placing microphones on a source. Distance and angle change the tone and room sound.",
    glossaryId: "a40d40b1-35b3-496c-b488-65163b445bed",
  },
  "MikingHub:ensembles": {
    status: 'wired',
    lab: "Voice & Ensemble (Miking Lab 5)",
    term: "miking",
    plainEnglish:
      "Miking means choosing and placing microphones on a source. Distance and angle change the tone and room sound.",
    glossaryId: "a40d40b1-35b3-496c-b488-65163b445bed",
  },
  "MikingHub:field": {
    status: 'wired',
    lab: "Foley, Field & Scientific (Miking Lab 6)",
    term: "miking",
    plainEnglish:
      "Miking means choosing and placing microphones on a source. Distance and angle change the tone and room sound.",
    glossaryId: "a40d40b1-35b3-496c-b488-65163b445bed",
  },
  "MikingHub:broadcast": {
    status: 'wired',
    lab: "Sports & Broadcast (Miking Lab 7)",
    term: "miking",
    plainEnglish:
      "Miking means choosing and placing microphones on a source. Distance and angle change the tone and room sound.",
    glossaryId: "a40d40b1-35b3-496c-b488-65163b445bed",
  },
  SpeechLab: {
    status: 'wired',
    lab: "Speech & Voice Lab",
    term: "miking",
    plainEnglish:
      "Miking means choosing and placing microphones on a source. Distance and angle change the tone and room sound.",
    glossaryId: "a40d40b1-35b3-496c-b488-65163b445bed",
  },
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
  // DJ Systems Lab came from dj-lab after the 2026-10-19 rulings (merged 2026-10-21);
  // live glossary row read 2026-10-21. Term "DJ Mixer" per the 2026-10-19 plan (SESSION_HANDOFF_2026-10-19).
  DJSystemsLab: {
    status: 'wired',
    lab: "DJ Systems Lab",
    term: "DJ Mixer",
    plainEnglish:
      "A DJ mixer sits in the middle of the setup and blends two or more music sources. It has the faders, EQ, crossfader, and a headphone preview you use to mix one track into the next.",
    glossaryId: "ab13a9ab-8847-4d93-94ca-b8488dae0f96",
  },
  // Owner 2026-10-19: the Calculator lab gets NO glossary popup.
  CalcLab: { status: 'none', lab: "Audio Calculator Laboratory", reason: "owner 2026-10-19: no glossary popup for the calculator lab" },
};
