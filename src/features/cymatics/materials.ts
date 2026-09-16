/**
 * Cymatics Lab — plate materials (spec §1.1). Engineering constants used by
 * the frequency law f = (λ²/2πa²)·√(D/ρh), D = E h³ / 12(1−ν²).
 *
 * Values are representative handbook figures (room temperature). The lab
 * teaches TRENDS — stiffer ↑ f, denser ↓ f — and every rendered frequency is
 * labelled Approximated, so ±10 % handbook spread is inside the honesty
 * envelope. Q is the material's typical modal quality factor for a free thin
 * plate (metals ring, polymers and wood damp); the user's DAMPING control
 * scales it further.
 *
 * SOLID WOOD is ORTHOTROPIC (owner 2026-09-16): stiffness along the grain
 * (E∥) is ~10× the stiffness across it (E⊥), so a rotatable grain axis
 * visibly re-orders the plate's modes. Plywood's cross-laminated plies are
 * modelled quasi-isotropic.
 */
export type MaterialId = 'aluminum' | 'steel' | 'brass' | 'copper' | 'acrylic' | 'glass' | 'plywood' | 'wood';

export type Material = {
  id: MaterialId;
  label: string;
  /** Young's modulus, GPa. For wood this is E∥ (along the grain). */
  E: number;
  /** Across-grain modulus, GPa — orthotropic materials only. */
  Eperp?: number;
  /** Density, kg/m³. */
  rho: number;
  /** Poisson's ratio. */
  nu: number;
  /** Typical modal Q of a free thin plate. */
  Q: number;
  /** One line for the tray. */
  blurb: string;
  /** Visual: plate face colour + edge colour for the illustrated plate. */
  face: string;
  edge: string;
  /** Visual: brushed / grain texture kind. */
  texture: 'brushed' | 'polished' | 'matte' | 'glass' | 'grain';
};

export const MATERIALS: readonly Material[] = [
  { id: 'aluminum', label: 'Aluminum', E: 69, rho: 2700, nu: 0.33, Q: 800, blurb: 'The classic Chladni plate: light, stiff, rings clearly.', face: '#b9bec4', edge: '#7d848c', texture: 'brushed' },
  { id: 'steel', label: 'Steel', E: 200, rho: 7850, nu: 0.30, Q: 1000, blurb: 'Three times stiffer than aluminum but three times denser — modes land close to aluminum’s.', face: '#9aa0a8', edge: '#5f666e', texture: 'brushed' },
  { id: 'brass', label: 'Brass', E: 100, rho: 8500, nu: 0.34, Q: 600, blurb: 'Dense and moderately stiff: lower resonances than aluminum at the same size.', face: '#c8a85a', edge: '#8a6f2e', texture: 'polished' },
  { id: 'copper', label: 'Copper', E: 117, rho: 8960, nu: 0.34, Q: 500, blurb: 'Densest of the metals here — every mode drops in pitch.', face: '#c47d5a', edge: '#7e4a30', texture: 'polished' },
  { id: 'acrylic', label: 'Acrylic', E: 3.2, rho: 1180, nu: 0.37, Q: 40, blurb: 'Flexible and heavily damped: patterns are blurry and resonances broad.', face: '#d6e3ee', edge: '#8fa3b3', texture: 'glass' },
  { id: 'glass', label: 'Glass', E: 70, rho: 2500, nu: 0.22, Q: 700, blurb: 'As stiff as aluminum, slightly lighter, low Poisson ratio.', face: '#cfe7ea', edge: '#79a9ae', texture: 'glass' },
  { id: 'plywood', label: 'Plywood', E: 10, rho: 600, nu: 0.30, Q: 60, blurb: 'Cross-laminated plies average out the grain: treated as quasi-isotropic.', face: '#c9a877', edge: '#8c6f45', texture: 'matte' },
  { id: 'wood', label: 'Solid wood', E: 12, Eperp: 0.9, rho: 450, nu: 0.30, Q: 80, blurb: 'Spruce-class tonewood — ~10× stiffer along the grain than across it. Rotate the grain and watch the modes re-order.', face: '#d2b07a', edge: '#96703f', texture: 'grain' },
];

export const MATERIAL_BY_ID: Record<MaterialId, Material> = Object.fromEntries(MATERIALS.map((m) => [m.id, m])) as Record<MaterialId, Material>;
