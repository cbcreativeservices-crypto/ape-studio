/**
 * startHereGlossary — the FULL glossary entries for Start Here's starter words,
 * built into the app so opening them never spends a weekly lookup.
 *
 * Owner 2026-09-29: "Start Here's word links … use up the weekly free lookups —
 * don't count them." The live full text comes only from the METERED gateway
 * (get_glossary_definition), so the beginner's 24 words carry their own copy.
 *
 * Copied verbatim from the `glossary` table (term, definition, plain_english)
 * on 2026-09-29. If one of these glossary entries is edited, refresh this file
 * (keys are the exact `glossary` values used in startHereContent.ts, lower-cased).
 */
export type StarterGlossaryEntry = { term: string; definition: string; plain_english: string };

export const STARTER_GLOSSARY: Record<string, StarterGlossaryEntry> = {
  amplitude: {
    term: 'Amplitude',
    definition: "Amplitude: the magnitude of a signal's variation from its rest position - for sound, the size of the pressure swing, which relates to loudness.",
    plain_english: 'Amplitude is how big the wave is, the height of its swings. Bigger amplitude usually means a louder sound, though how loud we feel it also depends on frequency.',
  },
  audio: {
    term: 'Audio',
    definition: 'Relating to sound within the range of human hearing (roughly 20 Hz to 20 kHz), or to the electrical or digital signals that represent such sound. The term covers both the acoustic phenomenon and its recorded or transmitted representation.',
    plain_english: 'Audio means sound we can hear, or the signals that carry that sound. It covers the whole hearing range.',
  },
  'audio cable': {
    term: 'Audio cable',
    definition: 'A cable designed to carry audio signals between devices, available as balanced or unbalanced, analog or digital, at microphone, line, or loudspeaker level. Construction (conductors, shielding, impedance) is matched to the signal type.',
    plain_english: 'An audio cable carries sound signals between gear. Different types suit mics, line signals, or speakers.',
  },
  'decibel (db)': {
    term: 'Decibel (dB)',
    definition: 'A logarithmic unit that expresses sound level, electrical signal amplitude, or frequency response magnitude. It is always measured relative to a defined reference value (such as a standard for SPL, voltage, or full scale).',
    plain_english: 'The decibel compares a measured value to a fixed reference. It is a logarithmic scale, so each step is a multiply, not an add. That matches our hearing, which also works in multiplying steps. Adding about 10 dB sounds roughly twice as loud. All sound measures (dB SPL, dBu, dBFS) are decibels against different references.',
  },
  frequency: {
    term: 'Frequency',
    definition: 'Frequency: the number of cycles a waveform completes per second, measured in hertz (Hz); it corresponds to perceived pitch.',
    plain_english: "Frequency is how fast a wave repeats, in cycles per second, or hertz. Higher frequency means higher pitch. A speaker's job is to turn electrical signals at many frequencies into matching air vibrations.",
  },
  'input/output': {
    term: 'input/output',
    definition: 'Input/output (I/O) refers to the points at which signals or data enter and leave a device or system, and to the process of that exchange. In audio it encompasses analog and digital connections such as line, microphone, and network I/O.',
    plain_english: 'Input/output means the ins and outs of a device. Signals enter at inputs and leave at outputs. It covers analog and digital connections.',
  },
  'listening position': {
    term: 'Listening Position',
    definition: 'The location where the listener sits relative to the speakers; in a well-set-up stereo system it forms an equilateral or near-equilateral triangle with the two speakers and is often called the sweet spot.',
    plain_english: 'The listening position is the spot where you sit to listen. Ideally it is an equal distance from each speaker, so the sound is balanced and centered.',
  },
  loudness: {
    term: 'Loudness',
    definition: 'Loudness is the perceptual attribute of sound by which listeners order sounds from quiet to loud. It depends not only on signal amplitude but also on frequency content, duration and spectral distribution, which is why measured level in dBFS does not by itself predict how loud something sounds; program loudness is quantified in LUFS per ITU-R BS.1770.',
    plain_english: 'Loudness is how loud something actually seems to your ears. That is not the same as the numbers on the meter. This is because your ears are more sensitive to some frequencies than others.',
  },
  'loudspeaker (speaker)': {
    term: 'Loudspeaker (Speaker)',
    definition: 'A loudspeaker (or speaker) is a transducer that converts an electrical audio signal into sound waves you can hear. Larger systems use several specialized drivers - woofers for low frequencies, midranges for the middle, and tweeters for highs - to cover the full audible range accurately.',
    plain_english: 'A loudspeaker is a driver, or several drivers, that turns an electrical signal into sound. Woofers handle bass. Midrange drivers handle mids. Tweeters handle treble. Studio monitors are precise loudspeakers built for accurate sound. Home speakers are often built for a colored, pleasing sound instead.',
  },
  medium: {
    term: 'Medium',
    definition: "The material substance through which a sound wave travels, supplying the mass and elasticity needed to carry the wave. Sound is a mechanical wave and cannot propagate without a medium; it moves as compressions and rarefactions of the medium's particles. Gases, liquids, and solids all act as media, each with a characteristic sound speed and impedance.",
    plain_english: "A medium is the material that sound moves through. It can be air, water, or solid matter. Sound needs a medium and cannot travel in a vacuum. The medium's makeup sets how fast sound goes.",
  },
  'meter (metering)': {
    term: 'Meter (Metering)',
    definition: 'A device or on-screen indicator that displays the level of an audio signal (peak, RMS, average, or loudness) relative to a calibrated reference, so operators can monitor and control signal amplitude; common types include the VU meter, peak programme meter (PPM), and digital peak (dBFS) meter.',
    plain_english: 'A meter shows how loud a signal is. You watch it to keep levels high enough to be clear but low enough to avoid distortion. It is like a speedometer for sound.',
  },
  'microphone (mic)': {
    term: 'Microphone (Mic)',
    definition: 'A transducer converting acoustic sound waves to electrical signals. Types include dynamic (moving-coil), condenser, and ribbon; lavalier describes a form factor rather than a transducer type. Essential to all audio recording.',
    plain_english: 'A microphone is the first link in the audio chain. It turns sound in the air into an electrical signal your gear can work with. The types work in different ways. Condenser mics are sensitive and detailed. Dynamic mics are rugged. Knowing your mics is basic to good recording.',
  },
  noise: {
    term: 'Noise',
    definition: 'Noise: any unwanted signal or sound present along with the desired audio, whether electronic (hiss, hum) or acoustic (background, HVAC).',
    plain_english: "Noise is everything you didn't want in the signal - electronic hiss and hum, or acoustic background. The goal is a high signal-to-noise ratio so the wanted sound dominates.",
  },
  pitch: {
    term: 'Pitch',
    definition: 'Pitch: the perceived highness or lowness of a sound, determined chiefly by its fundamental frequency.',
    plain_english: 'Pitch is how high or low a sound seems to us. It tracks the fundamental frequency closely (higher frequency = higher pitch), though loudness and timbre can nudge perception slightly.',
  },
  playback: {
    term: 'Playback',
    definition: 'Playback is the reproduction of pre-recorded audio or video content during an event, such as music, video roll-ins, stings, or recorded segments. The playback source and operator must deliver this content on cue and at the correct level.',
    plain_english: 'It is playing pre-recorded music or video at the right moment during a show.',
  },
  'pure tone': {
    term: 'Pure Tone',
    definition: 'A pure tone is a sound consisting of a single frequency with a sinusoidal waveform and no harmonics or overtones. It is an idealized signal rarely produced by acoustic instruments but easily generated electronically, such as by a sine-wave oscillator.',
    plain_english: 'A pure tone is the simplest sound: one steady pitch with no extra coloring, like the smooth beep of a test tone. Real instruments almost never make one, because they always add overtones.',
  },
  recording: {
    term: 'Recording',
    definition: "Recording is the capture of an event's audio and/or video to a storage medium for later playback, archiving, or distribution. In corporate AV it produces the master file used for on-demand viewing, compliance, or content repurposing.",
    plain_english: "Recording is capturing the event's audio and video to a file. So it can be watched or used later.",
  },
  'signal path': {
    term: 'Signal Path',
    definition: 'The complete route an audio or video signal travels through a system, in order, from its source through every device and connection (preamp, processing, buses, and amplification) to the final output such as a loudspeaker or display.',
    plain_english: 'A signal path is the route a sound takes through the gear. It starts at the source, like a mic, and ends at the speaker. Tracing this path helps you find where sound breaks down.',
  },
  sound: {
    term: 'Sound',
    definition: 'Sound is a mechanical disturbance that travels through an elastic medium (such as air) as a longitudinal pressure wave, produced when a source vibrates and sets the surrounding particles oscillating about their equilibrium positions. The human-audible range is nominally about 20 Hz to 20 kHz; sound requires a medium and cannot propagate through a vacuum.',
    plain_english: 'Sound is a vibration that travels through air or another material. Something vibrates, pushes on the air, and the disturbance spreads out as a wave. Your ears pick up these vibrations and your brain hears them. Sound cannot travel through empty space because there is nothing to carry it.',
  },
  vibration: {
    term: 'vibration',
    definition: 'An oscillatory mechanical motion of a body or medium about an equilibrium position, described by parameters such as displacement, velocity, and acceleration over time. In audio, vibration of a surface or structure can radiate airborne sound or be transmitted as unwanted structure-borne noise.',
    plain_english: 'Vibration is a fast back-and-forth motion around a resting point. In audio, vibrating surfaces make sound or carry unwanted noise.',
  },
  waveform: {
    term: 'Waveform',
    definition: "Waveform: the visual representation of a signal's amplitude over time, showing its shape, level, and dynamic behavior.",
    plain_english: 'A waveform is the picture of sound over time - the wiggly line in a DAW. Its height shows level and its shape reveals transients, sustain, and clipping.',
  },
};

export function starterGlossaryEntry(glossaryTerm: string): StarterGlossaryEntry | null {
  return STARTER_GLOSSARY[glossaryTerm.trim().toLowerCase()] ?? null;
}
