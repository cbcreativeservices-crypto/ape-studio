/**
 * Owner design pass on the Pro Audio Multimeter, 2026-10-23 (approved).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const src = readFileSync(join(import.meta.dirname, '..', 'src', 'screens', 'tools', 'MultiMeterScreen.tsx'), 'utf8').replace(/\r\n/g, '\n');
const help = readFileSync(join(import.meta.dirname, '..', 'src', 'features', 'lab', 'guidedLessons', 'toolHelp.tsx'), 'utf8').replace(/\r\n/g, '\n');

describe('Multimeter owner pass 2026-10-23', () => {
  it('RTA is 83% of its old height', () => {
    assert.match(src, /const heroH = Math\.round\(0\.83 \* Math\.min\(340, Math\.max\(240, winH \* 0\.36\)\)\)/);
  });
  it('the level meter stands beside the RTA, not as a bar at the top', () => {
    assert.doesNotMatch(src, /hMeter/);
    assert.match(src, /styles\.vMeterCol/);
    assert.match(src, /const SPL_MIN_DB = FLOOR_DB;/);
  });
  it('RTA bars and the meter share one amplitude-standard colour scale', () => {
    assert.match(src, /const LEVEL_SCALE_STOPS = /);
    assert.match(src, /LEVEL_SCALE_STOPS\.map\(\(s\) => \(\n\s*<Stop key=\{s\.db\}/);
    assert.match(src, /colors=\{LEVEL_SCALE_STOPS\.map\(\(s\) => s\.color\)/);
  });
  it('RMS cell and the marker both show the 3-second power average', () => {
    assert.match(src, /const RMS_AVG_MS = 3000;/);
    assert.match(src, /Math\.pow\(10, meter\.zFastDb \/ 10\)/);
    assert.match(src, /fmtDb\(applyRef\(rms3sDb\)\)/);
    assert.match(src, /<Text style=\{styles\.statusSub\}>3 sec avg<\/Text>/);
    assert.match(src, /rmsDb: rms3sDb \?\? m\.zFastDb/);
    assert.match(help, /averaged over the last 3 seconds/);
  });
  it('SPL / RMS / PK HOLD frames are level-coloured; hold tick matches PK HOLD', () => {
    assert.match(src, /borderColor: levelColorForDb\(modeLevel\(meter\) as number\)/);
    assert.match(src, /borderColor: levelColorForDb\(rms3sDb\)/);
    assert.match(src, /borderColor: levelColorForDb\(meter\.peakHoldDb\)/);
    const hold = src.slice(src.indexOf('styles.vMeterHold,'), src.indexOf('styles.vMeterHold,') + 160);
    assert.ok(hold.includes('backgroundColor: levelColorForDb(meter.peakHoldDb)'), hold);
  });
  it('colour wheel on the RTA; long notes moved to the foot', () => {
    assert.match(src, /useToolColorPref\('ape:tools:multimeterRtaColor'\)/);
    assert.match(src, /LIVE SPECTRUM NOTES/);
    assert.ok(src.indexOf('LIVE SPECTRUM NOTES') > src.indexOf('SMART DETECTION'));
  });
});
