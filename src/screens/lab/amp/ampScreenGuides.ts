/**
 * Amplifier Principles Lab — "explain this screen" content (owner 2026-10-31,
 * the Screen Guide rollout, Electronics group). A module is a run of STEPS
 * (steps.tsx: a RACK step pins a rig or diagram on the glass, a READ step
 * scrolls as a document), and each step is its own screen — so there is one
 * guide per step, in the module's own step order, plus the lab home and the
 * what's-left screen.
 *
 * Every line was written against the module's own code (modules/mod1…mod8,
 * AmpRack, AmpRig, features/amp/ampModel + ampContent): the names are the
 * on-screen names (dock labels, bezel keys and words, tray options, panel
 * titles, section titles, buttons), and every number in TRY THIS is what the
 * model prints at that setting (computed from ampModel — the test recomputes
 * them). Change a step's labels, ranges, defaults or order → update its guide
 * here; test/screenGuide_amp_20261031.test.ts pins the shape, the step order,
 * the names and the numbers.
 *
 * STEPPED: each section is one step held to SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language; claims KNOWLEDGE, never skills; no gear maker
 * names; no "N of total"; no build notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import type { AmpModuleId } from '../../../features/amp/ampContent';

/** One step's guide: the step `key` and `kind` exactly as the module declares
 *  them (pinned by the test), so the host can key the guide by step index. */
export type AmpStepGuide = { key: string; kind: 'rack' | 'read'; guide: ScreenGuide };

const RUN_SLOW = 'RUN and SLOW start, stop or slow the moving playhead. With reduced motion on, one STEP ¼ key replaces them. ⤢ FULL SCREEN enlarges the display.';
const STRIP = 'The strip under the title moves between steps and modules. ‹ goes back one screen, to the lab menu.';

export const AMP_HOME_GUIDE: ScreenGuide = {
  intro: {
    learning: 'The three questions this lab asks of every amplifier: what it does to the signal, what load it drives, and where its output power really comes from.',
    start: 'Tap a module’s name in the MODULE MAP to read what it covers. New to amplifiers? Tap START · MODULE 1 › and take the modules in order.',
  },
  seeing: [
    'You’re on the Amplifier Principles Lab menu. One question runs through every module: what is the amplifier doing, what load does it see, and where does the extra energy come from?',
    'At the top: your progress line, and a START or RESUME button for your next unfinished module.',
    'Below: the MODULE MAP (✓ on each finished module), CHECK YOUR UNDERSTANDING, SEE WHAT’S LEFT ›, a safety note and RESET LAB PROGRESS.',
  ],
  control: [
    'Tap a module’s name to read its one-line description, or tap OPEN to start it.',
    'START or RESUME · MODULE › opens the module you were in, or the first one you haven’t finished.',
    'CHECK YOUR UNDERSTANDING is a short quiz on the whole lab.',
    'SEE WHAT’S LEFT › lists what you still have to do. RESET LAB PROGRESS starts a fresh practice run: it clears your answered checks and latest final attempt, and keeps your completed modules and best final result.',
    '‹ leaves the lab. Inside a module, tap ⓘ beside its title to have that screen explained.',
  ],
  changes: [
    'Modules 1–3 build the basics: what an amplifier does, the parts that control power, and bias.',
    'Modules 4–5 compare the classes A, B, AB and C, then open up Class D switching.',
    'Modules 6–8 cover power supplies and clipping, real-world operation, then diagnosis and the final assessment.',
    'A module is complete once you answer its checks and tap MARK COMPLETE ›. Module 8 also needs the final assessment.',
  ],
  teaches: [
    'An amplifier’s output power comes from its power supply, not the input. You’ll also see what load it drives and what each class trades away.',
    'Vacuum Tube Fundamentals showed one way to amplify. Here the same ideas carry over to transistors, transformers and switching amplifiers.',
    'The numbers are teaching values from a model amplifier, not bench measurements. The lab explains principles, not repair.',
  ],
  tryThis: [
    'New to amplifiers? Tap START · MODULE 1 › and work through in order. Each module sets up the next.',
    'Tap a module in the MODULE MAP to read its description before you open it.',
    'Coming back later? Tap SEE WHAT’S LEFT › to find any module, or the final, still to do.',
  ],
};

export const AMP_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'Which of the lab’s ideas you still need to revisit: bias and classes, Class D, supply limits, loads and gain structure.',
    start: 'Read the WHAT’S LEFT list and tap the first row to open it. Then answer CHECK YOUR UNDERSTANDING on this screen. A wrong pick explains itself.',
  },
  seeing: [
    'WHAT’S LEFT lists the modules you haven’t marked complete, the Final assessment (your best score once you submit) and, last, the CHECK row for Check your understanding.',
    'LAB COMPLETE appears only when all are done, including a passed check. Finished items fold into one ✓ DONE row; REVIEW ▾ lists them.',
    'Below: CHECK YOUR UNDERSTANDING, the lab menu’s quiz. You need it passed to complete the lab.',
  ],
  control: [
    'Tap a row to open it. The Final assessment row opens Module 8; the Check your understanding row scrolls to the check on this screen.',
    'Answer the CHECK YOUR UNDERSTANDING questions. A wrong pick explains why, and you can try another.',
    'PRACTICE AGAIN FROM THE START opens Module 1. It never clears what you’ve done.',
    'DONE · BACK TO LABS goes back one screen: to the lab menu from a module, or out of the lab from the menu.',
  ],
  changes: [
    'A module counts as done once you mark it complete. The final counts once your best result passes, and a weaker retake never takes that away.',
    'The check counts as done once every answer is right, and RESET LAB PROGRESS keeps it passed.',
    'If your saved progress can’t be read, the title says YOUR PROGRESS and every row stays listed and open.',
  ],
  teaches: [
    'The lab’s three questions fit any amplifier you meet: what it does to the signal, what load it sees, and where the energy comes from.',
    'The final and the check test how the ideas connect: reading an output against its rails, matching a class to a job, and judging a load or a gain setting.',
  ],
  tryThis: [
    'Open the first row on the list and work down in order.',
    'Tap REVIEW ▾ and reopen a module you found hard. Predict what its waveform will do before you move a control.',
  ],
};

export const AMP_STEP_GUIDES: Record<AmpModuleId, AmpStepGuide[]> = {
  // ── Module 1 · What an Amplifier Actually Does ──────────────────────────
  what: [
    {
      key: 'rig',
      kind: 'rack',
      guide: {
        intro: {
          learning: 'An amplifier doesn’t stretch your signal or create energy: it builds a bigger copy, with the input steering and the power supply paying.',
          start: 'Make your prediction under PREDICT, THEN TRY. Then raise LEVEL slowly and watch OUTPUT: past about 67% it flips from CLEAN to CLIP and the peaks flatten at the red rail lines.',
        },
        seeing: [
          'INPUT (signal) is on top and OUTPUT (to load) below. The red dashed lines are the rail limits: the furthest the power supply lets the output swing.',
          'Color shows size, blue near zero to red at the rails. A clipped peak is drawn heavier.',
          'Readouts: OUTPUT (CLEAN or CLIP), SUPPLY (energy drawn), HEAT, EFFIC. (illustrative efficiency) and LOAD (how hard the speaker is driven).',
        ],
        control: [
          'LEVEL fader (0–100%) sets the input signal. The output is 1.5 times the input, up to the rails.',
          RUN_SLOW,
          'Scroll below the display for IN THIS MODULE, PREDICT, THEN TRY, the SIGNAL PATH figure, three kinds of gain and an APPLIED COMPARISON.',
          STRIP,
        ],
        changes: [
          'Raise LEVEL and the output grows 1.5 times as fast, until it reaches the rails. Past about 67% input, the peaks flatten: that’s clipping.',
          'SUPPLY rises with the output, because the extra energy comes from the power supply, not from the input.',
          'Once clipped, the output stops following the input. The flat tops carry harmonics the input never had, and you hear them as distortion.',
        ],
        teaches: [
          'An amplifier doesn’t stretch your signal or create energy. It builds a bigger copy: the input steers, the supply pays.',
          'Gain comes in three kinds, voltage, current and power, each with its own decibel formula.',
          'A line output can’t drive a speaker on its own. It delivers far too little power, so a power amplifier sits in between.',
        ],
        tryThis: [
          'Make your prediction, then slide LEVEL past 67%. OUTPUT flips to CLIP and the peaks flatten at the rails.',
          'Set LEVEL to 40%: SUPPLY reads 57%. At 60% it reads 82%. More output means more energy drawn from the supply.',
          'In APPLIED COMPARISON, tap Line out → speaker: about 0.19 W, against 25 W through the power amp.',
        ],
      },
    },
  ],

  // ── Module 2 · Transistors, Tubes, and Transformers ─────────────────────
  devices: [
    {
      key: 'device',
      kind: 'rack',
      guide: {
        intro: {
          learning: 'What an active device does: a small control signal steers a large current from the power supply. Transistors and tubes do this same job.',
          start: 'Slide CONTROL from 0% to 100% and watch REGION move from OFF to CONTROL to FULL. Then switch DEVICE between BJT and Tube and compare the terminal names.',
        },
        seeing: [
          'This is a power path: the SUPPLY (a DC source), the active device and a loudspeaker LOAD, with a return wire closing the loop. The control input enters from the top.',
          'The thicker the wire and the fuller the CONTROLLED CURRENT bar, the more current is flowing.',
          'Readouts: REGION (OFF, CONTROL or FULL), CURRENT (share of full) and DEVICE.',
        ],
        control: [
          'CONTROL fader (0–100%) sets the small control signal.',
          'DEVICE key picks Generic, BJT, MOSFET or Tube. The drawing changes to that device’s symbol and terminal names.',
          '⤢ FULL SCREEN enlarges the drawing.',
          STRIP,
        ],
        changes: [
          'Below 15% the device is OFF: no current flows. Above that, current follows the control: the useful region. Above 85% it’s FULLY DRIVEN, and more control changes nothing.',
          'The energy always comes from the supply. The device only controls how much of it reaches the load.',
          'Each device names its terminals differently: BJT base, collector, emitter; MOSFET gate, drain, source; tube control grid, plate, cathode.',
        ],
        teaches: [
          'An active device lets a small control steer a large flow of current from the supply.',
          'Transistors and tubes do the same job, but they’re controlled differently and need very different circuits around them.',
          'Between OFF and FULLY DRIVEN the current follows the control. That middle region is the one a linear amplifier works in.',
        ],
        tryThis: [
          'Slide CONTROL to 50%: CURRENT reads 50%. At 90% it reads 100%, and REGION reads FULL.',
          'Slide below 15%: REGION reads OFF and CURRENT reads 0%.',
          'Switch DEVICE between BJT, MOSFET and Tube, and read what each one calls its control terminal.',
        ],
      },
    },
    {
      key: 'xfmr',
      kind: 'rack',
      guide: {
        intro: {
          learning: 'How a transformer’s turns ratio trades voltage for current without adding power, and why it changes impedance by the ratio squared.',
          start: 'At the start (Np 400, Ns 200), read KIND, Vs and Is. Then raise Ns to 800 and watch Vs climb while Is falls.',
        },
        seeing: [
          'This is a transformer: PRIMARY · Np and SECONDARY · Ns windings on a laminated steel CORE. The changing magnetic field loops around the core.',
          'The input wave sits at the left. The output wave at the right grows or shrinks with the turns ratio.',
          'Readouts: KIND, RATIO (Np to Ns), Vs and Is: the secondary’s volts and amps when the primary gets 120 V and 1 A.',
        ],
        control: [
          'Np and Ns faders set the turns on each winding: 100 to 1000, in steps of 50.',
          '⤢ FULL SCREEN enlarges the drawing.',
          STRIP,
        ],
        changes: [
          'Vs = Vp × Ns ÷ Np: give the secondary more turns and the output voltage rises.',
          'Current goes the other way. Step the voltage up and the available current steps down by the same ratio, so power out never exceeds power in.',
          'Impedance scales by the ratio squared. That’s how a tube output transformer lets a high-voltage stage drive an 8 Ω speaker.',
        ],
        teaches: [
          'A transformer trades voltage for current and adds no power. Real ones lose a little on the way.',
          'Transformers earn their place in power supplies, tube amp outputs, 70 V and 100 V speaker lines, and isolation.',
          'The turns ratio sets it all: voltage by the ratio, current by its inverse, impedance by its square.',
        ],
        tryThis: [
          'At the start (Np 400, Ns 200), KIND reads STEP-DOWN, RATIO 2.00:1, Vs 60.0 V and Is 2.00 A.',
          'Raise Ns to 800: KIND flips to STEP-UP, Vs reads 240.0 V and Is 0.50 A. That’s still 120 W.',
          'Set Ns equal to Np: KIND reads 1:1 ISOLATION and Vs 120.0 V. The voltage is unchanged, but the two windings share no wire.',
        ],
      },
    },
  ],

  // ── Module 3 · Bias, Conduction, and Push-Pull ──────────────────────────
  bias: [
    {
      key: 'bias',
      kind: 'rack',
      guide: {
        intro: {
          learning: 'How the bias point, where a device sits with no signal, decides which part of the wave survives and how much heat the device makes at idle.',
          start: 'Slide BIAS down to 20% and watch the bottom of OUTPUT flatten. Slide it up to 90% and watch the top flatten instead.',
        },
        seeing: [
          'One device: INPUT (signal) on top, DEVICE CURRENT (gold) in the middle and OUTPUT (to load) below. The current only runs from 0 to full conduction.',
          'Readouts: REGION (CUTOFF, LINEAR or SATUR.), IDLE (current with no signal), SUPPLY and HEAT.',
          'Below the display, the region in words: TOO LITTLE BIAS, APPROPRIATE LINEAR BIAS or EXCESSIVE BIAS, and what each one costs.',
        ],
        control: [
          'BIAS fader (0–100%) sets the device’s operating point: where it sits with no signal.',
          RUN_SLOW,
          STRIP,
        ],
        changes: [
          'The signal swings the current up and down around the bias point, but the device can only pass between zero and full current.',
          'Below 25%, the bottom of the swing would need less than zero current, so it’s cut off: CUTOFF. Idle current and heat stay low.',
          'Above 75%, the top runs out of room and flattens (saturation), with high idle current and heat. In between, the whole swing fits: LINEAR.',
        ],
        teaches: [
          'Bias is the first of three ideas behind the amplifier classes. The other two are conduction angle and push-pull.',
          'The bias point decides which part of the wave survives and how much heat the device makes at idle.',
          'No single bias suits every amplifier: it depends on the device, the circuit and the class.',
        ],
        tryThis: [
          'Slide BIAS to 20%: REGION reads CUTOFF and the bottom of the output wave is cut flat.',
          'Slide to 90%: REGION reads SATUR., IDLE reads 90% and HEAT reads DANGER.',
          'Return to 50%: REGION reads LINEAR and the whole wave comes back, with IDLE at 50%.',
        ],
      },
    },
    {
      key: 'angle',
      kind: 'rack',
      guide: {
        intro: {
          learning: 'Conduction angle: how much of each 360° cycle a device passes current, and how that one number separates Classes A, AB, B and C.',
          start: 'Tap ANGLE and pick 360° · A, then 90° · C. Watch how much of the cycle the DEVICE CURRENT flows, and compare SUPPLY and HEAT.',
        },
        seeing: [
          'One cycle of INPUT (signal), and the DEVICE CURRENT, which flows only for the part of the 360° cycle you choose.',
          'Readouts: ANGLE, CLASS (the class that angle belongs to), SUPPLY and HEAT.',
        ],
        control: [
          'ANGLE key: 90° · C, 180° · B, 270° · AB or 360° · A.',
          RUN_SLOW,
          STRIP,
        ],
        changes: [
          '360°: the device never switches off. That’s Class A, with the most idle heat.',
          '180°: only the positive half. Paired with a second device for the other half, that’s Class B.',
          '270°: past the zero crossing into the other half, so two such devices overlap: Class AB. 90°: short pulses near the peak, Class C.',
          'SUPPLY and HEAT fall with the angle: less time conducting, less energy drawn.',
        ],
        teaches: [
          'Conduction angle is how much of each cycle a device passes current. It’s one way to tell the classes apart.',
          'Below 360°, one device can’t rebuild the whole wave, so Classes B and AB pair it with a second device.',
          'Class D doesn’t fit this measure: its devices switch fully on and off instead.',
        ],
        tryThis: [
          'Pick 360° · A: SUPPLY reads 100% and HEAT reads hot. Pick 90° · C: SUPPLY reads 25% and HEAT reads cool.',
          'Pick 180° · B and watch the current stop for the whole negative half of the cycle.',
        ],
      },
    },
    {
      key: 'pushpull',
      kind: 'rack',
      guide: {
        intro: {
          learning: 'How two push-pull devices share one waveform, why too little bias leaves a crossover notch at zero, and why too much bias only adds idle heat.',
          start: 'At the start HANDOFF reads NOTCH. Open ZERO CROSS to see the flat step, then raise BIAS to 44% and watch it close.',
        },
        seeing: [
          'Two devices share the work: INPUT (signal), DEVICE CURRENTS (+ gold solid · − purple dashed) and OUTPUT (to load).',
          'Readouts: HANDOFF (NOTCH, CLEAN or OVERBIAS), IDLE, SUPPLY and HEAT.',
          'Below: YOUR TASK, and the ZERO CROSS figure, which magnifies the output around zero ×3.2.',
        ],
        control: [
          'BIAS fader (0–100%) sets the output stage’s bias, which decides how much the two devices overlap.',
          RUN_SLOW,
          'The ZERO CROSS figure has its own full-screen view, with the same bias control.',
          STRIP,
        ],
        changes: [
          'With little bias, each device waits for the signal to pass its threshold, so nothing handles the region around zero: a flat step called crossover distortion.',
          'More bias makes both devices conduct around zero. From 44%, the notch is gone.',
          'Bias also raises idle current and supply draw. From 84% HANDOFF reads OVERBIAS and IDLE turns gold at 8.1%, just past YOUR TASK’s 8% ceiling.',
        ],
        teaches: [
          'In push-pull, each device handles one half of the wave. Crossover distortion comes from the gap where they hand over.',
          'The notch matters most at low levels, where it’s a large part of the signal.',
          'That’s the Class AB idea: just enough bias to close the gap, and no more.',
        ],
        tryThis: [
          'At the start (10%), HANDOFF reads NOTCH. Open ZERO CROSS and find the flat step.',
          'Raise BIAS to 44%: HANDOFF reads CLEAN, with IDLE at 4.2%.',
          'Keep going to 90%: HANDOFF reads OVERBIAS. The notch stays gone and you only add cost: SUPPLY climbs from 63% to 76% as idle current rises.',
        ],
      },
    },
  ],

  // ── Module 4 · Amplifier Class Explorer ─────────────────────────────────
  classes: [
    {
      key: 'explorer',
      kind: 'rack',
      guide: {
        intro: {
          learning: 'How Classes A, B, AB and C each trade efficiency, heat and distortion, why AB is the analog workhorse, and why Class C suits radio, not audio.',
          start: 'With CLASS on Class A and LEVEL at 80%, read EFFIC. Then switch CLASS to B and compare EFFIC. and DISTORT. Then pick AB and raise AB BIAS.',
        },
        seeing: [
          'The rig for the class you pick: INPUT, DEVICE CURRENT(S) and OUTPUT. In Class C the output shows the raw pulses; dashed is after the tuned circuit.',
          'Readouts: CONDUCT. (degrees each device conducts), IDLE (current with no signal), EFFIC. (illustrative, at this level), HEAT and DISTORT.',
          'Below: the same numbers explained, a ZERO CROSS zoom for B and AB, and SIDE BY SIDE fact cards for A, B, AB, C and D.',
        ],
        control: [
          'CLASS key: Class A, B, AB or C. The tray stays open, so you can compare while the display reacts.',
          'LEVEL fader sets the input level. It locks when Class A’s SIGNAL is off.',
          'Each class has its own control: SIGNAL (A, switches the input off), AB BIAS (AB, 0–100%) or TUNE (C, 0.50× to 2×; 1.00× is tuned).',
          'RUN and SLOW start, stop or slow the playhead; ⤢ FULL SCREEN enlarges the display. Tap a fact card to open all eight rows.',
          STRIP,
        ],
        changes: [
          'A: one device conducts all 360°. With no signal IDLE stays 100%, HEAT hot: low efficiency.',
          'B: each device ideally conducts half the cycle (180°). CONDUCT. reads 165°, as each needs a small turn-on voltage; that gap is the NOTCH. IDLE 0%, higher efficiency.',
          'AB: more AB BIAS overlaps the devices past zero: the notch closes, idle rises.',
          'C: pulses ring a tuned circuit into a sine, only near its tuned frequency.',
        ],
        teaches: [
          'Each class trades efficiency, heat and distortion. There is no “best” class.',
          'AB is the workhorse of analog power amplifiers: it closes B’s notch for a little idle current. Class C rings at one tuned frequency, so it suits radio, not audio.',
          'Efficiency figures are theoretical maxima or illustrative values, never guarantees.',
        ],
        tryThis: [
          'Class A at the start (LEVEL 80%): EFFIC. reads 16%. Switch CLASS to B: 48%, and DISTORT. reads NOTCH. Both are illustrative figures at this level, not specs.',
          'Pick AB and raise AB BIAS from 0% to 50%: DISTORT. turns CLEAN and CONDUCT. rises from 165° to 190°.',
          'Pick C and set TUNE to 1.05×: DISTORT. reads DETUNED. Back at 1.00× it reads CLEAN.',
        ],
      },
    },
  ],

  // ── Module 5 · Inside Class D ───────────────────────────────────────────
  classd: [
    {
      key: 'pwm',
      kind: 'rack',
      guide: {
        intro: {
          learning: 'Pulse-width modulation: how a Class D amplifier turns audio into fast pulses whose widths carry the signal, then filters them back into analog audio.',
          start: 'Watch the audio wave cross the amber triangle carrier. Then drop LEVEL from 70% to 10% and watch AT PEAK and AT TROUGH close in toward 50%.',
        },
        seeing: [
          'INPUT shows the audio wave against a much faster triangle carrier (amber dashed). OUTPUT shows whatever the VIEW key picks.',
          'Readouts: AT TROUGH and AT PEAK (how much of each switching period the output spends at the + rail), EFFIC., HEAT, and LOAD once VIEW reads AUDIO (Recovered audio).',
          'The switching is slowed down so you can see it. Real carriers run at hundreds of kilohertz, far above hearing.',
        ],
        control: [
          'LEVEL fader (0–95%) sets the audio level.',
          'VIEW key: Raw switching, Filter action or Recovered audio. The tray stays open while the display reacts.',
          RUN_SLOW,
          'Below the display: the CLASS D signal-path figure.',
          STRIP,
        ],
        changes: [
          'Where the audio is above the carrier, the switch goes high; below it, low. Only two levels exist, so the audio lives in the pulse widths.',
          'Louder audio swings the widths further: AT PEAK rises as AT TROUGH falls. Silence sits at 50% for both.',
          'The output filter averages the pulses. That short-term average follows the audio, and it’s what reaches the loudspeaker.',
        ],
        teaches: [
          'A switching amplifier turns audio into pulses, then a filter turns them back into a wave: pulse-width modulation.',
          'Class D isn’t digital and isn’t a bigger Class C. Its output is analog audio recovered by a filter.',
          'Its devices are only ever fully on or fully off, never held halfway, which is why Class D wastes so little power as heat.',
        ],
        tryThis: [
          'At the start (70%), AT TROUGH reads 15% and AT PEAK 85%. Drop LEVEL to 10%: 45% and 55%, close to silence.',
          'Switch VIEW to Filter action and watch the smooth filter output ride the pulses.',
          'Switch VIEW to Recovered audio: that’s the wave the speaker gets, and the LOAD readout appears.',
        ],
      },
    },
    {
      key: 'bridge',
      kind: 'rack',
      guide: {
        intro: {
          learning: 'How a Class D half-bridge switches its output between two rails, why it runs cool but never at 100% efficiency, and why efficiency drops at low output.',
          start: 'At LEVEL 70%, read TO LOAD and AS HEAT. Then drop LEVEL to 10% and see how much more of the supply’s power turns into heat.',
        },
        seeing: [
          'A half-bridge: +RAIL and −RAIL, a HIGH SIDE and a LOW SIDE device meeting at the switching node, then L and C (the output filter) and the LOAD speaker, returning to 0 V.',
          'One switching period is drawn over the node wire. Its high part is the high side’s share at the peak.',
          'Readouts: AT PEAK, TO LOAD (share of supply power reaching the speaker) and AS HEAT (share lost).',
        ],
        control: [
          'LEVEL fader (0–95%): the same audio level as in the previous step.',
          '⤢ FULL SCREEN enlarges the drawing.',
          'Below: DEAD TIME, and WHERE THE ENERGY GOES, a breakdown of the losses at this level.',
          STRIP,
        ],
        changes: [
          'The high side ties the node to +rail, the low side to −rail, never both at once. If both were on, the rails would short through them.',
          'Higher LEVEL widens the high side’s on-time at the peak, so AT PEAK rises.',
          'At low level, the fixed losses are most of what the supply pays for, so TO LOAD falls and AS HEAT rises.',
        ],
        teaches: [
          'Class D runs cool but never at 100%: real switches have resistance, take time to switch and need gate drive, and the filter loses a little too.',
          'Efficiency drops at low output, because the fixed losses stay while the useful power shrinks.',
          'Dead time, a short gap with both switches off, keeps the rails from shorting through them.',
        ],
        tryThis: [
          'At 70%, TO LOAD reads 83% and AS HEAT 17%. Drop LEVEL to 10%: 56% and 44%.',
          'Raise LEVEL to the top and watch the high part of the drawn period widen as AT PEAK climbs to 98%.',
        ],
      },
    },
  ],

  // ── Module 6 · Power Supplies, Limits, and Clipping ─────────────────────
  supply: [
    {
      key: 'rails',
      kind: 'rack',
      guide: {
        intro: {
          learning: 'Every amplifier runs out of voltage or current somewhere. Rail clipping, supply sag, current limiting and protection each leave a different shape on the waveform.',
          start: 'At 8 Ω, raise LEVEL until STATE turns V-CLIP and the peaks flatten at the rails. Then switch LOAD to 2 Ω and watch I-LIMIT flatten them below the rails.',
        },
        seeing: [
          'INPUT (signal) and OUTPUT (to load) against red dashed working rails. Faint outer lines show the idle rails once they sag; current limiting adds a gold dashed ceiling.',
          'Readouts: STATE (CLEAN, V-CLIP, I-LIMIT or PROTECT), RAILS, OUTPUT (volts rms), CURRENT (amps rms) and POWER (watts).',
          'The numbers are a teaching example: ±40 V rails, a 9 A current limit and 13 A protection.',
        ],
        control: [
          'LEVEL fader sets the drive. RAIL fader sets the nominal rails, ±12 V to ±40 V.',
          'LOAD key: 8 Ω, 4 Ω or 2 Ω. SUPPLY key: Linear supply or Switch-mode supply.',
          'RUN starts or stops the playhead, and ⤢ FULL SCREEN enlarges the display. Below: the supply chain for your SUPPLY choice.',
          STRIP,
        ],
        changes: [
          'Too much drive into 8 Ω and the peaks flatten at the rails: voltage clipping.',
          'Current draw sags a linear supply’s rails, so clipping starts below the nominal figure. A switch-mode supply holds up better.',
          'Into 2 Ω the output stage hits its 9 A limit before the rails, so the peaks flatten below them. Past 13 A of demand, protection mutes the output.',
        ],
        teaches: [
          'Every amplifier runs out of voltage or current somewhere, and each limit leaves a different shape on the waveform.',
          'Lower impedance draws more current for the same voltage: I = V ÷ R, and P = Vrms² ÷ R.',
          'Clipping isn’t harmless, and real amplifiers hold lethal voltage inside.',
        ],
        tryThis: [
          'At 8 Ω, raise LEVEL: STATE turns V-CLIP at 75%, with RAILS sagged to ±37 V.',
          'Switch LOAD to 2 Ω: I-LIMIT from 51%, with CURRENT held at 9.0 A, then PROTECT from 74%.',
          'Back at 8 Ω, pick Switch-mode supply: clipping now starts at 79%, because its rails sag less.',
        ],
      },
    },
  ],

  // ── Module 7 · Real-World Amplifier Operation ───────────────────────────
  realworld: [
    {
      key: 'gain',
      kind: 'rack',
      guide: {
        intro: {
          learning: 'Gain structure: distortion starts at the first stage to clip, turning the amp down can’t undo it, and AMP IN sets sensitivity, not watts.',
          start: 'With all three faders at 50%, read VERDICT. Then raise SOURCE to 63% and lower AMP IN, and watch whether VERDICT changes.',
        },
        seeing: [
          'The chain: SOURCE → MIXER / DSP → AMP INPUT → AMP OUTPUT (rails) → SPEAKER. Meters under SOURCE, MIXER / DSP and AMP OUTPUT read % of clip.',
          'Each meter is green when healthy, gold when starved (too low) and red at CLIPPING.',
          'Readouts: VERDICT (HEALTHY, STARVED or the first stage to clip) and the SOURCE, MIXER and AMP IN settings.',
        ],
        control: [
          'SOURCE, MIXER and AMP IN faders (0–100%) set each stage’s level.',
          '⤢ FULL SCREEN enlarges the chain. Below: the safety list, the verdict in words, and a myth.',
          STRIP,
        ],
        changes: [
          'Each stage multiplies what it receives, and none can pass more than its own clip point.',
          'Distortion starts at the FIRST stage to clip, and nothing after it can undo that. Turning the amp down only makes quieter distortion.',
          'A stage sending almost nothing makes the next one add gain, and noise with it. AMP IN sets input sensitivity, not how many watts the amp has.',
        ],
        teaches: [
          'Gain structure means every stage runs at a healthy level, with headroom left for peaks.',
          'The upstream-clipping trap: the sound turns harsh while the amp’s CLIP light stays dark.',
          'Real amplifiers carry lethal voltage and stored charge. Never short an output, or tie two outputs together.',
        ],
        tryThis: [
          'At the start (all 50%), the meters read 80%, 64% and 51% of clip, and VERDICT reads HEALTHY.',
          'Raise SOURCE to 63%: VERDICT reads CLIP:SRC. Now lower AMP IN. The verdict stays, because the damage happened upstream.',
          'With SOURCE back at 50%, push AMP IN to 98%: VERDICT reads CLIP:OUT. The output has reached its rails.',
        ],
      },
    },
    {
      key: 'practice',
      kind: 'read',
      guide: {
        intro: {
          learning: 'How speaker loads add in parallel and series, what bridging really does to the load, and why twice the power is only about 3 dB louder.',
          start: 'With two 8 Ω cabinets in Parallel, the load builder reads Ztotal ≈ 4.00 Ω. Tap + 8 Ω once more and watch the warning appear.',
        },
        seeing: [
          'This page is a set of worked tools: the speaker-load builder, power and current, bridged operation, watts and loudness, clipping risk, a rack inspection and a specification decoder.',
          'Every figure is a resistive teaching example. A real speaker’s impedance changes with frequency, so its load moves around the nominal figure.',
        ],
        control: [
          'Load builder: Parallel or Series. + 16 Ω, + 8 Ω or + 4 Ω adds a cabinet (up to four); CLEAR starts again.',
          'Power: 8 Ω, 4 Ω or 2 Ω at 28.3 Vrms. Bridge: Stereo or Bridge mode, then an 8 Ω or 4 Ω bridged load.',
          'Watts: slide the Power ratio P2 ÷ P1 from 0.25× to 10×.',
          'Inspection: pick a Rack, then the finding you see. Decoder: pick a Sheet, check what’s missing, then tap CHECK.',
          'At the end: CHECK YOURSELF questions, the TAKEAWAY and MARK COMPLETE ›.',
        ],
        changes: [
          'Cabinets in parallel lower the total impedance; in series they raise it. Below the amp’s 4 Ω minimum, expect protection, limiting or heat.',
          'Halve the load and the current doubles at the same voltage. Bridging doubles the voltage, but each channel sees half the load.',
          'Twice the power is only about +3 dB. Roughly ten times the power sounds about twice as loud.',
        ],
        teaches: [
          'How working engineers read speaker loads, bridge mode and power ratings.',
          'A power rating means little without its test conditions, such as the load it was measured into.',
          'Not every rack needs a fix: some are fine and best left alone.',
        ],
        tryThis: [
          'Two 8 Ω in parallel read Ztotal ≈ 4.00 Ω, within the minimum. Tap + 8 Ω: 2.67 Ω, and the warning appears.',
          'In POWER AND CURRENT pick 4 Ω: 7.08 A and 200 W, against 3.54 A and 100 W at 8 Ω. Same voltage, half the load, double the current.',
          'The power ratio starts at 2.00×: the formula reads +3.01 dB. Slide it to the top, 10.00×: +10.00 dB, about twice as loud.',
        ],
      },
    },
  ],

  // ── Module 8 · Diagnose and Apply ───────────────────────────────────────
  apply: [
    {
      key: 'diagnose',
      kind: 'rack',
      guide: {
        intro: {
          learning: 'What each amplifier fault looks like: where the flat tops sit against the rails tells clipping, current limiting, sag, crossover and protection apart.',
          start: 'Find the flat tops in the OUTPUT picture: at the rail lines, below them, or inside faint outer lines. Then tap the reading that matches.',
        },
        seeing: [
          'One picture at a time: INPUT (signal) above OUTPUT — what is this amplifier doing?, with the rail lines. Faint outer lines mean the rails have moved in.',
          'Readouts: PICTURE (which picture you’re on), SCORE (right so far) and READING (RIGHT or WRONG).',
          'Below are eight possible readings to choose from.',
        ],
        control: [
          'Tap the reading you see. You get one pick per picture, then the evidence explains it.',
          'NEXT WAVEFORM › moves on. After the last picture, REPEAT THE ROUND › starts again.',
          RUN_SLOW,
          STRIP,
        ],
        changes: [
          'Flat tops AT the rails: voltage clipping. Flat tops BELOW them, with voltage to spare: current limiting. Clipping inside faint outer lines: supply sag.',
          'A step at zero with the peaks untouched: crossover distortion. Only two levels: Class D before its filter.',
          'A flat line with input present: protection. A smooth wave below the rails is clean, and a filtered Class D output looks the same.',
        ],
        teaches: [
          'Each amplifier fault has its own shape. Read the output against the rails to tell them apart.',
          'Each shape points to a cause: crossover to bias, two levels to switching, flat tops to the supply or the load.',
          'A clean output doesn’t reveal the class: filtered Class D and a clean linear amp look alike.',
        ],
        tryThis: [
          'Before you tap, check where the flat tops sit: at the rail lines, below them, or inside faint outer lines.',
          'Finish every picture. The round ends with your score and, if some fooled you, the modules to revisit.',
        ],
      },
    },
    {
      key: 'choose',
      kind: 'read',
      guide: {
        intro: {
          learning: 'Which amplifier class suits which job, and why: the brief decides, whether it asks for efficiency, low-level linearity or one tuned frequency.',
          start: 'Read the job in 2 · CHOOSE AN AMPLIFIER and decide what the brief needs most. Then tap a class and read why it is or isn’t defensible.',
        },
        seeing: [
          '2 · CHOOSE AN AMPLIFIER: a real job on a card, with five answers: Class A, Class AB, Class D, Class C or Tube stage.',
          '3 · MYTH REVIEW: a common claim about amplifiers to judge True, False or It depends.',
        ],
        control: [
          'Tap a choice to see whether it’s defensible, and why. NEXT SCENARIO › and NEXT STATEMENT › move on.',
          'Some jobs accept more than one class. The card names the others that are also defensible.',
          STRIP,
        ],
        changes: [
          'The brief decides, not the class letter: efficiency for batteries and touring, low-level linearity for a desk monitor, one tuned frequency for radio.',
          'Each myth answer shows the correction and the detail behind it.',
        ],
        teaches: [
          'Which amplifier class suits which job, and the reasons behind the match.',
          'Why popular claims such as “Class D is digital” don’t hold.',
          'Often more than one class can do the job; the trade-offs in the brief decide.',
        ],
        tryThis: [
          'For the battery-powered portable speaker, try Class A first and read why it fails.',
          'In MYTH REVIEW, answer before you read, then compare your reasoning with the correction.',
        ],
      },
    },
    {
      key: 'challenge',
      kind: 'rack',
      guide: {
        intro: {
          learning: 'Why a whole amplifier system falls short of clean operation, and the six things to check: signal, load, connections, heat, headroom and operating mode.',
          start: 'Read FAULT and HEAT first. Then open SETUP and compare each setting with the brief, and tap SCORE THIS CONFIGURATION to see which of the six dimensions still fall short.',
        },
        seeing: [
          'INPUT (signal) and OUTPUT (to load) against the rails. A hot SOURCE arrives already flat-topped.',
          'Readouts: OUTPUT (share of full), FAULT (the main problem, or NONE), HEAT, LOAD and SCORE.',
          'Below: the brief, the fault banner, SCORE THIS CONFIGURATION and the result for six dimensions.',
        ],
        control: [
          'SOURCE, MIXER and AMP IN faders (0–100%) set the three stage levels.',
          'SETUP key: Operating mode — Stereo or Bridge; Supply condition — Healthy or Sagging (weak AC power); Speaker load (nominal) — 8, 4 or 2 Ω; Ventilation — Clear or Blocked.',
          'RUN starts or stops the playhead; ⤢ FULL SCREEN enlarges the display. SCORE THIS CONFIGURATION grades your setup as often as you like; any change clears the score.',
          STRIP,
        ],
        changes: [
          'The rig arrives misconfigured: a hot source, a 2 Ω load on a 4 Ω amplifier, and blocked vents. The vents add heat, enough to trip thermal limiting at 4 Ω.',
          'A lower SOURCE stops upstream clipping, and 8 Ω or 4 Ω meets the load rating. Bridging is no fix: each channel then sees half the impedance, a heavier load.',
          'The target: clean output between 50% and 85% of full, with no load, thermal or connection faults.',
        ],
        teaches: [
          'Why a system falls short of clean operation, and which cause to check first.',
          'The six things to check: signal, load, connections, heat, headroom and operating mode.',
          'Fixing one fault can uncover the next: correct the load, and the upstream clipping shows up.',
        ],
        tryThis: [
          'At the start FAULT reads LOAD and HEAT reads DANGER. In SETUP pick 8 Ω: FAULT turns to UP-CLIP.',
          'Lower SOURCE to 60%: FAULT reads NONE and OUTPUT 61%.',
          'In SETUP set Ventilation to Clear: HEAT drops from warm to cool. Now tap SCORE THIS CONFIGURATION.',
        ],
      },
    },
    {
      key: 'final',
      kind: 'read',
      guide: {
        intro: {
          learning: 'Whether the lab’s ideas hold together for you: bias and classes, Class D, supply limits, loads and gain structure, and which idea needs another look.',
          start: 'Answer all 12 questions in 5 · FINAL ASSESSMENT, then tap SUBMIT FINAL. Read why each answer is right, then open a NEEDS REVIEW item.',
        },
        seeing: [
          '5 · FINAL ASSESSMENT: 12 questions drawn from a larger pool. A retake draws a different set.',
          '6 · COMPLETION SUMMARY: every module (✓ when complete), the checks you answered right, NEEDS REVIEW, and your latest and best FINAL score.',
        ],
        control: [
          'Pick an answer for every item. SUBMIT FINAL unlocks once all are answered.',
          'REPEAT WITH A NEW SET › draws a fresh set. In the summary, tap a module or a ↺ review item to open that module.',
          'At the end: MARK COMPLETE › (once the final is submitted) and FINISH · SEE WHAT’S LEFT ›.',
        ],
        changes: [
          'After you submit, each item shows the right answer and why, and your score appears. 70% or more counts as a pass.',
          'Missed items join NEEDS REVIEW, each linked to the module that teaches it.',
          'Your best result is kept: a weaker retake never lowers it.',
        ],
        teaches: [
          'How the lab’s ideas connect: bias and class, supply and load limits, and gain structure, each tied to what you see on the waveform and hear in the sound.',
          'Whether those ideas hold together for you, and exactly where to look again.',
        ],
        tryThis: [
          'Answer all 12 and submit, then open one NEEDS REVIEW item to revisit its module.',
          'Tap REPEAT WITH A NEW SET › to practice with a different draw. Your best score is kept.',
        ],
      },
    },
  ],
};

/** The guide for a module's step (undefined while the module has not yet
 *  reported its steps, or for a step this file does not know). */
export function ampStepGuide(id: AmpModuleId, stepIdx: number): AmpStepGuide | undefined {
  return AMP_STEP_GUIDES[id]?.[stepIdx];
}
