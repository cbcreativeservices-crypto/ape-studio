/**
 * The drafted "About my work" sentence.
 *
 * This text is written BY THE APP and shown to the member as theirs to edit,
 * so two things have to hold: it must read like a person wrote it, and the
 * server must never refuse it. A 200-character rejection on a sentence the app
 * composed itself would be our bug presented as the member's mistake.
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
    }
    return nextResolve(specifier, context);
  },
});

const { draftAbout } = await import('../src/features/directory/aboutDraft.ts');
const { aboutIsSafe, LIMITS } = await import('../src/features/directory/rules.ts');

/** Humanises a slug the way the real `label` does on taxonomy drift. */
const label = (_kind: string, slug: string) =>
  slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

describe('draftAbout writes a true sentence from the member’s own picks', () => {
  it('combines role, area, specialties and open-to', () => {
    const t = draftAbout(
      {
        primaryArea: 'live-sound-event-production',
        areas: ['live-sound-event-production'],
        roles: ['working-professionally'],
        specialties: ['system-tuning'],
        openTo: ['collaboration'],
      },
      label as never,
    );
    assert.match(t, /^Working professionally in Live Sound Event Production\./);
    assert.match(t, /Focused on system tuning\./);
    assert.match(t, /Open to collaboration\./);
  });

  it('returns EMPTY when there is nothing true to say', () => {
    // An empty box beats a sentence that states nothing.
    assert.equal(draftAbout({ primaryArea: null, areas: [], roles: [], specialties: [], openTo: [] }, label as never), '');
  });

  it('falls back to the plain label for a role it does not know', () => {
    const t = draftAbout(
      { primaryArea: 'a-b', areas: ['a-b'], roles: ['some-new-role'], specialties: [], openTo: [] },
      label as never,
    );
    assert.equal(t, 'Some New Role in A B.');
  });
});

describe('⛔ "Still exploring" is a STATE, not a place', () => {
  // The whole point of that option is that a beginner can answer honestly.
  // Wedging it in after "in" produces "Learning and exploring in Still
  // exploring — not sure yet", which would make the feature look broken to
  // exactly the user it was added for.
  it('never says "in Still exploring"', () => {
    const t = draftAbout(
      {
        primaryArea: 'exploring-not-sure-yet',
        areas: ['exploring-not-sure-yet'],
        roles: ['learning-exploring'],
        specialties: [],
        openTo: [],
      },
      label as never,
    );
    assert.ok(!/in Still exploring/i.test(t), t);
    assert.ok(!/in Exploring/i.test(t), t);
    assert.match(t, /finding my direction/);
  });

  it('handles exploring with no role at all', () => {
    const t = draftAbout(
      { primaryArea: null, areas: ['exploring-not-sure-yet'], roles: [], specialties: [], openTo: [] },
      label as never,
    );
    assert.match(t, /Still exploring audio/);
  });
});

describe('⛔ the draft must always be storable', () => {
  it('stays within the About cap and drops whole sentences, never mid-word', () => {
    const long = (n: number) => `${'extremely-long-specialty-name-'.repeat(3)}${n}`;
    const t = draftAbout(
      {
        primaryArea: long(0),
        areas: [long(0)],
        roles: ['working-professionally'],
        specialties: [long(1), long(2)],
        openTo: [long(3), long(4), long(5)],
      },
      label as never,
    );
    assert.ok(t.length <= LIMITS.about, `${t.length} > ${LIMITS.about}`);
    // Whole sentences only: if anything survived it ends in a full stop.
    if (t) assert.ok(t.endsWith('.'), t);
  });

  it('passes aboutIsSafe for every shape it can produce', () => {
    const shapes = [
      { primaryArea: 'live-sound', areas: ['live-sound'], roles: ['enthusiast-hobbyist'], specialties: ['foh'], openTo: ['mentoring'] },
      { primaryArea: 'exploring-not-sure-yet', areas: ['exploring-not-sure-yet'], roles: ['learning-exploring'], specialties: [], openTo: ['mentoring'] },
      { primaryArea: null, areas: [], roles: ['researching'], specialties: [], openTo: [] },
    ];
    for (const s of shapes) {
      const t = draftAbout(s, label as never);
      assert.ok(aboutIsSafe(t), `refused: ${t}`);
    }
  });
});
