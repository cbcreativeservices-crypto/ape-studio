/**
 * DJ-03 (owner 2026-10-20): the powered speaker's MIC · LINE input switch —
 * which the capstone fault PA_INPUT_MIC and Screen 4's TERMS depend on — is
 * drawn on its rear panel and on its input plate (a real 2-position slide
 * switch, about 12 × 6 mm), on LINE unless the model says MIC (djEvent
 * `paRMic`, PA R). The plate's existing geometry (PLATE) is untouched.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLATE, PLATE_H, PLATE_W } from '../src/screens/lab/dj/geometry/gearGeometry.ts';

const ROOT = join(import.meta.dirname, '..');
const gear = readFileSync(join(ROOT, 'src/screens/lab/dj/art/gear.tsx'), 'utf8');
const map = readFileSync(join(ROOT, 'src/screens/lab/dj/art/SystemMap.tsx'), 'utf8');
const num = (re: RegExp) => Number(gear.match(re)![1]);

describe('DJ-03: the MIC · LINE switch on the powered speaker', () => {
  it('is a 12 × 6 mm two-position slide switch with its legend, on the rear and the plate', () => {
    assert.equal(num(/export const MICLINE_W = (\d+);/), 12);
    assert.equal(num(/export const MICLINE_H = (\d+);/), 6);
    assert.match(gear, /<SlideSwitch x=\{cx - MICLINE_W \/ 2\} y=\{cy - MICLINE_H \/ 2\} w=\{MICLINE_W\} h=\{MICLINE_H\} pos=\{mic \? 0 : 1\} positions=\{2\} \/>/);
    assert.match(gear, /text="MIC · LINE"/);
    assert.match(gear, /<MicLineSwitch cx=\{SPEAKER_REAR_MICLINE\.x\} cy=\{SPEAKER_REAR_MICLINE\.y\} mic=\{mic\}/);
    assert.match(gear, /<MicLineSwitch cx=\{PLATE_MICLINE\.x\} cy=\{PLATE_MICLINE\.y\} mic=\{mic\}/);
  });
  it('sits clear of the plate’s parts and the rear panel’s', () => {
    const px = num(/export const PLATE_MICLINE = \{ x: (\d+)/);
    const py = num(/export const PLATE_MICLINE = \{ x: \d+, y: (\d+)/);
    // switch box and its 4 mm legend above (≈ 20 mm wide)
    const sw = { x0: px - 10, x1: px + 10, y0: py - 3 - 6.5, y1: py + 3 };
    assert.ok(sw.x0 > 0 && sw.x1 < PLATE_W && sw.y0 > 14 && sw.y1 < PLATE_H, 'inside the plate, under the title');
    assert.ok(sw.y1 < PLATE.level.y - 10, 'above LEVEL and its ticks');
    assert.ok(Math.hypot(px - PLATE.input.x, py - PLATE.input.y) > 30, 'clear of the input');
    assert.ok(sw.x1 < PLATE.level.x + 18 - 2 || sw.y1 < PLATE.level.y - 12 - 2, 'clear of the light');
    const rx = num(/export const SPEAKER_REAR_MICLINE = \{ x: (\d+)/);
    const ry = num(/export const SPEAKER_REAR_MICLINE = \{ x: \d+, y: (\d+)/);
    assert.ok(rx - 13 > 70 + 19 && rx + 13 < 147, 'between LEVEL (and its ticks) and the ON · LIMIT lights');
    assert.ok(ry - 9.5 > 128 + 2 && ry + 3 < 210 - 20, 'under ON · LIMIT, above the power rocker and AC IN');
  });
  it('shows the booth’s setting: PA R on MIC when the capstone set it, otherwise LINE', () => {
    assert.match(gear, /mic = false \}: \{ x: number; y: number; s\?: number; on: boolean; level\?: number; mic\?: boolean \}/);
    assert.match(map, /mic=\{k === 'paR' && !!booth\.ev\?\.paRMic\}/);
  });
});
