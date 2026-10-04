/**
 * Perf decision B (owner "do your recommendations", 2026-10-04) — receipts.
 *
 * 1. LAZY SCREENS. RootNavigator / MainTabs / StudyStack imported ~130 lab,
 *    tool, calculator and other screens at the top of the file, and App.tsx
 *    imported ~80 more for its dev-only browser harness — all evaluated before
 *    the first frame. Every route that is not first paint now registers with
 *    `getComponent` and a `lazyScreen` loader that runs once and caches the
 *    component it built (a wrapper rebuilt per render would remount the
 *    screen). The membership / orientation / keep-awake wrappers are applied
 *    inside the loader, exactly as before.
 * 2. LAZY DATA. The curated-term JSON (~450 KB) is `require`d the first time a
 *    bucket is booked, and the settings rows ask a cheap index instead.
 *    credentialCopy (~98 KB) is reached through credentialCopyLazy from
 *    CredentialAboutPanel.
 *
 * Source-shape tests (React Native files). R2: run against the HEAD versions
 * of the changed files (new files removed), 20 of the 21 tests here FAIL; the
 * one marked GUARD holds on HEAD by design (it protects what must not change:
 * every typed route is still registered).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Code only: block + line comments removed (JSX comments included). */
const code = (p: string) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const NAV = 'src/navigation/RootNavigator.tsx';
const EXTS = ['.tsx', '.ts', '.js', '.jsx', '.json'];
function resolveFile(fromFile: string, spec: string): string | null {
  const base = resolve(dirname(join(ROOT, fromFile)), spec);
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const e of EXTS) if (existsSync(base + e)) return base + e;
  for (const e of EXTS) if (existsSync(join(base, 'index' + e))) return join(base, 'index' + e);
  return null;
}

/** Every `require('<path>').<Name>` in a file, resolved. */
function lazyTargets(file: string): { spec: string; name: string; abs: string | null }[] {
  return [...code(file).matchAll(/require\('([^']+)'\)(?: as [^)]+\))?\.(\w+)/g)].map((m) => ({
    spec: m[1],
    name: m[2],
    abs: resolveFile(file, m[1]),
  }));
}

/** The modules evaluated before the first frame: the closure of STATIC,
 *  non-type `import` / `export … from` statements from App.tsx. A `require`
 *  inside a function is not followed — that is the whole point of it. */
function eagerClosure(entry: string): Set<string> {
  const seen = new Set<string>();
  const walk = (abs: string) => {
    if (seen.has(abs)) return;
    seen.add(abs);
    if (abs.endsWith('.json')) return;
    const src = readFileSync(abs, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const m of src.matchAll(/^\s*(?:import|export)\s+(?!type\b)(?:[\s\S]*?\sfrom\s+)?['"]([^'"]+)['"]/gm)) {
      if (!m[1].startsWith('.')) continue;
      const r = resolveFile(relative(ROOT, abs), m[1]);
      if (r) walk(r);
    }
  };
  walk(join(ROOT, entry));
  return seen;
}

describe('lazyScreen — one component per route, forever', () => {
  it('runs the loader once and hands back the SAME component every render', async () => {
    const { lazyScreen } = await import('../src/navigation/lazyScreen.ts');
    let calls = 0;
    const get = lazyScreen(() => {
      calls += 1;
      // A fresh function each call — what withMembershipPreview(…) returns.
      return function Wrapped() {
        return null;
      };
    });
    const first = get();
    for (let i = 0; i < 5; i++) assert.equal(get(), first, 'a new component type would remount the screen');
    assert.equal(calls, 1);
  });

  it('a loader that throws caches nothing, so the next visit retries', async () => {
    const { lazyScreen } = await import('../src/navigation/lazyScreen.ts');
    let calls = 0;
    const Screen = () => null;
    const get = lazyScreen(() => {
      calls += 1;
      if (calls === 1) throw new Error('module failed');
      return Screen;
    });
    assert.throws(() => get());
    assert.equal(get(), Screen);
    assert.equal(get(), Screen);
    assert.equal(calls, 2);
  });
});

describe('RootNavigator — only first paint is imported', () => {
  const nav = code(NAV);

  it('imports no screen at the top of the file except Splash and Auth', () => {
    const screenImports = [...nav.matchAll(/^import \{([^}]+)\} from '\.\.\/screens\/([^']+)';$/gm)].map((m) => m[2]);
    assert.deepEqual(screenImports.sort(), ['SplashScreen', 'auth/AuthScreen']);
    assert.doesNotMatch(nav, /^import [^;]*withAmplitudeOrientation/m, 'the orientation HOC (Skia) loads with the first gated screen');
  });

  it('every route except Splash / Auth / Main registers through getComponent', () => {
    const regs = [...nav.matchAll(/<Stack\.Screen\s+name="(\w+)"([\s\S]*?)\/>/g)];
    assert.ok(regs.length > 120, `expected the full registry, got ${regs.length}`);
    const eager = regs.filter(([, , attrs]) => /\bcomponent=\{/.test(attrs)).map(([, n]) => n);
    assert.deepEqual(eager, ['Splash', 'Auth', 'Main']);
    for (const [, name, attrs] of regs) {
      if (eager.includes(name)) continue;
      assert.match(attrs, /getComponent=\{(Lazy|Gated|MemberGated)\.\w+\}/, `${name} is not lazy`);
    }
  });

  it('every lab / tool / calc route is lazy (by name)', () => {
    const regs = new Map([...nav.matchAll(/<Stack\.Screen\s+name="(\w+)"([\s\S]*?)\/>/g)].map((m) => [m[1], m[2]]));
    const heavy = [...regs.keys()].filter((n) => /Lab|Module|Calc|Tool|Studio|Gallery|Meter|Rta|Spectrogram|Waveform|SignalGen|Rt60|FrequencyCounter|Production|SoundSystems/.test(n));
    assert.ok(heavy.length > 90, `expected the labs, tools and calcs, got ${heavy.length}`);
    for (const n of heavy) assert.match(regs.get(n)!, /getComponent=/, n);
  });

  it('every loader in Gated / Lazy / MemberGated goes through the caching factory', () => {
    for (const block of ['Gated', 'Lazy', 'MemberGated']) {
      const start = nav.indexOf(`const ${block} = {`);
      assert.ok(start > 0, `${block} map present`);
      const body = nav.slice(start, nav.indexOf('} as const;', start));
      const entries = [...body.matchAll(/^\s{2}(\w+):\s*(.+?),\s*$/gm)];
      assert.ok(entries.length > 40 || block === 'Lazy', `${block}: ${entries.length} entries`);
      for (const [, name, value] of entries) {
        assert.match(value, /^lazyScreen\(\(\) => /, `${block}.${name} is not built by lazyScreen — it would rebuild per render`);
      }
    }
  });

  it('MemberGated still wraps every entry in withMembershipPreview, inside the cached loader', () => {
    const start = nav.indexOf('const MemberGated = {');
    const body = nav.slice(start, nav.indexOf('} as const;', start));
    const entries = [...body.matchAll(/^\s{2}(\w+):\s*(.+?),\s*$/gm)];
    assert.ok(entries.length > 60, `got ${entries.length}`);
    for (const [, name, value] of entries) {
      assert.match(value, /^lazyScreen\(\(\) => withMembershipPreview\(/, `MemberGated.${name}`);
    }
  });

  it('GUARD: every typed route is registered, so every navigate(\'X\') still resolves', () => {
    const types = read('src/navigation/types.ts');
    const block = (n: string) => {
      const b = types.slice(types.indexOf(`export type ${n} = {`));
      return [...b.slice(0, b.indexOf('\n};')).matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1]).sort();
    };
    const regs = (f: string) => [...code(f).matchAll(/<Stack\.Screen\s+name="(\w+)"/g)].map((m) => m[1]).sort();
    assert.deepEqual(regs(NAV), block('RootStackParamList'));
    assert.deepEqual(regs('src/navigation/StudyStack.tsx'), block('StudyStackParamList'));
  });
});

describe('MainTabs / StudyStack — first tab screens eager, the rest lazy', () => {
  it('Home and Study stay imported; Achievements and Profile load on first open', () => {
    const tabs = code('src/navigation/MainTabs.tsx');
    assert.match(tabs, /<Tab\.Screen name="Home" component=\{CourseSelectionScreen\} \/>/);
    assert.match(tabs, /<Tab\.Screen name="Study" component=\{StudyStack\}/);
    assert.match(tabs, /name="Achievements"\s+getComponent=\{LazyTab\.Achievements\}/);
    assert.match(tabs, /<Tab\.Screen name="Profile" getComponent=\{LazyTab\.Profile\} \/>/);
    assert.doesNotMatch(tabs, /^import [^;]*(ProfileScreen|AchievementsStack)/m);
  });

  it('the Dashboard stays imported; every study method is lazy', () => {
    const study = code('src/navigation/StudyStack.tsx');
    const screenImports = [...study.matchAll(/^import \{([^}]+)\} from '\.\.\/screens\/([^']+)';$/gm)].map((m) => m[2]);
    assert.deepEqual(screenImports, ['dashboard/DashboardScreen']);
    for (const r of ['Flashcards', 'FillInBlank', 'Matching', 'Quiz', 'Glossary', 'Scenarios']) {
      assert.match(study, new RegExp(`<Stack\\.Screen name="${r}" getComponent=\\{Lazy\\.${r}\\} />`), r);
    }
  });
});

describe('every lazy require points at a real export', () => {
  // require() is untyped, so a typo would only surface as a crash on first
  // visit. Check each one against the module it names.
  // (App.tsx and credentialCopyLazy.ts cast their require to `typeof import(…)`,
  // so tsc already checks those names.)
  for (const [f, min] of [[NAV, 120], ['src/navigation/StudyStack.tsx', 6], ['src/navigation/MainTabs.tsx', 2]] as const) {
    it(f, () => {
      const targets = lazyTargets(f);
      assert.ok(targets.length >= min, `expected at least ${min} lazy requires, got ${targets.length}`);
      for (const t of targets) {
        assert.ok(t.abs, `${f}: cannot resolve ${t.spec}`);
        const src = readFileSync(t.abs!, 'utf8');
        assert.match(src, new RegExp(`export (?:function|const|class) ${t.name}\\b`), `${t.spec} has no export ${t.name}`);
      }
    });
  }
});

describe('App.tsx — the browser harness is not on the start path', () => {
  const app = code('App.tsx');

  it('imports no screen and no preview at the top of the file', () => {
    assert.doesNotMatch(app, /^import [^;]*from '\.\/src\/screens\//m);
    // The harness components (not the members' lab-preview feature, which stays).
    assert.doesNotMatch(app, /^import [^;]*\b(ToolPreview|ToolDemoPreview|Spl3dGaugePreview|PatchbayPreview|NotifySchedulePreview|SettingsPreview|HelpPreview|SamplerPreview|ProfilePreview|GrLadderPreview|CableArtPreview|CenterLockTuner)\b/m);
  });

  it('requires src/dev/webPreviews only inside the DEV + web guard', () => {
    const at = app.indexOf("require('./src/dev/webPreviews')");
    assert.ok(at > 0);
    const guard = app.lastIndexOf("if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined') {", at);
    assert.ok(guard > 0 && at - guard < 400, 'the require sits directly inside the guard');
    // …and the harness still knows the lab names its hashes open.
    const dev = read('src/dev/webPreviews.tsx');
    assert.match(dev, /export function renderWebPreview\(hash: string\)/);
    assert.match(dev, /const LAB_PREVIEW_SCREENS: Record<string, ComponentType> = \{/);
  });

  it('no lazily registered screen is still reachable through a static import from App.tsx', () => {
    const eager = eagerClosure('App.tsx');
    const lazy = [NAV, 'src/navigation/StudyStack.tsx', 'src/navigation/MainTabs.tsx']
      .flatMap(lazyTargets)
      .map((t) => t.abs!)
      // AmplitudeOrientation is a HOC module required on first gated visit.
      .filter((abs) => /[\\/]screens[\\/]/.test(abs));
    const leaked = [...new Set(lazy.filter((abs) => eager.has(abs)))].map((abs) => relative(ROOT, abs));
    assert.deepEqual(leaked, [], 'these "lazy" screens are evaluated at start anyway');
    assert.ok(eager.size < 500, `start-up graph is ${eager.size} app modules (was 1,075 before decision B)`);
  });
});

describe('large data modules load on first use', () => {
  it('curatedTermLists has no top-level JSON import; the lists are required on first read', () => {
    const src = code('src/features/notifications/curatedTermLists.ts');
    assert.doesNotMatch(src, /^import [^;]*\.json'/m);
    assert.match(src, /export function misunderstoodTerms\(\)[\s\S]*?if \(!misunderstood\) misunderstood = clean\(require\('\.\/curated\/misunderstoodTerms\.json'\)\);/);
    assert.match(src, /export function oddTerms\(\)[\s\S]*?if \(!odd\) odd = clean\(require\('\.\/curated\/oddTerms\.json'\)\);/);
  });

  it('the cheap index matches the real files (a has-check can never go stale)', () => {
    const src = code('src/features/notifications/curatedTermLists.ts');
    for (const [flag, file] of [
      ['HAS_MISUNDERSTOOD_TERMS', 'misunderstoodTerms.json'],
      ['HAS_ODD_TERMS', 'oddTerms.json'],
    ] as const) {
      const list = JSON.parse(read(`src/features/notifications/curated/${file}`)) as { term?: string; body?: string }[];
      const usable = list.filter((e) => e && typeof e.term === 'string' && e.term && typeof e.body === 'string' && e.body).length;
      const declared = new RegExp(`export const ${flag} = (true|false);`).exec(src)?.[1];
      assert.equal(declared, String(usable > 0), `${flag} disagrees with ${file} (${usable} usable entries)`);
    }
  });

  it('the settings store and the scheduler never touch the lists at module top', () => {
    const store = code('src/features/settings/store.ts');
    assert.match(store, /import \{ HAS_MISUNDERSTOOD_TERMS, HAS_ODD_TERMS \} from '\.\.\/notifications\/curatedTermLists';/);
    assert.doesNotMatch(store, /MISUNDERSTOOD_TERMS\.length|ODD_TERMS\.length/);
    const sched = code('src/features/notifications/localSchedule.ts');
    assert.match(sched, /loadList: \(\) => readonly CuratedTermEntry\[\],/);
    assert.match(sched, /if \(!on\) return;\s*const list = loadList\(\);/, 'a bucket that is OFF never loads its list');
    assert.match(sched, /'notifyMisunderstood', misunderstoodTerms, 'misTerm'/);
    assert.match(sched, /'notifyOddTerm', oddTerms, 'oddTerm'/);
  });

  it('the curated JSON is out of the start-up graph', () => {
    const eager = [...eagerClosure('App.tsx')].map((a) => relative(ROOT, a).replace(/\\/g, '/'));
    assert.deepEqual(eager.filter((f) => f.includes('notifications/curated/')), []);
  });

  it('CredentialAboutPanel reads credentialCopy through the lazy accessor', () => {
    const panel = code('src/components/CredentialAboutPanel.tsx');
    assert.doesNotMatch(panel, /from '\.\.\/data\/credentialCopy'/);
    assert.match(panel, /import \{ credentialCopyLazy \} from '\.\.\/data\/credentialCopyLazy';/);
    const lazy = code('src/data/credentialCopyLazy.ts');
    assert.match(lazy, /^import type \{ CredentialCopy \} from '\.\/credentialCopy';$/m);
    assert.doesNotMatch(lazy, /^import \{[^}]*\} from '\.\/credentialCopy'/m);
    assert.match(lazy, /if \(!copyModule\) copyModule = require\('\.\/credentialCopy'\)/);
  });
});
