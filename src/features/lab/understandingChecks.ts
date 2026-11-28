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
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      '4 dB': 'That is the ratio’s first number, not the result. At 4:1, how many dB come out for every 4 dB that go in above the threshold?',
      '8 dB': 'That would be 1:1, no compression at all. At 4:1 the RATIO lets only part of the 8 dB through.',
      '32 dB': 'A compressor can only shrink the overshoot, never grow it past the 8 dB that went in.',
    },
  },
  {
    id: 'below-threshold',
    prompt: 'With makeup gain at 0 dB, what does a compressor do to a signal that stays BELOW its threshold the whole time?',
    options: [
      'Nothing — it passes through at the same level',
      'Turns it down by the amount the RATIO sets',
      'Turns it up by the ratio to match the peaks',
      'Removes its transients but leaves the rest',
    ],
    correct: 'Nothing — it passes through at the same level',
    explanation: 'Below the threshold the transfer curve stays 1:1 and the gain-reduction meter reads 0 dB. Lower the threshold into the signal and the compressor starts working.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Turns it down by the amount the RATIO sets': 'The RATIO only applies to what rises above the THRESHOLD. Watch GR while the signal stays under the line.',
      'Turns it up by the ratio to match the peaks': 'A compressor never turns anything up by its ratio. Only MAKEUP raises the level, and here it is at 0 dB.',
      'Removes its transients but leaves the rest': 'Taming a transient needs the level to cross the THRESHOLD first, so the compressor has something to react to.',
    },
  },
  {
    id: 'attack-punch',
    prompt: 'You want a drum’s initial hit to come through before the compressor clamps down on the ring after it. Which change does that?',
    options: ['A slower attack, such as 25 ms', 'The fastest attack, such as 0.5 ms', 'A higher ratio', 'More makeup gain'],
    correct: 'A slower attack, such as 25 ms',
    explanation: 'Attack sets how fast the compressor clamps once the signal crosses the threshold. A slower attack lets most of the first few milliseconds — the hit — through, then controls what follows. A very fast attack dulls the hit itself.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The fastest attack, such as 0.5 ms': 'Look at the ATTACK key: 0.5 ms FAST clamps instantly, so the hit itself gets caught and dulled.',
      'A higher ratio': 'RATIO sets how hard it squeezes, not how soon. The hit still gets caught if the clamp arrives too early.',
      'More makeup gain': 'MAKEUP raises the whole output after compression; it does not change when the compressor acts on the hit.',
    },
  },
  {
    id: 'makeup',
    prompt: 'What is MAKEUP gain for?',
    options: [
      'Raising the whole signal back up after the loud parts were turned down',
      'Setting how fast the compressor reacts once a peak crosses the line',
      'Setting the level the signal must reach before compression starts',
      'Stopping the output from ever going past a fixed ceiling, like a limiter',
    ],
    correct: 'Raising the whole signal back up after the loud parts were turned down',
    explanation: 'Compression lowers the peaks, so the track gets quieter overall. Makeup gain raises everything back up. When comparing, match the levels — louder tends to sound "better" to the ear.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Setting how fast the compressor reacts once a peak crosses the line': 'How fast it reacts is ATTACK, and RELEASE for letting go. MAKEUP comes after all of that.',
      'Setting the level the signal must reach before compression starts': 'The level where compression starts is THRESHOLD. MAKEUP does not decide when anything happens.',
      'Stopping the output from ever going past a fixed ceiling, like a limiter': 'A fixed ceiling is a limiter’s CEILING. MAKEUP can push the output up, not hold it down.',
    },
  },
];

// ────────────────────────────────────────────────────────────────── Gate ──
const GATE: readonly Q[] = [
  {
    id: 'which-side',
    prompt: 'What does a gate do to sound that falls BELOW its threshold?',
    options: [
      'Turns it down toward the RANGE (floor) setting',
      'Lets it through unchanged, exactly as it came in',
      'Turns it up so the quiet parts are easier to hear',
      'Compresses it by a set ratio, such as 4:1',
    ],
    correct: 'Turns it down toward the RANGE (floor) setting',
    explanation: 'A gate works on the other side of the threshold from a compressor: loud sound above the threshold passes untouched, quiet sound below it (bleed, hum, spill) is turned down toward the floor.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Lets it through unchanged, exactly as it came in': 'That is what a gate does to sound ABOVE its threshold. Watch the quiet tail between two hits on OUT.',
      'Turns it up so the quiet parts are easier to hear': 'A gate never adds level. Watch the quiet tail between two hits on OUT: does it grow or shrink?',
      'Compresses it by a set ratio, such as 4:1': 'A ratio is a compressor’s control, and it works above the threshold. This gate has no ratio: look at what RANGE does.',
    },
  },
  {
    id: 'range-partial',
    prompt: 'The gate’s RANGE is set to −20 dB instead of full silence. What happens when the gate closes?',
    options: [
      'The signal drops by 20 dB but stays faintly audible',
      'The signal is cut to complete silence until the next hit',
      'The signal gets 20 dB louder while the gate is closed',
      'The gate stops opening at all, even on the loud hits',
    ],
    correct: 'The signal drops by 20 dB but stays faintly audible',
    explanation: 'Range sets how far the gate turns down when closed. A partial floor lets leakage duck instead of vanishing, which often sounds more natural than full silence.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The signal is cut to complete silence until the next hit': 'That is RANGE at −70 dB SILENCE. Read the line under −20 dB GENTLE in the RANGE key.',
      'The signal gets 20 dB louder while the gate is closed': 'Mind the minus sign: −20 dB is a cut. A closed gate turns sound down, never up.',
      'The gate stops opening at all, even on the loud hits': 'RANGE does not decide WHEN the gate opens; THRESH does. RANGE only sets how deep the cut goes.',
    },
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
    // Lab fix round 2026-11-14 (F7 via the coordinator): the old text stated Q4's answer word for word
    // ("HOLD keeps the gate open for a minimum time"); this keeps the idea without naming it.
    explanation: 'Chatter is the signal wobbling around the threshold. The fix is to stop the gate closing the instant the level dips: more time before it may close, or a gentler close, rides out the wobble instead of slamming shut on every one.',
    // Lab fix round 2026-11-14 (S2): why each wrong option is not right — never the answer.
    why: {
      'Shorten the RELEASE as far as it goes': 'Look at the RELEASE key: its shortest setting is labeled 20 ms CHATTER. A faster release slams shut on every wobble.',
      'Set the RANGE to full silence': 'A deeper floor makes each flicker MORE obvious: the RANGE key calls −70 dB SILENCE the maximum chatter risk.',
      'Remove the HOLD entirely': 'Taking HOLD away removes a control that steadies the gate, so the flicker gets worse, not better.',
    },
  },
  {
    id: 'hold-meaning',
    prompt: 'What does the HOLD control do?',
    options: [
      'Keeps the gate open a minimum time after the signal falls below the threshold',
      'Sets how far the gate turns the signal down once it has closed',
      'Sets the level the signal must reach before the gate will open',
      'Sets how loud the signal is once the gate has opened again',
    ],
    correct: 'Keeps the gate open a minimum time after the signal falls below the threshold',
    explanation: 'Hold is a minimum open time before the release begins — the main anti-chatter control. Range is the depth, and threshold is the opening level.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Sets how far the gate turns the signal down once it has closed': 'That is RANGE (FLOOR): the depth of the cut when the gate is closed.',
      'Sets the level the signal must reach before the gate will open': 'That is THRESHOLD (THRESH): the level that opens the gate.',
      'Sets how loud the signal is once the gate has opened again': 'An open gate passes sound unchanged, so no gate control sets that level. HOLD is about time, not level.',
    },
  },
];

// ─────────────────────────────────────────────────────────────── Limiter ──
const LIMITER: readonly Q[] = [
  {
    id: 'ceiling-rule',
    prompt: 'What is the defining rule of a brickwall limiter’s CEILING?',
    options: [
      'The output never goes above it, however hard the input pushes',
      'The output always sits exactly at it, whatever the input does',
      'Anything below it is turned up until it reaches the ceiling',
      'It sets how fast the limiter recovers after each peak',
    ],
    correct: 'The output never goes above it, however hard the input pushes',
    explanation: 'A limiter behaves like a compressor with an infinite ratio: above the ceiling the transfer curve goes flat. Below it the signal passes untouched.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The output always sits exactly at it, whatever the input does': 'Below the ceiling the signal passes untouched, so quiet parts stay quiet. Try a ceiling below and above the source’s −20 dBFS peaks.',
      'Anything below it is turned up until it reaches the ceiling': 'A limiter only turns peaks down; it never raises quiet parts toward the CEILING.',
      'It sets how fast the limiter recovers after each peak': 'Recovery speed is RELEASE (RLS), a separate key. CEILING is about level, not time.',
    },
  },
  {
    id: 'gr-math',
    prompt: 'The lab’s source peaks at −20 dBFS and the ceiling is set to −25 dBFS. How much gain reduction does the limiter apply?',
    options: ['5 dB', '20 dB', '25 dB', '45 dB'],
    correct: '5 dB',
    explanation: 'The peaks sit 5 dB above the ceiling (−20 vs −25), so the limiter holds them down by 5 dB. On a steady tone that reduction stays constant on the GR meter.',
    // Lab fix round 2026-11-14 (F7 via the coordinator; audit pattern 4): a wrong pick used to print the
    // explanation above, which states the number. It now waits for a second miss; the first miss gets this.
    hint: 'Count how far the peaks sit ABOVE the ceiling: the limiter turns them down by exactly that much, never more.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      '20 dB': '−20 dBFS is where the peaks sit, not how much they are turned down. Count only the part above the CEILING.',
      '25 dB': 'That number is the CEILING setting itself. Gain reduction is how far the peaks have to come down to reach it.',
      '45 dB': 'Adding the two levels overshoots: the peaks only need to come down to the ceiling, not toward silence.',
    },
  },
  {
    id: 'chain-position',
    prompt: 'Where does a brickwall limiter usually belong in a processing chain?',
    options: [
      'At or near the very end, as the final safety net',
      'First, before any EQ, so the EQ gets a steady level',
      'Before the gate, so the gate never sees loud peaks',
      'Anywhere — the order of processors never matters',
    ],
    correct: 'At or near the very end, as the final safety net',
    explanation: 'Its job is a guaranteed ceiling. Any stage placed after it could push the level back over, so it normally sits last.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'First, before any EQ, so the EQ gets a steady level': 'Anything after the limiter, like an EQ boost, can push the peaks back over the CEILING it just set.',
      'Before the gate, so the gate never sees loud peaks': 'Placing it before other stages lets them change the level again, so its CEILING no longer holds at the output.',
      'Anywhere — the order of processors never matters': 'Order matters here: the CEILING is only a guarantee for the signal leaving the limiter, not for what later stages do.',
    },
  },
  {
    id: 'true-peak',
    prompt: 'Why is a ceiling of about −1 dBTP often suggested as a starting point for a final master, rather than 0 dBFS?',
    options: [
      'Peaks between the samples can go over 0 dBFS after conversion or lossy encoding',
      'A limiter set to 0 dBFS reacts more slowly and lets the first peak through',
      'Meters cannot display 0 dBFS, so you could not see what the master does',
      'It makes the master louder than a ceiling at 0 dBFS would',
    ],
    correct: 'Peaks between the samples can go over 0 dBFS after conversion or lossy encoding',
    explanation: 'The real waveform between samples can peak higher than the samples themselves (inter-sample peaks). A little margin, with true-peak detection, keeps those from clipping later.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'A limiter set to 0 dBFS reacts more slowly and lets the first peak through': 'Where the CEILING sits does not change how fast the limiter reacts. The margin is there for something that happens later.',
      'Meters cannot display 0 dBFS, so you could not see what the master does': 'Meters show 0 dBFS perfectly well. The worry is about what happens after the master leaves the limiter.',
      'It makes the master louder than a ceiling at 0 dBFS would': 'A ceiling of −1 holds the peaks 1 dB lower, so the master gets a touch quieter, not louder.',
    },
  },
];

// ───────────────────────────────────────── Smart Processors (De-Esser) ──
const DEESSER: readonly Q[] = [
  {
    id: 'where-s-lives',
    prompt: 'Roughly where does most of the energy of an "S" sit?',
    options: ['Between about 4 and 10 kHz', 'Between about 100 and 500 Hz', 'Between about 800 Hz and 1.5 kHz', 'Above about 20 kHz'],
    correct: 'Between about 4 and 10 kHz',
    explanation: 'An S is air turbulence at the teeth, with most of its energy roughly between 4 and 10 kHz. SH and CH sit lower, nearer 2–5 kHz. Vowels sit far below.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Between about 100 and 500 Hz': 'That is the body of the voice, where the vowels and the fundamental live. An S is hiss from air at the teeth.',
      'Between about 800 Hz and 1.5 kHz': 'That range sits in the middle of the vowels. Look at the Detector frequency hints for typical voices.',
      'Above about 20 kHz': 'Above 20 kHz is beyond human hearing, so a de-esser tuned there would catch nothing you can hear.',
    },
  },
  {
    id: 'why-not-eq',
    prompt: 'Why is a de-esser often a better tool for sibilance than a fixed EQ cut?',
    options: [
      'It turns down only while an S is present, so the vowels keep their brightness',
      'It cuts the high frequencies all the time, the same way a fixed EQ does',
      'It works on the low end instead of the highs, where the S really lives',
      'It makes every consonant louder so the S stands out less in the mix',
    ],
    correct: 'It turns down only while an S is present, so the vowels keep their brightness',
    explanation: 'An EQ cut is always on, so it dulls every vowel and breath along with the S. A de-esser only moves while its detector hears hiss.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'It cuts the high frequencies all the time, the same way a fixed EQ does': 'A cut that is always on is what STATIC EQ CUT shows: every vowel loses its brightness along with the S.',
      'It works on the low end instead of the highs, where the S really lives': 'Sibilance is high-frequency hiss, so a tool working on the low end would miss it entirely.',
      'It makes every consonant louder so the S stands out less in the mix': 'A de-esser only ever turns down; it never raises consonants. Watch the gain element in the signal path.',
    },
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
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'In the signal path, cutting the highs from the whole voice': 'If the filter sat in the audio path, the whole voice would lose its highs all the time, like STATIC EQ CUT.',
      'After the gain element, cleaning up what is left over': 'Follow WALK THE SIGNAL: after the gain element comes the output, and no filter sits there.',
      'Nowhere — a de-esser uses a high shelf instead': 'The lab’s path drawing names a Band-pass filter block. A shelf would be an EQ move on the voice itself.',
    },
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
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Broadband turns down only the hiss band; split-band turns the whole voice down': 'Right idea, names swapped. Switch between BROADBAND and SPLIT-BAND and watch which part of the voice ducks.',
      'They turn down the same thing but react at different speeds': 'Both modes share the same detector and threshold, so they react alike. The difference is in what gets turned down.',
      'They differ only in where the detector listens': 'The detector listens in the same place in both modes. Watch what the gain element acts on instead.',
    },
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
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Not enough reduction — the S sounds were never caught': 'If the S sounds were never caught, they would still hiss, not turn into TH. A lisp means something is happening to them.',
      'The detector frequency is set below 1 kHz': 'A detector that low would listen to the vowels, not the S. A lisp is about how hard the S gets turned down.',
      'The de-esser is bypassed': 'A bypassed de-esser changes nothing, so the S sounds would be as bright as before.',
    },
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
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      '120 ms': '120 is the tempo in beats per minute, not milliseconds. How long does one beat last if 120 fit in a minute?',
      '250 ms': '250 ms is half a beat at 120 BPM: an eighth note. A quarter note gets the whole beat.',
      '1,000 ms': '1,000 ms is two beats at 120 BPM: a half note. A quarter note gets one beat.',
    },
  },
  {
    id: 'feedback',
    prompt: 'What does the FEEDBACK control set?',
    options: [
      'How much of each echo feeds the next one, so how long the trail lasts',
      'The time between one repeat and the next, in milliseconds',
      'The balance between the dry sound and the echoes you hear',
      'Whether the repeats bounce between the left and right speakers',
    ],
    correct: 'How much of each echo feeds the next one, so how long the trail lasts',
    explanation: 'At 75% feedback each repeat is 75% of the one before, so the trail fades slowly. Spacing never changes with feedback — that is TIME. Near 100% the repeats barely fade; past it they build up and run away.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The time between one repeat and the next, in milliseconds': 'Spacing is DELAY TIME (TIME). Change FDBK and watch: the gaps between repeats stay the same.',
      'The balance between the dry sound and the echoes you hear': 'The dry-to-echo balance is MIX. FEEDBACK works inside the echo loop, not on the blend.',
      'Whether the repeats bounce between the left and right speakers': 'Bouncing between speakers is PING-PONG, a key of its own.',
    },
  },
  {
    id: 'slapback',
    prompt: 'Which setting describes a classic SLAPBACK echo?',
    options: [
      'A short delay (roughly 60–150 ms), one repeat, low feedback',
      'A long delay (over 1 second) with high feedback',
      'A delay matched to a whole note, with MIX at 100% WET',
      'Many repeats bouncing between left and right with PING-PONG on',
    ],
    correct: 'A short delay (roughly 60–150 ms), one repeat, low feedback',
    explanation: 'Slapback is a single quick repeat just behind the source. Set it much longer and it turns into a distinct echo instead.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'A long delay (over 1 second) with high feedback': 'Over a second with high feedback gives a long trail of distant echoes, not a single quick tap right behind the note.',
      'A delay matched to a whole note, with MIX at 100% WET': 'A whole note is a long gap, and 100% WET removes the dry sound. A slap sits right behind a source you still hear.',
      'Many repeats bouncing between left and right with PING-PONG on': 'That is a PING-PONG trail of many echoes. A slap is one echo, not a trail.',
    },
  },
  {
    id: 'damping',
    prompt: 'Why roll the highs off the repeats (REPEAT DAMPING)?',
    options: [
      'So the echoes sit back behind the source instead of piling up harshly',
      'So the repeats arrive sooner, closing the gap after the dry sound',
      'So there are more repeats before the echo trail dies away',
      'So the delay stays in time with the song when the tempo changes',
    ],
    correct: 'So the echoes sit back behind the source instead of piling up harshly',
    explanation: 'Each darker repeat recedes into the background, the way echoes do in a real space. Full-range repeats stack up and compete with the dry sound.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'So the repeats arrive sooner, closing the gap after the dry sound': 'When repeats arrive is DELAY TIME. REPEAT DAMPING changes the tone of each repeat, not when it lands.',
      'So there are more repeats before the echo trail dies away': 'How long the trail lasts is mostly FEEDBACK. Damping darkens each repeat; if anything, the trail fades a little sooner.',
      'So the delay stays in time with the song when the tempo changes': 'Staying in time is about DELAY TIME matching the tempo. Damping only changes how bright each repeat is.',
    },
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
      'The room is 60 meters long',
    ],
    correct: 'The reverb tail takes 2 seconds to fall by 60 dB',
    explanation: 'RT60 is a TIME — where the decay slope crosses −60 dB. How loud the reverb is belongs to MIX, and when it starts belongs to PRE-DELAY.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The reverb is twice as loud as the dry sound': 'How loud the reverb is belongs to MIX. RT60 is measured in seconds, so it describes a time.',
      '2 seconds pass before the reverb starts': 'The wait before the reverb begins is PRE-DELAY, and it is measured in milliseconds.',
      'The room is 60 meters long': 'The 60 in RT60 is not a length. On EXPLORE, the RT60 readout is named DECAY TIME.',
    },
  },
  {
    id: 'pre-delay',
    prompt: 'A vocal is getting lost in its reverb. Which control keeps the reverb but lets the words land clearly first?',
    options: ['Pre-delay', 'A longer RT60', 'Less high-frequency damping', 'A higher MIX'],
    correct: 'Pre-delay',
    explanation: 'Pre-delay opens a short gap between the dry sound and the start of the wash, so consonants arrive clean before the reverb. A suggested starting range is about 10–40 ms.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'A longer RT60': 'A longer RT60 makes the tail last longer, so the wash covers the words even more.',
      'Less high-frequency damping': 'Less HF DAMPING makes the tail brighter, and a bright tail competes even more with the consonants.',
      'A higher MIX': 'More MIX puts more reverb on the vocal and buries the words further.',
    },
  },
  {
    id: 'hf-damping',
    prompt: 'You increase HF DAMPING, so the highs fade faster inside the tail. How does the space sound?',
    options: [
      'Darker and softer, like a room with soft surfaces',
      'Brighter and more live, like a tiled bathroom',
      'Larger, as if the walls had moved farther apart',
      'Closer to the listener, as if the source moved in',
    ],
    correct: 'Darker and softer, like a room with soft surfaces',
    explanation: 'Soft surfaces absorb high frequencies first, so the tail darkens as it decays. Less damping gives a bright, live space.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Brighter and more live, like a tiled bathroom': 'Damping takes highs away from the tail. Compare HF DAMPING at DARK 2k and BRIGHT 12k and watch the tail’s color.',
      'Larger, as if the walls had moved farther apart': 'Size mostly comes from RT60, how long the tail lasts. HF DAMPING changes its tone more than its length.',
      'Closer to the listener, as if the source moved in': 'Distance is mostly MIX: less reverb against the dry sound brings a source forward. Damping changes the tail’s color.',
    },
  },
  {
    id: 'too-much-mix',
    prompt: 'A source sounds far away and washed out. What is the most direct fix?',
    options: ['Lower the reverb MIX', 'Raise the RT60', 'Set pre-delay to 0 ms', 'Reduce the HF damping'],
    correct: 'Lower the reverb MIX',
    explanation: 'Mix is the dry-to-reverb balance. A little places a source in a space; too much pushes it to the back and blurs clarity.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Raise the RT60': 'A longer RT60 adds even more tail, so the source sounds farther away, not closer.',
      'Set pre-delay to 0 ms': 'With no pre-delay the reverb starts right on the source, which blurs the attack more, not less.',
      'Reduce the HF damping': 'Less HF DAMPING brightens the tail; it does not change how much reverb sits against the dry sound.',
    },
  },
];

// ──────────────────────────────────────────────────────────────── Chorus ──
const CHORUS: readonly Q[] = [
  {
    id: 'mechanism',
    prompt: 'What creates the chorus effect?',
    options: [
      'A delayed copy whose delay time slowly wobbles, mixed with the dry signal',
      'Two identical copies panned hard left and right, with no delay between them',
      'A bank of narrow EQ boosts that sweeps slowly up and down the spectrum',
      'A long reverb tail that fills the space between the notes you play',
    ],
    correct: 'A delayed copy whose delay time slowly wobbles, mixed with the dry signal',
    explanation: 'The copy sits a few tens of milliseconds behind and its timing drifts, so its pitch wavers slightly. It beats against the steady dry voice — like two players who are never perfectly together.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Two identical copies panned hard left and right, with no delay between them': 'Identical copies with no delay never drift against each other, so there is nothing to beat. Look at what VOICE DELAY and RATE do on OUT.',
      'A bank of narrow EQ boosts that sweeps slowly up and down the spectrum': 'EQ changes level at fixed frequencies; it cannot make a pitch waver. This lab has no EQ key at all.',
      'A long reverb tail that fills the space between the notes you play': 'Reverb is many reflections dying away: it blurs the sound but has no steady wobble. This lab adds no room.',
    },
  },
  {
    id: 'full-wet',
    // Lab fix round 2026-11-14 (F7 via the coordinator): the lab's control is named MIX, not WET.
    prompt: 'At MIX 100% (100% wet) the chorus stops sounding like a chorus. What do you hear instead?',
    options: [
      'Vibrato — only the wobbling copy is left, with no dry voice to beat against',
      'Nothing — at 100% the effect is bypassed and only the dry signal is left',
      'A flanger, because removing the dry voice shortens the delay',
      'A louder, distorted chorus, because the wet copy is boosted to full level',
    ],
    correct: 'Vibrato — only the wobbling copy is left, with no dry voice to beat against',
    explanation: 'Chorus IS the interference between the dry voice and the detuned copy. Remove the dry voice and one wobbling pitch remains: vibrato.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Nothing — at 100% the effect is bypassed and only the dry signal is left': 'MIX 100% is the opposite of a bypass: it removes the dry signal, not the effect.',
      'A flanger, because removing the dry voice shortens the delay': 'MIX does not change the delay time; VOICE DELAY does. A flanger needs a far shorter delay than this lab’s 15–35 ms.',
      'A louder, distorted chorus, because the wet copy is boosted to full level': 'MIX trades dry against wet; it adds no gain and no clipping, so nothing gets louder or distorted.',
    },
  },
  {
    id: 'vs-flanger',
    // CH-03 (owner 2026-11-15, "build waves 1 thru 3"): the flanger comes in
    // the NEXT lab, so the prompt says how it sounds; the options are unchanged.
    prompt: 'A flanger (the next lab) makes a sweeping, jet-like whoosh. Compared with it, a chorus uses…',
    options: [
      'A longer delay (about 15–35 ms), so you hear shimmer instead of a sweeping comb',
      'A much shorter delay, under 1 ms, so the comb notches spread far apart',
      'No delay at all, only a slowly moving EQ boost on the high frequencies',
      'The same delay as a flanger, but with far more feedback to thicken it',
    ],
    correct: 'A longer delay (about 15–35 ms), so you hear shimmer instead of a sweeping comb',
    explanation: 'At chorus delays the comb notches sit so close together that you hear the beating instead of a jet. A flanger’s delay is only a few milliseconds.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'A much shorter delay, under 1 ms, so the comb notches spread far apart': 'That is backwards: the flanger is the one with the very short delay. Look at the chorus VOICE DELAY choices.',
      'No delay at all, only a slowly moving EQ boost on the high frequencies': 'Both effects are built on a delayed copy; neither is an EQ. The chorus has a VOICE DELAY key for a reason.',
      'The same delay as a flanger, but with far more feedback to thicken it': 'Feedback makes a flanger ring and scream; this chorus has no FEEDBACK key at all.',
    },
  },
  {
    id: 'rate-high',
    prompt: 'You push the chorus RATE up to about 3 Hz. How does it tend to sound?',
    options: ['Seasick and out of tune', 'Smoother and more subtle', 'Like a longer echo', 'Exactly the same, only louder'],
    correct: 'Seasick and out of tune',
    explanation: 'Rate is the speed of the wobble. Slow rates give a gentle shimmer; fast rates make the pitch movement obvious, which reads as detuning.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Smoother and more subtle': 'Smooth and subtle is the slow end of RATE, around 0.1–0.25 Hz. Faster means the pitch swings more often, not less.',
      'Like a longer echo': 'RATE sets how fast the wobble moves; it does not change VOICE DELAY, so no echo appears or grows longer.',
      'Exactly the same, only louder': 'RATE changes speed, not level. Nothing in the chorus adds gain when the wobble gets faster.',
    },
  },
];

// ─────────────────────────────────────────────────────────────── Flanger ──
const FLANGER: readonly Q[] = [
  {
    id: 'notch-spacing',
    prompt: 'A flanger’s center delay is 2 ms. How far apart are its comb notches?',
    options: ['500 Hz', '2 Hz', '200 Hz', '2,000 Hz'],
    correct: '500 Hz',
    explanation: 'Notch spacing is 1 ÷ delay time: 1 ÷ 0.002 s = 500 Hz. A shorter delay spreads the notches further apart; a longer one packs them closer.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      '2 Hz': 'That reads the 2 in 2 ms as hertz. Notch spacing is 1 divided by the delay in seconds, so convert milliseconds to seconds first.',
      '200 Hz': 'Check the conversion: 2 ms is 0.002 s, not 0.005 s. Divide 1 by the delay in seconds.',
      '2,000 Hz': 'That spacing is what the 0.5 ms CENTER DELAY gives. A longer delay packs the notches closer together.',
    },
  },
  {
    id: 'even-vs-uneven',
    prompt: 'How do a flanger’s notches differ from a phaser’s?',
    options: [
      'A flanger makes many evenly spaced notches; a phaser makes a few uneven ones',
      'A flanger makes fewer notches than a phaser, spread more widely across the range',
      'They are the same effect; a phaser is just a flanger at a slower RATE',
      'A flanger has no notches at all; it only bends the pitch up and down',
    ],
    correct: 'A flanger makes many evenly spaced notches; a phaser makes a few uneven ones',
    explanation: 'The flanger’s short delay produces an even comb. The phaser’s all-pass stages place a handful of notches wherever the phase lines up to cancel — sparse and uneven.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'A flanger makes fewer notches than a phaser, spread more widely across the range': 'It is the other way round: the flanger’s comb runs right up the spectrum, while a phaser’s STAGES give only a handful. Compare the two displays.',
      'They are the same effect; a phaser is just a flanger at a slower RATE': 'RATE only sets how fast the notches sweep. The two effects are built differently: a flanger delays, a phaser shifts phase.',
      'A flanger has no notches at all; it only bends the pitch up and down': 'Pitch wobble is chorus and vibrato territory. Look at OUT on the flanger display: the comb notches are right there.',
    },
  },
  {
    id: 'feedback',
    prompt: 'What happens as you push flanger FEEDBACK toward its maximum?',
    options: [
      'The peaks between the notches grow taller and narrower and ring, building toward a metallic scream',
      'The sweep gets faster, because feedback pushes the LFO to a higher rate',
      'The effect gets quieter and fades away as the delayed copy cancels itself out',
      'The notches spread evenly further apart, as if the center delay were shorter',
    ],
    correct: 'The peaks between the notches grow taller and narrower and ring, building toward a metallic scream',
    explanation: 'Feedback re-circulates the delayed copy, lifting tall, narrow peaks between the notches so the comb rings. Speed belongs to RATE, and spacing belongs to the delay time.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The sweep gets faster, because feedback pushes the LFO to a higher rate': 'Sweep speed belongs to RATE, from 0.1 Hz to 5 Hz WARBLE. FEEDBACK re-circulates the delayed copy; it never touches the LFO.',
      'The effect gets quieter and fades away as the delayed copy cancels itself out': 'Feeding the copy back in adds energy rather than removing it. Watch OUT as you step FEEDBACK up.',
      'The notches spread evenly further apart, as if the center delay were shorter': 'Spacing is set by the delay time, which is CENTER DELAY’s job. FEEDBACK leaves the notches where they are.',
    },
  },
  {
    id: 'sine-test',
    prompt: 'Why is a pure sine tone a poor source for hearing a flanger?',
    options: [
      'A sine has energy at only one frequency, so the moving notches have almost nothing to carve',
      'A sine is too loud for a flanger, so the notches clip instead of sweeping',
      'A flanger only works on drums and other short, percussive sounds',
      'A sine cancels the LFO, so the sweep stops moving altogether',
    ],
    correct: 'A sine has energy at only one frequency, so the moving notches have almost nothing to carve',
    explanation: 'The comb removes energy at many frequencies. Broadband sources such as pink or white noise have energy everywhere, so the sweep becomes audible and visible.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'A sine is too loud for a flanger, so the notches clip instead of sweeping': 'Level has nothing to do with it; a flanger works at any level. Think about how many frequencies a sine actually contains.',
      'A flanger only works on drums and other short, percussive sounds': 'Flangers are used on guitars, vocals, pads and whole mixes, not only drums. This lab’s own sources are PINK and WHITE noise.',
      'A sine cancels the LFO, so the sweep stops moving altogether': 'The LFO is inside the effect and runs whatever you feed it. The sweep still moves; ask whether there is anything for it to act on.',
    },
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
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      '8': 'That is one notch per stage. It takes a PAIR of all-pass stages to make one notch: set the sweep to STATIC, then count the dips at STAGES 8.',
      '16': 'Stages do not double the notches; there are fewer notches than stages. Set the sweep to STATIC, step STAGES to 8 and count the dips on OUT.',
      '2': 'That is what a much smaller STAGES setting gives. Set the sweep to STATIC, step STAGES up to 8 and count the dips on OUT.',
    },
  },
  {
    id: 'all-pass',
    prompt: 'What do a phaser’s all-pass stages change?',
    options: [
      'The phase of each frequency, without changing its level',
      'The time of arrival of the whole signal, like a short echo',
      'The level of the high frequencies only, like a sweeping filter',
      'The pitch of the whole signal, bending it slightly sharp',
    ],
    correct: 'The phase of each frequency, without changing its level',
    explanation: 'An all-pass stage passes every frequency at full level but shifts its phase. The notches only appear when that shifted copy is mixed back with the dry signal.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The time of arrival of the whole signal, like a short echo': 'Shifting the whole signal in time is how a flanger or a delay works. A phaser makes no echo and no evenly spaced comb.',
      'The level of the high frequencies only, like a sweeping filter': 'An all-pass stage is not a filter that cuts or boosts highs; its name tells you what it does to every frequency’s level.',
      'The pitch of the whole signal, bending it slightly sharp': 'A phaser never retunes the note; pitch wobble is chorus or vibrato. The note stays put while the notches sweep.',
    },
  },
  {
    id: 'not-a-delay',
    prompt: 'Is a phaser a kind of delay?',
    options: [
      'No — it shifts phase, so there is no echo and the notches are unevenly spaced',
      'Yes — it is a flanger with a longer delay and a slower sweep',
      'Yes — it is a very short slapback echo mixed under the dry signal',
      'No — it is a type of reverb with very few reflections',
    ],
    correct: 'No — it shifts phase, so there is no echo and the notches are unevenly spaced',
    explanation: 'A phaser shifts phase; a flanger shifts time. That different mechanism is why the phaser has a few uneven notches and the flanger an even comb.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Yes — it is a flanger with a longer delay and a slower sweep': 'A flanger is the effect built on a short delay. The phaser has no delay key at all: look at its STAGES and CENTER.',
      'Yes — it is a very short slapback echo mixed under the dry signal': 'A slapback is a distinct repeat you can hear as a second hit; a phaser never adds one.',
      'No — it is a type of reverb with very few reflections': 'Right that it is no delay, but reverb is a decaying cloud of reflections, and a phaser adds no tail at all.',
    },
  },
  {
    id: 'resonance',
    prompt: 'What does raising the phaser’s RESONANCE (feedback) do?',
    options: [
      'Sharpens the peaks between the notches, so the sweep rings',
      'Adds more notches, one for every step of feedback',
      'Moves the notches up to higher frequencies across the spectrum',
      'Speeds up the sweep, the way a faster RATE would',
    ],
    correct: 'Sharpens the peaks between the notches, so the sweep rings',
    explanation: 'Resonance feeds the output back in, lifting sharp peaks between the notches so the sweep stands out more. Too much whistles and rings. The number of notches comes from STAGES, the position from CENTER and the speed from RATE.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Adds more notches, one for every step of feedback': 'The number of notches comes from STAGES, not RESONANCE. Keep STAGES fixed and the dip count on OUT stays the same.',
      'Moves the notches up to higher frequencies across the spectrum': 'Where the notches sit is set by CENTER, from 400 Hz to 2 kHz. RESONANCE leaves their position alone.',
      'Speeds up the sweep, the way a faster RATE would': 'Sweep speed is RATE’s job. RESONANCE feeds the output back in; it does not touch the LFO.',
    },
  },
];

// ──────────────────────────────────────────────────────────── Distortion ──
const DISTORTION: readonly Q[] = [
  {
    id: 'what-is-added',
    prompt: 'Distortion makes a pure sine tone sound richer. What has been added?',
    options: [
      'New frequencies — harmonics created by bending the wave’s shape',
      'Only volume — the same sine, simply turned up louder',
      'A reverb tail that lingers after each note stops',
      'Lower octaves below the note, which fill out the bass',
    ],
    correct: 'New frequencies — harmonics created by bending the wave’s shape',
    explanation: 'Reshaping a wave creates harmonics — whole-number multiples of the input frequency that were not there before. Distortion creates frequencies; EQ cannot.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Only volume — the same sine, simply turned up louder': 'Turn DRIVE up and watch the wave on OUT change shape, not just size. A louder sine would still be a pure sine.',
      'A reverb tail that lingers after each note stops': 'Distortion works on each moment of the wave as it passes; it adds no echoes and no decay after the note.',
      'Lower octaves below the note, which fill out the bass': 'Shaping a wave cannot create anything below the note you feed it. Look where the new energy appears compared with the note itself.',
    },
  },
  {
    id: 'symmetric-odd',
    prompt: 'HARD (FLAT TOPS) flattens the top and bottom of the wave the same way (symmetric). Which harmonics does that produce?',
    options: ['Odd harmonics only', 'Even harmonics only', 'Odd and even harmonics equally', 'No harmonics — only extra level'],
    correct: 'Odd harmonics only',
    explanation: 'Symmetric clipping adds only odd harmonics (3rd, 5th, 7th…), heard as hollow or harsh. Clipping the top and bottom differently — the TUBE (LOPSIDED) type — adds even harmonics too.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Even harmonics only': 'Even harmonics need the top and bottom of the wave treated differently, as TUBE (LOPSIDED) does. HARD (FLAT TOPS) treats both halves the same.',
      'Odd and even harmonics equally': 'Adding even harmonics needs asymmetry, and HARD (FLAT TOPS) flattens both halves the same way. Compare it with TUBE (LOPSIDED) on the display.',
      'No harmonics — only extra level': 'Flattening the peaks changes the wave’s shape, and a new shape means new frequencies. Watch OUT at DRIVE +24 dB.',
    },
  },
  {
    id: 'oversampling',
    prompt: 'What can get into the sound when OVERSAMPLING is switched OFF?',
    options: [
      'Aliasing — harmonics above the Nyquist limit fold back as harsh, out-of-tune tones',
      'A cleaner, smoother distortion, because fewer samples need processing',
      'Only a drop in volume, because the signal is processed at a lower rate',
      'Nothing — oversampling only changes how smoothly the display is drawn',
    ],
    correct: 'Aliasing — harmonics above the Nyquist limit fold back as harsh, out-of-tune tones',
    explanation: 'Distortion creates harmonics that can reach past half the sample rate. Without oversampling they fold back to unrelated frequencies. Oversampling processes at a higher rate and filters out most of them first.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'A cleaner, smoother distortion, because fewer samples need processing': 'Processing fewer samples saves work but cannot make the sound cleaner. Compare ON (CLEAN) with OFF on the OVERSAMPLING key.',
      'Only a drop in volume, because the signal is processed at a lower rate': 'The sample rate does not set the level. What changes is which frequencies the processor can represent.',
      'Nothing — oversampling only changes how smoothly the display is drawn': 'The picture stays the same with OVERSAMPLING, but the sound changes, so this step needs your ears: play SINE 5 kHz at high DRIVE and compare ON with OFF.',
    },
  },
  {
    id: 'parallel',
    prompt: 'What is parallel distortion (MIX at 50% PARALLEL) for?',
    options: [
      'Blending a distorted copy with the clean signal, adding grit while the clean signal keeps its body',
      'Making the distortion react faster to the start of each note, like a compressor',
      'Removing aliasing by averaging the distorted copy with a second copy',
      'Doubling the number of harmonics by running the signal through twice',
    ],
    correct: 'Blending a distorted copy with the clean signal, adding grit while the clean signal keeps its body',
    explanation: 'Parallel works best when the distorted copy is turned down to sit under the clean one. On EXPLORE it is the other way round: the clean copy is the undriven −20 dBFS input, about 20 dB under the clipped one at DRIVE +24 dB, so 50% PARALLEL sounds about 5 dB quieter and nearly as gritty.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Making the distortion react faster to the start of each note, like a compressor': 'Distortion already reacts instantly to the wave; it has no attack time. MIX is about how much you hear, not how fast.',
      'Removing aliasing by averaging the distorted copy with a second copy': 'Aliasing is handled by the OVERSAMPLING key. A blend at MIX 50% PARALLEL keeps any aliasing the distorted copy has.',
      'Doubling the number of harmonics by running the signal through twice': 'Parallel does not run the signal through twice; the two paths sit side by side. More harmonics come from more DRIVE.',
    },
  },
];

// ───────────────────────────────────────────────────────────────── Phase ──
const PHASE: readonly Q[] = [
  {
    id: 'invert-silence',
    prompt: 'Two identical channels: you invert the polarity (Ø) of one and fold to mono. Why is the result silence?',
    options: [
      'The channels are equal and opposite, so added together they cancel completely',
      'Mono always lowers the level, and here it lowers it all the way to zero',
      'The polarity button mutes the right channel, so nothing is left to hear',
      'The correlation meter switches the output off when it reads −1',
    ],
    correct: 'The channels are equal and opposite, so added together they cancel completely',
    explanation: 'Inverting polarity multiplies every value by −1. Every positive meets an equal negative, so the sum is zero. Real-world cases (a miswired cable, a doubled mic) usually cancel only partly.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Mono always lowers the level, and here it lowers it all the way to zero': 'Two identical channels in step get louder in mono, not quieter. Silence needs something special about this pair: look at FLIP R.',
      'The polarity button mutes the right channel, so nothing is left to hear': 'FLIPPED Ø keeps the right channel playing: its trace is still on the display. A muted channel would leave the other one sounding.',
      'The correlation meter switches the output off when it reads −1': 'A meter only measures; it never changes the audio. The cause is in the two signals themselves.',
    },
  },
  {
    id: 'flip-wont-fix-delay',
    prompt: 'One channel is 2 ms late and the mono sum sounds thin and combed. Will pressing the polarity (Ø) button fix it?',
    options: [
      'No — a time offset shifts phase differently at each frequency; it needs time alignment',
      'Yes — a polarity flip always fixes cancellation, whatever caused it',
      'Yes — but only for the frequencies below about 1 kHz',
      'No — the only fix is to delete one channel and keep the other',
    ],
    correct: 'No — a time offset shifts phase differently at each frequency; it needs time alignment',
    explanation: 'A polarity flip is 180° at every frequency, so it fixes a simple inversion. A delay is a phase shift that changes with frequency — fix it by lining the two up in time.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Yes — a polarity flip always fixes cancellation, whatever caused it': 'A flip fixes one kind of problem: one channel upside down. Set DELAY R to 2 ms, try FLIPPED Ø, and watch whether the comb goes away.',
      'Yes — but only for the frequencies below about 1 kHz': 'Nothing special happens at 1 kHz. With DELAY R at 2 ms, FLIPPED Ø moves the comb notches rather than removing them.',
      'No — the only fix is to delete one channel and keep the other': 'Right that the flip won’t do it, but deleting a channel is a last resort that throws away half the recording. The cause can be undone instead.',
    },
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
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'By the same angle at every frequency': 'One angle everywhere is a polarity flip: 180° at every frequency. A delay is a fixed TIME, and a fixed time is a different share of each cycle.',
      'Only below 100 Hz': 'A delay acts on every frequency it carries; there is no cutoff at 100 Hz. Set DELAY R to 0.5 ms and look across the whole comb.',
      'Not at all — a delay only affects timing': 'Timing and phase are linked: shift a wave in time and its peaks line up with a different point in the other channel’s cycle.',
    },
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
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Left and right are opposite — they will cancel in mono': 'That is the bottom of the scale, −1. Set FLIP R to FLIPPED Ø and watch where the meter goes.',
      'The two channels are unrelated': 'Unrelated channels read near 0, the middle of the scale. Two identical channels are as related as two signals can be.',
      'The signal is clipping': 'Correlation compares left with right; it says nothing about level. Clipping shows on a level meter, not here.',
    },
  },
];

// ──────────────────────────────────────────────────────────── Oscillator ──
const OSCILLATOR: readonly Q[] = [
  {
    id: 'saw',
    prompt: 'Which classic waveform contains EVERY harmonic, each at 1/n of the fundamental?',
    options: ['Sawtooth', 'Square', 'Triangle', 'Sine'],
    correct: 'Sawtooth',
    explanation: 'The sawtooth has the full harmonic series falling at 1/n — the brightest, buzziest classic wave and the favorite raw material for filters. A sine has just one harmonic: the fundamental.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Square': 'Pick SQUARE and look at the bars: 2, 4 and 6 go empty. It holds odd harmonics only, so not every one.',
      'Triangle': 'TRIANGLE leaves the even bars empty too, and its odd ones fade far faster. Count the lit bars.',
      'Sine': 'A sine is one harmonic only: on SINE, just bar 1 is lit.',
    },
  },
  {
    id: 'triangle-vs-square',
    prompt: 'Square and triangle waves both contain only odd harmonics. Why does the triangle sound so much softer?',
    options: [
      'Its harmonics fall away much faster — 1/n² instead of 1/n',
      'It has fewer odd harmonics, so the upper ones are missing',
      'It is always played an octave lower than the square wave',
      'It contains even harmonics as well, which soften the tone',
    ],
    correct: 'Its harmonics fall away much faster — 1/n² instead of 1/n',
    explanation: 'Same odd-only series, different rolloff. The triangle’s upper harmonics are tiny, so it sounds smooth and flute-like; the square’s stay strong, so it sounds hollow and reedy.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'It has fewer odd harmonics, so the upper ones are missing': 'Pick TRIANGLE, then SQUARE: the same bars are lit on both. What differs is how tall those bars are, not how many.',
      'It is always played an octave lower than the square wave': 'Pitch is set by F0, not by WAVE. Switch between SQUARE and TRIANGLE and F0 stays where it is.',
      'It contains even harmonics as well, which soften the tone': 'Look at bars 2, 4 and 6 on TRIANGLE: they stay empty, just as on SQUARE.',
    },
  },
  {
    id: 'pulse-duty',
    prompt: 'What does changing a pulse wave’s duty cycle (for example to 25%) change?',
    options: [
      'Its timbre — some harmonics drop out — but not its pitch',
      'Its pitch, because the wave repeats at a new rate',
      'Only its volume, because the wave is high for less time',
      'Nothing you can hear, since the harmonics all stay in place',
    ],
    correct: 'Its timbre — some harmonics drop out — but not its pitch',
    explanation: 'The duty cycle cancels particular harmonics; a 25% pulse loses every 4th one. The fundamental, and so the pitch, stays where it is.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Its pitch, because the wave repeats at a new rate': 'A pulse repeats once per cycle whatever its duty. Pick PULSE 25% and watch F0: it does not move.',
      'Only its volume, because the wave is high for less time': 'Level may shift a little, but that is not all. Pick PULSE 25% and look at bars 4, 8 and 12.',
      'Nothing you can hear, since the harmonics all stay in place': 'Look at the bars on PULSE 25%: bars 4, 8 and 12 go empty. That changes the recipe, and you can hear it.',
    },
  },
  {
    id: 'band-limit',
    prompt: 'This lab leaves out any harmonic at or above the Nyquist frequency (half the sample rate). Why?',
    options: [
      'Those harmonics would fold back as aliasing — unrelated, out-of-tune tones',
      'They are too quiet to matter, so leaving them out saves processing',
      'They would push the pitch of the whole note up by an octave',
      'Phone speakers would play those very high harmonics far too loudly',
    ],
    correct: 'Those harmonics would fold back as aliasing — unrelated, out-of-tune tones',
    explanation: 'A digital system cannot represent anything above half its sample rate. Harmonics past that limit do not vanish; they reappear at wrong frequencies. Band-limited generation simply omits them.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'They are too quiet to matter, so leaving them out saves processing': 'On SAW the upper harmonics are small but real. Above half the sample rate they cannot stay put; they turn up somewhere else.',
      'They would push the pitch of the whole note up by an octave': 'Pitch is set by the fundamental, F0. Extra high harmonics cannot move it an octave; the problem is where they land.',
      'Phone speakers would play those very high harmonics far too loudly': 'This happens in the digital signal, before any speaker. A sample rate cannot hold frequencies above half its own value.',
    },
  },
];

// ───────────────────────────────────────────────────────────────── Noise ──
const NOISE: readonly Q[] = [
  {
    id: 'white-bright',
    prompt: 'White noise has equal energy per hertz. Why does it sound bright and hissy?',
    options: [
      'Each higher octave spans twice as many hertz, so it holds twice the energy',
      'It has extra energy deliberately added at the top of the spectrum',
      'It contains no low frequencies at all, only the upper ones',
      'It is always played louder than pink noise, so it seems brighter',
    ],
    correct: 'Each higher octave spans twice as many hertz, so it holds twice the energy',
    explanation: 'The octave from 10 to 20 kHz spans 10,000 Hz; the octave from 100 to 200 Hz spans only 100 Hz. Equal energy per hertz therefore piles up in the upper octaves, where the ear hears it as hiss.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'It has extra energy deliberately added at the top of the spectrum': 'Look at WHITE’s line on the display: it is flat, the same level per hertz all the way up. Nothing is added at the top.',
      'It contains no low frequencies at all, only the upper ones': 'WHITE’s flat line starts at 20 Hz: the lows are there, at the same level per hertz as the highs.',
      'It is always played louder than pink noise, so it seems brighter': 'Level does not decide brightness; the balance across the spectrum does. Compare how wide each octave is in hertz.',
    },
  },
  {
    id: 'pink-slope',
    prompt: 'Compared with white noise, pink noise falls at what rate?',
    options: ['−3 dB per octave', '−6 dB per octave', '0 dB per octave', '+3 dB per octave'],
    correct: '−3 dB per octave',
    explanation: 'Pink noise falls 3 dB per octave, which gives equal energy in every octave. Brown falls 6 dB per octave; blue rises 3; violet rises 6.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      '−6 dB per octave': 'That steeper fall is BROWN. Pick it in COLOR and read SLOPE.',
      '0 dB per octave': '0 dB per octave is the flat line of WHITE itself.',
      '+3 dB per octave': 'A rise toward the top is BLUE, the mirror image. This color tilts the other way.',
    },
  },
  {
    id: 'brown',
    prompt: 'Which color of noise falls 6 dB per octave and sounds like rumble, surf or distant thunder?',
    options: ['Brown', 'White', 'Blue', 'Violet'],
    correct: 'Brown',
    explanation: 'Brown (also called red) noise puts most of its energy in the lows. Blue and violet tilt the other way, toward the treble.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'White': 'WHITE is flat per hertz and sounds like bright hiss, not rumble.',
      'Blue': 'BLUE rises 3 dB per octave toward the top, so it sounds thin and hissy.',
      'Violet': 'VIOLET rises 6 dB per octave: nearly all its energy sits in the top octaves.',
    },
  },
  {
    id: 'pink-reference',
    prompt: 'Why is pink noise the standard test noise for rooms and loudspeakers?',
    options: [
      'Equal energy per octave matches how we hear, so it sounds balanced',
      'It is the loudest of the five colors, so it covers room noise',
      'It has no high frequencies, so it cannot damage the tweeters',
      'It is the only color a measurement microphone can pick up cleanly',
    ],
    correct: 'Equal energy per octave matches how we hear, so it sounds balanced',
    explanation: 'Hearing works on a roughly log scale, closer to octaves than to equal slices of hertz. Pink noise puts the same energy in each octave, so it sounds even from bottom to top. It also reads flat on an octave or 1/3-octave analyzer, the way rooms and speakers are measured.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'It is the loudest of the five colors, so it covers room noise': 'No color is louder by nature; each can be played at any level. The reason is how its energy is shared out.',
      'It has no high frequencies, so it cannot damage the tweeters': 'PINK’s line reaches 20 kHz: it has highs, just less per hertz than WHITE.',
      'It is the only color a measurement microphone can pick up cleanly': 'A microphone picks up every color. The reason is how evenly the energy spreads across octaves.',
    },
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
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      '103 Hz': 'Harmonics are multiples of the fundamental, not hertz added on. Read the left labels: 1: 100, 2: 200…',
      '150 Hz': '150 Hz is 1.5 × F0, which falls between harmonics. Count up the bands from 1: 100.',
      '33 Hz': 'Dividing goes below the fundamental. Harmonics sit above it, at whole-number multiples.',
    },
  },
  {
    id: 'amplitude',
    prompt: 'You turn the overall level of the tone up. What happens to the harmonic recipe?',
    options: [
      'Every partial gets louder by the same amount — no harmonics are added',
      'New harmonics appear at the top, so the tone gets brighter',
      'The fundamental moves up in pitch, and every harmonic with it',
      'The odd harmonics get louder than the even ones, so it turns square',
    ],
    correct: 'Every partial gets louder by the same amount — no harmonics are added',
    explanation: 'Level scales the whole recipe equally. Changing the balance between partials — or bending the wave with distortion — is what changes the harmonic content.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'New harmonics appear at the top, so the tone gets brighter': 'New harmonics come from reshaping the wave, as the clip PRESETs do. Level alone leaves the shape, and THD, as they were.',
      'The fundamental moves up in pitch, and every harmonic with it': 'Pitch is F0’s job. A change in level does not move where the bands sit.',
      'The odd harmonics get louder than the even ones, so it turns square': 'Level scales the whole wave at once, so it cannot favor one group. MUTE ODD or MUTE EVEN does that.',
    },
  },
  {
    id: 'phase-deafness',
    prompt: 'You change only the PHASES of the partials. The waveform’s shape changes a lot. How does the steady tone sound?',
    options: [
      'Nearly the same — the ear barely follows the phases of a steady tone’s partials',
      'An octave higher, because the partials now line up differently',
      'Completely different — a new waveform shape always means a new timbre',
      'Silent, because the shifted partials cancel each other out completely',
    ],
    correct: 'Nearly the same — the ear barely follows the phases of a steady tone’s partials',
    explanation: 'Same amplitudes, different phases: a very different picture on the waveform, but nearly the same sound. That is why the spectrum, not the scope shape, tells you the timbre.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'An octave higher, because the partials now line up differently': 'Phase moves where each harmonic starts in its cycle, not its frequency. The bands stay where they were.',
      'Completely different — a new waveform shape always means a new timbre': 'Check THD after flipping a phase: it stays the same, because the levels are unchanged. Trust the bands, not the wave’s outline.',
      'Silent, because the shifted partials cancel each other out completely': 'Each partial keeps its own frequency and level, so they cannot all cancel. The wave changes shape; the bands stay lit.',
    },
  },
  {
    id: 'build-square',
    prompt: 'You stack the 1st, 3rd, 5th, 7th… harmonics, each at 1/n of the fundamental’s level. Which waveform are you building?',
    options: ['Square', 'Sawtooth', 'Triangle', 'Sine'],
    correct: 'Square',
    explanation: 'Odd harmonics at 1/n add up to a square — and the more you add, the squarer it gets. All harmonics at 1/n would build a sawtooth; odd at 1/n² a triangle.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Sawtooth': 'A saw uses every harmonic, the even ones included. You left out 2, 4, 6…',
      'Triangle': 'A triangle is odd-only too, but its harmonics fall at 1/n², much faster than 1/n.',
      'Sine': 'A sine is the fundamental alone. You added many more.',
    },
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
    // Lab fix round 2026-11-14 (S2): why each wrong option is not right — never the answer.
    why: {
      'A time — how long the note lasts': 'Look at the envelope drawing: three of the four ADSR stages run along the time axis, and one is a height. Which one is the height?',
      'The fall from the peak': 'That fall from the peak is DECAY, the D in ADSR. Sustain comes after it.',
      'The fall back to silence after the energy stops': 'That is RELEASE, the R in ADSR: what happens once the energy stops.',
    },
  },
  {
    id: 'rise-time',
    prompt: 'Rise time is measured between which two points of the attack?',
    options: ['10% and 90% of peak', '0% and 100% of peak', '50% and 100% of peak', 'The peak and the sustain level'],
    correct: '10% and 90% of peak',
    explanation: 'Rise time skips the slow start and the final approach, so it is always shorter than the attack itself — about 32 ms for a straight-line 40 ms attack.',
    // Lab fix round 2026-11-14 (S2): why each wrong option is not right — never the answer.
    why: {
      '0% and 100% of peak': 'That full climb is the attack itself. Rise time is always a little shorter than the attack: which points would make it shorter?',
      '50% and 100% of peak': 'Rise time trims a little off BOTH ends of the climb, not the whole first half.',
      'The peak and the sustain level': 'From the peak down to the sustain level is the decay, not part of the attack.',
    },
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
    // Lab fix round 2026-11-14 (S2): why each wrong option is not right — never the answer.
    why: {
      'The gap between the loudest and quietest moments of a whole performance': 'That is dynamic range, measured across a whole performance. Crest factor is about one sound on its own.',
      'The length of the attack': 'Crest factor is a gap in level, measured in dB, not a time.',
      'The level at which a limiter starts working': 'That is a limiter’s threshold. Crest factor describes the sound itself, before any processor touches it.',
    },
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
    explanation: 'ADSR describes the sound at its source. What the room adds as the sound travels (propagation) is reverberation. The snare’s own envelope is the same at one meter or twenty.',
    // Lab fix round 2026-11-14 (S2): why each wrong option is not right — never the answer.
    why: {
      'Yes — a long release and a long reverb tail are the same thing': 'One happens at the source and one in the room. Would the snare’s own envelope change in a small room?',
      'Yes — the room lengthens the snare’s attack and release': 'The room adds reflections after the sound leaves the drum; it cannot change how the drum itself starts and stops.',
      'Only if the snare is miked closely': 'Miking changes how much of the room you hear, not the drum’s own envelope.',
    },
  },
];

// ──────────────────────────────────────────────────────────────── Stereo ──
const STEREO: readonly Q[] = [
  {
    id: 'width-is-side',
    prompt: 'What does a WIDTH control actually change?',
    options: [
      'The level of the SIDE (what differs between L and R) against the MID (what they share)',
      'The volume of the left channel only, leaving the right channel where it was',
      'The amount of reverb added around the mix to make it sound bigger',
      'The pan position of the whole mix, moving it between left and right',
    ],
    correct: 'The level of the SIDE (what differs between L and R) against the MID (what they share)',
    explanation: 'More side means wider — and less mono-safe. 0% width is pure mid (mono); 100% is the image as recorded; past 100% the side is turned up above its recorded level.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The volume of the left channel only, leaving the right channel where it was': 'WIDTH treats both channels together. Step it from 0% MONO to 200% OVER and watch both traces on the display change.',
      'The amount of reverb added around the mix to make it sound bigger': 'This lab adds no reverb. WIDTH works with what is already in the two channels: compare 0% MONO with 100%.',
      'The pan position of the whole mix, moving it between left and right': 'Moving the whole mix sideways is the PAN key’s job. WIDTH keeps the center where it is and changes how spread out the image is.',
    },
  },
  {
    id: 'mono-fold',
    prompt: 'A mix at 200% width sounds huge on headphones. What happens when you fold it to mono?',
    options: [
      'The side signal cancels, so the extra width disappears and the mix can sound hollow',
      'It gets twice as wide, because both channels now carry the side signal',
      'It gets louder, because left and right are added together into one',
      'Nothing — mono ignores width, so the mix sounds exactly as it did',
    ],
    correct: 'The side signal cancels, so the extra width disappears and the mix can sound hollow',
    explanation: 'Adding left and right cancels the side component and keeps only the mid. Phone speakers, many PAs and broadcast can play in mono, so the mono check matters.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'It gets twice as wide, because both channels now carry the side signal': 'Mono has only one channel, so it has no width at all. Turn MONO CHECK on and watch the image collapse to the center.',
      'It gets louder, because left and right are added together into one': 'Adding left and right only boosts what they share. At 200% OVER the extra is what differs between them; think about what happens to that.',
      'Nothing — mono ignores width, so the mix sounds exactly as it did': 'Width is exactly what mono changes. At WIDTH 200% OVER, turn MONO CHECK off and on and compare.',
    },
  },
  {
    id: 'bass-mono',
    prompt: 'Why make the bass mono below roughly 100–150 Hz?',
    options: [
      'Wide low frequencies can be phasey and unstable; mono lows stay solid on most systems',
      'Bass is louder in stereo, so making it mono keeps the low end from overloading',
      'Mono bass adds reverb to the low end, making the bass sound bigger and wider',
      'Stereo bass cannot be recorded, so the bass track arrives in mono anyway',
    ],
    correct: 'Wide low frequencies can be phasey and unstable; mono lows stay solid on most systems',
    explanation: 'A bass-mono control (this lab offers 120 Hz) collapses everything below its frequency to mono. Treat the frequency as a suggested starting point and listen.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Bass is louder in stereo, so making it mono keeps the low end from overloading': 'BASS-MONO is not a level control: it collapses the lows to the center. Think about what wide lows do on different playback systems.',
      'Mono bass adds reverb to the low end, making the bass sound bigger and wider': 'BASS-MONO adds nothing; it collapses everything below 120 Hz to the center. There is no reverb anywhere in this lab.',
      'Stereo bass cannot be recorded, so the bass track arrives in mono anyway': 'Stereo lows are easy to record and to create; that is why BASS-MONO exists. The question is how they play back.',
    },
  },
  {
    id: 'correlation-negative',
    prompt: 'The correlation meter sits near −1. What will a mono listener hear?',
    options: [
      'Heavy cancellation — the mix collapses toward silence',
      'The same mix, only wider, because the two sides are so different',
      'A louder mix, because the two opposite channels add their energy together',
      'Nothing different — mono ignores correlation, which only matters in stereo',
    ],
    correct: 'Heavy cancellation — the mix collapses toward silence',
    explanation: 'Near −1, whatever the left channel does, the right does the opposite. Summed to mono they subtract. The meter is the early warning.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The same mix, only wider, because the two sides are so different': 'Mono has one channel, so there is no width to gain. Near −1 the two sides are opposite; think about adding them.',
      'A louder mix, because the two opposite channels add their energy together': 'Opposite signals do not reinforce each other: each push in one channel meets a pull in the other.',
      'Nothing different — mono ignores correlation, which only matters in stereo': 'The correlation meter exists to warn about mono. Set WIDTH to 200% OVER, turn MONO CHECK on, and watch the meter.',
    },
  },
];

// ────────────────────────────────────────────────────────────── Binaural ──
const BINAURAL: readonly Q[] = [
  {
    id: 'itd',
    prompt: 'What is the interaural time difference (ITD)?',
    options: [
      'The far ear hears the sound slightly later than the near ear',
      'The far ear hears the sound louder, because it is facing the other way',
      'The sound reaches both ears at the same moment, wherever the source is',
      'The delay between a sound and its echo off the walls of the room',
    ],
    correct: 'The far ear hears the sound slightly later than the near ear',
    explanation: 'Sound has to travel around the head to reach the far ear — at most roughly 0.7 ms for a human-sized head. The brain uses that tiny delay to place the source.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The far ear hears the sound louder, because it is facing the other way': 'That mixes up the two cues and gets the level backwards: level differences are the ILD, and the far ear is the quieter one.',
      'The sound reaches both ears at the same moment, wherever the source is': 'That is only true straight ahead or straight behind. Set AZ to +45° and read the ITD readout.',
      'The delay between a sound and its echo off the walls of the room': 'Echoes come from the room. ITD is measured between your own two ears, and this model has no room at all.',
    },
  },
  {
    id: 'head-shadow',
    prompt: 'The head shadow makes the far ear hear the sound…',
    options: [
      'Quieter and darker — the head blocks high frequencies more than low ones',
      'Louder and brighter, because the head reflects sound toward that ear',
      'Higher in pitch, as the sound bends around the curve of the head',
      'Exactly the same as the near ear, because sound wraps fully around the head',
    ],
    correct: 'Quieter and darker — the head blocks high frequencies more than low ones',
    explanation: 'Low frequencies bend around the head easily; high frequencies are shadowed. That level-and-tone difference (ILD) is the second cue the lab synthesizes.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Louder and brighter, because the head reflects sound toward that ear': 'The far ear is on the other side of the head, in its shadow; the head blocks sound on its way there rather than adding to it.',
      'Higher in pitch, as the sound bends around the curve of the head': 'Going around the head changes level and tone, not pitch. The note is the same in both ears.',
      'Exactly the same as the near ear, because sound wraps fully around the head': 'If both ears heard exactly the same, there would be no level cue (ILD) at all for the brain to use.',
    },
  },
  {
    id: 'headphones',
    prompt: 'Why does this lab need headphones?',
    options: [
      'On loudspeakers each ear hears both channels, so the cues mix in the air and the effect collapses',
      'Loudspeakers cannot play the steady sine tone the lab uses as a source',
      'Headphones are louder, and the time cue needs a high playback level',
      'Loudspeakers reverse left and right, so every sound lands on the wrong side',
    ],
    correct: 'On loudspeakers each ear hears both channels, so the cues mix in the air and the effect collapses',
    explanation: 'Binaural cues are built for each ear separately. Speakers let both ears hear both channels (crosstalk), which scrambles the time and level differences.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Loudspeakers cannot play the steady sine tone the lab uses as a source': 'Any loudspeaker plays a sine tone. The trouble is where the sound goes after it leaves each speaker.',
      'Headphones are louder, and the time cue needs a high playback level': 'Level has nothing to do with it; the cues work at a quiet level too. What matters is which ear hears which channel.',
      'Loudspeakers reverse left and right, so every sound lands on the wrong side': 'Speakers keep left on the left. Think about what each of your ears hears from a pair of speakers in a room.',
    },
  },
  {
    id: 'no-elevation',
    prompt: 'This model can place sounds around you but not above or below. Why?',
    options: [
      'Up-and-down cues come from the outer ear’s filtering, which a time-and-level model does not produce',
      'Sound cannot come from above, because ears only hear in a flat circle around you',
      'Headphones only have two drivers, so no sound can be placed above or below',
      'Elevation only works with a steady sine tone, never with PINK or WHITE noise',
    ],
    correct: 'Up-and-down cues come from the outer ear’s filtering, which a time-and-level model does not produce',
    explanation: 'Time and level differences mostly tell left from right. Height — and much of front-from-back — comes from how the outer ear (pinna) colors sound, which this simplified model deliberately leaves out.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Sound cannot come from above, because ears only hear in a flat circle around you': 'You hear birds overhead and footsteps upstairs every day. Real ears can place height; this model leaves something out.',
      'Headphones only have two drivers, so no sound can be placed above or below': 'Two drivers can carry height in a real binaural recording. The limit is in the cues this model makes, not in the headphones.',
      'Elevation only works with a steady sine tone, never with PINK or WHITE noise': 'It is the reverse: broadband sounds such as PINK and WHITE carry the most direction detail. Height needs a cue this model does not make.',
    },
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
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      '12': '12 is how many semitones make an octave, not how many cents make one semitone.',
      '50': '50 cents is half a semitone, halfway between two grid lines.',
      '1,200': '1,200 cents make a whole octave: twelve grid lines.',
    },
  },
  {
    id: 'fast-retune',
    prompt: 'Why does SPEED at FAST — SNAP sound robotic?',
    options: [
      'Each note snaps instantly onto the grid, flattening natural glides and vibrato',
      'It adds distortion to the voice, which makes it sound like a machine',
      'It shifts every note up an octave, into a small electronic voice',
      'It slows the singer down, stretching each word out of time',
    ],
    correct: 'Each note snaps instantly onto the grid, flattening natural glides and vibrato',
    explanation: 'The natural movement between and within notes is what makes a voice sound human. Removing it instantly is the deliberate "hard-tune" effect.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'It adds distortion to the voice, which makes it sound like a machine': 'Correction moves pitch only; it adds no clipping. Watch the amber curve against the gray line on the CENTS GRID.',
      'It shifts every note up an octave, into a small electronic voice': 'The pull is toward the nearest grid line, a few cents away, never an octave.',
      'It slows the singer down, stretching each word out of time': 'SPEED is how fast the pitch is pulled, not the timing of the words. The notes keep their place in time.',
    },
  },
  {
    id: 'slow-short-notes',
    prompt: 'With SPEED at SLOW — GLIDE, short notes are often still a little out of tune. Why?',
    options: [
      'The note ends before the correction has time to arrive',
      'SLOW — GLIDE only works on low notes, not on higher ones',
      'AMOUNT drops to 0% by itself whenever a note is short',
      'Short notes have no pitch, so there is nothing to correct',
    ],
    correct: 'The note ends before the correction has time to arrive',
    explanation: 'Retune speed is how fast the pitch is pulled toward the target. A slow pull sounds natural on long notes but cannot catch up on quick ones.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'SLOW — GLIDE only works on low notes, not on higher ones': 'SPEED works the same at every pitch. What matters is how long the note lasts.',
      'AMOUNT drops to 0% by itself whenever a note is short': 'AMOUNT stays where you set it. The pull is still on; it just has not finished.',
      'Short notes have no pitch, so there is nothing to correct': 'A short sung note still has a pitch: the gray line shows it on the CENTS GRID.',
    },
  },
  {
    id: 'amount-math',
    prompt: 'A note is sung 40 cents flat and AMOUNT is 50%. Once the correction has settled, where does the note end up?',
    options: ['20 cents flat', 'Exactly in tune', '40 cents flat', '20 cents sharp'],
    correct: '20 cents flat',
    explanation: 'Correction amount sets how far toward the grid line the pitch is pulled. Half of a 40-cent error is removed, leaving 20 cents. 100% would land it on the line.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Exactly in tune': 'Only 100% lands on the grid line. At 50% the pull stops partway.',
      '40 cents flat': 'That would be AMOUNT at OFF. At 50% part of the error is removed.',
      '20 cents sharp': 'The pull moves the note toward the line, never past it, so it stays on the flat side.',
    },
  },
];

// ────────────────────────────────────────────────────────────── Cymatics ──
const CYMATICS: readonly Q[] = [
  {
    id: 'no-shape',
    prompt: 'What decides which figure appears on a plate at a given drive frequency?',
    options: [
      'The whole plate system — shape, size, thickness, material, supports, driver position and damping',
      'The frequency alone — every frequency always draws its own fixed shape, on any plate',
      'Only how loud the tone is — a louder drive always switches to a busier figure',
      'Only the kind of sand used — finer grains draw a different figure from coarse ones',
    ],
    correct: 'The whole plate system — shape, size, thickness, material, supports, driver position and damping',
    explanation: 'A frequency has no shape of its own. Change one thing about the plate and the same tone may stop being a resonance and the figure vanishes.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The frequency alone — every frequency always draws its own fixed shape, on any plate': 'A frequency has no shape of its own. Change the plate’s size, thickness or material in the studio and the same FREQ may draw nothing.',
      'Only how loud the tone is — a louder drive always switches to a busier figure': 'Raising LEVEL makes the plate move further, but loudness does not pick which figure appears.',
      'Only the kind of sand used — finer grains draw a different figure from coarse ones': 'The sand only marks where the plate stays still; it does not decide where that is.',
    },
  },
  {
    id: 'sand-nodes',
    prompt: 'Where does the sand collect on a vibrating plate?',
    options: [
      'On the nodal lines — the places that are not moving',
      'On the parts moving the most, where the plate shakes hardest',
      'Evenly over the whole plate, as a thin and even layer',
      'Only along the outer edges of the plate, whatever the frequency',
    ],
    correct: 'On the nodal lines — the places that are not moving',
    explanation: 'Sand is thrown off the moving regions and comes to rest where the plate stays still. Those still lines are the figure of one of the plate’s modes.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'On the parts moving the most, where the plate shakes hardest': 'The moving parts throw the sand off. Watch where the grains bounce away and where they come to rest.',
      'Evenly over the whole plate, as a thin and even layer': 'Sand stays even only on a plate that is not resonating. At a resonance some regions move and some stay still.',
      'Only along the outer edges of the plate, whatever the frequency': 'The figure changes with the frequency, and its lines run across the plate, not only around the rim.',
    },
  },
  {
    id: 'level-not-pattern',
    prompt: 'At a resonance, you raise LEVEL (the drive level). What changes?',
    options: [
      'How far the plate moves — not which pattern appears',
      'The pattern switches to a different mode',
      'The resonance frequency moves higher',
      'The number of nodal lines doubles on the plate',
    ],
    correct: 'How far the plate moves — not which pattern appears',
    explanation: 'Level sets the size of the motion. Which mode responds is set by the frequency and the plate.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The pattern switches to a different mode': 'Which mode answers is set by FREQ and the plate itself. LEVEL only scales the motion of the same figure.',
      'The resonance frequency moves higher': 'The resonance belongs to the plate’s size, thickness and material; turning LEVEL up does not move it.',
      'The number of nodal lines doubles on the plate': 'More level gives more motion, not more lines. New lines come from a higher mode, which needs a different FREQ.',
    },
  },
  {
    id: 'faraday-half',
    prompt: 'In the Liquid Studio, the standing waves on the surface oscillate at…',
    options: ['Half the drive frequency', 'Exactly the drive frequency', 'Twice the drive frequency', 'A random frequency'],
    correct: 'Half the drive frequency',
    explanation: 'Shaking a liquid up and down produces Faraday waves, which answer at half the drive frequency once the shake passes a threshold. The RESP readout shows that half frequency.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Exactly the drive frequency': 'That is how a plate answers. In the Liquid Studio, compare the DRIVE and RESP readouts: they do not show the same number.',
      'Twice the drive frequency': 'Read RESP against DRIVE in the Liquid Studio. Which way from the drive does the surface answer?',
      'A random frequency': 'Faraday waves lock to the shake once it passes a threshold; RESP shows a steady frequency tied to DRIVE, not a random one.',
    },
  },
  {
    id: 'damping',
    prompt: 'What does more DAMPING do to a plate’s resonance?',
    options: [
      'Broadens it and lowers its peak, with almost no change to its frequency',
      'Moves it to a clearly higher frequency, with an even sharper peak',
      'Moves it to a clearly lower frequency, with an even sharper peak',
      'Removes the nodal lines entirely, so no figure can ever form',
    ],
    correct: 'Broadens it and lowers its peak, with almost no change to its frequency',
    explanation: 'Lightly damped metals give sharp figures that need exact frequencies; heavily damped acrylic or wood gives blurrier figures across a wider band.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Moves it to a clearly higher frequency, with an even sharper peak': 'Damping takes energy out of the motion; it barely moves the frequency. Try DAMPING Low and High and watch where the peak sits.',
      'Moves it to a clearly lower frequency, with an even sharper peak': 'The peak hardly shifts in frequency when you change DAMPING. Watch its height and its width instead.',
      'Removes the nodal lines entirely, so no figure can ever form': 'Figures still form with DAMPING on High; they are blurrier and appear across a wider band of frequencies.',
    },
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
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      '2:1': '2:1 is the octave. Tap its RATIO chip and read INTERVAL.',
      '4:3': '4:3 is the perfect fourth. INTERVAL names each RATIO chip.',
      '5:4': '5:4 is the major third, the last RATIO chip.',
    },
  },
  {
    id: 'simple-ratio',
    prompt: 'With the ratio locked to a simple whole-number ratio such as 2:1, the figure…',
    options: [
      'Closes into a stable, repeating shape',
      'Turns into random scribbles',
      'Rotates faster and faster',
      'Fades away and disappears at once',
    ],
    correct: 'Closes into a stable, repeating shape',
    explanation: 'Simple ratios line up again and again, so the pen retraces the same path. The same simple ratios are the consonant musical intervals.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Turns into random scribbles': 'Simple ratios line up again and again. Try 2:1 with DETUNE on LOCKED RATIO and watch the pen retrace its path.',
      'Rotates faster and faster': 'Turning comes from a near-miss ratio, the +1% or +3% DETUNE. On LOCKED RATIO the figure holds still.',
      'Fades away and disappears at once': 'The figure fades only as DAMPING lets the swings die away; the ratio does not erase it.',
    },
  },
  {
    id: 'detune-beating',
    prompt: 'You detune one oscillator by +1% off a locked ratio. What does the figure do?',
    options: [
      'It slowly rotates (precesses) — that drift is beating made visible',
      'It instantly becomes a different interval, such as a fourth',
      'It stops moving, because the pendulums fall out of step',
      'It doubles in size, because OSC 2 now swings much wider',
    ],
    correct: 'It slowly rotates (precesses) — that drift is beating made visible',
    explanation: 'A near-miss ratio slides in and out of alignment. You see it as a slowly turning figure; played as two tones, the same drift is beating. On EXPLORE, ▶ lets you hear the detune in LATERAL only; in ROTARY the detune moves the platform, which makes no sound.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'It instantly becomes a different interval, such as a fourth': '+1% is far too small to reach the next RATIO chip: a fifth to a fourth is a much bigger step. Only the alignment drifts.',
      'It stops moving, because the pendulums fall out of step': 'The pen keeps drawing and PEN still reads DRAWING. Swings that are slightly out of step drift; they do not stop.',
      'It doubles in size, because OSC 2 now swings much wider': 'Each arm always swings the same size here; there is no amplitude key. DETUNE changes speed, not size.',
    },
  },
  {
    id: 'damping',
    prompt: 'What does DAMPING do to the drawing?',
    options: [
      'The swings shrink over time, so the figure spirals inward',
      'It changes the musical interval the figure is drawing',
      'It makes the figure rotate slowly, like a small detune',
      'It raises the pitch of both pendulums as they swing',
    ],
    correct: 'The swings shrink over time, so the figure spirals inward',
    explanation: 'Damping is the decay of each swing. Light damping draws many overlapping loops; heavy damping dies away quickly. The decay creates the classic spiral look.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'It changes the musical interval the figure is drawing': 'The interval is RATIO’s job; DAMPING leaves the speeds alone. Try LIGHT and HEAVY on 3:2 and read INTERVAL.',
      'It makes the figure rotate slowly, like a small detune': 'Rotation comes from DETUNE (+1%, +3%). DAMPING changes how long each swing lasts.',
      'It raises the pitch of both pendulums as they swing': 'Pitch follows the swing speed, set by OSC 1 and OSC 2. DAMPING only changes how fast the swings die away.',
    },
  },
];

// ────────────────────────────────────────────────────────────────── Bass ──
const BASS: readonly Q[] = [
  {
    id: 'twelfth-fret',
    prompt: 'Fretting at the 12th fret leaves half the string vibrating. What happens to the pitch?',
    options: [
      'It rises one octave — the frequency doubles',
      'It rises a perfect fifth, as at the 7th fret',
      'It drops one octave, since less string moves',
      'It stays the same pitch, but sounds louder',
    ],
    correct: 'It rises one octave — the frequency doubles',
    explanation: 'Halve the vibrating length and the frequency doubles. A doubled frequency is an octave — open E at 41.2 Hz becomes 82.4 Hz.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'It rises a perfect fifth, as at the 7th fret': 'A fifth leaves about 2/3 of the string. At fret 12, read LENGTH: half the string still vibrates.',
      'It drops one octave, since less string moves': 'A shorter string vibrates faster, so the pitch goes up, never down. Watch FREQ as you move FRET.',
      'It stays the same pitch, but sounds louder': 'Watch FREQ as FRET moves from OPEN to 12: the number changes, so the pitch does.',
    },
  },
  {
    id: 'seventh-fret',
    prompt: 'The 7th fret leaves about 2/3 of the string vibrating. Which interval is that above the open string?',
    options: ['A perfect fifth (3:2)', 'A perfect fourth (4:3)', 'An octave (2:1)', 'A major third (5:4)'],
    correct: 'A perfect fifth (3:2)',
    explanation: 'Two-thirds of the length gives 3/2 of the frequency — a perfect fifth. About 3/4 of the length (5th fret) gives a perfect fourth.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'A perfect fourth (4:3)': 'A perfect fourth needs about 3/4 of the string: that is the 5th fret.',
      'An octave (2:1)': 'An octave needs half the string, at the 12th fret.',
      'A major third (5:4)': 'A major third needs about 4/5 of the string, near the 4th fret.',
    },
  },
  {
    id: 'fret-spacing',
    prompt: 'Why do the frets get closer together toward the bridge?',
    options: [
      'Each fret raises the pitch by the same RATIO, and equal ratios need shrinking distances',
      'The string gets thinner toward the bridge, so each fret needs less of it',
      'Higher notes need less room for the fingers, so the frets crowd together',
      'It is a style choice by the builder, kept the same on most instruments',
    ],
    correct: 'Each fret raises the pitch by the same RATIO, and equal ratios need shrinking distances',
    explanation: 'Every fret multiplies the frequency by about 1.0595 (one equal-tempered semitone). Taking the same fraction off a string that keeps getting shorter means each step is shorter.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The string gets thinner toward the bridge, so each fret needs less of it': 'A string is the same thickness along its whole length. The spacing comes from the math of pitch: each FRET step is ×1.0595.',
      'Higher notes need less room for the fingers, so the frets crowd together': 'The spacing follows the pitch steps, not the hand. Each fret keeps about 94.4% of the length before it.',
      'It is a style choice by the builder, kept the same on most instruments': 'Move FRET up and watch LENGTH: each step keeps the same share, about 94.4%. Physics sets the spacing, not taste.',
    },
  },
  {
    id: 'node-harmonic',
    prompt: 'You lightly TOUCH (not press) the string at 1/3 of its length and pluck. What do you hear?',
    options: [
      'The 3rd harmonic — three times the open-string frequency, an octave plus a fifth above',
      'The same note as fretting at the 7th fret, a fifth above the open string',
      'The open string, unchanged, because a light touch does not stop it',
      'The note one octave below the open string, since a third of it is touched',
    ],
    correct: 'The 3rd harmonic — three times the open-string frequency, an octave plus a fifth above',
    explanation: 'Touching a node damps every mode that moves at that point, leaving harmonics 3, 6, 9… Fretting at the 7th fret only gives a fifth above; the harmonic is an octave higher than that.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The same note as fretting at the 7th fret, a fifth above the open string': 'Fretting shortens the string; a light touch keeps it whole and mutes some modes. Compare FREQ in NATURAL HARMONICS with FRETTED at fret 7.',
      'The open string, unchanged, because a light touch does not stop it': 'A light touch damps every mode that moves at that point, so the open note’s fundamental drops out. Try NODE ⅓.',
      'The note one octave below the open string, since a third of it is touched': 'No touch can make a string vibrate slower than it does open. Touching only removes modes, leaving higher ones.',
    },
  },
];

// ─────────────────────────────────────────────────────────────── Modular ──
const MODULAR: readonly Q[] = [
  {
    id: 'sine-filter',
    prompt: 'You sweep the filter CUTOFF on a SINE wave and the tone barely changes. Why?',
    options: [
      'A sine has no harmonics above its fundamental for the filter to remove',
      'The filter is broken, or its CUTOFF is not reaching the VCF',
      'Filters only work on noise, which has energy at every frequency',
      'The envelope is switched off, so the filter has nothing to follow',
    ],
    correct: 'A sine has no harmonics above its fundamental for the filter to remove',
    explanation: 'Subtractive synthesis starts bright and carves harmonics away. A sine has nothing to carve, so the filter can only change its level. A saw gives the filter the most to work with.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The filter is broken, or its CUTOFF is not reaching the VCF': 'Switch VCO to SAW and sweep CUTOFF again: the tone darkens at once. The filter works; a sine gives it little to remove.',
      'Filters only work on noise, which has energy at every frequency': 'A filter shapes any sound with energy above its cutoff. A SAW reacts strongly, so try it on VCO.',
      'The envelope is switched off, so the filter has nothing to follow': 'CUTOFF is a setting you move yourself; it works with ENV→VCF OFF. The source is the issue, not the envelope.',
    },
  },
  {
    id: 'lfo-destinations',
    prompt: 'The same LFO is moved from CUTOFF to PITCH. What effect do you get now?',
    options: ['Vibrato', 'Tremolo', 'A filter wobble', 'Reverb'],
    correct: 'Vibrato',
    explanation: 'One LFO, three classic effects: on pitch it is vibrato, on cutoff a wobble, on the amplifier tremolo. If an effect sounds wrong, check the routing first.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Tremolo': 'That is the LFO on the amplifier (→AMP): loudness pulses while pitch stays put.',
      'A filter wobble': 'That is what you had with the LFO on →CUTOFF. Moving it changes the effect.',
      'Reverb': 'Reverb is room reflections; an LFO only moves a setting up and down. THE PATCH has no reverb module.',
    },
  },
  {
    id: 'env-cutoff',
    prompt: 'Each note starts bright and darkens as it fades — the classic synth pluck. Which routing creates that?',
    options: ['Envelope → filter cutoff', 'LFO → amplifier', 'LFO → pitch', 'Sequencer → amplifier only'],
    correct: 'Envelope → filter cutoff',
    explanation: 'The envelope opens the filter at the start of each note and closes it as it decays. The envelope on the VCA shapes loudness; on the cutoff it shapes brightness.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'LFO → amplifier': 'An LFO repeats on its own clock: on the amplifier it pulses loudness (tremolo) instead of shaping each note.',
      'LFO → pitch': 'That wobbles the pitch (vibrato). The pluck is a change in brightness, which lives in the VCF.',
      'Sequencer → amplifier only': 'The sequencer picks the notes and retriggers them; on its own it darkens nothing. Look at the ACID BASS routing.',
    },
  },
  {
    id: 'signal-order',
    prompt: 'In the basic voice, what order does the audio travel in?',
    options: [
      'Oscillator (VCO) → filter (VCF) → amplifier (VCA) → output',
      'Filter (VCF) → oscillator (VCO) → amplifier (VCA) → output',
      'Amplifier (VCA) → filter (VCF) → oscillator (VCO) → output',
      'LFO → envelope (ENV) → sequencer (SEQ) → output',
    ],
    correct: 'Oscillator (VCO) → filter (VCF) → amplifier (VCA) → output',
    explanation: 'The VCO makes the tone, the VCF shapes its harmonics and the VCA shapes its loudness. The LFO, envelope and sequencer are control signals that steer those modules.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Filter (VCF) → oscillator (VCO) → amplifier (VCA) → output': 'A filter needs a sound to shape. Follow the amber cables on THE PATCH from the tone source.',
      'Amplifier (VCA) → filter (VCF) → oscillator (VCO) → output': 'The VCA sets the loudness of a sound that already exists. Follow the AUDIO PATH → OUT from its start.',
      'LFO → envelope (ENV) → sequencer (SEQ) → output': 'LFO, ENV and SEQ are the CONTROL SOURCES (CV): they steer modules and carry no audio of their own.',
    },
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
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      '150 Hz and 250 Hz': 'Those sit half a modulator away. Sidebands are spaced by the full modulator frequency, MOD = FC × RATIO.',
      '200 Hz and 400 Hz': '200 Hz is the carrier itself, the green stick. Sidebands sit on either side of it.',
      '50 Hz and 350 Hz': 'Those are 150 Hz from the carrier. Count one modulator step each way from the green stick.',
    },
  },
  {
    id: 'index',
    prompt: 'What does raising INDEX (the modulation index) mainly change?',
    options: [
      'How many sidebands are strong — the brightness',
      'The pitch of the note, which climbs as it rises',
      'The spacing between sidebands, which grows wider',
      'Only the overall volume, which rises with the index',
    ],
    correct: 'How many sidebands are strong — the brightness',
    explanation: 'The index sets how much energy spreads into sidebands. Spacing comes from the modulator frequency (the ratio), and the carrier and ratio together set the pitch.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The pitch of the note, which climbs as it rises': 'Pitch comes from FC and RATIO. Raise INDEX and watch the green carrier stick: it does not move.',
      'The spacing between sidebands, which grows wider': 'Spacing is set by RATIO, since MOD = FC × RATIO. INDEX leaves the sticks where they are.',
      'Only the overall volume, which rises with the index': 'Watch the SIDEBAND SPECTRUM as INDEX rises: the sticks change, not one overall level. FM spreads energy around rather than adding it.',
    },
  },
  {
    id: 'non-integer',
    prompt: 'You set the ratio to 1.41 ✳ (about √2). How does the tone change?',
    options: [
      'The sidebands land between harmonics — a bell-like, metallic tone with an unclear pitch',
      'It becomes a pure sine, because the sidebands cancel each other out',
      'It drops exactly one octave, with the sidebands spaced twice as close',
      'Nothing changes — only whole-number ratios have any effect on the tone',
    ],
    correct: 'The sidebands land between harmonics — a bell-like, metallic tone with an unclear pitch',
    explanation: 'Whole-number and other simple ratios put the sidebands on a harmonic series (pitched, brassy or organ-like). Odd ratios like 1.41 scatter them between harmonics — inharmonic, like a bell.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'It becomes a pure sine, because the sidebands cancel each other out': 'A pure sine needs INDEX at 0. With INDEX up, the sidebands are still there; RATIO only decides where they land.',
      'It drops exactly one octave, with the sidebands spaced twice as close': 'RATIO sets the sideband spacing, not an octave jump. Look where the amber sticks fall against a harmonic ladder.',
      'Nothing changes — only whole-number ratios have any effect on the tone': 'Switch RATIO from 2 to 1.41 ✳ and watch the amber sticks leave their even steps. You can hear that change.',
    },
  },
  {
    id: 'index-zero',
    prompt: 'With the modulation index at 0, what do you hear?',
    options: ['A pure sine — the carrier alone', 'Silence, because nothing is modulating', 'Noise, because the sidebands smear together', 'The modulator alone, at FC × RATIO'],
    correct: 'A pure sine — the carrier alone',
    explanation: 'At index 0 the modulator does nothing to the carrier, so there are no sidebands. Raise the index and sideband pairs appear.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Silence, because nothing is modulating': 'The carrier still sounds with INDEX at 0; only the sidebands go away. Watch the green stick stay up.',
      'Noise, because the sidebands smear together': 'Sidebands appear only as INDEX rises above 0, and FM sidebands are separate sticks, never noise.',
      'The modulator alone, at FC × RATIO': 'In FM you never hear the modulator directly; it only shapes the carrier. At INDEX 0 it shapes nothing.',
    },
  },
];

// ─────────────────────────────────────────────────────── Microphone Selection ──
const MIC_SELECT: readonly Q[] = [
  {
    id: 'categories',
    prompt: '"Condenser", "shotgun" and "lavalier" are often listed side by side. What do they actually describe?',
    options: [
      'Three different things — how it converts sound, how it is directional, and its physical form',
      'Three competing types — a microphone can only ever be one of the three',
      'Three price levels, from budget to top-of-the-range studio models',
      'Three polar patterns, like cardioid, figure-8 and omni under other names',
    ],
    correct: 'Three different things — how it converts sound, how it is directional, and its physical form',
    explanation: 'Condenser names the transducer inside, shotgun names a directivity design, lavalier names a form factor. One mic can be two of them, like a condenser shotgun or a condenser lav.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Three competing types — a microphone can only ever be one of the three': 'One mic can be two at once: a condenser shotgun, a condenser lav. Compare MEET THE MICROPHONE TYPES with FORM FACTOR MATTERS.',
      'Three price levels, from budget to top-of-the-range studio models': 'None of the three names says anything about cost. Each describes a different part of the microphone.',
      'Three polar patterns, like cardioid, figure-8 and omni under other names': 'Only one of the three is about direction. Polar patterns are cardioid, omni, figure-8 and so on (POLAR PATTERN SELECTION).',
    },
  },
  {
    id: 'lectern-rumble',
    prompt: 'A lectern mic keeps picking up stage rumble under the speech. Which frequency response helps most?',
    options: [
      'One with a low-frequency rolloff',
      'A perfectly flat response',
      'One with a strong bass boost',
      'One with a presence rise around 3–6 kHz',
    ],
    correct: 'One with a low-frequency rolloff',
    explanation: 'The rumble lives below the useful speech band, so rolling off the lows removes it without touching the voice. Flat is a choice, not automatically "best" — here it faithfully reproduces the rumble too.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'A perfectly flat response': 'A flat curve passes everything as it is, the rumble included. Flat is a choice, not a fix.',
      'One with a strong bass boost': 'The rumble lives in the lows, so a bass boost makes it louder, not quieter.',
      'One with a presence rise around 3–6 kHz': 'A presence rise lifts the band where speech is understood. Look at where the rumble sits on the axis: far below it.',
    },
  },
  {
    id: 'self-noise',
    prompt: 'A microphone’s self-noise matters MOST when recording…',
    options: [
      'Quiet sources, such as soft strings or room ambience',
      'A kick drum up close, inside the shell of the drum',
      'A loud guitar amplifier, miked right at the grille',
      'A shouted announcement in a noisy sports arena',
    ],
    correct: 'Quiet sources, such as soft strings or room ambience',
    explanation: 'On a quiet source the signal sits just above the mic’s own noise floor, so any hiss is exposed. On a loud source the noise is buried far below.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'A kick drum up close, inside the shell of the drum': 'A close kick is so loud that the mic’s own hiss sits far below it. Read SENSITIVITY, NOISE & SPL.',
      'A loud guitar amplifier, miked right at the grille': 'A loud amp buries the self-noise; here maximum SPL matters far more than hiss.',
      'A shouted announcement in a noisy sports arena': 'A shout is loud and the arena is noisy, so the mic’s own small hiss stays hidden.',
    },
  },
  {
    id: 'label-vs-spec',
    prompt: 'A microphone is sold as a "vocal mic". Can it be the right choice for a loud guitar cabinet?',
    options: [
      'Yes, if its specs suit the job',
      'No — a vocal mic only works on voices',
      'Only if it is a condenser, never if it is a dynamic',
      'Only if it is powered by 48 V phantom',
    ],
    correct: 'Yes, if its specs suit the job',
    explanation: 'Labels describe common use, not capability. The spec sheet decides: maximum SPL, pattern and response. The job sets the priorities, the priorities point to characteristics, and the characteristics choose the microphone.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'No — a vocal mic only works on voices': 'Plenty of mics sold for vocals sit on loud cabs every day. What on the spec sheet decides it?',
      'Only if it is a condenser, never if it is a dynamic': 'Many cabinet mics are dynamics. The transducer type alone does not decide the job; the specs do.',
      'Only if it is powered by 48 V phantom': 'Phantom power only feeds mics that need it; it says nothing about whether this mic suits a loud cabinet.',
    },
  },
];

// ──────────────────────────────────────────────────────────── Speech & Voice ──
const SPEECH: readonly Q[] = [
  {
    id: 'sibilance-source',
    prompt: 'Where does the hiss of an "S" come from?',
    options: [
      'Air forced through a narrow gap and broken up on the edge of the teeth',
      'The vocal folds vibrating very fast, giving the S a high pitch',
      'Air resonating in the nose, as it does for an M or an N',
      'The lips closing and bursting open, as they do on a P or a B',
    ],
    correct: 'Air forced through a narrow gap and broken up on the edge of the teeth',
    explanation: 'An S has no pitch — it is turbulence, with most of its energy roughly between 4 and 10 kHz. That is the sibilance a de-esser hunts.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The vocal folds vibrating very fast, giving the S a high pitch': 'An S has no pitch, so the vocal folds are not making it. Touch your throat on “sss” and then “zzz” (Voiced vs Unvoiced).',
      'Air resonating in the nose, as it does for an M or an N': 'M and N hum through the nose; an S comes out of the mouth as a hiss.',
      'The lips closing and bursting open, as they do on a P or a B': 'That burst is a plosive, the P and B family (Why Pop Filters Work). An S is a steady hiss, not a burst.',
    },
  },
  // Owner 2026-10-15: these three replace pop-filter / distance-halving /
  // formants, which repeated pages 8 and 11 almost word for word. They test
  // what the lab teaches (page 10's problem simulator) but never asked.
  {
    id: 'off-axis',
    prompt: 'A talker keeps turning to read notes beside a cardioid mic. The voice gets thinner, duller and quieter as they turn. What is happening?',
    options: [
      'They are speaking off-axis, so the mic’s pattern rolls off the highs and the level drops',
      'The proximity effect is fading as they turn away, so only the bass is lost',
      'The room’s reflections are canceling the voice at every frequency equally',
      'Their vocal folds tighten when the head turns, so the voice itself changes',
    ],
    correct: 'They are speaking off-axis, so the mic’s pattern rolls off the highs and the level drops',
    explanation: 'A directional mic hears best straight down its front. To the side its pickup falls and the highs fall first, so the voice dulls and drops. Aim the front of the capsule at the mouth, keep the head still, or use a wider pattern for a talker who moves.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The proximity effect is fading as they turn away, so only the bass is lost': 'Proximity effect is a bass boost up close. Losing it thins the lows, but it would not make the voice duller.',
      'The room’s reflections are canceling the voice at every frequency equally': 'Nothing about the room changes when the head turns. What changes is where the mouth points against the mic’s pattern.',
      'Their vocal folds tighten when the head turns, so the voice itself changes': 'Turning the head does not change the voice itself; a listener straight in front would still hear it full and bright.',
    },
  },
  {
    id: 'mouth-clicks',
    prompt: 'A close-miked voice-over has small dry ticks between words. What is the usual cause, and the first fix?',
    options: [
      'Saliva and a dry mouth; water before the take and a little more distance',
      'Electrical interference; replace the mic cable',
      'Plosives hitting the capsule; add a pop filter in front',
      'Clipping at the preamp; turn the gain down',
    ],
    correct: 'Saliva and a dry mouth; water before the take and a little more distance',
    explanation: 'Mouth clicks come from the tongue and lips parting through saliva, and a close mic hears every one. Water and a slightly larger distance reduce them at the source; editing or a de-clicker handles what is left. A pop filter stops air blasts, not clicks.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Electrical interference; replace the mic cable': 'Interference gives a hum or buzz, not ticks that fall between words in step with the mouth.',
      'Plosives hitting the capsule; add a pop filter in front': 'A pop filter stops the air blasts of P and B. These ticks come from inside the mouth, not from moving air.',
      'Clipping at the preamp; turn the gain down': 'Clipping happens on the loudest moments; these ticks are tiny and sit in the gaps between words.',
    },
  },
  {
    id: 'breath-noise',
    prompt: 'Loud gasps and whooshes land between phrases on a podcast. What helps most before any editing?',
    options: [
      'Breathe with the head turned slightly and set the mic to the side of the airflow',
      'Boost the bass so the breaths blend in with the warmth of the voice',
      'Move the mic much closer so the voice covers them',
      'Switch to a brighter microphone that makes the words stand out more',
    ],
    correct: 'Breathe with the head turned slightly and set the mic to the side of the airflow',
    explanation: 'Breath noise is fast air going straight into the capsule, often after long sentences. Turning the head to breathe and placing the mic out of the airflow (with a windscreen) stops it at the source; a gate or edit tidies the rest. Moving closer makes breaths louder, not quieter.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Boost the bass so the breaths blend in with the warmth of the voice': 'A bass boost adds weight to the whooshes too; it hides nothing and does not touch the cause.',
      'Move the mic much closer so the voice covers them': 'Closer puts the capsule even further into the airflow, so the breaths get louder, not quieter (The Distance Effect).',
      'Switch to a brighter microphone that makes the words stand out more': 'A brighter mic exaggerates the hiss of each breath; the cause is air going straight into the capsule.',
    },
  },
];

// ─────────────────────────────────────────────────────────── Vacuum Tube ──
const TUBE: readonly Q[] = [
  {
    id: 'warm-up',
    prompt: 'Why does tube gear need time to warm up?',
    options: [
      'The heater has to make the cathode hot enough to boil off electrons',
      'The glass must expand slowly before the vacuum inside it seals',
      'The plate has to cool down first, so it can collect electrons',
      'The control grid needs to charge up like a capacitor before use',
    ],
    correct: 'The heater has to make the cathode hot enough to boil off electrons',
    explanation: 'No heat, no electrons, no current. A hot cathode releases electrons (thermionic emission); the positive plate then pulls them across the vacuum.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The glass must expand slowly before the vacuum inside it seals': 'The glass is sealed once, at the factory. Watch the HEATER and the CATHODE in the WARM-UP view instead.',
      'The plate has to cool down first, so it can collect electrons': 'The plate never needs to cool; it collects electrons whenever there are any. Look at what the HEATER warms.',
      'The control grid needs to charge up like a capacitor before use': 'The grid steers electrons that are already flowing; with a cold cathode there are none to steer.',
    },
  },
  {
    id: 'grid',
    prompt: 'You make the control grid MORE negative. What happens to the electron stream to the plate?',
    options: [
      'It shrinks — the grid’s field pushes more electrons back toward the cathode',
      'It grows larger, because more negative charge pulls electrons along',
      'It reverses direction and flows from the plate back to the cathode',
      'Nothing — the grid only changes the color and brightness of the glow',
    ],
    correct: 'It shrinks — the grid’s field pushes more electrons back toward the cathode',
    explanation: 'The grid is a sparse wire spiral; its electric field, not the wire itself, does the gating. A small grid voltage controlling a large plate current is amplification.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'It grows larger, because more negative charge pulls electrons along': 'Electrons are negative, so a more negative grid repels them. Move GRID V on THE CONTROL GRID and watch FLOW.',
      'It reverses direction and flows from the plate back to the cathode': 'Only the hot cathode emits electrons; the plate cannot send any back. The stream can change size, not direction.',
      'Nothing — the grid only changes the color and brightness of the glow': 'The glow is the heater. The grid sits between the cathode and the plate, right in the electrons’ path.',
    },
  },
  {
    id: 'bias',
    prompt: 'What does "biasing" a tube set?',
    options: [
      'The idle point on its transfer curve, so the signal swings in the straight middle region',
      'The loudness of the output, like a master volume control on the amp',
      'The color of the glow, from orange at idle to bright blue when loud',
      'The warm-up time, so the cathode reaches its heat sooner or later',
    ],
    correct: 'The idle point on its transfer curve, so the signal swings in the straight middle region',
    explanation: 'Bias is where the tube rests with no signal. Too negative and the bottom of the wave is cut off; too positive and the top runs into saturation.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The loudness of the output, like a master volume control on the amp': 'Bias is where the tube rests with no signal at all. Volume is set elsewhere in the chain.',
      'The color of the glow, from orange at idle to bright blue when loud': 'The orange glow is the heater, and bias does not change it. Watch the curve on TUBE BIAS instead.',
      'The warm-up time, so the cathode reaches its heat sooner or later': 'Warm-up depends on the heater, not on bias. Bias decides where on the curve the signal swings.',
    },
  },
  {
    id: 'soft-clip',
    prompt: 'Driven past its straight region, how does a tube distort?',
    options: [
      'Its curve bends and ROUNDS the peaks (soft clipping)',
      'It chops the peaks off with sharp square corners',
      'It turns the signal off completely until the input drops again',
      'It shifts the pitch of the note upward by an octave',
    ],
    correct: 'Its curve bends and ROUNDS the peaks (soft clipping)',
    explanation: 'That gentle bend compresses the loudest moments and adds harmonics related to the note — most of what people mean by "tube sound".',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'It chops the peaks off with sharp square corners': 'Sharp, square corners are a hard clip. Compare the shapes on TUBE SATURATION and TUBE vs TRANSISTOR.',
      'It turns the signal off completely until the input drops again': 'Overdriving a tube reshapes the peaks; the signal keeps coming through. Watch the wave on TUBE SATURATION.',
      'It shifts the pitch of the note upward by an octave': 'Distortion adds harmonics related to the note, but the note’s own pitch stays the same.',
    },
  },
  {
    id: 'safety',
    prompt: 'Why can a switched-off tube amplifier still be dangerous inside?',
    options: [
      'Its filter capacitors can hold hundreds of volts long after power-down',
      'The tubes stay hot enough to set the cabinet and wiring alight',
      'The heater keeps running on its own from a small internal battery',
      'It is not dangerous once unplugged, because no current can flow in',
    ],
    correct: 'Its filter capacitors can hold hundreds of volts long after power-down',
    explanation: 'Tube circuits run at hundreds of volts, and the capacitors store that charge. Servicing is a job for qualified technicians.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The tubes stay hot enough to set the cabinet and wiring alight': 'Tubes do get hot enough to burn a finger, but the danger inside a switched-off amp is electrical, not fire.',
      'The heater keeps running on its own from a small internal battery': 'A tube amp has no battery; the heater stops when the power does. Look at WHY TUBES NEED HIGH VOLTAGE.',
      'It is not dangerous once unplugged, because no current can flow in': 'Unplugging stops new power coming in; it does not empty what the circuit already holds. Servicing is for qualified technicians.',
    },
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
      'The loudspeaker, which sends energy back into the amplifier',
      'The volume knob, which adds energy as it is turned up',
    ],
    correct: 'The power supply — the input signal only controls how it is delivered',
    explanation: 'A small control signal regulates a much larger flow of supply current to the load. The amplifier spends supply energy; it does not create it.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The input signal, multiplied inside the amplifier': 'The input is a tiny control signal: it steers the output but cannot supply its power. No amplifier creates energy.',
      'The loudspeaker, which sends energy back into the amplifier': 'The loudspeaker is the load: it uses energy and turns it into sound; it does not supply it.',
      'The volume knob, which adds energy as it is turned up': 'A knob only sets how much of the input reaches the next stage; it adds no energy. Look at SUPPLY and DC RAILS.',
    },
  },
  {
    id: 'clipping',
    prompt: 'When does an amplifier clip?',
    options: [
      'When the output it is asked for exceeds what the supply rails can deliver',
      'Whenever its volume control is turned past halfway, at any input level',
      'Whenever it drives an 8 Ω load, whatever level it is asked for',
      'Only when it is cold, before its parts have had time to warm up',
    ],
    correct: 'When the output it is asked for exceeds what the supply rails can deliver',
    explanation: 'The output can never swing past its rails. Ask for more and the peaks flatten — that flat top IS the rail.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Whenever it drives an 8 Ω load, whatever level it is asked for': '8 Ω is an ordinary load. Clipping depends on how big a swing is asked for, not on the load alone.',
      'Only when it is cold, before its parts have had time to warm up': 'Temperature is not the limit here. On The rails, watch what happens to the peaks as you raise the level.',
      'Whenever its volume control is turned past halfway, at any input level': 'A knob position says nothing about the output; a quiet input can sit at full volume cleanly. Watch the peaks on The rails.',
    },
  },
  {
    id: 'double-power',
    prompt: 'Going from a 100 W amplifier to a 200 W amplifier gains you about…',
    options: ['+3 dB', '+6 dB', '+10 dB', 'Twice the loudness'],
    correct: '+3 dB',
    explanation: '10 × log₁₀(200 ÷ 100) ≈ 3 dB — small but clearly audible, yet far from twice as loud, which takes roughly ten times the power.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      '+6 dB': '+6 dB needs four times the power, not twice. Work out 10 × log₁₀ of the power ratio.',
      '+10 dB': '+10 dB needs ten times the power. Doubling is a much smaller step.',
      'Twice the loudness': 'Sounding about twice as loud takes roughly ten times the power, not double.',
    },
  },
  {
    id: 'crossover',
    prompt: 'Where does crossover distortion appear in a push-pull output stage?',
    options: [
      'At the zero crossing, where one device hands the waveform over to the other',
      'At the very top of the waveform, where the peaks reach the rails',
      'Only at full volume, when both devices are working their hardest',
      'Only in the power supply, as ripple riding on the DC rails',
    ],
    correct: 'At the zero crossing, where one device hands the waveform over to the other',
    explanation: 'With too little bias there is a gap around zero that belongs to neither device. Class AB overlaps their conduction to close it, at the cost of some idle current and heat.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'At the very top of the waveform, where the peaks reach the rails': 'Flat tops at the rails are clipping, a different fault. Look at Push-pull and the gap TOO LITTLE BIAS leaves.',
      'Only at full volume, when both devices are working their hardest': 'Crossover distortion is worst at LOW levels, where the gap is a bigger share of the wave.',
      'Only in the power supply, as ripple riding on the DC rails': 'Ripple is a supply problem. Crossover distortion happens in the output devices themselves (Push-pull).',
    },
  },
  {
    id: 'upstream-clip',
    prompt: 'The sound is harsh and distorted, but the amplifier’s CLIP light stays dark. The mixer meters are pinned red. Where is the problem?',
    options: [
      'Upstream — the mixer is clipping, and the amplifier is faithfully reproducing it',
      'The amplifier is clipping and its light is faulty',
      'The loudspeaker load is too high for the amplifier to drive cleanly',
      'The speaker cable is too short, so the amplifier sees too little load',
    ],
    correct: 'Upstream — the mixer is clipping, and the amplifier is faithfully reproducing it',
    explanation: 'Turning the amplifier down only makes the distortion quieter. Fix the gain structure at the stage that is clipping.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'The amplifier is clipping and its light is faulty': 'Before blaming the light, read the other clue in the question: where else is a meter pinned red?',
      'The loudspeaker load is too high for the amplifier to drive cleanly': 'A higher load impedance draws less current, which is easier for an amplifier, and would not turn other meters red.',
      'The speaker cable is too short, so the amplifier sees too little load': 'A short cable loses less, not more, and cannot make an amplifier distort.',
    },
  },
];

// ─────────────────────────────────────────────────────────────── Equalizer ──
const EQ: readonly Q[] = [
  {
    id: 'q-width',
    prompt: 'You raise an EQ band’s Q from 0.7 to 8. What happens to the band?',
    options: [
      'It gets narrower — it affects a smaller range of frequencies',
      'It gets wider — it affects a larger range of frequencies',
      'It gets louder — a higher Q adds gain to the band',
      'It moves to a higher frequency but keeps its width',
    ],
    correct: 'It gets narrower — it affects a smaller range of frequencies',
    explanation: 'Q = center frequency ÷ bandwidth, so a bigger Q number means a narrower band. Wide Q suits broad, musical moves; narrow Q suits surgical notches. Gain changes the amount, not the width.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'It gets wider — it affects a larger range of frequencies': 'Look at the Q key’s own labels: 0.7 is marked WIDE and 8 is marked NARROW. Which way does raising Q go?',
      'It gets louder — a higher Q adds gain to the band': 'How far the band rises or falls is GAIN’s job. Q changes the shape of the band, not its height.',
      'It moves to a higher frequency but keeps its width': 'Where the band sits is FREQUENCY’s job. Q leaves the center where it is and changes something else.',
    },
  },
  {
    id: 'high-pass',
    prompt: 'Which filter shape removes rumble below a chosen frequency and leaves everything above it alone?',
    options: ['High-pass', 'Low-pass', 'High shelf', 'Peak (bell) boost'],
    correct: 'High-pass',
    explanation: 'A high-pass filter passes the highs and cuts the lows below its cutoff, more the further down you go, at its set slope. It is the standard rumble-and-mud eraser. A low-pass does the opposite.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Low-pass': 'A low-pass does the opposite: it keeps the lows and cuts above its frequency. Rumble lives in the lows.',
      'High shelf': 'A shelf lifts or lowers a whole region by a set amount, and a HIGH shelf works on the top end, not the rumble.',
      'Peak (bell) boost': 'A bell works on a band around one frequency, and a boost adds level. Rumble needs a cut that keeps falling below a point.',
    },
  },
  {
    id: 'graphic-vs-parametric',
    prompt: 'What is the difference between a graphic EQ band and a parametric EQ band?',
    options: [
      'A graphic band only moves its gain; a parametric band also sets its frequency and Q',
      'A graphic EQ can only cut and a parametric EQ can only boost, never the reverse',
      'They are the same thing — only the faceplate and the knob layout differ',
      'A parametric band has a fixed frequency and width; a graphic band can move both',
    ],
    correct: 'A graphic band only moves its gain; a parametric band also sets its frequency and Q',
    explanation: 'Graphic EQ gives fast, fixed-band control (one fader per octave or per third of an octave). Parametric EQ gives precision. Note that a graphic’s sliders are not its exact response — neighboring bands overlap.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'A graphic EQ can only cut and a parametric EQ can only boost, never the reverse': 'Both kinds can cut and boost: a graphic slider moves up or down from center, and a parametric band has its own GAIN.',
      'They are the same thing — only the faceplate and the knob layout differ': 'They are built differently. Count the keys this lab gives one band, then picture a graphic EQ: one slider per band.',
      'A parametric band has a fixed frequency and width; a graphic band can move both': 'That is the wrong way round: picture a graphic EQ’s row of sliders, each one parked at its own printed frequency.',
    },
  },
  {
    id: 'slope',
    prompt: 'A high-pass filter has a slope of 24 dB per octave. What does that mean?',
    options: [
      'Past the cutoff, each further octave down is about another 24 dB quieter',
      'It cuts exactly 24 dB at the cutoff frequency and no more below it',
      'It is 24 octaves wide, from the cutoff down to the lowest bass',
      'It boosts everything above the cutoff by 24 dB to make up for the cut',
    ],
    correct: 'Past the cutoff, each further octave down is about another 24 dB quieter',
    explanation: 'Slope is a RATE of attenuation beyond the transition region. Steeper slopes give a harder edge — and a larger phase shift near the corner.',
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'It cuts exactly 24 dB at the cutoff frequency and no more below it': 'The HIGH-PASS key says it cuts on a steady slope, not a set amount of cut. A slope keeps going below the cutoff.',
      'It is 24 octaves wide, from the cutoff down to the lowest bass': 'All of hearing spans only about 10 octaves. “Per octave” describes how fast the cut grows, not how wide anything is.',
      'It boosts everything above the cutoff by 24 dB to make up for the cut': 'A high-pass filter only cuts; it never adds level above the cutoff. “dB per octave” describes the cut below it.',
    },
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
    // Lab fix round 2026-11-14, phase 2 (S2): why each wrong option is not right — never the answer.
    why: {
      'Boosting is not possible on most equalizers': 'Every equalizer here can boost: GAIN goes up as well as down. The habit is about what a boost costs.',
      'Cuts change the pitch less than boosts': 'Neither a cut nor a boost changes pitch. EQ changes how loud some frequencies are, not which notes are played.',
      'Cutting always makes the sound louder': 'A cut lowers the level in its band, so it never makes the sound louder. Think about what a boost does to the peaks.',
    },
  },
];

// ─────────────────────────────────────────── Room Design & Monitoring ──
// Added 2026-11-19 [MD:D70] (owner: "Add the 3 + wire Room Design"): passing this check is
// the lab's certificate credit (tr_room_design). Every question tests what the lab itself shows:
// the mode captions, the image-source reflection drawing, the monitoring starting point, the
// sub boundary-gain readout and the CALCULATED / ESTIMATED / MEASURED labels.
const ROOM_DESIGN: readonly Q[] = [
  {
    id: 'axial-modes',
    prompt: 'Which room modes does the lab call the strongest, and the ones you hear first?',
    options: [
      'Axial modes, between one pair of parallel surfaces',
      'Tangential modes, between two pairs of surfaces',
      'Oblique modes, between all six surfaces',
      'The modes above 1 kHz',
    ],
    correct: 'Axial modes, between one pair of parallel surfaces',
    explanation: 'An axial mode bounces between one pair of parallel surfaces, such as the two side walls. It carries the most energy, so it is the one you hear first. A tangential mode has about half that energy, and an oblique mode less again.',
    why: {
      'Tangential modes, between two pairs of surfaces': 'The lab gives a tangential mode about half the energy of the strongest kind. Which kind bounces between just one pair of surfaces?',
      'Oblique modes, between all six surfaces': 'An oblique mode loses energy at every one of its many bounces, so it is the weakest kind, not the strongest.',
      'The modes above 1 kHz': 'Room modes matter in the low end. High up, so many modes overlap that no single one stands out.',
    },
  },
  {
    id: 'image-source',
    prompt: 'How does the lab find the point where a speaker’s first reflection hits a wall?',
    options: [
      'It mirrors the speaker in the wall and aims a line at your ear',
      'It picks the middle of the wall, halfway between the corners',
      'It uses the spot on the wall that is closest to the speaker',
      'It uses the spot on the wall that is closest to your ear',
    ],
    correct: 'It mirrors the speaker in the wall and aims a line at your ear',
    explanation: 'This is the image-source method. Mirror the speaker in the surface, draw a straight line from that image to your ear, and the point where the line crosses the surface is the reflection point. That is where an absorber does the most good.',
    why: {
      'It picks the middle of the wall, halfway between the corners': 'The reflection point moves when you move the speaker or the listener, so it cannot be a fixed spot like the middle of the wall.',
      'It uses the spot on the wall that is closest to the speaker': 'Sound reflects like light in a mirror: the angle in equals the angle out. So the point depends on where your ear is too.',
      'It uses the spot on the wall that is closest to your ear': 'The point depends on both the speaker and the ear. Think of where you would see the speaker if the wall were a mirror.',
    },
  },
  {
    id: 'stereo-triangle',
    prompt: 'What does the lab give as a good starting point (not a law) for a stereo monitoring setup?',
    options: [
      'The two speakers and your head form an equilateral triangle, a 60° listening angle',
      'Each speaker pushed into a corner, for the most bass',
      'Your listening position against the back wall',
      'One speaker closer to its side wall than the other, to spread the sound',
    ],
    correct: 'The two speakers and your head form an equilateral triangle, a 60° listening angle',
    explanation: 'The lab’s suggested starting point: speakers and head at the corners of an equilateral triangle, both speakers the same distance from their side walls and the front wall, and the listening position on the room’s center line. Then you move things and listen.',
    why: {
      'Each speaker pushed into a corner, for the most bass': 'A corner adds boundary gain from three surfaces at once, which piles up bass unevenly. The lab’s starting point is about balance, not the most bass.',
      'Your listening position against the back wall': 'Sitting against a wall puts you where the low-frequency pressure builds up. The lab draws the listener out in the room, on the center line.',
      'One speaker closer to its side wall than the other, to spread the sound': 'The lab checks symmetry: each speaker the same distance from its side wall, so left and right sound alike.',
    },
  },
  {
    id: 'sub-boundary',
    prompt: 'A subwoofer sits on the floor close to a wall. What does the lab estimate the nearby surfaces do to its low bass?',
    options: [
      'Add level, up to about 6 dB for each nearby surface',
      'Cut a deep notch in the low bass',
      'Nothing; a subwoofer is not affected by walls',
      'Raise only the high notes',
    ],
    correct: 'Add level, up to about 6 dB for each nearby surface',
    explanation: 'Close to a surface (within a quarter wavelength), the sound reflected by that surface arrives nearly in step with the sound from the speaker, so the low bass gets louder: up to about +6 dB for each nearby surface. The lab marks this ESTIMATED.',
    why: {
      'Cut a deep notch in the low bass': 'A notch comes from a reflection arriving out of step, which happens when the speaker is farther from the surface. Very close to it, the reflection adds instead.',
      'Nothing; a subwoofer is not affected by walls': 'Low bass is affected most of all: its long waves reach the surfaces around the sub and come back to add to it.',
      'Raise only the high notes': 'A subwoofer plays only the low notes. The boundary effect the lab shows is on those.',
    },
  },
  {
    id: 'model-not-verdict',
    prompt: 'The lab labels its numbers CALCULATED, ESTIMATED or MEASURED. What does that tell you about its review of your room?',
    options: [
      'A guide from a model; only measuring the real room is exact',
      'A final score for how good your room is overall',
      'A result that replaces listening in the room',
      'Every number in it was measured in your room',
    ],
    correct: 'A guide from a model; only measuring the real room is exact',
    explanation: 'Modes of a rectangle are CALCULATED for an idealized room, and reflections and levels are ESTIMATED. A real room has walls that flex, furniture and leaky doors. That is why the review gives observations and suggested next steps, never a verdict, and why you can type in a MEASURED value to compare.',
    why: {
      'A final score for how good your room is overall': 'The review gives observations, not a score. A model cannot know the wall that flexes or the cupboard full of clothes.',
      'A result that replaces listening in the room': 'The lab’s numbers tell you where to look and what to try. Listening and measuring in the real room still decide.',
      'Every number in it was measured in your room': 'Only a value you type in yourself is MEASURED. The rest are CALCULATED or ESTIMATED from the room you drew.',
    },
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
  roomdesign: ROOM_DESIGN,
};
