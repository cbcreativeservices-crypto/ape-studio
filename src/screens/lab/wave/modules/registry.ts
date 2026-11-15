/**
 * Wave Physics Lab module registry — the 15 spec modules (v4 §9.1–9.15) plus
 * the Room Builder (§9.16). Components live in modWaveA/modWaveB, mapped by
 * WaveModuleScreen.
 */
export type WaveModuleId =
  | 'builder'
  | 'reflection' | 'absorption' | 'diffusion' | 'refraction' | 'diffraction'
  | 'interference' | 'comb' | 'standing'
  | 'coverage' | 'linearray' | 'delayalign' | 'cardioidsub' | 'beamsteer'
  | 'echo' | 'reverb';

export const WAVE_MODULES: { id: WaveModuleId; num: string; title: string; blurb: string }[] = [
  { id: 'reflection', num: '1', title: 'Reflection Visualizer', blurb: 'Law of reflection, first reflections, path lengths, the image-source idea.' },
  { id: 'absorption', num: '2', title: 'Absorption Laboratory', blurb: 'Materials, α by frequency, RT60 — and why bass is harder to absorb.' },
  { id: 'diffusion', num: '3', title: 'Diffusion Laboratory', blurb: 'Specular vs diffuse: scattering preserves energy — it doesn’t remove it.' },
  { id: 'refraction', num: '4', title: 'Refraction Laboratory', blurb: 'Temperature gradients bend sound — why it carries at night and over water.' },
  { id: 'diffraction', num: '5', title: 'Diffraction Laboratory', blurb: 'Lows wrap around barriers; highs cast shadows. Wavelength intuition.' },
  { id: 'interference', num: '6', title: 'Interference Laboratory', blurb: 'Two sources: constructive, destructive, nulls and lobes — live.' },
  { id: 'comb', num: '7', title: 'Comb Filtering Laboratory', blurb: 'One reflection + the direct sound. "Move the microphone six inches."' },
  { id: 'standing', num: '8', title: 'Standing Wave Laboratory', blurb: 'Room modes: axial and tangential — pressure maps you can walk through.' },
  { id: 'coverage', num: '9', title: 'Loudspeaker Coverage', blurb: 'Directivity narrows with frequency — aim the pattern, not the cabinet.' },
  { id: 'linearray', num: '10', title: 'Line Array Laboratory', blurb: 'Splay, box count and height shape coverage — coupling lows, beaming highs.' },
  { id: 'delayalign', num: '11', title: 'Delay Alignment', blurb: 'Sub + main: watch the null vanish as the wavefronts align.' },
  { id: 'cardioidsub', num: '12', title: 'Cardioid Subwoofer', blurb: 'Two subs, one delay, one polarity flip: energy forward, cancellation behind.' },
  { id: 'beamsteer', num: '13', title: 'Beam Steering', blurb: 'DSP delays tilt the beam without moving the box.' },
  { id: 'echo', num: '14', title: 'Echo Laboratory', blurb: 'Discrete echoes vs fused reflections — the ~50 ms threshold.' },
  { id: 'reverb', num: '15', title: 'Reverberation Laboratory', blurb: 'Direct → early → late → diffuse: reverb as a buildup, not a thing.' },
  // Room Builder last: it combines every concept the other modules isolate (owner 2026-08-01).
  { id: 'builder', num: '16', title: 'Room Builder', blurb: 'The full room model: build a room, place sources and a listener, toggle every layer.' },
];

/**
 * The home list in plain words (owner 2026-11-15, "build waves 1 thru 3", D62
 * item WA-06): four plain groups instead of one long "MODULES 1–15" list, and
 * a few plain words under each name (the row's one-line blurb still opens on
 * a tap). The Room Builder keeps its own heading, PUT IT ALL TOGETHER.
 */
export const WAVE_PLAIN: Readonly<Record<WaveModuleId, string>> = {
  reflection: 'how sound bounces off walls',
  absorption: 'how soft walls soak up sound',
  diffusion: 'how bumpy walls scatter sound',
  refraction: 'how warm and cool air bend sound',
  diffraction: 'how sound wraps around things',
  interference: 'how two sounds add or cancel',
  comb: 'a sound plus its own reflection',
  standing: 'bass notes that pile up in a room',
  coverage: 'where one speaker’s sound reaches',
  linearray: 'a tall column of speakers',
  delayalign: 'making two speakers arrive together',
  cardioidsub: 'sending bass forward, not back',
  beamsteer: 'tilting the sound with delays',
  echo: 'when a bounce becomes an echo',
  reverb: 'how a room keeps ringing',
  builder: 'every idea, in one room',
};

export const WAVE_GROUPS: readonly { title: string; ids: readonly WaveModuleId[] }[] = [
  { title: 'SOUND MEETS A WALL', ids: ['reflection', 'absorption', 'diffusion'] },
  { title: 'SOUND BENDS AND ADDS UP', ids: ['refraction', 'diffraction', 'interference', 'comb', 'standing'] },
  { title: 'SPEAKERS', ids: ['coverage', 'linearray', 'delayalign', 'cardioidsub', 'beamsteer'] },
  { title: 'ECHO AND REVERB', ids: ['echo', 'reverb'] },
];
