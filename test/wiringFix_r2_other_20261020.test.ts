/**
 * Wiring & signal-flow fixes, round 2 (2026-10-20 night) — Signal Chain,
 * Gain, Mastering, Digital, FX lessons, Amp, Production, Calc and the lab
 * catalog. Each block fails if the wrong wording or logic comes back.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { checkMonitorPath } from '../src/screens/lab/mastering/masteringEngine.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

describe('SC-R2-01/02 — the limiter ceiling is a teaching setting; the order is this rack’s', () => {
  it('the low ceiling is said to be low on purpose, and nothing calls the order canonical', () => {
    const s = read('src/screens/lab/SignalChainLabScreen.tsx');
    assert.match(s, /setting: 'low ceiling −25 dB'/);
    assert.match(s, /set LOW \(−25 dB\) on purpose/);
    assert.doesNotMatch(s, /canonical/i);
    assert.doesNotMatch(read('src/screens/lab/chainRack.tsx'), /canonical/i);
  });
});

describe('GN-R2-01..04 — Gain: strip stages, a quiet mic, the XLR run and the monitor lead', () => {
  it('the copy matches the drawing', () => {
    const s = read('src/screens/lab/gain/modules/modExplore.tsx');
    assert.doesNotMatch(s, /rack of separate devices/);
    assert.match(s, /A real channel strip is a chain of separate stages/);
    assert.doesNotMatch(s, /quiet instrument\/source/);
    assert.match(s, /quiet mic/);
    assert.match(s, /powered nearfield monitor/);
  });
  it('the mic cable is one lane into an XLR socket; the master has a lead to the monitor', () => {
    const g = read('src/screens/lab/gain/gainGear.tsx');
    assert.match(g, /export function MicCableRun\(/);
    assert.match(g, /<XlrSocket cx=\{XLR_IN\.x\}/);
    assert.match(g, /the line lead: a plug in the strip's output jack/);
    const v = read('src/screens/lab/gain/gainViz.tsx');
    assert.match(v, /<MicCableRun/);
  });
});

describe('MA-R2-01 — a digital controller feeding a converter is not called wrong', () => {
  it('the note names this lab’s analog controller and the digital-domain case', () => {
    const r = checkMonitorPath(['daw', 'monitorCtl', 'dac', 'active']);
    assert.equal(r.ok, false);
    assert.ok(r.notes.some((n) => /analog monitor controller/.test(n) && /feeds a converter after it/.test(n)));
    assert.ok(!r.notes.some((n) => /is the wrong order/.test(n)));
  });
});

describe('DG-R2-01 — the digital path ends in an amplifier and a loudspeaker', () => {
  it('banner and body', () => {
    const s = read('src/screens/lab/digital/DigitalLabHomeScreen.tsx');
    assert.match(s, /'RECONSTRUCTION', 'AMPLIFIER', 'LOUDSPEAKER', 'SOUND'/);
    assert.match(s, /reconstruction → amplifier → loudspeaker → sound/);
  });
});

describe('FX-R2-01..03 — true-peak margin agrees; gate key controls are not in this lab; 2:1 hedged', () => {
  it('Limiter lesson, Calc and Mastering agree: −1 commonly quoted, −2 for lossy, check the spec', () => {
    const c = read('src/features/lab/guidedLessons/content.ts');
    assert.doesNotMatch(c, /safe for streaming\/lossy/);
    assert.match(c, /−1 dBTP is a commonly quoted margin; lossy delivery often uses −2 dBTP; check the destination’s current spec/);
    const l = read('src/screens/lab/calc/workspaces/loudness.ts');
    assert.match(l, /lossy delivery often uses −2 dBTP/);
    assert.doesNotMatch(l, /RECOMMENDED CEILING/);
    const m = read('src/screens/lab/mastering/masteringContent.ts');
    assert.match(m, /lossy delivery often uses −2 dBTP — confirm the destination\\'s current spec/);
  });
  it('Gate: sidechain, key filter and listen are marked not in this lab', () => {
    const c = read('src/features/lab/guidedLessons/content.ts');
    assert.equal((c.match(/Not in this lab — (common on|found on many) hardware and plugin gates/g) ?? []).length, 3);
  });
  it('2:1 is a common gentle mix-bus starting point, not THE setting', () => {
    const f = read('src/screens/lab/fxLabConfigs.tsx');
    assert.doesNotMatch(f, /The transparent, mix-bus setting/);
    assert.match(f, /a common gentle mix-bus starting point/);
  });
});

describe('AM-R2-01..03 — Amp: this amp’s bridged minimum; a closed loop; the secondary scales', () => {
  it('bridged minimum is this amplifier’s', () => {
    const s = read('src/screens/lab/amp/modules/mod7RealWorld.tsx');
    assert.equal((s.match(/this amplifier’s \{MIN_BRIDGED_Z\} Ω bridged minimum \(twice its \{MIN_STEREO_Z\} Ω stereo minimum; check the manual\)/g) ?? []).length, 2);
  });
  it('the load returns to the supply −, and the secondary wave follows Ns/Np', () => {
    const s = read('src/screens/lab/amp/modules/mod2Devices.tsx');
    assert.match(s, /d=\{`M300 80 V\$\{RETURN_Y\} H6 V69`\}/);
    assert.match(s, /const secScale = Math\.min\(2, Math\.max\(0\.25, ns \/ Math\.max\(1, np\)\)\)/);
    assert.match(s, /q10 \$\{-20 \* secScale\}/);
  });
});

describe('PR-R2-01..03 — Production: stereo channels count; passive split phantom; speaker level checked', () => {
  it('copy', () => {
    const s = read('src/features/production/preprod/stage5.data.ts');
    assert.doesNotMatch(s, /two rows or two channels, never one/);
    assert.doesNotMatch(s, /needs two console channels and two recorder tracks/);
    assert.match(s, /two mono console channels or one stereo channel/);
    assert.match(s, /On a passive splitter only one console supplies phantom power, normally the one on the direct side/);
    assert.doesNotMatch(s, /a line output into a microphone preamp at full gain/);
    assert.match(s, /a speaker-level output wired into a console or recorder input/);
  });
  it('logic: a stereo entry is a home for a pair; speaker level into an input is caught', () => {
    const s = read('src/features/production/preprod/logic2.ts');
    assert.match(s, /const holdsPair = /);
    assert.match(s, /!holdsPair\(consoleChannels\)/);
    assert.match(s, /!holdsPair\(cell\(r, 'in_console'\)\)/);
    assert.match(s, /const speakerIntoInput = /);
  });
});

describe('CA-R2-01..05 — Calc pads, 70 V and "suggested"', () => {
  it('pads: H/O-pad for balanced lines, bridging gear uses an L-pad, no "reflects"', () => {
    const s = read('src/screens/lab/calc/workspaces/powerElec.ts');
    assert.doesNotMatch(s, /nothing loads down\s*'?\s*\+?\s*'?\s*or reflects/);
    assert.doesNotMatch(s, /reflects/);
    assert.match(s, /H-pad/);
    assert.match(s, /O-pad/);
    assert.match(s, /L-pad divider/);
  });
  it('speakers: amp-nearer / powered first, 70 V for distributed; lighter (not thin) cable; suggested', () => {
    const s = read('src/screens/lab/calc/workspaces/speakers.ts');
    assert.match(s, /move the amplifier nearer the speaker \(or use powered speakers\); for distributed paging or background music, a 70 V line/);
    assert.match(s, /past ~20–30 m on light gauge into low impedance/);
    assert.doesNotMatch(s, /thin cable/);
    assert.doesNotMatch(s, /RECOMMENDED|Recommended|recommends/);
  });
});

describe('Catalog — the Patchbay blurb hedges the top/bottom convention (P5)', () => {
  it('"On most bays"', () => {
    const f = read('src/screens/lab/labCatalog.ts');
    assert.match(f, /On most bays, top is the source and bottom is the destination/);
  });
});
