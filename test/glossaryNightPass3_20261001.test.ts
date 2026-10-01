/**
 * Glossary "toddler + cat + timing" — night bug pass 3 of 3, 2026-10-01.
 *
 *  1. NOT NOW on the device-key consent dialog raised the GlossaryDeviceKeyView
 *     Modal in the same tick the AppDialog Modal started fading out. Nothing in
 *     the shared hold machinery covers it (rootModalHoldMs only delays
 *     AppDialog's OWN Modal), so iOS refused the presentation and, with
 *     `visible` already true, never retried: no card, no way back in. The
 *     state change now waits for the dialog's dismissal (afterDialogCloses).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');

test('NOT NOW raises the device-key card only after the dialog has closed', () => {
  const src = read('src/screens/glossary/GlossaryScreen.tsx');
  assert.match(src, /import \{ afterDialogCloses, confirmDialog, notify \} from '\.\.\/\.\.\/lib\/confirm';/);
  const i = src.indexOf('cancelText: COPY.glossaryDeviceKeyNotNow,');
  assert.ok(i > 0);
  const handler = src.slice(i, i + 1200);
  assert.match(
    handler,
    /onCancel: afterDialogCloses\(\(\) => \{\s*askingRef\.current = false;[\s\S]*?setDeclinedThisVisit\(true\);\s*\}\),/,
  );
  // Never raised synchronously from the dialog handler any more.
  assert.doesNotMatch(handler, /onCancel: \(\) => \{\s*askingRef\.current = false;/);
});
