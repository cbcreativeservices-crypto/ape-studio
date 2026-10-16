/**
 * Microphone Principles — lab-art fix round 3 (2026-10-16). Pins what the
 * grading found: the grip hand was a banded blob with no wrist or arm, the
 * distance and proximity mics floated, the hand panel's polar plot had no mic,
 * and the mistake-gallery hand floated beside the head.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const viz = readFileSync(new URL('../src/screens/lab/micspeaker/viz.tsx', import.meta.url), 'utf8');
const block = (start: string, end: string) => viz.slice(viz.indexOf(start), viz.indexOf(end, viz.indexOf(start)));

test('the canonical hand has a thumb, a wrist, a forearm and a sleeve that leave the frame', () => {
  const b = block('function buildHand(', '// Per-finger highlight tones');
  for (const part of ['thumb', 'forearm', 'sleeve', 'cuff', 'joints', 'knuckles']) assert.match(b, new RegExp(`const ${part} = Skia\\.Path\\.Make\\(\\)`), part);
  assert.match(viz, /const HAND_ARM_LEN = 2\d\d;/);
});

test('the hand state tint is a glow, never per-finger tint outlines (the "banded" look)', () => {
  const g = block('function GripHand(', '/**\n * BOOM STAND');
  assert.doesNotMatch(g, /path=\{f\} color=\{tint\}/);
  assert.match(g, /parts\.glow\} color=\{tint\}/);
});

test('the distance and proximity mics hang on a boom stand (nothing floats)', () => {
  assert.match(block('export function DistanceView(', 'export function proximityDb('), /<BoomStandParts boom=\{boom\} \/>/);
  assert.match(block('export function ProximityApproachView(', 'export function offAxisDb('), /<BoomStandParts boom=\{\{ clip: boomClip/);
});

test('the hand panel: a mic at the polar centre; the arm is clipped to panel 1 and kept inside the 70° wrist rule', () => {
  const h = block('export function HandPlacementView(', 'export function MicCutawayView(');
  assert.match(h, /<HandheldMic x=\{pcx\} y=\{pcy\}/);
  assert.match(h, /<Group clip=\{\{ x: 0, y: 0, width: w \* 0\.34/);
  assert.match(h, /Math\.min\(60,/);
});

test('mistake gallery: the arm runs toward the talker\'s shoulder (mirrored when needed), ≤ 70°', () => {
  const m = block('export function MistakeIllustration(', '// SPEAKER LAB');
  assert.match(m, /const mirror = lx < 0;/);
  assert.match(m, /Math\.min\(70,/);
  assert.match(m, /mirror=\{layout\.mirror\}/);
});
