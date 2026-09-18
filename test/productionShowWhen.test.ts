/**
 * showWhen — the form responds to the user's own answers, and the meter
 * responds with it.
 *
 * ── WHY THIS EXISTS (2026-09-18, design review #1) ───────────────────────────
 *
 * Both production labs asked every question of everyone. A user who was not
 * rigging was still asked who the rigger is; a user who answered "no correction
 * needed" was still walked through five correction fields. Their own help text
 * already said "if" or "only if" — the form knew the question was conditional
 * and asked it anyway.
 *
 * ── THE PART THAT COULD DO REAL DAMAGE ───────────────────────────────────────
 *
 * A hidden field must not count as MISSING. `readiness.ts` derives its
 * denominator from the fields on the resolved stage, so hiding is done in
 * `resolveStage` and the meter falls with it automatically. Get that wrong and
 * the readiness meter — the thing that gates the exported packet — punishes
 * people for questions they were never asked, and it can never reach 100%.
 *
 * That is the failure this file is really guarding.
 *
 * ── AND UNKNOWN MUST STAY VISIBLE ────────────────────────────────────────────
 *
 * When the controlling field is unanswered the condition cannot be evaluated,
 * so the dependant SHOWS. Hiding on unknown would mean a fresh project opens
 * with half its questions invisible and no way to discover them.
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

const { resolveStage } = await import('../src/features/production/schema.ts');
const { valueKey } = await import('../src/features/production/types.ts');

/** A two-field stage: one control, one dependant. */
const STAGE = {
  stageId: 'trial',
  num: 1,
  title: 'Trial',
  intro: '',
  whyItMatters: '',
  rules: [],
  sections: [
    {
      sectionId: 's1',
      title: 'S1',
      fields: [
        { fieldId: 'ctrl', label: 'Control', kind: 'choice', required: true, options: [] },
        {
          fieldId: 'dep',
          label: 'Dependant',
          kind: 'text',
          required: true,
          showWhen: { field: 'ctrl', notEquals: ['no'] },
        },
        {
          fieldId: 'only_yes',
          label: 'Only on yes',
          kind: 'text',
          showWhen: { field: 'ctrl', equals: ['yes'] },
        },
      ],
    },
  ],
} as never;

const ids = (stage: { sections: { fields: { fieldId: string }[] }[] }): string[] =>
  stage.sections.flatMap((s) => s.fields.map((f) => f.fieldId));

describe('showWhen hides a field only when the answer says so', () => {
  it('UNANSWERED control shows everything — a fresh project is not half invisible', () => {
    const r = resolveStage(STAGE, 'music', {});
    assert.deepEqual(ids(r), ['ctrl', 'dep', 'only_yes']);
  });

  it('notEquals hides on the excluded answer', () => {
    const r = resolveStage(STAGE, 'music', { [valueKey('trial', 'ctrl')]: 'no' });
    assert.ok(!ids(r).includes('dep'), '"no" should hide the dependant');
  });

  it('notEquals shows on any other answer', () => {
    const r = resolveStage(STAGE, 'music', { [valueKey('trial', 'ctrl')]: 'yes' });
    assert.ok(ids(r).includes('dep'));
  });

  it('equals shows ONLY on the listed answer', () => {
    const yes = resolveStage(STAGE, 'music', { [valueKey('trial', 'ctrl')]: 'yes' });
    const maybe = resolveStage(STAGE, 'music', { [valueKey('trial', 'ctrl')]: 'maybe' });
    assert.ok(ids(yes).includes('only_yes'));
    assert.ok(!ids(maybe).includes('only_yes'), 'equals must not match a different answer');
  });

  it('omitting values entirely resolves everything', () => {
    // Previews and tests call resolveStage with no values; nothing should vanish.
    const r = resolveStage(STAGE, 'music');
    assert.deepEqual(ids(r), ['ctrl', 'dep', 'only_yes']);
  });
});

describe('⛔ a hidden field is not a missing field', () => {
  it('disappears from the resolved stage, so the meter cannot count it', () => {
    // readiness.ts takes its denominator from exactly these fields. If a hidden
    // field survived here, the meter would demand an answer to a question the
    // user was never shown and could never reach 100%.
    const shown = resolveStage(STAGE, 'music', { [valueKey('trial', 'ctrl')]: 'yes' });
    const hidden = resolveStage(STAGE, 'music', { [valueKey('trial', 'ctrl')]: 'no' });

    const requiredOf = (s: { sections: { fields: { required?: boolean }[] }[] }) =>
      s.sections.flatMap((x) => x.fields).filter((f) => f.required).length;

    assert.equal(requiredOf(shown), 2, 'ctrl + dep');
    assert.equal(requiredOf(hidden), 1, 'ctrl only — dep was never asked');
  });
});

describe('the authored gates point at fields that exist', () => {
  // A showWhen naming a typo'd field would silently never match, and the
  // dependant would show forever — an inert gate, the failure mode this
  // codebase keeps rediscovering.
  const files = [
    '../src/features/production/preprod/stage3.data.ts',
    '../src/features/production/preprod/stage6.data.ts',
    '../src/features/production/postprod/stage5.data.ts',
  ];

  for (const rel of files) {
    it(`${rel.split('/').pop()} — every showWhen names a field in its own stage`, async () => {
      const mod = (await import(rel)) as Record<string, unknown>;
      const stage = Object.values(mod).find(
        (v) => v && typeof v === 'object' && 'sections' in (v as object),
      ) as { sections: { fields: { fieldId: string; showWhen?: { field: string } }[] }[] } | undefined;
      assert.ok(stage, 'stage export not found');
      const present = new Set(stage.sections.flatMap((s) => s.fields.map((f) => f.fieldId)));
      const gated = stage.sections
        .flatMap((s) => s.fields)
        .filter((f) => f.showWhen);
      assert.ok(gated.length > 0, 'expected at least one authored gate here');
      for (const f of gated) {
        assert.ok(
          present.has(f.showWhen!.field),
          `${f.fieldId} is gated on "${f.showWhen!.field}", which is not a field in this stage`,
        );
      }
    });
  }
});
