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

const RUN_SLOW = 'RUN and SLOW start, stop or slow the moving playhead (with reduced motion on, one STEP ¼ key replaces them). ⤢ FULL SCREEN enlarges the display.';
const STRIP = 'The strip under the title moves between steps and modules; ‹ goes back one screen, to the lab menu.';

export const AMP_HOME_GUIDE: ScreenGuide = {
  seeing: [
    'The Amplifier Principles Lab menu. One question runs through it: what is the amplifier doing, what load does it see, and where does the extra energy come from?',
    'Your progress line, and a START or RESUME button for the next module to finish.',
    'MODULE MAP: the modules in order, ✓ on each one completed. Then CHECK YOUR UNDERSTANDING, SEE WHAT’S LEFT ›, a safety note and RESET LAB PROGRESS.',
  ],
  control: [
    'Tap a module’s name to read its one-line description; tap OPEN to start it.',
    'START or RESUME · MODULE ›: opens the module you were in, or the first one not yet complete.',
    'CHECK YOUR UNDERSTANDING: a short quiz on the whole lab.',
    'SEE WHAT’S LEFT › lists what is still to do. RESET LAB PROGRESS starts a fresh practice run: it clears your answered checks and latest final attempt, and keeps completed modules and your best final result.',
    '‹ leaves the lab. Inside a module, tap ⓘ beside its title to have that screen explained.',
  ],
  changes: [
    'Modules 1–3: what an amplifier does, the parts that control power, and bias.',
    'Modules 4–5: the classes A, B, AB and C, then Class D switching.',
    'Modules 6–8: power supplies and clipping, real-world operation, then diagnosis and the final assessment.',
    'A module is complete when you answer its checks and tap MARK COMPLETE ›; Module 8 needs the final assessment.',
  ],
  teaches: [
    'Where an amplifier’s output power comes from, what load it drives, and the trade-offs between amplifier classes.',
    'It follows Vacuum Tube Fundamentals in Audio Electronics, widening the story to transistors, transformers and switching amplifiers.',
    'Every display is a conceptual model with labeled teaching numbers, not a bench measurement. This lab teaches principles, not repair.',
  ],
  tryThis: [
    'New to amplifiers? Tap START · MODULE 1 › and work through in order — each module sets up the next.',
    'Tap a module in the MODULE MAP to read its description before you open it.',
    'Come back later and tap SEE WHAT’S LEFT › to find any module or the final still to do.',
  ],
};

export const AMP_END_GUIDE: ScreenGuide = {
  seeing: [
    'WHAT’S LEFT: the modules not yet marked complete, the Final assessment (your best score once submitted), and last the CHECK row for Check your understanding. LAB COMPLETE shows only once all are done, including a passed check.',
    'Completed items fold into one ✓ DONE row; REVIEW ▾ lists them.',
    'CHECK YOUR UNDERSTANDING: the lab menu’s quiz, here too. Passing it counts this lab toward certificates.',
  ],
  control: [
    'Tap a row to open it; the Final assessment row opens Module 8. The Check your understanding row scrolls to the check on this same screen.',
    'Answer the CHECK YOUR UNDERSTANDING questions; a wrong pick explains itself and lets you try another.',
    'PRACTICE AGAIN FROM THE START opens Module 1 — it never clears what you have done.',
    'DONE · BACK TO LABS goes back one screen: to the lab menu from a module, out of the lab from the menu.',
  ],
  changes: [
    'A module counts once it is marked complete. The final counts once your best result passes — a weaker retake never takes that away. The check counts once every answer is right, and RESET LAB PROGRESS keeps it passed.',
    'If your progress cannot be read, the title reads YOUR PROGRESS and every row stays listed and open.',
  ],
  teaches: [
    'Which parts of the lab — modules, the final or the check — are still to do.',
    'Every module can be redone for practice at any time.',
  ],
  tryThis: [
    'Open the first row on the list and work down in order.',
    'Tap REVIEW ▾ and reopen a module you found hard.',
  ],
};

export const AMP_STEP_GUIDES: Record<AmpModuleId, AmpStepGuide[]> = {
  // ── Module 1 · What an Amplifier Actually Does ──────────────────────────
  what: [
    {
      key: 'rig',
      kind: 'rack',
      guide: {
        seeing: [
          'INPUT (signal) on top, OUTPUT (to load) below. The red dashed lines are the rail limits — the furthest the supply lets the output swing.',
          'Traces are colored by size, blue near zero to red at the rails; a clipped peak is drawn heavier.',
          'Readouts: OUTPUT (CLEAN or CLIP), SUPPLY (energy drawn), HEAT, EFFIC. (illustrative efficiency) and LOAD (how hard the speaker is driven).',
        ],
        control: [
          'LEVEL fader (0–100%): the input signal. The output is 1.5 times the input, up to the rails.',
          RUN_SLOW,
          'Below the display: IN THIS MODULE, PREDICT, THEN TRY, the SIGNAL PATH figure, three kinds of gain and an APPLIED COMPARISON.',
          STRIP,
        ],
        changes: [
          'Raise LEVEL and the output grows 1.5 times as fast, until it reaches the rails. Past about 67% input the peaks flatten: clipping.',
          'SUPPLY rises with the output: the energy comes from the power supply, not from the input.',
          'Once clipped, the output stops following the input, and the flat tops carry harmonics the input never had.',
        ],
        teaches: [
          'An amplifier does not stretch your signal or create energy. It builds a bigger copy: the input steers, the supply pays.',
          'Voltage, current and power gain, and their decibel formulas; why a line output cannot drive a speaker alone.',
          'The first module. Module 2 looks at the parts that control the power.',
        ],
        tryThis: [
          'Make your prediction, then slide LEVEL past 67%: OUTPUT flips to CLIP and the peaks flatten at the rails.',
          'At 40% SUPPLY reads 57%; at 60% it reads 82% — more output, more energy drawn from the supply.',
          'In APPLIED COMPARISON tap Line out → speaker: about 0.19 W, against 25 W through the power amp.',
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
        seeing: [
          'A power path: the SUPPLY (a DC source), the active device and a loudspeaker LOAD, with a return wire closing the loop. The control input enters from the top.',
          'Wire thickness and the CONTROLLED CURRENT bar show how much current flows.',
          'Readouts: REGION (OFF, CONTROL or FULL), CURRENT (share of full) and DEVICE.',
        ],
        control: [
          'CONTROL fader (0–100%): the small control signal.',
          'DEVICE key: Generic, BJT, MOSFET or Tube — the drawing changes to that device’s symbol and terminal names.',
          '⤢ FULL SCREEN enlarges the drawing.',
          STRIP,
        ],
        changes: [
          'Below 15% the device is OFF: no current. Then current follows the control — the useful region. Above 85% it is FULLY DRIVEN: more control changes nothing.',
          'The energy always comes from the supply; the device only controls how much reaches the load.',
          'Terminal names differ: BJT base, collector, emitter; MOSFET gate, drain, source; tube control grid, plate, cathode.',
        ],
        teaches: [
          'What an active device does: a small control steers a large flow of supply current.',
          'Transistors and tubes do the same job with different control and very different circuit needs.',
          'The transformer step comes next.',
        ],
        tryThis: [
          'Slide CONTROL to 50%: CURRENT reads 50%. At 90% it reads 100% and REGION reads FULL.',
          'Slide below 15%: REGION reads OFF and CURRENT reads 0%.',
          'Switch DEVICE between BJT, MOSFET and Tube and read how each names its control terminal.',
        ],
      },
    },
    {
      key: 'xfmr',
      kind: 'rack',
      guide: {
        seeing: [
          'A transformer: PRIMARY · Np and SECONDARY · Ns windings on a laminated steel CORE, with the changing magnetic field looping around it.',
          'The input wave sits at the left; the output wave at the right grows or shrinks with the turns ratio.',
          'Readouts: KIND, RATIO (Np to Ns), Vs and Is — the secondary’s volts and amps for 120 V and 1 A on the primary.',
        ],
        control: [
          'Np and Ns faders: 100 to 1000 turns, in steps of 50.',
          '⤢ FULL SCREEN enlarges the drawing.',
          STRIP,
        ],
        changes: [
          'Vs = Vp × Ns ÷ Np: more secondary turns, more output voltage.',
          'Current goes the other way: step the voltage up and the available current steps down by the same ratio, so power out never exceeds power in.',
          'Impedance scales by the ratio squared — how a tube output transformer lets a high-voltage stage drive an 8 Ω speaker.',
        ],
        teaches: [
          'A transformer trades voltage for current and adds no power; real ones lose a little.',
          'Where transformers earn their keep: power supplies, tube outputs, 70 V and 100 V speaker lines, isolation.',
          'Module 3 comes next: bias, conduction and push-pull.',
        ],
        tryThis: [
          'At the start (Np 400, Ns 200) KIND reads STEP-DOWN, RATIO 2.00:1, Vs 60.0 V and Is 2.00 A.',
          'Raise Ns to 800: KIND flips to STEP-UP, Vs reads 240.0 V and Is 0.50 A — still 120 W.',
          'Set Ns equal to Np: KIND reads 1:1 ISOLATION and Vs 120.0 V.',
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
        seeing: [
          'One device: INPUT (signal) on top, DEVICE CURRENT (gold) — 0 to full conduction only — in the middle, OUTPUT (to load) below.',
          'Readouts: REGION (CUTOFF, LINEAR or SATUR.), IDLE (current with no signal), SUPPLY and HEAT.',
          'Below: the region in words — TOO LITTLE BIAS, APPROPRIATE LINEAR BIAS or EXCESSIVE BIAS — and what it costs.',
        ],
        control: [
          'BIAS fader (0–100%): the device’s operating point, where it sits with no signal.',
          RUN_SLOW,
          STRIP,
        ],
        changes: [
          'The signal swings the current around the bias point, but the device can only pass between zero and full current.',
          'Below 25%: the bottom of the swing would need less than zero current, so it is cut off — CUTOFF. Idle current and heat are low.',
          'Above 75%: the top runs out of room and flattens — saturation — with high idle current and heat. In between, the whole swing fits: LINEAR.',
        ],
        teaches: [
          'The three ideas behind the amplifier classes: bias, conduction angle and push-pull.',
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
        seeing: [
          'One cycle of INPUT (signal) and the DEVICE CURRENT, which flows only for the chosen part of the 360° cycle.',
          'Readouts: ANGLE, CLASS (the class that angle belongs to), SUPPLY and HEAT.',
        ],
        control: [
          'ANGLE key: 90° · C, 180° · B, 270° · AB or 360° · A.',
          RUN_SLOW,
          STRIP,
        ],
        changes: [
          '360°: the device never switches off — Class A, with the most idle heat.',
          '180°: only the positive half. Paired with a second device for the other half, that is Class B.',
          '270°: past the zero crossing into the other half; two such devices overlap — Class AB. 90°: short pulses near the peak — Class C.',
          'SUPPLY and HEAT fall with the angle: less time conducting, less energy drawn.',
        ],
        teaches: [
          'Conduction angle: how much of each cycle a device passes current — one way to tell the classes apart.',
          'Class D does not fit this measure: it switches, and Module 5 covers it.',
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
        seeing: [
          'Two devices: INPUT (signal), DEVICE CURRENTS (+ gold solid · − purple dashed) and OUTPUT (to load).',
          'Readouts: HANDOFF (NOTCH, CLEAN or OVERBIAS), IDLE, SUPPLY and HEAT.',
          'Below: YOUR TASK, and the ZERO CROSS figure — the output around zero, magnified ×3.2.',
        ],
        control: [
          'BIAS fader (0–100%): the output stage’s bias, which sets how much the two devices overlap.',
          RUN_SLOW,
          'The ZERO CROSS figure has its own full-screen view with the same bias control.',
          STRIP,
        ],
        changes: [
          'With little bias each device waits for the signal to pass its threshold, so nothing handles the region around zero: a flat step, crossover distortion.',
          'More bias makes both devices conduct around zero; from 44% the notch is gone.',
          'Bias also raises idle current and the supply it draws. From 84% HANDOFF reads OVERBIAS and IDLE turns gold at 8.1%, just past the 8% ceiling that YOUR TASK sets.',
        ],
        teaches: [
          'How two push-pull devices share a waveform, and where crossover distortion comes from.',
          'Why the notch matters most at low levels, where it is a large part of the signal.',
          'The Class AB idea: just enough bias to close the gap. Module 4 compares the classes side by side.',
        ],
        tryThis: [
          'At the start (10%) HANDOFF reads NOTCH: open ZERO CROSS and find the flat step.',
          'Raise BIAS to 44%: HANDOFF reads CLEAN, with IDLE at 4.2%.',
          'Keep going to 90%: HANDOFF reads OVERBIAS — the notch stays gone, and only cost is added: SUPPLY climbs from 63% to 76% as idle current rises.',
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
        seeing: [
          'The rig for the chosen class: INPUT, DEVICE CURRENT(S) and OUTPUT. In Class C the output shows the raw pulses, dashed = after the tuned circuit.',
          'Readouts: CONDUCT. (degrees each device conducts), IDLE (current with no signal), EFFIC. (illustrative, at this level), HEAT and DISTORT.',
          'Below: the same numbers explained, a ZERO CROSS zoom for B and AB, and SIDE BY SIDE fact cards for A, B, AB, C and D.',
        ],
        control: [
          'CLASS key: Class A, B, AB or C. The tray stays open so you can compare while the display reacts.',
          'LEVEL fader: the input level. With Class A’s SIGNAL off it locks.',
          'The class’s own control: SIGNAL (A — switches the input off), AB BIAS (AB, 0–100%) or TUNE (C, 0.50× to 2×; 1.00× is tuned).',
          'RUN and SLOW; ⤢ FULL SCREEN. Tap a fact card to open all eight rows.',
          STRIP,
        ],
        changes: [
          'A: one device conducts all 360°; with no signal IDLE stays 100%, HEAT hot: low efficiency.',
          'B: each device ideally conducts half the cycle (180°); CONDUCT. reads 165° as each needs a small turn-on voltage. That gap is the NOTCH. IDLE 0%, efficiency higher.',
          'AB: more AB BIAS overlaps the devices past zero: the notch closes, idle rises.',
          'C: pulses ring a tuned circuit into a sine, only near its tuned frequency.',
        ],
        teaches: [
          'Each class trades efficiency, heat and distortion — there is no “best”.',
          'Why AB is the workhorse of analog power amplifiers, and why Class C is for radio, not audio.',
          'Efficiency figures are theoretical maxima or illustrative, never guaranteed. Module 5 is Class D.',
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
        seeing: [
          'INPUT: the audio wave against a much faster triangle carrier (amber dashed). OUTPUT: what the VIEW key picks.',
          'Readouts: AT TROUGH and AT PEAK (how much of each switching period the output is switched to the + rail), EFFIC., HEAT, and LOAD once VIEW reads AUDIO (Recovered audio).',
          'The switching is slowed for the picture; real carriers run at hundreds of kilohertz.',
        ],
        control: [
          'LEVEL fader (0–95%): the audio level.',
          'VIEW key: Raw switching, Filter action or Recovered audio. The tray stays open while the display reacts.',
          RUN_SLOW,
          'Below the display: the CLASS D signal-path figure.',
          STRIP,
        ],
        changes: [
          'Where the audio is above the carrier the switch goes high; below, low. Only two levels exist — the audio lives in the pulse widths.',
          'Louder audio swings the widths further: AT PEAK rises as AT TROUGH falls. Silence sits at 50% for both.',
          'The output filter averages the pulses; that short-term average follows the audio and is what reaches the loudspeaker.',
        ],
        teaches: [
          'How a switching amplifier turns audio into pulses and filters it back: pulse-width modulation.',
          'Class D is not digital and not a bigger Class C: its output is analog audio recovered by a filter.',
          'The switching stage, and where the energy goes, come next.',
        ],
        tryThis: [
          'At the start (70%) AT TROUGH reads 15% and AT PEAK 85%. Drop LEVEL to 10%: 45% and 55% — close to silence.',
          'Switch VIEW to Filter action and watch the smooth filter output ride the pulses.',
          'Switch VIEW to Recovered audio: the wave the speaker gets — and the LOAD readout appears.',
        ],
      },
    },
    {
      key: 'bridge',
      kind: 'rack',
      guide: {
        seeing: [
          'A half-bridge: +RAIL and −RAIL, a HIGH SIDE and a LOW SIDE device meeting at the switching node, then L and C (the output filter) and the LOAD speaker, returning to 0 V.',
          'One switching period is drawn over the node wire; its high part is the high side’s share at the peak.',
          'Readouts: AT PEAK, TO LOAD (share of supply power reaching the speaker) and AS HEAT (share lost).',
        ],
        control: [
          'LEVEL fader (0–95%): the same audio level as the previous step.',
          '⤢ FULL SCREEN enlarges the drawing. Below: DEAD TIME, and WHERE THE ENERGY GOES — a loss breakdown at this level.',
          STRIP,
        ],
        changes: [
          'The high side ties the node to +rail, the low side to −rail — never both at once, or the rails would short through them.',
          'Higher LEVEL widens the high side’s on-time at the peak, so AT PEAK rises.',
          'At low level the fixed losses are most of what the supply pays for, so TO LOAD falls and AS HEAT rises.',
        ],
        teaches: [
          'Why Class D runs cool but never at 100%: real switches have resistance, take time to switch and need gate drive; the filter loses a little too.',
          'Efficiency drops at low output.',
          'Module 6 comes next: power supplies, limits and clipping.',
        ],
        tryThis: [
          'At 70% TO LOAD reads 83% and AS HEAT 17%. Drop LEVEL to 10%: 56% and 44%.',
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
        seeing: [
          'INPUT (signal) and OUTPUT (to load) against red dashed working rails; faint outer lines are the idle rails once they sag. Current limiting adds a gold dashed ceiling.',
          'Readouts: STATE (CLEAN, V-CLIP, I-LIMIT or PROTECT), RAILS, OUTPUT (volts rms), CURRENT (amps rms) and POWER (watts).',
          'A teaching example: ±40 V rails, a 9 A current limit, 13 A protection.',
        ],
        control: [
          'LEVEL fader: the drive. RAIL fader: the nominal rails, ±12 V to ±40 V.',
          'LOAD key: 8 Ω, 4 Ω or 2 Ω. SUPPLY key: Linear supply or Switch-mode supply.',
          'RUN starts or stops the playhead. ⤢ FULL SCREEN enlarges the display. Below: the supply chain for your SUPPLY choice.',
          STRIP,
        ],
        changes: [
          'Too much drive into 8 Ω: the peaks flatten at the rails — voltage clipping.',
          'Current sags a linear supply’s rails, so clipping starts below the nominal figure; a switch-mode supply holds up better.',
          'Into 2 Ω the output stage hits its 9 A limit before the rails: the peaks flatten below them. Past 13 A of demand, protection mutes the output.',
        ],
        teaches: [
          'Every amplifier runs out of voltage or current somewhere, and each limit looks different on the waveform.',
          'Lower impedance draws more current for the same voltage: I = V ÷ R, P = Vrms² ÷ R.',
          'Clipping is not harmless, and amplifiers hold lethal voltage. Module 7 puts this to work.',
        ],
        tryThis: [
          'At 8 Ω raise LEVEL: STATE turns V-CLIP at 75%, with RAILS sagged to ±37 V.',
          'Switch LOAD to 2 Ω: I-LIMIT from 51%, with CURRENT held at 9.0 A, and PROTECT from 74%.',
          'Back at 8 Ω, pick Switch-mode supply: clipping now starts at 79%.',
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
        seeing: [
          'The chain: SOURCE → MIXER / DSP → AMP INPUT → AMP OUTPUT (rails) → SPEAKER. Meters under SOURCE, MIXER / DSP and AMP OUTPUT read % of clip.',
          'A meter is green when healthy, gold when starved (too low), red at CLIPPING.',
          'Readouts: VERDICT (HEALTHY, STARVED or the first stage to clip) and the SOURCE, MIXER and AMP IN settings.',
        ],
        control: [
          'SOURCE, MIXER and AMP IN faders (0–100%): each stage’s level.',
          '⤢ FULL SCREEN enlarges the chain. Below: the safety list, the verdict in words, and a myth.',
          STRIP,
        ],
        changes: [
          'Each stage multiplies what it receives and cannot pass more than its own clip point.',
          'Distortion starts at the FIRST stage to clip, and nothing after it can undo that; turning the amp down only makes quieter distortion.',
          'A stage sending almost nothing makes the next one add gain — and noise. AMP IN sets input sensitivity, not how many watts the amp has.',
        ],
        teaches: [
          'Gain structure: every stage at a healthy level, with headroom for peaks.',
          'The upstream-clipping trap: harsh sound while the amp’s CLIP light stays dark.',
          'The safety list for real equipment: lethal voltage, stored charge, never short or tie outputs together.',
        ],
        tryThis: [
          'At the start (all 50%) the meters read 80%, 64% and 51% of clip — VERDICT HEALTHY.',
          'Raise SOURCE to 63%: VERDICT reads CLIP:SRC. Now lower AMP IN — the verdict stays.',
          'With SOURCE back at 50%, push AMP IN to 98%: VERDICT reads CLIP:OUT — the output reaches its rails.',
        ],
      },
    },
    {
      key: 'practice',
      kind: 'read',
      guide: {
        seeing: [
          'A page of worked tools: the speaker-load builder, power and current, bridged operation, watts and loudness, clipping risk, a rack inspection and a specification decoder.',
          'All figures are resistive teaching examples; a real speaker’s impedance changes with frequency.',
        ],
        control: [
          'Load builder: Parallel or Series; + 16 Ω, + 8 Ω or + 4 Ω adds a cabinet (up to four); CLEAR starts again.',
          'Power: 8 Ω, 4 Ω or 2 Ω at 28.3 Vrms. Bridge: Stereo or Bridge mode, then an 8 Ω or 4 Ω bridged load.',
          'Watts: slide the Power ratio P2 ÷ P1 from 0.25× to 10×.',
          'Inspection: pick a Rack, then the finding you see. Decoder: pick a Sheet, check what is missing, tap CHECK.',
          'At the end: CHECK YOURSELF questions, the TAKEAWAY and MARK COMPLETE ›.',
        ],
        changes: [
          'Parallel cabinets lower the total impedance; series raise it. Below the amp’s 4 Ω minimum, expect protection, limiting or heat.',
          'Halve the load and the current doubles at the same voltage. Bridging doubles the voltage, but each channel sees half the load.',
          'Twice the power is only about +3 dB; roughly ten times the power sounds about twice as loud.',
        ],
        teaches: [
          'How speaker loads, bridge mode and power ratings work, the way working engineers read them.',
          'A power rating means little without its test conditions — and some racks are fine and best left alone.',
          'Module 8 puts it all to work.',
        ],
        tryThis: [
          'Two 8 Ω in parallel read Ztotal ≈ 4.00 Ω, within the minimum. Tap + 8 Ω: 2.67 Ω, and the warning appears.',
          'In POWER AND CURRENT pick 4 Ω: 7.08 A and 200 W, against 3.54 A and 100 W at 8 Ω.',
          'The power ratio starts at 2.00×: the formula reads +3.01 dB. Slide it to the top, 10.00×: +10.00 dB — about twice as loud.',
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
        seeing: [
          'One picture at a time: INPUT (signal) above OUTPUT — what is this amplifier doing?, with the rail lines. Faint outer lines mean the rails have moved in.',
          'Readouts: PICTURE (which picture you are on), SCORE (right so far) and READING (RIGHT or WRONG).',
          'Below: eight possible readings to choose from.',
        ],
        control: [
          'Tap the reading you see. One pick per picture; the evidence then explains it.',
          'NEXT WAVEFORM › moves on; after the last picture, REPEAT THE ROUND › starts again.',
          RUN_SLOW,
          STRIP,
        ],
        changes: [
          'Flat tops AT the rails: voltage clipping. Flat tops BELOW them, with voltage to spare: current limiting. Clipping inside faint outer lines: supply sag.',
          'A step at zero with the peaks untouched: crossover distortion. Only two levels: Class D before its filter.',
          'A flat line with input present: protection. A smooth wave below the rails: clean — a filtered Class D output looks the same.',
        ],
        teaches: [
          'What each amplifier fault looks like: the output’s shape against the rails.',
          'It draws on Modules 3, 5 and 6. Choosing an amplifier and the myth review come next.',
        ],
        tryThis: [
          'Before you tap, check where the flat tops sit: at the rail lines, below them, or inside faint outer lines.',
          'Finish every picture: the round ends with your score and, if some fooled you, the modules to revisit.',
        ],
      },
    },
    {
      key: 'choose',
      kind: 'read',
      guide: {
        seeing: [
          '2 · CHOOSE AN AMPLIFIER: a real job in a card, with five answers — Class A, Class AB, Class D, Class C or Tube stage.',
          '3 · MYTH REVIEW: a common statement about amplifiers to judge True, False or It depends.',
        ],
        control: [
          'Tap a choice to see whether it is defensible, and why. NEXT SCENARIO › and NEXT STATEMENT › move on.',
          'Some jobs accept more than one class; the card names the others that are also defensible.',
          STRIP,
        ],
        changes: [
          'The brief decides, not the class letter: efficiency for batteries and touring, low-level linearity for a desk monitor, one tuned frequency for radio.',
          'Each myth answer shows the correction and the detail behind it.',
        ],
        teaches: [
          'Which amplifier class suits which job, and the reasons behind the match.',
          'Why popular claims such as “Class D is digital” do not hold.',
          'The system challenge comes next.',
        ],
        tryThis: [
          'For the battery-powered portable speaker, try Class A first and read why it fails.',
          'In MYTH REVIEW, answer before reading — then compare your reasoning with the correction.',
        ],
      },
    },
    {
      key: 'challenge',
      kind: 'rack',
      guide: {
        seeing: [
          'INPUT (signal) and OUTPUT (to load) against the rails. A hot SOURCE arrives already flat-topped.',
          'Readouts: OUTPUT (share of full), FAULT (the main problem, or NONE), HEAT, LOAD and SCORE.',
          'Below: the brief, the fault banner, SCORE THIS CONFIGURATION and the result for six dimensions.',
        ],
        control: [
          'SOURCE, MIXER and AMP IN faders (0–100%): the three stage levels.',
          'SETUP key: Operating mode — Stereo or Bridge; Supply condition — Healthy or Sagging (weak AC power); Speaker load (nominal) — 8, 4 or 2 Ω; Ventilation — Clear or Blocked.',
          'RUN; ⤢ FULL SCREEN. SCORE THIS CONFIGURATION grades it as often as you like; any change clears the score.',
          STRIP,
        ],
        changes: [
          'The rig arrives misconfigured: a hot source, a 2 Ω load on a 4 Ω amplifier and blocked vents, which add heat — enough to trip thermal limiting at 4 Ω.',
          'A lower SOURCE stops upstream clipping; 8 Ω or 4 Ω meets the load rating. Bridging is no fix: each channel then sees half the impedance, a heavier load.',
          'The target is a clean output between 50% and 85% of full, with no load, thermal or connection faults.',
        ],
        teaches: [
          'Why a system falls short of clean operation, and which cause to check first.',
          'The six things to check: signal, load, connections, heat, headroom and operating mode.',
          'The final assessment comes next.',
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
        seeing: [
          '5 · FINAL ASSESSMENT: 12 questions drawn from a larger pool — a retake draws a different set.',
          '6 · COMPLETION SUMMARY: every module (✓ when complete), the checks you answered right, NEEDS REVIEW, and your latest and best FINAL score.',
        ],
        control: [
          'Pick an answer for every item; SUBMIT FINAL unlocks once all are answered.',
          'REPEAT WITH A NEW SET › draws a fresh set. In the summary, tap a module or a ↺ review item to open that module.',
          'At the end: MARK COMPLETE › (once the final is submitted) and FINISH · SEE WHAT’S LEFT ›.',
        ],
        changes: [
          'After you submit, each item shows the right answer and why, and your score appears; 70% or more counts as a pass.',
          'Missed items join NEEDS REVIEW, each linked to the module that teaches it.',
          'Your best result is kept: a weaker retake never lowers it.',
        ],
        teaches: [
          'Whether the lab’s ideas hold together for you — and exactly where to look again.',
          'The last step of the lab; FINISH · SEE WHAT’S LEFT › shows anything still to do.',
        ],
        tryThis: [
          'Answer all 12 and submit, then open one NEEDS REVIEW item to revisit its module.',
          'Tap REPEAT WITH A NEW SET › to practice with a different draw — your best score is kept.',
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
