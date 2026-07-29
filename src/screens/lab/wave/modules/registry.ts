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
  { id: 'builder', num: '◎', title: 'Room Builder', blurb: 'The engine itself: build a room, place sources and a listener, toggle every layer.' },
  { id: 'reflection', num: '1', title: 'Reflection Visualizer', blurb: 'Law of reflection, first reflections, path lengths, the image-source idea.' },
  { id: 'absorption', num: '2', title: 'Absorption Laboratory', blurb: 'Materials, α by frequency, RT60 — and why bass is harder to absorb.' },
  { id: 'diffusion', num: '3', title: 'Diffusion Laboratory', blurb: 'Specular vs diffuse: scattering preserves energy — it doesn’t remove it.' },
  { id: 'refraction', num: '4', title: 'Refraction Laboratory', blurb: 'Temperature gradients bend sound — why it carries at night and over water.' },
  { id: 'diffraction', num: '5', title: 'Diffraction Laboratory', blurb: 'Lows wrap around barriers; highs cast shadows. Wavelength intuition.' },
  { id: 'interference', num: '6', title: 'Interference Laboratory', blurb: 'Two sources: constructive, destructive, nulls and lobes — live.' },
  { id: 'comb', num: '7', title: 'Comb Filtering Laboratory', blurb: 'One reflection + the direct sound. "Move the microphone six inches."' },
  { id: 'standing', num: '8', title: 'Standing Wave Laboratory', blurb: 'Room modes: axial, tangential, oblique — pressure maps you can walk through.' },
  { id: 'coverage', num: '9', title: 'Loudspeaker Coverage', blurb: 'Directivity narrows with frequency — aim the pattern, not the cabinet.' },
  { id: 'linearray', num: '10', title: 'Line Array Laboratory', blurb: 'Splay, box count and height shape coverage — coupling lows, beaming highs.' },
  { id: 'delayalign', num: '11', title: 'Delay Alignment', blurb: 'Sub + main: watch the null vanish as the wavefronts align.' },
  { id: 'cardioidsub', num: '12', title: 'Cardioid Subwoofer', blurb: 'Two subs, one delay: energy forward, cancellation behind.' },
  { id: 'beamsteer', num: '13', title: 'Beam Steering', blurb: 'DSP delays tilt the beam without moving the box.' },
  { id: 'echo', num: '14', title: 'Echo Laboratory', blurb: 'Discrete echoes vs fused reflections — the ~50 ms threshold.' },
  { id: 'reverb', num: '15', title: 'Reverberation Laboratory', blurb: 'Direct → early → late → diffuse: reverb as a buildup, not a thing.' },
];
