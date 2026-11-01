/**
 * D41 behaviour fixes (owner go 2026-11-01).
 *
 * #24 Sound Systems LEARN · Gain structure: VERDICT OK and the goal chip need
 *     REAL headroom — the same HEADROOM_GOOD_DB (12 dB) that turns the HEADROOM
 *     readout from orange to green. Below it a clean chain reads TIGHT.
 *     (gainDock.tsx imports react-native via rackLayout, so its rule is pinned
 *     from source and re-derived here from the shared chain model.)
 *
 * #31/#32 Amp · Class explorer: Class A device heat = supply power − load power,
 *     so it is highest at idle. SIGNAL off at LEVEL 80% must not cool it, and the
 *     HEAT word stays "hot" at every level — matching the card on that screen.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { computeGainChain, gainVerdict } from '../src/features/soundsystems/operate.ts';
import { simulateLinearClass } from '../src/features/amp/ampModel.ts';

const code = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const DOCK = code('src/screens/lab/soundsystems/gainDock.tsx');
const LEARN_C = code('src/screens/lab/soundsystems/pagesLearnC.tsx');
const OPERATE = code('src/screens/lab/soundsystems/pagesOperate.tsx');
const RIG = code('src/screens/lab/amp/AmpRig.tsx');
const CLASSES = code('src/screens/lab/amp/modules/mod4Classes.tsx');

describe('#24 gain structure: OK needs the same headroom that turns HEADROOM green', () => {
  const GOOD = Number(/export const HEADROOM_GOOD_DB = (\d+);/.exec(DOCK)?.[1]);
  const least = (s: Record<string, number>) => Math.min(...computeGainChain(s).map((n) => n.headroomDb));
  // LEARN's reading, as gainReading in gainDock computes it.
  const reading = (s: Record<string, number>) => {
    const v = gainVerdict(computeGainChain(s));
    return v === 'ok' && least(s) < GOOD ? 'tight' : v;
  };

  it('one constant, 12 dB, drives the colour and the reading', () => {
    assert.equal(GOOD, 12);
    assert.match(DOCK, /leastHeadroomDb\(chain\) >= HEADROOM_GOOD_DB \? colors\.green : colors\.orange/, 'HEADROOM colour');
    assert.match(DOCK, /verdict === 'ok' && leastHeadroomDb\(chain\) < HEADROOM_GOOD_DB \? 'tight' : verdict/, 'TIGHT below it');
    assert.doesNotMatch(DOCK, /least >= 12/, 'no second, literal threshold');
    assert.match(OPERATE, /headroomDb >= HEADROOM_GOOD_DB/, 'OPERATE’s 12 dB goal uses the same constant');
  });

  it('the LEARN page grades, latches and colours from the reading, not the bare verdict', () => {
    assert.match(LEARN_C, /const verdict = gainReading\(chain, gainVerdict\(chain\)\);/);
    assert.match(LEARN_C, /if \(verdict === 'ok' && !sawOk\) setSawOk\(true\);/);
    assert.match(LEARN_C, /bezel: gainBezel\(chain, verdict\)/);
    assert.match(LEARN_C, /gainReadingCopy\(verdict, chain\)/);
    assert.match(LEARN_C, /verdict === 'tight'\}>/, 'TIGHT is a warning on the verdict line');
    assert.match(LEARN_C, /label: `Reach a clean, low-hiss structure with \$\{HEADROOM_GOOD_DB\} dB headroom \(VERDICT OK\)`/);
  });

  it('the bug case — preamp +50, 0 dB headroom — no longer reads OK', () => {
    const s = { preamp: 50, fader: 0, main: 0, procIn: 0, procOut: 0 };
    assert.equal(gainVerdict(computeGainChain(s)), 'ok', 'the shared verdict alone still says OK');
    assert.equal(least(s), 0);
    assert.equal(reading(s), 'tight');
  });

  it('textbook unity (preamp 40) is TIGHT at 10 dB; preamp 38 reaches OK at exactly 12 dB', () => {
    const unity = { preamp: 40, fader: 0, main: 0, procIn: 0, procOut: 0 };
    assert.equal(least(unity), 10);
    assert.equal(reading(unity), 'tight');
    const fixed = { preamp: 38, fader: 0, main: 0, procIn: 0, procOut: 0 };
    assert.equal(least(fixed), 12);
    assert.equal(reading(fixed), 'ok', 'the goal is still reachable');
  });

  it('colour and reading agree at every preamp setting with the later stages at unity', () => {
    for (let p = 0; p <= 60; p++) {
      const s = { preamp: p, fader: 0, main: 0, procIn: 0, procOut: 0 };
      const ch = computeGainChain(s);
      const green = !ch.some((n) => n.clipped) && least(s) >= GOOD;
      if (reading(s) === 'ok') assert.ok(green, `preamp ${p}: OK beside an orange HEADROOM`);
    }
  });
});

describe('#31/#32 Class A heat is highest at idle', () => {
  const m = /export const heatWord = \(heat: number\) => \(heat < ([\d.]+) \? 'cool' : heat < ([\d.]+) \? 'warm' : heat < ([\d.]+) \? 'hot' : 'DANGER'\);/.exec(RIG);
  assert.ok(m, 'AmpRig heatWord thresholds');
  const [cool, warm, hot] = [Number(m![1]), Number(m![2]), Number(m![3])];
  const heatWord = (h: number) => (h < cool ? 'cool' : h < warm ? 'warm' : h < hot ? 'hot' : 'DANGER');
  const heatA = (d: number) => simulateLinearClass('A', d, 0).heat;

  it('SIGNAL off at LEVEL 80% (effDrive 0) does not cool the device', () => {
    assert.match(CLASSES, /const effDrive = cls === 'A' && !signalOn \? 0 : drive;/);
    assert.ok(heatA(0) >= heatA(0.8), `${heatA(0)} vs ${heatA(0.8)}`);
    assert.equal(heatWord(heatA(0)), heatWord(heatA(0.8)));
  });

  it('heat never rises with level, and reads "hot" at every level', () => {
    let prev = Infinity;
    for (let i = 0; i <= 100; i++) {
      const h = heatA(i / 100);
      assert.ok(h <= prev + 1e-12, `heat rose at ${i}%`);
      assert.equal(heatWord(h), 'hot', `HEAT at ${i}%`);
      prev = h;
    }
  });

  it('the screen’s text says the same: heat does not fall with SIGNAL off', () => {
    assert.match(CLASSES, /idle current carries on exactly as before — and the heat does not fall/);
    assert.match(CLASSES, /heat: 'High — highest at idle'/);
    assert.doesNotMatch(CLASSES, /and heat — carry on exactly as before/);
  });

  it('the other classes are unchanged', () => {
    for (const d of [0, 0.25, 0.5, 0.8, 1]) {
      assert.equal(simulateLinearClass('B', d, 0).heat, Math.min(1, Math.max(0, 0.12 + 0.35 * d)));
    }
  });
});
