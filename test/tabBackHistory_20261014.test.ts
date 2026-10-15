/**
 * Android BACK between the bottom tabs (owner bug report 2026-10-14, Pixel:
 * "the back swipe jumps straight to Home instead of the previous screen").
 *
 * Root cause: MainTabs had no `backBehavior`, so React Navigation's tab default
 * 'firstRoute' sent every BACK that left a tab to Home. The fix is
 * tabBackRouter (src/navigation/lazyScreen.ts) on top of backBehavior="history":
 *   1. BACK retraces the tabs actually visited;
 *   2. Home is the root — arriving there clears the history (BACK on Home
 *      leaves the app, no ping-pong into the tab just left);
 *   3. a non-Home tab with nothing behind it goes Home first.
 *
 * 1. Behaviour with @react-navigation/routers' REAL TabRouter, merged with the
 *    override exactly as core's useNavigationBuilder merges UNSTABLE_router.
 * 2. RATCHET: every bottom-tab navigator in src/ declares a backBehavior, and
 *    MainTabs keeps 'history' + tabBackRouter.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, it } from 'node:test';
import { join, relative, sep } from 'node:path';

const { tabBackRouter, TAB_HOME } = await import('../src/navigation/lazyScreen.ts');
const { TabRouter, CommonActions, TabActions } = await import('@react-navigation/routers');

const NAMES = ['Home', 'Study', 'Achievements', 'Profile'];
const opts = { routeNames: NAMES, routeParamList: {}, routeGetIdList: {} };

function makeRouter(backBehavior: 'history' | 'firstRoute', withOverride: boolean) {
  const original = TabRouter({ backBehavior, initialRouteName: 'Home' } as any);
  return withOverride ? { ...original, ...tabBackRouter(TAB_HOME)(original as any) } : original;
}

/** Drive a router through tab jumps; `back()` = what Android BACK dispatches. */
function app(router: any, start: any = router.getInitialState(opts)) {
  let state = start;
  const focused = () => state.routes[state.index].name;
  return {
    focused,
    go(name: string) {
      const next = router.getStateForAction(state, CommonActions.navigate(name), opts);
      assert.ok(next, `navigate(${name}) handled`);
      state = next;
    },
    jump(name: string) {
      state = router.getStateForAction(state, TabActions.jumpTo(name), opts);
    },
    /** null = unhandled → bubbles to the root stack → Android leaves the app. */
    back(): string | null {
      const next = router.getStateForAction(state, CommonActions.goBack(), opts);
      if (next === null) return null;
      state = next;
      return focused();
    },
    canGoBack: () => router.getStateForAction(state, CommonActions.goBack(), opts) !== null,
  };
}

describe('tab BACK — the owner bug, reproduced on the old config', () => {
  it("'firstRoute' (the old default) sends Profile → Achievements → BACK to Home", () => {
    const a = app(makeRouter('firstRoute', false));
    a.go('Profile');
    a.go('Achievements');
    assert.equal(a.back(), 'Home'); // the bug: the user came from Profile
  });
});

describe('tab BACK — history + Home is the root', () => {
  const fixed = () => app(makeRouter('history', true));

  it('BACK returns to the tab the user came from', () => {
    const a = fixed();
    a.go('Profile');
    a.go('Achievements');
    assert.equal(a.back(), 'Profile');
    assert.equal(a.back(), 'Home');
    assert.equal(a.back(), null, 'BACK on Home leaves the app');
  });

  it('retraces a longer trail, de-duplicating revisits', () => {
    const a = fixed();
    a.go('Study');
    a.go('Profile');
    a.go('Achievements');
    a.go('Profile');
    assert.equal(a.back(), 'Achievements');
    assert.equal(a.back(), 'Study');
    assert.equal(a.back(), 'Home');
    assert.equal(a.back(), null);
  });

  it('arriving on Home clears the trail — no ping-pong back into the tab just left', () => {
    const a = fixed();
    a.go('Study');
    a.go('Home'); // tab press, HOME key, or the Glossary's exit
    assert.equal(a.back(), null);
    const b = fixed();
    b.go('Profile');
    b.jump('Home');
    assert.equal(b.back(), null);
  });

  it('a tab with nothing behind it (cold-start deep link) goes Home first, never straight out', () => {
    const router = makeRouter('history', true);
    const deep = router.getRehydratedState(
      { stale: true, index: 1, routes: [{ name: 'Home' }, { name: 'Study' }] } as any,
      opts,
    );
    const a = app(router, deep);
    assert.equal(a.focused(), 'Study');
    assert.equal(a.canGoBack(), true);
    assert.equal(a.back(), 'Home');
    assert.equal(a.back(), null);
  });

  it('canGoBack agrees with BACK (safeGoBack sees the same answer)', () => {
    const a = fixed();
    assert.equal(a.canGoBack(), false);
    a.go('Profile');
    assert.equal(a.canGoBack(), true);
  });

  it('route focus (a nested navigator taking focus) also keeps Home the root', () => {
    const router = makeRouter('history', true);
    let s = router.getStateForAction(router.getInitialState(opts), CommonActions.navigate('Study'), opts);
    const homeKey = s.routes.find((r: any) => r.name === 'Home').key;
    s = router.getStateForRouteFocus(s, homeKey);
    assert.deepEqual(s.history.map((h: any) => h.key), [homeKey]);
  });
});

// ── ratchet ──────────────────────────────────────────────────────────────────

const ROOT = join(import.meta.dirname, '..');
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

describe('ratchet — tab navigators never fall back to the firstRoute default', () => {
  it('MainTabs keeps backBehavior="history" + tabBackRouter', () => {
    const src = readFileSync(join(ROOT, 'src/navigation/MainTabs.tsx'), 'utf8');
    assert.match(src, /backBehavior="history"/);
    assert.match(src, /UNSTABLE_router=\{tabBackRouter\(TAB_HOME\)\}/);
  });

  it('every createBottomTabNavigator file in src/ declares a backBehavior', () => {
    const offenders = walk(join(ROOT, 'src'))
      .filter((f) => /createBottomTabNavigator\s*</.test(readFileSync(f, 'utf8')))
      .filter((f) => !/backBehavior=/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(ROOT, f).split(sep).join('/'));
    assert.deepEqual(offenders, []);
  });

  it('TAB_HOME is MainTabs\' first tab', () => {
    const src = readFileSync(join(ROOT, 'src/navigation/MainTabs.tsx'), 'utf8');
    const first = src.match(/<Tab\.Screen\s+name="([^"]+)"/);
    assert.equal(first?.[1], TAB_HOME);
  });
});
