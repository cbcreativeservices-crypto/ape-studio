/**
 * Cymatics Lab — frequency ↔ musical readout (spec §3 "Frequency readout
 * everywhere"): nearest note, octave, cents, and the wavelength in air.
 * Equal temperament, A4 = 440 Hz. Import-free so node:test covers it.
 */
const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;

export type NoteReadout = {
  /** e.g. "A" */
  name: string;
  /** Scientific octave number (A4 = 4). */
  octave: number;
  /** Signed cents from the nearest note, rounded. */
  cents: number;
  /** "A4", "F♯3". */
  label: string;
  /** "+12¢" / "−7¢" / "0¢". */
  centsLabel: string;
};

/** Nearest equal-tempered note to `hz` (A4 = 440). */
export function nearestNote(hz: number): NoteReadout {
  if (!(hz > 0)) return { name: '—', octave: 0, cents: 0, label: '—', centsLabel: '' };
  const midi = 69 + 12 * Math.log2(hz / 440);
  const nearest = Math.round(midi);
  const cents = Math.round((midi - nearest) * 100);
  const name = NAMES[((nearest % 12) + 12) % 12];
  const octave = Math.floor(nearest / 12) - 1;
  const centsLabel = cents === 0 ? '0¢' : `${cents > 0 ? '+' : '−'}${Math.abs(cents)}¢`;
  return { name, octave, cents, label: `${name}${octave}`, centsLabel };
}

/** Speed of sound in air at 20 °C, m/s. */
export const C_AIR = 343;

/** Wavelength in air, metres. */
export function wavelengthAir(hz: number): number {
  return hz > 0 ? C_AIR / hz : 0;
}

/** Human-friendly wavelength: "78 cm", "1.2 m", "8.6 mm". */
export function formatWavelength(m: number): string {
  if (!(m > 0)) return '—';
  if (m >= 1) return `${m.toFixed(m >= 10 ? 0 : 1)} m`;
  if (m >= 0.01) return `${(m * 100).toFixed(0)} cm`;
  return `${(m * 1000).toFixed(1)} mm`;
}

/** "440 Hz" / "1.20 kHz" — the readout style shared by the labs. */
export function formatHz(hz: number): string {
  if (hz >= 1000) return `${(hz / 1000).toFixed(hz >= 10000 ? 1 : 2)} kHz`;
  if (hz >= 100) return `${hz.toFixed(0)} Hz`;
  return `${hz.toFixed(1)} Hz`;
}
