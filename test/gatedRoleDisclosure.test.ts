/**
 * The required-education disclosure must actually appear where it is needed.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * The rule is absolute: whenever a role listed in the app needs a degree, a
 * licence or a certification beyond an Academy credential, the app says so —
 * always, every time.
 *
 * Structured career lists honour it by labelling each role. `subjectMeta.ts`
 * does not: its career applications are one prose string per subject, printed
 * verbatim on Explore → SUBJECTS, and six of the fifty name roles the app's own
 * copy classifies as gated — among them a fourth "rigger", found after three
 * others had already been corrected one at a time.
 *
 * The first attempt at the prose check matched against the CAREER INDEX's
 * canonical titles ("Entertainment Rigger") while the prose uses the short form
 * ("rigger"), so it matched nothing and the disclosure rendered nowhere — an
 * inert check that looked like a fix, which is the same shape as two earlier
 * bugs this week.
 *
 * So this test does not check that the function exists. It checks that the
 * disclosure FIRES on the real subject copy, and keeps firing.
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

const { GATED_ROLE_NAMES, namesGatedRole } = await import('../src/data/gatedRoles.ts');
const { SUBJECT_META } = await import('../src/data/subjectMeta.ts');

const subjects = Object.values(SUBJECT_META as Record<string, { careers: string }>);

describe('the classification the check reads', () => {
  it('is derived and non-trivial', () => {
    // If the derivation breaks, every assertion below passes vacuously.
    assert.ok(GATED_ROLE_NAMES.length > 50, `expected many gated roles, got ${GATED_ROLE_NAMES.length}`);
    assert.ok(GATED_ROLE_NAMES.some((n) => n.toLowerCase() === 'rigger'), 'rigger should be classified');
    assert.ok(subjects.length > 40, `expected the subject list, got ${subjects.length}`);
  });
});

describe('the disclosure fires on the real subject copy', () => {
  it('THE INERT-CHECK REGRESSION: it matches something', () => {
    const hits = subjects.filter((s) => s.careers && namesGatedRole(s.careers));
    assert.ok(
      hits.length > 0,
      'namesGatedRole matched NONE of the subject career lines — the check is inert, ' +
        'which is exactly how the first version of it shipped',
    );
  });

  it('every subject line naming a gated role is caught', () => {
    // Computed independently of the implementation: a whole-word scan for any
    // classified name. If these two ever disagree, the check has a hole.
    const missed: string[] = [];
    for (const s of subjects) {
      if (!s.careers) continue;
      const text = s.careers.toLowerCase();
      const namesOne = GATED_ROLE_NAMES.some((raw) => {
        const t = raw.toLowerCase();
        if (t.length < 5) return false;
        return new RegExp(`(?<![a-z])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z])`).test(text);
      });
      if (namesOne && !namesGatedRole(s.careers)) missed.push(s.careers);
    }
    assert.deepEqual(missed, [], `subject lines naming a gated role with no disclosure:\n  ${missed.join('\n  ')}`);
  });

  it('the specific roles that were found bare are matched', () => {
    for (const prose of [
      'Stagehand, rigger, production manager, venue crew.',
      'Acoustician, system tech, studio designer, install/AV designer.',
      'Research acoustician, heritage consultant, academic, museum/AV specialist.',
      'Bioacoustics researcher, environmental scientist, sonar/defense, academia.',
      'Preservation/restoration engineer, archivist, library/museum audio.',
    ]) {
      assert.equal(namesGatedRole(prose), true, `should have been caught: ${prose}`);
    }
  });

  it('does not fire on a list of roles that need nothing extra', () => {
    // Over-disclosing is its own harm: a warning on every subject teaches
    // people to ignore it.
    assert.equal(namesGatedRole('Live sound engineer, monitor engineer, stagehand.'), false);
    assert.equal(namesGatedRole('Mix engineer, mastering engineer, studio assistant.'), false);
    assert.equal(namesGatedRole(''), false);
  });

  it('matches whole words only', () => {
    // "sonar systems technician" is gated; a bare "technician" is not.
    assert.equal(namesGatedRole('Broadcast technician, camera operator.'), false);
  });
});
