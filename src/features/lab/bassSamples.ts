/**
 * bassSamples — the Bass Guitar Lab's real recordings (owner 2026-09-25:
 * "wire in the actual bass note recordings that are in the DB … it is still
 * using the sound generator instead of the samples we have ready and loaded").
 *
 * The `lab-audio` bucket holds 72 published `bass_fretboard` assets (all
 * public): 52 chromatic notes (four strings × frets 0–12), 16 natural
 * harmonics (four strings × ½ ⅓ ¼ ⅕) and 4 open strings. The keys follow a
 * fixed pattern, so the lab derives the key from its selection instead of
 * carrying a 72-row table. `test/bassSamples.test.ts` checks every derived
 * key against the published mapping (docs/lab_audio_asset_mapping_COMPLETED_
 * 2026-09-15.json), so a renamed asset fails the build, not the learner.
 */

export const BASS_LAB_KEY = 'bass_fretboard';

export type BassString = 'e' | 'a' | 'd' | 'g';

/** MIDI note of each open string (standard tuning, low → high). */
const OPEN_MIDI: Record<BassString, number> = { e: 28, a: 33, d: 38, g: 43 };

/** Pitch-class slugs as the assets were named (sharps, never flats). */
const NOTE_SLUG = ['c', 'csharp', 'd', 'dsharp', 'e', 'f', 'fsharp', 'g', 'gsharp', 'a', 'asharp', 'b'] as const;

/** Fretted note: `chromatic-bass-<string>-string-<fret>-fret-<note>`, frets 0–12. */
export function frettedSampleKey(string: BassString, fret: number): string {
  const f = Math.max(0, Math.min(12, Math.round(fret)));
  const slug = NOTE_SLUG[(OPEN_MIDI[string] + f) % 12];
  return `chromatic-bass-${string}-string-${f}-fret-${slug}`;
}

/** Natural harmonic n (2–5, touched at 1/n): `bass-<string>-string-<half|third|forth|fifth>-harmonic-<take>`.
 *  "forth" is how the files were named. The D string's half harmonic is take 3. */
const HARMONIC_WORD: Record<number, string> = { 2: 'half', 3: 'third', 4: 'forth', 5: 'fifth' };
export function harmonicSampleKey(string: BassString, n: number): string | null {
  const word = HARMONIC_WORD[n];
  if (!word) return null;
  const take = string === 'd' && n === 2 ? 3 : 1;
  return `bass-${string}-string-${word}-harmonic-${take}`;
}

/** The open string as recorded on its own: `bass-<string>-open-1`. */
export function openSampleKey(string: BassString): string {
  return `bass-${string}-open-1`;
}
