/**
 * Every modal must honour Low-Light Production Mode.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * A React Native `Modal` renders in its OWN native container, above everything
 * the app's view tree paints, so the low-light dim wash never reaches inside
 * one. The mode promises the display "stays dim and steady, so nothing flashes
 * during a show" — and in a dark control room, mid-show, an un-washed modal
 * jumps the screen to full brightness.
 *
 * `DimModal` exists so that remembering is not the mechanism. It did not work:
 * bug pass 1 (2026-09-20) found four files still importing the bare Modal
 * without hand-mounting `<LowLightDim/>`, and the worst of them was
 * `AppDialog` — the host for roughly 72 confirmDialog/notify call sites, i.e.
 * nearly every confirmation and notice in the app.
 *
 * Two ways to comply, both accepted here because both are already in use:
 * import `Modal` from `components/DimModal`, or import the bare Modal and
 * render `<LowLightDim/>` as its last child.
 *
 * Source-text, like noRawAlert and accountWipeRegistry, and for the same
 * reason: a crude check that runs beats a precise one that cannot.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import test from 'node:test';

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

/** The one file allowed to import the bare Modal: DimModal itself wraps it. */
const ALLOWED = new Set(['src/components/DimModal.tsx']);

test('no screen renders a Modal that Low-Light Mode cannot reach', () => {
  const offenders: string[] = [];
  for (const file of walk('src')) {
    const rel = file.split(sep).join('/');
    if (ALLOWED.has(rel)) continue;
    const src = readFileSync(file, 'utf8');
    // Only the import FROM react-native counts; `import { Modal } from './DimModal'` is the fix.
    const bare = /import\s*\{[^}]*\bModal\b[^}]*\}\s*from\s*'react-native'/.test(src);
    if (!bare) continue;
    if (!src.includes('LowLightDim')) offenders.push(rel);
  }
  assert.deepEqual(
    offenders,
    [],
    'these import react-native\'s Modal without a LowLightDim — import { Modal } from components/DimModal instead:\n  ' +
      offenders.join('\n  '),
  );
});
