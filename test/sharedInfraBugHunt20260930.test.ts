/**
 * GUARDS — shared-infrastructure fixes from the 2026-09-30 "toddler + cat" pass.
 *
 *  S1  confirmDialog / notify raised while another Modal was open (a sheet, a
 *      lab's FULL SCREEN), or as one closed (Settings → Redeem: close + "Code
 *      applied" in one tap), presented a second Modal that iOS refused — no
 *      popup, and `current` never cleared, so every later dialog (Log out
 *      included) queued silently behind it. AppDialogHost now publishes into
 *      the open DimModal and waits out a closing one; DimModal's hosted slot is
 *      KEYED so the audio gate and the dialogs cannot wipe each other.
 *  S2  A weekly-concept push tapped while signed out pushed its card over Auth.
 *  S3  Haptics OFF was ignored by shake-to-mute and the celebration buzz, and
 *      several haptic promises had no .catch (unhandled rejections).
 *  S4  HoldToActivate: a second start over a live hold leaked its interval.
 *
 * Source-text checks in the house style (see appShellBugHunt20260929): these
 * modules load React Native, which node cannot.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const blank = (s: string) => s.replace(/[^\n]/g, ' ');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));

describe('S1 — app dialogs never present over (or just after) another Modal', () => {
  const dim = code('src/components/DimModal.tsx');
  const dlg = code('src/components/AppDialog.tsx');

  test('DimModal keys hosted overlays by publisher and draws them all', () => {
    assert.match(dim, /export function setHostedOverlay\(overlay: HostedOverlay \| null, key = 'gate'\)/);
    assert.match(dim, /const hosted = new Map<string, HostedOverlay>\(\)/);
    assert.match(dim, /mine\.map\(\(o\) =>/);
  });

  test('DimModal records when a host closed, and exposes the hold', () => {
    assert.match(dim, /lastHostClosedAt = Date\.now\(\)/);
    assert.match(dim, /export function rootModalHoldMs\(/);
  });

  test('a publisher Modal is not "another Modal" to itself', () => {
    // Keyed since pass 1 of 2026-09-30 — see sharedInfraBugHunt20260930Pass1.
    assert.match(dim, /export function useModalHostOpen\(exceptPublishers: boolean \| string \| string\[\] = false\)/);
    assert.match(dim, /const publisher: string \| false = overlayPublisher === true \? 'publisher' : overlayPublisher \|\| false;/);
  });

  test('AppDialogHost hosts inside an open Modal and waits out a closing one', () => {
    assert.match(dlg, /useModalHostOpen\(\['dialog', 'gate'\]\)/);
    assert.match(dlg, /setHostedOverlay\([\s\S]*?'dialog'\)/);
    assert.match(dlg, /rootModalHoldMs\(\)/);
    assert.match(dlg, /ownModal\.current = live && !hostedMode && holdMs <= 0;/);
    assert.match(dlg, /overlayPublisher="dialog"/);
  });

  test('the audio gate still publishes under its own key', () => {
    const gate = code('src/features/audio/AudioOutputGate.tsx');
    assert.match(gate, /setHostedOverlay\(hostedBody \?/);
    assert.doesNotMatch(gate, /'dialog'/);
  });
});

describe('S2 — nothing sits above Auth: the weekly-concept push', () => {
  test('the live push handler refuses to navigate over an Auth base', () => {
    const app = code('App.tsx');
    const open = app.slice(app.indexOf('const open = (payload'), app.indexOf('const openLocal'));
    assert.match(open, /if \(base === 'Auth'\) return;/);
    assert.ok(open.indexOf("base === 'Auth'") < open.indexOf("navigate('WeeklyConcept'"));
  });
});

describe('S3 — Settings → Haptics OFF is honoured, and haptics never reject unhandled', () => {
  test('shake-to-mute and the celebration buzz check hapticsEnabled()', () => {
    assert.match(code('src/features/audio/ShakeToMute.tsx'), /if \(hapticsEnabled\(\)\) void Haptics\.notificationAsync[^\n]*\.catch\(/);
    assert.match(code('src/features/celebration/Celebration.tsx'), /if \(!hapticsEnabled\(\)\) return;/);
  });

  test('shared haptic calls catch their promise', () => {
    for (const f of ['src/components/Section.tsx', 'src/screens/lab/rack/DockButton.tsx', 'src/screens/lab/rack/DockTray.tsx']) {
      const src = code(f);
      for (const m of src.matchAll(/Haptics\.(selectionAsync|impactAsync|notificationAsync)\([^)]*\)(\)?)([^\n]*)/g)) {
        assert.match(m[0], /\.catch\(/, `${f}: ${m[0].trim()}`);
      }
    }
  });
});

describe('S4 — HoldToActivate clears a live hold before starting another', () => {
  test('start() stops the old animation and interval first', () => {
    const src = code('src/components/HoldToActivate.tsx');
    const start = src.slice(src.indexOf('const start = () =>'), src.indexOf('tick.current = setInterval'));
    assert.match(start, /anim\.current\?\.stop\(\);\s*clearTick\(\);/);
  });
});
