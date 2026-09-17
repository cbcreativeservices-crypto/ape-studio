/**
 * Cymatics Lab module registry — the non-studio screens (Phase 1). The
 * studio itself is its own route (CymaticsPlateStudio). Planned phases are
 * listed on the home as dimmed rows, never as modules.
 */
export type CymaticsModuleId = 'intro' | 'nodes' | 'harmonics' | 'myth' | 'experiments';

export const CYMATICS_MODULES: { id: CymaticsModuleId; title: string; blurb: string }[] = [
  { id: 'intro', title: 'What Is Cymatics?', blurb: 'Sound as pressure and vibration; how vibration moves sand, powder and liquid; nodes, antinodes and why stable patterns appear at resonance.' },
  { id: 'nodes', title: 'Nodes, Antinodes & Modes', blurb: 'Interactive: pick a mode, see its still lines, its opposite-phase regions and its shape — every stable figure is one normal mode.' },
  { id: 'harmonics', title: 'Harmonics vs Plate Modes', blurb: 'String · air column · membrane · plate — why only the first two form a harmonic series, and why Chladni figures are not pictures of chords.' },
  { id: 'myth', title: 'Evidence vs Myth', blurb: 'What the patterns genuinely show, what they do not, and why every pattern in this lab is labelled Simulation.' },
  { id: 'experiments', title: 'Guided Experiments', blurb: 'Eight structured activities that open the studio in exactly the situation each step describes.' },
];

/** Later phases — shown on the lab home as planned rows (no promises, no dates). */
export const PLANNED_AREAS: { title: string; blurb: string }[] = [
  // Liquid Cymatics Studio — LIVE (Phase 2, 2026-09-16); removed from here.
  { title: 'Membrane & Loudspeaker', blurb: 'Circular membrane modes and a loudspeaker cone from piston motion to breakup.' },
  { title: 'Harmony in Motion', blurb: 'Ratios, beats, wave addition, Lissajous figures and spectra — driving the physical simulation.' },
  { title: 'Other Cymatic Systems', blurb: 'Strings, water surfaces, air columns, bells, gongs and cymbals — what is actually vibrating in each.' },
  { title: 'Change One Thing', blurb: 'Split-screen comparisons with every control locked but one.' },
  { title: 'Pattern Gallery & Art Studio', blurb: 'Save, colour, compare and print patterns — art prints and lab sheets.' },
];
