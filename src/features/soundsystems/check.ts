/**
 * Sound Systems Lab — the end-of-lab understanding check.
 *
 * Registered under the LEARN mode's PagedLab id (`sound-systems-learn`), so
 * the check is appended as that mode's last page; passing it marks the lab's
 * UNDERSTANDING unit. Every question is answered BY VALUE, and each one
 * names a concept the chapters taught — never a number a learner would have
 * to memorise.
 *
 * Lab fix round 2026-11-14, phase 2 (F2), owner: "Begin fixing all bugs found
 * and do obvious (my decision is not required) fixes as you suggestted in the
 * report." Every wrong option has its own one-line `why` (shown on a first
 * miss; the explanation waits for a second miss — S2's check card), and the
 * right option is no longer the one long, detailed line.
 */
import type { UnderstandingQuestion } from '../lab/understanding';

export const SOUND_SYSTEMS_LEARN_ID = 'sound-systems-learn';

export const SOUND_SYSTEMS_CHECK: readonly UnderstandingQuestion[] = [
  {
    id: 'level-order',
    prompt: 'Which signal level is the SMALLEST, and therefore needs a preamp before anything can use it?',
    options: ['Mic level', 'Line level', 'Speaker level', 'Instrument level'],
    correct: 'Mic level',
    explanation: 'A microphone produces millivolts. The console preamp raises it to line level; only an amplifier produces speaker level.',
    why: {
      'Line level': 'Line level is what a preamp puts OUT: strong enough for a console or processor to use as it is.',
      'Speaker level': 'Speaker level is the biggest of them all, and only a power amplifier makes it.',
      'Instrument level': 'A pickup is small, but look again at the ladder of levels in the wiring chapter: one source is smaller still.',
    },
  },
  {
    id: 'speaker-into-line',
    prompt: 'A cable from a power amplifier’s output is connected to a powered loudspeaker’s line input. What happens?',
    options: ['The input can be damaged: the level is far too big', 'It works, only a little louder than usual', 'Nothing plays, but nothing is harmed', 'The amplifier goes quiet to protect itself'],
    correct: 'The input can be damaged: the level is far too big',
    explanation: 'Speaker level is tens of volts. A line input expects a volt or two. This is the one connection the lab refuses outright.',
    why: {
      'It works, only a little louder than usual': 'Compare the volts: speaker level is tens of volts, a line input expects one or two. That is not "a little".',
      'Nothing plays, but nothing is harmed': 'The signal does arrive, and it is many times bigger than the input was built to take.',
      'The amplifier goes quiet to protect itself': 'The amplifier cannot tell what it is plugged into; the trouble is at the other end of the cable.',
    },
  },
  {
    id: 'aux-vs-subgroup',
    prompt: 'A singer wants more of their own voice in their wedge, and it must not change when the house vocal fader moves. Which tool?',
    options: ['A pre-fader aux send', 'A subgroup for the vocals', 'A DCA on the vocal channel', 'A matrix fed from the main'],
    correct: 'A pre-fader aux send',
    explanation: 'A pre-fader send is an independent copy: its level is set on the send and the channel fader does not touch it.',
    why: {
      'A subgroup for the vocals': 'A subgroup sums channels on their way to the main mix, after their faders: it follows the house moves.',
      'A DCA on the vocal channel': 'A DCA carries no audio at all, so nothing from it can reach a wedge.',
      'A matrix fed from the main': 'A matrix is built from finished mixes, so it follows every house move instead of ignoring it.',
    },
  },
  {
    id: 'dca-audio',
    prompt: 'What passes THROUGH a DCA?',
    options: ['Nothing: it only moves its channels’ faders', 'The summed audio of its channels', 'A copy of each assigned channel', 'Only the post-fader sends'],
    correct: 'Nothing: it only moves its channels’ faders',
    explanation: 'No audio flows through a DCA, which is why you cannot insert a compressor on one, and why pre-fader sends ignore it.',
    why: {
      'The summed audio of its channels': 'Summed audio is what passes through a SUBGROUP. Think back to why a compressor cannot be inserted on a DCA.',
      'A copy of each assigned channel': 'A copy of a channel is what a SEND makes, at its own level.',
      'Only the post-fader sends': 'Post-fader sends leave each channel after its fader and go to their own aux; they never travel through a DCA.',
    },
  },
  {
    id: 'matrix-use',
    prompt: 'The lobby loudspeakers need the house mix at a lower level plus a little of the announcement microphone. Which output?',
    options: ['A matrix fed from the main mix and an aux', 'A subgroup with the vocals on it', 'The main mix, turned down', 'A mute group for the band'],
    correct: 'A matrix fed from the main mix and an aux',
    explanation: 'A matrix mixes finished BUSES into a further output with its own level — the standard lobby, recording and broadcast feed.',
    why: {
      'A subgroup with the vocals on it': 'A subgroup sums channels on their way INTO the main mix; it is not a separate output for another room.',
      'The main mix, turned down': 'Turning the main down turns the house down too, and adds no extra announcement mic.',
      'A mute group for the band': 'A mute group only switches channels off; it makes no output of its own.',
    },
  },
  {
    id: 'aux-fed-subs',
    prompt: 'What does an AUX-FED subwoofer let you decide that a crossover-fed subwoofer does not?',
    options: ['Which channels reach the subs, and how loud', 'The crossover frequency of the subs', 'The polarity of the subwoofers', 'How many subwoofers there are'],
    correct: 'Which channels reach the subs, and how loud',
    explanation: 'With a crossover-fed sub, everything below the crossover goes to the subs. With an aux-fed sub, only the channels you send — kick, bass, keys — do.',
    why: {
      'The crossover frequency of the subs': 'Both ways of feeding a sub still use a crossover in the processor; this is not the difference.',
      'The polarity of the subwoofers': 'Polarity is set at the processor or the cabinet, whichever way the sub is fed.',
      'How many subwoofers there are': 'The number of boxes is a placement choice; it does not depend on how they are fed.',
    },
  },
  {
    id: 'parallel-load',
    prompt: 'Two 8 Ω loudspeakers are wired in PARALLEL on one amplifier channel. What load does the amplifier see?',
    options: ['4 Ω — less than either loudspeaker', '16 Ω — the two added together', '8 Ω — the same as one of them', '2 Ω — a quarter of one of them'],
    correct: '4 Ω — less than either loudspeaker',
    explanation: 'Parallel loads combine as 1 ÷ (1/8 + 1/8) = 4 Ω. Every cabinet added in parallel LOWERS the load and demands more current — which is why an amplifier has a minimum.',
    why: {
      '16 Ω — the two added together': 'Adding the two is the rule for SERIES wiring, one cabinet after the other.',
      '8 Ω — the same as one of them': 'Two paths for the current instead of one: watch what the wire’s color did in the amplifier-load chapter.',
      '2 Ω — a quarter of one of them': 'That would take four 8 Ω cabinets in parallel, not two.',
    },
  },
  {
    id: 'underpowered',
    prompt: 'Why is an UNDERPOWERED amplifier not the safe choice for a loudspeaker?',
    options: ['To get loud it is driven into clipping, which can overheat tweeters', 'A small amplifier cannot make any sound at all on a big box', 'It draws more electricity from the wall than a larger one', 'Its output is always at speaker level, too strong for a box'],
    correct: 'To get loud it is driven into clipping, which can overheat tweeters',
    explanation: 'A clipped amplifier delivers flattened, high-frequency-rich waveforms that heat tweeters. Clean headroom is the protection.',
    why: {
      'A small amplifier cannot make any sound at all on a big box': 'A small amplifier plays; the question is what happens when it is pushed to reach the level the show needs.',
      'It draws more electricity from the wall than a larger one': 'Power drawn from the wall is not the risk here. Think about what a flattened waveform does to a driver.',
      'Its output is always at speaker level, too strong for a box': 'Every power amplifier puts out speaker level, large or small, so that cannot be the difference.',
    },
  },
  {
    id: 'power-order',
    prompt: 'In what order is a system powered UP?',
    options: ['Sources and console first, amplifiers last', 'Amplifiers first, so they are ready', 'All at once, from one switch', 'Loudspeakers first, then the console'],
    correct: 'Sources and console first, amplifiers last',
    explanation: 'Every upstream turn-on transient happens before any amplifier is on to send it to the loudspeakers. Power-down is the mirror: amplifiers first.',
    why: {
      'Amplifiers first, so they are ready': 'An amplifier that is already on passes every thump from the gear switched on after it. Ask who is listening when each thing wakes.',
      'All at once, from one switch': 'All at once, the console’s turn-on thump reaches amplifiers that are already awake.',
      'Loudspeakers first, then the console': 'Powered loudspeakers switched on first would play every thump the console makes as it wakes.',
    },
  },
  {
    id: 'gain-structure',
    prompt: 'The preamp is set low and the channel fader is pushed far above unity to compensate. What is the result?',
    options: ['Hiss: the fader raises the preamp’s noise with the signal', 'A cleaner signal, since the preamp is relaxed', 'Distortion, starting at the preamp', 'No difference at all in the sound'],
    correct: 'Hiss: the fader raises the preamp’s noise with the signal',
    explanation: 'Gain placed late in the chain amplifies everything before it — the preamp’s floor and the channel’s own — and every stage after adds its gain to that hiss. The preamp should do the work; the faders sit near unity.',
    why: {
      'A cleaner signal, since the preamp is relaxed': 'A preamp set low leaves the signal close to its own noise floor, and later gain cannot pull the two apart.',
      'Distortion, starting at the preamp': 'A preamp set LOW has plenty of headroom; distortion at the preamp is the opposite fault.',
      'No difference at all in the sound': 'Look at the grey haze on the meters in the gain-structure chapter as a later stage goes up.',
    },
  },
  {
    id: 'delay-time',
    prompt: 'A delay loudspeaker stands 30 m closer to the back rows than the mains. Roughly what delay does it need, and why?',
    options: ['About 87 ms to arrive with the mains, then often a few ms more', 'None: being closer, it should play at once, not later', '30 ms, one millisecond for each meter of distance', 'Run it early, so it leads the mains to the back rows'],
    correct: 'About 87 ms to arrive with the mains, then often a few ms more',
    explanation: 'Sound travels roughly 343 m/s at 20 °C, so 30 m is about 87 ms. Undelayed, the delay loudspeaker leads the mains and the ear hears two events. Many engineers then add a few milliseconds more so the mains arrive first and stay the perceived source (the precedence effect).',
    why: {
      'None: being closer, it should play at once, not later': 'Played at once, its sound reaches the back rows long before the mains do: two arrivals instead of one.',
      '30 ms, one millisecond for each meter of distance': 'Sound is slower than that: it takes close to 3 ms to travel one meter.',
      'Run it early, so it leads the mains to the back rows': 'Leading the mains pulls the sound away from the stage and splits it into two events.',
    },
  },
  {
    id: 'polarity',
    prompt: 'Two mains play. Each alone sounds full; together, the low end vanishes in the center. What is the most likely cause?',
    options: ['One loudspeaker is reversed in polarity', 'The crossover is set too high', 'The amplifier is clipping', 'The delay time is wrong'],
    correct: 'One loudspeaker is reversed in polarity',
    explanation: 'Opposite-polarity sources cancel where they arrive together — the center — and most at low frequencies, where the wavelengths are long.',
    why: {
      'The crossover is set too high': 'A crossover fault would change each box on its own too, and here each one alone sounds full.',
      'The amplifier is clipping': 'Clipping is distortion you hear from one box alone; this loss appears only when both play.',
      'The delay time is wrong': 'Both mains are the same distance from the center line. Ask what happens where two equal signals meet there.',
    },
  },
  {
    id: 'feedback-first',
    prompt: 'A wedge starts to ring as the singer’s monitor send comes up. What is the FIRST thing to change?',
    options: ['Where the wedge points, then the send level', 'The graphic EQ: cut every band that rings', 'The amplifier: turn it up past the ring', 'The console’s digital clock setting'],
    correct: 'Where the wedge points, then the send level',
    explanation: 'Feedback is a loop. Gain-before-feedback is spent first by placement, then by level; a narrow notch comes last, and heavy graphic EQ damages the sound.',
    why: {
      'The graphic EQ: cut every band that rings': 'EQ comes last and colors the sound; in the ring-out exercise a notch bought only 4 dB.',
      'The amplifier: turn it up past the ring': 'More level makes the loop ring sooner, never later.',
      'The console’s digital clock setting': 'A clock fault clicks on every channel at once; it does not ring.',
    },
  },
  {
    id: 'source-forward',
    prompt: 'A channel is dead. Where does a professional START looking?',
    options: ['At the source, then forward station by station', 'At the loudspeaker, then backward to the stage', 'By replacing the amplifier first', 'By recalling a different console scene'],
    correct: 'At the source, then forward station by station',
    explanation: 'The first station whose reading is not healthy is the fault, or where it became visible. Walking forward is steady and skips nothing; swapping boxes is guessing.',
    why: {
      'At the loudspeaker, then backward to the stage': 'One channel is dead while the rest play, so the far end is fine. Starting there is guessing.',
      'By replacing the amplifier first': 'The rest of the band still plays through that amplifier; swapping boxes is guessing.',
      'By recalling a different console scene': 'A new scene may hide the cause without finding it, and it changes everything else too.',
    },
  },
];

/** LEARN · Wiring: how many connections the learner has judged RIGHT.
 *  Only correct judgements count toward "Judge all six connections" — six
 *  wrong answers used to complete the page (bug hunt 2026-09-29). */
export function rightJudgements(answers: Readonly<Record<number, 'yes' | 'no'>>, truths: readonly ('yes' | 'no')[]): number {
  return truths.filter((t, i) => answers[i] === t).length;
}
