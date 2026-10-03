/**
 * Hunt 4 (2026-10-03) — CALC area.
 *
 * H4-1 A SIGNED-IN learner whose membership read FAILED with no remembered
 *      tier reads entitlement 'anonymous' with `resolved` true and `tierKnown`
 *      false (EntitlementProvider: a failed read keeps the boot tier; a real
 *      guest — no session — is always a KNOWN answer). The calculators judged
 *      on `resolved` alone, so that learner (a paying member included) was:
 *        • told "Create a free account (or sign in) to run calculations", with
 *          a SIGN IN button, on every calculator (CalcWorkspaceScreen);
 *        • sold "Workflows are an Academy feature … See membership" by the lab
 *          gate (CalcLabScreen) and the runner (CalcWorkflowRunScreen);
 *        • asked to "Sign in to save projects" (CalcProjectsScreen).
 *      Now: the answer is held with "Checking your account…" while the
 *      provider retries, and the owner's 2026-10-03 honest end state
 *      ("Couldn't confirm your membership…") once it gives up — the same words
 *      as the tools' SAVE gate. Still nothing is unlocked on a failed read.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(path.resolve(HERE, '../src/screens/lab/calc', rel), 'utf8');
const NOT_CONFIRMED = 'Couldn’t confirm your membership on this phone. Check your connection and reopen the app.';

describe('H4-1 — a failed membership read is never told to sign in or sold membership', () => {
  it('calculator: SIGN IN only for a KNOWN guest; an unconfirmed tier holds the answer', () => {
    const s = read('CalcWorkspaceScreen.tsx');
    assert.match(s, /const \{ entitlement, commercialMode, resolved, tierKnown, tierReadFailed \} = useEntitlement\(\);/);
    assert.match(s, /const mustSignIn = commercialMode && resolved && tierKnown && entitlement === 'anonymous' && !onboardingSampling;/);
    assert.match(s, /const tierUnconfirmed = resolved && !tierKnown && entitlement === 'anonymous';/);
    assert.match(s, /const tierPending = commercialMode && \(!resolved \|\| tierUnconfirmed\) && !onboardingSampling;/);
    const pending = s.slice(s.indexOf(') : tierPending ? ('), s.indexOf(') : capped && !resultUnlocked ? ('));
    assert.ok(pending.includes(NOT_CONFIRMED), 'the honest end state once the provider gives up');
    assert.match(pending, /tierReadFailed && tierUnconfirmed/);
    assert.match(pending, /'Checking your account…'/);
  });

  it('lab gate: an unconfirmed tier gets the plain notice, never the membership dialog', () => {
    const s = read('CalcLabScreen.tsx');
    assert.match(s, /const tierUnconfirmed = tier === 'guest' && !tierKnown;/);
    const gate = s.slice(s.indexOf('const gateWorkflow = '), s.indexOf('const onNewWorkflow'));
    const unconf = gate.indexOf('if (tierUnconfirmed) {');
    assert.ok(unconf > 0 && unconf < gate.indexOf("'Workflows are an Academy feature'"), 'checked before the sell');
    assert.match(gate, /if \(tierUnconfirmed\) \{[\s\S]*?notify\([\s\S]*?return;\s*\}/);
    assert.ok(gate.includes(NOT_CONFIRMED));
  });

  it('runner: blocked for an unconfirmed tier, but with the honest words, not the sell', () => {
    const s = read('CalcWorkflowRunScreen.tsx');
    assert.match(s, /const tierUnconfirmed = tier === 'guest' && !tierKnown;/);
    const render = s.slice(s.indexOf('if (workflowBlocked) {'), s.indexOf('if (!workflow || !run) {'));
    const unconf = render.indexOf('{tierUnconfirmed ? (');
    assert.ok(unconf > 0 && unconf < render.indexOf('WORKFLOWS ARE AN ACADEMY FEATURE'));
    assert.ok(render.includes(NOT_CONFIRMED));
  });

  it('projects: no "Sign in to save projects" for a signed-in, unconfirmed learner', () => {
    const s = read('CalcProjectsScreen.tsx');
    assert.match(s, /const tierUnconfirmed = useTier\(\) === 'guest' && !tierKnown;/);
    const guard = s.slice(s.indexOf('const guardCreate = '), s.indexOf("'Sign in to save projects'"));
    assert.match(guard, /if \(limits\.savedProjects === 0 && tierUnconfirmed\) \{[\s\S]*?notify\(/);
    assert.ok(guard.includes(NOT_CONFIRMED));
  });

  it('the tier model behind it: a failed read reads "guest" while tierKnown is false', async () => {
    const { tierOf } = await import('../src/features/commercial/tier.ts');
    assert.equal(tierOf('anonymous', true), 'guest', 'resolved + anonymous = guest on the tier — hence tierKnown is needed');
    assert.equal(tierOf('anonymous', false), 'unknown');
  });
});
