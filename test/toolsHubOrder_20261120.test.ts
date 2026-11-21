/**
 * The Audio Tools hub's tile order and the tuner's name (owner 2026-11-20,
 * "one last update before we OTA"): Spectrogram and Waveform swapped; the
 * Tuner & Frequency Counter swapped with the Tone / Noise Generator; the tool
 * reads TUNER first everywhere it is named (hub tile, its own screen's title
 * and subtitle, its catalog entry); on the tool's landing the purple Tuner
 * sits first, above the green Sound counter, and Light Pulse sits last.
 * Everything a hub tile carries (strip art, wear seed, screen-reader text)
 * stays keyed by TOOL.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const hub = read('src/screens/tools/ToolsHubScreen.tsx');
const fc = read('src/screens/tools/FrequencyCounterScreen.tsx');

describe('Audio Tools hub, owner 2026-11-20', () => {
  it('the reading order', () => {
    const m = hub.match(/const TILE_ORDER: ToolKey\[\] = \[([\s\S]*?)\];/);
    assert.ok(m);
    const order = [...m[1].matchAll(/'([a-z0-9]+)'/g)].map((x) => x[1]);
    assert.deepEqual(order, ['spl', 'multimeter', 'spectrogram', 'rta', 'waveform', 'hzcounter', 'rt60', 'signalgen']);
  });

  it('tuner first everywhere the tool is named', () => {
    assert.match(read('src/screens/tools/toolsData.ts'), /name: 'Tuner & Frequency Counter',\n  subtitle: 'Pitch Tuner · Hz Counter',/);
    assert.match(hub, /name=\{t\.name\}/);
    assert.match(hub, /hzcounter: 'Tuner and frequency counter: tuning meter with a needle reading off center',/);
    assert.match(fc, />TUNER & FREQUENCY COUNTER</);
    assert.match(fc, /modeMeta \? modeMeta\.name : 'Pitch Tuner · Hz Counter'/);
  });

  it('the tool landing: Tuner first, above Sound; Light Pulse last', () => {
    const m = fc.match(/const MODES: \{ key: Mode; name: string; blurb: string \}\[\] = \[([\s\S]*?)\n\];/);
    assert.ok(m);
    assert.deepEqual([...m[1].matchAll(/key: '([a-z]+)'/g)].map((x) => x[1]), ['tuner', 'sound', 'tap', 'light']);
  });

  it('art and wear stay with each tool, not with a position', () => {
    assert.match(hub, /spl: 11, multimeter: 23, waveform: 37, rta: 51, spectrogram: 61, signalgen: 71, rt60: 83, hzcounter: 97,/);
    assert.match(hub, /hzcounter: ToolStripHzcounter,/);
    assert.match(hub, /signalgen: ToolStripSignalgen,/);
  });
});
