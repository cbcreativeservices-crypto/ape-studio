/**
 * The celebration engine.
 *
 * What is worth testing here is not that a card renders — it is the rules that
 * decide how OFTEN a user is interrupted, because getting those wrong is how a
 * reward system becomes an obstacle course.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { CELEBRATIONS, ALL_CELEBRATIONS, CREDENTIAL_IDS, CONFIRMATIONS } = await import(
  '../src/features/celebration/catalog.ts'
);
const { fill, formFor } = await import('../src/features/celebration/types.ts');
const { resolveCelebrations, credentialCelebration } = await import(
  '../src/features/celebration/celebrationQueue.ts'
);

describe('the catalog', () => {
  it('every celebration has a title, a body and at least one way out', () => {
    for (const c of ALL_CELEBRATIONS) {
      assert.ok(c.title.length > 0, c.id);
      assert.ok(c.body.length > 0, c.id);
      assert.ok(c.actions.length > 0, `${c.id} must offer at least one action`);
      assert.ok(
        c.actions.filter((a) => a.primary).length <= 1,
        `${c.id} may have at most one primary action`,
      );
    }
  });

  it('ids and the record agree, so a lookup can never miss', () => {
    for (const [key, def] of Object.entries(CELEBRATIONS)) assert.equal(def.id, key);
  });

  it('the three per-topic activities stay on the QUIET tier', () => {
    // ⛔ THE FORM CHANGED, THE TIER MUST NOT (owner 2026-09-20).
    //
    // This used to assert these rendered as the inline 'notice'. The owner
    // ruled against that: an inline card opens at the top of the Dashboard and
    // pushes the whole rack down, so the learner has to re-find their place.
    // "popups work better as it focuses user then they go right back and there
    // is no reorientation of the page." Every tier is a popup now.
    //
    // The reasoning BEHIND the old assertion still stands and is what this
    // test now protects: six celebrations per topic across 171 topics is
    // ~1000 dismissals, so the per-topic activities must stay restrained.
    // `tier` is what carries that — 'step' gets no haptic (Celebration.tsx
    // fires one only for milestone/credential) and no promotion to the
    // language reserved for finishing a topic or earning a credential.
    for (const id of ['flashcards-complete', 'matching-complete', 'fill-blank-complete'] as const) {
      assert.equal(CELEBRATIONS[id].tier, 'step', `${id} must stay on the quiet tier`);
      assert.equal(formFor(CELEBRATIONS[id].tier, false), 'screen');
    }
  });

  it('the credential tier is reserved for actual credentials', () => {
    const credentialTier = ALL_CELEBRATIONS.filter((c) => c.tier === 'credential').map((c) => c.id);
    for (const id of CREDENTIAL_IDS) assert.ok(credentialTier.includes(id), id);
    assert.ok(credentialTier.includes('multiple-credentials'));
    assert.equal(credentialTier.length, CREDENTIAL_IDS.length + 1);
  });

  it('a failed quiz is marked as encouragement, so it cannot read as a win', () => {
    assert.equal(CELEBRATIONS['quiz-not-passed'].encouragement, true);
    // And nothing else is — a congratulation wrongly flagged would lose its haptic.
    const flagged = ALL_CELEBRATIONS.filter((c) => c.encouragement).map((c) => c.id);
    assert.deepEqual(flagged, ['quiz-not-passed']);
  });

  it('the failed quiz offers a way forward, not just a verdict', () => {
    const kinds = CELEBRATIONS['quiz-not-passed'].actions.map((a) => a.kind);
    assert.ok(kinds.includes('view-results'));
    assert.ok(kinds.includes('retry-quiz'), 'the user must be able to try again from here');
  });

  it('the confirmations are receipts, not celebrations — short and undecorated', () => {
    for (const [key, text] of Object.entries(CONFIRMATIONS)) {
      assert.ok(text.length < 80, `${key} is too long for a toast`);
      assert.ok(!text.includes('!'), `${key} should not be exclaimed — it is a receipt`);
    }
  });
});

describe('low-light production mode', () => {
  it('collapses EVERY tier to the quiet inline notice', () => {
    // The standing rule is absolute: nothing may auto-appear. This app is used
    // in dark control rooms during shows.
    for (const c of ALL_CELEBRATIONS) {
      assert.equal(formFor(c.tier, true), 'notice', `${c.id} must not open a modal in low-light`);
    }
  });

  it('and the component honours it rather than merely being told about it', () => {
    const src = readFileSync(
      new URL('../src/features/celebration/Celebration.tsx', import.meta.url),
      'utf8',
    );
    assert.match(src, /useOverlaysSuppressed\(\)/);
    assert.match(src, /formFor\(def\.tier, suppressed\)/);
    // No haptic when suppressed — the point is not to intrude at all.
    assert.match(src, /if \(suppressed \|\| def\.encouragement\) return;/);
  });
});

describe('templates', () => {
  it('fills what it has', () => {
    assert.equal(fill('TOPIC QUIZ: {score} of {size}', { score: 26, size: 28 }), 'TOPIC QUIZ: 26 of 28');
    assert.equal(fill('{topic_name}', { topic_name: 'Gain Staging' }), 'Gain Staging');
  });

  it('renders a MISSING value as nothing, never as the placeholder', () => {
    // A user who sees "{topic_name}" has been shown a bug.
    assert.equal(fill('{topic_name}', {}), '');
    assert.equal(fill('Previous score: {previous_score}%', {}), 'Previous score: %');
    assert.ok(!fill('{nope}', {}).includes('{'));
  });

  it('every placeholder in the catalog is a real value field', () => {
    // A typo'd placeholder would silently render as an empty string forever.
    const known = new Set([
      'topic_name', 'subject_name', 'lab_name', 'certificate_name', 'program_name',
      'achievement_name', 'requirement_name', 'score', 'size', 'previous_score', 'new_score',
      'improvement', 'credential_count',
    ]);
    for (const c of ALL_CELEBRATIONS) {
      const text = [c.title, c.subject ?? '', c.stat ?? '', ...c.body].join(' ');
      for (const m of text.matchAll(/\{(\w+)\}/g)) {
        assert.ok(known.has(m[1]), `${c.id} uses unknown placeholder {${m[1]}}`);
      }
    }
  });
});

describe('what actually gets shown when several things happen at once', () => {
  const ev = (id: string, values = {}) => ({ id, values }) as never;

  it('nothing in, nothing out', () => {
    assert.deepEqual(resolveCelebrations([]), []);
  });

  it('the combined credential screen REPLACES the individual ones', () => {
    const out = resolveCelebrations([
      ev('first-certificate'),
      ev('certificate-earned'),
      ev('multiple-credentials', { credential_count: 2 }),
    ]);
    assert.deepEqual(out.map((e) => e.id), ['multiple-credentials']);
  });

  it('only ONE full screen survives, and it is the strongest', () => {
    // Finishing a topic can legitimately raise all three at once.
    const out = resolveCelebrations([
      ev('topic-complete'),
      ev('subject-complete'),
      ev('first-certificate'),
    ]);
    assert.equal(out.length, 1);
    assert.equal(out[0].id, 'first-certificate', 'a credential outranks a milestone');
  });

  it('inline notices are cheap, so they all stand', () => {
    const out = resolveCelebrations([
      ev('flashcards-complete'),
      ev('matching-complete'),
      ev('score-improved'),
    ]);
    assert.equal(out.length, 3);
  });

  it('a screen leads, notices follow', () => {
    const out = resolveCelebrations([ev('score-improved'), ev('topic-complete')]);
    assert.deepEqual(out.map((e) => e.id), ['topic-complete', 'score-improved']);
  });
});

describe('choosing the credential celebration', () => {
  const at = (o: Partial<Parameters<typeof credentialCelebration>[0]>) =>
    credentialCelebration({ certificates: 0, programs: 0, priorCertificates: 0, priorPrograms: 0, ...o });

  it('earning nothing celebrates nothing', () => {
    assert.equal(at({}), null);
  });

  it('the FIRST certificate gets its own warmer screen', () => {
    assert.equal(at({ certificates: 1 })?.id, 'first-certificate');
    assert.equal(at({ certificates: 1, priorCertificates: 3 })?.id, 'certificate-earned');
  });

  it('the FIRST programme likewise, and a programme outranks a certificate', () => {
    assert.equal(at({ programs: 1 })?.id, 'first-program');
    assert.equal(at({ programs: 1, priorPrograms: 1 })?.id, 'program-complete');
  });

  it('more than one at a time becomes the combined screen with a count', () => {
    const out = at({ certificates: 2, programs: 1 });
    assert.equal(out?.id, 'multiple-credentials');
    assert.equal(out?.values.credential_count, 3);
  });
});

// ── the once-ever record ─────────────────────────────────────────────────────

const {
  wasSeen,
  markSeen,
  hasLoaded,
  __resetCelebrationsSeenForTests,
} = await import('../src/features/celebration/celebrationSeen.ts');

describe('a celebration fires once, ever', () => {
  it('reports nothing as seen before the record has loaded', () => {
    // The critical guard: `wasSeen` answers false for everything until the
    // load resolves, so a caller that skipped `hasLoaded()` would congratulate
    // the user for every topic they have ever finished, on every cold start.
    __resetCelebrationsSeenForTests();
    assert.equal(hasLoaded(), false);
    assert.equal(wasSeen('topic-1', 'flashcards-complete'), false);
  });

  it('remembers per scope, so the same celebration can fire for another topic', () => {
    __resetCelebrationsSeenForTests([]);
    assert.equal(hasLoaded(), true);
    markSeen('topic-1', 'flashcards-complete');
    assert.equal(wasSeen('topic-1', 'flashcards-complete'), true);
    assert.equal(wasSeen('topic-2', 'flashcards-complete'), false, 'a different topic still celebrates');
    assert.equal(wasSeen('topic-1', 'matching-complete'), false, 'a different method still celebrates');
  });

  it('marking twice is harmless', () => {
    __resetCelebrationsSeenForTests([]);
    markSeen('t', 'topic-complete');
    markSeen('t', 'topic-complete');
    assert.equal(wasSeen('t', 'topic-complete'), true);
  });
});

describe('the quiz win reaches the celebration, and the trophy is only a viewer', () => {
  const quiz = readFileSync(new URL('../src/screens/quiz/QuizScreen.tsx', import.meta.url), 'utf8');
  const trophy = readFileSync(new URL('../src/screens/results/TrophyScreen.tsx', import.meta.url), 'utf8');

  it('a passed quiz navigates to Celebration, not Trophy', () => {
    assert.match(quiz, /navigate\('Celebration'/);
    assert.ok(!/navigate\('Trophy'/.test(quiz), 'the quiz must no longer route to Trophy');
  });

  it('a perfect score gets its own celebration', () => {
    assert.match(quiz, /perfect \? 'perfect-score' : 'topic-complete'/);
  });

  it('TrophyScreen kept its viewer job rather than being deleted', () => {
    // Deleting it would have broken opening a trophy from the Gallery.
    assert.ok(trophy.includes('export function TrophyScreen'));
    assert.ok(!trophy.includes('AUTO_ADVANCE_MS'), 'the quiz-win auto-advance is gone');
    assert.ok(!/isQuizWin/.test(trophy), 'the quiz-win branch is gone');
  });
});
