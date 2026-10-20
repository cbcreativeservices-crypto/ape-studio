#!/usr/bin/env node
// artshot — render the app's react-native-skia art to a PNG in plain Node (dev-only).
//
//   node scripts/artshot/render.mjs <entry.tsx> <out.png> [width height scale] [--bg=<css colour>|--bg=transparent] [--verbose]
//
// <entry.tsx> `export default`s a component (called with {width, height, scale})
// that returns a Skia element tree in POINTS; it may `export const size =
// {width, height, scale}` as defaults. The PNG is (width × scale) × (height × scale) px.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const pos = args.filter((a) => !a.startsWith('--'));
if (pos.length < 2) {
  console.error('usage: node scripts/artshot/render.mjs <entry.tsx> <out.png> [width height scale] [--bg=#101216|transparent]');
  process.exit(2);
}
const [entryArg, outArg, wArg, hArg, sArg] = pos;

// 1 · CanvasKit (the FULL build: text shaping + FreeType font loading)
const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit.js');
const ckDir = dirname(require.resolve('canvaskit-wasm/bin/full/canvaskit.js'));
globalThis.CanvasKit = await CanvasKitInit({ locateFile: (f) => resolve(ckDir, f) });
globalThis.__DEV__ = false;

// 2 · module hooks (Babel for .ts/.tsx, stubs for native packages)
const { autoStubbed } = await import('./hooks.mjs');

// 3 · the entry
const React = require('react');
const headless = require('@shopify/react-native-skia/lib/commonjs/headless');
const { SkiaSGRoot } = require('@shopify/react-native-skia/lib/commonjs/sksg/Reconciler');
globalThis.__ARTSHOT__ = { width: 390, height: 844, scale: 3 }; // provisional, for module-scope reads
const errors = [];
const origError = console.error;
console.error = (...a) => {
  errors.push(a.map((x) => (x instanceof Error ? x.stack : String(x))).join(' '));
  origError(...a);
};
// react-native-skia's one-time "SkPath.x() is deprecated" notices: counted, not printed (--verbose prints them)
let deprecations = 0;
const origWarn = console.warn;
console.warn = (...a) => {
  if (!flags.verbose && typeof a[0] === 'string' && a[0].startsWith('[react-native-skia]') && a[0].includes('deprecated')) return void deprecations++;
  origWarn(...a);
};
const mod = require(resolve(entryArg));
const Entry = mod.default ?? mod;
const def = mod.size ?? {};
const width = Number(wArg ?? def.width ?? 390);
const height = Number(hArg ?? def.height ?? 300);
const scale = Number(sArg ?? def.scale ?? 3);
Object.assign(globalThis.__ARTSHOT__, { width, height, scale });

// 4 · render through the Skia reconciler, let effects / async loads settle, draw
const { Skia } = headless.getSkiaExports();
const surface = headless.makeOffscreenSurface(Math.round(width * scale), Math.round(height * scale));
const root = new SkiaSGRoot(Skia);
const tree = React.createElement(headless.Group, { transform: [{ scale }] }, React.createElement(Entry, { width, height, scale }));
await root.render(tree);
for (let i = 0; i < 8; i++) await new Promise((r) => setTimeout(r, 15));
const canvas = surface.getCanvas();
const bg = flags.bg ?? '#101216';
canvas.clear(bg === 'transparent' ? Skia.Color('transparent') : Skia.Color(bg));
root.drawOnCanvas(canvas);
surface.flush();
const png = surface.makeImageSnapshot().encodeToBytes();
await root.unmount();
if (!png) throw new Error('PNG encode failed');
mkdirSync(dirname(resolve(outArg)), { recursive: true });
writeFileSync(resolve(outArg), png);
console.log(`artshot: ${outArg} (${Math.round(width * scale)}×${Math.round(height * scale)} px)`);
if (deprecations) console.log(`artshot: ${deprecations} react-native-skia deprecation notice(s) hidden (--verbose shows them)`);
if (autoStubbed.size) console.warn(`artshot: stubbed (no-op) modules: ${[...autoStubbed].join(', ')}`);
if (errors.length) {
  console.warn(`artshot: ${errors.length} error(s) during render — the PNG may be incomplete`);
  process.exitCode = 1;
}
