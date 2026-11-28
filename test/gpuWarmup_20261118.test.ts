// iPad drawing warm-up (Sentry App Hanging reports, 2026-11-18) [MD:D69].
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rd = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const w = rd('src/lib/gpuWarmup.ts');
const home = rd('src/screens/courses/CourseSelectionScreen.tsx');

test('iOS only, once per app run', () => {
  assert.match(w, /return os === 'ios' && !alreadyDone;/);
  assert.match(w, /if \(!shouldWarm\(Platform\.OS, done\)\) return;\n  done = true;/);
});

test('draws off-screen on the GPU, and a missing surface does nothing', () => {
  assert.match(w, /Skia\.Surface\.MakeOffscreen\(256, 256\)/);
  assert.match(w, /if \(!surface\) return;/);
  assert.match(w, /surface\.flush\(\);/);
});

test('covers the shapes Sentry caught compiling (circles, convex paths, strokes)', () => {
  assert.match(w, /drawCircle/);
  assert.match(w, /drawPath\(tri, fill\)/);
  assert.match(w, /setStyle\(PaintStyle\.Stroke\)/);
  assert.match(w, /MakeLinearGradient/);
});

test('can never throw into the app', () => {
  const body = w.slice(w.indexOf('export function warmGpuShaders'));
  assert.match(body, /^export function warmGpuShaders\(\): void \{\n  if [^\n]+\n  done = true;\n  try \{/);
});

test('scheduled from the main menu after a delay, via a lazy require (start graph unchanged)', () => {
  assert.match(home, /require\('\.\.\/\.\.\/lib\/gpuWarmup'\)/);
  assert.doesNotMatch(home, /^import .*gpuWarmup/m);
  assert.match(w, /export function scheduleGpuWarmup\(delayMs = 3000\)/);
  assert.match(w, /runSoon\(warmGpuShaders, \{ idleTimeoutMs: 4000 \}\)/);
  assert.doesNotMatch(w, /InteractionManager/);
});
