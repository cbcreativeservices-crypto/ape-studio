/**
 * GUARDS — app-shell fixes from the 2026-09-29 bug hunt.
 *
 *  A1  pendingLink.ts loaded React Native / React Navigation through
 *      `eval('require')`, which throws under Metro/Hermes — so link capture
 *      was a silent no-op: no link survived sign-in, and a link arriving while
 *      signed out pushed its screen over Auth.
 *  A2  The audio gate's popups were root-level Modals; asked for while another
 *      Modal was up (a lab's FULL SCREEN), iOS never presented them and
 *      Android drew them behind — every ▶ that needed sound was dead.
 *  A3  ACCEPT on the Sound Safety Warning awaited a slow write with no busy
 *      state; a DECLINE during it was followed by an orphan popup.
 *  A4  One tool screen's `orientation` option unlocked rotation for every
 *      later screen on Android.
 *  A5  The 5-second hold could not be performed with TalkBack / VoiceOver /
 *      Switch Access.
 *  A6  A reminder tapped while signed out opened the app shell over Auth.
 *  A9  The study FULL SCREEN guide auto-appeared in Low-Light.
 *
 * Source-text checks, like noRawAlert and modalLayering, plus the pure link
 * contract through the real module: a crude check that runs beats a precise
 * one that cannot load React Native under node.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  clearPendingLink,
  consumePendingLink,
  pendingLinkUrl,
  setPendingLink,
} from '../src/navigation/pendingLink.ts';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const blank = (s: string) => s.replace(/[^\n]/g, ' ');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));

describe('A1 — deep-link capture actually runs under Metro', () => {
  const src = code('src/navigation/pendingLink.ts');

  test('pendingLink.ts contains no eval(\'require\')', () => {
    assert.doesNotMatch(src, /eval\s*\(\s*['"]require['"]\s*\)/);
  });

  test('its lazy loads are LITERAL requires Metro can bundle', () => {
    assert.match(src, /require\('react-native'\)/);
    assert.match(src, /require\('\.\/navigationRef'\)/);
    assert.match(src, /require\('@react-navigation\/native'\)/);
  });

  test('a link arriving signed out is cut back to Auth; signed in it is not kept', () => {
    assert.match(src, /base === 'Auth'/);
    assert.match(src, /CommonActions\.reset\(\{ index: 0, routes: \[\{ name: 'Auth'/);
    assert.match(src, /base !== 'Splash'\) clearPendingLink\(\)/);
  });

  test('App.tsx still attaches the capture', () => {
    assert.match(code('App.tsx'), /useEffect\(\(\) => attachLinkCapture\(\), \[\]\)/);
  });
});

describe('A6 — a reminder tapped signed out waits for sign-in', () => {
  const app = code('App.tsx');
  const route = app.slice(app.indexOf('function routeLocalDest'), app.indexOf('function App()'));

  test('routeLocalDest parks the destination and navigates nowhere over Auth', () => {
    assert.match(route, /if \(base === 'Auth' \|\| base === 'Splash'\)/);
    assert.match(route, /setPendingLink\(pendingLinkUrl\(path\)\)/);
    assert.match(route, /if \(base === 'Auth'\) return;/);
    // …and that check comes before any navigate.
    assert.ok(route.indexOf("base === 'Auth') return;") < route.indexOf('navigationRef.navigate('));
  });

  test('every reminder dest maps to a path the link contract accepts', () => {
    const m = app.match(/const LOCAL_DEST_PATH[^=]*=\s*\{([\s\S]*?)\};/);
    assert.ok(m, 'LOCAL_DEST_PATH missing');
    const paths = [...m[1].matchAll(/:\s*'([^']+)'/g)].map((x) => x[1]);
    assert.ok(paths.length >= 2);
    for (const p of paths) {
      clearPendingLink();
      assert.ok(setPendingLink(pendingLinkUrl(p)), `${p} is not an accepted link`);
      assert.equal(consumePendingLink(), p);
    }
  });
});

describe('A2 — gate popups are hosted inside an open Modal', () => {
  const dim = code('src/components/DimModal.tsx');
  const gate = code('src/features/audio/AudioOutputGate.tsx');
  const warning = code('src/features/audio/SoundSafetyWarning.tsx');

  test('DimModal registers visible hosts and draws the hosted overlay', () => {
    assert.match(dim, /export function useModalHostOpen\(/);
    assert.match(dim, /export function setHostedOverlay\(/);
    assert.match(dim, /\{o\.node\}/);
    // BACK goes to the (topmost) overlay first, not the sheet under it.
    assert.match(dim, /if \(topOverlay\) topOverlay\.onBack\(\);/);
  });

  test('the gate publishes to the host while one is open', () => {
    assert.match(gate, /const hostOpen = useModalHostOpen\(\)/);
    assert.match(gate, /setHostedOverlay\(hostedBody \?/);
  });

  test('the gate\'s own root Modals show only when no host is open, and never host', () => {
    const roots = [...gate.matchAll(/<Modal[\s\S]*?>/g)].map((m) => m[0]);
    assert.equal(roots.length, 2, 'expected the explain + hold root Modals');
    for (const r of roots) {
      assert.match(r, /hostsOverlays=\{false\}/);
      assert.match(r, /&& rootShown\}/);
    }
    assert.match(gate, /visible=\{phase === 'safety' && rootShown\}/);
    assert.match(warning, /hostsOverlays=\{false\}/);
    assert.match(warning, /if \(embedded\) return visible \? body : null;/);
  });
});

describe('A3 — a late acknowledgment write cannot open an orphan popup', () => {
  const gate = code('src/features/audio/AudioOutputGate.tsx');
  const accept = gate.slice(gate.indexOf('const acceptSafety'), gate.indexOf('const explainBody'));

  test('settle() retires the request', () => {
    assert.match(gate, /requestGen\.current \+= 1;/);
  });

  test('ACCEPT captures the request and bails if it was settled meanwhile', () => {
    assert.match(accept, /const gen = requestGen\.current;/);
    const bail = accept.indexOf('if (requestGen.current !== gen) return;');
    assert.ok(bail > 0, 'no stale-request bail');
    assert.ok(bail < accept.indexOf("setPhase('explain')"), 'bail must precede the next step');
  });

  test('ACCEPT is single-shot while the write runs', () => {
    assert.match(accept, /if \(savingAck\) return;/);
    assert.match(accept, /setSavingAck\(true\)/);
    assert.match(accept, /finally \{\s*setSavingAck\(false\);/);
  });
});

describe('A4 — every native stack defaults to portrait', () => {
  test('NAV_PORTRAIT is portrait_up', () => {
    assert.match(code('src/navigation/navOrientation.ts'), /orientation: 'portrait_up'/);
  });
  for (const f of ['RootNavigator', 'StudyStack', 'AchievementsStack']) {
    test(`${f} spreads it into screenOptions`, () => {
      // Via useNavOrientation(): NAV_PORTRAIT on a phone, free on a tablet
      // (Android large-screen pass 2026-09-29 — test/androidLargeScreenPass).
      assert.match(code(`src/navigation/${f}.tsx`), /const navOrientation = useNavOrientation\(\);/);
      assert.match(code(`src/navigation/${f}.tsx`), /screenOptions=\{\{[^}]*\.\.\.navOrientation/);
    });
  }
});

describe('A5 — the hold works with assistive technology', () => {
  const hold = code('src/components/HoldToActivate.tsx');
  test('ACTIVATE is declared and runs the timed hold, announced', () => {
    assert.match(hold, /accessibilityActions=\{\[\{ name: 'activate' \}\]\}/);
    assert.match(hold, /onAccessibilityAction=\{onAccessibilityAction\}/);
    assert.match(hold, /actionName !== 'activate'/);
    assert.match(hold, /AccessibilityInfo\.announceForAccessibility\(/);
  });
});

describe('A9 — no auto guide in Low-Light', () => {
  test('StudyFsOverlay gates its guide on overlay suppression', () => {
    const fs = code('src/components/StudyFsOverlay.tsx');
    assert.match(fs, /const suppressed = useOverlaysSuppressed\(\);/);
    assert.match(fs, /guideCount\.current < 2 && !suppressed/);
  });
});
