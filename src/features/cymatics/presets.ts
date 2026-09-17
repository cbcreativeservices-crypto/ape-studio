/**
 * Cymatics Lab — studio presets + guided experiments (spec §5, Phase 1 set).
 * Import-free data: a preset is a full PlateSpec override + a drive frequency
 * strategy, so an experiment can "SET UP THE PLATE" and land the learner on
 * exactly the situation the step describes.
 */
import type { PlateSpec } from './plateModes';
import type { LiquidSpec } from './faraday';

export type FreqStrategy =
  | { kind: 'hz'; hz: number }
  /** Land on the k-th excitable mode of the resulting plate (0-based). */
  | { kind: 'mode'; index: number; detuneRatio?: number };

export type StudioPreset = {
  id: string;
  spec: Partial<PlateSpec>;
  freq: FreqStrategy;
  view?: 'particles' | 'heat' | 'overlay' | 'phase' | 'nodes' | 'plate3d' | 'section';
};

/** Liquid Studio preset (Phase 2): dish + liquid + drive frequency + acceleration. */
export type LiquidPreset = {
  id: string;
  spec: Partial<LiquidSpec>;
  hz: number;
  /** Vertical acceleration, g. `'onset'` = land just above this setup's threshold; a number = absolute. */
  accelG: number | 'onset';
  view?: 'rig' | 'surface' | 'height' | 'contours' | 'refraction' | 'mono' | 'liquid3d' | 'section';
};

export type Experiment = {
  id: string;
  num: number;
  title: string;
  goal: string;
  steps: string[];
  /** What the learner should notice — shown after they open the setup. */
  lookFor: string;
  /** Which studio the experiment opens (plate = Phase 1, liquid = Phase 2). */
  studio: 'plate' | 'liquid';
  preset?: StudioPreset;
  liquid?: LiquidPreset;
};

export const EXPERIMENTS: readonly Experiment[] = [
  {
    id: 'first-resonance',
    num: 1,
    title: 'Find the first visible resonance',
    goal: 'Sweep upward from a low frequency until the sand first snaps into a stable figure.',
    steps: [
      'Start the tone at 60 Hz with the particles scattered.',
      'Run the SWEEP, or raise FREQUENCY slowly by hand.',
      'Watch the RESONANCE readout climb from BELOW to APPROACHING to AT.',
      'Stop when the figure holds still. Read the mode label.',
    ],
    lookFor: 'Between resonances the plate barely moves and the sand only shivers. Near a mode the motion grows fast and the sand walks to the still lines within a second or two.',
    studio: 'plate',
    preset: { id: 'first-resonance', spec: { shape: 'square', material: 'aluminum', sizeMm: 240, thicknessMm: 1 }, freq: { kind: 'hz', hz: 60 } },
  },
  {
    id: 'predict',
    num: 2,
    title: 'Predict where the particles will gather',
    goal: 'Use the heat map to call the pattern before the sand shows it.',
    steps: [
      'Switch VIEW to HEAT MAP and look at the dark-blue lines — that is where the plate is still.',
      'Say out loud where the sand will end up.',
      'Switch to PARTICLES + HEAT and press RESET to scatter the sand.',
      'Watch it migrate onto the blue lines.',
    ],
    lookFor: 'Sand collects on the nodal lines (minimum motion) and is thrown off the red antinodes (maximum motion). The heat map is the prediction; the sand is the confirmation.',
    studio: 'plate',
    preset: { id: 'predict', spec: { shape: 'square', material: 'aluminum', sizeMm: 240, thicknessMm: 1 }, freq: { kind: 'mode', index: 2 }, view: 'heat' },
  },
  {
    id: 'nodes-antinodes',
    num: 3,
    title: 'Nodes versus antinodes',
    goal: 'See that regions on opposite sides of a nodal line move in opposite directions.',
    steps: [
      'Open the PHASE view: amber regions move up while blue regions move down.',
      'Switch to 3D PLATE and slow motion to watch them rock against each other.',
      'Switch to CROSS-SECTION and drag the slice through a nodal line.',
    ],
    lookFor: 'The nodal line is a hinge: zero displacement on the line, opposite signs either side. Each stable figure is one normal mode of the plate.',
    studio: 'plate',
    preset: { id: 'nodes-antinodes', spec: { shape: 'circle', material: 'aluminum', sizeMm: 240, thicknessMm: 1, exciter: { x: 0.85, y: 0.5 } }, freq: { kind: 'mode', index: 0 }, view: 'phase' },
  },
  {
    id: 'diameter',
    num: 4,
    title: 'How diameter changes resonance',
    goal: 'Same material, same thickness, same frequency — twice the diameter.',
    steps: [
      'This 200 mm disc is sitting on its first mode. Note the frequency.',
      'Raise SIZE to 400 mm without touching the frequency.',
      'Watch the pattern dissolve — the same Hz is no longer a resonance.',
      'Lower FREQUENCY until the same figure returns. Compare the two numbers.',
    ],
    lookFor: 'Doubling every horizontal dimension quarters the modal frequency (f ∝ 1/L²). The figure comes back at about one quarter of the original Hz.',
    studio: 'plate',
    preset: { id: 'diameter', spec: { shape: 'circle', material: 'aluminum', sizeMm: 200, thicknessMm: 1, exciter: { x: 0.85, y: 0.5 } }, freq: { kind: 'mode', index: 0 } },
  },
  {
    id: 'thickness',
    num: 5,
    title: 'How thickness changes resonance',
    goal: 'Double the thickness and find the same mode again.',
    steps: [
      'Note the frequency of this 1 mm plate on its second mode.',
      'Raise THICKNESS to 2 mm.',
      'Sweep upward until the same figure returns.',
    ],
    lookFor: 'Doubling thickness doubles the modal frequency (f ∝ h). Thicker plates are stiffer out of plane, so every mode moves up together.',
    studio: 'plate',
    preset: { id: 'thickness', spec: { shape: 'square', material: 'aluminum', sizeMm: 240, thicknessMm: 1 }, freq: { kind: 'mode', index: 1 } },
  },
  {
    id: 'materials',
    num: 6,
    title: 'Aluminum, steel, acrylic, wood',
    goal: 'Same plate, four materials — what moves and what does not.',
    steps: [
      'Note the mode frequency in aluminum.',
      'Switch MATERIAL to steel: three times stiffer AND three times denser — the frequency barely changes.',
      'Switch to acrylic: soft and heavily damped — the frequency drops and the figure blurs.',
      'Switch to solid wood and rotate the GRAIN: the modes re-order.',
    ],
    lookFor: 'Frequency follows √(E/ρ): stiffness raises it, density lowers it. Damping does not move the resonance — it broadens and blurs it.',
    studio: 'plate',
    preset: { id: 'materials', spec: { shape: 'square', material: 'aluminum', sizeMm: 240, thicknessMm: 1.5 }, freq: { kind: 'mode', index: 1 } },
  },
  {
    id: 'exciter',
    num: 7,
    title: 'Move the exciter, suppress a mode',
    goal: 'A driver sitting on a nodal line cannot excite that mode.',
    steps: [
      'This plate is driven at its centre. Note which figure appears.',
      'In DRIVE, choose EXCITER and drag the driver onto one of the nodal lines.',
      'The figure weakens or vanishes — the plate cannot be pushed where it does not move.',
      'Drag it to a corner: different modes light up.',
    ],
    lookFor: 'Modes are excited in proportion to how much they move under the driver. Centre-driven plates only show centre-antinode modes.',
    studio: 'plate',
    preset: { id: 'exciter', spec: { shape: 'square', material: 'aluminum', sizeMm: 240, thicknessMm: 1, exciter: { x: 0.5, y: 0.5 } }, freq: { kind: 'mode', index: 0 } },
  },
  {
    id: 'harmonic-vs-modes',
    num: 8,
    title: 'A string’s harmonics vs a plate’s modes',
    goal: 'Hear and see why plate modes are not a harmonic series.',
    steps: [
      'Open HARMONICS VS PLATE MODES from the lab home and compare the ladders.',
      'Back in the studio, sweep the plate and read the mode frequencies as they arrive.',
      'Divide each by the first: they are not 2, 3, 4…',
    ],
    lookFor: 'A string’s modes are f, 2f, 3f… A free plate’s are inharmonic (≈ 1, 1.73, 2.33, 3.9…). Chladni figures show resonance and normal modes — not musical harmony.',
    studio: 'plate',
    preset: { id: 'harmonic-vs-modes', spec: { shape: 'circle', material: 'aluminum', sizeMm: 240, thicknessMm: 1, exciter: { x: 0.85, y: 0.5 } }, freq: { kind: 'mode', index: 0 } },
  },
  // ── Phase 2 — Liquid Studio (spec §5 P2: 8–11) ────────────────────────────
  {
    id: 'liquid-first-pattern',
    num: 9,
    title: 'Create a circular liquid pattern',
    goal: 'Take a dish of water past the Faraday threshold and watch a standing pattern lock in at HALF the drive frequency.',
    steps: [
      'The dish starts just above threshold at 40 Hz. Watch the RESPONSE readout: 20 Hz.',
      'Switch VIEW to REFRACTION — the classic “light through the water” look.',
      'Nudge SHAKE up a little: the pattern sharpens; too far and it starts to break up.',
    ],
    lookFor: 'The surface oscillates at half the drive frequency — the subharmonic signature of Faraday waves. The pattern family depends on the dish size versus the wavelength: small dish → the dish’s own rings and lobes.',
    studio: 'liquid',
    liquid: { id: 'liquid-first-pattern', spec: { liquid: 'water', sizeMm: 100, depthMm: 4 }, hz: 40, accelG: 'onset', view: 'surface' },
  },
  {
    id: 'liquid-threshold',
    num: 10,
    title: 'Find the Faraday onset threshold',
    goal: 'Raise the shaking from zero until the flat surface first breaks into a pattern, and read the threshold.',
    steps: [
      'Start with SHAKE near zero: the surface is flat and only rides the platform.',
      'Raise SHAKE slowly. Note the stages: sloshing or edge ripples first, all AT the drive frequency.',
      'The moment the readout flips to PATTERN ONSET, compare your acceleration with the THRESHOLD readout.',
    ],
    lookFor: 'Below threshold nothing organises — the drive is not strong enough to pump the subharmonic wave against damping. The threshold rises with viscosity, and with a pinned (wetting) rim.',
    studio: 'liquid',
    liquid: { id: 'liquid-threshold', spec: { liquid: 'water', sizeMm: 150, depthMm: 5 }, hz: 50, accelG: 0.02, view: 'surface' },
  },
  {
    id: 'liquid-viscosity',
    num: 11,
    title: 'Compare water and a glycerin mixture',
    goal: 'Same dish, same frequency, same shaking — swap the liquid.',
    steps: [
      'Water at 45 Hz is well above threshold with a square-ish lattice.',
      'In LIQUID, choose Glycerin–water 50/50. The pattern dims or vanishes: the threshold has climbed.',
      'Raise SHAKE until the pattern returns. Notice it now prefers stripes.',
    ],
    lookFor: 'Viscosity damps the wave, so onset needs more acceleration; higher viscosity also shifts the preferred lattice from squares toward stripes (the published phase map).',
    studio: 'liquid',
    liquid: { id: 'liquid-viscosity', spec: { liquid: 'water', sizeMm: 200, depthMm: 5 }, hz: 45, accelG: 0.35, view: 'surface' },
  },
  {
    id: 'liquid-depth',
    num: 12,
    title: 'Change the depth without changing the frequency',
    goal: 'Pour more liquid in and watch the wavelength and threshold move at a fixed drive.',
    steps: [
      'A 2 mm layer of water at 30 Hz: short waves, strongly damped by the bottom.',
      'In DISH, raise DEPTH to 8 mm, then 15 mm. Read λ and THRESHOLD each time.',
      'Bring SHAKE back to the same value and compare the patterns.',
    ],
    lookFor: 'In a thin layer the bottom boundary layer steals energy (higher threshold) and tanh(kd) shortens the wave. Deeper liquid approaches the deep-water dispersion and the threshold falls.',
    studio: 'liquid',
    liquid: { id: 'liquid-depth', spec: { liquid: 'water', sizeMm: 150, depthMm: 2 }, hz: 30, accelG: 0.3, view: 'height' },
  },
];

export const PRESET_BY_ID: Record<string, StudioPreset> = Object.fromEntries(EXPERIMENTS.filter((e) => e.preset).map((e) => [e.preset!.id, e.preset!]));
export const LIQUID_PRESET_BY_ID: Record<string, LiquidPreset> = Object.fromEntries(EXPERIMENTS.filter((e) => e.liquid).map((e) => [e.liquid!.id, e.liquid!]));
