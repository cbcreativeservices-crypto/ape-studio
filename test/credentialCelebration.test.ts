/**
 * The biggest moment in the app must actually happen, and happen once.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * The celebration engine shipped with five credential celebrations and a
 * `credentialCelebration()` to choose between them — and a bug-hunting pass on
 * 2026-09-17 found that nothing anywhere called it. Quizzes celebrated;
 * certificates and programmes, the things people actually pay for, did not.
 *
 * Wiring it up means a diff against what this device has already seen, because
 * credentials are awarded server-side and there is no client event to hook. Two
 * properties matter more than anything else in that design, and both are the
 * kind that go wrong silently:
 *
 *   • A member who already HOLDS credentials must not be congratulated for all
 *     of them at once on the next launch.
 *   • A credential must not be celebrated twice. A repeated congratulation
 *     reads as a bug and cheapens the real one.
 *
 * The selection rules themselves carry a judgement the owner asked for — the
 * FIRST certificate and the FIRST programme get their own warmer wording — so
 * they are pinned here too.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
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

const { credentialCelebration, resolveCelebrations } = await import(
  '../src/features/celebration/celebrationQueue.ts'
);
const { CELEBRATIONS } = await import('../src/features/celebration/catalog.ts');

describe('credentialCelebration picks the right words', () => {
  it('nothing earned is nothing to say', () => {
    assert.equal(
      credentialCelebration({ certificates: 0, programs: 0, priorCertificates: 0, priorPrograms: 0 }),
      null,
    );
  });

  it('the FIRST certificate gets its own wording', () => {
    const e = credentialCelebration({
      certificates: 1,
      programs: 0,
      priorCertificates: 0,
      priorPrograms: 0,
    });
    assert.equal(e?.id, 'first-certificate');
  });

  it('a later certificate does not claim to be the first', () => {
    const e = credentialCelebration({
      certificates: 1,
      programs: 0,
      priorCertificates: 3,
      priorPrograms: 0,
    });
    assert.equal(e?.id, 'certificate-earned');
  });

  it('the first programme, and a later one', () => {
    assert.equal(
      credentialCelebration({ certificates: 0, programs: 1, priorCertificates: 9, priorPrograms: 0 })?.id,
      'first-program',
    );
    assert.equal(
      credentialCelebration({ certificates: 0, programs: 1, priorCertificates: 0, priorPrograms: 2 })?.id,
      'program-complete',
    );
  });

  it('several at once become the combined screen, counted correctly', () => {
    const e = credentialCelebration({
      certificates: 2,
      programs: 1,
      priorCertificates: 0,
      priorPrograms: 0,
    });
    assert.equal(e?.id, 'multiple-credentials');
    assert.equal(e?.values.credential_count, 3);
  });
});

describe('every credential celebration can actually be rendered', () => {
  // The catalog uses the credential's NAME as the title, so an event whose
  // values do not carry one renders with an empty headline — which is exactly
  // what the first wiring attempt would have done.
  const ids = [
    'first-certificate',
    'certificate-earned',
    'first-program',
    'program-complete',
    'multiple-credentials',
  ] as const;

  it('each id exists in the catalog and is a credential-tier screen', () => {
    for (const id of ids) {
      const def = (CELEBRATIONS as Record<string, { tier: string; title: string }>)[id];
      assert.ok(def, `${id} is missing from the catalog`);
      assert.equal(def.tier, 'credential', `${id} should be a credential celebration`);
    }
  });

  it('the placeholders each one needs are named', () => {
    // If a title interpolates {certificate_name}, the caller MUST supply it.
    // This records which keys the wiring has to provide.
    const needed: Record<string, string[]> = {};
    for (const id of ids) {
      const def = (CELEBRATIONS as Record<string, { title: string }>)[id];
      needed[id] = [...def.title.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    }
    assert.deepEqual(needed['first-certificate'], ['certificate_name']);
    assert.deepEqual(needed['certificate-earned'], ['certificate_name']);
    assert.deepEqual(needed['first-program'], ['program_name']);
    assert.deepEqual(needed['program-complete'], ['program_name']);
    assert.deepEqual(needed['multiple-credentials'], ['credential_count']);
  });
});

describe('resolveCelebrations — one screen, strongest first', () => {
  it('the combined screen replaces the individual credentials', () => {
    const out = resolveCelebrations([
      { id: 'first-certificate', values: {} },
      { id: 'multiple-credentials', values: { credential_count: 2 } },
    ]);
    assert.deepEqual(out.map((e) => e.id), ['multiple-credentials']);
  });

  it('a credential outranks a milestone raised in the same moment', () => {
    const out = resolveCelebrations([
      { id: 'topic-complete', values: {} },
      { id: 'first-certificate', values: {} },
    ]);
    assert.equal(out[0].id, 'first-certificate');
    assert.equal(out.filter((e) => CELEBRATIONS[e.id].tier === 'credential').length, 1);
  });

  it('nothing raised is nothing shown', () => {
    assert.deepEqual(resolveCelebrations([]), []);
  });
});
