// ✅ APPROVED by the owner 2026-10-13 (content review done; ships with the post-approval OTA).
/**
 * Understanding checks for the PRACTICE labs — the labs whose completion in
 * TRAINING_LABS (trainingLabKeys.ts) is 'understanding'. Owner ruling
 * 2026-10-13: practice labs with no lessons complete by passing a short
 * understanding check.
 *
 * CONTENT ONLY. Each set is keyed by the lab's RUNTIME labId exactly as
 * UNDERSTANDING_LAB_IDS (trainingLabKeys.ts) names it, and registered in
 * UNDERSTANDING_CHECKS (understanding.ts). Rendering the check and mapping
 * labId → server key is the wiring's job, not this file's.
 *
 * Authoring rules (owner brief 2026-10-13):
 *   • 3–5 questions per lab; exactly one correct option, matched BY VALUE.
 *   • Every question tests something THAT lab shows or says — its intro,
 *     controls, display captions or guided lesson. No trivia, no tricks.
 *   • Settings are "suggested starting points", never rules.
 *   • No brand or model names (ratchet: test/understandingChecks_20261013.test.ts).
 *
 * Reviewer export: Downloads\2026-10-13_LAB_UNDERSTANDING_CHECKS_FOR_REVIEW.md
 */
import type { UnderstandingQuestion } from './understanding';

type Q = UnderstandingQuestion;

// ─────────────────────────────────────────────────────────── Compression ──
const COMPRESSION: readonly Q[] = [
  {
    id: 'ratio-math',
    prompt: 'A compressor is set to 4:1. The input rises 8 dB above the threshold. How far above the threshold does the output rise?',
    options: ['2 dB', '4 dB', '8 dB', '32 dB'],
    correct: '2 dB',
    explanation: 'At 4:1, every 4 dB that goes in above the threshold comes out as 1 dB. 8 ÷ 4 = 2 dB, so the compressor is turning that peak down by 6 dB.',
  },
  {
    id: 'below-threshold',
    prompt: 'With makeup gain at 0 dB, what does a compressor do to a signal that stays BELOW its threshold the whole time?',
    options: [
      'Nothing — a compressor only acts above the threshold',
      'Turns it down by the ratio',
      'Turns it up by the ratio',
      'Removes its transients',
    ],
    correct: 'Nothing — a compressor only acts above the threshold',
    explanation: 'Below the threshold the transfer curve stays 1:1 and the gain-reduction meter reads 0 dB. Lower the threshold into the signal and the compressor starts working.',
  },
  {
    id: 'attack-punch',
    prompt: 'You want a drum’s initial hit to come through before the compressor clamps down on the ring after it. Which change does that?',
    options: ['A slower attack, such as 25 ms', 'The fastest attack, such as 0.5 ms', 'A higher ratio', 'More makeup gain'],
    correct: 'A slower attack, such as 25 ms',
    explanation: 'Attack sets how fast the compressor clamps once the signal crosses the threshold. A slower attack lets most of the first few milliseconds — the hit — through, then controls what follows. A very fast attack dulls the hit itself.',
  },
  {
    id: 'makeup',
    prompt: 'What is MAKEUP gain for?',
    options: [
      'Bringing the whole signal back up after compression has turned the loud parts down',
      'Setting how fast the compressor reacts',
      'Setting the level where compression starts',
      'Stopping the output from ever passing a ceiling',
    ],
    correct: 'Bringing the whole signal back up after compression has turned the loud parts down',
    explanation: 'Compression lowers the peaks, so the track gets quieter overall. Makeup gain raises everything back up. When comparing, match the levels — louder tends to sound "better" to the ear.',
  },
];

// ────────────────────────────────────────────────────────────────── Gate ──
const GATE: readonly Q[] = [
  {
    id: 'which-side',
    prompt: 'What does a gate do to sound that falls BELOW its threshold?',
    options: [
      'Turns it down toward the RANGE (floor) setting',
      'Lets it through unchanged',
      'Turns it up',
      'Compresses it by a ratio',
    ],
    correct: 'Turns it down toward the RANGE (floor) setting',
    explanation: 'A gate is the opposite side of the line from a compressor: loud sound above the threshold passes untouched, quiet sound below it (bleed, hum, spill) is turned down toward the floor.',
  },
  {
    id: 'range-partial',
    prompt: 'The gate’s RANGE is set to −20 dB instead of full silence. What happens when the gate closes?',
    options: [
      'The signal drops by 20 dB but stays faintly audible',
      'The signal is completely silenced',
      'The signal gets 20 dB louder',
      'The gate stops opening at all',
    ],
    correct: 'The signal drops by 20 dB but stays faintly audible',
    explanation: 'Range sets how far the gate turns down when closed. A partial floor lets leakage duck instead of vanishing, which often sounds more natural than full silence.',
  },
  {
    id: 'chatter',
    prompt: 'A decaying note hovers right at the threshold and the gate flickers open and shut (chatter). What is a sensible first fix?',
    options: [
      'Add some HOLD or lengthen the RELEASE',
      'Shorten the RELEASE as far as it goes',
      'Set the RANGE to full silence',
      'Remove the HOLD entirely',
    ],
    correct: 'Add some HOLD or lengthen the RELEASE',
    explanation: 'Chatter is the signal wobbling around the threshold. HOLD keeps the gate open for a minimum time, and a longer release closes it gently instead of slamming shut on every wobble.',
  },
  {
    id: 'hold-meaning',
    prompt: 'What does the HOLD control do?',
    options: [
      'Keeps the gate open for a minimum time after the signal drops below the threshold',
      'Sets how far the gate turns the signal down',
      'Sets the level the signal must reach to open the gate',
      'Sets how loud the signal is once the gate opens',
    ],
    correct: 'Keeps the gate open for a minimum time after the signal drops below the threshold',
    explanation: 'Hold is a minimum open time before the release begins — the main anti-chatter control. Range is the depth, and threshold is the opening level.',
  },
];

// ─────────────────────────────────────────────────────────────── Limiter ──
const LIMITER: readonly Q[] = [
  {
    id: 'ceiling-rule',
    prompt: 'What is the defining rule of a brickwall limiter’s CEILING?',
    options: [
      'The output never goes above it, however hard the input pushes',
      'The output always sits exactly at it',
      'Anything below it is turned up to meet it',
      'It sets how fast the limiter recovers',
    ],
    correct: 'The output never goes above it, however hard the input pushes',
    explanation: 'A limiter behaves like a compressor with an infinite ratio: above the ceiling the transfer curve goes flat. Below it the signal passes untouched.',
  },
  {
    id: 'gr-math',
    prompt: 'The lab’s source peaks at −20 dBFS and the ceiling is set to −25 dB. How much gain reduction does the limiter apply?',
    options: ['5 dB', '20 dB', '25 dB', '45 dB'],
    correct: '5 dB',
    explanation: 'The peaks sit 5 dB above the ceiling (−20 vs −25), so the limiter holds them down by 5 dB. On a steady tone that reduction stays constant on the GR meter.',
  },
  {
    id: 'chain-position',
    prompt: 'Where does a brickwall limiter usually belong in a processing chain?',
    options: [
      'At or near the very end, as the final safety net',
      'First, before any EQ',
      'Before the gate',
      'Anywhere — the order never matters',
    ],
    correct: 'At or near the very end, as the final safety net',
    explanation: 'Its job is a guaranteed ceiling. Any stage placed after it could push the level back over, so it normally sits last.',
  },
  {
    id: 'true-peak',
    prompt: 'Why is a ceiling of about −1 dBTP often suggested as a starting point for a final master, rather than 0 dBFS?',
    options: [
      'Peaks between the samples can go over 0 dBFS after conversion or lossy encoding',
      'A limiter set to 0 dBFS reacts more slowly',
      'Meters cannot display 0 dBFS',
      'It makes the master louder',
    ],
    correct: 'Peaks between the samples can go over 0 dBFS after conversion or lossy encoding',
    explanation: 'The real waveform between samples can peak higher than the samples themselves (inter-sample peaks). A little margin, with true-peak detection, keeps those from clipping later.',
  },
];

// ───────────────────────────────────────── Smart Processors (De-Esser) ──
const DEESSER: readonly Q[] = [
  {
    id: 'where-s-lives',
    prompt: 'Roughly where does most of the energy of an "S" sit?',
    options: ['Between about 4 and 10 kHz', 'Below 500 Hz', 'Around 1 kHz', 'Above 20 kHz'],
    correct: 'Between about 4 and 10 kHz',
    explanation: 'An S is air turbulence at the teeth, with most of its energy roughly between 4 and 10 kHz. SH and CH sit lower, nearer 2–5 kHz. Vowels sit far below.',
  },
  {
    id: 'why-not-eq',
    prompt: 'Why is a de-esser often a better tool for sibilance than a fixed EQ cut?',
    options: [
      'It turns down only while an S is present, so the vowels keep their brightness',
      'It cuts the high frequencies all the time',
      'It works on the low end instead of the highs',
      'It makes every consonant louder',
    ],
    correct: 'It turns down only while an S is present, so the vowels keep their brightness',
    explanation: 'An EQ cut is always on, so it dulls every vowel and breath along with the S. A de-esser only moves while its detector hears hiss.',
  },
  {
    id: 'sidechain-filter',
    prompt: 'In a de-esser, where does the band-pass filter sit?',
    options: [
      'In the side chain, shaping only what the detector listens to',
      'In the signal path, cutting the highs from the whole voice',
      'After the gain element, cleaning up what is left over',
      'Nowhere — a de-esser uses a high shelf instead',
    ],
    correct: 'In the side chain, shaping only what the detector listens to',
    explanation: 'The filter is not in the audio path. It only decides what the detector hears, so the decision is made on the hiss while the whole voice passes through until the gain moves.',
  },
  {
    id: 'split-vs-broad',
    prompt: 'What is the difference between BROADBAND and SPLIT-BAND de-essing?',
    options: [
      'Split-band turns down only the hiss band; broadband turns the whole voice down',
      'Broadband turns down only the hiss band; split-band turns the whole voice down',
      'They turn down the same thing but react at different speeds',
      'They differ only in where the detector listens',
    ],
    correct: 'Split-band turns down only the hiss band; broadband turns the whole voice down',
    explanation: 'Both use the same detector and threshold. When it fires, broadband lowers the whole signal for a moment; split-band lowers only the hiss band and leaves the body of the voice alone.',
  },
  {
    id: 'lisp',
    prompt: 'After de-essing, the talker sounds like they have a lisp. What does that suggest?',
    options: [
      'Too much reduction — the S sounds are being removed, not tamed',
      'Not enough reduction — the S sounds were never caught',
      'The detector frequency is set below 1 kHz',
      'The de-esser is bypassed',
    ],
    correct: 'Too much reduction — the S sounds are being removed, not tamed',
    explanation: 'Over-de-essing turns S into TH. A suggested starting point: set it so you can only just hear it working on the worst S, then back off a little.',
  },
];

// ───────────────────────────────────────────────────────────────── Delay ──
const DELAY: readonly Q[] = [
  {
    id: 'tempo-math',
    prompt: 'A song is at 120 BPM. Which delay time puts the repeats on every quarter note?',
    options: ['500 ms', '120 ms', '250 ms', '1,000 ms'],
    correct: '500 ms',
    explanation: 'A quarter note lasts 60,000 ÷ BPM milliseconds. 60,000 ÷ 120 = 500 ms, so the echoes land on the beat.',
  },
  {
    id: 'feedback',
    prompt: 'What does the FEEDBACK control set?',
    options: [
      'How much of each echo is fed back to make the next one — so how long the trail lasts',
      'The time between repeats',
      'The balance between the dry sound and the echoes',
      'Whether the repeats bounce between left and right',
    ],
    correct: 'How much of each echo is fed back to make the next one — so how long the trail lasts',
    explanation: 'At 75% feedback each repeat is 75% of the one before, so the trail fades slowly. Spacing never changes with feedback — that is TIME. Near 100% the repeats barely fade; past it they build up and run away.',
  },
  {
    id: 'slapback',
    prompt: 'Which setting describes a classic SLAPBACK echo?',
    options: [
      'A short delay (roughly 60–150 ms), one repeat, low feedback',
      'A long delay (over 1 second) with high feedback',
      'A delay matched to a whole note, 100% wet',
      'Many repeats bouncing left and right',
    ],
    correct: 'A short delay (roughly 60–150 ms), one repeat, low feedback',
    explanation: 'Slapback is a single quick repeat just behind the source. Set it much longer and it turns into a distinct echo instead.',
  },
  {
    id: 'damping',
    prompt: 'Why roll the highs off the repeats (REPEAT DAMPING)?',
    options: [
      'So the echoes sit back behind the source instead of piling up into harsh clutter',
      'So the repeats arrive sooner',
      'So there are more repeats',
      'So the delay stays in time with the song',
    ],
    correct: 'So the echoes sit back behind the source instead of piling up into harsh clutter',
    explanation: 'Each darker repeat recedes into the background, the way echoes do in a real space. Full-range repeats stack up and compete with the dry sound.',
  },
];

// ──────────────────────────────────────────────────────────────── Reverb ──
const REVERB: readonly Q[] = [
  {
    id: 'rt60',
    prompt: 'What does an RT60 of 2.0 seconds mean?',
    options: [
      'The reverb tail takes 2 seconds to fall by 60 dB',
      'The reverb is twice as loud as the dry sound',
      '2 seconds pass before the reverb starts',
      'The room is 60 metres long',
    ],
    correct: 'The reverb tail takes 2 seconds to fall by 60 dB',
    explanation: 'RT60 is a TIME — where the decay slope crosses −60 dB. How loud the reverb is belongs to MIX, and when it starts belongs to PRE-DELAY.',
  },
  {
    id: 'pre-delay',
    prompt: 'A vocal is getting lost in its reverb. Which control keeps the reverb but lets the words land clearly first?',
    options: ['Pre-delay', 'A longer RT60', 'Less high-frequency damping', 'A higher MIX'],
    correct: 'Pre-delay',
    explanation: 'Pre-delay opens a short gap between the dry sound and the start of the wash, so consonants arrive clean before the reverb. A suggested starting range is about 10–40 ms.',
  },
  {
    id: 'hf-damping',
    prompt: 'You increase HF DAMPING, so the highs fade faster inside the tail. How does the space sound?',
    options: [
      'Darker and softer, like a room with soft surfaces',
      'Brighter and more live',
      'Larger',
      'Closer to the listener',
    ],
    correct: 'Darker and softer, like a room with soft surfaces',
    explanation: 'Soft surfaces absorb high frequencies first, so the tail darkens as it decays. Less damping gives a bright, live space.',
  },
  {
    id: 'too-much-mix',
    prompt: 'A source sounds far away and washed out. What is the most direct fix?',
    options: ['Lower the reverb MIX', 'Raise the RT60', 'Set pre-delay to 0 ms', 'Reduce the HF damping'],
    correct: 'Lower the reverb MIX',
    explanation: 'Mix is the dry-to-reverb balance. A little places a source in a space; too much pushes it to the back and blurs clarity.',
  },
];

// ──────────────────────────────────────────────────────────────── Chorus ──
const CHORUS: readonly Q[] = [
  {
    id: 'mechanism',
    prompt: 'What creates the chorus effect?',
    options: [
      'A delayed copy whose delay time slowly wobbles, mixed with the dry signal',
      'Two identical copies panned hard left and right',
      'A bank of narrow EQ boosts',
      'A long reverb tail',
    ],
    correct: 'A delayed copy whose delay time slowly wobbles, mixed with the dry signal',
    explanation: 'The copy sits a few tens of milliseconds behind and its timing drifts, so its pitch wavers slightly. It beats against the steady dry voice — like two players who are never perfectly together.',
  },
  {
    id: 'full-wet',
    prompt: 'At 100% WET the chorus stops sounding like a chorus. What do you hear instead?',
    options: [
      'Vibrato — only the wobbling copy is left, with no dry voice to beat against',
      'Nothing — 100% wet bypasses the effect',
      'A flanger',
      'A louder, distorted chorus',
    ],
    correct: 'Vibrato — only the wobbling copy is left, with no dry voice to beat against',
    explanation: 'Chorus IS the interference between the dry voice and the detuned copy. Remove the dry voice and one wobbling pitch remains: vibrato.',
  },
  {
    id: 'vs-flanger',
    prompt: 'Compared with a flanger, a chorus uses…',
    options: [
      'A longer delay (about 15–35 ms), so you hear shimmer instead of a sweeping comb',
      'A much shorter delay, under 1 ms',
      'No delay at all, only EQ',
      'The same delay with far more feedback',
    ],
    correct: 'A longer delay (about 15–35 ms), so you hear shimmer instead of a sweeping comb',
    explanation: 'At chorus delays the comb notches sit so close together that you hear the beating instead of a jet. A flanger’s delay is only a few milliseconds.',
  },
  {
    id: 'rate-high',
    prompt: 'You push the chorus RATE up to about 3 Hz. How does it tend to sound?',
    options: ['Seasick and out of tune', 'Smoother and more subtle', 'Like a longer echo', 'Exactly the same, only louder'],
    correct: 'Seasick and out of tune',
    explanation: 'Rate is the speed of the wobble. Slow rates give a gentle shimmer; fast rates make the pitch movement obvious, which reads as detuning.',
  },
];

// ─────────────────────────────────────────────────────────────── Flanger ──
const FLANGER: readonly Q[] = [
  {
    id: 'notch-spacing',
    prompt: 'A flanger’s centre delay is 2 ms. How far apart are its comb notches?',
    options: ['500 Hz', '2 Hz', '200 Hz', '2,000 Hz'],
    correct: '500 Hz',
    explanation: 'Notch spacing is 1 ÷ delay time: 1 ÷ 0.002 s = 500 Hz. A shorter delay spreads the notches further apart; a longer one packs them closer.',
  },
  {
    id: 'even-vs-uneven',
    prompt: 'How do a flanger’s notches differ from a phaser’s?',
    options: [
      'A flanger makes many evenly spaced notches; a phaser makes a few uneven ones',
      'A flanger makes fewer notches than a phaser',
      'They are the same effect at different speeds',
      'A flanger has no notches; it only changes pitch',
    ],
    correct: 'A flanger makes many evenly spaced notches; a phaser makes a few uneven ones',
    explanation: 'The flanger’s short delay produces an even comb. The phaser’s all-pass stages place a handful of notches wherever the phase lines up to cancel — sparse and uneven.',
  },
  {
    id: 'feedback',
    prompt: 'What happens as you push flanger FEEDBACK toward its maximum?',
    options: [
      'The notches deepen and the peaks ring, building toward a metallic scream',
      'The sweep gets faster',
      'The effect gets quieter and disappears',
      'The notches spread evenly further apart',
    ],
    correct: 'The notches deepen and the peaks ring, building toward a metallic scream',
    explanation: 'Feedback re-circulates the delayed copy and sharpens the comb. Speed belongs to RATE, and spacing belongs to the delay time.',
  },
  {
    id: 'sine-test',
    prompt: 'Why is a pure sine tone a poor source for hearing a flanger?',
    options: [
      'A sine has energy at only one frequency, so the moving notches have almost nothing to carve',
      'A sine is too loud for a flanger',
      'A flanger only works on drums',
      'A sine cancels the LFO',
    ],
    correct: 'A sine has energy at only one frequency, so the moving notches have almost nothing to carve',
    explanation: 'The comb removes energy at many frequencies. Broadband sources such as pink or white noise have energy everywhere, so the sweep becomes audible and visible.',
  },
];

// ──────────────────────────────────────────────────────────────── Phaser ──
const PHASER: readonly Q[] = [
  {
    id: 'stages-notches',
    prompt: 'An 8-stage phaser produces roughly how many notches?',
    options: ['4', '8', '16', '2'],
    correct: '4',
    explanation: 'Each pair of all-pass stages creates one notch, so the count is about stages ÷ 2. More stages give a thicker sweep.',
  },
  {
    id: 'all-pass',
    prompt: 'What do a phaser’s all-pass stages change?',
    options: [
      'The phase of each frequency, without changing its level',
      'The time of arrival, like a short echo',
      'The level of the high frequencies only',
      'The pitch of the whole signal',
    ],
    correct: 'The phase of each frequency, without changing its level',
    explanation: 'An all-pass stage passes every frequency at full level but shifts its phase. The notches only appear when that shifted copy is mixed back with the dry signal.',
  },
  {
    id: 'not-a-delay',
    prompt: 'Is a phaser a kind of delay?',
    options: [
      'No — it shifts phase, so there is no echo and the notches are unevenly spaced',
      'Yes — it is a flanger with a longer delay',
      'Yes — it is a very short slapback',
      'No — it is a type of reverb',
    ],
    correct: 'No — it shifts phase, so there is no echo and the notches are unevenly spaced',
    explanation: 'A phaser shifts phase; a flanger shifts time. That different mechanism is why the phaser has a few uneven notches and the flanger an even comb.',
  },
  {
    id: 'resonance',
    prompt: 'What does raising the phaser’s RESONANCE (feedback) do?',
    options: [
      'Sharpens and deepens the notches',
      'Adds more notches',
      'Moves the notches to higher frequencies',
      'Speeds up the sweep',
    ],
    correct: 'Sharpens and deepens the notches',
    explanation: 'Resonance feeds the output back in, making the notches more pronounced. Too much whistles and rings. The number of notches comes from STAGES, the position from CENTER and the speed from RATE.',
  },
];

// ──────────────────────────────────────────────────────────── Distortion ──
const DISTORTION: readonly Q[] = [
  {
    id: 'what-is-added',
    prompt: 'Distortion makes a pure sine tone sound richer. What has been added?',
    options: [
      'New frequencies — harmonics created by bending the wave’s shape',
      'Only volume',
      'A reverb tail',
      'Lower octaves below the note',
    ],
    correct: 'New frequencies — harmonics created by bending the wave’s shape',
    explanation: 'Reshaping a wave creates harmonics — whole-number multiples of the input frequency that were not there before. Distortion creates frequencies; EQ cannot.',
  },
  {
    id: 'symmetric-odd',
    prompt: 'HARD CLIP flattens the top and bottom of the wave the same way (symmetric). Which harmonics does that produce?',
    options: ['Odd harmonics only', 'Even harmonics only', 'Odd and even harmonics equally', 'No harmonics — only extra level'],
    correct: 'Odd harmonics only',
    explanation: 'Symmetric clipping adds only odd harmonics (3rd, 5th, 7th…), heard as hollow or harsh. Clipping the top and bottom differently — the TUBE (ASYM) type — adds even harmonics too.',
  },
  {
    id: 'oversampling',
    prompt: 'What do you hear when OVERSAMPLING is switched OFF?',
    options: [
      'Aliasing — harmonics above the Nyquist limit fold back as harsh, out-of-tune tones',
      'A cleaner, smoother distortion',
      'Only a drop in volume',
      'Nothing — oversampling only affects the display',
    ],
    correct: 'Aliasing — harmonics above the Nyquist limit fold back as harsh, out-of-tune tones',
    explanation: 'Distortion creates harmonics that can reach past half the sample rate. Without oversampling they fold back to unrelated frequencies. Oversampling processes at a higher rate and filters out most of them first.',
  },
  {
    id: 'parallel',
    prompt: 'Why set MIX to about 50% (parallel distortion)?',
    options: [
      'To add grit while keeping the clean signal’s body and clarity underneath',
      'To make the distortion react faster',
      'To remove aliasing',
      'To double the number of harmonics',
    ],
    correct: 'To add grit while keeping the clean signal’s body and clarity underneath',
    explanation: 'DRIVE decides how bent — how harmonic-rich — the distorted signal is. MIX blends it with the clean signal, so you can add character without losing the dry body.',
  },
];

// ───────────────────────────────────────────────────────────────── Phase ──
const PHASE: readonly Q[] = [
  {
    id: 'invert-silence',
    prompt: 'Two identical channels: you invert the polarity (Ø) of one and fold to mono. Why is the result silence?',
    options: [
      'The channels are equal and opposite, so added together they cancel completely',
      'Mono always lowers the level',
      'The polarity button mutes one channel',
      'The correlation meter turns the output off',
    ],
    correct: 'The channels are equal and opposite, so added together they cancel completely',
    explanation: 'Inverting polarity multiplies every value by −1. Every positive meets an equal negative, so the sum is zero. Real-world cases (a miswired cable, a doubled mic) usually cancel only partly.',
  },
  {
    id: 'flip-wont-fix-delay',
    prompt: 'One channel is 2 ms late and the mono sum sounds thin and combed. Will pressing the polarity (Ø) button fix it?',
    options: [
      'No — a time offset shifts phase differently at each frequency; it needs time alignment',
      'Yes — a polarity flip always fixes cancellation',
      'Yes — but only below 1 kHz',
      'No — the only fix is to delete one channel',
    ],
    correct: 'No — a time offset shifts phase differently at each frequency; it needs time alignment',
    explanation: 'A polarity flip is 180° at every frequency, so it fixes a simple inversion. A delay is a phase shift that changes with frequency — fix it by lining the two up in time.',
  },
  {
    id: 'delay-phase-frequency',
    prompt: 'A fixed time delay between the channels shifts the phase…',
    options: [
      'More at higher frequencies',
      'By the same angle at every frequency',
      'Only below 100 Hz',
      'Not at all — a delay only affects timing',
    ],
    correct: 'More at higher frequencies',
    explanation: 'The same delay is a bigger fraction of a short (high-frequency) cycle than of a long one, so the phase shift grows with frequency. That is why it combs in mono.',
  },
  {
    id: 'correlation',
    prompt: 'The correlation meter reads +1. What does that tell you?',
    options: [
      'Left and right move in step — fully safe in mono',
      'Left and right are opposite — they will cancel in mono',
      'The two channels are unrelated',
      'The signal is clipping',
    ],
    correct: 'Left and right move in step — fully safe in mono',
    explanation: 'The meter runs from +1 (in step, mono-safe) through 0 (unrelated) down to −1 (opposite, cancels in mono). In this lab, two identical channels draw a vertical line and read +1.',
  },
];

// ──────────────────────────────────────────────────────────── Oscillator ──
const OSCILLATOR: readonly Q[] = [
  {
    id: 'saw',
    prompt: 'Which classic waveform contains EVERY harmonic, each at 1/n of the fundamental?',
    options: ['Sawtooth', 'Square', 'Triangle', 'Sine'],
    correct: 'Sawtooth',
    explanation: 'The sawtooth has the full harmonic series falling at 1/n — the brightest, buzziest classic wave and the favourite raw material for filters. A sine has just one harmonic: the fundamental.',
  },
  {
    id: 'triangle-vs-square',
    prompt: 'Square and triangle waves both contain only odd harmonics. Why does the triangle sound so much softer?',
    options: [
      'Its harmonics fall away much faster — 1/n² instead of 1/n',
      'It has fewer odd harmonics',
      'It is always played an octave lower',
      'It contains even harmonics as well',
    ],
    correct: 'Its harmonics fall away much faster — 1/n² instead of 1/n',
    explanation: 'Same odd-only series, different rolloff. The triangle’s upper harmonics are tiny, so it sounds smooth and flute-like; the square’s stay strong, so it sounds hollow and reedy.',
  },
  {
    id: 'pulse-duty',
    prompt: 'What does changing a pulse wave’s duty cycle (for example to 25%) change?',
    options: [
      'Its timbre — some harmonics drop out — but not its pitch',
      'Its pitch',
      'Only its volume',
      'Nothing you can hear',
    ],
    correct: 'Its timbre — some harmonics drop out — but not its pitch',
    explanation: 'The duty cycle cancels particular harmonics; a 25% pulse loses every 4th one. The fundamental, and so the pitch, stays where it is.',
  },
  {
    id: 'band-limit',
    prompt: 'This lab leaves out any harmonic at or above the Nyquist frequency (half the sample rate). Why?',
    options: [
      'Those harmonics would fold back as aliasing — unrelated, out-of-tune tones',
      'They are too quiet to matter',
      'They would raise the pitch by an octave',
      'Phone speakers would play them too loudly',
    ],
    correct: 'Those harmonics would fold back as aliasing — unrelated, out-of-tune tones',
    explanation: 'A digital system cannot represent anything above half its sample rate. Harmonics past that limit do not vanish; they reappear at wrong frequencies. Band-limited generation simply omits them.',
  },
];

// ───────────────────────────────────────────────────────────────── Noise ──
const NOISE: readonly Q[] = [
  {
    id: 'white-bright',
    prompt: 'White noise has equal energy per hertz. Why does it sound bright and hissy?',
    options: [
      'Each higher octave spans twice as many hertz, so it holds twice the energy',
      'It has extra energy added at the top',
      'It contains no low frequencies at all',
      'It is always played louder than pink noise',
    ],
    correct: 'Each higher octave spans twice as many hertz, so it holds twice the energy',
    explanation: 'The octave from 10 to 20 kHz spans 10,000 Hz; the octave from 100 to 200 Hz spans only 100 Hz. Equal energy per hertz therefore piles up in the upper octaves, where the ear hears it as hiss.',
  },
  {
    id: 'pink-slope',
    prompt: 'Compared with white noise, pink noise falls at what rate?',
    options: ['−3 dB per octave', '−6 dB per octave', '0 dB per octave', '+3 dB per octave'],
    correct: '−3 dB per octave',
    explanation: 'Pink noise falls 3 dB per octave, which gives equal energy in every octave. Brown falls 6 dB per octave; blue rises 3; violet rises 6.',
  },
  {
    id: 'brown',
    prompt: 'Which colour of noise falls 6 dB per octave and sounds like rumble, surf or distant thunder?',
    options: ['Brown', 'White', 'Blue', 'Violet'],
    correct: 'Brown',
    explanation: 'Brown (also called red) noise puts most of its energy in the lows. Blue and violet tilt the other way, toward the treble.',
  },
  {
    id: 'pink-reference',
    prompt: 'Why is pink noise the standard test noise for rooms and loudspeakers?',
    options: [
      'Equal energy per octave matches how we hear, so it sounds balanced',
      'It is the loudest colour',
      'It has no high frequencies to damage tweeters',
      'It is the only colour a microphone can measure',
    ],
    correct: 'Equal energy per octave matches how we hear, so it sounds balanced',
    explanation: 'Hearing works on a roughly log scale, closer to octaves than to equal slices of hertz. Pink noise puts the same energy in each octave, so it sounds even from bottom to top.',
  },
];

// ────────────────────────────────────────────────────────────── Harmonic ──
const HARMONIC: readonly Q[] = [
  {
    id: 'multiples',
    prompt: 'The fundamental is 100 Hz. Where does the 3rd harmonic sit?',
    options: ['300 Hz', '103 Hz', '150 Hz', '33 Hz'],
    correct: '300 Hz',
    explanation: 'Every harmonic is a whole-number multiple of the fundamental: 2 × 100 = 200 Hz, 3 × 100 = 300 Hz, and so on. Move the fundamental and the whole series moves with it.',
  },
  {
    id: 'amplitude',
    prompt: 'You raise the overall AMPLITUDE. What happens to the harmonic recipe?',
    options: [
      'Every partial gets louder by the same amount — no harmonics are added',
      'New harmonics appear at the top',
      'The fundamental moves up',
      'The odd harmonics get louder than the even ones',
    ],
    correct: 'Every partial gets louder by the same amount — no harmonics are added',
    explanation: 'Level scales the whole recipe equally. Changing the balance between partials — or bending the wave with distortion — is what changes the harmonic content.',
  },
  {
    id: 'phase-deafness',
    prompt: 'You change only the PHASES of the partials. The waveform’s shape changes a lot. How does the steady tone sound?',
    options: [
      'Nearly the same — the ear is largely insensitive to the phases of a steady tone’s partials',
      'An octave higher',
      'Completely different, like a new instrument',
      'Silent, because the partials cancel',
    ],
    correct: 'Nearly the same — the ear is largely insensitive to the phases of a steady tone’s partials',
    explanation: 'Same amplitudes, different phases: a very different picture on the waveform, but nearly the same sound. That is why the spectrum, not the scope shape, tells you the timbre.',
  },
  {
    id: 'build-square',
    prompt: 'You stack the 1st, 3rd, 5th, 7th… harmonics, each at 1/n of the fundamental’s level. Which waveform are you building?',
    options: ['Square', 'Sawtooth', 'Triangle', 'Sine'],
    correct: 'Square',
    explanation: 'Odd harmonics at 1/n add up to a square — and the more you add, the squarer it gets. All harmonics at 1/n would build a sawtooth; odd at 1/n² a triangle.',
  },
];

// ──────────────────────────────────────────────────────────────── Envelope ──
const ENVELOPE: readonly Q[] = [
  {
    id: 'sustain-is-level',
    prompt: 'In an ADSR envelope, what is SUSTAIN?',
    options: [
      'A level — the level held while energy keeps being supplied',
      'A time — how long the note lasts',
      'The fall from the peak',
      'The fall back to silence after the energy stops',
    ],
    correct: 'A level — the level held while energy keeps being supplied',
    explanation: 'Attack, decay and release are times; sustain is a level. With zero sustain a sound is percussive — it can only decay.',
  },
  {
    id: 'rise-time',
    prompt: 'Rise time is measured between which two points of the attack?',
    options: ['10% and 90% of peak', '0% and 100% of peak', '50% and 100% of peak', 'The peak and the sustain level'],
    correct: '10% and 90% of peak',
    explanation: 'Rise time skips the slow start and the final approach, so it is always shorter than the attack itself — about 32 ms for a straight-line 40 ms attack.',
  },
  {
    id: 'crest-factor',
    prompt: 'What is crest factor?',
    options: [
      'The gap between one sound’s peak level and its average level',
      'The gap between the loudest and quietest moments of a whole performance',
      'The length of the attack',
      'The level at which a limiter starts working',
    ],
    correct: 'The gap between one sound’s peak level and its average level',
    explanation: 'A snare hit has a big crest factor: a peak meter reads it high while an average meter barely moves. Loudest-to-quietest across a performance is dynamic range — a different measure.',
  },
  {
    id: 'release-vs-tail',
    prompt: 'A snare rings on in a big hall long after it is struck. Is that long tail the snare’s RELEASE?',
    options: [
      'No — release is the source stopping; the tail is the room still returning energy',
      'Yes — a long release and a long reverb tail are the same thing',
      'Yes — the room lengthens the snare’s attack and release',
      'Only if the snare is miked closely',
    ],
    correct: 'No — release is the source stopping; the tail is the room still returning energy',
    explanation: 'ADSR describes the sound at its source. What the room adds is propagation — reverberation. The snare’s own envelope is the same at one metre or twenty.',
  },
];

// ──────────────────────────────────────────────────────────────── Stereo ──
const STEREO: readonly Q[] = [
  {
    id: 'width-is-side',
    prompt: 'What does a WIDTH control actually change?',
    options: [
      'The level of the SIDE (what differs between left and right) against the MID (what they share)',
      'The volume of the left channel only',
      'The amount of reverb',
      'The pan position of the whole mix',
    ],
    correct: 'The level of the SIDE (what differs between left and right) against the MID (what they share)',
    explanation: 'More side means wider — and less mono-safe. 0% width is pure mid (mono); 100% is the image as recorded; past 100% the side is turned up above its recorded level.',
  },
  {
    id: 'mono-fold',
    prompt: 'A mix at 200% width sounds huge on headphones. What happens when you fold it to mono?',
    options: [
      'The side signal cancels, so the extra width disappears and the mix can sound hollow',
      'It gets twice as wide',
      'It gets louder',
      'Nothing — mono ignores width',
    ],
    correct: 'The side signal cancels, so the extra width disappears and the mix can sound hollow',
    explanation: 'Adding left and right cancels the side component and keeps only the mid. Phone speakers, many PAs and broadcast can play in mono, so the mono check matters.',
  },
  {
    id: 'bass-mono',
    prompt: 'Why make the bass mono below roughly 100–150 Hz?',
    options: [
      'Wide low frequencies can be phasey and unstable; mono lows stay solid on most systems',
      'Bass is louder in stereo',
      'Mono bass adds reverb',
      'Stereo bass cannot be recorded',
    ],
    correct: 'Wide low frequencies can be phasey and unstable; mono lows stay solid on most systems',
    explanation: 'A bass-mono control (this lab offers 120 Hz) collapses everything below its frequency to mono. Treat the frequency as a suggested starting point and listen.',
  },
  {
    id: 'correlation-negative',
    prompt: 'The correlation meter sits near −1. What will a mono listener hear?',
    options: [
      'Heavy cancellation — the mix collapses toward silence',
      'The same mix, only wider',
      'A louder mix',
      'Nothing different — mono ignores correlation',
    ],
    correct: 'Heavy cancellation — the mix collapses toward silence',
    explanation: 'Near −1, whatever the left channel does, the right does the opposite. Summed to mono they subtract. The meter is the early warning.',
  },
];

// ────────────────────────────────────────────────────────────── Binaural ──
const BINAURAL: readonly Q[] = [
  {
    id: 'itd',
    prompt: 'What is the interaural time difference (ITD)?',
    options: [
      'The far ear hears the sound slightly later than the near ear',
      'The far ear hears the sound louder',
      'The sound reaches both ears at the same moment',
      'The delay between a sound and its echo',
    ],
    correct: 'The far ear hears the sound slightly later than the near ear',
    explanation: 'Sound has to travel around the head to reach the far ear — at most roughly 0.7 ms for a human-sized head. The brain uses that tiny delay to place the source.',
  },
  {
    id: 'head-shadow',
    prompt: 'The head shadow makes the far ear hear the sound…',
    options: [
      'Quieter and darker — the head blocks high frequencies more than low ones',
      'Louder and brighter',
      'Higher in pitch',
      'Exactly the same as the near ear',
    ],
    correct: 'Quieter and darker — the head blocks high frequencies more than low ones',
    explanation: 'Low frequencies bend around the head easily; high frequencies are shadowed. That level-and-tone difference (ILD) is the second cue the lab synthesizes.',
  },
  {
    id: 'headphones',
    prompt: 'Why does this lab need headphones?',
    options: [
      'On loudspeakers each ear hears both channels, so the cues mix in the air and the effect collapses',
      'Loudspeakers cannot play sine tones',
      'Headphones are louder',
      'Loudspeakers reverse left and right',
    ],
    correct: 'On loudspeakers each ear hears both channels, so the cues mix in the air and the effect collapses',
    explanation: 'Binaural cues are built for each ear separately. Speakers let both ears hear both channels (crosstalk), which scrambles the time and level differences.',
  },
  {
    id: 'no-elevation',
    prompt: 'This model can place sounds around you but not above or below. Why?',
    options: [
      'Up-and-down cues come from the outer ear’s filtering, which a time-and-level model does not produce',
      'Sound cannot come from above',
      'Headphones only have two drivers',
      'Elevation only works with a sine tone',
    ],
    correct: 'Up-and-down cues come from the outer ear’s filtering, which a time-and-level model does not produce',
    explanation: 'Time and level differences mostly tell left from right. Height — and much of front-from-back — comes from how the outer ear (pinna) colours sound, which this simplified model deliberately leaves out.',
  },
];

// ────────────────────────────────────────────────────────────── Autotune ──
const AUTOTUNE: readonly Q[] = [
  {
    id: 'cents',
    prompt: 'On the cents grid, how many cents make one semitone?',
    options: ['100', '12', '50', '1,200'],
    correct: '100',
    explanation: 'There is one grid line per semitone, 100 cents apart. 1,200 cents make an octave.',
  },
  {
    id: 'fast-retune',
    prompt: 'Why does a very FAST retune speed sound robotic?',
    options: [
      'Each note snaps instantly onto the grid, flattening natural glides and vibrato',
      'It adds distortion to the voice',
      'It shifts every note up an octave',
      'It slows the singer down',
    ],
    correct: 'Each note snaps instantly onto the grid, flattening natural glides and vibrato',
    explanation: 'The natural movement between and within notes is what makes a voice sound human. Removing it instantly is the deliberate "hard-tune" effect.',
  },
  {
    id: 'slow-short-notes',
    prompt: 'With a SLOW retune speed, short notes are often still a little out of tune. Why?',
    options: [
      'The note ends before the correction has time to arrive',
      'Slow retune only works on low notes',
      'Correction amount drops to 0% on short notes',
      'Short notes have no pitch',
    ],
    correct: 'The note ends before the correction has time to arrive',
    explanation: 'Retune speed is how fast the pitch is pulled toward the target. A slow pull sounds natural on long notes but cannot catch up on quick ones.',
  },
  {
    id: 'amount-math',
    prompt: 'A note is sung 40 cents flat and CORRECTION AMOUNT is 50%. Once the correction has settled, where does the note end up?',
    options: ['20 cents flat', 'Exactly in tune', '40 cents flat', '20 cents sharp'],
    correct: '20 cents flat',
    explanation: 'Correction amount sets how far toward the grid line the pitch is pulled. Half of a 40-cent error is removed, leaving 20 cents. 100% would land it on the line.',
  },
];

// ────────────────────────────────────────────────────────────── Cymatics ──
const CYMATICS: readonly Q[] = [
  {
    id: 'no-shape',
    prompt: 'What decides which figure appears on a plate at a given drive frequency?',
    options: [
      'The whole plate system — shape, size, thickness, material, supports, driver position and damping',
      'The frequency alone — each frequency has its own shape',
      'Only how loud the tone is',
      'Only the kind of sand used',
    ],
    correct: 'The whole plate system — shape, size, thickness, material, supports, driver position and damping',
    explanation: 'A frequency has no shape of its own. Change one thing about the plate and the same tone may stop being a resonance and the figure vanishes.',
  },
  {
    id: 'sand-nodes',
    prompt: 'Where does the sand collect on a vibrating plate?',
    options: [
      'On the nodal lines — the places that are not moving',
      'On the parts moving the most',
      'Evenly over the whole plate',
      'Only at the edges',
    ],
    correct: 'On the nodal lines — the places that are not moving',
    explanation: 'Sand is thrown off the moving regions and comes to rest where the plate stays still. Those still lines are the figure of one of the plate’s modes.',
  },
  {
    id: 'level-not-pattern',
    prompt: 'At a resonance, you raise the DRIVE LEVEL. What changes?',
    options: [
      'How far the plate moves — not which pattern appears',
      'The pattern switches to a different mode',
      'The resonance frequency moves higher',
      'The nodal lines double',
    ],
    correct: 'How far the plate moves — not which pattern appears',
    explanation: 'Level sets the size of the motion. Which mode responds is set by the frequency and the plate.',
  },
  {
    id: 'faraday-half',
    prompt: 'In the Liquid Studio, the standing waves on the surface oscillate at…',
    options: ['Half the drive frequency', 'Exactly the drive frequency', 'Twice the drive frequency', 'A random frequency'],
    correct: 'Half the drive frequency',
    explanation: 'Shaking a liquid up and down produces Faraday waves, which answer at half the drive frequency once the shake passes a threshold. The RESP readout shows that half frequency.',
  },
  {
    id: 'damping',
    prompt: 'What does more DAMPING do to a plate’s resonance?',
    options: [
      'Broadens it and lowers its peak, with almost no change to its frequency',
      'Moves it to a higher frequency',
      'Moves it to a lower frequency',
      'Removes the nodal lines entirely',
    ],
    correct: 'Broadens it and lowers its peak, with almost no change to its frequency',
    explanation: 'Lightly damped metals give sharp figures that need exact frequencies; heavily damped acrylic or wood gives blurrier figures across a wider band.',
  },
];

// ──────────────────────────────────────────────────────────── Harmonograph ──
const HARMONOGRAPH: readonly Q[] = [
  {
    id: 'fifth',
    prompt: 'Which frequency ratio draws the figure of a perfect fifth?',
    options: ['3:2', '2:1', '4:3', '5:4'],
    correct: '3:2',
    explanation: '2:1 is the octave, 3:2 the perfect fifth, 4:3 the perfect fourth and 5:4 the major third.',
  },
  {
    id: 'simple-ratio',
    prompt: 'With the ratio locked to a simple whole-number ratio such as 2:1, the figure…',
    options: [
      'Closes into a stable, repeating shape',
      'Turns into random scribbles',
      'Rotates faster and faster',
      'Disappears',
    ],
    correct: 'Closes into a stable, repeating shape',
    explanation: 'Simple ratios line up again and again, so the pen retraces the same path. The same simple ratios are the consonant musical intervals.',
  },
  {
    id: 'detune-beating',
    prompt: 'You detune one oscillator by +1% off a locked ratio. What does the figure do?',
    options: [
      'It slowly rotates (precesses) — that drift is beating made visible',
      'It instantly becomes a different interval',
      'It stops moving',
      'It doubles in size',
    ],
    correct: 'It slowly rotates (precesses) — that drift is beating made visible',
    explanation: 'A near-miss ratio slides in and out of alignment. You see it as a slowly turning figure and hear it as beating.',
  },
  {
    id: 'damping',
    prompt: 'What does DAMPING do to the drawing?',
    options: [
      'The swings shrink over time, so the figure spirals inward',
      'It changes the musical interval',
      'It makes the figure rotate',
      'It raises the pitch',
    ],
    correct: 'The swings shrink over time, so the figure spirals inward',
    explanation: 'Damping is the decay of each swing. Light damping draws many overlapping loops; heavy damping dies away quickly. The decay creates the classic spiral look.',
  },
];

// ────────────────────────────────────────────────────────────────── Bass ──
const BASS: readonly Q[] = [
  {
    id: 'twelfth-fret',
    prompt: 'Fretting at the 12th fret leaves half the string vibrating. What happens to the pitch?',
    options: [
      'It rises one octave — the frequency doubles',
      'It rises a perfect fifth',
      'It drops one octave',
      'It stays the same, but louder',
    ],
    correct: 'It rises one octave — the frequency doubles',
    explanation: 'Halve the vibrating length and the frequency doubles. A doubled frequency is an octave — open E at 41.2 Hz becomes 82.4 Hz.',
  },
  {
    id: 'seventh-fret',
    prompt: 'The 7th fret leaves about 2/3 of the string vibrating. Which interval is that above the open string?',
    options: ['A perfect fifth (3:2)', 'A perfect fourth (4:3)', 'An octave (2:1)', 'A major third (5:4)'],
    correct: 'A perfect fifth (3:2)',
    explanation: 'Two-thirds of the length gives 3/2 of the frequency — a perfect fifth. About 3/4 of the length (5th fret) gives a perfect fourth.',
  },
  {
    id: 'fret-spacing',
    prompt: 'Why do the frets get closer together toward the bridge?',
    options: [
      'Each fret raises the pitch by the same RATIO, and equal ratios need shrinking distances',
      'The string gets thinner toward the bridge',
      'Higher notes need less room to play',
      'It is a style choice by the builder',
    ],
    correct: 'Each fret raises the pitch by the same RATIO, and equal ratios need shrinking distances',
    explanation: 'Every fret multiplies the frequency by about 1.0595 (one equal-tempered semitone). Taking the same fraction off a string that keeps getting shorter means each step is shorter.',
  },
  {
    id: 'node-harmonic',
    prompt: 'You lightly TOUCH (not press) the string at 1/3 of its length and pluck. What do you hear?',
    options: [
      'The 3rd harmonic — three times the open-string frequency, an octave plus a fifth above',
      'The same note as fretting at the 7th fret',
      'The open string, unchanged',
      'The note one octave below the open string',
    ],
    correct: 'The 3rd harmonic — three times the open-string frequency, an octave plus a fifth above',
    explanation: 'Touching a node damps every mode that is not still there, leaving harmonics 3, 6, 9… Fretting at the 7th fret only gives a fifth above; the harmonic is an octave higher than that.',
  },
];

// ─────────────────────────────────────────────────────────────── Modular ──
const MODULAR: readonly Q[] = [
  {
    id: 'sine-filter',
    prompt: 'You sweep the filter CUTOFF on a SINE wave and the tone barely changes. Why?',
    options: [
      'A sine has no harmonics above the fundamental for the low-pass filter to remove',
      'The filter is broken',
      'Filters only work on noise',
      'The envelope is switched off',
    ],
    correct: 'A sine has no harmonics above the fundamental for the low-pass filter to remove',
    explanation: 'Subtractive synthesis starts bright and carves harmonics away. A sine has nothing to carve, so the filter can only change its level. A saw gives the filter the most to work with.',
  },
  {
    id: 'lfo-destinations',
    prompt: 'The same LFO is moved from CUTOFF to PITCH. What effect do you get now?',
    options: ['Vibrato', 'Tremolo', 'A filter wobble', 'Reverb'],
    correct: 'Vibrato',
    explanation: 'One LFO, three classic effects: on pitch it is vibrato, on cutoff a wobble, on the amplifier tremolo. If an effect sounds wrong, check the routing first.',
  },
  {
    id: 'env-cutoff',
    prompt: 'Each note starts bright and darkens as it fades — the classic synth pluck. Which routing creates that?',
    options: ['Envelope → filter cutoff', 'LFO → amplifier', 'LFO → pitch', 'Sequencer → amplifier only'],
    correct: 'Envelope → filter cutoff',
    explanation: 'The envelope opens the filter at the start of each note and closes it as it decays. The envelope on the VCA shapes loudness; on the cutoff it shapes brightness.',
  },
  {
    id: 'signal-order',
    prompt: 'In the basic voice, what order does the audio travel in?',
    options: [
      'Oscillator (VCO) → filter (VCF) → amplifier (VCA) → output',
      'Filter → oscillator → amplifier → output',
      'Amplifier → filter → oscillator → output',
      'LFO → envelope → output',
    ],
    correct: 'Oscillator (VCO) → filter (VCF) → amplifier (VCA) → output',
    explanation: 'The VCO makes the tone, the VCF shapes its harmonics and the VCA shapes its loudness. The LFO, envelope and sequencer are control signals that steer those modules.',
  },
];

// ──────────────────────────────────────────────────────────────────── FM ──
const FM: readonly Q[] = [
  {
    id: 'sideband-math',
    prompt: 'The carrier is 200 Hz and the modulator is 100 Hz. Where do the first pair of sidebands sit?',
    options: ['100 Hz and 300 Hz', '150 Hz and 250 Hz', '200 Hz and 400 Hz', '50 Hz and 350 Hz'],
    correct: '100 Hz and 300 Hz',
    explanation: 'Sidebands sit at carrier ± k × modulator. The first pair (k = 1) is 200 ± 100 Hz. The modulator frequency sets the spacing.',
  },
  {
    id: 'index',
    prompt: 'What does raising the MODULATION INDEX mainly change?',
    options: [
      'How many sidebands are strong — the brightness',
      'The pitch of the note',
      'The spacing between sidebands',
      'Only the overall volume',
    ],
    correct: 'How many sidebands are strong — the brightness',
    explanation: 'The index sets how much energy spreads into sidebands. Spacing comes from the modulator frequency (the ratio), and the carrier and ratio together set the pitch.',
  },
  {
    id: 'non-integer',
    prompt: 'You set a non-integer ratio such as 1.41. How does the tone change?',
    options: [
      'The sidebands land between harmonics — a bell-like, metallic tone with an unclear pitch',
      'It becomes a pure sine',
      'It drops exactly one octave',
      'Nothing changes',
    ],
    correct: 'The sidebands land between harmonics — a bell-like, metallic tone with an unclear pitch',
    explanation: 'Whole-number and other simple ratios put the sidebands on a harmonic series (pitched, brassy or organ-like). Odd ratios like 1.41 scatter them between harmonics — inharmonic, like a bell.',
  },
  {
    id: 'index-zero',
    prompt: 'With the modulation index at 0, what do you hear?',
    options: ['A pure sine — the carrier alone', 'Silence', 'White noise', 'The modulator alone'],
    correct: 'A pure sine — the carrier alone',
    explanation: 'At index 0 the modulator does nothing to the carrier, so there are no sidebands. Raise the index and sideband pairs appear.',
  },
];

// ─────────────────────────────────────────────────────── Microphone Selection ──
const MIC_SELECT: readonly Q[] = [
  {
    id: 'categories',
    prompt: '"Condenser", "shotgun" and "lavalier" are often listed side by side. What do they actually describe?',
    options: [
      'Three different things — how it converts sound, how it is directional, and its physical form',
      'Three competing types — a mic is only ever one of them',
      'Three price levels',
      'Three polar patterns',
    ],
    correct: 'Three different things — how it converts sound, how it is directional, and its physical form',
    explanation: 'Condenser names the transducer inside, shotgun names a directivity design, lavalier names a form factor. One mic can be two of them, like a condenser shotgun or a condenser lav.',
  },
  {
    id: 'lectern-rumble',
    prompt: 'A lectern mic keeps picking up stage rumble under the speech. Which frequency response helps most?',
    options: [
      'One with a low-frequency rolloff',
      'A perfectly flat response',
      'One with a strong bass boost',
      'One with a presence boost around 4 kHz',
    ],
    correct: 'One with a low-frequency rolloff',
    explanation: 'The rumble lives below the useful speech band, so rolling off the lows removes it without touching the voice. Flat is a choice, not automatically "best" — here it faithfully reproduces the rumble too.',
  },
  {
    id: 'self-noise',
    prompt: 'A microphone’s self-noise matters MOST when recording…',
    options: [
      'Quiet sources, such as soft strings or room ambience',
      'A kick drum up close',
      'A loud guitar amplifier',
      'A shouted announcement',
    ],
    correct: 'Quiet sources, such as soft strings or room ambience',
    explanation: 'On a quiet source the signal sits just above the mic’s own noise floor, so any hiss is exposed. On a loud source the noise is buried far below.',
  },
  {
    id: 'label-vs-spec',
    prompt: 'A microphone is sold as a "vocal mic". Can it be the right choice for a loud guitar cabinet?',
    options: [
      'Yes, if its specs — maximum SPL, pattern and response — suit the job',
      'No — a vocal mic only works on voices',
      'Only if it is a condenser',
      'Only if it is powered by 48 V phantom',
    ],
    correct: 'Yes, if its specs — maximum SPL, pattern and response — suit the job',
    explanation: 'Labels describe common use, not capability. The job sets the priorities, the priorities point to characteristics, and the characteristics choose the microphone.',
  },
];

// ──────────────────────────────────────────────────────────── Speech & Voice ──
const SPEECH: readonly Q[] = [
  {
    id: 'sibilance-source',
    prompt: 'Where does the hiss of an "S" come from?',
    options: [
      'Air forced through a narrow gap and broken up on the edge of the teeth',
      'The vocal folds vibrating very fast',
      'Air resonating in the nose',
      'The lips closing and bursting open',
    ],
    correct: 'Air forced through a narrow gap and broken up on the edge of the teeth',
    explanation: 'An S has no pitch — it is turbulence, with most of its energy roughly between 4 and 10 kHz. That is the sibilance a de-esser hunts.',
  },
  // Owner 2026-10-15: these three replace pop-filter / distance-halving /
  // formants, which repeated pages 8 and 11 almost word for word. They test
  // what the lab teaches (page 10's problem simulator) but never asked.
  {
    id: 'off-axis',
    prompt: 'A talker keeps turning to read notes beside a cardioid mic. The voice gets thinner, duller and quieter as they turn. What is happening?',
    options: [
      'They are speaking off-axis, so the mic’s pattern rolls off the highs and the level drops',
      'The proximity effect is fading as they turn away',
      'The room’s reflections are cancelling the voice',
      'Their vocal folds tighten when the head turns',
    ],
    correct: 'They are speaking off-axis, so the mic’s pattern rolls off the highs and the level drops',
    explanation: 'A directional mic hears best straight down its front. To the side its pickup falls and the highs fall first, so the voice dulls and drops. Aim the front of the capsule at the mouth, keep the head still, or use a wider pattern for a talker who moves.',
  },
  {
    id: 'mouth-clicks',
    prompt: 'A close-miked voice-over has small dry ticks between words. What is the usual cause, and the first fix?',
    options: [
      'Saliva and a dry mouth; water before the take and a little more distance',
      'Electrical interference; replace the mic cable',
      'Plosives; add a pop filter',
      'Clipping at the preamp; turn the gain down',
    ],
    correct: 'Saliva and a dry mouth; water before the take and a little more distance',
    explanation: 'Mouth clicks come from the tongue and lips parting through saliva, and a close mic hears every one. Water and a slightly larger distance reduce them at the source; editing or a de-clicker handles what is left. A pop filter stops air blasts, not clicks.',
  },
  {
    id: 'breath-noise',
    prompt: 'Loud gasps and whooshes land between phrases on a podcast. What helps most before any editing?',
    options: [
      'Breathe with the head turned slightly and set the mic to the side of the airflow',
      'Boost the bass so the breaths blend in',
      'Move the mic much closer so the voice covers them',
      'Switch to a brighter microphone',
    ],
    correct: 'Breathe with the head turned slightly and set the mic to the side of the airflow',
    explanation: 'Breath noise is fast air going straight into the capsule, often after long sentences. Turning the head to breathe and placing the mic out of the airflow (with a windscreen) stops it at the source; a gate or edit tidies the rest. Moving closer makes breaths louder, not quieter.',
  },
];

// ─────────────────────────────────────────────────────────── Vacuum Tube ──
const TUBE: readonly Q[] = [
  {
    id: 'warm-up',
    prompt: 'Why does tube gear need time to warm up?',
    options: [
      'The heater has to make the cathode hot enough to boil off electrons',
      'The glass must expand before it seals',
      'The plate has to cool down first',
      'The control grid needs to charge up',
    ],
    correct: 'The heater has to make the cathode hot enough to boil off electrons',
    explanation: 'No heat, no electrons, no current. A hot cathode releases electrons (thermionic emission); the positive plate then pulls them across the vacuum.',
  },
  {
    id: 'grid',
    prompt: 'You make the control grid MORE negative. What happens to the electron stream to the plate?',
    options: [
      'It shrinks — the grid’s field pushes more electrons back toward the cathode',
      'It grows larger',
      'It reverses direction',
      'Nothing — the grid only affects the glow',
    ],
    correct: 'It shrinks — the grid’s field pushes more electrons back toward the cathode',
    explanation: 'The grid is a sparse wire spiral; its electric field, not the wire itself, does the gating. A small grid voltage controlling a large plate current is amplification.',
  },
  {
    id: 'bias',
    prompt: 'What does "biasing" a tube set?',
    options: [
      'The idle point on its transfer curve, so the signal swings in the straight middle region',
      'The loudness of the output',
      'The colour of the glow',
      'The warm-up time',
    ],
    correct: 'The idle point on its transfer curve, so the signal swings in the straight middle region',
    explanation: 'Bias is where the tube rests with no signal. Too negative and the bottom of the wave is cut off; too positive and the top runs into saturation.',
  },
  {
    id: 'soft-clip',
    prompt: 'Driven past its straight region, how does a tube distort?',
    options: [
      'Its curve bends and ROUNDS the peaks (soft clipping)',
      'It chops the peaks off with sharp square corners',
      'It turns the signal off completely',
      'It shifts the pitch upward',
    ],
    correct: 'Its curve bends and ROUNDS the peaks (soft clipping)',
    explanation: 'That gentle bend compresses the loudest moments and adds harmonics related to the note — most of what people mean by "tube sound".',
  },
  {
    id: 'safety',
    prompt: 'Why can a switched-off tube amplifier still be dangerous inside?',
    options: [
      'Its filter capacitors can hold hundreds of volts long after power-down',
      'The tubes stay hot enough to ignite',
      'The heater keeps running on its own',
      'It is not dangerous once unplugged',
    ],
    correct: 'Its filter capacitors can hold hundreds of volts long after power-down',
    explanation: 'Tube circuits run at hundreds of volts, and the capacitors store that charge. Servicing is a job for qualified technicians.',
  },
];

// ────────────────────────────────────────────────────── Amplifier Principles ──
const AMP: readonly Q[] = [
  {
    id: 'energy-source',
    prompt: 'Where does the energy in an amplifier’s output come from?',
    options: [
      'The power supply — the input signal only controls how it is delivered',
      'The input signal, multiplied inside the amplifier',
      'The loudspeaker',
      'The volume knob',
    ],
    correct: 'The power supply — the input signal only controls how it is delivered',
    explanation: 'A small control signal regulates a much larger flow of supply current to the load. The amplifier spends supply energy; it does not create it.',
  },
  {
    id: 'clipping',
    prompt: 'When does an amplifier clip?',
    options: [
      'When the output it is asked for exceeds what the supply rails can deliver',
      'Whenever its volume control is above halfway',
      'Whenever it drives an 8 Ω load',
      'Only when it is cold',
    ],
    correct: 'When the output it is asked for exceeds what the supply rails can deliver',
    explanation: 'The output can never swing past its rails. Ask for more and the peaks flatten — that flat top IS the rail.',
  },
  {
    id: 'double-power',
    prompt: 'Going from a 100 W amplifier to a 200 W amplifier gains you about…',
    options: ['+3 dB', '+6 dB', '+10 dB', 'Twice the loudness'],
    correct: '+3 dB',
    explanation: '10 × log₁₀(200 ÷ 100) ≈ 3 dB — clearly audible, but far from twice as loud, which takes roughly ten times the power.',
  },
  {
    id: 'crossover',
    prompt: 'Where does crossover distortion appear in a push-pull output stage?',
    options: [
      'At the zero crossing, where one device hands the waveform over to the other',
      'At the very top of the waveform',
      'Only at full volume',
      'Only in the power supply',
    ],
    correct: 'At the zero crossing, where one device hands the waveform over to the other',
    explanation: 'With too little bias there is a gap around zero that belongs to neither device. Class AB overlaps their conduction to close it, at the cost of some idle current and heat.',
  },
  {
    id: 'upstream-clip',
    prompt: 'The sound is harsh and distorted, but the amplifier’s CLIP light stays dark. The mixer meters are pinned red. Where is the problem?',
    options: [
      'Upstream — the mixer is clipping, and the amplifier is faithfully reproducing it',
      'The amplifier is clipping and its light is faulty',
      'The loudspeaker load is too high',
      'The speaker cable is too short',
    ],
    correct: 'Upstream — the mixer is clipping, and the amplifier is faithfully reproducing it',
    explanation: 'Turning the amplifier down only makes the distortion quieter. Fix the gain structure at the stage that is clipping.',
  },
];

// ─────────────────────────────────────────────────────────────── Equalizer ──
const EQ: readonly Q[] = [
  {
    id: 'q-width',
    prompt: 'You raise an EQ band’s Q from 0.7 to 8. What happens to the band?',
    options: [
      'It gets narrower — a higher Q affects a smaller range of frequencies',
      'It gets wider',
      'It gets louder',
      'It moves to a higher frequency',
    ],
    correct: 'It gets narrower — a higher Q affects a smaller range of frequencies',
    explanation: 'Q = centre frequency ÷ bandwidth, so a bigger Q number means a narrower band. Wide Q suits broad, musical moves; narrow Q suits surgical notches. Gain changes the amount, not the width.',
  },
  {
    id: 'high-pass',
    prompt: 'Which filter shape removes rumble below a chosen frequency and leaves everything above it alone?',
    options: ['High-pass', 'Low-pass', 'High shelf', 'Peak (bell) boost'],
    correct: 'High-pass',
    explanation: 'A high-pass filter passes the highs and cuts the lows below its cutoff, more the further down you go, at its set slope. It is the standard rumble-and-mud eraser. A low-pass does the opposite.',
  },
  {
    id: 'graphic-vs-parametric',
    prompt: 'What is the difference between a graphic EQ band and a parametric EQ band?',
    options: [
      'A graphic band has a fixed frequency and width — only its gain moves; a parametric band adjusts frequency, gain and Q',
      'A graphic EQ can only cut; a parametric EQ can only boost',
      'They are the same thing with different faceplates',
      'A parametric band has a fixed frequency; a graphic band can move',
    ],
    correct: 'A graphic band has a fixed frequency and width — only its gain moves; a parametric band adjusts frequency, gain and Q',
    explanation: 'Graphic EQ gives fast, fixed-band control (one fader per octave or per third of an octave). Parametric EQ gives precision. Note that a graphic’s sliders are not its exact response — neighbouring bands overlap.',
  },
  {
    id: 'slope',
    prompt: 'A high-pass filter has a slope of 24 dB per octave. What does that mean?',
    options: [
      'Past the cutoff, each further octave down is about another 24 dB quieter',
      'It cuts exactly 24 dB at the cutoff frequency',
      'It is 24 octaves wide',
      'It boosts 24 dB above the cutoff',
    ],
    correct: 'Past the cutoff, each further octave down is about another 24 dB quieter',
    explanation: 'Slope is a RATE of attenuation beyond the transition region. Steeper slopes give a harder edge — and a larger phase shift near the corner.',
  },
  {
    id: 'cut-first',
    prompt: 'Why is cutting often suggested before boosting?',
    options: [
      'Cutting cleans up a problem without using up headroom',
      'Boosting is not possible on most equalizers',
      'Cuts change the pitch less than boosts',
      'Cutting always makes the sound louder',
    ],
    correct: 'Cutting cleans up a problem without using up headroom',
    explanation: 'A boost raises the level and eats headroom, and louder tends to fool the ear into hearing "better". A suggested starting habit: cut to clean up, boost sparingly, and level-match before and after.',
  },
];

/**
 * The checks, keyed by RUNTIME labId — the id in UNDERSTANDING_LAB_IDS
 * (trainingLabKeys.ts), which is what each screen renders the check under and
 * what maps a passed check to its tr_ key.
 */
export const PRACTICE_LAB_CHECKS: Record<string, readonly UnderstandingQuestion[]> = {
  eq: EQ,
  compression: COMPRESSION,
  gate: GATE,
  limiter: LIMITER,
  'smart-processors': DEESSER,
  delay: DELAY,
  reverb: REVERB,
  chorus: CHORUS,
  flanger: FLANGER,
  phaser: PHASER,
  distortion: DISTORTION,
  phase: PHASE,
  oscillator: OSCILLATOR,
  noise: NOISE,
  harmonic: HARMONIC,
  fm: FM,
  modular: MODULAR,
  envelope: ENVELOPE,
  stereo: STEREO,
  binaural: BINAURAL,
  autotune: AUTOTUNE,
  cymatics: CYMATICS,
  harmonograph: HARMONOGRAPH,
  bass: BASS,
  micselect: MIC_SELECT,
  speech: SPEECH,
  tube: TUBE,
  amp: AMP,
};
