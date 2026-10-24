/**
 * Android screen transitions match iOS (owner 2026-10-23: "both phones should
 * match look and feel"). plugins/withAndroidNavTransitions.js writes app
 * overrides of react-native-screens' fade / slide XMLs at prebuild; this runs
 * that mod for real into a temp folder and pins its timings to the iOS ones
 * in src/navigation/reduceMotionNav.ts.
 */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const plugin = require('../plugins/withAndroidNavTransitions.js');
const nav = readFileSync(new URL('../src/navigation/reduceMotionNav.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const appJson = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8'));

test('the timings equal the iOS / web ones (NAV_FADE and the iOS NAV_PUSH)', () => {
  const fade = Number(/NAV_FADE = \{ animation: 'fade', animationDuration: (\d+) \}/.exec(nav)?.[1]);
  const push = Number(/animation: 'simple_push', animationDuration: (\d+) \}/.exec(nav)?.[1]);
  assert.ok(fade > 0 && push > 0, 'reduceMotionNav.ts shape changed — update this test');
  assert.equal(plugin.FADE_MS, fade);
  assert.equal(plugin.PUSH_MS, push);
});

test('the plugin is registered in app.json', () => {
  assert.ok(appJson.expo.plugins.includes('./plugins/withAndroidNavTransitions'));
});

test('the mod writes all six overrides with those durations', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'navtx-'));
  try {
    const cfg = plugin({ name: 't', slug: 't' });
    const mod = cfg.mods?.android?.dangerous;
    assert.equal(typeof mod, 'function', 'withDangerousMod did not register an android mod');
    await mod({ ...cfg, modRequest: { platformProjectRoot: root, projectRoot: root, platform: 'android', modName: 'dangerous', introspect: false }, modResults: {} });
    const dir = path.join(root, 'app', 'src', 'main', 'res', 'anim');
    const names = readdirSync(dir).sort();
    assert.deepEqual(names, ['rns_fade_in.xml', 'rns_fade_out.xml', 'rns_slide_in_from_left.xml', 'rns_slide_in_from_right.xml', 'rns_slide_out_to_left.xml', 'rns_slide_out_to_right.xml']);
    for (const n of names) {
      const xml = readFileSync(path.join(dir, n), 'utf8');
      const ms = n.startsWith('rns_fade') ? plugin.FADE_MS : plugin.PUSH_MS;
      assert.match(xml, new RegExp(`android:duration="${ms}"`), n);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
