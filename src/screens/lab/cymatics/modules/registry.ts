/**
 * Cymatics Lab module registry — the non-studio screens (Phase 1). The
 * studio itself is its own route (CymaticsPlateStudio). Planned phases are
 * listed on the home as dimmed rows, never as modules.
 */
export type CymaticsModuleId = 'intro' | 'nodes' | 'harmonics' | 'harmony' | 'systems' | 'change' | 'myth' | 'experiments';

export const CYMATICS_MODULES: { id: CymaticsModuleId; title: string; blurb: string }[] = [
  { id: 'intro', title: 'What Is Cymatics?', blurb: 'Sound as pressure and vibration; how vibration moves sand, powder and liquid; nodes, antinodes and why stable patterns appear at resonance.' },
  { id: 'nodes', title: 'Nodes, Antinodes & Modes', blurb: 'Interactive: pick a mode, see its still lines, its opposite-phase regions and its shape — every stable figure is one normal mode.' },
  { id: 'harmonics', title: 'Harmonics vs Plate Modes', blurb: 'String · air column · membrane · plate — why only the first two form a harmonic series, and why Chladni figures are not pictures of chords.' },
  { id: 'harmony', title: 'Harmony in Motion', blurb: 'Frequency ratios made visible and audible — wave addition, Lissajous figures, spectra and beats — kept honestly apart from plate modes.' },
  { id: 'systems', title: 'Other Cymatic Systems', blurb: 'Strings, air columns, water surfaces, a loudspeaker with particles, bells and gongs, acoustic levitation — what is actually vibrating in each.' },
  { id: 'change', title: 'Change One Thing', blurb: 'Two plates, one locked tone, every control identical but one — the discovery tool for the lab’s central principle.' },
  { id: 'myth', title: 'Evidence vs Myth', blurb: 'What the patterns genuinely show, what they do not, and why every pattern in this lab is labelled Simulation.' },
  { id: 'experiments', title: 'Guided Experiments', blurb: 'Seventeen structured activities — predict first, then open the studio in exactly the situation each step describes.' },
];

/** Later phases — shown on the lab home as planned rows (no promises, no dates).
 *  EMPTY since Phase 4 (2026-09-17): every area of the spec is live —
 *  Liquid (Phase 2), Membrane / Harmony / Systems / Change One Thing
 *  (Phase 3), Pattern Gallery & Art Studio (Phase 4). The home hides the
 *  section while this is empty; a future area goes back in as a dimmed row. */
export const PLANNED_AREAS: { title: string; blurb: string }[] = [];
