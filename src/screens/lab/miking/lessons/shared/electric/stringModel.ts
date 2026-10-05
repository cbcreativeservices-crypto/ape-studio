/**
 * A VIBRATING STRING and the MAGNETIC PICKUP under it — the physics the
 * amplified-chain lessons draw on HOW IT SOUNDS (LESSON_JOURNEY §7, strings:
 * "standing waves on a string (fixed ends, harmonics) — a model to add, pure
 * and tested, before it is drawn"). FULLY SILENT: shown, never played.
 *
 * The IDEAL string (textbook; e.g. any acoustics text's "string fixed at both
 * ends"): length L between its two fixed ends (the nut — or a steel's bar —
 * and the bridge). Its n-th mode has the shape sin(nπx/L) and the frequency
 * n·f1 (harmonics, ideally exact; real strings run slightly sharp — a
 * simplification, said once on screen).
 *
 *   f1 = (1 / 2L)·√(T/μ)       so f ∝ 1/L at fixed tension, and f ∝ √T
 *
 * A POINT pickup at distance q from the bridge senses mode n in proportion to
 * |sin(nπq/L)|: nothing at a node, most at an antinode. That one factor is why
 * a pickup near the bridge hears the upper harmonics relatively strongly and
 * the fundamental weakly, and a pickup further up hears more fundamental —
 * "bridge brighter, neck rounder". (A real pickup senses a short stretch of
 * string and responds to its velocity; the position factor is the part this
 * lab draws.)
 *
 * A PLUCK at distance p from the bridge (an ideal triangle release) excites
 * mode n with amplitude ∝ |sin(nπp/L)| / n².
 *
 * Pitch and tension (pedal steel): a pedal or knee lever pulls a string
 * tighter or lets it slacken at the changer. Raising a note by s semitones
 * multiplies the frequency by 2^(s/12), so the TENSION by 2^(s/6) (a whole
 * tone: × 1.26). A bar at distance b from the nut leaves L − b speaking:
 * f = f_open · L / (L − b) — at half the string, the octave.
 *
 * Equal-tempered note frequencies: f = 440 · 2^((m − 69)/12) (MIDI m; the
 * shared PHYS-ET key in docs/labs/miking/acoustic_guitar/SOURCES.md).
 */

/** Equal temperament, A4 = 440 Hz. */
export function noteHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** The open low strings the lessons name (Hz). */
export const LOW_E_GUITAR = noteHz(40); // E2 ≈ 82.41
export const LOW_E_BASS = noteHz(28); // E1 ≈ 41.20
export const LOW_B_BASS = noteHz(23); // B0 ≈ 30.87

/** Mode n's displacement shape at position x (from the bridge), unit peak. */
export function modeShape(n: number, x: number, L: number): number {
  return Math.sin((n * Math.PI * x) / L);
}

/** How strongly a point pickup at q (from the bridge) senses mode n: 0…1. */
export function pickupWeight(n: number, q: number, L: number): number {
  return Math.abs(Math.sin((n * Math.PI * q) / L));
}

/** The pickup's weights for modes 1…N, each relative to its own fundamental weight. */
export function pickupWeights(q: number, L: number, N = 8): number[] {
  return Array.from({ length: N }, (_, i) => pickupWeight(i + 1, q, L));
}

/** An ideal pluck at p (from the bridge): mode n's relative amplitude. */
export function pluckAmp(n: number, p: number, L: number): number {
  return Math.abs(Math.sin((n * Math.PI * p) / L)) / (n * n);
}

/** The nodes of mode n between the ends (positions from the bridge, mm). */
export function nodesOf(n: number, L: number): number[] {
  return Array.from({ length: n - 1 }, (_, k) => ((k + 1) * L) / n);
}

/** Is a pickup at q within `tol` mm of a node of mode n? */
export function atNode(n: number, q: number, L: number, tol = 6): boolean {
  return nodesOf(n, L).some((x) => Math.abs(x - q) <= tol);
}

/** A bar (or fret) b mm from the nut: the speaking length's pitch. */
export function barHz(fOpen: number, L: number, b: number): number {
  return (fOpen * L) / Math.max(1e-6, L - b);
}

/** Where to put the bar for `semis` above the open note (mm from the nut). */
export function barFor(semis: number, L: number): number {
  return L * (1 - Math.pow(2, -semis / 12));
}

/** The tension ratio that raises a string by `semis` semitones (f ∝ √T). */
export function tensionRatio(semis: number): number {
  return Math.pow(2, semis / 6);
}

/** Cents between two frequencies. */
export function centsBetween(f0: number, f1: number): number {
  return 1200 * Math.log2(f1 / f0);
}
