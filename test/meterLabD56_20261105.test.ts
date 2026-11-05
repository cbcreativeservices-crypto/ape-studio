/**
 * D56 (2026-11-05) — the Meters lab says what it does, and Audio Community is
 * off Profile until the next store build and the forum go live.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const flat = (s: string) => s.replace(/\s+/g, ' ');

const A = flat(code('src/screens/lab/meter/modules/modMeterA.tsx'));
const B = flat(code('src/screens/lab/meter/modules/modMeterB.tsx'));
const C = flat(code('src/screens/lab/meter/modules/modMeterC.tsx'));
const V = code('src/screens/lab/meter/vizMeters.tsx');

describe('Signal Detective hides the name it asks for', () => {
  it('all three named displays are told to hide it', () => {
    assert.match(C, /<vm\.PeakMeterView [^>]*hideName \/>/);
    assert.match(C, /<vm\.PhaseMeterView [^>]*hideName \/>/);
    assert.match(C, /<vm\.VuMeterView [^>]*hideName \/>/);
  });
  it('and each display obeys', () => {
    for (const name of ['SAMPLE PEAK', 'VU', 'CORRELATION']) {
      assert.match(V, new RegExp(`\\{p\\.hideName \\? null : \\(\\n\\s*<Lbl [^\\n]*\\n\\s*${name}\\n`), name);
    }
  });
  it('the other labs still print the name', () => {
    const calls = flat(read('src/screens/lab/meter/modules/modMeterA.tsx')) + flat(read('src/screens/startHere/pages.tsx'));
    assert.doesNotMatch(calls, /hideName/);
  });
});

describe('Signal Detective shows position without a total (D117)', () => {
  it('CASE, QUESTION and SOLVED carry no "/N"', () => {
    const cells = C.slice(C.indexOf("{ k: 'CASE'"), C.indexOf("{ k: 'SOLVED'") + 60);
    assert.ok(cells.length > 60);
    assert.match(cells, /k: 'CASE', v: `\$\{idx \+ 1\}`/);
    assert.match(cells, /k: 'QUESTION', v: `\$\{step \+ 1\}`/);
    assert.match(cells, /k: 'SOLVED', v: `\$\{solvedN\}`/);
    assert.doesNotMatch(cells, /\}\/\$\{/);
  });
});

describe('Waterfall', () => {
  it('never tells you to pick the room you are in', () => {
    assert.match(B, /room === 'classroom' \? 'No ridge is marked yet/);
    assert.match(B, /useState<RoomKey>\('classroom'\)/);
    assert.doesNotMatch(B, /'Pick CLASSROOM\. Every ridge/);
  });
  it('the caption stays true at any DAMPING: under the mark, never "just under"', async () => {
    assert.match(B, /250 Hz mode stays under the mark here/);
    assert.doesNotMatch(B, /just under the mark/);
    const E = await import('../src/screens/lab/meter/meterEngine.ts');
    const at = (damping01: number) => E.waterfallRidge({ room: 'classroom', damping01, eqGains: {}, eqFilter: 'bell220q6', qRing: false, reverb: 'none' });
    assert.ok(at(1).ratio < 1.2, 'at full DAMPING the mode is nowhere near the mark');
  });
  it('the well names the lane the dock draws', () => {
    assert.doesNotMatch(B, /EQ GAIN/);
  });
  it('the caption is true: the default sits under the mark, and DAMPING toward 0 % crosses it', async () => {
    const E = await import('../src/screens/lab/meter/meterEngine.ts');
    const at = (damping01: number) => E.waterfallRidge({ room: 'classroom', damping01, eqGains: {}, eqFilter: 'bell220q6', qRing: false, reverb: 'none' });
    assert.ok(at(0.15).ratio < E.RIDGE_CALLOUT_RATIO);
    assert.ok(at(0).ratio >= E.RIDGE_CALLOUT_RATIO);
    assert.equal(Math.round(at(0).f / 10) * 10, 250);
  });
});

describe('Phase: the zone, the bar and the verdict agree', () => {
  it('MONO-SAFE starts at +0.5, the same as the green bar and the SAFE verdict', () => {
    assert.match(C, /const phaseZoneIdx = \(corr: number\) => \(corr >= 0\.5 \? 0 :/);
    assert.match(C, /if \(corr >= 0\.5\) return `MONO-FOLD VERDICT: SAFE/);
    assert.match(V, /zones\[2\]\.addRect\(Skia\.XYWHRect\(xOfC\(0\.5\)/);
  });
});

describe('Scope: SIGNAL is never a dead tray', () => {
  it('picking a SIGNAL in X-Y goes back to TIME', () => {
    assert.match(C, /onSelect: \(id\) => \{ setSignal\(id as SignalKey\); setXy\(false\); \}/);
  });
});

describe('Well text matches the meter', () => {
  it('VU: ORGAN does not light the LED at +0.0 dB (0.72 FS), and the well says so', async () => {
    const E = await import('../src/screens/lab/meter/meterEngine.ts');
    assert.ok(Math.max(...E.renderSignal('organ').map(Math.abs)) < 0.72);
    assert.match(V, /if \(m >= 0\.72\)/);
    assert.doesNotMatch(A, /similar LED/);
    assert.match(A, /stay under the LED, which stays dark/);
  });
  it('Peak: the lamp is not called a latch', () => {
    assert.doesNotMatch(A, /it LATCHES/);
    assert.doesNotMatch(C, /OVER latched|latched OVER|latched warning|lamp that latches/);
  });
  it('Loudness: the history label no longer calls it a 24 s loop', () => {
    assert.doesNotMatch(V, /LOOP ≈ 24 s/);
    assert.match(V, /SHORT-TERM · SPED UP/);
  });
  it('Waveform: Ø POL promises only what it does; Whistle matches its picture', () => {
    assert.match(A, /with DC at 0 %, tap the Ø POL key/);
    assert.match(flat(code('src/screens/lab/meter/modules/modMeterA.tsx')), /\(invert \? -v : v\) \* g \+ dcOff/);
    assert.match(B, /wavering only slightly with vibrato/);
  });
  it('‹ in a module says what it leaves; the rest of the labs keep "Leave the lab"', () => {
    assert.match(flat(code('src/screens/lab/meter/MeterModuleScreen.tsx')), /backLabel="Leave this module"/);
    assert.doesNotMatch(flat(code('src/screens/lab/meter/MeterLabHomeScreen.tsx')), /backLabel=/);
  });
});

describe('Audio Community is off Profile, the same way as Home', () => {
  const P = code('src/screens/profile/ProfileScreen.tsx');
  it('a named constant, off', () => {
    assert.match(P, /^const SHOW_COMMUNITY_ON_PROFILE = false;$/m);
    assert.match(code('src/screens/courses/CourseSelectionScreen.tsx'), /^const SHOW_COMMUNITY_ON_HOME = COMMUNITY_VISIBLE;$/m);
  });
  it('the PROFILE tab does not count requests nobody can reach', () => {
    const T = code('src/components/nav/TabBar.tsx');
    assert.match(T, /^const SHOW_COMMUNITY_BADGE_ON_TAB = COMMUNITY_VISIBLE;$/m);
    assert.match(T, /SHOW_COMMUNITY_BADGE_ON_TAB && name === 'Profile' \? <CommunityBadge/);
    assert.match(T, /SHOW_COMMUNITY_BADGE_ON_TAB && name === 'Profile' && inboxLabel/);
  });
  it('the section and the contact-request promise both hang on it', () => {
    assert.match(P, /\{SHOW_COMMUNITY_ON_PROFILE \? \(\n\s*<Section title="AUDIO COMMUNITY DIRECTORY"/);
    assert.match(P, /\{SHOW_COMMUNITY_ON_PROFILE\n\s*\? ' Members who find you in the directory/);
    assert.equal(P.match(/navigate\('AudioCommunityDirectory'\)/g)?.length, 1, 'the only way in from Profile sits in the hidden section');
  });
});
