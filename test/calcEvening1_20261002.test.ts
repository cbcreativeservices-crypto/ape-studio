/**
 * Evening toddler hunt pass 1 (2026-10-02) — CALC area.
 *
 * E1-1 The workflow RUNNER never re-checked membership. CalcLabScreen's gate
 *      lets a tap through while the tier is unknown (`!resolved` counts as
 *      allowed), so a free account that opened a workflow in the first seconds
 *      after launch kept a runner showing every answer with no weekly cap. Once
 *      the tier is KNOWN and is not a member, the runner withholds its answers.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUN = readFileSync(path.resolve(HERE, '../src/screens/lab/calc/CalcWorkflowRunScreen.tsx'), 'utf8');

describe('E1-1 — the workflow runner withholds answers from a known non-member', () => {
  it('derives the block from the KNOWN tier (useTier), in commercial mode only', () => {
    assert.match(RUN, /import \{ useTier \} from '\.\.\/\.\.\/\.\.\/features\/commercial\/useTier';/);
    assert.match(RUN, /const tier = useTier\(\);\s*const workflowBlocked = commercialMode && tier !== 'unknown' && tier !== 'member';/);
  });
  it('the blocked view returns BEFORE any step, answer or summary renders', () => {
    const render = RUN.slice(RUN.indexOf('// ---- Render ----'));
    const gate = render.indexOf('if (workflowBlocked) {');
    assert.ok(gate >= 0, 'no blocked view');
    assert.ok(gate < render.indexOf('if (!workflow || !run) {'), 'gate must precede the loading/answer views');
    assert.ok(gate < render.indexOf('YOUR ANSWER'), 'gate must precede the answer panel');
    const view = render.slice(gate, render.indexOf('if (!workflow || !run) {'));
    assert.match(view, /safeGoBack\(navigation\)/, 'Back must always work');
    assert.match(view, /WORKFLOWS ARE AN ACADEMY FEATURE/);
    assert.doesNotMatch(view, /YOUR ANSWER|ReportCard|FieldRow/, 'nothing computed is shown');
  });
  it('no resume question is raised over the members-only notice', () => {
    assert.match(RUN, /if \(draft && limits\.canResume && draftFits && !workflowBlockedRef\.current\) \{/);
  });
});
