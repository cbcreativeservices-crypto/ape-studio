/**
 * Tools + calculators "toddler + cat" pass 2026-09-30.
 *
 *  P1  parseQuantity: with BOTH separators present the grouping must be real
 *      three-digit grouping — `1,5.3` used to read as 15.3;
 *  G1  GlassTile never fires its navigation after it unmounted mid-beat;
 *  H1  the Tools hub opens ONE tool per tap burst (two tiles inside one beat);
 *  S1  a Signal Generator stop invalidates a START still in flight.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('P1 — mixed separators must be real grouping, never a stripped typo', async () => {
  const { parseQuantity } = await import('../src/screens/lab/calc/calcUnits.ts');
  // The typos that used to come back as confident wrong numbers.
  assert.equal(parseQuantity('1,5.3'), null);
  assert.equal(parseQuantity('10,00.5'), null);
  assert.equal(parseQuantity('1.5,3'), null);
  assert.equal(parseQuantity('12,3456.7'), null);
  // Real grouping still reads.
  assert.equal(parseQuantity('1,234.5'), 1234.5);
  assert.equal(parseQuantity('-1,234,567.25'), -1234567.25);
  assert.equal(parseQuantity('1.234,5'), 1234.5);
  assert.equal(parseQuantity('1.234.567,89'), 1234567.89);
  assert.equal(parseQuantity('1,234.5e3'), 1234500);
  assert.equal(parseQuantity('1,234.'), 1234);
});

test('G1 — GlassTile clears its beat timer on unmount', () => {
  const src = read('screens/tools/GlassTile.tsx');
  assert.match(src, /beat\.current = setTimeout\(\(\) => \{/);
  assert.match(src, /useEffect\(\(\) => \(\) => \{\s*if \(beat\.current\) clearTimeout\(beat\.current\);/);
});

test('H1 — the Tools hub opens one tool per burst', () => {
  const src = read('screens/tools/ToolsHubScreen.tsx');
  assert.match(src, /if \(now - lastOpenRef\.current < 700\) return;\s*lastOpenRef\.current = now;/);
});

test('S1 — Signal Generator STOP supersedes an in-flight START', () => {
  const src = read('screens/tools/SignalGenScreen.tsx');
  assert.match(src, /const onStop = async \(\) => \{[\s\S]{0,400}?genRef\.current\+\+;\s*try \{\s*await ApeDsp\.genStop\(\);/);
});

// ── Review-agent findings, verified and fixed ───────────────────────────────

test('SPL calibration offset is clamped to the catalog range, and a bad queued row cannot jam uploads', () => {
  const store = read('features/tools/measure/calibrationStore.ts');
  assert.match(store, /CAL_OFFSET_MIN_DB = 0;/);
  assert.match(store, /CAL_OFFSET_MAX_DB = 200;/);
  const spl = read('screens/tools/SplMeterScreen.tsx');
  assert.equal(spl.match(/setDraftOffset\(\(d\) => clampCalOffset\(Math\.round\(\(d \+ step\) \* 2\) \/ 2\)\)/g)?.length, 2);
  const client = read('features/tools/measure/catalogClient.ts');
  assert.match(client, /\.upsert\(ok\.map\(toRow\)/);
});

test('tool SAVE callbacks see the current save gate', () => {
  assert.match(read('screens/tools/SplMeterScreen.tsx'), /\[state, weighting, response, offset, cal, saveGate, saveLatch\]\);/);
  assert.match(read('screens/tools/RtaScreen.tsx'), /\[state, frames, fraction, alpha, saveGate, saveLatch\]\);/);
  assert.match(read('screens/tools/SpectrogramScreen.tsx'), /\[state, history, frames, dynRange, saveGate, saveLatch\]\);/);
  const fc = read('screens/tools/FrequencyCounterScreen.tsx');
  assert.match(fc, /\[state, frames\.pitch, frames\.meter, saveGate, saveLatch\]\);/);
  assert.match(fc, /\[stats, flags, saveGate, saveLatch\]\);/);
});

test('MultiMeter: no snapshot off a dead mic; START from pause keeps the panels; BACK closes the mode popup', () => {
  const src = read('screens/tools/MultiMeterScreen.tsx');
  assert.match(src, /m == null \|\| !frameIsLive\(m\) \|\|/);
  assert.doesNotMatch(src, /const onStart = useCallback\(\(\) => \{\s*setMicPaused\(false\);/);
  assert.match(src, /if \(!unitPopup\) return;\s*const sub = BackHandler\.addEventListener/);
});

test('RT60: STOP / leaving disarms the native capture; re-arm needs a live mic; dead-capture flags latch', () => {
  const src = read('screens/tools/Rt60Screen.tsx');
  assert.match(src, /setMicPaused\(true\);[\s\S]{0,700}?ApeDsp\.rt60Cancel\(\);\s*stop\(\);/);
  assert.match(src, /addListener\('blur', \(\) => ApeDsp\.rt60Cancel\(\)\)/);
  assert.match(src, /if \(!base\?\.running\) return;/);
  assert.match(src, /\(rtState !== 1 && rtState !== 2\) \|\| !liveFrame\) return;/);
});

test('Waveform save reads the SAVED envelope; its chooser card swallows taps', () => {
  const src = read('screens/tools/WaveformScreen.tsx');
  assert.match(src, /peakDbfs: peakDb,/);
  assert.match(src, /<Pressable style=\{styles\.popupCard\} onPress=\{\(\) => \{\}\} accessible=\{false\}>/);
});

test('a second BACK during a full-screen rotate-out never leaves the tool', () => {
  assert.match(read('screens/tools/ToolFullScreen.tsx'), /if \(open\) \{\s*if \(!closing\) setClosing\(true\);\s*return true;/);
  assert.match(read('screens/tools/WaveformScreen.tsx'), /if \(waveFsOpen\) \{\s*if \(!waveFsClosing\) setWaveFsClosing\(true\);\s*return true;/);
  assert.equal(read('screens/tools/SplMeterScreen.tsx').match(/held while closing/g)?.length, 3);
});

test('Library: DONE stays reachable after deleting every record', () => {
  assert.match(read('screens/tools/MeasurementLibraryScreen.tsx'), /\{\(selectMode \|\| all\.length >= 1\) && \(/);
});

test('engine: no background re-arm, no double Android permission prompt', () => {
  const src = read('features/tools/engine/useDspEngine.ts');
  assert.match(src, /rearms\.current < MAX_REARMS && !releasedForBg\.current\)/);
  assert.match(src, /if \(micPermissionPromptOpen\) return;/);
  assert.match(read('screens/tools/MultiMeterScreen.tsx'), /if \(isMicPermissionPromptOpen\(\)\) return;/);
});

test('tuner: a failed mic closes the full screens; the VU full screen dims a held Hz', () => {
  assert.match(read('screens/tools/FrequencyCounterScreen.tsx'), /if \(state === 'error' \|\| state === 'denied'\) \{\s*closeCenterLock\(\);\s*closeVuTuner\(\);/);
  assert.match(read('screens/tools/SkinnedTunerVu.tsx'), /dim=\{frame\.freq != null && !frame\.accepted\}/);
});

test('calculator: stage body capped; runner converts project units, refuses stale drafts, skips blank drafts, imports only finite values', () => {
  assert.match(read('screens/lab/calc/CalcWorkspaceScreen.tsx'), /<ScrollView style=\{\{ maxHeight: stageBodyMax \}\}/);
  const run = read('screens/lab/calc/CalcWorkflowRunScreen.tsx');
  assert.match(run, /existing\.source\.kind === 'project' \|\| existing\.source\.kind === 'fixed'/);
  assert.match(run, /!\(Date\.parse\(draft\.startedAt\) < Date\.parse\(valid\.updatedAt\)\)/);
  assert.match(run, /void workflowStore\.deleteRun\(draft\.id\);/);
  assert.match(run, /r\.steps\.every\(\(st\) => Object\.keys\(st\.inputs\)\.length === 0\)\) return true;/);
  assert.match(run, /o\.quantity === f\.quantity && Number\.isFinite\(o\.value\)\) \{/);
  assert.match(read('screens/lab/calc/calcReport.ts'), /const key = `\$\{i\.label\.toLowerCase\(\)\}\|\$\{i\.value\}\|\$\{i\.unit \?\? ''\}`;/);
  assert.match(read('screens/lab/calc/CalcProjectsScreen.tsx'), /skipped \+= 1; \/\/ labels stay unique/);
});
