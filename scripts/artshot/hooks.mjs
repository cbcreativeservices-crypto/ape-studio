// artshot — synchronous Node module hooks (module.registerHooks):
//  * .ts/.tsx (outside node_modules) → Babel (TypeScript + automatic JSX) → CommonJS
//  * extensionless relative imports → .ts / .tsx / .js / index.*
//  * native-only packages → small stubs in ./stubs (see STUBS)
//  * asset requires (.ttf/.otf/.png/…) → their absolute file path (a string)
//  * any other bare import that cannot be resolved → a no-op Proxy stub, reported once
// Dev-only; never imported by the app.
import { registerHooks, createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const stub = (f) => pathToFileURL(join(here, 'stubs', f)).href;
const require = createRequire(import.meta.url);
const repoRequire = createRequire(resolvePath(here, '../../package.json'));
const babel = require('@babel/core');

export const STUBS = {
  '@shopify/react-native-skia': stub('skia.cjs'),
  'react-native-reanimated': stub('reanimated.cjs'),
  'react-native': stub('react-native.cjs'),
  'react-native-svg': stub('svg.cjs'),
  '@react-native-async-storage/async-storage': stub('async-storage.cjs'),
  'react-native-gesture-handler': stub('generic.cjs'),
  'react-native-safe-area-context': stub('generic.cjs'),
  'expo-haptics': stub('generic.cjs'),
  'expo-av': stub('generic.cjs'),
  'expo-audio': stub('generic.cjs'),
  'expo-constants': stub('generic.cjs'),
  'expo-font': stub('generic.cjs'),
  'expo-asset': stub('generic.cjs'),
  '@sentry/react-native': stub('generic.cjs'),
};
// Packages whose name starts with one of these are stubbed too (subpaths included).
const STUB_PREFIXES = ['@react-navigation/', 'expo-', '@expo/vector-icons', 'react-native-'];
const ASSET_EXT = new Set(['.ttf', '.otf', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp3', '.wav', '.m4a', '.json5']);
const SRC_EXT = new Set(['.ts', '.tsx', '.jsx']);
export const autoStubbed = new Set();

function isFile(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}
function withExt(base) {
  for (const e of ['', '.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs', '/index.ts', '/index.tsx', '/index.js']) {
    if (isFile(base + e)) return base + e;
  }
  return null;
}
const pkgName = (s) => (s.startsWith('@') ? s.split('/').slice(0, 2).join('/') : s.split('/')[0]);

function resolve(specifier, context, nextResolve) {
  // the headless Skia build guards its own optional imports: let it see the real resolution
  if (context.parentURL?.includes('/node_modules/@shopify/react-native-skia/')) return nextResolve(specifier, context);
  if (STUBS[specifier]) return { url: STUBS[specifier], format: 'commonjs', shortCircuit: true };
  const bare = !specifier.startsWith('.') && !specifier.startsWith('/') && !specifier.startsWith('node:') && !specifier.startsWith('file:');
  if (bare) {
    const name = pkgName(specifier);
    if (STUBS[name] && name !== '@shopify/react-native-skia') return { url: STUBS[name], format: 'commonjs', shortCircuit: true };
    // the app's code (not node_modules) importing a native-only package → stub
    const fromApp = context.parentURL && !context.parentURL.includes('/node_modules/');
    if (fromApp && STUB_PREFIXES.some((p) => specifier.startsWith(p)) && !specifier.startsWith('@expo-google-fonts/')) {
      autoStubbed.add(name);
      return { url: stub('generic.cjs'), format: 'commonjs', shortCircuit: true };
    }
  }
  if ((specifier.startsWith('.') || specifier.startsWith('/')) && context.parentURL?.startsWith('file:')) {
    const base = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
    if (!context.parentURL.includes('/node_modules/')) {
      const f = withExt(base);
      if (f) return { url: pathToFileURL(f).href, shortCircuit: true };
    }
  }
  try {
    return nextResolve(specifier, context);
  } catch (e) {
    if (bare) {
      // an entry outside the repo: resolve its packages from the repo's node_modules
      try {
        return { url: pathToFileURL(repoRequire.resolve(specifier)).href, shortCircuit: true };
      } catch {}
      autoStubbed.add(specifier);
      return { url: stub('generic.cjs'), format: 'commonjs', shortCircuit: true };
    }
    throw e;
  }
}

function load(url, context, nextLoad) {
  if (!url.startsWith('file:')) return nextLoad(url, context);
  const file = fileURLToPath(url);
  const ext = extname(file).toLowerCase();
  if (ASSET_EXT.has(ext)) {
    return { format: 'commonjs', source: `module.exports = ${JSON.stringify(file)};`, shortCircuit: true };
  }
  if (SRC_EXT.has(ext) && !file.includes('/node_modules/')) {
    const code = readFileSync(file, 'utf8');
    const out = babel.transformSync(code, {
      filename: file,
      babelrc: false,
      configFile: false,
      sourceMaps: 'inline',
      presets: [[require.resolve('@babel/preset-typescript'), { isTSX: ext !== '.ts', allExtensions: true, allowDeclareFields: true, onlyRemoveTypeImports: false }]],
      plugins: [
        [require.resolve('@babel/plugin-transform-react-jsx'), { runtime: 'automatic' }],
        [require.resolve('@babel/plugin-transform-modules-commonjs'), { lazy: false }],
      ],
    });
    return { format: 'commonjs', source: out.code, shortCircuit: true };
  }
  return nextLoad(url, context);
}

registerHooks({ resolve, load });
