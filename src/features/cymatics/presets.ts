/**
 * Cymatics Lab — studio presets + guided experiments (spec §5, Phase 1 set).
 * Import-free data: a preset is a full PlateSpec override + a drive frequency
 * strategy, so an experiment can "SET UP THE PLATE" and land the learner on
 * exactly the situation the step describes.
 */
import type { PlateSpec } from './plateModes';

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

export type Experiment = {
  id: string;
  num: number;
  title: string;
  goal: string;
  steps: string[];
  /** What the learner should notice — shown after they open the setup. */
  lookFor: string;
  preset: StudioPreset;
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
    preset: { id: 'harmonic-vs-modes', spec: { shape: 'circle', material: 'aluminum', sizeMm: 240, thicknessMm: 1, exciter: { x: 0.85, y: 0.5 } }, freq: { kind: 'mode', index: 0 } },
  },
];

export const PRESET_BY_ID: Record<string, StudioPreset> = Object.fromEntries(EXPERIMENTS.map((e) => [e.preset.id, e.preset]));
