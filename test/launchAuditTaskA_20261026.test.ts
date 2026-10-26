/**
 * Comp A launch audit (2026-10-24), Task A — the OTA-safe items:
 *   2. crash reports carry the build's channel (preview builds no longer report as production);
 *   3. the TEMP lab probe cannot open in a store build;
 *   4. queued study time is sent before a forced sign-out wipes it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

test('2 · Sentry environment follows the EAS channel', () => {
  const s = read('src/features/telemetry/telemetry.ts');
  assert.match(s, /environment: sentryEnvironment\(__DEV__, updatesChannel\(\)\),/);
  assert.doesNotMatch(s, /environment: __DEV__ \? 'development' : 'production'/);
  // The mapping itself (pure; mirrored here so the test needs no native stubs).
  const body = /export function sentryEnvironment[\s\S]*?\n\}/.exec(s)?.[0] ?? '';
  assert.match(body, /if \(dev\) return 'development';/);
  assert.match(body, /return c === 'preview' \|\| c === 'development' \? c : 'production';/);
  // eas.json really has these channels.
  const eas = JSON.parse(read('eas.json'));
  const channels = Object.values(eas.build as Record<string, { channel?: string }>).map((b) => b.channel).filter(Boolean);
  for (const c of ['development', 'preview', 'production']) assert.ok(channels.includes(c), c);
});

test('3 · the lab probe is dev-only', () => {
  assert.match(read('src/screens/lab/LabShell.tsx'), /onTitlePress=\{__DEV__ \? titleTap : undefined\}/);
  assert.match(read('src/features/lab/labProbe.ts'), /export function labProbe\(msg: string\): void \{\n\s*\/\/[^\n]*\n\s*if \(!__DEV__\) return;/);
  // With no handler the title is not pressable at all.
  assert.match(read('src/screens/lab/kit/LabNavBar.tsx'), /disabled=\{!onTitlePress\}/);
});

test('4 · forced sign-out flushes the study queue first, bounded', () => {
  const s = read('src/features/account/SingleDeviceGuard.tsx');
  const flush = s.indexOf("await softDeadline(() => replayQueue(), undefined, 'forced sign-out study flush', 5000);");
  const signOut = s.indexOf('await signOutThisDevice();');
  const wipe = s.indexOf('await clearLocalAccountData();');
  assert.ok(flush > 0 && flush < signOut && signOut < wipe, 'flush → sign out → wipe');
});
