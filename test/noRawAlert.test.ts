/**
 * No screen may call the platform `Alert` directly.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 *
 * Owner, 2026-09-19, after seeing one on the Pixel: "i have twice now seen pop
 * up screens like this completely out of our app style guide and aesthetic
 * standards."
 *
 * The app has had a themed dialog since 2026-09-13 — `confirmDialog` / `notify`
 * in src/lib/confirm.ts, rendering through AppDialogHost. Roughly 72 call sites
 * already used it. But 33 others in 13 files still called `Alert.alert`
 * directly, so those showed the OS's grey card: wrong typeface, wrong colours,
 * wrong button order, and on RN-web a literal NO-OP — a dead button.
 *
 * Fixing them once does not keep them fixed. `Alert.alert` is the obvious thing
 * to reach for, it is in every RN example, and the damage is invisible until
 * somebody looks at a real device. So this test is the guard: the next one gets
 * caught here rather than in a screenshot weeks later.
 *
 * ⛔ THE ONE LEGITIMATE EXCEPTION is src/lib/confirm.ts itself, which falls
 * back to the platform Alert when AppDialogHost is not mounted. That fallback
 * is load-bearing — it carries Delete Account, sign-out and the single-device
 * takeover, and a themed dialog that never appears would strand the user with
 * no way to continue OR cancel. Ugly-but-working beats pretty-but-absent.
 *
 * If you are adding a dialog: use `confirmDialog(title, body, yesText, onYes)`
 * for two buttons, or `notify(title, body, onDone?)` for one. Both work on web.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

/** The only file allowed to call the platform Alert (see the docblock). */
const ALLOWED = [path.join('lib', 'confirm.ts')];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

describe('no raw platform Alert outside the themed dialog', () => {
  const files = walk(SRC);

  it('finds source to check (guards against a broken walk)', () => {
    assert.ok(files.length > 200, `expected to scan the app, saw ${files.length} files`);
  });

  it('has no Alert.alert call outside src/lib/confirm.ts', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const rel = path.relative(SRC, file);
      if (ALLOWED.some((a) => rel === a)) continue;
      const text = readFileSync(file, 'utf8');
      text.split('\n').forEach((line, i) => {
        if (line.includes('Alert.alert(')) offenders.push(`${rel}:${i + 1}`);
      });
    }
    assert.deepEqual(
      offenders,
      [],
      `Use confirmDialog / notify from src/lib/confirm.ts instead of the platform Alert:\n  ${offenders.join('\n  ')}`,
    );
  });

  it('still keeps the fallback inside confirm.ts, which is load-bearing', () => {
    const text = readFileSync(path.join(SRC, 'lib', 'confirm.ts'), 'utf8');
    assert.ok(
      text.includes('Alert.alert('),
      'confirm.ts must keep its platform fallback for when AppDialogHost is unmounted',
    );
  });
});
