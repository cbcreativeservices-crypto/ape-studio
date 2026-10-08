/**
 * The chains of Lab 6 group 5 (F14–F16) as data for the chain rack
 * (engine/chain/chainModel.ts; Lab 6 group 4 built the rack). Pure;
 * validated by the tests (validateChain). Kept beside G-A's chains.ts so
 * the two groups merge cleanly.
 *
 *   SYSTEM_CHAIN   F14: the reference tap, the measurement mic, where it is
 *                  routed, the capture's processing (F14 L6, L26–L27)
 *   PRODUCT_CHAIN  F15: the airborne channel, the vibration channel, the
 *                  gain, and the claim (F15 L13–L22, L27–L28)
 *   ARRAY_CHAIN    F16: the elements, the clock, the geometry, the
 *                  processing (F16 L5–L6, L12–L13)
 *
 * Learner text: plain words, no brand, no standard number (D-6B-3); the
 * refusals that protect people or equipment are said exactly.
 */
import type { ChainSpec } from '../../../engine/chain/chainModel.ts';

export const SYSTEM_CHAIN: ChainSpec = {
  id: 'systemChain',
  slots: [
    {
      id: 'reference',
      label: 'Reference tap',
      short: 'REFERENCE',
      parts: [
        { id: 'pre', label: 'A copy of the console’s output, before the processor', short: 'PRE-DSP', blurb: 'The processor’s settings and its delay are inside the measured path.' },
        { id: 'post', label: 'A copy after the processor, at the amplifier’s input', short: 'POST-DSP', blurb: 'The processor is left out: the trace shows the amplifier, the loudspeaker and the room.' },
        { id: 'none', label: 'No reference — the mic alone', short: 'MIC ONLY', blurb: 'One channel: a level at the mic, not the response of a path.' },
      ],
    },
    {
      id: 'mic',
      label: 'Measurement mic',
      short: 'MIC',
      parts: [
        { id: 'meas', label: 'Measurement mic, its calibration file loaded, aimed as the file says', short: 'MEAS. MIC', blurb: 'A known response, pointed the way its correction data assumes.' },
        { id: 'vocal', label: 'A vocal mic borrowed from the stage', short: 'VOCAL', blurb: 'A directional mic with a response of its own.' },
      ],
    },
    {
      id: 'route',
      label: 'Where the mic goes',
      short: 'ROUTE',
      parts: [
        { id: 'analyzer', label: 'The analyzer’s measurement input only', short: 'ANALYZER', blurb: 'The mic feeds the measurement and nothing else.' },
        { id: 'console', label: 'A console channel that also feeds the PA', short: 'TO THE PA', blurb: 'The mic’s signal goes back out through the loudspeakers.' },
      ],
    },
    {
      id: 'processing',
      label: 'Capture processing',
      short: 'CAPTURE',
      parts: [
        { id: 'fixed', label: 'Fixed gain; auto-gain, dynamic EQ and limiting off', short: 'FIXED', blurb: 'Nothing changes the level behind your back while you measure.' },
        { id: 'auto', label: 'Auto-gain and limiting left on', short: 'AUTO ON', blurb: 'The capture changes its own gain as the level changes.' },
      ],
    },
  ],
  rules: [
    { id: 'pa', all: [['route', 'console']], reason: 'The measurement mic never returns to the live PA: route it to the analyzer input only.', safety: true },
  ],
  briefs: [
    {
      id: 'whole',
      title: 'The whole path',
      question: 'What does the audience get — the processor, the amplifier, the loudspeaker and the room, all in the measured path?',
      ok: { reference: ['pre'], mic: ['meas'], processing: ['fixed'] },
      why: {
        post: 'A tap after the processor leaves the processor out of the measured path — this question includes it.',
        none: 'Without a reference copy there is no transfer function: you get a level at the mic, not the path’s response.',
        vocal: 'A borrowed vocal mic puts its own response into every trace: use the measurement mic and its file.',
        auto: 'Time-varying processing on the capture changes the trace while you measure: fix the gain and switch it off.',
      },
      label: 'SYSTEM + ROOM, PROCESSOR INCLUDED · NAME THE TAP',
    },
    {
      id: 'speaker',
      title: 'What the processor works with',
      question: 'The loudspeaker and the room with the processor’s own settings left out — what the processing has to work with.',
      ok: { reference: ['post'], mic: ['meas'], processing: ['fixed'] },
      why: {
        pre: 'A tap before the processor puts its settings into the trace — this question leaves them out.',
        none: 'Without a reference copy there is no transfer function: you get a level at the mic, not the path’s response.',
        vocal: 'A borrowed vocal mic puts its own response into every trace: use the measurement mic and its file.',
        auto: 'Time-varying processing on the capture changes the trace while you measure: fix the gain and switch it off.',
      },
      label: 'LOUDSPEAKER + ROOM, PROCESSOR LEFT OUT · NAME THE TAP',
    },
  ],
};

export const PRODUCT_CHAIN: ChainSpec = {
  id: 'productChain',
  slots: [
    {
      id: 'air',
      label: 'Airborne channel',
      short: 'AIR',
      parts: [
        { id: 'meas', label: 'Measurement mic at the logged position', short: 'MEAS. MIC', blurb: 'Pressure at its own position: height, distance and aim written down.' },
        { id: 'dir', label: 'A directional mic chosen for a pleasing sound', short: 'DIRECTIONAL', blurb: 'Its pattern and its own response shape what it hears.' },
        { id: 'none', label: 'No airborne mic', short: 'NONE', blurb: 'Nothing hears the air.' },
      ],
    },
    {
      id: 'vib',
      label: 'Vibration channel',
      short: 'VIBRATION',
      parts: [
        { id: 'contact', label: 'A contact sensor a qualified person fixed on while the fan was off and unplugged', short: 'CONTACT', blurb: 'Vibration of the housing, in its own units, on its own channel.' },
        { id: 'none', label: 'No vibration channel', short: 'NONE', blurb: 'The airborne channel only.' },
        { id: 'hand', label: 'A sensor held on by hand while the fan runs', short: 'BY HAND', blurb: 'Your hand at the device while it runs.' },
      ],
    },
    {
      id: 'gain',
      label: 'Gain',
      short: 'GAIN',
      parts: [
        { id: 'fixed', label: 'Fixed, with headroom for the start and the stop', short: 'FIXED', blurb: 'The same gain every run; the loudest moment does not clip.' },
        { id: 'auto', label: 'Auto-gain on', short: 'AUTO', blurb: 'The recorder rides its own gain.' },
      ],
    },
    {
      id: 'claim',
      label: 'What you claim',
      short: 'CLAIM',
      parts: [
        { id: 'relative', label: 'A relative comparison at that position', short: 'RELATIVE', blurb: 'Before against after, same position, same cycle.' },
        { id: 'clues', label: 'Timing clues between two channels — not a proven path', short: 'CLUES', blurb: 'Events that line up in both channels, said as clues.' },
        { id: 'spl', label: 'A level in dB SPL read off the recorder', short: 'dB SPL', blurb: 'The recorder’s own digital scale, reported as a pressure level.' },
        { id: 'power', label: 'The fan’s sound power', short: 'POWER', blurb: 'A property of the device, from a few positions round it.' },
      ],
    },
  ],
  rules: [
    { id: 'hand', all: [['vib', 'hand']], reason: 'Never attach, reposition or retrieve a sensor by hand on a running device. A qualified person fixes it on while the device is off and isolated.', safety: true },
    { id: 'spl', all: [['claim', 'spl']], reason: 'A recorder’s dBFS is not a sound-pressure level: without a calibrated chain the honest label is relative.' },
    { id: 'power', all: [['claim', 'power']], reason: 'Sound power comes from a named method over a defined surface in a qualifying room — not from a few positions round a fan.' },
  ],
  briefs: [
    {
      id: 'compare',
      title: 'A before-and-after',
      question: 'Did the new blade change the sound at position A? The same fan, the same cycle, before and after.',
      ok: { air: ['meas', 'dir'], gain: ['fixed'], claim: ['relative'] },
      why: {
        none: 'With no airborne mic there is nothing at position A to compare.',
        auto: 'Auto-gain moves the level between runs and hides the change you came to compare.',
        clues: 'One airborne position before and after is a comparison, not a two-channel timing study.',
        spl: 'A recorder’s dBFS is not a sound-pressure level.',
        power: 'Sound power needs a named method, a defined surface and a qualifying room.',
      },
      label: 'RELATIVE · SAME POSITION, SAME CYCLE, FIXED GAIN',
    },
    {
      id: 'rattle',
      title: 'Where the rattle starts',
      question: 'A rattle comes and goes. Record the air and the housing side by side, and look for what lines up.',
      ok: { air: ['meas'], vib: ['contact'], gain: ['fixed'], claim: ['clues'] },
      why: {
        dir: 'For two channels compared in time, use the measurement mic at a logged position.',
        none: 'The question needs both channels: the air and the housing.',
        auto: 'Auto-gain changes each channel on its own: the two can no longer be compared.',
        relative: 'Two channels in different units are compared by timing, as clues — not as one relative level.',
        hand: 'Never by hand on a running device: a qualified person fixes the sensor on while it is off and isolated.',
        spl: 'A recorder’s dBFS is not a sound-pressure level.',
        power: 'Sound power needs a named method, a defined surface and a qualifying room.',
      },
      label: 'TWO CHANNELS, TWO UNITS · CLUES, NOT A PROVEN PATH',
    },
  ],
};

export const ARRAY_CHAIN: ChainSpec = {
  id: 'arrayChain',
  slots: [
    {
      id: 'elements',
      label: 'Elements',
      short: 'ELEMENTS',
      parts: [
        { id: 'matched', label: 'Two omni measurement mics, checked as a pair', short: 'MATCHED', blurb: 'Their sensitivity and phase checked against each other.' },
        { id: 'mixed', label: 'One omni and one directional mic', short: 'MIXED', blurb: 'Two different responses, two different phase behaviours.' },
      ],
    },
    {
      id: 'clock',
      label: 'Clock',
      short: 'CLOCK',
      parts: [
        { id: 'one', label: 'One recorder: both channels on one clock', short: 'ONE CLOCK', blurb: 'Both tracks sampled together, sample for sample.' },
        { id: 'two', label: 'Two recorders started by hand', short: 'TWO CLOCKS', blurb: 'Each on its own clock, started a moment apart.' },
      ],
    },
    {
      id: 'geometry',
      label: 'Geometry',
      short: 'GEOMETRY',
      parts: [
        { id: 'logged', label: 'Baseline, origin and axes measured and written down', short: 'LOGGED', blurb: 'Every element’s position tied to the marked origin.' },
        { id: 'eyeball', label: 'Placed by eye, nothing written down', short: 'BY EYE', blurb: 'Roughly where they looked right.' },
      ],
    },
    {
      id: 'processing',
      label: 'Processing',
      short: 'PROCESSING',
      parts: [
        { id: 'raw', label: 'Raw channels kept, nothing aligned or normalized', short: 'RAW', blurb: 'What the capsules got, as they got it.' },
        { id: 'aligned', label: 'Tracks auto-aligned by the software first', short: 'ALIGNED', blurb: 'The software slides one track to line up with the other.' },
      ],
    },
  ],
  rules: [],
  briefs: [
    {
      id: 'order',
      title: 'Which heard it first',
      question: 'A click at the centre point, then at the side point: which capsule heard each one first?',
      ok: { elements: ['matched'], clock: ['one'], geometry: ['logged'], processing: ['raw'] },
      why: {
        mixed: 'Unmatched elements add phase differences of their own: check and match the pair first.',
        two: 'Two recorders drift and start apart: the time between their tracks is not the sound’s.',
        eyeball: 'Without the baseline and origin written down, an arrival order cannot be tied to a side.',
        aligned: 'Auto-alignment removes the very time difference you came to see.',
      },
      label: 'ARRIVAL ORDER ON ONE CLOCK · NOT YET A DIRECTION',
    },
    {
      id: 'level',
      title: 'Which hears it louder',
      question: 'The side source: is it louder at the nearer capsule? A level at each, compared.',
      ok: { elements: ['matched'], geometry: ['logged'] },
      why: {
        mixed: 'Unmatched capsules differ in level by their own sensitivity: match and check the pair first.',
        eyeball: 'Without the positions written down, a level difference cannot be tied to a distance.',
      },
      label: 'A LEVEL DIFFERENCE · MATCHED, CHECKED CAPSULES',
    },
  ],
};
