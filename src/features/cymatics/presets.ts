/**
 * Cymatics Lab — studio presets + guided experiments (spec §5, Phase 1 set).
 * Import-free data: a preset is a full PlateSpec override + a drive frequency
 * strategy, so an experiment can "SET UP THE PLATE" and land the learner on
 * exactly the situation the step describes.
 */
import type { PlateSpec } from './plateModes';
import type { LiquidSpec } from './faraday';
import type { DriverId, MembraneSpec } from './membrane';

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
  /** Drive at TWICE the k-th dish mode (0-based) so the half-frequency response lands on it; `hz` is the fallback. */
  driveMode?: number;
  view?: 'rig' | 'surface' | 'height' | 'contours' | 'refraction' | 'liquid3d' | 'section';
};

/** Membrane & Loudspeaker Studio preset (Phase 3): head + drive + view (+ driver). */
export type MembranePreset = {
  id: string;
  spec: Partial<MembraneSpec>;
  /** Drive frequency, or land on head mode (n, s). */
  hz: number | { n: number; s: number };
  view?: 'head' | 'heat' | 'phase' | 'nodes' | 'head3d' | 'section' | 'speaker';
  driver?: DriverId;
};

export type Experiment = {
  id: string;
  num: number;
  title: string;
  goal: string;
  steps: string[];
  /** The expectation to commit to BEFORE the steps (prediction, then check). */
  predict?: string;
  /** What the learner should notice — revealed in the studio after the steps. */
  lookFor: string;
  /** Which studio the experiment opens (plate = Phase 1, liquid = Phase 2, membrane = Phase 3). */
  studio: 'plate' | 'liquid' | 'membrane';
  preset?: StudioPreset;
  liquid?: LiquidPreset;
  membrane?: MembranePreset;
};

export const EXPERIMENTS: readonly Experiment[] = [
  {
    id: 'first-resonance',
    num: 1,
    title: 'Find the first visible resonance',
    goal: 'Sweep upward from a low frequency until the sand first snaps into a stable figure.',
    predict: 'Before you sweep: as the tone rises, will the sand organise gradually — a bit more order at every step — or stay scattered and then snap into a figure all at once?',
    steps: [
      'Start the tone at 60 Hz with the particles scattered.',
      'Run the SWEEP — it glides between the plate’s modes and dwells on each — or raise FREQ by hand and use the ±0.1 % nudges.',
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
    predict: 'Look at the heat map and COMMIT: point at where the sand will end up. On the dark lines, or on the bright ones?',
    steps: [
      'Switch VIEW to HEAT MAP and look at the dark lines — that is where the plate is still.',
      'Say out loud where the sand will end up.',
      'Switch to PARTICLES + HEAT and press RESET to scatter the sand.',
      'Watch it migrate onto the dark lines.',
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
    predict: 'Two patches sit either side of one nodal line. At any instant, are they moving the same way, opposite ways, or unrelated?',
    steps: [
      'Open the PHASE view: amber regions move up while violet regions move down.',
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
    predict: 'Twice the diameter at the same Hz — does the figure survive? And when you hunt for it again, will it be higher or lower, and by how much?',
    steps: [
      'This 160 mm disc is sitting on its first mode. Note the frequency.',
      'Raise SIZE to 320 mm without touching the frequency.',
      'Watch the pattern dissolve — the same Hz is no longer a resonance.',
      'Lower FREQ (or tap JUMP TO A MODE) until the same figure returns. Compare the two numbers.',
    ],
    lookFor: 'Doubling every horizontal dimension quarters the modal frequency (f ∝ 1/L²). The figure comes back at about one quarter of the original Hz.',
    studio: 'plate',
    preset: { id: 'diameter', spec: { shape: 'circle', material: 'aluminum', sizeMm: 160, thicknessMm: 1, exciter: { x: 0.85, y: 0.5 } }, freq: { kind: 'mode', index: 0 } },
  },
  {
    id: 'thickness',
    num: 5,
    title: 'How thickness changes resonance',
    goal: 'Double the thickness and find the same mode again.',
    predict: 'Twice the thickness: does the mode move up or down — and by how much?',
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
    predict: 'Steel is three times stiffer AND three times denser than aluminum. Will the mode move up, down, or stay put?',
    steps: [
      'Note the mode frequency in aluminum.',
      'Switch MATERIAL to steel. The figure dissolves — tap ‹ −0.1 % a few times and it returns barely 1 % lower: three times stiffer AND three times denser nearly cancel.',
      'Switch to acrylic: soft and heavily damped — the frequency drops and the figure blurs.',
      'Switch to solid wood and rotate the GRAIN: the modes re-order.',
    ],
    lookFor: 'Frequency follows √(E/ρ): stiffness raises it, density lowers it. Damping does not move the resonance — it broadens and blurs it.',
    studio: 'plate',
    preset: { id: 'materials', spec: { shape: 'square', material: 'aluminum', sizeMm: 240, thicknessMm: 1 }, freq: { kind: 'mode', index: 1 } },
  },
  {
    id: 'exciter',
    num: 7,
    title: 'Move the driver, suppress a mode',
    goal: 'A driver sitting on a nodal line cannot excite that mode.',
    predict: 'Slide the driver onto a nodal line: will the figure get stronger, weaker, or vanish?',
    steps: [
      'This plate is driven at its centre. Note which figure appears.',
      'In DRIVE, tap DRAG ON PLATE, then drag the driver onto one of the nodal lines.',
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
    predict: 'A guitar string’s modes land on 1 : 2 : 3 : 4. Write down what you expect this plate’s first four to be — then read the real ratios.',
    steps: [
      'Run the SWEEP and read the mode frequencies as it dwells on each.',
      'Divide each by the first: they are not 2, 3, 4… (WHAT THIS PLATE IS prints the ratios).',
      'Then open HARMONICS VS PLATE MODES from the lab home and compare the four ladders.',
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
    predict: 'A liquid has no edges to hold still the way a plate does. Will it still form a repeating pattern, or just churn?',
    steps: [
      'The dish starts just above threshold, driven at TWICE its lowest mode. Watch the RESP readout: half the drive.',
      'Switch VIEW to REFRACTION — the classic “light through the water” look.',
      'Nudge SHAKE up a little: the pattern sharpens; too far and it starts to break up.',
    ],
    lookFor: 'The surface oscillates at half the drive frequency — the subharmonic signature of Faraday waves. The pattern family depends on the dish size versus the wavelength: small dish → the dish’s own rings and lobes.',
    studio: 'liquid',
    liquid: { id: 'liquid-first-pattern', spec: { liquid: 'water', sizeMm: 100, depthMm: 4 }, hz: 40, driveMode: 0, accelG: 'onset', view: 'surface' },
  },
  {
    id: 'liquid-threshold',
    num: 10,
    title: 'Find the Faraday onset threshold',
    goal: 'Raise the shaking from zero until the flat surface first breaks into a pattern, and read the threshold.',
    predict: 'Raise the shake slowly from zero. Will the pattern fade in gradually, or appear suddenly at some level and not below it?',
    steps: [
      'Start with SHAKE near zero: the surface is flat and only rides the platform.',
      'Raise SHAKE slowly. Note the stages: sloshing or edge ripples first, all AT the drive frequency.',
      'The moment the ladder flips to PATTERN ONSET, compare NOW with THRESHOLD in the ladder card.',
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
    predict: 'A thicker liquid at the same shake — will the pattern come out sharper, dimmer, or not at all?',
    steps: [
      'Water at 60 Hz sits about 1.5× above threshold with a square lattice.',
      'In LIQUID, choose Glycerin–water 50/50. The pattern dims or vanishes: the threshold has climbed.',
      'Raise SHAKE until the pattern returns. Notice it now prefers stripes.',
    ],
    lookFor: 'Viscosity damps the wave, so onset needs more acceleration; higher viscosity also shifts the preferred lattice from squares toward stripes (the published phase map).',
    studio: 'liquid',
    liquid: { id: 'liquid-viscosity', spec: { liquid: 'water', sizeMm: 200, depthMm: 5 }, hz: 60, accelG: 0.18, view: 'surface' },
  },
  {
    id: 'liquid-depth',
    num: 12,
    title: 'Change the depth without changing the frequency',
    goal: 'Pour more liquid in and watch the wavelength and threshold move at a fixed drive.',
    predict: 'Same tone, deeper liquid — will the pattern get coarser, finer, or stay the same size?',
    steps: [
      'A 2 mm layer of water at 30 Hz: short waves, strongly damped by the bottom.',
      'In DISH, raise DEPTH to 8 mm, then 15 mm. Read λ on the bezel and THRESHOLD in the ladder card each time.',
      'Lower SHAKE until a/a꜀ reads about 1.4× again, then compare — the same margin above threshold, a different wavelength.',
    ],
    lookFor: 'In a thin layer the bottom boundary layer steals energy (higher threshold) and tanh(kd) shortens the wave. Deeper liquid approaches the deep-water dispersion and the threshold falls.',
    studio: 'liquid',
    liquid: { id: 'liquid-depth', spec: { liquid: 'water', sizeMm: 150, depthMm: 2 }, hz: 30, accelG: 0.3, view: 'height' },
  },
  // ── learning pass 2026-09-17 (D5, D6): the null result and the capstone ──
  {
    id: 'turn-it-up',
    num: 13,
    title: 'Turn it up',
    goal: 'Change only the drive level and watch what does — and does not — change.',
    predict: 'Louder drive: bigger motion for sure. Does the FIGURE change — different lines, or the same lines?',
    steps: [
      'The plate is parked on a mode with LEVEL at 20 %. Note the figure.',
      'Drag LEVEL up to 100 % and watch the sand and the 3D PLATE view.',
      'Bring it back down. Read the MODE on the bezel each time.',
    ],
    lookFor: 'Faster, cleaner formation and a bigger excursion — and the lines do not move. Level sets how FAR the plate moves, never WHICH mode it is on. That is set by the frequency and the plate.',
    studio: 'plate',
    preset: { id: 'turn-it-up', spec: { shape: 'square', material: 'aluminum', sizeMm: 240, thicknessMm: 1 }, freq: { kind: 'mode', index: 1 }, view: 'overlay' },
  },
  {
    id: 'one-frequency-three-plates',
    num: 14,
    title: 'One frequency, three plates',
    goal: 'Keep the frequency exactly where it is and change the plate three ways.',
    predict: 'This tone makes a clean figure on this plate. Change the material, then the size, then the thickness — how many of the three keep a figure at the SAME frequency?',
    steps: [
      'The plate is on a mode. Read the DRIVE frequency and do not touch it again.',
      'Switch MATERIAL to acrylic. Read RES.',
      'Switch back to aluminum and raise SIZE one step. Read RES.',
      'Switch SIZE back and raise THICKNESS one step. Read RES.',
    ],
    lookFor: 'Three times the plate changed, three times the same frequency stopped being a resonance. Nothing about the tone changed — the plate did. The pattern belongs to the whole system, not to the hertz.',
    studio: 'plate',
    preset: { id: 'one-frequency-three-plates', spec: { shape: 'square', material: 'aluminum', sizeMm: 240, thicknessMm: 1 }, freq: { kind: 'mode', index: 2 }, view: 'overlay' },
  },
  // ── Phase 3 — Membrane & Loudspeaker Studio ──────────────────────────────
  {
    id: 'drum-no-pitch',
    num: 15,
    title: 'Why a drum has no pitch — and a timpani does',
    goal: 'Read a bare drumhead’s mode ratios, then put a kettle under it.',
    predict: 'A string’s modes go 1 : 2 : 3. Guess the ratio of a drumhead’s second mode to its first — bigger or smaller than 2?',
    steps: [
      'Read the TUNING card: the ratios of the first modes to the fundamental.',
      'Run SWEEP THE MODES and watch each figure form on the head.',
      'In HEAD, tap TIMPANI KETTLE. Read the ratios again — they are measured against the (1,1) mode now.',
    ],
    lookFor: 'Bare head: 1 : 1.59 : 2.14 : 2.30 : 2.65 — not integers, no clear pitch. With the kettle the (1,1), (2,1), (3,1), (4,1) modes sit near 1 : 1.5 : 2 : 2.5 — a harmonic series missing its fundamental, and the ear supplies the pitch.',
    studio: 'membrane',
    membrane: { id: 'drum-no-pitch', spec: { head: 'mylar10', diameterMm: 660, tensionNpm: 4000, kettle: false, strike: { r: 0.25, thetaDeg: 0 } }, hz: { n: 1, s: 1 }, view: 'heat' },
  },
  {
    id: 'strike-point',
    num: 16,
    title: 'Strike the centre, strike a quarter in',
    goal: 'Move the mallet and watch which modes can be woken.',
    predict: 'The mallet is dead centre. Will the (1,1) mode — the timpani’s pitch — respond at all?',
    steps: [
      'The drive is parked on the (1,1) mode with the mallet at the CENTRE. Read RESPONSE on the bezel.',
      'In STRIKE, choose QUARTER IN. Read RESPONSE again and watch NODE LINES.',
      'Try NEAR THE RIM, then DRAG ON DRUM and slide the mallet across a nodal diameter.',
    ],
    lookFor: 'A centre strike sits on every nodal diameter, so it can only wake the ring modes — the dull thud. A quarter of the way in drives (1,1) strongly. A mode is excited in proportion to how much it moves under the mallet.',
    studio: 'membrane',
    membrane: { id: 'strike-point', spec: { head: 'mylar10', diameterMm: 355, tensionNpm: 3000, strike: { r: 0, thetaDeg: 0 } }, hz: { n: 1, s: 1 }, view: 'nodes' },
  },
  {
    id: 'speaker-breakup',
    num: 17,
    title: 'Find a loudspeaker’s breakup',
    goal: 'Sweep a cone from its resonance up until it stops moving as one.',
    predict: 'How high can an 8-inch paper cone go before it stops behaving as a single piston — hundreds of hertz, or thousands?',
    steps: [
      'The LOUDSPEAKER view shows a 200 mm woofer at 60 Hz. Run SWEEP THE CONE STAGES.',
      'Watch the cutaway and the front view; read the STAGE ladder as it climbs.',
      'In SPEAKER, switch to the 25 mm dome tweeter and sweep again.',
    ],
    lookFor: 'Piston motion holds through the bass; edge flexing arrives in the low mids, radial lobes above that, and breakup near 2 kHz for an 8" paper cone — a stiff metal dome stays pistonic to the top of hearing. Crossovers hand over below breakup for exactly this reason.',
    studio: 'membrane',
    membrane: { id: 'speaker-breakup', spec: {}, hz: 60, view: 'speaker', driver: 'woofer200' },
  },
];

export const PRESET_BY_ID: Record<string, StudioPreset> = Object.fromEntries(EXPERIMENTS.filter((e) => e.preset).map((e) => [e.preset!.id, e.preset!]));
/** The experiment that a studio preset belongs to — the studio keeps it in its well. */
export const MEMBRANE_PRESET_BY_ID: Record<string, MembranePreset> = Object.fromEntries(EXPERIMENTS.filter((e) => e.membrane).map((e) => [e.membrane!.id, e.membrane!]));
export const EXPERIMENT_BY_PRESET: Record<string, Experiment> = Object.fromEntries(EXPERIMENTS.map((e) => [e.preset?.id ?? e.liquid?.id ?? e.membrane?.id ?? e.id, e]));
export const LIQUID_PRESET_BY_ID: Record<string, LiquidPreset> = Object.fromEntries(EXPERIMENTS.filter((e) => e.liquid).map((e) => [e.liquid!.id, e.liquid!]));

/**
 * Where an experiment opens — the one place that maps an experiment to its
 * studio route + preset param. Used by the experiments module (module 8) and
 * by the in-studio PREV / NEXT, so the series can be run without going back.
 */
export function experimentRoute(e: Experiment): { route: 'CymaticsPlateStudio' | 'CymaticsLiquidStudio' | 'CymaticsMembraneStudio'; params: { preset: string } } {
  if (e.studio === 'liquid') return { route: 'CymaticsLiquidStudio', params: { preset: e.liquid!.id } };
  if (e.studio === 'membrane') return { route: 'CymaticsMembraneStudio', params: { preset: e.membrane!.id } };
  return { route: 'CymaticsPlateStudio', params: { preset: e.preset!.id } };
}
