/**
 * Cymatics Lab — liquids for the Faraday studio (spec §1.4). Handbook values
 * at 20 °C; the lab teaches TRENDS (viscosity raises the onset threshold and
 * favours stripes; surface tension shortens the wavelength; density enters
 * the capillary term) and every rendered result is labelled Approximated.
 *
 * Descriptive ↔ scientific pairs (owner spec §2 table): the studio shows the
 * plain-words control AND the property it stands for, side by side.
 *   Consistency → viscosity · Liquid amount → depth · Surface "tightness" →
 *   surface tension · Liquid weight → density · Speaker strength → vertical
 *   acceleration · Frequency → driving frequency.
 */
export type LiquidId = 'water' | 'saltwater' | 'glycerin50' | 'silicone10' | 'mineral_light' | 'oil_thick' | 'gel' | 'cornstarch';

export type Liquid = {
  id: LiquidId;
  label: string;
  /** Density, kg/m³. */
  rho: number;
  /** Dynamic viscosity, Pa·s (20 °C). */
  mu: number;
  /** Surface tension, N/m. */
  sigma: number;
  /** Plain-words consistency word for the descriptive control. */
  consistency: 'thin' | 'medium' | 'thick' | 'very thick' | 'shear-thickening';
  blurb: string;
  /** Visual tint of the liquid (top view base colour) + how reflective it looks. */
  tint: string;
  gloss: number;
  /** Non-Newtonian: effective viscosity rises with acceleration (cornstarch). */
  shearThickening?: boolean;
};

export const LIQUIDS: readonly Liquid[] = [
  { id: 'water', label: 'Water', rho: 998, mu: 0.001, sigma: 0.0728, consistency: 'thin', blurb: 'The reference liquid: low viscosity, high surface tension — patterns appear at modest shaking and hold sharp edges.', tint: '#1d5f8f', gloss: 0.95 },
  { id: 'saltwater', label: 'Salt water', rho: 1025, mu: 0.00108, sigma: 0.0735, consistency: 'thin', blurb: 'Slightly denser and a touch more viscous than fresh water — nearly identical patterns, a hair higher threshold.', tint: '#1b5a86', gloss: 0.95 },
  { id: 'glycerin50', label: 'Glycerin–water 50/50', rho: 1126, mu: 0.006, sigma: 0.067, consistency: 'medium', blurb: 'Six times water’s viscosity: the onset threshold climbs and stripes replace squares.', tint: '#3a5f7a', gloss: 0.8 },
  { id: 'silicone10', label: 'Silicone oil (10 cSt)', rho: 930, mu: 0.0093, sigma: 0.0201, consistency: 'medium', blurb: 'Low surface tension shortens the wavelength; moderate viscosity gives clean stripes near onset.', tint: '#6b6f6a', gloss: 0.85 },
  { id: 'mineral_light', label: 'Light mineral oil', rho: 850, mu: 0.02, sigma: 0.03, consistency: 'medium', blurb: 'Twenty times water’s viscosity — you need a strong shake, and the patterns are broad, soft stripes.', tint: '#8a7a3c', gloss: 0.8 },
  { id: 'oil_thick', label: 'Thick oil', rho: 900, mu: 0.2, sigma: 0.032, consistency: 'thick', blurb: 'Two hundred times water: the surface mostly follows the platform. Faraday patterns need more acceleration than this rig provides.', tint: '#6d5a1f', gloss: 0.7 },
  { id: 'gel', label: 'Gel-like fluid', rho: 1050, mu: 1.0, sigma: 0.06, consistency: 'very thick', blurb: 'Viscous damping wins everywhere in this rig’s range — an honest “no pattern” result.', tint: '#4f6b5a', gloss: 0.5 },
  { id: 'cornstarch', label: 'Cornstarch + water', rho: 1200, mu: 0.05, sigma: 0.06, consistency: 'shear-thickening', blurb: 'Non-Newtonian: the harder it is shaken, the stiffer it gets. Ripples damp out instead of organising; the famous “holes and fingers” appear only far above this rig’s range.', tint: '#b9b09a', gloss: 0.35, shearThickening: true },
];

export const LIQUID_BY_ID: Record<LiquidId, Liquid> = Object.fromEntries(LIQUIDS.map((l) => [l.id, l])) as Record<LiquidId, Liquid>;

/** Kinematic viscosity ν = μ/ρ, m²/s, with the advanced TEMPERATURE control:
 *  viscosity of water-like liquids falls ~2.5 %/°C (Approximated). */
export function kinematicViscosity(l: Liquid, tempC = 20): number {
  const f = Math.exp(-0.025 * (tempC - 20));
  return (l.mu * f) / l.rho;
}

/** Surface tension drifts slightly with temperature (−0.15 mN/m per °C for water). */
export function surfaceTension(l: Liquid, tempC = 20): number {
  return Math.max(0.01, l.sigma - 0.00015 * (tempC - 20));
}

export const TEMPERATURES = [10, 20, 40, 60] as const;

/** The descriptive ↔ scientific pairing table shown in the LIQUID tray. */
export const CONTROL_PAIRS: { student: string; science: string }[] = [
  { student: 'Consistency', science: 'Viscosity μ (Pa·s) → ν = μ/ρ' },
  { student: 'Liquid amount', science: 'Depth d (mm)' },
  { student: 'Surface “tightness”', science: 'Surface tension σ (N/m)' },
  { student: 'Liquid weight', science: 'Density ρ (kg/m³)' },
  { student: 'Speaker strength', science: 'Vertical acceleration a (g)' },
  { student: 'Frequency', science: 'Driving frequency f (Hz)' },
];
