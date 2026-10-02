/**
 * Required education BEYOND a licence (full-app run 1, 2026-10-01).
 *
 * The owner's hard rule: "We must be clear when other education — degrees,
 * certifications, etc. — is required for careers. Always. Every time."
 *
 * The family example titles were disclosed only when the index flags them
 * `regulated` (licensed / credentialed). Two other kinds of requirement the
 * index ALSO records were printed bare on the results and family screens:
 *
 *   • the Professional Engineer licence (`pe`) — Acoustical Consultant,
 *     Noise-Control Engineer and Vibration Consultant are examples on the
 *     Architectural Acoustics family card;
 *   • a graduate degree in the index's own preparation text — Music Librarian
 *     ("MLS/MLIS typically required"), Audio Archivist, and the research
 *     scientist titles ("Bachelor's to doctorate").
 *
 * Pure (no JSON import) so the node:test suite can exercise it directly.
 * Regulated titles return null: they already carry the licensed note.
 */
export type EducationFacts = { regulated: boolean; professionalEngineer: boolean; preparation: string };

export const PE_NOTE =
  'A Professional Engineer licence is commonly required to offer engineering services to the public or seal reports.';

const GRADUATE = /master's|doctorate|law degree|graduate degree/i;

export function furtherEducation(c: EducationFacts): string | null {
  if (c.regulated) return null;
  if (c.professionalEngineer) return PE_NOTE;
  if (GRADUATE.test(c.preparation)) return `Typical preparation: ${c.preparation.replace(/\/ /g, '/')}.`;
  return null;
}
