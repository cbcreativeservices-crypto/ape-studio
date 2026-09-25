/**
 * Sound Systems Lab — the end-of-lab understanding check.
 *
 * Registered under the LEARN mode's PagedLab id (`sound-systems-learn`), so
 * the check is appended as that mode's last page; passing it marks the lab's
 * UNDERSTANDING unit. Every question is answered BY VALUE, and each one
 * names a concept the chapters taught — never a number a learner would have
 * to memorise.
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
  },
  {
    id: 'speaker-into-line',
    prompt: 'A cable from a power amplifier’s output is connected to a powered loudspeaker’s line input. What happens?',
    options: ['The input is damaged — speaker level is far beyond what a line input tolerates', 'It works, a little loud', 'Nothing plays, but nothing is harmed', 'The amplifier goes quiet to protect it'],
    correct: 'The input is damaged — speaker level is far beyond what a line input tolerates',
    explanation: 'Speaker level is tens of volts. A line input expects a volt or two. This is the one connection the lab refuses outright.',
  },
  {
    id: 'aux-vs-subgroup',
    prompt: 'A singer wants more of their own voice in their wedge, and it must not change when the house vocal fader moves. Which tool?',
    options: ['A pre-fader aux send', 'A subgroup', 'A DCA', 'A matrix'],
    correct: 'A pre-fader aux send',
    explanation: 'A pre-fader send is an independent copy: its level is set on the send and the channel fader does not touch it.',
  },
  {
    id: 'dca-audio',
    prompt: 'What passes THROUGH a DCA?',
    options: ['Nothing — it remotely controls the level of its assigned channels', 'The summed audio of its channels', 'A copy of each channel', 'Only the post-fader sends'],
    correct: 'Nothing — it remotely controls the level of its assigned channels',
    explanation: 'No audio flows through a DCA, which is why you cannot insert a compressor on one, and why pre-fader sends ignore it.',
  },
  {
    id: 'matrix-use',
    prompt: 'The lobby loudspeakers need the house mix at a lower level plus a little of the announcement microphone. Which output?',
    options: ['A matrix fed from the main mix and an aux', 'A subgroup', 'The main mix, turned down', 'A mute group'],
    correct: 'A matrix fed from the main mix and an aux',
    explanation: 'A matrix mixes finished BUSES into a further output with its own level — the standard lobby, recording and broadcast feed.',
  },
  {
    id: 'aux-fed-subs',
    prompt: 'What does an AUX-FED subwoofer let you decide that a crossover-fed subwoofer does not?',
    options: ['Which channels reach the subwoofers, and at what level', 'The crossover frequency', 'The subwoofer’s polarity', 'How many subwoofers there are'],
    correct: 'Which channels reach the subwoofers, and at what level',
    explanation: 'With a crossover-fed sub, everything below the crossover goes to the subs. With an aux-fed sub, only the channels you send — kick, bass, keys — do.',
  },
  {
    id: 'parallel-load',
    prompt: 'Two 8 Ω loudspeakers are wired in PARALLEL on one amplifier channel. What load does the amplifier see?',
    options: ['4 Ω — less than either loudspeaker', '16 Ω — the two added together', '8 Ω — unchanged', '2 Ω'],
    correct: '4 Ω — less than either loudspeaker',
    explanation: 'Parallel loads combine as 1 ÷ (1/8 + 1/8) = 4 Ω. Every cabinet added in parallel LOWERS the load and demands more current — which is why an amplifier has a minimum.',
  },
  {
    id: 'underpowered',
    prompt: 'Why is an UNDERPOWERED amplifier not the safe choice for a loudspeaker?',
    options: ['Reaching level means driving it into clipping, which is what usually damages high-frequency drivers', 'A small amplifier cannot make sound at all', 'It uses more electricity', 'Its output is always at speaker level'],
    correct: 'Reaching level means driving it into clipping, which is what usually damages high-frequency drivers',
    explanation: 'A clipped amplifier delivers flattened, high-frequency-rich waveforms that heat tweeters. Clean headroom is the protection.',
  },
  {
    id: 'power-order',
    prompt: 'In what order is a system powered UP?',
    options: ['Sources and console first, amplifiers last', 'Amplifiers first, so they are ready', 'All at once, from one switch', 'Loudspeakers first, then the console'],
    correct: 'Sources and console first, amplifiers last',
    explanation: 'Every upstream turn-on transient happens before there is an amplifier to send it to the loudspeakers. Power-down is the mirror: amplifiers first.',
  },
  {
    id: 'gain-structure',
    prompt: 'The preamp is set low and the channel fader is pushed far above unity to compensate. What is the result?',
    options: ['Hiss — the fader amplifies the preamp’s noise floor along with the signal', 'A cleaner signal, because the preamp is not working hard', 'Distortion at the preamp', 'No difference'],
    correct: 'Hiss — the fader amplifies the preamp’s noise floor along with the signal',
    explanation: 'Gain placed late in the chain amplifies everything before it — the preamp’s floor and the channel’s own — and every stage after adds its gain to that hiss. The preamp should do the work; the faders sit near unity.',
  },
  {
    id: 'delay-time',
    prompt: 'A delay loudspeaker stands 30 m closer to the back rows than the mains. Roughly what delay does it need, and why?',
    options: ['About 87 ms, so its sound arrives together with the mains', 'None — closer is better', '30 ms, one per metre', 'It should be run early to lead the mains'],
    correct: 'About 87 ms, so its sound arrives together with the mains',
    explanation: 'Sound travels roughly 343 m/s at 20 °C, so 30 m is about 87 ms. Undelayed, the delay loudspeaker leads the mains and the ear hears two events.',
  },
  {
    id: 'polarity',
    prompt: 'Two mains play. Each alone sounds full; together, the low end vanishes in the centre. What is the most likely cause?',
    options: ['One loudspeaker is reversed in polarity', 'The crossover is too high', 'The amplifier is clipping', 'The delay is wrong'],
    correct: 'One loudspeaker is reversed in polarity',
    explanation: 'Opposite-polarity sources cancel where they arrive together — the centre — and most at low frequencies, where the wavelengths are long.',
  },
  {
    id: 'feedback-first',
    prompt: 'A wedge starts to ring as the singer’s monitor send comes up. What is the FIRST thing to change?',
    options: ['The geometry — aim the wedge into the microphone’s rejection angle and reduce the send', 'The graphic EQ — cut every band that rings', 'The amplifier — turn it up', 'The console clock'],
    correct: 'The geometry — aim the wedge into the microphone’s rejection angle and reduce the send',
    explanation: 'Feedback is a loop. Gain-before-feedback is spent first by placement, then by level; a narrow notch comes last, and heavy graphic EQ damages the sound.',
  },
  {
    id: 'source-forward',
    prompt: 'A channel is dead. Where does a professional START looking?',
    options: ['At the source, and forward station by station until the reading changes', 'At the loudspeaker, and backward', 'By replacing the amplifier', 'By recalling a different scene'],
    correct: 'At the source, and forward station by station until the reading changes',
    explanation: 'The first station whose reading is not healthy is the fault, or where it became visible. Walking forward finds it in the fewest steps; swapping boxes is guessing.',
  },
];
