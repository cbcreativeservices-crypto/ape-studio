import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Bug pass 3 (lead, 2026-09-30): a confirm dialog's "See membership" opened the
// Paywall (presentation: 'modal') in the same tap that closed the dialog's own
// Modal — iOS refuses that, so the button did nothing. The handler now waits
// out the dismissal via afterDialogCloses().
const read = (p: string) => readFileSync(p, 'utf8');

test('confirm.ts exports afterDialogCloses waiting HOST_DISMISS_MS', () => {
  const s = read('src/lib/confirm.ts');
  assert.match(s, /export function afterDialogCloses/);
  assert.match(s, /setTimeout\(fn, HOST_DISMISS_MS\)/);
});

for (const f of [
  'src/screens/lab/calc/CalcLabScreen.tsx',
  'src/screens/lab/calc/CalcProjectsScreen.tsx',
  'src/screens/lab/calc/CalcWorkflowsScreen.tsx',
  'src/screens/lab/calc/CalcWorkspaceScreen.tsx',
  'src/screens/lab/tube/TubeReferenceScreen.tsx',
]) {
  test(`${f}: dialog → Paywall waits for the dialog to close`, () => {
    const s = read(f);
    assert.match(s, /afterDialogCloses\(\(\) => [^\n]*\.navigate\('Paywall'\)\)/);
    // …and no dialog handler still navigates to the Paywall directly.
    assert.doesNotMatch(s, /^\s*\(\) => [^\n]*\.navigate\('Paywall'\),\s*$/m);
  });
}

// Bug pass 3 (lead): PagedLab never saves a copy it restored as a guest — a
// signed-in learner whose first tier read failed would otherwise write the
// empty guest copy over real progress once the tier resolved.
test('PagedLab: a guest-loaded copy is never saved', () => {
  const s = read('src/screens/lab/kit/PagedLab.tsx');
  assert.match(s, /loadedAsGuestRef\.current = guestRef\.current;/);
  const saves = s.match(/void savePagedProgress\(/g) ?? [];
  const guarded = s.match(/!loadedAsGuestRef\.current\) void savePagedProgress\(/g) ?? [];
  assert.equal(guarded.length, saves.length);
});
