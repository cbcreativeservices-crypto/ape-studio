/**
 * The free web Career Finder at /career-finder (owner 2026-11-19, quick-pick answers:
 * "/career-finder", "Same files, kept in sync", "Yes, at the end", "Menu + sitemap").
 *
 * 1. The logic and data in web/lib/careerfinder/ are an exact copy of the app's
 *    (scripts/sync-career-finder-web.mjs --check). Change the app, run the script.
 * 2. The approved screen wording (owner review 2026-11-14, D63) is the same on both.
 * 3. Required education is disclosed with the app's own notes.
 * 4. The page collects nothing: no server calls, no sign-in.
 * 5. It is in the menu and the sitemap.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8').replace(/\r\n/g, '\n');
const WEB = () => read('web', 'components', 'careerfinder', 'CareerFinderApp.tsx');

describe('web Career Finder', () => {
  test('the web copies of the Career Finder logic and data match the app', () => {
    const r = spawnSync(process.execPath, [join('scripts', 'sync-career-finder-web.mjs'), '--check'], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr || r.stdout);
  });

  test('the approved screen wording is the same as the app', () => {
    const app = ['CareerFinderScreen', 'CareerFinderQuizScreen', 'CareerFinderResultsScreen', 'CareerFamilyScreen', 'CareerFamilyListScreen', 'CareerFinderAboutScreen']
      .map((f) => read('src', 'screens', 'careerfinder', `${f}.tsx`))
      .join('\n');
    const web = WEB();
    const lines = [
      'Which kinds of audio work would you enjoy doing?',
      'Free. No account needed. Your answers stay on this device.',
      'You’ll rate activities, not job titles. Rate each one only by how much you would enjoy it.',
      'It gives no percentages, verdicts or talent scores, only possibilities to explore, each with a place to start learning.',
      'These five audio career families draw most on what you said you would enjoy. Start with the top one.',
      'These are possibilities to explore, not limits on what you can pursue. Interests change with experience, so your results may change too.',
      'Nothing stood out strongly yet, so these are the families nearest to your answers, not matches.',
      '“I don’t know enough about this” is never counted as dislike. It only marks an activity you haven’t tried yet.',
      'They are not a route to any license, clinical credential, bar admission or security clearance. Completing them does not qualify anyone to practice. Check the licensing body where you live.',
      'Titles in this family that usually need the least formal preparation to get started.',
      'The Career Finder is a career-exploration tool. It helps you find kinds of paid audio work and pick the ones worth looking into. It does not tell you what you should become.',
      'Nothing here should be used to screen anyone for a job.',
      'requires a Professional Engineer license.',
    ];
    for (const l of lines) {
      assert.ok(app.includes(l), `app screens no longer say: ${l} (update the web page and this test together)`);
      assert.ok(web.includes(l), `web Career Finder is missing the app's wording: ${l}`);
    }
  });

  test('required education is disclosed with the app’s own notes', () => {
    const web = WEB();
    for (const name of ['LICENSED_WARNING', 'EDUCATION_NOT_REPLACED', 'PREPARATION_ROUTES_NOTE', 'educationChip(', 'furtherEducationForTitle(', 'isRegulatedTitle']) {
      assert.ok(web.includes(name), `web Career Finder does not use ${name}`);
    }
  });

  test('it collects nothing: no server calls, no sign-in', () => {
    const web = WEB();
    assert.ok(!/fetch\(|supabase|XMLHttpRequest|sendBeacon/i.test(web), 'the web Career Finder must not send anything anywhere');
    for (const f of ['careerIndex.ts', 'scoring.ts', 'families.ts', 'questions.ts']) {
      assert.ok(!/fetch\(|supabase/i.test(read('web', 'lib', 'careerfinder', f)), `${f} must stay pure`);
    }
  });

  test('the start page uses the app menu’s own Career Finder picture, unchanged', () => {
    // Owner 2026-11-19: "use the same career finder image as in the app main menu".
    const app = readFileSync(join(process.cwd(), 'assets', 'Menu Course Cards', 'webp', 'career_finder.webp'));
    const web = readFileSync(join(process.cwd(), 'web', 'public', 'career-finder', 'career_finder.webp'));
    assert.ok(app.equals(web), 'web/public/career-finder/career_finder.webp differs from the app menu card art');
    assert.ok(WEB().includes('src="/career-finder/career_finder.webp"'));
  });

  test('it is in the menu and the sitemap', () => {
    assert.ok(read('web', 'components', 'Nav.tsx').includes('href: "/career-finder"'));
    assert.ok(read('web', 'app', 'sitemap.ts').includes('"/career-finder"'));
    assert.ok(read('web', 'app', 'career-finder', 'page.tsx').includes('path: "/career-finder"'));
  });
});
