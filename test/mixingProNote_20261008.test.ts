import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

// "Knowing When to Bring In a Pro" (owner 2026-10-07): a first-open popup for
// the Mixing family with GOT IT, plus a standing link on each lab's first page.
const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('Mixing-family "bring in a pro" note (owner 2026-10-07)', () => {
  const intros = src('src/features/intro/screenIntros.ts');

  it('is final copy, titled, with a GOT IT button', () => {
    const block = intros.slice(intros.indexOf('  mixingProNote: {'));
    assert.match(block, /placeholder: false/);
    assert.match(block, /title: 'Knowing When to Bring In a Pro'/);
    assert.match(block, /button: 'Got it'/);
  });

  it('keeps the owner’s words verbatim (spot checks, first and last lines)', () => {
    assert.ok(intros.includes('As you begin these mixing and mastering labs, remember that learning these processes also helps you recognize when to bring in a qualified professional.'));
    assert.ok(intros.includes('Equipment and an impressive résumé matter, but the quality of their work and their understanding of your goals matter most.'));
    assert.ok(intros.includes('Knowing when to seek another person’s expertise is itself an important professional skill.'));
    const body = intros.slice(intros.indexOf('  mixingProNote: {'));
    assert.equal((body.match(/\\n\\n' \+/g) ?? []).length, 4, 'five paragraphs');
  });

  it('shows on first open and links from the first page of all four Mixing-family labs', () => {
    for (const f of ['src/screens/lab/mixing/BeginningMixingLabScreen.tsx', 'src/screens/lab/mixing/AdvancedMixingLabScreen.tsx']) {
      assert.match(src(f), /<PagedLab [^>]*\bproNote\b/, f);
    }
    const paged = src('src/screens/lab/kit/PagedLab.tsx');
    assert.match(paged, /page === 0 && proNote \? <ProNoteButton \/>/);
    assert.match(paged, /proNote \? <ProNoteIntro onOwed=\{setProNoteOwed\} \/>/);
    assert.match(paged, /hold=\{proNote && proNoteOwed\}/, 'the guest reminder waits for the note');
    const mastering = src('src/screens/lab/mastering/MasteringLabScreen.tsx');
    assert.match(mastering, /idx === 0 && step === 0 \? <ProNoteButton/);
    assert.match(mastering, /<ProNoteIntro \/>/);
    const guides = src('src/screens/lab/mixingGuides/MixingGuidesHubScreen.tsx');
    assert.match(guides, /<ProNoteButton \/>/);
    assert.match(guides, /<ProNoteIntro \/>/);
  });

  it('uses the shared intro seen-flag, so Low-Light and the guest wipe rules apply', () => {
    const note = src('src/features/lab/ProNote.tsx');
    assert.match(note, /useScreenIntro\('mixingProNote'\)/);
    assert.doesNotMatch(note, /AsyncStorage|Alert\.alert/);
  });
});
