/**
 * Career Finder text fixes from Comp A's text review (2026-11-14), applied on the owner's word:
 * "assign an agent in the background to work on this".
 *
 * Pins the key fixes:
 *   1. the "I don't know" line under WHAT THESE MEAN branches for one vs many (CF-A0108–A0110, must
 *      fix: it read "1 of 28 answers were …");
 *   2. ONE licensing warning in all three places (Pattern 6);
 *   3. the softened requirement lines are now explicit (CF-D0045 SLPA, CF-D0056 audiologists,
 *      CF-D0062 speech-language pathology and allied clinical titles, CF-A0219 under every title).
 *
 * Owner rule behind 2 and 3: "we must be clear when other education — degrees, certifications,
 * etc. — is required for careers. always. every time."
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { QUESTIONS, type QuestionId } from '../src/features/careerfinder/questions.ts';
import { unknownNote, explainFamily, dimensionScores, clarityCopy, CLARITY_LABEL, type Responses } from '../src/features/careerfinder/scoring.ts';
import { FAMILIES } from '../src/features/careerfinder/families.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const edu = await import('../src/features/careerfinder/educationNote.ts');

/** Every question answered "Like" (3), then the given ids set to "I don't know" (null). */
function answers(unknown: QuestionId[]): Responses {
  const r: Responses = {};
  for (const q of QUESTIONS) r[q.id] = unknown.includes(q.id) ? null : 3;
  return r;
}
/** The two question ids of one dimension, and one id from a different dimension. */
const dimOf = QUESTIONS[0].dimension;
const sameDim = QUESTIONS.filter((q) => q.dimension === dimOf).map((q) => q.id);
const otherDim = QUESTIONS.find((q) => q.dimension !== dimOf)!.id;

describe('1. the "I don’t know" line agrees with its numbers (CF-A0108–A0110)', () => {
  it('none: no line at all', () => {
    assert.equal(unknownNote(answers([])), null);
  });
  it('one answer: one activity, no dashed bar, never "answers were"', () => {
    const s = unknownNote(answers([sameDim[0]]))!;
    assert.equal(s, `You chose “I don’t know enough about this” for 1 of the ${QUESTIONS.length} questions. That activity is unexplored, not disliked.`);
    assert.doesNotMatch(s, /answers were|Those activities|dashed/);
  });
  it('two answers on ONE activity: still one activity, and its single dashed bar', () => {
    assert.equal(
      unknownNote(answers(sameDim))!,
      `You chose “I don’t know enough about this” for 2 of the ${QUESTIONS.length} questions. That activity is unexplored, not disliked. The dashed bar has no rating.`,
    );
  });
  it('two answers on two activities: plural, and no dashed bar (each still has one rating)', () => {
    assert.equal(
      unknownNote(answers([sameDim[0], otherDim]))!,
      `You chose “I don’t know enough about this” for 2 of the ${QUESTIONS.length} questions. Those activities are unexplored, not disliked.`,
    );
  });
  it('two fully unknown activities: plural dashed bars', () => {
    const second = QUESTIONS.filter((q) => q.dimension === QUESTIONS.find((x) => x.id === otherDim)!.dimension).map((q) => q.id);
    assert.match(unknownNote(answers([...sameDim, ...second]))!, /for 4 of the \d+ questions\. Those activities are unexplored, not disliked\. The dashed bars have no rating\.$/);
  });
  it('the results screen prints this line, not the old hand-joined pieces', () => {
    const src = read('src/screens/careerfinder/CareerFinderResultsScreen.tsx');
    assert.match(src, /unknownNote\(rec\.responses\)/);
    assert.doesNotMatch(src, /answers were “I don’t know enough about this”/);
    assert.doesNotMatch(src, /the dashed bars had no rating at all/);
  });
});

describe('2. one licensing warning everywhere (Pattern 6)', () => {
  it('the text keeps every requirement word and says who to check with', () => {
    assert.equal(
      edu.LICENSED_WARNING,
      '⚠ Licensed, credentialed or restricted-entry occupation in many places. Academy study supports the audio knowledge it uses but does not lead to the license or credential. Check the requirements with the licensing body or employer where you live.',
    );
  });
  it('the results card, the family example list and the expanded title row all print it', () => {
    const res = read('src/screens/careerfinder/CareerFinderResultsScreen.tsx');
    const fam = read('src/screens/careerfinder/CareerFamilyScreen.tsx');
    assert.match(res, /f\.examples\.some\(isRegulatedTitle\) \? <Text style=\{styles\.gatedNote\}>\{LICENSED_WARNING\}<\/Text> : null/);
    assert.match(fam, /fam\.examples\.some\(isRegulatedTitle\) \? <Text style=\{styles\.exampleGatedNote\}>\{LICENSED_WARNING\}<\/Text> : null/);
    assert.match(fam, /\{c\.regulated \? <Text style=\{\[styles\.detail, \{ color: '#ffb060' \}\]\}>\{LICENSED_WARNING\}<\/Text> : null\}/);
    for (const src of [res, fam]) {
      assert.doesNotMatch(src, /Licensed or credentialed occupation\. Academy study/);
      assert.doesNotMatch(src, /verify requirements with the licensing body/);
    }
  });
  it('the family-page licensed card still names every route it is not', () => {
    const fam = read('src/screens/careerfinder/CareerFamilyScreen.tsx');
    assert.match(fam, /They are not a route to any license, clinical credential, bar admission or security clearance\. Completing them does not qualify anyone to practice\./);
  });
});

describe('3. softened requirement lines are now explicit', () => {
  const idx = JSON.parse(read('src/data/careerIndex.json')) as { enums: { preparation: string[] }; careers: { t: string; prep: number; reg?: 1 }[] };
  const prep = (t: string) => idx.enums.preparation[idx.careers.find((c) => c.t === t)!.prep];

  it('CF-D0045: SLPAs — most US states require a license, registration or certification', () => {
    assert.match(prep('Speech-Language Pathology Assistant'), /most US states require a license, registration or certification$/);
    assert.doesNotMatch(prep('Speech-Language Pathology Assistant'), /state rules vary/);
  });
  it('CF-D0056: audiologists — a license where you practice is REQUIRED (BLS: licensed in all states)', () => {
    for (const t of ['Audiologist', 'Clinical Audiologist', 'Pediatric Audiologist', 'Research Audiologist']) assert.equal(prep(t), 'Clinical doctorate and a license where you practice required', t);
  });
  it('CF-D0062: speech-language pathology and allied clinical titles — REQUIRED (BLS: licensed in all states)', () => {
    for (const t of ['Speech-Language Pathologist', 'Voice Therapist', 'Fluency Specialist', 'Hyperacusis Specialist']) assert.equal(prep(t), 'Graduate clinical training and a license or credential where you practice required', t);
  });
  it('no preparation line anywhere still hedges a clinical license with "typically/commonly required"', () => {
    for (const p of idx.enums.preparation) assert.doesNotMatch(p, /license (where you practice|or credential where you practice) (typically|commonly) required/, p);
  });
  it('CF-A0219: under every title, a stated requirement IS required (never "not mandatory requirements")', () => {
    assert.equal(edu.PREPARATION_ROUTES_NOTE, 'Preparation shows common routes. Where it says a degree, license or certification is required, it is required.');
    const fam = read('src/screens/careerfinder/CareerFamilyScreen.tsx');
    assert.match(fam, /\{c\.status\}\. \{PREPARATION_ROUTES_NOTE\}/);
    assert.doesNotMatch(fam, /\{c\.status\}\. Common pathways are described/);
  });
  it('the degree chip is spelled out and still fires on a curly-apostrophe "Master’s"', () => {
    assert.equal(edu.educationChip({ regulated: false, professionalEngineer: false, preparation: 'Master’s in library and information science' }), 'DEGREE REQUIRED');
    assert.equal(edu.educationChip({ regulated: false, professionalEngineer: false, preparation: "Master's in library and information science" }), 'DEGREE REQUIRED');
  });
  it('the screen shows preparation with curly punctuation, never changing its words', () => {
    assert.equal(
      edu.prepForDisplay("Master's in library and information science (MLS/MLIS) typically required for the professional 'Librarian' role"),
      'Master’s in library and information science (MLS/MLIS) typically required for the professional “Librarian” role',
    );
    assert.equal(edu.prepForDisplay("Bachelor's degree common; portfolio/ certification may supplement"), 'Bachelor’s degree common; portfolio/certification may supplement');
  });
});

describe('4. other wording pinned from the review', () => {
  it('"lean on" is gone from the results wording (Pattern 1)', () => {
    const r: Responses = {};
    for (const q of QUESTIONS) r[q.id] = 4;
    const dims = dimensionScores(r);
    for (const f of FAMILIES) assert.doesNotMatch(explainFamily(f, dims, { rank: 1 }), /\bleans? on\b/i, f.id);
    for (const c of ['clear', 'broad', 'developing'] as const) assert.doesNotMatch(clarityCopy(c, dims), /\bleans? on\b|direction/i, c);
  });
  it('profile labels are sentence case (CF-A0562–A0564)', () => {
    assert.deepEqual(CLARITY_LABEL, { clear: 'Clear profile', broad: 'Broad profile', developing: 'Early profile' });
  });
  it('the halfway milestone is computed from the question count (Pattern 13)', () => {
    const quiz = read('src/screens/careerfinder/CareerFinderQuizScreen.tsx');
    assert.doesNotMatch(quiz, /'Halfway — 14 to go'/);
    assert.match(quiz, /`Halfway — \$\{QUESTION_COUNT - HALF\} to go`/);
  });
  it('the first-run tour stop makes no fit promise (CF-E0005, CF-E0006)', () => {
    const stops = read('src/features/intro/samplerStops.ts');
    assert.match(stops, /blurb: 'Careers built on sound level and acoustics\.'/);
    assert.doesNotMatch(stops, /blurb: '[^']*find your fit|recap: '[^']*make yourself at home/);
  });
});

describe('5. round 2: the build hooks carry every fix, so a rebuild cannot undo them', () => {
  // Coordinator follow-up 2026-11-14 to the owner's "assign an agent in the background to work on this":
  // the build script got renameTitles / renamePreparation / renameWorkModel / sourceNames / settings.
  const idx = JSON.parse(read('src/data/careerIndex.json')) as { families: string[]; enums: Record<string, string[]>; careers: { id: string; t: string; f: number; reg?: 1 }[] };
  const fam = JSON.parse(read('src/data/careerFamilies.json')) as { name: string; settings: string[]; sources: string[] }[];
  const ov = JSON.parse(read('scripts/career-index-overrides.json')) as Record<string, Record<string, unknown>>;
  const build = read('scripts/build-career-index.py');
  const byId = (id: string) => idx.careers.find((c) => c.id === id)!;

  it('the build script has the five hooks, each failing loudly when it changes nothing', () => {
    for (const re of [/renameTitles: no title/, /renamePreparation: no title uses/, /renameWorkModel: no work model/, /sourceNames: no family lists/, /settings names an unknown family/]) assert.match(build, re);
    assert.match(build, /'workModel': work_model_out/);
  });
  it('the 5 D59 "where people work" fixes live in the overrides and match the shipped file', () => {
    const s = ov.settings as Record<string, string[]>;
    assert.equal(Object.keys(s).length, 5);
    for (const [name, list] of Object.entries(s)) assert.deepEqual(fam.find((f) => f.name === name)!.settings, list, name);
    assert.ok(fam.some((f) => f.settings.includes('XR (extended reality: virtual, augmented and mixed reality) companies')));
    assert.ok(fam.some((f) => f.settings.includes('Film and television post-production')));
  });
  it('titles: spelling fixed, licensing flag kept (AC-0589 CAOHC, AC-0116, AC-1052, AC-1331, voiceover)', () => {
    assert.equal(byId('AC-0589').t, 'Occupational Hearing Conservationist');
    assert.equal(byId('AC-0589').reg, 1, 'still LICENSED after the rename');
    assert.equal(byId('AC-0116').t, 'Audio System Technician');
    assert.equal(byId('AC-1052').t, 'Mobile Device Audio Engineer');
    assert.equal(byId('AC-1331').t, 'Hand Percussionist');
    for (const id of ['AC-0369', 'AC-0370', 'AC-0373']) assert.match(byId(id).t, /^Voiceover /, id);
    assert.ok(!idx.careers.some((c) => /Voice-Over|Hearing-Conservationist|Mobile-Device|Hand-Percussionist|\bTech$/.test(c.t)));
  });
  it('the owner’s example "Voiceover Recording Engineer" is now a real index title in its family', () => {
    const f = FAMILIES.find((x) => x.examples.includes('Voiceover Recording Engineer'))!;
    assert.ok(idx.careers.some((c) => c.t === 'Voiceover Recording Engineer' && idx.families[c.f] === f.name));
  });
  it('no serial comma left in the preparation and work-model lines (Pattern 10)', () => {
    for (const k of ['preparation', 'workModel']) for (const s of idx.enums[k]) assert.doesNotMatch(s, /, [^,;]+, (and|or) /, s);
  });
  it('source acronyms are spelled out on family pages (Pattern 15)', () => {
    const all = new Set(fam.flatMap((f) => f.sources));
    for (const a of ['IATSE', 'NIOSH', 'NOAA', 'NAMM']) assert.ok(!all.has(a), a);
    assert.ok(all.has('International Alliance of Theatrical Stage Employees (IATSE)'));
  });
});
