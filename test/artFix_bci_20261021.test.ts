/**
 * Owner-approved drawing fixes, Cable Install stage plan (2026-10-21).
 * Source-reading ratchets (the art imports Skia).
 *  - B-CI-01: the wedge feeds leave the snake head's RETURN jacks at line
 *    level (XLR) into POWERED wedges — drawn in the analog class colour, and
 *    every wedge gets mains on its own lanes, apart from the audio bundle.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const FLOOR = readFileSync(new URL('../src/screens/lab/cableinstall/scenes/FloorScene.tsx', import.meta.url), 'utf8');
const stagePlan = FLOOR.slice(FLOOR.indexOf('function StagePlan('), FLOOR.indexOf('/* ── route drawing shared'));

test('B-CI-01: wedge feeds are drawn as line-level (analog class), never as loudspeaker cable', () => {
  assert.ok(stagePlan.length > 1000);
  assert.doesNotMatch(stagePlan, /CI_CLASS_TINTS\.speaker/, 'no loudspeaker-class cable on the stage plan');
  assert.doesNotMatch(stagePlan, /tint=\{spk\}/);
  assert.match(stagePlan, /AS_FOUND_MON\.map[\s\S]{0,200}tint=\{mic\}/);
  assert.match(stagePlan, /SEND_Y\[i\]\} H\$\{j\.x\} V\$\{j\.y\}`\}\s*len=\{[^}]+\}\s*tint=\{mic\}/);
  assert.doesNotMatch(FLOOR, /monitor \(loudspeaker\) feeds/);
  assert.match(FLOOR, /line-level XLR into powered wedges/);
});

test('B-CI-01: every wedge gets mains in the wedge row, never in the feed bundle along the lip', () => {
  // a downstage quad box fed from the SL wing, then one AC lead per wedge
  assert.match(stagePlan, /M\$\{edgeX \+ 8\} \$\{WEDGE_AC_Y\} H\$\{WQUAD\.x \+ 7\}/);
  const acRuns = stagePlan.match(/\[VOX_XS\[2\] - WEDGE_HALF, VOX_XS\[1\] \+ WEDGE_HALF\]|\[WQUAD\.x, VOX_XS\[2\] \+ WEDGE_HALF\]|\[VOX_XS\[1\] - WEDGE_HALF, VOX_XS\[0\] \+ WEDGE_HALF\]/g) ?? [];
  assert.equal(acRuns.length, 3, 'one AC run into each of the three wedges');
  assert.match(stagePlan, /key=\{`ac\$\{x1\}`\} d=\{`M\$\{x1\} \$\{WEDGE_AC_Y\} H\$\{x2\}`\} color=\{pwr\}/);
  // the AC lane sits in the wedge row: upstage of the first feed lane, below the wedges' rear edge only by the side panel
  const wedgeY = Number(FLOOR.match(/const WEDGE_Y = ([\d.]+);/)![1]);
  const acY = wedgeY + Number(FLOOR.match(/const WEDGE_AC_Y = WEDGE_Y \+ ([\d.]+);/)![1]);
  const sendY0 = Number(FLOOR.match(/const SEND_Y = \[([\d.]+),/)![1]);
  assert.ok(sendY0 - acY >= 4, `AC lane (y ${acY}) keeps apart from the feed lanes (y ≥ ${sendY0})`);
  assert.ok(acY < wedgeY + 13.4 / 2, 'AC enters at the side panel, inside the wedge depth');
  // the stair walkway crossing gets its own cover
  assert.match(stagePlan, /y=\{WEDGE_AC_Y - 3\}[^>]*fill="#1b1c20"/);
});
