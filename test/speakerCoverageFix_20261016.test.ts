/**
 * Speaker Placement & Coverage — fix pass 2026-10-16 (lab-art grading, bottom
 * ten). Pins the physics of the conceptual coverage map and the drawing rules
 * the grading found broken:
 *   • the rated coverage angle is the −6 dB angle (the old curve held full
 *     level to the edge); inverse-square distance; wrap-safe side angles;
 *   • rays, wavefronts and the field stop at the floor / deck / risers and
 *     never run past the room;
 *   • people are the house figures at true size (no stick guitarist, no
 *     line-art heads for the band), on one metre shared by both views;
 *   • nothing floats: every single box is on a stand or a bridle + hoist;
 *   • the scale bar's words are ≥ 9 pt at every zoom.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { coverageT, dirGain, sideLevelSmooth, smoothEdge, topLevelSmooth } from '../src/screens/lab/micspeaker/coverageModel.ts';

const db = (x: number) => 10 * Math.log10(x);
const read = (f: string) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const viz = read('src/screens/lab/micspeaker/viz.tsx');
const body = (name: string) => {
  const a = viz.indexOf(`export function ${name}(`);
  assert.ok(a >= 0, name);
  const b = viz.indexOf('\nexport function ', a + 10);
  return viz.slice(a, b < 0 ? undefined : b);
};

test('the pattern: 0 dB on axis, −6 dB at the RATED angle, steeply down past it, floored at −20 dB', () => {
  for (const half of [20, 30, 45, 60]) {
    assert.equal(smoothEdge(0, half), 1);
    assert.ok(Math.abs(db(smoothEdge(half, half)) + 6) < 1e-9, `−6 dB at the ${2 * half}° box's edge`);
    assert.ok(db(smoothEdge(1.5 * half, half)) < -12, 'well down at 1.5× the half-angle — nothing leaks sideways');
    assert.ok(Math.abs(db(smoothEdge(180, half)) + 20) < 1e-9, 'the side/rear floor');
    // monotone falling off axis
    let prev = 2;
    for (let a = 0; a <= 180; a += 5) {
      const g = smoothEdge(a, half);
      assert.ok(g <= prev + 1e-12);
      prev = g;
    }
  }
});

test('distance: inverse-square — −6 dB per doubling, the same for a wide and a narrow box', () => {
  for (const h of [60, 90, 120]) {
    const near = topLevelSmooth(0, 0, 0, h, 0, 100, 50, dirGain(h / 2, 45));
    const far = topLevelSmooth(0, 0, 0, h, 0, 200, 50, dirGain(h / 2, 45));
    assert.ok(Math.abs(db(far / near) + 6.0206) < 1e-6, `${h}°: −6 dB per doubling`);
  }
  // Directivity: a narrower box is louder on axis at EVERY distance by the same amount.
  const r1 = topLevelSmooth(0, 0, 0, 60, 0, 100, 50, dirGain(30, 45)) / topLevelSmooth(0, 0, 0, 120, 0, 100, 50, dirGain(60, 45));
  const r2 = topLevelSmooth(0, 0, 0, 60, 0, 400, 50, dirGain(30, 45)) / topLevelSmooth(0, 0, 0, 120, 0, 400, 50, dirGain(60, 45));
  assert.ok(r1 > 1 && Math.abs(r1 - r2) < 1e-9);
  // Aim: 0° fires straight down the plan (+y); +30° swings the beam toward +x.
  const onAxis = topLevelSmooth(0, 0, 30, 60, Math.sin(Math.PI / 6) * 100, Math.cos(Math.PI / 6) * 100, 50, 1);
  assert.ok(Math.abs(onAxis - 0.25) < 1e-9);
});

test('side plane: the off-axis angle wraps (a point just across ±180° is near the axis, not 340° off)', () => {
  const axis = (170 * Math.PI) / 180;
  const p = { x: Math.cos((-170 * Math.PI) / 180) * 100, y: Math.sin((-170 * Math.PI) / 180) * 100 };
  const g = sideLevelSmooth(0, 0, axis, 30, p.x, p.y, 100, 1);
  assert.ok(Math.abs(db(g) - db(smoothEdge(20, 30))) < 1e-6);
});

test('the colour ramp: about 20 dB from red to black (the legend says so)', () => {
  assert.equal(coverageT(10 ** (5 / 10)), 1);
  assert.equal(coverageT(10 ** (-16 / 10)), 0);
  const scr = read('src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx');
  assert.match(scr, /Red to deep blue spans about 20 dB; BLACK is below that/);
  assert.match(scr, /edges of a box’s\s+rated angle \(90°, 60°…\) are where it is already 6 dB quieter/);
});

test('side view: the field, wavefronts and beam rays are painted inside the room AIR (no ray through the floor)', () => {
  const s = body('SideCoverageView');
  assert.match(s, /Skia\.Path\.MakeFromOp\(airBox, solids, PathOp\.Difference\)/);
  const clip = s.slice(s.indexOf('<Group clip={geo.air}>'), s.indexOf('</Group>', s.indexOf('<Group clip={geo.air}>')));
  for (const part of ['heat.map', '<WavefrontRings', 'geo.wedgeFill', 'geo.axisLine', 'geo.boxBeams', 'geo.delayWedge', 'geo.rearWedge', '<AlignmentOverlay'])
    assert.ok(clip.includes(part), `${part} inside the air clip`);
  assert.match(s, /<Group clip=\{roomClip\}>/, 'nothing drawn past the room');
  // sloped seating stands on solid risers (no floating chairs)
  assert.match(s, /riser\.lineTo\(s\.x - hw, s\.y\)/);
});

test('top view: wavefronts and aim cues stay in the house; the band is house plan figures at true size', () => {
  const s = body('TopCoverageView');
  assert.match(s, /<Group clip=\{house\}>\s*<WavefrontRings[\s\S]*?<GlowStroke path=\{aims\}/);
  assert.match(s, /<Group clip=\{room\}>/);
  assert.match(s, /<BandTop cx=\{w \/ 2\}/);
  assert.match(viz, /function BandTop[\s\S]*<PlanInstrumentEdge[\s\S]*<PlanPlayerTop[\s\S]*<PlayerBehind pose=\{SINGER_TOP\} \/>/);
  // true sizes from the one shared metre
  assert.match(viz, /const COVER_MPP = 42 \/ M_HUMAN;/);
  assert.match(s, /const mainS = \(380 \* COVER_K\) \/ 23;/);
  assert.match(s, /makeChairsTop\(at\)/);
  assert.match(body('SideCoverageView'), /const MPP = COVER_MPP;/);
});

test('side view: the singer is the house PlayerFigure at a vocal stand; nothing floats', () => {
  assert.match(viz, /function SingerAtStandSide[\s\S]*<PlayerBehind pose=\{SINGER_SIDE\} \/>[\s\S]*<PlayerInFront pose=\{SINGER_SIDE\} \/>[\s\S]*<HandheldMic /);
  const s = body('SideCoverageView');
  assert.match(s, /<SingerAtStandSide lipX=\{8\} deckY=\{stageTop\} \/>/);
  assert.match(s, /rigPath\(onStand \? 'stand' : 'fly', spkX, spkY/);
  assert.match(s, /rigPath\('fly', geo\.dlyX, geo\.dlyY, dlyAxisDeg/);
  assert.match(s, /rigPath\('fly', geo\.rearX, geo\.rearY, geo\.rearAxisDeg/);
  // the delay boxes are drawn on the axes the map computes
  assert.match(s, /<CabinetSide x=\{geo\.dlyX\} y=\{geo\.dlyY\} tiltDeg=\{dlyAxisDeg\}/);
  assert.match(s, /<CabinetSide x=\{geo\.rearX\} y=\{geo\.rearY\} tiltDeg=\{geo\.rearAxisDeg\}/);
  // the rear delay hangs AHEAD of its rows and fires down the house (15–50°), never back at the stage
  assert.match(s, /const rearAxisDeg = Math\.min\(50, Math\.max\(15, /);
  // the line array's gaps never exceed a real frame's 10°
  assert.match(s, /Math\.min\(aimTop \+ 10 \* \(N - 1\)/);
});

test('the scale bar words are RN text ≥ 9 pt at every zoom', () => {
  assert.match(viz, /function ScaleBarLabel[\s\S]*const fs = Math\.max\(9, 9\.5 \* ts\);/);
  for (const v of ['TopCoverageView', 'SideCoverageView']) assert.match(body(v), /<ScaleBarLabel at=\{barLabel\} ts=\{ts\} text="5 m" \/>/);
});
