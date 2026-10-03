/**
 * Pattern P9b — a double goBack pops two levels (2026-10-02).
 *
 * The class: a screen's `navigation.goBack()` dispatches GO_BACK with
 * `source` = its route key and NO target. RN7's StackRouter then pops the
 * navigator's TOP route (`state.index`), whoever asked. A quick double tap:
 *   - nested stack with more under it → the second press pops the screen
 *     UNDER the one that asked ("a doubled RETURN popped the screen under
 *     the lab");
 *   - nested stack at its root → the router returns null, the action BUBBLES
 *     to the tab navigator (switches tab) or the root stack (pops it).
 *
 * The shared fix is src/lib/safeGoBack.ts: go back only while this screen is
 * still focused, `canGoBack()` is true, and it has not already gone back
 * inside LEAVE_WINDOW_MS.
 *
 * 1. Behaviour, on a faithful model of RN core's dispatch (useNavigationCache
 *    adds `source`; useOnAction tries the navigator's router, null → parent)
 *    with RN7's REAL StackRouter and TabRouter. R2: with raw goBack the
 *    "pops exactly one" tests fail — the raw cases below show it.
 * 2. RATCHET over src/: no raw `.goBack` outside the shared piece. The
 *    allowlist has reasons and may only shrink.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, it, afterEach } from 'node:test';
import { join, relative, sep } from 'node:path';

const { safeGoBack, LEAVE_WINDOW_MS } = await import('../src/lib/safeGoBack.ts');
const { StackRouter, TabRouter, CommonActions, StackActions, TabActions } = await import('@react-navigation/routers');

// ── a faithful little navigation tree ────────────────────────────────────────

type AnyState = any;
type Navigator = { router: any; opts: any; path: string[] };

const opts = (routeNames: string[]) => ({ routeNames, routeParamList: {}, routeGetIdList: {} });

/**
 * Root stack [Main, …root screens]; Main is tabs [Home, Study, Profile];
 * Study is a stack [Dashboard, …]. `path` = route keys from the root down to
 * the route that OWNS the navigator ([] = root).
 */
function makeApp() {
  const root: Navigator = { router: StackRouter({}), opts: opts(['Main', 'FinalExam', 'AwardProgress']), path: [] };
  const rootState = root.router.getInitialState(root.opts);
  const mainKey = rootState.routes[0].key;
  const tabs: Navigator = { router: TabRouter({}), opts: opts(['Home', 'Study', 'Profile']), path: [mainKey] };
  let tabsState = tabs.router.getInitialState(tabs.opts);
  tabsState = tabs.router.getStateForAction(tabsState, TabActions.jumpTo('Study'), tabs.opts);
  const studyKey = tabsState.routes.find((r: any) => r.name === 'Study').key;
  const study: Navigator = { router: StackRouter({}), opts: opts(['Dashboard', 'Topic', 'Lab']), path: [mainKey, studyKey] };
  const studyState = study.router.getInitialState(study.opts);
  let tree: AnyState = {
    ...rootState,
    routes: [{ ...rootState.routes[0], state: { ...tabsState, routes: tabsState.routes.map((r: any) => (r.key === studyKey ? { ...r, state: studyState } : r)) } }],
  };
  let unhandled = 0;

  const stateAt = (path: string[]): AnyState => {
    let s = tree;
    for (const k of path) s = s.routes.find((r: any) => r.key === k).state;
    return s;
  };
  const writeAt = (path: string[], next: AnyState) => {
    const put = (s: AnyState, i: number): AnyState => {
      if (i === path.length) return next;
      return { ...s, routes: s.routes.map((r: any) => (r.key === path[i] ? { ...r, state: put(r.state, i + 1) } : r)) };
    };
    tree = put(tree, 0);
  };
  const navs = [root, tabs, study];
  const parentOf = (n: Navigator) => navs.find((p) => p.path.length === n.path.length - 1 && n.path.slice(0, -1).every((k, i) => p.path[i] === k));

  /** useOnAction: this navigator's router, null → the parent's. */
  const dispatch = (n: Navigator | undefined, action: any) => {
    for (let at = n; at; at = parentOf(at)) {
      const next = at.router.getStateForAction(stateAt(at.path), action, at.opts);
      if (next !== null) {
        writeAt(at.path, next);
        return;
      }
    }
    unhandled++;
  };

  /** The screen navigation object (useNavigationCache): isFocused /
   *  canGoBack / goBack read the store synchronously, as RN's useSyncState. */
  const screen = (n: Navigator, routeKey: string) => {
    const focusedHere = (nav: Navigator, key: string): boolean => {
      const s = stateAt(nav.path);
      if (s.routes[s.index].key !== key) return false;
      const p = parentOf(nav);
      return p ? focusedHere(p, nav.path[nav.path.length - 1]) : true;
    };
    const canGoBack = (nav: Navigator | undefined): boolean =>
      !!nav && (nav.router.getStateForAction(stateAt(nav.path), CommonActions.goBack(), nav.opts) !== null || canGoBack(parentOf(nav)));
    return {
      isFocused: () => {
        try {
          return focusedHere(n, routeKey);
        } catch {
          return false;
        }
      },
      canGoBack: () => canGoBack(n),
      goBack: () => dispatch(n, { ...CommonActions.goBack(), source: routeKey }),
    };
  };

  const push = (n: Navigator, name: string) => {
    dispatch(n, StackActions.push(name));
    const s = stateAt(n.path);
    return s.routes[s.index].key as string;
  };
  return {
    root,
    tabs,
    study,
    push,
    screen,
    names: (n: Navigator) => stateAt(n.path).routes.map((r: any) => r.name),
    focusedTab: () => {
      const s = stateAt(tabs.path);
      return s.routes[s.index].name;
    },
    unhandled: () => unhandled,
  };
}

const realNow = Date.now;
afterEach(() => {
  Date.now = realNow;
});

// ── 1. behaviour ─────────────────────────────────────────────────────────────

describe('the bug, with raw goBack (what safeGoBack exists to stop)', () => {
  it('nested stack [Dashboard, Topic, Lab]: a double RETURN on Lab also pops Topic (the screen under the lab)', () => {
    const app = makeApp();
    app.push(app.study, 'Topic');
    const lab = app.screen(app.study, app.push(app.study, 'Lab'));
    lab.goBack();
    lab.goBack();
    assert.deepEqual(app.names(app.study), ['Dashboard'], 'two levels for one intent');
  });

  it('nested stack at [Dashboard, Lab]: the second GO_BACK bubbles to the tabs and switches to Home', () => {
    const app = makeApp();
    const lab = app.screen(app.study, app.push(app.study, 'Lab'));
    lab.goBack();
    lab.goBack();
    assert.deepEqual(app.names(app.study), ['Dashboard']);
    assert.equal(app.focusedTab(), 'Home');
  });
});

describe('safeGoBack: a double call pops exactly one level', () => {
  it('nested stack [Dashboard, Topic, Lab]: Topic stays', () => {
    const app = makeApp();
    app.push(app.study, 'Topic');
    const lab = app.screen(app.study, app.push(app.study, 'Lab'));
    assert.equal(safeGoBack(lab), true);
    assert.equal(safeGoBack(lab), false);
    assert.deepEqual(app.names(app.study), ['Dashboard', 'Topic']);
  });

  it('nested stack [Dashboard, Lab]: nothing bubbles, the Study tab stays', () => {
    const app = makeApp();
    const lab = app.screen(app.study, app.push(app.study, 'Lab'));
    safeGoBack(lab);
    safeGoBack(lab);
    assert.deepEqual(app.names(app.study), ['Dashboard']);
    assert.equal(app.focusedTab(), 'Study');
  });

  it('two DIFFERENT buttons on the same screen (‹ and DONE) still pop one', () => {
    const app = makeApp();
    app.push(app.study, 'Topic');
    const key = app.push(app.study, 'Lab');
    // useNavigation() in LabHeader and the host's navigation are the SAME
    // cached object in RN; model two handles anyway — the focus rule alone
    // holds even when the window is not shared.
    safeGoBack(app.screen(app.study, key));
    safeGoBack(app.screen(app.study, key));
    assert.deepEqual(app.names(app.study), ['Dashboard', 'Topic']);
  });

  it('root stack: a double Done on FinalExam pops only FinalExam (AwardProgress under it stays)', () => {
    const app = makeApp();
    app.push(app.root, 'AwardProgress');
    const exam = app.screen(app.root, app.push(app.root, 'FinalExam'));
    safeGoBack(exam);
    safeGoBack(exam);
    assert.deepEqual(app.names(app.root), ['Main', 'AwardProgress']);
  });

  it('the focus rule alone refuses the second call, even long after the window', () => {
    const app = makeApp();
    app.push(app.study, 'Topic');
    const lab = app.screen(app.study, app.push(app.study, 'Lab'));
    safeGoBack(lab);
    const t = realNow();
    Date.now = () => t + LEAVE_WINDOW_MS * 10;
    assert.equal(safeGoBack(lab), false);
    assert.deepEqual(app.names(app.study), ['Dashboard', 'Topic']);
  });

  it('the window alone refuses a second call when the store has not moved yet (a stopped/slow leave)', () => {
    let pops = 0;
    const nav = { isFocused: () => true, canGoBack: () => true, goBack: () => void pops++ };
    assert.equal(safeGoBack(nav), true);
    assert.equal(safeGoBack(nav), false);
    assert.equal(pops, 1);
  });

  it('a window, not a one-way latch: a leave stopped by beforeRemove answers the next real tap', () => {
    let pops = 0;
    const nav = { isFocused: () => true, canGoBack: () => true, goBack: () => void pops++ };
    const t = realNow();
    Date.now = () => t;
    safeGoBack(nav);
    Date.now = () => t + LEAVE_WINDOW_MS + 1;
    assert.equal(safeGoBack(nav), true);
    assert.equal(pops, 2);
  });

  it('a covered (unfocused) screen does not pop, and nothing to go back to dispatches nothing', () => {
    const app = makeApp();
    const topic = app.screen(app.study, app.push(app.study, 'Topic'));
    app.push(app.study, 'Lab'); // Topic is now covered
    assert.equal(safeGoBack(topic), false);
    assert.deepEqual(app.names(app.study), ['Dashboard', 'Topic', 'Lab']);

    const lone = { isFocused: () => true, canGoBack: () => false, goBack: () => assert.fail('dispatched with nowhere to go') };
    assert.equal(safeGoBack(lone), false);
    assert.equal(safeGoBack(null), false);
    assert.equal(app.unhandled(), 0);
  });
});

// ── 2. migrated hosts (spot pins) ────────────────────────────────────────────

const read = (p: string) => readFileSync(p, 'utf8');

describe('the house back controls use it', () => {
  it('LabHeader ‹ (inside the shared LabEndScreen/‹ leave window)', () => {
    assert.match(read('src/screens/lab/kit/LabNavBar.tsx'), /if \(!claimLabLeave\(\)\) return;\s*safeGoBack\(navigation\);/);
  });
  it('ReturnButton default', () => {
    assert.match(read('src/components/ReturnButton.tsx'), /onPress=\{onPress \?\? \(\(\) => safeGoBack\(navigation\)\)\}/);
  });
  it('the root overlays use the stable rootBack handle', () => {
    assert.match(read('src/features/lab/LabPreviewOverlay.tsx'), /if \(safeGoBack\(rootBack\)\) armEnd\(\);/); // armEnd: the cancellable 350 ms clear (final round C)
    assert.match(read('src/navigation/navigationRef.ts'), /export const rootBack: GoBackNav = \{/);
  });
});

// ── 3. ratchet ───────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const walk = (d: string, out: string[] = []): string[] => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e)) out.push(p);
  }
  return out;
};
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');

/** Raw `.goBack` (call or reference) per file, comments stripped. */
function rawGoBack(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of walk(join(ROOT, 'src'))) {
    const code = stripComments(readFileSync(p, 'utf8'));
    const n = (code.match(/\.goBack\b/g) ?? []).length;
    if (n) out[relative(ROOT, p).split(sep).join('/')] = n;
  }
  return out;
}

/** Reviewed 2026-10-02. May only shrink. */
const ALLOW: Record<string, { count: number; why: string }> = {
  'src/lib/safeGoBack.ts': { count: 1, why: 'the shared piece itself' },
  'src/navigation/navigationRef.ts': { count: 1, why: 'rootBack: the root-ref adapter safeGoBack calls' },
};

describe('P9b ratchet — no raw goBack outside safeGoBack', () => {
  const found = rawGoBack();

  it('no NEW raw .goBack in src/', () => {
    const fresh = Object.entries(found)
      .filter(([f, n]) => !(f in ALLOW) || n > ALLOW[f].count)
      .map(([f, n]) => `${f}: ${n}`);
    assert.deepEqual(fresh, [], 'Use safeGoBack(navigation) (src/lib/safeGoBack.ts) — a double tap must pop ONE screen.');
  });

  it('the allowlist only shrinks: every entry is still live at its count', () => {
    const stale = Object.entries(ALLOW)
      .filter(([f, a]) => (found[f] ?? 0) !== a.count)
      .map(([f]) => f);
    assert.deepEqual(stale, [], 'fixed or gone — lower or remove it in ALLOW');
  });

  it('no press prop hands over the bare method (onPress={navigation.goBack})', () => {
    const hits: string[] = [];
    for (const p of walk(join(ROOT, 'src'))) {
      const code = stripComments(readFileSync(p, 'utf8'));
      if (/\bon[A-Z]\w*=\{\s*\(?\w+(?: as any\))?\)?\.goBack\s*\}/.test(code)) hits.push(relative(ROOT, p));
    }
    assert.deepEqual(hits, []);
  });
});
