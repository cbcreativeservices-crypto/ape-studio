/**
 * Lets a Node test import the Miking lessons' ART modules (.tsx): every
 * source file under src/ is compiled with the TypeScript compiler (JSX
 * included), extensionless relative imports find their .ts / .tsx file, and
 * every native UI package (anything bare but React itself) is replaced by a
 * do-nothing stand-in (test/_mikingStub.cjs). The art's PURE parts — the part
 * labels, the hit test — then run exactly as on a phone. Not a test file
 * itself; import it before importing any art.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const require = createRequire(import.meta.url);
(globalThis as { __mikingStub?: unknown }).__mikingStub = require('./_mikingStub.cjs');
(globalThis as { __DEV__?: boolean }).__DEV__ ??= false;
const REAL = /^(react|react\/jsx-runtime|react\/jsx-dev-runtime)$/;
const isStubbed = (spec: string) => !spec.startsWith('.') && !spec.startsWith('/') && !spec.startsWith('node:') && !spec.startsWith('file:') && !REAL.test(spec);

/** `import … from 'react-native'` → a destructure of the stand-in. */
function stubImports(js: string): string {
  return js.replace(/^import\s+(.*?)\s+from\s+['"]([^'"]+)['"];?$|^import\s+['"]([^'"]+)['"];?$/gm, (all, clause: string | undefined, spec: string | undefined, bare: string | undefined) => {
    if (bare !== undefined) return isStubbed(bare) ? '' : all;
    if (!spec || !clause || !isStubbed(spec)) return all;
    const S = 'globalThis.__mikingStub';
    const out: string[] = [];
    const ns = clause.match(/^\*\s+as\s+(\w+)$/);
    if (ns) return `const ${ns[1]} = ${S};`;
    const named = clause.match(/\{([^}]*)\}/);
    const def = clause.replace(/\{[^}]*\}/, '').replace(/,/g, '').trim();
    if (def) out.push(`const ${def} = ${S};`);
    if (named) {
      const parts = named[1].split(',').map((p) => p.trim()).filter(Boolean).map((p) => p.replace(/^type\s+/, '')).map((p) => p.replace(/\s+as\s+/, ': '));
      if (parts.length) out.push(`const { ${parts.join(', ')} } = ${S};`);
    }
    return out.join(' ');
  });
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const u = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(u))) return { url: u.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith('file:') && /\.tsx?$/.test(url) && !/node_modules|[\\/]test[\\/]/.test(fileURLToPath(url))) {
      const file = fileURLToPath(url);
      const out = ts.transpileModule(readFileSync(file, 'utf8'), {
        fileName: file,
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, allowImportingTsExtensions: true, verbatimModuleSyntax: false },
      });
      // An asset `require('…ttf')` (fonts, images) reads as the stand-in too.
      const req = /\brequire\(/.test(out.outputText) ? 'const require = () => globalThis.__mikingStub;\n' : '';
      return { format: 'module', source: req + stubImports(out.outputText), shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
