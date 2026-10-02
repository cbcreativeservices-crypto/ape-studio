/**
 * Glossary "toddler + cat" pass 3 of the day, 2026-09-30 (bug pass 2 of 3).
 *
 *  1. The screen's three popups (media viewer, held-chip list, bookmark popup)
 *     are DimModal hosts, not raw react-native Modals with a hand-mounted wash.
 *  2. The topic gate's EXPLORE MEMBERSHIP waits for its prompt to fade before
 *     presenting the Paywall (same hand-off as the weekly lock).
 *  3. ALLOW TEMPORARY ID on the NOT NOW card does not re-raise the consent
 *     dialog over the mint it has already started.
 *  4. A double tap on SAVE ALL does not read its second tap as STOP.
 *  5. A save that fails after the reader left (or tapped STOP) raises no popup.
 *  6. The bookmark popup's list read cannot surface as an unhandled rejection.
 *  7. A STUCK device key shows the load-error card (with RETRY), not
 *     "No results for All".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const screen = readFileSync('src/screens/glossary/GlossaryScreen.tsx', 'utf8');

test('the glossary popups are DimModal hosts, with no hand-mounted wash', () => {
  const rnImport = screen.match(/import \{([^}]*)\} from 'react-native';/);
  assert.ok(rnImport, 'react-native import not found');
  assert.ok(!/\bModal\b/.test(rnImport[1]), 'Modal is imported from react-native again');
  assert.match(screen, /import \{ Modal \} from '\.\.\/\.\.\/components\/DimModal';/);
  assert.ok(!/<LowLightDim \/>/.test(screen), 'a hand-mounted LowLightDim is back inside a Modal');
  assert.equal((screen.match(/<Modal /g) ?? []).length, 3);
});

test('EXPLORE MEMBERSHIP on the topic gate waits out the prompt fade', () => {
  const gate = screen.slice(screen.indexOf('visible={topicGate}'));
  // Through the shared hand-off (pattern P5, 2026-10-02): waits HOST_DISMISS_MS.
  assert.match(gate.slice(0, 900), /setTopicGate\(false\);\s*paywallHandoff\(\(\) => \(navigation as any\)\.navigate\('Paywall'\)\);/);
});

test('ALLOW on the NOT NOW card holds the consent dialog back while it mints', () => {
  const grant = screen.slice(screen.indexOf('const grantDeviceKey = useCallback('));
  const body = grant.slice(0, grant.indexOf('}, []);'));
  const hold = body.indexOf('askingRef.current = true;');
  assert.ok(hold > 0, 'grantDeviceKey no longer claims the dialog flag');
  assert.ok(hold < body.indexOf('setDeclinedThisVisit(false);'), 'the flag must be claimed before declined clears');
  assert.match(body, /const r = await mintDeviceKey\(\);\s*mintingRef\.current = false;\s*askingRef\.current = false;/);
});

test('SAVE ALL: only a tap on the STOP label stops, and a stopped/left save stays quiet', () => {
  const save = screen.slice(screen.indexOf('const saveWholeGlossary = useCallback('));
  const head = save.slice(0, 700);
  assert.match(head, /if \(savingOffline \|\| savingRef\.current\) \{[\s\S]*?if \(savingOffline\) cancelSaveRef\.current = true;\s*return;/);
  const catchBlock = save.slice(save.indexOf('} catch {'), save.indexOf('} finally {'));
  assert.match(catchBlock, /if \(!cancelSaveRef\.current\) \{\s*notify\(/);
});

test('the bookmark popup list read has a rejection handler', () => {
  assert.match(screen, /listBookmarkContexts\(\)\.then\(setBmContexts, \(\) => \{\}\)/);
});

test('a stuck device key lands on the load-error card', () => {
  assert.match(screen, /if \(!keyReady\) \{[\s\S]{0,500}?if \(alive && keyStuck\) setLoadError\(true\);\s*return;\s*\}/);
});
