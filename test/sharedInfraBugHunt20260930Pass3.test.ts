/**
 * GUARDS — shared-infrastructure fixes from BUG PASS 3 of 2026-09-30 (day).
 *
 *  R1  DimModal gains `lowLightDim` (default true) so a surface that another
 *      device must scan (Profile's full-ID code) can opt out of the wash.
 *  R2  MembershipGate ignored the dialog's and the audio gate's popups
 *      (`useModalHostOpen(true)`), so a membership card asked for over either
 *      presented a second root Modal — refused on iOS. Now counted, with
 *      AppDialog's tie-break (whoever already holds its own Modal keeps it).
 *  R3  PagedLab restored saved progress before the tier resolved: the guest
 *      check read "not a guest", so a signed-out device restored the previous
 *      account's place. The restore now waits for `resolved`.
 *  R4  The gate's re-present timer restored the OLD step even after an ACCEPT
 *      had moved it on — the Sound Safety Warning came back after acceptance.
 *  R5  SpeakButton: a previous utterance's STOPPED callback reset the new one.
 *  R6  The red AUDIO OUTPUT row "mutes immediately" — it only flipped the flag;
 *      a native tone or speech played on. It now runs panicMuteAudio().
 *  R7  RackUnit's leave-full-screen-then-present timer outlived the rack.
 *  R8  StudyFsOverlay: Android BACK with the guide card up left full screen.
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

describe('R1 — DimModal can opt out of the Low-Light wash', () => {
  test('lowLightDim defaults to true and gates only the wash', () => {
    const s = code('src/components/DimModal.tsx');
    assert.match(s, /lowLightDim = true,/);
    assert.match(s, /lowLightDim\?: boolean;/);
    assert.match(s, /\{lowLightDim \? <LowLightDim \/> : null\}/);
    assert.doesNotMatch(s, /^\s*<LowLightDim \/>\s*$/m);
  });
});

describe('R2 — the membership card is hosted inside an open dialog / gate popup', () => {
  const g = code('src/features/commercial/MembershipGate.tsx');
  const host = g.slice(g.indexOf('export function MembershipGateHost'), g.indexOf('const styles'));
  test('counts every other Modal, with a stable tie-break', () => {
    assert.match(host, /const sheetOpen = useModalHostOpen\(true\);/);
    assert.match(host, /const anyOtherOpen = useModalHostOpen\('membership'\);/);
    assert.match(host, /const otherModalOpen = sheetOpen \|\| \(anyOtherOpen && !ownModal\.current\);/);
    const i = host.indexOf('ownModal.current = live && !hostedMode && holdMs <= 0;');
    assert.ok(i > 0 && i < host.indexOf('if (!ownModal.current) return null;'));
  });
  test('its own Modal is the named "membership" publisher', () => {
    assert.match(host, /overlayPublisher="membership"/);
  });
  test('AppDialog and the gate still count the membership Modal as another Modal', () => {
    assert.match(code('src/components/AppDialog.tsx'), /useModalHostOpen\(\['dialog', 'gate'\]\)/);
    assert.match(code('src/features/audio/AudioOutputGate.tsx'), /useModalHostOpen\('gate'\)/);
  });
});

describe('R3 — PagedLab restores only once the tier is known', () => {
  test('the load effect waits for `resolved`; the pre-load reset is keyed on the lab only', () => {
    const s = code('src/screens/lab/kit/PagedLab.tsx');
    const load = s.slice(s.indexOf('if (!resolved) return;'), s.indexOf('const persist = useCallback'));
    assert.ok(load.includes('loadPagedProgress(labId)'));
    assert.match(load, /\}, \[labId, pagesWithCheck\.length, resolved\]\);/);
    assert.doesNotMatch(load, /navigatedRef\.current = false;/);
    assert.match(
      s,
      /useEffect\(\(\) => \{\s*navigatedRef\.current = false;\s*preloadRef\.current = \{ done: new Set\(\) \};\s*\}, \[labId, pagesWithCheck\.length\]\);/,
    );
  });
});

describe('R4 — the gate re-present never undoes a step taken meanwhile', () => {
  test('restores only while the phase is still closed', () => {
    const s = code('src/features/audio/AudioOutputGate.tsx');
    assert.match(s, /requestGen\.current === gen && phaseRef\.current === 'closed'\) setPhase\(current\)/);
  });
});

describe('R5 — SpeakButton ignores a previous utterance’s callbacks', () => {
  test('each utterance is numbered and every callback checks it', () => {
    const s = code('src/components/SpeakButton.tsx');
    assert.match(s, /const my = \+\+utterance\.current;/);
    assert.match(s, /const ours = \(\) => mine\.current && utterance\.current === my;/);
    assert.equal((s.match(/if \(ours\(\)\)/g) ?? []).length, 3);
    assert.doesNotMatch(s, /if \(mine\.current\) \{/);
  });
});

describe('R6 — the AUDIO OUTPUT row mutes everything', () => {
  test('tapping the ON row runs panicMuteAudio', () => {
    const s = code('src/features/audio/AudioOutputRow.tsx');
    assert.match(s, /onPress=\{\(\) => panicMuteAudio\(\)\}/);
    assert.doesNotMatch(s, /onPress=\{disableAudioOutput\}/);
  });
});

describe('R7 — RackUnit clears its pending present on unmount', () => {
  test('the timer is held in a ref and cleared', () => {
    const s = code('src/screens/lab/rack/RackUnit.tsx');
    assert.match(s, /leaveTimer\.current = setTimeout\(/);
    assert.match(s, /useEffect\(\(\) => \(\) => \{\s*if \(leaveTimer\.current\) clearTimeout\(leaveTimer\.current\);\s*\}, \[\]\);/);
  });
});

describe('R9 — HelpKey always sends a search, so an old filter never sticks', () => {
  test("'' when the key has none, and still pops to an existing Help", () => {
    const s = code('src/components/HelpKey.tsx');
    assert.match(s, /navigation\.navigate\('Help', \{ search: search \?\? '' \}, \{ pop: true \}\)/);
    // HelpScreen re-applies the pre-fill only when one is sent.
    assert.match(code('src/screens/help/HelpScreen.tsx'), /if \(routeSearch !== undefined\) setQuery\(routeSearch\);/);
  });
});

describe('R8 — StudyFsOverlay: BACK closes the guide before full screen', () => {
  test('onRequestClose goes to the guide while it is up', () => {
    const s = code('src/components/StudyFsOverlay.tsx');
    assert.match(s, /onRequestClose=\{showGuide \? \(\) => setShowGuide\(false\) : onClose\}/);
  });
});
