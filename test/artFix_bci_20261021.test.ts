/**
 * Owner-approved drawing fixes, Cable Install stage plan (2026-10-21).
 * Source-reading ratchets (the art imports Skia).
 *  - B-CI-01: the wedge feeds leave the snake head's RETURN jacks at line
 *    level (XLR) into POWERED wedges — drawn in the analog class colour, and
 *    every wedge gets mains on its own lanes, apart from the audio bundle.
 *  - B-CI-02: the drum sub-snake (a multicore) fans out at the snake head
 *    into one XLR tail per input — never onto a single XLR input.
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

const ART = readFileSync(new URL('../src/screens/lab/cableinstall/scenes/floorArt.tsx', import.meta.url), 'utf8');

test('B-CI-02: the drum sub-snake fans out into several XLR tails on their own inputs', () => {
  // the multicore stops at the fan-out boot, never at an input jack
  assert.doesNotMatch(stagePlan, /H\$\{EDGE\.drum\} V\$\{JACK_IN\}/);
  assert.match(stagePlan, /H\$\{EDGE\.drum\} V\$\{DRUM_FAN\.top\}`\} color=\{grey\}/);
  const tails = FLOOR.match(/const DRUM_TAILS = \[(.*)\] as const;/)![1].split(',');
  assert.ok(tails.length >= 2, 'a fan-out has several tails');
  assert.equal(new Set(tails.map((t) => t.trim())).size, tails.length, 'each tail on its own input');
  assert.match(stagePlan, /DRUM_TAILS\.map\(\(x\) => \(\s*<JacketPath[^>]*V\$\{JACK_IN\}`\} color=\{mic\}/);
  // the snake head grows to carry them; vocal lines land on their own (moved) inputs
  assert.match(stagePlan, /<SnakeHeadTop x=\{SNAKE\.x\} y=\{SNAKE\.y\} inputs=\{SNAKE_INPUTS\} \/>/);
  assert.match(ART, /export function SnakeHeadTop\(\{ x, y, inputs = 6 \}/);
  assert.match(FLOOR, /const VOX_JACK = \[IN_X\[8\], IN_X\[7\], IN_X\[6\]\] as const;/);
  assert.match(FLOOR, /const DRUM_TAILS = \[IN_X\[2\], IN_X\[3\], IN_X\[4\], IN_X\[5\]\] as const;/);
  assert.match(stagePlan, /M\$\{VOX_JACK\[i\]\} \$\{JACK_IN\} V\$\{VOX_JOG_Y\[i\]\} H\$\{EDGE\.vox\[i\]\}/);
  for (const i of [0, 1, 2]) assert.ok(FLOOR.includes(`M\${VOX_JACK[${i}]} \${JACK_IN}`), `as-found VOX ${i + 1} starts on its own input`);
  assert.match(FLOOR, /fans out into one cyan XLR tail per input/);
});

const INSPECT = readFileSync(new URL('../src/screens/lab/cableinstall/scenes/InspectScene.tsx', import.meta.url), 'utf8');

test('B-CI-04: the representative analog run carries through the wall to the rack', () => {
  const runs = [...INSPECT.matchAll(/<RunIn d="([^"]+)"[^>]*color=\{CI_CLASS_TINTS\.analog\}/g)].map((m) => m[1]);
  assert.ok(runs.length >= 1);
  const last = runs[runs.length - 1];
  const nums = last.match(/-?[\d.]+/g)!.map(Number);
  const endX = nums[nums.length - 1];
  // the wall is x 254-259, the rack face starts at x 276
  assert.ok(endX >= 276, `analog run ends at the rack (x ${endX})`);
  assert.doesNotMatch(INSPECT, /C220 210 224 200 224 190" len/);
});
