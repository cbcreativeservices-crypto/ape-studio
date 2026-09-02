/**
 * ampContent — the Amplifier Principles Lab's structured learner-facing
 * content (build spec Part 2 + Part 3 §9): module definitions, misconception
 * records, knowledge checks, and scenario data. Stable ids everywhere —
 * visible titles are never storage keys.
 *
 * ALL COPY NEW — owner review.
 */
import type { FaultId } from './ampModel';

export type AmpModuleId =
  | 'what' | 'devices' | 'bias' | 'classes' | 'classd'
  | 'supply' | 'realworld' | 'apply';

export type AmpModuleDef = {
  id: AmpModuleId;
  num: number;
  title: string;
  blurb: string;
  objective: string;
  takeaway: string;
};

export const AMP_MODULES: AmpModuleDef[] = [
  {
    id: 'what', num: 1, title: 'What an Amplifier Actually Does',
    blurb: 'Signal flow, energy flow, gain — and where the extra power really comes from.',
    objective: 'Explain that an amplifier uses power-supply energy, shaped by the input signal.',
    takeaway: 'A small input signal controls a larger flow of energy from the amplifier’s power supply.',
  },
  {
    id: 'devices', num: 2, title: 'Transistors, Tubes, and Transformers',
    blurb: 'The active device that controls power vs the transformer that trades voltage for current.',
    objective: 'Distinguish an active control device from a transformer.',
    takeaway: 'A transistor or tube can actively control power. A transformer changes voltage, current, isolation, or impedance relationships without creating power.',
  },
  {
    id: 'bias', num: 3, title: 'Bias, Conduction, and Push-Pull',
    blurb: 'Operating point, conduction angle, device handoff — the setup for the classes.',
    objective: 'Explain bias, conduction angle, push-pull handoff, and crossover distortion.',
    takeaway: 'Bias determines how the active devices begin operating, and conduction overlap determines what happens when one device hands the waveform to another.',
  },
  {
    id: 'classes', num: 4, title: 'Amplifier Class Explorer',
    blurb: 'A, B, AB, and C on the same signal, load, and layout — no “best,” just trade-offs.',
    objective: 'Compare Class A, B, AB, and C operation on identical terms.',
    takeaway: 'Each class is an operating arrangement with its own conduction, idle power, heat, and distortion trade — not a quality ranking.',
  },
  {
    id: 'classd', num: 5, title: 'Inside Class D',
    blurb: 'Modulation, switching, filtering — and why Class D is not automatically “digital.”',
    objective: 'Trace audio through modulation, switching, and reconstruction.',
    takeaway: 'Class D encodes the audio into a switching process and recovers the audio at the load with high potential efficiency.',
  },
  {
    id: 'supply', num: 6, title: 'Power Supplies, Limits, and Clipping',
    blurb: 'Rails, sag, and why every amplifier runs out of voltage somewhere.',
    objective: 'Connect output capability to the power supply and the rails.',
    takeaway: 'The power supply and output stage establish the voltage, current, heat, and sustained-power limits of the amplifier.',
  },
  {
    id: 'realworld', num: 7, title: 'Real-World Amplifier Operation',
    blurb: 'Gain structure, speaker loads, bridge mode, cooling, cabling, and reading a spec sheet.',
    objective: 'Operate an amplifier-and-speaker system with sound practice.',
    takeaway: 'Most amplifier trouble is operating trouble: gain structure, load, connections, and cooling decide what the circuit can safely deliver.',
  },
  {
    id: 'apply', num: 8, title: 'Diagnose and Apply',
    blurb: 'Read waveforms, bust myths, choose amplifiers, and pass the final check.',
    objective: 'Apply the principles to diagnosis, selection, and safe system setup.',
    takeaway: 'You can now read what an amplifier is doing — from its waveform, its load, and where its energy is going.',
  },
];

export const ampModuleById = (id: AmpModuleId) => AMP_MODULES.find((m) => m.id === id)!;

/* ── misconceptions (Part 3 §9 — all sixteen required records) ──────────── */

export type Misconception = {
  id: string;
  statement: string;
  verdict: 'false' | 'depends';
  correction: string;
  detail: string;
  moduleId: AmpModuleId;
  safety?: boolean;
};

export const MISCONCEPTIONS: Misconception[] = [
  {
    id: 'd-is-digital', moduleId: 'classd', verdict: 'false',
    statement: 'Class D means digital.',
    correction: 'The D is just the next letter — Class D is a switching topology, usually driven by analog modulation.',
    detail: 'It is appealing because switching waveforms look binary. But a classic Class D amplifier compares the analog audio with a carrier and switches accordingly — no sampling, no numbers. Some products add digital control, which is an implementation choice, not the class definition.',
  },
  {
    id: 'a-sounds-best', moduleId: 'classes', verdict: 'false',
    statement: 'Class A always sounds best.',
    correction: 'Class alone does not determine sound quality — the complete design does.',
    detail: 'Class A avoids crossover handoff, which is one distortion mechanism among many. Power supply, feedback, layout, thermal design, load behavior, and output filtering all shape the result. Excellent and poor amplifiers exist in every class.',
  },
  {
    id: 'ab-is-half', moduleId: 'classes', verdict: 'false',
    statement: 'Class AB is simply half Class A and half Class B.',
    correction: 'Class AB is defined by overlapping conduction: each device conducts a bit more than half the cycle.',
    detail: 'The letters suggest an average, but AB is its own arrangement — push-pull devices biased just far enough that both conduct around zero crossing. That overlap is what removes the Class B notch, at the cost of some idle current.',
  },
  {
    id: 'watts-loudness', moduleId: 'realworld', verdict: 'false',
    statement: 'Twice the amplifier power means twice the loudness.',
    correction: 'Twice the power is about +3 dB — a clearly audible step, but far from “twice as loud.”',
    detail: 'Level scales with 10·log10(P2/P1), so ×2 power ≈ +3 dB and ×10 power = +10 dB. Perceived loudness also depends on speaker sensitivity, distance, frequency content, and the room.',
  },
  {
    id: 'gain-sets-watts', moduleId: 'realworld', verdict: 'false',
    statement: 'The amplifier gain control directly controls its available wattage.',
    correction: 'The front-panel control sets input sensitivity/attenuation. The maximum output is set by the design and its supply.',
    detail: 'Turning the knob down means a hotter input is needed to reach full output — it does not shrink the amplifier. Gain structure decides which stage clips first, not how many watts exist.',
  },
  {
    id: 'always-8-ohms', moduleId: 'realworld', verdict: 'false',
    statement: 'An 8-ohm loudspeaker is exactly 8 ohms at every frequency.',
    correction: '“8 ohms” is a nominal figure — real impedance swings with frequency, often widely.',
    detail: 'A real driver has resonance peaks and reactive regions; the impedance curve can dip well below and rise far above nominal. That is why amplifier minimum-load ratings and speaker impedance curves both matter.',
  },
  {
    id: 'watt-match', moduleId: 'realworld', verdict: 'false',
    statement: 'Amplifier and speaker wattage must match exactly.',
    correction: 'Ratings guide sensible pairing; exact matching neither exists as a rule nor guarantees safety.',
    detail: 'What matters is how the system is operated: program material, headroom, clipping, limiting, and duration. A “matched” pair driven hard into clipping is riskier than a sensible mismatch operated cleanly.',
  },
  {
    id: 'small-amp-safe', moduleId: 'realworld', verdict: 'false', safety: true,
    statement: 'A lower-powered amplifier is automatically safe for a loudspeaker.',
    correction: 'An underpowered amplifier driven into hard clipping can still overheat drivers.',
    detail: 'Risk depends on the actual signal: sustained clipping raises average power and adds harmonic energy that can stress tweeters. Ratings, program, duration, and protection all matter — not the wattage number alone.',
  },
  {
    id: 'clip-harmless', moduleId: 'supply', verdict: 'false', safety: true,
    statement: 'Clipping is harmless if the amplifier is small.',
    correction: 'Severe clipping raises average energy and harmonic content regardless of amplifier size.',
    detail: 'A clipped waveform spends more time near maximum level and adds high-frequency harmonics. Small amplifiers clip earlier, so they can spend more of their life clipping. Duration and driver limits decide the damage.',
  },
  {
    id: 'transformer-power', moduleId: 'devices', verdict: 'false',
    statement: 'A transformer creates additional power.',
    correction: 'An ideal transformer trades voltage for current — output power never exceeds input power.',
    detail: 'Step the voltage up and the available current steps down by the same ratio (real parts add losses on top). Amplification requires an active device spending power-supply energy; a transformer only transforms.',
  },
  {
    id: 'd-no-heat', moduleId: 'classd', verdict: 'false',
    statement: 'Class D amplifiers do not produce heat.',
    correction: 'Class D reduces loss; it does not eliminate it.',
    detail: 'Conduction resistance, switching transitions, gate drive, and the output filter all dissipate power. High-power Class D amplifiers still need real cooling — and efficiency drops at low output levels.',
  },
  {
    id: 'lower-z-better', moduleId: 'realworld', verdict: 'false', safety: true,
    statement: 'Lower speaker impedance always produces better performance.',
    correction: 'Lower impedance demands more current and heat from the amplifier; below its rating it invites protection or damage.',
    detail: 'More current can mean more power — until the supply sags, the output stage current-limits, or thermal protection engages. Use the loads the amplifier is rated for.',
  },
  {
    id: 'common-ground', moduleId: 'realworld', verdict: 'false', safety: true,
    statement: 'All negative speaker terminals are common ground.',
    correction: 'Never assume output negatives are common — bridged and some other topologies drive both terminals.',
    detail: 'On bridged outputs and several amplifier designs, the “negative” terminal carries signal. Tying negatives together can short output stages. Follow the manufacturer’s wiring exactly.',
  },
  {
    // NEW COPY — was "always produces exactly four times": with "always/exactly"
    // in the statement the honest verdict is FALSE, yet the record said IT
    // DEPENDS, so the myth review punished a correct reading. Statement now
    // carries the claim people actually make; "it depends" is then fair.
    id: 'bridge-4x', moduleId: 'realworld', verdict: 'depends',
    statement: 'Bridging gives you four times the power.',
    correction: 'Four times is the ideal ceiling — real bridging is limited by current, thermal, and supply capability.',
    detail: 'Bridging can double the voltage across the load, which implies ×4 power into the same impedance — IF each channel can drive what looks like half that load. Many amplifiers cannot, which is why bridged minimum-load ratings exist.',
  },
  {
    id: 'reset-protect', moduleId: 'realworld', verdict: 'false', safety: true,
    statement: 'A protection light should simply be reset until it clears.',
    correction: 'Protection is information: find the cause before restoring power.',
    detail: 'Protection circuits report faults — shorts, DC, heat, overcurrent. Repeatedly resetting without correcting the cause stresses the amplifier and can convert a recoverable fault into a failure.',
  },
  {
    id: 'peak-continuous', moduleId: 'realworld', verdict: 'false',
    statement: 'Peak and continuous power ratings are directly interchangeable.',
    correction: 'A rating means little without its test conditions — load, bandwidth, distortion, duration, channels driven.',
    detail: '“Peak,” “max,” “music power,” and “PMPO” describe short or generous conditions. Compare continuous ratings taken under stated conditions; treat unconditioned numbers as marketing.',
  },
];

export const misconceptionById = (id: string) => MISCONCEPTIONS.find((m) => m.id === id)!;

/* ── knowledge checks (module-end, instructional) ───────────────────────── */

export type AmpCheck = {
  id: string;
  moduleId: AmpModuleId;
  q: string;
  options: string[];
  correct: number;
  explain: string;
  /** Used by the final assessment pool. */
  scored?: boolean;
  /** Options are an ordered scale (e.g. 16/8/4/2 Ω) — deal them in authored
   *  order; every other check is presentation-shuffled by the UI. */
  keepOrder?: boolean;
};

// NEW COPY (design pass 2026-09-02): distractors lengthened/qualified so the
// correct option is no longer the longest by default (17 of 25 correct answers
// also sat at index 1 — the UI now shuffles by presentation and judges by the
// authored index). Question stems, correct options and explanations unchanged.
export const AMP_CHECKS: AmpCheck[] = [
  // Module 1
  {
    id: 'w-energy', moduleId: 'what', scored: true,
    q: 'Where does the energy in an amplifier’s output actually come from?',
    options: ['The input signal itself, made larger', 'The power supply, controlled by the input', 'The loudspeaker’s magnet, pulling current', 'The gain control, as it is turned up'],
    correct: 1,
    explain: 'The input signal only steers. The output stage delivers power-supply energy to the load in a form the input controls — that is what “amplify” means here.',
  },
  {
    id: 'w-lineout', moduleId: 'what', scored: true,
    q: 'Why can’t a line output drive a passive loudspeaker properly?',
    options: ['Its voltage has the wrong waveform shape for a cone', 'Line level is a digital format a speaker cannot decode', 'It cannot supply the current and power the speaker needs', 'Speakers only accept signals with amplified impedance'],
    correct: 2,
    explain: 'A line output is built to feed high-impedance inputs with tiny current. A loudspeaker needs real current and watts — the power amplifier’s job.',
  },
  {
    id: 'w-gains', moduleId: 'what',
    q: 'An amplifier turns 0.1 V into 10 V at its output. Its voltage gain is…',
    options: ['10', '100', '0.01', '20'],
    correct: 1,
    explain: 'Av = Vout/Vin = 10 ÷ 0.1 = 100. In decibels that is 20·log10(100) = 40 dB.',
  },
  // Module 2
  {
    id: 'd-active', moduleId: 'devices', scored: true,
    q: 'What makes a transistor an ACTIVE device in an amplifier?',
    options: ['It stores energy in a magnetic field between cycles', 'A small control signal regulates a larger supply-fed current', 'It converts watts directly into higher volts', 'It isolates two circuits from each other electrically'],
    correct: 1,
    explain: 'The transistor sits in the power path and lets the small base/gate signal control how much supply current flows to the load — control, not creation.',
  },
  {
    id: 'd-xfmr', moduleId: 'devices', scored: true,
    q: 'A transformer steps voltage up 1:2. What happens to the ideal available current?',
    options: ['It doubles too', 'It stays the same', 'It halves', 'It becomes DC'],
    correct: 2,
    explain: 'Ideal transformers conserve power: double the voltage means half the available current. Vp/Vs = Np/Ns, and power out never exceeds power in.',
  },
  {
    id: 'd-70v', moduleId: 'devices',
    q: 'Why do 70 V / 100 V distributed audio systems use transformers at each speaker?',
    options: ['To create extra watts locally at each speaker', 'To step the distribution voltage down and set each speaker’s power tap', 'To convert the audio to radio frequency for the long run', 'To ground the line at every speaker position'],
    correct: 1,
    explain: 'The line runs at high voltage/low current so long runs lose little power; each speaker’s transformer taps down to the level that speaker should draw.',
  },
  // Module 3
  {
    id: 'b-notch', moduleId: 'bias', scored: true,
    q: 'Crossover distortion appears…',
    options: ['At the waveform peaks, where the rails are', 'Around the zero crossing, during device handoff', 'Only at low frequencies, below about 100 Hz', 'Only in Class A output stages'],
    correct: 1,
    explain: 'The notch happens where one output device stops conducting before the other fully takes over — right at zero crossing. Bias overlap is the cure, at the price of idle current.',
  },
  {
    id: 'b-conduction', moduleId: 'bias', scored: true,
    q: 'A device that conducts for the complete 360° of the waveform is operating in…',
    options: ['Class B', 'Class C', 'Class A', 'Class D'],
    correct: 2,
    explain: 'Full-cycle conduction is the Class A arrangement. 180° is the Class B ideal, between 180° and 360° is AB, and under 180° is Class C.',
  },
  {
    id: 'b-bias', moduleId: 'bias',
    q: 'Raising output-stage bias past the point where the crossover notch disappears mainly…',
    options: ['Increases idle current and heat', 'Raises the maximum output power', 'Lowers the voltage gain of the stage', 'Filters the switching out of the output'],
    correct: 0,
    explain: 'Once the handoff is clean, extra overlap buys little — it just burns more idle current and makes more heat. That is the AB trade you tuned.',
  },
  // Module 4
  {
    id: 'c-idle', moduleId: 'classes', scored: true,
    q: 'With no input signal, a Class A output stage…',
    options: ['Draws almost nothing from the supply', 'Still draws substantial current and makes heat', 'Switches its output device off completely', 'Oscillates at its tuned frequency'],
    correct: 1,
    explain: 'Class A holds its device in continuous conduction, so quiescent current — and dissipation — flow even in silence. That is where its efficiency goes.',
  },
  {
    id: 'c-classc', moduleId: 'classes', scored: true,
    q: 'Why is Class C unsuitable for ordinary full-range audio?',
    options: ['It is too efficient to sound natural', 'Its short conduction pulses need a tuned circuit to recover one frequency', 'It requires vacuum tubes, which are now rare', 'Its voltage gain is too low for a loudspeaker'],
    correct: 1,
    explain: 'Class C conducts in brief pulses and relies on a resonant tank ringing at ONE tuned frequency. Music is broadband, so the recovery trick does not apply — Class C lives in RF.',
  },
  {
    id: 'c-eff', moduleId: 'classes',
    q: 'The 78.5% often quoted for Class B is…',
    options: ['A guaranteed figure for any Class B amplifier', 'The theoretical push-pull maximum at full output', 'Its efficiency at any output level', 'A measurement standard set by regulators'],
    correct: 1,
    explain: 'It is the ideal ceiling at full drive. Real amplifiers sit below it — and every class is much less efficient at low output levels.',
  },
  // Module 5
  {
    id: 'cd-pwm', moduleId: 'classd', scored: true,
    q: 'In the PWM model, what does the comparator compare?',
    options: ['The left and right audio channels against each other', 'The audio waveform against a high-frequency carrier', 'Output voltage against output current', 'The output waveform against the supply rails'],
    correct: 1,
    explain: 'Audio above the triangle carrier → switch high; below → switch low. The audio ends up encoded in the pulse WIDTHS, ready to be recovered by the filter.',
  },
  {
    id: 'cd-filter', moduleId: 'classd', scored: true,
    q: 'What does the Class D output filter do?',
    options: ['Adds back the bass the modulator removed', 'Averages the switching waveform back into audio', 'Converts the digital code back to analog', 'Boosts the efficiency to a full 100%'],
    correct: 1,
    explain: 'The low-pass filter keeps the slow-moving average — the audio — and rejects the fast switching. What reaches the speaker is the reconstructed waveform.',
  },
  {
    id: 'cd-digital', moduleId: 'classd',
    q: 'Is a Class D amplifier necessarily digital?',
    options: ['Yes — the D in Class D stands for digital', 'No — it is a switching topology; classic designs are fully analog', 'Yes — pulse-width modulation is a digital format', 'Only when the carrier runs above 1 kHz'],
    correct: 1,
    explain: 'The letter D just followed C. Comparing analog audio to an analog triangle is not sampling or quantization — it is analog switching control.',
  },
  // Module 6
  {
    id: 's-rails', moduleId: 'supply', scored: true,
    q: 'An amplifier clips when…',
    options: ['The input signal is digital rather than analog', 'The requested output exceeds what the supply rails can deliver', 'The loudspeaker is too sensitive for the amplifier', 'The gain knob is turned past 12 o’clock'],
    correct: 1,
    explain: 'The output can never swing past its rails. Ask for more voltage than the rails hold and the peaks flatten — that flat top IS the rails.',
  },
  {
    id: 's-sag', moduleId: 'supply',
    q: 'Under heavy load, the rail voltage of an unregulated supply typically…',
    options: ['Rises, raising the clip point', 'Sags, lowering the clip point', 'Inverts its polarity', 'Turns from DC back into AC'],
    correct: 1,
    explain: 'Sustained current draw pulls the reservoir down, so the amplifier clips earlier than its idle rails suggest — one reason continuous ratings differ from burst ratings.',
  },
  {
    id: 's-safety', moduleId: 'supply', scored: true,
    q: 'Why is an unplugged power amplifier still potentially dangerous inside?',
    options: ['Residual radio-frequency energy in the chassis', 'Capacitors can hold lethal charge after power is removed', 'The transformer keeps generating for several minutes', 'It is not — once unplugged it is safe to open'],
    correct: 1,
    explain: 'Reservoir capacitors store real energy and can retain dangerous voltage long after disconnection. Servicing is for qualified technicians.',
  },
  // Module 7
  {
    id: 'r-parallel', moduleId: 'realworld', scored: true, keepOrder: true,
    q: 'Two 8 Ω speakers wired in parallel present…',
    options: ['16 Ω', '8 Ω', '4 Ω', '2 Ω'],
    correct: 2,
    explain: '1/Z = 1/8 + 1/8 → 4 Ω. Parallel loads always drop below the smallest branch — and demand more current from the amplifier.',
  },
  {
    id: 'r-bridge', moduleId: 'realworld', scored: true, keepOrder: true,
    q: 'Bridged into an 8 Ω load, each amplifier channel effectively works into about…',
    options: ['2 Ω', '4 Ω', '8 Ω', '16 Ω'],
    correct: 1,
    explain: 'The channels drive opposite ends of the load, so each sees roughly half the impedance — 4 Ω here. That is why bridged minimum-load ratings are stricter.',
  },
  {
    id: 'r-3db', moduleId: 'realworld', scored: true,
    q: 'Going from a 100 W amplifier to a 200 W amplifier buys you about…',
    options: ['+3 dB', '+10 dB', 'Twice the loudness', '+6 dB'],
    correct: 0,
    explain: 'ΔdB = 10·log10(200/100) ≈ +3 dB. Audible, worthwhile — but a long way from double loudness, which needs roughly ten times the power.',
  },
  {
    id: 'r-cable', moduleId: 'realworld',
    q: 'Why is an instrument cable wrong for speaker connections?',
    options: ['The connector is the wrong shape for a speaker jack', 'Its thin conductor and shield are not built for speaker current', 'It only passes digital audio signals', 'It reverses the polarity of the signal'],
    correct: 1,
    explain: 'Instrument cable is shielded, high-capacitance, thin-core signal wire. Speaker runs need low-resistance conductors sized for amps of current.',
  },
  // Module 8 pool extras (scored only)
  {
    id: 'a-sens', moduleId: 'apply', scored: true,
    q: 'Input sensitivity is…',
    options: ['The amplifier’s voltage gain expressed in dB', 'The input level that drives the amplifier to a specified output', 'The amplifier’s noise floor measured at its input', 'The minimum load impedance the input will accept'],
    correct: 1,
    explain: 'Sensitivity says “this much input produces that specified output.” Gain is the ratio between them — related, but not the same specification.',
  },
  {
    id: 'a-damping', moduleId: 'apply', scored: true,
    q: 'Damping factor is the ratio of…',
    options: ['Output power to input power', 'Load impedance to amplifier output impedance', 'Output voltage to output current', 'Peak voltage to RMS voltage'],
    correct: 1,
    explain: 'DF = Zload / Zout(amp). It varies with frequency, and speaker-cable resistance sits in series — one number is not a universal sound-quality score.',
  },
  {
    id: 'a-thermal', moduleId: 'apply', scored: true,
    q: 'An amplifier keeps dropping into thermal protection at a show. Best FIRST response?',
    options: ['Keep resetting it until the show is over', 'Check ventilation, load, and drive level, then correct the cause', 'Bridge it to gain some headroom', 'Lower the speaker impedance to ease the load'],
    correct: 1,
    explain: 'Protection is telling you something: blocked airflow, too low a load, or sustained clipping. Resetting without fixing the cause invites failure.',
  },
];

export const checksForModule = (id: AmpModuleId) => AMP_CHECKS.filter((c) => c.moduleId === id);

/* ── safety notice (Part 3 §12) — shown before the real-world module ────── */

export const SAFETY_POINTS: string[] = [
  'Amplifiers and power supplies may contain lethal voltage.',
  'Internal capacitors can retain charge after disconnection.',
  'This lab is not a repair or construction guide.',
  'Never open or service powered equipment without proper qualifications.',
  'Confirm load and bridge-mode requirements from the manufacturer.',
  'Never short amplifier outputs.',
  'Never connect amplifier outputs together unless a specifically documented system supports it.',
  'Do not assume output negative terminals are grounded.',
  'Use proper speaker cable.',
  'Maintain ventilation.',
  'Reduce levels before changing connections.',
  'Protect hearing during testing.',
];

/* ── rack inspection scenarios (Module 7) ───────────────────────────────── */

export type RackFinding =
  | 'load-below' | 'bad-bridge' | 'blocked-vent' | 'output-miswired'
  | 'instrument-cable' | 'upstream-clip' | 'normal';

export const RACK_FINDINGS: { key: RackFinding; label: string }[] = [
  { key: 'load-below', label: 'Load below the amplifier rating' },
  { key: 'bad-bridge', label: 'Incorrect bridge connection' },
  { key: 'blocked-vent', label: 'Blocked ventilation' },
  { key: 'output-miswired', label: 'Speaker output connected incorrectly' },
  { key: 'instrument-cable', label: 'Instrument cable used as speaker cable' },
  { key: 'upstream-clip', label: 'Existing upstream clipping' },
  { key: 'normal', label: 'Normal, correct operation' },
];

export type RackScenario = {
  id: string;
  title: string;
  /** What the learner sees on the virtual rack. */
  readout: { label: string; value: string }[];
  answer: RackFinding;
  explain: string;
};

export const RACK_SCENARIOS: RackScenario[] = [
  {
    id: 'rk-parallel', title: 'Rack 1',
    readout: [
      ['Load per channel', 'three 8 Ω cabinets in parallel'], ['Mode', 'Stereo'], ['Speaker cable', '12 AWG speaker cable'],
      ['Ventilation', 'Front and rear clear'], ['Input', '−6 dB below mixer clip'], ['Front panel', 'CLIP dark · PROTECT dark'], ['Power sequence', 'Amps last on, first off'],
    ].map(([label, value]) => ({ label, value })),
    answer: 'load-below',
    explain: 'Three 8 Ω cabinets in parallel is 8 ÷ 3 ≈ 2.7 Ω — below a typical 4 Ω stereo minimum. Nothing is lit yet because the show is quiet; the first loud passage will pull current the amplifier is not rated for.',
  },
  {
    id: 'rk-bridge', title: 'Rack 2',
    readout: [
      ['Load', 'one 8 Ω subwoofer'], ['Mode', 'Bridge — wired to CH1+ and CH2+ per the manual'], ['Speaker cable', '10 AWG speaker cable'],
      ['Ventilation', 'Clear'], ['Input', '−10 dB below mixer clip, CH1 only'], ['Front panel', 'CLIP dark · PROTECT dark'], ['Power sequence', 'Correct'],
    ].map(([label, value]) => ({ label, value })),
    answer: 'normal',
    explain: 'Everything checks out: a documented bridge wiring, an 8 Ω load that meets the usual bridged minimum, real speaker cable, clear airflow, healthy input level. Not every rack has a fault — knowing when to leave it alone is a skill.',
  },
  {
    id: 'rk-vent', title: 'Rack 3',
    readout: [
      ['Load', '8 Ω per channel'], ['Mode', 'Stereo'], ['Speaker cable', '12 AWG speaker cable'],
      ['Ventilation', 'Rack rear door closed, road-case foam against the intake'], ['Input', '−8 dB below mixer clip'], ['Front panel', 'THERMAL amber after 40 minutes'], ['Power sequence', 'Correct'],
    ].map(([label, value]) => ({ label, value })),
    answer: 'blocked-vent',
    explain: 'The load and levels are fine; the amplifier simply cannot breathe. Heat builds until thermal limiting engages. Open the airflow path — the amber indicator is the amplifier asking for exactly that.',
  },
  {
    id: 'rk-miswire', title: 'Rack 4',
    readout: [
      ['Load', '8 Ω per channel'], ['Mode', 'Stereo'], ['Speaker cable', '12 AWG'], ['Wiring', 'Both channels’ negative terminals tied together at the patch panel “for a common ground”'],
      ['Ventilation', 'Clear'], ['Input', '−8 dB'], ['Front panel', 'PROTECT lit on power-up'], ['Power sequence', 'Correct'],
    ].map(([label, value]) => ({ label, value })),
    answer: 'output-miswired',
    explain: 'Output negatives are not guaranteed to be ground — on many designs they carry signal. Tying them together can short output stages, which is why PROTECT lit immediately. Undo the “common ground” and wire each channel independently.',
  },
  {
    id: 'rk-cable', title: 'Rack 5',
    readout: [
      ['Load', '8 Ω per channel'], ['Mode', 'Stereo'], ['Speaker cable', 'Shielded ¼" instrument cable, 15 m runs'],
      ['Ventilation', 'Clear'], ['Input', '−8 dB'], ['Front panel', 'CLIP dark · PROTECT dark'], ['Symptom', 'Cable warm to the touch, weak low end'],
    ].map(([label, value]) => ({ label, value })),
    answer: 'instrument-cable',
    explain: 'Instrument cable is thin shielded signal wire. Over 15 m at speaker currents it wastes power as heat in the conductor and its resistance robs damping — the warm cable and soft bass are the giveaways. Use proper speaker cable sized for the run.',
  },
  {
    id: 'rk-upstream', title: 'Rack 6',
    readout: [
      ['Load', '8 Ω per channel'], ['Mode', 'Stereo'], ['Speaker cable', '12 AWG'], ['Ventilation', 'Clear'],
      ['Input', 'Mixer master meters pinned red; amplifier input attenuators at −20 dB'], ['Front panel', 'CLIP dark'], ['Symptom', 'Harsh, distorted sound at modest volume'],
    ].map(([label, value]) => ({ label, value })),
    answer: 'upstream-clip',
    explain: 'The amplifier’s CLIP light is dark because the amplifier is NOT clipping — it is faithfully reproducing a signal that was already clipped at the mixer. Turning the amplifier down cannot fix distortion that happened upstream; fix the mixer gain structure.',
  },
  {
    id: 'rk-normal2', title: 'Rack 7',
    readout: [
      ['Load', '4 Ω per channel (two 8 Ω cabinets in parallel)'], ['Mode', 'Stereo, amplifier rated to 4 Ω'], ['Speaker cable', '12 AWG'],
      ['Ventilation', 'Clear, 1U gap above'], ['Input', '−6 dB below mixer clip'], ['Front panel', 'CLIP flickers on the loudest peaks only'], ['Power sequence', 'Correct'],
    ].map(([label, value]) => ({ label, value })),
    answer: 'normal',
    explain: 'A 4 Ω load on an amplifier rated for it, real cable, airflow, and a CLIP light that only flickers on the very loudest peaks: that is ordinary, healthy operation with reasonable headroom.',
  },
];

/* ── specification decoder (Module 7) ───────────────────────────────────── */

export type SpecCondition = 'load' | 'channels' | 'bandwidth' | 'thd' | 'duration';

export const SPEC_CONDITIONS: { key: SpecCondition; label: string; why: string }[] = [
  { key: 'load', label: 'Load impedance', why: 'Power into 4 Ω and into 8 Ω are different numbers for the same amplifier.' },
  { key: 'channels', label: 'Channels driven', why: 'One channel driven flatters the supply; all channels driven is the honest case.' },
  { key: 'bandwidth', label: 'Frequency range', why: '“1 kHz only” hides what happens at 20 Hz where the supply works hardest.' },
  { key: 'thd', label: 'Distortion threshold', why: 'Power “at 10% THD” is a clipped, unusable rating; 0.1% or 1% is meaningful.' },
  { key: 'duration', label: 'Continuous vs burst', why: 'Short bursts avoid heat and supply sag; continuous ratings are what you can lean on.' },
];

export type SpecSheet = {
  id: string;
  lines: string[];
  /** Conditions the sheet leaves out. */
  missing: SpecCondition[];
  verdict: string;
};

export const SPEC_SHEETS: SpecSheet[] = [
  {
    id: 'sp-marketing',
    lines: ['“1200 W PEAK POWER!”', 'Bridgeable', 'Frequency response 20 Hz – 20 kHz'],
    missing: ['load', 'channels', 'thd', 'duration'],
    verdict: 'A peak figure with no load, no channel count, no distortion threshold and no duration is marketing, not a rating. The frequency-response line describes bandwidth, not power test conditions.',
  },
  {
    id: 'sp-proper',
    lines: ['Continuous power: 350 W per channel into 8 Ω, both channels driven, 20 Hz – 20 kHz, < 0.1% THD', 'Continuous power: 550 W per channel into 4 Ω, both channels driven, 20 Hz – 20 kHz, < 0.1% THD'],
    missing: [],
    verdict: 'Every condition is stated: load, channels driven, bandwidth, distortion threshold, and “continuous.” This is a rating you can compare and rely on.',
  },
  {
    id: 'sp-partial',
    lines: ['500 W RMS', '4 Ω', 'THD 0.05% at 1 kHz'],
    missing: ['channels', 'bandwidth', 'duration'],
    verdict: '“RMS watts” is shorthand for continuous power under conditions — but which? No channel count, a single 1 kHz test tone instead of full bandwidth, and no statement of duration. Better than a peak claim; still not complete.',
  },
];

/* ── Module 8: waveform diagnosis ───────────────────────────────────────── */

export type WaveKind =
  | 'clean' | 'voltage-clip' | 'crossover' | 'current-limit' | 'sag'
  | 'classd-raw' | 'classd-filtered' | 'protect';

/** `alsoAccept`: readings that are equally correct for this picture. A filtered
 *  Class D output IS a clean output at this zoom (the evidence text says so),
 *  so neither answer may be scored wrong against the other — an item that
 *  cannot be distinguished must not count against the learner. */
export const WAVE_KINDS: { key: WaveKind; label: string; evidence: string; alsoAccept?: WaveKind[] }[] = [
  { key: 'clean', label: 'Clean output', evidence: 'A smooth sine that follows the input with room below the rail lines — nothing flattened, nothing missing at zero.', alsoAccept: ['classd-filtered'] },
  { key: 'voltage-clip', label: 'Voltage clipping', evidence: 'Flat tops sitting EXACTLY on the rail lines. The supply ran out of volts.' },
  { key: 'crossover', label: 'Crossover distortion', evidence: 'A flat step or kink right at the zero crossing; the peaks are untouched. Output-stage handoff, not the rails.' },
  { key: 'current-limit', label: 'Current limiting', evidence: 'Flat tops BELOW the rail lines with voltage to spare above them. The output stage would not pass more current.' },
  { key: 'sag', label: 'Supply sag', evidence: 'Clipping that begins below the nominal rails because the rails themselves drooped under sustained load — the rail lines have moved inward.' },
  { key: 'classd-raw', label: 'Class D switching (before the filter)', evidence: 'Only two levels, pulses of changing width — the audio is in the widths, not the height.' },
  { key: 'classd-filtered', label: 'Normal filtered Class D output', evidence: 'A clean audio waveform — the switching has been averaged away. Indistinguishable from any clean output at this zoom, which is the point.', alsoAccept: ['clean'] },
  { key: 'protect', label: 'Protection / mute', evidence: 'A flat line at zero with input still present: the output relay has opened. Nothing is reaching the load.' },
];

/* ── Module 8: application selection ────────────────────────────────────── */

export type AppClassChoice = 'A' | 'AB' | 'D' | 'C' | 'TUBE';

export type AppScenario = {
  id: string;
  title: string;
  brief: string;
  /** Technically defensible choices (more than one is allowed). */
  accepted: AppClassChoice[];
  /** Why each accepted choice works, and the trade it makes. */
  reasoning: Partial<Record<AppClassChoice, string>>;
  /** Why the others do not fit. */
  rejected: Partial<Record<AppClassChoice, string>>;
};

export const APP_SCENARIOS: AppScenario[] = [
  {
    id: 'ap-portable', title: 'Battery-powered portable speaker',
    brief: 'Runs on a small battery for hours; must stay cool inside a sealed enclosure.',
    accepted: ['D'],
    reasoning: { D: 'Efficiency is the whole game on a battery: Class D wastes the least energy as heat and needs little heatsinking in a sealed box.' },
    rejected: { A: 'Class A burns most of the battery as heat even at idle.', AB: 'Workable, but its dissipation shortens battery life and needs a heatsink the enclosure cannot spare.', C: 'Not an audio amplifier.', TUBE: 'Heater power and heat alone rule it out.' },
  },
  {
    id: 'ap-sub', title: 'Touring subwoofer amplifier',
    brief: 'Thousands of watts into low-impedance loads, night after night, in a road rack.',
    accepted: ['D'],
    reasoning: { D: 'At kilowatt levels, efficiency decides weight, rack heat and mains draw — modern touring amplifiers are switching designs with switch-mode supplies for exactly this reason.' },
    rejected: { A: 'The heat would be measured in kilowatts.', AB: 'Historically used, but its heat and weight at this power are why the industry moved on.', C: 'Not an audio amplifier.', TUBE: 'Impractical at this power and impedance.' },
  },
  {
    id: 'ap-monitor', title: 'Studio-monitor amplifier',
    brief: 'Moderate power, low distortion at low levels, sits on a desk near the listener.',
    accepted: ['AB', 'D'],
    reasoning: { AB: 'Properly biased AB is linear at low levels, quiet, and moderate power keeps heat manageable — a classic choice.', D: 'A well-implemented Class D with a good filter and feedback is equally valid and runs cooler; implementation quality decides, not the class letter.' },
    rejected: { A: 'Defensible in a purist design, but the heat and idle draw on a desk are a real cost for no guaranteed benefit.', C: 'Not an audio amplifier.', TUBE: 'Possible, but heat, output transformer and maintenance make it an unusual monitor choice.' },
  },
  {
    id: 'ap-classroom', title: 'Educational Class A circuit',
    brief: 'A bench circuit built to SHOW how an amplifier works — simplicity matters more than efficiency.',
    accepted: ['A'],
    reasoning: { A: 'One device, one operating point, full-cycle conduction: the simplest amplifier to build, probe and understand. Efficiency is irrelevant on a bench.' },
    rejected: { AB: 'Two devices and a bias network hide the basic idea.', D: 'Modulators and filters obscure the lesson.', C: 'Cannot pass audio at all.', TUBE: 'A tube stage is also Class A — but the brief asks for the transistor circuit that students can build safely at low voltage.' },
  },
  {
    id: 'ap-rf', title: 'RF transmitter output stage',
    brief: 'One carrier frequency, high efficiency, driving an antenna through a tuned network.',
    accepted: ['C', 'D'],
    reasoning: { C: 'A single tuned frequency is exactly what Class C recovers — its tank rings at the carrier and the short pulses keep dissipation low.', D: 'Switching-mode RF amplifiers exist for the same efficiency reasons; defensible at some frequencies.' },
    rejected: { A: 'Works but wastes most of the power as heat.', AB: 'Linear RF amplifiers exist, but for a constant carrier the efficiency of C wins.', TUBE: 'Tubes are used in RF — but the question is the operating class; a tube can run Class C.' },
  },
  {
    id: 'ap-guitar', title: 'Tube guitar amplifier',
    brief: 'The player wants the classic overdrive character and feel of a tube output stage.',
    accepted: ['TUBE', 'AB', 'A'],
    reasoning: { TUBE: 'The brief names the device: tube stages (usually push-pull AB, sometimes single-ended A) with an output transformer deliver the sought-after saturation behavior.', AB: 'Most tube guitar amplifiers run their output tubes in push-pull Class AB.', A: 'Small single-ended tube amplifiers run Class A — the low-watt classic.' },
    rejected: { D: 'Can model the sound, but the brief asks for the tube stage itself.', C: 'Not an audio amplifier.' },
  },
  {
    id: 'ap-install', title: 'Compact multichannel installation amplifier',
    brief: 'Eight channels in one rack unit, running all day in a closed equipment closet.',
    accepted: ['D'],
    reasoning: { D: 'Eight channels of linear amplification would not fit the heat budget of one rack unit in a closet; switching stages make the density and the always-on duty possible.' },
    rejected: { A: 'Heat and size are impossible here.', AB: 'Eight AB channels in 1U would thermally limit constantly.', C: 'Not an audio amplifier.', TUBE: 'Neither the size nor the maintenance fits.' },
  },
];

export const APP_CHOICES: { key: AppClassChoice; label: string }[] = [
  { key: 'A', label: 'Class A' }, { key: 'AB', label: 'Class AB' }, { key: 'D', label: 'Class D' }, { key: 'C', label: 'Class C' }, { key: 'TUBE', label: 'Tube stage' },
];

/* ── Module 8: myth review (the nine required statements) ───────────────── */

export const MYTH_REVIEW_IDS = [
  'd-is-digital', 'a-sounds-best', 'watts-loudness', 'always-8-ohms', 'gain-sets-watts',
  'transformer-power', 'lower-z-better', 'common-ground', 'watt-match',
] as const;

/* ── protection-state copy (Part 3 §7) ──────────────────────────────────── */

export const FAULT_COPY: Record<FaultId, { title: string; detected: string; action: string; check: string }> = {
  'short': {
    title: 'SHORT CIRCUIT',
    detected: 'The output sees a near-zero-ohm path.',
    action: 'The amplifier mutes its output to protect the output stage.',
    check: 'Inspect speaker wiring for crushed, pinched, or touching conductors before restoring power.',
  },
  'bad-bridge': {
    title: 'UNSUPPORTED BRIDGE CONNECTION',
    detected: 'Bridge wiring on an amplifier or mode that does not support it.',
    action: 'Output stages can fight each other — protection or damage follows.',
    check: 'Confirm bridge support and the exact terminal wiring in the manufacturer’s documentation.',
  },
  'load-below-min': {
    title: 'LOAD BELOW RATED MINIMUM',
    detected: 'The connected load is below the amplifier’s minimum impedance rating.',
    action: 'Current demand rises beyond design limits; expect protection, limiting, or heat.',
    check: 'Recount the speakers and wiring — parallel loads drop fast. Bridge mode halves the per-channel load again.',
  },
  'overcurrent': {
    title: 'OVERCURRENT',
    detected: 'Output current demand exceeded the safe limit.',
    action: 'The amplifier limits or shuts down its output devices.',
    check: 'Look for too-low impedance, shorted wiring, or sustained maximum-level drive.',
  },
  'dc-protect': {
    title: 'DC PROTECT',
    detected: 'DC offset detected at the output.',
    action: 'The output relay opens to protect the loudspeakers.',
    check: 'This usually indicates an internal fault — service is required. Do not bypass the protection.',
  },
  'thermal-shutdown': {
    title: 'THERMAL SHUTDOWN',
    detected: 'Heatsink temperature passed the shutdown threshold.',
    action: 'Output mutes until the amplifier cools.',
    check: 'Clear the ventilation path, reduce sustained level, verify the load. Repeated resets without a fix cook the amplifier.',
  },
  'thermal-limiting': {
    title: 'THERMAL LIMITING',
    detected: 'Temperature is high enough that the amplifier is reducing output.',
    action: 'Level is being pulled back to slow the temperature rise.',
    check: 'Improve airflow now — blocked vents or rack heat are the usual causes.',
  },
  'output-clipping': {
    title: 'OUTPUT CLIPPING',
    detected: 'The requested output exceeds the supply rails.',
    action: 'Waveform peaks are flattened at the rail voltage.',
    check: 'Reduce drive into the amplifier or raise system headroom. Sustained clipping stresses loudspeakers.',
  },
  'upstream-clipping': {
    title: 'UPSTREAM CLIPPING',
    detected: 'A source or mixer stage is clipping BEFORE the amplifier.',
    action: 'The amplifier faithfully reproduces an already-distorted signal.',
    check: 'Fix gain structure at the first clipping stage — turning the amplifier down will not clean this up.',
  },
  'poor-gain-structure': {
    title: 'POOR GAIN STRUCTURE',
    detected: 'Signal reaches the amplifier far below its useful range.',
    action: 'Noise floor rises relative to signal; headroom is wasted upstream.',
    check: 'Bring each stage to a healthy nominal level instead of making one stage do all the work.',
  },
};
