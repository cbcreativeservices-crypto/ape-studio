/**
 * Wiring & signal-flow fixes, 2026-10-20 — Signal Chain, Gain, Mastering and
 * Digital labs (register: docs/wiring/WIRING_FINDINGS_2026_10_20.md, rows
 * SC-01..03, GN-01..02, MA-01..02, DG-01..03). Each block fails if the wrong
 * wording or logic comes back.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { checkMonitorPath, type PathDevice } from '../src/screens/lab/mastering/masteringEngine.ts';
import * as gainEngine from '../src/screens/lab/gain/gainEngine.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

/** The Signal Chain lesson block of the shared guided-lesson content. */
function chainLesson(): string {
  const src = read('src/features/lab/guidedLessons/content.ts');
  const a = src.indexOf('CAPSTONE · Signal Chain Builder');
  assert.ok(a >= 0, 'chain lesson found');
  const b = src.indexOf('EXPANSION · Bass Guitar Lab', a);
  return src.slice(a, b);
}

describe('SC-01 — the rack order is "this rack’s fixed order", not a canonical studio order', () => {
  it('neither the lesson nor the screen calls the order canonical', () => {
    assert.doesNotMatch(chainLesson(), /canonical/i);
    const screen = read('src/screens/lab/SignalChainLabScreen.tsx');
    assert.doesNotMatch(screen, /CANONICAL ORDER/);
    assert.doesNotMatch(screen, /The order is the fixed canonical order/);
    assert.match(chainLesson(), /this rack’s fixed order/);
    assert.match(screen, /THIS RACK’S FIXED ORDER/);
  });
});

describe('SC-02 — a limiter holds a true-peak ceiling only with true-peak detection', () => {
  it('no "guarantee" of a true ceiling; true-peak detection / oversampling is named', () => {
    const l = chainLesson();
    assert.doesNotMatch(l, /true-ceiling guarantee|ceiling guarantee/);
    assert.match(l, /true-peak detection \(oversampling\)/);
    assert.match(l, /inter-sample peaks/);
  });
});

describe('SC-03 — the display text matches the drawn rack', () => {
  it('no pills or "GR meters below"', () => {
    const l = chainLesson();
    assert.doesNotMatch(l, /Each pill/);
    assert.doesNotMatch(l, /GR meters below/);
    assert.doesNotMatch(l, /GR meters between modules/);
    // R7-SC-02 (round 8): one cable per hop, not one cable for the rack.
    assert.match(l, /rack units with one patch cable for each hop/);
  });
});

describe('GN-01 — the one-ceiling model names its architecture', () => {
  it('the engine header states the analog / fixed-point simplification', () => {
    const src = read('src/screens/lab/gain/gainEngine.ts');
    assert.match(src, /passive fader cannot clip on its own/);
    assert.match(src, /floating-\s*\*?\s*point digital bus/);
  });
  it('the fader fault says a passive fader cannot clip and names the floating-point case', () => {
    const src = read('src/screens/lab/gain/modules/modExplore.tsx');
    assert.doesNotMatch(src, /pushed so far up it overloads right at the fader/);
    assert.match(src, /a passive fader cannot clip by itself/);
    assert.match(src, /floating-point digital desk/);
  });
});

describe('GN-02 — no sum at a one-channel bus; the dead code stays gone', () => {
  it('the bus fault does not blame a sum that the model does not have', () => {
    const src = read('src/screens/lab/gain/modules/modExplore.tsx');
    assert.doesNotMatch(src, /the sum tips over/);
    assert.match(src, /This lab runs one channel/);
  });
  it('the unused converter-blaming symptom helpers and the DeviceCard rack are removed', () => {
    const eng = gainEngine as Record<string, unknown>;
    for (const name of ['symptomFor', 'takeSymptom', 'computeTake', 'latchAdvance', 'snrFor', 'snrLossDb', 'SOUNDCHECK_TAKE']) {
      assert.equal(eng[name], undefined, `${name} is dead code`);
    }
    const src = read('src/screens/lab/gain/gainEngine.ts');
    assert.doesNotMatch(src, /that is the converter, not warmth/);
    const viz = read('src/screens/lab/gain/gainViz.tsx');
    assert.doesNotMatch(viz, /export function DeviceCard|function DeviceCable|export function DeviceMeter/);
    assert.doesNotMatch(viz, /DeviceCard \+ CableLink — modules 6–8/, 'the stale header is gone');
  });
});

describe('MA-01 — the D/A converter comes before the power amplifier', () => {
  it('DAC → amp → passive passes', () => {
    const r = checkMonitorPath(['daw', 'dac', 'amp', 'passive']);
    assert.equal(r.ok, true);
    assert.equal(checkMonitorPath(['daw', 'dac', 'monitorCtl', 'amp', 'passive']).grade, 'complete');
  });
  it('an amp before the DAC fails, with the reason in words', () => {
    for (const chain of [
      ['daw', 'amp', 'dac', 'passive'],
      ['daw', 'monitorCtl', 'amp', 'dac', 'passive'],
    ] as PathDevice[][]) {
      const r = checkMonitorPath(chain);
      assert.equal(r.ok, false, chain.join('→'));
      assert.equal(r.grade, 'fail');
      assert.ok(r.notes.some((n) => /D\/A converter comes before the power amplifier/.test(n)), chain.join('→'));
    }
  });
  it('a DAC after analog active monitors fails', () => {
    assert.equal(checkMonitorPath(['daw', 'active', 'dac']).ok, false);
  });
});

describe('MA-02 — USB leaves the DAW only into the converter (or a converting controller)', () => {
  // mastArt imports react-native-svg, so the rule is read from source and run.
  const src = read('src/screens/lab/mastering/mastArt.tsx');
  const a = src.indexOf('function cableFor(');
  const b = src.indexOf('\n}\n', a);
  const js = src
    .slice(a, b + 2)
    .replace(/\(a: PathDevice, b: PathDevice\): 'usb' \| 'line' \| 'speaker'/, '(a, b)');
  const cableFor = new Function(`${js}; return cableFor;`)() as (a: PathDevice, b: PathDevice) => string;
  it('USB only into the DAC or a monitor controller', () => {
    assert.equal(cableFor('daw', 'dac'), 'usb');
    assert.equal(cableFor('daw', 'monitorCtl'), 'usb');
  });
  it('never USB into a power amp or a monitor: the line out of the interface instead', () => {
    for (const b of ['amp', 'active', 'passive'] as PathDevice[]) assert.equal(cableFor('daw', b), 'line', b);
    assert.equal(cableFor('dac', 'amp'), 'line');
    assert.equal(cableFor('amp', 'passive'), 'speaker');
  });
});

describe('DG-01 — the simplified chain keeps the preamp', () => {
  it('SIMPLE_STAGES runs mic → preamp → …, like the full chain', () => {
    const src = read('src/screens/lab/digital/vizChain.tsx');
    const a = src.indexOf('const SIMPLE_STAGES');
    const block = src.slice(a, src.indexOf('];', a));
    const keys = [...block.matchAll(/key: '(\w+)'/g)].map((m) => m[1]);
    assert.deepEqual(keys.slice(0, 2), ['mic', 'preamp']);
    const home = read('src/screens/lab/digital/DigitalLabHomeScreen.tsx');
    assert.doesNotMatch(home, /microphone → analog voltage → anti-aliasing/);
    assert.match(home, /microphone → preamp/);
  });
});

describe('DG-02 — which clip comes first depends on the design', () => {
  it('the preamp is not taught as always clipping first', () => {
    const src = read('src/screens/lab/digital/modules/modChain.tsx');
    assert.doesNotMatch(src, /and it happens first in the chain/);
    assert.match(src, /depends on the design: on most interfaces the converter reaches 0 dBFS before the analog stage clips/);
  });
});

describe('DG-03 — the discrete anti-alias block is flagged as the classic model', () => {
  it('the filter block names delta-sigma oversampling', () => {
    const src = read('src/screens/lab/digital/modules/modChain.tsx');
    assert.match(src, /delta-sigma\) converters keep only a gentle analog filter, oversample, and do the steep filtering digitally/);
  });
});
