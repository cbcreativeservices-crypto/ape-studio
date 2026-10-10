/**
 * SENTRY ROOT CAUSES, PINNED APP-WIDE (owner 2026-10-08: "Learn from those
 * crashes. Why did they happen? Is there a similar situation elsewhere in the
 * app that could trigger a crash the same way?"). One block per root-cause
 * pattern; the write-up is docs/bughunt/SENTRY_ROOT_CAUSES_2026_10_08.md.
 * The accessibility-tree pattern (W/R/S) has its own file:
 * test/a11yTreeDepth_20261008.test.ts.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const rel = (f: string) => relative(ROOT, f).split(sep).join('/');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
function srcFiles(dir = join(ROOT, 'src'), out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) srcFiles(p, out);
    else if (/\.(ts|tsx)$/.test(p) && !p.endsWith('.d.ts')) out.push(p);
  }
  return out;
}
const SRC = srcFiles().map((f) => ({ f: rel(f), text: readFileSync(f, 'utf8') }));
/** Code only — comments stripped, so a comment naming a banned call is fine. */
function code(text: string, file: string): string {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, false, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  return ts.createPrinter({ removeComments: true }).printFile(sf);
}

// ── D: a reload / runtime teardown while the app is rendering ────────────────
describe('APE-STUDIO-D — no reload of the live runtime outside the background-only path', () => {
  it('Updates.reloadAsync is called in exactly one place, and that place reloads only from the background', () => {
    const callers = SRC.filter(({ f, text }) => /reloadAsync\(/.test(text) && /reloadAsync\(/.test(code(text, f))).map(({ f }) => f);
    assert.deepEqual(callers, ['src/features/updates/startAutoUpdate.ts']);
    const TEARDOWN = /DevSettings\.reload\(|RNRestart|location\.reload\(/;
    const others = SRC.filter(({ f, text }) => TEARDOWN.test(text) && TEARDOWN.test(code(text, f))).map(({ f }) => f);
    assert.deepEqual(others, [], 'no other way of tearing the runtime down');
    assert.match(read('src/features/updates/startAutoUpdate.ts'), /isBackground: \(\) => AppState\.currentState === 'background'/);
  });
});

// ── T: native audio torn down behind a backgrounded app, then touched ───────
describe('APE-STUDIO-T — an already-decided mic stop runs before iOS suspends the app', () => {
  it('a pending debounced release flushes on background (the root audio gate does it)', () => {
    const gate = read('src/features/audio/AudioOutputGate.tsx');
    // The mic release still runs FIRST on every background (2026-10-09: the own-sheet window comes after it).
    assert.match(gate, /if \(state === 'background'\) \{[\s\S]*?flushPendingRelease\(\);[\s\S]{0,700}?onLeaveApp\(/);
    assert.match(read('src/features/tools/engine/micSession.ts'), /export function flushPendingRelease\(\): boolean \{\s*if \(!releaseTimer\) return false;\s*doStop\(\);/);
  });

  it('every AppState background handler that stops capture also releases it NOW', () => {
    // A handler that calls the engine's debounced stop() must hard-release in
    // the same branch — the hub was the one that did not (the crash).
    const hub = read('src/screens/tools/hubPreviewEngine.ts');
    assert.match(hub, /if \(!appActive && state === 'running'\) \{\s*stop\(\);\s*releaseMicNow\(\);/);
    const handlers = SRC.filter(({ text }) => /AppState\.addEventListener/.test(text) && /releaseMic\b|stopRef\.current\?\.\(\)|stopRef\.current\(\)/.test(text));
    for (const { f, text } of handlers) {
      const c = code(text, f);
      if (/'background'/.test(c) && /releaseMic\(\)/.test(c)) {
        assert.match(c, /releaseMicNow\(\)/, `${f}: a background handler that schedules releaseMic() must also releaseMicNow()`);
      }
    }
  });
});

// ── 5: a Supabase channel reused after subscribe() ──────────────────────────
describe('APE-STUDIO-5 — every realtime channel is fresh per subscribe and removed on cleanup', () => {
  it('no channel topic is a fixed string, and every file that opens one removes it', () => {
    let seen = 0;
    for (const { f, text } of SRC) {
      const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const visit = (n: ts.Node) => {
        if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'channel' && n.arguments.length >= 1) {
          seen++;
          const a = n.arguments[0];
          assert.ok(!ts.isStringLiteral(a) && !ts.isNoSubstitutionTemplateLiteral(a), `${f}: channel('${a.getText(sf)}') — a fixed topic returns the LIVE channel on a remount and .on() then throws; make the topic unique per mount`);
          assert.match(code(text, f), /removeChannel\(/, `${f}: a channel must be removed in the effect cleanup`);
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
    assert.ok(seen >= 1, 'the single-device guard still opens its channel');
  });
});

// ── G: Skia on web without WebGL ────────────────────────────────────────────
describe('APE-STUDIO-G — Skia on web survives a missing WebGL context', () => {
  it('index.ts installs the fallback right after CanvasKit loads', () => {
    const idx = read('index.ts');
    assert.ok(idx.indexOf('installSkiaWebFallback(') > idx.indexOf('await LoadSkiaWeb('), 'after the load');
  });

  it('a WebGL failure falls back to the CPU surface instead of throwing', async () => {
    const { installSkiaWebFallback } = await import('../src/lib/skiaWebFallback.ts');
    const calls: string[] = [];
    const ck = {
      MakeWebGLCanvasSurface: (_c: unknown) => { calls.push('gl'); throw 'failed to create webgl context: err 0'; },
      MakeSWCanvasSurface: (_c: unknown) => { calls.push('sw'); return { surface: 'sw' }; },
    };
    assert.equal(installSkiaWebFallback(ck), true);
    assert.deepEqual(ck.MakeWebGLCanvasSurface({}), { surface: 'sw' });
    assert.deepEqual(calls, ['gl', 'sw']);
    assert.equal(installSkiaWebFallback(ck), false, 'installs once');
    // A working WebGL surface is untouched.
    const ok = { MakeWebGLCanvasSurface: () => ({ surface: 'gl' }), MakeSWCanvasSurface: () => ({ surface: 'sw' }) };
    installSkiaWebFallback(ok);
    assert.deepEqual(ok.MakeWebGLCanvasSurface(), { surface: 'gl' });
    // No CanvasKit at all (the native app) → nothing to do.
    assert.equal(installSkiaWebFallback(undefined), false);
  });
});

// ── E: an unhandled fetch rejection from Skia's asset hooks ─────────────────
describe('APE-STUDIO-E — Skia assets load through the safe hooks', () => {
  it("no screen uses Skia's unguarded useImage/useFont/useTypeface/useData/useRawData/useSVG", () => {
    const BANNED = /^(useImage|useFont|useTypeface|useData|useRawData|useSVG|useAnimatedImage)$/;
    const bad: string[] = [];
    for (const { f, text } of SRC) {
      if (!text.includes('@shopify/react-native-skia')) continue;
      const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      for (const st of sf.statements) {
        if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier) && st.moduleSpecifier.text === '@shopify/react-native-skia') {
          const nb = st.importClause?.namedBindings;
          if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) if (BANNED.test((el.propertyName ?? el.name).text)) bad.push(`${f}: ${el.name.text}`);
        }
      }
    }
    assert.deepEqual(bad, [], 'use useSafeSkiaImage / useSafeSkiaFont (src/lib/skiaSafeAssets.ts)');
    assert.match(read('src/lib/skiaSafeAssets.ts'), /\.catch\(\(\) => \{\s*if \(live\) setValue\(null\);/);
  });

  it('no direct Skia.Data.fromURI without a rejection handler', () => {
    const bad = SRC.filter(({ f, text }) => {
      if (!text.includes('fromURI(')) return false;
      const c = code(text, f);
      return /Skia\.Data\.fromURI\(/.test(c) && !/fromURI\([^)]*\)[\s\S]{0,200}\.catch\(/.test(c);
    }).map(({ f }) => f);
    assert.deepEqual(bad, []);
  });
});

// ── V: a hook called conditionally (after an early return / in a branch) ────
describe('APE-STUDIO-V — hooks are never called conditionally (app-wide)', () => {
  const HOOK = /^use[A-Z0-9]/;
  const isFn = (n: ts.Node): n is ts.FunctionLikeDeclaration =>
    ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n) || ts.isMethodDeclaration(n);
  function fnName(n: ts.Node): string {
    if (ts.isFunctionDeclaration(n) && n.name) return n.name.text;
    const p = n.parent;
    if (p && ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) return p.name.text;
    if (p && ts.isCallExpression(p) && p.parent && ts.isVariableDeclaration(p.parent) && ts.isIdentifier(p.parent.name)) return p.parent.name.text;
    if ((ts.isFunctionExpression(n)) && n.name) return n.name.text;
    return '';
  }
  function hooksIn(node: ts.Node, sf: ts.SourceFile): { name: string; line: number }[] {
    const out: { name: string; line: number }[] = [];
    const v = (n: ts.Node) => {
      if (n !== node && isFn(n)) return;
      if (ts.isCallExpression(n)) {
        const e = n.expression;
        const name = ts.isIdentifier(e) ? e.text : ts.isPropertyAccessExpression(e) ? e.name.text : '';
        if (HOOK.test(name)) out.push({ name, line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1 });
      }
      ts.forEachChild(n, v);
    };
    v(node);
    return out;
  }
  const containsReturn = (n: ts.Node): boolean => {
    let r = false;
    const v = (x: ts.Node) => {
      if (r || isFn(x)) return;
      if (ts.isReturnStatement(x)) r = true;
      else ts.forEachChild(x, v);
    };
    v(n);
    return r;
  };
  /** A `for` whose bound is a constant (UPPER_CASE or a number) runs the same
   *  hooks in the same order every render — stable, and eslint-disabled on
   *  purpose (vizWave's colour buckets). */
  const constantLoop = (st: ts.Statement) =>
    ts.isForStatement(st) && !!st.condition && ts.isBinaryExpression(st.condition) &&
    (ts.isNumericLiteral(st.condition.right) || (ts.isIdentifier(st.condition.right) && /^[A-Z][A-Z0-9_]*$/.test(st.condition.right.text)));
  /** `try { return useX(); } catch { … }` calls the hook unconditionally first. */
  const tryFirstHook = (st: ts.Statement) =>
    ts.isTryStatement(st) && st.tryBlock.statements.length === 1 && hooksIn(st.tryBlock.statements[0], st.getSourceFile()).length >= 1 &&
    hooksIn(st.catchClause ?? st.tryBlock, st.getSourceFile()).length === (st.catchClause ? 0 : 1);

  it('no component or hook calls a hook after an early return, inside a branch, or in a short-circuit', () => {
    const bad: string[] = [];
    for (const { f, text } of SRC) {
      if (!/\buse[A-Z]/.test(text)) continue;
      const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const visit = (n: ts.Node) => {
        if (isFn(n) && n.body && ts.isBlock(n.body)) {
          const name = fnName(n);
          if (/^[A-Z]/.test(name) || HOOK.test(name)) {
            let returnedAt = 0;
            for (const st of n.body.statements) {
              if (returnedAt) for (const h of hooksIn(st, sf)) bad.push(`${f}:${h.line} ${name}: ${h.name}() after the early return on line ${returnedAt}`);
              const branchy = ts.isIfStatement(st) || ts.isSwitchStatement(st) || ts.isWhileStatement(st) || ts.isDoStatement(st) || ts.isForOfStatement(st) || ts.isForInStatement(st) || (ts.isForStatement(st) && !constantLoop(st)) || (ts.isTryStatement(st) && !tryFirstHook(st));
              if (branchy) for (const h of hooksIn(st, sf)) bad.push(`${f}:${h.line} ${name}: ${h.name}() inside a ${ts.SyntaxKind[st.kind]}`);
              if (!ts.isReturnStatement(st) && !branchy) {
                const sc = (x: ts.Node) => {
                  if (isFn(x)) return;
                  if (ts.isConditionalExpression(x)) for (const p of [x.whenTrue, x.whenFalse]) for (const h of hooksIn(p, sf)) bad.push(`${f}:${h.line} ${name}: ${h.name}() in a ?: branch`);
                  if (ts.isBinaryExpression(x) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(x.operatorToken.kind))
                    for (const h of hooksIn(x.right, sf)) bad.push(`${f}:${h.line} ${name}: ${h.name}() after a short-circuit`);
                  ts.forEachChild(x, sc);
                };
                sc(st);
              }
              if (!returnedAt && (ts.isIfStatement(st) || ts.isSwitchStatement(st) || ts.isTryStatement(st)) && containsReturn(st)) returnedAt = sf.getLineAndCharacterOfPosition(st.getStart(sf)).line + 1;
            }
          }
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
    assert.deepEqual(bad, [], 'React matches hooks by call order — "Rendered more hooks than during the previous render" (APE-STUDIO-V was ShareTermSheet\'s useState below `if (!payload) return`). Move the hook above every return and out of every branch.');
  });

  it('the APE-STUDIO-V site itself keeps its hook above the early return', () => {
    const s = read('src/components/ShareTermSheet.tsx');
    assert.ok(s.indexOf('useState<(() => void) | null>(null)') < s.indexOf('if (!payload) return'), 'pendingLargeShare state above the early return');
  });
});
