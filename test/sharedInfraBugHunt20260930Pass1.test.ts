/**
 * GUARDS — shared-infrastructure fixes from BUG PASS 1 of 2026-09-30 (day).
 *
 *  P1  A confirm/notice raised while the AUDIO GATE's own root popup was up
 *      (explain, hold, or the Sound Safety Warning) presented a second root
 *      Modal: refused on iOS, AppDialog's `current` never cleared, and every
 *      later confirm queued behind it. The gate's popups now HOST as the named
 *      'gate' publisher; AppDialog hosts inside them, with a tie-break so the
 *      two never both move into each other.
 *  P2  HoldToActivate completed with the onComplete captured at press-in.
 *  P3  DeleteAccountButton's hold ran on after an unmount and raised "Delete
 *      account permanently?" over the next screen.
 *  P4  The Profile audio row demanded a SECOND 5-second hold (the gate's).
 *  P5  Exposure check-in buzzed with Settings → Haptics OFF; MicFeedbackGuard's
 *      genStop could reject unhandled.
 *  P6  StudyFsOverlay could overwrite a retired guide count before reading it.
 *  P7  ShareTermSheet SHARE AS TEXT could stack two system share sheets.
 *
 * Source-text checks in the house style: these modules load React Native.
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

describe('P1 — a dialog over the audio gate popup is drawn inside it', () => {
  const dim = code('src/components/DimModal.tsx');
  const dlg = code('src/components/AppDialog.tsx');
  const gate = code('src/features/audio/AudioOutputGate.tsx');
  const warning = code('src/features/audio/SoundSafetyWarning.tsx');

  test('DimModal names publishers and can count around / for one', () => {
    assert.match(dim, /publisher: string \| false/);
    assert.match(dim, /export function usePublisherModalOpen\(name: string\)/);
    assert.match(dim, /counter\('except', \(\[\] as string\[\]\)\.concat\(exceptPublishers\)\)/);
    // A bare `overlayPublisher` (MembershipGate) keeps working.
    assert.match(dim, /overlayPublisher === true \? 'publisher'/);
  });

  test('every gate popup is a host as the gate publisher, skipped by the gate itself', () => {
    assert.match(gate, /const hostOpen = useModalHostOpen\('gate'\)/);
    const roots = [...gate.matchAll(/<Modal[\s\S]*?>/g)].map((m) => m[0]);
    assert.equal(roots.length, 2);
    for (const r of roots) {
      assert.match(r, /overlayPublisher="gate"/);
      assert.doesNotMatch(r, /hostsOverlays=\{false\}/);
    }
    assert.match(warning, /overlayPublisher="gate"/);
    assert.doesNotMatch(warning, /hostsOverlays=\{false\}/);
  });

  test('AppDialog treats the gate popup as another Modal, with a stable tie-break', () => {
    assert.match(dlg, /const gateOpen = usePublisherModalOpen\('gate'\)/);
    assert.match(dlg, /const otherModalOpen = sheetOpen \|\| \(gateOpen && !ownModal\.current\)/);
    // The choice is recorded BEFORE the early return, every render.
    const i = dlg.indexOf('ownModal.current = live && !hostedMode && holdMs <= 0;');
    assert.ok(i > 0 && i < dlg.indexOf('if (!ownModal.current) return null;'));
  });
});

describe('P2 — HoldToActivate completes with the LATEST onComplete', () => {
  test('reads a ref updated every render', () => {
    const src = code('src/components/HoldToActivate.tsx');
    assert.match(src, /onCompleteRef\.current = onComplete;/);
    assert.match(src, /onCompleteRef\.current\(\);/);
    assert.doesNotMatch(src, /\bonComplete\(\);/);
  });
});

describe('P3 — DeleteAccountButton stops its hold on unmount and on a second press', () => {
  test('unmount cleanup + start clears the previous hold', () => {
    const src = code('src/features/settings/DeleteAccountButton.tsx');
    assert.match(src, /useEffect\(\(\) => \(\) => \{\s*anim\.current\?\.stop\(\);\s*clearTick\(\);\s*\}, \[\]\);/);
    const start = src.slice(src.indexOf('const start = () =>'), src.indexOf('const askFinalConfirm'));
    assert.ok(start.indexOf('anim.current?.stop();') < start.indexOf('tick.current = setInterval'));
    assert.ok(start.indexOf('clearTick();') < start.indexOf('tick.current = setInterval'));
  });
});

describe('P4 — the Profile audio row needs one hold, not two', () => {
  test('an accepted warning enables directly; a first use still goes through the gate', () => {
    const src = code('src/features/audio/AudioOutputRow.tsx');
    const body = src.slice(src.indexOf('onComplete={() => {'));
    assert.match(body, /if \(isAcknowledged\(\)\) \{\s*enableAudioOutput\(\);\s*noteAudioActivity\(\);\s*return;\s*\}/);
    assert.ok(body.indexOf('isAcknowledged()') < body.indexOf('requestAudioOutput()'));
  });
});

describe('P5 — haptics OFF and unhandled rejections', () => {
  test('the exposure check-in honours Settings → Haptics', () => {
    assert.match(
      code('src/features/audio/ExposureCheckin.tsx'),
      /if \(snap\.settings\.haptics && hapticsEnabled\(\)\) void Haptics\.impactAsync/,
    );
  });
  test('MicFeedbackGuard catches genStop', () => {
    assert.match(code('src/features/audio/MicFeedbackGuard.tsx'), /ApeDsp\.genStop\(\)\.catch\(\(\) => \{\}\)/);
  });
});

describe('P6 — the study full-screen guide never counts before it has read', () => {
  test('guideLoaded gates the showing', () => {
    const src = code('src/components/StudyFsOverlay.tsx');
    assert.match(src, /\.finally\(\(\) => \{\s*guideLoaded\.current = true;\s*\}\)/);
    assert.match(src, /visible && !wasVisible\.current && guideLoaded\.current && guideCount\.current < 2/);
  });
});

describe('P7 — SHARE AS TEXT is busy while the system sheet is up', () => {
  test('sets busy before Share.share and clears it after', () => {
    const src = code('src/components/ShareTermSheet.tsx');
    const fn = src.slice(src.indexOf('const doShareText'), src.indexOf('const doShareImage'));
    assert.ok(fn.indexOf('setBusy(true)') >= 0 && fn.indexOf('setBusy(true)') < fn.indexOf('Share.share'));
    assert.match(fn, /setBusy\(false\);\s*onClose\(\);/);
  });
});
