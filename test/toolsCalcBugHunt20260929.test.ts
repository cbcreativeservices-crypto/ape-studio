/**
 * Tools + calculators bug hunt 2026-09-29 — the fixes that live in screen
 * wiring (T1 logic and T8 serialisation have their own behavioural suites:
 * dspStartSupersede.test.ts, calcWorkflowStoreSerial.test.ts).
 *
 * Pins the mechanism so a refactor cannot quietly drop it:
 *  T2  the tuner overlays close on Android BACK and on leaving the screen;
 *  T3  the MultiMeter permission explainers present INSIDE the sheet's Modal;
 *  T5  the Signal Generator never starts a tone after unmount or into a mute;
 *  T9  a double START raises ONE hearing warning;
 *  T6  calculator editors ask before BACK throws edits away;
 *  T7  every tool SAVE takes the one-record-per-tap latch;
 *  T10 timePhase never interpolates a raw Math.round/floor/ceil;
 *  A4  every landscape full screen restores portrait on unmount.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('T2 — FrequencyCounter closes the tuner overlays on BACK and on unmount', () => {
  const src = read('screens/tools/FrequencyCounterScreen.tsx');
  assert.match(src, /BackHandler\.addEventListener\('hardwareBackPress'/);
  assert.match(src, /if \(vuTunerOpen\) closeVuTuner\(\);\s*else closeCenterLock\(\);\s*return true;/);
  assert.match(src, /\(\) => \(\) => \{\s*closeCenterLock\(\);\s*closeVuTuner\(\);/);
});

test('T3 — MultiMeter prompts render inside the snapshot Modal; locked SAVE closes the sheet first', () => {
  const src = read('screens/tools/MultiMeterScreen.tsx');
  const modalOpen = src.indexOf('visible={draft != null}');
  const modalClose = src.indexOf('</Modal>', modalOpen);
  const prompt = src.indexOf('<PermissionPrompt {...photoFlow.promptProps} />');
  assert.ok(modalOpen > 0 && prompt > modalOpen && prompt < modalClose, 'photo prompt nested in the sheet Modal');
  assert.match(src, /setDraft\(null\);\s*saveGate\.prompt\(\);/);
  assert.match(src, /\[draft, notes, smoothing, zoom, photoUri, geo, saveGate, calibrated, splOffset, saveLatch\]/);
});

test('T5/T9 — Signal Generator start guards', () => {
  const src = read('screens/tools/SignalGenScreen.tsx');
  assert.match(src, /if \(!mountedRef\.current\) return; \/\/ warning dismissed after the screen closed/);
  assert.match(src, /if \(!isAudioOutputEnabled\(\)\) \{\s*void ApeDsp\.genStop\(\);/);
  assert.match(src, /else if \(!startPendingRef\.current\) \{\s*(\/\/.*\n\s*)*startPendingRef\.current = true;/);
  assert.match(src, /finally \{\s*startPendingRef\.current = false;/);
});

test('T6 — calculator editors guard hardware BACK', () => {
  for (const f of ['screens/lab/calc/CalcWorkflowEditScreen.tsx', 'screens/lab/calc/CalcProjectsScreen.tsx']) {
    const src = read(f);
    assert.match(src, /addListener\('beforeRemove'/, `${f}: beforeRemove listener`);
    assert.match(src, /e\.preventDefault\(\);/, `${f}: holds the back`);
    assert.match(src, /t !== 'GO_BACK' && t !== 'POP'/, `${f}: never blocks a reset`);
    assert.match(src, /'Discard changes\?'/, `${f}: asks`);
    assert.match(src, /if \(savingRef\.current\) return;/, `${f}: one save at a time`);
  }
});

test('T7 — every tool SAVE claims the latch right before saveMeasurement', () => {
  const tools = ['Rt60Screen', 'SplMeterScreen', 'RtaScreen', 'SpectrogramScreen', 'WaveformScreen', 'FrequencyCounterScreen', 'MultiMeterScreen'];
  for (const t of tools) {
    const src = read(`screens/tools/${t}.tsx`);
    const saves = src.match(/void saveMeasurement\(\{/g)?.length ?? 0;
    const latched = src.match(/if \(!saveLatch\.claim\(\)\) return;\n\s*void saveMeasurement\(\{/g)?.length ?? 0;
    assert.ok(saves > 0, `${t}: has a save`);
    assert.equal(latched, saves, `${t}: every save is latched`);
  }
});

test('T7 — the save latch refuses a second claim inside the window', async () => {
  const { createSaveLatch } = await import('../src/features/tools/measure/saveLatch.ts');
  let now = 1000;
  const latch = createSaveLatch(1800, () => now);
  assert.equal(latch.claim(), true);
  now += 50;
  assert.equal(latch.claim(), false, 'double tap refused');
  now += 1800;
  assert.equal(latch.claim(), true, 'a deliberate later save goes through');
});

test('T10 — timePhase prints whole numbers through fmtInt', () => {
  const src = read('screens/lab/calc/workspaces/timePhase.ts');
  const code = src.replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(code, /\$\{Math\.(round|floor|ceil)\(/);
});

test('A4 — landscape full screens restore portrait on unmount', () => {
  for (const f of ['screens/tools/SplMeterScreen.tsx', 'screens/tools/WaveformScreen.tsx', 'screens/tools/ToolFullScreen.tsx']) {
    const src = read(f);
    assert.match(
      src,
      // 'portrait' on a phone; restingOrientation() frees a tablet (Android large-screen pass 2026-09-29).
      /\(\) => \(\) => \{\s*lockPortrait\(\);\s*navigation\.setOptions\(\{ orientation: restingOrientation\('portrait'\) \}\);\s*\},\s*\[navigation\]/,
      f,
    );
  }
});
