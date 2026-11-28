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
  'A Professional Engineer license is commonly required to offer engineering services to the public or to stamp (seal) official reports.';

/**
 * THE licensing warning (Comp A text review 2026-11-14, Pattern 6). The results card, the family
 * page's example list and an expanded title row carried three versions of it; this is the one
 * text, shown in all three places. It keeps every requirement word the three had and adds who
 * to check with. Owner rule: "we must be clear when other education — degrees, certifications,
 * etc. — is required for careers. always. every time."
 */
export const LICENSED_WARNING =
  '⚠ Licensed, credentialed or restricted-entry occupation in many places. Academy study supports the audio knowledge it uses but does not lead to the license or credential. Check the requirements with the licensing body or employer where you live.';

/** Follows a title's own education note ("⚠ {title}: {note} …"). A period, not a dash (Pattern 7). */
export const EDUCATION_NOT_REPLACED = 'Academy study does not replace it. Check what is required where you live.';

/** Under every expanded title, after its status (Comp A text review 2026-11-14, CF-A0219): a stated
 *  requirement is required. It replaced "Common pathways are described, not mandatory requirements". */
export const PREPARATION_ROUTES_NOTE =
  'Preparation shows common routes. Where it says a degree, license or certification is required, it is required.';

/** Straight or curly apostrophe: the index keeps the straight one, the screen shows the curly one. */
const GRADUATE = /master['’]s|doctorate|law degree|graduate degree/i;

/**
 * A preparation line as the screen shows it (Comp A text review 2026-11-14, Pattern 9 and
 * CF-D0069–D0073). The index keeps the workbook's punctuation, because the build script matches
 * some of those strings exactly; the screen shows curly apostrophes and quotes and no stray space
 * after "/", like the rest of the screen text. Words are never changed here.
 */
export function prepForDisplay(prep: string): string {
  return prep
    .replace(/\/ /g, '/')
    .replace(/(^|[\s(])'([^']+)'(?=[\s;,.)]|$)/g, '$1“$2”')
    .replace(/'/g, '’');
}

export function furtherEducation(c: EducationFacts): string | null {
  if (c.regulated) return null;
  if (c.professionalEngineer) return PE_NOTE;
  if (GRADUATE.test(c.preparation)) return `Typical preparation: ${prepForDisplay(c.preparation)}.`;
  return null;
}

/**
 * The collapsed-row chip for the same requirement (owner 2026-10-02: "always
 * disclose the education a career requires"). A LICENSED title already wears
 * its own chip, so this returns null for it; otherwise "PE LICENSE" for the
 * Professional Engineer licence, "DEGREE REQUIRED" for a graduate-degree
 * preparation (every such preparation needs at least a degree, so the short
 * word stays true even for "Bachelor's to doctorate").
 */
// "DEGREE REQUIRED", not "DEGREE REQ." (Comp A text review 2026-11-14, CF-A0597): beginners may
// not read the abbreviation, and the other chips are spelled out.
export function educationChip(c: EducationFacts): 'PE LICENSE' | 'DEGREE REQUIRED' | null {
  if (c.regulated) return null;
  if (c.professionalEngineer) return 'PE LICENSE';
  if (GRADUATE.test(c.preparation)) return 'DEGREE REQUIRED';
  return null;
}
