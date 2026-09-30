/**
 * GUARDS — shared-infrastructure fixes from BUG PASS 2 of 2026-09-30 (day).
 *
 *  Q1  HelpKey pushed a SECOND Help when Help was lower in the stack (RN7).
 *  Q2  The listening-exposure check-in (a root sibling) slid in UNDER any open
 *      Modal — a "DOSE REACHED" panel hidden behind a lab's FULL SCREEN. It is
 *      now hosted inside the topmost DimModal ('exposure'), BACK dismisses it,
 *      and the Low-Light / kill-switch gate is unchanged.
 *  Q3  The audio gate's JOIN re-present closed a VISIBLE root popup and asked
 *      for it again 60 ms later — inside iOS's dismissal, so it never came
 *      back; and a late timer could jump a NEW request to the old step.
 *  Q4  A coach mark suppressed at mount popped up when Low-Light was switched
 *      off mid-screen (the six-tap cancel) — the "toggle-off" it promised to
 *      leave alone.
 *  Q5  Speech.stop() is async: its rejection was unhandled (SpeakButton, and
 *      the shake-to-mute safety path). A SYNC native throw in panicMute (e.g.
 *      fxReset) skipped disableAudioOutput() — the shake left the gate ON.
 *  Q6  SpeakButton / AudioPlayer acted after the gate resolved for a component
 *      that had already unmounted; AudioPlayer double-counted a double tap.
 *  Q7  Reminder / push taps pushed a second Awards / WeeklyConcept, and the
 *      exposure panel a second ExposureMonitor, when one was lower in the stack.
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

describe('Q1 — HelpKey returns to an existing Help', () => {
  test('navigate carries { pop: true }', () => {
    assert.match(code('src/components/HelpKey.tsx'), /navigation\.navigate\('Help', search \? \{ search \} : undefined, \{ pop: true \}\)/);
  });
});

describe('Q2 — the exposure check-in is drawn inside an open Modal', () => {
  const src = code('src/features/audio/ExposureCheckin.tsx');
  test('hosted under its own key while any DimModal is open, withdrawn on unmount', () => {
    assert.match(src, /const hostOpen = useModalHostOpen\(\);/);
    assert.match(src, /setHostedOverlay\(hostOpen && panel \? \{ node: panel, onBack: dismiss \} : null, 'exposure'\)/);
    assert.match(src, /useEffect\(\(\) => \(\) => setHostedOverlay\(null, 'exposure'\), \[\]\);/);
    assert.match(src, /return hostOpen \? null : panel;/);
  });
  test('Low-Light / kill-switch still decides whether it appears at all', () => {
    assert.match(src, /if \(areOverlaysSuppressed\(\)\) return;/);
  });
  test('hosted, VIEW EXPOSURE does not navigate behind the Modal', () => {
    const open = src.slice(src.indexOf('const openMonitor'), src.indexOf('return (', src.indexOf('const openMonitor')));
    assert.ok(open.indexOf('if (hostOpen) return;') > 0);
    assert.ok(open.indexOf('if (hostOpen) return;') < open.indexOf('navigate('));
    assert.match(open, /'ExposureMonitor',\s*undefined,\s*\{ pop: true \}/);
  });
  test('the reduce-motion read at the root cannot reject unhandled', () => {
    assert.match(src, /isReduceMotionEnabled\?\.\(\)\s*\.then\([\s\S]*?\)\s*\.catch\(\(\) => \{\}\)/);
  });
});

describe('Q3 — the gate re-presents only a root popup, after its dismissal, for the same request', () => {
  const src = code('src/features/audio/AudioOutputGate.tsx');
  const join = src.slice(src.indexOf('if (resolver.current) {'), src.indexOf('resolver.current = resolve;'));
  test('skips a hosted card; waits HOST_DISMISS_MS; checks the request generation', () => {
    assert.match(join, /if \(current !== 'closed' && !hostOpenRef\.current\)/);
    assert.match(join, /const gen = requestGen\.current;/);
    assert.match(join, /if \(resolver\.current && requestGen\.current === gen\) setPhase\(current\);\s*\}, HOST_DISMISS_MS\);/);
    assert.doesNotMatch(join, /\}, 60\);/);
  });
  test('hostOpenRef mirrors hostOpen every render', () => {
    assert.match(src, /const hostOpenRef = useRef\(hostOpen\);\s*hostOpenRef\.current = hostOpen;/);
  });
});

describe('Q4 — a suppressed coach mark stays down for the rest of that visit', () => {
  test('`started` is set when suppressed, so toggle-off does not re-run the show', () => {
    const src = code('src/lib/coachMark.ts');
    assert.match(src, /if \(suppressed\) \{\s*started\.current = true;\s*return;\s*\}/);
  });
});

describe('Q5 — speech stop and the safety mute', () => {
  test('SpeakButton catches the async Speech.stop()', () => {
    const src = code('src/components/SpeakButton.tsx');
    assert.match(src, /void Promise\.resolve\(Speech\.stop\(\)\)\.catch\(\(\) => \{\}\);/);
    assert.doesNotMatch(src, /^\s*Speech\.stop\(\);/m);
  });
  test('panicMute: every native stop is guarded sync AND async, and disableAudioOutput always runs', () => {
    const src = code('src/features/audio/panicMute.ts');
    assert.match(src, /void Promise\.resolve\(Speech\.stop\(\)\)\.catch\(\(\) => \{\}\);/);
    for (const f of ['genStop', 'binStop', 'modStop', 'fxReset']) {
      assert.match(src, new RegExp(`quiet\\(\\(\\) => ApeDsp\\.${f}\\(\\)\\);`));
    }
    assert.doesNotMatch(src, /^\s*ApeDsp\.fxReset\(\);/m);
    assert.ok(src.lastIndexOf('disableAudioOutput();') > src.lastIndexOf('quiet(() => ApeDsp.fxReset());'));
  });
});

describe('Q6 — nothing plays for a component that is gone', () => {
  test('SpeakButton checks it is still mounted after the gate', () => {
    const src = code('src/components/SpeakButton.tsx');
    assert.match(src, /if \(!ok \|\| !alive\.current\) return;/);
    assert.match(src, /alive\.current = false;/);
  });
  test('AudioPlayer: mounted, latest tap only, native playing flag, rejection caught', () => {
    const src = code('src/components/AudioPlayer.tsx');
    assert.match(src, /const mine = \+\+asking\.current;/);
    assert.match(src, /if \(!allowed \|\| !alive\.current \|\| mine !== asking\.current\) return;/);
    assert.match(src, /if \(player\.playing\) return;/);
    assert.match(src, /\.catch\(\(\) => \{\}\);\s*\};/);
  });
});

describe('Q7 — no duplicate screens from reminders and pushes', () => {
  test('Awards and WeeklyConcept navigate with pop', () => {
    const src = code('App.tsx');
    assert.match(src, /navigationRef\.navigate\('Awards', \{ category: 'curriculum' \}, \{ pop: true \}\);/);
    assert.match(src, /navigationRef\.navigate\('WeeklyConcept', payload, \{ pop: true \}\);/);
  });
});

test('LabEndScreen DONE ignores a repeat tap within 700 ms (no double goBack)', async () => {
  const { readFileSync } = await import('node:fs');
  const s = readFileSync('src/screens/lab/kit/LabEndScreen.tsx', 'utf8');
  assert.match(s, /if \(now - doneAt\.current < 700\) return;/);
  assert.match(s, /onPress=\{done\}/);
});
