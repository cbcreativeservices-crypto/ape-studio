/**
 * Amplifier Lab · per-option wrong reasons for the module checks (lab fix
 * round 1, phase 2, 2026-11-14; owner approval "Begin fixing all bugs found
 * and do obvious ... fixes as you suggested in the report", then the check
 * card, suggested order item 5).
 *
 * Keyed by AMP_CHECKS id, then by the WRONG option's authored index. The
 * CheckCard (screens/lab/amp/kit.tsx) shows, on a first miss, that option's
 * reason (never the answer); the full explanation comes after a second miss.
 * Rules (S2): one line, at most 30 words, the student's voice, says why THAT
 * option is not it or points at what the lab showed, never names the answer.
 */
export const AMP_CHECK_WHY: Readonly<Record<string, Readonly<Record<number, string>>>> = {
  'w-energy': {
    0: 'The input is tiny. Look at where the big output current flows from in the module’s picture: it never passes through the input.',
    2: 'The magnet turns current into motion. It is on the receiving end; it supplies no electrical energy.',
    3: 'The gain control only sets how much is asked for. Something else has to supply it.',
  },
  'w-lineout': {
    0: 'The waveform is fine: a line signal carries the same music shape. The problem is how much it can push.',
    1: 'A line output is an analog voltage, the same kind a speaker takes. Nothing needs decoding.',
    3: '“Amplified impedance” is not a thing. Think about what a cone needs to move: volts AND current.',
  },
  'w-gains': {
    0: 'That would turn 0.1 V into only 1 V. Divide the output by the input again.',
    2: 'That is the input divided by the output, upside down. Gain is out ÷ in.',
    3: 'Twenty would give 2 V. Check the division, and do not mix a ratio with decibels.',
  },
  'd-active': {
    0: 'Storing energy in a magnetic field is what a coil or transformer does, a passive part.',
    2: 'No part turns watts into “higher volts” for free. Look at what the small control signal does in the drawing.',
    3: 'Isolation is a transformer’s job. A transistor sits in the current path and controls it.',
  },
  'd-xfmr': {
    0: 'If both doubled, power would come out four times bigger than went in. A transformer adds no energy.',
    1: 'Power is volts × amps. With more volts out and the same current, more power would come out than went in.',
    3: 'A transformer passes changing (AC) signals only; it never turns them into DC.',
  },
  'd-70v': {
    0: 'A transformer cannot make watts. Each speaker still draws its power from the amplifier.',
    2: 'The line carries ordinary audio the whole way. Radio has nothing to do with it.',
    3: 'Grounding is not the job here. Think about what the tap setting on each speaker controls.',
  },
  'b-notch': {
    0: 'Rails flatten the PEAKS: that is clipping, a different fault. Look where the notch sat in the zoom view.',
    2: 'The notch is not tied to low notes. It shows wherever the wave passes through zero.',
    3: 'Class A never hands over between devices, so it cannot make this notch.',
  },
  'b-conduction': {
    0: 'In Class B each device conducts for about half the cycle, 180°, not all of it.',
    1: 'Class C conducts for LESS than half a cycle, in short pulses.',
    3: 'Class D switches fully on and off; it does not conduct smoothly all the way round.',
  },
  'b-bias': {
    1: 'Maximum output is set by the rails and the load, not by idle current.',
    2: 'Bias sets the resting current. The stage’s gain stays about the same.',
    3: 'There is no switching in this stage to filter. Watch the HEAT readout as bias rises.',
  },
  'c-idle': {
    0: 'That describes Class B at rest. Watch the IDLE and HEAT readouts with Class A and no input.',
    2: 'Class A never switches off; that is the point of the class.',
    3: 'Oscillating at a tuned frequency is a Class C radio trick, not Class A.',
  },
  'c-classc': {
    0: 'High efficiency does not change how a sound sounds. Think about what the short pulses lose.',
    2: 'Class C works with transistors too; tubes are not the issue.',
    3: 'Gain can be added later in any class. The trouble is the shape of what comes out.',
  },
  'c-eff': {
    0: 'No real amplifier reaches its theoretical ceiling; parts and losses keep it lower.',
    2: 'Efficiency changes with output level. Look at EFFIC. as you lower LEVEL.',
    3: 'It comes from the circuit’s math, not from a rule written by a regulator.',
  },
  'cd-pwm': {
    0: 'Each channel has its own modulator. The two channels are never compared.',
    2: 'Voltage against current describes the load, not how the pulses are made.',
    3: 'The rails are what the switches connect to. What sets the pulse width is the comparison.',
  },
  'cd-filter': {
    0: 'Nothing is removed that needs adding back. Look at what the filter smooths out.',
    2: 'There is no digital code in a classic Class D; the pulses are analog switching.',
    3: 'A filter always wastes a little. No amplifier reaches 100%.',
  },
  'cd-digital': {
    0: 'The letter has a simpler history: look at the classes the module listed before it.',
    2: 'Pulses can be analog. Ask whether anything here was sampled or turned into numbers.',
    3: 'The carrier frequency does not decide whether something is digital.',
  },
  's-rails': {
    0: 'Digital or analog, the input is only a control signal. Look at what flattened the peaks on screen.',
    2: 'Sensitivity sets how loud a speaker plays per watt; it cannot make the amplifier clip.',
    3: 'A knob position is not a limit. The same position can be clean or clipped depending on the input.',
  },
  's-sag': {
    0: 'Heavy current draw cannot raise the supply. Think about what it does to the capacitors’ charge.',
    2: 'The rails keep their polarity; only their size changes under load.',
    3: 'The rails stay DC. The rectifier and capacitors still do their job, just at a lower voltage.',
  },
  's-safety': {
    0: 'Radio energy does not linger in a chassis. Look back at what stores charge in the supply chain.',
    2: 'A transformer needs incoming power to produce anything. Unplugged, it is silent.',
    3: 'Unplugging is not enough; the module’s warning says why.',
  },
  'r-parallel': {
    0: '16 Ω is what SERIES wiring gives. Parallel gives the current two paths.',
    1: 'Two paths for the current must make the load easier to push current through, so lower than 8 Ω.',
    3: 'That would take four 8 Ω speakers in parallel. Count the speakers again.',
  },
  'r-bridge': {
    0: 'Two Ω would be a quarter of the load. Each channel drives one end of it.',
    2: 'That would be true for one channel alone. In bridge mode the two channels share the load from opposite ends.',
    3: 'Bridging makes the load harder for each channel, never easier.',
  },
  'r-3db': {
    1: '+10 dB needs ten times the power, not twice.',
    2: 'Twice the loudness needs about ten times the power. Doubling the watts is far less.',
    3: '+6 dB needs four times the power. Here the power only doubles.',
  },
  'r-cable': {
    0: 'The plug often fits a speaker jack perfectly; that is the trap. Look at what is inside the cable.',
    2: 'Instrument cable carries analog signals, not digital ones.',
    3: 'Wired the usual way, it keeps polarity. The issue is how much current it can carry.',
  },
  'a-sens': {
    0: 'Gain is a ratio. This spec names one input level and what it produces.',
    2: 'Noise is its own spec. Sensitivity is about how hard you must drive the input.',
    3: 'Load impedance is about the OUTPUT side, the speaker. Sensitivity is about the input.',
  },
  'a-damping': {
    0: 'Power out over power in is closer to efficiency, a different spec.',
    2: 'Volts over amps is an impedance, but this spec compares two impedances.',
    3: 'Peak over RMS is the crest factor of a signal, not an amplifier spec.',
  },
  'a-thermal': {
    0: 'Resetting without a fix brings the same trip back, and risks the amplifier.',
    2: 'Bridging halves the load each channel sees: more heat, not less.',
    3: 'A lower impedance draws MORE current, so more heat.',
  },
};
